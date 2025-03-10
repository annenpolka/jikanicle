# ファイルベースリポジトリの設計と実装仕様

## 更新履歴

| 日付 | 更新者 | 内容 |
|------|--------|------|
| 2025-03-10 | 開発チーム | ファイルベースリポジトリの初期設計 |

## 1. リポジトリの責務と境界

### 1.1 責務の定義

ファイルベースタスクリポジトリは、既存の`TaskRepository`インターフェースに準拠しながら、以下の責務を担います：

- タスク集約のファイルシステムへの永続化と読み取り
- ファイルシステム操作の抽象化と例外処理
- 一貫したデータ形式の維持とバリデーション
- シリアライズ・デシリアライズの処理
- 同時アクセス時の整合性保護

### 1.2 境界の明確化

- **ドメイン層**: アプリケーションはリポジトリインターフェースのみを認識
- **インフラストラクチャ層**: ファイルシステム操作・シリアライズの詳細を隠蔽
- **依存関係**: ファイルシステムへの依存を逆転し、抽象に依存する実装とする

### 1.3 既存インターフェースとの関係

- 既存の`TaskRepository`インターフェースを完全に実装
- 同じエラー型と戻り値を維持
- アプリケーションコードを変更せずに差し替え可能に設計

## 2. データ構造とシリアライズ方法

### 2.1 ファイル形式とデータ構造

```typescript
// ファイルシステムに保存されるタスクデータの構造
type SerializedTask = {
  id: string;
  name: string;
  description: string;
  status: string; // TaskStatusをstringとして格納
  category: string; // Categoryをstringとして格納
  priority: string; // Priorityをstringとして格納
  estimatedDuration: number;
  createdAt: string; // ISO8601形式
  updatedAt: string; // ISO8601形式
  completedAt?: string; // ISO8601形式（存在する場合）
  tags: string[];
  version: number; // 楽観的ロック用のバージョン情報
};

// メタデータファイル構造
type RepositoryMetadata = {
  schemaVersion: string; // スキーマバージョン
  lastUpdated: string; // ISO8601形式
  taskCount: number; // 格納タスク数
  indexes: {
    byStatus: Record<string, string[]>; // ステータス別インデックス
    byCategory: Record<string, string[]>; // カテゴリ別インデックス
    byTag: Record<string, string[]>; // タグ別インデックス
  };
};
```

### 2.2 シリアライズ・デシリアライズ戦略

#### シリアライズ処理
- 各タスクを個別JSONファイルとして保存（`{id}.json`）
- Dateオブジェクトを国際標準ISO8601形式でシリアライズ
- 列挙型を文字列としてシリアライズ
- 暗黙的な型変換を避け、明示的に型を保持
- Zodスキーマを使用して出力前にデータを検証

#### デシリアライズ処理
- JSONデータを読み込み、型安全な解析を実施
- ISO8601文字列をDateオブジェクトに変換
- 文字列からブランド型および列挙型への変換を実施
- Zodスキーマによるバリデーションで型の整合性を確保

### 2.3 インデックスとメタデータ

- クエリ最適化のためのインデックスファイル管理
- リポジトリ全体のメタデータを記録する中央ファイル
- スキーマバージョンを含めた互換性管理
- 簡易検索のための非正規化インデックス

## 3. ファイル操作の抽象化と依存関係管理

### 3.1 ファイルシステムアダプター

