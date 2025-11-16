// src/components/scheduling/DragAndDropContext.tsx
import { DndContext, DragEndEvent, DragOverlay, UniqueIdentifier, Active, DragStartEvent } from "@dnd-kit/core";
import { useState } from "react";
import { useApp } from "../../store";
import { PumpCard } from "../kanban/PumpCard";
import { Pump } from "../../types";
import { isValidScheduleDate } from "../../lib/schedule";
import { toast } from "sonner";
import { startOfDay, format, parse } from "date-fns";

interface DragAndDropContextProps {
  children: React.ReactNode;
  pumps: Pump[];
}

export function DragAndDropContext({ children, pumps }: DragAndDropContextProps) {
  const schedulePump = useApp((state) => state.schedulePump);
  const collapsedCards = useApp((state) => state.collapsedCards);
  const [activeId, setActiveId] = useState<string | null>(null);

  const normalizePumpId = (id: UniqueIdentifier) => {
    const idString = id.toString();
    return idString.startsWith("unscheduled-") ? idString.replace("unscheduled-", "") : idString;
  };

  const getPumpFromActive = (active: Active) => {
    const dataPump = active.data?.current?.pump as Pump | undefined;
    if (dataPump) return dataPump;

    const normalizedId = normalizePumpId(active.id);
    return pumps.find((p) => p.id === normalizedId);
  };

  const handleDragStart = (event: DragStartEvent) => {
    const pump = getPumpFromActive(event.active);
    const normalizedId = pump?.id ?? normalizePumpId(event.active.id);
    setActiveId(normalizedId);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over) {
      setActiveId(null);
      return;
    }

    const pump = getPumpFromActive(active);
    const targetDate = over.id?.toString();

    if (!pump || !targetDate) {
      setActiveId(null);
      return;
    }

    // Guard against scheduling pumps already beyond NOT STARTED
    if (pump.stage !== "UNSCHEDULED") {
      toast.error(`Already in ${pump.stage}—move it in Kanban instead?`);
      setActiveId(null);
      return;
    }

    const dropDate = startOfDay(parse(targetDate, "yyyy-MM-dd", new Date()));
    if (!isValidScheduleDate(dropDate)) {
      toast.error("Choose a future date to schedule this pump.");
      setActiveId(null);
      return;
    }

    schedulePump(pump.id, format(dropDate, "yyyy-MM-dd"));

    toast.success(`Scheduled ${pump.model} starting on ${dropDate.toLocaleDateString()}`);

    setActiveId(null);
  };

  const activePump = pumps.find((p) => p.id === activeId);

  const renderDragOverlay = () => {
    if (!activePump) return null;

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
    <DndContext onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      {children}
      {renderDragOverlay()}
    </DndContext>
  );
}
