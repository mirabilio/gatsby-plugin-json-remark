"use strict";

const upperFirst = require("lodash.upperfirst");

const _TYPE_JSON_REMARK_PROPERTY = "JsonRemarkProperty";
const _TYPE_JSON_REMARK = "JsonRemark";
const _OWNER_JSON_TRANSFORMER = "gatsby-transformer-json";
const typeMods = new Map();

const createJsonMarkdownPropertyNodes = ({
  transformerJsonNode,
  fileNode,
  funcs,
  gatsbyType = "",
  objectPath = "",
  tree,
  treeNode,
  arrayIndex,
  treeNewState = {
    tree: {},
    treeNode: {},
  },
  blacklist = [],
  whitelist = [],
}) => {
  const {
    createContentDigest,
    createNode,
    createNodeId,
    createParentChildLink,
    getNode,
  } = funcs;

  if (tree === treeNode) {
    treeNewState.tree = treeNewState.treeNode;
    gatsbyType = objectPath = transformerJsonNode.internal.type;
    typeMods.set(fileNode.absolutePath, new Map());
  }

  const resultObj = Object.keys(treeNode)
    .filter((key) => !blacklist.includes(key))
    .reduce(
      (_resultObj, key) => {
        if (typeof treeNode[key] !== "object") {
          const propNodeIdInput = `${
            transformerJsonNode.id
          } >>> ${_TYPE_JSON_REMARK_PROPERTY} >>> ${objectPath.concat(
            `.${key}`
          )}`;
          const propNodeId = createNodeId(propNodeIdInput);
          const nodeExists = getNode(propNodeId);

          if (!nodeExists) {
            const propNode = {
              id: propNodeId,
              parent: transformerJsonNode.id,
              [`internal${_TYPE_JSON_REMARK_PROPERTY}`.toString()]: {
                leafName: key,
                gatsbyType,
                objectPath: objectPath.concat(`.${key}`),
              },
              internal: {
                content: "" + treeNode[key],
                // in case content[key] is a boolean
                type: _TYPE_JSON_REMARK_PROPERTY,
                mediaType: "text/markdown",
              },
            };
            propNode.internal.contentDigest = createContentDigest(
              JSON.stringify(propNode)
            ); // sets object reference on new tree via closure.
            // TODO: refactor

            const treeNodePromise = createNode(propNode).then((result) => {
              const makeStorageObj =
                typeof arrayIndex === "undefined" ? () => new Map() : () => [];

              const a = typeMods.get(fileNode.absolutePath);
              const aif = a.has(gatsbyType);

              if (!aif)
                typeMods
                  .get(fileNode.absolutePath)
                  .set(gatsbyType, makeStorageObj());
              const file = typeMods.get(fileNode.absolutePath);

              if (typeof arrayIndex === "undefined") {
                file.get(gatsbyType).set(key, result[0].id);
              } else {
                if (!file.get(gatsbyType)[arrayIndex])
                  file.get(gatsbyType)[arrayIndex] = {};
                file.get(gatsbyType)[arrayIndex][key] = result[0].id;
              } // if (!typeMods.has(gatsbyType))
              //   typeMods.set(gatsbyType, makeStorageObj());
              // if (typeof arrayIndex === "undefined") {
              //   typeMods.get(gatsbyType).set(key, result[0].id);
              // } else {
              //   if (!typeMods.get(gatsbyType)[arrayIndex])
              //     typeMods.get(gatsbyType)[arrayIndex] = {};
              //   typeMods.get(gatsbyType)[arrayIndex][key] = result[0].id;
              // }

              _resultObj.treeNewState.treeNode[key] = {};
              _resultObj.treeNewState.treeNode[key][
                "childMarkdownRemark___NODE"
              ] = result[0].id;
              _resultObj.treeNewState.treeNode[key]["originalValue"] =
                treeNode[key];
              return result;
            });
            createParentChildLink({
              parent: transformerJsonNode,
              child: propNode,
            });
            _resultObj.promises = [..._resultObj.promises, treeNodePromise];
          }

          return _resultObj;
        } else {
          const newGatsbyType = gatsbyType.concat(
            isNum(key)
              ? `` // it's an array, don't concat the key
              : upperFirst(key)
          );
          _resultObj.treeNewState.treeNode[key] = Array.isArray(treeNode[key])
            ? []
            : {};

          const __resultObj = createJsonMarkdownPropertyNodes({
            transformerJsonNode,
            fileNode,
            funcs,
            // TODO: not perfect. "08" returns true.
            gatsbyType: newGatsbyType,
            objectPath: objectPath.concat(`.${key}`),
            treeNode: treeNode[key],
            arrayIndex: isNum(key) ? parseInt(key, 10) : undefined,
            // TODO: document: keys as numbers aren't supported
            tree,
            treeNewState: {
              tree: _resultObj.treeNewState.tree,
              treeNode: _resultObj.treeNewState.treeNode[key],
            },
            blacklist,
            whitelist,
          });

          _resultObj.promises = _resultObj.promises.concat(
            ...__resultObj.promises
          );
          return _resultObj;
        }
      },
      {
        promises: [],
        treeNewState,
      }
    );
  return resultObj;
};

const isFileAllowed = ({ fileNode, pathsInclude, pathsExclude }) => {
  return (
    !pathsExclude.includes(fileNode.dir) &&
    !pathsExclude.includes(fileNode.absolutePath) &&
    (pathsInclude.includes(fileNode.dir) ||
      pathsInclude.includes(fileNode.absolutePath))
  );
};

