import { DataAdapter } from "../types";

export const SandboxAdapter: DataAdapter = {
    load: async () => {
        // Sandbox should not load data, but if called, return empty or throw
        return [];
    },
    replaceAll: async () => {
        // No-op
    },
    upsertMany: async () => {
        // No-op
    },
    update: async () => {
        // No-op
    },
};
