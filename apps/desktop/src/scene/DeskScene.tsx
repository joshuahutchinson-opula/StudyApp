import { Canvas } from "@react-three/fiber";
import { AnimatePresence } from "motion/react";
import { Suspense, lazy, useEffect } from "react";
import type { Discipline } from "@the-desk/shared";
import { useBinders } from "../features/binder/api";
import { CameraRig } from "./CameraRig";
import { OBJECT_LAYOUT } from "./cameraStates";
import { useCameraStore } from "./useCameraStore";
import { TimerObject } from "./TimerObject";
import { PlannerHtmlPanel } from "./PlannerHtmlPanel";
import { ExamDrawerPanel } from "./ExamDrawerPanel";
import { globalUndo, registerUndoSource } from "./undoRouter";
import { useExamMode } from "../hooks/useExamMode";
import { DISCIPLINE_DESK_THEME, type DeskTheme } from "./disciplineTheme";

// All full-screen overlays are code-split — neither ships in the initial
// bundle, same pattern the old dashboard used for Cytoscape (GraphView). The
// camera has already settled by the time any of these starts fetching, so
// the brief lag reads as "the reader is opening," not as a stall.
const BinderOverlay = lazy(() => import("./BinderOverlay").then((m) => ({ default: m.BinderOverlay })));
const WhiteboardOverlay = lazy(() => import("./WhiteboardOverlay").then((m) => ({ default: m.WhiteboardOverlay })));
const RecallOverlay = lazy(() => import("./RecallOverlay").then((m) => ({ default: m.RecallOverlay })));
const TextbookOverlay = lazy(() => import("./TextbookOverlay").then((m) => ({ default: m.TextbookOverlay })));

// Tier 1 established the camera FSM against placeholder geometry. Tier 2
// (this file) swaps the overlay placeholders for the real binder reader and
// tldraw whiteboard, gives the planner a real functional task list anchored
// in 3D, and gives the timer its real casing + canvas-texture digit face.
// Binder/whiteboard/planner geometry itself is still primitive boxes —
// real modeled geometry and PBR materials are their own pass, not bundled
// into this one.

function InteractiveBox({
  position,
  size,
  color,
  onSelect,
  label,
}: {
  position: readonly [number, number, number];
  size: readonly [number, number, number];
  color: string;
  onSelect: () => void;
  label: string;
}) {
  return (
    <mesh
      position={position}
      castShadow
      receiveShadow
      onClick={(e) => {
        e.stopPropagation();
        onSelect();
      }}
      onPointerOver={(e) => {
        e.stopPropagation();
        document.body.style.cursor = "pointer";
      }}
      onPointerOut={() => {
        document.body.style.cursor = "auto";
      }}
    >
      <boxGeometry args={size} />
      <meshStandardMaterial color={color} roughness={0.7} metalness={0.05} />
      <group name={label} />
    </mesh>
  );
}

// The exam-mode drawer — built into the desk itself rather than a free
// object, so it gets its own component instead of reusing InteractiveBox:
// it needs an emissive tint that responds to useExamMode()'s active state
// (a faint warm glow when something's due soon), which no other desk object
// does.
function DrawerFront({
  position,
  active,
  theme,
  onSelect,
}: {
  position: readonly [number, number, number];
  active: boolean;
  theme: DeskTheme;
  onSelect: () => void;
}) {
  return (
    <mesh
      position={position}
      castShadow
      receiveShadow
      onClick={(e) => {
        e.stopPropagation();
        onSelect();
      }}
      onPointerOver={(e) => {
        e.stopPropagation();
        document.body.style.cursor = "pointer";
      }}
      onPointerOut={() => {
        document.body.style.cursor = "auto";
      }}
    >
      <boxGeometry args={[1.0, 0.28, 0.06]} />
      <meshStandardMaterial
        color={theme.drawerBase}
        emissive={active ? theme.drawerGlow : "#000000"}
        emissiveIntensity={active ? 0.35 : 0}
        roughness={0.7}
        metalness={0.05}
      />
    </mesh>
  );
}

