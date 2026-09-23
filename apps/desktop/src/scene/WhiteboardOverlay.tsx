import { Tldraw } from "tldraw";
import "tldraw/tldraw.css";
import { motion } from "motion/react";

/**
 * What WHITEBOARD_APPROACH hands off to. `persistenceKey` gives tldraw's own
 * local (IndexedDB) persistence for free — the "basic persistence (local,
 * before full CRDT sync)" the brief asks for at this tier. Real cross-device
 * sync (Yjs, per the brief's own recommendation to evaluate it first for its
 * tldraw integration) and multiplayer presence are Tier 3/6 work, not here —
 * this only needs to survive a reload on the same device today.
 */
export function WhiteboardOverlay({ userId, onClose }: { userId: string; onClose: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.35 }}
      style={{ position: "fixed", inset: 0, zIndex: 20 }}
    >
      {/* Top-center, not a corner: tldraw's own UI occupies all four
          corners (page menu top-left, style panel top-right, zoom
          bottom-left, main toolbar bottom-center, branding bottom-right) —
          confirmed while testing this, not a guess. Top-center is the one
          gap in its default layout. */}
      <button
        type="button"
        onClick={onClose}
        className="fixed rounded-full px-3 py-1.5 text-xs"
        style={{
          left: "50%",
          top: 16,
          transform: "translateX(-50%)",
          zIndex: 21,
          background: "rgba(15,32,39,.85)",
          color: "#f3efe6",
        }}
      >
        ‹ Back to desk
      </button>
      <Tldraw persistenceKey={`the-desk-whiteboard-${userId}`} />
    </motion.div>
  );
}
