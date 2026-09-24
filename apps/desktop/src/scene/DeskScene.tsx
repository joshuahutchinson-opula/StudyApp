import { Canvas } from "@react-three/fiber";
import { AnimatePresence } from "motion/react";
import { Suspense, lazy, useEffect, useState } from "react";
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
import { DISCIPLINE_DESK_THEME, mergeDeskTheme, type DeskTheme } from "./disciplineTheme";
import { WallCustomizePanel } from "./WallCustomizePanel";
import { useAuthStore } from "../store/useAuthStore";
import { LampLightDrift } from "./LampLightDrift";
import { AmbientRecap } from "./AmbientRecap";
import { TIMER_SLOTS, resolveTimerSlot } from "./deskLayout";
import { useUpdateDeskLayout } from "../features/preferences/api";
import { usePbrMaps, pbrMaterialProps } from "./materials";
import { Environment } from "@react-three/drei";
import { BinderObject } from "./props/BinderObject";
import { PlannerObject } from "./props/PlannerObject";
import { WhiteboardObject } from "./props/WhiteboardObject";
import { LampProp } from "./props/LampProp";
import { BookshelfProp } from "./props/BookshelfProp";
import { CorkboardProp } from "./props/CorkboardProp";
import { DeskClutterProp } from "./props/DeskClutterProp";
import { TextbookObject } from "./props/TextbookObject";

// All full-screen overlays are code-split — neither ships in the initial
// bundle, same pattern the old dashboard used for Cytoscape (GraphView). The
// camera has already settled by the time any of these starts fetching, so
// the brief lag reads as "the reader is opening," not as a stall.
const BinderOverlay = lazy(() => import("./BinderOverlay").then((m) => ({ default: m.BinderOverlay })));
const WhiteboardOverlay = lazy(() => import("./WhiteboardOverlay").then((m) => ({ default: m.WhiteboardOverlay })));
const RecallOverlay = lazy(() => import("./RecallOverlay").then((m) => ({ default: m.RecallOverlay })));
const TextbookOverlay = lazy(() => import("./TextbookOverlay").then((m) => ({ default: m.TextbookOverlay })));
const SignatureFeatureOverlay = lazy(() =>
  import("./SignatureFeatureOverlay").then((m) => ({ default: m.SignatureFeatureOverlay })),
);
const GraphOverlay = lazy(() => import("./GraphOverlay").then((m) => ({ default: m.GraphOverlay })));

const GRAPH_COLOR = "#6b7fd7";

// The three disciplines with a standalone signature-feature "room" — see
// SignatureFeatureOverlay.tsx for why Software/Engineering aren't here.
const DISCIPLINES_WITH_SIGNATURE_OBJECT: readonly Discipline[] = ["medicine", "arts", "writing"];

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
  const wood = usePbrMaps("dark_wood", [1, 0.3]);
  const metal = usePbrMaps("metal_plate", [0.3, 0.3]);

  return (
    <group
      position={position}
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
      <mesh castShadow receiveShadow>
        <boxGeometry args={[1.0, 0.28, 0.06]} />
        <meshStandardMaterial
          {...pbrMaterialProps(wood)}
          color={theme.drawerBase}
          emissive={active ? theme.drawerGlow : "#000000"}
          emissiveIntensity={active ? 0.35 : 0}
          roughness={1}
          metalness={1}
        />
      </mesh>
      {/* Handle */}
      <mesh position={[0, 0, 0.035]} rotation={[Math.PI / 2, 0, 0]} castShadow>
        <cylinderGeometry args={[0.008, 0.008, 0.22, 12]} />
        <meshStandardMaterial {...pbrMaterialProps(metal)} color="#c7cdd1" roughness={0.6} metalness={1} />
      </mesh>
    </group>
  );
}

