/**
 * sortStrings - sorts array of string by two criteria "asc" or "desc"
 * @param {string[]} arr - the array of strings
 * @param {string} [param="asc"] param - the sorting type "asc" or "desc"
 * @returns {string[]}
 */
export function sortStrings(arr, param = "asc") {
  const copy = [...arr];
  const reverse = makeReverse(param);
  return copy.sort(
    (a, b) => reverse * a.localeCompare(b, ["ru", "en"], { caseFirst: "upper" })
  );
}

function makeReverse(param) {
  switch (param) {
    case "asc":
      return 1;
    case "desc":
      return -1;
    default:
      throw new Error("parametr ${param} not allowed");
  }
}
