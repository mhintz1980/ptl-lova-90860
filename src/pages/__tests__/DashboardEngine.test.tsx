import { describe, expect, it, vi, beforeEach } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { DashboardEngine } from "../DashboardEngine";

const chartRenderSpy = vi.fn();

vi.mock("../../dashboard/config", () => {
  const ChartStub = ({ filters, onDrilldown }: any) => {
    chartRenderSpy(filters);
    return (
      <button
        data-testid="chart-stub"
        onClick={() => onDrilldown({ stage: "FABRICATION" })}
      >
        chart
      </button>
    );
  };

  return {
    CHART_REGISTRY: {
      sampleChart: {
        id: "sampleChart",
        title: "Sample Chart",
        description: "Example chart",
        component: ChartStub,
      },
      otherChart: {
        id: "otherChart",
        title: "Other Chart",
        component: ChartStub,
      },
    },
    TOPIC_CONFIGS: [
      { id: "production", label: "Production Overview", chartIds: ["sampleChart"] },
      { id: "schedule", label: "Schedule & Lead Times", chartIds: ["otherChart"] },
    ],
  };
});

vi.mock("../../store", () => {
  const pumps = [
    {
      id: "pump-1",
      serial: 1000,
      po: "PO-1",
      customer: "Acme",
      model: "DD-4S",
      stage: "FABRICATION",
      priority: "Normal",
      last_update: "2024-01-01T00:00:00.000Z",
      value: 20000,
    },
  ];

  return {
    useApp: (selector: (state: any) => any) =>
      selector({
        filtered: () => pumps,
      }),
  };
});

describe("DashboardEngine", () => {
  beforeEach(() => {
    chartRenderSpy.mockClear();
  });

  it("renders current topic label and charts", () => {
    render(<DashboardEngine />);
    expect(
      screen.getByRole("heading", { name: /production overview/i })
    ).toBeTruthy();
    expect(screen.getByText(/sample chart/i)).toBeTruthy();
  });

  it("cycles to next topic when pressing Next Topic", () => {
    render(<DashboardEngine />);
    const nextButtons = screen.getAllByRole("button", { name: /next topic/i });
    fireEvent.click(nextButtons[0]);
    expect(
      screen.getByRole("heading", { name: /schedule & lead times/i })
    ).toBeTruthy();
  });

  it("propagates drilldown updates to charts", () => {
    render(<DashboardEngine />);
    expect(chartRenderSpy).toHaveBeenCalled();
    const drillButtons = screen.getAllByTestId("chart-stub");
    fireEvent.click(drillButtons[0]);
    const latestFilters = chartRenderSpy.mock.calls.at(-1)[0];
    expect(latestFilters.stage).toBe("FABRICATION");
  });
});
