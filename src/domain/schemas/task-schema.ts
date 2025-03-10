import { z } from 'zod';
// 型のインポートを削除して循環参照を解消
// import {
//   CreateTaskParams,
//   Task
// } from '../types/Task';

// カテゴリのスキーマ
export const categorySchema = z.enum(['WORK', 'PERSONAL_DEV', 'HOUSEHOLD', 'LEARNING', 'OTHER']);

// タスクステータスのスキーマ
export const taskStatusSchema = z.enum(['NOT_STARTED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED']);

// 優先度のスキーマ
export const prioritySchema = z.enum(['LOW', 'MEDIUM', 'HIGH']);

// TaskIdのスキーマ - ブランド型に対応するためのリファインメント追加
export const taskIdSchema = z.string().min(1).brand<'TaskId'>();

// タスク作成パラメータのスキーマ
export const createTaskParamsSchema = z.object({
  name: z.string().min(1, { message: 'タスク名は必須です' }),
  estimatedDuration: z.number().nonnegative({ message: '予測時間は0以上である必要があります' }),
  category: categorySchema,
  id: z.union([taskIdSchema, z.undefined()]).optional(),
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

// スキーマから型を生成
export type Category = z.infer<typeof categorySchema>;
export type TaskStatus = z.infer<typeof taskStatusSchema>;
export type Priority = z.infer<typeof prioritySchema>;
export type TaskId = z.infer<typeof taskIdSchema>;
export type Task = z.infer<typeof taskSchema>;
export type CreateTaskParams = z.infer<typeof createTaskParamsSchema>;

// TaskId作成ヘルパー関数
export const createTaskId = (id: string): TaskId => {
  return taskIdSchema.parse(id);
};

// 下位互換性のため、以前の型の名前も保持
export type TaskSchema = Task;
export type CreateTaskParamsSchema = CreateTaskParams;

// スキーマを使用した検証関数
/**
 * タスク作成パラメータを検証する関数
 * @param params 検証するタスク作成パラメータ
 * @returns 検証済みのタスク作成パラメータ
 * @throws 検証エラーが発生した場合
 */
export function validateCreateTaskParams(params: CreateTaskParams): CreateTaskParams {
  return createTaskParamsSchema.parse(params);
}

/**
 * タスクオブジェクトを検証する関数
 * @param task 検証するタスクオブジェクト
 * @returns 検証済みのタスクオブジェクト
 * @throws 検証エラーが発生した場合
 */
export function validateTask(task: Task): Task {
  return taskSchema.parse(task);
}