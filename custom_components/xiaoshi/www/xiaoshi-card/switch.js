const whenDefined = (t) => customElements.whenDefined(t);
await Promise.race([whenDefined("ha-card"), whenDefined("ha-panel-lovelace")]);
const LitElement = window.LitElement || Object.getPrototypeOf(customElements.get("ha-card"));
const html = LitElement.prototype.html;
const css = LitElement.prototype.css;

window.customCards = window.customCards || [];
window.customCards.push({
    type: 'xiaoshi-switch-card',
    name: '消逝卡(移动端)-插座卡',
    description: '移动端插座卡'
});

class XiaoshiSwitchCardEditor extends LitElement {
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
      const isSwitchType = entityId.startsWith('switch.');
      const matchesSearch = entityId.includes(searchTerm) || friendlyName.includes(searchTerm);
      return isSwitchType && matchesSearch;
    }).slice(0, 50);

    this.requestUpdate();
  }

  _selectEntity(entityId, index) {
    const entities = [...(this.config.entities || [])];
    entities[index] = {
      ...entities[index],
      switch: entityId
    };

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

  _onPowerSearch(e, index) {
    const searchTerm = e.target.value.toLowerCase();

    if (!this._entitySearchTerms) this._entitySearchTerms = {};
    if (!this._showEntityLists) this._showEntityLists = {};

    const powerKey = `power_${index}`;
    this._entitySearchTerms[powerKey] = searchTerm;
    this._showEntityLists[powerKey] = true;

    if (!this.hass) return;

    const allEntities = Object.values(this.hass.states);

    this._filteredEntities[powerKey] = allEntities.filter(entity => {
      const entityId = entity.entity_id.toLowerCase();
      const friendlyName = (entity.attributes.friendly_name || '').toLowerCase();
      const isSensorType = entityId.startsWith('sensor.');
      const matchesSearch = entityId.includes(searchTerm) || friendlyName.includes(searchTerm);
      return isSensorType && matchesSearch;
    }).slice(0, 50);

    this.requestUpdate();
  }

  _selectPowerSensor(entityId, index) {
    const entities = [...(this.config.entities || [])];
    entities[index] = {
      ...entities[index],
      power: entityId
    };

    this.config = {
      ...this.config,
      entities
    };

    const powerKey = `power_${index}`;
    if (!this._entitySearchTerms) this._entitySearchTerms = {};
    if (!this._showEntityLists) this._showEntityLists = {};

    this._entitySearchTerms[powerKey] = '';
    this._showEntityLists[powerKey] = false;

    this._fireEvent();
    this.requestUpdate();
  }

  _addEntity() {
    const entities = [...(this.config.entities || [])];
    entities.push({ switch: '', power: '' });
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

    if (!value && value !== 0) {
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
        margin-bottom: 5px;
      }
      .entity-row label {
        color: #000;
        min-width: 50px;
        font-weight: normal;
        font-size: 13px;
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
        border: 1px solid #c8191d;
        border-radius: 4px;
        padding: 8px;
        transition: all 0.2s ease;
      }
      .add-button:hover {
        background-color: rgba(200, 25, 29, 0.1);
        transform: translateY(-1px);
        box-shadow: 0 2px 4px rgba(200, 25, 29, 0.2);
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
          <label>插座实体列表</label>
          ${(this.config.entities || []).map((entityPair, index) => {
            const switchEntity = typeof entityPair === 'string' ? entityPair : (entityPair?.switch || entityPair?.entity || '');
            const powerSensor = typeof entityPair === 'string' ? '' : (entityPair?.power || '');

            const powerKey = `power_${index}`;

            return html`
              <div class="entity-item">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 5px;">
                  <span style="font-weight: bold; font-size: 13px;color: #000;">插座 #${index + 1}</span>
                  <button class="remove-button" @click=${() => this._removeEntity(index)} title="移除此实体">
                    <ha-icon icon="mdi:close"></ha-icon>
                  </button>
                </div>
                <div class="entity-row">
                  <label>开关:</label>
                  <div class="entity-selector">
                    <input
                      type="text"
                      @input=${(e) => this._onEntitySearch(e, index)}
                      @focus=${(e) => this._onEntitySearch(e, index)}
                      .value=${this._entitySearchTerms?.[index] || switchEntity || ''}
                      placeholder="搜索 switch 实体..."
                      class="entity-search-input"
                    />
                    ${this._showEntityLists?.[index] ? html`
                      <div class="entity-dropdown">
                        ${this._filteredEntities?.[index]?.map(entity => html`
                          <div
                            class="entity-option ${switchEntity === entity.entity_id ? 'selected' : ''}"
                            @click=${() => this._selectEntity(entity.entity_id, index)}
                          >
                            <div class="entity-info">
                              <ha-icon icon="${entity.attributes.icon || 'mdi:help-circle'}"></ha-icon>
                              <div class="entity-details">
                                <div class="entity-name">${entity.attributes.friendly_name || entity.entity_id}</div>
                                <div class="entity-id">${entity.entity_id}</div>
                              </div>
                            </div>
                            ${switchEntity === entity.entity_id ?
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
                <div class="entity-row">
                  <label>功率:</label>
                  <div class="entity-selector">
                    <input
                      type="text"
                      @input=${(e) => this._onPowerSearch(e, index)}
                      @focus=${(e) => this._onPowerSearch(e, index)}
                      .value=${this._entitySearchTerms?.[powerKey] || powerSensor || ''}
                      placeholder="搜索功率 sensor (可选)..."
                      class="entity-search-input"
                    />
                    ${this._showEntityLists?.[powerKey] ? html`
                      <div class="entity-dropdown">
                        ${this._filteredEntities?.[powerKey]?.map(entity => html`
                          <div
                            class="entity-option ${powerSensor === entity.entity_id ? 'selected' : ''}"
                            @click=${() => this._selectPowerSensor(entity.entity_id, index)}
                          >
                            <div class="entity-info">
                              <ha-icon icon="${entity.attributes.icon || 'mdi:help-circle'}"></ha-icon>
                              <div class="entity-details">
                                <div class="entity-name">${entity.attributes.friendly_name || entity.entity_id}</div>
                                <div class="entity-id">${entity.entity_id}</div>
                              </div>
                            </div>
                            ${powerSensor === entity.entity_id ?
                              html`<ha-icon icon="mdi:check" class="check-icon"></ha-icon>` : ''}
                          </div>
                        `)}
                        ${!this._filteredEntities?.[powerKey] || this._filteredEntities[powerKey].length === 0 ? html`
                          <div class="no-results">未找到匹配的实体</div>
                        ` : ''}
                      </div>
                    ` : ''}
                  </div>
                </div>
              </div>
            `;
          })}
          <div style="display: flex; align-items: center; margin-top: 8px;">
            <mwc-button
              class="add-button"
              @click=${this._addEntity}
              outlined
            >
              添加插座
            </mwc-button>
          </div>
          <div class="help-text">
            添加插座实体和可选的功率传感器
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
          <div style="display: flex; align-items: center; gap: 8px;">
            <ha-switch
              .checked=${this.config.total !== 'off'}
              @change=${(e) => {
                this.config = { ...this.config, total: e.target.checked ? 'on' : 'off' };
                this._fireEvent();
              }}
            ></ha-switch>
            <span>显示统计信息</span>
          </div>
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
customElements.define('xiaoshi-switch-card-editor', XiaoshiSwitchCardEditor);

class XiaoshiSwitchCard extends LitElement {
  static get TIMING() {
    return {
      UNLOCK: 5000,
      FEEDBACK: 500,
      CONFIRM_RESET: 3000
    };
  }

  static properties = {
    hass: { type: Object },
    config: { type: Object, state: true },
    _onCount: { type: Number, state: true },
    _unlockedCards: { type: Object, state: true },
    _confirmOffAll: { type: Boolean, state: true },
    _confirmOnAll: { type: Boolean, state: true },
    _showHistory: { type: Boolean, state: true },
    _historyData: { type: Object, state: true },
    _historyLoading: { type: Boolean, state: true }
  };

  static getConfigElement() {
    return document.createElement("xiaoshi-switch-card-editor");
  }

  static getStubConfig() {
    return {
      entities: [],
      room_name: "",
      theme: "system",
      total: "on"
    };
  }

  static styles = css`
    .card-container {
      border-radius: 16px;
      overflow: hidden;
      display: flex;
      flex-direction: column;
      padding-bottom: 10px;
      max-width: 500px;
      margin: auto;
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
    .switch-count {
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
      display: flex;
      align-items: center;
      line-height: 1;
    }
    .header-btn:hover {
      opacity: 0.85;
      transform: scale(1.05);
    }
    .switch-list {
      display: flex;
      flex-direction: column;
    }
    .switch-row {
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
    .switch-name-group {
      position: relative;
      flex-shrink: 0;
      z-index: 1;
      width: 35%;
    }
    .switch-name {
      font-size: 14px;
      font-weight: 500;
      width: 35%;
      flex-shrink: 0;
      z-index: 1;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .switch-controls {
      flex: 0 0 40%;
      max-width: 40%;
      display: flex;
      flex-direction: column;
      gap: 6px;
      z-index: 1;
      padding: 6px 0;
    }
    .power-value-display {
      font-size: 0.8rem;
      font-weight: 500;
      display: flex;
      align-items: center;
      gap: 4px;
      padding: 2px 0;
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
      position: relative;
    }
    .power-button.active {
      background: #c8191d;
    }
    .power-button.inactive {
      background: #c8191d33;
      pointer-events: none;
    }
    .power-button.unlocked {
      pointer-events: auto;
    }
    ha-icon {
      --mdc-icon-size: 22px;
      color: var(--icon-color, #666666);
    }
    .power-button.active.unlocked ha-icon,
    .power-button.inactive.unlocked ha-icon {
      color: #c8191d;
    }
    .power-button.active.unlocked ha-icon {
      color: white;
    }
    .lock-button {
      cursor: default;
      flex-shrink: 0;
      width: 30px;
      height: 30px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 6px;
      background: rgba(180,180,180,0.15);
      margin-right: 4px;
    }
    .lock-button ha-icon {
      --mdc-icon-size: 18px;
      transition: all 0.3s ease;
      color: #999;
    }
    .lock-button.unlocked ha-icon {
      color: #4CAF50 !important;
    }
    @keyframes unlock-progress {
      from { width: 100% }
      to { width: 0 }
    }
    .unlock-progress {
      position: absolute;
      bottom: 0;
      left: 0;
      height: 3px;
      background: #4CAF50;
      animation: unlock-progress 5000ms linear;
    }
    .history-icon-btn {
      width: 30px;
      height: 30px;
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: default;
      transition: all 0.3s ease;
      background: rgba(180, 180, 180, 0.2);
      flex-shrink: 0;
    }
    .history-icon-btn:hover {
      opacity: 0.85;
      transform: scale(1.05);
    }
  `;

  constructor() {
    super();
    this.config = null;
    this._hass = null;
    this._onCount = 0;
    this._unlockedCards = {};
    this._confirmOffAll = false;
    this._confirmOnAll = false;
    this._showHistory = false;
    this._historyData = {};
    this._historyLoading = false;
  }

  setConfig(config) {
    const configCopy = JSON.parse(JSON.stringify(config));
    const normalizedEntities = this._normalizeEntities(configCopy);
    this.config = {
      entities: normalizedEntities,
      room_name: configCopy.room_name || '',
      theme: configCopy.theme || 'system',
      width: configCopy.width || '100%',
      show: configCopy.show,
      total: configCopy.total !== undefined ? configCopy.total : 'on'
    };
    normalizedEntities.forEach(entityPair => {
      const switchEntity = this._getSwitchEntity(entityPair);
      if (switchEntity) {
        this._unlockedCards[switchEntity] = false;
      }
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
    return [];
  }

  _getSwitchEntity(entityPair) {
    if (typeof entityPair === 'string') return entityPair;
    return entityPair?.switch || entityPair?.entity || '';
  }

  _getPowerSensor(entityPair) {
    if (typeof entityPair === 'string') return '';
    return entityPair?.power || '';
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

  _renderHeader(onCount) {
    const theme = this._evaluateTheme();
    const isDark = theme === 'dark';
    const textColor = isDark ? '#FFF' : '#333';
    const dotColor = onCount > 0 ? '#c8191d' : textColor;
    const countBg = onCount > 0 ? 'rgba(200, 25, 29, 0.8)' : (isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.08)');

    // Calculate total power
    let totalPower = 0;
    (this.config.entities || []).forEach(entityPair => {
      const switchEntity = this._getSwitchEntity(entityPair);
      const sensorEntity = this._getPowerSensor(entityPair);
      if (this.hass?.states[switchEntity]?.state === 'on' && sensorEntity) {
        const powerState = this.hass?.states[sensorEntity];
        if (powerState && !isNaN(powerState.state)) {
          totalPower += parseFloat(powerState.state);
        }
      }
    });

    return html`
      <div class="card-header">
        <div class="card-header-left">
          <span class="room-name" style="color: ${textColor}">
            <span class="status-dot" style="background: ${dotColor}"></span>
            ${this.config.room_name || '插座'}
          </span>
          ${onCount > 0 ? html`<span style="font-size:0.85rem;font-weight:500;color:${textColor};background:${isDark?'rgba(255,255,255,0.1)':'rgba(0,0,0,0.06)'};padding:2px 8px;border-radius:6px;margin-right:4px;display:flex;align-items:center;gap:3px;"><ha-icon icon="mdi:flash" style="--mdc-icon-size:14px;"></ha-icon>${totalPower.toFixed(1)}W</span>` : ''}
          <span class="switch-count" style="color: ${textColor}; background: ${countBg}">${onCount}</span>
        </div>
        <div class="card-header-buttons">
          <div 
            class="history-icon-btn"
            @click=${this._toggleHistory}
            title="查看插座历史记录"
          >
            <ha-icon icon="mdi:history" style="--mdc-icon-size: 18px; color: ${textColor};"></ha-icon>
          </div>
          <div 
            class="header-btn"
            style="background: ${this._confirmOnAll ? (isDark ? '#ff4444' : '#d32f2f') : '#c8191d'}; color: #FFF;"
            @click=${this._handleOnAll}
          >${this._confirmOnAll ? '确认开启' : '全开'}</div>
          <div 
            class="header-btn"
            style="background: ${this._confirmOffAll ? '#c8191d' : (isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.08)')}; color: ${this._confirmOffAll ? '#FFF' : textColor}; opacity: ${onCount > 0 ? 1 : 0.5};"
            @click=${this._handleOffAll}
          >${this._confirmOffAll ? '确认关闭' : '全关'}</div>
        </div>
      </div>
    `;
  }

  _renderEntity(entityPair, index) {
    const switchEntity = this._getSwitchEntity(entityPair);
    const sensorEntity = this._getPowerSensor(entityPair);
    
    if (!switchEntity || !this.hass?.states[switchEntity]) {
      return html``;
    }
    const stateObj = this.hass.states[switchEntity] || {};
    const state = stateObj.state || 'off';
    const isActive = state === 'on';
    const attributes = stateObj.attributes || {};
    const showMode = this.config.show || 'always';
    const showCard = showMode === 'auto' ? state === 'on' : true;
    if (!showCard) return html``;

    const cardId = `switch-${index}`;
    const isUnlocked = !!this._unlockedCards[cardId];
    const theme = this._evaluateTheme();
    const isDark = theme === 'dark';
    const textColor = isDark ? '#FFF' : '#333';
    const bgColor = isActive
      ? (isDark ? 'rgba(200, 25, 29, 0.15)' : 'rgba(200, 25, 29, 0.1)')
      : 'transparent';

    // Power value
    let powerDisplay = '';
    if (sensorEntity) {
      const powerState = this.hass.states[sensorEntity];
      if (powerState && !isNaN(powerState.state)) {
        const powerVal = parseFloat(powerState.state);
        const unit = powerState.attributes?.unit_of_measurement || 'W';
        powerDisplay = `${powerVal.toFixed(1)}${unit}`;
      }
    }

    return html`
      <div id="${cardId}" class="switch-row" style="background: ${bgColor}; position: relative;">
        <div class="switch-name-group">
          <span class="switch-name" style="color: ${textColor}">${attributes.friendly_name || switchEntity}</span>
        </div>
        <div class="switch-controls">
          ${powerDisplay ? html`
            <span class="power-value-display" style="color: ${isActive ? '#c8191d' : (isDark ? '#aaa' : '#888')}; background: ${isActive ? 'rgba(200,25,29,0.1)' : (isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.04)')};">
              <ha-icon icon="mdi:flash" style="--mdc-icon-size:14px;"></ha-icon>${powerDisplay}
            </span>
          ` : html`<div></div>`}
        </div>
        <div class="lock-button ${isUnlocked ? 'unlocked' : ''}" 
             @click=${() => this._unlockControls(cardId)}
             @touchend=${() => this._unlockControls(cardId)}>
          <ha-icon icon=${isUnlocked ? 'mdi:lock-open' : 'mdi:lock'}></ha-icon>
        </div>
        <div 
          class="power-button ${isActive ? 'active' : 'inactive'} ${isUnlocked ? 'unlocked' : ''}"
          @click=${() => this._togglePower(switchEntity, cardId)}
        >
          <ha-icon icon="mdi:power"></ha-icon>
        </div>
        ${isUnlocked ? html`
          <div class="unlock-progress"></div>
        ` : ''}
      </div>
    `;
  }

  render() {
    if (!this.config || !this.hass) return html``;
    const theme = this._evaluateTheme();
    const isDark = theme === 'dark';
    const onCount = this.config.entities.filter(entityPair => {
      const switchEntity = this._getSwitchEntity(entityPair);
      return this.hass?.states[switchEntity]?.state === 'on';
    }).length;
    const cardBg = isDark ? '#2c2c2c' : '#ffffff';
    const boxShadow = isDark 
      ? '0 2px 8px rgba(0,0,0,0.3)' 
      : '0 2px 8px rgba(0,0,0,0.08)';

    return html`
      <div class="card-container" style="background: ${cardBg}; box-shadow: ${boxShadow}; width: ${this.config.width || '100%'};">
        ${this._renderHeader(onCount)}
      </div>
    `;
  }

  // Rebuild switch list dynamically
  updated(changedProperties) {
    if (changedProperties.has('config') || changedProperties.has('hass')) {
      const container = this.shadowRoot?.querySelector('.card-container');
      if (!container) return;

      const theme = this._evaluateTheme();
      const isDark = theme === 'dark';
      
      // Remove old switch list
      const oldList = container.querySelector('.switch-list');
      if (oldList) oldList.remove();
      
      // Rebuild switch list
      const switchList = document.createElement('div');
      switchList.className = 'switch-list';
      (this.config.entities || []).forEach((entityPair, index) => {
        const switchEntity = this._getSwitchEntity(entityPair);
        const sensorEntity = this._getPowerSensor(entityPair);
        if (!switchEntity || !this.hass?.states[switchEntity]) return;
        
        const stateObj = this.hass.states[switchEntity] || {};
        const state = stateObj.state || 'off';
        const isActive = state === 'on';
        const attributes = stateObj.attributes || {};
        const showMode = this.config.show || 'always';
        if (showMode === 'auto' && state !== 'on') return;
        
        const cardId = `switch-${index}`;
        const isUnlocked = !!this._unlockedCards[cardId];
        
        let powerDisplay = '';
        if (sensorEntity) {
          const powerState = this.hass.states[sensorEntity];
          if (powerState && !isNaN(powerState.state)) {
            const powerVal = parseFloat(powerState.state);
            const unit = powerState.attributes?.unit_of_measurement || 'W';
            powerDisplay = `${powerVal.toFixed(1)}${unit}`;
          }
        }
        
        const row = document.createElement('div');
        row.className = 'switch-row';
        row.id = cardId;
        row.style.cssText = `background:${isActive ? (isDark?'rgba(200,25,29,0.15)':'rgba(200,25,29,0.1)') : 'transparent'};position:relative;`;
        
        const nameGroup = document.createElement('div');
        nameGroup.className = 'switch-name-group';
        const nameSpan = document.createElement('span');
        nameSpan.className = 'switch-name';
        nameSpan.style.color = isDark ? '#FFF' : '#333';
        nameSpan.textContent = attributes.friendly_name || switchEntity;
        nameGroup.appendChild(nameSpan);
        
        const controls = document.createElement('div');
        controls.className = 'switch-controls';
        if (powerDisplay) {
          controls.innerHTML = `<span class="power-value-display" style="color:${isActive?'#c8191d':(isDark?'#aaa':'#888')};font-size:0.8rem;font-weight:500;display:flex;align-items:center;justify-content:flex-end;gap:3px;padding:2px 0;"><ha-icon icon="mdi:flash" style="--mdc-icon-size:14px;"></ha-icon>${powerDisplay}</span>`;
        }
        
        const lockBtn = document.createElement('div');
        lockBtn.className = `lock-button ${isUnlocked ? 'unlocked' : ''}`;
        lockBtn.style.cssText = `cursor:default;flex-shrink:0;width:30px;height:30px;display:flex;align-items:center;justify-content:center;border-radius:6px;background:rgba(180,180,180,0.15);margin-right:4px;`;
        lockBtn.innerHTML = `<ha-icon icon="${isUnlocked ? 'mdi:lock-open' : 'mdi:lock'}" style="--mdc-icon-size:18px;transition:all 0.3s ease;color:${isUnlocked ? '#4CAF50' : '#999'};"></ha-icon>`;
        const cardIdCapture = cardId;
        lockBtn.addEventListener('click', () => this._unlockControls(cardIdCapture));
        lockBtn.addEventListener('touchend', (e) => { e.preventDefault(); this._unlockControls(cardIdCapture); });
        
        const powerBtn = document.createElement('div');
        powerBtn.className = `power-button ${isActive ? 'active' : 'inactive'} ${isUnlocked ? 'unlocked' : ''}`;
        powerBtn.style.cssText = `width:36px;height:36px;border-radius:10px;display:flex;align-items:center;justify-content:center;cursor:${isUnlocked ? 'pointer' : 'default'};transition:all 0.3s cubic-bezier(0.4,0,0.2,1);flex-shrink:0;margin-left:auto;position:relative;background:${isActive ? '#c8191d' : 'rgba(200,25,29,0.2)'};${isUnlocked ? '' : 'pointer-events:none;'}`;
        powerBtn.innerHTML = `<ha-icon icon="mdi:power" style="color:${isActive ? '#FFF' : '#c8191d'};--mdc-icon-size:22px;"></ha-icon>`;
        const switchEntityCapture = switchEntity;
        powerBtn.addEventListener('click', () => this._togglePower(switchEntityCapture, cardIdCapture));
        
        row.appendChild(nameGroup);
        row.appendChild(controls);
        row.appendChild(lockBtn);
        row.appendChild(powerBtn);
        
        if (isUnlocked) {
          const progress = document.createElement('div');
          progress.className = 'unlock-progress';
          progress.style.cssText = 'position:absolute;bottom:0;left:0;height:3px;background:#4CAF50;animation:unlock-progress 5000ms linear;';
          row.appendChild(progress);
        }
        
        switchList.appendChild(row);
      });
      
      container.appendChild(switchList);
    }
  }

  _unlockControls(cardId) {
    const { UNLOCK } = this.constructor.TIMING;
    this._unlockedCards[cardId] = true;
    this.requestUpdate();
    setTimeout(() => {
      delete this._unlockedCards[cardId];
      this.requestUpdate();
    }, UNLOCK);
  }

  async _togglePower(entity, cardId) {
    await this.hass.callService('switch', 'toggle', { entity_id: entity });
    this._handleClick();
    // Auto re-lock after toggle
    delete this._unlockedCards[cardId];
    this.requestUpdate();
  }

  _handleOffAll() {
    if (this._confirmOffAll) {
      // Already confirmed, execute
      const entities = this.config.entities
        .map(ep => this._getSwitchEntity(ep))
        .filter(e => e);
      if (entities.length > 0) {
        this.hass.callService('switch', 'turn_off', { entity_id: entities });
      }
      this._handleClick();
      this._confirmOffAll = false;
    } else {
      // First click: enter confirm state
      this._confirmOffAll = true;
      const { CONFIRM_RESET } = this.constructor.TIMING;
      setTimeout(() => {
        this._confirmOffAll = false;
        this.requestUpdate();
      }, CONFIRM_RESET);
    }
  }

  _handleOnAll() {
    if (this._confirmOnAll) {
      const entities = this.config.entities
        .map(ep => this._getSwitchEntity(ep))
        .filter(e => e);
      if (entities.length > 0) {
        this.hass.callService('switch', 'turn_on', { entity_id: entities });
      }
      this._handleClick();
      this._confirmOnAll = false;
    } else {
      this._confirmOnAll = true;
      const { CONFIRM_RESET } = this.constructor.TIMING;
      setTimeout(() => {
        this._confirmOnAll = false;
        this.requestUpdate();
      }, CONFIRM_RESET);
    }
  }

  _toggleHistory() {
    this._handleClick();
    if (this._showHistory) {
      this._closeHistoryOverlay();
      return;
    }
    this._showHistory = true;
    this._showHistoryOverlay();
    this._fetchHistory();
  }

  async _fetchHistory() {
    try {
      const filterEntity = this._historyFilterEntity || '';
      const entityIds = filterEntity || this.config.entities.map(ep => this._getSwitchEntity(ep)).filter(e => e).join(',');
      const periodHours = this._historyFilterPeriod || 24;
      const endTime = new Date();
      const startTime = new Date(endTime.getTime() - periodHours * 60 * 60 * 1000);
      const startStr = startTime.toISOString();
      const endStr = endTime.toISOString();
      
      const data = await this.hass.callApi(
        'GET',
        `history/period/${startStr}?end_time=${endStr}&filter_entity_id=${entityIds}&minimal_response&no_attributes`
      );
      
      const result = {};
      const allEntities = Array.isArray(data) ? data : [];
      for (const entityHistory of allEntities) {
        if (!entityHistory || entityHistory.length === 0) continue;
        const entityId = entityHistory[0].entity_id;
        if (!entityId) continue;
        const stateObj = this.hass.states[entityId];
        const friendlyName = stateObj?.attributes?.friendly_name || entityId;
        // Filter, sort, and deduplicate consecutive same-state entries
        const rawEntries = entityHistory
          .filter(entry => entry && entry.last_changed)
          .sort((a, b) => new Date(b.last_changed) - new Date(a.last_changed));
        const entries = [];
        for (const entry of rawEntries) {
          const last = entries[entries.length - 1];
          const curNorm = this._normalizeState(entry.state);
          const lastNorm = last ? this._normalizeState(last.state) : null;
          if (last && lastNorm === curNorm) {
            // 相同连续状态：用更早的时间替换，保留状态切换的起点
            entries[entries.length - 1] = entry;
          } else {
            entries.push(entry);
          }
        }
        if (entries.length > 0) {
          result[entityId] = {
            name: friendlyName,
            entries: entries
          };
        }
      }
      this._historyData = result;
    } catch (e) {
      console.error('获取历史记录失败:', e);
      this._historyData = {};
    } finally {
      this._historyLoading = false;
      this._updateHistoryContent();
    }
  }

  _showHistoryOverlay() {
    if (this._historyOverlayEl) return;
    const theme = this._evaluateTheme();
    const isDark = theme === 'dark';
    const roomName = this.config.room_name || '插座';
    const textColor = isDark ? '#fff' : '#333';
    const bgColor = isDark ? '#2c2c2c' : '#fff';
    const borderColor = isDark ? '#444' : '#eee';
    const btnBg = isDark ? '#444' : '#f0f0f0';
    const btnIconColor = isDark ? '#ccc' : '#666';
    const chipBg = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)';
    const chipActiveBg = '#c8191d';
    const chipActiveColor = '#fff';

    this._historyFilterEntity = '';
    this._historyFilterPeriod = 24;

    const overlay = document.createElement('div');
    overlay.className = 'xiaoshi-history-overlay';
    overlay.style.cssText = 'position:fixed;top:0;left:0;width:100vw;height:100vh;background:rgba(0,0,0,0.5);z-index:99999;display:flex;align-items:flex-start;justify-content:center;padding-top:20px;';
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) this._closeHistoryOverlay();
    });

    const dialog = document.createElement('div');
    dialog.style.cssText = `background:${bgColor};border-radius:16px;width:95vw;max-width:500px;max-height:85vh;display:flex;flex-direction:column;box-shadow:0 8px 40px rgba(0,0,0,0.25);`;

    // Header
    const header = document.createElement('div');
    header.style.cssText = `display:flex;justify-content:space-between;align-items:center;padding:16px 20px;border-bottom:1px solid ${borderColor};`;
    const title = document.createElement('span');
    title.style.cssText = `font-size:1.1rem;font-weight:700;color:${textColor};`;
    title.textContent = `${roomName} - 历史记录`;
    const closeBtn = document.createElement('button');
    closeBtn.style.cssText = `width:36px;height:36px;border-radius:50%;border:none;background:${btnBg};cursor:pointer;display:flex;align-items:center;justify-content:center;`;
    closeBtn.innerHTML = `<ha-icon icon="mdi:close" style="--mdc-icon-size:20px;color:${btnIconColor};"></ha-icon>`;
    closeBtn.addEventListener('click', () => this._closeHistoryOverlay());
    header.appendChild(title);
    header.appendChild(closeBtn);

    // Toolbar row
    const toolbar = document.createElement('div');
    toolbar.className = 'xiaoshi-history-toolbar';
    toolbar.style.cssText = `display:flex;align-items:center;gap:8px;padding:10px 20px;margin:0 16px;border-bottom:1px solid ${borderColor};flex-wrap:wrap;`;

    // Entity filter - only if multiple switches
    const hasMultiple = this.config.entities.length > 1;
    if (hasMultiple) {
      // entityRow: label + chips container, no-wrap at this level so chips indent under themselves
      const entityRow = document.createElement('div');
      entityRow.style.cssText = 'display:flex;align-items:flex-start;gap:8px;flex-basis:100%;';

      const entityLabel = document.createElement('span');
      entityLabel.style.cssText = `font-size:0.75rem;color:${isDark?'#aaa':'#888'};flex-shrink:0;padding-top:4px;`;
      entityLabel.textContent = '插座:';
      entityRow.appendChild(entityLabel);

      const entityChips = document.createElement('div');
      entityChips.style.cssText = 'display:flex;gap:4px;flex-wrap:wrap;flex:1;';
      entityChips.className = 'xiaoshi-entity-chips';

      const allChip = this._buildFilterChip('全部', '', chipBg, chipActiveBg, chipActiveColor, isDark);
      allChip.addEventListener('click', () => {
        this._historyFilterEntity = '';
        this._refreshHistoryChips(entityChips, this._historyFilterEntity, this._historyFilterPeriod, chipBg, chipActiveBg, chipActiveColor, isDark);
        this._refetchWithFilters();
      });
      entityChips.appendChild(allChip);

      for (const entityPair of this.config.entities) {
        const switchEntity = this._getSwitchEntity(entityPair);
        if (!switchEntity) continue;
        const stateObj = this.hass.states[switchEntity];
        const name = stateObj?.attributes?.friendly_name || switchEntity;
        const chip = this._buildFilterChip(name, switchEntity, chipBg, chipActiveBg, chipActiveColor, isDark);
        chip.addEventListener('click', () => {
          this._historyFilterEntity = switchEntity;
          this._refreshHistoryChips(entityChips, this._historyFilterEntity, this._historyFilterPeriod, chipBg, chipActiveBg, chipActiveColor, isDark);
          this._refetchWithFilters();
        });
        entityChips.appendChild(chip);
      }

      entityRow.appendChild(entityChips);
      toolbar.appendChild(entityRow);
    }

    // Time period filter - on its own row
    const timeRow = document.createElement('div');
    timeRow.style.cssText = 'display:flex;align-items:center;gap:8px;flex-basis:100%;';
    const timeLabel = document.createElement('span');
    timeLabel.style.cssText = `font-size:0.75rem;color:${isDark?'#aaa':'#888'};flex-shrink:0;`;
    timeLabel.textContent = '时段:';
    timeRow.appendChild(timeLabel);

    const timeChips = document.createElement('div');
    timeChips.style.cssText = 'display:flex;gap:4px;flex-wrap:wrap;';
    timeChips.className = 'xiaoshi-time-chips';
    const periods = [
      { label: '1小时', value: 1 },
      { label: '6小时', value: 6 },
      { label: '24小时', value: 24 },
      { label: '3天', value: 72 },
      { label: '7天', value: 168 }
    ];
    for (const p of periods) {
      const chip = this._buildFilterChip(p.label, p.value, chipBg, chipActiveBg, chipActiveColor, isDark);
      chip.addEventListener('click', () => {
        this._historyFilterPeriod = p.value;
        this._refreshHistoryChips(timeChips, this._historyFilterEntity, this._historyFilterPeriod, chipBg, chipActiveBg, chipActiveColor, isDark, 'time');
        this._refetchWithFilters();
      });
      timeChips.appendChild(chip);
    }
    timeRow.appendChild(timeChips);
    toolbar.appendChild(timeRow);

    // Body
    const body = document.createElement('div');
    body.className = 'xiaoshi-history-body';
    body.style.cssText = 'flex:1;overflow-y:auto;padding:6px 20px;';
    body.innerHTML = `<div style="display:flex;align-items:center;justify-content:center;padding:40px;color:${isDark?'#aaa':'#999'};"><ha-icon icon="mdi:loading" style="--mdc-icon-size:24px;"></ha-icon>&nbsp;加载中...</div>`;

    dialog.appendChild(header);
    dialog.appendChild(toolbar);
    dialog.appendChild(body);
    overlay.appendChild(dialog);
    document.body.appendChild(overlay);

    this._historyOverlayEl = overlay;
    this._historyBodyEl = body;
  }

  _updateHistoryContent() {
    if (!this._historyBodyEl) return;
    const theme = this._evaluateTheme();
    const isDark = theme === 'dark';
    
    if (this._historyLoading) {
      this._historyBodyEl.innerHTML = `<div style="display:flex;align-items:center;justify-content:center;padding:40px;color:${isDark?'#aaa':'#999'};"><ha-icon icon="mdi:loading" style="--mdc-icon-size:24px;"></ha-icon>&nbsp;加载中...</div>`;
      return;
    }

    const entries = Object.entries(this._historyData);
    if (entries.length === 0) {
      this._historyBodyEl.innerHTML = `<div style="text-align:center;padding:40px;color:${isDark?'#aaa':'#999'};font-size:0.9rem;">暂无历史记录</div>`;
      return;
    }

    let htmlStr = '';
    for (const [entityId, data] of entries) {
      const stateObj = this.hass.states[entityId];
      const icon = stateObj?.attributes?.icon || 'mdi:power-socket-uk';

      // Calculate on/off totals and entries with duration
      let onTimeMs = 0;
      let offTimeMs = 0;
      const entriesWithDuration = [];
      const dedupedEntries = [];
      for (const entry of data.entries) {
        const last = dedupedEntries[dedupedEntries.length - 1];
        const curNorm = this._normalizeState(entry.state);
        const lastNorm = last ? this._normalizeState(last.state) : null;
        if (last && lastNorm === curNorm) {
          // 相同连续状态：用更早的时间替换，保留状态切换的起点
          dedupedEntries[dedupedEntries.length - 1] = entry;
        } else {
          dedupedEntries.push(entry);
        }
      }
      for (let i = 0; i < dedupedEntries.length; i++) {
        const entry = dedupedEntries[i];
        const time = new Date(entry.last_changed);
        const prevEntry = dedupedEntries[i - 1];
        const endTime = prevEntry ? new Date(prevEntry.last_changed) : new Date();
        const durationMs = Math.max(0, endTime - time);
        if (entry.state === 'on') {
          onTimeMs += durationMs;
        } else {
          offTimeMs += durationMs;
        }
        entriesWithDuration.push({ entry, time, durationMs });
      }

      // Remove short offline blips (< 1min)
      const preFiltered = [];
      for (const item of entriesWithDuration) {
        const norm = this._normalizeState(item.entry.state);
        if (norm === 'offline' && item.durationMs < 60000) continue;
        preFiltered.push(item);
      }
      // Merge consecutive same normalized state after filtering
      const filtered = [];
      onTimeMs = 0;
      offTimeMs = 0;
      for (const item of preFiltered) {
        const last = filtered[filtered.length - 1];
        const curNorm = this._normalizeState(item.entry.state);
        const lastNorm = last ? this._normalizeState(last.entry.state) : null;
        if (last && lastNorm === curNorm) {
          last.durationMs += item.durationMs;
          last.time = item.time;
        } else {
          filtered.push({ ...item });
        }
      }
      for (const item of filtered) {
        if (item.entry.state === 'on') {
          onTimeMs += item.durationMs;
        } else {
          offTimeMs += item.durationMs;
        }
      }

      const totalMs = onTimeMs + offTimeMs;
      const onPercent = totalMs > 0 ? Math.round(onTimeMs / totalMs * 100) : 0;
      const offPercent = totalMs > 0 ? Math.round(offTimeMs / totalMs * 100) : 0;

      htmlStr += `<div style="margin:8px 0px;  border-bottom: 1px solid ${isDark?'#aaa':'#888'};">`;
      // Two rows: name + on% + off%, then full-width timeline bar
      const periodHours = this._historyFilterPeriod || 24;
      const now = new Date();
      const rangeStart = new Date(now.getTime() - periodHours * 60 * 60 * 1000);
      const timelineBlocks = this._buildTimeline(data.entries, rangeStart, now);
      htmlStr += `<div style="display:flex;align-items:center;gap:8px;margin-bottom:4px;">`;
      htmlStr += `<span style="display:flex;align-items:center;gap:4px;font-weight:700;font-size:0.85rem;color:${isDark?'#ddd':'#444'};"><ha-icon icon="${icon}" style="--mdc-icon-size:16px;color:#c8191d;flex-shrink:0;"></ha-icon>${data.name}</span>`;
      htmlStr += `<span style="font-size:0.7rem;color:${isDark?'#c8191d':'#b71c1c'};white-space:nowrap;">${onPercent}%</span>`;
      htmlStr += `<span style="font-size:0.7rem;color:${isDark?'#aaa':'#888'};white-space:nowrap;">${offPercent}%</span>`;
      htmlStr += `</div>`;
      htmlStr += `<div style="display:flex;height:8px;border-radius:3px;overflow:hidden;margin-bottom:8px;">${timelineBlocks}</div>`;
      for (const { entry, time, durationMs } of filtered) {
        const timeStr = time.toLocaleString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });
        const rawState = (entry.state || '').trim();
        const isOn = rawState === 'on';
        const isOffline = rawState === 'unavailable' || rawState === 'unknown';
        const stateLabel = isOn ? '已开启' : (isOffline ? '已离线' : '已关闭');
        const stateColor = isOn ? '#c8191d' : (isOffline ? '#f44336' : '#999');
        const durationStr = this._formatDuration(durationMs);
        const entryBg = isOn ? (isDark ? 'rgba(200,25,29,0.12)' : 'rgba(200,25,29,0.08)') : (isOffline ? (isDark ? 'rgba(244,67,54,0.12)' : 'rgba(244,67,54,0.06)') : (isDark ? '#383838' : '#f5f5f5'));
        htmlStr += `<div style="border-radius:10px;padding: 0px 12px;margin-bottom:8px;background:${entryBg};"><div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;"><span style="font-size:0.8rem;padding:2px 4px;border-radius:10px;font-weight:500;color:${stateColor};">${stateLabel} · ${durationStr}</span><span style="font-size:0.75rem;color:${isDark?'#aaa':'#999'};">${timeStr}</span></div></div>`;
      }
      htmlStr += `</div>`;
    }
    this._historyBodyEl.innerHTML = htmlStr;
  }

  _closeHistoryOverlay() {
    if (this._historyOverlayEl) {
      this._historyOverlayEl.remove();
      this._historyOverlayEl = null;
      this._historyBodyEl = null;
    }
    this._showHistory = false;
    this._historyData = {};
    this._historyLoading = false;
    this._historyFilterEntity = '';
    this._historyFilterPeriod = 24;
  }

  _normalizeState(state) {
    const s = (state || '').trim();
    if (s === 'unavailable' || s === 'unknown') return 'offline';
    return s;
  }

  _buildTimeline(entries, rangeStart, rangeEnd) {
    const rangeMs = rangeEnd - rangeStart;
    if (rangeMs <= 0 || entries.length === 0) return '';

    const sorted = [...entries].sort((a, b) => new Date(a.last_changed) - new Date(b.last_changed));
    // 先过滤：离线且持续少于1分钟的段跳过
    const filtered = [];
    for (let i = 0; i < sorted.length; i++) {
      const entry = sorted[i];
      const segStart = new Date(entry.last_changed);
      const segEnd = i + 1 < sorted.length ? new Date(sorted[i + 1].last_changed) : rangeEnd;
      const normState = this._normalizeState(entry.state);
      if (normState === 'offline' && segEnd - segStart < 60000) continue;
      filtered.push(entry);
    }

    const segments = [];
    for (let i = 0; i < filtered.length; i++) {
      const entry = filtered[i];
      const segStart = new Date(entry.last_changed);
      const segEnd = i + 1 < filtered.length ? new Date(filtered[i + 1].last_changed) : rangeEnd;

      const visibleStart = segStart < rangeStart ? rangeStart : segStart;
      const visibleEnd = segEnd > rangeEnd ? rangeEnd : segEnd;
      const durationMs = visibleEnd - visibleStart;

      if (durationMs > 0) {
        const normState = this._normalizeState(entry.state);
        const percent = (durationMs / rangeMs) * 100;

        const lastSeg = segments[segments.length - 1];
        if (lastSeg && lastSeg.state === normState) {
          lastSeg.percent += percent;
        } else {
          segments.push({ state: normState, percent });
        }
      }
    }

    let blocks = '';
    for (const seg of segments) {
      const color = seg.state === 'on' ? '#c8191d' : (seg.state === 'offline' ? '#f44336' : 'rgba(180,180,180,0.35)');
      blocks += `<div style="width:${seg.percent}%;min-width:1px;height:100%;background:${color};flex-shrink:0;"></div>`;
    }
    return blocks;
  }

  _formatDuration(ms) {
    const periodHours = this._historyFilterPeriod || 24;
    const periodMs = periodHours * 60 * 60 * 1000;
    if (ms < 60000) return '少于1分钟';
    if (ms >= periodMs) {
      if (periodHours < 24) return `大于${periodHours}小时`;
      if (periodHours < 72) return `大于${periodHours}小时`;
      const days = Math.floor(periodHours / 24);
      return `大于${days}天`;
    }
    const minutes = Math.floor(ms / 60000);
    if (minutes < 60) return `${minutes}分钟`;
    const hours = Math.floor(minutes / 60);
    const remainMin = minutes % 60;
    if (hours < 24) return remainMin > 0 ? `${hours}小时${remainMin}分钟` : `${hours}小时`;
    const days = Math.floor(hours / 24);
    const remainHr = hours % 24;
    return remainHr > 0 ? `${days}天${remainHr}小时` : `${days}天`;
  }

  _buildFilterChip(label, value, chipBg, activeBg, activeColor, isDark) {
    const chip = document.createElement('span');
    chip.setAttribute('data-chip', '1');
    const isActive = (typeof value === 'number' && value === this._historyFilterPeriod) ||
                     (typeof value === 'string' && value === this._historyFilterEntity && value !== '');
    if (isActive) {
      chip.style.cssText = `padding:3px 10px;border-radius:12px;font-size:0.72rem;font-weight:500;cursor:pointer;white-space:nowrap;background:${activeBg};color:${activeColor};`;
    } else {
      chip.style.cssText = `padding:3px 10px;border-radius:12px;font-size:0.72rem;font-weight:500;cursor:pointer;white-space:nowrap;background:${chipBg};color:${isDark?'#ccc':'#555'};`;
    }
    chip.textContent = label;
    return chip;
  }

  _refreshHistoryChips(container, activeEntity, activePeriod, chipBg, activeBg, activeColor, isDark, mode) {
    const chips = container.querySelectorAll('[data-chip]');
    chips.forEach(chip => {
      const label = chip.textContent;
      if (mode === 'time') {
        const isActive = (label === '24小时' && activePeriod === 24) ||
                         (label === '1小时' && activePeriod === 1) ||
                         (label === '6小时' && activePeriod === 6) ||
                         (label === '3天' && activePeriod === 72) ||
                         (label === '7天' && activePeriod === 168);
        if (isActive) {
          chip.style.background = activeBg;
          chip.style.color = activeColor;
        } else {
          chip.style.background = chipBg;
          chip.style.color = isDark ? '#ccc' : '#555';
        }
      } else {
        const isActive = (label === '全部' && activeEntity === '') || (label !== '全部' && activeEntity !== '');
        if (isActive && chip.textContent === (activeEntity ? (this.hass?.states[activeEntity]?.attributes?.friendly_name || activeEntity) : '全部')) {
          chip.style.background = activeBg;
          chip.style.color = activeColor;
        } else {
          chip.style.background = chipBg;
          chip.style.color = isDark ? '#ccc' : '#555';
        }
      }
    });
  }

  _refetchWithFilters() {
    this._historyLoading = true;
    this._historyData = {};
    if (this._historyBodyEl) {
      this._updateHistoryContent();
    }
    this._fetchHistory();
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this._unlockedCards = {};
    if (this._historyOverlayEl) {
      this._historyOverlayEl.remove();
      this._historyOverlayEl = null;
    }
  }
}
customElements.define('xiaoshi-switch-card', XiaoshiSwitchCard);
