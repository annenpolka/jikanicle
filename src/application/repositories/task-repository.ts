import type { Result } from 'neverthrow';
import type { Task, TaskId } from '../../domain/types/Task.js';

/**
 * タスクリポジトリのエラー型定義
 * 発生し得るすべてのエラーケースを網羅的に定義
 */
export type TaskRepositoryError =
  | { readonly type: 'NOT_FOUND'; readonly message: string }
  | { readonly type: 'ALREADY_EXISTS'; readonly message: string }
  | { readonly type: 'STORAGE_ERROR'; readonly message: string; readonly cause?: unknown }
  | { readonly type: 'VALIDATION_ERROR'; readonly message: string; readonly errors: Record<string, readonly string[]> }
  | { readonly type: 'CONCURRENCY_ERROR'; readonly message: string };

/**
 * クエリフィルタ型定義
 * タスクの検索条件を表現する
 */
export type TaskFilter = {
  readonly status?: readonly Task['status'][];
  readonly category?: Task['category'];
  readonly tags?: readonly string[];
  readonly createdAfter?: Date;
  readonly createdBefore?: Date;
  readonly textSearch?: string;
};

/**
 * タスクリポジトリインターフェース
 * タスク集約のCRUD操作を定義
 * すべてのメソッドはResultタイプを返し、失敗の可能性を型で表現
 */
export type TaskRepository = {
  /**
   * IDによるタスク取得
   * @param id 取得するタスクのID
   * @returns 成功時: タスクオブジェクト、失敗時: エラーオブジェクト
   */
  findById(id: TaskId): Promise<Result<Task, TaskRepositoryError>>;

  /**
   * すべてのタスク、または条件に一致するタスクの取得
   * @param filter オプションのフィルタ条件
   * @returns 成功時: タスクの配列、失敗時: エラーオブジェクト
   */
  findAll(filter?: TaskFilter): Promise<Result<readonly Task[], TaskRepositoryError>>;

  /**
   * タスクの保存（新規作成または更新）
   * @param task 保存するタスクオブジェクト
   * @returns 成功時: 保存されたタスク、失敗時: エラーオブジェクト
   */
  save(task: Task): Promise<Result<Task, TaskRepositoryError>>;

  /**
   * タスクの削除
   * @param id 削除するタスクのID
   * @returns 成功時: void、失敗時: エラーオブジェクト
   */
  delete(id: TaskId): Promise<Result<void, TaskRepositoryError>>;

  /**
   * リポジトリ内のタスク数を取得
   * @param filter オプションのフィルタ条件
   * @returns 成功時: タスク数、失敗時: エラーオブジェクト
   */
  count(filter?: TaskFilter): Promise<Result<number, TaskRepositoryError>>;
};