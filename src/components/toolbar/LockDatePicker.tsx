// src/components/toolbar/LockDatePicker.tsx
import { Lock, LockOpen } from "lucide-react";
import { useApp } from "../../store";
import { format, parseISO } from "date-fns";
import { cn } from "../../lib/utils";

export function LockDatePicker() {
    const { lockDate, setLockDate } = useApp();

    const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setLockDate(value || null);
    };

    const handleClear = () => {
        setLockDate(null);
    };

    return (
        <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                {lockDate ? (
                    <Lock className="h-4 w-4 text-amber-500" />
                ) : (
                    <LockOpen className="h-4 w-4" />
                )}
                <span className="hidden sm:inline font-medium">Lock Before:</span>
            </div>

            <div className="relative flex items-center">
                <input
                    type="date"
                    value={lockDate || ""}
                    onChange={handleDateChange}
                    className={cn(
                        "h-8 px-2 py-1 text-sm rounded-md border bg-background",
                        "focus:outline-none focus:ring-2 focus:ring-primary/50",
                        "[color-scheme:light] dark:[color-scheme:dark]",
                        lockDate
                            ? "border-amber-400 bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300"
                            : "border-border"
                    )}
                />
                {lockDate && (
                    <button
                        onClick={handleClear}
                        className="ml-1 p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                        title="Clear lock date"
                    >
                        ×
                    </button>
                )}
            </div>

            {lockDate && (
                <span className="text-xs text-amber-600 dark:text-amber-400 hidden md:inline">
                    Jobs on/before {format(parseISO(lockDate), "MMM d")} are locked
                </span>
            )}
        </div>
    );
}
