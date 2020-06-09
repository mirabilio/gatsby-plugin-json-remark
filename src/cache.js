const { CACHE_KEY_RESOLVER } = require("./constants");
const cloneDeep = require("lodash.clonedeep");
const isUndefined = require("lodash.isundefined");

const _stateCache = new Map(); // internal storage for production env

const clear = () => {
  _stateCache.clear();
};
exports.clear = clear;

// if local state is empty, check cache if non-dev env
const getState = ({ cache, reporter }) => {
  const localState = cloneDeep(_stateCache.get(CACHE_KEY_RESOLVER));
  if (isUndefined(localState)) return setState({ state: {}, reporter });
  else return localState;
};
exports.getState = getState;

const setState = ({ state, reporter }) => {
  _stateCache.set(CACHE_KEY_RESOLVER, cloneDeep(state));
  return cloneDeep(state);
};
exports.setState = setState;
