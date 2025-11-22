import { useApp } from "../../../store";
import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../../ui/Card";
import { STAGES } from "../../../types";

export function InventoryNudgeSlide() {
    const { pumps, wipLimits } = useApp();

    const stageCounts = useMemo(() => {
        const counts: Record<string, number> = {};
        pumps.forEach((p) => {
            if (p.stage !== "CLOSED") {
                counts[p.stage] = (counts[p.stage] || 0) + 1;
            }
        });
        return counts;
    }, [pumps]);

    const bottlenecks = useMemo(() => {
        return STAGES
            .filter(s => s !== "CLOSED")
            .map(stage => ({
                stage,
                count: stageCounts[stage] || 0,
                limit: wipLimits[stage],
                usage: wipLimits[stage] ? ((stageCounts[stage] || 0) / wipLimits[stage]!) * 100 : 0
            }))
            .sort((a, b) => b.usage - a.usage) // Sort by % capacity usage
            .slice(0, 3); // Top 3 bottlenecks
    }, [stageCounts, wipLimits]);

    return (
        <div className="h-full flex flex-col p-8 bg-background text-foreground">
            <h2 className="text-5xl font-bold mb-8 text-primary">Inventory Nudge: Bottlenecks</h2>
            <div className="grid grid-cols-3 gap-8 h-full">
                {bottlenecks.map((item) => (
                    <Card key={item.stage} className={`flex flex-col justify-between border-t-8 ${item.usage >= 100 ? 'border-t-destructive' : item.usage >= 80 ? 'border-t-yellow-500' : 'border-t-green-500'} shadow-xl`}>
                        <CardHeader>
                            <CardTitle className="text-4xl text-center">{item.stage}</CardTitle>
                        </CardHeader>
                        <CardContent className="flex-1 flex flex-col items-center justify-center">
                            <div className="text-[120px] font-bold leading-none">
                                {item.count}
                            </div>
                            <div className="text-2xl text-muted-foreground mt-4">
                                {item.limit ? `Limit: ${item.limit}` : "No Limit"}
                            </div>
                            {item.limit && (
                                <div className="w-full bg-secondary h-4 mt-8 rounded-full overflow-hidden">
                                    <div
                                        className={`h-full ${item.usage >= 100 ? 'bg-destructive' : item.usage >= 80 ? 'bg-yellow-500' : 'bg-green-500'}`}
                                        style={{ width: `${Math.min(item.usage, 100)}%` }}
                                    />
                                </div>
                            )}
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
}
