# jikanicle アプリケーションアーキテクチャ設計

## 1. 全体アーキテクチャ

jikanicleアプリケーションは、以下のレイヤー構造に基づいて設計します：

```
     ┌─────────────────────────────────┐
     │            UI Layer             │
     │   (Ink Components, React State) │
     └───────────────┬─────────────────┘
                     │
                     ▼
     ┌─────────────────────────────────┐
     │      Application Layer          │
     │    (Use Cases, Application      │
     │        Services, DTOs)          │
     └───────────────┬─────────────────┘
                     │
                     ▼
     ┌─────────────────────────────────┐
     │         Domain Layer            │
     │  (Entities, Value Objects,      │
     │  Domain Services, Aggregates)   │
     └───────────────┬─────────────────┘
                     │
                     ▼
     ┌─────────────────────────────────┐
     │    Infrastructure Layer         │
     │ (Repositories, External         │
     │  Services, Adapters)            │
     └─────────────────────────────────┘
```

この設計は、クリーンアーキテクチャとドメイン駆動設計の原則に基づいており、以下の特徴を持ちます：

1. **層の分離**: 各レイヤーは明確に分離され、依存関係は内側に向かってのみ存在する
2. **ドメイン中心**: ビジネスルールはドメイン層にカプセル化され、他の層から独立している
3. **依存性逆転**: 高レベルモジュールは低レベルモジュールに依存しない
4. **関心の分離**: 各コンポーネントは単一の責任を持つ

## 2. レイヤー詳細設計

### 2.1 ドメイン層 (Domain Layer)

ドメイン層は、ビジネスロジックの中核を担い、外部の技術的な詳細から切り離されています。

#### 構成要素

- **エンティティ (Entities)**: Task, TimeBlock, TimeTrackingSession など
- **値オブジェクト (Value Objects)**: TaskId, Duration, PredictionFeedback など
- **ドメインサービス (Domain Services)**: 複数の集約に関わる操作を実装
- **集約 (Aggregates)**: 関連するエンティティと値オブジェクトのクラスター

#### ディレクトリ構造

```
src/domain/
├── types/           // ドメイン型定義
├── schemas/         // zodによるスキーマ検証
├── services/        // ドメインサービス
├── factories/       // ファクトリ関数
└── commands/        // コマンド関数
```

### 2.2 アプリケーション層 (Application Layer)

アプリケーション層は、ユースケースを実装し、UI層とドメイン層の間の橋渡しを行います。

#### 構成要素

- **アプリケーションサービス (Application Services)**: ユースケースの調整役
- **DTOs (Data Transfer Objects)**: レイヤー間のデータ変換
- **リポジトリインターフェース (Repository Interfaces)**: データアクセスの抽象化

#### ディレクトリ構造

```
src/application/
├── services/        // アプリケーションサービス
└── repositories/    // リポジトリインターフェース
```

### 2.3 インフラストラクチャ層 (Infrastructure Layer)

インフラストラクチャ層は、外部システムとの連携やデータストレージを担当します。

#### 構成要素

- **リポジトリ実装 (Repository Implementations)**: データ永続化の実装
- **外部サービスアダプター (External Service Adapters)**: AIサービスなどの外部連携
- **フレームワーク連携 (Framework Integration)**: ライブラリとの統合

#### ディレクトリ構造

```
src/infrastructure/
├── repositories/    // リポジトリ実装
├── ai/              // AI連携サービス
└── ui/              // UI関連ユーティリティ
```

### 2.4 UI層 (UI Layer)

UI層は、ユーザーとのインタラクションを担当します。Inkを使用したコンポーネントベースの設計です。

#### 構成要素

- **コンポーネント (Components)**: 再利用可能なUI部品
- **ページ (Pages)**: 機能単位の画面
- **状態管理 (State Management)**: UIの状態管理

#### ディレクトリ構造

```
src/ui/
├── components/       // 共通コンポーネント
├── pages/            // 機能画面
├── hooks/            // カスタムフック
└── app.tsx           // メインエントリーポイント
```

## 3. リポジトリパターンの設計

データアクセスは、リポジトリパターンを通じて抽象化されます。

### 3.1 リポジトリインターフェース

各集約ルートに対して、リポジトリインターフェースを定義します：

