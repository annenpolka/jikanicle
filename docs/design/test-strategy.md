# jikanicle テスト戦略計画

## 1. テスト駆動開発の基本方針

jikanicleの開発は、テスト駆動開発（TDD）の原則に基づいて進めます。これは、「Red-Green-Refactor」サイクルを中心としたアプローチです：

1. **Red**: 失敗するテストを書く
2. **Green**: 最小限の実装でテストを通す
3. **Refactor**: コードをクリーンアップし、品質を向上させる

このアプローチにより、以下の利点を得ることができます：

- 設計の明確化と改善
- 回帰バグの早期発見
- リファクタリングの安全性確保
- 開発サイクルの高速化

## 2. テスト階層とカバレッジ戦略

テストは、以下の階層に分けて実装します：

```
┌───────────────────────────────────────────┐
│               E2Eテスト                   │
│  (ユーザーシナリオ全体の検証)             │
└───────────┬───────────────────────────────┘
            │  10-20%のカバレッジ
┌───────────▼───────────────────────────────┐
│              統合テスト                   │
│  (複数コンポーネント間の相互作用の検証)   │
└───────────┬───────────────────────────────┘
            │  30-40%のカバレッジ
┌───────────▼───────────────────────────────┐
│              単体テスト                   │
│  (個別コンポーネントの機能検証)           │
└───────────────────────────────────────────┘
            │  70-80%のカバレッジ
```

### 2.1 カバレッジ目標

- **全体コードカバレッジ**: 最低70%
- **ドメイン層**: 90%以上
- **アプリケーション層**: 80%以上
- **インフラストラクチャ層**: 70%以上
- **UI層**: 60%以上

## 3. レイヤー別テスト戦略

### 3.1 ドメイン層テスト

ドメイン層は、ビジネスロジックの中核であり、最も厳格にテストする必要があります。

#### テスト対象
- エンティティ（Task, TimeBlock, TimeTrackingSession）
- 値オブジェクト（TaskId, Duration, PredictionFeedback）
- ドメインサービス（複数の集約に関わる操作）
- ファクトリ関数とコマンド関数

#### テスト方針
- **純粋な単体テスト**: 外部依存のないピュアな関数として実装
- **不変条件の検証**: 値オブジェクトの不変性、エンティティの一貫性ルールの検証
- **境界値テスト**: エッジケースにおける挙動の検証
- **型安全性テスト**: TypeScriptの型システムを活用した静的解析

#### テスト例

```typescript
// src/domain/factories/__tests__/task-factory.test.ts
import { createTask } from '../task-factory';
import { Category, TaskStatus } from '../../types/task-types';

describe('TaskFactory', () => {
  test('createTask should create a valid task with required fields', () => {
    const task = createTask(
      'タスク名',
      30, // 30分の予測所要時間
      Category.WORK
    );

    expect(task).toMatchObject({
      name: 'タスク名',
      estimatedDuration: 30,
      category: Category.WORK,
      status: TaskStatus.NOT_STARTED,
    });
    expect(task.id).toBeDefined();
    expect(task.createdAt).toBeInstanceOf(Date);
  });

  test('createTask should throw error for invalid input', () => {
    expect(() => createTask('', 30, Category.WORK)).toThrow(); // 空の名前
    expect(() => createTask('タスク名', -10, Category.WORK)).toThrow(); // 負の時間
  });
});
```

### 3.2 アプリケーション層テスト

アプリケーション層は、ユースケースの調整を担当するため、ドメイン層とのインタラクションを中心にテストします。

#### テスト対象
- アプリケーションサービス
- リポジトリインターフェースの利用
- ユースケースフロー

#### テスト方針
- **モック利用**: リポジトリや外部サービスをモックに置き換え
- **ユースケース単位**: 一連の操作を一つのテストでカバー
- **例外ハンドリング**: エラー状態の処理を検証

#### テスト例

