import { LitElement, html, css } from "https://unpkg.com/lit-element@2.4.0/lit-element.js?module";

class XiaoshiPhonelightCardEditor extends LitElement {
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
      const isLightType = entityId.startsWith('light.');
      const matchesSearch = entityId.includes(searchTerm) || friendlyName.includes(searchTerm);
      return isLightType && matchesSearch;
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
                    placeholder="搜索 light 实体..."
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
          <div class="help-text">
            添加需要控制的灯光实体
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
          <label>主题</label>
          <select
            @change=${this._valueChanged}
            .value=${this.config.theme !== undefined ? this.config.theme : 'off'}
            name="theme"
          >
            <option value="off">深色主题</option>
            <option value="on">浅色主题</option>
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
          <div class="help-text">
            auto：仅在灯开启时显示卡片
          </div>
        </div>

        <div class="form-group">
          <div style="display: flex; align-items: center; gap: 8px;">
            <ha-switch
              .checked=${this.config.total !== 'off'}
              @change=${(e) => {
                this.config = { ...this.config, total: e.target.checked ? 'on' : 'off' };
                this._fireEvent();
              }}
              name="total"
            ></ha-switch>
            <span>显示统计信息</span>
          </div>
        </div>

        <div class="form-group">
          <label>每行列数</label>
          <select
            @change=${this._valueChanged}
            .value=${this.config.columns !== undefined ? this.config.columns : '1'}
            name="columns"
          >
            <option value="1">1列</option>
            <option value="2">2列</option>
            <option value="3">3列</option>
            <option value="4">4列</option>
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

        <div class="form-group">
          <label>卡片高度</label>
          <input
            type="text"
            @change=${this._valueChanged}
            .value=${this.config.height !== undefined ? this.config.height : '60px'}
            name="height"
            placeholder="默认 60px"
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
customElements.define('xiaoshi-phone-light-card-editor', XiaoshiPhonelightCardEditor);

export class XiaoshiPhonelightCard extends LitElement {
  static properties = {
    hass: { type: Object },
    _config: { type: Object, state: true },
    _onCount: { type: Number, state: true },
    _sliderValues: { type: Object, state: true },
    _showScenes: { type: Object, state: true }
  };

  static getConfigElement() {
    return document.createElement("xiaoshi-phone-light-card-editor");
  }

  static getStubConfig() {
    return {
      entities: [],
      rgb: false,
      theme: "off",
      show: "always",
      total: "on",
      columns: 1,
      width: "100%",
      height: "60px"
    };
  }

  static styles = css`
    .scene-mode-button {
      position: absolute;
      bottom: 4px;
      left: 0;
      padding: 2px 0px;
      font-size: 0.7rem;
      border-radius: 4px;
      background: rgba(180, 180, 180, 0.2);
      color: #FE6F21;
      cursor: pointer;
      transition: all 0.3s ease;
      width: fit-content;
    }
    .scenes-container {
      flex: 2;
      display: flex;
      flex-wrap: wrap;
      gap: 3px;
      padding: 0px;
      z-index: 1;
      align-items: center;
    }
    .scene-button {
      padding: 0px 4px 0px 4px;
      border-radius: 6px;
      background: rgba(180, 180, 180, 0.2);
      text-align: start;
      font-size: 0.65rem;
      cursor: pointer;
      transition: all 0.3s ease;
      display: flex;
      align-items: start;
      justify-content: start;
      height: 20px;
      max-width: 35px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      gap: 4px;
    }
    .main-container {
      display: flex;
      flex-direction: column;
      gap: 8px;
      padding: 0;
    }
    .entities-grid {
      display: grid;
      grid-template-columns: repeat(var(--column-count, 1), 1fr);
      gap: 8px !important;
    }
    .stats-header {
      min-height: 20px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      position: relative;
      padding: 0 8px 0 8px;
      margin-bottom: 5px;
    }
    .stats-text {
      font-size: 1.2rem;
      font-weight: 700;
      transition: color 0.3s;
      position: absolute;
      left: 50%;
      transform: translateX(-50%);
      width: max-content;
    }
    .all-off-button {
      visibility: visible !important;
      width: 40px;
      height: 20px;
      font-size: 0.9rem;
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: none;
      transition: opacity 0.3s ease;
    }
    .all-off-button:hover {
      opacity: 0.8;
      transform: scale(1.05);
      border-radius: 8px;
      cursor: none;
    }
    .entity-container {
      min-height: 60px;
      border-radius: 12px;
      padding: 0;
      display: flex;
      align-items: center;
      transition: all 0.3s ease;
      gap: 16px;
      position: relative;
      overflow: hidden;
      width: 100%;
    }
    .device-name-area {
      margin-left: 16px; 
      margin-right: auto;
      min-width: 80px;
      flex: 1;
      display: flex;
      flex-direction: column;
      height: 100%;
      position: relative;
      z-index: 1;
      overflow: visible;
    }
    .device-name-container {
      min-width: 80px;
      flex: 1;
      font-size: 1.2rem;
      font-weight: 600;
      white-space: nowrap;
      z-index: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      overflow: visible;
    }
    .device-name {
      font-size: 1.2rem;
      font-weight: 600;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      position: absolute;
      top: 50%;
      transform: translateY(-50%);
      width: 100%;
      overflow: visible;
    }
    .controls-container {
      flex: 2;
      display: flex;
      flex-direction: column;
      gap: 10px;
      z-index: 1;
    }
    .slider-group {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .slider-label {
      width: 30px;
      font-size: 0.8rem;
      background: rgb(0,0,0,0);
      line-height: 1.1;
    }
    .slider-track {
      flex: 1;
      height: 25px;
      border-radius: 7px;
      position: relative;
      cursor: none;
    }    
    .slider-track.brightness-track {
      background: rgba(254, 111, 33, 0.2);
    }    
    .slider-track.color_temp-track {
      background: linear-gradient(to right, #FE6F21, #FFFFFF) !important;
    }    
    .slider-track.inactive {
      background: rgb(180,180,180,0.5) !important;
    }    
    .slider-progress {
      position: absolute;
      left: 0;
      height: 100%;
      background: #fe6f21;
      border-radius: 7px 0 0 7px;
      transition: width 0.2s ease;
      cursor: none;
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
      cursor: none;
      -webkit-appearance: none;
    }
    .slider-thumb {
      position: absolute;
      width: 3px;
      height: 20px;
      background: #999;
      border-radius: 3px;
      border: 1.5px solid #fff;
      box-shadow: 0px 0px 0px 1px #999;
      top: 50%;
      transform: translate(-50%, -50%);
      pointer-events: none;
      z-index: 3;
    }    
    .slider-thumb.inactive {
      opacity: 0;
    }
    .power-button {
      margin-left: auto;
      margin-right: 16px;
      width: 40px;
      height: 40px;
      border-radius: 10px;
      background: #999;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: none;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    }
    .power-button.active {
      background: #fe6f21;
    }
    ha-icon {
      --mdc-icon-size: 24px;
      color: var(--icon-color, #666666);
    }
    .power-button.active ha-icon {
      color: white;
    }
  `;

