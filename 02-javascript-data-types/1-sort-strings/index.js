/**
 * sortStrings - sorts array of string by two criteria "asc" or "desc"
 * @param {string[]} arr - the array of strings
 * @param {string} [param="asc"] param - the sorting type "asc" or "desc"
 * @returns {string[]}
 */
export function sortStrings(arr, param = "asc") {
  const copy = [...arr];
  const rererse = param === "desc" ? -1 : 1;
  return copy.sort(
    (a, b) => rererse * a.localeCompare(b, ["ru", "en"], { caseFirst: "upper" })
  );
}
