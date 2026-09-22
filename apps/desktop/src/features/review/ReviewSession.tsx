import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import type { Discipline } from "@the-desk/shared";
import { useDueCards, useReviewCard } from "./api";
import type { ReviewGrade } from "./types";

const GRADE_BUTTONS: { grade: ReviewGrade; label: string; hint: string; color: string }[] = [
  { grade: "again", label: "Again", hint: "< 1 day", color: "#dc2626" },
  { grade: "hard", label: "Hard", hint: "soon", color: "#eab308" },
  { grade: "good", label: "Good", hint: "on track", color: "#3b82f6" },
  { grade: "easy", label: "Easy", hint: "long gap", color: "#22c55e" },
];

export function ReviewSession({
  userId,
  discipline,
  onExit,
}: {
  userId: string;
  discipline: Discipline;
  onExit: () => void;
}) {
  const { data: dueCards, isLoading } = useDueCards(userId, discipline);
  const reviewCard = useReviewCard(userId, discipline);

  const [revealed, setRevealed] = useState(false);
  // Cards graded this session are hidden locally rather than re-snapshotted
  // from the server, so the queue doesn't reshuffle under the student mid-session.
  const [reviewedIds, setReviewedIds] = useState<string[]>([]);

  if (isLoading) {
    return <div className="p-10 text-sm text-[var(--color-text-muted)]">Loading review queue…</div>;
  }

  const queue = (dueCards ?? []).filter((c) => !reviewedIds.includes(c.id));
  const current = queue[0];

  function grade(g: ReviewGrade) {
    if (!current) return;
    reviewCard.mutate({ cardId: current.id, grade: g });
    setReviewedIds((ids) => [...ids, current.id]);
    setRevealed(false);
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-xl flex-col justify-center px-6">
      <div className="mb-6 flex items-center justify-between">
        <button
          type="button"
          onClick={onExit}
          className="text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
        >
          ‹ Back to binder
        </button>
        <span className="text-sm text-[var(--color-text-muted)]">
          {queue.length} due · {reviewedIds.length} reviewed
        </span>
      </div>

      {!current ? (
        <div className="rounded-[var(--radius-base)] border border-[var(--color-border)] bg-[var(--color-surface)] p-10 text-center">
          <p className="text-xl" style={{ fontFamily: "var(--font-display)" }}>
            All caught up
          </p>
          <p className="mt-2 text-sm text-[var(--color-text-muted)]">
            {reviewedIds.length > 0
              ? `Reviewed ${reviewedIds.length} card${reviewedIds.length === 1 ? "" : "s"} this session.`
              : "No cards are due right now."}
          </p>
        </div>
      ) : (
        <AnimatePresence mode="wait">
          <motion.div
            key={current.id}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.18 }}
          >
            <button
              type="button"
              onClick={() => setRevealed((r) => !r)}
              className="min-h-[280px] w-full rounded-[var(--radius-base)] border border-[var(--color-border)] bg-[var(--color-surface)] p-10 text-left"
            >
              <p className="mb-4 text-xs uppercase tracking-wide text-[var(--color-text-muted)]">
                {revealed ? "Answer" : "Question — click to reveal"}
              </p>
              <p className="text-lg leading-relaxed" style={{ fontFamily: "var(--font-display)" }}>
                {revealed ? current.back : current.front}
              </p>
            </button>

            <div className="mt-6 grid grid-cols-4 gap-2">
              {GRADE_BUTTONS.map((btn) => (
                <button
                  key={btn.grade}
                  type="button"
                  disabled={!revealed}
                  onClick={() => grade(btn.grade)}
                  className="flex flex-col items-center gap-1 rounded-[var(--radius-base)] border py-3 text-sm transition-opacity disabled:cursor-not-allowed disabled:opacity-30"
                  style={{ borderColor: btn.color, color: btn.color }}
                >
                  <span className="font-medium">{btn.label}</span>
                  <span className="text-xs opacity-70">{btn.hint}</span>
                </button>
              ))}
            </div>
          </motion.div>
        </AnimatePresence>
      )}
    </div>
  );
}
