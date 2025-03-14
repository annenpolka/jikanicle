package task

import (
	"context"
	"encoding/json"
	"fmt"
	"os"
	"path/filepath"
	"sync"
)

// TasksData はJSONファイルに保存されるデータ構造
type TasksData struct {
	Tasks []*Task `json:"tasks"`
}

// JSONRepository はタスクデータをJSONファイルに永続化するリポジトリの実装
type JSONRepository struct {
	filePath string
	data     TasksData
	mutex    sync.RWMutex
}

// NewJSONRepository は新しいJSONリポジトリを作成する
func NewJSONRepository(filePath string) (*JSONRepository, error) {
	// ディレクトリが存在するか確認し、存在しない場合は作成
	dir := filepath.Dir(filePath)
	if _, err := os.Stat(dir); os.IsNotExist(err) {
		if err := os.MkdirAll(dir, 0755); err != nil {
			return nil, fmt.Errorf("failed to create directory %s: %w", dir, err)
		}
	}

	repo := &JSONRepository{
		filePath: filePath,
		data: TasksData{
			Tasks: []*Task{},
		},
	}

	// ファイルが存在する場合はデータを読み込む
	if _, err := os.Stat(filePath); err == nil {
		file, err := os.ReadFile(filePath)
		if err != nil {
			return nil, fmt.Errorf("failed to read JSON file: %w", err)
		}

		if len(file) > 0 {
			if err := json.Unmarshal(file, &repo.data); err != nil {
				return nil, fmt.Errorf("failed to parse JSON data: %w", err)
			}
		}
	}

	return repo, nil
}

// saveToFile はタスクデータをJSONファイルに保存する
func (r *JSONRepository) saveToFile() error {
	data, err := json.MarshalIndent(r.data, "", "  ")
	if err != nil {
		return fmt.Errorf("failed to marshal tasks data: %w", err)
	}

	if err := os.WriteFile(r.filePath, data, 0644); err != nil {
		return fmt.Errorf("failed to write to JSON file: %w", err)
	}

	return nil
}

// FindByID はIDによりタスクを検索する
func (r *JSONRepository) FindByID(ctx context.Context, id string) (*Task, error) {
	r.mutex.RLock()
	defer r.mutex.RUnlock()

	for _, task := range r.data.Tasks {
		if task.ID == id {
			return task, nil
		}
	}

	return nil, ErrTaskNotFound
}

// FindAll は全てのタスクを取得する
func (r *JSONRepository) FindAll(ctx context.Context) ([]*Task, error) {
	r.mutex.RLock()
	defer r.mutex.RUnlock()

	tasks := make([]*Task, len(r.data.Tasks))
	copy(tasks, r.data.Tasks)
	return tasks, nil
}

// FindByStatus はステータスによりタスクをフィルタリングする
func (r *JSONRepository) FindByStatus(ctx context.Context, status Status) ([]*Task, error) {
	r.mutex.RLock()
	defer r.mutex.RUnlock()

	var filteredTasks []*Task
	for _, task := range r.data.Tasks {
		if task.Status == status {
			filteredTasks = append(filteredTasks, task)
		}
	}

	return filteredTasks, nil
}

// FindByCategory はカテゴリによりタスクをフィルタリングする
func (r *JSONRepository) FindByCategory(ctx context.Context, category Category) ([]*Task, error) {
	r.mutex.RLock()
	defer r.mutex.RUnlock()

	var filteredTasks []*Task
	for _, task := range r.data.Tasks {
		if task.Category == category {
			filteredTasks = append(filteredTasks, task)
		}
	}

	return filteredTasks, nil
}

// Save はタスクを保存する
func (r *JSONRepository) Save(ctx context.Context, task *Task) error {
	r.mutex.Lock()
	defer r.mutex.Unlock()

	// 既存のタスクを検索
	index := -1
	for i, t := range r.data.Tasks {
		if t.ID == task.ID {
			index = i
			break
		}
	}

	// 既存のタスクを更新するか、新しいタスクを追加する
	if index >= 0 {
		r.data.Tasks[index] = task
	} else {
		r.data.Tasks = append(r.data.Tasks, task)
	}

	// ファイルに保存
	return r.saveToFile()
}

// Delete はタスクを削除する
func (r *JSONRepository) Delete(ctx context.Context, id string) error {
	r.mutex.Lock()
	defer r.mutex.Unlock()

	// タスクを検索
	index := -1
	for i, task := range r.data.Tasks {
		if task.ID == id {
			index = i
			break
		}
	}

	// タスクが見つからない場合はエラー
	if index < 0 {
		return ErrTaskNotFound
	}

	// タスクを削除
	r.data.Tasks = append(r.data.Tasks[:index], r.data.Tasks[index+1:]...)

	// ファイルに保存
	return r.saveToFile()
}