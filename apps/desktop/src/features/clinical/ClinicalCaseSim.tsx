import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { SpringButton } from "../../components/SpringButton";
import { SystemMessage } from "../../components/SystemMessage";
import { useSpring } from "../../hooks/useSpring";
import { useCase, useCases, useSubmitAttempt } from "./api";
import type { CaseAttemptResult } from "./types";

function DifferentialInput({
  entries,
  onChange,
}: {
  entries: string[];
  onChange: (entries: string[]) => void;
}) {
  const spring = useSpring();
  const [draft, setDraft] = useState("");

  function commit() {
    const value = draft.trim();
    if (value && !entries.includes(value)) onChange([...entries, value]);
    setDraft("");
  }

  return (
    <div>
      <div className="mb-[var(--space-2)] flex flex-wrap gap-[var(--space-2)]">
        <AnimatePresence>
          {entries.map((entry) => (
            <motion.span
              key={entry}
              layout
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              transition={spring.base}
              className="flex items-center gap-[var(--space-1)] rounded-full px-[var(--space-3)] py-[var(--space-1)] text-sm"
              style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)" }}
            >
              {entry}
              <SpringButton
                type="button"
                onClick={() => onChange(entries.filter((e) => e !== entry))}
                aria-label={`Remove ${entry}`}
                whileTap={{ scale: 0.8 }}
                className="text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
              >
                ×
              </SpringButton>
            </motion.span>
          ))}
        </AnimatePresence>
      </div>
      <input
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            commit();
          }
        }}
        onBlur={commit}
        placeholder="Type a diagnosis, press Enter…"
        className="w-full rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-transparent px-[var(--space-3)] py-[var(--space-2)] text-sm placeholder:text-[var(--color-text-muted)] focus:outline-none"
      />
    </div>
  );
}

function FeedbackPanel({ result, onRetry }: { result: CaseAttemptResult; onRetry: () => void }) {
  const { feedback } = result;
  return (
    <div className="flex flex-col gap-[var(--space-5)]">
      <div className="flex items-baseline gap-[var(--space-4)]">
        <p className="text-4xl" style={{ fontFamily: "var(--font-display)" }}>
          {result.score}
        </p>
        <p className="text-sm text-[var(--color-text-muted)]">overall · rubric-based, no AI grading</p>
      </div>

      <div>
        <p className="mb-[var(--space-2)] text-sm" style={{ fontWeight: "var(--font-weight-body)" }}>
          Differential — {feedback.differentialScore}
          <span className="text-[var(--color-text-muted)]">/100</span>
        </p>
        <ul className="flex flex-col gap-[var(--space-1)] text-sm">
          {feedback.differential.matchedPrimary.map((d) => (
            <li key={d} style={{ color: "#22c55e" }}>✓ {d} — the key diagnosis</li>
          ))}
          {feedback.differential.matchedReasonable.map((d) => (
            <li key={d} style={{ color: "#3b82f6" }}>✓ {d} — reasonable to consider</li>
          ))}
          {feedback.differential.missedPrimary.map((d) => (
            <li key={d} style={{ color: "#dc2626" }}>✗ Missed: {d}</li>
          ))}
          {feedback.differential.extras.map((d) => (
            <li key={d} className="text-[var(--color-text-muted)]">— {d} (not on the expected list)</li>
          ))}
        </ul>
      </div>

      <div>
        <p className="mb-[var(--space-2)] text-sm" style={{ fontWeight: "var(--font-weight-body)" }}>
          Workup — {feedback.testScore}
          <span className="text-[var(--color-text-muted)]">/100</span>
        </p>
        <ul className="flex flex-col gap-[var(--space-1)] text-sm">
          {feedback.tests.appropriate.map((t) => (
            <li key={t} style={{ color: "#22c55e" }}>✓ {t} — indicated</li>
          ))}
          {feedback.tests.unnecessary.map((t) => (
            <li key={t} style={{ color: "#eab308" }}>△ {t} — low yield here</li>
          ))}
          {feedback.tests.missedIndicated.map((t) => (
            <li key={t} style={{ color: "#dc2626" }}>✗ Missed: {t}</li>
          ))}
        </ul>
      </div>

      <SpringButton
        type="button"
        onClick={onRetry}
        whileTap={{ scale: 0.95 }}
        className="self-start rounded-[var(--radius-sm)] px-[var(--space-4)] py-[var(--space-2)] text-sm"
        style={{ background: "var(--color-accent)", color: "#fff" }}
      >
        Try again
      </SpringButton>
    </div>
  );
}

