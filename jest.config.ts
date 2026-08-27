import type { Config } from "jest";

const config: Config = {
  preset: "ts-jest",
  testEnvironment: "jest-environment-jsdom",
  setupFilesAfterEnv: ["<rootDir>/jest.setup.ts", "<rootDir>/jest.integration.setup.ts"],
  moduleNameMapper: {
    "^@/src/(.*)$": "<rootDir>/src/$1",
    "^@/app/(.*)$": "<rootDir>/src/app/$1",
    "^@/features/(.*)$": "<rootDir>/src/features/$1",
    "^@/validators/(.*)$": "<rootDir>/src/validators/$1",
    "^@/api/(.*)$": "<rootDir>/src/services/api/$1",
    "^@/hooks/(.*)$": "<rootDir>/src/hooks/$1",
    "^@/constants/(.*)$": "<rootDir>/src/constants/$1",
    "^@/types/(.*)$": "<rootDir>/src/types/$1",
    "^@/generics/(.*)$": "<rootDir>/src/generics/$1",
    "^@/services/(.*)$": "<rootDir>/src/services/$1",
    "^@/utils/(.*)$": "<rootDir>/src/utils/$1",
    "^@/lib/(.*)$": "<rootDir>/src/lib/$1",
    "^@/styles/(.*)$": "<rootDir>/src/styles/$1",
    "^@/components/(.*)$": "<rootDir>/src/components/$1",
    "^@/ui/(.*)$": "<rootDir>/src/components/ui/$1",
    "\\.(css|pcss)$": "identity-obj-proxy"
  },
  testPathIgnorePatterns: [
    "<rootDir>/node_modules/",
    "<rootDir>/.next/",
    "<rootDir>/cypress/",
    "<rootDir>/dist/"
  ],
  transformIgnorePatterns: ["/node_modules/(?!(msw|@mswjs|until-async)/)"],
  testEnvironmentOptions: {
    customExportConditions: ["node", "node-addons"],
  },
  collectCoverageFrom: [
    "src/**/*.{ts,tsx}",
    "!src/**/*.d.ts",
    "!src/**/index.{ts,tsx}",
    "!src/**/stories.{ts,tsx}",
    "!src/styles/**"
  ],
  coverageReporters: ["text", "lcov", "json-summary"],
  // Ratcheted to just below measured coverage on 2026-08-27
  // (statements 29.56 / branches 30.21 / functions 26.97 / lines 29.61), so a
  // real regression fails while normal fluctuation does not. These were 3/2/3/3,
  // roughly a tenth of actual, which meant the gate could not fail for the
  // reason it exists. Raise them as suites grow; never lower them to make a
  // build pass.
  coverageThreshold: {
    global: {
      statements: 29,
      branches: 29,
      functions: 26,
      lines: 29
    }
  },
  transform: {
    "^.+\\.(t|j)sx?$": [
      "ts-jest",
      {
        tsconfig: "<rootDir>/tsconfig.jest.json"
      }
    ]
  }
};

export default config;
