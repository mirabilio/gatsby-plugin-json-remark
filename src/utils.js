const { produce } = require("immer");
const cloneDeep = require("lodash.clonedeep");
const merge = require("lodash.merge");
const omit = require("lodash.omit");

const { addLeaf, removePath, ADD_LEAF, REMOVE_PATH } = require("./ActionTypes");
const {
  NODE_TYPE_JSON_REMARK_PROPERTY,
  MEDIA_TYPE_TEXT_MARKDOWN,
  CACHE_KEY_RESOLVER,
  PLUGIN_NAME_JSON_TRANSFORMER,
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
  objectPath,
  arrIndex,
  fieldNameBlacklist,
  funcs,
}) => {
  const { createNodeId } = funcs;
  const _remarkTreeNode = cloneDeep(remarkTreeNode);
  if (!utils.def(objectPath))
    objectPath = gatsbyType
      .charAt(0)
      .toLowerCase()
      .concat(gatsbyType.substring(1));

  for (const key of Object.keys(treeNode)) {
    if (fieldNameBlacklist.includes(key)) continue;

    if (typeof treeNode[key] !== "object") {
      const propNodeId = createNodeId(objectPath.concat(`.${key}`));

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
        objectPath: objectPath.concat(`.${key}Html`),
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
        objectPath: objectPath.concat(`.${key}`),
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
      const parentFile = context.nodeModel.getNodeById({
        id: context.nodeModel.findRootNodeAncestor(source).id,
      });
      const parentJsonType = context.nodeModel.getNodeById({
        id: parentFile.children.find((child) => {
          const c = context.nodeModel.getNodeById({ id: child });
          return (
            utils.def(c) && c.internal.owner === PLUGIN_NAME_JSON_TRANSFORMER
          );
        }),
      }).internal.type;

      const path = state[parentFile.absolutePath];
      if (!utils.def(path)) return;
      const type = path[info.parentType.name];
      if (!utils.def(type)) return;
      const field = type[info.fieldName];
      if (!utils.def(field)) return;

      const objectPath = utils.pathToArray(info.path);
      objectPath[0] = parentJsonType
        .charAt(0)
        .toLowerCase()
        .concat(parentJsonType.substring(1));
      const markdownRemarkNodeId =
        state?.idsByAbsolutePath?.[parentFile.absolutePath]?.[
          objectPath.join(".")
        ];

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

exports.pathToArray = (path) => {
  const flattened = [];
  let curr = path;

  while (curr) {
    flattened.push(curr.key);
    curr = curr.prev;
  }

  return flattened.reverse();
};

exports.isNum = (key) => {
  return !isNaN(parseInt(key, 10)) && isFinite(key);
};

exports.def = (x) => x !== null && typeof x !== "undefined";

exports.resolverReducer = produce(
  (draft, action) => {
    const bp = (d, p) => (utils.def(d[p]) ? d[p] : (d[p] = {}));

    switch (action.type) {
      case ADD_LEAF:
        bp(bp(draft, "idsByAbsolutePath"), action.absolutePath)[
          action.objectPath
        ] = action.markdownRemarkId;
        if (
          !draft?.[action.absolutePath]?.[action.gatsbyType]?.[action.leafName]
        ) {
          const leaf = bp(
            bp(bp(draft, action.absolutePath), action.gatsbyType),
            action.leafName
          );
          leaf.type = "String";
          leaf.resolve = action.resolve;
        }
        break;
      case REMOVE_PATH: {
        delete draft[action.absolutePath];
        delete draft.idsByAbsolutePath[action.absolutePath];
        break;
      }
    }
  },
  { idsByAbsolutePath: {} }
);

exports.constructResolvers = (state) => {
  return Object.keys(omit(state, ["idsByAbsolutePath"])).reduce(
    (sa, file) =>
      merge(
        sa,
        Object.keys(state[file]).reduce((fa, type) => {
          merge(
            (fa[type] = {}),
            Object.keys(state[file][type]).reduce((ta, prop) => {
              ta[prop] = { ...state[file][type][prop] };
              return ta;
            }, {})
          );
          return fa;
        }, {})
      ),
    {}
  );
};
