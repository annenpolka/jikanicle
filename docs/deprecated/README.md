# Deprecated Documentation

## 概要

このディレクトリには、jicanicleプロジェクトの旧設計アプローチに基づくドキュメントが含まれています。これらのドキュメントは2025年3月10日に行われたリブート検討の結果、DDDアプローチから軽量進化型アプローチへの移行に伴いdeprecatedとなりました。

## 背景

旧アプローチ（DDD中心）では以下の技術的課題が発生していました：

1. TUIのテスト困難性
2. Reactの複雑なコンテキスト依存
3. 過度に複雑化したアーキテクチャ

これらの課題を解決するため、より軽量で段階的な進化が可能なアプローチに移行することになりました。

## 新しいアプローチ

新しいアプローチに関するドキュメントは以下のファイルを参照してください：

- [核となる機能要件分析](../project/tasks/core-requirements-analysis.md)
- [核となる機能要件・仕様](../project/tasks/core-features-requirements.md)
- [軽量進化型アプローチの提案](../project/tasks/lightweight-evolution-approach.md)
- [アーキテクチャ再設計提案](../project/tasks/architecture-redesign-proposal.md)
- [リブート実装計画](../project/tasks/conclusion-implementation-plan.md)
- [リブート分析概要](../project/tasks/reboot-analysis-summary.md)

## ディレクトリ構造

```
docs/deprecated/
├── architecture/       # 旧アーキテクチャの設計ドキュメント
├── design/             # 旧設計ドキュメント
├── domain/             # 旧ドメインモデルの詳細設計
└── guidelines/         # 旧実装ガイドライン
```

## 注意

このディレクトリ内のドキュメントは参照のためだけに残されています。新しい実装やドキュメント作成には、上記の新しいアプローチに関するドキュメントを参照してください。