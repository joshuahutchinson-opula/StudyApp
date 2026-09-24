// The camera's finite state machine. Every target is hand-placed here, once
// — never computed at runtime — per the brief's explicit instruction. Each
// state carries its own spring constants so approach states can be given a
// slower, more overshoot-prone feel than RETURN's snappier disengagement
// ("animate faster... disengagement should feel snappier than settling in").

export type CameraStateId =
  | "IDLE_WIDE"
  | "PLANNER_FOCUS"
  | "BINDER_APPROACH"
  | "WHITEBOARD_APPROACH"
  | "RECALL_APPROACH"
  | "TEXTBOOK_APPROACH"
  | "DRAWER_FOCUS"
  | "WALL_FOCUS";
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
  // Tier 4 additions. RECALL/TEXTBOOK follow BINDER_APPROACH's own delta
  // pattern (camera = object + (0, 0.70, 1.35), lookAt = object + (0, 0.50,
  // 0)) since both are desk-level objects approached the same way binder is.
  RECALL_APPROACH: {
    position: { x: 0.9, y: 1.14, z: 2.0 },
    lookAt: { x: 0.9, y: 0.94, z: 0.65 },
    fov: 38,
  },
  TEXTBOOK_APPROACH: {
    position: { x: -1.1, y: 1.16, z: 1.95 },
    lookAt: { x: -1.1, y: 0.96, z: 0.6 },
    fov: 38,
  },
  // DRAWER_FOCUS mirrors PLANNER_FOCUS's non-overlay pattern (camera moves,
  // an Html panel appears in-scene — no full-screen overlay) rather than
  // BINDER_APPROACH's, since opening a drawer is a glance-and-close
  // interaction, not a "sit down and read" one.
  DRAWER_FOCUS: {
    position: { x: 0, y: 0.75, z: 2.9 },
    lookAt: { x: 0, y: -0.25, z: 1.4 },
    fov: 42,
  },
  // Tier 7's desk/wall customization — a modest push toward the wall (not a
  // full approach like the whiteboard's, since this is a glance-and-pick
  // interaction, same non-overlay Html-panel family as PLANNER_FOCUS/
  // DRAWER_FOCUS) so the wall fills more of the frame while picking a color.
  WALL_FOCUS: {
    position: { x: 1.6, y: 1.7, z: 2.3 },
    lookAt: { x: 1.6, y: 1.9, z: -2.2 },
    fov: 46,
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
  // Tier 4 additions — placeholder positions, same as every other object
  // here, tuned by eye against the placeholder geometry rather than a design
  // reference (none exists yet for these).
  recall: { x: 0.9, y: 0.44, z: 0.65 },
  textbook: { x: -1.1, y: 0.46, z: 0.6 },
  // The drawer isn't a free object on the desk — it's built into the front
  // edge of the desk itself, hanging below the desktop surface.
  drawer: { x: 0, y: -0.18, z: 1.35 },
} as const;
