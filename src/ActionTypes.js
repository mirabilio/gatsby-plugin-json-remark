const ADD_LEAF = "ADD_LEAF";
const REMOVE_PATH = "REMOVE_PATH";
exports.ADD_LEAF = ADD_LEAF;
exports.REMOVE_PATH = REMOVE_PATH;

const addLeaf = ({
  absolutePath,
  gatsbyType,
  index = 0,
  leafName,
  leafType = "String",
  objectPath,
  markdownRemarkId,
}) => {
  return {
    type: ADD_LEAF,
    absolutePath,
    baseExcerpt:
      absolutePath.length < 11
        ? absolutePath
        : `[...] ${absolutePath.substring(absolutePath.length - 25)}`,
    gatsbyType,
    index,
    leafNameSource: leafName,
    leafName: leafName.concat("Html"),
    leafType,
    objectPath,
    markdownRemarkId,
  };
};
const removePath = ({ absolutePath }) => {
  return {
    type: REMOVE_PATH,
    absolutePath,
  };
};

exports.addLeaf = addLeaf;
exports.removePath = removePath;
