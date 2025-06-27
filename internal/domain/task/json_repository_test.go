package task

import (
	"context"
	"os"
	"path/filepath"
	"testing"
)

func TestJSONRepository(t *testing.T) {
	// テスト用の一時ディレクトリを作成
	tempDir, err := os.MkdirTemp("", "task-json-repo-test")
	if err != nil {
		t.Fatalf("Failed to create temp directory: %v", err)
	}
	defer os.RemoveAll(tempDir)

	// JSONリポジトリの初期化
	jsonFile := filepath.Join(tempDir, "tasks.json")
	repo, err := NewJSONRepository(jsonFile)
	if err != nil {
		t.Fatalf("Failed to create JSONRepository: %v", err)
	}

	ctx := context.Background()

	// タスクが空の状態でFindAllを呼び出し
	tasks, err := repo.FindAll(ctx)
	if err != nil {
		t.Errorf("FindAll() on empty repository error = %v", err)
	}
	if len(tasks) != 0 {
		t.Errorf("FindAll() on empty repository returned %d tasks, want 0", len(tasks))
	}

	// テスト用のタスクを作成
	task1, _ := NewTask("task1", "Task 1", "Description 1", CategoryWork, 30)
	task2, _ := NewTask("task2", "Task 2", "Description 2", CategoryPersonal, 60)
	task2.MarkInProgress()

	// タスクを保存
	err = repo.Save(ctx, task1)
	if err != nil {
		t.Errorf("Save() task1 error = %v", err)
	}

	err = repo.Save(ctx, task2)
	if err != nil {
		t.Errorf("Save() task2 error = %v", err)
	}

	// IDによるタスク検索
	savedTask1, err := repo.FindByID(ctx, "task1")
	if err != nil {
		t.Errorf("FindByID() task1 error = %v", err)
	}
	if savedTask1.ID != task1.ID || savedTask1.Name != task1.Name {
		t.Errorf("FindByID() task1 = %v, want %v", savedTask1, task1)
	}

	// ステータスによるタスク検索
	inProgressTasks, err := repo.FindByStatus(ctx, StatusInProgress)
	if err != nil {
		t.Errorf("FindByStatus() error = %v", err)
	}
	if len(inProgressTasks) != 1 || inProgressTasks[0].ID != "task2" {
		t.Errorf("FindByStatus() returned %d tasks, want 1 with ID task2", len(inProgressTasks))
	}

	// カテゴリによるタスク検索
	workTasks, err := repo.FindByCategory(ctx, CategoryWork)
	if err != nil {
		t.Errorf("FindByCategory() error = %v", err)
	}
	if len(workTasks) != 1 || workTasks[0].ID != "task1" {
		t.Errorf("FindByCategory() returned %d tasks, want 1 with ID task1", len(workTasks))
	}

	// 全タスク取得
	allTasks, err := repo.FindAll(ctx)
	if err != nil {
		t.Errorf("FindAll() error = %v", err)
	}
	if len(allTasks) != 2 {
		t.Errorf("FindAll() returned %d tasks, want 2", len(allTasks))
	}

	// タスク削除
	err = repo.Delete(ctx, "task1")
	if err != nil {
		t.Errorf("Delete() error = %v", err)
	}

	// 削除後に確認
	_, err = repo.FindByID(ctx, "task1")
	if err == nil {
		t.Error("FindByID() after delete should return error, got nil")
	}
	if err != ErrTaskNotFound {
		t.Errorf("FindByID() after delete error = %v, want %v", err, ErrTaskNotFound)
	}

	// 存在しないタスクの削除
	err = repo.Delete(ctx, "nonexistent")
	if err == nil {
		t.Error("Delete() nonexistent task should return error, got nil")
	}
	if err != ErrTaskNotFound {
		t.Errorf("Delete() nonexistent task error = %v, want %v", err, ErrTaskNotFound)
	}
}

func TestJSONRepositoryPersistence(t *testing.T) {
	// テスト用の一時ディレクトリを作成
	tempDir, err := os.MkdirTemp("", "task-json-repo-persistence-test")
	if err != nil {
		t.Fatalf("Failed to create temp directory: %v", err)
	}
	defer os.RemoveAll(tempDir)

	jsonFile := filepath.Join(tempDir, "tasks.json")
	ctx := context.Background()

	// 1つ目のリポジトリインスタンスでタスクを保存
	repo1, err := NewJSONRepository(jsonFile)
	if err != nil {
		t.Fatalf("Failed to create first JSONRepository: %v", err)
	}

	task, _ := NewTask("task1", "Persistent Task", "Test persistence", CategoryWork, 45)
	task.MarkInProgress()

	err = repo1.Save(ctx, task)
	if err != nil {
		t.Errorf("Save() error = %v", err)
	}

	// 2つ目のリポジトリインスタンスを作成し、保存したタスクが読み込めるか確認
	repo2, err := NewJSONRepository(jsonFile)
	if err != nil {
		t.Fatalf("Failed to create second JSONRepository: %v", err)
	}

	loadedTask, err := repo2.FindByID(ctx, "task1")
	if err != nil {
		t.Errorf("FindByID() from second repository error = %v", err)
	}

	if loadedTask.ID != task.ID || loadedTask.Name != task.Name || loadedTask.Status != task.Status {
		t.Errorf("Loaded task = %v, want %v", loadedTask, task)
	}
}

func TestJSONRepositoryErrors(t *testing.T) {
	// 無効なパスでのリポジトリ初期化テスト
	invalidDir := "/invalid/directory/path"
	_, err := NewJSONRepository(filepath.Join(invalidDir, "tasks.json"))
	if err == nil {
		t.Error("NewJSONRepository() with invalid path should return error, got nil")
	}

	// テスト用の一時ディレクトリを作成
	tempDir, err := os.MkdirTemp("", "task-json-repo-errors-test")
	if err != nil {
		t.Fatalf("Failed to create temp directory: %v", err)
	}
	defer os.RemoveAll(tempDir)

	jsonFile := filepath.Join(tempDir, "tasks.json")

	// 不正なJSONデータをファイルに書き込む
	invalidJSON := []byte(`{"tasks": [{"id": "task1", "invalid": JSON}]}`)
	err = os.WriteFile(jsonFile, invalidJSON, 0644)
	if err != nil {
		t.Fatalf("Failed to write invalid JSON: %v", err)
	}

	// 不正なJSONを読み込むとエラーになるか確認
	_, err = NewJSONRepository(jsonFile)
	if err == nil {
		t.Error("NewJSONRepository() with invalid JSON should return error, got nil")
	}
}