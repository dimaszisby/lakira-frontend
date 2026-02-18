import type { Config } from "jest";

import baseConfig from "./jest.config";

const config: Config = {
  ...baseConfig,
  setupFilesAfterEnv: ["<rootDir>/jest.setup.ts"],
  testMatch: ["**/*.test.ts", "**/*.test.tsx", "**/*.spec.ts", "**/*.spec.tsx"],
  testPathIgnorePatterns: [
    ...(baseConfig.testPathIgnorePatterns ?? []),
    "\\.int\\.test\\.ts$",
    "\\.int\\.test\\.tsx$",
  ],
};

export default config;
