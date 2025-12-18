// src/components/scheduling/MainCalendarGrid.tsx
import { useMemo } from "react";
import { useDroppable } from "@dnd-kit/core";
import { addDays, format, startOfDay, startOfWeek } from "date-fns";
import { cn } from "../../lib/utils";
import type { Pump, Stage } from "../../types";
import { CalendarEvent } from "./CalendarEvent";
import {
  type CalendarStageEvent,
  type StageBlock,
} from "../../lib/schedule";
import { useApp } from "../../store";
import { buildCapacityAwareTimelines } from "../../lib/schedule-helper";

interface MainCalendarGridProps {
  pumps: Pump[];
  onEventClick?: (event: CalendarStageEvent) => void;
  onEventDoubleClick?: (event: CalendarStageEvent) => void;
  visibleStages?: Stage[];
}

const weeks = 6;

interface WeekSegment {
  stage: Stage;
  startDate: Date;
  endDate: Date;
  startCol: number;
  span: number;
  continuesLeft: boolean;   // Event continues from previous week
  continuesRight: boolean;  // Event continues to next week
}

const HOLIDAYS = [
  "2025-01-01", // New Year
  "2025-05-26", // Memorial Day
  "2025-07-04", // Independence Day
  "2025-09-01", // Labor Day
  "2025-11-27", // Thanksgiving
  "2025-12-25", // Christmas
];

function isHoliday(date: Date) {
  const dateStr = format(date, "yyyy-MM-dd");
  return HOLIDAYS.includes(dateStr);
}

function projectSegmentsToWeek(blocks: StageBlock[], weekStart: Date, daysInWeek = 5): WeekSegment[] {
  const weekEnd = addDays(weekStart, daysInWeek);

  // Helper for fractional day difference (hourly precision = 1/24 = 0.0417)
  const MS_PER_DAY = 24 * 60 * 60 * 1000;
  const differenceInFractionalDays = (a: Date, b: Date) => (a.getTime() - b.getTime()) / MS_PER_DAY;

  return blocks.reduce<WeekSegment[]>((segments, block) => {
    if (block.end <= weekStart || block.start >= weekEnd) {
      return segments;
    }

    const clampedStart = block.start < weekStart ? weekStart : block.start;
    const clampedEnd = block.end > weekEnd ? weekEnd : block.end;

    // Use fractional days for precise positioning
    const startCol = Math.max(0, differenceInFractionalDays(clampedStart, weekStart));
    const endCol = Math.max(startCol, differenceInFractionalDays(clampedEnd, weekStart));

    // Fractional span - minimum 1/24 day (1 hour), capped at remaining days
    const span = Math.min(daysInWeek - startCol, Math.max(1 / 24, endCol - startCol));

    segments.push({
      stage: block.stage,
      startDate: clampedStart,
      endDate: clampedEnd,
      startCol,
      span,
      continuesLeft: block.start < weekStart,   // Started before this week
      continuesRight: block.end > weekEnd,      // Ends after this week
    });

    return segments;
  }, []);
}

