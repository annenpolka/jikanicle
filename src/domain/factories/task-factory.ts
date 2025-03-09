import { v4 as uuidv4 } from 'uuid';
import { createTaskId, validateCreateTaskParams } from '../schemas/task-schema.js';
import type { CreateTaskParams, Task } from '../types/Task.js';

/**
 * タスクを作成するファクトリ関数
 * @param params タスク作成パラメータ
 * @returns 作成されたタスク
 */
export function createTask(params: CreateTaskParams): Task {
  // パラメータのバリデーション - Zodスキーマを使用
  const validParams = validateCreateTaskParams(params);

  // 現在時刻
  const now = new Date();

  // タスクオブジェクトの作成
  const task: Task = {
    id: validParams.id ?? createTaskId(uuidv4()),
    name: validParams.name,
    description: validParams.description,
    status: validParams.status,
    category: validParams.category,
    priority: validParams.priority,
    estimatedDuration: validParams.estimatedDuration,
    createdAt: validParams.createdAt ?? now,
    updatedAt: now,
    tags: validParams.tags,
  };

  return task;
}