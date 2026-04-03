# 🚀 Cypher of Healing - Complete Deployment Setup

## Current Status

✅ **Code**: Ready for deployment  
✅ **Build Configuration**: Fixed and working  
⏳ **GitHub Secrets**: Need to be configured  
⏳ **Cloudflare Pages**: Need authentication  

---

## 📋 Quick Setup Checklist

Complete these steps in order:

### 1. Create Cloudflare API Token (5 min)
**File**: [API-TOKEN-SETUP.md](./API-TOKEN-SETUP.md)

Go to https://dash.cloudflare.com/profile/api-tokens and create a token with:
- ✅ `Account.Pages` - Read & Write
- ✅ `Account.Cloudflare Pages` - Read & Write  
- ✅ `Zone.Workers` - Read & Write (for API)

**Copy the token** - you won't see it again!

### 2. Update GitHub Secrets (2 min)
**Location**: https://github.com/adrper79-dot/coh/settings/secrets/actions

Add/Update these secrets:

| Secret Name | Value | Source |
|------------|-------|--------|
| `CLOUDFLARE_API_TOKEN` | Your new token from step 1 | Cloudflare Dashboard |
| `CLOUDFLARE_ACCOUNT_ID` | 32-char hex ID | Cloudflare Dashboard URL or right sidebar |

### 3. Verify Pages Project Exists (2 min)
**Location**: https://dash.cloudflare.com/pages

- Look for a project named `coh`
- If missing: Click **Create project** → **Deploy manually** → Name: `coh`

### 4. Trigger Deployment (1 min)

```bash
cd /workspaces/coh
git commit --allow-empty -m "Trigger Pages deployment"
git push origin main
```

Monitor the deployment:
- GitHub: https://github.com/adrper79-dot/coh/actions
- Cloudflare Pages: https://dash.cloudflare.com/pages → coh → Deployments

---

## 🏗️ What Gets Deployed

### Frontend (React + Vite)
- **Location**: `/web` directory
- **Deploy to**: Cloudflare Pages (`coh.pages.dev`)
- **Build**: `npm run build` → outputs to `web/dist/`
- **Auto-redeploy**: On every push to `main` branch

### Backend (Hono + Cloudflare Workers)
- **Location**: `/src` directory  
- **Deploy to**: Cloudflare Workers (`cypher-of-healing-api.workers.dev`)
- **Build**: `npm build` (TypeScript compilation)
- **Auto-redeploy**: On every push to `main` branch

---

## 🔧 Configuration Files

| File | Purpose | Status |
|------|---------|--------|
| `wrangler.toml` | Pages build config | ✅ Fixed |
| `wrangler.jsonc` | Workers API config | ✅ Fixed |
| `.github/workflows/deploy.yml` | CI/CD pipeline | ✅ Fixed |
| `web/vite.config.ts` | Frontend build config | ✅ Ready |
| `web/package.json` | Frontend dependencies | ✅ Ready |

---

## 📂 Project Structure

```
coh/
├── src/                    # Backend (Hono API)
│   ├── index.ts
│   ├── db/
│   ├── routes/
│   └── middleware/
├── web/                    # Frontend (React + Vite)
│   ├── src/
│   │   ├── pages/
│   │   ├── components/
│   │   └── stores/
│   ├── dist/              # Build output (after npm run build)
│   ├── package.json
│   └── vite.config.ts
├── wrangler.toml          # Pages build config
├── wrangler.jsonc         # Workers API config
└── .github/workflows/deploy.yml  # GitHub Actions
```

---

## 🌐 After Deployment - Expected URLs

| Component | URL | Notes |
|-----------|-----|-------|
| **Frontend** | https://coh.pages.dev | React app hosted on Pages |
| **Backend API** | https://cypher-of-healing-api.workers.dev | Hono API on Workers |
| **Custom Domain** | (optional) | Configure in Cloudflare |

---

## 🆘 Troubleshooting

### "Authentication error [code: 10000]"
→ See [API-TOKEN-SETUP.md](./API-TOKEN-SETUP.md) - Token needs correct permissions

### "Project not found"
→ Create the `coh` Pages project in Cloudflare dashboard

### Build fails on Pages
→ Run locally: `cd web && npm run build` to verify it works

### Pages build command is wrong
→ See [CLOUDFLARE-PAGES-FIX.md](./CLOUDFLARE-PAGES-FIX.md)

### Workers deployment fails
→ Check GitHub secret `CLOUDFLARE_ACCOUNT_ID` is correct

---

## 🧪 Test the Deployment

Once live, test your endpoints:

```bash
# Frontend
curl https://coh.pages.dev/

# Backend API
curl https://cypher-of-healing-api.workers.dev/
```

Or open in browser:
- Frontend: https://coh.pages.dev
- API Docs: https://cypher-of-healing-api.workers.dev/

---

## 📚 Related Documentation

- [API-TOKEN-SETUP.md](./API-TOKEN-SETUP.md) - Configure Cloudflare API token
- [CLOUDFLARE-PAGES-FIX.md](./CLOUDFLARE-PAGES-FIX.md) - Pages dashboard settings
- [PAGES-SETUP.md](./PAGES-SETUP.md) - Initial Pages setup notes
- [diagnose-cf-deployment.sh](./diagnose-cf-deployment.sh) - Diagnostic script

---

## ✅ Checklist: Am I Ready?

Before pushing to main, verify:

- [ ] Cloudflare API token created with `Account.Pages` and `Zone.Workers` permissions
- [ ] GitHub secrets `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID` updated
- [ ] Cloudflare Pages project `coh` exists in dashboard
- [ ] Local build works: `cd web && npm run build`
- [ ] No uncommitted changes: `git status` is clean

If all checked: 
```bash
git push origin main
# Then monitor: https://github.com/adrper79-dot/coh/actions
```

---

**Last Updated**: April 3, 2026  
**Status**: Ready for deployment (pending GitHub secrets configuration)
