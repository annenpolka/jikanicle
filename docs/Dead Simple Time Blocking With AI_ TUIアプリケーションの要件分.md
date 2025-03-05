<img src="https://r2cdn.perplexity.ai/pplx-full-logo-primary-dark%402x.png" class="logo" width="120"/>

#

---

# Dead Simple Time Blocking With AI: TUI アプリケーションの要件分析

この分析では、「Dead Simple Time Blocking With AI」をテーマにした TUI アプリケーションの要件を整理しました。このアプリケーションは、ユーザーが入力したタスクに対して AI（大規模言語モデル）を活用し、タイムブロッキングとトラッキングを効率的に行うことを目的としています。AI はタスク自体の生成は行わず、所要時間の推測、カテゴリ分類、タイムブロック生成、実績データからの改善に集中します。簡潔な TUI インターフェースを通じて、ユーザーはタスク入力と時間計測という最小限の責務でタイムマネジメントを効率化できるでしょう。

## タイムブロッキングと AI の統合概念

タイムブロッキングは、一日の時間を特定のタスクに割り当てる時間管理手法よ。従来の ToDo 管理と異なり、タスクを完了するための「いつ」と「どのくらいの時間」を明確にすることで、より現実的な計画を立てられるわ。この手法はカレンダーベースで視覚的に時間を管理するため、過剰なタスク詰め込みを防ぎ、作業の優先順位付けを促進するのよ。

タイムブロッキングの主な課題は、各タスクにどれだけの時間を割り当てるかを正確に予測することね。ここで AI の活用が有効になるわ。大規模言語モデル（LLM）は、パターン認識と過去データからの学習に優れているから、時間予測の精度向上に貢献できるでしょう。ただし、AI にタスク自体の生成を任せることには問題があるわ。タスク生成は個人の目標や価値観と密接に関連しており、AI がこれを適切に判断するのは難しいからね。

AI とタイムブロッキングを組み合わせる際の重要な考え方は、AI を「アシスタント」として位置づけ、意思決定の主体はあくまでユーザーに残すことよ。AI は時間予測や分類などの計算的・分析的タスクを担当し、創造的・戦略的判断はユーザーに委ねるという役割分担が効果的でしょうね。このバランスが、シンプルながらも効果的なタイムマネジメントツールの鍵となるわ。

## 中核要件の詳細分析

### AI の役割と限界

このアプリケーションでは、AI の役割を明確に限定することが重要ね。ユーザーの要件に基づくと、AI にタスク自体の生成は任せないわ。これは賢明な判断よ。AI によるタスク生成は、ユーザーの具体的な状況や優先事項を完全に把握できないため、しばしば的外れな提案をしてしまうことがあるからね。

AI に担当させるべき機能は明確に定義されているわ。まず「所要時間の推測」ね。これは過去の類似タスクのデータや一般的なタスク完了時間の傾向から、必要時間を予測する機能よ。次に「タスクカテゴリの分類」、これはユーザーが入力したタスクを自動的に仕事、個人開発、家事などのカテゴリに分類することで、時間配分のバランスを可視化する助けになるわ。

「タイムブロックの生成」機能では、推定時間とカテゴリに基づいて、一日のスケジュール内にタスクを最適に配置するわ。これには休憩時間の挿入や、類似タスクのグループ化など、認知科学的知見を取り入れることも有効でしょうね。最後に「実績時間からの推測精度の向上」、これが AI の学習コンポーネントとして最も重要よ。実際にかかった時間と AI の予測との差異から学習し、次回からの予測精度を高めていく仕組みが必要ね。

### ユーザーとシステムの相互作用

アプリケーションの中心となるワークフローは、「思いついたタスクを放り込む → タイムブロックを見ながら作業する → 実績時間を記録して次の推測に使う」という流れね。この単純さがアプリケーションの強みになるわ。ユーザーの責務は「タスクを入力する」と「時間を計測する」という必要最小限に抑えられているから、継続的な利用が促進されるでしょう。

ユーザー入力に関しては、タスク名だけでなく、推定難易度や優先度などの簡易な追加情報をオプションで入力できると、AI の予測精度が向上するかもしれないわね。ただし、入力の手間が増えすぎると「Dead Simple」というコンセプトから外れてしまうから、バランスが重要よ。

時間計測機能はツールから直接提供されるべきね。外部ツールとの連携を必要とすると、ユーザー体験が分断されてしまうわ。TUI 内で簡単なキーコマンドで計測の開始・停止・一時停止ができれば理想的ね。例えば、「s」で開始、「p」で一時停止、「e」で終了などのシンプルなコマンドが考えられるわ。

## ユーザーエクスペリエンス設計

### TUI の特性を活かしたインターフェース

TUI（テキストユーザーインターフェース）の選択は、「Dead Simple」というコンセプトに非常に適しているわ。GUI と比較して、TUI は起動が速く、キーボードだけで操作できるため、作業の流れを中断せずにタイムマネジメントができるメリットがあるのよ。

効果的な TUI デザインには、いくつかの原則があるわね。まず、画面レイアウトは情報を明確に区分けし、視覚的な階層を作るべきよ。例えば、画面上部にはステータスバーや現在進行中のタスク情報、中央部にはタイムブロックの可視化、下部にはコマンドヘルプを配置するといった構成が考えられるわ。

キーボードショートカットは直感的かつ一貫性のあるものにする必要があるわ。よく使う機能には単一キー（t: タスク追加、b: ブロック表示切替、s: 開始、など）を割り当て、より複雑な機能には修飾キーと組み合わせた操作（Ctrl+E: エクスポートなど）を設定するといいでしょうね。

色使いも重要ね。TUI でも限定的なカラー表示は可能だから、タスクカテゴリごとに異なる色を割り当てたり、優先度による色分けを行ったりすることで、視覚的な情報伝達を強化できるわ。ただし、カラーブラインドのユーザーに配慮して、色以外の区別方法（シンボルや枠線のスタイル）も併用すべきでしょうね。

### データ入力と表示の最適化

「サクサクできる」という要件を満たすには、データ入力と表示の最適化が不可欠よ。タスク入力には、コマンドモードとフォームモードの二つのアプローチが考えられるわ。コマンドモードでは「add "会議資料の準備" 30m work」のような構文で素早く入力できる一方、フォームモードではフィールドごとにタブ移動しながら詳細情報を入力できるわね。両方のモードを状況に応じて切り替えられるとユーザビリティが向上するでしょう。

タイムブロックの表示方法としては、時系列表示（カレンダー風）と優先度表示（カンバン風）の二つが考えられるわ。時系列表示は一日の流れを把握するのに適しており、優先度表示は複数のタスクから次に取り組むべきものを選ぶのに役立つでしょうね。

実績トラッキングにおいては、現在進行中のタスクが常に目立つ位置に表示され、経過時間がリアルタイムで更新されるべきよ。また、タスク完了時には実際にかかった時間と予測時間の差異を簡潔にフィードバックすることで、ユーザーの時間感覚の向上も促進できるわ。

## 技術的実装戦略

### AI コンポーネントの設計

AI コンポーネントの実装には、いくつかのアプローチがあるわね。まず考慮すべきは、AI モデルをどこで動かすかという点よ。ローカル実行とクラウド API の両方の選択肢があるわ。

ローカル実行の場合、プライバシーが保護され、インターネット接続なしでも機能するメリットがあるわ。小規模な言語モデル（例：LLaMA、Alpaca、Mistral などの軽量バージョン）をローカルで動かすことで、基本的な時間推定や分類機能を実現できるでしょう。ただし、計算リソースが限られるため、精度や機能には制約が生じる可能性があるわね。

クラウド API 利用の場合は、GPT-4 や Claude-3 などの高性能モデルにアクセスできるため、より高度な推論や精度の高い予測が可能になるわ。ただし、プライバシーの懸念、API 使用料、インターネット接続への依存といった課題もあるわね。

ハイブリッドアプローチとして、基本的な機能はローカルモデルで処理し、より複雑な分析が必要な場合のみクラウド API を利用する設計も考えられるわ。これにより、プライバシーと高性能のバランスを取ることができるでしょうね。

### データ構造とストレージ

効率的なデータ管理のために、適切なデータ構造とストレージ方法を設計する必要があるわ。タスクデータは、少なくとも以下の情報を含むべきよ：

- タスク ID（一意の識別子）
- タスク名
- 予測所要時間
- 実際の所要時間（完了後）
- カテゴリ
- 作成日時
- 完了日時
- 状態（未開始、進行中、完了、延期など）

データストレージとしては、単純な JSON ファイルから始めるのが「Dead Simple」の精神に合っているわね。複雑なデータベースセットアップは避け、フラットファイル構造でシンプルに保つべきでしょう。ただし、データの成長に伴って、SQLite のような軽量データベースへの移行パスも考慮しておくといいわ。

バックアップと同期に関しては、ローカルバックアップ機能は必須よ。オプションとして、Git 統合やシンプルなクラウド同期機能（Dropbox、Google Drive 経由など）を提供することで、複数デバイス間での使用や履歴管理が可能になるでしょうね。

## 学習システムとデータフロー

### AI の学習メカニズム

このアプリケーションの中核となる特徴は、実績データから学習して予測精度を向上させるメカニズムね。この学習システムの設計には、いくつかのアプローチが考えられるわ。

最も単純なのは、タスクの特性（名前、カテゴリなど）と実際の所要時間の関係を統計的に分析する方法よ。例えば、「会議」というキーワードを含むタスクの平均所要時間や、「コーディング」カテゴリのタスクの所要時間の分布などを計算し、新しいタスクの予測に活用するわ。

より高度なアプローチとしては、タスク説明のテキスト特徴量を抽出し、機械学習モデル（線形回帰や決定木など）を用いて予測モデルを構築する方法もあるわね。これにより、タスクの微妙なニュアンスも予測に反映できるようになるでしょう。

学習の頻度も重要ね。リアルタイム学習（タスク完了ごとに更新）と定期的なバッチ学習（毎日または毎週更新）のどちらがこのアプリケーションに適しているか検討する必要があるわ。リアルタイム学習は即時のフィードバックが得られる一方、バッチ学習はより安定した予測モデルを構築できるメリットがあるわね。

### データフローと分析サイクル

アプリケーション内のデータフローは、以下のサイクルに基づいて設計するといいでしょうね：

1. ユーザーがタスクを入力する
2. AI がタスクを分析し、カテゴリを割り当て、所要時間を予測する
3. 予測に基づいてタイムブロックが生成・提案される
4. ユーザーがタイムブロックを確認・調整し、作業を行う
5. 実際の所要時間が記録される
6. 予測と実績の差異が分析され、AI モデルが更新される
7. 更新されたモデルが次回の予測に使用される

このサイクルを効果的に機能させるためには、予測と実績の差異を適切に分析するメカニズムが必要よ。単純な「予測時間 vs 実績時間」の比較だけでなく、曜日や時間帯、直前のタスク、ユーザーの状態（例：疲労度）などの文脈情報も可能な限り考慮できるとさらに精度が向上するでしょうね。

また、長期的な傾向分析も重要よ。時間経過とともにユーザーの作業効率や習慣がどのように変化しているかを追跡し、AI モデルにもその変化を反映させる必要があるわ。例えば、特定のプロジェクトに熟練するにつれてタスク完了時間が短縮する傾向などが捉えられるとよいでしょうね。

## 実装上の課題と対策

### TUI 実装の技術選択

TUI アプリケーションを実装するための技術選択は重要な課題ね。いくつかの選択肢があるわ：

