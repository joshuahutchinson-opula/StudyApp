import { z } from "zod";

export const DisciplineSchema = z.enum([
  "medicine",
  "software",
  "writing",
  "engineering",
  "arts",
]);
export type Discipline = z.infer<typeof DisciplineSchema>;

export const DISCIPLINES: Discipline[] = [
  "medicine",
  "software",
  "writing",
  "engineering",
  "arts",
];
