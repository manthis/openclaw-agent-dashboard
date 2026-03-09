import { readOpenClawConfig, fileExists } from './config';
import fs from 'fs';
import { execFileSync } from 'child_process';
import * as path from 'path';
import type { Agent, AgentRelation, AgentsGraph, ToolsProfile, SandboxMode, HeartbeatTarget } from '@/types/agent';

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
  default?: boolean;
  model?: string | { primary?: string; fallbacks?: string[] };
  identity: {
    name: string;
    emoji: string;
    theme?: string;
    avatar?: string;
  };
  tools?: { profile?: string; allow?: string[]; deny?: string[] };
  skills?: string[];
  sandbox?: { mode?: string };
  heartbeat?: { every?: string; target?: string; model?: string; prompt?: string };
  subagents?: { allowAgents?: string[] };
}

export interface AgentPatch {
  name?: string;
  emoji?: string;
  theme?: string;
  avatar?: string | null;
  model?: string;
  workspace?: string;
  default?: boolean;
  modelFallbacks?: string[];
  toolsProfile?: string;
  toolsAllow?: string[];
  toolsDeny?: string[];
  skills?: string[];
  sandboxMode?: string;
  heartbeatEvery?: string;
  heartbeatTarget?: string;
  heartbeatModel?: string;
  heartbeatPrompt?: string;
  subagentsAllowAgents?: string[];
}

const VALID_TOOLS_PROFILES = new Set(['minimal', 'coding', 'messaging', 'full']);
const VALID_SANDBOX_MODES = new Set(['off', 'non-main', 'all']);
const VALID_HEARTBEAT_TARGETS = new Set(['none', 'last', 'telegram', 'whatsapp', 'signal', 'discord']);

const OPENCLAW_CONFIG = path.join(process.env.HOME ?? '/Users/manthis', '.openclaw', 'openclaw.json');

function readRawConfig(): { agents?: { list?: RawAgent[] } } {
  try { return JSON.parse(fs.readFileSync(OPENCLAW_CONFIG, 'utf-8')); } catch { return {}; }
}

function writeRawConfig(config: unknown): void {
  fs.writeFileSync(OPENCLAW_CONFIG, JSON.stringify(config, null, 2), 'utf-8');
}

function getRawModel(raw: RawAgent): { primary?: string; fallbacks?: string[] } {
  if (!raw.model) return {};
  if (typeof raw.model === 'string') return { primary: raw.model };
  return raw.model;
}

