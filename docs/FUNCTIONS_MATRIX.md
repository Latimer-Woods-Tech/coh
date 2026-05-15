# cypher-healing — Functions & Features Matrix
**Date**: 2026-05-14
**Repo**: Latimer-Woods-Tech/coh
**Status**: Initial matrix from static scan. CypherOfHealing.com healing/wellness platform on Cloudflare Worker + Neon. Routes: auth, academy, booking, events, store, subscriptions, show, communications, admin-*, seo, webhooks.
**Owner Convention**: human owner = @adrper79-dot, bot owner = @factory-cross-repo[bot]
**Weight scale**: 1 (infra/utility) · 2 (internal admin) · 3 (standard feature) · 4 (customer-visible UX) · 5 (payment/auth/data-loss path)

## Status legend (strict, single meaning per emoji)
- ✅ — automated test exists AND latest CI run on main is green AND no unresolved Sentry issues touching this row's endpoint
- ⚠️ — passes tests but has open Sentry issues OR known issues in production
- ❌ — automated test missing, OR CI failing, OR confirmed broken in production
- 🔍 — not yet verified (default for new rows; auto-set when Last Verified > 30 days)

## 1. Authentication & Authorization
| ID | Feature | Endpoint/Component | Manual Test | Automated Test | Status | Owner | Last Verified | Issue/PR | Weight | Notes |
|---|---|---|---|---|---|---|---|---|---|---|
| CH-AUTH-001 | Sign Up | `POST /api/auth/register` | 🔍 TODO | `test/` | 🔍 | @adrper79-dot | 2026-05-14 | — | 5 | JWT in HttpOnly cookie |
| CH-AUTH-002 | Sign In | `POST /api/auth/login` | 🔍 TODO | `test/` | 🔍 | @adrper79-dot | 2026-05-14 | — | 5 | |
| CH-AUTH-003 | Sign Out | `POST /api/auth/logout` | 🔍 TODO | — | ❌ | @adrper79-dot | 2026-05-14 | — | 5 | Deletes authToken cookie |
| CH-AUTH-004 | Password Reset Request | `POST /api/auth/forgot-password` | 🔍 TODO | — | ❌ | @adrper79-dot | 2026-05-14 | — | 5 | Sends reset email via utils/email |
| CH-AUTH-005 | Magic Link | `POST /api/auth/magic-link` | 🔍 TODO | — | ❌ | @adrper79-dot | 2026-05-14 | — | 5 | Passwordless auth |
| CH-AUTH-006 | Auth Middleware | `src/middleware/auth.ts` | 🔍 TODO | — | ❌ | @adrper79-dot | 2026-05-14 | — | 5 | Cookie + Bearer fallback; adminOnly role check |

## 2. Academy (Courses & Learning)
| ID | Feature | Endpoint/Component | Manual Test | Automated Test | Status | Owner | Last Verified | Issue/PR | Weight | Notes |
|---|---|---|---|---|---|---|---|---|---|---|
| CH-ACAD-001 | List Courses | `GET /api/academy/courses` | 🔍 TODO | — | ❌ | @adrper79-dot | 2026-05-14 | — | 4 | Public; paginated |
| CH-ACAD-002 | Get Course | `GET /api/academy/courses/:id` | 🔍 TODO | — | ❌ | @adrper79-dot | 2026-05-14 | — | 4 | |
| CH-ACAD-003 | Enroll in Course | `POST /api/academy/enroll` | 🔍 TODO | — | ❌ | @adrper79-dot | 2026-05-14 | — | 5 | Stripe checkout integration |
| CH-ACAD-004 | Lesson Progress | `POST /api/academy/progress` | 🔍 TODO | — | ❌ | @adrper79-dot | 2026-05-14 | — | 4 | Tracks completion per lesson |
| CH-ACAD-005 | Course Modules / Lessons | `GET /api/academy/courses/:id/modules` | 🔍 TODO | — | ❌ | @adrper79-dot | 2026-05-14 | — | 4 | |

