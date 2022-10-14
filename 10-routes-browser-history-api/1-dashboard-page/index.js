import RangePicker from './components/range-picker/src/index.js';
import SortableTable from './components/sortable-table/src/index.js';
import ColumnChart from './components/column-chart/src/index.js';
import header from './bestsellers-header.js';

const BACKEND_URL = 'https://course-js.javascript.ru';

export default class Page {
  abortController = new AbortController();

  render() {
    const div = document.createElement('div');
    div.innerHTML = this.getTemplate();
    this.element = div.firstElementChild;
    this.subElements = this.getSubElements();

    this.renderRangePicker();
    this.renderColumnCharts();
    this.renderSortableTable();

    this.addEventListeners();

    return this.element;
  }

  addEventListeners() {
    const {rangePicker} = this.subElements;

    rangePicker.addEventListener(
      'date-select',
      this.onDateSelect,
      this.abortController.signal
    );
  }

  onDateSelect = event => {
    this.onDateSelectHandler(event);
  };

  onDateSelectHandler(event) {
    const {from, to} = event.detail;
    this.columnChartComponents.forEach(chart => chart.update(from, to));
  }

  renderRangePicker() {
    const {rangePicker} = this.subElements;

    const rangePickerElement = new RangePicker(this.getRange());
    rangePicker.append(rangePickerElement.element);
  }

  renderColumnCharts() {
    const {ordersChart, salesChart, customersChart} = this.subElements;

    const ordersChartComponent = new ColumnChart({
      url: 'api/dashboard/orders',
      label: 'orders',
      range: this.getRange(),
      link: '#'
    });
    ordersChart.append(ordersChartComponent.element);

    const customersChartElement = new ColumnChart({
      url: 'api/dashboard/customers',
      range: this.getRange(),
      label: 'customers',
    });
    customersChart.append(customersChartElement.element);

    const salesChartComponent = new ColumnChart({
      url: 'api/dashboard/sales',
      range: this.getRange(),
      label: 'sales',
      formatHeading: data => `$${data}`
    });
    salesChart.append(salesChartComponent.element);
    this.columnChartComponents = [ordersChartComponent, customersChartElement, salesChartComponent];
  }

  renderSortableTable() {
    const {sortableTable} = this.subElements;
    const url = new URL('/api/dashboard/bestsellers', BACKEND_URL);
    const sortableTableComponent = new SortableTable(header, {url});
    sortableTable.append(sortableTableComponent.element);
  }

  getRange = () => {
    const now = new Date(2022, 9, 1);
    const to = new Date(2022, 9, 1);
    const from = new Date(now.setMonth(now.getMonth() - 1));

    return {from, to};
  };

  getTemplate() {
    return `
      <section class="content" id="content">
        <div class="dashboard">
          <div class="content__top-panel">
            <h2 class="page-title">Dashboard</h2>
            <!-- RangePicker component -->
            <div data-element="rangePicker"></div>
          </div>
          <div data-element="chartsRoot" class="dashboard__charts">
            <!-- column-chart components -->
            <div data-element="ordersChart" class="dashboard__chart_orders"></div>
            <div data-element="salesChart" class="dashboard__chart_sales"></div>
            <div data-element="customersChart" class="dashboard__chart_customers"></div>
          </div>

          <h3 class="block-title">Best sellers</h3>

          <div data-element="sortableTable">
            <!-- sortable-table component -->
          </div>
        </div>
      </section>`;
  }

  remove() {
    if (this.element) {
      this.element.remove();
    }
  }

  destroy() {
    this.remove();
    this.element = null;
    this.subElements = null;
    this.abortController.abort();
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
