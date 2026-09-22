import type { FastifyInstance } from "fastify";
import type { Prisma } from "@prisma/client";
import { z } from "zod";
import { MasteryLevelSchema, BlockSchema } from "@the-desk/shared";
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
        pages: { orderBy: pageOrderBy, include: { annotations: { orderBy: { createdAt: "asc" } } } },
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

  const CreateAnnotationBody = z.object({
    anchorBlockId: z.string().uuid(),
    body: z.string().min(1),
  });

  app.post("/pages/:id/annotations", async (req, reply) => {
    const params = z.object({ id: z.string().uuid() }).safeParse(req.params);
    if (!params.success) return reply.code(400).send(params.error.flatten());
    const body = CreateAnnotationBody.safeParse(req.body);
    if (!body.success) return reply.code(400).send(body.error.flatten());

    return db.marginAnnotation.create({
      data: { pageId: params.data.id, anchorBlockId: body.data.anchorBlockId, body: body.data.body },
    });
  });

  app.delete("/annotations/:id", async (req, reply) => {
    const params = z.object({ id: z.string().uuid() }).safeParse(req.params);
    if (!params.success) return reply.code(400).send(params.error.flatten());
    await db.marginAnnotation.delete({ where: { id: params.data.id } });
    return { ok: true };
  });

  const ReorderPagesBody = z.object({ pageIds: z.array(z.string().uuid()).min(1) });

  // TOC is "user-reorderable" per the brief. The client always sends the
  // binder's FULL page-id list in the new desired order (concatenated across
  // tabs) rather than one tab's subset — order is a single flat field spanning
  // the whole binder, so reassigning only a subset risks leaving stale gaps
  // relative to pages the client didn't include. Simplest correct rule:
  // reassigning order = array index requires the full set, every time.
  app.patch("/binders/:id/pages/reorder", async (req, reply) => {
    const params = z.object({ id: z.string().uuid() }).safeParse(req.params);
    if (!params.success) return reply.code(400).send(params.error.flatten());
    const body = ReorderPagesBody.safeParse(req.body);
    if (!body.success) return reply.code(400).send(body.error.flatten());

    const binderPages = await db.page.findMany({ where: { binderId: params.data.id }, select: { id: true } });
    const binderPageIds = new Set(binderPages.map((p) => p.id));
    const sentIds = new Set(body.data.pageIds);
    const sameSet =
      binderPageIds.size === sentIds.size && [...binderPageIds].every((id) => sentIds.has(id));
    if (!sameSet) {
      return reply.code(400).send({ error: "pageIds must be exactly this binder's full page set" });
    }

    await db.$transaction(
      body.data.pageIds.map((id, index) => db.page.update({ where: { id }, data: { order: index } })),
    );

    return { ok: true };
  });

  const UpdateContentBody = z.object({ content: z.array(BlockSchema) });

  // A revision snapshot of the PRE-edit content is taken before every save —
  // this is what makes the manuscript timeline "just work" from normal
  // editing, with no separate "save a version" step for the student to
  // remember. Powers Writing's signature feature (see routes/pageRevisions).
  app.patch("/pages/:id/content", async (req, reply) => {
    const params = z.object({ id: z.string().uuid() }).safeParse(req.params);
    if (!params.success) return reply.code(400).send(params.error.flatten());
    const body = UpdateContentBody.safeParse(req.body);
    if (!body.success) return reply.code(400).send(body.error.flatten());

    const existing = await db.page.findUnique({ where: { id: params.data.id } });
    if (!existing) return reply.code(404).send({ error: "Page not found" });

    await db.pageRevision.create({
      data: { pageId: existing.id, content: existing.content as Prisma.InputJsonValue },
    });

    return db.page.update({
      where: { id: params.data.id },
      data: { content: body.data.content as unknown as Prisma.InputJsonValue },
    });
  });
}
