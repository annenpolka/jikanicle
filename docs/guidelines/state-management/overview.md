# jikanicle 状態管理設計

## 1. 概要

本ドキュメントでは、jikanicleアプリケーションにおける状態管理の設計方針と実装戦略について詳述します。DDDの原則とTypeScriptの型安全性を活かした状態管理アプローチを採用し、アプリケーション全体の一貫性と保守性を確保します。

## 2. 状態管理の基本方針

jikanicleの状態管理は以下の原則に基づいて設計します：

1. **ドメイン中心の状態設計**: ドメインモデルを中心に据え、UI状態はドメインモデルから派生させる
2. **単一方向データフロー**: 状態の変更は明確に定義されたパスを通じてのみ行われる
3. **不変性の原則**: 状態は直接変更せず、新しい状態を生成する
4. **型安全性の確保**: TypeScriptの型システムを活用し、コンパイル時に状態の整合性を検証
5. **関心の分離**: ドメイン状態、UI状態、アプリケーション状態を明確に分離

## 3. 状態の分類と責任範囲

### 3.1 ドメイン状態

ドメイン状態はビジネスロジックに関連する状態で、ドメイン層で定義されます。

- **特徴**: エンティティ、値オブジェクト、集約の状態
- **管理方法**: リポジトリパターンを通じた永続化
- **例**: タスク一覧、タイムブロック、トラッキングセッション

### 3.2 アプリケーション状態

アプリケーション状態はユースケースの実行に関連する状態です。

- **特徴**: ユースケースの進行状態、エラー状態、非同期処理の状態
- **管理方法**: アプリケーションサービスとカスタムフック
- **例**: データ読み込み状態、操作結果、エラーメッセージ

### 3.3 UI状態

UI状態はユーザーインターフェースの表示に関連する状態です。

- **特徴**: 表示/非表示、選択状態、フォーム入力値
- **管理方法**: Reactのローカル状態とコンテキスト
- **例**: 選択中のタブ、モーダルの表示状態、フォームの入力値

## 4. 状態管理の実装戦略

### 4.1 ドメイン状態の管理

ドメイン状態は、リポジトリパターンを通じて管理します。

```typescript
// リポジトリインターフェース
export interface TaskRepository {
  findById(id: TaskId): Promise<Result<Task, TaskRepositoryError>>;
  findAll(filter?: TaskFilter): Promise<Result<readonly Task[], TaskRepositoryError>>;
  save(task: Task): Promise<Result<Task, TaskRepositoryError>>;
  delete(id: TaskId): Promise<Result<void, TaskRepositoryError>>;
  count(filter?: TaskFilter): Promise<Result<number, TaskRepositoryError>>;
}

// リポジトリの実装（インメモリ、ファイルベース、APIベースなど）
export function createInMemoryTaskRepository(): TaskRepository {
  // 実装詳細
}
```

### 4.2 アプリケーション状態の管理

アプリケーション状態は、カスタムフックとアプリケーションサービスを通じて管理します。

```typescript
// アプリケーションサービス
export interface TaskApplicationService {
  getTasks(filter?: TaskFilter): Promise<Result<readonly Task[], ApplicationError>>;
  createTask(params: CreateTaskParams): Promise<Result<Task, ApplicationError>>;
  updateTask(id: TaskId, updates: Partial<Task>): Promise<Result<Task, ApplicationError>>;
  deleteTask(id: TaskId): Promise<Result<void, ApplicationError>>;
}

// カスタムフック
export function useTaskService(taskRepository: TaskRepository): TaskApplicationService & {
  loading: boolean;
  error: ApplicationError | null;
} {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<ApplicationError | null>(null);

  // 実装詳細
}
```

### 4.3 UI状態の管理

UI状態は、Reactのローカル状態とコンテキストを通じて管理します。

```typescript
// UIコンテキスト
export interface UIState {
  activeView: 'tasks' | 'schedule' | 'tracking';
  selectedTaskId: TaskId | null;
  isModalOpen: boolean;
  modalType: 'create' | 'edit' | 'delete' | null;
}

export const UIContext = createContext<{
  state: UIState;
  dispatch: React.Dispatch<UIAction>;
} | undefined>(undefined);

// UIアクション
type UIAction =
  | { type: 'SET_ACTIVE_VIEW'; payload: UIState['activeView'] }
  | { type: 'SELECT_TASK'; payload: TaskId | null }
  | { type: 'OPEN_MODAL'; payload: { type: UIState['modalType'] } }
  | { type: 'CLOSE_MODAL' };

// UIコンテキストプロバイダー
export function UIProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(uiReducer, initialUIState);

  return (
    <UIContext.Provider value={{ state, dispatch }}>
      {children}
    </UIContext.Provider>
  );
}

// UIコンテキストを使用するカスタムフック
export function useUI() {
  const context = useContext(UIContext);
  if (context === undefined) {
    throw new Error('useUI must be used within a UIProvider');
  }
  return context;
}
```

