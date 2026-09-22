import { z } from "zod";

export const MasteryLevelSchema = z.enum([
  "unfamiliar",
  "learning",
  "familiar",
  "mastered",
]);
export type MasteryLevel = z.infer<typeof MasteryLevelSchema>;
