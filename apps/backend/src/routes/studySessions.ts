import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { db } from "../db.js";

export async function studySessionRoutes(app: FastifyInstance) {
  const StartBody = z.object({
    userId: z.string().uuid(),
    mode: z.enum(["pomodoro", "deep_work", "free"]),
  });

  app.post("/study-sessions", async (req, reply) => {
    const body = StartBody.safeParse(req.body);
    if (!body.success) return reply.code(400).send(body.error.flatten());

    return db.studySession.create({
      data: { userId: body.data.userId, mode: body.data.mode },
    });
  });

  const EndBody = z.object({ focusMinutes: z.number().int().nonnegative() });

  app.patch("/study-sessions/:id/end", async (req, reply) => {
    const params = z.object({ id: z.string().uuid() }).safeParse(req.params);
    if (!params.success) return reply.code(400).send(params.error.flatten());
    const body = EndBody.safeParse(req.body);
    if (!body.success) return reply.code(400).send(body.error.flatten());

    return db.studySession.update({
      where: { id: params.data.id },
      data: { endedAt: new Date(), focusMinutes: body.data.focusMinutes },
    });
  });

  app.get("/study-sessions/summary", async (req, reply) => {
    const query = z.object({ userId: z.string().uuid() }).safeParse(req.query);
    if (!query.success) return reply.code(400).send(query.error.flatten());

    const since = new Date();
    since.setHours(0, 0, 0, 0);

    const sessions = await db.studySession.findMany({
      where: { userId: query.data.userId, startedAt: { gte: since }, endedAt: { not: null } },
    });

    return {
      todayMinutes: sessions.reduce((sum, s) => sum + s.focusMinutes, 0),
      todaySessionCount: sessions.length,
    };
  });
}