function buildAgent(raw: RawAgent): Agent {
  const ws = raw.workspace ?? '';
  const modelObj = getRawModel(raw);
  const agent: Agent = {
    id: raw.id,
    name: raw.identity.name,
    emoji: raw.identity.emoji,
    model: modelObj.primary ?? 'unknown',
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
  if (raw.tools?.profile && VALID_TOOLS_PROFILES.has(raw.tools.profile)) {
    agent.toolsProfile = raw.tools.profile as ToolsProfile;
  }
  if (raw.tools?.allow?.length) agent.toolsAllow = raw.tools.allow;
  if (raw.tools?.deny?.length) agent.toolsDeny = raw.tools.deny;
  if (raw.skills?.length) agent.skills = raw.skills;
  if (raw.sandbox?.mode && VALID_SANDBOX_MODES.has(raw.sandbox.mode)) {
    agent.sandboxMode = raw.sandbox.mode as SandboxMode;
  }
  if (raw.heartbeat?.every) agent.heartbeatEvery = raw.heartbeat.every;
  if (raw.heartbeat?.target && VALID_HEARTBEAT_TARGETS.has(raw.heartbeat.target)) {
    agent.heartbeatTarget = raw.heartbeat.target as HeartbeatTarget;
  }
  if (raw.heartbeat?.model) agent.heartbeatModel = raw.heartbeat.model;
  if (raw.heartbeat?.prompt) agent.heartbeatPrompt = raw.heartbeat.prompt;
  if (raw.subagents?.allowAgents?.length) agent.subagentsAllowAgents = raw.subagents.allowAgents;
  if (modelObj.fallbacks?.length) agent.modelFallbacks = modelObj.fallbacks;
  if (raw.default !== undefined) agent.default = raw.default;
  return agent;
}

function getAgentsRaw(): RawAgent[] {
  const config = readOpenClawConfig();
  if (!config) return [];
  return (config as { agents?: { list?: RawAgent[] } }).agents?.list ?? [];
}

export function getAgents(): Agent[] {
  const rawList = getAgentsRaw();
  if (!rawList.length) return [];
  const agents = rawList.map(buildAgent);
  const active = fetchActiveAgentIds();
  agents.forEach((a) => {
    if (active.has(a.id)) a.status = 'active';
  });
  return agents;
}

export function getAgent(id: string): Agent | null {
  return getAgents().find((a) => a.id === id) ?? null;
}

export function updateAgent(id: string, patch: AgentPatch): Agent | null {
  const config = readRawConfig();
  const list = config.agents?.list;
  if (!list) return null;
  const idx = list.findIndex((a: RawAgent) => a.id === id);
  if (idx === -1) return null;
  const raw = list[idx];
  // Identity
  if (patch.name !== undefined) raw.identity.name = patch.name;
  if (patch.emoji !== undefined) raw.identity.emoji = patch.emoji;
  if (patch.theme !== undefined) raw.identity.theme = patch.theme;
  if (patch.avatar !== undefined) raw.identity.avatar = patch.avatar ?? undefined;
  // Model (deep merge)
  if (patch.model !== undefined || patch.modelFallbacks !== undefined) {
    const existing = getRawModel(raw);
    raw.model = {
      ...existing,
      ...(patch.model !== undefined ? { primary: patch.model } : {}),
      ...(patch.modelFallbacks !== undefined ? { fallbacks: patch.modelFallbacks } : {}),
    };
  }
  if (patch.workspace !== undefined) raw.workspace = patch.workspace;
  if (patch.default !== undefined) raw.default = patch.default;
  // Tools (deep merge)
  if (patch.toolsProfile !== undefined || patch.toolsAllow !== undefined || patch.toolsDeny !== undefined) {
    raw.tools = {
      ...(raw.tools ?? {}),
      ...(patch.toolsProfile !== undefined ? { profile: patch.toolsProfile } : {}),
      ...(patch.toolsAllow !== undefined ? { allow: patch.toolsAllow } : {}),
      ...(patch.toolsDeny !== undefined ? { deny: patch.toolsDeny } : {}),
    };
  }
  if (patch.skills !== undefined) raw.skills = patch.skills;
  // Sandbox (deep merge)
  if (patch.sandboxMode !== undefined) {
    raw.sandbox = { ...(raw.sandbox ?? {}), mode: patch.sandboxMode };
  }
  // Heartbeat (deep merge)
  if (patch.heartbeatEvery !== undefined || patch.heartbeatTarget !== undefined ||
      patch.heartbeatModel !== undefined || patch.heartbeatPrompt !== undefined) {
    raw.heartbeat = {
      ...(raw.heartbeat ?? {}),
      ...(patch.heartbeatEvery !== undefined ? { every: patch.heartbeatEvery } : {}),
      ...(patch.heartbeatTarget !== undefined ? { target: patch.heartbeatTarget } : {}),
      ...(patch.heartbeatModel !== undefined ? { model: patch.heartbeatModel } : {}),
      ...(patch.heartbeatPrompt !== undefined ? { prompt: patch.heartbeatPrompt } : {}),
    };
  }
  // Subagents (deep merge)
  if (patch.subagentsAllowAgents !== undefined) {
    raw.subagents = { ...(raw.subagents ?? {}), allowAgents: patch.subagentsAllowAgents };
  }
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

const AGENT_ACTIVITY_FILE = path.join(process.env.HOME ?? '/Users/manthis', '.openclaw', 'agent-activity.json');


export function fetchActiveAgentIds(): Set<string> {
  const active = new Set<string>();

  // Primary source: agent-activity.json with 5-minute mtime TTL
  try {
    const stat = fs.statSync(AGENT_ACTIVITY_FILE);
    const ageMs = Date.now() - stat.mtimeMs;
    if (ageMs <= 5 * 60 * 1000) {
      const raw = fs.readFileSync(AGENT_ACTIVITY_FILE, 'utf-8');
      const data = JSON.parse(raw) as Record<string, string>;
      Object.entries(data).forEach(([id, status]) => {
        if (status === 'active') active.add(id);
      });
    }
  } catch {
    // File missing or unreadable — skip
  }

  // Secondary source: live openclaw sessions (updated within 5 min)
  try {
    const output = execFileSync('openclaw', ['sessions', '--active', '5', '--all-agents', '--json'], {
      timeout: 5000,
      encoding: 'utf-8',
    });
    const data = JSON.parse(output) as { sessions?: Array<{ agentId: string }> };
    if (data.sessions && data.sessions.length > 0) {
      data.sessions.forEach((s) => active.add(s.agentId));
    }
  } catch {
    // CLI unavailable
  }

  return active;
}

export function getAgentsStatus(): Record<string, 'active' | 'idle'> {
  const result: Record<string, 'active' | 'idle'> = {};
  getAgentsRaw().forEach((raw) => { result[raw.id] = 'idle'; });
  const active = fetchActiveAgentIds();
  active.forEach((id) => { if (id in result) result[id] = 'active'; });
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
  default?: boolean;
  modelFallbacks?: string[];
  toolsProfile?: string;
  toolsAllow?: string[];
  toolsDeny?: string[];
  skills?: string[];
  sandboxMode?: string;
  heartbeatEvery?: string;
  heartbeatTarget?: string;
  heartbeatModel?: string;
  heartbeatPrompt?: string;
  subagentsAllowAgents?: string[];
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
  if (data.default !== undefined) newRaw.default = data.default;
  if (data.toolsProfile || data.toolsAllow?.length || data.toolsDeny?.length) {
    newRaw.tools = {
      ...(data.toolsProfile ? { profile: data.toolsProfile } : {}),
      ...(data.toolsAllow?.length ? { allow: data.toolsAllow } : {}),
      ...(data.toolsDeny?.length ? { deny: data.toolsDeny } : {}),
    };
  }
  if (data.skills?.length) newRaw.skills = data.skills;
  if (data.sandboxMode) newRaw.sandbox = { mode: data.sandboxMode };
  if (data.heartbeatEvery || data.heartbeatTarget || data.heartbeatModel || data.heartbeatPrompt) {
    newRaw.heartbeat = {
      ...(data.heartbeatEvery ? { every: data.heartbeatEvery } : {}),
      ...(data.heartbeatTarget ? { target: data.heartbeatTarget } : {}),
      ...(data.heartbeatModel ? { model: data.heartbeatModel } : {}),
      ...(data.heartbeatPrompt ? { prompt: data.heartbeatPrompt } : {}),
    };
  }
  if (data.subagentsAllowAgents?.length) newRaw.subagents = { allowAgents: data.subagentsAllowAgents };
  (config.agents.list as RawAgent[]).push(newRaw);
  writeRawConfig(config);
}
