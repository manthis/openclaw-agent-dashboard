import { readOpenClawConfig, fileExists } from './config';
import * as path from 'path';
import type { Agent, AgentRelation, AgentsGraph } from '@/types/agent';

export const STATIC_RELATIONS: AgentRelation[] = [
  { source: 'hal9000', target: 'mother', label: 'delegates' },
  { source: 'mother', target: 'data', label: 'orchestrates' },
  { source: 'mother', target: 'atlas', label: 'orchestrates' },
  { source: 'mother', target: 'prometheus', label: 'orchestrates' },
  { source: 'mother', target: 'tars', label: 'orchestrates' },
  { source: 'mother', target: 'ash', label: 'orchestrates' },
  { source: 'mother', target: 'skynet', label: 'orchestrates' },
];

interface RawAgent {
  id: string;
  workspace?: string;
  model?: { primary?: string };
  identity: {
    name: string;
    emoji: string;
    theme?: string;
    avatar?: string;
  };
}

function buildAgent(raw: RawAgent): Agent {
  const ws = raw.workspace ?? '';
  return {
    id: raw.id,
    name: raw.identity.name,
    emoji: raw.identity.emoji,
    model: raw.model?.primary ?? 'unknown',
    workspace: ws,
    theme: raw.identity.theme ?? '',
    avatar: raw.identity.avatar ?? null,
    status: 'idle',
    files: {
      soul: ws ? fileExists(path.join(ws, 'SOUL.md')) : false,
      identity: ws ? fileExists(path.join(ws, 'IDENTITY.md')) : false,
      tools: ws ? fileExists(path.join(ws, 'TOOLS.md')) : false,
      memory: ws ? fileExists(path.join(ws, 'MEMORY.md')) : false,
    },
    relations: STATIC_RELATIONS
      .filter((r) => r.source === raw.id)
      .map((r) => r.target),
  };
}

export function getAgents(): Agent[] {
  const config = readOpenClawConfig();
  if (!config) return [];
  const agentsList = (config as { agents?: { list?: RawAgent[] } }).agents?.list;
  if (!agentsList) return [];
  return agentsList.map(buildAgent);
}

export function getAgent(id: string): Agent | null {
  return getAgents().find((a) => a.id === id) ?? null;
}

export function getAgentsGraph(): AgentsGraph {
  return { agents: getAgents(), relations: STATIC_RELATIONS };
}

export function getAgentsStatus(): Record<string, 'active' | 'idle'> {
  const result: Record<string, 'active' | 'idle'> = {};
  getAgents().forEach((a) => { result[a.id] = 'idle'; });
  return result;
}
