import { NextRequest, NextResponse } from 'next/server';
import { getHistory } from '@/lib/activityDb';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const limit = Math.min(Number(searchParams.get('limit') ?? 100), 500);
  const since = searchParams.has('since') ? Number(searchParams.get('since')) : undefined;

  const events = getHistory(limit, since);

  return NextResponse.json({ events });
}
