import { LitElement, html, css } from "https://unpkg.com/lit-element@2.4.0/lit-element.js?module";

window.customCards = window.customCards || [];
window.customCards.push({
    type: 'xiaoshi-pad-fan-card',
    name: '消逝卡(A平板端)-循环扇卡',
    description: '平板端循环扇卡',
    preview: true
});

class XiaoshiPadFanCardEditor extends LitElement {
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
    ];

    const normalFanEntitySelectors = [
      { key: 'entity', label: '风扇实体fan', filter: 'fan.' },
      { key: 'fan_mode', label: '风扇模式select', filter: 'select.' },
      { key: 'temperature', label: '温度传感器sensor', filter: 'sensor.' },
      { key: 'humidity', label: '湿度传感器sensor', filter: 'sensor.' },
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
            <option value="function">跟随函数</option>
            <option value="light">浅色主题（白底黑字）</option>
            <option value="dark">深色主题（黑底白字）</option>
          </select>
        </div>

        <div class="form-group">
          <label>卡片主体宽度</label>
          <input
            type="text"
            @change=${this._widthChanged}
            .value=${this.config.width !== undefined ? this.config.width : '300px'}
            placeholder="默认300px"
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

        <div class="form-group">
          <label>启用定时器</label>
          <input type="checkbox" ?checked=${this.config.enable_timer !== false} @change=${(e) => { this.config = { ...this.config, enable_timer: e.target.checked }; this._fireEvent(); }} />
        </div>

        <!-- 附加按钮位置 -->
        ${(this.config.buttons && this.config.buttons.length > 0) ? html`
          <div style="display: flex; align-items: center; gap: 8px;">
            <label style="font-weight: bold; font-size: 10px;">附加按钮位置</label>
            <select
              @change=${this._buttonPositionChanged}
              .value=${this.config.button_position !== undefined ? this.config.button_position : 'left'}
              name="button_position"
              style="padding: 4px; font-size: 11px; border: 1px solid #ddd; border-radius: 4px;"
            >
              <option value="left">左</option>
              <option value="right">右</option>
            </select>
          </div>
        ` : ''}

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

        <!-- 附加按钮2位置 -->
        ${(this.config.buttons2 && this.config.buttons2.length > 0) ? html`
          <div style="display: flex; align-items: center; gap: 8px;">
            <label style="font-weight: bold; font-size: 10px;">附加按钮(第2排)位置</label>
            <select
              @change=${this._button2PositionChanged}
              .value=${this.config.button2_position !== undefined ? this.config.button2_position : 'left'}
              name="button2_position"
              style="padding: 4px; font-size: 11px; border: 1px solid #ddd; border-radius: 4px;"
            >
              <option value="left">左</option>
              <option value="right">右</option>
            </select>
          </div>
        ` : ''}

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

  _buttonPositionChanged(e) {
    if (!this.config) return;
    const buttonPosition = e.target.value;
    this.config = { ...this.config, button_position: buttonPosition };
    this._fireEvent();
  }

  _button2PositionChanged(e) {
    if (!this.config) return;
    const button2Position = e.target.value;
    this.config = { ...this.config, button2_position: button2Position };
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
customElements.define('xiaoshi-pad-fan-card-editor', XiaoshiPadFanCardEditor);

class XiaoshiPadFanCard extends LitElement {
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
    return document.createElement("xiaoshi-pad-fan-card-editor");
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
        display: flex;
        align-items: stretch;
        gap: 8px;
      }

      .main-card {
        display: block;
        position: relative;
        background-color: var(--bg-color);
        border-radius: 15px;
        width: var(--card-width, 300px);
        max-width: var(--card-width, 300px);
      }

      .side-button-wrapper {
        display: flex;
      }

      .side-button-bar {
        width: 60px;
        display: flex;
        flex-direction: column;
        justify-content: flex-end;
        border-radius: 15px;
      }

      .fan-card {
        position: relative;
        width: var(--card-width, 300px);
        max-width: var(--card-width, 300px);
        display: flex;
        flex-direction: column;
        overflow: hidden;
      }

      .direction-container {
        flex: none;
        width: var(--card-width, 300px);
        padding-top: 45px;
        height: 220px;
        position: relative;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .direction-overlay-bg {
        padding-top: 45px;
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        pointer-events: none;
        z-index: 0;
        border-radius: 15px 15px 0 0;
      }

      .theme-light {
        --ha-card-background: rgb(255,255,255,0);
        --primary-text-color:rgb(0,0,0);
        --disabled-color: rgb(150,150,150);
        --_icon-color: rgb(0,0,0);
        --secondary-text-color: rgb(0,0,0);
        --area-bg: rgb(230,230,230);
      }
      .theme-dark {
        --ha-card-background: rgb(50,50,50,0);
        --primary-text-color:rgb(255,255,255);
        --disabled-color: rgb(220,220,220);
        --_icon-color: rgb(255,255,255);
        --secondary-text-color: rgb(255,255,255);
        --area-bg: rgb(80,80,80);
      }

      .modes-area, .fanspeed-area, .oscillatev-area, .oscillateh-area {
        display: flex;
        flex-wrap: nowrap;
        gap: 2px;
        overflow: hidden;
      }

      .mode-button {
        flex: 1;
        min-width: 0;
        height: 40px;
        border: none;
        border-radius: 10px;
        background: rgb(0,0,0,0);
        cursor: pointer;
        padding: 0;
        margin: 0;
        display: flex;
        align-items: center;
        justify-content: center;
        flex-direction: column;
        gap: 2px;
        --mdc-icon-size: 20px;
      }

      .mode-button .icon {
        width: 20px;
        height: 20px;
        color: var(--fg-color);
      }

      .mode-button .mode-text {
        font-size: 10px;
        color: var(--fg-color);
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      .mode-button.active-mode {
        background: var(--active-color);
      }

      .switch-button {
        flex: 1;
        min-width: 0;
        height: 40px;
        border: none;
        border-radius: 10px;
        background: rgb(0,0,0,0);
        cursor: pointer;
        padding: 0;
        margin: 0;
        display: flex;
        align-items: center;
        justify-content: center;
        flex-direction: column;
        gap: 2px;
        --mdc-icon-size: 20px;
      }

      .switch-button .icon {
        width: 20px;
        height: 20px;
        color: var(--fg-color);
      }

      .switch-button .mode-text {
        font-size: 10px;
        color: var(--fg-color);
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      .switch-button.active-mode {
        background: var(--active-color);
      }

      .switch-button-row {
        flex: none;
        width: 25%;
        min-width: 0;
        height: 40px;
        border: none;
        border-radius: 10px;
        background: rgb(0,0,0,0);
        cursor: pointer;
        padding: 0 4px;
        margin: 0;
        display: flex;
        align-items: center;
        justify-content: center;
        flex-direction: row;
        gap: 2px;
        --mdc-icon-size: 18px;
      }

      .switch-button-row .icon {
        width: 18px;
        height: 18px;
        color: var(--fg-color);
        flex-shrink: 0;
      }

      .switch-button-row .mode-text {
        font-size: 10px;
        color: var(--fg-color);
        line-height: 1.2;
        text-align: center;
        word-break: break-all;
        overflow: hidden;
      }

      .switch-button-row.active-mode {
        background: var(--active-color);
      }

      .angle-button {
        flex: none;
        width: 14%;
        min-width: 0;
        height: 40px;
        border: none;
        border-radius: 10px;
        background: rgb(0,0,0,0);
        cursor: pointer;
        padding: 0;
        margin: 0;
        display: flex;
        align-items: center;
        justify-content: center;
        flex-direction: column;
        gap: 2px;
      }

      .angle-button .mode-text {
        font-size: 10px;
        color: var(--fg-color);
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      .angle-button.active-mode {
        background: var(--active-color);
      }

      .area-bg-wrapper {
        background: var(--area-bg);
        border-radius: 10px;
        width: calc(100% - 20px);
        margin: 0 10px;
        margin-bottom: 8px;
        box-sizing: border-box;
      }

      .area-bg-wrapper:first-of-type {
        margin-top: 4px;
      }

      .side-extra-button {
        width: 40px;
        height: 40px;
        border: none;
        border-radius: 8px;
        background: var(--bg-color);
        cursor: pointer;
        padding: 0px;
        margin: 0px 10px;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        margin-bottom: 8px;
      }

      .side-extra-button.active-extra {
      }

      .side-extra-button .side-icon {
        width: 16px;
        height: 16px;
        --mdc-icon-size: 16px;
      }

      .side-extra-button .side-text {
        font-size: 10px;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      .timer-horizontal-area {
        display: flex;
        flex-direction: row;
        align-items: center;
        justify-content: center;
        gap: 6px;
        padding: 0px 4px;
      }

      .timer-h-btn {
        height: 40px;
        min-width: 24px;
        border: none;
        border-radius: 8px;
        cursor: pointer;
        padding: 0 6px;
        display: flex;
        flex-direction: row;
        align-items: center;
        justify-content: center;
        gap: 2px;
      }

      .timer-h-icon {
        width: 16px;
        height: 16px;
        --mdc-icon-size: 16px;
      }

      .timer-h-text {
        font-size: 11px;
        white-space: nowrap;
      }

      /* 风速数值显示按钮 */
      .speed-display-btn {
        display: flex;
        align-items: center;
        gap: 4px;
        background: rgb(0,0,0,0);
        border: none;
        border-radius: 10px;
        padding: 0;
        cursor: default;
        min-width: 0;
        height: 40px;
        justify-content: center;
        flex-direction: column;
      }

      .speed-percent {
        font-size: 10px;
        font-weight: bold;
        color: var(--active-color);
      }

      /* 内联滑块样式 */
      .sun-slider-container {
        position: relative;
        width: 100%;
        height: 40px;
        display: flex;
        align-items: center;
        box-sizing: border-box;
      }

      .sun-slider-track {
        position: absolute;
        top: 50%;
        left: 0;
        width: 100%;
        transform: translateY(-50%);
        height: 40px;
        border-radius: 10px;
        overflow: visible;
        cursor: default;
        touch-action: none;
      }

      .sun-slider-bar {
        position: absolute;
        top: 0;
        left: 0;
        height: 100%;
        border-radius: 10px;
        pointer-events: none;
      }

      .sun-slider-thumb {
        position: absolute;
        top: 50%;
        transform: translate(-50%, -50%);
        width: 24px;
        height: 24px;
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
        max-width: 180px;
        max-height: 180px;
      }

      .dir-bg {
        position: absolute;
        width: 100%;
        height: 100%;
        border-radius: 50%;
        background: var(--area-bg);
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
        color: var(--fg-color);
      }

      /* 方向按钮位置 */
      .dir-btn.up { top: 12%; left: 50%; transform: translate(-50%, -50%); }
      .dir-btn.down { bottom: 12%; left: 50%; transform: translate(-50%, 50%); }
      .dir-btn.left { left: 12%; top: 50%; transform: translate(-50%, -50%); }
      .dir-btn.right { right: 12%; top: 50%; transform: translate(50%, -50%); }

      .dir-btn.center {
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        width: 45px;
        height: 45px;
        border-radius: 50%;
        background: var(--secondary-bg);
        z-index: 20;
        pointer-events: auto;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 0;
      }

      .dir-btn.center:active {
        background: var(--theme-bg-active, rgba(16, 202, 248, 0.9));
        transform: translate(-50%, -50%) scale(0.95);
      }

      .dir-btn.center ha-icon {
        --mdc-icon-size: 16px;
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

      /* 状态信息覆盖在方向盘上 */
      .direction-overlay {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 8px 10px;
        z-index: 30;
        box-sizing: border-box;
      }

      .overlay-spacer {
        width: 30px;
        flex-shrink: 0;
      }

      .status-bar {
        display: flex;
        justify-content: space-around;
        align-items: center;
        padding: 8px;
        font-size: 11px;
        white-space: nowrap;
        flex-shrink: 0;
      }

      .status-item {
        flex: 1;
        text-align: center;
        overflow: hidden;
        text-overflow: ellipsis;
        min-width: 0;
      }

      .status-name {
        flex: 1;
        text-align: center;
        font-size: 16px;
        font-weight: bold;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
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
    this._timerPollInterval = null;
    this._timerRemaining = 0;
    this._xiaoshiTimerDeadline = null;
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
    const ratio = displayValue / 100;
    const calcPos = `calc(12px + (100% - 24px) * ${ratio})`;

    return html`
      <div class="sun-slider-container">
        <div
          class="sun-slider-track"
          style="background: ${trackColor};"
          @click=${(e) => this._onSliderTrackClick(e, speedLevelEntity, fanEntity)}
        >
          <div class="sun-slider-bar" style="width: ${calcPos}; background: ${sliderColor};"></div>
          <div class="sun-slider-thumb" style="left: ${calcPos};" @pointerdown=${(e) => this._onSliderPointerDown(e, speedLevelEntity, fanEntity)}></div>
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
    const availableWidth = rect.width - 24;
    const ratio = Math.max(0, Math.min(1, (x - 12) / availableWidth));
    const value = Math.round(ratio * 100);
    this._localSliderValue = value;
    this._tempSpeedPct = value;

    // 拖拽期间直接更新DOM，避免频繁全量重渲染
    const calcPos = `calc(12px + (100% - 24px) * ${value / 100})`;
    const bar = track.querySelector('.sun-slider-bar');
    const thumb = track.querySelector('.sun-slider-thumb');
    if (bar) bar.style.width = calcPos;
    if (thumb) thumb.style.left = calcPos;

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

  _showMoreInfo() {
    if (!this.config.entity) return;
    const event = new CustomEvent('hass-more-info', {
      bubbles: true,
      composed: true,
      detail: { entityId: this.config.entity }
    });
    this.dispatchEvent(event);
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
    const themeClass = theme === 'light' ? 'theme-light' : 'theme-dark';
    const fgColor = theme === 'light' ? 'rgb(0, 0, 0)' : 'rgb(255, 255, 255)';
    const bgColor = theme === 'light' ? 'rgb(255, 255, 255)' : 'rgb(50, 50, 50)';
    const activeColor = 'rgb(0, 188, 213)';

    // 开启时径向渐变背景
    const overlayGradient = isOn ? `radial-gradient(circle at center, rgba(0,188,213,0.95) 0%, rgba(0,188,213,0) 65%)` : '';

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

    // 普通风扇模式列表
    const presetModes = attrs.preset_modes || [];
    const hasPresetModes = presetModes.length > 0;
    const normalModes = presetModes.map(m => ({
      value: m,
      label: m,
      icon: 'mdi:fan',
    }));

    // 普通风扇档位
    const percentageStep = attrs.percentage_step || 33.333333333333336;
    const isSteplessSpeed = percentageStep === 1;
    const hasPercentageStep = !isSteplessSpeed && Math.abs(percentageStep - 33.333333333333336) < 1;
    const currentPct = (() => {
      if (this.config.speed_level) {
        const slEntity = this._getEntityState(this.config.speed_level);
        if (slEntity && slEntity.state !== 'unavailable' && slEntity.state !== 'unknown') {
          return parseInt(slEntity.state) || 0;
        }
      }
      return attrs.percentage || 0;
    })();
    const normalSpeedLevels = [
      { value: Math.round(percentageStep), label: '1档', icon: 'mdi:fan-speed-1' },
      { value: Math.round(percentageStep * 2), label: '2档', icon: 'mdi:fan-speed-2' },
      { value: 100, label: '3档', icon: 'mdi:fan-speed-3' },
    ];

    // 风速档位
    const fanSpeedLevels = [
      { value: 1, label: '1档', icon: 'mdi:fan-speed-1', min: 1, max: 34 },
      { value: 35, label: '2档', icon: 'mdi:fan-speed-2', min: 35, max: 69 },
      { value: 70, label: '3档', icon: 'mdi:fan-speed-3', min: 70, max: 99 },
      { value: 100, label: '4档', icon: 'mdi:fan-auto', min: 100, max: 100 },
    ];

    // 左右摆风角度
    const oscillateAngles = [30, 60, 90, 120, 150];

    // 上下摆风角度
    const verticalAngles = [30, 60, 90];

    // 定时器和附加按钮
    const hasTimer = this.config.enable_timer !== false;
    const hasButtons = this.buttons && this.buttons.length > 0;
    const hasButtons2 = this.buttons2 && this.buttons2.length > 0;
    const buttonPosition = this.config.button_position || 'left';
    const button2Position = this.config.button2_position || 'left';

    // 普通风扇模式select
    const hasFanModeSelect = isNormalFan && this.config.fan_mode;
    const fanModeEntity = hasFanModeSelect ? this._getEntityState(this.config.fan_mode) : null;
    const fanModeOptions = fanModeEntity?.attributes?.options || [];
    const fanModeCurrent = fanModeEntity?.state || '';

    // 计算模式区域数量
    let activeModeCount = 0;
    if (isNormalFan) {
      if (hasPresetModes) activeModeCount++;
      if (isSteplessSpeed || hasPercentageStep) activeModeCount++;
      if (hasFanModeSelect && fanModeOptions.length > 0) activeModeCount++;
    } else {
      activeModeCount++; // 模式区域
      activeModeCount++; // 风速区域
      activeModeCount++; // 上下摆风
      activeModeCount++; // 左右摆风
    }
    if (hasTimer) activeModeCount++;

    const cardHeight = 300 + (activeModeCount * 48);

    const cardWidth = this.config.width || '300px';
    const secondaryBg = theme === 'light' ? 'rgb(150, 150, 150)' : 'rgb(100, 100, 100)';

    return html`
        ${hasButtons2 && button2Position === 'left' ? html`
          <div class="side-button-wrapper">
            <div class="side-button-bar side-button-bar-left" style="background-color: ${bgColor}; height: ${cardHeight}px;">
              ${this._renderExtraButtons(2)}
            </div>
          </div>
        ` : ''}

        ${hasButtons && buttonPosition === 'left' ? html`
          <div class="side-button-wrapper">
            <div class="side-button-bar side-button-bar-left" style="background-color: ${bgColor}; height: ${cardHeight}px;">
              ${this._renderExtraButtons(1)}
            </div>
          </div>
        ` : ''}

        <div class="main-card" style="--bg-color: ${bgColor}; --fg-color: ${fgColor}; --card-width: ${cardWidth}; --active-color: ${activeColor}; --secondary-bg: ${secondaryBg};">
          <div class="fan-card ${themeClass}" style="height: ${cardHeight}px;">
            <div class="direction-container">
              ${overlayGradient ? html`<div class="direction-overlay-bg" style="background: ${overlayGradient};"></div>` : ''}
              ${isNormalFan ? html`
                <div class="normal-fan-icon-container">
                  <ha-icon icon="mdi:fan" class="${isOn ? 'fan-spinning' : ''}" style="--mdc-icon-size: 120px; color: ${isOn ? activeColor : secondaryBg};"></ha-icon>
                </div>
              ` : html`
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
              `}
              <div class="direction-overlay">
                <span class="overlay-spacer"></span>
                <span class="status-name" style="color: ${fgColor}">${attrs.friendly_name || (isNormalFan ? '风扇' : '循环扇')}</span>
                <button class="power-button" @click=${this._showMoreInfo}>
                  <ha-icon
                    icon="mdi:dots-vertical"
                    style="color: ${fgColor}; --mdc-icon-size: 22px;"
                  ></ha-icon>
                </button>
              </div>
            </div>

            <div class="status-bar" style="color: ${fgColor};">
              <span class="status-item">风速：${currentPct > 0 ? currentPct + '%' : '-'}</span>
              ${this.config.temperature ? html`<span class="status-item">温度：${temperature !== '-' ? temperature + '°C' : '-'}</span>` : ''}
              ${this.config.humidity ? html`<span class="status-item">湿度：${humidity !== '-' ? humidity + '%' : '-'}</span>` : ''}
            </div>

            ${isNormalFan ? html`
              ${hasPresetModes ? html`
                <div class="area-bg-wrapper">
                    <div class="modes-area">
                      ${normalModes.map(m => html`
                        <button
                          class="mode-button ${presetMode === m.value ? 'active-mode' : ''}"
                          @click=${() => this._setPresetMode(m.value)}
                          style="${presetMode === m.value ? `--active-color: ${activeColor}; background: ${activeColor}` : ''}"
                        >
                          <ha-icon class="icon" icon="${m.icon}" style="${presetMode === m.value ? 'color: rgb(255,255,255)' : ''}"></ha-icon>
                          <span class="mode-text" style="${presetMode === m.value ? 'color: rgb(255,255,255)' : ''}">${m.label}</span>
                        </button>
                      `)}
                      ${this.config.show_oscillate !== false ? html`
                        <button
                          class="mode-button ${attrs.oscillating ? 'active-mode' : ''}"
                          @click=${this._toggleOscillate}
                          style="${attrs.oscillating ? `--active-color: ${activeColor}; background: ${activeColor}` : ''}"
                        >
                          <ha-icon class="icon" icon="mdi:rotate-3d-variant" style="${attrs.oscillating ? 'color: rgb(255,255,255)' : ''}"></ha-icon>
                          <span class="mode-text" style="${attrs.oscillating ? 'color: rgb(255,255,255)' : ''}">摇头</span>
                        </button>
                      ` : ''}
                      <button
                        class="mode-button ${isOn ? 'active-mode' : ''}"
                        @click=${this._toggleFan}
                        style="${isOn ? `--active-color: ${activeColor}; background: ${activeColor}` : ''}"
                      >
                      <ha-icon class="icon" icon="mdi:power" style="${isOn ? 'color: rgb(255,255,255)' : `color: ${fgColor}`}"></ha-icon>
                      <span class="mode-text" style="${isOn ? 'color: rgb(255,255,255)' : ''}">${isOn ? '关闭' : '开启'}</span>
                    </button>
                    </div>
                </div>
              ` : ''}

              ${isSteplessSpeed ? html`
                <div class="area-bg-wrapper">
                    <div class="fanspeed-area">
                      ${this._renderSunSlider(currentPct, activeColor, secondaryBg, null, this.config.entity)}
                    </div>
                </div>
              ` : ''}

              ${hasPresetModes && hasPercentageStep ? html`
                <div class="area-bg-wrapper">
                    <div class="fanspeed-area">
                      ${normalSpeedLevels.map((level, idx) => {
                        let isActive = false;
                        if (idx === 0 && currentPct > 0 && currentPct <= level.value) isActive = true;
                        else if (idx > 0 && currentPct > normalSpeedLevels[idx - 1].value && currentPct <= level.value) isActive = true;
                        else if (idx === normalSpeedLevels.length - 1 && currentPct === 100) isActive = true;
                        return html`
                          <button
                            class="mode-button ${isActive ? 'active-mode' : ''}"
                            @click=${() => this._setFanSpeed(level.value)}
                            style="${isActive ? `--active-color: ${activeColor}; background: ${activeColor}` : ''}"
                          >
                            <ha-icon class="icon" icon="${level.icon}" style="${isActive ? 'color: rgb(255,255,255)' : ''}"></ha-icon>
                            <span class="mode-text" style="${isActive ? 'color: rgb(255,255,255)' : ''}">${level.label}</span>
                          </button>
                        `;
                      })}
                    </div>
                </div>
              ` : ''}

              ${hasFanModeSelect && fanModeOptions.length > 0 ? html`
                <div class="area-bg-wrapper">
                    <div class="modes-area">
                      ${fanModeOptions.map(opt => html`
                        <button
                          class="mode-button ${fanModeCurrent === opt ? 'active-mode' : ''}"
                          @click=${() => this._setFanModeSelect(opt)}
                          style="${fanModeCurrent === opt ? `--active-color: ${activeColor}; background: ${activeColor}` : ''}"
                        >
                          <ha-icon class="icon" icon="mdi:fan" style="${fanModeCurrent === opt ? 'color: rgb(255,255,255)' : ''}"></ha-icon>
                          <span class="mode-text" style="${fanModeCurrent === opt ? 'color: rgb(255,255,255)' : ''}">${opt}</span>
                        </button>
                      `)}
                    </div>
                </div>
              ` : ''}
            ` : html`
              <!-- 循环扇模式区域 -->
              <div class="area-bg-wrapper">
                  <div class="modes-area">
                    ${modes.map(m => html`
                      <button
                        class="mode-button ${presetMode === m.value ? 'active-mode' : ''}"
                        @click=${() => this._setPresetMode(m.value)}
                        style="${presetMode === m.value ? `--active-color: ${activeColor}; background: ${activeColor}` : ''}"
                      >
                        <ha-icon class="icon" icon="${m.icon}" style="${presetMode === m.value ? 'color: rgb(255,255,255)' : ''}"></ha-icon>
                        <span class="mode-text" style="${presetMode === m.value ? 'color: rgb(255,255,255)' : ''}">${m.label}</span>
                      </button>
                    `)}
                    <button
                      class="mode-button ${isOn ? 'active-mode' : ''}"
                      @click=${this._toggleFan}
                      style="${isOn ? `--active-color: ${activeColor}; background: ${activeColor}` : ''}"
                    >
                      <ha-icon class="icon" icon="mdi:power" style="${isOn ? 'color: rgb(255,255,255)' : `color: ${fgColor}`}"></ha-icon>
                      <span class="mode-text" style="${isOn ? 'color: rgb(255,255,255)' : ''}">${isOn ? '关闭' : '开启'}</span>
                    </button>
                  </div>
              </div>

              <!-- 循环扇风速区域 -->
              <div class="area-bg-wrapper">
                  <div class="fanspeed-area">
                    ${presetMode === '自然风' ? html`
                      ${this.config.speed_level ? fanSpeedLevels.map(fs => html`
                        <button
                          class="mode-button ${currentPct >= fs.min && currentPct <= fs.max ? 'active-mode' : ''}"
                          @click=${() => this._setSpeedLevel(fs.value)}
                          style="${currentPct >= fs.min && currentPct <= fs.max ? `--active-color: ${activeColor}; background: ${activeColor}` : ''}"
                        >
                          <ha-icon class="icon" icon="${fs.icon}" style="${currentPct >= fs.min && currentPct <= fs.max ? 'color: rgb(255,255,255)' : ''}"></ha-icon>
                          <span class="mode-text" style="${currentPct >= fs.min && currentPct <= fs.max ? 'color: rgb(255,255,255)' : ''}">${fs.label}</span>
                        </button>
                      `) : html`
                        ${this._renderSunSlider(currentPct, activeColor, secondaryBg, this.config.speed_level, this.config.entity)}
                      `}
                    ` : html`
                      ${this._renderSunSlider(currentPct, activeColor, secondaryBg, this.config.speed_level, this.config.entity)}
                    `}
                  </div>
              </div>

              <!-- 循环扇上下摆风区域 -->
              <div class="area-bg-wrapper">
                  <div class="oscillatev-area">
                    <button
                      class="switch-button-row ${verticalSwingOn ? 'active-mode' : ''}"
                      @click=${this._toggleVerticalSwing}
                      style="${verticalSwingOn ? `--active-color: ${activeColor}; background: ${activeColor}` : ''}"
                    >
                      <ha-icon class="icon" icon="mdi:arrow-up-down" style="${verticalSwingOn ? 'color: rgb(255,255,255)' : ''}"></ha-icon>
                      <span class="mode-text" style="${verticalSwingOn ? 'color: rgb(255,255,255)' : ''}">上下<br>摆风</span>
                    </button>
                    ${verticalAngles.map(angle => html`
                      <button
                        class="angle-button ${verticalAngle === angle.toString() ? 'active-mode' : ''}"
                        @click=${() => this._selectVerticalAngle(angle)}
                        style="${verticalAngle === angle.toString() ? `--active-color: ${activeColor}; background: ${activeColor}` : ''}"
                      >
                        <span class="mode-text" style="${verticalAngle === angle.toString() ? 'color: rgb(255,255,255)' : ''}">${angle}°</span>
                      </button>
                    `)}
                    <button
                      class="switch-button-row ${cycleSwingOn ? 'active-mode' : ''}"
                      @click=${this._toggleCycleSwing}
                      style="${cycleSwingOn ? `--active-color: ${activeColor}; background: ${activeColor};` : ''} margin-left: auto;"
                    >
                      <ha-icon class="icon" icon="mdi:arrow-all" style="${cycleSwingOn ? 'color: rgb(255,255,255)' : ''}"></ha-icon>
                      <span class="mode-text" style="${cycleSwingOn ? 'color: rgb(255,255,255)' : ''}">循环<br>摆风</span>
                    </button>
                  </div>
              </div>

              <!-- 循环扇左右摆风区域 -->
              <div class="area-bg-wrapper">
                  <div class="oscillateh-area">
                    <button
                      class="switch-button-row ${attrs.oscillating ? 'active-mode' : ''}"
                      @click=${this._toggleOscillate}
                      style="${attrs.oscillating ? `--active-color: ${activeColor}; background: ${activeColor}` : ''}"
                    >
                      <ha-icon class="icon" icon="mdi:arrow-oscillating" style="${attrs.oscillating ? 'color: rgb(255,255,255)' : ''}"></ha-icon>
                      <span class="mode-text" style="${attrs.oscillating ? 'color: rgb(255,255,255)' : ''}">左右<br>摆风</span>
                    </button>
                    ${oscillateAngles.map(angle => html`
                      <button
                        class="angle-button ${oscillateAngle === angle.toString() ? 'active-mode' : ''}"
                        @click=${() => this._selectOscillateAngle(angle)}
                        style="${oscillateAngle === angle.toString() ? `--active-color: ${activeColor}; background: ${activeColor}` : ''}"
                      >
                        <span class="mode-text" style="${oscillateAngle === angle.toString() ? 'color: rgb(255,255,255)' : ''}">${angle}°</span>
                      </button>
                    `)}
                  </div>
              </div>
            `}

            ${hasTimer ? html`
                <div class="area-bg-wrapper">
                    <div class="timer-horizontal-area">
                        ${this._renderTimerButton()}
                    </div>
                </div>
            ` : ''}
          </div>
        </div>

        ${hasButtons && buttonPosition === 'right' ? html`
          <div class="side-button-wrapper">
            <div class="side-button-bar side-button-bar-right" style="background-color: ${bgColor}; height: ${cardHeight}px;">
              ${this._renderExtraButtons(1)}
            </div>
          </div>
        ` : ''}

        ${hasButtons2 && button2Position === 'right' ? html`
          <div class="side-button-wrapper">
            <div class="side-button-bar side-button-bar-right" style="background-color: ${bgColor}; height: ${cardHeight}px;">
              ${this._renderExtraButtons(2)}
            </div>
          </div>
        ` : ''}
    `;
  }

  connectedCallback() {
    super.connectedCallback();
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    if (this._timerInterval) {
      clearInterval(this._timerInterval);
      this._timerInterval = null;
    }
    if (this._timerPollInterval) {
      clearInterval(this._timerPollInterval);
      this._timerPollInterval = null;
    }
  }

  async firstUpdated() {
    super.firstUpdated();
    await this._fetchDataAndRenderChart();
    this._startTimerRefresh();
  }

  _startTimerRefresh() {
    if (this._timerInterval) clearInterval(this._timerInterval);
    // 立即获取一次最新状态
    if (this.config.enable_timer !== false) {
      this._fetchXiaoshiTimer();
    }
    this._timerInterval = setInterval(() => {
      if (this.config.enable_timer !== false) {
        if (this._xiaoshiTimerDeadline) {
          const remaining = Math.max(0, Math.floor((new Date(this._xiaoshiTimerDeadline) - new Date()) / 1000));
          if (remaining !== this._timerRemaining) {
            this._timerRemaining = remaining;
            if (remaining <= 0) {
              this._xiaoshiTimerDeadline = null;
            }
          }
        }
        this.requestUpdate();
      }
    }, 1000);
    if (this._timerPollInterval) clearInterval(this._timerPollInterval);
    this._timerPollInterval = setInterval(() => {
      if (this.config.enable_timer !== false) {
        this._fetchXiaoshiTimer();
      }
    }, 5000);
  }

  async updated(changedProperties) {
    super.updated(changedProperties);
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

  _renderTimerButton() {
    if (this.config.enable_timer === false) return html``;

    let remainingSeconds = this._timerRemaining || 0;

    const hours = Math.floor(remainingSeconds / 3600);
    const minutes = Math.floor((remainingSeconds % 3600) / 60);

    const theme = this._evaluateTheme();
    const fgColor = theme === 'light' ? 'rgb(0, 0, 0)' : 'rgb(255, 255, 255)';
    const bgColor = theme === 'light' ? 'rgb(230, 230, 230)' : 'rgb(80, 80, 80)';

    const activeColor = 'rgb(0, 188, 213)';

    return html`
      <button class="timer-h-btn" style="cursor: pointer; background: ${bgColor};" @click=${this._cancelTimer}>
        <span class="timer-h-text" style="color: ${fgColor}">取消</span>
      </button>
      <button class="timer-h-btn" style="cursor: pointer; background: ${bgColor};" @click=${() => this._adjustTimer(-1, remainingSeconds)}>
        <ha-icon class="timer-h-icon" icon="mdi:minus" style="color: ${fgColor}"></ha-icon>
      </button>
      <button class="timer-h-btn timer-h-active" style="cursor: default; background: ${remainingSeconds > 0 ? activeColor : bgColor};min-width:60px">
        <span class="timer-h-text" style="color: ${fgColor}; font-weight: bold;">${remainingSeconds === 0 ? '无定时' : (hours > 0 ? hours + '时' + minutes + '分' : minutes + '分' + (remainingSeconds % 60) + '秒')}</span>
      </button>
      <button class="timer-h-btn" style="cursor: pointer; background: ${bgColor};" @click=${() => this._adjustTimer(1, remainingSeconds)}>
        <ha-icon class="timer-h-icon" icon="mdi:plus" style="color: ${fgColor}"></ha-icon>
      </button>
      <button class="timer-h-btn" style="cursor: pointer; background: ${bgColor};" @click=${() => this._setTimer(60 * 60)}>
        <span class="timer-h-text" style="color: ${fgColor}">1时</span>
      </button>
      <button class="timer-h-btn" style="cursor: pointer; background: ${bgColor};" @click=${() => this._setTimer(3 * 60 * 60)}>
        <span class="timer-h-text" style="color: ${fgColor}">3时</span>
      </button>
      <button class="timer-h-btn" style="cursor: pointer; background: ${bgColor};" @click=${() => this._setTimer(8 * 60 * 60)}>
        <span class="timer-h-text" style="color: ${fgColor}">8时</span>
      </button>
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
    if (this.config.enable_timer === false) return;
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
    if (this.config.enable_timer === false) return;
    this._deleteXiaoshiTimer();
  }

  _setTimer(totalSeconds) {
    this._handleClick();
    if (this.config.enable_timer === false) return;
    this._createXiaoshiTimer(totalSeconds);
  }

  async _fetchXiaoshiTimer() {
    if (!this.hass || this.config.enable_timer === false || !this.config.entity) return;
    try {
      const data = await this.hass.callApi(
        'GET',
        `xiaoshi/timer?entity_id=${encodeURIComponent(this.config.entity)}`
      );
      if (data && data.remaining > 0) {
        this._xiaoshiTimerDeadline = data.deadline;
        this._timerRemaining = data.remaining;
      } else {
        this._xiaoshiTimerDeadline = null;
        this._timerRemaining = 0;
      }
    } catch (e) {
      this._xiaoshiTimerDeadline = null;
      this._timerRemaining = 0;
    }
    this.requestUpdate();
  }

  async _createXiaoshiTimer(seconds) {
    if (!this.hass || !this.config.entity) return;
    try {
      const entityId = this.config.entity;
      const serviceDomain = entityId.split('.')[0];
      const data = await this.hass.callApi(
        'POST',
        'xiaoshi/timer',
        {
          entity_id: entityId,
          service_domain: serviceDomain,
          service_name: 'turn_off',
          countdown: seconds
        }
      );
      this._xiaoshiTimerDeadline = data.deadline;
      this._timerRemaining = seconds;
    } catch (e) {
      console.error('Failed to create timer:', e);
    }
    this.requestUpdate();
  }

  async _deleteXiaoshiTimer() {
    if (!this.hass || !this.config.entity) return;
    try {
      await this.hass.callApi(
        'DELETE',
        `xiaoshi/timer?entity_id=${encodeURIComponent(this.config.entity)}`
      );
    } catch (e) {
      console.error('Failed to delete timer:', e);
    }
    this._xiaoshiTimerDeadline = null;
    this._timerRemaining = 0;
    this.requestUpdate();
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
    const bgColor = theme === 'light' ? 'rgb(230, 230, 230)' : 'rgb(80, 80, 80)';
    const isOn = state === 'on';
    let activeColor = 'rgb(0, 188, 213)';

    // 根据名称自定义图标
    const _getCustomIcon = (name, isActive) => {
        if (name.includes('辅热')) return 'mdi:heating-coil';
        if (name.includes('干燥')) return 'mdi:heat-wave';
        if (name.includes('节能')) return isActive ? 'mdi:leaf' : 'mdi:leaf-off';
        if (name.includes('睡眠')) return isActive ? 'mdi:sleep' : 'mdi:sleep-off';
        if (name.includes('指示灯')) return isActive ? 'mdi:lightbulb-on' : 'mdi:lightbulb-off';
        if (name.includes('提示音')) return isActive ? 'mdi:volume-high' : 'mdi:volume-mute';
        if (name.includes('防冻')) return isActive ? 'mdi:snowflake' : 'mdi:snowflake-off';
        if (name.includes('防烫伤')) return isActive ? 'mdi:fire' : 'mdi:fire-off';
        if (name.includes('按键锁')) return isActive ? 'mdi:lock-open' : 'mdi:lock-open-variant';
        if (name.includes('童锁')) return isActive ? 'mdi:lock' : 'mdi:lock-open-variant';
        if (name.includes('摆风')) return isActive ? 'mdi:rotate-3d-variant' : 'mdi:rotate-3d-variant';
        if (name.includes('摇头')) return isActive ? 'mdi:rotate-3d-variant' : 'mdi:rotate-3d-variant';
        if (name.includes('定时')) return 'mdi:timer-outline';
        if (name.includes('风速')) return 'mdi:fan';
        if (name.includes('回正')) return 'mdi:crosshairs';
        return null;
    };

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
          const customIcon = _getCustomIcon(friendlyName, isActive);
          const icon = customIcon ? customIcon : (isActive ? 'mdi:toggle-switch' : 'mdi:toggle-switch-off');
          const buttonColor = isActive ? activeColor : fgColor;
          return html`
            <button
              class="side-extra-button ${isActive ? 'active-extra' : ''}"
              @click=${() => this._handleExtraButtonClick(buttonEntityId, domain)}
              style="--active-color: ${buttonColor}; --bg-color: ${bgColor};"
              title="${friendlyName}"
            >
              <ha-icon class="side-icon" icon="${icon}" style="color: ${buttonColor}"></ha-icon>
              <span class="side-text" style="color: ${buttonColor}">${displayName}</span>
            </button>
          `;

        case 'sensor':
          const unit = btnEntity.attributes.unit_of_measurement || '';
          displayValue = `${btnEntity.state}${unit}`.slice(0, 4);
          return html`
            <div class="side-extra-button" style="cursor: default; --bg-color: ${bgColor};">
              <div class="side-value" style="color: ${displayValueColor}; font-size: 11px; font-weight: bold; white-space: nowrap">${displayValue}</div>
              <span class="side-text" style="color: ${fgColor};">${displayName}</span>
            </div>
          `;

        case 'button':
          const buttonIcon = 'mdi:button-pointer';
          return html`
            <button class="side-extra-button"
              @click=${() => this._handleExtraButtonClick(buttonEntityId, domain)}
              style="color: ${fgColor}; --bg-color: ${bgColor};">
              <ha-icon class="side-icon" icon="${buttonIcon}" style="color: ${fgColor}"></ha-icon>
              <span class="side-text" style="color: ${fgColor};">${displayName}</span>
            </button>
          `;

        case 'select':
          if (!displayValue || displayValue.length > 4) {
            const options = btnEntity.attributes.options || [];
            const firstOption = options[0] || '';
            displayValue = firstOption.slice(0, 4);
          }
          return html`
            <div class="side-extra-button"
              @click=${() => this._handleExtraButtonClick(buttonEntityId, domain)}
              style="cursor: default; --bg-color: ${bgColor};">
              <div class="side-value" style="color: ${fgColor}; font-size: 11px; font-weight: bold; white-space: nowrap">${displayValue}</div>
              <span class="side-text" style="color: ${fgColor};">${displayName}</span>
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
customElements.define('xiaoshi-pad-fan-card', XiaoshiPadFanCard);
