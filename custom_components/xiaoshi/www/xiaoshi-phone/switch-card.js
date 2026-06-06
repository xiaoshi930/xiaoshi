import { LitElement, html, css } from "https://unpkg.com/lit-element@2.4.0/lit-element.js?module";

window.customCards = window.customCards || [];
window.customCards.push({
    type: 'xiaoshi-phone-switch-card',
    name: '消逝卡(移动端)-插座卡',
    description: '移动端插座卡'
});  

class XiaoshiPhoneSwitchCardEditor extends LitElement {
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
      .entity-item {
        background: #f5f5f5;
        border-radius: 8px;
        padding: 10px;
        margin-bottom: 8px;
      }
      .entity-row {
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
          <label>开关实体列表</label>
          ${(this.config.entities || []).map((entityPair, index) => {
            const switchEntity = typeof entityPair === 'string' ? entityPair : (entityPair?.switch || entityPair?.entity || '');
            const powerSensor = typeof entityPair === 'string' ? '' : (entityPair?.power || '');

            const powerKey = `power_${index}`;

            return html`
              <div class="entity-item">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 5px;">
                  <span style="font-weight: bold; font-size: 13px;color: #000;">实体 #${index + 1}</span>
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
              添加实体
            </mwc-button>
          </div>
          <div class="help-text">
            添加开关实体和可选的功率传感器
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
customElements.define('xiaoshi-phone-switch-card-editor', XiaoshiPhoneSwitchCardEditor);

class XiaoshiPhoneSwitchCard extends LitElement {
  static get TIMING() {
    return {
      UNLOCK: 5000,
      FEEDBACK: 500
    };
  }

  static getConfigElement() {
    return document.createElement("xiaoshi-phone-switch-card-editor");
  }

  static getStubConfig() {
    return {
      entities: [],
      theme: "system",
      total: "on",
      columns: 1,
      width: "100%",
      height: "60px"
    };
  }

  static get properties() {
    return {
      hass: { type: Object },
      _config: { type: Object },
      _unlockedCards: { type: Object }
    };
  }

  constructor() {
    super();
    this._config = null;
    this._unlockedCards = {};
  }

  static get styles() {
    return css`
      .xiaoshi-container {
        display: flex;
        flex-direction: row;
        align-items: center;
        min-height: 60px;
        border-radius: 12px;
        padding: 0;
        position: relative;
        overflow: hidden;
        transition: all 0.3s ease;
        justify-content: space-between;
        margin-bottom: 8px;
        background: var(--card-background-color, #f0f0f0);
      }
      .entities-grid {
        display: grid;
        grid-template-columns: repeat(var(--column-count, 1), 1fr);
        gap: 8px;
        width: 100%;
      }
      .device-name {
        margin-left: 16px;
        margin-right: auto;
        font-size: 1.2rem;
        font-weight: 600;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        display: inline-flex;
        align-items: center;
        padding-left: 0;
      }
      .stats-container {
        color: var(--primary-text-color);
        font-weight: 700;
        font-size: 1rem;
        text-align: center;
        padding: 12px 0;
        margin-bottom: 8px;
      }
      .name-container {
        flex: 1;
        display: flex;
        align-items: center;
        gap: 8px;
        min-width: 0;
        overflow: hidden;
      }
      .power-value {
        font-size: 0.8rem;
        opacity: 1;
        white-space: nowrap;
        display: inline-flex;
        align-items: center;
        margin-left: 8px;
      }
      .button-container {
        flex-shrink: 0;
        display: flex;
        align-items: center;
        gap: 12px;
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
        opacity: 0.5;
        pointer-events: none;
        flex-shrink: 0;
      }
      .power-button.active {
        background: #c8191d;
      }
      .power-button.unlocked {
        opacity: 1;
        pointer-events: auto;
      }
      .lock-button {
        cursor: none;
        margin-right: 8px;
      }
      ha-icon {
        --mdc-icon-size: 24px;
        color: var(--icon-color, #c8191d);
      }
      .power-button.active ha-icon {
        color: white;
      }
      .lock-button ha-icon {
        --mdc-icon-size: 20px;
        transition: all 0.3s ease;
        color: #c8191d;
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
        animation: unlock-progress ${this.TIMING.UNLOCK}ms linear;
      }
    `;
  }

  setConfig(config) {
    this._config = {
      width: config.width || '100%',
      height: config.height || '60px',
      entities: config.entities || [],
      theme: config.theme || 'system',
      total: config.total !== undefined ? config.total : 'on',
      columns: config.columns || 1
    };
    this.requestUpdate();
  }

  _evaluateTheme() {
      try {
          const mode = this.config ? this.config.theme : 'system';
          if (mode === 'light') return 'light';
          if (mode === 'dark') return 'dark';
          if (mode === 'system' || !mode) {
              if (this._hass?.themes?.darkMode) return 'dark';
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
      return theme === 'dark' 
        ? 'linear-gradient(90deg, #c8191d 0%, #323232 100%)' 
        : 'linear-gradient(90deg, #c8191d 0%, #FFFFFF 100%)';
    }
    return theme === 'dark' ? '#323232' : '#FFFFFF';
  }

  _parseEntityConfig(config) {
    if (Array.isArray(config)) {
      return [config[0], config[1]];
    }
    if (typeof config === 'string') {
      return config.split(',').map(e => e.trim());
    }
    return [config.entity, config.power];
  }

  _createStatsRow() {
    if (this._config.total === 'off') return null;
    let onCount = 0;
    let totalPower = 0;
    this._config.entities.forEach(entityPair => {
      const [switchEntity, sensorEntity] = this._parseEntityConfig(entityPair);
      const switchState = this.hass.states[switchEntity]?.state;
      const powerValue = parseFloat(this.hass.states[sensorEntity]?.state);
      if (switchState === 'on') {
        onCount++;
        if (!isNaN(powerValue)) totalPower += powerValue;
      }
    });
    const themeMode = this._evaluateTheme();
    const textColor = themeMode === 'light' ? '#333' : '#FFF';
    return html`
      <div class="stats-container"\n 
        style="color: ${textColor}">
        开启&nbsp;${onCount}&nbsp;个&emsp;关闭&nbsp;${this._config.entities.length - onCount}&nbsp;个&emsp;总功率：${totalPower.toFixed(1)}W
      </div>
    `;
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
    const { FEEDBACK } = this.constructor.TIMING;
    await this.hass.callService('switch', 'toggle', { entity_id: entity });
    this._handleClick();
    const button = this.shadowRoot.querySelector(`#${cardId} .power-button`);
    if (button) {
      button.animate([
        { transform: 'scale(1)' },
        { transform: 'scale(0.8)' },
        { transform: 'scale(1)' }
      ], { duration: FEEDBACK });
    }
  }

  render() {
    if (!this._config || !this.hass) return html``;
    return html`
      ${this._createStatsRow()}
      <div class="entities-grid"\nstyle="--column-count: ${this._config.columns}">
      ${this._config.entities.map((entityPair, index) => {
        const [switchEntity, sensorEntity] = this._parseEntityConfig(entityPair);
        const stateObj = this.hass.states[switchEntity] || {};
        const state = stateObj.state || 'off';
        const attributes = stateObj.attributes || {};
        const cardId = `card-${index}`;
        const isUnlocked = !!this._unlockedCards[cardId];
        let powerValue = '';
        if (sensorEntity) {
          const powerState = this.hass.states[sensorEntity];
          if (powerState && !isNaN(powerState.state)) {
            const powerUnit = powerState.attributes?.unit_of_measurement || 'W';
            powerValue = `${parseFloat(powerState.state).toFixed(1)}${powerUnit}`;
          }
        }
        const themeMode = this._evaluateTheme();
        const textColor = themeMode === 'light' ? '#333' : '#FFF';
        const bgColor = state === 'on' 
          ? (themeMode === 'dark' ? '#323232' : '#FFFFFF')
          : (themeMode === 'dark' ? '#323232' : '#FFFFFF');
        const bgImage = state === 'on'
          ? (themeMode === 'dark'
              ? 'linear-gradient(90deg, #c8191d 0%, #323232 100%)'
              : 'linear-gradient(90deg, #c8191d 0%, #FFFFFF 100%)')
          : 'none';
        return html`
          <div id="${cardId}" class="xiaoshi-container"\n
            style="width: 100%;height: ${this._config.height};background-color: ${bgColor};background-image: ${bgImage};color: ${textColor};">
            <div class="name-container">
              <span class="device-name">${attributes.friendly_name || switchEntity}</span>
              ${powerValue ? html`<span class="power-value">${powerValue}</span>` : ''}
            </div>
            <div class="button-container">
              <div class="lock-button ${isUnlocked ? 'unlocked' : ''}" \n
                   @click=${() => this._unlockControls(cardId)}\n
                   @touchend=${() => this._unlockControls(cardId)}>
                <ha-icon icon=${isUnlocked ? 'mdi:lock-open' : 'mdi:lock'}></ha-icon>
              </div>
              <div class="power-button ${state === 'on' ? 'active' : ''} ${isUnlocked ? 'unlocked' : ''}"\n
                   @click=${() => this._togglePower(switchEntity, cardId)}>
                <ha-icon icon="mdi:power-socket-uk"></ha-icon>
              </div>
            </div>
            ${isUnlocked ? html`
              <div class="unlock-progress"></div>
            ` : ''}
          </div>
        `;
      })}
    `;
  }
 
  disconnectedCallback() {
    super.disconnectedCallback();
    this._unlockedCards = {};
  }
}
customElements.define('xiaoshi-phone-switch-card', XiaoshiPhoneSwitchCard);

