import { z } from "zod";
import { DisciplineSchema } from "./discipline.js";
import { MasteryLevelSchema } from "./mastery.js";

export const BinderSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  discipline: DisciplineSchema,
  title: z.string().min(1),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});
export type Binder = z.infer<typeof BinderSchema>;

/** A color-coded tab on the edge of a binder, used to switch between subjects/units. */
export const TabDividerSchema = z.object({
  id: z.string().uuid(),
  binderId: z.string().uuid(),
  label: z.string().min(1),
  color: z.string(),
  order: z.number().int().nonnegative(),
});
export type TabDivider = z.infer<typeof TabDividerSchema>;

// Minimal extensible content block model for a page. New block kinds get added
// here as discipline engines need them (e.g. a formula block for Engineering).
export const BlockSchema = z.discriminatedUnion("kind", [
  z.object({ id: z.string().uuid(), kind: z.literal("heading"), level: z.number().int().min(1).max(3), text: z.string() }),
  z.object({ id: z.string().uuid(), kind: z.literal("paragraph"), text: z.string() }),
  z.object({ id: z.string().uuid(), kind: z.literal("list"), ordered: z.boolean(), items: z.array(z.string()) }),
  // `runnable` powers Software Dev's "concept-to-code" signature feature —
  // additive to the existing code block, not a new kind, since only the
  // execution affordance is discipline-specific, not the content shape.
  z.object({
    id: z.string().uuid(),
    kind: z.literal("code"),
    language: z.string().optional(),
    code: z.string(),
    runnable: z.boolean().optional(),
  }),
  z.object({ id: z.string().uuid(), kind: z.literal("image"), url: z.string(), caption: z.string().optional() }),
  z.object({ id: z.string().uuid(), kind: z.literal("citationRef"), citationId: z.string().uuid() }),
  // Engineering's signature feature: unit-aware, live-computed equations —
  // a genuinely different content shape from a code block (multi-line
  // expression evaluated as math, not executed as a program), not an
  // additive flag like code's `runnable`.
  z.object({ id: z.string().uuid(), kind: z.literal("formula"), expression: z.string() }),
]);
export type Block = z.infer<typeof BlockSchema>;

export const MarginAnnotationSchema = z.object({
  id: z.string().uuid(),
  pageId: z.string().uuid(),
  anchorBlockId: z.string().uuid(),
  body: z.string().min(1),
  createdAt: z.coerce.date(),
});
export type MarginAnnotation = z.infer<typeof MarginAnnotationSchema>;

export const PageSchema = z.object({
  id: z.string().uuid(),
  binderId: z.string().uuid(),
  tabDividerId: z.string().uuid().nullable(),
  title: z.string().min(1),
  order: z.number().int().nonnegative(),
  content: z.array(BlockSchema),
  masteryLevel: MasteryLevelSchema,
  /** Dog-ear corner: reviewed/unreviewed signal, tappable to toggle. */
  reviewed: z.boolean(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});
export type Page = z.infer<typeof PageSchema>;