```typescript
// ファイルシステム操作の抽象化インターフェース
export type FileSystemAdapter = {
  // ファイル操作
  readFile(path: string): Promise<Result<string, FileSystemError>>;
  writeFile(path: string, content: string): Promise<Result<void, FileSystemError>>;
  deleteFile(path: string): Promise<Result<void, FileSystemError>>;
  fileExists(path: string): Promise<Result<boolean, FileSystemError>>;

  // ディレクトリ操作
  createDirectory(path: string): Promise<Result<void, FileSystemError>>;
  ensureDirectory(path: string): Promise<Result<void, FileSystemError>>;
  listFiles(directory: string, pattern?: string): Promise<Result<string[], FileSystemError>>;

  // 排他制御
  acquireLock(resourceId: string): Promise<Result<void, FileSystemError>>;
  releaseLock(resourceId: string): Promise<Result<void, FileSystemError>>;
};

// アダプター用エラー型
export type FileSystemError =
  | { readonly type: 'NOT_FOUND'; readonly message: string; readonly path: string }
  | { readonly type: 'PERMISSION_DENIED'; readonly message: string; readonly path: string }
  | { readonly type: 'ALREADY_EXISTS'; readonly message: string; readonly path: string }
  | { readonly type: 'IO_ERROR'; readonly message: string; readonly path: string; readonly cause?: unknown }
  | { readonly type: 'LOCK_ERROR'; readonly message: string; readonly resourceId: string }
  | { readonly type: 'INVALID_PATH'; readonly message: string; readonly path: string };
```

### 3.2 依存関係の注入

- FileSystemAdapterを利用し、具体的なファイルシステム実装の詳細を隠蔽
- リポジトリ作成時にアダプターを注入し、依存関係を明示的に管理
- 環境に応じたアダプター実装の差し替えを容易に

```typescript
export function createFileBasedTaskRepository(options: {
  baseDirectory: string;
  fileSystemAdapter: FileSystemAdapter;
  serializationOptions?: SerializationOptions;
}): TaskRepository {
  // 実装...
}
```

### 3.3 テストでのモック

- テスト用にインメモリFileSystemAdapterを提供
- テスト時のファイルシステムの状態を容易に制御・検証可能に
- 副作用のないユニットテストを実現

## 4. エラーハンドリング戦略

### 4.1 エラーマッピング

ファイルシステムエラーを適切なリポジトリエラーに変換する明示的なマッピング：

```typescript
// エラーマッピング関数
function mapFileSystemErrorToRepositoryError(error: FileSystemError): TaskRepositoryError {
  switch (error.type) {
    case 'NOT_FOUND':
      return { type: 'NOT_FOUND', message: `タスクが見つかりません: ${error.message}` };
    case 'PERMISSION_DENIED':
      return {
        type: 'STORAGE_ERROR',
        message: `ストレージへのアクセス権がありません: ${error.message}`,
        cause: error
      };
    case 'ALREADY_EXISTS':
      return { type: 'ALREADY_EXISTS', message: `タスクは既に存在します: ${error.message}` };
    case 'LOCK_ERROR':
      return {
        type: 'CONCURRENCY_ERROR',
        message: `並行アクセスエラー: ${error.message}`
      };
    default:
      return {
        type: 'STORAGE_ERROR',
        message: `ファイル操作エラー: ${error.message}`,
        cause: error
      };
  }
}
```

### 4.2 Result型によるエラーハンドリング

- すべての操作にnevertroughのResult型を使用
- エラーの伝播を型安全に管理
- エラーハンドリングを強制し、処理漏れを防止

### 4.3 リカバリーメカニズム

- データの整合性を確保するための自動リカバリー処理
- インデックスとデータの不整合検出と修復
- バックアップからの自動復元機能

## 5. パフォーマンスと同時アクセスの考慮事項

### 5.1 同時アクセス制御

- ファイルレベルでの排他ロックの実装
- 楽観的ロック（バージョン番号）と悲観的ロック（ファイルロック）の併用
- 処理単位での一貫したロック管理

```typescript
// 楽観的ロック実装例
async function saveWithOptimisticLock(task: Task): Promise<Result<Task, TaskRepositoryError>> {
  const existingResult = await readTaskFile(task.id);

  if (existingResult.isOk()) {
    const existing = existingResult.value;

    // バージョン検証
    if (existing.version !== task.version) {
      return err({
        type: 'CONCURRENCY_ERROR',
        message: `タスク ${task.id} は他のプロセスによって更新されています。`
      });
    }

    // バージョン番号を増加
    const updatedTask = {
      ...task,
      version: task.version + 1,
      updatedAt: new Date()
    };

    return await writeTaskFile(updatedTask);
  }

  return existingResult;
}
```

