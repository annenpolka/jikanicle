# タスク更新機能の設計レビュー

## 現在の設計状況

タスク更新機能の実装において、以下のステップを完了しています：
- ドキュメント作成: `docs/technical/task-update-implementation.md`
- テストファイル作成: `test/domain/factories/update-task.test.ts`

実装ファイル `src/domain/factories/update-task.ts` はこれから作成する予定です。

## ドメインモデルの観点からの検討

### 1. 集約としてのタスク

タスクは集約ルートとして機能しており、その整合性を保つ必要があります。更新操作は以下の特性を持つべきです：

- **不変性の原則**: 既存のタスクオブジェクトを変更せず、新しいオブジェクトを返す
- **整合性ルール**: タスクの状態変更時（特に完了状態への移行）には、関連する属性（completedAt）も適切に更新する

### 2. ドメインルールの明示化

現在のテストでは以下のドメインルールが暗黙的に表現されています：

- タスクが完了状態に変更された場合、completedAtを現在時刻に設定
- タスクが完了状態から他の状態に変更された場合、completedAtをundefinedに設定

これらのルールをより明示的にドキュメント化し、コード内でも明確にコメントすべきです。

## 型設計の再検討

### 1. 更新パラメータの型定義

現在の設計では `taskSchema.partial()` を使用して部分更新をサポートしています。これは基本的に適切ですが、以下の点を考慮すべきです：

- **IDの不変性**: タスクIDは更新できないようにすべきか？
- **createdAtの不変性**: 作成日時は更新できないようにすべきか？

```typescript
// 改善案: 更新不可フィールドを除外した型定義
export const updateTaskParamsSchema = taskSchema
  .omit({ id: true, createdAt: true })
  .partial();
```

### 2. エラー型の詳細化

現在のエラー型は基本的なケースをカバーしていますが、より具体的なエラーケースを追加することを検討します：

```typescript
export type UpdateTaskError =
  | { type: 'VALIDATION_ERROR'; message: string; errors: Record<string, string[]> }
  | { type: 'TASK_NOT_FOUND'; message: string }
  | { type: 'INVALID_STATUS_TRANSITION'; message: string }
  | { type: 'IMMUTABLE_FIELD_MODIFICATION'; message: string; field: string }; // 追加
```

## テスト戦略の評価

現在のテストは以下のカテゴリをカバーしています：
- 基本的な部分更新
- ステータス変更時の特殊処理
- バリデーション
- 不変性
- エッジケース

これらは網羅的ですが、以下の追加テストを検討すべきです：

1. **不正な状態遷移のテスト**: 特定の状態からの遷移が禁止されているケース（もし存在するなら）
2. **ビジネスルール検証**: タスクのドメイン固有のルールに関するテスト

## 実装アプローチの改善案

### 1. ドメインルールの集約

状態遷移ルールを明示的な関数として抽出することで、ドメインルールを明確にし、再利用性を高めることができます：

```typescript
/**
 * タスクの状態遷移に関するルールを適用する関数
 * @param currentStatus 現在のタスク状態
 * @param newStatus 新しいタスク状態（未指定の場合は変更なし）
 * @param currentCompletedAt 現在の完了日時
 * @returns 更新された完了日時情報
 */
function handleStatusTransition(
  currentStatus: TaskStatus,
  newStatus: TaskStatus | undefined,
  currentCompletedAt?: Date
): { completedAt?: Date } {
  // 状態が変更されない場合は現在の完了日時を維持
  if (!newStatus || newStatus === currentStatus) {
    return { completedAt: currentCompletedAt };
  }

  // 完了状態への変更: 完了日時を設定
  if (newStatus === 'COMPLETED') {
    return { completedAt: new Date() };
  }

  // 完了状態からの変更: 完了日時をクリア
  if (currentStatus === 'COMPLETED') {
    return { completedAt: undefined };
  }

  // その他の状態変更: 完了日時は変更なし
  return { completedAt: currentCompletedAt };
}
```

### 2. バリデーション戦略の明確化

バリデーションを2段階に分けることで、関心事を分離し、エラーメッセージをより具体的にできます：

1. **スキーマバリデーション**: 入力値の構造と型の検証
2. **ドメインルールバリデーション**: ビジネスルールに基づく検証

```typescript
/**
 * 更新パラメータのスキーマバリデーション
 */
function validateUpdateParams(params: unknown): Result<UpdateTaskParams, UpdateTaskError> {
  try {
    const validParams = updateTaskParamsSchema.parse(params);
    return ok(validParams);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return err({
        type: 'VALIDATION_ERROR',
        message: 'タスク更新パラメータが無効です',
        errors: error.format() as Record<string, string[]>
      });
    }
    return err({
      type: 'VALIDATION_ERROR',
      message: '予期しないバリデーションエラー',
      errors: { _: ['不明なエラー'] }
    });
  }
}

/**
 * ドメインルールに基づくバリデーション
 */
function validateDomainRules(
  task: Task,
  params: UpdateTaskParams
): Result<void, UpdateTaskError> {
  // 例: 特定の状態遷移の禁止
  if (
    task.status === 'CANCELLED' &&
    params.status &&
    params.status !== 'CANCELLED'
  ) {
    return err({
      type: 'INVALID_STATUS_TRANSITION',
      message: 'キャンセルされたタスクは再開できません'
    });
  }

  // 他のドメインルール検証...

  return ok(undefined);
}
```

### 3. 不変フィールドの保護

更新できないフィールドを明示的に保護するロジックを追加します：

```typescript
/**
 * 不変フィールドの変更をチェックする関数
 */
function checkImmutableFields(
  task: Task,
  params: UpdateTaskParams
): Result<void, UpdateTaskError> {
  // IDの変更チェック
  if (params.id && params.id !== task.id) {
    return err({
      type: 'IMMUTABLE_FIELD_MODIFICATION',
      message: 'タスクIDは変更できません',
      field: 'id'
    });
  }

  // 作成日時の変更チェック
  if (params.createdAt && params.createdAt.getTime() !== task.createdAt.getTime()) {
    return err({
      type: 'IMMUTABLE_FIELD_MODIFICATION',
      message: '作成日時は変更できません',
      field: 'createdAt'
    });
  }

  return ok(undefined);
}
```

## 設計上の決定事項

以上の検討を踏まえ、以下の設計決定を行います：

1. **不変フィールドの定義**:
   - `id`: タスクの識別子は作成後に変更不可
   - `createdAt`: 作成日時は変更不可

2. **自動更新フィールド**:
   - `updatedAt`: 更新時に常に現在時刻に更新
   - `completedAt`: タスクの状態に応じて自動的に設定/クリア

3. **エラー処理戦略**:
   - 詳細なエラー型を定義し、クライアントが適切に対応できるようにする
   - バリデーションエラーには具体的なフィールド情報を含める

4. **関数分割戦略**:
   - 単一責任の原則に従い、検証と更新ロジックを分離
   - ドメインルールを明示的な関数として抽出

## 次のステップ

1. 上記の設計決定に基づいて `src/domain/factories/update-task.ts` を実装
2. 必要に応じてテストケースを追加・修正
3. ドキュメントを更新して設計判断を明確に記録

これらの改善を取り入れることで、より堅牢で保守性の高いタスク更新機能を実装できると考えます。