import { LitElement, html, css } from "https://unpkg.com/lit-element@2.4.0/lit-element.js?module";

window.customCards = window.customCards || [];
window.customCards.push({
    type: 'xiaoshi-small-climate-card',
    name: '消逝卡(C微型卡)-空调/水暖毯/热水器卡',
    description: '微型卡空调/水暖毯/热水器卡',
    preview: true
}); 

class XiaoshiSmallClimateCardEditor extends LitElement {
  static get properties() {
    return {
      hass: { type: Object },
      config: { type: Object },
      _searchTerm: { type: String },
      _filteredEntities: { type: Array },
      _showEntityList: { type: Boolean }
    };
  }

  setConfig(config) {
    this.config = { ...config };

    if (this.config.entity && this.hass && this.hass.states[this.config.entity]) {
    }
  }

  firstUpdated() {
    document.addEventListener('click', (e) => {
      if (!e.target.closest('.entity-selector')) {
        this._showEntityList = false;
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
      input {
        padding: 8px;
        border: 1px solid #ddd;
        border-radius: 4px;
      }
      .help-text {
        font-size: 0.85em;
        color: #666;
        margin-top: 4px;
      }

      .row {
        margin-bottom: 16px;
      }
      .label {
        margin-bottom: 8px;
        font-weight: bold;
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
        box-shadow: 0 0 8px rgba(0,0,0,0.25);
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

  _themeSwitchChanged(ev) {
    if (!this.config) return;
    const theme = ev.target.checked ? 'on' : 'off';

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
      finalValue = value || '100%';
    }

    this.config = {
      ...this.config,
      [name]: finalValue
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
  }
}
customElements.define('xiaoshi-small-climate-card-editor', XiaoshiSmallClimateCardEditor);

class XiaoshiSmallClimateCard extends LitElement {
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
    return document.createElement("xiaoshi-small-climate-card-editor");
  }

  static getStubConfig() {
    return {
      entity: "",
      theme: "light",
      width: "100%"
    };
  }

  setConfig(config) {
    this.config = { ...config };
    if (config.width !== undefined) this.width = config.width;
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
        background: linear-gradient(90deg, var(--linear-color), transparent 50%);
        opacity: 0.5;
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

      .temp-area {
        display: flex;
        align-items: center;
        justify-content: center;
        transition: opacity 0.3s ease, max-width 0.3s ease;
        overflow: visible;
        max-width: 200px;
        opacity: 1;
      }

      .temp-area.hidden {
        max-width: 0;
        opacity: 0;
        overflow: hidden;
        padding: 0;
        gap: 0;
      }

      .temp-card {
        display: flex;
        align-items: center;
        gap: 8px;
        background: transparent;
        border-radius: 20px;
        padding: 6px 14px;
        box-shadow: 0 0 8px var(--shadow-color, rgba(0,0,0,0.25));
      }

      .temp-adjust-button {
        background: none;
        border: none;
        cursor: pointer;
        padding: 0;
        display: flex;
        align-items: center;
        justify-content: center;
        color: var(--temp-control-color);
        width: 18px;
        height: 18px;
        border-radius: 50%;
        cursor: default;
      }

      .temp-display {
        font-size: 15px;
        font-weight: bold;
        min-width: 30px;
        text-align: center;
        color: var(--temp-control-color, #333);
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
        height: 32px;
        border-radius: 50%;
        background: transparent;
        border: none;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.2s ease;
        flex-shrink: 0;
      }

      .mode-btn:hover {
        background: rgba(255,255,255,0.1);
      }

      .mode-btn.active {
      }
  `;
  }

  constructor() {
    super();
    this.hass = {};
    this.config = {};
    this.theme = 'light';
    this.width = '100%';
    this._showModes = false;
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
    const temperature =  typeof attrs.temperature === 'number'  ? `${attrs.temperature.toFixed(1)}`  : '';
    
    
    const theme = this._evaluateTheme();
    const fgColor = theme === 'light' ? 'rgb(0, 0, 0)' : 'rgb(255, 255, 255)';
    const bgColor = theme === 'light' ? 'rgb(255, 255, 255)' : 'rgb(50, 50, 50)';
    const shadowColor = theme === 'light' ? 'rgba(0, 0, 0, 0.15)' : 'rgba(150, 150, 150, 0.2)';
    let statusColor = fgColor;
    let linearColor = fgColor;
    const tempControlColor = isOn ? statusColor : fgColor;
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

    // 计算图标背景色：根据当前状态或上次模式的颜色，0.6透明度
    const modeStatusColors = {
        'cool': 'rgb(33,150,243)', 'heat': 'rgb(254,111,33)', 'dry': 'rgb(255,151,0)',
        'fan': 'rgb(0,188,213)', 'fan_only': 'rgb(0,188,213)', 'auto': 'rgb(147,112,219)',
        '自定义': 'rgb(254,111,33)', 'AI控温': 'rgb(254,111,33)',
        '婴童洗': 'rgb(254,111,33)', '舒适洗': 'rgb(254,111,33)',
        '宠物洗': 'rgb(254,111,33)', '厨房用': 'rgb(254,111,33)'
    };
    const iconStatusColor = isOn ? statusColor : null;
    const iconBg = iconStatusColor ? iconStatusColor.replace('rgb(', 'rgba(').replace(')', ',0.2)') : 'transparent';


    const modeIcons = {
        'cool': 'mdi:snowflake',
        'heat': 'mdi:fire',
        'dry': 'mdi:water-percent',
        'fan': 'mdi:fan',
        'fan_only': 'mdi:fan',
        'auto': 'mdi:thermostat-auto',
        '自定义': 'mdi:tune-variant',
        'AI控温': 'mdi:robot',
        '婴童洗': 'mdi:baby-face-outline',
        '舒适洗': 'mdi:shower',
        '宠物洗': 'mdi:paw',
        '厨房用': 'mdi:pot-steam-outline',
        'off': 'mdi:fan-off',
        'unknown': 'mdi:fan-off',
        'unavailable': 'mdi:fan-off'
    };
    const mainIcon = isOn ? (modeIcons[state] || 'mdi:fan') : 'mdi:fan-off';

    // 关闭时不再获取历史记录

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

    return html` 
      <div class="card" style="width: ${this.width};
                                background: ${bgColor};
                                color: ${fgColor};
                                --active-color: ${statusColor};
                                --linear-color: ${linearColor};
                                --shadow-color: ${shadowColor};
                                --temp-control-color: ${tempControlColor};
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
                <div class="status-text">${translatedState}${attrs.current_temperature ? ' · ' + attrs.current_temperature + '°C' : ''}</div>
            </div>
            <div class="right-section">
                <div class="temp-area ${this._showModes ? 'hidden' : ''}">
                    <div class="temp-card">
                        <button class="temp-adjust-button" @click=${() => this._adjustTemperature('down')}>
                            <ha-icon icon="mdi:minus" style="color: var(--temp-control-color);"></ha-icon>
                        </button>
                        <div class="temp-display" style="color: var(--temp-control-color);">${temperature}</div>
                        <button class="temp-adjust-button" @click=${() => this._adjustTemperature('up')}>
                            <ha-icon icon="mdi:plus" style="color: var(--temp-control-color);"></ha-icon>
                        </button>
                    </div>
                </div>
                <div class="modes-area ${this._showModes ? '' : 'hidden'}">
                    ${hasHvacModes ? (() => {
                        let modes = attrs.hvac_modes.filter(m => m !== 'off');
                        // 开启时：如果没有off模式，追加关闭选项
                        // 始终不在模式列表显示off
                        return modes.map(mode => {
                            const modeIcon = modeIcons[mode] || 'mdi:thermostat';
                            const isActive = state === mode;
                            const modeColor = modeStatusColors[mode] || fgColor;
                            return html`
                                <button 
                                    class="mode-btn ${isActive ? 'active' : ''}" 
                                    @click=${() => this._selectMode(mode)}
                                    title="${this._translateMode(mode)}"
                                >
                                    <ha-icon icon="${modeIcon}" style="--mdc-icon-size: 18px; color: ${isActive ? statusColor : modeColor};"></ha-icon>
                                </button>
                            `;
                        });
                    })() : ''}
                </div>
        </div>
        <div class="power-area">
            <button class="power-button" 
                @click=${this._togglePower}>
                <ha-icon 
                    class="power-icon"
                    icon="${this._showModes ? 'mdi:power' : 'mdi:thermostat'}"
                    style="color: ${this._showModes ? 'var(--temp-control-color)' : (isOn ? statusColor : fgColor)};"
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

  _togglePower() {
      const entity = this.hass.states[this.config.entity];
      if (!entity) return;
      const isOn = entity.state !== 'off' && entity.state !== 'unavailable' && entity.state !== 'unknown';

      if (this._showModes) {
          if (isOn) {
              // 开启状态已展开：关闭空调
              this._callService('climate', 'turn_off', {
                  entity_id: this.config.entity
              });
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

  _selectMode(mode) {
      this._callService('climate', 'set_hvac_mode', {
          entity_id: this.config.entity,
          hvac_mode: mode
      });
      this._showModes = false;
      this._handleClick();
  }

  _callService(domain, service, data) {
      this.hass.callService(domain, service, data);
      this._handleClick();
  }
} 
customElements.define('xiaoshi-small-climate-card', XiaoshiSmallClimateCard);

