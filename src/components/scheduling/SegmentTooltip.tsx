// src/components/scheduling/SegmentTooltip.tsx
import * as React from "react";
import { format, differenceInCalendarDays } from "date-fns";
import { cn } from "../../lib/utils";
import { Tooltip } from "../ui/Tooltip";
import { STAGE_COLORS, STAGE_LABELS } from "../../lib/stage-constants";
import type { CalendarStageEvent } from "../../lib/schedule";

interface SegmentTooltipProps {
  event: CalendarStageEvent;
  children: React.ReactNode;
  className?: string;
}

function formatDate(date: Date): string {
  return format(date, "MMM d, yyyy");
}

function formatRange(startDate: Date, endDate: Date): string {
  if (differenceInCalendarDays(endDate, startDate) === 0) {
    return formatDate(startDate);
  }
  return `${formatDate(startDate)} - ${formatDate(endDate)}`;
}

export function SegmentTooltip({ event, children, className }: SegmentTooltipProps) {
  const colorClass = STAGE_COLORS[event.stage];
  const label = STAGE_LABELS[event.stage];
  const duration = differenceInCalendarDays(event.endDate, event.startDate) + 1;

  return (
    <Tooltip
      content={
        <div className="space-y-2">
          {/* Header with stage info */}
          <div className="border-b border-gray-700 pb-2 flex items-center gap-2">
            <div
              className={cn("w-3 h-3 rounded-sm border border-white/20", colorClass)}
              aria-hidden="true"
            />
            <span className="font-medium text-white">{label}</span>
          </div>

          {/* Pump information */}
          <div>
            <div className="text-sm font-medium text-white mb-1">
              {event.title}
            </div>
            <div className="text-xs text-gray-300 mb-1">
              PO: {event.subtitle}
            </div>
            <div className="text-xs text-gray-400">
              Pump ID: {event.pumpId}
            </div>
          </div>

          {/* Date information */}
          <div className="border-t border-gray-700 pt-2">
            <div className="text-xs text-gray-300 mb-1">
              Duration: {duration} {duration === 1 ? 'day' : 'days'}
            </div>
            <div className="text-xs font-mono text-gray-200">
              {formatRange(event.startDate, event.endDate)}
            </div>
          </div>

          {/* Additional context */}
          {event.week >= 0 && (
            <div className="text-xs text-gray-400 italic">
              Week {event.week + 1} of timeline
            </div>
          )}
        </div>
      }
      side="top"
      align="center"
      delay={300}
      className="max-w-xs"
    >
      <div className={cn("inline-block", className)}>
        {children}
      </div>
    </Tooltip>
  );
}
