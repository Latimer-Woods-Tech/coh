import { and, eq, gte, isNull, lte } from 'drizzle-orm';
import { createDb } from '../db';
import { appointments, services, users } from '../db/schema';
import { buildAppointmentReminder, formatPhoneForSms, sendSms } from './telnyx';
import type { Env } from '../types/env';

export interface ReminderResult {
  appointmentId: string;
  status: 'sent' | 'skipped' | 'failed';
  reason?: string;
  messageId?: string;
}

/** Send SMS reminders for confirmed appointments in the next 24 hours. */
export async function sendAppointmentReminders(env: Env): Promise<ReminderResult[]> {
  const db = createDb(env.HYPERDRIVE);
  const now = new Date();
  const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);

  const upcoming = await db
    .select({
      id: appointments.id,
      scheduledAt: appointments.scheduledAt,
      userId: appointments.userId,
      serviceId: appointments.serviceId,
      serviceName: services.name,
      phone: users.phone,
      smsOptIn: users.smsOptIn,
    })
    .from(appointments)
    .innerJoin(users, eq(appointments.userId, users.id))
    .innerJoin(services, eq(appointments.serviceId, services.id))
    .where(and(
      eq(appointments.status, 'confirmed'),
      gte(appointments.scheduledAt, now),
      lte(appointments.scheduledAt, tomorrow),
      isNull(appointments.reminderSentAt),
    ));

  const results: ReminderResult[] = [];

  for (const apt of upcoming) {
    if (!apt.phone || !apt.smsOptIn) {
      results.push({ appointmentId: apt.id, status: 'skipped', reason: 'no_phone_or_opt_in' });
      continue;
    }

    try {
      const message = buildAppointmentReminder(apt.scheduledAt, apt.serviceName);
      const formattedPhone = formatPhoneForSms(apt.phone);
      const smsResult = await sendSms(env.TELNYX_API_KEY, env.TELNYX_PHONE_NUMBER, {
        to: formattedPhone,
        message,
      });

      await db.update(appointments)
        .set({ reminderSentAt: now, reminderChannel: 'sms', telnyxMessageId: smsResult.messageId })
        .where(eq(appointments.id, apt.id));

      results.push({ appointmentId: apt.id, status: 'sent', messageId: smsResult.messageId });
    } catch (error) {
      results.push({
        appointmentId: apt.id,
        status: 'failed',
        reason: error instanceof Error ? error.message : 'unknown',
      });
    }
  }

  return results;
}
