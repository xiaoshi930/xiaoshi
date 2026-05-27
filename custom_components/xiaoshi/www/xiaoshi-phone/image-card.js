import { LitElement, html, css } from "https://unpkg.com/lit-element@2.4.0/lit-element.js?module";

window.customCards = window.customCards || [];
window.customCards.push({
    type: 'xiaoshi-phone-image-card',
    name: '消逝卡(移动端)-图片卡',
    description: '移动端图片背景'
});

class XiaoshiPhoneImageCardEditor extends LitElement {
  static get properties() {
    return {
      hass: { type: Object },
      config: { type: Object }
    };
  }

  setConfig(config) {
    this.config = config || {};
  }

  _urlChanged(e, index) {
    if (!this.config) return;
    const urls = [...(this.config.url || [])];
    urls[index] = e.target.value;

    this.config = {
      ...this.config,
      url: urls.length > 0 ? urls : undefined
    };
    this._fireEvent();
  }

  _addUrl() {
    const urls = [...(this.config.url || [])];
    urls.push('');
    this.config = {
      ...this.config,
      url: urls
    };
    this._fireEvent();
  }

  _removeUrl(index) {
    const urls = [...(this.config.url || [])];
    urls.splice(index, 1);
    this.config = {
      ...this.config,
      url: urls.length > 0 ? urls : undefined
    };
    this._fireEvent();
    this.requestUpdate();
  }

  _topChanged(e) {
    if (!this.config) return;
    this.config = {
      ...this.config,
      top: e.target.value
    };
    this._fireEvent();
  }

  _fireEvent() {
    this.dispatchEvent(new CustomEvent('config-changed', {
      detail: { config: this.config }
    }));
  }

  static get styles() {
    return css`
      .form {
        display: flex;
        flex-direction: column;
        gap: 10px;
        min-height: 200px;
      }
      .form-group {
        display: flex;
        flex-direction: column;
        gap: 5px;
      }
      label {
        font-weight: bold;
      }
      select, input, textarea {
        padding: 8px;
        border: 1px solid #ddd;
        border-radius: 4px;
      }
      .help-text {
        font-size: 0.85em;
        color: #666;
        margin-top: 4px;
      }
      .url-row {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-bottom: 5px;
      }
      .url-row input {
        flex: 1;
      }
      .remove-button {
        background: #f44336;
        color: white;
        border: none;
        border-radius: 4px;
        width: 30px;
        height: 30px;
        min-width: 30px;
        padding: 0;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        flex-shrink: 0;
      }
      .remove-button:hover {
        background: #d32f2f;
      }
      .add-button {
        border: 1px solid red;
        border-radius: 4px;
        padding: 8px;
        transition: all 0.2s ease;
      }
      .add-button:hover {
        background-color: rgba(255, 0, 0, 0.1);
        transform: translateY(-1px);
        box-shadow: 0 2px 4px rgba(255, 0, 0, 0.2);
      }
    `;
  }

  render() {
    return html`
      <div class="form">
        <div class="form-group">
          <label>图片URL列表</label>
          ${(this.config.url || []).map((url, index) => html`
            <div class="url-row">
              <input
                type="text"
                @change=${(e) => this._urlChanged(e, index)}
                .value=${url}
                placeholder="请输入图片URL地址"
              />
              <button class="remove-button" @click=${() => this._removeUrl(index)} title="移除此URL">
                <ha-icon icon="mdi:close"></ha-icon>
              </button>
            </div>
          `)}
          <div style="display: flex; align-items: center; margin-top: 8px;">
            <mwc-button
              class="add-button"
              @click=${this._addUrl}
              outlined
            >
              添加URL
            </mwc-button>
          </div>
          <div class="help-text">
            添加一张或多张图片地址，将随机显示其中一张
          </div>
        </div>

        <div class="form-group">
          <label>顶部偏移</label>
          <input
            type="text"
            @change=${this._topChanged}
            .value=${this.config.top !== undefined ? this.config.top : '0'}
            placeholder="默认 0"
          />
          <div class="help-text">
            设置图片的顶部偏移量，例如：0、20px
          </div>
        </div>
      </div>
    `;
  }
}
customElements.define('xiaoshi-phone-image-card-editor', XiaoshiPhoneImageCardEditor);

class XiaoshiPhoneImageCard extends HTMLElement {
  setConfig(config) {
    this.config = config;
  }

  static getConfigElement() {
    return document.createElement("xiaoshi-phone-image-card-editor");
  }

  static getStubConfig() {
    return {
      url: [],
      top: "0"
    };
  }

  connectedCallback() {
    this.attachShadow({ mode: 'open' });
    this.render();
  }
 
  render() {
    const top = this.config.top || '0';  ;
    const url_sum = this.config.url;
    var url = url_sum[Math.floor(Math.random() * url_sum.length)] ;
    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
          position: relative;
          width: 100vw;
          height: 100vh;
          top: ${top};
          --control-size: 44px;
          --icon-size: 24px;
          --button-spacing: 12px;
          --bg-color: rgba(0, 0, 0, 0);
          --hover-bg: rgba(0, 0, 0, 0);
        }
        .image-container {
          position: relative;
          width: 100vw;
          height: 100vh;
          overflow: hidden;
          display: flex;
          justify-content: center;
          align-items: center;
        }
        #Imgid {
          object-fit: cover;
          object-position: center;
          min-width: 100%;
          min-height: 100%;
          position: relative;
        }
        .controls-container {
          position: absolute;
          bottom: 16px;
          right: 16px;
          display: flex;
          gap: var(--button-spacing);
          z-index: 10;
        }
        .control-btn {
          width: 15px;
          height: 15px;
          background: rgb(0,0,0,0);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: none;
          transition: all 0.2s ease;
          box-shadow: 0 4px 8px rgba(0, 0, 0, 0);
          border: 1px solid rgba(0, 0, 0, 0);
        }
        .control-btn:hover {
          background: var(--hover-bg);
          transform: scale(1.05);
        }
        .control-btn:active {
          transform: scale(0.95);
        }
        ha-icon {
          width: var(--icon-size);
          height: var(--icon-size);
          color: white;
        }
      </style>
      <div class="image-container">
        <img id="Imgid" src="${url}" alt="content">
      </div>
      <div class="controls-container">
        <div class="control-btn" id="refreshBtn" aria-label="Refresh video">
          <ha-icon icon="mdi:refresh"></ha-icon>
        </div>
      </div>
    `;
    const refreshBtn = this.shadowRoot.getElementById('refreshBtn');
    refreshBtn.addEventListener('click', () => {
      const imgElement = this.shadowRoot.getElementById('Imgid');
      refreshBtn.animate([
        { transform: 'rotate(0deg)' },
        { transform: 'rotate(360deg)' }
      ], {
        duration: 1000,
        iterations: 1
      });
      const newSrc = `${url}?t=${Date.now()}`;
      const tempImg = new Image();
      tempImg.onload = () => {
        imgElement.src = newSrc;
      };
      tempImg.src = newSrc;
    });
  }
}
customElements.define('xiaoshi-phone-image-card', XiaoshiPhoneImageCard);

