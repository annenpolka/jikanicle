/**
 * タスク入力/編集フォームコンポーネント
 *
 * このコンポーネントはタスクの作成と編集の両方に使用されます。
 * ユーザー入力を検証し、キーボードショートカットによる操作をサポートします。
 */

import { Box, Text, useInput } from 'ink';
import React, { useState } from 'react';
import type { Task, Category, Priority, TaskStatus } from '../../domain/types/Task.js';

/**
 * タスクフォームのプロパティ
 */
export interface TaskFormProps {
  /** 編集対象のタスク（新規作成時はundefined） */
  task?: Task;
  /** フォーム送信時のコールバック関数 */
  onSubmit: (task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => void;
  /** キャンセル時のコールバック関数 */
  onCancel: () => void;
  /** テスト用ID */
  testID?: string;
}

/**
 * フォームの入力フィールドの型定義
 */
interface FormFields {
  name: string;
  description: string;
  category: Category;
  priority: Priority;
  estimatedDuration: number;
  status: TaskStatus;
  tags: string[];
}

/**
 * バリデーションエラーの型定義
 */
type ValidationErrors = Partial<Record<keyof FormFields, string>>;

/**
 * 入力値の検証を行う関数
 */
function validateForm(fields: FormFields): ValidationErrors {
  const errors: ValidationErrors = {};

  if (!fields.name.trim()) {
    errors.name = 'タスク名は必須です';
  }

  if (fields.estimatedDuration < 0) {
    errors.estimatedDuration = '見積時間は0以上で入力してください';
  }

  return errors;
}

/**
 * タスク入力/編集フォームコンポーネント
 */
export const TaskForm: React.FC<TaskFormProps> = ({
  task,
  onSubmit,
  onCancel,
  testID = 'task-form'
}) => {
  // 初期値の設定
  const initialFields: FormFields = task
    ? {
        name: task.name,
        description: task.description,
        category: task.category,
        priority: task.priority,
        estimatedDuration: task.estimatedDuration,
        status: task.status,
        tags: task.tags
      }
    : {
        name: '',
        description: '',
        category: 'WORK',
        priority: 'MEDIUM',
        estimatedDuration: 30,
        status: 'NOT_STARTED',
        tags: []
      };

  // フォームの状態
  const [fields, setFields] = useState<FormFields>(initialFields);
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [focusedField, setFocusedField] = useState<keyof FormFields>('name');
  const [tagsInput, setTagsInput] = useState<string>(initialFields.tags.join(','));

  // フィールド更新用関数
  const updateField = <K extends keyof FormFields>(field: K, value: FormFields[K]) => {
    setFields(prev => ({
      ...prev,
      [field]: value
    }));

    // エラーメッセージがあれば、変更時に削除
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  // タグ文字列をパースする関数
  const parseTags = (tagString: string): string[] => {
    return tagString
      .split(',')
      .map(tag => tag.trim())
      .filter(Boolean);
  };

  // フォーム送信処理
  const handleSubmit = () => {
    // タグをパース
    const updatedFields = {
      ...fields,
      tags: parseTags(tagsInput)
    };

    // バリデーション
    const validationErrors = validateForm(updatedFields);

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      // エラーのあるフィールドにフォーカス
      setFocusedField(Object.keys(validationErrors)[0] as keyof FormFields);
      return;
    }

    // 親コンポーネントのコールバックを呼び出し
    onSubmit(updatedFields);
  };

  // キー入力のハンドリング
  useInput((input, key) => {
    // Escapeキーでキャンセル
    if (key.escape) {
      onCancel();
      return;
    }

    // Enterキーでフォーム送信
    if (key.return) {
      handleSubmit();
      return;
    }

    // Tabキーでフィールド間の移動
    if (key.tab) {
      const fields: (keyof FormFields)[] = [
        'name',
        'description',
        'category',
        'priority',
        'estimatedDuration',
        'status',
        'tags'
      ];

      const currentIndex = fields.indexOf(focusedField);
      const nextIndex = (currentIndex + 1) % fields.length;
      setFocusedField(fields[nextIndex]);
      return;
    }

    // 現在のフォーカスフィールドに応じた入力処理
    if (focusedField === 'name') {
      if (key.backspace) {
        updateField('name', fields.name.slice(0, -1));
      } else if (!key.ctrl && !key.meta && input) {
        updateField('name', fields.name + input);
      }
    } else if (focusedField === 'description') {
      if (key.backspace) {
        updateField('description', fields.description.slice(0, -1));
      } else if (!key.ctrl && !key.meta && input) {
        updateField('description', fields.description + input);
      }
    } else if (focusedField === 'category') {
      const categories: Category[] = ['WORK', 'PERSONAL_DEV', 'HOUSEHOLD', 'OTHER'];
      if (key.upArrow || key.downArrow) {
        const currentIndex = categories.indexOf(fields.category);
        const direction = key.upArrow ? -1 : 1;
        const newIndex = (currentIndex + direction + categories.length) % categories.length;
        updateField('category', categories[newIndex]);
      }
    } else if (focusedField === 'priority') {
      const priorities: Priority[] = ['HIGH', 'MEDIUM', 'LOW'];
      if (key.upArrow || key.downArrow) {
        const currentIndex = priorities.indexOf(fields.priority);
        const direction = key.upArrow ? -1 : 1;
        const newIndex = (currentIndex + direction + priorities.length) % priorities.length;
        updateField('priority', priorities[newIndex]);
      }
    } else if (focusedField === 'estimatedDuration') {
      if (key.upArrow) {
        updateField('estimatedDuration', fields.estimatedDuration + 15);
      } else if (key.downArrow) {
        updateField('estimatedDuration', Math.max(0, fields.estimatedDuration - 15));
      } else if (/^[0-9]$/.test(input)) {
        const newValue = Number(input);
        if (!isNaN(newValue)) {
          updateField('estimatedDuration', newValue);
        }
      }
    } else if (focusedField === 'status') {
      const statuses: TaskStatus[] = ['NOT_STARTED', 'IN_PROGRESS', 'COMPLETED'];
      if (key.upArrow || key.downArrow) {
        const currentIndex = statuses.indexOf(fields.status);
        const direction = key.upArrow ? -1 : 1;
        const newIndex = (currentIndex + direction + statuses.length) % statuses.length;
        updateField('status', statuses[newIndex]);
      }
    } else if (focusedField === 'tags') {
      if (key.backspace) {
        setTagsInput(tagsInput.slice(0, -1));
      } else if (!key.ctrl && !key.meta && input) {
        setTagsInput(tagsInput + input);
      }
    }
  });

  // フィールドタイプに応じて入力コンポーネントを表示
  const renderField = (label: string, fieldName: keyof FormFields) => {
    const isFocused = focusedField === fieldName;
    const hasError = Boolean(errors[fieldName]);

    let valueText = '';
    const focusChar = isFocused ? '>' : ' ';

    if (fieldName === 'name') {
      valueText = fields.name;
    } else if (fieldName === 'description') {
      valueText = fields.description;
    } else if (fieldName === 'category') {
      valueText = fields.category;
    } else if (fieldName === 'priority') {
      valueText = fields.priority;
    } else if (fieldName === 'estimatedDuration') {
      valueText = `${fields.estimatedDuration}分`;
    } else if (fieldName === 'status') {
      valueText = fields.status;
    } else if (fieldName === 'tags') {
      valueText = tagsInput;
    }

    return (
      <Box flexDirection="column" marginY={0}>
        <Box>
          <Text bold color={isFocused ? 'green' : undefined}>
            {focusChar} {label}:
          </Text>
          <Box marginLeft={1}>
            <Text color={hasError ? 'red' : undefined}>{valueText}</Text>
          </Box>
        </Box>
        {hasError && (
          <Box marginLeft={2}>
            <Text color="red">{errors[fieldName]}</Text>
          </Box>
        )}
      </Box>
    );
  };

  return (
    <Box flexDirection="column" data-testid={testID} padding={1}>
      <Text bold>{task ? 'タスク編集' : 'タスク作成'}</Text>
      <Box marginY={1}>
        <Text>
          [Tab]次の項目 | [↑][↓]値の変更 | [Enter]保存 | [Esc]キャンセル
        </Text>
      </Box>

      {renderField('名前', 'name')}
      {renderField('詳細', 'description')}
      {renderField('カテゴリ', 'category')}
      {renderField('優先度', 'priority')}
      {renderField('見積時間(分)', 'estimatedDuration')}
      {renderField('状態', 'status')}
      {renderField('タグ', 'tags')}

      <Box marginTop={1} justifyContent="space-between">
        <Text color="gray">保存: Enter | キャンセル: Esc</Text>
      </Box>
    </Box>
  );
};

export default TaskForm;