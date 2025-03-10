/**
 * キーバインドアダプター
 *
 * このファイルでは、ドメイン層で定義されたキーバインド機能をUIコンポーネントで
 * 利用しやすい形に変換するアダプターを提供します。ドメインモデルとUIレイヤーの
 * インターフェースを橋渡しする役割を果たします。
 */

import type {
    KeyBindingConfiguration,
    KeyBindingHandler,
    KeyBindingMap,
    KeyInput
} from '../../domain/input/types.js';

import {
    configurationToMap,
    mapToConfiguration,
    resolveAction,
    updateConfiguration
} from '../../domain/input/services.js';

/**
 * アダプターの状態を表す型
 * ドメイン設計において、アダプターは内部状態を持つことが許容される
 * ただし、その状態変更はアダプター内部に閉じ込め、副作用を最小限に抑える
 */
type AdapterState<TAction extends string> = Readonly<{
  readonly config: Readonly<KeyBindingConfiguration<TAction>>;
}>;

/**
 * 入力ポート: UIレイヤーからドメイン層へのインターフェース
 * キーバインドハンドラーを生成するファクトリ関数
 *
 * UIレイヤーとドメインモデルを繋ぐアダプターを作成します。
 * 内部的にはドメインサービスを使用しながら、UIコンポーネントが期待する
 * インターフェースを提供します。
 *
 * @param initialBindings 初期キーバインド設定
 * @returns キーバインドハンドラー
 */
export function createKeyBindingAdapter<TAction extends string>(
  initialBindings: Readonly<KeyBindingMap<TAction>>
): KeyBindingHandler<TAction> {
  /**
   * アダプターの内部状態
   *
   * DDDのアダプターパターンでは、外部世界とドメインの橋渡しをするために
   * 状態を保持することが一般的です。ただし、その状態変更は厳密に管理され、
   * 変更の影響範囲はアダプター内部に限定されます。
   *
   * ここではletを使用していますが、これはアダプターの責務を果たすための
   * 例外的なケースとして許容されます。状態自体は不変（readonly）です。
   */
  // eslint-disable-next-line functional/no-let
  let state: AdapterState<TAction> = {
    config: mapToConfiguration(initialBindings)
  };

  /**
   * 内部状態を不変的に更新する関数
   *
   * この関数は副作用を局所化し、状態更新のロジックを一元管理します。
   * 新しい状態は常に古い状態から生成され、不変性原則に従います。
   *
   * @param modifier - 現在の状態から新しい状態を生成する関数
   */
  const updateState = (
    modifier: (current: Readonly<AdapterState<TAction>>) => Readonly<AdapterState<TAction>>
  ): void => {
    state = modifier(state);
  };

  return {
    /**
     * キー入力からアクションを特定する
     *
     * @param input - 入力された文字
     * @param key - キー入力の詳細情報
     * @returns マッチするアクションまたはnull
     */
    getAction: (input: string, key: KeyInput): TAction | null => {
      return resolveAction(state.config, input, key);
    },

    /**
     * キーバインド設定を更新する
     *
     * @param newBindings - 新しいキーバインド設定
     */
    updateBindings: (
      newBindings: Readonly<Partial<KeyBindingMap<TAction>>>
    ): void => {
      updateState(current => ({
        ...current,
        config: updateConfiguration(current.config, newBindings)
      }));
    },

    /**
     * 現在のキーバインド設定を取得する
     *
     * @returns 現在のキーバインド設定
     */
    // eslint-disable-next-line functional/functional-parameters
    getBindings: (): KeyBindingMap<TAction> => configurationToMap(state.config)
  };
}