import { useMemo } from "react";
import { usePbrMaps, pbrMaterialProps } from "../materials";

const SPINE_COLORS = ["#16303b", "#0f4b43", "#3d3226", "#14335e", "#7a2e2e", "#4a5a52", "#5c4a42", "#2b6cb0"];

interface Book {
  x: number;
  width: number;
  height: number;
  color: string;
}

function layoutShelf(count: number, span: number, seed: number): Book[] {
  const books: Book[] = [];
  let cursor = -span / 2;
  for (let i = 0; i < count; i++) {
    // Deterministic pseudo-randomness (no external RNG dependency needed for
    // a purely decorative prop) — varies width/height/color per book so the
    // shelf doesn't read as one repeated block.
    const r = Math.abs(Math.sin(seed + i * 12.9898) * 43758.5453) % 1;
    const width = 0.035 + r * 0.025;
    const height = 0.22 + ((r * 7) % 1) * 0.07;
    const color = SPINE_COLORS[Math.floor(r * SPINE_COLORS.length) % SPINE_COLORS.length]!;
    books.push({ x: cursor + width / 2, width, height, color });
    cursor += width + 0.004;
  }
  return books;
}

function Shelf({ y, z, seed }: { y: number; z: number; seed: number }) {
  const wood = usePbrMaps("oak_veneer", [2, 0.3]);
  const shelfWidth = 1.15;
  const books = useMemo(() => layoutShelf(11, shelfWidth * 0.92, seed), [seed]);

  return (
    <group position={[0, y, z]}>
      {/* Shelf plank */}
      <mesh position={[0, -0.02, 0]} castShadow receiveShadow>
        <boxGeometry args={[shelfWidth, 0.02, 0.16]} />
        <meshStandardMaterial {...pbrMaterialProps(wood)} color="#a9835a" roughness={1} metalness={1} />
      </mesh>
      {books.map((b, i) => (
        <mesh key={i} position={[b.x, b.height / 2, 0]} castShadow receiveShadow>
          <boxGeometry args={[b.width, b.height, 0.12]} />
          <meshStandardMaterial color={b.color} roughness={0.7} metalness={0.05} />
        </mesh>
      ))}
    </group>
  );
}

/**
 * Asset pass, item 8: individually distinguishable books on real wood
 * shelves instead of one flat colored block — decorative only (no click
 * handler, no data binding), matching the Claude Design reference render's
 * bookshelf composition.
 */
export function BookshelfProp({ position }: { position: readonly [number, number, number] }) {
  return (
    <group position={position}>
      <Shelf y={0.22} z={0} seed={1.7} />
      <Shelf y={-0.05} z={0} seed={4.3} />
    </group>
  );
}
