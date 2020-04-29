const utils = require("./utils");
const { createContentDigest } = require(`gatsby-core-utils`);
const { onCreateNode, createResolvers, onPreInit } = require(`./gatsby-node`);
const merge = require("lodash.merge");
const cloneDeep = require("lodash.clonedeep");
const file1Json = require("./__fixtures__/file1.json");
const file2Json = require("./__fixtures__/file2.json");

const reporter = {
  info: (msg) => console.log(msg),
  warn: (msg) => console.log(msg),
  error: (msg) => console.log(msg),
  panic: (msg) => console.log(msg),
};
const {
  state: file1ExpectedState,
} = require("./__fixtures__/file1ExpectedState.js");
const {
  state: file2ExpectedState,
} = require("./__fixtures__/file2ExpectedState.js");
const expectedResolvers = require("./__fixtures__/filesExpectedResolvers");
const file1ExpectedMarkdownTree = require("./__fixtures__/file1ExpectedMarkdownTree");
const file2ExpectedMarkdownTree = require("./__fixtures__/file2ExpectedMarkdownTree");
const { removePath, addLeaf } = require("./ActionTypes");
const {
  PLUGIN_NAME_JSON_TRANSFORMER,
  PLUGIN_NAME_SOURCE_FILESYSTEM,
  CACHE_KEY_RESOLVER,
} = require("./constants");

beforeEach(() => {
  utils.storage = new Map();
});

const createActions = (storage) => {
  return {
    addLeafAction1: addLeaf({
      absolutePath: "/dir/actionSet1.json",
      gatsbyType: "ActionSet1Json",
      leafName: "leaf1",
      markdownRemarkId: "11",
      resolve: utils.htmlResolver(storage, CACHE_KEY_RESOLVER).resolve,
    }),
    addLeafAction2: addLeaf({
      absolutePath: "/dir/actionSet1.json",
      gatsbyType: "ActionSet1Json",
      leafName: "leaf2",
      markdownRemarkId: "12",
      resolve: utils.htmlResolver(storage, CACHE_KEY_RESOLVER).resolve,
    }),
    addLeafAction3: addLeaf({
      absolutePath: "/dir/actionSet2.json",
      gatsbyType: "ActionSet2Json",
      leafName: "leaf1",
      markdownRemarkId: "21",
      resolve: utils.htmlResolver(storage, CACHE_KEY_RESOLVER).resolve,
    }),
    addLeafAction4: addLeaf({
      absolutePath: "/dir/actionSet2.json",
      gatsbyType: "ActionSet2Json",
      leafName: "leaf3",
      markdownRemarkId: "23",
      resolve: utils.htmlResolver(storage, CACHE_KEY_RESOLVER).resolve,
    }),
  };
};

describe("tests for when resolver is called for excluded path, type, leaf, and index", () => {
  let baseUndefined;
  let leaf;
  beforeEach(async () => {
    leaf = addLeaf({
      absolutePath: "/dir/file1.json",
      gatsbyType: "DirJson",
      leafName: "leaf1",
      markdownRemarkId: "if this is returned, there is a problem.",
    });
    baseUndefined = cloneDeep(leaf);
  });
  const setupUndefined = async (undefProp) => {
    const state = utils.resolverReducer(
      utils.storage.get(CACHE_KEY_RESOLVER),
      leaf
    );
    utils.storage.set(CACHE_KEY_RESOLVER, state);
    const args = createResolverArguments(undefProp, undefProp.markdownRemarkId);
    return await utils
      .htmlResolver(utils.storage, CACHE_KEY_RESOLVER)
      .resolve(args.mockSource, {}, args.mockContext, args.mockInfo);
  };

  test("when path doesn't exist in state, return undefined html", async () => {
    baseUndefined.absolutePath = "nope";
    const id = await setupUndefined(baseUndefined);
    expect(id).toBeUndefined();
  });
  test("when type doesn't exist in state, return undefined html", async () => {
    baseUndefined.gatsbyType = "nope";
    const id = await setupUndefined(baseUndefined);
    expect(id).toBeUndefined();
  });
  test("when leaf doesn't exist in state, return undefined html", async () => {
    baseUndefined.leafName = "nope";
    const id = await setupUndefined(baseUndefined);
    expect(id).toBeUndefined();
  });
  test("when type[index] doesn't exist in state, return undefined html", async () => {
    baseUndefined.index = "2";
    const id = await setupUndefined(baseUndefined);
    expect(id).toBeUndefined();
  });
  test("id should be 'if this is returned, there is a problem.'", async () => {
    const id = await setupUndefined(baseUndefined);
    expect(id).toBe("if this is returned, there is a problem.");
  });
});

