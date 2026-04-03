import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { eq, desc, and } from 'drizzle-orm';
import { createDb } from '../db';
import { products, productCategories, orders, orderItems, activityLog } from '../db/schema';
import { authMiddleware, optionalAuth } from '../middleware/auth';
import type { Env, Variables } from '../types/env';

const store = new Hono<{ Bindings: Env; Variables: Variables }>();

// ─── Public: List products ───
store.get('/products', async (c) => {
  const db = createDb(c.env.HYPERDRIVE);
  const category = c.req.query('category');

  const query = db.select().from(products).where(eq(products.isActive, true)).orderBy(products.sortOrder);
  const allProducts = await query;

  return c.json({ products: category
    ? allProducts.filter(p => p.categoryId === category)
    : allProducts
  });
});

// ─── Public: Get single product ───
store.get('/products/:slug', async (c) => {
  const slug = c.req.param('slug');
  const db = createDb(c.env.HYPERDRIVE);

  const [product] = await db.select().from(products).where(eq(products.slug, slug)).limit(1);
  if (!product) return c.json({ error: 'Product not found' }, 404);
  return c.json({ product });
});

// ─── Public: List categories ───
store.get('/categories', async (c) => {
  const db = createDb(c.env.HYPERDRIVE);
  const categories = await db.select().from(productCategories).orderBy(productCategories.sortOrder);
  return c.json({ categories });
});

// ─── Auth: Create order (checkout) ───
store.post('/orders', authMiddleware, zValidator('json', z.object({
  items: z.array(z.object({
    productId: z.string().uuid(),
    quantity: z.number().int().min(1),
  })).min(1),
  shippingAddress: z.object({
    line1: z.string(), line2: z.string().optional(),
    city: z.string(), state: z.string(), zip: z.string(), country: z.string().default('US'),
  }).optional(),
  couponCode: z.string().optional(),
  sourceAppointmentId: z.string().uuid().optional(), // cross-sell tracking
})), async (c) => {
  const userId = c.get('userId')!;
  const { items, shippingAddress, couponCode, sourceAppointmentId } = c.req.valid('json');
  const db = createDb(c.env.HYPERDRIVE);

  // Fetch products and calculate totals
  const productIds = items.map(i => i.productId);
  const fetchedProducts = await db.select().from(products).where(eq(products.isActive, true));
  const productMap = new Map(fetchedProducts.filter(p => productIds.includes(p.id)).map(p => [p.id, p]));

  let subtotal = 0;
  const lineItems = items.map(item => {
    const product = productMap.get(item.productId);
    if (!product) throw new Error(`Product ${item.productId} not found`);
    const lineTotal = Number(product.price) * item.quantity;
    subtotal += lineTotal;
    return { productId: item.productId, quantity: item.quantity, unitPrice: product.price, totalPrice: String(lineTotal) };
  });

  // Generate order number: COH-YYYYMMDD-XXXX
  const now = new Date();
  const datePart = now.toISOString().slice(0, 10).replace(/-/g, '');
  const randomPart = Math.random().toString(36).substring(2, 6).toUpperCase();
  const orderNumber = `COH-${datePart}-${randomPart}`;

  // TODO: Apply coupon discount
  // TODO: Calculate tax via Stripe Tax
  // TODO: Calculate shipping

  const [order] = await db.insert(orders).values({
    userId,
    orderNumber,
    subtotal: String(subtotal),
    total: String(subtotal),
    shippingAddress,
    couponCode,
    sourceAppointmentId,
    status: 'pending',
  }).returning();

  // Insert line items
  for (const item of lineItems) {
    await db.insert(orderItems).values({ orderId: order.id, ...item });
  }

  // Log activity
  await db.insert(activityLog).values({
    userId,
    action: 'order.created',
    resourceType: 'order',
    resourceId: order.id,
    metadata: { orderNumber, total: subtotal, itemCount: items.length, sourceAppointmentId },
  });

  // TODO: Create Stripe Checkout Session
  // TODO: Send order confirmation email

  return c.json({ order, checkoutUrl: 'TODO_STRIPE_CHECKOUT_URL' }, 201);
});

// ─── Auth: Get my orders ───
store.get('/orders', authMiddleware, async (c) => {
  const userId = c.get('userId')!;
  const db = createDb(c.env.HYPERDRIVE);

  const myOrders = await db.select().from(orders)
    .where(eq(orders.userId, userId))
    .orderBy(desc(orders.createdAt))
    .limit(20);

  return c.json({ orders: myOrders });
});

export default store;
