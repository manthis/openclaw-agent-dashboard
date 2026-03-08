export type AgentStatus = 'active' | 'idle';

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
