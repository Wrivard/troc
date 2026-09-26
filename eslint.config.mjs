import js from "@eslint/js";
import ts from "typescript-eslint";
export default ts.config(
  js.configs.recommended,
  ...ts.configs.recommended,
  {
    files: ["**/*.ts", "**/*.tsx"],
    rules: {
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
    },
  },
  {
    files: ["tests/*.mjs"],
    languageOptions: {
      globals: {
        URL: "readonly",
        console: "readonly",
        document: "readonly",
        innerWidth: "readonly",
        // These Node-driven Playwright probes also execute callbacks in a browser.
        localStorage: "readonly",
        scrollTo: "readonly",
        getComputedStyle: "readonly",
        fetch: "readonly",
        crypto: "readonly",
        process: "readonly",
      },
    },
  },
);
