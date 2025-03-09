# タスク管理ドメイン実装ドキュメント

このドキュメントでは、jikanicle アプリケーションのタスク管理ドメインの実装について説明します。

## 1. 実装の概要

タスク管理ドメインは、DDD の原則に基づいて実装されています。以下の要素を含みます：

- **ドメインモデル**: タスクを表すエンティティとその関連する値オブジェクト
- **ファクトリ関数**: タスクの作成を担当
- **スキーマ**: バリデーション用の Zod スキーマ

実装は TDD（テスト駆動開発）アプローチで行われ、高いテストカバレッジを確保しています。

## 2. 型定義

タスク管理ドメインでは、以下の型定義を行っています：

### 2.1 TaskId

タスクを一意に識別するための ID 型です。ブランド型を使用して型安全性を高めています。

```typescript
export type TaskId = string & { readonly _brand: unique symbol };

export const createTaskId = (id: string): TaskId => {
  return id as TaskId;
};
```

### 2.2 列挙型（Union Types）

タスクのカテゴリ、ステータス、優先度を表す列挙型です。文字列リテラルのユニオン型として実装されています。

```typescript
export type Category =
  | 'WORK'
  | 'PERSONAL_DEV'
  | 'HOUSEHOLD'
  | 'LEARNING'
  | 'OTHER';

export type TaskStatus =
  | 'NOT_STARTED'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'CANCELLED';

export type Priority = 'LOW' | 'MEDIUM' | 'HIGH';
```

### 2.3 Task インターフェース

タスクエンティティの構造を定義するインターフェースです。

```typescript
export interface Task {
  id: TaskId;
  name: string;
  description: string;
  status: TaskStatus;
  category: Category;
  priority: Priority;
  estimatedDuration: number; // 分単位
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
  tags: string[];
}
```

### 2.4 CreateTaskParams インターフェース

タスク作成時に必要なパラメータを定義するインターフェースです。

```typescript
export interface CreateTaskParams {
  name: string;
  estimatedDuration: number;
  category: Category;
  id?: TaskId;
  description?: string;
  status?: TaskStatus;
  priority?: Priority;
  createdAt?: Date;
  tags?: string[];
}
```

## 3. バリデーションスキーマ

バリデーションは Zod ライブラリを使用して実装されています。以下のスキーマが定義されています：

```typescript
// カテゴリのスキーマ
export const categorySchema = z.enum([
  'WORK',
  'PERSONAL_DEV',
  'HOUSEHOLD',
  'LEARNING',
  'OTHER',
]);

// タスクステータスのスキーマ
export const taskStatusSchema = z.enum([
  'NOT_STARTED',
  'IN_PROGRESS',
  'COMPLETED',
  'CANCELLED',
]);

// 優先度のスキーマ
export const prioritySchema = z.enum(['LOW', 'MEDIUM', 'HIGH']);

// TaskIdのスキーマ
export const taskIdSchema = z.string().min(1);

// タスク作成パラメータのスキーマ
export const createTaskParamsSchema = z.object({
  name: z.string().min(1, { message: 'タスク名は必須です' }),
  estimatedDuration: z
    .number()
    .nonnegative({ message: '予測時間は0以上である必要があります' }),
  category: categorySchema,
  id: taskIdSchema.optional(),
  description: z.string().optional().default(''),
  status: taskStatusSchema.optional().default('NOT_STARTED'),
  priority: prioritySchema.optional().default('MEDIUM'),
  createdAt: z.date().optional(),
  tags: z.array(z.string()).optional().default([]),
});

// タスクスキーマ
export const taskSchema = z.object({
  id: taskIdSchema,
  name: z.string().min(1),
  description: z.string(),
  status: taskStatusSchema,
  category: categorySchema,
  priority: prioritySchema,
  estimatedDuration: z.number().nonnegative(),
  createdAt: z.date(),
  updatedAt: z.date(),
  completedAt: z.date().optional(),
  tags: z.array(z.string()),
});
```

## 4. タスク作成ファクトリ関数

タスクを作成するためのファクトリ関数は、バリデーションと適切なデフォルト値の設定を行います：

```typescript
export function createTask(params: CreateTaskParams): Task {
  // パラメータのバリデーション - Zodスキーマを使用
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

## 5. 実装の特徴

### 5.1 型安全性

- **ブランド型**: TaskId にブランド型を使用して型安全性を確保
- **明確なインターフェース**: すべてのエンティティと値オブジェクトに明確な型定義
- **Zod による実行時バリデーション**: コンパイル時の型チェックに加えて実行時バリデーション

### 5.2 不変性と副作用の制限

- **イミュータブルなデータ構造**: オブジェクトの変更ではなく新しいオブジェクトを生成
- **純粋関数**: 副作用を限定したファクトリ関数

### 5.3 テスト容易性

- **依存性の最小化**: 外部依存を最小限に抑えた設計
- **明確なインターフェース**: テストしやすい API の提供
- **バリデーションの分離**: ビジネスロジックとバリデーションの関心の分離

## 6. テスト戦略

タスク管理ドメインは以下のテスト戦略によって品質を確保しています：

### 6.1 単体テスト

- **ファクトリ関数のテスト**: 正常系と異常系のテストケース
- **バリデーションルールのテスト**: 境界値テストと不正値テスト

### 6.2 カバレッジ

現在、以下のカバレッジを達成しています：

- **ステートメントカバレッジ**: 96.55%
- **ブランチカバレッジ**: 55.55%
- **関数カバレッジ**: 75%
- **行カバレッジ**: 96.55%

## 7. 今後の発展

タスク管理ドメインは以下の方向で発展させることができます：

- **タスクコレクション管理**: タスクのコレクションを管理するリポジトリの実装
- **タスク操作コマンド**: タスクの更新、削除などの操作を行うコマンド関数
- **タスククエリ機能**: タスクの検索、フィルタリング機能
- **タスク間の関係**: 依存関係や優先順位付けなどの関係性の実装

## 8. 参考資料

- **ドメインモデル設計ドキュメント**: `docs/design/domain-model.md`
- **アーキテクチャドキュメント**: `docs/design/architecture.md`
- **テスト戦略ドキュメント**: `docs/design/test-strategy.md`
