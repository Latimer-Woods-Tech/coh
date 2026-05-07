import { Hono } from 'hono';
import { and, eq, desc, asc, count, sql } from 'drizzle-orm';
import { createDb } from '../db';
import {
  courses,
  courseModules,
  lessons,
  enrollments,
  lessonProgress,
  users,
  activityLog,
} from '../db/schema';
import { authMiddleware, adminOnly } from '../middleware/auth';
import type { Env, Variables } from '../types/env';

const admin = new Hono<{ Bindings: Env; Variables: Variables }>();

// All admin routes require auth + admin role
admin.use('*', authMiddleware);
admin.use('*', adminOnly);

// ─────────────────────────────────────
// COURSE MANAGEMENT
// ─────────────────────────────────────

/** List all courses (draft + published) with enrollment counts */
admin.get('/courses', async (c) => {
  const db = createDb(c.env.HYPERDRIVE);

  const rows = await db
    .select({
      id: courses.id,
      title: courses.title,
      slug: courses.slug,
      shortDescription: courses.shortDescription,
      price: courses.price,
      isPublished: courses.isPublished,
      publishedAt: courses.publishedAt,
      totalModules: courses.totalModules,
      totalLessons: courses.totalLessons,
      estimatedHours: courses.estimatedHours,
      createdAt: courses.createdAt,
      updatedAt: courses.updatedAt,
      enrollmentCount: count(enrollments.id),
    })
    .from(courses)
    .leftJoin(enrollments, eq(enrollments.courseId, courses.id))
    .groupBy(courses.id)
    .orderBy(desc(courses.createdAt));

  return c.json({ courses: rows });
});

/** Create a new course */
admin.post('/courses', async (c) => {
  const body = await c.req.json<{
    title: string;
    slug: string;
    description?: string;
    shortDescription?: string;
    thumbnailUrl?: string;
    price: string;
    estimatedHours?: string;
  }>();

  if (!body.title || !body.slug || !body.price) {
    return c.json({ error: 'title, slug, and price are required' }, 400);
  }

  const db = createDb(c.env.HYPERDRIVE);

  const [course] = await db
    .insert(courses)
    .values({
      title: body.title,
      slug: body.slug,
      description: body.description,
      shortDescription: body.shortDescription,
      thumbnailUrl: body.thumbnailUrl,
      price: body.price,
      estimatedHours: body.estimatedHours,
      isPublished: false,
    })
    .returning();

  await db.insert(activityLog).values({
    userId: c.get('userId')!,
    action: 'admin.course.created',
    resourceType: 'course',
    resourceId: course.id,
    metadata: { title: course.title },
  });

  return c.json({ course }, 201);
});

/** Get full course detail with modules + lessons */
admin.get('/courses/:id', async (c) => {
  const id = c.req.param('id');
  const db = createDb(c.env.HYPERDRIVE);

  const course = await db.query.courses.findFirst({ where: eq(courses.id, id) });
  if (!course) return c.json({ error: 'Course not found' }, 404);

  const modules = await db
    .select()
    .from(courseModules)
    .where(eq(courseModules.courseId, id))
    .orderBy(asc(courseModules.sortOrder));

  const lessonRows = await db
    .select()
    .from(lessons)
    .where(
      sql`${lessons.moduleId} IN (SELECT id FROM course_modules WHERE course_id = ${id})`
    )
    .orderBy(asc(lessons.sortOrder));

  const modulesWithLessons = modules.map((m) => ({
    ...m,
    lessons: lessonRows.filter((l) => l.moduleId === m.id),
  }));

  return c.json({ course: { ...course, modules: modulesWithLessons } });
});

/** Update course metadata */
admin.put('/courses/:id', async (c) => {
  const id = c.req.param('id');
  const body = await c.req.json<{
    title?: string;
    slug?: string;
    description?: string;
    shortDescription?: string;
    thumbnailUrl?: string;
    price?: string;
    estimatedHours?: string;
    stripePriceId?: string;
    stripeProductId?: string;
  }>();

  const db = createDb(c.env.HYPERDRIVE);

  const [updated] = await db
    .update(courses)
    .set({ ...body, updatedAt: new Date() })
    .where(eq(courses.id, id))
    .returning();

  if (!updated) return c.json({ error: 'Course not found' }, 404);

  await db.insert(activityLog).values({
    userId: c.get('userId')!,
    action: 'admin.course.updated',
    resourceType: 'course',
    resourceId: id,
    metadata: { fields: Object.keys(body) },
  });

  return c.json({ course: updated });
});

