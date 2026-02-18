import type { Config } from "jest";

import baseConfig from "./jest.config";

const config: Config = {
  ...baseConfig,
  setupFilesAfterEnv: ["<rootDir>/jest.setup.ts", "<rootDir>/jest.integration.setup.ts"],
  testMatch: ["**/*.int.test.ts", "**/*.int.test.tsx"],
  transformIgnorePatterns: ["/node_modules/(?!(msw|@mswjs|until-async)/)"],
  testEnvironmentOptions: {
    customExportConditions: ["node", "node-addons"],
  },
  collectCoverage: false,
};

export default config;
