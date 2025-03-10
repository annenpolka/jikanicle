/**
 * メインアプリケーションコンポーネント
 *
 * このファイルでは、アプリケーション全体のレイアウトと基本構造を定義します。
 * タスク管理のメインインターフェースであり、各種UIコンポーネントの組み立てと
 * ストアの初期化・連携を行います。
 */

import { Box, Text } from 'ink';
import React, { useEffect, useState } from 'react';
import type { TaskRepository } from '../application/repositories/task-repository.js';
import type { Task, TaskId } from '../domain/types/Task.js';
import { TaskForm } from './components/TaskForm.js';
import { TaskList } from './components/TaskList.js';
import { useKeyBindings } from './hooks/useKeyBindings.js';
import type { KeyBindingConfig } from './input/types.js';
import { createTaskStore } from './state/stores/task-store.js';

// メインアプリケーションのキーバインド設定
const APP_KEYBINDINGS: KeyBindingConfig<AppAction> = {
  help: [{ key: '?' }],
  createTask: [{ key: 'n' }],
  editTask: [{ key: 'e' }],
  deleteTask: [{ key: 'd' }],
  quit: [{ key: 'q' }]
};

// アプリケーションのアクションタイプ
type AppAction = 'help' | 'createTask' | 'editTask' | 'deleteTask' | 'quit';

// キーバインドからキー表示文字列を生成する関数
function getKeyDisplayText<TAction extends string>(
  bindings: KeyBindingConfig<TAction>,
  action: TAction
): string {
  const binding = bindings[action]?.[0];
  if (!binding) return '';

  if (binding.key) return binding.key;
  if (binding.return) return 'Enter';
  return '';
}

// アプリケーション表示モード
type AppMode = 'list' | 'create' | 'edit' | 'help';

/**
 * メインアプリケーションコンポーネントのPropsタイプ
 */
export interface AppProps {
  readonly taskRepository: TaskRepository;
  readonly testID?: string;
}

/**
 * メインアプリケーションコンポーネント
 *
 * アプリケーション全体のレイアウトと基本構造を定義します。
 *
 * @param props コンポーネントProps
 * @returns Reactコンポーネント
 */
