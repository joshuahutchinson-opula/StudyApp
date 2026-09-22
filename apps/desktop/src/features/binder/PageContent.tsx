import type { Block, MarginAnnotation } from "@the-desk/shared";
import { RunnableCode } from "./RunnableCode";
import type { CitationWithFormatted } from "../citations/types";
import { MarginNote } from "./MarginNote";

function renderBlock(block: Block, citations: CitationWithFormatted[]) {
  switch (block.kind) {
    case "heading": {
      const sizes = { 1: "text-2xl", 2: "text-xl", 3: "text-lg" } as const;
      const className = sizes[block.level as 1 | 2 | 3];
      const style = { fontFamily: "var(--font-display)" };
      if (block.level === 1) return <h1 className={className} style={style}>{block.text}</h1>;
      if (block.level === 2) return <h2 className={className} style={style}>{block.text}</h2>;
      return <h3 className={className} style={style}>{block.text}</h3>;
    }
    case "paragraph":
      return <p className="leading-relaxed text-[var(--color-text)]">{block.text}</p>;
    case "list": {
      const ListTag = block.ordered ? "ol" : "ul";
      return (
        <ListTag
          className={`flex flex-col gap-1.5 pl-5 text-[var(--color-text)] ${block.ordered ? "list-decimal" : "list-disc"}`}
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
            className="overflow-x-auto rounded-[var(--radius-base)] bg-[var(--color-surface)] p-4 text-sm"
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
          <img src={block.url} alt={block.caption ?? ""} className="rounded-[var(--radius-base)]" />
          {block.caption && (
            <figcaption className="mt-1 text-sm text-[var(--color-text-muted)]">{block.caption}</figcaption>
          )}
        </figure>
      );
    case "citationRef": {
      const citation = citations.find((c) => c.id === block.citationId);
      return (
        <p className="border-l-2 pl-3 text-sm text-[var(--color-text-muted)]" style={{ borderColor: "var(--color-accent)" }}>
          {citation ? citation.formatted : "[citation not found]"}
        </p>
      );
    }
    default:
      return null;
  }
}

export function PageContent({
  blocks,
  citations = [],
  annotations = [],
  onAddAnnotation,
}: {
  blocks: Block[];
  citations?: CitationWithFormatted[];
  annotations?: MarginAnnotation[];
  onAddAnnotation?: (blockId: string, body: string) => void;
}) {
  return (
    <div className="grid gap-x-6 gap-y-4" style={{ gridTemplateColumns: "1fr 180px" }}>
      {blocks.map((block) => (
        <div key={block.id} className="contents">
          <div>{renderBlock(block, citations)}</div>
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
