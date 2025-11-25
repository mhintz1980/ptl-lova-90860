
import { ChartConfig, ChartId } from './dashboardConfig';
import { WorkloadByCustomerChart, WorkloadByModelChart } from './WorkloadChart';
import { ValueByCustomerChart } from './ValueChart';
import { LeadTimeTrendChart } from './TrendChart';
import { CapacityByDeptChart } from './CapacityChart';
import { TreemapChart } from './charts/TreemapChart';
import { PumpTableChart } from './PumpTableChart';
import { LateOrdersChartWrapper } from './LateOrdersChart';
import { TotalValueChartWrapper } from './TotalValueChart';
import { PlaceholderChart } from './PlaceholderChart';



export const CHART_REGISTRY: Record<ChartId, ChartConfig> = {
    wipByStage: {
        id: 'wipByStage',
        title: 'WIP by Stage',
        description: 'Current pumps in each stage',
        component: CapacityByDeptChart, // Reusing capacity for now as it shows stage counts
        defaultSize: 'md',
        drillDownSequence: ['pumpsByCustomer', 'pumpTable'],
    },
    capacityByDept: {
        id: 'capacityByDept',
        title: 'Capacity by Department',
        description: 'Workload distribution across departments',
        component: CapacityByDeptChart,
        defaultSize: 'lg',
    },
    lateOrders: {
        id: 'lateOrders',
        title: 'Late Orders',
        description: 'Orders past their promise date',
        component: LateOrdersChartWrapper,
        defaultSize: 'md',
        drillDownSequence: ['pumpTable'], // Filtered by stage
    },
    leadTimeTrend: {
        id: 'leadTimeTrend',
        title: 'Lead Time Trend',
        description: 'Average build time over last 12 weeks',
        component: LeadTimeTrendChart,
        defaultSize: 'lg',
        drillDownSequence: ['pumpTable'], // Filtered by week (requires date range filter support in PumpTable)
    },
    pumpsByCustomer: {
        id: 'pumpsByCustomer',
        title: 'Pumps by Customer',
        description: 'Top customers by volume',
        component: WorkloadByCustomerChart,
        defaultSize: 'md',
        drillDownSequence: ['pumpsByModel', 'pumpTable'],
    },
    pumpsByModel: {
        id: 'pumpsByModel',
        title: 'Pumps by Model',
        description: 'Most popular pump models',
        component: WorkloadByModelChart,
        defaultSize: 'md',
        drillDownSequence: ['pumpTable'],
    },
    reworkRate: {
        id: 'reworkRate',
        title: 'Rework Rate',
        description: 'Percentage of pumps requiring rework',
        component: PlaceholderChart,
        defaultSize: 'sm',
    },
    valueByCustomer: {
        id: 'valueByCustomer',
        title: 'Value by Customer',
        description: 'Total order value by customer',
        component: ValueByCustomerChart,
        defaultSize: 'md',
        drillDownSequence: ['pumpTable'],
    },
    treemap: {
        id: 'treemap',
        title: 'Production Treemap',
        description: 'Interactive view of all active orders (Click to drill down)',
        component: TreemapChart,
        defaultSize: 'lg',
        drillDownSequence: ['pumpTable'],
    },
    pumpTable: {
        id: 'pumpTable',
        title: 'Detailed Pump List',
        description: 'Filtered list of pumps',
        component: PumpTableChart,
        defaultSize: 'lg',
    },
    totalPoValue: {
        id: 'totalPoValue',
        title: 'Total PO Value',
        description: 'Aggregate value of all active orders',
        component: TotalValueChartWrapper,
        defaultSize: 'sm',
        drillDownSequence: ['valueByCustomer', 'pumpTable'],
    },
};
