# Media Management Guide

## Overview

All media assets for CypherOfHealing.com are stored locally in `/web/public/images/` and are served via Cloudflare Pages. This eliminates external dependencies and ensures consistent branding with our Harlem Renaissance aesthetic.

## Directory Structure

```
web/public/images/
├── hero/
│   └── hero-main.jpg          (Hero section background)
├── craft/
│   ├── consultation.jpg        (The Consultation card)
│   ├── fade.jpg                (The Fade card)
│   ├── lineup.jpg              (The Line-Up card)
│   └── restoration.jpg         (The Restoration card)
└── products/
    ├── cipher-workbook.jpg     (Cipher Workbook product)
    ├── legacy-journal.jpg      (Legacy Journal product)
    ├── trigger-tracker.jpg     (Trigger Tracker app)
    └── resilience-bundle.jpg   (Resilience Bundle)
```

## Image Specifications

### File Format
- **Format:** JPEG (optimized)
- **Quality:** 85-90 (balance between quality and file size)
- **Max File Size:** 100KB per image (recommended)
- **Total Directory Size:** ~500KB maximum

### Color Palette (Harlem Renaissance Aesthetic)

| Name | Hex | RGB | Usage |
|------|-----|-----|-------|
| Heritage Dark Brown | #2C1810 | (44, 24, 16) | Primary background |
| Tobacco Brown | #704214 | (112, 66, 20) | Secondary backgrounds |
| Deep Brown | #3D2B1F | (61, 43, 31) | Accent borders |
| Near Black | #1A0E09 | (26, 14, 9) | Deep shadows |
| Gold | #C9A84C | (201, 168, 76) | Accent & highlights |
| Ivory | #F5ECD7 | (245, 236, 215) | Light text |
| Parchment | #E8DCBE | (232, 220, 190) | Light backgrounds |

### Image Dimensions

| Section | Dimension | Notes |
|---------|-----------|-------|
| Hero Background | 800x533px | Full-width hero, optimized for sepia effect |
| Craft Cards | 600x400 or 600x900px | Portrait orientation, aspect ratio 3:4 |
| Product Images | 600x600px | Square format for store display |

## How to Update Images

### 1. Replace Hero Image (Homepage Hero Section)

**File Location:** `web/public/images/hero/hero-main.jpg`

