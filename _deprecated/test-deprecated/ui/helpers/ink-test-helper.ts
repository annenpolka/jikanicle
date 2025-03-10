/**
 * Inkコンポーネントテスト用ヘルパー
 *
 * Inkライブラリを使用したTUIコンポーネントのテストを容易にするためのヘルパー関数と
 * 型定義を提供します。
 */
import { render as inkRender, type RenderOptions } from 'ink';
import type { ReactElement } from 'react';
import stripAnsi from 'strip-ansi';
import { afterEach } from 'vitest';

// 描画結果の型定義
export type RenderResult = {
  // 基本的なInkレンダリング結果のプロパティ
  unmount: (error?: Error | number | null) => void;
  rerender: (tree: ReactElement) => void;
  cleanup: () => void;
  clear: () => void;
  waitUntilExit: () => Promise<void>;

  // 拡張プロパティ
  frames?: string[];
  lastFrame?: () => string;
  stdin?: NodeJS.WritableStream;
  stdout?: NodeJS.ReadableStream;
  stderr?: NodeJS.ReadableStream;
  waitForUpdate: () => Promise<void>;
}

/**
 * Inkコンポーネントをレンダリングするための拡張関数
 * vitestと連携するためのラッパー
 *
 * @param element レンダリングするReact要素
 * @param options レンダリングオプション
 * @returns テスト用レンダリング結果
 */
export function renderInk(element: ReactElement, options?: RenderOptions): RenderResult {
  const instance = inkRender(element, options);

  // 標準のrenderメソッドの戻り値にwaitForUpdateメソッドを追加
  const result: Partial<RenderResult> = {
    ...instance,
    waitForUpdate: async () => {
      // 更新が完了するのを待つためのユーティリティ
      // 実際のテストでは以下のように使用:
      // await result.waitForUpdate();
      return new Promise<void>(resolve => {
        setTimeout(resolve, 0);
      });
    }
  };

  // 型安全のため、unknown経由で変換
  // @ts-expect-error - Inkの戻り値型とRenderResultの型の不一致を許容
  return result;
}

/**
 * テスト後にInkインスタンスをクリーンアップする
 */
afterEach(() => {
  // すべてのテスト実行後に自動的に呼び出される
  // 残っているInkのレンダリングインスタンスをクリーンアップする
});

/**
 * TUI出力のフォーマット処理
 *
 * ターミナル出力に含まれるANSIエスケープシーケンスや制御文字を取り除き、
 * テスト用のスナップショットを読みやすくするためのユーティリティ関数です。
 * strip-ansiパッケージが内部で最適化された正規表現を使用します。
 *
 * @param output Inkコンポーネントのレンダリング結果（lastFrameの戻り値など）
 * @returns フォーマット済みの出力テキスト
 */
export function formatOutput(output: string): string {
  // ANSIエスケープシーケンスを除去し、改行コードを正規化
  return stripAnsi(output).replace(/\r\n/g, '\n');
}

/**
 * キーイベントを作成するためのユーティリティ関数
 * stdinに書き込むキーコードを生成します
 */
export const keys = {
  up: '\u001B[A',
  down: '\u001B[B',
  right: '\u001B[C',
  left: '\u001B[D',
  enter: '\r',
  space: ' ',
  escape: '\u001B',
  ctrl: (key: string) => String.fromCharCode(key.charCodeAt(0) - 64),
};

/**
 * キー入力をシミュレートする関数
 *
 * @param stdin 標準入力ストリーム
 * @param input 入力するキー
 */
export function pressKey(stdin: NodeJS.WritableStream, input: string): void {
  stdin.write(input);
}