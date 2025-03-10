import { describe, expect, it } from 'vitest';
import { updateTask } from '../../../src/domain/factories/update-task.js';
import { createTaskId } from '../../../src/domain/types/Task.js';
import type { Priority, Task, TaskStatus } from '../../../src/domain/types/Task.js';
import type { UpdateTaskError } from '../../../src/domain/factories/update-task.js';

// 型ガード関数
function isImmutableFieldError(error: UpdateTaskError): error is { readonly type: 'IMMUTABLE_FIELD_MODIFICATION'; readonly message: string; readonly field: string } {
  return error.type === 'IMMUTABLE_FIELD_MODIFICATION';
}

function isValidationError(error: UpdateTaskError): error is { readonly type: 'VALIDATION_ERROR'; readonly message: string; readonly errors: Record<string, readonly string[]> } {
  return error.type === 'VALIDATION_ERROR';
}

describe('updateTask', () => {
  // テスト用のモックタスク
  const mockTask: Task = {
    id: createTaskId('test-id-1'),
    name: 'テストタスク',
    description: 'テスト用のタスク説明',
    status: 'NOT_STARTED',
    category: 'WORK',
    priority: 'MEDIUM',
    estimatedDuration: 60,
    createdAt: new Date('2025-03-01T00:00:00.000Z'),
    updatedAt: new Date('2025-03-01T00:00:00.000Z'),
    tags: ['test', 'sample'],
  };

  // テスト結果として取得した配列が不変であることを保証するヘルパー関数
  function ensureReadonlyArray<T>(arr: readonly T[]): readonly T[] {
    return arr;
  }

  // 基本的な部分更新テスト
  describe('基本的な更新', () => {
    it('名前のみを更新できること', () => {
      const result = updateTask(mockTask, { name: '更新後のタスク名' });

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        const updatedTask = result.value;
        expect(updatedTask.name).toBe('更新後のタスク名');
        expect(updatedTask.description).toBe(mockTask.description); // 他のフィールドは変更なし
        expect(updatedTask.updatedAt.getTime()).toBeGreaterThan(mockTask.updatedAt.getTime()); // 更新日時が更新されている
      }
    });

    it('説明のみを更新できること', () => {
      const result = updateTask(mockTask, { description: '更新後の説明文' });

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        const updatedTask = result.value;
        expect(updatedTask.description).toBe('更新後の説明文');
        expect(updatedTask.name).toBe(mockTask.name); // 他のフィールドは変更なし
      }
    });

    it('複数のフィールドを同時に更新できること', () => {
      const result = updateTask(mockTask, {
        name: '複数更新テスト',
        description: '複数フィールドの更新テスト',
        priority: 'HIGH',
        tags: ['updated', 'multiple'],
      });

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        const updatedTask = result.value;
        expect(updatedTask.name).toBe('複数更新テスト');
        expect(updatedTask.description).toBe('複数フィールドの更新テスト');
        expect(updatedTask.priority).toBe('HIGH');
        expect(updatedTask.tags).toEqual(ensureReadonlyArray(['updated', 'multiple']));
        expect(updatedTask.status).toBe(mockTask.status); // 更新していないフィールドは元の値を保持
      }
    });
  });

  // ステータス変更時の特殊処理のテスト
  describe('ステータス変更', () => {
    it('未完了から完了に変更すると、completedAtが設定されること', () => {
      const result = updateTask(mockTask, { status: 'COMPLETED' });

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        const updatedTask = result.value;
        expect(updatedTask.status).toBe('COMPLETED');
        expect(updatedTask.completedAt).toBeDefined();
        expect(updatedTask.completedAt instanceof Date).toBe(true);
      }
    });

    it('既に完了したタスクを未完了に戻すと、completedAtがundefinedになること', () => {
      // 完了状態のタスクを作成
      const completedTask: Task = {
        ...mockTask,
        status: 'COMPLETED',
        completedAt: new Date('2025-03-05T00:00:00.000Z'),
      };

      const result = updateTask(completedTask, { status: 'IN_PROGRESS' });

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        const updatedTask = result.value;
        expect(updatedTask.status).toBe('IN_PROGRESS');
        expect(updatedTask.completedAt).toBeUndefined();
      }
    });

    it('完了状態のままでも他のフィールドを更新できること', () => {
      // 完了状態のタスクを作成
      const completedTask: Task = {
        ...mockTask,
        status: 'COMPLETED',
        completedAt: new Date('2025-03-05T00:00:00.000Z'),
      };

      const result = updateTask(completedTask, { name: '完了タスクの名前変更' });

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        const updatedTask = result.value;
        expect(updatedTask.name).toBe('完了タスクの名前変更');
        expect(updatedTask.status).toBe('COMPLETED');
        expect(updatedTask.completedAt).toEqual(completedTask.completedAt); // 完了日は維持される
      }
    });
  });

  // バリデーションテスト
  describe('バリデーション', () => {
    it('不正な名前（空文字）ではエラーが返されること', () => {
      const result = updateTask(mockTask, { name: '' });

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.type).toBe('VALIDATION_ERROR');
      }
    });

    it('不正な優先度ではエラーが返されること', () => {
      // 不正な値をテストするために型アサーションを使用
      const result = updateTask(mockTask, { priority: 'INVALID_PRIORITY' as Priority });

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.type).toBe('VALIDATION_ERROR');
      }
    });

    it('不正なステータスではエラーが返されること', () => {
      // 不正な値をテストするために型アサーションを使用
      const result = updateTask(mockTask, { status: 'INVALID_STATUS' as TaskStatus });

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.type).toBe('VALIDATION_ERROR');
      }
    });
  });

  // 不変フィールドの保護に関するテスト
  describe('不変フィールドの保護', () => {
    it('IDの変更を試みるとエラーが返されること', () => {
      const result = updateTask(mockTask, { id: createTaskId('different-id') });

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        const error = result.error;
        expect(error.type).toBe('IMMUTABLE_FIELD_MODIFICATION');
        if (isImmutableFieldError(error)) {
          expect(error.field).toBe('id');
        }
      }
    });

    it('作成日時の変更を試みるとエラーが返されること', () => {
      const newDate = new Date('2025-03-10T00:00:00.000Z');
      const result = updateTask(mockTask, { createdAt: newDate });

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        const error = result.error;
        expect(error.type).toBe('IMMUTABLE_FIELD_MODIFICATION');
        if (isImmutableFieldError(error)) {
          expect(error.field).toBe('createdAt');
        }
      }
    });
  });

  // ドメインルールに基づくバリデーションのテスト
  describe('ドメインルールバリデーション', () => {
    it('キャンセルされたタスクを他の状態に変更するとエラーが返されること', () => {
      // キャンセル状態のタスクを作成
      const cancelledTask: Task = {
        ...mockTask,
        status: 'CANCELLED',
      };

      const result = updateTask(cancelledTask, { status: 'IN_PROGRESS' });

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        const error = result.error;
        expect(error.type).toBe('INVALID_STATUS_TRANSITION');
        expect(error.message).toContain('キャンセルされたタスク');
      }
    });
  });

  // エラーメッセージの詳細検証
  describe('エラーメッセージの詳細', () => {
    it('バリデーションエラーには具体的なフィールド情報が含まれること', () => {
      const result = updateTask(mockTask, { name: '' });

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        const error = result.error;
        expect(error.type).toBe('VALIDATION_ERROR');
        if (isValidationError(error)) {
          expect(error.errors).toBeDefined();
          expect(error.errors.name).toBeDefined();
        }
      }
    });
  });

  // 不変性テスト
  describe('不変性', () => {
    it('元のタスクオブジェクトが変更されていないこと', () => {
      const originalTask = { ...mockTask };
      const originalTaskJson = JSON.stringify(mockTask);

      updateTask(mockTask, { name: '不変性テスト' });

      // 元のオブジェクトが変更されていないことを確認
      expect(JSON.stringify(mockTask)).toBe(originalTaskJson);
      expect(mockTask).toEqual(originalTask);
    });
  });

  // 空の更新パラメータの場合
  describe('エッジケース', () => {
    it('空の更新パラメータでは、updatedAtのみが更新されること', () => {
      const result = updateTask(mockTask, {});

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        const updatedTask = result.value;
        // 元のタスクと同じ値が保持されていることを確認
        expect(updatedTask.name).toBe(mockTask.name);
        expect(updatedTask.description).toBe(mockTask.description);
        expect(updatedTask.status).toBe(mockTask.status);
        expect(updatedTask.category).toBe(mockTask.category);
        expect(updatedTask.priority).toBe(mockTask.priority);
        expect(updatedTask.tags).toEqual(mockTask.tags);
        // updatedAtのみが更新されていることを確認
        expect(updatedTask.updatedAt.getTime()).toBeGreaterThan(mockTask.updatedAt.getTime());
      }
    });
  });
});