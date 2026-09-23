import { Canvas } from "@react-three/fiber";
import { AnimatePresence, motion } from "motion/react";
import { useEffect } from "react";
import { CameraRig } from "./CameraRig";
import { OBJECT_LAYOUT } from "./cameraStates";
import { useCameraStore } from "./useCameraStore";

// Tier 1 (Foundation): the camera state machine working end-to-end against
// placeholder primitive geometry, with the lighting/material architecture
// established. Tier 2 swaps these boxes for real modeled geometry and PBR
// materials, and swaps the placeholder overlay panels below for the real
// binder reader / tldraw whiteboard — the camera FSM, spring physics, and
// crossfade mechanism don't change when that happens.

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

function DeskAndWall() {
  return (
    <>
      {/* Desk surface — temporary flat color; PBR wood arrives with real geometry in Tier 2. */}
      <mesh position={[OBJECT_LAYOUT.desk.x, -0.02, OBJECT_LAYOUT.desk.z]} receiveShadow>
        <boxGeometry args={[4.2, 0.04, 2.2]} />
        <meshStandardMaterial color="#5a4632" roughness={0.85} metalness={0.02} />
      </mesh>
      {/* Wall */}
      <mesh position={[OBJECT_LAYOUT.wall.x, OBJECT_LAYOUT.wall.y, OBJECT_LAYOUT.wall.z]} receiveShadow>
        <boxGeometry args={[6, 3.2, 0.05]} />
        <meshStandardMaterial color="#cfc3ac" roughness={0.95} metalness={0} />
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
  // Stands in for the real lamp model (Tier 2). The warm directional light
  // below is positioned to match — establishing now that light source and
  // geometry agree, per the brief's "every object's shadows must agree
  // with it" requirement, rather than retrofitting that later.
  return (
    <mesh position={[OBJECT_LAYOUT.lamp.x, OBJECT_LAYOUT.lamp.y, OBJECT_LAYOUT.lamp.z]} castShadow>
      <sphereGeometry args={[0.08, 16, 16]} />
      <meshStandardMaterial color="#ffdca0" emissive="#ffb347" emissiveIntensity={1.4} roughness={0.4} />
    </mesh>
  );
}

function SceneObjects({ binderId }: { binderId: string }) {
  const goToBinder = useCameraStore((s) => s.goToBinder);
  const goToPlanner = useCameraStore((s) => s.goToPlanner);
  const goToWhiteboard = useCameraStore((s) => s.goToWhiteboard);

  return (
    <>
      <DeskAndWall />
      <LampMarker />

      {/* Binder */}
      <InteractiveBox
        position={[OBJECT_LAYOUT.binder.x, OBJECT_LAYOUT.binder.y, OBJECT_LAYOUT.binder.z]}
        size={[0.32, 0.42, 0.06]}
        color="#16303b"
        label="binder"
        onSelect={() => goToBinder(binderId)}
      />

      {/* Planner sheet */}
      <InteractiveBox
        position={[OBJECT_LAYOUT.planner.x, OBJECT_LAYOUT.planner.y, OBJECT_LAYOUT.planner.z]}
        size={[0.9, 0.02, 0.6]}
        color="#f0e9da"
        label="planner"
        onSelect={goToPlanner}
      />

      {/* Whiteboard */}
      <InteractiveBox
        position={[OBJECT_LAYOUT.whiteboard.x, OBJECT_LAYOUT.whiteboard.y, OBJECT_LAYOUT.whiteboard.z]}
        size={[1.6, 1, 0.04]}
        color="#eef0ee"
        label="whiteboard"
        onSelect={goToWhiteboard}
      />

      {/* Timer — 3D casing only per the brief; the digit face is a canvas
          texture (Tier 2). Not click-interactive yet. */}
      <mesh position={[OBJECT_LAYOUT.timer.x, OBJECT_LAYOUT.timer.y, OBJECT_LAYOUT.timer.z]} castShadow>
        <cylinderGeometry args={[0.12, 0.12, 0.06, 32]} />
        <meshStandardMaterial color="#8b9190" roughness={0.35} metalness={0.6} />
      </mesh>
    </>
  );
}

function OverlayPanel({
  title,
  onClose,
}: {
  title: string;
  onClose: () => void;
}) {
  // The real crossfade target for Tier 2: this becomes the actual
  // BinderView / tldraw mount. The AnimatePresence-driven opacity fade is
  // the "crossfade transition, not a hard cut" the brief asks for — proven
  // out now so Tier 2 only swaps content, not the transition mechanism.
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.35 }}
      style={{
        position: "fixed",
        inset: 0,
        background: "var(--color-bg)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 16,
        zIndex: 20,
      }}
    >
      <p className="text-sm text-[var(--color-text-muted)]">{title} mounts here — Tier 2</p>
      <button
        type="button"
        onClick={onClose}
        className="rounded-[var(--radius-sm)] border border-[var(--color-border)] px-[var(--space-4)] py-[var(--space-2)] text-sm"
      >
        Close
      </button>
    </motion.div>
  );
}

export function DeskScene({ onLogOut }: { onLogOut: () => void }) {
  const state = useCameraStore((s) => s.state);
  const overlay = useCameraStore((s) => s.overlay);
  const closeOverlay = useCameraStore((s) => s.closeOverlay);
  const undo = useCameraStore((s) => s.undo);

  // Escape always backs out one step — mirrors the "misclick should be
  // undo-able" requirement without waiting for the full Tier 3 undo system.
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        if (overlay) closeOverlay();
        else if (state !== "IDLE_WIDE") undo();
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
        {/* Real Poly Haven HDRI/PBR materials arrive with Tier 2's real
            geometry, not here — deliberately. drei's <Environment> fetches
            its map over the network, and r3f's <Canvas> wraps children in a
            Suspense boundary with no fallback by default: a slow or failed
            fetch would blank the ENTIRE scene, including every click handler
            in it, not just the environment map (confirmed while building
            this — the whole canvas went dark and unclickable on a flaky
            connection). When a real HDRI is added, wrap it alone in its own
            `<Suspense fallback={null}>` so a slow network fetch degrades to
            "no reflections yet," never to "the whole desk vanished." */}
        <SceneObjects binderId="demo-binder" />
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
        {overlay === "binder" && <OverlayPanel key="binder" title="Binder reader" onClose={closeOverlay} />}
        {overlay === "whiteboard" && <OverlayPanel key="whiteboard" title="Whiteboard" onClose={closeOverlay} />}
      </AnimatePresence>
    </div>
  );
}
