import type { FastifyInstance } from "fastify";
import type { Prisma } from "@prisma/client";
import { z } from "zod";
import { MasteryLevelSchema } from "@the-desk/shared";
import { db } from "../db.js";

// createdAt as tiebreaker keeps ordering deterministic if two pages ever share `order`.
const pageOrderBy: Prisma.PageOrderByWithRelationInput[] = [{ order: "asc" }, { createdAt: "asc" }];

export async function binderRoutes(app: FastifyInstance) {
  app.get("/binders", async (req, reply) => {
    const query = z.object({ userId: z.string().uuid() }).safeParse(req.query);
    if (!query.success) return reply.code(400).send(query.error.flatten());

    return db.binder.findMany({
      where: { userId: query.data.userId },
      orderBy: { createdAt: "asc" },
    });
  });

  app.get("/binders/:id", async (req, reply) => {
    const params = z.object({ id: z.string().uuid() }).safeParse(req.params);
    if (!params.success) return reply.code(400).send(params.error.flatten());

    const binder = await db.binder.findUnique({
      where: { id: params.data.id },
      include: {
        tabDividers: { orderBy: { order: "asc" } },
        pages: { orderBy: pageOrderBy },
      },
    });
    if (!binder) return reply.code(404).send({ error: "Binder not found" });
    return binder;
  });

  const CreatePageBody = z.object({
    tabDividerId: z.string().uuid().nullable(),
    title: z.string().min(1),
  });

  app.post("/binders/:id/pages", async (req, reply) => {
    const params = z.object({ id: z.string().uuid() }).safeParse(req.params);
    if (!params.success) return reply.code(400).send(params.error.flatten());
    const body = CreatePageBody.safeParse(req.body);
    if (!body.success) return reply.code(400).send(body.error.flatten());

    const lastPage = await db.page.findFirst({
      where: { binderId: params.data.id },
      orderBy: pageOrderBy,
    });

    return db.page.create({
      data: {
        binderId: params.data.id,
        tabDividerId: body.data.tabDividerId,
        title: body.data.title,
        order: (lastPage?.order ?? -1) + 1,
        content: [],
      },
    });
  });

  const UpdatePageBody = z.object({
    masteryLevel: MasteryLevelSchema.optional(),
    reviewed: z.boolean().optional(),
  });

  app.patch("/pages/:id", async (req, reply) => {
    const params = z.object({ id: z.string().uuid() }).safeParse(req.params);
    if (!params.success) return reply.code(400).send(params.error.flatten());
    const body = UpdatePageBody.safeParse(req.body);
    if (!body.success) return reply.code(400).send(body.error.flatten());

    const data: Prisma.PageUpdateInput = {};
    if (body.data.masteryLevel !== undefined) data.masteryLevel = body.data.masteryLevel;
    if (body.data.reviewed !== undefined) data.reviewed = body.data.reviewed;

    return db.page.update({
      where: { id: params.data.id },
      data,
    });
  });
}
