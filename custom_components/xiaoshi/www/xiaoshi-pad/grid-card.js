import { LitElement, html, css } from "https://unpkg.com/lit-element@2.4.0/lit-element.js?module";

window.customCards = window.customCards || [];
window.customCards.push({
    type: 'xiaoshi-pad-grid-card',
    name: '消逝卡(平板端)-分布卡',
    description: '温度分布、湿度分布'
});

class XiaoshiPadGridCardEditor extends LitElement {
  static get properties() {
    return {
      hass: Object,
      _config: Object,
    };
  }

  static get styles() {
    return css`
      .editor-container {
        padding: 16px;
        display: flex;
        flex-direction: column;
        gap: 16px;
      }
      .field {
        display: flex;
        flex-direction: column;
        gap: 4px;
      }
      .field label {
        font-size: 12px;
        color: var(--secondary-text-color);
        font-weight: 500;
      }
      .field input, .field select {
        padding: 8px;
        border: 1px solid var(--divider-color);
        border-radius: 4px;
        font-size: 14px;
        background: var(--card-background-color);
        color: var(--primary-text-color);
      }
      .entities-section {
        border: 1px solid var(--divider-color);
        border-radius: 8px;
        padding: 12px;
      }
      .entities-section h4 {
        margin: 0 0 12px 0;
        font-size: 14px;
        color: var(--primary-text-color);
      }
      .inline-fields {
        display: flex;
        gap: 12px;
      }
      .inline-fields .field {
        flex: 1;
      }
      .entity-item {
        display: flex;
        flex-direction: column;
        gap: 6px;
        padding: 8px 0;
        border-bottom: 1px solid var(--divider-color);
      }
      .entity-item:last-child {
        border-bottom: none;
      }
      .entity-row {
        display: flex;
        gap: 8px;
        align-items: center;
      }
      .entity-row input, .entity-row select {
        padding: 6px;
        border: 1px solid var(--divider-color);
        border-radius: 4px;
        font-size: 13px;
        background: var(--card-background-color);
        color: var(--primary-text-color);
        flex: 1;
        min-width: 0;
      }
      .entity-row input[type="checkbox"] {
        flex: 0;
        width: 16px;
      }
      .add-btn, .remove-btn {
        padding: 6px 12px;
        border: 1px solid var(--divider-color);
        border-radius: 4px;
        cursor: pointer;
        font-size: 13px;
        background: var(--card-background-color);
        color: var(--primary-text-color);
      }
      .add-btn:hover {
        background: var(--primary-color);
        color: white;
      }
      .remove-btn {
        color: var(--error-color);
        flex: 0;
        white-space: nowrap;
      }
    `;
  }

  setConfig(config) {
    this._config = { ...config };
  }

  _valueChanged(ev) {
    if (!this._config || !this.hass) return;
    const target = ev.target;
    const key = target.getAttribute('configKey');
    if (!key) return;
    let value = target.value;
    if (target.type === 'number') value = Number(value);
    if (target.tagName === 'HA-SWITCH' || target.type === 'checkbox') value = target.checked;
    const newConfig = { ...this._config };
    if (value === '' || value === undefined) {
      delete newConfig[key];
    } else {
      newConfig[key] = value;
    }
    this._config = newConfig;
    this.dispatchEvent(new CustomEvent('config-changed', { detail: { config: this._config } }));
  }

  _entityChanged(ev, index) {
    if (!this._config || !this.hass) return;
    const target = ev.target;
    const key = target.getAttribute('configKey');
    const entities = [...this._config.entities];
    entities[index] = { ...entities[index], [key]: target.value };
    this._config = { ...this._config, entities };
    this.dispatchEvent(new CustomEvent('config-changed', { detail: { config: this._config } }));
  }

  _entityCheckedChanged(ev, index) {
    if (!this._config || !this.hass) return;
    const target = ev.target;
    const key = target.getAttribute('configKey');
    const entities = [...this._config.entities];
    entities[index] = { ...entities[index], [key]: !target.checked };
    this._config = { ...this._config, entities };
    this.dispatchEvent(new CustomEvent('config-changed', { detail: { config: this._config } }));
  }

  _addEntity() {
    const entities = [...(this._config.entities || []), { entity: '', grid: '', state: true }];
    this._config = { ...this._config, entities };
    this.dispatchEvent(new CustomEvent('config-changed', { detail: { config: this._config } }));
  }

  _removeEntity(index) {
    const entities = this._config.entities.filter((_, i) => i !== index);
    this._config = { ...this._config, entities };
    this.dispatchEvent(new CustomEvent('config-changed', { detail: { config: this._config } }));
  }