### 5.2 パフォーマンス最適化

- 効率的なクエリのためのインデックス管理
- キャッシュ戦略によるディスクI/O削減
- バルク操作の最適化（一括読み込み・書き込み）

```typescript
// インデックスを活用したクエリ例
async function findByStatus(status: TaskStatus): Promise<Result<readonly Task[], TaskRepositoryError>> {
  const indexResult = await readIndex();
  if (indexResult.isErr()) {
    return indexResult;
  }

  const taskIds = indexResult.value.byStatus[status] || [];
  const tasks: Task[] = [];

  // 並行読み込みで高速化
  const results = await Promise.all(
    taskIds.map(id => readTaskFile(id))
  );

  // エラー処理と結果集約
  for (const result of results) {
    if (result.isErr()) {
      return result;
    }
    tasks.push(result.value);
  }

  return ok(tasks);
}
```

### 5.3 スケーラビリティ考慮事項

- 大規模データセットのための分割戦略
- リソース使用量の制限とモニタリング
- 非同期処理によるブロッキング防止

## 6. テスト戦略

### 6.1 テスト階層

1. **ユニットテスト**
   - シリアライズ・デシリアライズロジックのテスト
   - エラーハンドリングのテスト
   - インデックス更新ロジックのテスト

2. **統合テスト**
   - インメモリFileSystemAdapterを使用したリポジトリのテスト
   - 完全なCRUD操作の検証
   - 複雑なクエリとフィルタリングのテスト

3. **システムテスト**
   - 実際のファイルシステムを使用した検証
   - 同時アクセス時の動作検証
   - パフォーマンステスト

### 6.2 テスト用ヘルパーと固定データ

```typescript
// テスト用アダプターファクトリ
export function createInMemoryFileSystemAdapter(): FileSystemAdapter {
  const files = new Map<string, string>();
  const locks = new Set<string>();

  return {
    readFile: async (path) => {
      if (!files.has(path)) {
        return err({ type: 'NOT_FOUND', message: `File not found: ${path}`, path });
      }
      return ok(files.get(path)!);
    },
    writeFile: async (path, content) => {
      files.set(path, content);
      return ok(undefined);
    },
    // その他の実装...
  };
}

// テスト用固定データ
export const testTasks: Task[] = [
  {
    id: createTaskId('task-1'),
    name: 'テストタスク1',
    description: 'テスト用のタスク説明1',
    status: 'NOT_STARTED',
    category: 'WORK',
    priority: 'HIGH',
    estimatedDuration: 60,
    createdAt: new Date('2025-01-01'),
    updatedAt: new Date('2025-01-01'),
    tags: ['テスト', 'サンプル'],
    version: 1
  },
  // その他のテストデータ...
];
```

### 6.3 テストカバレッジ目標

- コアロジック: 100%
- エラーハンドリングパス: 100%
- ヘルパー関数: 90%以上
- 統合ポイント: 80%以上

## 7. 実装ロードマップ

### フェーズ1: 基本実装
- 基本的なファイルシステムアダプターの実装
- 単一タスクの読み書き機能
- 最小限のエラーハンドリング

### フェーズ2: インデックスとクエリ
- インデックス管理の実装
- フィルタリングとクエリの最適化
- パフォーマンス向上施策

### フェーズ3: 並行処理と堅牢性
- ロック機構の実装
- エラーリカバリーメカニズム
- エッジケース対応

### フェーズ4: 高度な機能
- バックアップと復元
- データ移行ツール
- 監視と診断機能

## 関連ドキュメント

- [タスク管理ドメイン設計](../design.md)
- [タスク管理実装詳細](../implementation.md)