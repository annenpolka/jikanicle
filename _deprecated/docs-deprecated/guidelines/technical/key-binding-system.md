# TUIコンポーネントのキーバインド設計ガイドライン

## 更新履歴

| 日付 | 更新者 | 内容 |
|------|--------|------|
| 2025-03-10 | 開発チーム | 初版作成 |

## 1. 設計の概要と目的

TUIコンポーネント向けの柔軟なキーバインドシステムは、以下の目的を持って設計されています：

- **入力とアクションの明確な分離**: キー入力の検出とアクションの実行を分離することで、責任の分離を実現し、コードの再利用性と保守性を向上させる
- **カスタマイズ性**: ユーザーやコンポーネントごとに異なるキーバインド設定を簡単に定義・変更できるようにする
- **拡張性**: 新しいアクションや入力方法を追加しやすい構造を提供する
- **テスト容易性**: キー入力とアクションの分離により、UI部分を実際に操作せずにキーバインド機能を単体でテストできるようにする

このキーバインドシステムは、TUIフレームワーク（Inkなど）上に構築されたコンポーネントにおいて、統一的なキーボード操作体験を提供します。特にキーボードを主な入力手段とするTUIアプリケーションでは、一貫性のある直感的な操作体験が重要です。

## 2. 基本原則

### 2.1 キーとアクションの分離

キーバインドシステムの中核となる原則は、「何が押されたか」と「何をするか」を明確に分離することです：

1. **キー入力（KeyInput）**: 物理的なキー入力を表現する値オブジェクト。修飾キー（Ctrl, Shift, Alt, Meta）との組み合わせも含む
2. **アクション（Action）**: 特定のドメイン操作を表す型。コンポーネント固有の操作（例：リスト内の移動、アイテムの選択）を表現

この分離により：
- 同じアクションに複数のキーバインドを割り当て可能
- コンポーネントはキー入力の詳細を知らずにアクションのみを処理可能
- キーバインドの変更がコンポーネントのロジックに影響しない

### 2.2 設定の柔軟性

キーバインド設定は以下の特性を持ちます：

1. **デフォルト設定**: 各コンポーネントは合理的なデフォルトのキーバインド設定を提供
2. **部分的な上書き**: ユーザーは特定のアクションに対するキーバインドのみを変更可能
3. **コンテキスト依存**: 必要に応じてアプリケーションの異なる部分で異なるキーバインドを使用可能
4. **プリセット**: 一般的なエディタ（Vim, Emacs）スタイルのキーバインドプリセットを提供

### 2.3 入力解釈の一貫性

キー入力の解釈は以下の原則に従います：

1. **正確なマッチング**: キーと修飾キーの組み合わせが完全に一致した場合のみアクションが実行される
2. **優先順位**: 複数のキーバインドが同じ入力に割り当てられている場合、定義順に評価され最初にマッチしたものが使用される
3. **透過性**: マッチするキーバインドがない場合、入力はキャプチャされず下位レイヤーに渡される

### 2.4 コンポーネント境界の考慮

キーバインドは以下のレベルで管理されます：

1. **コンポーネントレベル**: 各UIコンポーネントが自身の責任範囲内のアクションとキーバインドを定義
2. **アプリケーションレベル**: アプリケーション全体で共通するキーバインドを定義
3. **競合解決**: 入力フォーカスに基づいて、どのコンポーネントがキー入力を処理するかを決定

## 3. 型定義と主要インターフェース

### 3.1 KeyInput型

```typescript
/**
 * キー入力を表現する型
 * 物理的なキーボード入力と修飾キーの組み合わせを表現する
 */
type KeyInput = {
  // 一般的な文字キー
  key?: string;

  // 修飾キー
  meta?: boolean;  // Command (macOS) または Windows キー
  ctrl?: boolean;  // Control キー
  shift?: boolean; // Shift キー
  alt?: boolean;   // Alt キー

  // 特殊キー
  return?: boolean;    // Enter/Return キー
  escape?: boolean;    // Escape キー
  space?: boolean;     // スペースキー

  // 矢印キー
  upArrow?: boolean;
  downArrow?: boolean;
  leftArrow?: boolean;
  rightArrow?: boolean;
};
```

### 3.2 アクション型

```typescript
/**
 * コンポーネント固有のアクションを表す型
 * タスクリストの例
 */
type TaskListAction =
  | 'moveUp'        // リスト内で上に移動
  | 'moveDown'      // リスト内で下に移動
  | 'selectTask'    // タスクを選択
  | 'expandTask'    // タスクの詳細を展開
  | 'collapseTask'  // タスクの詳細を折りたたむ
  | 'togglePriority' // タスクの優先度を切り替え
  | 'toggleStatus'; // タスクのステータスを切り替え
```

