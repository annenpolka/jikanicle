package schedule

import (
	"errors"
	"fmt"
	"time"

	"github.com/annenpolka/jikanicle/internal/domain/timeblock"
)

// TimeBlockManager is responsible for managing time blocks within a daily plan
type TimeBlockManager struct {
	Blocks      []*timeblock.TimeBlock
	Date        time.Time
	TotalMinutes int
}

// NewTimeBlockManager creates a new time block manager for a specific date
func NewTimeBlockManager(date time.Time) *TimeBlockManager {
	return &TimeBlockManager{
		Blocks:      make([]*timeblock.TimeBlock, 0),
		Date:        date,
		TotalMinutes: 0,
	}
}

// AddBlock adds a time block after checking for conflicts
func (m *TimeBlockManager) AddBlock(block *timeblock.TimeBlock) error {
	// Check if the block overlaps with any existing block
	for _, existingBlock := range m.Blocks {
		if existingBlock.Overlaps(block) {
			return fmt.Errorf("time block overlaps with existing block (ID: %s)", existingBlock.ID)
		}
	}

	// Add the block
	m.Blocks = append(m.Blocks, block)
	m.TotalMinutes += block.DurationMinutes

	return nil
}

// RemoveBlock removes a time block by ID
func (m *TimeBlockManager) RemoveBlock(blockID string) error {
	index := -1
	var removedBlock *timeblock.TimeBlock

	// Find the block
	for i, block := range m.Blocks {
		if block.ID == blockID {
			index = i
			removedBlock = block
			break
		}
	}

	if index == -1 {
		return errors.New("time block not found")
	}

	// Remove the block
	m.Blocks = append(m.Blocks[:index], m.Blocks[index+1:]...)
	m.TotalMinutes -= removedBlock.DurationMinutes

	return nil
}

// GetBlocksForTask returns all time blocks assigned to a specific task
func (m *TimeBlockManager) GetBlocksForTask(taskID string) []*timeblock.TimeBlock {
	var result []*timeblock.TimeBlock

	for _, block := range m.Blocks {
		if block.TaskID == taskID {
			result = append(result, block)
		}
	}

	return result
}

// GetTotalTimeForTask returns the total minutes allocated to a specific task
func (m *TimeBlockManager) GetTotalTimeForTask(taskID string) int {
	total := 0

	for _, block := range m.Blocks {
		if block.TaskID == taskID {
			total += block.DurationMinutes
		}
	}

	return total
}

// GetBlocksInTimeRange returns all blocks that exist within a given time range
func (m *TimeBlockManager) GetBlocksInTimeRange(start, end time.Time) []*timeblock.TimeBlock {
	var result []*timeblock.TimeBlock

	for _, block := range m.Blocks {
		// Check if the block overlaps with the time range
		if (block.Start.Before(end) || block.Start.Equal(end)) &&
		   (block.End.After(start) || block.End.Equal(start)) {
			result = append(result, block)
		}
	}

	return result
}