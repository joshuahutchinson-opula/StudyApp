import { z } from "zod";
import { DisciplineSchema } from "./discipline.js";

export const UserSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  displayName: z.string().min(1),
  activeDiscipline: DisciplineSchema,
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});
export type User = z.infer<typeof UserSchema>;
