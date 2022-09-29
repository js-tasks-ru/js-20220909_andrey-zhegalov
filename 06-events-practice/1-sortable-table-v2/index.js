export default class SortableTable {
  isSortLocally = false;
  defaultOrder = "desc";

  constructor(headersConfig, { data = [], sorted = {} } = {}) {
    this.headersConfig = headersConfig;
    this.data = data;
    this.currentSortConfig = sorted;

    this.render();
  }

  get tempalte() {
    return `
      <div class="sortable-table">
        <div data-element="header" class="sortable-table__header sortable-table__row">
          ${this.headerBody}
        </div>

        <div data-element="body" class="sortable-table__body">
        </div>

        <div data-element="loading" class="loading-line sortable-table__loading-line"></div>

        <div data-element="emptyPlaceholder" class="sortable-table__empty-placeholder">
        </div>
      </div>
    `;
  }

  updateBody(data) {
    const html = data
      .map((rowData) => {
        return `
                <a class="sortable-table__row">
                  ${this.makeRowBody(rowData)}
                </a>
          `;
      })
      .join("");
    this.subElements.body.innerHTML = html;
  }

  makeRowBody(rowData) {
    return this.headersConfig
      .map(({ template, id }) => {
        return template
          ? template(rowData[id])
          : `<div class="sortable-table__cell">${rowData[id]}</div>`;
      })
      .join("");
  }

  get headerBody() {
    const result = this.headersConfig
      .map(({ id, title, sortable }) => {
        return `<div class="sortable-table__cell" data-id="${id}" data-sortable="${sortable}">
                      <span>${title}</span>
                    </div>`;
      })
      .join("");
    return result;
  }

  sort(field, type) {
    const copy = [...this.data];
    const comparator = this.getComparator(field, type);
    const sortedData = copy.sort(comparator);
    this.updateBody(sortedData);
  }

  getComparator(field, type) {
    const sortType = this.headersConfig
      .filter((header) => header.id === field)
      .map((header) => header["sortType"]);
    if (sortType.length !== 1) {
      throw Error(`can't find sortType for field ${field}`);
    }

    const reverse = this.makeReverse(type);

    const comparators = {
      string: (a, b) =>
        reverse *
        a[field].localeCompare(b[field], ["ru", "en"], { caseFirst: "upper" }),
      number: (a, b) => reverse * (a[field] - b[field]),
    };
    const result = comparators[sortType];
    if (result === undefined) {
      throw Error(`unsuported sortType ${sortType}`);
    }
    return result;
  }

  getSubElements() {
    const result = {};
    const elements = this.element.querySelectorAll("[data-element]");

    for (const subElement of elements) {
      const name = subElement.dataset.element;
      result[name] = subElement;
    }

    return result;
  }

  makeReverse(param) {
    switch (param) {
      case "asc":
        return 1;
      case "desc":
        return -1;
      default:
        throw new Error(`parametr ${param} not allowed`);
    }
  }

  sortTable(sortConfig) {
    const { id, order } = sortConfig;
    const { header } = this.subElements;
    header.innerHTML = this.headerBody;
    let sortedHeaderElement;
    for (const item of header.children) {
      if (item.dataset.id === id) {
        sortedHeaderElement = item;
        break;
      }
    }
    if (!sortedHeaderElement) {
      return;
    }
    this.addSortToHeaderElement(sortedHeaderElement, order);
    this.sort(id, order);
  }

  addSortToHeaderElement(item, order) {
    item.dataset.order = order;
    const div = document.createElement("div");
    div.innerHTML = `
      <span data-element="arrow" class="sortable-table__sort-arrow">
        <span class="sort-arrow"></span>
      </span>
    `;
    item.append(div.firstElementChild);
  }

  render() {
    const div = document.createElement("div");
    div.innerHTML = this.tempalte;
    this.element = div.firstElementChild;
    this.subElements = this.getSubElements();
    this.updateBody(this.data);
    this.sortTable(this.currentSortConfig);
    this.addListeners();
  }

  addListeners() {
    this.subElements.header.addEventListener("pointerdown", (event) =>
      this.sortTableHandler(event)
    );
  }

  sortTableHandler(event) {
    const headerElement = event.target.closest("div");
    if (!headerElement) return;
    if (headerElement.dataset.sortable !== "true") return;
    const clickedId = headerElement.dataset.id;
    const { ...sortConfig } = this.currentSortConfig;
    if (clickedId === sortConfig.id) {
      sortConfig.order = this.getNextOrder(sortConfig.order);
    } else {
      sortConfig.id = clickedId;
      sortConfig.order = this.defaultOrder;
    }
    this.sortTable(sortConfig);
    this.currentSortConfig = sortConfig;
  }

  getNextOrder(currentOrder){
      return currentOrder === "asc" ? "desc" : "asc";
  }

  remove() {
    if (this.element) {
      this.element.remove();
    }
  }

  destroy() {
    this.remove();
    this.element = null;
    this.subElements = {};
  }
}
