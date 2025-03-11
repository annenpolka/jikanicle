# Teatestライブラリへの完全移行計画

## 1. 移行難易度評価表

| テスト名 | 既存実装 | 移行難易度 | 理由 |
|--------|---------|----------|-----|
| TestInitialModel | 従来型 | 低 | 単純な状態検証のみのため容易に移行可能 |
| TestUpdateKeyDown | 従来型 | 低 | 単一キー操作の検証で単純な構造 |
| TestView | 従来型 | 中 | 出力検証を含むためゴールデンファイル対応が必要 |
| TestCursorNavigation | 従来型 | 中 | 複数の操作シーケンスを含むが基本的には同様の構造 |
| TestTaskSelection | 従来型 | 中 | 複数のイベント送信と状態変化の検証 |
| TestTeatestSimple | teatest | 済 | 既に移行済み |

## 2. 各テストタイプごとの移行ガイドライン

### 2.1 状態検証テスト（TestInitialModel, TestUpdateKeyDown）

```go
// 既存実装
func TestInitialModel(t *testing.T) {
    model := InitialModel()
    if len(model.Tasks) < 1 {
        t.Errorf("初期モデルにタスクがありません。少なくとも1つのタスクが必要です")
    }
    // ...他の検証...
}

// teatest移行後
func TestInitialModel(t *testing.T) {
    tm := teatest.NewTestModel(t, InitialModel())

    // 最終モデルを取得して検証
    finalModel := tm.FinalModel(t).(Model)

    if len(finalModel.Tasks) < 1 {
        t.Errorf("初期モデルにタスクがありません。少なくとも1つのタスクが必要です")
    }
    // ...他の検証...
}
```

### 2.2 インタラクションテスト（TestCursorNavigation, TestTaskSelection）

```go
// 既存実装
func TestCursorNavigation(t *testing.T) {
    model := InitialModel()
    // ...イベント送信と状態検証...
    downKeyMsg := tea.KeyMsg{Type: tea.KeyDown}
    updatedModel, _ := model.Update(downKeyMsg)
    model1, ok := updatedModel.(Model)
    // ...状態検証...
}

// teatest移行後
func TestCursorNavigation(t *testing.T) {
    tm := teatest.NewTestModel(t, InitialModel())

    // キーイベント送信
    tm.Send(tea.KeyMsg{Type: tea.KeyDown})

    // 複数のキー操作をシミュレート
    tm.Send(tea.KeyMsg{Type: tea.KeyDown})

    // 最終状態の検証
    finalModel := tm.FinalModel(t).(Model)
    if finalModel.Cursor != 2 {
        t.Errorf("2回の下キー押下後のカーソル位置が2ではありません。got: %d, want: 2", finalModel.Cursor)
    }
}
```

### 2.3 出力検証テスト（TestView）

```go
// 既存実装
func TestView(t *testing.T) {
    model := InitialModel()
    view := model.View()
    expectedTitle := "Jikanicle"
    if !strings.Contains(view, expectedTitle) {
        t.Errorf("ビュー出力にアプリケーションタイトル '%s' が含まれていません", expectedTitle)
    }
}

// teatest移行後（ゴールデンファイル利用）
func TestView(t *testing.T) {
    tm := teatest.NewTestModel(t, InitialModel(),
        teatest.WithInitialTermSize(80, 24))

    // 出力の取得
    output, _ := io.ReadAll(tm.FinalOutput(t))

    // ゴールデンファイルとの比較
    teatest.RequireEqualOutput(t, output)

    // または特定の文字列検証を維持する場合
    if !bytes.Contains(output, []byte("Jikanicle")) {
        t.Errorf("ビュー出力にアプリケーションタイトル 'Jikanicle' が含まれていません")
    }
}
```

## 3. 段階的移行計画

### フェーズ1: 環境整備と基本テスト移行（1日）

1. 環境設定の確認
   - カラープロファイル設定の追加（テスト環境の一貫性確保）
   - `.gitattributes` ファイル作成（ゴールデンファイル用）

2. 単純な状態検証テストの移行
   - TestInitialModel
   - TestUpdateKeyDown

### フェーズ2: インタラクションテスト移行（1日）

1. 中難易度テストの移行
   - TestCursorNavigation
   - TestTaskSelection

2. 移行テストの実行と検証
   - `go test -v ./internal/ui/` による動作確認

### フェーズ3: ゴールデンファイルテスト導入（2日）

1. ゴールデンファイルの生成
   - TestView のゴールデンファイル作成
   - ゴールデンファイル用の更新メカニズム確認

