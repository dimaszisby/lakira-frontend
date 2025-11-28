import type { Config } from "jest";

const config: Config = {
  preset: "ts-jest",
  testEnvironment: "jest-environment-jsdom",
  setupFilesAfterEnv: ["<rootDir>/jest.setup.ts"],
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
  collectCoverageFrom: [
    "src/**/*.{ts,tsx}",
    "!src/**/*.d.ts",
    "!src/**/index.{ts,tsx}",
    "!src/**/stories.{ts,tsx}",
    "!src/styles/**"
  ],
  coverageReporters: ["text", "lcov", "json-summary"],
  coverageThreshold: {
    global: {
      statements: 3,
      branches: 2,
      functions: 3,
      lines: 3
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
