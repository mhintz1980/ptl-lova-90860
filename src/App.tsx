import { useEffect, useState, useMemo } from "react";
import { BrowserRouter, Routes, Route, Navigate, useLocation, useNavigate } from "react-router-dom";
import { useApp } from "./store";
import { AddPoModal } from "./components/toolbar/AddPoModal";
import { PumpDetailModal } from "./components/ui/PumpDetailModal";
import { SettingsModal } from "./components/ui/SettingsModal";
import { Dashboard } from "./pages/Dashboard";
import { Kanban } from "./pages/Kanban";
import { SchedulingView } from "./components/scheduling/SchedulingView";
import { Toaster } from "sonner";
import { Pump } from "./types";
import { AppShell } from "./components/layout/AppShell";
import type { AppView } from "./components/layout/navigation";
import { applyFilters } from "./lib/utils";
import { sortPumps } from "./lib/sort";
import { PrintLayout } from "./components/print/PrintLayout";
import { MondayBrief } from "./components/print/MondayBrief";
import { CapacityForecast } from "./components/print/CapacityForecast";
// Debug import for development
import "./debug-seed";

import { SandboxToolbar } from "./components/sandbox/SandboxToolbar";

// Kiosk Views
import { KioskLayout } from "./components/kiosk/KioskLayout";
import { ShopFloorHUD } from "./components/kiosk/ShopFloorHUD";

function MainApp() {
  const { load, pumps, filters, sortField, sortDirection, loading } = useApp();
  const [isAddPoModalOpen, setIsAddPoModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [selectedPump, setSelectedPump] = useState<Pump | null>(null);

  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    load();
  }, [load]);

  const filteredPumps = useMemo(() => {
    const filtered = applyFilters(pumps, filters);
    return sortPumps(filtered, sortField, sortDirection);
  }, [pumps, filters, sortField, sortDirection]);

  const currentView = useMemo((): AppView => {
    if (location.pathname.includes("/kanban")) return "kanban";
    if (location.pathname.includes("/scheduling")) return "scheduling";
    return "dashboard";
  }, [location.pathname]);

  return (
    <>
      <SandboxToolbar />
      <Toaster position="top-right" richColors />
      <AppShell
        currentView={currentView}
        onChangeView={(view) => navigate(view === "dashboard" ? "/" : `/${view}`)}
        onOpenAddPo={() => setIsAddPoModalOpen(true)}
        onOpenSettings={() => setIsSettingsModalOpen(true)}
      >
        <div className="w-full px-6 py-6">
          {loading ? (
            <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
              Loading...
            </div>
          ) : (
            <Routes>
              <Route path="/" element={<Dashboard pumps={filteredPumps} onSelectPump={setSelectedPump} />} />
              <Route path="dashboard" element={<Navigate to="/" replace />} />
              <Route path="kanban" element={<Kanban pumps={filteredPumps} onSelectPump={setSelectedPump} />} />
              <Route path="scheduling" element={<SchedulingView pumps={filteredPumps} />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          )}
        </div>
      </AppShell>

      <AddPoModal
        isOpen={isAddPoModalOpen}
        onClose={() => setIsAddPoModalOpen(false)}
      />

      <SettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
      />

      <PumpDetailModal
        pump={selectedPump}
        onClose={() => setSelectedPump(null)}
      />
    </>
  );
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Main Application */}
        <Route path="/*" element={<MainApp />} />

        {/* Print Views */}
        <Route path="/print" element={<PrintLayout />}>
          <Route path="brief" element={<MondayBrief />} />
          <Route path="forecast" element={<CapacityForecast />} />
        </Route>

        {/* Kiosk Views */}
        <Route path="/kiosk" element={<KioskLayout />}>
          <Route index element={<ShopFloorHUD />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
