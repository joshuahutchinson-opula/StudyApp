import type { Discipline } from "./discipline.js";

// Discipline-flavored system copy: the small loading/empty/status strings a
// student sees dozens of times a session. These carry as much of a
// discipline's voice as the color palette does — a clinical "Pulling the
// chart…" reads nothing like Software's "$ mounting binder…" — so they're
// data, not a single hardcoded string reused everywhere.
export type MicrocopyKey =
  | "loading"
  | "loadingBinder"
  | "loadingTasks"
  | "loadingReview"
  | "emptyTasks"
  | "searching"
  | "emptyCitations"
  | "loadingCitations"
  | "allCaughtUp"
  | "noCardsDue"
  | "sessionReady"
  | "loadingCase";

export const MICROCOPY: Record<Discipline, Record<MicrocopyKey, string>> = {
  medicine: {
    loading: "Loading…",
    loadingBinder: "Pulling the chart…",
    loadingTasks: "Checking the schedule…",
    loadingReview: "Pulling the queue…",
    emptyTasks: "No orders pending.",
    searching: "Searching the chart…",
    emptyCitations: "No sources cited yet.",
    loadingCitations: "Pulling references…",
    allCaughtUp: "Rounds complete.",
    noCardsDue: "No cards are due right now.",
    sessionReady: "Ready to round.",
    loadingCase: "Pulling the vignette…",
  },
  software: {
    loading: "$ loading…",
    loadingBinder: "$ mounting binder…",
    loadingTasks: "$ fetching backlog…",
    loadingReview: "$ fetching queue…",
    emptyTasks: "// backlog is empty",
    searching: "$ grep -r …",
    emptyCitations: "// no sources linked",
    loadingCitations: "$ resolving refs…",
    allCaughtUp: "queue drained.",
    noCardsDue: "nothing due — 0 results",
    sessionReady: "$ ready",
    loadingCase: "$ loading case…",
  },
  writing: {
    loading: "Loading…",
    loadingBinder: "Turning to your desk…",
    loadingTasks: "Gathering your drafts…",
    loadingReview: "Gathering your flashcards…",
    emptyTasks: "Nothing on the docket.",
    searching: "Reading through your notes…",
    emptyCitations: "No sources gathered yet.",
    loadingCitations: "Gathering your sources…",
    allCaughtUp: "The margin is quiet.",
    noCardsDue: "Nothing is due for review right now.",
    sessionReady: "The page is waiting.",
    loadingCase: "Loading…",
  },
  engineering: {
    loading: "Loading…",
    loadingBinder: "Loading the drawing set…",
    loadingTasks: "Pulling the problem set…",
    loadingReview: "Loading the queue…",
    emptyTasks: "No open items.",
    searching: "Querying…",
    emptyCitations: "No references logged.",
    loadingCitations: "Loading references…",
    allCaughtUp: "Set complete.",
    noCardsDue: "Nothing due — queue is clear.",
    sessionReady: "Standing by.",
    loadingCase: "Loading…",
  },
  arts: {
    loading: "Loading…",
    loadingBinder: "Opening the studio…",
    loadingTasks: "Checking the wall…",
    loadingReview: "Checking the wall…",
    emptyTasks: "Nothing pinned up.",
    searching: "Looking through the studio…",
    emptyCitations: "No references saved.",
    loadingCitations: "Gathering references…",
    allCaughtUp: "The studio is quiet.",
    noCardsDue: "Nothing waiting on you right now.",
    sessionReady: "The studio is open.",
    loadingCase: "Loading…",
  },
};
