import { describe, it, expect, beforeEach } from 'vitest';
// 値インポート
import { createInMemoryTaskRepository } from '../../../src/infrastructure/repositories/in-memory-task-repository.js';
import { createTaskId } from '../../../src/domain/types/Task.js';
// 型インポート
import type { TaskRepositoryError } from '../../../src/application/repositories/task-repository.js';
import type { Task } from '../../../src/domain/types/Task.js';

describe('InMemoryTaskRepository', () => {
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

  // 関数型プログラミングのルールに従い、letではなくconstを使用
  const getRepository = (): ReturnType<typeof createInMemoryTaskRepository> => createInMemoryTaskRepository();

  beforeEach(() => {
    // 各テストでrepositoryを初期化するのではなく、各テストで新しいインスタンスを取得
  });

  describe('findById', () => {
    it('存在しないIDの場合はNOT_FOUNDエラーを返す', async () => {
      const repository = getRepository();
      const result = await repository.findById(createTaskId('non-existent'));

      expect(result.isErr()).toBe(true);
      result.mapErr((error: TaskRepositoryError) => {
        expect(error.type).toBe('NOT_FOUND');
      });
    });

    it('存在するIDの場合はタスクを返す', async () => {
      const task = createTestTask();
      const repository = getRepository();
      await repository.save(task);

      const result = await repository.findById(task.id);

      expect(result.isOk()).toBe(true);
      result.map((foundTask) => {
        expect(foundTask).toEqual(task);
      });
    });
  });

  describe('findAll', () => {
    it('フィルタなしの場合はすべてのタスクを返す', async () => {
      const task1 = createTestTask({ id: createTaskId('test-1') });
      const task2 = createTestTask({ id: createTaskId('test-2') });
      const repository = getRepository();

      await repository.save(task1);
      await repository.save(task2);

      const result = await repository.findAll();

      expect(result.isOk()).toBe(true);
      result.map((tasks) => {
        expect(tasks).toHaveLength(2);
        expect(tasks).toContainEqual(task1);
        expect(tasks).toContainEqual(task2);
      });
    });

    it('statusフィルタでタスクをフィルタリングできる', async () => {
      const task1 = createTestTask({ id: createTaskId('test-1'), status: 'NOT_STARTED' });
      const task2 = createTestTask({ id: createTaskId('test-2'), status: 'COMPLETED' });
      const repository = getRepository();

      await repository.save(task1);
      await repository.save(task2);

      // 配列として渡すように修正
      const result = await repository.findAll({ status: ['NOT_STARTED'] });

      expect(result.isOk()).toBe(true);
      result.map((tasks) => {
        expect(tasks).toHaveLength(1);
        expect(tasks[0]).toEqual(task1);
      });
    });

    it('categoryフィルタでタスクをフィルタリングできる', async () => {
      const task1 = createTestTask({ id: createTaskId('test-1'), category: 'WORK' });
      const task2 = createTestTask({ id: createTaskId('test-2'), category: 'LEARNING' });
      const repository = getRepository();

      await repository.save(task1);
      await repository.save(task2);

      const result = await repository.findAll({ category: 'LEARNING' });

      expect(result.isOk()).toBe(true);
      result.map((tasks) => {
        expect(tasks).toHaveLength(1);
        expect(tasks[0]).toEqual(task2);
      });
    });

    it('tagsフィルタでタスクをフィルタリングできる', async () => {
      const task1 = createTestTask({ id: createTaskId('test-1'), tags: ['test', 'important'] });
      const task2 = createTestTask({ id: createTaskId('test-2'), tags: ['test'] });
      const repository = getRepository();

      await repository.save(task1);
      await repository.save(task2);

      const result = await repository.findAll({ tags: ['important'] });

      expect(result.isOk()).toBe(true);
      result.map((tasks) => {
        expect(tasks).toHaveLength(1);
        expect(tasks[0]).toEqual(task1);
      });
    });

    it('作成日フィルタでタスクをフィルタリングできる', async () => {
      const task1 = createTestTask({
        id: createTaskId('test-1'),
        createdAt: new Date('2025-03-01T00:00:00.000Z')
      });
      const task2 = createTestTask({
        id: createTaskId('test-2'),
        createdAt: new Date('2025-03-10T00:00:00.000Z')
      });
      const repository = getRepository();

      await repository.save(task1);
      await repository.save(task2);

      const result = await repository.findAll({
        createdAfter: new Date('2025-03-05T00:00:00.000Z'),
        createdBefore: new Date('2025-03-15T00:00:00.000Z')
      });

      expect(result.isOk()).toBe(true);
      result.map((tasks) => {
        expect(tasks).toHaveLength(1);
        expect(tasks[0]).toEqual(task2);
      });
    });

    it('テキスト検索でタスクを検索できる', async () => {
      const task1 = createTestTask({
        id: createTaskId('test-1'),
        name: '重要な会議',
        description: '部署の戦略会議'
      });
      const task2 = createTestTask({
        id: createTaskId('test-2'),
        name: '日報作成',
        description: '今日の作業内容をまとめる'
      });
      const repository = getRepository();

      await repository.save(task1);
      await repository.save(task2);

      const result = await repository.findAll({ textSearch: '会議' });

      expect(result.isOk()).toBe(true);
      result.map((tasks) => {
        expect(tasks).toHaveLength(1);
        expect(tasks[0]).toEqual(task1);
      });
    });
  });

  describe('save', () => {
    it('新しいタスクを保存できる', async () => {
      const task = createTestTask();
      const repository = getRepository();

      const result = await repository.save(task);

      expect(result.isOk()).toBe(true);
      result.map((savedTask) => {
        expect(savedTask).toEqual(task);
      });

      // findByIdで確認
      const findResult = await repository.findById(task.id);
      expect(findResult.isOk()).toBe(true);
    });

    it('既存のタスクを更新できる', async () => {
      const task = createTestTask();
      const repository = getRepository();
      await repository.save(task);

      const updatedTask = {
        ...task,
        name: '更新されたタスク',
        updatedAt: new Date('2025-03-10T00:00:00.000Z')
      };

      const result = await repository.save(updatedTask);

      expect(result.isOk()).toBe(true);

      // findByIdで確認
      const findResult = await repository.findById(task.id);
      expect(findResult.isOk()).toBe(true);
      findResult.map((foundTask) => {
        expect(foundTask).toEqual(updatedTask);
        expect(foundTask).not.toEqual(task);
      });
    });
  });

  describe('delete', () => {
    it('存在しないIDの場合はNOT_FOUNDエラーを返す', async () => {
      const repository = getRepository();
      const result = await repository.delete(createTaskId('non-existent'));

      expect(result.isErr()).toBe(true);
      result.mapErr((error: TaskRepositoryError) => {
        expect(error.type).toBe('NOT_FOUND');
      });
    });

    it('存在するIDの場合はタスクを削除する', async () => {
      const task = createTestTask();
      const repository = getRepository();
      await repository.save(task);

      const deleteResult = await repository.delete(task.id);
      expect(deleteResult.isOk()).toBe(true);

      // 削除後に検索するとNOT_FOUNDになることを確認
      const findResult = await repository.findById(task.id);
      expect(findResult.isErr()).toBe(true);
      findResult.mapErr((error: TaskRepositoryError) => {
        expect(error.type).toBe('NOT_FOUND');
      });
    });
  });

  describe('count', () => {
    it('フィルタなしの場合は全タスク数を返す', async () => {
      const task1 = createTestTask({ id: createTaskId('test-1') });
      const task2 = createTestTask({ id: createTaskId('test-2') });
      const repository = getRepository();

      await repository.save(task1);
      await repository.save(task2);

      const result = await repository.count();

      expect(result.isOk()).toBe(true);
      result.map((count: number) => {
        expect(count).toBe(2);
      });
    });

    it('フィルタありの場合はフィルタ条件に一致するタスク数を返す', async () => {
      const task1 = createTestTask({
        id: createTaskId('test-1'),
        status: 'NOT_STARTED'
      });
      const task2 = createTestTask({
        id: createTaskId('test-2'),
        status: 'COMPLETED'
      });
      const repository = getRepository();

      await repository.save(task1);
      await repository.save(task2);

      // 配列として渡すように修正
      const result = await repository.count({ status: ['COMPLETED'] });

      expect(result.isOk()).toBe(true);
      result.map((count: number) => {
        expect(count).toBe(1);
      });
    });
  });
});