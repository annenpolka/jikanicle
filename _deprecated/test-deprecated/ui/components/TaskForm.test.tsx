/**
 * タスク入力/編集フォームコンポーネントのテスト
 *
 * このファイルでは、タスク作成・編集用フォームコンポーネントのテストを実施します。
 * フォーム入力、バリデーション、イベントハンドリングなどをテストします。
 */

import { Box, Text } from 'ink';
import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createTaskId } from '../../../src/domain/schemas/task-schema.js';
import type { Task } from '../../../src/domain/types/Task.js';
import { formatOutput, keys, pressKey, renderInk } from '../helpers/ink-test-helper.js';

// タスクフォームコンポーネントをモック（実装前）
const MockTaskForm = ({
  task,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  onSubmit,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  onCancel,
  testID = 'task-form'
}: {
  task?: Task;
  onSubmit: (task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onCancel: () => void;
  testID?: string;
}) => (
  <Box flexDirection="column" data-testid={testID}>
    <Text bold>{task ? 'タスク編集' : 'タスク作成'}</Text>
    <Box marginTop={1}>
      <Text>名前: </Text>
      <Text>テスト用タスク名</Text>
    </Box>
    <Box marginTop={1}>
      <Text>詳細: </Text>
      <Text>テスト用タスク詳細</Text>
    </Box>
    <Box marginTop={1}>
      <Text>カテゴリ: </Text>
      <Text>WORK</Text>
    </Box>
    <Box marginTop={1}>
      <Text>優先度: </Text>
      <Text>HIGH</Text>
    </Box>
    <Box marginTop={1}>
      <Text>見積時間(分): </Text>
      <Text>60</Text>
    </Box>
    <Box marginTop={1}>
      <Text>タグ: </Text>
      <Text>重要,仕事</Text>
    </Box>
    <Box marginTop={1} flexDirection="row" justifyContent="space-between">
      <Text>保存: Enter | キャンセル: Esc</Text>
    </Box>
  </Box>
);

// サンプルタスク
const sampleTask: Task = {
  id: createTaskId('task-1'),
  name: 'テスト用タスク',
  description: 'テスト用タスクの詳細説明',
  status: 'NOT_STARTED',
  category: 'WORK',
  priority: 'HIGH',
  estimatedDuration: 60,
  createdAt: new Date('2025-03-01'),
  updatedAt: new Date('2025-03-01'),
  tags: ['重要', '仕事']
};

// モック関数
const mockOnSubmit = vi.fn();
const mockOnCancel = vi.fn();

describe('TaskForm', () => {
  beforeEach(() => {
    // テスト前にモック関数をリセット
    mockOnSubmit.mockReset();
    mockOnCancel.mockReset();
  });

  it('新規作成モードで正しくレンダリングされること', () => {
    const { lastFrame } = renderInk(
      <MockTaskForm
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    );

    const output = formatOutput(lastFrame?.() || '');

    // 新規作成モードのタイトルが表示されること
    expect(output).toContain('タスク作成');
    expect(output).toContain('名前:');
    expect(output).toContain('詳細:');
    expect(output).toContain('カテゴリ:');
    expect(output).toContain('優先度:');
    expect(output).toContain('見積時間(分):');
    expect(output).toContain('タグ:');

    // 操作方法が表示されていること
    expect(output).toContain('保存: Enter | キャンセル: Esc');
  });

  it('編集モードで既存のタスク情報が表示されること', () => {
    const { lastFrame } = renderInk(
      <MockTaskForm
        task={sampleTask}
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    );

    const output = formatOutput(lastFrame?.() || '');

    // 編集モードのタイトルが表示されること
    expect(output).toContain('タスク編集');

    // 既存のタスク情報が表示されること
    expect(output).toContain('テスト用タスク名');
    expect(output).toContain('テスト用タスク詳細');
    expect(output).toContain('WORK');
    expect(output).toContain('HIGH');
    expect(output).toContain('60');
    expect(output).toContain('重要,仕事');
  });

  it('キーボードイベントが正しく処理されること', async () => {
    const { stdin, waitForUpdate } = renderInk(
      <MockTaskForm
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    );

    // Enterキーでsubmitイベントが発火すること
    pressKey(stdin as NodeJS.WritableStream, keys.enter);
    await waitForUpdate();
    expect(mockOnSubmit).toHaveBeenCalledTimes(1);

    // Escキーでcancelイベントが発火すること
    pressKey(stdin as NodeJS.WritableStream, keys.escape);
    await waitForUpdate();
    expect(mockOnCancel).toHaveBeenCalledTimes(1);
  });

  it('入力値が変更されたときに状態が更新されること', async () => {
    const { stdin, waitForUpdate } = renderInk(
      <MockTaskForm
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    );

    // タスク名の入力
    pressKey(stdin as NodeJS.WritableStream, 'テストタスク');
    await waitForUpdate();

    // Tab キーで次のフィールドに移動
    pressKey(stdin as NodeJS.WritableStream, '\t');
    await waitForUpdate();

    // 詳細の入力
    pressKey(stdin as NodeJS.WritableStream, 'テスト詳細');
    await waitForUpdate();

    // 入力完了後のSubmit
    pressKey(stdin as NodeJS.WritableStream, keys.enter);
    await waitForUpdate();

    // 入力された値でonSubmitが呼ばれること
    // 実際のコンポーネント実装後に有効化する
    // expect(mockOnSubmit).toHaveBeenCalledWith(
    //   expect.objectContaining({
    //     name: 'テストタスク',
    //     description: 'テスト詳細'
    //   })
    // );
  });

  it('必須項目が入力されていない場合にバリデーションエラーが表示されること', async () => {
    const { lastFrame, stdin, waitForUpdate } = renderInk(
      <MockTaskForm
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    );

    // タスク名を空にする
    pressKey(stdin as NodeJS.WritableStream, '');
    await waitForUpdate();

    // 送信を試みる
    pressKey(stdin as NodeJS.WritableStream, keys.enter);
    await waitForUpdate();

    // バリデーションエラーが表示され、onSubmitは呼ばれないこと
    const output = formatOutput(lastFrame?.() || '');
    expect(output).toContain('タスク名は必須です');
    expect(mockOnSubmit).not.toHaveBeenCalled();
  });
});