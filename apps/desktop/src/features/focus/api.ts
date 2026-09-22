import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../../api/client";

export type StudyMode = "pomodoro" | "deep_work" | "free";

interface StudySession {
  id: string;
  userId: string;
  mode: StudyMode;
  startedAt: string;
  endedAt: string | null;
  focusMinutes: number;
}

interface Summary {
  todayMinutes: number;
  todaySessionCount: number;
}

export function useStudySummary(userId: string) {
  return useQuery({
    queryKey: ["study-summary", userId],
    queryFn: () => api.get<Summary>(`/study-sessions/summary?userId=${userId}`),
  });
}

export function useStartSession(userId: string) {
  return useMutation({
    mutationFn: (mode: StudyMode) => api.post<StudySession>("/study-sessions", { userId, mode }),
  });
}

export function useEndSession(userId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ sessionId, focusMinutes }: { sessionId: string; focusMinutes: number }) =>
      api.patch<StudySession>(`/study-sessions/${sessionId}/end`, { focusMinutes }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["study-summary", userId] });
    },
  });
}
