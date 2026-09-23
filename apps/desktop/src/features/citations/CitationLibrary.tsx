import { useState } from "react";
import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { DISCIPLINE_DEFAULT_CITATION_STYLE, MICROCOPY, type Discipline } from "@the-desk/shared";
import { SpringButton } from "../../components/SpringButton";
import { useCitations, useCreateCitation, type NewCitationInput } from "./api";
import type { CitationWithFormatted } from "./types";

const STYLE_LABEL: Record<string, string> = {
  ama: "AMA",
  ieee: "IEEE",
  mla: "MLA",
  chicago: "Chicago",
};

function AddCitationForm({ onAdd }: { onAdd: (input: NewCitationInput) => void }) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [authors, setAuthors] = useState("");
  const [year, setYear] = useState("");
  const [publisher, setPublisher] = useState("");
  const [sourceType, setSourceType] = useState<NewCitationInput["sourceType"]>("article");

  if (!open) {
    return (
      <SpringButton
        type="button"
        onClick={() => setOpen(true)}
        className="self-start rounded-[var(--radius-sm)] border border-dashed border-[var(--color-border)] px-[var(--space-4)] py-[var(--space-2)] text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
      >
        + Add citation
      </SpringButton>
    );
  }

  return (
    <form
      className="flex flex-col gap-[var(--space-3)] rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-[var(--space-4)]"
      onSubmit={(e) => {
        e.preventDefault();
        if (!title.trim() || !authors.trim()) return;
        onAdd({
          title: title.trim(),
          authors: authors.split(",").map((a) => a.trim()).filter(Boolean),
          year: year ? Number(year) : undefined,
          publisher: publisher.trim() || undefined,
          sourceType,
        });
        setTitle("");
        setAuthors("");
        setYear("");
        setPublisher("");
        setOpen(false);
      }}
    >
      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Title"
        className="rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-transparent px-[var(--space-3)] py-[var(--space-2)] text-sm focus:outline-none"
      />
      <input
        value={authors}
        onChange={(e) => setAuthors(e.target.value)}
        placeholder="Authors, comma-separated (First Last, First Last)"
        className="rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-transparent px-[var(--space-3)] py-[var(--space-2)] text-sm focus:outline-none"
      />
      <div className="flex gap-[var(--space-3)]">
        <input
          value={year}
          onChange={(e) => setYear(e.target.value)}
          placeholder="Year"
          className="w-24 rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-transparent px-[var(--space-3)] py-[var(--space-2)] text-sm focus:outline-none"
        />
        <input
          value={publisher}
          onChange={(e) => setPublisher(e.target.value)}
          placeholder="Publisher / journal"
          className="flex-1 rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-transparent px-[var(--space-3)] py-[var(--space-2)] text-sm focus:outline-none"
        />
        <select
          value={sourceType}
          onChange={(e) => setSourceType(e.target.value as NewCitationInput["sourceType"])}
          className="rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-transparent px-[var(--space-2)] py-[var(--space-2)] text-sm"
        >
          <option value="article">Article</option>
          <option value="book">Book</option>
          <option value="website">Website</option>
          <option value="conference_paper">Conference paper</option>
          <option value="other">Other</option>
        </select>
      </div>
      <div className="flex gap-[var(--space-2)]">
        <SpringButton
          type="submit"
          whileTap={{ scale: 0.96 }}
          className="rounded-[var(--radius-sm)] px-[var(--space-4)] py-[var(--space-2)] text-sm"
          style={{ background: "var(--color-accent)", color: "#fff" }}
        >
          Save
        </SpringButton>
        <SpringButton
          type="button"
          onClick={() => setOpen(false)}
          className="rounded-[var(--radius-sm)] px-[var(--space-4)] py-[var(--space-2)] text-sm text-[var(--color-text-muted)]"
        >
          Cancel
        </SpringButton>
      </div>
    </form>
  );
}

// Tier 4's "citation drag-insert": each citation is a draggable source, meant
// to be dropped onto a block in the page currently being read (see
// BinderView's DndContext + PageContent's per-block droppable zones), which
// inserts a real citationRef block right after the drop target.
function DraggableCitationCard({ citation }: { citation: CitationWithFormatted }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: citation.id });
  return (
    <li
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      style={{ transform: CSS.Translate.toString(transform), opacity: isDragging ? 0.4 : 1, cursor: "grab" }}
      className="rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-surface)] p-[var(--space-4)] text-sm leading-relaxed"
    >
      {citation.formatted}
    </li>
  );
}

export function CitationLibrary({ userId, discipline }: { userId: string; discipline: Discipline }) {
  const { data: citations, isLoading } = useCitations(userId, discipline);
  const createCitation = useCreateCitation(userId, discipline);
  const style = DISCIPLINE_DEFAULT_CITATION_STYLE[discipline];
  const copy = MICROCOPY[discipline];

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-[var(--space-5)] px-[var(--space-4)] py-[var(--space-5)]">
      <div>
        <h1 className="text-2xl" style={{ fontFamily: "var(--font-display)" }}>
          Citations
        </h1>
        <p className="mt-[var(--space-1)] text-sm text-[var(--color-text-muted)]">
          Formatted in {STYLE_LABEL[style]} — this discipline's default style.
        </p>
      </div>

      {isLoading ? (
        <p className="text-sm text-[var(--color-text-muted)]">{copy.loadingCitations}</p>
      ) : (
        <ul className="flex flex-col gap-[var(--space-3)]">
          {citations?.map((c) => (
            <DraggableCitationCard key={c.id} citation={c} />
          ))}
          {citations?.length === 0 && (
            <p className="text-sm text-[var(--color-text-muted)]">{copy.emptyCitations}</p>
          )}
        </ul>
      )}

      <AddCitationForm onAdd={(input) => createCitation.mutate(input)} />
    </div>
  );
}
