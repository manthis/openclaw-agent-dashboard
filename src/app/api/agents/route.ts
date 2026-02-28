import { NextResponse } from 'next/server';
import { getAgents } from '@/lib/agents';

export async function GET() {
  try {
    return NextResponse.json(getAgents());
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
