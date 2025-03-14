package ui

import (
	"strings"
	"testing"

	tea "github.com/charmbracelet/bubbletea"
	"github.com/charmbracelet/lipgloss"
	"github.com/charmbracelet/x/exp/teatest"
	"github.com/muesli/termenv"
)

func init() {
	// ASCIIカラープロファイルに固定（色なし）
	lipgloss.SetColorProfile(termenv.Ascii)
}

// TestInitialModel は初期モデルの状態を検証します
func TestInitialModel(t *testing.T) {
	// teatestを使用してテスト環境を構築
	tm := teatest.NewTestModel(t, InitialModel())

	// 何もイベントを送信せず、プログラムを終了
	_ = tm.Quit()

	// 最終モデルを取得して検証
	finalModel := tm.FinalModel(t).(Model)

	// 初期状態では少なくとも1つのタスクが存在するべき
	if len(finalModel.Tasks) < 1 {
		t.Errorf("初期モデルにタスクがありません。少なくとも1つのタスクが必要です")
	}

	// 初期状態ではカーソルは0位置にあるべき
	if finalModel.Cursor != 0 {
		t.Errorf("初期カーソル位置が0ではありません。got: %d, want: 0", finalModel.Cursor)
	}

	// 初期状態では選択されているタスクはないはず
	if len(finalModel.Selected) != 0 {
		t.Errorf("初期状態で選択されているタスクがあります。選択されているタスク数: %d", len(finalModel.Selected))
	}
}

// TestUpdateKeyDown はカーソル移動のキー操作をテストします
func TestUpdateKeyDown(t *testing.T) {
	// 初期モデルを作成
	model := InitialModel()

	// タスクが少なくとも2つあることを確認（テスト前提条件）
	if len(model.Tasks) < 2 {
		t.Skip("このテストには少なくとも2つのタスクが必要です")
	}

	// teatestを使用してテスト環境を構築
	tm := teatest.NewTestModel(t, model)

	// 下キーのメッセージを送信
	tm.Send(tea.KeyMsg{Type: tea.KeyDown})

	// プログラムを終了させて最終状態を取得
	_ = tm.Quit()

	// イベント処理後の最終モデルを取得
	finalModel := tm.FinalModel(t).(Model)

	// カーソルが1に移動しているか確認
	if finalModel.Cursor != 1 {
		t.Errorf("下キー押下後のカーソル位置が1ではありません。got: %d, want: 1", finalModel.Cursor)
	}
}

// TestView はビュー出力を検証します
func TestView(t *testing.T) {
	// teatestを使用してテスト環境を構築
	tm := teatest.NewTestModel(t, InitialModel())

	// 何もイベントを送信せず、プログラムを終了
	_ = tm.Quit()

	// 最終モデルを取得
	finalModel := tm.FinalModel(t).(Model)

	// 直接ビュー出力を取得
	view := finalModel.View()

	// アプリケーションタイトルが含まれているか確認
	expectedTitle := "Jikanicle"
	if !strings.Contains(view, expectedTitle) {
		t.Errorf("ビュー出力にアプリケーションタイトル '%s' が含まれていません", expectedTitle)
	}
}

// TestCursorNavigation はカーソル操作の一連の動作をテストします
func TestCursorNavigation(t *testing.T) {
	// 初期モデルを作成
	model := InitialModel()

	// タスクが少なくとも3つあることを確認（テスト前提条件）
	if len(model.Tasks) < 3 {
		t.Skip("このテストには少なくとも3つのタスクが必要です")
	}

	// teatestを使用してテスト環境を構築
	tm := teatest.NewTestModel(t, model)

	// 下キーを2回送信
	tm.Send(tea.KeyMsg{Type: tea.KeyDown})
	tm.Send(tea.KeyMsg{Type: tea.KeyDown})

	// イベント処理後の中間状態を検証
	_ = tm.Quit()
	finalModel := tm.FinalModel(t).(Model)

	// カーソル位置が2になっているか確認
	if finalModel.Cursor != 2 {
		t.Errorf("2回の下キー押下後のカーソル位置が2ではありません。got: %d, want: 2", finalModel.Cursor)
	}

	// 上キーをテストするには新しいテストモデルを構築
	tm2 := teatest.NewTestModel(t, finalModel)

	// 上キーを1回送信
	tm2.Send(tea.KeyMsg{Type: tea.KeyUp})

	// イベント処理後の最終状態を検証
	_ = tm2.Quit()
	updatedModel := tm2.FinalModel(t).(Model)

	// カーソル位置が1に戻っているか確認
	if updatedModel.Cursor != 1 {
		t.Errorf("上キー押下後のカーソル位置が1ではありません。got: %d, want: 1", updatedModel.Cursor)
	}
}

// TestTaskStatusCycle はEnterキーによるタスクステータスサイクル機能をテストします
func TestTaskStatusCycle(t *testing.T) {
	// 初期モデルを作成（リポジトリなしのためステータス変更は永続化されない）
	model := InitialModel()

	// teatestを使用してテスト環境を構築
	tm := teatest.NewTestModel(t, model)

	// Enterキーでタスクのステータスをサイクル
	tm.Send(tea.KeyMsg{Type: tea.KeyEnter})

	// プログラムを終了させて状態を確認
	_ = tm.Quit()
	model1 := tm.FinalModel(t).(Model)

	// ステータスがサイクルする動作はリポジトリがないので実際は変更されないが、
	// 機能が呼び出されたことを確認するため、コマンドが実行されたことをチェック
	// （エラーメッセージなどが出ていないことを確認）
	if model1.ErrorMsg != "" {
		t.Errorf("Enterキー押下後にエラーメッセージが出ています: %s", model1.ErrorMsg)
	}

	// スペースキーでも同様に動作するかテスト
	tm2 := teatest.NewTestModel(t, model1)
	tm2.Send(tea.KeyMsg{Type: tea.KeySpace})

	// プログラムを終了させて状態を確認
	_ = tm2.Quit()
	model2 := tm2.FinalModel(t).(Model)

	// エラーがないことを確認
	if model2.ErrorMsg != "" {
		t.Errorf("Spaceキー押下後にエラーメッセージが出ています: %s", model2.ErrorMsg)
	}
}

// TestKeyboardNavigation はキーボード操作によるナビゲーションをテストします
func TestKeyboardNavigation(t *testing.T) {
	// teatestを使用してテスト環境を構築
	tm := teatest.NewTestModel(t, InitialModel())

	// キーイベントを送信
	tm.Send(tea.KeyMsg{Type: tea.KeyDown})
	tm.Send(tea.KeyMsg{Type: tea.KeySpace})

	// プログラムを終了させて最終状態を取得
	_ = tm.Quit()
	finalModel := tm.FinalModel(t).(Model)

	// 下キーでカーソルが移動していることを確認
	if finalModel.Cursor != 1 {
		t.Errorf("カーソル位置が期待値と異なります。got: %d, want: 1", finalModel.Cursor)
	}

	// エラーがないことを確認
	if finalModel.ErrorMsg != "" {
		t.Errorf("操作後にエラーメッセージが出ています: %s", finalModel.ErrorMsg)
	}
}
