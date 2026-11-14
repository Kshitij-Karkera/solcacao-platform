import { app } from "./app.js";
import { env } from "./config/env.js";
import { pool } from "./config/db.js";

const server = app.listen(env.PORT, () => {
  console.log(`SolCacao API listening on :${env.PORT} (${env.NODE_ENV})`);
});

// Graceful shutdown for Azure App Service / containers.
for (const sig of ["SIGTERM", "SIGINT"]) {
  process.on(sig, () => {
    server.close(() => pool.end().then(() => process.exit(0)));
  });
}
