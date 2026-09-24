import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { Discipline } from "@the-desk/shared";
import { api } from "../../api/client";
import type { ReviewGrade, SpacedRepetitionCard } from "./types";

/** Tier 9's unlocks system: a real, computed-from-history stat (total
 * reviews across every card, every discipline) rather than a separate
 * achievements table — see backend routes/cards.ts's GET /cards/stats. */
export function useCardStats(userId: string) {
  return useQuery({
    queryKey: ["cards", "stats", userId],
    queryFn: () => api.get<{ totalReviews: number }>("/cards/stats"),
  });
}

export function useDueCards(userId: string, discipline: Discipline) {
  return useQuery({
    queryKey: ["cards", "due", userId, discipline],
    queryFn: () => api.get<SpacedRepetitionCard[]>(`/cards/due?userId=${userId}&discipline=${discipline}`),
  });
}

export function useReviewCard(userId: string, discipline: Discipline) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ cardId, grade }: { cardId: string; grade: ReviewGrade }) =>
      api.post<SpacedRepetitionCard>(`/cards/${cardId}/review`, { grade }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["cards", "due", userId, discipline] });
      // A review can change a page's mastery level too (see backend), so the
      // binder view needs to refetch — invalidate broadly rather than track
      // which binder the reviewed card's source page belongs to.
      void queryClient.invalidateQueries({ queryKey: ["binder"] });
    },
  });
}
