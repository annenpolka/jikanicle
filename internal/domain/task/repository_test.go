package task

import (
	"context"
	"errors"
	"testing"
)

// リポジトリのモック実装
type mockRepository struct {
	tasks map[string]*Task
}

func newMockRepository() *mockRepository {
	return &mockRepository{
		tasks: make(map[string]*Task),
	}
}

func (r *mockRepository) FindByID(ctx context.Context, id string) (*Task, error) {
	task, exists := r.tasks[id]
	if !exists {
		return nil, ErrTaskNotFound
	}
	return task, nil
}

func (r *mockRepository) FindAll(ctx context.Context) ([]*Task, error) {
	tasks := make([]*Task, 0, len(r.tasks))
	for _, task := range r.tasks {
		tasks = append(tasks, task)
	}
	return tasks, nil
}

func (r *mockRepository) FindByStatus(ctx context.Context, status Status) ([]*Task, error) {
	var tasks []*Task
	for _, task := range r.tasks {
		if task.Status == status {
			tasks = append(tasks, task)
		}
	}
	return tasks, nil
}

func (r *mockRepository) FindByCategory(ctx context.Context, category Category) ([]*Task, error) {
	var tasks []*Task
	for _, task := range r.tasks {
		if task.Category == category {
			tasks = append(tasks, task)
		}
	}
	return tasks, nil
}

func (r *mockRepository) Save(ctx context.Context, task *Task) error {
	r.tasks[task.ID] = task
	return nil
}

func (r *mockRepository) Delete(ctx context.Context, id string) error {
	if _, exists := r.tasks[id]; !exists {
		return ErrTaskNotFound
	}
	delete(r.tasks, id)
	return nil
}


func TestRepositorySave(t *testing.T) {
	repo := newMockRepository()
	ctx := context.Background()

	// Create a new task
	task, err := NewTask("task1", "Test Task", "Description", CategoryWork, 30)
	if err != nil {
		t.Fatalf("Failed to create new task: %v", err)
	}

	// Save the task
	err = repo.Save(ctx, task)
	if err != nil {
		t.Errorf("Save() error = %v, wantErr = nil", err)
	}

	// Retrieve the task and verify it was saved correctly
	savedTask, err := repo.FindByID(ctx, "task1")
	if err != nil {
		t.Errorf("FindByID() error = %v, wantErr = nil", err)
	}

	if savedTask.ID != task.ID {
		t.Errorf("savedTask.ID = %v, want %v", savedTask.ID, task.ID)
	}

	if savedTask.Name != task.Name {
		t.Errorf("savedTask.Name = %v, want %v", savedTask.Name, task.Name)
	}
}

func TestRepositoryFindAll(t *testing.T) {
	repo := newMockRepository()
	ctx := context.Background()

	// Create and save tasks
	task1, _ := NewTask("task1", "Task 1", "Description 1", CategoryWork, 30)
	task2, _ := NewTask("task2", "Task 2", "Description 2", CategoryPersonal, 60)

	repo.Save(ctx, task1)
	repo.Save(ctx, task2)

	// Test find all
	tasks, err := repo.FindAll(ctx)
	if err != nil {
		t.Errorf("FindAll() error = %v, wantErr = nil", err)
	}

	if len(tasks) != 2 {
		t.Errorf("len(tasks) = %d, want %d", len(tasks), 2)
	}

	// Check if all tasks are present
	foundTask1, foundTask2 := false, false
	for _, task := range tasks {
		if task.ID == "task1" {
			foundTask1 = true
		}
		if task.ID == "task2" {
			foundTask2 = true
		}
	}

	if !foundTask1 || !foundTask2 {
		t.Errorf("FindAll() tasks missing: foundTask1 = %v, foundTask2 = %v", foundTask1, foundTask2)
	}
}

func TestRepositoryDelete(t *testing.T) {
	repo := newMockRepository()
	ctx := context.Background()

	// Create and save a task
	task, _ := NewTask("task1", "Test Task", "Description", CategoryWork, 30)
	repo.Save(ctx, task)

	// Verify task exists
	_, err := repo.FindByID(ctx, "task1")
	if err != nil {
		t.Errorf("FindByID() before delete error = %v, wantErr = nil", err)
	}

	// Delete the task
	err = repo.Delete(ctx, "task1")
	if err != nil {
		t.Errorf("Delete() error = %v, wantErr = nil", err)
	}

	// Verify task no longer exists
	_, err = repo.FindByID(ctx, "task1")
	if !errors.Is(err, ErrTaskNotFound) {
		t.Errorf("FindByID() after delete error = %v, want = %v", err, ErrTaskNotFound)
	}

	// Test deleting non-existent task
	err = repo.Delete(ctx, "nonexistent")
	if !errors.Is(err, ErrTaskNotFound) {
		t.Errorf("Delete() nonexistent error = %v, want = %v", err, ErrTaskNotFound)
	}
}

func TestRepositoryFindByStatus(t *testing.T) {
	repo := newMockRepository()
	ctx := context.Background()

	// Create and save tasks with different statuses
	task1, _ := NewTask("task1", "Task 1", "Description 1", CategoryWork, 30)
	task2, _ := NewTask("task2", "Task 2", "Description 2", CategoryPersonal, 60)
	task2.MarkInProgress()

	repo.Save(ctx, task1)
	repo.Save(ctx, task2)

	// Test find by not started status
	notStartedTasks, err := repo.FindByStatus(ctx, StatusNotStarted)
	if err != nil {
		t.Errorf("FindByStatus(NotStarted) error = %v, wantErr = nil", err)
	}

	if len(notStartedTasks) != 1 || notStartedTasks[0].ID != "task1" {
		t.Errorf("FindByStatus(NotStarted) incorrect result: %v", notStartedTasks)
	}

	// Test find by in progress status
	inProgressTasks, err := repo.FindByStatus(ctx, StatusInProgress)
	if err != nil {
		t.Errorf("FindByStatus(InProgress) error = %v, wantErr = nil", err)
	}

	if len(inProgressTasks) != 1 || inProgressTasks[0].ID != "task2" {
		t.Errorf("FindByStatus(InProgress) incorrect result: %v", inProgressTasks)
	}
}