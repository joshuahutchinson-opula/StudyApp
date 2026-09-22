import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Discipline } from "@the-desk/shared";

interface DisciplineState {
  activeDiscipline: Discipline | null;
  setDiscipline: (discipline: Discipline) => void;
}

export const useDisciplineStore = create<DisciplineState>()(
  persist(
    (set) => ({
      activeDiscipline: null,
      setDiscipline: (discipline) => set({ activeDiscipline: discipline }),
    }),
    { name: "the-desk-discipline" },
  ),
);
