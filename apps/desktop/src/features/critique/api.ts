import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../../api/client";
import type { CritiqueThread } from "./types";

export function useCritiqueThreads(pageId: string | undefined) {
  return useQuery({
    queryKey: ["critique-threads", pageId],
    queryFn: () => api.get<CritiqueThread[]>(`/pages/${pageId}/critique-threads`),
    enabled: Boolean(pageId),
  });
}

export function useCreateThread(pageId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { x: number; y: number; authorName: string; body: string }) =>
      api.post(`/pages/${pageId}/critique-threads`, input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["critique-threads", pageId] });
    },
  });
}

export function useAddComment(pageId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ threadId, authorName, body }: { threadId: string; authorName: string; body: string }) =>
      api.post(`/critique-threads/${threadId}/comments`, { authorName, body }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["critique-threads", pageId] });
    },
  });
}

export function useResolveThread(pageId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ threadId, resolved }: { threadId: string; resolved: boolean }) =>
      api.patch(`/critique-threads/${threadId}`, { resolved }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["critique-threads", pageId] });
    },
  });
}