まず、Python + curses/urwid フレームワークの組み合わせが考えられるわ。Python は機械学習ライブラリが充実しており、AI コンポーネントとの統合が容易な利点があるわね。curses は標準的な TUI ライブラリで、urwid はより高度なウィジェットを提供するわ。ただし、Windows での curses サポートには制約があることに注意が必要よ。

Rust と同様に tui-rs や cursive などのライブラリを使用するアプローチもあるわ。Rust はパフォーマンスが高く、安全性も優れているため、軽量で応答性の高い TUI が実現できるわね。ただし、AI ライブラリとの統合は他言語と比べてやや難しい面もあるわ。

Node.js と blessed/neo-blessed 等のライブラリの組み合わせも選択肢よ。JavaScript エコシステムは豊富で、特に WebAPI との連携が簡単なメリットがあるわね。ただし、重い AI 処理にはやや不向きかもしれないわ。

最終的な選択は、開発者のスキルセット、AI コンポーネントとの統合のしやすさ、そしてクロスプラットフォーム対応の必要性などを考慮して決定すべきでしょうね。

### プライバシーと信頼性の確保

AI を活用するアプリケーションでは、プライバシーと信頼性の確保が特に重要な課題になるわ。ユーザーのタスクデータには個人的または機密情報が含まれる可能性があるから、それらの保護に十分注意を払う必要があるのよ。

ローカルファーストのアプローチを採用し、データは基本的にユーザーのデバイスに保存するべきね。クラウド API 利用時も、最小限の情報のみを送信するよう設計するわ。例えば、タスク名から個人情報を取り除いた抽象化したテキストだけを AI に送ることも一案よ。

また、ユーザーに対してデータの使用方法を明確に説明し、選択肢を提供することが重要ね。例えば、「プライバシーモード」を設けて、AI による予測精度は落ちるものの、データを一切外部送信しない選択肢を用意するといいでしょう。

信頼性の面では、AI の予測は常に不確実性を伴うものであることをユーザーに適切に伝える必要があるわ。予測時間に幅を持たせる（例：「25〜35 分」）表示や、予測の信頼度を示す指標を表示するなどの工夫が考えられるわね。また、AI の予測に過度に依存せず、ユーザー自身による調整を常に可能にしておくべきよ。

## 将来的な拡張可能性

### 機能の段階的拡張

アプリケーションの将来的な拡張可能性も考慮しておくといいわね。「Dead Simple」の精神を維持しながらも、段階的に機能を拡張していくロードマップを考えてみましょう。

短期的な拡張としては、基本的な統計レポート機能の追加が考えられるわ。完了タスクの分析、時間管理効率の推移、カテゴリ別の時間配分などを可視化することで、ユーザー自身の時間管理パターンへの理解を深める助けになるでしょうね。

中期的には、外部カレンダーとの同期機能が有用よ。Google Calendar や Outlook などとの連携により、既存の予定とタイムブロックを統合管理できるようになるわ。これは特に仕事とプライベートの両方でツールを使用したいユーザーに価値があるでしょうね。

長期的には、チーム連携機能の可能性も検討できるわ。個人のタイムブロックを共有カレンダーに反映させたり、チームメンバー間でタスクの依存関係を管理したりする機能が考えられるわね。ただし、この拡張は「シンプル」というコンセプトから大きく外れる可能性があるため、慎重に検討する必要があるでしょう。

### オープンソースコミュニティの活用

このようなツールはオープンソースプロジェクトとして開発することで、大きな価値が生まれる可能性があるわ。オープンソース化のメリットとしては、多様な環境でのテスト、バグ修正の迅速化、多様なユースケースへの対応などが挙げられるわね。

GitHub などのプラットフォームでプロジェクトを公開する際には、明確なコントリビューションガイドラインを設け、プロジェクトの理念（「Dead Simple」であること）を共有することが重要よ。機能追加の提案に対しては、「シンプルさを維持するか」という観点から厳格に評価する方針を明確にしておくべきでしょうね。

また、AI コンポーネントのオープンソース実装も検討の余地があるわ。例えば、タスク時間予測のためのオープンデータセットの構築や、様々な予測アルゴリズムを比較検証できるベンチマークの開発などが考えられるわね。これにより、コミュニティ全体での時間管理技術の進歩に貢献できるでしょう。

## 結論

「Dead Simple Time Blocking With AI」をテーマにした TUI アプリケーションの要件分析を行ったわ。このアプリケーションの核心は、AI の活用によるタイムブロッキングの効率化と、シンプルなユーザーインターフェースによる使いやすさの両立にあるわね。

AI の役割を「タスク自体の生成」ではなく、「所要時間の推測」「タスクカテゴリの分類」「タイムブロックの生成」「実績時間からの推測精度の向上」に限定することで、AI の強みを活かしつつ、その限界を回避する設計になっているわ。ユーザーはタスクの入力と時間計測という最小限の責務に集中できるため、継続的な利用が期待できるでしょうね。

TUI という選択は「Dead Simple」というコンセプトに非常に適しており、キーボード主体の操作でスムーズなワークフローを実現できるわ。技術的には、AI コンポーネントの実装方法、データ構造の設計、プライバシーへの配慮などが主要な検討事項となるでしょう。

このアプリケーションが実現すれば、タイムマネジメントの効率化だけでなく、ユーザー自身の時間感覚の向上にも貢献できる可能性があるわ。「Dead Simple」という理念を守りながらも、段階的な機能拡張により、より多くのユーザーのニーズに応えていけるでしょうね。今後の開発に期待しているわ。

---

# Node.js と TypeScript による Domain と Schema を活用したタイムブロッキングアプリケーションの設計

タイムブロッキングと AI を組み合わせた TUI アプリケーションを、エヴァンスのドメイン駆動設計（DDD）とファウラーのスキーマ駆動開発の理念に基づいて設計してみるわ。Node.js と TypeScript を使い、class を使わない最新のアプローチを採用することで、より型安全で関数型プログラミングの利点を活かした実装を目指すわね。

## ドメインモデルとユビキタス言語の確立

まず、アプリケーションのドメインに関する共通理解と言語を確立することが重要よ。タイムブロッキングアプリケーションのコアコンセプトを定義してみましょう。

### ドメイン概念の定義

ドメイン駆動設計では、開発者とドメインエキスパート（この場合はユーザー自身）が同じ言葉で会話できるユビキタス言語が重要ね。このアプリケーションでの主要な概念は次のとおりよ：

```typescript
// src/domain/schemas/task.ts
import { z } from 'zod';

export const TaskIdSchema = z.string().uuid();
export const TaskNameSchema = z.string().min(1).max(100);
export const DurationSchema = z.number().int().positive(); // 分単位
export const CategorySchema = z.enum([
  'WORK',
  'PERSONAL_DEV',
  'HOUSEHOLD',
  'LEARNING',
  'OTHER',
]);
export const TaskStatusSchema = z.enum([
  'NOT_STARTED',
  'IN_PROGRESS',
  'COMPLETED',
  'DEFERRED',
]);

export const TaskSchema = z.object({
  id: TaskIdSchema,
  name: TaskNameSchema,
  description: z.string().optional(),
  estimatedDuration: DurationSchema,
  actualDuration: DurationSchema.optional(),
  category: CategorySchema,
  status: TaskStatusSchema,
  createdAt: z.date(),
  completedAt: z.date().optional(),
});
```

このようにスキーマ駆動開発では、ドメインの概念をまずスキーマとして定義するわ。Zod のようなライブラリを使用すると、バリデーションと型生成の両方が可能になるのよ。これらのスキーマから型を導出します：

```typescript
// src/domain/types/task.ts
import { z } from 'zod';
import {
  TaskSchema,
  TaskIdSchema,
  CategorySchema,
  TaskStatusSchema,
} from '../schemas/task';

export type TaskId = z.infer<typeof TaskIdSchema>;
export type Category = z.infer<typeof CategorySchema>;
export type TaskStatus = z.infer<typeof TaskStatusSchema>;
export type Task = z.infer<typeof TaskSchema>;

// 不変性を確保するための読み取り専用型
export type ReadonlyTask = Readonly<Task>;
```

## 境界づけられたコンテキストの設計

DDD では、モデルが一貫性を持つ範囲を「境界づけられたコンテキスト」として定義するわ。このアプリケーションでは、以下のコンテキストを特定できるわね：

1. タスク管理コンテキスト - タスクの作成・編集・分類
2. タイムブロッキングコンテキスト - スケジュール生成と管理
3. タイムトラッキングコンテキスト - 実行時間の記録と分析
4. 予測コンテキスト - AI による時間予測と学習

これらのコンテキスト間の関係性とインタラクションを明確にすることで、責任の境界が明確になり、システム全体の複雑性を管理しやすくなるわ。

## ドメイン関数とファクトリ関数

class を使わないアプローチでは、オブジェクトの生成と操作に純粋関数を使用するわ。タスク関連のファクトリ関数とコマンド関数を次のように実装できるでしょう：

```typescript
// src/domain/factories/taskFactory.ts
import { v4 as uuidv4 } from 'uuid';
import { Task, Category } from '../types/task';
import { TaskSchema } from '../schemas/task';

export const createTask = (
  name: string,
  estimatedDuration: number,
  category: Category,
  description?: string
): Task => {
  const task: Task = {
    id: uuidv4(),
    name,
    description,
    estimatedDuration,
    category,
    status: 'NOT_STARTED',
    createdAt: new Date(),
  };

  // スキーマを使用したバリデーション
  return TaskSchema.parse(task);
};
```

そして、タスクに対する操作を行うコマンド関数：

```typescript
// src/domain/commands/taskCommands.ts
import { Task, ReadonlyTask } from '../types/task';
import { TaskSchema } from '../schemas/task';

export const startTask = (task: ReadonlyTask): Task => {
  if (task.status === 'IN_PROGRESS') {
    return task as Task; // 既に進行中
  }

  const updatedTask: Task = {
    ...task,
    status: 'IN_PROGRESS',
  };

  return TaskSchema.parse(updatedTask);
};

export const completeTask = (
  task: ReadonlyTask,
  actualDuration: number
): Task => {
  const updatedTask: Task = {
    ...task,
    status: 'COMPLETED',
    actualDuration,
    completedAt: new Date(),
  };

  return TaskSchema.parse(updatedTask);
};
```

## ドメインサービスの設計

タイムブロック生成などの複雑なドメインロジックは、ドメインサービスとして実装するわ：

```typescript
// src/domain/services/timeBlockService.ts
import { v4 as uuidv4 } from 'uuid';
import { ReadonlyTask } from '../types/task';
import { TimeBlock } from '../types/timeBlock';
import { TimeBlockSchema } from '../schemas/timeBlock';

export const generateTimeBlocks = (
  tasks: ReadonlyTask[],
  startTime: Date,
  endTime: Date
): TimeBlock[] => {
  const availableMinutes = Math.floor(
    (endTime.getTime() - startTime.getTime()) / (1000 * 60)
  );
  let currentTime = new Date(startTime);
  const timeBlocks: TimeBlock[] = [];

  // タスクを優先度順にソートするロジックなどをここに追加できる

  for (const task of tasks) {
    if (task.estimatedDuration <= availableMinutes) {
      const blockEndTime = new Date(currentTime);
      blockEndTime.setMinutes(
        blockEndTime.getMinutes() + task.estimatedDuration
      );

      const timeBlock: TimeBlock = {
        id: uuidv4(),
        taskId: task.id,
        startTime: new Date(currentTime),
        endTime: blockEndTime,
        isCompleted: false,
      };

      timeBlocks.push(TimeBlockSchema.parse(timeBlock));

      currentTime = new Date(blockEndTime);
      availableMinutes -= task.estimatedDuration;
    }
  }

  return timeBlocks;
};
```

