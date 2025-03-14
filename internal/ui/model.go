package ui

import (
	"context"
	"fmt"

	tea "github.com/charmbracelet/bubbletea"
	"github.com/charmbracelet/lipgloss"

	"github.com/annenpolka/jikanicle/internal/domain/task"
)

// Model represents the UI state implementing the BubbleTea model interface
type Model struct {
	Tasks       []string         // Task list for display (name only)
	TaskObjects []*task.Task     // Actual task objects
	Cursor      int              // Current cursor position
	Selected    map[int]struct{} // Map of selected tasks
	Repository  task.Repository  // Task repository
	ErrorMsg    string           // Error message
	StatusMsg   string           // Status message for user feedback
}

// Style definitions
var (
	titleStyle = lipgloss.NewStyle().
		Bold(true).
		Foreground(lipgloss.Color("#FAFAFA")).
		Background(lipgloss.Color("#7D56F4")).
		PaddingLeft(2).
		PaddingRight(2)

	errorStyle = lipgloss.NewStyle().
		Foreground(lipgloss.Color("#FF0000")).
		Bold(true)
)

// InitialModel creates an initial model
func InitialModel() Model {
	return Model{
		Tasks: []string{
			"Initialize Jikanicle project",
			"Implement Bubbletea UI",
			"Implement task management features",
		},
		Cursor:   0,
		Selected: make(map[int]struct{}),
	}
}

// NewModelWithRepository creates a model using a task repository
func NewModelWithRepository(repo task.Repository) Model {
	model := Model{
		Cursor:      0,
		Selected:    make(map[int]struct{}),
		Repository:  repo,
		Tasks:       []string{},
		TaskObjects: []*task.Task{},
	}

	// Load tasks during initialization
	if repo != nil {
		ctx := context.Background()
		tasks, err := repo.FindAll(ctx)
		if err != nil {
			model.ErrorMsg = fmt.Sprintf("Failed to load tasks: %v", err)
			return model
		}

		model.TaskObjects = tasks
		model.Tasks = tasksToStrings(tasks)
	}

	return model
}

// LoadTasks returns a command to load tasks from the repository
func (m Model) LoadTasks() tea.Cmd {
	return func() tea.Msg {
		if m.Repository == nil {
			return TaskLoadError{Err: fmt.Errorf("repository not set")}
		}

		ctx := context.Background()
		tasks, err := m.Repository.FindAll(ctx)
		if err != nil {
			return TaskLoadError{Err: err}
		}

		return TaskLoadSuccess{Tasks: tasks}
	}
}

// Helper function to convert task objects to display strings
func tasksToStrings(tasks []*task.Task) []string {
	taskStrs := make([]string, len(tasks))
	for i, t := range tasks {
		status := ""
		switch t.Status {
		case task.StatusNotStarted:
			status = "[ ] "
		case task.StatusInProgress:
			status = "[IN PROGRESS] "
		case task.StatusCompleted:
			status = "[COMPLETED] "
		}
		taskStrs[i] = status + t.Name
	}
	return taskStrs
}

// TaskLoadSuccess is a message for successful task loading
type TaskLoadSuccess struct {
	Tasks []*task.Task
}

// TaskLoadError is a message for task loading errors
type TaskLoadError struct {
	Err error
}

// TaskStatusUpdateSuccess is a message for successful task status update
type TaskStatusUpdateSuccess struct {
	Task *task.Task
}

// TaskStatusUpdateError is a message for task status update errors
type TaskStatusUpdateError struct {
	Err error
}

// Init はBubbleTeaのモデルインターフェースの一部です
func (m Model) Init() tea.Cmd {
	// 初期化時のコマンドがあればここで返します
	return nil
}

