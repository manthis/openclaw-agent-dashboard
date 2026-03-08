import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getAgents, getAgent, createAgent } from '@/lib/agents';

export async function GET() {
  try {
    return NextResponse.json(getAgents());
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

const CreateAgentSchema = z.object({
  id: z.string().min(1).max(64).regex(/^[a-z0-9_-]+$/, 'id: lowercase alphanumeric, dash, underscore only'),
  name: z.string().min(1).max(128),
  emoji: z.string().min(1).max(8),
  model: z.string().min(1).max(256),
  workspace: z.string().min(1).max(512),
  theme: z.string().max(256).optional().default(''),
  avatar: z.string().max(512).optional().default(''),
});

export async function POST(request: Request) {
  try {
    const body = await request.json() as unknown;
    const parsed = CreateAgentSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }
    const existing = getAgent(parsed.data.id);
    if (existing) {
      return NextResponse.json({ error: 'Agent already exists' }, { status: 409 });
    }
    createAgent(parsed.data);
    return NextResponse.json({ success: true }, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
