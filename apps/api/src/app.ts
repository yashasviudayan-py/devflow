import cors from "cors";
import cookieParser from "cookie-parser";
import express from "express";
import { env } from "./config/env.js";
import { errorMiddleware, notFoundMiddleware } from "./middleware/error.middleware.js";
import { requestContext } from "./middleware/request-context.middleware.js";
import { requestLogger } from "./middleware/request-logger.middleware.js";
import { authRouter } from "./routes/auth.routes.js";
import { commentRouter } from "./routes/comment.routes.js";
import { healthRouter } from "./routes/health.routes.js";
import { notificationRouter } from "./routes/notification.routes.js";
import { organizationRouter } from "./routes/organization.routes.js";
import { projectRouter } from "./routes/project.routes.js";
import { taskRouter } from "./routes/task.routes.js";

export const app = express();

// Assign/propagate a request id and log every request first, so even requests
// rejected by CORS or body parsing are traceable.
app.use(requestContext);
app.use(requestLogger);

// Explicit origin allowlist (never "*") with credentials enabled so the browser
// sends/accepts the HTTP-only auth cookie across the web and API origins.
app.use(
  cors({
    origin: env.CORS_ORIGINS,
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
app.use("/comments", commentRouter);
app.use("/notifications", notificationRouter);

app.use(notFoundMiddleware);
app.use(errorMiddleware);
