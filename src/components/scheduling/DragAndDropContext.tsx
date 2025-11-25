// src/components/scheduling/DragAndDropContext.tsx
import { DndContext, DragEndEvent, DragOverlay, UniqueIdentifier, Active, DragStartEvent, PointerSensor, useSensor, useSensors } from "@dnd-kit/core";
import { useState } from "react";
import { useApp } from "../../store";
import { PumpCard } from "../kanban/PumpCard";
import { CalendarEvent } from "./CalendarEvent";
import { Pump } from "../../types";
import { isValidScheduleDate, CalendarStageEvent } from "../../lib/schedule";
import { toast } from "sonner";
import { startOfDay, format, parse } from "date-fns";

interface DragAndDropContextProps {
  children: React.ReactNode;
  pumps: Pump[];
}

interface DragData {
  pump?: Pump;
  type?: string;
  event?: CalendarStageEvent;
  pumpId?: string;
}

export function DragAndDropContext({ children, pumps }: DragAndDropContextProps) {
  // Require 5px movement before drag starts to prevent accidental drags
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    })
  );
  const schedulePump = useApp((state) => state.schedulePump);
  const clearSchedule = useApp((state) => state.clearSchedule);
  const collapsedCards = useApp((state) => state.collapsedCards);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [activeData, setActiveData] = useState<DragData | null>(null);

  const normalizePumpId = (id: UniqueIdentifier) => {
    const idString = id.toString();
    return idString.startsWith("unscheduled-") ? idString.replace("unscheduled-", "") : idString;
  };

  const getPumpFromActive = (active: Active) => {
    const dataPump = active.data?.current?.pump as Pump | undefined;
    if (dataPump) return dataPump;

    const pumpId = active.data?.current?.pumpId as string | undefined;
    if (pumpId) return pumps.find(p => p.id === pumpId);

    const normalizedId = normalizePumpId(active.id);
    return pumps.find((p) => p.id === normalizedId);
  };

  const handleDragStart = (event: DragStartEvent) => {
    const pump = getPumpFromActive(event.active);
    const normalizedId = pump?.id ?? normalizePumpId(event.active.id);
    setActiveId(normalizedId);
    setActiveData((event.active.data.current as DragData) || null);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over) {
      setActiveId(null);
      setActiveData(null);
      return;
    }

    const pump = getPumpFromActive(active);

    if (!pump) {
      setActiveId(null);
      setActiveData(null);
      return;
    }

    // Handle drop on Backlog (Unschedule)
    if (over.id === "backlog-dock") {
      if (pump.stage === "QUEUE" && !pump.scheduledStart) {
        // Already unscheduled, do nothing
        setActiveId(null);
        setActiveData(null);
        return;
      }

      clearSchedule(pump.id);
      toast.success(`Unscheduled ${pump.model}`);
      setActiveId(null);
      setActiveData(null);
      return;
    }

    // Handle drop on Calendar (Schedule/Reschedule)
    const targetDate = over.id?.toString();
    if (!targetDate) {
      setActiveId(null);
      setActiveData(null);
      return;
    }

    // If dragging from backlog, check if already scheduled (shouldn't happen with new logic but good safety)
    if (active.data.current?.type !== "CALENDAR_EVENT" && pump.stage !== "QUEUE") {
      toast.error(`Already in ${pump.stage}—move it in Kanban instead?`);
      setActiveId(null);
      setActiveData(null);
      return;
    }

    const dropDate = startOfDay(parse(targetDate, "yyyy-MM-dd", new Date()));
    if (!isValidScheduleDate(dropDate)) {
      toast.error("Choose a future date to schedule this pump.");
      setActiveId(null);
      setActiveData(null);
      return;
    }

    schedulePump(pump.id, format(dropDate, "yyyy-MM-dd"));

    const action = active.data.current?.type === "CALENDAR_EVENT" ? "Rescheduled" : "Scheduled";
    toast.success(`${action} ${pump.model} starting on ${dropDate.toLocaleDateString()}`);

    setActiveId(null);
    setActiveData(null);
  };

  const activePump = pumps.find((p) => p.id === activeId);

  const renderDragOverlay = () => {
    if (!activePump) return null;

    // If dragging a calendar event, show the compact event card
    if (activeData?.type === "CALENDAR_EVENT" && activeData.event) {
      return (
        <DragOverlay>
          <div className="w-[150px] opacity-90">
            <CalendarEvent event={activeData.event} onClick={() => { }} isDragging />
          </div>
        </DragOverlay>
      );
    }

    return (
      <DragOverlay>
        <div className="w-[268px] opacity-80">
          <PumpCard
            pump={activePump}
            collapsed={collapsedCards}
            draggableConfig={{ id: `overlay-${activePump.id}`, disabled: true }}
          />
        </div>
      </DragOverlay>
    );
  };

  return (
    <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      {children}
      {renderDragOverlay()}
    </DndContext>
  );
}
