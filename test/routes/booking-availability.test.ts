import { describe, expect, it } from 'vitest';

/**
 * The booking availability calculation is the core of the slot-booking UX:
 * given a service duration and existing bookings, return the list of free
 * 30-minute slot starts.
 *
 * Extracted here as a pure function so it can be tested without DB.
 * Mirrors the inline logic in src/routes/booking.ts (GET /availability).
 */

export interface AvailabilitySlot {
  startTime: string; // "HH:MM"
  endTime: string;   // "HH:MM"
}

export interface ExistingBooking {
  scheduledAt: Date;
  endAt: Date;
}

export function computeAvailableSlots(
  date: string,                // YYYY-MM-DD
  durationMinutes: number,
  slots: AvailabilitySlot[],
  existing: ExistingBooking[],
): string[] {
  return slots.flatMap((slot) => {
    const times: string[] = [];
    const [startH, startM] = slot.startTime.split(':').map(Number);
    const [endH, endM] = slot.endTime.split(':').map(Number);
    let current = startH * 60 + startM;
    const end = endH * 60 + endM;

    while (current + durationMinutes <= end) {
      const h = String(Math.floor(current / 60)).padStart(2, '0');
      const m = String(current % 60).padStart(2, '0');
      const slotTime = `${h}:${m}`;
      const slotDate = new Date(`${date}T${slotTime}:00`);
      const slotStart = slotDate.getTime();
      const slotEnd = slotStart + durationMinutes * 60_000;

      const conflict = existing.some((appt) => {
        const apptStart = appt.scheduledAt.getTime();
        const apptEnd = appt.endAt.getTime();
        return slotStart < apptEnd && slotEnd > apptStart;
      });

      if (!conflict) times.push(slotTime);
      current += 30;
    }
    return times;
  });
}

describe('computeAvailableSlots', () => {
  const slots: AvailabilitySlot[] = [{ startTime: '09:00', endTime: '17:00' }];
  const date = '2026-06-01';

  it('returns every 30-min slot when no bookings exist', () => {
    const available = computeAvailableSlots(date, 30, slots, []);
    expect(available[0]).toBe('09:00');
    expect(available).toContain('16:30');
    expect(available).not.toContain('17:00'); // no slot would fit ending after 17:00
  });

  it('hides slots that overlap an existing booking', () => {
    const existing: ExistingBooking[] = [{
      scheduledAt: new Date(`${date}T10:00:00`),
      endAt: new Date(`${date}T11:00:00`),
    }];

    const available = computeAvailableSlots(date, 30, slots, existing);
    expect(available).not.toContain('10:00'); // 10:00-10:30 fully inside booking
    expect(available).not.toContain('10:30'); // 10:30-11:00 fully inside booking
    expect(available).toContain('09:00');
    expect(available).toContain('09:30'); // 09:30-10:00 ends exactly at booking start (no overlap)
    expect(available).toContain('11:00');
  });

  it('respects service duration when checking conflicts', () => {
    const existing: ExistingBooking[] = [{
      scheduledAt: new Date(`${date}T10:30:00`),
      endAt: new Date(`${date}T11:00:00`),
    }];

    // 60-minute service starting at 10:00 would run until 11:00 — overlaps.
    const available = computeAvailableSlots(date, 60, slots, existing);
    expect(available).not.toContain('10:00');
    // But 11:00 is fine for a 60-minute service (runs 11:00-12:00).
    expect(available).toContain('11:00');
  });

  it('excludes slots that would extend past the closing time', () => {
    const available = computeAvailableSlots(date, 60, slots, []);
    expect(available).toContain('16:00'); // 16:00-17:00 fits
    expect(available).not.toContain('16:30'); // 16:30-17:30 does NOT fit
  });

  it('returns no slots when the day has no availability windows', () => {
    expect(computeAvailableSlots(date, 30, [], [])).toEqual([]);
  });

  it('returns no slots when service duration exceeds the window', () => {
    expect(computeAvailableSlots(date, 480 + 30, slots, [])).toEqual([]);
  });

  it('handles back-to-back bookings without leaving false gaps', () => {
    const existing: ExistingBooking[] = [
      { scheduledAt: new Date(`${date}T09:00:00`), endAt: new Date(`${date}T10:00:00`) },
      { scheduledAt: new Date(`${date}T10:00:00`), endAt: new Date(`${date}T11:00:00`) },
    ];

    const available = computeAvailableSlots(date, 30, slots, existing);
    expect(available).not.toContain('09:00');
    expect(available).not.toContain('09:30');
    expect(available).not.toContain('10:00');
    expect(available).not.toContain('10:30');
    expect(available).toContain('11:00');
  });
});
