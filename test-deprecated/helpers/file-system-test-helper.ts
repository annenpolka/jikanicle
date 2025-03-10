/**
 * ファイルシステムテスト用ヘルパー
 *
 * 一時ディレクトリの作成と管理を通じて、テスト環境を分離します。
 * 実際のファイルシステムを使った統合テストを簡単に行うための
 * ユーティリティ関数を提供します。
 */

import { randomUUID } from 'crypto';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';
import { createNodeFileSystemAdapter } from '../../src/infrastructure/adapters/node-fs-adapter.js';
import type { FileSystemAdapter } from '../../src/infrastructure/adapters/file-system-adapter.js';

/**
 * ファイルシステムテスト用のヘルパークラス
 */
export class FileSystemTestHelper {
  private tempDir = '';
  private adapter!: FileSystemAdapter;

  /**
   * 一時ディレクトリを作成し、ノードFSアダプタを初期化
   */
  async setup(): Promise<void> {
    // システムの一時ディレクトリ内にユニークなテストディレクトリを作成
    const testId = randomUUID();
    this.tempDir = path.join(os.tmpdir(), `jikanicle-test-${testId}`);
    await fs.mkdir(this.tempDir, { recursive: true });

    // 実際のファイルシステムアダプタを作成
    this.adapter = createNodeFileSystemAdapter();
  }

  /**
   * テスト用のファイルシステムアダプタを取得
   */
  getAdapter(): FileSystemAdapter {
    return this.adapter;
  }

  /**
   * テスト用の一時ディレクトリのパスを取得
   */
  getTempDirectory(): string {
    return this.tempDir;
  }

  /**
   * テスト用ファイルを作成
   */
  async createTestFile(relativePath: string, content: string): Promise<string> {
    const filePath = this.getPath(relativePath);
    const dirPath = path.dirname(filePath);
    await fs.mkdir(dirPath, { recursive: true });
    await fs.writeFile(filePath, content, 'utf8');
    return filePath;
  }

  /**
   * テスト用ディレクトリを作成
   */
  async createTestDirectory(relativePath: string): Promise<string> {
    const dirPath = this.getPath(relativePath);
    await fs.mkdir(dirPath, { recursive: true });
    return dirPath;
  }

  /**
   * 一時ディレクトリ内のパスを生成
   */
  getPath(...segments: string[]): string {
    return path.join(this.tempDir, ...segments);
  }

  /**
   * テスト後のクリーンアップ
   */
  async cleanup(): Promise<void> {
    try {
      await fs.rm(this.tempDir, { recursive: true, force: true });
    } catch (error) {
      console.error(`テストディレクトリのクリーンアップに失敗: ${this.tempDir}`, error);
    }
  }
}