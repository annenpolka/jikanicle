# Jikanicle

Jikanicleは、Go言語と[Bubble Tea](https://github.com/charmbracelet/bubbletea)ライブラリを用いたターミナルベースのタスク管理・スケジュール管理アプリケーションです。

## プロジェクト概要

Jikanicleは以下の機能を提供しています：

- タスク管理：カテゴリ別のタスク作成・管理
- スケジュール管理：日単位でのタスク計画
- タイムブロック管理：効率的な時間配分

本アプリケーションはすべてターミナル内で操作でき、さまざまな環境で利用可能です。

## 前提条件

- [Go](https://golang.org/dl/) 1.21以上（1.24.1で動作確認済み）
- ターミナルアクセス

## ビルド方法

### ソースからのビルド

リポジトリのルートディレクトリで以下のコマンドを実行します：

```bash
# ビルド（プロジェクトルートディレクトリで実行）
go build -o jikanicle ./cmd/jikanicle
```

上記コマンドにより、実行可能なバイナリファイル`jikanicle`が作成されます。

## テスト方法

全てのテストを実行するには：

```bash
# 全てのテストを実行
go test ./...
```

特定のパッケージのテストのみを実行するには：

```bash
# 例：タスク関連のテストのみを実行
go test ./internal/domain/task

# 例：スケジュール関連のテストのみを実行
go test ./internal/domain/schedule

# 例：UI関連のテストのみを実行
go test ./internal/ui
```

テストカバレッジを確認するには：

```bash
# カバレッジレポートを出力
go test ./... -coverprofile=coverage.out

# カバレッジレポートをブラウザで表示
go tool cover -html=coverage.out
```

## 実行方法

### コンパイルせずに直接実行

```bash
go run ./cmd/jikanicle/main.go
```

### ビルド済みバイナリを実行

```bash
# ビルド後
./jikanicle
```

初回実行時は、ホームディレクトリに`.jikanicle/tasks.json`が作成され、サンプルタスクが自動的に生成されます。

## 基本操作

Jikanicleでは以下のキー操作が利用可能です：

- **j/k** または **↑/↓**：カーソル移動（項目選択）
- **Enter/Space**：選択中のタスクを選択
- **p**：タスクを「進行中（In Progress）」に変更
- **c**：タスクを「完了（Completed）」に変更
- **n**：タスクを「未着手（Not Started）」に変更
- **q** または **Ctrl+C**：アプリケーション終了

## データストレージ

アプリケーションデータは`~/.jikanicle/`ディレクトリに保存され、以下のファイルが含まれます：

- `tasks.json`：タスク情報

## 開発情報

- UI: [Bubble Tea](https://github.com/charmbracelet/bubbletea) (TUIフレームワーク)
- スタイリング: [Lipgloss](https://github.com/charmbracelet/lipgloss)
- アーキテクチャ: DDD（ドメイン駆動設計）アプローチ