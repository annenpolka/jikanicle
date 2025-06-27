import { promises as fs } from "fs";
import path from "path";
import { v4 as uuidv4 } from "uuid";
import type { Result } from "neverthrow";
import { ok, err } from "neverthrow";
import type { Task, CreateTaskParams, UpdateTaskParams } from "../domain/task.js";
import { TaskSchema } from "../domain/task.js";
import type { TaskRepository } from "./task-repository.js";

export class JsonTaskRepository implements TaskRepository {
  private readonly filePath: string;

  constructor(dataDir: string = "data") {
    this.filePath = path.join(dataDir, "tasks.json");
  }

  async getAll(): Promise<Result<Task[], Error>> {
    try {
      const data = await this.loadTasks();
      return ok(data);
    } catch (error) {
      return err(error as Error);
    }
  }

  async getById(id: string): Promise<Result<Task | null, Error>> {
    try {
      const tasks = await this.loadTasks();
      const task = tasks.find(t => t.id === id) || null;
      return ok(task);
    } catch (error) {
      return err(error as Error);
    }
  }

  async create(params: CreateTaskParams): Promise<Result<Task, Error>> {
    try {
      const now = new Date();
      const newTask: Task = {
        id: uuidv4(),
        name: params.name,
        description: params.description,
        estimatedDurationMinutes: params.estimatedDurationMinutes,
        category: params.category,
        status: "pending",
        createdAt: now,
        updatedAt: now
      };

      const validationResult = TaskSchema.safeParse(newTask);
      if (!validationResult.success) {
        return err(new Error(`バリデーションエラー: ${validationResult.error.message}`));
      }

      const tasks = await this.loadTasks();
      tasks.push(newTask);
      await this.saveTasks(tasks);

      return ok(newTask);
    } catch (error) {
      return err(error as Error);
    }
  }

  async update(params: UpdateTaskParams): Promise<Result<Task, Error>> {
    try {
      const tasks = await this.loadTasks();
      const taskIndex = tasks.findIndex(t => t.id === params.id);
      
      if (taskIndex === -1) {
        return err(new Error(`タスクが見つかりません: ${params.id}`));
      }

      const existingTask = tasks[taskIndex];
      const updatedTask: Task = {
        ...existingTask,
        ...params,
        updatedAt: new Date()
      };

      const validationResult = TaskSchema.safeParse(updatedTask);
      if (!validationResult.success) {
        return err(new Error(`バリデーションエラー: ${validationResult.error.message}`));
      }

      tasks[taskIndex] = updatedTask;
      await this.saveTasks(tasks);

      return ok(updatedTask);
    } catch (error) {
      return err(error as Error);
    }
  }

  async delete(id: string): Promise<Result<void, Error>> {
    try {
      const tasks = await this.loadTasks();
      const filteredTasks = tasks.filter(t => t.id !== id);
      
      if (tasks.length === filteredTasks.length) {
        return err(new Error(`タスクが見つかりません: ${id}`));
      }

      await this.saveTasks(filteredTasks);
      return ok(undefined);
    } catch (error) {
      return err(error as Error);
    }
  }

  private async loadTasks(): Promise<Task[]> {
    try {
      await fs.mkdir(path.dirname(this.filePath), { recursive: true });
      const data = await fs.readFile(this.filePath, "utf-8");
      const parsed = JSON.parse(data);
      
      if (!Array.isArray(parsed)) {
        throw new Error("タスクデータが配列ではありません");
      }

      return parsed.map(item => ({
        ...item,
        createdAt: new Date(item.createdAt),
        updatedAt: new Date(item.updatedAt),
        startedAt: item.startedAt ? new Date(item.startedAt) : undefined,
        completedAt: item.completedAt ? new Date(item.completedAt) : undefined
      }));
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === "ENOENT") {
        return [];
      }
      throw error;
    }
  }

  private async saveTasks(tasks: Task[]): Promise<void> {
    await fs.mkdir(path.dirname(this.filePath), { recursive: true });
    await fs.writeFile(this.filePath, JSON.stringify(tasks, null, 2), "utf-8");
  }
}