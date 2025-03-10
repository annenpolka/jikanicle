/**
 * ファイルベースのタスクリポジトリ実装
 *
 * このモジュールはファイルシステムを使用してタスクを永続化するリポジトリを提供します。
 * 各タスクは個別のJSONファイルとして保存され、ファイルシステムアダプタを介して
 * 読み書きされます。
 *
 * 主な機能:
 * - タスクの取得、保存、削除といった基本CRUD操作
 * - ファイルシステムアダプタによる外部依存の抽象化
 * - シリアライズユーティリティによるデータ変換
 * - Result型によるエラーハンドリング
 */

import path from 'path';
import { err, ok, type Result } from 'neverthrow';
import type { Task, TaskId } from '../../domain/types/Task.js';

import type {
  TaskRepository,
  TaskRepositoryError,
  TaskFilter
} from '../../application/repositories/task-repository.js';
import type {
  FileSystemAdapter,
  FileSystemError
} from '../adapters/file-system-adapter.js';
import {
  deserializeTask,
  serializeTask,
  type DeserializationError,
  type SerializationError
} from '../utils/task-serialization.js';

/**
 * ファイルベースのリポジトリ設定オプション
 */
export type FileBasedTaskRepositoryOptions = {
  /**
   * タスクデータを保存するディレクトリのパス（JSONファイル用）
   */
  readonly dataDir: string;
  /**
   * インデックスファイルの名前
   * すべてのタスクIDとメタデータを保持するJSONファイル
   */
  readonly indexFileName?: string;
};

/**
 * ファイルシステムエラーをリポジトリエラーに変換する関数
 *
 * @param error ファイルシステムエラー
 * @returns 変換されたリポジトリエラー
 */
function mapFileSystemError(error: FileSystemError): TaskRepositoryError {
  switch (error.type) {
    case 'NOT_FOUND':
      return {
        type: 'NOT_FOUND',
        message: `タスクが見つかりません: ${error.path}`
      };
    case 'ALREADY_EXISTS':
      return {
        type: 'ALREADY_EXISTS',
        message: `既に存在するタスクです: ${error.path}`
      };
    case 'PERMISSION_DENIED':
    case 'IO_ERROR':
    case 'LOCK_ERROR':
    case 'INVALID_PATH':
    case 'ATOMIC_OPERATION_FAILED':
    default:
      return {
        type: 'STORAGE_ERROR',
        message: `ストレージ操作エラー: ${error.message}`,
        cause: error
      };
  }
}

/**
 * シリアライズエラーをリポジトリエラーに変換する関数
 *
 * @param error シリアライズエラー
 * @returns 変換されたリポジトリエラー
 */
function mapSerializationError(error: SerializationError): TaskRepositoryError {
  return {
    type: 'STORAGE_ERROR',
    message: `タスクのシリアライズに失敗しました: ${error.message}`,
    cause: error.originalError
  };
}

/**
 * デシリアライズエラーをリポジトリエラーに変換する関数
 *
 * @param error デシリアライズエラー
 * @returns 変換されたリポジトリエラー
 */
function mapDeserializationError(error: DeserializationError): TaskRepositoryError {
  return {
    type: 'STORAGE_ERROR',
    message: `タスクのデシリアライズに失敗しました: ${error.message}`,
    cause: error.originalError
  };
}

/**
 * タスクIDからファイルパスを生成する関数
 *
 * @param dataDir データディレクトリ
 * @param taskId タスクID
 * @returns タスクファイルパスを含むResult、不正なIDの場合はエラー
 */
function getTaskFilePath(dataDir: string, taskId: TaskId): Result<string, FileSystemError> {
  // 空文字列や無効なIDをチェック
  if (typeof taskId !== 'string' || taskId.length === 0) {
    return err({
      type: 'INVALID_PATH',
      message: `無効なタスクID: [${taskId}]`,
      path: `${dataDir}/${taskId}.json`
    });
  }
  return ok(path.join(dataDir, `${taskId}.json`));
}

/**
 * フィルタ条件にタスクが一致するか判定する関数
 *
 * @param task 判定対象のタスク
 * @param filter フィルタ条件
 * @returns 一致する場合はtrue
 */
