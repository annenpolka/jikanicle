# Zustandライブラリ実装計画

## 1. 概要

本ドキュメントでは、jikanicleプロジェクトにおけるZustandライブラリの実装計画を詳述します。「zustand-ddd-integration-analysis.md」で行った整合性調査に基づき、具体的な実装手順、テスト戦略、およびマイグレーション計画を提示します。

## 2. 実装目標

1. DDDの原則を維持しながら、UI状態管理を効率化する
2. 型安全性を確保した状態管理を実現する
3. パフォーマンスを最適化する
4. テスト容易性を向上させる
5. 段階的な導入により、既存コードへの影響を最小化する

## 3. 環境セットアップ

### 3.1 依存関係のインストール

```bash
# Zustandとその型定義をインストール
npm install zustand
# または
pnpm add zustand
```

### 3.2 ESLint設定の更新

Zustandの使用パターンに合わせてESLint設定を更新します。特に、関数型プログラミングのルールとの整合性を確保します。

```javascript
// eslint.config.mjs に追加
{
  files: ['src/ui/state/**/*.ts'],
  rules: {
    // Zustandのset関数は副作用を持つため、特定のディレクトリでは許可
    'functional/no-expression-statements': 'off',
    'functional/immutable-data': 'off',
    // ただし、他の関数型ルールは維持
    'functional/no-let': 'error',
    'functional/prefer-readonly-type': 'error'
  }
}
```

## 4. ディレクトリ構造

```
src/
  ui/
    state/                      # Zustand関連のコード
      stores/                   # 各コンテキスト用のストア
        task-store.ts           # タスク管理ストア
        time-block-store.ts     # タイムブロッキングストア
        time-tracking-store.ts  # タイムトラッキングストア
        prediction-store.ts     # 予測ストア
      middlewares/              # カスタムミドルウェア
        persist-middleware.ts   # 永続化ミドルウェア
        logger-middleware.ts    # ロギングミドルウェア
      hooks/                    # カスタムフック
        use-task-actions.ts     # タスク操作フック
        use-task-filters.ts     # タスクフィルタリングフック
      types/                    # 状態関連の型定義
        store-types.ts          # 共通型定義
```

## 5. 基本実装

### 5.1 タスク管理ストア

