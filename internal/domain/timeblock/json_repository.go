package timeblock

import (
	"context"
	"encoding/json"
	"fmt"
	"os"
	"path/filepath"
	"sync"
	"time"
)

// TimeBlocksData はJSONファイルに保存されるデータ構造
type TimeBlocksData struct {
	TimeBlocks []*TimeBlock `json:"timeblocks"`
}

// JSONRepository はタイムブロックデータをJSONファイルに永続化するリポジトリの実装
type JSONRepository struct {
	filePath string
	data     TimeBlocksData
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
		data: TimeBlocksData{
			TimeBlocks: []*TimeBlock{},
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

// saveToFile はタイムブロックデータをJSONファイルに保存する
func (r *JSONRepository) saveToFile() error {
	data, err := json.MarshalIndent(r.data, "", "  ")
	if err != nil {
		return fmt.Errorf("failed to marshal timeblocks data: %w", err)
	}

	if err := os.WriteFile(r.filePath, data, 0644); err != nil {
		return fmt.Errorf("failed to write to JSON file: %w", err)
	}

	return nil
}

// FindByID はIDによりタイムブロックを検索する
func (r *JSONRepository) FindByID(ctx context.Context, id string) (*TimeBlock, error) {
	r.mutex.RLock()
	defer r.mutex.RUnlock()

	for _, block := range r.data.TimeBlocks {
		if block.ID == id {
			return block, nil
		}
	}

	return nil, ErrTimeBlockNotFound
}

// FindAll は全てのタイムブロックを取得する
func (r *JSONRepository) FindAll(ctx context.Context) ([]*TimeBlock, error) {
	r.mutex.RLock()
	defer r.mutex.RUnlock()

	blocks := make([]*TimeBlock, len(r.data.TimeBlocks))
	copy(blocks, r.data.TimeBlocks)
	return blocks, nil
}

// FindByTaskID はタスクIDによりタイムブロックをフィルタリングする
func (r *JSONRepository) FindByTaskID(ctx context.Context, taskID string) ([]*TimeBlock, error) {
	r.mutex.RLock()
	defer r.mutex.RUnlock()

	var filteredBlocks []*TimeBlock
	for _, block := range r.data.TimeBlocks {
		if block.TaskID == taskID {
			filteredBlocks = append(filteredBlocks, block)
		}
	}

	return filteredBlocks, nil
}

// FindByTimeRange は時間範囲内のタイムブロックを検索する
func (r *JSONRepository) FindByTimeRange(ctx context.Context, start, end time.Time) ([]*TimeBlock, error) {
	r.mutex.RLock()
	defer r.mutex.RUnlock()

	var filteredBlocks []*TimeBlock
	for _, block := range r.data.TimeBlocks {
		// タイムブロックが指定範囲と重なる場合
		if (block.Start.Before(end) || block.Start.Equal(end)) &&
		   (block.End.After(start) || block.End.Equal(start)) {
			filteredBlocks = append(filteredBlocks, block)
		}
	}

	return filteredBlocks, nil
}

// Save はタイムブロックを保存する
func (r *JSONRepository) Save(ctx context.Context, timeBlock *TimeBlock) error {
	r.mutex.Lock()
	defer r.mutex.Unlock()

	// 既存のタイムブロックを検索
	index := -1
	for i, block := range r.data.TimeBlocks {
		if block.ID == timeBlock.ID {
			index = i
			break
		}
	}

	// 既存のタイムブロックを更新するか、新しいタイムブロックを追加する
	if index >= 0 {
		r.data.TimeBlocks[index] = timeBlock
	} else {
		r.data.TimeBlocks = append(r.data.TimeBlocks, timeBlock)
	}

	// ファイルに保存
	return r.saveToFile()
}

// Delete はタイムブロックを削除する
func (r *JSONRepository) Delete(ctx context.Context, id string) error {
	r.mutex.Lock()
	defer r.mutex.Unlock()

	// タイムブロックを検索
	index := -1
	for i, block := range r.data.TimeBlocks {
		if block.ID == id {
			index = i
			break
		}
	}

	// タイムブロックが見つからない場合はエラー
	if index < 0 {
		return ErrTimeBlockNotFound
	}

	// タイムブロックを削除
	r.data.TimeBlocks = append(r.data.TimeBlocks[:index], r.data.TimeBlocks[index+1:]...)

	// ファイルに保存
	return r.saveToFile()
}