/** Publish / unpublish a course */
admin.post('/courses/:id/publish', async (c) => {
  const id = c.req.param('id');
  const { publish } = await c.req.json<{ publish: boolean }>();
  const db = createDb(c.env.HYPERDRIVE);

  const [updated] = await db
    .update(courses)
    .set({
      isPublished: publish,
      publishedAt: publish ? new Date() : null,
      updatedAt: new Date(),
    })
    .where(eq(courses.id, id))
    .returning();

  if (!updated) return c.json({ error: 'Course not found' }, 404);

  await db.insert(activityLog).values({
    userId: c.get('userId')!,
    action: publish ? 'admin.course.published' : 'admin.course.unpublished',
    resourceType: 'course',
    resourceId: id,
  });

  return c.json({ course: updated });
});

/** Delete a course (and its modules/lessons via cascade, keep enrollments for records) */
admin.delete('/courses/:id', async (c) => {
  const id = c.req.param('id');
  const db = createDb(c.env.HYPERDRIVE);

  // Soft guard: only delete unpublished courses
  const course = await db.query.courses.findFirst({ where: eq(courses.id, id) });
  if (!course) return c.json({ error: 'Course not found' }, 404);
  if (course.isPublished) {
    return c.json({ error: 'Unpublish the course before deleting it' }, 409);
  }

  await db.delete(courses).where(eq(courses.id, id));

  return c.json({ success: true });
});

// ─────────────────────────────────────
// MODULE MANAGEMENT
// ─────────────────────────────────────

/** Add a module to a course */
admin.post('/courses/:courseId/modules', async (c) => {
  const courseId = c.req.param('courseId');
  const body = await c.req.json<{
    title: string;
    description?: string;
    sortOrder?: number;
    dripDelayDays?: number;
  }>();

  if (!body.title) return c.json({ error: 'title is required' }, 400);

  const db = createDb(c.env.HYPERDRIVE);

  // Auto-assign sortOrder if not provided
  const [{ maxOrder }] = await db
    .select({ maxOrder: sql<number>`COALESCE(MAX(sort_order), -1)` })
    .from(courseModules)
    .where(eq(courseModules.courseId, courseId));

  const [module] = await db
    .insert(courseModules)
    .values({
      courseId,
      title: body.title,
      description: body.description,
      sortOrder: body.sortOrder ?? (maxOrder + 1),
      dripDelayDays: body.dripDelayDays ?? 0,
    })
    .returning();

  // Update totalModules counter
  await db
    .update(courses)
    .set({ totalModules: sql`total_modules + 1`, updatedAt: new Date() })
    .where(eq(courses.id, courseId));

  return c.json({ module }, 201);
});

/** Update a module */
admin.put('/modules/:id', async (c) => {
  const id = c.req.param('id');
  const body = await c.req.json<{
    title?: string;
    description?: string;
    sortOrder?: number;
    dripDelayDays?: number;
  }>();

  const db = createDb(c.env.HYPERDRIVE);

  const [updated] = await db
    .update(courseModules)
    .set(body)
    .where(eq(courseModules.id, id))
    .returning();

  if (!updated) return c.json({ error: 'Module not found' }, 404);

  return c.json({ module: updated });
});

/** Delete a module */
admin.delete('/modules/:id', async (c) => {
  const id = c.req.param('id');
  const db = createDb(c.env.HYPERDRIVE);

  const m = await db.query.courseModules.findFirst({ where: eq(courseModules.id, id) });
  if (!m) return c.json({ error: 'Module not found' }, 404);

  await db.delete(courseModules).where(eq(courseModules.id, id));

  // Decrement counter
  await db
    .update(courses)
    .set({ totalModules: sql`GREATEST(total_modules - 1, 0)`, updatedAt: new Date() })
    .where(eq(courses.id, m.courseId));

  return c.json({ success: true });
});

// ─────────────────────────────────────
// LESSON MANAGEMENT
// ─────────────────────────────────────

