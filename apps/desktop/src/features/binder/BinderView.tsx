import { useEffect, useMemo, useState } from "react";
import { DndContext, type DragEndEvent } from "@dnd-kit/core";
import { SortableContext, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { motion } from "motion/react";
import type { Discipline } from "@the-desk/shared";
import { SpringButton } from "../../components/SpringButton";
import { useSpring } from "../../hooks/useSpring";
import {
  useAddAnnotation,
  useBinder,
  useCreatePage,
  useReorderPages,
  useUpdatePage,
  useUpdatePageContent,
} from "./api";
import { useDueCards } from "../review/api";
import { useCitations } from "../citations/api";
import { PageTurn } from "./PageTurn";
import { PageContent } from "./PageContent";
import { TabRail } from "./TabRail";
import { ThumbnailStrip } from "./ThumbnailStrip";
import { MasteryControl, DogEar } from "./MasteryControl";

type DisplayItem = { type: "toc" } | { type: "page"; pageId: string };

export function BinderView({
  userId,
  binderId,
  discipline,
  initialPageId,
  onOpenReview,
}: {
  userId: string;
  binderId: string;
  discipline: Discipline;
  /** Jump straight to this page on mount — e.g. arriving from a graph node click. */
  initialPageId?: string;
  onOpenReview: () => void;
}) {
  const { data: binder, isLoading } = useBinder(binderId);
  const updatePage = useUpdatePage(binderId);
  const addAnnotation = useAddAnnotation(binderId);
  const createPage = useCreatePage(binderId);
  const reorderPages = useReorderPages(binderId);
  const updateContent = useUpdatePageContent(binderId);
  const { data: dueCards } = useDueCards(userId, discipline);
  const { data: citations } = useCitations(userId, discipline);
  const [index, setIndex] = useState(0);
  const [navDirection, setNavDirection] = useState<1 | -1 | 0>(0);

  const pages = useMemo(
    () => (binder ? [...binder.pages].sort((a, b) => a.order - b.order) : []),
    [binder],
  );

  const items: DisplayItem[] = useMemo(
    () => [{ type: "toc" }, ...pages.map((p) => ({ type: "page" as const, pageId: p.id }))],
    [pages],
  );

  useEffect(() => {
    if (!initialPageId) return;
    const target = items.findIndex((item) => item.type === "page" && item.pageId === initialPageId);
    if (target >= 0) setIndex(target);
    // Only react to the incoming request (and once items are available), not
    // to every items/index change — otherwise this would fight manual navigation.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialPageId, items.length]);

  if (isLoading || !binder) {
    return <div className="p-[var(--space-7)] text-sm text-[var(--color-text-muted)]">Opening binder…</div>;
  }

  const tabDividers = binder.tabDividers;
  const current = items[index] ?? { type: "toc" };
  const currentPage = current.type === "page" ? pages.find((p) => p.id === current.pageId) : undefined;

  function goTo(newIndex: number) {
    if (newIndex < 0 || newIndex >= items.length) return;
    setNavDirection(newIndex > index ? 1 : -1);
    setIndex(newIndex);
  }

  function goToPageId(pageId: string) {
    const target = items.findIndex((item) => item.type === "page" && item.pageId === pageId);
    if (target >= 0) goTo(target);
  }

  function goToTab(tabId: string) {
    const firstPage = pages.find((p) => p.tabDividerId === tabId);
    if (firstPage) goToPageId(firstPage.id);
  }

  // A within-tab reorder only decides that tab's own relative sequence — every
  // other tab's pages keep their existing relative order, concatenated
  // chapter-by-chapter (matches how a bound notebook actually flows, and is
  // what PageTurn prev/next and the thumbnail strip walk through).
  function handleTabReorder(tabId: string, newTabPageIds: string[]) {
    const fullOrder: string[] = [];
    for (const tab of tabDividers) {
      if (tab.id === tabId) fullOrder.push(...newTabPageIds);
      else fullOrder.push(...pages.filter((p) => p.tabDividerId === tab.id).map((p) => p.id));
    }
    fullOrder.push(...pages.filter((p) => p.tabDividerId === null).map((p) => p.id));
    reorderPages.mutate(fullOrder);
  }

  const pageKey = current.type === "toc" ? "toc" : current.pageId;

  return (
    <div className="mx-auto flex h-full max-w-5xl flex-col">
      <div className="flex items-baseline justify-between px-[var(--space-4)] pt-[var(--space-5)]">
        <div>
          <p className="text-xs uppercase tracking-wide text-[var(--color-text-muted)]">
            {binder.discipline}
          </p>
          <h1 className="text-2xl" style={{ fontFamily: "var(--font-display)" }}>
            {binder.title}
          </h1>
        </div>
        <div className="flex items-center gap-[var(--space-4)]">
          {dueCards && dueCards.length > 0 && (
            <SpringButton
              type="button"
              onClick={onOpenReview}
              whileTap={{ scale: 0.95 }}
              className="rounded-full px-[var(--space-3)] py-[var(--space-1)] text-sm"
              style={{ background: "var(--color-accent)", color: "#fff" }}
            >
              Review · {dueCards.length} due
            </SpringButton>
          )}
          <SpringButton
            type="button"
            onClick={() => goTo(0)}
            className="text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
          >
            Contents
          </SpringButton>
        </div>
      </div>

      <div className="flex flex-1 gap-[var(--space-4)] px-[var(--space-4)] py-[var(--space-4)]">
        <TabRail
          tabDividers={binder.tabDividers}
          activeTabId={currentPage?.tabDividerId ?? null}
          onSelect={goToTab}
        />

        <PageTurn
          pageKey={pageKey}
          canGoNext={index < items.length - 1}
          canGoPrev={index > 0}
          onNext={() => goTo(index + 1)}
          onPrev={() => goTo(index - 1)}
          navDirection={navDirection}
        >
          {current.type === "toc" ? (
            <TableOfContents
              pages={pages}
              tabDividers={binder.tabDividers}
              onSelect={goToPageId}
              onAddPage={(tabDividerId, title) => createPage.mutate({ tabDividerId, title })}
              onReorder={handleTabReorder}
            />
          ) : currentPage ? (
            <div className="relative flex h-full flex-col gap-[var(--space-5)]">
              <DogEar
                reviewed={currentPage.reviewed}
                onToggle={() =>
                  updatePage.mutate({ pageId: currentPage.id, reviewed: !currentPage.reviewed })
                }
              />
              <div>
                <h2 className="text-xl" style={{ fontFamily: "var(--font-display)" }}>
                  {currentPage.title}
                </h2>
                <div className="mt-[var(--space-2)]">
                  <MasteryControl
                    level={currentPage.masteryLevel}
                    onChange={(level) => updatePage.mutate({ pageId: currentPage.id, masteryLevel: level })}
                  />
                </div>
              </div>
              <PageContent
                blocks={currentPage.content}
                citations={citations}
                annotations={currentPage.annotations}
                onAddAnnotation={(anchorBlockId, body) =>
                  addAnnotation.mutate({ pageId: currentPage.id, anchorBlockId, body })
                }
                onEditText={(blockId, text) => {
                  const nextContent = currentPage.content.map((block) =>
                    block.id === blockId && (block.kind === "heading" || block.kind === "paragraph")
                      ? { ...block, text }
                      : block,
                  );
                  updateContent.mutate({ pageId: currentPage.id, content: nextContent });
                }}
              />
            </div>
          ) : null}
        </PageTurn>
      </div>

      <ThumbnailStrip
        pages={pages}
        currentPageId={current.type === "page" ? current.pageId : null}
        onSelect={goToPageId}
      />
    </div>
  );
}

function AddPageInline({ onAdd }: { onAdd: (title: string) => void }) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");

  if (!open) {
    return (
      <SpringButton
        type="button"
        onClick={() => setOpen(true)}
        className="mt-[var(--space-1)] self-start text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
      >
        + Add page
      </SpringButton>
    );
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (!title.trim()) return;
        onAdd(title.trim());
        setTitle("");
        setOpen(false);
      }}
      className="mt-[var(--space-1)] flex gap-[var(--space-2)]"
    >
      <input
        autoFocus
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onBlur={() => {
          if (!title.trim()) setOpen(false);
        }}
        placeholder="Page title…"
        className="flex-1 rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-transparent px-[var(--space-2)] py-[var(--space-1)] text-sm focus:outline-none"
      />
    </form>
  );
}

