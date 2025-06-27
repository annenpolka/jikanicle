import React, { useState } from "react";
import { Box, Text } from "ink";
import SelectInput from "ink-select-input";
import type { TaskCategory } from "../../domain/task.js";

interface TaskFormProps {
  onSubmit: (data: TaskFormData) => void;
  onCancel: () => void;
}

export interface TaskFormData {
  name: string;
  description?: string;
  estimatedDurationMinutes?: number;
  category?: TaskCategory;
}

type FormStep = "name" | "description" | "duration" | "category" | "confirm";

const categoryOptions = [
  { label: "仕事", value: "work" as TaskCategory },
  { label: "個人", value: "personal" as TaskCategory },
  { label: "勉強", value: "study" as TaskCategory },
  { label: "健康", value: "health" as TaskCategory },
  { label: "買い物", value: "shopping" as TaskCategory },
  { label: "会議", value: "meeting" as TaskCategory },
  { label: "その他", value: "other" as TaskCategory },
  { label: "スキップ", value: undefined }
];

export const TaskForm: React.FC<TaskFormProps> = ({ onSubmit, onCancel }) => {
  const [currentStep, setCurrentStep] = useState<FormStep>("name");
  const [formData, setFormData] = useState<TaskFormData>({
    name: "",
    description: "",
    estimatedDurationMinutes: undefined,
    category: undefined
  });

  const _handleNameInput = (name: string) => {
    if (name.trim()) {
      setFormData(prev => ({ ...prev, name: name.trim() }));
      setCurrentStep("description");
    }
  };

  const _handleDescriptionInput = (description: string) => {
    setFormData(prev => ({ ...prev, description: description.trim() || undefined }));
    setCurrentStep("duration");
  };

  const _handleDurationInput = (duration: string) => {
    const durationNum = parseInt(duration.trim());
    setFormData(prev => ({ 
      ...prev, 
      estimatedDurationMinutes: isNaN(durationNum) ? undefined : durationNum 
    }));
    setCurrentStep("category");
  };

  const handleCategorySelect = (item: { value?: TaskCategory }) => {
    setFormData(prev => ({ ...prev, category: item.value }));
    setCurrentStep("confirm");
  };

  const handleConfirm = (item: { value: string }) => {
    if (item.value === "submit") {
      onSubmit(formData);
    } else {
      onCancel();
    }
  };

  const renderCurrentStep = () => {
    switch (currentStep) {
      case "name":
        return (
          <Box flexDirection="column">
            <Text>タスク名を入力してください:</Text>
            <Text dimColor>(入力後、Enterで次へ)</Text>
          </Box>
        );

      case "description":
        return (
          <Box flexDirection="column">
            <Text>説明を入力してください（任意）:</Text>
            <Text dimColor>(入力後、Enterで次へ。空の場合はスキップ)</Text>
          </Box>
        );

      case "duration":
        return (
          <Box flexDirection="column">
            <Text>予想所要時間（分）を入力してください（任意）:</Text>
            <Text dimColor>(数値を入力後、Enterで次へ。空の場合はスキップ)</Text>
          </Box>
        );

      case "category":
        return (
          <Box flexDirection="column">
            <Box marginBottom={1}>
              <Text>カテゴリを選択してください:</Text>
            </Box>
            <SelectInput
              items={categoryOptions}
              onSelect={handleCategorySelect}
            />
          </Box>
        );

      case "confirm":
        return (
          <Box flexDirection="column">
            <Box marginBottom={1}>
              <Text bold>タスク情報の確認:</Text>
            </Box>
            <Box marginBottom={1}>
              <Text>名前: {formData.name}</Text>
            </Box>
            {formData.description && (
              <Box marginBottom={1}>
                <Text>説明: {formData.description}</Text>
              </Box>
            )}
            {formData.estimatedDurationMinutes && (
              <Box marginBottom={1}>
                <Text>予想時間: {formData.estimatedDurationMinutes}分</Text>
              </Box>
            )}
            {formData.category && (
              <Box marginBottom={1}>
                <Text>カテゴリ: {categoryOptions.find(opt => opt.value === formData.category)?.label}</Text>
              </Box>
            )}
            <Box marginTop={1}>
              <SelectInput
                items={[
                  { label: "作成する", value: "submit" },
                  { label: "キャンセル", value: "cancel" }
                ]}
                onSelect={handleConfirm}
              />
            </Box>
          </Box>
        );

      default:
        return null;
    }
  };

  return (
    <Box padding={1} borderStyle="single" borderColor="blue">
      <Box flexDirection="column">
        <Box marginBottom={1}>
          <Text bold underline>新しいタスクの作成</Text>
        </Box>
        {renderCurrentStep()}
      </Box>
    </Box>
  );
};