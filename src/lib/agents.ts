import { readOpenClawConfig, fileExists } from './config';
import fs from 'fs';
import * as path from 'path';
import type { Agent, AgentRelation, AgentsGraph, ToolsProfile, SandboxMode } from '@/types/agent';

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
  model?: { primary?: string; fallbacks?: string[] };
  identity: {
    name: string;
    emoji: string;
    theme?: string;
    avatar?: string;
  };
  tools?: { profile?: string };
  skills?: string[];
  sandbox?: { mode?: string };
  heartbeat?: { every?: string; model?: string };
  subagents?: { allowAgents?: string[] };
  default?: boolean;
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
  const agent: Agent = {
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
  if (raw.tools?.profile) agent.toolsProfile = raw.tools.profile as ToolsProfile;
  if (raw.skills) agent.skills = raw.skills;
  if (raw.sandbox?.mode) agent.sandboxMode = raw.sandbox.mode as SandboxMode;
  if (raw.heartbeat?.every) agent.heartbeat = { every: raw.heartbeat.every, model: raw.heartbeat.model };
  if (raw.subagents?.allowAgents) agent.allowAgents = raw.subagents.allowAgents;
  if (raw.model?.fallbacks) agent.modelFallbacks = raw.model.fallbacks;
  if (raw.default !== undefined) agent.isDefault = raw.default;
  return agent;
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

export function updateAgent(id: string, patch: Partial<{
  name: string; emoji: string; theme: string; avatar: string; model: string; workspace: string;
  toolsProfile: string; skills: string[]; sandboxMode: string;
  heartbeatEvery: string; heartbeatModel: string;
  allowAgents: string[]; modelFallbacks: string[]; isDefault: boolean;
}>): Agent | null {
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
  if (patch.toolsProfile !== undefined) { raw.tools = { ...(raw.tools ?? {}), profile: patch.toolsProfile }; }
  if (patch.skills !== undefined) raw.skills = patch.skills;
  if (patch.sandboxMode !== undefined) { raw.sandbox = { ...(raw.sandbox ?? {}), mode: patch.sandboxMode }; }
  if (patch.heartbeatEvery !== undefined) { raw.heartbeat = { ...(raw.heartbeat ?? {}), every: patch.heartbeatEvery }; }
  if (patch.heartbeatModel !== undefined) { raw.heartbeat = { ...(raw.heartbeat ?? {}), model: patch.heartbeatModel }; }
  if (patch.allowAgents !== undefined) { raw.subagents = { ...(raw.subagents ?? {}), allowAgents: patch.allowAgents }; }
  if (patch.modelFallbacks !== undefined) { raw.model = { ...(raw.model ?? {}), fallbacks: patch.modelFallbacks }; }
  if (patch.isDefault !== undefined) raw.default = patch.isDefault;
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

export function createAgent(data: {
  id: string;
  name: string;
  emoji: string;
  model: string;
  workspace: string;
  theme?: string;
  avatar?: string;
  toolsProfile?: string;
  skills?: string[];
  sandboxMode?: string;
  heartbeatEvery?: string;
  heartbeatModel?: string;
  allowAgents?: string[];
  modelFallbacks?: string[];
  isDefault?: boolean;
}): void {
  const config = readRawConfig();
  if (!config.agents) config.agents = { list: [] };
  if (!config.agents.list) config.agents.list = [];
  const newRaw: RawAgent = {
    id: data.id,
    workspace: data.workspace,
    model: { primary: data.model, ...(data.modelFallbacks?.length ? { fallbacks: data.modelFallbacks } : {}) },
    identity: {
      name: data.name,
      emoji: data.emoji,
      theme: data.theme ?? '',
      avatar: data.avatar || undefined,
    },
  };
  if (data.toolsProfile) newRaw.tools = { profile: data.toolsProfile };
  if (data.skills?.length) newRaw.skills = data.skills;
  if (data.sandboxMode) newRaw.sandbox = { mode: data.sandboxMode };
  if (data.heartbeatEvery) newRaw.heartbeat = { every: data.heartbeatEvery, model: data.heartbeatModel };
  if (data.allowAgents?.length) newRaw.subagents = { allowAgents: data.allowAgents };
  if (data.isDefault !== undefined) newRaw.default = data.isDefault;
  (config.agents.list as RawAgent[]).push(newRaw);
  writeRawConfig(config);
}
