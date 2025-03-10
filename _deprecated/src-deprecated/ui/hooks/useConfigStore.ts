/**
 * 設定ストアのカスタムフック
 *
 * 設定ファイルの読み込み・保存機能を提供します。lilconfigを使用した設定の読み込みと、ファイルシステムを使用した設定の保存を行います。
 */
import { useState, useCallback, useEffect } from 'react';
import { ok, err } from 'neverthrow';
import type { Result } from 'neverthrow';
import type { AppConfig } from '../../infrastructure/config/config-schema.js';
import { DEFAULT_CONFIG } from '../../infrastructure/config/config-schema.js';

// 設定ファイルの読み込みと保存機能
import { loadConfig as loadConfigFromFile } from '../../infrastructure/config/config-loader.js';
import { saveConfig } from '../../infrastructure/config/config-saver.js';
import type { ConfigLoadError, ConfigLoaderOptions } from '../../infrastructure/config/config-loader.js';
import type { ConfigSaveError, ConfigSaveOptions } from '../../infrastructure/config/config-saver.js';

/**
 * 設定ストアのエラー型
 */
type ConfigStoreError =
  | { readonly type: 'LOAD_ERROR'; readonly message: string }
  | { readonly type: 'SAVE_ERROR'; readonly message: string }
  | { readonly type: 'VALIDATION_ERROR'; readonly message: string };

/**
 * config-loaderからConfigStoreErrorに変換する関数
 *
 * @param error ConfigLoaderからのエラーオブジェクト
 * @returns ConfigStoreError型に変換されたエラー
 */
function mapLoadErrorToStoreError(error: ConfigLoadError): ConfigStoreError {
  switch (error.type) {
    case 'INVALID_FORMAT':
      return {
        type: 'VALIDATION_ERROR',
        message: error.message
      };
    case 'NOT_FOUND':
      return {
        type: 'LOAD_ERROR',
        message: error.message
      };
    case 'IO_ERROR':
    default:
      return {
        type: 'LOAD_ERROR',
        message: error.message
      };
  }
}

/**
 * 設定保存エラーをストアエラーに変換する関数
 *
 * @param error ConfigSaverからのエラーオブジェクト
 * @returns ConfigStoreError型に変換されたエラー
 */
function mapSaveErrorToStoreError(error: ConfigSaveError): ConfigStoreError {
  return {
    type: error.type === 'VALIDATION_ERROR' ? 'VALIDATION_ERROR' : 'SAVE_ERROR',
    message: error.message
  };
}

/**
 * 設定ストアの状態
 */
type ConfigStoreState = {
  readonly config: AppConfig;
  readonly isLoading: boolean;
  readonly error: ConfigStoreError | null;
  readonly configFilePath: string | null;
};

/**
 * 設定ストアのアクション
 */
type ConfigStoreActions = {
  readonly loadConfig: () => Promise<Result<AppConfig, ConfigStoreError>>;
  readonly saveConfig: (config?: AppConfig) => Promise<Result<AppConfig, ConfigStoreError>>;
  readonly resetError: () => void;
};

/**
 * 設定ストアの型
 */
export type ConfigStore = ConfigStoreState & ConfigStoreActions;

/**
 * 設定ストアのカスタムフック
 *
 * 設定ファイルを読み込み、保存するためのフックです。
 * 内部的にはlilconfigで設定を読み込み、ファイルシステムに保存します。
 *
 * @param _unused ESLint対応用の未使用パラメータ
 * @returns 設定ストアの状態とアクション
 */
export function useConfigStore(_unused?: undefined): ConfigStore {
  // 設定ストアの状態
  const [state, setState] = useState<ConfigStoreState>({
    config: DEFAULT_CONFIG,
    isLoading: true,
    error: null,
    configFilePath: null
  });

  /**
   * 設定を読み込む関数
   *
   * @param _unused ESLint対応用の未使用パラメータ
   * @returns 設定の読み込み結果
   */
  const loadConfig = useCallback(async (_unused?: undefined): Promise<Result<AppConfig, ConfigStoreError>> => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));

    // config-loaderを使用して設定を読み込む
    const loadOptions: ConfigLoaderOptions = { useDefaultOnNotFound: true };
    const result = await loadConfigFromFile(loadOptions);

    if (result.isOk()) {
      setState(prev => ({
        ...prev,
        config: result.value,
        configFilePath: null, // ファイルパスは別途取得する必要がある
        isLoading: false
      }));
      return ok(result.value);
    } else {
      const storeError = mapLoadErrorToStoreError(result.error);
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: storeError
      }));
      return err(storeError);
    }
  }, []);

  /**
   * 設定を保存する関数
   *
   * @param customConfig 保存する設定オブジェクト（省略時は現在の設定を使用）
   * @returns 保存結果
   */
  const saveConfigToFile = useCallback(async (customConfig?: AppConfig): Promise<Result<AppConfig, ConfigStoreError>> => {
    const configToSave = customConfig ?? state.config;
    setState(prev => ({ ...prev, isLoading: true, error: null }));

    // config-saverを使用して設定を保存
    const saveOptions: ConfigSaveOptions = {};
    const result = await saveConfig(configToSave, saveOptions);

    if (result.isOk()) {
      // 設定ファイルのパスを更新
      const filePath = result.value;
      setState(prev => ({
        ...prev,
        config: configToSave,
        configFilePath: filePath,
        isLoading: false
      }));
      return ok(configToSave);
    } else {
      // 保存エラーを処理
      const storeError = mapSaveErrorToStoreError(result.error);
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: storeError
      }));
      return err(storeError);
    }
  }, [state.config]);

  /**
   * エラーをリセットする関数
   *
   * @param _unused ESLint対応用の未使用パラメータ
   */
  const resetError = useCallback((_unused?: undefined): void => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  // 初期化時に設定を読み込む
  useEffect((_unused?: undefined) => {
    void loadConfig();
  }, [loadConfig]);

  return {
    ...state,
    loadConfig,
    saveConfig: saveConfigToFile,
    resetError
  };
}

export default useConfigStore;