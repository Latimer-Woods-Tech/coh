import { Context, Next } from 'hono';
import { jwtVerify } from 'jose';
import type { Env, Variables } from '../types/env';

export async function authMiddleware(c: Context<{ Bindings: Env; Variables: Variables }>, next: Next) {
  const authHeader = c.req.header('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return c.json({ error: 'Missing authorization token' }, 401);
  }

  const token = authHeader.slice(7);
  try {
    const secret = new TextEncoder().encode(c.env.JWT_SECRET);
    const { payload } = await jwtVerify(token, secret);

    c.set('userId', payload.sub as string);
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
      const secret = new TextEncoder().encode(c.env.JWT_SECRET);
      const { payload } = await jwtVerify(token, secret);
      c.set('userId', payload.sub as string);
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
