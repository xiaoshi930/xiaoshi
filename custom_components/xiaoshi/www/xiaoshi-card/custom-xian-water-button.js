import { LitElement, html, css } from "https://unpkg.com/lit-element@2.4.0/lit-element.js?module";

window.customCards = window.customCards || [];
window.customCards.push(
  {
    type: 'xiaoshi-xian-water-button',
    name: '西安水费按钮',
    description: '显示水费余额按钮，点击弹出水费详情卡片',
    preview: true
  }
);

class XiaoshiXianWaterButtonEditor extends LitElement {
  static get properties() {
    return {
      hass: { type: Object },
      config: { type: Object },
      _searchTerm: { type: String },
      _filteredEntities: { type: Array },
      _showEntityList: { type: Boolean }
    };
  }

  static get styles() {
    return css`
      .form { display: flex; flex-direction: column; gap: 10px; min-height: 500px; }
      .form-group { display: flex; flex-direction: column; gap: 5px; }
      label { font-weight: bold; }
      select, input, textarea { padding: 8px; border: 1px solid #ddd; border-radius: 4px; }
      textarea { min-height: 80px; resize: vertical; }
      .help-text { font-size: 0.85em; color: #666; margin-top: 4px; }
      .entity-selector { position: relative; }
      .entity-search-input { width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px; box-sizing: border-box; }
      .entity-dropdown { position: absolute; top: 100%; left: 0; right: 0; height: 300px; overflow-y: auto; background: white; border: 1px solid #ddd; border-radius: 4px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); z-index: 1000; margin-top: 2px; }
      .entity-option { display: flex; align-items: center; justify-content: space-between; padding: 8px 12px; cursor: pointer; border-bottom: 1px solid #eee; }
      .entity-option:hover { background: #f5f5f5; }
      .entity-option.selected { background: #e3f2fd; }
      .entity-info { display: flex; align-items: center; gap: 8px; flex: 1; justify-content: space-between; }
      .entity-details { flex: 1; }
      .entity-name { font-weight: 500; font-size: 14px; color: #000; }
      .entity-id { font-size: 12px; color: #000; font-family: monospace; }
      .check-icon { color: #2196F3; }
      .no-results { padding: 12px; text-align: center; color: #666; font-style: italic; }
      .selected-entities { margin-top: 8px; }
      .selected-label { font-size: 12px; font-weight: bold; margin-bottom: 4px; color: #333; }
      .selected-entity-config { margin-bottom: 8px; border: 1px solid #ddd; border-radius: 4px; padding: 8px; background: #f9f9f9; }
      .selected-entity { display: flex; align-items: center; gap: 4px; margin-bottom: 8px; font-size: 12px; color: #000; justify-content: space-between; }
      .attribute-config { margin-top: 4px; display: flex; flex-direction: column; gap: 4px; }
      .override-config { display: flex; align-items: center; gap: 4px; margin-top: 2px; }
      .override-checkbox { margin-right: 4px; }
      .override-input { flex: 1; padding: 2px 6px; border: 1px solid #ddd; border-radius: 3px; font-size: 11px; box-sizing: border-box; }
      .override-label { font-size: 11px; color: #666; white-space: nowrap; }
      .remove-btn { background: none; border: none; cursor: pointer; padding: 0; display: flex; align-items: center; color: #666; margin-left: auto; }
      .remove-btn:hover { color: rgb(255, 0, 0); }
      .checkbox-group { display: flex; align-items: center; gap: 6px; }
      .checkbox-label { display: flex; align-items: center; gap: 8px; font-size: 14px; cursor: pointer; }
      .color-input-wrapper { display: flex; gap: 3px; align-items: center; }
      .color-input { width: 70px; height: 36px; border: 1px solid #ddd; border-radius: 4px; cursor: pointer; }
      .color-text { flex: 1; height: 22px; }
      .color-text { flex: 1; height: 22px; }
    `;
  }

