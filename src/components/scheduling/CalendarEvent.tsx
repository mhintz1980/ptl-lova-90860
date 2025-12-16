import { cn } from "../../lib/utils";
import type { CalendarStageEvent } from "../../lib/schedule";
import { STAGE_COLORS, STAGE_LABELS } from "../../lib/stage-constants";
import { useDraggable } from "@dnd-kit/core";

interface CalendarEventProps {
  event: CalendarStageEvent;
  onClick?: (event: CalendarStageEvent) => void;
  onDoubleClick?: (event: CalendarStageEvent) => void;
  isDragging?: boolean;
}

export function CalendarEvent({ event, onClick, onDoubleClick, isDragging = false }: CalendarEventProps) {
  const { attributes, listeners, setNodeRef, isDragging: isDraggable } = useDraggable({
    id: event.id,
    data: {
      type: "CALENDAR_EVENT",
      event,
      pumpId: event.pumpId,
    },
  });

  const stageLabel = STAGE_LABELS[event.stage] ?? event.stage;
  const idleDays = event.idleDays ?? 0;
  const status = idleDays > 6 ? "danger" : idleDays > 3 ? "warning" : "ok";

  // Use single click to open details - better UX than double-click
  const handleClick = () => {
    // Only trigger if not dragging
    if (!isDraggable) {
      onClick?.(event);
    }
  };

  const handleDoubleClick = () => {
    onDoubleClick?.(event);
  };

  const stageColorClass = STAGE_COLORS[event.stage] ?? STAGE_COLORS["QUEUE"];

  const statusChipClass =
    status === "danger"
      ? "bg-rose-500/20 text-rose-900 dark:text-rose-50"
      : status === "warning"
        ? "bg-amber-500/20 text-amber-900 dark:text-amber-50"
        : "bg-emerald-500/20 text-emerald-900 dark:text-emerald-50";

  if (isDragging) {
    return (
      <div
        className={cn(
          "relative flex h-[34px] w-full flex-col justify-center rounded-md border px-2 py-0.5 text-xs shadow-sm transition-all",
          stageColorClass,
          "cursor-grabbing opacity-50 ring-2 ring-primary ring-offset-2"
        )}
      >
        {/* Simplified content for drag overlay */}
        <div className="font-bold">{event.title}</div>
      </div>
    );
  }

  return (
    <div
      ref={setNodeRef}
      style={
        {
          gridColumnStart: Math.floor(event.startDay) + 1,
          // Use span for grid positioning, then adjust width for fractional precision
          gridColumnEnd: `span ${Math.max(1, Math.ceil(event.span))}`,
          gridRowStart: event.row + 1,
          // Fractional width: span/ceilSpan * 100% gives proportional width within the grid cell(s)
          width: event.span < 1 || event.span % 1 !== 0
            ? `${(event.span / Math.ceil(event.span)) * 100}%`
            : undefined,
        } as React.CSSProperties
      }
      {...attributes}
      {...listeners}
      className={cn(
        "group relative flex h-[34px] w-full flex-col justify-center rounded-md border px-2 py-0.5 text-xs shadow-sm transition-all hover:shadow-md",
        stageColorClass,
        isDraggable ? "opacity-50" : "opacity-100",
        "cursor-grab active:cursor-grabbing"
      )}
      onClick={handleClick}
      onDoubleClick={handleDoubleClick}
      aria-label={`${event.title} - ${stageLabel} - PO ${event.subtitle}`}
      data-testid="calendar-event"
      data-span={event.span}
      data-stage={event.stage}
    >
      {/* Model name - prominent */}
      <div className="flex items-center justify-between">
        <span className="truncate text-[14px] font-bold leading-tight" title={event.title}>
          {event.title}
        </span>
        {idleDays > 3 && (
          <span
            className={cn(
              "ml-1 flex-shrink-0 rounded-full px-1.5 py-0.5 text-[8px] font-semibold uppercase tracking-widest",
              statusChipClass
            )}
          >
            {status === "danger" ? "!" : "⚠"}
          </span>
        )}
      </div>

      {/* Customer name - underneath model */}
      <div className="mt-0.5 truncate text-[11px] text-foreground/70" title={event.customer}>
        {event.customer ?? `PO ${event.subtitle}`}
      </div>
    </div>
  );
}
