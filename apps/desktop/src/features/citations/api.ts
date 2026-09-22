import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { Discipline } from "@the-desk/shared";
import { api } from "../../api/client";
import type { CitationWithFormatted } from "./types";

export function useCitations(userId: string, discipline: Discipline) {
  return useQuery({
    queryKey: ["citations", userId, discipline],
    queryFn: () => api.get<CitationWithFormatted[]>(`/citations?userId=${userId}&discipline=${discipline}`),
  });
}

export interface NewCitationInput {
  sourceType: "article" | "book" | "website" | "conference_paper" | "other";
  title: string;
  authors: string[];
  year?: number;
  publisher?: string;
  url?: string;
}

export function useCreateCitation(userId: string, discipline: Discipline) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: NewCitationInput) =>
      api.post<CitationWithFormatted>("/citations", { userId, discipline, ...input }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["citations", userId, discipline] });
    },
  });
}
