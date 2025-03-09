/**
 * インメモリタスクリポジトリの実装
 *
 * このファイルはTaskRepositoryインターフェースに基づいたインメモリ実装を提供します。
 * 主にテスト環境、開発初期段階、一時的なタスク管理に使用されます。
 * 関数スタイルの実装で、内部状態を管理するための不変なデータ構造を使用します。
 */

import { err, ok } from 'neverthrow';
import type { Result } from 'neverthrow';
import type { Task, TaskId } from '../../domain/types/Task.js';
import type { TaskFilter, TaskRepository, TaskRepositoryError } from '../../application/repositories/task-repository.js';

/**
 * インメモリタスクリポジトリを作成する関数
 *
 * @param initialTasks 初期タスクデータ（オプション）
 * @returns TaskRepositoryインターフェースを実装したオブジェクト
 */
export function createInMemoryTaskRepository(initialTasks: readonly Task[] = []): TaskRepository {
  // 実際のデータを保持する変数（クロージャー内で保持）
  const createInitialMap = (tasks: readonly Task[]): ReadonlyMap<string, Task> => {
    if (tasks.length === 0) {
      return new Map<string, Task>();
    }
    // 不変な方法で初期データを作成
    return new Map<string, Task>(
      tasks.map(task => [task.id, { ...task }] as readonly [string, Task])
    );
  };

  // 内部状態を保持するためのMap
  // リファレンスセルパターンを使用して不変性を保ちながら状態を管理
  // Ref型のオブジェクトを作成し、値へのアクセスと更新を制御する
  // 関数型プログラミングの観点から、複数の関数がクロージャーを通じて共有する不変な状態を定義
  type TasksState = {
    readonly tasksMap: ReadonlyMap<string, Task>;
  };

  // 初期状態を作成
  const initialState: TasksState = {
    tasksMap: createInitialMap(initialTasks)
  };

  // 内部状態を保持する変数（ただしこの変数自体への参照は変更しない）
  // 完全に関数型のアプローチでは通常、全ての状態は関数呼び出しのパラメータとして渡されるが、
  // リポジトリパターンの実装のため、ここで必要最小限の状態保持を許容する
  // eslint-disable-next-line functional/no-let
  let state = initialState;

  // 状態を更新する純粋関数 - 現在の状態を入力として取り、新しい状態を出力
  const updateState = (currentState: TasksState, newTasksMap: ReadonlyMap<string, Task>): TasksState => {
    return {
      ...currentState,
      tasksMap: newTasksMap
    };
  };

  // 状態の取得 - 読み取り専用アクセスを提供
  const getTasksMap = (_: void): ReadonlyMap<string, Task> => state.tasksMap;

  // 状態の更新 - 新しい状態を生成し、状態変数を更新
  // （注：この関数は純粋関数ではなく、状態変数を変更する副作用を持つ）
  const setTasksMap = (newMap: ReadonlyMap<string, Task>): void => {
    // 新しい状態オブジェクトを生成
    const newState = updateState(state, newMap);
    // 状態変数を更新（これは副作用だが、リポジトリの実装に必要）
    state = newState;
  };


  /**
   * タスクを識別子で検索する
   * @param id 検索するタスクのID
   * @returns 成功時: タスクオブジェクト、失敗時: エラーオブジェクト
   */
  const findById = async (id: TaskId): Promise<Result<Task, TaskRepositoryError>> => {
    const task = getTasksMap(undefined).get(id);
    if (task === undefined) {
      return err({
        type: 'NOT_FOUND',
        message: `タスクID: ${id} は見つかりませんでした`
      });
    }
    return ok(task);
  };

  /**
   * フィルタ条件に一致するタスクをMapから抽出するヘルパー関数
   * @param filter フィルタ条件
   * @returns フィルタ条件に一致するタスクの配列
   */
  const filterTasks = (filter: TaskFilter | undefined): readonly Task[] => {
    // フィルタがない場合はすべてのタスクを返す
    if (filter === undefined) {
      return Array.from(getTasksMap(undefined).values());
    }

    return Array.from(getTasksMap(undefined).values()).filter(task => {
      // statusフィルタ
      if (filter.status !== undefined) {
        // 明示的に型安全な方法でステータスチェック
        // status配列のどの要素にも一致しない場合は除外
        const statusArray = filter.status;
        if (!statusArray.some(status => status === task.status)) {
          return false;
        }
      }

      // categoryフィルタ
      if (filter.category !== undefined && task.category !== filter.category) {
        return false;
      }

      // tagsフィルタ（指定されたすべてのタグを含むかどうか）
      if (filter.tags !== undefined && filter.tags.length > 0) {
        const hasTags = filter.tags.every(tag => task.tags.includes(tag));
        if (!hasTags) {
          return false;
        }
      }

      // 作成日の範囲フィルタ
      if (filter.createdAfter !== undefined && task.createdAt < filter.createdAfter) {
        return false;
      }
      if (filter.createdBefore !== undefined && task.createdAt > filter.createdBefore) {
        return false;
      }

      // テキスト検索（nameとdescriptionで検索）
      if (filter.textSearch !== undefined) {
        const searchText = filter.textSearch.toLowerCase();
        // 型安全な検索チェック
        const nameMatch = typeof task.name === 'string' && task.name.toLowerCase().includes(searchText);
        const descMatch = typeof task.description === 'string' && task.description.toLowerCase().includes(searchText);
        if (!nameMatch && !descMatch) {
          return false;
        }
      }

      return true;
    });
  };

  /**
   * フィルタ条件に一致するすべてのタスクを検索する
   * @param filter 検索条件
   * @returns 成功時: タスクの配列、失敗時: エラーオブジェクト
   */
  const findAll = async (filter: TaskFilter | undefined): Promise<Result<readonly Task[], TaskRepositoryError>> => {
    try {
      const filteredTasks = filterTasks(filter);
      return ok(filteredTasks);
    } catch (error) {
      return err({
        type: 'STORAGE_ERROR',
        message: 'タスクの検索中にエラーが発生しました',
        cause: error
      });
    }
  };

  /**
   * タスクを保存する（新規作成または更新）
   * @param task 保存するタスクオブジェクト
   * @returns 成功時: 保存されたタスク、失敗時: エラーオブジェクト
   */
  const save = async (task: Task): Promise<Result<Task, TaskRepositoryError>> => {
    // 不変性を維持するためにディープコピーを作成
    const taskToSave: Task = { ...task };

    // 完全に不変な方法でMapを更新
    // 1. 現在のエントリを配列として取得
    const currentEntries = Array.from(getTasksMap(undefined));
    // 2. 新しいエントリを作成
    const newEntry: readonly [string, Task] = [task.id, taskToSave] as const;
    // 3. 別々の配列を作成して結合（スプレッド演算子を使わない）
    const allEntries = [...currentEntries.filter(([key]) => key !== task.id), newEntry];
    // 4. 新しいMapオブジェクトを生成
    setTasksMap(new Map(allEntries));

    // 返却する値も新しいオブジェクトとして作成
    return ok({ ...taskToSave });
  };

  /**
   * タスクを削除する
   * @param id 削除するタスクのID
   * @returns 成功時: void、失敗時: エラーオブジェクト
   */
  const deleteTask = async (id: TaskId): Promise<Result<void, TaskRepositoryError>> => {
    if (!getTasksMap(undefined).has(id)) {
      return err({
        type: 'NOT_FOUND',
        message: `タスクID: ${id} は見つかりませんでした`
      });
    }

    // 不変にするため、フィルタリングして新しいMapを作成
    // 関数型アプローチで、配列の直接変更を避ける
    const currentEntries = Array.from(getTasksMap(undefined));
    const filteredEntries = currentEntries.filter(([key]) => key !== id);
    setTasksMap(new Map(filteredEntries));

    return ok(undefined);
  };

  /**
   * タスク数を取得する
   * @param filter フィルタ条件
   * @returns 成功時: タスク数、失敗時: エラーオブジェクト
   */
  const count = async (filter: TaskFilter | undefined): Promise<Result<number, TaskRepositoryError>> => {
    try {
      const filteredTasks = filterTasks(filter);
      return ok(filteredTasks.length);
    } catch (error) {
      return err({
        type: 'STORAGE_ERROR',
        message: 'タスク数の計算中にエラーが発生しました',
        cause: error
      });
    }
  };

  // TaskRepositoryインターフェースを実装したオブジェクトを返す
  return {
    findById,
    findAll,
    save,
    delete: deleteTask,
    count
  };
}