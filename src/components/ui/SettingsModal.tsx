import { X, Settings, RotateCcw, Save } from "lucide-react";
import { Button } from "./Button";
import { useApp } from "../../store";
import { toast } from "sonner";
import { MilestoneManager } from "./MilestoneManager";

interface SettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
    const { capacityConfig, updateDepartmentStaffing, updatePowderCoatVendor, resetCapacityDefaults } = useApp();

    if (!isOpen) return null;

    const handleReset = () => {
        if (confirm("Are you sure you want to reset all capacity settings to default?")) {
            resetCapacityDefaults();
            toast.success("Capacity settings reset to defaults");
        }
    };

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md animate-in fade-in duration-200"
            onClick={onClose}
        >
            <div
                className="surface-elevated shadow-frame border border-border/40 rounded-2xl w-full max-w-2xl p-6 m-4 max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-200"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="mb-6 flex items-center justify-between border-b border-border/40 pb-4">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                            <Settings className="h-5 w-5" />
                        </div>
                        <div>
                            <h2 className="text-xl font-semibold text-foreground">
                                System Settings
                            </h2>
                            <p className="text-sm text-muted-foreground">
                                Configure capacity and production parameters
                            </p>
                        </div>
                    </div>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={onClose}
                        className="h-8 w-8 rounded-full hover:bg-muted"
                    >
                        <X className="h-4 w-4" />
                    </Button>
                </div>

                <div className="space-y-8">
                    {/* Department Staffing Section */}
                    <section>
                        <div className="mb-4 flex items-center justify-between">
                            <h3 className="text-lg font-medium text-foreground">
                                Department Staffing
                            </h3>
                            <p className="text-xs text-muted-foreground">
                                Staff count affects weekly capacity
                            </p>
                        </div>

                        <div className="grid gap-4 sm:grid-cols-2">
                            {/* Fabrication */}
                            <div className="rounded-xl border border-border/40 bg-card/50 p-4">
                                <div className="mb-3 flex items-center justify-between">
                                    <span className="font-medium text-foreground">Fabrication</span>
                                    <span className="rounded-full bg-blue-500/10 px-2 py-0.5 text-xs font-medium text-blue-500">
                                        ~4 days/pump
                                    </span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <label className="text-sm text-muted-foreground">Employees</label>
                                    <input
                                        type="number"
                                        min="1"
                                        max="20"
                                        className="h-8 w-20 rounded-md border border-border bg-background px-2 text-center text-sm"
                                        value={capacityConfig.fabrication.employeeCount}
                                        onChange={(e) => updateDepartmentStaffing("fabrication", {
                                            ...capacityConfig.fabrication,
                                            employeeCount: parseInt(e.target.value) || 1
                                        })}
                                    />
                                </div>
                            </div>

                            {/* Assembly */}
                            <div className="rounded-xl border border-border/40 bg-card/50 p-4">
                                <div className="mb-3 flex items-center justify-between">
                                    <span className="font-medium text-foreground">Assembly</span>
                                    <span className="rounded-full bg-purple-500/10 px-2 py-0.5 text-xs font-medium text-purple-500">
                                        ~2 days/pump
                                    </span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <label className="text-sm text-muted-foreground">Employees</label>
                                    <input
                                        type="number"
                                        min="1"
                                        max="20"
                                        className="h-8 w-20 rounded-md border border-border bg-background px-2 text-center text-sm"
                                        value={capacityConfig.assembly.employeeCount}
                                        onChange={(e) => updateDepartmentStaffing("assembly", {
                                            ...capacityConfig.assembly,
                                            employeeCount: parseInt(e.target.value) || 1
                                        })}
                                    />
                                </div>
                            </div>

                            {/* Testing */}
                            <div className="rounded-xl border border-border/40 bg-card/50 p-4">
                                <div className="mb-3 flex items-center justify-between">
                                    <span className="font-medium text-foreground">Testing</span>
                                    <span className="rounded-full bg-amber-500/10 px-2 py-0.5 text-xs font-medium text-amber-500">
                                        ~1 day/pump
                                    </span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <label className="text-sm text-muted-foreground">Employees</label>
                                    <input
                                        type="number"
                                        min="1"
                                        max="20"
                                        className="h-8 w-20 rounded-md border border-border bg-background px-2 text-center text-sm"
                                        value={capacityConfig.testing.employeeCount}
                                        onChange={(e) => updateDepartmentStaffing("testing", {
                                            ...capacityConfig.testing,
                                            employeeCount: parseInt(e.target.value) || 1
                                        })}
                                    />
                                </div>
                            </div>

                            {/* Shipping */}
                            <div className="rounded-xl border border-border/40 bg-card/50 p-4">
                                <div className="mb-3 flex items-center justify-between">
                                    <span className="font-medium text-foreground">Shipping</span>
                                    <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-xs font-medium text-emerald-500">
                                        ~1 day/pump
                                    </span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <label className="text-sm text-muted-foreground">Employees</label>
                                    <input
                                        type="number"
                                        min="1"
                                        max="20"
                                        className="h-8 w-20 rounded-md border border-border bg-background px-2 text-center text-sm"
                                        value={capacityConfig.shipping.employeeCount}
                                        onChange={(e) => updateDepartmentStaffing("shipping", {
                                            ...capacityConfig.shipping,
                                            employeeCount: parseInt(e.target.value) || 1
                                        })}
                                    />
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Powder Coat Vendors Section */}
                    <section>
                        <div className="mb-4 flex items-center justify-between">
                            <h3 className="text-lg font-medium text-foreground">
                                Powder Coat Vendors
                            </h3>
                            <p className="text-xs text-muted-foreground">
                                Weekly pump capacity per vendor lane
                            </p>
                        </div>

                        <div className="space-y-3">
                            {capacityConfig.powderCoat.vendors.map((vendor) => (
                                <div key={vendor.id} className="flex items-center gap-4 rounded-xl border border-border/40 bg-card/50 p-4">
                                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-pink-500/10 text-pink-500 font-bold text-sm">
                                        {vendor.name.substring(0, 2)}
                                    </div>
                                    <div className="flex-1">
                                        <label className="text-sm font-medium text-foreground">Vendor Name</label>
                                        <input
                                            type="text"
                                            className="mt-1 block w-full rounded-md border border-border bg-background px-3 py-1 text-sm"
                                            value={vendor.name}
                                            onChange={(e) => updatePowderCoatVendor(vendor.id, { ...vendor, name: e.target.value })}
                                        />
                                    </div>
                                    <div className="w-32">
                                        <label className="text-sm font-medium text-foreground">Capacity / Wk</label>
                                        <div className="mt-1 flex items-center gap-2">
                                            <input
                                                type="number"
                                                min="0"
                                                max="50"
                                                className="block w-full rounded-md border border-border bg-background px-3 py-1 text-sm"
                                                value={vendor.maxPumpsPerWeek}
                                                onChange={(e) => updatePowderCoatVendor(vendor.id, { ...vendor, maxPumpsPerWeek: parseInt(e.target.value) || 0 })}
                                            />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>

                    {/* Sandbox Section */}
                    <section>
                        <div className="mb-4 flex items-center justify-between">
                            <h3 className="text-lg font-medium text-foreground">
                                Production Sandbox
                            </h3>
                            <p className="text-xs text-muted-foreground">
                                Simulate schedule changes safely
                            </p>
                        </div>
                        <div className="rounded-xl border border-yellow-500/50 bg-yellow-500/10 p-4 flex items-center justify-between">
                            <div>
                                <h4 className="font-bold text-yellow-700 dark:text-yellow-400">Enter Simulation Mode</h4>
                                <p className="text-sm text-muted-foreground">
                                    Create "Ghost" cards and test capacity without affecting live data.
                                </p>
                            </div>
                            <Button
                                onClick={() => {
                                    useApp.getState().enterSandbox();
                                    onClose();
                                    toast.success("Entered Sandbox Mode");
                                }}
                                className="bg-yellow-500 hover:bg-yellow-600 text-black font-bold"
                            >
                                Start Simulation
                            </Button>
                        </div>
                    </section>

                    {/* Milestone Management Section */}
                    <section>
                        <div className="mb-4 flex items-center justify-between">
                            <h3 className="text-lg font-medium text-foreground">
                                Milestone Management
                            </h3>
                            <p className="text-xs text-muted-foreground">
                                Track major goals and micro-tasks
                            </p>
                        </div>
                        <MilestoneManager />
                    </section>

                    {/* Actions */}
                    <div className="flex items-center justify-between border-t border-border/40 pt-6">
                        <Button
                            variant="outline"
                            onClick={handleReset}
                            className="gap-2 text-muted-foreground hover:text-foreground"
                        >
                            <RotateCcw className="h-4 w-4" />
                            Reset Defaults
                        </Button>

                        <Button onClick={onClose} className="gap-2 min-w-[100px]">
                            <Save className="h-4 w-4" />
                            Done
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