**Steps:**
1. Create or find image matching spec above
2. Optimize to 800x533px, quality 85
3. Replace file: `web/public/images/hero/hero-main.jpg`
4. Code reference (no changes needed): [web/src/pages/HomePage.tsx:28](web/src/pages/HomePage.tsx#L28)

**Recommended Content:**
- African American man in contemplative/reflective pose
- Soft, sepia-toned aesthetic
- Professional grooming/wellness focus

---

### 2. Replace Craft Section Images (The Consultation, Fade, Line-Up, Restoration)

**File Locations:** `web/public/images/craft/`

| Card | Filename | Size |
|------|----------|------|
| The Consultation | consultation.jpg | 600x400px |
| The Fade | fade.jpg | 600x900px (portrait) |
| The Line-Up | lineup.jpg | 600x400px |
| The Restoration | restoration.jpg | 600x900px (portrait) |

**Steps:**
1. Create/obtain images for each scene
2. Optimize each to spec dimensions, quality 85
3. Replace files in `web/public/images/craft/`
4. Code reference (no changes needed): [web/src/pages/HomePage.tsx:308-323](web/src/pages/HomePage.tsx#L308-L323)

**Recommended Content:**
- Various grooming/wellness scenarios with African American men
- Professional photography or AI-generated images
- Scenes: consultation, fade cut, line-up detail, restoration/finishing

---

### 3. Replace Product Images (Store)

**File Location:** `web/public/images/products/`

| Product | Filename | Dimension |
|---------|----------|-----------|
| Cipher Workbook | cipher-workbook.jpg | 600x600px |
| Legacy Journal | legacy-journal.jpg | 600x600px |
| Trigger Tracker App | trigger-tracker.jpg | 600x600px |
| Resilience Bundle | resilience-bundle.jpg | 600x600px |

**Steps:**
1. Create/obtain product images
2. Optimize each to 600x600px, quality 85
3. Replace files in `web/public/images/products/`
4. Update database seed (see below) if metadata changes

**Database Integration:**
Update `/src/db/seed.ts` to include image metadata:

```typescript
{
  title: 'Product Name',
  slug: 'product-slug',
  // ... other fields ...
  images: [
    {
      url: '/images/products/filename.jpg',
      alt: 'Descriptive alt text for accessibility',
      isPrimary: true,
    },
  ],
}
```

---

## Database Migration for Product Images

If adding new products with images, run this SQL:

```sql
UPDATE products 
SET images = JSONB_BUILD_ARRAY(
  JSONB_BUILD_OBJECT(
    'url', '/images/products/filename.jpg',
    'alt', 'Descriptive alt text',
    'isPrimary', true
  )
)
WHERE slug = 'product-slug';
```

Migration file: `src/db/migrations/add-product-images.sql`

---

## Image Optimization Tools

### Online Tools (Free)
- **TinyPNG/TinyJPG** - https://tinypng.com (JPEG optimization)
- **Squoosh** - https://squoosh.app (Google's image optimizer)
- **ImageResizer** - https://imageresizer.com (Batch resize)

### Command Line (Local)

**Install ImageMagick:**
```bash
brew install imagemagick  # macOS
apt install imagemagick   # Linux
```

**Resize & Optimize:**
```bash
convert input.jpg -resize 800x533! -quality 85 output.jpg
convert input.jpg -resize 600x600! -quality 85 output.jpg
```

**Batch Process:**
```bash
for file in *.jpg; do
  convert "$file" -resize 600x600! -quality 85 "optimized_$file"
done
```

---

## Deployment Process

### Local Testing
```bash
cd web
npm run build          # Build with new images
npm run dev            # Test locally (http://localhost:5173)
```

### Deploy to Production
```bash
git add web/public/images/
git commit -m "chore: update media assets - [description]"
git push origin main   # Triggers GitHub Actions
```

**Deployment Happens Automatically:**
- GitHub Actions builds frontend
- Vite copies images to `dist/`
- Cloudflare Pages deploys updated site
- Images served from CDN (global, cached)

---

## Image References in Code

### HomePage (Hero & Craft)
- File: `web/src/pages/HomePage.tsx`
- Lines: 28 (hero), 308-323 (craft cards)
- Update paths here if directory structure changes

### StorePage (Product Images)
- File: `web/src/pages/StorePage.tsx`
- Line: 324 (dynamic image rendering)
- Images loaded from database `product.image` field

### Database Seed
- File: `src/db/seed.ts`
- Lines: 91-150 (product definitions)
- Add `images` metadata here for new products

---

## Best Practices

✅ **Do:**
- Keep images square (600x600px) for products
- Use JPEG format for photographs
- Optimize to <100KB per image
- Add descriptive alt text for accessibility
- Use consistent naming: `kebab-case.jpg`
- Test locally before pushing
- Update git commit message with image changes

❌ **Don't:**
- Use external image URLs (CDN only)
- Upload unoptimized/oversized images
- Use PNG for photography (larger files)
- Commit dist/ folder images (auto-generated)
- Forget alt text for SEO & accessibility

---

## Troubleshooting

### Images Not Loading After Deploy
1. **Clear browser cache:** Cmd+Shift+R (hard refresh)
2. **Check Cloudflare cache:** https://dash.cloudflare.com (Purge cache)
3. **Verify file exists:** Check `web/public/images/` locally
4. **Check build output:** Verify images in `web/dist/images/`

### Image Quality Issues
1. Ensure original is high quality (1200x1200px minimum)
2. Reduce quality slider in optimizer (start at 80, adjust up)
3. Use TinyPNG instead of basic JPEG compression
4. Avoid upscaling small images

### File Size Too Large
1. Reduce dimensions first
2. Lower quality to 75-80
3. Use TinyPNG for aggressive compression
4. Consider WebP format (future upgrade)

---

## Future Enhancements

- [ ] Implement WebP format for faster loading
- [ ] Add image lazy-loading for performance
- [ ] Create next-gen image component with srcset
- [ ] Set up image CDN for global serving
- [ ] Implement admin panel for image uploads
- [ ] Add image resizing API

---

## Support & Questions

For image-related issues:
1. Check this guide first
2. Test locally with `npm run dev`
3. Verify file format & dimensions
4. Check browser console for 404s
5. Clear Cloudflare cache if deployed

---

**Last Updated:** April 5, 2026  
**Images Integrated:** Hero (1), Craft (4), Products (4)  
**Total Size:** ~480KB
