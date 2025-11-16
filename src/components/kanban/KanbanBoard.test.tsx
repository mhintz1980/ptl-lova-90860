import { describe, it, expect, vi } from "vitest";
import { render } from "@testing-library/react";
import type { Pump } from "../../types";
import type { ReactNode } from "react";
import { useApp } from "../../store";

vi.mock("@dnd-kit/core", () => ({
  DndContext: ({ children }: { children: ReactNode }) => <div data-testid="dnd-context">{children}</div>,
  DragOverlay: ({ children }: { children: ReactNode }) => <div data-testid="drag-overlay">{children}</div>,
  useSensor: vi.fn(() => ({})),
  useSensors: vi.fn(() => []),
  useDroppable: vi.fn(() => ({ setNodeRef: vi.fn(), isOver: false })),
  useDraggable: vi.fn(() => ({
    attributes: {},
    listeners: {},
    setNodeRef: vi.fn(),
    transform: null,
    isDragging: false,
  })),
  PointerSensor: vi.fn(),
}));

import { KanbanBoard } from "./KanbanBoard";

const samplePumps: Pump[] = [
  {
    id: "pump-1",
    serial: 1001,
    po: "PO-001",
    customer: "Customer A",
    model: "Model X",
    stage: "NOT STARTED",
    priority: "Normal",
    last_update: new Date().toISOString(),
    value: 5000,
  },
];

describe("KanbanBoard", () => {
  it("uses the dark scrollbar styling for the horizontal scroll area", () => {
    const { container } = render(
      <KanbanBoard pumps={samplePumps} collapsed={false} />
    );

    const scrollArea = container.querySelector(".flex.h-full.gap-4");

    expect(scrollArea).not.toBeNull();
    expect(scrollArea?.className).toContain("scrollbar-themed");
  });

  it("flags overloaded stages via header attribute", () => {
    useApp.setState((state) => ({
      wipLimits: {
        ...state.wipLimits,
        FABRICATION: 1,
        ASSEMBLY: 5,
      },
    }));

    const pumps: Pump[] = [
      {
        ...samplePumps[0],
        id: "fab-1",
        stage: "FABRICATION",
      },
      {
        ...samplePumps[0],
        id: "fab-2",
        stage: "FABRICATION",
      },
      {
        ...samplePumps[0],
        id: "assembly-1",
        stage: "ASSEMBLY",
      },
    ];

    const { container } = render(
      <KanbanBoard pumps={pumps} collapsed={false} />
    );

    const fabricationHeader = container.querySelector('[data-stage-header="FABRICATION"]');
    expect(fabricationHeader).not.toBeNull();
    expect(fabricationHeader?.getAttribute("data-over-limit")).toBe("true");
  });
});
