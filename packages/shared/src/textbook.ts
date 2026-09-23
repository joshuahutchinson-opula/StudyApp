import { z } from "zod";
import { DisciplineSchema } from "./discipline.js";
import { BlockSchema } from "./binder.js";

// Read-only reference material, one per discipline — distinct from a user's
// own Binder. Tier 4's "textbook-as-object."
export const TextbookChapterSchema = z.object({
  id: z.string().uuid(),
  textbookId: z.string().uuid(),
  title: z.string().min(1),
  order: z.number().int().nonnegative(),
  content: z.array(BlockSchema),
});
export type TextbookChapter = z.infer<typeof TextbookChapterSchema>;

export const TextbookSchema = z.object({
  id: z.string().uuid(),
  discipline: DisciplineSchema,
  title: z.string().min(1),
  author: z.string().min(1),
  createdAt: z.coerce.date(),
  chapters: z.array(TextbookChapterSchema),
});
export type Textbook = z.infer<typeof TextbookSchema>;
