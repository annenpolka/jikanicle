package task

import (
	"errors"
	"fmt"
	"time"
)

// Status represents the current state of a task
type Status string

const (
	StatusNotStarted Status = "notStarted" // Task not yet started
	StatusInProgress Status = "inProgress" // Task in progress
	StatusCompleted  Status = "completed"  // Task completed
)

// Category represents the type of task
type Category string

const (
	CategoryWork     Category = "work"     // Work-related tasks
	CategoryPersonal Category = "personal" // Personal tasks
	CategoryGrowth   Category = "growth"   // Growth and learning tasks
	CategoryMisc     Category = "misc"     // Miscellaneous tasks
)

// Task represents a unit of work to be done
type Task struct {
	ID               string    // Unique identifier
	Name             string    // Task name
	Description      string    // Task description
	Category         Category  // Task category
	EstimatedMinutes int       // Estimated time in minutes
	ActualMinutes    int       // Actual time spent in minutes
	Status           Status    // Current status
	CreatedAt        time.Time // Creation timestamp
	CompletedAt      time.Time // Completion timestamp
}

// NewTask creates a new task with the given parameters
func NewTask(id, name, description string, category Category, estimatedMinutes int) (*Task, error) {
	// Validation
	if name == "" {
		return nil, errors.New("task name is required")
	}

	if estimatedMinutes < 0 {
		return nil, fmt.Errorf("estimated time must be non-negative: %d", estimatedMinutes)
	}

	return &Task{
		ID:               id,
		Name:             name,
		Description:      description,
		Category:         category,
		EstimatedMinutes: estimatedMinutes,
		ActualMinutes:    0,
		Status:           StatusNotStarted,
		CreatedAt:        time.Now(),
	}, nil
}

// MarkInProgress updates the task status to in-progress
func (t *Task) MarkInProgress() error {
	if t.Status == StatusCompleted {
		return errors.New("cannot move a completed task back to in-progress")
	}

	t.Status = StatusInProgress
	return nil
}

// MarkCompleted updates the task status to completed
func (t *Task) MarkCompleted() error {
	t.Status = StatusCompleted
	t.CompletedAt = time.Now()
	return nil
}

// UpdateEstimatedTime updates the estimated time for the task
func (t *Task) UpdateEstimatedTime(minutes int) error {
	if minutes < 0 {
		return fmt.Errorf("estimated time must be non-negative: %d", minutes)
	}
	t.EstimatedMinutes = minutes
	return nil
}

// RecordActualTime sets the actual time spent on the task
func (t *Task) RecordActualTime(minutes int) error {
	if minutes < 0 {
		return fmt.Errorf("actual time must be non-negative: %d", minutes)
	}
	t.ActualMinutes = minutes
	return nil
}