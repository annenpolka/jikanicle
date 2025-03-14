package ui

import (
	"context"
	"errors"
	"strings"
	"testing"

	tea "github.com/charmbracelet/bubbletea"
	"github.com/charmbracelet/lipgloss"
	"github.com/charmbracelet/x/exp/teatest"
	"github.com/muesli/termenv"

	"github.com/annenpolka/jikanicle/internal/domain/task"
)

// モックタスクリポジトリ
type mockTaskRepository struct {
	tasks     []*task.Task
	findErr   error
	saveErr   error
	deleteErr error
	save      func(ctx context.Context, t *task.Task) error
}

func (m *mockTaskRepository) FindByID(ctx context.Context, id string) (*task.Task, error) {
	if m.findErr != nil {
		return nil, m.findErr
	}

	for _, t := range m.tasks {
		if t.ID == id {
			return t, nil
		}
	}
	return nil, task.ErrTaskNotFound
}

func (m *mockTaskRepository) FindAll(ctx context.Context) ([]*task.Task, error) {
	if m.findErr != nil {
		return nil, m.findErr
	}
	return m.tasks, nil
}

func (m *mockTaskRepository) FindByStatus(ctx context.Context, status task.Status) ([]*task.Task, error) {
	if m.findErr != nil {
		return nil, m.findErr
	}

	var filtered []*task.Task
	for _, t := range m.tasks {
		if t.Status == status {
			filtered = append(filtered, t)
		}
	}
	return filtered, nil
}

func (m *mockTaskRepository) FindByCategory(ctx context.Context, category task.Category) ([]*task.Task, error) {
	if m.findErr != nil {
		return nil, m.findErr
	}

	var filtered []*task.Task
	for _, t := range m.tasks {
		if t.Category == category {
			filtered = append(filtered, t)
		}
	}
	return filtered, nil
}

func (m *mockTaskRepository) Save(ctx context.Context, t *task.Task) error {
	if m.save != nil {
		return m.save(ctx, t)
	}

	if m.saveErr != nil {
		return m.saveErr
	}

	// 既存タスクの更新または新規タスクの追加
	for i, existingTask := range m.tasks {
		if existingTask.ID == t.ID {
			m.tasks[i] = t
			return nil
		}
	}

	m.tasks = append(m.tasks, t)
	return nil
}

func (m *mockTaskRepository) Delete(ctx context.Context, id string) error {
	if m.deleteErr != nil {
		return m.deleteErr
	}

	for i, t := range m.tasks {
		if t.ID == id {
			m.tasks = append(m.tasks[:i], m.tasks[i+1:]...)
			return nil
		}
	}
	return task.ErrTaskNotFound
}

// テストヘルパー関数：テスト用のタスクリストを作成
func createTestTasks() []*task.Task {
	task1, _ := task.NewTask("task-1", "最初のタスク", "詳細説明1", task.CategoryWork, 30)
	task2, _ := task.NewTask("task-2", "二番目のタスク", "詳細説明2", task.CategoryPersonal, 60)
	task3, _ := task.NewTask("task-3", "三番目のタスク", "詳細説明3", task.CategoryGrowth, 45)

	// 一部のタスクのステータスを変更
	_ = task2.MarkInProgress()
	_ = task3.MarkCompleted()

	return []*task.Task{task1, task2, task3}
}

func init() {
	// テスト環境では色なしに設定
	lipgloss.SetColorProfile(termenv.Ascii)
}

// TestModelWithTaskRepository はタスクリポジトリと連携したUIモデルの動作をテストします
func TestModelWithTaskRepository(t *testing.T) {
	// モックリポジトリを準備
	mockRepo := &mockTaskRepository{
		tasks: createTestTasks(),
	}

	// タスクリポジトリを使用するモデルを作成
	model := NewModelWithRepository(mockRepo)

	// teatestを使用してテスト環境を構築
	tm := teatest.NewTestModel(t, model)

	// プログラムを終了
	_ = tm.Quit()

	// 最終モデルを取得
	finalModel := tm.FinalModel(t).(Model)

	// タスクが正しく読み込まれていることを確認
	expectedTaskCount := len(mockRepo.tasks)
	if len(finalModel.Tasks) != expectedTaskCount {
		t.Errorf("タスク数が一致しません - got: %d, want: %d", len(finalModel.Tasks), expectedTaskCount)
	}

	// リポジトリからTaskオブジェクトが正しく取得されていることを確認
	for i, task := range mockRepo.tasks {
		if finalModel.TaskObjects[i].ID != task.ID || finalModel.TaskObjects[i].Name != task.Name {
			t.Errorf("タスク[%d]の内容が一致しません - got: %v, want: %v", i, finalModel.TaskObjects[i], task)
		}
	}
}

