# GEMINI.md

This file provides guidance to Gemini when working with code in this repository.

## プロジェクト概要

Jikanicleは、TypeScriptとInkライブラリ（React）を用いたターミナルベースのタスク管理・スケジュール管理アプリケーションです。DDD（ドメイン駆動設計）アプローチとスキーマ駆動開発を採用しています。

## 開発コマンド

### ビルドコマンド
```bash
# TypeScriptのビルド
npm run build
```

### 実行コマンド
```bash
# アプリケーションの起動
npm start

# 開発モードでの起動（ファイル変更時に自動リロード）
npm run dev
```

### テストコマンド
```bash
# 全てのテストを実行
npm test

# テストを一度だけ実行
npm run test:run

# カバレッジレポートを出力
npm run test:coverage

# 型チェックのみ実行
npm run test:typecheck
```

### リンター
```bash
# ESLintでコードをチェック
npm run lint

# ESLintでコードを自動修正
npm run lint:fix
```

## アーキテクチャ構成

### ディレクトリ構造
- `src/`: ソースコード
  - `domain/`: ドメインロジック（エンティティ、値オブジェクト、ドメインサービス）
  - `application/`: ユースケース層（アプリケーションサービス、リポジトリインターフェース）
  - `infrastructure/`: インフラストラクチャ層（リポジトリ実装、外部サービス連携）
  - `ui/`: UI層（Inkコンポーネント、フック、状態管理）
- `test/`: テストコード
- `docs/`: プロジェクト関連ドキュメント
- `dist/`: ビルド後の出力先

### ドメインモデル
- **Task**: タスクエンティティ（Zodスキーマで定義）
- **KeyBinding**: キーバインドのドメインモデル
- **Result**: neverthrowを使用したエラーハンドリング

### Repository パターン
- `src/application/repositories/`: リポジトリのインターフェースを定義
- `src/infrastructure/repositories/`: ファイルシステムベースのリポジトリ実装

### UI層（Ink & Zustand）
- **React/Ink**: コンポーネントベースのTUI構築
- **Zustand**: 状態管理
- **カスタムフック**: UIロジックのカプセル化

## 開発ガイドライン

### コード規約
- ESLintのルールに従う
- 関数型プログラミングの原則を尊重（不変性、純粋関数）
- 型安全性を重視し、`any`型を避ける
- JSDocコメントによるドキュメント化

### テスト戦略
- Vitestを使用したテスト駆動開発（TDD）
- ドメイン層の単体テスト
- リポジトリの統合テスト
- UIコンポーネントのテスト

### 技術スタック
- **言語**: TypeScript
- **UIフレームワーク**: Ink (React)
- **状態管理**: Zustand
- **バリデーション**: Zod
- **エラーハンドリング**: neverthrow
- **テスト**: Vitest
- **パッケージ管理**: npm/pnpm
