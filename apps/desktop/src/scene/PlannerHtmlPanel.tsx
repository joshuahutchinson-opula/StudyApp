import { Html } from "@react-three/drei";
import { useMemo } from "react";
import type { Discipline } from "@the-desk/shared";
import { useTasks, useUpdateTaskStatus } from "../features/planner/api";

/**
 * The planner's task list rendered as a real DOM layer anchored IN the 3D
 * scene (drei's Html with `transform`, not screen-space) at the planner
 * sheet's own position — per the brief, "must feel like part of the
 * physical object, not a popup floating disconnected from it." Only
 * mounted while PLANNER_FOCUS is active (see DeskScene) — real interactive
 * DOM content sitting tiny/occluded in the idle-wide view would be both
 * unreadable and a stray hit-test target.
 */
export function PlannerHtmlPanel({
  userId,
  discipline,
  position,
}: {
  userId: string;
  discipline: Discipline;
  position: readonly [number, number, number];
}) {
  const { data: tasks } = useTasks(userId, discipline);
  const updateStatus = useUpdateTaskStatus(userId, discipline);
  const visible = useMemo(() => (tasks ?? []).slice(0, 6), [tasks]);

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
            <input
              type="checkbox"
              checked={t.status === "done"}
              onChange={() =>
                updateStatus.mutate({ taskId: t.id, status: t.status === "done" ? "todo" : "done" })
              }
            />
            {t.title}
          </label>
        ))}
      </div>
    </Html>
  );
}
