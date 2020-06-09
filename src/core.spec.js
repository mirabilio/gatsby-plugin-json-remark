const isEmpty = require("lodash.isempty");
const {
  htmlResolver,
  resolverReducerAndStore,
  createJsonMarkdownPropertyNodes,
  constructResolvers,
  getResolvers,
} = require("./core");
const { setState, getState, clearStateCache } = require("./cache");
const { createContentDigest } = require("gatsby-core-utils");
const { onCreateNode, createResolvers, onPreInit } = require("./gatsby-node");

const merge = require("lodash.merge");
const cloneDeep = require("lodash.clonedeep");
const file0Json = require("./__fixtures__/file0.json");
const file1Json = require("./__fixtures__/file1.json");

const reporter = {
  info: (msg) => console.log("\x1b[36m%s\x1b[0m", msg),
  warn: (msg) => console.log(msg),
  error: (msg) => console.log("\x1b[31m%s\x1b[0m", msg),
  panic: (msg) => console.log(msg),
};
const {
  state: filesExpectedState,
} = require("./__fixtures__/filesExpectedState.js");
const expectedResolvers = require("./__fixtures__/filesExpectedResolvers");
const file1ExpectedMarkdownTree = require("./__fixtures__/file1ExpectedMarkdownTree");
const file2ExpectedMarkdownTree = require("./__fixtures__/file2ExpectedMarkdownTree");
const { removePath, addLeaf } = require("./ActionTypes");
const {
  PLUGIN_NAME_JSON_TRANSFORMER,
  PLUGIN_NAME_SOURCE_FILESYSTEM,
} = require("./constants");

let state;
let cache;

beforeEach(() => {
  cache = new Map();
});

