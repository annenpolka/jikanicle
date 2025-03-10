# ファイルベースリポジトリの実装計画書

## 更新履歴

| 日付 | 更新者 | 内容 |
|------|--------|------|
| 2025-03-10 | 設計チーム | 初版作成 |

## 1. 設計概要

ファイルベースリポジトリの設計仕様書とインメモリリポジトリ実装を詳細に分析した結果、以下の実装計画を提案します。本実装計画は、ドメイン駆動設計の原則に基づき、アプリケーション層との境界を明確にしながら、永続化の信頼性を確保するものです。

### 1.1 設計アプローチ

- **アダプターパターン**: ファイルシステム操作を抽象化し、依存関係の逆転を実現
- **関数型アプローチ**: インメモリ実装と同様の純粋関数志向で副作用を最小限に
- **Result型活用**: 一貫したエラーハンドリングと型安全性の確保
- **互換性確保**: `TaskRepository`インターフェースへの完全準拠

### 1.2 基本方針

- 既存のインメモリリポジトリと同一の公開API（パブリックインターフェース）を提供
- ファイルシステム操作の詳細をアダプターで隠蔽
- JSON形式でのシリアライズ/デシリアライズによるデータ永続化
- 検索効率のためのインデックス管理
- 並行アクセスの整合性保護

## 2. 主要コンポーネント設計

### 2.1 FileSystemAdapter

ファイルシステム操作を抽象化し、実装詳細を隠蔽するアダプターインターフェース。

```typescript
// src/infrastructure/adapters/file-system-adapter.ts

import { Result } from 'neverthrow';

export type FileSystemError =
  | { readonly type: 'NOT_FOUND'; readonly message: string; readonly path: string }
  | { readonly type: 'PERMISSION_DENIED'; readonly message: string; readonly path: string }
  | { readonly type: 'ALREADY_EXISTS'; readonly message: string; readonly path: string }
  | { readonly type: 'IO_ERROR'; readonly message: string; readonly path: string; readonly cause?: unknown }
  | { readonly type: 'LOCK_ERROR'; readonly message: string; readonly resourceId: string }
  | { readonly type: 'INVALID_PATH'; readonly message: string; readonly path: string };

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
```

### 2.2 シリアライズ/デシリアライズユーティリティ

タスクエンティティとJSONデータの変換を担当するユーティリティ。

```typescript
// src/infrastructure/utils/task-serialization.ts

export type SerializedTask = {
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
```

### 2.3 インデックス管理

検索効率化のためのインデックス構造とその管理機能。

```typescript
// インデックスデータ構造
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

### 2.4 エラーハンドリング戦略

ファイルシステムエラーからリポジトリエラーへの一貫したマッピング。

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

### 2.5 主要リポジトリメソッド

```typescript
// ファクトリ関数とオプション
export type FileBasedTaskRepositoryOptions = {
  readonly baseDirectory: string;
  readonly fileSystemAdapter: FileSystemAdapter;
};

export function createFileBasedTaskRepository(
  options: FileBasedTaskRepositoryOptions
): TaskRepository {
  // 実装...
}
```

## 3. 実装ロードマップ

### 3.1 フェーズ1: 基本実装（予定工数: 3人日）

1. **FileSystemAdapterインターフェース定義**
   - 抽象インターフェース設計
   - エラー型定義
   - Node.js実装の作成

2. **シリアライズ/デシリアライズユーティリティ**
   - タスク⇔JSON変換機能
   - Zodスキーマによるバリデーション
   - 日付型の適切な変換

3. **単一タスク操作の実装**
   - findById実装
   - save実装（新規作成と更新）
   - delete実装
   - 初期テストケース作成

### 3.2 フェーズ2: 検索とインデックス（予定工数: 2人日）

1. **インデックス管理機構**
   - メタデータファイル設計
   - インデックス更新ロジック
   - インデックス整合性確保

2. **検索機能実装**
   - findAll実装とフィルタリング
   - count実装
   - 効率的な検索アルゴリズム

3. **テスト強化**
   - 検索機能のテストケース追加
   - エッジケーステスト
   - パフォーマンステスト

### 3.3 フェーズ3: 堅牢性向上（予定工数: 2人日）

1. **排他制御メカニズム**
   - 楽観的ロック実装
   - ファイルロック機構
   - 競合検出とリカバリー

2. **エラーハンドリング強化**
   - 詳細エラーマッピング
   - リカバリーメカニズム
   - エラーログ強化

3. **パフォーマンス最適化**
   - バルク操作の効率化
   - キャッシュ戦略検討
   - インデックス最適化

## 4. テスト戦略

### 4.1 単体テスト

1. **モックアダプターを使用したテスト**
   - インメモリファイルシステムシミュレーション
   - 各メソッドの正常系テスト
   - エラーケースのテスト

2. **シリアライズ/デシリアライズのテスト**
   - 型変換の正確性検証
   - エッジケース（null, undefined, 特殊文字など）
   - バリデーションの検証

3. **カバレッジ目標**
   - コアロジック: 100%
   - エラーハンドリングパス: 100%
   - ヘルパー関数: 90%以上

### 4.2 統合テスト

1. **実際のファイルシステムを使用したテスト**
   - 一時ディレクトリを使用した実ファイル操作
   - リポジトリのライフサイクルテスト
   - データ永続化の検証

2. **複合操作のテスト**
   - 検索条件の組み合わせテスト
   - 並行アクセスのシミュレーション
   - 異常系からのリカバリー

### 4.3 パフォーマンステスト

1. **大量データテスト**
   - 数百〜数千タスクでのパフォーマンス計測
   - メモリ使用量の監視
   - インデックス効率の検証

2. **シナリオベースのテスト**
   - 実際の使用パターンに基づくテスト
   - 頻繁な更新シナリオ
   - 複雑なクエリシナリオ

## 5. 検討事項と注意点

### 5.1 パフォーマンス

- **I/Oボトルネック**: ディスク操作はメモリ操作より遅い
- **インデックス維持コスト**: 検索効率と更新コストのトレードオフ
- **キャッシュ戦略**: 頻繁にアクセスされるデータのメモリキャッシュ検討

### 5.2 エラー耐性

- **予期せぬシステムクラッシュ**: 書き込み途中のクラッシュからの回復
- **データ破損防止**: アトミックな操作とバックアップ戦略
- **インデックス整合性**: インデックスとデータの不一致検出と修復

### 5.3 拡張性

- **データ量増加対応**: スケーラビリティを考慮した設計
- **スキーマ変更**: 将来的なタスク構造変更への対応
- **他ストレージへの移行**: SQLiteなど他のストレージへの移行パス確保

## 6. 成果物

1. **ソースコード**
   - `src/infrastructure/adapters/file-system-adapter.ts`
   - `src/infrastructure/adapters/node-fs-adapter.ts`
   - `src/infrastructure/utils/task-serialization.ts`
   - `src/infrastructure/repositories/file-based-task-repository.ts`

2. **テストコード**
   - `test/infrastructure/utils/task-serialization.test.ts`
   - `test/infrastructure/repositories/file-based-task-repository.test.ts`
   - `test/infrastructure/repositories/file-based-task-repository.integration.test.ts`

3. **ドキュメント**
   - 実装仕様書
   - APIドキュメント
   - テスト結果レポート

## 関連ドキュメント

- [タスク管理ドメイン設計](../design.md)
- [タスク管理実装詳細](../implementation.md)
- [インメモリリポジトリの設計と実装](./in-memory-repository.md)
- [ファイルベースリポジトリの設計仕様書](./file-based-repository.md)