import { Hono } from 'hono';
import { and, eq } from 'drizzle-orm';
import Stripe from 'stripe';
import { createDb } from '../db';
import { activityLog, appointments, enrollments, eventRegistrations, events, orders, services, users } from '../db/schema';
import { bookingConfirmationEmail, eventRegistrationEmail, sendEmail } from '../utils/email';
import type { Env, Variables } from '../types/env';

const webhooks = new Hono<{ Bindings: Env; Variables: Variables }>();
const STRIPE_EVENT_IDEMPOTENCY_TTL_SECONDS = 60 * 60 * 24 * 14;

async function isStripeEventAlreadyProcessed(env: Env, eventId: string) {
  const key = `stripe:webhook:processed:${eventId}`;
  const existing = await env.SESSIONS.get(key);
  return Boolean(existing);
}

async function markStripeEventProcessed(env: Env, eventId: string) {
  const key = `stripe:webhook:processed:${eventId}`;
  await env.SESSIONS.put(key, '1', {
    expirationTtl: STRIPE_EVENT_IDEMPOTENCY_TTL_SECONDS,
  });
}

function getStripePaymentIntentId(paymentIntent: string | Stripe.PaymentIntent | null) {
  if (!paymentIntent) {
    return null;
  }

  return typeof paymentIntent === 'string' ? paymentIntent : paymentIntent.id;
}