function SortableTocEntry({
  page,
  onSelect,
}: {
  page: { id: string; title: string };
  onSelect: (pageId: string) => void;
}) {
  const spring = useSpring();
  // transform tracks the pointer directly while dragging — real, not animated.
  // Dropping dnd-kit's own CSS `transition` and animating with Motion's `layout`
  // instead means the settle-into-place after a drop is real spring physics
  // (inertia + overshoot), not a fixed-duration ease.
  const { attributes, listeners, setNodeRef, transform, isDragging } = useSortable({
    id: page.id,
  });

  return (
    <motion.li
      ref={setNodeRef}
      layout
      transition={spring.base}
      style={{ transform: CSS.Transform.toString(transform), opacity: isDragging ? 0.4 : 1 }}
      className="flex items-center gap-[var(--space-2)]"
    >
      <span
        {...attributes}
        {...listeners}
        aria-label="Drag to reorder"
        className="cursor-grab select-none px-[var(--space-1)] py-[var(--space-2)] text-[var(--color-text-muted)] active:cursor-grabbing"
      >
        ⠿
      </span>
      <SpringButton
        type="button"
        onClick={() => onSelect(page.id)}
        whileTap={{ scale: 0.98 }}
        className="w-full py-[var(--space-2)] text-left hover:text-[var(--color-accent)]"
      >
        {page.title}
      </SpringButton>
    </motion.li>
  );
}

