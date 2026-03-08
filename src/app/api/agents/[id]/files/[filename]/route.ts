import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { readOpenClawConfig } from '@/lib/config';

const ALLOWED_STEMS = ['SOUL', 'USER', 'AGENTS', 'HEARTBEAT', 'TOOLS', 'MEMORY', 'IDENTITY'];

function normalizeStem(filename: string): string | null {
  // Accept 'soul', 'soul.md', 'SOUL', 'SOUL.MD', 'SOUL.md' -> 'SOUL'
  const stem = filename.replace(/\.md$/i, '').toUpperCase();
  if (!ALLOWED_STEMS.includes(stem)) return null;
  return stem;
}

function getWorkspace(id: string): string | null {
  const config = readOpenClawConfig();
  const agent = config.agents?.list?.find((a: { id: string }) => a.id === id);
  if (!agent) return null;
  return (agent as { workspace?: string }).workspace ?? null;
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string; filename: string }> }
) {
  const { id, filename } = await params;

  if (!/^[a-z0-9_-]{1,64}$/.test(id)) {
    return NextResponse.json({ error: 'Invalid agent id' }, { status: 400 });
  }

  const stem = normalizeStem(filename);
  if (!stem) {
    return NextResponse.json({ error: 'File not allowed' }, { status: 400 });
  }

  const ws = getWorkspace(id);
  if (!ws) return NextResponse.json({ error: 'Agent not found' }, { status: 404 });

  const resolved = path.resolve(ws, `${stem}.md`);
  // Strict containment check
  if (path.dirname(resolved) !== path.resolve(ws)) {
    return NextResponse.json({ error: 'Path traversal detected' }, { status: 403 });
  }

  try {
    const content = fs.readFileSync(resolved, 'utf-8');
    return NextResponse.json({ content });
  } catch {
    return NextResponse.json({ content: '' });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string; filename: string }> }
) {
  try {
    const { id, filename } = await params;

    if (!/^[a-z0-9_-]{1,64}$/.test(id)) {
      return NextResponse.json({ error: 'Invalid agent id' }, { status: 400 });
    }

    const stem = normalizeStem(filename);
    if (!stem) {
      return NextResponse.json({ error: 'File not allowed' }, { status: 400 });
    }

    const ws = getWorkspace(id);
    if (!ws) return NextResponse.json({ error: 'Agent not found' }, { status: 404 });

    const resolved = path.resolve(ws, `${stem}.md`);
    if (path.dirname(resolved) !== path.resolve(ws)) {
      return NextResponse.json({ error: 'Path traversal detected' }, { status: 403 });
    }

    const contentType = request.headers.get('content-type') ?? '';
    let content: string;
    if (contentType.includes('application/json')) {
      const body = await request.json() as { content?: unknown };
      if (typeof body.content !== 'string') {
        return NextResponse.json({ error: 'Invalid content' }, { status: 400 });
      }
      content = body.content;
    } else {
      content = await request.text();
    }

    fs.mkdirSync(ws, { recursive: true });
    fs.writeFileSync(resolved, content, 'utf-8');
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
