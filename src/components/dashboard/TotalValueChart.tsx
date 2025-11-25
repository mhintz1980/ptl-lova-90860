import React from "react";
import { Pump } from "../../types";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/Card";
import { ChartProps, DashboardFilters } from "./dashboardConfig";
import { useApp } from "../../store";
import { applyDashboardFilters } from "./utils";
import { formatCurrency } from "../../lib/format";

interface TotalValueChartProps {
    pumps: Pump[];
    headless?: boolean;
    onDrilldown?: (update: Partial<DashboardFilters>) => void;
}

export const TotalValueChart: React.FC<TotalValueChartProps> = ({ pumps, headless, onDrilldown }) => {
    const totalValue = React.useMemo(() => {
        return pumps.reduce((sum, p) => sum + p.value, 0);
    }, [pumps]);

    const Content = (
        <div
            className="flex flex-col items-center justify-center h-full cursor-pointer hover:bg-muted/50 transition-colors rounded-lg p-4"
            onClick={() => {
                if (onDrilldown) {
                    // Drill down to "Value by Customer"
                    // We don't filter by anything specific, just move to the next view
                    onDrilldown({});
                }
            }}
        >
            <div className="text-4xl font-bold tracking-tight text-primary">
                {formatCurrency(totalValue)}
            </div>
            <p className="text-sm text-muted-foreground mt-2">
                Total Active Order Value
            </p>
        </div>
    );

    if (headless) {
        return <div className="h-full w-full">{Content}</div>;
    }

    return (
        <Card className="layer-l1 h-full">
            <CardHeader>
                <CardTitle className="text-lg">Total Value</CardTitle>
            </CardHeader>
            <CardContent className="h-[calc(100%-4rem)]">
                {Content}
            </CardContent>
        </Card>
    );
};

export const TotalValueChartWrapper: React.FC<ChartProps> = ({ filters, onDrilldown }) => {
    const pumps = useApp((state) => state.pumps);
    const filteredPumps = React.useMemo(() => applyDashboardFilters(pumps, filters), [pumps, filters]);
    return <TotalValueChart pumps={filteredPumps} headless={true} onDrilldown={onDrilldown} />;
};
