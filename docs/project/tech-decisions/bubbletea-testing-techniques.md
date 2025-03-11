# Bubble Tea テスト手法ガイド

## 1. Bubble Teaテスト概要

Bubble TeaはGo言語向けTUIフレームワークで、The Elm Architecture（TEA）に基づいています。テスト戦略も同アーキテクチャの特徴を活かす設計が必要です。

### 1.1 テスト対象コンポーネント

```
┌─────────────┐      ┌─────────────┐      ┌─────────────┐
│   Model     │─────▶│   Update    │─────▶│    View     │
│  (状態定義)  │◀─────│ (状態遷移)   │◀─────│  (描画)     │
└─────────────┘      └─────────────┘      └─────────────┘
       ▲                   │                    │
       │                   ▼                    ▼
       │              ┌─────────────┐      ┌─────────────┐
       └──────────────│   Message   │◀─────│ Terminal UI │
                     │   (イベント)  │      │  (出力)     │
                     └─────────────┘      └─────────────┘
```

### 1.2 テスト戦略の基本方針

1. **状態遷移のテスト**: メッセージ処理による状態変化の検証
2. **出力のテスト**: Viewメソッドの出力内容の検証
3. **インタラクションのテスト**: ユーザー入力のシミュレーション
4. **非同期処理のテスト**: コマンド実行の検証

## 2. 推奨テストライブラリ

### 2.1 teatest （Charmbracelet公式）

`github.com/charmbracelet/x/exp/teatest` は実験的なステータスながら最も包括的なテストユーティリティを提供します。

```go
// インストール
go get github.com/charmbracelet/x/exp/teatest@latest
```

主な機能:
- プログラム全体の出力テスト（ゴールデンファイル）
- 最終モデル状態のテスト
- 中間出力の検証
- ユーザー入力のシミュレーション

### 2.2 catwalk（knz開発）

データ駆動型のテストを行うためのライブラリです。テストデータファイルを使用して複雑なシナリオを表現できます。

```go
// インストール
go get github.com/knz/catwalk
```

## 3. テスト実装パターン

### 3.1 最終出力テスト（Golden Files）

プログラムの最終的な出力をゴールデンファイルと比較します。

```go
func TestFullOutput(t *testing.T) {
    // 1. モデル初期化
    model := InitialModel()

    // 2. テストモデル作成
    tm := teatest.NewTestModel(t, model, teatest.WithInitialTermSize(80, 24))

    // 3. 最終出力の取得
    output, _ := io.ReadAll(tm.FinalOutput(t))

    // 4. ゴールデンファイルとの比較
    teatest.RequireEqualOutput(t, output)
}

// ゴールデンファイル更新
// go test -v ./... -update
```

### 3.2 モデル状態テスト

プログラム終了時の最終モデル状態を検証します。

```go
func TestFinalModelState(t *testing.T) {
    tm := teatest.NewTestModel(t, InitialModel())
    finalModel := tm.FinalModel(t)

    // キャストして具体的な状態を検証
    m, ok := finalModel.(Model)
    if !ok {
        t.Fatalf("unexpected model type: %T", finalModel)
    }

    // 状態の検証
    if len(m.Tasks) != 3 {
        t.Errorf("expected 3 tasks, got %d", len(m.Tasks))
    }

    if m.Cursor != 0 {
        t.Errorf("cursor should be at 0, got %d", m.Cursor)
    }
}
```

### 3.3 インタラクションテスト

ユーザー入力をシミュレートし、中間状態を検証します。

```go
func TestInteraction(t *testing.T) {
    tm := teatest.NewTestModel(t, InitialModel())

    // キーイベント送信
    tm.Send(tea.KeyMsg{Type: tea.KeyDown})

    // 特定の出力を待機
    teatest.WaitFor(t, tm.Output(), func(bts []byte) bool {
        return bytes.Contains(bts, []byte("> Bubbletea UIの実装"))
    }, teatest.WithCheckInterval(time.Millisecond*100))

    // 選択
    tm.Send(tea.KeyMsg{Type: tea.KeyEnter})

    // 終了
    tm.WaitFinished(t, teatest.WithFinalTimeout(time.Second))

    // 最終状態の検証
    m := tm.FinalModel(t).(Model)
    if _, ok := m.Selected[1]; !ok {
        t.Error("Expected second item to be selected")
    }
}
```

