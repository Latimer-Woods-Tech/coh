# CypherOfHealing.com — Engineering Roadmap

> **Canonical plan** for taking CypherOfHealing from a well-architected codebase to a world-class live platform.
> Supersedes `IMPROVEMENT-ROADMAP.md` (stale since 2026-04-04).
> All agent work follows `.github/AGENT_PROTOCOL.md` without exception.

**Assessed:** 2026-05-07  
**Assessed by:** Full codebase audit (schema, routes, middleware, frontend, CI/CD)  
**Current state:** Production-grade architecture, not yet deployed. Hyperdrive and KV unconfigured. Six revenue-path features incomplete. Zero test coverage. Zero observability.

---

## What the platform is

A barber-led restoration brand. Five streams:

| ID | Name | Stream | Revenue model |
|----|------|--------|---------------|
| I | The Chair | `src/routes/booking.ts` | Per-session deposits + balance |
| II | The Vault | `src/routes/store.ts` | Physical + digital product sales |
| III | The Academy | `src/routes/academy.ts` | Course enrollment fees |
| IV | The Stage | `src/routes/events.ts` | Event registration fees |
| V | The Inner Circle | (subscriptions — not yet shipped) | Recurring membership |

Cross-stream data flows through `activity_log` (append-only). Every Stripe payment across all streams maps to one `stripeCustomerId` on `users`.

---

## Hard rules for all agents

1. Follow `.github/AGENT_PROTOCOL.md` completely — claim issue, branch `agent/<name>/<issue#>`, open PR, never merge
2. Zero TypeScript errors (`npm run typecheck` must pass)
3. No `process.env` — use `c.env.VAR` (Worker) or `import.meta.env.VAR` (Vite)
4. No Node.js built-ins in Worker code — Web APIs only
5. Every new route gets Zod input validation via `@hono/zod-validator`
6. Every new cross-stream state change writes to `activity_log` before downstream effects
7. Stripe webhook handlers verify signature before touching anything
8. No raw `fetch` without explicit error handling
9. Secrets via `wrangler secret put` — never in source or wrangler config vars

---

## Phase 0 — Human-only prerequisites (unblocks everything)

These cannot be done by agents. A human must complete all of these before any agent deploys or tests against production infrastructure.

| # | Action | Command / Location |
|---|--------|-------------------|
| 0.1 | Create Neon database (if not exists) | Neon dashboard |
| 0.2 | Create Hyperdrive binding | `wrangler hyperdrive create cypher-healing-db --connection-string="$NEON_URL"` → add ID to wrangler.jsonc |
| 0.3 | Create KV namespace | `wrangler kv:namespace create SESSIONS` → add ID to wrangler.jsonc |
| 0.4 | Set all Worker secrets | `wrangler secret put STRIPE_SECRET_KEY` (and all others in wrangler.jsonc comments) |
| 0.5 | Set GitHub secrets | `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`, `VITE_STRIPE_PUBLIC_KEY` |
| 0.6 | Create Cloudflare Pages project | `wrangler pages project create coh` |
| 0.7 | Wire custom domains | `cypherofhealing.com` → Pages; `api.cypherofhealing.com` → Worker |
| 0.8 | Update deploy.yml API URL | Change `cypher-of-healing-api.workers.dev` to `api.cypherofhealing.com` |
| 0.9 | Run initial migration | `npx drizzle-kit migrate` against Neon |
| 0.10 | Verify health endpoint | `curl https://coh.adrper79.workers.dev/health` → 200 |

**Unblocks:** Wave 1, Wave 2, Wave 3 (agents can write code against local dev without 0.x complete, but cannot validate against production)

---

## Phase 1 — Foundation fixes (Wave 1 — all parallelizable)

These are small, isolated, zero-dependency changes. Each maps to one GitHub issue and one agent.

### 1.1 Security: production guard on admin-seed route

