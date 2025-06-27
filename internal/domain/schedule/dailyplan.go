package schedule

import (
	"errors"
	"fmt"
	"time"

	"github.com/annenpolka/jikanicle/internal/domain/task"
)

// DailyPlan represents a schedule for a specific day
type DailyPlan struct {
	Date             time.Time    // The date this plan is for
	AvailableMinutes int          // Total available minutes for the day
	Tasks            []*task.Task // Tasks scheduled for this day
	TotalEstimated   int          // Total estimated minutes of all tasks
	Balance          int          // Available minutes - total estimated minutes
}

// NewDailyPlan creates a new daily plan
func NewDailyPlan(date time.Time, availableMinutes int) (*DailyPlan, error) {
	// Validate input parameters
	if availableMinutes <= 0 {
		return nil, errors.New("available minutes must be positive")
	}

	return &DailyPlan{
		Date:             date,
		AvailableMinutes: availableMinutes,
		Tasks:            make([]*task.Task, 0),
		TotalEstimated:   0,
		Balance:          availableMinutes,
	}, nil
}

// AddTask adds a task to the daily plan
func (p *DailyPlan) AddTask(t *task.Task) error {
	// Check if adding this task would exceed available time
	if p.TotalEstimated+t.EstimatedMinutes > p.AvailableMinutes {
		return fmt.Errorf(
			"adding task %s with %d minutes exceeds available time (balance: %d minutes)",
			t.ID, t.EstimatedMinutes, p.Balance,
		)
	}

	// Add the task
	p.Tasks = append(p.Tasks, t)

	// Update totals
	p.TotalEstimated += t.EstimatedMinutes
	p.Balance = p.AvailableMinutes - p.TotalEstimated

	return nil
}

// RemoveTask removes a task from the daily plan
func (p *DailyPlan) RemoveTask(taskID string) error {
	foundIndex := -1
	var foundTask *task.Task

	// Find the task
	for i, t := range p.Tasks {
		if t.ID == taskID {
			foundIndex = i
			foundTask = t
			break
		}
	}

	// Return error if task not found
	if foundIndex < 0 {
		return fmt.Errorf("task with ID %s not found in daily plan", taskID)
	}

	// Remove the task
	p.Tasks = append(p.Tasks[:foundIndex], p.Tasks[foundIndex+1:]...)

	// Update totals
	p.TotalEstimated -= foundTask.EstimatedMinutes
	p.Balance = p.AvailableMinutes - p.TotalEstimated

	return nil
}

// GetTasksByStatus returns all tasks with the specified status
func (p *DailyPlan) GetTasksByStatus(status task.Status) []*task.Task {
	var result []*task.Task

	for _, t := range p.Tasks {
		if t.Status == status {
			result = append(result, t)
		}
	}

	return result
}

// GetTasksByCategory returns all tasks with the specified category
func (p *DailyPlan) GetTasksByCategory(category task.Category) []*task.Task {
	var result []*task.Task

	for _, t := range p.Tasks {
		if t.Category == category {
			result = append(result, t)
		}
	}

	return result
}