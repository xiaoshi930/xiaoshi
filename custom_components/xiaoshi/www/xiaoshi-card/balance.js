const whenDefined = (t) => customElements.whenDefined(t);
await Promise.race([whenDefined("ha-card"), whenDefined("ha-panel-lovelace")]);
const LitElement = window.LitElement || Object.getPrototypeOf(customElements.get("ha-card"));
const html = LitElement.prototype.html;
const css = LitElement.prototype.css;
import { yamlToJson } from '../function/function.js';

// ==================== 注册自定义卡片 ====================
window.customCards = window.customCards || [];
window.customCards.push({
  type: 'xiaoshi-balance-card',
  name: '消逝余额信息卡片',
  description: '消逝余额信息卡片',
  preview: true
});
window.customCards.push({
  type: 'xiaoshi-balance-button',
  name: '消逝余额信息按钮',
  description: '消逝余额信息按钮',
  preview: true
});

// ==================== 公共工具函数（无this依赖） ====================

function evaluateTheme(config) {
  try {
    const mode = config ? config.theme : 'system';
    if (mode === 'light') return 'light';
    if (mode === 'dark') return 'dark';
    if (mode === 'system' || !mode) {
      if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) return 'dark';
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

function evaluateWarningCondition(value, condition) {
  if (!condition) return false;
  const match = condition.match(/^(>=|<=|>|<|==|!=)\s*(.+)$/);
  if (!match) return false;
  const operator = match[1];
  let compareValue = match[2].trim();
  if ((compareValue.startsWith('"') && compareValue.endsWith('"')) ||
      (compareValue.startsWith("'") && compareValue.endsWith("'"))) {
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
  const stringCompare = compareValue;
  switch (operator) {
    case '==': return stringValue === stringCompare;
    case '!=': return stringValue !== stringCompare;
    case '>': return stringValue > stringCompare;
    case '>=': return stringValue >= stringCompare;
    case '<': return stringValue < stringCompare;
    case '<=': return stringValue <= stringCompare;
  }
  return false;
}

// ==================== 公共CSS样式 ====================

const editorCommonStyles = css`
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
    justify-content: space-between;
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
  .selected-entities {
    margin-top: 8px;
  }
  .selected-label {
    font-size: 12px;
    font-weight: bold;
    margin-bottom: 4px;
    color: #333;
  }
  .selected-entity-config {
    margin-bottom: 8px;
    border: 1px solid #ddd;
    border-radius: 4px;
    padding: 8px;
    background: #f9f9f9;
  }
  .selected-entity {
    display: flex;
    align-items: center;
    gap: 4px;
    margin-bottom: 8px;
    font-size: 12px;
    color: #000;
    justify-content: space-between;
  }
  .attribute-config {
    margin-top: 4px;
    display: flex;
    flex-direction: column;
    gap: 4px;
  }
  .attribute-input {
    width: 100%;
    padding: 4px 8px;
    border: 1px solid #ddd;
    border-radius: 4px;
    font-size: 12px;
    box-sizing: border-box;
  }
  .override-config {
    display: flex;
    align-items: center;
    gap: 4px;
    margin-top: 2px;
  }
  .override-checkbox {
    margin-right: 4px;
  }
  .override-input {
    flex: 1;
    padding: 2px 6px;
    border: 1px solid #ddd;
    border-radius: 3px;
    font-size: 11px;
    box-sizing: border-box;
  }
  .override-label {
    font-size: 11px;
    color: #666;
    white-space: nowrap;
  }
  .remove-btn {
    background: none;
    border: none;
    cursor: pointer;
    padding: 0;
    display: flex;
    align-items: center;
    color: #666;
    margin-left: auto;
  }
  .remove-btn:hover {
    color: #f44336;
  }
`;

const cardCommonStyles = css`
  :host {
    display: block;
    max-width:500px; 
    margin: 0 auto;
  }
  ha-card {
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
    background: var(--bg-color, #fff);
    border-radius: 12px;
  }
  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 16px;
    background: var(--bg-color, #fff);
    border-radius: 12px;
  }
  .offline-indicator {
    display: inline-block;
    width: 8px;
    height: 8px;
    border-radius: 50%;
    margin-right: 8px;
  }
  @keyframes pulse {
    0% { opacity: 1; }
    50% { opacity: 0.5; }
    100% { opacity: 1; }
  }
  .card-title {
    font-size: 20px;
    font-weight: 500;
    color: var(--fg-color, #000);
    height: 30px;
    line-height: 30px;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .device-count {
    color: var(--fg-color, #000);
    border-radius: 8px;
    font-size: 13px;
    width: 30px;
    height: 30px;
    text-align: center;
    line-height: 30px;
    font-weight: bold;
    padding: 0px;
  }
  .device-count.non-zero {
    background: rgb(2, 250, 250, 0.5);
  }
  .device-count.zero {
    background: rgb(0, 205, 0);
  }
  .refresh-btn {
    color: var(--fg-color, #fff);
    border: none;
    border-radius: 8px;
    padding: 5px;
    cursor: pointer;
    font-size: 13px;
    width: 50px;
    height: 30px;
    line-height: 30px;
    text-align: center;
    font-weight: bold;
    padding: 0px;
  }
  .section-divider {
    margin: 0 0 8px 0;
    padding: 8px 8px;
    background: var(--bg-color, #fff);
    font-weight: 500;
    color: var(--fg-color, #000);
    border-top: 1px solid rgb(150,150,150,0.5);
    border-bottom: 1px solid rgb(150,150,150,0.5);
    margin: 0 16px 0 16px;
  }
  .section-title {
    display: flex;
    align-items: center;
    justify-content: space-between;
    color: var(--fg-color, #000);
    font-size: 13px;
  }
  .section-count {
    background: rgb(255,0,0,0.5);
    color: var(--fg-color, #000);
    border-radius: 12px;
    width: 15px;
    height: 15px;
    text-align: center;
    line-height: 15px;
    padding: 3px;
    font-size: 12px;
    font-weight: bold;
  }
  .device-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin: 0px 16px;
    padding: 8px 0;
    border-bottom: 1px solid rgb(150,150,150,0.5);
    cursor: pointer;
    transition: background-color 0.2s;
  }
  .device-item:first-child {
    border-top: 1px solid rgb(150,150,150,0.5);
  }
  .device-item:hover {
    background-color: rgba(150,150,150,0.1);
  }
  .devices-list {
    flex: 1;
    overflow-y: auto;
    min-height: 0;
    padding: 0 0 8px 0;
  }
  .device-left {
    display: flex;
    align-items: center;
    flex: 1;
    min-width: 0;
  }
  .device-icon {
    margin-right: 12px;
    color: var(--fg-color, #000);
    flex-shrink: 0;
  }
  .device-name {
    color: var(--fg-color, #000);
    font-size: 12px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .device-value {
    color: var(--fg-color, #000);
    font-size: 12px;
    margin-left: auto;
    flex-shrink: 0;
    font-weight: bold;
  }
  .device-value.warning {
    color: var(--warning-color, #F44336);
  }
  .device-unit {
    font-size: 12px;
    color: var(--fg-color, #000);
    margin-left: 4px;
    font-weight: bold;
  }
  .device-unit.warning {
    color: var(--warning-color, #F44336);
  }
  .no-devices {
    text-align: center;
    padding: 10px 0;
    color: var(--fg-color, #000);
  }
  .loading {
    text-align: center;
    padding: 10px 0;
    color: var(--fg-color, #000);
  }
`;

// ==================== 编辑器混入（Mixin） ====================

const BalanceEditorMixin = (superClass) => class extends superClass {
  _onEntitySearch(e) {
    const searchTerm = e.target.value.toLowerCase();
    this._searchTerm = searchTerm;
    this._showEntityList = true;
    if (!this.hass) return;
    const allEntities = Object.values(this.hass.states);
    this._filteredEntities = allEntities.filter(entity => {
      const entityId = entity.entity_id.toLowerCase();
      const friendlyName = (entity.attributes.friendly_name || '').toLowerCase();
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
    this._fireConfigChanged();
    this.requestUpdate();
  }

  _removeEntity(index) {
    const currentEntities = this.config.entities || [];
    const newEntities = currentEntities.filter((_, i) => i !== index);
    this.config = { ...this.config, entities: newEntities };
    this._fireConfigChanged();
    this.requestUpdate();
  }

  _updateEntityAttribute(index, attributeValue) {
    const currentEntities = this.config.entities || [];
    const newEntities = [...currentEntities];
    if (newEntities[index]) {
      const updatedEntity = { ...newEntities[index] };
      if (attributeValue.trim()) {
        updatedEntity.attribute = attributeValue.trim();
      } else {
        delete updatedEntity.attribute;
      }
      newEntities[index] = updatedEntity;
    }
    this.config = { ...this.config, entities: newEntities };
    this._fireConfigChanged();
    this.requestUpdate();
  }

  _updateEntityOverride(index, overrideType, enabled) {
    const currentEntities = this.config.entities || [];
    const newEntities = [...currentEntities];
    if (newEntities[index]) {
      const overrides = { ...newEntities[index].overrides };
      if (enabled) {
        overrides[overrideType] = '';
      } else {
        delete overrides[overrideType];
      }
      newEntities[index] = {
        ...newEntities[index],
        overrides: Object.keys(overrides).length > 0 ? overrides : undefined
      };
    }
    this.config = { ...this.config, entities: newEntities };
    this._fireConfigChanged();
    this.requestUpdate();
  }

  _updateEntityOverrideValue(index, overrideType, value) {
    const currentEntities = this.config.entities || [];
    const newEntities = [...currentEntities];
    if (newEntities[index] && newEntities[index].overrides && newEntities[index].overrides[overrideType] !== undefined) {
      const overrides = { ...newEntities[index].overrides };
      overrides[overrideType] = value.trim();
      newEntities[index] = { ...newEntities[index], overrides };
    }
    this.config = { ...this.config, entities: newEntities };
    this._fireConfigChanged();
    this.requestUpdate();
  }

  _fireConfigChanged() {
    this.dispatchEvent(new CustomEvent('config-changed', {
      detail: { config: this.config },
      bubbles: true,
      composed: true
    }));
  }

  _renderEntitySelector() {
    return html`
      <div class="entity-selector">
        <input
          type="text"
          @input=${this._onEntitySearch}
          @focus=${this._onEntitySearch}
          .value=${this._searchTerm || ''}
          placeholder="搜索实体..."
          class="entity-search-input"
        />
        ${this._showEntityList ? html`
          <div class="entity-dropdown">
            ${this._filteredEntities.map(entity => html`
              <div
                class="entity-option ${this.config.entities && this.config.entities.some(e => e.entity_id === entity.entity_id) ? 'selected' : ''}"
                @click=${() => this._toggleEntity(entity.entity_id)}
              >
                <div class="entity-info">
                  <div class="entity-details">
                    <div class="entity-name">${entity.attributes.friendly_name || entity.entity_id}</div>
                    <div class="entity-id">${entity.entity_id}</div>
                  </div>
                  <ha-icon icon="${entity.attributes.icon || 'mdi:help-circle'}"></ha-icon>
                </div>
                ${this.config.entities && this.config.entities.some(e => e.entity_id === entity.entity_id) ?
                  html`<ha-icon icon="mdi:check" class="check-icon"></ha-icon>` : ''}
              </div>
            `)}
            ${this._filteredEntities.length === 0 ? html`
              <div class="no-results">未找到匹配的实体</div>
            ` : ''}
          </div>
        ` : ''}
      </div>
    `;
  }

  _renderSelectedEntities() {
    if (!this.config.entities || this.config.entities.length === 0) return '';
    return html`
      <div class="selected-entities">
        <div class="selected-label">已选择的实体：</div>
        ${this.config.entities.map((entityConfig, index) => {
          const entity = this.hass.states[entityConfig.entity_id];
          return html`
            <div class="selected-entity-config">
              <div class="selected-entity">
                <span>${entity?.attributes.friendly_name || entityConfig.entity_id}</span>
                <ha-icon icon="${entity?.attributes.icon || 'mdi:help-circle'}"></ha-icon>
                <button class="remove-btn" @click=${() => this._removeEntity(index)}>
                  <ha-icon icon="mdi:close"></ha-icon>
                </button>
              </div>
              <div class="attribute-config">
                <input
                  type="text"
                  @change=${(e) => this._updateEntityAttribute(index, e.target.value)}
                  .value=${entityConfig.attribute || ''}
                  placeholder="留空使用实体状态，或输入属性名"
                  class="attribute-input"
                />
                <div class="override-config">
                  <input type="checkbox" class="override-checkbox"
                    @change=${(e) => this._updateEntityOverride(index, 'icon', e.target.checked)}
                    .checked=${entityConfig.overrides?.icon !== undefined}
                  />
                  <span class="override-label">图标:</span>
                  <input type="text" class="override-input"
                    @change=${(e) => this._updateEntityOverrideValue(index, 'icon', e.target.value)}
                    .value=${entityConfig.overrides?.icon || ''}
                    placeholder="mdi:icon-name"
                    ?disabled=${entityConfig.overrides?.icon === undefined}
                  />
                </div>
                <div class="override-config">
                  <input type="checkbox" class="override-checkbox"
                    @change=${(e) => this._updateEntityOverride(index, 'name', e.target.checked)}
                    .checked=${entityConfig.overrides?.name !== undefined}
                  />
                  <span class="override-label">名称:</span>
                  <input type="text" class="override-input"
                    @change=${(e) => this._updateEntityOverrideValue(index, 'name', e.target.value)}
                    .value=${entityConfig.overrides?.name || ''}
                    placeholder="自定义名称"
                    ?disabled=${entityConfig.overrides?.name === undefined}
                  />
                </div>
                <div class="override-config">
                  <input type="checkbox" class="override-checkbox"
                    @change=${(e) => this._updateEntityOverride(index, 'unit_of_measurement', e.target.checked)}
                    .checked=${entityConfig.overrides?.unit_of_measurement !== undefined}
                  />
                  <span class="override-label">单位:</span>
                  <input type="text" class="override-input"
                    @change=${(e) => this._updateEntityOverrideValue(index, 'unit_of_measurement', e.target.value)}
                    .value=${entityConfig.overrides?.unit_of_measurement || ''}
                    placeholder="自定义单位"
                    ?disabled=${entityConfig.overrides?.unit_of_measurement === undefined}
                  />
                </div>
                <div class="override-config">
                  <input type="checkbox" class="override-checkbox"
                    @change=${(e) => this._updateEntityOverride(index, 'warning', e.target.checked)}
                    .checked=${entityConfig.overrides?.warning !== undefined}
                  />
                  <span class="override-label">预警:</span>
                  <input type="text" class="override-input"
                    @change=${(e) => this._updateEntityOverrideValue(index, 'warning', e.target.value)}
                    .value=${entityConfig.overrides?.warning || ''}
                    placeholder="如: >10, <=5, ==on, ==off, =='hello world'"
                    ?disabled=${entityConfig.overrides?.warning === undefined}
                  />
                </div>
              </div>
            </div>
          `;
        })}
      </div>
    `;
  }
};

// ==================== 主组件混入（Mixin） ====================

const BalanceBaseMixin = (superClass) => class extends superClass {
  constructor() {
    super();
    this._oilPriceData = [];
    this._refreshInterval = null;
    this.theme = 'system';
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

  connectedCallback() {
    super.connectedCallback();
    this._loadOilPriceData();
    this.setAttribute('theme', this._evaluateTheme());
    this._refreshInterval = setInterval(() => {
      this._loadOilPriceData();
    }, 300000);
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    if (this._refreshInterval) {
      clearInterval(this._refreshInterval);
    }
  }

  async _loadOilPriceData() {
    if (!this.hass) return;
    this._loading = true;
    this.requestUpdate();
    try {
      const entities = this.config.entities || [];
      const balanceData = [];
      for (const entityConfig of entities) {
        const entityId = entityConfig.entity_id;
        const attributeName = entityConfig.attribute;
        const entity = this.hass.states[entityId];
        if (!entity) continue;
        const attributes = entity.attributes;
        let value = entity.state;
        let unit = '元';
        if (attributeName && attributes[attributeName] !== undefined) {
          value = attributes[attributeName];
        }
        if (attributes.unit_of_measurement) {
          unit = attributes.unit_of_measurement;
        } else {
          unit = '';
        }
        let friendlyName = attributes.friendly_name || entityId;
        let icon = attributes.icon || 'mdi:help-circle';
        let warningThreshold = undefined;
        if (entityConfig.overrides) {
          if (entityConfig.overrides.name !== undefined && entityConfig.overrides.name !== '') {
            friendlyName = entityConfig.overrides.name;
          }
          if (entityConfig.overrides.icon !== undefined && entityConfig.overrides.icon !== '') {
            icon = entityConfig.overrides.icon;
          }
          if (entityConfig.overrides.unit_of_measurement !== undefined && entityConfig.overrides.unit_of_measurement !== '') {
            unit = entityConfig.overrides.unit_of_measurement;
          }
          if (entityConfig.overrides.warning !== undefined && entityConfig.overrides.warning !== '') {
            warningThreshold = entityConfig.overrides.warning;
          }
        }
        balanceData.push({
          entity_id: entityId,
          friendly_name: friendlyName,
          value: value,
          unit: unit,
          icon: icon,
          warning_threshold: warningThreshold
        });
      }
      this._oilPriceData = balanceData;
    } catch (error) {
      console.error('加载设备余额数据失败:', error);
      this._oilPriceData = [];
    }
    this._loading = false;
  }

  _handleClick() {
    const hapticEvent = new Event('haptic', {
      bubbles: true,
      cancelable: false,
      composed: true
    });
    hapticEvent.detail = 'light';
    this.dispatchEvent(hapticEvent);
  }

  _evaluateWarningCondition(value, condition) {
    return evaluateWarningCondition(value, condition);
  }
};

// ==================== 消逝余额卡编辑器 ====================

class XiaoshiBalanceCardEditor extends BalanceEditorMixin(LitElement) {
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
    return editorCommonStyles;
  }

  constructor() {
    super();
    this._searchTerm = '';
    this._filteredEntities = [];
    this._showEntityList = false;
  }

  setConfig(config) {
    this.config = config;
  }

  firstUpdated() {
    document.addEventListener('click', (e) => {
      if (!e.target.closest('.entity-selector')) {
        this._showEntityList = false;
        this.requestUpdate();
      }
    });
  }

  render() {
    if (!this.hass) return html``;
    return html`
      <div class="form">
        <div class="form-group">
          <label>卡片宽度：支持像素(px)和百分比(%)，默认100%</label>
          <input
            type="text"
            @change=${this._entityChanged}
            .value=${this.config.width !== undefined ? this.config.width : '100%'}
            name="width"
            placeholder="默认100%"
          />
        </div>
        <div class="form-group">
          <label>标题名称：配置卡片显示的标题</label>
          <input
            type="text"
            @change=${this._entityChanged}
            .value=${this.config.name !== undefined ? this.config.name : '电话余额信息'}
            name="name"
            placeholder="默认：电话余额信息"
          />
        </div>
        <div class="form-group">
          <label>全局预警条件：当任一实体满足此条件时触发预警</label>
          <input
            type="text"
            @change=${this._entityChanged}
            .value=${this.config.global_warning || ''}
            name="global_warning"
            placeholder="如: >10, <=5, ==on, ==off, =='hello world'"
          />
        </div>
        <div class="form-group">
          <label>预警颜色：设置预警状态下的显示颜色</label>
          <div style="display: flex; gap: 8px; align-items: center;">
            <input
              type="color"
              @change=${this._entityChanged}
              .value=${this.config.warning_color || '#f44336'}
              name="warning_color"
              style="width: 50px; height: 34px; border: 1px solid #ddd; border-radius: 4px; cursor: pointer;"
            />
            <input
              type="text"
              @change=${this._entityChanged}
              .value=${this.config.warning_color || '#f44336'}
              name="warning_color"
              placeholder="默认：#f44336"
              style="flex: 1;"
            />
          </div>
        </div>
        <div class="form-group">
          <label>主题</label>
          <select
            @change=${this._entityChanged}
            .value=${this.config.theme !== undefined ? this.config.theme : 'system'}
            name="theme"
          >
            <option value="system">跟随系统</option>
            <option value="light">浅色主题（白底黑字）</option>
            <option value="dark">深色主题（黑底白字）</option>
          </select>
        </div>
        <div class="form-group">
          <label>设备余额实体：搜索并选择实体</label>
          ${this._renderEntitySelector()}
          ${this._renderSelectedEntities()}
          <div class="help-text">
            搜索并选择要显示的设备余额实体，支持多选。每个实体可以配置：<br>
            • 属性名：留空使用实体状态，或输入属性名<br>
            • 名称重定义：勾选后可自定义显示名称<br>
            • 图标重定义：勾选后可自定义图标（如 mdi:phone）<br>
            • 单位重定义：勾选后可自定义单位（如 元、$、kWh 等）<br>
            • 预警条件：勾选后设置预警条件，支持 >10, >=10, <10, <=10, ==10, ==on, ==off, =="hello world" 等<br>
            • 未勾选重定义时，将使用实体的原始属性值
          </div>
        </div>
      </div>
    `;
  }

  _entityChanged(e) {
    const { name, value } = e.target;
    if (!value && name !== 'theme' && name !== 'width') return;
    let finalValue = value;
    if (name === 'width') {
      finalValue = value || '100%';
    }
    this.config = { ...this.config, [name]: finalValue };
    this._fireConfigChanged();
  }
}
customElements.define('xiaoshi-balance-card-editor', XiaoshiBalanceCardEditor);

// ==================== 消逝余额卡 ====================

class XiaoshiBalanceCard extends BalanceBaseMixin(LitElement) {
  static get properties() {
    return {
      hass: Object,
      config: Object,
      _oilPriceData: Array,
      _loading: Boolean,
      _refreshInterval: Number,
      theme: { type: String }
    };
  }

  static get styles() {
    return cardCommonStyles;
  }

  static getConfigElement() {
    return document.createElement("xiaoshi-balance-card-editor");
  }

  _handleRefresh() {
    this._handleClick();
    this._loadOilPriceData();
  }

  _handleEntityClick(entity) {
    this._handleClick();
    if (entity.entity_id) {
      const evt = new Event('hass-more-info', { composed: true });
      evt.detail = { entityId: entity.entity_id };
      this.dispatchEvent(evt);
    }
  }

  render() {
    if (!this.hass) {
      return html`<div class="loading">等待Home Assistant连接...</div>`;
    }
    const theme = this._evaluateTheme();
    const fgColor = theme === 'light' ? 'rgb(0, 0, 0)' : 'rgb(255, 255, 255)';
    const bgColor = theme === 'light' ? 'rgb(255, 255, 255)' : 'rgb(50, 50, 50)';

    return html`
      <ha-card style="--fg-color: ${fgColor}; --bg-color: ${bgColor}; --warning-color: ${this.config.warning_color || '#f44336'};">
        <div class="card-header">
          <div class="card-title">
            <span class="offline-indicator" style="background: rgb(0,222,220); animation: pulse 2s infinite"></span>
            ${this.config.name || '电话余额信息'}
          </div>
        </div>
        <div class="devices-list">
          ${this._loading ?
            html`<div class="loading">加载中...</div>` :
            this._oilPriceData.length === 0 ?
              html`<div class="no-devices">请配置余额实体</div>` :
              html`
                ${this._oilPriceData.map(balanceData => {
                  let isWarning = false;
                  if (balanceData.warning_threshold && balanceData.warning_threshold.trim() !== '') {
                    isWarning = this._evaluateWarningCondition(balanceData.value, balanceData.warning_threshold);
                  } else {
                    if (this.config.global_warning && this.config.global_warning.trim() !== '') {
                      isWarning = this._evaluateWarningCondition(balanceData.value, this.config.global_warning);
                    }
                  }
                  return html`
                    <div class="device-item" @click=${() => this._handleEntityClick(balanceData)}>
                      <div class="device-left">
                        <ha-icon class="device-icon" icon="${balanceData.icon}"></ha-icon>
                        <div class="device-name">${balanceData.friendly_name}</div>
                      </div>
                      <div class="device-value ${isWarning ? 'warning' : ''}">
                        ${balanceData.value}
                        <span class="device-unit ${isWarning ? 'warning' : ''}">${balanceData.unit}</span>
                      </div>
                    </div>
                  `;
                })}
              `
          }
        </div>
      </ha-card>
    `;
  }

  setConfig(config) {
    this.config = config;
    if (config.width) {
      this.style.setProperty('--card-width', config.width);
    }
    if (config.warning_color) {
      this.style.setProperty('--warning-color', config.warning_color);
    } else {
      this.style.setProperty('--warning-color', '#f44336');
    }
    if (config.theme) {
      this.setAttribute('theme', config.theme);
    }
  }

  getCardSize() {
    const baseSize = 3;
    const entitySize = Math.max(0, Math.min(this._oilPriceData.length * 2, 10));
    return baseSize + entitySize;
  }
}
customElements.define('xiaoshi-balance-card', XiaoshiBalanceCard);

// ==================== 消逝余额按钮编辑器 ====================

class XiaoshiBalanceButtonEditor extends BalanceEditorMixin(LitElement) {
  static get properties() {
    return {
      hass: { type: Object },
      config: { type: Object },
      _searchTerm: { type: String },
      _filteredEntities: { type: Array },
      _showEntityList: { type: Boolean },
      _specificSearchTerm: { type: String },
      _specificFilteredEntities: { type: Array },
      _showSpecificEntityList: { type: Boolean }
    };
  }

  static get styles() {
    return editorCommonStyles;
  }

  constructor() {
    super();
    this._searchTerm = '';
    this._filteredEntities = [];
    this._showEntityList = false;
    this._specificSearchTerm = '';
    this._specificFilteredEntities = [];
    this._showSpecificEntityList = false;
  }

  setConfig(config) {
    this.config = config;
  }

  firstUpdated() {
    document.addEventListener('click', (e) => {
      if (!e.target.closest('.entity-selector')) {
        this._showEntityList = false;
        this._showSpecificEntityList = false;
        this.requestUpdate();
      }
    });
  }

  _onSpecificEntitySearch(e) {
    const searchTerm = e.target.value.toLowerCase();
    this._specificSearchTerm = searchTerm;
    this._showSpecificEntityList = true;
    if (!this.hass) return;
    const allEntities = Object.values(this.hass.states);
    this._specificFilteredEntities = allEntities.filter(entity => {
      const entityId = entity.entity_id.toLowerCase();
      const friendlyName = (entity.attributes.friendly_name || '').toLowerCase();
      return entityId.includes(searchTerm) || friendlyName.includes(searchTerm);
    }).slice(0, 50);
    this.requestUpdate();
  }

  _getSpecificEntityDisplayName() {
    const specificEntityId = this.config.specific_entity_id;
    if (specificEntityId) {
      return specificEntityId;
    }
    return '';
  }

  _selectSpecificEntity(entityId) {
    this.config = { ...this.config, specific_entity_id: entityId };
    this._fireConfigChanged();
    this._showSpecificEntityList = false;
    this._specificSearchTerm = '';
    this.requestUpdate();
  }

  render() {
    if (!this.hass) return html``;
    return html`
      <div class="form">
        <!-- 按钮特有配置 -->
        <div class="form-group">
          <label>显示模式</label>
          <select
            @change=${this._entityChanged}
            .value=${this.config.display_mode || 'min_value'}
            name="display_mode"
          >
            <option value="min_value">显示最小值</option>
            <option value="specific_entity">显示指定实体</option>
          </select>
        </div>

        <div class="form-group">
          <label>小数点精度：控制显示的小数位数，默认1位</label>
          <input
            type="number"
            @change=${this._entityChanged}
            .value=${this.config.decimal_precision !== undefined ? this.config.decimal_precision : '1'}
            name="decimal_precision"
            placeholder="默认1"
            min="0" max="10" step="1"
          />
        </div>

        <div class="form-group" style="${(this.config.display_mode || 'min_value') === 'specific_entity' ? '' : 'display: none;'}" id="specific_entity_group">
          <label>指定显示的实体</label>
          <div class="entity-selector">
            <input
              type="text"
              @input=${this._onSpecificEntitySearch}
              @focus=${this._onSpecificEntitySearch}
              .value=${this._showSpecificEntityList ? (this._specificSearchTerm || '') : this._getSpecificEntityDisplayName()}
              placeholder="搜索实体..."
              class="entity-search-input"
            />
            ${this._showSpecificEntityList ? html`
              <div class="entity-dropdown">
                ${this._specificFilteredEntities.map(entity => html`
                  <div
                    class="entity-option ${this.config.specific_entity_id === entity.entity_id ? 'selected' : ''}"
                    @click=${() => this._selectSpecificEntity(entity.entity_id)}
                  >
                    <div class="entity-info">
                      <div class="entity-details">
                        <div class="entity-name">${entity.attributes.friendly_name || entity.entity_id}</div>
                        <div class="entity-id">${entity.entity_id}</div>
                      </div>
                      <ha-icon icon="${entity.attributes.icon || 'mdi:help-circle'}"></ha-icon>
                    </div>
                    ${this.config.specific_entity_id === entity.entity_id ?
                      html`<ha-icon icon="mdi:check" class="check-icon"></ha-icon>` : ''}
                  </div>
                `)}
                ${this._specificFilteredEntities.length === 0 ? html`
                  <div class="no-results">未找到匹配的实体</div>
                ` : ''}
              </div>
            ` : ''}
          </div>
        </div>

        <div class="form-group">
          <label>按钮显示图标
          <input
            type="text"
            @change=${this._entityChanged}
            .value=${this.config.button_icon !== undefined ? this.config.button_icon : '📱'}
            name="button_icon"
            placeholder="📱"
          /></label>
        </div>

        <div class="checkbox-group">
          <input type="checkbox" class="checkbox-input"
            @change=${this._entityChanged}
            .checked=${this.config.transparent_bg === true}
            name="transparent_bg" id="transparent_bg"
          />
          <label for="transparent_bg" class="checkbox-label">
            （平板端特性）透明背景（勾选后按钮背景透明）
          </label>
        </div>

        <div class="checkbox-group">
          <input type="checkbox" class="checkbox-input"
            @change=${this._entityChanged}
            .checked=${this.config.lock_white_fg === true}
            name="lock_white_fg" id="lock_white_fg"
          />
          <label for="lock_white_fg" class="checkbox-label">
            （平板端特性）白色图标文字（勾选后锁定显示白色）
          </label>
        </div>

        <div class="form-group">
          <label>按钮宽度：默认16.8vw, 支持像素(px)和百分比(%)</label>
          <input
            type="text"
            @change=${this._entityChanged}
            .value=${this.config.button_width !== undefined ? this.config.button_width : '16.8vw'}
            name="button_width"
            placeholder="默认16.8vw"
          />
        </div>

        <div class="form-group">
          <label>按钮高度：支持像素(px)、百分比(%)和视窗高度(vh)，默认24px</label>
          <input
            type="text"
            @change=${this._entityChanged}
            .value=${this.config.button_height !== undefined ? this.config.button_height : '24px'}
            name="button_height"
            placeholder="默认24px"
          />
        </div>

        <div class="form-group">
          <label>按钮文字大小：支持像素(px)，默认11px</label>
          <input
            type="text"
            @change=${this._entityChanged}
            .value=${this.config.button_font_size !== undefined ? this.config.button_font_size : '11px'}
            name="button_font_size"
            placeholder="默认11px"
          />
        </div>

        <div class="form-group">
          <label>按钮图标大小：支持像素(px)，默认13px</label>
          <input
            type="text"
            @change=${this._entityChanged}
            .value=${this.config.button_icon_size !== undefined ? this.config.button_icon_size : '13px'}
            name="button_icon_size"
            placeholder="默认13px"
          />
        </div>

        <div class="form-group">
          <label>👇👇👇下方弹出的卡片可增加的其他卡片👇👇👇</label>
          <textarea
            @change=${this._entityChanged}
            .value=${this.config.other_cards || ''}
            name="other_cards"
            placeholder='# 示例配置：添加button卡片
- type: custom:button-card
template: 测试模板(最好引用模板，否则大概率会报错)
- type: custom:button-card
template: 测试模板(最好引用模板，否则大概率会报错)'
          ></textarea>
        </div>

        <div class="form-group">
          <label>👇👇👇下方是弹出的主卡配置项👇👇👇</label>
        </div>

        <div class="form-group">
          <label>弹窗宽度：支持像素(px)、百分比(%)和auto，默认95%</label>
          <input
            type="text"
            @change=${this._entityChanged}
            .value=${this.config.popup_width !== undefined ? this.config.popup_width : '95%'}
            name="popup_width"
            placeholder="默认95%"
          />
        </div>

        <div class="form-group">
          <label>弹窗位置：支持百分比(%)和像素(px)，默认20px</label>
          <input
            type="text"
            @change=${this._entityChanged}
            .value=${this.config.popup_top !== undefined ? this.config.popup_top : '20px'}
            name="popup_top"
            placeholder="默认20px"
          />
        </div>

        <!-- 公共配置 -->
        <div class="form-group">
          <label>标题名称：配置卡片显示的标题</label>
          <input
            type="text"
            @change=${this._entityChanged}
            .value=${this.config.name !== undefined ? this.config.name : '电话余额信息'}
            name="name"
            placeholder="默认：电话余额信息"
          />
        </div>

        <div class="form-group">
          <label>全局预警条件：当任一实体满足此条件时触发预警</label>
          <input
            type="text"
            @change=${this._entityChanged}
            .value=${this.config.global_warning || ''}
            name="global_warning"
            placeholder="如: >10, <=5, ==on, ==off, =='hello world'"
          />
        </div>

        <div class="form-group">
          <label>预警颜色：设置预警状态下的显示颜色</label>
          <div style="display: flex; gap: 8px; align-items: center;">
            <input
              type="color"
              @change=${this._entityChanged}
              .value=${this.config.warning_color || 'rgb(255, 0, 0)'}
              name="warning_color"
              style="width: 50px; height: 34px; border: 1px solid #ddd; border-radius: 4px; cursor: pointer;"
            />
            <input
              type="text"
              @change=${this._entityChanged}
              .value=${this.config.warning_color || 'rgb(255, 0, 0)'}
              name="warning_color"
              placeholder="默认：rgb(255, 0, 0)"
              style="flex: 1;"
            />
          </div>
        </div>

        <div class="form-group">
          <label>主题</label>
          <select
            @change=${this._entityChanged}
            .value=${this.config.theme !== undefined ? this.config.theme : 'system'}
            name="theme"
          >
            <option value="system">跟随系统</option>
            <option value="light">浅色主题（白底黑字）</option>
            <option value="dark">深色主题（黑底白字）</option>
          </select>
        </div>

        <div class="form-group">
          <label>设备余额实体：搜索并选择实体</label>
          ${this._renderEntitySelector()}
          ${this._renderSelectedEntities()}
          <div class="help-text">
            搜索并选择要显示的设备余额实体，支持多选。每个实体可以配置：<br>
            • 属性名：留空使用实体状态，或输入属性名<br>
            • 名称重定义：勾选后可自定义显示名称<br>
            • 图标重定义：勾选后可自定义图标（如 mdi:phone）<br>
            • 单位重定义：勾选后可自定义单位（如 元、$、kWh 等）<br>
            • 预警条件：勾选后设置预警条件，支持 >10, >=10, <10, <=10, ==10, ==on, ==off, =="hello world" 等<br>
            • 未勾选重定义时，将使用实体的原始属性值
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
      if (!value && name !== 'theme' && name !== 'button_width' && name !== 'button_height' && name !== 'button_font_size' && name !== 'button_icon_size' && name !== 'popup_width' && name !== 'popup_top' && name !== 'display_mode' && name !== 'decimal_precision') return;
      finalValue = value;
    }
    if (name === 'button_width') {
      finalValue = value || '16.8vw';
    } else if (name === 'button_height') {
      finalValue = value || '24px';
    } else if (name === 'button_font_size') {
      finalValue = value || '11px';
    } else if (name === 'button_icon_size') {
      finalValue = value || '13px';
    } else if (name === 'display_mode') {
      finalValue = value || 'min_value';
      if (finalValue === 'min_value') {
        this.config = {
          ...this.config,
          [name]: finalValue,
          specific_entity_id: undefined
        };
        this._fireConfigChanged();
        this.requestUpdate();
        return;
      }
    } else if (name === 'decimal_precision') {
      finalValue = value !== undefined ? parseInt(value) : 1;
    }
    this.config = { ...this.config, [name]: finalValue };
    this._fireConfigChanged();
  }
}
customElements.define('xiaoshi-balance-button-editor', XiaoshiBalanceButtonEditor);

// ==================== 消逝余额按钮 ====================

class XiaoshiBalanceButton extends BalanceBaseMixin(LitElement) {
  static get properties() {
    return {
      hass: Object,
      config: Object,
      _oilPriceData: Array,
      _refreshInterval: Number,
      theme: { type: String }
    };
  }

  static get styles() {
    return css`
      :host {
        display: block;
      }
      .balance-status {
        width: var(--button-width, 65px);
        max-width: 90px;
        height: var(--button-height, 24px);
        padding: 0;
        margin: 0;
        background: var(--bg-color, #fff);
        color: var(--fg-color, #000);
        border-radius: 10px;
        font-size: var(--button-font-size, 11px);
        font-weight: 500;
        text-align: center;
        box-sizing: border-box;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 0;
        cursor: none;
        transition: background-color 0.2s, transform 0.1s;
        position: relative;
      }
      .balance-status:active {
        transform: scale(0.95);
        box-shadow: 0 2px 12px rgba(255, 255, 255, 0.4), 0 2px 8px rgba(0, 0, 0, 0.4);
      }
      .status-emoji {
        font-size: var(--button-icon-size, 13px);
        line-height: 1;
        color: var(--fg-color, #000);
        margin-right: 3px;
      }
    `;
  }

  static getConfigElement() {
    return document.createElement("xiaoshi-balance-button-editor");
  }

  _handleButtonClick() {
    const excludedParams = ['type', 'button_height', 'button_width', 'button_font_size', 'button_icon_size', 'popup_top', 'popup_width', 'display_mode', 'decimal_precision', 'specific_entity_id', 'button_icon', 'transparent_bg', 'lock_white_fg', 'other_cards'];
    const cards = [];
    const balanceCardConfig = {};
    Object.keys(this.config).forEach(key => {
      if (!excludedParams.includes(key)) {
        balanceCardConfig[key] = this.config[key];
      }
    });
    cards.push({
      type: 'custom:xiaoshi-balance-card',
      ...balanceCardConfig
    });
    if (this.config.other_cards && this.config.other_cards.trim()) {
      try {
        const additionalCardsConfig = yamlToJson(this.config.other_cards);
        const cardsWithTheme = additionalCardsConfig.map(card => {
          if (!card.theme && this.config.theme) {
            return { ...card, theme: this.config.theme };
          }
          return card;
        });
        cards.push(...cardsWithTheme);
      } catch (error) {
        console.error('解析附加卡片配置失败:', error);
      }
    }
    const serviceData = { card: cards };
    const popupWidth = this.config.popup_width || '95%';
    const popupTop = this.config.popup_top || '20px';
    if (popupWidth !== '95%') serviceData.popup_width = popupWidth;
    if (popupTop !== '20px') serviceData.popup_top = popupTop;
    serviceData.background = 'transparent';
    this.hass.callService('popup_card', 'show', serviceData);
    this._handleClick();
  }
  render() {
    if (!this.hass) {
      return html`<div></div>`;
    }
    const theme = this._evaluateTheme();
    const fgColor = theme === 'light' ? 'rgb(0, 0, 0)' : 'rgb(255, 255, 255)';
    const transparentBg = this.config.transparent_bg === true;
    const lockWhiteFg = this.config.lock_white_fg === true;
    const buttonIcon = this.config.button_icon || '📱';
    const buttonBgColor = transparentBg ? 'transparent' : theme === 'light' ? 'rgb(255, 255, 255, 0.6)' : 'rgb(83, 83, 83, 0.6)';
    const displayMode = this.config.display_mode || 'min_value';
    const decimalPrecision = this.config.decimal_precision !== undefined ? parseInt(this.config.decimal_precision) : 1;

    let displayValue = null;
    let displayUnit = '元';
    let isWarning = false;

    if (displayMode === 'min_value') {
      const numericValues = this._oilPriceData
        .map(item => {
          const value = parseFloat(item.value);
          return { value: isNaN(value) ? null : value, item };
        })
        .filter(item => item.value !== null);
      if (numericValues.length > 0) {
        const minValue = Math.min(...numericValues.map(item => item.value));
        displayValue = minValue;
        displayUnit = '元';
        if (this.config.global_warning && this.config.global_warning.trim() !== '') {
          isWarning = this._evaluateWarningCondition(displayValue, this.config.global_warning);
        }
      } else {
        displayValue = '无有效数值';
        displayUnit = '';
      }
    } else if (displayMode === 'specific_entity') {
      const specificEntityId = this.config.specific_entity_id;
      if (specificEntityId) {
        const entity = this.hass.states[specificEntityId];
        if (entity) {
          const rawValue = entity.state;
          displayValue = parseFloat(rawValue);
          displayUnit = entity.attributes.unit_of_measurement || '元';
          if (isNaN(displayValue)) {
            displayValue = rawValue;
          } else {
            if (this.config.global_warning && this.config.global_warning.trim() !== '') {
              isWarning = this._evaluateWarningCondition(displayValue, this.config.global_warning);
            }
          }
        } else {
          displayValue = '实体未找到';
          displayUnit = '';
        }
      } else {
        displayValue = '请选择实体';
        displayUnit = '';
      }
    }

    let formattedDisplayValue;
    if (typeof displayValue === 'number') {
      formattedDisplayValue = displayValue.toFixed(decimalPrecision);
      formattedDisplayValue = parseFloat(formattedDisplayValue).toString();
    } else {
      formattedDisplayValue = displayValue;
    }

    const displayText = formattedDisplayValue !== null && displayUnit ? `${formattedDisplayValue}${displayUnit}` : formattedDisplayValue;
    const warningColor = this.config.warning_color || 'rgb(255, 0, 0)';

    let numberColor, iconColor;
    if (isWarning) {
      numberColor = warningColor;
      iconColor = lockWhiteFg ? 'rgb(255, 255, 255)' : fgColor;
    } else {
      numberColor = lockWhiteFg ? 'rgb(255, 255, 255)' : fgColor;
      iconColor = lockWhiteFg ? 'rgb(255, 255, 255)' : fgColor;
    }

    return html`
      <div class="balance-status" style="--fg-color: ${numberColor}; --bg-color: ${buttonBgColor};" @click=${this._handleButtonClick}>
      <span class="status-emoji" style="color: ${iconColor};">${buttonIcon}</span>
        <span style="color: ${numberColor};">${displayText}</span>
      </div>
    `;
  }

  setConfig(config) {
    this.config = { ...config };
    if (config.button_width) {
      this.style.setProperty('--button-width', config.button_width);
    } else {
      this.style.setProperty('--button-width', '16.8vw');
    }
    if (config.button_height) {
      this.style.setProperty('--button-height', config.button_height);
    } else {
      this.style.setProperty('--button-height', '24px');
    }
    if (config.button_font_size) {
      this.style.setProperty('--button-font-size', config.button_font_size);
    } else {
      this.style.setProperty('--button-font-size', '11px');
    }
    if (config.button_icon_size) {
      this.style.setProperty('--button-icon-size', config.button_icon_size);
    } else {
      this.style.setProperty('--button-icon-size', '13px');
    }
    if (config.warning_color) {
      this.style.setProperty('--warning-color', config.warning_color);
    } else {
      this.style.setProperty('--warning-color', 'rgb(255, 0, 0)');
    }
    if (config.theme) {
      this.setAttribute('theme', config.theme);
    }
  }

  getCardSize() {
    return 1;
  }
}
customElements.define('xiaoshi-balance-button', XiaoshiBalanceButton);