describe("create leaves recursively from two json files", () => {
  let createNodeId;
  let loadNodeContent;
  let actions;
  let getNode;
  let getNodesByType;

  let nodeApiArgsNode1;
  let nodeApiArgsNode2;

  const fieldNameBlacklist = ["fields", "path"];
  const parentId1 = PLUGIN_NAME_SOURCE_FILESYSTEM.concat("1");
  const parentId2 = PLUGIN_NAME_SOURCE_FILESYSTEM.concat("2");

  const transformerJsonNode1 = {
    id: "json transformer node id 1",
    parent: parentId1,
    internal: {
      type: "DirJson",
      owner: PLUGIN_NAME_JSON_TRANSFORMER,
    },
  };
  const transformerJsonNode2 = {
    id: "json transformer node id 2",
    parent: parentId2,
    internal: {
      type: "DirJson",
      owner: PLUGIN_NAME_JSON_TRANSFORMER,
    },
  };
  const createResolversArg = jest.fn().mockReturnValue("1");

  beforeEach(() => {
    const getId = (content) => {
      let id;
      switch (content) {
        case "content: 0":
          id = "1";
          break;
        case "content0: 0-0":
          id = "2";
          break;
        case "arr1Content: 0-0-0":
          id = "3";
          break;
        case "arr1Content: 0-0-1":
          id = "4";
          break;
        case "arr1Content: 0-0-2":
          id = "5";
          break;
        case "content0: 0-1":
          id = "6";
          break;
        case "arr1Content: 0-1-0":
          id = "7";
          break;
        case "arr1Content: 0-1-1":
          id = "8";
          break;
        case "arr1Content: 0-1-2":
          id = "9";
          break;
        case "content0: 0-2":
          id = "10";
          break;
        case "arr1Content: 0-2-0":
          id = "11";
          break;
        case "arr1Content: 0-2-1":
          id = "12";
          break;
        case "arr1Content: 0-2-2":
          id = "13";
          break;
        case "content0: 1-0":
          id = "15";
          break;
        case "arr1Content: 1-0-0":
          id = "16";
          break;
        case "arr1Content: 1-0-1":
          id = "17";
          break;
        case "arr1Content: 1-0-2":
          id = "18";
          break;
        case "content0: 1-1":
          id = "19";
          break;
        case "arr1Content: 1-1-0":
          id = "20";
          break;
        case "arr1Content: 1-1-1":
          id = "21";
          break;
        case "content0: 1-2":
          id = "22";
          break;
        case "arr1Content: 1-2-0":
          id = "23";
          break;
        case "arr1Content: 1-2-1":
          id = "24";
          break;
        case "arr1Content: 1-2-2":
          id = "25";
          break;
        case "arr1Content: 1-2-3":
          id = "26";
          break;
      }
      return id;
    };
    actions = {
      createNodeField: {},
      createParentChildLink: jest.fn(),
      createContentDigest,
    };
    actions.createNode = jest.fn((propNode) => {
      return [
        {
          id: getId(propNode.internal.content),
          internal: {
            type: "MarkdownRemark",
          },
        },
      ];
    });
    getNodesByType = jest.fn(() => []);

    createNodeId = jest.fn().mockImplementation(() => {
      return "1";
    });
    loadNodeContent = jest
      .fn()
      .mockReturnValueOnce(JSON.stringify(file0Json))
      .mockReturnValueOnce(JSON.stringify(file1Json));
    getNode = jest.fn().mockImplementation((parentId) => {
      if (parentId1 === parentId)
        return { dir: "/dir", absolutePath: "/dir/file0.json" };
      else if (parentId2 === parentId)
        return { dir: "/dir", absolutePath: "/dir/file1.json" };
      else if ("node exists test" === parentId) return true;
      else return false;
    });

    nodeApiArgsNode1 = {
      cache,
      node: transformerJsonNode1,
      getNode,
      loadNodeContent,
      createNodeId,
      createParentChildLink: {},
      createContentDigest,
      getNodesByType,
      actions,
      reporter,
    };
    nodeApiArgsNode2 = {
      cache,
      node: transformerJsonNode2,
      getNode,
      loadNodeContent,
      createNodeId,
      createParentChildLink: {},
      createContentDigest,
      getNodesByType,
      actions,
      reporter,
    };
  });

  test("delete path from state", async () => {
    await onCreateNode(nodeApiArgsNode1, {
      fieldNameBlacklist,
      paths: ["/dir"],
    });
    await onCreateNode(nodeApiArgsNode2, {
      fieldNameBlacklist,
      paths: ["/dir"],
    });
    const removeAction = removePath({ absolutePath: "/dir/file1.json" });
    resolverReducerAndStore({
      action: removeAction,
      cache,
      reporter,
    });
    const resolvers = constructResolvers({
      state: getState({ cache, reporter }),
      cache,
      reporter,
    });
    expect(
      JSON.parse(JSON.stringify(expectedResolvers.resolvers))
    ).toStrictEqual(JSON.parse(JSON.stringify(resolvers)));
    expect(filesExpectedState).toMatchObject(getState({ cache, reporter }));
    expect(getState({ cache, reporter })["/dir/file1.json"]).toBe(undefined);
  });

  test("run two json files through gatsby-node createResolvers and onCreateNode, confirm state and resolvers", async () => {
    await onCreateNode(nodeApiArgsNode1, {
      fieldNameBlacklist,
      paths: ["/dir"],
    });
    await onCreateNode(nodeApiArgsNode2, {
      fieldNameBlacklist,
      paths: ["/dir"],
    });
    createResolvers(nodeApiArgsNode1);

    expect(filesExpectedState).toMatchObject(getState({ cache, reporter }));
  });

  test("reject node if file/path isn't allowed ", async () => {
    await onCreateNode(nodeApiArgsNode1, {
      fieldNameBlacklist,
      paths: ["/dir"],
    });
    await onCreateNode(nodeApiArgsNode2, {
      fieldNameBlacklist,
      paths: ["/dir"],
    });
    createResolvers(nodeApiArgsNode1);

    expect(filesExpectedState).toMatchObject(getState({ cache, reporter }));
  });

  test("reject node if node isn't owned by transformer-json ", async () => {
    nodeApiArgsNode1.node.internal.owner = "not transformer-json";
    await onCreateNode(nodeApiArgsNode1, {
      fieldNameBlacklist,
      paths: ["/dir"],
    });
    expect(isEmpty(getState({ cache, reporter }))).toBe(true);
  });

  test("create no nodes if options are empty", async () => {
    nodeApiArgsNode1.node.internal.owner = "not transformer-json";
    await onCreateNode(nodeApiArgsNode1);
    expect(isEmpty(getState({ cache, reporter }))).toBe(true);
  });

  test("empty resolvers causes log warn in createResolvers", async () => {
    const reporter = { warn: jest.fn() };
    nodeApiArgsNode1.node.internal.owner = "not transformer-json";
    await onCreateNode(nodeApiArgsNode1);
    createResolvers({
      createResolvers: jest.fn(),
      getNodesByType,
      cache,
      reporter,
    });
    expect(reporter.warn.mock.calls.length).toBe(1);
  });
});

test("empty path config causes log warn in onPreInit", () => {
  const reporter = { warn: jest.fn() };
  onPreInit({ reporter }, {});
  expect(reporter.warn.mock.calls.length).toBe(1);
});

test("non empty path config doesn't log warn in onPreInit", () => {
  const reporter = { warn: jest.fn() };
  onPreInit({ reporter }, { paths: ".." });
  expect(reporter.warn.mock.calls.length).toBe(0);
});

const createResolverArguments = (action, result, path) => {
  const source = {};
  const context = {
    cache,
    reporter,
    nodeModel: {
      getNodeById: jest.fn().mockReturnValue({
        absolutePath: action.absolutePath,
        internal: {
          owner: PLUGIN_NAME_JSON_TRANSFORMER,
          type: action.gatsbyType,
        },
        children: [],
      }),
      findRootNodeAncestor: jest.fn().mockReturnValue({ id: "" }),
    },
  };
  const info = {
    path: path,
    schema: {
      getType: jest.fn().mockReturnValue({
        getFields: jest.fn().mockReturnValue({
          html: {
            resolve: jest.fn().mockReturnValue(result),
          },
        }),
      }),
    },
    fieldName: action.leafName,
    parentType: { name: action.gatsbyType },
  };
  return { source, context, info };
};
