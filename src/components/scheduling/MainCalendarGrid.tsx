// src/components/scheduling/MainCalendarGrid.tsx
import { useMemo } from "react";
import { useDroppable } from "@dnd-kit/core";
import { addDays, differenceInCalendarDays, format, isValid, parse, startOfDay, startOfWeek } from "date-fns";
import { cn } from "../../lib/utils";
import type { Pump, Stage } from "../../types";
import { CalendarEvent } from "./CalendarEvent";
import {
  buildStageTimeline,
  type CalendarStageEvent,
  type StageBlock,
} from "../../lib/schedule";
import { useApp } from "../../store";

interface MainCalendarGridProps {
  pumps: Pump[];
  onEventClick: (event: CalendarStageEvent) => void;
  visibleStages?: Stage[];
}

const weeks = 6;
const daysInView = weeks * 7;

interface WeekSegment {
  stage: Stage;
  startDate: Date;
  endDate: Date;
  startCol: number;
  span: number;
}

function projectSegmentsToWeek(blocks: StageBlock[], weekStart: Date, daysInWeek = 7): WeekSegment[] {
  const weekEnd = addDays(weekStart, daysInWeek);

  return blocks.reduce<WeekSegment[]>((segments, block) => {
    if (block.end <= weekStart || block.start >= weekEnd) {
      return segments;
    }

    const clampedStart = block.start < weekStart ? weekStart : block.start;
    const clampedEnd = block.end > weekEnd ? weekEnd : block.end;
    const startCol = Math.max(0, differenceInCalendarDays(clampedStart, weekStart));
    const endCol = Math.max(startCol + 1, differenceInCalendarDays(clampedEnd, weekStart));
    const span = Math.max(1, endCol - startCol);

    segments.push({
      stage: block.stage,
      startDate: clampedStart,
      endDate: clampedEnd,
      startCol,
      span,
    });

    return segments;
  }, []);
}

export function MainCalendarGrid({ pumps, onEventClick, visibleStages }: MainCalendarGridProps) {
  const { getModelLeadTimes } = useApp.getState();

  const today = useMemo(() => startOfDay(new Date()), []);
  const viewStart = useMemo(
    () => startOfDay(startOfWeek(today, { weekStartsOn: 1 })),
    [today]
  );

  const viewDates = useMemo(
    () => Array.from({ length: daysInView }, (_, index) => addDays(viewStart, index)),
    [viewStart]
  );

  const stageFilter = useMemo(() => new Set(visibleStages ?? []), [visibleStages]);

  const pumpTimelines = useMemo(() => {
    return pumps
      .map((pump) => {
        if (!pump.scheduledStart) {
          return null;
        }

        const parsedStart = pump.scheduledStart.includes("T")
          ? new Date(pump.scheduledStart)
          : parse(pump.scheduledStart, "yyyy-MM-dd", new Date());
        if (!isValid(parsedStart)) {
          return null;
        }

        const leadTimes = getModelLeadTimes(pump.model);
        if (!leadTimes) {
          return null;
        }

        const timeline = buildStageTimeline(pump, leadTimes, {
          startDate: startOfDay(parsedStart),
        });

        if (!timeline.length) {
          return null;
        }

        return { pump, timeline };
      })
      .filter((entry): entry is { pump: typeof pumps[number]; timeline: StageBlock[] } => Boolean(entry));
  }, [pumps, getModelLeadTimes, stageFilter]);

  const DroppableCell = ({ date }: { date: Date }) => {
    const dateId = format(date, "yyyy-MM-dd");
    const isWeekend = date.getDay() === 0 || date.getDay() === 6;
    const { isOver, setNodeRef } = useDroppable({
      id: dateId,
      data: { date: dateId },
    });

    return (
      <div
        ref={setNodeRef}
        className={cn(
          "calendar-cell border-r border-border/40 transition-all duration-150",
          isWeekend && "calendar-weekend",
          isOver && "bg-primary/20 shadow-inner shadow-[0_0_15px_rgba(37,99,235,0.35)]"
        )}
        style={{ minHeight: 24 }}
        data-testid={`calendar-cell-${dateId}`}
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
          const weekStart = weekIndex * 7;
          const weekDates = viewDates.slice(weekStart, weekStart + 7);
          
          return (
            <div key={weekIndex} className="border-b border-border/50">
              {/* Week Header */}
              <div className="sticky top-0 z-10 grid grid-cols-7 border-b border-border/60 bg-background/70 backdrop-blur">
                {weekDates.map((date, dayIndex) => {
                  const isWeekend = date.getDay() === 0 || date.getDay() === 6;
                  const label = date.toLocaleDateString("en-US", { weekday: "short" });
                  return (
                    <div
                      key={dayIndex}
                      className={cn(
                        "border-r border-border/40 px-2 py-2 text-center text-foreground transition-all duration-150",
                        isWeekend && "calendar-weekend-header",
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
                <div className="grid grid-cols-7 absolute inset-0">
                  {weekDates.map((date, i) => (
                    <DroppableCell key={i} date={date} />
                  ))}
                </div>

                <div
                  className="relative grid grid-cols-7 gap-y-2 p-2"
                  style={{ gridAutoRows: "30px" }}
                >
                  {pumpTimelines
                    .map(({ pump, timeline }) => {
                      const weekStartDate = addDays(viewStart, weekIndex * 7);
                      let segments = projectSegmentsToWeek(timeline, weekStartDate);
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
                          className="col-start-1 col-span-7"
                          style={{
                            gridRow: rowIdx + 1,
                            display: "grid",
                            gridTemplateColumns: "repeat(7, 1fr)",
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
                            };

                            return (
                              <CalendarEvent
                                key={event.id}
                                event={event}
                                onClick={onEventClick}
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
