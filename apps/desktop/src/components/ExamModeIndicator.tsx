import { motion } from "motion/react";
import { useExamMode } from "../hooks/useExamMode";

function relativeDay(dueAt: Date): string {
  const days = Math.round((dueAt.getTime() - Date.now()) / (24 * 60 * 60 * 1000));
  if (days <= 0) return "today";
  if (days === 1) return "tomorrow";
  return `in ${days}d`;
}

// Ambient exam-mode surfacing: ANY deadline inside a 3-day window shows a
// small, persistent, non-blocking signal in the nav — always in view, never
// a modal or toast that interrupts what the student is doing. A slow
// opacity breathing loop (not a spring — this is a continuous ambient cue,
// not a state-change transition) keeps it noticeable without being urgent
// or alarm-colored; it borrows the discipline's own accent color rather
// than a universal red, so it reads as "this discipline's own signal," not
// a system warning.
export function ExamModeIndicator({ userId }: { userId: string }) {
  const { active, title, dueAt } = useExamMode(userId);

  if (!active || !title || !dueAt) return null;

  return (
    <motion.div
      className="flex items-center gap-[var(--space-1)] rounded-full px-[var(--space-2)] py-[var(--space-1)] text-xs"
      style={{ border: "1px solid var(--color-accent)", color: "var(--color-accent)" }}
      title={`${title} — due ${relativeDay(dueAt)}`}
    >
      <motion.span
        aria-hidden
        className="h-1.5 w-1.5 shrink-0 rounded-full"
        style={{ background: "var(--color-accent)" }}
        animate={{ opacity: [1, 0.35, 1] }}
        transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
      />
      <span className="max-w-[16ch] truncate">{title}</span>
      <span style={{ opacity: 0.7 }}>{relativeDay(dueAt)}</span>
    </motion.div>
  );
}
