import { z } from "zod";

export const TaskCategorySchema = z.enum([
  "work",
  "personal",
  "study",
  "health",
  "shopping",
  "meeting",
  "other"
]);

export const TaskStatusSchema = z.enum([
  "pending",
  "in-progress", 
  "completed",
  "cancelled"
]);

export const TaskSchema = z.object({
  id: z.string(),
  name: z.string().min(1, "タスク名は必須です"),
  description: z.string().optional(),
  estimatedDurationMinutes: z.number().positive("所要時間は正の数である必要があります").optional(),
  actualDurationMinutes: z.number().positive().optional(),
  category: TaskCategorySchema.optional(),
  status: TaskStatusSchema.default("pending"),
  createdAt: z.date(),
  updatedAt: z.date(),
  startedAt: z.date().optional(),
  completedAt: z.date().optional()
});

export type Task = z.infer<typeof TaskSchema>;
export type TaskCategory = z.infer<typeof TaskCategorySchema>;
export type TaskStatus = z.infer<typeof TaskStatusSchema>;

export interface CreateTaskParams {
  name: string;
  description?: string;
  estimatedDurationMinutes?: number;
  category?: TaskCategory;
}

export interface UpdateTaskParams {
  id: string;
  name?: string;
  description?: string;
  estimatedDurationMinutes?: number;
  actualDurationMinutes?: number;
  category?: TaskCategory;
  status?: TaskStatus;
  startedAt?: Date;
  completedAt?: Date;
}