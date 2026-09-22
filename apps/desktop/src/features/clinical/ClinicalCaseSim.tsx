import { useState } from "react";
import { useCase, useCases, useSubmitAttempt } from "./api";
import type { CaseAttemptResult } from "./types";

function DifferentialInput({
  entries,
  onChange,
}: {
  entries: string[];
  onChange: (entries: string[]) => void;
}) {
  const [draft, setDraft] = useState("");

  function commit() {
    const value = draft.trim();
    if (value && !entries.includes(value)) onChange([...entries, value]);
    setDraft("");
  }

  return (
    <div>
      <div className="mb-2 flex flex-wrap gap-2">
        {entries.map((entry) => (
          <span
            key={entry}
            className="flex items-center gap-1.5 rounded-full px-3 py-1 text-sm"
            style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)" }}
          >
            {entry}
            <button
              type="button"
              onClick={() => onChange(entries.filter((e) => e !== entry))}
              aria-label={`Remove ${entry}`}
              className="text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
            >
              ×
            </button>
          </span>
        ))}
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
        className="w-full rounded-[var(--radius-base)] border border-[var(--color-border)] bg-transparent px-3 py-2 text-sm placeholder:text-[var(--color-text-muted)] focus:outline-none"
      />
    </div>
  );
}

function FeedbackPanel({ result, onRetry }: { result: CaseAttemptResult; onRetry: () => void }) {
  const { feedback } = result;
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-baseline gap-4">
        <p className="text-4xl" style={{ fontFamily: "var(--font-display)" }}>
          {result.score}
        </p>
        <p className="text-sm text-[var(--color-text-muted)]">overall · rubric-based, no AI grading</p>
      </div>

      <div>
        <p className="mb-2 text-sm font-medium">
          Differential — {feedback.differentialScore}
          <span className="text-[var(--color-text-muted)]">/100</span>
        </p>
        <ul className="flex flex-col gap-1 text-sm">
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
        <p className="mb-2 text-sm font-medium">
          Workup — {feedback.testScore}
          <span className="text-[var(--color-text-muted)]">/100</span>
        </p>
        <ul className="flex flex-col gap-1 text-sm">
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

      <button
        type="button"
        onClick={onRetry}
        className="self-start rounded-[var(--radius-base)] px-4 py-2 text-sm"
        style={{ background: "var(--color-accent)", color: "#fff" }}
      >
        Try again
      </button>
    </div>
  );
}

export function ClinicalCaseSim({ userId }: { userId: string }) {
  const { data: cases, isLoading: casesLoading } = useCases();
  const firstCaseId = cases?.[0]?.id;
  const { data: clinicalCase, isLoading: caseLoading } = useCase(firstCaseId);
  const submitAttempt = useSubmitAttempt(firstCaseId ?? "", userId);

  const [differential, setDifferential] = useState<string[]>([]);
  const [tests, setTests] = useState<string[]>([]);
  const [result, setResult] = useState<CaseAttemptResult | null>(null);

  if (casesLoading || caseLoading || !clinicalCase) {
    return <div className="p-10 text-sm text-[var(--color-text-muted)]">Loading case…</div>;
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
    <div className="mx-auto max-w-3xl px-4 py-6">
      <p className="mb-1 text-xs uppercase tracking-wide text-[var(--color-text-muted)]">
        Clinical reasoning
      </p>
      <h1 className="mb-4 text-2xl" style={{ fontFamily: "var(--font-display)" }}>
        {clinicalCase.title}
      </h1>
      <p className="mb-8 leading-relaxed text-[var(--color-text)]">{clinicalCase.vignette}</p>

      {result ? (
        <FeedbackPanel result={result} onRetry={reset} />
      ) : (
        <div className="flex flex-col gap-8">
          <div>
            <p className="mb-2 text-sm font-medium">Your differential</p>
            <DifferentialInput entries={differential} onChange={setDifferential} />
          </div>

          <div>
            <p className="mb-2 text-sm font-medium">Order your workup</p>
            <div className="grid grid-cols-2 gap-2">
              {clinicalCase.testChoices.map((test) => (
                <label
                  key={test}
                  className="flex items-center gap-2 rounded-[var(--radius-base)] border px-3 py-2 text-sm"
                  style={{
                    borderColor: tests.includes(test) ? "var(--color-accent)" : "var(--color-border)",
                  }}
                >
                  <input
                    type="checkbox"
                    checked={tests.includes(test)}
                    onChange={() => toggleTest(test)}
                  />
                  {test}
                </label>
              ))}
            </div>
          </div>

          <button
            type="button"
            disabled={differential.length === 0 || submitAttempt.isPending}
            onClick={() =>
              submitAttempt.mutate(
                { differential, orderedTests: tests },
                { onSuccess: setResult },
              )
            }
            className="self-start rounded-[var(--radius-base)] px-5 py-2.5 text-sm disabled:opacity-40"
            style={{ background: "var(--color-accent)", color: "#fff" }}
          >
            {submitAttempt.isPending ? "Grading…" : "Submit"}
          </button>
        </div>
      )}
    </div>
  );
}
