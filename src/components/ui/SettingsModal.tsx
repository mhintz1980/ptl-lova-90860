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
                className="bg-background shadow-frame border border-border rounded-2xl w-full max-w-2xl p-6 m-4 max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-200"
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
                        <div className="mb-4">
                            <h3 className="text-lg font-semibold text-foreground">
                                Department Staffing
                            </h3>
                            <p className="text-sm text-foreground/70">
                                Adjust Employees, Efficiency, or Man-Hours
                            </p>
                        </div>

                        <div className="grid gap-4 sm:grid-cols-2">
                            {/* Constitution §2.1: ship replaces testing+shipping */}
                            {(["fabrication", "assembly", "ship"] as const).map((stage) => {
                                const config = capacityConfig[stage];
                                const colorMap = {
                                    fabrication: "blue",
                                    assembly: "purple",
                                    ship: "emerald",
                                };
                                const color = colorMap[stage];
                                const label = stage === "ship" ? "Ship (Test+Ship)" : stage.charAt(0).toUpperCase() + stage.slice(1);

                                return (
                                    <div key={stage} className="rounded-xl border border-border bg-card p-4 space-y-3">
                                        <div className="flex items-center justify-between">
                                            <span className="font-semibold text-foreground">{label}</span>
                                            <span className={`rounded-full bg-${color}-500/20 px-2 py-0.5 text-xs font-semibold text-${color}-600 dark:text-${color}-400`}>
                                                {stage === "fabrication" ? "~4" : stage === "assembly" ? "~2" : "~1"} days/pump
                                            </span>
                                        </div>

                                        {/* Employees */}
                                        <div className="flex items-center justify-between">
                                            <label className="text-sm font-medium text-foreground/80">Employees</label>
                                            <input
                                                type="number"
                                                min="0.1"
                                                max="50"
                                                step="0.1"
                                                className="h-8 w-20 rounded-md border border-border bg-background px-2 text-right text-sm font-medium text-foreground"
                                                value={config.employeeCount}
                                                onChange={(e) => updateDepartmentStaffing(stage, {
                                                    ...config,
                                                    employeeCount: parseFloat(e.target.value) || 0
                                                })}
                                            />
                                        </div>

                                        {/* Efficiency */}
                                        <div className="flex items-center justify-between">
                                            <label className="text-sm font-medium text-foreground/80">Efficiency</label>
                                            <div className="relative w-20">
                                                <input
                                                    type="number"
                                                    min="1"
                                                    max="200"
                                                    step="0.1"
                                                    className="h-8 w-full rounded-md border border-border bg-background px-2 text-right text-sm pr-7 font-medium text-foreground"
                                                    value={Math.round(config.efficiency * 1000) / 10}
                                                    onChange={(e) => updateDepartmentStaffing(stage, {
                                                        ...config,
                                                        efficiency: (parseFloat(e.target.value) || 0) / 100
                                                    })}
                                                />
                                                <span className="absolute right-2 top-2 text-xs font-medium text-foreground/60">%</span>
                                            </div>
                                        </div>

                                        {/* Daily Man-Hours */}
                                        <div className="flex items-center justify-between pt-2 border-t border-border">
                                            <label className="text-sm font-semibold text-foreground">Daily Man-Hours</label>
                                            <input
                                                type="number"
                                                min="0"
                                                className="h-8 w-20 rounded-md border border-border bg-background px-2 text-right text-sm font-semibold text-foreground"
                                                value={Math.round(config.dailyManHours * 10) / 10}
                                                onChange={(e) => updateDepartmentStaffing(stage, {
                                                    ...config,
                                                    dailyManHours: parseFloat(e.target.value) || 0
                                                })}
                                            />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </section>

                    {/* Powder Coat Vendors Section */}
                    <section>
                        <div className="mb-4">
                            <h3 className="text-lg font-semibold text-foreground">
                                Powder Coat Vendors
                            </h3>
                            <p className="text-sm text-foreground/70">
                                Weekly pump capacity per vendor lane
                            </p>
                        </div>

                        <div className="space-y-3">
                            {capacityConfig.powderCoat.vendors.map((vendor) => (
                                <div key={vendor.id} className="flex items-center gap-4 rounded-xl border border-border bg-card p-4">
                                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-pink-500/20 text-pink-600 dark:text-pink-400 font-bold text-sm">
                                        {vendor.name.substring(0, 2)}
                                    </div>
                                    <div className="flex-1">
                                        <label className="text-sm font-semibold text-foreground/80">Vendor Name</label>
                                        <input
                                            type="text"
                                            className="mt-1 block w-full rounded-md border border-border bg-background px-3 py-2 text-sm font-medium text-foreground"
                                            value={vendor.name}
                                            onChange={(e) => updatePowderCoatVendor(vendor.id, { ...vendor, name: e.target.value })}
                                        />
                                    </div>
                                    <div className="w-32">
                                        <label className="text-sm font-semibold text-foreground/80">Capacity / Wk</label>
                                        <div className="mt-1 flex items-center gap-2">
                                            <input
                                                type="number"
                                                min="0"
                                                max="50"
                                                className="block w-full rounded-md border border-border bg-background px-3 py-2 text-sm font-medium text-foreground"
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
                        <div className="mb-4">
                            <h3 className="text-lg font-semibold text-foreground">
                                Production Sandbox
                            </h3>
                            <p className="text-sm text-foreground/70">
                                Simulate schedule changes safely
                            </p>
                        </div>
                        <div className="rounded-xl border-2 border-yellow-500 bg-yellow-500/20 p-4 flex items-center justify-between gap-4">
                            <div>
                                <h4 className="font-bold text-yellow-800 dark:text-yellow-300">Enter Simulation Mode</h4>
                                <p className="text-sm font-medium text-yellow-700 dark:text-yellow-400">
                                    Create "Ghost" cards and test capacity without affecting live data.
                                </p>
                            </div>
                            <Button
                                onClick={() => {
                                    useApp.getState().enterSandbox();
                                    onClose();
                                    toast.success("Entered Sandbox Mode");
                                }}
                                className="bg-yellow-600 hover:bg-yellow-700 dark:bg-yellow-500 dark:hover:bg-yellow-600 text-white dark:text-black font-bold shadow-md"
                            >
                                Start Simulation
                            </Button>
                        </div>
                    </section>

                    {/* Milestone Management Section */}
                    <section>
                        <div className="mb-4">
                            <h3 className="text-lg font-semibold text-foreground">
                                Milestone Management
                            </h3>
                            <p className="text-sm text-foreground/70">
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
