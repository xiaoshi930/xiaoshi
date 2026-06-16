import { LitElement, html, css } from "https://unpkg.com/lit-element@2.4.0/lit-element.js?module";

window.customCards = window.customCards || [];
window.customCards.push({
    type: 'xiaoshi-light-card',
    name: '消逝卡(移动端)-房间灯光卡',
    description: '移动端房间灯光卡'
});

class XiaoshiLghtCardEditor extends LitElement {
  static get properties() {
    return {
      hass: { type: Object },
      config: { type: Object },
      _entitySearchTerms: { type: Object },
      _filteredEntities: { type: Object },
      _showEntityLists: { type: Object }
    };
  }

  setConfig(config) {
    this.config = config || {};
  }

  firstUpdated() {
    document.addEventListener('click', (e) => {
      if (!e.target.closest('.entity-selector')) {
        if (this._showEntityLists) {
          Object.keys(this._showEntityLists).forEach(key => {
            this._showEntityLists[key] = false;
          });
        }
        this.requestUpdate();
      }
    });
  }

  _onEntitySearch(e, index) {
    const searchTerm = e.target.value.toLowerCase();

    if (!this._entitySearchTerms) this._entitySearchTerms = {};
    if (!this._filteredEntities) this._filteredEntities = {};
    if (!this._showEntityLists) this._showEntityLists = {};

    this._entitySearchTerms[index] = searchTerm;
    this._showEntityLists[index] = true;

    if (!this.hass) return;

    const allEntities = Object.values(this.hass.states);

    this._filteredEntities[index] = allEntities.filter(entity => {
      const entityId = entity.entity_id.toLowerCase();
      const friendlyName = (entity.attributes.friendly_name || '').toLowerCase();
      const isSupportedType = entityId.startsWith('light.') || entityId.startsWith('switch.');
      const matchesSearch = entityId.includes(searchTerm) || friendlyName.includes(searchTerm);
      return isSupportedType && matchesSearch;
    }).slice(0, 50);

    this.requestUpdate();
  }

  _selectEntity(entityId, index) {
    const entities = [...(this.config.entities || [])];
    entities[index] = entityId;

    this.config = {
      ...this.config,
      entities
    };

    if (!this._entitySearchTerms) this._entitySearchTerms = {};
    if (!this._showEntityLists) this._showEntityLists = {};

    this._entitySearchTerms[index] = '';
    this._showEntityLists[index] = false;

    this._fireEvent();
    this.requestUpdate();
  }

  _addEntity() {
    const entities = [...(this.config.entities || [])];
    entities.push('');
    this.config = {
      ...this.config,
      entities
    };
    this._fireEvent();
  }

  _removeEntity(index) {
    const entities = [...(this.config.entities || [])];
    entities.splice(index, 1);
    this.config = {
      ...this.config,
      entities: entities.length > 0 ? entities : undefined
    };
    this._fireEvent();
    this.requestUpdate();
  }

