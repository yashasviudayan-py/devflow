import cors from "cors";
import express from "express";
import { env } from "./config/env.js";
import { errorMiddleware, notFoundMiddleware } from "./middleware/error.middleware.js";
import { healthRouter } from "./routes/health.routes.js";

export const app = express();

app.use(
  cors({
    origin: env.WEB_URL,
    credentials: true,
  }),
);
app.use(express.json());

app.use("/health", healthRouter);

app.use(notFoundMiddleware);
app.use(errorMiddleware);
