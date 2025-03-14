package schedule

import (
	"testing"
	"time"

	"github.com/annenpolka/jikanicle/internal/domain/task"
)

func TestNewTaskScheduler(t *testing.T) {
	date := time.Date(2025, 3, 14, 0, 0, 0, 0, time.Local)

	t.Run("有効な可処分時間", func(t *testing.T) {
		scheduler, err := NewTaskScheduler(date, 480) // 8時間

		if err != nil {
			t.Errorf("予期しないエラー: %v", err)
		}

		if scheduler.Date != date {
			t.Errorf("日付が異なる: got %v, want %v", scheduler.Date, date)
		}

		if scheduler.AvailableMinutes != 480 {
			t.Errorf("可処分時間が異なる: got %d, want %d", scheduler.AvailableMinutes, 480)
		}

		if scheduler.Balance != 480 {
			t.Errorf("残り時間が異なる: got %d, want %d", scheduler.Balance, 480)
		}

		if len(scheduler.Tasks) != 0 {
			t.Errorf("タスク数が異なる: got %d, want %d", len(scheduler.Tasks), 0)
		}
	})

	t.Run("無効な可処分時間", func(t *testing.T) {
		_, err := NewTaskScheduler(date, 0) // 0分

		if err == nil {
			t.Error("エラーが発生すべき")
		}

		_, err = NewTaskScheduler(date, -30) // -30分

		if err == nil {
			t.Error("エラーが発生すべき")
		}
	})
}

func TestAddTaskToScheduler(t *testing.T) {
	date := time.Date(2025, 3, 14, 0, 0, 0, 0, time.Local)
	scheduler, _ := NewTaskScheduler(date, 480) // 8時間

	task1, _ := task.NewTask("task1", "タスク1", "説明1", task.CategoryWork, 60)
	task2, _ := task.NewTask("task2", "タスク2", "説明2", task.CategoryPersonal, 90)

	t.Run("タスク追加", func(t *testing.T) {
		err := scheduler.AddTask(task1)

		if err != nil {
			t.Errorf("予期しないエラー: %v", err)
		}

		if len(scheduler.Tasks) != 1 {
			t.Errorf("タスク数が異なる: got %d, want %d", len(scheduler.Tasks), 1)
		}

		if scheduler.TotalEstimated != 60 {
			t.Errorf("合計時間が異なる: got %d, want %d", scheduler.TotalEstimated, 60)
		}

		if scheduler.Balance != 420 {
			t.Errorf("残り時間が異なる: got %d, want %d", scheduler.Balance, 420)
		}

		// 2つ目のタスク追加
		err = scheduler.AddTask(task2)

		if err != nil {
			t.Errorf("予期しないエラー: %v", err)
		}

		if len(scheduler.Tasks) != 2 {
			t.Errorf("タスク数が異なる: got %d, want %d", len(scheduler.Tasks), 2)
		}

		if scheduler.TotalEstimated != 150 {
			t.Errorf("合計時間が異なる: got %d, want %d", scheduler.TotalEstimated, 150)
		}

		if scheduler.Balance != 330 {
			t.Errorf("残り時間が異なる: got %d, want %d", scheduler.Balance, 330)
		}
	})

	t.Run("重複するタスク追加", func(t *testing.T) {
		// リセット
		scheduler, _ = NewTaskScheduler(date, 480)
		_ = scheduler.AddTask(task1)

		// 同じIDのタスクを追加
		task1Duplicate, _ := task.NewTask("task1", "タスク1のコピー", "説明1のコピー", task.CategoryGrowth, 45)
		err := scheduler.AddTask(task1Duplicate)

		if err == nil {
			t.Error("重複タスクはエラーになるべき")
		}

		if len(scheduler.Tasks) != 1 {
			t.Errorf("タスク数が異なる: got %d, want %d", len(scheduler.Tasks), 1)
		}
	})

	t.Run("可処分時間を超えるタスク追加", func(t *testing.T) {
		// リセット
		scheduler, _ = NewTaskScheduler(date, 30)

		// 30分の可処分時間に対して60分のタスクを追加
		err := scheduler.AddTask(task1)

		// エラーにはならない（追加は可能）
		if err != nil {
			t.Errorf("予期しないエラー: %v", err)
		}

		// 残り時間はマイナスになる
		if scheduler.Balance != -30 {
			t.Errorf("残り時間が異なる: got %d, want %d", scheduler.Balance, -30)
		}

		// 過剰割り当てフラグがtrueになっている
		if !scheduler.IsOverAllocated() {
			t.Error("過剰割り当てフラグがtrueになるべき")
		}
	})
}

