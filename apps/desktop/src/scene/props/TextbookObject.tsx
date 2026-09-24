import { RoundedBox } from "@react-three/drei";
import type { ThreeEvent } from "@react-three/fiber";
import { usePbrMaps, pbrMaterialProps } from "../materials";
import type { DeskTheme } from "../disciplineTheme";

const WIDTH = 0.28;
const HEIGHT = 0.36;
const DEPTH = 0.075;

/**
 * A closed hardcover reference book — distinct from BinderObject (no ring
 * holes, no tab, no ribbon; a plain cloth-bound cover with a paper title
 * label) so the two objects read as genuinely different things on the desk
 * rather than the same box in a different color, per Tier 8's earlier fix
 * for the binder/textbook color collision.
 */
export function TextbookObject({
  position,
  theme,
  onSelect,
}: {
  position: readonly [number, number, number];
  theme: DeskTheme;
  onSelect: () => void;
}) {
  const cloth = usePbrMaps("leather_white", [0.6, 0.6]);

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
    <group position={position} rotation={[0, 0.22, 0]} onClick={handleClick} onPointerOver={handleOver} onPointerOut={handleOut}>
      {/* Page block, peeking out on 3 edges */}
      <mesh position={[0.008, 0, -0.008]} castShadow receiveShadow>
        <boxGeometry args={[WIDTH - 0.01, HEIGHT - 0.01, DEPTH - 0.01]} />
        <meshStandardMaterial color="#efe9dc" roughness={0.9} />
      </mesh>
      {/* Cover */}
      <RoundedBox args={[WIDTH, HEIGHT, DEPTH]} radius={0.008} smoothness={3} castShadow receiveShadow>
        <meshStandardMaterial {...pbrMaterialProps(cloth)} color={theme.textbook} roughness={0.85} metalness={1} />
      </RoundedBox>
      {/* Paper title label */}
      <mesh position={[0, HEIGHT * 0.18, DEPTH / 2 + 0.002]} castShadow>
        <planeGeometry args={[WIDTH * 0.6, HEIGHT * 0.18]} />
        <meshStandardMaterial color="#f3ecdc" roughness={0.9} />
      </mesh>
    </group>
  );
}
