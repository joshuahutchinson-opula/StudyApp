// Tier 9's rearrangeable desk. Scoped to objects with NO dedicated camera-
// approach state — currently just the timer — because every approach
// state's camera target is hand-placed and fixed per the brief ("never
// computed at runtime"; see cameraStates.ts), so an object that HAS one
// can't be freely repositioned without desyncing the camera's framing from
// where the object actually sits. The timer has no approach state at all
// (see TimerObject.tsx) — IDLE_WIDE is a fixed wide shot regardless of
// exactly where within the desk surface it sits — so it's the one object
// that's actually safe to move.
export const TIMER_SLOTS: readonly { x: number; z: number }[] = [
  { x: 1.3, z: 0.1 }, // default
  { x: 0.95, z: 0.35 },
  { x: 1.8, z: -0.25 },
];

export function resolveTimerSlot(slotIndex: number | undefined): { x: number; z: number } {
  return TIMER_SLOTS[slotIndex ?? 0] ?? TIMER_SLOTS[0]!;
}
