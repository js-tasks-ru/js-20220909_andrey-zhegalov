export default class SortableTable {
  constructor(headerConfig = [], data = []) {
    this.headerConfig = headerConfig;
    this.data = data;

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

  updateBody(data){
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

  makeRowBody(rowData){
    return this.headerConfig
      .map(({id}) => {
        return `
          <div class="sortable-table__cell">${rowData[id]}</div>
          `;
      })
      .join("");

  }

  get headerBody() {
    const result = this.headerConfig
      .map(({ id, title, sortable, sortType }) => {
        return `<div class="sortable-table__cell" data-id="${id}" data-sortable="${sortable}">
                      <span>${title}</span>
                    </div>`;
      })
      .join("");
    return result;
  }

  sort(field, type) {
    const copy= [...this.data];
    const comparator = this.getComparator(field, type);
    const sortedData = copy.sort(comparator);
    this.updateBody(sortedData);
  }

  getComparator(field, type){
    const sortType = this.headerConfig
      .filter((header) => header.id === field)
      .map((header) => header["sortType"]);
    if(sortType.length !== 1){
      throw Error(`can't find sortType for field ${field}`);
    }
    const reverse = this.makeReverse(type);
    const comparators = {
      string: (a, b) =>
        reverse *
        a[field].localeCompare(b[field], ["ru", "en"], { caseFirst: "upper" }),
      number: (a, b) => reverse * (a[field] - b[field]),
    };
    const result =  comparators[sortType];
    if(result === undefined){
      throw Error(`unsuported sortType ${sortType}`);
    }
    return result;
  }
  
  getSubElements() {
    const elements = this.element.querySelectorAll("[data-element]");
    return Array.from(elements).reduce((buffer, element) => {
      const name = element.dataset.element;
      buffer[name] = element;
      return buffer;
    }, {});

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

  render() {
    const div = document.createElement("div");
    div.innerHTML = this.tempalte;
    this.element = div.firstElementChild;
    this.subElements = this.getSubElements();
    this.updateBody(this.data);
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

