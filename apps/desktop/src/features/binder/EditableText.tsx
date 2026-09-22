import { useState } from "react";

export function EditableText({
  value,
  onSave,
  multiline,
  className,
  style,
  as: Tag = "span",
}: {
  value: string;
  onSave: (next: string) => void;
  multiline?: boolean;
  className?: string;
  style?: React.CSSProperties;
  as?: "span" | "p" | "h1" | "h2" | "h3";
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);

  function commit() {
    setEditing(false);
    if (draft.trim() && draft !== value) onSave(draft);
    else setDraft(value);
  }

  if (editing) {
    const Field = multiline ? "textarea" : "input";
    return (
      <Field
        autoFocus
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !multiline) commit();
          if (e.key === "Escape") {
            setDraft(value);
            setEditing(false);
          }
        }}
        rows={multiline ? 3 : undefined}
        className={`w-full rounded-[var(--radius-sm)] border border-[var(--color-accent)] bg-transparent focus:outline-none ${className ?? ""}`}
        style={style}
      />
    );
  }

  return (
    <Tag
      onClick={() => setEditing(true)}
      className={`cursor-text rounded-[var(--radius-sm)] hover:bg-[var(--color-surface)] ${className ?? ""}`}
      style={style}
      title="Click to edit"
    >
      {value}
    </Tag>
  );
}
