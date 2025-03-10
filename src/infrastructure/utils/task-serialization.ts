/**
 * タスクシリアライズ/デシリアライズユーティリティ
 *
 * このモジュールは、タスクオブジェクトとJSON形式の間の相互変換を行うユーティリティ関数を提供します。
 * 主な機能：
 * - タスクオブジェクトをJSON文字列に変換
 * - JSON文字列からタスクオブジェクトへの変換
 * - 日付処理の統一的な取り扱い
 * - 型安全な変換処理と検証
 */

import type { Result } from 'neverthrow';
import { ok, err } from 'neverthrow';
import {
  type Task,
  createTaskId,
  validateTask
} from '../../domain/schemas/task-schema.js';

/**
 * シリアライズエラーの型定義
 */
export type SerializationError = {
  readonly type: 'serialization';
  readonly message: string;
  readonly originalError?: unknown;
};

/**
 * デシリアライズエラーの型定義
 */
export type DeserializationError = {
  readonly type: 'deserialization';
  readonly message: string;
  readonly originalError?: unknown;
};

/**
 * シリアライズされたタスクの型定義
 * DateオブジェクトはISOString形式に変換されます
 */
export type SerializedTask = Omit<Task, 'id' | 'createdAt' | 'updatedAt' | 'completedAt'> & {
  readonly id: string;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly completedAt?: string;
};

/**
 * シリアライズされたタスクの最小限のインターフェース
 * 型安全なデシリアライズのために使用
 */
type RawSerializedTask = {
  readonly id?: unknown;
  readonly createdAt?: unknown;
  readonly updatedAt?: unknown;
  readonly completedAt?: unknown;
}

/**
 * タスクオブジェクトをJSON文字列に変換します
 *
 * @param task 変換するタスクオブジェクト
 * @returns 成功時：JSON文字列、失敗時：SerializationError
 */
export function serializeTask(task: Task): Result<string, SerializationError> {
  try {
    // タスクオブジェクトからシリアライズ可能なオブジェクトに変換
    const serializedTask: SerializedTask = {
      ...task,
      id: task.id as string, // TaskIdはstring型にキャスト
      createdAt: task.createdAt.toISOString(),
      updatedAt: task.updatedAt.toISOString(),
      completedAt: task.completedAt !== undefined ? task.completedAt.toISOString()
        : undefined
    };

    // JSONに変換
    return ok(JSON.stringify(serializedTask));
  } catch (error) {
    return err({
      type: 'serialization',
      message: '変換処理中にエラーが発生しました',
      originalError: error
    });
  }
}

/**
 * JSON文字列からタスクオブジェクトに変換します
 *
 * @param jsonString 変換するJSON文字列
 * @returns 成功時：タスクオブジェクト、失敗時：DeserializationError
 */
export function deserializeTask(jsonString: string): Result<Task, DeserializationError> {
  try {
    // JSON文字列をオブジェクトに変換
    const parsed = JSON.parse(jsonString) as SerializedTask;

    // 日付文字列をDateオブジェクトに変換
    const task: Task = {
      ...parsed,
      id: createTaskId(parsed.id),
      createdAt: new Date(parsed.createdAt),
      updatedAt: new Date(parsed.updatedAt),
      completedAt: parsed.completedAt !== undefined ? new Date(parsed.completedAt)
        : undefined
    };

    // zodスキーマを使用して型の検証を行う
    try {
      return ok(validateTask(task));
    } catch (validationError) {
      return err({
        type: 'deserialization',
        message: '不正なタスクデータ形式です',
        originalError: validationError
      });
    }
  } catch (error) {
    return err({
      type: 'deserialization',
      message: 'JSONパース中にエラーが発生しました',
      originalError: error
    });
  }
}

/**
 * 複数のタスクをJSON文字列に変換します
 *
 * @param tasks 変換するタスクの配列
 * @returns 成功時：JSON文字列、失敗時：SerializationError
 */
export function serializeTasks(tasks: readonly Task[]): Result<string, SerializationError> {
  try {
    // 各タスクをシリアライズ可能な形式に変換
    const serializedTasks: readonly SerializedTask[] = tasks.map(task => ({
      ...task,
      id: task.id as string,
      createdAt: task.createdAt.toISOString(),
      updatedAt: task.updatedAt.toISOString(),
      completedAt: task.completedAt !== undefined ? task.completedAt.toISOString()
        : undefined
    }));

    // JSONに変換
    return ok(JSON.stringify(serializedTasks));
  } catch (error) {
    return err({
      type: 'serialization',
      message: '複数タスクの変換処理中にエラーが発生しました',
      originalError: error
    });
  }
}

