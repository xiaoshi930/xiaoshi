import { LitElement, html, css } from "https://unpkg.com/lit-element@2.4.0/lit-element.js?module";

window.customCards = window.customCards || [];
window.customCards.push({
    type: 'xiaoshi-phone-fan-card',
    name: '消逝卡(移动端)-循环扇/风扇卡',
    description: '移动端循环扇/风扇卡',
    preview: true
});

class XiaoshiPhoneFanCardEditor extends LitElement {
  static get properties() {
    return {
      hass: { type: Object },
      config: { type: Object },
      _searchTerm: { type: String },
      _filteredEntities: { type: Array },
      _activeEntityKey: { type: String },
      _buttonSearchTerms: { type: Object },
      _filteredButtonEntities: { type: Object },
      _showButtonLists: { type: Object },
      _button2SearchTerms: { type: Object },
      _filteredButton2Entities: { type: Object },
      _showButton2Lists: { type: Object },
    };
  }

  setConfig(config) {
    this.config = config || {};
  }

  firstUpdated() {
    document.addEventListener('click', (e) => {
      if (!e.target.closest('.entity-selector')) {
        this._activeEntityKey = '';
        this.requestUpdate();
      }
    });
  }

  _onEntitySearch(e, key, filterPrefix) {
    const searchTerm = e.target.value.toLowerCase();
    this._searchTerm = searchTerm;
    this._activeEntityKey = key;

    if (!this.hass) return;

    const allEntities = Object.values(this.hass.states);
    this._filteredEntities = allEntities.filter(entity => {
      const entityId = entity.entity_id.toLowerCase();
      const friendlyName = (entity.attributes.friendly_name || '').toLowerCase();
      const matchesFilter = !filterPrefix || entityId.startsWith(filterPrefix.toLowerCase());
      const matchesSearch = entityId.includes(searchTerm) || friendlyName.includes(searchTerm);
      return matchesFilter && matchesSearch;
    }).slice(0, 50);

    this.requestUpdate();
  }

  _selectEntity(entityId, key) {
    this.config = { ...this.config, [key]: entityId };
    this._searchTerm = '';
    this._activeEntityKey = '';
    this._fireEvent();
    this.requestUpdate();
  }

  _removeEntity(key) {
    const newConfig = { ...this.config };
    delete newConfig[key];
    this.config = newConfig;
    this._fireEvent();
    this.requestUpdate();
  }

  static get styles() {
    return css`
      .form { display: flex; flex-direction: column; gap: 8px; }
      .form-group { display: flex; align-items: center; gap: 8px; }
      label { font-weight: bold; font-size: 10px; white-space: nowrap; min-width: 9em; max-width: 9em; width: 9em; }
      .help-text { font-size: 10px; color: #666; margin-top: 4px; }

      .entity-selector { position: relative; }
      .entity-search-input {
        width: 100%; padding: 8px; border: 1px solid #ddd;
        border-radius: 4px; box-sizing: border-box;font-size: 11px;
      }
      .entity-dropdown {
        position: absolute; top: 100%; left: 0; right: 0;
        height: 80px; overflow-y: auto; background: white;
        border: 1px solid #ddd; border-radius: 4px;
        box-shadow: 0 2px 8px rgba(0,0,0,0.1); z-index: 1000; margin-top: 2px;
      }
      .entity-option {
        display: flex; align-items: center; justify-content: space-between;
        padding: 8px 10px; cursor: pointer; border-bottom: 1px solid #eee;
      }
      .entity-option:hover { background: #f5f5f5; }
      .entity-info { display: flex; align-items: center; gap: 8px; flex: 1; }
      .entity-name { font-weight: 500; font-size: 14px; color: #000; }
      .entity-id { font-size: 10px; color: #666; font-family: monospace; }
      .no-results { padding: 10px; text-align: center; color: #666; font-style: italic; }

      .entity-selector-with-remove { display: flex; align-items: center; gap: 8px; flex: 1; min-width: 0; }
      .entity-selector-with-remove .entity-selector { flex: 1; min-width: 0; }
      .remove-button {
        background: #f44336; color: white; border: none; border-radius: 4px;
        width: 30px; height: 30px; min-width: 30px; padding: 0;
        display: flex; align-items: center; justify-content: center;
        cursor: pointer; flex-shrink: 0; margin-top: 0;
      }
      .remove-button:hover { background: #d32f2f; }

      .form-group select { padding: 8px; border: 1px solid #ddd; border-radius: 4px; box-sizing: border-box; flex: 1; }
      .checkbox-group { display: flex; flex-direction: column; gap: 8px; }
      .checkbox-item { display: flex; align-items: center; gap: 8px; }
    `;
  }

  render() {
    if (!this.hass) return html``;

    const entitySelectors = [
      { key: 'entity', label: '循环扇实体fan', filter: 'fan.' },
      { key: 'temperature', label: '温度传感器sensor', filter: 'sensor.' },
      { key: 'humidity', label: '湿度传感器sensor', filter: 'sensor.' },
      { key: 'oscillate_angle', label: '左右摆风角度select', filter: 'select.' },
      { key: 'vertical_angle', label: '上下摆风角度select', filter: 'select.' },
      { key: 'vertical_swing', label: '上下摆风开关switch', filter: 'switch.' },
      { key: 'cycle_swing', label: '循环摆风开关switch', filter: 'switch.' },
      { key: 'up_down_swing', label: '上下手动摇头select', filter: 'select.' },
      { key: 'left_right_swing', label: '左右手动摇头select', filter: 'select.' },
      { key: 'continuous_up', label: '开始向上转switch', filter: 'switch.' },
      { key: 'continuous_down', label: '开始向下转switch', filter: 'switch.' },
      { key: 'continuous_left', label: '开始向左转switch', filter: 'switch.' },
      { key: 'continuous_right', label: '开始向右转switch', filter: 'switch.' },
      { key: 'reset_position', label: '一键回正switch', filter: 'switch.' },
      { key: 'speed_level', label: '风速档位number', filter: 'number.' },
      { key: 'timer', label: '定时器timer', filter: 'timer.' },
    ];

    const normalFanEntitySelectors = [
      { key: 'entity', label: '风扇实体fan', filter: 'fan.' },
      { key: 'fan_mode', label: '风扇模式select', filter: 'select.' },
      { key: 'temperature', label: '温度传感器sensor', filter: 'sensor.' },
      { key: 'humidity', label: '湿度传感器sensor', filter: 'sensor.' },
      { key: 'timer', label: '定时器timer', filter: 'timer.' },
    ];

    return html`
      <div class="form">
        <div class="form-group">
          <label>主题</label>
          <select
            @change=${this._themeSelectChanged}
            .value=${this.config.theme !== undefined ? this.config.theme : 'system'}
            name="theme"
          >
            <option value="system">跟随系统</option>
            <option value="light">浅色主题（白底黑字）</option>
            <option value="dark">深色主题（黑底白字）</option>
          </select>
        </div>

        <div class="form-group">
          <label>卡片宽度</label>
          <input
            type="text"
            @change=${this._widthChanged}
            .value=${this.config.width || '100%'}
            placeholder="默认100%"
            class="entity-search-input"
          />
        </div>

        <div class="form-group">
          <label>风扇类型</label>
          <select
            @change=${this._fanTypeChanged}
            .value=${this.config.fan_type || 'circulator'}
            name="fan_type"
          >
            <option value="circulator">循环扇</option>
            <option value="normal">普通风扇</option>
          </select>
        </div>

        ${this.config.fan_type === 'normal' ? html`
        <div class="form-group">
          <label>显示摇头</label>
          <input type="checkbox" ?checked=${this.config.show_oscillate !== false} @change=${(e) => { this.config = { ...this.config, show_oscillate: e.target.checked }; this._fireEvent(); }} />
        </div>
        ` : ''}

        ${(this.config.fan_type === 'normal' ? normalFanEntitySelectors : entitySelectors).map(item => html`
          <div class="form-group">
            <label>${item.label}</label>
            <div class="entity-selector-with-remove">
              <div class="entity-selector">
                <input
                  type="text"
                  @input=${(e) => this._onEntitySearch(e, item.key, item.filter)}
                  @focus=${(e) => this._onEntitySearch(e, item.key, item.filter)}
                  .value=${this.config[item.key] || ''}
                  placeholder="搜索实体..."
                  class="entity-search-input"
                />
                ${this._activeEntityKey === item.key && this._searchTerm ? html`
                  <div class="entity-dropdown">
                    ${this._filteredEntities.map(entity => html`
                      <div class="entity-option"
                        @click=${() => this._selectEntity(entity.entity_id, item.key)}>
                        <div class="entity-info">
                          <ha-icon icon="${entity.attributes.icon || 'mdi:help-circle'}"></ha-icon>
                          <div>
                            <div class="entity-name">${entity.attributes.friendly_name || entity.entity_id}</div>
                            <div class="entity-id">${entity.entity_id}</div>
                          </div>
                        </div>
                      </div>
                    `)}
                    ${this._filteredEntities.length === 0 ? html`<div class="no-results">未找到匹配的实体</div>` : ''}
                  </div>
                ` : ''}
              </div>
              ${this.config[item.key] ? html`
                <button class="remove-button" @click=${() => this._removeEntity(item.key)} title="移除">
                  <ha-icon icon="mdi:close"></ha-icon>
                </button>
              ` : ''}
            </div>
          </div>
        `)}

        <!-- 附加按钮 (最多7个) -->
        <div style="display: flex; flex-direction: column; gap: 4px;">
          <label style="font-weight: bold; font-size: 10px;">附加按钮 (最多7个)</label>
          ${(this.config.buttons || []).map((button, index) => html`
            <div class="entity-selector-with-remove">
              <div class="entity-selector">
                <input
                  type="text"
                  @input=${(e) => this._onButtonSearch(e, index)}
                  @focus=${(e) => this._onButtonSearch(e, index)}
                  .value=${this._buttonSearchTerms?.[index] || button || ''}
                  placeholder="搜索实体..."
                  class="entity-search-input"
                />
                ${this._showButtonLists?.[index] ? html`
                  <div class="entity-dropdown">
                    ${this._filteredButtonEntities?.[index]?.map(entity => html`
                      <div class="entity-option"
                        @click=${() => this._selectButton(entity.entity_id, index)}>
                        <div class="entity-info">
                          <ha-icon icon="${entity.attributes.icon || 'mdi:help-circle'}"></ha-icon>
                          <div>
                            <div class="entity-name">${entity.attributes.friendly_name || entity.entity_id}</div>
                            <div class="entity-id">${entity.entity_id}</div>
                          </div>
                        </div>
                      </div>
                    `)}
                    ${this._filteredButtonEntities?.[index]?.length === 0 ? html`<div class="no-results">未找到匹配的实体</div>` : ''}
                  </div>
                ` : ''}
              </div>
              <button class="remove-button" @click=${() => this._removeButton(index)} title="移除此按钮">
                <ha-icon icon="mdi:close"></ha-icon>
              </button>
            </div>
          `)}
          ${(!this.config.buttons || this.config.buttons.length < 7) ? html`
            <mwc-button
              style="font-size: 10px; border: 1px solid red; border-radius: 4px; padding: 4px 8px;"
              @click=${this._addButton}
              outlined
            >
              添加按钮
            </mwc-button>
          ` : ''}
          <div class="help-text">支持 switch、light、button、sensor、select、input_button、script 类型</div>
        </div>

        <!-- 附加按钮2 (最多7个) -->
        <div style="display: flex; flex-direction: column; gap: 4px;">
          <label style="font-weight: bold; font-size: 10px;">附加按钮(第2排) (最多7个)</label>
          ${(this.config.buttons2 || []).map((button2, index2) => html`
            <div class="entity-selector-with-remove">
              <div class="entity-selector">
                <input
                  type="text"
                  @input=${(e) => this._onButton2Search(e, index2)}
                  @focus=${(e) => this._onButton2Search(e, index2)}
                  .value=${this._button2SearchTerms?.[index2] || button2 || ''}
                  placeholder="搜索实体..."
                  class="entity-search-input"
                />
                ${this._showButton2Lists?.[index2] ? html`
                  <div class="entity-dropdown">
                    ${this._filteredButton2Entities?.[index2]?.map(entity => html`
                      <div class="entity-option"
                        @click=${() => this._selectButton2(entity.entity_id, index2)}>
                        <div class="entity-info">
                          <ha-icon icon="${entity.attributes.icon || 'mdi:help-circle'}"></ha-icon>
                          <div>
                            <div class="entity-name">${entity.attributes.friendly_name || entity.entity_id}</div>
                            <div class="entity-id">${entity.entity_id}</div>
                          </div>
                        </div>
                      </div>
                    `)}
                    ${this._filteredButton2Entities?.[index2]?.length === 0 ? html`<div class="no-results">未找到匹配的实体</div>` : ''}
                  </div>
                ` : ''}
              </div>
              <button class="remove-button" @click=${() => this._removeButton2(index2)} title="移除此按钮">
                <ha-icon icon="mdi:close"></ha-icon>
              </button>
            </div>
          `)}
          ${(!this.config.buttons2 || this.config.buttons2.length < 7) ? html`
            <mwc-button
              style="font-size: 10px; border: 1px solid red; border-radius: 4px; padding: 4px 8px;"
              @click=${this._addButton2}
              outlined
            >
              添加按钮(第2排)
            </mwc-button>
          ` : ''}
          <div class="help-text">第二排按钮，最多支持7个</div>
        </div>
      </div>
    `;
  }

