// src/adapters/local.ts
import { Pump, DataAdapter } from "../types";
import { seed } from "../lib/seed";
import { CONFIG } from "../config";
import { getTestPumps } from "../data/test-dataset";

const KEY = CONFIG.USE_TEST_DATASET 
  ? "pumptracker-data-v2-test-fixed-v2" 
  : "pumptracker-data-v2-catalog";

export const LocalAdapter: DataAdapter = {
  async load(): Promise<Pump[]> {
    const raw = localStorage.getItem(KEY);
    if (raw) return JSON.parse(raw);
    
    return CONFIG.USE_TEST_DATASET ? getTestPumps() : seed();
  },
  async replaceAll(rows: Pump[]) {
    localStorage.setItem(KEY, JSON.stringify(rows));
  },
  async upsertMany(rows: Pump[]) {
    const all = await this.load();
    const byId = new Map(all.map(r => [r.id, r]));
    rows.forEach(r => byId.set(r.id, r));
    localStorage.setItem(KEY, JSON.stringify([...byId.values()]));
  },
  async update(id: string, patch: Partial<Pump>) {
    const all = await this.load();
    const next = all.map(r => (r.id === id ? { ...r, ...patch } : r));
    localStorage.setItem(KEY, JSON.stringify(next));
  },
};

