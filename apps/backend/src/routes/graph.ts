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
  kind: "references" | "manual";
}

// Nodes are derived on read from existing tables rather than a separately-
// synced table — simpler, and can't drift out of sync with the binder/
// planner data they're a view over. Edges are a mix: "references" edges are
// also derived (e.g. a flashcard's sourcePageId); "manual" edges are the one
// thing that genuinely needs to persist independently, since a user drawing
// a link between two notes isn't derivable from anything else — see the
// GraphEdge model.
export async function graphRoutes(app: FastifyInstance) {
  app.get("/graph", async (req, reply) => {
    const query = z.object({ discipline: DisciplineSchema }).safeParse(req.query);
    if (!query.success) return reply.code(400).send(query.error.flatten());
    const userId = req.userId!;
    const { discipline } = query.data;

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

    const nodeIds = new Set(nodes.map((n) => n.id));
    const manualEdges = await db.graphEdge.findMany({ where: { userId, discipline } });
    for (const edge of manualEdges) {
      // Drop silently rather than error — content on either end may have
      // been deleted since the link was drawn, and a stale link shouldn't
      // break the whole graph view.
      if (!nodeIds.has(edge.sourceRef) || !nodeIds.has(edge.targetRef)) continue;
      edges.push({ id: edge.id, source: edge.sourceRef, target: edge.targetRef, kind: "manual" });
    }

    return { nodes, edges };
  });

  const CreateEdgeBody = z.object({
    discipline: DisciplineSchema,
    sourceRef: z.string().min(1),
    targetRef: z.string().min(1),
  });

  app.post("/graph/edges", async (req, reply) => {
    const body = CreateEdgeBody.safeParse(req.body);
    if (!body.success) return reply.code(400).send(body.error.flatten());

    return db.graphEdge.create({
      data: {
        userId: req.userId!,
        discipline: body.data.discipline,
        sourceRef: body.data.sourceRef,
        targetRef: body.data.targetRef,
        kind: "manual",
      },
    });
  });

  app.delete("/graph/edges/:id", async (req, reply) => {
    const params = z.object({ id: z.string().uuid() }).safeParse(req.params);
    if (!params.success) return reply.code(400).send(params.error.flatten());

    const edge = await db.graphEdge.findUnique({ where: { id: params.data.id } });
    if (!edge || edge.userId !== req.userId) return reply.code(404).send({ error: "Edge not found" });

    await db.graphEdge.delete({ where: { id: params.data.id } });
    return { ok: true };
  });
}
