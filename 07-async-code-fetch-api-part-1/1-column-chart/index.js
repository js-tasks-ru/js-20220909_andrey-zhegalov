import fetchJson from './utils/fetch-json.js';

const BACKEND_URL = 'https://course-js.javascript.ru';
const BACKEND_URI = '/api/dashboard';

export default class ColumnChart {
  subElements = {};
  chartHeight = 50;

  constructor({data, label, link, value, formatHeading = d => d} = {}) {
    this.data = data;
    this.label = label;
    this.link = link;
    this.value = formatHeading(value);
    this.formatHeading = formatHeading;

    this.render();
  }

  getTemplate() {
    return `
            <div class="column-chart column-chart_loading" style="--chart-height: ${this.chartHeight}">
              <div class="column-chart__title">
                ${this.makeLabel()}
                ${this.makeLinkElement()}
              </div>
              <div class="column-chart__container">
                <div data-element="header" class="column-chart__header">${this.value}</div>
                <div data-element="body" class="column-chart__chart"/>
            </div>
        `;
  }

  makeLabel() {
    return 'Total ' + this.label;
  }

  makeLinkElement() {
    return (this.link)
      ? `<a href="${this.link}" class="column-chart__link">View all</a>`
      : '';
  }

  async update(from, to) {
    this.data = null;
    this.element.classList.add("column-chart_loading");
    this.data = await fetchJson(`${BACKEND_URL}${BACKEND_URI}/${this.label}?from=${from.toISOString()}&to=${to.toISOString()}`);
    this.renderHeader();
    this.renderChart();
    this.element.classList.toggle("column-chart_loading");
    return this.data;
  }

  makeBarData([_date, value], maxValue) {
    const scale = this.chartHeight / maxValue;
    return {
      value: String(Math.floor(scale * value, 0)),
      dataTooltip: (value / maxValue * 100).toFixed(0),
    };
  }

  render() {
    const wrapper = document.createElement('div');
    wrapper.innerHTML = this.getTemplate();
    this.element = wrapper.firstElementChild;
    this.subElements = this.getSubElements();
    this.renderChart();
  }

  renderChart() {
    if (!this.data) {
      return;
    }
    const {body} = this.subElements;
    body.innerHTML = '';
    const maxValue = Math.max(...Object.values(this.data));
    for (const dataKey of Object.entries(this.data)) {
      const div = document.createElement('div');
      const barData = this.makeBarData(dataKey, maxValue);
      div.innerHTML = `<div style="--value: ${barData.value}" data-tooltip="${barData.dataTooltip}%"></div>`;
      body.append(div.firstElementChild);
    }
  }

  renderHeader() {
    const totalValue = Object.values(this.data).reduce((a, b) => a + b, 0);
    const {header} = this.subElements;
    header.innerHTML = this.formatHeading(totalValue);
  }

  destroy() {
    this.remove();
    this.element = null;
    this.subElements = {};
  }

  remove() {
    if (this.element) {
      this.element.remove();
    }
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
}
