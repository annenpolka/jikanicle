# Zustandライブラリ採用方針とドメイン設計整合性調査

## 1. 概要

本ドキュメントでは、jikanicleプロジェクトにおけるZustandライブラリの採用方針と、現状のドメイン駆動設計（DDD）との整合性について調査・分析します。Zustandの特性とDDDの原則を照らし合わせ、適切な統合方法と実装戦略を提案します。

## 2. 現状分析

### 2.1 jikanicleのドメイン設計

jikanicleプロジェクトは以下の境界づけられたコンテキストを持つDDD構造で設計されています：

- **タスク管理コンテキスト**: タスクの作成、編集、カテゴリ分類
- **タイムブロッキングコンテキスト**: スケジュール生成、タイムブロックの管理
- **タイムトラッキングコンテキスト**: 実績時間の記録と分析
- **予測コンテキスト**: AIによる所要時間予測と学習

現在の実装では、ドメイン層とアプリケーション層が明確に分離されており、リポジトリパターンを通じてデータアクセスが抽象化されています。UI層は現在、React/Inkを使用したCLIインターフェースとして実装されていますが、状態管理の明確な戦略はまだ実装されていません。

### 2.2 現在の状態管理アプローチ

現状の設計では、以下の状態管理の方針が示されています：

1. **ドメイン状態**: リポジトリパターンを通じて管理
2. **アプリケーション状態**: アプリケーションサービスとカスタムフックを通じて管理
3. **UI状態**: Reactのローカル状態とコンテキストを通じて管理（計画段階）

しかし、UI層の状態管理の実装はまだ完了しておらず、`src/ui/state`および`src/ui/contexts`ディレクトリは現在空の状態です。

## 3. Zustandの特性とDDDとの整合性

### 3.1 Zustandの主な特性

Zustandは以下の特性を持つ軽量な状態管理ライブラリです：

- シンプルなAPI設計（ボイラープレートコードが少ない）
- フック中心のアプローチ
- TypeScriptとの優れた親和性
- 小さなバンドルサイズ（約3KB）
- ミドルウェアによる拡張性（永続化、デバッグなど）
- 部分的な状態購読によるパフォーマンス最適化

### 3.2 DDDの原則との整合性評価

| DDD原則 | Zustandとの整合性 | 評価 |
|---------|-------------------|------|
| ユビキタス言語 | ストア設計でドメイン用語を使用可能 | 良好 |
| 境界づけられたコンテキスト | コンテキストごとに独立したストアを作成可能 | 良好 |
| 集約 | ストア内で集約の整合性を維持する仕組みが必要 | 要注意 |
| エンティティと値オブジェクト | イミュータブルな状態更新で値オブジェクトの不変性を保持 | 良好 |
| ドメインサービス | ストア内のアクションとして実装可能 | 良好 |
| リポジトリ | ストアからリポジトリを呼び出す構造が自然に構築可能 | 良好 |
| 依存関係逆転の原則 | ドメイン層への依存を適切に管理する規律が必要 | 要注意 |

### 3.3 潜在的な課題

1. **ドメインロジックの漏洩**: ストア内にドメインロジックを実装してしまう誘惑があり、適切な層分離を維持する規律が必要
2. **集約の整合性管理**: 複数の集約をまたがる操作において、整合性を保つための追加的な仕組みが必要
3. **状態管理の重複**: ドメイン状態とUI状態の間で重複が生じる可能性

## 4. 実装戦略

### 4.1 推奨アプローチ

jikanicleプロジェクトにおけるZustandの採用には、以下のアプローチを推奨します：

1. **境界づけられたコンテキストごとのストア設計**:
   - タスク管理ストア
   - タイムブロッキングストア
   - タイムトラッキングストア
   - 予測ストア

2. **責任の明確な分離**:
   - ドメインロジック → ドメイン層（集約、エンティティ、値オブジェクト）
   - データアクセス → アプリケーション層（リポジトリ、サービス）
   - UI状態 → Zustandストア（表示状態、選択状態、フォーム状態）

3. **ファクトリ関数によるストア作成**:
   ```typescript
   export const createTaskStore = (taskService: TaskApplicationService) => {
     return create<TaskState>()(
       (set, get) => ({
         // 状態
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
         // 他のアクション
       })
     );
   };
   ```

4. **依存性注入パターン**:
   - アプリケーションサービスをストアに注入
   - テスト時にモックサービスに置き換え可能

### 4.2 型設計

