import type { FastifyInstance } from "fastify";
import type { Prisma } from "@prisma/client";
import { z } from "zod";
import { DisciplineSchema } from "@the-desk/shared";
import { db } from "../db.js";

export async function taskRoutes(app: FastifyInstance) {
  app.get("/tasks", async (req, reply) => {
    const query = z
      .object({ userId: z.string().uuid(), discipline: DisciplineSchema.optional() })
      .safeParse(req.query);
    if (!query.success) return reply.code(400).send(query.error.flatten());

    const where: Prisma.TaskWhereInput = { userId: query.data.userId };
    if (query.data.discipline !== undefined) where.discipline = query.data.discipline;

    return db.task.findMany({ where, orderBy: { createdAt: "asc" } });
  });

  const CreateTaskBody = z.object({
    userId: z.string().uuid(),
    discipline: DisciplineSchema,
    title: z.string().min(1),
    status: z.enum(["backlog", "todo", "in_progress", "done"]).default("backlog"),
    dueAt: z.coerce.date().nullable().optional(),
    parentTaskId: z.string().uuid().optional(),
  });

  app.post("/tasks", async (req, reply) => {
    const body = CreateTaskBody.safeParse(req.body);
    if (!body.success) return reply.code(400).send(body.error.flatten());

    return db.task.create({
      data: {
        userId: body.data.userId,
        discipline: body.data.discipline,
        title: body.data.title,
        status: body.data.status,
        dueAt: body.data.dueAt ?? null,
        parentTaskId: body.data.parentTaskId ?? null,
      },
    });
  });

  const UpdateTaskBody = z.object({
    status: z.enum(["backlog", "todo", "in_progress", "done"]).optional(),
    title: z.string().min(1).optional(),
  });

  app.patch("/tasks/:id", async (req, reply) => {
    const params = z.object({ id: z.string().uuid() }).safeParse(req.params);
    if (!params.success) return reply.code(400).send(params.error.flatten());
    const body = UpdateTaskBody.safeParse(req.body);
    if (!body.success) return reply.code(400).send(body.error.flatten());

    const data: Prisma.TaskUpdateInput = {};
    if (body.data.status !== undefined) data.status = body.data.status;
    if (body.data.title !== undefined) data.title = body.data.title;

    return db.task.update({ where: { id: params.data.id }, data });
  });

  app.delete("/tasks/:id", async (req, reply) => {
    const params = z.object({ id: z.string().uuid() }).safeParse(req.params);
    if (!params.success) return reply.code(400).send(params.error.flatten());
    await db.task.delete({ where: { id: params.data.id } });
    return { ok: true };
  });

  app.get("/deadlines", async (req, reply) => {
    const query = z.object({ userId: z.string().uuid() }).safeParse(req.query);
    if (!query.success) return reply.code(400).send(query.error.flatten());

    return db.deadline.findMany({
      where: { userId: query.data.userId },
      orderBy: { dueAt: "asc" },
    });
  });

  const CreateDeadlineBody = z.object({
    userId: z.string().uuid(),
    title: z.string().min(1),
    dueAt: z.coerce.date(),
  });

  app.post("/deadlines", async (req, reply) => {
    const body = CreateDeadlineBody.safeParse(req.body);
    if (!body.success) return reply.code(400).send(body.error.flatten());

    return db.deadline.create({
      data: { userId: body.data.userId, title: body.data.title, dueAt: body.data.dueAt },
    });
  });
}
