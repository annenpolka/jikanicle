# 設定ファイルとリポジトリ実装（旧: リポジトリスイッチャー）

## 概要

lilconfigを使用して設定ファイルを読み書きできるようにしました。
リポジトリタイプの切り替え機能は廃止され、常にファイルベースのリポジトリのみを使用します。
インメモリリポジトリは実装としては残っていますが、テスト用途のみに使用されます。

## 実装内容

### 1. 設定ファイル関連の機能

- `config-loader.ts`: lilconfigを使用して設定ファイルを読み込む機能
- `config-saver.ts`: 設定をファイルに保存する機能
- `useConfigStore.ts`: フックとしての設定の状態管理と操作機能

## 設定ファイルの仕様

以下の形式とパスをサポートしています：

```
jikanicle.config.js
jikanicle.config.json
.jikaniclerc
.jikaniclerc.json
package.json (jikanicleキー)
```

### 設定の例

```json
{
  "appName": "jikanicle",
  "repository": {
    "dataDirectory": "./data",
    "fileExtension": ".json"
  },
  "ui": {
    "theme": {
      "primaryColor": "blue",
      "secondaryColor": "white"
    }
  }
}
```

## 使用方法

### 設定の読み込み

```typescript
import { useConfigStore } from '../hooks/useConfigStore';

function MyComponent() {
  const { config, loadConfig } = useConfigStore();

  // 設定の読み込み
  useEffect(() => {
    void loadConfig();
  }, [loadConfig]);

  // 設定の利用
  return <div>アプリ名: {config.appName}</div>;
}
```

## 技術的な特徴

1. **DDD原則の適用**
   - 設定管理をドメインとしてモデル化
   - バウンデッドコンテキストの明確化

2. **関数型プログラミングアプローチ**
   - Result型によるエラー処理
   - 純粋関数の活用

3. **テスト駆動開発**
   - モック化によるテストの分離

4. **クリーンアーキテクチャ**
   - インフラストラクチャ層とUI層の分離
   - 依存性の方向を内側に向ける