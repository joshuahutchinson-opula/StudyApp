import { motion } from "motion/react";
import type { MasteryLevel } from "@the-desk/shared";
import { useSpring } from "../../hooks/useSpring";

const LEVELS: MasteryLevel[] = ["unfamiliar", "learning", "familiar", "mastered"];

const LEVEL_COLOR: Record<MasteryLevel, string> = {
  unfamiliar: "#a1a1aa",
  learning: "#eab308",
  familiar: "#3b82f6",
  mastered: "#22c55e",
};

export function MasteryControl({
  level,
  onChange,
}: {
  level: MasteryLevel;
  onChange: (level: MasteryLevel) => void;
}) {
  const spring = useSpring();

  return (
    <div className="flex items-center gap-[var(--space-2)]">
      {LEVELS.map((l) => (
        <motion.button
          key={l}
          type="button"
          title={l}
          onClick={() => onChange(l)}
          whileTap={{ scale: 0.85 }}
          animate={{ scale: l === level ? 1.3 : 1 }}
          transition={spring.base}
          className="h-2.5 w-2.5 rounded-full"
          style={{
            background: l === level ? LEVEL_COLOR[l] : "transparent",
            border: `1.5px solid ${LEVEL_COLOR[l]}`,
          }}
        />
      ))}
      <span className="ml-[var(--space-1)] text-xs capitalize text-[var(--color-text-muted)]">{level}</span>
    </div>
  );
}

// Dog-ear corner: tappable reviewed/unreviewed signal folded into the page's top corner.
export function DogEar({ reviewed, onToggle }: { reviewed: boolean; onToggle: () => void }) {
  const spring = useSpring();

  return (
    <motion.button
      type="button"
      onClick={onToggle}
      title={reviewed ? "Mark unreviewed" : "Mark reviewed"}
      whileTap={{ scale: 0.8 }}
      animate={{ opacity: reviewed ? 1 : 0.5, scale: reviewed ? 1 : 0.92 }}
      transition={spring.base}
      className="absolute right-0 top-0 h-8 w-8 cursor-pointer"
      style={{
        clipPath: "polygon(100% 0, 0 0, 100% 100%)",
        background: reviewed ? "var(--color-accent)" : "var(--color-border)",
      }}
    />
  );
}
