import { useMemo, useState } from "react";
import { CHART_REGISTRY, TOPIC_CONFIGS, type ChartId, type DashboardFilters } from "../dashboard/config";
import type { Pump } from "../types";
import { useApp } from "../store";

const DEFAULT_FILTERS: DashboardFilters = {
  dateRange: { from: null, to: null },
};

interface DashboardEngineProps {
  pumps?: Pump[];
}

export function DashboardEngine({ pumps }: DashboardEngineProps) {
  const storePumps = useApp((state) => state.filtered());
  const availablePumps = pumps ?? storePumps;
  const [topicIndex, setTopicIndex] = useState(0);
  const [filters, setFilters] = useState<DashboardFilters>(DEFAULT_FILTERS);

  const topic = TOPIC_CONFIGS[topicIndex % TOPIC_CONFIGS.length];
  const chartIdsToRender = useMemo(() => {
    return topic.chartIds.filter((id) => Boolean(CHART_REGISTRY[id])) as ChartId[];
  }, [topic]);

  const handleDrilldown = (update: Partial<DashboardFilters>) => {
    setFilters((prev) => ({ ...prev, ...update }));
  };

  const handleNextTopic = () => {
    setTopicIndex((current) => (current + 1) % TOPIC_CONFIGS.length);
  };

  return (
    <div className="space-y-6" data-testid="dashboard-engine">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-border/60 pb-4">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Dashboard Topic</p>
          <h2 className="text-2xl font-semibold text-foreground">{topic.label}</h2>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="rounded-full border border-border/60 bg-card/80 px-4 py-2 text-sm font-semibold text-foreground transition hover:border-primary/50 hover:bg-primary/10"
            onClick={handleNextTopic}
          >
            Next Topic
          </button>
        </div>
      </header>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {chartIdsToRender.length === 0 && (
          <div className="rounded-2xl border border-dashed border-border/60 p-6 text-sm text-muted-foreground">
            No charts configured for this topic.
          </div>
        )}
        {chartIdsToRender.map((chartId) => {
          const chartConfig = CHART_REGISTRY[chartId];
          const ChartComponent = chartConfig.component;

          return (
            <div
              key={chartId}
              className="layer-l1 rounded-2xl border border-border/60 p-4 shadow-lg"
            >
              <div className="mb-3">
                <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">{topic.label}</p>
                <h3 className="text-lg font-semibold text-foreground">{chartConfig.title}</h3>
                {chartConfig.description && (
                  <p className="text-sm text-muted-foreground">{chartConfig.description}</p>
                )}
              </div>
              <ChartComponent
                pumps={availablePumps}
                filters={filters}
                onDrilldown={handleDrilldown}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