2. CI環境での安定性確保
   - 環境変数設定（TERM=xterm-256color）
   - カラープロファイル固定化

### フェーズ4: テスト拡張と最適化（2日）

1. 追加テストケースの作成
   - エッジケースのテスト追加
   - パフォーマンステストの検討

2. 最終レビューと文書化
   - テストコード全体のレビュー
   - 将来の拡張に向けたガイドライン更新

## 4. 移行の費用対効果分析

### 予想工数

- 総工数: 約6人日
- 内訳:
  - 環境準備と基本テスト: 1人日
  - インタラクションテスト: 1人日
  - ゴールデンファイルテスト: 2人日
  - 拡張と最適化: 2人日

### 期待されるメリット

1. **テスト可読性の向上**
   - teatestによる一貫した構造で可読性向上
   - イベントシーケンスの明示的表現

2. **テスト品質の向上**
   - 視覚的出力の自動検証
   - 環境差異による不安定性の軽減

3. **開発効率の向上**
   - テスト実装の簡素化
   - バグ検出能力の向上
   - CI/CD統合の容易化

4. **メンテナンス性の向上**
   - 一貫したAPI利用
   - 将来の機能追加時のテスト実装容易化

### リスク要因と軽減策

| リスク | 影響度 | 可能性 | 軽減策 |
|-------|-------|-------|-------|
| CI環境での不安定性 | 高 | 中 | カラープロファイル固定、環境変数の標準化 |
| ゴールデンファイル管理の複雑さ | 中 | 低 | 明確な更新ルールと`.gitattributes`の設定 |
| 既存機能の退行 | 高 | 低 | 段階的移行と各フェーズでの検証 |
| 学習コスト | 低 | 低 | すでに一部導入済みで基本的な知識はある |

## 5. 実装アプローチの詳細

### 5.1 状態検証改善パターン

teatestを使用した状態検証は、モデル操作後の最終状態を簡潔に取得できます。特に複数のイベント連鎖後の状態検証において効果的です：

```go
// 改善前: 複数のモデル変数と型アサーションの連鎖
model1, _ := model.Update(msg1)
model2, _ := model1.(Model).Update(msg2)
model3, _ := model2.(Model).Update(msg3)
// 状態検証...

// 改善後: 連続したイベント送信と最終状態の検証
tm := teatest.NewTestModel(t, InitialModel())
tm.Send(msg1)
tm.Send(msg2)
tm.Send(msg3)
finalModel := tm.FinalModel(t).(Model)
// 状態検証...
```

### 5.2 ゴールデンファイル導入パターン

ゴールデンファイルは視覚的出力の正確な検証に効果的です。特に画面レイアウトやスタイル変更の影響を検証する際に有用です：

```go
func TestFullOutput(t *testing.T) {
    // 一貫した環境サイズ設定
    tm := teatest.NewTestModel(t, InitialModel(),
        teatest.WithInitialTermSize(80, 24))

    // テスト実行とイベント送信
    tm.Send(tea.KeyMsg{Type: tea.KeyDown})

    // 最終出力の取得
    output, _ := io.ReadAll(tm.FinalOutput(t))

    // ゴールデンファイルとの比較
    // 初回実行や -update フラグ使用時に自動生成
    teatest.RequireEqualOutput(t, output)
}
```

ゴールデンファイル更新コマンド:
```bash
go test -v ./internal/ui/ -update
```

### 5.3 設定ファイル例

`.gitattributes` ファイル（ゴールデンファイル管理用）:
```
*.golden -text
internal/ui/testdata/golden/* -text
```

テスト環境設定（テスト初期化時）:
```go
func init() {
    // ASCIIカラープロファイルに固定（色なし）
    lipgloss.SetColorProfile(termenv.Ascii)

    // または一貫した色プロファイル
    // lipgloss.SetColorProfile(termenv.ANSI256)
}
```

## 6. まとめと推奨事項

teatestライブラリへの完全移行は、現状の小規模なテスト体系では比較的低コストで実現可能です。すでに基本的な導入が行われており、ディレクトリ構造も整備されているため、スムーズな移行が期待できます。

特に推奨される事項は以下の通りです：

1. **段階的アプローチ**: 単純なテストから順次移行し、各段階で検証
2. **ゴールデンファイルの活用**: 視覚的出力のテストを自動化
3. **環境の標準化**: CI環境との一貫性を確保
4. **拡張性の考慮**: 将来の機能追加に備えたテスト基盤の整備

移行完了後は、テストの可読性、保守性、および信頼性が向上し、開発効率の向上につながると考えられます。