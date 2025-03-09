/**
 * タスク管理コンテキストの型定義
 */

/**
 * タスクIDの型
 * UUIDを表すブランド型
 */
export type TaskId = string & { readonly _brand: unique symbol };

/**
 * 新しいTaskIdを作成する関数
 * @param id - UUIDの文字列
 */
export const createTaskId = (id: string): TaskId => {
  return id as TaskId;
};

/**
 * タスクカテゴリの型
 */
export type Category = 'WORK' | 'PERSONAL_DEV' | 'HOUSEHOLD' | 'LEARNING' | 'OTHER';

/**
 * タスクの状態を表す型
 */
export type TaskStatus = 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';

/**
 * 優先度の型
 */
export type Priority = 'LOW' | 'MEDIUM' | 'HIGH';

/**
 * タスクの値オブジェクト型
 */
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

/**
 * タスク作成時の入力パラメータ
 */
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