  _themeSelectChanged(e) {
    this.config = { ...this.config, theme: e.target.value };
    this._fireEvent();
  }

  _widthChanged(e) {
    this.config = { ...this.config, width: e.target.value };
    this._fireEvent();
  }

  _fanTypeChanged(e) {
    this.config = { ...this.config, fan_type: e.target.value };
    this._fireEvent();
  }

  _toggleShow(key, e) {
    this.config = { ...this.config, [key]: e.target.checked };
    this._fireEvent();
  }

  _fireEvent() {
    this.dispatchEvent(new CustomEvent('config-changed', {
      detail: { config: this.config }
    }));
  }

  _onButtonSearch(e, index) {
    const searchTerm = e.target.value.toLowerCase();
    if (!this._buttonSearchTerms) this._buttonSearchTerms = {};
    if (!this._filteredButtonEntities) this._filteredButtonEntities = {};
    if (!this._showButtonLists) this._showButtonLists = {};
    this._buttonSearchTerms[index] = searchTerm;
    this._showButtonLists[index] = true;
    if (!this.hass) return;
    const allEntities = Object.values(this.hass.states);
    this._filteredButtonEntities[index] = allEntities.filter(entity => {
      const entityId = entity.entity_id.toLowerCase();
      const friendlyName = (entity.attributes.friendly_name || '').toLowerCase();
      const isButtonType = entityId.startsWith('switch.') ||
                          entityId.startsWith('light.') ||
                          entityId.startsWith('button.') ||
                          entityId.startsWith('sensor.') ||
                          entityId.startsWith('select.') ||
                          entityId.startsWith('input_button.') ||
                          entityId.startsWith('script.');
      const matchesSearch = entityId.includes(searchTerm) || friendlyName.includes(searchTerm);
      return isButtonType && matchesSearch;
    }).slice(0, 50);
    this.requestUpdate();
  }

  _selectButton(entityId, index) {
    const buttons = [...(this.config.buttons || [])];
    buttons[index] = entityId;
    this.config = { ...this.config, buttons };
    if (!this._buttonSearchTerms) this._buttonSearchTerms = {};
    if (!this._showButtonLists) this._showButtonLists = {};
    this._buttonSearchTerms[index] = '';
    this._showButtonLists[index] = false;
    this._fireEvent();
    this.requestUpdate();
  }

  _onButton2Search(e, index2) {
    const searchTerm = e.target.value.toLowerCase();
    if (!this._button2SearchTerms) this._button2SearchTerms = {};
    if (!this._filteredButton2Entities) this._filteredButton2Entities = {};
    if (!this._showButton2Lists) this._showButton2Lists = {};
    this._button2SearchTerms[index2] = searchTerm;
    this._showButton2Lists[index2] = true;
    if (!this.hass) return;
    const allEntities = Object.values(this.hass.states);
    this._filteredButton2Entities[index2] = allEntities.filter(entity => {
      const entityId = entity.entity_id.toLowerCase();
      const friendlyName = (entity.attributes.friendly_name || '').toLowerCase();
      const isButtonType = entityId.startsWith('switch.') ||
                          entityId.startsWith('light.') ||
                          entityId.startsWith('button.') ||
                          entityId.startsWith('sensor.') ||
                          entityId.startsWith('select.') ||
                          entityId.startsWith('input_button.') ||
                          entityId.startsWith('script.');
      const matchesSearch = entityId.includes(searchTerm) || friendlyName.includes(searchTerm);
      return isButtonType && matchesSearch;
    }).slice(0, 50);
    this.requestUpdate();
  }

  _selectButton2(entityId, index2) {
    const buttons2 = [...(this.config.buttons2 || [])];
    buttons2[index2] = entityId;
    this.config = { ...this.config, buttons2 };
    if (!this._button2SearchTerms) this._button2SearchTerms = {};
    if (!this._showButton2Lists) this._showButton2Lists = {};
    this._button2SearchTerms[index2] = '';
    this._showButton2Lists[index2] = false;
    this._fireEvent();
    this.requestUpdate();
  }

  _addButton() {
    const buttons = [...(this.config.buttons || [])];
    if (buttons.length >= 7) return;
    buttons.push('');
    if (!this._buttonSearchTerms) this._buttonSearchTerms = {};
    if (!this._filteredButtonEntities) this._filteredButtonEntities = {};
    if (!this._showButtonLists) this._showButtonLists = {};
    const newIndex = buttons.length - 1;
    this._buttonSearchTerms[newIndex] = '';
    this._filteredButtonEntities[newIndex] = [];
    this._showButtonLists[newIndex] = false;
    this.config = { ...this.config, buttons };
    this._fireEvent();
  }

  _addButton2() {
    const buttons2 = [...(this.config.buttons2 || [])];
    if (buttons2.length >= 7) return;
    buttons2.push('');
    if (!this._button2SearchTerms) this._button2SearchTerms = {};
    if (!this._filteredButton2Entities) this._filteredButton2Entities = {};
    if (!this._showButton2Lists) this._showButton2Lists = {};
    const newIndex = buttons2.length - 1;
    this._button2SearchTerms[newIndex] = '';
    this._filteredButton2Entities[newIndex] = [];
    this._showButton2Lists[newIndex] = false;
    this.config = { ...this.config, buttons2 };
    this._fireEvent();
  }

  _removeButton(index) {
    const buttons = [...(this.config.buttons || [])];
    buttons.splice(index, 1);
    if (this._buttonSearchTerms) delete this._buttonSearchTerms[index];
    if (this._filteredButtonEntities) delete this._filteredButtonEntities[index];
    if (this._showButtonLists) delete this._showButtonLists[index];
    this.config = { ...this.config, buttons: buttons.length > 0 ? buttons : undefined };
    this._fireEvent();
    this.requestUpdate();
  }

  _removeButton2(index2) {
    const buttons2 = [...(this.config.buttons2 || [])];
    buttons2.splice(index2, 1);
    if (this._button2SearchTerms) delete this._button2SearchTerms[index2];
    if (this._filteredButton2Entities) delete this._filteredButton2Entities[index2];
    if (this._showButton2Lists) delete this._showButton2Lists[index2];
    this.config = { ...this.config, buttons2: buttons2.length > 0 ? buttons2 : undefined };
    this._fireEvent();
    this.requestUpdate();
  }

  constructor() {
    super();
    this._searchTerm = '';
    this._filteredEntities = [];
    this._activeEntityKey = '';
    this._buttonSearchTerms = {};
    this._filteredButtonEntities = {};
    this._showButtonLists = {};
    this._button2SearchTerms = {};
    this._filteredButton2Entities = {};
    this._showButton2Lists = {};
  }
}
customElements.define('xiaoshi-phone-fan-card-editor', XiaoshiPhoneFanCardEditor);

