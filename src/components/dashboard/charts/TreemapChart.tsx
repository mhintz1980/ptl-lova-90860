
import React, { useMemo } from 'react';
import { ResponsiveContainer, Treemap, Tooltip } from 'recharts';
import { motion } from 'framer-motion';
import { ChartProps } from '../dashboardConfig';
import { useApp } from '../../../store';
import { applyDashboardFilters } from '../utils';
import { Pump } from '../../../types';
import { Stage } from '../../../types';

// ... (rest of imports and interfaces) ...

interface TreemapNode {
    name: string;
    value: number;
}

const CustomTooltip = ({ active, payload }: { active?: boolean; payload?: { payload: TreemapNode; value: number }[] }) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-popover border border-border rounded-md shadow-lg p-2 text-sm">
                <p className="font-semibold">{payload[0].payload.name}</p>
                <p className="text-muted-foreground">Count: {payload[0].value}</p>
            </div>
        );
    }
    return null;
};

interface AnimatedTreemapContentProps {
    x?: number;
    y?: number;
    width?: number;
    height?: number;
    index?: number;
    name?: string;
    value?: number;
    colors?: string[];
    payload?: TreemapNode;
    onClick?: (node: TreemapNode) => void;
}

// Custom content component for the Treemap nodes
const AnimatedTreemapContent = (props: AnimatedTreemapContentProps) => {
    const { x, y, width, height, index, name, value, colors, payload, onClick } = props;

    if (
        x === undefined ||
        y === undefined ||
        width === undefined ||
        height === undefined ||
        index === undefined ||
        !colors ||
        !payload ||
        !onClick
    ) {
        return null;
    }

    return (
        <g>
            <motion.rect
                x={x}
                y={y}
                width={width}
                height={height}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                whileHover={{
                    scale: 1.02,
                    filter: "drop-shadow(0 0 8px rgba(59, 130, 246, 0.6))",
                    zIndex: 10
                }}
                transition={{ duration: 0.3 }}
                style={{
                    fill: colors[index % colors.length],
                    stroke: '#fff',
                    strokeWidth: 2,
                    strokeOpacity: 0.2,
                    cursor: 'pointer',
                    transformBox: 'fill-box',
                    transformOrigin: 'center',
                }}
                onClick={() => onClick(payload)}
            />
            {width > 50 && height > 30 && (
                <text
                    x={x + width / 2}
                    y={y + height / 2}
                    textAnchor="middle"
                    fill="#fff"
                    fontSize={12}
                    fontWeight="bold"
                    style={{ pointerEvents: 'none' }}
                >
                    {name}
                </text>
            )}
            {width > 50 && height > 50 && (
                <text
                    x={x + width / 2}
                    y={y + height / 2 + 16}
                    textAnchor="middle"
                    fill="rgba(255,255,255,0.8)"
                    fontSize={10}
                    style={{ pointerEvents: 'none' }}
                >
                    {value}
                </text>
            )}
        </g>
    );
};

const COLORS = [
    '#3b82f6', // blue
    '#10b981', // green
    '#f59e0b', // amber
    '#ef4444', // red
    '#8b5cf6', // violet
    '#ec4899', // pink
    '#06b6d4', // cyan
    '#f97316', // orange
];

export const TreemapChart: React.FC<ChartProps> = ({ filters, onDrilldown }) => {
    const pumps = useApp((state) => state.pumps);
    const filteredPumps = useMemo(() => applyDashboardFilters(pumps, filters), [pumps, filters]);

    // Group by Stage (or maybe Model if Stage is filtered?)
    // If Stage is already filtered, showing a treemap of that single stage is boring (1 block).
    // So if Stage is filtered, we should group by Model or Customer.

    const groupBy = filters.stage ? 'model' : 'stage';

    const data = useMemo(() => {
        const groups: Record<string, number> = {};

        filteredPumps.forEach((pump: Pump) => {
            const key = groupBy === 'stage' ? pump.stage : pump.model;
            groups[key] = (groups[key] || 0) + 1; // Sizing by count for now, could be value
        });

        return Object.entries(groups)
            .map(([name, value]) => ({ name, value }))
            .sort((a, b) => b.value - a.value);
    }, [filteredPumps, groupBy]);

    const handleNodeClick = (node: TreemapNode) => {
        if (groupBy === 'stage') {
            onDrilldown({ stage: node.name as Stage });
        } else {
            onDrilldown({ modelId: node.name });
        }
    };

    return (
        <ResponsiveContainer width="100%" height="100%">
            <Treemap
                data={data}
                dataKey="value"
                aspectRatio={4 / 3}
                stroke="#fff"
                fill="#8884d8"
                content={<AnimatedTreemapContent colors={COLORS} onClick={handleNodeClick} />}
            >
                <Tooltip content={<CustomTooltip />} />
            </Treemap>
        </ResponsiveContainer>
    );
};
