# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## プロジェクト概要

Jikanicleは、AIによる所要時間の予測とカテゴリ分類を活用したタイムブロッキングTUIアプリケーションです。ユーザーがタスクを入力すると、AIが最適なタイムブロックを自動生成し、実作業の時間計測により効率的なタイムマネジメントを実現します。DDD（ドメイン駆動設計）とスキーマ駆動開発を採用しています。

## 開発ガイドライン

### 命名規約
- ドメインモデル：WorkItem, ScheduleSlot, TaskDurationPredictor, SchedulePlannerなど、ドメイン概念を反映
- 関数・変数・リポジトリ：getTaskById, storeTask, updateTask, createTaskManagerなど一貫したルール

### コード規約
- t-wadaによるTDDに基づいて進める
- oxlintのルールに従う
- 関数型プログラミングの原則を尊重（不変性、純粋関数）
- 型安全性を重視し、`any`型を避ける
- JSDocコメントによるドキュメント化

### テスト戦略
- Vitestを使用したt-wadaのテスト駆動開発（TDD）
- ドメイン層の単体テスト
- リポジトリの統合テスト
- UIコンポーネントのテスト

### 技術スタック
- **言語**: TypeScript
- **UIフレームワーク**: Ink (React)
- **型定義・バリデーション**: Zod
- **エラーハンドリング**: neverthrow
- **テスト**: Vitest
- **パッケージ管理**: pnpm
- **データストレージ**: JSONファイル（将来的にSQLite等を検討）
- **AI統合**: 外部AI API（例：OpenAI API）

## 開発コマンド

### ビルドコマンド
```bash
# TypeScriptのビルド
pnpm build
```

### 実行コマンド
```bash
# アプリケーションの起動
pnpm start

# 開発モードでの起動（ファイル変更時に自動リロード）
pnpm dev
```

### テストコマンド
```bash
# 全てのテストを実行
pnpm test

# テストを一度だけ実行
pnpm test:run

# カバレッジレポートを出力
pnpm test:coverage

# 型チェックのみ実行
pnpm test:typecheck
```

### リンター
```bash
# oxlintでコードをチェック
pnpm lint

# oxlintでコードを自動修正
pnpm lint:fix
```
## 主要機能
1. **タスク管理機能**
   - ユーザーがタスク名と任意の説明を入力
   - AIが入力内容から所要時間とカテゴリを予測
   - タスクはJSONファイルに保存され、一覧表示・詳細表示が可能

2. **タイムブロッキング機能**
   - 指定された時間枠に合わせて各タスクの予測所要時間を元にタイムブロックを自動生成
   - 開始時刻・終了時刻が計算され、スケジュール内に配置

3. **タイムトラッキング機能**
   - キー操作（開始：s、停止：p、終了：e）でタスクの実績時間を計測
   - 記録された実績時間をAIの学習データとして活用

4. **予測フィードバック機能**
   - AIの予測結果に対して「短すぎる／長すぎる／適切／不確か」のフィードバックを提供
   - フィードバック情報はタスクに紐付けられ、AIモデルの学習に利用

