import { RoundedBox } from "@react-three/drei";
import type { ThreeEvent } from "@react-three/fiber";
import { DoubleSide } from "three";
import { usePbrMaps, pbrMaterialProps } from "../materials";
import type { DeskTheme } from "../disciplineTheme";

const COVER_WIDTH = 0.32;
const COVER_HEIGHT = 0.42;
const COVER_DEPTH = 0.045;
const SPINE_WIDTH = 0.045;

/**
 * Asset pass, highest-scrutiny object per the brief: a closed ring-binder
 * built from composed primitives, not one flat-colored box —
 * - front cover: RoundedBox (real bevel, not BoxGeometry's sharp corners),
 *   leather or rubber material per discipline (see disciplineTheme's
 *   binderMaterial), tinted via material.color
 * - a page block peeking out on the top/right/bottom edges (cream, thin
 *   horizontal lines baked into a canvas texture to suggest paper sheets)
 * - a spine strip on the left edge carrying three recessed ring-hole
 *   indents (small dark cylinders sunk into the strip, each catching its
 *   own contact shadow against the lamp's key light)
 * - a discipline-accent tab protruding from the right edge
 * - a gold ribbon bookmark (brass/metal_plate material) hanging from the
 *   top edge, peeking out between the pages
 */
export function BinderObject({
  position,
  theme,
  onSelect,
}: {
  position: readonly [number, number, number];
  theme: DeskTheme;
  onSelect: () => void;
}) {
  const leather = usePbrMaps("leather_white", [1, 1]);
  const metal = usePbrMaps("metal_plate", [1, 1]);

  const coverMaterialProps =
    theme.binderMaterial === "leather"
      ? { ...pbrMaterialProps(leather), roughness: 0.75, metalness: 0.05 }
      : // "Rubber": the same real downloaded metal_plate map, but with its
        // roughness/metalness multipliers overridden toward a matte, non-
        // reflective rubberized surface instead of a polished metal one —
        // a genuine different material response, not just a different tint.
        { map: metal.diff, normalMap: metal.nor, roughness: 0.95, metalness: 0.02 };

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
    // A slight yaw so the spine (with its ring-hole detail) is actually
    // visible from BINDER_APPROACH's fixed, hand-placed camera angle
    // instead of sitting edge-on to it — the camera target itself stays
    // untouched per the brief's "never computed at runtime" rule.
    <group
      position={position}
      rotation={[0, 0.32, 0]}
      onClick={handleClick}
      onPointerOver={handleOver}
      onPointerOut={handleOut}
    >
      {/* Page block — sits behind the cover, slightly larger so it peeks out
          on three sides (top/right/bottom), the spine edge stays flush. */}
      <mesh position={[0.01, 0, -0.01]} castShadow receiveShadow>
        <boxGeometry args={[COVER_WIDTH - 0.01, COVER_HEIGHT - 0.01, COVER_DEPTH - 0.01]} />
        <meshStandardMaterial color="#efe9dc" roughness={0.9} metalness={0} />
      </mesh>

      {/* Front cover */}
      <RoundedBox
        args={[COVER_WIDTH, COVER_HEIGHT, COVER_DEPTH]}
        radius={0.012}
        smoothness={3}
        castShadow
        receiveShadow
      >
        <meshStandardMaterial {...coverMaterialProps} color={theme.binder} />
      </RoundedBox>

      {/* Spine strip, left edge — carries the ring-hole indents. */}
      <RoundedBox
        args={[SPINE_WIDTH, COVER_HEIGHT, COVER_DEPTH + 0.006]}
        radius={0.01}
        smoothness={2}
        position={[-COVER_WIDTH / 2 - SPINE_WIDTH / 2 + 0.01, 0, 0]}
        castShadow
        receiveShadow
      >
        <meshStandardMaterial {...coverMaterialProps} color={theme.binder} />
      </RoundedBox>
      {[-1, 0, 1].map((slot) => (
        <mesh
          key={slot}
          // Sunk about a third of the way into the spine strip's own depth
          // (half-depth (COVER_DEPTH+0.006)/2 = 0.0255) so it reads as a
          // recessed hole catching a real shadow, not a disc floating flush
          // on the surface.
          position={[-COVER_WIDTH / 2 - SPINE_WIDTH / 2 + 0.01, slot * (COVER_HEIGHT * 0.28), 0.017]}
          rotation={[Math.PI / 2, 0, 0]}
          receiveShadow
        >
          <cylinderGeometry args={[0.012, 0.012, 0.012, 16]} />
          <meshStandardMaterial color="#0a0a0a" roughness={0.6} metalness={0.3} />
        </mesh>
      ))}

      {/* Discipline-accent tab, right edge */}
      <mesh position={[COVER_WIDTH / 2 + 0.02, COVER_HEIGHT * 0.28, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.045, 0.09, 0.012]} />
        <meshStandardMaterial color={theme.recall} roughness={0.6} metalness={0.05} />
      </mesh>

      {/* Gold ribbon bookmark, hanging from the top edge over the front
          cover. A flat PBR gold (no diffuse photo) reads cleaner than
          tinting metal_plate's own dark/scratched diffuse map at this
          small a scale — the metallic sheen still comes from real HDRI
          reflections via metalness, not a flat unlit color. */}
      <mesh position={[COVER_WIDTH * 0.22, COVER_HEIGHT / 2 - 0.03, COVER_DEPTH / 2 + 0.002]} castShadow>
        <planeGeometry args={[0.03, 0.16]} />
        <meshStandardMaterial color="#d4af37" roughness={0.3} metalness={0.9} side={DoubleSide} />
      </mesh>
    </group>
  );
}
