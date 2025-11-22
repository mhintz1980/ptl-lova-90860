// src/components/kanban/PumpCard.tsx
import { Pump } from "../../types";
import { formatDate } from "../../lib/format";
import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical } from "lucide-react";
import { PRIORITY_DOT } from "./constants";
import { useApp } from "../../store";
import { useMemo } from "react";
import { cn } from "../../lib/utils";

interface DraggableConfig {
  id?: string;
  data?: Record<string, unknown>;
  disabled?: boolean;
}

interface PumpCardProps {
  pump: Pump;
  collapsed?: boolean;
  isDragging?: boolean;
  onClick?: () => void;
  draggableConfig?: DraggableConfig;
}

export function PumpCard({
  pump,
  collapsed = false,
  isDragging = false,
  onClick,
  draggableConfig,
}: PumpCardProps) {
  const draggableId = draggableConfig?.id ?? pump.id;
  const draggableData = draggableConfig?.data ?? { pump };
  const disabled = draggableConfig?.disabled ?? false;

  const { attributes, listeners, setNodeRef, transform, isDragging: coreDragging } = useDraggable({
    id: draggableId,
    data: draggableData,
    disabled,
  });
  const leadTimes = useMemo(
    () => useApp.getState().getModelLeadTimes(pump.model),
    [pump.model]
  );

  const { isSandbox, originalSnapshot } = useApp();

  const isGhost = useMemo(() => {
    if (!isSandbox || !originalSnapshot) return false;
    return !originalSnapshot.some(p => p.id === pump.id);
  }, [isSandbox, originalSnapshot, pump.id]);

  const style = transform
    ? {
      transform: CSS.Transform.toString(transform),
      opacity: isDragging || coreDragging ? 0.5 : 1,
    }
    : {
      opacity: isDragging || coreDragging ? 0.5 : 1,
    };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={cn(
        "group relative overflow-hidden rounded-xl border bg-card/90 px-4 py-4 shadow-layer-md transition-all duration-200",
        isGhost ? "border-dashed border-yellow-500 bg-yellow-50/50" : "border-border",
        disabled ? "cursor-default" : "cursor-grab active:cursor-grabbing",
        !disabled && "hover:-translate-y-[2px] hover:shadow-layer-lg"
      )}
      onClick={onClick}
    >
      {isGhost && (
        <div className="absolute top-0 right-0 bg-yellow-500 text-black text-[10px] font-bold px-1.5 py-0.5 rounded-bl">
          GHOST
        </div>
      )}
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 space-y-1">
          <div className="flex items-center text-sm font-semibold text-foreground">
            <span className="truncate" title={pump.model}>
              {pump.model}
            </span>
          </div>
          <div className="text-xs text-muted-foreground">
            <span className="block truncate" title={pump.customer}>
              {pump.customer}
            </span>
          </div>
          <div className="text-xs text-muted-foreground">
            <span className="block truncate" title={`Serial #${pump.serial}`}>
              Serial #{pump.serial}
            </span>
          </div>
        </div>
        <div className="flex flex-col items-end gap-2">
          <div className="text-muted-foreground transition-colors group-hover:text-foreground">
            <GripVertical className="h-4 w-4" />
          </div>
          <div className="flex items-center gap-2">
            <span
              className={`h-2.5 w-2.5 rounded-full ${PRIORITY_DOT[pump.priority]}`}
              title={`Priority: ${pump.priority}`}
            />
            <span
              className="h-2 w-6 rounded-full border border-border/60"
              style={{ backgroundColor: pump.powder_color || "hsl(var(--border))" }}
              title={pump.powder_color ? `Powder Coat: ${pump.powder_color}` : "No powder coat"}
            />
          </div>
        </div>
      </div>

      {!collapsed && (
        <div className="mt-3 space-y-2 text-xs text-muted-foreground">
          <div className="flex items-center justify-between">
            <span>PO</span>
            <span className="font-medium text-foreground">{pump.po}</span>
          </div>
          <div className="flex items-center justify-between">
            <span>Build Time</span>
            <span className="font-semibold text-foreground">
              {leadTimes?.total_days ?? 0} days
            </span>
          </div>
          {pump.scheduledEnd && (
            <div className="flex items-center justify-between">
              <span>Due</span>
              <span
                className={
                  new Date(pump.scheduledEnd) < new Date()
                    ? "font-medium text-destructive"
                    : "font-medium text-emerald-500"
                }
              >
                {formatDate(pump.scheduledEnd)}
              </span>
            </div>
          )}
          <div className="flex items-center justify-between border-t border-border/60 pt-2 text-[11px]">
            <span>Last update</span>
            <span className="text-foreground/80">{formatDate(pump.last_update)}</span>
          </div>
        </div>
      )}

    </div>
  );
}