class XiaoshiPhoneFanCard extends LitElement {
  static get properties() {
    return {
      hass: { type: Object },
      config: { type: Object },
      width: { type: String },
      _tempSpeedPct: { type: Number },
      _localSliderValue: { type: Number },
      _timerInterval: { state: true },
      temperatureData: { type: Array },
      buttons: { type: Array },
      buttons2: { type: Array },
    };
  }

  static getConfigElement() {
    return document.createElement("xiaoshi-phone-fan-card-editor");
  }

  static getStubConfig() {
    return {
      entity: "",
      theme: "auto",
      width: "100%",
      fan_type: "circulator",
      show_temperature: true,
      show_direction_control: true,
      show_oscillate: true,
      timer: "",
      buttons: [],
      buttons2: [],
    };
  }

  setConfig(config) {
    this.config = config;
    this.buttons = config.buttons || [];
    this.buttons2 = config.buttons2 || [];
    if (config.width) this.width = config.width;
    this.requestUpdate();
  }

  set hass(value) {
    this._hass = value;
    if (this.config) this.requestUpdate();
  }

  updated(changedProperties) {
    // 当hass变化且不在拖拽且非刚释放时，同步本地slider值
    if (changedProperties.has('hass') && !this._isSliderDragging && !this._sliderJustReleased) {
      const entity = this._getEntityState(this.config.entity);
      if (entity) {
        this._localSliderValue = entity.attributes?.percentage || 0;
        this._tempSpeedPct = null;
      }
    }
    // hass更新后，如果刚释放且值已同步，清除标志
    if (changedProperties.has('hass') && this._sliderJustReleased) {
      const entity = this._getEntityState(this.config.entity);
      if (entity) {
        const newValue = entity.attributes?.percentage || 0;
        if (newValue === this._localSliderValue) {
          this._sliderJustReleased = false;
          this._tempSpeedPct = null;
        }
      }
    }
  }

  get hass() {
    return this._hass;
  }

  static get styles() {
    return css`
      :host {
        display: block;
        contain: content;
      }

      .card {
        position: relative;
        border-radius: 12px;
        overflow: hidden;
        box-sizing: border-box;
        padding: 0 12px 4px 12px;
      }

      .content-container {
        position: relative;
        z-index: 1;
        display: grid;
        grid-template-columns: 1fr 1fr 1fr;
        gap: 6px;
      }

      .status-area {
        grid-column: 1 / 4;
        grid-row: 1;
        display: grid;
        grid-template-columns: 1fr 2fr;
        align-items: center;
        gap: 8px;
        overflow: hidden;
      }

      .status-name {
        font-size: 16px;
        font-weight: bold;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      .status-info {
        font-size: 12px;
        font-weight: bold;
        display: flex;
        align-items: center;
        gap: 4px;
        white-space: nowrap;
        grid-column: 2;
        margin-left: -20px;
      }

      .power-area {
        grid-column: 3;
        grid-row: 1;
        display: flex;
        justify-content: flex-end;
        align-items: center;
      }

      .power-button {
        background: none;
        border: none;
        cursor: default;
        padding: 4px;
        border-radius: 8px;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .direction-area {
        grid-column: 1;
        grid-row: 2 / 9;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        margin-right: 30px;
      }

      .mode-area {
        grid-column: 2 / 4;
        grid-row: 2;
        display: flex;
        gap: 6px;
        justify-content: flex-start;
        margin-top: -6px;
        margin-left: -20px;
      }

      .mode-area .mode-button:first-child {
        flex: 1;
      }

      .mode-area .mode-button:not(:first-child) {
        flex: 1;
        min-width: 0;
      }

      /* 风速区域 */
      .fanspeed-area {
        grid-column: 2 / 4;
        grid-row: 3;
        display: flex !important;
        gap: 6px;
        flex-wrap: wrap;
        align-items: center;
        min-height: 25px !important;
        margin-left: -20px;
      }

      .fanspeed-area .speed-display-btn {
        flex: 0 0 calc(25% - 4.5px);
        height: 25px;
        box-sizing: border-box;
      }

      .fanspeed-area .mode-button:first-child {
        flex: 0 0 calc(25% - 4.5px);
      }

      .fanspeed-area .mode-button:not(:first-child) {
        flex: 1;
      }

      .fanspeed-area .sun-slider-container {
        flex: 3;
        min-width: 0;
        height: 25px !important;
      }

      /* 左右摆风区域 */
      .oscillateh-area {
        grid-column: 2 / 4;
        grid-row: 5;
        display: flex;
        gap: 6px;
        flex-wrap: nowrap;
        margin-left: -20px;
      }

      .oscillateh-area .switch-button:first-child {
        flex: 0 0 calc(25% - 4.5px);
      }

      .oscillateh-area .angle-button {
        flex: 1;
      }

      /* 上下摆风区域 */
      .oscillatev-area {
        grid-column: 2 / 4;
        grid-row: 4;
        display: flex;
        gap: 6px;
        flex-wrap: nowrap;
        margin-left: -20px;
      }

      .oscillatev-area .switch-button:first-child {
        flex: 0 0 calc(25% - 4.5px);
      }

      .oscillatev-area .angle-button {
        flex: 1;
      }

      .oscillatev-area .switch-button:last-child {
        flex: 0 0 calc(25% - 4.5px);
      }

      /* 副按钮区域 */
      .extras-area {
        grid-column: 2 / 4;
        grid-row: 7;
        display: flex;
        gap: 6px;
        flex-wrap: wrap;
        justify-content: space-between;
      }

      .extras-area .extra-btn {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 2px;
        min-width: 40px;
      }

      .extras-area .extra-btn .btn-label {
        font-size: 10px;
        line-height: 1.2;
        text-align: center;
      }

      /* 统一按钮基础样式 */
      .mode-button {
        height: 25px;
        background-color: var(--button-bg);
        color: var(--button-fg);
        border: none;
        border-radius: 8px;
        cursor: default;
        padding: 0 2px;
        display: flex;
        flex-direction: row;
        align-items: center;
        justify-content: center;
        gap: 1px;
        box-sizing: border-box;
      }

      .mode-button ha-icon {
        --mdc-icon-size: 12px;
      }

      .mode-button .btn-text {
        font-size: 9px;
        font-weight: bold;
        white-space: nowrap;
      }

      .mode-button.active {
        background-color: var(--active-color) !important;
        color: white !important;
      }

      .active-mode {
        background-color: var(--active-color) !important;
        color: white !important;
      }

      .switch-button {
        height: 25px;
        background-color: var(--button-bg);
        color: var(--button-fg);
        border: none;
        border-radius: 8px;
        cursor: default;
        padding: 4px 6px;
        display: flex;
        flex-direction: row;
        align-items: center;
        justify-content: center;
        gap: 2px;
        min-width: 0;
        box-sizing: border-box;
      }

      .switch-button ha-icon {
        --mdc-icon-size: 14px;
      }

      .switch-button .btn-text {
        font-size: 9px;
        font-weight: bold;
        white-space: nowrap;
      }

      .switch-button.active {
        background-color: var(--active-color) !important;
        color: white !important;
      }

      .angle-button {
        height: 25px;
        background-color: var(--button-bg);
        color: var(--button-fg);
        border: none;
        border-radius: 8px;
        cursor: default;
        padding: 3px 5px;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        min-width: 0;
        box-sizing: border-box;
      }

      .angle-button .btn-text {
        font-size: 9px;
        font-weight: bold;
      }

      .angle-button.active {
        background-color: var(--active-color) !important;
        color: white !important;
      }

      /* 有图标的angle-button水平排列 */
      .angle-button.has-icon {
        flex-direction: row;
        gap: 4px;
      }

      .angle-button.has-icon .btn-text {
        font-size: 8px;
      }

      /* 定时控制 */
      .timer-control {
        display: flex;
        align-items: center;
        gap: 4px;
        background-color: var(--button-bg);
        border-radius: 8px;
        padding: 3px 5px;
      }

      .timer-btn {
        background: none;
        border: none;
        cursor: default;
        padding: 2px;
        border-radius: 4px;
        display: flex;
        align-items: center;
        justify-content: center;
        width: 24px;
        height: 24px;
      }

      .timer-btn:hover {
        background: rgba(255,255,255,0.1);
      }

      .timer-value {
        font-size: 12px;
        font-weight: bold;
        min-width: 40px;
        text-align: center;
        color: var(--button-fg);
      }

      .timer-label {
        font-size: 10px;
        color: var(--button-fg);
      }

      /* 风速数值显示按钮 */
      .speed-display-btn {
        display: flex;
        align-items: center;
        gap: 4px;
        background-color: var(--button-bg);
        border: none;
        border-radius: 8px;
        padding: 6px 5px;
        cursor: default;
        min-width: 0;
      }

      .speed-percent {
        font-size: 10px;
        font-weight: bold;
        color: var(--active-color);
      }

      /* 风速滑块区域 */
      .fanspeed-slider-area {
        position: relative;
        display: flex;
        align-items: center;
        flex: 1;
        height: 25px;
        padding: 0 8px;
      }

      /* 内联滑块样式 */
      .sun-slider-container {
        position: relative;
        width: 100%;
        height: 25px;
        display: flex;
        align-items: center;
        padding: 0 8px;
        box-sizing: border-box;
      }

      .sun-slider-track {
        position: absolute;
        top: 50%;
        left: 0;
        transform: translateY(-50%);
        width: 100%;
        height: 25px;
        border-radius: 8px;
        overflow: visible;
        cursor: default;
        touch-action: none;
      }

      .sun-slider-bar {
        position: absolute;
        top: 0;
        left: 0;
        height: 100%;
        border-radius: 8px;
        pointer-events: none;
      }

      .sun-slider-thumb {
        position: absolute;
        top: 50%;
        transform: translate(-50%, -50%);
        width: 16px;
        height: 16px;
        border-radius: 50%;
        background: white;
        box-shadow: 0 2px 4px rgba(0,0,0,0.3);
        cursor: grab;
        touch-action: none;
      }

      .sun-slider-thumb:active { cursor: grabbing; }

      /* 方向盘样式 - 圆形方向盘 */
      .direction-control {
        position: relative;
        width: 100%;
        aspect-ratio: 1;
        max-width: 90px;
        max-height: 90px;
      }

      .dir-bg {
        position: absolute;
        width: 100%;
        height: 100%;
        border-radius: 50%;
        background: var(--button-bg);
        overflow: hidden;
        transition: transform 0.15s;
      }

      .dir-bg:active {
        transform: scale(0.95);
      }
      
      .dir扇 {
        position: absolute;
        width: 100%;
        height: 100%;
        transition: background 0.15s;
        cursor: pointer;
        background: transparent;
      }

      .dir扇:active {
        background: var(--active-color);
      }

      .dir扇-up {
        clip-path: polygon(50% 50%, 0% 0%, 100% 0%);
      }

      .dir扇-down {
        clip-path: polygon(50% 50%, 0% 100%, 100% 100%);
      }

      .dir扇-left {
        clip-path: polygon(50% 50%, 0% 0%, 0% 100%);
      }

      .dir扇-right {
        clip-path: polygon(50% 50%, 100% 0%, 100% 100%);
      }

      .dir-btn {
        position: absolute;
        border: none;
        cursor: default;
        padding: 0;
        background: transparent;
        transition: color 0.2s;
        z-index: 10;
        pointer-events: none;
        width: 30px;
        height: 30px;
        display: flex;
        align-items: center;
        justify-content: center;
      }


      .dir-btn ha-icon {
        --mdc-icon-size: 22px;
        color: var(--button-fg);
      }

      /* 方向按钮位置：放在各扇形的中心位置 */
      .dir-btn.up { top: 12%; left: 50%; transform: translate(-50%, -50%); }
      .dir-btn.down { bottom: 12%; left: 50%; transform: translate(-50%, 50%); }
      .dir-btn.left { left: 12%; top: 50%; transform: translate(-50%, -50%); }
      .dir-btn.right { right: 12%; top: 50%; transform: translate(50%, -50%); }

      .dir-btn.center {
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        width: 27px;
        height: 27px;
        border-radius: 50%;
        background: var(--secondary-bg);
        z-index: 20;
        pointer-events: auto;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .dir-btn.center:active {
        background: var(--theme-bg-active, rgba(16, 202, 248, 0.9));
        transform: translate(-50%, -50%) scale(0.95);
      }

      .dir-btn.center ha-icon {
        --mdc-icon-size: 16px;
      }

      /* 副按钮样式 */
      .extra-btn {
        background: none;
        border: none;
        cursor: default;
        padding: 4px;
        border-radius: 8px;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        min-width: 40px;
        min-height: 40px;
      }

      .extra-btn ha-icon {
        --mdc-icon-size: 16px;
      }

      .extra-btn.active ha-icon {
        color: var(--active-color);
      }

      .extra-btn:not(.active) ha-icon {
        color: var(--button-fg);
      }

      /* 手机自适应 */

      .active-gradient {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: linear-gradient(90deg, var(--linear-color), transparent 50%);
        opacity: 0.8;
        z-index: 0;
      }

      #chart-container {
        position: absolute;
        bottom: 0;
        left: 0;
        width: 100%;
        height: 20%;
        overflow: hidden;
        z-index: 0;
        pointer-events: none;
      }

      .timer-area {
        grid-column: 2 / 4;
        grid-row: 6;
        display: grid;
        grid-template-columns: repeat(8, 1fr);
        gap: 4px;
        margin-left: -20px;
        margin-top: -3px;
      }

      .timer-button {
        display: flex;
        align-items: center;
        justify-content: center;
        background-color: var(--button-bg);
        color: var(--button-fg);
        border: none;
        border-radius: 8px;
        cursor: default;
        font-size: 10px;
        min-width: 0;
        overflow: hidden;
        padding: 0 2px;
        height: 25px;
      }

      .timer-display {
        grid-column: span 2;
        display: flex;
        align-items: center;
        justify-content: center;
        background-color: var(--button-bg);
        color: var(--button-fg);
        border-radius: 8px;
        font-size: 10px;
        font-weight: bold;
        font-family: monospace;
        height: 25px;
      }

      .extra-area {
        grid-column: 2 / 4;
        grid-row: 7;
        display: grid;
        gap: 5px;
        margin-left: -20px;
        margin-top: -3px;
      }

      .extra2-area {
        grid-column: 2 / 4;
        grid-row: 8;
        display: grid;
        gap: 5px;
        margin-left: -20px;
        margin-top: -3px;
      }

      .extra-button {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        background-color: rgb(0,0,0,0);
        color: var(--button-fg);
        border: none;
        cursor: default;
        min-width: 0;
        overflow: visible;
        height: 100%;
        padding: -3px 0 0 0;
      }

      .extra-button-content {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        height: 100%;
        line-height: 1;
        cursor: default;
      }

      .extra-button-icon {
        --mdc-icon-size: 27px;
        height: 24px;
        display: flex;
        align-items: center;
        justify-content: center;
        margin-bottom: -4px;
        cursor: default;
      }

      .extra-button-value {
        height: 24px;
        display: flex;
        align-items: center;
        justify-content: center;
        margin-bottom: -4px;
        font-size: 11px;
        font-weight: bold;
        line-height: 1.5;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        max-width: 100%;
        cursor: default;
      }

      .extra-button-text {
        font-size: 10px;
        line-height: 1.2;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        max-width: 100%;
        height: auto;
        cursor: default;
      }

      .active-extra {
        background-color: transparent !important;
        color: var(--active-color) !important;
      }

      /* 普通风扇图标容器 */
      .normal-fan-icon-container {
        display: flex;
        align-items: center;
        justify-content: center;
      }

      /* 风扇旋转动画 */
      @keyframes fan-spin {
        from { transform: rotate(0deg); }
        to { transform: rotate(360deg); }
      }

      .fan-spinning {
        animation: fan-spin 1.5s linear infinite;
      }

    `;
  }

