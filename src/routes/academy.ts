import { Hono } from 'hono';
import { eq, and, desc, count } from 'drizzle-orm';
import Stripe from 'stripe';
import { createDb } from '../db';
import { courses, courseModules, lessons, enrollments, lessonProgress, activityLog, users } from '../db/schema';
import { authMiddleware, optionalAuth } from '../middleware/auth';
import type { Env, Variables } from '../types/env';

const academy = new Hono<{ Bindings: Env; Variables: Variables }>();

// ─── Public: List published courses ───
academy.get('/courses', async (c) => {
  const db = createDb(c.env.HYPERDRIVE);
  const page = Math.max(1, parseInt(c.req.query('page') ?? '1'));
  const limit = Math.min(100, Math.max(1, parseInt(c.req.query('limit') ?? '20')));
  const offset = (page - 1) * limit;

  const [{ total }] = await db.select({ total: count() }).from(courses).where(eq(courses.isPublished, true));
  const data = await db.select().from(courses)
    .where(eq(courses.isPublished, true))
    .orderBy(desc(courses.publishedAt))
    .limit(limit)
    .offset(offset);

  return c.json({ data, total: Number(total), page, limit, pages: Math.ceil(Number(total) / limit) });
});

// ─── Public: Get course detail with modules (lessons gated) ───
academy.get('/courses/:slug', optionalAuth, async (c) => {
  const slug = c.req.param('slug');
  if (!slug) return c.json({ error: 'Course slug is required' }, 400);
  const userId = c.get('userId');
  const db = createDb(c.env.HYPERDRIVE);

  const [course] = await db.select().from(courses).where(eq(courses.slug, slug)).limit(1);
  if (!course) return c.json({ error: 'Course not found' }, 404);

  const modules = await db.select().from(courseModules)
    .where(eq(courseModules.courseId, course.id))
    .orderBy(courseModules.sortOrder);

  const allLessons = await db.select().from(lessons)
    .where(eq(lessons.moduleId, modules[0]?.id ?? ''))
    .orderBy(lessons.sortOrder);

  // Check enrollment
  let enrollment = null;
  if (userId) {
    const [found] = await db.select().from(enrollments)
      .where(and(eq(enrollments.userId, userId), eq(enrollments.courseId, course.id)))
      .limit(1);
    enrollment = found ?? null;
  }

  // Build curriculum — hide video URLs for non-enrolled users (except free preview lessons)
  const curriculum = modules.map(mod => ({
    ...mod,
    lessons: allLessons
      .filter(l => l.moduleId === mod.id)
      .map(l => ({
        id: l.id,
        title: l.title,
        description: l.description,
        contentType: l.contentType,
        durationMinutes: l.durationMinutes,
        isFree: l.isFree,
        // Only show video URL if enrolled or lesson is free
        videoUrl: (enrollment || l.isFree) ? l.videoUrl : null,
        isLocked: !enrollment && !l.isFree,
      })),
  }));

  return c.json({ course, curriculum, enrollment });
});

// ─── Auth: Enroll in course ───
academy.post('/courses/:slug/enroll', authMiddleware, async (c) => {
  const userId = c.get('userId')!;
  const slug = c.req.param('slug');
  if (!slug) return c.json({ error: 'Course slug is required' }, 400);
  const db = createDb(c.env.HYPERDRIVE);

  try {
    const [course] = await db.select().from(courses).where(eq(courses.slug, slug)).limit(1);
    if (!course) return c.json({ error: 'Course not found' }, 404);

    const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
    if (!user) return c.json({ error: 'User not found' }, 404);

    const stripe = new Stripe(c.env.STRIPE_SECRET_KEY);
    const appOrigin = c.env.CORS_ORIGIN || 'https://cypherofhealing.com';
    const chargeAmount = Number(course.price);
    if (!Number.isFinite(chargeAmount) || chargeAmount <= 0) {
      return c.json({ error: 'Course price is not configured' }, 422);
    }

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
      client_reference_id: `${userId}:${course.id}`,
      line_items: [
        course.stripePriceId
          ? {
              price: course.stripePriceId,
              quantity: 1,
            }
          : {
              price_data: {
                currency: 'usd',
                unit_amount: Math.round(chargeAmount * 100),
                product_data: {
                  name: course.title,
                  description: course.shortDescription ?? course.description ?? undefined,
                },
              },
              quantity: 1,
            },
      ],
      success_url: `${appOrigin}/academy?checkout=success&course=${course.slug}`,
      cancel_url: `${appOrigin}/academy?checkout=cancelled&course=${course.slug}`,
      metadata: {
        courseId: course.id,
        courseSlug: course.slug,
        userId,
      },
      phone_number_collection: {
        enabled: true,
      },
    });

    return c.json({ checkoutUrl: checkoutSession.url }, 201);
  } catch (error) {
    return c.json({ error: 'Failed to enroll in course' }, 500);
  }
});

// ─── Auth: Mark lesson complete ───
academy.post('/lessons/:lessonId/complete', authMiddleware, async (c) => {
  const userId = c.get('userId')!;
  const lessonId = c.req.param('lessonId');
  if (!lessonId) return c.json({ error: 'Lesson ID is required' }, 400);
  const db = createDb(c.env.HYPERDRIVE);

  await db.insert(lessonProgress).values({
    userId,
    lessonId,
    completed: true,
    completedAt: new Date(),
  }).onConflictDoUpdate({
    target: [lessonProgress.userId, lessonProgress.lessonId],
    set: { completed: true, completedAt: new Date() },
  });

  await db.insert(activityLog).values({
    userId,
    action: 'lesson.completed',
    resourceType: 'lesson',
    resourceId: lessonId,
  });

  return c.json({ success: true });
});

// ─── Auth: Get my enrollments ───
academy.get('/enrollments', authMiddleware, async (c) => {
  const userId = c.get('userId')!;
  const db = createDb(c.env.HYPERDRIVE);
  const page = Math.max(1, parseInt(c.req.query('page') ?? '1'));
  const limit = Math.min(100, Math.max(1, parseInt(c.req.query('limit') ?? '20')));
  const offset = (page - 1) * limit;

  const [{ total }] = await db.select({ total: count() }).from(enrollments).where(eq(enrollments.userId, userId));
  const data = await db.select().from(enrollments)
    .where(eq(enrollments.userId, userId))
    .orderBy(desc(enrollments.enrolledAt))
    .limit(limit)
    .offset(offset);

  return c.json({ data, total: Number(total), page, limit, pages: Math.ceil(Number(total) / limit) });
});

export default academy;
