import { useQuery } from "@tanstack/react-query";
import type { Discipline, Textbook } from "@the-desk/shared";
import { api } from "../../api/client";

export function useTextbook(discipline: Discipline) {
  return useQuery({
    queryKey: ["textbook", discipline],
    queryFn: () => api.get<Textbook>(`/textbooks?discipline=${discipline}`),
    // A discipline with no seeded textbook yet 404s — that's a normal,
    // expected state (not every discipline has one), not a retry-worthy error.
    retry: false,
  });
}
