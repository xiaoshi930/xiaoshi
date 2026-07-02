const whenDefined = (t) => customElements.whenDefined(t);
await Promise.race([whenDefined("ha-card"), whenDefined("ha-panel-lovelace")]);
const LitElement = window.LitElement || Object.getPrototypeOf(customElements.get("ha-card"));
const html = LitElement.prototype.html;
const css = LitElement.prototype.css;

window.customCards = window.customCards || [];
window.customCards.push({
    type: 'xiaoshi-phone-humidifier-card',
    name: '消逝卡(B移动端)-加湿器/除湿机卡',
    description: '移动端加湿器/除湿机卡',
    preview: true
});

class XiaoshiPhoneHumidifierCardEditor extends LitElement {
  static get properties() {
    return {
      hass: { type: Object },
      config: { type: Object },
      _searchTerm: { type: String },
      _filteredEntities: { type: Array },
      _showEntityList: { type: Boolean },
      _selectSearchTerm: { type: String },
      _filteredSelectEntities: { type: Array },
      _showSelectList: { type: Boolean },
      _buttonSearchTerms: { type: Object },
      _filteredButtonEntities: { type: Object },
      _showButtonLists: { type: Object }
    };
  }

  setConfig(config) {
    this.config = config || {};
  }

  async firstUpdated() {
    // 点击外部关闭下拉列表
    document.addEventListener('click', (e) => {
      if (!e.target.closest('.entity-selector')) {
        this._showEntityList = false;
        this._showSelectList = false;

        // 关闭所有按钮的下拉列表
        if (this._showButtonLists) {
          Object.keys(this._showButtonLists).forEach(key => {
            this._showButtonLists[key] = false;
          });
        }

        this.requestUpdate();
      }
    });

    await this._setDefaultClimateEntity();
  }

  async _setDefaultClimateEntity() {
    if (!this.hass || !this.config) return;
    if (this.config?.entity) return;
    const entities = Object.keys(this.hass.states).filter(
      eid => eid.startsWith('humidifier.')
    );

    if (entities.length > 0) {
      this.config = {
        ...(this.config || {}),
        entity: entities[0]
      };
      this._fireEvent();
    }
  }

  _isDehumidifier(entityId) {
    const entity = this.hass.states[entityId];
    return entity?.attributes?.device_class === 'dehumidifier';
  }

  _onMainEntitySearch(e) {
    const searchTerm = e.target.value.toLowerCase();
    this._searchTerm = searchTerm;
    this._showEntityList = true;

    if (!this.hass) return;

    // 获取所有实体
    const allEntities = Object.values(this.hass.states);

    // 过滤实体，只显示 humidifier 开头的实体
    this._filteredEntities = allEntities.filter(entity => {
      const entityId = entity.entity_id.toLowerCase();
      const friendlyName = (entity.attributes.friendly_name || '').toLowerCase();

      // 只显示 humidifier. 开头的实体（兼容加湿器和除湿机）
      const isHumidifierEntity = entityId.startsWith('humidifier.');
      const matchesSearch = entityId.includes(searchTerm) || friendlyName.includes(searchTerm);

      return isHumidifierEntity && matchesSearch;
    }).slice(0, 50);

    this.requestUpdate();
  }

  _selectMainEntity(entityId) {
    this.config = {
      ...this.config,
      entity: entityId
    };

    this._searchTerm = '';
    this._showEntityList = false;

    this._fireEvent();
    this.requestUpdate();
  }

  _onSelectSearch(e) {
    const searchTerm = e.target.value.toLowerCase();
    this._selectSearchTerm = searchTerm;
    this._showSelectList = true;

    if (!this.hass) return;

    const allEntities = Object.values(this.hass.states);

    // 过滤实体，只显示 select 开头的实体
    this._filteredSelectEntities = allEntities.filter(entity => {
      const entityId = entity.entity_id.toLowerCase();
      const friendlyName = (entity.attributes.friendly_name || '').toLowerCase();

      const isSelectEntity = entityId.startsWith('select.');
      const matchesSearch = entityId.includes(searchTerm) || friendlyName.includes(searchTerm);

      return isSelectEntity && matchesSearch;
    }).slice(0, 50);

    this.requestUpdate();
  }

  _selectSelect(entityId) {
    this.config = {
      ...this.config,
      select: entityId
    };

    this._selectSearchTerm = '';
    this._showSelectList = false;

    this._fireEvent();
    this.requestUpdate();
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

      // 支持多种实体类型
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

    this.config = {
      ...this.config,
      buttons
    };

    if (!this._buttonSearchTerms) this._buttonSearchTerms = {};
    if (!this._showButtonLists) this._showButtonLists = {};

    this._buttonSearchTerms[index] = '';
    this._showButtonLists[index] = false;

    this._fireEvent();
    this.requestUpdate();
  }

  static get styles() {
    return css`      .card-config { padding: 16px; }
      .row { margin-bottom: 16px; }
      .label { margin-bottom: 8px; font-weight: bold; }
      .buttons-row { display: flex; align-items: center; margin-top: 8px; }
      .add-button { margin-left: 8px; }
      .entity-selector { position: relative; }
      .entity-search-input { width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px; box-sizing: border-box; }
      .entity-dropdown { position: absolute; top: 100%; left: 0; right: 0; height: 300px; overflow-y: auto; background: white; border: 1px solid #ddd; border-radius: 4px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); z-index: 1000; margin-top: 2px; }
      .entity-option { display: flex; align-items: center; justify-content: space-between; padding: 8px 12px; cursor: pointer; border-bottom: 1px solid #eee; }
      .entity-option:hover { background: #f5f5f5; }
      .entity-option.selected { background: #e3f2fd; }
      .entity-info { display: flex; align-items: center; gap: 8px; flex: 1; }
      .entity-details { flex: 1; }
      .entity-name { font-weight: 500; font-size: 14px; color: #000; }
      .entity-id { font-size: 12px; color: #000; font-family: monospace; }
      .check-icon { color: #4CAF50; }
      .no-results { padding: 12px; text-align: center; color: #666; font-style: italic; }
      .entity-selector-with-remove { display: flex; align-items: flex-start; gap: 8px; margin-bottom: 8px; }
      .entity-selector-with-remove .entity-selector { flex: 1; }
      .remove-button { background: #f44336; color: white; border: none; border-radius: 4px; width: 30px; height: 30px; min-width: 30px; padding: 0; display: flex; align-items: center; justify-content: center; cursor: pointer; flex-shrink: 0; margin-top: 0; }
      .remove-button:hover { background: #d32f2f; }
      .remove-button ha-icon { --mdc-icon-size: 20px; }
      .hint { font-size: 0.85em; color: #888; margin-top: 4px; }`;
  }

