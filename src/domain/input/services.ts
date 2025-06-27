/**
 * 入力処理ドメインのサービス
 *
 * このファイルでは、キー入力処理に関するドメインサービスを提供します。
 * キー入力のマッチング、バインディングの変換など、入力処理ドメインの
 * 中核となる純粋関数を定義しています。
 */

import type { KeyBinding, KeyBindingConfiguration, KeyBindingMap, KeyInput } from './types.js';

/**
 * キー入力とバインディングがマッチするか判定する純粋関数
 *
 * @param input 入力文字
 * @param key キー情報
 * @param binding 比較対象のキーバインド
 * @returns マッチする場合はtrue、そうでなければfalse
 */
export const isKeyMatching = (
  input: string,
  key: Readonly<KeyInput>,
  binding: Readonly<Partial<KeyInput>>
): boolean => {
  // 文字キーのチェック
  if (typeof binding.key === 'string' && input !== binding.key) {
    return false;
  }

  // その他のキープロパティのチェック
  return Object.entries(binding).every(([prop, value]) => {
    if (prop === 'key') return true; // 文字キーは既にチェック済み

    const typedProp = prop as keyof KeyInput;
    const propValue = key[typedProp];
    const isValueTruthy = Boolean(value);

    // 明示的に指定された値がtrueならば、入力値もtrueである必要がある
    return !(isValueTruthy === true && propValue !== true);
  });
};

/**
 * キー入力に対応するアクションを解決する純粋関数
 *
 * @param config キーバインド設定
 * @param input 入力文字
 * @param key キー情報
 * @returns マッチするアクションがあればそのアクション、なければnull
 */
export const resolveAction = <TAction extends string>(
  config: Readonly<KeyBindingConfiguration<TAction>>,
  input: string,
  key: Readonly<KeyInput>
): TAction | null => {
  for (const binding of config.bindings) {
    if (isKeyMatching(input, key, binding.input)) {
      return binding.action;
    }
  }
  return null;
};

/**
 * 辞書形式のキーバインド設定を内部表現に変換する純粋関数
 *
 * @param bindingMap コンポーネント向けのキーバインド設定
 * @returns ドメインモデルのキーバインド設定
 */
export const mapToConfiguration = <TAction extends string>(
  bindingMap: Readonly<KeyBindingMap<TAction>>
): KeyBindingConfiguration<TAction> => {
  // reduceを使用して、不変な方法で配列を構築
  // 配列.reduceは新しい配列を返すため副作用がない
  const bindings: ReadonlyArray<KeyBinding<TAction>> = Object.keys(bindingMap).reduce(
    (acc: ReadonlyArray<KeyBinding<TAction>>, actionKey: string) => {
      // keyの存在チェック
      if (!(actionKey in bindingMap)) {
        return acc;
      }

      const action = actionKey as TAction;
      const inputs = bindingMap[action];

      // 各入力をマッピングして既存の配列と結合
      const newBindings = inputs.map(input => ({ action, input } as const));
      return [...acc, ...newBindings];
    },
    [] as ReadonlyArray<KeyBinding<TAction>>
  );

  return { bindings };
};

/*
// 別の型安全な実装方法（参考）
export const mapToConfigurationAlt = <TAction extends string>(
  bindingMap: Readonly<KeyBindingMap<TAction>>
): KeyBindingConfiguration<TAction> => {
  const typedEntries = Object.entries(bindingMap) as ReadonlyArray<[TAction, ReadonlyArray<Readonly<Partial<KeyInput>>>]>;

  const bindings = typedEntries.flatMap(
    ([action, inputs]) => inputs.map<KeyBinding<TAction>>(
      (input): KeyBinding<TAction> => ({
        action,
        input
      })
    )
  );

  return { bindings: bindings };
};
*/

/**
 * 内部表現のキーバインド設定を辞書形式に変換する純粋関数
 *
 * @param config ドメインモデルのキーバインド設定
 * @returns コンポーネント向けのキーバインド設定
 */
export const configurationToMap = <TAction extends string>(
  config: Readonly<KeyBindingConfiguration<TAction>>
): KeyBindingMap<TAction> => {
  // bindings配列をアクションごとにグループ化
  // reduceを使用して不変な処理を実現
  return config.bindings.reduce(
    (resultMap, binding) => {
      // 厳密な型チェックで明示的に比較
      const existingBindings = binding.action in resultMap ? resultMap[binding.action] : [] as ReadonlyArray<Readonly<Partial<KeyInput>>>;

      // 新しいオブジェクトを返す（既存のオブジェクトは変更しない）
      return {
        ...resultMap,
        [binding.action]: [
          ...existingBindings,
          binding.input
        ]
      };
    },
    {} as KeyBindingMap<TAction>
  );
};

/**
 * キーバインド設定の部分更新を行う純粋関数
 *
 * @param config 既存のキーバインド設定
 * @param updates 更新内容
 * @returns 更新後のキーバインド設定
 */
export const updateConfiguration = <TAction extends string>(
  config: Readonly<KeyBindingConfiguration<TAction>>,
  updates: Readonly<Partial<KeyBindingMap<TAction>>>
): KeyBindingConfiguration<TAction> => {
  // 既存の設定をMap形式に変換
  const currentMap = configurationToMap(config);

  // 新しいマップに更新内容を適用
  // オブジェクトスプレッド演算子を使用して不変性を維持
  const updatedMap = Object.entries(updates).reduce(
    (result, [action, inputs]) => {
      // 明示的な条件判定と型チェック
      const typedAction = action as TAction;
      return inputs !== undefined && inputs !== null
        ? { ...result, [typedAction]: inputs }
        : result;
    },
    currentMap
  );

  // 新しい設定に変換
  return mapToConfiguration(updatedMap);
};