// TestModelWithRepositoryError はリポジトリでエラーが発生した場合のUIモデルの動作をテストします
func TestModelWithRepositoryError(t *testing.T) {
	// エラーを返すモックリポジトリを準備
	mockRepo := &mockTaskRepository{
		findErr: errors.New("repository connection error"),
	}

	// タスクリポジトリを使用するモデルを作成
	model := NewModelWithRepository(mockRepo)

	// teatestを使用してテスト環境を構築
	tm := teatest.NewTestModel(t, model)

	// プログラムを終了
	_ = tm.Quit()

	// 最終モデルを取得
	finalModel := tm.FinalModel(t).(Model)

	// エラーメッセージが設定されているか確認
	if finalModel.ErrorMsg == "" {
		t.Error("リポジトリエラー時にエラーメッセージが設定されていません")
	}

	// エラー発生時には空のタスクリストになっているか確認
	if len(finalModel.Tasks) != 0 || len(finalModel.TaskObjects) != 0 {
		t.Error("リポジトリエラー時にタスクリストが空になっていません")
	}
}

// TestLoadTasksCommand はタスク読み込みコマンドの動作をテストします
func TestLoadTasksCommand(t *testing.T) {
	// モックリポジトリを準備
	mockRepo := &mockTaskRepository{
		tasks: createTestTasks(),
	}

	// モデルを作成
	model := NewModelWithRepository(mockRepo)
	model.TaskObjects = nil // 一旦クリア

	// LoadTasksコマンドを実行
	cmd := model.LoadTasks()

	// teatestを使用してコマンドを実行
	tm := teatest.NewTestModel(t, model)
	tm.Send(cmd())

	// プログラムを終了
	_ = tm.Quit()

	// 最終モデルを取得
	finalModel := tm.FinalModel(t).(Model)

	// タスクが正しく読み込まれていることを確認
	expectedTaskCount := len(mockRepo.tasks)
	if len(finalModel.TaskObjects) != expectedTaskCount {
		t.Errorf("LoadTasksコマンド後のタスク数が一致しません - got: %d, want: %d",
			len(finalModel.TaskObjects), expectedTaskCount)
	}
}

// TestReloadTasksAfterError はエラー後の再読み込み機能をテストします
func TestReloadTasksAfterError(t *testing.T) {
	// 初回エラーを返し、2回目は成功するモックリポジトリ
	mockRepo := &mockTaskRepository{
		findErr: errors.New("temporary connection error"),
	}

	// モデルを作成
	model := NewModelWithRepository(mockRepo)

	// teatestを使用してテスト環境を構築
	tm := teatest.NewTestModel(t, model)

	// この時点でエラーが発生している

	// エラーをクリアしてタスクを設定
	mockRepo.findErr = nil
	mockRepo.tasks = createTestTasks()

	// リロードコマンドを送信
	tm.Send(model.LoadTasks()())

	// プログラムを終了
	_ = tm.Quit()

	// 最終モデルを取得
	finalModel := tm.FinalModel(t).(Model)

	// エラーがクリアされていることを確認
	if finalModel.ErrorMsg != "" {
		t.Errorf("リロード後もエラーメッセージが残っています: %s", finalModel.ErrorMsg)
	}

	// タスクが正しく読み込まれていることを確認
	expectedTaskCount := len(mockRepo.tasks)
	if len(finalModel.TaskObjects) != expectedTaskCount {
		t.Errorf("リロード後のタスク数が一致しません - got: %d, want: %d",
			len(finalModel.TaskObjects), expectedTaskCount)
	}
}

// TestUpdateTaskStatus はタスクのステータス変更と永続化をテストします
func TestUpdateTaskStatus(t *testing.T) {
	// 保存されたタスクを捕捉するための変数
	var savedTask *task.Task

	// カスタムセーブ関数を持つモックリポジトリを準備
	mockRepo := &mockTaskRepository{
		tasks: createTestTasks(),
		save: func(ctx context.Context, t *task.Task) error {
			savedTask = t
			return nil
		},
	}

	// モデルを作成
	model := NewModelWithRepository(mockRepo)

	// テスト環境を構築
	tm := teatest.NewTestModel(t, model)

	// カーソルを0に設定（最初のタスク）
	targetTaskIndex := 0
	model.Cursor = targetTaskIndex

	// UpdateTaskStatusコマンドを直接実行
	cmd := model.UpdateTaskStatus(targetTaskIndex, task.StatusInProgress)
	tm.Send(cmd())

	// プログラムを終了
	_ = tm.Quit()

	// タスクのステータスが変更され、保存されたことを確認
	if savedTask == nil {
		t.Error("タスクが保存されていません")
	} else {
		if savedTask.ID != mockRepo.tasks[targetTaskIndex].ID {
			t.Errorf("異なるタスクが保存されました - got: %s, want: %s",
				savedTask.ID, mockRepo.tasks[targetTaskIndex].ID)
		}

		if savedTask.Status != task.StatusInProgress {
			t.Errorf("タスクのステータスが変更されていません - got: %s, want: %s",
				savedTask.Status, task.StatusInProgress)
		}
	}
}

