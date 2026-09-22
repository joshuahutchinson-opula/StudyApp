import { useState } from "react";
import { useBinder } from "../binder/api";
import { usePageRevisions, useRestoreRevision } from "./api";
import type { Block } from "@the-desk/shared";

function excerpt(blocks: Block[], max = 140): string {
  const text = blocks
    .map((b) => ("text" in b ? b.text : "items" in b ? b.items.join(" ") : ""))
    .join(" ")
    .trim();
  return text.length > max ? `${text.slice(0, max)}…` : text || "(empty)";
}

function relativeTime(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  const mins = Math.round(ms / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.round(hours / 24)}d ago`;
}

function PageTimeline({ pageId, currentContent }: { pageId: string; currentContent: Block[] }) {
  const { data: revisions, isLoading } = usePageRevisions(pageId);
  const restore = useRestoreRevision(pageId);
  const [restoredId, setRestoredId] = useState<string | null>(null);

  return (
    <div className="flex flex-col gap-3">
      <div className="rounded-[var(--radius-base)] border-2 px-4 py-3" style={{ borderColor: "var(--color-accent)" }}>
        <p className="text-xs font-medium uppercase tracking-wide" style={{ color: "var(--color-accent)" }}>
          Current
        </p>
        <p className="mt-1 text-sm text-[var(--color-text)]">{excerpt(currentContent)}</p>
      </div>

      {isLoading ? (
        <p className="text-sm text-[var(--color-text-muted)]">Loading history…</p>
      ) : revisions && revisions.length > 0 ? (
        <ul className="flex flex-col gap-3 border-l-2 pl-4" style={{ borderColor: "var(--color-border)" }}>
          {revisions.map((rev) => (
            <li key={rev.id} className="relative">
              <span
                aria-hidden
                className="absolute -left-[21px] top-1.5 h-2.5 w-2.5 rounded-full"
                style={{ background: "var(--color-border)" }}
              />
              <div className="rounded-[var(--radius-base)] border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3">
                <div className="flex items-center justify-between">
                  <p className="text-xs text-[var(--color-text-muted)]">{relativeTime(rev.createdAt)}</p>
                  <button
                    type="button"
                    onClick={() => {
                      restore.mutate(rev.id);
                      setRestoredId(rev.id);
                    }}
                    className="text-xs"
                    style={{ color: "var(--color-accent)" }}
                  >
                    {restoredId === rev.id && restore.isPending ? "Restoring…" : "Rewind to here"}
                  </button>
                </div>
                <p className="mt-1 text-sm text-[var(--color-text)]">{excerpt(rev.content)}</p>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-[var(--color-text-muted)]">
          No earlier drafts yet — history builds up automatically as you edit this page.
        </p>
      )}
    </div>
  );
}

export function ManuscriptTimeline({ binderId }: { binderId: string }) {
  const { data: binder, isLoading } = useBinder(binderId);
  const [selectedPageId, setSelectedPageId] = useState<string | null>(null);

  if (isLoading || !binder) {
    return <div className="p-10 text-sm text-[var(--color-text-muted)]">Loading…</div>;
  }

  const pages = [...binder.pages].sort((a, b) => a.order - b.order);
  const selectedPage = pages.find((p) => p.id === selectedPageId) ?? pages[0];

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6 px-4 py-6">
      <div>
        <p className="mb-1 text-xs uppercase tracking-wide text-[var(--color-text-muted)]">
          Manuscript timeline
        </p>
        <h1 className="text-2xl" style={{ fontFamily: "var(--font-display)" }}>
          Draft evolution, with rewind
        </h1>
      </div>

      <div className="flex flex-wrap gap-2">
        {pages.map((p) => (
          <button
            key={p.id}
            type="button"
            onClick={() => setSelectedPageId(p.id)}
            className="rounded-full border px-3 py-1 text-sm"
            style={{
              borderColor: p.id === selectedPage?.id ? "var(--color-accent)" : "var(--color-border)",
              color: p.id === selectedPage?.id ? "var(--color-accent)" : "var(--color-text-muted)",
            }}
          >
            {p.title}
          </button>
        ))}
      </div>

      {selectedPage ? (
        <PageTimeline key={selectedPage.id} pageId={selectedPage.id} currentContent={selectedPage.content} />
      ) : (
        <p className="text-sm text-[var(--color-text-muted)]">No pages yet.</p>
      )}
    </div>
  );
}
