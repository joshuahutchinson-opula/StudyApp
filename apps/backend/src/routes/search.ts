import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { DisciplineSchema, type Block } from "@the-desk/shared";
import { db } from "../db.js";

export interface SearchResult {
  kind: "note" | "task" | "flashcard" | "citation";
  id: string;
  title: string;
  snippet: string;
  // Navigation target: which page to jump to for this result.
  pageId?: string;
}

function blockText(block: Block): string {
  switch (block.kind) {
    case "heading":
    case "paragraph":
      return block.text;
    case "list":
      return block.items.join(" ");
    case "code":
      return block.code;
    default:
      return "";
  }
}

function snippetAround(text: string, query: string, radius = 60): string {
  const idx = text.toLowerCase().indexOf(query.toLowerCase());
  if (idx === -1) return text.slice(0, radius * 2);
  const start = Math.max(0, idx - radius);
  const end = Math.min(text.length, idx + query.length + radius);
  return `${start > 0 ? "…" : ""}${text.slice(start, end)}${end < text.length ? "…" : ""}`;
}

// Keyword (exact, case-insensitive substring) search — the first of the three
// layers the brief describes (keyword / semantic / graph-aware). Semantic and
// graph-aware search need an embeddings/LLM layer this pass doesn't build;
// this is the honest, fully-functional slice rather than a fake full version.
export async function searchRoutes(app: FastifyInstance) {
  app.get("/search", async (req, reply) => {
    const query = z
      .object({ userId: z.string().uuid(), discipline: DisciplineSchema, q: z.string().min(1) })
      .safeParse(req.query);
    if (!query.success) return reply.code(400).send(query.error.flatten());
    const { userId, discipline, q } = query.data;
    const needle = q.toLowerCase();

    const results: SearchResult[] = [];

    const binders = await db.binder.findMany({
      where: { userId, discipline },
      include: { pages: true },
    });
    for (const binder of binders) {
      for (const page of binder.pages) {
        const blocks = page.content as unknown as Block[];
        const fullText = [page.title, ...blocks.map(blockText)].join(" ");
        if (fullText.toLowerCase().includes(needle)) {
          results.push({
            kind: "note",
            id: page.id,
            title: page.title,
            snippet: snippetAround(fullText, q),
            pageId: page.id,
          });
        }
      }
    }

    const tasks = await db.task.findMany({ where: { userId, discipline } });
    for (const task of tasks) {
      if (task.title.toLowerCase().includes(needle)) {
        results.push({ kind: "task", id: task.id, title: task.title, snippet: task.status });
      }
    }

    const cards = await db.spacedRepetitionCard.findMany({ where: { userId, discipline } });
    for (const card of cards) {
      const text = `${card.front} ${card.back}`;
      if (text.toLowerCase().includes(needle)) {
        results.push({
          kind: "flashcard",
          id: card.id,
          title: card.front,
          snippet: snippetAround(text, q),
          ...(card.sourcePageId ? { pageId: card.sourcePageId } : {}),
        });
      }
    }

    const citations = await db.citation.findMany({ where: { userId, discipline } });
    for (const citation of citations) {
      const text = `${citation.title} ${citation.authors.join(" ")}`;
      if (text.toLowerCase().includes(needle)) {
        results.push({ kind: "citation", id: citation.id, title: citation.title, snippet: citation.authors.join(", ") });
      }
    }

    return results;
  });
}
