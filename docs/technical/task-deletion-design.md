# タスク削除機能の設計詳細

## 1. 概要

タスク削除機能は、タスク管理システムにおいて不要になったタスクを完全に削除するための機能です。ADRで決定した通り、物理削除方式を採用し、データストアからタスクを完全に削除します。

## 2. ドメインモデルにおける位置づけ

タスク削除は、タスク集約のライフサイクル管理の一部として位置づけられます。タスク集約のルートエンティティであるTaskに対する操作として、そのライフサイクルを終了させる重要な操作です。

```
タスク集約
  ├── 作成 (create)
  ├── 更新 (update)
  └── 削除 (delete) ← 今回実装する機能
```

## 3. 関数インターフェース設計

```typescript
function deleteTask(
  taskId: TaskId,
  repository: TaskRepository
): Promise<Result<void, DeleteTaskError>>
```

### パラメータ

- `taskId`: 削除対象のタスクID（TaskId型）
- `repository`: タスクリポジトリ（TaskRepository型）

### 戻り値

- 成功時: `ok(undefined)` - 削除成功を表す
- 失敗時: `err(DeleteTaskError)` - 削除失敗の理由を表すエラーオブジェクト

## 4. エラー型設計

```typescript
export type DeleteTaskError =
  | { type: 'TASK_NOT_FOUND'; message: string }
  | { type: 'REPOSITORY_ERROR'; message: string; cause?: unknown }
  | { type: 'DELETION_FORBIDDEN'; message: string; reason: string };
```

### エラー種別

1. `TASK_NOT_FOUND`: 指定されたIDのタスクが存在しない
2. `REPOSITORY_ERROR`: リポジトリ操作中のエラー（データストアの問題など）
3. `DELETION_FORBIDDEN`: ドメインルールによって削除が禁止されている

## 5. ドメインルール

タスク削除に関するドメインルールを以下のように定義します：

1. **存在確認**: 削除対象のタスクが存在する必要がある
2. **削除権限**: （将来的な拡張として）タスクの所有者のみが削除可能
3. **状態制約**: 特定の状態のタスクは削除できない可能性（例：進行中のタスク）

現時点では、テストコードから判断すると、存在確認のみが実装されており、他の制約は適用されていません。将来的な拡張性を考慮して、ドメインルールを追加できる設計にします。

## 6. 処理フロー

```
1. タスクの存在確認
   ├── 存在しない場合 → TASK_NOT_FOUND エラーを返す
   └── 存在する場合 → 次のステップへ
2. ドメインルールの検証
   ├── ルール違反がある場合 → DELETION_FORBIDDEN エラーを返す
   └── ルール違反がない場合 → 次のステップへ
3. リポジトリを通じてタスクを削除
   ├── 削除成功 → ok(undefined) を返す
   └── 削除失敗 → REPOSITORY_ERROR エラーを返す
```

## 7. 実装戦略

1. **関数型アプローチ**: 純粋関数として実装し、副作用はリポジトリに閉じ込める
2. **早期リターン**: エラーケースは早期にリターンし、ネストを避ける
3. **依存性の注入**: リポジトリを引数として受け取り、テスト容易性を確保
4. **Result型の活用**: 成功/失敗を明示的に型で表現し、呼び出し側での適切なハンドリングを促す

## 8. 型の階層と関係

```
TaskId (ブランド型) ──┐
                     │
                     ↓
deleteTask ────→ TaskRepository ────→ Result<void, DeleteTaskError>
                     ↑
                     │
         TaskRepositoryError ───┘
```

## 9. 拡張性の考慮

1. **ソフトデリート対応**: 将来的にソフトデリート（論理削除）に変更する場合は、リポジトリの実装を変更するだけで対応可能
2. **削除条件の追加**: 新たなドメインルールが追加された場合、validateDeletionRules関数を拡張することで対応
3. **監査ログ対応**: 削除操作の記録が必要になった場合、イベント発行の仕組みを追加可能

## 10. 実装コード概要

```typescript
export async function deleteTask(
  taskId: TaskId,
  repository: TaskRepository
): Promise<Result<void, DeleteTaskError>> {
  // 1. タスクの存在確認
  const taskResult = await repository.findById(taskId);
  if (taskResult.isErr()) {
    if (taskResult.error.type === 'NOT_FOUND') {
      return err({
        type: 'TASK_NOT_FOUND',
        message: taskResult.error.message
      });
    }
    return err({
      type: 'REPOSITORY_ERROR',
      message: 'タスクの検索中にエラーが発生しました',
      cause: taskResult.error
    });
  }

  // 2. ドメインルールの検証（将来的な拡張ポイント）
  // const task = taskResult.value;
  // const validationResult = validateDeletionRules(task);
  // if (validationResult.isErr()) {
  //   return validationResult;
  // }

  // 3. タスクの削除
  const deleteResult = await repository.delete(taskId);
  if (deleteResult.isErr()) {
    return err({
      type: 'REPOSITORY_ERROR',
      message: deleteResult.error.message,
      cause: deleteResult.error.cause
    });
  }

  return ok(undefined);
}
```

## 11. テスト戦略

1. **ユニットテスト**: deleteTask関数の単体テスト（モックリポジトリを使用）
   - 正常系: 存在するタスクの削除成功
   - 異常系: 存在しないタスク、リポジトリエラー

2. **統合テスト**: インメモリリポジトリを使用した統合テスト
   - リポジトリとの連携が正しく動作することを確認

3. **将来的なテスト拡張**:
   - ドメインルールが追加された場合のテストケース追加
   - パフォーマンステスト（大量データ時の挙動）

## 12. 結論

タスク削除機能は、シンプルながらも拡張性を考慮した設計とします。現時点では基本的な削除機能のみを実装し、将来的なドメインルールの追加に備えた拡張ポイントを用意します。Result型を活用したエラーハンドリングにより、呼び出し側での適切な対応を促進します。