### 3.3 キーバインドハンドラーインターフェース

```typescript
/**
 * キーバインドハンドラーのインターフェース
 * キー入力をアクションに変換する責務を持つ
 */
interface KeyBindingHandler<TAction extends string = string> {
  /**
   * キー入力からアクションを特定する
   * @param input 入力文字（通常のキー入力）
   * @param key キー情報（特殊キーや修飾キーの情報を含む）
   * @returns マッチするアクションがあればそのアクション、なければnull
   */
  getAction(input: string, key: KeyInput): TAction | null;

  /**
   * キーバインド設定を更新する
   * @param newBindings 新しいキーバインド設定（部分的な更新も可能）
   */
  updateBindings(
    newBindings: Partial<Record<TAction, Array<Partial<KeyInput>>>>
  ): void;

  /**
   * 現在のキーバインド設定を取得する
   * @returns 現在のキーバインド設定
   */
  getBindings(): Record<TAction, Array<Partial<KeyInput>>>;
}
```

### 3.4 キーバインド設定型

```typescript
/**
 * キーバインド設定を表す型
 * アクションに対して複数のキーバインドを関連付けられる
 */
type KeyBindingConfig<TAction extends string = string> =
  Record<TAction, Array<Partial<KeyInput>>>;
```

## 4. 実装パターンと例

### 4.1 キーバインドハンドラー実装

```typescript
/**
 * キーバインドハンドラーを作成する関数
 * 特定のコンポーネント用のキーバインドハンドラーを生成する
 * @param initialBindings 初期キーバインド設定
 * @returns キーバインドハンドラーインスタンス
 */
function createKeyBindingHandler<TAction extends string>(
  initialBindings: Record<TAction, Array<Partial<KeyInput>>>
): KeyBindingHandler<TAction> {
  // 内部状態として安全にコピー
  let bindings: Record<TAction, Array<Partial<KeyInput>>> = { ...initialBindings };

  return {
    getAction(input: string, key: KeyInput): TAction | null {
      // すべてのアクションとそのキーバインドをチェック
      const entries = Object.entries(bindings) as [TAction, Array<Partial<KeyInput>>][];

      for (const [action, keyBindings] of entries) {
        // 各アクションに対して定義されたすべてのキーバインドをチェック
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
            return action;
          }
        }
      }
      // マッチするキーバインドが見つからなければnullを返す
      return null;
    },

    updateBindings(newBindings) {
      // 既存の設定を維持しつつ部分的に更新
      bindings = {
        ...bindings,
        ...newBindings as Record<TAction, Array<Partial<KeyInput>>>
      };
    },

    getBindings() {
      // 内部状態を直接返さず、コピーを返す
      return { ...bindings };
    }
  };
}
```

### 4.2 コンポーネントでの使用例

```typescript
// タスクリストのデフォルトキーバインド設定
const DEFAULT_TASK_LIST_BINDINGS: KeyBindingConfig<TaskListAction> = {
  moveUp: [{ upArrow: true }, { key: 'k' }],
  moveDown: [{ downArrow: true }, { key: 'j' }],
  selectTask: [{ return: true }, { space: true }],
  expandTask: [{ rightArrow: true }],
  collapseTask: [{ leftArrow: true }, { escape: true }],
  togglePriority: [{ key: 'p' }],
  toggleStatus: [{ key: 's' }]
};

// Reactコンポーネントでの使用例
function TaskList(props) {
  const {
    tasks,
    selectedTaskId,
    onSelectTask,
    keyBindings: customKeyBindings = {}
  } = props;

  // コンポーネント初期化時にキーバインドハンドラーを作成
  const [keyBindingHandler] = useState(() =>
    createKeyBindingHandler<TaskListAction>(DEFAULT_TASK_LIST_BINDINGS)
  );

  // カスタムキーバインドがある場合は適用
  useEffect(() => {
    if (Object.keys(customKeyBindings).length > 0) {
      keyBindingHandler.updateBindings(customKeyBindings);
    }
  }, [customKeyBindings, keyBindingHandler]);

  // キー入力に基づいてアクションを実行
  useInput((input, key) => {
    if (tasks.length === 0) return;

    const action = keyBindingHandler.getAction(input, key);
    if (!action) return;

    switch (action) {
      case 'moveUp': {
        const currentIndex = selectedTaskId
          ? tasks.findIndex(t => t.id === selectedTaskId)
          : 0;
        const prevIndex = Math.max(0, currentIndex - 1);
        if (prevIndex !== currentIndex) {
          onSelectTask(tasks[prevIndex].id);
        }
        break;
      }
      case 'moveDown': {
        const currentIndex = selectedTaskId
          ? tasks.findIndex(t => t.id === selectedTaskId)
          : 0;
        const nextIndex = Math.min(tasks.length - 1, currentIndex + 1);
        if (nextIndex !== currentIndex) {
          onSelectTask(tasks[nextIndex].id);
        }
        break;
      }
      case 'selectTask': {
        if (selectedTaskId) {
          onSelectTask(selectedTaskId);
        } else if (tasks.length > 0) {
          onSelectTask(tasks[0].id);
        }
        break;
      }
      // 他のアクションの処理...
    }
  });

  // コンポーネントのレンダリング...
}
```

