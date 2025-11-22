import { useState } from "react";
import { useApp } from "../../store";
import { Milestone, MicroTask, STAGES } from "../../types";
import { nanoid } from "nanoid";
import { Button } from "./Button";
import { Input } from "./Input";
import { Badge } from "./Badge";
import { Trash2, Plus, CheckCircle2, Circle } from "lucide-react";

export function MilestoneManager() {
    const { milestones, microTasks, addMilestone, deleteMilestone, addMicroTask, deleteMicroTask, toggleMicroTask } = useApp();
    const [newMilestoneTitle, setNewMilestoneTitle] = useState("");
    const [newMilestoneDept, setNewMilestoneDept] = useState(STAGES[0]);
    const [newMilestoneDate, setNewMilestoneDate] = useState("");

    const [newTaskDesc, setNewTaskDesc] = useState("");
    const [newTaskWeight, setNewTaskWeight] = useState(1);
    const [selectedMilestoneId, setSelectedMilestoneId] = useState<string | null>(null);

    const handleAddMilestone = () => {
        if (!newMilestoneTitle || !newMilestoneDate) return;
        const milestone: Milestone = {
            id: nanoid(),
            title: newMilestoneTitle,
            department: newMilestoneDept,
            deadline: new Date(newMilestoneDate).toISOString(),
            createdAt: new Date().toISOString(),
        };
        addMilestone(milestone);
        setNewMilestoneTitle("");
        setNewMilestoneDate("");
    };

    const handleAddTask = (milestoneId: string) => {
        if (!newTaskDesc) return;
        const task: MicroTask = {
            id: nanoid(),
            milestoneId,
            description: newTaskDesc,
            weight: newTaskWeight,
            isComplete: false,
        };
        addMicroTask(task);
        setNewTaskDesc("");
        setNewTaskWeight(1);
    };

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Create Milestone */}
                <div className="p-4 border rounded-lg space-y-4">
                    <h3 className="text-lg font-semibold">Create Milestone</h3>
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Title</label>
                        <Input
                            value={newMilestoneTitle}
                            onChange={(e) => setNewMilestoneTitle(e.target.value)}
                            placeholder="e.g. Q4 Safety Audit"
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Department</label>
                        <select
                            className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                            value={newMilestoneDept}
                            onChange={(e) => setNewMilestoneDept(e.target.value as any)}
                        >
                            {STAGES.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Deadline</label>
                        <Input
                            type="date"
                            value={newMilestoneDate}
                            onChange={(e) => setNewMilestoneDate(e.target.value)}
                        />
                    </div>
                    <Button onClick={handleAddMilestone} className="w-full">Add Milestone</Button>
                </div>

                {/* List Milestones */}
                <div className="space-y-4 max-h-[600px] overflow-y-auto">
                    {milestones.map((m) => (
                        <div key={m.id} className={`p-4 border rounded-lg ${selectedMilestoneId === m.id ? 'ring-2 ring-primary' : ''}`} onClick={() => setSelectedMilestoneId(m.id)}>
                            <div className="flex justify-between items-start mb-2">
                                <div>
                                    <h4 className="font-bold">{m.title}</h4>
                                    <div className="flex gap-2 mt-1">
                                        <Badge variant="secondary">{m.department}</Badge>
                                        <span className="text-xs text-muted-foreground self-center">Due {new Date(m.deadline).toLocaleDateString()}</span>
                                    </div>
                                </div>
                                <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); deleteMilestone(m.id); }}>
                                    <Trash2 className="h-4 w-4 text-destructive" />
                                </Button>
                            </div>

                            {/* Tasks Preview */}
                            <div className="space-y-1 mt-2">
                                {microTasks.filter(t => t.milestoneId === m.id).map(t => (
                                    <div key={t.id} className="flex items-center gap-2 text-sm">
                                        {t.isComplete ? <CheckCircle2 className="h-3 w-3 text-green-500" /> : <Circle className="h-3 w-3 text-muted-foreground" />}
                                        <span className={t.isComplete ? "line-through text-muted-foreground" : ""}>{t.description}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Task Editor for Selected Milestone */}
            {selectedMilestoneId && (
                <div className="p-4 border rounded-lg bg-secondary/10">
                    <h3 className="text-lg font-semibold mb-4">Manage Tasks for: {milestones.find(m => m.id === selectedMilestoneId)?.title}</h3>

                    <div className="flex gap-2 mb-4">
                        <Input
                            value={newTaskDesc}
                            onChange={(e) => setNewTaskDesc(e.target.value)}
                            placeholder="New task description..."
                            className="flex-1"
                        />
                        <Input
                            type="number"
                            value={newTaskWeight}
                            onChange={(e) => setNewTaskWeight(Number(e.target.value))}
                            className="w-20"
                            min={1}
                        />
                        <Button onClick={() => handleAddTask(selectedMilestoneId)}><Plus className="h-4 w-4" /></Button>
                    </div>

                    <div className="space-y-2">
                        {microTasks.filter(t => t.milestoneId === selectedMilestoneId).map(t => (
                            <div key={t.id} className="flex items-center justify-between p-2 bg-background rounded border">
                                <div className="flex items-center gap-3 cursor-pointer" onClick={() => toggleMicroTask(t.id)}>
                                    {t.isComplete ? <CheckCircle2 className="h-5 w-5 text-green-500" /> : <Circle className="h-5 w-5 text-muted-foreground" />}
                                    <span className={t.isComplete ? "line-through text-muted-foreground" : ""}>{t.description} (w: {t.weight})</span>
                                </div>
                                <Button variant="ghost" size="icon" onClick={() => deleteMicroTask(t.id)}>
                                    <Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive" />
                                </Button>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
