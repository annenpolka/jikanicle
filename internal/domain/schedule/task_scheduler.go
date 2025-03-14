package schedule

import (
	"errors"
	"sort"
	"time"

	"github.com/annenpolka/jikanicle/internal/domain/task"
)

// TaskScheduler タスクのスケジューリングを行うコンポーネント
type TaskScheduler struct {
	Date             time.Time    // スケジュール日
	AvailableMinutes int          // 可処分時間（分）
	Tasks            []*task.Task // スケジュールされたタスク
	TotalEstimated   int          // タスクの合計予測時間
	Balance          int          // 可処分時間とタスク予測時間の差
}

// NewTaskScheduler 新しいTaskSchedulerを作成
func NewTaskScheduler(date time.Time, availableMinutes int) (*TaskScheduler, error) {
	if availableMinutes <= 0 {
		return nil, errors.New("available minutes must be positive")
	}

	return &TaskScheduler{
		Date:             date,
		AvailableMinutes: availableMinutes,
		Tasks:            make([]*task.Task, 0),
		TotalEstimated:   0,
		Balance:          availableMinutes,
	}, nil
}

// AddTask タスクを追加する
func (s *TaskScheduler) AddTask(t *task.Task) error {
	// 既に同じIDのタスクが存在するかチェック
	for _, existingTask := range s.Tasks {
		if existingTask.ID == t.ID {
			return errors.New("task with the same ID already exists in schedule")
		}
	}

	// タスクを追加
	s.Tasks = append(s.Tasks, t)

	// 合計時間と残り時間を更新
	s.TotalEstimated += t.EstimatedMinutes
	s.Balance = s.AvailableMinutes - s.TotalEstimated

	return nil
}

// RemoveTask タスクを削除する
func (s *TaskScheduler) RemoveTask(taskID string) error {
	idx := -1
	var removedTask *task.Task

	// タスクの位置を検索
	for i, t := range s.Tasks {
		if t.ID == taskID {
			idx = i
			removedTask = t
			break
		}
	}

	if idx == -1 {
		return errors.New("task not found in schedule")
	}

	// タスクを削除
	s.Tasks = append(s.Tasks[:idx], s.Tasks[idx+1:]...)

	// 合計時間と残り時間を更新
	s.TotalEstimated -= removedTask.EstimatedMinutes
	s.Balance = s.AvailableMinutes - s.TotalEstimated

	return nil
}

// GetTasksByCategory カテゴリーでタスクをフィルタリング
func (s *TaskScheduler) GetTasksByCategory(category task.Category) []*task.Task {
	var result []*task.Task

	for _, t := range s.Tasks {
		if t.Category == category {
			result = append(result, t)
		}
	}

	return result
}

// GetTasksByStatus ステータスでタスクをフィルタリング
func (s *TaskScheduler) GetTasksByStatus(status task.Status) []*task.Task {
	var result []*task.Task

	for _, t := range s.Tasks {
		if t.Status == status {
			result = append(result, t)
		}
	}

	return result
}

// OptimizeSchedule 可処分時間内にタスクをスケジューリング
// priorityFn はタスクの優先度を計算する関数（値が大きいほど優先度が高い）
func (s *TaskScheduler) OptimizeSchedule(priorityFn func(*task.Task) float64) error {
	// すべてのタスクをコピー
	allTasks := make([]*task.Task, len(s.Tasks))
	copy(allTasks, s.Tasks)

	// 優先度でソート
	sort.Slice(allTasks, func(i, j int) bool {
		return priorityFn(allTasks[i]) > priorityFn(allTasks[j])
	})

	// スケジュールをクリア
	s.Tasks = make([]*task.Task, 0)
	s.TotalEstimated = 0
	s.Balance = s.AvailableMinutes

	// 優先度の高いタスクから追加
	for _, t := range allTasks {
		// 可処分時間を超える場合はスキップ
		if t.EstimatedMinutes > s.Balance {
			continue
		}

		// タスクを追加
		s.Tasks = append(s.Tasks, t)
		s.TotalEstimated += t.EstimatedMinutes
		s.Balance = s.AvailableMinutes - s.TotalEstimated
	}

	return nil
}

// GetTotalMinutesByCategory カテゴリー別の合計時間を取得
func (s *TaskScheduler) GetTotalMinutesByCategory(category task.Category) int {
	total := 0

	for _, t := range s.Tasks {
		if t.Category == category {
			total += t.EstimatedMinutes
		}
	}

	return total
}

// IsOverAllocated 時間超過しているかをチェック
func (s *TaskScheduler) IsOverAllocated() bool {
	return s.Balance < 0
}