  render() {
    if (!this.hass || !this.config) return html``;;

    return html`
      <div class="card-config">
        <!-- 主实体选择 -->
        <div class="row">
          <div class="label">加湿器/除湿机实体 (必选)</div>
          <div class="entity-selector">
            <input
              type="text"
              @input=${this._onMainEntitySearch}
              @focus=${this._onMainEntitySearch}
              .value=${this._searchTerm || this.config?.entity || ''}
              placeholder="搜索加湿器/除湿机实体..."
              class="entity-search-input"
            />
            ${this._showEntityList ? html`
              <div class="entity-dropdown">
                ${this._filteredEntities.map(entity => html`
                  <div
                    class="entity-option ${this.config?.entity === entity.entity_id ? 'selected' : ''}"
                    @click=${() => this._selectMainEntity(entity.entity_id)}
                  >
                    <div class="entity-info">
                      <ha-icon icon="${entity.attributes.icon || 'mdi:help-circle'}"></ha-icon>
                      <div class="entity-details">
                        <div class="entity-name">${entity.attributes.friendly_name || entity.entity_id}</div>
                        <div class="entity-id">${entity.entity_id}</div>
                      </div>
                    </div>
                    ${this.config?.entity === entity.entity_id ?
                      html`<ha-icon icon="mdi:check" class="check-icon"></ha-icon>` : ''}
                  </div>
                `)}
                ${this._filteredEntities.length === 0 ? html`
                  <div class="no-results">未找到匹配的实体</div>
                ` : ''}
              </div>
            ` : ''}
          </div>
          ${!this.config?.entity ? html`
            <div class="hint">正在加载可用加湿器/除湿机...</div>
          ` : ''}
        </div>

        <!-- 风机档位传感器 -->
        <div class="row">
          <div class="label">风机档位传感器 (必选)</div>
          <div class="entity-selector">
            <input
              type="text"
              @input=${this._onSelectSearch}
              @focus=${this._onSelectSearch}
              .value=${this._selectSearchTerm || this.config.select || ''}
              placeholder="搜索风机档位传感器..."
              class="entity-search-input"
            />
            ${this._showSelectList ? html`
              <div class="entity-dropdown">
                ${this._filteredSelectEntities.map(entity => html`
                  <div
                    class="entity-option ${this.config.select === entity.entity_id ? 'selected' : ''}"
                    @click=${() => this._selectSelect(entity.entity_id)}
                  >
                    <div class="entity-info">
                      <ha-icon icon="${entity.attributes.icon || 'mdi:help-circle'}"></ha-icon>
                      <div class="entity-details">
                        <div class="entity-name">${entity.attributes.friendly_name || entity.entity_id}</div>
                        <div class="entity-id">${entity.entity_id}</div>
                      </div>
                    </div>
                    ${this.config.select === entity.entity_id ?
                      html`<ha-icon icon="mdi:check" class="check-icon"></ha-icon>` : ''}
                  </div>
                `)}
                ${this._filteredSelectEntities.length === 0 ? html`
                  <div class="no-results">未找到匹配的实体</div>
                ` : ''}
              </div>
            ` : ''}
          </div>
        </div>

        <!-- 启用定时器 -->
        <div class="row">
          <div class="label">启用定时器</div>
          <input type="checkbox" ?checked=${this.config.enable_timer !== false} @change=${(e) => { this.config = { ...this.config, enable_timer: e.target.checked }; this._fireEvent(); }} />
        </div>

        <!-- 主题选择 -->
        <div class="row">
          <div class="label">主题模式</div>
          <select
            .value=${this.config.theme || 'system'}
            @change=${this._themeSelectChanged}
            style="margin-left: 8px; padding: 4px 8px; border-radius: 4px; border: 1px solid var(--primary-color); background: var(--secondary-background-color); color: var(--primary-text-color);"
          >
            <option value="system" ?selected=${!this.config.theme || this.config.theme === 'system'}>跟随系统(system)</option>
            <option value="light" ?selected=${this.config.theme === 'light'}>亮色(light)</option>
            <option value="dark" ?selected=${this.config.theme === 'dark'}>暗色(dark)</option>
          </select>
        </div>

        <!-- 附加按钮 -->
        <div class="row">
          <div class="label">附加按钮 (最多7个)</div>
          ${(this.config.buttons || []).map((button, index) => html`
            <div class="entity-selector-with-remove">
              <div class="entity-selector">
                <input
                  type="text"
                  @input=${(e) => this._onButtonSearch(e, index)}
                  @focus=${(e) => this._onButtonSearch(e, index)}
                  .value=${this._buttonSearchTerms?.[index] || button || ''}
                  placeholder="搜索按钮实体..."
                  class="entity-search-input"
                />
                ${this._showButtonLists?.[index] ? html`
                  <div class="entity-dropdown">
                    ${(this._filteredButtonEntities?.[index] || []).map(entity => html`
                      <div
                        class="entity-option ${this.config.buttons?.[index] === entity.entity_id ? 'selected' : ''}"
                        @click=${() => this._selectButton(entity.entity_id, index)}
                      >
                        <div class="entity-info">
                          <ha-icon icon="${entity.attributes.icon || 'mdi:help-circle'}"></ha-icon>
                          <div class="entity-details">
                            <div class="entity-name">${entity.attributes.friendly_name || entity.entity_id}</div>
                            <div class="entity-id">${entity.entity_id}</div>
                          </div>
                        </div>
                        ${this.config.buttons?.[index] === entity.entity_id ?
                          html`<ha-icon icon="mdi:check" class="check-icon"></ha-icon>` : ''}
                      </div>
                    `)}
                    ${(this._filteredButtonEntities?.[index] || []).length === 0 ? html`
                      <div class="no-results">未找到匹配的实体</div>
                    ` : ''}
                  </div>
                ` : ''}
              </div>
              <button class="remove-button" @click=${() => this._removeButton(index)} title="移除按钮">
                <ha-icon icon="mdi:close"></ha-icon>
              </button>
            </div>
          `)}
          ${(!this.config.buttons || this.config.buttons.length < 7) ? html`
            <div class="buttons-row">
              <mwc-button
                class="add-button"
                @click=${this._addButton}
                outlined
              >
                添加按钮
              </mwc-button>
            </div>
          ` : ''}
        </div>

        <!-- 宽度设置 -->
        <div class="row">
          <div class="label">卡片宽度</div>
          <ha-textfield
            .label="宽度 (例如: 100%, 300px)"
            .value=${this.config.width || '100%'}
            @input=${this._widthChanged}
          ></ha-textfield>
        </div>
      </div>
    `;
  }

	_addButton() {
		const buttons = [...(this.config.buttons || [])];
		if (buttons.length >= 7) return;
		buttons.push('');

		this.config = {
			...this.config,
			buttons
		};
		this._fireEvent();
	}

  _removeButton(index) {
    const buttons = [...(this.config.buttons || [])];
    buttons.splice(index, 1);

    this.config = {
      ...this.config,
      buttons: buttons.length > 0 ? buttons : undefined
    };
    this._fireEvent();
  }

  _themeSelectChanged(ev) {
    if (!this.config) return;
    const theme = ev.target.value;
    
    this.config = { 
      ...this.config,
      theme 
    };
    this._fireEvent();
  }

  _widthChanged(ev) {
    if (!this.config) return;
    const width = ev.target.value;
    
    this.config = { 
      ...this.config,
      width 
    };
    this._fireEvent();
  }

  _fireEvent() {
    this.dispatchEvent(new CustomEvent('config-changed', {
      detail: { config: this.config }
    }));
  }
}
customElements.define('xiaoshi-phone-humidifier-card-editor', XiaoshiPhoneHumidifierCardEditor);

class XiaoshiPhoneHumidifierCard extends LitElement {
  static get properties() { 
    return {
      hass: { type: Object },
      width: { type: String, attribute: true },
      config: { type: Object },
      buttons: { type: Array },
      theme: { type: String },
      _timerInterval: { state: true },
      humidifierData: { type: Array },
      _externalHumidifierSensor: { type: String },
      _fanModeSelectEntity: { type: String },
      _showHistory: { type: Boolean, state: true },
      _historyData: { type: Object, state: true },
      _historyLoading: { type: Boolean, state: true }
    };
  }
  static getConfigElement() {
    return document.createElement("xiaoshi-phone-humidifier-card-editor");
  }

  static getStubConfig() {
    return {
      entity: "",
      timer: "",
      theme: "system",
      buttons: [],
      width: "100%"
    };
  }

  setConfig(config) {
    this.config = config;
    this.buttons = config.buttons || [];
    if (config.width !== undefined) this.width = config.width;
    this._fanModeSelectEntity = config.select || '';
    this.requestUpdate();
  }
  
