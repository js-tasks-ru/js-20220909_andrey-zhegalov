import fetchJson from './utils/fetch-json.js';

const IMGUR_CLIENT_ID = '28aaa2e823b03b1';
const IMGUR_URL = 'https://api.imgur.com';
const BACKEND_URL = 'https://course-js.javascript.ru';

export default class ProductForm {
  abortController = new AbortController();
  API_PATH = '/api/rest';

  defaultProductData = {
    title: '',
    description: '',
    quantity: 1,
    subcategory: '',
    status: 2,
    price: 0,
    discount: 0,
  };
  currentProductData = {};

  formValueConverter = {
    status: value => parseFloat(value),
    quantity: value => parseFloat(value),
    price: value => parseFloat(value),
    discount: value => parseFloat(value),
  };

  constructor(productId) {
    this.productId = productId;
  }

  async render() {
    const divElement = document.createElement('div');
    divElement.innerHTML = this.getTemplate();
    this.element = divElement.firstElementChild;

    this.subElements = this.getSubElements();

    const [categoriesData, productData] = await Promise.all([
      this.getCategoriesData(),
      this.getProductData()
    ]);
    this.fillCategoriesElement(categoriesData);
    this.fillProductDataElement(productData);
    this.currentProductData = productData;

    this.addEventListeners();
    return this.element;
  }

  addEventListeners() {
    this.element.querySelector('#save').addEventListener(
      'pointerdown',
      this.save,
      this.abortController.signal
    );

    this.element.querySelector('#fileInput').addEventListener(
      'change',
      this.onNewImageFile,
      this.abortController.signal
    );

    this.element.querySelector('#uploadImage').addEventListener(
      'pointerdown',
      () => {
        const fileInput = this.element.querySelector('#fileInput');
        fileInput.focus();
        fileInput.click();
      },
      this.abortController.signal
    );

  }

  onNewImageFile = () => {
    this.onNewImageFileHandler();
  };

  async onNewImageFileHandler() {
    const input = this.element.querySelector('#fileInput');
    const [file] = input.files;
    const link = await this.uploadImage(file);
    const name = file.name;

    const imageElement = this.makeImageListItemElement({'url': link, 'source': name});
    const {imageListContainer} = this.subElements;
    imageListContainer.firstElementChild.append(imageElement);
  }

  fillCategoriesElement(categories) {
    const categoriesSelect = this.element.querySelector("#subcategory");
    if (!categoriesSelect) {
      return;
    }
    this.makeCategoriesData(categories).forEach(option => categoriesSelect.append(option));
  }

  async getCategoriesData() {
    return fetchJson(`${BACKEND_URL}${this.API_PATH}/categories?_sort=weight&_refs=subcategory`,
      {
        signal: this.abortController.signal
      }
    );
  }

  fillProductDataElement(productData) {
    this.fillProduct(productData);
    this.fillImage(productData.images);
  }

  async getProductData() {
    if (!this.productId) {
      return this.defaultProductData;
    }
    const url = new URL(`${this.API_PATH}/products`, `${BACKEND_URL}`);
    url.searchParams.set('id', this.productId);
    const fetchResult = await fetchJson(url,
      {
        signal: this.abortController.signal
      }
    );
    if (fetchResult.length !== 1) {
      throw new Error(`Product data for ${this.productId} is not correctly`);
    }
    return fetchResult[0];
  }

  fillProduct(productData) {
    if (!productData) {
      return;
    }
    const {productForm} = this.subElements;
    Object.keys(this.defaultProductData).forEach(key => {
      productForm.querySelector(`#${key}`).value = productData[key];
    });
  }

  fillImage(imagesData) {
    if (!imagesData) {
      return;
    }
    const {imageListContainer} = this.subElements;
    const ul = document.createElement('ul');
    ul.classList.add('sortable-list');
    imagesData.map(this.makeImageListItemElement).forEach(item => ul.append(item));
    imageListContainer.append(ul);
  }


  makeCategoriesData(categoriesData) {
    const names = [];
    for (const category of categoriesData) {
      for (const child of category.subcategories) {
        const text = `${category.title} > ${child.title}`;
        const value = child.id;
        names.push(new Option(text, value));
      }
    }
    return names;
  }

  save = async (event) => {
    await this.onSaveEventHandler();
  };

  loadImage = () => {
    this.onLoadImageHandler();
  };

  onLoadImageHandler() {
    const input = this.element.querySelector('#fileInput');
    const [file] = input.files;

    console.error(file);
  }

