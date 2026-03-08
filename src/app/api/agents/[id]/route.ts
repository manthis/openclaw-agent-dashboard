import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getAgent, updateAgent, deleteAgent } from '@/lib/agents';

const ID_REGEX = /^[a-z0-9_-]{1,64}$/;
const MODEL_REGEX = /^([a-zA-Z0-9_-]+\/)?[a-zA-Z0-9_.:@-]+$/;
const TOOL_NAME_REGEX = /^(group:[a-z_]+|[a-z][a-z0-9_]*)$/;
const AGENT_ID_REGEX = /^[a-z0-9_-]+$/;
const HEARTBEAT_EVERY_REGEX = /^(\d+[smhd])?$/;

const UpdateAgentSchema = z.object({
  name: z.string().min(1).max(128).optional(),
  emoji: z.string().min(1).max(8).optional(),
  theme: z.string().max(256).optional(),
  model: z.string().regex(MODEL_REGEX).optional(),
  workspace: z.string().min(1).max(512).optional(),
  avatar: z.string().min(1).nullable().optional(),
  default: z.boolean().optional(),
  modelFallbacks: z.array(z.string().regex(MODEL_REGEX).max(256)).optional(),
  toolsProfile: z.enum(['minimal', 'coding', 'messaging', 'full']).optional(),
  toolsAllow: z.array(z.string().regex(TOOL_NAME_REGEX).max(64)).optional(),
  toolsDeny: z.array(z.string().regex(TOOL_NAME_REGEX).max(64)).optional(),
  skills: z.array(z.string().max(128)).optional(),
  sandboxMode: z.enum(['off', 'non-main', 'all']).optional(),
  heartbeatEvery: z.string().regex(HEARTBEAT_EVERY_REGEX).optional(),
  heartbeatTarget: z.enum(['none', 'last', 'telegram', 'whatsapp', 'signal', 'discord']).optional(),
  heartbeatModel: z.string().max(256).optional(),
  heartbeatPrompt: z.string().max(2048).optional(),
  subagentsAllowAgents: z.array(z.union([z.literal('*'), z.string().regex(AGENT_ID_REGEX).max(64)])).optional(),
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
