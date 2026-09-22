import type { Page } from "@the-desk/shared";

export function ThumbnailStrip({
  pages,
  currentPageId,
  onSelect,
}: {
  pages: Page[];
  currentPageId: string | null;
  onSelect: (pageId: string) => void;
}) {
  return (
    <div className="flex gap-2 overflow-x-auto border-t border-[var(--color-border)] px-4 py-3">
      {pages.map((page, i) => {
        const active = page.id === currentPageId;
        return (
          <button
            key={page.id}
            type="button"
            onClick={() => onSelect(page.id)}
            className="flex h-14 w-11 shrink-0 flex-col justify-between rounded-sm p-1.5 text-left transition-opacity"
            style={{
              background: "var(--color-surface)",
              border: `1.5px solid ${active ? "var(--color-accent)" : "var(--color-border)"}`,
              opacity: active ? 1 : 0.65,
            }}
            title={page.title}
          >
            <span className="text-[8px] leading-tight text-[var(--color-text-muted)]">{i + 1}</span>
            <span
              className="h-1 w-full rounded-full"
              style={{ background: page.reviewed ? "var(--color-accent)" : "var(--color-border)" }}
            />
          </button>
        );
      })}
    </div>
  );
}