function matchesFilter(task: Task, filter?: TaskFilter): boolean {
  if (!filter) {
    return true;
  }

  // statusフィルタの適用
  if (filter.status && !filter.status.includes(task.status)) {
    return false;
  }

  // categoryフィルタの適用
  if (filter.category && task.category !== filter.category) {
    return false;
  }

  // tagsフィルタの適用
  if (filter.tags && filter.tags.length > 0) {
    // タスクがフィルタのタグを少なくとも1つ含むか確認
    const hasMatchingTag = filter.tags.some(tag => task.tags.includes(tag));
    if (!hasMatchingTag) {
      return false;
    }
  }

  // 日付範囲フィルタの適用
  if (filter.createdAfter && task.createdAt < filter.createdAfter) {
    return false;
  }
  if (filter.createdBefore && task.createdAt > filter.createdBefore) {
    return false;
  }

  // テキスト検索フィルタの適用
  const searchText = filter.textSearch;
  if (typeof searchText === 'string' && searchText !== '') {
    const lowerSearchText = searchText.toLowerCase();
    const matchesName = task.name.toLowerCase().includes(lowerSearchText);
    const matchesDescription = task.description.toLowerCase().includes(lowerSearchText);
    const matchesTags = task.tags.some(tag => tag.toLowerCase().includes(lowerSearchText));
    if (!(matchesName || matchesDescription || matchesTags)) {
      return false;
    }
  }

  return true;
}

/**
 * ファイルベースのタスクリポジトリファクトリ関数
 *
 * @param fs ファイルシステムアダプタ
 * @param options リポジトリオプション
 * @returns タスクリポジトリ実装
 */
