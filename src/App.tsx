// src/App.tsx
import { useEffect, useState, useMemo } from "react";
import { useApp } from "./store";
import { AddPoModal } from "./components/toolbar/AddPoModal";
import { Dashboard } from "./pages/Dashboard";
import { Kanban } from "./pages/Kanban";
import { SchedulingView } from "./components/scheduling/SchedulingView";
import { Toaster } from "sonner";
import { Pump } from "./types";
import { AppShell } from "./components/layout/AppShell";
import type { AppView } from "./components/layout/navigation";
import { applyFilters } from "./lib/utils";
import { sortPumps } from "./lib/sort";
// Debug import for development
import "./debug-seed";

function App() {
  const { load, pumps, filters, sortField, sortDirection, loading } = useApp();
  const [isAddPoModalOpen, setIsAddPoModalOpen] = useState(false);
  const [currentView, setCurrentView] = useState<AppView>("dashboard");
  const [selectedPump, setSelectedPump] = useState<Pump | null>(null);

  useEffect(() => {
    load();
  }, [load]);

  const filteredPumps = useMemo(() => {
    const filtered = applyFilters(pumps, filters);
    return sortPumps(filtered, sortField, sortDirection);
  }, [pumps, filters, sortField, sortDirection]);

  return (
    <>
      <Toaster position="top-right" richColors />
      <AppShell
        currentView={currentView}
        onChangeView={setCurrentView}
        onOpenAddPo={() => setIsAddPoModalOpen(true)}
      >
        <div className="w-full px-6 py-6">
          {currentView === "dashboard" ? (
            <Dashboard pumps={filteredPumps} onSelectPump={setSelectedPump} />
          ) : currentView === "kanban" ? (
            <Kanban pumps={filteredPumps} onSelectPump={setSelectedPump} />
          ) : loading ? (
            <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
              Loading...
            </div>
          ) : (
            <SchedulingView pumps={filteredPumps} />
          )}
        </div>
      </AppShell>

      <AddPoModal
        isOpen={isAddPoModalOpen}
        onClose={() => setIsAddPoModalOpen(false)}
      />

      {selectedPump && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md"
          onClick={() => setSelectedPump(null)}
        >
          <div
            className="surface-elevated shadow-frame border border-border/40 rounded-2xl w-full max-w-md p-6 m-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-start justify-between">
              <div>
                <h2 className="text-xl font-semibold text-foreground">
                  Pump Details
                </h2>
                <p className="text-sm text-muted-foreground">
                  Serial #{selectedPump.serial}
                </p>
              </div>
              <button
                onClick={() => setSelectedPump(null)}
                className="text-muted-foreground transition-colors hover:text-foreground"
              >
                <svg
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-4 rounded-xl border border-border/40 bg-card/70 p-3">
                <div>
                  <p className="mb-1 text-xs text-muted-foreground">
                    PO Number
                  </p>
                  <p className="font-medium text-foreground">
                    {selectedPump.po}
                  </p>
                </div>
                <div>
                  <p className="mb-1 text-xs text-muted-foreground">
                    Customer
                  </p>
                  <p className="font-medium text-foreground">
                    {selectedPump.customer}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 rounded-xl border border-border/40 bg-card/70 p-3">
                <div>
                  <p className="mb-1 text-xs text-muted-foreground">Model</p>
                  <p className="font-medium text-foreground">
                    {selectedPump.model}
                  </p>
                </div>
                <div>
                  <p className="mb-1 text-xs text-muted-foreground">Stage</p>
                  <span className="inline-flex items-center rounded-full bg-muted px-2 py-1 text-xs font-medium text-foreground">
                    {selectedPump.stage}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 rounded-xl border border-border/40 bg-card/70 p-3">
                <div>
                  <p className="mb-1 text-xs text-muted-foreground">
                    Priority
                  </p>
                  <span
                    className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                      selectedPump.priority === "Urgent" ||
                      selectedPump.priority === "Rush"
                        ? "bg-red-500/15 text-red-400"
                        : selectedPump.priority === "High"
                        ? "bg-orange-500/15 text-orange-300"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {selectedPump.priority}
                  </span>
                </div>
                <div>
                  <p className="mb-1 text-xs text-muted-foreground">Value</p>
                  <p className="font-medium text-foreground">
                    ${selectedPump.value.toLocaleString()}
                  </p>
                </div>
              </div>

              {selectedPump.powder_color && (
                <div className="rounded-xl border border-border/40 bg-card/70 p-3">
                  <p className="mb-1 text-xs text-muted-foreground">
                    Powder Coat Color
                  </p>
                  <p className="font-medium text-foreground">
                    {selectedPump.powder_color}
                  </p>
                </div>
              )}

              {selectedPump.scheduledEnd && (
                <div className="rounded-xl border border-border/40 bg-card/70 p-3">
                  <p className="mb-1 text-xs text-muted-foreground">
                    Scheduled End Date
                  </p>
                  <p className="font-medium text-foreground">
                    {new Date(selectedPump.scheduledEnd).toLocaleDateString(
                      "en-US",
                      {
                        weekday: "short",
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      }
                    )}
                  </p>
                </div>
              )}

              <div className="rounded-xl border border-border/40 bg-card/70 p-3">
                <p className="mb-1 text-xs text-muted-foreground">
                  Last Updated
                </p>
                <p className="font-medium text-foreground">
                  {new Date(selectedPump.last_update).toLocaleDateString(
                    "en-US",
                    {
                      weekday: "short",
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    }
                  )}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default App;
