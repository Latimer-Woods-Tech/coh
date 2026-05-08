import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { eq, desc, count } from 'drizzle-orm';
import { createDb } from '../db';
import { events, eventRegistrations, users, activityLog } from '../db/schema';
import { authMiddleware, adminOnly } from '../middleware/auth';
import type { Env, Variables } from '../types/env';

const adminEvents = new Hono<{ Bindings: Env; Variables: Variables }>();

adminEvents.use('*', authMiddleware);
adminEvents.use('*', adminOnly);

// ─────────────────────────────────────
// EVENT MANAGEMENT
// ─────────────────────────────────────

adminEvents.get('/events', async (c) => {
  const db = createDb(c.env.DATABASE_URL ?? c.env.HYPERDRIVE);
  const page = Math.max(1, parseInt(c.req.query('page') ?? '1'));
  const limit = Math.min(100, Math.max(1, parseInt(c.req.query('limit') ?? '20')));
  const offset = (page - 1) * limit;

  const [{ total }] = await db.select({ total: count() }).from(events);
  const data = await db.select().from(events)
    .orderBy(desc(events.scheduledAt))
    .limit(limit)
    .offset(offset);

  return c.json({ data, total: Number(total), page, limit, pages: Math.ceil(Number(total) / limit) });
});

adminEvents.post('/events', zValidator('json', z.object({
  title: z.string().min(1),
  slug: z.string().min(1),
  description: z.string().optional(),
  type: z.enum(['webinar', 'workshop', 'consultation']),
  scheduledAt: z.string().datetime().optional(),
  durationMinutes: z.number().int().min(15).optional(),
  price: z.string().optional(),
  maxAttendees: z.number().int().positive().optional(),
  meetingUrl: z.string().url().optional(),
  thumbnailUrl: z.string().url().optional(),
  timezone: z.string().default('America/New_York'),
})), async (c) => {
  const body = c.req.valid('json');
  const db = createDb(c.env.DATABASE_URL ?? c.env.HYPERDRIVE);

  const [event] = await db.insert(events).values({
    ...body,
    scheduledAt: body.scheduledAt ? new Date(body.scheduledAt) : undefined,
    status: 'draft',
  }).returning();

  await db.insert(activityLog).values({
    userId: c.get('userId')!,
    action: 'admin.event.created',
    resourceType: 'event',
    resourceId: event.id,
    metadata: { title: event.title },
  });

  return c.json({ event }, 201);
});

adminEvents.put('/events/:id', zValidator('json', z.object({
  title: z.string().optional(),
  description: z.string().optional(),
  scheduledAt: z.string().datetime().optional(),
  durationMinutes: z.number().int().min(15).optional(),
  price: z.string().optional(),
  maxAttendees: z.number().int().positive().optional(),
  meetingUrl: z.string().url().optional(),
  thumbnailUrl: z.string().url().optional(),
  replayUrl: z.string().url().optional(),
  replayAvailable: z.boolean().optional(),
  stripePriceId: z.string().optional(),
})), async (c) => {
  const id = c.req.param('id');
  const body = c.req.valid('json');
  const db = createDb(c.env.DATABASE_URL ?? c.env.HYPERDRIVE);

  const [updated] = await db.update(events)
    .set({
      ...body,
      scheduledAt: body.scheduledAt ? new Date(body.scheduledAt) : undefined,
      updatedAt: new Date(),
    })
    .where(eq(events.id, id))
    .returning();

  if (!updated) return c.json({ error: 'Event not found' }, 404);
  return c.json({ event: updated });
});

adminEvents.patch('/events/:id/status', zValidator('json', z.object({
  status: z.enum(['draft', 'scheduled', 'live', 'completed', 'cancelled']),
})), async (c) => {
  const id = c.req.param('id');
  const { status } = c.req.valid('json');
  const db = createDb(c.env.DATABASE_URL ?? c.env.HYPERDRIVE);

  const [updated] = await db.update(events)
    .set({ status, updatedAt: new Date() })
    .where(eq(events.id, id))
    .returning();

  if (!updated) return c.json({ error: 'Event not found' }, 404);

  await db.insert(activityLog).values({
    userId: c.get('userId')!,
    action: `admin.event.${status}`,
    resourceType: 'event',
    resourceId: id,
  });

  return c.json({ event: updated });
});

