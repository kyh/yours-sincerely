const path = require('path');
const npmPackage = require('./package.json');

const MODULE_ALIAS = [
  ...Object.keys(npmPackage._moduleAliases).map((key) => {
    return [key, npmPackage._moduleAliases[key]];
  }),
];

module.exports = {
  parser: 'babel-eslint',
  extends: ['airbnb', 'plugin:prettier/recommended'],
  env: {
    browser: true,
    node: true,
    jest: true,
  },
  rules: {
    'react/jsx-filename-extension': [1, { extensions: ['.js', '.jsx'] }],
    // See: https://github.com/airbnb/javascript/commit/b6a268f780177e03b573a4f0df95ecc0d2e8783e
    // Disable destructuring lint.
    // TODO: re-enable when component detection is fixed
    'react/destructuring-assignment': 'off',
    // Disable one expression per line.
    // TODO: re-enable when an option for text children is available.
    'react/jsx-one-expression-per-line': 'off',
    // Allow console logs in our codebase.
    'no-console': 'off',
    // This is to stop eslint from throwing errors when using module_alias (@server).
    'import/no-extraneous-dependencies': 'off',
  },
  settings: {
    'import/resolver': {
      alias: { map: MODULE_ALIAS },
    },
  },
};
