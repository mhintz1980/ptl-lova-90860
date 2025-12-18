import { render, screen } from '@testing-library/react';
import { CalendarEvent } from './CalendarEvent';
import { CalendarStageEvent } from '../../lib/schedule';
import { describe, it, expect } from 'vitest';

describe('CalendarEvent', () => {
    const mockEvent: CalendarStageEvent = {
        id: 'test-event-1',
        pumpId: 'pump-1',
        stage: 'FABRICATION',
        title: 'Test Pump',
        subtitle: 'PO-123',
        week: 0,
        startDay: 0,
        span: 1,
        row: 0,
        startDate: new Date(),
        endDate: new Date(),
    };

    it('renders with default full-day span', () => {
        // startDay: 0, span: 1
        // Expected: gridColumnEnd: span 1, marginLeft: 0%, width: 100%
        render(<CalendarEvent event={mockEvent} />);
        const eventEl = screen.getByTestId('calendar-event');

        expect(eventEl.style.gridColumnStart).toBe('1'); // floor(0) + 1
        expect(eventEl.style.gridColumnEnd).toBe('span 1'); // ceil(1) - floor(0) = 1
        expect(eventEl.style.marginLeft).toBe('0%');
        expect(eventEl.style.width).toBe('100%');
    });

    it('renders correct fractional styles for half-day duration', () => {
        // startDay: 0, span: 0.5
        // Expected: gridColumnEnd: span 1, marginLeft: 0%, width: 50%
        const halfDayEvent = { ...mockEvent, span: 0.5 };
        render(<CalendarEvent event={halfDayEvent} />);
        const eventEl = screen.getByTestId('calendar-event');

        // ceil(0.5) - floor(0) = 1 column
        expect(eventEl.style.gridColumnEnd).toBe('span 1');
        expect(eventEl.style.width).toBe('50%'); // 0.5 / 1 * 100
    });

    it('renders correct fractional styles for offset start', () => {
        // startDay: 0.5, span: 0.5
        // Expected: starts in col 1, spans 1 col, margin 50%, width 50%
        const offsetEvent = { ...mockEvent, startDay: 0.5, span: 0.5 };
        render(<CalendarEvent event={offsetEvent} />);
        const eventEl = screen.getByTestId('calendar-event');

        // gridColumnStart: floor(0.5) + 1 = 1
        expect(eventEl.style.gridColumnStart).toBe('1');
        // totalSpan: ceil(0.5 + 0.5) - floor(0.5) = 1 - 0 = 1
        expect(eventEl.style.gridColumnEnd).toBe('span 1');

        // marginLeft: (0.5 % 1) / 1 * 100 = 50%
        expect(eventEl.style.marginLeft).toBe('50%');

        // width: 0.5 / 1 * 100 = 50%
        expect(eventEl.style.width).toBe('50%');
    });

    it('renders correct styles for multi-day fractional span', () => {
        // startDay: 1.5, span: 1.5 (ends at 3.0)
        // Expected: starts col 2, spans 2 cols (2 & 3), margin 25% (of 2 cols?? no wait)

        // Logic:
        // gridColumnStart: floor(1.5) + 1 = 2
        // totalSpan: ceil(1.5 + 1.5) - floor(1.5) = 3 - 1 = 2

        // marginLeft: (1.5 % 1) / 2 * 100 = 0.5 / 2 * 100 = 25%
        // width: 1.5 / 2 * 100 = 75%

        const multiDayEvent = { ...mockEvent, startDay: 1.5, span: 1.5 };
        render(<CalendarEvent event={multiDayEvent} />);
        const eventEl = screen.getByTestId('calendar-event');

        expect(eventEl.style.gridColumnStart).toBe('2');
        expect(eventEl.style.gridColumnEnd).toBe('span 2');
        expect(eventEl.style.marginLeft).toBe('25%');
        expect(eventEl.style.width).toBe('75%');
    });
});
