/**
 * タスク管理ストアのテスト
 *
 * このファイルでは、Zustandを使用したタスク管理ストアの機能をテストします。
 * TDDアプローチに基づき、実装前にテストを定義することで設計の妥当性を確認します。
 */

import { describe, expect, it, vi } from 'vitest';
import { ok, err } from 'neverthrow';
import type { Task, TaskId, Category, TaskStatus } from '../../../../src/domain/types/Task.js';
import type { TaskRepository, TaskFilter, TaskRepositoryError } from '../../../../src/application/repositories/task-repository.js';

// Zustandストアをインポート
import { createTaskStore } from '../../../../src/ui/state/stores/task-store.js';

// モックタスクデータ
const mockTasks: readonly Task[] = [
  {
    id: 'task-1' as TaskId,
    name: 'タスク1',
    description: '説明1',
    status: 'NOT_STARTED' as TaskStatus,
    category: 'WORK' as Category,
    priority: 'HIGH',
    estimatedDuration: 60,
    createdAt: new Date('2025-03-01'),
    updatedAt: new Date('2025-03-01'),
    tags: ['重要', '仕事']
  },
  {
    id: 'task-2' as TaskId,
    name: 'タスク2',
    description: '説明2',
    status: 'IN_PROGRESS' as TaskStatus,
    category: 'PERSONAL_DEV' as Category,
    priority: 'MEDIUM',
    estimatedDuration: 30,
    createdAt: new Date('2025-03-02'),
    updatedAt: new Date('2025-03-03'),
    tags: ['学習']
  },
  {
    id: 'task-3' as TaskId,
    name: 'タスク3',
    description: '説明3',
    status: 'COMPLETED' as TaskStatus,
    category: 'HOUSEHOLD' as Category,
    priority: 'LOW',
    estimatedDuration: 15,
    createdAt: new Date('2025-03-03'),
    updatedAt: new Date('2025-03-04'),
    completedAt: new Date('2025-03-04'),
    tags: ['家事']
  }
];

// モックリポジトリの作成
const createMockTaskRepository = (shouldFail = false): TaskRepository => {
  return {
    findById: vi.fn(async (id: TaskId) => {
      if (shouldFail) {
        return err({ type: 'STORAGE_ERROR', message: 'タスク取得中にエラーが発生しました' } as TaskRepositoryError);
      }
      const task = mockTasks.find(t => t.id === id);
      if (!task) {
        return err({ type: 'NOT_FOUND', message: `タスクが見つかりませんでした: ${id}` } as TaskRepositoryError);
      }
      return ok(task);
    }),

    findAll: vi.fn(async (filter?: TaskFilter) => {
      if (shouldFail) {
        return err({ type: 'STORAGE_ERROR', message: 'タスク一覧取得中にエラーが発生しました' } as TaskRepositoryError);
      }

      let filteredTasks = [...mockTasks];

      // フィルタリング処理
      if (filter) {
        if (filter.status) {
          const statusFilter = filter.status;
          filteredTasks = filteredTasks.filter(task => statusFilter.includes(task.status));
        }
        if (filter.category) {
          filteredTasks = filteredTasks.filter(task => task.category === filter.category);
        }
        if (filter.tags && filter.tags.length > 0) {
          const tagsFilter = filter.tags;
          filteredTasks = filteredTasks.filter(task =>
            tagsFilter.some(tag => task.tags.includes(tag))
          );
        }
        // 検索文字列のnull/undefined/空文字列チェック
        if (typeof filter.textSearch === 'string') {
          if (filter.textSearch !== '') {
            const searchText = filter.textSearch.toLowerCase();
            filteredTasks = filteredTasks.filter(task =>
              task.name.toLowerCase().includes(searchText) ||
              task.description.toLowerCase().includes(searchText)
            );
          }
        }
      }

      return ok(filteredTasks);
    }),

    save: vi.fn(async (task: Task) => {
      if (shouldFail) {
        return err({ type: 'STORAGE_ERROR', message: 'タスク保存中にエラーが発生しました' } as TaskRepositoryError);
      }
      return ok(task);
    }),

    delete: vi.fn(async (id: TaskId) => {
      if (shouldFail) {
        return err({ type: 'STORAGE_ERROR', message: 'タスク削除中にエラーが発生しました' } as TaskRepositoryError);
      }
      const task = mockTasks.find(t => t.id === id);
      if (!task) {
        return err({ type: 'NOT_FOUND', message: `タスクが見つかりませんでした: ${id}` } as TaskRepositoryError);
      }
      return ok(undefined);
    }),

    count: vi.fn(async (filter?: TaskFilter) => {
      if (shouldFail) {
        return err({ type: 'STORAGE_ERROR', message: 'タスク件数取得中にエラーが発生しました' } as TaskRepositoryError);
      }

      // findAllと同様のフィルタリング
      let filteredTasks = [...mockTasks];

      if (filter) {
        if (filter.status) {
          const statusFilter = filter.status;
          filteredTasks = filteredTasks.filter(task => statusFilter.includes(task.status));
        }
        if (filter.category) {
          filteredTasks = filteredTasks.filter(task => task.category === filter.category);
        }
        if (filter.tags && filter.tags.length > 0) {
          const tagsFilter = filter.tags;
          filteredTasks = filteredTasks.filter(task =>
            tagsFilter.some(tag => task.tags.includes(tag))
          );
        }
        // 検索文字列のnull/undefined/空文字列チェック
        if (typeof filter.textSearch === 'string') {
          if (filter.textSearch !== '') {
            const searchText = filter.textSearch.toLowerCase();
            filteredTasks = filteredTasks.filter(task =>
              task.name.toLowerCase().includes(searchText) ||
              task.description.toLowerCase().includes(searchText)
            );
          }
        }
      }

      return ok(filteredTasks.length);
    })
  };
};

