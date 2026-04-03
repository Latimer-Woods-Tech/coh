import { Context, Next } from 'hono';
import { v4 as uuidv4 } from 'nanoid';

/**
 * Unified API response format for consistency and better DX
 */
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: Record<string, string>;
    timestamp: string;
    requestId: string;
  };
  meta?: {
    timestamp: string;
    requestId: string;
    version: string;
  };
}

/**
 * Response helper for consistent success responses
 */
export function successResponse<T>(data: T, c: Context, { status = 200, message = '' } = {}) {
  const requestId = c.get('requestId') || uuidv4();
  return c.json(
    {
      success: true,
      data,
      meta: {
        timestamp: new Date().toISOString(),
        requestId,
        version: '1.0.0',
      },
    } as ApiResponse<T>,
    status
  );
}

/**
 * Response helper for consistent error responses
 */
export function errorResponse(
  c: Context,
  {
    code = 'INTERNAL_ERROR',
    message = 'An unexpected error occurred',
    status = 500,
    details,
  }: {
    code?: string;
    message?: string;
    status?: number;
    details?: Record<string, string>;
  } = {}
) {
  const requestId = c.get('requestId') || uuidv4();
  return c.json(
    {
      success: false,
      error: {
        code,
        message,
        ...(details && { details }),
        timestamp: new Date().toISOString(),
        requestId,
      },
    } as ApiResponse,
    status
  );
}

/**
 * Middleware to add request tracking and response helpers
 */
export function responseMiddleware() {
  return async (c: Context, next: Next) => {
    const requestId = uuidv4();
    c.set('requestId', requestId);
    c.set('successResponse', (data: any, opts = {}) => successResponse(data, c, opts));
    c.set('errorResponse', (opts = {}) => errorResponse(c, opts));

    // Add custom response headers
    c.header('X-Request-ID', requestId);
    c.header('X-API-Version', '1.0.0');

    await next();
  };
}

/**
 * Validation error formatter for Zod errors
 */
export function formatValidationErrors(errors: Record<string, any>) {
  const formatted: Record<string, string> = {};
  for (const field in errors) {
    if (errors[field]?.message) {
      formatted[field] = errors[field].message;
    }
  }
  return formatted;
}