## 3. Booking & Appointments
| ID | Feature | Endpoint/Component | Manual Test | Automated Test | Status | Owner | Last Verified | Issue/PR | Weight | Notes |
|---|---|---|---|---|---|---|---|---|---|---|
| CH-BOOK-001 | List Services | `GET /api/booking/services` | 🔍 TODO | — | ❌ | @adrper79-dot | 2026-05-14 | — | 4 | Public |
| CH-BOOK-002 | Book Appointment | `POST /api/booking` | 🔍 TODO | — | ❌ | @adrper79-dot | 2026-05-14 | — | 5 | Stripe checkout for paid services |
| CH-BOOK-003 | Availability Slots | `GET /api/booking/availability` | 🔍 TODO | — | ❌ | @adrper79-dot | 2026-05-14 | — | 4 | |
| CH-BOOK-004 | Cancel Appointment | `DELETE /api/booking/:id` | 🔍 TODO | — | ❌ | @adrper79-dot | 2026-05-14 | — | 5 | |
| CH-BOOK-005 | Appointment Reminder Email | `utils/email.ts appointmentReminderEmail` | 🔍 TODO | — | ❌ | @adrper79-dot | 2026-05-14 | — | 3 | |

## 4. Events
| ID | Feature | Endpoint/Component | Manual Test | Automated Test | Status | Owner | Last Verified | Issue/PR | Weight | Notes |
|---|---|---|---|---|---|---|---|---|---|---|
| CH-EVENT-001 | List Events | `GET /api/events` | 🔍 TODO | — | ❌ | @adrper79-dot | 2026-05-14 | — | 4 | Public; upcoming filter |
| CH-EVENT-002 | Get Event | `GET /api/events/:id` | 🔍 TODO | — | ❌ | @adrper79-dot | 2026-05-14 | — | 4 | |
| CH-EVENT-003 | Register for Event | `POST /api/events/:id/register` | 🔍 TODO | — | ❌ | @adrper79-dot | 2026-05-14 | — | 5 | Stripe for paid events; intake responses |
| CH-EVENT-004 | Event Registration Email | `utils/email.ts eventRegistrationEmail` | 🔍 TODO | — | ❌ | @adrper79-dot | 2026-05-14 | — | 3 | |

## 5. Store / E-commerce
| ID | Feature | Endpoint/Component | Manual Test | Automated Test | Status | Owner | Last Verified | Issue/PR | Weight | Notes |
|---|---|---|---|---|---|---|---|---|---|---|
| CH-STORE-001 | List Products | `GET /api/store/products` | 🔍 TODO | — | ❌ | @adrper79-dot | 2026-05-14 | — | 4 | Public; category filter |
| CH-STORE-002 | Buy Product | `POST /api/store/orders` | 🔍 TODO | — | ❌ | @adrper79-dot | 2026-05-14 | — | 5 | Stripe checkout; coupon support |
| CH-STORE-003 | Order History | `GET /api/store/orders` | 🔍 TODO | — | ❌ | @adrper79-dot | 2026-05-14 | — | 4 | Auth required |
| CH-STORE-004 | Order Confirmation Email | `utils/email.ts orderConfirmationEmail` | 🔍 TODO | — | ❌ | @adrper79-dot | 2026-05-14 | — | 3 | |

## 6. Subscriptions & Membership
| ID | Feature | Endpoint/Component | Manual Test | Automated Test | Status | Owner | Last Verified | Issue/PR | Weight | Notes |
|---|---|---|---|---|---|---|---|---|---|---|
| CH-SUB-001 | List Plans | `GET /api/subscriptions/plans` | 🔍 TODO | — | ❌ | @adrper79-dot | 2026-05-14 | — | 4 | Public |
| CH-SUB-002 | Subscribe | `POST /api/subscriptions` | 🔍 TODO | — | ❌ | @adrper79-dot | 2026-05-14 | — | 5 | Stripe subscription |
| CH-SUB-003 | My Subscription | `GET /api/subscriptions/me` | 🔍 TODO | — | ❌ | @adrper79-dot | 2026-05-14 | — | 4 | Auth required |
| CH-SUB-004 | Cancel Subscription | `DELETE /api/subscriptions/:id` | 🔍 TODO | — | ❌ | @adrper79-dot | 2026-05-14 | — | 5 | |

