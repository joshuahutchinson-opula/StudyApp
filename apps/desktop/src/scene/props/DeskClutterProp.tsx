import { usePbrMaps, pbrMaterialProps } from "../materials";

/**
 * Asset pass, item 10: small secondary desk dressing (pen cup, plant) —
 * deliberately minor in scale/visual weight per the "restrained maximalism"
 * direction already established. Decorative only, no interactivity.
 */
export function DeskClutterProp({ position }: { position: readonly [number, number, number] }) {
  const metal = usePbrMaps("metal_plate", [0.5, 0.5]);
  const [x, y, z] = position;

  return (
    <group>
      {/* Pen cup */}
      <group position={[x, y, z]}>
        <mesh castShadow receiveShadow>
          <cylinderGeometry args={[0.035, 0.03, 0.07, 20]} />
          <meshStandardMaterial {...pbrMaterialProps(metal)} color="#c9c2b3" roughness={1} metalness={1} />
        </mesh>
        {[-0.14, 0.5, 1.3].map((tilt, i) => (
          <mesh key={i} position={[Math.sin(tilt) * 0.012, 0.06, Math.cos(tilt) * 0.012]} rotation={[0, 0, tilt * 0.15]} castShadow>
            <cylinderGeometry args={[0.004, 0.004, 0.11, 8]} />
            <meshStandardMaterial color={i === 1 ? "#1d2b33" : "#2d7d8e"} roughness={0.5} />
          </mesh>
        ))}
      </group>

      {/* Small potted plant */}
      <group position={[x + 0.16, y, z + 0.02]}>
        <mesh castShadow receiveShadow>
          <cylinderGeometry args={[0.045, 0.035, 0.05, 16]} />
          <meshStandardMaterial color="#a86b45" roughness={0.85} />
        </mesh>
        {[0, 1, 2, 3, 4].map((i) => (
          <mesh
            key={i}
            position={[Math.cos((i / 5) * Math.PI * 2) * 0.02, 0.08 + (i % 2) * 0.015, Math.sin((i / 5) * Math.PI * 2) * 0.02]}
            rotation={[(i % 3) * 0.1, (i / 5) * Math.PI * 2, Math.PI / 5]}
            castShadow
          >
            <coneGeometry args={[0.018, 0.09, 8]} />
            <meshStandardMaterial color="#3f6b3f" roughness={0.8} />
          </mesh>
        ))}
      </group>
    </group>
  );
}
