# Segmented Calendar Implementation Guide

## Overview

The PumpTracker scheduling calendar features segmented timeline bars that visually represent the complete manufacturing pipeline for each pump. Each segment corresponds to a production stage with accurate duration calculations and color-coded visualization.

## Timeline Segmentation

### Stage Sequence

The manufacturing timeline follows this standard sequence:

1. **FABRICATION** - Build pump components (1-3 days)
2. **POWDER COAT** - Apply protective coating (5-7 days)  
3. **ASSEMBLY** - Assemble pump and components (1-2 days)
4. **TESTING** - Quality control and performance testing (1 day)
5. **SHIPPING** - Final preparation and dispatch (1 day)

### Duration Calculations

Stage durations are based on the pump model's catalog specifications:

```typescript
// Example: DD-6 pump lead times
{
  fabrication: 1.5,    // → 2 days (rounded up)
  powder_coat: 7,     // → 7 days
  assembly: 1,        // → 1 day  
  testing: 0.25,      // → 1 day (rounded up)
  total_days: 9.75    // → 12 days total with shipping
}
```

**Rounding Rules:**

- All fractional days are rounded up to ensure adequate time
- Minimum 1 day per stage
- Shipping calculated as remainder or default 1 day

## Visual Design

### Color Palette

Stage colors use gradients for visual depth:

```css
FABRICATION:  bg-gradient-to-r from-blue-500/70 to-sky-400/70
POWDER COAT:  bg-gradient-to-r from-purple-500/70 to-fuchsia-400/70  
ASSEMBLY:     bg-gradient-to-r from-amber-500/70 to-orange-400/70
TESTING:      bg-gradient-to-r from-rose-500/70 to-orange-400/70
SHIPPING:     bg-gradient-to-r from-emerald-500/70 to-lime-400/70
```

### Segment Layout

- **Horizontal Layout**: Segments flow left-to-right across calendar days
- **Consistent Height**: All segments maintain uniform height (32px)
- **Spacing**: 1px gap between segments for visual separation
- **Rounded Corners**: `rounded-xl` for modern appearance

## Tooltip Information

### Hover Tooltip Content

When hovering over any segment, the tooltip displays:

```
┌─────────────────────────────────┐
│ 🔵 Fabrication                 │
│ Stage 2                        │
├─────────────────────────────────┤
│ DD-6                           │
│ PO: PO2025-0001-01             │
│ Pump ID: pump-123              │
├─────────────────────────────────┤
│ Duration: 2 days               │
│ Nov 10, 2025 - Nov 11, 2025    │
├─────────────────────────────────┤
│ Week 1 of timeline             │
└─────────────────────────────────┘
```

### Tooltip Format Specifications

**Header Section:**

- Stage color indicator (3x3 rounded square)
- Stage name (font-medium, white)
- Stage row number (text-xs, gray-300)

**Pump Information:**

- Pump model (text-sm, font-medium, white)
- PO number (text-xs, gray-300)
- Pump ID (text-xs, gray-400)

**Date Information:**

- Duration in days with singular/plural handling
- Formatted date range (MMM d, yyyy format)
- Week context (Week X of timeline)

## Week Boundary Clamping

### The Challenge

When manufacturing timelines span multiple weeks, segments must be properly split at week boundaries while maintaining accurate duration representation.

### Solution Algorithm

The `projectSegmentsToWeek()` function handles this by:

1. **Calculate Week Range**: For each stage segment, determine which weeks it touches
2. **Find Intersections**: Calculate where the segment overlaps with each week
3. **Create Week Segments**: Split segments at week boundaries
4. **Maintain Percentages**: Calculate accurate percentage contributions per week

### Example: DD-6 Powder Coat Stage

```
Original: 7-day POWDER COAT segment
Timeline: Nov 12 (Wed) → Nov 18 (Tue)

Week Distribution:
Week 1 (Nov 10-16): 5 days (Wed, Thu, Fri, Sat, Sun)
  - Start Offset: Day 2 of week
  - Duration: 5 days
  - Percentage: 71.4% of week

Week 2 (Nov 17-23): 2 days (Mon, Tue)  
  - Start Offset: Day 0 of week
  - Duration: 2 days
  - Percentage: 28.6% of week
```

