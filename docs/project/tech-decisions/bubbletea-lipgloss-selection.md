# Jikanicleプロジェクト TUIライブラリ技術選定レポート
**作成日**: 2025年3月11日

## 技術選定概要

| 項目 | 選定結果 |
|------|----------|
| 言語 | Go |
| TUIフレームワーク | Bubble Tea |
| スタイリングライブラリ | Lip Gloss |
| 補助ライブラリ | Bubbles (UIコンポーネント集) |
| アーキテクチャパターン | The Elm Architecture (TEA) |

## 1. 選定背景と目的

Jikanicleプロジェクトのターミナルユーザーインターフェース(TUI)実装にあたり、以下の要件を満たすライブラリ選定を行いました。

- **高性能なレンダリング**: 複雑なUIでもスムーズな描画が可能
- **堅牢な状態管理**: アプリケーション状態の予測可能な管理
- **保守性の高いコードベース**: 機能単位での分割と拡張可能性
- **テスト容易性**: 状態とUIの分離による検証の簡略化
- **優れた開発体験**: 開発効率の向上とフィードバックサイクルの短縮

## 2. Bubble Tea + Lip Glossの主要特徴

### 2.1 Bubble Tea

The Elm Architecture(TEA)を採用したGoベースのTUIフレームワークです。主な特徴：

- **Model-Update-View**パターンによる状態管理
  - **Model**: アプリケーション状態の保持
  - **Update**: メッセージ処理による状態更新関数
  - **View**: 現在の状態に基づくUI描画関数

- **イベント駆動型**アーキテクチャ
  - キーボード入力、タイマー、非同期処理を統一的に扱う
  - 副作用を`tea.Cmd`として明示的に分離

- **コンポーネント指向**
  - 画面要素を独立したコンポーネントとして実装可能
  - コンポーネント間のメッセージ伝播による連携

### 2.2 Lip Gloss

ターミナルUI用のCSSライクなスタイリングライブラリです。主な特徴：

- **宣言的スタイル定義**
  - 色、パディング、マージン、ボーダーなどを宣言的に設定
  - スタイル合成によるテーマ管理

- **レイアウト制御**
  - 要素配置の柔軟な制御（中央寄せ、幅指定など）
  - レスポンシブ対応（端末幅に応じた調整）

- **カラースキーム**
  - 異なる端末環境での互換性維持
  - ライト/ダークモード自動検出と適応

## 3. 機能指向アーキテクチャとの親和性

Bubble TeaとLip Glossの採用は、当プロジェクトで重視する機能指向アーキテクチャと高い親和性を持ちます。

### 3.1 技術レイヤーではなく機能単位での分割

```go
// 機能単位でのディレクトリ構成例
/features
  /task-list        // タスク一覧機能
    model.go        // タスク一覧の状態定義
    update.go       // タスク一覧の更新ロジック
    view.go         // タスク一覧の表示
    styles.go       // タスク一覧専用スタイル
  /task-detail      // タスク詳細機能
  /task-creation    // タスク作成機能
```

### 3.2 関連コードのコロケーション

The Elm Architecture(TEA)は状態・ロジック・表示を密接に関連付けながらも分離できる設計を提供：

```go
// task_list/model.go
type TaskListModel struct {
    Tasks        []Task
    SelectedTask int
    Filter       string
    // ...その他状態
}

// task_list/update.go
func (m TaskListModel) Update(msg tea.Msg) (tea.Model, tea.Cmd) {
    switch msg := msg.(type) {
    case TaskSelectedMsg:
        // タスク選択処理
    case FilterChangedMsg:
        // フィルター変更処理
    }
    return m, nil
}

// task_list/view.go
func (m TaskListModel) View() string {
    // 状態に基づいてUI描画（Lip Glossスタイル適用）
}
```

### 3.3 過度な抽象化を避けたシンプルな設計

Bubble Teaのシンプルなインターフェースは、複雑な抽象化を避けながら拡張性を提供します：

```go
// 必要最小限のインターフェース
type Model interface {
    Init() tea.Cmd
    Update(tea.Msg) (Model, tea.Cmd)
    View() string
}
```

## 4. 実装アプローチと推奨パターン

### 4.1 状態管理戦略

- **集約ルートモデル**: 各機能のモデルを集約する親モデル
- **メッセージタイプによる処理分岐**: 型スイッチを活用した明示的なイベント処理
- **イミュータブルな状態更新**: 新しい状態を返すパターンによる予測可能性の確保

```go
// 機能間通信のメッセージ定義
type TaskCreatedMsg struct {
    Task Task
}

// 親モデルでの状態更新
func (m AppModel) Update(msg tea.Msg) (tea.Model, tea.Cmd) {
    switch msg := msg.(type) {
    case TaskCreatedMsg:
        // 1. 新規タスクを状態に追加
        newTasks := append(m.Tasks, msg.Task)

        // 2. イミュータブルに新しい状態を構築
        newModel := m
        newModel.Tasks = newTasks

        // 3. 更新後の処理コマンドを返却
        return newModel, m.saveTaskCmd(msg.Task)
    }

    return m, nil
}
```

### 4.2 UIコンポーネント設計

- **スタイル定義のコロケーション**: 各機能専用のスタイル集約
- **ビューの階層化**: 複雑なUIを関数コンポジションで構築
- **レスポンシブ対応**: 端末サイズに応じた動的調整

