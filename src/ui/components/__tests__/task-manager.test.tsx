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

  describe("初期表示", () => {
    it("初期表示時にタスク一覧が表示される", async () => {
      const { lastFrame } = render(<TaskManager taskRepository={mockTaskRepository} />);
      
      await vi.runAllTimersAsync();
      
      expect(lastFrame()).toContain("タスク一覧");
    });

    it("初期表示時にキーショートカットのヘルプが表示される", async () => {
      const { lastFrame } = render(<TaskManager taskRepository={mockTaskRepository} />);
      
      await vi.runAllTimersAsync();
      
      expect(lastFrame()).toContain("n: 新しいタスク");
      expect(lastFrame()).toContain("q: 終了");
    });

    it("空のタスクリストの場合、適切なメッセージが表示される", async () => {
      const { lastFrame } = render(<TaskManager taskRepository={mockTaskRepository} />);
      
      await vi.runAllTimersAsync();
      
      expect(lastFrame()).toContain("タスクがありません");
    });
  });

  describe("キーショートカット", () => {
    it("'n'キーでタスク作成フォームが表示される", async () => {
      const { lastFrame, stdin } = render(<TaskManager taskRepository={mockTaskRepository} />);
      
      await vi.runAllTimersAsync();
      
      stdin.write("n");
      
      await vi.runAllTimersAsync();
      
      expect(lastFrame()).toContain("新しいタスクの作成");
      expect(lastFrame()).toContain("タスク名を入力してください");
    });

    it("'q'キーでアプリケーションが終了される", async () => {
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

    it("ESCキーでフォームからタスク一覧に戻る", async () => {
      const { lastFrame, stdin } = render(<TaskManager taskRepository={mockTaskRepository} />);
      
      await vi.runAllTimersAsync();
      
      // フォームを開く
      stdin.write("n");
      await vi.runAllTimersAsync();
      expect(lastFrame()).toContain("新しいタスクの作成");
      
      // ESCで戻る
      stdin.write("\u001b"); // ESC key
      await vi.runAllTimersAsync();
      expect(lastFrame()).toContain("タスク一覧");
    });
  });

  describe("タスクがある場合", () => {
    beforeEach(() => {
      const mockTasks = [
        {
          id: "1",
          name: "テストタスク1",
          description: "テスト用のタスクです",
          status: "pending" as const,
          category: "work" as const,
          estimatedDurationMinutes: 30,
          createdAt: new Date("2023-01-01T10:00:00Z"),
          updatedAt: new Date("2023-01-01T10:00:00Z")
        }
      ];
      
      mockTaskRepository.getAll = vi.fn().mockResolvedValue(ok(mockTasks));
    });

    it("タスクリストにタスクが表示される", async () => {
      const { lastFrame } = render(<TaskManager taskRepository={mockTaskRepository} />);
      
      await vi.runAllTimersAsync();
      
      expect(lastFrame()).toContain("テストタスク1");
      expect(lastFrame()).toContain("テスト用のタスクです");
      expect(lastFrame()).toContain("待機中");
    });
  });
});