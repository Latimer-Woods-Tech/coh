/**
 * Database seed script
 * Creates sample data for development and testing
 *
 * Usage:
 * - node src/db/seed.ts (when Node.js available)
 * - Or manually run SQL from exported statements
 */

import { sql } from 'drizzle-orm';
import {
  users, services, products, courses, courseModules, lessons,
  events, productCategories, availabilitySlots
} from './schema';

export const seedData = {
  // ─── USERS ───
  adminUser: {
    email: 'admin@coh.local',
    passwordHash: 'TODO_HASH_IN_DB', // Pre-hashed: password123
    name: 'Cipher Admin',
    role: 'admin' as const,
    membershipTier: 'free' as const,
  },

  clientUser: {
    email: 'user@coh.local',
    passwordHash: 'TODO_HASH_IN_DB', // Pre-hashed: password123
    name: 'John Client',
    role: 'client' as const,
    membershipTier: 'free' as const,
  },

  // ─── SERVICES (Booking) ───
  services: [
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
      description: 'Extended session combining therapy, somatic work, and integration practices',
      durationMinutes: 90,
      price: '180.00',
      depositAmount: '90.00',
      category: 'intensive',
      sortOrder: 3,
    },
    {
      name: 'Group Workshop (2 hrs)',
      description: 'Small group healing circles focused on specific trauma patterns',
      durationMinutes: 120,
      price: '67.00',
      depositAmount: '33.50',
      category: 'group',
      sortOrder: 4,
    },
  ],

  // ─── AVAILABILITY SLOTS ───
  availabilitySlots: [
    { dayOfWeek: 1, startTime: '09:00', endTime: '17:00' }, // Monday
    { dayOfWeek: 2, startTime: '09:00', endTime: '17:00' }, // Tuesday
    { dayOfWeek: 3, startTime: '09:00', endTime: '17:00' }, // Wednesday
    { dayOfWeek: 4, startTime: '09:00', endTime: '17:00' }, // Thursday
    { dayOfWeek: 5, startTime: '09:00', endTime: '15:00' }, // Friday
  ],

  // ─── PRODUCTS ───
  productCategories: [
    { name: 'Books', description: 'Published works on trauma and healing' },
    { name: 'Journals', description: 'Guided journals for integration work' },
    { name: 'Digital Courses', description: 'Self-paced learning modules' },
    { name: 'Merchandise', description: 'Branded items and gifts' },
  ],

  products: [
    {
      title: 'The Cipher of Healing: A Workbook',
      slug: 'cipher-healing-workbook',
      description: 'Comprehensive workbook with exercises, reflections, and tracking tools for the course',
      shortDescription: 'Companion workbook for the course',
      price: '24.95',
      type: 'physical' as const,
      categoryName: 'Books',
      printFulfillmentId: null,
    },
    {
      title: 'The Legacy Letter: Guided Journal',
      slug: 'legacy-letter-journal',
      description: 'Beautiful leather-bound journal for writing your legacy letter and personal reflections',
      shortDescription: 'Guided journal for integration',
      price: '18.95',
      type: 'physical' as const,
      categoryName: 'Journals',
      printFulfillmentId: null,
    },
    {
      title: 'The Trigger Tracker: Mobile App',
      slug: 'trigger-tracker-app',
      description: 'Digital tool for tracking triggers, responses, and healing progress in real-time',
      shortDescription: '6-month app subscription',
      price: '19.95',
      type: 'digital' as const,
      categoryName: 'Digital Courses',
      printFulfillmentId: null,
    },
    {
      title: '90-Day Resilience Challenge Bundle',
      slug: 'resilience-bundle',
      description: 'Combination: workbook + app + weekly live group calls (3 months)',
      shortDescription: 'Bundle package - save 25%',
      price: '147.00',
      type: 'physical' as const,
      categoryName: 'Digital Courses',
      printFulfillmentId: null,
    },
  ],

  // ─── COURSES (Academy) ───
  courses: [
    {
      title: 'The Cipher of Healing',
      slug: 'cipher-of-healing',
      description: `A 6-station self-paced journey that decodes the patterns of your past, inhabits the zero of the present, and restores the future you were always meant to live. 

This is not a quick fix. This is archaeology, decoding, and restoration—the way trauma healing actually works.

What You'll Learn:
• The framework for understanding trauma as code (patterns that run underneath awareness)
• Somatic practices for settling your nervous system
• Cognitive restructuring: rewriting beliefs that were never yours
• Emotional integration: safe processing of difficult feelings
• Boundary-building for the person you're becoming
• Legacy work: declaring what you choose to pass forward

Ideal For:
- People with unresolved childhood trauma
- Those in recovery from difficult relationships
- Anyone rebuilding after a major life event
- Practitioners and therapists wanting to deepen their own work

Duration: 12-18 hours (self-paced)
Estimated Completion: 4-8 weeks
Price: $197`,
      shortDescription: 'Transform trauma into resilience through 6 transformative stations',
      price: '197.00',
      totalModules: 6,
      totalLessons: 24,
      estimatedHours: '15',
      isPublished: true,
      publishedAt: new Date(),
    },
  ],

  // ─── COURSE MODULES ───
  courseModules: [
    {
      title: 'Station 1: The Cipher Framework',
      description: 'Before the blade touches skin, there is always the intention. You learn what the cipher means — as code, as zero, as circle. You make a commitment to honesty over speed.',
      sortOrder: 1,
      dripDelayDays: 0,
    },
    {
      title: 'Station 2: Roots of the Past',
      description: 'Go back not to suffer again, but to map it. Childhood wounds, family patterns, attachment styles. Archaeological work: careful, patient, precise.',
      sortOrder: 2,
      dripDelayDays: 2,
    },
    {
      title: 'Station 3: Breaking the Code',
      description: 'Awareness enters the present tense. Learn to recognize triggers, trauma responses, and the moments when you react instead of choose.',
      sortOrder: 3,
      dripDelayDays: 5,
    },
    {
      title: 'Station 4: Healing in Motion',
      description: 'The restoration begins. Mind-body reset, cognitive reframing, belief rewriting. Healing is not a single event but a daily practice.',
      sortOrder: 4,
      dripDelayDays: 8,
    },
    {
      title: 'Station 5: Rebuilding Resilience',
      description: 'The fresh cut needs maintenance. Build your Boundaries Builder—the framework for protecting the person you are becoming.',
      sortOrder: 5,
      dripDelayDays: 11,
    },
    {
      title: 'Station 6: The Cipher of the Future',
      description: 'Visualize the healed self. Write your Legacy Letter. Declare who you are now and what you choose to pass down.',
      sortOrder: 6,
      dripDelayDays: 14,
    },
  ],

  // ─── LESSONS ───
  lessonTitles: [
    // Module 1
    'What is the Cipher? Understanding Code as Metaphor',
    'The Intention-Setting Exercise: Your Starting Point',
    'The Commitment Declaration: Honesty Over Speed',
    'Introduction to Zero: The Pause Before Transformation',
    // Module 2
    'Your Family System Map: Mapping the Inheritance',
    'Childhood Wounds: Archaeological Inventory',
    'Attachment Styles and Trauma Bonding',
    'Understanding Your Primary Caregiver Pattern',
    // Module 3
    'Recognizing Your Triggers in Daily Life',
    'The Trauma Response Map: Fight, Flight, Freeze, Fawn',
    'Building Your Trigger Tracker',
    'From Reaction to Choice: The Awareness Gap',
    // Module 4
    'Mind-Body Reset: Vagal Brake Techniques',
    'Cognitive Reframing: Rewriting the Narrative',
    'Belief Rewriting: Whose Beliefs Are These?',
    'Daily Healing Practice: Building the Container',
    // Module 5
    'The Boundaries Builder Framework',
    '30-Day Resilience Tracker Implementation',
    'Daily Affirmation Practice for Integration',
    'Community and Support: Healing as Relational',
    // Module 6
    'Visualization: Stepping Into Your Healed Self',
    'Writing Your Legacy Letter',
    'The Cipher Statement: Who You Are Now',
    'Integration & Next Steps: The Road Ahead',
  ],

  // ─── EVENTS ───
  events: [
    {
      title: 'Introduction to Trauma-Informed Healing',
      slug: 'intro-trauma-webinar',
      description: 'Discover the foundations of trauma-informed healing and learn how to recognize trauma patterns in yourself and others.',
      type: 'webinar' as const,
      status: 'scheduled' as const,
      capacity: 200,
      registrationCount: 0,
      scheduledAt: new Date(new Date().getTime() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
      durationMinutes: 90,
      isPaid: false,
      price: '0.00',
    },
    {
      title: 'Building Boundaries: Workshop',
      slug: 'building-boundaries-workshop',
      description: 'An interactive workshop focused on identifying, communicating, and maintaining healthy boundaries in all relationships.',
      type: 'workshop' as const,
      status: 'scheduled' as const,
      capacity: 30,
      registrationCount: 0,
      scheduledAt: new Date(new Date().getTime() + 14 * 24 * 60 * 60 * 1000), // 14 days from now
      durationMinutes: 120,
      isPaid: true,
      price: '67.00',
    },
    {
      title: 'The Inner Circle: Private Consultation',
      slug: 'inner-circle-consultation',
      description: 'Private consultation for those ready for deep one-on-one work on their healing journey.',
      type: 'consultation' as const,
      status: 'scheduled' as const,
      capacity: 1,
      registrationCount: 0,
      scheduledAt: new Date(new Date().getTime() + 21 * 24 * 60 * 60 * 1000), // 21 days from now
      durationMinutes: 60,
      isPaid: true,
      price: '200.00',
    },
  ],
};
