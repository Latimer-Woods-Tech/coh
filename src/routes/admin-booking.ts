import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { eq, and, desc, gte, lte, count } from 'drizzle-orm';
import { createDb } from '../db';
import { appointments, services, availabilitySlots, activityLog } from '../db/schema';
import { authMiddleware, adminOnly } from '../middleware/auth';
import type { Env, Variables } from '../types/env';

const adminBooking = new Hono<{ Bindings: Env; Variables: Variables }>();

adminBooking.use('*', authMiddleware);
adminBooking.use('*', adminOnly);

// ─── Appointments ───

adminBooking.get('/appointments', async (c) => {
  const db = createDb(c.env.DATABASE_URL ?? c.env.HYPERDRIVE);
  const status = c.req.query('status');
  const date = c.req.query('date'); // YYYY-MM-DD
  const page = Math.max(1, parseInt(c.req.query('page') ?? '1'));
  const limit = Math.min(100, Math.max(1, parseInt(c.req.query('limit') ?? '20')));
  const offset = (page - 1) * limit;

  const conditions = [];
  if (status) conditions.push(eq(appointments.status, status as any));
  if (date) {
    const dayStart = new Date(`${date}T00:00:00`);
    const dayEnd = new Date(`${date}T23:59:59`);
    conditions.push(gte(appointments.scheduledAt, dayStart));
    conditions.push(lte(appointments.scheduledAt, dayEnd));
  }

  const where = conditions.length > 0 ? and(...conditions) : undefined;
  const [{ total }] = await db.select({ total: count() }).from(appointments).where(where);
  const data = await db.select().from(appointments)
    .where(where)
    .orderBy(desc(appointments.scheduledAt))
    .limit(limit)
    .offset(offset);

  return c.json({ data, total: Number(total), page, limit, pages: Math.ceil(Number(total) / limit) });
});

adminBooking.patch('/appointments/:id', zValidator('json', z.object({
  status: z.enum(['pending', 'confirmed', 'in_progress', 'completed', 'cancelled', 'no_show']).optional(),
  notes: z.string().optional(),
  reminderChannel: z.enum(['sms', 'email', 'both']).optional(),
})), async (c) => {
  const id = c.req.param('id');
  const updates = c.req.valid('json');
  const db = createDb(c.env.DATABASE_URL ?? c.env.HYPERDRIVE);

  const [updated] = await db.update(appointments)
    .set({ ...updates, updatedAt: new Date() })
    .where(eq(appointments.id, id))
    .returning();

  if (!updated) return c.json({ error: 'Appointment not found' }, 404);

  await db.insert(activityLog).values({
    userId: c.get('userId')!,
    action: `admin.appointment.${updates.status ?? 'updated'}`,
    resourceType: 'appointment',
    resourceId: id,
    metadata: updates,
  });

  return c.json({ appointment: updated });
});

// ─── Services ───

adminBooking.get('/services', async (c) => {
  const db = createDb(c.env.DATABASE_URL ?? c.env.HYPERDRIVE);
  const data = await db.select().from(services).orderBy(services.sortOrder);
  return c.json({ data });
});

adminBooking.post('/services', zValidator('json', z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  durationMinutes: z.number().int().min(15),
  price: z.string(),
  depositAmount: z.string().optional(),
  category: z.string().optional(),
  sortOrder: z.number().int().optional(),
})), async (c) => {
  const body = c.req.valid('json');
  const db = createDb(c.env.DATABASE_URL ?? c.env.HYPERDRIVE);

  const [service] = await db.insert(services).values(body).returning();

  await db.insert(activityLog).values({
    userId: c.get('userId')!,
    action: 'admin.service.created',
    resourceType: 'service',
    resourceId: service.id,
    metadata: { name: service.name },
  });

  return c.json({ service }, 201);
});

adminBooking.put('/services/:id', zValidator('json', z.object({
  name: z.string().optional(),
  description: z.string().optional(),
  durationMinutes: z.number().int().min(15).optional(),
  price: z.string().optional(),
  depositAmount: z.string().optional(),
  category: z.string().optional(),
  isActive: z.boolean().optional(),
  sortOrder: z.number().int().optional(),
})), async (c) => {
  const id = c.req.param('id');
  const body = c.req.valid('json');
  const db = createDb(c.env.DATABASE_URL ?? c.env.HYPERDRIVE);

  const [updated] = await db.update(services).set(body).where(eq(services.id, id)).returning();
  if (!updated) return c.json({ error: 'Service not found' }, 404);

  return c.json({ service: updated });
});

adminBooking.delete('/services/:id', async (c) => {
  const id = c.req.param('id');
  const db = createDb(c.env.DATABASE_URL ?? c.env.HYPERDRIVE);

  const [updated] = await db.update(services)
    .set({ isActive: false })
    .where(eq(services.id, id))
    .returning({ id: services.id });

  if (!updated) return c.json({ error: 'Service not found' }, 404);
  return c.json({ success: true });
});

// ─── Availability Slots ───

adminBooking.get('/availability', async (c) => {
  const db = createDb(c.env.DATABASE_URL ?? c.env.HYPERDRIVE);
  const data = await db.select().from(availabilitySlots).orderBy(availabilitySlots.dayOfWeek);
  return c.json({ data });
});

adminBooking.post('/availability', zValidator('json', z.object({
  dayOfWeek: z.number().int().min(0).max(6),
  startTime: z.string().regex(/^\d{2}:\d{2}$/),
  endTime: z.string().regex(/^\d{2}:\d{2}$/),
})), async (c) => {
  const body = c.req.valid('json');
  const db = createDb(c.env.DATABASE_URL ?? c.env.HYPERDRIVE);

  const [slot] = await db.insert(availabilitySlots).values(body).returning();
  return c.json({ slot }, 201);
});

adminBooking.put('/availability/:id', zValidator('json', z.object({
  dayOfWeek: z.number().int().min(0).max(6).optional(),
  startTime: z.string().regex(/^\d{2}:\d{2}$/).optional(),
  endTime: z.string().regex(/^\d{2}:\d{2}$/).optional(),
  isActive: z.boolean().optional(),
})), async (c) => {
  const id = c.req.param('id');
  const body = c.req.valid('json');
  const db = createDb(c.env.DATABASE_URL ?? c.env.HYPERDRIVE);

  const [updated] = await db.update(availabilitySlots).set(body).where(eq(availabilitySlots.id, id)).returning();
  if (!updated) return c.json({ error: 'Slot not found' }, 404);
  return c.json({ slot: updated });
});

export default adminBooking;
