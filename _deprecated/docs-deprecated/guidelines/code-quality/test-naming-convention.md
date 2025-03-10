# テストファイル命名規則

## 背景

将来的なリポジトリ実装の増加を踏まえ、テストファイルの命名規則を整理しました。明確な命名規則を設けることで、テストの目的と範囲が一目で理解でき、プロジェクトの保守性と拡張性が向上します。

## 基本方針

テストファイルの命名は、テストのタイプと対象コンポーネントを明確に示す必要があります。特にリポジトリとの統合テストでは、どのリポジトリ実装と統合しているかを明示することが重要です。

## 命名規則

### 1. 単体テスト (Unit Test)

単体テストは、外部依存を持たない独立したコンポーネントのテストです。

```
{機能名}.test.ts
```

例：
- `delete-task.test.ts`
- `task-factory.test.ts`
- `update-task.test.ts`

内部の `describe` ブロックには、テストタイプを明示します：

```typescript
describe('{機能名} - 単体テスト', () => {
  // テストケース
});
```

### 2. リポジトリ統合テスト (Repository Integration Test)

特定のリポジトリ実装との統合テストは、実装種別を明示します。

```
{機能名}.{リポジトリ種別}-repository.test.ts
```

例：
- `delete-task.inmemory-repository.test.ts`
- `update-task.inmemory-repository.test.ts`

将来的に新しいリポジトリ実装が追加された場合：
- `delete-task.sql-repository.test.ts`
- `delete-task.mongodb-repository.test.ts`
- `delete-task.firebase-repository.test.ts`

内部の `describe` ブロックには、リポジトリタイプを明示します：

```typescript
describe('{機能名} - {リポジトリ種別}Repository統合テスト', () => {
  // テストケース
});
```

### 3. その他の統合テスト

他のコンポーネントとの統合テストの場合も、同様に統合対象を明示します。

```
{機能名}.{統合対象}-integration.test.ts
```

例：
- `task-list.ui-integration.test.ts`
- `task-prediction.ai-integration.test.ts`

## 利点

この命名規則を採用することで、以下のような利点があります：

1. **明確性**: ファイル名だけでテストの種類と対象が判断できる
2. **検索性**: 特定タイプのテストを効率的に検索できる
3. **拡張性**: 新しいリポジトリ実装やコンポーネントが追加された際に一貫した命名が可能
4. **ドキュメント性**: テストファイル自体がコードベースの構造を説明する資料となる

## 実装例

```typescript
// delete-task.inmemory-repository.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { deleteTask } from '../../../src/domain/commands/delete-task';
import { createInMemoryTaskRepository } from '../../../src/infrastructure/repositories/in-memory-task-repository';

describe('deleteTask - InMemoryRepository統合テスト', () => {
  // テストケース
});

// delete-task.test.ts
import { describe, it, expect, vi } from 'vitest';
import { deleteTask } from '../../../src/domain/commands/delete-task';

describe('deleteTask - 単体テスト', () => {
  // テストケース
});
```

この命名規則はプロジェクト全体の一貫性を保つために、全てのテストファイルに適用します。既存のテストファイルについても、今後のリファクタリングで徐々にこの規則に合わせていきます。