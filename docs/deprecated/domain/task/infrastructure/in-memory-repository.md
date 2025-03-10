# インメモリタスクリポジトリの設計と実装

## 更新履歴

| 日付 | 更新者 | 内容 |
|------|--------|------|
| 2025-03-10 | 開発チーム | 新しいディレクトリ構造への移行 |
| 2025-03-09 | 開発チーム | 初版作成 |

## 1. リポジトリの責務と境界

### 1.1 責務の定義

インメモリタスクリポジトリは、以下の責務を担います：

- タスク集約のインメモリでの一時的な保持と取得
- 検索とフィルタリング機能の提供
- エラーハンドリングと型安全性の確保
- テスト用の信頼性の高いタスク永続化の代替手段の提供

### 1.2 境界の明確化

- **ドメイン層**: アプリケーションはリポジトリインターフェースのみを認識
- **インフラストラクチャ層**: 実際のデータ保持方法と永続化の詳細を隠蔽
- **依存関係**: 抽象に依存する実装（依存関係逆転の原則）

### 1.3 既存インターフェースとの関係

```typescript
export interface TaskRepository {
  findById(id: TaskId): Promise<Result<Task, TaskRepositoryError>>;
  findAll(filter?: TaskFilter): Promise<Result<readonly Task[], TaskRepositoryError>>;
  save(task: Task): Promise<Result<Task, TaskRepositoryError>>;
  delete(id: TaskId): Promise<Result<void, TaskRepositoryError>>;
  count(filter?: TaskFilter): Promise<Result<number, TaskRepositoryError>>;
}
```

## 2. データ構造と保持方法

### 2.1 インメモリデータ構造

```typescript
// 内部状態を保持するためのMap
type TasksState = {
  readonly tasksMap: ReadonlyMap<string, Task>;
};
```

内部状態はMapデータ構造で管理され、キーはTaskIdで、値はTaskオブジェクトです。これにより：

- O(1)の時間複雑度でのルックアップ
- キーによる一意性の確保
- イミュータブルな状態管理

### 2.2 データ操作戦略

- **不変性の原則**: すべての操作で新しいデータ構造を生成（ミュータブルな操作を避ける）
- **リファレンスセルパターン**: 状態変更を制御するための一貫したパターン
- **シャローコピー**: タスクオブジェクトのシャローコピーで参照透過性を確保

## 3. 実装パターンとロジック

### 3.1 関数型アプローチ

```typescript
// ファクトリ関数による生成
export function createInMemoryTaskRepository(initialTasks: readonly Task[] = []): TaskRepository {
  // クロージャによる内部状態の隠蔽
  let state = { tasksMap: createInitialMap(initialTasks) };

  // 操作を提供する内部関数
  const getTasksMap = (): ReadonlyMap<string, Task> => state.tasksMap;
  const setTasksMap = (newMap: ReadonlyMap<string, Task>): void => {
    state = { tasksMap: newMap };
  };

  // TaskRepositoryインターフェースの実装
  // ...
}
```

### 3.2 フィルタリングロジック

以下のフィルタリング条件がサポートされています：

- **status**: タスクのステータスによるフィルタリング
- **category**: カテゴリによるフィルタリング
- **tags**: 指定されたタグをすべて含むタスクのフィルタリング
- **createdAfter/createdBefore**: 作成日時の範囲によるフィルタリング
- **textSearch**: タスク名と説明文に対するテキスト検索

実装例：

```typescript
// フィルタリングの実装例（擬似コード）
const filterTasks = (filter?: TaskFilter): readonly Task[] => {
  if (!filter) return Array.from(getTasksMap().values());

  return Array.from(getTasksMap().values()).filter(task => {
    // 各フィルタ条件をチェック
    if (filter.status && !filter.status.includes(task.status)) return false;
    if (filter.category && task.category !== filter.category) return false;
    // ... その他のフィルタ処理
    return true;
  });
};
```

## 4. エラーハンドリング戦略

### 4.1 Result型の活用

すべての操作はnevertroughのResult型を返し、型安全にエラーを処理します：

```typescript
// findById実装例
const findById = async (id: TaskId): Promise<Result<Task, TaskRepositoryError>> => {
  const task = getTasksMap().get(id);
  if (task === undefined) {
    return err({
      type: 'NOT_FOUND',
      message: `タスクID: ${id} は見つかりませんでした`
    });
  }
  return ok(task);
};
```

### 4.2 エラーの種類

- **NOT_FOUND**: 指定されたIDのタスクが存在しない
- **ALREADY_EXISTS**: 同じIDのタスクが既に存在する（保存時）
- **STORAGE_ERROR**: データ操作中のエラー
- **VALIDATION_ERROR**: タスクデータがバリデーションに失敗
- **CONCURRENCY_ERROR**: 楽観的ロックによる競合検出（将来的な拡張用）

## 5. パフォーマンスと拡張性考慮事項

### 5.1 パフォーマンス特性

- **メモリ使用量**: タスク数に比例するメモリ使用
- **検索効率**: 単一IDルックアップはO(1)、フィルタリング検索はO(n)
- **メモリ効率**: 大量データ処理時のメモリ消費に注意

### 5.2 将来の拡張性

現在の実装は基本的な機能を提供していますが、以下の拡張が計画されています：

- **ソート機能の追加**: 複数条件でのソートとソート順指定
- **ページネーション対応**: 大量データの効率的な取得
- **高度な検索機能**: 複雑な条件式や全文検索
- **インデックス機構**: 頻繁に使用される検索条件の最適化

## 6. テスト戦略

### 6.1 単体テスト範囲

- 各リポジトリメソッドの正常系テスト
- 各エラーケースの検証
- 境界条件のテスト（空リポジトリ、大量データなど）

### 6.2 テストアプローチ

```typescript
// テスト例（擬似コード）
describe('InMemoryTaskRepository', () => {
  // 各テストで新しいリポジトリインスタンスを使用
  let repository: TaskRepository;

  beforeEach(() => {
    repository = createInMemoryTaskRepository();
  });

  test('should save and retrieve a task', async () => {
    // テスト実装...
  });

  test('should return error when task not found', async () => {
    // テスト実装...
  });

  // 他のテスト...
});
```

## 7. 他のリポジトリ実装との比較

### 7.1 インメモリ実装の利点

- **速度**: 全操作がメモリ内で高速に実行
- **シンプル**: 外部依存がなく設定が簡単
- **テスト容易性**: 再現性が高く隔離されたテスト環境

### 7.2 制限事項

- **永続性なし**: アプリケーション終了時にデータが失われる
- **スケーラビリティ制限**: 単一プロセス内でのみ有効
- **分散システムサポートなし**: 複数インスタンス間でのデータ共有が困難

### 7.3 ファイルベース実装との互換性

ファイルベースリポジトリは同じインターフェースに準拠するため、アプリケーションコードを変更せずに切り替えが可能です。これにより、以下のシナリオが実現可能になります：

- 開発中はインメモリ実装で迅速な開発・テスト
- 本番環境ではファイルベース実装で永続性を確保
- テスト環境では両実装を状況に応じて使い分け

## 関連ドキュメント

- [タスク管理ドメイン設計](../design.md)
- [タスク管理実装詳細](../implementation.md)
- [ファイルベースリポジトリの設計と実装](./file-based-repository.md)