// src/components/toolbar/FilterBar.tsx
import { useMemo } from "react";
import { X, Search } from "lucide-react";
import { useApp } from "../../store";
import { Input } from "../ui/Input";
import { Button } from "../ui/Button";
import { Badge } from "../ui/Badge";
import type { Priority, Stage } from "../../types";
import { cn } from "../../lib/utils";
import type { SortField, SortDirection } from "../../lib/sort";

interface FilterBarProps {
  className?: string;
  layout?: "inline" | "stacked";
}

export function FilterBar({ className, layout = "inline" }: FilterBarProps) {
  const {
    filters,
    setFilters,
    clearFilters,
    pumps,
    sortField,
    sortDirection,
    setSort,
  } = useApp();

  const uniquePOs = useMemo(
    () => [...new Set(pumps.map((p) => p.po))].sort(),
    [pumps]
  );
  const uniqueCustomers = useMemo(
    () => [...new Set(pumps.map((p) => p.customer))].sort(),
    [pumps]
  );
  const uniqueModels = useMemo(
    () => [...new Set(pumps.map((p) => p.model))].sort(),
    [pumps]
  );

  const priorities: Priority[] = ["Low", "Normal", "High", "Rush", "Urgent"];
  const stages: Stage[] = [
    "NOT STARTED",
    "FABRICATION",
    "POWDER COAT",
    "ASSEMBLY",
    "TESTING",
    "SHIPPING",
    "CLOSED",
  ];

  const activeFilterCount = [
    filters.q,
    filters.po,
    filters.customer,
    filters.model,
    filters.priority,
    filters.stage,
  ].filter(Boolean).length;

  const isStacked = layout === "stacked";

  const containerClasses = cn(
    isStacked
      ? "grid grid-cols-1 gap-3"
      : "flex w-full flex-wrap items-center gap-3",
    className
  );

  const selectClasses = cn(
    "h-9 rounded-full border border-border bg-muted/60 px-3 text-xs font-medium text-muted-foreground transition-colors shadow-layer-sm hover:bg-muted/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:border-primary/40",
    isStacked ? "w-full" : "min-w-[140px]"
  );

  const sortOptions: Array<{ value: SortField; label: string }> = [
    { value: "default", label: "Default (Priority → Promise → Created)" },
    { value: "priority", label: "Priority" },
    { value: "promiseDate", label: "Promise Date" },
    { value: "stage", label: "Stage" },
    { value: "customer", label: "Customer" },
    { value: "model", label: "Model" },
    { value: "po", label: "PO" },
    { value: "value", label: "Value" },
    { value: "serial", label: "Serial" },
    { value: "last_update", label: "Last Update" },
  ];

  const directionOptions: Array<{ value: SortDirection; label: string }> = [
    { value: "asc", label: "Ascending" },
    { value: "desc", label: "Descending" },
  ];

  return (
    <div className={containerClasses}>
      <div
        className={cn(
          "relative",
          isStacked ? "w-full" : "min-w-[140px] flex-1 max-w-[200px]"
        )}
      >
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          type="text"
          placeholder="Search"
          value={filters.q || ""}
          onChange={(event) => setFilters({ q: event.target.value })}
          className={cn(
            "h-9 rounded-full border-muted/80 bg-muted/50 pl-9 text-sm text-foreground placeholder:text-muted-foreground/70 focus-visible:ring-primary/40",
            isStacked ? "w-full" : "w-full"
          )}
        />
      </div>

      <select
        value={filters.po || ""}
        onChange={(event) =>
          setFilters({ po: event.target.value || undefined })
        }
        className={selectClasses}
      >
        <option value="">POs</option>
        {uniquePOs.map((po) => (
          <option key={po} value={po}>
            {po}
          </option>
        ))}
      </select>

      <select
        value={filters.customer || ""}
        onChange={(event) =>
          setFilters({ customer: event.target.value || undefined })
        }
        className={selectClasses}
      >
        <option value="">Customers</option>
        {uniqueCustomers.map((customer) => (
          <option key={customer} value={customer}>
            {customer}
          </option>
        ))}
      </select>

      <select
        value={filters.model || ""}
        onChange={(event) =>
          setFilters({ model: event.target.value || undefined })
        }
        className={selectClasses}
      >
        <option value="">Models</option>
        {uniqueModels.map((model) => (
          <option key={model} value={model}>
            {model}
          </option>
        ))}
      </select>

      <select
        value={filters.priority || ""}
        onChange={(event) =>
          setFilters({
            priority: (event.target.value as Priority) || undefined,
          })
        }
        className={selectClasses}
      >
        <option value="">Priority</option>
        {priorities.map((priority) => (
          <option key={priority} value={priority}>
            {priority}
          </option>
        ))}
      </select>

      <select
        value={filters.stage || ""}
        onChange={(event) =>
          setFilters({ stage: (event.target.value as Stage) || undefined })
        }
        className={selectClasses}
      >
        <option value="">Stage</option>
        {stages.map((stage) => (
          <option key={stage} value={stage}>
            {stage}
          </option>
        ))}
      </select>

      <select
        value={sortField}
        onChange={(event) =>
          setSort(event.target.value as SortField, sortDirection)
        }
        className={selectClasses}
      >
        {sortOptions.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>

      <select
        value={sortDirection}
        onChange={(event) =>
          setSort(sortField, event.target.value as SortDirection)
        }
        className={selectClasses}
        disabled={sortField === "default"}
      >
        {directionOptions.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>

      {activeFilterCount > 0 && (
        <Button
          variant="ghost"
          size="sm"
          onClick={clearFilters}
          className={cn(
            "gap-1.5 rounded-full border border-border/70 bg-muted/40 px-4 text-xs font-semibold text-muted-foreground hover:bg-muted/80 hover:text-foreground",
            isStacked ? "justify-self-end" : "ml-auto"
          )}
        >
          <X className="h-3.5 w-3.5" />
          Clear
          <Badge className="ml-1 h-5 w-5 -translate-y-[1px] rounded-full border-none bg-primary/90 text-primary-foreground">
            {activeFilterCount}
          </Badge>
        </Button>
      )}
    </div>
  );
}