  static get styles() { 
    return css`      :host { display: block; contain: content; max-width: 500px; margin: 0 auto; }
      .card { position: relative; border-radius: 12px; overflow: hidden; box-sizing: border-box; }
      .content-container { position: relative; z-index: 1; height: 100%; display: grid; grid-template-areas: "name name status power" "icon dangwei fan fan" "icon dangwei timer timer" "icon dangwei extra extra" "a a a a"; grid-template-columns: 16% 22% 50% 10%; grid-template-rows: auto auto auto auto 4px; }
      .content-container.has-available-modes { grid-template-areas: "name status power" "icon fan fan" "icon timer timer" "icon extra extra" "a a a"; grid-template-columns: 25% 60% 13%; }
      .active-gradient { position: absolute; top: 0; left: 0; width: 100%; height: 100%; background: linear-gradient(90deg, var(--linear-color), transparent 50%); opacity: 0.8; z-index: 0; }
      .history-btn { position: absolute; bottom: 4px; left: 4px; z-index: 10; width: 24px; height: 24px; border-radius: 8px; display: flex; align-items: center; justify-content: center; cursor: default; transition: all 0.3s ease; background: transparent; }
      .history-btn:hover { opacity: 0.85; transform: scale(1.05); }
      #chart-container { position: absolute; bottom: 0; left: 0; width: 100%; height: 20%; overflow: hidden; z-index: 0; pointer-events: none; }
      .name-area { grid-area: name; display: flex; align-items: center; font-size: 16px; font-weight: bold; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; margin-left: 10px; font-weight: bold; }
      .status-area { grid-area: status; display: flex; align-items: center; font-size: 12px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; margin-left: 5px; gap: 1px; font-weight: bold; }
      .humidifier-adjust-container { display: inline-flex; align-items: center; gap: 1px; }
      .humidifier-adjust-button { background: none; border: none; cursor: pointer; padding: 0; display: flex; align-items: center; justify-content: center; color: var(--button);; width: 24px; height: 24px; border-radius: 5px; cursor: default; }
      .humidifier-display { font-size: 12px; min-width: 24px; text-align: center; color: var(--button);; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
      .humidifier-fan { font-size: 12px; text-align: center; min-width:25px; color: var(--button);; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
      .current-humidifier { font-size: 12px; margin-left: 5px; }
      .power-area { grid-area: power; display: flex; justify-content: flex-end; align-items: center; }
      .power-button { background: none; border: none; cursor: pointer; padding: 0; display: flex; align-items: center; justify-content: flex-end; width: 100%; height: 35px; border-radius: 5px; cursor: default; }
      .power-icon { --mdc-icon-size: 30px; transition: all 0.3s ease; }
      .icon { --mdc-icon-size: 16px; }
      .icon-area { grid-area: icon; display: flex; flex-direction: column; align-items: center; justify-content: space-between; height: 100%; }
      .main-icon-container { flex: 1; display: flex; align-items: center; justify-content: center; width: 100%; }
      .main-icon { --mdc-icon-size: 40px; margin-top: -3px; transition: transform 0.5s ease; }
      .main-icon.has-available-modes { --mdc-icon-size: 50px; }
      .active-main-icon { animation: spin var(--fan-speed, 2s) linear infinite; color: var(--active-color); }
      @keyframes spin {
        from { transform: rotate(0deg); }
        to { transform: rotate(360deg); }
      }
       .fan-area, .timer-area, .extra-area { display: flex; gap: 5px; width: 100%; height: 25px; margin-bottom: 5px; }
      .fan-area { grid-area: fan; overflow-x: auto; scrollbar-width: none; }
      .fan-area::-webkit-scrollbar { display: none; }
      .available-area { grid-area: available; overflow-x: auto; scrollbar-width: none; }
      .available-area::-webkit-scrollbar { display: none; }
      .available-button { display: flex; align-items: center; justify-content: center; width: 100%; }
      .available-text { font-size: 10px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
      .timer-area { grid-area: timer; display: grid; grid-template-columns: repeat(8, 1fr); gap: 5px; }
      .timer-button { display: flex; align-items: center; justify-content: center; background-color: var(--button-bg); color: var(--button-fg); border: none; border-radius: 8px; cursor: pointer; font-size: 10px; min-width: 0; overflow: hidden; padding: 0 2px; cursor: default; }
      .timer-display { grid-column: span 2; display: flex; align-items: center; justify-content: center; background-color: var(--button-bg); color: var(--button-fg); border-radius: 8px; font-size: 10px; font-weight: bold; font-family: monospace; }
      .extra-area { grid-area: extra; display: grid; gap: 5px; }
      .extra-button { display: flex; flex-direction: column; align-items: center; justify-content: center; background-color: rgb(0,0,0,0); color: var(--button); border: none; cursor: pointer; min-width: 0; overflow: visible; cursor: default; height: 100%; padding: 0; }
      .extra-button-content { display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%; line-height: 1; cursor: default; }
      .extra-button-icon { --mdc-icon-size: 27px; height: 24px; display: flex; align-items: center; justify-content: center; margin-bottom: -4px; cursor: default; }
      .extra-button-value { height: 24px; display: flex; align-items: center; justify-content: center; margin-bottom: -4px; font-size: 11px; font-weight: bold; line-height: 1.5; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 100%; cursor: default; }
      .extra-button-text { font-size: 10px; line-height: 1.2; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 100%; height: auto; cursor: default; }
      .mode-button { background-color: var(--button-bg); color: var(--button-fg); border: none; border-radius: 8px; cursor: pointer; display: flex; flex-direction: column; align-items: center; justify-content: center; flex: 1; min-width: 0; position: relative; cursor: default; }
      .fan-button { position: relative; width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; }
      .fan-button-icon { --mdc-icon-size: 16px; width: 16px; height: 16px; display: flex; justify-content: center; align-items: center; transform-origin: center; }
      .active-fan-button-icon { animation: spin var(--fan-speed, 2s) linear infinite; color: var(--active-color); }
      .fan-text { position: absolute; font-size: 8px; font-weight: bold; bottom: 0px; right: 0px; border-radius: 4px; height: 8px; display: flex; align-items: center; justify-content: center; line-height: 1; padding: 1px 2px; background-color: var(--button-bg); }
      .active-mode { background-color: var(--active-color) !important; color: var(--active-text-color, white) !important; }
      .active-extra { background-color: transparent !important; color: var(--active-color) !important; }`;
  }

