// src/components/dashboard/TrendChart.tsx
import React from "react";
import { Pump } from "../../types";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/Card";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { round } from "../../lib/format";
import { ChartProps, DashboardFilters } from "./dashboardConfig";
import { useApp } from "../../store";
import { applyDashboardFilters } from "./utils";

interface TrendChartProps {
  pumps: Pump[];
  headless?: boolean;
  onDrilldown?: (update: Partial<DashboardFilters>) => void;
}

interface TrendTooltipProps {
  active?: boolean;
  payload?: Array<{
    value: number;
    payload: {
      count: number;
    };
  }>;
  label?: string;
}

function getWeekNumber(date: Date): string {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + 4 - (d.getDay() || 7));
  const yearStart = new Date(d.getFullYear(), 0, 1);
  const weekNo = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  return `W${weekNo}`;
}

function diffDays(pump: Pump): number {
  if (!pump.scheduledEnd) return 0;
  const start = new Date(pump.last_update);
  const end = new Date(pump.scheduledEnd);
  return Math.abs((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
}

interface ChartClickData {
  activePayload?: Array<{
    payload: unknown;
  }>;
}

export const TrendChart: React.FC<TrendChartProps> = ({ pumps, headless, onDrilldown }) => {
  const weeklyData = React.useMemo(() => {
    const closed = pumps.filter(p => p.stage === "CLOSED" && p.scheduledEnd);

    const weeklyStats = closed.reduce((acc, pump) => {
      const week = getWeekNumber(new Date(pump.last_update));
      const buildTime = diffDays(pump);

      if (!acc[week]) {
        acc[week] = { total: 0, count: 0, week };
      }
      acc[week].total += buildTime;
      acc[week].count += 1;
      return acc;
    }, {} as Record<string, { total: number; count: number; week: string }>);

    // Convert to array and sort by week
    return Object.values(weeklyStats)
      .map(stat => ({
        week: stat.week,
        avgDays: round(stat.total / stat.count, 1),
        count: stat.count
      }))
      .sort((a, b) => {
        // Sort by week number (W1, W2, etc.)
        const weekA = parseInt(a.week.substring(1));
        const weekB = parseInt(b.week.substring(1));
        return weekA - weekB;
      });
  }, [pumps]);

  const CustomTooltip = ({ active, payload, label }: TrendTooltipProps) => {
    if (active && payload && payload[0]) {
      return (
        <div className="bg-popover border border-border rounded-md shadow-lg p-2">
          <p className="text-sm font-medium">{label}</p>
          <p className="text-sm text-muted-foreground">
            Avg: {payload[0].value} days
          </p>
          <p className="text-xs text-muted-foreground">
            {payload[0].payload.count} pumps completed
          </p>
        </div>
      );
    }
    return null;
  };

  const Content = weeklyData.length > 0 ? (
    <ResponsiveContainer width="100%" height={headless ? "100%" : 240}>
      <AreaChart
        data={weeklyData}
        margin={{ top: 0, right: 0, left: 0, bottom: 40 }}
        onClick={(data) => {
          const chartData = data as ChartClickData;
          if (onDrilldown && chartData && chartData.activePayload && chartData.activePayload[0]) {
            // Just trigger the next view without specific filter for now
            onDrilldown({});
          }
        }}
      >
        <defs>
          <linearGradient id="colorAvgDays" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.8} />
            <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0.1} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" className="stroke-border/30" />
        <XAxis
          dataKey="week"
          tick={{ fontSize: 10 }}
          className="fill-muted-foreground"
        />
        <YAxis
          tick={{ fontSize: 10 }}
          className="fill-muted-foreground"
          label={{ value: 'Days', angle: -90, position: 'insideLeft', style: { fontSize: 10 } }}
        />
        <Tooltip content={<CustomTooltip />} />
        <Area
          type="monotone"
          dataKey="avgDays"
          stroke="hsl(var(--primary))"
          strokeWidth={2}
          fill="url(#colorAvgDays)"
          animationBegin={0}
          animationDuration={800}
        />
      </AreaChart>
    </ResponsiveContainer>
  ) : (
    <div className="h-[240px] flex items-center justify-center text-muted-foreground">
      <p className="text-sm">No completed pumps with build time data</p>
    </div>
  );

  if (headless) {
    return <div className="h-full w-full">{Content}</div>;
  }

  return (
    <Card className="layer-l1">
      <CardHeader>
        <CardTitle className="text-lg">Build Time Trend</CardTitle>
      </CardHeader>
      <CardContent>
        {Content}
      </CardContent>
    </Card>
  );
};

export const LeadTimeTrendChart: React.FC<ChartProps> = ({ filters, onDrilldown }) => {
  const pumps = useApp((state) => state.pumps);
  const filteredPumps = React.useMemo(() => applyDashboardFilters(pumps, filters), [pumps, filters]);
  return <TrendChart pumps={filteredPumps} headless={true} onDrilldown={onDrilldown} />;
};