```typescript
// src/ui/state/task-store.ts
import { create } from 'zustand';
import type { Task, TaskId } from '../../domain/types/Task.js';
import type { TaskApplicationService } from '../../application/services/task-application-service.js';
import type { ApplicationError } from '../../application/types/errors.js';

// UI状態の型定義
interface TaskUIState {
  // 表示関連の状態
  selectedTaskId: TaskId | null;
  isCreateModalOpen: boolean;
  isEditModalOpen: boolean;
  isDeleteConfirmOpen: boolean;
  filterStatus: Task['status'][] | null;
  filterCategory: Task['category'] | null;
  sortBy: 'createdAt' | 'priority' | 'estimatedDuration';
  sortDirection: 'asc' | 'desc';
}

// アプリケーション状態の型定義
interface TaskAppState {
  tasks: Task[];
  loading: boolean;
  error: ApplicationError | null;
}

// アクションの型定義
interface TaskActions {
  // データ操作アクション
  fetchTasks: () => Promise<void>;
  createTask: (params: CreateTaskParams) => Promise<void>;
  updateTask: (id: TaskId, updates: Partial<Task>) => Promise<void>;
  deleteTask: (id: TaskId) => Promise<void>;

  // UI操作アクション
  selectTask: (id: TaskId | null) => void;
  openCreateModal: () => void;
  closeCreateModal: () => void;
  openEditModal: () => void;
  closeEditModal: () => void;
  setFilter: (status?: Task['status'][], category?: Task['category']) => void;
  setSorting: (by: TaskUIState['sortBy'], direction: TaskUIState['sortDirection']) => void;
}

// 完全なストアの型
type TaskStore = TaskUIState & TaskAppState & TaskActions;
```

### 4.3 永続化戦略

```typescript
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const createTaskStore = (taskService: TaskApplicationService) => {
  return create<TaskStore>()(
    persist(
      (set, get) => ({
        // 状態とアクション
      }),
      {
        name: 'jikanicle-task-store',
        // UIの設定のみを永続化
        partialize: (state) => ({
          filterStatus: state.filterStatus,
          filterCategory: state.filterCategory,
          sortBy: state.sortBy,
          sortDirection: state.sortDirection,
        }),
      }
    )
  );
};
```

## 5. DDDとの整合性を保つためのガイドライン

### 5.1 ドメインロジックの分離

- ドメインロジックはドメイン層に閉じ込め、Zustandストアからは呼び出すのみ
- ビジネスルールの検証はドメイン層で行い、ストアはその結果を反映するだけ
- 集約の整合性はドメイン層で保証し、ストアはその状態を表示するだけ

### 5.2 ストアの責任範囲

- UI状態の管理（選択状態、モーダル表示、フィルタ、ソート）
- アプリケーションサービスの呼び出し
- 結果の状態への反映
- エラー状態の管理
- ローディング状態の管理

### 5.3 テスト戦略

- ドメイン層のテスト: ドメインロジックの単体テスト
- アプリケーション層のテスト: サービスとリポジトリの統合テスト
- ストアのテスト: モックサービスを使用した単体テスト
- UI層のテスト: ストアを使用したコンポーネントのテスト

## 6. 段階的導入計画

### 6.1 フェーズ1: 基本構造の実装

1. Zustandのインストール
2. 基本的なストア構造の定義
3. タスク管理コンテキストのストア実装
4. 既存のUIコンポーネントとの統合

### 6.2 フェーズ2: 機能拡張

1. 永続化ミドルウェアの導入
2. デバッグツールの統合
3. 残りのコンテキストのストア実装
4. パフォーマンス最適化

### 6.3 フェーズ3: 高度な機能

1. ストア間の連携メカニズム
2. 非同期処理の最適化
3. エラーハンドリングの強化
4. テスト自動化の拡充

## 7. 結論

Zustandは、jikanicleプロジェクトのDDD設計と高い整合性を持ちながら、UI状態管理の課題を効果的に解決できるライブラリです。適切な責任分離と規律を維持することで、ドメイン層の純粋性を保ちながら、使いやすく型安全なUI状態管理を実現できます。

段階的な導入アプローチにより、既存のコードベースへの影響を最小限に抑えながら、状態管理の一貫性と保守性を向上させることが可能です。

## 8. 参考資料

- [Zustand公式ドキュメント](https://github.com/pmndrs/zustand)
- [DDDとReactの状態管理](https://khalilstemmler.com/articles/typescript-domain-driven-design/react-state-management/)
- [jikanicle状態管理設計ドキュメント](../technical/state-management-design.md)
- [jikanicleドメインモデル設計](../design/domain-model.md)