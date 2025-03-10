/**
 * タスクシリアライズ/デシリアライズユーティリティのテスト
 *
 * このテストスイートでは、タスクオブジェクトとJSON形式の相互変換処理の検証を行います。
 * 主なテスト項目：
 * - 単一タスクのシリアライズ/デシリアライズ
 * - 複数タスクのシリアライズ/デシリアライズ
 * - エラーケースの検証
 * - 日付処理の検証
 */

import { describe, expect, it } from 'vitest';
import {
  serializeTask,
  deserializeTask,
  serializeTasks,
  deserializeTasks,
  toSerializable,
  fromSerializable,
  type SerializedTask
} from '../../../src/infrastructure/utils/task-serialization.js';
import {
  type Task,
  createTaskId,
  type Category,
  type TaskStatus,
  type Priority
} from '../../../src/domain/schemas/task-schema.js';

/**
 * テスト用のモックタスクを作成する関数
 */
function createMockTask(overrides: Partial<Task> = {}): Task {
  return {
    id: createTaskId('task-123'),
    name: 'サンプルタスク',
    description: 'これはテスト用のタスクです',
    status: 'NOT_STARTED' as TaskStatus,
    category: 'WORK' as Category,
    priority: 'MEDIUM' as Priority,
    estimatedDuration: 30,
    createdAt: new Date('2025-01-01T00:00:00Z'),
    updatedAt: new Date('2025-01-01T01:00:00Z'),
    completedAt: undefined,
    tags: ['サンプル', 'テスト'],
    ...overrides
  };
}

/**
 * テスト用の完了済みモックタスクを作成する関数
 */
function createCompletedMockTask(): Task {
  return createMockTask({
    status: 'COMPLETED' as TaskStatus,
    completedAt: new Date('2025-01-02T00:00:00Z')
  });
}

/**
 * テスト用の複数タスクを作成する関数
 */
function createMockTasks(count: number): Task[] {
  return Array.from({ length: count }, (_, index) =>
    createMockTask({
      id: createTaskId(`task-${index + 1}`),
      name: `タスク ${index + 1}`,
      updatedAt: new Date(Date.now() + index * 1000)
    })
  );
}

