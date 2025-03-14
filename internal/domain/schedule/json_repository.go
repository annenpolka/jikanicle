package schedule

import (
	"context"
	"encoding/json"
	"fmt"
	"os"
	"path/filepath"
	"sync"
	"time"
)

// DailyPlansData はJSONファイルに保存されるデータ構造
type DailyPlansData struct {
	DailyPlans []*DailyPlan `json:"dailyPlans"`
}

// JSONRepository はDailyPlanデータをJSONファイルに永続化するリポジトリの実装
type JSONRepository struct {
	filePath string
	data     DailyPlansData
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
		data: DailyPlansData{
			DailyPlans: []*DailyPlan{},
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

// saveToFile はDailyPlanデータをJSONファイルに保存する
func (r *JSONRepository) saveToFile() error {
	data, err := json.MarshalIndent(r.data, "", "  ")
	if err != nil {
		return fmt.Errorf("failed to marshal daily plans data: %w", err)
	}

	if err := os.WriteFile(r.filePath, data, 0644); err != nil {
		return fmt.Errorf("failed to write to JSON file: %w", err)
	}

	return nil
}

// FindByDate は指定された日付のDailyPlanを検索する
func (r *JSONRepository) FindByDate(ctx context.Context, date time.Time) (*DailyPlan, error) {
	r.mutex.RLock()
	defer r.mutex.RUnlock()

	dateStr := date.Format("2006-01-02")
	for _, plan := range r.data.DailyPlans {
		if plan.Date.Format("2006-01-02") == dateStr {
			return plan, nil
		}
	}

	return nil, ErrDailyPlanNotFound
}

// FindByDateRange は指定された日付範囲内のDailyPlanを検索する
func (r *JSONRepository) FindByDateRange(ctx context.Context, start, end time.Time) ([]*DailyPlan, error) {
	r.mutex.RLock()
	defer r.mutex.RUnlock()

	var result []*DailyPlan
	startStr := start.Format("2006-01-02")
	endStr := end.Format("2006-01-02")

	for _, plan := range r.data.DailyPlans {
		planDateStr := plan.Date.Format("2006-01-02")
		// start <= planDate <= end
		if planDateStr >= startStr && planDateStr <= endStr {
			result = append(result, plan)
		}
	}

	return result, nil
}

// FindAll は全てのDailyPlanを取得する
func (r *JSONRepository) FindAll(ctx context.Context) ([]*DailyPlan, error) {
	r.mutex.RLock()
	defer r.mutex.RUnlock()

	plans := make([]*DailyPlan, len(r.data.DailyPlans))
	copy(plans, r.data.DailyPlans)
	return plans, nil
}

// Save はDailyPlanを保存する
func (r *JSONRepository) Save(ctx context.Context, plan *DailyPlan) error {
	r.mutex.Lock()
	defer r.mutex.Unlock()

	// 既存のDailyPlanを検索
	index := -1
	dateStr := plan.Date.Format("2006-01-02")
	for i, p := range r.data.DailyPlans {
		if p.Date.Format("2006-01-02") == dateStr {
			index = i
			break
		}
	}

	// 既存のDailyPlanを更新するか、新しいDailyPlanを追加する
	if index >= 0 {
		r.data.DailyPlans[index] = plan
	} else {
		r.data.DailyPlans = append(r.data.DailyPlans, plan)
	}

	// ファイルに保存
	return r.saveToFile()
}

// Delete は指定された日付のDailyPlanを削除する
func (r *JSONRepository) Delete(ctx context.Context, date time.Time) error {
	r.mutex.Lock()
	defer r.mutex.Unlock()

	// DailyPlanを検索
	index := -1
	dateStr := date.Format("2006-01-02")
	for i, plan := range r.data.DailyPlans {
		if plan.Date.Format("2006-01-02") == dateStr {
			index = i
			break
		}
	}

	// DailyPlanが見つからない場合はエラー
	if index < 0 {
		return ErrDailyPlanNotFound
	}

	// DailyPlanを削除
	r.data.DailyPlans = append(r.data.DailyPlans[:index], r.data.DailyPlans[index+1:]...)

	// ファイルに保存
	return r.saveToFile()
}