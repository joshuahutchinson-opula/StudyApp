import { useState } from "react";
import { motion } from "motion/react";
import type { Discipline, Task, TaskStatus } from "@the-desk/shared";
import { SpringButton } from "../../components/SpringButton";
import { useSpring } from "../../hooks/useSpring";
import { useCreateDeadline, useCreateTask, useDeadlines, useTasks, useUpdateTaskStatus } from "./api";
import { ListView } from "./ListView";
import { CalendarView } from "./CalendarView";

type ViewMode = "kanban" | "list" | "calendar";

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

function MoveButtons({ status, onMove }: { status: TaskStatus; onMove: (status: TaskStatus) => void }) {
  const currentIdx = COLUMNS.findIndex((c) => c.status === status);
  return (
    <div className="flex gap-[var(--space-1)]">
      {currentIdx > 0 && (
        <SpringButton
          type="button"
          onClick={() => onMove(COLUMNS[currentIdx - 1]!.status)}
          className="rounded-[var(--radius-sm)] px-[var(--space-1)] py-[var(--space-1)] text-xs text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
          aria-label={`Move back to ${COLUMNS[currentIdx - 1]!.label}`}
        >
          ‹
        </SpringButton>
      )}
      {currentIdx < COLUMNS.length - 1 && (
        <SpringButton
          type="button"
          onClick={() => onMove(COLUMNS[currentIdx + 1]!.status)}
          className="rounded-[var(--radius-sm)] px-[var(--space-1)] py-[var(--space-1)] text-xs text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
          aria-label={`Move forward to ${COLUMNS[currentIdx + 1]!.label}`}
        >
          ›
        </SpringButton>
      )}
    </div>
  );
}

// Subtasks nest inside their parent's card (Linear-style sub-issues) rather
// than appearing as separate board cards in their own column — a subtask's
// status can legitimately differ from its parent's, and letting it float to
// a different kanban column would make the hierarchy invisible.
function TaskCard({
  task,
  subtasks,
  onMove,
  onMoveSubtask,
  onAddSubtask,
}: {
  task: Task;
  subtasks: Task[];
  onMove: (status: TaskStatus) => void;
  onMoveSubtask: (subtaskId: string, status: TaskStatus) => void;
  onAddSubtask: (title: string) => void;
}) {
  const spring = useSpring();
  const [addingSubtask, setAddingSubtask] = useState(false);
  const doneCount = subtasks.filter((s) => s.status === "done").length;

  return (
    <div className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-[var(--space-3)]">
      <p className="text-sm">{task.title}</p>
      <div className="mt-[var(--space-2)] flex items-center justify-between">
        <span className="text-xs text-[var(--color-text-muted)]">
          {subtasks.length > 0
            ? `${doneCount}/${subtasks.length} subtasks`
            : task.dueAt
              ? relativeDay(task.dueAt as unknown as string)
              : ""}
        </span>
        <MoveButtons status={task.status} onMove={onMove} />
      </div>

      {subtasks.length > 0 && (
        <ul className="mt-[var(--space-2)] flex flex-col gap-[var(--space-1)] border-t border-[var(--color-border)] pt-[var(--space-2)]">
          {subtasks.map((s) => (
            <li key={s.id} className="flex items-center justify-between gap-[var(--space-2)] text-xs">
              <motion.button
                type="button"
                onClick={() => onMoveSubtask(s.id, s.status === "done" ? "todo" : "done")}
                whileTap={{ scale: 0.97 }}
                className="flex flex-1 items-center gap-[var(--space-1)] text-left"
                style={{
                  color: s.status === "done" ? "var(--color-text-muted)" : "var(--color-text)",
                  textDecoration: s.status === "done" ? "line-through" : "none",
                }}
              >
                <motion.span
                  aria-hidden
                  animate={{ scale: s.status === "done" ? 1.15 : 1 }}
                  transition={spring.base}
                  className="h-2.5 w-2.5 shrink-0 rounded-full border"
                  style={{
                    borderColor: "var(--color-accent)",
                    background: s.status === "done" ? "var(--color-accent)" : "transparent",
                  }}
                />
                {s.title}
              </motion.button>
            </li>
          ))}
        </ul>
      )}

      {addingSubtask ? (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const input = e.currentTarget.elements.namedItem("title") as HTMLInputElement;
            if (!input.value.trim()) return;
            onAddSubtask(input.value.trim());
            setAddingSubtask(false);
          }}
          className="mt-[var(--space-2)]"
        >
          <input
            name="title"
            autoFocus
            onBlur={() => setAddingSubtask(false)}
            placeholder="Subtask title…"
            className="w-full rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-transparent px-[var(--space-1)] py-[var(--space-1)] text-xs focus:outline-none"
          />
        </form>
      ) : (
        <SpringButton
          type="button"
          onClick={() => setAddingSubtask(true)}
          className="mt-[var(--space-2)] text-xs text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
        >
          + subtask
        </SpringButton>
      )}
    </div>
  );
}

