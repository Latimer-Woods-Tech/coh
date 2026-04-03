import { Context } from 'hono';
import { errorResponse } from './response';

/**
 * Custom error class for API errors with consistent formatting
 */
export class ApiError extends Error {
  constructor(
    public code: string,
    message: string,
    public status: number = 500,
    public details?: Record<string, string>
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

/**
 * Common API error codes and messages
 */
export const ErrorCodes = {
  // 4xx Client Errors
  BAD_REQUEST: 'BAD_REQUEST',
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  NOT_FOUND: 'NOT_FOUND',
  CONFLICT: 'CONFLICT',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  UNPROCESSABLE_ENTITY: 'UNPROCESSABLE_ENTITY',
  RATE_LIMITED: 'RATE_LIMIT_EXCEEDED',

  // 5xx Server Errors
  INTERNAL_ERROR: 'INTERNAL_SERVER_ERROR',
  SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE',
  DATABASE_ERROR: 'DATABASE_ERROR',
  EXTERNAL_SERVICE_ERROR: 'EXTERNAL_SERVICE_ERROR',
} as const;

/**
 * Common error factory functions for DX
 */
export const ApiErrors = {
  badRequest: (message = 'Bad request', details?: Record<string, string>) =>
    new ApiError(ErrorCodes.BAD_REQUEST, message, 400, details),

  unauthorized: (message = 'Unauthorized') =>
    new ApiError(ErrorCodes.UNAUTHORIZED, message, 401),

  forbidden: (message = 'Access forbidden') =>
    new ApiError(ErrorCodes.FORBIDDEN, message, 403),

  notFound: (resource = 'Resource') =>
    new ApiError(ErrorCodes.NOT_FOUND, `${resource} not found`, 404),

  conflict: (message = 'Resource conflict') =>
    new ApiError(ErrorCodes.CONFLICT, message, 409),

  validationError: (details: Record<string, string>, message = 'Validation failed') =>
    new ApiError(ErrorCodes.VALIDATION_ERROR, message, 422, details),

  rateLimited: () =>
    new ApiError(ErrorCodes.RATE_LIMITED, 'Rate limit exceeded. Please try again later.', 429),

  internalError: (message = 'Internal server error') =>
    new ApiError(ErrorCodes.INTERNAL_ERROR, message, 500),

  databaseError: (message = 'Database operation failed') =>
    new ApiError(ErrorCodes.DATABASE_ERROR, message, 500),

  externalServiceError: (service = 'service') =>
    new ApiError(
      ErrorCodes.EXTERNAL_SERVICE_ERROR,
      `${service} is currently unavailable. Please try again later.`,
      503
    ),
};

/**
 * Global error handler for Hono
 */
export function createErrorHandler(isDev = false) {
  return (err: Error | ApiError, c: Context) => {
    console.error('API Error:', err);

    if (err instanceof ApiError) {
      return errorResponse(c, {
        code: err.code,
        message: err.message,
        status: err.status,
        details: err.details,
      });
    }

    // Handle Zod validation errors
    if (err.message.includes('Zod')) {
      return errorResponse(c, {
        code: ErrorCodes.VALIDATION_ERROR,
        message: 'Request validation failed',
        status: 422,
      });
    }

    // Default error response
    return errorResponse(c, {
      code: ErrorCodes.INTERNAL_ERROR,
      message: isDev ? err.message : 'An unexpected error occurred',
      status: 500,
    });
  };
}

/**
 * Async error wrapper for route handlers
 */
export function asyncHandler(handler: (c: Context) => Promise<any>) {
  return async (c: Context) => {
    try {
      return await handler(c);
    } catch (err) {
      if (err instanceof ApiError) {
        return errorResponse(c, {
          code: err.code,
          message: err.message,
          status: err.status,
          details: err.details,
        });
      }
      throw err;
    }
  };
}
