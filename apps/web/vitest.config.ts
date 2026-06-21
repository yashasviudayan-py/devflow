import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
  },
  resolve: {
    // Mirror the tsconfig `@/*` -> `src/*` path alias so modules under test that
    // import via `@/…` (e.g. api.ts -> @/lib/listQuery) resolve under vitest.
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
});
