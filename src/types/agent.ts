export type AgentStatus = 'active' | 'idle';
export type ToolsProfile = 'minimal' | 'coding' | 'messaging' | 'full';
export type SandboxMode = 'off' | 'all' | 'tools';

export interface Agent {
  id: string;
  name: string;
  emoji: string;
  model: string;
  workspace: string;
  theme: string;
  avatar: string | null;
  status: AgentStatus;
  files: {
    soul: boolean;
    identity: boolean;
    tools: boolean;
    memory: boolean;
    user: boolean;
    agents: boolean;
    heartbeat: boolean;
  };
  relations: string[];
  toolsProfile?: ToolsProfile;
  skills?: string[];
  sandboxMode?: SandboxMode;
  heartbeat?: { every: string; model?: string };
  allowAgents?: string[];
  modelFallbacks?: string[];
  isDefault?: boolean;
}

export interface AgentRelation {
  source: string;
  target: string;
  label?: string;
}

export interface AgentsGraph {
  agents: Agent[];
  relations: AgentRelation[];
}
