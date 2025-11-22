import { useApp } from "../../../store";
import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../../ui/Card";
import { Progress } from "../../ui/Progress";
import { CheckCircle2, Circle } from "lucide-react";

export function ProgressSlide() {
    const { milestones, microTasks } = useApp();

    const activeMilestones = useMemo(() => {
        return milestones.map(m => {
            const tasks = microTasks.filter(t => t.milestoneId === m.id);
            const totalWeight = tasks.reduce((acc, t) => acc + t.weight, 0);
            const completedWeight = tasks
                .filter(t => t.isComplete)
                .reduce((acc, t) => acc + t.weight, 0);
            const progress = totalWeight > 0 ? (completedWeight / totalWeight) * 100 : 0;

            return {
                ...m,
                tasks,
                progress
            };
        }).sort((a, b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime());
    }, [milestones, microTasks]);

    if (activeMilestones.length === 0) {
        return (
            <div className="h-full flex flex-col items-center justify-center p-8 bg-background text-foreground">
                <h2 className="text-5xl font-bold text-muted-foreground">No Active Milestones</h2>
                <p className="text-2xl text-muted-foreground mt-4">Add milestones in the main application to track progress here.</p>
            </div>
        );
    }

    return (
        <div className="h-full flex flex-col p-8 bg-background text-foreground">
            <h2 className="text-5xl font-bold mb-8 text-primary">Progress & Opportunities</h2>
            <div className="grid grid-cols-2 gap-8 h-full overflow-hidden">
                {activeMilestones.slice(0, 2).map((milestone) => (
                    <Card key={milestone.id} className="flex flex-col shadow-xl border-t-8 border-t-blue-500">
                        <CardHeader>
                            <div className="flex justify-between items-start">
                                <div>
                                    <CardTitle className="text-3xl">{milestone.title}</CardTitle>
                                    <p className="text-xl text-muted-foreground mt-1">{milestone.department} • Due {new Date(milestone.deadline).toLocaleDateString()}</p>
                                </div>
                                <div className="text-3xl font-bold text-blue-500">{Math.round(milestone.progress)}%</div>
                            </div>
                            <Progress value={milestone.progress} className="h-4 mt-4" />
                        </CardHeader>
                        <CardContent className="flex-1 overflow-y-auto">
                            <div className="space-y-4 mt-4">
                                {milestone.tasks.map((task) => (
                                    <div key={task.id} className="flex items-center gap-4 p-3 rounded-lg bg-secondary/50">
                                        {task.isComplete ? (
                                            <CheckCircle2 className="w-8 h-8 text-green-500 flex-shrink-0" />
                                        ) : (
                                            <Circle className="w-8 h-8 text-muted-foreground flex-shrink-0" />
                                        )}
                                        <span className={`text-xl ${task.isComplete ? "text-muted-foreground line-through" : ""}`}>
                                            {task.description}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
}
