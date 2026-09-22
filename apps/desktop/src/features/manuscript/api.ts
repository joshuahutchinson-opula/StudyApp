import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../../api/client";
import type { PageRevision } from "./types";

export function usePageRevisions(pageId: string | undefined) {
  return useQuery({
    queryKey: ["page-revisions", pageId],
    queryFn: () => api.get<PageRevision[]>(`/pages/${pageId}/revisions`),
    enabled: Boolean(pageId),
  });
}

export function useRestoreRevision(pageId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (revisionId: string) => api.post(`/pages/${pageId}/revisions/${revisionId}/restore`, {}),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["page-revisions", pageId] });
      void queryClient.invalidateQueries({ queryKey: ["binder"] });
    },
  });
}
