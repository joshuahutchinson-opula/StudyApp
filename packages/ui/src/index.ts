import type { Discipline } from "@the-desk/shared";

export interface DisciplineMeta {
  label: string;
  tagline: string;
}

export const DISCIPLINE_META: Record<Discipline, DisciplineMeta> = {
  medicine: { label: "Medicine", tagline: "Clinical reasoning, board prep, rotations." },
  software: { label: "Software Dev / IT", tagline: "Code, systems, and learning paths." },
  writing: { label: "Writing / Journalism / Literature", tagline: "Manuscripts, drafts, and sources." },
  engineering: { label: "Engineering", tagline: "Problem sets, diagrams, and standards." },
  arts: { label: "Arts", tagline: "Portfolio, critique, and studio work." },
};

export * from "./motion";
