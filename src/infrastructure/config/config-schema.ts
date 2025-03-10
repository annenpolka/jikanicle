/**
 * 設定ファイルのスキーマ定義
 *
 * このファイルではアプリケーション設定のスキーマとデフォルト値を定義します。
 * zodを使用して型安全な設定バリデーションを行います。
 */
import { z } from 'zod';

/**
 * リポジトリ設定のスキーマ
 */
export const REPOSITORY_CONFIG_SCHEMA = z.object({
  /** ファイルリポジトリの設定 */
  /** タスクデータを保存するディレクトリパス */
  dataDirectory: z.string().default('./data'),
  /** データファイルの拡張子 */
  fileExtension: z.string().default('.json'),

  /** 将来の拡張のための追加設定エリア */
  options: z.record(z.unknown()).optional()
});

/**
 * アプリケーションのアクション種別
 */
export const ACTION_TYPE = z.enum([
  'CREATE_TASK',   // タスク作成
  'EDIT_TASK',     // タスク編集
  'DELETE_TASK',   // タスク削除
  'COMPLETE_TASK', // タスク完了
  'VIEW_TASK',     // タスク詳細表示
  'LIST_TASKS',    // タスク一覧表示
  'HELP',          // ヘルプ表示
  'QUIT'           // アプリケーション終了
]);

/**
 * アクション種別型
 */
export type ActionTypeEnum = z.infer<typeof ACTION_TYPE>;

/**
 * キーバインディング設定のスキーマ
 */
export const KEY_BINDINGS_SCHEMA = z.record(ACTION_TYPE, z.string());

/**
 * UIの設定スキーマ
 */
export const UI_CONFIG_SCHEMA = z.object({
  /** テーマ設定 */
  theme: z.union([
    // 互換性のため文字列も受け付ける
    z.enum(['light', 'dark', 'system']),
    // オブジェクト形式でのテーマ設定
    z.object({
      primaryColor: z.string().default('blue'),
      secondaryColor: z.string().default('white')
    })
  ]).default('system'),

  /** キーバインディング設定 */
  keyBindings: KEY_BINDINGS_SCHEMA.default({
    CREATE_TASK: 'c',
    EDIT_TASK: 'e',
    DELETE_TASK: 'd',
    COMPLETE_TASK: 'x',
    VIEW_TASK: 'v',
    LIST_TASKS: 'l',
    HELP: 'h',
    QUIT: 'q'
  })
});

/**
 * アプリケーション全体の設定スキーマ
 */
export const APP_CONFIG_SCHEMA = z.object({
  /** アプリケーション名 */
  appName: z.string().default('Jikanicle'),

  /** リポジトリ設定 */
  repository: REPOSITORY_CONFIG_SCHEMA.default({
    dataDirectory: './data',
    fileExtension: '.json'
  }),

  /** UI設定 */
  ui: UI_CONFIG_SCHEMA.default({
    theme: 'system',
    keyBindings: {
      CREATE_TASK: 'c',
      EDIT_TASK: 'e',
      DELETE_TASK: 'd',
      COMPLETE_TASK: 'x',
      VIEW_TASK: 'v',
      LIST_TASKS: 'l',
      HELP: 'h',
      QUIT: 'q'
    }
  })
});

/**
 * 設定オブジェクトの型
 */
export type AppConfig = z.infer<typeof APP_CONFIG_SCHEMA>;

/**
 * デフォルト設定
 */
export const DEFAULT_CONFIG: AppConfig = {
  appName: 'Jikanicle',
  repository: {
    dataDirectory: './data',
    fileExtension: '.json'
  },
  ui: {
    theme: 'system',
    keyBindings: {
      CREATE_TASK: 'c',
      EDIT_TASK: 'e',
      DELETE_TASK: 'd',
      COMPLETE_TASK: 'x',
      VIEW_TASK: 'v',
      LIST_TASKS: 'l',
      HELP: 'h',
      QUIT: 'q'
    }
  }
};