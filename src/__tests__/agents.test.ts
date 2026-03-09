import { getAgents, getAgent, getAgentsGraph, getAgentsStatus, fetchActiveAgentIds, STATIC_RELATIONS, updateAgent, deleteAgent, createAgent } from '@/lib/agents';
import fs from 'fs';

jest.mock('child_process', () => ({
  execFileSync: jest.fn(() => JSON.stringify({ sessions: [] })),
}));

// Mock config lib
jest.mock('@/lib/config', () => ({
  readOpenClawConfig: () => ({
    agents: {
      list: [
        { id: 'hal9000', workspace: '/test/hal9000', model: { primary: 'claude' }, identity: { name: 'HAL9000', emoji: '\uD83D\uDD34', theme: 'AI', avatar: '' } },
        { id: 'mother', workspace: '/test/mother', model: { primary: 'claude' }, identity: { name: 'MOTHER', emoji: '\uD83C\uDFDB\uFE0F', theme: 'Orchestrator', avatar: '' } },
      ],
    },
  }),
  fileExists: () => true,
}));

// Mock fs for updateAgent/deleteAgent/createAgent
const rawConfig = {
  agents: {
    list: [
      { id: 'hal9000', workspace: '/test/hal9000', model: { primary: 'claude' }, identity: { name: 'HAL9000', emoji: '\uD83D\uDD34', theme: 'AI', avatar: undefined } },
      { id: 'mother', workspace: '/test/mother', model: { primary: 'claude' }, identity: { name: 'MOTHER', emoji: '\uD83C\uDFDB\uFE0F', theme: 'Orchestrator', avatar: undefined } },
    ],
  },
};

jest.mock('fs', () => ({
  readFileSync: jest.fn(() => JSON.stringify(rawConfig)),
  writeFileSync: jest.fn(),
  statSync: jest.fn(() => ({ mtimeMs: Date.now() })),
}));

const mockFs = fs as jest.Mocked<typeof fs>;

