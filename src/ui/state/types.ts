/**
 * jikanicle 状態管理共通型定義
 *
 * このファイルでは、Zustandを使用した状態管理で共通して使用される型を定義します。
 * ドメイン型とUI状態型を適切に分離し、型安全な状態管理を実現します。
 */

import type { Result } from 'neverthrow';

/**
 * 非同期処理の状態を表す型
 */
export type AsyncState = {
  readonly loading: boolean;
  readonly error: StoreError | null;
}

/**
 * ストア内でのエラー状態を表す型
 */
export type StoreError = {
  readonly type: string;
  readonly message: string;
  readonly cause?: unknown;
};

/**
 * フィルタリング状態の基本型
 * ジェネリック型Tでフィルタリング条件の型を指定
 */
export type FilterState<T> = {
  readonly filters: T;
  readonly isFilterActive: boolean;
}

/**
 * ソート状態の基本型
 * ジェネリック型Kでソート可能なキーの型を指定（通常はユニオン型）
 */
export type SortState<K extends string> = {
  readonly sortBy: K;
  readonly sortDirection: 'asc' | 'desc';
}

/**
 * ストア状態の基本型
 * すべてのストア状態はこのインターフェースを拡張します
 */
export type StoreState = {
  readonly storeId: string;
}

/**
 * ストアアクションの基本型
 * 特定のストアで使用される追加アクションを定義するために拡張します
 */
export type StoreActions = {
  readonly reset: () => void;
}

/**
 * 永続化可能なストアの設定
 */
export type PersistOptions = {
  readonly name: string;
  readonly includeKeys?: readonly string[];
  readonly excludeKeys?: readonly string[];
}

/**
 * Resultの簡略化された型ヘルパー
 * Resultの継続的なネストを避けるために使用します
 */
export type AsyncResult<T, E = StoreError> = Promise<Result<T, E>>;