# CypherOfHealing.com — Full-Stack Platform

> "The outer is a reflection of the inner." — Classic Man frequency

## 🌟 Overview

World-class personal brand platform with five integrated streams:

1. **The Chair** — Personal consultations & bookings
2. **The Vault** — Curated product store
3. **The Academy** — Online learning & courses
4. **The Stage & Inner Circle** — Events, webinars & community

### Architecture

```
┌─────────────────────────────────────────────────────────┐
│                   Frontend (React)                       │
│  Modern, responsive UI with Tailwind & Framer Motion   │
│               /web - Port 5173                          │
└─────────────┬───────────────────────────────────────────┘
              │ HTTP + JWT Auth
┌─────────────▼───────────────────────────────────────────┐
│               Backend (Hono + Cloudflare Workers)       │
│  RESTful API with unified response format              │
│  Drizzle ORM + Neon Postgres + Stripe                  │
│               /src - Port 8787                          │
└─────────────┬───────────────────────────────────────────┘
              │ SQL
┌─────────────▼───────────────────────────────────────────┐
│  Database (Neon Postgres)                              │
│  + Cloudflare KV (Sessions)                            │
│  + Cloudflare R2 (Media)                               │
└─────────────────────────────────────────────────────────┘
```

## 📂 Project Structure

```
coh/
├── src/                      # Backend API (Hono)
│   ├── index.ts             # Main app setup
│   ├── db/                  # Database layer
│   │   ├── index.ts
│   │   └── schema.ts        # Drizzle ORM schema
│   ├── middleware/          # Express-like middleware
│   │   ├── auth.ts         # JWT authentication
│   │   ├── errors.ts       # Global error handling
│   │   └── response.ts     # Unified response format
│   ├── routes/             # API route handlers
│   │   ├── booking.ts      # /api/booking
│   │   ├── store.ts        # /api/store
│   │   ├── academy.ts      # /api/academy
│   │   └── events.ts       # /api/events
│   ├── types/             # TypeScript types
│   │   └── env.ts
│   └── utils/             # Utilities
│       └── validation.ts   # Zod schemas & helpers
│
├── web/                    # Frontend (React + Vite)
│   ├── src/
│   │   ├── components/    # Reusable React components
│   │   │   ├── Header.tsx
│   │   │   ├── Footer.tsx
│   │   │   └── Layout.tsx
│   │   ├── pages/        # Page components
│   │   │   ├── HomePage.tsx
│   │   │   ├── BookingPage.tsx
│   │   │   ├── StorePage.tsx
│   │   │   ├── AcademyPage.tsx
│   │   │   ├── EventsPage.tsx
│   │   │   └── LoginPage.tsx
│   │   ├── stores/       # Zustand state management
│   │   │   ├── auth.ts
│   │   │   └── cart.ts
│   │   ├── lib/         # Utilities
│   │   │   └── api.ts
│   │   ├── App.tsx      # Router setup
│   │   ├── main.tsx     # Entry point
│   │   └── index.css    # Tailwind + global styles
│   └── index.html       # HTML template
│
├── drizzle.config.ts      # Database migrations config
├── wrangler.jsonc        # Cloudflare Workers config
├── package.json          # Root scripts & dependencies
└── README.md            # This file
```

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- npm or yarn
- GitHub Codespace (recommended) or local environment
- Neon database account
- Cloudflare account

### 1. Backend Setup

```bash
# Install dependencies
npm install

# Copy and configure environment
cp .env.example .env
# Edit .env with your Neon DATABASE_URL

# Generate database migrations
npm run db:generate

# Apply migrations
npm run db:migrate

# Login to Cloudflare
npx wrangler login

# Set up Hyperdrive, KV, R2 (see main README)

# Start dev server
npm run dev
```

**API running at:** `http://localhost:8787`

**Endpoints:**
- `GET /` — Health check
- `GET /api/docs` — API documentation
- `GET /api/booking` — Booking services
- `GET /api/store` — Products
- `GET /api/academy` — Courses
- `GET /api/events` — Events

### 2. Frontend Setup

```bash
# Navigate to web folder
cd web

# Install dependencies
npm install

# Copy environment config
cp .env.example .env

# Start dev server
npm run dev
```

**Frontend running at:** `http://localhost:5173`

Visit `http://localhost:5173` and you'll see the beautiful homepage!

### 3. Development Workflow

#### Terminal 1: Backend
```bash
npm run dev          # Starts Hono dev server with hot reload
npm run db:studio    # Opens Drizzle Studio for DB management
```

#### Terminal 2: Frontend
```bash
cd web
npm run dev          # Starts Vite dev server with HMR
npm run type-check   # TypeScript validation
```

Both will auto-reload on file changes.

## 🎨 UI/UX Highlights

### Design System
- **Color Palette**: Gold primary, charcoal dark, neutral grays
- **Typography**: Serif headings (Merriweather), sans-serif body (Inter)
- **Spacing**: 8px grid system with Tailwind
- **Animations**: Smooth transitions via Framer Motion

