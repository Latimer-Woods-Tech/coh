import { pgTable, text, timestamp, integer, boolean, decimal, jsonb, uuid, varchar, pgEnum, uniqueIndex, index, type AnyPgColumn } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// ============================================================
// ENUMS
// ============================================================

export const userRoleEnum = pgEnum('user_role', ['client', 'admin', 'practitioner']);
export const appointmentStatusEnum = pgEnum('appointment_status', ['pending', 'confirmed', 'in_progress', 'completed', 'cancelled', 'no_show']);
export const orderStatusEnum = pgEnum('order_status', ['pending', 'paid', 'processing', 'shipped', 'delivered', 'refunded', 'cancelled']);
export const productTypeEnum = pgEnum('product_type', ['physical', 'digital', 'book']);
export const enrollmentStatusEnum = pgEnum('enrollment_status', ['active', 'paused', 'completed', 'expired', 'refunded']);
export const eventTypeEnum = pgEnum('event_type', ['webinar', 'workshop', 'consultation']);
export const eventStatusEnum = pgEnum('event_status', ['draft', 'scheduled', 'live', 'completed', 'cancelled']);
export const membershipTierEnum = pgEnum('membership_tier', ['free', 'vip', 'inner_circle']);
export const subscriptionStatusEnum = pgEnum('subscription_status', ['active', 'past_due', 'cancelled', 'paused']);
export const emailStatusEnum = pgEnum('email_status', ['draft', 'scheduled', 'sent', 'failed']);

// ============================================================
// CORE: USERS (The unified customer record — everything connects here)
// ============================================================

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  passwordHash: text('password_hash'),                    // null for magic-link-only users
  name: varchar('name', { length: 255 }).notNull(),
  avatarUrl: text('avatar_url'),
  role: userRoleEnum('role').default('client').notNull(),

  // Stripe connection — one Stripe customer per user, across ALL revenue streams
  stripeCustomerId: varchar('stripe_customer_id', { length: 255 }).unique(),

  // Membership
  membershipTier: membershipTierEnum('membership_tier').default('free').notNull(),

  // Communication (SMS, voice calls)
  phone: varchar('phone', { length: 20 }),
  smsOptIn: boolean('sms_opt_in').default(false),
  voiceOptIn: boolean('voice_opt_in').default(false),
  telnyxContactId: varchar('telnyx_contact_id', { length: 255 }),

  // Preferences (hair type, product preferences, communication prefs)
  preferences: jsonb('preferences').default({}),

  // Referral system
  referralCode: varchar('referral_code', { length: 20 }).unique(),
  referredBy: uuid('referred_by').references((): AnyPgColumn => users.id),

  // Tracking
  lastActiveAt: timestamp('last_active_at'),
  emailVerifiedAt: timestamp('email_verified_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => [
  index('users_email_idx').on(table.email),
  index('users_stripe_idx').on(table.stripeCustomerId),
  index('users_referral_idx').on(table.referralCode),
]);

// ============================================================
// STREAM 1: THE CHAIR (Appointments / Booking)
// ============================================================

export const services = pgTable('services', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 255 }).notNull(),       // "The Restoration Cut", "Beard Sculpting"
  description: text('description'),
  durationMinutes: integer('duration_minutes').notNull(),
  price: decimal('price', { precision: 10, scale: 2 }).notNull(),
  depositAmount: decimal('deposit_amount', { precision: 10, scale: 2 }),  // required deposit
  category: varchar('category', { length: 100 }),          // "cuts", "beard", "scalp", "consultation"
  isActive: boolean('is_active').default(true).notNull(),
  sortOrder: integer('sort_order').default(0),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const availabilitySlots = pgTable('availability_slots', {
  id: uuid('id').primaryKey().defaultRandom(),
  dayOfWeek: integer('day_of_week').notNull(),             // 0=Sunday, 6=Saturday
  startTime: varchar('start_time', { length: 5 }).notNull(), // "09:00"
  endTime: varchar('end_time', { length: 5 }).notNull(),     // "17:00"
  isActive: boolean('is_active').default(true).notNull(),
});

