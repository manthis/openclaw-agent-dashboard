import { readOpenClawConfig, fileExists } from './config';
import fs from 'fs';
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

const OPENCLAW_CONFIG = path.join(process.env.HOME ?? '/Users/manthis', '.openclaw', 'openclaw.json');

function readRawConfig(): { agents?: { list?: RawAgent[] } } {
  try { return JSON.parse(fs.readFileSync(OPENCLAW_CONFIG, 'utf-8')); } catch { return {}; }
}

function writeRawConfig(config: unknown): void {
  fs.writeFileSync(OPENCLAW_CONFIG, JSON.stringify(config, null, 2), 'utf-8');
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
      user: ws ? fileExists(path.join(ws, 'USER.md')) : false,
      agents: ws ? fileExists(path.join(ws, 'AGENTS.md')) : false,
      heartbeat: ws ? fileExists(path.join(ws, 'HEARTBEAT.md')) : false,
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

export function updateAgent(id: string, patch: Partial<{ name: string; emoji: string; theme: string; avatar: string; model: string; workspace: string }>): Agent | null {
  const config = readRawConfig();
  const list = config.agents?.list;
  if (!list) return null;
  const idx = list.findIndex((a: RawAgent) => a.id === id);
  if (idx === -1) return null;
  const raw = list[idx];
  if (patch.name !== undefined) raw.identity.name = patch.name;
  if (patch.emoji !== undefined) raw.identity.emoji = patch.emoji;
  if (patch.theme !== undefined) raw.identity.theme = patch.theme;
  if (patch.avatar !== undefined) raw.identity.avatar = patch.avatar;
  if (patch.model !== undefined) raw.model = { ...(raw.model ?? {}), primary: patch.model };
  if (patch.workspace !== undefined) raw.workspace = patch.workspace;
  writeRawConfig(config);
  return buildAgent(raw);
}

export function deleteAgent(id: string): boolean {
  const config = readRawConfig();
  const list = config.agents?.list;
  if (!list) return false;
  const idx = list.findIndex((a: RawAgent) => a.id === id);
  if (idx === -1) return false;
  list.splice(idx, 1);
  writeRawConfig(config);
  return true;
}

export function getAgentsGraph(): AgentsGraph {
  return { agents: getAgents(), relations: STATIC_RELATIONS };
}

export function getAgentsStatus(): Record<string, 'active' | 'idle'> {
  const result: Record<string, 'active' | 'idle'> = {};
  getAgents().forEach((a) => { result[a.id] = 'idle'; });
  return result;
}
