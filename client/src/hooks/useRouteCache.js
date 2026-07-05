const cache = new Map();

export const readRouteCache = (key) => cache.get(key);

export const writeRouteCache = (key, value) => {
  cache.set(key, value);
};

export const clearRouteCache = (key) => {
  cache.delete(key);
};