export const appointments = pgTable('appointments', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id).notNull(),
  serviceId: uuid('service_id').references(() => services.id).notNull(),
  status: appointmentStatusEnum('status').default('pending').notNull(),

  scheduledAt: timestamp('scheduled_at').notNull(),
  endAt: timestamp('end_at').notNull(),
  notes: text('notes'),                                     // client notes or barber notes

  // Payment tracking
  stripePaymentIntentId: varchar('stripe_payment_intent_id', { length: 255 }),
  depositPaid: boolean('deposit_paid').default(false),
  totalPaid: decimal('total_paid', { precision: 10, scale: 2 }),

  // Post-session: products used → drives cross-sell to store
  productsUsed: jsonb('products_used').default([]),         // [{productId, name}] — powers "products from your session" email

  // Reminders
  reminderSentAt: timestamp('reminder_sent_at'),
  reminderChannel: varchar('reminder_channel', { length: 20 }),  // 'sms', 'email', 'both'
  followUpSentAt: timestamp('follow_up_sent_at'),

  // Telnyx integration
  telnyxMessageId: varchar('telnyx_message_id', { length: 255 }),

  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => [
  index('appointments_user_idx').on(table.userId),
  index('appointments_scheduled_idx').on(table.scheduledAt),
  index('appointments_status_idx').on(table.status),
]);

// ============================================================
// STREAM 2: THE VAULT (Web Store — Products, Books, Merch)
// ============================================================

export const productCategories = pgTable('product_categories', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 255 }).notNull(),        // "Hair Care", "Books", "Merch"
  slug: varchar('slug', { length: 255 }).notNull().unique(),
  description: text('description'),
  sortOrder: integer('sort_order').default(0),
});

export const products = pgTable('products', {
  id: uuid('id').primaryKey().defaultRandom(),
  categoryId: uuid('category_id').references(() => productCategories.id),
  name: varchar('name', { length: 255 }).notNull(),
  slug: varchar('slug', { length: 255 }).notNull().unique(),
  description: text('description'),
  shortDescription: varchar('short_description', { length: 500 }),
  type: productTypeEnum('type').default('physical').notNull(),

  price: decimal('price', { precision: 10, scale: 2 }).notNull(),
  compareAtPrice: decimal('compare_at_price', { precision: 10, scale: 2 }),  // "was $XX" pricing
  costOfGoods: decimal('cost_of_goods', { precision: 10, scale: 2 }),        // for margin tracking

  // Stripe
  stripePriceId: varchar('stripe_price_id', { length: 255 }),
  stripeProductId: varchar('stripe_product_id', { length: 255 }),

  // Inventory (physical products)
  stockQuantity: integer('stock_quantity').default(0),
  trackInventory: boolean('track_inventory').default(true),

  // Digital products (ebooks)
  digitalFileUrl: text('digital_file_url'),                 // R2 URL for digital downloads

  // Media
  images: jsonb('images').default([]),                      // [{url, alt, isPrimary}]
  ingredients: jsonb('ingredients').default([]),             // for hair care products

  isActive: boolean('is_active').default(true).notNull(),
  isFeatured: boolean('is_featured').default(false),
  sortOrder: integer('sort_order').default(0),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => [
  index('products_slug_idx').on(table.slug),
  index('products_category_idx').on(table.categoryId),
  index('products_active_idx').on(table.isActive),
]);

export const orders = pgTable('orders', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id).notNull(),
  orderNumber: varchar('order_number', { length: 20 }).notNull().unique(),
  status: orderStatusEnum('status').default('pending').notNull(),

  subtotal: decimal('subtotal', { precision: 10, scale: 2 }).notNull(),
  discountAmount: decimal('discount_amount', { precision: 10, scale: 2 }).default('0'),
  taxAmount: decimal('tax_amount', { precision: 10, scale: 2 }).default('0'),
  shippingAmount: decimal('shipping_amount', { precision: 10, scale: 2 }).default('0'),
  total: decimal('total', { precision: 10, scale: 2 }).notNull(),

  // Stripe
  stripePaymentIntentId: varchar('stripe_payment_intent_id', { length: 255 }),
  stripeCheckoutSessionId: varchar('stripe_checkout_session_id', { length: 255 }),

  // Shipping
  shippingAddress: jsonb('shipping_address'),
  trackingNumber: varchar('tracking_number', { length: 255 }),

  // Cross-sell tracking: which appointment triggered this order?
  sourceAppointmentId: uuid('source_appointment_id').references(() => appointments.id),
  // Which referral code was used?
  referralCode: varchar('referral_code', { length: 20 }),
  // Which coupon?
  couponCode: varchar('coupon_code', { length: 50 }),

  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => [
  index('orders_user_idx').on(table.userId),
  index('orders_status_idx').on(table.status),
  index('orders_number_idx').on(table.orderNumber),
]);

