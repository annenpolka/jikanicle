# タスク管理ドメイン実装詳細

## 更新履歴

| 日付 | 更新者 | 内容 |
|------|--------|------|
| 2025-03-10 | 開発チーム | 既存実装ドキュメントの統合によるタスクドメイン実装詳細ドキュメント作成 |

## 1. 関連ドキュメント

- [タスク管理ドメイン設計](./design.md)
- [タスク管理ドメインステータス](./status.md)
- [Zodスキーマ実装方針](../../guidelines/technical/zod-schema-implementation.md)

## 2. 実装概要

タスク管理ドメインはDDDの原則に従って設計されており、以下の要素で構成されています：

1. エンティティと値オブジェクト
2. ファクトリ関数
3. コマンド関数
4. リポジトリ

この実装では、TypeScriptの型システムを活用した型安全な設計とZodによるバリデーションを組み合わせることで、ドメインの整合性を確保しています。

## 3. 型定義とスキーマ

タスク管理ドメインでは、型定義とバリデーションスキーマを統合するためにZodを使用しています。

### 3.1 基本型定義（src/domain/types/Task.ts）

```typescript
// 列挙型
export enum Category {
  WORK = "WORK",
  PERSONAL_DEV = "PERSONAL_DEV",
  HOUSEHOLD = "HOUSEHOLD",
  LEARNING = "LEARNING",
  OTHER = "OTHER"
}

export enum TaskStatus {
  NOT_STARTED = "NOT_STARTED",
  IN_PROGRESS = "IN_PROGRESS",
  COMPLETED = "COMPLETED",
  CANCELLED = "CANCELLED"
}

export enum Priority {
  LOW = "LOW",
  MEDIUM = "MEDIUM",
  HIGH = "HIGH"
}

// タスクID型（ブランド型）
export type TaskId = string & { readonly _brand: unique symbol };

// タグ型
export type Tag = {
  name: string;
};

// タスク型
export type Task = {
  id: TaskId;
  name: string;
  description: string;
  category: Category;
  status: TaskStatus;
  priority: Priority;
  estimatedMinutes: number;
  tags: Tag[];
  createdAt: Date;
  updatedAt: Date;
  completedAt: Date | null;
};
```

### 3.2 スキーマ定義（src/domain/schemas/task-schema.ts）

```typescript
import { z } from "zod";
import { Category, Priority, TaskStatus } from "../types/Task";

// タグのスキーマ
export const tagSchema = z.object({
  name: z.string().min(1).max(20)
});

// タスク作成のスキーマ
export const createTaskSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().optional().default(""),
  category: z.nativeEnum(Category),
  priority: z.nativeEnum(Priority).optional().default(Priority.MEDIUM),
  estimatedMinutes: z.number().min(0),
  tags: z.array(tagSchema).optional().default([])
});

// 型の導出
export type CreateTaskInput = z.infer<typeof createTaskSchema>;
```

## 4. ファクトリ関数

### 4.1 タスク作成ファクトリ（src/domain/factories/task-factory.ts）

```typescript
import { Result, ok, err } from "neverthrow";
import { v4 as uuidv4 } from "uuid";
import { CreateTaskInput, createTaskSchema } from "../schemas/task-schema";
import { Task, TaskId, TaskStatus } from "../types/Task";

type CreateTaskError = {
  message: string;
  errors?: Record<string, string[]>;
};

export function createTask(input: CreateTaskInput): Result<Task, CreateTaskError> {
  // バリデーション
  const result = createTaskSchema.safeParse(input);
  if (!result.success) {
    return err({
      message: "タスク作成に失敗しました",
      errors: result.error.format()
    });
  }

  const validatedInput = result.data;
  const now = new Date();

  // タスクの作成
  const task: Task = {
    id: uuidv4() as TaskId,
    name: validatedInput.name,
    description: validatedInput.description || "",
    category: validatedInput.category,
    status: TaskStatus.NOT_STARTED,
    priority: validatedInput.priority,
    estimatedMinutes: validatedInput.estimatedMinutes,
    tags: validatedInput.tags || [],
    createdAt: now,
    updatedAt: now,
    completedAt: null
  };

  return ok(task);
}
```

### 4.2 タスク更新ファクトリ（src/domain/factories/update-task.ts）

```typescript
import { Result, ok, err } from "neverthrow";
import { Task, TaskStatus } from "../types/Task";
import { updateTaskSchema, UpdateTaskInput } from "../schemas/update-task-schema";

type UpdateTaskError = {
  message: string;
  errors?: Record<string, string[]>;
};

export function updateTask(
  task: Task,
  updates: UpdateTaskInput
): Result<Task, UpdateTaskError> {
  // バリデーション
  const result = updateTaskSchema.safeParse(updates);
  if (!result.success) {
    return err({
      message: "タスク更新に失敗しました",
      errors: result.error.format()
    });
  }

  const validatedUpdates = result.data;
  const now = new Date();

  // 完了状態への変更を検出
  const isCompletingTask =
    validatedUpdates.status === TaskStatus.COMPLETED &&
    task.status !== TaskStatus.COMPLETED;

  // 更新されたタスクを作成
  const updatedTask: Task = {
    ...task,
    ...validatedUpdates,
    updatedAt: now,
    // 完了状態になった場合、completedAtを設定
    completedAt: isCompletingTask ? now : task.completedAt
  };

  return ok(updatedTask);
}
```

## 5. コマンド関数

### 5.1 タスク削除コマンド（src/domain/commands/delete-task.ts）

