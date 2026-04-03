# GitHub Actions Setup for Cloudflare Deployment

## ✅ What's Been Set Up

A GitHub Actions workflow has been created at `.github/workflows/deploy.yml` that automatically deploys your application to Cloudflare on every push to the main branch.

## 🔐 How to Enable Automatic Deployment

### Step 1: Add GitHub Secrets
1. Go to your repository: https://github.com/adrper79-dot/coh
2. Click **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret** and add each of these:

```
CLOUDFLARE_API_TOKEN
CLOUDFLARE_ACCOUNT_ID
STRIPE_SECRET_KEY
STRIPE_WEBHOOK_SECRET
JWT_SECRET
DATABASE_URL
RESEND_API_KEY
```

### Step 2: Get Your Credentials

**Cloudflare Credentials:**
- Go to: https://dash.cloudflare.com/profile/api-tokens
- Create a token with permissions:
  - `Account > Cloudflare Workers > Edit`
  - `Account > Cloudflare Pages > Edit`
  - `Zone > DNS > Edit`
- Copy the token → Paste as `CLOUDFLARE_API_TOKEN` secret

**Account ID:**
- Go to: https://dash.cloudflare.com
- Look at the bottom right of Overview tab
- Copy → Paste as `CLOUDFLARE_ACCOUNT_ID` secret

**API Keys:**
- Stripe: https://dashboard.stripe.com/apikeys
- Resend: https://resend.com/api-keys
- JWT Secret: Generate with `openssl rand -hex 32`

### Step 3: Done! 🎉

Now every push to main will automatically:
1. ✅ Deploy backend to Cloudflare Workers
2. ✅ Build frontend with Vite
3. ✅ Deploy frontend to Cloudflare Pages
4. ✅ Show deployment status

## 📊 Monitor Deployments

1. Go to your repo: https://github.com/adrper79-dot/coh
2. Click **Actions** tab
3. Watch deployment progress in real-time
4. View logs if anything fails

## 🚀 Trigger Manual Deployment

To manually deploy without pushing code:
1. Go to **Actions** tab
2. Select **Deploy to Cloudflare**
3. Click **Run workflow**

## 📍 After Deployment

Your app will be live at:
- **API**: https://cypher-of-healing-api.workers.dev
- **Frontend**: https://coh.pages.dev

Add your custom domain in Cloudflare dashboard.

---

**Already did the GitHub Actions setup? Now you just need to add the secrets!**
