#!/bin/bash

# Cloudflare Pages Deployment Diagnostic Script
# This script helps verify your Cloudflare configuration is correct

set -e

echo "🔍 Cloudflare Pages Deployment Diagnostics"
echo "================================================"
echo ""

# Check GitHub secrets exist
echo "1️⃣  Checking GitHub secrets..."

if [ -z "$GITHUB_TOKEN" ]; then
  echo "⚠️  GITHUB_TOKEN not set - using public repo info only"
else
  echo "✅ GITHUB_TOKEN available"
fi

# Check Cloudflare environment variables
echo ""
echo "2️⃣  Checking Cloudflare credentials..."

if [ -z "$CLOUDFLARE_API_TOKEN" ]; then
  echo "❌ CLOUDFLARE_API_TOKEN not set"
else
  TOKEN_PREFIX="${CLOUDFLARE_API_TOKEN:0:10}"
  TOKEN_SUFFIX="${CLOUDFLARE_API_TOKEN: -5}"
  echo "✅ CLOUDFLARE_API_TOKEN found: ${TOKEN_PREFIX}...${TOKEN_SUFFIX}"
fi

if [ -z "$CLOUDFLARE_ACCOUNT_ID" ]; then
  echo "❌ CLOUDFLARE_ACCOUNT_ID not set"
else
  echo "✅ CLOUDFLARE_ACCOUNT_ID found: $CLOUDFLARE_ACCOUNT_ID"
fi

# Check wrangler.toml exists
echo ""
echo "3️⃣  Checking build configuration..."

if [ -f "wrangler.toml" ]; then
  echo "✅ wrangler.toml found"
  echo "   Contents:"
  grep -E "(name|command|cwd|pages_build_output_dir)" wrangler.toml | sed 's/^/   /'
else
  echo "❌ wrangler.toml not found"
fi

# Check web build configuration
echo ""
echo "4️⃣  Checking frontend build..."

if [ -f "web/package.json" ]; then
  echo "✅ web/package.json found"
  if grep -q '"build"' web/package.json; then
    echo "   Build script exists"
  fi
else
  echo "❌ web/package.json not found"
fi

if [ -f "web/dist/index.html" ]; then
  echo "✅ web/dist/index.html exists (build output ready)"
else
  echo "⚠️  web/dist/ not found - run: cd web && npm run build"
fi

# Check npm installation
echo ""
echo "5️⃣  Checking npm setup..."

if [ -d "node_modules" ]; then
  echo "✅ Root node_modules installed"
else
  echo "⚠️  Root node_modules not found - run: npm install"
fi

if [ -d "web/node_modules" ]; then
  echo "✅ Web node_modules installed"
else
  echo "⚠️  Web node_modules not found - run: cd web && npm install"
fi

# Summary
echo ""
echo "================================================"
echo "Summary:"
echo ""
echo "Before deployment, ensure:"
echo "1. Update CLOUDFLARE_API_TOKEN in GitHub Secrets with proper permissions"
echo "2. Verify CLOUDFLARE_ACCOUNT_ID is correct in GitHub Secrets"
echo "3. Verify 'coh' Pages project exists in Cloudflare dashboard"
echo "4. Run: cd web && npm run build (to create dist/ folder)"
echo ""
echo "Then push a commit to trigger GitHub Actions deployment:"
echo "  git commit --allow-empty -m 'Trigger deployment'"
echo "  git push origin main"
echo ""
