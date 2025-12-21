/**
 * MigrationAdapter - Handles legacy data format conversion.
 *
 * Converts legacy pump data format to new domain entity format.
 * Handles "POWDER COAT" → "POWDER_COAT" normalization.
 */
import { PumpProps } from '../../domain/production/entities/Pump';
import { Stage, STAGES } from '../../domain/production/value-objects/Stage';
import { Priority, PRIORITIES } from '../../domain/production/value-objects/Priority';

/**
 * Legacy pump format from existing store.ts
 */
export interface LegacyPump {
    id: string;
    serial: number;
    po: string;
    customer: string;
    model: string;
    stage: string; // May be "POWDER COAT" with space
    priority?: string;
    powder_color?: string;
    last_update: string;
    value: number;
    forecastStart?: string;
    forecastEnd?: string;
    promiseDate?: string;
    work_hours?: {
        fabrication: number;
        assembly: number;
        testing: number;
        shipping: number;
    };
}

/**
 * Normalize a stage string to the canonical Stage type.
 * Handles "POWDER COAT" (space) → "POWDER_COAT" (underscore).
 */
export function normalizeStage(stage: string): Stage {
    // Handle the space/underscore difference
    const normalized = stage.replace(/\s+/g, '_').toUpperCase();

    // Check if it's a valid stage
    if (STAGES.includes(normalized as Stage)) {
        return normalized as Stage;
    }

    // Fallback to QUEUE for invalid stages
    console.warn(`Unknown stage "${stage}", defaulting to QUEUE`);
    return 'QUEUE';
}

/**
 * Normalize a priority string to the canonical Priority type.
 */
export function normalizePriority(priority: string | undefined): Priority {
    if (!priority) {
        return 'Normal';
    }

    // Try case-insensitive match
    const match = PRIORITIES.find(
        (p) => p.toLowerCase() === priority.toLowerCase()
    );

    if (match) {
        return match;
    }

    console.warn(`Unknown priority "${priority}", defaulting to Normal`);
    return 'Normal';
}

/**
 * Convert legacy pump data to new PumpProps format.
 */
export function migrateLegacyPump(legacy: LegacyPump): PumpProps {
    return {
        id: legacy.id,
        serial: legacy.serial,
        po: legacy.po,
        customer: legacy.customer,
        model: legacy.model,
        stage: normalizeStage(legacy.stage),
        priority: normalizePriority(legacy.priority),
        powder_color: legacy.powder_color,
        last_update: legacy.last_update,
        value: legacy.value,
        forecastStart: legacy.forecastStart,
        forecastEnd: legacy.forecastEnd,
        promiseDate: legacy.promiseDate,
        work_hours: legacy.work_hours,
    };
}

/**
 * Convert new PumpProps back to legacy format (for compatibility during migration).
 */
export function toLegacyFormat(props: PumpProps): LegacyPump {
    return {
        ...props,
        // Convert POWDER_COAT back to "POWDER COAT" for legacy compatibility
        stage: props.stage === 'POWDER_COAT' ? 'POWDER COAT' : props.stage,
        priority: props.priority,
    };
}
