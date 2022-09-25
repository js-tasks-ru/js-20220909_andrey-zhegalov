export default class NotificationMessage {
  static types = {
    error: "error",
    success: "success",
  };
  static elementOnPage;

  constructor(message = "", { duration = 1000, type = "" } = {}) {
    this.message = message;
    this.duration = duration;
    this.type = NotificationMessage.types[type];
    this.render();
  }

  get template() {
    const durationInSec = (this.duration / 1000).toFixed(0);
    return `
        <div class="notification ${
          this.type
        }" style="--value:${durationInSec}s">
            <div class="timer"></div>
            <div class="inner-wrapper">
            <div class="notification-header">${this.type}</div>
            <div class="notification-body">
                ${this.message.trim()}
            </div>
            </div>
        </div>
    `;
  }

  show(target) {
    if(NotificationMessage.elementOnPage){
      NotificationMessage.elementOnPage.remove();
    }
    NotificationMessage.elementOnPage = this.element;
    target !== undefined
      ? (target.innerHTML = this.element.outerHTML)
      : document.body.append(this.element);
    
    setTimeout(() => {
      if( NotificationMessage.elementOnPage === this.element){
        NotificationMessage.elementOnPage = null;
      }
      this.remove();
    }, this.duration);
  }

  render() {
    const wrapper = document.createElement("div");
    wrapper.innerHTML = this.template;
    this.element = wrapper.firstElementChild;
  }

  remove() {
    if (this.element) {
      this.element.remove();
    }
  }

  destroy() {
    this.remove();
    this.element = null;
  }
}
