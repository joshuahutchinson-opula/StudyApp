import { useState } from "react";
import type { Discipline, Task, TaskStatus } from "@the-desk/shared";
import { useCreateDeadline, useCreateTask, useDeadlines, useTasks, useUpdateTaskStatus } from "./api";

const COLUMNS: { status: TaskStatus; label: string }[] = [
  { status: "backlog", label: "Backlog" },
  { status: "todo", label: "To Do" },
  { status: "in_progress", label: "In Progress" },
  { status: "done", label: "Done" },
];

function relativeDay(dueAt: string): string {
  const days = Math.round((new Date(dueAt).getTime() - Date.now()) / (24 * 60 * 60 * 1000));
  if (days < 0) return `${Math.abs(days)}d overdue`;
  if (days === 0) return "today";
  if (days === 1) return "tomorrow";
  return `in ${days}d`;
}

function TaskCard({
  task,
  onMove,
}: {
  task: Task;
  onMove: (status: TaskStatus) => void;
}) {
  const currentIdx = COLUMNS.findIndex((c) => c.status === task.status);
  return (
    <div className="rounded-[var(--radius-base)] border border-[var(--color-border)] bg-[var(--color-surface)] p-3">
      <p className="text-sm">{task.title}</p>
      <div className="mt-2 flex items-center justify-between">
        <span className="text-xs text-[var(--color-text-muted)]">
          {task.dueAt ? relativeDay(task.dueAt as unknown as string) : ""}
        </span>
        <div className="flex gap-1">
          {currentIdx > 0 && (
            <button
              type="button"
              onClick={() => onMove(COLUMNS[currentIdx - 1]!.status)}
              className="rounded px-1.5 py-0.5 text-xs text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
              aria-label={`Move back to ${COLUMNS[currentIdx - 1]!.label}`}
            >
              ‹
            </button>
          )}
          {currentIdx < COLUMNS.length - 1 && (
            <button
              type="button"
              onClick={() => onMove(COLUMNS[currentIdx + 1]!.status)}
              className="rounded px-1.5 py-0.5 text-xs text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
              aria-label={`Move forward to ${COLUMNS[currentIdx + 1]!.label}`}
            >
              ›
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function AddDeadlineForm({ onAdd }: { onAdd: (title: string, dueAt: string) => void }) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [dueAt, setDueAt] = useState("");

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="shrink-0 self-center rounded-[var(--radius-base)] border border-dashed border-[var(--color-border)] px-3 py-2 text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
      >
        + Deadline
      </button>
    );
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (!title.trim() || !dueAt) return;
        onAdd(title.trim(), dueAt);
        setTitle("");
        setDueAt("");
        setOpen(false);
      }}
      className="flex shrink-0 items-center gap-2 rounded-[var(--radius-base)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2"
    >
      <input
        autoFocus
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Deadline title"
        className="w-40 bg-transparent text-sm focus:outline-none"
      />
      <input
        type="date"
        value={dueAt}
        onChange={(e) => setDueAt(e.target.value)}
        className="bg-transparent text-sm focus:outline-none"
      />
      <button type="submit" className="text-sm" style={{ color: "var(--color-accent)" }}>
        Add
      </button>
    </form>
  );
}

function QuickAdd({ onAdd }: { onAdd: (title: string) => void }) {
  const [value, setValue] = useState("");
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (!value.trim()) return;
        onAdd(value.trim());
        setValue("");
      }}
    >
      <input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Add a task…"
        className="w-full rounded-[var(--radius-base)] border border-dashed border-[var(--color-border)] bg-transparent px-3 py-2 text-sm text-[var(--color-text)] placeholder:text-[var(--color-text-muted)] focus:border-solid focus:outline-none"
      />
    </form>
  );
}

export function PlannerView({ userId, discipline }: { userId: string; discipline: Discipline }) {
  const { data: tasks, isLoading } = useTasks(userId, discipline);
  const { data: deadlines } = useDeadlines(userId);
  const createTask = useCreateTask(userId, discipline);
  const updateStatus = useUpdateTaskStatus(userId, discipline);
  const createDeadline = useCreateDeadline(userId);

  return (
    <div className="mx-auto flex h-full max-w-6xl flex-col gap-6 px-4 py-6">
      <h1 className="text-2xl" style={{ fontFamily: "var(--font-display)" }}>
        Planner
      </h1>

      <div className="flex items-center gap-4 overflow-x-auto border-b border-[var(--color-border)] pb-4">
        {deadlines?.map((d) => (
          <div
            key={d.id}
            className="shrink-0 rounded-[var(--radius-base)] px-3 py-2 text-sm"
            style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)" }}
          >
            <p>{d.title}</p>
            <p className="text-xs text-[var(--color-accent)]">{relativeDay(d.dueAt as unknown as string)}</p>
          </div>
        ))}
        <AddDeadlineForm onAdd={(title, dueAt) => createDeadline.mutate({ title, dueAt })} />
      </div>

      {isLoading || !tasks ? (
        <div className="text-sm text-[var(--color-text-muted)]">Loading tasks…</div>
      ) : (
        <div className="grid flex-1 grid-cols-4 gap-4">
          {COLUMNS.map((col) => {
            const colTasks = tasks.filter((t) => t.status === col.status);
            return (
              <div key={col.status} className="flex flex-col gap-2">
                <p className="text-xs uppercase tracking-wide text-[var(--color-text-muted)]">
                  {col.label} · {colTasks.length}
                </p>
                <div className="flex flex-col gap-2">
                  {colTasks.map((task) => (
                    <TaskCard
                      key={task.id}
                      task={task}
                      onMove={(status) => updateStatus.mutate({ taskId: task.id, status })}
                    />
                  ))}
                </div>
                {col.status === "backlog" && <QuickAdd onAdd={(title) => createTask.mutate(title)} />}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
