// src/components/scheduling/SegmentedCalendarBar.tsx
import { useMemo } from "react";
import { cn } from "../../lib/utils";
import type { Stage } from "../../types";
import { STAGE_COLORS } from "../../lib/stage-constants";

interface SegmentedCalendarBarProps {
  title: string;
  subtitle?: string;
  segments: Array<{
    stage: Stage;
    percentage: number; // 0-1 representing portion of total timeline
    startDate?: Date;
    endDate?: Date;
  }>;
  startCol: number;
  span: number;
  onClick: () => void;
  isDragging?: boolean;
  pumpId?: string;
}

export function SegmentedCalendarBar({
  title,
  subtitle,
  segments,
  startCol,
  span,
  onClick,
  isDragging = false,
  pumpId,
}: SegmentedCalendarBarProps) {
  // Sort segments by stage sequence to ensure proper order
  const sortedSegments = useMemo(() => {
    // Constitution §2.1: Canonical stage order
    const stageOrder: Record<Stage, number> = {
      QUEUE: 0,
      FABRICATION: 1,
      STAGED_FOR_POWDER: 2,
      POWDER_COAT: 3,
      ASSEMBLY: 4,
      SHIP: 5,
      CLOSED: 6,
    };

    return segments
      .filter(seg => seg.percentage > 0)
      .sort((a, b) => stageOrder[a.stage] - stageOrder[b.stage]);
  }, [segments]);

  const hasValidSegments = sortedSegments.length > 0;

  const eventContent = (
    <div
      className={cn(
        "flex h-full items-center justify-between gap-3 rounded-xl border border-border/70 px-3 py-1 text-[11px] font-semibold tracking-wide text-foreground shadow-soft backdrop-blur cursor-pointer transition-all duration-150",
        isDragging && "opacity-50 border-2 border-dashed border-gray-600"
      )}
      style={{
        gridColumn: `${startCol + 1} / span ${span}`,
        minWidth: "100%",
        zIndex: isDragging ? 10 : 1,
      }}
      data-testid="calendar-event"
      data-pump-id={pumpId}
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick();
        }
      }}
      aria-label={`${title} - ${subtitle ? `PO: ${subtitle}` : ''}`}
    >
      {/* Left side: Pump info */}
      <div className="flex flex-col truncate text-left flex-shrink-0">
        <span className="truncate text-xs font-semibold">{title}</span>
        {subtitle && (
          <span className="truncate text-[10px] font-normal text-foreground/70">
            {subtitle}
          </span>
        )}
      </div>

      {/* Right side: Segmented bar visualization */}
      {hasValidSegments && (
        <div className="flex-1 h-4 min-w-0 ml-2">
          <div className="w-full h-full rounded-md overflow-hidden flex">
            {sortedSegments.map((segment, index) => {
              const colorClass = STAGE_COLORS[segment.stage] || "stage-color stage-color-queue";
              const widthPercent = `${segment.percentage * 100}%`;

              return (
                <div
                  key={`${segment.stage}-${index}`}
                  className={cn(
                    "h-full first:rounded-l-md last:rounded-r-md",
                    colorClass
                  )}
                  style={{
                    width: widthPercent,
                    minWidth: '2px', // Ensure very small segments are still visible
                  }}
                  title={`${segment.stage}: ${Math.round(segment.percentage * 100)}%`}
                  data-stage={segment.stage}
                  data-segment-percentage={segment.percentage}
                />
              );
            })}
          </div>
        </div>
      )}
    </div>
  );

  return eventContent;
}
