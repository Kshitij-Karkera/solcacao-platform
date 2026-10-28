// eslint.config.js: code-quality rules (run with `npm run lint`).

import js from "@eslint/js";
import eslintPluginPrettier from "eslint-plugin-prettier/recommended";
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import tseslint from "typescript-eslint";

export default tseslint.config(
  // Build output folders are never linted
  { ignores: ["dist", ".output", ".vinxi"] },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    // Apply these rules to TypeScript files
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    plugins: {
      "react-hooks": reactHooks,
      "react-refresh": reactRefresh,
    },
    rules: {
      // Enforce the Rules of Hooks
      ...reactHooks.configs.recommended.rules,
      // Block the Next.js-only 'server-only' package
      "no-restricted-imports": [
        "error",
        {
          paths: [
            {
              name: "server-only",
              message:
                "TanStack Start does not use the Next.js `server-only` package. Rename the module to `*.server.ts` or mark it with `@tanstack/react-start/server-only`.",
            },
          ],
        },
      ],
      // Warn when a file mixes components and other exports (breaks hot reload)
      "react-refresh/only-export-components": ["warn", { allowConstantExport: true }],
      // Unused variables are allowed
      "@typescript-eslint/no-unused-vars": "off",
    },
  },
  // Report Prettier formatting differences as lint errors
  eslintPluginPrettier,
);
