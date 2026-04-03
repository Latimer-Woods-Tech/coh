# Cloudflare Pages Project Setup

## Current Status ✅ PAGES PROJECT CREATED

The Cloudflare Pages project `coh` has been created. However, the **dashboard configuration needs to be updated** to use the correct build settings.

## What's Fixed ✅

- ✅ Removed conflicting `main` and `pages_build_output_dir` keys from configuration
- ✅ Created `wrangler.toml` in root with proper build configuration
- ✅ Updated GitHub Actions to use correct project name `coh`
- ✅ Configuration now passes validation

## Dashboard Configuration Required 🔧

The Pages project `coh` has been created, but you need to update its build settings in the Cloudflare Pages dashboard.

### Configure Pages Project Settings

1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com) → **Pages**
2. Click on the **coh** project
3. Go to **Settings** → **Builds & Deployments**
4. Configure these settings:

   - **Build command**: Leave blank (will auto-detect from `wrangler.toml`)
   - **Build output directory**: `web/dist`
   - **Root directory**: `/` (default)

5. Or set explicitly:
   - **Build command**: `npm run build`
   - **Build cwd**: `web`
   - **Build output directory**: `dist`

6. Click **Save**

### Trigger New Deployment

After updating the dashboard settings, trigger a new deployment by pushing an empty commit:

```bash
cd /workspaces/coh
git commit --allow-empty -m "Trigger Pages redeploy with corrected build settings"
git push origin main
```

## If Something Goes Wrong

### Redeploy Tips

1. If the build still fails, make sure:
   - `npm run build` works in the `web/` directory
   - `web/dist/` is the output directory
   - The Pages project settings match the dashboard configuration above

2. To check the build logs:
   - Go to Pages project → **Deployments**
   - Click on the failed deployment
   - View the build logs for specific errors

### Settings Summary

**File:** `/wrangler.toml` (root)
```toml
name = "coh"
type = "javascript"
compatibility_date = "2026-03-27"

[build]
command = "npm run build"
cwd = "./web"
```

The `wrangler.toml` file tells Cloudflare Pages:
- Build command: run `npm run build`
- Build from: `./web` directory
- Pages will look for built files in `web/dist`

## Files Modified

- `wrangler.toml` - Root configuration for Pages build
- `wrangler.jsonc` - Root configuration for Workers API (separate)
- `.github/workflows/deploy.yml` - Updated to use project name `coh`