**File:** `src/routes/admin-seed.ts`  
**Change:** Add environment check at route entry — return 403 if `c.env.ENVIRONMENT !== 'development'`  
**Why:** The seed route wipes and re-seeds the database. It is currently live in production with no guard.  
**AC:** `curl -X POST https://.../api/admin/seed` returns 403 in any non-development environment. TypeScript passes.

### 1.2 Security: rate limiter must use CF-Connecting-IP

**File:** `src/middleware/rate-limit.ts`  
**Change:** Replace any `x-forwarded-for` reads with `c.req.header('cf-connecting-ip') ?? c.req.header('x-forwarded-for') ?? 'unknown'`  
**Why:** X-Forwarded-For is attacker-controlled. CF-Connecting-IP is set by Cloudflare's edge and cannot be spoofed.  
**AC:** Rate limiting header in test is sourced from CF-Connecting-IP. TypeScript passes.

### 1.3 UX: pagination on all list endpoints

**Files:** `src/routes/booking.ts`, `src/routes/store.ts`, `src/routes/academy.ts`, `src/routes/events.ts`  
**Change:** Add `page` (default 1) and `limit` (default 20, max 100) query params to every list endpoint. Return `{ data, total, page, limit, pages }` envelope. Use Drizzle `.limit().offset()`.  
**Affected endpoints:** `GET /api/booking/services`, `GET /api/booking/appointments`, `GET /api/store/products`, `GET /api/store/orders`, `GET /api/academy/courses`, `GET /api/academy/enrollments`, `GET /api/events`  
**Why:** List endpoints currently return unbounded rows. This silently fails at scale and is a security concern.  
**AC:** All seven endpoints accept `?page=1&limit=20`. Response includes `total` and `pages`. TypeScript passes.

### 1.4 Analytics: PostHog initialization

**File:** `web/index.html`  
**Change:** Add PostHog snippet before `</head>` using `VITE_POSTHOG_KEY` env var. Add `VITE_POSTHOG_KEY` to `web/.env.example`. Wire through deploy.yml as a build env var.  
**Why:** `lib/analytics.ts` calls `window.posthog?.capture()` but PostHog is never initialized. Every `trackEvent()` call fires into the void.  
**AC:** In dev, `window.posthog` is defined. `trackEvent('test')` calls `posthog.capture`. TypeScript passes.

### 1.5 Discoverability: OG/Twitter meta tags + robots.txt + sitemap skeleton

**Files:** `web/index.html`, new `src/routes/seo.ts`, mount in `src/index.ts`  
**Change:**
- Add static OG/Twitter meta to `web/index.html` (site-level defaults: title, description, image, url)
- Add `GET /robots.txt` and `GET /sitemap.xml` routes to the Worker. Sitemap queries published courses, active products, and upcoming events and renders XML.
- Mount `/robots.txt` and `/sitemap.xml` in `src/index.ts` before auth middleware

**Why:** Every share from this platform shows a blank preview. SEO is completely blind.  
**AC:** `curl https://api.cypherofhealing.com/sitemap.xml` returns valid XML with at least the home URL. `curl .../robots.txt` returns correct headers. TypeScript passes.

---

## Phase 2 — Critical user paths (Wave 2 — all parallelizable, no overlap)

These complete missing flows that directly affect conversion and retention.

### 2.1 Auth: password reset flow

**Files:** `src/routes/auth.ts`, `src/utils/email.ts`  
**New endpoints:**
- `POST /api/auth/forgot-password` — accepts `email`, generates a signed reset token (KV TTL: 3600s), sends reset email via Resend
- `POST /api/auth/reset-password` — accepts `token` + `newPassword`, verifies token from KV, updates `passwordHash`, deletes token from KV

