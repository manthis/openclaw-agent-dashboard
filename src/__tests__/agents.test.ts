import { getAgents, getAgent, getAgentsGraph, getAgentsStatus, STATIC_RELATIONS } from '@/lib/agents';

jest.mock('@/lib/config', () => ({
  readOpenClawConfig: () => ({
    agents: {
      list: [
        { id: 'hal9000', workspace: '/test/hal9000', model: { primary: 'claude' }, identity: { name: 'HAL9000', emoji: '🔴', theme: 'AI', avatar: '' } },
        { id: 'mother', workspace: '/test/mother', model: { primary: 'claude' }, identity: { name: 'MOTHER', emoji: '🏛️', theme: 'Orchestrator', avatar: '' } },
      ],
    },
  }),
  fileExists: () => true,
}));

describe('agents lib', () => {
  it('getAgents returns all agents', () => {
    const agents = getAgents();
    expect(agents).toHaveLength(2);
    expect(agents[0].id).toBe('hal9000');
    expect(agents[0].status).toBe('idle');
  });

  it('getAgent returns agent by id', () => {
    const agent = getAgent('hal9000');
    expect(agent?.id).toBe('hal9000');
  });

  it('getAgent returns null for unknown id', () => {
    expect(getAgent('unknown')).toBeNull();
  });

  it('getAgentsGraph returns agents and relations', () => {
    const graph = getAgentsGraph();
    expect(graph.agents).toHaveLength(2);
    expect(graph.relations).toEqual(STATIC_RELATIONS);
  });

  it('getAgentsStatus returns idle for all', () => {
    const status = getAgentsStatus();
    expect(status['hal9000']).toBe('idle');
  });

  it('STATIC_RELATIONS is non-empty', () => {
    expect(STATIC_RELATIONS.length).toBeGreaterThan(0);
  });

  it('getAgents sets files based on fileExists', () => {
    const agents = getAgents();
    expect(agents[0].files.soul).toBe(true);
  });
});
