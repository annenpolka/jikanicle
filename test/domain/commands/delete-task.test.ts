import { describe, expect, it, vi } from 'vitest';
import { err, ok } from 'neverthrow';
import type { Task } from '../../../src/domain/types/Task';
import { createTaskId } from '../../../src/domain/types/Task';
import type { TaskRepository, TaskRepositoryError } from '../../../src/application/repositories/task-repository';
import type { DeleteTaskError } from '../../../src/domain/commands/delete-task';
import { deleteTask } from '../../../src/domain/commands/delete-task';

describe('deleteTask - 単体テスト', () => {
  // テスト用タスクID
  const taskId = createTaskId('task-123');

  // テスト用タスク
  const mockTask: Task = {
    id: taskId,
    name: 'テストタスク',
    description: 'テスト用タスクの説明',
    status: 'NOT_STARTED',
    category: 'WORK',
    priority: 'MEDIUM',
    estimatedDuration: 30,
    createdAt: new Date('2025-01-01'),
    updatedAt: new Date('2025-01-01'),
    tags: ['テスト']
  };

  // モックリポジトリを作成する関数
  const createMockRepository = (overrides: Partial<TaskRepository> = {}): TaskRepository => {
    return {
      findById: vi.fn(),
      findAll: vi.fn(),
      save: vi.fn(),
      delete: vi.fn(),
      count: vi.fn(),
      ...overrides
    };
  };

  it('存在するタスクを正常に削除できること', async () => {
    // モックリポジトリ作成（各メソッドの振る舞いを初期化時に定義）
    const mockTaskRepository = createMockRepository({
      findById: vi.fn().mockResolvedValue(ok(mockTask)),
      delete: vi.fn().mockResolvedValue(ok(undefined))
    });

    // テスト対象の関数を実行
    const result = await deleteTask(taskId, mockTaskRepository);

    // 結果を検証
    expect(result.isOk()).toBe(true);

    // リポジトリメソッドの呼び出しを検証
    expect(mockTaskRepository.findById).toHaveBeenCalledWith(taskId);
    expect(mockTaskRepository.delete).toHaveBeenCalledWith(taskId);
  });

  it('存在しないタスクを削除しようとするとエラーを返すこと', async () => {
    // モックリポジトリ作成
    // タスクが見つからないケース
    const notFoundError: TaskRepositoryError = {
      type: 'NOT_FOUND',
      message: `タスクID: ${taskId} は見つかりませんでした`
    };
    const mockTaskRepository = createMockRepository({ findById: vi.fn().mockResolvedValue(err(notFoundError)) });

    // テスト対象の関数を実行
    const result = await deleteTask(taskId, mockTaskRepository);

    // 結果を検証
    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      expect(result.error).toEqual<DeleteTaskError>({
        type: 'TASK_NOT_FOUND',
        message: `タスクID: ${taskId} は見つかりませんでした`
      });
    }

    // deleteメソッドが呼ばれていないことを検証
    expect(mockTaskRepository.delete).not.toHaveBeenCalled();
  });

  it('削除処理中にリポジトリでエラーが発生した場合、エラーを返すこと', async () => {
    // リポジトリエラーを模擬
    const storageError: TaskRepositoryError = {
      type: 'STORAGE_ERROR',
      message: 'データの削除中にエラーが発生しました',
      cause: new Error('DB接続エラー')
    };

    // モックリポジトリ作成（各メソッドの振る舞いを初期化時に定義）
    const mockTaskRepository = createMockRepository({
      findById: vi.fn().mockResolvedValue(ok(mockTask)),
      delete: vi.fn().mockResolvedValue(err(storageError))
    });

    // テスト対象の関数を実行
    const result = await deleteTask(taskId, mockTaskRepository);

    // 結果を検証
    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      expect(result.error).toEqual<DeleteTaskError>({
        type: 'STORAGE_ERROR',
        message: 'データの削除中にエラーが発生しました',
        cause: storageError.cause
      });
    }
  });
});