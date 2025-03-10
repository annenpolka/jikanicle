/**
 * NodeFileSystemAdapter 統合テスト
 *
 * 実際のファイルシステムを使用して、NodeFileSystemAdapterの機能をテストします。
 * テスト環境の独立性を確保するため、一時ディレクトリを使用します。
 */

/* eslint-disable @typescript-eslint/no-unused-vars */
 
 
 
 
 
 

import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { promises as fsPromises } from 'fs';
import { beforeEach, afterEach, describe, expect, it } from 'vitest';
import { ok } from 'neverthrow';
import type { FileSystemAdapter } from '../../../src/infrastructure/adapters/file-system-adapter.js';
import { createNodeFileSystemAdapter } from '../../../src/infrastructure/adapters/node-fs-adapter.js';

describe('NodeFileSystemAdapter 統合テスト', () => {
  // テスト用の一時ディレクトリ
  let testDir: string;
  let adapter: FileSystemAdapter;

  // テスト前に一時ディレクトリを作成
  beforeEach(async () => {
    // OS一時ディレクトリの下にテスト用ディレクトリを作成
    testDir = path.join(os.tmpdir(), `node-fs-adapter-test-${Date.now()}`);
    await fsPromises.mkdir(testDir, { recursive: true });

    // 一時ディレクトリをカレントディレクトリに変更
    process.chdir(testDir);

    // アダプターを作成
    adapter = createNodeFileSystemAdapter();
  });

  // テスト後に一時ディレクトリを削除
  afterEach(async () => {
    try {
      // 現在のディレクトリを元に戻す必要がある場合はここで行う
      // process.chdir(originalDir);

      // 一時ディレクトリを再帰的に削除
      await fsPromises.rm(testDir, { recursive: true, force: true });
    } catch (error) {
      console.error('テスト用ディレクトリの削除に失敗:', error);
    }
  });

  describe('基本的なファイル操作', () => {
    it('ファイルの読み書きと削除', async () => {
      const filePath = path.join(testDir, 'test.txt');
      const content = 'これはテストファイルです';

      // ファイル書き込み
      const writeResult = await adapter.writeFile(filePath, content);
      expect(writeResult.isOk()).toBe(true);

      // ファイル存在確認
      const existsResult = await adapter.fileExists(filePath);
      expect(existsResult.isOk()).toBe(true);
      if (existsResult.isOk()) {
        expect(existsResult.value).toBe(true);
      }

      // ファイル読み込み
      const readResult = await adapter.readFile(filePath);
      expect(readResult.isOk()).toBe(true);
      if (readResult.isOk()) {
        expect(readResult.value).toBe(content);
      }

      // ファイル削除
      const deleteResult = await adapter.deleteFile(filePath);
      expect(deleteResult.isOk()).toBe(true);

      // 削除確認
      const afterDeleteExists = await adapter.fileExists(filePath);
      expect(afterDeleteExists.isOk()).toBe(true);
      if (afterDeleteExists.isOk()) {
        expect(afterDeleteExists.value).toBe(false);
      }
    });

    it('大きなファイルの読み書き', async () => {
      const filePath = path.join(testDir, 'large-file.txt');
      // 5MBのファイルを生成
      const largeContent = 'a'.repeat(5 * 1024 * 1024);

      // ファイル書き込み
      const writeResult = await adapter.writeFile(filePath, largeContent);
      expect(writeResult.isOk()).toBe(true);

      // ファイル読み込み
      const readResult = await adapter.readFile(filePath);
      expect(readResult.isOk()).toBe(true);
      if (readResult.isOk()) {
        expect(readResult.value.length).toBe(largeContent.length);
        // メモリ消費を抑えるため、先頭と末尾だけ検証
        expect(readResult.value.substring(0, 100)).toBe(largeContent.substring(0, 100));
        expect(readResult.value.substring(largeContent.length - 100)).toBe(largeContent.substring(largeContent.length - 100));
      }
    });

    it('特殊文字を含むパスのファイル操作', async () => {
      // 特殊文字を含むファイル名（OSの制限による）
      const fileName = 'special-@#$%^&()-file.txt';
      const filePath = path.join(testDir, fileName);
      const content = '特殊文字パスのテスト';

      // 書き込み
      const writeResult = await adapter.writeFile(filePath, content);
      expect(writeResult.isOk()).toBe(true);

      // 読み込み
      const readResult = await adapter.readFile(filePath);
      expect(readResult.isOk()).toBe(true);
      if (readResult.isOk()) {
        expect(readResult.value).toBe(content);
      }

      // 削除
      const deleteResult = await adapter.deleteFile(filePath);
      expect(deleteResult.isOk()).toBe(true);
    });

    it('存在しないファイルのエラー処理', async () => {
      const nonExistentPath = path.join(testDir, 'non-existent.txt');

      // 存在しないファイルの読み込み
      const readResult = await adapter.readFile(nonExistentPath);
      expect(readResult.isErr()).toBe(true);
      if (readResult.isErr()) {
        expect(readResult.error.type).toBe('NOT_FOUND');
      }

      // 存在しないファイルの削除
      const deleteResult = await adapter.deleteFile(nonExistentPath);
      expect(deleteResult.isErr()).toBe(true);
      if (deleteResult.isErr()) {
        expect(deleteResult.error.type).toBe('NOT_FOUND');
      }
    });
  });

  describe('ディレクトリ操作', () => {
    it('ディレクトリの作成と確認', async () => {
      const dirPath = path.join(testDir, 'test-dir');

      // ディレクトリ作成
      const createResult = await adapter.createDirectory(dirPath);
      expect(createResult.isOk()).toBe(true);

      // ディレクトリが存在するか確認（実際のファイルシステムで）
      const dirExists = fs.existsSync(dirPath);
      expect(dirExists).toBe(true);
      const stats = fs.statSync(dirPath);
      expect(stats.isDirectory()).toBe(true);
    });

    it('ネストしたディレクトリの作成', async () => {
      const deepDirPath = path.join(testDir, 'level1/level2/level3');

      // ensureDirectoryで深いディレクトリを作成
      const ensureResult = await adapter.ensureDirectory(deepDirPath);
      expect(ensureResult.isOk()).toBe(true);

      // 各レベルのディレクトリが存在するか確認
      expect(fs.existsSync(path.join(testDir, 'level1'))).toBe(true);
      expect(fs.existsSync(path.join(testDir, 'level1/level2'))).toBe(true);
      expect(fs.existsSync(deepDirPath)).toBe(true);

      // ファイル作成でテスト
      const filePath = path.join(deepDirPath, 'test.txt');
      const writeResult = await adapter.writeFile(filePath, 'テスト');
      expect(writeResult.isOk()).toBe(true);
    });

    it('既存のディレクトリを作成しようとした場合のエラー', async () => {
      const dirPath = path.join(testDir, 'existing-dir');

      // 最初にディレクトリを作成
      const firstResult = await adapter.createDirectory(dirPath);
      expect(firstResult.isOk()).toBe(true);

      // 同じディレクトリをもう一度作成
      const secondResult = await adapter.createDirectory(dirPath);
      expect(secondResult.isErr()).toBe(true);
      if (secondResult.isErr()) {
        expect(secondResult.error.type).toBe('ALREADY_EXISTS');
      }

      // ensureDirectoryは既存ディレクトリでもエラーにならない
      const ensureResult = await adapter.ensureDirectory(dirPath);
      expect(ensureResult.isOk()).toBe(true);
    });

    it('ファイルリストの取得', async () => {
      const dirPath = path.join(testDir, 'list-dir');
      await adapter.createDirectory(dirPath);

      // テストファイルを作成
      const files = [
        { name: 'file1.txt', content: 'ファイル1' },
        { name: 'file2.txt', content: 'ファイル2' },
        { name: 'data.json', content: '{"test": true}' }
      ];

      for (const file of files) {
        await adapter.writeFile(path.join(dirPath, file.name), file.content);
      }

      // ファイル一覧取得
      const listResult = await adapter.listFiles(dirPath);
      expect(listResult.isOk()).toBe(true);
      if (listResult.isOk()) {
        expect(listResult.value.length).toBe(files.length);

        // すべてのファイル名が含まれているか検証
        const fileNames = files.map(f => f.name);
        for (const name of fileNames) {
          expect(listResult.value).toContain(name);
        }
      }

      // パターンでフィルタリング
      const filteredResult = await adapter.listFiles(dirPath, '*.txt');
      expect(filteredResult.isOk()).toBe(true);
      if (filteredResult.isOk()) {
        expect(filteredResult.value.length).toBe(2);
        expect(filteredResult.value).toContain('file1.txt');
        expect(filteredResult.value).toContain('file2.txt');
        expect(filteredResult.value).not.toContain('data.json');
      }
    });
  });

  describe('ロック機能', () => {
    it('リソースのロックと解放', async () => {
      const resourceId = 'test-resource';

      // ロック取得
      const lockResult = await adapter.acquireLock(resourceId);
      expect(lockResult.isOk()).toBe(true);

      // 同じリソースのロック取得（失敗するはず）
      const secondLock = await adapter.acquireLock(resourceId);
      expect(secondLock.isErr()).toBe(true);
      if (secondLock.isErr()) {
        expect(secondLock.error.type).toBe('LOCK_ERROR');
      }

      // ロック解放
      const releaseResult = await adapter.releaseLock(resourceId);
      expect(releaseResult.isOk()).toBe(true);

      // 解放後の再ロック（成功するはず）
      const reLock = await adapter.acquireLock(resourceId);
      expect(reLock.isOk()).toBe(true);
    });

    it('withLockを使った操作', async () => {
      const resourceId = 'with-lock-resource';
      const filePath = path.join(testDir, 'lock-test.txt');
      const content = 'ロック内操作のテスト';

      // withLockを使った操作
      const result = await adapter.withLock(resourceId, async () => {
        // ロック内でファイル書き込み
        const writeResult = await adapter.writeFile(filePath, content);
        expect(writeResult.isOk()).toBe(true);

        // ファイル読み込み
        const readResult = await adapter.readFile(filePath);
        expect(readResult.isOk()).toBe(true);

        if (readResult.isOk()) {
          return ok(readResult.value);
        }
        throw new Error('ファイル読み込みに失敗しました');
      });

      // 結果検証
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value).toBe(content);
      }

      // ロックが解放されていることを確認
      const lockAfter = await adapter.acquireLock(resourceId);
      expect(lockAfter.isOk()).toBe(true);
    });

    it('withLock内でエラーが発生した場合のロック解放', async () => {
      const resourceId = 'error-resource';

      // エラーをスローする操作
      const result = await adapter.withLock(resourceId, async () => {
        throw new Error('テストエラー');
      });

      // 操作は失敗
      expect(result.isErr()).toBe(true);

      // ロックが解放されていることを確認
      const lockAfter = await adapter.acquireLock(resourceId);
      expect(lockAfter.isOk()).toBe(true);
    });
  });

  describe('アトミック操作', () => {
    it('atomicWriteFileでの書き込み', async () => {
      const filePath = path.join(testDir, 'atomic.txt');
      const content = 'アトミック書き込みのテスト';

      // アトミック書き込み
      const writeResult = await adapter.atomicWriteFile(filePath, content);
      expect(writeResult.isOk()).toBe(true);

      // 結果確認
      const readResult = await adapter.readFile(filePath);
      expect(readResult.isOk()).toBe(true);
      if (readResult.isOk()) {
        expect(readResult.value).toBe(content);
      }

      // 一時ファイルが残っていないことを確認
      const tempFilePath = `${filePath}.tmp`;
      expect(fs.existsSync(tempFilePath)).toBe(false);
    });
  });

  describe('ストリーム操作', () => {
    it('ファイルをストリームで読み込む', async () => {
      const filePath = path.join(testDir, 'stream-read.txt');
      const content = 'ストリーム読み込みテスト'.repeat(1000); // 大きめの内容

      // 通常の方法でファイルを作成
      await adapter.writeFile(filePath, content);

      // ストリームとして読み込み
      const streamResult = await adapter.readFileStream(filePath);
      expect(streamResult.isOk()).toBe(true);

      if (streamResult.isOk()) {
        const stream = streamResult.value;
        const reader = stream.getReader();
        const chunks: Uint8Array[] = [];

        // すべてのチャンクを読み込む
        let totalSize = 0;
        for (;;) {
          const { done, value } = await reader.read();
          if (done) break;
          chunks.push(value);
          totalSize += value.length;
        }

        // チャンクを結合してデコード
        const concatenated = new Uint8Array(totalSize);
        let offset = 0;
        for (const chunk of chunks) {
          concatenated.set(chunk, offset);
          offset += chunk.length;
        }

        const decoder = new TextDecoder();
        const result = decoder.decode(concatenated);

        // 内容を検証
        expect(result).toBe(content);
      }
    });

    it('ストリームからファイルに書き込む', async () => {
      const filePath = path.join(testDir, 'stream-write.txt');
      const content = 'ストリーム書き込みテスト'.repeat(1000);

      // ストリームを作成
      const encoder = new TextEncoder();
      const uint8Array = encoder.encode(content);

      const stream = new ReadableStream({
        start(controller) {
          controller.enqueue(uint8Array);
          controller.close();
        }
      });

      // ストリームから書き込み
      const writeResult = await adapter.writeFileStream(filePath, stream);
      expect(writeResult.isOk()).toBe(true);

      // 結果確認（通常の読み込みで）
      const readResult = await adapter.readFile(filePath);
      expect(readResult.isOk()).toBe(true);
      if (readResult.isOk()) {
        expect(readResult.value).toBe(content);
      }
    });

    it('チャンク分割されたストリーム書き込み', async () => {
      const filePath = path.join(testDir, 'chunked-stream.txt');
      const chunks = [
        'チャンク1：これはテストです。',
        'チャンク2：複数のチャンクに分割されています。',
        'チャンク3：最後のチャンクです。'
      ];

      // チャンク分割されたストリームを作成
      const encoder = new TextEncoder();
      const stream = new ReadableStream({
        start(controller) {
          for (const chunk of chunks) {
            controller.enqueue(encoder.encode(chunk));
          }
          controller.close();
        }
      });

      // ストリームから書き込み
      const writeResult = await adapter.writeFileStream(filePath, stream);
      expect(writeResult.isOk()).toBe(true);

      // 結果確認
      const readResult = await adapter.readFile(filePath);
      expect(readResult.isOk()).toBe(true);
      if (readResult.isOk()) {
        const expectedContent = chunks.join('');
        expect(readResult.value).toBe(expectedContent);
      }
    });
  });

  describe('エラー処理', () => {
    it('無効なパス文字列のエラー処理', async () => {
      // ノードの環境では実際の無効なパス文字を使うことが難しいので、
      // 代表的なケースのみテスト

      const invalidPaths = [
        // ファイルシステムによっては ":" が使えない
        path.join(testDir, 'invalid:file.txt'),
        // 空パス
        '',
      ];

      for (const invalidPath of invalidPaths) {
        // 無効なパスへの書き込み試行
        const writeResult = await adapter.writeFile(invalidPath, 'test');

        // Windows/macOS/Linuxで挙動が異なる可能性があるので、
        // エラーの種類は厳密にチェックしない
        expect(writeResult.isErr()).toBe(true);
      }
    });

    it('権限がない場合のエラー処理', async () => {
      // 注意: このテストは実行環境によっては失敗する可能性がある
      // 権限のないディレクトリへのアクセスをシミュレートする

      // rootのみが書き込めるディレクトリへの書き込みを試みる
      // （テスト環境によっては失敗するため、条件付きでスキップ）
      const rootOnlyPath = '/root/test-file.txt';

      try {
        // 事前にアクセス可能か確認
        await fsPromises.access('/root', fs.constants.W_OK);

        // アクセス可能な場合（通常はroot権限で実行している場合）、テストをスキップ
        console.warn('Root権限でテストが実行されているため、権限エラーテストをスキップします');
      } catch (e) {
        // アクセス不可の場合、テストを実行
        const writeResult = await adapter.writeFile(rootOnlyPath, 'test');
        expect(writeResult.isErr()).toBe(true);
        if (writeResult.isErr()) {
          // OSによってエラータイプが異なる可能性がある
          expect(['PERMISSION_DENIED', 'IO_ERROR']).toContain(writeResult.error.type);
        }
      }
    });
  });
});