import { useMemo, useState } from "react";
import { DndContext, useDraggable, useDroppable, type DragEndEvent } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { motion } from "motion/react";
import type { Discipline, TextbookChapter } from "@the-desk/shared";
import { useTextbook } from "../features/textbook/api";
import { useBinders, useBinder, useCreatePage, useUpdatePageContent } from "../features/binder/api";
import { PageContent } from "../features/binder/PageContent";

function DraggableChapterCard({ chapter, active }: { chapter: TextbookChapter; active: boolean }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: chapter.id });
  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      style={{
        transform: CSS.Translate.toString(transform),
        opacity: isDragging ? 0.4 : 1,
        cursor: "grab",
      }}
      className="rounded-[var(--radius-sm)] border px-[var(--space-3)] py-[var(--space-2)] text-sm"
      data-active={active}
    >
      {chapter.title}
    </div>
  );
}

function DroppableTab({
  tab,
  justFiled,
}: {
  tab: { id: string; label: string; color: string };
  justFiled: boolean;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: tab.id });
  return (
    <div
      ref={setNodeRef}
      className="flex items-center gap-[var(--space-2)] rounded-[var(--radius-sm)] border px-[var(--space-3)] py-[var(--space-2)] text-sm"
      style={{
        borderColor: isOver ? "var(--color-accent)" : "var(--color-border)",
        background: isOver ? "var(--color-surface)" : "transparent",
      }}
    >
      <span className="h-2 w-2 rounded-full" style={{ background: tab.color }} />
      {tab.label}
      {justFiled && <span style={{ color: "var(--color-accent)", marginLeft: "auto" }}>Filed ✓</span>}
    </div>
  );
}

/**
 * Tier 4's "textbook-as-object" + "drag-to-file": a read-only reference
 * textbook (distinct from the user's own Binder) with a drag-and-drop way to
 * copy a chapter into your own notes — drag a chapter card onto one of your
 * binder's tabs to file a real, editable copy of it there.
 *
 * Both panes live in ONE overlay (rather than a cross-overlay drag between
 * this and BinderOverlay) specifically so the drag interaction has a single
 * DndContext to work within — BinderOverlay and this overlay are mutually
 * exclusive full-screen views, so there's no way to have both open to drag
 * between them.
 */
export function TextbookOverlay({
  userId,
  discipline,
  onClose,
}: {
  userId: string;
  discipline: Discipline;
  onClose: () => void;
}) {
  const { data: textbook, isLoading, isError } = useTextbook(discipline);
  const { data: binders } = useBinders(userId);
  const binder = binders?.find((b) => b.discipline === discipline);
  const { data: binderDetail } = useBinder(binder?.id);
  const createPage = useCreatePage(binder?.id ?? "");
  const updateContent = useUpdatePageContent(binder?.id);

  const chapters = useMemo(() => textbook?.chapters ?? [], [textbook]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = chapters.find((c) => c.id === selectedId) ?? chapters[0];
  const [justFiledTab, setJustFiledTab] = useState<string | null>(null);

  async function fileToTab(chapter: TextbookChapter, tabDividerId: string) {
    const page = await createPage.mutateAsync({ tabDividerId, title: `${chapter.title} (from ${textbook?.title})` });
    // Regenerate block ids so a filed copy never shares ids with the
    // original chapter — annotations/edits on one must never touch the other.
    const content = chapter.content.map((block) => ({ ...block, id: crypto.randomUUID() }));
    await updateContent.mutateAsync({ pageId: (page as { id: string }).id, content });
    setJustFiledTab(tabDividerId);
    setTimeout(() => setJustFiledTab((t) => (t === tabDividerId ? null : t)), 2000);
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over) return;
    const chapter = chapters.find((c) => c.id === String(active.id));
    if (!chapter) return;
    void fileToTab(chapter, String(over.id));
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.35 }}
      style={{ position: "fixed", inset: 0, background: "var(--color-bg)", zIndex: 20, overflow: "auto" }}
    >
      <button
        type="button"
        onClick={onClose}
        className="fixed rounded-full px-3 py-1.5 text-xs"
        style={{ left: 16, bottom: 16, zIndex: 21, background: "rgba(15,32,39,.7)", color: "#f3efe6" }}
      >
        ‹ Back to desk
      </button>

      {isLoading ? (
        <div className="p-10 text-sm text-[var(--color-text-muted)]">Loading…</div>
      ) : isError || !textbook ? (
        <div className="mx-auto flex max-w-2xl flex-col justify-center px-6 py-20">
          <h1 className="text-3xl" style={{ fontFamily: "var(--font-display)" }}>
            No textbook yet
          </h1>
          <p className="mt-4 text-sm text-[var(--color-text-muted)]">
            This discipline doesn't have reference material seeded yet.
          </p>
        </div>
      ) : (
        <DndContext onDragEnd={handleDragEnd}>
          <div className="mx-auto grid h-full max-w-6xl gap-[var(--space-5)] px-[var(--space-4)] py-[var(--space-5)]" style={{ gridTemplateColumns: "220px 1fr 260px" }}>
            <div className="flex flex-col gap-[var(--space-2)]">
              <p className="mb-[var(--space-2)] text-xs uppercase tracking-wide text-[var(--color-text-muted)]">
                {textbook.title}
              </p>
              <p className="mb-[var(--space-3)] text-xs text-[var(--color-text-muted)]">by {textbook.author}</p>
              {chapters.map((ch) => (
                <button
                  key={ch.id}
                  type="button"
                  onClick={() => setSelectedId(ch.id)}
                  className="rounded-[var(--radius-sm)] px-[var(--space-3)] py-[var(--space-2)] text-left text-sm hover:text-[var(--color-accent)]"
                  style={{
                    background: selected?.id === ch.id ? "var(--color-surface)" : "transparent",
                    fontWeight: selected?.id === ch.id ? "var(--font-weight-body)" : "normal",
                  }}
                >
                  {ch.title}
                </button>
              ))}
            </div>

            <div className="flex flex-col gap-[var(--space-5)] overflow-auto">
              {selected && (
                <>
                  <h1 className="text-2xl" style={{ fontFamily: "var(--font-display)" }}>
                    {selected.title}
                  </h1>
                  <PageContent blocks={selected.content} />
                  <div className="mt-[var(--space-3)]">
                    <p className="mb-[var(--space-2)] text-xs uppercase tracking-wide text-[var(--color-text-muted)]">
                      Drag this chapter to a tab on the right to file a copy →
                    </p>
                    <DraggableChapterCard chapter={selected} active />
                  </div>
                </>
              )}
            </div>

            <div className="flex flex-col gap-[var(--space-2)]">
              <p className="mb-[var(--space-2)] text-xs uppercase tracking-wide text-[var(--color-text-muted)]">
                File to your binder
              </p>
              {!binder || !binderDetail ? (
                <p className="text-sm text-[var(--color-text-muted)]">No binder to file into yet.</p>
              ) : (
                binderDetail.tabDividers.map((tab) => (
                  <DroppableTab key={tab.id} tab={tab} justFiled={justFiledTab === tab.id} />
                ))
              )}
            </div>
          </div>
        </DndContext>
      )}
    </motion.div>
  );
}
