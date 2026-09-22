import type { Discipline } from "@the-desk/shared";

export interface SpringConfig {
  type: "spring";
  stiffness: number;
  damping: number;
  mass: number;
}

export interface DisciplineSpring {
  /** Larger movements: page turns, card flips, shared-layout indicators. */
  base: SpringConfig;
  /** Small taps/presses/hovers — dots, buttons, thumbnails. */
  fast: SpringConfig;
}

// Real mass/stiffness/damping springs, not eased-duration curves — every value
// here is underdamped (damping ratio < 1) on purpose, so motion overshoots and
// settles the way physical objects do, in keeping with each discipline's
// existing motion personality (see packages/ui/src/tokens/*.css). Engineering
// and Medicine stay tight and barely overshoot (precision, control); Arts is
// the most expressive/bouncy; Software is fastest; Writing sits in between.
export const DISCIPLINE_SPRING: Record<Discipline, DisciplineSpring> = {
  medicine: {
    base: { type: "spring", stiffness: 420, damping: 32, mass: 0.9 },
    fast: { type: "spring", stiffness: 520, damping: 28, mass: 0.6 },
  },
  software: {
    base: { type: "spring", stiffness: 500, damping: 30, mass: 0.7 },
    fast: { type: "spring", stiffness: 600, damping: 26, mass: 0.5 },
  },
  writing: {
    base: { type: "spring", stiffness: 260, damping: 24, mass: 1 },
    fast: { type: "spring", stiffness: 380, damping: 24, mass: 0.7 },
  },
  engineering: {
    base: { type: "spring", stiffness: 480, damping: 40, mass: 1 },
    fast: { type: "spring", stiffness: 560, damping: 34, mass: 0.6 },
  },
  arts: {
    base: { type: "spring", stiffness: 220, damping: 14, mass: 1 },
    fast: { type: "spring", stiffness: 340, damping: 16, mass: 0.7 },
  },
};

export const DEFAULT_DISCIPLINE_SPRING: DisciplineSpring = DISCIPLINE_SPRING.medicine;