export const orderItems = pgTable('order_items', {
  id: uuid('id').primaryKey().defaultRandom(),
  orderId: uuid('order_id').references(() => orders.id).notNull(),
  productId: uuid('product_id').references(() => products.id).notNull(),
  quantity: integer('quantity').notNull().default(1),
  unitPrice: decimal('unit_price', { precision: 10, scale: 2 }).notNull(),
  totalPrice: decimal('total_price', { precision: 10, scale: 2 }).notNull(),
});

// ============================================================
// STREAM 3: THE ACADEMY (Courses / LMS)
// ============================================================

export const courses = pgTable('courses', {
  id: uuid('id').primaryKey().defaultRandom(),
  title: varchar('title', { length: 255 }).notNull(),
  slug: varchar('slug', { length: 255 }).notNull().unique(),
  description: text('description'),
  shortDescription: varchar('short_description', { length: 500 }),
  thumbnailUrl: text('thumbnail_url'),

  price: decimal('price', { precision: 10, scale: 2 }).notNull(),
  stripePriceId: varchar('stripe_price_id', { length: 255 }),
  stripeProductId: varchar('stripe_product_id', { length: 255 }),

  // Structure
  totalModules: integer('total_modules').default(0),
  totalLessons: integer('total_lessons').default(0),
  estimatedHours: decimal('estimated_hours', { precision: 4, scale: 1 }),

  isPublished: boolean('is_published').default(false).notNull(),
  publishedAt: timestamp('published_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => [
  index('courses_slug_idx').on(table.slug),
]);

export const courseModules = pgTable('course_modules', {
  id: uuid('id').primaryKey().defaultRandom(),
  courseId: uuid('course_id').references(() => courses.id).notNull(),
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description'),
  sortOrder: integer('sort_order').default(0).notNull(),
  // Drip scheduling: available X days after enrollment
  dripDelayDays: integer('drip_delay_days').default(0),
});

export const lessons = pgTable('lessons', {
  id: uuid('id').primaryKey().defaultRandom(),
  moduleId: uuid('module_id').references(() => courseModules.id).notNull(),
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description'),
  contentType: varchar('content_type', { length: 20 }).notNull().default('video'),  // video, text, quiz
  videoUrl: text('video_url'),                              // Cloudflare Stream URL
  textContent: text('text_content'),                        // rich text for text lessons
  durationMinutes: integer('duration_minutes'),
  sortOrder: integer('sort_order').default(0).notNull(),
  isFree: boolean('is_free').default(false),                // free preview lessons

  // Audio narration (Eleven Labs TTS)
  audioNarrationUrl: text('audio_narration_url'),           // narrated audio file
  audioNarrationDurationSeconds: integer('audio_narration_duration_seconds'),
  hasVisualElements: boolean('has_visual_elements').default(false), // interactive visuals, slides
  hasTranscript: boolean('has_transcript').default(false),  // text transcript for a11y
});

export const enrollments = pgTable('enrollments', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id).notNull(),
  courseId: uuid('course_id').references(() => courses.id).notNull(),
  status: enrollmentStatusEnum('status').default('active').notNull(),

  stripePaymentIntentId: varchar('stripe_payment_intent_id', { length: 255 }),
  enrolledAt: timestamp('enrolled_at').defaultNow().notNull(),
  completedAt: timestamp('completed_at'),
  expiresAt: timestamp('expires_at'),

  // Progress
  progressPercent: integer('progress_percent').default(0),
  lastLessonId: uuid('last_lesson_id').references(() => lessons.id),
  lastAccessedAt: timestamp('last_accessed_at'),

  // Cross-sell: did a webinar drive this enrollment?
  sourceEventId: uuid('source_event_id').references(() => events.id),
}, (table) => [
  index('enrollments_user_idx').on(table.userId),
  index('enrollments_course_idx').on(table.courseId),
  uniqueIndex('enrollments_user_course_uniq').on(table.userId, table.courseId),
]);

export const lessonProgress = pgTable('lesson_progress', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id).notNull(),
  lessonId: uuid('lesson_id').references(() => lessons.id).notNull(),
  completed: boolean('completed').default(false).notNull(),
  completedAt: timestamp('completed_at'),
  watchTimeSeconds: integer('watch_time_seconds').default(0),
}, (table) => [
  uniqueIndex('lesson_progress_uniq').on(table.userId, table.lessonId),
]);

// ============================================================
// STREAM 4 & 5: THE STAGE + THE INNER CIRCLE (Events, Webinars, Consultations)
// ============================================================

