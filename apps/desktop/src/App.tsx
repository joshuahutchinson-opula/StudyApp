import { useEffect } from "react";
import { motion } from "motion/react";
import { DISCIPLINES, type Discipline } from "@the-desk/shared";
import { DISCIPLINE_META } from "@the-desk/ui";
import { useSpring } from "./hooks/useSpring";
import { useDisciplineStore } from "./store/useDisciplineStore";
import { useAuthStore } from "./store/useAuthStore";
import { LoginScreen } from "./features/auth/LoginScreen";
import { DeskScene } from "./scene/DeskScene";

// The 2D route-based dashboard (sidebar/topbar/tab-navigated feature
// screens) is gone — see git history before this commit if you need it.
// The app is now one persistent 3D scene (scene/DeskScene.tsx); every
// feature is reached by interacting with a physical object in it, camera
// state moves instead of routes. Discipline selection stays a lightweight
// pre-scene step for now — material/prop-based discipline reskinning
// in-scene is tier 5 of the build, not built yet.

function DisciplinePicker({ onSelect }: { onSelect: (d: Discipline) => void }) {
  const spring = useSpring();

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
            <motion.button
              key={discipline}
              type="button"
              onClick={() => onSelect(discipline)}
              initial="rest"
              whileHover="hover"
              whileTap={{ scale: 0.99 }}
              className="flex items-baseline justify-between py-5 text-left"
            >
              <motion.span
                data-discipline={discipline}
                className="flex items-baseline gap-3"
                variants={{ rest: { x: 0 }, hover: { x: 4 } }}
                transition={spring.fast}
              >
                <span
                  aria-hidden
                  className="inline-block h-2 w-2 rounded-full"
                  style={{ background: "var(--color-accent)" }}
                />
                <span className="text-xl" style={{ fontFamily: "var(--font-display)" }}>
                  {meta.label}
                </span>
              </motion.span>
              <motion.span
                className="text-sm text-[var(--color-text-muted)]"
                variants={{ rest: { opacity: 0, x: -8 }, hover: { opacity: 1, x: 0 } }}
                transition={spring.fast}
              >
                {meta.tagline}
              </motion.span>
            </motion.button>
          );
        })}
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
    <div style={{ width: "100vw", height: "100vh" }}>
      <DeskScene userId={user.id} discipline={activeDiscipline} onLogOut={logOut} />
    </div>
  );
}
