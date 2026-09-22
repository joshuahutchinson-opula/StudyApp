import { DEFAULT_DISCIPLINE_SPRING, DISCIPLINE_SPRING, type DisciplineSpring } from "@the-desk/ui";
import { useDisciplineStore } from "../store/useDisciplineStore";

/** The active discipline's real spring-physics presets (base + fast). */
export function useSpring(): DisciplineSpring {
  const discipline = useDisciplineStore((s) => s.activeDiscipline);
  return discipline ? DISCIPLINE_SPRING[discipline] : DEFAULT_DISCIPLINE_SPRING;
}
