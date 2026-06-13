import tsParser from "@typescript-eslint/parser";
import tsPlugin from "@typescript-eslint/eslint-plugin";
import reactHooksPlugin from "eslint-plugin-react-hooks";

export default [
  {
    ignores: [
      "**/dist/**",
      "**/node_modules/**",
      "**/*.js",
      "**/*.mjs",
      "**/lib/*/dist/**",
      // shadcn/ui generated components — not hand-written code
      "**/components/ui/**",
      "**/hooks/use-toast.ts",
      // orval-generated files
      "**/src/generated/**",
    ],
  },
  {
    files: ["**/*.ts", "**/*.tsx"],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: 2022,
        sourceType: "module",
      },
    },
    plugins: {
      "@typescript-eslint": tsPlugin,
      "react-hooks": reactHooksPlugin,
    },
    rules: {
      "@typescript-eslint/no-unused-vars": ["error", { argsIgnorePattern: "^_", varsIgnorePattern: "^_" }],
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/consistent-type-imports": ["error", { prefer: "type-imports" }],
      "no-console": ["error", { allow: ["warn", "error"] }],
      "eqeqeq": ["error", "always"],
      "prefer-const": "error",
      "no-var": "error",
      "react-hooks/rules-of-hooks": "error",
      "react-hooks/exhaustive-deps": "warn",
    },
  },
];
