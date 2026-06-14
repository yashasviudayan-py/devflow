import { afterAll, beforeEach } from "vitest";
import { prisma, resetDatabase } from "./harness.js";

// Runs in every test worker. Env vars (DATABASE_URL, JWT_SECRET, …) are injected
// by `vitest.config.ts` before any module loads, so the Prisma client imported
// here is already pointed at the test database.
beforeEach(async () => {
  await resetDatabase();
});

afterAll(async () => {
  await prisma.$disconnect();
});