exports.onCreateNode = async (nodeApiArgs, pluginOptions = {}) => {
  const { paths = [], pathsExclude = [] } = pluginOptions;
  const {
    node,
    actions,
    createNodeId,
    createContentDigest,
    getNode,
    loadNodeContent,
  } = nodeApiArgs;
  const {
    createNode,
    createNodeField,
    createParentChildLink,
    touchNode,
  } = actions;
  const jsonParent = getNode(node.parent);
  if (
    !jsonParent ||
    node.internal.owner !== _OWNER_JSON_TRANSFORMER ||
    !isFileAllowed({
      fileNode: jsonParent,
      pathsInclude: paths,
      pathsExclude,
    }) // || node.path !== "/about"
  )
    return; // gatsby-transformer-json built/rebuilt a json node.
  //  therefore, delete existing resolver data for that file.

  typeMods.delete(jsonParent.absolutePath);
  const treeNode = JSON.parse(await loadNodeContent(jsonParent));
  const resultObj = createJsonMarkdownPropertyNodes({
    transformerJsonNode: node,
    fileNode: jsonParent,
    treeNode,
    tree: treeNode,
    funcs: {
      createNodeId,
      createContentDigest,
      createNode,
      createNodeField,
      createParentChildLink,
      loadNodeContent,
      getNode,
      touchNode,
    },
    blacklist: pluginOptions.fieldNameBlacklist,
    whitelist: pluginOptions.fieldNameWhitelist, // TODO: support whitelist
  });
  return Promise.all(resultObj.promises).then(() => {
    const propAggregateNode = {
      id: createNodeId(`${node.id} >>> Parent of JSON Props`),
      internal: {
        type: _TYPE_JSON_REMARK,
      },
      ...resultObj.treeNewState.tree, // this tree is built by the resultObj.promises' then() clauses
    };
    propAggregateNode.internal.contentDigest = createContentDigest(
      JSON.stringify(propAggregateNode)
    );
    const parentPromise = createNode(propAggregateNode);
    createParentChildLink({
      parent: node,
      child: propAggregateNode,
    });
    return parentPromise;
  });
}; // TODO: refactor common code

exports.createResolvers = ({ createResolvers, intermediateSchema }) => {
  const html = () => {
    return {
      type: "String",

      async resolve(source, _, context, info) {
        const origPropValue =
          source[info.fieldName.substring(0, info.fieldName.length - 4)];
        if (typeof origPropValue === "undefined") return;
        const parentId = context.nodeModel.findRootNodeAncestor(source);
        const parentFile = await context.nodeModel.getNodeById({
          id: parentId.id,
        });
        const fileMap = typeMods.get(parentFile.absolutePath);
        if (!fileMap) return;
        const gatsbyType = fileMap.get(info.parentType.name);
        if (!gatsbyType) return;
        const id = gatsbyType.get(
          info.fieldName.substring(0, info.fieldName.length - 4)
        );
        const resolver = info.schema.getType("MarkdownRemark").getFields()[
          "html"
        ].resolve;
        const node = await context.nodeModel.getNodeById({
          id,
        });
        const html = await resolver(node, {}, context, {
          ...info,
          fieldName: "html",
        });
        return html;
      },
    };
  };

  const htmlOfArray = (objKey, arry) => {
    return {
      type: "String",

      async resolve(source, args, context, info) {
        if (
          typeof source[
            info.fieldName.substring(0, info.fieldName.length - 4)
          ] === "undefined"
        )
          return;
        const parentId = context.nodeModel.findRootNodeAncestor(source);
        const parentFile = await context.nodeModel.getNodeById({
          id: parentId.id,
        });
        const fileMap = typeMods.get(parentFile.absolutePath);
        if (!fileMap) return;
        const gatsbyType = fileMap.get(info.parentType.name);
        if (!gatsbyType) return;
        const resolver = info.schema.getType("MarkdownRemark").getFields()[
          "html"
        ].resolve;
        const node = await context.nodeModel.getNodeById({
          id:
            gatsbyType[info.path.prev.key][
              info.fieldName.substring(0, info.fieldName.length - 4)
            ],
        });
        const html = await resolver(node, {}, context, {
          ...info,
          fieldName: "html",
        });
        return html;
      },
    };
  };

  const resolvers = {};

  for (const [typeMap] of typeMods) {
    for (const [type, collectn] of typeMods.get(typeMap)) {
      resolvers[type] = {};

      if (Array.isArray(collectn)) {
        const _res = collectn.reduce((_resolvers, obj) => {
          return (_resolvers = {
            ..._resolvers,
            ...Object.keys(obj).reduce((__resolvers, objKey) => {
              if (_resolvers[objKey.concat("Html")]) return __resolvers;
              __resolvers[objKey.concat("Html")] = {
                ...htmlOfArray(objKey, collectn),
              };
              return __resolvers;
            }, {}),
          });
        }, {});

        resolvers[type] = { ...resolvers[type], ..._res };
      } else {
        for (const [prop] of collectn) {
          // resolvers[type][prop.concat("Html")] = { ...html(id) };
          resolvers[type][prop.concat("Html")] = { ...html() };
        }
      }
    }
  }

  createResolvers(resolvers);
};

const isNum = (key) => {
  return !isNaN(parseInt(key, 10)) && isFinite(key);
};
