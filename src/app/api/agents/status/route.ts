import { NextResponse } from 'next/server';
import { getAgentsStatus } from '@/lib/agents';

export async function GET() {
  try {
    return NextResponse.json(getAgentsStatus());
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