```typescript
// src/application/services/__tests__/task-application-service.test.ts
import { createTaskApplicationService } from '../task-application-service';
import { Category, Task } from '../../../domain/types/task-types';

describe('TaskApplicationService', () => {
  // モックリポジトリとサービスの準備
  const mockTaskRepository = {
    findById: jest.fn(),
    findAll: jest.fn(),
    save: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  };

  const mockPredictionService = {
    estimateTaskDuration: jest.fn(),
    classifyTaskCategory: jest.fn(),
    learnFromCompletedTask: jest.fn(),
    learnFromFeedback: jest.fn(),
  };

  // テスト前にモックをリセット
  beforeEach(() => {
    jest.resetAllMocks();
  });

  test('createTaskWithPrediction should create task with AI predictions', async () => {
    // モックの振る舞いを設定
    mockPredictionService.classifyTaskCategory.mockResolvedValue(Category.WORK);
    mockPredictionService.estimateTaskDuration.mockResolvedValue(45);

    const taskService = createTaskApplicationService(
      mockTaskRepository,
      mockPredictionService
    );

    const result = await taskService.createTaskWithPrediction('報告書を作成する');

    // 予測サービスが正しく呼ばれたか
    expect(mockPredictionService.classifyTaskCategory).toHaveBeenCalledWith('報告書を作成する');
    expect(mockPredictionService.estimateTaskDuration).toHaveBeenCalledWith('報告書を作成する', Category.WORK);

    // リポジトリにタスクが保存されたか
    expect(mockTaskRepository.save).toHaveBeenCalled();

    // 返されたタスクが正しいか
    expect(result).toMatchObject({
      name: '報告書を作成する',
      category: Category.WORK,
      estimatedDuration: 45,
    });
  });
});
```

### 3.3 インフラストラクチャ層テスト

インフラストラクチャ層は、外部システムとの連携を担当するため、統合テストが中心になります。

#### テスト対象
- リポジトリ実装
- AI予測サービス実装
- 外部サービスアダプター

#### テスト方針
- **インメモリ実装**: ファイルシステムの代わりにメモリ内データを使用
- **モックサーバー**: 外部API呼び出しのモック
- **サンドボックス環境**: 安全に統合テストを実行できる分離環境

#### テスト例

```typescript
// src/infrastructure/repositories/__tests__/file-task-repository.test.ts
import * as fs from 'fs/promises';
import { createFileTaskRepository } from '../file-task-repository';
import { Task, Category, TaskStatus } from '../../../domain/types/task-types';

// fsモジュールをモック化
jest.mock('fs/promises');

describe('FileTaskRepository', () => {
  const mockFs = fs as jest.Mocked<typeof fs>;
  const testFilePath = '/tmp/test-tasks.json';

  beforeEach(() => {
    jest.resetAllMocks();
  });

  test('findAll should return all tasks from file', async () => {
    // モックファイルの内容
    const mockTasks = [
      {
        id: '123',
        name: 'タスク1',
        estimatedDuration: 30,
        category: Category.WORK,
        status: TaskStatus.NOT_STARTED,
        createdAt: new Date().toISOString(),
      },
      {
        id: '456',
        name: 'タスク2',
        estimatedDuration: 60,
        category: Category.PERSONAL_DEV,
        status: TaskStatus.COMPLETED,
        createdAt: new Date().toISOString(),
        completedAt: new Date().toISOString(),
      },
    ];

    // ファイル読み込みをモック
    mockFs.readFile.mockResolvedValue(JSON.stringify(mockTasks));

    const repository = createFileTaskRepository(testFilePath);
    const tasks = await repository.findAll();

    expect(tasks.length).toBe(2);
    expect(tasks[0].name).toBe('タスク1');
    expect(tasks[1].name).toBe('タスク2');
  });

  test('save should write task to file', async () => {
    // 初期空ファイルの作成をモック
    mockFs.readFile.mockRejectedValueOnce({ code: 'ENOENT' });
    mockFs.writeFile.mockResolvedValue(undefined);

    const repository = createFileTaskRepository(testFilePath);
    const task: Task = {
      id: '789',
      name: '新しいタスク',
      estimatedDuration: 45,
      category: Category.LEARNING,
      status: TaskStatus.NOT_STARTED,
      createdAt: new Date(),
    };

    await repository.save(task);

    // JSON形式で保存されたか確認
    const writeCall = mockFs.writeFile.mock.calls[0];
    expect(writeCall[0]).toBe(testFilePath);
    const savedData = JSON.parse(writeCall[1] as string);
    expect(savedData).toHaveLength(1);
    expect(savedData[0].name).toBe('新しいタスク');
  });
});
```

### 3.4 UI層テスト

UI層のテストは、Inkコンポーネントの振る舞いとユーザーインタラクションを検証します。

#### テスト対象
- UIコンポーネント
- ユーザーインタラクション
- 状態管理

#### テスト方針
- **コンポーネントテスト**: Inkコンポーネントのレンダリング検証
- **インタラクションテスト**: キーボード入力やイベントの処理
- **スナップショットテスト**: UIの視覚的一貫性の確認

#### テスト例

