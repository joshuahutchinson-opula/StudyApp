import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { db } from "../db.js";
import { buildFeedback, type DifferentialOption, type TestOption } from "../rubric.js";

export async function caseRoutes(app: FastifyInstance) {
  app.get("/cases", async () => {
    return db.clinicalCase.findMany({
      select: { id: true, title: true, vignette: true, createdAt: true },
      orderBy: { createdAt: "asc" },
    });
  });

  app.get("/cases/:id", async (req, reply) => {
    const params = z.object({ id: z.string().uuid() }).safeParse(req.params);
    if (!params.success) return reply.code(400).send(params.error.flatten());

    const clinicalCase = await db.clinicalCase.findUnique({ where: { id: params.data.id } });
    if (!clinicalCase) return reply.code(404).send({ error: "Case not found" });

    // Don't leak which options are "indicated"/weighted correct before submission.
    const differentialOptions = clinicalCase.differentialOptions as unknown as DifferentialOption[];
    const testOptions = clinicalCase.testOptions as unknown as TestOption[];
    return {
      id: clinicalCase.id,
      title: clinicalCase.title,
      vignette: clinicalCase.vignette,
      differentialChoices: differentialOptions.map((o) => o.label),
      testChoices: testOptions.map((o) => o.label),
    };
  });

  const AttemptBody = z.object({
    differential: z.array(z.string().min(1)),
    orderedTests: z.array(z.string()),
  });

  app.post("/cases/:id/attempts", async (req, reply) => {
    const params = z.object({ id: z.string().uuid() }).safeParse(req.params);
    if (!params.success) return reply.code(400).send(params.error.flatten());
    const body = AttemptBody.safeParse(req.body);
    if (!body.success) return reply.code(400).send(body.error.flatten());

    const clinicalCase = await db.clinicalCase.findUnique({ where: { id: params.data.id } });
    if (!clinicalCase) return reply.code(404).send({ error: "Case not found" });

    const { feedback, score } = buildFeedback(
      body.data.differential,
      body.data.orderedTests,
      clinicalCase.differentialOptions as unknown as DifferentialOption[],
      clinicalCase.testOptions as unknown as TestOption[],
    );

    return db.caseAttempt.create({
      data: {
        userId: req.userId!,
        caseId: clinicalCase.id,
        differential: body.data.differential,
        orderedTests: body.data.orderedTests,
        score,
        feedback: feedback as unknown as object,
      },
    });
  });
}
