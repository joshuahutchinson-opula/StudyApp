import { useMutation, useQuery } from "@tanstack/react-query";
import { api } from "../../api/client";
import type { CaseAttemptResult, CaseDetail, CaseSummary } from "./types";

export function useCases() {
  return useQuery({
    queryKey: ["cases"],
    queryFn: () => api.get<CaseSummary[]>("/cases"),
  });
}

export function useCase(caseId: string | undefined) {
  return useQuery({
    queryKey: ["case", caseId],
    queryFn: () => api.get<CaseDetail>(`/cases/${caseId}`),
    enabled: Boolean(caseId),
  });
}

export function useSubmitAttempt(caseId: string, userId: string) {
  return useMutation({
    mutationFn: ({ differential, orderedTests }: { differential: string[]; orderedTests: string[] }) =>
      api.post<CaseAttemptResult>(`/cases/${caseId}/attempts`, { userId, differential, orderedTests }),
  });
}
