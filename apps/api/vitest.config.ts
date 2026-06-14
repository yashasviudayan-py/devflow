import { defineConfig } from "vitest/config";
import { TEST_DATABASE_URL } from "./src/test/config.js";

export default defineConfig({
  test: {
    environment: "node",
    // Injected before any module loads so the Prisma client connects to the
    // test database from the moment it is constructed.
    env: {
      DATABASE_URL: TEST_DATABASE_URL,
      JWT_SECRET: "test-jwt-secret",
      NODE_ENV: "test",
      WEB_URL: "http://localhost:3000",
    },
    // Applies migrations to the test database once before the suite runs.
    globalSetup: ["./src/test/globalSetup.ts"],
    // Truncates tables between tests.
    setupFiles: ["./src/test/setup.ts"],
    // Test files share one database, so run them serially to avoid cross-file
    // interference from the per-test truncation.
    fileParallelism: false,
    testTimeout: 20000,
    hookTimeout: 30000,
  },
});