// TestUpdateTaskStatusError はタスク更新時のエラー処理をテストします
func TestUpdateTaskStatusError(t *testing.T) {
	// エラーを返すモックリポジトリを準備
	mockRepo := &mockTaskRepository{
		tasks: createTestTasks(),
		saveErr: errors.New("save operation failed"),
	}

	// モデルを作成
	model := NewModelWithRepository(mockRepo)

	// カーソルを0に設定（最初のタスク）
	targetTaskIndex := 0
	model.Cursor = targetTaskIndex

	// teatestを使用してテスト環境を構築
	tm := teatest.NewTestModel(t, model)

	// UpdateTaskStatusコマンドを直接実行
	cmd := model.UpdateTaskStatus(targetTaskIndex, task.StatusCompleted)
	tm.Send(cmd())

	// プログラムを終了
	_ = tm.Quit()

	// 最終モデルを取得
	finalModel := tm.FinalModel(t).(Model)

	// エラーメッセージが設定されているか確認
	if !contains(finalModel.ErrorMsg, "save operation failed") {
		t.Errorf("保存エラー時に適切なエラーメッセージが設定されていません: %s", finalModel.ErrorMsg)
	}
}

// TestCycleTaskStatus はタスクステータスのサイクル機能をテストします
func TestCycleTaskStatus(t *testing.T) {
	// 保存されたタスクと状態を捕捉するための変数
	var savedTask *task.Task
	var stateHistory []task.Status

	// カスタムセーブ関数を持つモックリポジトリを準備
	mockRepo := &mockTaskRepository{
		tasks: createTestTasks(),
		save: func(ctx context.Context, t *task.Task) error {
			savedTask = t
			stateHistory = append(stateHistory, t.Status)
			return nil
		},
	}

	// モデルを作成
	model := NewModelWithRepository(mockRepo)

	// カーソルを0に設定（最初のタスク）
	targetTaskIndex := 0
	model.Cursor = targetTaskIndex
	initialStatus := model.TaskObjects[targetTaskIndex].Status

	// テスト環境を構築
	tm := teatest.NewTestModel(t, model)

	// サイクルを3回実行して一巡することを確認
	// 最初はNotStarted -> InProgress
	cmd := model.CycleTaskStatus(targetTaskIndex)
	tm.Send(cmd())

	// 次にInProgress -> Completed
	cmd = model.CycleTaskStatus(targetTaskIndex)
	tm.Send(cmd())

	// 最後にCompleted -> NotStarted
	cmd = model.CycleTaskStatus(targetTaskIndex)
	tm.Send(cmd())

	// プログラムを終了
	_ = tm.Quit()

	// 状態の変化が正しい順序で記録されているか確認
	expectedStates := []task.Status{
		task.StatusInProgress,
		task.StatusCompleted,
		task.StatusNotStarted,
	}

	if len(stateHistory) != len(expectedStates) {
		t.Errorf("状態変化の回数が期待値と異なります - got: %d, want: %d",
			len(stateHistory), len(expectedStates))
	}

	for i, status := range stateHistory {
		if i < len(expectedStates) && status != expectedStates[i] {
			t.Errorf("状態変化[%d]が期待値と異なります - got: %s, want: %s",
				i, status, expectedStates[i])
		}
	}

	// 最終的に元のステータスに戻っているか確認
	if savedTask.Status != initialStatus {
		t.Errorf("サイクル後の状態が初期状態と異なります - got: %s, want: %s",
			savedTask.Status, initialStatus)
	}
}

// TestEnterKeyCyclesStatus はエンターキーでステータスがサイクルすることをテストします
func TestEnterKeyCyclesStatus(t *testing.T) {
	// 保存されたタスクを捕捉するための変数
	var savedTask *task.Task

	// カスタムセーブ関数を持つモックリポジトリを準備
	mockRepo := &mockTaskRepository{
		tasks: createTestTasks(),
		save: func(ctx context.Context, t *task.Task) error {
			savedTask = t
			return nil
		},
	}

	// モデルを作成
	model := NewModelWithRepository(mockRepo)

	// カーソルを0に設定（最初のタスク）
	model.Cursor = 0

	// テスト環境を構築
	tm := teatest.NewTestModel(t, model)

	// Enterキーを送信
	tm.Send(tea.KeyMsg{Type: tea.KeyEnter})

	// プログラムを終了
	_ = tm.Quit()

	// タスクのステータスが変更され、保存されたことを確認
	if savedTask == nil {
		t.Error("タスクが保存されていません")
	} else {
		expectedStatus := task.StatusInProgress // NotStarted -> InProgress
		if savedTask.Status != expectedStatus {
			t.Errorf("タスクのステータスが期待通りに変更されていません - got: %s, want: %s",
				savedTask.Status, expectedStatus)
		}
	}
}

// contains はstring内に部分文字列が含まれるかチェックするヘルパー関数
func contains(s, substr string) bool {
	return strings.Contains(s, substr)
}