/** Add a lesson to a module */
admin.post('/modules/:moduleId/lessons', async (c) => {
  const moduleId = c.req.param('moduleId');
  const body = await c.req.json<{
    title: string;
    description?: string;
    contentType?: 'video' | 'text' | 'quiz';
    videoUrl?: string;
    textContent?: string;
    durationMinutes?: number;
    sortOrder?: number;
    isFree?: boolean;
  }>();

  if (!body.title) return c.json({ error: 'title is required' }, 400);

  const db = createDb(c.env.HYPERDRIVE);

  const module = await db.query.courseModules.findFirst({ where: eq(courseModules.id, moduleId) });
  if (!module) return c.json({ error: 'Module not found' }, 404);

  const [{ maxOrder }] = await db
    .select({ maxOrder: sql<number>`COALESCE(MAX(sort_order), -1)` })
    .from(lessons)
    .where(eq(lessons.moduleId, moduleId));

  const [lesson] = await db
    .insert(lessons)
    .values({
      moduleId,
      title: body.title,
      description: body.description,
      contentType: body.contentType ?? 'video',
      videoUrl: body.videoUrl,
      textContent: body.textContent,
      durationMinutes: body.durationMinutes,
      sortOrder: body.sortOrder ?? (maxOrder + 1),
      isFree: body.isFree ?? false,
    })
    .returning();

  // Update totalLessons counter on the course
  await db
    .update(courses)
    .set({ totalLessons: sql`total_lessons + 1`, updatedAt: new Date() })
    .where(eq(courses.id, module.courseId));

  return c.json({ lesson }, 201);
});

/** Update a lesson */
admin.put('/lessons/:id', async (c) => {
  const id = c.req.param('id');
  const body = await c.req.json<{
    title?: string;
    description?: string;
    contentType?: 'video' | 'text' | 'quiz';
    videoUrl?: string;
    textContent?: string;
    durationMinutes?: number;
    sortOrder?: number;
    isFree?: boolean;
  }>();

  const db = createDb(c.env.HYPERDRIVE);

  const [updated] = await db
    .update(lessons)
    .set(body)
    .where(eq(lessons.id, id))
    .returning();

  if (!updated) return c.json({ error: 'Lesson not found' }, 404);

  return c.json({ lesson: updated });
});

/** Delete a lesson */
admin.delete('/lessons/:id', async (c) => {
  const id = c.req.param('id');
  const db = createDb(c.env.HYPERDRIVE);

  const lesson = await db.query.lessons.findFirst({ where: eq(lessons.id, id) });
  if (!lesson) return c.json({ error: 'Lesson not found' }, 404);

  const module = await db.query.courseModules.findFirst({
    where: eq(courseModules.id, lesson.moduleId),
  });

  await db.delete(lessons).where(eq(lessons.id, id));

  if (module) {
    await db
      .update(courses)
      .set({ totalLessons: sql`GREATEST(total_lessons - 1, 0)`, updatedAt: new Date() })
      .where(eq(courses.id, module.courseId));
  }

  return c.json({ success: true });
});

// ─────────────────────────────────────
// STUDENT & ENROLLMENT MANAGEMENT
// ─────────────────────────────────────

/** List all enrollments with student + course info */
admin.get('/enrollments', async (c) => {
  const db = createDb(c.env.HYPERDRIVE);

  const courseId = c.req.query('courseId');
  const status = c.req.query('status');
  const page = parseInt(c.req.query('page') ?? '1');
  const limit = Math.min(parseInt(c.req.query('limit') ?? '50'), 100);
  const offset = (page - 1) * limit;

  const conditions = [];
  if (courseId) conditions.push(eq(enrollments.courseId, courseId));
  if (status) conditions.push(eq(enrollments.status, status as 'active' | 'paused' | 'completed' | 'expired' | 'refunded'));

  const rows = await db
    .select({
      enrollmentId: enrollments.id,
      status: enrollments.status,
      progressPercent: enrollments.progressPercent,
      enrolledAt: enrollments.enrolledAt,
      completedAt: enrollments.completedAt,
      lastAccessedAt: enrollments.lastAccessedAt,
      courseId: courses.id,
      courseTitle: courses.title,
      userId: users.id,
      userName: users.name,
      userEmail: users.email,
    })
    .from(enrollments)
    .innerJoin(courses, eq(courses.id, enrollments.courseId))
    .innerJoin(users, eq(users.id, enrollments.userId))
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(enrollments.enrolledAt))
    .limit(limit)
    .offset(offset);

  return c.json({ enrollments: rows, page, limit });
});

