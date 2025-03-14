package task

import (
	"strings"
	"testing"
	"time"
)

func TestNewTask(t *testing.T) {
	tests := []struct {
		name             string
		id               string
		taskName         string
		description      string
		category         Category
		estimatedMin     int
		wantErr          bool
		errorMsgContains string
	}{
		{
			name:             "有効なタスク",
			id:               "task1",
			taskName:         "Jikanicleプロジェクト設計",
			description:      "コアデータモデルの設計とドキュメント作成",
			category:         CategoryWork,
			estimatedMin:     60,
			wantErr:          false,
			errorMsgContains: "",
		},
		{
			name:             "タスク名が空",
			id:               "task2",
			taskName:         "",
			description:     "説明あり",
			category:        CategoryPersonal,
			estimatedMin:    30,
			wantErr:         true,
			errorMsgContains: "task name is required",
		},
		{
			name:             "予測時間がマイナス",
			id:               "task3",
			taskName:        "無効な予測時間",
			description:     "説明あり",
			category:        CategoryGrowth,
			estimatedMin:    -10,
			wantErr:         true,
			errorMsgContains: "estimated time must be non-negative",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			task, err := NewTask(tt.id, tt.taskName, tt.description, tt.category, tt.estimatedMin)

			// エラーチェック
			if (err != nil) != tt.wantErr {
				t.Errorf("NewTask() error = %v, wantErr %v", err, tt.wantErr)
				return
			}

			if err != nil && tt.wantErr {
				if tt.errorMsgContains != "" && !strings.Contains(err.Error(), tt.errorMsgContains) {
					t.Errorf("エラーメッセージ %q に %q が含まれていません", err.Error(), tt.errorMsgContains)
				}
				return
			}

			// 正常系のアサーション
			if task.ID != tt.id {
				t.Errorf("task.ID = %q, want %q", task.ID, tt.id)
			}

			if task.Name != tt.taskName {
				t.Errorf("task.Name = %q, want %q", task.Name, tt.taskName)
			}

			if task.Description != tt.description {
				t.Errorf("task.Description = %q, want %q", task.Description, tt.description)
			}

			if task.Category != tt.category {
				t.Errorf("task.Category = %q, want %q", task.Category, tt.category)
			}

			if task.EstimatedMinutes != tt.estimatedMin {
				t.Errorf("task.EstimatedMinutes = %d, want %d", task.EstimatedMinutes, tt.estimatedMin)
			}

			if task.Status != StatusNotStarted {
				t.Errorf("task.Status = %q, want %q", task.Status, StatusNotStarted)
			}

			// 作成時刻が現在時刻に近いことを確認
			timeDiff := time.Since(task.CreatedAt)
			if timeDiff > time.Second*5 {
				t.Errorf("task.CreatedAt は現在時刻から5秒以内であるべきです。差: %v", timeDiff)
			}
		})
	}
}

func TestMarkInProgress(t *testing.T) {
	task, _ := NewTask("task1", "テストタスク", "説明", CategoryWork, 30)

	// 進行中に変更
	err := task.MarkInProgress()
	if err != nil {
		t.Errorf("MarkInProgress() エラー: %v", err)
	}

	if task.Status != StatusInProgress {
		t.Errorf("task.Status = %q, want %q", task.Status, StatusInProgress)
	}

	// 進行中から完了への移行は別のテストケースに分けるべきだが、デモのために含めておく
	err = task.MarkCompleted()
	if err != nil {
		t.Errorf("MarkCompleted() エラー: %v", err)
	}

	if task.Status != StatusCompleted {
		t.Errorf("task.Status = %q, want %q", task.Status, StatusCompleted)
	}

	if task.CompletedAt.IsZero() {
		t.Error("CompletedAt は設定されるべきです")
	}

	// 完了済みタスクを進行中に戻す
	err = task.MarkInProgress()
	if err == nil {
		t.Error("完了済みタスクを進行中に戻せるべきではありません")
	}
}

