/**
 * createGetter - creates function getter which allows select value from object
 * @param {string} path - the strings path separated by dot
 * @returns {function} - function-getter which allow get value from object by set path
 */
export function createGetter(path) {
  const sep = '.';
  const [...parts] = path.split(sep);
  return function (obj) {
    let curObject = obj;
    for (const part of parts) {
      if (curObject === undefined) {
        break;
      }
      curObject = curObject[part];
    }
    return curObject;
  };
}
