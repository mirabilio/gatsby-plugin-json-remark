"use strict";
const isEmpty = require("lodash.isempty");
const chalk = require("chalk");

const { getState, setState } = require("./cache");
const {
  PLUGIN_NAME_JSON_TRANSFORMER,
  NODE_TYPE_JSON_REMARK,
  NODE_TYPE_JSON_REMARK_INTERNAL_STATE,
  PLUGIN_NAME_THIS,
} = require("./constants");
const {
  createJsonMarkdownPropertyNodes,
  constructResolvers,
  resolverReducerAndStore,
  removeDeletedFiles,
} = require("./core");
const { isFileAllowed } = require("./util");
const { removePath } = require("./ActionTypes");

exports.onCreateNode = async (nodeApiArgs, pluginOptions = {}) => {
  const {
    node,
    actions,
    createNodeId,
    createContentDigest,
    getNodesByType,
    getNode,
    loadNodeContent,
    cache,
    reporter,
  } = nodeApiArgs;
  const {
    deleteNode,
    createNode,
    createNodeField,
    createParentChildLink,
  } = actions;
  const {
    paths = [],
    pathsExclude = [],
    fieldNameBlacklist = [],
  } = pluginOptions;
  const jsonParent = getNode(node.parent);
  if (node.internal.owner !== PLUGIN_NAME_JSON_TRANSFORMER) return;
  if (
    !isFileAllowed({
      fileDir: jsonParent.dir,
      fileAbsolutePath: jsonParent.absolutePath,
      pathsInclude: paths,
      pathsExclude,
    })
  )
    return;

  await resolverReducerAndStore({
    cache,
    action: removePath({ absolutePath: jsonParent.absolutePath }),
    reporter,
  });

  const wholeTree = JSON.parse(await loadNodeContent(jsonParent));
  const markdownTree = await createJsonMarkdownPropertyNodes({
    cache,
    wholeTree,
    treeNode: wholeTree,
    jsonNodeId: node.id,
    absolutePath: jsonParent.absolutePath,
    gatsbyType: node.internal.type,
    fieldNameBlacklist,
    reporter,
    funcs: {
      createNodeId,
      createContentDigest,
      createNode,
      createNodeField,
      createParentChildLink,
      loadNodeContent,
      getNode,
    },
  });
  const propAggregateNode = {
    id: createNodeId(`${node.id} >>> Parent of JSON Props`),
    internal: {
      type: NODE_TYPE_JSON_REMARK,
    },
    ...markdownTree,
    resolverState: getState({ cache, reporter }),
  };
  propAggregateNode.internal.contentDigest = createContentDigest(
    JSON.stringify(propAggregateNode)
  );
  await createNode(propAggregateNode);
  createParentChildLink({
    parent: node,
    child: propAggregateNode,
  });

  // TODO: when/if there is a lifecycle api that is called
  // ONCE immediately before schema build, move this code
  // there.
  const stateNodes = getNodesByType(NODE_TYPE_JSON_REMARK_INTERNAL_STATE);
  if (!isEmpty(stateNodes)) deleteNode({ node: stateNodes[0] });

  const stateNode = {
    id: createNodeId(
      `${NODE_TYPE_JSON_REMARK_INTERNAL_STATE} >>> State Node. Singleton.`
    ),
    parent: jsonParent.id,
    internal: {
      type: NODE_TYPE_JSON_REMARK_INTERNAL_STATE,
    },
    resolverState: getState({ cache, reporter }),
  };
  stateNode.internal.contentDigest = createContentDigest(
    JSON.stringify(stateNode)
  );
  await createNode(stateNode);
  createParentChildLink({
    parent: node,
    child: stateNode,
  });
};

exports.sourceNodes = ({ actions, getNodes, reporter }) => {
  const { touchNode } = actions;

  if (process.env.NODE_ENV !== "production") {
    const nodes = getNodes().filter(
      (n) => n.internal.owner === "gatsby-plugin-json-remark"
    );
    nodes.forEach((n) => touchNode({ nodeId: n.id }));

    if (!isEmpty(nodes)) {
      reporter.info(
        `${chalk.cyan(PLUGIN_NAME_THIS)} restored ${chalk.cyan(
          nodes.length
        )} nodes from cache`
      );
    }
  }
};

exports.createResolvers = (nodeApiArgs) => {
  const { createResolvers, getNodesByType, reporter, cache } = nodeApiArgs;

  let state = getState({ cache, reporter });

  if (isEmpty(state)) {
    state = !isEmpty(getNodesByType(NODE_TYPE_JSON_REMARK_INTERNAL_STATE))
      ? getNodesByType(NODE_TYPE_JSON_REMARK_INTERNAL_STATE)[0].resolverState
      : {};
    setState({ state, reporter });
  }

  if (process.env.NODE_ENV !== "production") {
    const { newState, removedFiles } = removeDeletedFiles({
      getNodesByType,
      state,
      reporter,
    });
    if (!isEmpty(removedFiles)) {
      state = newState;
      removedFiles.forEach((f) => {
        reporter.info(
          `${chalk.cyan(
            PLUGIN_NAME_THIS
          )} removed resolvers of deleted file ${chalk.cyan(f)}.`
        );
      });
    }
  }

  const resolvers = constructResolvers({ state, cache, reporter });

  if (isEmpty(state) || isEmpty(resolvers)) {
    reporter.warn(
      `${chalk.cyan(
        PLUGIN_NAME_THIS
      )} found no configured JSON fields to transform.`
    );
    return;
  }

  createResolvers(resolvers);
};

exports.onPreInit = ({ reporter }, { paths }) => {
  if (isEmpty(paths))
    reporter.warn(
      `${chalk.cyan(PLUGIN_NAME_THIS)} required option ${chalk.cyan(
        "paths"
      )} is not configured. No JSON files will be transformed.`
    );
};
