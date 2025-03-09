# タスク更新機能の実装詳細

## 実装の概要

タスク更新機能は、既存のタスクの情報を更新するためのドメインロジックを提供します。この機能は関数型アプローチに基づいて設計され、不変性と型安全性を重視しています。

## 主要な機能

- 部分更新をサポート (Partial型の活用)
- 既存タスクを変更せず新しいタスクオブジェクトを返す (不変性の原則)
- ステータス変更時の特別な振る舞い (完了日時の自動設定など)
- Zodスキーマによる入力検証
- Result型によるエラーハンドリング

## 型定義とインターフェース

### 更新パラメータスキーマ

```typescript
// タスク更新パラメータ (部分更新をサポート)
export const updateTaskParamsSchema = taskSchema.partial();
export type UpdateTaskParams = z.infer<typeof updateTaskParamsSchema>;

// タスク更新エラー型
export type UpdateTaskError =
  | { type: 'VALIDATION_ERROR'; message: string; errors: Record<string, string[]> }
  | { type: 'TASK_NOT_FOUND'; message: string }
  | { type: 'INVALID_STATUS_TRANSITION'; message: string };
```

### 更新ファクトリ関数インターフェース

```typescript
export function updateTask(
  task: Task,
  params: UpdateTaskParams
): Result<Task, UpdateTaskError>;
```

## 主要なロジックとアルゴリズム

1. **パラメータ検証**:
   - Zodスキーマを使用した更新パラメータの検証
   - 無効な値は早期にエラーとして返す

2. **タスク更新ロジック**:
   - 不変性を保つために元のタスクをコピー
   - 渡されたパラメータのみを更新
   - updatedAtを現在時刻に更新

3. **ステータス変更時の特殊処理**:
   - ステータスが 'COMPLETED' に変更された場合、completedAtを現在時刻に設定
   - ステータスが 'COMPLETED' から他のステータスに変更された場合、completedAtをundefinedに設定

4. **エラーハンドリング**:
   - バリデーションエラー
   - 状態遷移の整合性チェック

## テスト戦略

1. **基本的な部分更新テスト**:
   - 名前のみ更新
   - 説明のみ更新
   - 複数フィールド更新

2. **ステータス変更テスト**:
   - 未完了 → 完了: completedAtが設定されることを確認
   - 完了 → 未完了: completedAtが削除されることを確認

3. **エラーケーステスト**:
   - 不正な値による更新の試行
   - 空更新パラメータ（何も変更されない）

4. **不変性テスト**:
   - 元のオブジェクトが変更されていないことを確認

## 更新履歴

| 日付 | 変更内容 | 担当者 |
|------|---------|-------|
| 2025/3/9 | 初版作成 | - |