### 4.3 設定のカスタマイズ例

```typescript
// VimスタイルのカスタムキーバインドプリセットをTaskListコンポーネントに適用
<TaskList
  tasks={tasks}
  selectedTaskId={selectedTask}
  onSelectTask={handleSelectTask}
  keyBindings={{
    moveUp: [{ key: 'k' }],
    moveDown: [{ key: 'j' }],
    expandTask: [{ key: 'l' }],
    collapseTask: [{ key: 'h' }],
    selectTask: [{ key: 'x' }]
  }}
/>

// Emacsスタイルのキーバインドプリセット
const EMACS_STYLE_BINDINGS: Partial<KeyBindingConfig<TaskListAction>> = {
  moveUp: [{ key: 'p', ctrl: true }],
  moveDown: [{ key: 'n', ctrl: true }],
  expandTask: [{ key: 'f', ctrl: true }],
  collapseTask: [{ key: 'b', ctrl: true }]
};
```

## 5. ユースケース例

### 5.1 タスクリストナビゲーション

タスクリストコンポーネントでは、キーバインドを使用して以下の操作が可能です：

- 上下キーまたはj/kキーでタスク間を移動
- Enterキーまたはスペースキーでタスクを選択
- 右矢印キーでタスクの詳細を展開
- 左矢印キーまたはEscキーでタスクの詳細を折りたたむ
- pキーでタスクの優先度を切り替え
- sキーでタスクのステータスを切り替え

### 5.2 フォーム入力

フォームコンポーネントでは、異なるキーバインドセットで以下の操作をサポート：

- TabとShift+Tabでフィールド間を移動
- Enterキーでフォーム送信
- Escキーでフォームをキャンセル
- Ctrl+Sでフォームを保存

### 5.3 モーダルダイアログ

モーダルダイアログでは：

- Escキーでダイアログを閉じる
- Enterキーで主要アクションを実行
- Tabキーでフォーカスを移動

### 5.4 アプリケーション全体のショートカット

アプリケーション全体では：

- Ctrl+Nで新規タスク作成
- Ctrl+Fで検索
- F1でヘルプ表示
- Ctrl+Qでアプリケーション終了

## 6. テスト戦略

### 6.1 ユニットテスト

キーバインドハンドラーのユニットテストでは以下をテスト：

```typescript
describe('KeyBindingHandler', () => {
  let handler: KeyBindingHandler<TaskListAction>;

  beforeEach(() => {
    handler = createKeyBindingHandler(DEFAULT_TASK_LIST_BINDINGS);
  });

  describe('デフォルトキーバインド', () => {
    it('矢印キー（上）で「moveUp」アクションを返すこと', () => {
      const action = handler.getAction('', { upArrow: true });
      expect(action).toBe('moveUp');
    });

    it('「k」キーで「moveUp」アクションを返すこと', () => {
      const action = handler.getAction('k', { key: 'k' });
      expect(action).toBe('moveUp');
    });

    // 他のデフォルトキーバインドテスト...
  });

  describe('カスタムキーバインド', () => {
    it('カスタム設定で「moveUp」を「i」キーに変更できること', () => {
      handler.updateBindings({
        moveUp: [{ key: 'i' }]
      });

      const action = handler.getAction('i', { key: 'i' });
      expect(action).toBe('moveUp');
    });

    it('一部のキーバインドだけを更新しても既存の設定が維持されること', () => {
      handler.updateBindings({
        moveUp: [{ key: 'i' }]
      });

      const action = handler.getAction('j', { key: 'j' });
      expect(action).toBe('moveDown');
    });
  });

  describe('複合キー', () => {
    it('Ctrl+Nで「moveDown」アクションを設定できること', () => {
      handler.updateBindings({
        moveDown: [{ key: 'n', ctrl: true }]
      });

      const action = handler.getAction('n', { key: 'n', ctrl: true });
      expect(action).toBe('moveDown');
    });

    // 他の複合キーテスト...
  });

  describe('エッジケース', () => {
    it('未定義のキー入力の場合はnullを返すこと', () => {
      const action = handler.getAction('x', { key: 'x' });
      expect(action).toBeNull();
    });

    it('複数の設定が一致する場合、最初に一致したものを優先すること', () => {
      handler.updateBindings({
        moveUp: [{ key: 'x' }],
        moveDown: [{ key: 'x' }]  // こちらは後から設定
      });

      const action = handler.getAction('x', { key: 'x' });
      expect(action).toBe('moveUp');
    });
  });
});
```

