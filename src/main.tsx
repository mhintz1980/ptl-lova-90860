import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";
import { useApp } from "./store";

const THEME_STORAGE_KEY = "pt-theme";

function bootstrapTheme() {
  const root = document.documentElement;
  const stored = localStorage.getItem(THEME_STORAGE_KEY);
  const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  const mode =
    stored === "light" || stored === "dark"
      ? stored
      : prefersDark
      ? "dark"
      : "light";

  root.classList.remove("light", "dark");
  root.classList.add(mode);
}

bootstrapTheme();

if (import.meta.env.DEV || import.meta.env.VITE_E2E === "true") {
  (window as any).useApp = useApp;
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
