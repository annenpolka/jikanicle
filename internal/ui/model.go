package ui

import (
	"github.com/charmbracelet/bubbletea"
	"github.com/charmbracelet/lipgloss"
)

// Model はBubbleTeaのモデルインターフェースを実装するUI状態を表します
type Model struct {
	Tasks    []string          // タスクのリスト
	Cursor   int               // 現在のカーソル位置
	Selected map[int]struct{}  // 選択済みタスクのマップ
}

// スタイル定義
var (
	titleStyle = lipgloss.NewStyle().
		Bold(true).
		Foreground(lipgloss.Color("#FAFAFA")).
		Background(lipgloss.Color("#7D56F4")).
		PaddingLeft(2).
		PaddingRight(2)
)

// InitialModel は初期モデルを作成します
func InitialModel() Model {
	return Model{
		Tasks: []string{
			"Jikanicleプロジェクトの初期設定",
			"Bubbletea UIの実装",
			"タスク管理機能の実装",
		},
		Cursor:   0,
		Selected: make(map[int]struct{}),
	}
}

// Init はBubbleTeaのモデルインターフェースの一部です
func (m Model) Init() tea.Cmd {
	// 初期化時のコマンドがあればここで返します
	return nil
}

// Update はモデルを更新します
func (m Model) Update(msg tea.Msg) (tea.Model, tea.Cmd) {
	switch msg := msg.(type) {
	case tea.KeyMsg:
		switch msg.String() {
		case "ctrl+c", "q":
			return m, tea.Quit

		case "up", "k":
			if m.Cursor > 0 {
				m.Cursor--
			}

		case "down", "j":
			if m.Cursor < len(m.Tasks)-1 {
				m.Cursor++
			}

		case "enter", " ":
			_, ok := m.Selected[m.Cursor]
			if ok {
				delete(m.Selected, m.Cursor)
			} else {
				m.Selected[m.Cursor] = struct{}{}
			}
		}
	}

	return m, nil
}

// View はモデルを描画します
func (m Model) View() string {
	s := titleStyle.Render("Jikanicle - タスク管理") + "\n\n"

	for i, task := range m.Tasks {
		cursor := " "
		if m.Cursor == i {
			cursor = ">"
		}

		checked := " "
		if _, ok := m.Selected[i]; ok {
			checked = "x"
		}

		s += cursor + " [" + checked + "] " + task + "\n"
	}

	s += "\nPress q to quit.\n"

	return s
}