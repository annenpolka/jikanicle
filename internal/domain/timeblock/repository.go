package timeblock

import (
	"context"
	"errors"
	"time"
)

// Repository defines the operations for timeblock persistence
type Repository interface {
	// FindByID retrieves a timeblock by its ID
	FindByID(ctx context.Context, id string) (*TimeBlock, error)

	// FindAll retrieves all timeblocks
	FindAll(ctx context.Context) ([]*TimeBlock, error)

	// FindByTaskID retrieves timeblocks for a specific task
	FindByTaskID(ctx context.Context, taskID string) ([]*TimeBlock, error)

	// FindByTimeRange retrieves timeblocks within a time range
	FindByTimeRange(ctx context.Context, start, end time.Time) ([]*TimeBlock, error)

	// Save persists a timeblock
	Save(ctx context.Context, timeBlock *TimeBlock) error

	// Delete removes a timeblock
	Delete(ctx context.Context, id string) error
}

// Common repository errors
var (
	ErrTimeBlockNotFound     = errors.New("timeblock not found")
	ErrTimeBlockAlreadyExists = errors.New("timeblock already exists")
	ErrRepositoryAccess       = errors.New("repository access error")
)