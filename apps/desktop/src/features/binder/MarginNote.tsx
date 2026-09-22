import { useState } from "react";
import { generateStudyPrompt, type MarginAnnotation } from "@the-desk/shared";
import { SpringButton } from "../../components/SpringButton";
import { useDisciplineStore } from "../../store/useDisciplineStore";

export function MarginNote({
  annotations,
  onAdd,
}: {
  annotations: MarginAnnotation[];
  onAdd: (body: string) => void;
}) {
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState("");
  const discipline = useDisciplineStore((s) => s.activeDiscipline) ?? "medicine";

  return (
    <div className="flex flex-col gap-[var(--space-1)] pt-[var(--space-1)]">
      {annotations.map((a) => (
        <div key={a.id} className="flex flex-col gap-[var(--space-1)]">
          <p
            className="rounded-[var(--radius-sm)] px-[var(--space-2)] py-[var(--space-1)] text-xs leading-snug"
            style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)" }}
          >
            {a.body}
          </p>
          {/* The co-annotator: a second, clearly-labeled voice beside your own
              note — a built-in study prompt, not AI (none is wired up yet) and
              not another person. Deterministic per note, so it doesn't shuffle
              on every render. */}
          <div
            className="ml-[var(--space-2)] rounded-[var(--radius-sm)] px-[var(--space-2)] py-[var(--space-1)] text-xs leading-snug"
            style={{ borderLeft: "2px solid var(--color-accent)", color: "var(--color-text-muted)" }}
          >
            <span className="uppercase tracking-wide" style={{ fontSize: "9px", opacity: 0.7 }}>
              Study prompt
            </span>
            <p>{generateStudyPrompt(discipline, a.body)}</p>
          </div>
        </div>
      ))}

      {adding ? (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!draft.trim()) return;
            onAdd(draft.trim());
            setDraft("");
            setAdding(false);
          }}
          className="flex flex-col gap-[var(--space-1)]"
        >
          <textarea
            autoFocus
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              // Textareas don't submit their form on Enter by default (Enter
              // means newline) — Shift+Enter still inserts a newline, plain
              // Enter saves, matching the convention most note UIs use.
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                e.currentTarget.form?.requestSubmit();
              }
              if (e.key === "Escape") setAdding(false);
            }}
            onBlur={() => {
              if (!draft.trim()) setAdding(false);
            }}
            rows={2}
            placeholder="Margin note… (Enter to save)"
            className="w-full resize-none rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-transparent px-[var(--space-2)] py-[var(--space-1)] text-xs focus:outline-none"
          />
        </form>
      ) : (
        <SpringButton
          type="button"
          onClick={() => setAdding(true)}
          className="self-start text-xs text-[var(--color-text-muted)] opacity-60 hover:text-[var(--color-text)] hover:opacity-100"
        >
          + note
        </SpringButton>
      )}
    </div>
  );
}