  render() {
    if (!this.hass) return html``;
    return html`
      <div class="form">
        <div class="form-group">
          <label>多实体显示模式</label>
          <select @change=${this._entityChanged} .value=${this.config.display_mode || 'first_entity'} name="display_mode">
            <option value="sum">合计</option>
            <option value="min">最小值</option>
            <option value="max">最大值</option>
            <option value="average">平均值</option>
            <option value="first_entity">首个实体（默认）</option>
          </select>
        </div>

        <div class="form-group">
          <label>小数点精度：控制显示的小数位数，默认1位</label>
          <input type="number" @change=${this._entityChanged} .value=${this.config.decimal_precision !== undefined ? this.config.decimal_precision : '1'} name="decimal_precision" placeholder="默认1" min="0" max="10" step="1" />
        </div>

        <div class="checkbox-group">
          <input type="checkbox" @change=${this._entityChanged} .checked=${this.config.tablet_mode === true} name="tablet_mode" id="tablet_mode" />
          <label for="tablet_mode" class="checkbox-label">平板端特性（透明背景、白色文字、显示水费余额和预计天数）</label>
        </div>

        <div class="form-group">
          <label>按钮宽度：默认16.8vw</label>
          <input type="text" @change=${this._entityChanged} .value=${this.config.button_width !== undefined ? this.config.button_width : '16.8vw'} name="button_width" placeholder="默认16.8vw" />
        </div>

        <div class="form-group">
          <label>按钮高度：默认24px</label>
          <input type="text" @change=${this._entityChanged} .value=${this.config.button_height !== undefined ? this.config.button_height : '24px'} name="button_height" placeholder="默认24px" />
        </div>

        <div class="form-group">
          <label>按钮文字大小：默认11px</label>
          <input type="text" @change=${this._entityChanged} .value=${this.config.button_font_size !== undefined ? this.config.button_font_size : '11px'} name="button_font_size" placeholder="默认11px" />
        </div>

        <div class="form-group">
          <label>按钮图标大小：默认13px</label>
          <input type="text" @change=${this._entityChanged} .value=${this.config.button_icon_size !== undefined ? this.config.button_icon_size : '13px'} name="button_icon_size" placeholder="默认13px" />
        </div>

        <div class="form-group">
          <label>弹窗宽度：默认95%</label>
          <input type="text" @change=${this._entityChanged} .value=${this.config.popup_width !== undefined ? this.config.popup_width : '95%'} name="popup_width" placeholder="默认95%" />
        </div>

        <div class="form-group">
          <label>弹窗位置：默认20px</label>
          <input type="text" @change=${this._entityChanged} .value=${this.config.popup_top !== undefined ? this.config.popup_top : '20px'} name="popup_top" placeholder="默认20px" />
        </div>

        <div class="form-group"><label>下方是弹出的主卡配置项</label></div>

        <div class="form-group">
          <label>主题</label>
          <select @change=${this._entityChanged} .value=${this.config.theme !== undefined ? this.config.theme : 'system'} name="theme">
            <option value="light">浅色主题</option>
            <option value="dark">深色主题</option>
          </select>
        </div>

        <div class="form-group">
          <label>卡片宽度</label>
          <input type="text" @change=${this._entityChanged} .value=${this.config.width !== undefined ? this.config.width : '100%'} name="width" placeholder="100%, 380px" />
        </div>

        <div class="form-group">
          <label class="color-input-wrapper">用水量数据颜色：
            <input type="color" @change=${this._entityChanged} .value=${this.config.color_num !== undefined ? this.config.color_num : '#07d2ff'} name="color_num" class="color-input" />
            <input type="text" @change=${this._entityChanged} .value=${this.config.color_num !== undefined ? this.config.color_num : '#07d2ff'} name="color_num" class="color-text" placeholder="#07d2ff" />
          </label>
        </div>

        <div class="form-group">
          <label class="color-input-wrapper">用水费数据颜色：
            <input type="color" @change=${this._entityChanged} .value=${this.config.color_cost !== undefined ? this.config.color_cost : '#f30660'} name="color_cost" class="color-input" />
            <input type="text" @change=${this._entityChanged} .value=${this.config.color_cost !== undefined ? this.config.color_cost : '#f30660'} name="color_cost" class="color-text" placeholder="#f30660" />
          </label>
        </div>

        <div class="checkbox-group">
          <input type="checkbox" @change=${this._entityChanged} .checked=${this.config.default_show_calendar ? true : false} name="default_show_calendar" id="default_show_calendar" />
          <label for="default_show_calendar" class="checkbox-label">默认弹出日历</label>
        </div>

        <div class="form-group">
          <label>国网信息标题</label>
          <input type="text" @change=${this._entityChanged} .value=${this.config.balance_name !== undefined ? this.config.balance_name : '国网信息'} name="balance_name" placeholder="国网信息" />
        </div>

        <div class="form-group">
          <label>全局预警条件</label>
          <input type="text" @change=${this._entityChanged} .value=${this.config.global_warning || ''} name="global_warning" placeholder="<10 或 <=0" />
        </div>

        <div class="form-group">
          <label>多户号排列方式</label>
          <select @change=${this._entityChanged} .value=${this.config.entity_layout || 'vertical'} name="entity_layout">
            <option value="vertical">纵向排列</option>
            <option value="horizontal">横向排列</option>
          </select>
        </div>

        <div class="form-group" ?hidden=${this.config.entity_layout !== 'horizontal'}>
          <label>每排个数</label>
          <input type="number" min="1" max="10" @change=${this._entityChanged} .value=${this.config.entities_per_row || '3'} name="entities_per_row" placeholder="3" />
        </div>

        <div class="form-group">
          <label>添加国网实体</label>
          <div class="entity-selector">
            <input type="text" @input=${this._onEntitySearch} @focus=${this._onEntitySearch} .value=${this._searchTerm || ''} placeholder="搜索实体..." class="entity-search-input" />
            ${this._showEntityList ? html`
              <div class="entity-dropdown">
                ${this._filteredEntities.map(entity => html`
                  <div class="entity-option ${this.config.entities && this.config.entities.some(e => e.entity_id === entity.entity_id) ? 'selected' : ''}" @click=${() => this._toggleEntity(entity.entity_id)}>
                    <div class="entity-info">
                      <div class="entity-details">
                        <div class="entity-name">${entity.attributes?.friendly_name || entity.entity_id}</div>
                        <div class="entity-id">${entity.entity_id}</div>
                      </div>
                      <ha-icon icon="${entity.attributes?.icon || 'mdi:help-circle'}"></ha-icon>
                    </div>
                    ${this.config.entities && this.config.entities.some(e => e.entity_id === entity.entity_id) ? html`<ha-icon icon="mdi:check" class="check-icon"></ha-icon>` : ''}
                  </div>
                `)}
                ${this._filteredEntities.length === 0 ? html`<div class="no-results">未找到匹配的实体</div>` : ''}
              </div>
            ` : ''}
          </div>
          <div class="selected-entities">
            ${this.config.entities && this.config.entities.length > 0 ? html`
              <div class="selected-label">已选择的实体：</div>
              ${this.config.entities.map((entityConfig, index) => {
                const entity = this.hass.states[entityConfig.entity_id];
                return html`
                  <div class="selected-entity-config">
                    <div class="selected-entity">
                      <span>${entity?.attributes?.friendly_name || entityConfig.entity_id}</span>
                      <ha-icon icon="${entity?.attributes?.icon || 'mdi:help-circle'}"></ha-icon>
                      <button class="remove-btn" @click=${() => this._removeEntity(index)}><ha-icon icon="mdi:close"></ha-icon></button>
                    </div>
                    <div class="attribute-config">
                      <div class="override-config">
                        <input type="checkbox" class="override-checkbox" @change=${(e) => this._updateEntityOverride(index, 'name', e.target.checked)} .checked=${entityConfig.overrides?.name !== undefined} />
                        <span class="override-label">名称:</span>
                        <input type="text" class="override-input" @change=${(e) => this._updateEntityOverrideValue(index, 'name', e.target.value)} .value=${entityConfig.overrides?.name || ''} placeholder="自定义名称" ?disabled=${entityConfig.overrides?.name === undefined} />
                      </div>
                      <div class="override-config">
                        <input type="checkbox" class="override-checkbox" @change=${(e) => this._updateEntityOverride(index, 'unit', e.target.checked)} .checked=${entityConfig.overrides?.unit !== undefined} />
                        <span class="override-label">单位:</span>
                        <input type="text" class="override-input" @change=${(e) => this._updateEntityOverrideValue(index, 'unit', e.target.value)} .value=${entityConfig.overrides?.unit || ''} placeholder="自定义单位" ?disabled=${entityConfig.overrides?.unit === undefined} />
                      </div>
                      <div class="override-config">
                        <input type="checkbox" class="override-checkbox" @change=${(e) => this._updateEntityOverride(index, 'icon', e.target.checked)} .checked=${entityConfig.overrides?.icon !== undefined} />
                        <span class="override-label">图标:</span>
                        <input type="text" class="override-input" @change=${(e) => this._updateEntityOverrideValue(index, 'icon', e.target.value)} .value=${entityConfig.overrides?.icon || ''} placeholder="mdi:icon-name" ?disabled=${entityConfig.overrides?.icon === undefined} />
                      </div>
                      <div class="override-config">
                        <input type="checkbox" class="override-checkbox" @change=${(e) => this._updateEntityOverride(index, 'warning', e.target.checked)} .checked=${entityConfig.overrides?.warning !== undefined} />
                        <span class="override-label">预警:</span>
                        <input type="text" class="override-input" @change=${(e) => this._updateEntityOverrideValue(index, 'warning', e.target.value)} .value=${entityConfig.overrides?.warning || ''} placeholder=">10, <=5, ==on" ?disabled=${entityConfig.overrides?.warning === undefined} />
                      </div>
                    </div>
                  </div>
                `;
              })}
            ` : ''}
          </div>
          <div class="help-text">
            搜索并选择要显示的国网实体，支持多选。每个实体可配置名称、单位、图标、预警。
          </div>
        </div>
      </div>
    `;
  }