```typescript
// src/ui/state/stores/task-store.ts
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import type { Task, TaskId, CreateTaskParams } from '../../../domain/types/Task.js';
import type { TaskApplicationService } from '../../../application/services/task-application-service.js';
import type { ApplicationError } from '../../../application/types/errors.js';

// 状態の型定義
interface TaskState {
  // データ状態
  readonly tasks: readonly Task[];
  readonly selectedTaskId: TaskId | null;
  readonly loading: boolean;
  readonly error: ApplicationError | null;

  // UI状態
  readonly filterStatus: readonly Task['status'][] | null;
  readonly filterCategory: Task['category'] | null;
  readonly sortBy: 'createdAt' | 'priority' | 'estimatedDuration';
  readonly sortDirection: 'asc' | 'desc';
  readonly isCreateModalOpen: boolean;
  readonly isEditModalOpen: boolean;
  readonly isDeleteConfirmOpen: boolean;

  // アクション
  readonly fetchTasks: () => Promise<void>;
  readonly createTask: (params: CreateTaskParams) => Promise<void>;
  readonly updateTask: (id: TaskId, updates: Partial<Task>) => Promise<void>;
  readonly deleteTask: (id: TaskId) => Promise<void>;
  readonly selectTask: (id: TaskId | null) => void;
  readonly setFilter: (status?: readonly Task['status'][], category?: Task['category']) => void;
  readonly setSorting: (by: TaskState['sortBy'], direction: TaskState['sortDirection']) => void;
  readonly openCreateModal: () => void;
  readonly closeCreateModal: () => void;
  readonly openEditModal: () => void;
  readonly closeEditModal: () => void;
  readonly openDeleteConfirm: () => void;
  readonly closeDeleteConfirm: () => void;
}

// ストア作成関数
export const createTaskStore = (taskService: TaskApplicationService) => {
  return create<TaskState>()(
    devtools(
      (set, get) => ({
        // 初期状態
        tasks: [],
        selectedTaskId: null,
        loading: false,
        error: null,
        filterStatus: null,
        filterCategory: null,
        sortBy: 'createdAt',
        sortDirection: 'desc',
        isCreateModalOpen: false,
        isEditModalOpen: false,
        isDeleteConfirmOpen: false,

        // データ操作アクション
        fetchTasks: async () => {
          set({ loading: true });
          const result = await taskService.getTasks({
            status: get().filterStatus ?? undefined,
            category: get().filterCategory ?? undefined
          });

          if (result.ok) {
            // ソート処理
            const sortedTasks = [...result.value].sort((a, b) => {
              const sortBy = get().sortBy;
              const direction = get().sortDirection === 'asc' ? 1 : -1;

              if (sortBy === 'createdAt') {
                return (a.createdAt.getTime() - b.createdAt.getTime()) * direction;
              } else if (sortBy === 'priority') {
                const priorityMap = { 'HIGH': 2, 'MEDIUM': 1, 'LOW': 0 };
                return (priorityMap[a.priority] - priorityMap[b.priority]) * direction;
              } else {
                return (a.estimatedDuration - b.estimatedDuration) * direction;
              }
            });

            set({ tasks: sortedTasks, loading: false, error: null });
          } else {
            set({ loading: false, error: result.error });
          }
        },

        createTask: async (params) => {
          set({ loading: true });
          const result = await taskService.createTask(params);

          if (result.ok) {
            // 既存のタスクリストに新しいタスクを追加
            const updatedTasks = [...get().tasks, result.value];
            set({
              tasks: updatedTasks,
              loading: false,
              error: null,
              isCreateModalOpen: false // 成功時にモーダルを閉じる
            });
          } else {
            set({ loading: false, error: result.error });
          }
        },

        updateTask: async (id, updates) => {
          set({ loading: true });
          const result = await taskService.updateTask(id, updates);

          if (result.ok) {
            // 更新されたタスクで置き換え
            const updatedTasks = get().tasks.map(task =>
              task.id === id ? result.value : task
            );
            set({
              tasks: updatedTasks,
              loading: false,
              error: null,
              isEditModalOpen: false // 成功時にモーダルを閉じる
            });
          } else {
            set({ loading: false, error: result.error });
          }
        },

        deleteTask: async (id) => {
          set({ loading: true });
          const result = await taskService.deleteTask(id);

          if (result.ok) {
            // 削除されたタスクを除外
            const updatedTasks = get().tasks.filter(task => task.id !== id);
            set({
              tasks: updatedTasks,
              loading: false,
              error: null,
              isDeleteConfirmOpen: false, // 成功時に確認ダイアログを閉じる
              selectedTaskId: get().selectedTaskId === id ? null : get().selectedTaskId // 選択中のタスクが削除された場合は選択解除
            });
          } else {
            set({ loading: false, error: result.error });
          }
        },

        // UI操作アクション
        selectTask: (id) => set({ selectedTaskId: id }),

        setFilter: (status, category) => {
          set({
            filterStatus: status ?? null,
            filterCategory: category ?? null
          });
          // フィルター変更後にタスクを再取得
          get().fetchTasks();
        },

        setSorting: (by, direction) => {
          set({ sortBy: by, sortDirection: direction });
          // ソート条件変更後にタスクを再取得
          get().fetchTasks();
        },

        openCreateModal: () => set({ isCreateModalOpen: true }),
        closeCreateModal: () => set({ isCreateModalOpen: false }),
        openEditModal: () => set({ isEditModalOpen: true }),
        closeEditModal: () => set({ isEditModalOpen: false }),
        openDeleteConfirm: () => set({ isDeleteConfirmOpen: true }),
        closeDeleteConfirm: () => set({ isDeleteConfirmOpen: false })
      }),
      { name: 'task-store' } // devtoolsの名前
    )
  );
};

// シングルトンインスタンスを作成するためのファクトリ関数
// 注: 実際の使用時にはアプリケーションサービスを注入する必要がある
let taskStoreInstance: ReturnType<typeof createTaskStore> | null = null;

export const useTaskStore = (taskService?: TaskApplicationService) => {
  if (!taskStoreInstance && taskService) {
    taskStoreInstance = createTaskStore(taskService);
  }

  if (!taskStoreInstance) {
    throw new Error('TaskStore has not been initialized with a TaskApplicationService');
  }

  return taskStoreInstance;
};
```

### 5.2 永続化ミドルウェア

