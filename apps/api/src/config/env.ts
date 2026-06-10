import dotenv from "dotenv";
import { fileURLToPath } from "node:url";

// Load apps/api/.env first if present, then fall back to the repo root .env
// (where the docs say to create it). dotenv never overrides existing values,
// so the more specific file wins. The root path is resolved relative to this
// file so it works from both src (tsx) and dist (build) at the same depth.
dotenv.config();
dotenv.config({ path: fileURLToPath(new URL("../../../../.env", import.meta.url)) });

const apiPort = Number(process.env.API_PORT ?? 4000);

if (!Number.isInteger(apiPort) || apiPort <= 0) {
  throw new Error("API_PORT must be a positive integer.");
}

const nodeEnv = process.env.NODE_ENV ?? "development";

if (!process.env.JWT_SECRET) {
  throw new Error("JWT_SECRET is required.");
}

export const env = {
  API_PORT: apiPort,
  WEB_URL: process.env.WEB_URL ?? "http://localhost:3000",
  JWT_SECRET: process.env.JWT_SECRET,
  NODE_ENV: nodeEnv,
} as const;
