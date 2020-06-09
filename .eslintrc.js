module.exports = {
  env: {
    es6: true,
    node: true,
    commonjs: true,
    jest: true,
  },
  plugins: ["promise", "prettier", "jest", "babel"],
  extends: [
    "eslint:recommended",
    // "google",
    "plugin:promise/recommended",
    "plugin:jest/recommended",
    "plugin:prettier/recommended",
    "prettier/babel",
  ],
  rules: {
    "prettier/prettier": "warn",

    "new-cap": 0,
    camelcase: 0,
    "no-invalid-this": 0,
    "object-curly-spacing": 0,
    quotes: 0,
    semi: 0,
    "no-unused-expressions": "warn",
    "no-unused-vars": "warn",
    "valid-typeof": 0,
    "require-await": "error",

    "babel/new-cap": 1,
    "babel/camelcase": 0,
    "babel/no-invalid-this": 1,
    "babel/quotes": 1,
    "babel/semi": 1,
    "babel/no-unused-expressions": 1,
    "babel/valid-typeof": 1,

    "jest/no-commented-out-tests": 0,
  },
  parser: "babel-eslint",
  parserOptions: {
    ecmaVersion: 2018,
    sourceType: "module",
  },
};
