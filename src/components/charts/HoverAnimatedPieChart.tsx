import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/Card";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Sector,
} from "recharts";
import type { PieProps } from "recharts";
import type { PieSectorDataItem } from "recharts/types/polar/Pie";

type DataPoint = Record<string, string | number>;

interface HoverAnimatedPieChartProps<T extends DataPoint> {
  data: T[];
  dataKey: keyof T;
  nameKey: keyof T;
  colors: string[];
  title: string;
  subtitle?: string;
  height?: number;
  valueFormatter?: (value: number, payload: T) => string;
}

const RADIAN = Math.PI / 180;
const defaultValueFormatter = (value: number) => `${value}`;

export function HoverAnimatedPieChart<T extends DataPoint>({
  data,
  dataKey,
  nameKey,
  colors,
  title,
  subtitle,
  height = 220,
  valueFormatter = defaultValueFormatter,
}: HoverAnimatedPieChartProps<T>) {
  const [activeSlice, setActiveSlice] = React.useState(0);
  const [chartSize, setChartSize] = React.useState({ width: 0, height: 0 });
  const [isHovered, setIsHovered] = React.useState(false);
  const chartBoundsRef = React.useRef<HTMLDivElement | null>(null);

  React.useLayoutEffect(() => {
    if (!chartBoundsRef.current || typeof ResizeObserver === "undefined") {
      return;
    }

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      setChartSize({
        width: entry.contentRect.width,
        height: entry.contentRect.height,
      });
    });

    observer.observe(chartBoundsRef.current);
    return () => observer.disconnect();
  }, []);

  const total = React.useMemo(
    () =>
      data.reduce((sum, item) => {
        const value = item[dataKey];
        if (typeof value === "number") {
          return sum + value;
        }
        return sum;
      }, 0),
    [data, dataKey]
  );

  const renderActiveShape = (props: PieSectorDataItem & { fill?: string }) => {
    const {
      cx,
      cy,
      innerRadius,
      outerRadius,
      startAngle,
      endAngle,
      midAngle,
      fill,
      payload,
      percent,
      value,
    } = props;

    const maxRadius =
      Math.min(chartSize.width, chartSize.height) / 2 - 12 || outerRadius || 0;
    const labelRadius = Math.min((outerRadius ?? 0) + 16, maxRadius);
    const sin = Math.sin(-RADIAN * (midAngle ?? 0));
    const cos = Math.cos(-RADIAN * (midAngle ?? 0));
    const labelX = (cx ?? 0) + labelRadius * cos;
    const labelY = (cy ?? 0) + labelRadius * sin;
    const textAnchor = cos >= 0 ? "start" : "end";

    return (
      <g>
        <Sector
          cx={cx}
          cy={cy}
          innerRadius={innerRadius}
          outerRadius={(outerRadius ?? 0) + 6}
          startAngle={startAngle}
          endAngle={endAngle}
          fill={fill}
          opacity={0.18}
          filter="url(#chartGlow)"
        />
        <Sector
          cx={cx}
          cy={cy}
          innerRadius={innerRadius}
          outerRadius={(outerRadius ?? 0) + 4}
          startAngle={startAngle}
          endAngle={endAngle}
          fill={fill}
          cornerRadius={999}
          stroke="hsl(var(--background))"
          strokeWidth={2}
        />
        <text
          x={labelX}
          y={labelY - 4}
          textAnchor={textAnchor}
          className="chart-callout__label-text"
        >
          {payload?.[nameKey] as React.ReactNode}
        </text>
        <text
          x={labelX}
          y={labelY + 12}
          textAnchor={textAnchor}
          className="chart-callout__value-text"
        >
          {valueFormatter(value as number, payload as T)} ·{" "}
          {((percent ?? 0) * 100).toFixed(0)}%
        </text>
      </g>
    );
  };

  return (
    <Card className="layer-l1 chart-card">
      <CardHeader>
        <CardTitle className="flex flex-col text-lg">
          <span>{title}</span>
          {subtitle ? (
            <span className="text-sm font-normal text-muted-foreground">
              {subtitle}
            </span>
          ) : null}
        </CardTitle>
      </CardHeader>
      <CardContent className="relative chart-card__content">
        <div
          style={{ height }}
          ref={chartBoundsRef}
          className={isHovered ? "chart-canvas chart-canvas--hovered" : "chart-canvas"}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <defs>
                <filter
                  id="chartGlow"
                  x="-50%"
                  y="-50%"
                  width="200%"
                  height="200%"
                >
                  <feGaussianBlur
                    in="SourceGraphic"
                    stdDeviation="14"
                    result="blur"
                  />
                  <feMerge>
                    <feMergeNode in="blur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>
              <Pie
                {...({
                  data,
                  dataKey: dataKey as string,
                  nameKey: nameKey as string,
                  cx: "50%",
                  cy: "50%",
                  innerRadius: "56%",
                  outerRadius: "72%",
                  paddingAngle: 5,
                  cornerRadius: 999,
                  activeIndex: activeSlice,
                  activeShape: renderActiveShape,
                  onMouseEnter: (_: any, index: number) => setActiveSlice(index),
                } satisfies PieProps & {
                  activeIndex: number;
                  activeShape: typeof renderActiveShape;
                  onMouseEnter: (_: any, index: number) => void;
                })}
              >
                {data.map((item, index) => (
                  <Cell
                    key={`${item[nameKey]}-${index}`}
                    fill={colors[index % colors.length]}
                    className="chart-slice"
                  />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-legend-row" aria-label="Chart legend">
          {data.map((item, index) => {
            const value =
              typeof item[dataKey] === "number" ? (item[dataKey] as number) : 0;
            const percentage = total ? Math.round((value / total) * 100) : 0;
            const label = String(item[nameKey]);

            return (
              <button
                type="button"
                key={`${item[nameKey]}-legend`}
                className={`chart-legend-row__item ${
                  index === activeSlice ? "chart-legend-row__item--active" : ""
                }`}
                onMouseEnter={() => setActiveSlice(index)}
                onFocus={() => setActiveSlice(index)}
                title={`${label} – ${valueFormatter(value, item)} (${percentage}%)`}
              >
                <span
                  className="chart-legend-row__chip"
                  style={{ backgroundColor: colors[index % colors.length] }}
                />
                <span className="chart-legend-row__label">{label}</span>
                <span className="chart-legend-row__value">
                  {valueFormatter(value, item)} · {percentage}%
                </span>
              </button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