## 5. 状態間の連携

### 5.1 ドメイン状態とアプリケーション状態の連携

ドメイン状態とアプリケーション状態は、アプリケーションサービスを通じて連携します。

```typescript
// アプリケーションサービスの実装例
export function createTaskApplicationService(
  taskRepository: TaskRepository,
  taskFactory: TaskFactory
): TaskApplicationService {
  return {
    async getTasks(filter?: TaskFilter) {
      try {
        return await taskRepository.findAll(filter);
      } catch (error) {
        return err({
          type: 'UNEXPECTED_ERROR',
          message: error instanceof Error ? error.message : '予期しないエラーが発生しました',
          cause: error
        });
      }
    },

    // 他のメソッド実装
  };
}
```

### 5.2 アプリケーション状態とUI状態の連携

アプリケーション状態とUI状態は、Reactのカスタムフックを通じて連携します。

```typescript
// タスク管理画面のカスタムフック
export function useTaskManagement(
  taskService: TaskApplicationService,
  uiState: UIState,
  uiDispatch: React.Dispatch<UIAction>
) {
  const [tasks, setTasks] = useState<readonly Task[]>([]);

  // タスク一覧の取得
  useEffect(() => {
    const loadTasks = async () => {
      const result = await taskService.getTasks();
      if (result.ok) {
        setTasks(result.value);
      }
    };

    loadTasks();
  }, [taskService]);

  // タスクの選択
  const selectTask = (taskId: TaskId | null) => {
    uiDispatch({ type: 'SELECT_TASK', payload: taskId });
  };

  // タスクの作成モーダルを開く
  const openCreateTaskModal = () => {
    uiDispatch({ type: 'OPEN_MODAL', payload: { type: 'create' } });
  };

  // 他の関数実装

  return {
    tasks,
    selectedTask: uiState.selectedTaskId ? tasks.find(t => t.id === uiState.selectedTaskId) : null,
    selectTask,
    openCreateTaskModal,
    // 他の返却値
  };
}
```

## 6. 状態変更のパターン

### 6.1 コマンドパターン

ドメイン状態の変更は、コマンドパターンを通じて行います。

```typescript
// タスク削除コマンド
export async function deleteTask(
  taskId: TaskId,
  taskRepository: TaskRepository
): Promise<Result<void, TaskRepositoryError>> {
  // タスクの存在確認
  const taskResult = await taskRepository.findById(taskId);
  if (!taskResult.ok) {
    return taskResult;
  }

  // タスクの削除
  return await taskRepository.delete(taskId);
}
```

### 6.2 ファクトリパターン

新しいエンティティの作成は、ファクトリパターンを通じて行います。

```typescript
// タスク作成ファクトリ
export function createTask(params: CreateTaskParams): Task {
  const now = new Date();
  const validatedParams = validateCreateTaskParams(params);

  return {
    id: params.id ?? createTaskId(crypto.randomUUID()),
    name: validatedParams.name,
    description: validatedParams.description ?? '',
    status: validatedParams.status ?? 'NOT_STARTED',
    category: validatedParams.category,
    priority: validatedParams.priority ?? 'MEDIUM',
    estimatedDuration: validatedParams.estimatedDuration,
    createdAt: params.createdAt ?? now,
    updatedAt: now,
    tags: validatedParams.tags ?? [],
  };
}
```

### 6.3 リデューサーパターン

UI状態の変更は、リデューサーパターンを通じて行います。

```typescript
// UIリデューサー
function uiReducer(state: UIState, action: UIAction): UIState {
  switch (action.type) {
    case 'SET_ACTIVE_VIEW':
      return { ...state, activeView: action.payload };
    case 'SELECT_TASK':
      return { ...state, selectedTaskId: action.payload };
    case 'OPEN_MODAL':
      return { ...state, isModalOpen: true, modalType: action.payload.type };
    case 'CLOSE_MODAL':
      return { ...state, isModalOpen: false, modalType: null };
    default:
      return state;
  }
}
```

