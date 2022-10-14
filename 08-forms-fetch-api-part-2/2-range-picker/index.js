export default class RangePicker {
  abortController = new AbortController();

  constructor({from, to}) {
    this.from = new Date(from.getTime());
    this.to = new Date(to.getTime());
    this.selectedFrom = new Date(from.getTime());
    this.selectedTo = new Date(to.getTime());
    this.firstMonth = new Date(this.selectedFrom.getTime());
    this.monthCnt = 2;
    this.render();
  }

  render() {
    const div = document.createElement('div');
    div.innerHTML = this.getTemplate();
    this.element = div.firstElementChild;
    this.subElements = this.getSubElements();
    this.addEventListeners();
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

  addEventListeners() {
    const {input, selector} = this.subElements;

    input.addEventListener(
      'click',
      this.onRangePickerClick,
      this.abortController.signal
    );

    selector.addEventListener(
      'click',
      this.onDayClick,
      this.abortController.signal
    );

    selector.addEventListener(
      'click',
      this.onCoupleArrowClick,
      this.abortController.signal
    );
  }

  onRangePickerClick = _event => {
    this.onRangePickerClickHandler();
  };

  onDayClick = event => {
    this.onDayClickHandler(event);
  };

  onCoupleArrowClick = event => {
    this.onCoupleArrowClickHandler(event);
  };

  onRangePickerClickHandler() {
    const {selector} = this.subElements;

    if (!selector.querySelector('.rangepicker__calendar')) {
      selector.append(this.getSelectorArrow());
      selector.append(this.getSelectorControl('right'));
      selector.append(this.getSelectorControl('left'));
      this.updateCalendars();
      this.highlightDateRange(this.selectedFrom, this.selectedTo);
    }

    const rangepickerOpenClass = 'rangepicker_open';
    if (this.element.classList.contains(rangepickerOpenClass)) {
      if (this.selectedFrom && this.selectedTo) {
        this.updateFromToRange();
      }
    } else {
      this.resetSelectRange();
    }
    this.element.classList.toggle(rangepickerOpenClass);
  }

  resetSelectRange() {
    this.selectedFrom = new Date(this.from.getTime());
    this.selectedTo = new Date(this.to.getTime());
    this.highlightDateRange(this.selectedFrom, this.selectedTo);
  }

  updateFromToRange() {
    this.from = new Date(this.selectedFrom.getTime());
    this.to = new Date(this.selectedTo.getTime());
    let {from, to} = this.subElements;
    from.textContent = this.convertDateToString(this.from);
    to.textContent = this.convertDateToString(this.to);
    const event = new Event("date-select", {bubbles: true});
    this.element.dispatchEvent(event);
  }

  onCoupleArrowClickHandler(event) {
    let shift;
    if (event.target.closest('.rangepicker__selector-control-right')) {
      shift = 1;
    } else if (event.target.closest('.rangepicker__selector-control-left')) {
      shift = -1;
    } else {
      return;
    }
    this.firstMonth.setMonth(this.firstMonth.getMonth() + shift);
    this.updateCalendars();
    this.highlightDateRange(this.selectedFrom, this.selectedTo);
  }

  onDayClickHandler(event) {
    const target = event.target.closest('.rangepicker__cell');
    if (!target) {
      return;
    }

    if (this.selectedFrom && this.selectedTo) {
      this.selectedFrom = new Date(target.dataset.value);
      this.selectedTo = null;
    } else {
      this.selectedTo = new Date(target.dataset.value);
      if (this.selectedFrom.getTime() > this.selectedTo.getTime()) {
        [this.selectedFrom, this.selectedTo] = [this.selectedTo, this.selectedFrom];
      }
    }
    this.highlightDateRange(this.selectedFrom, this.selectedTo);
  }

  getSelectorArrow() {
    const div = document.createElement('div');
    div.innerHTML = `
        <div class="rangepicker__selector-arrow"></div>
      `;
    return div.firstElementChild;
  }

  getSelectorControl(side) {
    const div = document.createElement('div');
    div.innerHTML = `
        <div class="rangepicker__selector-control-${side}"></div>
      `;
    return div.firstElementChild;
  }

  getTemplate() {
    return `
      <div class="rangepicker">
        <div class="rangepicker__input" data-element="input">
          <span data-element="from">${this.convertDateToString(this.selectedFrom)}</span> -
          <span data-element="to">${this.convertDateToString(this.selectedTo)}</span>
        </div>
        <div class="rangepicker__selector" data-element="selector"></div>
      </div>
    `;
  }

  updateCalendars() {
    const localStartDate = new Date(this.firstMonth.getTime());
    const {selector} = this.subElements;
    selector.querySelectorAll('.rangepicker__calendar').forEach(
      calendar => calendar.remove()
    );
    const calendarCnt = this.monthCnt;
    for (let num = 0; num < calendarCnt; num++) {
      const calendarDate = new Date(localStartDate.setMonth(localStartDate.getMonth() + num));
      const calendarElement = this.makeCalendarElement(calendarDate.getFullYear(), calendarDate.getMonth());
      selector.append(calendarElement);
    }
  }

  highlightDateRange(from, to) {
    const {selector} = this.subElements;
    const cells = selector.querySelectorAll('.rangepicker__cell');
    for (const cell of cells) {
      cell.className = 'rangepicker__cell';
      const cellDate = new Date(cell.dataset.value);
      if (from && from.getTime() === cellDate.getTime()) {
        cell.classList.add('rangepicker__selected-from');
      }
      if (from && to
        && (cellDate.getTime() > from.getTime())
        && (cellDate.getTime() < to.getTime())
      ) {
        cell.classList.add('rangepicker__selected-between');
      }
      if (to && to.getTime() === cellDate.getTime()) {
        cell.classList.add('rangepicker__selected-to');
      }
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

  makeCalendarElement(year, month) {
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const monthObj = {};
    for (let i = 1; i <= daysInMonth; i++) {
      monthObj[i] = new Date(year, month, i).toLocaleDateString();
    }

    const dateHtml =
      Object.entries(monthObj).map(([text, value]) => `
          <button type="button" class="rangepicker__cell" data-value="${value}">${text}</button>
    `).join(" ");

    const calendarHtml = `
      <div class="rangepicker__calendar">
        <div class="rangepicker__month-indicator">
          <time datetime="November">${this.getMonthName(month)}</time>
        </div>
        <div class="rangepicker__day-of-week">
          <div>Пн</div>
          <div>Вт</div>
          <div>Ср</div>
          <div>Чт</div>
          <div>Пт</div>
          <div>Сб</div>
          <div>Вс</div>
        </div>
        <div class="rangepicker__date-grid">
          ${dateHtml}
        </div>
      </div>
    `;
    const div = document.createElement('div');
    div.innerHTML = calendarHtml;
    const calendarElement = div.firstElementChild;

    const dayOfWeek = new Date(year, month, 1).getDay();
    const firstDayElement = calendarElement.querySelector('.rangepicker__cell');
    firstDayElement.style = `--start-from: ${dayOfWeek}`;

    return calendarElement;
  }

  getMonthName(monthNumber) {
    const months = {
      0: 'январь',
      1: 'февраль',
      2: 'март',
      3: 'апрель',
      4: 'май',
      5: 'июнь',
      6: 'июль',
      7: 'август',
      8: 'сентябрь',
      9: 'октябрь',
      10: 'ноябрь',
      11: 'декабрь',
    };
    return months[monthNumber];
  }

  convertDateToString(date) {
    return ('0' + date.getDate()).slice(-2) + '.' + ('0' + (date.getMonth() + 1)).slice(-2) + '.' + date.getFullYear();
  }

}
