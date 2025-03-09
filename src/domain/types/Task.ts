/**
 * タスク管理コンテキストの型定義
 *
 * 注意: この型定義ファイルはスキーマファイルから再エクスポートされた型を使用します。
 * 型定義とバリデーションが統一されています。
 */

// schemaから型を再エクスポート
export {
  Category, createTaskId, CreateTaskParams, Priority,
  Task, TaskId, TaskStatus
} from '../schemas/task-schema.js';

/*
 * 以下は以前の型定義です。
 * 現在はスキーマから生成された型に置き換えられています。
 * 参照のために残しています。

export type TaskId = string & { readonly _brand: unique symbol };

export const createTaskId = (id: string): TaskId => {
  return id as TaskId;
};

export type Category = 'WORK' | 'PERSONAL_DEV' | 'HOUSEHOLD' | 'LEARNING' | 'OTHER';

export type TaskStatus = 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';

export type Priority = 'LOW' | 'MEDIUM' | 'HIGH';

export interface Task {
  id: TaskId;
  name: string;
  description: string;
  status: TaskStatus;
  category: Category;
  priority: Priority;
  estimatedDuration: number; // 分単位
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
  tags: string[];
}

export interface CreateTaskParams {
  name: string;
  estimatedDuration: number;
  category: Category;
  id?: TaskId;
  description?: string;
  status?: TaskStatus;
  priority?: Priority;
  createdAt?: Date;
  tags?: string[];
}
*/