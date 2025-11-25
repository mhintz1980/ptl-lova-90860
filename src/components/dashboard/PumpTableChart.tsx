import React from 'react';
import { PumpTable } from './PumpTable';
import { useApp } from '../../store';
import { applyDashboardFilters } from './utils';
import { ChartProps } from './dashboardConfig';

export const PumpTableChart: React.FC<ChartProps> = ({ filters }) => {
    const pumps = useApp((state) => state.pumps);
    const filteredPumps = React.useMemo(() => applyDashboardFilters(pumps, filters), [pumps, filters]);
    // We pass a dummy onSelectPump because the chart interface doesn't support it yet, 
    // or we could extend ChartProps. For now, just viewing data.
    return <div className="h-full overflow-hidden"><PumpTable pumps={filteredPumps} onSelectPump={() => { }} /></div>;
};
