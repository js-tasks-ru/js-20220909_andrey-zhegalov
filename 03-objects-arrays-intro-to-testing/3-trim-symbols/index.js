/**
 * trimSymbols - removes consecutive identical symbols if they quantity bigger that size
 * @param {string} string - the initial string
 * @param {number} size - the allowed size of consecutive identical symbols
 * @returns {string} - the new string without extra symbols according passed size
 */
export function trimSymbols(string, size) {
  if (size === undefined) {
    return string;
  }
  return [...string].filter(trimSymbolFilter(size)).join("");
}

function trimSymbolFilter(size) {
  let curSymbol = null;
  let count = 0;

  return (newSymbol) => {
    if (curSymbol !== newSymbol) {
      curSymbol = newSymbol;
      count = 0;
    }
    return ++count <= size;
  };
}
