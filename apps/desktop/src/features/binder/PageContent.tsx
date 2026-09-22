import { lazy, Suspense } from "react";
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

export function PageContent({
  blocks,
  citations = [],
  annotations = [],
  onAddAnnotation,
  onEditText,
}: {
  blocks: Block[];
  citations?: CitationWithFormatted[];
  annotations?: MarginAnnotation[];
  onAddAnnotation?: (blockId: string, body: string) => void;
  onEditText?: (blockId: string, text: string) => void;
}) {
  return (
    <div className="grid gap-x-[var(--space-5)] gap-y-[var(--space-4)]" style={{ gridTemplateColumns: "1fr 180px" }}>
      {blocks.map((block) => (
        <div key={block.id} className="contents">
          <div>{renderBlock(block, citations, onEditText)}</div>
          <div>
            {onAddAnnotation && (
              <MarginNote
                annotations={annotations.filter((a) => a.anchorBlockId === block.id)}
                onAdd={(body) => onAddAnnotation(block.id, body)}
              />
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
