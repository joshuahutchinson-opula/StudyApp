import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../../api/client";
import type { ReviewGrade, SpacedRepetitionCard } from "./types";

export function useDueCards(userId: string) {
  return useQuery({
    queryKey: ["cards", "due", userId],
    queryFn: () => api.get<SpacedRepetitionCard[]>(`/cards/due?userId=${userId}`),
  });
}

export function useReviewCard(userId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ cardId, grade }: { cardId: string; grade: ReviewGrade }) =>
      api.post<SpacedRepetitionCard>(`/cards/${cardId}/review`, { grade }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["cards", "due", userId] });
      // A review can change a page's mastery level too (see backend), so the
      // binder view needs to refetch — invalidate broadly rather than track
      // which binder the reviewed card's source page belongs to.
      void queryClient.invalidateQueries({ queryKey: ["binder"] });
    },
  });
}
