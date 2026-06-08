import dotenv from "dotenv";

dotenv.config();

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