## AI 予測機能の実装

タスクの所要時間予測とカテゴリ分類を行う AI サービスを設計するわ：

```typescript
// src/domain/services/predictionService.ts
import { Category, Task, ReadonlyTask } from '../types/task';
import type { LlmClient } from '../../infrastructure/ai/llmClient';

export interface PredictionService {
  estimateTaskDuration: (
    taskName: string,
    category?: Category
  ) => Promise<number>;
  classifyTaskCategory: (taskName: string) => Promise<Category>;
  learnFromCompletedTask: (task: ReadonlyTask) => Promise<void>;
}

export const createPredictionService = (
  llmClient: LlmClient,
  taskHistory: () => Promise<ReadonlyTask[]>
): PredictionService => {
  return {
    async estimateTaskDuration(
      taskName: string,
      category?: Category
    ): Promise<number> {
      // 過去の類似タスクから予測
      const tasks = await taskHistory();
      const completedSimilarTasks = tasks.filter(
        (task) =>
          task.actualDuration &&
          task.name.toLowerCase().includes(taskName.toLowerCase()) &&
          (category ? task.category === category : true)
      );

      if (completedSimilarTasks.length > 0) {
        // 過去データがある場合は平均値を基準に
        const avgDuration =
          completedSimilarTasks.reduce(
            (sum, task) => sum + (task.actualDuration || 0),
            0
          ) / completedSimilarTasks.length;
        return Math.round(avgDuration);
      }

      // 過去データがない場合はLLMに問い合わせ
      const prompt = `次のタスクの完了にかかる推定時間（分単位）を数字だけで答えてください: "${taskName}"`;
      const response = await llmClient.complete(prompt);
      const minutes = parseInt(response.trim(), 10);

      return isNaN(minutes) ? 30 : minutes; // パース失敗時はデフォルト30分
    },

    async classifyTaskCategory(taskName: string): Promise<Category> {
      const prompt = `次のタスクを以下のカテゴリのいずれかに分類してください: WORK, PERSONAL_DEV, HOUSEHOLD, LEARNING, OTHER
タスク: "${taskName}"
カテゴリ: `;

      const response = await llmClient.complete(prompt);
      const category = response.trim().toUpperCase() as Category;

      // バリデーション
      return category === 'WORK' ||
        category === 'PERSONAL_DEV' ||
        category === 'HOUSEHOLD' ||
        category === 'LEARNING'
        ? category
        : 'OTHER';
    },

    async learnFromCompletedTask(task: ReadonlyTask): Promise<void> {
      // 実際の実装では、トレーニングデータを保存するなどの処理
      console.log(
        `Learning from task: ${task.name}, Estimated: ${task.estimatedDuration}, Actual: ${task.actualDuration}`
      );
      // ここでモデルの再訓練や調整ロジックを実装
    },
  };
};
```

## リポジトリのインターフェースとローカル実装

DDD ではリポジトリパターンを使用してデータアクセスを抽象化するわ。TypeScript では、インターフェースと実装を分離することで、テストやデータソースの変更が容易になるわね：

```typescript
// src/application/repositories/taskRepository.ts
import { TaskId, Task, ReadonlyTask } from '../../domain/types/task';

export interface TaskRepository {
  findById: (id: TaskId) => Promise<ReadonlyTask | null>;
  findAll: () => Promise<ReadonlyTask[]>;
  save: (task: ReadonlyTask) => Promise<void>;
  update: (task: ReadonlyTask) => Promise<void>;
  delete: (id: TaskId) => Promise<void>;
}
```

そして、ローカルファイルシステムベースの実装：

```typescript
// src/infrastructure/repositories/fileTaskRepository.ts
import * as fs from 'fs/promises';
import * as path from 'path';
import { TaskId, Task, ReadonlyTask } from '../../domain/types/task';
import { TaskRepository } from '../../application/repositories/taskRepository';
import { TaskSchema } from '../../domain/schemas/task';

export const createFileTaskRepository = (filePath: string): TaskRepository => {
  // データディレクトリの確保
  const ensureDirectoryExists = async (): Promise<void> => {
    const dir = path.dirname(filePath);
    try {
      await fs.mkdir(dir, { recursive: true });
    } catch (err) {
      if ((err as NodeJS.ErrnoException).code !== 'EEXIST') {
        throw err;
      }
    }
  };

  // ファイルからタスクを読み込む
  const loadTasks = async (): Promise<ReadonlyTask[]> => {
    try {
      await ensureDirectoryExists();
      const data = await fs.readFile(filePath, 'utf-8');
      const rawTasks = JSON.parse(data);
      return rawTasks.map((task: any) => ({
        ...task,
        createdAt: new Date(task.createdAt),
        completedAt: task.completedAt ? new Date(task.completedAt) : undefined,
      }));
    } catch (err) {
      if ((err as NodeJS.ErrnoException).code === 'ENOENT') {
        await fs.writeFile(filePath, '[]', 'utf-8');
        return [];
      }
      throw err;
    }
  };

  // タスクをファイルに保存
  const saveTasks = async (tasks: ReadonlyTask[]): Promise<void> => {
    await ensureDirectoryExists();
    await fs.writeFile(filePath, JSON.stringify(tasks, null, 2), 'utf-8');
  };

  return {
    async findById(id: TaskId): Promise<ReadonlyTask | null> {
      const tasks = await loadTasks();
      return tasks.find((task) => task.id === id) || null;
    },

    async findAll(): Promise<ReadonlyTask[]> {
      return await loadTasks();
    },

    async save(task: ReadonlyTask): Promise<void> {
      const tasks = await loadTasks();
      tasks.push(task);
      await saveTasks(tasks);
    },

    async update(task: ReadonlyTask): Promise<void> {
      const tasks = await loadTasks();
      const index = tasks.findIndex((t) => t.id === task.id);
      if (index >= 0) {
        tasks[index] = task;
        await saveTasks(tasks);
      }
    },

    async delete(id: TaskId): Promise<void> {
      const tasks = await loadTasks();
      const filteredTasks = tasks.filter((task) => task.id !== id);
      await saveTasks(filteredTasks);
    },
  };
};
```

## アプリケーションサービスの実装

アプリケーションサービスは、ユースケースを実装し、ドメインロジックを調整するわ：

```typescript
// src/application/services/taskApplicationService.ts
import { TaskId, Task, ReadonlyTask } from '../../domain/types/task';
import { TaskRepository } from '../repositories/taskRepository';
import { PredictionService } from '../../domain/services/predictionService';
import { createTask } from '../../domain/factories/taskFactory';
import { startTask, completeTask } from '../../domain/commands/taskCommands';

export const createTaskApplicationService = (
  taskRepository: TaskRepository,
  predictionService: PredictionService
) => {
  return {
    async createTaskWithPrediction(
      name: string,
      description?: string
    ): Promise<ReadonlyTask> {
      // AIにカテゴリを予測させる
      const category = await predictionService.classifyTaskCategory(name);

      // AIに所要時間を予測させる
      const estimatedDuration = await predictionService.estimateTaskDuration(
        name,
        category
      );

      // ドメインロジックを使ってタスクを作成
      const newTask = createTask(
        name,
        estimatedDuration,
        category,
        description
      );

      // リポジトリに保存
      await taskRepository.save(newTask);

      return newTask;
    },

    async startTaskTracking(id: TaskId): Promise<ReadonlyTask | null> {
      const task = await taskRepository.findById(id);
      if (!task) return null;

      const updatedTask = startTask(task);
      await taskRepository.update(updatedTask);

      return updatedTask;
    },

    async completeTaskTracking(
      id: TaskId,
      actualDuration: number
    ): Promise<ReadonlyTask | null> {
      const task = await taskRepository.findById(id);
      if (!task) return null;

      const completedTask = completeTask(task, actualDuration);
      await taskRepository.update(completedTask);

      // AIモデルの学習
      await predictionService.learnFromCompletedTask(completedTask);

      return completedTask;
    },
  };
};
```

## TUI インターフェースの設計

ユーザーインターフェースレイヤーでは、blessed（または neo-blessed）を使用してターミナルベースのインターフェースを構築するわ：

```typescript
// src/infrastructure/ui/tuiApp.ts
import * as blessed from 'blessed';
import * as contrib from 'blessed-contrib';
import { ReadonlyTask, TaskStatus } from '../../domain/types/task';
import { ReadonlyTimeBlock } from '../../domain/types/timeBlock';

export const createTuiApp = (
  taskService: ReturnType<
    typeof import('../../application/services/taskApplicationService').createTaskApplicationService
  >,
  timeBlockService: any // タイムブロックサービスの型
) => {
  // メインスクリーンの作成
  const screen = blessed.screen({
    smartCSR: true,
    title: 'Dead Simple Time Blocking',
  });

  // 終了キーの設定
  screen.key(['escape', 'q', 'C-c'], () => process.exit(0));

  // タスクリストボックス
  const taskListBox = blessed.list({
    top: '0',
    left: '0',
    width: '50%',
    height: '70%',
    border: { type: 'line' },
    label: ' Tasks ',
    keys: true,
    vi: true,
    style: {
      selected: { bg: 'blue' },
      border: { fg: 'white' },
    },
  });

  // タイムブロック表示エリア
  const timeBlockBox = blessed.box({
    top: '0',
    right: '0',
    width: '50%',
    height: '70%',
    border: { type: 'line' },
    label: ' Time Blocks ',
    content: '',
    tags: true,
  });

  // タイマー表示エリア
  const timerBox = blessed.box({
    bottom: '0',
    left: '0',
    width: '100%',
    height: '30%',
    border: { type: 'line' },
    label: ' Timer ',
    content: 'No task selected',
  });

  // 入力フォーム
  const taskForm = blessed.form({
    parent: screen,
    top: 'center',
    left: 'center',
    width: 60,
    height: 10,
    border: { type: 'line' },
    label: ' New Task ',
    hidden: true,
  });

  const taskNameInput = blessed.textbox({
    parent: taskForm,
    top: 1,
    left: 2,
    right: 2,
    height: 1,
    inputOnFocus: true,
    border: { type: 'line' },
    label: ' Task Name ',
  });

  const submitButton = blessed.button({
    parent: taskForm,
    bottom: 1,
    left: 'center',
    width: 10,
    height: 1,
    content: 'Submit',
    style: {
      bg: 'blue',
      focus: { bg: 'green' },
    },
    inputOnFocus: true,
  });

  // 要素をスクリーンに追加
  screen.append(taskListBox);
  screen.append(timeBlockBox);
  screen.append(timerBox);

  // キー操作の設定
  screen.key('n', () => {
    taskForm.show();
    taskNameInput.focus();
    screen.render();
  });

  // タスク追加のイベントハンドラ
  submitButton.on('press', async () => {
    const taskName = taskNameInput.getValue();
    if (taskName) {
      try {
        const task = await taskService.createTaskWithPrediction(taskName);
        updateTaskList();
        taskNameInput.setValue('');
        taskForm.hide();
        screen.render();
      } catch (err) {
        // エラーハンドリング
      }
    }
  });

  // タスクリストの更新
  const updateTaskList = async () => {
    const tasks = await taskService.getAllTasks();
    taskListBox.setItems(
      tasks.map(
        (task) => `${task.name} (${task.estimatedDuration}分) - ${task.status}`
      )
    );
    screen.render();
  };

  // タイムブロック表示の更新
  const updateTimeBlocks = async () => {
    const blocks = await timeBlockService.getTodayBlocks();
    let content = '';
    blocks.forEach((block) => {
      const startTime = block.startTime.toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      });
      const endTime = block.endTime.toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      });
      content += `{bold}${startTime} - ${endTime}{/bold}: ${block.taskName}\n`;
    });
    timeBlockBox.setContent(content);
    screen.render();
  };

  // 初期データロード
  const initialize = async () => {
    await updateTaskList();
    await updateTimeBlocks();
  };

  return {
    start: () => {
      initialize();
      screen.render();
    },
  };
};
```

