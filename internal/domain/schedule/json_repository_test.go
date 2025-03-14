package schedule

import (
	"context"
	"os"
	"path/filepath"
	"testing"
	"time"

	"github.com/annenpolka/jikanicle/internal/domain/task"
)

func TestScheduleJSONRepository(t *testing.T) {
	// テスト用の一時ディレクトリを作成
	tempDir, err := os.MkdirTemp("", "schedule-json-repo-test")
	if err != nil {
		t.Fatalf("Failed to create temp directory: %v", err)
	}
	defer os.RemoveAll(tempDir)

	// JSONリポジトリの初期化
	jsonFile := filepath.Join(tempDir, "schedules.json")
	repo, err := NewJSONRepository(jsonFile)
	if err != nil {
		t.Fatalf("Failed to create JSONRepository: %v", err)
	}

	ctx := context.Background()

	// DailyPlanが空の状態でFindAllを呼び出し
	plans, err := repo.FindAll(ctx)
	if err != nil {
		t.Errorf("FindAll() on empty repository error = %v", err)
	}
	if len(plans) != 0 {
		t.Errorf("FindAll() on empty repository returned %d plans, want 0", len(plans))
	}

	// テスト用の日付
	today := time.Now().Truncate(24 * time.Hour)
	tomorrow := today.AddDate(0, 0, 1)
	dayAfterTomorrow := today.AddDate(0, 0, 2)

	// テスト用のDailyPlanを作成
	plan1, _ := NewDailyPlan(today, 480) // 今日のプラン
	plan2, _ := NewDailyPlan(tomorrow, 480) // 明日のプラン

	// テスト用のタスクを作成して追加
	task1, _ := task.NewTask("task1", "Task 1", "Description 1", task.CategoryWork, 60)
	task2, _ := task.NewTask("task2", "Task 2", "Description 2", task.CategoryPersonal, 120)
	task3, _ := task.NewTask("task3", "Task 3", "Description 3", task.CategoryGrowth, 90)

	plan1.AddTask(task1)
	plan1.AddTask(task2)
	plan2.AddTask(task3)

	// DailyPlanを保存
	err = repo.Save(ctx, plan1)
	if err != nil {
		t.Errorf("Save() plan1 error = %v", err)
	}

	err = repo.Save(ctx, plan2)
	if err != nil {
		t.Errorf("Save() plan2 error = %v", err)
	}

	// 日付によるDailyPlan検索
	savedPlan1, err := repo.FindByDate(ctx, today)
	if err != nil {
		t.Errorf("FindByDate() today error = %v", err)
	}
	if savedPlan1 == nil || savedPlan1.Date.Format("2006-01-02") != today.Format("2006-01-02") {
		t.Errorf("FindByDate() returned plan with incorrect date, got %v, want %v",
			savedPlan1.Date.Format("2006-01-02"), today.Format("2006-01-02"))
	}
	if len(savedPlan1.Tasks) != 2 {
		t.Errorf("FindByDate() plan has %d tasks, want 2", len(savedPlan1.Tasks))
	}

	// 日付範囲によるDailyPlan検索
	rangePlans, err := repo.FindByDateRange(ctx, today, tomorrow)
	if err != nil {
		t.Errorf("FindByDateRange() error = %v", err)
	}
	if len(rangePlans) != 2 {
		t.Errorf("FindByDateRange() returned %d plans, want 2", len(rangePlans))
	}

	// 範囲外の日付によるDailyPlan検索
	outOfRangePlans, err := repo.FindByDateRange(ctx, dayAfterTomorrow, dayAfterTomorrow.AddDate(0, 0, 1))
	if err != nil {
		t.Errorf("FindByDateRange() out of range error = %v", err)
	}
	if len(outOfRangePlans) != 0 {
		t.Errorf("FindByDateRange() out of range returned %d plans, want 0", len(outOfRangePlans))
	}

	// 存在しない日付のDailyPlan検索
	_, err = repo.FindByDate(ctx, dayAfterTomorrow)
	if err == nil {
		t.Error("FindByDate() nonexistent date should return error, got nil")
	}
	if err != ErrDailyPlanNotFound {
		t.Errorf("FindByDate() nonexistent date error = %v, want %v", err, ErrDailyPlanNotFound)
	}

	// 全DailyPlan取得
	allPlans, err := repo.FindAll(ctx)
	if err != nil {
		t.Errorf("FindAll() error = %v", err)
	}
	if len(allPlans) != 2 {
		t.Errorf("FindAll() returned %d plans, want 2", len(allPlans))
	}

	// DailyPlan削除
	err = repo.Delete(ctx, today)
	if err != nil {
		t.Errorf("Delete() error = %v", err)
	}

	// 削除後に確認
	_, err = repo.FindByDate(ctx, today)
	if err == nil {
		t.Error("FindByDate() after delete should return error, got nil")
	}
	if err != ErrDailyPlanNotFound {
		t.Errorf("FindByDate() after delete error = %v, want %v", err, ErrDailyPlanNotFound)
	}

	// 存在しない日付のDailyPlan削除
	err = repo.Delete(ctx, dayAfterTomorrow)
	if err == nil {
		t.Error("Delete() nonexistent date should return error, got nil")
	}
	if err != ErrDailyPlanNotFound {
		t.Errorf("Delete() nonexistent date error = %v, want %v", err, ErrDailyPlanNotFound)
	}
}

