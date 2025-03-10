/**
 * jikanicle アプリケーションのエントリーポイント
 *
 * このファイルは、アプリケーションの起動ポイントです。
 * InMemoryタスクリポジトリを初期化し、TUIアプリケーションをレンダリングします。
 */

import { render } from 'ink';
import React from 'react';
import { createInMemoryTaskRepository } from './infrastructure/repositories/in-memory-task-repository.js';
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

    // InMemoryタスクリポジトリの初期化
    // 将来的には設定やコマンドライン引数から、別のリポジトリを使用することも可能
    const taskRepository = createInMemoryTaskRepository();

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
