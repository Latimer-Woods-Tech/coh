import { z } from 'zod';
import { ApiErrors } from './errors';

/**
 * Safe validation function that returns errors in ApiError format
 */
export async function validateData<T>(schema: z.ZodSchema<T>, data: any): Promise<T> {
  try {
    return await schema.parseAsync(data);
  } catch (err) {
    if (err instanceof z.ZodError) {
      const details: Record<string, string> = {};
      err.errors.forEach((error) => {
        const path = error.path.join('.');
        details[path] = error.message;
      });
      throw ApiErrors.validationError(details);
    }
    throw err;
  }
}

/**
 * Common reusable validation schemas
 */
export const CommonSchemas = {
  uuid: z.string().uuid('Must be a valid UUID'),
  email: z.string().email('Invalid email address'),
  slug: z.string().min(1).regex(/^[a-z0-9-]+$/, 'Slug must contain only lowercase letters, numbers, and hyphens'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain an uppercase letter')
    .regex(/[a-z]/, 'Password must contain a lowercase letter')
    .regex(/[0-9]/, 'Password must contain a number'),
  phone: z.string().regex(/^\+?[1-9]\d{1,14}$/, 'Invalid phone number'),
  url: z.string().url('Invalid URL'),
  dateString: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
  timeString: z.string().regex(/^\d{2}:\d{2}$/, 'Time must be in HH:MM format'),
  isoTimestamp: z.string().datetime('Invalid ISO timestamp'),
};

/**
 * Pagination schemas and helpers
 */
export const PaginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  pages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export function createPaginationMeta(page: number, limit: number, total: number): PaginationMeta {
  const pages = Math.ceil(total / limit);
  return {
    page,
    limit,
    total,
    pages,
    hasNext: page < pages,
    hasPrev: page > 1,
  };
}

export interface PaginatedResponse<T> {
  items: T[];
  pagination: PaginationMeta;
}

/**
 * Common filter schemas
 */
export const FilterSchemas = {
  search: z.string().optional(),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).default('asc'),
  status: z.enum(['active', 'inactive', 'archived']).optional(),
};

/**
 * Sanitization utilities for security
 */
export const Sanitizers = {
  string: (input: string) => input?.trim() || '',
  
  email: (input: string) => input?.trim().toLowerCase() || '',

  slug: (input: string) =>
    input
      ?.toLowerCase()
      .trim()
      .replace(/[^a-z0-9-]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '') || '',

  html: (input: string) =>
    input
      ?.replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;') || '',
};