```typescript
// src/ui/state/middlewares/persist-middleware.ts
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { PersistOptions } from 'zustand/middleware';

// 永続化オプションを作成するヘルパー関数
export function createPersistConfig<T>(
  name: string,
  partialize?: (state: T) => Partial<T>,
  version = 1
): PersistOptions<T> {
  return {
    name: `jikanicle-${name}`,
    version,
    storage: createJSONStorage(() => localStorage),
    partialize,
    // マイグレーション関数
    migrate: (persistedState: unknown, version) => {
      // バージョンに基づいたマイグレーションロジック
      return persistedState as T;
    },
  };
}

// 使用例
// const useTaskStore = create<TaskState>()(
//   persist(
//     (set, get) => ({ /* ... */ }),
//     createPersistConfig<TaskState>('task-store',
//       state => ({
//         filterStatus: state.filterStatus,
//         filterCategory: state.filterCategory,
//         sortBy: state.sortBy,
//         sortDirection: state.sortDirection
//       })
//     )
//   )
// );
```

### 5.3 カスタムフック

```typescript
// src/ui/state/hooks/use-task-actions.ts
import { useCallback } from 'react';
import { useTaskStore } from '../stores/task-store';
import type { Task, TaskId, CreateTaskParams } from '../../../domain/types/Task';

// タスク操作に関するカスタムフック
export function useTaskActions() {
  const store = useTaskStore();

  // タスク作成
  const createTask = useCallback(async (params: CreateTaskParams) => {
    await store.createTask(params);
  }, [store]);

  // タスク更新
  const updateTask = useCallback(async (id: TaskId, updates: Partial<Task>) => {
    await store.updateTask(id, updates);
  }, [store]);

  // タスク削除
  const deleteTask = useCallback(async (id: TaskId) => {
    await store.deleteTask(id);
  }, [store]);

  // タスク選択
  const selectTask = useCallback((id: TaskId | null) => {
    store.selectTask(id);
  }, [store]);

  return {
    createTask,
    updateTask,
    deleteTask,
    selectTask,
    openCreateModal: store.openCreateModal,
    closeCreateModal: store.closeCreateModal,
    openEditModal: store.openEditModal,
    closeEditModal: store.closeEditModal,
    openDeleteConfirm: store.openDeleteConfirm,
    closeDeleteConfirm: store.closeDeleteConfirm
  };
}

// src/ui/state/hooks/use-task-filters.ts
import { useCallback } from 'react';
import { useTaskStore } from '../stores/task-store';
import type { Task } from '../../../domain/types/Task';

// タスクフィルタリングに関するカスタムフック
export function useTaskFilters() {
  const store = useTaskStore();

  // フィルター設定
  const setFilter = useCallback((
    status?: readonly Task['status'][],
    category?: Task['category']
  ) => {
    store.setFilter(status, category);
  }, [store]);

  // ソート設定
  const setSorting = useCallback((
    by: 'createdAt' | 'priority' | 'estimatedDuration',
    direction: 'asc' | 'desc'
  ) => {
    store.setSorting(by, direction);
  }, [store]);

  return {
    filterStatus: store.filterStatus,
    filterCategory: store.filterCategory,
    sortBy: store.sortBy,
    sortDirection: store.sortDirection,
    setFilter,
    setSorting
  };
}
```

## 6. テスト戦略

### 6.1 ストアのテスト

```typescript
// test/ui/state/stores/task-store.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createTaskStore } from '../../../../src/ui/state/stores/task-store';
import { ok, err } from 'neverthrow';

describe('TaskStore', () => {
  // モックサービス
  const mockTaskService = {
    getTasks: vi.fn(),
    createTask: vi.fn(),
    updateTask: vi.fn(),
    deleteTask: vi.fn()
  };

  // テスト用のタスク
  const mockTasks = [
    {
      id: 'task-1',
      name: 'テストタスク1',
      description: '説明1',
      status: 'NOT_STARTED',
      category: 'WORK',
      priority: 'HIGH',
      estimatedDuration: 60,
      createdAt: new Date('2025-01-01'),
      updatedAt: new Date('2025-01-01'),
      tags: []
    },
    {
      id: 'task-2',
      name: 'テストタスク2',
      description: '説明2',
      status: 'IN_PROGRESS',
      category: 'PERSONAL_DEV',
      priority: 'MEDIUM',
      estimatedDuration: 30,
      createdAt: new Date('2025-01-02'),
      updatedAt: new Date('2025-01-02'),
      tags: []
    }
  ];

  let store;

  beforeEach(() => {
    // モックをリセット
    vi.resetAllMocks();
    // ストアを作成
    store = createTaskStore(mockTaskService);
    // 初期状態をリセット
    store.setState({
      tasks: [],
      selectedTaskId: null,
      loading: false,
      error: null,
      filterStatus: null,
      filterCategory: null,
      sortBy: 'createdAt',
      sortDirection: 'desc',
      isCreateModalOpen: false,
      isEditModalOpen: false,
      isDeleteConfirmOpen: false
    });
  });

  describe('fetchTasks', () => {
    it('should fetch tasks successfully', async () => {
      // モックの戻り値を設定
      mockTaskService.getTasks.mockResolvedValue(ok(mockTasks));

      // アクションを実行
      await store.getState().fetchTasks();

      // 検証
      expect(mockTaskService.getTasks).toHaveBeenCalled();
      expect(store.getState().tasks).toEqual(mockTasks);
      expect(store.getState().loading).toBe(false);
      expect(store.getState().error).toBeNull();
    });

    it('should handle fetch error', async () => {
      // エラーケース
      const mockError = { type: 'STORAGE_ERROR', message: 'テストエラー' };
      mockTaskService.getTasks.mockResolvedValue(err(mockError));

      // アクションを実行
      await store.getState().fetchTasks();

      // 検証
      expect(store.getState().loading).toBe(false);
      expect(store.getState().error).toEqual(mockError);
    });
  });

  // 他のアクションのテストも同様に実装
});
```

