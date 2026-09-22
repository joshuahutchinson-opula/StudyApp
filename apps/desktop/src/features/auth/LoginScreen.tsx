import { useState } from "react";
import { DISCIPLINES, type Discipline } from "@the-desk/shared";
import { DISCIPLINE_META } from "@the-desk/ui";
import { api } from "../../api/client";
import { useAuthStore, type AuthUser } from "../../store/useAuthStore";

interface AuthResponse {
  token: string;
  user: AuthUser;
}

export function LoginScreen() {
  const setSession = useAuthStore((s) => s.setSession);
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [discipline, setDiscipline] = useState<Discipline>("medicine");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const { token, user } =
        mode === "login"
          ? await api.post<AuthResponse>("/auth/login", { email, password })
          : await api.post<AuthResponse>("/auth/register", {
              email,
              password,
              displayName,
              activeDiscipline: discipline,
            });
      setSession(token, user);
    } catch {
      setError(mode === "login" ? "Invalid email or password." : "Could not create that account.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-sm flex-col justify-center px-6">
      <h1 className="mb-1 text-sm tracking-wide text-[var(--color-text-muted)]">The Desk</h1>
      <p className="mb-8 text-2xl" style={{ fontFamily: "var(--font-display)" }}>
        {mode === "login" ? "Welcome back" : "Create your desk"}
      </p>

      <form onSubmit={submit} className="flex flex-col gap-3">
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email"
          className="rounded-[var(--radius-base)] border border-[var(--color-border)] bg-transparent px-3 py-2 text-sm focus:outline-none"
        />
        <input
          type="password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          className="rounded-[var(--radius-base)] border border-[var(--color-border)] bg-transparent px-3 py-2 text-sm focus:outline-none"
        />

        {mode === "register" && (
          <>
            <input
              required
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Your name"
              className="rounded-[var(--radius-base)] border border-[var(--color-border)] bg-transparent px-3 py-2 text-sm focus:outline-none"
            />
            <select
              value={discipline}
              onChange={(e) => setDiscipline(e.target.value as Discipline)}
              className="rounded-[var(--radius-base)] border border-[var(--color-border)] bg-transparent px-3 py-2 text-sm"
            >
              {DISCIPLINES.map((d) => (
                <option key={d} value={d}>
                  {DISCIPLINE_META[d].label}
                </option>
              ))}
            </select>
          </>
        )}

        {error && <p className="text-sm" style={{ color: "#dc2626" }}>{error}</p>}

        <button
          type="submit"
          disabled={submitting}
          className="mt-2 rounded-[var(--radius-base)] px-4 py-2 text-sm disabled:opacity-50"
          style={{ background: "var(--color-accent)", color: "#fff" }}
        >
          {submitting ? "…" : mode === "login" ? "Log in" : "Create account"}
        </button>
      </form>

      <button
        type="button"
        onClick={() => setMode(mode === "login" ? "register" : "login")}
        className="mt-4 text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
      >
        {mode === "login" ? "New here? Create an account" : "Already have an account? Log in"}
      </button>

      {mode === "login" && (
        <p className="mt-8 text-xs text-[var(--color-text-muted)]">
          Demo account: demo@thedesk.app / StudyDesk123!
        </p>
      )}
    </div>
  );
}