  _valueChanged(e) {
    if (!this.config) return;
    const configValue = e.target.name;
    const value = e.target.value;

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

  _switchChanged(e) {
    if (!this.config) return;
    this.config = {
      ...this.config,
      [e.target.name]: e.target.checked
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
        min-height: 300px;
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
        color: #000;
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
        height: 200px;
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
      }
      .entity-option.selected {
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
        color: #000;
        font-style: italic;
      }
      .entity-item {
        background: #f5f5f5;
        border-radius: 8px;
        padding: 10px;
        margin-bottom: 8px;
      }
      .entity-row {
        color: #000;
        display: flex;
        align-items: center;
        gap: 8px;
      }
      .entity-row .entity-selector {
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
    if (!this.hass) return html``;

    return html`
      <div class="form">
        <div class="form-group">
          <label>房间名称</label>
          <input
            type="text"
            @change=${this._valueChanged}
            .value=${this.config.room_name || ''}
            name="room_name"
            placeholder="例如：客厅、卧室"
          />
        </div>

        <div class="form-group">
          <label>灯光实体列表</label>
          ${(this.config.entities || []).map((entity, index) => html`
            <div class="entity-item">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 5px;">
                <span style="font-weight: bold; font-size: 13px;color: #000;">灯光 #${index + 1}</span>
                <button class="remove-button" @click=${() => this._removeEntity(index)} title="移除此实体">
                  <ha-icon icon="mdi:close"></ha-icon>
                </button>
              </div>
              <div class="entity-row">
                <div class="entity-selector">
                  <input
                    type="text"
                    @input=${(e) => this._onEntitySearch(e, index)}
                    @focus=${(e) => this._onEntitySearch(e, index)}
                    .value=${this._entitySearchTerms?.[index] || entity || ''}
                    placeholder="搜索 light/switch 实体..."
                    class="entity-search-input"
                  />
                  ${this._showEntityLists?.[index] ? html`
                    <div class="entity-dropdown">
                      ${this._filteredEntities?.[index]?.map(e => html`
                        <div
                          class="entity-option ${entity === e.entity_id ? 'selected' : ''}"
                          @click=${() => this._selectEntity(e.entity_id, index)}
                        >
                          <div class="entity-info">
                            <ha-icon icon="${e.attributes.icon || 'mdi:help-circle'}"></ha-icon>
                            <div class="entity-details">
                              <div class="entity-name">${e.attributes.friendly_name || e.entity_id}</div>
                              <div class="entity-id">${e.entity_id}</div>
                            </div>
                          </div>
                          ${entity === e.entity_id ?
                            html`<ha-icon icon="mdi:check" class="check-icon"></ha-icon>` : ''}
                        </div>
                      `)}
                      ${!this._filteredEntities?.[index] || this._filteredEntities[index].length === 0 ? html`
                        <div class="no-results">未找到匹配的实体</div>
                      ` : ''}
                    </div>
                  ` : ''}
                </div>
              </div>
            </div>
          `)}
          <div style="display: flex; align-items: center; margin-top: 8px;">
            <mwc-button
              class="add-button"
              @click=${this._addEntity}
              outlined
            >
              添加灯光
            </mwc-button>
          </div>
        </div>

        <div class="form-group">
          <div style="display: flex; align-items: center; gap: 8px;">
            <ha-switch
              .checked=${!!this.config.rgb}
              @change=${(e) => {
                this.config = { ...this.config, rgb: e.target.checked };
                this._fireEvent();
              }}
              name="rgb"
            ></ha-switch>
            <span>显示亮度/色温调节滑块</span>
          </div>
        </div>

        <div class="form-group">
          <div style="display: flex; align-items: center; gap: 8px;">
            <ha-switch
              .checked=${this.config.show_scene !== false}
              @change=${(e) => {
                this.config = { ...this.config, show_scene: e.target.checked };
                this._fireEvent();
              }}
              name="show_scene"
            ></ha-switch>
            <span>显示情景模式</span>
          </div>
        </div>

        <div class="form-group">
          <label>主题</label>
          <select
            @change=${this._valueChanged}
            .value=${this.config.theme !== undefined ? this.config.theme : 'system'}
            name="theme"
          >
            <option value="system">跟随系统</option>
            <option value="theme()">跟随函数</option>
            <option value="light">浅色主题（白底黑字）</option>
            <option value="dark">深色主题（黑底白字）</option>
          </select>
        </div>

        <div class="form-group">
          <label>显示模式</label>
          <select
            @change=${this._valueChanged}
            .value=${this.config.show !== undefined ? this.config.show : 'always'}
            name="show"
          >
            <option value="always">始终显示</option>
            <option value="auto">仅开启时显示</option>
          </select>
        </div>

        <div class="form-group">
          <label>卡片宽度</label>
          <input
            type="text"
            @change=${this._valueChanged}
            .value=${this.config.width !== undefined ? this.config.width : '100%'}
            name="width"
            placeholder="默认 100%"
          />
        </div>
      </div>
    `;
  }

  constructor() {
    super();
    this._entitySearchTerms = {};
    this._filteredEntities = {};
    this._showEntityLists = {};
  }
}
customElements.define('xiaoshi-light-card-editor', XiaoshiLghtCardEditor);

class XiaoshiLghtCard extends LitElement {
  static properties = {
    hass: { type: Object },
    config: { type: Object, state: true },
    _onCount: { type: Number, state: true },
    _sliderValues: { type: Object, state: true },
    _showScenes: { type: Object, state: true }
  };

  static getConfigElement() {
    return document.createElement("xiaoshi-light-card-editor");
  }

  static getStubConfig() {
    return {
      entities: [],
      room_name: "",
      theme: "system"
    };
  }

  static styles = css`
    .scenes-container {
      display: flex;
      flex-wrap: wrap;
      gap: 3px;
      padding: 0px;
      z-index: 1;
      align-items: center;
    }
    .scene-button {
      padding: 2px 6px;
      border-radius: 6px;
      background: rgba(180, 180, 180, 0.2);
      font-size: 0.7rem;
      cursor: default;
      transition: all 0.3s ease;
      display: flex;
      align-items: center;
      justify-content: start;
      height: 20px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      gap: 4px;
    }
    .card-container {
      border-radius: 16px;
      overflow: hidden;
      display: flex;
      flex-direction: column;
      padding-bottom: 10px;
    }
    .card-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 16px;
      margin: 0;
      position: relative;
    }
    .card-header::after {
      content: '';
      position: absolute;
      bottom: 0;
      left: 16px;
      right: 16px;
      height: 1px;
      background: rgb(150,150,150,0.5);
    }
    .card-header-left {
      display: flex;
      align-items: center;
      gap: 8px;
      flex: 1;
    }
    .status-dot {
      display: inline-block;
      width: 8px;
      height: 8px;
      border-radius: 50%;
      margin-right: 8px;
      flex-shrink: 0;
    }
    .room-name {
      font-size: 20px;
      font-weight: 500;
      height: 30px;
      line-height: 30px;
      display: flex;
      align-items: center;
    }
    .light-count {
      font-size: 13px;
      border-radius: 8px;
      width: 30px;
      height: 30px;
      text-align: center;
      line-height: 30px;
      font-weight: bold;
    }
    .card-header-buttons {
      display: flex;
      gap: 6px;
    }
    .header-btn {
      padding: 4px 12px;
      border-radius: 8px;
      font-size: 0.8rem;
      cursor: default;
      transition: all 0.2s ease;
      font-weight: 500;
    }
    .header-btn:hover {
      opacity: 0.85;
      transform: scale(1.05);
    }
    .light-list {
      display: flex;
      flex-direction: column;
    }
    .light-row {
      display: flex;
      align-items: center;
      gap: 12px;
      min-height: 50px;
      position: relative;
      transition: background 0.3s ease;
      border-bottom: 1px solid rgb(150,150,150,0.5);
      margin: 0 24px;
      padding: 0px 6px;
    }
    .light-name-group {
      position: relative;
      flex-shrink: 0;
      z-index: 1;
      width: 25%;
    }
    .light-name {
      font-size: 14px;
      font-weight: 500;
      width: 25%;
      flex-shrink: 0;
      z-index: 1;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .scene-mode-button {
      position: absolute;
      margin-bottom: 6px;
      left: 0;
      padding: 1px 4px;
      font-size: 0.7rem;
      border-radius: 6px;
      background: rgba(180, 180, 180, 0.2);
      color: #FE6F21;
      cursor: pointer;
      transition: all 0.3s ease;
      width: fit-content;
    }
    .light-controls {
      flex: 0 0 55%;
      max-width: 55%;
      display: flex;
      flex-direction: column;
      gap: 6px;
      z-index: 1;
      padding: 6px 0;
    }
    .slider-group {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }
    .slider-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .slider-label {
      font-size: 0.7rem;
      background: rgb(0,0,0,0);
      line-height: 1.1;
    }
    .slider-value {
      font-size: 0.7rem;
      background: rgb(0,0,0,0);
      line-height: 1.1;
    }
    .slider-track {
      width: 100%;
      height: 10px;
      border-radius: 7px;
      position: relative;
      cursor: default;
    }    
    .slider-track.brightness-track {
      background: rgba(254, 111, 33, 0.3);
    }    
    .slider-track.color_temp-track {
      background: linear-gradient(to right, #f6a503, #ADD8E6) !important;
    }    
    .slider-track.inactive {
      background: rgb(180,180,180,0.5) !important;
    }    
    .slider-progress {
      position: absolute;
      left: 0;
      height: 100%;
      background: #fe6f21;
      border-radius: 7px;
      transition: width 0.2s ease;
      cursor: default;
    }    
    .slider-progress.color_temp-track {
      background: rgb(0,0,0,0) !important;
    }    
    .slider-input {
      position: absolute;
      width: 100%;
      height: 100%;
      top: 50%;
      transform: translateY(-50%);
      opacity: 0;
      z-index: 2;
      cursor: default;
      -webkit-appearance: none;
    }
    .slider-thumb {
      position: absolute;
      width: 14px;
      height: 14px;
      background: #fff;
      border-radius: 50%;
      top: 50%;
      transform: translate(-50%, -50%);
      pointer-events: none;
      z-index: 3;
    }    
    .slider-thumb.inactive {
      opacity: 0;
    }
    .slider-progress.inactive {
      width: 0 !important;
    }
    .power-button {
      width: 36px;
      height: 36px;
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: default;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      flex-shrink: 0;
      margin-left: auto;
    }
    .power-button.active {
      background: #fe6f21;
    }
    ha-icon {
      --mdc-icon-size: 22px;
      color: var(--icon-color, #666666);
    }
    .power-button.active ha-icon {
      color: white;
    }
  `;

  constructor() {
    super();
    this.config = null;
    this._hass = null;
    this._onCount = 0;
    this._sliderValues = {};
    this._debounceTimers = {};
    this._showScenes = {};
  }

  setConfig(config) {
    const configCopy = JSON.parse(JSON.stringify(config));
    const normalizedEntities = this._normalizeEntities(configCopy);
    this.config = {
      entities: normalizedEntities,
      room_name: configCopy.room_name || '',
      rgb: configCopy.rgb,
      show_scene: configCopy.show_scene !== false,
      theme: configCopy.theme || 'system',
      width: configCopy.width || '100%',
      height: configCopy.height || '60px',
      show: configCopy.show,
      total: config.total !== undefined ? config.total : 'on',
      columns: config.columns || 1
    };
    normalizedEntities.forEach(entity => {
      this._sliderValues[entity] = {
        brightness: null,
        color_temp: null
      };
      this._showScenes[entity] = false;
    });
    this.requestUpdate();
  }

  _normalizeEntities(config) {
    if (config.entities) {
      return Array.isArray(config.entities) 
        ? [...config.entities]
        : [config.entities];
    }
    if (config.entity) {
      return Array.isArray(config.entity)
        ? [...config.entity]
        : [config.entity];
    }
    throw new Error('必须配置至少一个实体');
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

  _handleClick(){
    const hapticEvent = new Event('haptic', {
      bubbles: true,
      cancelable: false,
      composed: true
    });
    hapticEvent.detail = 'light';
    this.dispatchEvent(hapticEvent);
  }

  _renderHeader(onCount, totalCount) {
    const theme = this._evaluateTheme();
    const isDark = theme === 'dark';
    const textColor = isDark ? '#FFF' : '#333';
    const dotColor = onCount > 0 ? '#FE6F21' : textColor;
    const countBg = onCount > 0 ? 'rgba(254, 111, 33, 0.8)' : (isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.08)');

    return html`
      <div class="card-header">
        <div class="card-header-left">
          <span class="room-name" style="color: ${textColor}">
            <span class="status-dot" style="background: ${dotColor}"></span>
            ${this.config.room_name || '灯光'}
          </span>
          <span class="light-count" style="color: ${textColor}; background: ${countBg}">${onCount}</span>
        </div>
        <div class="card-header-buttons">
          <div 
            class="header-btn"
            style="background: #FE6F21; color: #FFF;"
            @click=${this._turnOnAll}
          >全开</div>
          <div 
            class="header-btn"
            style="background: ${isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.08)'}; color: ${textColor}; opacity: ${onCount > 0 ? 1 : 0.5};"
            @click=${this._turnOffAll}
          >全关</div>
        </div>
      </div>
    `;
  }

  _renderEntity(entity) {
    if (!this.hass?.states[entity]) {
      console.error(`实体 ${entity} 不存在`);
      return html``;
    }
    const stateObj = this.hass.states[entity] || {};
    const state = stateObj.state || 'off';
    const isActive = state === 'on';
    const attributes = stateObj.attributes || {};
    const showMode = this.config.show || 'always';
    const showCard = showMode === 'auto' ? state === 'on' : true;
    if (!showCard) return html``;

    const showScenes = this._showScenes[entity];
    const hasScenes = attributes.effect_list && attributes.effect_list.length > 0;
    const canShowScene = this.config.show_scene !== false && hasScenes;
    const theme = this._evaluateTheme();
    const isDark = theme === 'dark';
    const textColor = isDark ? '#FFF' : '#333';
    const bgColor = isActive
      ? (isDark ? 'rgba(254, 111, 33, 0.15)' : 'rgba(254, 111, 33, 0.15)')
      : 'transparent';

    if (showScenes && canShowScene) {
      return html`
        <div class="light-row" style="background: ${bgColor};">
          <div class="light-name-group">
            <span class="light-name" style="color: ${textColor}">${attributes.friendly_name || entity}</span>
            <div class="scene-mode-button"
              style="color: ${isDark ? '#FFF' : '#333'}"
              @click=${() => this._toggleSceneMode(entity)}>
              返回
            </div>
          </div>
          <div class="light-controls">
            ${this._renderScenes(entity)}
          </div>
          ${this._renderPowerButton(entity, isActive)}
        </div>
      `;
    }

    return html`
      <div class="light-row" style="background: ${bgColor};">
        <div class="light-name-group">
          <span class="light-name" style="color: ${textColor}">${attributes.friendly_name || entity}</span>
          ${canShowScene ? html`
            <div class="scene-mode-button"
              style="color: ${isDark ? '#FFF' : '#333'}"
              @click=${() => this._toggleSceneMode(entity)}>
              情景模式
            </div>
          ` : ''}
        </div>
        ${this.config.rgb ? this._renderControls(entity, isActive, attributes) : html`<div class="light-controls"></div>`}
        ${this._renderPowerButton(entity, isActive)}
      </div>
    `;
  }

  _renderControls(entity, isActive, attributes) {
    const themeColor = this._evaluateTheme() === 'light' ? '#333' : '#FFF';
    const controls = [];
    if (attributes.brightness !== undefined) {
      const brightness = Math.max(5, Math.min(255, attributes.brightness || 5));
      const brightnessPercent = ((brightness - 5) / 250 * 100).toFixed(1);
      controls.push(this._renderSlider(
        entity, '亮度', 'brightness', themeColor, 
        brightness, 5, 255, brightnessPercent, isActive
      ));
    }
    if (attributes.supported_color_modes?.includes('color_temp')) {
      const kelvin = attributes.color_temp_kelvin || Math.round(1000000 / (attributes.color_temp || 370));
      const colorTempPercent = ((kelvin - 2700) / 3800 * 100).toFixed(1);
      controls.push(this._renderSlider(
        entity, '色温', 'color_temp', themeColor,
        kelvin, 2700, 6500, colorTempPercent, isActive
      ));
    }
    return html`
      <div class="light-controls">
        ${controls}
      </div>
    `;
  }

  _renderSlider(entity, label, type, color, value, min, max, percent, isActive) {
    const currentValue = this._sliderValues[entity]?.[type] ?? value;
    const currentPercent = ((currentValue - min) / (max - min) * 100).toFixed(1);
    return html`
      <div class="slider-group ${isActive ? 'active' : 'inactive'}">
        <div class="slider-header">
          <span class="slider-label" style="color: ${color}">${label}</span>
          ${isActive ? html`<span class="slider-value" style="color: ${color}">${type === 'brightness' ? Math.round(currentValue/2.55) + '%' : currentValue + 'K'}</span>` : ''}
        </div>
        <div class="slider-track ${type}-track ${isActive ? 'active' : 'inactive'}">
          <div class="slider-progress ${type}-track ${isActive ? 'active' : 'inactive'}"\n 
          style="width: calc(7px + (100% - 14px) * ${currentPercent / 100})"></div>
          <input
            class="slider-input"\n
            type="range"\n
            min=${min}\n
            max=${max}\n
            .value=${currentValue}\n
            data-type=${type}\n
            data-entity=${entity}\n
            @input=${this._handleSliderInput}\n
            @change=${this._handleSliderChange}\n
          />
          <div class="slider-thumb ${isActive ? 'active' : 'inactive'}"\n 
               style="left: calc(7px + (100% - 14px) * ${currentPercent / 100})">
          </div>
        </div>
      </div>
    `;
  }

  _renderPowerButton(entity, isActive) {
    return html`
      <div 
        class="power-button ${isActive ? 'active' : ''}"\n
        style="background-color: ${isActive ? '#FE6F21' : '#FE6F2133'}"\n
        @click=${() => this._togglePower(entity)}
      >
        <ha-icon icon="mdi:power"\n 
        style="color: ${isActive ? '#FFF' : '#FE6F21'}">
        </ha-icon>
      </div>
    `;
  }

  _renderScenes(entity) {
    const stateObj = this.hass.states[entity];
    if (!stateObj) return html``;
    const effectList = stateObj.attributes.effect_list || [];
    return html`
      <div class="scenes-container">
        ${effectList.map(scene => html`
          <div 
            class="scene-button"\n
            @click=${() => this._activateScene(entity, scene)}\n
            style="color: ${this._evaluateTheme() === 'dark' ? '#FFF' : '#333'}"\n
            title=${scene}
          >
            ${scene}
          </div>
        `)}
      </div>
    `;
  }

  render() {
    if (!this.config || !this.hass) return html``;
    const theme = this._evaluateTheme();
    const isDark = theme === 'dark';
    const onCount = this.config.entities.filter(entity => 
      this.hass?.states[entity]?.state === 'on'
    ).length;
    const totalCount = this.config.entities.length;
    const cardBg = isDark ? '#2c2c2c' : '#ffffff';
    const boxShadow = isDark 
      ? '0 2px 8px rgba(0,0,0,0.3)' 
      : '0 2px 8px rgba(0,0,0,0.08)';

    return html`
      <div class="card-container" style="background: ${cardBg}; box-shadow: ${boxShadow}; width: ${this.config.width || '100%'};">
        ${this._renderHeader(onCount, totalCount)}
        <div class="light-list">
          ${this.config.entities.map(entity => this._renderEntity(entity))}
        </div>
      </div>
    `;
  }

  _handleSliderInput(e) {
    const type = e.target.dataset.type;
    const entity = e.target.dataset.entity;
    const value = parseInt(e.target.value);
    const min = parseInt(e.target.min);
    const max = parseInt(e.target.max);
    const percent = ((value - min) / (max - min) * 100).toFixed(1);
    this._sliderValues[entity][type] = value;
    if (!this._pendingSliderUpdates) this._pendingSliderUpdates = {};
    this._pendingSliderUpdates[`${entity}_${type}`] = true;
    const track = e.target.parentElement;
    if (track) {
      track.querySelector('.slider-progress').style.width = `calc(7px + (100% - 14px) * ${percent / 100})`;
      track.querySelector('.slider-thumb').style.left = `calc(7px + (100% - 14px) * ${percent / 100})`;
    }
  }

  _handleSliderChange(e) {
    const type = e.target.dataset.type;
    const entity = e.target.dataset.entity;
    const value = parseInt(e.target.value);
    if (!this._pendingSliderUpdates) this._pendingSliderUpdates = {};
    this._pendingSliderUpdates[`${entity}_${type}`] = true;
    if (type === 'brightness') {
      this._adjustBrightness(entity, value);
    } else if (type === 'color_temp') {
      this._adjustColorTemp(entity, value);
    }
  }

  _getEntityDomain(entity) {
    return entity.split('.')[0];
  }

  _togglePower(entity) {
    const domain = this._getEntityDomain(entity);
    this.hass.callService(domain, 'toggle', { entity_id: entity });
    this._handleClick();
    const button = this.shadowRoot.querySelector(`[data-entity="${entity}"] .power-button`);
    if (button) {
      button.style.transform = 'scale(0.8)';
      setTimeout(() => button.style.transform = 'scale(1.2)', 300);
    }
  }

  _turnOffAll() {
    const entities = this.config.entities;
    const lightEntities = entities.filter(e => this._getEntityDomain(e) === 'light');
    const switchEntities = entities.filter(e => this._getEntityDomain(e) === 'switch');
    if (lightEntities.length > 0) {
      this.hass.callService('light', 'turn_off', { entity_id: lightEntities });
    }
    if (switchEntities.length > 0) {
      this.hass.callService('switch', 'turn_off', { entity_id: switchEntities });
    }
    this._handleClick();
  }

  _turnOnAll() {
    const entities = this.config.entities;
    const lightEntities = entities.filter(e => this._getEntityDomain(e) === 'light');
    const switchEntities = entities.filter(e => this._getEntityDomain(e) === 'switch');
    if (lightEntities.length > 0) {
      this.hass.callService('light', 'turn_on', { entity_id: lightEntities });
    }
    if (switchEntities.length > 0) {
      this.hass.callService('switch', 'turn_on', { entity_id: switchEntities });
    }
    this._handleClick();
  }

  async _adjustBrightness(entity, value) {
    if (this._getEntityDomain(entity) !== 'light') return;
    const params = { brightness: Math.max(5, Math.min(255, value)) };
    await this.hass.callService('light', 'turn_on', {
      entity_id: entity,
      ...params,
      transition: 0.3
    });
    this._syncSliderValue(entity, 'brightness');
    setTimeout(() => {
      if (this._pendingSliderUpdates) delete this._pendingSliderUpdates[`${entity}_brightness`];
    }, 2000);
  }

  async _adjustColorTemp(entity, value) {
    if (this._getEntityDomain(entity) !== 'light') return;
    const attributes = this.hass.states[entity]?.attributes || {};
    const params = {};
    if (attributes.color_temp_kelvin !== undefined) {
      params.color_temp_kelvin = value;
    } else if (attributes.color_temp !== undefined) {
      params.color_temp = Math.round(1000000 / value);
    }
    await this.hass.callService('light', 'turn_on', {
      entity_id: entity,
      ...params,
      transition: 0.3
    });
    this._syncSliderValue(entity, 'color_temp');
    setTimeout(() => {
      if (this._pendingSliderUpdates) delete this._pendingSliderUpdates[`${entity}_color_temp`];
    }, 2000);
  }

  _syncSliderValue(entity, type) {
    if (this._pendingSliderUpdates?.[`${entity}_${type}`]) return;
    const state = this.hass.states[entity];
    if (!state) return;
    const attributes = state.attributes || {};
    if (type === 'brightness' && attributes.brightness !== undefined) {
      this._sliderValues[entity].brightness = attributes.brightness;
    } 
    else if (type === 'color_temp') {
      if (attributes.color_temp_kelvin !== undefined) {
        this._sliderValues[entity].color_temp = attributes.color_temp_kelvin;
      } else if (attributes.color_temp !== undefined) {
        this._sliderValues[entity].color_temp = Math.round(1000000 / attributes.color_temp);
      }
    }
    this.requestUpdate();
  }

  _toggleSceneMode(entity) {
    this._showScenes[entity] = !this._showScenes[entity];
    this.requestUpdate();
  }

  _activateScene(entity, scene) {
    if (this._getEntityDomain(entity) !== 'light') return;
    this._handleClick();
    this.hass.callService('light', 'turn_on', {
      entity_id: entity,
      effect: scene
    });
    this._showScenes[entity] = false;
    this.requestUpdate();
  }

  updated(changedProperties) {
    if (changedProperties.has('hass') && this.config) {
      this.config.entities.forEach(entity => {
        this._syncSliderValue(entity, 'brightness');
        this._syncSliderValue(entity, 'color_temp');
      });
    }
  }
}
customElements.define('xiaoshi-light-card', XiaoshiLghtCard);


