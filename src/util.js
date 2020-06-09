const util = require("./util");

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

exports.isNum = (key) => {
  return !isNaN(parseInt(key, 10)) && isFinite(key);
};

exports.def = (x) => x !== null && typeof x !== "undefined";

exports.o = (d, p) => (util.def(d[p]) ? d[p] : (d[p] = {}));

exports.pathToArray = ({ path, root }) => {
  const flattened = [];
  let curr = path;

  root = root.charAt(0).toLowerCase().concat(root.substring(1));

  while (curr) {
    if (curr.key === "node" || curr.key === "edges") {
      flattened.push(root);
      return flattened.reverse();
    }
    flattened.push(curr.key);
    curr = curr.prev;
  }
  flattened[flattened.length - 1] = root;
  return flattened.reverse();
};
