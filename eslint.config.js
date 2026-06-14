import tseslint from "typescript-eslint";

export default tseslint.config(
  // Apply to all TypeScript files in the monorepo
  {
    files: ["**/*.ts", "**/*.tsx"],
    extends: [
      ...tseslint.configs.recommended,
    ],
    rules: {
      // Disallow implicit any — forces explicit typing
      "@typescript-eslint/no-explicit-any": "error",
      // Catch unused variables before they become dead code
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
      // Prefer const for variables that are never reassigned
      "prefer-const": "error",
      // Prevent == coercion bugs
      "eqeqeq": ["error", "always"],
      // Disallow console.log — use pino logger instead
      "no-console": "error",
      // Enforce curly braces for all control structures
      "curly": ["error", "all"],
    },
  },
  // Ignore build outputs and generated files
  {
    ignores: [
      "**/dist/**",
      "**/node_modules/**",
      "**/.tsbuildinfo",
      "**/coverage/**",
    ],
  },
);
