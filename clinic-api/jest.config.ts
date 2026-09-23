import type { Config } from 'jest';

const config: Config = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  rootDir: 'src',
  testMatch: ['**/Test/**/*.test.ts'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
  },
  setupFilesAfterFramework: [],
  globalSetup: './Test/isolation/setup.ts',
  globalTeardown: './Test/isolation/teardown.ts',
  testTimeout: 30000,
  verbose: true,
  // Run isolation tests serially — they share a real DB, order matters
  maxWorkers: 1,
  forceExit: true,
};

export default config;