**Email template:** Add `passwordResetEmail(resetUrl: string): EmailPayload` to `src/utils/email.ts` using the existing brand HTML pattern (dark brown + gold).  
**Frontend:** Add `ForgotPasswordPage.tsx` and `ResetPasswordPage.tsx` to `web/src/pages/`. Add routes to `web/src/App.tsx`. Add "Forgot password?" link to `LoginPage.tsx`.  
**Why:** A user who forgets their password has no recovery path on a platform selling $200+ courses.  
**AC:** Full round-trip: POST forgot-password → email received → POST reset-password with token → login succeeds with new password. TypeScript passes.

### 2.2 Store: coupon validation

**Files:** `src/routes/store.ts`, `src/routes/admin-store.ts` (new)  
**Change:**
- Add `POST /api/store/validate-coupon` — accepts `{ code, cartTotal }`, queries `coupons` table (active, not expired, under usage limit), returns discount amount and type
- In `POST /api/store/orders` — if `couponCode` present, validate and apply discount before Stripe line items. Increment `usageCount` on coupon after successful payment (in webhook handler).
- Add `GET/POST/PUT/DELETE /api/admin/coupons` for coupon CRUD (admin-only)

**Why:** The `coupons` table, the `couponCode` field on orders, and the frontend coupon input exist. The validation logic does not.  
**AC:** A valid coupon reduces order total. An expired or maxed coupon returns a clear error. TypeScript passes.

### 2.3 Stripe: refund and payment failure webhook handlers

**File:** `src/routes/webhooks.ts`  
**New event handlers:**
- `payment_intent.payment_failed` — update appointment `status → cancelled` or order `status → cancelled`, log to `activity_log`, send failure email
- `charge.refunded` — update order `status → refunded` or appointment `totalPaid` to reflect refund amount, update enrollment `status → refunded` if course order refunded, log to `activity_log`, send refund confirmation email

**Why:** Stripe fires these events. The app ignores them. Order and appointment status never updates on failure or refund.  
**AC:** Simulated Stripe webhook events correctly update DB state. Idempotency check covers these event types. TypeScript passes.

### 2.4 Admin: booking management routes

**New file:** `src/routes/admin-booking.ts`  
**Mount in:** `src/index.ts` at `/api/admin`  
**Endpoints:**
- `GET /api/admin/services` — all services (active + inactive)
- `POST /api/admin/services` — create service (name, price, deposit, duration, category)
- `PUT /api/admin/services/:id` — update service
- `DELETE /api/admin/services/:id` — soft-delete (set `isActive = false`)
- `GET /api/admin/availability` — all availability slots
- `POST /api/admin/availability` — create slot (dayOfWeek, startTime, endTime)
- `DELETE /api/admin/availability/:id` — remove slot
- `GET /api/admin/appointments` — appointments list with filters (`?status=`, `?date=`, `?userId=`, pagination)
- `PATCH /api/admin/appointments/:id` — update appointment status (confirm, cancel, complete, no-show), add notes

**AC:** All endpoints return correct data with admin auth. Unauthorized requests return 401. TypeScript passes.

### 2.5 Admin: store management routes

**New file:** `src/routes/admin-store.ts`  
**Mount in:** `src/index.ts` at `/api/admin`  
**Endpoints:**
- `GET/POST /api/admin/products` — list all products (active + inactive), create product
- `PUT/DELETE /api/admin/products/:id` — update, soft-delete
- `GET/POST /api/admin/product-categories` — category management
- `GET /api/admin/orders` — orders with filters (`?status=`, `?userId=`, pagination)
- `PATCH /api/admin/orders/:id/ship` — mark shipped with tracking number
- `POST /api/admin/orders/:id/refund` — initiate Stripe refund via API

**AC:** Full CRUD verified. Order status updates correctly. TypeScript passes.

### 2.6 Admin: events and users management routes

**New file:** `src/routes/admin-events.ts`  
**New file:** `src/routes/admin-users.ts`  
**Mount in:** `src/index.ts` at `/api/admin`

**Events endpoints:**
- `GET/POST /api/admin/events` — list all events (all statuses), create event
- `PUT/PATCH /api/admin/events/:id` — update event, change status (draft → scheduled → live → completed)
- `GET /api/admin/events/:id/registrations` — registration list with pagination
- `POST /api/admin/events/:id/registrations/:regId/attend` — mark attendance

