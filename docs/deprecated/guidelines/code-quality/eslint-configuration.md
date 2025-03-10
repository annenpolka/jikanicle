# リンター設定ドキュメント

## 概要

このプロジェクトでは、コード品質と一貫性を確保するためにESLintを使用しています。このドキュメントでは、プロジェクトで採用しているリンタールールとその設定について詳細に説明します。各ルールの目的と効果を理解することで、高品質なコードを一貫して作成できるようになります。

## ESLint設定の基本構造

`eslint.config.mjs`ファイルでは、フラットな設定形式を採用し、以下のようなセクションに分けて設定を管理しています：

1. 基本設定（無視ファイル、言語オプションなど）
2. TypeScript固有のルール
3. 関数型プログラミングのルール
4. インポート関連のルール
5. JSDocコメント関連のルール
6. テストファイル用の特別設定

この構造により、各カテゴリのルールを明確に分離し、必要に応じて調整しやすくなっています。

## 各ルールセットの詳細説明

### TypeScript固有のルール

#### 型安全性の向上

##### `@typescript-eslint/explicit-function-return-type`
- **説明**: 関数の戻り値の型を明示的に定義することを要求します
- **目的**: コードの意図を明確にし、型の不一致によるバグを防止します
- **効果**: 関数の使用者が戻り値の型を推測する必要がなくなり、誤用を防ぎます
- **設定**: 式や型付き関数式では許容されます
- **例**:
  ```typescript
  // 良い例
  function add(a: number, b: number): number {
    return a + b;
  }

  // 悪い例
  function subtract(a: number, b: number) {
    return a - b;
  }
  ```

##### `@typescript-eslint/no-explicit-any`
- **説明**: `any`型の使用を禁止します
- **目的**: TypeScriptの型安全性を最大限に活用するため
- **効果**: 型の不明確さによるバグを減らし、コードの信頼性を向上させます
- **例**:
  ```typescript
  // 良い例
  function processData(data: unknown): string {
    if (typeof data === 'string') {
      return data.toUpperCase();
    }
    return String(data);
  }

  // 悪い例
  function processData(data: any): string {
    return data.toUpperCase(); // 実行時エラーの可能性あり
  }
  ```

##### `@typescript-eslint/no-unsafe-assignment`, `@typescript-eslint/no-unsafe-call`, `@typescript-eslint/no-unsafe-member-access`, `@typescript-eslint/no-unsafe-return`
- **説明**: 型安全でない操作（代入、呼び出し、メンバーアクセス、戻り値）を禁止します
- **目的**: 実行時エラーを防ぎ、型システムの恩恵を最大化します
- **効果**: `any`型から派生する型安全でない操作を検出し、バグを未然に防ぎます
- **例**:
  ```typescript
  // 悪い例（これらはエラーになります）
  const data: any = getExternalData();
  const value = data.value; // unsafe member access
  const result = data.process(); // unsafe call
  return data; // unsafe return
  ```

##### `@typescript-eslint/strict-boolean-expressions`
- **説明**: ブール式で厳格な型チェックを要求します
- **目的**: 暗黙的な型変換によるバグを防止します
- **効果**: `null`、`undefined`、空文字列などが意図せずブール値として扱われることを防ぎます
- **例**:
  ```typescript
  // 良い例
  if (value !== undefined && value !== null) {
    // 処理
  }

  // 悪い例
  if (value) { // valueがfalsy値の場合に問題が発生する可能性
    // 処理
  }
  ```

##### `@typescript-eslint/no-floating-promises`
- **説明**: Promiseの結果を処理せずに放置することを禁止します
- **目的**: 非同期処理のエラーハンドリングを確実に行うため
- **効果**: 未処理のPromiseによるバグや例外の見落としを防ぎます
- **例**:
  ```typescript
  // 良い例
  async function example(): Promise<void> {
    await asyncOperation();
    // または
    asyncOperation().catch(handleError);
  }

  // 悪い例
  async function example(): Promise<void> {
    asyncOperation(); // 結果が処理されていない
  }
  ```

##### `@typescript-eslint/no-unnecessary-condition`
- **説明**: 常に真または偽になる条件式を禁止します
- **目的**: 冗長なコードや論理的なバグを防止します
- **効果**: 型情報から不要な条件式を検出し、コードの明確さを向上させます
- **例**:
  ```typescript
  // 悪い例
  const value: string = "test";
  if (value) { // stringは常にtruthyなので不要
    console.log(value);
  }
  ```