## プロジェクト構造とコンポジション

最後に、アプリケーション全体を組み立てるエントリーポイントと、プロジェクト構造を示すわ：

```typescript
// src/index.ts
import { createFileTaskRepository } from './infrastructure/repositories/fileTaskRepository';
import { createFileTimeBlockRepository } from './infrastructure/repositories/fileTimeBlockRepository';
import { createOpenAiClient } from './infrastructure/ai/openAiClient';
import { createPredictionService } from './domain/services/predictionService';
import { createTaskApplicationService } from './application/services/taskApplicationService';
import { createTimeBlockApplicationService } from './application/services/timeBlockApplicationService';
import { createTuiApp } from './infrastructure/ui/tuiApp';

const bootstrap = async () => {
  // データディレクトリの設定
  const dataDir = process.env.DATA_DIR || './data';

  // リポジトリの初期化
  const taskRepository = createFileTaskRepository(`${dataDir}/tasks.json`);
  const timeBlockRepository = createFileTimeBlockRepository(
    `${dataDir}/timeblocks.json`
  );

  // AIクライアントの初期化
  const llmClient = createOpenAiClient({
    apiKey: process.env.OPENAI_API_KEY || '',
  });

  // ドメインサービスの初期化
  const predictionService = createPredictionService(llmClient, () =>
    taskRepository.findAll()
  );

  // アプリケーションサービスの初期化
  const taskService = createTaskApplicationService(
    taskRepository,
    predictionService
  );
  const timeBlockService = createTimeBlockApplicationService(
    timeBlockRepository,
    taskRepository
  );

  // TUIアプリの初期化と起動
  const app = createTuiApp(taskService, timeBlockService);
  app.start();
};

bootstrap().catch((err) => {
  console.error('Application startup failed:', err);
  process.exit(1);
});
```

推奨するプロジェクト構造は次のとおりよ：

```
src/
├── domain/              // ドメイン層
│   ├── schemas/         // zodでのスキーマ定義
│   ├── types/           // 型定義
│   ├── factories/       // ファクトリ関数
│   ├── commands/        // コマンド関数
│   └── services/        // ドメインサービス
├── application/         // アプリケーション層
│   ├── repositories/    // リポジトリインターフェース
│   └── services/        // アプリケーションサービス
├── infrastructure/      // インフラストラクチャ層
│   ├── repositories/    // リポジトリ実装
│   ├── ai/              // AI関連の実装
│   └── ui/              // TUI実装
└── index.ts             // エントリーポイント
```

## 将来の拡張性と考慮点

この設計アプローチには、いくつかの重要な利点があるわ：

1. スキーマ駆動開発により、データ構造と型の一貫性が保証されているわ
2. 関数型アプローチとイミュータビリティにより、副作用が制限され、テストが容易になるわ
3. DDD の原則に従うことで、ドメインロジックが明確に分離され、ビジネスルールの変更に対応しやすいわ
4. 境界づけられたコンテキストにより、システムの異なる部分が独立して進化できるわ

将来の拡張としては、以下のようなことが考えられるわね：

1. グラフィカルなレポートと分析機能の追加
2. 複数デバイス間での同期機能
3. チーム連携のための共有機能
4. より高度な AI 予測モデルの統合

このようなアプローチで実装すれば、「Dead Simple」という理念を保ちながらも、強力でメンテナンス可能なタイムブロッキングアプリケーションが実現できるでしょうね。TypeScript の型システムとスキーマ駆動の手法により、変更に強く、拡張性のある設計になっているわ。

---

# Node.js と TypeScript によるタイムブロッキングアプリケーションの構成詳細化

「Dead Simple Time Blocking With AI」というテーマでアプリケーションを設計するにあたり、エヴァンスの DDD（ドメイン駆動設計）とファウラーのスキーマ駆動開発の理念を活用し、コードを書かずに構成を整理してみるわ。設計の基礎となる考え方から、高レベルの構造までを詳細化していくわね。

---

## アプリケーションの概要と目的

### コンセプト

このアプリケーションは、タイムブロッキングを効率化するツールを提供し、AI を活用してタスクの所要時間予測やカテゴリ分類を行うことで、ユーザーの時間管理を助けるものよ。とにかくシンプルさを重視する設計が求められるわね。

### 主な特徴

1. **タスクの登録と予測**
   - ユーザーがタスクを入力すると、AI が所要時間やカテゴリを予測。
2. **タイムブロックの自動生成**
   - ユーザーの時間枠に基づいて合理的なスケジュールを提案。
3. **タイムトラッキング**
   - 実際の作業時間を記録して、次回の予測精度に活かす。
4. **ターミナルベースの操作**
   - TUI（テキストユーザーインターフェース）で直観的かつ高速に操作できる。
5. **スキーマ駆動の型安全性**
   - zod（型バリデーションライブラリ）を活用してデータモデルを一貫性のあるものに。

---

## ドメインモデルの設計

### 核となるドメイン概念

アプリケーションの主なドメインモデルは以下の通りよ。これらは「境界づけられたコンテキスト」を活用して独立性を保つべきね。

1. **タスク（Task）**
   - タスクの基本情報（名前、カテゴリ、予測所要時間、実績時間など）。
   - 状態管理（未開始／進行中／完了など）。
2. **タイムブロック（Time Block）**
   - 1 日のスケジュール内でのタスクのアサイン情報。
   - 開始時間／終了時間などの枠について管理。
3. **予測（Prediction）**
   - AI を活用して過去のデータやテキスト入力から推測される所要時間・カテゴリ情報。
4. **トラッキング（Tracking）**
   - 実績時間、進捗状況を記録して、ユーザーの行動パターン分析に活用。

---

## 全体構成

### レイヤー構造

エヴァンスの DDD に基づいて、「ドメイン層」「アプリケーション層」「インフラストラクチャ層」に分けるわ。この 3 層構造はシンプルでありながら、拡張性や変更容易性を確保できるわね。

#### 1. **ドメイン層**

ドメイン層は、ビジネスロジックの中心部分を担うわ。主に以下を含む：

- **モデル（Domain Models）**
  - タスク、タイムブロックなど。
- **スキーマ（Schemas）**
  - zod で型安全なデータ定義。
- **リポジトリインターフェース**
  - データアクセスを抽象化するインターフェース。
- **ファクトリ**
  - ドメインエンティティの生成（例：新しいタスク）。
- **ドメインサービス**
  - タイムブロック生成や AI 統合など、複雑なドメインロジックの実装。

#### 2. **アプリケーション層**

アプリケーション層は、ユースケースの実装を担うわ。この層は用語としても DDD の一部とされるけれど、役割としては以下に特化している：

- **アプリケーションサービス（Application Services）**
  - タスク操作やタイムトラッキングを支援するサービス。
- **リポジトリ操作**
  - ドメイン層のリポジトリを使ってデータを取得／更新。

#### 3. **インフラストラクチャ層**

インフラストラクチャ層は具体的な入出力、データ保存、外部サービスとの接続を担当するわ。

- **リポジトリの実装**
  - JSON ファイル、SQLite などによる具体的なデータ保存機能。
- **AI クライアント**
  - 外部 AI サービス（例：ChatGPT API）との接続。
- **UI（ユーザーインターフェース）**
  - TUI での画面操作とデータ表示。

---

## 機能別の詳細構成

### 1. **タスク管理機能**

タスクを登録・編集する機能が基本よ。

#### 主な機能

- ユーザーが名前・説明を入力。
- AI が所要時間やカテゴリ（例：WORK／LEARNING など）を予測。
- 新規タスクを保存。

#### 実装のポイント

- スキーマ駆動（zod）によるバリデーション。
- ファクトリ関数で不変エンティティを生成。

---

### 2. **タイムブロッキング機能**

タイムブロックを自動生成してスケジュールを提案。

#### 主な機能

- 空き時間に基づいてタスクをアサイン。
- タスク間にバッファ時間や休憩を挿入。
- タイムブロックを表示（開始／終了時間）。

#### 実装のポイント

- 予測された所要時間を基にアルゴリズムでスケジュール生成。
- ドメインサービスで統一的にロジックを管理。

---

### 3. **タイムトラッキング機能**

実際の作業時間と進捗を記録。

#### 主な機能

- タスク開始／停止（簡単なキー入力で操作）。
- 実績時間を保存。
- 完了後に AI モデルを更新。

#### 実装のポイント

- TUI でリアルタイム操作。
- 実績時間の差異をモデルに反映する仕組み。

---

### 4. **分析・学習機能**

記録から得たデータを次回の予測に活かす。

#### 主な機能

- 実績データから平均所要時間を計算。
- タスク名やカテゴリに基づく学習（AI モデル）。

#### 実装のポイント

- 過去データを定期的に集計。
- トレーニングデータとして AI にフィードバック。

---

## 技術仕様

### 1. **プログラミング言語とフレームワーク**

- **Node.js**: 非同期処理と高速な I/O 操作に最適。
- **TypeScript**: 型安全性と最新の JavaScript 機能を提供。
- **zod**: スキーマ定義と型バリデーションの統合。

---

### 2. **データストレージ**

- 初期段階では JSON ファイルベースのローカルストレージ。
- 拡張時には SQLite や軽量データベースを採用。

---

### 3. **AI 統合**

- **API 選定**: OpenAI での GPT モデル（例：ChatGPT API）。
- **機能**:
  - タスク所要時間の推測。
  - カテゴリ分類。
  - 実績データ学習。

---

### 4. **ユーザーインターフェース**

- **TUI ライブラリ**: blessed または neo-blessed。
- **UI 設計**:
  - タスクリスト表示。
  - タイムブロックの可視化。
  - リアルタイムのタイマー。

---

## 非機能要件

### 1. **プライバシー**

- データはローカルストレージに保存し、必要最低限のみ外部送信。
- ユーザーによるデータ送信オプションを提供。

---

### 2. **拡張性**

- スキーマ駆動開発により、変更時の影響範囲を局所化。
- リポジトリ抽象化によりデータストレージの変更が容易。

---

### 3. **パフォーマンス**

- TUI ベースで軽量な操作環境。
- 非同期処理によるレスポンス向上。

---

## プロジェクト構造

以下のような構造で整理するわ：

```
src/
├── domain/              // ドメイン層でビジネスロジックを管理
│   ├── schemas/         // スキーマ定義（型とバリデーション）
│   ├── services/        // ドメインサービス
│   ├── types/           // 型定義とデータモデル
│   ├── factories/       // ファクトリ関数
│   └── commands/        // タスク操作用のロジック
├── application/         // アプリケーション層でユースケースを管理
│   ├── services/        // アプリケーションサービス
│   ├── repositories/    // リポジトリインターフェース
├── infrastructure/      // インフラ層で外部との接続を管理
│   ├── repositories/    // データストレージ実装
│   ├── ai/              // AI統合のためのクライアント
│   └── ui/              // TUI（ターミナルインターフェース）
└── index.ts             // エントリーポイント
```

