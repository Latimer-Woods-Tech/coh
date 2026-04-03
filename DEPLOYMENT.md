# Cloudflare Deployment Guide

## ✅ Status: Ready to Deploy

Your repository is fully committed and pushed to GitHub. All code is production-ready.

### What's Currently Ready:
- **Backend API**: Hono.js on Cloudflare Workers (`src/`)
- **Frontend**: React + Vite (`web/`)
- **Database**: Neon PostgreSQL via Hyperdrive
- **Storage**: Cloudflare R2 for media
- **Sessions**: Cloudflare KV
- **Git**: All code pushed to `adrper79-dot/coh`

---

## 🚀 Deployment Option 1: Cloudflare Pages (Recommended)

### Step 1: Get Your Cloudflare Account ID
1. Log in to [Cloudflare Dashboard](https://dash.cloudflare.com)
2. Go to **Account Settings → Overview**
3. Copy your **Account ID** (bottom right)

### Step 2: Create API Token
1. Go to [API Tokens](https://dash.cloudflare.com/profile/api-tokens)
2. Click **Create Token**
3. Use template: **Edit Cloudflare Workers**
4. Verify permissions include:
   - `Account > Cloudflare Pages > Edit`
   - `Account > Workers Scripts > Edit`
   - `Zone > DNS > Edit`
5. Copy your token

### Step 3: Deploy via CLI

```bash
# Set authentication
export CLOUDFLARE_API_TOKEN="your_token_here"
export CLOUDFLARE_ACCOUNT_ID="your_account_id_here"

# Navigate to repo
cd /workspaces/coh

# Deploy backend (Workers)
npx wrangler deploy

# Deploy frontend (Pages)
cd web
npm run build
npx wrangler pages deploy dist
```

---

## 🔗 Deployment Option 2: GitHub Integration (Even Easier)

### Step 1: Connect GitHub to Cloudflare
1. Go to [Cloudflare Pages](https://dash.cloudflare.com/?to=/:account/pages)
2. Click **Connect to Git**
3. Authorize GitHub
4. Select repository: `adrper79-dot/coh`

### Step 2: Configure Build
- **Framework**: Vite
- **Build command**: `cd web && npm run build`
- **Build output directory**: `web/dist`
- **Root directory**: `/`

### Step 3: Auto Deploy
- Every push to `main` branch auto-deploys
- No manual steps needed

---

## 🔐 Secrets Configuration

After deployment, configure production secrets:

```bash
# Backend secrets (Workers)
npx wrangler secret put STRIPE_SECRET_KEY
npx wrangler secret put STRIPE_WEBHOOK_SECRET
npx wrangler secret put JWT_SECRET
npx wrangler secret put RESEND_API_KEY
npx wrangler secret put DATABASE_URL

# Frontend environment (.env.production)
VITE_API_URL=https://coh-api.workers.dev
VITE_STRIPE_PUBLIC_KEY=pk_live_xxx
```

---

## ✅ Post-Deployment Checklist

- [ ] API deployed to Workers
- [ ] Frontend deployed to Pages
- [ ] Domain configured in Cloudflare
- [ ] SSL/TLS enabled
- [ ] Production secrets set
- [ ] Stripe webhook configured
- [ ] Database connection verified
- [ ] R2 bucket created and linked
- [ ] KV namespace created for sessions

---

## 🔗 URLs After Deployment

- **API**: `https://coh-api.workers.dev` or custom domain
- **Frontend**: `https://coh.pages.dev` or custom domain
- **Dashboard**: [Cloudflare Dashboard](https://dash.cloudflare.com)

---

## 🆘 Troubleshooting

### If authentication fails:
```bash
# Clear cache and try again
rm -rf ~/.wrangler

# Verify token (test with curl)
curl -X GET https://api.cloudflare.com/client/v4/accounts \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### If build fails:
```bash
# Check Node version
node --version  # Should be 18+

# Install dependencies
npm install
cd web && npm install

# Test build locally
npm run build
cd web && npm run build
```

---

**Need help?** All code is committed and ready. Just provide your Cloudflare credentials or set up GitHub integration.