```typescript
// タスクリポジトリインターフェース
export interface TaskRepository {
  findById(id: TaskId): Promise<Task | null>;
  findAll(): Promise<Task[]>;
  findByStatus(status: TaskStatus): Promise<Task[]>;
  save(task: Task): Promise<void>;
  update(task: Task): Promise<void>;
  delete(id: TaskId): Promise<void>;
}

// タイムブロックリポジトリインターフェース
export interface TimeBlockRepository {
  findById(id: TimeBlockId): Promise<TimeBlock | null>;
  findByTaskId(taskId: TaskId): Promise<TimeBlock[]>;
  findByDateRange(start: Date, end: Date): Promise<TimeBlock[]>;
  save(timeBlock: TimeBlock): Promise<void>;
  update(timeBlock: TimeBlock): Promise<void>;
  delete(id: TimeBlockId): Promise<void>;
}

// その他リポジトリも同様に定義
```

### 3.2 リポジトリ実装

ローカルファイルシステムを使用した実装例：

```typescript
// ファイルベースのタスクリポジトリ実装
export const createFileTaskRepository = (filePath: string): TaskRepository => {
  return {
    async findById(id: TaskId): Promise<Task | null> {
      // ファイルからタスクを検索する実装
    },
    async findAll(): Promise<Task[]> {
      // すべてのタスクを取得する実装
    },
    // 他のメソッドも同様に実装
  };
};
```

### 3.3 依存性注入

リポジトリは、アプリケーションサービスに依存性注入されます：

```typescript
// アプリケーションサービスの構築
const createTaskService = (
  taskRepository: TaskRepository,
  predictionService: PredictionService
) => {
  return {
    // サービスの実装
  };
};
```

## 4. AIサービス統合設計

AIによる予測サービスは、アダプターパターンで抽象化します。

### 4.1 予測サービスインターフェース

```typescript
export interface PredictionService {
  estimateTaskDuration(taskName: string, category?: Category): Promise<number>;
  classifyTaskCategory(taskName: string): Promise<Category>;
  learnFromCompletedTask(task: Task): Promise<void>;
  learnFromFeedback(task: Task): Promise<void>;
}
```

### 4.2 様々な実装

#### 外部AI APIアダプター

```typescript
export const createOpenAiPredictionService = (
  apiKey: string,
  taskHistory: () => Promise<Task[]>
): PredictionService => {
  // OpenAI APIを使用した予測サービス実装
};
```

#### ローカルモデルアダプター

```typescript
export const createLocalPredictionService = (
  modelPath: string,
  taskHistory: () => Promise<Task[]>
): PredictionService => {
  // ローカルAIモデルを使用した予測サービス実装
};
```

#### モックアダプター（テスト用）

```typescript
export const createMockPredictionService = (): PredictionService => {
  // テスト用の決定論的予測を返すモック実装
};
```

## 5. Inkを使用したUI設計

Inkによる宣言的なTUIデザインを採用します。

### 5.1 コンポーネント構造

```
UI
├── App (メインアプリケーション)
│   ├── Header (アプリケーションヘッダー)
│   ├── TaskList (タスク一覧表示)
│   │   └── TaskItem (個別タスク表示)
│   ├── ScheduleView (タイムブロック表示)
│   │   └── TimeBlockItem (個別タイムブロック表示)
│   ├── TaskForm (タスク入力フォーム)
│   ├── Timer (タイムトラッキング)
│   └── Footer (ヘルプ表示)
└── Dialogs
    ├── ConfirmDialog (確認ダイアログ)
    └── FeedbackDialog (予測フィードバック)
```

### 5.2 メインアプリケーションコンポーネント例

```tsx
// App.tsx
import React, { useState } from 'react';
import { Box, Text } from 'ink';
import { TaskList } from './TaskList';
import { ScheduleView } from './ScheduleView';
import { TaskForm } from './TaskForm';
import { Timer } from './Timer';
import { Header } from './Header';
import { Footer } from './Footer';

const App: React.FC = () => {
  const [activeView, setActiveView] = useState<'tasks' | 'schedule'>('tasks');

  return (
    <Box flexDirection="column" height="100%">
      <Header />

      <Box flexGrow={1}>
        {activeView === 'tasks' ? <TaskList /> : <ScheduleView />}
      </Box>

      <Timer />
      <Footer />
    </Box>
  );
};
```

### 5.3 状態管理設計

Reactのフックベースのシンプルなアプローチを採用します：