describe("add two leaves each from two files: test properfly formed state shape", () => {
  const actions = createActions(utils.storage);
  let results = {};

  beforeEach(async () => {
    for (const action of Object.keys({ ...actions }).map(
      (key) => actions[key]
    )) {
      const addLeafAction1WithResolver = addLeaf({
        ...action,
        leafName: action.leafNameSource,
        resolve: utils.htmlResolver(utils.storage, CACHE_KEY_RESOLVER).resolve,
      });
      results[createContentDigest(action)] = {
        result: action.leafName.concat(" compiled html"),
        ...createResolverArguments(
          addLeafAction1WithResolver,
          action.leafName.concat(" compiled html")
        ),
      };
      const newResolverState = utils.resolverReducer(
        utils.storage.get(CACHE_KEY_RESOLVER),
        addLeafAction1WithResolver
      );
      utils.storage.set(CACHE_KEY_RESOLVER, newResolverState);
    }
  });

  afterAll(async () => {
    results = {};
    utils.storage.clear();
  });

  test("when field doesn't exist, return undefined html", async () => {
    const leaf = addLeaf({
      absolutePath: "/dir/file.json",
      gatsbyType: "NoExist",
      leafName: "leaf1",
      markdownRemarkId: "1",
    });
    const args = createResolverArguments(leaf, "");
    args.mockInfo.fieldName.leaf1Html = leaf.leafNameSource;
    args.mockSource.leaf1 = undefined;
    expect(
      await utils
        .htmlResolver(utils.storage, CACHE_KEY_RESOLVER)
        .resolve(args.mockSource, {}, args.mockContext, args.mockInfo)
    ).toBe(undefined);
  });

  test("confirm state from first action is properly formed", async () => {
    const { addLeafAction1: action1 } = {
      ...actions,
    };
    const _state = utils.storage.get(CACHE_KEY_RESOLVER);
    const resolver =
      _state[action1.absolutePath][action1.gatsbyType][action1.leafName]
        .resolve;
    const resolverResult1 = await resolver(
      results[createContentDigest(action1)].mockSource,
      {},
      results[createContentDigest(action1)].mockContext,
      results[createContentDigest(action1)].mockInfo
    );
    const state = {
      ["/dir/actionSet1.json"]: {
        ActionSet1Json: {
          leaf1Html: {
            type: "String",
            mIds: ["11"],
          },
          leaf2Html: {
            type: "String",
            mIds: ["12"],
          },
        },
      },
    };
    expect(utils.storage.get(CACHE_KEY_RESOLVER)).toMatchObject(state);
    expect(typeof resolver).toBe("function");
    expect(resolverResult1).toBe(results[createContentDigest(action1)].result);
  });

  const exec = async (action) => {
    const resolver = utils.storage.get(CACHE_KEY_RESOLVER)[action.absolutePath][
      action.gatsbyType
    ][action.leafName].resolve;
    const result = await resolver(
      results[createContentDigest(action)].mockSource,
      {},
      results[createContentDigest(action)].mockContext,
      results[createContentDigest(action)].mockInfo
    );
    return { resolver, result };
  };

  test("confirm state from second action is properly formed", async () => {
    const { resolver, result } = await exec(actions.addLeafAction2);
    expect(typeof resolver).toBe("function");
    expect(result).toBe(
      results[createContentDigest(actions.addLeafAction2)].result
    );
  });

  test("confirm state from third action is properly formed", async () => {
    const { resolver, result } = await exec(actions.addLeafAction3);
    expect(typeof resolver).toBe("function");
    expect(result).toBe(
      results[createContentDigest(actions.addLeafAction3)].result
    );
  });

  test("confirm state from fourth action is properly formed", async () => {
    const { resolver, result } = await exec(actions.addLeafAction4);
    expect(typeof resolver).toBe("function");
    expect(result).toBe(
      results[createContentDigest(actions.addLeafAction4)].result
    );
  });
});

