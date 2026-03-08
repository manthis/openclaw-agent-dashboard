import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { readOpenClawConfig } from '@/lib/config';

const ALLOWED_FILES = ['SOUL.md','USER.md','AGENTS.md','HEARTBEAT.md','TOOLS.md','MEMORY.md','IDENTITY.md'];

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
  const upper = filename.toUpperCase();
  if (!ALLOWED_FILES.includes(upper)) {
    return NextResponse.json({ error: 'File not allowed' }, { status: 403 });
  }
  const ws = getWorkspace(id);
  if (!ws) return NextResponse.json({ error: 'Agent not found' }, { status: 404 });
  const filePath = path.join(ws, upper);
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    return NextResponse.json({ filename: upper, content });
  } catch {
    return NextResponse.json({ filename: upper, content: '' });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string; filename: string }> }
) {
  try {
    const { id, filename } = await params;
    const upper = filename.toUpperCase();
    if (!ALLOWED_FILES.includes(upper)) {
      return NextResponse.json({ error: 'File not allowed' }, { status: 403 });
    }
    const ws = getWorkspace(id);
    if (!ws) return NextResponse.json({ error: 'Agent not found' }, { status: 404 });
    const { content } = await request.json();
    if (typeof content !== 'string') {
      return NextResponse.json({ error: 'Invalid content' }, { status: 400 });
    }
    fs.mkdirSync(ws, { recursive: true });
    fs.writeFileSync(path.join(ws, upper), content, 'utf-8');
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
