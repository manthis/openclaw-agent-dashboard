import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getAgent, updateAgent, deleteAgent } from '@/lib/agents';

const ID_REGEX = /^[a-z0-9_-]{1,64}$/;

const UpdateAgentSchema = z.object({
  name: z.string().min(1).max(128).optional(),
  emoji: z.string().min(1).max(8).optional(),
  theme: z.string().max(256).optional(),
  model: z.string().min(1).max(256).optional(),
  workspace: z.string().min(1).max(512).optional(),
  avatar: z.string().max(512).regex(/^(?!\/)[^\0]*\.(png|jpg|jpeg|gif|webp)$/).optional().or(z.literal('')),
  toolsProfile: z.enum(['minimal', 'coding', 'messaging', 'full']).optional(),
  skills: z.array(z.string().max(128)).optional(),
  sandboxMode: z.enum(['off', 'all', 'tools']).optional(),
  heartbeatEvery: z.string().max(32).optional(),
  heartbeatModel: z.string().max(256).optional(),
  allowAgents: z.array(z.string().max(128)).optional(),
  modelFallbacks: z.array(z.string().max(256)).optional(),
  isDefault: z.boolean().optional(),
});

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  if (!ID_REGEX.test(id)) {
    return NextResponse.json({ error: 'Invalid agent id' }, { status: 400 });
  }
  const agent = getAgent(id);
  if (!agent) return NextResponse.json({ error: 'Agent not found' }, { status: 404 });
  return NextResponse.json(agent);
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    if (!ID_REGEX.test(id)) {
      return NextResponse.json({ error: 'Invalid agent id' }, { status: 400 });
    }
    const body = await request.json();
    const parsed = UpdateAgentSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }
    const updated = updateAgent(id, parsed.data);
    if (!updated) return NextResponse.json({ error: 'Agent not found' }, { status: 404 });
    return NextResponse.json(updated);
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    if (!ID_REGEX.test(id)) {
      return NextResponse.json({ error: 'Invalid agent id' }, { status: 400 });
    }
    const ok = deleteAgent(id);
    if (!ok) return NextResponse.json({ error: 'Agent not found' }, { status: 404 });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
