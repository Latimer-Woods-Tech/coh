import { Context, Next } from 'hono';
import { getCookie } from 'hono/cookie';
import { verifyToken } from '../utils/auth';
import type { Env, Variables } from '../types/env';

export async function authMiddleware(c: Context<{ Bindings: Env; Variables: Variables }>, next: Next) {
  // Prefer HttpOnly cookie; fall back to Bearer for API clients / backward compat.
  const cookieToken = getCookie(c, 'authToken');
  const authHeader = c.req.header('Authorization');
  const bearerToken = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;
  const token = cookieToken ?? bearerToken;

  if (!token) {
    return c.json({ error: 'Missing authorization token' }, 401);
  }

  try {
    const payload = await verifyToken(token, c.env.JWT_SECRET);
    const userId = payload.sub ?? payload.userId;

    if (!userId) {
      return c.json({ error: 'Invalid token payload' }, 401);
    }

    c.set('userId', userId);
    c.set('userRole', payload.role as string);

    await next();
  } catch {
    return c.json({ error: 'Invalid or expired token' }, 401);
  }
}

export async function optionalAuth(c: Context<{ Bindings: Env; Variables: Variables }>, next: Next) {
  const authHeader = c.req.header('Authorization');
  if (authHeader?.startsWith('Bearer ')) {
    try {
      const token = authHeader.slice(7);
      const payload = await verifyToken(token, c.env.JWT_SECRET);
      const userId = payload.sub ?? payload.userId;
      if (userId) {
        c.set('userId', userId);
      }
      c.set('userRole', payload.role as string);
    } catch {
      // Invalid token — continue without auth
    }
  }
  await next();
}

export async function adminOnly(c: Context<{ Bindings: Env; Variables: Variables }>, next: Next) {
  if (c.get('userRole') !== 'admin') {
    return c.json({ error: 'Admin access required' }, 403);
  }
  await next();
}
