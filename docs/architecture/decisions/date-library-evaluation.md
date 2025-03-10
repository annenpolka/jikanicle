# 日付ライブラリ評価ドキュメント

## 1. 背景と目的

タスク管理アプリケーションの開発において、日付操作はコアな機能の一つです。現在のプロジェクトではネイティブの `Date` オブジェクトを使用していますが、より高度な日付操作や国際化対応などの要件に対応するため、専用の日付ライブラリ導入を検討します。

本ドキュメントでは以下の目的で調査を行いました：
- 現在の日付処理方法の整理
- 主要な日付ライブラリの評価
- DDDとの親和性分析
- プロジェクトに最適なライブラリの提案

## 2. 現状の日付処理方法

現在のプロジェクトでは、以下のように日付を扱っています：

1. **ネイティブDateオブジェクトの使用**
   - タスクモデルでは `Date` 型を使用（`createdAt`, `updatedAt`, `completedAt`）
   - ファクトリ関数で `new Date()` により現在時刻を取得
   ```typescript
   // src/domain/factories/task-factory.ts
   const now = new Date();
   const task: Task = {
     // ...
     createdAt: validParams.createdAt ?? now,
     updatedAt: now,
     // ...
   };
   ```

2. **更新処理における不変性の確保**
   ```typescript
   // src/domain/factories/update-task.ts
   function handleStatusTransition(
     currentStatus: Readonly<Task['status']>,
     newStatus: Readonly<Task['status'] | undefined>,
     currentCompletedAt?: Readonly<Date>
   ): { readonly completedAt?: Date } {
     // 日付の場合は新しいオブジェクトを返して不変性を保つ
     return {
       completedAt: currentCompletedAt ? new Date(currentCompletedAt.getTime()) : undefined
     };
   }
   ```

3. **完了日時のセット**
   ```typescript
   // 完了状態への変更時
   if (newStatus === 'COMPLETED') {
     return { completedAt: new Date() };
   }
   ```

**課題点**：
- ネイティブDateオブジェクトの可変性（ミュータブル）
- 限定的な操作機能（日付計算、比較、フォーマット等）
- 国際化対応の複雑さ
- タイムゾーン処理の欠如

## 3. 調査対象ライブラリ

以下の主要な日付操作ライブラリを調査対象としました：

- **date-fns**: 関数型アプローチの日付ライブラリ
- **Luxon**: Moment.jsの後継と位置づけられる、モダンな日付/時刻ライブラリ
- **Day.js**: 超軽量のMoment.js互換ライブラリ
- **Moment.js**: レガシーな日付ライブラリ（非推奨）

## 4. 各ライブラリの評価

### 4.1 date-fns

**長所**:
- **モジュラー設計**: 必要な関数のみインポート可能でtree-shakingに対応
  ```typescript
  import { addDays, format } from 'date-fns';
  const nextWeek = addDays(new Date(), 7);
  format(nextWeek, 'yyyy-MM-dd');
  ```
- **関数型API**: 純粋関数のアプローチでDDDの値オブジェクト実装との親和性が高い
- **ネイティブDateオブジェクト**: 既存コードとの互換性維持が容易
- **計算処理の高速性**: 日付計算のパフォーマンスが優れている
- **適切なバンドルサイズ**: 約18KB（必要な関数のみインポート時はさらに小さく）

**短所**:
- **タイムゾーン処理**: 別パッケージ（date-fns-tz）が必要
- **フォーマット性能**: Day.jsと比較して劣る
- **Dateオブジェクトの可変性**: 元のDateオブジェクトが変更される可能性

### 4.2 Luxon

**長所**:
- **不変性**: すべてのメソッドが新しいインスタンスを返す
  ```typescript
  import { DateTime } from 'luxon';
  const now = DateTime.now();
  const tomorrow = now.plus({ days: 1 });  // nowは変更されない
  ```
- **タイムゾーン対応**: ネイティブなタイムゾーンサポート
- **多機能**: 期間、インターバル、ロケール対応など豊富な機能
- **ISO 8601準拠**: 日付表現の標準規格に完全準拠

**短所**:
- **バンドルサイズ**: やや大きめ（約20KB）
- **学習曲線**: APIの習得に時間がかかる
- **オブジェクト指向API**: 現在の関数型アプローチと若干の不一致

### 4.3 Day.js

**長所**:
- **超軽量**: コア部分は約2KB
- **高速フォーマット**: 日付フォーマット処理が非常に高速
- **不変性**: 日付操作が元のオブジェクトを変更しない
- **Moment.js互換API**: 移行が容易

**短所**:
- **プラグイン依存**: 多くの機能がプラグインとして分離
- **限定的な機能**: 高度な機能が少ない
- **TypeScript対応**: 他と比較してやや弱い

### 4.4 Moment.js（非推奨）

**長所**:
- **広範なエコシステム**: 多数のプラグインや資料
- **簡易パース**: 日付パースが寛容

**短所**:
- **非推奨**: 新規プロジェクトでは推奨されない
- **可変API**: 値オブジェクトとして不適切
- **大きなバンドルサイズ**: 約232KB

