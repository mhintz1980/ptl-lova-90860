import React from "react";
import { Pump, Stage } from "../../types";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/Card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { ChartProps, DashboardFilters } from "./dashboardConfig";
import { useApp } from "../../store";
import { applyDashboardFilters } from "./utils";
import { isAfter, parseISO } from "date-fns";

interface LateOrdersChartProps {
    pumps: Pump[];
    headless?: boolean;
    onDrilldown?: (update: Partial<DashboardFilters>) => void;
}

const getLateOrdersByStage = (pumps: Pump[]) => {
    const now = new Date();
    const latePumps = pumps.filter(p => {
        if (p.stage === 'CLOSED' || !p.promiseDate) return false;
        const promise = parseISO(p.promiseDate);
        return isAfter(now, promise);
    });

    const stages: Stage[] = [
        "QUEUE",
        "FABRICATION",
        "POWDER COAT",
        "ASSEMBLY",
        "TESTING",
        "SHIPPING"
    ];

    return stages.map(stage => {
        const count = latePumps.filter(p => p.stage === stage).length;
        return {
            stage,
            count,
            displayName: stage
        };
    }).filter(d => d.count > 0); // Only show stages with late orders
};

const getStageColor = (stage: string) => {
    const colors: Record<string, string> = {
        "QUEUE": "hsl(var(--muted-foreground))",
        "FABRICATION": "hsl(var(--chart-1))",
        "POWDER COAT": "hsl(var(--chart-2))",
        "ASSEMBLY": "hsl(var(--chart-3))",
        "TESTING": "hsl(var(--chart-4))",
        "SHIPPING": "hsl(var(--chart-5))",
    };
    return colors[stage] || "hsl(var(--primary))";
};

interface TooltipProps {
    active?: boolean;
    payload?: Array<{
        payload: {
            displayName: string;
            count: number;
        };
    }>;
}

const CustomTooltip = ({ active, payload }: TooltipProps) => {
    if (active && payload && payload[0]) {
        const data = payload[0].payload;
        return (
            <div className="bg-popover border border-border rounded-md shadow-lg p-3 space-y-1">
                <p className="text-sm font-medium">{data.displayName}</p>
                <p className="text-xs text-muted-foreground">
                    {data.count} {data.count === 1 ? 'late order' : 'late orders'}
                </p>
            </div>
        );
    }
    return null;
};

interface ChartClickData {
    activePayload?: Array<{
        payload: {
            displayName: string;
        };
    }>;
}

export const LateOrdersChart: React.FC<LateOrdersChartProps> = ({ pumps, headless, onDrilldown }) => {
    const data = React.useMemo(() => getLateOrdersByStage(pumps), [pumps]);

    const Content = data.length > 0 ? (
        <ResponsiveContainer width="100%" height={headless ? "100%" : 240}>
            <BarChart
                data={data}
                margin={{ top: 0, right: 0, left: 0, bottom: 40 }}
                onClick={(data) => {
                    const chartData = data as ChartClickData;
                    if (onDrilldown && chartData && chartData.activePayload && chartData.activePayload[0]) {
                        const stage = chartData.activePayload[0].payload.displayName as Stage;
                        onDrilldown({ stage });
                    }
                }}
            >
                <CartesianGrid strokeDasharray="3 3" className="stroke-border/30" />
                <XAxis
                    dataKey="stage"
                    tick={{ fontSize: 10 }}
                    className="fill-muted-foreground"
                    interval={0}
                    angle={-45}
                    textAnchor="end"
                />
                <YAxis
                    tick={{ fontSize: 10 }}
                    className="fill-muted-foreground"
                    allowDecimals={false}
                />
                <Tooltip content={<CustomTooltip />} />
                <Bar
                    dataKey="count"
                    radius={[4, 4, 0, 0]}
                    animationBegin={0}
                    animationDuration={800}
                    className="cursor-pointer"
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
    ) : (
        <div className="h-[240px] flex items-center justify-center text-muted-foreground">
            <p className="text-sm">No late orders</p>
        </div>
    );

    if (headless) {
        return <div className="h-full w-full">{Content}</div>;
    }

    return (
        <Card className="layer-l1">
            <CardHeader>
                <CardTitle className="text-lg">Late Orders by Stage</CardTitle>
            </CardHeader>
            <CardContent>
                {Content}
            </CardContent>
        </Card>
    );
};

export const LateOrdersChartWrapper: React.FC<ChartProps> = ({ filters, onDrilldown }) => {
    const pumps = useApp((state) => state.pumps);
    const filteredPumps = React.useMemo(() => applyDashboardFilters(pumps, filters), [pumps, filters]);
    return <LateOrdersChart pumps={filteredPumps} headless={true} onDrilldown={onDrilldown} />;
};
