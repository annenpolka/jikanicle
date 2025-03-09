# タスク管理ドメイン実装詳細

このドキュメントはタスク管理ドメインの実装詳細について説明します。

## 関連ドキュメント

- [タスク管理ドメイン設計決定記録](./task-domain-adr.md)
- [Zod スキーマ実装](./zod-schema-implementation.md) - 型定義とスキーマの統合に関する詳細
- [ドメインモデル定義](../design/domain-model.md)

## 実装概要

タスク管理ドメインは DDD の原則に従って設計されており、以下の要素で構成されています：

1. エンティティと値オブジェクト
2. ドメインサービス
3. ファクトリ
4. リポジトリインターフェース

## 型定義とスキーマ

タスク管理ドメインでは、型定義とバリデーションスキーマを統合するために Zod を使用しています。詳細は[Zod スキーマ実装](./zod-schema-implementation.md)を参照してください。

主要な型として以下があります：

- `Task`: タスクエンティティ
- `TaskId`: タスク識別子（ブランド型）
- `Category`: タスクカテゴリ
- `TaskStatus`: タスクの状態
- `Priority`: 優先度

## ディレクトリ構造

```
src/domain/
├── schemas/         # Zodスキーマ定義
│   └── task-schema.ts
├── types/           # 型定義（スキーマからの再エクスポート）
│   └── Task.ts
├── factories/       # ファクトリ実装
│   └── task-factory.ts
└── services/        # ドメインサービス
    └── task-service.ts
```

## 実装詳細

### 1. スキーマと型定義

`task-schema.ts`には Zod スキーマと型定義が含まれています：

```typescript
// スキーマ定義
export const categorySchema = z.enum([
  'WORK',
  'PERSONAL_DEV',
  'HOUSEHOLD',
  'LEARNING',
  'OTHER',
]);
export const taskStatusSchema = z.enum([
  'NOT_STARTED',
  'IN_PROGRESS',
  'COMPLETED',
  'CANCELLED',
]);
// ...その他のスキーマ定義...

// スキーマから型を生成
export type Category = z.infer<typeof categorySchema>;
export type TaskStatus = z.infer<typeof taskStatusSchema>;
export type Priority = z.infer<typeof prioritySchema>;
export type TaskId = z.infer<typeof taskIdSchema>;
export type Task = z.infer<typeof taskSchema>;
export type CreateTaskParams = z.infer<typeof createTaskParamsSchema>;
```

`Task.ts`では、これらの型を再エクスポートしています：

```typescript
export {
  TaskId,
  createTaskId,
  Category,
  TaskStatus,
  Priority,
  Task,
  CreateTaskParams,
} from '../schemas/task-schema';
```

### 2. ファクトリ

`task-factory.ts`はタスクの作成を担当します：

```typescript
export function createTask(params: CreateTaskParams): Task {
  // パラメータのバリデーション
  const validParams = validateCreateTaskParams(params);

  // 現在時刻
  const now = new Date();

  // タスクオブジェクトの作成
  const task: Task = {
    id: validParams.id ?? createTaskId(uuidv4()),
    name: validParams.name,
    description: validParams.description ?? '',
    status: validParams.status ?? 'NOT_STARTED',
    category: validParams.category,
    priority: validParams.priority ?? 'MEDIUM',
    estimatedDuration: validParams.estimatedDuration,
    createdAt: validParams.createdAt ?? now,
    updatedAt: now,
    tags: validParams.tags ?? [],
  };

  return task;
}
```

## テスト戦略

タスク管理ドメインでは以下のテスト戦略を採用しています：

1. **ユニットテスト**: 個々のドメインオブジェクトとファクトリのテスト
2. **プロパティテスト**: バリデーションロジックの網羅的なテスト
3. **インテグレーションテスト**: リポジトリと組み合わせた際の動作確認

## 将来の拡張

1. サブタスクのサポート
2. 繰り返しタスクの実装
3. タスク間の依存関係の定義

## 技術的負債

1. 一部のバリデーションロジックの見直し
2. パフォーマンス最適化（大量のタスク処理時）
