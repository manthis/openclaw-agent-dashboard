import type { Config } from 'jest';
import nextJest from 'next/jest.js';
const createJestConfig = nextJest({ dir: './' });
const config: Config = {
  coverageProvider: 'v8',
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  testMatch: ['<rootDir>/src/__tests__/**/*.{test,spec}.{ts,tsx}'],
  clearMocks: true,
  resetModules: false,
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@xyflow/react$': '<rootDir>/__mocks__/@xyflow/react.tsx',
    '^server-only$': '<rootDir>/__mocks__/server-only.ts',
  },
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/app/layout.tsx',
    '!src/app/page.tsx',
    '!src/components/ui/**',
    '!src/types/**',
    '!src/lib/utils.ts',
    '!src/app/api/**',
    '!src/components/DashboardClient.tsx',
    '!src/components/GraphClient.tsx',
  ],
  coverageThreshold: { global: { lines: 80, branches: 70, functions: 70, statements: 80 } },
};
export default createJestConfig(config);
