import js from "@eslint/js";
import tseslint from "typescript-eslint";

export default [
  {
    ignores: [
      "**/node_modules",
      "**/dist",
      "**/cdk.out",
      "**/*.js",
      "**/*.cjs",
      "**/*.mjs",
      "**/*.d.ts",
      "seeders/**",
      "factories/**",
    ],
  },

  js.configs.recommended,
  ...tseslint.configs.recommended,

  {
    files: ["**/*.ts"],
    rules: {
      "no-unused-vars": "off",
      "@typescript-eslint/no-unused-vars": ["warn"],
      // Código ETL maneja data dinámica de APIs externas; any queda como
      // warning (visible) en vez de bloquear.
      "@typescript-eslint/no-explicit-any": ["warn"],
    },
  },
];
