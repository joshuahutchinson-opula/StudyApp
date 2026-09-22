import { useEffect, useState } from "react";
import { DEMO_USER_ID, DISCIPLINES, type Discipline } from "@the-desk/shared";
import { DISCIPLINE_META } from "@the-desk/ui";
import { useDisciplineStore } from "./store/useDisciplineStore";
import { useBinders } from "./features/binder/api";
import { BinderView } from "./features/binder/BinderView";
import { ReviewSession } from "./features/review/ReviewSession";
import { PlannerView } from "./features/planner/PlannerView";
import { ClinicalCaseSim } from "./features/clinical/ClinicalCaseSim";

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

type Mode = "binder" | "planner" | "review" | "cases";

function Desk({ discipline, onSwitchDiscipline }: { discipline: Discipline; onSwitchDiscipline: () => void }) {
  const meta = DISCIPLINE_META[discipline];
  const { data: binders, isLoading } = useBinders(DEMO_USER_ID);
  const binder = binders?.find((b) => b.discipline === discipline);
  const [mode, setMode] = useState<Mode>("binder");

  if (isLoading) {
    return <div className="p-10 text-sm text-[var(--color-text-muted)]">Loading…</div>;
  }

  // "cases" (clinical reasoning simulator) is a Medicine-only signature feature,
  // not part of the shared spine — other disciplines get their own such features later.
  const navTabs: Mode[] = discipline === "medicine" ? ["binder", "planner", "cases"] : ["binder", "planner"];

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
            {m === "cases" ? "Clinical Cases" : m}
          </button>
        ))}
      </div>

      <div className="flex-1">
        {mode === "planner" && <PlannerView userId={DEMO_USER_ID} discipline={discipline} />}

        {mode === "review" && <ReviewSession userId={DEMO_USER_ID} onExit={() => setMode("binder")} />}

        {mode === "cases" && <ClinicalCaseSim userId={DEMO_USER_ID} />}

        {mode === "binder" &&
          (binder ? (
            <BinderView binderId={binder.id} onOpenReview={() => setMode("review")} />
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
  const activeDiscipline = useDisciplineStore((s) => s.activeDiscipline);
  const setDiscipline = useDisciplineStore((s) => s.setDiscipline);

  useEffect(() => {
    if (activeDiscipline) {
      document.documentElement.setAttribute("data-discipline", activeDiscipline);
    } else {
      document.documentElement.removeAttribute("data-discipline");
    }
  }, [activeDiscipline]);

  if (!activeDiscipline) {
    return <DisciplinePicker onSelect={setDiscipline} />;
  }

  return (
    <Desk
      discipline={activeDiscipline}
      onSwitchDiscipline={() => useDisciplineStore.setState({ activeDiscipline: null })}
    />
  );
}
