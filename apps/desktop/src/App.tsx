import { lazy, Suspense, useEffect, useState } from "react";
import { DISCIPLINES, type Discipline } from "@the-desk/shared";
import { DISCIPLINE_META } from "@the-desk/ui";
import { useDisciplineStore } from "./store/useDisciplineStore";
import { useAuthStore } from "./store/useAuthStore";
import { LoginScreen } from "./features/auth/LoginScreen";
import { useBinders } from "./features/binder/api";
import { BinderView } from "./features/binder/BinderView";
import { ReviewSession } from "./features/review/ReviewSession";
import { PlannerView } from "./features/planner/PlannerView";
import { ClinicalCaseSim } from "./features/clinical/ClinicalCaseSim";
import { CitationLibrary } from "./features/citations/CitationLibrary";
import { FocusTimer } from "./features/focus/FocusTimer";
import { SearchView } from "./features/search/SearchView";
import { ManuscriptTimeline } from "./features/manuscript/ManuscriptTimeline";
import { CritiqueRoom } from "./features/critique/CritiqueRoom";

// Cytoscape is a large dependency — code-split so it's only fetched when a
// student actually opens the graph tab, not on every app load.
const GraphView = lazy(() => import("./features/graph/GraphView").then((m) => ({ default: m.GraphView })));

