import type { Block } from "@the-desk/shared";
import { RunnableCode } from "./RunnableCode";

export function PageContent({ blocks }: { blocks: Block[] }) {
  return (
    <div className="flex flex-col gap-4">
      {blocks.map((block) => {
        switch (block.kind) {
          case "heading": {
            const sizes = { 1: "text-2xl", 2: "text-xl", 3: "text-lg" } as const;
            const className = sizes[block.level as 1 | 2 | 3];
            const style = { fontFamily: "var(--font-display)" };
            if (block.level === 1) {
              return (
                <h1 key={block.id} className={className} style={style}>
                  {block.text}
                </h1>
              );
            }
            if (block.level === 2) {
              return (
                <h2 key={block.id} className={className} style={style}>
                  {block.text}
                </h2>
              );
            }
            return (
              <h3 key={block.id} className={className} style={style}>
                {block.text}
              </h3>
            );
          }
          case "paragraph":
            return (
              <p key={block.id} className="leading-relaxed text-[var(--color-text)]">
                {block.text}
              </p>
            );
          case "list": {
            const ListTag = block.ordered ? "ol" : "ul";
            return (
              <ListTag
                key={block.id}
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
              <div key={block.id}>
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
              <figure key={block.id}>
                <img src={block.url} alt={block.caption ?? ""} className="rounded-[var(--radius-base)]" />
                {block.caption && (
                  <figcaption className="mt-1 text-sm text-[var(--color-text-muted)]">
                    {block.caption}
                  </figcaption>
                )}
              </figure>
            );
          case "citationRef":
            return (
              <span key={block.id} className="text-sm text-[var(--color-accent)]">
                [citation]
              </span>
            );
          default:
            return null;
        }
      })}
    </div>
  );
}
