import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { DisciplineSchema } from "@the-desk/shared";
import { db } from "../db.js";

export interface GraphNodeDto {
  id: string;
  kind: "note" | "flashcard" | "task";
  label: string;
  cluster: string;
  mastery?: string;
}

export interface GraphEdgeDto {
  id: string;
  source: string;
  target: string;
  kind: "references";
}

// Derived on read from existing tables rather than a separately-synced graph
// table — simpler, and can't drift out of sync with the binder/planner data
// it's a view over. The GraphNode/GraphEdge models in the schema are for a
// future pass where AI-suggested or manually-drawn links need to persist
// independently of any single source entity.
export async function graphRoutes(app: FastifyInstance) {
  app.get("/graph", async (req, reply) => {
    const query = z
      .object({ userId: z.string().uuid(), discipline: DisciplineSchema })
      .safeParse(req.query);
    if (!query.success) return reply.code(400).send(query.error.flatten());
    const { userId, discipline } = query.data;

    const binders = await db.binder.findMany({
      where: { userId, discipline },
      include: { tabDividers: true, pages: true },
    });

    const nodes: GraphNodeDto[] = [];
    const edges: GraphEdgeDto[] = [];
    const tabLabelById = new Map<string, string>();

    for (const binder of binders) {
      for (const tab of binder.tabDividers) tabLabelById.set(tab.id, tab.label);
      for (const page of binder.pages) {
        nodes.push({
          id: `page:${page.id}`,
          kind: "note",
          label: page.title,
          cluster: (page.tabDividerId && tabLabelById.get(page.tabDividerId)) || "Untabbed",
          mastery: page.masteryLevel,
        });
      }
    }

    const cards = await db.spacedRepetitionCard.findMany({ where: { userId, discipline } });
    for (const card of cards) {
      nodes.push({
        id: `card:${card.id}`,
        kind: "flashcard",
        label: card.front.length > 40 ? `${card.front.slice(0, 40)}…` : card.front,
        cluster: "Flashcards",
        mastery: card.masteryLevel,
      });
      if (card.sourcePageId) {
        edges.push({
          id: `edge:${card.id}`,
          source: `card:${card.id}`,
          target: `page:${card.sourcePageId}`,
          kind: "references",
        });
      }
    }

    const tasks = await db.task.findMany({ where: { userId, discipline } });
    for (const task of tasks) {
      nodes.push({
        id: `task:${task.id}`,
        kind: "task",
        label: task.title,
        cluster: "Tasks",
      });
    }

    return { nodes, edges };
  });
}
