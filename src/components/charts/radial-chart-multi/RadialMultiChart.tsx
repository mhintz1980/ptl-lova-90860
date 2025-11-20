import { RadialBar, RadialBarChart, ResponsiveContainer } from "recharts";
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
        </RadialBarChart>
      </ResponsiveContainer>
      <RadialLegend items={chartData} />
    </div>
  );
}

function RadialLegend({ items }: { items: Array<{ name: string; value: number; fill: string }> }) {
  if (!items.length) return null;
  return (
    <ul className="mt-3 flex flex-col gap-2 text-sm text-muted-foreground">
      {items.map((item) => (
        <li key={item.name}>
          <button
            type="button"
            className="flex w-full items-center justify-between rounded-full border border-border/50 bg-card/60 px-3 py-2 text-left transition-transform duration-150 ease-out hover:scale-[1.02] active:scale-[0.98] hover:shadow-[0_10px_30px_rgba(59,130,246,0.25)]"
          >
            <span className="flex items-center gap-2">
              <span
                className="h-2.5 w-6 rounded-full"
                style={{ backgroundColor: item.fill }}
              />
              {item.name}
            </span>
            <span className="text-xs text-muted-foreground">{item.value}%</span>
          </button>
        </li>
      ))}
    </ul>
  );
}
