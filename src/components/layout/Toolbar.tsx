import { FilterBar } from "../toolbar/FilterBar";
import { AddPoButton } from "../toolbar/AddPoButton";
import { LockDatePicker } from "../toolbar/LockDatePicker";
import { cn } from "../../lib/utils";

interface ToolbarProps {
  onOpenAddPo: () => void;
  className?: string;
}

export function Toolbar({ onOpenAddPo, className }: ToolbarProps) {
  return (
    <div
      className={cn(
        "bg-card border-b border-border sticky top-14 z-40 shadow-layer-md",
        className
      )}
    >
      <div className="container mx-auto flex flex-wrap items-center gap-3 px-4 py-2.5">
        <FilterBar className="flex-1 min-w-[260px]" />
        <LockDatePicker />
        <div className="ml-auto">
          <AddPoButton onClick={onOpenAddPo} />
        </div>
      </div>
    </div>
  );
}

