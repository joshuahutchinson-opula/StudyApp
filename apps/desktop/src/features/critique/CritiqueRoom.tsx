import { useState } from "react";
import { motion } from "motion/react";
import { useBinder } from "../binder/api";
import { SpringButton } from "../../components/SpringButton";
import { SystemMessage } from "../../components/SystemMessage";
import { useSpring } from "../../hooks/useSpring";
import { useAddComment, useCreateThread, useCritiqueThreads, useResolveThread } from "./api";
import type { CritiqueThread } from "./types";

const AUTHOR = "You";

function ThreadPanel({
  pageId,
  thread,
  onClose,
}: {
  pageId: string;
  thread: CritiqueThread;
  onClose: () => void;
}) {
  const [reply, setReply] = useState("");
  const addComment = useAddComment(pageId);
  const resolveThread = useResolveThread(pageId);

  return (
    <div className="flex w-72 flex-col gap-[var(--space-3)] rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-[var(--space-4)]">
      <div className="flex items-center justify-between">
        <p className="text-xs uppercase tracking-wide text-[var(--color-text-muted)]">
          {thread.resolved ? "Resolved" : "Open"}
        </p>
        <SpringButton type="button" onClick={onClose} className="text-xs text-[var(--color-text-muted)]">
          Close
        </SpringButton>
      </div>

      <div className="flex max-h-64 flex-col gap-[var(--space-2)] overflow-y-auto">
        {thread.comments.map((c) => (
          <div key={c.id} className="text-sm">
            <p style={{ fontWeight: "var(--font-weight-body)" }}>{c.authorName}</p>
            <p className="text-[var(--color-text)]">{c.body}</p>
          </div>
        ))}
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (!reply.trim()) return;
          addComment.mutate({ threadId: thread.id, authorName: AUTHOR, body: reply.trim() });
          setReply("");
        }}
        className="flex flex-col gap-[var(--space-2)]"
      >
        <textarea
          value={reply}
          onChange={(e) => setReply(e.target.value)}
          rows={2}
          placeholder="Reply…"
          className="w-full resize-none rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-transparent px-[var(--space-2)] py-[var(--space-1)] text-sm focus:outline-none"
        />
        <div className="flex justify-between">
          <SpringButton type="submit" className="text-xs" style={{ color: "var(--color-accent)" }}>
            Reply
          </SpringButton>
          <SpringButton
            type="button"
            onClick={() => resolveThread.mutate({ threadId: thread.id, resolved: !thread.resolved })}
            className="text-xs text-[var(--color-text-muted)]"
          >
            {thread.resolved ? "Reopen" : "Mark resolved"}
          </SpringButton>
        </div>
      </form>
    </div>
  );
}

function NewPinForm({
  pageId,
  x,
  y,
  onDone,
}: {
  pageId: string;
  x: number;
  y: number;
  onDone: () => void;
}) {
  const [body, setBody] = useState("");
  const createThread = useCreateThread(pageId);

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (!body.trim()) return;
        createThread.mutate({ x, y, authorName: AUTHOR, body: body.trim() });
        onDone();
      }}
      className="flex w-64 flex-col gap-[var(--space-2)] rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-[var(--space-3)]"
    >
      <textarea
        autoFocus
        value={body}
        onChange={(e) => setBody(e.target.value)}
        onKeyDown={(e) => e.key === "Escape" && onDone()}
        rows={2}
        placeholder="Point-specific feedback…"
        className="w-full resize-none rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-transparent px-[var(--space-2)] py-[var(--space-1)] text-sm focus:outline-none"
      />
      <div className="flex justify-between">
        <SpringButton type="submit" className="text-xs" style={{ color: "var(--color-accent)" }}>
          Pin comment
        </SpringButton>
        <SpringButton type="button" onClick={onDone} className="text-xs text-[var(--color-text-muted)]">
          Cancel
        </SpringButton>
      </div>
    </form>
  );
}