  constructor() {
    super();
    this._config = null;
    this._hass = null;
    this._onCount = 0;
    this._sliderValues = {};
    this._debounceTimers = {};
    this._showScenes = {};
  }

  setConfig(config) {
    const configCopy = JSON.parse(JSON.stringify(config));
    const normalizedEntities = this._normalizeEntities(configCopy);
    this._config = {
      entities: normalizedEntities,
      rgb: configCopy.rgb,
      theme: configCopy.theme || 'off',
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
      if (typeof this._config.theme === 'function') return this._config.theme();
      if (typeof this._config.theme === 'string' && this._config.theme.includes('theme()')) {
        return (new Function('return theme()'))();
      }
      return this._config.theme || 'off';
    } catch(e) {
      return 'off';
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
  
  _getBackground(state) {
    const theme = this._evaluateTheme();
    if (state === 'on') {
      return theme === 'off' 
        ? 'linear-gradient(90deg, #FE6F21 -30%, #323232 50%)'
        : 'linear-gradient(90deg, #FE6F21 -30%, #FFF 50%)';
    }
    return theme === 'off' ? '#323232' : '#FFF';
  }

  _renderHeader() {
    if (this._config.total === 'off') return html``;
    this._onCount = this._config.entities.filter(entity => 
      this.hass?.states[entity]?.state === 'on'
    ).length;
    return html`
      <div class="stats-header">
        <div class="stats-text" \n
          style="color: #ffffff">
          总共开启&nbsp;${this._onCount}&nbsp;盏灯
        </div>
        <div 
          class="all-off-button"\n
          style="opacity: ${this._onCount > 0 ? 1 : 0};pointer-events: ${this._onCount > 0 ? 'auto' : 'none'};color: #fff;background-color: #FE6F21;"\n
          @click=${this._turnOffAll}
        >全关
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
    const showMode = this._config.show || 'always';
    const showCard = showMode === 'auto' ? state === 'on' : true;
    const showScenes = this._showScenes[entity];
    const hasScenes = attributes.effect_list && attributes.effect_list.length > 0;
    return html`
      <div class="entity-container"\n
        style="width: 100%;height: ${this._config.height};background: ${this._getBackground(state)};box-shadow: ${this._evaluateTheme() === 'off' ? '0 2px 4px rgba(0,0,0,0.1)' : 'none'};display: ${showCard ? 'flex' : 'none'};">
        <div class="device-name-area"\n 
          style="color: ${this._evaluateTheme() === 'off' ? '#FFF' : '#333'}">
          <div class="device-name">
            ${attributes.friendly_name || entity}
          </div>
          ${hasScenes ? html`
            <div class="scene-mode-button"\n 
              style="color: ${this._evaluateTheme() === 'off' ? '#FFF' : '#333'}"\n
              @click=${() => this._toggleSceneMode(entity)}>
              情景模式
            </div>
          ` : ''}
        </div>
        ${showScenes && hasScenes ? 
          this._renderScenes(entity) : 
          (this._config.rgb ? this._renderControls(entity, isActive, attributes) : '')
        }
        ${this._renderPowerButton(entity, isActive)}
      </div>
    `;
  }

  _renderControls(entity, isActive, attributes) {
    const themeColor = this._evaluateTheme() === 'on' ? '#333' : '#FFF';
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
      <div class="controls-container">
        ${controls}
      </div>
    `;
  }

  _renderSlider(entity, label, type, color, value, min, max, percent, isActive) {
    const currentValue = this._sliderValues[entity]?.[type] ?? value;
    const currentPercent = ((currentValue - min) / (max - min) * 100).toFixed(1);
    return html`
      <div class="slider-group ${isActive ? 'active' : 'inactive'}">
        <span class="slider-label"\n 
          style="color: ${color}">
          ${label}${isActive ? ` ${type === 'brightness' ? Math.round(currentValue/2.55) : currentValue}${type === 'brightness' ? '%' : 'K'}` : ''}
        </span>
        <div class="slider-track ${type}-track ${isActive ? 'active' : 'inactive'}">
          <div class="slider-progress ${type}-track"\n 
          style="width: ${currentPercent}%"></div>
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
               style="left: ${currentPercent}%">
          </div>
        </div>
      </div>
    `;
  }

  _renderPowerButton(entity, isActive) {
    return html`
      <div 
        class="power-button ${isActive ? 'active' : ''}"\n
        style="background-color: ${isActive ? '#FE6F21' : 'rgba(150,150,150,0.8)'}"\n
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
            style="color: ${this._evaluateTheme() === 'off' ? '#FFF' : '#333'}"\n
            title=${scene}
          >
            ${scene}
          </div>
        `)}
      </div>
    `;
  }

  render() {
    if (!this._config || !this.hass) return html``;
    return html`
      <div class="main-container">
        ${this._renderHeader()}
        <div class="entities-grid" \n
          style="--column-count: ${this._config.columns}">
          ${this._config.entities.map(entity => this._renderEntity(entity))}
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
    const track = e.target.parentElement;
    if (track) {
      track.querySelector('.slider-progress').style.width = `${percent}%`;
      track.querySelector('.slider-thumb').style.left = `${percent}%`;
    }
    this.requestUpdate();
  }

