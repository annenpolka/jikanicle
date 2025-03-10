/**
 * キーバインド機能のためのReactフック
 *
 * このファイルでは、UIコンポーネントでのキーバインド機能の利用を
 * 簡単にするためのReactフックを提供します。キーバインドの作成、カスタマイズ、
 * キー入力のハンドリングを統一的に管理します。
 */

import { useInput } from 'ink';
import { useEffect, useState } from 'react';
import { createKeyBindingHandler } from '../input/key-binding-handler.js';
import type { KeyBindingConfig, KeyBindingHandler, KeyInput } from '../input/types.js';

/**
 * キーバインドフックのオプション
 */
type UseKeyBindingsOptions<TAction extends string> = Readonly<{
  // カスタムキーバインド設定（省略可）
  readonly customBindings?: Readonly<Partial<KeyBindingConfig<TAction>>>;
  // アクションが発生したときのハンドラー
  readonly onAction?: (action: TAction, key: KeyInput) => void;
  // 条件付きで有効化するかどうか（省略可、デフォルトtrue）
  readonly enabled?: boolean;
}>;

/**
 * キーバインド機能を提供するReactフック
 *
 * コンポーネントでキーバインド機能を簡単に使用するためのフック。
 * キーバインドの作成、カスタマイズ、入力処理を一元管理します。
 *
 * @param defaultBindings デフォルトのキーバインド設定
 * @param options キーバインドフックのオプション
 * @returns キーバインドハンドラーインスタンス
 */
export function useKeyBindings<TAction extends string>(
  defaultBindings: KeyBindingConfig<TAction>,
  options: UseKeyBindingsOptions<TAction> = {}
): KeyBindingHandler<TAction> {
  const {
    customBindings = {},
    onAction = (_action: TAction, _key: KeyInput): void => { /* noop */ },
    enabled = true
  } = options;

  // キーバインドハンドラーを作成（コンポーネントのライフサイクル内で一度だけ）
  const [keyBindingHandler] = useState((_: void) =>
    createKeyBindingHandler<TAction>(defaultBindings)
  );

  // カスタムキーバインドの適用
  useEffect((_: void) => {
    const bindingKeys = Object.keys(customBindings);
    if (bindingKeys.length > 0) {
      const typedBindings = customBindings as Readonly<Partial<KeyBindingConfig<TAction>>>;
      keyBindingHandler.updateBindings(typedBindings);
    }
  }, [customBindings, keyBindingHandler]);

  // キーボード入力イベントのハンドリング
  useInput((input: string, key: KeyInput) => {
    if (!enabled) return;

    // getActionの結果を取得
    const actionHolder = keyBindingHandler.getAction(input, key);

    if (actionHolder !== null && actionHolder !== '') {
      executeActionIfExists(actionHolder, onAction, key);
    }
  });

  return keyBindingHandler;
}

/**
 * アクションが存在する場合に実行するヘルパー関数
 * null安全性を確保するための型チェックを提供
 *
 * @param action 実行するアクション（またはnull）
 * @param handler アクションハンドラー関数
 * @param key キー入力情報
 */
function executeActionIfExists<TAction extends string>(
  action: TAction | null,
  handler: (action: TAction, key: KeyInput) => void,
  key: KeyInput
): void {
  if (typeof action === 'string') {
    handler(action, key);
  }
}