### Components
- Responsive header with mobile navigation
- Hero section with call-to-action
- Service cards with animations
- Interactive booking calendar
- Product grid with filtering
- Course listings with levels
- Event discovery with calendar
- Beautiful login form

### Responsive Breakpoints
- Mobile: 320px - 640px (sm)
- Tablet: 641px - 1024px (md)
- Desktop: 1025px+ (lg)

## 🔌 API Design

### Unified Response Format

All API responses follow this standard:

**Success (2xx):**
```json
{
  "success": true,
  "data": { /* response data */ },
  "meta": {
    "timestamp": "2024-01-01T12:00:00Z",
    "requestId": "uuid",
    "version": "1.0.0"
  }
}
```

**Error (4xx/5xx):**
```json
{
  "success": false,
  "error": {
    "code": "NOT_FOUND",
    "message": "Resource not found",
    "details": { "field": "error message" },
    "timestamp": "2024-01-01T12:00:00Z",
    "requestId": "uuid"
  }
}
```

### Error Codes
- `BAD_REQUEST` (400) — Invalid input
- `UNAUTHORIZED` (401) — Missing/invalid auth
- `FORBIDDEN` (403) — Access denied
- `NOT_FOUND` (404) — Resource not found
- `VALIDATION_ERROR` (422) — Field validation failed
- `INTERNAL_ERROR` (500) — Server error

### Request Tracking
Every request gets a unique `X-Request-ID` header for debugging.

## 🔐 Authentication

JWT-based authentication:

1. User logs in → receives JWT token
2. Store token in localStorage
3. Include in requests: `Authorization: Bearer <token>`
4. Token auto-verified for protected routes
5. 401 errors redirect to login

## 📦 Key Dependencies

### Backend
- **Hono** ^4.7.0 — Fast web framework
- **Drizzle ORM** ^0.39.0 — Database ORM
- **Stripe** ^17.0.0 — Payment processing
- **Zod** ^3.24.0 — Validation
- **jose** ^6.0.0 — JWT handling

### Frontend
- **React** ^18.2.0 — UI library
- **React Router** ^6.20.0 — Client routing
- **Zustand** ^4.4.1 — State management
- **Tailwind CSS** ^3.3.6 — Utility CSS
- **Framer Motion** ^10.16.4 — Animations
- **Axios** ^1.6.2 — HTTP client

## 📝 Development Guide

### Adding New Pages

```tsx
// web/src/pages/NewPage.tsx
import Layout from '@/components/Layout';
import { motion } from 'framer-motion';

export default function NewPage() {
  return (
    <Layout>
      <div className="py-20">
        <motion.h1 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-5xl font-serif font-bold"
        >
          New Page
        </motion.h1>
      </div>
    </Layout>
  );
}

// web/src/App.tsx
<Route element={<Layout><NewPage /></Layout>} path="/new-page" />
```

### Adding API Routes

```ts
// src/routes/newroute.ts
import { Hono } from 'hono';
import { successResponse, errorResponse } from '../middleware/response';
import { ApiErrors } from '../middleware/errors';

const route = new Hono();

route.get('/example', async (c) => {
  try {
    const data = { message: 'Success' };
    return successResponse(data, c);
  } catch (err) {
    return errorResponse(c, {
      code: 'INTERNAL_ERROR',
      message: 'Something went wrong',
      status: 500
    });
  }
});

export default route;
```

### Using Authentication

```tsx
import { useAuthStore } from '@/stores/auth';

function Component() {
  const { user, logout } = useAuthStore();
  
  if (!user) return <p>Please log in</p>;
  return <p>Welcome, {user.name}</p>;
}
```

## 🧪 Testing

```bash
# Backend typecheck
npm run typecheck

# Frontend typecheck
cd web && npm run type-check

# Build frontend
cd web && npm run build
```

## 📚 Deploying

### Backend (Cloudflare Workers)
```bash
npm run build
npm run deploy
npm run deploy:production
```

### Frontend (Vercel, Netlify, etc.)
```bash
cd web
npm run build
# Deploy the dist/ folder
```

## 🎯 Next Steps

- [ ] Implement API endpoints (auth, booking, orders, etc.)
- [ ] Add payment processing (Stripe)
- [ ] Set up email notifications (Resend)
- [ ] Add user dashboard
- [ ] Implement search & filtering
- [ ] Add reviews & ratings
- [ ] Set up analytics
- [ ] Create admin panel
- [ ] Add customer support chat
- [ ] Implement membership tiers

## 🤝 Contributing

1. Create a feature branch
2. Make changes
3. Test thoroughly
4. Submit PR with clear description

## 📄 License

Private - All rights reserved

## 🆘 Support

For issues or questions, refer to the individual README files in `/src` and `/web`.

---

**Built with ❤️ for world-class healing experiences**