func TestRemoveTaskFromScheduler(t *testing.T) {
	date := time.Date(2025, 3, 14, 0, 0, 0, 0, time.Local)
	scheduler, _ := NewTaskScheduler(date, 480) // 8時間

	task1, _ := task.NewTask("task1", "タスク1", "説明1", task.CategoryWork, 60)
	task2, _ := task.NewTask("task2", "タスク2", "説明2", task.CategoryPersonal, 90)

	// タスクを追加
	_ = scheduler.AddTask(task1)
	_ = scheduler.AddTask(task2)

	t.Run("タスク削除", func(t *testing.T) {
		err := scheduler.RemoveTask("task1")

		if err != nil {
			t.Errorf("予期しないエラー: %v", err)
		}

		if len(scheduler.Tasks) != 1 {
			t.Errorf("タスク数が異なる: got %d, want %d", len(scheduler.Tasks), 1)
		}

		if scheduler.TotalEstimated != 90 {
			t.Errorf("合計時間が異なる: got %d, want %d", scheduler.TotalEstimated, 90)
		}

		if scheduler.Balance != 390 {
			t.Errorf("残り時間が異なる: got %d, want %d", scheduler.Balance, 390)
		}
	})

	t.Run("存在しないタスク削除", func(t *testing.T) {
		err := scheduler.RemoveTask("nonexistent")

		if err == nil {
			t.Error("存在しないタスクの削除はエラーになるべき")
		}
	})
}

func TestGetTasksByCategory(t *testing.T) {
	date := time.Date(2025, 3, 14, 0, 0, 0, 0, time.Local)
	scheduler, _ := NewTaskScheduler(date, 480) // 8時間

	task1, _ := task.NewTask("task1", "タスク1", "説明1", task.CategoryWork, 60)
	task2, _ := task.NewTask("task2", "タスク2", "説明2", task.CategoryPersonal, 90)
	task3, _ := task.NewTask("task3", "タスク3", "説明3", task.CategoryWork, 120)
	task4, _ := task.NewTask("task4", "タスク4", "説明4", task.CategoryGrowth, 45)

	// タスクを追加
	_ = scheduler.AddTask(task1)
	_ = scheduler.AddTask(task2)
	_ = scheduler.AddTask(task3)
	_ = scheduler.AddTask(task4)

	t.Run("仕事カテゴリのタスク取得", func(t *testing.T) {
		tasks := scheduler.GetTasksByCategory(task.CategoryWork)

		if len(tasks) != 2 {
			t.Errorf("タスク数が異なる: got %d, want %d", len(tasks), 2)
		}

		// タスクIDの検証
		ids := []string{tasks[0].ID, tasks[1].ID}
		expected := []string{"task1", "task3"}

		if !containsAll(ids, expected) {
			t.Errorf("タスクIDが異なる: got %v, want %v", ids, expected)
		}
	})

	t.Run("個人カテゴリのタスク取得", func(t *testing.T) {
		tasks := scheduler.GetTasksByCategory(task.CategoryPersonal)

		if len(tasks) != 1 {
			t.Errorf("タスク数が異なる: got %d, want %d", len(tasks), 1)
		}

		if tasks[0].ID != "task2" {
			t.Errorf("タスクIDが異なる: got %s, want %s", tasks[0].ID, "task2")
		}
	})

	t.Run("存在しないカテゴリのタスク取得", func(t *testing.T) {
		tasks := scheduler.GetTasksByCategory(task.CategoryMisc)

		if len(tasks) != 0 {
			t.Errorf("タスク数が異なる: got %d, want %d", len(tasks), 0)
		}
	})
}

func TestGetTasksByStatus(t *testing.T) {
	date := time.Date(2025, 3, 14, 0, 0, 0, 0, time.Local)
	scheduler, _ := NewTaskScheduler(date, 480) // 8時間

	task1, _ := task.NewTask("task1", "タスク1", "説明1", task.CategoryWork, 60)
	task2, _ := task.NewTask("task2", "タスク2", "説明2", task.CategoryPersonal, 90)
	task3, _ := task.NewTask("task3", "タスク3", "説明3", task.CategoryWork, 120)

	// タスクを追加
	_ = scheduler.AddTask(task1)
	_ = scheduler.AddTask(task2)
	_ = scheduler.AddTask(task3)

	// タスク1を進行中に変更
	task1.Status = task.StatusInProgress

	// タスク2を完了に変更
	task2.Status = task.StatusCompleted

	t.Run("未開始タスク取得", func(t *testing.T) {
		tasks := scheduler.GetTasksByStatus(task.StatusNotStarted)

		if len(tasks) != 1 {
			t.Errorf("タスク数が異なる: got %d, want %d", len(tasks), 1)
		}

		if tasks[0].ID != "task3" {
			t.Errorf("タスクIDが異なる: got %s, want %s", tasks[0].ID, "task3")
		}
	})

	t.Run("進行中タスク取得", func(t *testing.T) {
		tasks := scheduler.GetTasksByStatus(task.StatusInProgress)

		if len(tasks) != 1 {
			t.Errorf("タスク数が異なる: got %d, want %d", len(tasks), 1)
		}

		if tasks[0].ID != "task1" {
			t.Errorf("タスクIDが異なる: got %s, want %s", tasks[0].ID, "task1")
		}
	})

	t.Run("完了タスク取得", func(t *testing.T) {
		tasks := scheduler.GetTasksByStatus(task.StatusCompleted)

		if len(tasks) != 1 {
			t.Errorf("タスク数が異なる: got %d, want %d", len(tasks), 1)
		}

		if tasks[0].ID != "task2" {
			t.Errorf("タスクIDが異なる: got %s, want %s", tasks[0].ID, "task2")
		}
	})
}

