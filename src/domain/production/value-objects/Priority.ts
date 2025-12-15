/**
 * Priority Value Object - Defines urgency levels for pump orders.
 *
 * Order of urgency (low to high): Low → Normal → High → Rush → Urgent
 * Affects scheduling order.
 */

export const PRIORITIES = ['Low', 'Normal', 'High', 'Rush', 'Urgent'] as const;

export type Priority = (typeof PRIORITIES)[number];

/**
 * Returns the priority level (0-4) for sorting purposes.
 * Higher number = higher priority.
 */
export function getPriorityLevel(priority: Priority): number {
    return PRIORITIES.indexOf(priority);
}

/**
 * Compares two priorities for sorting.
 * Returns positive if a > b, negative if a < b, 0 if equal.
 */
export function comparePriority(a: Priority, b: Priority): number {
    return getPriorityLevel(a) - getPriorityLevel(b);
}
