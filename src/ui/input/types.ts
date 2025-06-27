/**
 * キーバインドシステムのUI層型定義
 *
 * このファイルでは、UIコンポーネントが使用するキーバインド関連の型定義を行います。
 * ドメイン層の汎用的な型をUIレイヤーで具体化し、特定のコンポーネントに
 * 適した形で提供します。
 */

import type {
  KeyBindingHandler as DomainKeyBindingHandler,
  KeyBindingMap,
  KeyInput
} from '../../domain/input/types.js';

/**
 * タスクリストの操作アクション
 * タスク一覧表示で利用可能なユーザーアクションを定義
 */
export type TaskListAction =
  | 'moveUp'         // 上に移動
  | 'moveDown'       // 下に移動
  | 'selectTask'     // タスク選択
  | 'expandTask'     // タスク展開
  | 'collapseTask'   // タスク折りたたみ
  | 'togglePriority' // 優先度切替
  | 'toggleStatus';  // ステータス切替

/**
 * キーバインド設定の型
 * アクションとキー入力のマッピングを定義
 */
export type KeyBindingConfig<TAction extends string = TaskListAction> =
  KeyBindingMap<TAction>;

/**
 * キーバインドハンドラーインターフェース
 * ドメイン層の型をUIレイヤーで再エクスポート
 */
export type KeyBindingHandler<TAction extends string = TaskListAction> =
  DomainKeyBindingHandler<TAction>;

// KeyInputを再エクスポート
export { KeyInput };