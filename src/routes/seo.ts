import { Hono } from 'hono';
import { eq } from 'drizzle-orm';
import { createDb } from '../db';
import { courses, products, events } from '../db/schema';
import type { Env, Variables } from '../types/env';

const seo = new Hono<{ Bindings: Env; Variables: Variables }>();

seo.get('/robots.txt', (c) => {
  return c.text(
    'User-agent: *\nAllow: /\nSitemap: https://cypherofhealing.com/sitemap.xml',
    200,
    { 'Content-Type': 'text/plain; charset=utf-8' }
  );
});

seo.get('/sitemap.xml', async (c) => {
  const baseUrl = 'https://cypherofhealing.com';
  const now = new Date().toISOString();

  const staticPaths = [
    '/', '/about', '/founder', '/booking', '/store',
    '/academy', '/events', '/show', '/books',
  ];

  let dynamicPaths: string[] = [];
  try {
    const db = createDb(c.env.DATABASE_URL ?? c.env.HYPERDRIVE);
    const [publishedCourses, activeProducts, upcomingEvents] = await Promise.all([
      db.select({ slug: courses.slug }).from(courses).where(eq(courses.isPublished, true)),
      db.select({ slug: products.slug }).from(products).where(eq(products.isActive, true)),
      db.select({ slug: events.slug }).from(events).where(eq(events.status, 'scheduled')),
    ]);
    dynamicPaths = [
      ...publishedCourses.map((r) => `/academy/${r.slug}`),
      ...activeProducts.map((r) => `/store/${r.slug}`),
      ...upcomingEvents.map((r) => `/events/${r.slug}`),
    ];
  } catch {
    // DB unavailable — serve static URLs only
  }

  const allPaths = [...staticPaths, ...dynamicPaths];
  const urlEntries = allPaths
    .map((path) => `  <url><loc>${baseUrl}${path}</loc><lastmod>${now}</lastmod></url>`)
    .join('\n');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urlEntries}\n</urlset>`;
  return c.text(xml, 200, { 'Content-Type': 'application/xml; charset=utf-8' });
});

export default seo;