  constructor() {
    super();
    this.hass = {};
    this.config = {};
    this.buttons = [];
    this.theme = 'system';
    this.width = '100%';
    this._timerInterval = null;
    this._timerRemaining = 0;
    this._xiaoshiTimerDeadline = null;
    this.humidifierData = [];
    this.canvas = null;
    this.ctx = null;
    this._showHistory = false;
    this._historyData = {};
    this._historyLoading = false;
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

  async firstUpdated() {
      await this._fetchDataAndRenderChart();
  }
  
  async updated(changedProperties) {
      if (changedProperties.has('hass') || changedProperties.has('config')) {
          await this._fetchDataAndRenderChart();
      }
  }

  async _fetchDataAndRenderChart() {
      if (!this.hass || !this.config) return;

      const now = new Date();
      const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      const entityId = this._externalHumidifierSensor || this.config.entity;
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
              const value = isSensor ? entry.s : entry.a?.current_humidity;
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
      
      this.humidifierData = this._gaussianSmooth(sampledData, 3);
      await this.initCanvas();
      this.drawSmoothCurve();
  }

  async initCanvas() {
    const container = this.shadowRoot.querySelector('#chart-container');
    if (!container) return;
    
    // 清除现有画布
    while (container.firstChild) {
        container.removeChild(container.firstChild);
    }
    
    // 创建新画布
    this.canvas = document.createElement('canvas');
    this.canvas.className = 'humidifier-chart';
    container.appendChild(this.canvas);
    
    // 设置画布尺寸（正确处理高DPI）
    const scale = window.devicePixelRatio || 1;
    const width = container.clientWidth;
    const height = container.clientHeight;
    
    // 设置CSS尺寸（显示尺寸）
    this.canvas.style.width = `${width}px`;
    this.canvas.style.height = `${height}px`;
    
    // 设置绘图表面尺寸（实际像素）
    this.canvas.width = Math.floor(width * scale);
    this.canvas.height = Math.floor(height * scale);
    
    // 获取上下文并设置缩放
    this.ctx = this.canvas.getContext('2d');
    this.ctx.scale(scale, scale);
    
    // 确保DOM更新完成
    await this.updateComplete;
  }

  drawSmoothCurve() {
    if (!this.ctx || !this.humidifierData || this.humidifierData.length === 0) return;
    
    const entity = this.hass.states[this.config.entity];
    const state = entity?.state || 'off';
    const theme = this._evaluateTheme();
    const isDehumidifier = entity?.attributes?.device_class === 'dehumidifier';
    
    // 确定颜色
    let statusColor = theme === 'light' ? '#2ba0f3' : '#2ba0f3';
    if (state === 'on') statusColor = isDehumidifier ? '#f39c12' : '#2ba0f3';
    
    // 获取画布尺寸（CSS像素）
    const canvas = this.canvas;
    const ctx = this.ctx;
    const scale = window.devicePixelRatio || 1;
    const width = canvas.width / scale;
    const height = canvas.height / scale;
    
    // 清除画布（使用物理像素尺寸）
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // 计算温度范围
    const minHumidifier = Math.min(...this.humidifierData) - 1;
    const maxHumidifier = Math.max(...this.humidifierData);
    const humidifierRange = Math.max(maxHumidifier - minHumidifier, 0.1);
    const xStep = width / (this.humidifierData.length - 1);
    
    // 创建点集
    const points = this.humidifierData.map((humidifier, i) => {
        return {
            x: i * xStep,
            y: height - ((humidifier - minHumidifier) / humidifierRange) * height,
            value: humidifier
        };
    });
    
    // 绘制填充区域
    ctx.beginPath();
    this.drawMonotonicSpline(ctx, points);
    ctx.lineTo(points[points.length-1].x, height);
    ctx.lineTo(points[0].x, height);
    ctx.closePath();
    
    // 创建渐变填充
    const gradient = ctx.createLinearGradient(0, 0, 0, height);
    gradient.addColorStop(0, `${statusColor}60`);
    gradient.addColorStop(1, `${statusColor}20`);
    ctx.fillStyle = gradient;
    ctx.fill();
    
    // 绘制曲线
    ctx.beginPath();
    this.drawMonotonicSpline(ctx, points);
    ctx.strokeStyle = statusColor;
    ctx.lineWidth = 1; // 线宽不需要乘以scale，因为上下文已经缩放
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
      const cp1 = {
        x: p0.x + dx,
        y: p0.y + m0 * dx
      };
      const cp2 = {
        x: p1.x - dx,
        y: p1.y - m1 * dx
      };
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
        slopes[i] = 3 * h1 * h2 / ( (h1 + h2) * (h1/s2 + h2/s1) );
      }
    }
    slopes[0] = (points[1].y - points[0].y) / (points[1].x - points[0].x);
    slopes[points.length-1] = (points[points.length-1].y - points[points.length-2].y) / (points[points.length-1].x - points[points.length-2].x);
    return slopes;
  }

  render() {
    if (!this.hass || !this.config || !this.config.entity) {
        return html``;
    }

    const entity = this.hass.states[this.config.entity];
    if (!entity) {
        return html`<div>实体未找到: ${this.config.entity}</div>`;
    }
    const state = entity.state;
    const isOn = state !== 'off' && state !== 'unavailable' && state !== 'unknown';

    const attrs = entity.attributes;
    const isDehumidifier = attrs.device_class === 'dehumidifier';
    const humidity =  typeof attrs.current_humidity === 'number'  ? `${attrs.humidity.toFixed(0)}%`  : '';
    
    let current_humidity = '';
    if (this._externalHumidifierSensor) {
      const humidifierEntity = this.hass.states[this._externalHumidifierSensor];
      if (humidifierEntity && !isNaN(parseFloat(humidifierEntity.state))) {
        current_humidity = `${isDehumidifier ? '当前' : '室内'}: ${parseFloat(humidifierEntity.state).toFixed(0)}%`;
      }
    } else if (typeof entity.attributes.current_humidity === 'number') {
      current_humidity = `${isDehumidifier ? '当前' : '室内'}: ${entity.attributes.current_humidity.toFixed(0)}%`;
    }
    
    
    const theme = this._evaluateTheme();
    const fgColor = theme === 'light' ? 'rgb(0, 0, 0)' : 'rgb(255, 255, 255)';
    const bgColor = theme === 'light' ? 'rgb(255, 255, 255)' : 'rgb(50, 50, 50)';
    const buttonBg = theme === 'light' ? 'rgb(230, 230, 230)' : 'rgb(80, 80, 80)';
    const buttonFg = theme === 'light' ? 'rgb(50, 50, 50)' : 'rgb(240, 240, 240)';
    
    let statusColor = theme === 'light'? 'rgb(230, 230, 230)' : 'rgb(80, 80, 80)';
    let linearColor = 'rgb(0,0,0,0)';
    const activeColor = isDehumidifier ? 'rgb(243,156,18)' : 'rgb(33,150,243)';
    if (state === 'on') statusColor = activeColor, linearColor = activeColor;
    else if (state === 'off') statusColor = 'rgb(250,250,250)';
    else if (state === 'unknown') statusColor = 'rgb(250,250,250)';
    else if (state === 'unavailable') statusColor = 'rgb(250,250,250)';

    // 激活按钮的文字颜色：off时背景浅色用深色文字，on时用白色
    const activeTextColor = (state === 'off' || state === 'unknown' || state === 'unavailable') ? buttonFg : 'white';

    const stateTranslations = {
        'on': isDehumidifier ? '除湿中' : '开启',
        'off': '关闭',
        'unknown': '未知',
        'unavailable': '离线'
    };
    const translatedState = stateTranslations[state] || state;

    // 获取档位模式：优先使用select类型实体，其次使用原生的fan_modes
    let fanModes = [];
    let currentFanMode = '';
    let hasFanModes = false;

    if (this._fanModeSelectEntity) {
        const selectEntity = this.hass.states[this._fanModeSelectEntity];
        if (selectEntity && selectEntity.attributes && selectEntity.attributes.options) {
            fanModes = selectEntity.attributes.options;
            currentFanMode = selectEntity.state;
            hasFanModes = fanModes.length > 0;
        }
    } else {
        // 如果没有select实体，使用目标湿度作为currentFanMode
        currentFanMode = attrs.humidity;
    }
    if (currentFanMode === 'unavailable')  currentFanMode = ' ';

    const hasAvailableModes = attrs.available_modes && attrs.available_modes.length > 0;
    const hasTimer = this.config.enable_timer !== false;
    const hasExtra = this.buttons && this.buttons.length > 0;
    
    const gridHumidifierlateRows = [
        'auto',
        'auto',
        (hasAvailableModes || hasFanModes) ? 'auto' : '0',
        hasTimer ? 'auto' : '0',
        hasExtra ? 'auto' : '0'
    ].join(' ');

    const modeCount = fanModes.length;
    let fanSpeed = '2s'; 
    
    if (modeCount > 0 && currentFanMode) {
        const minSpeed = 2;
        const maxSpeed = 0.5;
        const speedStep = modeCount > 1 ? (minSpeed - maxSpeed) / (modeCount - 1) : 0;
        const currentIndex = fanModes.indexOf(currentFanMode);
        if (currentIndex >= 0) {
            fanSpeed = (minSpeed - (currentIndex * speedStep)).toFixed(1) + 's';
        }
    }
    const buttonCount = Math.min(this.buttons.length, 7); 
    const gridColumns = buttonCount <= 4 ? 4 : buttonCount;

    return html` 
      <div class="card" style=" width: ${this.width};
                                background: ${bgColor}; 
                                color: ${fgColor}; 
                                --button-bg: ${buttonBg}; 
                                --button-fg: ${buttonFg}; 
                                --active-color: ${statusColor};
                                --active-text-color: ${activeTextColor};
                                --linear-color: ${linearColor};
                                grid-template-rows: ${gridHumidifierlateRows}">
																
        ${isOn ? html`<div class="active-gradient"></div>` : ''}
        <div id="chart-container"></div>
        <div class="history-btn" @click=${this._toggleHistory} title="查看历史记录">
          <ha-icon icon="mdi:chart-box-outline" style="--mdc-icon-size: 20px; color: ${fgColor};"></ha-icon>
        </div>
            <div class="content-container ${hasAvailableModes ? 'has-available-modes' : ''}">
                <div class="name-area">${attrs.friendly_name}</div>
                <div class="status-area" style="color: ${fgColor}">${hasAvailableModes && isOn ? this._translateAvailableModefanyi(attrs.mode, isDehumidifier) : translatedState}：
                    <div class="humidifier-adjust-container">
                        <button class="humidifier-adjust-button" @click=${() => this._adjustHumidifier('down')}>
                            <ha-icon icon="mdi:chevron-left"></ha-icon>
                        </button>
                        <div class="humidifier-display">${hasAvailableModes && isOn ? humidity : humidity}</div>
                        <button class="humidifier-adjust-button" @click=${() => this._adjustHumidifier('up')}>
                            <ha-icon icon="mdi:chevron-right"></ha-icon>
                        </button>
                    </div>${current_humidity}
                </div>

        ${!hasAvailableModes ? html`
          <div class="dangwei">
                <div class="humidifier-adjust-container">
                    <button class="humidifier-adjust-button" @click=${() => this._setFanOptionPrevious()}>
                        <ha-icon icon="mdi:minus"></ha-icon>
                    </button>
                    <div class="humidifier-fan">${currentFanMode}</div>
                    <button class="humidifier-adjust-button" @click=${() => this._setFanOptionNext()}>
                        <ha-icon icon="mdi:plus"></ha-icon>
                    </button>
                </div>
          </div>
          ` : ''}
        <div class="power-area">
            <button class="power-button" @click=${this._togglePower}>
                <ha-icon 
                    class="power-icon"
                    icon="${isOn ? 'mdi:toggle-switch' : 'mdi:toggle-switch-off'}"
                    style="color: ${isOn ? statusColor : fgColor};"
                ></ha-icon>
            </button>
        </div>
          
        <div class="icon-area">
            <div class="main-icon-container">
                <ha-icon 
                    class="main-icon ${isOn ? 'active-main-icon' : ''} ${hasAvailableModes ? 'has-available-modes' : ''}" 
                    icon="${isOn ? (isDehumidifier ? 'mdi:water-off' : 'mdi:fan') : (isDehumidifier ? 'mdi:water-off-outline' : 'mdi:fan-off')}"
                    style="color: ${isOn ? statusColor : ''}; ${isOn ? `--fan-speed: ${fanSpeed}` : ''}"
                ></ha-icon>
            </div>
        </div>

     

       

          ${hasAvailableModes ? html`
              <div class="fan-area">
                  ${this._renderAvailableButtons(attrs.available_modes, attrs.mode, isDehumidifier, activeTextColor)}
              </div>
          ` : ''}

          ${hasFanModes  ? html`
              <div class="fan-area">
                  ${this._renderFanButtons(fanModes, currentFanMode, isDehumidifier, activeTextColor)}
              </div>
          ` : ''}

          ${hasTimer ? html`
              <div class="timer-area">
                  ${this._renderTimerControls()}
              </div>
          ` : ''}

          ${hasExtra ? html`
              <div class="extra-area" style="grid-template-columns: repeat(${gridColumns}, 1fr);">
                  ${this._renderExtraButtons()}
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
  _stopTimerRefresh() {
      if (this._timerInterval) {
          clearInterval(this._timerInterval);
          this._timerInterval = null;
      }
  }

  _renderTimerControls() {
    if (this.config.enable_timer === false) return html``;

    const humidifierEntity = this.hass.states[this.config.entity];
    const humidifierState = humidifierEntity ? humidifierEntity.state : 'off';
    const isDehumidifier = humidifierEntity?.attributes?.device_class === 'dehumidifier';
    
    let activeColor = 'rgb(255,255,255)';
    if (humidifierState === 'on') activeColor = isDehumidifier ? 'rgb(243,156,18)' : 'rgb(33,150,243)';
    
    let remainingSeconds = this._timerRemaining || 0;
    
    const remainingTime = this._formatSeconds(remainingSeconds);
    const displayColor = remainingSeconds > 0 ? activeColor : 'var(--button-fg)';
    
    return html`
        <button class="timer-button" @click=${this._cancelTimer}>
            取消
        </button>
        <button class="timer-button" @click=${() => this._adjustTimer(-1, remainingSeconds)}>
            -
        </button>
        <div class="timer-display" style="color: ${displayColor}">
            ${remainingTime}
        </div>
        <button class="timer-button" @click=${() => this._adjustTimer(1, remainingSeconds)}>
            +
        </button>
        <button class="timer-button" @click=${() => this._setTimer(60 * 60)}>
            1h
        </button>
        <button class="timer-button" @click=${() => this._setTimer(3 * 60 * 60)}>
            3h
        </button>
        <button class="timer-button" @click=${() => this._setTimer(8 * 60 * 60)}>
            8h
        </button>
    `;
}

  _handleClick(){
    const hapticEvent = new Event('haptic', {
      bubbles: true,
      cancelable: false,
      composed: true
    });
    hapticEvent.detail = 'light';
    this.dispatchEvent(hapticEvent);
  }
  
  _formatSeconds(totalSeconds) {
      const hours = Math.floor(totalSeconds / 3600);
      const minutes = Math.floor((totalSeconds % 3600) / 60);
      const seconds = totalSeconds % 60;
      
      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }

  _getTimerAdjustAmount(currentSeconds, direction) {
      const currentMinutes = Math.ceil(currentSeconds / 60);
      
      if (direction === -1) {
          if (currentMinutes > 30) return '30分';
          if (currentMinutes > 10) return '10分';
          return '取消';
      } else {
          if (currentSeconds === 0) return '10分';
          if (currentMinutes < 30) return '10分';
          if (currentMinutes < 180) return '30分';
          return '1小时';
      }
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

  _renderExtraButtons() {
      if (!this.buttons || this.buttons.length === 0) return html``;

      const buttonsToShow = this.buttons.slice(0, 7);
      const entity = this.hass.states[this.config.entity];
      if (!entity) {
          return html`<div>实体未找到: ${this.config.entity}</div>`;
      }
      
      const state = entity?.state || 'off';
      const theme = this._evaluateTheme();
      const fgColor = theme === 'light' ? 'rgb(0, 0, 0)' : 'rgb(255, 255, 255)';
      const isDehumidifier = entity?.attributes?.device_class === 'dehumidifier';
      let activeColor = theme === 'light' ? 'rgba(00, 80, 80)' : 'rgba(180, 230, 230)';
      if (state === 'on') activeColor = isDehumidifier ? 'rgb(243,156,18)' : 'rgb(33,150,243)';

      return buttonsToShow.map(buttonEntityId => {
          const entity = this.hass.states[buttonEntityId];
          if (!entity) return html``;
          
          const domain = buttonEntityId.split('.')[0];
          const friendlyName = entity.attributes.friendly_name || '';
          const displayName = friendlyName.slice(0, 4);
          let displayValue = entity.state.slice(0, 4);
          const displayValueColor = displayValue === '真' ? 'red' : fgColor;
                  
          switch(domain) {
              case 'switch':
              case 'light':
                  const isActive = entity.state === 'on';
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
                  const unit = entity.attributes.unit_of_measurement || '';
                  displayValue = `${entity.state}${unit}`.slice(0, 4);
                  
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
                      const options = entity.attributes.options || [];
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
      const entity = this.hass.states[entityId];
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

  _adjustHumidifier(direction) {
      const entity = this.hass.states[this.config.entity];
      if (!entity) return;
      
      const currentHumidity = entity.attributes.humidity;
      const step = 5;
      const min_humidity = entity.attributes.min_humidity || 40;
      const max_humidity = entity.attributes.max_humidity || 80;
      
      let newHumidity = currentHumidity;
      if (direction === 'up') {
          newHumidity += step;
      } else {
          newHumidity -= step;
      }
      
      // 限制湿度范围并确保步进正确
      if (newHumidity < min_humidity) {
          newHumidity = min_humidity;
      } else if (newHumidity > max_humidity) {
          newHumidity = max_humidity;
      }
      
      // 确保步进正确：如果当前是43，减5后应该是40而不是38
      if (direction === 'down' && newHumidity < min_humidity) {
          newHumidity = min_humidity;
      } else if (direction === 'up' && newHumidity > max_humidity) {
          newHumidity = max_humidity;
      }
      
      this._callService('humidifier', 'set_humidity', {
          entity_id: this.config.entity,
          humidity: newHumidity
      });
      this._handleClick();
  }

  _renderModeButtons(modes, currentMode, activeTextColor) {
      if (!modes) return html``;
      
      const modeIcons = {
          'on': 'mdi:water',
          'off': 'mdi:power',
          'unknown': 'mdi:power',
          'unavailable': 'mdi:power'
      };
      
      return modes.map(mode => {
          const isActive = mode === currentMode;
          return html`
              <button 
                  class="mode-button ${isActive ? 'active-mode' : ''}" 
                  @click=${() => this._setHvacMode(mode)}
                  style="${isActive ? `background-color: var(--active-color); color: ${activeTextColor};` : ''}"
                  title="${this._translateMode(mode)}"
              >
                  <ha-icon class="icon" icon="${modeIcons[mode] || 'mdi:water'}" style="color: ${isActive ? activeTextColor : ''}"></ha-icon>
              </button>
          `;
      });
  }

  _renderFanButtons(fanModes, currentFanMode, isDehumidifier = false, activeTextColor) {
    if (!fanModes || fanModes.length === 0) return html``;
    
    const entity = this.hass.states[this.config.entity];
    const isOn = entity?.state !== 'off';
    
    return fanModes.map((mode) => {
        const isActive = mode === currentFanMode && isOn;
        
        return html`
            <button 
                class="mode-button ${isActive ? 'active-mode' : ''}" 
                @click=${() => this._setFanOption(mode)}
                style="${isActive ? `background-color: var(--active-color); color: ${activeTextColor};` : ''}"
            >
                <div class="fan-button">
                    <ha-icon 
                        class="fan-button-icon" 
                        icon="${isDehumidifier ? 'mdi:water-off' : 'mdi:water'}" 
                        style="color: ${isActive ? activeTextColor : ''}"
                    ></ha-icon>
                    <span class="fan-text" style="${isActive ? `background-color: var(--active-color); color: ${activeTextColor};` : ''}">${this._translateFanMode(mode)}</span>
                </div>
            </button>
        `;
    });
  }

  _renderAvailableButtons(availableModes, currentAvailableMode, isDehumidifier = false, activeTextColor) {
    if (!availableModes) return html``;
    
    return availableModes.map(mode => {
        const isActive = mode === currentAvailableMode;
        return html`
            <button 
                class="mode-button ${isActive ? 'active-mode' : ''}" 
                @click=${() => this._setAvailableMode(mode)}
                style="${isActive ? `background-color: var(--active-color); color: ${activeTextColor};` : ''}"
            >
                <div class="available-button">
                    <ha-icon class="icon" icon="${this._getAvailableIcon(mode, isDehumidifier)}" style="color: ${isActive ? activeTextColor : ''}"></ha-icon>
                    <span class="available-text">${this._translateAvailableMode(mode, isDehumidifier)}</span>
                </div>
            </button>
        `;
    });
  }

  _getAvailableIcon(mode, isDehumidifier = false) {
    if (isDehumidifier) {
      const dehumidifierIcons = {
          '恒湿': 'mdi:water-off',
          '睡眠': 'mdi:power-sleep',
          '强力': 'mdi:water-off',
          '干衣': 'mdi:tshirt-crew',
          '连续': 'mdi:water-off',
          '智能': 'mdi:brain',
          '静音': 'mdi:volume-off',
          'Off': 'mdi:water-off-outline',
          'Constant Humidity': 'mdi:water-off',
          'Sleep': 'mdi:power-sleep',
          'Strong': 'mdi:water-off',
          'Dry Clothes': 'mdi:tshirt-crew',
          'Continuous': 'mdi:water-off',
          'Smart': 'mdi:brain',
          'Quiet': 'mdi:volume-off',
      };
      return dehumidifierIcons[mode] || 'mdi:water-off';
    }
    const availableIcons = {
        '恒湿': 'mdi:water-sync',
        '睡眠': 'mdi:power-sleep',
        '强力': 'mdi:water',
        'Off': 'mdi:water',
        'Constant Humidity': 'mdi:water-sync',
        'Sleep': 'mdi:power-sleep',
        'Strong': 'mdi:water',
    };
    return availableIcons[mode] || '';
  }

  _translateAvailableMode(mode, isDehumidifier = false) {
    if (isDehumidifier) {
      const dehumidifierTranslations = {
          '恒湿': '\u00A0恒湿',
          '睡眠': '\u00A0睡眠',
          '强力': '\u00A0强力',
          '干衣': '\u00A0干衣',
          '连续': '\u00A0连续',
          '智能': '\u00A0智能',
          '静音': '\u00A0静音',
          'Off': '\u00A0关闭',
          'Constant Humidity': '\u00A0恒湿',
          'Sleep': '\u00A0睡眠',
          'Strong': '\u00A0强力',
          'Dry Clothes': '\u00A0干衣',
          'Continuous': '\u00A0连续',
          'Smart': '\u00A0智能',
          'Quiet': '\u00A0静音',
      };
      return dehumidifierTranslations[mode] || mode;
    }
    const translations = {
        '恒湿': '\u00A0恒湿',
        '睡眠': '\u00A0睡眠',
        '强力': '\u00A0强力',
        'Off': '\u00A0关闭',
        'Constant Humidity': '\u00A0舒适',
        'Sleep': '\u00A0睡眠',
        'Strong': '\u00A0强力',
    };
    return translations[mode] || mode;
  }

  _translateAvailableModefanyi(mode, isDehumidifier = false) {
    if (isDehumidifier) {
      const dehumidifierTranslations = {
          'Off': '关闭',
          'Constant Humidity': '恒湿',
          'Sleep': '睡眠',
          'Strong': '强力',
          'Dry Clothes': '干衣',
          'Continuous': '连续',
          'Smart': '智能',
          'Quiet': '静音',
      };
      return dehumidifierTranslations[mode] || mode;
    }
    const translations = {
        'Off': '关闭',
        'Constant Humidity': '舒适',
        'Sleep': '睡眠',
        'Strong': '强力',
    };
    return translations[mode] || mode;
  }

  _translateMode(mode, isDehumidifier = false) {
      const translations = {
          'on': isDehumidifier ? '除湿' : '加湿',
          'off': '关闭'
      };
      return translations[mode] || mode;
  }

  _translateFanMode(mode) {
    return mode;
  }

  _setAvailableMode(mode) {
      this._callService('humidifier', 'set_mode', {
          entity_id: this.config.entity,
          mode: mode
      });
      this._handleClick();
  }

  _setFanOption(mode) {
    this._callService('select', 'select_option', {
        entity_id: this._fanModeSelectEntity,
        option: mode
    });
    this._handleClick();
  }

  _setFanOptionNext() {
      this._callService('select', 'select_next', {
          entity_id: this._fanModeSelectEntity
      });
    this._handleClick();
  }

  _setFanOptionPrevious() {
      this._callService('select', 'select_previous', {
          entity_id: this._fanModeSelectEntity
      });
      this._handleClick();
  }

  _turnOffHumidifier() {
    if (!this.config.entity) return;
    
    this._callService('humidifier', 'turn_off', {
        entity_id: this.config.entity
    });
    this._handleClick();
  }

  _togglePower() {
      const entity = this.hass.states[this.config.entity];
      if (entity.state === 'off') {
          this._callService('humidifier', 'turn_on', {
              entity_id: this.config.entity
          });
          this._handleClick();
      } else {
          this._callService('humidifier', 'turn_off', {
              entity_id: this.config.entity
          });
        this._cancelTimer();
        this._handleClick();
      }
      
  }

  _callService(domain, service, data) {
      this.hass.callService(domain, service, data);
      this._handleClick();
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

  _getHistoryAccentColor() {
    const entity = this.hass?.states?.[this.config.entity];
    const isDehumidifier = entity?.attributes?.device_class === 'dehumidifier';
    const state = entity?.state || 'off';
    if (state === 'on') return isDehumidifier ? 'rgb(243,156,18)' : 'rgb(33,150,243)';
    return isDehumidifier ? 'rgb(243,156,18)' : 'rgb(33,150,243)';
  }

  _toggleHistory() {
    this._handleClick();
    if (this._showHistory) { this._closeHistoryOverlay(); return; }
    this._showHistory = true;
    this._showHistoryOverlay();
    this._fetchHistory();
  }

  async _fetchHistory() {
    try {
      const entityId = this.config.entity; if (!entityId) return;
      const periodHours = this._historyFilterPeriod || 24;
      const endTime = new Date(); const startTime = new Date(endTime.getTime() - periodHours * 3600000);
      const data = await this.hass.callApi('GET', `history/period/${startTime.toISOString()}?end_time=${endTime.toISOString()}&filter_entity_id=${entityId}&minimal_response&no_attributes`);
      const result = {}; const all = Array.isArray(data) ? data : [];
      for (const eh of all) {
        if (!eh || eh.length === 0) continue; const eId = eh[0].entity_id; if (!eId) continue;
        const so = this.hass.states[eId]; const fn = so?.attributes?.friendly_name || eId;
        const raw = eh.filter(e => e && e.last_changed).sort((a, b) => new Date(b.last_changed) - new Date(a.last_changed));
        const entries = [];
        for (const e of raw) { const l = entries[entries.length-1]; const cr = (e.state||'').trim(); const lr = l ? (l.state||'').trim() : null; if (l && lr === cr) entries[entries.length-1] = e; else entries.push(e); }
        if (entries.length > 0) result[eId] = { name: fn, entries };
      }
      this._historyData = result;
    } catch (e) { console.error('获取历史记录失败:', e); this._historyData = {}; }
    finally { this._historyLoading = false; this._updateHistoryContent(); }
  }

  _showHistoryOverlay() {
    if (this._historyOverlayEl) return;
    const theme = this._evaluateTheme(); const isDark = theme === 'dark';
    const ent = this.hass?.states?.[this.config.entity];
    const roomName = ent?.attributes?.friendly_name || this.config.entity || '加湿器';
    const textColor = isDark ? '#fff' : '#333'; const bgColor = isDark ? '#2c2c2c' : '#fff';
    const borderColor = isDark ? '#aaa' : '#888'; const btnBg = isDark ? '#444' : '#f0f0f0';
    const btnIconColor = isDark ? '#ccc' : '#666';
    const chipBg = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)';
    const chipActiveBg = this._getHistoryAccentColor(); const chipActiveColor = '#fff';
    this._historyFilterPeriod = 24;
    const overlay = document.createElement('div'); overlay.className = 'xiaoshi-history-overlay';
    overlay.style.cssText = 'position:fixed;top:0;left:0;width:100vw;height:100vh;background:rgba(0,0,0,0.5);z-index:99999;display:flex;align-items:flex-start;justify-content:center;padding-top:20px;-webkit-backdrop-filter: blur(10px);backdrop-filter: blur(10px);';
    overlay.addEventListener('click', (e) => { if (e.target === overlay) this._closeHistoryOverlay(); });
    const dialog = document.createElement('div'); dialog.style.cssText = `background:${bgColor};border-radius:16px;width:95vw;max-width:500px;max-height:85vh;display:flex;flex-direction:column;box-shadow:0 8px 40px rgba(0,0,0,0.25);`;
    const header = document.createElement('div'); header.style.cssText = `display:flex;justify-content:space-between;align-items:center;padding:10px 0;margin:0 20px;border-bottom:1px solid ${borderColor};`;
    const tit = document.createElement('span'); tit.style.cssText = `font-size:1.1rem;font-weight:700;color:${textColor};`; tit.textContent = `${roomName} - 历史记录`;
    const closeBtn = document.createElement('button'); closeBtn.style.cssText = `width:36px;height:36px;border-radius:50%;border:none;background:${btnBg};cursor:default;display:flex;align-items:center;justify-content:center;transition:opacity 0.2s,transform 0.2s;`;
    closeBtn.innerHTML = `<ha-icon icon="mdi:close" style="--mdc-icon-size:20px;color:${btnIconColor};"></ha-icon>`;
    closeBtn.addEventListener('click', () => this._closeHistoryOverlay());
    closeBtn.addEventListener('mouseenter', () => { closeBtn.style.opacity = '0.85'; closeBtn.style.transform = 'scale(1.05)'; });
    closeBtn.addEventListener('mouseleave', () => { closeBtn.style.opacity = '1'; closeBtn.style.transform = 'scale(1)'; });
    header.appendChild(tit); header.appendChild(closeBtn);
    const toolbar = document.createElement('div'); toolbar.style.cssText = `display:flex;align-items:center;gap:8px;padding:10px 5px;margin:0 20px;border-bottom:1px solid ${borderColor};flex-wrap:wrap;`;
    const timeRow = document.createElement('div'); timeRow.style.cssText = 'display:flex;align-items:center;gap:8px;';
    const timeLabel = document.createElement('span'); timeLabel.style.cssText = `font-size:0.75rem;color:${isDark?'#aaa':'#888'};flex-shrink:0;`; timeLabel.textContent = '时段:';
    timeRow.appendChild(timeLabel);
    const timeChips = document.createElement('div'); timeChips.style.cssText = 'display:flex;gap:4px;flex-wrap:wrap;'; timeChips.className = 'xiaoshi-time-chips';
    const periods = [{ label: '1小时', value: 1 },{ label: '6小时', value: 6 },{ label: '24小时', value: 24 },{ label: '3天', value: 72 },{ label: '7天', value: 168 },{ label: '10天', value: 240 }];
    for (const p of periods) {
      const chip = this._buildFilterChip(p.label, p.value, chipBg, chipActiveBg, chipActiveColor, isDark);
      chip.addEventListener('click', () => { this._handleClick(); this._historyFilterPeriod = p.value; this._refreshHistoryChips(timeChips, this._historyFilterPeriod, chipBg, chipActiveBg, chipActiveColor, isDark, 'time'); this._refetchWithFilters(); });
      timeChips.appendChild(chip);
    }
    timeRow.appendChild(timeChips); toolbar.appendChild(timeRow);
    const body = document.createElement('div'); body.className = 'xiaoshi-history-body'; body.style.cssText = 'flex:1;overflow-y:auto;padding:6px 20px;';
    body.innerHTML = `<div style="display:flex;align-items:center;justify-content:center;padding:40px;color:${isDark?'#aaa':'#999'};"><ha-icon icon="mdi:loading" style="--mdc-icon-size:24px;"></ha-icon>&nbsp;加载中...</div>`;
    dialog.appendChild(header); dialog.appendChild(toolbar); dialog.appendChild(body); overlay.appendChild(dialog); document.body.appendChild(overlay);
    this._historyOverlayEl = overlay; this._historyBodyEl = body;
  }

  _updateHistoryContent() {
    if (!this._historyBodyEl) return;
    const theme = this._evaluateTheme(); const isDark = theme === 'dark'; const ac = this._getHistoryAccentColor();
    if (this._historyLoading) { this._historyBodyEl.innerHTML = `<div style="display:flex;align-items:center;justify-content:center;padding:40px;color:${isDark?'#aaa':'#999'};"><ha-icon icon="mdi:loading" style="--mdc-icon-size:24px;"></ha-icon>&nbsp;加载中...</div>`; return; }
    const items = Object.entries(this._historyData);
    if (items.length === 0) { this._historyBodyEl.innerHTML = `<div style="text-align:center;padding:40px;color:${isDark?'#aaa':'#999'};font-size:0.9rem;">暂无历史记录</div>`; return; }
    let h = '';
    for (const [entityId, data] of items) {
      const so = this.hass.states[entityId]; const icon = so?.attributes?.icon || 'mdi:air-humidifier';
      let onT=0, offT=0;
      const dd=[]; for (const e of data.entries){const l=dd[dd.length-1];const cr=(e.state||'').trim();const lr=l?(l.state||'').trim():null;if(l&&lr===cr)dd[dd.length-1]=e;else dd.push(e);}
      const ewd=[]; for(let i=0;i<dd.length;i++){const e=dd[i];const t=new Date(e.last_changed);const pe=dd[i-1];const et=pe?new Date(pe.last_changed):new Date();ewd.push({entry:e,time:t,durationMs:Math.max(0,et-t)});}
      const pf=[]; for(const it of ewd){if(this._normalizeState(it.entry.state)==='offline'&&it.durationMs<60000)continue;pf.push(it);}
      const fl=[];onT=0;offT=0;
      for(const it of pf){const l=fl[fl.length-1];const cr=(it.entry.state||'').trim();const lr=l?(l.entry.state||'').trim():null;if(l&&lr===cr){l.durationMs+=it.durationMs;l.time=it.time;}else fl.push({...it});}
      for(const it of fl){if(this._normalizeState(it.entry.state)==='on')onT+=it.durationMs;else offT+=it.durationMs;}
      const tMs=onT+offT; const onP=tMs>0?Math.round(onT/tMs*100):0; const offP=tMs>0?Math.round(offT/tMs*100):0;
      h+=`<div style="margin:8px 0px;border-bottom:1px solid ${isDark?'#aaa':'#888'};">`;
      const ph=this._historyFilterPeriod||24;const nw=new Date();const rs=new Date(nw.getTime()-ph*3600000);
      h+=`<div style="display:flex;align-items:center;gap:8px;margin-bottom:8px;">`;
      h+=`<span style="display:flex;align-items:center;gap:4px;font-weight:700;font-size:0.85rem;color:${isDark?'#ddd':'#444'};white-space:nowrap;"><ha-icon icon="${icon}" style="--mdc-icon-size:16px;color:${ac};"></ha-icon>${data.name}</span>`;
      h+=`<span style="font-size:0.7rem;color:${ac};white-space:nowrap;">${onP}%</span>`;
      h+=`<span style="font-size:0.7rem;color:${isDark?'#aaa':'#888'};white-space:nowrap;">${offP}%</span>`;
      h+=`<div style="flex:1;display:flex;height:8px;border-radius:3px;overflow:hidden;">${this._buildTimeline(data.entries,rs,nw)}</div></div>`;
      for(const{entry,time,durationMs}of fl){
        const ts=time.toLocaleString('zh-CN',{month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit'});
        const rs=(entry.state||'').trim();const ns=this._normalizeState(rs);
        const isOn=ns==='on';const isOffline=rs==='unavailable'||rs==='unknown';
        const sl=isOn?'已开启':(isOffline?'已离线':'已关闭');
        const sc=this._getStateColor(rs);
        const ds=this._formatDuration(durationMs);
        const scRgb=sc.replace(/[^\d,]/g,'');
        const eb=isOn?(isDark?`rgba(${scRgb},0.12)`:`rgba(${scRgb},0.08)`):(isOffline?(isDark?'rgba(244,67,54,0.12)':'rgba(244,67,54,0.06)'):(isDark?'#383838':'#f5f5f5'));
        h+=`<div style="border-radius:10px;padding:1px 12px;margin-bottom:8px;background:${eb};"><div style="display:flex;justify-content:space-between;align-items:center;"><span style="font-size:0.8rem;padding:2px 4px;border-radius:10px;font-weight:500;color:${sc};">${sl} · ${ds}</span><span style="font-size:0.75rem;color:${isDark?'#aaa':'#999'};">${ts}</span></div></div>`;
      }
      h+=`</div>`;
    }
    this._historyBodyEl.innerHTML = h;
  }

  _closeHistoryOverlay() {
    this._handleClick();
    if (this._historyOverlayEl) { this._historyOverlayEl.remove(); this._historyOverlayEl = null; this._historyBodyEl = null; }
    this._showHistory = false; this._historyData = {}; this._historyLoading = false; this._historyFilterPeriod = 24;
  }

  _normalizeState(state) { const s = (state||'').trim(); if(s==='unavailable'||s==='unknown')return'offline'; if(s==='off')return'off'; return'on'; }

  _getStateColor(state) {
    const s = (state||'').trim();
    if(s==='on')return'rgb(33,150,243)';
    if(s==='off')return'#999';
    if(s==='unavailable'||s==='unknown')return'#f44336';
    return'#999';
  }

  _buildTimeline(entries, rangeStart, rangeEnd) {
    const rMs=rangeEnd-rangeStart; if(rMs<=0||entries.length===0)return'';
    const sorted=[...entries].sort((a,b)=>new Date(a.last_changed)-new Date(b.last_changed));
    // 先过滤：离线且持续少于1分钟的段跳过，避免时间线出现短红条闪烁
    const fltd=[]; for(let i=0;i<sorted.length;i++){const e=sorted[i];const ss=new Date(e.last_changed);const se=i+1<sorted.length?new Date(sorted[i+1].last_changed):rangeEnd;const nm=this._normalizeState(e.state);if(nm==='offline'&&se-ss<60000)continue;fltd.push(e);}
    const segs=[];
    for(let i=0;i<fltd.length;i++){const e=fltd[i];const ss=new Date(e.last_changed);const se=i+1<fltd.length?new Date(fltd[i+1].last_changed):rangeEnd;
      const vs=ss<rangeStart?rangeStart:ss;const ve=se>rangeEnd?rangeEnd:se;const d=ve-vs;
      if(d>0){const rs=(e.state||'').trim();const p=(d/rMs)*100;const l=segs[segs.length-1];if(l&&l.state===rs)l.percent+=p;else segs.push({state:rs,percent:p});}}
    let blocks='';
    for(const s of segs){const c=this._getStateColor(s.state);blocks+=`<div style="width:${s.percent}%;min-width:1px;height:100%;background:${c};flex-shrink:0;"></div>`;}
    return blocks;
  }

  _formatDuration(ms) {
    const ph=this._historyFilterPeriod||24;const pMs=ph*3600000;
    if(ms<60000)return'少于1分钟';
    if(ms>=pMs){if(ph<24)return`大于${ph}小时`;if(ph<72)return`大于${ph}小时`;const d=Math.floor(ph/24);return`大于${d}天`;}
    const min=Math.floor(ms/60000);if(min<60)return`${min}分钟`;
    const h=Math.floor(min/60);const rm=min%60;if(h<24)return rm>0?`${h}小时${rm}分钟`:`${h}小时`;
    const d=Math.floor(h/24);const rh=h%24;return rh>0?`${d}天${rh}小时`:`${d}天`;
  }

  _buildFilterChip(label, value, chipBg, activeBg, activeColor, isDark) {
    const chip=document.createElement('span');chip.setAttribute('data-chip','1');
    const isActive=(typeof value==='number'&&value===this._historyFilterPeriod);
    if(isActive)chip.style.cssText=`padding:3px 10px;border-radius:12px;font-size:0.72rem;font-weight:500;cursor:default;white-space:nowrap;transition:opacity 0.2s,transform 0.2s;background:${activeBg};color:${activeColor};`;
    else chip.style.cssText=`padding:3px 10px;border-radius:12px;font-size:0.72rem;font-weight:500;cursor:default;white-space:nowrap;transition:opacity 0.2s,transform 0.2s;background:${chipBg};color:${isDark?'#ccc':'#555'};`;
    chip.textContent=label;chip.addEventListener('mouseenter',()=>{chip.style.opacity='0.85';chip.style.transform='scale(1.05)';});chip.addEventListener('mouseleave',()=>{chip.style.opacity='1';chip.style.transform='scale(1)';});return chip;
  }

  _refreshHistoryChips(container, activePeriod, chipBg, activeBg, activeColor, isDark, mode) {
    this._handleClick();
    const chips=container.querySelectorAll('[data-chip]');
    chips.forEach(chip=>{const label=chip.textContent;if(mode==='time'){const isActive=(label==='24小时'&&activePeriod===24)||(label==='1小时'&&activePeriod===1)||(label==='6小时'&&activePeriod===6)||(label==='3天'&&activePeriod===72)||(label==='7天'&&activePeriod===168)||(label==='10天'&&activePeriod===240);if(isActive){chip.style.background=activeBg;chip.style.color=activeColor;}else{chip.style.background=chipBg;chip.style.color=isDark?'#ccc':'#555';}}});
  }

  _refetchWithFilters() {
    this._historyLoading=true;this._historyData={};
    if(this._historyBodyEl)this._updateHistoryContent();
    this._fetchHistory();
  }
} 
customElements.define('xiaoshi-phone-humidifier-card', XiaoshiPhoneHumidifierCard);