describe('タスク管理ストア', () => {
  it('初期状態が正しく設定されていること', () => {
    const taskRepository = createMockTaskRepository();
    const store = createTaskStore(taskRepository);

    // ストアから状態を取得する方法は実装によって異なる
    const state = store.getState();

    expect(state).toBeDefined();
    expect(state).toHaveProperty('tasks');
    expect(state).toHaveProperty('loading');
    expect(state).toHaveProperty('error');
    expect(state).toHaveProperty('selectedTaskId');
    expect(state.loading).toBe(false);

    expect(state.error).toBeNull();
    expect(state.tasks).toEqual([]);
    expect(state.selectedTaskId).toBeNull();
  });

  it('タスク一覧の取得が成功すること', async () => {
    const taskRepository = createMockTaskRepository();
    const store = createTaskStore(taskRepository);

    // 実装に応じて関数名は変更される可能性がある
    await store.getState().fetchTasks();

    // ストアから状態を取得する方法は実装によって異なる
    const state = store.getState();

    expect(state.tasks).toEqual(mockTasks);
    expect(state.loading).toBe(false);
    expect(state.error).toBeNull();
    expect(taskRepository.findAll).toHaveBeenCalledTimes(1);
  });

  it('タスク一覧の取得が失敗したとき、エラー状態が設定されること', async () => {
    const taskRepository = createMockTaskRepository(true); // エラーを発生させる
    const store = createTaskStore(taskRepository);

    // 実装に応じて関数名は変更される可能性がある
    await store.getState().fetchTasks();

    // ストアから状態を取得する方法は実装によって異なる
    const state = store.getState();

    expect(state.loading).toBe(false);
    expect(state.error).not.toBeNull();
    expect(state.error?.type).toBe('STORAGE_ERROR');
    expect(taskRepository.findAll).toHaveBeenCalledTimes(1);
  });

  it('タスクの選択が正しく動作すること', () => {
    const taskRepository = createMockTaskRepository();
    const store = createTaskStore(taskRepository);

    const taskId = 'task-1' as TaskId;

    // 実装に応じて関数名は変更される可能性がある
    store.getState().selectTask(taskId);

    // ストアから状態を取得する方法は実装によって異なる
    const state = store.getState();

    expect(state.selectedTaskId).toBe(taskId);
  });

  it('フィルタリングが正しく動作すること', async () => {
    const taskRepository = createMockTaskRepository();
    const store = createTaskStore(taskRepository);

    const filter: TaskFilter = {
      status: ['IN_PROGRESS']
    };

    // 実装に応じて関数名は変更される可能性がある
    await store.getState().setFilter(filter);

    // ストアから状態を取得する方法は実装によって異なる
    const state = store.getState();

    // mockリポジトリの仕様上、フィルタが機能していることを確認
    expect(taskRepository.findAll).toHaveBeenCalledWith(filter);
    expect(state.filter.isFilterActive).toBe(true);
    expect(state.filter.filters).toEqual(filter);
  });

  it('ストアのリセットが正しく動作すること', () => {
    const taskRepository = createMockTaskRepository();
    const store = createTaskStore(taskRepository);

    // 何らかの状態変更を行う
    store.getState().selectTask('task-1' as TaskId);

    // リセットを実行
    store.getState().reset();

    // ストアから状態を取得する方法は実装によって異なる
    const state = store.getState();

    // 初期状態に戻っていることを確認
    expect(state.selectedTaskId).toBeNull();
    expect(state.tasks).toEqual([]);
    expect(state.loading).toBe(false);
    expect(state.error).toBeNull();
  });
});