describe("create leaves recursively from two json files", () => {
  let createNodeId;
  let loadNodeContent;
  let actions;
  let getNode;
  let nodeApiArgsNode1;
  let nodeApiArgsNode2;
  let createNodeFile1;
  let createNodeFile2;

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

  beforeEach(async () => {
    createNodeFile1 = jest
      .fn()
      .mockReturnValueOnce([{ id: "k492-ask239-aski3-3i3ks" }])
      .mockReturnValueOnce([{ id: "1s91-asdf34-bfd4re-asdf32" }])
      .mockReturnValueOnce([{ id: "d392-as539-as4ki3-a1i3Ab" }])
      .mockReturnValueOnce([{ id: "3sfgb-df5-es43t-sdf5" }])
      .mockReturnValueOnce([{ id: "32-ask239-aski3-3i3ks" }])
      .mockReturnValueOnce([{ id: "vdvf-asdf34-bfd4re-ss" }])
      .mockReturnValueOnce([{ id: "23ffs-sd4hb-bfd4vfdre-asggdf32" }])
      .mockReturnValueOnce([{ id: "424gss-df-asklgi3-ghjh" }])
      .mockReturnValueOnce([{ id: "56uy-gh-bfd4re-sdfg" }]);
    createNodeFile2 = jest
      .fn()
      .mockReturnValueOnce([{ id: "file2-k492-ask239-aski3-3i3ks" }])
      .mockReturnValueOnce([{ id: "file2-1s91-asdf34-bfd4re-asdf32" }])
      .mockReturnValueOnce([{ id: "file2-thjhj-as539-as4ki3-a1i3Ab" }])
      .mockReturnValueOnce([{ id: "file2-3sfgb-df5-es43t-sdf5" }])
      .mockReturnValueOnce([{ id: "file2-hk43-sdfg5u-66dfgh-fg5a" }])
      .mockReturnValueOnce([{ id: "file2-32-ask239-aski3-3i3ks" }])
      .mockReturnValueOnce([{ id: "file2-xx5afd-sd4hb-bfd4vfdre-asggdf32" }])
      .mockReturnValueOnce([{ id: "file2-56uy-gh-bfd4re-sdfg" }])
      .mockReturnValueOnce([{ id: "file2-5dfg4k-h6745-ry77-jt5" }]);
    actions = {
      createNodeField: {},
      createParentChildLink: jest.fn(),
      createContentDigest,
    };
    createNodeId = jest.fn().mockImplementation((seed) => {
      return "1";
    });
    loadNodeContent = jest
      .fn()
      .mockReturnValueOnce(JSON.stringify(file1Json))
      .mockReturnValueOnce(JSON.stringify(file2Json));
    getNode = jest.fn().mockImplementation((parentId) => {
      if (parentId1 === parentId)
        return { dir: "/dir", absolutePath: "/dir/file1.json" };
      else if (parentId2 === parentId)
        return { dir: "/dir", absolutePath: "/dir/file2.json" };
      else if ("node exists test" === parentId) return true;
      else return false;
    });

    nodeApiArgsNode1 = {
      node: transformerJsonNode1,
      getNode,
      loadNodeContent,
      createNodeId,
      createParentChildLink: {},
      createContentDigest,
      actions,
      reporter,
    };
    nodeApiArgsNode2 = {
      node: transformerJsonNode2,
      getNode,
      loadNodeContent,
      createNodeId,
      createParentChildLink: {},
      createContentDigest,
      actions,
      reporter,
    };
  });

  afterEach(() => {});

  test("resolver state equals expected state", async () => {
    actions.createNode = createNodeFile1;
    const getNode = jest.fn().mockReturnValue(false);
    const remarkTree1 = await utils.createJsonMarkdownPropertyNodes({
      wholeTree: JSON.stringify(file1Json),
      treeNode: file1Json,
      jsonNodeId: "1",
      absolutePath: "/dir/file1.json",
      gatsbyType: "DirJson",
      fieldNameBlacklist,
      funcs: {
        getNode,
        createNodeId,
        ...actions,
      },
    });
    actions.createNode = createNodeFile2;
    const remarkTree2 = await utils.createJsonMarkdownPropertyNodes({
      wholeTree: JSON.stringify(file2Json),
      treeNode: file2Json,
      jsonNodeId: "2",
      absolutePath: "/dir/file2.json",
      gatsbyType: "DirJson",
      fieldNameBlacklist,
      funcs: {
        getNode,
        createNodeId,
        ...actions,
      },
    });

    expect(remarkTree1).toEqual(file1ExpectedMarkdownTree);
    expect(remarkTree2).toEqual(file2ExpectedMarkdownTree);
    const expectedState = cloneDeep(file1ExpectedState);
    merge(expectedState, file2ExpectedState);
    const resolverState = utils.storage.get(CACHE_KEY_RESOLVER);
    expect(JSON.stringify(expectedState, null, "  ")).toEqual(
      JSON.stringify(resolverState, null, "  ")
    );
    expect(
      resolverState["/dir/file2.json"]["DirJsonSomeObject"][
        "content2Html"
      ].resolve.toString()
    ).toBe(
      utils.htmlResolver(utils.storage, CACHE_KEY_RESOLVER).resolve.toString()
    );
  });

  test("delete path from state", async () => {
    actions.createNode = createNodeFile1;
    await onCreateNode(nodeApiArgsNode1, {
      fieldNameBlacklist,
      paths: ["/dir"],
    });
    actions.createNode = createNodeFile2;
    await onCreateNode(nodeApiArgsNode2, {
      fieldNameBlacklist,
      paths: ["/dir"],
    });
    const state = utils.storage.get(CACHE_KEY_RESOLVER);
    const removeAction = removePath({ absolutePath: "/dir/file2.json" });
    const newState = utils.resolverReducer(state, removeAction);
    expect(JSON.stringify(newState)).toEqual(
      JSON.stringify(file1ExpectedState)
    );
    expect(
      state["/dir/file2.json"]["DirJsonSomeObjectSomeArrayOfObjects"][
        "content2Html"
      ][0]
    ).toBe(undefined);
  });

  test("run expected state from two json files run through gatsby-node createResolvers and onCreateNode, ", async () => {
    actions.createNode = createNodeFile1;
    await onCreateNode(nodeApiArgsNode1, {
      fieldNameBlacklist,
      paths: ["/dir"],
    });
    actions.createNode = createNodeFile2;
    await onCreateNode(nodeApiArgsNode2, {
      fieldNameBlacklist,
      paths: ["/dir"],
    });

    const expectedState = cloneDeep(file1ExpectedState);
    merge(expectedState, file2ExpectedState);
    const state = utils.storage.get(CACHE_KEY_RESOLVER);
    const resolvers = utils.constructResolvers(state);

    expect(JSON.stringify(state, null, "  ")).toEqual(
      JSON.stringify(expectedState, null, "  ")
    );
    expect(await createResolvers({ createResolvers: createResolversArg })).toBe(
      undefined
    );
    expect(JSON.stringify(resolvers, null, "  ")).toEqual(
      JSON.stringify(expectedResolvers, null, "  ")
    );
    expect(resolvers.DirJson.content1Html.mIds).toBeUndefined();
  });

  test("reject node if file/path isn't allowed ", async () => {
    actions.createNode = createNodeFile1;
    await onCreateNode(nodeApiArgsNode1, {
      fieldNameBlacklist,
      paths: ["/dir1"],
    });
    const state = utils.storage.get(CACHE_KEY_RESOLVER);
    expect(state).toBeUndefined();
  });

  test("reject node if node isn't owned by transformer-json ", async () => {
    actions.createNode = createNodeFile1;
    nodeApiArgsNode1.node.internal.owner = "not transformer-json";
    await onCreateNode(nodeApiArgsNode1, {
      fieldNameBlacklist,
      paths: ["/dir"],
    });
    const state = utils.storage.get(CACHE_KEY_RESOLVER);
    expect(state).toBeUndefined();
  });

  test("create no nodes if options are empty", async () => {
    actions.createNode = createNodeFile1;
    nodeApiArgsNode1.node.internal.owner = "not transformer-json";
    await onCreateNode(nodeApiArgsNode1);
    const state = utils.storage.get(CACHE_KEY_RESOLVER);
    expect(state).toBeUndefined();
  });
});

test("empty resolvers causes log warn in createResolvers", () => {
  const reporter = { warn: jest.fn() };
  createResolvers({ createResolvers: jest.fn(), reporter });
  expect(reporter.warn.mock.calls.length).toBe(1);
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

const createResolverArguments = (action, result) => {
  const mockSource = {};
  const mockContext = {
    nodeModel: {
      getNodeById: jest
        .fn()
        .mockReturnValue({ absolutePath: action.absolutePath }),
      findRootNodeAncestor: jest.fn().mockReturnValue({ id: "" }),
    },
  };
  const mockInfo = {
    path: { prev: { key: action.index } },
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
  return { mockSource, mockContext, mockInfo };
};