func TestOptimizeSchedule(t *testing.T) {
	date := time.Date(2025, 3, 14, 0, 0, 0, 0, time.Local)
	scheduler, _ := NewTaskScheduler(date, 120) // 2時間

	task1, _ := task.NewTask("task1", "重要タスク", "説明1", task.CategoryWork, 60)
	task2, _ := task.NewTask("task2", "緊急タスク", "説明2", task.CategoryPersonal, 90)
	task3, _ := task.NewTask("task3", "通常タスク", "説明3", task.CategoryWork, 30)

	// タスクを追加
	_ = scheduler.AddTask(task1)
	_ = scheduler.AddTask(task2)
	_ = scheduler.AddTask(task3)

	// 初期状態では過剰割り当て
	if !scheduler.IsOverAllocated() {
		t.Error("初期状態では過剰割り当てになるべき")
	}

	t.Run("優先度関数によるスケジュール最適化", func(t *testing.T) {
		// タスク名に「重要」が含まれるタスクを優先
		priorityFn := func(t *task.Task) float64 {
			if t.Name == "重要タスク" {
				return 3.0
			} else if t.Name == "緊急タスク" {
				return 2.0
			}
			return 1.0
		}

		err := scheduler.OptimizeSchedule(priorityFn)

		if err != nil {
			t.Errorf("予期しないエラー: %v", err)
		}

		// 可処分時間120分なので、「重要タスク」(60分)と「通常タスク」(30分)が選ばれるはず
		if len(scheduler.Tasks) != 2 {
			t.Errorf("タスク数が異なる: got %d, want %d", len(scheduler.Tasks), 2)
		}

		// タスクIDの検証
		ids := []string{scheduler.Tasks[0].ID, scheduler.Tasks[1].ID}
		expected := []string{"task1", "task3"}

		if !containsAll(ids, expected) {
			t.Errorf("タスクIDが異なる: got %v, want %v", ids, expected)
		}

		// 合計時間は90分
		if scheduler.TotalEstimated != 90 {
			t.Errorf("合計時間が異なる: got %d, want %d", scheduler.TotalEstimated, 90)
		}

		// 残り時間は30分
		if scheduler.Balance != 30 {
			t.Errorf("残り時間が異なる: got %d, want %d", scheduler.Balance, 30)
		}

		// 過剰割り当てではない
		if scheduler.IsOverAllocated() {
			t.Error("過剰割り当てになるべきではない")
		}
	})
}

func TestGetTotalMinutesByCategory(t *testing.T) {
	date := time.Date(2025, 3, 14, 0, 0, 0, 0, time.Local)
	scheduler, _ := NewTaskScheduler(date, 480) // 8時間

	task1, _ := task.NewTask("task1", "タスク1", "説明1", task.CategoryWork, 60)
	task2, _ := task.NewTask("task2", "タスク2", "説明2", task.CategoryPersonal, 90)
	task3, _ := task.NewTask("task3", "タスク3", "説明3", task.CategoryWork, 120)
	task4, _ := task.NewTask("task4", "タスク4", "説明4", task.CategoryGrowth, 45)

	// タスクを追加
	_ = scheduler.AddTask(task1)
	_ = scheduler.AddTask(task2)
	_ = scheduler.AddTask(task3)
	_ = scheduler.AddTask(task4)

	t.Run("仕事カテゴリの合計時間", func(t *testing.T) {
		minutes := scheduler.GetTotalMinutesByCategory(task.CategoryWork)

		if minutes != 180 { // 60 + 120
			t.Errorf("合計時間が異なる: got %d, want %d", minutes, 180)
		}
	})

	t.Run("個人カテゴリの合計時間", func(t *testing.T) {
		minutes := scheduler.GetTotalMinutesByCategory(task.CategoryPersonal)

		if minutes != 90 {
			t.Errorf("合計時間が異なる: got %d, want %d", minutes, 90)
		}
	})

	t.Run("存在しないカテゴリの合計時間", func(t *testing.T) {
		minutes := scheduler.GetTotalMinutesByCategory(task.CategoryMisc)

		if minutes != 0 {
			t.Errorf("合計時間が異なる: got %d, want %d", minutes, 0)
		}
	})
}

// テストヘルパー関数

// containsAll - slice1がslice2の全要素を含むか（順序は問わない）
func containsAll(slice1, slice2 []string) bool {
	if len(slice1) < len(slice2) {
		return false
	}

	set := make(map[string]bool)
	for _, item := range slice1 {
		set[item] = true
	}

	for _, item := range slice2 {
		if !set[item] {
			return false
		}
	}

	return true
}