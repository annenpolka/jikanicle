import pluginJs from "@eslint/js";
import globals from "globals";
import tseslint from "typescript-eslint";
import eslintPluginImport from "eslint-plugin-import";
import eslintPluginFunctional from "eslint-plugin-functional";
import eslintPluginJsdoc from "eslint-plugin-jsdoc";

// TypeScriptの型情報を使用するための設定
const typescriptParser = tseslint.parser;

// プロジェクト設定
const tsParserOptions = {
  project: ["./tsconfig.json"],
  tsconfigRootDir: ".",
  ecmaVersion: 2020
};

/** @type {import('eslint').Linter.Config[]} */
export default [
  {
    ignores: [
      "node_modules/**",
      "dist/**",
      "coverage/**",
      ".husky/**"
    ]
  },
  { files: ["**/*.{js,mjs,cjs,ts}"] },
  { languageOptions: { globals: globals.browser } },
  pluginJs.configs.recommended,
  ...tseslint.configs.recommended,
  // TypeScript固有のルール強化
  {
    files: ["**/*.ts"],
    languageOptions: {
      parser: typescriptParser,
      parserOptions: tsParserOptions
    },
    rules: {
      // 型安全性の向上
      "@typescript-eslint/explicit-function-return-type": ["error", {
        "allowExpressions": true,
        "allowTypedFunctionExpressions": true
      }],
      "@typescript-eslint/no-explicit-any": "error",
      "@typescript-eslint/no-unsafe-assignment": "error",
      "@typescript-eslint/no-unsafe-call": "error",
      "@typescript-eslint/no-unsafe-member-access": "error",
      "@typescript-eslint/no-unsafe-return": "error",
      "@typescript-eslint/strict-boolean-expressions": "error",
      "@typescript-eslint/no-floating-promises": "error",
      "@typescript-eslint/no-unnecessary-condition": "error",
      "@typescript-eslint/prefer-nullish-coalescing": "error",
      "@typescript-eslint/prefer-optional-chain": "error",

      // 型定義の品質向上
      "@typescript-eslint/consistent-type-definitions": ["error", "type"],
      "@typescript-eslint/consistent-type-imports": ["error", { "prefer": "type-imports" }],
      "@typescript-eslint/no-unused-vars": ["error", { "argsIgnorePattern": "^_" }],
      "@typescript-eslint/naming-convention": [
        "error",
        // 型名はPascalCase
        { "selector": "interface", "format": ["PascalCase"] },
        { "selector": "typeAlias", "format": ["PascalCase"] },
        // 変数名はcamelCase
        { "selector": "variable", "format": ["camelCase", "UPPER_CASE"] },
        // 関数名はcamelCase
        { "selector": "function", "format": ["camelCase"] },
        // パラメータ名はcamelCase
        { "selector": "parameter", "format": ["camelCase"], "leadingUnderscore": "allow" },
        // プロパティ名はcamelCase
        { "selector": "property", "format": ["camelCase", "UPPER_CASE"] },
        // メソッド名はcamelCase
        { "selector": "method", "format": ["camelCase"] },
        // enum名はPascalCase
        { "selector": "enum", "format": ["PascalCase"] },
        // enumメンバー名はUPPER_CASE
        { "selector": "enumMember", "format": ["UPPER_CASE"] }
      ]
    }
  },

  // 関数型プログラミングのルール
  {
    files: ["**/*.ts"],
    plugins: {
      functional: eslintPluginFunctional
    },
    rules: {
      // 不変性の確保
      "functional/no-let": "error",
      "functional/prefer-readonly-type": "error",
      "functional/immutable-data": "error",

      // 純粋関数の促進
      "functional/no-expression-statements": ["off"], // 厳しすぎるため無効化
      "functional/no-conditional-statements": ["off"], // 厳しすぎるため無効化
      "functional/functional-parameters": ["error", { "allowRestParameter": true, "allowArgumentsKeyword": false }],
      "functional/no-throw-statements": ["error", { "allowToRejectPromises": true }]
    }
  },

  // インポート関連のルール
  {
    files: ["**/*.ts"],
    plugins: {
      import: eslintPluginImport
    },
    rules: {
      "import/no-cycle": "error",
      "import/no-self-import": "error",
      "import/no-useless-path-segments": "error",
      "import/order": ["error", { "groups": ["builtin", "external", "internal", "parent", "sibling", "index"] }]
    }
  },

  // JSDocコメント関連のルール
  {
    files: ["**/*.ts"],
    plugins: {
      jsdoc: eslintPluginJsdoc
    },
    rules: {
      "jsdoc/require-jsdoc": ["error", { "publicOnly": true, "require": { "FunctionDeclaration": true, "MethodDefinition": true } }],
      "jsdoc/require-param": "error",
      "jsdoc/require-returns": "error"
    }
  },

  // テストファイル用の設定 - 大幅にルールを緩和
  {
    files: ["test/**/*.ts", "vitest.config.ts"],
    languageOptions: {
      parser: typescriptParser,
      parserOptions: tsParserOptions
    },
    rules: {
      // JSDocルールの緩和
      "jsdoc/require-jsdoc": "off",
      "jsdoc/require-param": "off",
      "jsdoc/require-returns": "off",

      // 関数型プログラミングのルールを大幅に緩和
      "functional/functional-parameters": "off",
      "functional/no-let": "off",
      "functional/immutable-data": "off",
      "functional/no-expression-statements": "off",
      "functional/no-conditional-statements": "off",
      "functional/prefer-readonly-type": "off",

      // 型安全性関連のルールも緩和
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-unsafe-assignment": "off",
      "@typescript-eslint/no-unsafe-call": "off",
      "@typescript-eslint/no-unsafe-member-access": "off",
      "@typescript-eslint/no-unsafe-return": "off",
      "@typescript-eslint/explicit-function-return-type": "off"
    }
  },

  // インフラストラクチャ層（特にアダプター）用の設定 - DDDアーキテクチャに合わせてルールを緩和
  {
    files: ["src/infrastructure/adapters/**/*.ts"],
    rules: {
      // 関数型プログラミングのルールを緩和
      "functional/no-let": "off",
      "functional/immutable-data": "off",
      "functional/no-expression-statements": "off",
      "functional/no-conditional-statements": "off",
      "functional/functional-parameters": "off",
      "functional/prefer-readonly-type": "off",

      // JSDocルールを一部緩和
      "jsdoc/require-param": "off",
      "jsdoc/require-returns": "off",

      // 型安全性は維持しつつ、外部との連携に必要な型変換を許可
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/no-unsafe-assignment": "warn",
      "@typescript-eslint/no-unsafe-call": "warn",
      "@typescript-eslint/no-unsafe-member-access": "warn",
      "@typescript-eslint/no-unsafe-return": "warn",
      "@typescript-eslint/consistent-type-assertions": "off"
    }
  }
];