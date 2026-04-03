import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { prettyJSON } from 'hono/pretty-json';
import type { Env, Variables } from './types/env';
import { responseMiddleware, errorResponse } from './middleware/response';
import { createErrorHandler, ErrorCodes } from './middleware/errors';

import booking from './routes/booking';
import store from './routes/store';
import academy from './routes/academy';
import events from './routes/events';

const app = new Hono<{ Bindings: Env; Variables: Variables }>();
const isDev = process.env.ENVIRONMENT === 'development';

// ─── Global middleware ───
app.use('*', logger());
app.use('*', prettyJSON());
app.use('*', responseMiddleware());
app.use('*', async (c, next) => {
  const corsMiddleware = cors({
    origin: c.env.CORS_ORIGIN || '*',
    allowMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization', 'X-Request-ID'],
    exposeHeaders: ['X-Request-Id', 'X-API-Version', 'X-RateLimit-Limit', 'X-RateLimit-Remaining'],
    maxAge: 86400,
  });
  return corsMiddleware(c, next);
});
success: true,
    data: {
      name: 'CypherOfHealing API',
      version: '1.0.0',
      status: 'operational',
      tagline: 'The outer is a reflection of the inner.',
      documentation: '/api/docs',
      endpoints: {
        booking: '/api/booking',
        store: '/api/store',
        academy: '/api/academy',
        events: '/api/events',
      },
    },
    meta: {
      timestamp: new Date().toISOString(),
      requestId: c.get('requestId'),
      version: '1.0.0',
    },
  });
});

// ─── API Documentation endpoint ───
app.get('/api/docs', (c) => {
  return c.json({
    success: true,
    data: {
      title: 'CypherOfHealing API',
      version: '1.0.0',
      description: 'Five-stream personal brand platform API',
      baseUrl: '/api',
      authentication: {
        type: 'Bearer JWT',
        header: '
    success: true,
    data: { received: true },
  });
});

// ─── 404 handler ───
app.notFound((c) => {
  return errorResponse(c, {
    code: ErrorCodes.NOT_FOUND,
    message: 'Endpoint not found. The path you seek does not exist.',
    status: 404,
  });
});

// ─── Error handler ───
app.onError(createErrorHandler(isDev)         methods: ['GET /events', 'POST /registrations'],
        },
      },
      responseFormat: {
        success: {
          success: 'boolean',
          data: 'object | array',
          meta: 'object',
        },
        error: {
          success: 'false',
          error: {
            code: 'string',
            message: 'string',
            details: 'object | undefined',
            timestamp: 'ISO 8601',
            requestId: 'uuid',
          },
        },
      }
      booking: '/api/booking',
      store: '/api/store',
      academy: '/api/academy',
      events: '/api/events',
    },
  });
});

// ─── Mount route modules ───
// Stream 1: The Chair
app.route('/api/booking', booking);

// Stream 2: The Vault
app.route('/api/store', store);

// Stream 3: The Academy
app.route('/api/academy', academy);

// Stream 4 & 5: The Stage + The Inner Circle
app.route('/api/events', events);

// ─── Stripe Webhooks (handles payments across ALL streams) ───
app.post('/api/webhooks/stripe', async (c) => {
  // TODO: Verify Stripe webhook signature
  // TODO: Handle checkout.session.completed → finalize orders, enrollments, event registrations
  // TODO: Handle invoice.payment_succeeded → update subscriptions
  // TODO: Handle invoice.payment_failed → notify user, update subscription status
  // TODO: Handle customer.subscription.deleted → downgrade membership
  return c.json({ received: true });
});

// ─── 404 handler ───
app.notFound((c) => {
  return c.json({
    error: 'Not found',
    message: 'The path you seek does not exist. Perhaps the cipher has yet to be decoded.',
  }, 404);
});

// ─── Error handler ───
app.onError((err, c) => {
  console.error('Unhandled error:', err);
  return c.json({
    error: 'Internal server error',
    message: c.env.ENVIRONMENT === 'development' ? err.message : 'Something went wrong.',
  }, 500);
});

export default app;