func TestScheduleJSONRepositoryPersistence(t *testing.T) {
	// テスト用の一時ディレクトリを作成
	tempDir, err := os.MkdirTemp("", "schedule-json-repo-persistence-test")
	if err != nil {
		t.Fatalf("Failed to create temp directory: %v", err)
	}
	defer os.RemoveAll(tempDir)

	jsonFile := filepath.Join(tempDir, "schedules.json")
	ctx := context.Background()
	today := time.Now().Truncate(24 * time.Hour)

	// 1つ目のリポジトリインスタンスでDailyPlanを保存
	repo1, err := NewJSONRepository(jsonFile)
	if err != nil {
		t.Fatalf("Failed to create first JSONRepository: %v", err)
	}

	plan, _ := NewDailyPlan(today, 480)
	task1, _ := task.NewTask("task1", "Persistent Task", "Test persistence", task.CategoryWork, 60)
	plan.AddTask(task1)

	err = repo1.Save(ctx, plan)
	if err != nil {
		t.Errorf("Save() error = %v", err)
	}

	// 2つ目のリポジトリインスタンスを作成し、保存したDailyPlanが読み込めるか確認
	repo2, err := NewJSONRepository(jsonFile)
	if err != nil {
		t.Fatalf("Failed to create second JSONRepository: %v", err)
	}

	loadedPlan, err := repo2.FindByDate(ctx, today)
	if err != nil {
		t.Errorf("FindByDate() from second repository error = %v", err)
	}

	if loadedPlan.Date.Format("2006-01-02") != today.Format("2006-01-02") || loadedPlan.AvailableMinutes != 480 {
		t.Errorf("Loaded plan date = %v, want %v", loadedPlan.Date.Format("2006-01-02"), today.Format("2006-01-02"))
	}

	if len(loadedPlan.Tasks) != 1 {
		t.Errorf("Loaded plan has %d tasks, want 1", len(loadedPlan.Tasks))
	}

	if loadedPlan.Tasks[0].ID != "task1" {
		t.Errorf("Loaded task ID = %v, want %v", loadedPlan.Tasks[0].ID, "task1")
	}
}

func TestScheduleJSONRepositoryErrors(t *testing.T) {
	// 無効なパスでのリポジトリ初期化テスト
	invalidDir := "/invalid/directory/path"
	_, err := NewJSONRepository(filepath.Join(invalidDir, "schedules.json"))
	if err == nil {
		t.Error("NewJSONRepository() with invalid path should return error, got nil")
	}

	// テスト用の一時ディレクトリを作成
	tempDir, err := os.MkdirTemp("", "schedule-json-repo-errors-test")
	if err != nil {
		t.Fatalf("Failed to create temp directory: %v", err)
	}
	defer os.RemoveAll(tempDir)

	jsonFile := filepath.Join(tempDir, "schedules.json")

	// 不正なJSONデータをファイルに書き込む
	invalidJSON := []byte(`{"dailyPlans": [{"date": "2023-01-01", "invalid": JSON}]}`)
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