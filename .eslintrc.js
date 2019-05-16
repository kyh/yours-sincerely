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
    // Allow console logs in our codebase.
    'no-console': 'off',
  },
  settings: {
    'import/resolver': {
      'babel-module': {},
    },
  },
};