function DisciplinePicker({ onSelect }: { onSelect: (d: Discipline) => void }) {
  return (
    <div className="mx-auto flex min-h-screen max-w-2xl flex-col justify-center px-6">
      <h1 className="mb-2 text-sm tracking-wide text-[var(--color-text-muted)]">The Desk</h1>
      <p className="mb-10 text-2xl" style={{ fontFamily: "var(--font-display)" }}>
        Which desk is yours?
      </p>
      <div className="flex flex-col divide-y divide-[var(--color-border)] border-y border-[var(--color-border)]">
        {DISCIPLINES.map((discipline) => {
          const meta = DISCIPLINE_META[discipline];
          return (
            <button
              key={discipline}
              type="button"
              onClick={() => onSelect(discipline)}
              className="group flex items-baseline justify-between py-5 text-left transition-colors"
            >
              <span data-discipline={discipline} className="flex items-baseline gap-3">
                <span
                  aria-hidden
                  className="inline-block h-2 w-2 rounded-full"
                  style={{ background: "var(--color-accent)" }}
                />
                <span className="text-xl" style={{ fontFamily: "var(--font-display)" }}>
                  {meta.label}
                </span>
              </span>
              <span className="text-sm text-[var(--color-text-muted)] opacity-0 transition-opacity group-hover:opacity-100">
                {meta.tagline}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

type Mode =
  | "binder"
  | "planner"
  | "review"
  | "cases"
  | "graph"
  | "citations"
  | "focus"
  | "search"
  | "timeline"
  | "critique";

function Desk({
  userId,
  discipline,
  onSwitchDiscipline,
  onLogOut,
}: {
  userId: string;
  discipline: Discipline;
  onSwitchDiscipline: () => void;
  onLogOut: () => void;
}) {
  const meta = DISCIPLINE_META[discipline];
  const { data: binders, isLoading } = useBinders(userId);
  const binder = binders?.find((b) => b.discipline === discipline);
  const [mode, setMode] = useState<Mode>("binder");
  const [binderTargetPageId, setBinderTargetPageId] = useState<string | undefined>(undefined);

  if (isLoading) {
    return <div className="p-10 text-sm text-[var(--color-text-muted)]">Loading…</div>;
  }

  // Signature features are discipline-specific, not part of the shared spine:
  // "cases" (Medicine), "timeline" (Writing), "critique" (Arts).
  const baseTabs: Mode[] = ["binder", "planner", "graph", "search", "citations", "focus"];
  const signatureTab: Mode | null =
    discipline === "medicine" ? "cases" : discipline === "writing" ? "timeline" : discipline === "arts" ? "critique" : null;
  const navTabs: Mode[] = signatureTab ? [...baseTabs, signatureTab] : baseTabs;

  return (
    <div className="flex min-h-screen flex-col">
      <div className="flex items-center gap-5 border-b border-[var(--color-border)] px-4 py-2 text-sm">
        <button type="button" onClick={onSwitchDiscipline} className="text-[var(--color-text-muted)] hover:text-[var(--color-text)]">
          The Desk
        </button>
        <span className="text-[var(--color-border)]">/</span>
        {navTabs.map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => setMode(m)}
            className="capitalize"
            style={{
              color: mode === m ? "var(--color-text)" : "var(--color-text-muted)",
              fontWeight: mode === m ? 600 : 400,
            }}
          >
            {m === "cases"
              ? "Clinical Cases"
              : m === "graph"
                ? "Graph"
                : m === "citations"
                  ? "Citations"
                  : m === "focus"
                    ? "Focus"
                    : m === "search"
                      ? "Search"
                      : m === "timeline"
                        ? "Timeline"
                        : m === "critique"
                          ? "Critique Room"
                          : m}
          </button>
        ))}
        <button
          type="button"
          onClick={onLogOut}
          className="ml-auto text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
        >
          Log out
        </button>
      </div>

      <div className="flex-1">
        {mode === "planner" && <PlannerView userId={userId} discipline={discipline} />}

        {mode === "review" && (
          <ReviewSession userId={userId} discipline={discipline} onExit={() => setMode("binder")} />
        )}

        {mode === "cases" && <ClinicalCaseSim userId={userId} />}

        {mode === "timeline" && binder && <ManuscriptTimeline binderId={binder.id} />}

        {mode === "critique" && binder && <CritiqueRoom binderId={binder.id} />}

        {mode === "citations" && <CitationLibrary userId={userId} discipline={discipline} />}

        {mode === "focus" && <FocusTimer userId={userId} />}

        {mode === "graph" && (
          <Suspense
            fallback={<div className="p-10 text-sm text-[var(--color-text-muted)]">Loading graph…</div>}
          >
            <GraphView
              userId={userId}
              discipline={discipline}
              onOpenNote={(pageId) => {
                setBinderTargetPageId(pageId);
                setMode("binder");
              }}
            />
          </Suspense>
        )}

        {mode === "search" && (
          <SearchView
            userId={userId}
            discipline={discipline}
            onOpenPage={(pageId) => {
              setBinderTargetPageId(pageId);
              setMode("binder");
            }}
          />
        )}

        {mode === "binder" &&
          (binder ? (
            <BinderView
              key={binderTargetPageId ?? "default"}
              userId={userId}
              binderId={binder.id}
              discipline={discipline}
              initialPageId={binderTargetPageId}
              onOpenReview={() => setMode("review")}
            />
          ) : (
            <div className="mx-auto flex max-w-2xl flex-col justify-center px-6 py-20">
              <p className="mb-2 text-sm tracking-wide text-[var(--color-text-muted)]">{meta.label}</p>
              <h1 className="text-3xl" style={{ fontFamily: "var(--font-display)" }}>
                {meta.tagline}
              </h1>
              <p className="mt-8 text-sm text-[var(--color-text-muted)]">
                No binder yet for this discipline — try Planner above, or switch to Medicine for the full binder.
              </p>
            </div>
          ))}
      </div>
    </div>
  );
}

export default function App() {
  const token = useAuthStore((s) => s.token);
  const user = useAuthStore((s) => s.user);
  const logOut = useAuthStore((s) => s.logOut);
  const activeDiscipline = useDisciplineStore((s) => s.activeDiscipline);
  const setDiscipline = useDisciplineStore((s) => s.setDiscipline);

  useEffect(() => {
    if (activeDiscipline) {
      document.documentElement.setAttribute("data-discipline", activeDiscipline);
    } else {
      document.documentElement.removeAttribute("data-discipline");
    }
  }, [activeDiscipline]);

  // Skip the picker right after login/register — land directly in the
  // discipline the account was created with, but only as a one-time default;
  // switching away afterward is a normal, freely reversible UI choice, not
  // tied back to the account record.
  useEffect(() => {
    if (user && !activeDiscipline) setDiscipline(user.activeDiscipline);
  }, [user, activeDiscipline, setDiscipline]);

  if (!token || !user) {
    return <LoginScreen />;
  }

  if (!activeDiscipline) {
    return <DisciplinePicker onSelect={setDiscipline} />;
  }

  return (
    <Desk
      userId={user.id}
      discipline={activeDiscipline}
      onSwitchDiscipline={() => useDisciplineStore.setState({ activeDiscipline: null })}
      onLogOut={logOut}
    />
  );
}
