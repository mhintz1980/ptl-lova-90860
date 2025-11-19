import {
  Area,
  AreaChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useBrandColors } from "../useBrandColors";

const SAMPLE_SERIES = [
  { label: "01 Feb", dev: 1500, design: 643 },
  { label: "02 Feb", dev: 1418, design: 413 },
  { label: "03 Feb", dev: 1456, design: 765 },
  { label: "04 Feb", dev: 1526, design: 412 },
  { label: "05 Feb", dev: 1356, design: 1423 },
  { label: "06 Feb", dev: 1256, design: 1731 },
];

export interface LineAreaChartProps {
  data?: typeof SAMPLE_SERIES;
  className?: string;
}

export function LineAreaChart({
  data = SAMPLE_SERIES,
  className,
}: LineAreaChartProps) {
  const [primary, secondary] = useBrandColors();

  return (
    <div className={className}>
      <ResponsiveContainer width="100%" height={320}>
        <AreaChart data={data}>
          <defs>
            <linearGradient id="devGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={primary} stopOpacity={0.55} />
              <stop offset="95%" stopColor={primary} stopOpacity={0} />
            </linearGradient>
            <linearGradient id="designGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={secondary} stopOpacity={0.55} />
              <stop offset="95%" stopColor={secondary} stopOpacity={0} />
            </linearGradient>
          </defs>
          <XAxis
            dataKey="label"
            axisLine={false}
            tickLine={false}
            tick={{ fill: "var(--color-fg-muted)", fontSize: 12 }}
          />
          <YAxis hide />
          <Tooltip
            contentStyle={{
              borderRadius: "12px",
              border: "1px solid var(--color-border-muted)",
            }}
            formatter={(value: number) => `$${value.toLocaleString()}`}
          />
          <Area
            type="monotone"
            dataKey="dev"
            stroke={primary}
            strokeWidth={3}
            fill="url(#devGradient)"
            name="Developer Edition"
          />
          <Area
            type="monotone"
            dataKey="design"
            stroke={secondary}
            strokeWidth={3}
            fill="url(#designGradient)"
            name="Designer Edition"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
