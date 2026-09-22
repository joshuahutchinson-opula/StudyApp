import { motion } from "motion/react";
import type { Page } from "@the-desk/shared";
import { useSpring } from "../../hooks/useSpring";

export function ThumbnailStrip({
  pages,
  currentPageId,
  onSelect,
}: {
  pages: Page[];
  currentPageId: string | null;
  onSelect: (pageId: string) => void;
}) {
  const spring = useSpring();

  return (
    <div className="flex gap-[var(--space-2)] overflow-x-auto border-t border-[var(--color-border)] px-[var(--space-4)] py-[var(--space-3)]">
      {pages.map((page, i) => {
        const active = page.id === currentPageId;
        return (
          <motion.button
            key={page.id}
            type="button"
            onClick={() => onSelect(page.id)}
            whileTap={{ scale: 0.9 }}
            animate={{ opacity: active ? 1 : 0.65, scale: active ? 1.08 : 1, y: active ? -2 : 0 }}
            transition={spring.fast}
            className="flex h-14 w-11 shrink-0 flex-col justify-between rounded-[var(--radius-sm)] p-[var(--space-1)] text-left"
            style={{
              background: "var(--color-surface)",
              border: `1.5px solid ${active ? "var(--color-accent)" : "var(--color-border)"}`,
            }}
            title={page.title}
          >
            <span className="text-[8px] leading-tight text-[var(--color-text-muted)]">{i + 1}</span>
            <span
              className="h-1 w-full rounded-full"
              style={{ background: page.reviewed ? "var(--color-accent)" : "var(--color-border)" }}
            />
          </motion.button>
        );
      })}
    </div>
  );
}
