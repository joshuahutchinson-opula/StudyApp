import { useEffect, useState } from "react";
import type { Discipline } from "@the-desk/shared";
import { useDueCards } from "../features/review/api";
import { useTasks } from "../features/planner/api";
import { useExamMode } from "../hooks/useExamMode";

const VISIBLE_MS = 7000;

/**
 * Tier 9's "ambient recap": a quiet, self-dismissing readout of where things
 * stand — due cards, open tasks, an upcoming deadline — shown while looking
 * at the idle-wide desk. Reuses hooks that already existed for other
 * features (useDueCards powers Recall, useTasks powers the planner panel,
 * useExamMode powers the drawer) rather than adding a new summary endpoint;
 * this is just a different, ambient presentation of the same real data.
 */
export function AmbientRecap({ userId, discipline }: { userId: string; discipline: Discipline }) {
  const { data: dueCards } = useDueCards(userId, discipline);
  const { data: tasks } = useTasks(userId, discipline);
  const examMode = useExamMode(userId);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setDismissed(true), VISIBLE_MS);
    return () => clearTimeout(timer);
  }, []);

  if (dismissed || dueCards === undefined || tasks === undefined) return null;

  const dueCount = dueCards.length;
  const pendingTasks = tasks.filter((t) => t.status !== "done").length;

  const parts: string[] = [];
  if (dueCount > 0) parts.push(`${dueCount} card${dueCount === 1 ? "" : "s"} due`);
  if (pendingTasks > 0) parts.push(`${pendingTasks} task${pendingTasks === 1 ? "" : "s"} open`);
  if (examMode.active && examMode.title) parts.push(`${examMode.title} coming up`);

  // Nothing to recap — don't show an empty "all clear" toast every session.
  if (parts.length === 0) return null;

  return (
    <div
      style={{
        position: "fixed",
        left: "50%",
        bottom: 24,
        transform: "translateX(-50%)",
        zIndex: 10,
        background: "rgba(15,32,39,.85)",
        color: "#f3efe6",
        borderRadius: 999,
        padding: "10px 20px",
        fontSize: 13,
        pointerEvents: "none",
      }}
    >
      Welcome back — {parts.join(" · ")}.
    </div>
  );
}
