import { useState, useEffect, useMemo } from "react";
import { Pump, Priority, Stage, STAGES } from "../../types";
import { StageDurations } from "../../lib/schedule";
import { X, Edit2, Save, ChevronDown, ChevronRight, AlertTriangle } from "lucide-react";
import { Button } from "./Button";
import { Input } from "./Input";
import { format, parseISO, isValid } from "date-fns";
import { useApp } from "../../store";
import { cn } from "../../lib/utils";
import { getCatalogData } from "../../lib/seed";

interface PumpDetailModalProps {
    pump: Pump | null;
    onClose: () => void;
}

interface PumpFormData extends Pump {
    engine_model?: string | null;
    gearbox_model?: string | null;
    control_panel_model?: string | null;
    description?: string;
    total_lead_days?: number;
    fabrication_days?: number;
    powder_coat_days?: number;
    assembly_days?: number;
    testing_days?: number;
}

const PRIORITIES: Priority[] = ["Low", "Normal", "High", "Rush", "Urgent"];

export function PumpDetailModal({ pump, onClose }: PumpDetailModalProps) {
    const { updatePump, getModelLeadTimes, pumps } = useApp();
    const [isEditing, setIsEditing] = useState(false);
    const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);
    const [formData, setFormData] = useState<Pump | null>(null);

    // Data sources for dropdowns
    const catalogData = useMemo(() => getCatalogData(), []);
    const uniqueColors = useMemo(() => {
        const colors = new Set<string>();
        pumps.forEach(p => {
            if (p.powder_color) colors.add(p.powder_color);
        });
        return Array.from(colors).sort();
    }, [pumps]);

    // Initialize form data when pump opens
    useEffect(() => {
        if (pump) {
            setFormData({ ...pump });
            setIsEditing(false);
            setIsAdvancedOpen(false);
        }
    }, [pump]);

    if (!pump || !formData) return null;

    // Helper to handle input changes
    const handleChange = <K extends keyof Pump>(field: K, value: Pump[K]) => {
        setFormData(prev => prev ? ({ ...prev, [field]: value }) : null);
    };

    // Helper for nested BOM/LeadTime changes? 
    // The Pump type flattens these fields (engine_model, fabrication_days etc aren't directly on Pump type in the snippet I saw earlier, 
    // but the instructions say "Shows all data that is generated". 
    // Let's check the Pump type definition again. 
    // The seed.ts generates them, but are they on the Pump interface?
    // Looking at types.ts: Pump has: id, serial, po, customer, model, stage, priority, powder_color, last_update, value, scheduledEnd, scheduledStart.
    // It DOES NOT have engine_model, gearbox_model, etc. explicitly in the interface I saw earlier.
    // However, the seed.ts casts it: `as Pump & { engine_model?: string ... }`.
    // So they are likely stored but not strictly typed in the main interface.


    const safeFormData = formData as PumpFormData;

    const handleSave = () => {
        if (!formData) return;
        updatePump(formData.id, formData);
        setIsEditing(false);
    };

    const handleCancel = () => {
        setFormData({ ...pump });
        setIsEditing(false);
    };

    // Derived Man-Hours Calculation
    const calculateManHours = (days: number | undefined) => {
        if (!days) return 0;
        return days * 8;
    };

    // Lead times are stored on the pump object in the "extra" fields from seed.ts?
    // Actually, looking at seed.ts, it puts `total_lead_days` on the pump.
    // But `fabrication_days` etc are NOT explicitly added in seed.ts lines 181-206.
    // Wait, checking seed.ts again...
    // It adds `total_lead_days`.
    // It DOES NOT add `fabrication_days`, `assembly_days` etc. to the pump object.
    // Those are in `model.lead_times`.
    // The instructions say "Department-Specific Work Content... For each pump, the following information exists".
    // If it's not on the pump object, we might need to read it from the Catalog (via getModelLeadTimes) OR 
    // if the user edits it, we need to store it on the pump.
    // Since the requirement is to EDIT them, we must assume we want to override the catalog defaults for this specific pump.
    // So we should read from pump if exists, else fallback to catalog.

    const catalogLeadTimes = getModelLeadTimes(formData.model);

    // Helper to get a value (Pump override > Catalog default > 0)
    const getLeadTime = (field: keyof PumpFormData, catalogField: keyof StageDurations) => {
        return (safeFormData[field] as number) ?? catalogLeadTimes?.[catalogField] ?? 0;
    };

    const fabDays = getLeadTime('fabrication_days', 'fabrication');
    const pcDays = getLeadTime('powder_coat_days', 'powder_coat');
    const assemblyDays = getLeadTime('assembly_days', 'assembly');
    const testingDays = getLeadTime('testing_days', 'testing');

    // Update handler for these specific "extra" fields
    // Update handler for these specific "extra" fields
    const handleExtraChange = (field: string, value: string | number) => {
        setFormData(prev => prev ? ({ ...prev, [field]: value }) : null);
    };

    const formatDateForInput = (isoString?: string) => {
        if (!isoString) return "";
        try {
            return format(parseISO(isoString), "yyyy-MM-dd");
        } catch {
            return "";
        }
    };

    // Helper for Date Input Change
    // To fix the "0000" year issue, we should allow the input to drive the state directly if possible, 
    // but since we store ISO strings, we need to parse.
    // The issue usually happens if we re-format invalid partial dates.
    // We will only update the state if the date is valid or empty.
    const handleDateChange = (field: keyof Pump, value: string) => {
        if (!value) {
            handleChange(field, undefined);
            return;
        }
        // Check if it's a full date (YYYY-MM-DD)
        if (value.length === 10) {
            const date = new Date(value);
            if (isValid(date)) {
                handleChange(field, date.toISOString());
            }
        }
        // If partial, we might not want to update the ISO string yet to avoid "0000" jumping?
        // Actually, the input value is controlled by `formatDateForInput(formData.field)`.
        // If we don't update formData, the input will revert to the old value on re-render, preventing typing.
        // So we MUST update formData. 
        // But if we update formData with an invalid date, `formatDateForInput` returns "".
        // This clears the input.
        // Solution: We need local state for the date input value while editing, OR we accept that we only update the store on valid dates.
        // But for a controlled input, we need to reflect what the user types.
        // Since `formData` stores the actual Pump data (ISO strings), we can't store "2025-0" in it.
        // We should probably use an uncontrolled input (defaultValue) for the date fields in Edit mode, 
        // OR maintain a separate local state for the string value of the date inputs.
        // Let's try `defaultValue` approach for simplicity in this refactor, or just be careful.
        // Actually, `Input` is controlled.
        // Let's just update the ISO string. `new Date("0002-01-01").toISOString()` is valid.
        // The browser handles the typing buffer.
    };

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md animate-in fade-in duration-200"
            onClick={onClose}
        >
            <div
                className="surface-elevated shadow-frame border border-border/40 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 m-4 animate-in zoom-in-95 duration-200 bg-card"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="mb-6 flex items-start justify-between">
                    <div>
                        <h2 className="text-xl font-semibold text-foreground flex items-center gap-2">
                            Pump Details
                            <span className="text-sm font-normal text-muted-foreground">#{pump.serial}</span>
                        </h2>
                        <p className="text-sm text-muted-foreground">
                            {pump.id}
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        {isEditing ? (
                            <>
                                <Button variant="outline" size="sm" onClick={handleCancel}>
                                    Cancel
                                </Button>
                                <Button size="sm" onClick={handleSave} className="gap-2">
                                    <Save className="h-4 w-4" />
                                    Save
                                </Button>
                            </>
                        ) : (
                            <Button variant="outline" size="sm" onClick={() => setIsEditing(true)} className="gap-2">
                                <Edit2 className="h-4 w-4" />
                                Edit
                            </Button>
                        )}
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={onClose}
                            className="h-8 w-8 rounded-full hover:bg-muted"
                        >
                            <X className="h-4 w-4" />
                        </Button>
                    </div>
                </div>

                <div className="space-y-6">
                    {/* Main Section */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* PO Number - Text Input Only */}
                        <div className="space-y-1">
                            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">PO Number</label>
                            {isEditing ? (
                                <Input
                                    value={formData.po}
                                    onChange={(e) => handleChange('po', e.target.value)}
                                    className="bg-background/50"
                                />
                            ) : (
                                <p className="font-medium text-foreground">{formData.po}</p>
                            )}
                        </div>

                        {/* Customer - Datalist */}
                        <div className="space-y-1">
                            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Customer</label>
                            {isEditing ? (
                                <>
                                    <Input
                                        list="customers-list"
                                        value={formData.customer}
                                        onChange={(e) => handleChange('customer', e.target.value)}
                                        className="bg-background/50"
                                    />
                                    <datalist id="customers-list">
                                        {catalogData.customers.map(c => <option key={c} value={c} />)}
                                    </datalist>
                                </>
                            ) : (
                                <p className="font-medium text-foreground">{formData.customer}</p>
                            )}
                        </div>

                        {/* Model - Datalist */}
                        <div className="space-y-1">
                            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Model</label>
                            {isEditing ? (
                                <>
                                    <Input
                                        list="models-list"
                                        value={formData.model}
                                        onChange={(e) => handleChange('model', e.target.value)}
                                        className="bg-background/50"
                                    />
                                    <datalist id="models-list">
                                        {catalogData.models.map(m => <option key={m.model} value={m.model} />)}
                                    </datalist>
                                </>
                            ) : (
                                <p className="font-medium text-foreground">{formData.model}</p>
                            )}
                        </div>

                        {/* Stage - Select (Fixed list) */}
                        <div className="space-y-1">
                            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Stage</label>
                            {isEditing ? (
                                <select
                                    className="flex h-10 w-full rounded-lg border border-white/12 bg-background/50 px-3 py-2 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 text-foreground"
                                    value={formData.stage}
                                    onChange={(e) => handleChange('stage', e.target.value as Stage)}
                                >
                                    {STAGES.map(s => <option key={s} value={s} className="bg-card text-foreground">{s}</option>)}
                                </select>
                            ) : (
                                <span className="inline-flex items-center rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-foreground">
                                    {formData.stage}
                                </span>
                            )}
                        </div>

                        {/* Priority - Datalist */}
                        <div className="space-y-1">
                            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Priority</label>
                            {isEditing ? (
                                <>
                                    <Input
                                        list="priorities-list"
                                        value={formData.priority}
                                        onChange={(e) => handleChange('priority', e.target.value as Priority)}
                                        className="bg-background/50"
                                    />
                                    <datalist id="priorities-list">
                                        {PRIORITIES.map(p => <option key={p} value={p} />)}
                                    </datalist>
                                </>
                            ) : (
                                <span className={cn(
                                    "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
                                    formData.priority === "Urgent" || formData.priority === "Rush" ? "bg-rose-500/15 text-rose-600" :
                                        formData.priority === "High" ? "bg-orange-500/15 text-orange-600" :
                                            "bg-muted text-muted-foreground"
                                )}>
                                    {formData.priority}
                                </span>
                            )}
                        </div>

                        {/* Powder Color - Datalist */}
                        <div className="space-y-1">
                            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Powder Color</label>
                            {isEditing ? (
                                <>
                                    <Input
                                        list="colors-list"
                                        value={formData.powder_color || ''}
                                        onChange={(e) => handleChange('powder_color', e.target.value)}
                                        className="bg-background/50"
                                    />
                                    <datalist id="colors-list">
                                        {uniqueColors.map(c => <option key={c} value={c} />)}
                                    </datalist>
                                </>
                            ) : (
                                <div className="flex items-center gap-2">
                                    {formData.powder_color && <div className="h-3 w-3 rounded-full border border-border bg-current text-muted-foreground" />}
                                    <p className="font-medium text-foreground">{formData.powder_color || 'N/A'}</p>
                                </div>
                            )}
                        </div>

                        {/* Scheduled Start - Date */}
                        <div className="space-y-1">
                            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Scheduled Start</label>
                            {isEditing ? (
                                <Input
                                    type="date"
                                    value={formatDateForInput(formData.scheduledStart)}
                                    onChange={(e) => handleDateChange('scheduledStart', e.target.value)}
                                    className="bg-background/50"
                                />
                            ) : (
                                <p className="font-medium text-foreground">
                                    {formData.scheduledStart ? format(parseISO(formData.scheduledStart), "MMM d, yyyy") : '-'}
                                </p>
                            )}
                        </div>

                        {/* Scheduled End - Date */}
                        <div className="space-y-1">
                            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Scheduled End</label>
                            {isEditing ? (
                                <Input
                                    type="date"
                                    value={formatDateForInput(formData.scheduledEnd)}
                                    onChange={(e) => handleDateChange('scheduledEnd', e.target.value)}
                                    className="bg-background/50"
                                />
                            ) : (
                                <p className="font-medium text-foreground">
                                    {formData.scheduledEnd ? format(parseISO(formData.scheduledEnd), "MMM d, yyyy") : '-'}
                                </p>
                            )}
                        </div>
                    </div>

                    {/* Default Applied Fields Section */}
                    <div className="rounded-xl border border-border/40 bg-card/30 overflow-hidden">
                        <button
                            onClick={() => setIsAdvancedOpen(!isAdvancedOpen)}
                            className="w-full flex items-center justify-between p-4 hover:bg-muted/50 transition-colors text-left"
                        >
                            <div className="flex items-center gap-2">
                                {isAdvancedOpen ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
                                <span className="font-medium text-sm text-foreground">Default Applied Fields</span>
                            </div>
                            {isEditing && <div className="flex items-center gap-1 text-amber-500 text-xs">
                                <AlertTriangle className="h-3 w-3" />
                                Edit With Caution
                            </div>}
                        </button>

                        {isAdvancedOpen && (
                            <div className="p-4 pt-0 space-y-4 border-t border-border/40">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                                    <div className="space-y-1">
                                        <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Value ($)</label>
                                        {isEditing ? (
                                            <Input
                                                type="number"
                                                value={formData.value}
                                                onChange={(e) => handleChange('value', parseFloat(e.target.value))}
                                                className="bg-background/50"
                                            />
                                        ) : (
                                            <p className="font-medium text-foreground">${formData.value?.toLocaleString()}</p>
                                        )}
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Total Lead Days</label>
                                        {isEditing ? (
                                            <Input
                                                type="number"
                                                value={safeFormData.total_lead_days || 0}
                                                onChange={(e) => handleExtraChange('total_lead_days', parseFloat(e.target.value))}
                                                className="bg-background/50"
                                            />
                                        ) : (
                                            <p className="font-medium text-foreground">{safeFormData.total_lead_days || '-'}</p>
                                        )}
                                    </div>
                                </div>

                                <div className="space-y-1">
                                    <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Description</label>
                                    {isEditing ? (
                                        <Input
                                            value={safeFormData.description || ''}
                                            onChange={(e) => handleExtraChange('description', e.target.value)}
                                            className="bg-background/50"
                                        />
                                    ) : (
                                        <p className="font-medium text-foreground">{safeFormData.description || '-'}</p>
                                    )}
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div className="space-y-1">
                                        <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Engine</label>
                                        {isEditing ? (
                                            <Input
                                                value={safeFormData.engine_model || ''}
                                                onChange={(e) => handleExtraChange('engine_model', e.target.value)}
                                                className="bg-background/50"
                                            />
                                        ) : (
                                            <p className="font-medium text-foreground">{safeFormData.engine_model || '-'}</p>
                                        )}
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Gearbox</label>
                                        {isEditing ? (
                                            <Input
                                                value={safeFormData.gearbox_model || ''}
                                                onChange={(e) => handleExtraChange('gearbox_model', e.target.value)}
                                                className="bg-background/50"
                                            />
                                        ) : (
                                            <p className="font-medium text-foreground">{safeFormData.gearbox_model || '-'}</p>
                                        )}
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Control Panel</label>
                                        {isEditing ? (
                                            <Input
                                                value={safeFormData.control_panel_model || ''}
                                                onChange={(e) => handleExtraChange('control_panel_model', e.target.value)}
                                                className="bg-background/50"
                                            />
                                        ) : (
                                            <p className="font-medium text-foreground">{safeFormData.control_panel_model || '-'}</p>
                                        )}
                                    </div>
                                </div>

                                <div className="border-t border-border/40 pt-4 mt-4">
                                    <h4 className="text-sm font-medium mb-3">Department Work Content</h4>
                                    <div className="grid grid-cols-1 gap-3">
                                        {[
                                            { label: 'Fabrication', days: fabDays, key: 'fabrication_days' },
                                            { label: 'Powder Coat', days: pcDays, key: 'powder_coat_days' },
                                            { label: 'Assembly', days: assemblyDays, key: 'assembly_days' },
                                            { label: 'Testing', days: testingDays, key: 'testing_days' },
                                        ].map((dept) => (
                                            <div key={dept.key} className="grid grid-cols-12 gap-4 items-center">
                                                <div className="col-span-4 text-sm text-muted-foreground">{dept.label}</div>
                                                <div className="col-span-3">
                                                    {isEditing ? (
                                                        <div className="flex items-center gap-1">
                                                            <Input
                                                                type="number"
                                                                step="0.1"
                                                                className="h-8 text-right bg-background/50"
                                                                value={dept.days}
                                                                onChange={(e) => handleExtraChange(dept.key, parseFloat(e.target.value))}
                                                            />
                                                            <span className="text-xs text-muted-foreground">days</span>
                                                        </div>
                                                    ) : (
                                                        <span className="font-medium text-foreground">{dept.days} days</span>
                                                    )}
                                                </div>
                                                <div className="col-span-5 text-xs text-muted-foreground text-right">
                                                    ({calculateManHours(dept.days).toFixed(1)} man-hours)
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="text-xs text-muted-foreground text-right">
                        Last Updated: {format(new Date(pump.last_update), "EEE, MMM d, yyyy 'at' h:mm a")}
                    </div>
                </div>
            </div>
        </div>
    );
}
