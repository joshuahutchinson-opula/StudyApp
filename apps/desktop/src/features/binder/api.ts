import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { Binder, MasteryLevel } from "@the-desk/shared";
import { api } from "../../api/client";
import type { BinderDetail } from "./types";

export function useBinders(userId: string) {
  return useQuery({
    queryKey: ["binders", userId],
    queryFn: () => api.get<Binder[]>(`/binders?userId=${userId}`),
  });
}

export function useBinder(binderId: string | undefined) {
  return useQuery({
    queryKey: ["binder", binderId],
    queryFn: () => api.get<BinderDetail>(`/binders/${binderId}`),
    enabled: Boolean(binderId),
  });
}

export function useUpdatePage(binderId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      pageId,
      ...patch
    }: {
      pageId: string;
      masteryLevel?: MasteryLevel;
      reviewed?: boolean;
    }) => api.patch(`/pages/${pageId}`, patch),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["binder", binderId] });
    },
  });
}

export function useCreatePage(binderId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { tabDividerId: string | null; title: string }) =>
      api.post(`/binders/${binderId}/pages`, input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["binder", binderId] });
    },
  });
}

export function useAddAnnotation(binderId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ pageId, anchorBlockId, body }: { pageId: string; anchorBlockId: string; body: string }) =>
      api.post(`/pages/${pageId}/annotations`, { anchorBlockId, body }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["binder", binderId] });
    },
  });
}
