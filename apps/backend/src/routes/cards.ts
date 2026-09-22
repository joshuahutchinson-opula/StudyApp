import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { DisciplineSchema } from "@the-desk/shared";
import { db } from "../db.js";
import { scheduleReview } from "../srs.js";

export async function cardRoutes(app: FastifyInstance) {
  app.get("/cards/due", async (req, reply) => {
    const query = z
      .object({ userId: z.string().uuid(), discipline: DisciplineSchema })
      .safeParse(req.query);
    if (!query.success) return reply.code(400).send(query.error.flatten());

    return db.spacedRepetitionCard.findMany({
      where: {
        userId: query.data.userId,
        discipline: query.data.discipline,
        dueAt: { lte: new Date() },
      },
      orderBy: { dueAt: "asc" },
    });
  });

  const CreateCardBody = z.object({
    userId: z.string().uuid(),
    discipline: DisciplineSchema,
    sourcePageId: z.string().uuid().nullable().optional(),
    front: z.string().min(1),
    back: z.string().min(1),
  });

  app.post("/cards", async (req, reply) => {
    const body = CreateCardBody.safeParse(req.body);
    if (!body.success) return reply.code(400).send(body.error.flatten());

    return db.spacedRepetitionCard.create({
      data: {
        userId: body.data.userId,
        discipline: body.data.discipline,
        sourcePageId: body.data.sourcePageId ?? null,
        front: body.data.front,
        back: body.data.back,
      },
    });
  });

  const ReviewBody = z.object({
    grade: z.enum(["again", "hard", "good", "easy"]),
  });

  app.post("/cards/:id/review", async (req, reply) => {
    const params = z.object({ id: z.string().uuid() }).safeParse(req.params);
    if (!params.success) return reply.code(400).send(params.error.flatten());
    const body = ReviewBody.safeParse(req.body);
    if (!body.success) return reply.code(400).send(body.error.flatten());

    const card = await db.spacedRepetitionCard.findUnique({ where: { id: params.data.id } });
    if (!card) return reply.code(404).send({ error: "Card not found" });

    const result = scheduleReview(
      { intervalDays: card.intervalDays, easeFactor: card.easeFactor, reviewCount: card.reviewCount },
      body.data.grade,
    );

    const updated = await db.spacedRepetitionCard.update({
      where: { id: card.id },
      data: {
        intervalDays: result.intervalDays,
        easeFactor: result.easeFactor,
        reviewCount: result.reviewCount,
        dueAt: result.dueAt,
        masteryLevel: result.masteryLevel,
      },
    });

    // Mastery tagging is the connective tissue between the binder and study
    // tools — a reviewed card keeps its source page's dog-eared mastery in sync.
    if (card.sourcePageId) {
      await db.page.update({
        where: { id: card.sourcePageId },
        data: { masteryLevel: result.masteryLevel },
      });
    }

    return updated;
  });
}