## 7. Show / Episodes
| ID | Feature | Endpoint/Component | Manual Test | Automated Test | Status | Owner | Last Verified | Issue/PR | Weight | Notes |
|---|---|---|---|---|---|---|---|---|---|---|
| CH-SHOW-001 | List Episodes | `GET /api/show` | 🔍 TODO | — | ❌ | @adrper79-dot | 2026-05-14 | — | 4 | Public; paginated |
| CH-SHOW-002 | Get Episode | `GET /api/show/:id` | 🔍 TODO | — | ❌ | @adrper79-dot | 2026-05-14 | — | 4 | |
| CH-SHOW-003 | Admin: List/Create/Update Episode | Admin routes in show.ts | 🔍 TODO | — | ❌ | @adrper79-dot | 2026-05-14 | — | 2 | adminOnly |

## 8. Communications
| ID | Feature | Endpoint/Component | Manual Test | Automated Test | Status | Owner | Last Verified | Issue/PR | Weight | Notes |
|---|---|---|---|---|---|---|---|---|---|---|
| CH-COMM-001 | Send Appointment Reminders (SMS) | `POST /api/communications/appointments/send-reminders` | 🔍 TODO | — | ❌ | @adrper79-dot | 2026-05-14 | — | 3 | Telnyx SMS; adminOnly |
| CH-COMM-002 | Send Event Reminders (SMS) | `POST /api/communications/events/send-reminders` | 🔍 TODO | — | ❌ | @adrper79-dot | 2026-05-14 | — | 3 | Telnyx SMS; adminOnly |
| CH-COMM-003 | WebRTC Room Create | `utils/telnyx.ts createRTCRoom` | 🔍 TODO | — | ❌ | @adrper79-dot | 2026-05-14 | — | 3 | |

## 9. Admin
| ID | Feature | Endpoint/Component | Manual Test | Automated Test | Status | Owner | Last Verified | Issue/PR | Weight | Notes |
|---|---|---|---|---|---|---|---|---|---|---|
| CH-ADMIN-001 | Admin: Manage Courses | `src/routes/admin-course.ts` | 🔍 TODO | — | ❌ | @adrper79-dot | 2026-05-14 | — | 2 | CRUD; adminOnly |
| CH-ADMIN-002 | Admin: Manage Bookings | `src/routes/admin-booking.ts` | 🔍 TODO | — | ❌ | @adrper79-dot | 2026-05-14 | — | 2 | |
| CH-ADMIN-003 | Admin: Manage Events | `src/routes/admin-events.ts` | 🔍 TODO | — | ❌ | @adrper79-dot | 2026-05-14 | — | 2 | |
| CH-ADMIN-004 | Admin: Manage Store | `src/routes/admin-store.ts` | 🔍 TODO | — | ❌ | @adrper79-dot | 2026-05-14 | — | 2 | |
| CH-ADMIN-005 | Admin: Audio Generation (ElevenLabs) | `src/routes/admin-audio.ts` | 🔍 TODO | — | ❌ | @adrper79-dot | 2026-05-14 | — | 2 | Batch lesson narration |
| CH-ADMIN-006 | Admin: DB Migrations | `POST /api/admin/migrate` | 🔍 TODO | — | ❌ | @adrper79-dot | 2026-05-14 | — | 1 | Idempotent; auth-gated after first user |
| CH-ADMIN-007 | Admin: Seed Data | `POST /api/admin/seed` | 🔍 TODO | — | ❌ | @adrper79-dot | 2026-05-14 | — | 1 | Dev-only; should be gated in prod |

## 10. Platform / Health & SEO
| ID | Feature | Endpoint/Component | Manual Test | Automated Test | Status | Owner | Last Verified | Issue/PR | Weight | Notes |
|---|---|---|---|---|---|---|---|---|---|---|
| CH-PLAT-001 | Stripe Webhook Handler | `src/routes/webhooks.ts` | 🔍 TODO | — | ❌ | @adrper79-dot | 2026-05-14 | — | 5 | Handles checkout, subscription, booking, event, enrollment, store events; idempotency via KV |
| CH-PLAT-002 | Robots.txt | `GET /robots.txt` | 🔍 TODO | — | 🔍 | @adrper79-dot | 2026-05-14 | — | 1 | |
| CH-PLAT-003 | Sitemap | `GET /sitemap.xml` | 🔍 TODO | — | ❌ | @adrper79-dot | 2026-05-14 | — | 1 | Dynamic; queries courses, products, events |
| CH-PLAT-004 | Rate Limiting | `src/middleware/rate-limit.ts` | 🔍 TODO | — | 🔍 | @adrper79-dot | 2026-05-14 | — | 1 | CF KV-backed; per-namespace config |
