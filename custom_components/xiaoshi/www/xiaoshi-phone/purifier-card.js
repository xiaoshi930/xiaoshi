import { LitElement, html, css } from "https://unpkg.com/lit-element@2.4.0/lit-element.js?module";

window.customCards = window.customCards || [];
window.customCards.push({
    type: 'xiaoshi-phone-purifier-card',
    name: '消逝卡(移动端)-净化器卡',
    description: '移动端净化器卡',
    preview: true
});

class XiaoshiPhonePurifierCardEditor extends LitElement {
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
      _numberSearchTerm: { type: String },
      _filteredNumberEntities: { type: Array },
      _showNumberList: { type: Boolean },
      _pm25SearchTerm: { type: String },
      _filteredPM25Entities: { type: Array },
      _showPM25List: { type: Boolean },
      _temperatureSearchTerm: { type: String },
      _filteredTemperatureEntities: { type: Array },
      _showTemperatureList: { type: Boolean },
      _humiditySearchTerm: { type: String },
      _filteredHumidityEntities: { type: Array },
      _showHumidityList: { type: Boolean },
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
        this._showNumberList = false;
        this._showPM25List = false;
        this._showTemperatureList = false;
        this._showHumidityList = false;
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
    await this._setDefaultPurifierEntity();
  }

  async _setDefaultPurifierEntity() {
    if (this.config?.entity) return;
    const entities = Object.keys(this.hass.states).filter(
      eid => eid.startsWith('fan.') || eid.startsWith('switch.')
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

    const allEntities = Object.values(this.hass.states);

    this._filteredEntities = allEntities.filter(entity => {
      const entityId = entity.entity_id.toLowerCase();
      const friendlyName = (entity.attributes.friendly_name || '').toLowerCase();

      const isPurifierEntity = entityId.startsWith('fan.') || entityId.startsWith('switch.');
      const matchesSearch = entityId.includes(searchTerm) || friendlyName.includes(searchTerm);

      return isPurifierEntity && matchesSearch;
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

  _onNumberSearch(e) {
    const searchTerm = e.target.value.toLowerCase();
    this._numberSearchTerm = searchTerm;
    this._showNumberList = true;

    if (!this.hass) return;

    const allEntities = Object.values(this.hass.states);

    this._filteredNumberEntities = allEntities.filter(entity => {
      const entityId = entity.entity_id.toLowerCase();
      const friendlyName = (entity.attributes.friendly_name || '').toLowerCase();

      const isNumberEntity = entityId.startsWith('number.');
      const matchesSearch = entityId.includes(searchTerm) || friendlyName.includes(searchTerm);

      return isNumberEntity && matchesSearch;
    }).slice(0, 50);

    this.requestUpdate();
  }

  _selectNumber(entityId) {
    this.config = {
      ...this.config,
      number: entityId
    };

    this._numberSearchTerm = '';
    this._showNumberList = false;

    this._fireEvent();
    this.requestUpdate();
  }

  _onPM25Search(e) {
    const searchTerm = e.target.value.toLowerCase();
    this._pm25SearchTerm = searchTerm;
    this._showPM25List = true;

    if (!this.hass) return;

    const allEntities = Object.values(this.hass.states);

    this._filteredPM25Entities = allEntities.filter(entity => {
      const entityId = entity.entity_id.toLowerCase();
      const friendlyName = (entity.attributes.friendly_name || '').toLowerCase();

      const isSensorEntity = entityId.startsWith('sensor.');
      const matchesSearch = entityId.includes(searchTerm) || friendlyName.includes(searchTerm);

      return isSensorEntity && matchesSearch;
    }).slice(0, 50);

    this.requestUpdate();
  }

  _selectPM25(entityId) {
    this.config = {
      ...this.config,
      pm25: entityId
    };

    this._pm25SearchTerm = '';
    this._showPM25List = false;

    this._fireEvent();
    this.requestUpdate();
  }

  _onTemperatureSearch(e) {
    const searchTerm = e.target.value.toLowerCase();
    this._temperatureSearchTerm = searchTerm;
    this._showTemperatureList = true;

    if (!this.hass) return;

    const allEntities = Object.values(this.hass.states);

    this._filteredTemperatureEntities = allEntities.filter(entity => {
      const entityId = entity.entity_id.toLowerCase();
      const friendlyName = (entity.attributes.friendly_name || '').toLowerCase();

      const isSensorEntity = entityId.startsWith('sensor.');
      const matchesSearch = entityId.includes(searchTerm) || friendlyName.includes(searchTerm);

      return isSensorEntity && matchesSearch;
    }).slice(0, 50);

    this.requestUpdate();
  }

  _selectTemperature(entityId) {
    this.config = {
      ...this.config,
      temperature: entityId
    };

    this._temperatureSearchTerm = '';
    this._showTemperatureList = false;

    this._fireEvent();
    this.requestUpdate();
  }

  _onHumiditySearch(e) {
    const searchTerm = e.target.value.toLowerCase();
    this._humiditySearchTerm = searchTerm;
    this._showHumidityList = true;

    if (!this.hass) return;

    const allEntities = Object.values(this.hass.states);

    this._filteredHumidityEntities = allEntities.filter(entity => {
      const entityId = entity.entity_id.toLowerCase();
      const friendlyName = (entity.attributes.friendly_name || '').toLowerCase();

      const isSensorEntity = entityId.startsWith('sensor.');
      const matchesSearch = entityId.includes(searchTerm) || friendlyName.includes(searchTerm);

      return isSensorEntity && matchesSearch;
    }).slice(0, 50);

    this.requestUpdate();
  }

  _selectHumidity(entityId) {
    this.config = {
      ...this.config,
      humidity: entityId
    };

    this._humiditySearchTerm = '';
    this._showHumidityList = false;

    this._fireEvent();
    this.requestUpdate();
  }

  _onTimerSearch(e) {
    const searchTerm = e.target.value.toLowerCase();
    this._timerSearchTerm = searchTerm;
    this._showTimerList = true;

    if (!this.hass) return;

    const allEntities = Object.values(this.hass.states);

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
          <div class="label">净化器实体 (必选)</div>
          <div class="entity-selector">
            <input
              type="text"
              @input=${this._onMainEntitySearch}
              @focus=${this._onMainEntitySearch}
              .value=${this._searchTerm || this.config?.entity || ''}
              placeholder="搜索净化器实体..."
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
            <div class="hint">正在加载可用净化器...</div>
          ` : ''}
        </div>

        <!-- 模式传感器 -->
        <div class="row">
          <div class="label">模式传感器 (可选)</div>
          <div class="entity-selector-with-remove">
            <div class="entity-selector">
              <input
                type="text"
                @input=${this._onSelectSearch}
                @focus=${this._onSelectSearch}
                .value=${this._selectSearchTerm || this.config.select || ''}
                placeholder="搜索模式传感器..."
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
            <button class="remove-button" @click=${this._removeSelect} title="移除模式传感器">
              <ha-icon icon="mdi:close"></ha-icon>
            </button>
          </div>
        </div>

        <!-- 风速传感器 -->
        <div class="row">
          <div class="label">风速传感器 (必选)</div>
          <div class="entity-selector">
            <input
              type="text"
              @input=${this._onNumberSearch}
              @focus=${this._onNumberSearch}
              .value=${this._numberSearchTerm || this.config.number || ''}
              placeholder="搜索风速传感器..."
              class="entity-search-input"
            />
            ${this._showNumberList ? html`
              <div class="entity-dropdown">
                ${this._filteredNumberEntities.map(entity => html`
                  <div
                    class="entity-option ${this.config.number === entity.entity_id ? 'selected' : ''}"
                    @click=${() => this._selectNumber(entity.entity_id)}
                  >
                    <div class="entity-info">
                      <ha-icon icon="${entity.attributes.icon || 'mdi:help-circle'}"></ha-icon>
                      <div class="entity-details">
                        <div class="entity-name">${entity.attributes.friendly_name || entity.entity_id}</div>
                        <div class="entity-id">${entity.entity_id}</div>
                      </div>
                    </div>
                    ${this.config.number === entity.entity_id ?
                      html`<ha-icon icon="mdi:check" class="check-icon"></ha-icon>` : ''}
                  </div>
                `)}
                ${this._filteredNumberEntities.length === 0 ? html`
                  <div class="no-results">未找到匹配的实体</div>
                ` : ''}
              </div>
            ` : ''}
          </div>
        </div>

        <!-- PM25传感器 -->
        <div class="row">
          <div class="label">PM25传感器 (必选)</div>
          <div class="entity-selector">
            <input
              type="text"
              @input=${this._onPM25Search}
              @focus=${this._onPM25Search}
              .value=${this._pm25SearchTerm || this.config.pm25 || ''}
              placeholder="搜索PM25传感器..."
              class="entity-search-input"
            />
            ${this._showPM25List ? html`
              <div class="entity-dropdown">
                ${this._filteredPM25Entities.map(entity => html`
                  <div
                    class="entity-option ${this.config.pm25 === entity.entity_id ? 'selected' : ''}"
                    @click=${() => this._selectPM25(entity.entity_id)}
                  >
                    <div class="entity-info">
                      <ha-icon icon="${entity.attributes.icon || 'mdi:help-circle'}"></ha-icon>
                      <div class="entity-details">
                        <div class="entity-name">${entity.attributes.friendly_name || entity.entity_id}</div>
                        <div class="entity-id">${entity.entity_id}</div>
                      </div>
                    </div>
                    ${this.config.pm25 === entity.entity_id ?
                      html`<ha-icon icon="mdi:check" class="check-icon"></ha-icon>` : ''}
                  </div>
                `)}
                ${this._filteredPM25Entities.length === 0 ? html`
                  <div class="no-results">未找到匹配的实体</div>
                ` : ''}
              </div>
            ` : ''}
          </div>
        </div>

        <!-- 温度传感器 -->
        <div class="row">
          <div class="label">温度传感器 (可选)</div>
          <div class="entity-selector-with-remove">
            <div class="entity-selector">
              <input
                type="text"
                @input=${this._onTemperatureSearch}
                @focus=${this._onTemperatureSearch}
                .value=${this._temperatureSearchTerm || this.config.temperature || ''}
                placeholder="搜索温度传感器..."
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

        <!-- 湿度传感器 -->
        <div class="row">
          <div class="label">湿度传感器 (可选)</div>
          <div class="entity-selector-with-remove">
            <div class="entity-selector">
              <input
                type="text"
                @input=${this._onHumiditySearch}
                @focus=${this._onHumiditySearch}
                .value=${this._humiditySearchTerm || this.config.humidity || ''}
                placeholder="搜索湿度传感器..."
                class="entity-search-input"
              />
              ${this._showHumidityList ? html`
                <div class="entity-dropdown">
                  ${this._filteredHumidityEntities.map(entity => html`
                    <div
                      class="entity-option ${this.config.humidity === entity.entity_id ? 'selected' : ''}"
                      @click=${() => this._selectHumidity(entity.entity_id)}
                    >
                      <div class="entity-info">
                        <ha-icon icon="${entity.attributes.icon || 'mdi:help-circle'}"></ha-icon>
                        <div class="entity-details">
                          <div class="entity-name">${entity.attributes.friendly_name || entity.entity_id}</div>
                          <div class="entity-id">${entity.entity_id}</div>
                        </div>
                      </div>
                      ${this.config.humidity === entity.entity_id ?
                        html`<ha-icon icon="mdi:check" class="check-icon"></ha-icon>` : ''}
                    </div>
                  `)}
                  ${this._filteredHumidityEntities.length === 0 ? html`
                    <div class="no-results">未找到匹配的实体</div>
                  ` : ''}
                </div>
              ` : ''}
            </div>
            <button class="remove-button" @click=${this._removeHumidity} title="移除湿度传感器">
              <ha-icon icon="mdi:close"></ha-icon>
            </button>
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

  _removeSelect() {
    const newConfig = { ...this.config };
    delete newConfig.select;
    this.config = newConfig;
    this._fireEvent();
  }

  _removeTemperature() {
    const newConfig = { ...this.config };
    delete newConfig.temperature;
    this.config = newConfig;
    this._fireEvent();
  }

  _removeHumidity() {
    const newConfig = { ...this.config };
    delete newConfig.humidity;
    this.config = newConfig;
    this._fireEvent();
  }

  _removeTimer() {
    const newConfig = { ...this.config };
    delete newConfig.timer;
    this.config = newConfig;
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
customElements.define('xiaoshi-phone-purifier-card-editor', XiaoshiPhonePurifierCardEditor);

class XiaoshiPhonePurifierCard extends LitElement {
  static get properties() { 
    return {
      hass: { type: Object },
      width: { type: String, attribute: true },
      config: { type: Object },
      buttons: { type: Array },
      theme: { type: String },
      _timerInterval: { state: true },
      purifierData: { type: Array },
      _externalPurifierSensor: { type: String },
      _fanModeSelectEntity: { type: String },
      _fanSpeedNumberEntity: { type: String },
      _temperatureEntity: { type: String },
      _humidityEntity: { type: String },
      _pm25Entity: { type: String }
    };
  }
  static getConfigElement() {
    return document.createElement("xiaoshi-phone-purifier-card-editor");
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
    this._fanSpeedNumberEntity = config.number || '';
    this._temperatureEntity = config.temperature || '';
    this._humidityEntity = config.humidity || '';
    this._pm25Entity = config.pm25 || '';
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
            "icon dangwei fan fan "
            "icon dangwei timer timer"
            "icon dangwei extra extra"
            "a a a a"; 
        grid-template-columns: 16% 22% 50% 10%;
        grid-template-rows: auto auto auto auto 4px;
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
      .purifier-adjust-container {
        display: inline-flex;
        align-items: center;
        gap: 1px;
      }
      .purifier-adjust-button {
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

      .purifier-display {
        font-size: 12px;
        min-width: 24px;
        text-align: center;
        color: var(--button);;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      .purifier-fan {
        font-size: 12px;
        text-align: center;
        min-width:25px;
        color: var(--button);;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      .current-purifier {
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
    this.theme = 'system';
    this.width = '100%';
    this._timerInterval = null;
    this.purifierData = [];
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
      const entityId = this.config.pm25;
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
      
      const rawData = result[entityId]
          .map(entry => {
              const value = entry.s;
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
      
      this.purifierData = this._gaussianSmooth(sampledData, 3);
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
    this.canvas.className = 'purifier-chart';
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
    if (!this.ctx || !this.purifierData || this.purifierData.length === 0) return;
    
    const entity = this.hass.states[this.config.entity];
    const state = entity?.state || 'off';
    const theme = this._evaluateTheme();
    
    // 确定颜色
    let statusColor = theme === 'light' ? '#888888' : '#aaaaaa';
    if (state === 'on') statusColor = '#05CD32';
    
    // 获取画布尺寸（CSS像素）
    const canvas = this.canvas;
    const ctx = this.ctx;
    const scale = window.devicePixelRatio || 1;
    const width = canvas.width / scale;
    const height = canvas.height / scale;
    
    // 清除画布（使用物理像素尺寸）
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // 计算温度范围
    const minPurifier = Math.min(...this.purifierData) - 1;
    const maxPurifier = Math.max(...this.purifierData);
    const purifierRange = Math.max(maxPurifier - minPurifier, 0.1);
    const xStep = width / (this.purifierData.length - 1);
    
    // 创建点集
    const points = this.purifierData.map((purifier, i) => {
        return {
            x: i * xStep,
            y: height - ((purifier - minPurifier) / purifierRange) * height,
            value: purifier
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

    const attrs = entity.attributes;
    const theme = this._evaluateTheme();
    const fgColor = theme === 'light' ? 'rgb(0, 0, 0)' : 'rgb(255, 255, 255)';
    const bgColor = theme === 'light' ? 'rgb(255, 255, 255)' : 'rgb(50, 50, 50)';
    const buttonBg = theme === 'light' ? 'rgb(50,50,50)' : 'rgb(120,120,120)';
    const buttonFg = 'rgb(250,250,250)';

    let statusColor = 'rgb(250,250,250)';
    let linearColor = 'rgb(0,0,0,0)';
    if (state === 'on') statusColor = 'rgb(50,205,50)' ,linearColor = 'rgb(50,205,50)';
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
    
    // 优先检查select实体
    if (this._fanModeSelectEntity) {
        const selectEntity = this.hass.states[this._fanModeSelectEntity];
        if (selectEntity && selectEntity.attributes && selectEntity.attributes.options) {
            fanModes = selectEntity.attributes.options;
            currentFanMode = selectEntity.state;
            hasFanModes = fanModes.length > 0;
        }
    }
    // 如果没有select实体，再检查fan实体是否有preset_modes属性
    else {
        const fanEntity = this.hass.states[this.config.entity];
        if (fanEntity && fanEntity.attributes && fanEntity.attributes.preset_modes) {
            fanModes = fanEntity.attributes.preset_modes;
            currentFanMode = fanEntity.attributes.preset_mode || '';
            hasFanModes = fanModes.length > 0;
        }
    }
    if (currentFanMode === 'unavailable')  currentFanMode = ' ';
    
    const hasTimer = this.config.timer;
    const timerEntity = hasTimer ? this.hass.states[this.config.timer] : null;
    const hasExtra = this.buttons && this.buttons.length > 0;
    
    const gridPurifierlateRows = [
        'auto',
        'auto',
        hasFanModes ? 'auto' : '0',
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
    const buttonCount = Math.min(this.buttons.length, 5); 
    const gridColumns = buttonCount <= 4 ? 4 : 5;

    return html` 
      <div class="card" style=" width: ${this.width};
                                background: ${bgColor}; 
                                color: ${fgColor}; 
                                --button-bg: ${buttonBg}; 
                                --button-fg: ${buttonFg}; 
                                --active-color: ${statusColor};
                                --linear-color: ${linearColor};
                                grid-template-rows: ${gridPurifierlateRows}">
																
        ${isOn ? html`<div class="active-gradient"></div>` : ''}
        <div id="chart-container"></div>
            <div class="content-container">
                <div class="name-area">${attrs.friendly_name}</div>
                <div class="status-area" style="color: ${fgColor}">${translatedState}：
                    <div class="purifier-adjust-container">
                        <div class="purifier-display">${this._renderEnvironmentData()}</div>
                    </div>
                </div>

        <div class="dangwei">
              <div class="purifier-adjust-container">
                  <button class="purifier-adjust-button" @click=${() => this._setFanNumberPrevious()}>
                      <ha-icon icon="mdi:minus"></ha-icon>
                  </button>
                  <div class="purifier-fan">${this._getFanSpeedDisplay()}</div>
                  <button class="purifier-adjust-button" @click=${() => this._setFanNumberNext()}>
                      <ha-icon icon="mdi:plus"></ha-icon>
                  </button>
              </div>
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
          
          ${hasFanModes ? html`
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
      this._startTimerRefresh();
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

    const purifierEntity = this.hass.states[this.config.entity];
    const purifierState = purifierEntity ? purifierEntity.state : 'off';
    
    let activeColor = 'rgb(255,255,255)';
    if (purifierState === 'on') activeColor = 'rgb(50,205,50)';
    
    const now = new Date();
    const finishesAt = new Date(timerEntity.attributes.finishes_at || 0);
    let remainingSeconds = Math.max(0, Math.floor((finishesAt - now) / 1000));
  
    const state = timerEntity.state;
    if (state !== 'active') {
        remainingSeconds = 0;
    } else if (remainingSeconds <= 0) {
        this._turnOffPurifier();
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
      const fgColor = theme === 'light' ? 'rgb(0, 0, 0)' : 'rgb(255, 255, 255)';
      let activeColor = theme === 'light' ? 'rgba(00, 80, 80)' : 'rgba(180, 230, 230)';
      if (state === 'on') activeColor = 'rgb(50,205,50)';

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

  _adjustPurifier(direction) {
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
      
      this._callService('purifier', 'set_humidity', {
          entity_id: this.config.entity,
          humidity: newHumidity
      });
      this._handleClick();
  }

  _renderModeButtons(modes, currentMode) {
      if (!modes) return html``;
      
      const modeIcons = {
          'on': 'mdi:fan',
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
                  <ha-icon class="icon" icon="${modeIcons[mode] || 'mdi:fan'}" style="color: ${isActive ? 'var(--active-color)' : ''}"></ha-icon>
              </button>
          `;
      });
  }

  _renderFanButtons(fanModes, currentFanMode) {
    // 优先检查fan实体是否有preset_modes属性
    const fanEntity = this.hass.states[this.config.entity];
    let actualFanModes = fanModes;
    let actualCurrentFanMode = currentFanMode;
    
    if (fanEntity && fanEntity.attributes && fanEntity.attributes.preset_modes) {
      // 使用fan实体的preset_modes
      actualFanModes = fanEntity.attributes.preset_modes;
      actualCurrentFanMode = fanEntity.attributes.preset_mode || '';
    }
    
    if (!actualFanModes || actualFanModes.length === 0) return html``;
    
    const isOn = fanEntity?.state !== 'off';
    
    const modeIconMap = {
      '自动': 'mdi:fan-auto',
      '最爱': 'mdi:heart',
      '睡眠': 'mdi:power-sleep',
      'auto': 'mdi:fan-auto',
      'favorite': 'mdi:heart',
      'sleep': 'mdi:power-sleep'
    };

    return actualFanModes.map((mode) => {
        const isActive = mode === actualCurrentFanMode && isOn;
        const modeIcon = modeIconMap[mode] || 'mdi:fan';
        
        return html`
            <button 
                class="mode-button ${isActive ? 'active-mode' : ''}" 
                @click=${() => this._setFanOption(mode)}
                style="color: ${isActive ? 'var(--active-color)' : ''}"
            >
                <div class="fan-button">
                    <ha-icon 
                        class="fan-button-icon" 
                        icon="${modeIcon}" 
                        style="color: ${isActive ? 'var(--active-color)' : ''}"
                    ></ha-icon>
                    <span class="fan-text">${this._translateFanMode(mode)}</span>
                </div>
            </button>
        `;
    });
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

  _setFanOption(mode) {
    // 优先使用select实体，其次使用fan实体的preset_modes属性
    if (this._fanModeSelectEntity) {
      // 使用select.select_option服务
      this._callService('select', 'select_option', {
          entity_id: this._fanModeSelectEntity,
          option: mode
      });
    } else {
      // 检查实体是否有preset_modes属性（fan类型实体）
      const fanEntity = this.hass.states[this.config.entity];
      if (fanEntity && fanEntity.attributes && fanEntity.attributes.preset_modes) {
        // 使用fan.set_preset_mode服务
        this._callService('fan', 'set_preset_mode', {
            entity_id: this.config.entity,
            preset_mode: mode
        });
      } else {
        // 如果没有select实体也没有preset_modes，使用默认的select服务
        this._callService('select', 'select_option', {
            entity_id: this._fanModeSelectEntity,
            option: mode
        });
      }
    }
    this._handleClick();
  }

  _setFanNumberNext() {
    if (this._fanSpeedNumberEntity) {
      const numberEntity = this.hass.states[this._fanSpeedNumberEntity];
      if (numberEntity) {
        const currentValue = parseFloat(numberEntity.state) || 0;
        const step = numberEntity.attributes.step || 1;
        const min = numberEntity.attributes.min || 0;
        const max = numberEntity.attributes.max || 100;
        const newValue = Math.min(max, currentValue + step);
        this._callService('number', 'set_value', {
            entity_id: this._fanSpeedNumberEntity,
            value: newValue
        });
      }
    }
    this._handleClick();
  }

  _setFanNumberPrevious() {
    if (this._fanSpeedNumberEntity) {
      const numberEntity = this.hass.states[this._fanSpeedNumberEntity];
      if (numberEntity) {
        const currentValue = parseFloat(numberEntity.state) || 0;
        const step = numberEntity.attributes.step || 1;
        const min = numberEntity.attributes.min || 0;
        const max = numberEntity.attributes.max || 100;
        const newValue = Math.max(min, currentValue - step);
        this._callService('number', 'set_value', {
            entity_id: this._fanSpeedNumberEntity,
            value: newValue
        });
      }
    }
    this._handleClick();
  }

  _getFanSpeedDisplay() {
    // 优先显示number实体的数值
    if (this._fanSpeedNumberEntity) {
      const numberEntity = this.hass.states[this._fanSpeedNumberEntity];
      if (numberEntity) {
        const currentValue = parseFloat(numberEntity.state) || 0;
        return `${currentValue}级`;
      }
    }
    
    // 其次显示select实体的当前模式
    if (this._fanModeSelectEntity) {
      const selectEntity = this.hass.states[this._fanModeSelectEntity];
      if (selectEntity) {
        return selectEntity.state;
      }
    }
    
    // 最后显示fan实体的当前模式
    const fanEntity = this.hass.states[this.config.entity];
    if (fanEntity && fanEntity.attributes) {
      if (fanEntity.attributes.preset_mode) {
        return fanEntity.attributes.preset_mode;
      }
      if (fanEntity.attributes.fan_mode) {
        return fanEntity.attributes.fan_mode;
      }
    }
    
    return '';
  }

  _getEnvironmentData() {
    let temperature = '';
    let humidity = '';
    let pm25 = '';
    
    // 获取温度数据
    if (this._temperatureEntity) {
      const tempEntity = this.hass.states[this._temperatureEntity];
      if (tempEntity) {
        const tempValue = parseFloat(tempEntity.state) || 0;
        temperature = `${tempValue}°C`;
      }
    }
    
    // 获取湿度数据
    if (this._humidityEntity) {
      const humidityEntity = this.hass.states[this._humidityEntity];
      if (humidityEntity) {
        const humidityValue = parseFloat(humidityEntity.state) || 0;
        humidity = `${humidityValue}%`;
      }
    }
    
    // 获取PM2.5数据
    if (this._pm25Entity) {
      const pm25Entity = this.hass.states[this._pm25Entity];
      if (pm25Entity) {
        const pm25Value = parseFloat(pm25Entity.state) || 0;
        pm25 = `${pm25Value}μg/m³`;
      }
    }
    
    return { temperature, humidity, pm25 };
  }

  _renderEnvironmentData() {
    const envData = this._getEnvironmentData();
    const hasData = envData.temperature || envData.humidity || envData.pm25;
    
    if (!hasData) return '';
    
    return html`
      <div class="environment-data">
        ${envData.temperature ? html`<span class="env-item"> ${envData.temperature}</span>` : ''}
        ${envData.humidity ? html`<span class="env-item"> ${envData.humidity}</span>` : ''}
        ${envData.pm25 ? html`<span class="env-item"> ${envData.pm25}</span>` : ''}
      </div>
    `;
  }

  _turnOffPurifier() {
    if (!this.config.entity) return;
    
    const deviceType = this._getDeviceType();
    switch (deviceType) {
      case 'fan':
        this._callService('fan', 'turn_off', {
            entity_id: this.config.entity
        });
        break;
      case 'switch':
        this._callService('switch', 'turn_off', {
            entity_id: this.config.entity
        });
        break;
      default:
        this._callService('switch', 'turn_off', {
            entity_id: this.config.entity
        });
    }
    this._handleClick();
  }

  _getDeviceType() {
    if (!this.config.entity) return 'switch';
    
    // 根据实体ID判断设备类型
    if (this.config.entity.includes('fan')) {
      return 'fan';
    } else if (this.config.entity.includes('switch')) {
      return 'switch';
    }
    
    // 默认返回switch类型
    return 'switch';
  }

  _togglePower() {
      const entity = this.hass.states[this.config.entity];
      const deviceType = this._getDeviceType();
      
      switch (entity.state) {
        case 'off':
          switch (deviceType) {
            case 'fan':
              this._callService('fan', 'turn_on', {
                  entity_id: this.config.entity
              });
              break;
            case 'switch':
              this._callService('switch', 'turn_on', {
                  entity_id: this.config.entity
              });
              break;
            default:
              this._callService('switch', 'turn_on', {
                  entity_id: this.config.entity
              });
          }
          this._handleClick();
          break;
        default:
          switch (deviceType) {
            case 'fan':
              this._callService('fan', 'turn_off', {
                  entity_id: this.config.entity
              });
              break;
            case 'switch':
              this._callService('switch', 'turn_off', {
                  entity_id: this.config.entity
              });
              break;
            default:
              this._callService('switch', 'turn_off', {
                  entity_id: this.config.entity
              });
          }
          this._cancelTimer();
          this._handleClick();
      }
      
  }

  _callService(domain, service, data) {
      this.hass.callService(domain, service, data);
      this._handleClick();
  }
} 
customElements.define('xiaoshi-phone-purifier-card', XiaoshiPhonePurifierCard);

