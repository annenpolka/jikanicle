# Zod の infer を使った型定義とスキーマ統合

## 更新履歴

| 日付       | 更新者     | 変更内容                                                           |
| ---------- | ---------- | ------------------------------------------------------------------ |
| 2025-03-08 | 開発チーム | 初版作成                                                           |
| 2025-03-09 | 開発チーム | 型定義とスキーマの使い分け方針、再エクスポートについての方針を追加 |

## 概要

このドキュメントでは、Zod の`infer`機能を使って型定義とバリデーションスキーマを統合する手法について解説します。この手法により、TypeScript の型システムとランタイムのバリデーションを一元管理し、より堅牢なドメインモデルを実現することができます。

関連ドキュメント:

- [ドメインモデル定義](../design/domain-model.md)
- [タスク管理ドメイン設計決定記録](./task-domain-adr.md)

## 背景

従来のアプローチでは、型定義（Interfaces/Types）とバリデーションスキーマ（Zod）が別々に管理されており、以下の問題がありました：

- 型とスキーマの間で定義の不一致が発生する可能性
- 型またはスキーマの一方を変更した際に、もう一方の更新を忘れるリスク
- 冗長なコードによるメンテナンスコストの増加

## 採用した解決策

Zod の`infer`型ユーティリティを使用して、スキーマから直接型を導出する方法を採用しました。主な変更点は以下の通りです：

### 1. スキーマファイル（`src/domain/schemas/task-schema.ts`）の修正

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

### 2. 型定義ファイル（`src/domain/types/Task.ts`）の簡素化

```typescript
/**
 * タスク管理コンテキストの型定義
 *
 * 注意: この型定義ファイルはスキーマファイルから再エクスポートされた型を使用します。
 * 型定義とバリデーションが統一されています。
 */

// schemaから型を再エクスポート
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

## メリット

1. **定義の一元管理**

   - 型定義とバリデーションスキーマが単一の情報源から生成される
   - スキーマの変更が自動的に型定義に反映される

2. **型安全性の向上**

   - スキーマと型が完全に同期するため、型の不一致によるバグのリスクが低減
   - 開発時の型チェックとランタイムのバリデーションが一貫している

3. **開発効率の向上**

   - 同じ定義を複数の場所で管理する必要がなくなる
   - ドメインモデルの変更がより迅速かつ安全に行える

4. **コードの可読性向上**
   - 定義が単一の場所にあるため、コードベースが理解しやすくなる
   - 新しいチームメンバーのオンボーディングが容易になる

## 実装上の注意点

1. **循環参照の回避**

   - スキーマファイルが型定義ファイルをインポートしないようにする
   - 型はスキーマから生成し、型定義ファイルはそれらを再エクスポートする

2. **ブランド型のサポート**

   - Zod の`.brand<T>()`メソッドを使用してブランド型をサポート

   ```typescript
   export const taskIdSchema = z.string().min(1).brand<'TaskId'>();
   ```

3. **下位互換性の維持**
   - 既存のコードとの互換性のため、古い型名も維持
   ```typescript
   export type TaskSchema = Task;
   export type CreateTaskParamsSchema = CreateTaskParams;
   ```

## 使用例

スキーマと型が統合されたことにより、以下のようなコードが可能になります：

```typescript
import {
  createTaskParamsSchema,
  validateTask,
  Task,
} from '../domain/schemas/task-schema';

// 入力の検証と型付け（同時に実現）
const validInput = createTaskParamsSchema.parse(userInput);

// ファクトリ関数での使用
function createTask(params: CreateTaskParams): Task {
  // パラメータは既に型が付いていて、実行時にも検証される
  const validParams = validateCreateTaskParams(params);
  // ...タスク作成ロジック...
}
```

## 型定義とスキーマの使い分け方針

すべての型を Zod スキーマから生成すべきか、それとも一部は従来の型定義を使うべきかという判断基準をまとめました。

### Zod スキーマから型を生成すべき場合

1. **バリデーションが必要なデータ**

   - ユーザー入力
   - API 経由で受け取るデータ
   - 永続化されるエンティティ
   - ドメインのコアとなる値オブジェクト

2. **ビジネスルールが含まれるもの**

   - 複雑な制約条件がある
   - ドメイン固有のバリデーションロジックを含む

3. **型と実行時の検証を一致させたいケース**
   - タイプセーフティとランタイムの安全性の両方が重要な場合

### 従来の型定義を使うべき場合

1. **内部実装の詳細**

   - アプリケーション内部でのみ使われる補助的な型
   - フレームワーク固有の型

2. **複雑なユーティリティ型**

   - 既存の型の変換や合成に基づく型
   - ジェネリック型パラメータを多用する複雑な型

3. **パフォーマンスが重要な場所**
   - 頻繁に呼び出される関数のパラメータ型
   - ホットパス上でのバリデーションが不要な場合

## 再エクスポートについての方針

本プロジェクトでは、スキーマから生成した型を型定義ファイル（`src/domain/types/Task.ts`）から再エクスポートする方針を採用しています。

### 再エクスポートを採用する理由

1. **既存コードとの互換性**

   - `Task.ts`からインポートしている既存のコードを変更せずに済む
   - リファクタリングのリスクと労力を大幅に削減できる

2. **関心の分離**

   - `types/`ディレクトリは型の参照元として明確な役割を持つ
   - `schemas/`ディレクトリはバリデーションの実装詳細に集中できる

3. **抽象化レイヤーの提供**

   - 将来的にスキーマの実装方法が変わっても、インポートパスを変更する必要がない
   - 型のソースを変えても使用側のコードには影響しない

4. **DDD アーキテクチャとの整合性**
   - ドメイン層での型とスキーマの概念的な区別を維持
   - 各ディレクトリの役割と責任が明確

### 再エクスポートのベストプラクティス

1. **明確なコメント**

   - 型定義ファイルには再エクスポートであることを明示
   - スキーマから型が生成されていることを記載

2. **一貫性のある適用**
   - すべてのドメインモデルに同じパターンを適用
   - 型のインポート先を統一（`types/`ディレクトリから）

## 実装のヒント

### サブスキーマの活用

```typescript
// 共通部分をサブスキーマとして定義
const userBaseSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1),
  email: z.string().email(),
});

// 作成時用のスキーマ
export const createUserSchema = userBaseSchema.omit({ id: true });

// 更新時用のスキーマ
export const updateUserSchema = userBaseSchema.partial();

// 型の定義
export type UserBase = z.infer<typeof userBaseSchema>;
export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
```

### 循環参照を扱う方法

```typescript
// 循環参照のあるスキーマを定義する場合
export const treeNodeSchema = z.object({
  id: z.string(),
  name: z.string(),
  // 循環参照にはz.lazyを使用
  children: z.array(z.lazy(() => treeNodeSchema)).default([]),
});

export type TreeNode = z.infer<typeof treeNodeSchema>;
```

## 今後の拡張

1. **他のドメインオブジェクトへの適用**

   - 同様のアプローチを他のドメインエンティティにも適用する

2. **DTO との統合**

   - API リクエスト/レスポンス DTO も Zod スキーマから型を生成する

3. **テスト強化**
   - プロパティベースのテストでより多くのエッジケースを検証する

## 結論

Zod の`infer`を使用した型定義とスキーマの統合は、コードの品質と開発効率を向上させる効果的な手法です。再エクスポートアプローチを採用することで、既存コードとの互換性を保ちながら、型とバリデーションの一元管理を実現できます。この方針に沿って開発を進めることで、より堅牢なドメインモデルを維持しながら、タイプミスやスキーマと型の不一致によるバグを減らすことができます。
