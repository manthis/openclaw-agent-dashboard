import { getAgents, getAgent, getAgentsGraph, getAgentsStatus, STATIC_RELATIONS, updateAgent, deleteAgent, createAgent } from '@/lib/agents';
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
}));

const mockFs = fs as jest.Mocked<typeof fs>;

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

  describe('readRawConfig error handling', () => {
    it('returns empty object when config file is unreadable', () => {
      mockFs.readFileSync.mockImplementation(() => { throw new Error('ENOENT'); });
      const result = updateAgent('any', { name: 'X' });
      expect(result).toBeNull();
    });
  });
});
