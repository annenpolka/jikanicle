package schedule

import (
	"context"
	"errors"
	"time"
)

// Repository defines the operations for schedule data persistence
type Repository interface {
	// FindByDate retrieves a daily plan for a specific date
	FindByDate(ctx context.Context, date time.Time) (*DailyPlan, error)

	// FindByDateRange retrieves daily plans within a date range
	FindByDateRange(ctx context.Context, start, end time.Time) ([]*DailyPlan, error)

	// FindAll retrieves all daily plans
	FindAll(ctx context.Context) ([]*DailyPlan, error)

	// Save persists a daily plan
	Save(ctx context.Context, plan *DailyPlan) error

	// Delete removes a daily plan for a specific date
	Delete(ctx context.Context, date time.Time) error
}

// Common repository errors
var (
	ErrDailyPlanNotFound = errors.New("daily plan not found")
	ErrRepositoryAccess  = errors.New("repository access error")
)