webhooks.post('/stripe', async (c) => {
  const signature = c.req.header('stripe-signature');
  if (!signature) {
    return c.json({ error: 'Missing Stripe signature' }, 400);
  }

  const stripe = new Stripe(c.env.STRIPE_SECRET_KEY);
  const payload = await c.req.raw.text();

  let event: Stripe.Event;
  try {
    event = await stripe.webhooks.constructEventAsync(
      payload,
      signature,
      c.env.STRIPE_WEBHOOK_SECRET,
    );
  } catch (error) {
    return c.json({ error: 'Invalid Stripe webhook signature' }, 400);
  }

  const db = createDb(c.env.HYPERDRIVE);

  if (await isStripeEventAlreadyProcessed(c.env, event.id)) {
    return c.json({ received: true, duplicate: true }, 200);
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;
    const metadata = session.metadata ?? {};
    const paymentIntentId = getStripePaymentIntentId(session.payment_intent);
    const amountTotal = session.amount_total ? (session.amount_total / 100).toFixed(2) : null;

    if (metadata.orderId) {
      const [order] = await db
        .select({ id: orders.id, userId: orders.userId, status: orders.status })
        .from(orders)
        .where(eq(orders.id, metadata.orderId))
        .limit(1);

      if (order && order.status !== 'paid') {
        await db
          .update(orders)
          .set({
            status: 'paid',
            stripePaymentIntentId: paymentIntentId,
            updatedAt: new Date(),
          })
          .where(eq(orders.id, order.id));

        await db.insert(activityLog).values({
          userId: order.userId,
          action: 'order.completed',
          resourceType: 'order',
          resourceId: order.id,
          metadata: {
            stripeCheckoutSessionId: session.id,
            stripePaymentIntentId: paymentIntentId,
            amountTotal,
          },
        });
      }
    }

    if (metadata.appointmentId) {
      const [appointment] = await db
        .select({
          id: appointments.id,
          userId: appointments.userId,
          serviceId: appointments.serviceId,
          status: appointments.status,
          scheduledAt: appointments.scheduledAt,
        })
        .from(appointments)
        .where(eq(appointments.id, metadata.appointmentId))
        .limit(1);

      if (appointment && appointment.status !== 'confirmed') {
        await db
          .update(appointments)
          .set({
            status: 'confirmed',
            stripePaymentIntentId: paymentIntentId,
            depositPaid: true,
            totalPaid: amountTotal,
            updatedAt: new Date(),
          })
          .where(eq(appointments.id, appointment.id));

        await db.insert(activityLog).values({
          userId: appointment.userId,
          action: 'appointment.confirmed',
          resourceType: 'appointment',
          resourceId: appointment.id,
          metadata: {
            stripeCheckoutSessionId: session.id,
            stripePaymentIntentId: paymentIntentId,
            amountTotal,
          },
        });

        const [user] = await db
          .select({
            email: users.email,
            name: users.name,
          })
          .from(users)
          .where(eq(users.id, appointment.userId))
          .limit(1);

        const [service] = await db
          .select({
            name: services.name,
            depositAmount: services.depositAmount,
          })
          .from(services)
          .where(eq(services.id, appointment.serviceId))
          .limit(1);

        if (user && service && appointment.scheduledAt) {
          const appOrigin = c.env.CORS_ORIGIN || 'https://cypherofhealing.com';
          const appointmentDate = new Date(appointment.scheduledAt).toLocaleDateString('en-US', {
            weekday: 'long',
            month: 'long',
            day: 'numeric',
            year: 'numeric',
          });
          const appointmentTime = new Date(appointment.scheduledAt).toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit',
          });

          const emailTemplate = bookingConfirmationEmail({
            userName: user.name,
            serviceName: service.name,
            appointmentDate,
            appointmentTime,
            depositAmount: service.depositAmount?.toString() ?? amountTotal ?? '0',
            cancelUrl: `${appOrigin}/booking?cancel=${appointment.id}`,
          });

          await sendEmail(c.env.RESEND_API_KEY, {
            to: user.email,
            subject: emailTemplate.subject,
            html: emailTemplate.html,
            text: emailTemplate.text,
          });
        }
      }
    }

    if (metadata.courseId && metadata.userId) {
      const [existingEnrollment] = await db
        .select({ id: enrollments.id })
        .from(enrollments)
        .where(and(
          eq(enrollments.userId, metadata.userId),
          eq(enrollments.courseId, metadata.courseId),
        ))
        .limit(1);

      if (!existingEnrollment) {
        const [enrollment] = await db.insert(enrollments).values({
          userId: metadata.userId,
          courseId: metadata.courseId,
          status: 'active',
          stripePaymentIntentId: paymentIntentId,
        }).returning({ id: enrollments.id });

        await db.insert(activityLog).values({
          userId: metadata.userId,
          action: 'course.enrolled',
          resourceType: 'enrollment',
          resourceId: enrollment.id,
          metadata: {
            stripeCheckoutSessionId: session.id,
            stripePaymentIntentId: paymentIntentId,
            amountTotal,
            courseId: metadata.courseId,
            courseSlug: metadata.courseSlug ?? '',
          },
        });
      }
    }

    if (metadata.eventId && metadata.userId) {
      const [eventRecord] = await db
        .select({
          id: events.id,
          title: events.title,
          type: events.type,
          currentAttendees: events.currentAttendees,
          maxAttendees: events.maxAttendees,
          scheduledAt: events.scheduledAt,
          meetingUrl: events.meetingUrl,
        })
        .from(events)
        .where(eq(events.id, metadata.eventId))
        .limit(1);

      if (eventRecord) {
        const [existingRegistration] = await db
          .select({ id: eventRegistrations.id })
          .from(eventRegistrations)
          .where(and(
            eq(eventRegistrations.eventId, metadata.eventId),
            eq(eventRegistrations.userId, metadata.userId),
          ))
          .limit(1);

        if (!existingRegistration) {
          const eventAtCapacity = Boolean(
            eventRecord.maxAttendees &&
            (eventRecord.currentAttendees ?? 0) >= eventRecord.maxAttendees,
          );

          if (eventAtCapacity) {
            await db.insert(activityLog).values({
              userId: metadata.userId,
              action: 'event.registration.skipped_capacity',
              resourceType: 'event',
              resourceId: eventRecord.id,
              metadata: {
                stripeEventId: event.id,
                stripeCheckoutSessionId: session.id,
                eventId: eventRecord.id,
                eventType: eventRecord.type,
              },
            });

            await markStripeEventProcessed(c.env, event.id);
            return c.json({ received: true }, 200);
          }

          let intakeResponses: Record<string, unknown> | null = null;
          if (metadata.intakeResponses) {
            try {
              intakeResponses = JSON.parse(metadata.intakeResponses) as Record<string, unknown>;
            } catch {
              intakeResponses = null;
            }
          }

          const [registration] = await db.insert(eventRegistrations).values({
            eventId: metadata.eventId,
            userId: metadata.userId,
            stripePaymentIntentId: paymentIntentId,
            intakeResponses,
          }).returning({ id: eventRegistrations.id });

          await db.update(events)
            .set({
              currentAttendees: (eventRecord.currentAttendees ?? 0) + 1,
              updatedAt: new Date(),
            })
            .where(eq(events.id, eventRecord.id));

          await db.insert(activityLog).values({
            userId: metadata.userId,
            action: eventRecord.type === 'consultation' ? 'consultation.booked' : 'webinar.registered',
            resourceType: 'event',
            resourceId: eventRecord.id,
            metadata: {
              stripeCheckoutSessionId: session.id,
              stripePaymentIntentId: paymentIntentId,
              amountTotal,
              eventId: eventRecord.id,
              eventSlug: metadata.eventSlug ?? '',
              eventTitle: eventRecord.title,
              eventType: eventRecord.type,
              registrationId: registration.id,
            },
          });

          const [user] = await db
            .select({
              email: users.email,
              name: users.name,
            })
            .from(users)
            .where(eq(users.id, metadata.userId))
            .limit(1);

          if (user && eventRecord.scheduledAt) {
            const appOrigin = c.env.CORS_ORIGIN || 'https://cypherofhealing.com';
            const eventDate = new Date(eventRecord.scheduledAt).toLocaleDateString('en-US', {
              weekday: 'long',
              month: 'long',
              day: 'numeric',
              year: 'numeric',
            });
            const eventTime = new Date(eventRecord.scheduledAt).toLocaleTimeString('en-US', {
              hour: 'numeric',
              minute: '2-digit',
            });
            const emailTemplate = eventRegistrationEmail({
              userName: user.name,
              eventTitle: eventRecord.title,
              eventDate,
              eventTime,
              eventUrl: `${appOrigin}/events/${metadata.eventSlug ?? ''}`,
              zoomLink: eventRecord.meetingUrl ?? undefined,
            });

            await sendEmail(c.env.RESEND_API_KEY, {
              to: user.email,
              subject: emailTemplate.subject,
              html: emailTemplate.html,
              text: emailTemplate.text,
            });
          }
        } else {
          await db.insert(activityLog).values({
            userId: metadata.userId,
            action: 'event.registration.skipped_duplicate',
            resourceType: 'event',
            resourceId: eventRecord.id,
            metadata: {
              stripeEventId: event.id,
              stripeCheckoutSessionId: session.id,
              eventId: eventRecord.id,
              existingRegistrationId: existingRegistration.id,
            },
          });
        }
      }
    }
  }

  if (event.type === 'charge.refunded') {
    const charge = event.data.object as Stripe.Charge;
    const paymentIntentId = getStripePaymentIntentId(charge.payment_intent);

    if (paymentIntentId) {
      // Find the order by payment intent and mark as refunded
      const [order] = await db
        .select({ id: orders.id, userId: orders.userId })
        .from(orders)
        .where(eq(orders.stripePaymentIntentId, paymentIntentId))
        .limit(1);

      if (order) {
        await db.update(orders)
          .set({ status: 'refunded', updatedAt: new Date() })
          .where(eq(orders.id, order.id));

        await db.insert(activityLog).values({
          userId: order.userId,
          action: 'order.refunded',
          resourceType: 'order',
          resourceId: order.id,
          metadata: {
            stripeChargeId: charge.id,
            stripePaymentIntentId: paymentIntentId,
            amountRefunded: charge.amount_refunded ? (charge.amount_refunded / 100).toFixed(2) : null,
          },
        });
      }

      // Find the appointment by payment intent and mark as cancelled
      const [appointment] = await db
        .select({ id: appointments.id, userId: appointments.userId })
        .from(appointments)
        .where(eq(appointments.stripePaymentIntentId, paymentIntentId))
        .limit(1);

      if (appointment) {
        await db.update(appointments)
          .set({ status: 'cancelled', updatedAt: new Date() })
          .where(eq(appointments.id, appointment.id));

        await db.insert(activityLog).values({
          userId: appointment.userId,
          action: 'appointment.refunded',
          resourceType: 'appointment',
          resourceId: appointment.id,
          metadata: { stripeChargeId: charge.id, stripePaymentIntentId: paymentIntentId },
        });
      }
    }
  }

  if (event.type === 'payment_intent.payment_failed') {
    const paymentIntent = event.data.object as Stripe.PaymentIntent;
    const failureMessage = paymentIntent.last_payment_error?.message ?? 'Payment failed';

    // Cancel the associated pending appointment
    const [appointment] = await db
      .select({ id: appointments.id, userId: appointments.userId })
      .from(appointments)
      .where(eq(appointments.stripePaymentIntentId, paymentIntent.id))
      .limit(1);

    if (appointment) {
      await db.update(appointments)
        .set({ status: 'cancelled', updatedAt: new Date() })
        .where(eq(appointments.id, appointment.id));

      await db.insert(activityLog).values({
        userId: appointment.userId,
        action: 'appointment.payment_failed',
        resourceType: 'appointment',
        resourceId: appointment.id,
        metadata: { stripePaymentIntentId: paymentIntent.id, failureMessage },
      });
    }

    // Mark associated pending order as cancelled
    const [order] = await db
      .select({ id: orders.id, userId: orders.userId })
      .from(orders)
      .where(eq(orders.stripePaymentIntentId, paymentIntent.id))
      .limit(1);

    if (order) {
      await db.update(orders)
        .set({ status: 'cancelled', updatedAt: new Date() })
        .where(eq(orders.id, order.id));

      await db.insert(activityLog).values({
        userId: order.userId,
        action: 'order.payment_failed',
        resourceType: 'order',
        resourceId: order.id,
        metadata: { stripePaymentIntentId: paymentIntent.id, failureMessage },
      });
    }
  }

  await markStripeEventProcessed(c.env, event.id);

  return c.json({ received: true }, 200);
});

export default webhooks;