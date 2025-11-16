// src/components/kanban/StageColumn.tsx
import { Pump, Stage } from "../../types";
import { PumpCard } from "./PumpCard";
import { useDroppable } from "@dnd-kit/core";
import { ChevronDown, ChevronUp } from "lucide-react";
import { useApp } from "../../store";
import { cn } from "../../lib/utils";
import { useMemo } from "react";
import { sortPumps } from "../../lib/sort";

interface StageColumnProps {
  stage: Stage;
  pumps: Pump[];
  collapsed: boolean;
  onCardClick?: (pump: Pump) => void;
  activeId?: string | null;
}

export function StageColumn({ stage, pumps, collapsed, onCardClick, activeId }: StageColumnProps) {
  const { collapsedStages, toggleStageCollapse, wipLimits, sortField, sortDirection } = useApp();
  const isCollapsed = collapsedStages[stage];
  const wipLimit = wipLimits?.[stage] ?? null;
  const sortedPumps = useMemo(
    () => sortPumps(pumps, sortField, sortDirection),
    [pumps, sortField, sortDirection]
  );
  const isOverLimit = typeof wipLimit === "number" ? sortedPumps.length > wipLimit : false;
  const countLabel = wipLimit != null ? `${sortedPumps.length} / ${wipLimit}` : `${sortedPumps.length}`;

  const averageDwell = useMemo(() => {
    if (!sortedPumps.length) return null;
    const now = Date.now();
    const samples = sortedPumps
      .map((pump) => pump.last_update ? Math.max(0, (now - new Date(pump.last_update).getTime()) / (1000 * 60 * 60 * 24)) : null)
      .filter((value): value is number => value !== null);
    if (!samples.length) return null;
    const avg = samples.reduce((sum, value) => sum + value, 0) / samples.length;
    return `${avg.toFixed(1)}d`;
  }, [sortedPumps]);
  
  const { setNodeRef, isOver } = useDroppable({
    id: stage,
    data: { type: "column", stage },
  });

  const stageAccent: Record<Stage, string> = {
    "NOT STARTED": "bg-slate-400",
    "FABRICATION": "bg-blue-500",
    "POWDER COAT": "bg-purple-500",
    "ASSEMBLY": "bg-amber-500",
    "TESTING": "bg-orange-500",
    "SHIPPING": "bg-emerald-500",
    "CLOSED": "bg-cyan-500",
  };

  return (
    <div className="flex w-[260px] flex-shrink-0 flex-col">
      <div
        className={cn(
          "layer-l2 overflow-hidden transition-shadow",
          isOver && "ring-2 ring-accent/40"
        )}
      >
        <button
          type="button"
          data-stage-header={stage}
          data-over-limit={isOverLimit || undefined}
          className={cn(
            "flex w-full items-center justify-between gap-2 border-b border-border/60 bg-card/60 px-3 py-2.5 text-left transition-colors",
            isOverLimit ? "bg-destructive/15 hover:bg-destructive/20 border-destructive/40" : "hover:bg-card"
          )}
          onClick={() => toggleStageCollapse(stage)}
        >
          <div className="flex flex-1 items-center gap-2">
            <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${stageAccent[stage]}`}></span>
            <div className="flex flex-1 items-center justify-between text-sm font-semibold text-foreground">
              <span className="truncate" title={stage}>
                {stage}
              </span>
              <div className="flex flex-col items-end text-xs font-medium text-muted-foreground">
                <span>{countLabel}</span>
                <span className="text-[11px] uppercase tracking-wide">
                  Avg {averageDwell ?? "–"}
                </span>
              </div>
            </div>
          </div>
          <span className="text-muted-foreground hover:text-foreground">
            {isCollapsed ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
          </span>
        </button>

        {!isCollapsed && (
          <div
            ref={setNodeRef}
            className="flex-1 space-y-3 overflow-y-auto overflow-x-hidden px-3 py-4 scrollbar-themed"
            style={{ maxHeight: "calc(100vh - 230px)" }}
          >
            {sortedPumps.map((pump) => (
              activeId === pump.id ? null : (
                <PumpCard
                  key={pump.id}
                  pump={pump}
                  collapsed={collapsed}
                  onClick={() => onCardClick?.(pump)}
                />
              )
            ))}
            {pumps.length === 0 && (
              <div className="flex h-24 items-center justify-center rounded-lg border border-dashed border-border text-xs text-muted-foreground">
                Drop pumps here
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