---

## 次のステップ

1. 必要なユビキタス言語（概念や用語）をさらに精緻化。
2. 各レイヤー間のインターフェース定義を進める。
3. アルゴリズムレベルでタイムブロック生成のロジックを設計。
4. プロトタイプを作成し、実際の操作性を確認する。

---

このような構成で進めれば、DDD とスキーマ駆動の理念を活かしつつ、シンプルで拡張性の高いアプリケーションが設計できるわ。設計をさらに詳細化する場合、各機能のユースケースごとにインターフェースや依存関係を具体的に整理するとよいでしょう。

---

# ユビキタス言語をまとめて

ええ、ユビキタス言語はドメイン駆動設計（DDD）において非常に重要な要素ね。「Dead Simple Time Blocking With AI」アプリケーションのための主要な概念と用語を整理してみましょう。

## ユビキタス言語: タイムブロッキング AI アシスタント

### コアコンセプト

1. **タスク (Task)**
   - 定義: 完了すべき単一の作業単位
   - 属性: ID、名前、説明、予測所要時間、実績時間、カテゴリ、ステータス
   - ステータス: 未開始、進行中、完了、延期
2. **タイムブロック (Time Block)**
   - 定義: スケジュール内の特定の時間帯に割り当てられたタスク
   - 属性: ID、関連タスク ID、開始時間、終了時間、完了フラグ
3. **カテゴリ (Category)**
   - 定義: タスクの分類
   - 例: 仕事、学習、個人開発、家事、その他
4. **予測 (Prediction)**
   - 定義: AI によるタスクの所要時間とカテゴリの推測
   - 要素: 予測所要時間、予測カテゴリ、信頼度スコア
5. **実績 (Actual)**
   - 定義: タスク完了後の実際の所要時間とカテゴリ
   - 要素: 実績所要時間、実際のカテゴリ
6. **スケジュール (Schedule)**
   - 定義: 一日のタイムブロックの集合
   - 属性: 日付、タイムブロックリスト
7. **タイムトラッキング (Time Tracking)**
   - 定義: タスクの開始から完了までの時間を計測するプロセス
   - 操作: 開始、一時停止、再開、完了
8. **AI モデル (AI Model)**
   - 定義: タスクの予測を行う機械学習モデル
   - 機能: 所要時間予測、カテゴリ分類、学習・更新

### 操作と概念

9. **ブロッキング (Blocking)**
   - 定義: タスクをスケジュール内の特定の時間帯に割り当てるプロセス
10. **最適化 (Optimization)**
    - 定義: タスクの優先度と予測時間に基づいてスケジュールを効率的に調整すること
11. **バッファ (Buffer)**
    - 定義: タスク間に設ける余裕時間
    - 目的: 予期せぬ遅延や休憩のための時間確保
12. **オーバーフロー (Overflow)**
    - 定義: スケジュールに収まりきらないタスク
    - 処理: 次の日程への自動移動または優先度再評価
13. **フォーカスセッション (Focus Session)**
    - 定義: 集中して作業を行う一定の時間枠
    - 特徴: 通知やインタラプトを制限
14. **振り返り (Review)**
    - 定義: 完了したタスクと実績時間を分析するプロセス
    - 目的: 予測精度の向上と生産性の分析
15. **データ同期 (Data Sync)**
    - 定義: ローカルデータとクラウドストレージ間でのデータ更新プロセス
    - 目的: 複数デバイス間での一貫性確保
16. **インポート/エクスポート (Import/Export)**
    - 定義: タスクやスケジュールデータの外部ファイルとの交換機能
17. **リカレンス (Recurrence)**
    - 定義: 定期的に繰り返されるタスクの設定
    - 例: 毎日、毎週、毎月など

### インターフェース要素

18. **タスクビュー (Task View)**
    - 定義: すべてのタスクを一覧表示する画面
19. **タイムラインビュー (Timeline View)**
    - 定義: タイムブロックを時系列で表示する画面
20. **入力プロンプト (Input Prompt)**
    - 定義: 新規タスク入力のためのコマンドライン式インターフェース
21. **ステータスバー (Status Bar)**
    - 定義: 現在のタスク、経過時間、次のタスクを表示する画面上部の領域
22. **コマンドパレット (Command Palette)**
    - 定義: ショートカットキーで呼び出せる操作一覧

このユビキタス言語は、開発チームとステークホルダー間でのコミュニケーションを円滑にし、アプリケーションの一貫性を保つ基盤となるわ。必要に応じて、新しい概念が生まれたり、既存の用語が進化したりする可能性があるから、定期的に見直しと更新を行うことが大切よ。

---

# 予測結果にユーザーからのフラグを立てる機能（明らかに短すぎる、長すぎるなど）を設計して

素晴らしいアイデアね。ユーザーからのフィードバックを予測システムに組み込むことで、AI の精度向上とユーザー体験の改善が期待できるわ。この機能を「予測フラグ（Prediction Flag）」と呼ぶことにしましょう。設計を詳細化していくわね。

## 予測フラグ機能の設計

### 1. ユビキタス言語の拡張

新しい概念を追加するわ：

- **予測フラグ (Prediction Flag)**
  - 定義: ユーザーが予測結果に対して付与する評価マーカー
  - 目的: 予測精度の改善とユーザーの時間感覚の反映
- **フラグタイプ (Flag Type)**
  - 定義: 予測に対するユーザーの評価の種類
  - 例: 短すぎる、長すぎる、適切、不確か

### 2. ドメインモデルの拡張

タスクモデルに予測フラグを追加するわ：

```typescript
// src/domain/schemas/task.ts
import { z } from 'zod';

export const FlagTypeSchema = z.enum([
  'TOO_SHORT',
  'TOO_LONG',
  'ACCURATE',
  'UNCERTAIN',
]);

export const PredictionFlagSchema = z.object({
  type: FlagTypeSchema,
  userComment: z.string().optional(),
  createdAt: z.date(),
});

export const TaskSchema = z.object({
  // ... 既存のフィールド
  predictionFlag: PredictionFlagSchema.optional(),
});

export type FlagType = z.infer<typeof FlagTypeSchema>;
export type PredictionFlag = z.infer<typeof PredictionFlagSchema>;
export type Task = z.infer<typeof TaskSchema>;
```

### 3. ユースケースの定義

予測フラグ機能に関連するユースケースを整理するわ：

1. ユーザーが予測結果にフラグを付ける
2. フラグ付きタスクの一覧を表示する
3. AI モデルがフラグ情報を学習に利用する
4. フラグ統計を分析して AI モデルの調整に活用する

### 4. アプリケーションサービスの拡張

タスク管理サービスに予測フラグ関連の機能を追加するわ：

```typescript
// src/application/services/taskApplicationService.ts

export const createTaskApplicationService = (
  taskRepository: TaskRepository,
  predictionService: PredictionService
) => {
  return {
    // ... 既存の機能

    async addPredictionFlag(
      taskId: string,
      flagType: FlagType,
      userComment?: string
    ): Promise<Task> {
      const task = await taskRepository.findById(taskId);
      if (!task) throw new Error('Task not found');

      const updatedTask: Task = {
        ...task,
        predictionFlag: {
          type: flagType,
          userComment,
          createdAt: new Date(),
        },
      };

      await taskRepository.update(updatedTask);
      await predictionService.learnFromFlag(updatedTask);

      return updatedTask;
    },

    async getFlaggedTasks(): Promise<Task[]> {
      const tasks = await taskRepository.findAll();
      return tasks.filter((task) => task.predictionFlag !== undefined);
    },

    async getTasksWithFlags(): Promise<Task[]> {
      return taskRepository.findAll(); // フラグ情報を含むすべてのタスクを返す
    },
  };
};
```

### 5. AI 予測サービスの拡張

予測サービスに、フラグ情報を学習に利用する機能を追加するわ：

```typescript
// src/domain/services/predictionService.ts

export const createPredictionService = (
  llmClient: LlmClient,
  taskHistory: () => Promise<ReadonlyTask[]>
) => {
  return {
    // ... 既存の機能

    async learnFromFlag(task: ReadonlyTask): Promise<void> {
      if (!task.predictionFlag) return;

      // フラグ情報を基に学習データを生成
      const learningData = {
        taskName: task.name,
        category: task.category,
        estimatedDuration: task.estimatedDuration,
        actualDuration: task.actualDuration,
        flagType: task.predictionFlag.type,
      };

      // LLMに学習データを送信
      await llmClient.learn(learningData);

      // 必要に応じて、ローカルの予測モデルも更新
      // updateLocalPredictionModel(learningData);
    },

    async analyzeFlags(): Promise<FlagAnalysis> {
      const tasks = await taskHistory();
      const flaggedTasks = tasks.filter((task) => task.predictionFlag);

      // フラグの統計分析を行う
      // 例: フラグタイプごとの頻度、カテゴリごとのフラグ傾向など

      return {
        totalFlagged: flaggedTasks.length,
        flagCounts: {
          TOO_SHORT: flaggedTasks.filter(
            (t) => t.predictionFlag?.type === 'TOO_SHORT'
          ).length,
          TOO_LONG: flaggedTasks.filter(
            (t) => t.predictionFlag?.type === 'TOO_LONG'
          ).length,
          ACCURATE: flaggedTasks.filter(
            (t) => t.predictionFlag?.type === 'ACCURATE'
          ).length,
          UNCERTAIN: flaggedTasks.filter(
            (t) => t.predictionFlag?.type === 'UNCERTAIN'
          ).length,
        },
        // その他の分析結果
      };
    },
  };
};
```

### 6. TUI インターフェースの拡張

ユーザーが簡単にフラグを付けられるよう、TUI に新しい操作を追加するわ：

```typescript
// src/infrastructure/ui/tuiApp.ts

// ... 既存のコード

// タスクにフラグを付けるためのフォーム
const flagForm = blessed.form({
  parent: screen,
  top: 'center',
  left: 'center',
  width: 60,
  height: 10,
  border: { type: 'line' },
  label: ' Add Prediction Flag ',
  hidden: true,
});

const flagTypeSelect = blessed.list({
  parent: flagForm,
  top: 1,
  left: 2,
  width: 20,
  height: 4,
  items: ['TOO_SHORT', 'TOO_LONG', 'ACCURATE', 'UNCERTAIN'],
  border: { type: 'line' },
  label: ' Flag Type ',
});

const flagCommentInput = blessed.textarea({
  parent: flagForm,
  top: 1,
  right: 2,
  width: 30,
  height: 3,
  inputOnFocus: true,
  border: { type: 'line' },
  label: ' Comment (Optional) ',
});

// フラグ追加のキーバインド
screen.key('f', () => {
  const selectedTask = getSelectedTask(); // 選択中のタスクを取得する関数
  if (selectedTask) {
    flagForm.show();
    flagTypeSelect.focus();
    screen.render();
  }
});

// フラグ追加の処理
flagForm.on('submit', async () => {
  const selectedTask = getSelectedTask();
  const flagType = flagTypeSelect.selected as FlagType;
  const comment = flagCommentInput.getValue();

  if (selectedTask && flagType) {
    await taskService.addPredictionFlag(selectedTask.id, flagType, comment);
    updateTaskList(); // タスクリストを更新
    flagForm.hide();
    screen.render();
  }
});

// ... その他の UI 関連コード
```

### 7. 分析と改善のためのユーティリティ

