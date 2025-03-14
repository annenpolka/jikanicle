# プロジェクトディレクトリ構造

このドキュメントは、jikanicleプロジェクトのディレクトリ構造とファイルの概要を説明します。

## 更新履歴

| 日付 | 更新者 | 内容 |
|------|--------|------|
| 2025-03-09 | AI | 初版作成 |
| 2025-03-09 | AI | 実装状況の更新 |
| 2025-03-10 | 開発チーム | ドキュメント構造のリファクタリングに伴う更新 |
| 2025-03-10 | 開発チーム | 技術ドキュメントの整理と詳細構造の更新 |
| 2025-03-10 | 開発チーム | 実装状況の更新とロードマップの反映 |

## ルートディレクトリ

```
jikanicle/
├── .clinerules           # AI補助システム用のルール設定ファイル
├── .cursor/              # Cursor IDE設定ディレクトリ
│   └── rules/            # AIアシスタントのルール定義ファイル
├── .gitignore            # Gitの除外ファイル設定
├── .husky/               # Git Hooksの設定
├── .roomodes             # AIアシスタントのモード設定ファイル
├── babel.config.json     # Babelの設定ファイル
├── coverage/             # テストカバレッジレポート
├── docs/                 # プロジェクトドキュメント
├── eslint.config.mjs     # ESLintの設定ファイル
├── node_modules/         # 依存パッケージ
├── package-lock.json     # npm依存関係のロックファイル
├── package.json          # プロジェクト設定と依存関係
├── pnpm-lock.yaml        # pnpm依存関係のロックファイル
├── src/                  # ソースコード
├── test/                 # テストコード
├── tsconfig.json         # TypeScriptの設定
└── vitest.config.ts      # Vitestの設定ファイル
```

## ソースコード構造 (`src/`)

```
src/
├── application/          # アプリケーション層（ユースケース実装）
│   ├── repositories/     # リポジトリインターフェース
│   │   └── task-repository.ts # タスクリポジトリインターフェース
│   └── services/         # アプリケーションサービス
├── domain/               # ドメイン層（ビジネスロジック）
│   ├── commands/         # コマンドオブジェクト
│   │   └── delete-task.ts  # タスク削除コマンド
│   ├── factories/        # ファクトリクラス
│   │   ├── task-factory.ts  # タスク作成ファクトリ
│   │   └── update-task.ts   # タスク更新ファクトリ
│   ├── schemas/          # バリデーションスキーマ
│   │   └── task-schema.ts   # タスクのZodスキーマ定義
│   ├── services/         # ドメインサービス
│   └── types/            # 型定義
│       └── Task.ts       # タスク関連の型定義
└── infrastructure/       # インフラストラクチャ層（外部サービス連携）
    ├── ai/               # AI関連の実装
    ├── repositories/     # リポジトリの実装
    │   └── in-memory-task-repository.ts # インメモリタスクリポジトリ実装
    └── ui/               # ユーザーインターフェース実装
```

## テストコード構造 (`test/`)

```
test/
├── domain/               # ドメイン層のテスト
│   ├── commands/         # コマンドのテスト
│   └── factories/        # ファクトリのテスト
│       ├── task-factory.test.ts  # タスクファクトリのテスト
│       └── update-task.test.ts   # タスク更新ファクトリのテスト
└── infrastructure/       # インフラストラクチャ層のテスト
    └── repositories/     # リポジトリ実装のテスト
        └── in-memory-task-repository.test.ts # インメモリタスクリポジトリのテスト
```

## ドキュメント構造 (`docs/`)

```
docs/
├── architecture/             # アーキテクチャ関連ドキュメント
│   ├── decisions/            # 設計決定記録（ADR）
│   │   ├── task-deletion-strategy.md  # タスク削除戦略に関するADR
│   │   └── esmodule-adoption.md       # ESModule採用に関するADR
│   └── overview.md           # アーキテクチャ概要
├── domain/                   # ドメイン固有のドキュメント
│   └── task/                 # タスク管理ドメイン
│       ├── design.md         # タスクドメイン設計
│       ├── design-reviews/   # 設計レビュー
│       │   ├── update.md     # タスク更新設計レビュー
│       │   └── deletion.md   # タスク削除設計レビュー
│       ├── implementation.md # タスクドメイン実装詳細
│       ├── infrastructure.md # インフラストラクチャ実装
│       └── status.md         # タスクドメイン実装状況・ロードマップ
├── guidelines/               # 技術的ガイドライン
│   ├── code-quality/         # コード品質関連ガイドライン
│   │   ├── eslint-configuration.md    # ESLint設定ガイド
│   │   ├── eslint-design-principles.md # ESLint設計原則
│   │   └── test-naming-convention.md  # テスト命名規則
│   ├── state-management/     # 状態管理関連ガイドライン
│   │   ├── library-evaluation.md     # ライブラリ評価
│   │   ├── overview.md               # 状態管理概要
│   │   ├── zustand-ddd-integration.md # ZustandとDDDの統合
│   │   └── zustand-implementation.md # Zustand実装ガイド
│   └── technical/            # 技術的な詳細ガイドライン
│       └── zod-schema-implementation.md  # Zodスキーマ実装ガイドライン
├── project/                  # プロジェクト全体のドキュメント
│   ├── roadmap.md            # プロジェクトロードマップ
│   ├── status.md             # プロジェクト現状と優先タスク
│   └── tasks/                # 個別タスク関連
│       └── linter-fixes.md   # リンター修正タスク
├── directory_structure.md    # このファイル（ディレクトリ構造説明）
├── document_rules.md         # ドキュメント管理ルール
└── user/                     # ユーザー向けドキュメント
    └── task-management.md    # タスク管理機能ガイド
```

