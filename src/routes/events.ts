import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { eq, and, desc, gte, count } from 'drizzle-orm';
import Stripe from 'stripe';
import { createDb } from '../db';
import { events, eventRegistrations, activityLog, users } from '../db/schema';
import { authMiddleware, optionalAuth } from '../middleware/auth';
import { sendEmail, eventRegistrationEmail } from '../utils/email';
import type { Env, Variables } from '../types/env';

const eventsRouter = new Hono<{ Bindings: Env; Variables: Variables }>();
const STRIPE_METADATA_MAX_LENGTH = 500;

function serializeIntakeResponsesForMetadata(intakeResponses: unknown) {
  if (!intakeResponses) {
    return '';
  }

  try {
    const serialized = JSON.stringify(intakeResponses);
    return serialized.length <= STRIPE_METADATA_MAX_LENGTH ? serialized : '';
  } catch {
    return '';
  }
}

// ─── Public: List upcoming events ───
eventsRouter.get('/', async (c) => {
  const db = createDb(c.env.DATABASE_URL ?? c.env.HYPERDRIVE);
  const type = c.req.query('type'); // webinar, workshop, consultation
  const page = Math.max(1, parseInt(c.req.query('page') ?? '1'));
  const limit = Math.min(100, Math.max(1, parseInt(c.req.query('limit') ?? '20')));
  const offset = (page - 1) * limit;

  const conditions = and(
    eq(events.status, 'scheduled'),
    gte(events.scheduledAt, new Date()),
    type ? eq(events.type, type as any) : undefined,
  );

  const [{ total }] = await db.select({ total: count() }).from(events).where(conditions);
  const upcoming = await db.select().from(events)
    .where(conditions)
    .orderBy(events.scheduledAt)
    .limit(limit)
    .offset(offset);

  return c.json({ data: upcoming, total: Number(total), page, limit, pages: Math.ceil(Number(total) / limit) });
});

// ─── Public: Get event detail ───
eventsRouter.get('/:slug', optionalAuth, async (c) => {
  const slug = c.req.param('slug');
  if (!slug) return c.json({ error: 'Event slug is required' }, 400);
  const userId = c.get('userId');
  const db = createDb(c.env.DATABASE_URL ?? c.env.HYPERDRIVE);

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
  intakeResponses: z.record(z.string(), z.unknown()).optional(),  // for consultations with intake forms
}).optional()), async (c) => {
  const userId = c.get('userId')!;
  const slug = c.req.param('slug');
  if (!slug) return c.json({ error: 'Event slug is required' }, 400);
  const body = c.req.valid('json');
  const db = createDb(c.env.DATABASE_URL ?? c.env.HYPERDRIVE);

  try {
    const [event] = await db.select().from(events).where(eq(events.slug, slug)).limit(1);
    if (!event) return c.json({ error: 'Event not found' }, 404);

    const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
    if (!user) return c.json({ error: 'User not found' }, 404);

    // Check capacity
    if (event.maxAttendees && event.currentAttendees! >= event.maxAttendees) {
      return c.json({ error: 'Event is at capacity' }, 409);
    }

    // Check if already registered
    const [existing] = await db.select().from(eventRegistrations)
      .where(and(eq(eventRegistrations.eventId, event.id), eq(eventRegistrations.userId, userId)))
      .limit(1);
    if (existing) return c.json({ error: 'Already registered', registration: existing }, 409);

    const appOrigin = c.env.CORS_ORIGIN || 'https://cypherofhealing.com';
    const eventPrice = event.price ? Number(event.price) : 0;

    if (eventPrice > 0) {
      const stripe = new Stripe(c.env.STRIPE_SECRET_KEY);

      let stripeCustomerId = user.stripeCustomerId;
      if (!stripeCustomerId) {
        const customer = await stripe.customers.create({
          email: user.email,
          name: user.name,
          phone: user.phone ?? undefined,
          metadata: {
            userId: user.id,
            app: 'coh',
          },
        });

        stripeCustomerId = customer.id;
        await db.update(users)
          .set({ stripeCustomerId, updatedAt: new Date() })
          .where(eq(users.id, user.id));
      }

      const checkoutSession = await stripe.checkout.sessions.create({
        mode: 'payment',
        customer: stripeCustomerId,
        client_reference_id: `${userId}:${event.id}`,
        line_items: [
          event.stripePriceId
            ? {
                price: event.stripePriceId,
                quantity: 1,
              }
            : {
                price_data: {
                  currency: 'usd',
                  unit_amount: Math.round(eventPrice * 100),
                  product_data: {
                    name: event.title,
                    description: event.description ?? undefined,
                  },
                },
                quantity: 1,
              },
        ],
        success_url: `${appOrigin}/events?checkout=success&event=${event.slug}`,
        cancel_url: `${appOrigin}/events?checkout=cancelled&event=${event.slug}`,
        metadata: {
          eventId: event.id,
          eventSlug: event.slug,
          userId,
          eventType: event.type,
          intakeResponses: serializeIntakeResponsesForMetadata(body?.intakeResponses),
        },
      });

      return c.json({ checkoutUrl: checkoutSession.url }, 201);
    }

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

    // Send registration confirmation email
    const eventDate = new Date(event.scheduledAt!).toLocaleDateString('en-US', { 
      weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' 
    });
    const eventTime = new Date(event.scheduledAt!).toLocaleTimeString('en-US', { 
      hour: 'numeric', minute: '2-digit' 
    });
    const emailTemplate = eventRegistrationEmail({
      userName: user.name,
      eventTitle: event.title,
      eventDate: eventDate,
      eventTime: eventTime,
      eventUrl: `${appOrigin}/events/${slug}`,
      zoomLink: event.meetingUrl ?? undefined,
    });

    await sendEmail(c.env.RESEND_API_KEY, {
      to: user.email,
      subject: emailTemplate.subject,
      html: emailTemplate.html,
      text: emailTemplate.text,
    });

    // TODO: Schedule reminder

    return c.json({ registration }, 201);
  } catch (error) {
    return c.json({ error: 'Failed to register for event' }, 500);
  }
});

// ─── Auth: Get my registrations ───
eventsRouter.get('/my/registrations', authMiddleware, async (c) => {
  const userId = c.get('userId')!;
  const db = createDb(c.env.DATABASE_URL ?? c.env.HYPERDRIVE);

  const myRegistrations = await db.select().from(eventRegistrations)
    .where(eq(eventRegistrations.userId, userId))
    .orderBy(desc(eventRegistrations.registeredAt))
    .limit(20);

  return c.json({ registrations: myRegistrations });
});

export default eventsRouter;
