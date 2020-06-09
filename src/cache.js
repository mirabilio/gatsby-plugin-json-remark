const { CACHE_KEY_RESOLVER } = require("./constants");
const cloneDeep = require("lodash.clonedeep");
const isUndefined = require("lodash.isundefined");
const isEmpty = require("lodash.isempty");

const _stateCache = new Map(); // internal storage for production env

const clearStateCache = () => {
  _stateCache.clear();
};
exports.clearStateCache = clearStateCache;

// if local state is empty, check cache if non-dev env
const getState = ({ cache, reporter }) => {
  const localState = cloneDeep(_stateCache.get(CACHE_KEY_RESOLVER));
  if (isUndefined(localState)) return setState({ state: {}, reporter });
  else return localState;

  // if (isUndefined(localState) && process.env.NODE_ENV !== "production") {
  //   const cachedState = await cacheState({ cache, reporter });
  //   if (isUndefined(cachedState)) {
  //     return setState({ state: {}, reporter });
  //   }
  // }

  // return cloneDeep(_stateCache.get(CACHE_KEY_RESOLVER));
};
exports.getState = getState;

const setState = ({ state, reporter }) => {
  _stateCache.set(CACHE_KEY_RESOLVER, cloneDeep(state));
  return cloneDeep(state);
};
exports.setState = setState;

// const cacheState = async ({ cache, state, reporter }) => {
//   if (process.env.NODE_ENV !== "production" && typeof cache === "undefined") {
//     reporter.error("gatsby cache object required when not in production.");
//     throw new Error("gatsby cache object required when not in production.");
//   }

//   if (!isUndefined(state)) {
//     await cache.set(CACHE_KEY_RESOLVER, cloneDeep(state));
//     return cloneDeep(state);
//   } else {
//     const cachedState = await cache.get(CACHE_KEY_RESOLVER);
//     return cloneDeep(cachedState);
//   }
// };
// exports.cacheState = cacheState;