## 5. DDDとの親和性分析

DDDにおいて日付は典型的な値オブジェクトであり、以下の観点から評価しました：

1. **不変性**: Luxonとday.jsが最適、date-fnsは関数自体は純粋だがDateオブジェクトに注意
2. **値オブジェクトの表現**:
   ```typescript
   // 例：date-fnsを使用した値オブジェクト
   export class TaskDate {
     private readonly _value: Date;

     private constructor(date: Date) {
       this._value = new Date(date.getTime()); // 防御的コピー
     }

     static create(date: Date): TaskDate {
       return new TaskDate(date);
     }

     static now(): TaskDate {
       return new TaskDate(new Date());
     }

     addDays(days: number): TaskDate {
       return new TaskDate(addDays(this._value, days));
     }

     format(pattern: string): string {
       return format(this._value, pattern);
     }

     toDate(): Date {
       return new Date(this._value.getTime());
     }
   }
   ```

3. **テスト容易性**: いずれもモック可能だが、date-fnsの関数ベースアプローチが最も容易
4. **ドメインロジックの表現**: Luxonがインターバル等の機能が豊富で優位

## 6. 推奨事項

### 6.1 推奨ライブラリ

**第一候補: date-fns**
- 関数型プログラミングの原則と一致
- モジュラー構造でバンドルサイズ最適化
- 既存のDateオブジェクト使用からの移行が容易

**代替候補: Luxon**
- タイムゾーン処理が重要になる場合
- より堅牢な不変性が必要な場合
- より豊富なドメインモデリング機能が必要な場合

### 6.2 実装アプローチ

1. **日付操作の抽象化**:
   ```typescript
   // src/domain/value-objects/task-date.ts
   export interface DateService {
     now(): Date;
     addDays(date: Date, days: number): Date;
     format(date: Date, pattern: string): string;
     isBefore(date1: Date, date2: Date): boolean;
   }

   // src/infrastructure/services/date-fns-adapter.ts
   import { addDays, format, isBefore } from 'date-fns';

   export function createDateService(): DateService {
     return {
       now: () => new Date(),
       addDays: (date, days) => addDays(date, days),
       format: (date, pattern) => format(date, pattern),
       isBefore: (date1, date2) => isBefore(date1, date2)
     };
   }
   ```

2. **値オブジェクトとしての日付型の定義**:
   ```typescript
   // src/domain/value-objects/task-date.ts
   export class TaskDate {
     private constructor(private readonly _value: Date) {}

     static create(date: Date | string): TaskDate {
       return new TaskDate(date instanceof Date ? new Date(date.getTime()) : new Date(date));
     }

     static now(dateService: DateService): TaskDate {
       return new TaskDate(dateService.now());
     }

     equals(other: TaskDate): boolean {
       return this._value.getTime() === other._value.getTime();
     }

     toDate(): Date {
       return new Date(this._value.getTime());
     }
   }
   ```

3. **テスト容易性の確保**:
   ```typescript
   // test/infrastructure/services/mock-date-service.ts
   export function createMockDateService(fixedDate: Date): DateService {
     return {
       now: () => new Date(fixedDate.getTime()),
       addDays: (date, days) => {
         const result = new Date(date.getTime());
         result.setDate(result.getDate() + days);
         return result;
       },
       format: () => "2025-03-10",
       isBefore: (date1, date2) => date1.getTime() < date2.getTime()
     };
   }
   ```

## 7. 次のステップ

1. 小規模な実験的実装で検証（TaskDateの実装など）
2. 既存の日付処理を徐々にリファクタリング
3. 複雑な日付ロジック（繰り返しタスク、期間計算など）が必要になる段階でdate-fnsを導入

## 8. ロードマップとの統合

プロジェクトのロードマップ（`docs/project/roadmap.md`）を確認し、日付ライブラリの導入計画を以下のように策定します：

1. **フェーズ1（基本インフラの構築）**
   - ドメインモデルにおける日付処理は引き続きネイティブDateオブジェクトを使用
   - 一貫性のある日付操作のためのヘルパー関数の作成（防御的コピー、フォーマットなど）

2. **フェーズ2（コア機能の実装）の準備段階**
   - タイムブロッキングとタイムトラッキング機能に先立ち、date-fnsの導入
   - DateServiceインターフェースと実装の作成
   - 既存のDate型使用箇所のリファクタリング方針の策定

3. **フェーズ2（コア機能の実装）**
   - タイムブロッキング機能実装時にDateServiceの活用
   - 期間計算、重複チェックなどの日付関連ドメインロジックの実装
   - タイムトラッキング機能での経過時間計算や表示フォーマットの実装

4. **フェーズ3以降**
   - より高度な日付処理（繰り返しパターン、カレンダーとの同期など）の必要性に応じて機能拡張
   - 国際化対応が必要になった場合のロケール対応

## 9. 結論

現時点では標準のDateオブジェクトで対応できていますが、将来的な拡張性を考慮すると、date-fnsの導入が最適です。DDDの原則に従い、値オブジェクトによるカプセル化と、外部依存の抽象化を行うことで、将来的な変更にも柔軟に対応できる設計を目指します。