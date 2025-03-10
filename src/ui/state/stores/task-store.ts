/**
 * タスク管理ストア
 *
 * このファイルでは、タスク管理のためのZustandストアを定義します。
 * ドメインのタスクリポジトリを使用してデータアクセスを行い、UI状態を管理します。
 */

import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { devtools } from 'zustand/middleware';
import type { StoreApi } from 'zustand';
import type { Task, TaskId } from '../../../domain/types/Task.js';
import type { TaskRepository, TaskFilter, TaskRepositoryError } from '../../../application/repositories/task-repository.js';
import type { AsyncState, StoreError, FilterState, SortState, StoreState, StoreActions } from '../types.js';

/**
 * タスクUIフィルターの型定義
 * UI層でのタスクフィルタリング条件を表現します
 */
export type TaskFilterState = FilterState<TaskFilter>;

/**
 * タスクソート条件の型定義
 * UI層でのタスクソート条件を表現します
 */
export type TaskSortState = SortState<'name' | 'createdAt' | 'priority' | 'estimatedDuration'>;

/**
 * タスク管理ストアの状態型定義
 */
export type TaskStoreState = StoreState & AsyncState & {
  readonly tasks: readonly Task[];
  readonly selectedTaskId: TaskId | null;
  readonly filter: TaskFilterState;
  readonly sort: TaskSortState;
  readonly activeView: 'list' | 'calendar' | 'statistics';
  readonly isCreateModalOpen: boolean;
  readonly isEditModalOpen: boolean;
  readonly isDeleteConfirmOpen: boolean;
};

/**
 * タスク管理ストアのアクション型定義
 */
export type TaskStoreActions = StoreActions & {
  // データ操作アクション
  readonly fetchTasks: (filter?: TaskFilter) => Promise<void>;
  readonly createTask: (task: Task) => Promise<void>;
  readonly updateTask: (task: Task) => Promise<void>;
  readonly deleteTask: (taskId: TaskId) => Promise<void>;

  // UI操作アクション
  readonly selectTask: (taskId: TaskId | null) => void;
  readonly setActiveView: (view: TaskStoreState['activeView']) => void;
  readonly setFilter: (filter: TaskFilter) => void;
  readonly clearFilter: () => void;
  readonly setSort: (sortBy: TaskSortState['sortBy'], sortDirection: TaskSortState['sortDirection']) => void;
  readonly openCreateModal: () => void;
  readonly closeCreateModal: () => void;
  readonly openEditModal: () => void;
  readonly closeEditModal: () => void;
  readonly openDeleteConfirm: () => void;
  readonly closeDeleteConfirm: () => void;
};

/**
 * タスク管理ストアの型定義（状態＋アクション）
 */
export type TaskStore = TaskStoreState & TaskStoreActions;

/**
 * タスク管理ストアのエラーハンドリング
 * ドメイン層のエラーをUI層のエラーに変換します
 *
 * @param error - タスクリポジトリから返されるエラー
 * @returns UI層で使用するエラーオブジェクト
 */
const handleError = (error: TaskRepositoryError): StoreError => {
  return {
    type: error.type,
    message: error.message,
    cause: 'cause' in error ? error.cause : undefined
  };
};

/**
 * タスク管理ストアの初期状態
 */
const initialState: TaskStoreState = {
  storeId: 'task-store',
  tasks: [],
  selectedTaskId: null,
  loading: false,
  error: null,
  filter: {
    filters: {},
    isFilterActive: false
  },
  sort: {
    sortBy: 'createdAt',
    sortDirection: 'desc'
  },
  activeView: 'list',
  isCreateModalOpen: false,
  isEditModalOpen: false,
  isDeleteConfirmOpen: false
};

/**
 * タスク管理ストアの作成
 *
 * @param taskRepository タスクリポジトリ
 * @returns Zustandストア
 */
export const createTaskStore = (taskRepository: TaskRepository): StoreApi<TaskStore> => {
  return create<TaskStore>()(
    devtools(
      immer((set, get) => ({
        ...initialState,

        // アクション実装
        reset: (_: void = undefined) => set(initialState),

        // データ操作アクション
        fetchTasks: async (filter) => {
          set({ loading: true, error: null });
          const result = await taskRepository.findAll(filter);

          if (result.isOk()) {
            set({ tasks: result.value, loading: false });
          } else {
            set({ loading: false, error: handleError(result.error) });
          }
        },

        createTask: async (task) => {
          set({ loading: true, error: null });
          const result = await taskRepository.save(task);

          if (result.isOk()) {
            // タスク一覧を再取得
            await get().fetchTasks(get().filter.filters);
          } else {
            set({ loading: false, error: handleError(result.error) });
          }
        },

        updateTask: async (task) => {
          set({ loading: true, error: null });
          const result = await taskRepository.save(task);

          if (result.isOk()) {
            // タスク一覧を再取得
            await get().fetchTasks(get().filter.filters);
          } else {
            set({ loading: false, error: handleError(result.error) });
          }
        },

        deleteTask: async (taskId) => {
          set({ loading: true, error: null });
          const result = await taskRepository.delete(taskId);

          if (result.isOk()) {
            // 削除対象のタスクが選択されていた場合、選択解除
            if (get().selectedTaskId === taskId) {
              set({ selectedTaskId: null });
            }

            // タスク一覧を再取得
            await get().fetchTasks(get().filter.filters);
          } else {
            set({ loading: false, error: handleError(result.error) });
          }
        },

        // UI操作アクション
        selectTask: (taskId) => {
          set({ selectedTaskId: taskId });
        },

        setActiveView: (view) => {
          set({ activeView: view });
        },

        setFilter: (filter) => {
          set({
            filter: {
              filters: filter,
              isFilterActive: Object.keys(filter).length > 0
            }
          });

          // フィルターが変更されたら、タスク一覧を再取得
          void get().fetchTasks(filter);
        },

        clearFilter: (_: void = undefined) => {
          set({
            filter: {
              filters: {},
              isFilterActive: false
            }
          });

          // フィルターをクリアしたら、全タスクを取得
          void get().fetchTasks();
        },

        setSort: (sortBy, sortDirection) => {
          set({
            sort: {
              sortBy,
              sortDirection
            }
          });
        },

        openCreateModal: (_: void = undefined) => {
          set({ isCreateModalOpen: true });
        },

        closeCreateModal: (_: void = undefined) => {
          set({ isCreateModalOpen: false });
        },

        openEditModal: (_: void = undefined) => {
          set({ isEditModalOpen: true });
        },

        closeEditModal: (_: void = undefined) => {
          set({ isEditModalOpen: false });
        },

        openDeleteConfirm: (_: void = undefined) => {
          set({ isDeleteConfirmOpen: true });
        },

        closeDeleteConfirm: (_: void = undefined) => {
          set({ isDeleteConfirmOpen: false });
        }
      }))
    )
  );
};