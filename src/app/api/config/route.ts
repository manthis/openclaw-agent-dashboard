import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const CONFIG_PATH = path.join(
  process.env.HOME ?? '/Users/manthis',
  '.openclaw',
  'openclaw.json',
);

const MAX_BODY_SIZE = 512 * 1024; // 512 KB

// SKYNET patch: fields to redact in GET response
const SENSITIVE_PATHS = [
  'channels.telegram.token',
  'channels.discord.token',
  'gateway.secret',
  'auth',
];

function redactSensitive(obj: Record<string, unknown>, pathParts: string[]): void {
  const [head, ...rest] = pathParts;
  if (!head || typeof obj !== 'object' || obj === null) return;
  if (rest.length === 0) {
    if (head in obj && obj[head]) {
      obj[head] = '***REDACTED***';
    }
    return;
  }
  if (typeof obj[head] === 'object' && obj[head] !== null) {
    redactSensitive(obj[head] as Record<string, unknown>, rest);
  }
}

function redactConfig(data: unknown): unknown {
  const clone = JSON.parse(JSON.stringify(data)) as Record<string, unknown>;
  for (const p of SENSITIVE_PATHS) {
    redactSensitive(clone, p.split('.'));
  }
  return clone;
}

// SKYNET patch: validate baseUrl values to prevent SSRF
const SSRF_BLOCKLIST = /^https?:\/\/(localhost|127\.|0\.0\.0\.0|\[::1\]|169\.254\.|10\.|172\.(1[6-9]|2[0-9]|3[01])\.|192\.168\.)/i;

function validateBaseUrls(obj: unknown, depth = 0): string | null {
  if (depth > 10 || !obj || typeof obj !== 'object') return null;
  for (const [key, val] of Object.entries(obj as Record<string, unknown>)) {
    if (key === 'baseUrl' && typeof val === 'string') {
      if (SSRF_BLOCKLIST.test(val)) {
        return `Suspicious baseUrl detected: ${val}`;
      }
      try {
        const u = new URL(val);
        if (u.protocol !== 'http:' && u.protocol !== 'https:') {
          return `baseUrl must use http or https: ${val}`;
        }
      } catch {
        return `Invalid baseUrl: ${val}`;
      }
    }
    if (val && typeof val === 'object') {
      const err = validateBaseUrls(val, depth + 1);
      if (err) return err;
    }
  }
  return null;
}

export async function GET() {
  try {
    const raw = fs.readFileSync(CONFIG_PATH, 'utf-8');
    const data: unknown = JSON.parse(raw);
    // SKYNET: return redacted copy, never expose secrets over the wire
    const redacted = redactConfig(data);
    console.log(`[audit] GET /api/config at ${new Date().toISOString()}`);
    return NextResponse.json({ data: redacted });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Failed to read config';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const contentLength = request.headers.get('content-length');
    if (contentLength && parseInt(contentLength, 10) > MAX_BODY_SIZE) {
      return NextResponse.json(
        { error: 'Request body too large' },
        { status: 413 },
      );
    }

    const body = (await request.json()) as unknown;

    if (
      body === null ||
      typeof body !== 'object' ||
      !('data' in body)
    ) {
      return NextResponse.json(
        { error: 'Body must be { data: object }' },
        { status: 400 },
      );
    }

    const { data } = body as { data: unknown };

    if (
      data === null ||
      typeof data !== 'object' ||
      Array.isArray(data)
    ) {
      return NextResponse.json(
        { error: 'data must be a JSON object (not array or null)' },
        { status: 400 },
      );
    }

    // SKYNET patch: reject SSRF attempts via provider baseUrl
    const ssrfError = validateBaseUrls(data);
    if (ssrfError) {
      console.warn(`[audit] PUT /api/config REJECTED - SSRF attempt: ${ssrfError}`);
      return NextResponse.json({ error: ssrfError }, { status: 400 });
    }

    const serialized = JSON.stringify(data, null, 2);
    if (Buffer.byteLength(serialized, 'utf-8') > MAX_BODY_SIZE) {
      return NextResponse.json(
        { error: 'Serialized config too large' },
        { status: 413 },
      );
    }

    // Backup existing config
    if (fs.existsSync(CONFIG_PATH)) {
      fs.copyFileSync(CONFIG_PATH, CONFIG_PATH + '.bak');
    }

    fs.writeFileSync(CONFIG_PATH, serialized + '\n', 'utf-8');
    console.log(`[audit] PUT /api/config SUCCESS at ${new Date().toISOString()}`);

    return NextResponse.json({ success: true });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Failed to write config';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
