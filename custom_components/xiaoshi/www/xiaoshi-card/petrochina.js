const whenDefined = (t) => customElements.whenDefined(t);
await Promise.race([whenDefined("ha-card"), whenDefined("ha-panel-lovelace")]);
const LitElement = window.LitElement || Object.getPrototypeOf(customElements.get("ha-card"));
const html = LitElement.prototype.html;
const css = LitElement.prototype.css;
import { yamlToJson } from '../function/function.js';

// ==================== 注册自定义卡片 ====================
window.customCards = window.customCards || [];
window.customCards.push({
  type: 'xiaoshi-petrochina-card',
  name: '中国油价信息卡片',
  description: '中国油价信息卡片',
  preview: true
});
window.customCards.push({
  type: 'xiaoshi-petrochina-button',
  name: '中国油价信息按钮',
  description: '中国油价信息按钮',
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

function getPriceColor(text) {
  if (!text) return 'var(--fg-color, #000)';
  const lowerText = text.toLowerCase();
  if (lowerText.includes('下调') || lowerText.includes('下降') || lowerText.includes('降')) {
    return '#4CAF50';
  } else if (lowerText.includes('上调') || lowerText.includes('上升') || lowerText.includes('涨')) {
    return '#F44336';
  }
  return 'var(--fg-color, #000)';
}

// ==================== 公共CSS样式 ====================

const editorCommonStyles = css`
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
  .checkbox-group {
    display: flex;
    flex-wrap: wrap;
    gap: 15px;
    margin-top: 5px;
  }
  .checkbox-group2 {
  }
  .checkbox-label {
    display: flex;
    align-items: center;
    font-weight: normal;
    cursor: pointer;
    font-size: 14px;
    color: #fff;
  }
  .checkbox-input {
    margin-right: 6px;
    cursor: pointer;
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
  .selected-entity {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    background: #f0f0f0;
    padding: 4px 8px;
    border-radius: 16px;
    margin: 2px 4px 2px 0;
    font-size: 12px;
    color: #000;
  }
  .remove-btn {
    background: none;
    border: none;
    cursor: pointer;
    padding: 0;
    display: flex;
    align-items: center;
    color: #666;
  }
  .remove-btn:hover {
    color: #f44336;
  }
`;

const cardCommonStyles = css`
  :host {
    display: block;
    max-width: 500px; 
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
    background: rgb(255, 0, 0, 0.5);
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
    padding: 0px;
    border-bottom: 1px solid rgb(150,150,150,0.2);
    margin: 0 32px 0px 32px;
  }
  .devices-list {
    flex: 1;
    overflow-y: auto;
    min-height: 0;
    padding: 0 0 8px 0;
  }
  .device-icon {
    margin-right: 12px;
    color: var(--error-color);
  }
  .device-info {
    flex-grow: 1;
    padding: 6px 0;
  }
  .device-name {
    font-weight: 500;
    color: var(--fg-color, #000);
    padding: 6px 0 0 0;
  }
  .device-entity {
    font-size: 10px;
    color: var(--fg-color, #000);
    font-family: monospace;
  }
  .device-details {
    font-size: 10px;
    color: var(--fg-color, #000);
  }
  .device-last-seen {
    font-size: 10px;
    color: var(--fg-color, #000);
    margin-left: auto;
  }
  .no-devices {
    text-align: center;
    padding: 8px 0 0 0;
    color: var(--fg-color, #000);
  }
  .loading {
    text-align: center;
    padding: 0px;
    color: var(--fg-color, #000);
  }
  .device-details ha-icon {
    --mdc-icon-size: 12px;
    color: var(--fg-color, #000);
  }
  .history-section {
    margin: 0 16px;
    padding: 0 8px;
  }
  .history-year-tabs {
    display: flex;
    gap: 6px;
    flex-wrap: wrap;
    justify-content: flex-end;
  }
  .history-year-tab {
    padding: 2px 10px;
    border-radius: 12px;
    border: 1px solid rgb(150,150,150,0.5);
    cursor: pointer;
    font-size: 11px;
    font-weight: 500;
    color: var(--fg-color, #000);
    background: transparent;
    transition: background 0.2s, color 0.2s;
    height: 18px;
    line-height: 18px;
  }
  .history-year-tab.active {
    background: rgb(255,165,0);
    color: #fff;
    border-color: rgb(255,165,0);
  }
  .history-year-tab:hover {
    background: rgb(255,165,0,0.15);
  }
  .history-year-tab.active:hover {
    background: rgb(255,165,0);
  }
  .history-summary {
    padding: 6px 8px;
    margin-bottom: 6px;
    font-size: 11px;
    color: var(--fg-color, #000);
    background: rgba(150,150,150,0.1);
    border-radius: 6px;
  }
  .history-columns {
    display: flex;
    gap: 12px;
  }
  .history-col {
    flex: 1;
    min-width: 0;
  }
  .history-list {
    display: flex;
    flex-direction: column;
  }
  .history-row {
    display: flex;
    align-items: center;
    padding: 3px;
    font-size: 10px;
    color: var(--fg-color, #000);
  }
  .history-date {
    width: 50px;
    flex-shrink: 0;
    color: var(--fg-color, #000);
  }
  .history-type {
    width: 36px;
    flex-shrink: 0;
    font-weight: 500;
  }
  .history-price {
    flex: 1;
    min-width: 0;
  }
`;

// ==================== 编辑器混入（Mixin） ====================

const PetroChinaEditorMixin = (superClass) => class extends superClass {
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
    if (currentEntities.includes(entityId)) {
      newEntities = currentEntities.filter(id => id !== entityId);
    } else {
      newEntities = [...currentEntities, entityId];
    }
    this.config = { ...this.config, entities: newEntities };
    this._fireConfigChanged();
    this.requestUpdate();
  }

  _removeEntity(entityId) {
    const currentEntities = this.config.entities || [];
    const newEntities = currentEntities.filter(id => id !== entityId);
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
                class="entity-option ${this.config.entities && this.config.entities.includes(entity.entity_id) ? 'selected' : ''}"
                @click=${() => this._toggleEntity(entity.entity_id)}
              >
                <div class="entity-info">
                  <ha-icon icon="${entity.attributes.icon || 'mdi:help-circle'}"></ha-icon>
                  <div class="entity-details">
                    <div class="entity-name">${entity.attributes.friendly_name || entity.entity_id}</div>
                    <div class="entity-id">${entity.entity_id}</div>
                  </div>
                </div>
                ${this.config.entities && this.config.entities.includes(entity.entity_id) ?
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
        ${this.config.entities.map(entityId => {
          const entity = this.hass.states[entityId];
          return html`
            <div class="selected-entity">
              <ha-icon icon="${entity?.attributes.icon || 'mdi:help-circle'}"></ha-icon>
              <span>${entity?.attributes.friendly_name || entityId}</span>
              <button class="remove-btn" @click=${() => this._removeEntity(entityId)}>
                <ha-icon icon="mdi:close"></ha-icon>
              </button>
            </div>
          `;
        })}
      </div>
    `;
  }
};

// ==================== 主组件混入（Mixin） ====================

const PetroChinaBaseMixin = (superClass) => class extends superClass {
  constructor() {
    super();
    this._oilPriceData = [];
    this._loading = false;
    this._refreshInterval = null;
    this.theme = 'system';
    this._selectedHistoryYear = null;
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
      const oilPriceData = [];

      for (const entityId of entities) {
        const entity = this.hass.states[entityId];
        if (!entity) continue;

        const attributes = entity.attributes;
        const currentPrice = attributes.本轮调整价格 || {};
        let currentPriceStr = '';
        if (typeof currentPrice === 'object' && currentPrice !== null) {
          currentPriceStr = Object.entries(currentPrice).map(([k, v]) => `${k}: ${v}`).join(', ');
        }

        oilPriceData.push({
          entity_id: entityId,
          friendly_name: attributes.friendly_name || entityId,
          province: attributes.省份 || '未知省份',
          diesel: attributes.柴油 || 0,
          gasoline89: attributes['89#汽油'] || 0,
          gasoline92: attributes['92#汽油'] || 0,
          gasoline95: attributes['95#汽油'] || 0,
          gasoline98: attributes['98#汽油'] || 0,
          current_adjustment_time: attributes.本轮调整时间 || '',
          current_adjustment_price: currentPriceStr,
          next_adjustment_price: attributes.下轮调整价格 || '',
          next_adjustment_time: attributes.下轮调整时间 || '',
          icon: attributes.icon || 'mdi:gas-station',
          expected_adjustment: entity.state || '0',
          全国油价排序: attributes['全国油价排序'] || [],
          调整日历: attributes['调整日历'] || null
        });
      }

      this._oilPriceData = oilPriceData;
    } catch (error) {
      console.error('加载油价数据失败:', error);
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

  _getPriceColor(text) {
    return getPriceColor(text);
  }
};

// ==================== 中国油价卡编辑器 ====================

class XiaoshiPetroChinaCardEditor extends PetroChinaEditorMixin(LitElement) {
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
          <label>油价实体：搜索并选择实体</label>
          ${this._renderEntitySelector()}
          ${this._renderSelectedEntities()}
          <div class="help-text">
            搜索并选择要显示的油价实体，支持多选
          </div>
        </div>
        <div class="checkbox-group2">
          <input
            type="checkbox"
            class="checkbox-input"
            @change=${this._entityChanged}
            .checked=${this.config.show_province_rank !== false}
            name="show_province_rank"
            id="show_province_rank"
          />
          <label for="show_province_rank">
            显示油价省份排行（默认显示）
          </label>
        </div>
        <div class="form-group">
          <label>排行范围</label>
          <select
            @change=${this._entityChanged}
            .value=${this.config.rank_range || '3'}
            name="rank_range"
          >
            <option value="3">前3+后3</option>
            <option value="5">前5+后5</option>
          </select>
        </div>
        <div class="checkbox-group2">
          <input
            type="checkbox"
            class="checkbox-input"
            @change=${this._entityChanged}
            .checked=${this.config.show_adjustment_history !== false}
            name="show_adjustment_history"
            id="show_adjustment_history"
          />
          <label for="show_adjustment_history">
            显示油价调整历史（默认显示）
          </label>
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
      if (!value && name !== 'theme' && name !== 'width') return;
      finalValue = value;
    }
    if (name === 'width') {
      finalValue = value || '100%';
    }
    this.config = { ...this.config, [name]: finalValue };
    this._fireConfigChanged();
  }
}
customElements.define('xiaoshi-petrochina-card-editor', XiaoshiPetroChinaCardEditor);

// ==================== 中国油价卡 ====================

class XiaoshiPetroChinaCard extends PetroChinaBaseMixin(LitElement) {
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
    return document.createElement("xiaoshi-petrochina-card-editor");
  }

  _handleRefresh() {
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

  _selectHistoryYear(year) {
    this._selectedHistoryYear = year;
    this.requestUpdate();
  }

  _renderAdjustmentHistory(calendar) {
    if (!calendar) return '';
    const years = Object.keys(calendar).sort((a, b) => b - a);
    if (years.length === 0) return '';
    const selectedYear = this._selectedHistoryYear || years[0];
    const yearData = calendar[selectedYear];
    if (!yearData) return '';

    const summary = yearData['全年累计'] || '';
    const dates = yearData['日期'] || {};
    const sortedDates = Object.keys(dates).sort((a, b) => a.localeCompare(b));

    // 构建解析后的行数据
    const rows = sortedDates.map(date => {
      const value = dates[date];
      let type = '';
      let typeColor = 'var(--fg-color, #000)';
      let price = '';
      let icon = '';
      if (typeof value === 'string') {
        if (value.includes('上调')) {
          type = '上调';
          typeColor = '#F44336';
          price = value.replace(/上调/, '').replace(/💖/g, '').trim();
          icon = '💖';
        } else if (value.includes('下调')) {
          type = '下调';
          typeColor = '#4CAF50';
          price = value.replace(/下调/, '').replace(/💚/g, '').trim();
          icon = '💚';
        } else if (value.includes('不作调整') || value.includes('不调')) {
          type = '不调';
          typeColor = 'var(--fg-color, #000)';
          price = '';
          icon = '';
        } else {
          type = '';
          price = value;
          icon = '';
        }
      }
      const dateDisplay = date.substring(5).replace('-', '/');
      return { dateDisplay, type, typeColor, price, icon };
    });

    // 分双列
    const mid = Math.ceil(rows.length / 2);
    const leftRows = rows.slice(0, mid);
    const rightRows = rows.slice(mid);

    return html`
      ${summary ? html`
        <div class="history-summary">全年累计：${summary}</div>
      ` : ''}
      <div class="history-columns">
        <div class="history-col">
          ${leftRows.map(row => html`
            <div class="history-row">
              <span class="history-date">${row.dateDisplay}</span>
              <span class="history-type" style="color: ${row.typeColor}">${row.type}</span>
              <span class="history-price">${row.price}${row.icon}</span>
            </div>
          `)}
        </div>
        <div class="history-col">
          ${rightRows.map(row => html`
            <div class="history-row">
              <span class="history-date">${row.dateDisplay}</span>
              <span class="history-type" style="color: ${row.typeColor}">${row.type}</span>
              <span class="history-price">${row.price}${row.icon}</span>
            </div>
          `)}
        </div>
      </div>
    `;
  }

  render() {
    if (!this.hass) {
      return html`<div class="loading">等待Home Assistant连接...</div>`;
    }
    const theme = this._evaluateTheme();
    const fgColor = theme === 'light' ? 'rgb(0, 0, 0)' : 'rgb(255, 255, 255)';
    const bgColor = theme === 'light' ? 'rgb(255, 255, 255)' : 'rgb(50, 50, 50)';

    return html`
      <ha-card style="--fg-color: ${fgColor}; --bg-color: ${bgColor};">
        <div class="card-header">
          <div class="card-title">
            <span class="offline-indicator" style="background: rgb(255,165,0); animation: pulse 2s infinite"></span>
            中国油价信息
          </div>
        </div>
        <div class="devices-list">
          ${this._loading ?
            html`<div class="loading">加载中...</div>` :
            this._oilPriceData.length === 0 ?
              html`<div class="no-devices">请配置油价实体</div>` :
              html`
                ${this._oilPriceData.map(oilData => html`
                  <div class="section-divider">
                    <div class="section-title">
                      <span>${oilData.province}：<span style="color: ${this._getPriceColor(oilData.expected_adjustment)}">${oilData.expected_adjustment}</span></span>
                    </div>
                  </div>
                  <div class="device-item" @click=${() => this._handleEntityClick(oilData)}>
                    <div class="device-info">
                      <div class="device-details" style="margin-bottom: 8px;">
                        当前油价：<ha-icon icon="mdi:gas-station"></ha-icon> 92#: ¥${oilData.gasoline92}&emsp;
                        <ha-icon icon="mdi:gas-station"></ha-icon> 95#: ¥${oilData.gasoline95}&emsp;
                        <ha-icon icon="mdi:gas-station"></ha-icon> 柴油: ¥${oilData.diesel}
                      </div>
                      ${oilData.current_adjustment_time ? html`
                      <div class="device-details" style="margin-bottom: 2px;">
                        本轮油价： ${oilData.current_adjustment_time}
                      </div>
                      ${oilData.current_adjustment_price ? html`
                        ${(() => {
                          const prices = oilData.current_adjustment_price.split(',').map(p => p.trim());
                          const perLiter = prices.filter(p => p.includes('元/升')).map(p => p.replace(/号汽油/, '#').replace(/号柴油/, '#'));
                          const perTon = prices.filter(p => p.includes('元/吨'));
                          return html`
                            ${perLiter.length ? html`<div class="device-details" style="margin-bottom: 2px;">　　${perLiter.join('　　')}</div>` : ''}
                            ${perTon.length ? html`<div class="device-details" style="margin-bottom: 2px;">　　${perTon.join('　　')}</div>` : ''}
                          `;
                        })()}
                      ` : ''}
                      ` : ''}
                      <div class="device-details" style="margin-bottom: 2px;">
                        下轮油价： ${oilData.next_adjustment_time}
                      </div>
                      ${oilData.next_adjustment_price ? html`
                        ${(() => {
                          const prices = oilData.next_adjustment_price.split(',').map(p => p.trim());
                          const perLiter = prices.filter(p => p.includes('元/升')).map(p => p.replace(/号汽油/, '#').replace(/号柴油/, '#'));
                          const perTon = prices.filter(p => p.includes('元/吨'));
                          return html`
                            ${perLiter.length ? html`<div class="device-details" style="margin-bottom: 2px;">　　${perLiter.join('　　')}</div>` : ''}
                            ${perTon.length ? html`<div class="device-details" style="margin-bottom: 2px;">　　${perTon.join('　　')}</div>` : ''}
                          `;
                        })()}
                      ` : ''}
                    </div>
                  </div>
                  ${oilData.全国油价排序 && this.config.show_province_rank !== false ? html`
                  <div class="section-divider" style="margin-top: 16px;">
                    <div class="section-title">
                      <span>🏆 油价省份排名（价格由低到高，92#与95#均价排行）</span>
                    </div>
                  </div>
                  <div class="device-item">
                    <div class="device-info">
                      ${(() => {
                        const rankRange = parseInt(this.config.rank_range) || 3;
                        return html`
                          ${oilData.全国油价排序.slice(0, rankRange).map((item, index) => html`
                            <div class="device-details" style="margin-bottom: 4px;">
                              <span style="display: inline-block; width: 60px; color: ${index < 3 ? '#FFD700' : 'inherit'}; font-weight: bold;">${index + 1}.${item.省份}</span><span style="display: inline-block; width: 75px;">92#: ¥${item['92#汽油']}</span><span style="display: inline-block; width: 75px;">95#: ¥${item['95#汽油']}</span><span style="display: inline-block; width: 75px;">柴油: ¥${item['00#柴油']}</span>
                            </div>
                          `)}
                          <div class="device-details" style="margin-bottom: 4px; color: #888;">......</div>
                          ${oilData.全国油价排序.slice(-rankRange).map((item, index) => html`
                            <div class="device-details" style="margin-bottom: 4px;">
                              <span style="display: inline-block; width: 60px; font-weight: bold;">${oilData.全国油价排序.length - rankRange + 1 + index}.${item.省份}</span><span style="display: inline-block; width: 75px;">92#: ¥${item['92#汽油']}</span><span style="display: inline-block; width: 75px;">95#: ¥${item['95#汽油']}</span><span style="display: inline-block; width: 75px;">柴油: ¥${item['00#柴油']}</span>
                            </div>
                          `)}
                        `;
                      })()}
                    </div>
                  </div>
                  ` : ''}
                  ${oilData.调整日历 && this.config.show_adjustment_history !== false ? html`
                  <div class="section-divider" style="margin-top: 16px;">
                    <div class="section-title">
                      <span>📋 油价调整历史</span>
                      <div class="history-year-tabs">
                        ${Object.keys(oilData.调整日历).sort((a, b) => b - a).map(year => html`
                          <div
                            class="history-year-tab ${year === (this._selectedHistoryYear || Object.keys(oilData.调整日历).sort((a, b) => b - a)[0]) ? 'active' : ''}"
                            @click=${() => this._selectHistoryYear(year)}
                          >${year}年</div>
                        `)}
                      </div>
                    </div>
                  </div>
                  <div class="history-section">
                    ${this._renderAdjustmentHistory(oilData.调整日历)}
                  </div>
                  ` : ''}
                `)}
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
customElements.define('xiaoshi-petrochina-card', XiaoshiPetroChinaCard);

// ==================== 中国油价按钮编辑器 ====================

class XiaoshiPetroChinaButtonEditor extends PetroChinaEditorMixin(LitElement) {
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
        <!-- 按钮特有配置 -->
        <div class="form-group">
          <label>按钮显示图标
          <input
            type="text"
            @change=${this._entityChanged}
            .value=${this.config.button_icon !== undefined ? this.config.button_icon : '⛽'}
            name="button_icon"
            placeholder="⛽"
          /></label>
        </div>

        <div class="checkbox-group2">
          <input
            type="checkbox"
            class="checkbox-input"
            @change=${this._entityChanged}
            .checked=${this.config.transparent_bg === true}
            name="transparent_bg"
            id="transparent_bg"
          />
          <label for="transparent_bg">
            （平板端特性）透明背景（勾选后按钮背景透明）
          </label>
        </div>

        <div class="checkbox-group2">
          <input
            type="checkbox"
            class="checkbox-input"
            @change=${this._entityChanged}
            .checked=${this.config.lock_white_fg === true}
            name="lock_white_fg"
            id="lock_white_fg"
          />
          <label for="lock_white_fg">
          （平板端特性）白色图标文字（勾选后锁定显示白色）
          </label>
        </div>

        <div class="checkbox-group2">
          <input
            type="checkbox"
            class="checkbox-input"
            @change=${this._entityChanged}
            .checked=${this.config.show_province_rank !== false}
            name="show_province_rank"
            id="show_province_rank"
          />
          <label for="show_province_rank">
            显示油价省份排行（默认显示）
          </label>
        </div>

        <div class="form-group">
          <label>排行范围</label>
          <select
            @change=${this._entityChanged}
            .value=${this.config.rank_range || '3'}
            name="rank_range"
          >
            <option value="3">前3+后3</option>
            <option value="5">前5+后5</option>
          </select>
        </div>

        <div class="checkbox-group2">
          <input
            type="checkbox"
            class="checkbox-input"
            @change=${this._entityChanged}
            .checked=${this.config.show_adjustment_history !== false}
            name="show_adjustment_history"
            id="show_adjustment_history"
          />
          <label for="show_adjustment_history">
            显示油价调整历史（默认显示）
          </label>
        </div>

        <div class="form-group">
          <label>显示的油品类型（取实体明细中的第一个）</label>
          <div class="checkbox-group">
            <label class="checkbox-label">
              <input
                type="checkbox"
                class="checkbox-input"
                @change=${this._entityChanged}
                .checked=${this.config.show_diesel === true}
                name="show_diesel"
              />
              柴油
            </label>
            <label class="checkbox-label">
              <input
                type="checkbox"
                class="checkbox-input"
                @change=${this._entityChanged}
                .checked=${this.config.show_gasoline89 === true}
                name="show_gasoline89"
              />
              89#汽油
            </label>
            <label class="checkbox-label">
              <input
                type="checkbox"
                class="checkbox-input"
                @change=${this._entityChanged}
                .checked=${this.config.show_gasoline92 === true}
                name="show_gasoline92"
              />
              92#汽油
            </label>
            <label class="checkbox-label">
              <input
                type="checkbox"
                class="checkbox-input"
                @change=${this._entityChanged}
                .checked=${this.config.show_gasoline95 === true}
                name="show_gasoline95"
              />
              95#汽油
            </label>
            <label class="checkbox-label">
              <input
                type="checkbox"
                class="checkbox-input"
                @change=${this._entityChanged}
                .checked=${this.config.show_gasoline98 === true}
                name="show_gasoline98"
              />
              98#汽油
            </label>
          </div>
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
  template: 测试模板(最好引用模板，否则大概率会报错)'>
          </textarea>
        </div>

        <div class="form-group">
          <label> </label>
          <label>👇👇👇下方是弹出的主卡配置项👇👇👇</label>
          <label> </label>
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
          <label>油价实体：搜索并选择实体</label>
          ${this._renderEntitySelector()}
          ${this._renderSelectedEntities()}
          <div class="help-text">
            搜索并选择要显示的油价实体，支持多选
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
      if (!value && name !== 'theme' && name !== 'button_width' && name !== 'button_height' && name !== 'button_font_size' && name !== 'button_icon_size' && name !== 'popup_width' && name !== 'popup_top' && name !== 'decimal_precision') return;
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
    } else if (name === 'decimal_precision') {
      finalValue = value !== undefined ? parseInt(value) : 1;
    }
    this.config = { ...this.config, [name]: finalValue };
    this._fireConfigChanged();
  }
}
customElements.define('xiaoshi-petrochina-button-editor', XiaoshiPetroChinaButtonEditor);

// ==================== 中国油价按钮 ====================

class XiaoshiPetroChinaButton extends PetroChinaBaseMixin(LitElement) {
  static get properties() {
    return {
      hass: Object,
      config: Object,
      _oilPriceData: Array,
      _loading: Boolean,
      _refreshInterval: Number,
      _dataLoaded: Boolean,
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
        max-width: var(--button-max-width, 90px);
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
      .status-icon {
        --mdc-icon-size: var(--button-icon-size, 13px);
        color: var(--fg-color, #000);
        margin-right: 3px;
        display: inline-flex;
        align-items: center;
      }
      ${cardCommonStyles}
    `;
  }

  static getConfigElement() {
    return document.createElement("xiaoshi-petrochina-button-editor");
  }

  constructor() {
    super();
    this._dataLoaded = false;
  }

  connectedCallback() {
    super.connectedCallback();
    setTimeout(() => {
      this._loadOilPriceData();
    }, 50);
  }

  async _loadOilPriceData() {
    await super._loadOilPriceData();
    this._dataLoaded = true;
  }

  _handleButtonClick() {
    const excludedParams = ['type', 'button_height', 'button_width', 'button_font_size', 'button_icon_size', 'popup_top', 'popup_width'];
    const cards = [];
    const balanceCardConfig = {};
    Object.keys(this.config).forEach(key => {
      if (!excludedParams.includes(key) && key !== 'other_cards') {
        balanceCardConfig[key] = this.config[key];
      }
    });
    cards.push({
      type: 'custom:xiaoshi-petrochina-card',
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
    const bgColor = theme === 'light' ? 'rgb(255, 255, 255)' : 'rgb(50, 50, 50)';

    const transparentBg = this.config.transparent_bg === true;
    const lockWhiteFg = this.config.lock_white_fg === true;
    const buttonIcon = this.config.button_icon || '⛽';
    const buttonBgColor = transparentBg ? 'transparent' : theme === 'light' ? 'rgb(255, 255, 255, 0.6)' : 'rgb(83, 83, 83, 0.6)';
    const decimalPrecision = this.config.decimal_precision !== undefined ? parseInt(this.config.decimal_precision) : 1;

    // 计算按钮显示值
    let displayValue = null;
    let displayUnit = '元/L';

    if (!this._dataLoaded) {
      displayValue = '加载中';
      displayUnit = '';
    } else if (this._oilPriceData.length === 0) {
      displayValue = '无数据';
      displayUnit = '';
    } else {
      const entities = this.config.entities || [];
      let entity = null;
      if (entities.length > 0) {
        entity = this.hass.states[entities[0]];
      }
      if (entity) {
        const attributes = entity.attributes;
        let selectedValue = null;

        // 按优先级检查用户选择的油品类型
        if (this.config.show_gasoline98 === true && attributes['98#汽油']) {
          selectedValue = attributes['98#汽油'];
        } else if (this.config.show_gasoline95 === true && attributes['95#汽油']) {
          selectedValue = attributes['95#汽油'];
        } else if (this.config.show_gasoline92 === true && attributes['92#汽油']) {
          selectedValue = attributes['92#汽油'];
        } else if (this.config.show_gasoline89 === true && attributes['89#汽油']) {
          selectedValue = attributes['89#汽油'];
        } else if (this.config.show_diesel === true && attributes.柴油) {
          selectedValue = attributes.柴油;
        }

        if (selectedValue !== null) {
          displayValue = parseFloat(selectedValue);
          displayUnit = '元/L';
        } else {
          displayValue = '未选择';
          displayUnit = '';
        }
      } else {
        displayValue = '实体未找到';
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
    const iconColor = lockWhiteFg ? 'rgb(255, 255, 255)' : fgColor;

    const buttonHtml = html`
      <div class="balance-status" style="--fg-color: ${fgColor}; --bg-color: ${buttonBgColor};" @click=${this._handleButtonClick}>
      ${(buttonIcon.startsWith('mdi:') ? html`<ha-icon class="status-icon" style="color: ${iconColor};" icon="${buttonIcon}"></ha-icon>` : html`<span class="status-icon" style="color: ${iconColor}; font-size: var(--button-icon-size, 13px); line-height: 1;">${buttonIcon}</span>`)}
        <span style="color: ${iconColor};">${displayText}</span>
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
      this.style.setProperty('--button-max-width', config.button_width);
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
    if (config.theme) {
      this.setAttribute('theme', config.theme);
    }
  }

  getCardSize() {
    return 1;
  }
}
customElements.define('xiaoshi-petrochina-button', XiaoshiPetroChinaButton);