管理者や開発者向けに、フラグデータの分析ツールを提供するわ：

```typescript
// src/tools/flagAnalyzer.ts

import { createTaskApplicationService } from '../application/services/taskApplicationService';
import { createPredictionService } from '../domain/services/predictionService';
// ... その他の必要なインポート

const analyzeFlagData = async () => {
  const taskService = createTaskApplicationService(/* 依存関係を注入 */);
  const predictionService = createPredictionService(/* 依存関係を注入 */);

  const flaggedTasks = await taskService.getFlaggedTasks();
  const flagAnalysis = await predictionService.analyzeFlags();

  console.log('Flag Analysis Results:');
  console.log(JSON.stringify(flagAnalysis, null, 2));

  // 詳細な分析や可視化をここに追加
};

analyzeFlagData().catch(console.error);
```

この設計により、予測フラグ機能が「Dead Simple Time Blocking With AI」アプリケーションに統合されるわ。ユーザーは簡単に予測結果にフィードバックを提供でき、そのデータは AI モデルの改善に活用されるわね。

重要なポイントは：

1. ユーザーの操作を最小限に抑えつつ、有用なフィードバックを得られること。
2. フラグデータを AI 学習に効果的に活用すること。
3. フラグ情報の分析により、システム全体の予測精度を継続的に改善できること。

この機能は、ユーザーと AI の協調を促進し、時間管理の精度向上に貢献するでしょう。必要に応じて、ユーザーインターフェースの調整や分析ツールの拡張を行っていくといいわね。

---

# Dead Simple Time Blocking With AI：設計総括

## プロジェクト概要

「Dead Simple Time Blocking With AI」は、タイムブロッキングとトラッキングを統合したターミナルベースのアプリケーションである。ユーザーが入力したタスクに対して、AI が所要時間の推測、カテゴリ分類、タイムブロックの生成を行い、実際のトラッキング結果から精度を継続的に向上させる。Node.js と TypeScript を用い、エリック・エヴァンスのドメイン駆動設計（DDD）とマーティン・ファウラーのスキーマ駆動開発の原則に基づいて設計されている。

## システム設計の基本理念

### 1. シンプルさの追求

ユーザーの責務を「タスクを入力する」「時間を計測する」という最小限に抑え、複雑な機能よりも堅牢で使いやすいインターフェースを優先する。

### 2. AI 活用の明確な境界

AI にはタスク自体の生成は任せず、「所要時間の推測」「カテゴリ分類」「タイムブロックの生成」「実績時間からの推測精度向上」という明確な役割を与える。

### 3. 関数型アプローチ

class を使わず、純粋関数とイミュータブルなデータ構造を活用し、副作用を限定することで、テスト容易性と保守性を確保する。

### 4. スキーマ駆動開発

zod などのライブラリを用いて、データ構造を厳格に定義し、型安全性とバリデーションを一元管理する。

## アーキテクチャ

システムは以下の 3 つのレイヤーで構成される：

### 1. ドメイン層

ビジネスロジックの中核を担い、以下のコンポーネントを含む：

- スキーマ定義（Task、TimeBlock、PredictionFlag 等）
- 型定義と不変オブジェクト
- ファクトリ関数とドメインコマンド
- ドメインサービス（予測、タイムブロック生成）

### 2. アプリケーション層

ユースケースを実装し、以下を提供する：

- アプリケーションサービス（タスク管理、タイムトラッキング）
- リポジトリインターフェース
- ユースケース間の調整

### 3. インフラストラクチャ層

外部との接続を担当し、以下を含む：

- リポジトリ実装（ファイルベース）
- AI クライアント（LLM 統合）
- TUI インターフェース（blessed/neo-blessed）

## ユビキタス言語

システム全体で一貫して使用される主要な概念は以下の通り：

1. **タスク (Task)** - 完了すべき作業単位
2. **タイムブロック (Time Block)** - スケジュール内の特定時間帯に割り当てられたタスク
3. **カテゴリ (Category)** - タスクの分類（仕事、学習、個人開発、家事など）
4. **予測 (Prediction)** - AI による所要時間やカテゴリの推測
5. **実績 (Actual)** - タスク完了後の実際の所要時間
6. **予測フラグ (Prediction Flag)** - 予測に対するユーザーフィードバック
7. **タイムトラッキング (Time Tracking)** - タスク実行時間の計測プロセス
8. **スケジュール (Schedule)** - 一日のタイムブロック集合

## 機能コンポーネント

### 1. タスク管理システム

ユーザーがタスクを入力し、AI が所要時間とカテゴリを予測する。zod スキーマでデータ構造を検証し、ファクトリ関数で不変オブジェクトを生成する。

### 2. タイムブロック生成エンジン

タスクの予測時間と優先度に基づいて、最適なスケジュールを自動生成する。関数型アプローチで柔軟かつテスト可能な設計を実現する。

### 3. タイムトラッキングシステム

シンプルなキー操作でタスクの開始、一時停止、完了を記録する。実績時間を保存し、AI モデルの学習に活用する。

### 4. 予測フラグシステム

ユーザーが予測結果に対してフィードバック（短すぎる、長すぎるなど）を提供できる機能。以下の要素で構成される：

- **FlagType 列挙型** - TOO_SHORT, TOO_LONG, ACCURATE, UNCERTAIN
- **PredictionFlag スキーマ** - フラグタイプ、コメント、作成日時
- **フラグ追加 UI** - キーボードショートカットで簡単に操作
- **フラグ学習機能** - ユーザーフィードバックを予測モデル改善に活用

### 5. AI サブシステム

以下の機能を担当する：

- タスク所要時間の予測
- カテゴリの自動分類
- 実績時間からの学習
- フラグフィードバックからの学習

## 実装アプローチ

### データフロー

1. ユーザーがタスクを入力
2. AI が所要時間とカテゴリを予測
3. タイムブロックが生成され表示される
4. ユーザーが作業を開始（タイマー起動）
5. 作業完了時に実績時間が記録される
6. 予測と実績の差異から AI が学習
7. 必要に応じてユーザーが予測にフラグを付ける
8. フラグ情報も学習に活用される

### 技術スタック

- **バックエンド**: Node.js, TypeScript
- **スキーマ管理**: Zod
- **ストレージ**: ローカル JSON ファイル（初期）、SQLite（拡張時）
- **AI 統合**: OpenAI API
- **UI**: blessed/neo-blessed (TUI)

### プロジェクト構造

```
src/
├── domain/              // ビジネスロジック
│   ├── schemas/         // Zodスキーマ定義
│   ├── types/           // 型定義
│   ├── factories/       // オブジェクト生成関数
│   ├── commands/        // 状態変更関数
│   └── services/        // ドメインサービス
├── application/         // ユースケース実装
│   ├── repositories/    // データアクセス抽象化
│   └── services/        // アプリケーションサービス
├── infrastructure/      // 外部システム連携
│   ├── repositories/    // データストレージ実装
│   ├── ai/              // AI統合
│   └── ui/              // TUIインターフェース
└── index.ts             // エントリーポイント
```

## 将来の拡張性

このアーキテクチャは、以下の拡張を容易にする：

1. **分析機能** - タスク完了パターンの可視化
2. **外部カレンダー連携** - 既存予定との統合
3. **ポモドーロ機能** - 集中・休憩サイクルの組み込み
4. **オフライン予測モデル** - ローカル実行可能な AI 予測
5. **マルチデバイス同期** - クラウド統合（オプショナル）

## まとめ

「Dead Simple Time Blocking With AI」は、シンプルさと効率を核に据えたタイムマネジメントツールである。ドメイン駆動設計とスキーマ駆動開発の原則に従い、関数型アプローチでクリーンで保守性の高いコードベースを実現する。AI の力を活用しつつも、その役割を明確に限定することで、ユーザーエクスペリエンスの一貫性と予測可能性を確保している。ユーザーフィードバック（予測フラグ）システムにより、AI の予測精度を継続的に向上させる学習ループを構築し、時間管理の効率化を支援する。

---

# Dead Simple Time Blocking With AI: 既存の定義一覧

## ドメインモデル定義

### タスク関連定義

```typescript
// タスクID
export const TaskIdSchema = z.string().uuid();
export type TaskId = z.infer<typeof TaskIdSchema>;

// タスク名
export const TaskNameSchema = z.string().min(1).max(100);

// 所要時間（分単位）
export const DurationSchema = z.number().int().positive();

// タスクカテゴリ
export const CategorySchema = z.enum([
  'WORK',
  'PERSONAL_DEV',
  'HOUSEHOLD',
  'LEARNING',
  'OTHER',
]);
export type Category = z.infer<typeof CategorySchema>;

// タスクステータス
export const TaskStatusSchema = z.enum([
  'NOT_STARTED',
  'IN_PROGRESS',
  'COMPLETED',
  'DEFERRED',
]);
export type TaskStatus = z.infer<typeof TaskStatusSchema>;

// 予測フラグタイプ
export const FlagTypeSchema = z.enum([
  'TOO_SHORT',
  'TOO_LONG',
  'ACCURATE',
  'UNCERTAIN',
]);
export type FlagType = z.infer<typeof FlagTypeSchema>;

// 予測フラグ
export const PredictionFlagSchema = z.object({
  type: FlagTypeSchema,
  userComment: z.string().optional(),
  createdAt: z.date(),
});
export type PredictionFlag = z.infer<typeof PredictionFlagSchema>;

// タスク本体
export const TaskSchema = z.object({
  id: TaskIdSchema,
  name: TaskNameSchema,
  description: z.string().optional(),
  estimatedDuration: DurationSchema,
  actualDuration: DurationSchema.optional(),
  category: CategorySchema,
  status: TaskStatusSchema,
  createdAt: z.date(),
  completedAt: z.date().optional(),
  predictionFlag: PredictionFlagSchema.optional(),
});
export type Task = z.infer<typeof TaskSchema>;
export type ReadonlyTask = Readonly<Task>;
```

### タイムブロック関連定義

```typescript
// タイムブロックID
export const TimeBlockIdSchema = z.string().uuid();
export type TimeBlockId = z.infer<typeof TimeBlockIdSchema>;

// タイムブロック
export const TimeBlockSchema = z.object({
  id: TimeBlockIdSchema,
  taskId: TaskIdSchema,
  startTime: z.date(),
  endTime: z.date(),
  isCompleted: z.boolean(),
});
export type TimeBlock = z.infer<typeof TimeBlockSchema>;
export type ReadonlyTimeBlock = Readonly<TimeBlock>;

// スケジュール
export const ScheduleSchema = z.object({
  date: z.date(),
  timeBlocks: z.array(TimeBlockSchema),
});
export type Schedule = z.infer<typeof ScheduleSchema>;
```

## リポジトリインターフェース定義

### タスクリポジトリ

```typescript
export interface TaskRepository {
  findById: (id: TaskId) => Promise<ReadonlyTask | null>;
  findAll: () => Promise<ReadonlyTask[]>;
  save: (task: ReadonlyTask) => Promise<void>;
  update: (task: ReadonlyTask) => Promise<void>;
  delete: (id: TaskId) => Promise<void>;
}
```

### タイムブロックリポジトリ

```typescript
export interface TimeBlockRepository {
  findById: (id: TimeBlockId) => Promise<ReadonlyTimeBlock | null>;
  findByTaskId: (taskId: TaskId) => Promise<ReadonlyTimeBlock[]>;
  findByDateRange: (
    startDate: Date,
    endDate: Date
  ) => Promise<ReadonlyTimeBlock[]>;
  save: (timeBlock: ReadonlyTimeBlock) => Promise<void>;
  update: (timeBlock: ReadonlyTimeBlock) => Promise<void>;
  delete: (id: TimeBlockId) => Promise<void>;
}
```