adminEvents.get('/events/:id/registrations', async (c) => {
  const id = c.req.param('id');
  const db = createDb(c.env.DATABASE_URL ?? c.env.HYPERDRIVE);

  const registrations = await db
    .select({
      registrationId: eventRegistrations.id,
      registeredAt: eventRegistrations.registeredAt,
      attended: eventRegistrations.attended,
      intakeResponses: eventRegistrations.intakeResponses,
      userId: users.id,
      userName: users.name,
      userEmail: users.email,
    })
    .from(eventRegistrations)
    .innerJoin(users, eq(users.id, eventRegistrations.userId))
    .where(eq(eventRegistrations.eventId, id))
    .orderBy(desc(eventRegistrations.registeredAt));

  return c.json({ registrations });
});

// ─────────────────────────────────────
// USER MANAGEMENT
// ─────────────────────────────────────

adminEvents.get('/users', async (c) => {
  const db = createDb(c.env.DATABASE_URL ?? c.env.HYPERDRIVE);
  const page = Math.max(1, parseInt(c.req.query('page') ?? '1'));
  const limit = Math.min(100, Math.max(1, parseInt(c.req.query('limit') ?? '20')));
  const offset = (page - 1) * limit;

  const [{ total }] = await db.select({ total: count() }).from(users);
  const data = await db.select({
    id: users.id,
    email: users.email,
    name: users.name,
    role: users.role,
    membershipTier: users.membershipTier,
    phone: users.phone,
    smsOptIn: users.smsOptIn,
    lastActiveAt: users.lastActiveAt,
    createdAt: users.createdAt,
  }).from(users)
    .orderBy(desc(users.createdAt))
    .limit(limit)
    .offset(offset);

  return c.json({ data, total: Number(total), page, limit, pages: Math.ceil(Number(total) / limit) });
});

adminEvents.get('/users/:id', async (c) => {
  const id = c.req.param('id');
  const db = createDb(c.env.DATABASE_URL ?? c.env.HYPERDRIVE);

  const [user] = await db.select({
    id: users.id,
    email: users.email,
    name: users.name,
    role: users.role,
    membershipTier: users.membershipTier,
    phone: users.phone,
    smsOptIn: users.smsOptIn,
    voiceOptIn: users.voiceOptIn,
    referralCode: users.referralCode,
    lastActiveAt: users.lastActiveAt,
    emailVerifiedAt: users.emailVerifiedAt,
    createdAt: users.createdAt,
    stripeCustomerId: users.stripeCustomerId,
  }).from(users).where(eq(users.id, id)).limit(1);

  if (!user) return c.json({ error: 'User not found' }, 404);
  return c.json({ user });
});

adminEvents.patch('/users/:id', zValidator('json', z.object({
  role: z.enum(['client', 'admin', 'practitioner']).optional(),
  membershipTier: z.enum(['free', 'vip', 'inner_circle']).optional(),
  emailVerifiedAt: z.string().datetime().optional(),
})), async (c) => {
  const id = c.req.param('id');
  const updates = c.req.valid('json');
  const db = createDb(c.env.DATABASE_URL ?? c.env.HYPERDRIVE);

  const [updated] = await db.update(users)
    .set({
      ...updates,
      emailVerifiedAt: updates.emailVerifiedAt ? new Date(updates.emailVerifiedAt) : undefined,
      updatedAt: new Date(),
    })
    .where(eq(users.id, id))
    .returning({ id: users.id, role: users.role, membershipTier: users.membershipTier });

  if (!updated) return c.json({ error: 'User not found' }, 404);

  await db.insert(activityLog).values({
    userId: c.get('userId')!,
    action: 'admin.user.updated',
    resourceType: 'user',
    resourceId: id,
    metadata: updates,
  });

  return c.json({ user: updated });
});

export default adminEvents;
