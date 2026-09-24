import { motion } from "motion/react";
import type { Discipline } from "@the-desk/shared";
import { useBinders } from "../features/binder/api";
import { ClinicalCaseSim } from "../features/clinical/ClinicalCaseSim";
import { CritiqueRoom } from "../features/critique/CritiqueRoom";
import { ManuscriptTimeline } from "../features/manuscript/ManuscriptTimeline";

/**
 * Tier 8's per-discipline signature feature. All three components here
 * (ClinicalCaseSim, CritiqueRoom, ManuscriptTimeline) were already fully
 * built and working — they were just orphaned, exactly like CitationLibrary
 * was before Tier 4 wired it in. This gives each one its first reachable
 * mount point, one desk object whose meaning depends on the active
 * discipline.
 *
 * Software and Engineering have no case here on purpose: their signature
 * features (RunnableCode, FormulaBlock) are inline content-block renderers
 * already live on every relevant binder page — see PageContent.tsx's
 * "code"/"formula" cases — not a separate room needing a second entry
 * point. DeskScene only mounts the desk object for the three disciplines
 * this component actually handles.
 */
export function SignatureFeatureOverlay({
  userId,
  discipline,
  onClose,
}: {
  userId: string;
  discipline: Discipline;
  onClose: () => void;
}) {
  const { data: binders } = useBinders(userId);
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

      {discipline === "medicine" && <ClinicalCaseSim userId={userId} />}
      {discipline === "arts" &&
        (binder ? (
          <CritiqueRoom binderId={binder.id} />
        ) : (
          <div className="p-10 text-sm text-[var(--color-text-muted)]">Loading…</div>
        ))}
      {discipline === "writing" &&
        (binder ? (
          <ManuscriptTimeline binderId={binder.id} />
        ) : (
          <div className="p-10 text-sm text-[var(--color-text-muted)]">Loading…</div>
        ))}
    </motion.div>
  );
}
