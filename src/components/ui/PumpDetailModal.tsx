import { useState, useEffect, useMemo } from "react";
import { Pump, Priority, Stage, STAGES } from "../../types";
import { StageDurations } from "../../lib/schedule";
import { X, Edit2, Save, ChevronDown, ChevronRight, AlertTriangle, Pause, Play } from "lucide-react";
import { Button } from "./Button";
import { Input } from "./Input";
import { format, parseISO, isValid } from "date-fns";
import { useApp } from "../../store";
import { cn } from "../../lib/utils";
import { getCatalogData } from "../../lib/seed";
import { buildStageTimeline, StageBlock } from "../../lib/schedule";

// Constitution §2.1: Canonical production stages for progress bar
const PROGRESS_STAGES: Stage[] = [
    "FABRICATION",
    "STAGED_FOR_POWDER",
    "POWDER_COAT",
    "ASSEMBLY",
    "SHIP",
];

// Constitution §2.1: Stage colors for progress bar
const STAGE_BAR_COLORS: Record<Stage, string> = {
    QUEUE: "from-slate-600 to-slate-400",
    FABRICATION: "from-blue-600 to-blue-400",
    STAGED_FOR_POWDER: "from-cyan-600 to-cyan-400",
    POWDER_COAT: "from-purple-600 to-purple-400",
    ASSEMBLY: "from-amber-600 to-amber-400",
    SHIP: "from-emerald-600 to-emerald-400",
    CLOSED: "from-green-600 to-green-400",
};

