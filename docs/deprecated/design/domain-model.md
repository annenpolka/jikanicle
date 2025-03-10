# jikanicle ドメインモデル設計

## 1. ドメイン分析と境界づけられたコンテキスト

jikanicleアプリケーションでは、以下の境界づけられたコンテキストを識別します：

### 1.1 タスク管理コンテキスト
- **責務**: タスクの作成、編集、カテゴリ分類
- **集約ルート**: Task
- **エンティティ**: Task
- **値オブジェクト**: TaskId, TaskName, TaskDescription, Category, TaskStatus

### 1.2 タイムブロッキングコンテキスト
- **責務**: スケジュール生成、タイムブロックの管理
- **集約ルート**: Schedule
- **エンティティ**: TimeBlock, Schedule
- **値オブジェクト**: TimeBlockId, TimeRange, Duration

### 1.3 タイムトラッキングコンテキスト
- **責務**: 実績時間の記録と分析
- **集約ルート**: TimeTrackingSession
- **エンティティ**: TimeTrackingSession
- **値オブジェクト**: SessionId, ActualDuration, TimeStamp

### 1.4 予測コンテキスト
- **責務**: AIによる所要時間予測と学習
- **集約ルート**: PredictionModel
- **エンティティ**: PredictionModel, PredictionResult
- **値オブジェクト**: EstimatedDuration, PredictionFeedback, Confidence

## 2. ドメインモデルの詳細設計

### 2.1 タスク管理コンテキスト

#### 2.1.1 Task（集約ルート）
タスクは完了すべき単一の作業単位を表します。

```typescript
type TaskId = string; // UUID

enum Category {
  WORK = 'WORK',
  PERSONAL_DEV = 'PERSONAL_DEV',
  HOUSEHOLD = 'HOUSEHOLD',
  LEARNING = 'LEARNING',
  OTHER = 'OTHER'
}

enum TaskStatus {
  NOT_STARTED = 'NOT_STARTED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  DEFERRED = 'DEFERRED'
}

interface Task {
  id: TaskId;
  name: string;
  description?: string;
  estimatedDuration: number; // 分単位
  actualDuration?: number;   // 分単位
  category: Category;
  status: TaskStatus;
  createdAt: Date;
  completedAt?: Date;
  predictionFeedback?: PredictionFeedback;
}
```

#### 2.1.2 PredictionFeedback（値オブジェクト）
ユーザーが予測結果に対して提供するフィードバック。

```typescript
enum FeedbackType {
  TOO_SHORT = 'TOO_SHORT',
  TOO_LONG = 'TOO_LONG',
  ACCURATE = 'ACCURATE',
  UNCERTAIN = 'UNCERTAIN'
}

interface PredictionFeedback {
  type: FeedbackType;
  userComment?: string;
  createdAt: Date;
}
```

### 2.2 タイムブロッキングコンテキスト

#### 2.2.1 TimeBlock（エンティティ）
スケジュール内の特定の時間帯に割り当てられたタスク。

```typescript
type TimeBlockId = string; // UUID

interface TimeBlock {
  id: TimeBlockId;
  taskId: TaskId;
  startTime: Date;
  endTime: Date;
  isCompleted: boolean;
}
```

#### 2.2.2 Schedule（集約ルート）
一日のタイムブロックの集合。

```typescript
interface Schedule {
  date: Date;
  timeBlocks: TimeBlock[];
}
```

### 2.3 タイムトラッキングコンテキスト

#### 2.3.1 TimeTrackingSession（集約ルート）
タスクの開始から完了までの時間を計測するセッション。

```typescript
type SessionId = string; // UUID

enum SessionStatus {
  ACTIVE = 'ACTIVE',
  PAUSED = 'PAUSED',
  COMPLETED = 'COMPLETED'
}

interface TimeTrackingSession {
  id: SessionId;
  taskId: TaskId;
  startTime: Date;
  endTime?: Date;
  pausedDuration: number; // 分単位
  status: SessionStatus;
  breaks: TimeRange[];
}

interface TimeRange {
  start: Date;
  end?: Date;
}
```

### 2.4 予測コンテキスト

#### 2.4.1 PredictionModel（集約ルート）
タスクの所要時間を予測するAIモデル。

