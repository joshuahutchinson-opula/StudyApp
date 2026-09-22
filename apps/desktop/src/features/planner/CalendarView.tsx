import { useState } from "react";
import type { Deadline, Task } from "@the-desk/shared";

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function isSameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

export function CalendarView({ tasks, deadlines }: { tasks: Task[]; deadlines: Deadline[] }) {
  const [cursor, setCursor] = useState(() => new Date());

  const year = cursor.getFullYear();
  const month = cursor.getMonth();
  const firstOfMonth = new Date(year, month, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const leadingBlanks = firstOfMonth.getDay();

  const cells: (Date | null)[] = [
    ...Array.from({ length: leadingBlanks }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => new Date(year, month, i + 1)),
  ];
  while (cells.length % 7 !== 0) cells.push(null);

  const tasksWithDue = tasks.filter((t) => t.dueAt);
  const today = new Date();

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => setCursor(new Date(year, month - 1, 1))}
          className="text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
        >
          ‹ Prev
        </button>
        <p className="text-sm font-medium">
          {firstOfMonth.toLocaleDateString(undefined, { month: "long", year: "numeric" })}
        </p>
        <button
          type="button"
          onClick={() => setCursor(new Date(year, month + 1, 1))}
          className="text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
        >
          Next ›
        </button>
      </div>

      <div className="grid grid-cols-7 gap-px overflow-hidden rounded-[var(--radius-base)] border border-[var(--color-border)] bg-[var(--color-border)]">
        {WEEKDAYS.map((d) => (
          <div key={d} className="bg-[var(--color-surface)] px-2 py-1 text-center text-xs text-[var(--color-text-muted)]">
            {d}
          </div>
        ))}
        {cells.map((date, i) => {
          if (!date) return <div key={i} className="min-h-24 bg-[var(--color-bg)]" />;
          const dayTasks = tasksWithDue.filter((t) => isSameDay(new Date(t.dueAt as unknown as string), date));
          const dayDeadlines = deadlines.filter((d) => isSameDay(new Date(d.dueAt as unknown as string), date));
          const isToday = isSameDay(date, today);
          return (
            <div key={i} className="min-h-24 bg-[var(--color-surface)] p-1.5">
              <p
                className="mb-1 text-xs"
                style={{
                  color: isToday ? "#fff" : "var(--color-text-muted)",
                  background: isToday ? "var(--color-accent)" : "transparent",
                  display: "inline-block",
                  borderRadius: 999,
                  width: 18,
                  height: 18,
                  textAlign: "center",
                  lineHeight: "18px",
                }}
              >
                {date.getDate()}
              </p>
              <div className="flex flex-col gap-0.5">
                {dayDeadlines.map((d) => (
                  <p
                    key={d.id}
                    className="truncate rounded-sm px-1 text-xs"
                    style={{ background: "var(--color-accent)", color: "#fff" }}
                    title={d.title}
                  >
                    {d.title}
                  </p>
                ))}
                {dayTasks.map((t) => (
                  <p
                    key={t.id}
                    className="truncate rounded-sm border px-1 text-xs"
                    style={{ borderColor: "var(--color-border)", color: "var(--color-text)" }}
                    title={t.title}
                  >
                    {t.title}
                  </p>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
