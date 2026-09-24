import { motion } from "motion/react";
import type { Discipline } from "@the-desk/shared";
import { useBinders } from "../features/binder/api";
import { GraphView } from "../features/graph/GraphView";
import { useCameraStore } from "./useCameraStore";

/**
 * Tier 10's knowledge graph — flagged in the brief as having no design
 * reference yet, so this is placeholder placement (see cameraStates.ts),
 * but the graph itself is not new work: GraphView was already fully built
 * (Cytoscape, cluster layout, drag-to-link edges, zoom-dependent labels)
 * for the old 2D dashboard and was orphaned by the pivot, same as
 * ClinicalCaseSim/CritiqueRoom/ManuscriptTimeline were before Tier 8.
 *
 * "Open this note" doesn't just close the graph — it hands off straight
 * into BINDER_APPROACH with that page pre-selected (goToBinder's new
 * optional second argument), so clicking a note in the graph actually
 * carries you to it, camera and all, instead of dumping you back at the
 * desk to go find the binder yourself.
 */
export function GraphOverlay({
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
  const goToBinder = useCameraStore((s) => s.goToBinder);

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

      {binder && (
        <GraphView
          userId={userId}
          discipline={discipline}
          onOpenNote={(pageId) => goToBinder(binder.id, pageId)}
        />
      )}
    </motion.div>
  );
}