describe('agents lib', () => {
  it('getAgents returns all agents with idle status when no active sessions', () => {
    const agents = getAgents();
    expect(agents).toHaveLength(2);
    expect(agents[0].id).toBe('hal9000');
    expect(agents[0].status).toBe('idle');
  });

  it('getAgents marks agent as active when CLI returns a session with matching agentId', () => {
    const { execFileSync } = require('child_process') as { execFileSync: jest.Mock };
    execFileSync.mockReturnValueOnce(JSON.stringify({ sessions: [{ agentId: 'hal9000', key: 'x', updatedAt: new Date().toISOString() }] }));
    const agents = getAgents();
    const hal = agents.find((a) => a.id === 'hal9000');
    expect(hal?.status).toBe('active');
    // mother should remain idle
    const mother = agents.find((a) => a.id === 'mother');
    expect(mother?.status).toBe('idle');
  });

  it('getAgents keeps all agents idle when CLI returns empty sessions', () => {
    const { execFileSync } = require('child_process') as { execFileSync: jest.Mock };
    execFileSync.mockReturnValueOnce(JSON.stringify({ sessions: [] }));
    const agents = getAgents();
    agents.forEach((a) => expect(a.status).toBe('idle'));
  });

  it('getAgents keeps all agents idle when CLI throws', () => {
    const { execFileSync } = require('child_process') as { execFileSync: jest.Mock };
    execFileSync.mockImplementationOnce(() => { throw new Error('CLI unavailable'); });
    const agents = getAgents();
    agents.forEach((a) => expect(a.status).toBe('idle'));
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

  it('getAgentsStatus returns idle for all when no active sessions', () => {
    const status = getAgentsStatus();
    expect(status['hal9000']).toBe('idle');
    expect(status['mother']).toBe('idle');
  });

  it('getAgentsStatus marks agent active when CLI returns session with matching agentId', () => {
    const { execFileSync } = require('child_process') as { execFileSync: jest.Mock };
    execFileSync.mockReturnValueOnce(JSON.stringify({ sessions: [{ agentId: 'mother', key: 'y', updatedAt: new Date().toISOString() }] }));
    const status = getAgentsStatus();
    expect(status['mother']).toBe('active');
    expect(status['hal9000']).toBe('idle');
  });

  it('STATIC_RELATIONS is non-empty', () => {
    expect(STATIC_RELATIONS.length).toBeGreaterThan(0);
  });

  it('getAgents sets files based on fileExists', () => {
    const agents = getAgents();
    expect(agents[0].files.soul).toBe(true);
  });

  describe('updateAgent', () => {
    beforeEach(() => {
      mockFs.readFileSync.mockReturnValue(JSON.stringify(rawConfig));
    });

    it('updates agent name and returns updated agent', () => {
      const result = updateAgent('hal9000', { name: 'HAL-UPDATED' });
      expect(result).not.toBeNull();
      expect(mockFs.writeFileSync).toHaveBeenCalled();
    });

    it('returns null for unknown agent id', () => {
      const result = updateAgent('nonexistent', { name: 'X' });
      expect(result).toBeNull();
    });

    it('updates emoji, theme, avatar, model, workspace', () => {
      const result = updateAgent('mother', { emoji: '\u2b50', theme: 'New', avatar: 'img.png', model: 'gpt4', workspace: '/new' });
      expect(result).not.toBeNull();
    });

    it('returns null when agents list is missing', () => {
      mockFs.readFileSync.mockReturnValue(JSON.stringify({}));
      const result = updateAgent('hal9000', { name: 'X' });
      expect(result).toBeNull();
    });
  });

  describe('deleteAgent', () => {
    beforeEach(() => {
      mockFs.readFileSync.mockReturnValue(JSON.stringify(rawConfig));
    });

    it('deletes agent and returns true', () => {
      const result = deleteAgent('hal9000');
      expect(result).toBe(true);
      expect(mockFs.writeFileSync).toHaveBeenCalled();
    });

    it('returns false for unknown agent', () => {
      const result = deleteAgent('nonexistent');
      expect(result).toBe(false);
    });

    it('returns false when agents list is missing', () => {
      mockFs.readFileSync.mockReturnValue(JSON.stringify({}));
      const result = deleteAgent('hal9000');
      expect(result).toBe(false);
    });
  });

  describe('createAgent', () => {
    beforeEach(() => {
      mockFs.readFileSync.mockReturnValue(JSON.stringify({ agents: { list: [] } }));
    });

    it('creates a new agent and writes config', () => {
      createAgent({ id: 'new-agent', name: 'New', emoji: '\uD83D\uDC4D', model: 'claude', workspace: '/ws', theme: 'Test', avatar: '' });
      expect(mockFs.writeFileSync).toHaveBeenCalled();
    });

    it('creates agent with no existing agents object', () => {
      mockFs.readFileSync.mockReturnValue(JSON.stringify({}));
      createAgent({ id: 'new2', name: 'New2', emoji: '\uD83D\uDC4D', model: 'claude', workspace: '/ws2', theme: '', avatar: '' });
      expect(mockFs.writeFileSync).toHaveBeenCalled();
    });

    it('handles avatar empty string (no avatar field)', () => {
      createAgent({ id: 'new3', name: 'New3', emoji: '\uD83D\uDC4D', model: 'x', workspace: '/w', theme: '', avatar: '' });
      expect(mockFs.writeFileSync).toHaveBeenCalled();
    });

    it('creates list array if agents exists but list is undefined', () => {
      mockFs.readFileSync.mockReturnValue(JSON.stringify({ agents: {} }));
      createAgent({ id: 'new4', name: 'New4', emoji: '🤖', model: 'claude', workspace: '', theme: '', avatar: '' });
      expect(mockFs.writeFileSync).toHaveBeenCalled();
      const written = JSON.parse(mockFs.writeFileSync.mock.calls[0][1] as string);
      expect(written.agents.list).toHaveLength(1);
    });
  });

  describe('fetchActiveAgentIds', () => {
    const FIVE_MIN = 5 * 60 * 1000;

    it('returns empty set when CLI returns no sessions', () => {
      const active = fetchActiveAgentIds();
      expect(active.size).toBe(0);
    });

    it('includes active agents from fresh agent-activity.json', () => {
      const mockFsLocal = fs as jest.Mocked<typeof fs>;
      mockFsLocal.statSync.mockReturnValueOnce({ mtimeMs: Date.now() } as fs.Stats);
      mockFsLocal.readFileSync.mockReturnValueOnce(JSON.stringify({ tars: 'active', mother: 'idle' }));
      const { execFileSync } = require('child_process') as { execFileSync: jest.Mock };
      execFileSync.mockReturnValueOnce(JSON.stringify({ sessions: [] }));
      const active = fetchActiveAgentIds();
      expect(active.has('tars')).toBe(true);
      expect(active.has('mother')).toBe(false);
    });

    it('ignores agent-activity.json when mtime is older than 5 minutes', () => {
      const mockFsLocal = fs as jest.Mocked<typeof fs>;
      mockFsLocal.statSync.mockReturnValueOnce({ mtimeMs: Date.now() - FIVE_MIN - 1000 } as fs.Stats);
      const { execFileSync } = require('child_process') as { execFileSync: jest.Mock };
      execFileSync.mockReturnValueOnce(JSON.stringify({ sessions: [] }));
      const active = fetchActiveAgentIds();
      expect(active.has('tars')).toBe(false);
    });

    it('does not crash when agent-activity.json does not exist', () => {
      const mockFsLocal = fs as jest.Mocked<typeof fs>;
      mockFsLocal.statSync.mockImplementationOnce(() => { throw Object.assign(new Error('ENOENT'), { code: 'ENOENT' }); });
      const { execFileSync } = require('child_process') as { execFileSync: jest.Mock };
      execFileSync.mockReturnValueOnce(JSON.stringify({ sessions: [] }));
      expect(() => fetchActiveAgentIds()).not.toThrow();
    });

    it('returns set of agentIds from CLI sessions', () => {
      const { execFileSync } = require('child_process') as { execFileSync: jest.Mock };
      execFileSync.mockReturnValueOnce(JSON.stringify({ sessions: [{ agentId: 'hal9000' }, { agentId: 'tars' }] }));
      const active = fetchActiveAgentIds();
      expect(active.has('hal9000')).toBe(true);
      expect(active.has('tars')).toBe(true);
      expect(active.has('mother')).toBe(false);
    });

    it('returns empty set when CLI throws', () => {
      const { execFileSync } = require('child_process') as { execFileSync: jest.Mock };
      execFileSync.mockImplementationOnce(() => { throw new Error('fail'); });
      const active = fetchActiveAgentIds();
      expect(active.size).toBe(0);
    });
  });

  describe('readRawConfig error handling', () => {
    it('returns empty object when config file is unreadable', () => {
      mockFs.readFileSync.mockImplementation(() => { throw new Error('ENOENT'); });
      const result = updateAgent('any', { name: 'X' });
      expect(result).toBeNull();
    });
  });
});