/** Manually enroll a user in a course */
admin.post('/enrollments', async (c) => {
  const { userId, courseId } = await c.req.json<{ userId: string; courseId: string }>();
  if (!userId || !courseId) return c.json({ error: 'userId and courseId are required' }, 400);

  const db = createDb(c.env.HYPERDRIVE);

  const [enrollment] = await db
    .insert(enrollments)
    .values({ userId, courseId, status: 'active' })
    .onConflictDoUpdate({
      target: [enrollments.userId, enrollments.courseId],
      set: { status: 'active' },
    })
    .returning();

  await db.insert(activityLog).values({
    userId: c.get('userId')!,
    action: 'admin.enrollment.created',
    resourceType: 'enrollment',
    resourceId: enrollment.id,
    metadata: { targetUserId: userId, courseId },
  });

  return c.json({ enrollment }, 201);
});

/** Update enrollment status (pause, refund, expire) */
admin.put('/enrollments/:id', async (c) => {
  const id = c.req.param('id');
  const { status } = await c.req.json<{
    status: 'active' | 'paused' | 'completed' | 'expired' | 'refunded';
  }>();

  const db = createDb(c.env.HYPERDRIVE);

  const [updated] = await db
    .update(enrollments)
    .set({
      status,
      completedAt: status === 'completed' ? new Date() : undefined,
    })
    .where(eq(enrollments.id, id))
    .returning();

  if (!updated) return c.json({ error: 'Enrollment not found' }, 404);

  await db.insert(activityLog).values({
    userId: c.get('userId')!,
    action: `admin.enrollment.${status}`,
    resourceType: 'enrollment',
    resourceId: id,
  });

  return c.json({ enrollment: updated });
});

/** Get a student's progress on a course */
admin.get('/students/:userId/progress/:courseId', async (c) => {
  const { userId, courseId } = c.req.param();
  const db = createDb(c.env.HYPERDRIVE);

  const enrollment = await db.query.enrollments.findFirst({
    where: (e, { and }) => and(eq(e.userId, userId), eq(e.courseId, courseId)),
  });

  if (!enrollment) return c.json({ error: 'Enrollment not found' }, 404);

  const modules = await db
    .select()
    .from(courseModules)
    .where(eq(courseModules.courseId, courseId))
    .orderBy(asc(courseModules.sortOrder));

  const lessonRows = await db
    .select()
    .from(lessons)
    .where(
      sql`${lessons.moduleId} IN (SELECT id FROM course_modules WHERE course_id = ${courseId})`
    )
    .orderBy(asc(lessons.sortOrder));

  const progressRows = await db
    .select()
    .from(lessonProgress)
    .where(
      sql`${lessonProgress.userId} = ${userId} AND ${lessonProgress.lessonId} IN (
        SELECT l.id FROM lessons l
        JOIN course_modules m ON l.module_id = m.id
        WHERE m.course_id = ${courseId}
      )`
    );

  const progressMap = new Map(progressRows.map((p) => [p.lessonId, p]));

  const detail = modules.map((m) => ({
    ...m,
    lessons: lessonRows
      .filter((l) => l.moduleId === m.id)
      .map((l) => ({
        ...l,
        progress: progressMap.get(l.id) ?? null,
      })),
  }));

  return c.json({ enrollment, modules: detail });
});

// ─────────────────────────────────────
// ANALYTICS
// ─────────────────────────────────────

/** Course analytics overview */
admin.get('/analytics', async (c) => {
  const db = createDb(c.env.HYPERDRIVE);

  const [totals] = await db
    .select({
      totalCourses: count(courses.id),
    })
    .from(courses);

  const [enrollmentTotals] = await db
    .select({
      totalEnrollments: count(enrollments.id),
      activeEnrollments: sql<number>`COUNT(*) FILTER (WHERE status = 'active')`,
      completedEnrollments: sql<number>`COUNT(*) FILTER (WHERE status = 'completed')`,
    })
    .from(enrollments);

  const courseStats = await db
    .select({
      courseId: courses.id,
      courseTitle: courses.title,
      enrollments: sql<number>`COUNT(${enrollments.id})`,
      completions: sql<number>`COUNT(${enrollments.id}) FILTER (WHERE ${enrollments.status} = 'completed')`,
      avgProgress: sql<number>`ROUND(AVG(${enrollments.progressPercent}), 1)`,
    })
    .from(courses)
    .leftJoin(enrollments, eq(enrollments.courseId, courses.id))
    .groupBy(courses.id, courses.title)
    .orderBy(desc(sql`COUNT(${enrollments.id})`));

  return c.json({
    totals: {
      ...totals,
      ...enrollmentTotals,
    },
    courseStats,
  });
});

export default admin;
