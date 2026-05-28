import type { Config } from "jest"

const config: Config = {
  testTimeout: 15000,
  preset: "ts-jest/presets/default-esm",
  testEnvironment: "node",
  extensionsToTreatAsEsm: [".ts"],
  moduleNameMapper: {
    "^(\\.{1,2}/.*)\\.js$": "$1",
  },
  transform: {
    "^.+\\.tsx?$": [
      "ts-jest",
      {
        useESM: true,
      },
    ],
  },
  testMatch: [
  "**/*.test.ts",
  "**/__tests__/**/*.test.ts",
],
  setupFilesAfterEnv: ["./src/__tests__/setup.ts"],
}

export default config
