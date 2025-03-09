# Zustandライブラリ採用の多角的検討

## 1. 概要

本ドキュメントでは、jikanicleプロジェクトにおける状態管理ライブラリとしてZustandの採用を多角的に検討します。DDDの原則との整合性、現在の設計との統合性、パフォーマンス、学習コスト、テスト容易性などの観点から評価し、最終的な推奨事項を提示します。

## 2. Zustandの基本概念

Zustandは、Reactアプリケーション向けの軽量な状態管理ライブラリです。以下の特徴を持ちます：

- シンプルなAPI設計（Reduxのようなボイラープレートコードが不要）
- フック中心のアプローチ
- TypeScriptとの優れた親和性
- 小さなバンドルサイズ（約3KB）
- ミドルウェアによる拡張性

```typescript
// Zustandの基本的な使用例
import { create } from 'zustand';

interface TaskState {
  tasks: Task[];
  loading: boolean;
  error: string | null;
  fetchTasks: () => Promise<void>;
  addTask: (task: Task) => Promise<void>;
}

const useTaskStore = create<TaskState>((set) => ({
  tasks: [],
  loading: false,
  error: null,
  fetchTasks: async () => {
    set({ loading: true });
    try {
      const tasks = await taskRepository.findAll();
      set({ tasks: tasks.value, loading: false });
    } catch (error) {
      set({ error: '取得に失敗しました', loading: false });
    }
  },
  addTask: async (task) => {
    // 実装
  }
}));
```

## 3. DDDの原則との整合性

### 3.1 メリット

- **ドメイン層の分離維持**: Zustandはプレゼンテーション層の状態管理に特化しており、ドメインロジックとの分離を維持できます。ドメインロジックはドメイン層に閉じ込め、Zustandストアはそれを呼び出す形で実装できます。

- **境界づけられたコンテキスト**: 異なるコンテキスト（タスク管理、タイムブロッキングなど）ごとに別々のストアを作成でき、境界を明確に保てます。これはDDDの境界づけられたコンテキストの概念と整合します。

- **イミュータブルな状態更新**: Zustandは内部的にイミュータブルな状態更新を行うため、DDDの値オブジェクトの不変性原則と整合します。

### 3.2 デメリット

- **ドメインロジックの漏洩リスク**: ストア内にドメインロジックを実装してしまう誘惑があり、適切な層分離を維持する規律が必要です。チーム全体がDDDの原則を理解し、遵守する必要があります。

- **集約の整合性管理**: 複数の集約をまたがる操作において、整合性を保つための追加的な仕組みが必要になる場合があります。Zustand自体はこの問題を解決するものではありません。

## 4. 現在の設計との統合性

### 4.1 メリット

- **リポジトリパターンとの親和性**: 既存のリポジトリパターンを活用し、Zustandストアからリポジトリメソッドを呼び出す構造が自然に構築できます。

```typescript
// リポジトリパターンとZustandの統合例
const useTaskStore = create<TaskState>((set) => ({
  // ...
  fetchTasks: async () => {
    set({ loading: true });
    const result = await taskRepository.findAll();
    if (result.ok) {
      set({ tasks: result.value, loading: false, error: null });
    } else {
      set({ loading: false, error: result.error });
    }
  }
}));
```

- **Result型との統合**: neverthrowのResult型をZustandストア内で扱うことで、エラーハンドリングの一貫性を保てます。

- **段階的導入**: UIコンポーネント単位で段階的に導入できるため、既存コードへの影響を最小限に抑えられます。

### 4.2 デメリット

- **アーキテクチャの複雑化**: 既存のReactコンテキストベースの設計に加えてZustandを導入すると、状態管理の方法が混在し、複雑化する可能性があります。

- **依存関係の増加**: 新たな依存関係が増えることで、プロジェクトの複雑性が増します。

## 5. パフォーマンスと拡張性

### 5.1 メリット

- **高いパフォーマンス**: Zustandは内部的にReact.useStateとコンテキストを使用せず、独自のサブスクリプションモデルを採用しているため、不要な再レンダリングを減らせます。

- **部分的な状態購読**: コンポーネントは必要な状態のみを購読でき、パフォーマンスが向上します。

```typescript
// 部分的な状態購読の例
function TaskCounter() {
  // tasksの長さだけを購読
  const taskCount = useTaskStore(state => state.tasks.length);
  return <div>タスク数: {taskCount}</div>;
}
```

- **ミドルウェア対応**: ロギング、永続化、デバッグなどのミドルウェアを追加できる拡張性があります。

```typescript
// 永続化ミドルウェアの例
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const useTaskStore = create(
  persist(
    (set) => ({
      tasks: [],
      // ...
    }),
    {
      name: 'task-storage',
      getStorage: () => localStorage,
    }
  )
);
```

### 5.2 デメリット

- **大規模アプリケーションでの管理**: 多数のストアが生まれると管理が複雑になる可能性があります。

