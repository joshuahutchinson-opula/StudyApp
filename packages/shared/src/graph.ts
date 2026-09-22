import { z } from "zod";

export const GraphNodeKindSchema = z.enum(["note", "task", "source", "flashcard"]);
export type GraphNodeKind = z.infer<typeof GraphNodeKindSchema>;

/** A graph node is a thin pointer to an underlying spine entity (page, task, citation, card). */
export const GraphNodeSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  kind: GraphNodeKindSchema,
  refId: z.string().uuid(),
  label: z.string().min(1),
});
export type GraphNode = z.infer<typeof GraphNodeSchema>;

export const GraphEdgeKindSchema = z.enum(["cites", "references", "tags", "ai_suggested"]);
export type GraphEdgeKind = z.infer<typeof GraphEdgeKindSchema>;

export const GraphEdgeSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  sourceNodeId: z.string().uuid(),
  targetNodeId: z.string().uuid(),
  kind: GraphEdgeKindSchema,
  createdAt: z.coerce.date(),
});
export type GraphEdge = z.infer<typeof GraphEdgeSchema>;
