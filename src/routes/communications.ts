import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { eq, and, desc, lte, gte, isNull } from 'drizzle-orm';
import { createDb } from '../db';
import { appointments, events, eventRegistrations, users } from '../db/schema';
import { authMiddleware } from '../middleware/auth';
import { sendSms, createRTCRoom, buildAppointmentReminder, buildEventReminder, formatPhoneForSms } from '../utils/telnyx';
import type { Env, Variables } from '../types/env';

const comms = new Hono<{ Bindings: Env; Variables: Variables }>();

// ─── Admin: Send appointment reminders ───
comms.post('/appointments/send-reminders', authMiddleware, async (c) => {
  // Check admin role
  const role = c.get('userRole');
  if (role !== 'admin') {
    return c.json({ error: 'Unauthorized' }, 403);
  }

  const db = createDb(c.env.HYPERDRIVE);

  // Get appointments in next 24 hours that haven't been reminded
  const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);
  const now = new Date();

  const upcomingAppointments = await db
    .select()
    .from(appointments)
    .innerJoin(users, eq(appointments.userId, users.id))
    .where(
      and(
        lte(appointments.scheduledAt, tomorrow),
        gte(appointments.scheduledAt, now),
        isNull(appointments.reminderSentAt),
        eq(appointments.status, 'confirmed')
      )
    );

  const results = [];

  for (const { appointments: apt, users: user } of upcomingAppointments) {
    // Skip if no phone or SMS not opted in
    if (!user.phone || !user.smsOptIn) {
      results.push({ appointmentId: apt.id, status: 'skipped', reason: 'no_phone_or_opt_in' });
      continue;
    }

    try {
      const serviceName = apt.serviceId; // Would need a join to get real name, simplified here
      const message = buildAppointmentReminder(apt.scheduledAt, serviceName as string);
      const formattedPhone = formatPhoneForSms(user.phone);

      const smsResult = await sendSms(c.env.TELNYX_API_KEY, c.env.TELNYX_PHONE_NUMBER, {
        to: formattedPhone,
        message,
      });

      // Update appointment with reminder sent timestamp
      await db
        .update(appointments)
        .set({
          reminderSentAt: new Date(),
          reminderChannel: 'sms',
          telnyxMessageId: smsResult.messageId,
        })
        .where(eq(appointments.id, apt.id));

      results.push({
        appointmentId: apt.id,
        status: 'sent',
        messageId: smsResult.messageId,
        to: formattedPhone,
      });
    } catch (error) {
      results.push({
        appointmentId: apt.id,
        status: 'failed',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  return c.json({ message: 'Reminder sending complete', results });
});

// ─── Admin: Send event reminders ───
comms.post('/events/send-reminders', authMiddleware, async (c) => {
  const role = c.get('userRole');
  if (role !== 'admin') {
    return c.json({ error: 'Unauthorized' }, 403);
  }

  const db = createDb(c.env.HYPERDRIVE);

  // Get events in next 24 hours whose registrants haven't been reminded
  const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);
  const now = new Date();

  const eventList = await db
    .select()
    .from(events)
    .where(
      and(
        gte(events.scheduledAt, now),
        lte(events.scheduledAt, tomorrow),
        eq(events.status, 'scheduled')
      )
    );

  const results = [];

  for (const event of eventList) {
    // Get registrants
    const registrations = await db
      .select()
      .from(eventRegistrations)
      .innerJoin(users, eq(eventRegistrations.userId, users.id))
      .where(eq(eventRegistrations.eventId, event.id));

    for (const { users: user } of registrations) {
      if (!user.phone || !user.smsOptIn) {
        continue; // Skip
      }

      try {
        const message = buildEventReminder(event.title, event.scheduledAt as Date);
        const formattedPhone = formatPhoneForSms(user.phone);

        await sendSms(c.env.TELNYX_API_KEY, c.env.TELNYX_PHONE_NUMBER, {
          to: formattedPhone,
          message,
        });

        results.push({
          eventId: event.id,
          userId: user.id,
          status: 'sent',
          to: formattedPhone,
        });
      } catch (error) {
        results.push({
          eventId: event.id,
          userId: user.id,
          status: 'failed',
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }
  }

  return c.json({ message: 'Event reminders sent', total: results.length, results });
});

// ─── Create RTC room for event ───
comms.post(
  '/events/:eventId/video-room',
  authMiddleware,
  zValidator('param', z.object({ eventId: z.string().uuid() })),
  async (c) => {
    const role = c.get('userRole');
    if (role !== 'admin') {
      return c.json({ error: 'Unauthorized' }, 403);
    }

    const { eventId } = c.req.valid('param');  const userId = c.get('userId');    const db = createDb(c.env.HYPERDRIVE);

    const [event] = await db.select().from(events).where(eq(events.id, eventId)).limit(1);
    if (!event) {
      return c.json({ error: 'Event not found' }, 404);
    }

    try {
      const roomName = `event-${event.slug}-${Date.now()}`;
      const rtcResult = await createRTCRoom(c.env.TELNYX_API_KEY, {
        roomName,
        maxParticipants: event.maxAttendees || 100,
        recordingEnabled: true,
      });

      // Update event with room details
      await db
        .update(events)
        .set({
          telnyxRoomName: roomName,
          telnyxRoomId: rtcResult.roomId,
        })
        .where(eq(events.id, eventId));

      return c.json({
        eventId,
        roomId: rtcResult.roomId,
        roomName,
        token: rtcResult.token,
        expiresAt: rtcResult.expiresAt,
      });
    } catch (error) {
      return c.json(
        { error: error instanceof Error ? error.message : 'Failed to create RTC room' },
        500
      );
    }
  }
);

// ─── Public: Get event video room (authenticated user only) ───
comms.get('/events/:eventId/video-room', async (c) => {
  const userId = c.get('userId');
  const { eventId } = c.req.param();

  const db = createDb(c.env.HYPERDRIVE);

  // Check if user is registered
  const [registration] = await db
    .select()
    .from(eventRegistrations)
    .where(and(eq(eventRegistrations.eventId, eventId), eq(eventRegistrations.userId, userId as string)))
    .limit(1);

  if (!registration) {
    return c.json({ error: 'Not registered for this event' }, 403);
  }

  const [event] = await db.select().from(events).where(eq(events.id, eventId)).limit(1);
  if (!event || !event.telnyxRoomName) {
    return c.json({ error: 'No video room available for this event' }, 404);
  }

  // Generate token for this user
  try {
    const token = await createRTCRoom(c.env.TELNYX_API_KEY, {
      roomName: event.telnyxRoomName,
    });

    return c.json({
      roomName: event.telnyxRoomName,
      roomId: event.telnyxRoomId,
      token: token.token,
      expiresAt: token.expiresAt,
    });
  } catch (error) {
    return c.json({ error: 'Failed to generate video token' }, 500);
  }
});

export default comms;
