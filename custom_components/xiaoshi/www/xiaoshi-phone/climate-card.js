import { LitElement, html, css } from "https://unpkg.com/lit-element@2.4.0/lit-element.js?module";

window.customCards = window.customCards || [];
window.customCards.push({
    type: 'xiaoshi-phone-climate-card',
    name: '消逝卡(移动端)-空调/水暖毯/热水器卡',
    description: '移动端空调/水暖毯/热水器卡',
    preview: true
}); 

class XiaoshiPhoneClimateCardEditor extends LitElement {
  static get properties() {
    return {
      hass: { type: Object },
      config: { type: Object },
      _searchTerm: { type: String },
      _filteredEntities: { type: Array },
      _showEntityList: { type: Boolean },
      _temperatureSearchTerm: { type: String },
      _filteredTemperatureEntities: { type: Array },
      _showTemperatureList: { type: Boolean },
      _timerSearchTerm: { type: String },
      _filteredTimerEntities: { type: Array },
      _showTimerList: { type: Boolean },
      _buttonSearchTerms: { type: Object },
      _filteredButtonEntities: { type: Object },
      _showButtonLists: { type: Object },
      _button2SearchTerms: { type: Object },
      _filteredButton2Entities: { type: Object },
      _showButton2Lists: { type: Object },
      _availableModes: { type: Object }
    };
  }

  setConfig(config) {
    this.config = config || {};

    // 如果已经有选择的实体，则自动识别其可用模式
    if (this.config.entity && this.hass && this.hass.states[this.config.entity]) {
      this._detectAvailableModes(this.config.entity);
    }
  }

  firstUpdated() {
    // 点击外部关闭下拉列表
    document.addEventListener('click', (e) => {
      if (!e.target.closest('.entity-selector')) {
        this._showEntityList = false;
        this._showTemperatureList = false;
        this._showTimerList = false;

        // 关闭所有按钮的下拉列表
        if (this._showButtonLists) {
          Object.keys(this._showButtonLists).forEach(key => {
            this._showButtonLists[key] = false;
          });
        }
        if (this._showButton2Lists) {
          Object.keys(this._showButton2Lists).forEach(key => {
            this._showButton2Lists[key] = false;
          });
        }

        this.requestUpdate();
      }
    });
  }

  _onMainEntitySearch(e) {
    const searchTerm = e.target.value.toLowerCase();
    this._searchTerm = searchTerm;
    this._showEntityList = true;

    if (!this.hass) return;

    // 获取所有实体
    const allEntities = Object.values(this.hass.states);

    // 过滤实体，只显示 climate 和 water_heater 开头的实体
    this._filteredEntities = allEntities.filter(entity => {
      const entityId = entity.entity_id.toLowerCase();
      const friendlyName = (entity.attributes.friendly_name || '').toLowerCase();

      // 只显示 climate. 和 water_heater. 开头的实体
      const isClimateEntity = entityId.startsWith('climate.') || entityId.startsWith('water_heater.');
      const matchesSearch = entityId.includes(searchTerm) || friendlyName.includes(searchTerm);

      return isClimateEntity && matchesSearch;
    }).slice(0, 50); // 限制显示数量

    this.requestUpdate();
  }

  _selectMainEntity(entityId) {
    this.config = {
      ...this.config,
      entity: entityId
    };

    this._searchTerm = ''; // 清空搜索词
    this._showEntityList = false; // 关闭下拉列表

    // 自动识别实体的可用模式
    this._detectAvailableModes(entityId);

    this._fireEvent();
    this.requestUpdate();
  }

  _detectAvailableModes(entityId) {
    if (!this.hass || !this.hass.states[entityId]) return;

    const attrs = this.hass.states[entityId].attributes;
    this._availableModes = {
      hasHvacModes: attrs.hvac_modes && attrs.hvac_modes.length > 0,
      hasFanModes: attrs.fan_modes && attrs.fan_modes.length > 0,
      hasSwingModes: attrs.swing_modes && attrs.swing_modes.length > 0,
      hasPresetModes: attrs.preset_modes && attrs.preset_modes.length > 0,
      hasWaterModes: attrs.operation_list && attrs.operation_list.length > 0
    };

    // 如果用户没有手动配置显示选项，则根据自动识别结果设置默认值
    const updates = {};
    if (this.config.show_hvac_modes === undefined) {
      updates.show_hvac_modes = this._availableModes.hasHvacModes;
    }
    if (this.config.show_fan_modes === undefined) {
      updates.show_fan_modes = this._availableModes.hasFanModes;
    }
    if (this.config.show_swing_modes === undefined) {
      updates.show_swing_modes = this._availableModes.hasSwingModes;
    }
    if (this.config.show_preset_modes === undefined) {
      updates.show_preset_modes = this._availableModes.hasPresetModes;
    }
    if (this.config.show_water_modes === undefined) {
      updates.show_water_modes = this._availableModes.hasWaterModes;
    }
    if (Object.keys(updates).length > 0) {
      this.config = { ...this.config, ...updates };
    }
  }

  _onTemperatureSearch(e) {
    const searchTerm = e.target.value.toLowerCase();
    this._temperatureSearchTerm = searchTerm;
    this._showTemperatureList = true;

    if (!this.hass) return;

    // 获取所有实体
    const allEntities = Object.values(this.hass.states);

    // 过滤实体，只显示 sensor 开头的实体
    this._filteredTemperatureEntities = allEntities.filter(entity => {
      const entityId = entity.entity_id.toLowerCase();
      const friendlyName = (entity.attributes.friendly_name || '').toLowerCase();

      // 只显示 sensor. 开头的实体
      const isSensorEntity = entityId.startsWith('sensor.');
      const matchesSearch = entityId.includes(searchTerm) || friendlyName.includes(searchTerm);

      return isSensorEntity && matchesSearch;
    }).slice(0, 50); // 限制显示数量

    this.requestUpdate();
  }

  _selectTemperature(entityId) {
    this.config = {
      ...this.config,
      temperature: entityId
    };

    this._temperatureSearchTerm = ''; // 清空搜索词
    this._showTemperatureList = false; // 关闭下拉列表

    this._fireEvent();
    this.requestUpdate();
  }

  _onTimerSearch(e) {
    const searchTerm = e.target.value.toLowerCase();
    this._timerSearchTerm = searchTerm;
    this._showTimerList = true;

    if (!this.hass) return;

    // 获取所有实体
    const allEntities = Object.values(this.hass.states);

    // 过滤实体，只显示 timer 开头的实体
    this._filteredTimerEntities = allEntities.filter(entity => {
      const entityId = entity.entity_id.toLowerCase();
      const friendlyName = (entity.attributes.friendly_name || '').toLowerCase();

      // 只显示 timer. 开头的实体
      const isTimerEntity = entityId.startsWith('timer.');
      const matchesSearch = entityId.includes(searchTerm) || friendlyName.includes(searchTerm);

      return isTimerEntity && matchesSearch;
    }).slice(0, 50); // 限制显示数量

    this.requestUpdate();
  }

