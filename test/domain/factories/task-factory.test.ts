import { describe, expect, it } from 'vitest'
import { createTask } from '../../../src/domain/factories/task-factory'
import { createTaskId } from '../../../src/domain/types/Task'

describe('TaskFactory', () => {
  it('createTask should create a valid task with required fields', () => {
    const task = createTask({
      name: 'テストタスク',
      estimatedDuration: 30, // 30分の予測所要時間
      category: 'WORK'
    })

    expect(task).toMatchObject({
      name: 'テストタスク',
      estimatedDuration: 30,
      category: 'WORK',
      status: 'NOT_STARTED',
      priority: 'MEDIUM', // デフォルト値
      description: '', // デフォルト値
      tags: [], // デフォルト値
    })

    // IDがTaskId型であることを確認
    expect(typeof task.id).toBe('string')

    // 日付フィールドがDate型であることを確認
    expect(task.createdAt).toBeInstanceOf(Date)
    expect(task.updatedAt).toBeInstanceOf(Date)
    expect(task.completedAt).toBeUndefined()
  })

  it('createTask should throw error for invalid input', () => {
    // 空の名前でエラーが発生することを確認
    expect(() => createTask({
      name: '',
      estimatedDuration: 30,
      category: 'WORK'
    })).toThrow('タスク名は必須です')

    // 負の時間でエラーが発生することを確認
    expect(() => createTask({
      name: 'テストタスク',
      estimatedDuration: -10,
      category: 'WORK'
    })).toThrow('予測時間は0以上である必要があります')

    // 無効なカテゴリでエラーが発生することを確認
    expect(() => createTask({
      name: 'テストタスク',
      estimatedDuration: 30,
      // @ts-expect-error 無効なカテゴリを意図的に渡す
      category: 'INVALID_CATEGORY'
    })).toThrow() // 具体的なエラーメッセージの検証は避ける
  })

  it('should create a task with custom values for optional fields', () => {
    const now = new Date()
    const taskId = createTaskId('test-id')

    const task = createTask({
      name: 'カスタムタスク',
      estimatedDuration: 60,
      category: 'PERSONAL_DEV',
      id: taskId,
      description: 'カスタム説明',
      status: 'IN_PROGRESS',
      priority: 'HIGH',
      createdAt: now,
      tags: ['重要', 'プロジェクトA']
    })

    expect(task).toMatchObject({
      id: taskId,
      name: 'カスタムタスク',
      description: 'カスタム説明',
      estimatedDuration: 60,
      category: 'PERSONAL_DEV',
      status: 'IN_PROGRESS',
      priority: 'HIGH',
      tags: ['重要', 'プロジェクトA']
    })

    // 日付の等価性チェックに toEqual を使用（厳密比較ではなく値の比較）
    expect(task.createdAt).toEqual(now)
    expect(task.updatedAt).toBeInstanceOf(Date)
    expect(task.updatedAt.getTime()).toBeGreaterThanOrEqual(now.getTime())
  })
})