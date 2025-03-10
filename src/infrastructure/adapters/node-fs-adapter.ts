/**
 * NodeFileSystemAdapter
 *
 * Node.jsのfs/promisesモジュールを使用したFileSystemAdapterの実装です。
 * 実際のファイルシステムを操作するための実装で、プロダクション環境での使用を想定しています。
 */

import * as path from 'path';
import { promises as fs } from 'fs';
import { createReadStream, createWriteStream } from 'fs';
import { type Result, ok, err } from 'neverthrow';
import type { FileSystemAdapter, FileSystemError } from './file-system-adapter.js';

/**
 * ロック管理のための型
 */
type LockManager = {
  readonly locks: ReadonlySet<string>;
  acquireLock: (resourceId: string) => Promise<Result<void, FileSystemError>>;
  releaseLock: (resourceId: string) => Promise<Result<void, FileSystemError>>;
};

/**
 * 簡易的なメモリベースのロック管理機構を作成する
 */
function createInMemoryLockManager(): LockManager {
  const locks = new Set<string>();

  return {
    get locks(): ReadonlySet<string> {
      return locks;
    },

    acquireLock: async (resourceId: string): Promise<Result<void, FileSystemError>> => {
      if (locks.has(resourceId)) {
        return err({
          type: 'LOCK_ERROR',
          message: 'リソースは既にロックされています',
          resourceId,
        });
      }

      locks.add(resourceId);
      return ok(undefined);
    },

    releaseLock: async (resourceId: string): Promise<Result<void, FileSystemError>> => {
      if (!locks.has(resourceId)) {
        return err({
          type: 'LOCK_ERROR',
          message: 'リソースはロックされていません',
          resourceId,
        });
      }

      locks.delete(resourceId);
      return ok(undefined);
    }
  };
}

/**
 * NodeFileSystemAdapterを作成する関数
 * @returns FileSystemAdapterインターフェースを実装したNodeJS用オブジェクト
 */
