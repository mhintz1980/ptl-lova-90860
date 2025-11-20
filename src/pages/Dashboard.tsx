// src/pages/Dashboard.tsx
import React from "react";
import { Pump } from "../types";
import { KpiStrip } from "../components/dashboard/KpiStrip";
import { WorkloadChart } from "../components/dashboard/WorkloadChart";
import { ValueChart } from "../components/dashboard/ValueChart";
import { CapacityChart } from "../components/dashboard/CapacityChart";
import { PumpTable } from "../components/dashboard/PumpTable";
import { ColumnChart } from "../components/charts/column-charts/ColumnChart";
import { LineAreaChart } from "../components/charts/line-charts/LineAreaChart";
import { RadialProgressChart } from "../components/charts/radial-chart-1/RadialProgressChart";
import { RadialMultiChart } from "../components/charts/radial-chart-multi/RadialMultiChart";
import { useApp } from "../store";

interface DashboardProps {
  pumps: Pump[];
  onSelectPump: (pump: Pump) => void;
}



export const Dashboard: React.FC<DashboardProps> = ({
  pumps,
  onSelectPump,
}) => {
  const collapsed = useApp((state) => state.collapsedCards);

  return (
    <div className="space-y-6" data-testid="dashboard-view">
      <KpiStrip pumps={pumps} compact={collapsed} />

      {!collapsed && (
        <>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            <WorkloadChart pumps={pumps} type="customer" />
            <WorkloadChart pumps={pumps} type="model" />
            <ValueChart pumps={pumps} type="customer" />
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <ValueChart pumps={pumps} type="model" />
            <CapacityChart pumps={pumps} />
          </div>
        </>
      )}

      <PumpTable pumps={pumps} onSelectPump={onSelectPump} />

      <FlowbiteChartGallery />
    </div>
  );
};

function FlowbiteChartGallery() {
  const cardClass =
    "group relative rounded-2xl border border-border/50 bg-background/80 p-4 shadow-lg transition-all duration-150 ease-out hover:scale-[1.02] active:scale-[0.98] hover:shadow-[0_16px_50px_rgba(59,130,246,0.35)] hover:border-primary/50";
  return (
    <section className="space-y-4 rounded-3xl border border-border/60 bg-card/80 p-6 shadow-inner">
      <div>
        <p className="text-xs uppercase tracking-[0.35em] text-muted-foreground">
          Flowbite Demos
        </p>
        <h3 className="text-xl font-semibold text-foreground">
          Sample Chart Gallery
        </h3>
        <p className="text-sm text-muted-foreground">
          These charts mirror the Flowbite/Flowbite-React examples so you can
          preview them locally.
        </p>
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <div className={cardClass}>
          <ColumnChart />
        </div>
        <div className={cardClass}>
          <LineAreaChart />
        </div>
        <div className={cardClass}>
          <RadialProgressChart value={84} label="Utilization" />
        </div>
        <div className={cardClass}>
          <RadialMultiChart />
        </div>
      </div>
    </section>
  );
}
