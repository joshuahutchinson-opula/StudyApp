import { Html } from "@react-three/drei";
import { useState } from "react";
import { useSyncedTasks } from "./useYDoc";

/**
 * The planner's task list rendered as a real DOM layer anchored IN the 3D
 * scene (drei's Html with `transform`, not screen-space) at the planner
 * sheet's own position — per the brief, "must feel like part of the
 * physical object, not a popup floating disconnected from it." Only
 * mounted while PLANNER_FOCUS is active (see DeskScene) — real interactive
 * DOM content sitting tiny/occluded in the idle-wide view would be both
 * unreadable and a stray hit-test target.
 *
 * Tier 3: task data is now CRDT-backed (see useYDoc.ts) instead of a plain
 * REST resource — offline-first via IndexedDB, merges across devices via
 * the backend sync route, and undoable via the global undo router.
 */
export function PlannerHtmlPanel({
  userId,
  position,
}: {
  userId: string;
  position: readonly [number, number, number];
}) {
  const { tasks, addTask, toggleTask } = useSyncedTasks(userId);
  const [draft, setDraft] = useState("");
  const visible = tasks.slice(0, 6);

  function submitDraft() {
    addTask(draft);
    setDraft("");
  }

  return (
    <Html position={position} transform distanceFactor={1.1} style={{ pointerEvents: "none" }}>
      <div
        onPointerDown={(e) => e.stopPropagation()}
        style={{
          width: 380,
          pointerEvents: "auto",
          background: "#f6f1e5",
          borderRadius: 6,
          padding: "18px 22px",
          boxShadow: "0 14px 34px rgba(0,0,0,.4)",
          fontFamily: "Inter, system-ui, sans-serif",
        }}
      >
        <p style={{ margin: "0 0 12px", fontSize: 11, letterSpacing: 1.4, color: "#2d7d8e", fontWeight: 600 }}>
          TODAY
        </p>
        {visible.length === 0 && <p style={{ fontSize: 13, color: "#6b6255", margin: 0 }}>Nothing on the docket.</p>}
        {visible.map((t) => (
          <label
            key={t.id}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              padding: "7px 0",
              fontSize: 15,
              color: "#1d2b33",
              cursor: "pointer",
              textDecoration: t.status === "done" ? "line-through" : "none",
              opacity: t.status === "done" ? 0.55 : 1,
            }}
          >
            <input type="checkbox" checked={t.status === "done"} onChange={() => toggleTask(t.id)} />
            {t.title}
          </label>
        ))}
        <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
          <input
            type="text"
            value={draft}
            placeholder="Add a task…"
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") submitDraft();
            }}
            style={{
              flex: 1,
              fontSize: 13,
              padding: "6px 8px",
              borderRadius: 4,
              border: "1px solid #d8cdb8",
              background: "#fffdf8",
              color: "#1d2b33",
            }}
          />
          <button
            type="button"
            onClick={submitDraft}
            style={{
              fontSize: 13,
              padding: "6px 12px",
              borderRadius: 4,
              border: "none",
              background: "#2d7d8e",
              color: "#fff",
              cursor: "pointer",
            }}
          >
            Add
          </button>
        </div>
      </div>
    </Html>
  );
}
