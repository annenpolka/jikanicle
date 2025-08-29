import React, { useState, useEffect } from "react";
import { Box, Text, useInput } from "ink";
import type { Task } from "../../domain/task.js";
import type { TaskRepository } from "../../repository/task-repository.js";
import { TaskList } from "./task-list.js";
import { TaskForm, type TaskFormData } from "./task-form.js";

interface TaskManagerProps {
  taskRepository: TaskRepository;
}

type ViewMode = "list" | "form";

export const TaskManager: React.FC<TaskManagerProps> = ({ taskRepository }) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedIndex, setSelectedIndex] = useState<number>(0);

  const loadTasks = async () => {
    setIsLoading(true);
    setError(null);
    
    const result = await taskRepository.getAll();
    if (result.isOk()) {
      setTasks(result.value);
      // Keep selection stable if possible, otherwise select first when list is non-empty
      if (result.value.length === 0) {
        setSelectedIndex(0);
      } else {
        setSelectedIndex((prev) => {
          // Clamp to valid range
          const clamped = Math.min(Math.max(prev, 0), result.value.length - 1);
          return clamped;
        });
      }
    } else {
      setError(`Failed to load tasks: ${result.error.message}`);
    }
    
    setIsLoading(false);
  };

  useEffect(() => {
    loadTasks();
  }, []);

  useInput((input, key) => {
    if (input === "n") {
      setViewMode("form");
    } else if (input === "q") {
      globalThis.process?.exit(0);
    } else if (key.escape) {
      setViewMode("list");
    } else if (viewMode === "list" && tasks.length > 0) {
      if (key.downArrow) {
        setSelectedIndex((idx) => Math.min(idx + 1, tasks.length - 1));
      } else if (key.upArrow) {
        setSelectedIndex((idx) => Math.max(idx - 1, 0));
      }
    }
  });

  const handleTaskSubmit = async (formData: TaskFormData) => {
    setIsLoading(true);
    setError(null);

    const result = await taskRepository.create(formData);
    if (result.isOk()) {
      await loadTasks();
      setViewMode("list");
    } else {
      setError(`Failed to create task: ${result.error.message}`);
    }
    
    setIsLoading(false);
  };

  const handleFormCancel = () => {
    setViewMode("list");
  };

  if (isLoading) {
    return (
      <Box padding={1}>
        <Text>Loading...</Text>
      </Box>
    );
  }

  if (error) {
    return (
      <Box padding={1}>
        <Text color="red">Error: {error}</Text>
        <Text dimColor>n: New task | q: Quit</Text>
      </Box>
    );
  }

  return (
    <Box flexDirection="column">
      <Box padding={1}>
        <Text dimColor>n: New task | q: Quit</Text>
      </Box>
      
      {viewMode === "list" && (
        <TaskList 
          tasks={tasks} 
          selectedTaskId={tasks[selectedIndex]?.id}
        />
      )}
      {viewMode === "form" && (
        <TaskForm 
          onSubmit={handleTaskSubmit} 
          onCancel={handleFormCancel} 
        />
      )}
    </Box>
  );
};