  _entityChanged(e) {
    const { name, value, type, checked } = e.target;
    let finalValue;
    if (type === 'checkbox') {
      finalValue = checked;
    } else {
      if (!value && name !== 'theme' && name !== 'button_width' && name !== 'button_height' &&
          name !== 'button_font_size' && name !== 'button_icon_size' && name !== 'popup_width' &&
          name !== 'popup_top' && name !== 'display_mode' &&
          name !== 'decimal_precision' && name !== 'width' && name !== 'color_num' &&
          name !== 'color_cost' && name !== 'balance_name' && name !== 'global_warning' &&
          name !== 'entity_layout' && name !== 'entities_per_row' && name !== 'default_show_calendar') return;
      finalValue = value;
    }
    if (name === 'button_width') finalValue = value || '16.8vw';
    else if (name === 'button_height') finalValue = value || '24px';
    else if (name === 'button_font_size') finalValue = value || '11px';
    else if (name === 'button_icon_size') finalValue = value || '13px';
    else if (name === 'decimal_precision') finalValue = value !== undefined ? parseInt(value) : 1;
    else if (name === 'default_show_calendar') finalValue = checked ? 'none' : '';

    this.config = { ...this.config, [name]: finalValue };
    this.dispatchEvent(new CustomEvent('config-changed', { detail: { config: this.config }, bubbles: true, composed: true }));
  }

