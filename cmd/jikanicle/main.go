package main

import (
	"context"
	"fmt"
	"os"
	"path/filepath"

	tea "github.com/charmbracelet/bubbletea"
	"github.com/annenpolka/jikanicle/internal/domain/task"
	"github.com/annenpolka/jikanicle/internal/ui"
)

func main() {
	// Repository initialization
	taskRepo, err := initializeTaskRepository()
	if err != nil {
		fmt.Printf("Error initializing task repository: %v\n", err)
		os.Exit(1)
	}

	// Create sample tasks if repository is empty
	err = ensureSampleTasks(taskRepo)
	if err != nil {
		fmt.Printf("Error creating sample tasks: %v\n", err)
		os.Exit(1)
	}

	// Initialize UI model with repository
	model := ui.NewModelWithRepository(taskRepo)

	// Run the Bubble Tea program
	p := tea.NewProgram(model)
	if _, err := p.Run(); err != nil {
		fmt.Printf("Error running application: %v\n", err)
		os.Exit(1)
	}
}

// initializeTaskRepository initializes and returns a task repository
func initializeTaskRepository() (task.Repository, error) {
	// Get user's home directory
	homeDir, err := os.UserHomeDir()
	if err != nil {
		return nil, fmt.Errorf("unable to determine home directory: %w", err)
	}

	// Create data directory
	dataDir := filepath.Join(homeDir, ".jikanicle")
	if err := os.MkdirAll(dataDir, 0755); err != nil {
		return nil, fmt.Errorf("unable to create data directory: %w", err)
	}

	// Initialize JSON repository
	taskFilePath := filepath.Join(dataDir, "tasks.json")
	repo, err := task.NewJSONRepository(taskFilePath)
	if err != nil {
		return nil, fmt.Errorf("unable to initialize task repository: %w", err)
	}

	return repo, nil
}

// ensureSampleTasks creates sample tasks if the repository is empty
func ensureSampleTasks(repo task.Repository) error {
	ctx := context.Background()

	// Check if there are any tasks
	tasks, err := repo.FindAll(ctx)
	if err != nil {
		return fmt.Errorf("unable to check for existing tasks: %w", err)
	}

	// If tasks already exist, do nothing
	if len(tasks) > 0 {
		return nil
	}

	// Create sample tasks
	samples := []struct {
		name        string
		description string
		category    task.Category
		minutes     int
	}{
		{
			name:        "Jikanicle project setup",
			description: "Initial setup for the Jikanicle project",
			category:    task.CategoryWork,
			minutes:     60,
		},
		{
			name:        "Implement Bubbletea UI",
			description: "Develop the terminal UI using Bubbletea library",
			category:    task.CategoryWork,
			minutes:     120,
		},
		{
			name:        "Learn Go testing",
			description: "Study testing patterns in Go",
			category:    task.CategoryGrowth,
			minutes:     90,
		},
		{
			name:        "Exercise",
			description: "Daily workout routine",
			category:    task.CategoryPersonal,
			minutes:     45,
		},
	}

	// Add sample tasks to repository
	for i, s := range samples {
		t, err := task.NewTask(
			fmt.Sprintf("sample-%d", i+1),
			s.name,
			s.description,
			s.category,
			s.minutes,
		)
		if err != nil {
			return fmt.Errorf("unable to create sample task: %w", err)
		}

		if err := repo.Save(ctx, t); err != nil {
			return fmt.Errorf("unable to save sample task: %w", err)
		}
	}

	return nil
}