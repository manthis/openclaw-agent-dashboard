import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const CONFIG_PATH = path.join(
  process.env.HOME ?? '/Users/manthis',
  '.openclaw',
  'openclaw.json',
);

const MAX_BODY_SIZE = 512 * 1024; // 512 KB

export async function GET() {
  try {
    const raw = fs.readFileSync(CONFIG_PATH, 'utf-8');
    const data: unknown = JSON.parse(raw);
    return NextResponse.json({ data });
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

    return NextResponse.json({ success: true });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Failed to write config';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