  _onEntitySearch(e) {
    const searchTerm = e.target.value.toLowerCase();
    this._searchTerm = searchTerm;
    this._showEntityList = true;
    if (!this.hass) return;
    const allEntities = Object.values(this.hass.states);
    this._filteredEntities = allEntities.filter(entity => {
      const entityId = entity.entity_id.toLowerCase();
      const friendlyName = (entity.attributes?.friendly_name || '').toLowerCase();
      return entityId.includes(searchTerm) || friendlyName.includes(searchTerm);
    }).slice(0, 50);
    this.requestUpdate();
  }

  _toggleEntity(entityId) {
    const currentEntities = this.config.entities || [];
    let newEntities;
    if (currentEntities.some(e => e.entity_id === entityId)) {
      newEntities = currentEntities.filter(e => e.entity_id !== entityId);
    } else {
      newEntities = [...currentEntities, { entity_id: entityId, overrides: undefined }];
    }
    this.config = { ...this.config, entities: newEntities };
    this.dispatchEvent(new CustomEvent('config-changed', { detail: { config: this.config }, bubbles: true, composed: true }));
    this.requestUpdate();
  }

  _removeEntity(index) {
    const currentEntities = this.config.entities || [];
    const newEntities = currentEntities.filter((_, i) => i !== index);
    this.config = { ...this.config, entities: newEntities };
    this.dispatchEvent(new CustomEvent('config-changed', { detail: { config: this.config }, bubbles: true, composed: true }));
    this.requestUpdate();
  }

  _updateEntityOverride(index, overrideType, enabled) {
    const currentEntities = this.config.entities || [];
    const newEntities = [...currentEntities];
    if (newEntities[index]) {
      const overrides = { ...newEntities[index].overrides };
      if (enabled) { overrides[overrideType] = ''; } else { delete overrides[overrideType]; }
      newEntities[index] = { ...newEntities[index], overrides: Object.keys(overrides).length > 0 ? overrides : undefined };
    }
    this.config = { ...this.config, entities: newEntities };
    this.dispatchEvent(new CustomEvent('config-changed', { detail: { config: this.config }, bubbles: true, composed: true }));
    this.requestUpdate();
  }

  _updateEntityOverrideValue(index, overrideType, value) {
    const currentEntities = this.config.entities || [];
    const newEntities = [...currentEntities];
    if (newEntities[index] && newEntities[index].overrides && newEntities[index].overrides[overrideType] !== undefined) {
      const overrides = { ...newEntities[index].overrides };
      overrides[overrideType] = value.trim();
      newEntities[index] = { ...newEntities[index], overrides: overrides };
    }
    this.config = { ...this.config, entities: newEntities };
    this.dispatchEvent(new CustomEvent('config-changed', { detail: { config: this.config }, bubbles: true, composed: true }));
    this.requestUpdate();
  }

  firstUpdated() {
    document.addEventListener('click', (e) => {
      if (!e.target.closest('.entity-selector')) {
        this._showEntityList = false;
        this.requestUpdate();
      }
    });
  }

  constructor() {
    super();
    this._searchTerm = '';
    this._filteredEntities = [];
    this._showEntityList = false;
  }

