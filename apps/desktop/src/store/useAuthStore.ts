import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Discipline } from "@the-desk/shared";

export interface AuthUser {
  id: string;
  email: string;
  displayName: string;
  activeDiscipline: Discipline;
  /** Tier 7's user desk/wall customization override — see scene/disciplineTheme.ts. */
  deskThemeOverride: Partial<{ deskWood: string; wall: string }> | null;
  /** Tier 9's rearrangeable desk override: { [objectKey]: slotIndex }. */
  deskLayoutOverride: Record<string, number> | null;
}

interface AuthState {
  token: string | null;
  user: AuthUser | null;
  setSession: (token: string, user: AuthUser) => void;
  updateUser: (patch: Partial<AuthUser>) => void;
  logOut: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      setSession: (token, user) => set({ token, user }),
      updateUser: (patch) => set((s) => (s.user ? { user: { ...s.user, ...patch } } : s)),
      logOut: () => set({ token: null, user: null }),
    }),
    { name: "the-desk-auth" },
  ),
);
