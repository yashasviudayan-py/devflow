import cors from "cors";
import cookieParser from "cookie-parser";
import express from "express";
import { env } from "./config/env.js";
import { errorMiddleware, notFoundMiddleware } from "./middleware/error.middleware.js";
import { authRouter } from "./routes/auth.routes.js";
import { healthRouter } from "./routes/health.routes.js";
import { organizationRouter } from "./routes/organization.routes.js";
import { projectRouter } from "./routes/project.routes.js";
import { taskRouter } from "./routes/task.routes.js";

export const app = express();

app.use(
  cors({
    origin: env.WEB_URL,
    credentials: true,
  }),
);
app.use(cookieParser());
app.use(express.json());

app.use("/auth", authRouter);
app.use("/health", healthRouter);
app.use("/organizations", organizationRouter);
app.use("/projects", projectRouter);
app.use("/tasks", taskRouter);

app.use(notFoundMiddleware);
app.use(errorMiddleware);
