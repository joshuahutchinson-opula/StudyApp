import { useState } from "react";
import { motion } from "motion/react";
import type { Discipline } from "@the-desk/shared";
import { useBinders } from "../features/binder/api";
import { BinderView } from "../features/binder/BinderView";
import { ReviewSession } from "../features/review/ReviewSession";

/**
 * What BINDER_APPROACH hands off to once the camera settles — the real
 * binder reader this session already built (table of contents, tab
 * dividers, real spring-physics page-turn, mastery tagging, margin
 * annotations), re-homed as a full-screen overlay instead of a routed page.
 * Review isn't its own camera state (the brief's object-behavior list
 * doesn't name it), so it's a sub-view inside this same overlay layer,
 * exactly mirroring how the old 2D dashboard nested it under Binder.
 */
export function BinderOverlay({
  userId,
  discipline,
  onClose,
}: {
  userId: string;
  discipline: Discipline;
  onClose: () => void;
}) {
  const [subView, setSubView] = useState<"binder" | "review">("binder");
  const { data: binders, isLoading } = useBinders(userId);
  const binder = binders?.find((b) => b.discipline === discipline);

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

      {isLoading ? (
        <div className="p-10 text-sm text-[var(--color-text-muted)]">Loading…</div>
      ) : !binder ? (
        <div className="mx-auto flex max-w-2xl flex-col justify-center px-6 py-20">
          <h1 className="text-3xl" style={{ fontFamily: "var(--font-display)" }}>
            No binder yet
          </h1>
          <p className="mt-4 text-sm text-[var(--color-text-muted)]">
            This discipline doesn't have a binder to open yet.
          </p>
        </div>
      ) : subView === "review" ? (
        <ReviewSession userId={userId} discipline={discipline} onExit={() => setSubView("binder")} />
      ) : (
        <BinderView
          userId={userId}
          binderId={binder.id}
          discipline={discipline}
          onOpenReview={() => setSubView("review")}
        />
      )}
    </motion.div>
  );
}
