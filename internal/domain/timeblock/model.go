package timeblock

import (
	"errors"
	"strings"
	"time"
)

// TimeBlock represents a specific time period assigned to a task
type TimeBlock struct {
	ID              string    // Unique identifier
	Start           time.Time // Start time
	End             time.Time // End time
	TaskID          string    // Associated task identifier
	DurationMinutes int       // Duration in minutes
}

// NewTimeBlock creates a new time block with validation
func NewTimeBlock(id string, start, end time.Time, taskID string) (*TimeBlock, error) {
	// Validate inputs
	if !end.After(start) {
		return nil, errors.New("end time must be after start time")
	}

	if taskID == "" {
		return nil, errors.New("task ID is required")
	}

	// Calculate duration in minutes
	durationMinutes := int(end.Sub(start).Minutes())

	return &TimeBlock{
		ID:              id,
		Start:           start,
		End:             end,
		TaskID:          taskID,
		DurationMinutes: durationMinutes,
	}, nil
}

// Overlaps checks if this time block overlaps with another
func (b *TimeBlock) Overlaps(other *TimeBlock) bool {
	// Case 1: b starts before other ends AND b ends after other starts
	// This captures all cases of overlap, including one block fully containing the other
	return b.Start.Before(other.End) && b.End.After(other.Start)
}

// Contains checks if a specific time point is contained within this block
func (b *TimeBlock) Contains(t time.Time) bool {
	return (t.Equal(b.Start) || t.After(b.Start)) && t.Before(b.End) || t.Equal(b.End)
}

// FixContainsHelper fixes the test helper function
func fixContainsHelper() {
	// This is just to remind us to use strings.Contains instead
	_ = strings.Contains
}