## サービスインターフェース定義

### 予測サービス

```typescript
export interface PredictionService {
  estimateTaskDuration: (
    taskName: string,
    category?: Category
  ) => Promise<number>;
  classifyTaskCategory: (taskName: string) => Promise<Category>;
  learnFromCompletedTask: (task: ReadonlyTask) => Promise<void>;
  learnFromFlag: (task: ReadonlyTask) => Promise<void>;
  analyzeFlags: () => Promise<FlagAnalysis>;
}

export interface FlagAnalysis {
  totalFlagged: number;
  flagCounts: {
    TOO_SHORT: number;
    TOO_LONG: number;
    ACCURATE: number;
    UNCERTAIN: number;
  };
  // その他の分析結果
}
```

### タイムブロックサービス

```typescript
export interface TimeBlockService {
  generateTimeBlocks: (
    tasks: ReadonlyTask[],
    startTime: Date,
    endTime: Date
  ) => TimeBlock[];
  getTodayBlocks: () => Promise<ReadonlyTimeBlock[]>;
  rescheduleTask: (
    taskId: TaskId,
    newStartTime: Date
  ) => Promise<ReadonlyTimeBlock>;
}
```

## ユビキタス言語定義

### コアコンセプト

1. **タスク (Task)**
   - 定義: 完了すべき単一の作業単位
   - 属性: ID、名前、説明、予測所要時間、実績時間、カテゴリ、ステータス
   - ステータス: 未開始、進行中、完了、延期
2. **タイムブロック (Time Block)**
   - 定義: スケジュール内の特定の時間帯に割り当てられたタスク
   - 属性: ID、関連タスク ID、開始時間、終了時間、完了フラグ
3. **カテゴリ (Category)**
   - 定義: タスクの分類
   - 例: 仕事、学習、個人開発、家事、その他
4. **予測 (Prediction)**
   - 定義: AI によるタスクの所要時間とカテゴリの推測
   - 要素: 予測所要時間、予測カテゴリ、信頼度スコア
5. **実績 (Actual)**
   - 定義: タスク完了後の実際の所要時間とカテゴリ
   - 要素: 実績所要時間、実際のカテゴリ
6. **予測フラグ (Prediction Flag)**
   - 定義: ユーザーが予測結果に対して付与する評価マーカー
   - タイプ: 短すぎる、長すぎる、適切、不確か
7. **スケジュール (Schedule)**
   - 定義: 一日のタイムブロックの集合
   - 属性: 日付、タイムブロックリスト
8. **タイムトラッキング (Time Tracking)**
   - 定義: タスクの開始から完了までの時間を計測するプロセス
   - 操作: 開始、一時停止、再開、完了
9. **AI モデル (AI Model)**
   - 定義: タスクの予測を行う機械学習モデル
   - 機能: 所要時間予測、カテゴリ分類、学習・更新

### 操作と概念

10. **ブロッキング (Blocking)**
    - 定義: タスクをスケジュール内の特定の時間帯に割り当てるプロセス
11. **最適化 (Optimization)**
    - 定義: タスクの優先度と予測時間に基づいてスケジュールを効率的に調整すること
12. **バッファ (Buffer)**
    - 定義: タスク間に設ける余裕時間
    - 目的: 予期せぬ遅延や休憩のための時間確保
13. **オーバーフロー (Overflow)**
    - 定義: スケジュールに収まりきらないタスク
    - 処理: 次の日程への自動移動または優先度再評価
14. **フォーカスセッション (Focus Session)**
    - 定義: 集中して作業を行う一定の時間枠
    - 特徴: 通知やインタラプトを制限
15. **振り返り (Review)**
    - 定義: 完了したタスクと実績時間を分析するプロセス
    - 目的: 予測精度の向上と生産性の分析

## アーキテクチャ定義

### プロジェクト構造

```
src/
├── domain/              // ドメイン層
│   ├── schemas/         // スキーマ定義
│   ├── types/           // 型定義
│   ├── factories/       // ファクトリ関数
│   ├── commands/        // コマンド関数
│   └── services/        // ドメインサービス
├── application/         // アプリケーション層
│   ├── repositories/    // リポジトリインターフェース
│   └── services/        // アプリケーションサービス
├── infrastructure/      // インフラストラクチャ層
│   ├── repositories/    // リポジトリ実装
│   ├── ai/              // AI関連の実装
│   └── ui/              // TUI実装
└── index.ts             // エントリーポイント
```

### レイヤー構造

1. **ドメイン層**
   - 役割: ビジネスロジックの中核を担う
   - コンポーネント: スキーマ、型定義、ファクトリ、コマンド、ドメインサービス
2. **アプリケーション層**
   - 役割: ユースケースを実装し、ドメイン層を調整する
   - コンポーネント: アプリケーションサービス、リポジトリインターフェース
3. **インフラストラクチャ層**
   - 役割: 外部システムとの接続を担当する
   - コンポーネント: リポジトリ実装、AI クライアント、TUI インターフェース

### 境界づけられたコンテキスト

1. **タスク管理コンテキスト**
   - 責務: タスクの作成・編集・分類
2. **タイムブロッキングコンテキスト**
   - 責務: スケジュール生成と管理
3. **タイムトラッキングコンテキスト**
   - 責務: 実行時間の記録と分析
4. **予測コンテキスト**
   - 責務: AI による時間予測と学習

これらの定義が、「Dead Simple Time Blocking With AI」アプリケーションの設計基盤を形成しています。スキーマ駆動開発により型安全性が確保され、ドメイン駆動設計によりビジネスロジックが明確に分離されています。関数型アプローチを採用することで、テスト容易性と保守性の高いコードベースを実現しています。

---

# Dead Simple Time Blocking With AI: 命名ガイド

効果的な命名は、コードの可読性と保守性を高め、ドメイン駆動設計における重要な要素となります。このアプリケーションの命名について体系的に考えてみましょう。

## アプリケーション名

現在の作業名「Dead Simple Time Blocking With AI」は説明的ですが、製品名としては長いため、以下の候補を提案します：

1. **TimeBlox** - タイムブロックと積み木(blocks)の造語で、シンプルで覚えやすい
2. **BlockWise** - タイムブロックと AI の賢さを連想させる
3. **Chronos** - ギリシャ神話の時間の神、簡潔かつ強い
4. **FlowTime** - 時間の流れと作業のフロー状態を表現
5. **TimeSage** - 時間の賢者、AI の予測能力を暗示

TUI アプリケーションとしての特性を考慮すると、コマンド名として短い名前も有効です：

- **timeb** または **tblk** - Unix コマンド風の簡潔な名前

## ドメインモデルの命名

### 現在の命名の評価と提案

#### エンティティとバリューオブジェクト

| 現在の命名     | 評価       | 代替提案           |
| :------------- | :--------- | :----------------- |
| Task           | 適切       | WorkItem           |
| TimeBlock      | 適切       | ScheduleSlot       |
| Category       | やや一般的 | TaskCategory       |
| PredictionFlag | 技術的     | PredictionFeedback |

#### タイプとスキーマ

| 現在の命名       | 評価           | 代替提案       |
| :--------------- | :------------- | :------------- |
| TaskIdSchema     | 技術実装を露出 | TaskIdentifier |
| TaskStatusSchema | 技術実装を露出 | TaskState      |
| FlagTypeSchema   | 技術実装を露出 | FeedbackType   |
| DurationSchema   | 技術実装を露出 | TimeDuration   |

#### 列挙型

| 現在の命名                                     | 評価 | 代替提案 |
| :--------------------------------------------- | :--- | :------- |
| NOT_STARTED, IN_PROGRESS, COMPLETED, DEFERRED  | 適切 | -        |
| TOO_SHORT, TOO_LONG, ACCURATE, UNCERTAIN       | 適切 | -        |
| WORK, PERSONAL_DEV, HOUSEHOLD, LEARNING, OTHER | 適切 | -        |

## サービスとリポジトリの命名

### サービス

| 現在の命名             | 評価           | 代替提案              |
| :--------------------- | :------------- | :-------------------- |
| PredictionService      | 一般的         | TaskDurationPredictor |
| TimeBlockService       | 一般的         | SchedulePlanner       |
| TaskApplicationService | 一般的だが明確 | TaskManager           |

### リポジトリ

| 現在の命名          | 評価           | 代替提案           |
| :------------------ | :------------- | :----------------- |
| TaskRepository      | DDD 慣習に準拠 | -                  |
| TimeBlockRepository | DDD 慣習に準拠 | ScheduleRepository |

## 関数とメソッドの命名

### 現在の命名と改善案

| 現在の命名             | 評価             | 代替提案            |
| :--------------------- | :--------------- | :------------------ |
| findById               | 標準的           | getTaskById         |
| save                   | 標準的だが汎用的 | storeTask           |
| update                 | 標準的だが汎用的 | updateTask          |
| createTask             | 明確             | -                   |
| startTask              | 明確だがやや曖昧 | beginTaskExecution  |
| completeTask           | 明確             | finalizeTask        |
| estimateTaskDuration   | 明確             | -                   |
| classifyTaskCategory   | 明確             | -                   |
| learnFromCompletedTask | 明確             | -                   |
| learnFromFlag          | やや曖昧         | incorporateFeedback |
| generateTimeBlocks     | 明確             | -                   |

## TUI コンポーネントの命名

| 現在の命名   | 評価           | 代替提案          |
| :----------- | :------------- | :---------------- |
| taskListBox  | 実装詳細を露出 | taskInventory     |
| timeBlockBox | 実装詳細を露出 | scheduleView      |
| timerBox     | 実装詳細を露出 | activeTaskMonitor |
| taskForm     | 実装詳細を露出 | taskCreationPanel |
| flagForm     | 実装詳細を露出 | feedbackPanel     |

## ファイル構造と命名規則

### ファイル命名規則

1. **モジュールファイル**: ケバブケース `task-repository.ts`
2. **型定義ファイル**: ケバブケース `task-types.ts`
3. **スキーマファイル**: ケバブケース `task-schemas.ts`
4. **テストファイル**: 対象ファイル名 + `.test.ts` で `task-repository.test.ts`

### ディレクトリ構造

```
src/
├── domain/
│   ├── schemas/         // task-schemas.ts, time-block-schemas.ts
│   ├── types/           // task-types.ts, time-block-types.ts
│   ├── factories/       // task-factory.ts
│   ├── commands/        // task-commands.ts
│   └── services/        // prediction-service.ts, schedule-service.ts
├── application/
│   ├── repositories/    // task-repository.ts
│   └── services/        // task-manager.ts, schedule-manager.ts
├── infrastructure/
│   ├── repositories/    // file-task-repository.ts
│   ├── ai/              // openai-client.ts
│   └── ui/              // tui-app.ts, task-view.ts
└── index.ts
```

## ユビキタス言語の命名改善

### 改善案

| 現在の用語         | 評価         | 代替提案           |
| :----------------- | :----------- | :----------------- |
| タスク             | 適切         | -                  |
| タイムブロック     | 適切だが長い | タイムスロット     |
| カテゴリ           | やや一般的   | タスク種別         |
| 予測               | 適切         | -                  |
| 実績               | 適切         | -                  |
| 予測フラグ         | やや技術的   | 予測フィードバック |
| スケジュール       | 適切         | -                  |
| タイムトラッキング | 適切だが長い | 作業記録           |
| AI モデル          | 技術的       | 予測エンジン       |
| ブロッキング       | 技術的       | 時間割り当て       |
| バッファ           | 技術的       | 余裕時間           |
| オーバーフロー     | 技術的       | 時間超過           |

