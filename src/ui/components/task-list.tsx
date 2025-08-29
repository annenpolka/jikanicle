import React from "react";
import { Box, Text } from "ink";
import type { Task, TaskStatus } from "../../domain/task.js";

interface TaskListProps {
  tasks: Task[];
  selectedTaskId?: string;
  compact?: boolean;
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
      return "Pending";
    case "in-progress":
      return "In Progress";
    case "completed":
      return "Completed";
    case "cancelled":
      return "Cancelled";
    default:
      return status;
  }
};

const formatDuration = (minutes?: number): string => {
  if (!minutes) return "-";
  if (minutes < 60) return `${minutes}min`;
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}min` : `${hours}h`;
};

export const TaskList: React.FC<TaskListProps> = ({ tasks, selectedTaskId, compact = false }) => {
  return (
    <Box flexDirection="column" padding={1}>
      <Box marginBottom={1}>
        <Text bold underline>
          Task List{compact ? " (compact)" : ""}
        </Text>
      </Box>
      
      {tasks.length === 0 ? (
        <Box padding={1}>
          <Text dimColor>No tasks available</Text>
        </Box>
      ) : (
        tasks.map((task) => (
          <Box key={task.id} marginBottom={1}>
            {compact ? (
              <Box width="100%">
                <Text>
                  {selectedTaskId === task.id ? "> " : "  "}
                  {task.name} 
                  [
                  <Text color={getStatusColor(task.status)}>
                    {getStatusLabel(task.status)}
                  </Text>
                  ]
                </Text>
              </Box>
            ) : (
              <Box 
                borderStyle="single" 
                borderColor={selectedTaskId === task.id ? "blue" : "gray"}
                padding={1}
                width="100%"
              >
                <Box flexDirection="column">
                  <Box justifyContent="space-between">
                    <Text bold>
                      {selectedTaskId === task.id ? "> " : "  "}
                      {task.name}
                    </Text>
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
                        <Text color="cyan">Category: {task.category}</Text>
                      )}
                    </Box>
                    <Box>
                      <Text dimColor>
                        Estimated: {formatDuration(task.estimatedDurationMinutes)}
                        {task.actualDurationMinutes && 
                          ` | Actual: ${formatDuration(task.actualDurationMinutes)}`
                        }
                      </Text>
                    </Box>
                  </Box>
                  
                  <Box marginTop={1}>
                    <Text dimColor>
                      Created: {task.createdAt.toLocaleString("en-US")}
                      {task.startedAt && 
                        ` | Started: ${task.startedAt.toLocaleString("en-US")}`
                      }
                      {task.completedAt && 
                        ` | Completed: ${task.completedAt.toLocaleString("en-US")}`
                      }
                    </Text>
                  </Box>
                </Box>
              </Box>
            )}
          </Box>
        ))
      )}
    </Box>
  );
};
