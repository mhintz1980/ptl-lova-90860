import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import type { Pump } from "../../../types";
import { WipByStageChart } from "./WipByStageChart";
import { PumpsByCustomerChart } from "./PumpsByCustomerChart";

vi.mock("../../charts/HoverAnimatedPieChart", () => ({
  HoverAnimatedPieChart: () => null,
}));

const baseFilters = { dateRange: { from: null, to: null } } as const;

const buildPump = (overrides: Partial<Pump>): Pump => ({
  id: overrides.id ?? Math.random().toString(36),
  serial: overrides.serial ?? 1000,
  po: overrides.po ?? "PO-1",
  customer: overrides.customer ?? "Acme",
  model: overrides.model ?? "DD-4S",
  stage: overrides.stage ?? "FABRICATION",
  priority: overrides.priority ?? "Normal",
  last_update: overrides.last_update ?? "2024-01-01T00:00:00.000Z",
  value: overrides.value ?? 10_000,
  scheduledEnd: overrides.scheduledEnd,
  scheduledStart: overrides.scheduledStart,
  powder_color: overrides.powder_color,
  promiseDate: overrides.promiseDate,
});

beforeAll(() => {
  vi.stubGlobal(
    "ResizeObserver",
    class {
      observe() {}
      unobserve() {}
      disconnect() {}
    }
  );
  vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockReturnValue({
    width: 400,
    height: 300,
    top: 0,
    left: 0,
    bottom: 300,
    right: 400,
    x: 0,
    y: 0,
    toJSON() {
      return {};
    },
  } as DOMRect);
});

afterAll(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe("dashboard chart drilldowns", () => {
  it("WipByStageChart emits stage drilldown events", () => {
    const pumps = [
      buildPump({ id: "a", stage: "FABRICATION" }),
      buildPump({ id: "b", stage: "ASSEMBLY" }),
    ];
    const handleDrilldown = vi.fn();

    render(
      <WipByStageChart
        pumps={pumps}
        filters={{ ...baseFilters }}
        onDrilldown={handleDrilldown}
      />
    );

    fireEvent.click(screen.getByTestId("stage-chip-FABRICATION"));
    expect(handleDrilldown).toHaveBeenCalledWith({ stage: "FABRICATION" });
  });

  it("PumpsByCustomerChart emits customerId drilldown events", () => {
    const pumps = [
      buildPump({ id: "a", customer: "Acme", stage: "FABRICATION" }),
      buildPump({ id: "b", customer: "Sunbelt", stage: "FABRICATION" }),
      buildPump({ id: "c", customer: "Sunbelt", stage: "FABRICATION" }),
    ];
    const handleDrilldown = vi.fn();

    render(
      <PumpsByCustomerChart
        pumps={pumps}
        filters={{ ...baseFilters }}
        onDrilldown={handleDrilldown}
      />
    );

    fireEvent.click(screen.getByTestId("customer-chip-Sunbelt"));
    expect(handleDrilldown).toHaveBeenCalledWith({ customerId: "Sunbelt" });
  });
});