describe('task-serialization', () => {
  describe('serializeTask', () => {
    it('タスクを正しくJSON文字列にシリアライズできること', () => {
      // Arrange
      const task = createMockTask();

      // Act
      const result = serializeTask(task);

      // Assert
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        const jsonString = result.value;
        const parsed = JSON.parse(jsonString);

        expect(parsed.id).toBe('task-123');
        expect(parsed.name).toBe('サンプルタスク');
        expect(parsed.createdAt).toBe('2025-01-01T00:00:00.000Z');
        expect(parsed.updatedAt).toBe('2025-01-01T01:00:00.000Z');
        expect(parsed.completedAt).toBeUndefined();
      }
    });

    it('completedAtが存在するタスクを正しくシリアライズできること', () => {
      // Arrange
      const task = createCompletedMockTask();

      // Act
      const result = serializeTask(task);

      // Assert
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        const jsonString = result.value;
        const parsed = JSON.parse(jsonString);

        expect(parsed.status).toBe('COMPLETED');
        expect(parsed.completedAt).toBe('2025-01-02T00:00:00.000Z');
      }
    });

    it('シリアライズ中にエラーが発生した場合、適切なエラーを返すこと', () => {
      // Arrange
      const task = createMockTask();
      // 不正なDateオブジェクトを持つタスク
      const invalidTask = {
        ...task,
        createdAt: { invalid: 'date' } as unknown as Date
      };

      // Act
      const result = serializeTask(invalidTask as Task);

      // Assert
      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        const error = result.error;
        expect(error.type).toBe('serialization');
        expect(error.message).toContain('変換処理中にエラーが発生しました');
      }
    });
  });

  describe('deserializeTask', () => {
    it('有効なJSON文字列からタスクを正しく復元できること', () => {
      // Arrange
      const task = createMockTask();
      const jsonString = serializeTask(task).unwrapOr('');

      // Act
      const result = deserializeTask(jsonString);

      // Assert
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        const deserializedTask = result.value;

        expect(deserializedTask.id).toEqual(task.id);
        expect(deserializedTask.name).toBe(task.name);
        expect(deserializedTask.description).toBe(task.description);
        expect(deserializedTask.status).toBe(task.status);
        expect(deserializedTask.createdAt.toISOString()).toBe(task.createdAt.toISOString());
        expect(deserializedTask.updatedAt.toISOString()).toBe(task.updatedAt.toISOString());
        expect(deserializedTask.completedAt).toBeUndefined();
        expect(deserializedTask.tags).toEqual(task.tags);
      }
    });

    it('completedAtを含むJSON文字列からタスクを正しく復元できること', () => {
      // Arrange
      const task = createCompletedMockTask();
      const jsonString = serializeTask(task).unwrapOr('');

      // Act
      const result = deserializeTask(jsonString);

      // Assert
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        const deserializedTask = result.value;

        expect(deserializedTask.status).toBe('COMPLETED');
        expect(deserializedTask.completedAt?.toISOString()).toBe(task.completedAt?.toISOString());
      }
    });

    it('不正なJSON文字列に対して適切なエラーを返すこと', () => {
      // Arrange
      const invalidJson = '{invalid: json}';

      // Act
      const result = deserializeTask(invalidJson);

      // Assert
      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        const error = result.error;
        expect(error.type).toBe('deserialization');
        expect(error.message).toContain('JSONパース中にエラーが発生しました');
      }
    });

    it('必須プロパティが欠けているJSON文字列に対して適切なエラーを返すこと', () => {
      // Arrange
      const invalidTask = {
        id: 'task-123',
        name: 'サンプルタスク',
        // descriptionが欠けている
        status: 'NOT_STARTED',
        category: 'WORK',
        priority: 'MEDIUM',
        estimatedDuration: 30,
        createdAt: '2025-01-01T00:00:00Z',
        updatedAt: '2025-01-01T01:00:00Z',
        tags: ['サンプル', 'テスト']
      };
      const jsonString = JSON.stringify(invalidTask);

      // Act
      const result = deserializeTask(jsonString);

      // Assert
      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        const error = result.error;
        expect(error.type).toBe('deserialization');
        expect(error.message).toContain('不正なタスクデータ形式です');
      }
    });

    it('不正な日付文字列に対して適切なエラーを返すこと', () => {
      // Arrange
      const invalidTask = {
        id: 'task-123',
        name: 'サンプルタスク',
        description: 'これはテスト用のタスクです',
        status: 'NOT_STARTED',
        category: 'WORK',
        priority: 'MEDIUM',
        estimatedDuration: 30,
        createdAt: 'invalid-date', // 不正な日付形式
        updatedAt: '2025-01-01T01:00:00Z',
        tags: ['サンプル', 'テスト']
      };
      const jsonString = JSON.stringify(invalidTask);

      // Act
      const result = deserializeTask(jsonString);

      // Assert
      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        const error = result.error;
        expect(error.type).toBe('deserialization');
        expect(error.message).toContain('不正なタスクデータ形式です');
      }
    });
  });

  describe('serializeTasks', () => {
    it('複数のタスクを正しくJSON文字列にシリアライズできること', () => {
      // Arrange
      const tasks = createMockTasks(3);

      // Act
      const result = serializeTasks(tasks);

      // Assert
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        const jsonString = result.value;
        const parsed = JSON.parse(jsonString);

        expect(Array.isArray(parsed)).toBe(true);
        expect(parsed.length).toBe(3);
        expect(parsed[0].id).toBe('task-1');
        expect(parsed[1].id).toBe('task-2');
        expect(parsed[2].id).toBe('task-3');
      }
    });

    it('空の配列を正しくシリアライズできること', () => {
      // Arrange
      const tasks: Task[] = [];

      // Act
      const result = serializeTasks(tasks);

      // Assert
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        const jsonString = result.value;
        const parsed = JSON.parse(jsonString);

        expect(Array.isArray(parsed)).toBe(true);
        expect(parsed.length).toBe(0);
      }
    });

    it('シリアライズ中にエラーが発生した場合、適切なエラーを返すこと', () => {
      // Arrange
      const tasks = createMockTasks(3);
      // 不正なDateオブジェクトを持つタスク
      const invalidTasks = [
        ...tasks,
        { ...tasks[0], createdAt: { invalid: 'date' } as unknown as Date }
      ];

      // Act
      const result = serializeTasks(invalidTasks as Task[]);

      // Assert
      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        const error = result.error;
        expect(error.type).toBe('serialization');
        expect(error.message).toContain('複数タスクの変換処理中にエラーが発生しました');
      }
    });
  });

  describe('deserializeTasks', () => {
    it('有効なJSON文字列から複数のタスクを正しく復元できること', () => {
      // Arrange
      const tasks = createMockTasks(3);
      const jsonString = serializeTasks(tasks).unwrapOr('');

      // Act
      const result = deserializeTasks(jsonString);

      // Assert
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        const deserializedTasks = result.value;

        expect(deserializedTasks.length).toBe(3);
        expect(deserializedTasks[0].id).toEqual(tasks[0].id);
        expect(deserializedTasks[1].name).toBe(tasks[1].name);
        expect(deserializedTasks[2].description).toBe(tasks[2].description);
      }
    });

    it('空の配列を含むJSON文字列を正しく復元できること', () => {
      // Arrange
      const jsonString = '[]';

      // Act
      const result = deserializeTasks(jsonString);

      // Assert
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        const deserializedTasks = result.value;
        expect(deserializedTasks.length).toBe(0);
      }
    });

    it('配列でないJSONに対して適切なエラーを返すこと', () => {
      // Arrange
      const invalidJson = '{"notAnArray": true}';

      // Act
      const result = deserializeTasks(invalidJson);

      // Assert
      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        const error = result.error;
        expect(error.type).toBe('deserialization');
        expect(error.message).toContain('無効なJSON形式です。配列が期待されています。');
      }
    });

    it('不正なオブジェクトを含む配列に対して適切なエラーを返すこと', () => {
      // Arrange
      const invalidJson = '[{"id":"task-1", "name":"テスト1"}, null, {"id":"task-3"}]';

      // Act
      const result = deserializeTasks(invalidJson);

      // Assert
      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        const error = result.error;
        expect(error.type).toBe('deserialization');
        expect(error.message).toContain('createdAtが不正です');
      }
    });

    it('不正なIDを含むタスクに対して適切なエラーを返すこと', () => {
      // Arrange
      const invalidJson = '[{"id":"", "name":"無効なID", "createdAt":"2025-01-01T00:00:00Z", "updatedAt":"2025-01-01T01:00:00Z"}]';

      // Act
      const result = deserializeTasks(invalidJson);

      // Assert
      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        const error = result.error;
        expect(error.type).toBe('deserialization');
        expect(error.message).toContain('IDが不正です');
      }
    });
  });

  describe('toSerializable / fromSerializable', () => {
    it('toSerializableがタスクをシリアライズ可能な形式に変換できること', () => {
      // Arrange
      const task = createMockTask();

      // Act
      const serialized = toSerializable(task);

      // Assert
      expect(serialized.id).toBe('task-123');
      expect(serialized.createdAt).toBe('2025-01-01T00:00:00.000Z');
      expect(serialized.updatedAt).toBe('2025-01-01T01:00:00.000Z');
      expect(serialized.completedAt).toBeUndefined();

      // Date型が文字列に変換されていること
      expect(typeof serialized.createdAt).toBe('string');
      expect(typeof serialized.updatedAt).toBe('string');
    });

    it('fromSerializableがシリアライズされたタスクをタスクオブジェクトに変換できること', () => {
      // Arrange
      const task = createMockTask();
      const serialized = toSerializable(task);

      // Act
      const deserialized = fromSerializable(serialized);

      // Assert
      expect(deserialized.id).toEqual(task.id);
      expect(deserialized.createdAt instanceof Date).toBe(true);
      expect(deserialized.updatedAt instanceof Date).toBe(true);
      expect(deserialized.createdAt.toISOString()).toBe(task.createdAt.toISOString());
      expect(deserialized.updatedAt.toISOString()).toBe(task.updatedAt.toISOString());
    });

    it('完了日時を含むタスクが正しく変換できること', () => {
      // Arrange
      const task = createCompletedMockTask();

      // Act
      const serialized = toSerializable(task);
      const deserialized = fromSerializable(serialized);

      // Assert
      expect(serialized.completedAt).toBe('2025-01-02T00:00:00.000Z');
      expect(deserialized.completedAt instanceof Date).toBe(true);
      expect(deserialized.completedAt?.toISOString()).toBe(task.completedAt?.toISOString());
    });

    it('fromSerializableが不正なデータでエラーをスローすること', () => {
      // Arrange
      const invalidSerializedTask: SerializedTask = {
        id: '',  // 無効なID
        name: 'サンプルタスク',
        description: 'これはテスト用のタスクです',
        status: 'NOT_STARTED' as TaskStatus,
        category: 'WORK' as Category,
        priority: 'MEDIUM' as Priority,
        estimatedDuration: 30,
        createdAt: '2025-01-01T00:00:00Z',
        updatedAt: '2025-01-01T01:00:00Z',
        tags: ['サンプル', 'テスト']
      };

      // Act & Assert
      expect(() => fromSerializable(invalidSerializedTask)).toThrow();
    });
  });
});