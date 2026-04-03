# CypherOfHealing.com — Platform API

> "The outer is a reflection of the inner." — Classic Man frequency

Five-stream personal brand platform: Booking, Store, Academy, Webinars, Consultations.  
Built on **Cloudflare Workers + Hono + Drizzle ORM + Neon Postgres + Stripe**.

## Quick Start (GitHub Codespace)

```bash
# 1. Install dependencies
npm install

# 2. Copy env and fill in your Neon connection string
cp .env.example .env
# Edit .env with your DATABASE_URL from Neon dashboard

# 3. Generate database migrations
npm run db:generate

# 4. Apply migrations to Neon
npm run db:migrate

# 5. Login to Cloudflare
npx wrangler login

# 6. Create Hyperdrive config (connects Workers to Neon)
npx wrangler hyperdrive create cypher-healing-db \
  --connection-string="postgres://USER:PASS@HOST:5432/neondb"
# Copy the ID into wrangler.jsonc → hyperdrive[0].id

# 7. Create KV namespace for sessions
npx wrangler kv namespace create SESSIONS
# Copy the ID into wrangler.jsonc → kv_namespaces[0].id

# 8. Create R2 bucket for media
npx wrangler r2 bucket create cypher-healing-media

# 9. Set secrets
npx wrangler secret put STRIPE_SECRET_KEY
npx wrangler secret put STRIPE_WEBHOOK_SECRET
npx wrangler secret put JWT_SECRET
npx wrangler secret put RESEND_API_KEY

# 10. Dev server
npm run dev

# 11. Deploy
npm run deploy
```

## Project Structure

```
src/
├── index.ts              # Hono app entry — mounts all routes
├── db/
│   ├── schema.ts         # Drizzle schema — 20+ tables, all 5 streams
│   └── index.ts          # Database connection via Hyperdrive
├── middleware/
│   └── auth.ts           # JWT auth, optional auth, admin guard
├── routes/
│   ├── booking.ts        # Stream 1: The Chair (appointments)
│   ├── store.ts          # Stream 2: The Vault (products, orders)
│   ├── academy.ts        # Stream 3: The Academy (courses, LMS)
│   └── events.ts         # Stream 4+5: The Stage + Inner Circle
├── types/
│   └── env.ts            # Cloudflare bindings type definitions
└── lib/                  # Shared utilities (TODO)
```

## API Endpoints

### Booking (Stream 1)
- `GET  /api/booking/services` — List active services
- `GET  /api/booking/availability?date=YYYY-MM-DD&serviceId=UUID` — Available slots
- `POST /api/booking/appointments` — Book appointment (auth required)
- `GET  /api/booking/appointments` — My appointments (auth required)
- `PATCH /api/booking/appointments/:id/cancel` — Cancel (auth required)

### Store (Stream 2)
- `GET  /api/store/products` — List products
- `GET  /api/store/products/:slug` — Product detail
- `GET  /api/store/categories` — Product categories
- `POST /api/store/orders` — Create order (auth required)
- `GET  /api/store/orders` — My orders (auth required)

### Academy (Stream 3)
- `GET  /api/academy/courses` — Published courses
- `GET  /api/academy/courses/:slug` — Course detail + gated curriculum
- `POST /api/academy/courses/:slug/enroll` — Enroll (auth required)
- `POST /api/academy/lessons/:id/complete` — Mark lesson done (auth required)
- `GET  /api/academy/enrollments` — My enrollments (auth required)

### Events (Stream 4+5)
- `GET  /api/events?type=webinar|consultation` — Upcoming events
- `GET  /api/events/:slug` — Event detail
- `POST /api/events/:slug/register` — Register (auth required)
- `GET  /api/events/my/registrations` — My registrations (auth required)

### Webhooks
- `POST /api/webhooks/stripe` — Stripe payment events (TODO: implement handler)

## Cross-Stream Connections

The synergy layer works through three mechanisms:

1. **Activity Log** — Every user action (`appointment.booked`, `order.created`, `course.enrolled`, `webinar.registered`) is logged to `activity_log`, enabling automated cross-sell triggers.

2. **Source Tracking** — Orders track `sourceAppointmentId` (which appointment drove the purchase). Enrollments track `sourceEventId` (which webinar led to course signup).

3. **Unified User** — One `users` table with one `stripeCustomerId` across all streams. One customer profile, infinite touchpoints.

## TODO (Next Steps)

- [ ] Auth routes (register, login, magic link, password reset)
- [ ] Stripe Checkout integration (deposits, products, courses, events)
- [ ] Stripe webhook handler (finalize payments across all streams)
- [ ] Email system (Resend: confirmations, reminders, nurture sequences)
- [ ] Admin CRUD endpoints (manage services, products, courses, events)
- [ ] R2 media upload endpoints (product images, course videos)
- [ ] Frontend (React on Cloudflare Pages — dark luxe design)

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Runtime | Cloudflare Workers (edge compute) |
| Framework | Hono v4 |
| Database | Neon Postgres via Hyperdrive |
| ORM | Drizzle |
| Payments | Stripe |
| Auth | JWT (jose) |
| Sessions | Cloudflare KV |
| Media | Cloudflare R2 |
| Email | Resend (planned) |

---

Built by **The Factory** | March 2026
