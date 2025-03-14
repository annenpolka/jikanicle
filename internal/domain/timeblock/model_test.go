package timeblock

import (
	"strings"
	"testing"
	"time"
)

func TestNewTimeBlock(t *testing.T) {
	now := time.Now()
	start := time.Date(now.Year(), now.Month(), now.Day(), 9, 0, 0, 0, now.Location())
	end := time.Date(now.Year(), now.Month(), now.Day(), 10, 0, 0, 0, now.Location())
	taskID := "task1"

	tests := []struct {
		name              string
		id                string
		start             time.Time
		end               time.Time
		taskID            string
		wantErr           bool
		errorMsgContains  string
	}{
		{
			name:              "valid time block",
			id:                "block1",
			start:             start,
			end:               end,
			taskID:            taskID,
			wantErr:           false,
			errorMsgContains:  "",
		},
		{
			name:              "end time before start time",
			id:                "block2",
			start:             end,
			end:               start,
			taskID:            taskID,
			wantErr:           true,
			errorMsgContains:  "end time must be after start time",
		},
		{
			name:              "empty task ID",
			id:                "block3",
			start:             start,
			end:               end,
			taskID:            "",
			wantErr:           true,
			errorMsgContains:  "task ID is required",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			block, err := NewTimeBlock(tt.id, tt.start, tt.end, tt.taskID)

			// エラーチェック
			if (err != nil) != tt.wantErr {
				t.Errorf("NewTimeBlock() error = %v, wantErr %v", err, tt.wantErr)
				return
			}

			if err != nil && tt.wantErr {
				if tt.errorMsgContains != "" && !contains(err.Error(), tt.errorMsgContains) {
					t.Errorf("Error message %q does not contain %q", err.Error(), tt.errorMsgContains)
				}
				return
			}

			// 正常系のアサーション
			if block.ID != tt.id {
				t.Errorf("block.ID = %q, want %q", block.ID, tt.id)
			}

			if !block.Start.Equal(tt.start) {
				t.Errorf("block.Start = %v, want %v", block.Start, tt.start)
			}

			if !block.End.Equal(tt.end) {
				t.Errorf("block.End = %v, want %v", block.End, tt.end)
			}

			if block.TaskID != tt.taskID {
				t.Errorf("block.TaskID = %q, want %q", block.TaskID, tt.taskID)
			}

			// 時間計算のチェック
			expectedDuration := tt.end.Sub(tt.start).Minutes()
			if block.DurationMinutes != int(expectedDuration) {
				t.Errorf("block.DurationMinutes = %d, want %d", block.DurationMinutes, int(expectedDuration))
			}
		})
	}
}

func TestTimeBlockOverlaps(t *testing.T) {
	now := time.Now()

	// 基準となるタイムブロック: 9:00-10:00
	baseStart := time.Date(now.Year(), now.Month(), now.Day(), 9, 0, 0, 0, now.Location())
	baseEnd := time.Date(now.Year(), now.Month(), now.Day(), 10, 0, 0, 0, now.Location())
	baseBlock, _ := NewTimeBlock("base", baseStart, baseEnd, "task1")

	tests := []struct {
		name     string
		start    time.Time
		end      time.Time
		expected bool
	}{
		{
			name:     "完全に重複（同じ時間）",
			start:    baseStart,
			end:      baseEnd,
			expected: true,
		},
		{
			name:     "部分的に重複（開始時間が含まれる）",
			start:    time.Date(now.Year(), now.Month(), now.Day(), 9, 30, 0, 0, now.Location()),
			end:      time.Date(now.Year(), now.Month(), now.Day(), 10, 30, 0, 0, now.Location()),
			expected: true,
		},
		{
			name:     "部分的に重複（終了時間が含まれる）",
			start:    time.Date(now.Year(), now.Month(), now.Day(), 8, 30, 0, 0, now.Location()),
			end:      time.Date(now.Year(), now.Month(), now.Day(), 9, 30, 0, 0, now.Location()),
			expected: true,
		},
		{
			name:     "内包される",
			start:    time.Date(now.Year(), now.Month(), now.Day(), 9, 15, 0, 0, now.Location()),
			end:      time.Date(now.Year(), now.Month(), now.Day(), 9, 45, 0, 0, now.Location()),
			expected: true,
		},
		{
			name:     "外側を包含",
			start:    time.Date(now.Year(), now.Month(), now.Day(), 8, 0, 0, 0, now.Location()),
			end:      time.Date(now.Year(), now.Month(), now.Day(), 11, 0, 0, 0, now.Location()),
			expected: true,
		},
		{
			name:     "前に隣接（重複なし）",
			start:    time.Date(now.Year(), now.Month(), now.Day(), 8, 0, 0, 0, now.Location()),
			end:      baseStart,
			expected: false,
		},
		{
			name:     "後に隣接（重複なし）",
			start:    baseEnd,
			end:      time.Date(now.Year(), now.Month(), now.Day(), 11, 0, 0, 0, now.Location()),
			expected: false,
		},
		{
			name:     "完全に前",
			start:    time.Date(now.Year(), now.Month(), now.Day(), 7, 0, 0, 0, now.Location()),
			end:      time.Date(now.Year(), now.Month(), now.Day(), 8, 0, 0, 0, now.Location()),
			expected: false,
		},
		{
			name:     "完全に後",
			start:    time.Date(now.Year(), now.Month(), now.Day(), 11, 0, 0, 0, now.Location()),
			end:      time.Date(now.Year(), now.Month(), now.Day(), 12, 0, 0, 0, now.Location()),
			expected: false,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			testBlock, _ := NewTimeBlock("test", tt.start, tt.end, "task2")
			result := baseBlock.Overlaps(testBlock)

			if result != tt.expected {
				t.Errorf("Overlaps() = %v, want %v", result, tt.expected)
			}
		})
	}
}

// ヘルパー関数
func contains(s, substr string) bool {
	return strings.Contains(s, substr)
}