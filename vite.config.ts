import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes("node_modules")) {
            return
          }

          if (id.includes("@supabase/supabase-js")) {
            return "supabase"
          }

          if (id.includes("@dnd-kit")) {
            return "dnd"
          }

          if (id.includes("recharts") || id.includes("date-fns")) {
            return "charts"
          }

          if (id.includes("@tanstack/react-table")) {
            return "table"
          }

          if (
            id.includes("@radix-ui") ||
            id.includes("sonner") ||
            id.includes("lucide-react")
          ) {
            return "ui"
          }

          if (id.includes("react-dom") || id.includes("react/jsx")) {
            return "react"
          }

          return "vendor"
        },
      },
    },
  },
  test: {
    environment: "jsdom",
    pool: "threads",
    include: ["src/**/*.{test,spec}.{ts,tsx}", "tests/**/*.spec.ts", "tests/**/*.spec.tsx"],
    exclude: ["tests/e2e/**", "tests/e2e*.spec.ts"],
  },
})
