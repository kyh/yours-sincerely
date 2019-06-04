module.exports = {
  parser: 'babel-eslint',
  extends: ['airbnb', 'prettier'],
  plugins: ['prettier'],
  env: {
    browser: true,
    node: true,
    jest: true,
  },
  rules: {
    'prettier/prettier': ['error'],
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
