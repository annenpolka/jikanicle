package timeblock

import (
	"context"
	"os"
	"path/filepath"
	"testing"
	"time"
)

func TestTimeBlockJSONRepository(t *testing.T) {
	// テスト用の一時ディレクトリを作成
	tempDir, err := os.MkdirTemp("", "timeblock-json-repo-test")
	if err != nil {
		t.Fatalf("Failed to create temp directory: %v", err)
	}
	defer os.RemoveAll(tempDir)

	// JSONリポジトリの初期化
	jsonFile := filepath.Join(tempDir, "timeblocks.json")
	repo, err := NewJSONRepository(jsonFile)
	if err != nil {
		t.Fatalf("Failed to create JSONRepository: %v", err)
	}

	ctx := context.Background()

	// タイムブロックが空の状態でFindAllを呼び出し
	timeBlocks, err := repo.FindAll(ctx)
	if err != nil {
		t.Errorf("FindAll() on empty repository error = %v", err)
	}
	if len(timeBlocks) != 0 {
		t.Errorf("FindAll() on empty repository returned %d timeblocks, want 0", len(timeBlocks))
	}

	// テスト用のタイムブロックを作成
	now := time.Now()
	block1, _ := NewTimeBlock("block1", now, now.Add(60*time.Minute), "task1")
	block2, _ := NewTimeBlock("block2", now.Add(120*time.Minute), now.Add(180*time.Minute), "task2")

	// タイムブロックを保存
	err = repo.Save(ctx, block1)
	if err != nil {
		t.Errorf("Save() block1 error = %v", err)
	}

	err = repo.Save(ctx, block2)
	if err != nil {
		t.Errorf("Save() block2 error = %v", err)
	}

	// IDによるタイムブロック検索
	savedBlock1, err := repo.FindByID(ctx, "block1")
	if err != nil {
		t.Errorf("FindByID() block1 error = %v", err)
	}
	if savedBlock1.ID != block1.ID || savedBlock1.TaskID != block1.TaskID {
		t.Errorf("FindByID() block1 = %v, want %v", savedBlock1, block1)
	}

	// タスクIDによるタイムブロック検索
	task1Blocks, err := repo.FindByTaskID(ctx, "task1")
	if err != nil {
		t.Errorf("FindByTaskID() error = %v", err)
	}
	if len(task1Blocks) != 1 || task1Blocks[0].ID != "block1" {
		t.Errorf("FindByTaskID() returned %d blocks, want 1 with ID block1", len(task1Blocks))
	}

	// 時間範囲によるタイムブロック検索
	rangeBlocks, err := repo.FindByTimeRange(ctx, now, now.Add(240*time.Minute))
	if err != nil {
		t.Errorf("FindByTimeRange() error = %v", err)
	}
	if len(rangeBlocks) != 2 {
		t.Errorf("FindByTimeRange() returned %d blocks, want 2", len(rangeBlocks))
	}

	// 時間範囲外のタイムブロック検索
	outOfRangeBlocks, err := repo.FindByTimeRange(ctx, now.Add(240*time.Minute), now.Add(300*time.Minute))
	if err != nil {
		t.Errorf("FindByTimeRange() out of range error = %v", err)
	}
	if len(outOfRangeBlocks) != 0 {
		t.Errorf("FindByTimeRange() out of range returned %d blocks, want 0", len(outOfRangeBlocks))
	}

	// 全タイムブロック取得
	allBlocks, err := repo.FindAll(ctx)
	if err != nil {
		t.Errorf("FindAll() error = %v", err)
	}
	if len(allBlocks) != 2 {
		t.Errorf("FindAll() returned %d blocks, want 2", len(allBlocks))
	}

	// タイムブロック削除
	err = repo.Delete(ctx, "block1")
	if err != nil {
		t.Errorf("Delete() error = %v", err)
	}

	// 削除後に確認
	_, err = repo.FindByID(ctx, "block1")
	if err == nil {
		t.Error("FindByID() after delete should return error, got nil")
	}
	if err != ErrTimeBlockNotFound {
		t.Errorf("FindByID() after delete error = %v, want %v", err, ErrTimeBlockNotFound)
	}

	// 存在しないタイムブロックの削除
	err = repo.Delete(ctx, "nonexistent")
	if err == nil {
		t.Error("Delete() nonexistent block should return error, got nil")
	}
	if err != ErrTimeBlockNotFound {
		t.Errorf("Delete() nonexistent block error = %v, want %v", err, ErrTimeBlockNotFound)
	}
}

func TestTimeBlockJSONRepositoryPersistence(t *testing.T) {
	// テスト用の一時ディレクトリを作成
	tempDir, err := os.MkdirTemp("", "timeblock-json-repo-persistence-test")
	if err != nil {
		t.Fatalf("Failed to create temp directory: %v", err)
	}
	defer os.RemoveAll(tempDir)

	jsonFile := filepath.Join(tempDir, "timeblocks.json")
	ctx := context.Background()
	now := time.Now()

	// 1つ目のリポジトリインスタンスでタイムブロックを保存
	repo1, err := NewJSONRepository(jsonFile)
	if err != nil {
		t.Fatalf("Failed to create first JSONRepository: %v", err)
	}

	block, _ := NewTimeBlock("block1", now, now.Add(60*time.Minute), "task1")

	err = repo1.Save(ctx, block)
	if err != nil {
		t.Errorf("Save() error = %v", err)
	}

	// 2つ目のリポジトリインスタンスを作成し、保存したタイムブロックが読み込めるか確認
	repo2, err := NewJSONRepository(jsonFile)
	if err != nil {
		t.Fatalf("Failed to create second JSONRepository: %v", err)
	}

	loadedBlock, err := repo2.FindByID(ctx, "block1")
	if err != nil {
		t.Errorf("FindByID() from second repository error = %v", err)
	}

	if loadedBlock.ID != block.ID || loadedBlock.TaskID != block.TaskID {
		t.Errorf("Loaded block = %v, want %v", loadedBlock, block)
	}
}

func TestTimeBlockJSONRepositoryErrors(t *testing.T) {
	// 無効なパスでのリポジトリ初期化テスト
	invalidDir := "/invalid/directory/path"
	_, err := NewJSONRepository(filepath.Join(invalidDir, "timeblocks.json"))
	if err == nil {
		t.Error("NewJSONRepository() with invalid path should return error, got nil")
	}

	// テスト用の一時ディレクトリを作成
	tempDir, err := os.MkdirTemp("", "timeblock-json-repo-errors-test")
	if err != nil {
		t.Fatalf("Failed to create temp directory: %v", err)
	}
	defer os.RemoveAll(tempDir)

	jsonFile := filepath.Join(tempDir, "timeblocks.json")

	// 不正なJSONデータをファイルに書き込む
	invalidJSON := []byte(`{"timeblocks": [{"id": "block1", "invalid": JSON}]}`)
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