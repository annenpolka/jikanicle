import React, { useState, useEffect } from "react";
import { Box, Text, useInput, useStdin, useStdout } from "ink";
import type { Task } from "../../domain/task.js";
import type { TaskRepository } from "../../repository/task-repository.js";
import { TaskList } from "./task-list.js";
import { TaskForm, type TaskFormData } from "./task-form.js";

interface TaskManagerProps {
  taskRepository: TaskRepository;
}

type ViewMode = "list" | "form";

export const TaskManager: React.FC<TaskManagerProps> = ({ taskRepository }) => {
  const { isRawModeSupported } = useStdin();
  const { stdout } = useStdout();
  const inputActive = isRawModeSupported || globalThis.process?.env?.NODE_ENV === "test";
  const [tasks, setTasks] = useState<Task[]>([]);
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [isCompact, setIsCompact] = useState<boolean>(true);
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
    // Clear screen once on startup to avoid any residual content
    // from previous commands in the terminal session.
    if (stdout?.isTTY) {
      stdout.write("\x1b[2J\x1b[H");
    }
    loadTasks();
  }, []);

  useInput((input, key) => {
    if (input === "n") {
      setViewMode("form");
    } else if (input === "c") {
      // Clear the screen before switching layouts to prevent residual artifacts
      // on terminals that don't fully clear shorter subsequent frames.
      if (stdout?.isTTY) {
        // Clear screen and move cursor to top-left.
        stdout.write("\x1b[2J\x1b[H");
      }
      setIsCompact(prev => !prev);
    } else if (input === "q") {
      globalThis.process?.exit(0);
    } else if (input === "s" && viewMode === "list") {
      // Start timing for selected task
      void handleStartTiming();
    } else if (input === "x" && viewMode === "list") {
      // Stop timing for selected task
      void handleStopTiming();
    } else if (key.escape) {
      setViewMode("list");
    } else if (viewMode === "list" && tasks.length > 0) {
      if (key.downArrow) {
        setSelectedIndex((idx) => Math.min(idx + 1, tasks.length - 1));
      } else if (key.upArrow) {
        setSelectedIndex((idx) => Math.max(idx - 1, 0));
      }
    }
  }, { isActive: inputActive });

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

  const handleStartTiming = async () => {
    if (tasks.length === 0) return;
    const current = tasks[selectedIndex];
    if (!current) return;
    setIsLoading(true);
    setError(null);
    const now = new Date();
    const result = await taskRepository.update({
      id: current.id,
      status: "in-progress",
      startedAt: now
    });
    if (result.isOk()) {
      await loadTasks();
    } else {
      setError(`Failed to start timing: ${result.error.message}`);
    }
    setIsLoading(false);
  };

  const handleStopTiming = async () => {
    if (tasks.length === 0) return;
    const current = tasks[selectedIndex];
    if (!current || !current.startedAt) return;
    setIsLoading(true);
    setError(null);
    const now = new Date();
    const diffMs = now.getTime() - current.startedAt.getTime();
    const minutes = Math.max(1, Math.round(diffMs / 60000));
    const result = await taskRepository.update({
      id: current.id,
      status: "completed",
      completedAt: now,
      actualDurationMinutes: minutes
    });
    if (result.isOk()) {
      await loadTasks();
    } else {
      setError(`Failed to stop timing: ${result.error.message}`);
    }
    setIsLoading(false);
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
        <Text dimColor>n: New task | c: Compact | s: Start | x: Stop | q: Quit</Text>
      </Box>
      {!inputActive && (
        <Box paddingX={1}>
          <Text dimColor>
            Keyboard input disabled (non-interactive stdin)
          </Text>
        </Box>
      )}
      
      {viewMode === "list" && (
        <TaskList 
          tasks={tasks} 
          selectedTaskId={tasks[selectedIndex]?.id}
          compact={isCompact}
        />
      )}
      {viewMode === "form" && (
        <TaskForm 
          onSubmit={handleTaskSubmit} 
          onCancel={handleFormCancel} 
        />
      )}

      {/* input handler is registered via useInput above */}
    </Box>
  );
};
