import { useQuery } from "@tanstack/react-query";
import type { Discipline } from "@the-desk/shared";
import { api } from "../../api/client";
import type { SearchResult } from "./types";

export function useSearch(userId: string, discipline: Discipline, q: string) {
  return useQuery({
    queryKey: ["search", userId, discipline, q],
    queryFn: () => api.get<SearchResult[]>(`/search?userId=${userId}&discipline=${discipline}&q=${encodeURIComponent(q)}`),
    enabled: q.trim().length > 0,
  });
}
