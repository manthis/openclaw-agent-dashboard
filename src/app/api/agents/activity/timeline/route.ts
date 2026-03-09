import { NextResponse } from 'next/server';
import { execSync } from 'child_process';

interface SessionRecord {
  agentId: string;
  updatedAt?: number;
}

interface SessionsOutput {
  sessions?: SessionRecord[];
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const agentId = searchParams.get('agentId');

  if (!agentId) {
    return NextResponse.json({ error: 'agentId required' }, { status: 400 });
  }

  // 1440 buckets = 1 per minute over 24h, index 0 = oldest, 1439 = now
  const BUCKETS = 1440;
  const buckets: number[] = new Array(BUCKETS).fill(0);

  try {
    const raw = execSync('openclaw sessions --all-agents --active 1440 --json', {
      timeout: 10000,
      encoding: 'utf-8',
    });
    const parsed = JSON.parse(raw) as SessionsOutput;
    const sessions = parsed.sessions ?? [];
    const now = Date.now();
    const windowMs = 24 * 60 * 60 * 1000; // 24h in ms
    const minuteMs = 60 * 1000;

    for (const session of sessions) {
      if (session.agentId !== agentId) continue;
      const ts = session.updatedAt;
      if (!ts) continue;
      const age = now - ts;
      if (age < 0 || age > windowMs) continue;
      // Map to bucket index: age=0 → bucket 1439, age=windowMs → bucket 0
      const minuteIndex = Math.floor((windowMs - age) / minuteMs);
      const idx = Math.min(BUCKETS - 1, Math.max(0, minuteIndex));
      buckets[idx] = 1;
    }
  } catch {
    // openclaw not available — return empty buckets
  }

  return NextResponse.json({ buckets });
}