function TocTabSection({
  tab,
  tabPages,
  onSelect,
  onReorder,
}: {
  tab: { id: string; label: string; color: string };
  tabPages: { id: string; title: string; tabDividerId: string | null }[];
  onSelect: (pageId: string) => void;
  onReorder: (tabId: string, newTabPageIds: string[]) => void;
}) {
  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const ids = tabPages.map((p) => p.id);
    const from = ids.indexOf(String(active.id));
    const to = ids.indexOf(String(over.id));
    if (from === -1 || to === -1) return;
    const reordered = [...ids];
    reordered.splice(from, 1);
    reordered.splice(to, 0, String(active.id));
    onReorder(tab.id, reordered);
  }

  return (
    <div className="flex flex-col">
      <p
        className="mb-[var(--space-2)] flex items-center gap-[var(--space-2)] text-sm text-[var(--color-text-muted)]"
        style={{ fontWeight: "var(--font-weight-body)" }}
      >
        <span className="h-2 w-2 rounded-full" style={{ background: tab.color }} />
        {tab.label}
      </p>
      {tabPages.length > 0 && (
        <DndContext onDragEnd={handleDragEnd}>
          <SortableContext items={tabPages.map((p) => p.id)} strategy={verticalListSortingStrategy}>
            <ul className="flex flex-col divide-y divide-[var(--color-border)]">
              {tabPages.map((page) => (
                <SortableTocEntry key={page.id} page={page} onSelect={onSelect} />
              ))}
            </ul>
          </SortableContext>
        </DndContext>
      )}
    </div>
  );
}

function TableOfContents({
  pages,
  tabDividers,
  onSelect,
  onAddPage,
  onReorder,
}: {
  pages: { id: string; title: string; tabDividerId: string | null }[];
  tabDividers: { id: string; label: string; color: string }[];
  onSelect: (pageId: string) => void;
  onAddPage: (tabDividerId: string, title: string) => void;
  onReorder: (tabId: string, newTabPageIds: string[]) => void;
}) {
  return (
    <div>
      <h2 className="mb-[var(--space-5)] text-xl" style={{ fontFamily: "var(--font-display)" }}>
        Table of Contents
      </h2>
      <div className="flex flex-col gap-[var(--space-5)]">
        {tabDividers.map((tab) => {
          const tabPages = pages.filter((p) => p.tabDividerId === tab.id);
          return (
            <div key={tab.id} className="flex flex-col">
              <TocTabSection tab={tab} tabPages={tabPages} onSelect={onSelect} onReorder={onReorder} />
              <AddPageInline onAdd={(title) => onAddPage(tab.id, title)} />
            </div>
          );
        })}
      </div>
    </div>
  );
}
