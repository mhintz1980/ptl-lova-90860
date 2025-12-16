# Scheduling Feature - Work in Progress

**Date:** 2025-12-16  
**Session Summary:** Pause feature complete; calendar timeline precision incomplete

---

## Completed Features

### ✅ Phase 1: Pause/Resume Feature
- Added `isPaused`, `pausedAt`, `pausedStage`, `totalPausedDays` fields to `Pump` type
- Added `pausePump()` / `resumePump()` store actions
- **Pause/Resume button** in PumpDetailModal (small, sharp corners, left of Edit)
- **Red rubber stamp** overlay on paused cards and modal
- Blue Edit button with glow effect
- Visible Exit button in both light/dark mode
- Powder color dot in modal now shows actual color

### ✅ Phase 2: Lock System
- **Lock Date Picker** in toolbar (`src/components/toolbar/LockDatePicker.tsx`)
- **`isPumpLocked(id)`** selector in store
- **Lock protection** in `moveStage()` - prevents moving locked pumps
- **"LOCKED" badge** on pump cards (amber, top-left corner)

---

## In Progress: Calendar Timeline Precision

### The Problem
The calendar view doesn't accurately reflect job durations:
1. All progress bars appear as exactly 1 day regardless of actual man-hours
2. A 16 man-hour job (should be 2 days) shows as 1 day
3. A 12 man-hour job (should be 1.5 days) shows as 1 day

### What We Tried

#### Attempt 1: Fractional days in `buildStageTimeline`
**File:** `src/lib/schedule.ts`

Changed calculation from:
```typescript
days = Math.ceil(work_hours.fabrication / capacityConfig.fabrication.dailyManHours);
```
To:
```typescript
const roundToQuarter = (value) => Math.round(value * 4) / 4;
days = roundToQuarter(work_hours.fabrication / capacityConfig.fabrication.dailyManHours);
```

**Result:** Store now calculates fractional days (0.25 precision), but UI still shows 1 day.

#### Attempt 2: Replace `addBusinessDays` with `addFractionalDays`
`date-fns addDays()` truncates decimals - `addDays(d, 0.5)` returns same date.

Created custom helper:
```typescript
const MS_PER_DAY = 24 * 60 * 60 * 1000;
const addFractionalDays = (date, days) => new Date(date.getTime() + days * MS_PER_DAY);
```

**Result:** Timeline dates now correct in data, but UI still shows 1 day.

#### Attempt 3: Fix `buildEventSegments`
Changed from `differenceInCalendarDays` (integers) to fractional calculation.
Changed minimum span from `Math.max(1, ...)` to `Math.max(0.25, ...)`.

**Result:** Segments now have fractional spans in data, but UI still shows 1 day.

#### Attempt 4: Fix CalendarEvent CSS
**File:** `src/components/scheduling/CalendarEvent.tsx`

Problem: CSS grid `span` only accepts integers (`span 1.5` is invalid).

Changed to use percentage width:
```typescript
gridColumnEnd: `span ${Math.max(1, Math.ceil(event.span))}`,
width: event.span < 1 || event.span % 1 !== 0
  ? `${(event.span / Math.ceil(event.span)) * 100}%`
  : undefined,
```

**Result:** Still not working - need to investigate further.

---

## Root Cause Analysis

The scheduling calculation chain:
1. `buildStageTimeline()` ✅ - now produces fractional `days` values
2. `buildEventSegments()` ✅ - now produces fractional `span` values  
3. `CalendarEvent` CSS ❓ - grid positioning doesn't support fractional spans

**Possible issues:**
- CSS grid positioning fundamentally doesn't support fractional columns
- May need to abandon grid for absolute positioning with calculated widths
- May need to use CSS `calc()` with percentage-based positioning

---

## Other Known Issues

1. **Stage capacity not enforced** - Can stack unlimited jobs on same day
2. **Kanban ↔ Calendar sync** - Changes in one view don't reflect in other
3. **In-production pump dates** - All in-production pumps show as starting "today"

---

## Files Modified This Session

### New Files:
- `src/components/toolbar/LockDatePicker.tsx` - Lock date picker component

### Modified Files:
- `src/types.ts` - Added pause-related fields to Pump interface
- `src/store.ts` - Added pausePump, resumePump, isPumpLocked
- `src/components/kanban/PumpCard.tsx` - PAUSED stamp, LOCKED badge, removed grayscale
- `src/components/ui/PumpDetailModal.tsx` - Pause button, stamp, blue Edit, visible Exit
- `src/components/layout/Toolbar.tsx` - Added LockDatePicker
- `src/lib/schedule.ts` - Fractional day calculations
- `src/lib/schedule-helper.test.ts` - Updated test expectations
- `src/components/scheduling/CalendarEvent.tsx` - Attempted fractional width fix

---

## Next Steps

1. **Fix calendar bar widths** - Either:
   - Use absolute positioning with pixel/percentage widths
   - Use CSS transform scale
   - Redesign grid to support sub-cell positioning

2. **Enforce stage capacity** - Block over-scheduling per day

3. **Fix in-production pump dates** - Use actual start dates from history

4. **Test lock system thoroughly** - After calendar is fixed
