# Zodスキーマ実装ガイドライン

## 更新履歴

| 日付 | 更新者 | 内容 |
|------|--------|------|
| 2025-03-10 | 開発チーム | 既存ドキュメントの統合によるガイドライン作成 |

## 1. 概要

このドキュメントでは、Zodを使用した型定義とバリデーションスキーマの統合方法について説明します。この手法により、TypeScriptの型システムとランタイムのバリデーションを一元管理し、より堅牢なドメインモデルを実現することができます。

## 2. 基本原則

### 2.1 型とスキーマの統合

- **単一の情報源**: スキーマから型を派生させ、型とバリデーションロジックの乖離を防ぐ
- **型安全性**: TypeScriptの型チェックを最大限に活用
- **実行時検証**: ランタイムでのバリデーションを確実に行う

### 2.2 スキーマ設計の指針

- **明確な責務**: 各スキーマは特定のユースケースに対応
- **再利用性**: 共通部分は再利用可能なスキーマに分割
- **読みやすさ**: スキーマ定義は明確で理解しやすく

## 3. 実装パターン

### 3.1 基本的なスキーマと型の定義

```typescript
// スキーマ定義
export const userSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(100),
  email: z.string().email(),
  age: z.number().min(0).max(120),
  isActive: z.boolean().default(true)
});

// 型の派生
export type User = z.infer<typeof userSchema>;
```

### 3.2 入力検証スキーマ

```typescript
// 作成用スキーマ（IDは不要）
export const createUserSchema = userSchema.omit({ id: true });
export type CreateUserInput = z.infer<typeof createUserSchema>;

// 更新用スキーマ（すべてのフィールドはオプショナル）
export const updateUserSchema = userSchema
  .omit({ id: true })
  .partial();
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
```

### 3.3 ブランド型との統合

```typescript
// ブランド型の定義
export type UserId = string & { readonly _brand: unique symbol };

// ブランド型を使用したスキーマ
const userIdSchema = z.string().uuid().transform(
  (val): UserId => val as UserId
);
```

### 3.4 複合スキーマ

```typescript
// 再利用可能なサブスキーマ
const addressSchema = z.object({
  street: z.string(),
  city: z.string(),
  zipCode: z.string().regex(/^\d{5}$/)
});

// 複合スキーマ
const userWithAddressSchema = userSchema.extend({
  address: addressSchema
});
```

## 4. バリデーション実装

### 4.1 基本的なバリデーション

```typescript
function validateUser(data: unknown): Result<User, ValidationError> {
  const result = userSchema.safeParse(data);
  if (result.success) {
    return ok(result.data);
  } else {
    return err({
      message: "ユーザー検証に失敗しました",
      errors: result.error.format()
    });
  }
}
```

### 4.2 カスタムバリデーション

```typescript
const passwordSchema = z.string()
  .min(8, "パスワードは最低8文字必要です")
  .max(100, "パスワードは最大100文字までです")
  .refine(
    (val) => /[A-Z]/.test(val),
    "パスワードには大文字を含める必要があります"
  )
  .refine(
    (val) => /[0-9]/.test(val),
    "パスワードには数字を含める必要があります"
  );
```

### 4.3 非同期バリデーション

```typescript
const emailSchema = z.string().email().superRefine(
  async (email, ctx) => {
    const existingUser = await userRepository.findByEmail(email);
    if (existingUser) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "このメールアドレスは既に使用されています"
      });
      return false;
    }
    return true;
  }
);
```

## 5. ベストプラクティス

### 5.1 スキーマの構成

- **ドメインごとにスキーマを分割**: 境界づけられたコンテキストに合わせる
- **入力/出力スキーマの分離**: APIの入力と出力で異なるスキーマを定義
- **共通スキーマの抽出**: 重複を避け、一貫性を保つ

### 5.2 エラーハンドリング

- **詳細なエラーメッセージ**: ユーザーが理解しやすいエラーメッセージ
- **エラー階層**: エラーの種類に応じた階層化
- **Result型との統合**: neverthrowなどのライブラリとの統合

### 5.3 テスト

- **スキーマのテスト**: 有効な入力と無効な入力の両方をテスト
- **バリアント網羅**: 各バリアントが期待通りに動作することを確認
- **境界値テスト**: 境界値でのバリデーション動作を確認

## 6. よくある問題と解決策

### 6.1 循環参照

**問題**: エンティティ間の相互参照によるスキーマの循環参照

**解決策**:
```typescript
type Post = {
  id: string;
  title: string;
  author: User;
};

type User = {
  id: string;
  name: string;
  posts: Post[];
};

// 循環参照を解決
const postSchema: z.ZodType<Post> = z.lazy(() =>
  z.object({
    id: z.string(),
    title: z.string(),
    author: userSchema
  })
);

const userSchema = z.object({
  id: z.string(),
  name: z.string(),
  posts: z.array(z.lazy(() => postSchema))
});
```

### 6.2 型と実行時の不一致

**問題**: 型定義とランタイムバリデーションの不整合

**解決策**: スキーマを単一の情報源として使用し、型を常にスキーマから派生させる

```typescript
// ❌ 避けるべき方法
type User = {
  id: string;
  name: string;
  age: number;
};

const userSchema = z.object({
  id: z.string(),
  name: z.string(),
  age: z.number()
  // ageMaxがないため、型と実行時の制約に不一致が生じる
});

// ✅ 推奨される方法
const userSchema = z.object({
  id: z.string(),
  name: z.string(),
  age: z.number().max(120)
});

type User = z.infer<typeof userSchema>;
```

## 7. パフォーマンスの考慮事項

- **スキーマの複雑さ**: 過度に複雑なスキーマはバリデーションのパフォーマンスに影響
- **再利用**: 高頻度で使用されるスキーマはメモ化を検討
- **非同期バリデーション**: 非同期バリデーションは慎重に設計

## 関連ドキュメント

- [タスク管理ドメイン実装詳細](../../domain/task/implementation.md)
- [アーキテクチャ概要](../../architecture/overview.md)
- [Zodの公式ドキュメント](https://github.com/colinhacks/zod)