## 主要ファイルの説明

### ドメイン層

- **src/domain/types/Task.ts**: タスクに関するドメイン型を定義。TaskId、Category、TaskStatus、Priorityなどの型を提供。
- **src/domain/schemas/task-schema.ts**: Zodを使用したタスク関連スキーマと検証関数を定義。
- **src/domain/factories/task-factory.ts**: タスクオブジェクトを作成するファクトリ関数を実装。
- **src/domain/factories/update-task.ts**: 既存タスクの更新機能を実装。
- **src/domain/commands/delete-task.ts**: タスク削除コマンドを実装。

### アプリケーション層

- **src/application/repositories/task-repository.ts**: タスクリポジトリのインターフェースを定義。

### インフラストラクチャ層

- **src/infrastructure/repositories/in-memory-task-repository.ts**: インメモリ上でタスクを管理するリポジトリ実装。

### テスト

- **test/domain/factories/task-factory.test.ts**: タスクファクトリのテストケース。
- **test/domain/factories/update-task.test.ts**: タスク更新機能のテストケース。
- **test/infrastructure/repositories/in-memory-task-repository.test.ts**: インメモリタスクリポジトリのテストケース。

### ドキュメント

- **docs/project/roadmap.md**: プロジェクト全体のロードマップと実装計画。
- **docs/project/status.md**: プロジェクト現状分析とバックログ。
- **docs/architecture/overview.md**: アーキテクチャ全体の概要と設計方針。
- **docs/architecture/decisions/task-deletion-strategy.md**: タスク削除戦略についての設計決定記録。
- **docs/architecture/decisions/esmodule-adoption.md**: ESModuleへの移行に関する設計決定記録。
- **docs/domain/task/design.md**: タスク管理ドメインの設計詳細。
- **docs/domain/task/implementation.md**: タスク管理ドメインの実装詳細。
- **docs/domain/task/status.md**: タスク管理ドメインの実装状況とロードマップ。
- **docs/domain/task/infrastructure.md**: タスク管理ドメインのインフラストラクチャ実装。
- **docs/domain/task/design-reviews/update.md**: タスク更新機能の設計レビュー。
- **docs/domain/task/design-reviews/deletion.md**: タスク削除機能の設計レビュー。
- **docs/guidelines/technical/zod-schema-implementation.md**: Zodスキーマ実装のガイドライン。
- **docs/guidelines/state-management/overview.md**: 状態管理の設計と実装ガイド。
- **docs/guidelines/state-management/zustand-implementation.md**: Zustandを使った状態管理の実装ガイド。
- **docs/guidelines/code-quality/eslint-configuration.md**: ESLint設定の詳細ガイド。
- **docs/guidelines/code-quality/test-naming-convention.md**: テスト命名規則ガイド。

## 実装状況

現在、以下の機能が実装されています：

1. **ドメイン層**:
   - ✅ タスクの基本的な型定義（Task.ts）
   - ✅ タスク検証用Zodスキーマ（task-schema.ts）
   - ✅ タスク作成ファクトリ（task-factory.ts）
   - ✅ タスク更新ファクトリ（update-task.ts）
   - ✅ タスク削除コマンド（delete-task.ts）

2. **アプリケーション層**:
   - ✅ タスクリポジトリインターフェース（task-repository.ts）

3. **インフラストラクチャ層**:
   - ✅ インメモリタスクリポジトリ実装（in-memory-task-repository.ts）
   - 🔄 ファイルベースリポジトリ（設計完了、実装進行中）

2025年3月10日現在の最新状況：

- **ファイルベースリポジトリ**:
  - 設計仕様書作成完了（docs/domain/task/infrastructure/file-based-repository.md）
  - 実装計画書作成完了（docs/domain/task/infrastructure/file-based-repository-implementation-plan.md）
  - 実装作業進行中（想定完了日: 2025-03-13）

ロードマップに基づき、今後は以下の実装が予定されています：

1. **ファイルベースリポジトリの実装完了**（〜2025-03-13）
2. **Zustand状態管理の導入**（〜2025-03-16）
   - ストア設計
   - ドメイン層との連携パターン確立
3. **アプリケーションサービスの実装**（〜2025-03-18）
   - ユースケース定義と実装
   - ドメイン層との統合
4. **ユーザーインターフェース実装**（〜2025-03-20）
   - TUIの基本構造
   - 基本レイアウトコンポーネント

## 使用技術とライブラリ

jikanicleプロジェクトでは、以下の主要な技術とライブラリを使用しています：

### 言語とフレームワーク
- **TypeScript**: 型安全なJavaScriptスーパーセット
- **React**: UIコンポーネントライブラリ
- **Ink**: ターミナルベースのReactレンダリング

### 主要ライブラリ
- **zod**: スキーマ宣言と型検証
- **neverthrow**: 関数型エラーハンドリング
- **uuid**: 一意識別子生成

### 開発ツール
- **vitest**: テストフレームワーク
- **eslint**: コード品質とスタイル検証
- **husky**: Gitフック管理
- **pnpm**: パッケージマネージャ

## 設計原則

このプロジェクトは以下の設計原則に従って構成されています：

1. **ドメイン駆動設計 (DDD)**:
   - ドメイン層、アプリケーション層、インフラストラクチャ層の明確な分離
   - ドメインモデルによるビジネスロジックのカプセル化

2. **クリーンアーキテクチャ**:
   - 内側と外側の層の依存関係を制御
   - 内側の層は外側の層に依存しない

3. **関数型プログラミング**:
   - 不変性の重視
   - 副作用の制御
   - 宣言的なプログラミングスタイル

4. **テスト駆動開発 (TDD)**:
   - テストファーストの開発アプローチ
   - 高いテストカバレッジの維持