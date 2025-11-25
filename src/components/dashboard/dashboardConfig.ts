import type { ComponentType } from 'react';
import { Stage } from '../../types';

// ---- IDs ----
export type DashboardTopicId =
    | 'production'
    | 'schedule'
    | 'sales'
    | 'bottlenecks'
    | 'quality';

export type ChartId =
    | 'wipByStage'
    | 'capacityByDept'
    | 'lateOrders'
    | 'leadTimeTrend'
    | 'pumpsByCustomer'
    | 'pumpsByModel'
    | 'reworkRate'
    | 'valueByCustomer'
    | 'treemap'
    | 'pumpTable'
    | 'totalPoValue';

// ---- Shared filters for drilldown ----
export interface DashboardFilters {
    dateRange: { from: Date | null; to: Date | null };
    customerId?: string;
    modelId?: string;
    department?: 'Fabrication' | 'Powder Coat' | 'Assembly' | 'Testing & Shipping';
    stage?: Stage;
}

// Every chart component will receive this:
export interface ChartProps {
    filters: DashboardFilters;
    onDrilldown: (update: Partial<DashboardFilters>) => void;
}

export interface ChartConfig {
    id: ChartId;
    title: string;
    description?: string;
    component: ComponentType<ChartProps>;
    defaultSize?: 'sm' | 'md' | 'lg';
    drillDownSequence?: ChartId[];
}

export interface TopicConfig {
    id: DashboardTopicId;
    label: string;
    icon?: string; // or ReactNode
    chartIds: ChartId[];
}

// We will populate this as we migrate charts
export const CHART_REGISTRY: Record<string, ChartConfig> = {};

export const TOPIC_CONFIGS: TopicConfig[] = [
    {
        id: 'production',
        label: 'Production Overview',
        chartIds: ['wipByStage', 'capacityByDept', 'lateOrders', 'treemap'],
    },
    {
        id: 'schedule',
        label: 'Schedule & Lead Times',
        chartIds: ['leadTimeTrend', 'lateOrders'],
    },
    {
        id: 'sales',
        label: 'Sales & Customers',
        chartIds: ['pumpsByCustomer', 'pumpsByModel', 'valueByCustomer'],
    },
    {
        id: 'bottlenecks',
        label: 'Bottlenecks',
        chartIds: ['capacityByDept', 'lateOrders'],
    },
];
