import {
  Bar,
  BarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { STAGE_SEQUENCE } from "../../../lib/stage-constants";
import type { ChartProps } from "../../../dashboard/config";
import { filterPumpsForDashboard } from "./filtering";

const DISPLAY_STAGES = STAGE_SEQUENCE.filter(
  (stage) => stage !== "UNSCHEDULED"
);

export function WipByStageChart({ pumps, filters, onDrilldown }: ChartProps) {
  const filtered = filterPumpsForDashboard(pumps, filters);
  const data = DISPLAY_STAGES.map((stage) => ({
    stage,
    count: filtered.filter((pump) => pump.stage === stage).length,
  })).filter((entry) => entry.count > 0);

  return (
    <div className="space-y-3" aria-label="WIP by stage chart">
      <ResponsiveContainer width="100%" height={220}>
        <BarChart
          data={data}
          margin={{ top: 10, right: 0, bottom: 10, left: 0 }}
          barCategoryGap={16}
        >
          <XAxis dataKey="stage" tick={{ fontSize: 10 }} />
          <YAxis allowDecimals={false} />
          <Tooltip />
          <Bar
            dataKey="count"
            fill="hsl(var(--chart-1))"
            radius={[4, 4, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
      <div className="flex flex-wrap gap-2">
        {data.map(({ stage, count }) => (
          <button
            key={stage}
            type="button"
            data-testid={`stage-chip-${stage}`}
            className="rounded-full border border-border/60 px-3 py-1 text-xs font-semibold text-muted-foreground transition-colors hover:border-primary/50 hover:bg-primary/10 hover:text-primary"
            onClick={() => onDrilldown({ stage })}
          >
            {stage} · {count}
          </button>
        ))}
        {!data.length && (
          <span className="text-sm text-muted-foreground">
            No pumps match the current filters.
          </span>
        )}
      </div>
    </div>
  );
}
