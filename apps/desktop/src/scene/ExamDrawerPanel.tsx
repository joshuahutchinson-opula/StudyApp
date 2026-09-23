import { Html } from "@react-three/drei";
import { useExamMode } from "../hooks/useExamMode";
import { useCameraStore } from "./useCameraStore";

function daysUntil(dueAt: Date): number {
  return Math.max(0, Math.ceil((dueAt.getTime() - Date.now()) / (24 * 60 * 60 * 1000)));
}

/**
 * Tier 4's "exam-mode drawer" — the desk's drawer, opened in place (a
 * DRAWER_FOCUS camera move, no full-screen overlay, matching how a drawer is
 * actually used: a glance, not a sit-down). Surfaces the ambient exam-mode
 * state useExamMode() already computed (built earlier, but until now had no
 * live mount point anywhere in the 3D scene) and gives it a direct shortcut
 * into Recall.
 */
export function ExamDrawerPanel({
  userId,
  position,
}: {
  userId: string;
  position: readonly [number, number, number];
}) {
  const examMode = useExamMode(userId);
  const goToRecall = useCameraStore((s) => s.goToRecall);

  return (
    <Html position={position} transform distanceFactor={1.1} style={{ pointerEvents: "none" }}>
      <div
        onPointerDown={(e) => e.stopPropagation()}
        style={{
          width: 340,
          pointerEvents: "auto",
          background: "#f6f1e5",
          borderRadius: 6,
          padding: "18px 22px",
          boxShadow: "0 14px 34px rgba(0,0,0,.4)",
          fontFamily: "Inter, system-ui, sans-serif",
        }}
      >
        <p style={{ margin: "0 0 12px", fontSize: 11, letterSpacing: 1.4, color: "#2d7d8e", fontWeight: 600 }}>
          UPCOMING
        </p>
        {examMode.active && examMode.title && examMode.dueAt ? (
          <>
            <p style={{ margin: "0 0 4px", fontSize: 16, color: "#1d2b33" }}>{examMode.title}</p>
            <p style={{ margin: "0 0 14px", fontSize: 13, color: "#6b6255" }}>
              {daysUntil(examMode.dueAt) === 0 ? "Due today" : `In ${daysUntil(examMode.dueAt)} day${daysUntil(examMode.dueAt) === 1 ? "" : "s"}`}
            </p>
            <button
              type="button"
              onClick={goToRecall}
              style={{
                fontSize: 13,
                padding: "8px 14px",
                borderRadius: 4,
                border: "none",
                background: "#2d7d8e",
                color: "#fff",
                cursor: "pointer",
              }}
            >
              Start reviewing →
            </button>
          </>
        ) : (
          <p style={{ fontSize: 13, color: "#6b6255", margin: 0 }}>Nothing within the next 3 days.</p>
        )}
      </div>
    </Html>
  );
}