export function createFileBasedTaskRepository(
  fs: FileSystemAdapter,
  options: FileBasedTaskRepositoryOptions
): TaskRepository {
  const { dataDir, indexFileName = 'index.json' } = options;
  // 将来的にインデックス機能を実装する際に使用
  // const indexPath = path.join(dataDir, indexFileName);

  /**
   * 初期化処理: データディレクトリの存在確認・作成
   * @returns 成功時: undefined、失敗時: エラーオブジェクト
   * @param _ 未使用パラメータ（ESLint対応）
   */
  async function initialize(_?: void): Promise<Result<void, TaskRepositoryError>> {
    const result = await fs.ensureDirectory(dataDir);
    if (result.isErr()) {
      return err(mapFileSystemError(result.error));
    }
    return ok(undefined);
  }

  // 初期化処理を実行（非同期だが、呼び出し側は待機しなくてもよい）
  void initialize();

  return {
    /**
     * IDによるタスク取得
     * @param id 取得するタスクのID
     * @returns 成功時: タスクオブジェクト、失敗時: エラーオブジェクト
     */
    async findById(id: TaskId): Promise<Result<Task, TaskRepositoryError>> {
      // ファイルパスの生成
      const filePathResult = getTaskFilePath(dataDir, id);
      if (filePathResult.isErr()) {
        return err(mapFileSystemError(filePathResult.error));
      }
      const filePath = filePathResult.value;

      // ファイルの読み込み
      const fileResult = await fs.readFile(filePath);
      if (fileResult.isErr()) {
        return err(mapFileSystemError(fileResult.error));
      }

      // JSONデータのデシリアライズ
      const deserializeResult = deserializeTask(fileResult.value);
      if (deserializeResult.isErr()) {
        return err(mapDeserializationError(deserializeResult.error));
      }

      return ok(deserializeResult.value);
    },

    /**
     * すべてのタスク、または条件に一致するタスクの取得
     * @param filter オプションのフィルタ条件
     * @returns 成功時: タスクの配列、失敗時: エラーオブジェクト
     */
    async findAll(filter?: TaskFilter): Promise<Result<readonly Task[], TaskRepositoryError>> {
      // データディレクトリからすべてのJSONファイルを取得
      const filesResult = await fs.listFiles(dataDir, '*.json');
      if (filesResult.isErr()) {
        return err(mapFileSystemError(filesResult.error));
      }

      // インデックスファイルを除外
      const taskFiles = filesResult.value.filter(file => !file.endsWith(indexFileName));

      // 空の場合は空配列を返す
      if (taskFiles.length === 0) {
        return ok([]);
      }

      // 各ファイルからタスクを読み込み
      const taskPromises = taskFiles.map(async (filePath): Promise<Result<Task | null, TaskRepositoryError>> => {
        const fullPath = path.join(dataDir, filePath);
        const fileResult = await fs.readFile(fullPath);
        if (fileResult.isErr() === true) {
          return err(mapFileSystemError(fileResult.error));
        }

        const deserializeResult = deserializeTask(fileResult.value);
        if (deserializeResult.isErr()) {
          return err(mapDeserializationError(deserializeResult.error));
        }

        const task = deserializeResult.value;

        // フィルタ条件に一致するか確認
        if (matchesFilter(task, filter)) {
          return ok(task);
        }

        // フィルタに一致しない場合はnullを返す
        return ok(null);
      });

      // すべてのタスク取得処理を並列実行
      const results = await Promise.all(taskPromises);

      // エラーがあれば最初のエラーを返す
      for (const result of results) {
        if (result.isErr() === true) {
          return err(result.error);
        }
      }

      // nullでないタスクのみをフィルタリング
      const tasks: readonly Task[] = results.reduce<readonly Task[]>((acc, result) => {
        if (result.isOk() === true && result.value !== null) {
          return [...acc, result.value];
        }
        return acc;
      }, []);

      return ok(tasks);
    },

    /**
     * タスクの保存（新規作成または更新）
     * @param task 保存するタスクオブジェクト
     * @returns 成功時: 保存されたタスク、失敗時: エラーオブジェクト
     */
    async save(task: Task): Promise<Result<Task, TaskRepositoryError>> {
      // データディレクトリの確認・作成
      const initResult = await initialize(undefined);
      if (initResult.isErr() === true) {
        // 型安全な方法でエラーを転送
        return err({
          ...initResult.error,
          message: `データディレクトリの作成に失敗しました: ${initResult.error.message}`
        });
      }

      // タスクをJSONにシリアライズ
      const serializeResult = serializeTask(task);
      if (serializeResult.isErr()) {
        return err(mapSerializationError(serializeResult.error));
      }

      // タスクIDの検証とファイルパスの生成
      const filePathResult = getTaskFilePath(dataDir, task.id);
      if (filePathResult.isErr()) {
        return err(mapFileSystemError(filePathResult.error));
      }
      const filePath = filePathResult.value;

      // タスクをファイルに書き込み（アトミック操作を使用）
      const writeResult = await fs.writeFile(filePath, serializeResult.value);
      if (writeResult.isErr()) {
        return err(mapFileSystemError(writeResult.error));
      }

      return ok(task);
    },

    /**
     * タスクの削除
     * @param id 削除するタスクのID
     * @returns 成功時: void、失敗時: エラーオブジェクト
     */
    async delete(id: TaskId): Promise<Result<void, TaskRepositoryError>> {
      // ファイルパスの生成
      const filePathResult = getTaskFilePath(dataDir, id);
      if (filePathResult.isErr()) {
        return err(mapFileSystemError(filePathResult.error));
      }
      const filePath = filePathResult.value;

      // ファイルの存在確認
      const existsResult = await fs.fileExists(filePath);
      if (existsResult.isErr() === true) {
        return err(mapFileSystemError(existsResult.error));
      }

      // ファイルが存在しない場合はNOT_FOUNDエラー
      if (!existsResult.value) {
        return err({
          type: 'NOT_FOUND',
          message: `タスクが見つかりません: ${id}`
        });
      }

      // ファイルの削除
      const deleteResult = await fs.deleteFile(filePath);
      if (deleteResult.isErr()) {
        return err(mapFileSystemError(deleteResult.error));
      }

      return ok(undefined);
    },

    /**
     * リポジトリ内のタスク数を取得
     * @param filter オプションのフィルタ条件
     * @returns 成功時: タスク数、失敗時: エラーオブジェクト
     */
    async count(filter?: TaskFilter): Promise<Result<number, TaskRepositoryError>> {
      // フィルタがある場合は、findAllで取得してからカウント
      if (filter) {
        const tasksResult = await this.findAll(filter as TaskFilter);
        if (tasksResult.isErr()) {
          return err(tasksResult.error);
        }
        return ok(tasksResult.value.length);
      }

      // フィルタがない場合は、直接ファイル数をカウント
      const filesResult = await fs.listFiles(dataDir, '*.json');
      if (filesResult.isErr()) {
        return err(mapFileSystemError(filesResult.error));
      }

      // インデックスファイルを除外
      const taskFileCount = filesResult.value.filter(file => !file.endsWith(indexFileName)).length;
      return ok(taskFileCount);
    }
  };
}