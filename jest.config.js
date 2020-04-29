module.exports = {
  testEnvironment: "node",
  transformIgnorePatterns: ["/node_modules/", "/src/", "/src/fixtures/*"],
  testTimeout: 900000,
  collectCoverageFrom: ["src/*.js"],
};
