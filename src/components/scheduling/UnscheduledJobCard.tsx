import { Pump } from "../../types";
import { PumpCard } from "../kanban/PumpCard";

interface UnscheduledJobCardProps {
  pump: Pump;
  collapsed: boolean;
}

export function UnscheduledJobCard({ pump, collapsed }: UnscheduledJobCardProps) {
  return (
    <PumpCard
      pump={pump}
      collapsed={collapsed}
      draggableConfig={{ id: `unscheduled-${pump.id}`, data: { pump } }}
    />
  );
}
