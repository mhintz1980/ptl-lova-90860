// src/components/dashboard/PumpTable.tsx
import { Fragment, useMemo, useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { Pump, Priority, Stage } from "../../types";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/Card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/Table";
import { Badge } from "../ui/Badge";
import { formatCurrency, formatDate } from "../../lib/format";
import { cn } from "../../lib/utils";

interface PumpTableProps {
  pumps: Pump[];
  onSelectPump?: (pump: Pump) => void;
}

type PriorityDot = Priority | "Rush" | "Urgent";

const priorityColors: Record<PriorityDot, string> = {
  Low: "bg-blue-500",
  Normal: "bg-sky-500",
  High: "bg-orange-500",
  Rush: "bg-amber-500",
  Urgent: "bg-red-500",
};

// Constitution §2.1: Canonical stage labels
const stageLabels: Record<Stage, string> = {
  QUEUE: "Queue",
  FABRICATION: "Fabrication",
  STAGED_FOR_POWDER: "Staged",
  POWDER_COAT: "Powder Coat",
  ASSEMBLY: "Assembly",
  SHIP: "Ship",
  CLOSED: "Closed",
};

interface PurchaseOrderGroup {
  id: string;
  displayId: string;
  customer: string;
  promiseDate?: string;
  totalValue: number;
  pumps: Pump[];
}

const getOrderKey = (po: string): string => {
  const segments = po.split("-");
  return segments.length > 1 ? segments.slice(0, segments.length - 1).join("-") : po;
};

export const PumpTable: React.FC<PumpTableProps> = ({ pumps, onSelectPump }) => {
  const [expandedPOs, setExpandedPOs] = useState<Set<string>>(new Set());

  const purchaseOrders = useMemo<PurchaseOrderGroup[]>(() => {
    const groups = new Map<string, PurchaseOrderGroup>();

    pumps.forEach((pump) => {
      const key = getOrderKey(pump.po);
      const existing = groups.get(key);

      if (!existing) {
        groups.set(key, {
          id: key,
          displayId: key,
          customer: pump.customer,
          promiseDate: pump.promiseDate || pump.forecastEnd,
          totalValue: pump.value,
          pumps: [pump],
        });
        return;
      }

      existing.pumps.push(pump);
      existing.totalValue += pump.value;
      if (pump.customer && !existing.customer) {
        existing.customer = pump.customer;
      }
      if (pump.promiseDate) {
        if (!existing.promiseDate || new Date(pump.promiseDate) < new Date(existing.promiseDate)) {
          existing.promiseDate = pump.promiseDate;
        }
      } else if (!existing.promiseDate && pump.forecastEnd) {
        existing.promiseDate = pump.forecastEnd;
      }
    });

    return Array.from(groups.values()).sort((a, b) =>
      a.displayId.localeCompare(b.displayId)
    );
  }, [pumps]);

  const groupedPumps = useMemo(() => {
    const map = new Map<string, Pump[]>();
    pumps.forEach((pump) => {
      const key = getOrderKey(pump.po);
      const existing = map.get(key) ?? [];
      existing.push(pump);
      map.set(key, existing);
    });
    return map;
  }, [pumps]);

  const togglePO = (poId: string) => {
    const next = new Set(expandedPOs);
    if (next.has(poId)) {
      next.delete(poId);
    } else {
      next.add(poId);
    }
    setExpandedPOs(next);
  };

  return (
    <Card className="layer-l1">
      <CardHeader>
        <CardTitle className="text-sm font-semibold text-muted-foreground">
          Purchase Order Breakdown
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[48px]" />
              <TableHead>PO Number</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Promise Date</TableHead>
              <TableHead className="text-right">Total Value</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {purchaseOrders.map((po) => {
              const pumpsForOrder = groupedPumps.get(po.id) ?? [];
              const isExpanded = expandedPOs.has(po.id);

              return (
                <Fragment key={po.id}>
                  <TableRow
                    className="cursor-pointer"
                    onClick={() => togglePO(po.id)}
                  >
                    <TableCell>
                      {isExpanded ? (
                        <ChevronDown className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      )}
                    </TableCell>
                    <TableCell className="font-medium">{po.displayId}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {po.customer}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {po.promiseDate ? formatDate(po.promiseDate) : "—"}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {formatCurrency(po.totalValue)}
                    </TableCell>
                  </TableRow>

                  {isExpanded &&
                    pumpsForOrder.map((pump) => (
                      <TableRow
                        key={pump.id}
                        className={cn(
                          "bg-muted/30",
                          onSelectPump && "cursor-pointer hover:bg-muted/60"
                        )}
                        onClick={() => onSelectPump?.(pump)}
                      >
                        <TableCell />
                        <TableCell className="pl-8">
                          <div className="flex items-center gap-2 text-sm text-foreground">
                            <span
                              className={`h-2 w-2 rounded-full ${priorityColors[pump.priority as PriorityDot] ?? "bg-muted-foreground"}`}
                            />
                            #{pump.serial}
                          </div>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {pump.model}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {stageLabels[pump.stage]}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {formatCurrency(pump.value)}
                        </TableCell>
                      </TableRow>
                    ))}
                </Fragment>
              );
            })}
          </TableBody>
        </Table>

        {purchaseOrders.length === 0 && (
          <div className="py-10 text-center text-sm text-muted-foreground">
            No purchase orders match the current filters.
          </div>
        )}
      </CardContent>
    </Card>
  );
};
