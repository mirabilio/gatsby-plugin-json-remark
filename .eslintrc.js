module.exports = {
  env: {
    es6: true,
    node: true,
  },
  plugins: ["promise", "prettier", "jest"],
  extends: [
    "eslint:recommended",
    "google",
    "plugin:promise/recommended",
    "plugin:jest/recommended",
    "plugin:prettier/recommended",
  ],
  rules: {
    "prettier/prettier": "warn",
  },
  parserOptions: {
    ecmaVersion: 2018,
    sourceType: "module",
  },
};
