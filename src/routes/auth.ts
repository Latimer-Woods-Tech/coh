import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { eq } from 'drizzle-orm';
import { createDb } from '../db';
import { users } from '../db/schema';
import { createToken, verifyToken, hashPassword, verifyPassword, extractToken } from '../utils/auth';
import { authMiddleware } from '../middleware/auth';
import type { Env, Variables } from '../types/env';

const auth = new Hono<{ Bindings: Env; Variables: Variables }>();

// ─── Validation Schemas ───
const signupSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  name: z.string().min(1, 'Name is required'),
});

const loginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(1, 'Password is required'),
});

const refreshSchema = z.object({
  token: z.string().min(1, 'Token is required'),
});

// ─── POST: Sign Up ───
auth.post('/signup', zValidator('json', signupSchema), async (c) => {
  const { email, password, name } = c.req.valid('json');
  const db = createDb(c.env.HYPERDRIVE);

  try {
    // Check if user exists
    const [existing] = await db.select().from(users).where(eq(users.email, email)).limit(1);
    if (existing) {
      return c.json({ error: 'Email already registered' }, 409);
    }

    // Hash password
    const passwordHash = await hashPassword(password);

    // Create user
    const [newUser] = await db
      .insert(users)
      .values({
        email,
        name,
        passwordHash,
        role: 'client',
        membershipTier: 'free',
      })
      .returning();

    // Create token
    const token = await createToken(
      {
        userId: newUser.id,
        email: newUser.email,
        role: newUser.role,
      },
      c.env.JWT_SECRET
    );

    return c.json(
      {
        user: {
          id: newUser.id,
          email: newUser.email,
          name: newUser.name,
          role: newUser.role,
        },
        token,
      },
      201
    );
  } catch (error) {
    return c.json({ error: 'Registration failed' }, 500);
  }
});

// ─── POST: Login ───
auth.post('/login', zValidator('json', loginSchema), async (c) => {
  const { email, password } = c.req.valid('json');
  const db = createDb(c.env.HYPERDRIVE);

  try {
    // Find user
    const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);
    if (!user || !user.passwordHash) {
      return c.json({ error: 'Invalid email or password' }, 401);
    }

    // Verify password
    const isValid = await verifyPassword(password, user.passwordHash);
    if (!isValid) {
      return c.json({ error: 'Invalid email or password' }, 401);
    }

    // Update last active
    await db.update(users).set({ lastActiveAt: new Date() }).where(eq(users.id, user.id));

    // Create token
    const token = await createToken(
      {
        userId: user.id,
        email: user.email,
        role: user.role,
      },
      c.env.JWT_SECRET
    );

    return c.json(
      {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          membershipTier: user.membershipTier,
        },
        token,
      },
      200
    );
  } catch (error) {
    return c.json({ error: 'Login failed' }, 500);
  }
});

// ─── POST: Refresh Token ───
auth.post('/refresh-token', zValidator('json', refreshSchema), async (c) => {
  const { token: oldToken } = c.req.valid('json');

  try {
    // Verify old token (will throw if expired)
    const payload = await verifyToken(oldToken, c.env.JWT_SECRET);

    // Create new token
    const newToken = await createToken(
      {
        userId: payload.userId,
        email: payload.email,
        role: payload.role,
      },
      c.env.JWT_SECRET
    );

    return c.json({ token: newToken }, 200);
  } catch (error) {
    return c.json({ error: 'Invalid token' }, 401);
  }
});

// ─── GET: Me (Current User) ───
auth.get('/me', authMiddleware, async (c) => {
  const userId = c.get('userId')!;
  const db = createDb(c.env.HYPERDRIVE);

  try {
    const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
    if (!user) {
      return c.json({ error: 'User not found' }, 404);
    }

    return c.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        membershipTier: user.membershipTier,
        phone: user.phone,
        avatarUrl: user.avatarUrl,
      },
    });
  } catch (error) {
    return c.json({ error: 'Failed to fetch user' }, 500);
  }
});

// ─── PUT: Update Profile ───
const updateProfileSchema = z.object({
  name: z.string().optional(),
  phone: z.string().optional(),
  avatarUrl: z.string().url().optional(),
});

auth.put('/me', authMiddleware, zValidator('json', updateProfileSchema), async (c) => {
  const userId = c.get('userId')!;
  const updates = c.req.valid('json');
  const db = createDb(c.env.HYPERDRIVE);

  try {
    const [updated] = await db
      .update(users)
      .set({
        ...updates,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId))
      .returning();

    return c.json({
      user: {
        id: updated.id,
        email: updated.email,
        name: updated.name,
        role: updated.role,
        membershipTier: updated.membershipTier,
        phone: updated.phone,
        avatarUrl: updated.avatarUrl,
      },
    });
  } catch (error) {
    return c.json({ error: 'Failed to update profile' }, 500);
  }
});

// ─── POST: Logout (just a confirmation endpoint) ───
auth.post('/logout', authMiddleware, async (c) => {
  // JWT is stateless, so logout is client-side (clear token)
  // This endpoint exists for consistency and potential future use (blacklist tokens)
  return c.json({ message: 'Logged out' }, 200);
});

export default auth;
