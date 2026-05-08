import { jwtVerify, SignJWT } from 'jose';
import type { JWTPayload } from 'jose';

/**
 * Authentication utilities for JWT handling
 * Uses jose library for secure JWT operations
 */

const getJwtSigningKey = (secret: string): Uint8Array => {
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

// Cloudflare Workers' Web Crypto caps PBKDF2 iterations at 100,000.
// Higher values throw "Pbkdf2 failed: iteration counts above 100000 are not supported".
const PBKDF2_ITERATIONS = 100_000;
const PBKDF2_SALT_BYTES = 16;
const PBKDF2_HASH_BYTES = 32;

function bytesToBase64(bytes: Uint8Array): string {
  let binary = '';
  bytes.forEach((value) => {
    binary += String.fromCharCode(value);
  });
  return btoa(binary);
}

function base64ToBytes(value: string): Uint8Array {
  const binary = atob(value);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

function timingSafeEqual(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) {
    return false;
  }

  let diff = 0;
  for (let i = 0; i < a.length; i += 1) {
    diff |= a[i] ^ b[i];
  }
  return diff === 0;
}

async function pbkdf2Hash(password: string, salt: Uint8Array, iterations: number): Promise<Uint8Array> {
  const passwordKey = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(password),
    'PBKDF2',
    false,
    ['deriveBits'],
  );

  const derivedBits = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt,
      iterations,
      hash: 'SHA-256',
    },
    passwordKey,
    PBKDF2_HASH_BYTES * 8,
  );

  return new Uint8Array(derivedBits);
}

/**
 * Create JWT token with 24hr expiry
 */
export async function createToken(
  payload: Omit<TokenPayload, 'iat' | 'exp'>,
  secret: string,
  expiresIn: string | number | Date = '24h'
): Promise<string> {
  const encoder = getJwtSigningKey(secret);
  const token = await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(String(payload.userId))
    .setIssuedAt()
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
  const encoder = getJwtSigningKey(secret);
  const verified = await jwtVerify(token, encoder);
  return verified.payload as TokenPayload;
}

/**
 * Hash password using PBKDF2 with a random per-user salt.
 */
export async function hashPassword(password: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(PBKDF2_SALT_BYTES));
  const hash = await pbkdf2Hash(password, salt, PBKDF2_ITERATIONS);
  return `pbkdf2$${PBKDF2_ITERATIONS}$${bytesToBase64(salt)}$${bytesToBase64(hash)}`;
}

/**
 * Verify password against hash
 * NOTE: For production, use bcrypt.compare()
 */
export async function verifyPassword(
  password: string,
  hash: string
): Promise<boolean> {
  if (hash.startsWith('pbkdf2$')) {
    const [algorithm, iterationsRaw, saltRaw, expectedHashRaw] = hash.split('$');
    if (algorithm !== 'pbkdf2' || !iterationsRaw || !saltRaw || !expectedHashRaw) {
      return false;
    }

    const iterations = Number(iterationsRaw);
    if (!Number.isInteger(iterations) || iterations <= 0) {
      return false;
    }

    const salt = base64ToBytes(saltRaw);
    const expectedHash = base64ToBytes(expectedHashRaw);
    const computedHash = await pbkdf2Hash(password, salt, iterations);
    return timingSafeEqual(computedHash, expectedHash);
  }

  // Legacy fallback for existing unsalted SHA-256 hashes.
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const legacyHash = hashArray.map((value) => value.toString(16).padStart(2, '0')).join('');
  return legacyHash === hash;
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
