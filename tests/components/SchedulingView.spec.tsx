import { beforeEach, describe, expect, it, vi } from "vitest";
import type { ReactNode } from "react";
import { render, screen } from "@testing-library/react";
import { SchedulingView } from "../../src/components/scheduling/SchedulingView";
import type { Pump } from "../../src/types";

const calendarSpy = vi.fn();

vi.mock("../../src/components/scheduling/SchedulingSidebar", () => ({
  SchedulingSidebar: () => <aside data-testid="sidebar-mock" />,
}));

vi.mock("../../src/components/scheduling/DragAndDropContext", () => ({
  DragAndDropContext: ({ children }: { children: ReactNode }) => (
    <div data-testid="drag-context-mock">{children}</div>
  ),
}));

vi.mock("../../src/components/scheduling/CalendarHeader", () => ({
  CalendarHeader: () => <div data-testid="calendar-header-mock" />,
}));

vi.mock("../../src/components/scheduling/MainCalendarGrid", () => ({
  MainCalendarGrid: ({ pumps }: { pumps: Pump[] }) => {
    calendarSpy(pumps);
    return (
      <div data-testid="calendar-grid-mock">
        {pumps.map((pump) => pump.id).join(",")}
      </div>
    );
  },
}));

describe("SchedulingView", () => {
  beforeEach(() => {
    calendarSpy.mockClear();
  });

  it("passes the provided pumps to the calendar grid", () => {
    const pumps: Pump[] = [
      {
        id: "pump-a",
        serial: 1001,
        po: "PO-1",
        customer: "ACME",
        model: "DD-6",
        stage: "FABRICATION",
        priority: "Normal",
        last_update: "2025-01-01T00:00:00.000Z",
        value: 12345,
        forecastStart: "2025-01-10T00:00:00.000Z",
        forecastEnd: "2025-01-15T00:00:00.000Z",
      },
      {
        id: "pump-b",
        serial: 1002,
        po: "PO-2",
        customer: "ACME",
        model: "DD-8",
        stage: "ASSEMBLY",
        priority: "High",
        last_update: "2025-01-02T00:00:00.000Z",
        value: 54321,
        forecastStart: "2025-01-11T00:00:00.000Z",
        forecastEnd: "2025-01-16T00:00:00.000Z",
      },
    ];

    render(<SchedulingView pumps={pumps} />);

    const grid = screen.getByTestId("calendar-grid-mock");
    expect(grid.textContent).toBe("pump-a,pump-b");
    expect(calendarSpy).toHaveBeenCalledWith(pumps);
  });
});
