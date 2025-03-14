package schedule

import (
	"strings"
	"testing"
	"time"

	"github.com/annenpolka/jikanicle/internal/domain/task"
)

func TestNewDailyPlan(t *testing.T) {
	date := time.Now().Truncate(24 * time.Hour)
	availableMinutes := 480 // 8 hours

	tests := []struct {
		name              string
		date              time.Time
		availableMinutes  int
		wantErr           bool
		errorMsgContains  string
	}{
		{
			name:              "valid daily plan",
			date:              date,
			availableMinutes:  availableMinutes,
			wantErr:           false,
			errorMsgContains:  "",
		},
		{
			name:              "negative available minutes",
			date:              date,
			availableMinutes:  -60,
			wantErr:           true,
			errorMsgContains:  "must be positive",
		},
		{
			name:              "zero available minutes",
			date:              date,
			availableMinutes:  0,
			wantErr:           true,
			errorMsgContains:  "must be positive",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			plan, err := NewDailyPlan(tt.date, tt.availableMinutes)

			// Error check
			if (err != nil) != tt.wantErr {
				t.Errorf("NewDailyPlan() error = %v, wantErr %v", err, tt.wantErr)
				return
			}

			if err != nil && tt.wantErr {
				if tt.errorMsgContains != "" && !containsString(err.Error(), tt.errorMsgContains) {
					t.Errorf("Error message %q does not contain %q", err.Error(), tt.errorMsgContains)
				}
				return
			}

			// Assertions for valid plan
			if !plan.Date.Equal(tt.date) {
				t.Errorf("plan.Date = %v, want %v", plan.Date, tt.date)
			}

			if plan.AvailableMinutes != tt.availableMinutes {
				t.Errorf("plan.AvailableMinutes = %d, want %d", plan.AvailableMinutes, tt.availableMinutes)
			}

			if len(plan.Tasks) != 0 {
				t.Errorf("Initial tasks should be empty, got %d tasks", len(plan.Tasks))
			}

			if plan.TotalEstimated != 0 {
				t.Errorf("Initial TotalEstimated should be 0, got %d", plan.TotalEstimated)
			}

			if plan.Balance != tt.availableMinutes {
				t.Errorf("Initial Balance should equal availableMinutes, got %d, want %d",
					plan.Balance, tt.availableMinutes)
			}
		})
	}
}

func TestAddTask(t *testing.T) {
	date := time.Now().Truncate(24 * time.Hour)
	plan, _ := NewDailyPlan(date, 480) // 8 hours available

	// Create test tasks
	task1, _ := task.NewTask("task1", "Task 1", "Description", task.CategoryWork, 60)
	task2, _ := task.NewTask("task2", "Task 2", "Description", task.CategoryWork, 90)

	// Test adding tasks and check balance updates
	err := plan.AddTask(task1)
	if err != nil {
		t.Errorf("AddTask() error = %v", err)
	}

	if len(plan.Tasks) != 1 {
		t.Errorf("Expected 1 task, got %d", len(plan.Tasks))
	}

	if plan.TotalEstimated != 60 {
		t.Errorf("Expected TotalEstimated = 60, got %d", plan.TotalEstimated)
	}

	if plan.Balance != 420 {
		t.Errorf("Expected Balance = 420, got %d", plan.Balance)
	}

	// Add another task
	err = plan.AddTask(task2)
	if err != nil {
		t.Errorf("AddTask() error = %v", err)
	}

	if len(plan.Tasks) != 2 {
		t.Errorf("Expected 2 tasks, got %d", len(plan.Tasks))
	}

	if plan.TotalEstimated != 150 {
		t.Errorf("Expected TotalEstimated = 150, got %d", plan.TotalEstimated)
	}

	if plan.Balance != 330 {
		t.Errorf("Expected Balance = 330, got %d", plan.Balance)
	}

	// Test overallocation
	task4, _ := task.NewTask("task4", "Task 4", "Description", task.CategoryWork, 500)
	err = plan.AddTask(task4)
	if err == nil {
		t.Error("Expected error for overallocation, got nil")
	}

	if !containsString(err.Error(), "exceeds available time") {
		t.Errorf("Error message should mention exceeding available time, got: %v", err)
	}

	// Verify plan is unchanged after failed add
	if len(plan.Tasks) != 2 {
		t.Errorf("Plan should still have 2 tasks after failed add, got %d", len(plan.Tasks))
	}

	if plan.TotalEstimated != 150 {
		t.Errorf("TotalEstimated should remain 150 after failed add, got %d", plan.TotalEstimated)
	}
}

func TestRemoveTask(t *testing.T) {
	date := time.Now().Truncate(24 * time.Hour)
	plan, _ := NewDailyPlan(date, 480)

	// Create and add test tasks
	task1, _ := task.NewTask("task1", "Task 1", "Description", task.CategoryWork, 60)
	task2, _ := task.NewTask("task2", "Task 2", "Description", task.CategoryWork, 90)

	plan.AddTask(task1)
	plan.AddTask(task2)

	// Verify initial state
	if len(plan.Tasks) != 2 {
		t.Fatalf("Setup failed: Expected 2 tasks, got %d", len(plan.Tasks))
	}

	// Test removing existing task
	err := plan.RemoveTask("task1")
	if err != nil {
		t.Errorf("RemoveTask() error = %v", err)
	}

	if len(plan.Tasks) != 1 {
		t.Errorf("Expected 1 task after removal, got %d", len(plan.Tasks))
	}

	if containsID(getTaskIDs(plan.Tasks), "task1") {
		t.Errorf("Task with ID task1 should be removed")
	}

	if plan.TotalEstimated != 90 {
		t.Errorf("Expected TotalEstimated = 90 after removal, got %d", plan.TotalEstimated)
	}

	if plan.Balance != 390 {
		t.Errorf("Expected Balance = 390 after removal, got %d", plan.Balance)
	}

	// Test removing non-existent task
	err = plan.RemoveTask("nonexistent")
	if err == nil {
		t.Error("Expected error when removing non-existent task, got nil")
	}

	if !containsString(err.Error(), "not found") {
		t.Errorf("Error message should mention task not found, got: %v", err)
	}
}

// Helper function to check if a string contains another string
func containsString(s, substr string) bool {
	return s != "" && substr != "" && strings.Contains(s, substr)
}

// Helper function to check if a task ID is in a list
func containsID(ids []string, id string) bool {
	for _, taskID := range ids {
		if taskID == id {
			return true
		}
	}
	return false
}

// Helper function to extract task IDs
func getTaskIDs(tasks []*task.Task) []string {
	ids := make([]string, len(tasks))
	for i, t := range tasks {
		ids[i] = t.ID
	}
	return ids
}