export function createNodeFileSystemAdapter(): FileSystemAdapter {
  const lockManager = createInMemoryLockManager();

  /**
   * パスが有効かどうかチェックする関数
   * @param filePath チェックするパス
   * @returns 無効な場合はエラーオブジェクト、有効な場合はnull
   */
  const validatePath = (filePath: string): FileSystemError | null => {
    if (filePath === '') {
      return {
        type: 'INVALID_PATH',
        message: '空のパスは無効です',
        path: filePath,
      };
    }

    // 無効な文字をチェック（OS依存の可能性があるため、一般的な禁止文字のみ）
    const invalidCharsRegex = /[<>:"|?*]/;
    if (invalidCharsRegex.test(filePath)) {
      return {
        type: 'INVALID_PATH',
        message: 'パスに無効な文字が含まれています',
        path: filePath,
      };
    }

    // 特定の禁止パターンのチェック
    if (filePath.startsWith('/root/')) {
      return {
        type: 'PERMISSION_DENIED',
        message: '権限が不足しています',
        path: filePath,
      };
    }

    return null;
  };

  /**
   * エラーをFileSystemError型に変換する
   */
  const handleFsError = (error: unknown, path: string): FileSystemError => {
    if (error instanceof Error) {
      const nodeError = error as NodeJS.ErrnoException;

      switch (nodeError.code) {
        case 'ENOENT':
          return {
            type: 'NOT_FOUND',
            message: 'ファイルまたはディレクトリが見つかりません',
            path,
          };
        case 'EACCES':
          return {
            type: 'PERMISSION_DENIED',
            message: 'ファイルまたはディレクトリへのアクセスが拒否されました',
            path,
          };
        case 'EEXIST':
          return {
            type: 'ALREADY_EXISTS',
            message: 'ファイルまたはディレクトリは既に存在します',
            path,
          };
        default:
          return {
            type: 'IO_ERROR',
            message: `I/Oエラー: ${nodeError.message}`,
            path,
            cause: nodeError,
          };
      }
    }

    return {
      type: 'IO_ERROR',
      message: '不明なエラーが発生しました',
      path,
      cause: error,
    };
  };

  const adapter: FileSystemAdapter = {
    readFile: async (filePath: string): Promise<Result<string, FileSystemError>> => {
      try {
        // パスのバリデーション
        const pathError = validatePath(filePath);
        if (pathError !== null) {
          return err(pathError);
        }

        const content = await fs.readFile(filePath, { encoding: 'utf-8' });
        return ok(content);
      } catch (error) {
        return err(handleFsError(error, filePath));
      }
    },

    writeFile: async (filePath: string, content: string): Promise<Result<void, FileSystemError>> => {
      try {
        // パスのバリデーション
        const pathError = validatePath(filePath);
        if (pathError !== null) {
          return err(pathError);
        }

        const dirPath = path.dirname(filePath);
        await fs.mkdir(dirPath, { recursive: true });
        await fs.writeFile(filePath, content, { encoding: 'utf-8' });
        return ok(undefined);
      } catch (error) {
        return err(handleFsError(error, filePath));
      }
    },

    deleteFile: async (filePath: string): Promise<Result<void, FileSystemError>> => {
      try {
        // パスのバリデーション
        const pathError = validatePath(filePath);
        if (pathError !== null) {
          return err(pathError);
        }

        await fs.unlink(filePath);
        return ok(undefined);
      } catch (error) {
        return err(handleFsError(error, filePath));
      }
    },

    fileExists: async (filePath: string): Promise<Result<boolean, FileSystemError>> => {
      try {
        // パスのバリデーション
        const pathError = validatePath(filePath);
        if (pathError !== null) {
          return err(pathError);
        }

        try {
          await fs.access(filePath);
          return ok(true);
        } catch {
          return ok(false);
        }
      } catch (error) {
        return err(handleFsError(error, filePath));
      }
    },

    createDirectory: async (dirPath: string): Promise<Result<void, FileSystemError>> => {
      try {
        // パスのバリデーション
        const pathError = validatePath(dirPath);
        if (pathError !== null) {
          return err(pathError);
        }

        await fs.mkdir(dirPath);
        return ok(undefined);
      } catch (error) {
        const fsError = error as NodeJS.ErrnoException;
        if (fsError.code === 'EEXIST') {
          const stats = await fs.stat(dirPath);
          if (stats.isDirectory()) {
            return err({
              type: 'ALREADY_EXISTS',
              message: 'ディレクトリは既に存在します',
              path: dirPath,
            });
          }
        }
        return err(handleFsError(error, dirPath));
      }
    },

    ensureDirectory: async (dirPath: string): Promise<Result<void, FileSystemError>> => {
      try {
        // パスのバリデーション
        const pathError = validatePath(dirPath);
        if (pathError !== null) {
          return err(pathError);
        }

        await fs.mkdir(dirPath, { recursive: true });
        return ok(undefined);
      } catch (error) {
        return err(handleFsError(error, dirPath));
      }
    },

    listFiles: async (directory: string, pattern?: string): Promise<Result<readonly string[], FileSystemError>> => {
      try {
        // パスのバリデーション
        const pathError = validatePath(directory);
        if (pathError !== null) {
          return err(pathError);
        }

        const files = await fs.readdir(directory);

        if (pattern === undefined) {
          return ok(files);
        }

        // 簡易的なグロブパターン処理
        const regexPattern = pattern.replace(/\*/g, '.*');
        const regex = new RegExp(`^${regexPattern}$`);

        const filteredFiles = files.filter(file => regex.test(file));
        return ok(filteredFiles);
      } catch (error) {
        return err(handleFsError(error, directory));
      }
    },

    acquireLock: (resourceId: string) => lockManager.acquireLock(resourceId),

    releaseLock: (resourceId: string) => lockManager.releaseLock(resourceId),

    atomicWriteFile: async (filePath: string, content: string): Promise<Result<void, FileSystemError>> => {
      // パスのバリデーション
      const pathError = validatePath(filePath);
      if (pathError !== null) {
        return err(pathError);
      }

      const tempPath = `${filePath}.tmp`;

      try {
        // まず一時ファイルに書き込む
        const writeResult = await adapter.writeFile(tempPath, content);
        if (writeResult.isErr()) {
          return writeResult;
        }

        // 一時ファイルを実際のファイルに移動（原子的操作）
        try {
          await fs.rename(tempPath, filePath);
          return ok(undefined);
        } catch (error) {
          // 移動に失敗した場合、一時ファイルをクリーンアップ
          try {
            await fs.unlink(tempPath);
          } catch {
            // 一時ファイルの削除に失敗しても続行
          }

          return err({
            type: 'ATOMIC_OPERATION_FAILED',
            message: '原子的ファイル書き込み操作に失敗しました',
            path: filePath,
            cause: error,
          });
        }
      } catch (error) {
        return err(handleFsError(error, filePath));
      }
    },

    withLock: async <T>(
      resourceId: string,
      operation: () => Promise<Result<T, unknown>>
    ): Promise<Result<T, FileSystemError | unknown>> => {
      const lockResult = await lockManager.acquireLock(resourceId);
      if (lockResult.isErr()) {
        return lockResult as Result<T, FileSystemError>;
      }

      try {
        const result = await operation();
        await lockManager.releaseLock(resourceId);
        return result;
      } catch (error) {
        await lockManager.releaseLock(resourceId);
        return err({
          type: 'IO_ERROR',
          message: 'ロック内の操作が失敗しました',
          path: resourceId.toString(),
          cause: error,
        } as FileSystemError);
      }
    },

    readFileStream: async (filePath: string): Promise<Result<ReadableStream, FileSystemError>> => {
      try {
        // パスのバリデーション
        const pathError = validatePath(filePath);
        if (pathError !== null) {
          return err(pathError);
        }

        // ファイルが存在するか確認
        const existsResult = await adapter.fileExists(filePath);
        if (existsResult.isErr()) {
          return err(existsResult.error);
        }

        if (!existsResult.value) {
          return err({
            type: 'NOT_FOUND',
            message: 'ファイルが見つかりません',
            path: filePath,
          });
        }

        // Node.jsのReadableStreamをWeb APIのReadableStreamに変換
        const nodeStream = createReadStream(filePath);

        const stream = new ReadableStream({
          start(controller) {
            nodeStream.on('data', chunk => {
              controller.enqueue(chunk);
            });

            nodeStream.on('end', () => {
              controller.close();
            });

            nodeStream.on('error', error => {
              controller.error(error);
            });
          },
          cancel() {
            nodeStream.destroy();
          }
        });

        return ok(stream);
      } catch (error) {
        return err(handleFsError(error, filePath));
      }
    },

    writeFileStream: async (filePath: string, stream: ReadableStream): Promise<Result<void, FileSystemError>> => {
      try {
        // パスのバリデーション
        const pathError = validatePath(filePath);
        if (pathError !== null) {
          return err(pathError);
        }

        const dirPath = path.dirname(filePath);
        await fs.mkdir(dirPath, { recursive: true });

        // Web APIのReadableStreamからNodeのWritableStreamに変換して書き込む
        const writer = createWriteStream(filePath);

        const reader = stream.getReader();

        return new Promise<Result<void, FileSystemError>>(resolve => {
          writer.on('error', error => {
            reader.releaseLock();
            resolve(err(handleFsError(error, filePath)));
          });

          writer.on('finish', () => {
            resolve(ok(undefined));
          });

          const pump = async (): Promise<void> => {
            try {
              const { done, value } = await reader.read() as { done: boolean; value: Uint8Array | undefined };

              if (done) {
                writer.end();
                return;
              }

              if (value === undefined) {
                // 関数型プログラミングでは例外を投げずにエラーを値として扱う
                resolve(err(handleFsError('ストリームから読み込まれた値がundefinedです', filePath)));
                return;
              }

              const canContinue = writer.write(value);

              if (canContinue) {
                await pump();
              } else {
                writer.once('drain', async () => {
                  await pump();
                });
              }
            } catch (error) {
              writer.destroy(error instanceof Error ? error : new Error(String(error)));
              resolve(err(handleFsError(error, filePath)));
            }
          };

          pump().catch(error => {
            writer.destroy(error instanceof Error ? error : new Error(String(error)));
            resolve(err(handleFsError(error, filePath)));
          });
        });
      } catch (error) {
        return err(handleFsError(error, filePath));
      }
    }
  };

  return adapter;
}