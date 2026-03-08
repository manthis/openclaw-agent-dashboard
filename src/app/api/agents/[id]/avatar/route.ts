import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { readOpenClawConfig } from '@/lib/config';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const config = readOpenClawConfig();
  const agent = config.agents?.list?.find((a: { id: string }) => a.id === id);
  if (!agent) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const rawAvatar = (agent as { identity?: { avatar?: string } }).identity?.avatar;
  if (!rawAvatar) return NextResponse.json({ error: 'No avatar' }, { status: 404 });

  let avatarPath: string;
  if (path.isAbsolute(rawAvatar)) {
    avatarPath = rawAvatar;
  } else {
    const home = process.env.HOME ?? '/Users/manthis';
    avatarPath = path.join(home, '.openclaw', rawAvatar);
  }

  try {
    const buf = fs.readFileSync(avatarPath);
    const ext = path.extname(avatarPath).toLowerCase();
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
