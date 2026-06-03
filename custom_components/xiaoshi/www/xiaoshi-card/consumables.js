import { LitElement, html, css } from "https://unpkg.com/lit-element@2.4.0/lit-element.js?module";

// ==================== 注册自定义卡片 ====================
window.customCards = window.customCards || [];
window.customCards.push({
  type: 'xiaoshi-consumables-card',
  name: '消逝耗材信息卡片',
  description: '消逝耗材信息卡片',
  preview: false
});
window.customCards.push({
  type: 'xiaoshi-consumables-button',
  name: '消逝耗材信息按钮',
  description: '消逝耗材信息按钮',
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

function applyConversion(value, conversion) {
  if (!conversion || !value) return value;
  try {
    const numericValue = parseFloat(value);
    if (isNaN(numericValue)) {
      console.warn(`无法将值 "${value}" 转换为数字进行换算`);
      return value;
    }
    const match = conversion.match(/^([+\-*/])(\d+(?:\.\d+)?)$/);
    if (!match) {
      console.warn(`无效的换算表达式: "${conversion}"，支持的格式: +10, -10, *1.5, /2`);
      return value;
    }
    const operator = match[1];
    const operand = parseFloat(match[2]);
    let result;
    switch (operator) {
      case '+': result = numericValue + operand; break;
      case '-': result = numericValue - operand; break;
      case '*': result = numericValue * operand; break;
      case '/': result = numericValue / operand; break;
      default: return value;
    }
    return Number.isInteger(result) ? result.toString() : result.toFixed(2).toString();
  } catch (error) {
    console.error(`换算时出错: ${error.message}`);
    return value;
  }
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
  .checkbox-group {
    display: flex;
    align-items: center;
    gap: 0;
    margin: 0;
    padding: 0;
  }
  .checkbox-input {
    margin: 0;
  }
  .checkbox-label {
    font-weight: normal;
    margin: 0;
  }
`;

const cardCommonStyles = css`
  :host {
    display: block;
    width: var(--card-width, 100%);
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
    background: rgb(250, 20, 0);
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
  .devices-grid {
    display: grid;
    grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
    gap: 0 15px;
    padding: 0px 16px;
    width: 100%;
    box-sizing: border-box;
    overflow: hidden;
  }
  .devices-grid > * {
    min-width: 0;
    width: 100%;
    box-sizing: border-box;
    overflow: hidden;
  }
  .devices-grid .device-item {
    margin: 0.5px 0;
    padding: 0;
    background: var(--bg-color, #fff);
    display: flex;
    align-items: center;
    justify-content: space-between;
    cursor: pointer;
    transition: background-color 0.2s;
    min-height: 30px;
    max-height: 30px;
    border-bottom: none;
    border-right: none;
    border-left: none;
    width: 100%;
    max-width: 100%;
    box-sizing: border-box;
    overflow: hidden;
    border-bottom: 1px solid rgb(150,150,150,0.5);
  }
  .devices-grid .device-item:hover {
    background-color: rgba(150,150,150,0.1);
  }
  .devices-grid .device-item:nth-child(1),
  .devices-grid .device-item:nth-child(2) {
    border-top: 1px solid rgb(150,150,150,0.5);
  }
  .devices-list.single-column {
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

const ConsumablesEditorMixin = (superClass) => class extends superClass {
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
      const trimmedValue = attributeValue.trim();
      if (trimmedValue === '') {
        const { attribute, ...entityWithoutAttribute } = newEntities[index];
        newEntities[index] = entityWithoutAttribute;
      } else {
        newEntities[index] = { ...newEntities[index], attribute: trimmedValue };
      }
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

  _renderSelectedEntities(showConversion) {
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
                    placeholder='>10, <=5, ==on,=="hello world"'
                    ?disabled=${entityConfig.overrides?.warning === undefined}
                  />
                </div>
                ${showConversion ? html`
                  <div class="override-config">
                    <input type="checkbox" class="override-checkbox"
                      @change=${(e) => this._updateEntityOverride(index, 'conversion', e.target.checked)}
                      .checked=${entityConfig.overrides?.conversion !== undefined}
                    />
                    <span class="override-label">换算:</span>
                    <input type="text" class="override-input"
                      @change=${(e) => this._updateEntityOverrideValue(index, 'conversion', e.target.value)}
                      .value=${entityConfig.overrides?.conversion || ''}
                      placeholder="+10, -10, *1.5, /2"
                      ?disabled=${entityConfig.overrides?.conversion === undefined}
                    />
                  </div>
                  <div class="help-text">
                    <strong>预警：</strong>针对单个实体的预警条件，优先级高于全局预警<br>
                    <strong>换算：</strong>对原始数值进行数学运算，支持 +10, -10, *1.5, /2 等格式<br>
                  </div>
                ` : ''}
              </div>
            </div>
          `;
        })}
      </div>
    `;
  }
};

// ==================== 主组件混入（Mixin） ====================

const ConsumablesBaseMixin = (superClass) => class extends superClass {
  constructor() {
    super();
    this._oilPriceData = [];
    this._loading = false;
    this._refreshInterval = null;
    this.theme = 'system';
  }

  _evaluateTheme() {
    return evaluateTheme(this.config);
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
      const consumablesData = [];
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
        if (!attributeName) {
          if (entityId.startsWith('binary_sensor.')) {
            if (value === 'off') value = '正常';
            else if (value === 'on') value = '缺少';
          } else if (entityId.startsWith('event.')) {
            if (value === 'unknown') value = '正常';
            else if (value !== 'unknown' && value !== 'unavailable') value = '低电量';
          }
        }
        if (attributes.unit_of_measurement) {
          unit = attributes.unit_of_measurement;
        } else {
          unit = '';
        }
        let friendlyName = attributes.friendly_name || entityId;
        let icon = attributes.icon || 'mdi:help-circle';
        let warningThreshold = undefined;
        let conversion = undefined;
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
          if (entityConfig.overrides.conversion !== undefined && entityConfig.overrides.conversion !== '') {
            conversion = entityConfig.overrides.conversion;
          }
        }
        let originalValue = value;
        if (conversion && !isNaN(parseFloat(value))) {
          value = applyConversion(value, conversion);
        }
        consumablesData.push({
          entity_id: entityId,
          friendly_name: friendlyName,
          value: value,
          original_value: originalValue,
          unit: unit,
          icon: icon,
          warning_threshold: warningThreshold,
          conversion: conversion
        });
      }
      this._oilPriceData = consumablesData;
    } catch (error) {
      console.error('加载设备耗材数据失败:', error);
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

  _isWarning(consumablesData) {
    if (consumablesData.entity_id.startsWith('binary_sensor.') && !consumablesData.warning_threshold) {
      return consumablesData.value === '缺少';
    } else if (consumablesData.entity_id.startsWith('event.') && !consumablesData.warning_threshold) {
      return consumablesData.value === '低电量';
    } else {
      if (consumablesData.warning_threshold && consumablesData.warning_threshold.trim() !== '') {
        return this._evaluateWarningCondition(consumablesData.value, consumablesData.warning_threshold);
      } else {
        if (this.config.global_warning && this.config.global_warning.trim() !== '') {
          return this._evaluateWarningCondition(consumablesData.value, this.config.global_warning);
        }
      }
    }
    return false;
  }

  _handleEntityClick(entity) {
    this._handleClick();
    if (entity.entity_id) {
      const evt = new Event('hass-more-info', { composed: true });
      evt.detail = { entityId: entity.entity_id };
      this.dispatchEvent(evt);
    }
  }

  _renderDeviceItem(consumablesData) {
    const isWarning = this._isWarning(consumablesData);
    return html`
      <div class="device-item" @click=${() => this._handleEntityClick(consumablesData)}>
        <div class="device-left">
          <ha-icon class="device-icon" icon="${consumablesData.icon}"></ha-icon>
          <div class="device-name">${consumablesData.friendly_name}</div>
        </div>
        <div class="device-value ${isWarning ? 'warning' : ''}">
          ${consumablesData.value}
          <span class="device-unit ${isWarning ? 'warning' : ''}">${consumablesData.unit}</span>
        </div>
      </div>
    `;
  }
};

// ==================== 消逝耗材卡编辑器 ====================

class XiaoshiConsumablesCardEditor extends ConsumablesEditorMixin(LitElement) {
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
            .value=${this.config.name !== undefined ? this.config.name : '耗材信息统计'}
            name="name"
            placeholder="默认：耗材信息统计"
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
          <div class="help-text">
            全局预警条件：当任一实体满足此条件时，该实体显示为红色预警状态<br>
            优先级：明细预警 > 全局预警 > 无预警<br>
            预警基于换算后的结果进行判断（如果配置了换算）
          </div>
        </div>
        <div class="form-group">
          <label>列数：明细显示的列数</label>
          <select
            @change=${this._entityChanged}
            .value=${this.config.columns !== undefined ? this.config.columns : '2'}
            name="columns"
          >
            <option value="1">1列</option>
            <option value="2">2列（默认）</option>
          </select>
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
          <label>设备耗材实体：搜索并选择实体</label>
          ${this._renderEntitySelector()}
          ${this._renderSelectedEntities(true)}
          <div class="help-text">
            搜索并选择要显示的设备耗材实体，支持多选。每个实体可以配置：<br>
            • 属性名：留空使用实体状态，或输入属性名<br>
            • 名称重定义：勾选后可自定义显示名称<br>
            • 图标重定义：勾选后可自定义图标（如 mdi:phone）<br>
            • 单位重定义：勾选后可自定义单位（如 元、$、kWh 等）<br>
            • 预警条件：勾选后设置预警条件，支持 >10, >=10, <10, <=10, ==10, ==on, ==off, =="hello world" 等<br>
            • 换算：对数值进行数学运算，支持 +10, -10, *1.5, /2 等<br>
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
customElements.define('xiaoshi-consumables-card-editor', XiaoshiConsumablesCardEditor);

// ==================== 消逝耗材卡 ====================

class XiaoshiConsumablesCard extends ConsumablesBaseMixin(LitElement) {
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
    return document.createElement("xiaoshi-consumables-card-editor");
  }

  _handleRefresh() {
    this._handleClick();
    this._loadOilPriceData();
  }

  render() {
    if (!this.hass) {
      return html`<div class="loading">等待Home Assistant连接...</div>`;
    }
    const theme = this._evaluateTheme();
    const fgColor = theme === 'light' ? 'rgb(0, 0, 0)' : 'rgb(255, 255, 255)';
    const bgColor = theme === 'light' ? 'rgb(255, 255, 255)' : 'rgb(50, 50, 50)';
    const warningCount = this._oilPriceData.filter(d => this._isWarning(d)).length;

    return html`
      <ha-card style="--fg-color: ${fgColor}; --bg-color: ${bgColor};">
        <div class="card-header">
          <div class="card-title">
            <span class="offline-indicator" style="background: ${warningCount === 0 ? 'rgb(0,255,0)' : 'rgb(255,0,0)'}; animation: pulse 2s infinite"></span>
            ${this.config.name || '耗材信息统计'}
          </div>
          <div class="device-count ${warningCount > 0 ? 'zero' : 'non-zero'}">
            ${warningCount}
          </div>
        </div>
        ${this._loading ?
          html`<div class="loading">加载中...</div>` :
          this._oilPriceData.length === 0 ?
            html`<div class="no-devices">请配置耗材实体</div>` :
            this.config.columns === '1' ? html`
              <div class="devices-list single-column">
                ${this._oilPriceData.map(d => this._renderDeviceItem(d))}
              </div>
            ` : html`
              <div class="devices-grid">
                ${this._oilPriceData.map(d => this._renderDeviceItem(d))}
              </div>
            `
        }
      </ha-card>
    `;
  }

  setConfig(config) {
    this.config = config;
    if (config.width) {
      this.style.setProperty('--card-width', config.width);
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
customElements.define('xiaoshi-consumables-card', XiaoshiConsumablesCard);

// ==================== 消逝耗材按钮编辑器 ====================

class XiaoshiConsumablesButtonEditor extends ConsumablesEditorMixin(LitElement) {
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
          <label>按钮显示文本
          <input
            type="text"
            @change=${this._entityChanged}
            .value=${this.config.button_text !== undefined ? this.config.button_text : '耗材'}
            name="button_text"
            placeholder="耗材"
          /></label>
        </div>

        <div class="form-group">
          <label>按钮显示图标
          <input
            type="text"
            @change=${this._entityChanged}
            .value=${this.config.button_icon !== undefined ? this.config.button_icon : '🔋'}
            name="button_icon"
            placeholder="🔋"
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
            .value=${this.config.name !== undefined ? this.config.name : '耗材信息统计'}
            name="name"
            placeholder="默认：耗材信息统计"
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
          <label>设备耗材实体：搜索并选择实体</label>
          ${this._renderEntitySelector()}
          ${this._renderSelectedEntities(true)}
          <div class="help-text">
            搜索并选择要显示的设备耗材实体，支持多选。每个实体可以配置：<br>
            • 属性名：留空使用实体状态，或输入属性名<br>
            • 名称重定义：勾选后可自定义显示名称<br>
            • 图标重定义：勾选后可自定义图标（如 mdi:phone）<br>
            • 单位重定义：勾选后可自定义单位（如 元、$、kWh 等）<br>
            • 预警条件：勾选后设置预警条件，支持 >10, >=10, <10, <=10, ==10, ==on, ==off, =="hello world" 等<br>
            • 换算：对数值进行数学运算，支持 +10, -10, *1.5, /2 等<br>
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
      if (!value && name !== 'theme' && name !== 'button_width' && name !== 'button_height' && name !== 'button_font_size' && name !== 'button_icon_size' && name !== 'popup_width' && name !== 'popup_top' && name !== 'display_mode' && name !== 'decimal_precision' && name !== 'button_text') return;
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
customElements.define('xiaoshi-consumables-button-editor', XiaoshiConsumablesButtonEditor);

// ==================== 消逝耗材按钮 ====================

class XiaoshiConsumablesButton extends ConsumablesBaseMixin(LitElement) {
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
    return [cardCommonStyles, css`
      :host {
        display: block;
        width: var(--card-width, 100%);
      }
      .balance-status {
        width: var(--button-width, 65px);
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
    `];
  }

  constructor() {
    super();
    this._popupOverlay = null;
    this._popupElement = null;
    this._popupCardElement = null;
    this._popupEscHandler = null;
    this._popupHassUnsubscribe = null;
    this._popupUpdatePending = false;
    this._popupHass = null;
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this._closePopup();
  }

  static getConfigElement() {
    return document.createElement("xiaoshi-consumables-button-editor");
  }

  static _injectPopupStyles() {
    if (XiaoshiConsumablesButton._stylesInjected) return;
    XiaoshiConsumablesButton._stylesInjected = true;
    const style = document.createElement('style');
    style.id = 'xiaoshi-button-popup-style';
    style.textContent = `
      @keyframes xiaoshiButtonPopupIn {
        from { opacity: 0; scale: 0.95; }
        to   { opacity: 1; scale: 1; }
      }
    `;
    document.head.appendChild(style);
  }

  _handleButtonClick() {
    const excludedParams = ['type', 'button_height', 'button_width', 'button_font_size', 'button_icon_size', 'popup_top', 'popup_width', 'display_mode', 'decimal_precision', 'specific_entity_id', 'button_icon', 'button_text', 'transparent_bg', 'lock_white_fg', 'other_cards'];
    
    const cards = [];
    const consumablesCardConfig = {};
    Object.keys(this.config).forEach(key => {
      if (!excludedParams.includes(key)) {
        consumablesCardConfig[key] = this.config[key];
      }
    });
    
    cards.push({
      type: 'custom:xiaoshi-consumables-card',
      ...consumablesCardConfig
    });
    
    if (this.config.other_cards && this.config.other_cards.trim()) {
      try {
        const additionalCardsConfig = this._parseYamlCards(this.config.other_cards);
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
    
    const popupContent = {
      type: 'vertical-stack',
      cards: cards
    };
    
    this._showNativePopup(popupContent);
    this._handleClick();
  }

  _parseYamlCards(yamlString) {
    try {
      const lines = yamlString.split('\n');
      const cards = [];
      let currentCard = null;
      let indentStack = [];
      let contextStack = [];
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#')) continue;
        const indentLevel = line.length - line.trimStart().length;
        if (trimmed.startsWith('- type')) {
          if (currentCard) {
            cards.push(currentCard);
            currentCard = null;
            indentStack = [];
            contextStack = [];
          }
          const content = trimmed.substring(1).trim();
          if (content.includes(':')) {
            const [key, ...valueParts] = content.split(':');
            const value = valueParts.join(':').trim();
            currentCard = {};
            this._setNestedValue(currentCard, key.trim(), this._parseValue(value));
          } else {
            currentCard = { type: content };
          }
          indentStack = [indentLevel];
          contextStack = [currentCard];
        } else if (currentCard && trimmed.startsWith('-')) {
          while (indentStack.length > 1 && indentLevel <= indentStack[indentStack.length - 1]) {
            indentStack.pop();
            contextStack.pop();
          }
          let currentContext = contextStack[contextStack.length - 1];
          const itemValue = trimmed.substring(1).trim();
          if (!Array.isArray(currentContext)) {
            if (contextStack.length > 1) {
              const parentContext = contextStack[contextStack.length - 2];
              for (let key in parentContext) {
                if (parentContext[key] === currentContext) {
                  parentContext[key] = [];
                  contextStack[contextStack.length - 1] = parentContext[key];
                  currentContext = parentContext[key];
                  break;
                }
              }
            }
          }
          if (Array.isArray(currentContext)) {
            if (itemValue.includes(':')) {
              const [key, ...valueParts] = itemValue.split(':');
              const value = valueParts.join(':').trim();
              const obj = {};
              obj[key.trim()] = this._parseValue(value);
              currentContext.push(obj);
            } else {
              currentContext.push(this._parseValue(itemValue));
            }
          }
        } else if (currentCard && trimmed.includes(':')) {
          const [key, ...valueParts] = trimmed.split(':');
          const value = valueParts.join(':').trim();
          const keyName = key.trim();
          while (indentStack.length > 1 && indentLevel <= indentStack[indentStack.length - 1]) {
            indentStack.pop();
            contextStack.pop();
          }
          const currentContext = contextStack[contextStack.length - 1];
          if (value) {
            this._setNestedValue(currentContext, keyName, this._parseValue(value));
          } else {
            let nextLine = null, nextIndent = null;
            for (let j = i + 1; j < lines.length; j++) {
              const nextTrimmed = lines[j].trim();
              if (nextTrimmed && !nextTrimmed.startsWith('#')) {
                nextLine = nextTrimmed;
                nextIndent = lines[j].length - lines[j].trimStart().length;
                break;
              }
            }
            currentContext[keyName] = (nextLine && nextLine.startsWith('-') && nextIndent > indentLevel)
              ? [] : (currentContext[keyName] || {});
            indentStack.push(indentLevel);
            contextStack.push(currentContext[keyName]);
          }
        }
      }
      if (currentCard) cards.push(currentCard);
      return cards;
    } catch (error) {
      console.error('YAML解析错误:', error);
      return [];
    }
  }

  _parseValue(value) {
    if (!value) return '';
    if ((value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))) {
      return value.slice(1, -1);
    }
    if (!isNaN(value) && value.trim() !== '') {
      return Number(value);
    }
    if (value === 'true') return true;
    if (value === 'false') return false;
    if (value === 'null') return null;
    return value;
  }

  _setNestedValue(obj, path, value) {
    const keys = path.split('.');
    let current = obj;
    for (let i = 0; i < keys.length - 1; i++) {
      const key = keys[i];
      if (!current[key] || typeof current[key] !== 'object') {
        current[key] = {};
      }
      current = current[key];
    }
    current[keys[keys.length - 1]] = value;
  }

  _showNativePopup(popupContent) {
    this.constructor._injectPopupStyles();

    const haRoot = document.querySelector('home-assistant');
    const hassObj = haRoot?.hass || haRoot?.shadowRoot?.querySelector('home-assistant-main')?.hass;
    if (!hassObj) {
      console.error('[XiaoshiConsumablesButton] 无法获取 hass 对象');
      return;
    }

    if (this._popupOverlay) {
      this._closePopup();
    }

    const overlay = document.createElement('div');
    overlay.style.cssText = `
      position: fixed;
      top: 0; left: 0; right: 0; bottom: 0;
      background: rgba(0, 0, 0, 0.5);
      z-index: 1000;
      -webkit-backdrop-filter: blur(10px);
      backdrop-filter: blur(10px);
      pointer-events: auto;
    `;
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) this._closePopup();
    });

    const popupTop = this.config.popup_top || '20px';
    const popupWidth = this.config.popup_width || '95%';
    const popupTransform = popupTop === '50%' ? 'translate(-50%, -50%)' : 'translateX(-50%)';

    const popup = document.createElement('div');
    popup.style.cssText = `
      position: fixed;
      top: ${popupTop}; left: 50%;
      transform: ${popupTransform};
      z-index: 1005;
      background: transparent;
      padding: 0;
      width: ${popupWidth};
      max-width: 100vw;
      max-height: 100vh;
      overflow: hidden;
      box-sizing: border-box;
      animation: xiaoshiButtonPopupIn 0.2s ease-out;
    `;

    document.body.appendChild(overlay);
    document.body.appendChild(popup);

    this._popupOverlay = overlay;
    this._popupElement = popup;

    this._createPopupCard(popup, popupContent, hassObj);

    this._popupEscHandler = (e) => {
      if (e.key === 'Escape') this._closePopup();
    };
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
      } else {
        container.innerHTML = '<div style="color:red;padding:20px;">loadCardHelpers 不可用</div>';
      }
    } catch (err) {
      console.error('[XiaoshiConsumablesButton] 创建弹窗卡片失败:', err);
      container.innerHTML = `<div style="color:red;padding:20px;">加载失败: ${err.message}</div>`;
    }
  }

  _closePopup() {
    if (this._popupOverlay) {
      this._popupOverlay.remove();
      this._popupOverlay = null;
    }
    if (this._popupElement) {
      this._popupElement.remove();
      this._popupElement = null;
    }
    this._popupCardElement = null;
    if (this._popupEscHandler) {
      window.removeEventListener('keydown', this._popupEscHandler);
      this._popupEscHandler = null;
    }
    if (this._popupHassUnsubscribe) {
      this._popupHassUnsubscribe();
      this._popupHassUnsubscribe = null;
    }
    this._popupUpdatePending = false;
    this._popupHass = null;
  }

  _startPopupHassWatcher(hassObj) {
    if (this._popupHassUnsubscribe) return;
    this._popupHass = hassObj;
    if (!hassObj || !hassObj.connection) {
      setTimeout(() => this._startPopupHassWatcher(hassObj), 500);
      return;
    }
    try {
      hassObj.connection.subscribeMessage(
        () => {
          if (!this._popupCardElement) return;
          this._schedulePopupUpdate();
        },
        { type: 'subscribe_events', event_type: 'state_changed' }
      ).then((unsub) => {
        this._popupHassUnsubscribe = unsub;
      });
    } catch (err) {
      console.error('[XiaoshiConsumablesButton] 订阅状态变化失败:', err);
    }
  }

  _schedulePopupUpdate() {
    if (this._popupUpdatePending) return;
    this._popupUpdatePending = true;
    requestAnimationFrame(() => {
      this._popupUpdatePending = false;
      if (!this._popupCardElement) return;
      const haRoot = document.querySelector('home-assistant');
      const newHass = haRoot?.hass || haRoot?.shadowRoot?.querySelector('home-assistant-main')?.hass;
      if (!newHass) return;
      if (newHass === this._popupHass) return;
      this._popupHass = newHass;
      this._updatePopupCard();
    });
  }

  _updatePopupCard() {
    if (this._popupCardElement && this._popupHass) {
      try {
        this._popupCardElement.hass = this._popupHass;
      } catch (err) {
        console.warn('[XiaoshiConsumablesButton] 弹窗卡片更新失败:', err.message);
      }
    }
  }

  render() {
    if (!this.hass) {
      return html`<div></div>`;
    }
    const theme = this._evaluateTheme();
    const fgColor = theme === 'light' ? 'rgb(0, 0, 0)' : 'rgb(255, 255, 255)';
    const bgColor = theme === 'light' ? 'rgb(255, 255, 255)' : 'rgb(50, 50, 50)';
    const transparentBg = this.config.transparent_bg === true;
    const lockWhiteFg = this.config.lock_white_fg === true;
    const buttonIcon = this.config.button_icon || '🔋';
    const buttonText = this.config.button_text || '耗材';
    const buttonBgColor = transparentBg ? 'transparent' : theme === 'light' ? 'rgb(255, 255, 255, 0.6)' : 'rgb(83, 83, 83, 0.6)';
    const displayMode = this.config.display_mode || 'min_value';
    const decimalPrecision = this.config.decimal_precision !== undefined ? parseInt(this.config.decimal_precision) : 1;

    // 计算预警数量
    const warningCount = this._oilPriceData.filter(d => this._isWarning(d)).length;

    let displayValue = null;
    let displayUnit = '';
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
        const minItem = numericValues.find(item => item.value === minValue);
        displayValue = minValue;
        displayUnit = minItem.item.unit || '';
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
          displayUnit = entity.attributes.unit_of_measurement || '';
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

    const warningColor = this.config.warning_color || 'rgb(255, 0, 0)';

    // 渲染按钮
    let buttonHtml;
    const displayValueText = formattedDisplayValue !== null && displayUnit ? `${formattedDisplayValue}${displayUnit}` : formattedDisplayValue;
    let numberColor, iconColor;
    if (warningCount > 0) {
      // 预警数量>0时，文字变红
      numberColor = warningColor;
      iconColor = warningColor;
    } else if (isWarning) {
      numberColor = warningColor;
      iconColor = lockWhiteFg ? 'rgb(255, 255, 255)' : fgColor;
    } else {
      numberColor = lockWhiteFg ? 'rgb(255, 255, 255)' : fgColor;
      iconColor = lockWhiteFg ? 'rgb(255, 255, 255)' : fgColor;
    }

    // 构建显示文本
    let textContent = buttonText + ':' + ` ${warningCount}`;

    buttonHtml = html`
      <div class="balance-status" style="--fg-color: ${numberColor}; --bg-color: ${buttonBgColor};" @click=${this._handleButtonClick}>
        <span class="status-emoji" style="color: ${iconColor};">${buttonIcon}</span>
        <span style="color: ${numberColor};">${textContent}</span>
      </div>
    `;

    return html`
      ${buttonHtml}
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
customElements.define('xiaoshi-consumables-button', XiaoshiConsumablesButton);