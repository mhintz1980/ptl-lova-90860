import { Button } from "../ui/Button";
import {
  STAGE_COLORS,
  STAGE_LABELS,
  PRODUCTION_STAGES,
} from "../../lib/stage-constants";
import { cn } from "../../lib/utils";
import { useApp } from "../../store";
import { Wand2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { LockDatePicker } from "../toolbar/LockDatePicker";

export function CalendarHeader() {
  const clearQueueSchedules = useApp((state) => state.clearQueueSchedules);
  const autoSchedule = useApp((state) => state.autoSchedule);
  const stageFilters = useApp((state) => state.schedulingStageFilters);
  const toggleStageFilter = useApp((state) => state.toggleSchedulingStageFilter);
  const clearStageFilters = useApp((state) => state.clearSchedulingStageFilters);

  const handleClear = () => {
    const cleared = clearQueueSchedules();
    if (!cleared) {
      toast.info("No scheduled jobs to clear.");
      return;
    }
    toast.success(`Cleared ${cleared} scheduled job${cleared === 1 ? "" : "s"}.`);
  };

  const handleAuto = () => {
    const scheduled = autoSchedule();
    if (!scheduled) {
      toast.info("No jobs could be auto-scheduled.");
      return;
    }
    toast.success(`Auto-scheduled ${scheduled} job${scheduled === 1 ? "" : "s"}.`);
  };

  return (
    <div
      className="border-b border-border/70 bg-card/90 px-4 py-4 text-foreground"
      data-testid="calendar-header"
    >
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-1 flex-wrap items-center gap-2 overflow-x-auto pr-4">
          {PRODUCTION_STAGES.map((stage) => (
            <button
              key={stage}
              type="button"
              className={cn(
                "flex items-center gap-2 rounded-full border px-3 py-1 text-[11px] font-semibold transition-colors",
                "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary/40",
                stageFilters.includes(stage)
                  ? "border-primary/60 bg-primary/15 text-primary shadow-sm"
                  : "border-border/70 bg-card/80 text-foreground/80 hover:border-primary/50 hover:bg-primary/10 hover:text-primary"
              )}
              aria-pressed={stageFilters.includes(stage)}
              data-stage-filter={stage}
              onClick={() => toggleStageFilter(stage)}
            >
              <span
                className={cn(
                  "h-2.5 w-2.5 rounded-full border",
                  STAGE_COLORS[stage]
                )}
                aria-hidden="true"
              />
              {STAGE_LABELS[stage]}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <LockDatePicker />

          {stageFilters.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="header-button rounded-full border border-border/60 bg-card/80 text-foreground"
              onClick={clearStageFilters}
            >
              Clear Filters
            </Button>
          )}

          <Button
            variant="ghost"
            size="sm"
            className="header-button rounded-full border border-border/60 bg-card/80 text-foreground"
            onClick={handleAuto}
          >
            <Wand2 className="mr-2 h-3.5 w-3.5" />
            Auto
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="header-button rounded-full border border-border/60 bg-card/80 text-foreground"
            onClick={handleClear}
          >
            <Trash2 className="mr-2 h-3.5 w-3.5" />
            Clear
          </Button>
        </div>
      </div>
    </div>
  );
}
