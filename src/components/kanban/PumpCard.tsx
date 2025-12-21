// src/components/kanban/PumpCard.tsx
import { Pump } from "../../types";
import { formatDate } from "../../lib/format";
import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { Lock } from "lucide-react";
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

  const { isSandbox, originalSnapshot, isPumpLocked } = useApp();

  const isLocked = useMemo(() => isPumpLocked(pump.id), [isPumpLocked, pump.id]);

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
        "group relative overflow-hidden rounded-xl border bg-card/90 pl-5 pr-4 py-4 shadow-layer-md transition-all duration-200",
        isGhost ? "border-dashed border-yellow-500 bg-yellow-50/50" : "border-border",
        pump.isPaused && "border-dashed border-red-400 bg-card/70",
        disabled ? "cursor-default" : "cursor-grab active:cursor-grabbing",
        !disabled && "hover:-translate-y-[2px] hover:shadow-layer-lg"
      )}
      onClick={onClick}
    >
      {/* Powder coat color stripe on left edge */}
      <div
        className="absolute left-0 top-0 bottom-0 w-1.5 rounded-l-xl"
        style={{ backgroundColor: pump.powder_color || "hsl(var(--border))" }}
        title={pump.powder_color ? `Powder Coat: ${pump.powder_color}` : "No powder coat"}
      />
      {/* PAUSED stamp - large rubber stamp style */}
      {pump.isPaused && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10 overflow-visible">
          <div
            className="border-[5px] border-red-600 rounded-md px-4 py-1 opacity-65 select-none bg-white/20 dark:bg-black/10"
            style={{
              transform: 'rotate(-22deg) scale(1.4)',
            }}
          >
            <span
              className="text-red-600 font-black text-2xl tracking-[0.15em] uppercase"
              style={{
                fontFamily: 'Impact, Haettenschweiler, sans-serif',
              }}
            >
              PAUSED
            </span>
          </div>
        </div>
      )}

      {isGhost && (
        <div className="absolute top-0 right-0 bg-yellow-500 text-black text-[10px] font-bold px-1.5 py-0.5 rounded-bl z-20">
          GHOST
        </div>
      )}

      {isLocked && !isGhost && !pump.isPaused && (
        <div className="absolute top-0 left-0 bg-amber-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-br z-20 flex items-center gap-0.5">
          <Lock className="h-2.5 w-2.5" />
          LOCKED
        </div>
      )}

      {/* Priority indicator in top right */}
      {!isGhost && !pump.isPaused && !isLocked && (
        <div className="absolute top-2 right-2 z-10">
          <span
            className={`block h-3 w-3 rounded-full ${PRIORITY_DOT[pump.priority]}`}
            title={`Priority: ${pump.priority}`}
          />
        </div>
      )}

      <div className="flex items-start gap-3">
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
          {pump.forecastEnd && (
            <div className="flex items-center justify-between">
              <span>Due</span>
              <span
                className={
                  new Date(pump.forecastEnd) < new Date()
                    ? "font-medium text-destructive"
                    : "font-medium text-emerald-500"
                }
              >
                {formatDate(pump.forecastEnd)}
              </span>
            </div>
          )}
          {pump.isPaused && pump.totalPausedDays !== undefined && pump.totalPausedDays > 0 && (
            <div className="flex items-center justify-between text-orange-600">
              <span>Days Paused</span>
              <span className="font-bold">{pump.totalPausedDays}</span>
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

