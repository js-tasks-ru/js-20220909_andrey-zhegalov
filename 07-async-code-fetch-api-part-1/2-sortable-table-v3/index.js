import fetchJson from './utils/fetch-json.js';

const BACKEND_URL = 'https://course-js.javascript.ru';

export default class SortableTable {
  defaultOrder = "desc";

  constructor(headersConfig,
    {
      url,
      isSortLocally = false,
      data = [],
      sorted = {}
    } = {}) {
    this.url = url;
    this.data = data;
    this.headersConfig = headersConfig;
    this.currentSortConfig = sorted;
    this.isSortLocally = isSortLocally;
    this.abortController = new AbortController();
    this.render();
  }

  async sort() {
    const {id, order} = this.currentSortConfig;
    this.updateHeader(id, order);
    if (this.isSortLocally) {
      this.sortOnClient(id, order);
    } else {
      await this.sortOnServer(id, order);
    }
  }

  sortOnClient(id, order) {
    const copy = [...this.data];
    const comparator = this.getComparator(id, order);
    const sortedData = copy.sort(comparator);
    this.updateBody(sortedData);
  }

  async sortOnServer(id, order) {
    const offset = 0;
    const pageSize = 30;
    const result = await fetchJson(` ${BACKEND_URL}/${this.url}?_embed=subcategory.category&_sort=${id}&_order=${order}&_start=${offset}&_end=${offset + pageSize} `);
    this.updateBody(result);
  }

  get template() {
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
    this.subElements.body.innerHTML = data
      .map((rowData) => {
        return `
                <a class="sortable-table__row">
                  ${this.makeRowBody(rowData)}
                </a>
          `;
      })
      .join("");
  }

  makeRowBody(rowData) {
    return this.headersConfig
      .map(({template, id}) => {
        return template
          ? template(rowData[id])
          : `<div class="sortable-table__cell">${rowData[id]}</div>`;
      })
      .join("");
  }

  get headerBody() {
    return this.headersConfig
      .map(({id, title, sortable}) => {
        return `<div class="sortable-table__cell" data-id="${id}" data-sortable="${sortable}">
                      <span>${title}</span>
                    </div>`;
      })
      .join("");
  }

  getComparator(field, type) {
    const sortType = this.headersConfig
      .filter(header => header.id === field)
      .map(header => header["sortType"]);
    if (sortType.length !== 1) {
      throw Error(`can't find sortType for field ${field}`);
    }
    const reverse = this.makeReverse(type);
    const comparators = {
      string: (a, b) => reverse * a[field].localeCompare(b[field], ["ru", "en"], {caseFirst: "upper"}),
      number: (a, b) => reverse * (a[field] - b[field]),
    };
    const result = comparators[sortType];
    if (result === undefined) {
      throw Error(`unsupported sortType ${sortType}`);
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

  getNextOrder(currentOrder) {
    return currentOrder === "asc" ? "desc" : "asc";
  }

  updateHeader(id, order) {
    const {header} = this.subElements;
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
  }

  addSortToHeaderElement(headerColumnElement, order) {
    const arrow = headerColumnElement.querySelector('.sortable-table__sort-arrow');
    if (!arrow) {
      headerColumnElement.append(this.subElements.arrow);
    }
    headerColumnElement.dataset.order = order;
  }

  async render() {
    const div = document.createElement("div");
    div.innerHTML = this.template;
    this.element = div.firstElementChild;
    this.subElements = this.getSubElements();
    this.addEventListeners();
    await this.sort();
  }

  addEventListeners() {
    this.subElements.header.addEventListener("pointerdown", this.onSortClick);
  }

  onSortClick = event => {
    this.onSortClickHandler(event);
  };

  onSortClickHandler(event) {
    const headerElement = event.target.closest('[data-sortable="true"]');
    if (!headerElement) {
      return;
    }
    const clickedId = headerElement.dataset.id;
    const {...sortConfig} = this.currentSortConfig;
    if (clickedId === sortConfig.id) {
      sortConfig.order = this.getNextOrder(sortConfig.order);
    } else {
      sortConfig.id = clickedId;
      sortConfig.order = this.defaultOrder;
    }
    this.currentSortConfig = sortConfig;
    this.sort();
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
    this.abortController.abort();
  }

  getSubElements() {
    const result = {};
    const elements = this.element.querySelectorAll("[data-element]");

    for (const subElement of elements) {
      const name = subElement.dataset.element;
      result[name] = subElement;
    }
    result['arrow'] = this.makeArrowElement();
    return result;
  }

  makeArrowElement() {
    const div = document.createElement("div");
    div.innerHTML = `
      <span data-element="arrow" class="sortable-table__sort-arrow">
        <span class="sort-arrow"></span>
      </span>
    `;
    return div.firstElementChild;
  }

}
