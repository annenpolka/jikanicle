import { describe, it, expect } from 'vitest';
// 型インポートをグループ化
import type { Task } from '../../../src/domain/types/Task.js';
// 値インポート
import { deleteTask } from '../../../src/domain/commands/delete-task.js';
import { createInMemoryTaskRepository } from '../../../src/infrastructure/repositories/in-memory-task-repository.js';
import { createTaskId } from '../../../src/domain/types/Task.js';

describe('deleteTask - InMemoryRepository統合テスト', () => {
  const createTestTask = (override: Partial<Task> = {}): Task => ({
    id: createTaskId('test-1'),
    name: 'テストタスク',
    description: 'テスト用のタスクです',
    status: 'NOT_STARTED',
    category: 'WORK',
    priority: 'MEDIUM',
    estimatedDuration: 60,
    createdAt: new Date('2025-03-09T00:00:00.000Z'),
    updatedAt: new Date('2025-03-09T00:00:00.000Z'),
    tags: ['test'],
    ...override,
  });

  it('存在するタスクを正常に削除できること', async () => {
    const repository = createInMemoryTaskRepository();
    // 1. タスクを作成して保存
    const task = createTestTask();
    await repository.save(task);

    // 2. 削除関数を実行
    const result = await deleteTask(task.id, repository);


    // 3. 削除が成功したことを確認
    expect(result.isOk()).toBe(true);

    // 4. リポジトリからタスクが削除されたことを確認
    const findResult = await repository.findById(task.id);
    expect(findResult.isErr()).toBe(true);
    findResult.mapErr(error => {
      expect(error.type).toBe('NOT_FOUND');
    });
  });

  it('存在しないタスクを削除しようとするとエラーを返すこと', async () => {
    const repository = createInMemoryTaskRepository();
    // 存在しないIDを使用
    const nonExistentId = createTaskId('non-existent');

    // 削除関数を実行
    const result = await deleteTask(nonExistentId, repository);

    // エラーが返されることを確認
    expect(result.isErr()).toBe(true);
    result.mapErr(error => {
      expect(error.type).toBe('TASK_NOT_FOUND');
      expect(error.message).toContain(nonExistentId);
    });
  });
});