function AddDeadlineForm({ onAdd }: { onAdd: (title: string, dueAt: string) => void }) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [dueAt, setDueAt] = useState("");

  if (!open) {
    return (
      <SpringButton
        type="button"
        onClick={() => setOpen(true)}
        className="shrink-0 self-center rounded-[var(--radius-sm)] border border-dashed border-[var(--color-border)] px-[var(--space-3)] py-[var(--space-2)] text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
      >
        + Deadline
      </SpringButton>
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
      className="flex shrink-0 items-center gap-[var(--space-2)] rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-surface)] px-[var(--space-3)] py-[var(--space-2)]"
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
      <SpringButton type="submit" className="text-sm" style={{ color: "var(--color-accent)" }}>
        Add
      </SpringButton>
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
        className="w-full rounded-[var(--radius-sm)] border border-dashed border-[var(--color-border)] bg-transparent px-[var(--space-3)] py-[var(--space-2)] text-sm text-[var(--color-text)] placeholder:text-[var(--color-text-muted)] focus:border-solid focus:outline-none"
      />
    </form>
  );
}

export function PlannerView({ userId, discipline }: { userId: string; discipline: Discipline }) {
  const spring = useSpring();
  const { data: tasks, isLoading } = useTasks(userId, discipline);
  const { data: deadlines } = useDeadlines(userId);
  const createTask = useCreateTask(userId, discipline);
  const updateStatus = useUpdateTaskStatus(userId, discipline);
  const createDeadline = useCreateDeadline(userId);
  const [view, setView] = useState<ViewMode>("kanban");

  return (
    <div className="mx-auto flex h-full max-w-6xl flex-col gap-[var(--space-5)] px-[var(--space-4)] py-[var(--space-5)]">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl" style={{ fontFamily: "var(--font-display)" }}>
          Planner
        </h1>
        <div className="flex gap-[var(--space-1)] rounded-[var(--radius-sm)] border border-[var(--color-border)] p-[var(--space-1)] text-sm">
          {(["kanban", "list", "calendar"] as const).map((v) => (
            <motion.button
              key={v}
              type="button"
              onClick={() => setView(v)}
              whileTap={{ scale: 0.94 }}
              className="relative rounded-[var(--radius-sm)] px-[var(--space-3)] py-[var(--space-1)] capitalize"
              style={{ color: view === v ? "#fff" : "var(--color-text-muted)" }}
            >
              {view === v && (
                <motion.span
                  layoutId="planner-view-indicator"
                  className="absolute inset-0 rounded-[var(--radius-sm)]"
                  style={{ background: "var(--color-accent)", zIndex: -1 }}
                  transition={spring.base}
                />
              )}
              {v}
            </motion.button>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-[var(--space-4)] overflow-x-auto border-b border-[var(--color-border)] pb-[var(--space-4)]">
        {deadlines?.map((d) => (
          <div
            key={d.id}
            className="shrink-0 rounded-[var(--radius-sm)] px-[var(--space-3)] py-[var(--space-2)] text-sm"
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
      ) : view === "list" ? (
        <ListView tasks={tasks} />
      ) : view === "calendar" ? (
        <CalendarView tasks={tasks} deadlines={deadlines ?? []} />
      ) : (
        <div className="grid flex-1 grid-cols-4 gap-[var(--space-4)]">
          {COLUMNS.map((col) => {
            // Only top-level tasks get their own column position — a subtask
            // renders nested inside its parent's card regardless of which
            // column that parent is in (see TaskCard).
            const colTasks = tasks.filter((t) => t.status === col.status && !t.parentTaskId);
            return (
              <div key={col.status} className="flex flex-col gap-[var(--space-2)]">
                <p className="text-xs uppercase tracking-wide text-[var(--color-text-muted)]">
                  {col.label} · {colTasks.length}
                </p>
                <div className="flex flex-col gap-[var(--space-2)]">
                  {colTasks.map((task) => (
                    <TaskCard
                      key={task.id}
                      task={task}
                      subtasks={tasks.filter((t) => t.parentTaskId === task.id)}
                      onMove={(status) => updateStatus.mutate({ taskId: task.id, status })}
                      onMoveSubtask={(subtaskId, status) => updateStatus.mutate({ taskId: subtaskId, status })}
                      onAddSubtask={(title) => createTask.mutate({ title, parentTaskId: task.id })}
                    />
                  ))}
                </div>
                {col.status === "backlog" && (
                  <QuickAdd onAdd={(title) => createTask.mutate({ title })} />
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
