import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { eq, and, desc, gte } from 'drizzle-orm';
import { createDb } from '../db';
import { events, eventRegistrations, activityLog } from '../db/schema';
import { authMiddleware, optionalAuth } from '../middleware/auth';
import type { Env, Variables } from '../types/env';

const eventsRouter = new Hono<{ Bindings: Env; Variables: Variables }>();

// ─── Public: List upcoming events ───
eventsRouter.get('/', async (c) => {
  const db = createDb(c.env.HYPERDRIVE);
  const type = c.req.query('type'); // webinar, workshop, consultation

  const upcoming = await db.select().from(events)
    .where(and(
      eq(events.status, 'scheduled'),
      gte(events.scheduledAt, new Date()),
      type ? eq(events.type, type as any) : undefined,
    ))
    .orderBy(events.scheduledAt)
    .limit(20);

  return c.json({ events: upcoming });
});

// ─── Public: Get event detail ───
eventsRouter.get('/:slug', optionalAuth, async (c) => {
  const slug = c.req.param('slug');
  if (!slug) return c.json({ error: 'Event slug is required' }, 400);
  const userId = c.get('userId');
  const db = createDb(c.env.HYPERDRIVE);

  const [event] = await db.select().from(events).where(eq(events.slug, slug)).limit(1);
  if (!event) return c.json({ error: 'Event not found' }, 404);

  let registration = null;
  if (userId) {
    const [found] = await db.select().from(eventRegistrations)
      .where(and(eq(eventRegistrations.eventId, event.id), eq(eventRegistrations.userId, userId)))
      .limit(1);
    registration = found ?? null;
  }

  // Hide meeting URL unless registered
  const safeEvent = {
    ...event,
    meetingUrl: registration ? event.meetingUrl : null,
  };

  return c.json({ event: safeEvent, registration });
});

// ─── Auth: Register for event ───
eventsRouter.post('/:slug/register', authMiddleware, zValidator('json', z.object({
  intakeResponses: z.record(z.any()).optional(),  // for consultations with intake forms
}).optional()), async (c) => {
  const userId = c.get('userId')!;
  const slug = c.req.param('slug');
  if (!slug) return c.json({ error: 'Event slug is required' }, 400);
  const body = c.req.valid('json');
  const db = createDb(c.env.HYPERDRIVE);

  const [event] = await db.select().from(events).where(eq(events.slug, slug)).limit(1);
  if (!event) return c.json({ error: 'Event not found' }, 404);

  // Check capacity
  if (event.maxAttendees && event.currentAttendees! >= event.maxAttendees) {
    return c.json({ error: 'Event is at capacity' }, 409);
  }

  // Check if already registered
  const [existing] = await db.select().from(eventRegistrations)
    .where(and(eq(eventRegistrations.eventId, event.id), eq(eventRegistrations.userId, userId)))
    .limit(1);
  if (existing) return c.json({ error: 'Already registered', registration: existing }, 409);

  const [registration] = await db.insert(eventRegistrations).values({
    eventId: event.id,
    userId,
    intakeResponses: body?.intakeResponses ?? null,
  }).returning();

  // Increment attendee count
  await db.update(events)
    .set({ currentAttendees: (event.currentAttendees ?? 0) + 1 })
    .where(eq(events.id, event.id));

  // Log activity — this feeds the cross-sell engine
  await db.insert(activityLog).values({
    userId,
    action: event.type === 'consultation' ? 'consultation.booked' : 'webinar.registered',
    resourceType: 'event',
    resourceId: event.id,
    metadata: { eventTitle: event.title, eventType: event.type },
  });

  // TODO: If paid event, create Stripe Checkout Session
  // TODO: Send confirmation email with calendar invite
  // TODO: Schedule reminder

  return c.json({ registration }, 201);
});

// ─── Auth: Get my registrations ───
eventsRouter.get('/my/registrations', authMiddleware, async (c) => {
  const userId = c.get('userId')!;
  const db = createDb(c.env.HYPERDRIVE);

  const myRegistrations = await db.select().from(eventRegistrations)
    .where(eq(eventRegistrations.userId, userId))
    .orderBy(desc(eventRegistrations.registeredAt))
    .limit(20);

  return c.json({ registrations: myRegistrations });
});

export default eventsRouter;