**Users endpoints:**
- `GET /api/admin/users` — paginated user list with search (`?q=email_or_name`)
- `GET /api/admin/users/:id` — user detail with cross-stream `activity_log` joined
- `PATCH /api/admin/users/:id/membership` — change membershipTier (admin override)
- `POST /api/admin/users/:id/enroll` — grant course access without payment

**AC:** All endpoints admin-gated. User activity log returns correct cross-stream events. TypeScript passes.

---

## Phase 3 — Subscriptions and retention (Wave 3 — sequential within, parallelizable across)

### 3.1 Stripe: subscription billing (VIP + Inner Circle)

**New file:** `src/routes/subscriptions.ts`  
**Mount in:** `src/index.ts`  
**Schema:** `membershipPlans` and `subscriptions` tables exist — use them.

**Endpoints:**
- `GET /api/subscriptions/plans` — list active membership plans with Stripe price IDs
- `POST /api/subscriptions` — create Stripe Checkout Session for subscription (mode: 'subscription'), return `sessionUrl`
- `GET /api/subscriptions/me` — current user's subscription status
- `DELETE /api/subscriptions/me` — cancel at period end (Stripe `cancel_at_period_end: true`)

**Webhook handlers to add in `webhooks.ts`:**
- `customer.subscription.created` → insert `subscriptions` row, update `users.membershipTier`
- `customer.subscription.updated` → update `subscriptions` row and tier
- `customer.subscription.deleted` → set `subscriptions.status = cancelled`, downgrade `users.membershipTier = 'free'`
- `invoice.payment_failed` → set `subscriptions.status = 'past_due'`, send dunning email

**Content gating:** Update `src/routes/academy.ts` lesson gating — Inner Circle members get access to all courses without individual enrollment.  
**AC:** Full subscription lifecycle works. Tier updates correctly on subscription state changes. TypeScript passes.

### 3.2 Telnyx: SMS appointment reminders (Cron trigger)

**New file:** `src/cron/sms-reminders.ts`  
**Wire in:** `wrangler.jsonc` — add `crons: [{ cron: "0 */6 * * *" }]`  
**Exports:** Add `scheduled` handler to `src/index.ts`

**Logic:**
1. Query appointments where `scheduledAt` is between `now + 23h` and `now + 25h`, `status = 'confirmed'`
2. Join users where `smsOptIn = true` and `phone` is not null
3. For each: call Telnyx `POST /v2/messages` with SMS content (service name, date, time, address or virtual link)
4. Insert `activity_log` row: `action: 'sms.reminder.sent'`
5. Handle Telnyx errors without crashing — log failures to Sentry (or console if Sentry not yet configured)

**AC:** Cron runs every 6 hours. Appointments in the 23-25h window with SMS-opted-in users receive messages. No duplicate sends (idempotency via `activity_log` check). TypeScript passes.

### 3.3 Auth: magic link flow

**Files:** `src/routes/auth.ts`, `src/utils/email.ts`  
**New endpoints:**
- `POST /api/auth/magic-link` — accepts `email`, generates signed token (KV TTL: 900s), sends magic link email
- `GET /api/auth/magic-link/verify?token=...` — validates token, upserts user (creates if not exists), returns JWT in HttpOnly cookie, redirects to `/` or `?next=` param

**Email template:** Add `magicLinkEmail(magicUrl: string): EmailPayload` using brand HTML pattern.  
**Frontend:** Add "Sign in with email link" option to `LoginPage.tsx`.  
**Why:** Lowers signup friction. `passwordHash` is already nullable in the schema for this use case.  
**AC:** Round-trip works. Token expires correctly. Redirects to correct page. Existing password users unaffected. TypeScript passes.

---

## Phase 4 — Test coverage (Wave 4 — write alongside Waves 1-3, mandatory before any PR merges to main)