export const events = pgTable('events', {
  id: uuid('id').primaryKey().defaultRandom(),
  title: varchar('title', { length: 255 }).notNull(),
  slug: varchar('slug', { length: 255 }).notNull().unique(),
  description: text('description'),
  type: eventTypeEnum('type').notNull(),                    // webinar, workshop, consultation
  status: eventStatusEnum('status').default('draft').notNull(),

  // Scheduling
  scheduledAt: timestamp('scheduled_at'),
  durationMinutes: integer('duration_minutes'),
  timezone: varchar('timezone', { length: 50 }).default('America/New_York'),

  // Meeting link (Telnyx RTC, Zoom, Google Meet, etc.)
  meetingUrl: text('meeting_url'),
  meetingId: varchar('meeting_id', { length: 255 }),
  telnyxRoomName: varchar('telnyx_room_name', { length: 255 }), // Telnyx RTC room
  telnyxRoomId: varchar('telnyx_room_id', { length: 255 }),

  // Pricing (null = free event)
  price: decimal('price', { precision: 10, scale: 2 }),
  stripePriceId: varchar('stripe_price_id', { length: 255 }),

  // Replay
  replayUrl: text('replay_url'),                            // Cloudflare Stream URL
  replayAvailable: boolean('replay_available').default(false),
  replayGated: boolean('replay_gated').default(true),       // requires enrollment or membership

  // Capacity
  maxAttendees: integer('max_attendees'),
  currentAttendees: integer('current_attendees').default(0),

  // For consultations: intake form
  intakeFormSchema: jsonb('intake_form_schema'),             // JSON schema for dynamic form

  thumbnailUrl: text('thumbnail_url'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => [
  index('events_slug_idx').on(table.slug),
  index('events_type_idx').on(table.type),
  index('events_scheduled_idx').on(table.scheduledAt),
]);

export const eventRegistrations = pgTable('event_registrations', {
  id: uuid('id').primaryKey().defaultRandom(),
  eventId: uuid('event_id').references(() => events.id).notNull(),
  userId: uuid('user_id').references(() => users.id).notNull(),

  stripePaymentIntentId: varchar('stripe_payment_intent_id', { length: 255 }),
  attended: boolean('attended').default(false),
  attendedAt: timestamp('attended_at'),

  // Consultation-specific: intake form responses
  intakeResponses: jsonb('intake_responses'),
  consultationNotes: text('consultation_notes'),            // barber's notes post-consultation

  // Reminder tracking
  reminderSentAt: timestamp('reminder_sent_at'),
  registeredAt: timestamp('registered_at').defaultNow().notNull(),
}, (table) => [
  index('event_reg_event_idx').on(table.eventId),
  index('event_reg_user_idx').on(table.userId),
  uniqueIndex('event_reg_uniq').on(table.eventId, table.userId),
]);

// ============================================================
// SYNERGY LAYER: Memberships, CRM, Email, Referrals
// ============================================================

export const membershipPlans = pgTable('membership_plans', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 255 }).notNull(),        // "VIP", "Inner Circle"
  tier: membershipTierEnum('tier').notNull(),
  description: text('description'),
  monthlyPrice: decimal('monthly_price', { precision: 10, scale: 2 }).notNull(),
  annualPrice: decimal('annual_price', { precision: 10, scale: 2 }),
  stripePriceIdMonthly: varchar('stripe_price_id_monthly', { length: 255 }),
  stripePriceIdAnnual: varchar('stripe_price_id_annual', { length: 255 }),
  stripeProductId: varchar('stripe_product_id', { length: 255 }),
  benefits: jsonb('benefits').default([]),                   // [{type, description, value}]
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const subscriptions = pgTable('subscriptions', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id).notNull(),
  planId: uuid('plan_id').references(() => membershipPlans.id).notNull(),
  status: subscriptionStatusEnum('status').default('active').notNull(),

  stripeSubscriptionId: varchar('stripe_subscription_id', { length: 255 }).unique(),
  currentPeriodStart: timestamp('current_period_start'),
  currentPeriodEnd: timestamp('current_period_end'),
  cancelledAt: timestamp('cancelled_at'),

  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => [
  index('subscriptions_user_idx').on(table.userId),
  index('subscriptions_stripe_idx').on(table.stripeSubscriptionId),
]);

// CRM: Activity log — tracks every customer interaction across all streams
export const activityLog = pgTable('activity_log', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id).notNull(),
  action: varchar('action', { length: 100 }).notNull(),     // "appointment.booked", "order.completed", "course.enrolled", "webinar.attended"
  resourceType: varchar('resource_type', { length: 50 }),    // "appointment", "order", "enrollment", "event"
  resourceId: uuid('resource_id'),
  metadata: jsonb('metadata').default({}),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => [
  index('activity_user_idx').on(table.userId),
  index('activity_action_idx').on(table.action),
  index('activity_created_idx').on(table.createdAt),
]);

