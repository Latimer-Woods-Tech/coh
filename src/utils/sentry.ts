/**
 * Lightweight Sentry envelope sender for Cloudflare Workers.
 *
 * Avoids the @sentry/cloudflare SDK dependency by POSTing the minimum
 * envelope shape Sentry's ingest accepts. Sufficient for capturing
 * exceptions with request context — full breadcrumb/replay support
 * would require the full SDK.
 */

interface SentryDsn {
  protocol: string;
  publicKey: string;
  host: string;
  projectId: string;
}

function parseDsn(dsn: string): SentryDsn | null {
  const match = dsn.match(/^(https?):\/\/([^@]+)@([^/]+)\/(.+)$/);
  if (!match) return null;
  return { protocol: match[1], publicKey: match[2], host: match[3], projectId: match[4] };
}

export interface SentryContext {
  environment?: string;
  release?: string;
  user?: { id?: string; email?: string };
  tags?: Record<string, string>;
  extra?: Record<string, unknown>;
  request?: { url?: string; method?: string; headers?: Record<string, string> };
}

export async function captureException(
  dsn: string | undefined,
  error: Error,
  context: SentryContext = {},
): Promise<void> {
  if (!dsn) return;
  const parsed = parseDsn(dsn);
  if (!parsed) return;

  const eventId = crypto.randomUUID().replace(/-/g, '');
  const timestamp = new Date().toISOString();

  const event = {
    event_id: eventId,
    timestamp,
    platform: 'javascript',
    level: 'error',
    sdk: { name: 'coh.workers.sentry', version: '0.1.0' },
    environment: context.environment,
    release: context.release,
    user: context.user,
    tags: context.tags,
    extra: context.extra,
    request: context.request,
    exception: {
      values: [{
        type: error.name,
        value: error.message,
        stacktrace: error.stack ? { frames: parseStack(error.stack) } : undefined,
      }],
    },
  };

  const envelope = [
    JSON.stringify({ event_id: eventId, sent_at: timestamp }),
    JSON.stringify({ type: 'event' }),
    JSON.stringify(event),
  ].join('\n');

  const url = `${parsed.protocol}://${parsed.host}/api/${parsed.projectId}/envelope/`;

  try {
    await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-sentry-envelope',
        'X-Sentry-Auth': `Sentry sentry_version=7, sentry_key=${parsed.publicKey}, sentry_client=coh.workers.sentry/0.1.0`,
      },
      body: envelope,
    });
  } catch {
    // Sentry should never break the response; swallow.
  }
}

function parseStack(stack: string) {
  return stack
    .split('\n')
    .slice(1)
    .map((line) => {
      const match = line.match(/at (?:(.+?) )?\(?([^:]+):(\d+):(\d+)\)?/);
      if (!match) return { function: line.trim() };
      return {
        function: match[1] ?? '<anonymous>',
        filename: match[2],
        lineno: Number(match[3]),
        colno: Number(match[4]),
      };
    })
    .reverse();
}