##### `@typescript-eslint/prefer-nullish-coalescing`
- **説明**: 論理OR演算子（`||`）の代わりにnullish coalescing演算子（`??`）の使用を推奨します
- **目的**: `null`と`undefined`のみをチェックし、他のfalsy値（`0`、`''`など）を有効な値として扱います
- **効果**: より正確な条件分岐が可能になり、意図しない動作を防ぎます
- **例**:
  ```typescript
  // 良い例
  const result = value ?? defaultValue;

  // 悪い例
  const result = value || defaultValue; // 0や空文字列も置き換えられてしまう
  ```

##### `@typescript-eslint/prefer-optional-chain`
- **説明**: 連続した条件チェックの代わりにオプショナルチェーン（`?.`）の使用を推奨します
- **目的**: コードを簡潔にし、可読性を向上させます
- **効果**: ネストされたプロパティアクセスを安全かつ簡潔に記述できます
- **例**:
  ```typescript
  // 良い例
  const name = user?.profile?.name;

  // 悪い例
  const name = user && user.profile && user.profile.name;
  ```

#### 型定義の品質向上

##### `@typescript-eslint/consistent-type-definitions`
- **説明**: 型定義に一貫したスタイル（`type`または`interface`）を使用することを要求します
- **目的**: コードベース全体で一貫した型定義スタイルを確保します
- **効果**: 型定義の読みやすさと一貫性が向上します
- **設定**: このプロジェクトでは`type`を優先しています
- **例**:
  ```typescript
  // 良い例（このプロジェクトの設定）
  type User = {
    id: string;
    name: string;
  };

  // 悪い例
  interface User {
    id: string;
    name: string;
  }
  ```

##### `@typescript-eslint/consistent-type-imports`
- **説明**: 型インポートに一貫したスタイルを使用することを要求します
- **目的**: 型インポートと値インポートを明確に区別します
- **効果**: バンドルサイズの最適化とコードの明確さが向上します
- **設定**: `type`キーワードを使用した型インポートを優先しています
- **例**:
  ```typescript
  // 良い例
  import type { User } from './types';

  // 悪い例
  import { User } from './types';
  ```

##### `@typescript-eslint/no-unused-vars`
- **説明**: 未使用の変数を禁止します
- **目的**: コードの整理整頓と潜在的なバグの防止
- **効果**: 不要なコードを削減し、メンテナンス性を向上させます
- **設定**: 先頭がアンダースコア（`_`）の引数は無視されます
- **例**:
  ```typescript
  // 良い例
  function calculate(a: number, _unused: number): number {
    return a * 2;
  }

  // 悪い例
  function calculate(a: number, unused: number): number {
    return a * 2; // unusedが使われていない
  }
  ```

##### `@typescript-eslint/naming-convention`
- **説明**: 命名規則を強制します
- **目的**: コードベース全体で一貫した命名スタイルを確保します
- **効果**: コードの可読性と理解しやすさが向上します
- **設定**:
  - 型名（interface, typeAlias, enum）: PascalCase
  - 変数名: camelCaseまたはUPPER_CASE
  - 関数名: camelCase
  - パラメータ名: camelCase（先頭のアンダースコアは許可）
  - プロパティ名: camelCaseまたはUPPER_CASE
  - メソッド名: camelCase
  - enumメンバー名: UPPER_CASE
- **例**:
  ```typescript
  // 良い例
  type UserData = {
    userId: string;
    MAXIMUM_ATTEMPTS: number;
  };

  function calculateTotal(amount: number, _tax?: number): number {
    const TAX_RATE = 0.1;
    return amount * (1 + TAX_RATE);
  }

  enum ResponseStatus {
    SUCCESS,
    ERROR,
    PENDING
  }
  ```

### 関数型プログラミングのルール

#### 不変性の確保

##### `functional/no-let`
- **説明**: `let`宣言の使用を禁止します
- **目的**: 変数の再代入を防止し、不変性を促進します
- **効果**: 副作用を減らし、コードの予測可能性を向上させます
- **例**:
  ```typescript
  // 良い例
  const result = values.map(v => v * 2);

  // 悪い例
  let result = [];
  for (const v of values) {
    result.push(v * 2);
  }
  ```

##### `functional/prefer-readonly-type`
- **説明**: 可能な限り`readonly`型の使用を推奨します
- **目的**: 不変のデータ構造を促進します
- **効果**: 意図しないデータ変更を防止し、副作用を減らします
- **例**:
  ```typescript
  // 良い例
  type User = {
    readonly id: string;
    readonly name: string;
  };

  // 悪い例
  type User = {
    id: string;
    name: string;
  };
  ```

