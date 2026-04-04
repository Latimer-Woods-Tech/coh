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

  // Telnyx API (RTC, SMS, Voice)
  TELNYX_API_KEY: string;
  TELNYX_CONNECTION_ID: string;
  TELNYX_PUBLIC_KEY: string;
  TELNYX_PHONE_NUMBER: string;

  // Eleven Labs API (Text-to-Speech) - Official SDK
  ELEVENLABS_API_KEY: string;
  ELEVEN_LABS_VOICE_ID: string;
  ELEVEN_LABS_MODEL_ID?: string; // 'eleven_multilingual_v2' | 'eleven_monolingual_v1'
  ELEVEN_LABS_OUTPUT_FORMAT?: string; // 'mp3_44100_128' | 'mp3_22050_32' | etc.

  // Cloudflare
  CLOUDFLARE_API: string;
  CLOUDFLARE_ACCOUNT_ID: string;

  // AI/ML APIs (optional advanced features)
  GROQ_API_KEY?: string;
  GROK_API_KEY?: string;

  // Vars
  ENVIRONMENT: string;
  CORS_ORIGIN: string;
  APP_NAME: string;
};

export type Variables = {
  userId?: string;
  userRole?: string;
};