```typescript
// src/ui/components/__tests__/TaskItem.test.tsx
import React from 'react';
import { render } from 'ink-testing-library';
import { TaskItem } from '../TaskItem';
import { Category, TaskStatus } from '../../../domain/types/task-types';

describe('TaskItem', () => {
  const mockTask = {
    id: '123',
    name: 'テストタスク',
    estimatedDuration: 30,
    category: Category.WORK,
    status: TaskStatus.NOT_STARTED,
    createdAt: new Date(),
  };

  test('renders task information correctly', () => {
    const { lastFrame } = render(<TaskItem task={mockTask} selected={false} />);

    // 出力にタスク名と予測時間が含まれているか確認
    expect(lastFrame()).toContain('テストタスク');
    expect(lastFrame()).toContain('30分');
    expect(lastFrame()).toContain('WORK');
  });

  test('displays selected state differently', () => {
    const { lastFrame } = render(<TaskItem task={mockTask} selected={true} />);

    // 選択状態の表示が異なるか確認（実際のスタイルに依存）
    expect(lastFrame()).toContain('テストタスク');
    // 選択インジケータの確認（実装に依存）
  });
});
```

## 4. テスト環境と依存管理

### 4.1 テストフレームワークと関連ツール

- **Jest**: 基本テストフレームワーク
- **ts-jest**: TypeScript統合
- **ink-testing-library**: Inkコンポーネントのテスト
- **test-doubles**: モック、スタブ、スパイの実装

### 4.2 テストデータ管理

テストデータは、以下の方針で管理します：

- **ファクトリパターン**: テストデータをプログラム的に生成
- **フィクスチャ**: 複雑なテストデータをJSON形式で保存
- **シード値**: テスト間の独立性を保つためのランダムデータ生成

```typescript
// test/factories/task-factory.ts
import { v4 as uuidv4 } from 'uuid';
import { Task, Category, TaskStatus } from '../../src/domain/types/task-types';

interface TaskOverrides {
  id?: string;
  name?: string;
  description?: string;
  estimatedDuration?: number;
  actualDuration?: number;
  category?: Category;
  status?: TaskStatus;
  createdAt?: Date;
  completedAt?: Date;
}

export function createTestTask(overrides: TaskOverrides = {}): Task {
  return {
    id: overrides.id ?? uuidv4(),
    name: overrides.name ?? 'テストタスク',
    description: overrides.description,
    estimatedDuration: overrides.estimatedDuration ?? 30,
    actualDuration: overrides.actualDuration,
    category: overrides.category ?? Category.WORK,
    status: overrides.status ?? TaskStatus.NOT_STARTED,
    createdAt: overrides.createdAt ?? new Date(),
    completedAt: overrides.completedAt,
  };
}
```

### 4.3 外部依存のモック化戦略

外部システム（特にAIサービス）との統合には、以下のモック戦略を採用します：

- **プログラムによるモック**: Jestのモック機能を使用
- **モックサーバー**: AI APIをエミュレートするローカルサーバー
- **インメモリ実装**: 実際の実装と同じインターフェース

```typescript
// test/mocks/prediction-service-mock.ts
import { PredictionService } from '../../src/domain/services/prediction-service';
import { Category, Task } from '../../src/domain/types/task-types';

export function createMockPredictionService(): PredictionService {
  // デフォルト予測値
  const defaultDuration = 30; // 30分
  const defaultCategory = Category.WORK;

  // 学習データの記録
  const learningHistory: any[] = [];

  return {
    async estimateTaskDuration(taskName: string, category?: Category): Promise<number> {
      // 「会議」を含むタスクは長めに予測
      if (taskName.includes('会議')) {
        return 60;
      }
      // 「メール」を含むタスクは短めに予測
      if (taskName.includes('メール')) {
        return 15;
      }
      return defaultDuration;
    },

    async classifyTaskCategory(taskName: string): Promise<Category> {
      // キーワードに基づく簡単な分類
      if (taskName.includes('開発') || taskName.includes('コーディング')) {
        return Category.PERSONAL_DEV;
      }
      if (taskName.includes('勉強') || taskName.includes('学習')) {
        return Category.LEARNING;
      }
      if (taskName.includes('掃除') || taskName.includes('洗濯')) {
        return Category.HOUSEHOLD;
      }
      return defaultCategory;
    },

    async learnFromCompletedTask(task: Task): Promise<void> {
      learningHistory.push({
        type: 'completed',
        task,
        timestamp: new Date(),
      });
    },

    async learnFromFeedback(task: Task): Promise<void> {
      learningHistory.push({
        type: 'feedback',
        task,
        timestamp: new Date(),
      });
    },

    // テスト用ヘルパーメソッド
    _getLearningHistory() {
      return [...learningHistory];
    },
  };
}
```

## 5. テスト実行プロセス

### 5.1 ローカル開発での実行

開発中のテスト実行は、以下のNPMスクリプトを提供します：

```json
{
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "test:unit": "jest --testPathPattern=src/.*/__tests__/.*\\.test\\.ts$",
    "test:integration": "jest --testPathPattern=test/integration/.*\\.test\\.ts$",
    "test:e2e": "jest --testPathPattern=test/e2e/.*\\.test\\.ts$"
  }
}
```

