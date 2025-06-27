import React from "react";
import { Box, Text } from "ink";
import type { Task, TaskStatus } from "../../domain/task.js";

interface TaskListProps {
  tasks: Task[];
  selectedTaskId?: string;
}

const getStatusColor = (status: TaskStatus): string => {
  switch (status) {
    case "pending":
      return "yellow";
    case "in-progress":
      return "blue";
    case "completed":
      return "green";
    case "cancelled":
      return "red";
    default:
      return "white";
  }
};

const getStatusLabel = (status: TaskStatus): string => {
  switch (status) {
    case "pending":
      return "待機中";
    case "in-progress":
      return "実行中";
    case "completed":
      return "完了";
    case "cancelled":
      return "キャンセル";
    default:
      return status;
  }
};

const formatDuration = (minutes?: number): string => {
  if (!minutes) return "-";
  if (minutes < 60) return `${minutes}分`;
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return remainingMinutes > 0 ? `${hours}時間${remainingMinutes}分` : `${hours}時間`;
};

export const TaskList: React.FC<TaskListProps> = ({ tasks, selectedTaskId }) => {
  return (
    <Box flexDirection="column" padding={1}>
      <Box marginBottom={1}>
        <Text bold underline>タスク一覧</Text>
      </Box>
      
      {tasks.length === 0 ? (
        <Box padding={1}>
          <Text dimColor>タスクがありません</Text>
        </Box>
      ) : (
        tasks.map((task) => (
          <Box key={task.id} marginBottom={1}>
            <Box 
              borderStyle="single" 
              borderColor={selectedTaskId === task.id ? "blue" : "gray"}
              padding={1}
              width="100%"
            >
              <Box flexDirection="column">
                <Box justifyContent="space-between">
                  <Text bold>{task.name}</Text>
                  <Text color={getStatusColor(task.status)}>
                    {getStatusLabel(task.status)}
                  </Text>
                </Box>
                
                {task.description && (
                  <Box marginTop={1}>
                    <Text dimColor>{task.description}</Text>
                  </Box>
                )}
                
                <Box marginTop={1} justifyContent="space-between">
                  <Box>
                    {task.category && (
                      <Text color="cyan">カテゴリ: {task.category}</Text>
                    )}
                  </Box>
                  <Box>
                    <Text dimColor>
                      予想: {formatDuration(task.estimatedDurationMinutes)}
                      {task.actualDurationMinutes && 
                        ` | 実績: ${formatDuration(task.actualDurationMinutes)}`
                      }
                    </Text>
                  </Box>
                </Box>
                
                <Box marginTop={1}>
                  <Text dimColor>
                    作成: {task.createdAt.toLocaleString("ja-JP")}
                    {task.startedAt && 
                      ` | 開始: ${task.startedAt.toLocaleString("ja-JP")}`
                    }
                    {task.completedAt && 
                      ` | 完了: ${task.completedAt.toLocaleString("ja-JP")}`
                    }
                  </Text>
                </Box>
              </Box>
            </Box>
          </Box>
        ))
      )}
    </Box>
  );
};