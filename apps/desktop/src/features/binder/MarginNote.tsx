import { useState } from "react";
import type { MarginAnnotation } from "@the-desk/shared";

export function MarginNote({
  annotations,
  onAdd,
}: {
  annotations: MarginAnnotation[];
  onAdd: (body: string) => void;
}) {
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState("");

  return (
    <div className="flex flex-col gap-1.5 pt-1">
      {annotations.map((a) => (
        <p
          key={a.id}
          className="rounded-sm px-2 py-1.5 text-xs leading-snug"
          style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)" }}
        >
          {a.body}
        </p>
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
          className="flex flex-col gap-1"
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
            className="w-full resize-none rounded-sm border border-[var(--color-border)] bg-transparent px-2 py-1 text-xs focus:outline-none"
          />
        </form>
      ) : (
        <button
          type="button"
          onClick={() => setAdding(true)}
          className="self-start text-xs text-[var(--color-text-muted)] opacity-60 hover:text-[var(--color-text)] hover:opacity-100"
        >
          + note
        </button>
      )}
    </div>
  );
}
