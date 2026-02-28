jest.mock('server-only', () => ({}));

describe('config.ts', () => {
  it('readOpenClawConfig returns fallback on error', () => {
    // Test using require after mocking
    const origFs = jest.requireActual('fs');
    const mockFs = { ...origFs, readFileSync: () => { throw new Error('ENOENT'); } };
    jest.doMock('fs', () => mockFs);
    jest.resetModules();
    const { readOpenClawConfig } = require('@/lib/config');
    const result = readOpenClawConfig();
    expect(result).toEqual({ agents: { list: [] } });
    jest.dontMock('fs');
  });

  it('fileExists returns false on error', () => {
    const origFs = jest.requireActual('fs');
    const mockFs = { ...origFs, accessSync: () => { throw new Error('ENOENT'); } };
    jest.doMock('fs', () => mockFs);
    jest.resetModules();
    const { fileExists } = require('@/lib/config');
    expect(fileExists('/nonexistent')).toBe(false);
    jest.dontMock('fs');
  });

  it('fileExists returns true on success', () => {
    const origFs = jest.requireActual('fs');
    const mockFs = { ...origFs, accessSync: () => {} };
    jest.doMock('fs', () => mockFs);
    jest.resetModules();
    const { fileExists } = require('@/lib/config');
    expect(fileExists('/exists')).toBe(true);
    jest.dontMock('fs');
  });
});
