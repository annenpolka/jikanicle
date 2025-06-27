import React, { useState } from "react";
import { Box, Text } from "ink";
import TextInput from "ink-text-input";
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
  { label: "Work", value: "work" as TaskCategory },
  { label: "Personal", value: "personal" as TaskCategory },
  { label: "Study", value: "study" as TaskCategory },
  { label: "Health", value: "health" as TaskCategory },
  { label: "Shopping", value: "shopping" as TaskCategory },
  { label: "Meeting", value: "meeting" as TaskCategory },
  { label: "Other", value: "other" as TaskCategory },
  { label: "Skip", value: undefined }
];

export const TaskForm: React.FC<TaskFormProps> = ({ onSubmit, onCancel }) => {
  const [currentStep, setCurrentStep] = useState<FormStep>("name");
  const [formData, setFormData] = useState<TaskFormData>({
    name: "",
    description: "",
    estimatedDurationMinutes: undefined,
    category: undefined
  });
  const [inputValue, setInputValue] = useState("");

  const handleNameSubmit = (name: string) => {
    if (name.trim()) {
      setFormData(prev => ({ ...prev, name: name.trim() }));
      setInputValue("");
      setCurrentStep("description");
    }
  };

  const handleDescriptionSubmit = (description: string) => {
    setFormData(prev => ({ ...prev, description: description.trim() || undefined }));
    setInputValue("");
    setCurrentStep("duration");
  };

  const handleDurationSubmit = (duration: string) => {
    const durationNum = parseInt(duration.trim());
    setFormData(prev => ({ 
      ...prev, 
      estimatedDurationMinutes: isNaN(durationNum) ? undefined : durationNum 
    }));
    setInputValue("");
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
            <Text>Enter task name:</Text>
            <TextInput
              value={inputValue}
              onChange={setInputValue}
              onSubmit={handleNameSubmit}
            />
          </Box>
        );

      case "description":
        return (
          <Box flexDirection="column">
            <Text>Enter description (optional):</Text>
            <TextInput
              value={inputValue}
              onChange={setInputValue}
              onSubmit={handleDescriptionSubmit}
            />
          </Box>
        );

      case "duration":
        return (
          <Box flexDirection="column">
            <Text>Enter estimated duration in minutes (optional):</Text>
            <TextInput
              value={inputValue}
              onChange={setInputValue}
              onSubmit={handleDurationSubmit}
            />
          </Box>
        );

      case "category":
        return (
          <Box flexDirection="column">
            <Box marginBottom={1}>
              <Text>Select category:</Text>
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
              <Text bold>Confirm task details:</Text>
            </Box>
            <Box marginBottom={1}>
              <Text>Name: {formData.name}</Text>
            </Box>
            {formData.description && (
              <Box marginBottom={1}>
                <Text>Description: {formData.description}</Text>
              </Box>
            )}
            {formData.estimatedDurationMinutes && (
              <Box marginBottom={1}>
                <Text>Estimated time: {formData.estimatedDurationMinutes} minutes</Text>
              </Box>
            )}
            {formData.category && (
              <Box marginBottom={1}>
                <Text>Category: {categoryOptions.find(opt => opt.value === formData.category)?.label}</Text>
              </Box>
            )}
            <Box marginTop={1}>
              <SelectInput
                items={[
                  { label: "Create", value: "submit" },
                  { label: "Cancel", value: "cancel" }
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
          <Text bold underline>Create New Task</Text>
        </Box>
        {renderCurrentStep()}
      </Box>
    </Box>
  );
};