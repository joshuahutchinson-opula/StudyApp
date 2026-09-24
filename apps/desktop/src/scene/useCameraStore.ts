import { create } from "zustand";
import type { CameraStateId } from "./cameraStates";

export type OverlayId = "binder" | "whiteboard" | "recall" | "textbook" | "signature" | null;

interface CameraHistoryEntry {
  state: CameraStateId;
  binderId: string | null;
}

interface CameraStore {
  state: CameraStateId;
  /** Set only while a RETURN transition is in flight — the rig reads this to
   * pick RETURN_SPRING instead of APPROACH_SPRING for this one hop. */
  returning: boolean;
  binderId: string | null;
  /** Which 2D overlay is mounted full-screen, if any. Approach states are
   * one-way/self-terminating: the rig sets this once the camera settles. */
  overlay: OverlayId;
  /** Local history stack for camera moves — the seam section 2 calls for
   * ("its own history stack as part of the universal undo system"). Tier 3
   * folds this into the app-wide undo manager; until then it stands alone. */
  history: CameraHistoryEntry[];
  /** Timestamp of the last history-pushing action — read by the Tier 3
   * global undo router (undoRouter.ts) to decide whether a Ctrl+Z should
   * undo camera navigation or a task edit, whichever happened more recently. */
  lastActionAt: number | null;
  goToPlanner: () => void;
  goToBinder: (binderId: string) => void;
  goToWhiteboard: () => void;
  goToRecall: () => void;
  goToTextbook: () => void;
  goToDrawer: () => void;
  goToWall: () => void;
  goToSignature: () => void;
  settleOverlay: () => void;
  closeOverlay: () => void;
  undo: () => void;
}

const MAX_HISTORY = 20;

export const useCameraStore = create<CameraStore>((set, get) => ({
  state: "IDLE_WIDE",
  returning: false,
  binderId: null,
  overlay: null,
  history: [],
  lastActionAt: null,

  goToPlanner: () => {
    const { state, binderId, history } = get();
    set({
      state: "PLANNER_FOCUS",
      returning: false,
      binderId: null,
      overlay: null,
      history: [...history, { state, binderId }].slice(-MAX_HISTORY),
      lastActionAt: Date.now(),
    });
  },

  goToBinder: (id) => {
    const { state, binderId, history } = get();
    set({
      state: "BINDER_APPROACH",
      returning: false,
      binderId: id,
      overlay: null,
      history: [...history, { state, binderId }].slice(-MAX_HISTORY),
      lastActionAt: Date.now(),
    });
  },

  goToWhiteboard: () => {
    const { state, binderId, history } = get();
    set({
      state: "WHITEBOARD_APPROACH",
      returning: false,
      binderId: null,
      overlay: null,
      history: [...history, { state, binderId }].slice(-MAX_HISTORY),
      lastActionAt: Date.now(),
    });
  },

  goToRecall: () => {
    const { state, binderId, history } = get();
    set({
      state: "RECALL_APPROACH",
      returning: false,
      binderId: null,
      overlay: null,
      history: [...history, { state, binderId }].slice(-MAX_HISTORY),
      lastActionAt: Date.now(),
    });
  },

  goToTextbook: () => {
    const { state, binderId, history } = get();
    set({
      state: "TEXTBOOK_APPROACH",
      returning: false,
      binderId: null,
      overlay: null,
      history: [...history, { state, binderId }].slice(-MAX_HISTORY),
      lastActionAt: Date.now(),
    });
  },

  // DRAWER_FOCUS is a PLANNER_FOCUS-style non-overlay state — no settleOverlay
  // handoff, an Html panel just renders once this state is active.
  goToDrawer: () => {
    const { state, binderId, history } = get();
    set({
      state: "DRAWER_FOCUS",
      returning: false,
      binderId: null,
      overlay: null,
      history: [...history, { state, binderId }].slice(-MAX_HISTORY),
      lastActionAt: Date.now(),
    });
  },

  goToWall: () => {
    const { state, binderId, history } = get();
    set({
      state: "WALL_FOCUS",
      returning: false,
      binderId: null,
      overlay: null,
      history: [...history, { state, binderId }].slice(-MAX_HISTORY),
      lastActionAt: Date.now(),
    });
  },

  goToSignature: () => {
    const { state, binderId, history } = get();
    set({
      state: "SIGNATURE_APPROACH",
      returning: false,
      binderId: null,
      overlay: null,
      history: [...history, { state, binderId }].slice(-MAX_HISTORY),
      lastActionAt: Date.now(),
    });
  },

  // Fired by CameraRig once an approach state's camera has actually settled
  // at its target — the one-way/self-terminating handoff into the 2D overlay.
  settleOverlay: () => {
    const { state } = get();
    if (state === "BINDER_APPROACH") set({ overlay: "binder" });
    else if (state === "WHITEBOARD_APPROACH") set({ overlay: "whiteboard" });
    else if (state === "RECALL_APPROACH") set({ overlay: "recall" });
    else if (state === "TEXTBOOK_APPROACH") set({ overlay: "textbook" });
    else if (state === "SIGNATURE_APPROACH") set({ overlay: "signature" });
  },

  // Closing an overlay (or clicking away) reverses to IDLE_WIDE, faster than
  // the approach that got here.
  closeOverlay: () => {
    const { state, binderId, history } = get();
    set({
      state: "IDLE_WIDE",
      returning: true,
      binderId: null,
      overlay: null,
      history: [...history, { state, binderId }].slice(-MAX_HISTORY),
      lastActionAt: Date.now(),
    });
  },

  // A misclick into the wrong object — pop the last entry and go back to it,
  // via RETURN's faster spring (undoing a navigation should feel like
  // backing out, not like a fresh approach).
  undo: () => {
    const { history } = get();
    if (history.length === 0) return;
    const prev = history[history.length - 1]!;
    set({
      state: prev.state,
      binderId: prev.binderId,
      returning: true,
      overlay: null,
      history: history.slice(0, -1),
      lastActionAt: Date.now(),
    });
  },
}));