### 3.4 データ駆動テスト（catwalk）

テスト定義ファイルを使用したデータ駆動テスト。

```
# testdata/task_selection_test
run key down
----
-- view:
> Bubbletea UIの実装

run key enter
----
-- view:
[x] Bubbletea UIの実装
```

```go
func TestWithCatwalk(t *testing.T) {
    // catwalkのテストランナーを初期化
    r := catwalk.NewRunner(InitialModel)

    // テストデータファイルを読み込み実行
    err := r.RunTestFile(t, "testdata/task_selection_test")
    if err != nil {
        t.Fatal(err)
    }
}
```

## 4. テスト環境設定のベストプラクティス

### 4.1 環境の一貫性

環境差異を防ぐためにカラープロファイルを固定します。

```go
func init() {
    // ASCIIカラープロファイルに固定（色なし）
    lipgloss.SetColorProfile(termenv.Ascii)
}
```

### 4.2 ゴールデンファイル管理

改行コードの問題を避けるために `.gitattributes` を設定します。

```
# .gitattributes
*.golden -text
```

### 4.3 タイミング依存処理

時間依存のテストは不安定になりがちなので、以下の方法で緩和します。

```go
// より長いタイムアウトを設定
teatest.WaitFor(t, tm.Output(),
    func(b []byte) bool { return someCondition(b) },
    teatest.WithTimeout(5*time.Second))

// チェック間隔を調整
teatest.WaitFor(t, tm.Output(),
    func(b []byte) bool { return someCondition(b) },
    teatest.WithCheckInterval(200*time.Millisecond))
```

## 5. Jikanicleプロジェクト実装状況

Jikanicleプロジェクトではすでにteatestを活用したテスト実装を行っています。

### 5.1 実装済みテスト機能

以下の機能がすでに実装されています:

- `github.com/charmbracelet/x/exp/teatest` ライブラリの導入
- 環境の一貫性のためのカラープロファイル設定
- テストディレクトリ構造（`internal/ui/testdata/golden/`）の整備
- 従来のテストからteatestへの移行

### 5.2 基本的なモデルテスト

```go
// internal/ui/model_test.go - 既存実装
func TestInitialModel(t *testing.T) {
    // 初期モデルを作成してteatestで実行環境を構築
    tm := teatest.NewTestModel(t, InitialModel())

    // 最終モデルを取得し検証
    m := tm.FinalModel(t).(Model)

    // 初期状態の検証
    if len(m.Tasks) == 0 {
        t.Error("初期タスクがありません")
    }

    if m.Cursor != 0 {
        t.Errorf("カーソル初期位置が0ではありません: %d", m.Cursor)
    }
}
```
### 5.3 キー操作のテスト

```go
// TestUpdateKeyDown - 既存実装
func TestUpdateKeyDown(t *testing.T) {
    // 初期モデルを作成
    model := InitialModel()

    // タスクが少なくとも2つあることを確認（テスト前提条件）
    if len(model.Tasks) < 2 {
        t.Skip("このテストには少なくとも2つのタスクが必要です")
    }

    // 下キーのメッセージをシミュレート
    msg := tea.KeyMsg{Type: tea.KeyDown}
    updatedModel, _ := model.Update(msg)

    // 型アサーションで更新されたモデルを取得
    updatedUIModel, ok := updatedModel.(Model)
    if !ok {
        t.Fatal("更新されたモデルがui.Modelに変換できません")
    }

    // カーソルが1に移動しているか確認
    if updatedUIModel.Cursor != 1 {
        t.Errorf("下キー押下後のカーソル位置が1ではありません。got: %d, want: 1", updatedUIModel.Cursor)
    }
}
```

### 5.4 操作シーケンスのテスト

