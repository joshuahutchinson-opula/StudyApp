import { z } from "zod";

export const CitationStyleSchema = z.enum(["ama", "ieee", "mla", "chicago"]);
export type CitationStyle = z.infer<typeof CitationStyleSchema>;

export const CitationSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
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
