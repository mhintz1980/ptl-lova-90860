// src/components/dashboard/KpiStrip.tsx
import { Pump } from "../../types";
import { Card, CardContent } from "../ui/Card";
import { round } from "../../lib/format";
import { cn } from "../../lib/utils";
import { useTheme } from "../../hooks/useTheme";

interface KpiStripProps {
  pumps: Pump[];
  compact?: boolean;
}

function diffDays(pump: Pump): number {
  if (!pump.forecastEnd) return 0;
  const start = new Date(pump.last_update);
  const end = new Date(pump.forecastEnd);
  return Math.abs((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
}

export function KpiStrip({ pumps, compact = false }: KpiStripProps) {
  const { mode } = useTheme();
  const isLight = mode === "light";

  const closed = pumps.filter(p => p.stage === "CLOSED");
  const onTime = closed.filter(p => !p.forecastEnd || new Date(p.last_update) <= new Date(p.forecastEnd));
  const lateOpen = pumps.filter(p => p.forecastEnd && new Date() > new Date(p.forecastEnd) && p.stage !== "CLOSED");

  const avgBuildDays = closed.length > 0
    ? closed.reduce((sum, p) => sum + diffDays(p), 0) / closed.length
    : 0;

  const shopEfficiency = pumps.length > 0 ? (closed.length / pumps.length) * 100 : 0;

  const metrics = [
    {
      label: "Avg Build Time",
      value: `${round(avgBuildDays, 1)} days`,
      helper: closed.length ? `Across ${closed.length} closed pumps` : "No closed pumps yet",
      color: "text-blue-600 dark:text-blue-400",
      bgColor: "bg-blue-50 dark:bg-blue-950/50",
      borderColor: "border-blue-200 dark:border-blue-800"
    },
    {
      label: "Shop Efficiency",
      value: `${round(shopEfficiency, 1)}%`,
      helper: `${closed.length} of ${pumps.length || 0} pumps closed`,
      color: "text-emerald-600 dark:text-emerald-400",
      bgColor: "bg-emerald-50 dark:bg-emerald-950/50",
      borderColor: "border-emerald-200 dark:border-emerald-800"
    },
    {
      label: "On-time Orders",
      value: `${onTime.length}`,
      helper: closed.length ? `${onTime.length} closed on schedule` : "Monitoring active jobs",
      color: "text-cyan-600 dark:text-cyan-400",
      bgColor: "bg-cyan-50 dark:bg-cyan-950/50",
      borderColor: "border-cyan-200 dark:border-cyan-800"
    },
    {
      label: "Late Orders",
      value: `${lateOpen.length}`,
      helper: lateOpen.length ? `${lateOpen.length} require attention` : "All jobs on pace",
      color: "text-rose-600 dark:text-rose-400",
      bgColor: "bg-rose-50 dark:bg-rose-950/50",
      borderColor: "border-rose-200 dark:border-rose-800"
    },
  ];

  return (
    <div
      className={cn(
        "grid gap-4",
        compact ? "grid-cols-2 lg:grid-cols-4" : "grid-cols-1 md:grid-cols-2 xl:grid-cols-4"
      )}
    >
      {metrics.map((metric) => (
        <Card
          key={metric.label}
          className={cn(
            "layer-l1 border border-white/10 bg-gradient-to-br from-card/70 via-card/30 to-card/80",
            compact ? "p-3" : "p-0",
            isLight && "bg-white text-foreground"
          )}
        >
          <CardContent className={cn("p-6", compact && "p-4")}>
            <div className="space-y-2">
              <div
                className={cn(
                  "text-[10px] uppercase tracking-[0.35em]",
                  isLight ? "text-muted-foreground" : "text-white/60"
                )}
              >
                {metric.label}
              </div>
              <div
                className={cn(
                  "text-2xl font-semibold",
                  isLight ? "text-foreground" : "text-white",
                  compact && "text-xl"
                )}
              >
                {metric.value}
              </div>
              {!compact && (
                <div className="text-xs text-muted-foreground">
                  {metric.helper}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
