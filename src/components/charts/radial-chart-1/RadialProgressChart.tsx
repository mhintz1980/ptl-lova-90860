import {
  RadialBar,
  RadialBarChart,
  ResponsiveContainer,
} from "recharts";
import { useBrandColors } from "../useBrandColors";

export interface RadialProgressChartProps {
  value?: number; // 0-100
  label?: string;
  className?: string;
}

export function RadialProgressChart({
  value = 72,
  label = "Completion",
  className,
}: RadialProgressChartProps) {
  const [primary] = useBrandColors();
  const data = [{ name: label, value }];

  return (
    <div className={className} style={{ minWidth: 220 }}>
      <ResponsiveContainer width="100%" height={260}>
        <RadialBarChart
          startAngle={90}
          endAngle={450}
          innerRadius="70%"
          outerRadius="100%"
          barSize={16}
          data={data}
        >
          <RadialBar
            background
            cornerRadius={20}
            dataKey="value"
            fill={primary}
            isAnimationActive
            animationDuration={1200}
            animationEasing="ease-out"
          />
          <text
            x="50%"
            y="50%"
            textAnchor="middle"
            dominantBaseline="middle"
            className="text-3xl font-semibold fill-foreground"
          >
            {value}%
          </text>
          <text
            x="50%"
            y="65%"
            textAnchor="middle"
            dominantBaseline="middle"
            className="text-sm fill-muted-foreground"
          >
            {label}
          </text>
        </RadialBarChart>
      </ResponsiveContainer>
    </div>
  );
}
