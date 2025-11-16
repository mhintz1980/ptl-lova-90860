import { useState } from "react";
import { BacklogDock } from "./BacklogDock";
import { DragAndDropContext } from "./DragAndDropContext";
import { CalendarHeader } from "./CalendarHeader";
import { MainCalendarGrid } from "./MainCalendarGrid";
import { EventDetailPanel } from "./EventDetailPanel";
import type { CalendarStageEvent } from "../../lib/schedule";
import type { Pump } from "../../types";
import { useApp } from "../../store";

interface SchedulingViewProps {
  pumps: Pump[];
}

export function SchedulingView({ pumps }: SchedulingViewProps) {
  const collapsedCards = useApp((state) => state.collapsedCards);
  const schedulingStageFilters = useApp((state) => state.schedulingStageFilters);
  const [selectedEvent, setSelectedEvent] = useState<CalendarStageEvent | null>(
    null
  );

  const handleEventClick = (event: CalendarStageEvent) => {
    setSelectedEvent(event);
  };

  return (
    <DragAndDropContext pumps={pumps}>
      <div
        className="flex min-h-[calc(100vh-160px)] flex-col gap-4"
        data-testid="scheduling-view"
      >
        <CalendarHeader />
        <div className="flex flex-1 gap-4 overflow-hidden">
          <BacklogDock pumps={pumps} collapsed={collapsedCards} />
          <div className="flex flex-1 overflow-hidden">
            <MainCalendarGrid
              pumps={pumps}
              visibleStages={schedulingStageFilters}
              onEventClick={handleEventClick}
            />
            {selectedEvent && (
              <EventDetailPanel
                event={selectedEvent}
                onClose={() => setSelectedEvent(null)}
              />
            )}
          </div>
        </div>
      </div>
    </DragAndDropContext>
  );
}
