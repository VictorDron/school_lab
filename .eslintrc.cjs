module.exports = {
  root: true,
  ignorePatterns: ['**/dist/**', '**/coverage/**', '**/node_modules/**'],
  overrides: [
    {
      files: ['backend/**/*.ts'],
      parser: '@typescript-eslint/parser',
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
      },
      env: {
        es2022: true,
        node: true,
      },
      rules: {
        'no-unreachable': 'error',
      },
    },
    {
      files: ['frontend/**/*.ts', 'frontend/**/*.tsx'],
      parser: '@typescript-eslint/parser',
      plugins: ['react-hooks'],
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
        ecmaFeatures: {
          jsx: true,
        },
      },
      env: {
        browser: true,
        es2022: true,
      },
      rules: {
        'no-unreachable': 'error',
      },
    },
  ],
};