## 7. 状態の永続化

### 7.1 ローカルストレージ

シンプルな状態の永続化には、ローカルストレージを使用します。

```typescript
// ローカルストレージベースのリポジトリ
export function createLocalStorageTaskRepository(): TaskRepository {
  const STORAGE_KEY = 'jikanicle_tasks';

  return {
    async findById(id) {
      try {
        const tasksJson = localStorage.getItem(STORAGE_KEY);
        if (!tasksJson) {
          return err({ type: 'NOT_FOUND', message: `タスクID: ${id} は見つかりませんでした` });
        }

        const tasks = JSON.parse(tasksJson) as Task[];
        const task = tasks.find(t => t.id === id);

        if (!task) {
          return err({ type: 'NOT_FOUND', message: `タスクID: ${id} は見つかりませんでした` });
        }

        return ok(task);
      } catch (error) {
        return err({
          type: 'STORAGE_ERROR',
          message: 'ストレージからの読み込み中にエラーが発生しました',
          cause: error
        });
      }
    },

    // 他のメソッド実装
  };
}
```

### 7.2 ファイルベースのストレージ

より複雑なデータや大量のデータには、ファイルベースのストレージを使用します。

```typescript
// ファイルベースのリポジトリ（Node.js環境）
export function createFileTaskRepository(filePath: string): TaskRepository {
  // 実装詳細
}
```

## 8. 状態管理のテスト戦略

### 8.1 ドメイン状態のテスト

ドメイン状態のテストは、リポジトリのモックを使用して行います。

```typescript
// タスク削除コマンドのテスト
describe('deleteTask', () => {
  it('should delete an existing task', async () => {
    // モックリポジトリの準備
    const mockRepository = createInMemoryTaskRepository([
      { id: 'task-1', name: 'Test Task', /* 他のプロパティ */ }
    ]);

    // コマンドの実行
    const result = await deleteTask('task-1', mockRepository);

    // 結果の検証
    expect(result.ok).toBe(true);

    // リポジトリの状態検証
    const findResult = await mockRepository.findById('task-1');
    expect(findResult.ok).toBe(false);
    expect(findResult.error.type).toBe('NOT_FOUND');
  });
});
```

### 8.2 UI状態のテスト

UI状態のテストは、Reactのテスティングライブラリを使用して行います。

```typescript
// UIリデューサーのテスト
describe('uiReducer', () => {
  it('should handle SET_ACTIVE_VIEW action', () => {
    const initialState: UIState = {
      activeView: 'tasks',
      selectedTaskId: null,
      isModalOpen: false,
      modalType: null
    };

    const action: UIAction = {
      type: 'SET_ACTIVE_VIEW',
      payload: 'schedule'
    };

    const newState = uiReducer(initialState, action);

    expect(newState.activeView).toBe('schedule');
    expect(newState.selectedTaskId).toBe(null); // 他の状態は変更されない
    expect(newState.isModalOpen).toBe(false);
    expect(newState.modalType).toBe(null);
  });
});
```

## 9. 状態管理の進化戦略

### 9.1 状態管理の拡張性

新しい機能やドメインの追加に対応するため、状態管理は拡張性を考慮して設計します。

- **新しいコンテキストの追加**: 新しいバウンデッドコンテキストが追加された場合、対応するリポジトリとアプリケーションサービスを追加
- **状態間の連携**: イベントベースの連携を通じて、異なるコンテキスト間の状態変更を伝播
- **プラグイン可能なストレージ**: 異なるストレージ実装を簡単に切り替えられるよう、リポジトリインターフェースを抽象化

### 9.2 パフォーマンス最適化

状態管理のパフォーマンスを最適化するための戦略：

- **メモ化**: 派生データの計算にはメモ化を使用し、不要な再計算を防止
- **選択的更新**: 状態の一部のみが変更された場合、関連するコンポーネントのみを再レンダリング
- **遅延読み込み**: 必要になるまでデータを読み込まない
- **バッチ処理**: 複数の状態更新をバッチ処理し、レンダリングの回数を減らす

## 10. まとめ

jikanicleの状態管理は、ドメイン駆動設計の原則に基づき、型安全性と不変性を重視した設計となっています。ドメイン状態、アプリケーション状態、UI状態を明確に分離し、それぞれに適した管理方法を採用することで、アプリケーション全体の一貫性と保守性を確保します。

また、テスト容易性と拡張性を考慮した設計により、将来的な機能追加や変更にも柔軟に対応できる構造となっています。