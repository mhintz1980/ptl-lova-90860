import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useBrandColors } from "../useBrandColors";

const SAMPLE_DATA = [
  { label: "Mon", expedite: 231, standard: 232 },
  { label: "Tue", expedite: 122, standard: 113 },
  { label: "Wed", expedite: 63, standard: 341 },
  { label: "Thu", expedite: 421, standard: 224 },
  { label: "Fri", expedite: 122, standard: 522 },
  { label: "Sat", expedite: 323, standard: 411 },
  { label: "Sun", expedite: 111, standard: 243 },
];

export interface ColumnChartProps {
  data?: typeof SAMPLE_DATA;
  className?: string;
  showLegend?: boolean;
}

export function ColumnChart({
  data = SAMPLE_DATA,
  className,
  showLegend = true,
}: ColumnChartProps) {
  const [primary, secondary] = useBrandColors();

  return (
    <div className={className}>
      <ResponsiveContainer width="100%" height={320}>
        <BarChart data={data} barCategoryGap="16%" maxBarSize={40}>
          <CartesianGrid vertical={false} strokeDasharray="3 3" />
          <XAxis
            dataKey="label"
            tickLine={false}
            axisLine={false}
            tick={{ fontSize: 12, fill: "var(--color-fg-muted)", dy: 8 }}
          />
          <YAxis hide />
          <Tooltip
            cursor={{ fill: "var(--color-bg-muted)" }}
            contentStyle={{
              borderRadius: "12px",
              border: "1px solid var(--color-border-muted)",
            }}
          />
          {showLegend && (
            <text y={0}>
              {/* Legend handled by custom markup below */}
            </text>
          )}
          <Bar dataKey="expedite" name="Expedite" fill={primary} radius={8} />
          <Bar
            dataKey="standard"
            name="Standard"
            fill={secondary}
            radius={8}
          />
        </BarChart>
      </ResponsiveContainer>
      {showLegend && (
        <div className="mt-4 flex flex-wrap gap-4 text-sm text-muted-foreground">
          <LegendSwatch color={primary} label="Expedite" />
          <LegendSwatch color={secondary} label="Standard" />
        </div>
      )}
    </div>
  );
}

function LegendSwatch({ color, label }: { color: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-2">
      <span
        className="h-2.5 w-6 rounded-full"
        style={{ backgroundColor: color }}
      />
      {label}
    </span>
  );
}
