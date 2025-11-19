import { useEffect, useState } from "react";

const DEFAULT_PRIMARY = "#0ea5e9";
const DEFAULT_SECONDARY = "#6366f1";

/**
 * Reads the Flowbite/Vite CSS variables for brand colors so demos
 * stay on theme. Falls back to sensible defaults when rendered on
 * the server or when the CSS variables are missing.
 */
export function useBrandColors(): [string, string] {
  const [colors, setColors] = useState<[string, string]>([
    DEFAULT_PRIMARY,
    DEFAULT_SECONDARY,
  ]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const styles = getComputedStyle(document.documentElement);
    const primary =
      styles.getPropertyValue("--color-fg-brand").trim() || DEFAULT_PRIMARY;
    const secondary =
      styles.getPropertyValue("--color-fg-brand-subtle").trim() ||
      DEFAULT_SECONDARY;
    setColors([primary, secondary]);
  }, []);

  return colors;
}
