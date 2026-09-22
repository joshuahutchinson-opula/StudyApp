import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { MICROCOPY, type Discipline } from "@the-desk/shared";
import { SpringButton } from "../../components/SpringButton";
import { useSpring } from "../../hooks/useSpring";
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
  const spring = useSpring();
  const copy = MICROCOPY[discipline];

  const [revealed, setRevealed] = useState(false);
  // Cards graded this session are hidden locally rather than re-snapshotted
  // from the server, so the queue doesn't reshuffle under the student mid-session.
  const [reviewedIds, setReviewedIds] = useState<string[]>([]);

  if (isLoading) {
    return <div className="p-[var(--space-7)] text-sm text-[var(--color-text-muted)]">{copy.loadingReview}</div>;
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
    <div className="mx-auto flex min-h-screen max-w-xl flex-col justify-center px-[var(--space-5)]">
      <div className="mb-[var(--space-5)] flex items-center justify-between">
        <SpringButton
          type="button"
          onClick={onExit}
          className="text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
        >
          ‹ Back to binder
        </SpringButton>
        <span className="text-sm text-[var(--color-text-muted)]">
          {queue.length} due · {reviewedIds.length} reviewed
        </span>
      </div>

      {!current ? (
        <div className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-[var(--space-7)] text-center">
          <p className="text-xl" style={{ fontFamily: "var(--font-display)" }}>
            {copy.allCaughtUp}
          </p>
          <p className="mt-[var(--space-2)] text-sm text-[var(--color-text-muted)]">
            {reviewedIds.length > 0
              ? `Reviewed ${reviewedIds.length} card${reviewedIds.length === 1 ? "" : "s"} this session.`
              : copy.noCardsDue}
          </p>
        </div>
      ) : (
        <AnimatePresence mode="wait">
          <motion.div
            key={current.id}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            transition={spring.base}
          >
            <div style={{ perspective: 1600 }}>
              <motion.button
                type="button"
                onClick={() => setRevealed((r) => !r)}
                animate={{ rotateY: revealed ? 180 : 0 }}
                transition={spring.base}
                className="relative block min-h-[280px] w-full text-left"
                style={{ transformStyle: "preserve-3d" }}
              >
                <div
                  className="absolute inset-0 rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-[var(--space-7)]"
                  style={{ backfaceVisibility: "hidden" }}
                >
                  <p className="mb-[var(--space-4)] text-xs uppercase tracking-wide text-[var(--color-text-muted)]">
                    Question — click to reveal
                  </p>
                  <p className="text-lg leading-relaxed" style={{ fontFamily: "var(--font-display)" }}>
                    {current.front}
                  </p>
                </div>
                <div
                  className="relative rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-[var(--space-7)]"
                  style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}
                >
                  <p className="mb-[var(--space-4)] text-xs uppercase tracking-wide text-[var(--color-text-muted)]">Answer</p>
                  <p className="text-lg leading-relaxed" style={{ fontFamily: "var(--font-display)" }}>
                    {current.back}
                  </p>
                </div>
              </motion.button>
            </div>

            <div className="mt-[var(--space-5)] grid grid-cols-4 gap-[var(--space-2)]">
              {GRADE_BUTTONS.map((btn) => (
                <motion.button
                  key={btn.grade}
                  type="button"
                  disabled={!revealed}
                  onClick={() => grade(btn.grade)}
                  whileTap={revealed ? { scale: 0.92 } : undefined}
                  animate={{ opacity: revealed ? 1 : 0.3 }}
                  transition={spring.fast}
                  className="flex flex-col items-center gap-[var(--space-1)] rounded-[var(--radius-sm)] border py-[var(--space-3)] text-sm disabled:cursor-not-allowed"
                  style={{ borderColor: btn.color, color: btn.color }}
                >
                  <span style={{ fontWeight: "var(--font-weight-body)" }}>{btn.label}</span>
                  <span className="text-xs opacity-70">{btn.hint}</span>
                </motion.button>
              ))}
            </div>
          </motion.div>
        </AnimatePresence>
      )}
    </div>
  );
}
