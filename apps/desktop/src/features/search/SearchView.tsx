import { useEffect, useState } from "react";
import type { Discipline } from "@the-desk/shared";
import { useSearch } from "./api";
import type { SearchResult } from "./types";

const KIND_LABEL: Record<SearchResult["kind"], string> = {
  note: "Note",
  task: "Task",
  flashcard: "Flashcard",
  citation: "Citation",
};

export function SearchView({
  userId,
  discipline,
  onOpenPage,
}: {
  userId: string;
  discipline: Discipline;
  onOpenPage: (pageId: string) => void;
}) {
  const [input, setInput] = useState("");
  const [debounced, setDebounced] = useState("");

  useEffect(() => {
    const t = setTimeout(() => setDebounced(input), 250);
    return () => clearTimeout(t);
  }, [input]);

  const { data: results, isFetching } = useSearch(userId, discipline, debounced);

  return (
    <div className="mx-auto max-w-2xl px-4 py-6">
      <h1 className="mb-4 text-2xl" style={{ fontFamily: "var(--font-display)" }}>
        Search
      </h1>
      <input
        autoFocus
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder="Search notes, tasks, flashcards, citations…"
        className="w-full rounded-[var(--radius-base)] border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-2.5 text-sm focus:outline-none"
      />
      <p className="mt-2 text-xs text-[var(--color-text-muted)]">
        Keyword match within {discipline} — exact substring, not semantic.
      </p>

      <div className="mt-6 flex flex-col gap-2">
        {isFetching && <p className="text-sm text-[var(--color-text-muted)]">Searching…</p>}
        {!isFetching && debounced && results?.length === 0 && (
          <p className="text-sm text-[var(--color-text-muted)]">No matches for "{debounced}".</p>
        )}
        {results?.map((r) => (
          <button
            key={`${r.kind}-${r.id}`}
            type="button"
            onClick={() => r.pageId && onOpenPage(r.pageId)}
            disabled={!r.pageId}
            className="flex flex-col gap-1 rounded-[var(--radius-base)] border border-[var(--color-border)] bg-[var(--color-surface)] p-3 text-left disabled:cursor-default"
          >
            <div className="flex items-center gap-2">
              <span
                className="rounded-full px-2 py-0.5 text-xs"
                style={{ background: "var(--color-bg)", color: "var(--color-text-muted)" }}
              >
                {KIND_LABEL[r.kind]}
              </span>
              <span className="text-sm font-medium">{r.title}</span>
            </div>
            <p className="text-xs text-[var(--color-text-muted)]">{r.snippet}</p>
          </button>
        ))}
      </div>
    </div>
  );
}