##### `functional/immutable-data`
- **説明**: データの変更操作を禁止します
- **目的**: 不変性を確保し、副作用を減らします
- **効果**: 予測可能なコードと並行処理の安全性が向上します
- **例**:
  ```typescript
  // 良い例
  const newArray = [...array, newItem];
  const newObj = { ...obj, newProp: value };

  // 悪い例
  array.push(newItem);
  obj.newProp = value;
  ```

#### 純粋関数の促進

##### `functional/functional-parameters`
- **説明**: 関数パラメータに関するルールを設定します
- **目的**: 関数の引数の扱い方を制限し、純粋関数を促進します
- **効果**: 副作用を減らし、関数の予測可能性を向上させます
- **設定**: レストパラメータは許可、`arguments`キーワードは禁止
- **例**:
  ```typescript
  // 良い例
  function sum(...numbers: number[]): number {
    return numbers.reduce((total, n) => total + n, 0);
  }

  // 悪い例
  function sum(): number {
    let total = 0;
    for (let i = 0; i < arguments.length; i++) {
      total += arguments[i];
    }
    return total;
  }
  ```

##### `functional/no-throw-statements`
- **説明**: 例外のスローを制限します
- **目的**: 例外による制御フローの中断を防止します
- **効果**: より予測可能なエラー処理が可能になります
- **設定**: Promiseのリジェクトは許可されています
- **例**:
  ```typescript
  // 良い例
  function divide(a: number, b: number): Result<number, Error> {
    if (b === 0) {
      return err(new Error("Division by zero"));
    }
    return ok(a / b);
  }

  // 悪い例
  function divide(a: number, b: number): number {
    if (b === 0) {
      throw new Error("Division by zero");
    }
    return a / b;
  }
  ```

### インポート関連のルール

##### `import/no-cycle`
- **説明**: 循環参照（循環インポート）を禁止します
- **目的**: 依存関係の複雑さを減らし、初期化の問題を防止します
- **効果**: コードの構造が明確になり、バンドルサイズの最適化が可能になります
- **例**:
  ```typescript
  // ファイルA.ts
  import { funcB } from './B'; // 循環参照になる可能性
  export function funcA(): void {
    funcB();
  }

  // ファイルB.ts
  import { funcA } from './A'; // 循環参照
  export function funcB(): void {
    funcA();
  }
  ```

##### `import/no-self-import`
- **説明**: 自己インポート（同じファイルからのインポート）を禁止します
- **目的**: 無意味なインポートを防止します
- **効果**: コードの明確さとバンドルの最適化が向上します
- **例**:
  ```typescript
  // 悪い例（user.ts内）
  import { User } from './user'; // 自己インポート
  ```

##### `import/no-useless-path-segments`
- **説明**: 不要なパスセグメント（`./`や`../`など）を禁止します
- **目的**: インポートパスを簡潔にします
- **効果**: コードの可読性とメンテナンス性が向上します
- **例**:
  ```typescript
  // 良い例
  import { User } from '../types';

  // 悪い例
  import { User } from './../types';
  ```

##### `import/order`
- **説明**: インポート文の順序を強制します
- **目的**: インポート文を整理し、一貫性を確保します
- **効果**: コードの可読性とメンテナンス性が向上します
- **設定**: 以下の順序でグループ化されます
  1. ビルトインモジュール
  2. 外部モジュール
  3. 内部モジュール
  4. 親ディレクトリからのインポート
  5. 同じディレクトリからのインポート
  6. インデックスファイルからのインポート
- **例**:
  ```typescript
  // 良い例
  import fs from 'fs'; // ビルトイン
  import { useState } from 'react'; // 外部
  import { AppConfig } from '@/config'; // 内部
  import { Parent } from '../parent'; // 親
  import { Sibling } from './sibling'; // 同じディレクトリ
  import { Index } from './'; // インデックス
  ```

### JSDocコメント関連のルール

##### `jsdoc/require-jsdoc`
- **説明**: 関数宣言とメソッド定義にJSDocコメントを要求します
- **目的**: コードの意図と使用方法を明確にドキュメント化します
- **効果**: コードの理解しやすさとメンテナンス性が向上します
- **設定**: 公開関数と公開メソッドのみが対象です
- **例**:
  ```typescript
  // 良い例
  /**
   * ユーザーの合計スコアを計算します
   * @param user ユーザーオブジェクト
   * @returns 合計スコア
   */
  function calculateTotalScore(user: User): number {
    return user.scores.reduce((total, score) => total + score, 0);
  }
  ```

