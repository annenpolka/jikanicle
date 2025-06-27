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

  const loadTasks = async () => {
    setIsLoading(true);
    setError(null);
    
    const result = await taskRepository.getAll();
    if (result.isOk()) {
      setTasks(result.value);
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
      
      {viewMode === "list" && <TaskList tasks={tasks} />}
      {viewMode === "form" && (
        <TaskForm 
          onSubmit={handleTaskSubmit} 
          onCancel={handleFormCancel} 
        />
      )}
    </Box>
  );
};