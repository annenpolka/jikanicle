/**
 * FileSystemAdapter
 *
 * ファイルシステム操作を抽象化するアダプターインターフェースを定義します。
 * このアダプターにより、ファイルシステムという外部依存を抽象化し、
 * アプリケーションコードがファイルシステムの詳細に依存しないようにします。
 *
 * 主な責務:
 * - ファイル操作（読み込み、書き込み、削除）の抽象化
 * - ディレクトリ操作（作成、一覧取得）の抽象化
 * - 排他制御メカニズムの提供
 * - エラーハンドリングの標準化
 */

import type { Result } from 'neverthrow';

/**
 * ファイルシステム操作時のエラー型定義
 * すべての可能性のあるエラーケースを網羅的に定義
 */
export type FileSystemError =
  | { readonly type: 'NOT_FOUND'; readonly message: string; readonly path: string }
  | { readonly type: 'PERMISSION_DENIED'; readonly message: string; readonly path: string }
  | { readonly type: 'ALREADY_EXISTS'; readonly message: string; readonly path: string }
  | { readonly type: 'IO_ERROR'; readonly message: string; readonly path: string; readonly cause?: unknown }
  | { readonly type: 'LOCK_ERROR'; readonly message: string; readonly resourceId: string; readonly cause?: unknown }
  | { readonly type: 'INVALID_PATH'; readonly message: string; readonly path: string }
  | { readonly type: 'ATOMIC_OPERATION_FAILED'; readonly message: string; readonly path: string; readonly cause?: unknown };

/**
 * FileSystemAdapter インターフェース
 * ファイルシステムとの相互作用に必要な操作を定義
 */
export type FileSystemAdapter = {
  /**
   * ファイルを読み込む
   * @param path 読み込むファイルのパス
   * @returns 成功時：ファイルの内容、失敗時：エラーオブジェクト
   */
  readFile(path: string): Promise<Result<string, FileSystemError>>;

  /**
   * ファイルに書き込む
   * @param path 書き込むファイルのパス
   * @param content 書き込む内容
   * @returns 成功時：void、失敗時：エラーオブジェクト
   */
  writeFile(path: string, content: string): Promise<Result<void, FileSystemError>>;

  /**
   * ファイルを削除する
   * @param path 削除するファイルのパス
   * @returns 成功時：void、失敗時：エラーオブジェクト
   */
  deleteFile(path: string): Promise<Result<void, FileSystemError>>;

  /**
   * ファイルの存在を確認する
   * @param path 確認するファイルのパス
   * @returns 成功時：ファイルが存在するかどうか、失敗時：エラーオブジェクト
   */
  fileExists(path: string): Promise<Result<boolean, FileSystemError>>;

  /**
   * ディレクトリを作成する
   * @param path 作成するディレクトリのパス
   * @returns 成功時：void、失敗時：エラーオブジェクト
   */
  createDirectory(path: string): Promise<Result<void, FileSystemError>>;

  /**
   * ディレクトリが存在しない場合は作成する
   * @param path 確認/作成するディレクトリのパス
   * @returns 成功時：void、失敗時：エラーオブジェクト
   */
  ensureDirectory(path: string): Promise<Result<void, FileSystemError>>;

  /**
   * ディレクトリ内のファイル一覧を取得する
   * @param directory 一覧を取得するディレクトリのパス
   * @param pattern オプションのファイル名パターン（glob形式）
   * @returns 成功時：ファイルパスの配列、失敗時：エラーオブジェクト
   */
  listFiles(directory: string, pattern?: string): Promise<Result<readonly string[], FileSystemError>>;

  /**
   * リソースに対する排他ロックを取得する
   * @param resourceId ロックを取得するリソースの識別子
   * @returns 成功時：void、失敗時：エラーオブジェクト
   */
  acquireLock(resourceId: string): Promise<Result<void, FileSystemError>>;

  /**
   * リソースに対する排他ロックを解放する
   * @param resourceId ロックを解放するリソースの識別子
   * @returns 成功時：void、失敗時：エラーオブジェクト
   */
  releaseLock(resourceId: string): Promise<Result<void, FileSystemError>>;

  /**
   * アトミックにファイルを書き込む
   * 書き込み操作が部分的に失敗することを防ぎ、一貫性を保証する
   * @param path 書き込むファイルのパス
   * @param content 書き込む内容
   * @returns 成功時：void、失敗時：エラーオブジェクト
   */
  atomicWriteFile(path: string, content: string): Promise<Result<void, FileSystemError>>;

  /**
   * リソースに対するロックを取得し、操作を実行してからロックを解放する
   * @param resourceId ロックを取得するリソースの識別子
   * @param operation ロック内で実行する非同期操作
   * @returns 成功時：operation の結果、失敗時：エラーオブジェクト
   */
  withLock<T>(
    resourceId: string,
    operation: () => Promise<Result<T, unknown>>
  ): Promise<Result<T, FileSystemError | unknown>>;

  /**
   * ファイルを読み込むストリームを取得する
   * 大きなファイルをメモリ効率良く扱うために使用
   * @param path 読み込むファイルのパス
   * @returns 成功時：ReadableStream、失敗時：エラーオブジェクト
   */
  readFileStream(path: string): Promise<Result<ReadableStream, FileSystemError>>;

  /**
   * ストリームからファイルに書き込む
   * 大きなファイルをメモリ効率良く扱うために使用
   * @param path 書き込むファイルのパス
   * @param stream 書き込むデータのストリーム
   * @returns 成功時：void、失敗時：エラーオブジェクト
   */
  writeFileStream(path: string, stream: ReadableStream): Promise<Result<void, FileSystemError>>;
};