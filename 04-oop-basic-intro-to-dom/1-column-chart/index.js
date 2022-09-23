export default class ColumnChart {
  constructor(args) {
    this.noAnyData = args === undefined;
    if (!this.noAnyData) {
      const { data, label, link, value, formatHeading, chartHeight } = args;
      Object.assign(this, args);
    }
    this.chartHeight =  this.chartHeight ?? 50;
    this.render();
  }

  getTemplate() {
    return `
            <div class="${this.getTemplateClass()}" style="--chart-height: ${this.chartHeight}">
              <div class="column-chart__title">
                ${this.makeLabel()}
                ${this.makeLinkElement()}
              </div>
              <div class="column-chart__container">
                <div data-element="header" class="column-chart__header">${this.makeValue()}</div>
                <div data-element="body" class="column-chart__chart"/>
            </div>
        `;
  }

  getTemplateClass(){
      return this.noAnyData
        ? 'column-chart column-chart_loading'
        : 'column-chart';
  }

  makeLabel() {
    return 'Total ' + this.label;
  }

  makeLinkElement() {
    if (this.link !== undefined) {
      return `<a href="${this.link}" class="column-chart__link">View all</a>`;
    }
    return '';
  }

  makeValue() {
    const value = Number(this.value).toLocaleString();
    if (this.formatHeading !== undefined) {
      return this.formatHeading(value);
    }
    return value;
  }

  findChart(element) {
    return element.querySelector('.column-chart__chart');
  }

  renderChart(chartElement) {
    if (this.data === undefined) {
      return;
    }
    this.data.forEach((value) => {
      const div = document.createElement('div');
      const barData = this.makeBarData(value);
      div.innerHTML = `
        <div style="--value: ${barData.value}" data-tooltip="${barData.dataTooltip}%"></div>
      `;
      chartElement.append(div.firstElementChild);
    }
    )
  }

  update(data){
    this.data = data;
    this.fillChart(this.element);
  }

  makeBarData(value){
    const max = Math.max(...this.data);
    const scale = this.chartHeight / max;
    return {
      value: String(Math.floor(scale * value, 0)),
      dataTooltip: (value / max * 100).toFixed(0),
    };
  }

  fillChart(root) {
    const chart = this.findChart(root);
    if (chart === undefined) return;
    this.renderChart(chart);
  }

  destroy() {
    this.remove();
  }

  remove(){
    this.element = null;
  }

  render() {
    const wrapper = document.createElement('div');
    wrapper.innerHTML = this.getTemplate();
    this.element = wrapper.firstElementChild;
    this.fillChart(this.element);
  }

}
