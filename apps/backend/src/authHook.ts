import type { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { verifyToken } from "./auth.js";

declare module "fastify" {
  interface FastifyRequest {
    userId?: string;
  }
}

// Public routes: anything else requires a valid Bearer token. Every other
// route in the app previously trusted a client-supplied userId in the query
// string or body — this hook is what makes that trust boundary real instead
// of decorative; route handlers should read req.userId, never req.query.userId.
const PUBLIC_ROUTES = new Set(["/health", "/auth/register", "/auth/login"]);

export function registerAuthHook(app: FastifyInstance) {
  app.addHook("preHandler", async (req: FastifyRequest, reply: FastifyReply) => {
    if (PUBLIC_ROUTES.has(req.routeOptions?.url ?? req.url.split("?")[0]!)) return;

    const header = req.headers.authorization;
    const token = header?.startsWith("Bearer ") ? header.slice("Bearer ".length) : null;
    const userId = token ? verifyToken(token) : null;
    if (!userId) {
      return reply.code(401).send({ error: "Missing or invalid Authorization header" });
    }
    req.userId = userId;
  });
}
