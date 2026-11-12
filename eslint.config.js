import globals from 'globals';
export default [
  { ignores: ['dist/**', 'dist-single/**', 'node_modules/**', 'test-results/**'] },
  { files: ['src/game/**/*.js'], languageOptions: { ecmaVersion: 2022, sourceType: 'script', globals: { ...globals.browser, THREE: 'readonly' } },
    rules: { 'no-undef': 'off', 'no-unused-vars': 'off', 'no-empty': 'off' } },
  { files: ['src/*.js', 'tools/**/*.js', 'tests/**/*.mjs', 'vite.config.js', 'eslint.config.js'], languageOptions: { ecmaVersion: 2022, sourceType: 'module', globals: { ...globals.node, ...globals.browser, __dbg: 'readonly', THREE: 'readonly' } } }
];