- **非同期処理の複雑さ**: 複雑な非同期フローを扱う場合、追加のユーティリティが必要になることがあります。

## 6. 学習コストとチーム適応性

### 6.1 メリット

- **シンプルなAPI**: Zustandは学習曲線が緩やかで、Reduxなどと比較して短時間で習得できます。

- **TypeScript親和性**: 型推論が優れており、型安全な状態管理が容易です。

- **少ないボイラープレート**: アクション、リデューサー、ディスパッチなどの概念がなく、直感的に使用できます。

### 6.2 デメリット

- **新しい概念の導入**: チームメンバーがZustandに慣れていない場合、学習コストが発生します。

- **ベストプラクティスの確立**: 比較的新しいライブラリのため、確立されたパターンが少ない可能性があります。

## 7. テスト容易性

### 7.1 メリット

- **単純なテスト**: ストアは通常のJavaScriptオブジェクトとして扱えるため、テストが容易です。

```typescript
// Zustandストアのテスト例
import { act, renderHook } from '@testing-library/react-hooks';
import { useTaskStore } from './task-store';

describe('TaskStore', () => {
  beforeEach(() => {
    // ストアのリセット
    useTaskStore.setState({ tasks: [] });
  });

  it('should add a task', async () => {
    const { result } = renderHook(() => useTaskStore());

    await act(async () => {
      await result.current.addTask({ name: 'テストタスク' });
    });

    expect(result.current.tasks.length).toBe(1);
    expect(result.current.tasks[0].name).toBe('テストタスク');
  });
});
```

- **モック化の容易さ**: 依存関係を注入できる設計により、テスト時のモック化が容易です。

### 7.2 デメリット

- **統合テストの複雑さ**: 複数のストア間の相互作用をテストする場合、複雑になる可能性があります。

## 8. 代替ライブラリとの比較

### 8.1 Redux

| 観点 | Zustand | Redux |
|------|---------|-------|
| 複雑性 | 低い（シンプルなAPI） | 高い（多くのボイラープレート） |
| バンドルサイズ | 小さい（約3KB） | 大きい（約15KB+） |
| 学習曲線 | 緩やか | 急峻 |
| エコシステム | 成長中 | 成熟している |
| DevTools | 対応（ミドルウェア） | 優れた対応 |
| 型安全性 | 優れている | 追加設定が必要 |
| 適合性 | 小〜中規模アプリ | 大規模アプリ |

### 8.2 MobX

| 観点 | Zustand | MobX |
|------|---------|------|
| パラダイム | 関数型 | オブジェクト指向 |
| 状態変更 | イミュータブル | ミュータブル |
| 学習曲線 | 緩やか | 中程度 |
| パフォーマンス | 良好 | 非常に良い |
| 型安全性 | 優れている | 良好 |
| DDDとの親和性 | 中程度 | 高い（クラスベース） |

### 8.3 Recoil

| 観点 | Zustand | Recoil |
|------|---------|--------|
| 開発元 | Poimandres | Facebook |
| アプローチ | グローバルストア | アトミックな状態 |
| 非同期サポート | 基本的 | 高度 |
| 依存関係 | 少ない | React依存 |
| 学習曲線 | 緩やか | 中程度 |
| 成熟度 | 中程度 | 中程度 |

### 8.4 React Context + useReducer

| 観点 | Zustand | Context + useReducer |
|------|---------|----------------------|
| 追加依存 | あり | なし（React標準） |
| パフォーマンス | 良好 | 限定的（コンテキスト更新時に全体再レンダリング） |
| ボイラープレート | 少ない | 多い |
| 学習コスト | 低い | 低い（React知識のみ） |
| 拡張性 | 高い | 限定的 |

## 9. jikanicleプロジェクトへの適用検討

### 9.1 適用シナリオ

1. **UI状態管理の強化**: 現在のReactコンテキストベースの設計をZustandに置き換え、パフォーマンスと開発体験を向上させる。

2. **ドメイン状態とUI状態の橋渡し**: アプリケーションサービス層とUI層の間の状態同期を効率化する。

3. **永続化機能の活用**: ローカルストレージとの連携を簡素化するミドルウェアを活用する。

### 9.2 実装アプローチ

