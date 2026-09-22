import type { MasteryLevel } from "@the-desk/shared";

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
  return (
    <div className="flex items-center gap-2">
      {LEVELS.map((l) => (
        <button
          key={l}
          type="button"
          title={l}
          onClick={() => onChange(l)}
          className="h-2.5 w-2.5 rounded-full transition-transform"
          style={{
            background: l === level ? LEVEL_COLOR[l] : "transparent",
            border: `1.5px solid ${LEVEL_COLOR[l]}`,
            transform: l === level ? "scale(1.3)" : "scale(1)",
          }}
        />
      ))}
      <span className="ml-1 text-xs capitalize text-[var(--color-text-muted)]">{level}</span>
    </div>
  );
}

// Dog-ear corner: tappable reviewed/unreviewed signal folded into the page's top corner.
export function DogEar({ reviewed, onToggle }: { reviewed: boolean; onToggle: () => void }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      title={reviewed ? "Mark unreviewed" : "Mark reviewed"}
      className="absolute right-0 top-0 h-8 w-8 cursor-pointer transition-opacity"
      style={{
        clipPath: "polygon(100% 0, 0 0, 100% 100%)",
        background: reviewed ? "var(--color-accent)" : "var(--color-border)",
        opacity: reviewed ? 1 : 0.5,
      }}
    />
  );
}
