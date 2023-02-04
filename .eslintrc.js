/** @type {import("eslint").Linter.Config} */
const config = {
  extends: ["prettier", "eslint:recommended"],
  overrides: [
    {
      extends: ["plugin:@typescript-eslint/recommended"],
      files: ["**/*.ts", "**/*.tsx"],
      parserOptions: {
        tsconfigRootDir: __dirname,
        project: [
          "./tsconfig.json",
          "./app/tsconfig.json",
          "./packages/*/tsconfig.json",
          "./scripts/tsconfig.json",
        ],
      },
      rules: {
        "@typescript-eslint/no-unused-vars": [
          "error",
          {
            argsIgnorePattern: "^_",
            varsIgnorePattern: "^_",
            caughtErrorsIgnorePattern: "^_",
          },
        ],
      },
    },
  ],
  root: true,
  reportUnusedDisableDirectives: true,
  ignorePatterns: [
    ".eslintrc.js",
    "**/*.config.js",
    "**/*.config.cjs",
    "packages/config/**",
  ],
};

module.exports = config;
