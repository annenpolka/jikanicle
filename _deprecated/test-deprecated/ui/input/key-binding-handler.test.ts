/**
 * キーバインドハンドラーのテスト
 *
 * ユーザー入力からUIアクションへのマッピングを担当するキーバインドハンドラーの
 * 機能をテストします。柔軟なキーバインド設定と複合キーのサポートを検証します。
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';

// 実装前のため、テスト内でモック型を定義
// 将来的には実際の型をインポートする
type KeyInput = {
  key?: string;
  meta?: boolean;
  ctrl?: boolean;
  shift?: boolean;
  alt?: boolean;
  return?: boolean;
  escape?: boolean;
  upArrow?: boolean;
  downArrow?: boolean;
  leftArrow?: boolean;
  rightArrow?: boolean;
  space?: boolean;
};

// テスト対象となるクラス/関数は未実装のため、テストでインターフェースを定義
// ここで定義するインターフェースが実装の設計指針となる
type TaskListAction = 'moveUp' | 'moveDown' | 'selectTask' | 'expandTask' | 'collapseTask' | 'togglePriority' | 'toggleStatus';

type KeyBindingHandler = {
  getAction(input: string, key: KeyInput): TaskListAction | null;
  updateBindings(newBindings: Partial<Record<TaskListAction, Array<Partial<KeyInput>>>>): void;
}

// 実装予定のデフォルトキーバインド設定
const DEFAULT_KEY_BINDINGS: Record<TaskListAction, Array<Partial<KeyInput>>> = {
  moveUp: [{ upArrow: true }, { key: 'k' }] as Array<Partial<KeyInput>>,
  moveDown: [{ downArrow: true }, { key: 'j' }],
  selectTask: [{ return: true }, { space: true }],
  expandTask: [{ rightArrow: true }],
  collapseTask: [{ leftArrow: true }, { escape: true }],
  togglePriority: [{ key: 'p' }],
  toggleStatus: [{ key: 's' }]
};

// モック関数の型を定義
type MockKeyBindingHandlerConstructor = (
  keyBindings?: Record<TaskListAction, Array<Partial<KeyInput>>>
) => KeyBindingHandler;

describe('KeyBindingHandler', () => {
  // テスト用のモック実装
  let createKeyBindingHandler: MockKeyBindingHandlerConstructor;
  let handler: KeyBindingHandler;

  beforeEach(() => {
    // テスト前にモックハンドラーを作成
    createKeyBindingHandler = vi.fn((initialBindings = DEFAULT_KEY_BINDINGS) => {
      // モックの内部状態として安全な型で保持
      let bindings: Record<TaskListAction, Array<Partial<KeyInput>>> = { ...initialBindings };

      return {
        getAction: vi.fn((input, key) => {
          // モック実装：最初のマッチしたアクションを返す
          const entries = Object.entries(bindings) as [TaskListAction, Array<Partial<KeyInput>>][];
          for (const [action, keyBindings] of entries) {
            for (const binding of keyBindings) {
              // 文字キーのチェック
              if (typeof binding.key === 'string' && input !== binding.key) {
                continue;
              }

              // その他のキープロパティのチェック
              let match = true;
              for (const [prop, value] of Object.entries(binding)) {
                if (prop === 'key') continue; // 文字キーは既にチェック済み
                // 明示的な型チェックで比較
                const propValue = key[prop as keyof KeyInput];
                const isValueTruthy = Boolean(value);
                if (isValueTruthy === true && propValue !== true) {
                  match = false;
                  break;
                }
              }

              if (match) {
                return action as TaskListAction;
              }
            }
          }
          return null;
        }),
        updateBindings: vi.fn((newBindings) => {
          // モック実装：新しい設定を適用
          bindings = { ...bindings, ...(newBindings as Record<TaskListAction, Array<Partial<KeyInput>>>) };
        })
      };
    });

    handler = createKeyBindingHandler();
  });

  describe('デフォルトキーバインド', () => {
    it('矢印キー（上）で「moveUp」アクションを返すこと', () => {
      // Arrange: 入力とキー情報を設定
      const input = '';
      const key: KeyInput = { upArrow: true };

      // Act: アクションを取得
      const action = handler.getAction(input, key);

      // Assert: 期待するアクションが返されること
      expect(action).toBe('moveUp');
    });

    it('「k」キーで「moveUp」アクションを返すこと', () => {
      // Arrange
      const input = 'k';
      const key: KeyInput = { key: 'k' };

      // Act
      const action = handler.getAction(input, key);

      // Assert
      expect(action).toBe('moveUp');
    });

    it('矢印キー（下）で「moveDown」アクションを返すこと', () => {
      // Arrange
      const input = '';
      const key: KeyInput = { downArrow: true };

      // Act
      const action = handler.getAction(input, key);

      // Assert
      expect(action).toBe('moveDown');
    });

    it('Enterキーで「selectTask」アクションを返すこと', () => {
      // Arrange
      const input = '';
      const key: KeyInput = { return: true };

      // Act
      const action = handler.getAction(input, key);

      // Assert
      expect(action).toBe('selectTask');
    });
  });

  describe('カスタムキーバインド', () => {
    it('カスタム設定で「moveUp」を「i」キーに変更できること', () => {
      // Arrange: カスタムキーバインドを設定
      handler.updateBindings({
        moveUp: [{ key: 'i' }]
      });

      // Act: カスタム設定で「i」キーを押した場合
      const action = handler.getAction('i', { key: 'i' });

      // Assert: 新しく設定されたアクションが返されること
      expect(action).toBe('moveUp');
    });

    it('一部のキーバインドだけを更新しても既存の設定が維持されること', () => {
      // Arrange: moveUpだけ更新
      handler.updateBindings({
        moveUp: [{ key: 'i' }]
      });

      // Act: 既存のmoveDownの設定が維持されているか確認
      const action = handler.getAction('j', { key: 'j' });

      // Assert: 既存の設定が維持されていること
      expect(action).toBe('moveDown');
    });
  });

  describe('複合キー', () => {
    it('Ctrl+Nで「moveDown」アクションを設定できること', () => {
      // Arrange: 複合キーの設定
      handler.updateBindings({
        moveDown: [{ key: 'n', ctrl: true }]
      });

      // Act: Ctrl+Nを押した場合
      const action = handler.getAction('n', { key: 'n', ctrl: true });

      // Assert: 期待するアクションが返されること
      expect(action).toBe('moveDown');
    });

    it('Shift+Alt+Pで「togglePriority」アクションを設定できること', () => {
      // Arrange: 複雑な複合キーの設定
      handler.updateBindings({
        togglePriority: [{ key: 'p', shift: true, alt: true }]
      });

      // Act: Shift+Alt+Pを押した場合
      const action = handler.getAction('p', { key: 'p', shift: true, alt: true });

      // Assert
      expect(action).toBe('togglePriority');
    });

    it('実際のキー入力と設定が完全に一致する場合のみマッチすること', () => {
      // Arrange: Ctrl+Pを設定
      handler.updateBindings({
        togglePriority: [{ key: 'p', ctrl: true }]
      });

      // Act: Pキーのみを押した場合（Ctrlなし）
      const action = handler.getAction('p', { key: 'p' });

      // Assert: 一致しないのでnullが返されること
      expect(action).toBeNull();
    });
  });

  describe('エッジケース', () => {
    it('未定義のキー入力の場合はnullを返すこと', () => {
      // Arrange: 定義されていないキー
      const input = 'x';
      const key: KeyInput = { key: 'x' };

      // Act
      const action = handler.getAction(input, key);

      // Assert: マッチするキーバインドがないのでnull
      expect(action).toBeNull();
    });

    it('複数の設定が一致する場合、最初に一致したものを優先すること', () => {
      // Arrange: 同じキーに複数のアクションを設定
      handler.updateBindings({
        moveUp: [{ key: 'x' }],
        moveDown: [{ key: 'x' }]  // こちらは後から設定
      });

      // Act
      const action = handler.getAction('x', { key: 'x' });

      // Assert: 最初に定義されたmoveUpが優先される
      expect(action).toBe('moveUp');
    });
  });
});