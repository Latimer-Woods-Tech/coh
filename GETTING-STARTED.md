# Getting Started Guide — CypherOfHealing

## 🎯 What You'll Do

By the end of this guide, you'll have:
- ✅ Backend API running on `http://localhost:8787`
- ✅ Frontend UI running on `http://localhost:5173`
- ✅ Database connected via Neon
- ✅ Everything type-checked and ready to develop

**Estimated time: 10-15 minutes**

---

## Part 1: Backend Setup

### Step 1: Install Dependencies
```bash
npm install
```

### Step 2: Environment Configuration
```bash
cp .env.example .env
```

**Open `.env` and add:**
```
DATABASE_URL=postgresql://user:password@host/dbname
CORS_ORIGIN=http://localhost:5173
ENVIRONMENT=development
JWT_SECRET=your-secret-key-here
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
RESEND_API_KEY=re_...
```

**Get these from:**
- **DATABASE_URL**: [Neon Console](https://console.neon.tech/)
- **JWT_SECRET**: Generate random string: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`
- **STRIPE**: [Stripe Dashboard](https://dashboard.stripe.com/)
- **RESEND**: [Resend Console](https://resend.com/)

### Step 3: Set Up Database
```bash
# Generate initial migration
npm run db:generate

# Apply to database
npm run db:migrate

# View database in browser
npm run db:studio
```

### Step 4: Cloudflare Setup
```bash
# Login to Cloudflare
npx wrangler login

# Create Hyperdrive (DB connection)
npx wrangler hyperdrive create cypher-healing-db \
  --connection-string="your-neon-connection-string"

# Copy the ID to wrangler.jsonc → hyperdrive[0].id

# Create KV namespace for sessions
npx wrangler kv namespace create SESSIONS

# Copy the ID to wrangler.jsonc → kv_namespaces[0].id

# Create R2 bucket for media
npx wrangler r2 bucket create cypher-healing-media
```

### Step 5: Set Secrets
```bash
npx wrangler secret put STRIPE_SECRET_KEY
npx wrangler secret put STRIPE_WEBHOOK_SECRET
npx wrangler secret put JWT_SECRET
npx wrangler secret put RESEND_API_KEY
```

### Step 6: Start Dev Server
```bash
npm run dev
```

**Backend is now running at:** `http://localhost:8787`

**Test it:**
```bash
curl http://localhost:8787/
```

---

## Part 2: Frontend Setup

### Step 1: Navigate to Web Directory
```bash
cd web
```

### Step 2: Install Dependencies
```bash
npm install
```

### Step 3: Environment Configuration
```bash
cp .env.example .env
```

**Default is fine for development:**
```
VITE_API_URL=http://localhost:8787/api
```

### Step 4: Start Dev Server
```bash
npm run dev
```

**Frontend is now running at:** `http://localhost:5173`

**Your browser might auto-open. If not, visit:**
```
http://localhost:5173
```

---

## 🎉 You're Done!

You should now see:
1. **Beautiful homepage** with hero section
2. **Navigation** to Booking, Shop, Academy, Events
3. **Responsive design** that works on mobile & desktop
4. **Smooth animations** when you interact

---

## 📋 Development Workflow

### Working on Backend

```bash
# Terminal 1: API development
npm run dev

# Terminal 2: Database management (separate terminal)
npm run db:studio

# Type checking
npm run typecheck
```

### Working on Frontend

```bash
# Terminal 3: Frontend (separate directory)
cd web
npm run dev

# Type checking
npm run type-check

# Building for production
npm run build
```

### Making Requests from Frontend to Backend

The frontend is already configured to:
- Make requests to `http://localhost:8787/api`
- Auto-include JWT tokens from localStorage
- Auto-redirect on 401 errors

Example in components:
```typescript
import apiClient from '@/lib/api';

// In a component
const data = await apiClient.get('/booking/services');
```

---

## 🔑 Key Files to Know

### Backend Entry Points
- **`src/index.ts`** — Main app, routes, middleware
- **`src/routes/*.ts`** — API endpoint handlers
- **`src/middleware/*.ts`** — Reusable request/response logic
- **`src/db/schema.ts`** — Database table definitions

### Frontend Entry Points
- **`web/src/App.tsx`** — Router configuration
- **`web/src/pages/*.tsx`** — Page components
- **`web/src/components/*.tsx`** — Reusable components
- **`web/src/stores/*.ts`** — Zustand state management

---

## 🐛 Troubleshooting

### "Cannot find module"
```bash
# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install
```

### "DATABASE_URL not found"
```bash
# Check .env file exists
ls -la .env

# Re-copy if missing
cp .env.example .env
```

### Port already in use (8787 or 5173)
```bash
# Kill process on port 8787
lsof -i :8787
kill -9 <PID>

# Or change ports in vite.config.ts and wrangler.json
```

### Vite not detecting changes
```bash
# Restart dev server
# Press Ctrl+C and run again
npm run dev
```

### TypeScript errors
```bash
# Type checking
npm run typecheck

# Fix issues per the output
```

---

## 🚀 Next: Connecting Data

Now that everything is running, next steps are:

1. **Create API endpoints** for real data in `src/routes/`
2. **Define database schema** in `src/db/schema.ts`
3. **Connect frontend** to real API calls
4. **Test end-to-end** flow (booking → payment → email)

See [`UI-UX-UPGRADE-SUMMARY.md`](./UI-UX-UPGRADE-SUMMARY.md) for what's been built.

See [`FULLSTACK-README.md`](./FULLSTACK-README.md) for architecture details.

---

## 📞 Support

- Backend issues? Check `src/index.ts` and `wrangler.jsonc`
- Frontend issues? Check `web/vite.config.ts` and `.env`
- Database issues? Use `npm run db:studio` to browse
- API not responding? Check terminal for error logs

Good luck! 🎉
