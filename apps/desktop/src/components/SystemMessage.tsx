import { MICROCOPY, type MicrocopyKey } from "@the-desk/shared";
import { useDisciplineStore } from "../store/useDisciplineStore";

// Renders one of the small loading/empty/status strings every screen shows
// constantly, in the active discipline's own voice instead of a single
// generic string reused everywhere. Falls back to Medicine's copy before a
// discipline is chosen (same default useSpring uses for motion).
export function SystemMessage({
  msgKey,
  className = "text-sm text-[var(--color-text-muted)]",
}: {
  msgKey: MicrocopyKey;
  className?: string;
}) {
  const discipline = useDisciplineStore((s) => s.activeDiscipline);
  const text = MICROCOPY[discipline ?? "medicine"][msgKey];
  return <p className={className}>{text}</p>;
}
