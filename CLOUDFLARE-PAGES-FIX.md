# ⚠️ REQUIRED: Cloudflare Pages Dashboard Configuration

**Status**: Pages project `coh` exists but needs dashboard settings updated  
**Error in logs**: `wrangler pages project create coh` is running as build command (incorrect)

## Quick Fix (2 minutes)

The Pages project has the wrong build command. Follow these exact steps:

### Step 1: Open Pages Settings

1. Go to https://dash.cloudflare.com
2. Click **Pages** (in left sidebar)
3. Click the **coh** project
4. Click **Settings** (in top menu)
5. Click **Builds & Deployments** (in left sidebar)

### Step 2: Update Build Configuration

Look for these fields and update them:

| Field | Current | Should Be |
|-------|---------|-----------|
| **Build command** | `wrangler pages project create coh` | `(leave blank)` |
| **Build output directory** | `(check if set)` | `dist` |
| **Root directory** | `(check if set)` | `/web` |

### Step 3: Save Changes

- Click **Save** button at bottom right
- Wait for confirmation message

### Step 4: Trigger Redeploy

Push an empty commit to trigger the build with new settings:

```bash
cd /workspaces/coh
git commit --allow-empty -m "Redeploy with corrected Pages build settings"
git push origin main
```

Deployment should start automatically. Check the Pages project → **Deployments** tab.

---

## Detailed Explanation

### Why the Root Directory is `/web`

Our repository structure is:
```
coh/                      ← repository root
├── web/                  ← web app source
│   ├── src/
│   ├── package.json
│   ├── vite.config.ts
│   └── dist/             ← build output (after npm run build)
├── src/                  ← API source
└── wrangler.toml         ← Pages build config
```

The **Root directory** tells Pages where to run the build command. Since `npm run build` is in `web/package.json`, we need `/web`.

### Why Build Output is `dist`

The `web/package.json` build script creates: `web/dist/`  
But when we set Root directory to `/web`, Pages looks in: `{root}/dist` = `web/dist` ✓

### The wrangler.toml Configuration

The `wrangler.toml` in the root contains:
```toml
[build]
command = "npm run build"
cwd = "./web"
```

This tells Pages:
- **What** to run: `npm run build`
- **Where** to run it: `./web` directory
- **Where** output is: `web/dist`

Pages should auto-detect this, but if it doesn't work, use these explicit values:
- Build command: `npm run build`
- Build output directory: `dist`  
- Root directory: `/web`

---

## If Build Still Fails

1. **Check build works locally**:
   ```bash
   cd web
   npm run build
   ls dist/  # Should show index.html
   ```

2. **Check the Pages build logs**:
   - Deployments tab → Click failed deployment
   - Look for detailed error message

3. **Common issues**:
   - Wrong output directory format
   - Node.js version mismatch
   - Missing environment variables

---

## Success Indicators ✅

Once configured correctly:
- ✅ Deployment shows green checkmark
- ✅ Frontend accessible at `https://coh.pages.dev`
- ✅ Build logs show "Deployment successful"