```go
// task_list/styles.go
var (
    ListTitleStyle = lipgloss.NewStyle().
        Bold(true).
        Foreground(lipgloss.Color("#FAFAFA")).
        Background(lipgloss.Color("#7D56F4")).
        Padding(0, 1)

    SelectedItemStyle = lipgloss.NewStyle().
        Foreground(lipgloss.Color("#FAFAFA")).
        Background(lipgloss.Color("#F25D94")).
        Padding(0, 1)

    ItemStyle = lipgloss.NewStyle().
        Foreground(lipgloss.Color("#FFFFFF"))
)

// task_list/view.go
func (m TaskListModel) View() string {
    title := ListTitleStyle.Render("タスク一覧")
    items := []string{}

    for i, task := range m.FilteredTasks() {
        item := task.Title
        if i == m.SelectedTask {
            item = SelectedItemStyle.Render(item)
        } else {
            item = ItemStyle.Render(item)
        }
        items = append(items, item)
    }

    return lipgloss.JoinVertical(
        lipgloss.Left,
        title,
        strings.Join(items, "\n"),
    )
}
```

## 5. プロジェクト構成案

Jikanicleプロジェクトに適した構成として、以下のようなディレクトリ構造を提案します：

```
/jikanicle
├── cmd/
│   └── jikanicle/
│       └── main.go         # エントリーポイント
├── internal/
│   ├── app/
│   │   ├── model.go        # アプリケーションモデル
│   │   ├── update.go       # 状態更新ロジック
│   │   └── view.go         # メインビュー
│   ├── domain/
│   │   ├── task/
│   │   │   ├── model.go    # タスクドメインモデル
│   │   │   └── service.go  # タスク操作サービス
│   ├── features/
│   │   ├── task_list/      # タスク一覧機能
│   │   ├── task_detail/    # タスク詳細機能
│   │   └── task_creation/  # タスク作成機能
│   ├── repository/
│   │   └── file_repository.go  # ファイルベースリポジトリ
│   ├── styles/
│   │   ├── base.go         # 共通スタイル定義
│   │   └── theme.go        # テーマカラー定義
│   └── ui/
│       └── components/     # 再利用可能なUIコンポーネント
├── pkg/
│   └── tui/               # プロジェクト外で再利用可能なTUI部品
├── go.mod
└── go.sum
```

## 6. テスト戦略

Bubble Teaを用いた開発では、関数型アプローチの恩恵を活かしたテスト戦略が有効です：

### 6.1 ユニットテスト

- **モデルの初期状態テスト**: 初期状態が正しく設定されているか
- **更新ロジックテスト**: 特定のメッセージによる状態変化の検証
- **ビュー出力テスト**: 特定の状態からの出力を検証

```go
func TestTaskListUpdate(t *testing.T) {
    // 1. テスト用の初期状態を準備
    model := task_list.NewModel([]Task{
        {ID: "1", Title: "牛乳を買う"},
        {ID: "2", Title: "本を読む"},
    })

    // 2. テスト対象の処理を実行
    updatedModel, _ := model.Update(task_list.SelectTaskMsg{ID: "2"})

    // 3. 結果を検証
    taskListModel, ok := updatedModel.(task_list.Model)
    if !ok {
        t.Fatal("期待した型へのキャスト失敗")
    }

    if taskListModel.SelectedTaskID != "2" {
        t.Errorf("選択されたタスクIDが期待値と異なる: 期待=%s, 実際=%s", "2", taskListModel.SelectedTaskID)
    }
}
```

### 6.2 統合テスト

- **機能間連携テスト**: 複数機能間の状態変化と通信の検証
- **シナリオベースのテスト**: 一連のユーザー操作をシミュレート

### 6.3 エンドツーエンドテスト

- **プログラム起動テスト**: 実際の実行環境でのアプリケーション動作検証
- **バブルティープログラムモックテスト**: 外部依存を模倣した動作検証

## 7. なぜTypeScriptではなくGoなのか

当プロジェクトにおいて、TypeScriptからGoへの移行を決定した主な理由：

1. **ターミナルアプリケーションの特性**:
   - バイナリ単一配布が可能（依存関係の管理不要）
   - クロスプラットフォーム対応の容易さ
   - 優れたパフォーマンスとメモリ効率

2. **Bubble Tea + Lip GlossエコシステムのTUI専用設計**:
   - ターミナルUIに特化した機能セット
   - 美しいスタイリングと柔軟なレイアウト
   - The Elm Architectureによる堅牢な状態管理

3. **関数型アプローチとの親和性**:
   - 純粋関数によるテスト容易性の向上
   - 副作用の局所化と明示的な処理
   - イミュータブルな状態による予測可能性

4. **開発効率**:
   - 強力な型システムによる安全性
   - 簡潔な構文と読みやすいコード
   - 高速なコンパイルとホットリロード対応

## 8. 今後の実装計画

1. **プロジェクト初期化**:
   - Go環境のセットアップ
   - モジュール構成の構築
   - 依存関係のインストール

2. **Core機能実装**:
   - ドメインモデル定義
   - 基本的なTUI構造構築
   - 状態管理基盤の実装

3. **機能単位での実装**:
   - タスク一覧表示機能
   - タスク作成・編集機能
   - タスク詳細表示機能

4. **インフラ層の統合**:
   - ファイルベースリポジトリ実装
   - 設定管理機能の実装

5. **UIの洗練**:
   - テーマ設定機能
   - キーボードショートカット拡充
   - アクセシビリティ対応

## 9. 結論

Bubble Tea + Lip Glossは、機能指向アプローチを採用するJikanicleプロジェクトに最適なTUIライブラリです。The Elm Architectureの採用による状態管理、コンポーネント指向設計、スタイリングの柔軟性を活かし、保守性が高く拡張可能なアプリケーションを構築できると判断しました。

Go言語への移行は短期的には学習コストを伴いますが、TUIアプリケーションとしてのパフォーマンスや配布の容易さ、機能指向アーキテクチャとの親和性を考慮すると、長期的には正しい選択であると考えています。