export function CritiqueRoom({ binderId }: { binderId: string }) {
  const spring = useSpring();
  const { data: binder, isLoading } = useBinder(binderId);
  const [selectedPageId, setSelectedPageId] = useState<string | null>(null);
  const [activeThreadId, setActiveThreadId] = useState<string | null>(null);
  const [pendingPin, setPendingPin] = useState<{ x: number; y: number } | null>(null);

  const pagesWithImages = (binder?.pages ?? [])
    .map((p) => ({ page: p, image: p.content.find((b) => b.kind === "image") }))
    .filter((p): p is { page: (typeof p)["page"]; image: NonNullable<(typeof p)["image"]> } => Boolean(p.image));

  const selected = pagesWithImages.find((p) => p.page.id === selectedPageId) ?? pagesWithImages[0];
  const { data: threads } = useCritiqueThreads(selected?.page.id);
  const activeThread = threads?.find((t) => t.id === activeThreadId);

  if (isLoading || !binder) {
    return (
      <div className="p-[var(--space-7)]">
        <SystemMessage msgKey="loading" />
      </div>
    );
  }

  if (!selected) {
    return (
      <div className="p-[var(--space-7)] text-sm text-[var(--color-text-muted)]">
        No work-in-progress images in this binder yet to critique.
      </div>
    );
  }

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-[var(--space-5)] px-[var(--space-4)] py-[var(--space-5)]">
      <div>
        <p className="mb-[var(--space-1)] text-xs uppercase tracking-wide text-[var(--color-text-muted)]">Critique Room</p>
        <h1 className="text-2xl" style={{ fontFamily: "var(--font-display)" }}>
          Point-specific feedback, pinned to the work
        </h1>
      </div>

      {pagesWithImages.length > 1 && (
        <div className="flex flex-wrap gap-[var(--space-2)]">
          {pagesWithImages.map(({ page }) => (
            <SpringButton
              key={page.id}
              type="button"
              onClick={() => {
                setSelectedPageId(page.id);
                setActiveThreadId(null);
                setPendingPin(null);
              }}
              whileTap={{ scale: 0.95 }}
              className="rounded-full border px-[var(--space-3)] py-[var(--space-1)] text-sm"
              style={{
                borderColor: page.id === selected.page.id ? "var(--color-accent)" : "var(--color-border)",
                color: page.id === selected.page.id ? "var(--color-accent)" : "var(--color-text-muted)",
              }}
            >
              {page.title}
            </SpringButton>
          ))}
        </div>
      )}

      <div className="flex items-start gap-[var(--space-4)]">
        <div
          className="relative shrink-0 cursor-crosshair overflow-hidden rounded-[var(--radius-lg)] border border-[var(--color-border)]"
          style={{ width: 560 }}
          onClick={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            const x = ((e.clientX - rect.left) / rect.width) * 100;
            const y = ((e.clientY - rect.top) / rect.height) * 100;
            setActiveThreadId(null);
            setPendingPin({ x, y });
          }}
        >
          <img src={selected.image.url} alt={selected.image.caption ?? ""} className="block w-full" />
          {threads?.map((t) => (
            <motion.button
              key={t.id}
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setPendingPin(null);
                setActiveThreadId(t.id);
              }}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              whileTap={{ scale: 0.85 }}
              transition={spring.base}
              className="absolute flex h-6 w-6 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full text-xs text-white shadow"
              style={{
                left: `${t.x}%`,
                top: `${t.y}%`,
                background: t.resolved ? "#22c55e" : "var(--color-accent)",
                fontWeight: "var(--font-weight-body)",
              }}
              title={t.comments[0]?.body}
            >
              {t.comments.length}
            </motion.button>
          ))}
        </div>

        {activeThread ? (
          <ThreadPanel pageId={selected.page.id} thread={activeThread} onClose={() => setActiveThreadId(null)} />
        ) : pendingPin ? (
          <NewPinForm
            pageId={selected.page.id}
            x={pendingPin.x}
            y={pendingPin.y}
            onDone={() => setPendingPin(null)}
          />
        ) : (
          <p className="w-64 text-sm text-[var(--color-text-muted)]">
            Click anywhere on the image to pin a comment to that exact spot.
          </p>
        )}
      </div>
    </div>
  );
}
