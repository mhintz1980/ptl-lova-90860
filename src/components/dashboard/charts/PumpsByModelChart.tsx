import type { ChartProps } from "../../../dashboard/config";
import { HoverAnimatedPieChart } from "../../charts/HoverAnimatedPieChart";
import { groupCounts } from "./filtering";

const COLORS = [
  "hsl(var(--chart-1))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
];

export function PumpsByModelChart({ pumps, filters, onDrilldown }: ChartProps) {
  const data = groupCounts(pumps, filters, (pump) => pump.model).slice(0, 8);

  return (
    <div className="space-y-3" aria-label="Pumps by model chart">
      <div style={{ minHeight: 260, minWidth: 320, width: "100%" }}>
        <HoverAnimatedPieChart
          data={data}
          dataKey="value"
          nameKey="name"
          colors={data.map((_, index) => COLORS[index % COLORS.length])}
          title="Pumps by Model"
          subtitle="Top active pump models"
          valueFormatter={(value, payload) =>
            `${value} units${payload.name ? ` · ${payload.name}` : ""}`
          }
        />
      </div>
      <div className="flex flex-wrap gap-2">
        {data.map(({ name, value }) => (
          <button
            key={name}
            type="button"
            className="rounded-full border border-border/60 px-3 py-1 text-xs font-semibold text-muted-foreground transition-colors hover:border-primary/50 hover:bg-primary/10 hover:text-primary"
            onClick={() => onDrilldown({ modelId: name })}
          >
            {name} · {value}
          </button>
        ))}
        {!data.length && (
          <span className="text-sm text-muted-foreground">
            No model data for the current filters.
          </span>
        )}
      </div>
    </div>
  );
}
