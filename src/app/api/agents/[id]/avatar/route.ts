import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { readOpenClawConfig } from '@/lib/config';

const AVATAR_BASE = path.join(os.homedir(), '.openclaw');
const ALLOWED_EXTENSIONS = ['.png', '.jpg', '.jpeg', '.gif', '.webp'];

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  if (!/^[a-z0-9_-]{1,64}$/.test(id)) {
    return NextResponse.json({ error: 'Invalid agent id' }, { status: 400 });
  }

  const config = readOpenClawConfig();
  const agent = config.agents?.list?.find((a: { id: string }) => a.id === id);
  if (!agent) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const rawAvatar = (agent as { identity?: { avatar?: string } }).identity?.avatar;
  if (!rawAvatar) return NextResponse.json({ error: 'No avatar' }, { status: 404 });

  let avatarPath: string;
  if (path.isAbsolute(rawAvatar)) {
    avatarPath = rawAvatar;
  } else {
    avatarPath = path.join(AVATAR_BASE, rawAvatar);
  }

  const resolvedAvatar = path.resolve(avatarPath);
  if (!resolvedAvatar.startsWith(AVATAR_BASE + path.sep) && !resolvedAvatar.startsWith(AVATAR_BASE + '/')) {
    return NextResponse.json({ error: 'Path not allowed' }, { status: 403 });
  }

  const ext = path.extname(resolvedAvatar).toLowerCase();
  if (!ALLOWED_EXTENSIONS.includes(ext)) {
    return NextResponse.json({ error: 'Invalid file type' }, { status: 403 });
  }

  try {
    const buf = fs.readFileSync(resolvedAvatar);
    const mime =
      ext === '.png' ? 'image/png' :
      ext === '.jpg' || ext === '.jpeg' ? 'image/jpeg' :
      ext === '.gif' ? 'image/gif' :
      ext === '.webp' ? 'image/webp' : 'application/octet-stream';
    return new NextResponse(buf, {
      headers: { 'Content-Type': mime, 'Cache-Control': 'public,max-age=3600' },
    });
  } catch {
    return NextResponse.json({ error: 'File not found' }, { status: 404 });
  }
}
