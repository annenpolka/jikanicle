import { z } from 'zod';
import {
    CreateTaskParams,
    Task
} from '../types/Task';

// カテゴリのスキーマ
export const categorySchema = z.enum(['WORK', 'PERSONAL_DEV', 'HOUSEHOLD', 'LEARNING', 'OTHER']);

// タスクステータスのスキーマ
export const taskStatusSchema = z.enum(['NOT_STARTED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED']);

// 優先度のスキーマ
export const prioritySchema = z.enum(['LOW', 'MEDIUM', 'HIGH']);

// TaskIdのスキーマ
export const taskIdSchema = z.string().min(1);

// タスク作成パラメータのスキーマ
export const createTaskParamsSchema = z.object({
  name: z.string().min(1, { message: 'タスク名は必須です' }),
  estimatedDuration: z.number().nonnegative({ message: '予測時間は0以上である必要があります' }),
  category: categorySchema,
  id: taskIdSchema.optional(),
  description: z.string().optional().default(''),
  status: taskStatusSchema.optional().default('NOT_STARTED'),
  priority: prioritySchema.optional().default('MEDIUM'),
  createdAt: z.date().optional(),
  tags: z.array(z.string()).optional().default([]),
});

// タスクスキーマ
export const taskSchema = z.object({
  id: taskIdSchema,
  name: z.string().min(1),
  description: z.string(),
  status: taskStatusSchema,
  category: categorySchema,
  priority: prioritySchema,
  estimatedDuration: z.number().nonnegative(),
  createdAt: z.date(),
  updatedAt: z.date(),
  completedAt: z.date().optional(),
  tags: z.array(z.string()),
});

// 型の安全性を確保するための型チェック
export type TaskSchema = z.infer<typeof taskSchema>;
export type CreateTaskParamsSchema = z.infer<typeof createTaskParamsSchema>;

// スキーマを使用した検証関数
export function validateCreateTaskParams(params: CreateTaskParams): CreateTaskParams {
  return createTaskParamsSchema.parse(params);
}

export function validateTask(task: Task): Task {
  return taskSchema.parse(task);
}