import { NextResponse } from 'next/server';
import { execSync } from 'child_process';

interface SessionRecord {
  agentId: string;
  updatedAt?: number;
  model?: string;
}

interface SessionsOutput {
  sessions?: SessionRecord[];
}

export async function GET() {
  let sessions: SessionRecord[] = [];
  try {
    const raw = execSync('openclaw sessions --all-agents --active 1440 --json', {
      timeout: 10000,
      encoding: 'utf-8',
    });
    const parsed = JSON.parse(raw) as SessionsOutput;
    sessions = parsed.sessions ?? [];
  } catch {
    // openclaw not available or error
  }

  const now = Date.now();
  const oneDayMs = 24 * 60 * 60 * 1000;

  const result: Record<string, { lastActiveAt: number | null; sessionsToday: number; lastModel: string | null }> = {};

  for (const session of sessions) {
    const agentId = session.agentId;
    if (!agentId) continue;

    if (!result[agentId]) {
      result[agentId] = { lastActiveAt: null, sessionsToday: 0, lastModel: null };
    }

    const updatedAt = session.updatedAt ?? null;
    if (updatedAt !== null) {
      if (result[agentId].lastActiveAt === null || updatedAt > result[agentId].lastActiveAt!) {
        result[agentId].lastActiveAt = updatedAt;
        result[agentId].lastModel = session.model ?? null;
      }
      if (now - updatedAt <= oneDayMs) {
        result[agentId].sessionsToday += 1;
      }
    }
  }

  return NextResponse.json(result);
}