  _selectTimer(entityId) {
    this.config = {
      ...this.config,
      timer: entityId
    };

    this._timerSearchTerm = ''; // 清空搜索词
    this._showTimerList = false; // 关闭下拉列表

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

  _selectButton2(entityId, index2) {
    const buttons2 = [...(this.config.buttons2 || [])];
    buttons2[index2] = entityId;

    this.config = {
      ...this.config,
      buttons2
    };

    if (!this._button2SearchTerms) this._button2SearchTerms = {};
    if (!this._showButton2Lists) this._showButton2Lists = {};

    this._button2SearchTerms[index2] = '';
    this._showButton2Lists[index2] = false;

    this._fireEvent();
    this.requestUpdate();
  }

  static get styles() {
    return css`
      .form {
        display: flex;
        flex-direction: column;
        gap: 10px;
        min-height: 500px;
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
      textarea {
        min-height: 80px;
        resize: vertical;
      }
      .help-text {
        font-size: 0.85em;
        color: #666;
        margin-top: 4px;
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

      .buttons-row {
        display: flex;
        align-items: center;
        margin-top: 8px;
      }
      .add-button {
        margin-left: 8px;
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
      .hint {
        font-size: 0.85em;
        color: #888;
        margin-top: 4px;
      }

      .refresh-button {
        transition: all 0.2s ease;
      }

      .refresh-button:hover {
        background-color: rgba(33, 150, 243, 0.1);
        transform: translateY(-1px);
        box-shadow: 0 2px 4px rgba(33, 150, 243, 0.2);
      }

      .mode-indicator {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
        margin-bottom: 8px;
      }

      .mode-badge {
        padding: 4px 8px;
        border-radius: 4px;
        font-size: 11px;
        font-weight: 500;
      }

      .mode-badge.has-mode {
        background-color: #e8f5e9;
        color: #2e7d32;
      }

      .mode-badge.no-mode {
        background-color: #ffebee;
        color: #c62828;
      }
    `;
  }

  render() {
    if (!this.hass) return html``;

    return html`
      <div class="form">
        <!-- 主实体选择 -->
        <div class="form-group">
          <label>空调/水暖毯/热水器实体 (必选)</label>
          <div class="entity-selector">
            <input
              type="text"
              @input=${this._onMainEntitySearch}
              @focus=${this._onMainEntitySearch}
              .value=${this._searchTerm || this.config?.entity || ''}
              placeholder="搜索实体..."
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
        </div>

        <!-- 模式显示选项 -->
        ${this.config.entity ? html`
          <div class="form-group">
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <label>模式显示控制</label>
              <mwc-button
                @click=${() => this._detectAvailableModes(this.config.entity)}
                outlined
                class="refresh-button"
                style="font-size: 11px; padding: 4px 8px;"
              >
                刷新检测
              </mwc-button>
            </div>
            <div class="mode-indicator">
              ${this._availableModes?.hasHvacModes ?
                html`<div class="mode-badge has-mode">✓ 模式(hvac_modes)</div>` :
                html`<div class="mode-badge no-mode">✗ 模式(hvac_modes)</div>`}
              ${this._availableModes?.hasFanModes ?
                html`<div class="mode-badge has-mode">✓ 风速(fan_modes)</div>` :
                html`<div class="mode-badge no-mode">✗ 风速(fan_modes)</div>`}
              ${this._availableModes?.hasSwingModes ?
                html`<div class="mode-badge has-mode">✓ 风向(swing_modes)</div>` :
                html`<div class="mode-badge no-mode">✗ 风向(swing_modes)</div>`}
              ${this._availableModes?.hasPresetModes ?
                html`<div class="mode-badge has-mode">✓ 水暖毯模式(preset_modes)</div>` :
                html`<div class="mode-badge no-mode">✗ 水暖毯模式(preset_modes)</div>`}
              ${this._availableModes?.hasWaterModes ?
                html`<div class="mode-badge has-mode">✓ 热水器模式(operation_list)</div>` :
                html`<div class="mode-badge no-mode">✗ 热水器模式(operation_list)</div>`}
            </div>
            ${Object.keys(this._availableModes).length === 0 ? html`
              <div style="color: #666; font-size: 12px; margin-bottom: 8px;">
                点击"刷新检测"按钮来识别实体支持的模式
              </div>
            ` : ''}
            <div style="display: flex; flex-direction: column; gap: 8px; margin-top: 8px;">
              ${this._availableModes?.hasHvacModes ? html`
                <div style="display: flex; align-items: center; gap: 8px;">
                  <ha-switch
                    .checked=${this.config.show_hvac_modes !== false}
                    @change=${this._showHvacModesChanged}
                  ></ha-switch>
                  <span>显示模式按钮</span>
                </div>
              ` : ''}
              ${this._availableModes?.hasFanModes ? html`
                <div style="display: flex; align-items: center; gap: 8px;">
                  <ha-switch
                    .checked=${this.config.show_fan_modes !== false}
                    @change=${this._showFanModesChanged}
                  ></ha-switch>
                  <span>显示风速按钮</span>
                </div>
              ` : ''}
              ${this._availableModes?.hasSwingModes ? html`
                <div style="display: flex; align-items: center; gap: 8px;">
                  <ha-switch
                    .checked=${this.config.show_swing_modes !== false}
                    @change=${this._showSwingModesChanged}
                  ></ha-switch>
                  <span>显示风向按钮</span>
                </div>
              ` : ''}
              ${this._availableModes?.hasPresetModes ? html`
                <div style="display: flex; align-items: center; gap: 8px;">
                  <ha-switch
                    .checked=${this.config.show_preset_modes !== false}
                    @change=${this._showPresetModesChanged}
                  ></ha-switch>
                  <span>显示水暖毯模式按钮</span>
                </div>
              ` : ''}
              ${this._availableModes?.hasWaterModes ? html`
                <div style="display: flex; align-items: center; gap: 8px;">
                  <ha-switch
                    .checked=${this.config.show_water_modes !== false}
                    @change=${this._showWaterModesChanged}
                  ></ha-switch>
                  <span>显示热水器模式按钮</span>
                </div>
              ` : ''}
            </div>
          </div>
        ` : ''}

        <!-- 温度传感器 -->
        <div class="form-group">
          <label>温度传感器 (可选)</label>
          <div class="entity-selector-with-remove">
            <div class="entity-selector">
              <input
                type="text"
                @input=${this._onTemperatureSearch}
                @focus=${this._onTemperatureSearch}
                .value=${this._temperatureSearchTerm || this.config.temperature || ''}
                placeholder="搜索传感器..."
                class="entity-search-input"
              />
              ${this._showTemperatureList ? html`
                <div class="entity-dropdown">
                  ${this._filteredTemperatureEntities.map(entity => html`
                    <div
                      class="entity-option ${this.config.temperature === entity.entity_id ? 'selected' : ''}"
                      @click=${() => this._selectTemperature(entity.entity_id)}
                    >
                      <div class="entity-info">
                        <ha-icon icon="${entity.attributes.icon || 'mdi:help-circle'}"></ha-icon>
                        <div class="entity-details">
                          <div class="entity-name">${entity.attributes.friendly_name || entity.entity_id}</div>
                          <div class="entity-id">${entity.entity_id}</div>
                        </div>
                      </div>
                      ${this.config.temperature === entity.entity_id ?
                        html`<ha-icon icon="mdi:check" class="check-icon"></ha-icon>` : ''}
                    </div>
                  `)}
                  ${this._filteredTemperatureEntities.length === 0 ? html`
                    <div class="no-results">未找到匹配的实体</div>
                  ` : ''}
                </div>
              ` : ''}
            </div>
            <button class="remove-button" @click=${this._removeTemperature} title="移除温度传感器">
              <ha-icon icon="mdi:close"></ha-icon>
            </button>
          </div>
        </div>

        <!-- 定时器 -->
        <div class="form-group">
          <label>定时器实体 (可选)</label>
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
                        <ha-icon icon="${entity.attributes.icon || 'mdi:help-circle'}"></ha-icon>
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

        <!-- 附加按钮 -->
        <div class="form-group">
          <label>附加按钮 (最多7个)</label>
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
                      <div
                        class="entity-option ${button === entity.entity_id ? 'selected' : ''}"
                        @click=${() => this._selectButton(entity.entity_id, index)}
                      >
                        <div class="entity-info">
                          <ha-icon icon="${entity.attributes.icon || 'mdi:help-circle'}"></ha-icon>
                          <div class="entity-details">
                            <div class="entity-name">${entity.attributes.friendly_name || entity.entity_id}</div>
                            <div class="entity-id">${entity.entity_id}</div>
                          </div>
                        </div>
                        ${button === entity.entity_id ?
                          html`<ha-icon icon="mdi:check" class="check-icon"></ha-icon>` : ''}
                      </div>
                    `)}
                    ${this._filteredButtonEntities?.[index]?.length === 0 ? html`
                      <div class="no-results">未找到匹配的实体</div>
                    ` : ''}
                  </div>
                ` : ''}
              </div>
              <button class="remove-button" @click=${() => this._removeButton(index)} title="移除此按钮">
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
          <div class="help-text">
            添加按钮实体，支持 switch、light、button、sensor、select 类型
          </div>
        </div>

        <!-- 附加按钮2 -->
        <div class="form-group">
          <label>附加按钮(第2排) (最多7个)</label>
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
                      <div
                        class="entity-option ${button2 === entity.entity_id ? 'selected' : ''}"
                        @click=${() => this._selectButton2(entity.entity_id, index2)}
                      >
                        <div class="entity-info">
                          <ha-icon icon="${entity.attributes.icon || 'mdi:help-circle'}"></ha-icon>
                          <div class="entity-details">
                            <div class="entity-name">${entity.attributes.friendly_name || entity.entity_id}</div>
                            <div class="entity-id">${entity.entity_id}</div>
                          </div>
                        </div>
                        ${button2 === entity.entity_id ?
                          html`<ha-icon icon="mdi:check" class="check-icon"></ha-icon>` : ''}
                      </div>
                    `)}
                    ${this._filteredButton2Entities?.[index2]?.length === 0 ? html`
                      <div class="no-results">未找到匹配的实体</div>
                    ` : ''}
                  </div>
                ` : ''}
              </div>
              <button class="remove-button" @click=${() => this._removeButton2(index2)} title="移除此按钮">
                <ha-icon icon="mdi:close"></ha-icon>
              </button>
            </div>
          `)}
          ${(!this.config.buttons2 || this.config.buttons2.length < 7) ? html`
            <div class="buttons-row">
              <mwc-button
                class="add-button"
                @click=${this._addButton2}
                outlined
              >
                添加按钮(第2排)
              </mwc-button>
            </div>
          ` : ''}
          <div class="help-text">
            第二排按钮，最多支持7个
          </div>
        </div>

        <!-- 自动隐藏选项 -->
        <div class="form-group">
          <label>显示选项</label>
          <div style="display: flex; align-items: center; gap: 8px;">
            <ha-switch
              .checked=${!!this.config.auto_show}
              @change=${this._autoShowChanged}
            ></ha-switch>
            <span>空调关闭时隐藏卡片</span>
          </div>
        </div>

        <!-- 宽度设置 -->
        <div class="form-group">
          <label>卡片宽度：支持像素(px)和百分比(%)，默认100%</label>
          <input
            type="text"
            @change=${this._widthChanged}
            .value=${this.config.width !== undefined ? this.config.width : '100%'}
            name="width"
            placeholder="默认100%"
          />
          <div class="help-text">
            输入宽度值，例如：100%、300px
          </div>
        </div>


      </div>
    `;
  }

	_valueChanged(ev) {
		if (!this.config) return;  // 移除了 !ev.detail.value 检查，允许空值
		const configValue = ev.target.configValue;
		const value = ev.detail.value;
		
		// 如果值为空，则删除该配置项
		if (!value) {
			const newConfig = { ...this.config };
			delete newConfig[configValue];
			this.config = newConfig;
		} else {
			this.config = { 
				...this.config,
				[configValue]: value 
			};
		}
		this._fireEvent();
	}

	_buttonChanged(ev, index) {
		// 此方法已弃用，改用 _selectButton 方法
		if (!this.config) return;
		const buttons = [...(this.config.buttons || [])];

		// 如果值为空，则删除该按钮
		if (!ev.detail.value) {
			buttons.splice(index, 1);
		} else {
			buttons[index] = ev.detail.value;
		}

		this.config = {
			...this.config,
			buttons: buttons.length > 0 ? buttons : undefined
		};
		this._fireEvent();
	}

	_buttonChanged2(ev2, index2) {
		// 此方法已弃用，改用 _selectButton2 方法
		if (!this.config) return;
		const buttons2 = [...(this.config.buttons2 || [])];

		// 如果值为空，则删除该按钮
		if (!ev2.detail.value) {
			buttons2.splice(index2, 1);
		} else {
			buttons2[index2] = ev2.detail.value;
		}

		this.config = {
			...this.config,
			buttons2: buttons2.length > 0 ? buttons2 : undefined
		};
		this._fireEvent();
	}

	_addButton() {
		const buttons = [...(this.config.buttons || [])];
		if (buttons.length >= 7) return;
		buttons.push('');

		// 重置该按钮的搜索状态
		const newIndex = buttons.length - 1;
		if (!this._buttonSearchTerms) this._buttonSearchTerms = {};
		if (!this._filteredButtonEntities) this._filteredButtonEntities = {};
		if (!this._showButtonLists) this._showButtonLists = {};

		this._buttonSearchTerms[newIndex] = '';
		this._filteredButtonEntities[newIndex] = [];
		this._showButtonLists[newIndex] = false;

		this.config = {
			...this.config,
			buttons
		};
		this._fireEvent();
	}

	_addButton2() {
		const buttons2 = [...(this.config.buttons2 || [])];
		if (buttons2.length >= 7) return;
		buttons2.push('');

		// 重置该按钮的搜索状态
		const newIndex = buttons2.length - 1;
		if (!this._button2SearchTerms) this._button2SearchTerms = {};
		if (!this._filteredButton2Entities) this._filteredButton2Entities = {};
		if (!this._showButton2Lists) this._showButton2Lists = {};

		this._button2SearchTerms[newIndex] = '';
		this._filteredButton2Entities[newIndex] = [];
		this._showButton2Lists[newIndex] = false;

		this.config = {
			...this.config,
			buttons2
		};
		this._fireEvent();
	}

  _removeButton(index) {
    const buttons = [...(this.config.buttons || [])];
    buttons.splice(index, 1);

    // 清理该按钮的搜索状态
    if (this._buttonSearchTerms) {
      delete this._buttonSearchTerms[index];
    }
    if (this._filteredButtonEntities) {
      delete this._filteredButtonEntities[index];
    }
    if (this._showButtonLists) {
      delete this._showButtonLists[index];
    }

    this.config = {
      ...this.config,
      buttons: buttons.length > 0 ? buttons : undefined
    };
    this._fireEvent();
    this.requestUpdate();
  }

  _removeButton2(index2) {
    const buttons2 = [...(this.config.buttons2 || [])];
    buttons2.splice(index2, 1);

    // 清理该按钮的搜索状态
    if (this._button2SearchTerms) {
      delete this._button2SearchTerms[index2];
    }
    if (this._filteredButton2Entities) {
      delete this._filteredButton2Entities[index2];
    }
    if (this._showButton2Lists) {
      delete this._showButton2Lists[index2];
    }

    this.config = {
      ...this.config,
      buttons2: buttons2.length > 0 ? buttons2 : undefined
    };
    this._fireEvent();
    this.requestUpdate();
  }

  _removeTemperature() {
    if (!this.config) return;

    this._temperatureSearchTerm = '';
    this._showTemperatureList = false;
    this._filteredTemperatureEntities = [];

    this.config = {
      ...this.config,
      temperature: undefined
    };
    this._fireEvent();
    this.requestUpdate();
  }

  _removeTimer() {
    if (!this.config) return;

    this._timerSearchTerm = '';
    this._showTimerList = false;
    this._filteredTimerEntities = [];

    this.config = {
      ...this.config,
      timer: undefined
    };
    this._fireEvent();
    this.requestUpdate();
  }

  _themeSelectChanged(e) {
    if (!this.config) return;
    const theme = e.target.value;

    this.config = {
      ...this.config,
      theme
    };
    this._fireEvent();
  }

  _themeSwitchChanged(ev) {
    if (!this.config) return;
    const theme = ev.target.checked ? 'light' : 'dark';

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

  _widthChanged(e) {
    if (!this.config) return;
    const { name, value } = e.target;

    let finalValue = value;

    // 处理默认值
    if (name === 'width') {
      finalValue = value || '100%';
    }

    this.config = {
      ...this.config,
      [name]: finalValue
    };
    this._fireEvent();
  }

  _showHvacModesChanged(ev) {
    if (!this.config) return;
    this.config = {
      ...this.config,
      show_hvac_modes: ev.target.checked
    };
    this._fireEvent();
  }

  _showFanModesChanged(ev) {
    if (!this.config) return;
    this.config = {
      ...this.config,
      show_fan_modes: ev.target.checked
    };
    this._fireEvent();
  }

  _showSwingModesChanged(ev) {
    if (!this.config) return;
    this.config = {
      ...this.config,
      show_swing_modes: ev.target.checked
    };
    this._fireEvent();
  }

  _showPresetModesChanged(ev) {
    if (!this.config) return;
    this.config = {
      ...this.config,
      show_preset_modes: ev.target.checked
    };
    this._fireEvent();
  }

  _showWaterModesChanged(ev) {
    if (!this.config) return;
    this.config = {
      ...this.config,
      show_water_modes: ev.target.checked
    };
    this._fireEvent();
  }

  _fireEvent() {
    this.dispatchEvent(new CustomEvent('config-changed', {
      detail: { config: this.config }
    }));
  }

  constructor() {
    super();
    this._searchTerm = '';
    this._filteredEntities = [];
    this._showEntityList = false;
    this._temperatureSearchTerm = '';
    this._filteredTemperatureEntities = [];
    this._showTemperatureList = false;
    this._timerSearchTerm = '';
    this._filteredTimerEntities = [];
    this._showTimerList = false;
    this._buttonSearchTerms = {};
    this._filteredButtonEntities = {};
    this._showButtonLists = {};
    this._button2SearchTerms = {};
    this._filteredButton2Entities = {};
    this._showButton2Lists = {};
    this._availableModes = {};
  }
}
customElements.define('xiaoshi-phone-climate-card-editor', XiaoshiPhoneClimateCardEditor);

class XiaoshiPhoneClimateCard extends LitElement {
  static get properties() { 
    return {
      hass: { type: Object },
      width: { type: String, attribute: true },
      config: { type: Object },
      buttons: { type: Array },
      theme: { type: String },
      _timerInterval: { state: true },
      auto_show: { type: Boolean },
      temperatureData: { type: Array },
      _externalTempSensor: { type: String } 
    };
  }
  static getConfigElement() {
    return document.createElement("xiaoshi-phone-climate-card-editor");
  }

  static getStubConfig() {
    return {
      entity: "",
      temperature: "",
      timer: "",
      theme: "system",
      buttons: [],
      buttons2: [],
      auto_show: false,
      width: "100%"
    };
  }

  setConfig(config) {
    this.config = config;
    this.buttons = config.buttons || [];
    this.buttons2 = config.buttons2 || [];
    this.auto_show = config.auto_show || false;
    this._externalTempSensor = config.temperature || null;
    if (config.width !== undefined) this.width = config.width;
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
            "name status power"
            "icon modes modes"
            "icon fan fan "
            "icon preset preset"
            "icon swing swing"
            "icon water water"
            "icon timer timer"
            "icon extra extra"
            "icon extra2 extra2"
            "a a a"; 
        grid-template-columns: 25% 60% 13%;
        grid-template-rows: auto auto auto auto auto auto auto auto auto 4px;
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
      .temp-adjust-container {
        display: inline-flex;
        align-items: center;
        gap: 1px;
      }
      .temp-adjust-button {
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

      .temp-display {
        font-size: 12px;
        min-width: 35px;
        text-align: center;
        color: var(--button);;
      }
      .current-temp {
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
        --mdc-icon-size: 50px;
        margin-top: -3px;
        transition: transform 0.3s ease;
      }

      .active-main-icon {
        animation: spin var(--fan-speed, 2s) linear infinite;
        color: var(--active-color);
      }

      @keyframes spin {
        from { transform: rotate(0deg); }
        to { transform: rotate(360deg); }
      }

      .modes-area, .fan-area, .swing-area, .preset-area, .water-area,.timer-area, .extra-area ,.extra2-area{
        display: flex;
        gap: 5px;
        width: 100%;
        height: 25px;
        margin-bottom: 5px;
      }
      
      .modes-area {
        grid-area: modes;
      }
      
      .fan-area {
        grid-area: fan;
        overflow-x: auto;
        scrollbar-width: none;
      }
      
      .fan-area::-webkit-scrollbar {
        display: none;
      }
      
      .swing-area {
        grid-area: swing;
        overflow-x: auto;
        scrollbar-width: none;
      }
      
      .swing-area::-webkit-scrollbar {
        display: none;
      }

      .preset-area {
        grid-area: preset;
        overflow-x: auto;
        scrollbar-width: none;
      }
      
      .preset-area::-webkit-scrollbar {
        display: none;
      }

      .water-area {
        grid-area: water;
        overflow-x: auto;
        scrollbar-width: none;
      }
      
      .water-area::-webkit-scrollbar {
        display: none;
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

      .extra2-area {
        grid-area: extra2;
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
      
      .swing-button {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 100%;
      }
      
      .swing-text {
        font-size: 10px;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .preset-button {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 100%;
        --mdc-icon-size: 10px;
      }
      
      .preset-text {
        display: flex;
        font-size: 6px;
        overflow: hidden;
        white-space: nowrap;        
        position: absolute;
        bottom: 0px;
        right: 0px; 
        padding: 1px 6px 1px 0;  
        white-space: normal;
        border-radius: 4px;
        align-items: center;
        justify-content: center;
        line-height: 1;
        background-color: var(--button-bg);  
      }
      
      .water-button {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 100%;
        padding: 0;
        margin: 0;
      }
      
      .water-text {
        display: block;
        font-size: 8px;
        overflow: hidden;
        white-space: nowrap;
        text-overflow: ellipsis;
        padding: 0;
        margin: 0;
        width: 100%;
        box-sizing: border-box;
        position: absolute;
        left: 0;
        right: 0;
        text-align: center;
        line-height: 1;
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
    this.buttons2 = [];
    this.theme = 'system';
    this.width = '100%';
    this._timerInterval = null;
    this.temperatureData = [];
    this.canvas = null;
    this.ctx = null;
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
          if (mode === 'function' || (typeof mode === 'string' && mode.includes('theme()'))) {
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
    if (!this.hass) return;

    const now = new Date();
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const entityId = this._externalTempSensor || this.config.entity;
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
    
    // 清除现有画布
    while (container.firstChild) {
        container.removeChild(container.firstChild);
    }
    
    // 创建新画布
    this.canvas = document.createElement('canvas');
    this.canvas.className = 'temperature-chart';
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
    if (!this.ctx || !this.temperatureData || this.temperatureData.length === 0) return;
    
    const entity = this.hass.states[this.config.entity];
    const state = entity?.state || 'off';
    const theme = this._evaluateTheme();
    
    // 确定颜色
    let statusColor = theme === 'light' ? '#888888' : '#aaaaaa';
    if (state === 'cool') statusColor = '#2ba0f3';
    else if (state === 'heat') statusColor = '#fe6f21';
    else if (state === '自定义') statusColor = '#fe6f21';
    else if (state === 'AI控温') statusColor = '#fe6f21';
    else if (state === '婴童洗') statusColor = '#fe6f21';
    else if (state === '舒适洗') statusColor = '#fe6f21';
    else if (state === '宠物洗') statusColor = '#fe6f21';
    else if (state === '厨房用') statusColor = '#fe6f21';
    else if (state === 'dry') statusColor = '#ff9700';
    else if (state === 'fan' || state === 'fan_only') statusColor = '#00bcd5';
    else if (state === 'auto') statusColor = '#ee82ee';
    
    // 获取画布尺寸（CSS像素）
    const canvas = this.canvas;
    const ctx = this.ctx;
    const scale = window.devicePixelRatio || 1;
    const width = canvas.width / scale;
    const height = canvas.height / scale;
    
    // 清除画布（使用物理像素尺寸）
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // 计算温度范围
    const minTemp = Math.min(...this.temperatureData) - 1;
    const maxTemp = Math.max(...this.temperatureData);
    const tempRange = Math.max(maxTemp - minTemp, 0.1);
    const xStep = width / (this.temperatureData.length - 1);
    
    // 创建点集
    const points = this.temperatureData.map((temp, i) => {
        return {
            x: i * xStep,
            y: height - ((temp - minTemp) / tempRange) * height,
            value: temp
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
    const temperature =  typeof attrs.temperature === 'number'  ? `${attrs.temperature.toFixed(1)}°C`  : '';
    
    let current_temperature = '';
    if (this._externalTempSensor) {
      const tempEntity = this.hass.states[this._externalTempSensor];
      if (tempEntity && !isNaN(parseFloat(tempEntity.state))) {
        current_temperature = `室温: ${parseFloat(tempEntity.state).toFixed(1)}°C`;
      }
    } else if (typeof entity.attributes.current_temperature === 'number') {
      current_temperature = `室温: ${entity.attributes.current_temperature.toFixed(1)}°C`;
    }
    
    
    const theme = this._evaluateTheme();
    const fgColor = theme === 'light' ? 'rgb(0, 0, 0)' : 'rgb(255, 255, 255)';
    const bgColor = theme === 'light' ? 'rgb(255, 255, 255)' : 'rgb(50, 50, 50)';
    const buttonBg = theme === 'light' ? 'rgb(50,50,50)' : 'rgb(120,120,120)';
    const buttonFg = 'rgb(250,250,250)';

    let statusColor = 'rgb(250,250,250)';
    let linearColor = 'rgb(0,0,0,0)';
    if (state === 'cool') statusColor = 'rgb(33,150,243)',linearColor = 'rgb(33,150,243)';
    else if (state === 'heat') statusColor = 'rgb(254,111,33)',linearColor = 'rgb(254,111,33)';
    else if (state === '自定义') statusColor = '#fe6f21',linearColor = '#fe6f21';
    else if (state === 'AI控温') statusColor = '#fe6f21',linearColor = '#fe6f21';
    else if (state === '婴童洗') statusColor = '#fe6f21',linearColor = '#fe6f21'; 
    else if (state === '舒适洗') statusColor = '#fe6f21',linearColor = '#fe6f21';
    else if (state === '宠物洗') statusColor = '#fe6f21',linearColor = '#fe6f21';
    else if (state === '厨房用') statusColor = '#fe6f21',linearColor = '#fe6f21';
    else if (state === 'dry') statusColor = 'rgb(255,151,0)', linearColor = 'rgb(255,151,0)';
    else if (state === 'fan' || state === 'fan_only') statusColor = 'rgb(0,188,213)', linearColor = 'rgb(0,188,213)';
    else if (state === 'auto') statusColor = 'rgb(147,112,219)', linearColor = 'rgb(147,112,219)';
    else if (state === 'off') statusColor = 'rgb(250,250,250)';
    else if (state === 'unknown') statusColor = 'rgb(250,250,250)';
    else if (state === 'unavailable') statusColor = 'rgb(250,250,250)';

    const stateTranslations = {
        'cool': '制冷',
        'heat': '制热',
        'dry': '除湿',
        'fan': '吹风',
        'fan_only': '吹风',
        'auto': '自动',
        'off': '关闭',
        'unknown': '未知',
        'unavailable': '离线'
    };
    const translatedState = stateTranslations[state] || state;

    const hasHvacModes = attrs.hvac_modes && attrs.hvac_modes.length > 0;
    const hasFanModes = attrs.fan_modes && attrs.fan_modes.length > 0;
    const hasSwingModes = attrs.swing_modes && attrs.swing_modes.length > 0;
    const hasPresetModes = attrs.preset_modes && attrs.preset_modes.length > 0;
    const hasWaterModes = attrs.operation_list && attrs.operation_list.length > 0;

    // 使用配置中的显示选项（如果存在），否则使用自动识别结果
    const showHvacModes = this.config.show_hvac_modes !== false && hasHvacModes;
    const showFanModes = this.config.show_fan_modes !== false && hasFanModes;
    const showSwingModes = this.config.show_swing_modes !== false && hasSwingModes;
    const showPresetModes = this.config.show_preset_modes !== false && hasPresetModes;
    const showWaterModes = this.config.show_water_modes !== false && hasWaterModes;
    const hasTimer = this.config.timer;
    const timerEntity = hasTimer ? this.hass.states[this.config.timer] : null;
    const hasExtra = this.buttons && this.buttons.length > 0;
    const hasExtra2 = this.buttons2 && this.buttons2.length > 0;
    
    const gridTemplateRows = [
        'auto',
        showHvacModes ? 'auto' : '0',
        showFanModes ? 'auto' : '0',
        showSwingModes ? 'auto' : '0',
        showPresetModes ? 'auto' : '0',
        showWaterModes ? 'auto' : '0',
        hasTimer ? 'auto' : '0',
        hasExtra ? 'auto' : '0',
        hasExtra2 ? 'auto' : '0'
    ].join(' ');

    const fanModes = attrs.fan_modes || [];
    const modeCount = fanModes.length;
    const currentFanMode = attrs.fan_mode;
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
    const gridColumns = buttonCount <= 5 ? 5 : buttonCount;
    const buttonCount2 = Math.min(this.buttons2.length, 7); 
    const gridColumns2 = buttonCount2 <= 5 ? 5 : buttonCount;

    return html` 
      <div class="card" style=" margin-bottom: ${marginBottom};
                                width: ${this.width};
                                background: ${bgColor}; 
                                color: ${fgColor}; 
                                --button-bg: ${buttonBg}; 
                                --button-fg: ${buttonFg}; 
                                --active-color: ${statusColor};
                                --linear-color: ${linearColor};
                                grid-template-rows: ${gridTemplateRows}">
																
        ${isOn ? html`<div class="active-gradient"></div>` : ''}
        <div id="chart-container"></div>
        <div class="content-container">
            <div class="name-area">${attrs.friendly_name}</div>
                <div class="status-area" style="color: ${fgColor}">${translatedState}：
                    <div class="temp-adjust-container">
                        <button class="temp-adjust-button" @click=${() => this._adjustTemperature('down')}>
                            <ha-icon icon="mdi:chevron-left"></ha-icon>
                        </button>
                        <div class="temp-display">${temperature}</div>
                        <button class="temp-adjust-button" @click=${() => this._adjustTemperature('up')}>
                            <ha-icon icon="mdi:chevron-right"></ha-icon>
                        </button>
                    </div>${current_temperature}
                </div>
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
                                class="main-icon ${isOn ? 'active-main-icon' : ''}" 
                                icon="${isOn ? 'mdi:fan' : 'mdi:fan-off'}"
                                style="color: ${isOn ? statusColor : ''}; ${isOn ? `--fan-speed: ${fanSpeed}` : ''}"
                            ></ha-icon>
                        </div>
                    </div>
          ${showHvacModes ? html`
              <div class="modes-area">
                  ${this._renderModeButtons(attrs.hvac_modes, state)}
              </div>
          ` : ''}

          ${showFanModes ? html`
              <div class="fan-area">
                  ${this._renderFanButtons(attrs.fan_modes, attrs.fan_mode)}
              </div>
          ` : ''}

          ${showPresetModes ? html`
              <div class="preset-area">
                  ${this._renderPresetButtons(attrs.preset_modes, attrs.preset_mode)}
              </div>
          ` : ''}

          ${showSwingModes ? html`
              <div class="swing-area">
                  ${this._renderSwingButtons(attrs.swing_modes, attrs.swing_mode)}
              </div>
          ` : ''}

          ${showWaterModes ? html`
              <div class="water-area">
                  ${this._renderWaterButtons(attrs.operation_list, attrs.operation_mode)}
              </div>
          ` : ''}

          ${hasTimer ? html`
              <div class="timer-area">
                  ${this._renderTimerControls(timerEntity)}
              </div>
          ` : ''}

          ${hasExtra ? html`
              <div class="extra-area" style="grid-template-columns: repeat(${gridColumns}, 1fr);">
                  ${this._renderExtraButtons(1)}
              </div>
          ` : ''}

          ${hasExtra2 ? html`
              <div class="extra2-area" style="grid-template-columns: repeat(${gridColumns2}, 1fr);">
                  ${this._renderExtraButtons(2)}
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

    const climateEntity = this.hass.states[this.config.entity];
    const climateState = climateEntity ? climateEntity.state : 'off';
    
    let activeColor = 'rgb(255,255,255)';
    if (climateState === 'cool') activeColor = 'rgb(33,150,243)';
    else if (climateState === 'heat') activeColor = 'rgb(254,111,33)';
    else if (climateState === '自定义') activeColor = 'rgb(254,111,33)';
    else if (climateState === 'AI控温') activeColor = 'rgb(254,111,33)';
    else if (climateState === '婴童洗') activeColor = 'rgb(254,111,33)';
    else if (climateState === '舒适洗') activeColor = 'rgb(254,111,33)';
    else if (climateState === '宠物洗') activeColor = 'rgb(254,111,33)';
    else if (climateState === '厨房用') activeColor = 'rgb(254,111,33)';
    else if (climateState === 'dry') activeColor = 'rgb(255,151,0)';
    else if (climateState === 'fan' || climateState === 'fan_only') activeColor = 'rgb(0,188,213)';
    else if (climateState === 'auto') activeColor = 'rgb(147,112,219)';
    
    const now = new Date();
    const finishesAt = new Date(timerEntity.attributes.finishes_at || 0);
    let remainingSeconds = Math.max(0, Math.floor((finishesAt - now) / 1000));
  
    const state = timerEntity.state;
    if (state !== 'active') {
        remainingSeconds = 0;
    } else if (remainingSeconds <= 0) {
        this._turnOffClimate();
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


_renderExtraButtons(buttonType = 1) {
    const buttonArray = buttonType === 1 ? this.buttons : this.buttons2;
    if (!buttonArray || buttonArray.length === 0) return html``;

    const buttonsToShow = buttonArray.slice(0, 7);
    const entity = this.hass.states[this.config.entity];
    if (!entity) {
        return html`<div>实体未找到: ${this.config.entity}</div>`;
    }
    
    const state = entity?.state || 'off';
    const theme = this._evaluateTheme();
    const fgColor = theme === 'light' ? 'rgb(0, 0, 0)' : 'rgb(255, 255, 255)';
    let activeColor = theme === 'light' ? 'rgba(00, 80, 80)' : 'rgba(180, 230, 230)';
    if (state === 'cool') activeColor = 'rgb(33,150,243)';
    else if (state === 'heat') activeColor = 'rgb(254,111,33)';
    else if (state === '自定义') activeColor = 'rgb(254,111,33)';
    else if (state === 'AI控温') activeColor = 'rgb(254,111,33)';
    else if (state === '婴童洗') activeColor = 'rgb(254,111,33)';
    else if (state === '舒适洗') activeColor = 'rgb(254,111,33)';
    else if (state === '宠物洗') activeColor = 'rgb(254,111,33)';
    else if (state === '厨房用') activeColor = 'rgb(254,111,33)';
    else if (state === 'dry') activeColor = 'rgb(255,151,0)';
    else if (state === 'fan' || state === 'fan_only') activeColor = 'rgb(0,188,213)';
    else if (state === 'auto') activeColor = 'rgb(147,112,219)';
 

    return buttonsToShow.map(buttonEntityId => {
        const entity = this.hass.states[buttonEntityId];
        if (!entity) return html``;
        
        const domain = buttonEntityId.split('.')[0];
        const friendlyName = entity.attributes.friendly_name || '';
        const displayName = friendlyName.slice(0, 4);
        let displayValue = entity.state.slice(0, 4);
        const displayValueColor = displayValue === '低' ? 'red' : fgColor;
                
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


  _adjustTemperature(direction) {
      const entity = this.hass.states[this.config.entity];
      if (!entity) return;
      
      // 检查实体类型
      const entityId = this.config.entity;
      const isClimate = entityId.startsWith('climate.');
      const isWaterHeater = entityId.startsWith('water_heater.');
      
      if (!isClimate && !isWaterHeater) {
          console.warn('不支持的实体类型:', entityId);
          return;
      }
      
      // 获取当前温度和步长
      let currentTemp, step;
      currentTemp = entity.attributes.temperature;
      step = entity.attributes.target_temp_step || 1;
      
      if (currentTemp === undefined || currentTemp === null) {
          console.warn('无法获取当前温度');
          return;
      }
      
      // 计算新温度
      let newTemp = currentTemp;
      if (direction === 'up') {
          newTemp += step;
      } else {
          newTemp -= step;
      }
      
      // 调用相应的服务
      if (isClimate) {
          this._callService('climate', 'set_temperature', {
              entity_id: this.config.entity,
              temperature: newTemp
          });
      } else if (isWaterHeater) {
          this._callService('water_heater', 'set_temperature', {
              entity_id: this.config.entity,
              temperature: newTemp
          });
      }
      
      this._handleClick();
  }

  _getSwingIcon(mode) {
      const swingIcons = {
          'off': 'mdi:arrow-oscillating-off',
          'vertical': 'mdi:arrow-up-down',
          'horizontal': 'mdi:arrow-left-right',
          'both': 'mdi:arrow-all',
          '🔄': 'mdi:autorenew',
          '⬅️': 'mdi:arrow-left',
          '⬆️': 'mdi:arrow-up',
          '➡️': 'mdi:arrow-right',
          '⬇️': 'mdi:arrow-down',
          '↖️': 'mdi:arrow-top-left',
          '↗️': 'mdi:arrow-top-right',
          '↘️': 'mdi:arrow-bottom-right',
          '↙️': 'mdi:arrow-bottom-left',
          '↔️': 'mdi:arrow-left-right',
          '↕️': 'mdi:arrow-up-down',
          '←': 'mdi:arrow-left',
          '↑': 'mdi:arrow-up',
          '→': 'mdi:arrow-right',
          '↓': 'mdi:arrow-down',
          '↖': 'mdi:arrow-top-left',
          '↗': 'mdi:arrow-top-right',
          '↘': 'mdi:arrow-bottom-right',
          '↙': 'mdi:arrow-bottom-left',
          '↔': 'mdi:arrow-left-right',
          '↕': 'mdi:arrow-up-down'
      };
      return swingIcons[mode] || '';
  }

  _getPresetIcon(mode) {
      const presetIcons = {
          '普通': 'mdi:radiator',
          '除螨': 'mdi:radiator',
          'none': 'mdi:thermostat',
          'comfort': 'mdi:home-heart',
          'eco': 'mdi:leaf',
          'boost': 'mdi:rocket',
          'sleep': 'mdi:power-sleep',
          'away': 'mdi:home-export-outline'
      };
      return presetIcons[mode] || '';
  }

  _getWaterIcon(mode) {
    const waterIcons = {
        '自定义': 'mdi:pencil',
        'AI控温': 'mdi:water-boiler-auto',
        '婴童洗': 'mdi:human-baby-changing-table',
        '舒适洗': 'mdi:hand-heart',
        '宠物洗': 'mdi:cat',
        '厨房用': 'mdi:countertop'
    };
    return '';
  }

  _renderModeButtons(modes, currentMode) {
      if (!modes) return html``;
      
      const modeIcons = {
          'auto': 'mdi:thermostat-auto',
          'heat': 'mdi:fire',
          'cool': 'mdi:snowflake',
          'dry': 'mdi:water-percent',
          'fan_only': 'mdi:fan',
          'fan': 'mdi:fan',
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
                  <ha-icon class="icon" icon="${modeIcons[mode] || 'mdi:thermostat'}" style="color: ${isActive ? 'var(--active-color)' : ''}"></ha-icon>
              </button>
          `;
      });
  }

  _renderFanButtons(fanModes, currentFanMode) {
    if (!fanModes || fanModes.length === 0) return html``;
    
    const entity = this.hass.states[this.config.entity];
    const isOn = entity?.state !== 'off';
    
    const modeCount = fanModes.length;
    const minSpeed = 2;
    const maxSpeed = 0.5;
    const speedStep = modeCount > 1 ? (minSpeed - maxSpeed) / (modeCount - 1) : 0;
    
    return fanModes.map((mode, index) => {
        const isActive = mode === currentFanMode && isOn;
        const speed = (minSpeed - (index * speedStep)).toFixed(1) + 's';
        
        return html`
            <button 
                class="mode-button ${isActive ? 'active-mode' : ''}" 
                @click=${() => this._setFanMode(mode)}
                style="${isActive ? `--fan-speed: ${speed};` : ''} color: ${isActive ? 'var(--active-color)' : ''}"
            >
                <div class="fan-button">
                    <ha-icon 
                        class="fan-button-icon ${isActive ? 'active-fan-button-icon' : ''}" 
                        icon="mdi:fan" 
                        style="color: ${isActive ? 'var(--active-color)' : ''}"
                    ></ha-icon>
                    <span class="fan-text">${this._translateFanMode(mode)}</span>
                </div>
            </button>
        `;
    });
  }
  
  _renderSwingButtons(swingModes, currentSwingMode) {
      if (!swingModes) return html``;
      
      return swingModes.map(mode => {
          const isActive = mode === currentSwingMode;
          return html`
              <button 
                  class="mode-button ${isActive ? 'active-mode' : ''}" 
                  @click=${() => this._setSwingMode(mode)}
                  style="color: ${isActive ? 'var(--active-color)' : ''}"
              >
                  <div class="swing-button">
                      <ha-icon class="icon" icon="${this._getSwingIcon(mode)}" style="color: ${isActive ? 'var(--active-color)' : ''}"></ha-icon>
                      <span class="swing-text">${this._translateSwingMode(mode)}</span>
                  </div>
              </button>
          `;
      });
  }
  
  _renderPresetButtons(presetModes, currentPresetMode) {
      if (!presetModes) return html``;
      
      return presetModes.map(mode => {
          const isActive = mode === currentPresetMode;
          return html`
              <button 
                  class="mode-button ${isActive ? 'active-mode' : ''}" 
                  @click=${() => this._setPresetMode(mode)}
                  style="color: ${isActive ? 'var(--active-color)' : ''}"
              >
                  <div class="preset-button">
                      <ha-icon class="icon" icon="${this._getPresetIcon(mode)}" style="color: ${isActive ? 'var(--active-color)' : ''}"></ha-icon>
                      <span class="preset-text">${this._translatePresetMode(mode)}</span>
                  </div>
              </button>
          `;
      });
  }
  
  _renderWaterButtons(operation_list, operation_mode) {
    if (!operation_list) return html``;
    
    return operation_list.map(mode => {
        const isActive = mode === operation_mode;
        return html`
            <button 
                class="mode-button ${isActive ? 'active-mode' : ''}" 
                @click=${() => this._setWaterMode(mode)}
                style="color: ${isActive ? 'var(--active-color)' : ''}"
            >
                <div class="water-button">
                    <span class="water-text">${mode}</span>
                </div>
            </button>
        `;
    });
  }

  _translateMode(mode) {
      const translations = {
          'cool': '制冷',
          'heat': '制热',
          'dry': '除湿',
          'fan_only': '吹风',
          'fan': '吹风',
          'auto': '自动',
          'off': '关闭',
          'unknown': '未知',
          'unavailable': '离线'
      };
      return translations[mode] || mode;
  }

  _translateFanMode(mode) {
      if (mode.includes('自动') || mode.includes('auto')) return 'A';
      if (mode.includes('一') || mode.includes('1')) return '1';
      if (mode.includes('二') || mode.includes('2')) return '2';
      if (mode.includes('三') || mode.includes('3')) return '3';
      if (mode.includes('四') || mode.includes('4')) return '4';
      if (mode.includes('五') || mode.includes('5')) return '5';
      if (mode.includes('六') || mode.includes('6')) return '6';
      if (mode.includes('七') || mode.includes('7')) return '7';
      if (mode.includes('silent') || mode.includes('静')) return '静';
      if (mode.includes('low') || mode.includes('低')) return '低';
      if (mode.includes('稍弱')) return '弱';
      if (mode.includes('稍强')) return '强';
      if (mode.includes('medium') || mode.includes('中')) return '中';
      if (mode.includes('high') || mode.includes('高')) return '高';
      if (mode.includes('full') || mode.includes('全')) return '全';
      if (mode.includes('最大') || mode.includes('max')|| mode.includes('Max')) return 'M';
      return mode;
  }

  _translateSwingMode(mode) {
    const arrowSymbols = new Set([
      '🔄', '⬅️', '⬆️', '➡️', '⬇️','↔️','↕️','↖️', '↗️', '↘️', '↙️',
      '←', '↑', '→', '↓', '↔', '↕','↖', '↗', '↘', '↙'
    ]);
    if (arrowSymbols.has(mode)) return '';

    const translations = {
        'off': '\u00A0\u00A0关闭',
        'vertical': '\u00A0\u00A0垂直',
        'horizontal': '\u00A0\u00A0水平',
        'both': '\u00A0\u00A0立体',
    };
    return translations[mode] || mode;
  }

  _translatePresetMode(mode) {
    const translations = {
        '普通': '\u00A0\u00A0普通',
        '除螨': '\u00A0\u00A0除螨',
        'none': '\u00A0基础',
        'comfort': '\u00A0舒适',
        'eco': '\u00A0节能',
        'boost': '\u00A0强力',
        'sleep': '\u00A0睡眠',
        'away': '\u00A0离家',
    };
    return translations[mode] || mode;
  }

  _turnOffClimate() {
    if (!this.config.entity) return;
    
    // 检查实体类型
    const entityId = this.config.entity;
    const isClimate = entityId.startsWith('climate.');
    const isWaterHeater = entityId.startsWith('water_heater.');
    
    if (!isClimate && !isWaterHeater) {
        console.warn('不支持的实体类型:', entityId);
        return;
    }
    
    // 根据实体类型调用相应的服务
    if (isClimate) {
        this._callService('climate', 'turn_off', {
            entity_id: this.config.entity
        });
    } else if (isWaterHeater) {
        this._callService('water_heater', 'turn_off', {
            entity_id: this.config.entity
        });
    }
    
    this._handleClick();
  }

  _togglePower() {
      const entity = this.hass.states[this.config.entity];
      if (!entity) return;
      
      // 检查实体类型
      const entityId = this.config.entity;
      const isClimate = entityId.startsWith('climate.');
      const isWaterHeater = entityId.startsWith('water_heater.');
      
      if (!isClimate && !isWaterHeater) {
          console.warn('不支持的实体类型:', entityId);
          return;
      }
      
      // 根据实体类型调用相应的服务
      if (entity.state === 'off') {
          if (isClimate) {
              this._callService('climate', 'turn_on', {
                  entity_id: this.config.entity
              });
          } else if (isWaterHeater) {
              this._callService('water_heater', 'turn_on', {
                  entity_id: this.config.entity
              });
          }
          this._handleClick();
      } else {
          if (isClimate) {
              this._callService('climate', 'turn_off', {
                  entity_id: this.config.entity
              });
          } else if (isWaterHeater) {
              this._callService('water_heater', 'turn_off', {
                  entity_id: this.config.entity
              });
          }
          this._cancelTimer();
          this._handleClick();
      }
  }

  _setHvacMode(mode) {
      this._callService('climate', 'set_hvac_mode', {
          entity_id: this.config.entity,
          hvac_mode: mode
      });
      this._handleClick();
  }

  _setFanMode(mode) {
      this._callService('climate', 'set_fan_mode', {
          entity_id: this.config.entity,
          fan_mode: mode
      });
      this._handleClick();
  }

  _setSwingMode(mode) {
      this._callService('climate', 'set_swing_mode', {
          entity_id: this.config.entity,
          swing_mode: mode
      });
      this._handleClick();
  }

  _setPresetMode(mode) {
      this._callService('climate', 'set_preset_mode', {
          entity_id: this.config.entity,
          preset_mode: mode
      });
      this._handleClick();
  }

  _setWaterMode(mode) {
    this._callService('water_heater', 'set_operation_mode', {
        entity_id: this.config.entity,
        operation_mode: mode
    });
    this._handleClick();
  }

  _callService(domain, service, data) {
      this.hass.callService(domain, service, data);
      this._handleClick();
  }
} 
customElements.define('xiaoshi-phone-climate-card', XiaoshiPhoneClimateCard);

