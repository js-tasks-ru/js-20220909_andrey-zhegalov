class Tooltip {
  static instance;

  constructor() {
    if (Tooltip.instance) {
      return Tooltip.instance;
    }

    Tooltip.instance = this;
  }

  initialize() {
    const result = {};
    const dataElements = document.querySelectorAll("[data-tooltip]");
    for (const element of dataElements) {
      result[element] = element.dataset.tooltip;
    }
    this.tooltips = result;
    this.addEventListeners();
  }

  render(message) {
    const div = document.createElement("div");
    div.innerHTML = this.getTooltipHtml(message);
    this.element = div.firstElementChild;
    document.body.append(this.element);
  }

  onPointerMove = (event) => {
    // TODO move tooltip near mouse here
  }

  addEventListeners() {
    document.body.addEventListener("pointerover", (event) => {
      const div = event.target.closest("div");
      if (!div) return;
      const message = div.dataset.tooltip;
      if (!message) return;

      this.render(message);

      div.addEventListener("pointermove", this.onPointerMove);
    });

    document.body.addEventListener("pointerout", (event) => {
      const div = event.target.closest("div");
      if (!div) return;
      const message = div.dataset.tooltip;
      if (!message) return;
      this.remove();
      div.removeEventListener("pointermove", this.onPointerMove);
    });

  }

  getTooltipHtml(message) {
    return `
      <div class="tooltip">${message}</div>
    `;
  }

  remove() {
    if (this.element) {
      this.element.remove();
    }
    document.body.removeEventListener("pointerover", this.onPointerOut);
    document.body.removeEventListener("pointerout", this.onPointerOut);
  }

  destroy() {
    this.remove();
    this.element = null;
    this.subElements = {};
  }
}

export default Tooltip;