function TimelineProgress({ pump, blocks }: { pump: Pump, blocks: StageBlock[] }) {
    if (!blocks || blocks.length === 0) return null;

    const currentStage = pump.stage;
    const now = new Date();

    return (
        <div className="space-y-6 mb-8 mt-2">
            <div className="relative flex w-full h-12 rounded-xl overflow-visible bg-muted/10 border border-white/5 p-1">
                {PROGRESS_STAGES.map((stage, idx) => {
                    const block = blocks.find(b => b.stage === stage);
                    const stageIndex = PROGRESS_STAGES.indexOf(stage);
                    const currentStageIndex = PROGRESS_STAGES.indexOf(currentStage);

                    let fillWidth = "0%";
                    let isCompleted = false;
                    let isCurrent = false;

                    if (currentStage === "CLOSED") {
                        fillWidth = "100%";
                        isCompleted = true;
                    } else if (stageIndex < currentStageIndex) {
                        fillWidth = "100%";
                        isCompleted = true;
                    } else if (stageIndex === currentStageIndex) {
                        isCurrent = true;
                        if (block) {
                            const total = block.end.getTime() - block.start.getTime();
                            const elapsed = now.getTime() - block.start.getTime();
                            const pct = Math.min(100, Math.max(0, (elapsed / total) * 100));
                            fillWidth = `${pct}%`;
                        } else {
                            fillWidth = "30%";
                        }
                    }

                    return (
                        <div key={stage} className="relative flex-1 group">
                            {/* The Track Segment */}
                            <div className="absolute inset-0 mx-[1px] bg-white/5 rounded-md overflow-hidden">
                                {/* Fill */}
                                <div
                                    className={cn(
                                        "h-full transition-all duration-1000",
                                        isCompleted ? `bg-gradient-to-r ${STAGE_BAR_COLORS[stage]}` :
                                            isCurrent ? `bg-gradient-to-r ${STAGE_BAR_COLORS[stage]} animate-pulse` :
                                                "bg-transparent"
                                    )}
                                    style={{ width: fillWidth }}
                                />
                                {isCurrent && (
                                    <div
                                        className={cn(
                                            "absolute inset-0 bg-gradient-to-r opacity-10",
                                            STAGE_BAR_COLORS[stage]
                                        )}
                                    />
                                )}
                            </div>

                            {/* Label */}
                            <div className="relative z-10 flex items-center justify-center h-full">
                                <span className={cn(
                                    "text-[10px] font-bold uppercase tracking-widest transition-all",
                                    (isCompleted || isCurrent) ? "text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.5)]" : "text-muted-foreground/40"
                                )}>
                                    {stage === "POWDER_COAT" ? "POWDER" : stage}
                                </span>
                            </div>

                            {/* Divider Dates - Sitting above the line */}
                            {block && (
                                <>
                                    <div className="absolute -top-6 -left-2 text-[9px] text-muted-foreground/80 font-semibold tracking-tighter">
                                        {format(block.start, "MMM d")}
                                    </div>
                                    {idx === PROGRESS_STAGES.length - 1 && (
                                        <div className="absolute -top-6 -right-2 text-[9px] text-muted-foreground/80 font-semibold tracking-tighter">
                                            {format(block.end, "MMM d")}
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

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
    const { updatePump, getModelLeadTimes, pumps, pausePump, resumePump, capacityConfig } = useApp();

    // Get live pump data from store (prop may be stale)
    const currentPump = useMemo((): Pump | null => {
        if (!pump) return null;
        return pumps.find(p => p.id === pump.id) ?? pump;
    }, [pump, pumps]);

    const [isEditing, setIsEditing] = useState(false);
    const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);
    const [formData, setFormData] = useState<Pump | null>(null);

    // Data sources for dropdowns
    const catalogData = useMemo(() => getCatalogData(), []);

    // Initialize form data when pump opens
    useEffect(() => {
        if (currentPump) {
            setFormData({ ...currentPump });
            setIsEditing(false);
            setIsAdvancedOpen(false);
        }
    }, [currentPump?.id]); // Only reset when opening a different pump

    if (!currentPump || !formData) return null;

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
        if (currentPump) setFormData({ ...currentPump });
        setIsEditing(false);
    };

    // Constitution §2.1: ship replaces testing/shipping
    const calculateManHours = (days: number | undefined, stage: 'fabrication' | 'assembly' | 'ship') => {
        if (!days) return 0;
        const stageConfig = capacityConfig[stage];
        const dailyManHours = stageConfig?.dailyManHours ?? 8;
        return Math.round(days * dailyManHours * 10) / 10; // Round to 1 decimal
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
    const testingDays = getLeadTime('testing_days', 'ship');  // Constitution §2.1: ship replaces testing

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
                className={cn(
                    "relative border-border rounded-2xl w-full max-w-3xl max-h-[95vh] overflow-y-auto m-4 animate-in zoom-in-95 duration-200",
                    "bg-background/80 backdrop-blur-xl border border-white/10 shadow-[0_0_50px_rgba(0,0,0,0.5),0_0_20px_rgba(34,211,238,0.1)]",
                    currentPump.isPaused && "grayscale-[50%]"
                )}
                onClick={(e) => e.stopPropagation()}
            >
                {/* PAUSED stamp - large rubber stamp style */}
                {currentPump.isPaused && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-50 overflow-visible">
                        <div
                            className="border-[5px] border-red-600 rounded-md px-6 py-2 opacity-80 select-none bg-white/20 dark:bg-black/10 backdrop-blur-sm"
                            style={{
                                transform: 'rotate(-22deg) scale(2)',
                            }}
                        >
                            <span
                                className="text-red-600 font-black text-4xl tracking-[0.15em] uppercase"
                                style={{
                                    fontFamily: 'Impact, Haettenschweiler, sans-serif',
                                }}
                            >
                                PAUSED
                            </span>
                        </div>
                    </div>
                )}
                {/* Main Modal Surface */}
                <div className="p-8">
                    {/* Header */}
                    <div className="mb-4 flex items-center justify-between relative z-10 border-b border-white/5 pb-4">
                        <div>
                            <h2 className="text-2xl font-bold text-foreground flex items-center gap-3 tracking-tight">
                                Pump Details
                                <span className="text-blue-400 font-mono text-lg ml-2">#{currentPump.serial}</span>
                            </h2>
                        </div>
                        <div className="flex items-center gap-2">
                            {/* Pause/Resume button - small, sharp corners, left of Edit */}
                            {currentPump.stage !== 'QUEUE' && currentPump.stage !== 'CLOSED' && (
                                currentPump.isPaused ? (
                                    <button
                                        onClick={() => resumePump(currentPump.id)}
                                        className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-bold rounded-sm bg-emerald-600 hover:bg-emerald-500 text-white transition-colors shadow-sm"
                                        title="Resume Production"
                                    >
                                        <Play className="h-3.5 w-3.5" />
                                        Resume
                                    </button>
                                ) : (
                                    <button
                                        onClick={() => pausePump(currentPump.id)}
                                        className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold rounded-sm border border-orange-400 text-orange-600 hover:bg-orange-100 dark:hover:bg-orange-900/30 transition-colors"
                                        title="Pause Production"
                                    >
                                        <Pause className="h-3.5 w-3.5" />
                                        Pause
                                    </button>
                                )
                            )}

                            {isEditing ? (
                                <>
                                    <Button variant="outline" size="sm" onClick={handleCancel} className="font-semibold">
                                        Cancel
                                    </Button>
                                    <Button size="sm" onClick={handleSave} className="gap-2 font-semibold bg-blue-600 hover:bg-blue-500 text-white shadow-md hover:shadow-blue-500/25">
                                        <Save className="h-4 w-4" />
                                        Save
                                    </Button>
                                </>
                            ) : (
                                <Button
                                    size="sm"
                                    onClick={() => setIsEditing(true)}
                                    className="gap-2 font-semibold bg-blue-600 hover:bg-blue-500 text-white shadow-md hover:shadow-lg hover:shadow-blue-500/25 transition-all"
                                >
                                    <Edit2 className="h-4 w-4" />
                                    Edit
                                </Button>
                            )}

                            {/* Exit button - visible in both modes */}
                            <button
                                onClick={onClose}
                                className="h-8 w-8 rounded-full flex items-center justify-center bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-600 dark:text-gray-300 transition-colors"
                                title="Close"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        </div>
                    </div>

                    {/* Paused info banner - only show when paused */}
                    {currentPump.isPaused && currentPump.pausedAt && (
                        <div className="mb-4 px-3 py-2 bg-orange-100 dark:bg-orange-900/30 border border-orange-300 dark:border-orange-700 rounded-lg text-center text-sm text-orange-700 dark:text-orange-400 relative z-10">
                            Paused since {format(parseISO(currentPump.pausedAt), "MMM d, yyyy 'at' h:mm a")}
                            {currentPump.totalPausedDays !== undefined && currentPump.totalPausedDays > 0 && (
                                <span className="font-bold"> ({currentPump.totalPausedDays} days total)</span>
                            )}
                        </div>
                    )}

                    <div className="space-y-10 relative z-10">
                        {/* TOP TIMELINE MOVED FROM BOTTOM */}
                        <div className="relative pt-6 px-1">
                            <TimelineProgress
                                pump={currentPump}
                                blocks={buildStageTimeline(currentPump, catalogLeadTimes || { fabrication: 0, powder_coat: 0, assembly: 0, ship: 0 }, { capacityConfig })}
                            />
                        </div>

                        {/* Groups Section */}
                        <div className="grid grid-cols-1 md:grid-cols-[1fr_2px_1fr] gap-x-12 gap-y-12 items-stretch relative">
                            {/* Group 1: Stable Order Info */}
                            <div className="space-y-3 flex flex-col h-full">
                                <h3 className="text-[13px] font-black text-blue-400/90 uppercase tracking-[0.3em] mb-4 pl-1 min-h-[20px]">Order Information</h3>

                                <div className="flex items-center justify-between px-3 py-3 bg-white/5 border border-white/5 rounded-xl group hover:bg-white/[0.08] transition-all flex-1">
                                    <label className="text-[11px] font-black text-muted-foreground/70 uppercase tracking-widest">PO Number</label>
                                    <div className="text-right w-1/2">
                                        {isEditing ? (
                                            <Input
                                                value={formData.po}
                                                onChange={(e) => handleChange('po', e.target.value)}
                                                className="bg-background/40 h-8 text-right border-blue-500/20 focus:border-blue-500/50 text-sm"
                                            />
                                        ) : (
                                            <p className="font-bold text-foreground tracking-tight text-base">{formData.po}</p>
                                        )}
                                    </div>
                                </div>

                                <div className="flex items-center justify-between px-3 py-3 bg-white/5 border border-white/5 rounded-xl group hover:bg-white/[0.08] transition-all flex-1">
                                    <label className="text-[11px] font-black text-muted-foreground/70 uppercase tracking-widest">Customer</label>
                                    <div className="text-right w-1/2">
                                        {isEditing ? (
                                            <>
                                                <Input
                                                    list="customers-list"
                                                    value={formData.customer}
                                                    onChange={(e) => handleChange('customer', e.target.value)}
                                                    className="bg-background/40 h-8 text-right border-blue-500/20 text-sm"
                                                />
                                                <datalist id="customers-list">
                                                    {catalogData.customers.map(c => <option key={c} value={c} />)}
                                                </datalist>
                                            </>
                                        ) : (
                                            <p className="font-bold text-foreground tracking-tight text-base">{formData.customer}</p>
                                        )}
                                    </div>
                                </div>

                                <div className="flex items-center justify-between px-3 py-3 bg-white/5 border border-white/5 rounded-xl group hover:bg-white/[0.08] transition-all flex-1">
                                    <label className="text-[11px] font-black text-muted-foreground/70 uppercase tracking-widest">Model</label>
                                    <div className="text-right w-1/2">
                                        {isEditing ? (
                                            <>
                                                <Input
                                                    list="models-list"
                                                    value={formData.model}
                                                    onChange={(e) => handleChange('model', e.target.value)}
                                                    className="bg-background/40 h-8 text-right border-blue-500/20 text-sm"
                                                />
                                                <datalist id="models-list">
                                                    {catalogData.models.map(m => <option key={m.model} value={m.model} />)}
                                                </datalist>
                                            </>
                                        ) : (
                                            <p className="font-bold text-foreground tracking-tight text-base">{formData.model}</p>
                                        )}
                                    </div>
                                </div>

                                <div className="flex items-center justify-between px-3 py-3 bg-white/5 border border-white/5 rounded-xl group hover:bg-white/[0.08] transition-all flex-1">
                                    <label className="text-[11px] font-black text-muted-foreground/70 uppercase tracking-widest">Color</label>
                                    <div className="text-right w-1/2 flex justify-end items-center gap-3">
                                        {isEditing ? (
                                            <Input
                                                list="colors-list"
                                                value={formData.powder_color || ''}
                                                onChange={(e) => handleChange('powder_color', e.target.value)}
                                                className="bg-background/40 h-8 text-right border-blue-500/20 text-sm"
                                            />
                                        ) : (
                                            <>
                                                <span
                                                    className="h-2.5 w-8 rounded-full shadow-[0_0_12px_rgba(255,255,255,0.1)] transition-transform group-hover:scale-110"
                                                    style={{ backgroundColor: formData.powder_color || "hsl(var(--border))" }}
                                                />
                                                <p className="font-bold text-foreground tracking-tight text-base">{formData.powder_color || 'N/A'}</p>
                                            </>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Column Divider */}
                            <div className="hidden md:block w-[1px] h-full bg-white/10 self-stretch mx-auto" />

                            {/* Group 2: Status & Identity (Frequently Edited) */}
                            <div className="space-y-3 flex flex-col h-full">
                                <h3 className="text-[13px] font-black text-emerald-400/90 uppercase tracking-[0.3em] mb-4 pl-1 min-h-[20px]">Production Status</h3>

                                <div className="flex items-center justify-between px-3 py-3 bg-white/5 border border-white/5 rounded-xl group hover:bg-white/[0.08] transition-all flex-1">
                                    <label className="text-[11px] font-black text-muted-foreground/70 uppercase tracking-widest">Serial #</label>
                                    <div className="text-right w-1/2">
                                        {isEditing ? (
                                            <Input
                                                type="number"
                                                value={formData.serial}
                                                onChange={(e) => handleChange('serial', parseInt(e.target.value) || 0)}
                                                className="bg-background/40 h-8 text-right border-emerald-500/20 focus:border-emerald-500/50 text-sm"
                                            />
                                        ) : (
                                            <p className="font-bold text-foreground tracking-tight text-base">#{formData.serial}</p>
                                        )}
                                    </div>
                                </div>

                                {/* Un-stacked Stage & Priority */}
                                <div className="flex items-center justify-between px-3 py-3 bg-white/5 border border-white/5 rounded-xl group hover:bg-white/[0.08] transition-all flex-1">
                                    <label className="text-[11px] font-black text-muted-foreground/70 uppercase tracking-widest">Stage</label>
                                    <div className="text-right">
                                        {isEditing ? (
                                            <div className="flex items-center gap-2">
                                                <select
                                                    className="h-8 rounded-md border border-white/10 bg-background/40 px-2 text-xs shadow-sm transition-colors text-foreground text-right"
                                                    value={formData.stage}
                                                    onChange={(e) => handleChange('stage', e.target.value as Stage)}
                                                >
                                                    {STAGES.map(s => <option key={s} value={s}>{s}</option>)}
                                                </select>
                                                <select
                                                    className="h-8 rounded-md border border-white/10 bg-background/40 px-2 text-xs shadow-sm transition-colors text-foreground text-right"
                                                    value={formData.priority}
                                                    onChange={(e) => handleChange('priority', e.target.value as Priority)}
                                                >
                                                    {PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}
                                                </select>
                                            </div>
                                        ) : (
                                            <div className="flex items-center gap-3">
                                                <div className="text-base font-bold text-foreground tracking-tight">{formData.stage}</div>
                                                <span className={cn(
                                                    "rounded px-2.2 py-0.5 text-[10px] font-black uppercase tracking-[0.15em] bg-current-color/10 border border-current-color/20",
                                                    formData.priority === "Urgent" || formData.priority === "Rush" ? "text-rose-500 bg-rose-500/10 border-rose-500/30 shadow-[0_0_10px_rgba(244,63,94,0.15)]" :
                                                        formData.priority === "High" ? "text-orange-500 bg-orange-500/10 border-orange-500/30 shadow-[0_0_10px_rgba(249,115,22,0.15)]" :
                                                            "text-muted-foreground/60 bg-muted/20 border-white/5"
                                                )}>
                                                    {formData.priority}
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="flex items-center justify-between px-3 py-3 bg-white/5 border border-white/5 rounded-xl group hover:bg-white/[0.08] transition-all flex-1">
                                    <label className="text-[11px] font-black text-muted-foreground/70 uppercase tracking-widest">Est. Start</label>
                                    <div className="text-right w-1/2">
                                        {isEditing ? (
                                            <Input
                                                type="date"
                                                value={formatDateForInput(formData.scheduledStart)}
                                                onChange={(e) => handleDateChange('scheduledStart', e.target.value)}
                                                className="bg-background/40 h-8 text-right border-emerald-500/20 text-sm"
                                            />
                                        ) : (
                                            <p className="font-bold text-foreground tracking-tight text-base">
                                                {formData.scheduledStart ? format(parseISO(formData.scheduledStart), "MMM d, yyyy") : '-'}
                                            </p>
                                        )}
                                    </div>
                                </div>

                                <div className="flex items-center justify-between px-3 py-3 bg-white/5 border border-white/5 rounded-xl group hover:bg-white/[0.08] transition-all flex-1">
                                    <label className="text-[11px] font-black text-muted-foreground/70 uppercase tracking-widest">Est. Ship</label>
                                    <div className="text-right w-1/2">
                                        {isEditing ? (
                                            <Input
                                                type="date"
                                                value={formatDateForInput(formData.scheduledEnd)}
                                                onChange={(e) => handleDateChange('scheduledEnd', e.target.value)}
                                                className="bg-background/40 h-8 text-right border-emerald-500/20 text-sm"
                                            />
                                        ) : (
                                            <p className="font-bold text-foreground tracking-tight text-base">
                                                {formData.scheduledEnd ? format(parseISO(formData.scheduledEnd), "MMM d, yyyy") : '-'}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Model Defaults Section */}
                        <div className="rounded-xl border border-white/10 bg-white/5 overflow-hidden shadow-inner backdrop-blur-sm">
                            <button
                                onClick={() => setIsAdvancedOpen(!isAdvancedOpen)}
                                className="w-full flex items-center justify-between p-4 hover:bg-white/5 transition-colors text-left"
                            >
                                <div className="flex items-center gap-2">
                                    {isAdvancedOpen ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
                                    <span className="font-bold text-[11px] text-muted-foreground uppercase tracking-[0.2em] ml-1">Model Defaults</span>
                                </div>
                                {isEditing && <div className="flex items-center gap-1 text-amber-500 text-[10px] font-bold uppercase tracking-wider">
                                    <AlertTriangle className="h-3 w-3" />
                                    Edit with Caution
                                </div>}
                            </button>

                            {isAdvancedOpen && (
                                <div className="p-6 pt-0 space-y-4 border-t border-white/5 animate-in slide-in-from-top-2 duration-300">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-4 mt-6">
                                        <div className="flex items-center justify-between py-2 border-b border-white/5">
                                            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Value ($)</label>
                                            <div className="text-right">
                                                {isEditing ? (
                                                    <Input
                                                        type="number"
                                                        value={formData.value}
                                                        onChange={(e) => handleChange('value', parseFloat(e.target.value))}
                                                        className="bg-background/40 h-8 text-right"
                                                    />
                                                ) : (
                                                    <p className="font-bold text-foreground">${formData.value?.toLocaleString()}</p>
                                                )}
                                            </div>
                                        </div>
                                        <div className="flex items-center justify-between py-2 border-b border-white/5">
                                            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Lead Days</label>
                                            <div className="text-right">
                                                {isEditing ? (
                                                    <Input
                                                        type="number"
                                                        value={safeFormData.total_lead_days || 0}
                                                        onChange={(e) => handleExtraChange('total_lead_days', parseFloat(e.target.value))}
                                                        className="bg-background/40 h-8 text-right"
                                                    />
                                                ) : (
                                                    <p className="font-bold text-foreground">{safeFormData.total_lead_days || '-'}</p>
                                                )}
                                            </div>
                                        </div>

                                        <div className="flex items-center justify-between py-2 border-b border-white/5 col-span-full">
                                            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Description</label>
                                            <div className="text-right w-2/3">
                                                {isEditing ? (
                                                    <Input
                                                        value={safeFormData.description || ''}
                                                        onChange={(e) => handleExtraChange('description', e.target.value)}
                                                        className="bg-background/40 h-8 text-right"
                                                    />
                                                ) : (
                                                    <p className="font-semibold text-foreground truncate">{safeFormData.description || '-'}</p>
                                                )}
                                            </div>
                                        </div>

                                        <div className="flex items-center justify-between py-2 border-b border-white/5">
                                            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Engine</label>
                                            <div className="text-right">
                                                {isEditing ? (
                                                    <Input
                                                        value={safeFormData.engine_model || ''}
                                                        onChange={(e) => handleExtraChange('engine_model', e.target.value)}
                                                        className="bg-background/40 h-8 text-right"
                                                    />
                                                ) : (
                                                    <p className="font-semibold text-foreground">{safeFormData.engine_model || '-'}</p>
                                                )}
                                            </div>
                                        </div>
                                        <div className="flex items-center justify-between py-2 border-b border-white/5">
                                            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Gearbox</label>
                                            <div className="text-right">
                                                {isEditing ? (
                                                    <Input
                                                        value={safeFormData.gearbox_model || ''}
                                                        onChange={(e) => handleExtraChange('gearbox_model', e.target.value)}
                                                        className="bg-background/40 h-8 text-right"
                                                    />
                                                ) : (
                                                    <p className="font-semibold text-foreground">{safeFormData.gearbox_model || '-'}</p>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="mt-8">
                                        <h4 className="text-[10px] font-black text-blue-400/60 uppercase tracking-[0.2em] mb-4">Department Work Content</h4>
                                        <div className="space-y-1">
                                            {[
                                                { label: 'Fabrication', days: fabDays, key: 'fabrication_days', stage: 'fabrication' as const },
                                                { label: 'Powder Coat', days: pcDays, key: 'powder_coat_days', stage: null },
                                                { label: 'Assembly', days: assemblyDays, key: 'assembly_days', stage: 'assembly' as const },
                                                { label: 'Testing/Ship', days: testingDays, key: 'testing_days', stage: 'ship' as const },
                                            ].map((dept) => (
                                                <div key={dept.key} className="flex items-center justify-between py-2 border-b border-white/5 group hover:bg-white/5 transition-colors px-2 rounded">
                                                    <div className="text-xs font-medium text-muted-foreground uppercase">{dept.label}</div>
                                                    <div className="flex items-center gap-6">
                                                        <div className="text-right">
                                                            {isEditing ? (
                                                                <div className="flex items-center gap-1">
                                                                    <Input
                                                                        type="number"
                                                                        step="0.1"
                                                                        className="h-7 w-16 text-right bg-background/40 text-xs"
                                                                        value={dept.days}
                                                                        onChange={(e) => handleExtraChange(dept.key, parseFloat(e.target.value))}
                                                                    />
                                                                    <span className="text-[10px] text-muted-foreground uppercase font-bold">d</span>
                                                                </div>
                                                            ) : (
                                                                <span className="font-bold text-foreground text-sm">{dept.days}<span className="text-[10px] ml-0.5 text-muted-foreground">D</span></span>
                                                            )}
                                                        </div>
                                                        <div className="w-24 text-[10px] font-mono text-muted-foreground/60 text-right">
                                                            {dept.stage ? `${calculateManHours(dept.days, dept.stage)}H` : 'VENDOR'}
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="flex items-center justify-between pt-4 border-t border-white/5 text-[9px] font-black text-muted-foreground/30 uppercase tracking-[0.2em]">
                            <span>System ID: {currentPump.id.split('-')[0]}</span>
                            <span>Last Updated: {format(new Date(currentPump.last_update), "MMM d, h:mm a")}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
