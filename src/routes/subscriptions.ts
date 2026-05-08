import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { eq, and } from 'drizzle-orm';
import Stripe from 'stripe';
import { createDb } from '../db';
import { membershipPlans, subscriptions, users, activityLog } from '../db/schema';
import { authMiddleware } from '../middleware/auth';
import type { Env, Variables } from '../types/env';

const subscriptionsRouter = new Hono<{ Bindings: Env; Variables: Variables }>();

// ─── Public: List membership plans ───
subscriptionsRouter.get('/plans', async (c) => {
  const db = createDb(c.env.DATABASE_URL ?? c.env.HYPERDRIVE);
  const plans = await db.select().from(membershipPlans).where(eq(membershipPlans.isActive, true));
  return c.json({ plans });
});

// ─── Auth: Get my subscription ───
subscriptionsRouter.get('/my-subscription', authMiddleware, async (c) => {
  const userId = c.get('userId')!;
  const db = createDb(c.env.DATABASE_URL ?? c.env.HYPERDRIVE);

  const [subscription] = await db.select().from(subscriptions)
    .where(and(eq(subscriptions.userId, userId), eq(subscriptions.status, 'active')))
    .limit(1);

  return c.json({ subscription: subscription ?? null });
});

// ─── Auth: Subscribe to a plan ───
subscriptionsRouter.post('/subscribe', authMiddleware, zValidator('json', z.object({
  planId: z.string().uuid(),
  interval: z.enum(['monthly', 'annual']).default('monthly'),
})), async (c) => {
  const userId = c.get('userId')!;
  const { planId, interval } = c.req.valid('json');
  const db = createDb(c.env.DATABASE_URL ?? c.env.HYPERDRIVE);

  const [plan] = await db.select().from(membershipPlans)
    .where(and(eq(membershipPlans.id, planId), eq(membershipPlans.isActive, true)))
    .limit(1);

  if (!plan) return c.json({ error: 'Plan not found' }, 404);

  const stripePriceId = interval === 'annual' ? plan.stripePriceIdAnnual : plan.stripePriceIdMonthly;
  if (!stripePriceId) return c.json({ error: 'This plan is not yet available for purchase' }, 422);

  const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  if (!user) return c.json({ error: 'User not found' }, 404);

  // Check for existing active subscription
  const [existing] = await db.select({ id: subscriptions.id }).from(subscriptions)
    .where(and(eq(subscriptions.userId, userId), eq(subscriptions.status, 'active')))
    .limit(1);
  if (existing) return c.json({ error: 'You already have an active subscription' }, 409);

  const stripe = new Stripe(c.env.STRIPE_SECRET_KEY);

  let stripeCustomerId = user.stripeCustomerId;
  if (!stripeCustomerId) {
    const customer = await stripe.customers.create({
      email: user.email,
      name: user.name,
      phone: user.phone ?? undefined,
      metadata: { userId: user.id, app: 'coh' },
    });
    stripeCustomerId = customer.id;
    await db.update(users)
      .set({ stripeCustomerId, updatedAt: new Date() })
      .where(eq(users.id, userId));
  }

  const appOrigin = c.env.CORS_ORIGIN || 'https://cypherofhealing.com';
  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    customer: stripeCustomerId,
    line_items: [{ price: stripePriceId, quantity: 1 }],
    success_url: `${appOrigin}/membership?checkout=success`,
    cancel_url: `${appOrigin}/membership?checkout=cancelled`,
    metadata: {
      userId,
      planId: plan.id,
      planTier: plan.tier,
      interval,
    },
  });

  return c.json({ checkoutUrl: session.url }, 201);
});

// ─── Auth: Cancel subscription ───
subscriptionsRouter.post('/cancel', authMiddleware, async (c) => {
  const userId = c.get('userId')!;
  const db = createDb(c.env.DATABASE_URL ?? c.env.HYPERDRIVE);

  const [subscription] = await db.select().from(subscriptions)
    .where(and(eq(subscriptions.userId, userId), eq(subscriptions.status, 'active')))
    .limit(1);

  if (!subscription) return c.json({ error: 'No active subscription found' }, 404);
  if (!subscription.stripeSubscriptionId) return c.json({ error: 'Subscription has no Stripe ID' }, 422);

  const stripe = new Stripe(c.env.STRIPE_SECRET_KEY);
  // Cancel at period end so user retains access until billing cycle ends
  await stripe.subscriptions.update(subscription.stripeSubscriptionId, {
    cancel_at_period_end: true,
  });

  await db.update(subscriptions)
    .set({ status: 'cancelled', cancelledAt: new Date(), updatedAt: new Date() })
    .where(eq(subscriptions.id, subscription.id));

  await db.insert(activityLog).values({
    userId,
    action: 'subscription.cancelled',
    resourceType: 'subscription',
    resourceId: subscription.id,
    metadata: { stripeSubscriptionId: subscription.stripeSubscriptionId },
  });

  return c.json({ message: 'Subscription will cancel at the end of the current billing period.' });
});

export default subscriptionsRouter;
