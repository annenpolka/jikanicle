/**
 * 設定ファイル保存モジュール
 *
 * アプリケーション設定をファイルに保存するためのユーティリティです。
 * DDD原則に基づき、インフラストラクチャ層に位置します。
 */
import fs from 'fs';
import path from 'path';
import type { Result } from 'neverthrow';
import { err, ok } from 'neverthrow';
import type { z } from 'zod';
import type { AppConfig } from './config-schema.js';
import { APP_CONFIG_SCHEMA } from './config-schema.js';

/**
 * 設定保存エラーの型
 */
export type ConfigSaveError =
  | { readonly type: 'VALIDATION_ERROR'; readonly message: string; readonly details?: z.ZodError }
  | { readonly type: 'IO_ERROR'; readonly message: string; readonly cause?: unknown };

/**
 * 設定ファイル保存オプション
 */
export type ConfigSaveOptions = {
  /** 保存先ファイルパス（デフォルト: カレントディレクトリの jikanicle.config.json） */
  readonly filePath?: string;
  /** 整形オプション（JSON.stringifyの第3引数、デフォルト: 2スペース） */
  readonly indent?: number | string;
  /** 既存ファイルが存在する場合に上書きするか */
  readonly overwrite?: boolean;
};

/**
 * デフォルトの保存オプション
 */
const DEFAULT_SAVE_OPTIONS: Required<ConfigSaveOptions> = {
  filePath: path.join(process.cwd(), 'jikanicle.config.json'),
  indent: 2,
  overwrite: true
};

/**
 * 設定をファイルに保存する関数
 *
 * 指定されたパスに設定をJSON形式で保存します。
 * まず設定の内容をバリデーションし、問題がなければファイルに書き込みます。
 *
 * @param config 保存する設定オブジェクト
 * @param options 保存オプション
 * @returns 成功時は保存した設定ファイルのパス、失敗時はエラー情報
 */
export async function saveConfig(
  config: AppConfig,
  options: ConfigSaveOptions = {}
): Promise<Result<string, ConfigSaveError>> {
  const opts: Required<ConfigSaveOptions> = { ...DEFAULT_SAVE_OPTIONS, ...options };

  try {
    // 設定内容のバリデーション
    const validationResult = APP_CONFIG_SCHEMA.safeParse(config);
    if (!validationResult.success) {
      return err({
        type: 'VALIDATION_ERROR',
        message: '設定の形式が正しくありません',
        details: validationResult.error
      });
    }

    // 保存先のディレクトリが存在するか確認し、なければ作成
    const targetDir = path.dirname(opts.filePath);
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }

    // 既存ファイルのチェック
    if (fs.existsSync(opts.filePath) && !opts.overwrite) {
      return err({
        type: 'IO_ERROR',
        message: `ファイルが既に存在します: ${opts.filePath}`
      });
    }

    // 設定をJSON形式で保存
    const configJson = JSON.stringify(validationResult.data, null, opts.indent);
    fs.writeFileSync(opts.filePath, configJson, 'utf8');

    return ok(opts.filePath);
  } catch (error) {
    return err({
      type: 'IO_ERROR',
      message: '設定ファイルの保存中にエラーが発生しました',
      cause: error
    });
  }
}