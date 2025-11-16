# Stage Segments Store Integration

This document describes the integration of stage segment functionality into the PumpTracker Zustand store.

## Overview

The `getStageSegments` selector has been added to the main store to provide access to calculated stage timeline segments for individual pumps. This enables components to easily access the scheduled timeline for each pump without duplicating calculation logic.

## New Store Selector

### `getStageSegments(pumpId: string): StageBlock[] | null`

Returns an array of `StageBlock` objects representing the scheduled timeline for a pump, or `null` if the pump cannot be processed.

#### Parameters
- `pumpId`: The ID of the pump to get segments for

#### Returns
- `StageBlock[]`: Array of stage segments with start/end dates and durations
- `null`: If pump is not found, unscheduled, or missing lead times

#### StageBlock Interface
```typescript
interface StageBlock {
  stage: Stage;
  start: Date;
  end: Date;
  days: number;
  pump: Pump;
}
```

## Usage Examples

### Basic Usage in Components

```typescript
import { useApp } from '../store';

function MyComponent({ pumpId }: { pumpId: string }) {
  const getStageSegments = useApp(state => state.getStageSegments);
  const segments = getStageSegments(pumpId);

  if (!segments) {
    return <div>No schedule available</div>;
  }

  return (
    <div>
      {segments.map(segment => (
        <div key={segment.stage}>
          {segment.stage}: {segment.start} to {segment.end} ({segment.days} days)
        </div>
      ))}
    </div>
  );
}
```

### Error Handling

The selector handles these edge cases automatically:

1. **Pump not found**: Returns `null`
2. **Missing scheduledStart**: Returns `null` (unscheduled pump)
3. **Missing lead times**: Returns `null` (model not in catalog)
4. **Calculation errors**: Returns `null` with console error

### Memoization

The selector is memoized for performance with these features:

- **Cache TTL**: 5 seconds
- **Cache key**: Based on `(pumpId, model, scheduledStart, leadTimesHash)`
- **Automatic cleanup**: Removes oldest entries when cache exceeds 100 items

## Integration Details

### Type Conversion

The selector handles type conversion between:
- `Record<string, number>` (from catalog lead times)
- `StageDurations` (required by `buildStageTimeline`)

### Helper Functions Used

- `buildStageTimeline()`: Core timeline calculation from `schedule.ts`
- `getModelLeadTimes()`: Lead times lookup from catalog
- `hashLeadTimes()`: Creates deterministic cache keys

## Implementation

### Key Features

1. **Seamless Integration**: Works with existing Zustand store structure
2. **Proper Error Handling**: Graceful fallbacks for edge cases
3. **Performance Optimized**: Memoization prevents unnecessary recalculations
4. **Type Safe**: Full TypeScript support with proper interfaces

### Early Returns

The selector performs early returns for efficiency:

```typescript
// Early return for missing pump
if (!pump) return null;

// Early return for missing schedule
if (!pump.scheduledStart) return null;

// Early return for missing lead times
if (!leadTimes) return null;
```

## Testing

See `test-stage-segments.ts` for test cases covering:
- Normal operation with scheduled pump
- Edge cases (invalid ID, unscheduled pump)
- Memoization behavior

## Example Component

See `src/components/example/StageSegmentsExample.tsx` for a complete example demonstrating:
- Usage of the selector
- Display of stage segments
- Error handling for various scenarios
- Visual representation of timeline

## Migration Guide

For existing code that needs stage timeline information:

### Before (manual calculation)
```typescript
// Manual calculation in component
const leadTimes = getModelLeadTimes(pump.model);
const timeline = buildStageTimeline(pump, leadTimes);
```

### After (using store selector)
```typescript
// Using the new selector
const segments = getStageSegments(pumpId);
```

Benefits:
- Centralized logic
- Automatic memoization
- Error handling
- Type safety
- Consistent data access pattern