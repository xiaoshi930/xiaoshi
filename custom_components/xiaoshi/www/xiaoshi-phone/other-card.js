import { LitElement, html, css } from "https://unpkg.com/lit-element@2.4.0/lit-element.js?module";

window.customCards = window.customCards || [];
window.customCards.push({
    type: 'xiaoshi-phone-other-card',
    name: '消逝卡(移动端)-其他设备卡',
    description: '移动端其他设备卡',
    preview: true
}); 

class XiaoshiPhoneOtherCardEditor extends LitElement {
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
      _showButtonLists: { type: Boolean },
      _button2SearchTerms: { type: Object },
      _filteredButton2Entities: { type: Object },
      _showButton2Lists: { type: Boolean },
      _buttonRowSearchTerms: { type: Object },
      _filteredButtonRowEntities: { type: Object },
      _showButtonRowLists: { type: Object }
    };
  }

  setConfig(config) {
    this.config = config || {};
  }

  firstUpdated() {
    document.addEventListener('click', (e) => {
      if (!e.target.closest('.entity-selector')) {
        this._showEntityList = false;
        this._showTemperatureList = false;
        this._showTimerList = false;

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
        if (this._showButtonRowLists) {
          Object.keys(this._showButtonRowLists).forEach(key => {
            this._showButtonRowLists[key] = false;
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

    const allEntities = Object.values(this.hass.states);

    this._filteredEntities = allEntities.filter(entity => {
      const entityId = entity.entity_id.toLowerCase();
      const friendlyName = (entity.attributes.friendly_name || '').toLowerCase();
      const matchesSearch = entityId.includes(searchTerm) || friendlyName.includes(searchTerm);
      return matchesSearch;
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

  // ===== 按钮排管理 =====
  _getButtonRows() {
    return this.config.button_rows || [];
  }

  _addButtonRow() {
    const rows = [...this._getButtonRows()];
    rows.push({ items: [] });
    this.config = { ...this.config, button_rows: rows };
    this._fireEvent();
  }

  _removeButtonRow(rowIndex) {
    const rows = [...this._getButtonRows()];
    rows.splice(rowIndex, 1);
    this.config = { ...this.config, button_rows: rows.length > 0 ? rows : undefined };
    // 清理搜索状态
    if (this._buttonRowSearchTerms) {
      const newTerms = {};
      Object.keys(this._buttonRowSearchTerms).forEach(key => {
        const [ri, ii] = key.split('-').map(Number);
        if (ri < rowIndex) newTerms[key] = this._buttonRowSearchTerms[key];
        else if (ri > rowIndex) newTerms[`${ri-1}-${ii}`] = this._buttonRowSearchTerms[key];
      });
      this._buttonRowSearchTerms = newTerms;
    }
    if (this._filteredButtonRowEntities) {
      const newFiltered = {};
      Object.keys(this._filteredButtonRowEntities).forEach(key => {
        const [ri, ii] = key.split('-').map(Number);
        if (ri < rowIndex) newFiltered[key] = this._filteredButtonRowEntities[key];
        else if (ri > rowIndex) newFiltered[`${ri-1}-${ii}`] = this._filteredButtonRowEntities[key];
      });
      this._filteredButtonRowEntities = newFiltered;
    }
    if (this._showButtonRowLists) {
      const newShow = {};
      Object.keys(this._showButtonRowLists).forEach(key => {
        const [ri, ii] = key.split('-').map(Number);
        if (ri < rowIndex) newShow[key] = this._showButtonRowLists[key];
        else if (ri > rowIndex) newShow[`${ri-1}-${ii}`] = this._showButtonRowLists[key];
      });
      this._showButtonRowLists = newShow;
    }
    this._fireEvent();
    this.requestUpdate();
  }

  _addButtonRowItem(rowIndex) {
    const rows = [...this._getButtonRows()];
    if (!rows[rowIndex]) return;
    rows[rowIndex] = { ...rows[rowIndex], items: [...(rows[rowIndex].items || []), { mode: 'button', entity: '' }] };
    this.config = { ...this.config, button_rows: rows };
    this._fireEvent();
  }

  _removeButtonRowItem(rowIndex, itemIndex) {
    const rows = [...this._getButtonRows()];
    if (!rows[rowIndex]) return;
    const items = [...(rows[rowIndex].items || [])];
    items.splice(itemIndex, 1);
    rows[rowIndex] = { ...rows[rowIndex], items };
    this.config = { ...this.config, button_rows: rows };
    // 清理搜索状态
    const key = `${rowIndex}-${itemIndex}`;
    if (this._buttonRowSearchTerms) delete this._buttonRowSearchTerms[key];
    if (this._filteredButtonRowEntities) delete this._filteredButtonRowEntities[key];
    if (this._showButtonRowLists) delete this._showButtonRowLists[key];
    this._fireEvent();
    this.requestUpdate();
  }

  _buttonRowModeChanged(rowIndex, itemIndex, mode) {
    const rows = [...this._getButtonRows()];
    if (!rows[rowIndex] || !rows[rowIndex].items[itemIndex]) return;
    const items = [...rows[rowIndex].items];
    items[itemIndex] = { ...items[itemIndex], mode };
    rows[rowIndex] = { ...rows[rowIndex], items };
    this.config = { ...this.config, button_rows: rows };
    this._fireEvent();
  }

  _onButtonRowSearch(e, rowIndex, itemIndex) {
    const searchTerm = e.target.value.toLowerCase();
    const key = `${rowIndex}-${itemIndex}`;

    if (!this._buttonRowSearchTerms) this._buttonRowSearchTerms = {};
    if (!this._filteredButtonRowEntities) this._filteredButtonRowEntities = {};
    if (!this._showButtonRowLists) this._showButtonRowLists = {};

    this._buttonRowSearchTerms[key] = searchTerm;
    this._showButtonRowLists[key] = true;

    if (!this.hass) return;

    const allEntities = Object.values(this.hass.states);
    this._filteredButtonRowEntities[key] = allEntities.filter(entity => {
      const entityId = entity.entity_id.toLowerCase();
      const friendlyName = (entity.attributes.friendly_name || '').toLowerCase();
      const matchesSearch = entityId.includes(searchTerm) || friendlyName.includes(searchTerm);
      return matchesSearch;
    }).slice(0, 50);

    this.requestUpdate();
  }

  _selectButtonRowEntity(entityId, rowIndex, itemIndex) {
    const rows = [...this._getButtonRows()];
    if (!rows[rowIndex]) return;
    const items = [...(rows[rowIndex].items || [])];
    items[itemIndex] = { ...items[itemIndex], entity: entityId };
    rows[rowIndex] = { ...rows[rowIndex], items };
    this.config = { ...this.config, button_rows: rows };

    const key = `${rowIndex}-${itemIndex}`;
    if (!this._buttonRowSearchTerms) this._buttonRowSearchTerms = {};
    if (!this._showButtonRowLists) this._showButtonRowLists = {};
    this._buttonRowSearchTerms[key] = '';
    this._showButtonRowLists[key] = false;

    this._fireEvent();
    this.requestUpdate();
  }

  _buttonRowSelectOptionsChanged(rowIndex, itemIndex, value) {
    const rows = [...this._getButtonRows()];
    if (!rows[rowIndex] || !rows[rowIndex].items[itemIndex]) return;
    const items = [...rows[rowIndex].items];
    const selectOptions = value ? value.split(',').map(s => s.trim()).filter(s => s) : [];
    items[itemIndex] = { ...items[itemIndex], select_options: selectOptions };
    rows[rowIndex] = { ...rows[rowIndex], items };
    this.config = { ...this.config, button_rows: rows };
    this._fireEvent();
    this.requestUpdate();
  }

  _buttonRowFieldChanged(rowIndex, itemIndex, field, value) {
    const rows = [...this._getButtonRows()];
    if (!rows[rowIndex] || !rows[rowIndex].items[itemIndex]) return;
    const items = [...rows[rowIndex].items];
    items[itemIndex] = { ...items[itemIndex], [field]: value };
    rows[rowIndex] = { ...rows[rowIndex], items };
    this.config = { ...this.config, button_rows: rows };
    this._fireEvent();
    this.requestUpdate();
  }

  // ===== 附加按钮1 =====
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
      const matchesSearch = entityId.includes(searchTerm) || friendlyName.includes(searchTerm);
      return matchesSearch;
    }).slice(0, 50);

    this.requestUpdate();
  }

  _selectButtonEntity(entityId, index) {
    const buttons = [...(this.config.buttons || [])];
    buttons[index] = entityId;
    this.config = { ...this.config, buttons };

    if (!this._buttonSearchTerms) this._buttonSearchTerms = {};
    if (!this._showButtonLists) this._showButtonLists = {};
    this._buttonSearchTerms[index] = '';
    this._showButtonLists[index] = false;

    this._fireEvent();
    this.requestUpdate();
  }

  _addButton() {
    const buttons = [...(this.config.buttons || [])];
    buttons.push('');
    this.config = { ...this.config, buttons };
    this._fireEvent();
  }

  _removeButton(index) {
    const buttons = [...(this.config.buttons || [])];
    buttons.splice(index, 1);
    this.config = { ...this.config, buttons: buttons.length > 0 ? buttons : undefined };

    if (this._buttonSearchTerms) delete this._buttonSearchTerms[index];
    if (this._filteredButtonEntities) delete this._filteredButtonEntities[index];
    if (this._showButtonLists) delete this._showButtonLists[index];

    this._fireEvent();
    this.requestUpdate();
  }

  // ===== 附加按钮2 =====
  _onButton2Search(e, index) {
    const searchTerm = e.target.value.toLowerCase();

    if (!this._button2SearchTerms) this._button2SearchTerms = {};
    if (!this._filteredButton2Entities) this._filteredButton2Entities = {};
    if (!this._showButton2Lists) this._showButton2Lists = {};

    this._button2SearchTerms[index] = searchTerm;
    this._showButton2Lists[index] = true;

    if (!this.hass) return;

    const allEntities = Object.values(this.hass.states);
    this._filteredButton2Entities[index] = allEntities.filter(entity => {
      const entityId = entity.entity_id.toLowerCase();
      const friendlyName = (entity.attributes.friendly_name || '').toLowerCase();
      const matchesSearch = entityId.includes(searchTerm) || friendlyName.includes(searchTerm);
      return matchesSearch;
    }).slice(0, 50);

    this.requestUpdate();
  }

  _selectButton2Entity(entityId, index) {
    const buttons2 = [...(this.config.buttons2 || [])];
    buttons2[index] = entityId;
    this.config = { ...this.config, buttons2 };

    if (!this._button2SearchTerms) this._button2SearchTerms = {};
    if (!this._showButton2Lists) this._showButton2Lists = {};
    this._button2SearchTerms[index] = '';
    this._showButton2Lists[index] = false;

    this._fireEvent();
    this.requestUpdate();
  }

  _addButton2() {
    const buttons2 = [...(this.config.buttons2 || [])];
    buttons2.push('');
    this.config = { ...this.config, buttons2 };
    this._fireEvent();
  }

  _removeButton2(index) {
    const buttons2 = [...(this.config.buttons2 || [])];
    buttons2.splice(index, 1);
    this.config = { ...this.config, buttons2: buttons2.length > 0 ? buttons2 : undefined };

    if (this._button2SearchTerms) delete this._button2SearchTerms[index];
    if (this._filteredButton2Entities) delete this._filteredButton2Entities[index];
    if (this._showButton2Lists) delete this._showButton2Lists[index];

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
    `;
  }

  render() {
    if (!this.hass) return html``;

    return html`
      <div class="form">
        <!-- 主题 & 宽度 -->
        <div style="display: flex; gap: 8px; align-items: flex-end; margin-bottom: 8px;">
          <div style="flex: 1;">
            <label style="font-size: 0.8em;">主题</label>
            <select
              @change=${this._themeSelectChanged}
              .value=${this.config.theme !== undefined ? this.config.theme : 'system'}
              style="width: 100%; padding: 4px 0; border: 1px solid #555; border-radius: 4px; background: var(--card-background-color, #1c1c1c); color: var(--primary-text-color, #fff);"
            >
              <option value="system">跟随系统</option>
              <option value="light">浅色</option>
              <option value="dark">深色</option>
            </select>
          </div>
          <div style="flex: 1;">
            <label style="font-size: 0.8em;">卡片宽度</label>
            <input
              type="text"
              @change=${this._widthChanged}
              .value=${this.config.width !== undefined ? this.config.width : '100%'}
              placeholder="100%"
              style="width: 100%; padding: 4px 0; border: 1px solid #555; border-radius: 4px; background: var(--card-background-color, #1c1c1c); color: var(--primary-text-color, #fff);"
            />
          </div>
        </div>

        <!-- 主实体选择 -->
        <div class="form-group">
          <label>设备实体 (必选)</label>
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

        <!-- 状态显示值 -->
        <div class="form-group">
          <label>状态显示值 (可选)</label>
          <textarea
            .value=${this.config.state_display || ''}
            @change=${(e) => { this.config = { ...this.config, state_display: e.target.value }; this._fireEvent(); this.requestUpdate(); }}
            placeholder="留空使用默认状态，支持[[[ ]]]模板"
            style="width: 100%; padding: 4px 0; border: 1px solid #555; border-radius: 4px; background: var(--card-background-color, #1c1c1c); color: var(--primary-text-color, #fff);"
          ></textarea>
          <div class="hint">支持[[[ ]]]模板语法，如 [[[ entity.state ]]]</div>
        </div>

        <!-- 强调颜色值 -->
        <div class="form-group">
          <label>强调颜色值 (可选)</label>
          <textarea
            .value=${this.config.accent_color || ''}
            @change=${(e) => { this.config = { ...this.config, accent_color: e.target.value }; this._fireEvent(); this.requestUpdate(); }}
            placeholder="默认淡红色，支持[[[ ]]]模板"
            style="width: 100%; padding: 4px 0; border: 1px solid #555; border-radius: 4px; background: var(--card-background-color, #1c1c1c); color: var(--primary-text-color, #fff);"
          ></textarea>
          <div class="hint">用于背景和按钮高亮，支持hex/rgb/rgba，如 #ff6464、rgb(255,0,0)</div>
        </div>

        <!-- 曲线传感器 -->
        <div class="form-group">
          <label>曲线传感器 (可选)</label>
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
            <button class="remove-button" @click=${this._removeTemperature} title="移除曲线传感器">
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

        <!-- 按钮排 -->
        ${this._getButtonRows().map((row, rowIndex) => html`
          <div class="form-group" style="border: 1px solid #444; border-radius: 6px; padding: 10px;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
              <label style="margin: 0;">第${rowIndex + 1}排按钮</label>
              <button class="remove-button" @click=${() => this._removeButtonRow(rowIndex)} title="移除此排" style="margin: 0; padding: 2px 6px;">
                <ha-icon icon="mdi:delete"></ha-icon>
              </button>
            </div>
            ${(row.items || []).map((item, itemIndex) => {
              const itemDomain = item.entity ? item.entity.split('.')[0] : '';
              return html`
              <div class="form-group" style="margin-bottom: 8px; padding: 6px; background: rgba(255,255,255,0.05); border-radius: 4px;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
                  <span style="font-size: 0.85em; opacity: 0.8;">第${itemIndex + 1}个功能</span>
                  <button class="remove-button" @click=${() => this._removeButtonRowItem(rowIndex, itemIndex)} title="移除此功能" style="margin: 0; padding: 2px 6px;">
                    <ha-icon icon="mdi:close"></ha-icon>
                  </button>
                </div>
                <div style="display: flex; gap: 8px; align-items: center; margin-bottom: 4px;">
                  <label style="font-size: 0.8em; min-width: 60px;">显示方式</label>
                  <select
                    @change=${(e) => this._buttonRowModeChanged(rowIndex, itemIndex, e.target.value)}
                    .value=${item.mode || 'button'}
                    style="flex: 1; padding: 4px 0; border: 1px solid #555; border-radius: 4px; background: var(--card-background-color, #1c1c1c); color: var(--primary-text-color, #fff);"
                  >
                    <option value="button">按钮</option>
                    <option value="slider">数值调节</option>
                  </select>
                </div>
                <div style="display: flex; gap: 8px; align-items: center; margin-bottom: 4px;">
                  <label style="font-size: 0.8em; min-width: 60px;">功能实体</label>
                  <div class="entity-selector" style="flex: 1;">
                    <input
                      type="text"
                      @input=${(e) => this._onButtonRowSearch(e, rowIndex, itemIndex)}
                      @focus=${(e) => this._onButtonRowSearch(e, rowIndex, itemIndex)}
                      .value=${this._buttonRowSearchTerms?.[`${rowIndex}-${itemIndex}`] || item.entity || ''}
                      placeholder="搜索实体..."
                      class="entity-search-input"
                    />
                    ${this._showButtonRowLists?.[`${rowIndex}-${itemIndex}`] ? html`
                      <div class="entity-dropdown">
                        ${this._filteredButtonRowEntities?.[`${rowIndex}-${itemIndex}`]?.map(entity => html`
                          <div
                            class="entity-option ${item.entity === entity.entity_id ? 'selected' : ''}"
                            @click=${() => this._selectButtonRowEntity(entity.entity_id, rowIndex, itemIndex)}
                          >
                            <div class="entity-info">
                              <ha-icon icon="${entity.attributes.icon || 'mdi:help-circle'}"></ha-icon>
                              <div class="entity-details">
                                <div class="entity-name">${entity.attributes.friendly_name || entity.entity_id}</div>
                                <div class="entity-id">${entity.entity_id}</div>
                              </div>
                            </div>
                            ${item.entity === entity.entity_id ?
                              html`<ha-icon icon="mdi:check" class="check-icon"></ha-icon>` : ''}
                          </div>
                        `)}
                        ${this._filteredButtonRowEntities?.[`${rowIndex}-${itemIndex}`]?.length === 0 ? html`
                          <div class="no-results">未找到匹配的实体</div>
                        ` : ''}
                      </div>
                    ` : ''}
                  </div>
                </div>
                ${itemDomain === 'select' || itemDomain === 'input_select' ? html`
                <div style="display: flex; gap: 8px; align-items: center; margin-bottom: 4px;">
                  <label style="font-size: 0.8em; min-width: 60px;">筛选选项</label>
                  <input
                    type="text"
                    .value=${(item.select_options || []).join(',')}
                    @change=${(e) => this._buttonRowSelectOptionsChanged(rowIndex, itemIndex, e.target.value)}
                    placeholder="留空显示全部，逗号分隔"
                    style="flex: 1; padding: 4px 0; border: 1px solid #555; border-radius: 4px; background: var(--card-background-color, #1c1c1c); color: var(--primary-text-color, #fff);"
                  />
                </div>
                ` : ''}
                ${itemDomain === 'text' || itemDomain === 'input_text' ? html`
                <div style="display: flex; gap: 8px; align-items: center; margin-bottom: 4px;">
                  <label style="font-size: 0.8em; min-width: 60px;">自定义名称</label>
                  <input
                    type="text"
                    .value=${item.custom_name || ''}
                    @change=${(e) => this._buttonRowFieldChanged(rowIndex, itemIndex, 'custom_name', e.target.value)}
                    placeholder="留空使用实体名"
                    style="flex: 1; padding: 4px 0; border: 1px solid #555; border-radius: 4px; background: var(--card-background-color, #1c1c1c); color: var(--primary-text-color, #fff);"
                  />
                </div>
                <div style="display: flex; gap: 8px; align-items: center; margin-bottom: 4px;">
                  <label style="font-size: 0.8em; min-width: 60px;">自定义指令</label>
                  <input
                    type="text"
                    .value=${item.custom_command || ''}
                    @change=${(e) => this._buttonRowFieldChanged(rowIndex, itemIndex, 'custom_command', e.target.value)}
                    placeholder="点击时执行的值"
                    style="flex: 1; padding: 4px 0; border: 1px solid #555; border-radius: 4px; background: var(--card-background-color, #1c1c1c); color: var(--primary-text-color, #fff);"
                  />
                </div>
                ` : ''}
              </div>
            `})}
            <div class="buttons-row">
              <mwc-button
                class="add-button"
                @click=${() => this._addButtonRowItem(rowIndex)}
                outlined
              >
                增加第${(row.items || []).length + 1}个功能
              </mwc-button>
            </div>
          </div>
        `)}
        <div class="form-group">
          <div class="buttons-row">
            <mwc-button
              class="add-button"
              @click=${this._addButtonRow}
              outlined
            >
              增加第${this._getButtonRows().length + 1}排按钮
            </mwc-button>
          </div>
        </div>

        <!-- 附加按钮1 -->
        <div class="form-group">
          <label>附加按钮1 (最多7个)</label>
          ${(this.config.buttons || []).map((buttonEntity, index) => html`
            <div class="entity-selector-with-remove">
              <div class="entity-selector">
                <input
                  type="text"
                  @input=${(e) => this._onButtonSearch(e, index)}
                  @focus=${(e) => this._onButtonSearch(e, index)}
                  .value=${this._buttonSearchTerms?.[index] || buttonEntity || ''}
                  placeholder="搜索实体..."
                  class="entity-search-input"
                />
                ${this._showButtonLists?.[index] ? html`
                  <div class="entity-dropdown">
                    ${this._filteredButtonEntities?.[index]?.map(entity => html`
                      <div
                        class="entity-option ${buttonEntity === entity.entity_id ? 'selected' : ''}"
                        @click=${() => this._selectButtonEntity(entity.entity_id, index)}
                      >
                        <div class="entity-info">
                          <ha-icon icon="${entity.attributes.icon || 'mdi:help-circle'}"></ha-icon>
                          <div class="entity-details">
                            <div class="entity-name">${entity.attributes.friendly_name || entity.entity_id}</div>
                            <div class="entity-id">${entity.entity_id}</div>
                          </div>
                        </div>
                        ${buttonEntity === entity.entity_id ?
                          html`<ha-icon icon="mdi:check" class="check-icon"></ha-icon>` : ''}
                      </div>
                    `)}
                    ${this._filteredButtonEntities?.[index]?.length === 0 ? html`
                      <div class="no-results">未找到匹配的实体</div>
                    ` : ''}
                  </div>
                ` : ''}
              </div>
              <button class="remove-button" @click=${() => this._removeButton(index)} title="移除">
                <ha-icon icon="mdi:close"></ha-icon>
              </button>
            </div>
          `)}
          <div class="buttons-row">
            <mwc-button
              class="add-button"
              @click=${this._addButton}
              outlined
            >
              添加按钮1
            </mwc-button>
          </div>
          <div class="help-text">第一排附加按钮，最多支持7个</div>
        </div>

        <!-- 附加按钮2 -->
        <div class="form-group">
          <label>附加按钮2 (最多7个)</label>
          ${(this.config.buttons2 || []).map((buttonEntity, index) => html`
            <div class="entity-selector-with-remove">
              <div class="entity-selector">
                <input
                  type="text"
                  @input=${(e) => this._onButton2Search(e, index)}
                  @focus=${(e) => this._onButton2Search(e, index)}
                  .value=${this._button2SearchTerms?.[index] || buttonEntity || ''}
                  placeholder="搜索实体..."
                  class="entity-search-input"
                />
                ${this._showButton2Lists?.[index] ? html`
                  <div class="entity-dropdown">
                    ${this._filteredButton2Entities?.[index]?.map(entity => html`
                      <div
                        class="entity-option ${buttonEntity === entity.entity_id ? 'selected' : ''}"
                        @click=${() => this._selectButton2Entity(entity.entity_id, index)}
                      >
                        <div class="entity-info">
                          <ha-icon icon="${entity.attributes.icon || 'mdi:help-circle'}"></ha-icon>
                          <div class="entity-details">
                            <div class="entity-name">${entity.attributes.friendly_name || entity.entity_id}</div>
                            <div class="entity-id">${entity.entity_id}</div>
                          </div>
                        </div>
                        ${buttonEntity === entity.entity_id ?
                          html`<ha-icon icon="mdi:check" class="check-icon"></ha-icon>` : ''}
                      </div>
                    `)}
                    ${this._filteredButton2Entities?.[index]?.length === 0 ? html`
                      <div class="no-results">未找到匹配的实体</div>
                    ` : ''}
                  </div>
                ` : ''}
              </div>
              <button class="remove-button" @click=${() => this._removeButton2(index)} title="移除">
                <ha-icon icon="mdi:close"></ha-icon>
              </button>
            </div>
          `)}
          <div class="buttons-row">
            <mwc-button
              class="add-button"
              @click=${this._addButton2}
              outlined
            >
              添加按钮2
            </mwc-button>
          </div>
          <div class="help-text">第二排附加按钮，最多支持7个</div>
        </div>


      </div>
    `;
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

  _widthChanged(e) {
    if (!this.config) return;
    const { name, value } = e.target;

    let finalValue = value;

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
    this._buttonRowSearchTerms = {};
    this._filteredButtonRowEntities = {};
    this._showButtonRowLists = {};
  }
}
customElements.define('xiaoshi-phone-other-card-editor', XiaoshiPhoneOtherCardEditor);

class XiaoshiPhoneOtherCard extends LitElement {
  static get properties() { 
    return {
      hass: { type: Object },
      width: { type: String, attribute: true },
      config: { type: Object },
      button_rows: { type: Array },
      buttons: { type: Array },
      buttons2: { type: Array },
      theme: { type: String },
      _timerInterval: { state: true },

      temperatureData: { type: Array },
      _externalTempSensor: { type: String } 
    };
  }
  static getConfigElement() {
    return document.createElement("xiaoshi-phone-other-card-editor");
  }

  static getStubConfig() {
    return {
      entity: "",
      temperature: "",
      timer: "",
      theme: "system",
      button_rows: [],
      buttons: [],
      buttons2: [],
      width: "100%"
    };
  }

  setConfig(config) {
    this.config = config;
    this.button_rows = config.button_rows || [];
    this.buttons = config.buttons || [];
    this.buttons2 = config.buttons2 || [];
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
            "icon br1 br1"
            "icon spacer1 spacer1"
            "icon br2 br2"
            "icon spacer2 spacer2"
            "icon br3 br3"
            "icon br4 br4"
            "icon timer timer"
            "icon extra extra"
            "icon extra2 extra2"
            "a a a"; 
        grid-template-columns: 25% 60% 13%;
      }

      .active-gradient {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: var(--linear-color);
        opacity: 0.4;
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
        color: var(--button);
        width: 24px;
        height: 24px;
        border-radius: 5px;
        cursor: default;
      }

      .temp-display {
        font-size: 12px;
        min-width: 35px;
        text-align: center;
        color: var(--button);
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

      .icon-area {
        grid-area: icon;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
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

      .timer-area, .extra-area, .extra2-area {
        display: flex;
        gap: 5px;
        width: 100%;
        height: 25px;
        margin-bottom: 5px;
      }
      
      .timer-area {
        grid-area: timer;
        display: grid;
        grid-template-columns: repeat(8, 1fr);
        gap: 5px;
      }

      .button-row-area {
        display: grid;
        gap: 5px;
      }
      
      .func-button {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        background-color: var(--button-bg);
        color: var(--button-fg);
        border: none;
        border-radius: 8px;
        cursor: default;
        min-width: 0;
        overflow: hidden;
        padding: 2px 0;
        height: 25px;
        min-height: unset;
      }

      .func-button-icon {
        --mdc-icon-size: 16px;
        height: 16px;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .func-button-text {
        font-size: 10px;
        line-height: 1.2;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        max-width: 100%;
      }

      .func-button-value {
        font-size: 11px;
        font-weight: bold;
        line-height: 1.2;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        max-width: 100%;
      }

      .select-options-row {
        display: flex;
        gap: 3px;
        width: 100%;
      }

      .select-option-btn {
        flex: 1;
        padding: 2px 4px;
        border: none;
        border-radius: 5px;
        font-size: 9px;
        line-height: 1.2;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        cursor: pointer;
        background: rgba(255,255,255,0.1);
        color: var(--button-fg);
        text-align: center;
        min-width: 0;
      }

      .select-option-btn.active-option {
        color: var(--button-bg);
        font-weight: bold;
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
        cursor: default;
        min-width: 0;
        overflow: visible;
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

      .active-extra {
        color: var(--active-color) !important;
        background-color: var(--active-color) !important;
      }

      .select-active {
        color: var(--select-active-color, rgba(255, 100, 100)) !important;
      }
  `;
  }

  constructor() {
    super();
    this.hass = {};
    this.config = {};
    this.button_rows = [];
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
              // 优先检测 HA 主题暗色模式
              if (this.hass && this.hass.themes && this.hass.themes.darkMode !== undefined) {
                  return this.hass.themes.darkMode ? 'dark' : 'light';
              }
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
    
    while (container.firstChild) {
        container.removeChild(container.firstChild);
    }
    
    this.canvas = document.createElement('canvas');
    this.canvas.className = 'temperature-chart';
    container.appendChild(this.canvas);
    
    const scale = window.devicePixelRatio || 1;
    const width = container.clientWidth;
    const height = container.clientHeight;
    
    this.canvas.style.width = `${width}px`;
    this.canvas.style.height = `${height}px`;
    
    this.canvas.width = Math.floor(width * scale);
    this.canvas.height = Math.floor(height * scale);
    
    this.ctx = this.canvas.getContext('2d');
    this.ctx.scale(scale, scale);
    
    await this.updateComplete;
  }

  drawSmoothCurve() {
    if (!this.ctx || !this.temperatureData || this.temperatureData.length === 0) return;
    
    const entity = this.hass.states[this.config.entity];
    const state = entity?.state || 'off';
    const theme = this._evaluateTheme();
    
    let statusColor = theme === 'light' ? '#888888' : '#aaaaaa';
    if (state !== 'off' && state !== 'unavailable' && state !== 'unknown') {
        statusColor = theme === 'light' ? '#4CAF50' : '#66BB6A';
    }
    
    const canvas = this.canvas;
    const ctx = this.ctx;
    const scale = window.devicePixelRatio || 1;
    const width = canvas.width / scale;
    const height = canvas.height / scale;
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    const minTemp = Math.min(...this.temperatureData) - 1;
    const maxTemp = Math.max(...this.temperatureData);
    const tempRange = Math.max(maxTemp - minTemp, 0.1);
    const xStep = width / (this.temperatureData.length - 1);
    
    const points = this.temperatureData.map((temp, i) => {
        return {
            x: i * xStep,
            y: height - ((temp - minTemp) / tempRange) * height,
            value: temp
        };
    });
    
    ctx.beginPath();
    this.drawMonotonicSpline(ctx, points);
    ctx.lineTo(points[points.length-1].x, height);
    ctx.lineTo(points[0].x, height);
    ctx.closePath();
    
    const gradient = ctx.createLinearGradient(0, 0, 0, height);
    gradient.addColorStop(0, `${statusColor}60`);
    gradient.addColorStop(1, `${statusColor}20`);
    ctx.fillStyle = gradient;
    ctx.fill();
    
    ctx.beginPath();
    this.drawMonotonicSpline(ctx, points);
    ctx.strokeStyle = statusColor;
    ctx.lineWidth = 1;
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
    let marginBottom = '4px';

    const attrs = entity.attributes;
    
    const theme = this._evaluateTheme();
    const fgColor = theme === 'light' ? 'rgb(0, 0, 0)' : 'rgb(255, 255, 255)';
    const iconColor = theme === 'light' ? 'rgb(0, 0, 0)' : 'rgb(255, 255, 255)';
    const bgColor = theme === 'light' ? 'rgb(255, 255, 255)' : 'rgb(50, 50, 50)';
    const buttonBg = theme === 'light' ? 'rgb(50,50,50)' : 'rgb(120,120,120)';
    const buttonFg = 'rgb(250,250,250)';

    let statusColor = 'rgb(250,250,250)';
    let linearColor = 'rgb(0,0,0,0)';

    // 卡片级强调颜色
    const cardAccentRaw = this.config.accent_color || '';
    const cardAccentColor = cardAccentRaw ? this._evalTemplate(cardAccentRaw) : '';
    if (cardAccentColor && isOn) {
      statusColor = cardAccentColor;
      linearColor = cardAccentColor;
    }

    const stateTranslations = {
        'off': '关闭',
        'unknown': '未知',
        'unavailable': '离线'
    };
    const translatedState = stateTranslations[state] || state;
    const stateDisplayValue = this.config.state_display ? this._evalTemplate(this.config.state_display) : translatedState;

    const hasTimer = this.config.timer;
    const timerEntity = hasTimer ? this.hass.states[this.config.timer] : null;
    const buttonRows = this.button_rows || [];
    const hasExtra = this.buttons && this.buttons.length > 0;
    const hasExtra2 = this.buttons2 && this.buttons2.length > 0;
    
    // 构建动态 grid-template-rows
    const br1HasItems = (buttonRows[0] && buttonRows[0].items && buttonRows[0].items.length > 0);
    const br2HasItems = (buttonRows[1] && buttonRows[1].items && buttonRows[1].items.length > 0);
    const gridTemplateRows = [
        'auto',
        br1HasItems ? 'auto' : '0',
        br1HasItems ? '10px' : '0',
        br2HasItems ? 'auto' : '0',
        br2HasItems ? '10px' : '0',
        (buttonRows[2] && buttonRows[2].items && buttonRows[2].items.length > 0) ? 'auto' : '0',
        (buttonRows[3] && buttonRows[3].items && buttonRows[3].items.length > 0) ? 'auto' : '0',
        hasTimer ? 'auto' : '0',
        hasExtra ? 'auto' : '0',
        hasExtra2 ? 'auto' : '0',
        '4px'
    ].join(' ');

    const entityIcon = attrs.icon || 'mdi:devices';

    return html` 
      <div class="card" style=" margin-bottom: ${marginBottom};
                                width: ${this.width};
                                background: ${isOn ? bgColor : fgColor}; 
                                color: ${fgColor}; 
                                --button-bg: ${buttonBg}; 
                                --button-fg: ${buttonFg}; 
                                --active-color: ${cardAccentColor || statusColor};
                                --select-active-color: ${cardAccentColor || 'rgba(255, 100, 100, 0.35)'};
                                --linear-color: ${linearColor};">
                                                                
        ${isOn ? html`<div class="active-gradient"></div>` : ''}
        <div id="chart-container"></div>
        <div class="content-container" style="grid-template-rows: ${gridTemplateRows};">
            <div class="name-area">${attrs.friendly_name}</div>
                <div class="status-area" style="color: ${fgColor}">${stateDisplayValue}
                    
                </div>
                    <div class="power-area">
                        <button class="power-button" @click=${this._togglePower}>
                            <ha-icon 
                                class="power-icon"
                                icon="${isOn ? 'mdi:toggle-switch' : 'mdi:toggle-switch-off'}"
                                style="color: ${iconColor};"
                            ></ha-icon>
                        </button>
                    </div>
                      
                    <div class="icon-area">
                        <div class="main-icon-container">
                            <ha-icon 
                                class="main-icon" 
                                icon="${entityIcon}"
                                style="color: ${iconColor};"
                            ></ha-icon>
                        </div>
                    </div>

          ${hasTimer ? html`
              <div class="timer-area">
                  ${this._renderTimerControls(timerEntity)}
              </div>
          ` : ''}

          ${[0,1,2,3].map(rowIndex => {
            const row = buttonRows[rowIndex];
            const items = (row && row.items) ? row.items.filter(item => item.entity) : [];
            // 计算实际按钮数量（select选项展开为独立按钮）
            let totalButtons = 0;
            items.forEach(item => {
                const domain = item.entity.split('.')[0];
                if (domain === 'select' || domain === 'input_select') {
                    const entity = this.hass.states[item.entity];
                    if (entity) {
                        const allOptions = entity.attributes.options || [];
                        const filtered = (item.select_options && item.select_options.length > 0)
                            ? allOptions.filter(opt => item.select_options.includes(opt))
                            : allOptions;
                        totalButtons += Math.min(filtered.length, 5);
                    }
                } else {
                    totalButtons += 1;
                }
            });
            const gridCols = Math.max(totalButtons, 1);
            return html`
              <div class="button-row-area" style="grid-area: br${rowIndex + 1}; grid-template-columns: repeat(${gridCols}, 1fr);">
                  ${items.length > 0 ? this._renderButtonRowItems(rowIndex) : ''}
              </div>
              ${rowIndex < 2 && items.length > 0 ? html`<div style="grid-area: spacer${rowIndex + 1};"></div>` : ''}
            `;
          })}

          ${hasExtra ? html`
              <div class="extra-area" style="grid-template-columns: repeat(${Math.min(this.buttons.length, 7) <= 5 ? 5 : Math.min(this.buttons.length, 7)}, 1fr);">
                  ${this._renderExtraButtons(this.buttons)}
              </div>
          ` : ''}

          ${hasExtra2 ? html`
              <div class="extra2-area" style="grid-template-columns: repeat(${Math.min(this.buttons2.length, 7) <= 5 ? 5 : Math.min(this.buttons2.length, 7)}, 1fr);">
                  ${this._renderExtraButtons(this.buttons2)}
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

    const mainEntity = this.hass.states[this.config.entity];
    const mainState = mainEntity ? mainEntity.state : 'off';
    
    let activeColor = 'rgb(255,255,255)';
    const now = new Date();
    const finishesAt = new Date(timerEntity.attributes.finishes_at || 0);
    let remainingSeconds = Math.max(0, Math.floor((finishesAt - now) / 1000));
  
    const state = timerEntity.state;
    if (state !== 'active') {
        remainingSeconds = 0;
    } else if (remainingSeconds <= 0) {
        this._turnOffEntity();
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

  _renderButtonRowItems(rowIndex) {
    const row = (this.button_rows || [])[rowIndex];
    if (!row || !row.items || row.items.length === 0) return html``;

    const theme = this._evaluateTheme();
    const fgColor = theme === 'light' ? 'rgb(0, 0, 0)' : 'rgb(255, 255, 255)';
    const buttonBg = theme === 'light' ? 'rgb(50,50,50)' : 'rgb(120,120,120)';
    const buttonFg = 'rgb(250,250,250)';
    let activeColor = theme === 'light' ? 'rgba(255, 80, 80)' : 'rgba(220, 80, 80)';
    const cardAccentRaw = this.config.accent_color || '';
    const cardAccentColor = cardAccentRaw ? this._evalTemplate(cardAccentRaw) : '';
    if (cardAccentColor) activeColor = cardAccentColor;

    const itemsToShow = row.items.filter(item => item.entity).slice(0, 7);

    // 将所有item展开为独立的渲染单元（select的每个选项展开为一个按钮）
    const renderUnits = [];
    itemsToShow.forEach(item => {
        const buttonEntityId = item.entity;
        const entity = this.hass.states[buttonEntityId];
        if (!entity) return;
        const domain = buttonEntityId.split('.')[0];

        if ((domain === 'select' || domain === 'input_select') && item.mode !== 'slider') {
            const allOptions = entity.attributes.options || [];
            const filteredOptions = (item.select_options && item.select_options.length > 0)
                ? allOptions.filter(opt => item.select_options.includes(opt))
                : allOptions;
            filteredOptions.slice(0, 5).forEach(opt => {
                renderUnits.push({ item, entity, domain, selectOption: opt });
            });
        } else {
            renderUnits.push({ item, entity, domain, selectOption: null });
        }
    });

    return renderUnits.map(unit => {
        const { item, entity, domain, selectOption } = unit;
        const buttonEntityId = item.entity;
        const friendlyName = entity.attributes.friendly_name || '';
        const displayName = friendlyName.slice(0, 4);
        const displayValueColor = entity.state === '低' ? 'red' : fgColor;
        const mode = item.mode || 'button';

        // 数值调节模式
        if (mode === 'slider') {
            const min = entity.attributes.min ?? 0;
            const max = entity.attributes.max ?? 100;
            const step = entity.attributes.step ?? 1;
            const currentVal = parseFloat(entity.state) || 0;
            const unit = entity.attributes.unit_of_measurement || '';
            const sliderDomain = domain;
            
            return html`
                <div class="func-button" style="cursor: default; display: flex; flex-direction: column; justify-content: space-between;">
                    <div style="color: ${buttonFg}; font-size: 9px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${displayName}：${currentVal}${unit}</div>
                    <input type="range" 
                        min="${min}" max="${max}" step="${step}" 
                        .value=${currentVal}
                        @change=${(e) => {
                            const val = parseFloat(e.target.value);
                            if (sliderDomain === 'number' || sliderDomain === 'input_number') {
                                this._callService(sliderDomain, 'set_value', { entity_id: buttonEntityId, value: val });
                            } else if (sliderDomain === 'select') {
                                this._callService('select', 'select_option', { entity_id: buttonEntityId, option: val });
                            } else if (sliderDomain === 'climate') {
                                this._callService('climate', 'set_temperature', { entity_id: buttonEntityId, temperature: val });
                            } else if (sliderDomain === 'fan') {
                                this._callService('fan', 'set_percentage', { entity_id: buttonEntityId, percentage: val });
                            } else if (sliderDomain === 'cover') {
                                this._callService('cover', 'set_cover_position', { entity_id: buttonEntityId, position: val });
                            } else if (sliderDomain === 'light') {
                                this._callService('light', 'turn_on', { entity_id: buttonEntityId, brightness_pct: val });
                            }
                            this._handleClick();
                        }}
                        style="width: 90%; margin: auto auto 5px; height: 4px; accent-color: ${activeColor}; --slider-color: ${activeColor};"
                    />
                </div>
            `;
        }

        // 按钮模式 - 根据域类型渲染
        if (domain === 'switch' || domain === 'light') {
            const isActive = entity.state === 'on';
            const icon = isActive ? 'mdi:toggle-switch' : 'mdi:toggle-switch-off';
            const btnBg = isActive ? activeColor : buttonBg;
            const btnFg = isActive ? activeColor : buttonFg;
            
            return html`
                <button 
                    class="func-button ${isActive ? 'active-extra' : ''}" 
                    style="background-color: ${btnBg}; ${isActive ? 'opacity: 0.85;' : ''}"
                    @click=${() => this._handleExtraButtonClick(buttonEntityId, domain)}
                    title="${friendlyName}"
                >
                    <ha-icon class="func-button-icon" icon="${icon}" style="color: ${btnFg}"></ha-icon>
                    <div class="func-button-text" style="color: ${btnFg}">${displayName}</div>
                </button>
            `;
        }
                
        if (domain === 'sensor') {
            const unit = entity.attributes.unit_of_measurement || '';
            const sensorValue = `${entity.state}${unit}`;
            
            return html`
                <button class="func-button" disabled style="cursor: default;">
                    <div class="func-button-value" style="color: ${displayValueColor}; font-size: 13px;">${sensorValue}</div>
                </button>
            `;
        }
                
        if (domain === 'button' || domain === 'input_button') {
            return html`
                <button class="func-button" 
                        @click=${() => this._handleExtraButtonClick(buttonEntityId, domain)}
                        title="${friendlyName}">
                    <div class="func-button-value">${friendlyName}</div>
                </button>
            `;
        }
            
        if (domain === 'select' || domain === 'input_select') {
            const isActive = selectOption === entity.state;
            const btnBg = isActive ? buttonBg : buttonBg;
            const btnFg = isActive ? activeColor : buttonFg;
            return html`
                <button class="func-button ${isActive ? 'select-active' : ''}"
                    style="background-color: ${btnBg};"
                    @click=${() => this._callService(domain, 'select_option', { entity_id: buttonEntityId, option: selectOption })}
                    title="${selectOption}"
                >
                    <div class="func-button-value" style="color: ${btnFg}">${selectOption}</div>
                </button>
            `;
        }

        if (domain === 'text' || domain === 'input_text') {
            const customName = item.custom_name || friendlyName;
            const customCommand = item.custom_command || '';
            
            return html`
                <button class="func-button" 
                        @click=${() => {
                            if (customCommand) {
                                const evaluatedCommand = this._evalTemplate(customCommand);
                                this._callService(domain, 'set_value', { entity_id: buttonEntityId, value: evaluatedCommand });
                            }
                        }}
                        title="${customName}${customCommand ? ' → ' + customCommand : ''}">
                    <div class="func-button-value">${customName}</div>
                </button>
            `;
        }

        return html``;
    });
  }

  _renderExtraButtons(buttonsList) {
      if (!buttonsList || buttonsList.length === 0) return html``;

      const buttonsToShow = buttonsList.slice(0, 7);

      const theme = this._evaluateTheme();
      const fgColor = theme === 'light' ? 'rgb(0, 0, 0)' : 'rgb(255, 255, 255)';
      const buttonBg = theme === 'light' ? 'rgb(50,50,50)' : 'rgb(120,120,120)';
      const buttonFg = 'rgb(250,250,250)';
      let activeColor = theme === 'light' ? 'rgba(00, 80, 80)' : 'rgba(180, 230, 230)';
      const cardAccentRaw = this.config.accent_color || '';
      const cardAccentColor = cardAccentRaw ? this._evalTemplate(cardAccentRaw) : '';
      if (cardAccentColor) activeColor = cardAccentColor;

      return buttonsToShow.map(buttonEntityId => {
          const entity = this.hass.states[buttonEntityId];
          if (!entity) return html``;
          
          const domain = buttonEntityId.split('.')[0];
          const friendlyName = entity.attributes.friendly_name || '';
          const displayName = friendlyName.slice(0, 4);
          let displayValue = entity.state.slice(0, 4);
          const displayValueColor = displayValue === '低' ? 'red' : fgColor;
                  
          if (domain === 'switch' || domain === 'light') {
              const isActive = entity.state === 'on';
              const icon = isActive ? 'mdi:toggle-switch' : 'mdi:toggle-switch-off';
              const btnFg = isActive ? activeColor : buttonFg;
              
              return html`
                  <button 
                      class="extra-button ${isActive ? 'active-extra' : ''}" 
                      @click=${() => this._handleExtraButtonClick(buttonEntityId, domain)}
                      style="color: ${btnFg}"
                      title="${friendlyName}"
                  >
                      <div class="extra-button-content">
                          <ha-icon class="extra-button-icon" icon="${icon}" style="color: ${btnFg}"></ha-icon>
                          <div class="extra-button-text" style="color: ${btnFg}">${displayName}</div>
                      </div>
                  </button>
              `;
          }
                  
          if (domain === 'sensor') {
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
          }
                  
          if (domain === 'button' || domain === 'input_button') {
              const buttonIcon = 'mdi:button-pointer';
              return html`
                  <button class="extra-button" 
                          @click=${() => this._handleExtraButtonClick(buttonEntityId, domain)}
                          style="color: ${buttonFg}">
                      <div class="extra-button-content">
                          <ha-icon class="extra-button-icon" icon="${buttonIcon}" style="--mdc-icon-size: 14px; color: ${buttonFg}"></ha-icon>
                          <div class="extra-button-text">${displayName}</div>
                      </div>
                  </button>
              `;
          }
              
          if (domain === 'select' || domain === 'input_select') {
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
          }

          return html``;
      });
  }
    
  _handleExtraButtonClick(entityId, domain) {
        const entity = this.hass.states[entityId];
        if (!entity) return;
        
        if (domain === 'switch' || domain === 'light') {
            const service = entity.state === 'on' ? 'turn_off' : 'turn_on';
            this._callService(domain, service, { entity_id: entityId });
        } else if (domain === 'button' || domain === 'input_button') {
            this._callService(domain, 'press', { entity_id: entityId });
        } else if (domain === 'select' || domain === 'input_select') {
            this._callService(domain, 'select_next', { entity_id: entityId });
        }
        
        this._handleClick();
  }

  _getEntityDomain() {
    if (!this.config.entity) return null;
    return this.config.entity.split('.')[0];
  }

  _turnOffEntity() {
    if (!this.config.entity) return;
    const domain = this._getEntityDomain();
    if (domain) {
        this._callService(domain, 'turn_off', {
            entity_id: this.config.entity
        });
    }
    this._handleClick();
  }

  _togglePower() {
      const entity = this.hass.states[this.config.entity];
      if (!entity) return;
      
      const domain = this._getEntityDomain();
      if (!domain) return;
      
      if (entity.state === 'off') {
          this._callService(domain, 'turn_on', {
              entity_id: this.config.entity
          });
          this._handleClick();
      } else {
          this._callService(domain, 'turn_off', {
              entity_id: this.config.entity
          });
          this._cancelTimer();
          this._handleClick();
      }
  }

  _adjustTemperature(direction) {
    if (!this.config.entity) return;
    const entity = this.hass.states[this.config.entity];
    if (!entity) return;
    
    const attrs = entity.attributes;
    if (typeof attrs.temperature !== 'number') return;
    
    const domain = this._getEntityDomain();
    const step = attrs.target_temp_step || attrs.min_temp && attrs.max_temp ? 0.5 : 1;
    const newTemp = direction === 'up' ? attrs.temperature + step : attrs.temperature - step;
    const minTemp = attrs.min_temp || 0;
    const maxTemp = attrs.max_temp || 100;
    
    if (newTemp < minTemp || newTemp > maxTemp) return;
    
    if (domain === 'climate') {
        this._callService('climate', 'set_temperature', {
            entity_id: this.config.entity,
            temperature: newTemp
        });
    } else if (domain === 'water_heater') {
        this._callService('water_heater', 'set_temperature', {
            entity_id: this.config.entity,
            temperature: newTemp
        });
    }
  }

  _evalTemplate(str) {
      if (!str || typeof str !== 'string') return str;
      return str.replace(/\[\[\[([\s\S]*?)\]\]\]/g, (match, expr) => {
          try {
              const trimmed = expr.trim();
              const fnBody = /\breturn\b/.test(trimmed) ? trimmed : `return ${trimmed}`;
              return new Function('entity', 'hass', 'states', fnBody)(
                  this.hass.states[this.config.entity],
                  this.hass,
                  this.hass.states
              );
          } catch (e) {
              return match;
          }
      });
  }

  _callService(domain, service, data) {
      this.hass.callService(domain, service, data);
      this._handleClick();
  }
} 
customElements.define('xiaoshi-phone-other-card', XiaoshiPhoneOtherCard);