// Email campaigns and nurture sequences
export const emailCampaigns = pgTable('email_campaigns', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 255 }).notNull(),
  subject: varchar('subject', { length: 500 }).notNull(),
  body: text('body').notNull(),                             // HTML email body
  status: emailStatusEnum('status').default('draft').notNull(),
  triggerAction: varchar('trigger_action', { length: 100 }), // auto-trigger on activity (e.g., "appointment.completed")
  delayMinutes: integer('delay_minutes').default(0),         // delay after trigger
  sentCount: integer('sent_count').default(0),
  openCount: integer('open_count').default(0),
  clickCount: integer('click_count').default(0),
  scheduledAt: timestamp('scheduled_at'),
  sentAt: timestamp('sent_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Coupons — work across store, courses, and events
export const coupons = pgTable('coupons', {
  id: uuid('id').primaryKey().defaultRandom(),
  code: varchar('code', { length: 50 }).notNull().unique(),
  description: text('description'),
  discountType: varchar('discount_type', { length: 20 }).notNull().default('percentage'), // percentage, fixed
  discountValue: decimal('discount_value', { precision: 10, scale: 2 }).notNull(),
  minPurchase: decimal('min_purchase', { precision: 10, scale: 2 }),
  maxUses: integer('max_uses'),
  currentUses: integer('current_uses').default(0),
  appliesToStream: varchar('applies_to_stream', { length: 50 }), // "store", "courses", "events", "all"
  expiresAt: timestamp('expires_at'),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => [
  index('coupons_code_idx').on(table.code),
]);

// ============================================================
// RELATIONS (Drizzle ORM relation definitions)
// ============================================================

export const usersRelations = relations(users, ({ many, one }) => ({
  appointments: many(appointments),
  orders: many(orders),
  enrollments: many(enrollments),
  eventRegistrations: many(eventRegistrations),
  subscriptions: many(subscriptions),
  activityLog: many(activityLog),
  referrer: one(users, { fields: [users.referredBy], references: [users.id] }),
}));

export const appointmentsRelations = relations(appointments, ({ one }) => ({
  user: one(users, { fields: [appointments.userId], references: [users.id] }),
  service: one(services, { fields: [appointments.serviceId], references: [services.id] }),
}));

export const ordersRelations = relations(orders, ({ one, many }) => ({
  user: one(users, { fields: [orders.userId], references: [users.id] }),
  items: many(orderItems),
  sourceAppointment: one(appointments, { fields: [orders.sourceAppointmentId], references: [appointments.id] }),
}));

export const orderItemsRelations = relations(orderItems, ({ one }) => ({
  order: one(orders, { fields: [orderItems.orderId], references: [orders.id] }),
  product: one(products, { fields: [orderItems.productId], references: [products.id] }),
}));

export const enrollmentsRelations = relations(enrollments, ({ one }) => ({
  user: one(users, { fields: [enrollments.userId], references: [users.id] }),
  course: one(courses, { fields: [enrollments.courseId], references: [courses.id] }),
  sourceEvent: one(events, { fields: [enrollments.sourceEventId], references: [events.id] }),
  lastLesson: one(lessons, { fields: [enrollments.lastLessonId], references: [lessons.id] }),
}));

export const coursesRelations = relations(courses, ({ many }) => ({
  modules: many(courseModules),
  enrollments: many(enrollments),
}));

export const courseModulesRelations = relations(courseModules, ({ one, many }) => ({
  course: one(courses, { fields: [courseModules.courseId], references: [courses.id] }),
  lessons: many(lessons),
}));

export const lessonsRelations = relations(lessons, ({ one }) => ({
  module: one(courseModules, { fields: [lessons.moduleId], references: [courseModules.id] }),
}));

export const eventsRelations = relations(events, ({ many }) => ({
  registrations: many(eventRegistrations),
}));

export const eventRegistrationsRelations = relations(eventRegistrations, ({ one }) => ({
  event: one(events, { fields: [eventRegistrations.eventId], references: [events.id] }),
  user: one(users, { fields: [eventRegistrations.userId], references: [users.id] }),
}));

export const subscriptionsRelations = relations(subscriptions, ({ one }) => ({
  user: one(users, { fields: [subscriptions.userId], references: [users.id] }),
  plan: one(membershipPlans, { fields: [subscriptions.planId], references: [membershipPlans.id] }),
}));
