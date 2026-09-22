import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { db } from "../db.js";

export async function critiqueRoutes(app: FastifyInstance) {
  app.get("/pages/:id/critique-threads", async (req, reply) => {
    const params = z.object({ id: z.string().uuid() }).safeParse(req.params);
    if (!params.success) return reply.code(400).send(params.error.flatten());

    return db.critiqueThread.findMany({
      where: { pageId: params.data.id },
      include: { comments: { orderBy: { createdAt: "asc" } } },
      orderBy: { createdAt: "asc" },
    });
  });

  const CreateThreadBody = z.object({
    x: z.number().min(0).max(100),
    y: z.number().min(0).max(100),
    authorName: z.string().min(1),
    body: z.string().min(1),
  });

  app.post("/pages/:id/critique-threads", async (req, reply) => {
    const params = z.object({ id: z.string().uuid() }).safeParse(req.params);
    if (!params.success) return reply.code(400).send(params.error.flatten());
    const body = CreateThreadBody.safeParse(req.body);
    if (!body.success) return reply.code(400).send(body.error.flatten());

    return db.critiqueThread.create({
      data: {
        pageId: params.data.id,
        x: body.data.x,
        y: body.data.y,
        comments: { create: { authorName: body.data.authorName, body: body.data.body } },
      },
      include: { comments: true },
    });
  });

  const AddCommentBody = z.object({ authorName: z.string().min(1), body: z.string().min(1) });

  app.post("/critique-threads/:id/comments", async (req, reply) => {
    const params = z.object({ id: z.string().uuid() }).safeParse(req.params);
    if (!params.success) return reply.code(400).send(params.error.flatten());
    const body = AddCommentBody.safeParse(req.body);
    if (!body.success) return reply.code(400).send(body.error.flatten());

    return db.critiqueComment.create({
      data: { threadId: params.data.id, authorName: body.data.authorName, body: body.data.body },
    });
  });

  const UpdateThreadBody = z.object({ resolved: z.boolean() });

  app.patch("/critique-threads/:id", async (req, reply) => {
    const params = z.object({ id: z.string().uuid() }).safeParse(req.params);
    if (!params.success) return reply.code(400).send(params.error.flatten());
    const body = UpdateThreadBody.safeParse(req.body);
    if (!body.success) return reply.code(400).send(body.error.flatten());

    return db.critiqueThread.update({
      where: { id: params.data.id },
      data: { resolved: body.data.resolved },
    });
  });
}