function DeskAndWall({ theme }: { theme: DeskTheme }) {
  return (
    <>
      {/* Desk surface + wall — Tier 5's material/prop swap: color driven by
          the active discipline's theme instead of one fixed hardcoded hex. */}
      <mesh position={[OBJECT_LAYOUT.desk.x, -0.02, OBJECT_LAYOUT.desk.z]} receiveShadow>
        <boxGeometry args={[4.2, 0.04, 2.2]} />
        <meshStandardMaterial color={theme.deskWood} roughness={0.85} metalness={0.02} />
      </mesh>
      {/* Wall */}
      <mesh position={[OBJECT_LAYOUT.wall.x, OBJECT_LAYOUT.wall.y, OBJECT_LAYOUT.wall.z]} receiveShadow>
        <boxGeometry args={[6, 3.2, 0.05]} />
        <meshStandardMaterial color={theme.wall} roughness={0.95} metalness={0} />
      </mesh>
      {/* Floor, mostly to catch shadows and ground the scene visually */}
      <mesh position={[0, -0.6, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[20, 20]} />
        <meshStandardMaterial color="#26221c" roughness={1} metalness={0} />
      </mesh>
    </>
  );
}

function LampMarker() {
  // Stands in for the real lamp model. The warm directional light below is
  // positioned to match — light source and geometry agree now, per the
  // brief's "every object's shadows must agree with it," rather than
  // retrofitting that once the real lamp model exists.
  return (
    <mesh position={[OBJECT_LAYOUT.lamp.x, OBJECT_LAYOUT.lamp.y, OBJECT_LAYOUT.lamp.z]} castShadow>
      <sphereGeometry args={[0.08, 16, 16]} />
      <meshStandardMaterial color="#ffdca0" emissive="#ffb347" emissiveIntensity={1.4} roughness={0.4} />
    </mesh>
  );
}

function SceneObjects({
  userId,
  binderId,
  theme,
}: {
  userId: string;
  binderId: string;
  theme: DeskTheme;
}) {
  const goToBinder = useCameraStore((s) => s.goToBinder);
  const goToPlanner = useCameraStore((s) => s.goToPlanner);
  const goToWhiteboard = useCameraStore((s) => s.goToWhiteboard);
  const goToRecall = useCameraStore((s) => s.goToRecall);
  const goToTextbook = useCameraStore((s) => s.goToTextbook);
  const goToDrawer = useCameraStore((s) => s.goToDrawer);
  const state = useCameraStore((s) => s.state);
  const examMode = useExamMode(userId);

  return (
    <>
      <DeskAndWall theme={theme} />
      <LampMarker />

      <InteractiveBox
        position={[OBJECT_LAYOUT.binder.x, OBJECT_LAYOUT.binder.y, OBJECT_LAYOUT.binder.z]}
        size={[0.32, 0.42, 0.06]}
        color={theme.binder}
        label="binder"
        onSelect={() => goToBinder(binderId)}
      />

      <InteractiveBox
        position={[OBJECT_LAYOUT.planner.x, OBJECT_LAYOUT.planner.y, OBJECT_LAYOUT.planner.z]}
        size={[0.9, 0.02, 0.6]}
        color={theme.planner}
        label="planner"
        onSelect={goToPlanner}
      />
      {/* The real task list only mounts while actually focused on the
          planner — real interactive DOM sitting tiny/occluded in the
          idle-wide view would be unreadable and a stray hit-test target. */}
      {state === "PLANNER_FOCUS" && (
        <PlannerHtmlPanel
          userId={userId}
          position={[OBJECT_LAYOUT.planner.x, OBJECT_LAYOUT.planner.y + 0.02, OBJECT_LAYOUT.planner.z - 0.3]}
        />
      )}

      <InteractiveBox
        position={[OBJECT_LAYOUT.whiteboard.x, OBJECT_LAYOUT.whiteboard.y, OBJECT_LAYOUT.whiteboard.z]}
        size={[1.6, 1, 0.04]}
        color={theme.whiteboard}
        label="whiteboard"
        onSelect={goToWhiteboard}
      />

      <TimerObject userId={userId} position={[OBJECT_LAYOUT.timer.x, OBJECT_LAYOUT.timer.y, OBJECT_LAYOUT.timer.z]} />

      <InteractiveBox
        position={[OBJECT_LAYOUT.recall.x, OBJECT_LAYOUT.recall.y, OBJECT_LAYOUT.recall.z]}
        size={[0.3, 0.08, 0.22]}
        color={theme.recall}
        label="recall"
        onSelect={goToRecall}
      />

      <InteractiveBox
        position={[OBJECT_LAYOUT.textbook.x, OBJECT_LAYOUT.textbook.y, OBJECT_LAYOUT.textbook.z]}
        size={[0.28, 0.36, 0.09]}
        color={theme.textbook}
        label="textbook"
        onSelect={goToTextbook}
      />

      <DrawerFront
        position={[OBJECT_LAYOUT.drawer.x, OBJECT_LAYOUT.drawer.y, OBJECT_LAYOUT.drawer.z]}
        active={examMode.active}
        theme={theme}
        onSelect={goToDrawer}
      />
      {state === "DRAWER_FOCUS" && (
        <ExamDrawerPanel
          userId={userId}
          position={[OBJECT_LAYOUT.drawer.x, OBJECT_LAYOUT.drawer.y + 0.3, OBJECT_LAYOUT.drawer.z - 0.2]}
        />
      )}
    </>
  );
}

export function DeskScene({
  userId,
  discipline,
  onLogOut,
}: {
  userId: string;
  discipline: Discipline;
  onLogOut: () => void;
}) {
  const state = useCameraStore((s) => s.state);
  const overlay = useCameraStore((s) => s.overlay);
  const closeOverlay = useCameraStore((s) => s.closeOverlay);
  const undo = useCameraStore((s) => s.undo);
  const { data: binders } = useBinders(userId);
  const binder = binders?.find((b) => b.discipline === discipline);
  const theme = DISCIPLINE_DESK_THEME[discipline];

  // Register the camera FSM's own undo stack with the Tier 3 global undo
  // router, so Ctrl+Z can route to "undo the last camera move" or "undo the
  // last task edit" — whichever happened more recently — instead of only
  // ever undoing one or the other.
  useEffect(() => {
    return registerUndoSource("camera", {
      canUndo: () => useCameraStore.getState().history.length > 0,
      undo: () => useCameraStore.getState().undo(),
      lastActionAt: () => useCameraStore.getState().lastActionAt ?? -Infinity,
    });
  }, []);

  // Escape always backs out one step — mirrors the "misclick should be
  // undo-able" requirement without waiting for the full Tier 3 undo system.
  // Ctrl/Cmd+Z routes through the global undo router instead, EXCEPT while
  // an overlay (binder/whiteboard) is open — those own their own undo (e.g.
  // tldraw's native Ctrl+Z for drawing), and a global desk-level undo
  // hijacking that would be surprising.
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        if (overlay) closeOverlay();
        else if (state !== "IDLE_WIDE") undo();
        return;
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "z" && !overlay) {
        const target = e.target as HTMLElement | null;
        if (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA")) return;
        e.preventDefault();
        globalUndo();
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [overlay, state, closeOverlay, undo]);

  return (
    <div style={{ position: "relative", width: "100%", height: "100%", background: "#0c1113" }}>
      <Canvas shadows camera={{ fov: 50 }}>
        <CameraRig />
        <ambientLight intensity={0.45} />
        {/* The scene's one primary light source: the desk lamp. Every
            shadow in the scene is cast by this light — no competing light
            sources, per the brief. */}
        <directionalLight
          position={[OBJECT_LAYOUT.lamp.x, OBJECT_LAYOUT.lamp.y + 0.4, OBJECT_LAYOUT.lamp.z + 0.2]}
          intensity={2.2}
          color="#ffb347"
          castShadow
          shadow-mapSize={[1024, 1024]}
        />
        {/* Real Poly Haven HDRI/PBR materials are a later pass, deliberately
            not here — drei's <Environment> fetches its map over the network,
            and r3f's <Canvas> wraps children in a Suspense boundary with no
            fallback by default: a slow or failed fetch would blank the
            ENTIRE scene, including every click handler in it, not just the
            environment map (confirmed while building Tier 1 — the whole
            canvas went dark and unclickable on a flaky connection). When a
            real HDRI is added, wrap it alone in its own
            `<Suspense fallback={null}>` so a slow network fetch degrades to
            "no reflections yet," never to "the whole desk vanished." */}
        <SceneObjects userId={userId} binderId={binder?.id ?? ""} theme={theme} />
      </Canvas>

      <div
        style={{ position: "fixed", left: 16, top: 16, zIndex: 10, display: "flex", flexDirection: "column", gap: 4 }}
      >
        <span className="text-xs" style={{ color: "#f3efe6", opacity: 0.7 }}>
          {state}
        </span>
      </div>

      <div style={{ position: "fixed", right: 16, top: 16, zIndex: 10, display: "flex", gap: 12, alignItems: "center" }}>
        {state !== "IDLE_WIDE" && !overlay && (
          <button
            type="button"
            onClick={undo}
            className="rounded-full px-3 py-1.5 text-xs"
            style={{ background: "rgba(15,32,39,.7)", color: "#f3efe6" }}
          >
            ‹ Back
          </button>
        )}
        <button
          type="button"
          onClick={onLogOut}
          className="rounded-full px-3 py-1.5 text-xs"
          style={{ background: "rgba(15,32,39,.7)", color: "#f3efe6" }}
        >
          Log out
        </button>
      </div>

      <AnimatePresence>
        {overlay && (
          <Suspense
            fallback={
              <div
                style={{
                  position: "fixed",
                  inset: 0,
                  zIndex: 20,
                  background: "var(--color-bg)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <span className="text-sm text-[var(--color-text-muted)]">Opening…</span>
              </div>
            }
          >
            {overlay === "binder" && (
              <BinderOverlay key="binder" userId={userId} discipline={discipline} onClose={closeOverlay} />
            )}
            {overlay === "whiteboard" && (
              <WhiteboardOverlay key="whiteboard" userId={userId} onClose={closeOverlay} />
            )}
            {overlay === "recall" && (
              <RecallOverlay key="recall" userId={userId} discipline={discipline} onClose={closeOverlay} />
            )}
            {overlay === "textbook" && (
              <TextbookOverlay key="textbook" userId={userId} discipline={discipline} onClose={closeOverlay} />
            )}
          </Suspense>
        )}
      </AnimatePresence>
    </div>
  );
}