操作の連続実行をシミュレートするテストも実装されています。

```go
// TestCursorNavigation - 既存実装
func TestCursorNavigation(t *testing.T) {
    // 初期モデルを作成
    model := InitialModel()

    // タスクが少なくとも3つあることを確認（テスト前提条件）
    if len(model.Tasks) < 3 {
        t.Skip("このテストには少なくとも3つのタスクが必要です")
    }

    // 下キーを2回押下して複数の操作をシミュレート
    downKeyMsg := tea.KeyMsg{Type: tea.KeyDown}
    updatedModel, _ := model.Update(downKeyMsg)
    model1, ok := updatedModel.(Model)
    if !ok {
        t.Fatal("更新されたモデルがui.Modelに変換できません")
    }

    updatedModel, _ = model1.Update(downKeyMsg)
    model2, ok := updatedModel.(Model)
    if !ok {
        t.Fatal("更新されたモデルがui.Modelに変換できません")
    }

    // 期待される状態変化の検証
    if model2.Cursor != 2 {
        t.Errorf("2回の下キー押下後のカーソル位置が2ではありません。got: %d, want: 2", model2.Cursor)
    }
}
```

### 5.5 teatestを使った簡易テスト実装

teatestのイベント送信機能を活用した簡易テストも実装されています。

```go
// TestTeatestSimple - 既存実装
func TestTeatestSimple(t *testing.T) {
    // teatestを使用してテスト環境を構築
    tm := teatest.NewTestModel(t, InitialModel())

    // キーイベントを送信
    tm.Send(tea.KeyMsg{Type: tea.KeyDown})
    tm.Send(tea.KeyMsg{Type: tea.KeySpace})

    // teatestによって入力イベントが処理されたことを確認
    // 実際の表示内容はキャプチャできないが、発生したエラーは捕捉される
}
```
```

## 6. 実装から得られた知見

Jikanicleプロジェクトでのteatest実装から得られた重要な知見を紹介します。

1. **一貫性のある環境**: CI環境とローカル環境でのテスト結果の差異を減らすために、カラープロファイル設定は必須
2. **依存性の分離**: 外部依存（ファイル、ネットワーク等）はモック化が必要
3. **非決定的な要素の制御**: 時間や乱数は制御可能にして、テストの再現性を確保
4. **テスト速度の確保**: 長時間実行されるテストは避け、効率的なテスト実行環境を整備

### 6.1 具体的な移行方法

1. **依存関係の追加**: `go get github.com/charmbracelet/x/exp/teatest@latest`
2. **ディレクトリ構造の整備**: ゴールデンファイル用の `testdata/golden` ディレクトリを作成
3. **カラープロファイル設定**: `init()` 関数でカラープロファイルを固定
4. **テストの移行**: 既存のテストを順次teatestベースに書き換え
5. **動作確認**: `go test -v` で全テストが成功することを確認

## 7. 今後の課題と検討事項

移行作業の経験から、以下の課題と検討事項が明確になりました：

1. **ゴールデンファイルテストの段階的導入**: 現在は基本的な状態テストのみ実装されているため、ゴールデンファイルテストの段階的導入を検討
2. **テスト範囲の拡大**: 現在は基本的なUI部分のみのテストだが、ドメインロジックとの統合テストも検討
3. **テスト自動化**: CI/CDパイプラインでの自動テスト実行の最適化
4. **テストデータ管理**: モデル初期化のためのテストデータ管理戦略の強化
5. **パフォーマンステスト**: UIの応答性に関するパフォーマンステストの導入

### 7.1 優先順位

1. 既存テストの完全移行（完了）
2. ゴールデンファイルテストの追加（保留中）
3. CI/CD統合（未着手）
4. テストカバレッジ向上（未着手）

## 参考資料

- [Charm blog: teatest](https://charm.sh/blog/teatest/)
- [GitHub: charmbracelet/x/exp/teatest](https://github.com/charmbracelet/x/tree/main/exp/teatest)
- [GitHub: knz/catwalk](https://github.com/knz/catwalk)