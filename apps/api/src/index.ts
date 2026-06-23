import { app } from "./app.js";
import { env } from "./config/env.js";
import { logger } from "./utils/logger.js";

// Listen on the platform-provided PORT (falling back to API_PORT/4000 locally)
// and bind to all interfaces so hosting platforms can route to the container.
const server = app.listen(env.PORT, env.HOST, () => {
  // Log only non-sensitive startup context — never JWT_SECRET or DATABASE_URL.
  logger.info("api.started", {
    nodeEnv: env.NODE_ENV,
    host: env.HOST,
    port: env.PORT,
    webUrl: env.WEB_URL,
  });
});

function shutdown(signal: NodeJS.Signals) {
  logger.info("api.shutdown", { signal });
  server.close(() => {
    logger.info("api.closed");
    process.exit(0);
  });
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
