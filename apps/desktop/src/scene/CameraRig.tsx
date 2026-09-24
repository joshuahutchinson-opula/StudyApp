import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useRef } from "react";
import { Vector3 } from "three";
import { APPROACH_SPRING, CAMERA_TARGETS, RETURN_SPRING, type SpringConstants } from "./cameraStates";
import { useCameraStore } from "./useCameraStore";

// A damped-spring stepper for one scalar degree of freedom. Semi-implicit
// Euler (update velocity, then use the NEW velocity to move value) — stable
// at real frame-time steps without needing a fixed-timestep substep loop,
// which matters here since r3f's delta varies frame to frame.
function springStep(value: number, velocity: number, target: number, { stiffness, damping }: SpringConstants, dt: number) {
  const force = (target - value) * stiffness - velocity * damping;
  const nextVelocity = velocity + force * dt;
  const nextValue = value + nextVelocity * dt;
  return { value: nextValue, velocity: nextVelocity };
}

// Loose enough that the last, visually-imperceptible sliver of spring
// settling doesn't delay the overlay handoff — a tighter threshold makes
// the handoff feel laggy for no visible benefit, since nobody can see the
// difference between "arrived" and "arrived to within 5cm" on a multi-metre
// scene.
const SETTLE_DISTANCE = 0.05;
const SETTLE_SPEED = 0.15;

/**
 * Drives the actual r3f camera toward whatever CAMERA_TARGETS[state] is,
 * every frame, via real spring physics — not a one-shot tween. Because the
 * target is re-read from the store every frame rather than captured once at
 * the start of an animation, changing state mid-flight is inherently
 * interruptible: there's nothing to cancel, the spring just starts pulling
 * toward the new target from wherever it currently is. This is the
 * mechanism the brief asks for ("interruptible from any point in its
 * animation, not just from a resting state") rather than something bolted
 * on after a tween-based implementation.
 */
export function CameraRig() {
  const { camera } = useThree();
  const state = useCameraStore((s) => s.state);
  const returning = useCameraStore((s) => s.returning);
  const settleOverlay = useCameraStore((s) => s.settleOverlay);
  const skipRequested = useCameraStore((s) => s.skipRequested);

  const posVel = useRef(new Vector3());
  const lookVel = useRef(new Vector3());
  const fovVel = useRef(0);
  const currentLookAt = useRef(new Vector3(0, 1.1, 0));
  const hasSettledForThisState = useRef(false);

  // A fresh state means a fresh settle-check — otherwise an overlay would
  // mount instantly on states that happen to already be near their target.
  useEffect(() => {
    hasSettledForThisState.current = false;
  }, [state]);

  useFrame((_, rawDelta) => {
    const target = CAMERA_TARGETS[state];

    // Tier 9's skip-animation QoL feature: snap straight to the target
    // instead of spring-stepping toward it. Zeroing velocity matters as much
    // as setting position — without it the next frame's spring step would
    // read leftover velocity from mid-flight and immediately overshoot away
    // from the target it was just snapped to.
    if (skipRequested) {
      camera.position.set(target.position.x, target.position.y, target.position.z);
      posVel.current.set(0, 0, 0);
      currentLookAt.current.set(target.lookAt.x, target.lookAt.y, target.lookAt.z);
      lookVel.current.set(0, 0, 0);
      camera.lookAt(currentLookAt.current);
      if ("fov" in camera) {
        camera.fov = target.fov;
        fovVel.current = 0;
        camera.updateProjectionMatrix();
      }
      if (
        !hasSettledForThisState.current &&
        (state === "BINDER_APPROACH" ||
          state === "WHITEBOARD_APPROACH" ||
          state === "RECALL_APPROACH" ||
          state === "TEXTBOOK_APPROACH" ||
          state === "SIGNATURE_APPROACH")
      ) {
        hasSettledForThisState.current = true;
        settleOverlay();
      }
      useCameraStore.getState().clearSkip();
      return;
    }

    // Clamp delta so a dev-tools pause or tab-away doesn't fling the spring —
    // loose enough (50ms) that an ordinary slow frame doesn't put the
    // simulation in slow motion relative to wall-clock time, tight enough to
    // still guard against a multi-second stall spiking the spring.
    const dt = Math.min(rawDelta, 1 / 20);
    const spring = returning ? RETURN_SPRING : APPROACH_SPRING;

    const px = springStep(camera.position.x, posVel.current.x, target.position.x, spring, dt);
    const py = springStep(camera.position.y, posVel.current.y, target.position.y, spring, dt);
    const pz = springStep(camera.position.z, posVel.current.z, target.position.z, spring, dt);
    camera.position.set(px.value, py.value, pz.value);
    posVel.current.set(px.velocity, py.velocity, pz.velocity);

    const lx = springStep(currentLookAt.current.x, lookVel.current.x, target.lookAt.x, spring, dt);
    const ly = springStep(currentLookAt.current.y, lookVel.current.y, target.lookAt.y, spring, dt);
    const lz = springStep(currentLookAt.current.z, lookVel.current.z, target.lookAt.z, spring, dt);
    currentLookAt.current.set(lx.value, ly.value, lz.value);
    lookVel.current.set(lx.velocity, ly.velocity, lz.velocity);
    camera.lookAt(currentLookAt.current);

    if ("fov" in camera) {
      const f = springStep(camera.fov, fovVel.current, target.fov, spring, dt);
      camera.fov = f.value;
      fovVel.current = f.velocity;
      camera.updateProjectionMatrix();
    }

    // One-way approach states self-terminate into their 2D overlay once the
    // camera has actually settled — not on a fixed timer, on real arrival.
    if (
      !hasSettledForThisState.current &&
      (state === "BINDER_APPROACH" ||
        state === "WHITEBOARD_APPROACH" ||
        state === "RECALL_APPROACH" ||
        state === "TEXTBOOK_APPROACH" ||
        state === "SIGNATURE_APPROACH")
    ) {
      const posDist = camera.position.distanceTo(new Vector3(target.position.x, target.position.y, target.position.z));
      const speed = posVel.current.length();
      if (posDist < SETTLE_DISTANCE && speed < SETTLE_SPEED) {
        hasSettledForThisState.current = true;
        settleOverlay();
      }
    }
  });

  return null;
}