  setConfig(config) { this.config = config; }
}
customElements.define('xiaoshi-xian-water-button-editor', XiaoshiXianWaterButtonEditor);

class XiaoshiXianWaterButton extends LitElement {
  static get properties() {
    return {
      hass: Object,
      config: Object,
      _balanceData: Array,
      _loading: Boolean,
      _refreshInterval: Number,
      theme: { type: String }
    };
  }

  static get styles() {
    return css`
      :host { display: block; width: var(--card-width, 100%); }
      .balance-status {
        width: var(--button-width, 16.8vw); height: var(--button-height, 24px);
        padding: 0; margin: 0; background: var(--bg-color, #fff); color: var(--fg-color, #000);
        border-radius: 10px; font-size: var(--button-font-size, 11px); font-weight: 500;
        text-align: center; box-sizing: border-box; display: flex; align-items: center;
        justify-content: center; gap: 0; cursor: pointer;
        transition: background-color 0.2s, transform 0.1s; position: relative;
      }
      .balance-status.tablet-mode {
        width: var(--button-width, 16.8vw);
        padding: 0 10px; white-space: nowrap;
        justify-content: flex-start;
      }
      .tablet-balance { display: inline-flex; align-items: center; width: 66.66%; }
      .tablet-days { display: inline-flex; align-items: center; width: 33.33%; justify-content: flex-start; }
      .status-emoji { font-size: var(--button-icon-size, 13px); margin-right: 3px; line-height: 1; }
      ha-card { width: 100%; height: 100%; display: flex; flex-direction: column; background: var(--bg-color, #fff); border-radius: 12px; }
      .card-header { display: flex; justify-content: space-between; align-items: center; padding: 16px; background: var(--bg-color, #fff); border-radius: 12px; }
      .offline-indicator { display: inline-block; width: 8px; height: 8px; border-radius: 50%; margin-right: 8px; }
      @keyframes pulse { 0% { opacity: 1; } 50% { opacity: 0.5; } 100% { opacity: 1; } }
      .card-title { font-size: 20px; font-weight: 500; color: var(--fg-color, #000); height: 30px; line-height: 30px; display: flex; align-items: center; justify-content: center; }
      .devices-list { flex: 1; overflow-y: auto; min-height: 0; padding: 0 0 8px 0; }
      .device-item { display: flex; align-items: center; justify-content: space-between; margin: 0px 16px; padding: 8px 0; border-bottom: 1px solid rgb(150,150,150,0.5); }
      .device-item:first-child { border-top: 1px solid rgb(150,150,150,0.5); }
      .device-left { display: flex; align-items: center; flex: 1; min-width: 0; }
      .device-icon { margin-right: 12px; color: var(--fg-color, #000); flex-shrink: 0; }
      .device-name { color: var(--fg-color, #000); font-size: 12px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
      .device-value { color: var(--fg-color, #000); font-size: 12px; margin-left: auto; flex-shrink: 0; font-weight: bold; }
      .device-value.warning { color: var(--warning-color, rgb(255, 0, 0)); }
      .device-unit { font-size: 12px; color: var(--fg-color, #000); margin-left: 4px; font-weight: bold; }
      .device-unit.warning { color: var(--warning-color, rgb(255, 0, 0)); }
      .no-devices { text-align: center; padding: 10px 0; color: var(--fg-color, #000); }
      .loading { text-align: center; padding: 10px 0; color: var(--fg-color, #000); }
    `;
  }

  constructor() {
    super();
    this._balanceData = [];
    this._loading = false;
    this._refreshInterval = null;
    this.theme = 'system';
    this._popupOverlay = null;
    this._popupElement = null;
    this._popupCardElement = null;
    this._popupEscHandler = null;
    this._popupHassUnsubscribe = null;
    this._popupUpdatePending = false;
    this._popupHass = null;
  }

  static getConfigElement() {
    return document.createElement("xiaoshi-xian-water-button-editor");
  }

  connectedCallback() {
    super.connectedCallback();
    this._loadBalanceData();
    this.setAttribute('theme', this._evaluateTheme());
    this._refreshInterval = setInterval(() => { this._loadBalanceData(); }, 300000);
  }

