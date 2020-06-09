const cloneDeep = require("lodash.clonedeep");
const isUndefined = require("lodash.isundefined");
const without = require("lodash.without");
const chalk = require("chalk");

const { setState, getState } = require("./cache");

const { addLeaf, ADD_LEAF, REMOVE_PATH } = require("./ActionTypes");
const {
  NODE_TYPE_JSON_REMARK_PROPERTY,
  MEDIA_TYPE_TEXT_MARKDOWN,
  PLUGIN_NAME_JSON_TRANSFORMER,
  PLUGIN_NAME_THIS,
} = require("./constants");
const { o, def, isNum, pathToArray } = require("./util");
const core = require("./core");

const createJsonMarkdownPropertyNodes = async ({
  cache,
  wholeTree,
  treeNode,
  remarkTreeNode = {},
  jsonNodeId,
  absolutePath,
  gatsbyType,
  objectPath,
  arrIndex,
  fieldNameBlacklist,
  funcs,
  reporter,
}) => {
  const { createNodeId } = funcs;
  const _remarkTreeNode = cloneDeep(remarkTreeNode);
  if (!def(objectPath))
    objectPath = gatsbyType
      .charAt(0)
      .toLowerCase()
      .concat(gatsbyType.substring(1));

  for (const key of Object.keys(treeNode)) {
    if (fieldNameBlacklist.includes(key)) continue;

    if (typeof treeNode[key] !== "object") {
      const propNodeId = createNodeId(
        `${absolutePath} -> ${objectPath}.${key}`
      );

      const markdownRemarkNode = await core.createJsonPropNode({
        propNodeId,
        content: treeNode[key],
        jsonNodeId,
        funcs,
      });

      const leafAction = addLeaf({
        absolutePath,
        gatsbyType,
        leafName: key,
        objectPath: objectPath.concat(`.${key}Html`),
        markdownRemarkId: markdownRemarkNode.id,
      });
      if (isNum(arrIndex)) leafAction.index = arrIndex;
      await core.resolverReducerAndStore({
        action: leafAction,
        cache,
        reporter,
      });

      _remarkTreeNode[key.concat("MarkdownRemark___NODE")] =
        markdownRemarkNode.id;
    } else {
      _remarkTreeNode[key] = Array.isArray(treeNode[key]) ? [] : {};
      const result = await core.createJsonMarkdownPropertyNodes({
        cache,
        wholeTree,
        treeNode: treeNode[key],
        remarkTreeNode: _remarkTreeNode[key],
        jsonNodeId,
        absolutePath,
        objectPath: objectPath.concat(`.${key}`),
        gatsbyType: isNum(key)
          ? gatsbyType
          : gatsbyType.concat(
              key.charAt(0).toUpperCase().concat(key.substring(1))
            ),
        arrIndex: isNum(key) ? key : undefined,
        fieldNameBlacklist,
        funcs,
        reporter,
      });
      _remarkTreeNode[key] = result;
    }
  }
  return _remarkTreeNode;
};
exports.createJsonMarkdownPropertyNodes = createJsonMarkdownPropertyNodes;

exports.createJsonPropNode = async ({
  propNodeId,
  content,
  jsonNodeId,
  funcs: { createContentDigest, createNode, createParentChildLink, getNode },
}) => {
  const propNode = {
    id: propNodeId,
    parent: jsonNodeId,
    internal: {
      content: "" + content, // "" is for booleans
      type: NODE_TYPE_JSON_REMARK_PROPERTY,
      mediaType: MEDIA_TYPE_TEXT_MARKDOWN,
    },
  };
  propNode.internal.contentDigest = createContentDigest(
    JSON.stringify(propNode)
  );
  const markdownRemarkNode = (await createNode(propNode))[0];
  createParentChildLink({
    parent: getNode(jsonNodeId),
    child: propNode,
  });
  return markdownRemarkNode;
};

const htmlResolver = ({ cache, reporter }) => {
  return async (source, args, context, info) => {
    const state = getState({ cache, reporter });
    const parentFile = context.nodeModel.getNodeById({
      id: context.nodeModel.findRootNodeAncestor(source).id,
    });
    const parentJsonType = context.nodeModel.getNodeById({
      id: parentFile.children.find((child) => {
        const c = context.nodeModel.getNodeById({ id: child });
        return def(c) && c.internal.owner === PLUGIN_NAME_JSON_TRANSFORMER;
      }),
    }).internal.type;

    if (isUndefined(state[parentFile.absolutePath])) return;

    const markdownRemarkId =
      state[parentFile.absolutePath][
        pathToArray({ path: info.path, root: parentJsonType }).join(".")
      ];

    if (isUndefined(markdownRemarkId)) return;

    const resolver = info.schema.getType("MarkdownRemark").getFields()["html"]
      .resolve;
    const node = context.nodeModel.getNodeById({
      id: markdownRemarkId,
    });
    const html = await resolver(node, {}, context, {
      ...info,
      fieldName: "html",
    });
    return html;
  };
};
exports.htmlResolver = htmlResolver;

const removeDeletedFiles = ({ getNodesByType, state, reporter }) => {
  const newState = getNodesByType("File").reduce((fs, f) => {
    if (!isUndefined(state[f.absolutePath])) {
      fs[f.absolutePath] = cloneDeep(state[f.absolutePath]);
    }
    return fs;
  }, {});

  setState({ state: newState, reporter });

  return {
    newState,
    removedFiles: without(Object.keys(state), ...Object.keys(newState)),
  };
};
exports.removeDeletedFiles = removeDeletedFiles;

const resolverReducerAndStore = ({ action, cache, reporter }) => {
  const draft = isUndefined(getState({ cache, reporter }))
    ? {}
    : getState({ cache, reporter });

  let rtype;

  switch (action.type) {
    case ADD_LEAF:
      // add resolvers
      reporter.info(
        `${chalk.cyan(PLUGIN_NAME_THIS)} adding resolver for ${chalk.cyan(
          action.objectPath
        )} in file ${chalk.cyan(
          action.baseExcerpt
        )} with MarkdownRemark node id ${chalk.cyan(action.markdownRemarkId)}`
      );
      rtype = o(
        o(o(draft, action.absolutePath), "resolvers"),
        action.gatsbyType
      );
      rtype[action.leafName] = {};

      // add markdownRemark id
      draft[action.absolutePath][action.objectPath] = action.markdownRemarkId;
      break;
    case REMOVE_PATH: {
      delete draft[action.absolutePath];
      break;
    }
  }
  // return a copy of state
  return setState({ state: draft, reporter });
};
exports.resolverReducerAndStore = resolverReducerAndStore;

const constructResolvers = ({ state, cache, reporter }) => {
  const resolvers = {};
  for (const p of Object.keys(state)) {
    for (const t of Object.keys(state[p].resolvers)) {
      for (const l of Object.keys(state[p].resolvers[t])) {
        o(o(resolvers, t), l);
        resolvers[t][l] = {
          resolve: core.htmlResolver({ cache, reporter }),
          type: "String",
        };
      }
    }
  }
  return cloneDeep(resolvers);
};
exports.constructResolvers = constructResolvers;