// Update updates the model
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
			// タスクのステータスをサイクルする
			if m.Cursor >= 0 && m.Cursor < len(m.TaskObjects) {
				return m, m.CycleTaskStatus(m.Cursor)
			}

		case "r":
			// Reload command
			return m, m.LoadTasks()

		case "p":
			// タスクをInProgressに変更
			if m.Cursor >= 0 && m.Cursor < len(m.TaskObjects) {
				return m, m.UpdateTaskStatus(m.Cursor, task.StatusInProgress)
			}

		case "c":
			// タスクをCompletedに変更
			if m.Cursor >= 0 && m.Cursor < len(m.TaskObjects) {
				return m, m.UpdateTaskStatus(m.Cursor, task.StatusCompleted)
			}

		case "n":
			// タスクをNotStartedに変更
			if m.Cursor >= 0 && m.Cursor < len(m.TaskObjects) {
				return m, m.UpdateTaskStatus(m.Cursor, task.StatusNotStarted)
			}
		}

	case TaskLoadSuccess:
		// Task loading success
		m.TaskObjects = msg.Tasks
		m.Tasks = tasksToStrings(msg.Tasks)
		m.ErrorMsg = "" // Clear error
		return m, nil

	case TaskLoadError:
		// Task loading error
		m.ErrorMsg = fmt.Sprintf("Failed to load tasks: %v", msg.Err)
		return m, nil

	case TaskStatusUpdateSuccess:
		// Task status update success
		m.StatusMsg = fmt.Sprintf("タスク「%s」のステータスを「%s」に更新しました",
			msg.Task.Name, msg.Task.Status)
		// タスクリストを更新
		return m, m.LoadTasks()

	case TaskStatusUpdateError:
		// Task status update error
		m.ErrorMsg = fmt.Sprintf("タスクの更新に失敗しました: %v", msg.Err)
		return m, nil
	}

	return m, nil
}

// View renders the model
func (m Model) View() string {
	s := titleStyle.Render("Jikanicle - Task Manager") + "\n\n"

	// Display error message if any
	if m.ErrorMsg != "" {
		s += errorStyle.Render("Error: " + m.ErrorMsg) + "\n\n"
	}

	for i, task := range m.Tasks {
		cursor := " "
		if m.Cursor == i {
			cursor = ">"
		}

		s += cursor + " " + task + "\n"
	}

	// ステータスメッセージがあれば表示
	if m.StatusMsg != "" {
		s += "\n" + m.StatusMsg + "\n"
	}

	s += "\nHelp: [Enter] Cycle Status, [p] Mark In Progress, [c] Mark Completed, [n] Mark Not Started, [r] Reload, [q] Quit\n"

	return s
}

// UpdateTaskStatus は指定されたタスクのステータスを更新するコマンドを返します
func (m Model) UpdateTaskStatus(index int, status task.Status) tea.Cmd {
	return func() tea.Msg {
		if m.Repository == nil {
			return TaskStatusUpdateError{Err: fmt.Errorf("repository not set")}
		}

		if index < 0 || index >= len(m.TaskObjects) {
			return TaskStatusUpdateError{Err: fmt.Errorf("invalid task index: %d", index)}
		}

		taskToUpdate := m.TaskObjects[index]

		// ステータスに応じて処理を分岐
		var err error
		switch status {
		case task.StatusInProgress:
			err = taskToUpdate.MarkInProgress()
		case task.StatusCompleted:
			err = taskToUpdate.MarkCompleted()
		case task.StatusNotStarted:
			// NotStartedに戻す特別な処理が必要なら追加
			taskToUpdate.Status = task.StatusNotStarted
		}

		if err != nil {
			return TaskStatusUpdateError{Err: err}
		}

		// リポジトリに保存
		ctx := context.Background()
		if err := m.Repository.Save(ctx, taskToUpdate); err != nil {
			return TaskStatusUpdateError{Err: err}
		}

		return TaskStatusUpdateSuccess{Task: taskToUpdate}
	}
}

// CycleTaskStatus は指定されたタスクのステータスを循環させるコマンドを返します
// NotStarted -> InProgress -> Completed -> NotStarted の順にサイクルします
func (m Model) CycleTaskStatus(index int) tea.Cmd {
	if index < 0 || index >= len(m.TaskObjects) {
		return func() tea.Msg {
			return TaskStatusUpdateError{Err: fmt.Errorf("invalid task index: %d", index)}
		}
	}

	taskToUpdate := m.TaskObjects[index]
	var nextStatus task.Status

	// 現在のステータスに基づいて次のステータスを決定
	switch taskToUpdate.Status {
	case task.StatusNotStarted:
		nextStatus = task.StatusInProgress
	case task.StatusInProgress:
		nextStatus = task.StatusCompleted
	case task.StatusCompleted:
		nextStatus = task.StatusNotStarted
	default:
		nextStatus = task.StatusNotStarted
	}

	// UpdateTaskStatusコマンドを使って実際に更新
	return m.UpdateTaskStatus(index, nextStatus)
}
