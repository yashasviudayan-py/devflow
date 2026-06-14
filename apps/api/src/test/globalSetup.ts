import { execSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { TEST_DATABASE_URL } from "./config.js";

// Repo-root Prisma schema, resolved relative to this file (apps/api/src/test).
const schemaPath = fileURLToPath(new URL("../../../../prisma/schema.prisma", import.meta.url));

/**
 * Runs once before the whole suite: applies all migrations to the test database
 * so route tests exercise real SQL against the same schema production uses.
 * `migrate deploy` is idempotent, and Prisma creates the target schema if it
 * does not exist yet.
 */
export default function setup() {
  execSync(`pnpm exec prisma migrate deploy --schema "${schemaPath}"`, {
    stdio: "inherit",
    env: {
      ...process.env,
      DATABASE_URL: TEST_DATABASE_URL,
    },
  });
}