```tsx
// useTaskState.ts
import { useState, useEffect } from 'react';
import { Task } from '../domain/types/task-types';
import { TaskRepository } from '../application/repositories/task-repository';

export const useTaskState = (taskRepository: TaskRepository) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadTasks = async () => {
      try {
        const loadedTasks = await taskRepository.findAll();
        setTasks(loadedTasks);
        setLoading(false);
      } catch (err) {
        setError('タスクの読み込みに失敗しました');
        setLoading(false);
      }
    };

    loadTasks();
  }, [taskRepository]);

  const addTask = async (task: Task) => {
    try {
      await taskRepository.save(task);
      setTasks([...tasks, task]);
      return true;
    } catch (err) {
      setError('タスクの追加に失敗しました');
      return false;
    }
  };

  // 他のタスク操作メソッド

  return {
    tasks,
    loading,
    error,
    addTask,
    // その他のメソッド
  };
};
```

## 6. エラー処理戦略

Result型を活用した例外処理を行います。

### 6.1 Result型の定義

```typescript
// src/domain/types/result.ts
export type Result<T, E = Error> = Success<T> | Failure<E>;

export interface Success<T> {
  ok: true;
  value: T;
}

export interface Failure<E> {
  ok: false;
  error: E;
}

export const ok = <T>(value: T): Success<T> => ({ ok: true, value });
export const err = <E>(error: E): Failure<E> => ({ ok: false, error });
```

### 6.2 ドメインエラーの定義

```typescript
// src/domain/types/errors.ts
export type DomainError =
  | TaskError
  | TimeBlockError
  | PredictionError;

export type TaskError =
  | { type: 'TASK_NOT_FOUND'; message: string }
  | { type: 'INVALID_TASK_DATA'; message: string }
  | { type: 'TASK_ALREADY_EXISTS'; message: string };

// 他のエラータイプも同様に定義
```

### 6.3 エラー処理の適用例

```typescript
// リポジトリ実装でのエラー処理
async findById(id: TaskId): Promise<Result<Task, TaskError>> {
  try {
    const data = await fs.readFile(this.filePath, 'utf-8');
    const tasks = JSON.parse(data);
    const task = tasks.find((t: any) => t.id === id);

    if (!task) {
      return err({ type: 'TASK_NOT_FOUND', message: `ID: ${id} のタスクが見つかりません` });
    }

    return ok(TaskSchema.parse(task));
  } catch (error) {
    return err({
      type: 'INVALID_TASK_DATA',
      message: error instanceof Error ? error.message : '不明なエラー'
    });
  }
}

// アプリケーションサービスでのエラーハンドリング
async getTask(id: TaskId): Promise<Result<Task, TaskError>> {
  const result = await this.taskRepository.findById(id);

  if (!result.ok) {
    // エラーログ処理など
    return result;
  }

  return ok(result.value);
}
```

## 7. テスト戦略

### 7.1 レイヤー別テスト計画

#### ドメイン層テスト

- 集約、エンティティ、値オブジェクトの単体テスト
- ドメインサービスの単体テスト
- 不変条件の検証テスト

#### アプリケーション層テスト

- ユースケースの単体テスト
- モックリポジトリを使用した統合テスト

#### インフラストラクチャ層テスト

- リポジトリ実装の統合テスト
- AI予測サービスのテスト

#### UI層テスト

- コンポーネントの単体テスト
- ユーザーインタラクションテスト

### 7.2 テストディレクトリ構造

```
test/
├── domain/          // ドメイン層テスト
├── application/     // アプリケーション層テスト
├── infrastructure/  // インフラストラクチャ層テスト
└── ui/              // UI層テスト
```

## 8. 進化的アーキテクチャの考慮点

### 8.1 変更への対応

- **プラグイン可能な依存関係**: リポジトリやサービスは依存性注入により簡単に差し替え可能
- **明確な境界**: レイヤー間の境界により、一部の変更が全体に影響することを防止
- **集約の独立性**: 集約間の依存を最小化し、単独で変更可能に

### 8.2 将来的な拡張性

- **新規カテゴリ追加**: カテゴリEnumの拡張だけで対応可能
- **複数デバイス同期**: リポジトリ実装を切り替えることで対応
- **AIエンジン変更**: 予測サービスインターフェースを守ることで、裏のAIエンジンを差し替え可能

## 9. まとめ

本アーキテクチャ設計は、ドメイン駆動設計の原則に基づき、変更に強く拡張性の高いアプリケーション構造を提供します。特にInkとReactを活用したUI設計、リポジトリパターンによるデータアクセスの抽象化、アダプターパターンによる外部システム統合など、モダンなアプローチを採用しています。

また、明確なレイヤー分離により、特定の実装の詳細（例：データストレージやAIエンジン）を変更しても、アプリケーション全体に影響を与えない構造となっています。