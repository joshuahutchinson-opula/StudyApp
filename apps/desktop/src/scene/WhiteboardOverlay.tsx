import { useState } from "react";
import { Tldraw } from "tldraw";
import "tldraw/tldraw.css";
import { motion } from "motion/react";
import { useSyncedWhiteboardStore } from "./useSyncedWhiteboardStore";

const ROOM_CODE_STORAGE_KEY = "the-desk-whiteboard-room";

function loadSavedRoomCode(userId: string): string | null {
  try {
    return localStorage.getItem(`${ROOM_CODE_STORAGE_KEY}-${userId}`);
  } catch {
    return null;
  }
}

function saveRoomCode(userId: string, code: string | null) {
  try {
    if (code) localStorage.setItem(`${ROOM_CODE_STORAGE_KEY}-${userId}`, code);
    else localStorage.removeItem(`${ROOM_CODE_STORAGE_KEY}-${userId}`);
  } catch {
    // Best-effort — a failed save just means the room choice doesn't
    // survive a reload, not a broken whiteboard.
  }
}

/**
 * Tier 6's "shared desks + multiplayer whiteboard": anyone who enters the
 * same room code gets the same docKey, and useSyncedWhiteboardStore (built
 * on Tier 3's Y.Doc + IndexedDB + PUT /sync/:docKey merge pattern) converges
 * their edits — see that file for how. Solo use (no room code) is the
 * default and behaves exactly like before this tier: a private board keyed
 * to just this user.
 */
export function WhiteboardOverlay({ userId, onClose }: { userId: string; onClose: () => void }) {
  const [roomCode, setRoomCode] = useState<string | null>(() => loadSavedRoomCode(userId));
  const [draftCode, setDraftCode] = useState("");
  const [editingRoom, setEditingRoom] = useState(false);

  const docKey = roomCode ? `whiteboard-shared-${roomCode}` : `whiteboard-solo-${userId}`;
  const store = useSyncedWhiteboardStore(docKey);

  function joinRoom() {
    const trimmed = draftCode.trim();
    if (!trimmed) return;
    setRoomCode(trimmed);
    saveRoomCode(userId, trimmed);
    setEditingRoom(false);
    setDraftCode("");
  }

  function leaveRoom() {
    setRoomCode(null);
    saveRoomCode(userId, null);
    setEditingRoom(false);
  }

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
      <div
        style={{
          position: "fixed",
          left: "50%",
          top: 16,
          transform: "translateX(-50%)",
          zIndex: 21,
          display: "flex",
          gap: 8,
          alignItems: "center",
        }}
      >
        <button
          type="button"
          onClick={onClose}
          className="rounded-full px-3 py-1.5 text-xs"
          style={{ background: "rgba(15,32,39,.85)", color: "#f3efe6" }}
        >
          ‹ Back to desk
        </button>

        {editingRoom ? (
          <>
            <input
              autoFocus
              value={draftCode}
              onChange={(e) => setDraftCode(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") joinRoom();
                if (e.key === "Escape") setEditingRoom(false);
              }}
              placeholder="Room code…"
              style={{
                fontSize: 12,
                padding: "6px 10px",
                borderRadius: 999,
                border: "1px solid rgba(255,255,255,.3)",
                background: "rgba(15,32,39,.85)",
                color: "#f3efe6",
              }}
            />
            <button
              type="button"
              onClick={joinRoom}
              className="rounded-full px-3 py-1.5 text-xs"
              style={{ background: "#2d7d8e", color: "#fff" }}
            >
              Join
            </button>
          </>
        ) : roomCode ? (
          <>
            <span
              className="rounded-full px-3 py-1.5 text-xs"
              style={{ background: "rgba(45,125,142,.85)", color: "#fff" }}
            >
              Shared · {roomCode}
            </span>
            <button
              type="button"
              onClick={leaveRoom}
              className="rounded-full px-3 py-1.5 text-xs"
              style={{ background: "rgba(15,32,39,.85)", color: "#f3efe6" }}
            >
              Leave
            </button>
          </>
        ) : (
          <button
            type="button"
            onClick={() => setEditingRoom(true)}
            className="rounded-full px-3 py-1.5 text-xs"
            style={{ background: "rgba(15,32,39,.85)", color: "#f3efe6" }}
          >
            Share…
          </button>
        )}
      </div>
      <Tldraw store={store} />
    </motion.div>
  );
}
