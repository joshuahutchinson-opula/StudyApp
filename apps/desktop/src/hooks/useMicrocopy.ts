import { MICROCOPY, type MicrocopyKey } from "@the-desk/shared";
import { useDisciplineStore } from "../store/useDisciplineStore";

/** The active discipline's flavor of a system-message string, for inline use. */
export function useMicrocopy(key: MicrocopyKey): string {
  const discipline = useDisciplineStore((s) => s.activeDiscipline);
  return MICROCOPY[discipline ?? "medicine"][key];
}
