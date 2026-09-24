import { useMemo } from "react";
import type { ThreeEvent } from "@react-three/fiber";
import { usePbrMaps } from "../materials";
import { createRuledPaperTexture } from "../canvasTextures";
import type { DeskTheme } from "../disciplineTheme";

const PAGE_WIDTH = 0.42;
const PAGE_DEPTH = 0.58;
const PAGE_THICKNESS = 0.012;
const TILT = 0.035; // radians — a shallow ridge at the center seam, like a ring binder forces when open flat

/**
 * Asset pass, item 4: an open two-page spread instead of one flat plane —
 * two thin page slabs hinged (tilted) at a shared center seam, a row of
 * metal ring cylinders along that seam, real canvas-generated ruled-paper
 * texture (see canvasTextures.ts — Poly Haven has no photographed paper
 * texture to download), and a pen resting across it.
 */
export function PlannerObject({
  position,
  theme,
  onSelect,
}: {
  position: readonly [number, number, number];
  theme: DeskTheme;
  onSelect: () => void;
}) {
  const metal = usePbrMaps("metal_plate");
  const leftPaper = useMemo(() => createRuledPaperTexture(false), []);
  const rightPaper = useMemo(() => createRuledPaperTexture(true), []);

  function handleClick(e: ThreeEvent<MouseEvent>) {
    e.stopPropagation();
    onSelect();
  }
  function handleOver(e: ThreeEvent<PointerEvent>) {
    e.stopPropagation();
    document.body.style.cursor = "pointer";
  }
  function handleOut() {
    document.body.style.cursor = "auto";
  }

  return (
    <group position={position} onClick={handleClick} onPointerOver={handleOver} onPointerOut={handleOut}>
      {/* Cover/base sheet, slightly larger, catches shadow beneath the pages */}
      <mesh position={[0, -0.01, 0]} receiveShadow>
        <boxGeometry args={[PAGE_WIDTH * 2 + 0.02, 0.006, PAGE_DEPTH + 0.02]} />
        <meshStandardMaterial color={theme.planner} roughness={0.9} />
      </mesh>

      <mesh
        position={[-PAGE_WIDTH / 2, PAGE_THICKNESS, 0]}
        rotation={[0, 0, TILT]}
        castShadow
        receiveShadow
      >
        <boxGeometry args={[PAGE_WIDTH, PAGE_THICKNESS, PAGE_DEPTH]} />
        <meshStandardMaterial map={leftPaper} roughness={0.95} />
      </mesh>
      <mesh
        position={[PAGE_WIDTH / 2, PAGE_THICKNESS, 0]}
        rotation={[0, 0, -TILT]}
        castShadow
        receiveShadow
      >
        <boxGeometry args={[PAGE_WIDTH, PAGE_THICKNESS, PAGE_DEPTH]} />
        <meshStandardMaterial map={rightPaper} roughness={0.95} />
      </mesh>

      {/* Ring binding along the center seam */}
      {[-0.22, -0.09, 0.04, 0.17].map((z) => (
        <mesh key={z} position={[0, PAGE_THICKNESS + 0.012, z]} rotation={[Math.PI / 2, 0, 0]} castShadow>
          <torusGeometry args={[0.014, 0.004, 8, 16]} />
          <meshStandardMaterial map={metal.diff} normalMap={metal.nor} roughness={0.3} metalness={1} />
        </mesh>
      ))}

      {/* A pen resting diagonally across the spread */}
      <group position={[0.05, PAGE_THICKNESS + 0.014, -0.05]} rotation={[0, 0.5, Math.PI / 2 - 0.08]}>
        <mesh castShadow>
          <cylinderGeometry args={[0.006, 0.006, 0.32, 12]} />
          <meshStandardMaterial color="#1d2b33" roughness={0.4} metalness={0.3} />
        </mesh>
        <mesh position={[0, 0.17, 0]} castShadow>
          <coneGeometry args={[0.006, 0.02, 12]} />
          <meshStandardMaterial map={metal.diff} normalMap={metal.nor} roughness={0.3} metalness={1} />
        </mesh>
      </group>
    </group>
  );
}
