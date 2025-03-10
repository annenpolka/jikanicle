/**
 * キーバインドハンドラーの実装
 *
 * このファイルでは、TUIコンポーネント向けキーバインドシステムの中核となる
 * キーバインドハンドラーを実装しています。キー入力とアクションのマッピングを
 * 管理し、カスタマイズ可能なキーバインド設定を提供します。
 */

import { createKeyBindingAdapter } from '../../application/input/key-binding-adapter.js';
import type { KeyBindingConfig, KeyBindingHandler, KeyInput, TaskListAction } from './types.js';

/**
 * キーバインドハンドラーを作成する関数
 * 特定のコンポーネント用のキーバインドハンドラーを生成する
 *
 * この関数はアダプターを使用してドメインロジックとUIを分離します。
 * クリーンアーキテクチャの原則に従い、UI層はドメインロジックに依存しますが、
 * ドメイン層はUI層に依存しません。
 *
 * @param initialBindings - 初期キーバインド設定
 * @returns キーバインドハンドラーインスタンス
 */
export function createKeyBindingHandler<TAction extends string>(
  initialBindings: Readonly<Record<TAction, ReadonlyArray<Readonly<Partial<KeyInput>>>>>
): KeyBindingHandler<TAction> {
  return createKeyBindingAdapter<TAction>(initialBindings);
}

/**
 * タスクリストのデフォルトキーバインド設定
 * 基本的なタスク操作のキーバインドを定義
 *
 * この定数はドメイン知識（タスク操作の標準的な操作方法）を
 * コード化したものです。Object.freezeを使用して不変性を確保しています。
 */
export const DEFAULT_TASK_LIST_BINDINGS: Readonly<KeyBindingConfig<TaskListAction>> = Object.freeze({
  moveUp: [{ upArrow: true }, { key: 'k' }],
  moveDown: [{ downArrow: true }, { key: 'j' }],
  selectTask: [{ return: true }, { space: true }],
  expandTask: [{ rightArrow: true }],
  collapseTask: [{ leftArrow: true }, { escape: true }],
  togglePriority: [{ key: 'p' }],
  toggleStatus: [{ key: 's' }]
});