# 🔒 Credentials & Security Guide

## ⚠️ Critical: What You MUST Do

### 1. **NEVER commit `.env` files**
Your `.gitignore` now prevents this, so you're protected. But remember:
- ❌ `.env` — NEVER commit (contains real secrets)
- ✅ `.env.example` — SAFE to commit (template only)

### 2. **Secrets Rotation Checklist**
If credentials were ever exposed (they weren't — you're safe!), here's what to do:

- [ ] **Stripe**: Invalidate old keys, generate new ones: https://dashboard.stripe.com/apikeys
- [ ] **JWT Secret**: Generate new secret: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`
- [ ] **Resend API Key**: Regenerate at https://resend.com/api-keys
- [ ] **Database**: Change password in Neon console
- [ ] **Update all services** with new credentials

### 3. **Environment Variables by Environment**

```
Local Development (.env):
DATABASE_URL=postgresql://...
JWT_SECRET=dev-secret-xyz
STRIPE_SECRET_KEY=sk_test_...

Production (via Wrangler Secrets):
npx wrangler secret put DATABASE_URL
npx wrangler secret put JWT_SECRET
npx wrangler secret put STRIPE_SECRET_KEY
```

### 4. **Secure Development Workflow**

```bash
# 1. Copy template
cp .env.example .env

# 2. Edit with YOUR credentials (NEVER push this)
nano .env

# 3. DO NOT COMMIT
# Git will ignore it automatically

# 4. For production, use wrangler secrets
npx wrangler secret put STRIPE_SECRET_KEY
# (Cloudflare stores this securely, you don't commit it)
```

### 5. **Common Mistakes to Avoid**

❌ **Don't do this:**
```bash
# Publishing real credentials in code
const API_KEY = "sk_live_4242..."; // Commits to GitHub!

# Committing .env files
git add .env  # .gitignore prevents this now
git push      # But don't force-push it!

# Putting secrets in config files
// config.js
export const STRIPE_KEY = process.env.STRIPE_SECRET_KEY
```

✅ **Do this instead:**
```bash
# Use environment variables
const API_KEY = process.env.STRIPE_SECRET_KEY;  // Loaded from .env

# Never commit .env
# (Your .gitignore does this automatically now)

# Use Wrangler secrets for production
npx wrangler secret put STRIPE_SECRET_KEY
```

### 6. **Checking Committed History**

If you ever suspect credentials were committed:
```bash
# Search git history for secrets
git log -p -S 'sk_test_' # Stripe key pattern
git log -p -S 'DATABASE_URL' # DB connection

# Remove from history (NUCLEAR option, rewrites repo)
git filter-branch --tree-filter 'rm -f .env' HEAD
git push --force
```

### 7. **Setting Up Secrets for Wrangler (Production)**

```bash
# 1. Set up local secrets (Wrangler reads from .env or memory)
cp .env.example .env
nano .env  # Add your development values

# 2. For production, push secrets to Cloudflare
npx wrangler secret put STRIPE_SECRET_KEY
# (Enter the key when prompted)

npx wrangler secret put JWT_SECRET
npx wrangler secret put DATABASE_URL

# 3. Verify they're set
npx wrangler secret list

# 4. Your code accesses them via c.env.STRIPE_SECRET_KEY
```

### 8. **Emergency: If You Accidentally Commit Secrets**

```bash
# 1. IMMEDIATELY invalidate those credentials with the provider
# Go to Stripe, Resend, etc. and revoke the old keys

# 2. Remove from git history
git rm --cached .env
echo ".env" >> .gitignore
git add .gitignore
git commit -m "Remove .env from git history"

# 3. Generate new secrets
# (Provider-specific, see each service's docs)

# 4. Update .env locally and push secrets to Wrangler
```

---

## ✅ You're Now Protected

Your setup is secure because:
1. ✅ `.gitignore` is properly configured
2. ✅ `.env` is on your machine only
3. ✅ `wrangler secrets` stores production secrets securely
4. ✅ `.env.example` documents what's needed
5. ✅ No secrets in your GitHub repo

**Keep it this way!** 🔐
