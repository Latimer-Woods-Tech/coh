import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { eq, and, desc, count, sql } from 'drizzle-orm';
import { createDb } from '../db';
import { episodes, users, activityLog } from '../db/schema';
import { authMiddleware, optionalAuth, adminOnly } from '../middleware/auth';
import type { Env, Variables } from '../types/env';

const show = new Hono<{ Bindings: Env; Variables: Variables }>();

// ─── Public: List published episodes ───
show.get('/', async (c) => {
  const db = createDb(c.env.HYPERDRIVE);
  const page = Math.max(1, parseInt(c.req.query('page') ?? '1'));
  const limit = Math.min(100, Math.max(1, parseInt(c.req.query('limit') ?? '20')));
  const offset = (page - 1) * limit;

  const where = eq(episodes.status, 'published');
  const [{ total }] = await db.select({ total: count() }).from(episodes).where(where);
  const data = await db
    .select({
      id: episodes.id,
      title: episodes.title,
      slug: episodes.slug,
      description: episodes.description,
      episodeNumber: episodes.episodeNumber,
      season: episodes.season,
      thumbnailUrl: episodes.thumbnailUrl,
      durationSeconds: episodes.durationSeconds,
      guestName: episodes.guestName,
      membershipGated: episodes.membershipGated,
      publishedAt: episodes.publishedAt,
      viewCount: episodes.viewCount,
    })
    .from(episodes)
    .where(where)
    .orderBy(desc(episodes.publishedAt))
    .limit(limit)
    .offset(offset);

  return c.json({ data, total: Number(total), page, limit, pages: Math.ceil(Number(total) / limit) });
});

// ─── Public: Get single episode (gated stream UID hidden if not entitled) ───
show.get('/:slug', optionalAuth, async (c) => {
  const slug = c.req.param('slug');
  if (!slug) return c.json({ error: 'Episode slug required' }, 400);
  const db = createDb(c.env.HYPERDRIVE);

  const [episode] = await db.select().from(episodes)
    .where(and(eq(episodes.slug, slug), eq(episodes.status, 'published')))
    .limit(1);
  if (!episode) return c.json({ error: 'Episode not found' }, 404);

  let entitled = !episode.membershipGated;
  if (episode.membershipGated) {
    const userId = c.get('userId');
    if (userId) {
      const [user] = await db.select({ membershipTier: users.membershipTier })
        .from(users).where(eq(users.id, userId)).limit(1);
      if (user && (user.membershipTier === 'vip' || user.membershipTier === 'inner_circle')) {
        entitled = true;
      }
    }
  }

  // Hide the Stream UID (the embed URL fragment) unless the user is entitled
  const safe = {
    ...episode,
    streamVideoUid: entitled ? episode.streamVideoUid : null,
    audioUrl: entitled ? episode.audioUrl : null,
  };

  return c.json({ episode: safe, entitled });
});

// ─── Public: Increment view count (called by frontend on play) ───
show.post('/:slug/view', async (c) => {
  const slug = c.req.param('slug');
  if (!slug) return c.json({ error: 'Episode slug required' }, 400);
  const db = createDb(c.env.HYPERDRIVE);

  await db.update(episodes)
    .set({ viewCount: sql`${episodes.viewCount} + 1` })
    .where(and(eq(episodes.slug, slug), eq(episodes.status, 'published')));

  return c.json({ ok: true });
});

// ─── Admin: Create episode ───
show.post('/', authMiddleware, adminOnly, zValidator('json', z.object({
  title: z.string().min(1),
  slug: z.string().min(1),
  description: z.string().optional(),
  episodeNumber: z.number().int().positive(),
  season: z.number().int().positive().default(1),
  streamVideoUid: z.string().optional(),
  thumbnailUrl: z.string().url().optional(),
  durationSeconds: z.number().int().positive().optional(),
  audioUrl: z.string().url().optional(),
  showNotes: z.string().optional(),
  guestName: z.string().optional(),
  guestBio: z.string().optional(),
  membershipGated: z.boolean().default(false),
})), async (c) => {
  const body = c.req.valid('json');
  const db = createDb(c.env.HYPERDRIVE);

  const [episode] = await db.insert(episodes).values({ ...body, status: 'draft' }).returning();

  await db.insert(activityLog).values({
    userId: c.get('userId')!,
    action: 'admin.episode.created',
    resourceType: 'episode',
    resourceId: episode.id,
    metadata: { title: episode.title, episodeNumber: episode.episodeNumber },
  });

  return c.json({ episode }, 201);
});

// ─── Admin: Update episode ───
show.put('/:id', authMiddleware, adminOnly, zValidator('json', z.object({
  title: z.string().optional(),
  description: z.string().optional(),
  streamVideoUid: z.string().optional(),
  thumbnailUrl: z.string().url().optional(),
  durationSeconds: z.number().int().positive().optional(),
  audioUrl: z.string().url().optional(),
  showNotes: z.string().optional(),
  guestName: z.string().optional(),
  guestBio: z.string().optional(),
  membershipGated: z.boolean().optional(),
})), async (c) => {
  const id = c.req.param('id');
  const body = c.req.valid('json');
  const db = createDb(c.env.HYPERDRIVE);

  const [updated] = await db.update(episodes)
    .set({ ...body, updatedAt: new Date() })
    .where(eq(episodes.id, id))
    .returning();

  if (!updated) return c.json({ error: 'Episode not found' }, 404);
  return c.json({ episode: updated });
});

// ─── Admin: Publish / unpublish ───
show.post('/:id/publish', authMiddleware, adminOnly, zValidator('json', z.object({
  publish: z.boolean(),
})), async (c) => {
  const id = c.req.param('id');
  const { publish } = c.req.valid('json');
  const db = createDb(c.env.HYPERDRIVE);

  const [updated] = await db.update(episodes)
    .set({
      status: publish ? 'published' : 'draft',
      publishedAt: publish ? new Date() : null,
      updatedAt: new Date(),
    })
    .where(eq(episodes.id, id))
    .returning();

  if (!updated) return c.json({ error: 'Episode not found' }, 404);

  await db.insert(activityLog).values({
    userId: c.get('userId')!,
    action: publish ? 'admin.episode.published' : 'admin.episode.unpublished',
    resourceType: 'episode',
    resourceId: id,
  });

  return c.json({ episode: updated });
});

export default show;
