import { useMemo } from "react";
import { create, all } from "mathjs";

const math = create(all, {});

interface LineResult {
  input: string;
  output: string | null;
  error: string | null;
}

function evaluateExpression(expression: string): LineResult[] {
  const lines = expression
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);
  // A shared scope object across lines is what makes this "live and
  // computable" rather than one-shot: `F = 12 kN` on one line, then `F / A`
  // on the next, resolves F from what was assigned above — mathjs carries
  // real units through the arithmetic and throws on mismatched units
  // (e.g. adding a length to a mass) rather than silently coercing.
  const scope: Record<string, unknown> = {};
  return lines.map((line) => {
    try {
      const result: unknown = math.evaluate(line, scope);
      if (result === undefined) return { input: line, output: null, error: null };
      return { input: line, output: math.format(result, { precision: 6 }), error: null };
    } catch (err) {
      return { input: line, output: null, error: err instanceof Error ? err.message : String(err) };
    }
  });
}

export function FormulaBlock({ expression }: { expression: string }) {
  const results = useMemo(() => evaluateExpression(expression), [expression]);

  return (
    <div
      className="flex flex-col gap-1 rounded-[var(--radius-base)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4"
      style={{ fontFamily: "var(--font-mono)" }}
    >
      {results.map((r, i) => (
        <div key={i} className="flex items-baseline justify-between gap-4 text-sm">
          <span className="text-[var(--color-text)]">{r.input}</span>
          {r.error ? (
            <span className="text-right" style={{ color: "#dc2626" }}>
              ⚠ {r.error}
            </span>
          ) : (
            r.output !== null && <span style={{ color: "var(--color-accent)" }}>= {r.output}</span>
          )}
        </div>
      ))}
    </div>
  );
}
