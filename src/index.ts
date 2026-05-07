import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { prettyJSON } from 'hono/pretty-json';
import { nanoid } from 'nanoid';
import type { Env, Variables } from './types/env';
import { responseMiddleware, errorResponse } from './middleware/response';
import { createErrorHandler, ErrorCodes } from './middleware/errors';

import auth from './routes/auth';
import booking from './routes/booking';
import store from './routes/store';
import academy from './routes/academy';
import events from './routes/events';
import adminCourse from './routes/admin-course';
import adminSeed from './routes/admin-seed';
import comms from './routes/communications';
import adminAudio from './routes/admin-audio';
import webhooks from './routes/webhooks';

const app = new Hono<{ Bindings: Env; Variables: Variables }>();

// ─── Global middleware ───
app.use('*', logger());
app.use('*', prettyJSON());
app.use('*', responseMiddleware());
app.use('*', async (c, next) => {
  const corsMiddleware = cors({
    origin: c.env.CORS_ORIGIN,
    allowMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization', 'X-Request-ID'],
    exposeHeaders: ['X-Request-Id', 'X-API-Version', 'X-RateLimit-Limit', 'X-RateLimit-Remaining'],
    maxAge: 86400,
  });
  return corsMiddleware(c, next);
});

// ─── Health check / Root endpoint ───
app.get('/', (c) => {
  return c.json({
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
      requestId: nanoid(),
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
        header: 'Authorization: Bearer <token>',
      },
      endpoints: {
        booking: {
          description: 'Booking service for consultations',
          methods: ['GET /slots', 'POST /book', 'GET /my-bookings'],
        },
        store: {
          description: 'E-commerce store for products',
          methods: ['GET /products', 'POST /cart', 'POST /checkout'],
        },
        academy: {
          description: 'Online learning platform',
          methods: ['GET /courses', 'GET /modules/:courseId', 'POST /enroll'],
        },
        events: {
          description: 'Events and webinars',
          methods: ['GET /events', 'POST /register'],
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
      },
    },
  });
});

// ─── API Routes ───
// ─── Route Mounting ───
app.route('/api/auth', auth);
app.route('/api/booking', booking);
app.route('/api/store', store);
app.route('/api/academy', academy);
app.route('/api/events', events);
app.route('/api/webhooks', webhooks);
app.route('/api/admin', adminCourse);
app.route('/api/admin/seed', adminSeed);
app.route('/api/comms', comms);
app.route('/api/admin/audio', adminAudio);

// ─── 404 handler ───
app.notFound((c) => {
  return errorResponse(c, {
    code: ErrorCodes.NOT_FOUND,
    message: 'Endpoint not found. The path you seek does not exist.',
    status: 404,
  });
});

// ─── Error handler ───
app.onError((err, c) => createErrorHandler(c.env.ENVIRONMENT === 'development')(err, c));

export default app;