  render() {
    if (!this._config) return html``;
    return html`
      <div class="editor-container">
        <div class="inline-fields">
          <div class="field">
            <label>宽度</label>
            <input type="text" .value=${this._config.width || ''} configKey="width" @value-changed=${this._valueChanged} @change=${this._valueChanged} placeholder="400px" />
          </div>
          <div class="field">
            <label>高度</label>
            <input type="text" .value=${this._config.height || ''} configKey="height" @value-changed=${this._valueChanged} @change=${this._valueChanged} placeholder="80px" />
          </div>
        </div>
        <div class="inline-fields">
          <div class="field">
            <label>最小值</label>
            <input type="number" .value=${this._config.min ?? ''} configKey="min" @value-changed=${this._valueChanged} @change=${this._valueChanged} placeholder="0" />
          </div>
          <div class="field">
            <label>最大值</label>
            <input type="number" .value=${this._config.max ?? ''} configKey="max" @value-changed=${this._valueChanged} @change=${this._valueChanged} placeholder="100" />
          </div>
        </div>
        <div class="field">
          <label>模式</label>
          <select .value=${this._config.mode || '温度'} configKey="mode" @change=${this._valueChanged}>
            <option value="温度" ?selected=${this._config.mode === '温度' || !this._config.mode}>温度</option>
            <option value="湿度" ?selected=${this._config.mode === '湿度'}>湿度</option>
          </select>
        </div>
        <div class="entities-section">
          <h4>实体列表</h4>
          ${(this._config.entities || []).map((entity, index) => html`
            <div class="entity-item">
              <div class="entity-row">
                <input type="text" .value=${entity.entity || ''} configKey="entity" @change=${(e) => this._entityChanged(e, index)} placeholder="实体ID (如 sensor.temperature)" />
                <input type="text" .value=${entity.grid || ''} configKey="grid" @change=${(e) => this._entityChanged(e, index)} placeholder="位置 (如 0%,0%,50%,50%)" />
                <input type="text" .value=${entity.unit || ''} configKey="unit" @change=${(e) => this._entityChanged(e, index)} placeholder="单位" style="max-width:30px" />
                <label title="隐藏数值"><input type="checkbox" ?checked=${entity.state === false} configKey="state" @change=${(e) => this._entityCheckedChanged(e, index)} />隐藏</label>
                <button class="remove-btn" @click=${() => this._removeEntity(index)}>删除</button>
              </div>
            </div>
          `)}
          <button class="add-btn" @click=${this._addEntity}>+ 添加实体</button>
        </div>
      </div>
    `;
  }
}
customElements.define('xiaoshi-pad-grid-card-editor', XiaoshiPadGridCardEditor);

class XiaoshiPadGridCard extends LitElement {
  static get properties() {
    return {
      hass: Object,
      config: Object,
    };
  }

  static get styles() {
    return css`
      .container {
        position: relative;
        display: block;
        overflow: hidden;
      }
      .grid-item {
        position: absolute;
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        box-sizing: border-box;
        border: 0;
        cursor: pointer;
      }
    `;
  }

  setConfig(config) {
    this.config = {
      width: config.width || '400px',
      height: config.height || '80px',
      min: config.min || 0,
      max: config.max || 100,
      mode: config.mode || '温度',
      display: config.display || false,
      entities: (config.entities || []).map(entity => ({
        ...entity,
        state: entity.state !== false,
      })),
    };
  }

  render() {
    if(this._display()) return;
    return html`
      <div class="container"\n
        style="width: ${this.config.width}; height: ${this.config.height};">
        ${this.config.entities.map((entityConfig) => {
          const entity = this.hass.states[entityConfig.entity];
          if (!entity) return html``;      
          const value = parseFloat(entity.state);
          const grid = entityConfig.grid ? entityConfig.grid.split(',') : ['0%', '0%', '100%', '100%'];
          const unit = entityConfig.unit || '';
          let filter;
          if (this.config.mode === '温度') {
            filter = this._calculateTemperatureFilter(value);
          } else if (this.config.mode === '湿度') {
            filter = this._calculateHumidityFilter(value);
          };
          let size = Number(grid[2].slice(0, grid[2].length-1));
          let fsize ="11px";
          if (size<25 )  fsize ="10px";
          if (size<20 )  fsize ="9px";
          if (size<15 )  fsize ="8px";
          return html`
            <div 
              class="grid-item"\n
              style="left: ${grid[0]};top: ${grid[1]};width: ${grid[2]};height: ${grid[3]};background-color: rgba(0, 200, 0, 0.8);filter: ${filter};font-size: ${fsize};">
              ${entityConfig.state !== false ? html`${entity.state}${unit}` : ''}
            </div>
          `;
        })}
      </div> 
    `;
  }

  _display() {
    try {
      if (this.config.display === undefined) return false;
      if (typeof this.config.display === 'boolean') {
        return this.config.display;
      };
      if (typeof this.config.display === 'function') {
        const result = this.config.display();
        return result === true || result === "true"; // 同时接受 true 和 "true"
      };
      if (typeof this.config.display === 'string') {
        const displayStr = this.config.display.trim();
        if (displayStr.startsWith('[[[') && displayStr.endsWith(']]]')) {
          const funcBody = displayStr.slice(3, -3).trim();
          const result = new Function('states', funcBody)(this.hass.states);
          return result === true || result === "true"; // 同时接受 true 和 "true"
        }
        if (displayStr.includes('return') || displayStr.includes('=>')) {
          const result = (new Function(`return ${displayStr}`))();
          return result === true || result === "true";
        }
        const result = (new Function(`return ${displayStr}`))();
        return result === true || result === "true";
      };
      return false;
    } catch(e) {
      console.error('显示出错:', e);
      return false;
    }
  }

  _calculateTemperatureFilter(temp) {
    temp = parseFloat(temp);
    const { min, max } = this.config;
    let deg;
    if (temp > 25) {
      deg = (25 - temp) * 120 / (max - 25);
    } else {
      deg = (25 - temp) * 100 / (25 - min);
    };
    return `hue-rotate(${deg}deg)`;
  }
   
  _calculateHumidityFilter(hum) {
    hum = parseFloat(hum);
    const { min, max } = this.config;
    let deg;
    if (hum > 50) {
      deg = (50 - hum) * 100 / (50 - max);
    } else {
      deg = (50 - hum) * 120 / (min - 50);
    };
    return `hue-rotate(${deg}deg)`;
  }

  static getConfigElement() {
    return document.createElement('xiaoshi-pad-grid-card-editor');
  }

  getCardSize() {
    return 1;
  }
}
customElements.define('xiaoshi-pad-grid-card', XiaoshiPadGridCard);