  constructor() {
    super();
    this.hass = {};
    this.config = {};
    this._tempSpeedPct = null;
    this._localSliderValue = 0;
    this._isSliderDragging = false;
    this._timerInterval = null;
    this._timerWasActive = false;
    this.temperatureData = [];
    this.buttons = [];
    this.buttons2 = [];
    this.canvas = null;
    this.ctx = null;
  }

  _onSpeedSliderChanged(value) {
    this._tempSpeedPct = value;
  }

  // ---- 内联滑块（原SunSliderControl）----
  _renderSunSlider(value, sliderColor, trackColor, speedLevelEntity, fanEntity) {
    // 不在拖拽且非刚释放时，才从外部值同步
    if (!this._isSliderDragging && !this._sliderJustReleased) {
      this._localSliderValue = value;
    }
    const displayValue = this._localSliderValue;
    const barWidth = `${displayValue}%`;
    const thumbLeft = `${displayValue}%`;

    return html`
      <div class="sun-slider-container">
        <div
          class="sun-slider-track"
          style="background: ${trackColor};"
          @click=${(e) => this._onSliderTrackClick(e, speedLevelEntity, fanEntity)}
        >
          <div class="sun-slider-bar" style="width: ${barWidth}; background: ${sliderColor};"></div>
          <div class="sun-slider-thumb" style="left: ${thumbLeft};" @pointerdown=${(e) => this._onSliderPointerDown(e, speedLevelEntity, fanEntity)}></div>
        </div>
      </div>
    `;
  }

  _onSliderTrackClick(e, speedLevelEntity, fanEntity) {
    // 拖拽释放后会冒泡触发click，跳过以避免重复执行
    if (this._justDragged) {
      this._justDragged = false;
      return;
    }
    this._sliderUpdateValueFromEvent(e);
    this._sliderCallService(speedLevelEntity, fanEntity);
    this.requestUpdate();
  }

  _onSliderPointerDown(e, speedLevelEntity, fanEntity) {
    e.preventDefault();
    this._isSliderDragging = true;
    this._sliderUpdateValueFromEvent(e);
    const onMove = (ev) => {
      if (!this._isSliderDragging) return;
      this._sliderUpdateValueFromEvent(ev);
    };
    const onUp = () => {
      if (!this._isSliderDragging) return;
      this._isSliderDragging = false;
      this._sliderJustReleased = true;
      this._justDragged = true;
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('pointercancel', onUp);
      // 释放后才执行服务调用
      this._sliderCallService(speedLevelEntity, fanEntity);
    };
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    window.addEventListener('pointercancel', onUp);
  }

  _sliderUpdateValueFromEvent(e) {
    const track = this.shadowRoot.querySelector('.sun-slider-track');
    if (!track) return;
    const rect = track.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const ratio = Math.max(0, Math.min(1, x / rect.width));
    const value = Math.round(ratio * 100);
    this._localSliderValue = value;
    this._tempSpeedPct = value;

    // 拖拽期间直接更新DOM，避免频繁全量重渲染
    const bar = track.querySelector('.sun-slider-bar');
    const thumb = track.querySelector('.sun-slider-thumb');
    if (bar) bar.style.width = `${value}%`;
    if (thumb) thumb.style.left = `${value}%`;

    const speedPercent = this.shadowRoot.querySelector('.speed-percent');
    if (speedPercent) speedPercent.textContent = `${value}%`;
  }

  _sliderCallService(speedLevelEntity, fanEntity) {
    if (!this._hass) return;
    const currentValue = this._localSliderValue;
    if (speedLevelEntity) {
      this._hass.callService('number', 'set_value', {
        entity_id: speedLevelEntity,
        value: currentValue
      });
    } else if (fanEntity) {
      this._hass.callService('fan', 'set_percentage', {
        entity_id: fanEntity,
        percentage: currentValue
      });
    }
  }

