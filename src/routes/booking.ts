import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { eq, and, gte, lte, desc } from 'drizzle-orm';
import { createDb } from '../db';
import { services, appointments, availabilitySlots, activityLog } from '../db/schema';
import { authMiddleware, optionalAuth } from '../middleware/auth';
import type { Env, Variables } from '../types/env';

const booking = new Hono<{ Bindings: Env; Variables: Variables }>();

// ─── Public: List services ───
booking.get('/services', async (c) => {
  const db = createDb(c.env.HYPERDRIVE);
  const allServices = await db.select().from(services)
    .where(eq(services.isActive, true))
    .orderBy(services.sortOrder);
  return c.json({ services: allServices });
});

// ─── Public: Get availability for a date ───
booking.get('/availability', zValidator('query', z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  serviceId: z.string().uuid(),
})), async (c) => {
  const { date, serviceId } = c.req.valid('query');
  const db = createDb(c.env.HYPERDRIVE);

  const dayOfWeek = new Date(date).getDay();
  const slots = await db.select().from(availabilitySlots)
    .where(and(eq(availabilitySlots.dayOfWeek, dayOfWeek), eq(availabilitySlots.isActive, true)));

  const service = await db.select().from(services).where(eq(services.id, serviceId)).limit(1);
  if (!service.length) return c.json({ error: 'Service not found' }, 404);

  const dayStart = new Date(`${date}T00:00:00`);
  const dayEnd = new Date(`${date}T23:59:59`);
  const existingAppts = await db.select().from(appointments)
    .where(and(
      gte(appointments.scheduledAt, dayStart),
      lte(appointments.scheduledAt, dayEnd),
      eq(appointments.status, 'confirmed')
    ));

  // Calculate available time slots (30-min intervals minus booked)
  const available = slots.flatMap(slot => {
    const times: string[] = [];
    const [startH, startM] = slot.startTime.split(':').map(Number);
    const [endH, endM] = slot.endTime.split(':').map(Number);
    let current = startH * 60 + startM;
    const end = endH * 60 + endM;
    const duration = Number(service[0].durationMinutes);

    while (current + duration <= end) {
      const h = String(Math.floor(current / 60)).padStart(2, '0');
      const m = String(current % 60).padStart(2, '0');
      const slotTime = `${h}:${m}`;
      const slotDate = new Date(`${date}T${slotTime}:00`);

      const isBooked = existingAppts.some(appt => {
        const apptStart = new Date(appt.scheduledAt).getTime();
        const apptEnd = new Date(appt.endAt).getTime();
        const slotStart = slotDate.getTime();
        const slotEnd = slotStart + duration * 60000;
        return slotStart < apptEnd && slotEnd > apptStart;
      });

      if (!isBooked) times.push(slotTime);
      current += 30;
    }
    return times;
  });

  return c.json({ date, serviceId, availableSlots: available });
});

// ─── Auth: Book appointment ───
booking.post('/appointments', authMiddleware, zValidator('json', z.object({
  serviceId: z.string().uuid(),
  scheduledAt: z.string().datetime(),
  notes: z.string().optional(),
})), async (c) => {
  const userId = c.get('userId')!;
  const { serviceId, scheduledAt, notes } = c.req.valid('json');
  const db = createDb(c.env.HYPERDRIVE);

  const service = await db.select().from(services).where(eq(services.id, serviceId)).limit(1);
  if (!service.length) return c.json({ error: 'Service not found' }, 404);

  const startTime = new Date(scheduledAt);
  const endTime = new Date(startTime.getTime() + Number(service[0].durationMinutes) * 60000);

  const [appointment] = await db.insert(appointments).values({
    userId,
    serviceId,
    scheduledAt: startTime,
    endAt: endTime,
    notes,
    status: 'pending',
  }).returning();

  // Log activity (feeds CRM and cross-sell engine)
  await db.insert(activityLog).values({
    userId,
    action: 'appointment.booked',
    resourceType: 'appointment',
    resourceId: appointment.id,
    metadata: { serviceName: service[0].name, scheduledAt },
  });

  // TODO: Create Stripe PaymentIntent for deposit
  // TODO: Send confirmation email
  // TODO: Schedule SMS reminder

  return c.json({ appointment }, 201);
});

// ─── Auth: Get my appointments ───
booking.get('/appointments', authMiddleware, async (c) => {
  const userId = c.get('userId')!;
  const db = createDb(c.env.HYPERDRIVE);

  const myAppointments = await db.select().from(appointments)
    .where(eq(appointments.userId, userId))
    .orderBy(desc(appointments.scheduledAt))
    .limit(20);

  return c.json({ appointments: myAppointments });
});

// ─── Auth: Cancel appointment ───
booking.patch('/appointments/:id/cancel', authMiddleware, async (c) => {
  const userId = c.get('userId')!;
  const id = c.req.param('id');
  if (!id) return c.json({ error: 'Appointment ID is required' }, 400);
  const db = createDb(c.env.HYPERDRIVE);

  const [updated] = await db.update(appointments)
    .set({ status: 'cancelled', updatedAt: new Date() })
    .where(and(eq(appointments.id, id), eq(appointments.userId, userId)))
    .returning();

  if (!updated) return c.json({ error: 'Appointment not found' }, 404);

  await db.insert(activityLog).values({
    userId,
    action: 'appointment.cancelled',
    resourceType: 'appointment',
    resourceId: id,
  });

  return c.json({ appointment: updated });
});

export default booking;
