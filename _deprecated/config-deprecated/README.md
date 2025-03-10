# Deprecated Configuration Files

## 概要

このディレクトリには、jicanicleプロジェクトの旧設計アプローチに基づく設定ファイルが含まれています。これらの設定ファイルは2025年3月10日に行われたリブート検討の結果、DDDアプローチから軽量進化型アプローチへの移行に伴いdeprecatedとなりました。

## 含まれるファイル

- `babel.config.json` - Babel設定ファイル
- `eslint.config.mjs` - ESLint設定ファイル
- `jikanicle.config.json` - jicanicleアプリケーション設定
- `package.json` / `package-lock.json` / `pnpm-lock.yaml` - パッケージ管理ファイル
- `tsconfig.json` - TypeScript設定
- `vitest.config.ts` - Vitest（テストランナー）設定

## 注意

これらの設定ファイルは参照のためだけに残されています。新しい実装では、機能指向アーキテクチャに基づく新しい構成ファイルを作成していく予定です。

新しいアプローチについては、以下のドキュメントを参照してください：

- [リブート実装計画](../docs/project/tasks/conclusion-implementation-plan.md)
- [軽量進化型アプローチの提案](../docs/project/tasks/lightweight-evolution-approach.md)