### Clamping Behavior

**Boundary Rules:**

- Segments never extend beyond week boundaries
- Partial weeks are accurately represented
- Zero-duration segments are filtered out
- Minimum 1/2-day duration per segment portion

**Visual Result:**

- Clean breaks at week boundaries
- Consistent visual flow across weeks
- Accurate duration representation

## Interactive Features

### Drag & Drop Scheduling

1. **Drag from Sidebar**: Unscheduled pumps appear in left sidebar
2. **Drop on Calendar**: Valid dates accept drops with visual feedback
3. **Timeline Generation**: Automatic calculation of all stage segments
4. **Persistence**: Schedule saved to store and localStorage

**Validation Rules:**

- No drops on past dates
- Must drop on valid calendar cells
- Visual feedback for invalid attempts

### Keyboard Navigation

- **Tab Order**: Logical progression through calendar events
- **Focus Indicators**: Visible outline on focused segments
- **Activation**: Enter or Space to trigger click events
- **Accessibility**: ARIA labels with stage and pump information

### Event Detail Panel

Click any segment to open the detail panel showing:

- Pump model and PO information
- Current stage with badge styling
- Date range with formatted display
- Action buttons for schedule management

## Technical Architecture

### Core Functions

```typescript
// Build complete timeline from pump and lead times
buildStageTimeline(pump: Pump, leadTimes: StageDurations): StageBlock[]

// Calculate percentage-based segments  
buildStageSegments(pump: Pump, leadTimes: StageDurations): StageSegment[]

// Project segments into week-based calendar events
projectSegmentsToWeek(segments: StageSegment[]): WeekSegment[]

// Build calendar events for rendering
buildCalendarEvents(options: BuildCalendarEventsOptions): CalendarStageEvent[]
```

### Data Flow

1. **Pump Data** → Lead Times Lookup
2. **Lead Times** → Stage Timeline  
3. **Timeline** → Segment Calculations
4. **Segments** → Week Projections
5. **Projections** → Calendar Events
6. **Events** → Visual Rendering

### Performance Considerations

- **Memoization**: Expensive calculations cached with useMemo
- **Efficient Filtering**: Early filtering of out-of-bounds events
- **Minimal Re-renders**: Stable object references for props
- **Lazy Loading**: Tooltips render on-demand only

## Testing

### Automated Tests

- **Unit Tests**: Schedule utility functions (schedule.spec.ts)
- **Component Tests**: Calendar rendering (MainCalendarGrid.spec.ts)  
- **Integration Tests**: Full drag-drop workflow
- **Accessibility Tests**: Keyboard navigation and screen readers

### Manual Testing Checklist

- [ ] Multi-color segments appear correctly
- [ ] Hover tooltips show accurate information
- [ ] Week boundaries split segments properly
- [ ] Drag-drop schedules pumps successfully
- [ ] Keyboard navigation works throughout
- [ ] Colors match Kanban board palette
- [ ] EventDetailPanel shows correct data

## Browser Compatibility

- **Modern Browsers**: Full support for CSS gradients and Grid
- **CSS Grid**: Used for calendar layout and segment positioning
- **CSS Custom Properties**: Dynamic theming support
- **ES6+ Features**: Modern JavaScript for utility functions

## Future Enhancements

### Potential Improvements

1. **Animation Support**: Smooth transitions when schedules change
2. **Progress Indicators**: Show completion percentage within segments
3. **Dependency Visualization**: Arrow connections between dependent stages
4. **Resource Loading**: Show capacity constraints and resource allocation
5. **Export Functions**: PDF or image export of schedule views

### Extension Points

- **Custom Stages**: Configurable stage sequences per product line
- **Alternative Calendars**: Week/Month/Year view switching
- **Integration APIs**: Connect to external scheduling systems
- **Mobile Support**: Touch-optimized interactions for mobile devices
