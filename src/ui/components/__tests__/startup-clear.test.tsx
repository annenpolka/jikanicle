import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import React from "react";
import { render } from "ink-testing-library";
import type { TaskRepository } from "../../../repository/task-repository.js";
import { ok } from "neverthrow";

// Spy target declared at module scope so test can assert calls
const writeMock = vi.fn();

// Partially mock Ink to intercept useStdout/useStdin only
vi.mock("ink", async () => {
  const actual: any = await vi.importActual("ink");
  return {
    ...actual,
    useStdout: () => ({ stdout: { write: writeMock, isTTY: true } }),
    useStdin: () => ({ isRawModeSupported: false })
  };
});

// Import after mocks are in place
import { TaskManager } from "../task-manager.js";

describe("Startup Clear Screen", () => {
  let mockTaskRepository: TaskRepository;

  beforeEach(() => {
    vi.useFakeTimers();
    writeMock.mockReset();
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

  it("clears the screen once on initial render", async () => {
    render(<TaskManager taskRepository={mockTaskRepository} />);

    // Flush effects and async getAll()
    await vi.runAllTimersAsync();

    expect(writeMock).toHaveBeenCalled();
    const calls = writeMock.mock.calls.map(args => String(args[0]));
    // Should contain ANSI clear + cursor-home sequence
    expect(calls.some(s => /\x1b\[2J\x1b\[H/.test(s))).toBe(true);
  });
});

