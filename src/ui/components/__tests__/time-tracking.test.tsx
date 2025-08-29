import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import React from "react";
import { render } from "ink-testing-library";
import { ok } from "neverthrow";
import type { TaskRepository } from "../../../repository/task-repository.js";
import { TaskManager } from "../task-manager.js";

describe("Time Tracking Commands", () => {
  let mockTaskRepository: TaskRepository;

  beforeEach(() => {
    vi.useFakeTimers();
    mockTaskRepository = {
      getAll: vi.fn(),
      getById: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn()
    };
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("shows start/stop shortcut hints in help", async () => {
    mockTaskRepository.getAll = vi.fn().mockResolvedValue(ok([]));
    const { lastFrame } = render(<TaskManager taskRepository={mockTaskRepository} />);

    await vi.runAllTimersAsync();

    expect(lastFrame()).toContain("s: Start");
    expect(lastFrame()).toContain("x: Stop");
  });

  it("starts timing on selected task when 's' is pressed", async () => {
    const baseTime = new Date("2023-01-01T10:00:00Z");
    vi.setSystemTime(baseTime);

    const tasks = [
      {
        id: "t1",
        name: "Write docs",
        description: "",
        status: "pending" as const,
        createdAt: new Date("2023-01-01T09:00:00Z"),
        updatedAt: new Date("2023-01-01T09:00:00Z")
      }
    ];

    mockTaskRepository.getAll = vi.fn().mockResolvedValueOnce(ok(tasks))
      // After update, reload returns updated task
      .mockResolvedValueOnce(ok([
        { ...tasks[0], status: "in-progress" as const, startedAt: baseTime, updatedAt: baseTime }
      ]));

    const updateMock = vi.fn().mockResolvedValue(ok({ ...tasks[0], status: "in-progress" as const, startedAt: baseTime, updatedAt: baseTime }));
    mockTaskRepository.update = updateMock as any;

    const { stdin } = render(<TaskManager taskRepository={mockTaskRepository} />);
    await vi.runAllTimersAsync();

    stdin.write("s");
    await vi.runAllTimersAsync();

    expect(updateMock).toHaveBeenCalledTimes(1);
    expect(updateMock).toHaveBeenCalledWith(expect.objectContaining({
      id: "t1",
      status: "in-progress",
      startedAt: expect.any(Date)
    }));
  });

  it("stops timing and completes task with duration when 'x' is pressed", async () => {
    const started = new Date("2023-01-01T10:00:00Z");
    const now = new Date("2023-01-01T10:05:00Z");
    vi.setSystemTime(now);

    const tasks = [
      {
        id: "t2",
        name: "Implement feature",
        description: "",
        status: "in-progress" as const,
        startedAt: started,
        createdAt: new Date("2023-01-01T09:00:00Z"),
        updatedAt: new Date("2023-01-01T10:00:00Z")
      }
    ];

    mockTaskRepository.getAll = vi.fn().mockResolvedValueOnce(ok(tasks))
      // After stop, list returns completed task
      .mockResolvedValueOnce(ok([
        { ...tasks[0], status: "completed" as const, completedAt: now, actualDurationMinutes: 5, updatedAt: now }
      ]));

    const updateMock = vi.fn().mockResolvedValue(ok({ ...tasks[0], status: "completed" as const, completedAt: now, actualDurationMinutes: 5, updatedAt: now }));
    mockTaskRepository.update = updateMock as any;

    const { stdin } = render(<TaskManager taskRepository={mockTaskRepository} />);
    await vi.runAllTimersAsync();

    stdin.write("x");
    await vi.runAllTimersAsync();

    expect(updateMock).toHaveBeenCalledTimes(1);
    expect(updateMock).toHaveBeenCalledWith(expect.objectContaining({
      id: "t2",
      status: "completed",
      completedAt: expect.any(Date),
      actualDurationMinutes: 5
    }));
  });
});

