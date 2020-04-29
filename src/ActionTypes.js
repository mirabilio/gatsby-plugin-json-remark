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
  markdownRemarkId,
  resolve,
}) => {
  return {
    type: ADD_LEAF,
    absolutePath,
    gatsbyType,
    index,
    leafNameSource: leafName,
    leafName: leafName.concat("Html"),
    leafType,
    markdownRemarkId,
    resolve,
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
