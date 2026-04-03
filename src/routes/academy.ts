import { Hono } from 'hono';
import { eq, and, desc } from 'drizzle-orm';
import { createDb } from '../db';
import { courses, courseModules, lessons, enrollments, lessonProgress, activityLog } from '../db/schema';
import { authMiddleware, optionalAuth } from '../middleware/auth';
import type { Env, Variables } from '../types/env';

const academy = new Hono<{ Bindings: Env; Variables: Variables }>();

// ─── Public: List published courses ───
academy.get('/courses', async (c) => {
  const db = createDb(c.env.HYPERDRIVE);
  const allCourses = await db.select().from(courses)
    .where(eq(courses.isPublished, true))
    .orderBy(desc(courses.publishedAt));
  return c.json({ courses: allCourses });
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

  const [course] = await db.select().from(courses).where(eq(courses.slug, slug)).limit(1);
  if (!course) return c.json({ error: 'Course not found' }, 404);

  // Check if already enrolled
  const [existing] = await db.select().from(enrollments)
    .where(and(eq(enrollments.userId, userId), eq(enrollments.courseId, course.id)))
    .limit(1);
  if (existing) return c.json({ error: 'Already enrolled', enrollment: existing }, 409);

  // TODO: Create Stripe Checkout Session for course purchase
  // For now, create enrollment (will be finalized by Stripe webhook)

  const [enrollment] = await db.insert(enrollments).values({
    userId,
    courseId: course.id,
    status: 'active',
  }).returning();

  await db.insert(activityLog).values({
    userId,
    action: 'course.enrolled',
    resourceType: 'enrollment',
    resourceId: enrollment.id,
    metadata: { courseTitle: course.title, courseSlug: slug },
  });

  return c.json({ enrollment, checkoutUrl: 'TODO_STRIPE_CHECKOUT_URL' }, 201);
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

  const myEnrollments = await db.select().from(enrollments)
    .where(eq(enrollments.userId, userId))
    .orderBy(desc(enrollments.enrolledAt));

  return c.json({ enrollments: myEnrollments });
});

export default academy;
