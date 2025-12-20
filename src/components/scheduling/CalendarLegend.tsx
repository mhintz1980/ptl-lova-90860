// src/components/scheduling/CalendarLegend.tsx
import * as React from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "../../lib/utils";
import { Tooltip } from "../ui/Tooltip";
import { STAGE_COLORS, STAGE_LABELS } from "../../lib/stage-constants";
import type { Stage } from "../../types";
import { Button } from "../ui/Button";
import { useApp } from "../../store";

interface CalendarLegendProps {
  className?: string;
}

// Only show active stages in the legend (excluding unscheduled and closed)
const ACTIVE_STAGES: Stage[] = [
  "QUEUE",
  "FABRICATION",
  "POWDER_COAT",
  "ASSEMBLY",
  "SHIP",
  "SHIP",
];

function LegendItem({ stage, active }: { stage: Stage; active: boolean }) {
  const colorClass = STAGE_COLORS[stage];
  const label = STAGE_LABELS[stage];
  const toggleStage = useApp((state) => state.toggleSchedulingStageFilter);

  return (
    <Tooltip
      content={
        <div className="text-center">
          <div className="font-medium">{label}</div>
          <div className="text-xs text-gray-300 mt-1">
            {stage === "QUEUE"
              ? "Items in production queue"
              : `Production stage: ${label.toLowerCase()}`}
          </div>
        </div>
      }
      side="top"
      align="center"
    >
      <button
        type="button"
        onClick={() => toggleStage(stage)}
        className={cn(
          "flex items-center gap-2 rounded-full border px-3 py-1 text-sm font-medium transition-colors cursor-pointer",
          "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary/40",
          active
            ? "border-primary/60 bg-primary/15 text-primary shadow-sm hover:bg-primary/20"
            : "border-border/60 bg-card text-foreground/80 hover:border-primary/40 hover:text-foreground hover:bg-primary/5"
        )}
        aria-pressed={active}
        aria-label={`${label} stage filter`}
        data-stage-filter={stage}
        data-state={active ? "on" : "off"}
      >
        <span
          className={cn("stage-color inline-flex h-4 w-4 rounded-md border", colorClass)}
          aria-hidden="true"
        />
        {label}
      </button>
    </Tooltip>
  );
}

export function CalendarLegend({ className }: CalendarLegendProps) {
  const [isExpanded, setIsExpanded] = React.useState(() => {
    // Default to expanded on larger screens, collapsed on mobile
    if (typeof window !== 'undefined') {
      return window.innerWidth >= 768;
    }
    return true;
  });
  const stageFilters = useApp((state) => state.schedulingStageFilters);
  const clearStageFilters = useApp((state) => state.clearSchedulingStageFilters);

  const toggleExpanded = () => {
    setIsExpanded(!isExpanded);
  };

  return (
    <div className={cn("border-b border-border bg-card", className)}>
      <div className="px-6 py-3">
        {/* Collapsible Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h2 className="text-sm font-semibold text-foreground/70 uppercase tracking-wide">
              Production Stages
            </h2>
            {stageFilters.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 rounded-full border border-border/60 px-3 text-xs"
                onClick={clearStageFilters}
              >
                Clear
              </Button>
            )}
          </div>

          <button
            type="button"
            onClick={toggleExpanded}
            className={cn(
              "flex items-center gap-1 px-2 py-1 text-sm text-foreground/60 hover:text-foreground transition-colors",
              "md:hidden" // Only show on mobile
            )}
            aria-expanded={isExpanded}
            aria-controls="legend-content"
          >
            <span className="text-xs">
              {isExpanded ? "Hide" : "Show"}
            </span>
            {isExpanded ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
          </button>
        </div>

        {/* Legend Content */}
        <div
          id="legend-content"
          className={cn(
            "mt-3",
            isExpanded ? "block" : "hidden md:block" // Always show on desktop, toggle on mobile
          )}
        >
          <div
            className="flex flex-wrap items-center gap-3"
            role="list"
            aria-label="Production stage color legend showing calendar timeline colors"
          >
            {ACTIVE_STAGES.map((stage) => (
              <div key={stage} role="listitem" className="flex items-center">
                <LegendItem
                  stage={stage}
                  active={stageFilters.includes(stage)}
                />
              </div>
            ))}
          </div>

          <div className="mt-2 text-xs text-foreground/50" role="note">
            Colors indicate production stages in the calendar timeline. Hover over stages for more information.
          </div>
        </div>
      </div>
    </div>
  );
}
