import { Pump } from "../types";
import { nanoid } from "nanoid";

const TEST_PUMPS_DATA = [
  // United Rentals
  // PO# 13501: 2× RL200-SAFE, 1× RL300, 2× DD4SE
  {
    customer: "United Rentals",
    po: "PO# 13501",
    items: [
      { model: "RL200-SAFE", qty: 2 },
      { model: "RL300", qty: 1 },
      { model: "DD4SE", qty: 2 },
    ],
  },
  // PO# 13502: 1× RL300-SAFE, 2× DD6-SAFE
  {
    customer: "United Rentals",
    po: "PO# 13502",
    items: [
      { model: "RL300-SAFE", qty: 1 },
      { model: "DD-6 SAFE", qty: 2 },
    ],
  },

  // National Tank & Equipment
  // PO# 22569: 2× DD6-SAFE, 2× HC150-SAFE, 1× DP150
  {
    customer: "Nat. Tank & Equip.",
    po: "PO# 22569",
    items: [
      { model: "DD-6 SAFE", qty: 2 },
      { model: "HC-150-SAFE", qty: 2 },
      { model: "DP-150", qty: 1 },
    ],
  },

  // Sunbelt Rentals
  // PO# 33567: 3× DD4SE
  {
    customer: "Sunbelt Rentals",
    po: "PO# 33567",
    items: [
      { model: "DD4SE", qty: 3 },
    ],
  },

  // RingPower CAT
  // PO# 55534: 2× RPC-DP-200
  {
    customer: "Ring Power CAT",
    po: "PO# 55534",
    items: [
      { model: "RPC-DP-200", qty: 2 }, // This model is not in catalog, will need careful handling
    ],
  },

  // Rain for Rent
  // PO# 87564: 4× DD6-SAFE
  {
    customer: "Rain For Rent",
    po: "PO# 87564",
    items: [
      { model: "DD-6 SAFE", qty: 4 },
    ],
  },
];

// Helper to generate pumps
export function getTestPumps(): Pump[] {
  const pumps: Pump[] = [];
  let serialCounter = 5000;

  const priorities: ("Urgent" | "Rush" | "High" | "Normal" | "Low")[] = ["Urgent", "Rush", "High", "Normal", "Low"];

  TEST_PUMPS_DATA.forEach((order) => {
    order.items.forEach((item) => {
      for (let i = 0; i < item.qty; i++) {
        // Random Priority
        const priority = priorities[Math.floor(Math.random() * priorities.length)];

        // Random Promise Date (within next 2 months)
        const now = new Date();
        const daysToAdd = Math.floor(Math.random() * 60); // 0 to 60 days
        const promiseDate = new Date(now.setDate(now.getDate() + daysToAdd)).toISOString();

        pumps.push({
          id: nanoid(),
          serial: serialCounter++,
          po: order.po,
          customer: order.customer,
          model: item.model,
          stage: "QUEUE", // Default to QUEUE as requested "open orders"
          priority: priority,
          last_update: new Date().toISOString(),
          value: 0, // Placeholder, could lookup if needed
          promiseDate: promiseDate,
          // Add minimal required fields
          description: `Test Unit - ${item.model}`,
        } as Pump);
      }
    });
  });

  return pumps;
}
