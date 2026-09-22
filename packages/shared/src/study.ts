import { z } from "zod";
import { MasteryLevelSchema } from "./mastery.js";
import { DisciplineSchema } from "./discipline.js";

export const StudyModeSchema = z.enum(["pomodoro", "deep_work", "free"]);
export type StudyMode = z.infer<typeof StudyModeSchema>;

export const StudySessionSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  mode: StudyModeSchema,
  startedAt: z.coerce.date(),
  endedAt: z.coerce.date().nullable(),
  focusMinutes: z.number().int().nonnegative(),
});
export type StudySession = z.infer<typeof StudySessionSchema>;

/** A spaced-repetition card generalized across flashcards, terminology drills, vocab, etc. */
export const SpacedRepetitionCardSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  // Denormalized rather than derived from sourcePageId's binder, since a card
  // can exist standalone (no source page) but still belongs to one discipline —
  // mirrors how Task already carries its own `discipline` field.
  discipline: DisciplineSchema,
  sourcePageId: z.string().uuid().nullable(),
  front: z.string().min(1),
  back: z.string().min(1),
  masteryLevel: MasteryLevelSchema,
  dueAt: z.coerce.date(),
  intervalDays: z.number().nonnegative(),
  easeFactor: z.number().positive(),
  reviewCount: z.number().int().nonnegative(),
});
export type SpacedRepetitionCard = z.infer<typeof SpacedRepetitionCardSchema>;
