import { LitElement, html, css } from "https://unpkg.com/lit-element@2.4.0/lit-element.js?module";

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
      _timerSearchTerm: { type: String },
      _filteredTimerEntities: { type: Array },
      _showTimerList: { type: Boolean },
      _buttonSearchTerms: { type: Object },
      _filteredButtonEntities: { type: Object },
      _showButtonLists: { type: Object }
    };
  }

  setConfig(config) {
    this.config = config || {};
  }

  firstUpdated() {
    // 点击外部关闭下拉列表
    document.addEventListener('click', (e) => {
      if (!e.target.closest('.entity-selector')) {
        this._showEntityList = false;
        this._showSelectList = false;
        this._showTimerList = false;

        // 关闭所有按钮的下拉列表
        if (this._showButtonLists) {
          Object.keys(this._showButtonLists).forEach(key => {
            this._showButtonLists[key] = false;
          });
        }

        this.requestUpdate();
      }
    });
  }

  async firstUpdated() {
    await this._setDefaultClimateEntity();
  }

  async _setDefaultClimateEntity() {
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

      // 只显示 humidifier. 开头的实体
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

  _onTimerSearch(e) {
    const searchTerm = e.target.value.toLowerCase();
    this._timerSearchTerm = searchTerm;
    this._showTimerList = true;

    if (!this.hass) return;

    const allEntities = Object.values(this.hass.states);

    // 过滤实体，只显示 timer 开头的实体
    this._filteredTimerEntities = allEntities.filter(entity => {
      const entityId = entity.entity_id.toLowerCase();
      const friendlyName = (entity.attributes.friendly_name || '').toLowerCase();

      const isTimerEntity = entityId.startsWith('timer.');
      const matchesSearch = entityId.includes(searchTerm) || friendlyName.includes(searchTerm);

      return isTimerEntity && matchesSearch;
    }).slice(0, 50);

    this.requestUpdate();
  }

  _selectTimer(entityId) {
    this.config = {
      ...this.config,
      timer: entityId
    };

    this._timerSearchTerm = '';
    this._showTimerList = false;

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
    return css`
      .card-config {
        padding: 16px;
      }
      .row {
        margin-bottom: 16px;
      }
      .label {
        margin-bottom: 8px;
        font-weight: bold;
      }
      .buttons-row {
        display: flex;
        align-items: center;
        margin-top: 8px;
      }
      .add-button {
        margin-left: 8px;
      }

      .entity-selector {
        position: relative;
      }

      .entity-search-input {
        width: 100%;
        padding: 8px;
        border: 1px solid #ddd;
        border-radius: 4px;
        box-sizing: border-box;
      }

      .entity-dropdown {
        position: absolute;
        top: 100%;
        left: 0;
        right: 0;
        height: 300px;
        overflow-y: auto;
        background: white;
        border: 1px solid #ddd;
        border-radius: 4px;
        box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        z-index: 1000;
        margin-top: 2px;
      }

      .entity-option {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 8px 12px;
        cursor: pointer;
        border-bottom: 1px solid #eee;
      }

      .entity-option:hover {
        background: #f5f5f5;
      }

      .entity-option.selected {
        background: #e3f2fd;
      }

      .entity-info {
        display: flex;
        align-items: center;
        gap: 8px;
        flex: 1;
      }

      .entity-details {
        flex: 1;
      }

      .entity-name {
        font-weight: 500;
        font-size: 14px;
        color: #000;
      }

      .entity-id {
        font-size: 12px;
        color: #000;
        font-family: monospace;
      }

      .check-icon {
        color: #4CAF50;
      }

      .no-results {
        padding: 12px;
        text-align: center;
        color: #666;
        font-style: italic;
      }

      .entity-selector-with-remove {
        display: flex;
        align-items: flex-start;
        gap: 8px;
        margin-bottom: 8px;
      }

      .entity-selector-with-remove .entity-selector {
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
        margin-top: 0;
      }

      .remove-button:hover {
        background: #d32f2f;
      }

      .remove-button ha-icon {
        --mdc-icon-size: 20px;
      }

      .hint {
        font-size: 0.85em;
        color: #888;
        margin-top: 4px;
      }
    `;
  }

  render() {
    if (!this.hass) return html``;

    return html`
      <div class="card-config">
        <!-- 主实体选择 -->
        <div class="row">
          <div class="label">加湿器实体 (必选)</div>
          <div class="entity-selector">
            <input
              type="text"
              @input=${this._onMainEntitySearch}
              @focus=${this._onMainEntitySearch}
              .value=${this._searchTerm || this.config?.entity || ''}
              placeholder="搜索加湿器实体..."
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
            <div class="hint">正在加载可用加湿器...</div>
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

        <!-- 定时器 -->
        <div class="row">
          <div class="label">定时器实体 (可选)</div>
          <div class="entity-selector-with-remove">
            <div class="entity-selector">
              <input
                type="text"
                @input=${this._onTimerSearch}
                @focus=${this._onTimerSearch}
                .value=${this._timerSearchTerm || this.config.timer || ''}
                placeholder="搜索定时器..."
                class="entity-search-input"
              />
              ${this._showTimerList ? html`
                <div class="entity-dropdown">
                  ${this._filteredTimerEntities.map(entity => html`
                    <div
                      class="entity-option ${this.config.timer === entity.entity_id ? 'selected' : ''}"
                      @click=${() => this._selectTimer(entity.entity_id)}
                    >
                      <div class="entity-info">
                        <ha-icon icon="${entity.attributes.icon || 'mdi:timer'}"></ha-icon>
                        <div class="entity-details">
                          <div class="entity-name">${entity.attributes.friendly_name || entity.entity_id}</div>
                          <div class="entity-id">${entity.entity_id}</div>
                        </div>
                      </div>
                      ${this.config.timer === entity.entity_id ?
                        html`<ha-icon icon="mdi:check" class="check-icon"></ha-icon>` : ''}
                    </div>
                  `)}
                  ${this._filteredTimerEntities.length === 0 ? html`
                    <div class="no-results">未找到匹配的实体</div>
                  ` : ''}
                </div>
              ` : ''}
            </div>
            <button class="remove-button" @click=${this._removeTimer} title="移除定时器">
              <ha-icon icon="mdi:close"></ha-icon>
            </button>
          </div>
        </div>

        <!-- 主题选择 -->
        <div class="row">
          <div class="label">主题模式</div>
          <ha-switch
            .checked=${this.config.theme === 'on'}
            @change=${this._themeSwitchChanged}
            .configValue=${'theme'}
          ></ha-switch>
          <span style="margin-left: 8px">
            ${this.config.theme === 'on' ? '亮色(on)' : '暗色(off)'}
          </span>
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

        <!-- 自动隐藏选项 -->
        <div class="row">
          <ha-switch
            .checked=${!!this.config.auto_show}
            @change=${this._autoShowChanged}
          ></ha-switch>
          <span style="margin-left: 8px">空调关闭时隐藏卡片</span>
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

  _removeTimer() {
    const newConfig = { ...this.config };
    delete newConfig.timer;
    this.config = newConfig;
    this._fireEvent();
  }

  _themeSwitchChanged(ev) {
    if (!this.config) return;
    const theme = ev.target.checked ? 'on' : 'off';
    
    this.config = { 
      ...this.config,
      theme 
    };
    this._fireEvent();
  }

  _autoShowChanged(ev) {
    if (!this.config) return;
    const auto_show = ev.target.checked;
    
    this.config = { 
      ...this.config,
      auto_show 
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

export class XiaoshiPhoneHumidifierCard extends LitElement {
  static get properties() { 
    return {
      hass: { type: Object },
      width: { type: String, attribute: true },
      config: { type: Object },
      buttons: { type: Array },
      theme: { type: String },
      _timerInterval: { state: true },
      auto_show: { type: Boolean },
      humidifierData: { type: Array },
      _externalHumidifierSensor: { type: String },
      _fanModeSelectEntity: { type: String }
    };
  }
  static getConfigElement() {
    return document.createElement("xiaoshi-phone-humidifier-card-editor");
  }

  static getStubConfig() {
    return {
      entity: "",
      timer: "",
      theme: "on",
      buttons: [],
      auto_show: false,
      width: "100%"
    };
  }

  setConfig(config) {
    this.config = config;
    this.buttons = config.buttons || [];
    this.auto_show = config.auto_show || false;
    if (config.width !== undefined) this.width = config.width;
    this._fanModeSelectEntity = config.select || '';
    this.requestUpdate();
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
      }
      
      .content-container {
        position: relative;
        z-index: 1;
        height: 100%;
        display: grid;
        grid-template-areas: 
            "name name status power"
            "icon dangwei fan fan"
            "icon dangwei timer timer"
            "icon dangwei extra extra"
            "a a a a"; 
        grid-template-columns: 16% 22% 50% 10%;
        grid-template-rows: auto  auto auto auto 4px;
      }

      .content-container.has-available-modes {
        grid-template-areas: 
            "name status power"
            "icon fan fan"
            "icon timer timer"
            "icon extra extra"
            "a a  a"; 
        grid-template-columns: 25% 60% 13%;
      }

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

      .name-area {
        grid-area: name;
        display: flex;
        align-items: center;
        font-size: 16px;
        font-weight: bold;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        margin-left: 10px; 
        font-weight: bold;
      }
      
      .status-area {
        grid-area: status;
        display: flex;
        align-items: center;
        font-size: 12px;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        margin-left: 5px; 
        gap: 1px;
        font-weight: bold;
      }
      .humidifier-adjust-container {
        display: inline-flex;
        align-items: center;
        gap: 1px;
      }
      .humidifier-adjust-button {
        background: none;
        border: none;
        cursor: pointer;
        padding: 0;
        display: flex;
        align-items: center;
        justify-content: center;
        color: var(--button);;
        width: 24px;
        height: 24px;
        border-radius: 5px;
        cursor: default;
      }

      .humidifier-display {
        font-size: 12px;
        min-width: 24px;
        text-align: center;
        color: var(--button);;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      .humidifier-fan {
        font-size: 12px;
        text-align: center;
        min-width:25px;
        color: var(--button);;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      .current-humidifier {
        font-size: 12px;
        margin-left: 5px;
      }
      .power-area {
        grid-area: power;
        display: flex;
        justify-content: flex-end;
        align-items: center;
      }
      
      .power-button {
          background: none;
          border: none;
        cursor: pointer;
        padding: 0;
        display: flex;
        align-items: center;
        justify-content: flex-end;
        width: 100%;
        height: 35px;
        border-radius: 5px;
        cursor: default;
      }
      
      .power-icon {
        --mdc-icon-size: 30px;
        transition: all 0.3s ease;
      }

      .icon {
        --mdc-icon-size: 16px;
      }

      .icon-area {
        grid-area: icon;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: space-between;
        height: 100%;
      }

      .main-icon-container {
        flex: 1;
        display: flex;
        align-items: center;
        justify-content: center;
        width: 100%;
      }
      
      .main-icon {
        --mdc-icon-size: 40px;
        margin-top: -3px;
        transition: transform 0.5s ease;
      }

      .main-icon.has-available-modes {
        --mdc-icon-size: 50px;
      }

      .active-main-icon {
        animation: spin var(--fan-speed, 2s) linear infinite;
        color: var(--active-color);
      }

      @keyframes spin {
        from { transform: rotate(0deg); }
        to { transform: rotate(360deg); }
      }

       .fan-area, .timer-area, .extra-area {
        display: flex;
        gap: 5px;
        width: 100%;
        height: 25px;
        margin-bottom: 5px;
      }
      
      .fan-area {
        grid-area: fan;
        overflow-x: auto;
        scrollbar-width: none;
      }
      
      .fan-area::-webkit-scrollbar {
        display: none;
      }

      .available-area {
        grid-area: available;
        overflow-x: auto;
        scrollbar-width: none;
      }
      
      .available-area::-webkit-scrollbar {
        display: none;
      }

      .available-button {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 100%;
      }
      
      .available-text {
        font-size: 10px;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .timer-area {
        grid-area: timer;
        display: grid;
        grid-template-columns: repeat(8, 1fr);
        gap: 5px;
      }
      
      .timer-button {
        display: flex;
        align-items: center;
        justify-content: center;
        background-color: var(--button-bg);
        color: var(--button-fg);
        border: none;
        border-radius: 8px;
        cursor: pointer;
        font-size: 10px;
        min-width: 0;
        overflow: hidden;
        padding: 0 2px;
        cursor: default;
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
      }
      
      .extra-area {
        grid-area: extra;
        display: grid;
        gap: 5px;
      }
      
      .extra-button {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        background-color: rgb(0,0,0,0);
        color: var(--button);
        border: none;
        cursor: pointer;
        min-width: 0;
        overflow: visible;
        cursor: default;
        height: 100%;
        padding: 0;     
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
      
      .mode-button {
        background-color: var(--button-bg);
        color: var(--button-fg);
        border: none;
        border-radius: 8px;
        cursor: pointer;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        flex: 1;
        min-width: 0;
        position: relative;
        cursor: default;
      }

      .fan-button {
        position: relative;
        width: 100%;
        height: 100%;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .fan-button-icon {
        --mdc-icon-size: 16px;
        width: 16px;
        height: 16px;
        display: flex;
        justify-content: center;
        align-items: center;
        transform-origin: center;
      }

      .active-fan-button-icon {
        animation: spin var(--fan-speed, 2s) linear infinite;
        color: var(--active-color);
      }

      .fan-text {
        position: absolute;
        font-size: 8px;
        font-weight: bold;
        bottom: 0px;
        right: 0px; 
        border-radius: 4px;
        height: 8px;
        display: flex;
        align-items: center;
        justify-content: center;
        line-height: 1;
        padding: 1px 2px;  
        background-color: var(--button-bg);  
      }
      
      .active-mode {
        color: var(--active-color) !important;
      }
      
      .active-extra {
        color: var(--active-color) !important;
      }
  `;
  }

  constructor() {
    super();
    this.hass = {};
    this.config = {};
    this.buttons = [];
    this.theme = 'on';
    this.width = '100%';
    this._timerInterval = null;
    this.humidifierData = [];
    this.canvas = null;
    this.ctx = null;
  }

  _evaluateTheme() {
    try {
      if (!this.config || !this.config.theme) return 'on';
      if (typeof this.config.theme === 'function') {
          return this.config.theme();
      }
      if (typeof this.config.theme === 'string' && 
              (this.config.theme.includes('return') || this.config.theme.includes('=>'))) {
          return (new Function(`return ${this.config.theme}`))();
      }
      return this.config.theme;
    } catch(e) {
      console.error('计算主题时出错:', e);
      return 'on';
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
    
    // 确定颜色
    let statusColor = theme === 'on' ? '#888888' : '#aaaaaa';
    if (state === 'on') statusColor = '#2ba0f3';
    
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
    if (!this.hass || !this.config.entity) {
        return html``;
    }

    const entity = this.hass.states[this.config.entity];
    if (!entity) {
        return html`<div>实体未找到: ${this.config.entity}</div>`;
    }
    const state = entity.state;
    const isOn = state !== 'off' && state !== 'unavailable' && state !== 'unknown';
    let marginBottom = (this.auto_show && isOn) ? '8px' : '0px';
    if (this.auto_show && !isOn) {
      return html``;
    }

    const attrs = entity.attributes;
    const humidity =  typeof attrs.current_humidity === 'number'  ? `${attrs.humidity.toFixed(0)}%`  : '';
    
    let current_humidity = '';
    if (this._externalHumidifierSensor) {
      const humidifierEntity = this.hass.states[this._externalHumidifierSensor];
      if (humidifierEntity && !isNaN(parseFloat(humidifierEntity.state))) {
        current_humidity = `室内: ${parseFloat(humidifierEntity.state).toFixed(0)}%`;
      }
    } else if (typeof entity.attributes.current_humidity === 'number') {
      current_humidity = `室内: ${entity.attributes.current_humidity.toFixed(0)}%`;
    }
    
    
    const theme = this._evaluateTheme();
    const fgColor = theme === 'on' ? 'rgb(0, 0, 0)' : 'rgb(255, 255, 255)';
    const bgColor = theme === 'on' ? 'rgb(255, 255, 255)' : 'rgb(50, 50, 50)';
    const buttonBg = theme === 'on' ? 'rgb(50,50,50)' : 'rgb(120,120,120)';
    const buttonFg = 'rgb(250,250,250)';

    let statusColor = 'rgb(250,250,250)';
    let linearColor = 'rgb(0,0,0,0)';
    if (state === 'on') statusColor = 'rgb(33,150,243)' ,linearColor = 'rgb(33,150,243)';
    else if (state === 'off') statusColor = 'rgb(250,250,250)';
    else if (state === 'unknown') statusColor = 'rgb(250,250,250)';
    else if (state === 'unavailable') statusColor = 'rgb(250,250,250)';

    const stateTranslations = {
        'on': '开启',
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
    const hasTimer = this.config.timer;
    const timerEntity = hasTimer ? this.hass.states[this.config.timer] : null;
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
      <div class="card" style=" margin-bottom: ${marginBottom};
                                width: ${this.width};
                                background: ${bgColor}; 
                                color: ${fgColor}; 
                                --button-bg: ${buttonBg}; 
                                --button-fg: ${buttonFg}; 
                                --active-color: ${statusColor};
                                --linear-color: ${linearColor};
                                grid-template-rows: ${gridHumidifierlateRows}">
																
        ${isOn ? html`<div class="active-gradient"></div>` : ''}
        <div id="chart-container"></div>
            <div class="content-container ${hasAvailableModes ? 'has-available-modes' : ''}">
                <div class="name-area">${attrs.friendly_name}</div>
                <div class="status-area" style="color: ${fgColor}">${hasAvailableModes && isOn ? this._translateAvailableModefanyi(attrs.mode) : translatedState}：
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
                    icon="${isOn ? 'mdi:fan' : 'mdi:fan-off'}"
                    style="color: ${isOn ? statusColor : ''}; ${isOn ? `--fan-speed: ${fanSpeed}` : ''}"
                ></ha-icon>
            </div>
        </div>

     

       

          ${hasAvailableModes ? html`
              <div class="fan-area">
                  ${this._renderAvailableButtons(attrs.available_modes, attrs.mode)}
              </div>
          ` : ''}

          ${hasFanModes  ? html`
              <div class="fan-area">
                  ${this._renderFanButtons(fanModes, currentFanMode)}
              </div>
          ` : ''}

          ${hasTimer ? html`
              <div class="timer-area">
                  ${this._renderTimerControls(timerEntity)}
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
      if (!this.auto_show || this.isOn) {
        this._startTimerRefresh();
    }
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
      }
  }

  _renderTimerControls(timerEntity) {
    if (!timerEntity) return html``;

    const humidifierEntity = this.hass.states[this.config.entity];
    const humidifierState = humidifierEntity ? humidifierEntity.state : 'off';
    
    let activeColor = 'rgb(255,255,255)';
    if (humidifierState === 'on') activeColor = 'rgb(33,150,243)';
    
    const now = new Date();
    const finishesAt = new Date(timerEntity.attributes.finishes_at || 0);
    let remainingSeconds = Math.max(0, Math.floor((finishesAt - now) / 1000));
  
    const state = timerEntity.state;
    if (state !== 'active') {
        remainingSeconds = 0;
    } else if (remainingSeconds <= 0) {
        this._turnOffHumidifier();
        this._cancelTimer();
        remainingSeconds = 0;
    }
    
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
      if (!this.config.timer) return;
      this._callService('timer', 'cancel', {
          entity_id: this.config.timer
      });
  }

  _setTimer(totalSeconds) {
      if (!this.config.timer) return;
      const now = new Date();
      const finishesAt = new Date(now.getTime() + totalSeconds * 1000);
      if (this.hass.states[this.config.timer].state === 'active') {
          this._callService('timer', 'cancel', {
              entity_id: this.config.timer
          });
      }
      this._callService('timer', 'start', {
          entity_id: this.config.timer,
          duration: this._formatSeconds(totalSeconds)
      });
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
      const fgColor = theme === 'on' ? 'rgb(0, 0, 0)' : 'rgb(255, 255, 255)';
      let activeColor = theme === 'on' ? 'rgba(00, 80, 80)' : 'rgba(180, 230, 230)';
      if (state === 'on') activeColor = 'rgb(33,150,243)';

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

  _renderModeButtons(modes, currentMode) {
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
                  style="color: ${isActive ? 'var(--active-color)' : ''}"
                  title="${this._translateMode(mode)}"
              >
                  <ha-icon class="icon" icon="${modeIcons[mode] || 'mdi:water'}" style="color: ${isActive ? 'var(--active-color)' : ''}"></ha-icon>
              </button>
          `;
      });
  }

  _renderFanButtons(fanModes, currentFanMode) {
    if (!fanModes || fanModes.length === 0) return html``;
    
    const entity = this.hass.states[this.config.entity];
    const isOn = entity?.state !== 'off';
    
    return fanModes.map((mode) => {
        const isActive = mode === currentFanMode && isOn;
        
        return html`
            <button 
                class="mode-button ${isActive ? 'active-mode' : ''}" 
                @click=${() => this._setFanOption(mode)}
                style="color: ${isActive ? 'var(--active-color)' : ''}"
            >
                <div class="fan-button">
                    <ha-icon 
                        class="fan-button-icon" 
                        icon="mdi:water" 
                        style="color: ${isActive ? 'var(--active-color)' : ''}"
                    ></ha-icon>
                    <span class="fan-text">${this._translateFanMode(mode)}</span>
                </div>
            </button>
        `;
    });
  }

  _renderAvailableButtons(availableModes, currentAvailableMode) {
    if (!availableModes) return html``;
    
    return availableModes.map(mode => {
        const isActive = mode === currentAvailableMode;
        return html`
            <button 
                class="mode-button ${isActive ? 'active-mode' : ''}" 
                @click=${() => this._setAvailableMode(mode)}
                style="color: ${isActive ? 'var(--active-color)' : ''}"
            >
                <div class="available-button">
                    <ha-icon class="icon" icon="${this._getAvailableIcon(mode)}" style="color: ${isActive ? 'var(--active-color)' : ''}"></ha-icon>
                    <span class="available-text">${this._translateAvailableMode(mode)}</span>
                </div>
            </button>
        `;
    });
  }

  _getAvailableIcon(mode) {
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

  _translateAvailableMode(mode) {
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

  _translateAvailableModefanyi(mode) {
    const translations = {
        'Off': '关闭',
        'Constant Humidity': '舒适',
        'Sleep': '睡眠',
        'Strong': '强力',
    };
    return translations[mode] || mode;
  }

  _translateMode(mode) {
      const translations = {
          'on': '加湿',
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
} 
customElements.define('xiaoshi-phone-humidifier-card', XiaoshiPhoneHumidifierCard);


