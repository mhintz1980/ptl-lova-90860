import type { ComponentType, ReactNode } from "react";
import type { Pump, Stage, Department } from "../types";
import { WipByStageChart } from "../components/dashboard/charts/WipByStageChart";
import { PumpsByCustomerChart } from "../components/dashboard/charts/PumpsByCustomerChart";
import { PumpsByModelChart } from "../components/dashboard/charts/PumpsByModelChart";

export type DashboardTopicId =
  | "production"
  | "schedule"
  | "sales"
  | "bottlenecks"
  | "quality"
  | "maintenance"
  | "supplyChain"
  | "financial"
  | "customerHealth"
  | "workforce";

export type ChartId =
  | "wipByStage"
  | "capacityByDept"
  | "lateOrders"
  | "leadTimeTrend"
  | "pumpsByCustomer"
  | "pumpsByModel"
  | "reworkRate"
  | "downtimeMap"
  | "supplyChainReadiness"
  | "financialPulse"
  | "customerSentiment"
  | "workforceLoad";

export interface DashboardFilters {
  dateRange: { from: Date | null; to: Date | null };
  customerId?: string;
  modelId?: string;
  department?: Department;
  stage?: Stage | "IN PROGRESS" | "DONE";
}

export interface ChartProps {
  pumps: Pump[];
  filters: DashboardFilters;
  onDrilldown: (update: Partial<DashboardFilters>) => void;
}

export interface ChartConfig {
  id: ChartId;
  title: string;
  description?: string;
  component: ComponentType<ChartProps>;
  icon?: ReactNode;
  defaultSize?: "sm" | "md" | "lg";
}

const PlaceholderChart: ComponentType<ChartProps> = () => null;

export const CHART_REGISTRY: Record<ChartId, ChartConfig> = {
  wipByStage: {
    id: "wipByStage",
    title: "WIP by Stage",
    description: "Current pump distribution by production stage.",
    component: WipByStageChart,
    defaultSize: "md",
  },
  capacityByDept: {
    id: "capacityByDept",
    title: "Capacity by Department",
    description: "Utilization vs. departmental limits.",
    component: PlaceholderChart,
    defaultSize: "lg",
  },
  lateOrders: {
    id: "lateOrders",
    title: "Late Orders",
    description: "POs exceeding their promise dates.",
    component: PlaceholderChart,
    defaultSize: "md",
  },
  leadTimeTrend: {
    id: "leadTimeTrend",
    title: "Lead Time Trend",
    description: "Average build durations over time.",
    component: PlaceholderChart,
    defaultSize: "lg",
  },
  pumpsByCustomer: {
    id: "pumpsByCustomer",
    title: "Pumps by Customer",
    description: "Mix of orders by customer.",
    component: PumpsByCustomerChart,
    defaultSize: "md",
  },
  pumpsByModel: {
    id: "pumpsByModel",
    title: "Pumps by Model",
    description: "Mix of orders by pump model.",
    component: PumpsByModelChart,
    defaultSize: "md",
  },
  reworkRate: {
    id: "reworkRate",
    title: "Rework Rate",
    description: "Defects or returns vs. throughput.",
    component: PlaceholderChart,
    defaultSize: "sm",
  },
  downtimeMap: {
    id: "downtimeMap",
    title: "Downtime Map",
    description: "Maintenance windows and unplanned downtime.",
    component: PlaceholderChart,
    defaultSize: "lg",
  },
  supplyChainReadiness: {
    id: "supplyChainReadiness",
    title: "Supply Chain Readiness",
    description: "Critical BOM shortages and PO approvals.",
    component: PlaceholderChart,
    defaultSize: "md",
  },
  financialPulse: {
    id: "financialPulse",
    title: "Financial Pulse",
    description: "Value at risk and revenue pacing.",
    component: PlaceholderChart,
    defaultSize: "lg",
  },
  customerSentiment: {
    id: "customerSentiment",
    title: "Customer Health",
    description: "Customer-specific promise adherence.",
    component: PlaceholderChart,
    defaultSize: "md",
  },
  workforceLoad: {
    id: "workforceLoad",
    title: "Workforce Load",
    description: "Labor allocation versus demand.",
    component: PlaceholderChart,
    defaultSize: "lg",
  },
};

export interface TopicConfig {
  id: DashboardTopicId;
  label: string;
  icon?: ReactNode;
  chartIds: ChartId[];
}

export const TOPIC_CONFIGS: TopicConfig[] = [
  {
    id: "production",
    label: "Production Overview",
    chartIds: ["wipByStage", "capacityByDept", "lateOrders"],
  },
  {
    id: "schedule",
    label: "Schedule & Lead Times",
    chartIds: ["leadTimeTrend", "lateOrders", "wipByStage"],
  },
  {
    id: "sales",
    label: "Sales & Customers",
    chartIds: ["pumpsByCustomer", "pumpsByModel", "financialPulse"],
  },
  {
    id: "bottlenecks",
    label: "Bottlenecks",
    chartIds: ["capacityByDept", "wipByStage", "downtimeMap"],
  },
  {
    id: "quality",
    label: "Quality",
    chartIds: ["reworkRate", "customerSentiment", "lateOrders"],
  },
  {
    id: "maintenance",
    label: "Maintenance & Reliability",
    chartIds: ["downtimeMap", "workforceLoad", "supplyChainReadiness"],
  },
  {
    id: "supplyChain",
    label: "Supply Chain",
    chartIds: ["supplyChainReadiness", "leadTimeTrend", "financialPulse"],
  },
  {
    id: "financial",
    label: "Financial Pulse",
    chartIds: ["financialPulse", "pumpsByCustomer", "pumpsByModel"],
  },
  {
    id: "customerHealth",
    label: "Customer Health",
    chartIds: ["customerSentiment", "lateOrders", "pumpsByCustomer"],
  },
  {
    id: "workforce",
    label: "Workforce Load",
    chartIds: ["workforceLoad", "capacityByDept", "wipByStage"],
  },
];
