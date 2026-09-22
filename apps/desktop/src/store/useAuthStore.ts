import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Discipline } from "@the-desk/shared";

export interface AuthUser {
  id: string;
  email: string;
  displayName: string;
  activeDiscipline: Discipline;
}

interface AuthState {
  token: string | null;
  user: AuthUser | null;
  setSession: (token: string, user: AuthUser) => void;
  logOut: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      setSession: (token, user) => set({ token, user }),
      logOut: () => set({ token: null, user: null }),
    }),
    { name: "the-desk-auth" },
  ),
);
