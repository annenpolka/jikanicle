/**
 * タスク更新ファクトリモジュール
 *
 * このモジュールは既存のタスクを更新するための関数を提供します。
 * 不変性の原則に基づき、元のタスクオブジェクトを変更せず、新しいタスクオブジェクトを返します。
 * また、特定のドメインルール（ステータス変更時の特殊処理など）を適用します。
 */

import { err, ok } from 'neverthrow';
import type { Result } from 'neverthrow';
import { z } from 'zod';
import type { Task } from '../schemas/task-schema.js';
import { taskSchema } from '../schemas/task-schema.js';

/**
 * タスク更新時のエラー型定義
 */
export type UpdateTaskError =
  | { readonly type: 'VALIDATION_ERROR'; readonly message: string; readonly errors: Record<string, readonly string[]> }
  | { readonly type: 'TASK_NOT_FOUND'; readonly message: string }
  | { readonly type: 'INVALID_STATUS_TRANSITION'; readonly message: string }
  | { readonly type: 'IMMUTABLE_FIELD_MODIFICATION'; readonly message: string; readonly field: string };

/**
 * 更新可能なタスクフィールドのスキーマ定義
 * id と createdAt は変更不可とする
 * （ただしomitしてもキーがあれば検証されるので、validateDomainRulesでも検証する）
 */
export const updateTaskParamsSchema = taskSchema
  .omit({ id: true, createdAt: true })
  .partial();

/**
 * 更新パラメータの型定義
 */
export type UpdateTaskParams = Readonly<z.infer<typeof updateTaskParamsSchema>>;

/**
 * タスクの状態遷移に関するルールを適用する関数
 * @param currentStatus 現在のタスク状態
 * @param newStatus 新しいタスク状態（未指定の場合は変更なし）
 * @param currentCompletedAt 現在の完了日時
 * @returns 更新された完了日時情報
 */
function handleStatusTransition(
  currentStatus: Readonly<Task['status']>,
  newStatus: Readonly<Task['status'] | undefined>,
  currentCompletedAt?: Readonly<Date>
): { readonly completedAt?: Date } {
  // 状態が変更されない場合は現在の完了日時を維持
  if (!newStatus || newStatus === currentStatus) {
    // 日付の場合は新しいオブジェクトを返して不変性を保つ
    return {
      completedAt: currentCompletedAt ? new Date(currentCompletedAt.getTime()) : undefined
    };
  }

  // 完了状態への変更: 完了日時を設定
  if (newStatus === 'COMPLETED') {
    return { completedAt: new Date() };
  }

  // 完了状態からの変更: 完了日時をクリア
  if (currentStatus === 'COMPLETED') {
    return { completedAt: undefined };
  }

  // その他の状態変更: 完了日時は変更なし
  return { completedAt: currentCompletedAt };
}

/**
 * ドメインルールに基づくバリデーション
 * @param task 更新対象の元タスク
 * @param params 更新パラメータ
 * @returns 成功時: void、失敗時: エラーオブジェクト
 */
function validateDomainRules(
  task: Readonly<Task>,
  params: Readonly<UpdateTaskParams>
): Result<void, UpdateTaskError> {
  // 不変フィールドのチェック: ID
  if ('id' in params && params.id !== undefined) {
    return err({
      type: 'IMMUTABLE_FIELD_MODIFICATION',
      message: 'タスクIDは変更できません',
      field: 'id'
    });
  }

  // 不変フィールドのチェック: 作成日時
  if ('createdAt' in params && params.createdAt !== undefined) {
    return err({
      type: 'IMMUTABLE_FIELD_MODIFICATION',
      message: '作成日時は変更できません',
      field: 'createdAt'
    });
  }

  // 状態遷移ルール: キャンセルされたタスクは再開できない
  if (task.status === 'CANCELLED' && params.status && params.status !== 'CANCELLED') {
    return err({
      type: 'INVALID_STATUS_TRANSITION',
      message: 'キャンセルされたタスクは再開できません'
    });
  }

  // その他のドメインルールに基づくバリデーションはここに追加

  return ok(undefined);
}

/**
 * スキーマに基づく入力検証
 * @param params 検証対象の更新パラメータ
 * @returns 成功時: 検証済みパラメータ、失敗時: エラーオブジェクト
 */
function validateSchema(params: Readonly<unknown>): Result<UpdateTaskParams, UpdateTaskError> {
  try {
    const validParams = updateTaskParamsSchema.parse(params);
    return ok(validParams);
  } catch (error) {
    if (error instanceof z.ZodError) {
      // 完全な関数型アプローチでエラーマップを作成
      const formattedErrors = error.errors.reduce<Readonly<Record<string, readonly string[]>>>((acc, err) => {
        const path = err.path.join('.');
        // 既存の配列を安全に取得
        const existing = acc[path] ?? [];
        // 新しいオブジェクトとして返す
        return {
          ...acc,
          [path]: [...existing, err.message]
        };
      }, {});

      return err({
        type: 'VALIDATION_ERROR',
        message: 'タスク更新パラメータが無効です',
        errors: formattedErrors
      });
    }

    // 想定外のエラー
    return err({
      type: 'VALIDATION_ERROR',
      message: '予期しないバリデーションエラー',
      errors: { unknown: ['不明なエラーが発生しました'] }
    });
  }
}

/**
 * 既存タスクを更新する関数
 * 元のタスクを変更せず、新しいタスクオブジェクトを返す
 * @param task 更新対象の元タスク
 * @param params 更新パラメータ（部分的な更新をサポート）
 * @returns 成功時: 更新されたタスク、失敗時: エラーオブジェクト
 */
export function updateTask(
  task: Readonly<Task>,
  params: Readonly<unknown>
): Result<Task, UpdateTaskError> {
  // 0. パラメータがオブジェクトでない場合はバリデーションエラーになるのでスキップ
  // TypeScriptは常にnullも含めて厳密にチェックするため、型ガードを使用
  if (typeof params === 'object') {
    // paramsがオブジェクトの場合のみプロパティアクセスが可能
    const objectParams = params as Record<string, unknown>;

    if ('id' in objectParams) {
      return err({
        type: 'IMMUTABLE_FIELD_MODIFICATION',
        message: 'タスクIDは変更できません',
        field: 'id'
      });
    }
    if ('createdAt' in objectParams) {
      return err({
        type: 'IMMUTABLE_FIELD_MODIFICATION',
        message: '作成日時は変更できません',
        field: 'createdAt'
      });
    }
  }

  // 1. スキーマバリデーション
  const schemaResult = validateSchema(params);
  if (schemaResult.isErr()) {
    return err(schemaResult.error);
  }
  const validParams = schemaResult.value;

  // 2. ドメインルールに基づくバリデーション
  const domainResult = validateDomainRules(task, validParams);
  if (domainResult.isErr()) {
    return err(domainResult.error);
  }

  // 3. ステータス変更の特殊処理
  const { completedAt } = handleStatusTransition(
    task.status,
    validParams.status,
    task.completedAt
  );

  // 4. 更新されたタスクオブジェクトを生成して返す
  return ok({
    ...task,
    ...validParams,
    updatedAt: new Date(),
    completedAt
  });
}