import tseslint from "typescript-eslint";
import reactHooksPlugin from "eslint-plugin-react-hooks";

export default tseslint.config(
  // ── Ignored paths ────────────────────────────────────────────────────────
  {
    ignores: [
      "**/dist/**",
      "**/node_modules/**",
      "**/*.js",
      "**/*.mjs",
      "**/*.cjs",
      "**/coverage/**",
      "**/.tsbuildinfo",
      // shadcn/ui auto-generated components
      "**/components/ui/**",
      "**/hooks/use-toast.ts",
      // Orval-generated API client files
      "**/src/generated/**",
      "**/src/.generated/**",
    ],
  },

  // ── All TypeScript source files ───────────────────────────────────────────
  {
    files: ["**/*.ts", "**/*.tsx"],
    extends: [...tseslint.configs.recommended],
    plugins: {
      "react-hooks": reactHooksPlugin,
    },
    rules: {
      // Type safety
      "@typescript-eslint/no-explicit-any": "error",
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
      "@typescript-eslint/consistent-type-imports": [
        "error",
        { prefer: "type-imports" },
      ],

      // Code style
      "prefer-const": "error",
      "no-var": "error",
      "eqeqeq": ["error", "always"],
      "curly": ["error", "all"],

      // React Hooks
      "react-hooks/rules-of-hooks": "error",
      "react-hooks/exhaustive-deps": "warn",

      // Prevent accidental console.log in production code
      // (use pino logger on the server; avoid console in the browser)
      "no-console": ["error", { allow: ["warn", "error"] }],
    },
  },
);
