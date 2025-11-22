import { useApp } from "../../../store";
import { useMemo } from "react";
import { Badge } from "../../ui/Badge";
import { Card, CardContent, CardHeader, CardTitle } from "../../ui/Card";

export function UpNextSlide() {
    const { pumps } = useApp();

    const upNext = useMemo(() => {
        return pumps
            .filter((p) => p.stage !== "CLOSED" && p.stage !== "SHIPPING")
            .sort((a, b) => {
                // Sort by Priority (Urgent > Rush > High > Normal > Low)
                const priorityWeight = { Urgent: 4, Rush: 3, High: 2, Normal: 1, Low: 0 };
                const pA = priorityWeight[a.priority] ?? 1;
                const pB = priorityWeight[b.priority] ?? 1;
                if (pA !== pB) return pB - pA;

                // Then by Promise Date
                if (a.promiseDate && b.promiseDate) {
                    return a.promiseDate.localeCompare(b.promiseDate);
                }
                return 0;
            })
            .slice(0, 5); // Top 5
    }, [pumps]);

    return (
        <div className="h-full flex flex-col p-8 bg-background text-foreground">
            <h2 className="text-5xl font-bold mb-8 text-primary">Up Next: High Priority</h2>
            <div className="grid gap-6">
                {upNext.map((pump) => (
                    <Card key={pump.id} className="bg-card border-l-8 border-l-primary shadow-lg">
                        <CardHeader className="pb-2">
                            <div className="flex justify-between items-center">
                                <CardTitle className="text-3xl">{pump.model}</CardTitle>
                                <Badge variant={pump.priority === "Urgent" ? "destructive" : "secondary"} className="text-xl px-4 py-1">
                                    {pump.priority}
                                </Badge>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="flex justify-between items-end">
                                <div>
                                    <p className="text-2xl text-muted-foreground">{pump.customer}</p>
                                    <p className="text-xl mt-1 font-mono">{pump.po} / {pump.serial}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-lg text-muted-foreground">Current Stage</p>
                                    <p className="text-2xl font-bold text-primary">{pump.stage}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
}
