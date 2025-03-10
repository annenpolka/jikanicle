# ESLintルールと設計バランスの実装

## 概要

このドキュメントでは、jikanicleプロジェクトにおけるESLintルールと設計のバランスについて検討します。特に関数型プログラミングのルールと型安全性に関するルールを中心に、既存の実装との整合性を分析し、改善案を提示します。

## 背景

jikanicleプロジェクトでは、以下のESLintルールを採用しています：

1. 型安全性の強化
   - 明示的な関数の戻り値型の指定
   - anyの使用禁止
   - 厳格な型チェック

2. 関数型プログラミングの促進
   - letの使用禁止（constのみ）
   - 読み取り専用型の推奨
   - データの不変性の確保
   - 純粋関数の促進（一部緩和あり）

3. コード品質の向上
   - 命名規則の厳格化
   - インポート順序の規定
   - JSDocコメントの要求

これらのルールは、コードの品質と保守性を高めるために重要ですが、一部の実装パターンでは厳格なルールとのバランスをとる必要があります。

## 現状分析

### 1. リポジトリパターンと関数型プログラミング

インメモリタスクリポジトリの実装では、関数型プログラミングのアプローチを採用していますが、リポジトリパターンの性質上、完全に純粋関数のみで実装することは難しい状況があります：

```typescript
// eslint-disable-next-line functional/no-let
let state = initialState;
```

このような妥協点は、実装の現実的な要件とESLintルールのバランスをとるために必要です。

### 2. 型安全性と不変性

タスク更新の実装では、型安全性と不変性を確保するために以下のパターンが使用されています：

```typescript
// 不変性を維持するためにディープコピーを作成
const taskToSave: Task = { ...task };
```

このパターンは、ESLintの関数型プログラミングルール（特に`functional/immutable-data`）に合致しています。

### 3. エラーハンドリング

Result型を使用したエラーハンドリングは、型安全性を確保しながら例外処理を行うための優れたアプローチです：

```typescript
return err({
  type: 'TASK_NOT_FOUND',
  message: `タスクID: ${id} は見つかりませんでした`
});
```

## 改善案

### 1. readonlyの修飾子問題（functional/prefer-readonly-type）

`src/application/repositories/task-repository.ts`ファイルでは、型定義に`readonly`修飾子を追加することで、不変性をさらに強化できます：

```typescript
export type TaskRepositoryError =
  | { readonly type: 'NOT_FOUND'; readonly message: string }
  | { readonly type: 'ALREADY_EXISTS'; readonly message: string }
  | { readonly type: 'STORAGE_ERROR'; readonly message: string; readonly cause?: unknown }
  | { readonly type: 'VALIDATION_ERROR'; readonly message: string; readonly errors: Record<string, readonly string[]> }
  | { readonly type: 'CONCURRENCY_ERROR'; readonly message: string };
```

### 2. 不要な条件チェック（@typescript-eslint/no-unnecessary-condition）

`src/domain/factories/update-task.ts`ファイルでは、型解析に基づいて不要な条件チェックを最適化できます：

```typescript
// 重複したチェックの最適化
// validateDomainRulesとupdateTask関数で同じチェックが行われている
```

## 実装戦略

1. **段階的な改善**: 一度にすべての問題を修正するのではなく、優先度の高い問題から段階的に対応する
2. **テスト駆動**: 修正前にテストを実行し、修正後も同じテストが通ることを確認する
3. **ドキュメント更新**: コード変更と同時にドキュメントも更新する

## テスト戦略

1. 既存のテストケースを使用して、修正がアプリケーションの動作に影響を与えないことを確認
2. 特に以下の点をテストで検証：
   - タスクリポジトリの操作が正常に機能すること
   - タスク更新処理でのバリデーションが正しく動作すること

## 更新履歴

- 2025-03-09: 初版作成