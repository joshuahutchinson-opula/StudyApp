import { lazy, Suspense, type ReactNode } from "react";
import { useDroppable } from "@dnd-kit/core";
import type { Block, MarginAnnotation } from "@the-desk/shared";
import { RunnableCode } from "./RunnableCode";
import type { CitationWithFormatted } from "../citations/types";
import { MarginNote } from "./MarginNote";
import { EditableText } from "./EditableText";

// mathjs is a large dependency — code-split so it's only fetched on pages
// that actually contain a formula block (Engineering), not on every page load.
const FormulaBlock = lazy(() => import("./FormulaBlock").then((m) => ({ default: m.FormulaBlock })));

function renderBlock(
  block: Block,
  citations: CitationWithFormatted[],
  onEditText?: (blockId: string, text: string) => void,
) {
  switch (block.kind) {
    case "heading": {
      const sizes = { 1: "text-2xl", 2: "text-xl", 3: "text-lg" } as const;
      const className = sizes[block.level as 1 | 2 | 3];
      const style = { fontFamily: "var(--font-display)" };
      const tag = block.level === 1 ? "h1" : block.level === 2 ? "h2" : "h3";
      if (onEditText) {
        return (
          <EditableText
            as={tag}
            value={block.text}
            onSave={(text) => onEditText(block.id, text)}
            className={className}
            style={style}
          />
        );
      }
      const Tag = tag;
      return <Tag className={className} style={style}>{block.text}</Tag>;
    }
    case "paragraph":
      if (onEditText) {
        return (
          <EditableText
            as="p"
            value={block.text}
            onSave={(text) => onEditText(block.id, text)}
            multiline
            className="leading-relaxed text-[var(--color-text)]"
          />
        );
      }
      return <p className="leading-relaxed text-[var(--color-text)]">{block.text}</p>;
    case "list": {
      const ListTag = block.ordered ? "ol" : "ul";
      return (
        <ListTag
          className={`flex flex-col gap-[var(--space-1)] pl-[var(--space-4)] text-[var(--color-text)] ${block.ordered ? "list-decimal" : "list-disc"}`}
        >
          {block.items.map((item, i) => (
            <li key={i}>{item}</li>
          ))}
        </ListTag>
      );
    }
    case "code":
      return (
        <div>
          <pre
            className="overflow-x-auto rounded-[var(--radius-lg)] bg-[var(--color-surface)] p-[var(--space-4)] text-sm"
            style={{ fontFamily: "var(--font-mono)", border: "1px solid var(--color-border)" }}
          >
            <code>{block.code}</code>
          </pre>
          {block.runnable && <RunnableCode code={block.code} />}
        </div>
      );
    case "image":
      return (
        <figure>
          <img src={block.url} alt={block.caption ?? ""} className="rounded-[var(--radius-lg)]" />
          {block.caption && (
            <figcaption className="mt-[var(--space-1)] text-sm text-[var(--color-text-muted)]">{block.caption}</figcaption>
          )}
        </figure>
      );
    case "citationRef": {
      const citation = citations.find((c) => c.id === block.citationId);
      return (
        <p className="border-l-2 pl-[var(--space-3)] text-sm text-[var(--color-text-muted)]" style={{ borderColor: "var(--color-accent)" }}>
          {citation ? citation.formatted : "[citation not found]"}
        </p>
      );
    }
    case "formula":
      return (
        <Suspense fallback={<p className="text-sm text-[var(--color-text-muted)]">Loading calculator…</p>}>
          <FormulaBlock expression={block.expression} />
        </Suspense>
      );
    default:
      return null;
  }
}

// Tier 4's "citation drag-insert" drop target — one per block, id
// `block:<blockId>` so BinderView's onDragEnd can tell a citation card was
// dropped ON something (as opposed to a reorder drag elsewhere). Only used
// when `dropEnabled` — a read-only viewer (Recall, the textbook) has no
// content to insert into, so it skips this wrapper entirely.
function BlockDropZone({ blockId, children }: { blockId: string; children: ReactNode }) {
  const { setNodeRef, isOver } = useDroppable({ id: `block:${blockId}` });
  return (
    <div
      ref={setNodeRef}
      style={{
        outline: isOver ? "2px dashed var(--color-accent)" : "2px dashed transparent",
        borderRadius: "var(--radius-sm)",
        transition: "outline-color 120ms",
      }}
    >
      {children}
    </div>
  );
}

export function PageContent({
  blocks,
  citations = [],
  annotations = [],
  dropEnabled = false,
  onAddAnnotation,
  onEditText,
}: {
  blocks: Block[];
  citations?: CitationWithFormatted[];
  annotations?: MarginAnnotation[];
  /** Enables per-block drop targets for citation drag-insert (BinderView only). */
  dropEnabled?: boolean;
  onAddAnnotation?: (blockId: string, body: string) => void;
  onEditText?: (blockId: string, text: string) => void;
}) {
  return (
    <div className="grid gap-x-[var(--space-5)] gap-y-[var(--space-4)]" style={{ gridTemplateColumns: "1fr 180px" }}>
      {blocks.map((block) => {
        const rendered = renderBlock(block, citations, onEditText);
        return (
          <div key={block.id} className="contents">
            <div>{dropEnabled ? <BlockDropZone blockId={block.id}>{rendered}</BlockDropZone> : rendered}</div>
            <div>
              {onAddAnnotation && (
                <MarginNote
                  annotations={annotations.filter((a) => a.anchorBlockId === block.id)}
                  onAdd={(body) => onAddAnnotation(block.id, body)}
                />
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
