# 🔐 Cloudflare API Token Setup for Pages Deployment

## Current Problem

GitHub Actions deployment is failing with: **Authentication error [code: 10000]**

This happens when:
1. The `CLOUDFLARE_API_TOKEN` secret doesn't have `pages:write` permission
2. The `CLOUDFLARE_ACCOUNT_ID` secret is incorrect or missing
3. The Pages project `coh` doesn't exist in that account

## Solution: Create/Update API Token with Correct Permissions

### Step 1: Generate New API Token in Cloudflare

1. Go to https://dash.cloudflare.com/profile/api-tokens
2. Click **Create Token** button
3. Choose **"Create Custom Token"** template
4. Configure the token:

   **Token name**: `GitHub-Pages-Deploy` (or any name)

   **Permissions** (set these exact permissions):
   - ✅ `Account.Pages` - **Read & Write**
   - ✅ `Account.Cloudflare Pages` - **Read & Write**  
   - ✅ `Zone.Workers` - **Read & Write** (for API deployment)
   - ✅ `Zone.Workers KV` - **Read & Write** (optional but recommended)

   **Account Resources**:
   - Select: **Include all accounts** (or specific account if you prefer)

   **Zone Resources**:
   - Select: **Include all zones** (recommended) OR your specific zone

5. Click **Continue to Summary**
6. Click **Create Token**
7. **Copy the token** (you won't see it again!)

### Step 2: Update GitHub Secrets

1. Go to your GitHub repo: https://github.com/adrper79-dot/coh
2. Click **Settings** → **Secrets and variables** → **Actions**
3. Update existing secret or create new:
   - Secret name: `CLOUDFLARE_API_TOKEN`
   - Secret value: Paste the token from Step 1
   - Click **Update** or **Add secret**

### Step 3: Verify Account ID

1. Go to https://dash.cloudflare.com (main dashboard)
2. Look in the URL: `https://dash.cloudflare.com/` followed by a 32-character ID
3. Or in the right sidebar, you'll see your account info
4. Copy the **Account ID** (hex format, ~32 characters)

In GitHub Secrets:
- Secret name: `CLOUDFLARE_ACCOUNT_ID`
- Secret value: Your account ID
- Click **Update** or **Add secret**

### Step 4: Verify Pages Project Exists

1. Go to https://dash.cloudflare.com → **Pages**
2. You should see a project named **`coh`**
3. If it doesn't exist:
   - Click **Create a project**
   - Choose **Deploy manually**
   - Name: `coh`
   - Click **Create project**

### Step 5: Trigger New Deployment

Push an empty commit to test:

```bash
cd /workspaces/coh
git commit --allow-empty -m "Test Pages deployment with updated API token"
git push origin main
```

Check the deployment: Go to GitHub → Actions → Latest run

---

## Troubleshooting

### Still getting "Authentication error"?

1. **Verify token has right permissions**:
   - Go to https://dash.cloudflare.com/profile/api-tokens
   - Click the token name you created
   - Check it has `Account.Pages` and `Account.Cloudflare Pages` with **Read & Write**

2. **Verify token is correct in GitHub**:
   - Go to GitHub Repo → Settings → Secrets
   - The secret value should be the full token (starts with `v1.0-`)

3. **Verify Account ID is correct**:
   - It should be a 32-character hex string (no spaces, no hyphens mid-string)
   - Copy directly from Cloudflare dashboard

### Is the Pages project missing?

If you see "Project not found" error:
1. Go to Cloudflare Pages
2. Click **Create a project** → **Deploy manually**
3. Enter project name: `coh`
4. Click **Create project**
5. Then retry deployment

---

## Expected Success

Once configured correctly:
✅ Frontend deploys to `https://coh.pages.dev`
✅ Build logs show in Pages → Deployments
✅ GitHub Actions shows green checkmark

---

## Reference: Token Permissions Matrix

| Permission | Read | Write | Why Needed |
|-----------|------|-------|-----------|
| `Account.Pages` | ✅ | ✅ | Deploy to Pages |
| `Account.Cloudflare Pages` | ✅ | ✅ | Manage Pages projects |
| `Zone.Workers` | ✅ | ✅ | Deploy API (Workers) |
| `Zone.Workers KV` | ✅ | ✅ | Optional: KV storage |
| `Zone.Workers Tail` | ✅ | | Optional: Real-time logs |

Minimum required: `Account.Pages` and `Account.Cloudflare Pages` with Read & Write
