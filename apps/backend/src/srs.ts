import type { MasteryLevel } from "@the-desk/shared";

export type ReviewGrade = "again" | "hard" | "good" | "easy";

export interface SrsState {
  intervalDays: number;
  easeFactor: number;
  reviewCount: number;
}

export interface SrsResult extends SrsState {
  dueAt: Date;
  masteryLevel: MasteryLevel;
}

const MIN_EASE = 1.3;

// Simplified SM-2 (Anki-style four-button grading) rather than the original
// 0-5 quality scale — coarser, but matches what students actually click.
export function scheduleReview(current: SrsState, grade: ReviewGrade): SrsResult {
  let { intervalDays, easeFactor } = current;
  const reviewCount = current.reviewCount + 1;

  switch (grade) {
    case "again":
      intervalDays = 1;
      easeFactor = Math.max(MIN_EASE, easeFactor - 0.2);
      break;
    case "hard":
      intervalDays = Math.max(1, intervalDays * 1.2);
      easeFactor = Math.max(MIN_EASE, easeFactor - 0.15);
      break;
    case "good":
      intervalDays = reviewCount <= 1 ? 1 : reviewCount === 2 ? 6 : intervalDays * easeFactor;
      break;
    case "easy":
      intervalDays = Math.max(1, intervalDays || 1) * easeFactor * 1.3;
      easeFactor = easeFactor + 0.15;
      break;
  }

  const dueAt = new Date(Date.now() + intervalDays * 24 * 60 * 60 * 1000);

  const masteryLevel: MasteryLevel =
    grade === "again"
      ? "unfamiliar"
      : intervalDays >= 21
        ? "mastered"
        : intervalDays >= 6
          ? "familiar"
          : "learning";

  return { intervalDays, easeFactor, reviewCount, dueAt, masteryLevel };
}
