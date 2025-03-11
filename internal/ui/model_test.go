package ui

import (
	"strings"
	"testing"

	tea "github.com/charmbracelet/bubbletea"
)

func TestInitialModel(t *testing.T) {
	// 初期モデルが正しく作成されることを確認するテスト
	model := InitialModel()

	// 初期状態では少なくとも1つのタスクが存在するべき
	if len(model.Tasks) < 1 {
		t.Errorf("初期モデルにタスクがありません。少なくとも1つのタスクが必要です")
	}

	// 初期状態ではカーソルは0位置にあるべき
	if model.Cursor != 0 {
		t.Errorf("初期カーソル位置が0ではありません。got: %d, want: 0", model.Cursor)
	}

	// 初期状態では選択されているタスクはないはず
	if len(model.Selected) != 0 {
		t.Errorf("初期状態で選択されているタスクがあります。選択されているタスク数: %d", len(model.Selected))
	}
}

func TestUpdateKeyDown(t *testing.T) {
	// カーソルが下に移動することを確認するテスト
	model := InitialModel()

	// タスクが少なくとも2つあることを確認（テスト前提条件）
	if len(model.Tasks) < 2 {
		t.Skip("このテストには少なくとも2つのタスクが必要です")
	}

	// 下キーのメッセージをシミュレート
	keyMsg := tea.KeyMsg{Type: tea.KeyDown}
	updatedModel, _ := model.Update(keyMsg)

	// カーソルが1に移動しているはず
	updatedUIModel, ok := updatedModel.(Model)
	if !ok {
		t.Fatal("更新されたモデルがui.Modelに変換できません")
	}

	if updatedUIModel.Cursor != 1 {
		t.Errorf("下キー押下後のカーソル位置が1ではありません。got: %d, want: 1", updatedUIModel.Cursor)
	}
}

func TestView(t *testing.T) {
	// View関数がアプリケーションのタイトルを含むことを確認するテスト
	model := InitialModel()
	view := model.View()

	expectedTitle := "Jikanicle"
	if !strings.Contains(view, expectedTitle) {
		t.Errorf("ビュー出力にアプリケーションタイトル '%s' が含まれていません", expectedTitle)
	}
}
