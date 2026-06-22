import dotenv from "dotenv";
import { fileURLToPath } from "node:url";

// Load apps/api/.env first if present, then fall back to the repo root .env
// (where the docs say to create it). dotenv never overrides existing values,
// so the more specific file wins. The root path is resolved relative to this
// file so it works from both src (tsx) and dist (build) at the same depth.
dotenv.config();
dotenv.config({ path: fileURLToPath(new URL("../../../../.env", import.meta.url)) });

const NODE_ENVS = ["development", "test", "production"] as const;
type NodeEnv = (typeof NODE_ENVS)[number];

const PLACEHOLDER_JWT_SECRET = "replace-this-with-a-long-random-secret-before-using-auth";

export type Env = {
  API_PORT: number;
  WEB_URL: string;
  JWT_SECRET: string;
  DATABASE_URL: string;
  NODE_ENV: NodeEnv;
};

/**
 * Validates the process environment and returns a typed, frozen config object.
 * All problems are collected and reported together so a misconfigured
 * deployment fails fast at startup with a single, clear message instead of a
 * confusing runtime error later (e.g. Prisma failing on a missing DATABASE_URL).
 *
 * Exported as a pure function (taking the source env) so it can be unit-tested
 * without mutating `process.env`. A hand-rolled validator is used rather than
 * zod to avoid adding a direct dependency to this package.
 */
export function loadEnv(source: NodeJS.ProcessEnv = process.env): Env {
  const errors: string[] = [];

  const nodeEnvRaw = source.NODE_ENV ?? "development";
  if (!NODE_ENVS.includes(nodeEnvRaw as NodeEnv)) {
    errors.push(`NODE_ENV must be one of ${NODE_ENVS.join(", ")} (got "${nodeEnvRaw}").`);
  }
  const nodeEnv = nodeEnvRaw as NodeEnv;
  const isProduction = nodeEnv === "production";

  const databaseUrl = source.DATABASE_URL?.trim();
  if (!databaseUrl) {
    errors.push("DATABASE_URL is required (the PostgreSQL connection string).");
  }

  const jwtSecret = source.JWT_SECRET?.trim();
  if (!jwtSecret) {
    errors.push("JWT_SECRET is required (used to sign auth tokens).");
  } else if (isProduction && (jwtSecret.length < 16 || jwtSecret === PLACEHOLDER_JWT_SECRET)) {
    errors.push(
      "JWT_SECRET must be a strong secret (at least 16 characters and not the example placeholder) in production.",
    );
  }

  const apiPort = Number(source.API_PORT ?? 4000);
  if (!Number.isInteger(apiPort) || apiPort <= 0) {
    errors.push(`API_PORT must be a positive integer (got "${source.API_PORT}").`);
  }

  const webUrl = source.WEB_URL?.trim() || "http://localhost:3000";

  if (errors.length > 0) {
    throw new Error(
      `Invalid environment configuration:\n  - ${errors.join("\n  - ")}\n` +
        "Check your .env file against .env.example.",
    );
  }

  return Object.freeze({
    API_PORT: apiPort,
    WEB_URL: webUrl,
    JWT_SECRET: jwtSecret as string,
    DATABASE_URL: databaseUrl as string,
    NODE_ENV: nodeEnv,
  });
}

export const env = loadEnv();
