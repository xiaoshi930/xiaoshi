import { LitElement, html, css } from "https://unpkg.com/lit-element@2.4.0/lit-element.js?module";

window.customCards = window.customCards || [];
window.customCards.push({
    type: 'xiaoshi-small-humidifier-card',
    name: '消逝卡(小卡)-加湿器卡',
    description: '小卡加湿器卡',
    preview: true
});

class XiaoshiSmallHumidifierCardEditor extends LitElement {
  static get properties() {
    return {
      hass: { type: Object },
      config: { type: Object },
      _searchTerm: { type: String },
      _filteredEntities: { type: Array },
      _showEntityList: { type: Boolean },
      _selectSearchTerm: { type: String },
      _filteredSelectEntities: { type: Array },
      _showSelectList: { type: Boolean }
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

      .help-text {
        font-size: 0.85em;
        color: #666;
        margin-top: 4px;
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

        <!-- 主题选择 -->
        <div class="row">
          <div class="label">主题模式</div>
          <ha-switch
            .checked=${this.config.theme !== 'off'}
            @change=${this._themeSwitchChanged}
            .configValue=${'theme'}
          ></ha-switch>
          <span style="margin-left: 8px">
            ${this.config.theme !== 'off' ? '亮色(on)' : '暗色(off)'}
          </span>
        </div>

        <!-- 宽度设置 -->
        <div class="row">
          <div class="label">卡片宽度：支持像素(px)和百分比(%)，默认100%</div>
          <input
            type="text"
            @change=${this._widthChanged}
            .value=${this.config.width !== undefined ? this.config.width : '100%'}
            name="width"
            placeholder="默认100%"
            class="entity-search-input"
          />
          <div class="help-text">
            输入宽度值，例如：100%、300px
          </div>
        </div>
      </div>
    `;
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
customElements.define('xiaoshi-small-humidifier-card-editor', XiaoshiSmallHumidifierCardEditor);

class XiaoshiSmallHumidifierCard extends LitElement {
  static get properties() { 
    return {
      hass: { type: Object },
      width: { type: String, attribute: true },
      config: { type: Object },
      theme: { type: String },
      _showModes: { type: Boolean }
    };
  }
  static getConfigElement() {
    return document.createElement("xiaoshi-small-humidifier-card-editor");
  }

  static getStubConfig() {
    return {
      entity: "",
      theme: "on",
      width: "100%"
    };
  }

  setConfig(config) {
    this.config = { ...config };
    if (config.width !== undefined) this.width = config.width;
    this._fanModeSelectEntity = config.select || '';
    this.requestUpdate();
  }
  
  static get styles() { 
    return css`
      :host {
        display: block;
      }
      
      .card {
        position: relative;
        border-radius: 12px;
        overflow: visible;
        box-sizing: border-box;
      }
      
      .content-container {
        position: relative;
        z-index: 1;
        height: 100%;
        display: grid;
        grid-template-areas: 
            "icon info right";
        grid-template-columns: 56px 1fr auto;
        grid-template-rows: 1fr;
        align-items: center;
        gap: 12px;
        padding: 8px 12px;
      }

      .active-gradient {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: var(--linear-color);
        opacity: 0.15;
        z-index: 0;
        border-radius: 12px;
      }

      .icon-area {
        grid-area: icon;
        display: flex;
        align-items: center;
        justify-content: center;
        position: relative;
        z-index: 2;
      }

      .main-icon-container {
        width: 40px;
        height: 40px;
        border-radius: 50%;
        background: var(--icon-bg, transparent);
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 0 8px var(--shadow-color, rgba(0,0,0,0.25));
      }

      .main-icon {
        --mdc-icon-size: 28px;
        transition: transform 0.3s ease;
      }

      .info-area {
        grid-area: info;
        display: flex;
        flex-direction: column;
        justify-content: center;
        gap: 4px;
        overflow: visible;
        position: relative;
        z-index: 2;
      }

      .name-text {
        font-size: 15px;
        font-weight: bold;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .status-text {
        font-size: 12px;
        opacity: 0.7;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .right-section {
        grid-area: right;
        display: flex;
        align-items: center;
        gap: 8px;
        position: relative;
        z-index: 1;
        padding-right: 48px;
      }

      .speed-area {
        display: flex;
        align-items: center;
        justify-content: center;
        transition: opacity 0.3s ease, max-width 0.3s ease;
        overflow: visible;
        max-width: 200px;
        opacity: 1;
      }

      .speed-area.hidden {
        max-width: 0;
        opacity: 0;
        overflow: hidden;
        padding: 0;
        gap: 0;
      }

      .speed-card {
        display: flex;
        align-items: center;
        gap: 8px;
        background: transparent;
        border-radius: 20px;
        padding: 6px 14px;
        box-shadow: 0 0 8px var(--shadow-color, rgba(0,0,0,0.25));
      }

      .speed-adjust-button {
        background: none;
        border: none;
        cursor: pointer;
        padding: 0;
        display: flex;
        align-items: center;
        justify-content: center;
        color: var(--speed-control-color);
        width: 18px;
        height: 18px;
        border-radius: 50%;
        cursor: default;
      }

      .speed-display {
        font-size: 15px;
        font-weight: bold;
        min-width: 30px;
        text-align: center;
        color: var(--speed-control-color, #333);
      }

      .power-area {
        position: absolute;
        right: 12px;
        top: 50%;
        transform: translateY(-50%);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 3;
      }

      .power-button {
        width: 40px;
        height: 40px;
        border-radius: 50%;
        background: transparent;
        border: none;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 0 8px var(--shadow-color, rgba(0,0,0,0.25));
        cursor: default;
      }

      .power-icon {
        --mdc-icon-size: 22px;
        transition: all 0.3s ease;
      }

      .modes-area {
        display: flex;
        align-items: center;
        gap: 4px;
        transition: opacity 0.3s ease, max-width 0.3s ease;
        overflow: visible;
        max-width: 200px;
        opacity: 1;
      }

      .modes-area.hidden {
        max-width: 0;
        opacity: 0;
        padding: 0;
        gap: 0;
        overflow: hidden;
      }

      .mode-btn {
        width: 32px;
        height: auto;
        border-radius: 16px;
        background: transparent;
        border: none;
        cursor: pointer;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        transition: all 0.2s ease;
        flex-shrink: 0;
        gap: 2px;
        padding: 4px 2px;
      }

      .mode-btn:hover {
        background: rgba(255,255,255,0.1);
      }

      .mode-btn.active {
      }

      .mode-btn-text {
        font-size: 8px;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        max-width: 32px;
        text-align: center;
        line-height: 1;
      }
  `;
  }

  constructor() {
    super();
    this.hass = {};
    this.config = {};
    this.theme = 'on';
    this.width = '100%';
    this._showModes = false;
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
    const attrs = entity.attributes;
    const theme = this._evaluateTheme();

    // 获取当前湿度
    let currentHumidity = '';
    if (typeof attrs.current_humidity === 'number') {
      currentHumidity = `${attrs.current_humidity}%`;
    }

    // 获取目标湿度
    const targetHumidity = typeof attrs.humidity === 'number' ? `${attrs.humidity}%` : '';

    // 获取风机档位（对应空调的模式）
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
    }
    if (currentFanMode === 'unavailable') currentFanMode = '';

    // 颜色变量
    const fgColor = theme === 'on' ? 'rgb(0, 0, 0)' : 'rgb(255, 255, 255)';
    const bgColor = theme === 'on' ? 'rgb(255, 255, 255)' : 'rgb(50, 50, 50)';
    const shadowColor = theme === 'on' ? 'rgba(0, 0, 0, 0.15)' : 'rgba(150, 150, 150, 0.2)';
    let statusColor = fgColor;
    let linearColor = fgColor;
    const speedControlColor = isOn ? statusColor : fgColor;

    // 加湿器模式对应颜色
    const modeStatusColors = {};
    const modeIconMap = {
      '自动': 'mdi:fan-auto',
      '最爱': 'mdi:heart',
      '睡眠': 'mdi:power-sleep',
      'auto': 'mdi:fan-auto',
      'favorite': 'mdi:heart',
      'sleep': 'mdi:power-sleep',
      '恒湿': 'mdi:water-sync',
      '强力': 'mdi:water',
      'Constant Humidity': 'mdi:water-sync',
      'Strong': 'mdi:water',
      'Sleep': 'mdi:power-sleep'
    };
    const fanModeColors = [
      'rgb(33,150,243)', 'rgb(254,111,33)', 'rgb(255,151,0)',
      'rgb(0,188,213)', 'rgb(147,112,219)', 'rgb(76,175,80)',
      'rgb(233,30,99)', 'rgb(0,150,136)'
    ];
    fanModes.forEach((mode, i) => {
      modeStatusColors[mode] = fanModeColors[i % fanModeColors.length];
    });

    // 当前模式对应的颜色
    if (isOn && currentFanMode && modeStatusColors[currentFanMode]) {
      statusColor = modeStatusColors[currentFanMode];
      linearColor = modeStatusColors[currentFanMode];
    }

    // 图标背景色
    const iconStatusColor = isOn ? statusColor : null;
    const iconBg = iconStatusColor ? iconStatusColor.replace('rgb(', 'rgba(').replace(')', ',0.2)') : 'transparent';

    // 主图标
    const mainIcon = isOn ? (currentFanMode ? (modeIconMap[currentFanMode] || 'mdi:air-humidifier') : 'mdi:air-humidifier') : 'mdi:air-humidifier-off';

    // 状态显示
    let translatedState;
    if (state === 'off') {
      translatedState = '关闭';
    } else if (state === 'unknown') {
      translatedState = '未知';
    } else if (state === 'unavailable') {
      translatedState = '离线';
    } else if (isOn && currentFanMode) {
      translatedState = currentFanMode;
    } else if (isOn) {
      translatedState = '开启';
    } else {
      translatedState = state;
    }

    // 风机档位显示（对应空调的设置温度）
    const fanSpeedDisplay = currentFanMode || targetHumidity;

    return html` 
      <div class="card" style="width: ${this.width};
                                background: ${bgColor};
                                color: ${fgColor};
                                --active-color: ${statusColor};
                                --linear-color: ${linearColor};
                                --shadow-color: ${shadowColor};
                                --speed-control-color: ${speedControlColor};
                                --icon-bg: ${iconBg};">
                                                                
        ${isOn ? html`<div class="active-gradient"></div>` : ''}
        <div class="content-container">
            <div class="icon-area">
                <div class="main-icon-container">
                    <ha-icon 
                        class="main-icon" 
                        icon="${mainIcon}"
                        style="color: ${isOn ? statusColor : fgColor}"
                    ></ha-icon>
                </div>
            </div>
            <div class="info-area">
                <div class="name-text">${attrs.friendly_name}</div>
                <div class="status-text">${translatedState}${currentHumidity ? ' · ' + currentHumidity : ''}</div>
            </div>
            <div class="right-section">
                <div class="speed-area ${this._showModes ? 'hidden' : ''}">
                    <div class="speed-card">
                        <button class="speed-adjust-button" @click=${() => this._setFanOptionPrevious()}>
                            <ha-icon icon="mdi:minus" style="color: var(--speed-control-color);"></ha-icon>
                        </button>
                        <div class="speed-display" style="color: var(--speed-control-color);">${fanSpeedDisplay}</div>
                        <button class="speed-adjust-button" @click=${() => this._setFanOptionNext()}>
                            <ha-icon icon="mdi:plus" style="color: var(--speed-control-color);"></ha-icon>
                        </button>
                    </div>
                </div>
                <div class="modes-area ${this._showModes ? '' : 'hidden'}">
                    ${hasFanModes ? fanModes.map(mode => {
                        const isActive = currentFanMode === mode && isOn;
                        const modeColor = modeStatusColors[mode] || fgColor;
                        const modeIcon = modeIconMap[mode] || 'mdi:water';
                        return html`
                            <button 
                                class="mode-btn ${isActive ? 'active' : ''}" 
                                @click=${() => this._selectMode(mode)}
                                title="${mode}"
                            >
                                <ha-icon icon="${modeIcon}" style="--mdc-icon-size: 18px; color: ${isActive ? statusColor : modeColor};"></ha-icon>
                                <span class="mode-btn-text" style="color: ${isActive ? statusColor : modeColor};">${mode}</span>
                            </button>
                        `;
                    }) : ''}
                </div>
        </div>
        <div class="power-area">
            <button class="power-button" 
                @click=${this._togglePower}>
                <ha-icon 
                    class="power-icon"
                    icon="${this._showModes ? 'mdi:power' : 'mdi:air-humidifier'}"
                    style="color: ${this._showModes ? 'var(--speed-control-color)' : (isOn ? statusColor : fgColor)};"
                ></ha-icon>
            </button>
        </div>
      </div>
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

  _selectMode(mode) {
    const entity = this.hass.states[this.config.entity];
    // 如果设备关闭，先开启设备
    if (entity && (entity.state === 'off' || entity.state === 'unavailable' || entity.state === 'unknown')) {
      this._callService('humidifier', 'turn_on', { entity_id: this.config.entity });
    }
    this._setFanOption(mode);
    this._showModes = false;
    this._handleClick();
  }

  _togglePower() {
    const entity = this.hass.states[this.config.entity];
    if (!entity) return;
    const isOn = entity.state !== 'off' && entity.state !== 'unavailable' && entity.state !== 'unknown';

    if (this._showModes) {
      if (isOn) {
        // 开启状态已展开：关闭加湿器
        this._callService('humidifier', 'turn_off', { entity_id: this.config.entity });
        this._showModes = false;
        this._handleClick();
        return;
      } else {
        // 关闭状态已展开：收回
        this._showModes = false;
        this.requestUpdate();
        return;
      }
    }
    // 未展开：展开模式面板
    this._showModes = true;
    this.requestUpdate();
  }

  _setFanOption(mode) {
    if (this._fanModeSelectEntity) {
      this._callService('select', 'select_option', {
          entity_id: this._fanModeSelectEntity,
          option: mode
      });
    }
  }

  _setFanOptionNext() {
    if (this._fanModeSelectEntity) {
      this._callService('select', 'select_next', {
          entity_id: this._fanModeSelectEntity
      });
    }
    this._handleClick();
  }

  _setFanOptionPrevious() {
    if (this._fanModeSelectEntity) {
      this._callService('select', 'select_previous', {
          entity_id: this._fanModeSelectEntity
      });
    }
    this._handleClick();
  }

  _callService(domain, service, data) {
      this.hass.callService(domain, service, data);
      this._handleClick();
  }
} 
customElements.define('xiaoshi-small-humidifier-card', XiaoshiSmallHumidifierCard);