##### `jsdoc/require-param`
- **説明**: JSDocコメントにパラメータの説明を要求します
- **目的**: 関数パラメータの目的と使用方法を明確にします
- **効果**: APIの使いやすさと理解しやすさが向上します
- **例**:
  ```typescript
  // 良い例
  /**
   * ユーザーの名前を更新します
   * @param userId ユーザーの一意識別子
   * @param newName 設定する新しい名前
   * @returns 更新が成功したかどうか
   */
  function updateUserName(userId: string, newName: string): boolean {
    // 実装
  }
  ```

##### `jsdoc/require-returns`
- **説明**: 値を返す関数のJSDocコメントに戻り値の説明を要求します
- **目的**: 関数の戻り値の意味と使用方法を明確にします
- **効果**: APIの使いやすさと理解しやすさが向上します
- **例**:
  ```typescript
  // 良い例
  /**
   * 2つの数値の合計を計算します
   * @param a 最初の数値
   * @param b 2番目の数値
   * @returns 2つの数値の合計
   */
  function add(a: number, b: number): number {
    return a + b;
  }
  ```

## テストファイル用の特別設定

テストファイルに対しては、開発効率とテストの柔軟性を確保するために、一部のルールを緩和しています：

### JSDocコメントの要求を無効化
- **目的**: テストコードの記述を効率化します
- **効果**: テストの記述に集中でき、開発速度が向上します
- **対象ルール**:
  - `jsdoc/require-jsdoc`
  - `jsdoc/require-param`
  - `jsdoc/require-returns`

### 関数型プログラミングのルールを一部緩和
- **目的**: テストコードでより柔軟な実装を可能にします
- **効果**: テストの記述が容易になり、様々なテストケースを効率的に実装できます
- **対象ルール**:
  - `functional/functional-parameters`

## ルールの適用方法と例外

ESLintルールは、コード品質を向上させるためのガイドラインですが、場合によっては例外が必要になることもあります。以下の方法で例外を処理できます：

### インラインでのルール無効化
特定の行や特定のブロックでルールを無効にする場合：

```typescript
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function processUnknownData(data: any): void {
  // 処理
}

/* eslint-disable functional/immutable-data */
function legacyFunction(): void {
  // 変更操作を含む処理
}
/* eslint-enable functional/immutable-data */
```

### ファイル単位でのルール調整
ファイルの先頭でルールを調整する場合：

```typescript
/* eslint-disable @typescript-eslint/no-explicit-any */
// このファイル全体でany型の使用が許可されます
```

### 設定ファイルでの例外定義
特定のファイルパターンに対してルールを調整する場合は、`eslint.config.mjs`ファイルで設定します：

```javascript
{
  files: ["legacy/**/*.ts"],
  rules: {
    "@typescript-eslint/no-explicit-any": "off"
  }
}
```

## 設定ファイルの管理方法

`eslint.config.mjs`ファイルは、プロジェクトのルート直下で管理されています。このファイルを変更する際は、以下の点に注意してください：

1. **変更の影響範囲を考慮する**: ルールの変更はプロジェクト全体に影響します
2. **チーム全体で合意を得る**: コーディング規約はチーム全体で共有されるべきです
3. **段階的に導入する**: 厳格なルールは段階的に導入し、既存コードの修正時間を確保します
4. **コメントで理由を説明する**: ルールの無効化や特殊な設定を行う場合は、その理由をコメントで説明します

## TypeScript設定との連携

ESLintはTypeScriptの型情報を活用するために、`tsconfig.json`と連携しています。これにより、型に基づいた高度なリンティングが可能になっています。

### 主要な連携ポイント

1. **パーサーオプション**: `project`パラメータで`tsconfig.json`を指定しています
   ```javascript
   const tsParserOptions = {
     project: ["./tsconfig.json"],
     tsconfigRootDir: ".",
     ecmaVersion: 2020
   };
   ```

2. **型情報を使用するルール**: 以下のルールは型情報を活用しています
   - `@typescript-eslint/no-unnecessary-condition`
   - `@typescript-eslint/no-floating-promises`
   - `@typescript-eslint/strict-boolean-expressions`
   - その他の型安全性に関するルール

3. **パフォーマンスの考慮**: 型情報を使用するルールは処理が重くなる可能性があるため、必要なものだけを有効にしています

## まとめ

このプロジェクトのESLint設定は、以下の目標を達成するために設計されています：

1. **型安全性の最大化**: TypeScriptの型システムを最大限に活用し、実行時エラーを防止します
2. **関数型プログラミングの促進**: 不変性と純粋関数を重視し、副作用を減らします
3. **コードの一貫性確保**: 命名規則やインポート順序などを統一し、可読性を向上させます
4. **ドキュメント化の促進**: JSDocコメントを通じて、コードの意図と使用方法を明確にします

これらのルールを遵守することで、より安全で保守しやすく、理解しやすいコードベースを維持することができます。