  _handleSliderChange(e) {
    const type = e.target.dataset.type;
    const entity = e.target.dataset.entity;
    const value = parseInt(e.target.value);
    this._debounceTimers[`${entity}_${type}`] = setTimeout(() => {
      if (type === 'brightness') {
        this._adjustBrightness(entity, value);
      } else if (type === 'color_temp') {
        this._adjustColorTemp(entity, value);
      }
    }, 300);
  }

  _togglePower(entity) {
    this.hass.callService('light', 'toggle', { entity_id: entity });
    this._handleClick();
    const button = this.shadowRoot.querySelector(`[data-entity="${entity}"] .power-button`);
    if (button) {
      button.style.transform = 'scale(0.8)';
      setTimeout(() => button.style.transform = 'scale(1.2)', 300);
    }
  }

  _turnOffAll() {
    this.hass.callService('light', 'turn_off', {
      entity_id: this._config.entities
    });
    const button = this.shadowRoot.querySelector('.all-off-button');
    if (button) {
      button.style.transform = 'scale(0.8)';
      setTimeout(() => button.style.transform = 'scale(1)', 200);
    }
  }

  async _adjustBrightness(entity, value) {
    const attributes = this.hass.states[entity]?.attributes || {};
    const params = { brightness: Math.max(5, Math.min(255, value)) };
    if (this.hass.states[entity]?.state === 'off') {
      await this.hass.callService('light', 'turn_on', {
        entity_id: entity,
        ...params,
        transition: 0.3
      });
    } else {
      await this.hass.callService('light', 'turn_on', {
        entity_id: entity,
        ...params,
        transition: 0.3
      });
    }
    this._syncSliderValue(entity, 'brightness');
  }

  async _adjustColorTemp(entity, value) {
    const attributes = this.hass.states[entity]?.attributes || {};
    const params = {};
    if (attributes.color_temp_kelvin !== undefined) {
      params.color_temp_kelvin = value;
    } else if (attributes.color_temp !== undefined) {
      params.color_temp = Math.round(1000000 / value);
    }
    if (this.hass.states[entity]?.state === 'off') {
      await this.hass.callService('light', 'turn_on', {
        entity_id: entity,
        ...params,
        transition: 0.3
      });
    } else {
      await this.hass.callService('light', 'turn_on', {
        entity_id: entity,
        ...params,
        transition: 0.3
      });
    }
    this._syncSliderValue(entity, 'color_temp');
  }

  _syncSliderValue(entity, type) {
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
    this._handleClick();
    this.hass.callService('light', 'turn_on', {
      entity_id: entity,
      effect: scene
    });
    this._showScenes[entity] = false;
    this.requestUpdate();
  }

  updated(changedProperties) {
    if (changedProperties.has('hass') && this._config) {
      this._config.entities.forEach(entity => {
        this._syncSliderValue(entity, 'brightness');
        this._syncSliderValue(entity, 'color_temp');
      });
    }
  }
}
customElements.define('xiaoshi-phone-light-card', XiaoshiPhonelightCard);