  async onSaveEventHandler() {
    const updateBody = this.makeBody();
    if (this.productId) {
      updateBody['id'] = this.productId;
    }

    const response = await fetchJson(`${BACKEND_URL}${this.API_PATH}/products`,
      {
        method: `${(this.productId) ? 'PATCH' : 'PUT'}`,
        headers: {
          'Content-Type': 'application/json;charset=utf-8'
        },
        body: JSON.stringify(updateBody),
        signal: this.abortController.signal
      }
    );

    if (response.status === 'ok') {
      const event = (this.productId) ? new Event("product-updated") : new Event("product-saved");
      this.element.dispatchEvent(event);
    }
  }

  makeBody() {
    const {productForm} = this.subElements;
    const body = {};
    Object.keys(this.defaultProductData).forEach(key => {
      const formDataElement = productForm.querySelector(`#${key}`);
      if (!formDataElement) {
        return;
      }

      let converter = this.formValueConverter[key];
      if (!converter) {
        converter = value => value;
      }

      const formValue = converter(formDataElement.value);

      if (this.productId) {
        if (formValue !== this.currentProductData[key]) {
          body[key] = formValue;
        }
      } else {
        body[key] = formValue;
      }
    });

    const {imageListContainer} = this.subElements;
    const images = [];
    for (const element of imageListContainer.querySelectorAll('li')) {
      const imageData = this.getImageData(element);
      images.push(imageData);
    }
    body.images = images;
    return body;
  }

  getImageData(element) {
    const res = {};
    for (const input of [...element.querySelectorAll('input')]) {
      res[input.name] = input.value;
    }
    return res;
  }

  remove() {
    if (this.element) {
      this.element.remove();
    }
  }

  destroy() {
    this.abortController.abort();
    this.remove();
    this.element = null;
    this.subElements = null;
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

  async uploadImage(file) {
    const formData = new FormData();
    formData.append('image', file);
    try {
      const response = await fetch(`${IMGUR_URL}/3/image`, {
        method: 'POST',
        headers: {
          Authorization: `Client-ID ${IMGUR_CLIENT_ID}`
        },
        body: formData,
        referrer: ''
      });
      const body = await response.json();
      return body.data.link;
    } catch (error) {
      return Promise.reject(error);
    }
  }

  getTemplate() {
    return `
      <div class="product-form">
        <form data-element="productForm" class="form-grid">
          <div class="form-group form-group__half_left">
            <fieldset>
              <label class="form-label">Название товара</label>
              <input id="title" required="" type="text" name="title" class="form-control" placeholder="Название товара">
            </fieldset>
          </div>
          <div class="form-group form-group__wide">
            <label class="form-label">Описание</label>
            <textarea id="description" required="" class="form-control" name="description" data-element="productDescription"
                      placeholder="Описание товара"></textarea>
          </div>
          <div class="form-group form-group__wide" data-element="sortable-list-container">
            <label class="form-label">Фото</label>
            <div data-element="imageListContainer">
            </div>
            <button id="uploadImage" name="uploadImage" class="button-primary-outline"><span>Загрузить</span></button>
          </div>
          <div class="form-group form-group__half_left" id="formCategories">
            <label class="form-label">Категория</label>
            <select id="subcategory" class="form-control"  name="subcategory" data-element="categories" > </select>
          </div>
          <div class="form-group form-group__half_left form-group__two-col">
            <fieldset>
              <label class="form-label">Цена ($)</label>
              <input id="price" required="" type="number" name="price" class="form-control" placeholder="100">
            </fieldset>
            <fieldset>
              <label class="form-label">Скидка ($)</label>
              <input id="discount" required="" type="number" name="discount" class="form-control" placeholder="0">
            </fieldset>
          </div>
          <div class="form-group form-group__part-half">
            <label class="form-label">Количество</label>
            <input id="quantity" required="" type="number" class="form-control" name="quantity" placeholder="1">
          </div>
          <div class="form-group form-group__part-half">
            <label class="form-label">Статус</label>
            <select id="status" class="form-control" name="status" >
              <option value="1">Активен</option>
              <option value="0">Неактивен</option>
            </select>
          </div>
          <div class="form-buttons">
            <button id="save" type="submit" name="save" class="button-primary-outline">
              Сохранить товар
            </button>
          </div>
        </form>
        <input id="fileInput" type="file" accept="image/*"  >
      </div>
    `;
  }

  makeImageListItemElement({url, source}) {
    const div = document.createElement('div');
    div.innerHTML = `
          <li class="products-edit__imagelist-item sortable-list__item" style="">
            <input type="hidden" name="url" value=${url}>
            <input type="hidden" name="source" value=${source}>
            <span>
              <img src="icon-grab.svg" data-grab-handle="" alt="grab">
              <img class="sortable-table__cell-img" alt="Image" src=${url}>
              <span>${source}</span>
            </span>
            <button type="button">
              <img src="icon-trash.svg" data-delete-handle="" alt="delete">
            </button>
          </li>
    `;
    return div.firstElementChild;
  }
}
