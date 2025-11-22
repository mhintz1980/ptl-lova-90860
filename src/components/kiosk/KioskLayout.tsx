import { Outlet } from "react-router-dom";

export function KioskLayout() {
    return (
        <div className="min-h-screen bg-background text-foreground font-sans overflow-hidden">
            <Outlet />
            <style>{`
        /* Hide scrollbars for kiosk mode */
        ::-webkit-scrollbar {
          display: none;
        }
        body {
          -ms-overflow-style: none;
          scrollbar-width: none;
          cursor: none; /* Optional: hide cursor if it's a passive display */
        }
        body:hover {
          cursor: default; /* Show cursor on interaction */
        }
      `}</style>
        </div>
    );
}
