import { z } from "zod";
import { DisciplineSchema, type Discipline } from "./discipline.js";

export const CitationStyleSchema = z.enum(["ama", "ieee", "mla", "chicago"]);
export type CitationStyle = z.infer<typeof CitationStyleSchema>;

// A citation belongs to one discipline's library; its style defaults from
// that discipline (Medicine -> AMA, Software/Engineering -> IEEE,
// Writing/Arts -> Chicago) rather than being freely chosen per citation.
export const DISCIPLINE_DEFAULT_CITATION_STYLE: Record<Discipline, CitationStyle> = {
  medicine: "ama",
  software: "ieee",
  engineering: "ieee",
  writing: "chicago",
  arts: "chicago",
};

export const CitationSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  discipline: DisciplineSchema,
  style: CitationStyleSchema,
  sourceType: z.enum(["article", "book", "website", "conference_paper", "other"]),
  title: z.string().min(1),
  authors: z.array(z.string()),
  year: z.number().int().optional(),
  publisher: z.string().optional(),
  url: z.string().optional(),
  doi: z.string().optional(),
  createdAt: z.coerce.date(),
});
export type Citation = z.infer<typeof CitationSchema>;
