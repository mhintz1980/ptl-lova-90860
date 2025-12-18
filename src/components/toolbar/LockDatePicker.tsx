// src/components/toolbar/LockDatePicker.tsx
import { Lock, LockOpen } from "lucide-react";
import { useApp } from "../../store";
import { cn } from "../../lib/utils";

export function LockDatePicker() {
    const { lockDate, setLockDate } = useApp();

    const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setLockDate(value || null);
    };

    const handleToggleLock = () => {
        if (lockDate) {
            // Unlock - clear the date
            setLockDate(null);
        } else {
            // Lock - set to today
            setLockDate(new Date().toISOString().split('T')[0]);
        }
    };

    return (
        <div className="flex items-center gap-2">
            {/* Toggle Button */}
            <button
                onClick={handleToggleLock}
                className={cn(
                    "flex items-center gap-1.5 px-2 py-1 text-sm rounded-md border transition-all",
                    lockDate
                        ? "bg-amber-100 dark:bg-amber-900/40 border-amber-400 text-amber-700 dark:text-amber-300 hover:bg-amber-200 dark:hover:bg-amber-900/60"
                        : "bg-background border-border text-muted-foreground hover:bg-muted"
                )}
                title={lockDate ? "Click to unlock schedule" : "Click to lock schedule"}
            >
                {lockDate ? (
                    <>
                        <Lock className="h-4 w-4" />
                        <span className="hidden sm:inline">Locked</span>
                    </>
                ) : (
                    <>
                        <LockOpen className="h-4 w-4" />
                        <span className="hidden sm:inline">Unlocked</span>
                    </>
                )}
            </button>

            {/* Date Picker (shown when locked) */}
            {lockDate && (
                <div className="relative flex items-center">
                    <span className="text-xs text-muted-foreground mr-1">before:</span>
                    <input
                        type="date"
                        value={lockDate || ""}
                        onChange={handleDateChange}
                        className={cn(
                            "h-7 px-2 py-0.5 text-sm rounded-md border bg-background",
                            "focus:outline-none focus:ring-2 focus:ring-primary/50",
                            "[color-scheme:light] dark:[color-scheme:dark]",
                            "border-amber-400 bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300"
                        )}
                    />
                </div>
            )}
        </div>
    );
}
