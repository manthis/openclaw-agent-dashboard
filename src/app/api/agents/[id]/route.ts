import { NextResponse } from 'next/server';
import { getAgent } from '@/lib/agents';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const agent = getAgent(id);
    if (!agent) {
      return NextResponse.json({ error: 'Agent not found' }, { status: 404 });
    }
    return NextResponse.json(agent);
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
