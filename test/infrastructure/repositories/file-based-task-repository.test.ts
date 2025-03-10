/**
 * ファイルベースのタスクリポジトリのテスト
 *
 * このファイルはファイルシステムを使用したタスクリポジトリの実装をテストします。
 * MockFileSystemAdapterを使用して、実際のファイルシステムにアクセスせずにテストします。
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ok, err } from 'neverthrow';
import { createTaskId } from '../../../src/domain/schemas/task-schema.js';
import type { Task } from '../../../src/domain/types/Task.js';
import type { FileSystemAdapter } from '../../../src/infrastructure/adapters/file-system-adapter.js';
import { createFileBasedTaskRepository } from '../../../src/infrastructure/repositories/file-based-task-repository.js';

// モックファイルシステムアダプタを作成
function createMockFileSystemAdapter(): FileSystemAdapter {
  // インメモリストレージ
  const storage = new Map<string, string>();
  // ロック状態の追跡
  const locks = new Set<string>();

  return {
    readFile: vi.fn().mockImplementation(async (path: string) => {
      if (!storage.has(path)) {
        return err({
          type: 'NOT_FOUND',
          message: `File not found at path: ${path}`,
          path
        });
      }
      return ok(storage.get(path) as string);
    }),

    writeFile: vi.fn().mockImplementation(async (path: string, content: string) => {
      storage.set(path, content);
      return ok(undefined);
    }),

    deleteFile: vi.fn().mockImplementation(async (path: string) => {
      if (!storage.has(path)) {
        return err({
          type: 'NOT_FOUND',
          message: `Cannot delete non-existent file: ${path}`,
          path
        });
      }
      storage.delete(path);
      return ok(undefined);
    }),

    fileExists: vi.fn().mockImplementation(async (path: string) => {
      return ok(storage.has(path));
    }),

    createDirectory: vi.fn().mockImplementation(async () => {
      return ok(undefined);
    }),

    ensureDirectory: vi.fn().mockImplementation(async () => {
      return ok(undefined);
    }),

    listFiles: vi.fn().mockImplementation(async (directory: string) => {
      const files = Array.from(storage.keys()).filter(path =>
        path.startsWith(directory) && path !== directory
      );
      return ok(files);
    }),

    acquireLock: vi.fn().mockImplementation(async (resourceId: string) => {
      if (locks.has(resourceId)) {
        return err({
          type: 'LOCK_ERROR',
          message: `Resource already locked: ${resourceId}`,
          resourceId
        });
      }
      locks.add(resourceId);
      return ok(undefined);
    }),

    releaseLock: vi.fn().mockImplementation(async (resourceId: string) => {
      locks.delete(resourceId);
      return ok(undefined);
    }),

    atomicWriteFile: vi.fn().mockImplementation(async (path: string, content: string) => {
      storage.set(path, content);
      return ok(undefined);
    }),

    withLock: vi.fn().mockImplementation(async (resourceId: string, operation) => {
      if (locks.has(resourceId)) {
        return err({
          type: 'LOCK_ERROR',
          message: `Resource already locked: ${resourceId}`,
          resourceId
        });
      }
      locks.add(resourceId);
      try {
        const result = await operation();
        return result;
      } finally {
        locks.delete(resourceId);
      }
    }),

    readFileStream: vi.fn(),
    writeFileStream: vi.fn()
  };
}

// テスト用のサンプルタスクを作成
function createSampleTask(id = '1'): Task {
  return {
    id: createTaskId(id),
    name: `Task ${id}`,
    description: `Description for task ${id}`,
    status: 'NOT_STARTED',
    category: 'WORK',
    priority: 'MEDIUM',
    estimatedDuration: 60,
    createdAt: new Date('2025-03-01T00:00:00Z'),
    updatedAt: new Date('2025-03-01T00:00:00Z'),
    tags: ['test', 'sample']
  };
}

describe('FileBasedTaskRepository', () => {
  let mockFs: FileSystemAdapter;
  let repository: ReturnType<typeof createFileBasedTaskRepository>;
  const dataDir = '/tasks';

  beforeEach(() => {
    // テスト毎にモックをリセット
    mockFs = createMockFileSystemAdapter();
    repository = createFileBasedTaskRepository(mockFs, { dataDir });
  });

  describe('findById', () => {
    it('存在するタスクを正しく取得できること', async () => {
      // Arrange
      const taskId = createTaskId('123');
      const task = createSampleTask('123');
      const taskPath = `${dataDir}/${taskId}.json`;

      // モックのファイルシステムにタスクを保存
      await mockFs.writeFile(taskPath, JSON.stringify({
        id: task.id,
        name: task.name,
        description: task.description,
        status: task.status,
        category: task.category,
        priority: task.priority,
        estimatedDuration: task.estimatedDuration,
        createdAt: task.createdAt.toISOString(),
        updatedAt: task.updatedAt.toISOString(),
        tags: task.tags
      }));

      // Act
      const result = await repository.findById(taskId);

      // Assert
      expect(result.isOk()).toBe(true);
      if (result.isOk() === true) {
        expect(result.value.id).toEqual(taskId);
        expect(result.value.name).toEqual(task.name);
        expect(result.value.description).toEqual(task.description);
      }
      expect(mockFs.readFile).toHaveBeenCalledWith(taskPath);
    });

    it('存在しないタスクIDの場合はNOT_FOUNDエラーを返すこと', async () => {
      // Arrange
      const taskId = createTaskId('non-existent');

      // Act
      const result = await repository.findById(taskId);

      // Assert
      expect(result.isErr()).toBe(true);
      if (result.isErr() === true) {
        expect(result.error.type).toEqual('NOT_FOUND');
      }
    });
  });

  describe('save', () => {
    it('新しいタスクを保存できること', async () => {
      // Arrange
      const task = createSampleTask('new-task');
      const taskPath = `${dataDir}/${task.id}.json`;

      // Act
      const result = await repository.save(task);

      // Assert
      expect(result.isOk()).toBe(true);
      if (result.isOk() === true) {
        expect(result.value).toEqual(task);
      }
      expect(mockFs.writeFile).toHaveBeenCalledWith(
        taskPath,
        expect.any(String)
      );
    });

    it('既存のタスクを更新できること', async () => {
      // Arrange
      const taskId = createTaskId('existing');
      const originalTask = createSampleTask('existing');
      const taskPath = `${dataDir}/${taskId}.json`;

      // モックのファイルシステムに元のタスクを保存
      await mockFs.writeFile(taskPath, JSON.stringify({
        id: originalTask.id,
        name: originalTask.name,
        description: originalTask.description,
        status: originalTask.status,
        category: originalTask.category,
        priority: originalTask.priority,
        estimatedDuration: originalTask.estimatedDuration,
        createdAt: originalTask.createdAt.toISOString(),
        updatedAt: originalTask.updatedAt.toISOString(),
        tags: originalTask.tags
      }));

      // 更新されたタスク
      const updatedTask = {
        ...originalTask,
        name: 'Updated Task Name',
        status: 'IN_PROGRESS' as const,
        updatedAt: new Date('2025-03-02T00:00:00Z')
      };

      // Act
      const result = await repository.save(updatedTask);

      // Assert
      expect(result.isOk()).toBe(true);
      if (result.isOk() === true) {
        expect(result.value.name).toEqual('Updated Task Name');
        expect(result.value.status).toEqual('IN_PROGRESS');
      }

      // 同じファイルパスに書き込みが行われたことを確認
      expect(mockFs.writeFile).toHaveBeenCalledWith(
        taskPath,
        expect.any(String)
      );
    });
  });

  describe('delete', () => {
    it('存在するタスクを削除できること', async () => {
      // Arrange
      const taskId = createTaskId('to-delete');
      const task = createSampleTask('to-delete');
      const taskPath = `${dataDir}/${taskId}.json`;

      // モックのファイルシステムにタスクを保存
      await mockFs.writeFile(taskPath, JSON.stringify({
        id: task.id,
        name: task.name,
        description: task.description,
        status: task.status,
        category: task.category,
        priority: task.priority,
        estimatedDuration: task.estimatedDuration,
        createdAt: task.createdAt.toISOString(),
        updatedAt: task.updatedAt.toISOString(),
        tags: task.tags
      }));

      // Act
      const result = await repository.delete(taskId);

      // Assert
      expect(result.isOk()).toBe(true);
      expect(mockFs.deleteFile).toHaveBeenCalledWith(taskPath);

      // ファイルが削除されたことを確認
      const fileExists = await mockFs.fileExists(taskPath);
      expect(fileExists.isOk() && fileExists.value).toBe(false);
    });

    it('存在しないタスクを削除しようとするとNOT_FOUNDエラーを返すこと', async () => {
      // Arrange
      const taskId = createTaskId('non-existent');

      // Act
      const result = await repository.delete(taskId);

      // Assert
      expect(result.isErr()).toBe(true);
      if (result.isErr() === true) {
        expect(result.error.type).toEqual('NOT_FOUND');
      }
    });
  });

  describe('findAll', () => {
    it('すべてのタスクを取得できること', async () => {
      // Arrange
      const tasks = [
        createSampleTask('1'),
        createSampleTask('2'),
        createSampleTask('3')
      ];

      // モックのファイルシステムに複数のタスクを保存
      for (const task of tasks) {
        const taskPath = `${dataDir}/${task.id}.json`;
        await mockFs.writeFile(taskPath, JSON.stringify({
          id: task.id,
          name: task.name,
          description: task.description,
          status: task.status,
          category: task.category,
          priority: task.priority,
          estimatedDuration: task.estimatedDuration,
          createdAt: task.createdAt.toISOString(),
          updatedAt: task.updatedAt.toISOString(),
          tags: task.tags
        }));
      }

      // Act
      const result = await repository.findAll();

      // Assert
      expect(result.isOk()).toBe(true);
      if (result.isOk() === true) {
        expect(result.value.length).toEqual(3);
        // タスクIDでソートして比較
        const sortedTasks = [...result.value].sort((a, b) =>
          a.id < b.id ? -1 : a.id > b.id ? 1 : 0
        );
        expect(sortedTasks[0].id).toEqual(tasks[0].id);
        expect(sortedTasks[1].id).toEqual(tasks[1].id);
        expect(sortedTasks[2].id).toEqual(tasks[2].id);
      }
    });

    it('フィルターに一致するタスクのみ取得できること', async () => {
      // Arrange
      const tasks = [
        { ...createSampleTask('1'), status: 'NOT_STARTED' as const, category: 'WORK' as const },
        { ...createSampleTask('2'), status: 'IN_PROGRESS' as const, category: 'WORK' as const },
        { ...createSampleTask('3'), status: 'COMPLETED' as const, category: 'PERSONAL_DEV' as const }
      ];

      // モックのファイルシステムに複数のタスクを保存
      for (const task of tasks) {
        const taskPath = `${dataDir}/${task.id}.json`;
        await mockFs.writeFile(taskPath, JSON.stringify({
          id: task.id,
          name: task.name,
          description: task.description,
          status: task.status,
          category: task.category,
          priority: task.priority,
          estimatedDuration: task.estimatedDuration,
          createdAt: task.createdAt.toISOString(),
          updatedAt: task.updatedAt.toISOString(),
          tags: task.tags
        }));
      }

      // Act: WORK カテゴリのタスクのみフィルター
      const result = await repository.findAll({ category: 'WORK' });

      // Assert
      expect(result.isOk()).toBe(true);
      if (result.isOk() === true) {
        expect(result.value.length).toEqual(2);
        const ids = result.value.map((task: Task) => task.id);
        expect(ids).toContain(tasks[0].id);
        expect(ids).toContain(tasks[1].id);
        expect(ids).not.toContain(tasks[2].id);
      }
    });
  });

  describe('count', () => {
    it('すべてのタスク数を正しくカウントできること', async () => {
      // Arrange
      const tasks = [
        createSampleTask('1'),
        createSampleTask('2'),
        createSampleTask('3')
      ];

      // モックのファイルシステムに複数のタスクを保存
      for (const task of tasks) {
        const taskPath = `${dataDir}/${task.id}.json`;
        await mockFs.writeFile(taskPath, JSON.stringify({
          id: task.id,
          name: task.name,
          description: task.description,
          status: task.status,
          category: task.category,
          priority: task.priority,
          estimatedDuration: task.estimatedDuration,
          createdAt: task.createdAt.toISOString(),
          updatedAt: task.updatedAt.toISOString(),
          tags: task.tags
        }));
      }

      // Act
      const result = await repository.count();

      // Assert
      expect(result.isOk()).toBe(true);
      if (result.isOk() === true) {
        expect(result.value).toEqual(3);
      }
    });

    it('フィルターに一致するタスク数のみカウントできること', async () => {
      // Arrange
      const tasks = [
        { ...createSampleTask('1'), status: 'NOT_STARTED' as const },
        { ...createSampleTask('2'), status: 'IN_PROGRESS' as const },
        { ...createSampleTask('3'), status: 'COMPLETED' as const }
      ];

      // モックのファイルシステムに複数のタスクを保存
      for (const task of tasks) {
        const taskPath = `${dataDir}/${task.id}.json`;
        await mockFs.writeFile(taskPath, JSON.stringify({
          id: task.id,
          name: task.name,
          description: task.description,
          status: task.status,
          category: task.category,
          priority: task.priority,
          estimatedDuration: task.estimatedDuration,
          createdAt: task.createdAt.toISOString(),
          updatedAt: task.updatedAt.toISOString(),
          tags: task.tags
        }));
      }

      // Act: NOT_STARTED または IN_PROGRESS のタスクのみカウント
      const result = await repository.count({
        status: ['NOT_STARTED', 'IN_PROGRESS']
      });

      // Assert
      expect(result.isOk()).toBe(true);
      if (result.isOk() === true) {
        expect(result.value).toEqual(2);
      }
    });
  });
});