# ES Modules 移行

## 概要

jikanicleプロジェクトをCommonJSからES Modules（ESM）形式に移行する作業の詳細を記録します。

## 背景

現在のプロジェクトはCommonJS形式（`"type": "commonjs"`）で設定されていますが、モダンなJavaScript/TypeScriptプロジェクトではES Modulesが標準となっています。ESMへの移行により以下のメリットが得られます：

- トップレベルawait対応
- 静的解析の強化
- モジュールのツリーシェイキングの改善
- 将来的なJavaScript機能との互換性確保

## 移行内容

以下の変更を実施します：

1. **package.jsonの修正**
   - `"type": "commonjs"` → `"type": "module"` に変更

2. **import/export文の修正**
   - 相対パスのインポート時に `.js` 拡張子を明示的に指定
   - 例: `import { Task } from '../types/Task';` → `import { Task } from '../types/Task.js';`

3. **テスト対応**
   - Vitestの設定確認と必要に応じた修正

## 注意点

- TypeScriptはトランスパイル時に拡張子を `.js` に変換するため、ソースコード内では `.ts` ではなく `.js` で記述する
- CommonJSの動的インポート（`require()`）を使用している箇所はESMの動的インポート（`import()`）に置き換える
- パスエイリアス（`"paths"`）を使用している場合は注意が必要

## 移行手順

1. package.jsonの修正
2. ソースコードの相対パスインポート修正
3. テストケースの修正
4. ビルドとテストの実行確認

## 影響範囲

- すべてのTypeScriptソースファイル（`src/` 配下）
- すべてのテストファイル（`test/` 配下）
- 設定ファイル（`tsconfig.json`, `vitest.config.ts`など）

## 参考資料

- [Node.js ESM documentation](https://nodejs.org/api/esm.html)
- [TypeScript ESM Support](https://www.typescriptlang.org/docs/handbook/esm-node.html)