/**
 * JSON文字列から複数のタスクオブジェクトに変換します
 *
 * @param jsonString 変換するJSON文字列
 * @returns 成功時：タスクオブジェクトの配列、失敗時：DeserializationError
 */
export function deserializeTasks(jsonString: string): Result<readonly Task[], DeserializationError> {
  try {
    // JSON文字列をオブジェクトの配列に変換
    const parsed: unknown = JSON.parse(jsonString);

    // 型チェック
    if (!Array.isArray(parsed)) {
      return err({
        type: 'deserialization',
        message: '無効なJSON形式です。配列が期待されています。'
      });
    }

    // ここでは配列であることが確認されている
    const parsedItems = parsed as readonly unknown[];

    if (!Array.isArray(parsed)) {
      return err({
        type: 'deserialization',
        message: '無効なJSON形式です。配列が期待されています。'
      });
    }

    // 各要素を順にタスクオブジェクトに変換
    const results = parsedItems.map((rawItem, index): Result<Task, DeserializationError> => {
      // 型安全のためのチェック
      if (typeof rawItem !== 'object' || rawItem === null) {
        return err({
          type: 'deserialization',
          message: `無効なタスクデータ (インデックス: ${index}): オブジェクトではありません`,
        });
      }

      // Objectとしての処理
      const item = rawItem as RawSerializedTask;

      try {
        // IDのチェック
        if (typeof item.id !== 'string' || item.id === '') {
          return err({
            type: 'deserialization',
            message: `無効なタスクデータ (インデックス: ${index}): IDが不正です`,
          });
        }

        // 必須日付のチェック
        if (typeof item.createdAt !== 'string' || item.createdAt === '') {
          return err({
            type: 'deserialization',
            message: `無効なタスクデータ (インデックス: ${index}): createdAtが不正です`,
          });
        }

        if (typeof item.updatedAt !== 'string' || item.updatedAt === '') {
          return err({
            type: 'deserialization',
            message: `無効なタスクデータ (インデックス: ${index}): updatedAtが不正です`,
          });
        }

        // オブジェクトをSerializedTask互換の形式に変換
        const serializedTask: SerializedTask = {
          ...(rawItem as Record<string, unknown>) as Omit<SerializedTask, 'id' | 'createdAt' | 'updatedAt' | 'completedAt'>,
          id: item.id,
          createdAt: item.createdAt,
          updatedAt: item.updatedAt,
          completedAt: typeof item.completedAt === 'string' ? item.completedAt : undefined,
        };

        // SerializedTaskからTaskへ変換
        return ok(fromSerializable(serializedTask));
      } catch (validationError) {
        return err({
          type: 'deserialization',
          message: `タスクの検証に失敗しました: ${typeof item.id === 'string' ? item.id : 'unknown'}`,
          originalError: validationError
        });
      }
    });

    // エラーがあるか確認
    const errorResult = results.find(result => result.isErr());
    if (errorResult !== undefined) {
      return err(errorResult.error);
    }

    // すべての結果を展開
    const tasks = results.map(result => (result.isOk() ? result.value : undefined)).filter((task): task is Task => task !== undefined);
    return ok(tasks);
  } catch (error) {
    return err({
      type: 'deserialization',
      message: '複数タスクのデシリアライズ中にエラーが発生しました',
      originalError: error
    });
  }
}

/**
 * タスクオブジェクトを安全にシリアライズ可能なオブジェクトに変換します
 * 日付型をISOString形式に変換します
 *
 * @param task 変換するタスクオブジェクト
 * @returns シリアライズ可能なオブジェクト
 */
export function toSerializable(task: Task): SerializedTask {
  return {
    ...task,
    id: task.id as string,
    createdAt: task.createdAt.toISOString(),
    updatedAt: task.updatedAt.toISOString(),
    completedAt: task.completedAt !== undefined ? task.completedAt.toISOString()
      : undefined
  };
}

/**
 * シリアライズされたオブジェクトからタスクオブジェクトに変換します
 *
 * @param serialized シリアライズされたタスクオブジェクト
 * @returns 変換されたタスクオブジェクト
 * @throws 検証に失敗した場合エラーを投げます
 */
export function fromSerializable(serialized: SerializedTask): Task {
  const task: Task = {
    ...serialized,
    id: createTaskId(serialized.id),
    createdAt: new Date(serialized.createdAt),
    updatedAt: new Date(serialized.updatedAt),
    completedAt: serialized.completedAt !== undefined ? new Date(serialized.completedAt)
      : undefined
  };

  // 検証を実行して型安全性を確保
  return validateTask(task);
}