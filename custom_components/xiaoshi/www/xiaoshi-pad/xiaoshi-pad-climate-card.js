import { LitElement, html, css } from "https://unpkg.com/lit-element@2.4.0/lit-element.js?module";

class XiaoshiPadClimateCardEditor extends LitElement {
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
      _availableModes: { type: Object },
      _modeFilterExpanded: { type: Object },
      _modeFilters: { type: Object },
      _buttonConfigExpanded: { type: Object },
      _selectSearchTerm: { type: String },
      _filteredSelectEntities: { type: Array },
      _showSelectList: { type: Boolean }
    };
  }

  setConfig(config) {
    this.config = config || {};

    // 如果已经有选择的实体，则自动识别其可用模式
    if (this.config.entity && this.hass && this.hass.states[this.config.entity]) {
      this._detectAvailableModes(this.config.entity);
    }

    // 如果没有选择实体且有 hass 数据，自动选择第一个实体
    if (!this.config.entity && this.hass) {
      this._autoSelectFirstEntity();
    }
  }

  _autoSelectFirstEntity() {
    if (!this.hass) return;

    const allEntities = Object.values(this.hass.states);
    const firstEntity = allEntities.find(entity => {
      const entityId = entity.entity_id;
      return entityId.startsWith('climate.') || entityId.startsWith('water_heater.') || entityId.startsWith('humidifier.');
    });

    if (firstEntity) {
      this._selectMainEntity(firstEntity.entity_id);
    }
  }

  firstUpdated() {
    // 点击外部关闭下拉列表
    document.addEventListener('click', (e) => {
      if (!e.target.closest('.entity-selector')) {
        this._showEntityList = false;
        this._showTemperatureList = false;
        this._showTimerList = false;
        this._showSelectList = false;

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

    // 过滤实体，只显示 climate、water_heater 和 humidifier 开头的实体
    this._filteredEntities = allEntities.filter(entity => {
      const entityId = entity.entity_id.toLowerCase();
      const friendlyName = (entity.attributes.friendly_name || '').toLowerCase();

      // 只显示 climate.、water_heater. 和 humidifier. 开头的实体
      const isClimateEntity = entityId.startsWith('climate.') || entityId.startsWith('water_heater.') || entityId.startsWith('humidifier.');
      const matchesSearch = entityId.includes(searchTerm) || friendlyName.includes(searchTerm);

      return isClimateEntity && matchesSearch;
    }).slice(0, 50); // 限制显示数量

    // 如果没有选择实体且搜索为空且有过滤结果，自动选择第一个
    if (!this.config.entity && searchTerm === '' && this._filteredEntities.length > 0) {
      this._selectMainEntity(this._filteredEntities[0].entity_id);
      return;
    }

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
    const isHumidifierEntity = entityId?.startsWith('humidifier.');
    
    this._availableModes = {
      hasHvacModes: attrs.hvac_modes && attrs.hvac_modes.length > 0,
      hasFanModes: attrs.fan_modes && attrs.fan_modes.length > 0,
      hasSwingModes: attrs.swing_modes && attrs.swing_modes.length > 0,
      hasPresetModes: attrs.preset_modes && attrs.preset_modes.length > 0,
      hasWaterModes: attrs.operation_list && attrs.operation_list.length > 0,
      hasHumidifierModes: attrs.available_modes && attrs.available_modes.length > 0,
      hasHumidifierSwitch: isHumidifierEntity
    };

    // 如果用户没有手动配置显示选项，则根据自动识别结果设置默认值
    if (this.config.show_hvac_modes === undefined) {
      this.config.show_hvac_modes = this._availableModes.hasHvacModes;
    }
    if (this.config.show_fan_modes === undefined) {
      this.config.show_fan_modes = this._availableModes.hasFanModes;
    }
    if (this.config.show_swing_modes === undefined) {
      this.config.show_swing_modes = this._availableModes.hasSwingModes;
    }
    if (this.config.show_preset_modes === undefined) {
      this.config.show_preset_modes = this._availableModes.hasPresetModes;
    }
    if (this.config.show_water_modes === undefined) {
      this.config.show_water_modes = this._availableModes.hasWaterModes;
    }
    if (this.config.show_humidifier_modes === undefined) {
      this.config.show_humidifier_modes = this._availableModes.hasHumidifierModes;
    }
    // 加湿器实体时，自动设置显示加湿器开关为 true
    if (isHumidifierEntity) {
      this.config.show_humidifier_switch = true;
    } else if (this.config.show_humidifier_switch === undefined) {
      this.config.show_humidifier_switch = this._availableModes.hasHumidifierSwitch;
    }

    // 初始化模式过滤器和展开状态（如果没有配置）
    if (!this._modeFilters) {
      this._modeFilters = {};
    }
    if (!this._modeFilterExpanded) {
      this._modeFilterExpanded = {};
    }

    // 从配置中恢复过滤器状态，或者初始化默认值
    if (attrs.hvac_modes && attrs.hvac_modes.length > 0) {
      this._modeFilters.hvac_modes = {};
      attrs.hvac_modes.forEach(mode => {
        // 配置中只有 false 的项，未配置的默认为 true
        this._modeFilters.hvac_modes[mode] = this.config.mode_filters?.hvac_modes?.[mode] === false ? false : true;
      });
    }
    if (attrs.fan_modes && attrs.fan_modes.length > 0) {
      this._modeFilters.fan_modes = {};
      attrs.fan_modes.forEach(mode => {
        this._modeFilters.fan_modes[mode] = this.config.mode_filters?.fan_modes?.[mode] === false ? false : true;
      });
    }
    if (attrs.swing_modes && attrs.swing_modes.length > 0) {
      this._modeFilters.swing_modes = {};
      attrs.swing_modes.forEach(mode => {
        this._modeFilters.swing_modes[mode] = this.config.mode_filters?.swing_modes?.[mode] === false ? false : true;
      });
    }
    if (attrs.preset_modes && attrs.preset_modes.length > 0) {
      this._modeFilters.preset_modes = {};
      attrs.preset_modes.forEach(mode => {
        this._modeFilters.preset_modes[mode] = this.config.mode_filters?.preset_modes?.[mode] === false ? false : true;
      });
    }
    if (attrs.operation_list && attrs.operation_list.length > 0) {
      this._modeFilters.operation_list = {};
      attrs.operation_list.forEach(mode => {
        this._modeFilters.operation_list[mode] = this.config.mode_filters?.operation_list?.[mode] === false ? false : true;
      });
    }
    if (attrs.available_modes && attrs.available_modes.length > 0) {
      this._modeFilters.available_modes = {};
      attrs.available_modes.forEach(mode => {
        this._modeFilters.available_modes[mode] = this.config.mode_filters?.available_modes?.[mode] === false ? false : true;
      });
    }
    // 初始化加湿器硬编码开关模式过滤器
    if (isHumidifierEntity) {
      this._modeFilters.humidifier_switch = {
        'on': this.config.mode_filters?.humidifier_switch?.['on'] === false ? false : true,
        'off': this.config.mode_filters?.humidifier_switch?.['off'] === false ? false : true
      };
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

      .mode-filter-section {
        border: 1px solid #e0e0e0;
        border-radius: 6px;
        padding: 8px;
        margin-top: 8px;
        background: rgb(0,0,0);
      }

      .mode-filter-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        cursor: pointer;
        padding: 4px 0;
      }

      .mode-filter-header:hover {
        background: rgb(0,0,0);
        border-radius: 4px;
      }

      .mode-filter-title {
        display: flex;
        align-items: center;
        gap: 6px;
        font-size: 12px;
        font-weight: 500;
        color: rgb(250, 250, 250);
      }

      .mode-filter-icon {
        transition: transform 0.2s ease;
        color: rgb(250, 250, 250);
      }

      .mode-filter-icon.expanded {
        transform: rotate(90deg);
      }

      .mode-filter-items {
        margin-top: 8px;
        padding-left: 12px;
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
        gap: 6px;
      }

      .mode-filter-item {
        display: flex;
        align-items: center;
        gap: 6px;
        padding: 4px 6px;
        border-radius: 4px;
        background: transparent;
        font-size: 11px;
        color: rgb(250, 250, 250);
      }

      .mode-filter-item:hover {
        background: rgba(0, 0, 0, 0.05);
      }

      .mode-filter-item input[type="checkbox"] {
        cursor: pointer;
      }

      .mode-filter-item label {
        cursor: pointer;
        font-weight: normal;
        margin: 0;
        color: rgb(250, 250, 250);
      }

      .mode-filter-item-expanded {
        display: flex;
        flex-direction: column;
        gap: 4px;
        padding: 4px 6px;
        border-radius: 4px;
        background: transparent;
        font-size: 11px;
        color: rgb(250, 250, 250);
      }

      .mode-filter-item-expanded:hover {
        background: rgba(0, 0, 0, 0.05);
      }

      .mode-filter-header-row {
        display: flex;
        align-items: center;
        justify-content: space-between;
      }

      .mode-filter-left {
        display: flex;
        align-items: center;
        gap: 6px;
      }

      .mode-filter-config {
        display: flex;
        flex-direction: column;
        gap: 4px;
        padding-left: 24px;
        margin-top: 4px;
      }

      .mode-config-row {
        display: flex;
        align-items: center;
        gap: 6px;
        font-size: 10px;
      }

      .mode-config-row input[type="checkbox"] {
        cursor: pointer;
      }

      .mode-config-row label {
        cursor: pointer;
        font-weight: normal;
        margin: 0;
        font-size: 10px;
        color: rgb(250, 250, 250);
      }

      .mode-config-input {
        width: 100%;
        padding: 4px 6px;
        border: 1px solid #555;
        border-radius: 3px;
        background: rgba(0, 0, 0, 0.2);
        color: rgb(250, 250, 250);
        font-size: 10px;
        box-sizing: border-box;
      }

      .mode-config-input::placeholder {
        color: rgba(250, 250, 250, 0.5);
      }

      .mode-config-input:focus {
        outline: none;
        border-color: #4CAF50;
      }

      .button-custom-config {
        background: transparent;
        border-radius: 6px;
        padding: 0px;
        margin-bottom: 10px;
      }

      .config-toggle-icon {
        transition: transform 0.2s ease;
        color: rgb(250, 250, 250);
        font-size: 16px;
      }

      .config-toggle-icon.expanded {
        transform: rotate(90deg);
      }

      .button-config-items {
        display: flex;
        flex-direction: column;
        gap: 4px;
        padding-left: 24px;
        margin-top: 4px;
      }

      .button-config-row {
        display: flex;
        align-items: center;
        gap: 6px;
        font-size: 11px;
      }

      .button-config-row label {
        font-weight: normal;
        margin: 0;
        color: rgb(250, 250, 250);
        font-size: 10px;
        white-space: nowrap;
        min-width: 80px;
      }

      .button-config-input {
        flex: 1;
        padding: 4px 6px;
        border: 1px solid #555;
        border-radius: 3px;
        background: rgba(0, 0, 0, 0.2);
        color: rgb(250, 250, 250);
        font-size: 10px;
        box-sizing: border-box;
      }

      .button-config-input::placeholder {
        color: rgba(250, 250, 250, 0.5);
      }

      .button-config-input:focus {
        outline: none;
        border-color: #4CAF50;
      }
    `;
  }

  render() {
    if (!this.hass) return html``;

    return html`
      <div class="form">
        <!-- 主实体选择 -->
        <div class="form-group">
          <label>空调/水暖毯/热水器/加湿器实体 (必选)</label>
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
              ${this._availableModes?.hasHumidifierModes ?
                html`<div class="mode-badge has-mode">✓ 加湿器模式(available_modes)</div>` :
                html`<div class="mode-badge no-mode">✗ 加湿器模式(available_modes)</div>`}
              ${this._availableModes?.hasHumidifierSwitch ?
                html`<div class="mode-badge has-mode">✓ 加湿器开关</div>` :
                html`<div class="mode-badge no-mode">✗ 加湿器开关</div>`}
            </div>
            ${Object.keys(this._availableModes).length === 0 ? html`
              <div style="color: #666; font-size: 12px; margin-bottom: 8px;">
                点击"刷新检测"按钮来识别实体支持的模式
              </div>
            ` : ''}
            <div style="display: flex; flex-direction: column; gap: 8px; margin-top: 8px;">
              ${this._availableModes?.hasHvacModes ? html`
                <div style="display: flex; flex-direction: column; gap: 4px;">
                  <div style="display: flex; align-items: center; gap: 8px;">
                    <ha-switch
                      .checked=${this.config.show_hvac_modes !== false}
                      @change=${this._showHvacModesChanged}
                    ></ha-switch>
                    <span>显示模式按钮</span>
                  </div>
                  ${this._renderModeFilter('hvac_modes', '模式筛选')}
                </div>
              ` : ''}
              ${this._availableModes?.hasFanModes ? html`
                <div style="display: flex; flex-direction: column; gap: 4px;">
                  <div style="display: flex; align-items: center; gap: 8px;">
                    <ha-switch
                      .checked=${this.config.show_fan_modes !== false}
                      @change=${this._showFanModesChanged}
                    ></ha-switch>
                    <span>显示风速按钮</span>
                  </div>
                  ${this._renderModeFilter('fan_modes', '风速筛选')}
                </div>
              ` : ''}
              ${this._availableModes?.hasSwingModes ? html`
                <div style="display: flex; flex-direction: column; gap: 4px;">
                  <div style="display: flex; align-items: center; gap: 8px;">
                    <ha-switch
                      .checked=${this.config.show_swing_modes !== false}
                      @change=${this._showSwingModesChanged}
                    ></ha-switch>
                    <span>显示风向按钮</span>
                  </div>
                  ${this._renderModeFilter('swing_modes', '风向筛选')}
                </div>
              ` : ''}
              ${this._availableModes?.hasPresetModes ? html`
                <div style="display: flex; flex-direction: column; gap: 4px;">
                  <div style="display: flex; align-items: center; gap: 8px;">
                    <ha-switch
                      .checked=${this.config.show_preset_modes !== false}
                      @change=${this._showPresetModesChanged}
                    ></ha-switch>
                    <span>显示水暖毯模式按钮</span>
                  </div>
                  ${this._renderModeFilter('preset_modes', '水暖毯模式筛选')}
                </div>
              ` : ''}
              ${this._availableModes?.hasWaterModes ? html`
                <div style="display: flex; flex-direction: column; gap: 4px;">
                  <div style="display: flex; align-items: center; gap: 8px;">
                    <ha-switch
                      .checked=${this.config.show_water_modes !== false}
                      @change=${this._showWaterModesChanged}
                    ></ha-switch>
                    <span>显示热水器模式按钮</span>
                  </div>
                  ${this._renderModeFilter('operation_list', '热水器模式筛选')}
                </div>
              ` : ''}
              ${this._availableModes?.hasHumidifierModes ? html`
                <div style="display: flex; flex-direction: column; gap: 4px;">
                  <div style="display: flex; align-items: center; gap: 8px;">
                    <ha-switch
                      .checked=${this.config.show_humidifier_modes !== false}
                      @change=${this._showHumidifierModesChanged}
                    ></ha-switch>
                    <span>显示加湿器模式按钮</span>
                  </div>
                  ${this._renderModeFilter('available_modes', '加湿器模式筛选')}
                </div>
              ` : ''}
              ${this.config.entity?.startsWith('humidifier.') ? html`
                <div style="display: flex; flex-direction: column; gap: 4px;">
                  <div style="display: flex; align-items: center; gap: 8px;">
                    <ha-switch
                      .checked=${this.config.show_humidifier_switch === true}
                      @change=${this._showHumidifierSwitchChanged}
                    ></ha-switch>
                    <span>显示加湿器开关按钮</span>
                  </div>
                  ${this._renderModeFilter('humidifier_switch', '加湿器开关筛选')}
                </div>
              ` : ''}

              <!-- 自选Select实体 -->
              <div style="display: flex; flex-direction: column; gap: 4px;">
                <div style="display: flex; align-items: center; gap: 8px;">
                  <ha-switch
                    .checked=${this.config.show_select_modes === true}
                    @change=${this._showSelectModesChanged}
                  ></ha-switch>
                  <span>显示自选Select实体按钮</span>
                </div>
              </div>
            </div>

            <!-- Select实体选择器 -->
            ${this.config.show_select_modes === true ? html`
              <div class="form-group" style="margin-top: 12px;">
                <label>选择Select实体</label>
                <div class="entity-selector">
                  <input
                    type="text"
                    @input=${this._onSelectEntitySearch}
                    @focus=${this._onSelectEntitySearch}
                    .value=${this._selectSearchTerm || this.config?.select_entity || ''}
                    placeholder="搜索Select实体..."
                    class="entity-search-input"
                  />
                  ${this._showSelectList ? html`
                    <div class="entity-dropdown">
                      ${this._filteredSelectEntities.map(entity => html`
                        <div
                          class="entity-option ${this.config?.select_entity === entity.entity_id ? 'selected' : ''}"
                          @click=${() => this._selectSelectEntity(entity.entity_id)}
                        >
                          <div class="entity-info">
                            <ha-icon icon="${entity.attributes.icon || 'mdi:help-circle'}"></ha-icon>
                            <div class="entity-details">
                              <div class="entity-name">${entity.attributes.friendly_name || entity.entity_id}</div>
                              <div class="entity-id">${entity.entity_id}</div>
                            </div>
                          </div>
                          ${this.config?.select_entity === entity.entity_id ?
                            html`<ha-icon icon="mdi:check" class="check-icon"></ha-icon>` : ''}
                        </div>
                      `)}
                      ${this._filteredSelectEntities.length === 0 ? html`
                        <div class="no-results">未找到匹配的Select实体</div>
                      ` : ''}
                    </div>
                  ` : ''}
                </div>
                ${this.config.select_entity ? html`
                  <div style="margin-top: 8px;">
                    ${this._renderModeFilter('select_modes', 'Select模式筛选')}
                  </div>
                ` : ''}
              </div>
            ` : ''}

            <!-- 模式过滤器已移至各个开关下方 -->
          </div>
        ` : ''}

        <!-- 主题选择 -->
        <div class="form-group">
          <label>主题</label>
          <select
            @change=${this._themeSelectChanged}
            .value=${this.config.theme !== undefined ? this.config.theme : 'on'}
            name="theme"
          >
            <option value="on">浅色主题（白底黑字）</option>
            <option value="off">深色主题（深灰底白字）</option>
          </select>
        </div>

        <!-- 定时器位置 -->
        ${this.config.timer ? html`
          <div class="form-group">
            <label>定时器位置</label>
            <select
              @change=${this._timerPositionChanged}
              .value=${this.config.timer_position !== undefined ? this.config.timer_position : 'left'}
              name="timer_position"
            >
              <option value="left">左</option>
              <option value="right">右</option>
            </select>
          </div>
        ` : ''}
        
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

        <!-- 附加按钮位置 -->
        ${(this.config.buttons && this.config.buttons.length > 0) ? html`
          <div class="form-group">
            <label>附加按钮位置</label>
            <select
              @change=${this._buttonPositionChanged}
              .value=${this.config.button_position !== undefined ? this.config.button_position : 'left'}
              name="button_position"
            >
              <option value="left">左</option>
              <option value="right">右</option>
            </select>
          </div>
        ` : ''}

        <!-- 附加按钮2位置 -->
        ${(this.config.buttons2 && this.config.buttons2.length > 0) ? html`
          <div class="form-group">
            <label>附加按钮(第2排)位置</label>
            <select
              @change=${this._button2PositionChanged}
              .value=${this.config.button2_position !== undefined ? this.config.button2_position : 'left'}
              name="button2_position"
            >
              <option value="left">左</option>
              <option value="right">右</option>
            </select>
          </div>
        ` : ''}

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
            ${button ? html`
              <div class="button-custom-config">
                <div style="display: flex; align-items: center; gap: 6px; cursor: pointer; margin-bottom: 4px;" @click=${() => this._toggleButtonConfig('buttons', index)}>
                  <ha-icon class="config-toggle-icon ${this._buttonConfigExpanded?.buttons?.[index] ? 'expanded' : ''}" icon="mdi:chevron-right"></ha-icon>
                  <span style="font-size: 12px; color: rgb(250, 250, 250);">自定义配置</span>
                </div>
                ${this._buttonConfigExpanded?.buttons?.[index] ? html`
                  <div class="button-config-items">
                    ${this._renderButtonConfig('buttons', index)}
                  </div>
                ` : ''}
              </div>
            ` : ''}
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
            ${button2 ? html`
              <div class="button-custom-config">
                <div style="display: flex; align-items: center; gap: 6px; cursor: pointer; margin-top: 4px;" @click=${() => this._toggleButtonConfig('buttons2', index2)}>
                  <ha-icon class="config-toggle-icon ${this._buttonConfigExpanded?.buttons2?.[index2] ? 'expanded' : ''}" icon="mdi:chevron-right"></ha-icon>
                  <span style="font-size: 12px; color: rgb(250, 250, 250);">自定义配置</span>
                </div>
                ${this._buttonConfigExpanded?.buttons2?.[index2] ? html`
                  <div class="button-config-items">
                    ${this._renderButtonConfig('buttons2', index2)}
                  </div>
                ` : ''}
              </div>
            ` : ''}
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

        <!-- 宽度设置 -->
        <div class="form-group">
          <label>卡片主体宽度</label>
          <input
            type="text"
            @change=${this._widthChanged}
            .value=${this.config.width !== undefined ? this.config.width : '300px'}
            name="width"
          />
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

    // 清理该按钮的配置，并重新索引后面的配置
    if (this.config.button_configs && this.config.button_configs.buttons) {
      const newButtonConfigs = {};
      Object.keys(this.config.button_configs.buttons).forEach(key => {
        const keyIndex = parseInt(key);
        if (keyIndex < index) {
          // 保留索引小于被删除按钮的配置
          newButtonConfigs[keyIndex] = this.config.button_configs.buttons[key];
        } else if (keyIndex > index) {
          // 将索引大于被删除按钮的配置前移
          newButtonConfigs[keyIndex - 1] = this.config.button_configs.buttons[key];
        }
        // 等于的被删除按钮的配置不保留
      });

      // 更新配置
      if (Object.keys(newButtonConfigs).length > 0) {
        this.config.button_configs.buttons = newButtonConfigs;
      } else {
        // 如果没有配置了，删除整个 buttons 配置
        delete this.config.button_configs.buttons;
        // 如果 button_configs 为空，删除整个对象
        if (Object.keys(this.config.button_configs).length === 0) {
          delete this.config.button_configs;
        }
      }
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

    // 清理该按钮的配置，并重新索引后面的配置
    if (this.config.button_configs && this.config.button_configs.buttons2) {
      const newButtonConfigs = {};
      Object.keys(this.config.button_configs.buttons2).forEach(key => {
        const keyIndex = parseInt(key);
        if (keyIndex < index2) {
          // 保留索引小于被删除按钮的配置
          newButtonConfigs[keyIndex] = this.config.button_configs.buttons2[key];
        } else if (keyIndex > index2) {
          // 将索引大于被删除按钮的配置前移
          newButtonConfigs[keyIndex - 1] = this.config.button_configs.buttons2[key];
        }
        // 等于的被删除按钮的配置不保留
      });

      // 更新配置
      if (Object.keys(newButtonConfigs).length > 0) {
        this.config.button_configs.buttons2 = newButtonConfigs;
      } else {
        // 如果没有配置了，删除整个 buttons2 配置
        delete this.config.button_configs.buttons2;
        // 如果 button_configs 为空，删除整个对象
        if (Object.keys(this.config.button_configs).length === 0) {
          delete this.config.button_configs;
        }
      }
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
    const theme = ev.target.checked ? 'on' : 'off';

    this.config = {
      ...this.config,
      theme
    };
    this._fireEvent();
  }

  _widthChanged(e) {
    if (!this.config) return;
    const { name, value } = e.target;

    let finalValue = value;

    // 处理默认值
    if (name === 'width') {
      finalValue = value || '300px';
    }

    this.config = {
      ...this.config,
      [name]: finalValue
    };
    this._fireEvent();
  }

  _heightChanged(e) {
    if (!this.config) return;
    const { name, value } = e.target;

    let finalValue = value;

    // 处理默认值
    if (name === 'height') {
      finalValue = value || '300px';
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

  _showHumidifierModesChanged(ev) {
    if (!this.config) return;
    this.config = {
      ...this.config,
      show_humidifier_modes: ev.target.checked
    };
    this._fireEvent();
  }

  _showHumidifierSwitchChanged(ev) {
    if (!this.config) return;
    this.config = {
      ...this.config,
      show_humidifier_switch: ev.target.checked
    };
    this._fireEvent();
  }

  _showSelectModesChanged(ev) {
    if (!this.config) return;
    this.config = {
      ...this.config,
      show_select_modes: ev.target.checked
    };
    this._fireEvent();
  }

  _onSelectEntitySearch(e) {
    const searchTerm = e.target.value.toLowerCase();
    this._selectSearchTerm = searchTerm;
    this._showSelectList = true;

    if (!this.hass) return;

    // 获取所有实体
    const allEntities = Object.values(this.hass.states);

    // 过滤实体，只显示 select. 开头的实体
    this._filteredSelectEntities = allEntities.filter(entity => {
      const entityId = entity.entity_id.toLowerCase();
      const friendlyName = (entity.attributes.friendly_name || '').toLowerCase();

      // 只显示 select. 开头的实体
      const isSelectEntity = entityId.startsWith('select.');
      const matchesSearch = entityId.includes(searchTerm) || friendlyName.includes(searchTerm);

      return isSelectEntity && matchesSearch;
    }).slice(0, 50); // 限制显示数量

    this.requestUpdate();
  }

  _selectSelectEntity(entityId) {
    this.config = {
      ...this.config,
      select_entity: entityId
    };

    this._selectSearchTerm = ''; // 清空搜索词
    this._showSelectList = false; // 关闭下拉列表

    // 检测Select实体的可用选项
    this._detectSelectModes(entityId);

    this._fireEvent();
    this.requestUpdate();
  }

  _detectSelectModes(entityId) {
    if (!this.hass || !this.hass.states[entityId]) return;

    const attrs = this.hass.states[entityId].attributes;
    const options = attrs.options || [];

    // 初始化Select模式的过滤器
    if (!this._modeFilters) {
      this._modeFilters = {};
    }

    if (options.length > 0) {
      this._modeFilters.select_modes = {};
      options.forEach(option => {
        this._modeFilters.select_modes[option] = this.config.mode_filters?.select_modes?.[option] === false ? false : true;
      });
    }
  }

  _buttonPositionChanged(e) {
    if (!this.config) return;
    const buttonPosition = e.target.value;
    this.config = {
      ...this.config,
      button_position: buttonPosition
    };
    this._fireEvent();
  }

  _button2PositionChanged(e) {
    if (!this.config) return;
    const button2Position = e.target.value;
    this.config = {
      ...this.config,
      button2_position: button2Position
    };
    this._fireEvent();
  }

  _timerPositionChanged(e) {
    if (!this.config) return;
    const timerPosition = e.target.value;
    this.config = {
      ...this.config,
      timer_position: timerPosition
    };
    this._fireEvent();
  }

  _toggleModeFilter(modeType) {
    if (!this._modeFilterExpanded) {
      this._modeFilterExpanded = {};
    }
    this._modeFilterExpanded[modeType] = !this._modeFilterExpanded[modeType];
    this.requestUpdate();
  }

  _toggleModeItem(modeType, mode) {
    if (!this._modeFilters) {
      this._modeFilters = {};
    }
    if (!this._modeFilters[modeType]) {
      this._modeFilters[modeType] = {};
    }
    this._modeFilters[modeType][mode] = !this._modeFilters[modeType][mode];

    // 保存过滤配置到 config，只保存 false 的项
    if (!this.config.mode_filters) {
      this.config.mode_filters = {};
    }
    if (!this.config.mode_filters[modeType]) {
      this.config.mode_filters[modeType] = {};
    }
    
    // 只设置为 false 的模式，不保存 true 的
    if (this._modeFilters[modeType][mode] === false) {
      this.config.mode_filters[modeType][mode] = false;
    } else {
      delete this.config.mode_filters[modeType][mode];
    }

    this._fireEvent();
    this.requestUpdate();
  }

  _toggleShowName(modeType, mode, show) {
    if (!this.config.mode_configs) {
      this.config.mode_configs = {};
    }
    if (!this.config.mode_configs[modeType]) {
      this.config.mode_configs[modeType] = {};
    }
    if (!this.config.mode_configs[modeType][mode]) {
      this.config.mode_configs[modeType][mode] = {};
    }

    if (show) {
      delete this.config.mode_configs[modeType][mode].show_name;
    } else {
      this.config.mode_configs[modeType][mode].show_name = false;
    }

    this._fireEvent();
    this.requestUpdate();
  }

  _updateCustomName(modeType, mode, name) {
    if (!this.config.mode_configs) {
      this.config.mode_configs = {};
    }
    if (!this.config.mode_configs[modeType]) {
      this.config.mode_configs[modeType] = {};
    }
    if (!this.config.mode_configs[modeType][mode]) {
      this.config.mode_configs[modeType][mode] = {};
    }

    if (name) {
      this.config.mode_configs[modeType][mode].custom_name = name;
    } else {
      delete this.config.mode_configs[modeType][mode].custom_name;
    }

    this._fireEvent();
    this.requestUpdate();
  }

  _toggleShowIcon(modeType, mode, show) {
    if (!this.config.mode_configs) {
      this.config.mode_configs = {};
    }
    if (!this.config.mode_configs[modeType]) {
      this.config.mode_configs[modeType] = {};
    }
    if (!this.config.mode_configs[modeType][mode]) {
      this.config.mode_configs[modeType][mode] = {};
    }

    if (show) {
      delete this.config.mode_configs[modeType][mode].show_icon;
    } else {
      this.config.mode_configs[modeType][mode].show_icon = false;
    }

    this._fireEvent();
    this.requestUpdate();
  }

  _updateCustomIcon(modeType, mode, icon) {
    if (!this.config.mode_configs) {
      this.config.mode_configs = {};
    }
    if (!this.config.mode_configs[modeType]) {
      this.config.mode_configs[modeType] = {};
    }
    if (!this.config.mode_configs[modeType][mode]) {
      this.config.mode_configs[modeType][mode] = {};
    }

    if (icon) {
      this.config.mode_configs[modeType][mode].custom_icon = icon;
    } else {
      delete this.config.mode_configs[modeType][mode].custom_icon;
    }

    this._fireEvent();
    this.requestUpdate();
  }

  _toggleButtonConfig(buttonType, index) {
    if (!this._buttonConfigExpanded) {
      this._buttonConfigExpanded = {};
    }
    if (!this._buttonConfigExpanded[buttonType]) {
      this._buttonConfigExpanded[buttonType] = {};
    }
    this._buttonConfigExpanded[buttonType][index] = !this._buttonConfigExpanded[buttonType][index];
    this.requestUpdate();
  }

  _getButtonConfig(buttonType, index) {
    if (!this.config.button_configs) {
      return null;
    }
    if (!this.config.button_configs[buttonType]) {
      return null;
    }
    return this.config.button_configs[buttonType][index] || {};
  }

  _updateButtonCustomName(buttonType, index, name) {
    if (!this.config.button_configs) {
      this.config.button_configs = {};
    }
    if (!this.config.button_configs[buttonType]) {
      this.config.button_configs[buttonType] = {};
    }
    if (!this.config.button_configs[buttonType][index]) {
      this.config.button_configs[buttonType][index] = {};
    }

    if (name) {
      this.config.button_configs[buttonType][index].custom_name = name;
    } else {
      delete this.config.button_configs[buttonType][index].custom_name;
    }

    this._fireEvent();
    this.requestUpdate();
  }

  _updateButtonCustomIconOn(buttonType, index, icon) {
    if (!this.config.button_configs) {
      this.config.button_configs = {};
    }
    if (!this.config.button_configs[buttonType]) {
      this.config.button_configs[buttonType] = {};
    }
    if (!this.config.button_configs[buttonType][index]) {
      this.config.button_configs[buttonType][index] = {};
    }

    if (icon) {
      this.config.button_configs[buttonType][index].custom_icon_on = icon;
    } else {
      delete this.config.button_configs[buttonType][index].custom_icon_on;
    }

    this._fireEvent();
    this.requestUpdate();
  }

  _updateButtonCustomIconOff(buttonType, index, icon) {
    if (!this.config.button_configs) {
      this.config.button_configs = {};
    }
    if (!this.config.button_configs[buttonType]) {
      this.config.button_configs[buttonType] = {};
    }
    if (!this.config.button_configs[buttonType][index]) {
      this.config.button_configs[buttonType][index] = {};
    }

    if (icon) {
      this.config.button_configs[buttonType][index].custom_icon_off = icon;
    } else {
      delete this.config.button_configs[buttonType][index].custom_icon_off;
    }

    this._fireEvent();
    this.requestUpdate();
  }

  _renderButtonConfig(buttonType, index) {
    if (!this.hass) return html``;

    const buttonId = buttonType === 'buttons' ? (this.config.buttons || [])[index] : (this.config.buttons2 || [])[index];
    if (!buttonId) return html``;

    const entity = this.hass.states[buttonId];
    if (!entity) return html``;

    const domain = buttonId.split('.')[0];
    const config = this._getButtonConfig(buttonType, index) || {};

    // light/switch/button 类型显示自定义名称、自定义开启图标、自定义关闭图标
    if (['light', 'switch', 'button'].includes(domain)) {
      return html`
        <div class="button-config-row">
          <label>自定义名称</label>
          <input
            type="text"
            .value=${config.custom_name || ''}
            placeholder="留空使用默认名称"
            @change=${(e) => this._updateButtonCustomName(buttonType, index, e.target.value)}
            class="button-config-input"
          />
        </div>
        <div class="button-config-row">
          <label>自定义开启图标</label>
          <input
            type="text"
            .value=${config.custom_icon_on || ''}
            placeholder="留空使用默认图标"
            @change=${(e) => this._updateButtonCustomIconOn(buttonType, index, e.target.value)}
            class="button-config-input"
          />
        </div>
        <div class="button-config-row">
          <label>自定义关闭图标</label>
          <input
            type="text"
            .value=${config.custom_icon_off || ''}
            placeholder="留空使用默认图标"
            @change=${(e) => this._updateButtonCustomIconOff(buttonType, index, e.target.value)}
            class="button-config-input"
          />
        </div>
      `;
    }
    // select/sensor 类型只显示自定义名称
    else if (['select', 'sensor'].includes(domain)) {
      return html`
        <div class="button-config-row">
          <label>自定义名称</label>
          <input
            type="text"
            .value=${config.custom_name || ''}
            placeholder="留空使用默认名称"
            @change=${(e) => this._updateButtonCustomName(buttonType, index, e.target.value)}
            class="button-config-input"
          />
        </div>
      `;
    }

    return html``;
  }

  _renderModeFilter(modeType, title) {
    // 对于select_modes，需要检查select_entity
    if (modeType === 'select_modes') {
      if (!this.hass || !this.config.select_entity) return html``;
      const selectEntity = this.hass.states[this.config.select_entity];
      if (!selectEntity) return html``;
      const selectAttrs = selectEntity.attributes;
      const modes = selectAttrs.options || [];
      if (modes.length === 0) return html``;

      const isExpanded = this._modeFilterExpanded?.[modeType] || false;
      const filters = this._modeFilters?.[modeType] || {};
      const modeConfig = this.config.mode_configs?.[modeType] || {};

      // 计算选中的数量
      const checkedCount = Object.values(filters).filter(v => v === true).length;
      const totalCount = modes.length;

      return html`
        <div class="mode-filter-section">
          <div class="mode-filter-header" @click=${() => this._toggleModeFilter(modeType)}>
            <div class="mode-filter-title">
              <ha-icon class="mode-filter-icon ${isExpanded ? 'expanded' : ''}" icon="mdi:chevron-right"></ha-icon>
              <span>${title} (${checkedCount}/${totalCount})</span>
            </div>
          </div>
          ${isExpanded ? html`
            <div class="mode-filter-items">
              ${modes.map(mode => html`
                <div class="mode-filter-item-expanded">
                  <div class="mode-filter-header-row">
                    <div class="mode-filter-left">
                      <input
                        type="checkbox"
                        id="mode-${modeType}-${mode}"
                        .checked=${filters[mode] !== false}
                        @change=${() => this._toggleModeItem(modeType, mode)}
                      />
                      <label for="mode-${modeType}-${mode}">${mode}</label>
                    </div>
                  </div>
                  <div class="mode-filter-config">
                    <div class="mode-config-row">
                      <input
                        type="checkbox"
                        id="show-name-${modeType}-${mode}"
                        .checked=${modeConfig[mode]?.show_name !== false}
                        @change=${(e) => this._toggleShowName(modeType, mode, e.target.checked)}
                      />
                      <label for="show-name-${modeType}-${mode}">显示名称</label>
                    </div>
                    <input
                      type="text"
                      .value=${modeConfig[mode]?.custom_name || ''}
                      placeholder="自定义名称"
                      @change=${(e) => this._updateCustomName(modeType, mode, e.target.value)}
                      class="mode-config-input"
                    />
                    <div class="mode-config-row">
                      <input
                        type="checkbox"
                        id="show-icon-${modeType}-${mode}"
                        .checked=${modeConfig[mode]?.show_icon !== false}
                        @change=${(e) => this._toggleShowIcon(modeType, mode, e.target.checked)}
                      />
                      <label for="show-icon-${modeType}-${mode}">显示图标</label>
                    </div>
                    <input
                      type="text"
                      .value=${modeConfig[mode]?.custom_icon || ''}
                      placeholder="自定义图标 (如: mdi:fan)"
                      @change=${(e) => this._updateCustomIcon(modeType, mode, e.target.value)}
                      class="mode-config-input"
                    />
                  </div>
                </div>
              `)}
            </div>
          ` : ''}
        </div>
      `;
    }

    // 其他模式类型使用主实体
    if (!this.hass || !this.config.entity) return html``;
    const entity = this.hass.states[this.config.entity];
    if (!entity) return html``;

    const attrs = entity.attributes;
    let modes = [];
    if (modeType === 'hvac_modes') modes = attrs.hvac_modes || [];
    else if (modeType === 'fan_modes') modes = attrs.fan_modes || [];
    else if (modeType === 'swing_modes') modes = attrs.swing_modes || [];
    else if (modeType === 'preset_modes') modes = attrs.preset_modes || [];
    else if (modeType === 'operation_list') modes = attrs.operation_list || [];
    else if (modeType === 'available_modes') modes = attrs.available_modes || [];
    else if (modeType === 'humidifier_switch') modes = ['on', 'off'];

    if (modes.length === 0) return html``;

    const isExpanded = this._modeFilterExpanded?.[modeType] || false;
    const filters = this._modeFilters?.[modeType] || {};
    const modeConfig = this.config.mode_configs?.[modeType] || {};

    // 计算选中的数量
    const checkedCount = Object.values(filters).filter(v => v === true).length;
    const totalCount = modes.length;

    return html`
      <div class="mode-filter-section">
        <div class="mode-filter-header" @click=${() => this._toggleModeFilter(modeType)}>
          <div class="mode-filter-title">
            <ha-icon class="mode-filter-icon ${isExpanded ? 'expanded' : ''}" icon="mdi:chevron-right"></ha-icon>
            <span>${title} (${checkedCount}/${totalCount})</span>
          </div>
        </div>
        ${isExpanded ? html`
          <div class="mode-filter-items">
            ${modes.map(mode => html`
              <div class="mode-filter-item-expanded">
                <div class="mode-filter-header-row">
                  <div class="mode-filter-left">
                    <input
                      type="checkbox"
                      id="mode-${modeType}-${mode}"
                      .checked=${filters[mode] !== false}
                      @change=${() => this._toggleModeItem(modeType, mode)}
                    />
                    <label for="mode-${modeType}-${mode}">${mode}</label>
                  </div>
                </div>
                <div class="mode-filter-config">
                  <div class="mode-config-row">
                    <input
                      type="checkbox"
                      id="show-name-${modeType}-${mode}"
                      .checked=${modeConfig[mode]?.show_name !== false}
                      @change=${(e) => this._toggleShowName(modeType, mode, e.target.checked)}
                    />
                    <label for="show-name-${modeType}-${mode}">显示名称</label>
                  </div>
                  <input
                    type="text"
                    .value=${modeConfig[mode]?.custom_name || ''}
                    placeholder="自定义名称"
                    @change=${(e) => this._updateCustomName(modeType, mode, e.target.value)}
                    class="mode-config-input"
                  />
                  <div class="mode-config-row">
                    <input
                      type="checkbox"
                      id="show-icon-${modeType}-${mode}"
                      .checked=${modeConfig[mode]?.show_icon !== false}
                      @change=${(e) => this._toggleShowIcon(modeType, mode, e.target.checked)}
                    />
                    <label for="show-icon-${modeType}-${mode}">显示图标</label>
                  </div>
                  <input
                    type="text"
                    .value=${modeConfig[mode]?.custom_icon || ''}
                    placeholder="自定义图标"
                    @change=${(e) => this._updateCustomIcon(modeType, mode, e.target.value)}
                    class="mode-config-input"
                  />
                </div>
              </div>
            `)}
          </div>
        ` : ''}
      </div>
    `;
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
    this._modeFilterExpanded = {};
    this._modeFilters = {};
    this._buttonConfigExpanded = {};
  }

  updated(changedProperties) {
    super.updated(changedProperties);

    // 当 hass 第一次加载时，如果没有配置实体，自动选择第一个
    if (changedProperties.has('hass') && this.hass && !this.config.entity) {
      this._autoSelectFirstEntity();
    }
  }
}
customElements.define('xiaoshi-pad-climate-card-editor', XiaoshiPadClimateCardEditor);

class XiaoshiPadClimateCard extends LitElement {
  static get properties() {
    return {
      hass: { type: Object },
      width: { type: String, attribute: true },
      config: { type: Object },
      buttons: { type: Array },
      theme: { type: String },
      _timerInterval: { state: true },
      temperatureData: { type: Array },
      _externalTempSensor: { type: String },
      entity: { type: Object },
      _variables: { type: Object }
    };
  }

  static getConfigElement() {
    return document.createElement("xiaoshi-pad-climate-card-editor");
  }

  static getStubConfig() {
    return {
      entity: 'climate.demo_ac',  // 使用 Home Assistant 的演示实体
      theme: 'on'
    };
  }

  setConfig(config) {
    this.config = config;
    this.buttons = config.buttons || [];
    this.buttons2 = config.buttons2 || [];
    this._externalTempSensor = config.temperature || null;
    if (config.width !== undefined) this.width = config.width;
    this.requestUpdate();
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

      .thermostat-card {
        position: relative;
        width: var(--card-width, 300px);
        height: 265px;
        display: flex;
        flex-direction: column;
      }

      .thermostat-container {
        flex: 1;
        width: var(--card-width, 300px);
        height: 265px;
        position: relative;
      }

      .error {
        padding: 16px;
        color: #dc2626;
        text-align: center;
      }

      .theme-on {
        --ha-card-background: rgb(255,255,255,0);          /*背景色*/
        --primary-text-color:rgb(0,0,0);                 /*文字颜色*/
        --disabled-color: rgb(150,150,150);              /*圆环背景色*/
        --_icon-color: rgb(0,0,0);                       /*图标颜色*/
        --secondary-text-color: rgb(0,0,0);              /*图标边框颜色*/
        --area-bg: rgb(230,230,230);                     /*按钮区域背景色*/
      }
      .theme-off {
        --ha-card-background: rgb(50,50,50,0);
        --primary-text-color:rgb(255,255,255);
        --disabled-color: rgb(220,220,220);
        --_icon-color: rgb(255,255,255);
        --secondary-text-color: rgb(255,255,255);
        --area-bg: rgb(80,80,80);                        /*按钮区域背景色*/
      }

      .modes-area, .fan-area, .preset-area, .swing-area, .water-area, .humidifier-area {
        display: flex;
        flex-wrap: nowrap;
        gap: 2px;
      }

      .mode-button {
        flex: 1;
        min-width: auto;
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
      }

      .mode-button.active-mode {
        background: var(--active-color);
      }

      .fan-button, .swing-button, .preset-button, .water-button {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 4px;
        width: 100%;
        height: 100%;
        color: var(--fg-color);
        position: relative;
        --mdc-icon-size: 18px;
      }

      .swing-text, .preset-text, .water-text {
        font-size: 10px; 
        color: var(--fg-color);
      }

      .fan-text {
        font-size: 10px; 
        color: var(--fg-color);
        position: absolute;
        bottom: 6px;
        right: 6px;
        transform: translate(25%, 25%);
      }

      .area-bg-wrapper {
        background: var(--area-bg);
        border-radius: 10px;
        width: calc(100% - 20px);
        margin: 0px 10px;
        margin-bottom: 8px;
        box-sizing: border-box;
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

    `;
  }

  constructor() {
    super();
    this.hass = {};
    this.config = {};
    this.buttons = [];
    this.buttons2 = [];
    this.theme = 'on';
    this.width = '300px';
    this._timerInterval = null;
    this.temperatureData = [];
    this.canvas = null;
    this.ctx = null;
    this._variables = {};
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
    super.firstUpdated();
    await this._preloadHumidifierCard();
    this._loadOfficialThermostat();
  }

  updated(changedProperties) {
    super.updated(changedProperties);

    // 当 hass 第一次加载时，如果没有配置实体或配置的实体不存在，自动选择第一个
    if (changedProperties.has('hass') && this.hass) {
      if (!this.config.entity || !this.hass.states[this.config.entity]) {
        const firstEntity = this._findFirstEntity();
        if (firstEntity) {
          this.config.entity = firstEntity;
          this.requestUpdate();
        }
      }
    }

    // 每次组件更新后，确保 thermostat-card 也更新
    this.updateFromHass();
  }

  _findFirstEntity() {
    if (!this.hass) return null;
    const allEntities = Object.values(this.hass.states);
    const firstEntity = allEntities.find(entity => {
      const entityId = entity.entity_id;
      return entityId.startsWith('climate.') || entityId.startsWith('water_heater.') || entityId.startsWith('humidifier.');
    });
    return firstEntity ? firstEntity.entity_id : null;
  }

  _loadOfficialThermostat() {
    this.updateComplete;

    const container = this.shadowRoot?.querySelector('#thermostatContainer');
    if (!container) return;

    // 根据实体类型选择不同的官方卡片
    const entity = this.config.entity || '';
    const entityType = entity.split('.')[0] || 'climate';

    let cardType = 'thermostat';
    if (entityType === 'humidifier') {
      cardType = 'humidifier';
    }

    // 检查对应的官方卡片是否已注册
    const cardName = `hui-${cardType}-card`;
    if (!customElements.get(cardName)) {
      console.warn(`${cardName} 未注册，跳过加载官方卡片`);
      return;
    }

    // 创建对应的官方卡片元素
    const card = document.createElement(cardName);
    card.hass = this.hass;
    card.setConfig({
      type: cardType,
      entity: this.config.entity
    });

    // 清空容器并添加元素
    container.innerHTML = '';
    container.appendChild(card);
  }

  // 预加载 humidifier 卡片组件
  async _preloadHumidifierCard() {
    const entity = this.config.entity || '';
    const entityType = entity.split('.')[0] || 'climate';

    if (entityType === 'humidifier') {
      const cardName = 'hui-humidifier-card';
      if (customElements.get(cardName)) {
        return; // 已注册，无需加载
      }
     
      const helpers = await window.loadCardHelpers?.();
      if (helpers) {
        const card = await helpers.createCardElement({
          type: 'humidifier',
          entity: this.config.entity
        });
        // 将卡片添加到 DOM 以触发组件注册
        const container = document.createElement('div');
        container.style.display = 'none';
        document.body.appendChild(container);
        container.appendChild(card);

        // 等待组件注册
        await this._waitForCardRegistration(cardName);

        // 清理临时元素
        document.body.removeChild(container);
      }
    }
  }

  // 等待卡片组件注册
  _waitForCardRegistration(cardName, timeout = 10000) {
    return new Promise((resolve, reject) => {
      if (customElements.get(cardName)) {
        resolve();
        return;
      }

      const startTime = Date.now();
      const interval = setInterval(() => {
        if (customElements.get(cardName)) {
          clearInterval(interval);
          resolve();
        } else if (Date.now() - startTime > timeout) {
          clearInterval(interval);
          reject(new Error(`等待 ${cardName} 注册超时`));
        }
      }, 10);
    });
  }

  disconnectedCallback() {
    super.disconnectedCallback();
  }

  connectedCallback() {
    super.connectedCallback();
    this.updateFromHass();
  }

  updateFromHass() {
    if (this.hass && this.config?.entity) {
      this.entity = this.hass.states[this.config.entity];
    }
    // 更新 thermostat-card 的 hass
    const container = this.shadowRoot?.querySelector('#thermostatContainer');
    if (container?.firstChild) {
      container.firstChild.hass = this.hass;
      // 强制触发 thermostat-card 的更新
      if (container.firstChild.requestUpdate) {
        container.firstChild.requestUpdate();
      }
    }
  }

  render() {
    if (!this.hass || !this.config.entity) {
        return html``;
    }

    if (!this.entity) {
      return html`<div class="error">实体未找到: ${this.config.entity}</div>`;
    }

    const entity = this.hass.states[this.config.entity];
    if (!entity) {
        return html`<div>实体未找到: ${this.config.entity}</div>`;
    }
    const state = entity.state;
    const attrs = entity.attributes;
    const theme = this._evaluateTheme();
    const themeClass = theme === 'on' ? 'theme-on' : 'theme-off';

    const fgColor = theme === 'on' ? 'rgb(0, 0, 0)' : 'rgb(255, 255, 255)';
    const bgColor = theme === 'on' ? 'rgb(255, 255, 255)' : 'rgb(50, 50, 50)';

    const hasHvacModes = attrs.hvac_modes && attrs.hvac_modes.length > 0;
    const hasFanModes = attrs.fan_modes && attrs.fan_modes.length > 0;
    const hasSwingModes = attrs.swing_modes && attrs.swing_modes.length > 0;
    const hasPresetModes = attrs.preset_modes && attrs.preset_modes.length > 0;
    const hasWaterModes = attrs.operation_list && attrs.operation_list.length > 0;
    const hasHumidifierModes = attrs.available_modes && attrs.available_modes.length > 0;
    const hasHumidifierSwitch = this.config.entity?.startsWith('humidifier.');

    // 检查Select实体
    let hasSelectModes = false;
    let selectEntity = null;
    if (this.config.select_entity && this.hass.states[this.config.select_entity]) {
      selectEntity = this.hass.states[this.config.select_entity];
      const selectOptions = selectEntity.attributes.options || [];
      hasSelectModes = selectOptions.length > 0;
    }

    // 使用配置中的显示选项（如果存在），否则使用自动识别结果
    const showHvacModes = this.config.show_hvac_modes !== false && hasHvacModes;
    const showFanModes = this.config.show_fan_modes !== false && hasFanModes;
    const showSwingModes = this.config.show_swing_modes !== false && hasSwingModes;
    const showPresetModes = this.config.show_preset_modes !== false && hasPresetModes;
    const showWaterModes = this.config.show_water_modes !== false && hasWaterModes;
    const showHumidifierModes = this.config.show_humidifier_modes !== false && hasHumidifierModes;
    const showHumidifierSwitch = this.config.show_humidifier_switch !== false && hasHumidifierSwitch;
    const showSelectModes = this.config.show_select_modes !== false && hasSelectModes;

    // 动态计算总高度：基础高度310px（包含thermostat容器265px），每个启用模式区域增加48px
    const activeModeCount = (showHvacModes ? 1 : 0) +
                           (showFanModes ? 1 : 0) +
                           (showPresetModes ? 1 : 0) +
                           (showSwingModes ? 1 : 0) +
                           (showWaterModes ? 1 : 0) +
                           (showHumidifierModes ? 1 : 0) +
                           (showHumidifierSwitch ? 1 : 0) +
                           (showSelectModes ? 1 : 0);
    const cardHeight = 300 + (activeModeCount * 48);

    // 判断是否有定时器和附加按钮
    const hasTimer = this.config.timer;
    const hasButtons = this.buttons && this.buttons.length > 0;
    const hasButtons2 = this.buttons2 && this.buttons2.length > 0;
    const timerPosition = this.config.timer_position || 'left';
    const buttonPosition = this.config.button_position || 'left';
    const button2Position = this.config.button2_position || 'left';

    return html`
        ${hasTimer && timerPosition === 'left' ? html`
          <div class="side-button-wrapper">
            <div class="side-button-bar side-button-bar-left" style="background-color: ${bgColor}; height: ${cardHeight}px;">
              ${this._renderTimerButton()}
            </div>
          </div>
        ` : ''}

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

        <div class="main-card" style="--bg-color: ${bgColor}; --fg-color: ${fgColor}; --card-width: ${this.config.width || '300px'};">
          <div class="thermostat-card ${themeClass}" style="height: ${cardHeight}px; --card-height: ${cardHeight}px;">
            <div class="thermostat-container" id="thermostatContainer"></div>

            ${showHvacModes ? html`
                <div class="area-bg-wrapper">
                    <div class="modes-area">
                        ${this._renderModeButtons(attrs.hvac_modes, state)}
                    </div>
                </div>
            ` : ''}

            ${showFanModes ? html`
                <div class="area-bg-wrapper">
                    <div class="fan-area">
                        ${this._renderFanButtons(attrs.fan_modes, attrs.fan_mode)}
                    </div>
                </div>
            ` : ''}

            ${showPresetModes ? html`
                <div class="area-bg-wrapper">
                    <div class="preset-area">
                        ${this._renderPresetButtons(attrs.preset_modes, attrs.preset_mode)}
                    </div>
                </div>
            ` : ''}

            ${showSwingModes ? html`
                <div class="area-bg-wrapper">
                    <div class="swing-area">
                        ${this._renderSwingButtons(attrs.swing_modes, attrs.swing_mode)}
                    </div>
                </div>
            ` : ''}

            ${showWaterModes ? html`
                <div class="area-bg-wrapper">
                    <div class="water-area">
                        ${this._renderWaterButtons(attrs.operation_list, attrs.operation_mode)}
                    </div>
                </div>
            ` : ''}

            ${showHumidifierModes ? html`
                <div class="area-bg-wrapper">
                    <div class="humidifier-area">
                        ${this._renderHumidifierButtons(attrs.available_modes, attrs.available_mode)}
                    </div>
                </div>
            ` : ''}

            ${showHumidifierSwitch ? html`
                <div class="area-bg-wrapper">
                    <div class="humidifier-area">
                        ${this._renderHumidifierSwitchButtons()}
                    </div>
                </div>
            ` : ''}

            ${showSelectModes ? html`
                <div class="area-bg-wrapper">
                    <div class="humidifier-area">
                        ${this._renderSelectButtons()}
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

        ${hasTimer && timerPosition === 'right' ? html`
          <div class="side-button-wrapper">
            <div class="side-button-bar side-button-bar-right" style="background-color: ${bgColor}; height: ${cardHeight}px;">
              ${this._renderTimerButton()}
            </div>
          </div>
        ` : ''}
    `;
  }

  _renderTimerButton() {
    const timerEntity = this.hass.states[this.config.timer];
    if (!timerEntity) return html``;

    const now = new Date();
    const finishesAt = new Date(timerEntity.attributes.finishes_at || 0);
    let remainingSeconds = Math.max(0, Math.floor((finishesAt - now) / 1000));

    const state = timerEntity.state;
    if (state !== 'active') {
      remainingSeconds = 0;
    }

    const hours = Math.floor(remainingSeconds / 3600);
    const minutes = Math.floor((remainingSeconds % 3600) / 60);

    const theme = this._evaluateTheme();
    const fgColor = theme === 'on' ? 'rgb(0, 0, 0)' : 'rgb(255, 255, 255)';
    const bgColor = theme === 'on' ? 'rgb(230, 230, 230)' : 'rgb(80, 80, 80)';

    const climateEntity = this.hass.states[this.config.entity];
    const climateState = climateEntity ? climateEntity.state : 'off';
    
    let activeColor = bgColor;
    if (remainingSeconds > 0) {
      if (climateState === 'cool') activeColor = 'rgb(33,150,243)';
      else if (climateState === 'heat') activeColor = 'rgb(254,111,33)';
      else if (climateState === '自定义' || climateState === 'AI控温' ||
               climateState === '婴童洗' || climateState === '舒适洗' ||
               climateState === '宠物洗' || climateState === '厨房用') activeColor = 'rgb(254,111,33)';
      else if (climateState === 'dry') activeColor = 'rgb(255,151,0)';
      else if (climateState === 'fan' || climateState === 'fan_only') activeColor = 'rgb(0,188,213)';
      else if (climateState === 'auto') activeColor = 'rgb(47,96,49)';
    }

    return html`
      <button class="side-extra-button" style="cursor: pointer; background: ${bgColor};" @click=${this._cancelTimer}>
        <ha-icon class="side-icon" icon="mdi:close" style="color: ${fgColor}"></ha-icon>
        <span class="side-text" style="color: ${fgColor}">取消</span>
      </button>
      <button class="side-extra-button" style="cursor: pointer; background: ${bgColor};" @click=${() => this._adjustTimer(-1, remainingSeconds)}>
        <ha-icon class="side-icon" icon="mdi:minus" style="color: ${fgColor}"></ha-icon>
        <span class="side-text" style="color: ${fgColor}"></span>
      </button>
      <button class="side-extra-button" style="cursor: default; background: ${activeColor};">
        <span class="side-text" style="color: ${fgColor}; font-size: 12px; font-weight: bold;">${hours > 0 ? hours + 'h' : minutes + 'm'}</span>
      </button>
      <button class="side-extra-button" style="cursor: pointer; background: ${bgColor};" @click=${() => this._adjustTimer(1, remainingSeconds)}>
        <ha-icon class="side-icon" icon="mdi:plus" style="color: ${fgColor}"></ha-icon>
        <span class="side-text" style="color: ${fgColor}"></span>
      </button>
      <button class="side-extra-button" style="cursor: pointer; background: ${bgColor};" @click=${() => this._setTimer(60 * 60)}>
        <span class="side-text" style="color: ${fgColor}">1h</span>
      </button>
      <button class="side-extra-button" style="cursor: pointer; background: ${bgColor};" @click=${() => this._setTimer(3 * 60 * 60)}>
        <span class="side-text" style="color: ${fgColor}">3h</span>
      </button>
      <button class="side-extra-button" style="cursor: pointer; background: ${bgColor};" @click=${() => this._setTimer(8 * 60 * 60)}>
        <span class="side-text" style="color: ${fgColor}">8h</span>
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
    const fgColor = theme === 'on' ? 'rgb(0, 0, 0)' : 'rgb(255, 255, 255)';
    const bgColor = theme === 'on' ? 'rgb(230, 230, 230)' : 'rgb(80, 80, 80)';
    const isHumidifierEntity = this.config.entity?.startsWith('humidifier.');
    let activeColor = theme === 'on' ? 'rgba(0, 188, 213)' : 'rgba(0, 188, 213)';
    if (state === 'cool') activeColor = 'rgb(33,150,243)';
    else if (state === 'heat') activeColor = 'rgb(254,111,33)';
    else if (state === '自定义' || state === 'AI控温' || state === '婴童洗' || state === '舒适洗' || state === '宠物洗' || state === '厨房用') activeColor = 'rgb(254,111,33)';
    else if (state === 'dry') activeColor = 'rgb(255,151,0)';
    else if (state === 'fan' || state === 'fan_only') activeColor = 'rgb(0,188,213)';
    else if (state === 'auto') activeColor = 'rgb(47,96,49)';
    else if (isHumidifierEntity) activeColor = 'rgb(33,150,243)';

    const buttonConfigKey = buttonType === 1 ? 'buttons' : 'buttons2';

    return buttonsToShow.map((buttonEntityId, index) => {
        const entity = this.hass.states[buttonEntityId];
        if (!entity) return html``;

        const domain = buttonEntityId.split('.')[0];
        const friendlyName = entity.attributes.friendly_name || '';
        const buttonConfig = this.config.button_configs?.[buttonConfigKey]?.[index] || {};
        const customName = buttonConfig.custom_name || friendlyName;
        const displayName = customName.slice(0, 4);
        const displayValueColor = entity.state.includes('低') || entity.state.includes('少') || entity.state.includes('缺') ? 'red' : fgColor;

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
            return null;
        };

        switch(domain) {
            case 'switch':
            case 'light':
                const isActive = entity.state === 'on';
                const customIcon = _getCustomIcon(friendlyName, isActive);
                const icon = buttonConfig.custom_icon_on && isActive ? buttonConfig.custom_icon_on
                          : buttonConfig.custom_icon_off && !isActive ? buttonConfig.custom_icon_off
                          : customIcon
                          ? customIcon
                          : (isActive ? 'mdi:toggle-switch' : 'mdi:toggle-switch-off');
                const buttonColor = isActive ? activeColor : fgColor;

                return html`
                    <button
                        class="side-extra-button ${isActive ? 'active-extra' : ''}"
                        @click=${() => this._handleExtraButtonClick(buttonEntityId, domain)}
                        style="--active-color: ${buttonColor}; --bg-color: ${bgColor};"
                        title="${customName}"
                    >
                        <ha-icon class="side-icon" icon="${icon}" style="color: ${buttonColor}"></ha-icon>
                        <span class="side-text" style="color: ${buttonColor}">${displayName}</span>
                    </button>
                `;

            case 'sensor':
                const unit = entity.attributes.unit_of_measurement || '';
                const displayValue = `${entity.state}${unit}`.slice(0, 4);

                return html`
                    <div class="side-extra-button" style="cursor: default; --bg-color: ${bgColor};">
                        <div class="side-value" style="color: ${displayValueColor}; font-size: 11px; font-weight: bold; white-space: nowrap">${displayValue}</div>
                        <span class="side-text" style="color: ${fgColor};">${displayName}</span>
                    </div>
                `;

            case 'button':
                const buttonIcon = buttonConfig.custom_icon_on || buttonConfig.custom_icon_off || 'mdi:button-pointer';

                return html`
                    <button class="side-extra-button"
                            @click=${() => this._handleExtraButtonClick(buttonEntityId, domain)}
                            style="color: ${fgColor}; --bg-color: ${bgColor};">
                        <ha-icon class="side-icon" icon="${buttonIcon}" style="color: ${fgColor}"></ha-icon>
                        <span class="side-text" style="color: ${fgColor};">${displayName}</span>
                    </button>
                `;

            case 'select':
                const selectState = entity.state || '';
                const selectDisplayValue = selectState.slice(0, 4);

                return html`
                    <div class="side-extra-button"
                            @click=${() => this._handleExtraButtonClick(buttonEntityId, domain)}
                            style="cursor: default; --bg-color: ${bgColor};">
                        <div class="side-value" style="color: ${fgColor}; font-size: 11px; font-weight: bold; white-space: nowrap">${selectDisplayValue}</div>
                        <span class="side-text" style="color: ${fgColor};">${displayName}</span>
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

      const entity = this.hass.states[this.config.entity];
      const state = entity ? entity.state : 'off';
      const theme = this._evaluateTheme();
      const modeConfigs = this.config.mode_configs?.hvac_modes || {};

      const modeIcons = {
          'auto': 'mdi:thermostat-auto',
          'heat': 'mdi:fire',
          'cool': 'mdi:snowflake',
          'dry': 'mdi:water-percent',
          'fan_only': 'mdi:fan',
          'fan': 'mdi:fan',
          'off': 'mdi:power'
      };

      // 应用过滤器
      const filters = this.config.mode_filters?.hvac_modes || {};
      const filteredModes = modes.filter(mode => filters[mode] !== false);

      return filteredModes.map(mode => {
          const isActive = mode === currentMode;
          let bgColor = 'rgb(0,0,0,0)';
          const config = modeConfigs[mode] || {};
          
          // 获取自定义配置
          const showName = config.show_name !== false;
          const showIcon = config.show_icon !== false;
          const customName = config.custom_name || this._translateMode(mode);
          const customIcon = config.custom_icon || modeIcons[mode] || 'mdi:thermostat';
          
          if (isActive) {
              if (state === 'cool' && mode === 'cool') bgColor = 'rgb(33,150,243)';
              else if (state === 'heat' && mode === 'heat') bgColor = 'rgb(254,111,33)';
              else if (state === 'dry' && mode === 'dry') bgColor = 'rgb(255,151,0)';
              else if (state === 'fan_only' && mode === 'fan_only') bgColor = 'rgb(0,188,213)';
              else if (state === 'auto' && mode === 'auto') bgColor = 'rgb(47,96,49)';
              else if (state === 'off' && mode === 'off') bgColor = theme === 'on' ? 'rgb(180,180,180)' : 'rgb(150,150,150)';
          }

          return html`
              <button
                  class="mode-button ${isActive ? 'active-mode' : ''}"
                  @click=${() => this._setHvacMode(mode)}
                  style="--active-color: ${bgColor}; background: ${isActive ? bgColor : 'rgb(0,0,0,0)'}"
                  title="${customName}"
              >
                  ${showIcon ? html`<ha-icon class="icon" icon="${customIcon}" style="color: ${isActive ? (theme === 'on' ? 'rgb(0,0,0)' : 'rgb(255,255,255)') : ''}"></ha-icon>` : ''}
                  ${showName ? html`<span class="mode-text" style="font-size: 10px; color: ${isActive ? (theme === 'on' ? 'rgb(0,0,0)' : 'rgb(255,255,255)') : ''}">${customName}</span>` : ''}
              </button>
          `;
      });
  }

  _renderFanButtons(fanModes, currentFanMode) {
    if (!fanModes || fanModes.length === 0) return html``;

    const entity = this.hass.states[this.config.entity];
    const state = entity ? entity.state : 'off';
    const theme = this._evaluateTheme();
    const modeConfigs = this.config.mode_configs?.fan_modes || {};

    // 应用过滤器
    const filters = this.config.mode_filters?.fan_modes || {};
    const filteredModes = fanModes.filter(mode => filters[mode] !== false);

    return filteredModes.map((mode, index) => {
        const isActive = mode === currentFanMode;
        let bgColor = 'rgb(0,0,0)';
        const config = modeConfigs[mode] || {};
        
        // 获取自定义配置
        const showName = config.show_name !== false;
        const showIcon = config.show_icon !== false;
        const customName = config.custom_name || this._translateFanMode(mode);
        const customIcon = config.custom_icon || 'mdi:fan';
        
        if (isActive) {
            if (state === 'cool') bgColor = 'rgb(33,150,243)';
            else if (state === 'heat') bgColor = 'rgb(254,111,33)';
            else if (state === 'dry') bgColor = 'rgb(255,151,0)';
            else if (state === 'fan_only') bgColor = 'rgb(0,188,213)';
            else if (state === 'auto') bgColor = 'rgb(47,96,49)';
            else if (state === 'off') bgColor = theme === 'on' ? 'rgb(180,180,180)' : 'rgb(150,150,150)';
        }

        return html`
            <button
                class="mode-button ${isActive ? 'active-mode' : ''}"
                @click=${() => this._setFanMode(mode)}
                style="--active-color: ${bgColor}; background: ${isActive ? bgColor : 'rgb(0,0,0,0)'}"
            >
                <div class="fan-button" style="gap: 4px; flex-direction: column;">
                    ${showIcon ? html`
                        <ha-icon
                            class="fan-button-icon ${isActive ? 'active-fan-button-icon' : ''}"
                            icon="${customIcon}"
                            style="color: ${isActive ? (theme === 'on' ? 'rgb(0,0,0)' : 'rgb(255,255,255)') : ''}"
                        ></ha-icon>
                    ` : ''}
                    ${showName ? html`<span class="fan-text" style="color: ${isActive ? (theme === 'on' ? 'rgb(0,0,0)' : 'rgb(255,255,255)') : ''}">${customName}</span>` : ''}
                </div>
            </button>
        `;
    });
  }
  
  _renderSwingButtons(swingModes, currentSwingMode) {
      if (!swingModes) return html``;

      const entity = this.hass.states[this.config.entity];
      const state = entity ? entity.state : 'off';
      const theme = this._evaluateTheme();
      const modeConfigs = this.config.mode_configs?.swing_modes || {};

      // 应用过滤器
      const filters = this.config.mode_filters?.swing_modes || {};
      const filteredModes = swingModes.filter(mode => filters[mode] !== false);

      return filteredModes.map(mode => {
          const isActive = mode === currentSwingMode;
          let bgColor = 'rgb(0,0,0,0)';
          const config = modeConfigs[mode] || {};
          
          // 获取自定义配置
          const showName = config.show_name !== false;
          const showIcon = config.show_icon !== false;
          const customName = config.custom_name || this._translateSwingMode(mode);
          const customIcon = config.custom_icon || this._getSwingIcon(mode);
          
          if (isActive) {
              if (state === 'cool') bgColor = 'rgb(33,150,243)';
              else if (state === 'heat') bgColor = 'rgb(254,111,33)';
              else if (state === 'dry') bgColor = 'rgb(255,151,0)';
              else if (state === 'fan_only') bgColor = 'rgb(0,188,213)';
              else if (state === 'auto') bgColor = 'rgb(47,96,49)';
              else if (state === 'off') bgColor = theme === 'on' ? 'rgb(180,180,180)' : 'rgb(150,150,150)';
          }

          return html`
              <button
                  class="mode-button ${isActive ? 'active-mode' : ''}"
                  @click=${() => this._setSwingMode(mode)}
                  style="--active-color: ${bgColor}; background: ${isActive ? bgColor : 'rgb(0,0,0,0)'}"
              >
                  <div class="swing-button">
                      ${showIcon ? html`<ha-icon class="icon" icon="${customIcon}" style="color: ${isActive ? (theme === 'on' ? 'rgb(0,0,0)' : 'rgb(255,255,255)') : ''}"></ha-icon>` : ''}
                      ${showName ? html`<span class="swing-text" style="color: ${isActive ? (theme === 'on' ? 'rgb(0,0,0)' : 'rgb(255,255,255)') : ''}">${customName}</span>` : ''}
                  </div>
              </button>
          `;
      });
  }
  
  _renderPresetButtons(presetModes, currentPresetMode) {
      if (!presetModes) return html``;

      const entity = this.hass.states[this.config.entity];
      const state = entity ? entity.state : 'off';
      const theme = this._evaluateTheme();
      const modeConfigs = this.config.mode_configs?.preset_modes || {};

      // 应用过滤器
      const filters = this.config.mode_filters?.preset_modes || {};
      const filteredModes = presetModes.filter(mode => filters[mode] !== false);

      return filteredModes.map(mode => {
          const isActive = mode === currentPresetMode;
          let bgColor = 'rgb(0,0,0,0)';
          const config = modeConfigs[mode] || {};
          
          // 获取自定义配置
          const showName = config.show_name !== false;
          const showIcon = config.show_icon !== false;
          const customName = config.custom_name || this._translatePresetMode(mode);
          const customIcon = config.custom_icon || this._getPresetIcon(mode);
          
          if (isActive) {
              if (state === 'cool') bgColor = 'rgb(33,150,243)';
              else if (state === 'heat') bgColor = 'rgb(254,111,33)';
              else if (state === 'dry') bgColor = 'rgb(255,151,0)';
              else if (state === 'fan_only') bgColor = 'rgb(0,188,213)';
              else if (state === 'auto') bgColor = 'rgb(47,96,49)';
              else if (state === 'off') bgColor = theme === 'on' ? 'rgb(180,180,180)' : 'rgb(150,150,150)';
          }

          return html`
              <button
                  class="mode-button ${isActive ? 'active-mode' : ''}"
                  @click=${() => this._setPresetMode(mode)}
                  style="--active-color: ${bgColor}; background: ${isActive ? bgColor : 'rgb(0,0,0,0)'}"
              >
                  <div class="preset-button">
                      ${showIcon ? html`<ha-icon class="icon" icon="${customIcon}" style="color: ${isActive ? (theme === 'on' ? 'rgb(0,0,0)' : 'rgb(255,255,255)') : ''}"></ha-icon>` : ''}
                      ${showName ? html`<span class="preset-text" style="color: ${isActive ? (theme === 'on' ? 'rgb(0,0,0)' : 'rgb(255,255,255)') : ''}">${customName}</span>` : ''}
                  </div>
              </button>
          `;
      });
  }
  
  _renderWaterButtons(operation_list, operation_mode) {
    if (!operation_list) return html``;

    const entity = this.hass.states[this.config.entity];
    const state = entity ? entity.state : 'off';
    const theme = this._evaluateTheme();
    const modeConfigs = this.config.mode_configs?.operation_list || {};

    // 应用过滤器
    const filters = this.config.mode_filters?.operation_list || {};
    const filteredModes = operation_list.filter(mode => filters[mode] !== false);

    return filteredModes.map(mode => {
        const isActive = mode === operation_mode;
        let bgColor = 'rgb(0,0,0,0)';
        const config = modeConfigs[mode] || {};
        
        // 获取自定义配置
        const showName = config.show_name !== false;
        const showIcon = config.show_icon !== false;
        const customName = config.custom_name || mode;
        const customIcon = config.custom_icon || 'mdi:water';
        
        if (isActive) {
            if (state === 'cool') bgColor = 'rgb(33,150,243)';
            else if (state === 'heat') bgColor = 'rgb(254,111,33)';
            else if (state === 'dry') bgColor = 'rgb(255,151,0)';
            else if (state === 'fan_only') bgColor = 'rgb(0,188,213)';
            else if (state === 'auto') bgColor = 'rgb(47,96,49)';
            else if (state === 'off') bgColor = theme === 'on' ? 'rgb(180,180,180)' : 'rgb(150,150,150)';
        }

        return html`
            <button
                class="mode-button ${isActive ? 'active-mode' : ''}"
                @click=${() => this._setWaterMode(mode)}
                style="--active-color: ${bgColor}; background: ${isActive ? bgColor : 'rgb(0,0,0,0)'}"
            >
                <div class="water-button">
                    ${showIcon ? html`<ha-icon class="icon" icon="${customIcon}" style="color: ${isActive ? (theme === 'on' ? 'rgb(0,0,0)' : 'rgb(255,255,255)') : ''}"></ha-icon>` : ''}
                    ${showName ? html`<span class="water-text" style="color: ${isActive ? (theme === 'on' ? 'rgb(0,0,0)' : 'rgb(255,255,255)') : ''}">${customName}</span>` : ''}
                </div>
            </button>
        `;
    });
  }

  _renderHumidifierButtons(modes, currentMode) {
    if (!modes) return html``;

    const entity = this.hass.states[this.config.entity];
    const state = entity ? entity.state : 'off';
    const theme = this._evaluateTheme();
    const modeConfigs = this.config.mode_configs?.available_modes || {};

    const modeIcons = {
        'on': 'mdi:power',
        'off': 'mdi:power-off',
        'auto': 'mdi:autorenew',
        'sleep': 'mdi:sleep',
        'baby': 'mdi:baby',
        'favorite': 'mdi:heart',
        'low': 'mdi:weather-sunny-alert',
        'medium': 'mdi:weather-sunny',
        'high': 'mdi:weather-sunny',
        'normal': 'mdi:fan'
    };

    // 应用过滤器
    const filters = this.config.mode_filters?.available_modes || {};
    const filteredModes = modes.filter(mode => filters[mode] !== false);

    return filteredModes.map(mode => {
        const isActive = mode === currentMode;
        let bgColor = 'rgb(0,0,0,0)';
        const config = modeConfigs[mode] || {};

        // 获取自定义配置
        const showName = config.show_name !== false;
        const showIcon = config.show_icon !== false;
        const customName = config.custom_name || this._translateHumidifierMode(mode);
        const customIcon = config.custom_icon || modeIcons[mode] || 'mdi:water-percent';

        if (isActive) {
            if (mode === 'on') bgColor = 'rgb(33,150,243)';
            else if (mode === 'off') bgColor = theme === 'on' ? 'rgb(180,180,180)' : 'rgb(150,150,150)';
            else bgColor = 'rgb(33,150,243)';
        }

        return html`
            <button
                class="mode-button ${isActive ? 'active-mode' : ''}"
                @click=${() => this._setHumidifierMode(mode)}
                style="--active-color: ${bgColor}; background: ${isActive ? bgColor : 'rgb(0,0,0,0)'}"
                title="${customName}"
            >
                ${showIcon ? html`<ha-icon class="icon" icon="${customIcon}" style="color: ${isActive ? (theme === 'on' ? 'rgb(0,0,0)' : 'rgb(255,255,255)') : ''}"></ha-icon>` : ''}
                ${showName ? html`<span class="mode-text" style="font-size: 10px; color: ${isActive ? (theme === 'on' ? 'rgb(0,0,0)' : 'rgb(255,255,255)') : ''}">${customName}</span>` : ''}
            </button>
        `;
    });
  }

  _setHumidifierMode(mode) {
    if (mode === 'off') {
      this._callService('humidifier', 'turn_off', {
        entity_id: this.config.entity
      });
    } else if (mode === 'on') {
      this._callService('humidifier', 'turn_on', {
        entity_id: this.config.entity
      });
    } else {
      this._callService('humidifier', 'set_mode', {
        entity_id: this.config.entity,
        mode: mode
      });
    }
    this._handleClick();
  }

  _renderHumidifierSwitchButtons() {
    const entity = this.hass.states[this.config.entity];
    if (!entity) return html``;

    const state = entity.state;
    const theme = this._evaluateTheme();
    const modeConfigs = this.config.mode_configs?.humidifier_switch || {};

    const modes = ['on', 'off'];

    // 应用过滤器
    const filters = this.config.mode_filters?.humidifier_switch || {};

    return modes.filter(mode => filters[mode] !== false).map(mode => {
        const isActive = mode === state;
        let bgColor = 'rgb(0,0,0,0)';
        const config = modeConfigs[mode] || {};

        // 获取自定义配置
        const showName = config.show_name !== false;
        const showIcon = config.show_icon !== false;
        const customName = config.custom_name || (mode === 'on' ? '开机' : '关机');
        const customIcon = config.custom_icon || (mode === 'on' ? 'mdi:power' : 'mdi:power-off');

        if (isActive) {
            if (mode === 'on') bgColor = 'rgb(33,150,243)';
            else if (mode === 'off') bgColor = theme === 'on' ? 'rgb(180,180,180)' : 'rgb(150,150,150)';
        }

        return html`
            <button
                class="mode-button ${isActive ? 'active-mode' : ''}"
                @click=${() => mode === 'on' ? this._callService('humidifier', 'turn_on', { entity_id: this.config.entity }) : this._callService('humidifier', 'turn_off', { entity_id: this.config.entity })}
                style="--active-color: ${bgColor}; background: ${isActive ? bgColor : 'rgb(0,0,0,0)'}"
                title="${customName}"
            >
                ${showIcon ? html`<ha-icon class="icon" icon="${customIcon}" style="color: ${isActive ? (theme === 'on' ? 'rgb(0,0,0)' : 'rgb(255,255,255)') : ''}"></ha-icon>` : ''}
                ${showName ? html`<span class="mode-text" style="font-size: 10px; color: ${isActive ? (theme === 'on' ? 'rgb(0,0,0)' : 'rgb(255,255,255)') : ''}">${customName}</span>` : ''}
            </button>
        `;
    });
  }

  _translateHumidifierMode(mode) {
    const translations = {
        'on': '开机',
        'off': '关机',
        'auto': '自动',
        'sleep': '睡眠',
        'baby': '婴儿',
        'favorite': '收藏',
        'low': '低速',
        'medium': '中速',
        'high': '高速',
        'normal': '正常'
    };
    return translations[mode] || mode;
  }

  _renderSelectButtons() {
    if (!this.config.select_entity) return html``;

    const selectEntity = this.hass.states[this.config.select_entity];
    if (!selectEntity) return html``;

    const state = selectEntity.state;
    const attrs = selectEntity.attributes;
    const options = attrs.options || [];
    const theme = this._evaluateTheme();
    const modeConfigs = this.config.mode_configs?.select_modes || {};

    // 获取主实体的状态来确定颜色
    const mainEntity = this.hass.states[this.config.entity];
    const mainEntityState = mainEntity ? mainEntity.state : 'off';
    const isHumidifierEntity = this.config.entity?.startsWith('humidifier.');

    // 应用过滤器
    const filters = this.config.mode_filters?.select_modes || {};
    const filteredOptions = options.filter(option => filters[option] !== false);

    return filteredOptions.map(option => {
        const isActive = option === state;
        let bgColor = 'rgb(0,0,0,0)';
        const config = modeConfigs[option] || {};

        // 获取自定义配置
        const showName = config.show_name !== false;
        const showIcon = config.show_icon !== false;
        const customName = config.custom_name || option;
        const customIcon = config.custom_icon || 'mdi:tune';

        if (isActive) {
            // 根据主实体类型和状态决定颜色
            if (isHumidifierEntity) {
                bgColor = 'rgb(33,150,243)'; // 加湿器使用蓝色
            } else {
                // 空调和热水器实体根据状态决定颜色
                if (mainEntityState === 'cool') bgColor = 'rgb(33,150,243)';
                else if (mainEntityState === 'heat') bgColor = 'rgb(254,111,33)';
                else if (mainEntityState === 'dry') bgColor = 'rgb(255,151,0)';
                else if (mainEntityState === 'fan_only') bgColor = 'rgb(0,188,213)';
                else if (mainEntityState === 'auto') bgColor = 'rgb(47,96,49)';
                else if (mainEntityState === 'off') bgColor = theme === 'on' ? 'rgb(180,180,180)' : 'rgb(150,150,150)';
                else bgColor = 'rgb(33,150,243)'; // 默认蓝色
            }
        }

        return html`
            <button
                class="mode-button ${isActive ? 'active-mode' : ''}"
                @click=${() => this._setSelectOption(option)}
                style="--active-color: ${bgColor}; background: ${isActive ? bgColor : 'rgb(0,0,0,0)'}"
                title="${customName}"
            >
                ${showIcon ? html`<ha-icon class="icon" icon="${customIcon}" style="color: ${isActive ? (theme === 'on' ? 'rgb(0,0,0)' : 'rgb(255,255,255)') : ''}"></ha-icon>` : ''}
                ${showName ? html`<span class="mode-text" style="font-size: 10px; color: ${isActive ? (theme === 'on' ? 'rgb(0,0,0)' : 'rgb(255,255,255)') : ''}">${customName}</span>` : ''}
            </button>
        `;
    });
  }

  _setSelectOption(option) {
    this._callService('select', 'select_option', {
      entity_id: this.config.select_entity,
      option: option
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
          'off': '关闭'
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

customElements.define('xiaoshi-pad-climate-card', XiaoshiPadClimateCard);
