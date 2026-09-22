import { z } from "zod";
import { DisciplineSchema } from "./discipline.js";

export const TaskStatusSchema = z.enum(["backlog", "todo", "in_progress", "done"]);
export type TaskStatus = z.infer<typeof TaskStatusSchema>;

export const TaskSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  discipline: DisciplineSchema,
  title: z.string().min(1),
  description: z.string().optional(),
  status: TaskStatusSchema,
  parentTaskId: z.string().uuid().nullable(),
  dependsOnTaskIds: z.array(z.string().uuid()),
  dueAt: z.coerce.date().nullable(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});
export type Task = z.infer<typeof TaskSchema>;

export const DeadlineSourceSchema = z.enum(["manual", "syllabus_import"]);
export type DeadlineSource = z.infer<typeof DeadlineSourceSchema>;

export const DeadlineSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  title: z.string().min(1),
  dueAt: z.coerce.date(),
  source: DeadlineSourceSchema,
  relatedTaskId: z.string().uuid().nullable(),
  recurrenceRule: z.string().nullable(),
  createdAt: z.coerce.date(),
});
export type Deadline = z.infer<typeof DeadlineSchema>;