export const App: React.FC<AppProps> = ({ taskRepository, testID = 'app' }) => {
  // アプリケーションの状態
  const [mode, setMode] = useState<AppMode>('list');
  const [selectedTaskId, setSelectedTaskId] = useState<TaskId | null>(null);
  const [tasks, setTasks] = useState<readonly Task[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ストアの初期化
  const store = React.useMemo(() => createTaskStore(taskRepository), [taskRepository]);

  // 編集中のタスクを保持する状態
  const [editingTask, setEditingTask] = useState<Task | undefined>(undefined);
  // 削除確認モーダル表示状態
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // タスクの読み込み
  useEffect(() => {
    const fetchTasks = async () => {
      setLoading(true);
      setError(null);

      try {
        // タスクストアからの読み込みを実行
        await store.getState().fetchTasks();

        // ストアの状態をローカルステートに反映
        const storeState = store.getState();
        setTasks(storeState.tasks);

        if (storeState.error) {
          setError(storeState.error.message);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : '不明なエラーが発生しました');
      } finally {
        setLoading(false);
      }
    };

    fetchTasks();

    // ストアの変更を監視
    const unsubscribe = store.subscribe((state) => {
      setTasks(state.tasks);
      setSelectedTaskId(state.selectedTaskId);
      setLoading(state.loading);
      if (state.error) {
        setError(state.error.message);
      } else {
        setError(null);
      }
    });

    // コンポーネントのアンマウント時にクリーンアップ
    return () => {
      unsubscribe();
    };
  }, [store]);

  // キーバインドの設定
  useKeyBindings<AppAction>(APP_KEYBINDINGS, {
    onAction: (action) => {
      switch (action) {
        case 'help':
          setMode('help');
          break;
        case 'createTask':
          setMode('create');
          break;
        case 'editTask':
          if (selectedTaskId) {
            setMode('edit');
          }
          break;
        case 'deleteTask':
          if (selectedTaskId && mode === 'list') {
            store.getState().openDeleteConfirm();
          }
          break;
        case 'quit':
          // インターフェイスの終了処理
          // Inkで実装する場合は特別な終了ハンドリングが必要
          process.exit(0);
      }
    }
  });

  // タスク選択イベントハンドラ
  const handleSelectTask = (taskId: TaskId) => {
    store.getState().selectTask(taskId);
  };

  // タスク作成処理
  const handleCreateTask = (taskData: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => {
    // ストアに必要なパラメータのみを渡し、ID生成はドメイン層に任せる
    void store.getState().createTask(taskData);
    setMode('list');
  };

  // タスク編集処理
  const handleUpdateTask = (taskData: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (selectedTaskId) {
      const currentTask = tasks.find(task => task.id === selectedTaskId);
      if (currentTask) {
        const updatedTask: Task = {
          ...currentTask,
          ...taskData,
          updatedAt: new Date()
        };
        void store.getState().updateTask(updatedTask);
      }
      setMode('list');
      setEditingTask(undefined);
    }
  };

  // タスク削除処理
  const handleDeleteTask = async () => {
    if (selectedTaskId) {
      await store.getState().deleteTask(selectedTaskId);
      setShowDeleteConfirm(false);
    }
  };

  // キャンセル処理
  const handleCancel = () => {
    setMode('list');
    setEditingTask(undefined);
    setShowDeleteConfirm(false);
  };

  // モード切替時の処理
  useEffect(() => {
    if (mode === 'edit' && selectedTaskId) {
      // 編集モードに入る時に選択中のタスクを取得
      const taskToEdit = tasks.find(task => task.id === selectedTaskId);
      setEditingTask(taskToEdit);
    }
  }, [mode, selectedTaskId, tasks]);

  // Zustandストアの削除確認状態を監視
  useEffect(() => {
    const storeState = store.getState();
    setShowDeleteConfirm(storeState.isDeleteConfirmOpen);
  }, [store, tasks]);

  // モードに応じたコンテンツの表示
  const renderContent = () => {
    if (loading) {
      return <Text>読み込み中...</Text>;
    }

    if (error) {
      return <Text color="red">エラー: {error}</Text>;
    }

    switch (mode) {
      case 'list':
        return (
          <TaskList
            tasks={tasks}
            selectedTaskId={selectedTaskId ?? undefined}
            onSelectTask={handleSelectTask}
          />
        );
      case 'create':
        // タスク作成フォームは後で実装
        return (
          <TaskForm
            onSubmit={handleCreateTask}
            onCancel={handleCancel}
          />
        );
      case 'edit':
        return (
          <TaskForm
            task={editingTask}
            onSubmit={handleUpdateTask}
            onCancel={handleCancel}
          />
        );
      case 'help':
        return (
          <Box flexDirection="column" padding={1}>
            <Text bold>ヘルプ</Text>
            <Text>{getKeyDisplayText(APP_KEYBINDINGS, 'help')}: ヘルプ表示</Text>
            <Text>{getKeyDisplayText(APP_KEYBINDINGS, 'createTask')}: 新規タスク作成</Text>
            <Text>{getKeyDisplayText(APP_KEYBINDINGS, 'editTask')}: 選択したタスクの編集</Text>
            <Text>{getKeyDisplayText(APP_KEYBINDINGS, 'deleteTask')}: 選択したタスクの削除</Text>
            <Text>{getKeyDisplayText(APP_KEYBINDINGS, 'quit')}: アプリケーション終了</Text>
            <Text>↑/↓: タスク選択の移動</Text>
            <Text>Enter: タスク選択</Text>
            <Text>ESC: キャンセル/前の画面に戻る</Text>
          </Box>
        );
    }
  };

  // アプリケーション全体のレイアウト
  return (
    <Box flexDirection="column" height="100%" data-testid={testID}>
      {/* ヘッダー */}
      <Box borderStyle="single" padding={1}>
        <Text bold>jikanicle - タスク管理</Text>
      </Box>

      {/* メインコンテンツ */}
      <Box flexGrow={1} padding={1}>
        {renderContent()}

        {/* 削除確認モーダル */}
        {renderDeleteConfirm(
          showDeleteConfirm,
          tasks,
          selectedTaskId,
          handleDeleteTask,
          handleCancel
        )}
      </Box>

      {/* フッター */}
      <Box borderStyle="single" padding={1}>
        <Text>
          ヘルプ: {getKeyDisplayText(APP_KEYBINDINGS, 'help')} |
          新規作成: {getKeyDisplayText(APP_KEYBINDINGS, 'createTask')} |
          編集: {getKeyDisplayText(APP_KEYBINDINGS, 'editTask')} |
          削除: {getKeyDisplayText(APP_KEYBINDINGS, 'deleteTask')} |
          終了: {getKeyDisplayText(APP_KEYBINDINGS, 'quit')}
        </Text>
      </Box>
    </Box>
  );
};

/**
 * 削除確認モーダルの表示
 */
const renderDeleteConfirm = (
  showDeleteConfirm: boolean,
  tasks: readonly Task[],
  selectedTaskId: TaskId | null,
  handleDeleteTask: () => Promise<void>,
  handleCancel: () => void
) => {
  if (!showDeleteConfirm) return null;

  const selectedTask = tasks.find(task => task.id === selectedTaskId);
  if (!selectedTask) return null;

  // 削除確認ダイアログのキー操作設定
  useKeyBindings({
    confirm: [{ return: true }],
    cancel: [{ escape: true }]
  }, {
    enabled: showDeleteConfirm,
    onAction: (action) => {
      if (action === 'confirm') {
        void handleDeleteTask();
      } else if (action === 'cancel') {
        handleCancel();
      }
    }
  });

  return (
    <Box flexDirection="column" borderStyle="round" borderColor="red" padding={1}>
      <Text bold color="red">タスク削除の確認</Text>
      <Text>以下のタスクを削除しますか？</Text>
      <Text>{selectedTask.name}</Text>
      <Box marginTop={1}>
        <Text>確認: Enter | キャンセル: Esc</Text>
      </Box>
    </Box>
  );
};

export default App;