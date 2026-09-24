import { usePbrMaps, pbrMaterialProps } from "../materials";

const CARDS = [
  { x: -0.2, y: 0.12, rot: -0.08, color: "#f3ecdc" },
  { x: 0.05, y: -0.05, rot: 0.05, color: "#f0e2c8" },
  { x: 0.25, y: 0.15, rot: 0.1, color: "#f3ecdc" },
];

const BOARD_WIDTH = 0.6;
const BOARD_HEIGHT = 0.42;

/**
 * Asset pass, item 7: a pinboard with real burlap texture (hessian —
 * Poly Haven has no literal cork texture; see public/textures/SOURCES.md
 * for why this substitution is honest, not a placeholder) and individual
 * pinned note cards (small tilted planes with a dark pin sphere each)
 * instead of one flat colored rectangle. Decorative only.
 */
export function CorkboardProp({ position }: { position: readonly [number, number, number] }) {
  const cork = usePbrMaps("hessian", [1.5, 1.2]);
  const frameColor = "#4a3826";

  return (
    <group position={position}>
      {/* Frame */}
      <mesh position={[0, 0, -0.01]} castShadow receiveShadow>
        <boxGeometry args={[BOARD_WIDTH + 0.04, BOARD_HEIGHT + 0.04, 0.03]} />
        <meshStandardMaterial color={frameColor} roughness={0.8} />
      </mesh>
      {/* Board surface */}
      <mesh position={[0, 0, 0.006]} receiveShadow>
        <boxGeometry args={[BOARD_WIDTH, BOARD_HEIGHT, 0.02]} />
        <meshStandardMaterial {...pbrMaterialProps(cork)} color="#c9a876" roughness={1} metalness={1} />
      </mesh>

      {CARDS.map((card, i) => (
        <group key={i} position={[card.x, card.y, 0.02]} rotation={[0, 0, card.rot]}>
          <mesh castShadow>
            <boxGeometry args={[0.14, 0.1, 0.004]} />
            <meshStandardMaterial color={card.color} roughness={0.9} />
          </mesh>
          <mesh position={[0, 0.04, 0.004]} castShadow>
            <sphereGeometry args={[0.006, 12, 12]} />
            <meshStandardMaterial color="#8a1f1f" roughness={0.4} metalness={0.3} />
          </mesh>
        </group>
      ))}
    </group>
  );
}
