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

export interface GraphData {
  nodes: GraphNodeDto[];
  edges: GraphEdgeDto[];
}
