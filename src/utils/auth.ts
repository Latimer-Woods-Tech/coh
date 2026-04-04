import { jwtVerify, SignJWT } from 'jose';
import type { JWTPayload } from 'jose';

/**
 * Authentication utilities for JWT handling
 * Uses jose library for secure JWT operations
 */

const getDangerousSecret = (secret: string): Uint8Array => {
  if (secret.length < 32) {
    throw new Error('JWT_SECRET must be at least 32 characters');
  }
  return new TextEncoder().encode(secret);
};

export interface TokenPayload extends JWTPayload {
  userId: string;
  email: string;
  role: 'client' | 'admin' | 'practitioner';
  iat?: number;
  exp?: number;
}

/**
 * Create JWT token with 24hr expiry
 */
export async function createToken(
  payload: Omit<TokenPayload, 'iat' | 'exp'>,
  secret: string,
  expiresIn: string = '24h'
): Promise<string> {
  const encoder = getDangerousSecret(secret);
  const token = await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime(expiresIn)
    .sign(encoder);
  return token;
}

/**
 * Verify and decode JWT token
 */
export async function verifyToken(
  token: string,
  secret: string
): Promise<TokenPayload> {
  const encoder = getDangerousSecret(secret);
  const verified = await jwtVerify(token, encoder);
  return verified.payload as TokenPayload;
}

/**
 * Hash password using simple approach
 * For production: use bcrypt or argon2
 * NOTE: This is a placeholder. Production should use bcrypt.
 */
export async function hashPassword(password: string): Promise<string> {
  // Using Web Crypto API (available in Cloudflare Workers)
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return hashHex;
}

/**
 * Verify password against hash
 * NOTE: For production, use bcrypt.compare()
 */
export async function verifyPassword(
  password: string,
  hash: string
): Promise<boolean> {
  const passwordHash = await hashPassword(password);
  return passwordHash === hash;
}

/**
 * Extract token from Authorization header
 */
export function extractToken(authHeader?: string): string | null {
  if (!authHeader) return null;
  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return null;
  }
  return parts[1];
}
