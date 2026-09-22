import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { DisciplineSchema, DISCIPLINE_DEFAULT_CITATION_STYLE } from "@the-desk/shared";
import { db } from "../db.js";
import { formatCitation } from "../citationFormat.js";

export async function citationRoutes(app: FastifyInstance) {
  app.get("/citations", async (req, reply) => {
    const query = z
      .object({ userId: z.string().uuid(), discipline: DisciplineSchema })
      .safeParse(req.query);
    if (!query.success) return reply.code(400).send(query.error.flatten());

    const citations = await db.citation.findMany({
      where: { userId: query.data.userId, discipline: query.data.discipline },
      orderBy: { createdAt: "desc" },
    });

    return citations.map((c) => ({ ...c, formatted: formatCitation(c) }));
  });

  const CreateCitationBody = z.object({
    userId: z.string().uuid(),
    discipline: DisciplineSchema,
    sourceType: z.enum(["article", "book", "website", "conference_paper", "other"]),
    title: z.string().min(1),
    authors: z.array(z.string().min(1)).min(1),
    year: z.number().int().optional(),
    publisher: z.string().optional(),
    url: z.string().optional(),
    doi: z.string().optional(),
  });

  app.post("/citations", async (req, reply) => {
    const body = CreateCitationBody.safeParse(req.body);
    if (!body.success) return reply.code(400).send(body.error.flatten());

    const citation = await db.citation.create({
      data: {
        userId: body.data.userId,
        discipline: body.data.discipline,
        style: DISCIPLINE_DEFAULT_CITATION_STYLE[body.data.discipline],
        sourceType: body.data.sourceType,
        title: body.data.title,
        authors: body.data.authors,
        year: body.data.year ?? null,
        publisher: body.data.publisher ?? null,
        url: body.data.url ?? null,
        doi: body.data.doi ?? null,
      },
    });

    return { ...citation, formatted: formatCitation(citation) };
  });

  app.delete("/citations/:id", async (req, reply) => {
    const params = z.object({ id: z.string().uuid() }).safeParse(req.params);
    if (!params.success) return reply.code(400).send(params.error.flatten());
    await db.citation.delete({ where: { id: params.data.id } });
    return { ok: true };
  });
}