```typescript
interface PredictionModel {
  modelId: string;
  version: string;
  lastUpdated: Date;
  trainingData: PredictionTrainingData[];
}

interface PredictionTrainingData {
  taskName: string;
  category: Category;
  estimatedDuration: number;
  actualDuration: number;
  feedback?: FeedbackType;
}
```

#### 2.4.2 PredictionResult（エンティティ）
AIによる予測結果。

```typescript
interface PredictionResult {
  taskId: TaskId;
  estimatedDuration: number;
  confidence: number; // 0-1の範囲
  suggestedCategory: Category;
  createdAt: Date;
}
```

## 3. ドメイン間の関係とインタラクション

### 3.1 ドメイン間の依存関係

```
タスク管理 ← タイムブロッキング  // タイムブロックはタスクを参照
タスク管理 ← タイムトラッキング  // トラッキングセッションはタスクを参照
タスク管理 ← 予測            // 予測はタスクに適用される
予測 → タスク管理           // 予測結果はタスクに影響する（双方向）
```

### 3.2 主要なユースケースとワークフロー

1. **タスク作成と予測**
   - ユーザーがタスク名と説明を入力
   - 予測コンテキストがカテゴリと所要時間を予測
   - タスク管理コンテキストで新タスク作成

2. **タイムブロック生成**
   - 複数タスクと時間枠を基に
   - タイムブロッキングコンテキストがスケジュール生成

3. **タスク実行と時間計測**
   - タイムトラッキングコンテキストでセッション開始
   - 一時停止や再開などのイベント記録
   - 完了時に実績時間を記録

4. **AIモデルの学習**
   - タスク実績とフィードバックを収集
   - 予測コンテキストでモデル更新
   - 次回予測の精度向上

## 4. データフロー図

```
[ユーザー] → タスク入力 → [予測コンテキスト] → 予測結果 →
[タスク管理コンテキスト] → タスク作成 → [タイムブロッキングコンテキスト] →
タイムブロック生成 → [ユーザー] → タスク実行 →
[タイムトラッキングコンテキスト] → 実績記録 →
[予測コンテキスト] → モデル更新
```

## 5. 設計上の考慮点

### 5.1 不変条件（Invariants）

- タスクの実績時間は予測時間以上の場合にのみフィードバックが可能
- タイムブロックの総時間はスケジュールの時間枠を超えてはならない
- タイムトラッキングセッションの休憩時間は総時間から控除される

### 5.2 エンティティの識別性

- すべてのエンティティは一意のIDを持ち、それにより識別される
- タスク、タイムブロック、トラッキングセッションはそれぞれ独立したライフサイクルを持つ

### 5.3 値オブジェクトの不変性

- Duration、TimeRange、PredictionFeedbackなどの値オブジェクトは不変
- 値の変更が必要な場合は、新しいインスタンスを生成

## 6. テスト戦略

### 6.1 ドメインモデルのテスト範囲

- **単体テスト**: 各エンティティと値オブジェクトの検証
- **統合テスト**: コンテキスト間の相互作用の検証
- **受け入れテスト**: 主要ユーザーストーリーの検証

### 6.2 テストケースの優先順位

1. タスク作成と予測精度
2. タイムブロック生成アルゴリズム
3. トラッキングセッションのイベント処理
4. AI予測モデルの学習機能

## 7. 進化的アーキテクチャの考慮点

### 7.1 拡張性

- **追加カテゴリ**: カテゴリは列挙型で定義され、容易に拡張可能
- **予測アルゴリズム**: 予測インターフェースを守る限り、実装の入れ替えが可能
- **データストレージ**: リポジトリパターンにより、ストレージの差し替えが容易

### 7.2 変更への強靭性

- **コンテキスト境界**: 明確な境界により、一方の変更がもう一方に与える影響を最小化
- **依存関係の管理**: 高レベルモジュールが低レベルモジュールに依存しない
- **インターフェース分離**: 各コンポーネントは必要最小限のインターフェースを定義

## 8. まとめ

このドメインモデル設計は、jikanicleアプリケーションの中核となる概念と構造を定義します。DDDアプローチに基づき、明確な境界と責任を持つコンテキストに分割しました。この設計により、ユーザーがタスクを簡単に入力し、AIによる支援を受けながら効率的な時間管理を実現できるシステム基盤が形成されます。