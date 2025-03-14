package task

import (
	"context"
	"errors"
)

// Repository defines the operations for task persistence
type Repository interface {
	// FindByID retrieves a task by its ID
	FindByID(ctx context.Context, id string) (*Task, error)

	// FindAll retrieves all tasks
	FindAll(ctx context.Context) ([]*Task, error)

	// FindByStatus retrieves tasks with the specified status
	FindByStatus(ctx context.Context, status Status) ([]*Task, error)

	// FindByCategory retrieves tasks with the specified category
	FindByCategory(ctx context.Context, category Category) ([]*Task, error)

	// Save persists a task
	Save(ctx context.Context, task *Task) error

	// Delete removes a task
	Delete(ctx context.Context, id string) error
}

// Common repository errors
var (
	ErrTaskNotFound     = errors.New("task not found")
	ErrTaskAlreadyExists = errors.New("task already exists")
	ErrRepositoryAccess = errors.New("repository access error")
)