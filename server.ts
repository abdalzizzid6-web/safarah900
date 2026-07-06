
import { bootstrap } from "./server/index";

/**
 * PRODUCTION REFACTOR MODE
 * This is now just an entry point that bootstraps the modular server
 * logic found in the /server directory.
 */
bootstrap().catch(err => {
  console.error("[CRITICAL] Failed to bootstrap modular server:", err);
  process.exit(1);
});
