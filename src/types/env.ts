export type Env = {
  // Neon Postgres via Cloudflare Hyperdrive
  HYPERDRIVE: Hyperdrive;

  // KV for sessions and cache
  SESSIONS: KVNamespace;

  // R2 for media storage
  MEDIA: R2Bucket;

  // Secrets
  STRIPE_SECRET_KEY: string;
  STRIPE_WEBHOOK_SECRET: string;
  JWT_SECRET: string;
  RESEND_API_KEY: string;

  // Vars
  ENVIRONMENT: string;
  CORS_ORIGIN: string;
  APP_NAME: string;
};

export type Variables = {
  userId?: string;
  userRole?: string;
};
