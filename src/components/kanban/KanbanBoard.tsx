// src/components/kanban/KanbanBoard.tsx
import { useState, useMemo } from "react";
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { Pump, Stage } from "../../types";
import { StageColumn } from "./StageColumn";
import { PumpCard } from "./PumpCard";
import { useApp } from "../../store";
import { toast } from "sonner";

const STAGES: Stage[] = [
  "NOT STARTED",
  "FABRICATION",
  "POWDER COAT",
  "ASSEMBLY",
  "TESTING",
  "SHIPPING",
  "CLOSED",
];

interface KanbanBoardProps {
  pumps: Pump[];
  collapsed: boolean;
  onCardClick?: (pump: Pump) => void;
}

export function KanbanBoard({ pumps, collapsed, onCardClick }: KanbanBoardProps) {
  const moveStage = useApp((state) => state.moveStage);
  const [activePump, setActivePump] = useState<Pump | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const pumpsByStage = useMemo(() => {
    return STAGES.reduce((acc, stage) => {
      acc[stage] = pumps.filter((pump) => pump.stage === stage);
      return acc;
    }, {} as Record<Stage, Pump[]>);
  }, [pumps]);

  const handleDragStart = (event: DragStartEvent) => {
    const pump = pumps.find((p) => p.id === event.active.id);
    setActivePump(pump ?? null);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActivePump(null);

    const { active, over } = event;
    if (!over) return;

    const pumpId = active.id as string;
    const nextStage = (over.data?.current?.stage as Stage) ?? (over.id as Stage);
    const pump = pumps.find((p) => p.id === pumpId);

    if (pump && pump.stage !== nextStage) {
      moveStage(pumpId, nextStage);
      toast.success(`Moved ${pump.model} (Serial #${pump.serial}) to ${nextStage}`);
    }
  };

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="flex h-full min-h-full w-full gap-4 overflow-x-auto pb-8 pr-4 scrollbar-themed">
        {STAGES.map((stage) => (
          <StageColumn
            key={stage}
            stage={stage}
            pumps={pumpsByStage[stage] ?? []}
            collapsed={collapsed}
            onCardClick={onCardClick}
            activeId={activePump?.id}
          />
        ))}
      </div>

      <DragOverlay>
        {activePump ? (
          <PumpCard pump={activePump} collapsed={collapsed} isDragging />
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
