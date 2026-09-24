import type { Discipline } from "@the-desk/shared";

// Tier 5's "material/prop swap": every desk object's color is now driven by
// the active discipline instead of a fixed hardcoded hex. Placeholder
// geometry means this is a color swap, not a real PBR material swap — the
// mechanism is what Tier 5 asks for, real materials arrive with real
// geometry. Primary/accent hexes below are copy-pasted from each
// discipline's CSS token file (packages/ui/src/tokens/*.css) rather than
// invented fresh, so the 3D scene's palette stays in lockstep with the 2D
// surfaces (BinderOverlay, WhiteboardOverlay's chrome, etc.) — if a token
// file's --color-primary/--color-accent ever changes, this must change too.
export interface DeskTheme {
  deskWood: string;
  wall: string;
  binder: string;
  planner: string;
  whiteboard: string;
  recall: string;
  textbook: string;
  drawerBase: string;
  drawerGlow: string;
}

export const DISCIPLINE_DESK_THEME: Record<Discipline, DeskTheme> = {
  // medicine.css: --color-primary: #0b3d4c; --color-accent: #1f7a6c;
  medicine: {
    deskWood: "#4a5a52",
    wall: "#7a95a0",
    binder: "#0b3d4c",
    planner: "#e8f0f0",
    whiteboard: "#eef0ee",
    recall: "#1f7a6c",
    textbook: "#0b3d4c",
    drawerBase: "#33403c",
    drawerGlow: "#1f7a6c",
  },
  // software.css: --color-primary: #5eead4; --color-accent: #7dd3fc;
  software: {
    deskWood: "#262b35",
    wall: "#1a1e26",
    binder: "#0f4b43",
    planner: "#dfe7ea",
    whiteboard: "#eef0ee",
    recall: "#7dd3fc",
    textbook: "#0f4b43",
    drawerBase: "#1c2029",
    drawerGlow: "#7dd3fc",
  },
  // writing.css: --color-primary: #3d3226; --color-accent: #a3512b;
  writing: {
    deskWood: "#5a4632",
    wall: "#b8916a",
    binder: "#3d3226",
    planner: "#f0e9da",
    whiteboard: "#eef0ee",
    recall: "#a3512b",
    textbook: "#3d3226",
    drawerBase: "#4a3c2c",
    drawerGlow: "#a3512b",
  },
  // engineering.css: --color-primary: #14335e; --color-accent: #2b6cb0;
  engineering: {
    deskWood: "#3d4552",
    wall: "#8a97a8",
    binder: "#14335e",
    planner: "#eef1f5",
    whiteboard: "#eef0ee",
    recall: "#2b6cb0",
    textbook: "#14335e",
    drawerBase: "#2e3644",
    drawerGlow: "#2b6cb0",
  },
  // arts.css: --color-primary: #1a1a1a; --color-accent: #c1432c;
  arts: {
    deskWood: "#2b2b2b",
    wall: "#4a4a4a",
    binder: "#1a1a1a",
    planner: "#f5f0e8",
    whiteboard: "#eef0ee",
    recall: "#c1432c",
    textbook: "#1a1a1a",
    drawerBase: "#262626",
    drawerGlow: "#c1432c",
  },
};
