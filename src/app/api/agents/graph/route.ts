import { NextResponse } from 'next/server';
import { getAgentsGraph } from '@/lib/agents';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const graph = getAgentsGraph();
    return NextResponse.json(graph);
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
