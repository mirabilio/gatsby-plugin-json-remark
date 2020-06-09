const { isFileAllowed } = require("./util");
test("file is skipped when config is file excluded from included directory", () => {
  const pathsInclude = ["/dir/to/json"];
  const pathsExclude = ["/dir/to/json/exclude-me.json"];
  const fileAbsolutePath = "/dir/to/json";
  const fileDir = "/dir/to/json/exclude-me.json";
  expect(
    isFileAllowed({
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
  expect(isFileAllowed({ fileDir, fileAbsolutePath, pathsInclude })).toBe(true);
});

test("file is included when config is file included from included file", () => {
  const pathsInclude = ["/dir/to/json/include-me.json"];
  const fileAbsolutePath = "/dir/to/json";
  const fileDir = "/dir/to/json/include-me.json";
  expect(isFileAllowed({ fileDir, fileAbsolutePath, pathsInclude })).toBe(true);
});

test("file is included by filename but current file is another file. current file should not be allowed.", () => {
  const pathsFileInclude = ["/dir/to/json/include-me.json"];
  const fileAbsolutePath = "/dir/to/json";
  const fileDir = "/dir/to/json/exclude-me.json";
  expect(isFileAllowed({ fileDir, fileAbsolutePath, pathsFileInclude })).toBe(
    false
  );
});
