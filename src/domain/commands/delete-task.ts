/**
 * タスク削除コマンドモジュール
 *
 * このモジュールはタスクの削除機能を提供します。
 * ADRに基づき、物理削除方式でタスクを完全に削除します。
 * 削除前に存在確認を行い、Result型を使用したエラーハンドリングを実装しています。
 * 将来的な拡張ポイントとして、追加のドメインルール検証を組み込める設計になっています。
 */

import type { Result } from 'neverthrow';
import { err, ok } from 'neverthrow';
import type { TaskId } from '../types/Task.js';
import type { TaskRepository } from '../../application/repositories/task-repository.js';

/**
 * タスク削除時のエラー型定義
 */
export type DeleteTaskError =
  | { readonly type: 'TASK_NOT_FOUND'; readonly message: string }
  | { readonly type: 'STORAGE_ERROR'; readonly message: string; readonly cause?: unknown }
  | { readonly type: 'DELETION_FORBIDDEN'; readonly message: string; readonly reason: string };

/**
 * タスクを削除する関数
 *
 * @param taskId 削除対象のタスクID
 * @param repository タスクリポジトリ
 * @returns 成功時: void、失敗時: エラーオブジェクト
 */
export async function deleteTask(
  taskId: TaskId,
  repository: TaskRepository
): Promise<Result<void, DeleteTaskError>> {
  // 1. タスクの存在確認
  const taskResult = await repository.findById(taskId);
  if (taskResult.isErr()) {
    if (taskResult.error.type === 'NOT_FOUND') {
      return err({
        type: 'TASK_NOT_FOUND',
        message: taskResult.error.message
      });
    }
    return err({
      type: 'STORAGE_ERROR',
      message: 'タスクの検索中にエラーが発生しました',
      cause: taskResult.error
    });
  }

  // 2. ドメインルールの検証（将来的な拡張ポイント）
  // const validationResult = validateDeletionRules(taskResult.value);
  // if (validationResult.isErr()) {
  //   return validationResult;
  // }

  // 3. タスクの削除
  const deleteResult = await repository.delete(taskId);
  if (deleteResult.isErr()) {
    return err({
      type: 'STORAGE_ERROR',
      message: deleteResult.error.message,
      // causeプロパティはSTORAGE_ERRORタイプのみに存在するため、存在チェックを行う
      cause: deleteResult.error.type === 'STORAGE_ERROR' ? deleteResult.error.cause : undefined
    });
  }

  return ok(undefined);
}

/**
 * 削除ドメインルールの検証関数（将来的な拡張用）
 * 現時点では使用していないが、将来的なドメインルール追加に備えて枠組みを用意
 */
// function validateDeletionRules(task: Task): Result<void, DeleteTaskError> {
//   // 例: タスクが特定の状態（例：進行中）の場合、削除を禁止する
//   // if (task.status === 'IN_PROGRESS') {
//   //   return err({
//   //     type: 'DELETION_FORBIDDEN',
//   //     message: '進行中のタスクは削除できません',
//   //     reason: 'inProgress'
//   //   });
//   // }
//   //
//   // return ok(undefined);
// }