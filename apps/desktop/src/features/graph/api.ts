import { useQuery } from "@tanstack/react-query";
import type { Discipline } from "@the-desk/shared";
import { api } from "../../api/client";
import type { GraphData } from "./types";

export function useGraph(userId: string, discipline: Discipline) {
  return useQuery({
    queryKey: ["graph", userId, discipline],
    queryFn: () => api.get<GraphData>(`/graph?userId=${userId}&discipline=${discipline}`),
  });
}
