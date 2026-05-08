import { Hono } from 'hono';
import { setCookie, deleteCookie } from 'hono/cookie';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { eq } from 'drizzle-orm';
import { createDb } from '../db';
import { users } from '../db/schema';
import { createToken, verifyToken, hashPassword, verifyPassword } from '../utils/auth';
import { authMiddleware } from '../middleware/auth';
import { createRateLimitMiddleware } from '../middleware/rate-limit';
import { sendEmail, magicLinkEmail } from '../utils/email';
import type { Env, Variables } from '../types/env';

const TOKEN_MAX_AGE = 86400; // 24 hours

function setAuthCookie(c: Parameters<typeof setCookie>[0], token: string) {
  const isProduction = (c.env as Env).ENVIRONMENT === 'production';
  setCookie(c, 'authToken', token, {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'Strict',
    maxAge: TOKEN_MAX_AGE,
    path: '/',
  });
}

const auth = new Hono<{ Bindings: Env; Variables: Variables }>();
const authWriteRateLimit = createRateLimitMiddleware({
  namespace: 'auth-write',
  maxRequests: 12,
  windowSeconds: 60,
});

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
  token: z.string().min(1, 'Token is required').optional(),
});

// ─── POST: Sign Up ───
auth.post('/signup', authWriteRateLimit, zValidator('json', signupSchema), async (c) => {
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

    setAuthCookie(c, token);

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
auth.post('/login', authWriteRateLimit, zValidator('json', loginSchema), async (c) => {
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

    // Upgrade legacy password hashes on successful login.
    if (!user.passwordHash.startsWith('pbkdf2$')) {
      const passwordHash = await hashPassword(password);
      await db.update(users)
        .set({ passwordHash, updatedAt: new Date() })
        .where(eq(users.id, user.id));
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

    setAuthCookie(c, token);

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
auth.post('/refresh-token', authWriteRateLimit, zValidator('json', refreshSchema), async (c) => {
  const { token } = c.req.valid('json');
  const authorizationToken = c.req.header('Authorization')?.replace(/^Bearer\s+/i, '');
  const oldToken = token ?? authorizationToken;

  if (!oldToken) {
    return c.json({ error: 'Token is required' }, 400);
  }

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

    setAuthCookie(c, newToken);

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

// ─── POST: Magic Link Request ───
auth.post('/magic-link/request', authWriteRateLimit, zValidator('json', z.object({
  email: z.string().email(),
})), async (c) => {
  const { email } = c.req.valid('json');
  const db = createDb(c.env.HYPERDRIVE);

  let [user] = await db.select({ id: users.id, name: users.name, email: users.email })
    .from(users).where(eq(users.email, email)).limit(1);

  // Auto-provision a user record on first magic-link request (passwordless onboarding)
  if (!user) {
    const [created] = await db.insert(users).values({
      email,
      name: email.split('@')[0],
      role: 'client',
      membershipTier: 'free',
    }).returning({ id: users.id, name: users.name, email: users.email });
    user = created;
  }

  const token = crypto.randomUUID();
  await c.env.SESSIONS.put(`magic-link:${token}`, user.id, { expirationTtl: 900 });

  const appOrigin = c.env.CORS_ORIGIN || 'https://cypherofhealing.com';
  const loginUrl = `${appOrigin}/auth/magic-link?token=${token}`;
  const template = magicLinkEmail({ userName: user.name, loginUrl });

  await sendEmail(c.env.RESEND_API_KEY, {
    to: user.email,
    subject: template.subject,
    html: template.html,
    text: template.text,
  });

  return c.json({ message: 'Check your email for a sign-in link.' }, 200);
});

// ─── POST: Magic Link Verify ───
auth.post('/magic-link/verify', authWriteRateLimit, zValidator('json', z.object({
  token: z.string().min(1),
})), async (c) => {
  const { token } = c.req.valid('json');

  const userId = await c.env.SESSIONS.get(`magic-link:${token}`);
  if (!userId) return c.json({ error: 'Link is invalid or has expired' }, 400);

  // One-time use: delete immediately (before issuing JWT) to prevent replay
  await c.env.SESSIONS.delete(`magic-link:${token}`);

  const db = createDb(c.env.HYPERDRIVE);
  const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  if (!user) return c.json({ error: 'User not found' }, 404);

  await db.update(users)
    .set({ lastActiveAt: new Date(), emailVerifiedAt: user.emailVerifiedAt ?? new Date() })
    .where(eq(users.id, user.id));

  const jwt = await createToken(
    { userId: user.id, email: user.email, role: user.role },
    c.env.JWT_SECRET,
  );

  setAuthCookie(c, jwt);

  return c.json({
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      membershipTier: user.membershipTier,
    },
    token: jwt,
  }, 200);
});

// ─── POST: Logout ───
auth.post('/logout', async (c) => {
  deleteCookie(c, 'authToken', { path: '/' });
  return c.json({ message: 'Logged out' }, 200);
});

export default auth;