### 6.2 統合テスト

コンポーネントとキーバインドの統合テスト：

```typescript
describe('TaskList キーボード操作', () => {
  let onSelectTaskMock: jest.Mock;

  beforeEach(() => {
    onSelectTaskMock = jest.fn();
  });

  it('上矢印キーで前のタスクを選択できること', async () => {
    // 2番目のタスクが選択された状態で開始
    const selectedId = mockTasks[1].id;
    const { stdin, waitForUpdate } = renderInk(
      <TaskList
        tasks={mockTasks}
        selectedTaskId={selectedId}
        onSelectTask={onSelectTaskMock}
      />
    );

    // 上矢印キーを押す
    pressKey(stdin, keys.up);
    await waitForUpdate();

    // 前のタスク（1番目）が選択される
    expect(onSelectTaskMock).toHaveBeenCalledWith(mockTasks[0].id);
  });

  // 他の統合テスト...
});
```

### 6.3 スナップショットテスト

コンポーネントの選択状態の視覚的な変化をテスト：

```typescript
it('キー操作による選択状態の変化が正しくレンダリングされること', async () => {
  const { stdin, waitForUpdate, lastFrame } = renderInk(
    <TaskList
      tasks={mockTasks}
      selectedTaskId={mockTasks[0].id}
      onSelectTask={(id) => {
        // 選択状態を更新するモック実装
        rerender(
          <TaskList
            tasks={mockTasks}
            selectedTaskId={id}
            onSelectTask={jest.fn()}
          />
        );
      }}
    />
  );

  // 初期状態のスナップショット
  expect(lastFrame()).toMatchSnapshot('初期状態');

  // 下矢印キーを押す
  pressKey(stdin, keys.down);
  await waitForUpdate();

  // 2番目のタスクが選択された状態のスナップショット
  expect(lastFrame()).toMatchSnapshot('2番目のタスク選択状態');
});
```

### 6.4 モック戦略

テスト実行時には以下の要素をモック化：

1. **キー入力**: InkのuseInput関数とキー入力をモックし、プログラムによるキー入力をシミュレート
2. **コールバック関数**: onSelectTaskなどのコールバック関数をモックし、正しい引数で呼び出されるか検証
3. **タスクデータ**: 一貫したテストデータで予測可能な結果を確保

```typescript
// キー入力モックのヘルパー
function pressKey(stdin: any, key: string | Record<string, boolean>) {
  if (typeof key === 'string') {
    stdin.write(key);
  } else {
    // 特殊キーのシミュレーション
    stdin.emit('keypress', '', key);
  }
}
```

## 関連ドキュメント

- [TUIコンポーネント設計ガイドライン](../ui-component-design.md)
- [テスト命名規則](../code-quality/test-naming-convention.md)
- [ユーザー入力ハンドリングの原則](../event-handling-principles.md)

## 関連コード

- `src/ui/input/key-binding-handler.ts` - キーバインドハンドラー実装
- `src/ui/components/TaskList.tsx` - キーバインドを使用するコンポーネント例

## 今後の展望

1. **グローバルキーバインド管理**: アプリケーション全体でのキーバインド競合解決メカニズムの導入
2. **キーバインド永続化**: ユーザーカスタマイズしたキーバインドの保存と復元
3. **キーシーケンスサポート**: Vimスタイルのマルチキーシーケンス（例: `gg`でリストの先頭に移動）のサポート
4. **ユーザー設定UI**: キーバインドをカスタマイズするための設定画面の提供