function DeskAndWall({ theme, onSelectWall }: { theme: DeskTheme; onSelectWall: () => void }) {
  // Real Poly Haven PBR sets (see materials.ts) — theme.deskWood/theme.wall
  // now tint a genuine wood-grain/plaster diffuse+normal+roughness texture
  // via material.color instead of coloring a flat primitive. Repeat counts
  // are picked so the grain reads at roughly real-world scale against each
  // surface's actual size (a 4.2-unit desk isn't one giant stretched plank).
  const deskMaps = usePbrMaps("dark_wood", [3, 2]);
  const wallMaps = usePbrMaps("painted_plaster_wall", [4, 2]);

  return (
    <>
      <mesh position={[OBJECT_LAYOUT.desk.x, -0.02, OBJECT_LAYOUT.desk.z]} receiveShadow castShadow>
        <boxGeometry args={[4.2, 0.04, 2.2]} />
        <meshStandardMaterial {...pbrMaterialProps(deskMaps)} color={theme.deskWood} roughness={1} metalness={1} />
      </mesh>
      {/* Wall — also Tier 7's customization entry point. The whiteboard
          object sits slightly in front of it (z -2.15 vs -2.2), so clicking
          the whiteboard itself still hits the whiteboard first; only
          clicking elsewhere on the wall reaches this handler. */}
      <mesh
        position={[OBJECT_LAYOUT.wall.x, OBJECT_LAYOUT.wall.y, OBJECT_LAYOUT.wall.z]}
        receiveShadow
        onClick={(e) => {
          e.stopPropagation();
          onSelectWall();
        }}
        onPointerOver={(e) => {
          e.stopPropagation();
          document.body.style.cursor = "pointer";
        }}
        onPointerOut={() => {
          document.body.style.cursor = "auto";
        }}
      >
        <boxGeometry args={[6, 3.2, 0.05]} />
        <meshStandardMaterial {...pbrMaterialProps(wallMaps)} color={theme.wall} roughness={1} metalness={1} />
      </mesh>
      {/* Floor, mostly to catch shadows and ground the scene visually */}
      <mesh position={[0, -0.6, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[20, 20]} />
        <meshStandardMaterial color="#26221c" roughness={1} metalness={0} />
      </mesh>
    </>
  );
}

// LampMarker (a placeholder emissive sphere) is gone — LampProp (asset
// pass) replaces it with a real composed base/arm/shade.

function SceneObjects({
  userId,
  discipline,
  binderId,
  theme,
  editingLayout,
  timerSlotIndex,
  onCycleTimer,
}: {
  userId: string;
  discipline: Discipline;
  binderId: string;
  theme: DeskTheme;
  editingLayout: boolean;
  timerSlotIndex: number;
  onCycleTimer: () => void;
}) {
  const goToBinder = useCameraStore((s) => s.goToBinder);
  const goToPlanner = useCameraStore((s) => s.goToPlanner);
  const goToWhiteboard = useCameraStore((s) => s.goToWhiteboard);
  const goToRecall = useCameraStore((s) => s.goToRecall);
  const goToSignature = useCameraStore((s) => s.goToSignature);
  const goToGraph = useCameraStore((s) => s.goToGraph);
  const goToTextbook = useCameraStore((s) => s.goToTextbook);
  const goToDrawer = useCameraStore((s) => s.goToDrawer);
  const goToWall = useCameraStore((s) => s.goToWall);
  const state = useCameraStore((s) => s.state);
  const examMode = useExamMode(userId);
  // While rearranging the desk, a misclick on another object shouldn't fly
  // the camera away mid-edit — every OTHER object's navigation is disarmed
  // for the duration (the timer's own click is handled separately, since
  // it's the one object edit mode actually repositions).
  const guard = (fn: () => void) => (editingLayout ? () => {} : fn);

  return (
    <>
      <DeskAndWall theme={theme} onSelectWall={guard(goToWall)} />
      <LampProp position={[OBJECT_LAYOUT.lamp.x, OBJECT_LAYOUT.lamp.y, OBJECT_LAYOUT.lamp.z]} />
      {state === "WALL_FOCUS" && (
        <WallCustomizePanel userId={userId} theme={theme} position={[1.6, 1.9, -2.17]} />
      )}

      {/* Asset pass decoration — bookshelf and corkboard, both clickable
          through to the same wall-customization target so they don't read
          as dead zones on a wall that's otherwise interactive everywhere
          else. Positioned clear of the wall's own WALL_FOCUS panel (x=1.6). */}
      <group onClick={(e) => { e.stopPropagation(); guard(goToWall)(); }}>
        <BookshelfProp position={[-2.15, 1.3, -2.06]} />
        <CorkboardProp position={[2.15, 1.65, -2.1]} />
      </group>
      <DeskClutterProp position={[1.55, 0.02, 0.55]} />

      <BinderObject
        position={[OBJECT_LAYOUT.binder.x, OBJECT_LAYOUT.binder.y, OBJECT_LAYOUT.binder.z]}
        theme={theme}
        onSelect={guard(() => goToBinder(binderId))}
      />

      <PlannerObject
        position={[OBJECT_LAYOUT.planner.x, OBJECT_LAYOUT.planner.y, OBJECT_LAYOUT.planner.z]}
        theme={theme}
        onSelect={guard(goToPlanner)}
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

      <WhiteboardObject
        position={[OBJECT_LAYOUT.whiteboard.x, OBJECT_LAYOUT.whiteboard.y, OBJECT_LAYOUT.whiteboard.z]}
        theme={theme}
        onSelect={guard(goToWhiteboard)}
      />

      <TimerObject
        userId={userId}
        position={[resolveTimerSlot(timerSlotIndex).x, OBJECT_LAYOUT.timer.y, resolveTimerSlot(timerSlotIndex).z]}
        editingLayout={editingLayout}
        onReposition={onCycleTimer}
      />

      <InteractiveBox
        position={[OBJECT_LAYOUT.recall.x, OBJECT_LAYOUT.recall.y, OBJECT_LAYOUT.recall.z]}
        size={[0.3, 0.08, 0.22]}
        color={theme.recall}
        label="recall"
        onSelect={guard(goToRecall)}
      />

      <TextbookObject
        position={[OBJECT_LAYOUT.textbook.x, OBJECT_LAYOUT.textbook.y, OBJECT_LAYOUT.textbook.z]}
        theme={theme}
        onSelect={guard(goToTextbook)}
      />

      <DrawerFront
        position={[OBJECT_LAYOUT.drawer.x, OBJECT_LAYOUT.drawer.y, OBJECT_LAYOUT.drawer.z]}
        active={examMode.active}
        theme={theme}
        onSelect={guard(goToDrawer)}
      />
      {state === "DRAWER_FOCUS" && (
        <ExamDrawerPanel
          userId={userId}
          position={[OBJECT_LAYOUT.drawer.x, OBJECT_LAYOUT.drawer.y + 0.3, OBJECT_LAYOUT.drawer.z - 0.2]}
        />
      )}

      {/* Tier 8: only the three disciplines with a standalone signature
          feature get this object — see SignatureFeatureOverlay.tsx. */}
      {DISCIPLINES_WITH_SIGNATURE_OBJECT.includes(discipline) && (
        <InteractiveBox
          position={[OBJECT_LAYOUT.signature.x, OBJECT_LAYOUT.signature.y, OBJECT_LAYOUT.signature.z]}
          size={[0.34, 0.08, 0.24]}
          color={theme.signature}
          label="signature"
          onSelect={guard(goToSignature)}
        />
      )}

      {/* Tier 10's knowledge graph — no design reference exists yet, so this
          is a placeholder box like every other object was at Tier 1/2. */}
      <InteractiveBox
        position={[OBJECT_LAYOUT.graph.x, OBJECT_LAYOUT.graph.y, OBJECT_LAYOUT.graph.z]}
        size={[0.3, 0.05, 0.3]}
        color={GRAPH_COLOR}
        label="graph"
        onSelect={guard(goToGraph)}
      />
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
  const requestSkip = useCameraStore((s) => s.requestSkip);
  const initialPageId = useCameraStore((s) => s.initialPageId);
  const { data: binders } = useBinders(userId);
  const binder = binders?.find((b) => b.discipline === discipline);
  const deskThemeOverride = useAuthStore((s) => s.user?.deskThemeOverride);
  const theme = mergeDeskTheme(DISCIPLINE_DESK_THEME[discipline], deskThemeOverride);
  const deskLayoutOverride = useAuthStore((s) => s.user?.deskLayoutOverride);
  const timerSlotIndex = deskLayoutOverride?.timer ?? 0;
  const updateDeskLayout = useUpdateDeskLayout();
  const [editingLayout, setEditingLayout] = useState(false);

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
            sources, per the brief. Tier 9's lighting drift lives in
            LampLightDrift — same light, but its color/intensity now
            follows the real time of day instead of a fixed value. */}
        <LampLightDrift />
        {/* Asset pass: a real Poly Haven HDRI for ambient fill/reflections
            (brass hardware, the binder's leather sheen) alongside the one
            key light above. Wrapped in its OWN Suspense boundary, isolated
            from the rest of the scene — r3f's <Canvas> has no fallback-less
            Suspense boundary of its own, and a slow/failed environment-map
            load blanking every click handler in the scene was a real bug
            hit during Tier 1. Served locally from public/hdri (not a CDN
            fetch), so this is now a belt-and-suspenders guard rather than a
            live risk, but the isolation costs nothing to keep. */}
        <Suspense fallback={null}>
          <Environment files="/hdri/studio.hdr" background={false} environmentIntensity={0.6} />
        </Suspense>
        <SceneObjects
          userId={userId}
          discipline={discipline}
          binderId={binder?.id ?? ""}
          theme={theme}
          editingLayout={editingLayout}
          timerSlotIndex={timerSlotIndex}
          onCycleTimer={() => {
            const next = (timerSlotIndex + 1) % TIMER_SLOTS.length;
            updateDeskLayout.mutate({ timer: next });
          }}
        />
      </Canvas>

      {state === "IDLE_WIDE" && <AmbientRecap userId={userId} discipline={discipline} />}

      <div
        style={{ position: "fixed", left: 16, top: 16, zIndex: 10, display: "flex", flexDirection: "column", gap: 4 }}
      >
        <span className="text-xs" style={{ color: "#f3efe6", opacity: 0.7 }}>
          {state}
        </span>
      </div>

      <div style={{ position: "fixed", right: 16, top: 16, zIndex: 10, display: "flex", gap: 12, alignItems: "center" }}>
        {/* Tier 9's rearrangeable desk toggle — only meaningful at
            IDLE_WIDE, where the timer (the one object with no dedicated
            camera-approach state) is actually visible and clickable. */}
        {state === "IDLE_WIDE" && (
          <button
            type="button"
            onClick={() => setEditingLayout((v) => !v)}
            className="rounded-full px-3 py-1.5 text-xs"
            style={{
              background: editingLayout ? "#2d7d8e" : "rgba(15,32,39,.7)",
              color: "#f3efe6",
            }}
          >
            {editingLayout ? "Done arranging" : "Edit layout"}
          </button>
        )}
        {state !== "IDLE_WIDE" && !overlay && (
          <>
            {/* Tier 9's skip-animation QoL feature — snaps the in-flight
                camera straight to its target instead of waiting out the
                spring settle. Shown anywhere the spring might still be
                moving, same condition as Back. */}
            <button
              type="button"
              onClick={requestSkip}
              className="rounded-full px-3 py-1.5 text-xs"
              style={{ background: "rgba(15,32,39,.7)", color: "#f3efe6" }}
            >
              Skip ⏭
            </button>
            <button
              type="button"
              onClick={undo}
              className="rounded-full px-3 py-1.5 text-xs"
              style={{ background: "rgba(15,32,39,.7)", color: "#f3efe6" }}
            >
              ‹ Back
            </button>
          </>
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
              <BinderOverlay
                key="binder"
                userId={userId}
                discipline={discipline}
                initialPageId={initialPageId ?? undefined}
                onClose={closeOverlay}
              />
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
            {overlay === "signature" && (
              <SignatureFeatureOverlay key="signature" userId={userId} discipline={discipline} onClose={closeOverlay} />
            )}
            {overlay === "graph" && (
              <GraphOverlay key="graph" userId={userId} discipline={discipline} onClose={closeOverlay} />
            )}
          </Suspense>
        )}
      </AnimatePresence>
    </div>
  );
}
