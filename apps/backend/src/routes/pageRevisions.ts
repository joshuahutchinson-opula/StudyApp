import type { FastifyInstance } from "fastify";
import type { Prisma } from "@prisma/client";
import { z } from "zod";
import { db } from "../db.js";

// Writing's signature feature: a git-history-like manuscript timeline. See
// PATCH /pages/:id/content (routes/binders.ts) for where revisions get created.
export async function pageRevisionRoutes(app: FastifyInstance) {
  app.get("/pages/:id/revisions", async (req, reply) => {
    const params = z.object({ id: z.string().uuid() }).safeParse(req.params);
    if (!params.success) return reply.code(400).send(params.error.flatten());

    return db.pageRevision.findMany({
      where: { pageId: params.data.id },
      orderBy: { createdAt: "desc" },
    });
  });

  app.post("/pages/:id/revisions/:revisionId/restore", async (req, reply) => {
    const params = z
      .object({ id: z.string().uuid(), revisionId: z.string().uuid() })
      .safeParse(req.params);
    if (!params.success) return reply.code(400).send(params.error.flatten());

    const revision = await db.pageRevision.findUnique({ where: { id: params.data.revisionId } });
    if (!revision || revision.pageId !== params.data.id) {
      return reply.code(404).send({ error: "Revision not found" });
    }

    const current = await db.page.findUnique({ where: { id: params.data.id } });
    if (!current) return reply.code(404).send({ error: "Page not found" });

    // Rewinding is itself reversible: snapshot the state being overwritten
    // before restoring, so "restore" is just another point on the timeline
    // rather than a destructive jump.
    await db.pageRevision.create({
      data: { pageId: current.id, content: current.content as Prisma.InputJsonValue },
    });

    return db.page.update({
      where: { id: params.data.id },
      data: { content: revision.content as Prisma.InputJsonValue },
    });
  });
}