export function MainCalendarGrid({
  pumps,
  onEventClick,
  onEventDoubleClick,
  visibleStages = [],
}: MainCalendarGridProps) {
  const { getModelLeadTimes } = useApp.getState();

  const today = useMemo(() => startOfDay(new Date()), []);
  const viewStart = useMemo(
    () => startOfDay(startOfWeek(today, { weekStartsOn: 1 })),
    [today]
  );

  const stageFilter = useMemo(() => new Set(visibleStages ?? []), [visibleStages]);

  const pumpTimelines = useMemo(() => {
    const { capacityConfig } = useApp.getState();

    // Use the new capacity-aware builder
    const timelinesMap = buildCapacityAwareTimelines(pumps, capacityConfig, getModelLeadTimes);

    return pumps
      .map((pump) => {
        const timeline = timelinesMap[pump.id];
        if (!timeline || !timeline.length) return null;
        return { pump, timeline };
      })
      .filter((entry): entry is { pump: typeof pumps[number]; timeline: StageBlock[] } => Boolean(entry))
      // Sort by earliest start date (jobs that started first are at top)
      .sort((a, b) => {
        const aStart = a.timeline[0]?.start.getTime() ?? 0;
        const bStart = b.timeline[0]?.start.getTime() ?? 0;
        return aStart - bStart;
      });
  }, [pumps, getModelLeadTimes]);

  const DroppableCell = ({ date }: { date: Date }) => {
    const dateId = format(date, "yyyy-MM-dd");
    const isHolidayDate = isHoliday(date);
    const { isOver, setNodeRef } = useDroppable({
      id: dateId,
      data: { date: dateId },
    });

    return (
      <div
        ref={setNodeRef}
        className={cn(
          "calendar-cell border-r border-border/40 transition-all duration-150",
          isHolidayDate && "bg-muted/50 repeating-linear-gradient-45 from-transparent to-muted/20",
          isOver && "bg-primary/20 shadow-[0_0_15px_rgba(37,99,235,0.35)]"
        )}
        style={{ minHeight: 24 }}
        data-testid={`calendar-cell-${dateId}`}
        title={isHolidayDate ? "Holiday" : undefined}
      />
    );
  };

  return (
    <div
      className="flex-1 overflow-auto rounded-3xl border border-border/60 bg-card/95 p-4 shadow-inner"
      data-testid="calendar-grid"
    >
      <div className="min-w-[1000px] rounded-2xl bg-card/80 p-1">
        {Array.from({ length: weeks }).map((_, weekIndex) => {
          const weekStart = addDays(viewStart, weekIndex * 7);
          // Get only Mon-Fri for this week
          const weekDates = Array.from({ length: 5 }, (_, i) => addDays(weekStart, i));

          return (
            <div key={weekIndex} className="border-b border-border/50">
              {/* Week Header */}
              <div className="sticky top-0 z-10 grid grid-cols-5 border-b border-border/60 bg-background/70 backdrop-blur">
                {weekDates.map((date, dayIndex) => {
                  const isHolidayDate = isHoliday(date);
                  const label = date.toLocaleDateString("en-US", { weekday: "short" });
                  return (
                    <div
                      key={dayIndex}
                      className={cn(
                        "border-r border-border/40 px-2 py-2 text-center text-foreground transition-all duration-150",
                        isHolidayDate && "bg-muted/30 text-muted-foreground",
                        date.toDateString() === today.toDateString() &&
                        "bg-primary/10 text-primary"
                      )}
                    >
                      <div className="flex items-center justify-center gap-1 text-[11px] font-semibold uppercase tracking-[0.15em]">
                        <span>{label}</span>
                        <span className="text-sm tracking-normal">{date.getDate()}</span>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="relative min-h-[180px]">
                <div className="grid grid-cols-5 absolute inset-0">
                  {weekDates.map((date, i) => (
                    <DroppableCell key={i} date={date} />
                  ))}
                </div>

                <div
                  className="relative grid grid-cols-5 gap-y-2 p-2"
                  style={{ gridAutoRows: "30px" }}
                >
                  {pumpTimelines
                    .map(({ pump, timeline }) => {
                      let segments = projectSegmentsToWeek(timeline, weekStart, 5);
                      if (stageFilter.size) {
                        segments = segments.filter((segment) => stageFilter.has(segment.stage));
                      }
                      if (!segments.length) {
                        return null;
                      }
                      return { pump, segments };
                    })
                    .filter((row): row is { pump: typeof pumps[number]; segments: WeekSegment[] } => Boolean(row))
                    .map(({ pump, segments }, rowIdx) => {
                      return (
                        <div
                          key={`${pump.id}-${weekIndex}`}
                          className="col-start-1 col-span-5"
                          style={{
                            gridRow: rowIdx + 1,
                            display: "grid",
                            gridTemplateColumns: "repeat(5, 1fr)",
                          }}
                        >
                          {segments.map((segment, segIdx) => {
                            const event: CalendarStageEvent = {
                              id: `${pump.id}-${segment.stage}-${weekIndex}-${segIdx}`,
                              pumpId: pump.id,
                              stage: segment.stage,
                              title: pump.model,
                              subtitle: pump.po,
                              week: weekIndex,
                              startDay: segment.startCol,
                              span: segment.span,
                              row: rowIdx,
                              startDate: segment.startDate,
                              endDate: segment.endDate,
                              shipDate: pump.scheduledEnd ? new Date(pump.scheduledEnd) : undefined,
                            };

                            return (
                              <CalendarEvent
                                key={event.id}
                                event={event}
                                onClick={onEventClick}
                                onDoubleClick={onEventDoubleClick}
                                continuesLeft={segment.continuesLeft}
                                continuesRight={segment.continuesRight}
                              />
                            );
                          })}
                        </div>
                      );
                    })}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
