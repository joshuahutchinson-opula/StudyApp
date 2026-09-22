import type { Discipline } from "./discipline.js";

// The margin co-annotator: a second, clearly-labeled voice next to a
// student's own margin note. This is deliberately NOT an LLM call — no AI
// provider is wired into this app yet — it's a small deterministic template
// set per discipline, picked by a stable hash of the note's own text so the
// same note always produces the same companion prompt (no flicker on
// re-render, no network round-trip). Honest about what it is: a built-in
// study prompt, not a person or a model responding to you.
const STUDY_PROMPTS: Record<Discipline, string[]> = {
  medicine: [
    "What would change your management here?",
    "How would you explain this to the patient?",
    "What's the differential if this finding were absent?",
    "What's the one thing you'd double-check before acting on this?",
  ],
  software: [
    "What's the time complexity here?",
    "What breaks if this input is empty?",
    "Would this survive a code review as written?",
    "What's the simplest input that would break this?",
  ],
  writing: [
    "Who is this sentence really for?",
    "What would you cut if this had to be half as long?",
    "Read it aloud — where does it stumble?",
    "Is this the strongest version of this idea, or just the first one?",
  ],
  engineering: [
    "What are the units here?",
    "What's the failure mode if this tolerance is exceeded?",
    "What assumption is this calculation resting on?",
    "Would this still hold at 2x scale?",
  ],
  arts: [
    "What's the first thing the eye goes to here?",
    "What would this look like at twice the scale?",
    "Say why this choice, not another one.",
    "What's this note in service of — the piece, or the process?",
  ],
};

function stableHash(text: string): number {
  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    hash = (hash * 31 + text.charCodeAt(i)) >>> 0;
  }
  return hash;
}

/** A deterministic, discipline-flavored study prompt to sit beside a margin note. */
export function generateStudyPrompt(discipline: Discipline, noteBody: string): string {
  const prompts = STUDY_PROMPTS[discipline];
  const index = stableHash(noteBody) % prompts.length;
  return prompts[index]!;
}