## 命名の一般原則

1. **明確性**: 名前だけで目的が理解できるようにする
2. **一貫性**: 同じ概念に対して同じ命名パターンを使用する
3. **ドメイン中心**: 技術的実装よりもドメイン概念を反映する
4. **簡潔性**: 不必要に長い名前は避ける
5. **抽象レベルの一致**: 同じコンテキスト内では同じ抽象レベルの命名を使用する

## 命名規約

1. **型とクラス**: パスカルケース (`TaskState`, `TimeBlock`)
2. **関数と変数**: キャメルケース (`estimateTaskDuration`, `currentTask`)
3. **定数**: 大文字スネークケース (`DEFAULT_DURATION`, `MAX_TASKS`)
4. **列挙型の値**: 大文字スネークケース (`NOT_STARTED`, `WORK`)
5. **ファイル**: ケバブケース (`task-repository.ts`)
6. **ディレクトリ**: 単数形で短い名前 (`domain/`, `types/`)

## まとめ

アプリケーション名としては「**TimeBlox**」が簡潔で覚えやすく、機能を反映している点でおすすめです。ドメインモデルとサービスの命名は、技術的な実装の詳細よりもドメイン概念を表現するように改善すると、コードの意図がより明確になります。

命名の一貫性は、コードの可読性を大きく向上させるため、プロジェクト全体で統一された命名規則を採用することが重要です。特に DDD アプローチでは、開発チームとドメインエキスパート（この場合はユーザー自身）が同じ言葉で会話できることが価値を生み出します。

---

# TimeBlox: AI-Assisted Time Blocking TUI Application

TimeBlox は、AI 支援のタイムブロッキングを実現するターミナルベースアプリケーションです。Node.js と TypeScript を使用し、ドメイン駆動設計（DDD）とスキーマ駆動開発の原則に基づいて設計されています。以下に、改善された命名を反映した設計概要を示します。

## ドメインモデル定義

### タスク関連定義

```typescript
// src/domain/schemas/task-schemas.ts
import { z } from 'zod';

export const TaskIdentifier = z.string().uuid();
export type TaskId = z.infer<typeof TaskIdentifier>;

export const TaskName = z.string().min(1).max(100);

export const TimeDuration = z.number().int().positive();

export const TaskCategory = z.enum([
  'WORK',
  'PERSONAL_DEV',
  'HOUSEHOLD',
  'LEARNING',
  'OTHER',
]);
export type Category = z.infer<typeof TaskCategory>;

export const TaskState = z.enum([
  'NOT_STARTED',
  'IN_PROGRESS',
  'COMPLETED',
  'DEFERRED',
]);
export type State = z.infer<typeof TaskState>;

export const FeedbackType = z.enum([
  'TOO_SHORT',
  'TOO_LONG',
  'ACCURATE',
  'UNCERTAIN',
]);
export type Feedback = z.infer<typeof FeedbackType>;

export const PredictionFeedback = z.object({
  type: FeedbackType,
  userComment: z.string().optional(),
  createdAt: z.date(),
});
export type Feedback = z.infer<typeof PredictionFeedback>;

export const WorkItem = z.object({
  id: TaskIdentifier,
  name: TaskName,
  description: z.string().optional(),
  estimatedDuration: TimeDuration,
  actualDuration: TimeDuration.optional(),
  category: TaskCategory,
  state: TaskState,
  createdAt: z.date(),
  completedAt: z.date().optional(),
  predictionFeedback: PredictionFeedback.optional(),
});
export type Task = z.infer<typeof WorkItem>;
export type ReadonlyTask = Readonly<Task>;
```

### スケジュール関連定義

```typescript
// src/domain/schemas/schedule-schemas.ts
import { z } from 'zod';
import { TaskIdentifier } from './task-schemas';

export const ScheduleSlotIdentifier = z.string().uuid();
export type TimeBlockId = z.infer<typeof ScheduleSlotIdentifier>;

export const ScheduleSlot = z.object({
  id: ScheduleSlotIdentifier,
  taskId: TaskIdentifier,
  startTime: z.date(),
  endTime: z.date(),
  isCompleted: z.boolean(),
});
export type TimeBlock = z.infer<typeof ScheduleSlot>;
export type ReadonlyTimeBlock = Readonly<TimeBlock>;

export const DailySchedule = z.object({
  date: z.date(),
  timeSlots: z.array(ScheduleSlot),
});
export type Schedule = z.infer<typeof DailySchedule>;
```

## リポジトリインターフェース定義

```typescript
// src/application/repositories/task-repository.ts
export interface TaskRepository {
  getTaskById: (id: TaskId) => Promise<ReadonlyTask | null>;
  getAllTasks: () => Promise<ReadonlyTask[]>;
  storeTask: (task: ReadonlyTask) => Promise<void>;
  updateTask: (task: ReadonlyTask) => Promise<void>;
  removeTask: (id: TaskId) => Promise<void>;
}

// src/application/repositories/schedule-repository.ts
export interface ScheduleRepository {
  getTimeBlockById: (id: TimeBlockId) => Promise<ReadonlyTimeBlock | null>;
  getTimeBlocksByTaskId: (taskId: TaskId) => Promise<ReadonlyTimeBlock[]>;
  getTimeBlocksByDateRange: (
    startDate: Date,
    endDate: Date
  ) => Promise<ReadonlyTimeBlock[]>;
  storeTimeBlock: (timeBlock: ReadonlyTimeBlock) => Promise<void>;
  updateTimeBlock: (timeBlock: ReadonlyTimeBlock) => Promise<void>;
  removeTimeBlock: (id: TimeBlockId) => Promise<void>;
}
```

## サービスインターフェース定義

```typescript
// src/domain/services/task-duration-predictor.ts
export interface TaskDurationPredictor {
  estimateTaskDuration: (
    taskName: string,
    category?: Category
  ) => Promise<number>;
  classifyTaskCategory: (taskName: string) => Promise<Category>;
  learnFromCompletedTask: (task: ReadonlyTask) => Promise<void>;
  incorporateFeedback: (task: ReadonlyTask) => Promise<void>;
  analyzeFeedbacks: () => Promise<FeedbackAnalysis>;
}

export interface FeedbackAnalysis {
  totalFeedbacks: number;
  feedbackCounts: {
    TOO_SHORT: number;
    TOO_LONG: number;
    ACCURATE: number;
    UNCERTAIN: number;
  };
  // その他の分析結果
}

// src/domain/services/schedule-planner.ts
export interface SchedulePlanner {
  generateTimeSlots: (
    tasks: ReadonlyTask[],
    startTime: Date,
    endTime: Date
  ) => TimeBlock[];
  getTodaySlots: () => Promise<ReadonlyTimeBlock[]>;
  rescheduleTask: (
    taskId: TaskId,
    newStartTime: Date
  ) => Promise<ReadonlyTimeBlock>;
}
```

## アプリケーションサービス定義

```typescript
// src/application/services/task-manager.ts
export const createTaskManager = (
  taskRepository: TaskRepository,
  taskDurationPredictor: TaskDurationPredictor
) => {
  return {
    async createTaskWithPrediction(
      name: string,
      description?: string
    ): Promise<ReadonlyTask> {
      const category = await taskDurationPredictor.classifyTaskCategory(name);
      const estimatedDuration =
        await taskDurationPredictor.estimateTaskDuration(name, category);
      const newTask = createTask(
        name,
        estimatedDuration,
        category,
        description
      );
      await taskRepository.storeTask(newTask);
      return newTask;
    },

    async beginTaskExecution(id: TaskId): Promise<ReadonlyTask | null> {
      const task = await taskRepository.getTaskById(id);
      if (!task) return null;
      const updatedTask = startTask(task);
      await taskRepository.updateTask(updatedTask);
      return updatedTask;
    },

    async finalizeTask(
      id: TaskId,
      actualDuration: number
    ): Promise<ReadonlyTask | null> {
      const task = await taskRepository.getTaskById(id);
      if (!task) return null;
      const completedTask = completeTask(task, actualDuration);
      await taskRepository.updateTask(completedTask);
      await taskDurationPredictor.learnFromCompletedTask(completedTask);
      return completedTask;
    },

    async addPredictionFeedback(
      taskId: string,
      feedbackType: Feedback,
      userComment?: string
    ): Promise<ReadonlyTask> {
      const task = await taskRepository.getTaskById(taskId);
      if (!task) throw new Error('Task not found');

      const updatedTask: Task = {
        ...task,
        predictionFeedback: {
          type: feedbackType,
          userComment,
          createdAt: new Date(),
        },
      };

      await taskRepository.updateTask(updatedTask);
      await taskDurationPredictor.incorporateFeedback(updatedTask);

      return updatedTask;
    },

    async getFlaggedTasks(): Promise<ReadonlyTask[]> {
      const tasks = await taskRepository.getAllTasks();
      return tasks.filter((task) => task.predictionFeedback !== undefined);
    },
  };
};
```

## TUI コンポーネント設計

```typescript
// src/infrastructure/ui/tui-app.ts
import * as blessed from 'blessed';
import { TaskManager } from '../../application/services/task-manager';
import { SchedulePlanner } from '../../domain/services/schedule-planner';

export const createTuiApp = (
  taskManager: TaskManager,
  schedulePlanner: SchedulePlanner
) => {
  const screen = blessed.screen({
    smartCSR: true,
    title: 'TimeBlox',
  });

  const taskInventory = blessed.list({
    // ... 設定
  });

  const scheduleView = blessed.box({
    // ... 設定
  });

  const activeTaskMonitor = blessed.box({
    // ... 設定
  });

  const taskCreationPanel = blessed.form({
    // ... 設定
  });

  const feedbackPanel = blessed.form({
    // ... 設定
  });

  // ... その他のUI関連コード

  return {
    start: () => {
      // ... アプリケーション起動ロジック
    },
  };
};
```

## プロジェクト構造

```
src/
├── domain/
│   ├── schemas/         // task-schemas.ts, schedule-schemas.ts
│   ├── types/           // task-types.ts, schedule-types.ts
│   ├── factories/       // task-factory.ts
│   ├── commands/        // task-commands.ts
│   └── services/        // task-duration-predictor.ts, schedule-planner.ts
├── application/
│   ├── repositories/    // task-repository.ts, schedule-repository.ts
│   └── services/        // task-manager.ts, schedule-manager.ts
├── infrastructure/
│   ├── repositories/    // file-task-repository.ts, file-schedule-repository.ts
│   ├── ai/              // openai-client.ts
│   └── ui/              // tui-app.ts, task-view.ts, schedule-view.ts
└── index.ts
```

この改訂版では、より明確で一貫性のある命名規則を適用し、ドメイン概念をより適切に反映するように努めました。例えば、`Task`を`WorkItem`に、`TimeBlock`を`ScheduleSlot`に変更し、技術的な実装の詳細を示す名前（例：`TaskSchema`）を避けています。また、関数名もより具体的になり（例：`save`から`storeTask`へ）、その目的がより明確になっています。

これらの変更により、コードベースはより読みやすく、ドメイン駆動設計の原則に沿ったものとなり、開発者とドメインエキスパート（ユーザー）の間のコミュニケーションが改善されることが期待されます。

---