### 6.2 カスタムフックのテスト

```typescript
// test/ui/state/hooks/use-task-actions.test.ts
import { describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react-hooks';
import { useTaskActions } from '../../../../src/ui/state/hooks/use-task-actions';
import { useTaskStore } from '../../../../src/ui/state/stores/task-store';

// モックストアを作成
vi.mock('../../../../src/ui/state/stores/task-store', () => ({
  useTaskStore: vi.fn()
}));

describe('useTaskActions', () => {
  // モックストア
  const mockStore = {
    createTask: vi.fn(),
    updateTask: vi.fn(),
    deleteTask: vi.fn(),
    selectTask: vi.fn(),
    openCreateModal: vi.fn(),
    closeCreateModal: vi.fn(),
    openEditModal: vi.fn(),
    closeEditModal: vi.fn(),
    openDeleteConfirm: vi.fn(),
    closeDeleteConfirm: vi.fn()
  };

  beforeEach(() => {
    // モックをリセット
    vi.resetAllMocks();
    // モックストアを設定
    useTaskStore.mockReturnValue(mockStore);
  });

  it('should call createTask with correct parameters', async () => {
    // フックをレンダリング
    const { result } = renderHook(() => useTaskActions());

    // テストデータ
    const taskParams = {
      name: 'テストタスク',
      description: '説明',
      category: 'WORK',
      estimatedDuration: 60
    };

    // アクションを実行
    await act(async () => {
      await result.current.createTask(taskParams);
    });

    // 検証
    expect(mockStore.createTask).toHaveBeenCalledWith(taskParams);
  });

  // 他のアクションのテストも同様に実装
});
```

## 7. 段階的導入計画

### 7.1 フェーズ1: 基本構造の実装（1週間）

1. Zustandのインストールと基本設定
2. タスク管理ストアの基本実装
3. 既存のUIコンポーネントとの最小限の統合
4. 基本的なテストの実装

### 7.2 フェーズ2: 機能拡張（2週間）

1. 永続化ミドルウェアの導入
2. カスタムフックの実装
3. タイムブロッキングストアの実装
4. タイムトラッキングストアの実装
5. テストカバレッジの拡充

### 7.3 フェーズ3: 高度な機能と最適化（2週間）

1. 予測ストアの実装
2. ストア間の連携メカニズム
3. パフォーマンス最適化
4. デバッグツールの統合
5. ドキュメントの整備

## 8. 注意点と推奨事項

1. **ドメインロジックの分離**: ストア内にドメインロジックを実装しないよう注意する
2. **型安全性の確保**: 厳格な型定義を維持する
3. **テスト駆動開発**: 各機能の実装前にテストを作成する
4. **段階的リファクタリング**: 既存のコードを段階的に移行し、一度に大きな変更を避ける
5. **パフォーマンスモニタリング**: 状態更新によるパフォーマンスへの影響を監視する

## 9. 参考資料

- [Zustand公式ドキュメント](https://github.com/pmndrs/zustand)
- [Zustandとの整合性調査](./zustand-ddd-integration-analysis.md)
- [jikanicle状態管理設計](./state-management-design.md)