import { useMemo } from "react";
import { Vector3, Quaternion, DoubleSide } from "three";
import { usePbrMaps, pbrMaterialProps } from "../materials";

const LAMP_COLOR = "#16303b";

/** A cylinder segment spanning two points — position at the midpoint,
 * rotated so its default Y-axis aligns with the vector between them. Used
 * for the lamp's two jointed arm segments instead of guessing Euler angles
 * by hand for each. */
function ArmSegment({ from, to, radius }: { from: Vector3; to: Vector3; radius: number }) {
  const { position, quaternion, length } = useMemo(() => {
    const dir = new Vector3().subVectors(to, from);
    const len = dir.length();
    const mid = new Vector3().addVectors(from, to).multiplyScalar(0.5);
    const quat = new Quaternion().setFromUnitVectors(new Vector3(0, 1, 0), dir.clone().normalize());
    return { position: mid, quaternion: quat, length: len };
  }, [from, to]);

  return (
    <mesh position={position} quaternion={quaternion} castShadow>
      <cylinderGeometry args={[radius, radius, length, 12]} />
      <meshStandardMaterial color={LAMP_COLOR} roughness={0.4} metalness={0.6} />
    </mesh>
  );
}

/**
 * Asset pass, item 9: base + jointed arm + shade as separate composed
 * geometries (matching the Claude Design reference render's dark teal
 * jointed desk lamp) instead of one marker sphere. The actual light source
 * (LampLightDrift's directional light, untouched by this pass) still
 * conceptually sits at the shade tip — this only adds the geometry a real
 * lamp would have around that point, it doesn't move the light itself.
 */
export function LampProp({ position }: { position: readonly [number, number, number] }) {
  const metal = usePbrMaps("metal_plate", [1, 1]);

  const base = new Vector3(position[0], 0.02, position[2] + 0.32);
  const joint = new Vector3(position[0] - 0.05, 0.5, position[2] + 0.1);
  const shade = new Vector3(position[0], position[1], position[2]);

  return (
    <group>
      {/* Weighted base disc */}
      <mesh position={[base.x, 0.015, base.z]} castShadow receiveShadow>
        <cylinderGeometry args={[0.09, 0.1, 0.03, 24]} />
        <meshStandardMaterial {...pbrMaterialProps(metal)} color={LAMP_COLOR} roughness={0.6} metalness={1} />
      </mesh>

      <ArmSegment from={base} to={joint} radius={0.014} />
      {/* Elbow joint */}
      <mesh position={joint} castShadow>
        <sphereGeometry args={[0.02, 16, 16]} />
        <meshStandardMaterial color={LAMP_COLOR} roughness={0.4} metalness={0.7} />
      </mesh>
      <ArmSegment from={joint} to={shade} radius={0.012} />

      {/* Shade — an open cone, wide end down toward the desk */}
      <mesh position={shade} rotation={[Math.PI, 0, 0]} castShadow>
        <coneGeometry args={[0.09, 0.14, 24, 1, true]} />
        <meshStandardMaterial color={LAMP_COLOR} roughness={0.5} metalness={0.4} side={DoubleSide} />
      </mesh>
      {/* The "bulb" glow — same emissive marker the scene already had,
          repositioned to sit just inside the shade's open mouth. */}
      <mesh position={[shade.x, shade.y - 0.05, shade.z]} castShadow>
        <sphereGeometry args={[0.045, 16, 16]} />
        <meshStandardMaterial color="#ffdca0" emissive="#ffb347" emissiveIntensity={1.4} roughness={0.4} />
      </mesh>
    </group>
  );
}
