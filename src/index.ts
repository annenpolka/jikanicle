/**
 * jikanicle アプリケーションのエントリーポイント
 *
 * このファイルは、アプリケーションの起動ポイントです。
 * ファイルベースのタスクリポジトリを初期化し、TUIアプリケーションをレンダリングします。
 */

import { render } from 'ink';
import React from 'react';
import { createNodeFileSystemAdapter } from './infrastructure/adapters/node-fs-adapter.js';
import { loadConfig } from './infrastructure/config/config-loader.js';
import { createFileBasedTaskRepository } from './infrastructure/repositories/file-based-task-repository.js';
import { App } from './ui/App.js';

/**
 * アプリケーションのメイン関数
 * TUIアプリケーションを初期化して実行します。
 *
 * @param _ - 未使用のパラメータ
 * @returns Promise<void> - アプリケーション終了時に解決するPromise
 */
async function main(_: void): Promise<void> {
  try {
    console.log('jikanicle を起動中...');

    // 設定の読み込み
    const configResult = await loadConfig();

    // 関数型プログラミング原則に従ったエラー処理
    const config = configResult.match(
      (config) => config,
      (error) => {
        console.error(`設定の読み込みに失敗しました: ${error.message}`);
        process.exit(1);
        return null as never; // ここには到達しない
      },
    );

    // ファイルシステムアダプタとファイルベースリポジトリの初期化
    const fs = createNodeFileSystemAdapter();
    const taskRepository = createFileBasedTaskRepository(fs, { dataDir: config.repository.dataDirectory });

    // Appコンポーネントのレンダリング
    const { waitUntilExit } = render(
      React.createElement(App, { taskRepository })
    );

    // アプリケーションの終了を待機
    await waitUntilExit();

    console.log('アプリケーションを終了しました');
  } catch (error) {
    console.error('アプリケーション実行エラー:', error);
    process.exit(1);
  }
}

// アプリケーション実行
main().catch(err => {
  console.error('予期せぬエラーが発生しました:', err);
  process.exit(1);
});
