module.exports = {
  testEnvironment: "node",
  // transformIgnorePatterns: ["/node_modules/", "/src/", "/src/fixtures/*"],
  transformIgnorePatterns: [
    "src/util.spec.js",
    "src/core.spec.js",
    "src/gatsby-node.spec.js",
    "src/__fixtures__/*",
    // "/src/",
  ],
  testTimeout: 900000,
  collectCoverageFrom: ["src/*.js"],
};
