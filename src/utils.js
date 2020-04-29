const { produce } = require("immer");
const cloneDeep = require("lodash.clonedeep");
const merge = require("lodash.merge");
const omit = require("lodash.omit");

const { addLeaf, removePath, ADD_LEAF, REMOVE_PATH } = require("./ActionTypes");
const {
  NODE_TYPE_JSON_REMARK_PROPERTY,
  MEDIA_TYPE_TEXT_MARKDOWN,
  CACHE_KEY_RESOLVER,
} = require("./constants");
const utils = require("./utils");

exports.storage = new Map();

exports.removePath = (absolutePath) => {
  utils.storage.set(
    CACHE_KEY_RESOLVER,
    utils.resolverReducer(
      utils.storage.get(CACHE_KEY_RESOLVER),
      removePath({ absolutePath })
    )
  );
};

exports.createJsonMarkdownPropertyNodes = async ({
  wholeTree,
  treeNode,
  remarkTreeNode = {},
  jsonNodeId,
  absolutePath,
  gatsbyType,
  arrIndex,
  fieldNameBlacklist,
  funcs,
}) => {
  const { createNodeId } = funcs;
  const _remarkTreeNode = cloneDeep(remarkTreeNode);

  for (const key of Object.keys(treeNode)) {
    if (fieldNameBlacklist.includes(key)) continue;

    if (typeof treeNode[key] !== "object") {
      const propNodeIdInput = utils.createPropNodeId({
        wholeTree: JSON.stringify(wholeTree),
        jsonNodeId,
        nodeType: NODE_TYPE_JSON_REMARK_PROPERTY,
        absolutePath,
        gatsbyType,
        key,
        index: arrIndex,
      });
      const propNodeId = createNodeId(propNodeIdInput);

      const markdownRemarkNode = await utils.createJsonPropNode({
        propNodeId,
        content: treeNode[key],
        jsonNodeId,
        funcs,
      });

      const leafAction = addLeaf({
        absolutePath,
        gatsbyType,
        leafName: key,
        markdownRemarkId: markdownRemarkNode.id,
        resolve: utils.htmlResolver(utils.storage, CACHE_KEY_RESOLVER).resolve,
      });
      if (utils.isNum(arrIndex)) leafAction.index = arrIndex;
      const newState = utils.resolverReducer(
        utils.storage.get(CACHE_KEY_RESOLVER),
        leafAction
      );
      utils.storage.set(CACHE_KEY_RESOLVER, newState);

      _remarkTreeNode[key.concat("MarkdownRemark___NODE")] =
        markdownRemarkNode.id;
    } else {
      _remarkTreeNode[key] = Array.isArray(treeNode[key]) ? [] : {};
      const result = await utils.createJsonMarkdownPropertyNodes({
        wholeTree,
        treeNode: treeNode[key],
        remarkTreeNode: _remarkTreeNode[key],
        jsonNodeId,
        absolutePath,
        gatsbyType: utils.isNum(key)
          ? gatsbyType
          : gatsbyType.concat(
              key.charAt(0).toUpperCase().concat(key.substring(1))
            ),
        arrIndex: utils.isNum(key) ? key : undefined,
        fieldNameBlacklist,
        funcs,
      });
      _remarkTreeNode[key] = result;
    }
  }
  return _remarkTreeNode;
};

exports.isFileAllowed = ({
  fileDir,
  fileAbsolutePath,
  pathsInclude = [],
  pathsExclude = [],
}) => {
  return (
    !pathsExclude.includes(fileDir) &&
    !pathsExclude.includes(fileAbsolutePath) &&
    (pathsInclude.includes(fileDir) || pathsInclude.includes(fileAbsolutePath))
  );
};

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

exports.htmlResolver = (storage, cacheKey) => {
  return {
    type: "String",
    resolve: async (source, args, context, info) => {
      const state = storage.get(cacheKey);
      const index = utils.isNum(info.path.prev.key) ? info.path.prev.key : 0;
      const parentFile = context.nodeModel.getNodeById({
        id: context.nodeModel.findRootNodeAncestor(source).id,
      });
      const path = state[parentFile.absolutePath];
      if (!utils.def(path)) return;
      const type = path[info.parentType.name];
      if (!utils.def(type)) return;
      const field = type[info.fieldName];
      if (!utils.def(field)) return;
      const markdownRemarkNodeIds = field.mIds;
      if (!utils.def(markdownRemarkNodeIds)) return;
      const markdownRemarkNodeId = markdownRemarkNodeIds[index];
      if (!utils.def(markdownRemarkNodeId)) return;

      const resolver = info.schema.getType("MarkdownRemark").getFields()["html"]
        .resolve;
      const node = context.nodeModel.getNodeById({ id: markdownRemarkNodeId });
      const html = await resolver(node, {}, context, {
        ...info,
        fieldName: "html",
      });
      return html;
    },
  };
};

exports.isNum = (key) => {
  return !isNaN(parseInt(key, 10)) && isFinite(key);
};

exports.def = (x) => x !== null && typeof x !== "undefined";

exports.resolverReducer = produce((draft, action) => {
  const bp = (d, p) => (utils.def(d[p]) ? d[p] : (d[p] = {}));
  const ar = (i, n) => {
    const _a = [];
    _a[i] = n;
    return _a;
  };
  const bl = (l, resolve, i, n) =>
    utils.def(l.mIds)
      ? (l.mIds[i] = n)
      : ((l.type = "String"), (l.mIds = ar(i, n)), (l.resolve = resolve));

  switch (action.type) {
    case ADD_LEAF:
      bl(
        bp(
          bp(bp(draft, action.absolutePath), action.gatsbyType),
          action.leafName
        ),
        action.resolve,
        action.index,
        action.markdownRemarkId
      );
      break;
    case REMOVE_PATH: {
      delete draft[action.absolutePath];
    }
  }
}, {});

const required = ([o, ...os], p, f, memo) =>
  utils.def(o) ? required(os, p, f, f(memo, p, o)) : memo;
// add content
exports.createPropNodeId = (p) => {
  p.index = utils.def(p.index) ? p.index : 0;
  const missing = required(
    Object.keys(p),
    p,
    (memo, p, o) => (!utils.def(p[o]) ? [...memo, o] : memo),
    []
  );
  if (missing.length > 0)
    throw new Error(
      `Required field(s) for node ID generation are missing: ${missing.join(
        ", "
      )}`
    );
  return `${p.wholeTree} ${p.jsonNodeId} ${p.nodeType} ${p.absolutePath} ${p.gatsbyType} ${p.index} ${p.key}`;
};

exports.constructResolvers = (state) => {
  return Object.keys(state).reduce(
    (sa, file) =>
      merge(
        sa,
        Object.keys(state[file]).reduce((fa, type) => {
          merge(
            (fa[type] = {}),
            Object.keys(state[file][type]).reduce((ta, prop) => {
              const o = omit(state[file][type][prop], ["mIds"]);
              ta[prop] = o;
              return ta;
            }, {})
          );
          return fa;
        }, {})
      ),
    {}
  );
};
