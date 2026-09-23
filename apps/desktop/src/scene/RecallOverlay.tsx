import { motion } from "motion/react";
import type { Discipline } from "@the-desk/shared";
import { ReviewSession } from "../features/review/ReviewSession";

/**
 * Tier 4's Recall desk object: a direct entry point into spaced-repetition
 * review, without detouring through the binder first (ReviewSession itself
 * was already built and reachable via BinderOverlay's "Review · N due"
 * button — this just gives it its own physical object on the desk, per the
 * brief's "every feature is reached by clicking a physical object").
 */
export function RecallOverlay({
  userId,
  discipline,
  onClose,
}: {
  userId: string;
  discipline: Discipline;
  onClose: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.35 }}
      style={{ position: "fixed", inset: 0, background: "var(--color-bg)", zIndex: 20, overflow: "auto" }}
    >
      <button
        type="button"
        onClick={onClose}
        className="fixed rounded-full px-3 py-1.5 text-xs"
        style={{ left: 16, bottom: 16, zIndex: 21, background: "rgba(15,32,39,.7)", color: "#f3efe6" }}
      >
        ‹ Back to desk
      </button>
      <ReviewSession userId={userId} discipline={discipline} onExit={onClose} />
    </motion.div>
  );
}
