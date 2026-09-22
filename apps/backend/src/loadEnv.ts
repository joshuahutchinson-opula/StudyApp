import { loadEnvFile } from "node:process";
import { fileURLToPath } from "node:url";

// Must be the first thing server.ts imports. Without this, env vars only
// ever got loaded as an incidental side effect of Prisma Client's own
// constructor reading .env for DATABASE_URL — which happens to work for
// Prisma itself, but meant any OTHER module (like auth.ts reading
// JWT_SECRET) that evaluates earlier in the import chain than db.ts saw an
// empty process.env and failed. Resolved relative to this file rather than
// relying on cwd, since that can vary depending on how the process is launched.
const envPath = fileURLToPath(new URL("../.env", import.meta.url));
try {
  loadEnvFile(envPath);
} catch {
  // No .env file (e.g. a deployment providing real environment variables
  // directly) — not an error condition.
}
