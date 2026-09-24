import type { ThreeEvent } from "@react-three/fiber";
import { useEffect, useMemo, useRef, useState } from "react";
import { CanvasTexture } from "three";
import { useEndSession, useStartSession } from "../features/focus/api";
import { usePbrMaps, pbrMaterialProps } from "./materials";

const POMODORO_SECONDS = 25 * 60;

function formatTime(totalSeconds: number) {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

/**
 * The desk clock: real 3D geometry for the casing, per the brief — the
 * digit display itself is a canvas texture redrawn on change, never modeled
 * as seven-segment geometry. Not part of the camera FSM (no dedicated
 * approach state); clicking it toggles a real focus session in place, same
 * hooks features/focus/FocusTimer.tsx already uses.
 *
 * Tier 9's rearrangeable desk repurposes this same click while
 * `editingLayout` is true: instead of toggling the timer, it calls
 * `onReposition` (DeskScene cycles it through TIMER_SLOTS) — the timer is
 * the one desk object with no dedicated camera-approach state, so it's the
 * only one that can move without desyncing a camera target from it.
 */
export function TimerObject({
  userId,
  position,
  editingLayout = false,
  onReposition,
}: {
  userId: string;
  position: readonly [number, number, number];
  editingLayout?: boolean;
  onReposition?: () => void;
}) {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const running = sessionId !== null;
  const startSession = useStartSession(userId);
  const endSession = useEndSession(userId);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!running) return;
    intervalRef.current = setInterval(() => setElapsed((s) => s + 1), 1000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [running]);

  function finish(sid: string, seconds: number) {
    if (intervalRef.current) clearInterval(intervalRef.current);
    endSession.mutate({ sessionId: sid, focusMinutes: Math.max(1, Math.round(seconds / 60)) });
    setSessionId(null);
    setElapsed(0);
  }

  useEffect(() => {
    if (running && sessionId && elapsed >= POMODORO_SECONDS) finish(sessionId, elapsed);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [elapsed, running, sessionId]);

  function toggle(e: ThreeEvent<MouseEvent>) {
    e.stopPropagation();
    if (editingLayout) {
      onReposition?.();
      return;
    }
    if (sessionId) finish(sessionId, elapsed);
    else startSession.mutate("pomodoro", { onSuccess: (s) => setSessionId(s.id) });
  }

  const remaining = Math.max(0, POMODORO_SECONDS - elapsed);
  // Asset pass: real brushed-metal PBR casing instead of a flat gray color —
  // repeat kept small (this object is tiny) so the plate's own scratches
  // don't tile into visible noise at this scale.
  const metal = usePbrMaps("metal_plate", [0.6, 0.6]);

  const canvas = useMemo(() => {
    const c = document.createElement("canvas");
    c.width = 256;
    c.height = 256;
    return c;
  }, []);
  const texture = useMemo(() => new CanvasTexture(canvas), [canvas]);

  useEffect(() => {
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "#0f2027";
    ctx.beginPath();
    ctx.arc(canvas.width / 2, canvas.height / 2, canvas.width / 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = running ? "#5eead4" : "#e6e2d8";
    ctx.font = "600 42px 'Courier New', monospace";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(formatTime(remaining), canvas.width / 2, canvas.height / 2 - 10);
    ctx.font = "600 15px sans-serif";
    ctx.fillStyle = "#8b9190";
    ctx.fillText(running ? "FOCUS" : "PAUSED", canvas.width / 2, canvas.height / 2 + 34);
    texture.needsUpdate = true;
  }, [canvas, texture, remaining, running]);

  return (
    <group position={position}>
      <mesh
        castShadow
        onClick={toggle}
        onPointerOver={(e) => {
          e.stopPropagation();
          document.body.style.cursor = "pointer";
        }}
        onPointerOut={() => {
          document.body.style.cursor = "auto";
        }}
      >
        <cylinderGeometry args={[0.13, 0.14, 0.055, 40]} />
        <meshStandardMaterial
          {...pbrMaterialProps(metal)}
          color="#9aa09f"
          emissive={editingLayout ? "#2d7d8e" : "#000000"}
          emissiveIntensity={editingLayout ? 0.5 : 0}
          roughness={1}
          metalness={1}
        />
      </mesh>
      {/* A thin brass bezel ring around the digit face, matching the
          reference's timer — a real torus, not implied by the texture. */}
      <mesh position={[0, 0.0276, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.117, 0.006, 12, 48]} />
        <meshStandardMaterial color="#d4af37" roughness={0.3} metalness={0.9} />
      </mesh>
      {/* Digit face: a flat disc on the casing's top surface, textured with
          the canvas above — the "2D texture applied to the geometry's
          screen surface" the brief specifies. */}
      <mesh position={[0, 0.0276, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.115, 40]} />
        <meshBasicMaterial map={texture} toneMapped={false} />
      </mesh>
    </group>
  );
}
