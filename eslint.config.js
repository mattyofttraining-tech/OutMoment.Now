// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');

module.exports = defineConfig([
  expoConfig,
  {
    ignores: ['dist/*', 'functions/lib/*', 'scripts/*'],
  },
  {
    // Plain Node.js utility scripts — give them the Node globals.
    files: ['functions/scripts/**/*.js'],
    languageOptions: {
      globals: { __dirname: 'readonly', Buffer: 'readonly', process: 'readonly', require: 'readonly', module: 'readonly', console: 'readonly' },
    },
  },
]);
