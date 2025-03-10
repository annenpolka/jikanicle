/**
 * タスクリストコンポーネント
 *
 * ターミナルインターフェースでタスクの一覧を表示し、キーボード操作を
 * サポートするコンポーネント。各タスクの状態に応じた色分け、選択状態の
 * 視覚化、柔軟なキーバインドによる操作を提供します。
 */

import { Box, Text } from 'ink';
import React from 'react';
import type { Task, TaskId } from '../../domain/types/Task.js';
import { DEFAULT_TASK_LIST_BINDINGS } from '../input/key-binding-handler.js';
import type { KeyBindingConfig, TaskListAction } from '../input/types.js';
import { useKeyBindings } from '../hooks/useKeyBindings.js';

// 優先度に応じた表示スタイルの定義
const PRIORITY_STYLES = {
  HIGH: { indicator: '🔴', label: '高' },
  MEDIUM: { indicator: '🟡', label: '中' },
  LOW: { indicator: '🟢', label: '低' }
};

// タスク状態に応じた表示色の定義
const STATUS_COLORS = {
  NOT_STARTED: 'white',
  IN_PROGRESS: 'yellow',
  COMPLETED: 'green',
  CANCELLED: 'gray'
};

// 状態表示テキストの定義
const STATUS_LABELS = {
  NOT_STARTED: '未着手',
  IN_PROGRESS: '進行中',
  COMPLETED: '完了',
  CANCELLED: '中止'
};

// タスクリストコンポーネントの型定義
export interface TaskListProps {
  // 表示するタスク配列
  tasks: readonly Task[];
  // 選択中のタスクID（省略可）
  selectedTaskId?: TaskId;
  // タスク選択イベントハンドラ（省略可）
  onSelectTask?: (taskId: TaskId) => void;
  // カスタムキーバインド設定（省略可）
  keyBindings?: Partial<KeyBindingConfig<TaskListAction>>;
}

/**
 * タスクリストコンポーネント
 *
 * タスクの一覧表示、選択状態の視覚化を行います。
 *
 * @param props コンポーネントProps
 * @returns Reactコンポーネント
 */
export const TaskList: React.FC<TaskListProps> = ({
  tasks,
  selectedTaskId,
  onSelectTask = () => {},
  keyBindings = {}
}) => {
  // タスクが空の場合のメッセージ
  if (tasks.length === 0) {
    return (
      <Box padding={1} borderStyle="single">
        <Text>タスクがありません</Text>
      </Box>
    );
  }

  // キーバインドの設定とキー操作のハンドリング
  useKeyBindings<TaskListAction>(DEFAULT_TASK_LIST_BINDINGS, {
    customBindings: keyBindings,
    enabled: tasks.length > 0,
    onAction: (action) => {
      switch (action) {
        case 'moveUp': {
          const currentIndex = selectedTaskId
            ? tasks.findIndex(t => t.id === selectedTaskId)
            : 0;
          const prevIndex = Math.max(0, currentIndex - 1);
          if (prevIndex !== currentIndex) {
            onSelectTask(tasks[prevIndex].id);
          }
          break;
        }
        case 'moveDown': {
          const currentIndex = selectedTaskId
            ? tasks.findIndex(t => t.id === selectedTaskId)
            : 0;
          const nextIndex = Math.min(tasks.length - 1, currentIndex + 1);
          if (nextIndex !== currentIndex) {
            onSelectTask(tasks[nextIndex].id);
          }
          break;
        }
        case 'selectTask': {
          if (selectedTaskId) {
            onSelectTask(selectedTaskId);
          } else if (tasks.length > 0) {
            onSelectTask(tasks[0].id);
          }
          break;
        }
        // 将来的に追加する機能用のプレースホルダー
        case 'expandTask':
        case 'collapseTask':
        case 'togglePriority':
        case 'toggleStatus':
          break;
      }
    }
  });

  // タスク一覧表示
  return (
    <Box flexDirection="column">
      {tasks.map((task) => {
        const isSelected = selectedTaskId === task.id;
        const statusColor = STATUS_COLORS[task.status];
        const priorityStyle = PRIORITY_STYLES[task.priority];

        return (
          <Box
            key={task.id}
            paddingX={1}
            paddingY={0}
            borderStyle={isSelected ? 'single' : undefined}
            flexDirection="column"
          >
            <Box>
              <Text color={statusColor} bold>
                {priorityStyle.indicator} {task.name}
              </Text>

              <Text color="gray"> ({priorityStyle.label}優先度)</Text>

              <Text color={statusColor} dimColor>
                {' '}- {STATUS_LABELS[task.status]}
              </Text>
            </Box>

            {isSelected && (
              <Box paddingLeft={2} marginTop={1}>
                <Text dimColor>{task.description || '説明なし'}</Text>
              </Box>
            )}
          </Box>
        );
      })}
    </Box>
  );
};