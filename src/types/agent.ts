export type AgentStatus = 'active' | 'idle';
export type ToolsProfile = 'minimal' | 'coding' | 'messaging' | 'full';
export type SandboxMode = 'off' | 'non-main' | 'all';
export type HeartbeatTarget = 'none' | 'last' | 'telegram' | 'whatsapp' | 'signal' | 'discord';

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
  // P0 fields
  toolsProfile?: ToolsProfile;
  skills?: string[];
  sandboxMode?: SandboxMode;
  modelFallbacks?: string[];
  default?: boolean;
  // P1 fields
  toolsAllow?: string[];
  toolsDeny?: string[];
  heartbeatEvery?: string;
  heartbeatTarget?: HeartbeatTarget;
  heartbeatModel?: string;
  heartbeatPrompt?: string;
  subagentsAllowAgents?: string[];
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
