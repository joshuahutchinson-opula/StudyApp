// The camera's finite state machine. Every target is hand-placed here, once
// — never computed at runtime — per the brief's explicit instruction. Each
// state carries its own spring constants so approach states can be given a
// slower, more overshoot-prone feel than RETURN's snappier disengagement
// ("animate faster... disengagement should feel snappier than settling in").

export type CameraStateId = "IDLE_WIDE" | "PLANNER_FOCUS" | "BINDER_APPROACH" | "WHITEBOARD_APPROACH";
// RETURN is not a distinct resting state — it's a transition tagged onto
// whatever state IDLE_WIDE is reached through, so it can use its own (faster)
// spring constants. See useCameraStore's `returnToIdle`.

export interface Vec3 {
  x: number;
  y: number;
  z: number;
}

export interface CameraTarget {
  position: Vec3;
  lookAt: Vec3;
  fov: number;
}

export interface SpringConstants {
  stiffness: number;
  damping: number;
}

// Underdamped (damping ratio < 1) on every approach/focus state, on purpose —
// the camera should carry momentum past its resting point and ease back,
// matching the "settle" quality already established on the binder page-turn
// (real spring physics, not eased CSS-style tweens). RETURN is closer to
// critically damped: it should feel decisive, not floaty.
export const APPROACH_SPRING: SpringConstants = { stiffness: 40, damping: 9 };
export const RETURN_SPRING: SpringConstants = { stiffness: 70, damping: 16 };

export const CAMERA_TARGETS: Record<CameraStateId, CameraTarget> = {
  IDLE_WIDE: {
    position: { x: 0, y: 1.7, z: 5.2 },
    lookAt: { x: 0, y: 1.1, z: 0 },
    fov: 50,
  },
  PLANNER_FOCUS: {
    position: { x: 0.05, y: 1.35, z: 1.9 },
    lookAt: { x: 0.05, y: 0.35, z: 0.4 },
    fov: 42,
  },
  BINDER_APPROACH: {
    position: { x: -1.55, y: 1.15, z: 0.95 },
    lookAt: { x: -1.55, y: 0.95, z: -0.4 },
    fov: 38,
  },
  WHITEBOARD_APPROACH: {
    position: { x: 0, y: 1.5, z: 1.15 },
    lookAt: { x: 0, y: 1.55, z: -2.1 },
    fov: 44,
  },
};

// Which desk objects live at which resting spots — placeholder geometry uses
// these directly; real geometry (Tier 2+) will too, so the layout only lives
// in one place.
export const OBJECT_LAYOUT = {
  desk: { x: 0, y: 0, z: 0.3 },
  wall: { x: 0, y: 2.2, z: -2.2 },
  binder: { x: -1.55, y: 0.45, z: -0.4 },
  planner: { x: 0.05, y: 0.42, z: 0.35 },
  whiteboard: { x: 0, y: 1.55, z: -2.15 },
  timer: { x: 1.3, y: 0.5, z: 0.1 },
  lamp: { x: -0.9, y: 0.95, z: 0.75 },
} as const;