  updated(changedProperties) {
    super.updated(changedProperties);
    if (changedProperties.has('hass')) {
      this._loadBalanceData();
    }
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

  disconnectedCallback() {
    super.disconnectedCallback();
    if (this._refreshInterval) clearInterval(this._refreshInterval);
    this._closePopup();
  }

  async _loadBalanceData() {
    if (!this.hass) return;
    try {
      const entities = this.config.entities || [];
      const balanceData = [];
      for (const entityConfig of entities) {
        const entityId = entityConfig.entity_id;
        const entity = this.hass.states[entityId];
        if (!entity) continue;
        let value = entity.state;
        let unit = entity.attributes?.unit_of_measurement || '';
        let friendlyName = entity.attributes?.friendly_name || entityId;
        let icon = entity.attributes?.icon || 'mdi:flash';
        let warningThreshold = undefined;
        if (entityConfig.overrides) {
          if (entityConfig.overrides.name) friendlyName = entityConfig.overrides.name;
          if (entityConfig.overrides.icon) icon = entityConfig.overrides.icon;
          if (entityConfig.overrides.unit) unit = entityConfig.overrides.unit;
          if (entityConfig.overrides.warning) warningThreshold = entityConfig.overrides.warning;
        }
        balanceData.push({ entity_id: entityId, friendly_name: friendlyName, value: value, unit: unit, icon: icon, warning_threshold: warningThreshold });
      }
      this._balanceData = balanceData;
    } catch (error) {
      console.error('加载国网实体数据失败:', error);
      this._balanceData = [];
    }
    this._loading = false;
  }

  _handleClick() {
    const hapticEvent = new Event('haptic', { bubbles: true, cancelable: false, composed: true });
    hapticEvent.detail = 'light';
    this.dispatchEvent(hapticEvent);
  }

  _evaluateWarningCondition(value, condition) {
    if (!condition) return false;
    const match = condition.match(/^(>=|<=|>|<|==|!=)\s*(.+)$/);
    if (!match) return false;
    const operator = match[1];
    let compareValue = match[2].trim();
    if ((compareValue.startsWith('"') && compareValue.endsWith('"')) || (compareValue.startsWith("'") && compareValue.endsWith("'"))) {
      compareValue = compareValue.slice(1, -1);
    }
    const numericValue = parseFloat(value);
    const numericCompare = parseFloat(compareValue);
    if (!isNaN(numericValue) && !isNaN(numericCompare)) {
      switch (operator) {
        case '>': return numericValue > numericCompare;
        case '>=': return numericValue >= numericCompare;
        case '<': return numericValue < numericCompare;
        case '<=': return numericValue <= numericCompare;
        case '==': return numericValue === numericCompare;
        case '!=': return numericValue !== numericCompare;
      }
    }
    const stringValue = String(value);
    switch (operator) {
      case '==': return stringValue === compareValue;
      case '!=': return stringValue !== compareValue;
    }
    return false;
  }

  _handleButtonClick() {
    const excludedParams = [
      'type', 'button_height', 'button_width', 'button_font_size', 'button_icon_size',
      'popup_top', 'popup_width', 'display_mode', 'decimal_precision', 'emoji',
      'tablet_mode'
    ];
    const stateGridCardConfig = {};
    Object.keys(this.config).forEach(key => {
      if (!excludedParams.includes(key)) {
        stateGridCardConfig[key] = this.config[key];
      }
    });
    this._showNativePopup({ type: 'custom:xiaoshi-xian-water-info', ...stateGridCardConfig });
    this._handleClick();
  }


  // ==========================================
  // 原生弹窗方法
  // ==========================================
  static _injectPopupStyles() {
    if (XiaoshiXianWaterButton._stylesInjected) return;
    XiaoshiXianWaterButton._stylesInjected = true;
    const style = document.createElement('style');
    style.id = 'xiaoshi-xian-water-button-popup-style';
    style.textContent = `@keyframes xiaoshiXianWaterButtonPopupIn { from { opacity: 0; scale: 0.95; } to { opacity: 1; scale: 1; } }`;
    document.head.appendChild(style);
  }

  _showNativePopup(popupContent) {
    this.constructor._injectPopupStyles();
    const haRoot = document.querySelector('home-assistant');
    const hassObj = haRoot?.hass || haRoot?.shadowRoot?.querySelector('home-assistant-main')?.hass;
    if (!hassObj) { console.error('[XiaoshiXianWaterButton] 无法获取 hass 对象'); return; }
    if (this._popupOverlay) this._closePopup();

    const overlay = document.createElement('div');
    overlay.style.cssText = 'position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); z-index: 1000; -webkit-backdrop-filter: blur(10px); backdrop-filter: blur(10px); pointer-events: auto;';
    overlay.addEventListener('click', (e) => { if (e.target === overlay) this._closePopup(); });

    const popupTop = this.config.popup_top || '20px';
    const popupWidth = this.config.popup_width || '95%';
    const popupTransform = popupTop === '50%' ? 'translate(-50%, -50%)' : 'translateX(-50%)';

    const popup = document.createElement('div');
    popup.style.cssText = `position: fixed; top: ${popupTop}; left: 50%; transform: ${popupTransform}; z-index: 1005; background: transparent; padding: 0; width: ${popupWidth}; max-width: 100vw; max-height: 100vh; overflow: hidden; box-sizing: border-box; animation: xiaoshiXianWaterButtonPopupIn 0.2s ease-out;`;

    document.body.appendChild(overlay);
    document.body.appendChild(popup);
    this._popupOverlay = overlay;
    this._popupElement = popup;
    this._createPopupCard(popup, popupContent, hassObj);
    this._popupEscHandler = (e) => { if (e.key === 'Escape') this._closePopup(); };
    window.addEventListener('keydown', this._popupEscHandler);
  }

  async _createPopupCard(container, cardConfig, hassObj) {
    try {
      const helpers = await window.loadCardHelpers?.();
      if (helpers) {
        const cardElement = await helpers.createCardElement(cardConfig);
        cardElement.hass = hassObj;
        container.appendChild(cardElement);
        this._popupCardElement = cardElement;
        this._startPopupHassWatcher(hassObj);
      } else { container.innerHTML = '<div style="color:red;padding:20px;">loadCardHelpers 不可用</div>'; }
    } catch (err) { console.error('[XiaoshiXianWaterButton] 创建弹窗卡片失败:', err); container.innerHTML = `<div style="color:red;padding:20px;">加载失败: ${err.message}</div>`; }
  }

  _closePopup() {
    if (this._popupOverlay) { this._popupOverlay.remove(); this._popupOverlay = null; }
    if (this._popupElement) { this._popupElement.remove(); this._popupElement = null; }
    this._popupCardElement = null;
    if (this._popupEscHandler) { window.removeEventListener('keydown', this._popupEscHandler); this._popupEscHandler = null; }
    if (this._popupHassUnsubscribe) { this._popupHassUnsubscribe(); this._popupHassUnsubscribe = null; }
    this._popupUpdatePending = false;
    this._popupHass = null;
  }

  _startPopupHassWatcher(hassObj) {
    if (this._popupHassUnsubscribe) return;
    this._popupHass = hassObj;
    if (!hassObj || !hassObj.connection) { setTimeout(() => this._startPopupHassWatcher(hassObj), 500); return; }
    try {
      hassObj.connection.subscribeMessage(
        () => { if (!this._popupCardElement) return; this._schedulePopupUpdate(); },
        { type: 'subscribe_events', event_type: 'state_changed' }
      ).then((unsub) => { this._popupHassUnsubscribe = unsub; });
    } catch (err) { console.error('[XiaoshiXianWaterButton] 订阅状态变化失败:', err); }
  }

  _schedulePopupUpdate() {
    if (this._popupUpdatePending) return;
    this._popupUpdatePending = true;
    requestAnimationFrame(() => {
      this._popupUpdatePending = false;
      if (!this._popupCardElement) return;
      const haRoot = document.querySelector('home-assistant');
      const newHass = haRoot?.hass || haRoot?.shadowRoot?.querySelector('home-assistant-main')?.hass;
      if (!newHass || newHass === this._popupHass) return;
      this._popupHass = newHass;
      this._updatePopupCard();
    });
  }

  _updatePopupCard() {
    if (this._popupCardElement && this._popupHass) {
      try { this._popupCardElement.hass = this._popupHass; } catch (err) { console.warn('[XiaoshiXianWaterButton] 弹窗卡片更新失败:', err.message); }
    }
  }

  // ==========================================
  // 计算多实体显示值
  // ==========================================
  _computeDisplayValue() {
    const displayMode = this.config.display_mode || 'first_entity';
    const decimalPrecision = this.config.decimal_precision !== undefined ? parseInt(this.config.decimal_precision) : 1;

    if (!this._balanceData || this._balanceData.length === 0) {
      return { value: '无数据', unit: '', isWarning: false };
    }

    const numericValues = this._balanceData
      .map(item => { const v = parseFloat(item.value); return { value: isNaN(v) ? null : v, item }; })
      .filter(item => item.value !== null);

    if (numericValues.length === 0) {
      return { value: '无有效数值', unit: '', isWarning: false };
    }

    let displayValue;
    let displayUnit = '元';

    switch (displayMode) {
      case 'sum':
        displayValue = numericValues.reduce((sum, item) => sum + item.value, 0);
        break;
      case 'min':
        displayValue = Math.min(...numericValues.map(item => item.value));
        break;
      case 'max':
        displayValue = Math.max(...numericValues.map(item => item.value));
        break;
      case 'average':
        displayValue = numericValues.reduce((sum, item) => sum + item.value, 0) / numericValues.length;
        break;
      case 'first_entity':
      default:
        displayValue = numericValues[0].value;
        displayUnit = numericValues[0].item.unit || '元';
        break;
    }

    let isWarning = false;
    if (this.config.global_warning && this.config.global_warning.trim() !== '') {
      isWarning = this._evaluateWarningCondition(displayValue, this.config.global_warning);
    }

    if (typeof displayValue === 'number') {
      displayValue = parseFloat(displayValue.toFixed(decimalPrecision));
    }

    return { value: displayValue, unit: displayUnit, isWarning };
  }

  render() {
    if (!this.hass) return html`<div class="loading">等待Home Assistant连接...</div>`;

    const theme = this._evaluateTheme();
    const fgColor = theme === 'light' ? 'rgb(0, 0, 0)' : 'rgb(255, 255, 255)';
    const buttonEmoji = '💧';
    const tabletMode = this.config.tablet_mode === true;
    const buttonBgColor = tabletMode ? 'transparent' : theme === 'light' ? 'rgb(255, 255, 255, 0.6)' : 'rgb(83, 83, 83, 0.6)';

    const { value: displayValue, unit: displayUnit, isWarning } = this._computeDisplayValue();

    const warningColor = 'rgb(255, 0, 0)';
    const numberColor = isWarning ? warningColor : fgColor;

    if (tabletMode) {
      // 平板端特性：💧水费余额：xxx元  预计：xx天
      const tabletFgColor = 'rgb(255, 255, 255)';
      let balanceValue = '--';
      let daysValue = '--';
      let balanceEntityId = null;
      if (this._balanceData && this._balanceData.length > 0) {
        for (const item of this._balanceData) {
          const name = (item.friendly_name || '').toLowerCase();
          if (name.includes('余额') || name.includes('费余') || name.includes('balance')) {
            balanceValue = item.value;
            balanceEntityId = item.entity_id;
          } else if (name.includes('预计') || name.includes('天数') || name.includes('天') || name.includes('days')) {
            daysValue = item.value;
          }
        }
        // 如果没有通过名称匹配，用第一个和第二个实体
        if (balanceValue === '--' && this._balanceData.length >= 1) {
          balanceValue = this._balanceData[0].value;
          balanceEntityId = this._balanceData[0].entity_id;
        }
        if (daysValue === '--' && this._balanceData.length >= 2) daysValue = this._balanceData[1].value;
      }

      // 从余额实体的属性中获取剩余天数
      if (balanceEntityId && this.hass && this.hass.states[balanceEntityId]) {
        const entity = this.hass.states[balanceEntityId];
        const remainDays = entity.attributes?.剩余天数 || entity.attributes?.remain_days || entity.attributes?.days;
        if (remainDays !== undefined && remainDays !== null) daysValue = remainDays;
      }

      // 水费余额预警色
      const balanceColor = isWarning ? warningColor : tabletFgColor;

      return html`
        <div class="balance-status tablet-mode" style="--fg-color: ${tabletFgColor}; --bg-color: ${buttonBgColor};" @click=${this._handleButtonClick}>
          <span class="tablet-balance"><span class="status-emoji">${buttonEmoji}</span><span style="color: ${tabletFgColor};">水费余额：<span style="color: ${balanceColor};">${balanceValue}元</span></span></span>
          <span class="tablet-days" style="color: ${tabletFgColor};">预计：${daysValue}天</span>
        </div>
      `;
    }

    let formattedDisplayValue;
    if (typeof displayValue === 'number') {
      const dp = this.config.decimal_precision !== undefined ? parseInt(this.config.decimal_precision) : 1;
      formattedDisplayValue = displayValue.toFixed(dp);
      formattedDisplayValue = parseFloat(formattedDisplayValue).toString();
    } else {
      formattedDisplayValue = displayValue;
    }

    const displayText = formattedDisplayValue !== null && displayUnit ? `${formattedDisplayValue}${displayUnit}` : formattedDisplayValue;

    return html`
      <div class="balance-status" style="--fg-color: ${numberColor}; --bg-color: ${buttonBgColor};" @click=${this._handleButtonClick}>
        <span class="status-emoji">${buttonEmoji}</span>
        <span style="color: ${numberColor};">${displayText}</span>
      </div>
    `;
  }

  setConfig(config) {
    this.config = { ...config };
    this.style.setProperty('--button-width', config.button_width || '16.8vw');
    this.style.setProperty('--button-height', config.button_height || '24px');
    this.style.setProperty('--button-font-size', config.button_font_size || '11px');
    this.style.setProperty('--button-icon-size', config.button_icon_size || '13px');
    this.style.setProperty('--card-width', config.popup_width || '100%');
  }

  getCardSize() { return 3; }
}
customElements.define('xiaoshi-xian-water-button', XiaoshiXianWaterButton);
