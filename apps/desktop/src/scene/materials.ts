import { useTexture } from "@react-three/drei";
import { RepeatWrapping, SRGBColorSpace, type Texture } from "three";

// Real, downloaded Poly Haven PBR texture sets (see public/textures/SOURCES.md
// for exactly which asset each one is and why). Every material in the scene
// is built from one of these three-map sets — diffuse/albedo, an OpenGL-
// convention normal map, and an "arm" map (Poly Haven's standard packing:
// R=ambient-occlusion, G=roughness, B=metalness) — rather than a flat
// MeshStandardMaterial color.
export interface PbrMaps {
  diff: Texture;
  nor: Texture;
  arm: Texture;
}

/**
 * Loads one Poly Haven texture set from `/textures/<name>/{diff,nor,arm}.jpg`
 * and configures real-world tiling. `repeat` is in texture-tiles-per-object,
 * not UV units — e.g. a desk surface roughly 4 texture-widths wide passes
 * `[4, 2]` so the wood grain reads at a believable physical scale instead of
 * one giant stretched plank.
 */
export function usePbrMaps(name: string, repeat: readonly [number, number] = [1, 1]): PbrMaps {
  const maps = useTexture({
    diff: `/textures/${name}/diff.jpg`,
    nor: `/textures/${name}/nor.jpg`,
    arm: `/textures/${name}/arm.jpg`,
  });
  // Diffuse/albedo maps are authored in sRGB; normal and ARM maps are data,
  // not color, and must stay in linear space or lighting reads wrong.
  maps.diff.colorSpace = SRGBColorSpace;
  for (const tex of [maps.diff, maps.nor, maps.arm]) {
    tex.wrapS = RepeatWrapping;
    tex.wrapT = RepeatWrapping;
    tex.repeat.set(repeat[0], repeat[1]);
  }
  return maps;
}

/** Spreads a PbrMaps set onto a <meshStandardMaterial>'s map props. Poly
 * Haven's packed "arm" texture doubles as roughnessMap AND metalnessMap at
 * once (three.js reads roughness from its G channel, metalness from B) —
 * both read from the geometry's normal `uv`. Deliberately NOT wired as an
 * aoMap too: aoMap requires a second UV channel (`uv2`) that primitive
 * geometries don't generate by default, and the AO contribution on top of
 * a real normal map is a minor gain not worth the extra per-geometry
 * uv2-wiring here.
 *
 * Callers must also pass `roughness={1} metalness={1}` on the material —
 * three.js multiplies roughnessMap/metalnessMap by those scalar props
 * (default metalness is 0), so without setting them to 1 the real map data
 * gets silently zeroed out. */
export function pbrMaterialProps(maps: PbrMaps) {
  return {
    map: maps.diff,
    normalMap: maps.nor,
    roughnessMap: maps.arm,
    metalnessMap: maps.arm,
  };
}
