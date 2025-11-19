import {
  RadialBar,
  RadialBarChart,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { useBrandColors } from "../useBrandColors";

const SAMPLE = [
  { name: "Engineering", value: 38 },
  { name: "Production", value: 68 },
  { name: "Logistics", value: 52 },
];

export interface RadialMultiChartProps {
  data?: typeof SAMPLE;
  className?: string;
}

export function RadialMultiChart({
  data = SAMPLE,
  className,
}: RadialMultiChartProps) {
  const [primary, secondary] = useBrandColors();
  const palette = [primary, secondary, "hsl(var(--chart-3))"];

  const chartData = data.map((entry, index) => ({
    ...entry,
    fill: palette[index % palette.length],
  }));

  return (
    <div className={className} style={{ minWidth: 260 }}>
      <ResponsiveContainer width="100%" height={320}>
        <RadialBarChart
          data={chartData}
          innerRadius="20%"
          outerRadius="100%"
          startAngle={90}
          endAngle={-270}
        >
          <RadialBar
            background
            dataKey="value"
            label={{ position: "insideStart", fill: "#fff", fontSize: 12 }}
            isAnimationActive
            animationDuration={1200}
            animationEasing="ease-out"
          />
          <Legend
            iconSize={10}
            layout="vertical"
            verticalAlign="middle"
            align="right"
            formatter={(value: string, entry: any) =>
              `${value} · ${entry?.payload?.value || 0}%`
            }
          />
        </RadialBarChart>
      </ResponsiveContainer>
    </div>
  );
}
