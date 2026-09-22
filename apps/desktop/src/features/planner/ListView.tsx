import type { Task, TaskStatus } from "@the-desk/shared";

const STATUS_LABEL: Record<TaskStatus, string> = {
  backlog: "Backlog",
  todo: "To Do",
  in_progress: "In Progress",
  done: "Done",
};

const STATUS_COLOR: Record<TaskStatus, string> = {
  backlog: "#a1a1aa",
  todo: "#eab308",
  in_progress: "#3b82f6",
  done: "#22c55e",
};

function formatDate(dueAt: string | null): string {
  if (!dueAt) return "—";
  return new Date(dueAt).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export function ListView({ tasks }: { tasks: Task[] }) {
  const topLevel = tasks.filter((t) => !t.parentTaskId);
  const sorted = [...topLevel].sort((a, b) => {
    const aTime = a.dueAt ? new Date(a.dueAt as unknown as string).getTime() : Infinity;
    const bTime = b.dueAt ? new Date(b.dueAt as unknown as string).getTime() : Infinity;
    return aTime - bTime;
  });

  return (
    <div className="flex flex-col divide-y divide-[var(--color-border)] rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)]">
      <div className="grid grid-cols-[1fr_120px_100px] gap-[var(--space-2)] px-[var(--space-4)] py-[var(--space-2)] text-xs uppercase tracking-wide text-[var(--color-text-muted)]">
        <span>Task</span>
        <span>Status</span>
        <span>Due</span>
      </div>
      {sorted.length === 0 && (
        <p className="px-[var(--space-4)] py-[var(--space-6)] text-sm text-[var(--color-text-muted)]">No tasks yet.</p>
      )}
      {sorted.map((task) => {
        const subtasks = tasks.filter((t) => t.parentTaskId === task.id);
        const doneCount = subtasks.filter((s) => s.status === "done").length;
        return (
          <div key={task.id} className="grid grid-cols-[1fr_120px_100px] items-center gap-[var(--space-2)] px-[var(--space-4)] py-[var(--space-2)] text-sm">
            <span>
              {task.title}
              {subtasks.length > 0 && (
                <span className="ml-[var(--space-2)] text-xs text-[var(--color-text-muted)]">
                  {doneCount}/{subtasks.length}
                </span>
              )}
            </span>
            <span className="flex items-center gap-[var(--space-1)] text-xs">
              <span
                aria-hidden
                className="h-1.5 w-1.5 rounded-full"
                style={{ background: STATUS_COLOR[task.status] }}
              />
              {STATUS_LABEL[task.status]}
            </span>
            <span className="text-xs text-[var(--color-text-muted)]">
              {formatDate(task.dueAt as unknown as string | null)}
            </span>
          </div>
        );
      })}
    </div>
  );
}
