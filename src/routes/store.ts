import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { eq, desc, and } from 'drizzle-orm';
import Stripe from 'stripe';
import { createDb } from '../db';
import { products, productCategories, orders, orderItems, activityLog, users, coupons } from '../db/schema';
import { authMiddleware } from '../middleware/auth';
import { sendEmail, orderConfirmationEmail } from '../utils/email';
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

// ─── Public: Validate coupon ───
store.post('/validate-coupon', zValidator('json', z.object({
  code: z.string().min(1).max(50),
  stream: z.enum(['store', 'courses', 'events', 'all']).optional(),
})), async (c) => {
  const { code, stream } = c.req.valid('json');
  const db = createDb(c.env.HYPERDRIVE);

  const [coupon] = await db.select().from(coupons)
    .where(and(eq(coupons.code, code.toUpperCase()), eq(coupons.isActive, true)))
    .limit(1);

  if (!coupon) return c.json({ valid: false, error: 'Coupon not found' }, 404);
  if (coupon.expiresAt && new Date(coupon.expiresAt) < new Date()) {
    return c.json({ valid: false, error: 'Coupon has expired' }, 410);
  }
  if (coupon.maxUses && Number(coupon.currentUses) >= coupon.maxUses) {
    return c.json({ valid: false, error: 'Coupon has reached its usage limit' }, 410);
  }
  if (stream && coupon.appliesToStream !== 'all' && coupon.appliesToStream !== stream) {
    return c.json({ valid: false, error: `Coupon is not valid for ${stream}` }, 422);
  }

  return c.json({
    valid: true,
    code: coupon.code,
    discountType: coupon.discountType,
    discountValue: coupon.discountValue,
    minPurchase: coupon.minPurchase,
    description: coupon.description,
  });
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
  const stripe = new Stripe(c.env.STRIPE_SECRET_KEY);

  try {
    // Fetch user
    const user = await db.select().from(users).where(eq(users.id, userId)).limit(1);
    if (!user.length) return c.json({ error: 'User not found' }, 404);
    const currentUser = user[0];

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

    // Apply coupon discount
    let discountAmount = 0;
    if (couponCode) {
      const [coupon] = await db.select().from(coupons)
        .where(and(eq(coupons.code, couponCode.toUpperCase()), eq(coupons.isActive, true)))
        .limit(1);

      if (coupon &&
        !(coupon.expiresAt && new Date(coupon.expiresAt) < new Date()) &&
        !(coupon.maxUses && Number(coupon.currentUses) >= coupon.maxUses) &&
        (coupon.appliesToStream === 'all' || coupon.appliesToStream === 'store') &&
        !(coupon.minPurchase && subtotal < Number(coupon.minPurchase))
      ) {
        discountAmount = coupon.discountType === 'percentage'
          ? subtotal * (Number(coupon.discountValue) / 100)
          : Math.min(Number(coupon.discountValue), subtotal);
        discountAmount = Math.round(discountAmount * 100) / 100;

        await db.update(coupons)
          .set({ currentUses: (Number(coupon.currentUses) + 1) })
          .where(eq(coupons.id, coupon.id));
      }
    }

    const total = Math.max(0, subtotal - discountAmount);
    // TODO: Calculate tax via Stripe Tax
    // TODO: Calculate shipping

    let stripeCustomerId = currentUser.stripeCustomerId;
    if (!stripeCustomerId) {
      const customer = await stripe.customers.create({
        email: currentUser.email,
        name: currentUser.name,
        phone: currentUser.phone ?? undefined,
        metadata: {
          userId: currentUser.id,
          app: 'coh',
        },
      });

      stripeCustomerId = customer.id;
      await db.update(users)
        .set({ stripeCustomerId, updatedAt: new Date() })
        .where(eq(users.id, currentUser.id));
    }

    const [order] = await db.insert(orders).values({
      userId,
      orderNumber,
      subtotal: String(subtotal),
      discountAmount: String(discountAmount),
      total: String(total),
      shippingAddress,
      couponCode: couponCode ? couponCode.toUpperCase() : undefined,
      sourceAppointmentId,
      status: 'pending',
    }).returning();

    const hasPhysicalItems = items.some((item) => productMap.get(item.productId)?.type === 'physical');
    const stripeLineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = lineItems.map((item) => {
      const product = productMap.get(item.productId)!;
      const unitAmount = Math.round(Number(item.unitPrice) * 100);

      if (product.stripePriceId) {
        return {
          price: product.stripePriceId,
          quantity: item.quantity,
        };
      }

      return {
        price_data: {
          currency: 'usd',
          unit_amount: unitAmount,
          product_data: {
            name: product.name,
            description: product.shortDescription ?? product.description ?? undefined,
            images: Array.isArray(product.images)
              ? product.images
                  .map((image) => String((image as Record<string, unknown>).url ?? ''))
                  .filter(Boolean)
              : undefined,
          },
        },
        quantity: item.quantity,
      };
    });

    const appOrigin = c.env.CORS_ORIGIN || 'https://cypherofhealing.com';
    const checkoutSession = await stripe.checkout.sessions.create({
      mode: 'payment',
      customer: stripeCustomerId,
      client_reference_id: order.id,
      line_items: stripeLineItems,
      success_url: `${appOrigin}/store?checkout=success&order=${order.id}`,
      cancel_url: `${appOrigin}/store?checkout=cancelled&order=${order.id}`,
      metadata: {
        orderId: order.id,
        orderNumber,
        userId,
        sourceAppointmentId: sourceAppointmentId ?? '',
      },
      phone_number_collection: {
        enabled: true,
      },
      shipping_address_collection: hasPhysicalItems
        ? {
            allowed_countries: ['US', 'CA'],
          }
        : undefined,
    });

    await db.update(orders)
      .set({ stripeCheckoutSessionId: checkoutSession.id, updatedAt: new Date() })
      .where(eq(orders.id, order.id));

    // Insert line items
    const itemsToInsert = [];
    for (const item of lineItems) {
      const product = productMap.get(item.productId);
      itemsToInsert.push({
        name: product!.name,
        quantity: item.quantity,
        price: Number(item.unitPrice).toFixed(2),
      });
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

    // Send order confirmation email
    const emailTemplate = orderConfirmationEmail({
      userName: currentUser.name,
      orderNumber,
      items: itemsToInsert,
      total: Number(subtotal).toFixed(2),
      checkoutUrl: checkoutSession.url ?? `${appOrigin}/store?checkout=resume&order=${order.id}`,
    });

    await sendEmail(c.env.RESEND_API_KEY, {
      to: currentUser.email,
      subject: emailTemplate.subject,
      html: emailTemplate.html,
      text: emailTemplate.text,
    });

    return c.json({ order, checkoutUrl: checkoutSession.url }, 201);
  } catch (error) {
    return c.json({ error: 'Failed to create order' }, 500);
  }
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
