/**
 * 入力処理ドメインの型定義
 *
 * このファイルでは、キー入力処理に関連するドメインレベルの型定義を行います。
 * これらの型は、UIレイヤーとドメインロジック間の共通言語として機能し、
 * 境界を明確に定義します。
 */

/**
 * キー入力を表す型
 * ユーザーからのキー入力イベントを表現するドメインオブジェクト
 */
export type KeyInput = Readonly<{
  readonly key?: string;
  readonly meta?: boolean;
  readonly ctrl?: boolean;
  readonly shift?: boolean;
  readonly alt?: boolean;
  readonly return?: boolean;
  readonly escape?: boolean;
  readonly upArrow?: boolean;
  readonly downArrow?: boolean;
  readonly leftArrow?: boolean;
  readonly rightArrow?: boolean;
  readonly space?: boolean;
}>;

/**
 * キーバインディングの定義
 * 特定のアクションに対するキー入力のマッピングを表現
 */
export type KeyBinding<TAction extends string> = Readonly<{
  readonly action: TAction;
  readonly input: Readonly<Partial<KeyInput>>;
}>;

/**
 * キーバインド設定の内部表現
 * ドメインモデルにおけるキーバインド設定の構造
 */
export type KeyBindingConfiguration<TAction extends string> = Readonly<{
  readonly bindings: ReadonlyArray<KeyBinding<TAction>>;
}>;

/**
 * キーバインドマップ
 * UIレイヤーへ公開するキーバインド設定の構造
 * アクション名をキーとし、対応するキー入力の配列を値とする辞書型
 */
export type KeyBindingMap<TAction extends string> = Readonly<
  Record<TAction, ReadonlyArray<Readonly<Partial<KeyInput>>>>
>;

/**
 * キーバインドハンドラーのインターフェース
 * UIコンポーネントからアクセス可能なキーバインド機能を定義
 */
export type KeyBindingHandler<TAction extends string> = Readonly<{
  /**
   * キー入力からアクションを取得する
   * @param input 入力文字列
   * @param key キー入力情報
   * @returns マッチするアクションまたはnull
   */
  getAction(input: string, key: KeyInput): TAction | null;

  /**
   * キーバインド設定を更新する
   * @param newBindings 新しいキーバインド設定
   */
  updateBindings(newBindings: Readonly<Partial<KeyBindingMap<TAction>>>): void;

  /**
   * 現在のキーバインド設定を取得する
   * @returns 現在のキーバインド設定
   */
  getBindings(): KeyBindingMap<TAction>;
}>;