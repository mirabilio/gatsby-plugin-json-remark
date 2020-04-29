"use strict";
const isEmpty = require("lodash.isempty");

const {
  PLUGIN_NAME_JSON_TRANSFORMER,
  CACHE_KEY_RESOLVER,
  NODE_TYPE_JSON_REMARK,
} = require("./constants");
const utils = require("./utils");

exports.onCreateNode = async (nodeApiArgs, pluginOptions = {}) => {
  const {
    node,
    actions,
    createNodeId,
    createContentDigest,
    getNode,
    loadNodeContent,
  } = nodeApiArgs;
  const { createNode, createNodeField, createParentChildLink } = actions;
  const {
    paths = [],
    pathsExclude = [],
    fieldNameBlacklist = [],
  } = pluginOptions;
  const jsonParent = getNode(node.parent);
  if (node.internal.owner !== PLUGIN_NAME_JSON_TRANSFORMER) return;
  if (
    !utils.isFileAllowed({
      fileDir: jsonParent.dir,
      fileAbsolutePath: jsonParent.absolutePath,
      pathsInclude: paths,
      pathsExclude,
    })
  )
    return;

  utils.removePath(jsonParent.absolutePath);

  const wholeTree = JSON.parse(await loadNodeContent(jsonParent));
  const markdownTree = await utils.createJsonMarkdownPropertyNodes({
    wholeTree,
    treeNode: wholeTree,
    jsonNodeId: node.id,
    absolutePath: jsonParent.absolutePath,
    gatsbyType: node.internal.type,
    fieldNameBlacklist,
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
  };
  propAggregateNode.internal.contentDigest = createContentDigest(
    JSON.stringify(propAggregateNode)
  );
  await createNode(propAggregateNode);
  createParentChildLink({
    parent: node,
    child: propAggregateNode,
  });
};

exports.createResolvers = ({ createResolvers, reporter }) => {
  const state = utils.storage.get(CACHE_KEY_RESOLVER);
  if (!isEmpty(state)) createResolvers(utils.constructResolvers(state));
  else
    reporter.warn(
      "'gatsby-plugin-json-remark' found no configured JSON fields to transform."
    );
};

exports.onPreInit = ({ reporter }, { paths }) => {
  if (isEmpty(paths))
    reporter.warn(
      "'gatsby-plugin-json-remark' required option 'paths' is not configured. No JSON files will be transformed."
    );
};
