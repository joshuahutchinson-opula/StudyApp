import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { Discipline } from "@the-desk/shared";
import { api } from "../../api/client";
import type { GraphData } from "./types";

export function useGraph(userId: string, discipline: Discipline) {
  return useQuery({
    queryKey: ["graph", userId, discipline],
    queryFn: () => api.get<GraphData>(`/graph?userId=${userId}&discipline=${discipline}`),
  });
}

export function useCreateGraphEdge(userId: string, discipline: Discipline) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ sourceRef, targetRef }: { sourceRef: string; targetRef: string }) =>
      api.post("/graph/edges", { userId, discipline, sourceRef, targetRef }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["graph", userId, discipline] });
    },
  });
}
