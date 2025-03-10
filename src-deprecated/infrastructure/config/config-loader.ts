/**
 * 設定ファイル読み込みモジュール
 *
 * lilconfigを使用して設定ファイルを読み込む機能を提供します。
 * 複数の設定ファイル形式とパスに対応しています。
 */
import { lilconfig } from 'lilconfig';
import type { Result } from 'neverthrow';
import { err, ok } from 'neverthrow';
import type { z } from 'zod';
import type { AppConfig } from './config-schema.js';
import { APP_CONFIG_SCHEMA, DEFAULT_CONFIG } from './config-schema.js';

// 設定ファイル検索のためのオプション
const CONFIG_SEARCH_OPTIONS = Object.freeze({
  // 検索するファイル名（優先度順）
  searchPlaces: [
    'jikanicle.config.js',
    'jikanicle.config.json',
    '.jikaniclerc',
    '.jikaniclerc.json',
    'package.json'
  ],
  // package.jsonの場合の設定キー
  packageProp: 'jikanicle'
});

/**
 * 設定読み込みのエラー型
 */
export type ConfigLoadError =
  | { readonly type: 'NOT_FOUND'; readonly message: string }
  | { readonly type: 'INVALID_FORMAT'; readonly message: string; readonly cause?: z.ZodError }
  | { readonly type: 'IO_ERROR'; readonly message: string; readonly cause?: unknown };

/**
 * 設定読み込みオプション
 */
export type ConfigLoaderOptions = {
  readonly useDefaultOnNotFound?: boolean;
  readonly searchOptions?: typeof CONFIG_SEARCH_OPTIONS;
}

/**
 * 設定ファイルを読み込む関数
 *
 * @param options 読み込みオプション
 * @returns 読み込んだ設定、またはエラー
 */
export async function loadConfig(options: ConfigLoaderOptions = {}): Promise<Result<AppConfig, ConfigLoadError>> {
  try {
    // lilconfigを使用して設定ファイルを探索
    const searchOptions = options.searchOptions ?? CONFIG_SEARCH_OPTIONS;
    console.log('Searching for config with options:', JSON.stringify(searchOptions));
    const explorer = lilconfig('jikanicle', searchOptions);
    const result = await explorer.search();

    // 設定ファイルが見つからなかった場合
    if (!result) {
      if (options.useDefaultOnNotFound === true) {
        return ok(DEFAULT_CONFIG);
      }
      return err({
        type: 'NOT_FOUND',
        message: '設定ファイルが見つかりませんでした'
      });
    }

    // 設定ファイルが見つかった場合のパスとコンテンツをログ
    console.log('Found config file at:', result.filepath, 'with content:', JSON.stringify(result.config));

    // 読み込んだ設定をスキーマでバリデーション
    const validationResult = APP_CONFIG_SCHEMA.safeParse(result.config);

    if (!validationResult.success) {
      return err({
        type: 'INVALID_FORMAT',
        message: `設定ファイルのバリデーションに失敗しました: ${validationResult.error.message}`,
        cause: validationResult.error
      });
    }

    return ok(validationResult.data);
  } catch (error) {
    return err({
      type: 'IO_ERROR',
      message: `設定ファイルの読み込みに失敗しました: ${error instanceof Error ? error.message : String(error)}`,
      cause: error
    });
  }
}

export default loadConfig;