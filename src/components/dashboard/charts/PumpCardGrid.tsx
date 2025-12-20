// src/components/dashboard/charts/PumpCardGrid.tsx
import React from 'react';
import { Pump } from '../../../types';
import { ChartProps } from '../dashboardConfig';
import { useApp } from '../../../store';
import { applyDashboardFilters } from '../utils';
import { format, parseISO } from 'date-fns';
import { Package, Calendar, DollarSign, AlertCircle } from 'lucide-react';

export const PumpCardGrid: React.FC<ChartProps> = ({ filters }) => {
    const pumps = useApp((state) => state.pumps);
    const filteredPumps = React.useMemo(() => applyDashboardFilters(pumps, filters), [pumps, filters]);

    if (filteredPumps.length === 0) {
        return (
            <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                No pumps match the current filters
            </div>
        );
    }

    const isLate = (pump: Pump) => {
        if (!pump.scheduledEnd) return false;
        return new Date(pump.scheduledEnd) < new Date() && pump.stage !== 'CLOSED' && pump.stage !== 'SHIP';
    };

    return (
        <div className="h-full w-full overflow-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
                {filteredPumps.map((pump) => {
                    const late = isLate(pump);
                    return (
                        <div
                            key={pump.id}
                            className={`rounded-xl border-2 p-4 transition-all hover:shadow-lg ${late
                                    ? 'border-rose-500/50 bg-rose-500/5'
                                    : 'border-border bg-card hover:border-primary/50'
                                }`}
                        >
                            {/* Header */}
                            <div className="flex items-start justify-between mb-3">
                                <div className="flex-1">
                                    <div className="flex items-center gap-2">
                                        <Package className="h-4 w-4 text-primary" />
                                        <h3 className="font-bold text-foreground">{pump.model}</h3>
                                    </div>
                                    <p className="text-xs text-muted-foreground mt-0.5">Serial #{pump.serial}</p>
                                </div>
                                {late && (
                                    <div className="flex items-center gap-1 text-rose-600 dark:text-rose-400">
                                        <AlertCircle className="h-4 w-4" />
                                        <span className="text-xs font-semibold">LATE</span>
                                    </div>
                                )}
                            </div>

                            {/* Details */}
                            <div className="space-y-2">
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-muted-foreground">PO:</span>
                                    <span className="font-medium text-foreground">{pump.po}</span>
                                </div>

                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-muted-foreground">Customer:</span>
                                    <span className="font-medium text-foreground truncate ml-2" title={pump.customer}>
                                        {pump.customer}
                                    </span>
                                </div>

                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-muted-foreground">Stage:</span>
                                    <span className="inline-flex items-center rounded-full bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">
                                        {pump.stage}
                                    </span>
                                </div>

                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-muted-foreground">Priority:</span>
                                    <span
                                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${pump.priority === 'Urgent' || pump.priority === 'Rush'
                                                ? 'bg-rose-500/15 text-rose-600 dark:text-rose-400'
                                                : pump.priority === 'High'
                                                    ? 'bg-orange-500/15 text-orange-600 dark:text-orange-400'
                                                    : 'bg-muted text-muted-foreground'
                                            }`}
                                    >
                                        {pump.priority}
                                    </span>
                                </div>

                                {pump.scheduledEnd && (
                                    <div className="flex items-center gap-2 text-sm pt-2 border-t border-border">
                                        <Calendar className="h-3 w-3 text-muted-foreground" />
                                        <span className="text-muted-foreground">Due:</span>
                                        <span className={`font-medium ${late ? 'text-rose-600 dark:text-rose-400' : 'text-foreground'}`}>
                                            {format(parseISO(pump.scheduledEnd), 'MMM d, yyyy')}
                                        </span>
                                    </div>
                                )}

                                {pump.value && (
                                    <div className="flex items-center gap-2 text-sm">
                                        <DollarSign className="h-3 w-3 text-muted-foreground" />
                                        <span className="text-muted-foreground">Value:</span>
                                        <span className="font-semibold text-foreground">
                                            ${pump.value.toLocaleString()}
                                        </span>
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};
