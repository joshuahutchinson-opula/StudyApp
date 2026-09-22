import { useMemo } from "react";
import { useDeadlines } from "../features/planner/api";

const THRESHOLD_MS = 3 * 24 * 60 * 60 * 1000; // "exam mode" starts 3 days out

export interface ExamModeState {
  active: boolean;
  title: string | null;
  dueAt: Date | null;
}

/** Whether any deadline is close enough to ambiently surface, and which one. */
export function useExamMode(userId: string): ExamModeState {
  const { data: deadlines } = useDeadlines(userId);

  return useMemo(() => {
    const now = Date.now();
    const nearest = (deadlines ?? [])
      .map((d) => ({ title: d.title, dueAt: new Date(d.dueAt as unknown as string) }))
      .filter((d) => {
        const msUntil = d.dueAt.getTime() - now;
        return msUntil > 0 && msUntil <= THRESHOLD_MS;
      })
      .sort((a, b) => a.dueAt.getTime() - b.dueAt.getTime())[0];

    return nearest
      ? { active: true, title: nearest.title, dueAt: nearest.dueAt }
      : { active: false, title: null, dueAt: null };
  }, [deadlines]);
}
