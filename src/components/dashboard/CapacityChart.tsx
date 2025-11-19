// src/components/dashboard/CapacityChart.tsx
import React from "react";
import { Pump, Stage } from "../../types";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/Card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";

interface CapacityChartProps {
  pumps: Pump[];
}

interface CapacityTooltipProps {
  active?: boolean;
  payload?: Array<{
    payload: {
      displayName: string;
      count: number;
      value: number;
    };
  }>;
}

const STAGE_ORDER: Stage[] = [
  "NOT STARTED",
  "FABRICATION",
  "POWDER COAT",
  "ASSEMBLY",
  "TESTING",
  "SHIPPING",
  "CLOSED"
];

const getStageCapacity = (pumps: Pump[]) => {
  const stageCounts = STAGE_ORDER.map(stage => {
    const count = pumps.filter(p => p.stage === stage).length;
    const totalValue = pumps
      .filter(p => p.stage === stage)
      .reduce((sum, p) => sum + p.value, 0);

    return {
      stage: stage.replace(' ', '\n'),
      count,
      value: totalValue,
      displayName: stage
    };
  });

  return stageCounts;
};

const getStageColor = (stage: Stage) => {
  const colors: Record<Stage, string> = {
    "UNSCHEDULED": "hsl(var(--muted-foreground))",
    "NOT STARTED": "hsl(var(--muted-foreground))",
    "FABRICATION": "hsl(var(--chart-1))",
    "POWDER COAT": "hsl(var(--chart-2))",
    "ASSEMBLY": "hsl(var(--chart-3))",
    "TESTING": "hsl(var(--chart-4))",
    "SHIPPING": "hsl(var(--chart-5))",
    "CLOSED": "hsl(var(--primary))",
  };
  return colors[stage];
};

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

const CustomTooltip = ({ active, payload }: CapacityTooltipProps) => {
  if (active && payload && payload[0]) {
    const data = payload[0].payload;
    return (
      <div className="bg-popover border border-border rounded-md shadow-lg p-3 space-y-1">
        <p className="text-sm font-medium">{data.displayName}</p>
        <p className="text-xs text-muted-foreground">
          {data.count} {data.count === 1 ? 'pump' : 'pumps'}
        </p>
        <p className="text-xs font-semibold text-primary">
          {formatCurrency(data.value)}
        </p>
      </div>
    );
  }
  return null;
};

export const CapacityChart: React.FC<CapacityChartProps> = ({ pumps }) => {
  const data = React.useMemo(() => getStageCapacity(pumps), [pumps]);

  return (
    <Card className="layer-l1">
        <CardHeader>
          <CardTitle className="text-lg">Production Capacity by Stage</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart
              data={data}
              margin={{ top: 0, right: 0, left: 0, bottom: 40 }}
            >
              <CartesianGrid strokeDasharray="3 3" className="stroke-border/30" />
              <XAxis
                dataKey="stage"
                tick={{ fontSize: 10 }}
                className="fill-muted-foreground"
              />
              <YAxis
                tick={{ fontSize: 10 }}
                className="fill-muted-foreground"
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar
                dataKey="count"
                radius={[4, 4, 0, 0]}
                animationBegin={0}
                animationDuration={800}
              >
                {data.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={getStageColor(entry.displayName)}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
  );
};
