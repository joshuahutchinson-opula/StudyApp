import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import { Color, type DirectionalLight } from "three";
import { OBJECT_LAYOUT } from "./cameraStates";

// Tier 9's "lighting drift" QoL/aesthetic feature: the lamp's warmth and
// brightness drift over the real time of day instead of sitting at one
// fixed value forever. Anchors at four points in a 24h cycle; color and
// intensity are linearly interpolated between whichever two anchors bracket
// the current real hour, recomputed a few times a second rather than every
// frame (a light's color visibly changing 60x/sec would read as flicker,
// not drift).
const ANCHORS: { hour: number; color: string; intensity: number }[] = [
  { hour: 0, color: "#5a76a5", intensity: 0.9 }, // deep night — cool, dim
  { hour: 6, color: "#ffd9a0", intensity: 1.7 }, // early morning — soft warm
  { hour: 13, color: "#fff2d9", intensity: 2.4 }, // midday — brightest, near-neutral
  { hour: 19, color: "#ffb347", intensity: 2.2 }, // evening — the original warm amber
  { hour: 24, color: "#5a76a5", intensity: 0.9 }, // wraps back to night
];

function currentHourFraction(): number {
  const now = new Date();
  return now.getHours() + now.getMinutes() / 60;
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

function sampleAnchors(hour: number): { color: Color; intensity: number } {
  for (let i = 0; i < ANCHORS.length - 1; i++) {
    const a = ANCHORS[i]!;
    const b = ANCHORS[i + 1]!;
    if (hour >= a.hour && hour <= b.hour) {
      const t = (hour - a.hour) / (b.hour - a.hour);
      const colorA = new Color(a.color);
      const colorB = new Color(b.color);
      return {
        color: colorA.lerp(colorB, t),
        intensity: lerp(a.intensity, b.intensity, t),
      };
    }
  }
  // Shouldn't happen (0-24 is fully covered), but keep TypeScript happy and
  // degrade to the first anchor rather than throwing.
  return { color: new Color(ANCHORS[0]!.color), intensity: ANCHORS[0]!.intensity };
}

const RECHECK_INTERVAL_S = 5;

export function LampLightDrift() {
  const lightRef = useRef<DirectionalLight>(null);
  const elapsed = useRef(0);

  useFrame((_, delta) => {
    elapsed.current += delta;
    if (elapsed.current < RECHECK_INTERVAL_S) return;
    elapsed.current = 0;
    const light = lightRef.current;
    if (!light) return;
    const { color, intensity } = sampleAnchors(currentHourFraction());
    light.color.copy(color);
    light.intensity = intensity;
  });

  return (
    <directionalLight
      ref={lightRef}
      position={[OBJECT_LAYOUT.lamp.x, OBJECT_LAYOUT.lamp.y + 0.4, OBJECT_LAYOUT.lamp.z + 0.2]}
      intensity={2.2}
      color="#ffb347"
      castShadow
      shadow-mapSize={[1024, 1024]}
    />
  );
}
