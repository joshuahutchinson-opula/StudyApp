import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { DisciplineSchema } from "@the-desk/shared";
import { db } from "../db.js";

// Textbooks are shared reference material per discipline (no userId, same
// pattern as ClinicalCase) — read-only from the client's perspective. The
// only mutation Tier 4 needs ("file to binder") copies a chapter's content
// into a real Page via the existing binder routes, so there's nothing to
// write here.
export async function textbookRoutes(app: FastifyInstance) {
  app.get("/textbooks", async (req, reply) => {
    const query = z.object({ discipline: DisciplineSchema }).safeParse(req.query);
    if (!query.success) return reply.code(400).send(query.error.flatten());

    const textbook = await db.textbook.findFirst({
      where: { discipline: query.data.discipline },
      include: { chapters: { orderBy: { order: "asc" } } },
    });
    if (!textbook) return reply.code(404).send({ error: "No textbook for this discipline yet" });

    return textbook;
  });
}