```typescript
import { Result, ok, err } from "neverthrow";
import { TaskId } from "../types/Task";
import { TaskRepository } from "../../application/repositories/task-repository";

type DeleteTaskError = {
  message: string;
  cause?: unknown;
};

export async function deleteTask(
  taskId: TaskId,
  repository: TaskRepository
): Promise<Result<void, DeleteTaskError>> {
  try {
    // タスクの存在確認
    const taskResult = await repository.findById(taskId);
    if (taskResult.isErr()) {
      return err({
        message: `タスク（ID: ${taskId}）が見つかりません`,
        cause: taskResult.error
      });
    }

    // タスクの削除
    const deleteResult = await repository.delete(taskId);
    if (deleteResult.isErr()) {
      return err({
        message: `タスク（ID: ${taskId}）の削除に失敗しました`,
        cause: deleteResult.error
      });
    }

    return ok(undefined);
  } catch (error) {
    return err({
      message: "タスク削除中に予期しないエラーが発生しました",
      cause: error
    });
  }
}
```

## 6. リポジトリ

### 6.1 リポジトリインターフェース（src/application/repositories/task-repository.ts）

```typescript
import { Result } from "neverthrow";
import { Task, TaskId } from "../../domain/types/Task";

export type FindOptions = {
  category?: Task["category"];
  status?: Task["status"];
  priority?: Task["priority"];
  tags?: string[];
};

export type RepositoryError = {
  message: string;
  cause?: unknown;
};

export interface TaskRepository {
  save(task: Task): Promise<Result<Task, RepositoryError>>;
  findById(id: TaskId): Promise<Result<Task, RepositoryError>>;
  findAll(options?: FindOptions): Promise<Result<Task[], RepositoryError>>;
  delete(id: TaskId): Promise<Result<void, RepositoryError>>;
}
```

### 6.2 インメモリリポジトリ実装（src/infrastructure/repositories/in-memory-task-repository.ts）

```typescript
import { Result, ok, err } from "neverthrow";
import { Task, TaskId } from "../../domain/types/Task";
import { FindOptions, RepositoryError, TaskRepository } from "../../application/repositories/task-repository";

export class InMemoryTaskRepository implements TaskRepository {
  private tasks: Map<string, Task> = new Map();

  async save(task: Task): Promise<Result<Task, RepositoryError>> {
    try {
      this.tasks.set(task.id, { ...task });
      return ok(task);
    } catch (error) {
      return err({
        message: `タスクの保存に失敗しました: ${error instanceof Error ? error.message : String(error)}`,
        cause: error
      });
    }
  }

  async findById(id: TaskId): Promise<Result<Task, RepositoryError>> {
    try {
      const task = this.tasks.get(id);
      if (!task) {
        return err({
          message: `ID: ${id} のタスクが見つかりません`
        });
      }
      return ok({ ...task });
    } catch (error) {
      return err({
        message: `タスクの検索中にエラーが発生しました: ${error instanceof Error ? error.message : String(error)}`,
        cause: error
      });
    }
  }

  async findAll(options?: FindOptions): Promise<Result<Task[], RepositoryError>> {
    try {
      let tasks = Array.from(this.tasks.values()).map(task => ({ ...task }));

      // フィルタリング
      if (options) {
        if (options.category) {
          tasks = tasks.filter(task => task.category === options.category);
        }
        if (options.status) {
          tasks = tasks.filter(task => task.status === options.status);
        }
        if (options.priority) {
          tasks = tasks.filter(task => task.priority === options.priority);
        }
        if (options.tags && options.tags.length > 0) {
          tasks = tasks.filter(task =>
            options.tags!.some(tag =>
              task.tags.some(taskTag => taskTag.name === tag)
            )
          );
        }
      }

      return ok(tasks);
    } catch (error) {
      return err({
        message: `タスクの検索中にエラーが発生しました: ${error instanceof Error ? error.message : String(error)}`,
        cause: error
      });
    }
  }

  async delete(id: TaskId): Promise<Result<void, RepositoryError>> {
    try {
      const exists = this.tasks.has(id);
      if (!exists) {
        return err({
          message: `ID: ${id} のタスクが見つかりません`
        });
      }
      this.tasks.delete(id);
      return ok(undefined);
    } catch (error) {
      return err({
        message: `タスクの削除中にエラーが発生しました: ${error instanceof Error ? error.message : String(error)}`,
        cause: error
      });
    }
  }
}
```

## 7. テスト戦略

タスク管理ドメインでは以下のテスト戦略を採用しています：

### 7.1 ユニットテスト

- ファクトリ関数のテスト：入力バリデーションと出力の検証
- コマンド関数のテスト：モックリポジトリを使用した動作検証
- 型の整合性テスト：型定義の検証

### 7.2 統合テスト

- リポジトリの実装テスト：永続化と検索機能のテスト
- エンドツーエンドのユースケーステスト：タスクの作成から削除までの流れ

### 7.3 プロパティテスト

- 境界値テスト：極端な入力値での動作確認
- ランダム入力テスト：様々な入力パターンでの動作確認

## 8. 今後の実装予定

1. **永続化リポジトリの実装**
   - ファイルベースの永続化機構
   - JSONシリアライズ/デシリアライズ
   - エラーハンドリングの強化

2. **検索機能の強化**
   - 複合条件検索
   - ソート機能
   - ページネーション

3. **アプリケーションサービス層の実装**
   - ユースケース定義
   - トランザクション管理
   - イベント発行

## 関連ドキュメント

- [プロジェクトロードマップ](../../project/roadmap.md)
- [タスク管理ドメイン設計](./design.md)
- [タスク管理ドメインステータス](./status.md)