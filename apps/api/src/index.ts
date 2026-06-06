import { app } from "./app.js";
import { env } from "./config/env.js";

const server = app.listen(env.API_PORT, () => {
  console.log(`DevFlow API listening on http://localhost:${env.API_PORT}`);
});

function shutdown(signal: NodeJS.Signals) {
  console.log(`${signal} received. Closing DevFlow API server.`);
  server.close(() => {
    console.log("DevFlow API server closed.");
    process.exit(0);
  });
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