### 5.2 継続的インテグレーション（CI）

CI環境（例：GitHub Actions）でのテスト実行方法：

```yaml
# .github/workflows/test.yml
name: Tests

on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v3
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        cache: 'npm'
    - name: Install dependencies
      run: npm ci
    - name: Run tests with coverage
      run: npm run test:coverage
    - name: Upload coverage reports
      uses: codecov/codecov-action@v3
```

## 6. テスト駆動開発のワークフロー例

TDDの原則に基づいた開発ワークフローの例として、「タスク完了機能」の実装プロセスを示します：

### 6.1 要件

- タスクを完了として記録
- 実際の所要時間を保存
- 完了日時を記録
- AI予測モデルに学習データを提供

### 6.2 実装手順

1. **Red**: 失敗するテストを書く

```typescript
// src/domain/commands/__tests__/task-commands.test.ts
import { completeTask } from '../task-commands';
import { createTestTask } from '../../../../test/factories/task-factory';
import { TaskStatus } from '../../types/task-types';

describe('completeTask', () => {
  test('should mark task as completed with actual duration', () => {
    const task = createTestTask({
      status: TaskStatus.IN_PROGRESS
    });
    const actualDuration = 45; // 45分かかった

    const completedTask = completeTask(task, actualDuration);

    expect(completedTask.status).toBe(TaskStatus.COMPLETED);
    expect(completedTask.actualDuration).toBe(actualDuration);
    expect(completedTask.completedAt).toBeInstanceOf(Date);
  });

  test('should throw error if task is not in progress', () => {
    const task = createTestTask({
      status: TaskStatus.NOT_STARTED
    });

    expect(() => completeTask(task, 30)).toThrow('進行中のタスクのみ完了にできます');
  });
});
```

2. **Green**: 最小限の実装でテストを通す

```typescript
// src/domain/commands/task-commands.ts
import { Task, TaskStatus } from '../types/task-types';
import { TaskSchema } from '../schemas/task-schemas';

export function completeTask(task: Readonly<Task>, actualDuration: number): Task {
  if (task.status !== TaskStatus.IN_PROGRESS) {
    throw new Error('進行中のタスクのみ完了にできます');
  }

  const completedTask: Task = {
    ...task,
    status: TaskStatus.COMPLETED,
    actualDuration,
    completedAt: new Date(),
  };

  return TaskSchema.parse(completedTask);
}
```

3. **Refactor**: コードの最適化

```typescript
// src/domain/commands/task-commands.ts (リファクタリング後)
import { Result, err, ok } from '../types/result';
import { Task, TaskStatus } from '../types/task-types';
import { TaskSchema } from '../schemas/task-schemas';
import { TaskError } from '../types/errors';

export function completeTask(
  task: Readonly<Task>,
  actualDuration: number
): Result<Task, TaskError> {
  if (task.status !== TaskStatus.IN_PROGRESS) {
    return err({
      type: 'INVALID_TASK_STATE',
      message: '進行中のタスクのみ完了にできます'
    });
  }

  if (actualDuration <= 0) {
    return err({
      type: 'INVALID_DURATION',
      message: '実績時間は0より大きい値である必要があります'
    });
  }

  try {
    const completedTask: Task = {
      ...task,
      status: TaskStatus.COMPLETED,
      actualDuration,
      completedAt: new Date(),
    };

    return ok(TaskSchema.parse(completedTask));
  } catch (error) {
    return err({
      type: 'VALIDATION_ERROR',
      message: error instanceof Error ? error.message : '検証エラー'
    });
  }
}
```

4. テストの更新

```typescript
// テストをリファクタリングされたコードに合わせて更新
test('should mark task as completed with actual duration', () => {
  const task = createTestTask({
    status: TaskStatus.IN_PROGRESS
  });
  const actualDuration = 45;

  const result = completeTask(task, actualDuration);

  expect(result.ok).toBe(true);
  if (result.ok) {
    expect(result.value.status).toBe(TaskStatus.COMPLETED);
    expect(result.value.actualDuration).toBe(actualDuration);
    expect(result.value.completedAt).toBeInstanceOf(Date);
  }
});
```

## 7. まとめ

本テスト戦略は、jikanicleの品質とメンテナンス性を確保するための基盤です。テスト駆動開発のアプローチにより、仕様を明確にしつつ、堅牢なコードベースを構築していきます。

特に、以下の点に注力します：

1. **型安全性**: TypeScriptと静的解析の活用
2. **ドメイン整合性**: ビジネスルールの正確な実装
3. **変更への対応**: リファクタリングの安全性確保
4. **開発効率**: 迅速なフィードバックループの確立

これらの戦略により、jikanicleの継続的な改善と拡張が可能になります。