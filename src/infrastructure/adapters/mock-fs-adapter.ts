/**
 * MockFileSystemAdapter
 *
 * FileSystemAdapterのインメモリ実装です。
 * テストや開発環境での使用を想定し、実際のファイルシステムを操作せずに
 * ファイルシステム操作をシミュレートします。
 */

import { type Result, ok, err } from 'neverthrow';
import type { FileSystemAdapter, FileSystemError } from './file-system-adapter.js';

/**
 * インメモリファイルシステムの状態を表す型
 */
type InMemoryFileSystem = {
  files: Map<string, string>;
  directories: Set<string>;
  locks: Set<string>;
};

/**
 * MockFileSystemAdapter を作成する関数
 * @param initialFiles 初期ファイル状態 (オプション)
 * @returns FileSystemAdapterインターフェースを実装したモックオブジェクト
 */
export function createMockFileSystemAdapter(
  initialFiles: Record<string, string> = {}
): FileSystemAdapter {
  // インメモリの状態を管理
  const fileSystem: InMemoryFileSystem = {
    files: new Map(Object.entries(initialFiles)),
    directories: new Set<string>(),
    locks: new Set<string>(),
  };

  // パスからディレクトリ部分を抽出するヘルパー関数
  const getDirectoryPath = (filePath: string): string => {
    const lastSlashIndex = filePath.lastIndexOf('/');
    return lastSlashIndex >= 0 ? filePath.substring(0, lastSlashIndex) : '';
  };

  // ディレクトリが存在することを保証するヘルパー関数
  const ensureDirectoryExists = (dirPath: string): Result<void, FileSystemError> => {
    if (dirPath === '') {
      return ok(undefined);
    }

    if (fileSystem.files.has(dirPath)) {
      return err({
        type: 'INVALID_PATH',
        message: 'ディレクトリパスがファイルを指しています',
        path: dirPath,
      });
    }

    fileSystem.directories.add(dirPath);

    // 親ディレクトリも再帰的に作成
    const parentDir = getDirectoryPath(dirPath);
    if (parentDir !== '') {
      return ensureDirectoryExists(parentDir);
    }

    return ok(undefined);
  };

  // アダプターの実装
  const adapter: FileSystemAdapter = {
    readFile: async (path: string): Promise<Result<string, FileSystemError>> => {
        // パスの妥当性チェック
        if (path === '') {
          return err({
            type: 'INVALID_PATH',
            message: '空のパスは無効です',
            path,
          });
        }

      if (!fileSystem.files.has(path)) {
        return err({
          type: 'NOT_FOUND',
          message: 'ファイルが見つかりません',
          path,
        });
      }

      const content = fileSystem.files.get(path);
      return ok(content ?? '');
    },

    writeFile: async (path: string, content: string): Promise<Result<void, FileSystemError>> => {
        // パスの妥当性チェック
        if (path === '') {
          return err({
            type: 'INVALID_PATH',
            message: '空のパスは無効です',
            path,
          });
        }

      const dirPath = getDirectoryPath(path);
      const dirResult = await ensureDirectoryExists(dirPath);

      if (dirResult.isErr()) {
        return dirResult;
      }

      fileSystem.files.set(path, content);
      return ok(undefined);
    },

    deleteFile: async (path: string): Promise<Result<void, FileSystemError>> => {
      if (!fileSystem.files.has(path)) {
        return err({
          type: 'NOT_FOUND',
          message: 'ファイルが見つかりません',
          path,
        });
      }

      fileSystem.files.delete(path);
      return ok(undefined);
    },

    fileExists: async (path: string): Promise<Result<boolean, FileSystemError>> => {
      return ok(fileSystem.files.has(path));
    },

    createDirectory: async (path: string): Promise<Result<void, FileSystemError>> => {
      if (fileSystem.files.has(path)) {
        return err({
          type: 'ALREADY_EXISTS',
          message: 'パスは既にファイルとして存在します',
          path,
        });
      }

      if (fileSystem.directories.has(path)) {
        return err({
          type: 'ALREADY_EXISTS',
          message: 'ディレクトリは既に存在します',
          path,
        });
      }

      fileSystem.directories.add(path);
      return ok(undefined);
    },

    ensureDirectory: async (path: string): Promise<Result<void, FileSystemError>> => {
      return ensureDirectoryExists(path);
    },

    listFiles: async (directory: string, pattern?: string): Promise<Result<readonly string[], FileSystemError>> => {
        // ディレクトリの存在チェック
      if (!fileSystem.directories.has(directory) && directory !== '') {
        return err({
          type: 'NOT_FOUND',
          message: 'ディレクトリが見つかりません',
          path: directory,
        });
      }

      // 完全なパスを含めるように修正
        const filesWithPath = Array.from(fileSystem.files.keys())
          .filter(path => getDirectoryPath(path) === directory);

        if (pattern === undefined) {
          // テストの期待に合わせて完全なパスを返す
          return ok(filesWithPath);
      }

      // 簡易的なグロブパターン処理
      const regexPattern = pattern.replace(/\*/g, '.*');
      const regex = new RegExp(`^${regexPattern}$`);

        // ファイル名でフィルタリングしつつ、完全なパスを返す
      const filteredPathFiles = filesWithPath.filter(path => {
          const parts = path.split('/');
          const fileName = parts[parts.length - 1];
          return regex.test(fileName);
        });

      return ok(filteredPathFiles);
    },

    acquireLock: async (resourceId: string): Promise<Result<void, FileSystemError>> => {
      if (fileSystem.locks.has(resourceId)) {
        return err({
          type: 'LOCK_ERROR',
          message: 'リソースは既にロックされています',
          resourceId,
        });
      }

      fileSystem.locks.add(resourceId);
      return ok(undefined);
    },

    releaseLock: async (resourceId: string): Promise<Result<void, FileSystemError>> => {
      if (!fileSystem.locks.has(resourceId)) {
        return err({
          type: 'LOCK_ERROR',
          message: 'リソースはロックされていません',
          resourceId,
        });
      }

      fileSystem.locks.delete(resourceId);
      return ok(undefined);
    },

    atomicWriteFile: async (path: string, content: string): Promise<Result<void, FileSystemError>> => {
      return adapter.writeFile(path, content);
    },

    withLock: async <T>(
      resourceId: string,
      operation: () => Promise<Result<T, unknown>>
    ): Promise<Result<T, FileSystemError | unknown>> => {
      const lockResult = await adapter.acquireLock(resourceId);
      if (lockResult.isErr() === true) {
        return lockResult as Result<T, FileSystemError>;
      }

      try {
        const result = await operation();
        await adapter.releaseLock(resourceId);
        return result;
      } catch (error) {
        await adapter.releaseLock(resourceId);
        return err({
          type: 'IO_ERROR',
          message: 'ロック内の操作が失敗しました',
          path: resourceId,
          cause: error,
        } as FileSystemError);
      }
    },

    readFileStream: async (path: string): Promise<Result<ReadableStream, FileSystemError>> => {
      const fileResult = await adapter.readFile(path);

      if (fileResult.isErr() === true) {
        return err(fileResult.error);
      }

      // ファイルの内容からReadableStreamを作成
      const encoder = new TextEncoder();
      const uint8Array = encoder.encode(fileResult.value);

      const stream = new ReadableStream({
        start(controller) {
          controller.enqueue(uint8Array);
          controller.close();
        }
      });

      return ok(stream);
    },

    writeFileStream: async (path: string, stream: ReadableStream): Promise<Result<void, FileSystemError>> => {
      try {
        const reader = stream.getReader();
        const chunks: Uint8Array[] = [];

        // ストリームからすべてのチャンクを読み込む
        for (;;) {
          const { done, value } = await reader.read() as { done: boolean; value: Uint8Array | undefined };
          if (done) break;
          if (value !== undefined) {
            chunks.push(value);
          }
        }

        // チャンクを結合してデコード
        const totalLength = chunks.reduce((acc: number, chunk) => acc + chunk.length, 0);
        const concatenated = new Uint8Array(totalLength);        let offset = 0;
        for (const chunk of chunks) {
          concatenated.set(chunk, offset);
          offset += chunk.length;
        }

        const decoder = new TextDecoder();
        const content = decoder.decode(concatenated);

        // 通常のwriteFileを使って書き込み
        return adapter.writeFile(path, content);
      } catch (error) {
        return err({
          type: 'IO_ERROR',
          message: 'ストリームの処理中にエラーが発生しました',
          path,
          cause: error
        });
      }
    }
  };

  return adapter;
}