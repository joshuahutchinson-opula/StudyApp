export type DifferentialWeight = "primary" | "reasonable" | "unlikely";
export interface DifferentialOption {
  label: string;
  weight: DifferentialWeight;
}
export interface TestOption {
  label: string;
  indicated: boolean;
}

export interface CaseFeedback {
  differential: {
    matchedPrimary: string[];
    matchedReasonable: string[];
    missedPrimary: string[];
    extras: string[];
  };
  tests: {
    appropriate: string[];
    unnecessary: string[];
    missedIndicated: string[];
  };
  differentialScore: number;
  testScore: number;
}

function normalize(s: string) {
  return s.trim().toLowerCase();
}

// Loose match: a student's free-text entry counts if it contains, or is
// contained by, the expected option's label — avoids penalizing phrasing
// differences ("AFib" vs "atrial fibrillation") without needing real NLP.
function looselyMatches(entry: string, label: string) {
  const a = normalize(entry);
  const b = normalize(label);
  return a === b || a.includes(b) || b.includes(a);
}

export function scoreDifferential(
  submitted: string[],
  options: DifferentialOption[],
): CaseFeedback["differential"] & { score: number } {
  const primaryOptions = options.filter((o) => o.weight === "primary");
  const reasonableOptions = options.filter((o) => o.weight === "reasonable");

  const matchedPrimary = primaryOptions.filter((o) => submitted.some((s) => looselyMatches(s, o.label)));
  const matchedReasonable = reasonableOptions.filter((o) =>
    submitted.some((s) => looselyMatches(s, o.label)),
  );
  const missedPrimary = primaryOptions.filter((o) => !matchedPrimary.includes(o));
  const extras = submitted.filter((s) => !options.some((o) => looselyMatches(s, o.label)));

  const maxPoints = primaryOptions.length * 3 + reasonableOptions.length * 1;
  const earned = matchedPrimary.length * 3 + matchedReasonable.length * 1;
  const score = maxPoints > 0 ? Math.round((earned / maxPoints) * 100) : 100;

  return {
    matchedPrimary: matchedPrimary.map((o) => o.label),
    matchedReasonable: matchedReasonable.map((o) => o.label),
    missedPrimary: missedPrimary.map((o) => o.label),
    extras,
    score,
  };
}

export function scoreTests(
  ordered: string[],
  options: TestOption[],
): CaseFeedback["tests"] & { score: number } {
  const indicated = options.filter((o) => o.indicated);
  const appropriate = indicated.filter((o) => ordered.some((t) => looselyMatches(t, o.label)));
  const unnecessary = options.filter(
    (o) => !o.indicated && ordered.some((t) => looselyMatches(t, o.label)),
  );
  const missedIndicated = indicated.filter((o) => !appropriate.includes(o));

  const raw = indicated.length > 0 ? (appropriate.length - 0.5 * unnecessary.length) / indicated.length : 1;
  const score = Math.max(0, Math.min(100, Math.round(raw * 100)));

  return {
    appropriate: appropriate.map((o) => o.label),
    unnecessary: unnecessary.map((o) => o.label),
    missedIndicated: missedIndicated.map((o) => o.label),
    score,
  };
}

export function buildFeedback(
  differential: string[],
  orderedTests: string[],
  differentialOptions: DifferentialOption[],
  testOptions: TestOption[],
): { feedback: CaseFeedback; score: number } {
  const diffResult = scoreDifferential(differential, differentialOptions);
  const testResult = scoreTests(orderedTests, testOptions);

  const feedback: CaseFeedback = {
    differential: {
      matchedPrimary: diffResult.matchedPrimary,
      matchedReasonable: diffResult.matchedReasonable,
      missedPrimary: diffResult.missedPrimary,
      extras: diffResult.extras,
    },
    tests: {
      appropriate: testResult.appropriate,
      unnecessary: testResult.unnecessary,
      missedIndicated: testResult.missedIndicated,
    },
    differentialScore: diffResult.score,
    testScore: testResult.score,
  };

  return { feedback, score: Math.round((diffResult.score + testResult.score) / 2) };
}
