import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { eq, desc, and, count } from 'drizzle-orm';
import { createDb } from '../db';
import { products, productCategories, orders, coupons, activityLog } from '../db/schema';
import { authMiddleware, adminOnly } from '../middleware/auth';
import type { Env, Variables } from '../types/env';

const adminStore = new Hono<{ Bindings: Env; Variables: Variables }>();

adminStore.use('*', authMiddleware);
adminStore.use('*', adminOnly);

// ─── Products ───

adminStore.get('/products', async (c) => {
  const db = createDb(c.env.DATABASE_URL ?? c.env.HYPERDRIVE);
  const page = Math.max(1, parseInt(c.req.query('page') ?? '1'));
  const limit = Math.min(100, Math.max(1, parseInt(c.req.query('limit') ?? '20')));
  const offset = (page - 1) * limit;

  const [{ total }] = await db.select({ total: count() }).from(products);
  const data = await db.select().from(products)
    .orderBy(desc(products.createdAt))
    .limit(limit)
    .offset(offset);

  return c.json({ data, total: Number(total), page, limit, pages: Math.ceil(Number(total) / limit) });
});

adminStore.post('/products', zValidator('json', z.object({
  categoryId: z.string().uuid().optional(),
  name: z.string().min(1),
  slug: z.string().min(1),
  description: z.string().optional(),
  shortDescription: z.string().optional(),
  type: z.enum(['physical', 'digital', 'book']).default('physical'),
  price: z.string(),
  compareAtPrice: z.string().optional(),
  stockQuantity: z.number().int().min(0).default(0),
  isFeatured: z.boolean().default(false),
  sortOrder: z.number().int().default(0),
})), async (c) => {
  const body = c.req.valid('json');
  const db = createDb(c.env.DATABASE_URL ?? c.env.HYPERDRIVE);

  const [product] = await db.insert(products).values(body).returning();

  await db.insert(activityLog).values({
    userId: c.get('userId')!,
    action: 'admin.product.created',
    resourceType: 'product',
    resourceId: product.id,
    metadata: { name: product.name },
  });

  return c.json({ product }, 201);
});

adminStore.put('/products/:id', zValidator('json', z.object({
  name: z.string().optional(),
  description: z.string().optional(),
  shortDescription: z.string().optional(),
  price: z.string().optional(),
  compareAtPrice: z.string().optional(),
  stockQuantity: z.number().int().min(0).optional(),
  isActive: z.boolean().optional(),
  isFeatured: z.boolean().optional(),
  sortOrder: z.number().int().optional(),
  stripePriceId: z.string().optional(),
  stripeProductId: z.string().optional(),
})), async (c) => {
  const id = c.req.param('id');
  const body = c.req.valid('json');
  const db = createDb(c.env.DATABASE_URL ?? c.env.HYPERDRIVE);

  const [updated] = await db.update(products)
    .set({ ...body, updatedAt: new Date() })
    .where(eq(products.id, id))
    .returning();

  if (!updated) return c.json({ error: 'Product not found' }, 404);
  return c.json({ product: updated });
});

adminStore.delete('/products/:id', async (c) => {
  const id = c.req.param('id');
  const db = createDb(c.env.DATABASE_URL ?? c.env.HYPERDRIVE);

  const [updated] = await db.update(products)
    .set({ isActive: false, updatedAt: new Date() })
    .where(eq(products.id, id))
    .returning({ id: products.id });

  if (!updated) return c.json({ error: 'Product not found' }, 404);
  return c.json({ success: true });
});

// ─── Categories ───

adminStore.post('/categories', zValidator('json', z.object({
  name: z.string().min(1),
  slug: z.string().min(1),
  description: z.string().optional(),
  sortOrder: z.number().int().default(0),
})), async (c) => {
  const body = c.req.valid('json');
  const db = createDb(c.env.DATABASE_URL ?? c.env.HYPERDRIVE);

  const [category] = await db.insert(productCategories).values(body).returning();
  return c.json({ category }, 201);
});

// ─── Orders ───

adminStore.get('/orders', async (c) => {
  const db = createDb(c.env.DATABASE_URL ?? c.env.HYPERDRIVE);
  const status = c.req.query('status');
  const page = Math.max(1, parseInt(c.req.query('page') ?? '1'));
  const limit = Math.min(100, Math.max(1, parseInt(c.req.query('limit') ?? '20')));
  const offset = (page - 1) * limit;

  const where = status ? eq(orders.status, status as any) : undefined;
  const [{ total }] = await db.select({ total: count() }).from(orders).where(where);
  const data = await db.select().from(orders)
    .where(where)
    .orderBy(desc(orders.createdAt))
    .limit(limit)
    .offset(offset);

  return c.json({ data, total: Number(total), page, limit, pages: Math.ceil(Number(total) / limit) });
});

adminStore.patch('/orders/:id', zValidator('json', z.object({
  status: z.enum(['pending', 'paid', 'processing', 'shipped', 'delivered', 'refunded', 'cancelled']).optional(),
  trackingNumber: z.string().optional(),
})), async (c) => {
  const id = c.req.param('id');
  const updates = c.req.valid('json');
  const db = createDb(c.env.DATABASE_URL ?? c.env.HYPERDRIVE);

  const [updated] = await db.update(orders)
    .set({ ...updates, updatedAt: new Date() })
    .where(eq(orders.id, id))
    .returning();

  if (!updated) return c.json({ error: 'Order not found' }, 404);

  await db.insert(activityLog).values({
    userId: c.get('userId')!,
    action: `admin.order.${updates.status ?? 'updated'}`,
    resourceType: 'order',
    resourceId: id,
    metadata: updates,
  });

  return c.json({ order: updated });
});

// ─── Coupons ───

adminStore.get('/coupons', async (c) => {
  const db = createDb(c.env.DATABASE_URL ?? c.env.HYPERDRIVE);
  const data = await db.select().from(coupons).orderBy(desc(coupons.createdAt));
  return c.json({ data });
});

adminStore.post('/coupons', zValidator('json', z.object({
  code: z.string().min(1).max(50).transform(v => v.toUpperCase()),
  description: z.string().optional(),
  discountType: z.enum(['percentage', 'fixed']).default('percentage'),
  discountValue: z.string(),
  minPurchase: z.string().optional(),
  maxUses: z.number().int().positive().optional(),
  appliesToStream: z.enum(['store', 'courses', 'events', 'all']).default('all'),
  expiresAt: z.string().datetime().optional(),
})), async (c) => {
  const body = c.req.valid('json');
  const db = createDb(c.env.DATABASE_URL ?? c.env.HYPERDRIVE);

  const [coupon] = await db.insert(coupons).values({
    ...body,
    expiresAt: body.expiresAt ? new Date(body.expiresAt) : undefined,
  }).returning();

  return c.json({ coupon }, 201);
});

adminStore.put('/coupons/:id', zValidator('json', z.object({
  description: z.string().optional(),
  discountValue: z.string().optional(),
  minPurchase: z.string().optional(),
  maxUses: z.number().int().positive().optional(),
  isActive: z.boolean().optional(),
  expiresAt: z.string().datetime().optional(),
})), async (c) => {
  const id = c.req.param('id');
  const body = c.req.valid('json');
  const db = createDb(c.env.DATABASE_URL ?? c.env.HYPERDRIVE);

  const [updated] = await db.update(coupons)
    .set({ ...body, expiresAt: body.expiresAt ? new Date(body.expiresAt) : undefined })
    .where(eq(coupons.id, id))
    .returning();

  if (!updated) return c.json({ error: 'Coupon not found' }, 404);
  return c.json({ coupon: updated });
});

export default adminStore;
