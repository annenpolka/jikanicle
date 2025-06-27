import type { Result } from "neverthrow";
import type { Task, CreateTaskParams, UpdateTaskParams } from "../domain/task.js";

export interface TaskRepository {
  getAll(): Promise<Result<Task[], Error>>;
  getById(id: string): Promise<Result<Task | null, Error>>;
  create(params: CreateTaskParams): Promise<Result<Task, Error>>;
  update(params: UpdateTaskParams): Promise<Result<Task, Error>>;
  delete(id: string): Promise<Result<void, Error>>;
}