import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { eq, and, gte, lte, desc, inArray, lt, gt, sql, count } from 'drizzle-orm';
import Stripe from 'stripe';
import { createDb } from '../db';
import { services, appointments, availabilitySlots, activityLog, users } from '../db/schema';
import { authMiddleware, optionalAuth } from '../middleware/auth';
import { createRateLimitMiddleware } from '../middleware/rate-limit';
import { appointmentReminderEmail } from '../utils/email';
import type { Env, Variables } from '../types/env';

const booking = new Hono<{ Bindings: Env; Variables: Variables }>();
const bookingWriteRateLimit = createRateLimitMiddleware({
  namespace: 'booking-write',
  maxRequests: 20,
  windowSeconds: 60,
});

// ─── Public: List services ───
booking.get('/services', async (c) => {
  const db = createDb(c.env.DATABASE_URL ?? c.env.HYPERDRIVE);
  const page = Math.max(1, parseInt(c.req.query('page') ?? '1'));
  const limit = Math.min(100, Math.max(1, parseInt(c.req.query('limit') ?? '20')));
  const offset = (page - 1) * limit;

  const [{ total }] = await db.select({ total: count() }).from(services).where(eq(services.isActive, true));
  const data = await db.select().from(services)
    .where(eq(services.isActive, true))
    .orderBy(services.sortOrder)
    .limit(limit)
    .offset(offset);

  return c.json({ data, total: Number(total), page, limit, pages: Math.ceil(Number(total) / limit) });
});

// ─── Public: Get availability for a date ───
booking.get('/availability', zValidator('query', z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  serviceId: z.string().uuid(),
})), async (c) => {
  const { date, serviceId } = c.req.valid('query');
  const db = createDb(c.env.DATABASE_URL ?? c.env.HYPERDRIVE);

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
booking.post('/appointments', bookingWriteRateLimit, authMiddleware, zValidator('json', z.object({
  serviceId: z.string().uuid(),
  scheduledAt: z.string().datetime(),
  notes: z.string().optional(),
})), async (c) => {
  const userId = c.get('userId')!;
  const { serviceId, scheduledAt, notes } = c.req.valid('json');
  const db = createDb(c.env.DATABASE_URL ?? c.env.HYPERDRIVE);
  const stripe = new Stripe(c.env.STRIPE_SECRET_KEY);
  let appointmentId: string | null = null;

  try {
    const service = await db.select().from(services).where(eq(services.id, serviceId)).limit(1);
    if (!service.length) return c.json({ error: 'Service not found' }, 404);

    const user = await db.select().from(users).where(eq(users.id, userId)).limit(1);
    if (!user.length) return c.json({ error: 'User not found' }, 404);

    const startTime = new Date(scheduledAt);
    const endTime = new Date(startTime.getTime() + Number(service[0].durationMinutes) * 60000);

    const currentUser = user[0];
    const [appointment] = await db.transaction(async (tx) => {
      // Advisory lock ensures only one booking attempt can reserve this slot at a time.
      await tx.execute(sql`
        SELECT pg_advisory_xact_lock(hashtext(${`booking:${startTime.toISOString()}`}))
      `);

      const [conflict] = await tx.select({ id: appointments.id })
        .from(appointments)
        .where(and(
          inArray(appointments.status, ['pending', 'confirmed', 'in_progress']),
          lt(appointments.scheduledAt, endTime),
          gt(appointments.endAt, startTime),
        ))
        .limit(1);

      if (conflict) {
        throw new Error('SLOT_ALREADY_BOOKED');
      }

      const [createdAppointment] = await tx.insert(appointments).values({
        userId,
        serviceId,
        scheduledAt: startTime,
        endAt: endTime,
        notes,
        status: 'pending',
      }).returning();

      await tx.insert(activityLog).values({
        userId,
        action: 'appointment.booked',
        resourceType: 'appointment',
        resourceId: createdAppointment.id,
        metadata: { serviceName: service[0].name, scheduledAt },
      });

      return [createdAppointment];
    });

    appointmentId = appointment.id;

    const appOrigin = c.env.CORS_ORIGIN || 'https://cypherofhealing.com';
    const chargeAmount = Number(service[0].depositAmount ?? service[0].price);
    if (!Number.isFinite(chargeAmount) || chargeAmount <= 0) {
      return c.json({ error: 'Service price is not configured' }, 422);
    }

    let stripeCustomerId = currentUser.stripeCustomerId;
    if (!stripeCustomerId) {
      const customer = await stripe.customers.create({
        email: currentUser.email,
        name: currentUser.name,
        phone: currentUser.phone ?? undefined,
        metadata: {
          userId: currentUser.id,
          app: 'coh',
        },
      });

      stripeCustomerId = customer.id;
      await db.update(users)
        .set({ stripeCustomerId, updatedAt: new Date() })
        .where(eq(users.id, currentUser.id));
    }

    const checkoutSession = await stripe.checkout.sessions.create({
      mode: 'payment',
      customer: stripeCustomerId,
      client_reference_id: appointment.id,
      line_items: [
        {
          price_data: {
            currency: 'usd',
            unit_amount: Math.round(chargeAmount * 100),
            product_data: {
              name: service[0].depositAmount ? `${service[0].name} Deposit` : service[0].name,
              description: service[0].description ?? undefined,
            },
          },
          quantity: 1,
        },
      ],
      success_url: `${appOrigin}/booking?checkout=success&appointment=${appointment.id}`,
      cancel_url: `${appOrigin}/booking?checkout=cancelled&appointment=${appointment.id}`,
      metadata: {
        appointmentId: appointment.id,
        serviceId: service[0].id,
        serviceName: service[0].name,
        userId,
      },
      phone_number_collection: {
        enabled: true,
      },
    });

    // TODO: Schedule SMS reminder

    return c.json({ appointment, checkoutUrl: checkoutSession.url }, 201);
  } catch (error) {
    if (error instanceof Error && error.message === 'SLOT_ALREADY_BOOKED') {
      return c.json({ error: 'Selected time is no longer available' }, 409);
    }

    if (appointmentId) {
      await db.update(appointments)
        .set({ status: 'cancelled', updatedAt: new Date() })
        .where(eq(appointments.id, appointmentId));
    }

    return c.json({ error: 'Failed to create appointment' }, 500);
  }
});

// ─── Auth: Get my appointments ───
booking.get('/appointments', authMiddleware, async (c) => {
  const userId = c.get('userId')!;
  const db = createDb(c.env.DATABASE_URL ?? c.env.HYPERDRIVE);
  const page = Math.max(1, parseInt(c.req.query('page') ?? '1'));
  const limit = Math.min(100, Math.max(1, parseInt(c.req.query('limit') ?? '20')));
  const offset = (page - 1) * limit;

  const [{ total }] = await db.select({ total: count() }).from(appointments).where(eq(appointments.userId, userId));
  const data = await db.select().from(appointments)
    .where(eq(appointments.userId, userId))
    .orderBy(desc(appointments.scheduledAt))
    .limit(limit)
    .offset(offset);

  return c.json({ data, total: Number(total), page, limit, pages: Math.ceil(Number(total) / limit) });
});

// ─── Auth: Cancel appointment ───
booking.patch('/appointments/:id/cancel', authMiddleware, async (c) => {
  const userId = c.get('userId')!;
  const id = c.req.param('id');
  if (!id) return c.json({ error: 'Appointment ID is required' }, 400);
  const db = createDb(c.env.DATABASE_URL ?? c.env.HYPERDRIVE);

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
