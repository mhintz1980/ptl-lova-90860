import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { Pump, Filters } from "../types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function applyFilters(rows: Pump[], f: Filters): Pump[] {
  const q = f.q?.toLowerCase();
  return rows.filter(r => {
    if (f.po && r.po !== f.po) return false;
    if (f.customer && r.customer !== f.customer) return false;
    if (f.model && r.model !== f.model) return false;
    if (f.priority && r.priority !== f.priority) return false;
    if (f.stage && r.stage !== f.stage) return false;
    
    // Simple global search
    if (q) {
      const searchable = [r.po, r.customer, r.model, r.serial.toString(), r.powder_color].join(' ').toLowerCase();
      if (!searchable.includes(q)) return false;
    }
    
    return true;
  });
}

export function genSerial(existing: Pump[]): number {
  const used = new Set(existing.map(p => p.serial));
  for (let s = 1000; s <= 9999; s++) {
    if (!used.has(s)) return s;
  }
  // Fallback: use a random serial if 1000-9999 are all used (unlikely for Lite)
  return Math.floor(1000 + Math.random() * 9000);
}

