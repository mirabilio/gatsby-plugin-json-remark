const utils = require("./utils");

test("file is skipped when config is file excluded from included directory", () => {
  const pathsInclude = ["/dir/to/json"];
  const pathsExclude = ["/dir/to/json/exclude-me.json"];
  const fileAbsolutePath = "/dir/to/json";
  const fileDir = "/dir/to/json/exclude-me.json";
  expect(
    utils.isFileAllowed({
      fileDir,
      fileAbsolutePath,
      pathsInclude,
      pathsExclude,
    })
  ).toBe(false);
});

test("file is included when config is file included from included directory", () => {
  const pathsInclude = ["/dir/to/json"];
  const fileAbsolutePath = "/dir/to/json";
  const fileDir = "/dir/to/json/include-me.json";
  expect(utils.isFileAllowed({ fileDir, fileAbsolutePath, pathsInclude })).toBe(
    true
  );
});

test("file is included when config is file included from included file", () => {
  const pathsInclude = ["/dir/to/json/include-me.json"];
  const fileAbsolutePath = "/dir/to/json";
  const fileDir = "/dir/to/json/include-me.json";
  expect(utils.isFileAllowed({ fileDir, fileAbsolutePath, pathsInclude })).toBe(
    true
  );
});

test("file is included by filename but current file is another file. current file should not be allowed.", () => {
  const pathsFileInclude = ["/dir/to/json/include-me.json"];
  const fileAbsolutePath = "/dir/to/json";
  const fileDir = "/dir/to/json/exclude-me.json";
  expect(
    utils.isFileAllowed({ fileDir, fileAbsolutePath, pathsFileInclude })
  ).toBe(false);
});

test("json remark property id contains all required fields", () => {
  expect(
    utils.createPropNodeId({
      wholeTree: "t",
      jsonNodeId: "j",
      nodeType: "n",
      absolutePath: "a",
      gatsbyType: "g",
      key: "k",
    })
  ).toBe("t j n a g 0 k");
  expect(() =>
    utils.createPropNodeId({
      wholeTree: undefined,
      jsonNodeId: ".",
      nodeType: ".",
      absolutePath: ".",
      gatsbyType: ".",
      index: 0,
      key: ".",
    })
  ).toThrow();
  expect(() =>
    utils.createPropNodeId({
      wholeTree: ".",
      jsonNodeId: undefined,
      nodeType: ".",
      absolutePath: ".",
      gatsbyType: ".",
      index: 0,
      key: ".",
    })
  ).toThrow();
  expect(() =>
    utils.createPropNodeId({
      wholeTree: ".",
      jsonNodeId: ".",
      nodeType: undefined,
      absolutePath: ".",
      gatsbyType: ".",
      index: 0,
      key: ".",
    })
  ).toThrow();
  expect(() =>
    utils.createPropNodeId({
      wholeTree: ".",
      jsonNodeId: ".",
      nodeType: ".",
      absolutePath: undefined,
      gatsbyType: ".",
      key: ".",
    })
  ).toThrow();
  expect(() =>
    utils.createPropNodeId({
      wholeTree: ".",
      jsonNodeId: ".",
      nodeType: ".",
      absolutePath: ".",
      gatsbyType: undefined,
      key: ".",
    })
  ).toThrow();
  expect(() =>
    utils.createPropNodeId({
      wholeTree: ".",
      jsonNodeId: ".",
      nodeType: ".",
      absolutePath: ".",
      gatsbyType: ".",
      key: undefined,
    })
  ).toThrow();
  expect(() =>
    utils.createPropNodeId({
      wholeTree: undefined,
      jsonNodeId: undefined,
      nodeType: undefined,
      absolutePath: undefined,
      gatsbyType: undefined,
      key: undefined,
    })
  ).toThrow();
});
