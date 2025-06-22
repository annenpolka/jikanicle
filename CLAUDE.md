# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## プロジェクト概要

Jikanicleは、Go言語とBubble Teaライブラリを用いたターミナルベースのタスク管理・スケジュール管理アプリケーションです。DDD（ドメイン駆動設計）アプローチとThe Elm Architecture（TEA）パターンを採用しています。

## 開発コマンド

### ビルドコマンド
```bash
# ソースからのビルド（プロジェクトルートで実行）
go build -o jikanicle ./cmd/jikanicle

# コンパイルせずに直接実行
go run ./cmd/jikanicle/main.go

# ビルド済みバイナリを実行
./jikanicle
```

### テストコマンド
```bash
# 全てのテストを実行
go test ./...

# 特定のパッケージのテストのみを実行
go test ./internal/domain/task
go test ./internal/domain/schedule
go test ./internal/ui

# カバレッジレポートを出力
go test ./... -coverprofile=coverage.out

# カバレッジレポートをブラウザで表示
go tool cover -html=coverage.out
```

### 開発用コマンド
```bash
# 依存関係の管理
go mod tidy

# Go環境情報の確認
go version
go env
```

## アーキテクチャ構成

### ディレクトリ構造
- `cmd/jikanicle/`: エントリーポイント（main.go）
- `internal/`: 内部実装
  - `domain/`: ドメインロジック（task、schedule、timeblock）
  - `ui/`: Bubble TeaベースのUIレイヤー
  - `app/`: アプリケーション層（未実装）
- `docs/`: プロジェクト関連ドキュメント
- `_deprecated/`: 廃止されたTypeScript実装
- `logs/`: アクティビティログ

### ドメインモデル
- **Task**: タスクエンティティ（Status: NotStarted/InProgress/Completed、Category: Work/Personal/Growth/Misc）
- **Schedule**: 日次スケジュール管理
- **TimeBlock**: 時間ブロック単位での管理

### Repository パターン
各ドメインでJSONファイルベースのリポジトリを実装:
- `task.Repository`: タスク永続化インターフェース
- `task.JSONRepository`: JSONファイル実装
- データ保存場所: `~/.jikanicle/*.json`

### UI層（Bubble Tea）
- **Model-Update-View**パターン
- キーバインド:
  - `j/k`, `↑/↓`: カーソル移動
  - `Enter/Space`: タスク選択・状態変更
  - `p`: In Progress, `c`: Completed, `n`: Not Started
  - `r`: リロード, `q/Ctrl+C`: 終了

## 開発ガイドライン

### コード規約
- 日本語コメント可（ドメイン知識の説明等）
- 関数・変数名は英語
- エラーハンドリングを適切に実装
- テストファーストでの開発を推奨

### テスト戦略
- ドメインロジックの単体テスト
- リポジトリの統合テスト
- UI層の振る舞いテスト（teatest利用）

### 技術スタック
- **言語**: Go 1.24.1+
- **TUIフレームワーク**: Bubble Tea
- **スタイリング**: Lipgloss
- **テスト**: 標準library + teatest
- **データ永続化**: JSONファイル