module.exports = {
  env: {
    es6: true,
    node: true,
  },
  plugins: [
    'promise',
    'prettier',
  ],
  extends: [
    'eslint:recommended', 
    'google',
    'plugin:promise/recommended',
    'plugin:prettier/recommended',
  ],
  rules: {
    'prettier/prettier': 'error',
  },
  parserOptions: {
    ecmaVersion: 2018
  } 
};