**Install in root `package.json`:** `vitest`, `@cloudflare/vitest-pool-workers`  
**Config file:** `vitest.config.ts` at repo root  
**Test directory:** `src/__tests__/`

### 4.1 Auth utilities

**File:** `src/__tests__/utils/auth.test.ts`  
**Cover:**
- `hashPassword` + `verifyPassword` round-trip
- `verifyPassword` with legacy SHA-256 hash (upgrade path)
- `createJwt` + `verifyJwt` round-trip
- `verifyJwt` throws on expired token
- `verifyJwt` throws on tampered signature
- Timing-safe comparison does not short-circuit

**Target:** 100% line coverage

### 4.2 Booking: double-booking prevention

**File:** `src/__tests__/routes/booking.test.ts`  
**Cover:**
- Available slots endpoint returns correct 30-min windows given availability + existing appointments
- Advisory lock prevents simultaneous bookings for the same slot (concurrent request simulation)
- Booking with no available slot returns 409
- Cancellation makes slot available again

**Target:** 90% line coverage

### 4.3 Stripe webhook idempotency

**File:** `src/__tests__/routes/webhooks.test.ts`  
**Cover:**
- Duplicate event ID returns `{ received: true, duplicate: true }` without DB mutation
- Missing or invalid signature returns 400
- `checkout.session.completed` for order → correct DB state
- `checkout.session.completed` for appointment → status becomes `confirmed`
- `checkout.session.completed` for enrollment → enrollment created
- `payment_intent.payment_failed` → correct status update
- `charge.refunded` → correct status update

**Target:** 90% line coverage

### 4.4 Rate limiter

**File:** `src/__tests__/middleware/rate-limit.test.ts`  
**Cover:**
- Requests under limit pass through
- Request at limit returns 429 with correct headers
- Window expiry resets counter
- CF-Connecting-IP used as key

**Target:** 100% line coverage

### 4.5 Quality gate

Add to `package.json` scripts:
```json
"test": "vitest run",
"test:coverage": "vitest run --coverage",
"test:watch": "vitest"
```

CI: Add test step to `deploy.yml` before the deploy steps — deploy only runs if tests pass.

---

## Phase 5 — Observability (Wave 5 — parallelizable with Wave 4)

### 5.1 Sentry error tracking

**File:** `src/index.ts`, `src/middleware/errors.ts`  
**Install:** `@sentry/cloudflare` (or manual Sentry fetch if SDK too large)  
**Change:**
- Initialize Sentry in `src/index.ts` using `c.env.SENTRY_DSN`
- In the global error handler (`src/middleware/errors.ts`), capture unexpected errors to Sentry with request ID and user context
- Do not capture `ApiError` instances with 4xx codes — those are expected user errors
- Add `SENTRY_DSN` to `src/types/env.ts` and `wrangler.jsonc` secrets list

**AC:** Unhandled 500 errors appear in Sentry with full context. 400-level errors are not captured. TypeScript passes.

### 5.2 Structured logging

**File:** `src/index.ts`, all route files  
**Change:** Replace bare `console.log` with a structured logger: `log(level, message, context)` that emits JSON. Levels: `info`, `warn`, `error`. Context always includes `requestId`, `method`, `path`. Errors include `stack` in non-production.  
**AC:** Every request produces a structured JSON log line. TypeScript passes.

---

## Phase 6 — The Show (Wave 6 — after Phase 0 infrastructure, independent of Waves 1-5)

### 6.1 Episodes table and API

**File:** `src/db/schema.ts` (new table), `src/routes/show.ts` (new file), `src/index.ts` (mount)  
**New table:** `episodes` — `id`, `title`, `slug`, `guestName`, `description`, `cipherTakeaway`, `streamUid` (Cloudflare Stream), `transcript`, `thumbnailUrl`, `publishedAt`, `isFree`, `createdAt`  
**Endpoints:**
- `GET /api/show/episodes` — list published episodes, paginated
- `GET /api/show/episodes/:slug` — episode detail. `streamUid` only returned if `isFree = true` OR user has active enrollment or Inner Circle membership. Transcript always returned (accessibility + SEO).
- `GET/POST/PUT/DELETE /api/admin/episodes` — admin CRUD for episodes