export function ClinicalCaseSim({ userId }: { userId: string }) {
  const spring = useSpring();
  const { data: cases, isLoading: casesLoading } = useCases();
  const firstCaseId = cases?.[0]?.id;
  const { data: clinicalCase, isLoading: caseLoading } = useCase(firstCaseId);
  const submitAttempt = useSubmitAttempt(firstCaseId ?? "", userId);

  const [differential, setDifferential] = useState<string[]>([]);
  const [tests, setTests] = useState<string[]>([]);
  const [result, setResult] = useState<CaseAttemptResult | null>(null);

  if (casesLoading || caseLoading || !clinicalCase) {
    return (
      <div className="p-[var(--space-7)]">
        <SystemMessage msgKey="loadingCase" />
      </div>
    );
  }

  function toggleTest(test: string) {
    setTests((t) => (t.includes(test) ? t.filter((x) => x !== test) : [...t, test]));
  }

  function reset() {
    setDifferential([]);
    setTests([]);
    setResult(null);
  }

  return (
    <div className="mx-auto max-w-3xl px-[var(--space-4)] py-[var(--space-5)]">
      <p className="mb-[var(--space-1)] text-xs uppercase tracking-wide text-[var(--color-text-muted)]">
        Clinical reasoning
      </p>
      <h1 className="mb-[var(--space-4)] text-2xl" style={{ fontFamily: "var(--font-display)" }}>
        {clinicalCase.title}
      </h1>
      <p className="mb-[var(--space-6)] leading-relaxed text-[var(--color-text)]">{clinicalCase.vignette}</p>

      {result ? (
        <FeedbackPanel result={result} onRetry={reset} />
      ) : (
        <div className="flex flex-col gap-[var(--space-6)]">
          <div>
            <p className="mb-[var(--space-2)] text-sm" style={{ fontWeight: "var(--font-weight-body)" }}>Your differential</p>
            <DifferentialInput entries={differential} onChange={setDifferential} />
          </div>

          <div>
            <p className="mb-[var(--space-2)] text-sm" style={{ fontWeight: "var(--font-weight-body)" }}>Order your workup</p>
            <div className="grid grid-cols-2 gap-[var(--space-2)]">
              {clinicalCase.testChoices.map((test) => (
                <motion.label
                  key={test}
                  whileTap={{ scale: 0.97 }}
                  animate={{
                    borderColor: tests.includes(test) ? "var(--color-accent)" : "var(--color-border)",
                  }}
                  transition={spring.fast}
                  className="flex items-center gap-[var(--space-2)] rounded-[var(--radius-sm)] border px-[var(--space-3)] py-[var(--space-2)] text-sm"
                >
                  <input
                    type="checkbox"
                    checked={tests.includes(test)}
                    onChange={() => toggleTest(test)}
                  />
                  {test}
                </motion.label>
              ))}
            </div>
          </div>

          <SpringButton
            type="button"
            disabled={differential.length === 0 || submitAttempt.isPending}
            onClick={() =>
              submitAttempt.mutate(
                { differential, orderedTests: tests },
                { onSuccess: setResult },
              )
            }
            whileTap={differential.length === 0 || submitAttempt.isPending ? undefined : { scale: 0.95 }}
            className="self-start rounded-[var(--radius-sm)] px-[var(--space-5)] py-[var(--space-3)] text-sm disabled:opacity-40"
            style={{ background: "var(--color-accent)", color: "#fff" }}
          >
            {submitAttempt.isPending ? "Grading…" : "Submit"}
          </SpringButton>
        </div>
      )}
    </div>
  );
}
