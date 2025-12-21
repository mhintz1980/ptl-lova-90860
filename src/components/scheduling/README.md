# Scheduling Components

This directory contains the scheduling system components for the pumptracker application.

## Components

### CalendarHeader

The main header component that contains the legend and action buttons.

**Features:**

- Production stage legend with color swatches
- Responsive design with collapse functionality on mobile
- Action buttons for calendar controls

### CalendarLegend

A responsive legend component showing production stages with color indicators.

**Features:**

- Color swatches matching the Kanban palette
- Interactive tooltips with stage descriptions
- Responsive design that collapses on mobile
- Proper ARIA attributes for accessibility
- Shows only active stages (QUEUE, FABRICATION, STAGED_FOR_POWDER, POWDER_COAT, ASSEMBLY, SHIP)

**Usage:**

```tsx
import { CalendarLegend } from './CalendarLegend'

;<CalendarLegend className="custom-class" />
```

### Tooltip

A reusable tooltip component with proper positioning and accessibility.

**Features:**

- Configurable positioning (top, bottom, left, right)
- Alignment options (start, center, end)
- Accessibility compliant with `role="tooltip"` and `aria-live="polite"`
- Smooth animations and transitions
- Arrow indicator pointing to the trigger element

**Usage:**

```tsx
import { Tooltip } from '../ui/Tooltip'

;<Tooltip content="Tooltip content" side="top" align="center">
  <div>Trigger element</div>
</Tooltip>
```

### SegmentTooltip

Specialized tooltip for calendar segments showing detailed information.

**Features:**

- Shows pump information (model, PO, serial)
- Displays date ranges and duration
- Stage information with color coding
- Week information for timeline context

**Usage:**

```tsx
import { SegmentTooltip } from './SegmentTooltip'

;<SegmentTooltip event={calendarEvent}>
  <CalendarEvent {...eventProps} />
</SegmentTooltip>
```

### StageSegmentTooltip

Tooltip for stage segments in timeline visualizations.

**Features:**

- Shows segment duration and percentage
- Date range information
- Offset from timeline start
- Pump serial number when available

## Accessibility Features

All components include comprehensive accessibility support:

- **ARIA Labels**: All interactive elements have proper `aria-label` attributes
- **Keyboard Navigation**: Calendar events support keyboard activation
- **Screen Reader Support**: Semantic HTML and ARIA roles
- **Focus Management**: Proper focus handling for interactive elements
- **Live Regions**: Tooltips use `aria-live="polite"` for dynamic content

## Styling

The components use Tailwind CSS with the design system tokens:

- Consistent with the Kanban palette
- Gradient backgrounds for stage colors
- Responsive design patterns
- Smooth transitions and animations

## Integration

The legend and tooltip system integrates seamlessly with:

- Calendar grid components
- Stage color constants from `../kanban/constants`
- Schedule library for date calculations
- Type definitions from the main types module