**Migration:** Generate with `drizzle-kit generate`  
**AC:** Public episodes visible. Gated episodes return metadata but not `streamUid` for unauthenticated users. TypeScript passes.

### 6.2 Show frontend page

**File:** `web/src/pages/ShowPage.tsx`  
**Change:** Implement the page properly — episode list grid, individual episode view with Cloudflare Stream iframe embed, cipher takeaway block, CTA into appropriate stream based on episode content.  
**AC:** Renders correctly with real episode data. Gated content shows upgrade CTA. TypeScript passes.

---

## Dependency map

```
Phase 0 (human) ──→ all Phases can deploy/verify against production
Phase 1 ──→ Phase 2 (some), Phase 4 (any order)
Phase 2 ──→ Phase 3 (subscriptions depend on clean store/auth paths)
Phase 4 (tests) ──→ CI gate for all merges
Phase 5 ──→ independent, run concurrent with Phase 4
Phase 6 ──→ independent after Phase 0
```

---

## Agent wave schedule

| Wave | Issues | Parallelizable | Depends on |
|------|--------|----------------|------------|
| Wave 1 | 1.1, 1.2, 1.3, 1.4, 1.5 | Yes — all isolated | Nothing (local dev works) |
| Wave 2 | 2.1, 2.2, 2.3, 2.4, 2.5, 2.6 | Yes — different files | Phase 0 for production deploy |
| Wave 3 | 3.1, 3.2, 3.3 | Yes — different files | Wave 1 merged |
| Wave 4 | 4.1, 4.2, 4.3, 4.4, 4.5 | Yes — test files only | Wave 1 merged (test against real code) |
| Wave 5 | 5.1, 5.2 | Yes — observability | Wave 1 merged |
| Wave 6 | 6.1, 6.2 | Yes — new files | Phase 0 complete |

Integration branches per wave: `integration/wave-1`, `integration/wave-2`, etc. Each agent's PR targets the wave integration branch. Human or coordinator merges integration to main after all PRs in the wave are green and verified.

---

## Content checklist (human, parallel with Phase 1)

Agents cannot write this. A human must create real records via Drizzle Studio, the admin API, or a seed script:

- [ ] Services in The Chair (min 3: cut types, pricing, deposit amounts, durations)
- [ ] Availability slots (days + hours the barber works)
- [ ] Products in The Vault (min 2: restoration oil + book)
- [ ] Course structure for "The Cipher of Healing" (6 modules, lesson titles and descriptions)
- [ ] First event in The Stage (upcoming webinar with real date, capacity, price)
- [ ] Hero images and craft photos uploaded to R2 `cypher-healing-media` bucket
- [ ] PostHog project created, API key available for deploy.yml

---

## Acceptance criteria for "world-class"

A release is world-class when all of the following are true:

1. `curl https://cypherofhealing.com/` returns 200 with correct `<title>` and OG meta
2. `curl https://api.cypherofhealing.com/health` returns 200
3. Full booking round-trip works on mobile: select service → pick slot → pay deposit → confirmation email received → SMS reminder fires 24h before
4. Full course enrollment works: view course → enroll → pay → access lessons → progress tracked
5. Admin can create a new service without a code deploy
6. A refunded Stripe payment correctly updates order/appointment status within 60 seconds
7. `npm run typecheck` exits 0
8. `npm run test:coverage` passes with ≥90% line coverage on `src/utils/auth.ts`, `src/routes/booking.ts`, `src/routes/webhooks.ts`
9. Sentry receives at least one test event from production
10. Sitemap returns XML listing at least one course and one product
