/**
 * Database seeding endpoint
 * POST /api/admin/seed - Creates sample data for testing
 * 
 * WARNING: This endpoint should only be available in development!
 * Remove or gate this behind admin auth in production.
 */

import { Hono } from 'hono';
import { eq } from 'drizzle-orm';
import { createDb } from '../db';
import {
  users, services, availabilitySlots, productCategories, products,
  courses, courseModules, lessons, events
} from '../db/schema';
import { hashPassword } from '../utils/auth';
import { authMiddleware, adminOnly } from '../middleware/auth';
import type { Env, Variables } from '../types/env';

const adminSeed = new Hono<{ Bindings: Env; Variables: Variables }>();

// ─── POST: Seed Database ───
adminSeed.post('/seed', authMiddleware, adminOnly, async (c) => {
  if (c.env.ENVIRONMENT !== 'development') {
    return c.json({ error: 'Forbidden' }, 403);
  }

  const db = createDb(c.env.DATABASE_URL ?? c.env.HYPERDRIVE);
  const results: Record<string, any> = {};

  try {
    // Check if data already exists
    const [existingCourse] = await db
      .select()
      .from(courses)
      .where(eq(courses.slug, 'cipher-of-healing'))
      .limit(1);

    if (existingCourse) {
      return c.json({ message: 'Database already seeded', warning: 'Skipping to avoid duplicates' });
    }

    // ─── SEED USERS ───
    // Generates a one-time random password per seed run — logged to stdout only.
    const seedPassword = crypto.randomUUID();
    const adminHash = await hashPassword(seedPassword);

    // 3 Test Admin Users (Full Access)
    const [admin1] = await db
      .insert(users)
      .values({
        email: 'admin1@coh.local',
        passwordHash: adminHash,
        name: 'Test Admin 1',
        role: 'admin',
        membershipTier: 'free',
      })
      .onConflictDoNothing()
      .returning();

    const [admin2] = await db
      .insert(users)
      .values({
        email: 'admin2@coh.local',
        passwordHash: adminHash,
        name: 'Test Admin 2',
        role: 'admin',
        membershipTier: 'free',
      })
      .onConflictDoNothing()
      .returning();

    const [admin3] = await db
      .insert(users)
      .values({
        email: 'admin3@coh.local',
        passwordHash: adminHash,
        name: 'Test Admin 3',
        role: 'admin',
        membershipTier: 'free',
      })
      .onConflictDoNothing()
      .returning();

    // Additional test users for other roles
    const [practitionerUser] = await db
      .insert(users)
      .values({
        email: 'practitioner@coh.local',
        passwordHash: adminHash,
        name: 'Healing Practitioner',
        role: 'practitioner',
        membershipTier: 'free',
      })
      .onConflictDoNothing()
      .returning();

    const [clientUser] = await db
      .insert(users)
      .values({
        email: 'user@coh.local',
        passwordHash: adminHash,
        name: 'John Doe',
        role: 'client',
        membershipTier: 'free',
      })
      .onConflictDoNothing()
      .returning();

    // Log the seed password to stdout only — never return in response body.
    console.log('[seed] one-time password for test accounts:', seedPassword);

    results.users = {
      admins: [admin1?.email, admin2?.email, admin3?.email].filter(Boolean),
      practitioner: practitionerUser?.email,
      client: clientUser?.email,
    };

    // ─── SEED SERVICES ───
    const serviceData = [
      {
        name: '30-Minute Consultation',
        description: 'Initial consultation to discuss your healing journey',
        durationMinutes: 30,
        price: '49.00',
        depositAmount: '25.00',
        category: 'consultation',
        sortOrder: 1,
      },
      {
        name: '60-Minute Deep-Work Session',
        description: 'Intensive trauma-informed breathwork and somatic therapy',
        durationMinutes: 60,
        price: '120.00',
        depositAmount: '60.00',
        category: 'therapy',
        sortOrder: 2,
      },
      {
        name: '90-Minute Integration Intensive',
        description: 'Extended session combining therapy, somatic work, and integration',
        durationMinutes: 90,
        price: '180.00',
        depositAmount: '90.00',
        category: 'intensive',
        sortOrder: 3,
      },
    ];

    const insertedServices = await db.insert(services).values(serviceData).returning();
    results.services = insertedServices.length;

    // ─── SEED AVAILABILITY SLOTS ───
    const availabilityData = [
      { dayOfWeek: 1, startTime: '09:00', endTime: '17:00' },
      { dayOfWeek: 2, startTime: '09:00', endTime: '17:00' },
      { dayOfWeek: 3, startTime: '09:00', endTime: '17:00' },
      { dayOfWeek: 4, startTime: '09:00', endTime: '17:00' },
      { dayOfWeek: 5, startTime: '09:00', endTime: '15:00' },
    ];

    const insertedSlots = await db.insert(availabilitySlots).values(availabilityData).returning();
    results.availabilitySlots = insertedSlots.length;

    // ─── SEED PRODUCT CATEGORIES ───
    const categoryData = [
      { name: 'Books', slug: 'books', description: 'Published works on trauma and healing' },
      { name: 'Journals', slug: 'journals', description: 'Guided journals for integration work' },
      { name: 'Digital Courses', slug: 'digital-courses', description: 'Self-paced learning modules' },
      { name: 'Merchandise', slug: 'merchandise', description: 'Branded items and gifts' },
    ];

    const insertedCategories = await db.insert(productCategories).values(categoryData).returning();
    results.productCategories = insertedCategories.length;

    // ─── SEED PRODUCTS ───
    const booksCategory = insertedCategories.find(c => c.slug === 'books');
    const journalsCategory = insertedCategories.find(c => c.slug === 'journals');
    const digitalCategory = insertedCategories.find(c => c.slug === 'digital-courses');

    const productData = [
      {
        categoryId: booksCategory?.id,
        name: 'The Cipher of Healing: Workbook',
        slug: 'cipher-healing-workbook',
        description: 'Comprehensive workbook with exercises and tracking tools',
        shortDescription: 'Companion workbook for the course',
        price: '24.95',
        type: 'physical' as const,
      },
      {
        categoryId: journalsCategory?.id,
        name: 'The Legacy Letter: Journal',
        slug: 'legacy-letter-journal',
        description: 'Beautiful leather-bound journal for reflections',
        shortDescription: 'Guided journal for integration',
        price: '18.95',
        type: 'physical' as const,
      },
      {
        categoryId: digitalCategory?.id,
        name: 'Trigger Tracker App - 6 Months',
        slug: 'trigger-tracker-app',
        description: 'Digital tool for tracking triggers and healing progress',
        shortDescription: '6-month app subscription',
        price: '19.95',
        type: 'digital' as const,
      },
      {
        categoryId: booksCategory?.id,
        name: '90-Day Resilience Challenge Bundle',
        slug: 'resilience-bundle',
        description: 'Workbook + app + weekly group calls (3 months)',
        shortDescription: 'Bundle package - save 25%',
        price: '147.00',
        type: 'physical' as const,
      },
    ];

    const insertedProducts = await db.insert(products).values(productData).returning();
    results.products = insertedProducts.length;

    // ─── SEED COURSES ───
    const [cipherCourse] = await db
      .insert(courses)
      .values({
        title: 'The Cipher of Healing',
        slug: 'cipher-of-healing',
        description: `A 6-station self-paced journey that decodes the patterns of your past, inhabits the zero of the present, and restores the future you were always meant to live.

This is not a quick fix. This is archaeology, decoding, and restoration.

What You'll Learn:
• The framework for understanding trauma as code
• Somatic practices for nervous system regulation
• Cognitive restructuring and belief rewriting
• Emotional integration
• Boundary-building for the person you're becoming
• Legacy work and future visualization

Duration: 12-18 hours (self-paced)`,
        shortDescription: 'Transform trauma into resilience through 6 transformative stations',
        price: '197.00',
        totalModules: 6,
        totalLessons: 24,
        estimatedHours: '15.0',
        isPublished: true,
        publishedAt: new Date(),
      })
      .returning();

    results.courses = 1;

    // ─── SEED COURSE MODULES ───
    const moduleData = [
      {
        courseId: cipherCourse.id,
        title: 'Station 1: The Cipher Framework',
        description: 'Before the blade touches skin, there is always the intention.',
        sortOrder: 1,
        dripDelayDays: 0,
      },
      {
        courseId: cipherCourse.id,
        title: 'Station 2: Roots of the Past',
        description: 'Go back not to suffer again, but to map it.',
        sortOrder: 2,
        dripDelayDays: 2,
      },
      {
        courseId: cipherCourse.id,
        title: 'Station 3: Breaking the Code',
        description: 'Awareness enters the present tense.',
        sortOrder: 3,
        dripDelayDays: 5,
      },
      {
        courseId: cipherCourse.id,
        title: 'Station 4: Healing in Motion',
        description: 'The restoration begins.',
        sortOrder: 4,
        dripDelayDays: 8,
      },
      {
        courseId: cipherCourse.id,
        title: 'Station 5: Rebuilding Resilience',
        description: 'The fresh cut needs maintenance.',
        sortOrder: 5,
        dripDelayDays: 11,
      },
      {
        courseId: cipherCourse.id,
        title: 'Station 6: The Cipher of the Future',
        description: 'Visualize the healed self.',
        sortOrder: 6,
        dripDelayDays: 14,
      },
    ];

    const insertedModules = await db.insert(courseModules).values(moduleData).returning();
    results.courseModules = insertedModules.length;

    // ─── SEED LESSONS ───
    const lessonTitles = [
      'What is the Cipher? Understanding Code as Metaphor',
      'The Intention-Setting Exercise: Your Starting Point',
      'The Commitment Declaration: Honesty Over Speed',
      'Introduction to Zero: The Pause Before Transformation',
      'Your Family System Map: Mapping the Inheritance',
      'Childhood Wounds: Archaeological Inventory',
      'Attachment Styles and Trauma Bonding',
      'Understanding Your Primary Caregiver Pattern',
      'Recognizing Your Triggers in Daily Life',
      'The Trauma Response Map: Fight, Flight, Freeze, Fawn',
      'Building Your Trigger Tracker',
      'From Reaction to Choice: The Awareness Gap',
      'Mind-Body Reset: Vagal Brake Techniques',
      'Cognitive Reframing: Rewriting the Narrative',
      'Belief Rewriting: Whose Beliefs Are These?',
      'Daily Healing Practice: Building the Container',
      'The Boundaries Builder Framework',
      '30-Day Resilience Tracker Implementation',
      'Daily Affirmation Practice for Integration',
      'Community and Support: Healing as Relational',
      'Visualization: Stepping Into Your Healed Self',
      'Writing Your Legacy Letter',
      'The Cipher Statement: Who You Are Now',
      'Integration & Next Steps: The Road Ahead',
    ];

    const lessonData = lessonTitles.map((title, index) => {
      const moduleIndex = Math.floor(index / 4);
      const module = insertedModules[moduleIndex];
      return {
        moduleId: module.id,
        title,
        description: `${title} - A comprehensive lesson exploring the foundations and practices of this transformation stage.`,
        contentType: 'video' as const,
        durationMinutes: 8 + Math.floor(Math.random() * 12),
        sortOrder: (index % 4) + 1,
        isFree: index < 2, // First 2 lessons free
      };
    });

    const insertedLessons = await db.insert(lessons).values(lessonData).returning();
    results.lessons = insertedLessons.length;

    // ─── SEED EVENTS ───
    const eventData = [
      {
        title: 'Introduction to Trauma-Informed Healing',
        slug: 'intro-trauma-webinar',
        description:
          'Discover the foundations of trauma-informed healing and learn how to recognize trauma patterns.',
        type: 'webinar' as const,
        status: 'scheduled' as const,
        capacity: 200,
        registrationCount: 0,
        scheduledAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        durationMinutes: 90,
        isPaid: false,
        price: '0.00',
      },
      {
        title: 'Building Boundaries: Workshop',
        slug: 'building-boundaries-workshop',
        description: 'An interactive workshop focused on identifying and maintaining healthy boundaries.',
        type: 'workshop' as const,
        status: 'scheduled' as const,
        capacity: 30,
        registrationCount: 0,
        scheduledAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
        durationMinutes: 120,
        isPaid: true,
        price: '67.00',
      },
      {
        title: 'The Inner Circle: Private Consultation',
        slug: 'inner-circle-consultation',
        description: 'Private consultation for those ready for deep one-on-one work.',
        type: 'consultation' as const,
        status: 'scheduled' as const,
        capacity: 1,
        registrationCount: 0,
        scheduledAt: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000),
        durationMinutes: 60,
        isPaid: true,
        price: '200.00',
      },
    ];

    const insertedEvents = await db.insert(events).values(eventData).returning();
    results.events = insertedEvents.length;

    return c.json({
      success: true,
      message: 'Database seeded successfully!',
      results,
      note: 'Seed password logged to worker stdout — check wrangler tail for the one-time password.',
    });
  } catch (error) {
    console.error('Seed error:', error);
    return c.json(
      {
        error: 'Failed to seed database',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      500
    );
  }
});

// ─── GET: Seed Status ───
adminSeed.get('/seed/status', authMiddleware, adminOnly, async (c) => {

  const db = createDb(c.env.DATABASE_URL ?? c.env.HYPERDRIVE);

  try {
    const userList = await db.select().from(users);
    const courseList = await db.select().from(courses);
    const lessonList = await db.select().from(lessons);
    const serviceList = await db.select().from(services);
    const productList = await db.select().from(products);
    const eventList = await db.select().from(events);

    return c.json({
      seeded: true,
      counts: {
        users: userList.length,
        courses: courseList.length,
        lessons: lessonList.length,
        services: serviceList.length,
        products: productList.length,
        events: eventList.length,
      },
    });
  } catch (error) {
    return c.json({ seeded: false, error: 'Could not determine seed status' });
  }
});

export default adminSeed;