  _evaluateTheme() {
      try {
          const mode = this.config ? this.config.theme : 'system';
          if (mode === 'light') return 'light';
          if (mode === 'dark') return 'dark';
          if (mode === 'system' || !mode) {
              if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) return 'dark';
              return 'light';
          }
          if (mode === 'sun') {
              const sunState = this.hass && this.hass.states && this.hass.states['sun.sun'];
              if (sunState && sunState.state === 'above_horizon') return 'light';
              if (sunState && sunState.state === 'below_horizon') return 'dark';
              return 'light';
          }
          if (mode === 'function' || (typeof mode === 'string' && mode.includes('theme'))) {
              if (typeof window.theme === 'function') {
                  return window.theme() || 'light';
              }
            return 'light';
          }
          return mode;
      } catch (e) {
          return 'light';
      }
  }

  _callService(domain, service, data) {
    if (this._hass) {
      this._hass.callService(domain, service, data);
    }
  }

  _getEntityState(entityId) {
    if (!entityId || !this._hass.states) return null;
    return this._hass.states[entityId];
  }

  _toggleFan() {
    if (!this.config.entity) return;
    const entity = this._getEntityState(this.config.entity);
    if (!entity) return;
    if (entity.state === 'on') {
      this._callService('fan', 'turn_off', { entity_id: this.config.entity });
      this._cancelTimer();
    } else {
      this._callService('fan', 'turn_on', { entity_id: this.config.entity });
    }
    this._handleClick();
  }

  _setPresetMode(mode) {
    this._handleClick();
    if (!this.config.entity) return;
    this._callService('fan', 'set_preset_mode', {
      entity_id: this.config.entity,
      preset_mode: mode
    });
  }

  _setFanSpeed(speed) {
    this._handleClick();
    if (!this.config.entity) return;
    this._callService('fan', 'set_percentage', {
      entity_id: this.config.entity,
      percentage: speed
    });
  }

  _setSpeedLevel(value) {
    this._handleClick();
    // 使用风速档位实体设置档位
    if (this.config.speed_level) {
      this._callService('number', 'set_value', {
        entity_id: this.config.speed_level,
        value: value
      });
    }
  }

  _onSpeedSliderChange(e) {
    if (!this.config.entity) return;
    const value = parseInt(e.target.value);
    this._callService('fan', 'set_percentage', {
      entity_id: this.config.entity,
      percentage: value
    });
  }

  _toggleOscillate() {
    this._handleClick();
    if (!this.config.entity) return;
    const entity = this._getEntityState(this.config.entity);
    const currentOscillating = entity?.attributes?.oscillating || false;
    this._callService('fan', 'oscillate', {
      entity_id: this.config.entity,
      oscillating: !currentOscillating
    });
  }

  _setFanModeSelect(option) {
    this._handleClick();
    if (!this.config.fan_mode) return;
    this._callService('select', 'select_option', {
      entity_id: this.config.fan_mode,
      option: option
    });
  }

  _selectOscillateAngle(angle) {
    this._handleClick();
    if (!this.config.oscillate_angle) return;
    this._callService('select', 'select_option', {
      entity_id: this.config.oscillate_angle,
      option: angle.toString()
    });
  }

  _toggleVerticalSwing() {
    this._handleClick();
    if (!this.config.vertical_swing) return;
    this._callService('switch', 'toggle', { entity_id: this.config.vertical_swing });
  }

  _selectVerticalAngle(angle) {
    this._handleClick();
    if (!this.config.vertical_angle) return;
    this._callService('select', 'select_option', {
      entity_id: this.config.vertical_angle,
      option: angle.toString()
    });
  }

  _toggleCycleSwing() {
    this._handleClick();
    if (!this.config.cycle_swing) return;
    this._callService('switch', 'toggle', { entity_id: this.config.cycle_swing });
  }

  _toggleSwitch(entityId) {
    this._handleClick();
    if (!entityId) return;
    const entity = this._getEntityState(entityId);
    if (!entity) return;

    // 根据实体类型调用不同的服务
    if (entityId.startsWith('light.')) {
      this._callService('light', 'toggle', { entity_id: entityId });
    } else {
      this._callService('switch', 'toggle', { entity_id: entityId });
    }
  }

  _setSwingDirection(direction) {
    this._handleClick();
    // 上下手动摇头
    if ((direction === 'UP' || direction === 'DOWN') && this.config.up_down_swing) {
      this._callService('select', 'select_option', {
        entity_id: this.config.up_down_swing,
        option: direction
      });
    }
    // 左右手动摇头
    if ((direction === 'LEFT' || direction === 'RIGHT') && this.config.left_right_swing) {
      this._callService('select', 'select_option', {
        entity_id: this.config.left_right_swing,
        option: direction
      });
    }
  }

  render() {
    if (!this.hass || !this.config.entity) {
      return html`<div>请选择风扇实体</div>`;
    }

    const entity = this._getEntityState(this.config.entity);
    if (!entity) {
      return html`<div>实体未找到: ${this.config.entity}</div>`;
    }

    const isNormalFan = this.config.fan_type === 'normal';

    const state = entity.state;
    const attrs = entity.attributes || {};
    const isOn = state === 'on';
    const presetMode = attrs.preset_mode || '';

    const theme = this._evaluateTheme();
    const fgColor = theme === 'light' ? 'rgb(0, 0, 0)' : 'rgb(255, 255, 255)';
    const bgColor = theme === 'light' ? 'rgb(255, 255, 255)' : 'rgb(50, 50, 50)';
    const buttonBg = theme === 'light' ? 'rgb(230, 230, 230)' : 'rgb(80, 80, 80)';
    const buttonFg = theme === 'light' ? 'rgb(50, 50, 50)' : 'rgb(240, 240, 240)';
    const activeColor = 'rgb(0, 188, 213)';
    const secondaryBg = theme === 'light' ? 'rgb(150, 150, 150)' : 'rgb(100, 100, 100)';

    // 获取温度
    let temperature = '-';
    if (this.config.temperature) {
      const tempEntity = this._getEntityState(this.config.temperature);
      if (tempEntity && tempEntity.state !== 'unavailable' && tempEntity.state !== 'unknown') {
        temperature = tempEntity.state;
      }
    }

    // 获取湿度
    let humidity = '-';
    if (this.config.humidity) {
      const humEntity = this._getEntityState(this.config.humidity);
      if (humEntity && humEntity.state !== 'unavailable' && humEntity.state !== 'unknown') {
        humidity = humEntity.state;
      }
    }

    // 获取左右摆风角度
    let oscillateAngle = '';
    if (this.config.oscillate_angle) {
      const angleEntity = this._getEntityState(this.config.oscillate_angle);
      if (angleEntity) {
        oscillateAngle = angleEntity.state;
      }
    }

    // 获取上下摆风角度
    let verticalAngle = '';
    if (this.config.vertical_angle) {
      const vAngleEntity = this._getEntityState(this.config.vertical_angle);
      if (vAngleEntity) {
        verticalAngle = vAngleEntity.state;
      }
    }

    // 获取上下摆风开关状态
    let verticalSwingOn = false;
    if (this.config.vertical_swing) {
      const vsEntity = this._getEntityState(this.config.vertical_swing);
      if (vsEntity && vsEntity.state === 'on') {
        verticalSwingOn = true;
      }
    }

    // 获取循环摆风开关状态
    let cycleSwingOn = false;
    if (this.config.cycle_swing) {
      const csEntity = this._getEntityState(this.config.cycle_swing);
      if (csEntity && csEntity.state === 'on') {
        cycleSwingOn = true;
      }
    }

    // 循环扇模式列表
    const modes = [
      { value: '直吹风', label: '直吹风', icon: 'mdi:weather-windy' },
      { value: '自然风', label: '自然风', icon: 'mdi:leaf' },
      { value: '智能风', label: '智能风', icon: 'mdi:fan-auto' },
      { value: '睡眠风', label: '睡眠风', icon: 'mdi:weather-night' },
    ];

    // 普通风扇模式列表 - 只要有preset_modes就显示模式按钮
    const presetModes = attrs.preset_modes || [];
    const hasPresetModes = presetModes.length > 0;
    const normalModes = presetModes.map(m => ({
      value: m,
      label: m,
      icon: 'mdi:fan',
    }));

    // 普通风扇档位 - 基于percentage_step计算
    const percentageStep = attrs.percentage_step || 33.333333333333336;
    const isSteplessSpeed = percentageStep === 1;
    const hasPercentageStep = !isSteplessSpeed && Math.abs(percentageStep - 33.333333333333336) < 1;
    const maxPercentage = attrs.percentage || 66;
    // 计算3个档位
    const normalSpeedLevels = [
      { value: Math.round(percentageStep), label: '1档', icon: 'mdi:fan-speed-1' },
      { value: Math.round(percentageStep * 2), label: '2档', icon: 'mdi:fan-speed-2' },
      { value: 100, label: '3档', icon: 'mdi:fan-speed-3' },
    ];

    // 风速档位（与原版一致：1档1-34, 2档35-69, 3档70-99, 4档100）
    const fanSpeedLevels = [
      { value: 1, label: '1档', icon: 'mdi:fan-speed-1', min: 1, max: 34 },
      { value: 35, label: '2档', icon: 'mdi:fan-speed-2', min: 35, max: 69 },
      { value: 70, label: '3档', icon: 'mdi:fan-speed-3', min: 70, max: 99 },
      { value: 100, label: '4档', icon: 'mdi:fan-alert', min: 100, max: 100 },
    ];

    // 计算当前风速档位
    const currentPct = attrs.percentage || 0;
    const getActiveSpeedLevel = () => {
      for (const fs of fanSpeedLevels) {
        if (currentPct >= fs.min && currentPct <= fs.max) return fs.value;
      }
      return 25;
    };

    // 左右摆风角度
    const oscillateAngles = [30, 60, 90, 120, 150];

    // 上下摆风角度
    const verticalAngles = [30, 60, 90];

    // 定时器和附加按钮
    const hasTimer = this.config.timer;
    const timerEntity = hasTimer ? this._getEntityState(this.config.timer) : null;
    const hasExtra = this.buttons && this.buttons.length > 0;
    const hasExtra2 = this.buttons2 && this.buttons2.length > 0;
    const buttonCount = Math.min((this.buttons || []).length, 7);
    const buttonCount2 = Math.min((this.buttons2 || []).length, 7);

    // 普通风扇模式select
    const hasFanModeSelect = isNormalFan && this.config.fan_mode;
    const fanModeEntity = hasFanModeSelect ? this._getEntityState(this.config.fan_mode) : null;
    const fanModeOptions = fanModeEntity?.attributes?.options || [];
    const fanModeCurrent = fanModeEntity?.state || '';

    // 普通风扇行偏移计算
    const normalFanRowOffset = (hasPresetModes ? 1 : 0) + (hasPercentageStep || isSteplessSpeed ? 1 : 0) + (hasFanModeSelect && fanModeOptions.length > 0 ? 1 : 0);

    // 普通风扇的当前档位
    const getCurrentNormalLevel = () => {
      if (currentPct <= 0) return 0;
      for (const level of normalSpeedLevels) {
        if (currentPct <= level.value) return level.value;
      }
      return 100;
    };

    return html`
      <div class="card" style="
        width: ${this.width || '100%'};
        background: ${bgColor};
        color: ${fgColor};
        --button-bg: ${buttonBg};
        --button-fg: ${buttonFg};
        --active-color: ${activeColor};
        --secondary-bg: ${secondaryBg};
        --linear-color: ${isOn ? activeColor : 'rgb(0,0,0,0)'};
      ">
        ${isOn ? html`<div class="active-gradient"></div>` : ''}
        <div id="chart-container"></div>
        <div class="content-container" style="${isNormalFan ? 'grid-template-columns: 1fr 3fr;' : ''}">
          <!-- 状态行 -->
          <div class="status-area" style="color: ${fgColor}; ${isNormalFan ? 'grid-column: 1 / -1;' : ''}">
            <span class="status-name">${attrs.friendly_name || (isNormalFan ? '风扇' : '循环扇')}</span>
            <span class="status-info">
              <span>${isOn ? presetMode : '关闭'}</span>
              ${this.config.temperature && temperature !== '-' ? html`<span>${temperature}°C</span>` : ''}
              ${this.config.humidity && humidity !== '-' ? html`<span>${humidity}%</span>` : ''}
            </span>
          </div>

          <!-- 电源开关 -->
          <div class="power-area" style="${isNormalFan ? 'grid-column: 2;' : ''}">
            <button class="power-button" @click=${this._toggleFan}>
              <ha-icon
                icon="${isOn ? 'mdi:toggle-switch' : 'mdi:toggle-switch-off'}"
                style="color: ${isOn ? activeColor : fgColor}; --mdc-icon-size: 28px;"
              ></ha-icon>
            </button>
          </div>

          ${isNormalFan ? html`
            <!-- 普通风扇：左侧风扇图标 -->
            <div class="direction-area" style="grid-row: 2 / ${2 + normalFanRowOffset + 1}; margin-right: 0;">
              <div class="normal-fan-icon-container">
                <ha-icon icon="mdi:fan" class="normal-fan-icon ${isOn ? 'fan-spinning' : ''}" style="--mdc-icon-size: 50px; color: ${isOn ? activeColor : secondaryBg};"></ha-icon>
              </div>
            </div>

            <!-- 普通风扇模式区域 - 第一排：模式按钮 + 摇头 -->
            ${hasPresetModes ? html`
            <div class="mode-area" style="grid-row: 2; grid-column: 2; margin-left: -10px;">
              ${normalModes.map(m => html`
                <button
                  class="mode-button ${presetMode === m.value ? 'active-mode' : ''}"
                  @click=${() => this._setPresetMode(m.value)}
                >
                  <ha-icon icon="${m.icon}"></ha-icon>
                  <span class="btn-text">${m.label}</span>
                </button>
              `)}
              ${this.config.show_oscillate !== false ? html`
              <button
                class="mode-button ${attrs.oscillating ? 'active-mode' : ''}"
                @click=${this._toggleOscillate}
              >
                <ha-icon icon="mdi:rotate-3d-variant"></ha-icon>
                <span class="btn-text">摇头</span>
              </button>
              ` : ''}
            </div>
            ` : ''}

            <!-- 普通风扇无极调速区域 - 风速数值+滑块 -->
            ${isSteplessSpeed ? html`
            <div class="fanspeed-area" style="${hasPresetModes ? 'grid-row: 3; grid-column: 2; margin-top: 0px;margin-bottom: 2px; margin-left: -10px;' : 'grid-row: 2; grid-column: 2;'}">
              <button class="speed-display-btn">
                <ha-icon icon="mdi:speedometer" style="color: ${activeColor}; --mdc-icon-size: 16px;"></ha-icon>
                <span class="speed-percent">${this._tempSpeedPct !== null ? this._tempSpeedPct : currentPct}%</span>
              </button>
              ${this._renderSunSlider(currentPct, activeColor, secondaryBg, null, this.config.entity)}
            </div>
            ` : ''}

            <!-- 普通风扇档位区域 - 第二排：档位按钮 -->
            ${hasPresetModes && hasPercentageStep ? html`
            <div class="mode-area" style="grid-row: 3; grid-column: 2; margin-left: -10px; margin-top: 0px;margin-bottom: 2px;">
              ${normalSpeedLevels.map((level, idx) => {
                let isActive = false;
                if (idx === 0 && currentPct > 0 && currentPct <= level.value) isActive = true;
                else if (idx > 0 && currentPct > normalSpeedLevels[idx - 1].value && currentPct <= level.value) isActive = true;
                else if (idx === normalSpeedLevels.length - 1 && currentPct === 100) isActive = true;
                return html`
                  <button
                    class="mode-button ${isActive ? 'active-mode' : ''}"
                    @click=${() => this._setFanSpeed(level.value)}
                  >
                    <ha-icon icon="${level.icon}"></ha-icon>
                    <span class="btn-text">${level.label}</span>
                  </button>
                `;
              })}
            </div>
            ` : !hasPresetModes && hasPercentageStep ? html`
            <div class="mode-area" style="grid-row: 2; grid-column: 2; margin-left: -10px;">
              ${normalSpeedLevels.map((level, idx) => {
                let isActive = false;
                if (idx === 0 && currentPct > 0 && currentPct <= level.value) isActive = true;
                else if (idx > 0 && currentPct > normalSpeedLevels[idx - 1].value && currentPct <= level.value) isActive = true;
                else if (idx === normalSpeedLevels.length - 1 && currentPct === 100) isActive = true;
                return html`
                  <button
                    class="mode-button ${isActive ? 'active-mode' : ''}"
                    @click=${() => this._setFanSpeed(level.value)}
                  >
                    <ha-icon icon="${level.icon}"></ha-icon>
                    <span class="btn-text">${level.label}</span>
                  </button>
                `;
              })}
              ${this.config.show_oscillate !== false ? html`
              <button
                class="mode-button ${attrs.oscillating ? 'active-mode' : ''}"
                @click=${this._toggleOscillate}
              >
                <ha-icon icon="mdi:rotate-3d-variant"></ha-icon>
                <span class="btn-text">摇头</span>
              </button>
              ` : ''}
            </div>
            ` : !hasPresetModes && !hasPercentageStep ? html`
            <div class="mode-area" style="grid-row: 2; grid-column: 2; margin-left: -10px;">
              ${normalSpeedLevels.map((level, idx) => {
                let isActive = false;
                if (idx === 0 && currentPct > 0 && currentPct <= level.value) isActive = true;
                else if (idx > 0 && currentPct > normalSpeedLevels[idx - 1].value && currentPct <= level.value) isActive = true;
                else if (idx === normalSpeedLevels.length - 1 && currentPct === 100) isActive = true;
                return html`
                  <button
                    class="mode-button ${isActive ? 'active-mode' : ''}"
                    @click=${() => this._setFanSpeed(level.value)}
                  >
                    <ha-icon icon="${level.icon}"></ha-icon>
                    <span class="btn-text">${level.label}</span>
                  </button>
                `;
              })}
              ${this.config.show_oscillate !== false ? html`
              <button
                class="mode-button ${attrs.oscillating ? 'active-mode' : ''}"
                @click=${this._toggleOscillate}
              >
                <ha-icon icon="mdi:rotate-3d-variant"></ha-icon>
                <span class="btn-text">摇头</span>
              </button>
              ` : ''}
            </div>
            ` : ''}

            <!-- 普通风扇模式select区域 -->
            ${hasFanModeSelect && fanModeOptions.length > 0 ? html`
            <div class="mode-area" style="grid-row: ${2 + (hasPresetModes ? 1 : 0) + (hasPercentageStep || isSteplessSpeed ? 1 : 0)}; grid-column: 2; margin-left: -10px; margin-top: -2px; margin-bottom: 2px;">
              ${fanModeOptions.map(opt => html`
                <button
                  class="mode-button ${fanModeCurrent === opt ? 'active-mode' : ''}"
                  @click=${() => this._setFanModeSelect(opt)}
                >
                  <ha-icon icon="mdi:fan"></ha-icon>
                  <span class="btn-text">${opt}</span>
                </button>
              `)}
            </div>
            ` : ''}

          ` : html`
            <!-- 循环扇：方向控制区域 -->
            ${this.config.show_direction_control !== false ? html`
              <div class="direction-area">
                <div class="direction-control">
                  <div class="dir-bg">
                    <div class="dir扇 dir扇-up" @click=${() => this._setSwingDirection('UP')}></div>
                    <div class="dir扇 dir扇-down" @click=${() => this._setSwingDirection('DOWN')}></div>
                    <div class="dir扇 dir扇-left" @click=${() => this._setSwingDirection('LEFT')}></div>
                    <div class="dir扇 dir扇-right" @click=${() => this._setSwingDirection('RIGHT')}></div>
                  </div>
                  <button class="dir-btn up" @click=${() => this._setSwingDirection('UP')}>
                    <ha-icon icon="mdi:chevron-up"></ha-icon>
                  </button>
                  <button class="dir-btn down" @click=${() => this._setSwingDirection('DOWN')}>
                    <ha-icon icon="mdi:chevron-down"></ha-icon>
                  </button>
                  <button class="dir-btn left" @click=${() => this._setSwingDirection('LEFT')}>
                    <ha-icon icon="mdi:chevron-left"></ha-icon>
                  </button>
                  <button class="dir-btn right" @click=${() => this._setSwingDirection('RIGHT')}>
                    <ha-icon icon="mdi:chevron-right"></ha-icon>
                  </button>
                  <button class="dir-btn center" @click=${() => this._toggleSwitch(this.config.reset_position)}>
                  </button>
                </div>
              </div>
            ` : ''}

            <!-- 循环扇模式区域 -->
            <div class="mode-area">
              ${modes.map(m => html`
                <button
                  class="mode-button ${presetMode === m.value ? 'active-mode' : ''}"
                  @click=${() => this._setPresetMode(m.value)}
                >
                  <ha-icon icon="${m.icon}"></ha-icon>
                  <span class="btn-text">${m.label}</span>
                </button>
              `)}
            </div>

            <!-- 循环扇风速区域 -->
            <div class="fanspeed-area">
              ${presetMode === '自然风' ? html`
                ${this.config.speed_level ? fanSpeedLevels.map(fs => html`
                  <button
                    class="mode-button ${currentPct >= fs.min && currentPct <= fs.max ? 'active-mode' : ''}"
                    @click=${() => this._setSpeedLevel(fs.value)}
                  >
                    <ha-icon icon="${fs.icon}"></ha-icon>
                    <span class="btn-text">${fs.label}</span>
                  </button>
                `) : html`
                  ${this._renderSunSlider(currentPct, activeColor, secondaryBg, this.config.speed_level, this.config.entity)}
                `}
              ` : html`
                <button class="speed-display-btn">
                  <ha-icon icon="mdi:speedometer" style="color: ${activeColor}; --mdc-icon-size: 16px;"></ha-icon>
                  <span class="speed-percent">${this._tempSpeedPct !== null ? this._tempSpeedPct : currentPct}%</span>
                </button>
                ${this._renderSunSlider(currentPct, activeColor, secondaryBg, this.config.speed_level, this.config.entity)}
              `}
            </div>

            <!-- 循环扇上下摆风区域 -->
            <div class="oscillatev-area">
              <button
                class="switch-button ${verticalSwingOn ? 'active' : ''}"
                @click=${this._toggleVerticalSwing}
              >
                <ha-icon icon="mdi:arrow-up-down"></ha-icon>
                <span class="btn-text">上下摆风</span>
              </button>
              ${verticalAngles.map(angle => html`
                <button
                  class="angle-button ${verticalAngle === angle.toString() ? 'active' : ''}"
                  @click=${() => this._selectVerticalAngle(angle)}
                >
                  <span class="btn-text">${angle}°</span>
                </button>
              `)}
              <button
                class="switch-button ${cycleSwingOn ? 'active' : ''}"
                @click=${this._toggleCycleSwing}
              >
                <ha-icon icon="mdi:arrow-all"></ha-icon>
                <span class="btn-text">循环摆风</span>
              </button>
            </div>

            <!-- 循环扇左右摆风区域 -->
            <div class="oscillateh-area">
              <button
                class="switch-button ${attrs.oscillating ? 'active' : ''}"
                @click=${this._toggleOscillate}
              >
                <ha-icon icon="mdi:arrow-oscillating"></ha-icon>
                <span class="btn-text">左右摆风</span>
              </button>
              ${oscillateAngles.map(angle => html`
                <button
                  class="angle-button ${oscillateAngle === angle.toString() ? 'active' : ''}"
                  @click=${() => this._selectOscillateAngle(angle)}
                >
                  <span class="btn-text">${angle}°</span>
                </button>
              `)}
            </div>
          `}

          ${hasTimer ? html`
            <div class="timer-area" style="${isNormalFan ? `grid-row: ${2 + normalFanRowOffset}; grid-column: 2; margin-left: -10px;` : ''}">
              ${this._renderTimerControls(timerEntity)}
            </div>
          ` : ''}

          ${hasExtra ? html`
            <div class="extra-area" style="grid-template-columns: repeat(${buttonCount}, 1fr); ${isNormalFan ? `grid-row: ${3 + normalFanRowOffset}; grid-column: 2; margin-left: 0;` : ''}">
              ${this._renderExtraButtons(1)}
            </div>
          ` : ''}

          ${hasExtra2 ? html`
            <div class="extra2-area" style="grid-template-columns: repeat(${buttonCount2}, 1fr); ${isNormalFan ? `grid-row: ${4 + normalFanRowOffset}; grid-column: 2; margin-left: 0;` : ''}">
              ${this._renderExtraButtons(2)}
            </div>
          ` : ''}

        </div>
      </div>
    `;
  }

  connectedCallback() {
    super.connectedCallback();
    this._startTimerRefresh();
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this._stopTimerRefresh();
  }

  _startTimerRefresh() {
    this._timerInterval = setInterval(() => {
      this.requestUpdate();
    }, 1000);
  }

  _stopTimerRefresh() {
    if (this._timerInterval) {
      clearInterval(this._timerInterval);
      this._timerInterval = null;
    this._timerWasActive = false;
    }
  }

  async firstUpdated() {
    await this._fetchDataAndRenderChart();
  }

  async updated(changedProperties) {
    if (changedProperties.has('hass') || changedProperties.has('config')) {
      await this._fetchDataAndRenderChart();
    }
  }

  async _fetchDataAndRenderChart() {
    if (!this.hass) return;
    const now = new Date();
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const entityId = this.config.temperature || this.config.entity;
    if (!entityId) return;

    const result = await this.hass.callWS({
      type: 'history/history_during_period',
      start_time: yesterday.toISOString(),
      end_time: now.toISOString(),
      entity_ids: [entityId],
      significant_changes_only: true,
      minimal_response: true,
      no_attributes: false
    });

    if (!result?.[entityId]?.length) return;

    const isSensor = entityId.startsWith('sensor.');
    const rawData = result[entityId]
      .map(entry => {
        const value = isSensor ? entry.s : entry.a?.current_temperature;
        return parseFloat(value);
      })
      .filter(value => !isNaN(value));

    if (rawData.length === 0) return;

    const sampleInterval = Math.max(1, Math.floor(rawData.length / 50));
    const sampledData = [];
    for (let i = 0; i < rawData.length; i += sampleInterval) {
      const end = Math.min(i + sampleInterval, rawData.length);
      const slice = rawData.slice(i, end);
      const avg = slice.reduce((sum, val) => sum + val, 0) / slice.length;
      sampledData.push(avg);
    }

    this.temperatureData = this._gaussianSmooth(sampledData, 3);
    await this.initCanvas();
    this.drawSmoothCurve();
  }

  async initCanvas() {
    const container = this.shadowRoot.querySelector('#chart-container');
    if (!container) return;
    while (container.firstChild) {
      container.removeChild(container.firstChild);
    }
    this.canvas = document.createElement('canvas');
    this.canvas.className = 'temperature-chart';
    container.appendChild(this.canvas);
    const scale = window.devicePixelRatio || 1;
    const width = container.clientWidth;
    const height = container.clientHeight;
    this.canvas.style.width = `${width}px`;
    this.canvas.style.height = `${height}px`;
    this.canvas.width = Math.floor(width * scale);
    this.canvas.height = Math.floor(height * scale);
    this.ctx = this.canvas.getContext('2d');
    this.ctx.scale(scale, scale);
    await this.updateComplete;
  }

  drawSmoothCurve() {
    if (!this.ctx || !this.temperatureData || this.temperatureData.length === 0) return;
    const entity = this._getEntityState(this.config.entity);
    const state = entity?.state || 'off';
    const theme = this._evaluateTheme();
    const isOn = state === 'on';
    let statusColor = theme === 'light' ? '#13b83d' : '#13b83d';
    if (isOn) statusColor = '#1fec08';

    const canvas = this.canvas;
    const ctx = this.ctx;
    const scale = window.devicePixelRatio || 1;
    const width = canvas.width / scale;
    const height = canvas.height / scale;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const minTemp = Math.min(...this.temperatureData) - 1;
    const maxTemp = Math.max(...this.temperatureData);
    const tempRange = Math.max(maxTemp - minTemp, 0.1);
    const xStep = width / (this.temperatureData.length - 1);
    const points = this.temperatureData.map((temp, i) => {
      return {
        x: i * xStep,
        y: height - ((temp - minTemp) / tempRange) * height,
        value: temp
      };
    });

    ctx.beginPath();
    this.drawMonotonicSpline(ctx, points);
    ctx.lineTo(points[points.length-1].x, height);
    ctx.lineTo(points[0].x, height);
    ctx.closePath();

    const gradient = ctx.createLinearGradient(0, 0, 0, height);
    const isRgba = statusColor.startsWith('rgba');
    if (isRgba) {
      gradient.addColorStop(0, statusColor);
      gradient.addColorStop(1, statusColor);
    } else {
      gradient.addColorStop(0, `${statusColor}60`);
      gradient.addColorStop(1, `${statusColor}20`);
    }
    ctx.fillStyle = gradient;
    ctx.fill();

    ctx.beginPath();
    this.drawMonotonicSpline(ctx, points);
    ctx.strokeStyle = isRgba ? statusColor : statusColor;
    ctx.lineWidth = 1;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 5;
    ctx.shadowOffsetY = 2;
    ctx.stroke();
  }

  _gaussianSmooth(data, windowSize = 5) {
    if (!data || data.length === 0) return [];
    if (windowSize < 1) return [...data];
    const kernel = this._createGaussianKernel(windowSize);
    const halfWindow = Math.floor(windowSize / 2);
    const result = new Array(data.length);
    for (let i = 0; i < data.length; i++) {
      let sum = 0;
      let weightSum = 0;
      const start = Math.max(0, i - halfWindow);
      const end = Math.min(data.length - 1, i + halfWindow);
      for (let j = start, k = start - (i - halfWindow); j <= end; j++, k++) {
        const weight = kernel[k];
        sum += data[j] * weight;
        weightSum += weight;
      }
      result[i] = sum / weightSum;
    }
    return result;
  }

  _createGaussianKernel(size) {
    if (!this._gaussianKernelCache) {
      this._gaussianKernelCache = new Map();
    }
    if (this._gaussianKernelCache.has(size)) {
      return this._gaussianKernelCache.get(size);
    }
    const kernel = new Array(size);
    const sigma = size / 3;
    const center = Math.floor(size / 2);
    let sum = 0;
    for (let i = 0; i <= center; i++) {
      const x = i - center;
      const value = Math.exp(-(x * x) / (2 * sigma * sigma));
      kernel[center + x] = value;
      kernel[center - x] = value;
      sum += (i === center - x) ? value : value * 2;
    }
    const normalized = kernel.map(v => v / sum);
    this._gaussianKernelCache.set(size, normalized);
    return normalized;
  }

  drawMonotonicSpline(ctx, points) {
    if (points.length < 2) return;
    ctx.moveTo(points[0].x, points[0].y);
    const slopes = this.calculateMonotonicSlopes(points);
    for (let i = 0; i < points.length - 1; i++) {
      const p0 = points[i];
      const p1 = points[i+1];
      const m0 = slopes[i];
      const m1 = slopes[i+1];
      const dx = (p1.x - p0.x) / 3;
      const cp1 = { x: p0.x + dx, y: p0.y + m0 * dx };
      const cp2 = { x: p1.x - dx, y: p1.y - m1 * dx };
      ctx.bezierCurveTo(cp1.x, cp1.y, cp2.x, cp2.y, p1.x, p1.y);
    }
  }

  calculateMonotonicSlopes(points) {
    const slopes = new Array(points.length);
    for (let i = 1; i < points.length - 1; i++) {
      const prev = points[i-1];
      const curr = points[i];
      const next = points[i+1];
      const h1 = curr.x - prev.x;
      const h2 = next.x - curr.x;
      const s1 = (curr.y - prev.y) / h1;
      const s2 = (next.y - curr.y) / h2;
      if (s1 * s2 <= 0) {
        slopes[i] = 0;
      } else {
        slopes[i] = 3 * h1 * h2 / ((h1 + h2) * (h1/s2 + h2/s1));
      }
    }
    slopes[0] = (points[1].y - points[0].y) / (points[1].x - points[0].x);
    slopes[points.length-1] = (points[points.length-1].y - points[points.length-2].y) / (points[points.length-1].x - points[points.length-2].x);
    return slopes;
  }

  _renderTimerControls(timerEntity) {
    if (!timerEntity) return html``;
    const activeColor = 'rgb(0, 188, 213)';

    const now = new Date();
    const finishesAt = new Date(timerEntity.attributes.finishes_at || 0);
    let remainingSeconds = Math.max(0, Math.floor((finishesAt - now) / 1000));

    const state = timerEntity.state;
    if (state === 'active' && remainingSeconds <= 0) {
      this._turnOffFan();
      this._cancelTimer();
      remainingSeconds = 0;
    } else if (state !== 'active') {
      // 定时器结束（idle）且上次是active，关闭风扇
      if (this._timerWasActive) {
        this._turnOffFan();
        this._timerWasActive = false;
      }
      remainingSeconds = 0;
    } else {
      this._timerWasActive = true;
    }

    const remainingTime = this._formatSeconds(remainingSeconds);
    const displayColor = remainingSeconds > 0 ? activeColor : 'var(--button-fg)';

    return html`
      <button class="timer-button" @click=${this._cancelTimer}>取消</button>
      <button class="timer-button" @click=${() => this._adjustTimer(-1, remainingSeconds)}>-</button>
      <div class="timer-display" style="color: ${displayColor}">${remainingTime}</div>
      <button class="timer-button" @click=${() => this._adjustTimer(1, remainingSeconds)}>+</button>
      <button class="timer-button" @click=${() => this._setTimer(60 * 60)}>1h</button>
      <button class="timer-button" @click=${() => this._setTimer(3 * 60 * 60)}>3h</button>
      <button class="timer-button" @click=${() => this._setTimer(8 * 60 * 60)}>8h</button>
    `;
  }

  _formatSeconds(totalSeconds) {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }

  _adjustTimer(direction, currentSeconds) {
    this._handleClick();
    if (!this.config.timer) return;
    const currentMinutes = Math.ceil(currentSeconds / 60);
    let newSeconds = 0;
    if (direction === -1) {
      if (currentMinutes > 30) {
        newSeconds = currentSeconds - (30 * 60);
      } else if (currentMinutes > 10) {
        newSeconds = currentSeconds - (10 * 60);
      } else {
        this._cancelTimer();
        return;
      }
    } else {
      if (currentSeconds === 0) {
        newSeconds = 10 * 60;
      } else if (currentMinutes < 30) {
        newSeconds = currentSeconds + (10 * 60);
      } else if (currentMinutes < 180) {
        newSeconds = currentSeconds + (30 * 60);
      } else {
        newSeconds = currentSeconds + (60 * 60);
      }
    }
    this._setTimer(newSeconds);
  }

  _cancelTimer() {
    this._handleClick();
    if (!this.config.timer) return;
    this._callService('timer', 'cancel', { entity_id: this.config.timer });
  }

  _setTimer(totalSeconds) {
    this._handleClick();
    if (!this.config.timer) return;
    if (this._getEntityState(this.config.timer)?.state === 'active') {
      this._callService('timer', 'cancel', { entity_id: this.config.timer });
    }
    this._callService('timer', 'start', {
      entity_id: this.config.timer,
      duration: this._formatSeconds(totalSeconds)
    });
  }

  _turnOffFan() {
    if (!this.config.entity) return;
    this._callService('fan', 'turn_off', { entity_id: this.config.entity });
  }

  _renderExtraButtons(buttonType = 1) {
    const buttonArray = buttonType === 1 ? this.buttons : this.buttons2;
    if (!buttonArray || buttonArray.length === 0) return html``;

    const buttonsToShow = buttonArray.slice(0, 7);
    const entity = this._getEntityState(this.config.entity);
    if (!entity) return html``;

    const state = entity.state || 'off';
    const theme = this._evaluateTheme();
    const fgColor = theme === 'light' ? 'rgb(0, 0, 0)' : 'rgb(255, 255, 255)';
    const isOn = state === 'on';
    let activeColor = theme === 'light' ? 'rgba(00, 80, 80)' : 'rgba(180, 230, 230)';
    if (isOn) activeColor = 'rgb(0, 188, 213)';

    return buttonsToShow.map(buttonEntityId => {
      const btnEntity = this._getEntityState(buttonEntityId);
      if (!btnEntity) return html``;

      const domain = buttonEntityId.split('.')[0];
      const friendlyName = btnEntity.attributes.friendly_name || '';
      const displayName = friendlyName.slice(0, 4);
      let displayValue = btnEntity.state.slice(0, 4);
      const displayValueColor = displayValue === '低' ? 'red' : fgColor;

      switch(domain) {
        case 'switch':
        case 'light':
          const isActive = btnEntity.state === 'on';
          const icon = isActive ? 'mdi:toggle-switch' : 'mdi:toggle-switch-off';
          const buttonColor = isActive ? activeColor : fgColor;
          return html`
            <button
              class="extra-button ${isActive ? 'active-extra' : ''}"
              @click=${() => this._handleExtraButtonClick(buttonEntityId, domain)}
              style="color: ${buttonColor}"
              title="${friendlyName}"
            >
              <div class="extra-button-content">
                <ha-icon class="extra-button-icon" icon="${icon}" style="color: ${buttonColor}"></ha-icon>
                <div class="extra-button-text" style="color: ${buttonColor}">${displayName}</div>
              </div>
            </button>
          `;

        case 'sensor':
          const unit = btnEntity.attributes.unit_of_measurement || '';
          displayValue = `${btnEntity.state}${unit}`.slice(0, 4);
          return html`
            <div class="extra-button" style="color: ${fgColor}; cursor: default;">
              <div class="extra-button-content">
                <div class="extra-button-value" style="color: ${displayValueColor}">${displayValue}</div>
                <div class="extra-button-text">${displayName}</div>
              </div>
            </div>
          `;

        case 'button':
          const buttonIcon = 'mdi:button-pointer';
          return html`
            <button class="extra-button"
              @click=${() => this._handleExtraButtonClick(buttonEntityId, domain)}
              style="color: ${fgColor}">
              <div class="extra-button-content">
                <ha-icon class="extra-button-icon" icon="${buttonIcon}" style="--mdc-icon-size: 14px; color: ${fgColor}"></ha-icon>
                <div class="extra-button-text">${displayName}</div>
              </div>
            </button>
          `;

        case 'select':
          if (!displayValue || displayValue.length > 4) {
            const options = btnEntity.attributes.options || [];
            const firstOption = options[0] || '';
            displayValue = firstOption.slice(0, 4);
          }
          return html`
            <div class="extra-button"
              @click=${() => this._handleExtraButtonClick(buttonEntityId, domain)}
              style="color: ${fgColor}; cursor: default;">
              <div class="extra-button-content">
                <div class="extra-button-value">${displayValue}</div>
                <div class="extra-button-text">${displayName}</div>
              </div>
            </div>
          `;

        default:
          return html``;
      }
    });
  }

  _handleExtraButtonClick(entityId, domain) {
    const entity = this._getEntityState(entityId);
    if (!entity) return;
    switch(domain) {
      case 'switch':
      case 'light':
        const service = entity.state === 'on' ? 'turn_off' : 'turn_on';
        this._callService(domain, service, { entity_id: entityId });
        break;
      case 'button':
        this._callService('button', 'press', { entity_id: entityId });
        break;
      case 'select':
        this._callService('select', 'select_next', { entity_id: entityId });
        break;
    }
    this._handleClick();
  }

  _handleClick() {
    const hapticEvent = new Event('haptic', {
      bubbles: true,
      cancelable: false,
      composed: true
    });
    hapticEvent.detail = 'light';
    this.dispatchEvent(hapticEvent);
  }
}
customElements.define('xiaoshi-phone-fan-card', XiaoshiPhoneFanCard);