```typescript
// src/ui/state/task-store.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Task, TaskId, CreateTaskParams } from '../../domain/types/Task.js';
import type { TaskApplicationService } from '../../application/services/task-application-service.js';
import type { ApplicationError } from '../../application/types/errors.js';

interface TaskState {
  // 状態
  tasks: Task[];
  selectedTaskId: TaskId | null;
  loading: boolean;
  error: ApplicationError | null;

  // アクション
  fetchTasks: () => Promise<void>;
  createTask: (params: CreateTaskParams) => Promise<void>;
  updateTask: (id: TaskId, updates: Partial<Task>) => Promise<void>;
  deleteTask: (id: TaskId) => Promise<void>;
  selectTask: (id: TaskId | null) => void;
}

export const createTaskStore = (taskService: TaskApplicationService) => {
  return create<TaskState>()(
    persist(
      (set, get) => ({
        // 初期状態
        tasks: [],
        selectedTaskId: null,
        loading: false,
        error: null,

        // アクション
        fetchTasks: async () => {
          set({ loading: true });
          const result = await taskService.getTasks();
          if (result.ok) {
            set({ tasks: result.value, loading: false, error: null });
          } else {
            set({ loading: false, error: result.error });
          }
        },

        createTask: async (params) => {
          set({ loading: true });
          const result = await taskService.createTask(params);
          if (result.ok) {
            const tasks = get().tasks;
            set({
              tasks: [...tasks, result.value],
              loading: false,
              error: null
            });
          } else {
            set({ loading: false, error: result.error });
          }
        },

        updateTask: async (id, updates) => {
          set({ loading: true });
          const result = await taskService.updateTask(id, updates);
          if (result.ok) {
            const tasks = get().tasks;
            set({
              tasks: tasks.map(task => task.id === id ? result.value : task),
              loading: false,
              error: null
            });
          } else {
            set({ loading: false, error: result.error });
          }
        },

        deleteTask: async (id) => {
          set({ loading: true });
          const result = await taskService.deleteTask(id);
          if (result.ok) {
            const tasks = get().tasks;
            set({
              tasks: tasks.filter(task => task.id !== id),
              loading: false,
              error: null
            });
          } else {
            set({ loading: false, error: result.error });
          }
        },

        selectTask: (id) => {
          set({ selectedTaskId: id });
        }
      }),
      {
        name: 'jikanicle-task-store',
        partialize: (state) => ({ tasks: state.tasks, selectedTaskId: state.selectedTaskId }),
      }
    )
  );
};
```

### 9.3 使用例

```tsx
// src/ui/components/TaskList.tsx
import { useEffect } from 'react';
import { useTaskStore } from '../state/task-store';

export const TaskList = () => {
  const { tasks, loading, error, fetchTasks, selectTask } = useTaskStore();

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  if (loading) return <div>読み込み中...</div>;
  if (error) return <div>エラー: {error.message}</div>;

  return (
    <div>
      <h2>タスク一覧</h2>
      <ul>
        {tasks.map(task => (
          <li key={task.id} onClick={() => selectTask(task.id)}>
            {task.name} - {task.status}
          </li>
        ))}
      </ul>
    </div>
  );
};
```

## 10. 結論と推奨事項

### 10.1 Zustand採用のメリット

- シンプルなAPI設計により開発効率が向上する
- 型安全性が高く、TypeScriptとの親和性が優れている
- パフォーマンスが良く、不要な再レンダリングを減らせる
- 段階的に導入でき、既存コードへの影響を最小限に抑えられる
- ミドルウェアによる拡張性が高い

### 10.2 考慮すべき点

- ドメインロジックとの適切な分離を維持する規律が必要
- チームの学習コストを考慮する
- 大規模化した場合のストア管理戦略を事前に検討する

### 10.3 推奨アプローチ

1. **段階的導入**: まず一部のUI状態管理にZustandを導入し、効果を評価する。例えば、タスク管理画面のUI状態から始める。

2. **明確な責任分担**: ドメインロジックはドメイン層に、UI状態のみをZustandで管理するガイドラインを確立する。

```
- ドメインロジック → ドメイン層（集約、エンティティ、値オブジェクト）
- データアクセス → アプリケーション層（リポジトリ、サービス）
- UI状態 → Zustandストア（表示状態、選択状態、フォーム状態）
```

3. **ストア設計パターン**: 境界づけられたコンテキストごとに独立したストアを作成し、必要に応じて連携する。

```
- useTaskStore: タスク管理コンテキスト
- useTimeBlockStore: タイムブロッキングコンテキスト
- useTimeTrackingStore: タイムトラッキングコンテキスト
```

4. **テスト戦略**: ストアのテスト方法を確立し、CI/CDパイプラインに組み込む。

### 10.4 最終判断

jikanicleプロジェクトの規模と要件を考慮すると、Zustandは良い選択肢となり得ます。特にReactコンテキストのパフォーマンス問題を解決しつつ、DDDの原則を維持できる点が魅力的です。ただし、導入前にチーム内での合意形成と、明確な使用ガイドラインの確立が重要です。

## 11. 次のステップ

1. プロトタイプ実装: タスク管理画面の一部をZustandで実装し、パフォーマンスと開発体験を評価する
2. ガイドライン作成: Zustandの使用パターンとアンチパターンを文書化する
3. チームトレーニング: 短いワークショップを開催し、Zustandの基本概念と使用方法を共有する
4. 段階的移行計画: 既存のコンテキストベースの状態管理からZustandへの移行計画を策定する