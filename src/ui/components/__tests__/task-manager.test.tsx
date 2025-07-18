import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import React from "react";
import { render } from "ink-testing-library";
import { TaskManager } from "../task-manager.js";
import type { TaskRepository } from "../../../repository/task-repository.js";
import { ok } from "neverthrow";

describe("TaskManager", () => {
  let mockTaskRepository: TaskRepository;

  beforeEach(() => {
    vi.useFakeTimers();
    mockTaskRepository = {
      getAll: vi.fn().mockResolvedValue(ok([])),
      getById: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn()
    };
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe("Initial Display", () => {
    it("displays task list on initial render", async () => {
      const { lastFrame } = render(<TaskManager taskRepository={mockTaskRepository} />);
      
      await vi.runAllTimersAsync();
      
      expect(lastFrame()).toContain("Task List");
    });

    it("displays keyboard shortcut help on initial render", async () => {
      const { lastFrame } = render(<TaskManager taskRepository={mockTaskRepository} />);
      
      await vi.runAllTimersAsync();
      
      expect(lastFrame()).toContain("n: New task");
      expect(lastFrame()).toContain("q: Quit");
    });

    it("displays appropriate message when task list is empty", async () => {
      const { lastFrame } = render(<TaskManager taskRepository={mockTaskRepository} />);
      
      await vi.runAllTimersAsync();
      
      expect(lastFrame()).toContain("No tasks available");
    });
  });

  describe("Keyboard Shortcuts", () => {
    it("displays task creation form when 'n' key is pressed", async () => {
      const { lastFrame, stdin } = render(<TaskManager taskRepository={mockTaskRepository} />);
      
      await vi.runAllTimersAsync();
      
      stdin.write("n");
      
      await vi.runAllTimersAsync();
      
      expect(lastFrame()).toContain("Create New Task");
      expect(lastFrame()).toContain("Enter task name");
    });

    it("exits application when 'q' key is pressed", async () => {
      const mockExit = vi.spyOn(globalThis.process!, "exit").mockImplementation(() => {
        throw new Error("process.exit called");
      });

      const { stdin } = render(<TaskManager taskRepository={mockTaskRepository} />);
      
      await vi.runAllTimersAsync();
      
      expect(() => {
        stdin.write("q");
      }).toThrow("process.exit called");
      
      expect(mockExit).toHaveBeenCalledWith(0);
      
      mockExit.mockRestore();
    });

    it("returns to task list from form when ESC key is pressed", async () => {
      const { lastFrame, stdin } = render(<TaskManager taskRepository={mockTaskRepository} />);
      
      await vi.runAllTimersAsync();
      
      // Open form
      stdin.write("n");
      await vi.runAllTimersAsync();
      expect(lastFrame()).toContain("Create New Task");
      
      // Return with ESC
      stdin.write("\u001b"); // ESC key
      await vi.runAllTimersAsync();
      expect(lastFrame()).toContain("Task List");
    });
  });

  describe("When tasks exist", () => {
    beforeEach(() => {
      const mockTasks = [
        {
          id: "1",
          name: "Test Task 1",
          description: "This is a test task",
          status: "pending" as const,
          category: "work" as const,
          estimatedDurationMinutes: 30,
          createdAt: new Date("2023-01-01T10:00:00Z"),
          updatedAt: new Date("2023-01-01T10:00:00Z")
        }
      ];
      
      mockTaskRepository.getAll = vi.fn().mockResolvedValue(ok(mockTasks));
    });

    it("displays tasks in the task list", async () => {
      const { lastFrame } = render(<TaskManager taskRepository={mockTaskRepository} />);
      
      await vi.runAllTimersAsync();
      
      expect(lastFrame()).toContain("Test Task 1");
      expect(lastFrame()).toContain("This is a test task");
      expect(lastFrame()).toContain("Pending");
    });
  });
});