import { useEffect, useRef, useState } from "react";
import { motion } from "motion/react";
import { SpringButton } from "../../components/SpringButton";
import { useSpring } from "../../hooks/useSpring";
import { useEndSession, useStartSession, useStudySummary, type StudyMode } from "./api";

const MODE_TARGET_SECONDS: Record<StudyMode, number | null> = {
  pomodoro: 25 * 60,
  deep_work: 50 * 60,
  free: null,
};

const MODE_LABEL: Record<StudyMode, string> = {
  pomodoro: "Pomodoro · 25m",
  deep_work: "Deep Work · 50m",
  free: "Free session",
};

function formatTime(totalSeconds: number) {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export function FocusTimer({ userId }: { userId: string }) {
  const spring = useSpring();
  const [mode, setMode] = useState<StudyMode>("pomodoro");
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [justCompleted, setJustCompleted] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const { data: summary } = useStudySummary(userId);
  const startSession = useStartSession(userId);
  const endSession = useEndSession(userId);

  const target = MODE_TARGET_SECONDS[mode];
  const running = sessionId !== null;

  useEffect(() => {
    if (!running) return;
    intervalRef.current = setInterval(() => setElapsedSeconds((s) => s + 1), 1000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [running]);

  function finish(sid: string, seconds: number) {
    if (intervalRef.current) clearInterval(intervalRef.current);
    endSession.mutate({ sessionId: sid, focusMinutes: Math.max(1, Math.round(seconds / 60)) });
    setSessionId(null);
    setElapsedSeconds(0);
  }

  // Auto-complete a timed (non-free) session once it hits its target.
  useEffect(() => {
    if (running && sessionId && target !== null && elapsedSeconds >= target) {
      finish(sessionId, elapsedSeconds);
      setJustCompleted(true);
      setTimeout(() => setJustCompleted(false), 4000);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [elapsedSeconds, target, running, sessionId]);

  function start() {
    startSession.mutate(mode, { onSuccess: (session) => setSessionId(session.id) });
  }

  function stop() {
    if (sessionId) finish(sessionId, elapsedSeconds);
  }

  const remaining = target !== null ? Math.max(0, target - elapsedSeconds) : elapsedSeconds;

  return (
    <div className="mx-auto flex max-w-md flex-col items-center gap-[var(--space-5)] px-[var(--space-5)] py-[var(--space-8)] text-center">
      <div>
        <p className="text-xs uppercase tracking-wide text-[var(--color-text-muted)]">Focus</p>
        <h1 className="text-2xl" style={{ fontFamily: "var(--font-display)" }}>
          {justCompleted ? "Session complete" : running ? MODE_LABEL[mode] : "Ready when you are"}
        </h1>
      </div>

      <p className="text-6xl tabular-nums" style={{ fontFamily: "var(--font-mono)" }}>
        {formatTime(remaining)}
      </p>

      {!running ? (
        <>
          <div className="flex gap-[var(--space-2)]">
            {(Object.keys(MODE_TARGET_SECONDS) as StudyMode[]).map((m) => (
              <motion.button
                key={m}
                type="button"
                onClick={() => setMode(m)}
                whileTap={{ scale: 0.95 }}
                animate={{
                  borderColor: mode === m ? "var(--color-accent)" : "var(--color-border)",
                  color: mode === m ? "var(--color-accent)" : "var(--color-text-muted)",
                }}
                transition={spring.fast}
                className="rounded-[var(--radius-sm)] border px-[var(--space-3)] py-[var(--space-1)] text-sm"
              >
                {MODE_LABEL[m]}
              </motion.button>
            ))}
          </div>
          <SpringButton
            type="button"
            onClick={start}
            whileTap={{ scale: 0.92 }}
            className="rounded-[var(--radius-sm)] px-[var(--space-5)] py-[var(--space-2)] text-sm"
            style={{ background: "var(--color-accent)", color: "#fff" }}
          >
            Start
          </SpringButton>
        </>
      ) : (
        <SpringButton
          type="button"
          onClick={stop}
          whileTap={{ scale: 0.92 }}
          className="rounded-[var(--radius-sm)] border border-[var(--color-border)] px-[var(--space-5)] py-[var(--space-2)] text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
        >
          Stop
        </SpringButton>
      )}

      {summary && (
        <p className="text-sm text-[var(--color-text-muted)]">
          Today: {summary.todayMinutes} min across {summary.todaySessionCount} session
          {summary.todaySessionCount === 1 ? "" : "s"}
        </p>
      )}
    </div>
  );
}
