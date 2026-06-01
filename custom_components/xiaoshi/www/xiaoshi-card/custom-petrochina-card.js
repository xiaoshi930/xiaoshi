import { LitElement, html, css } from "https://unpkg.com/lit-element@2.4.0/lit-element.js?module";

window.customCards = window.customCards || [];
window.customCards.push(
  {
    type: 'xiaoshi-petrochina-card',
    name: '中国油价信息卡片',
    description: '中国油价信息卡片',
    preview: true
  }
);

class PetroChinaCardEditor extends LitElement {
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

      .checkbox-label {
        display: flex;
        align-items: center;
        font-weight: normal;
        cursor: pointer;
        font-size: 14px;
        color: #000;
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
          <div class="selected-entities">
            ${this.config.entities && this.config.entities.length > 0 ? html`
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
            ` : ''}
          </div>
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
          <label for="show_province_rank" > 
            显示油价省份排行（默认显示）
          </label>
        </div>
      </div>

    `;
  }

  _entityChanged(e) {
    const { name, value, type, checked } = e.target;
    
    let finalValue;
    // 处理复选框
    if (type === 'checkbox') {
      finalValue = checked;
    } else {
      if (!value && name !== 'theme' && name !== 'width') return;
      finalValue = value;
    }
    
    // 处理不同字段的默认值
    if (name === 'width') {
      finalValue = value || '100%';
    } 
    
    this.config = {
      ...this.config,
      [name]: finalValue
    };
    
    this.dispatchEvent(new CustomEvent('config-changed', {
      detail: { config: this.config },
      bubbles: true,
      composed: true
    }));
  }

  _onEntitySearch(e) {
    const searchTerm = e.target.value.toLowerCase();
    this._searchTerm = searchTerm;
    this._showEntityList = true;
    
    if (!this.hass) return;
    
    // 获取所有实体
    const allEntities = Object.values(this.hass.states);
    
    // 过滤实体
    this._filteredEntities = allEntities.filter(entity => {
      const entityId = entity.entity_id.toLowerCase();
      const friendlyName = (entity.attributes.friendly_name || '').toLowerCase();
      
      return entityId.includes(searchTerm) || friendlyName.includes(searchTerm);
    }).slice(0, 50); // 限制显示数量
    
    this.requestUpdate();
  }

  _toggleEntity(entityId) {
    const currentEntities = this.config.entities || [];
    let newEntities;
    
    if (currentEntities.includes(entityId)) {
      // 移除实体
      newEntities = currentEntities.filter(id => id !== entityId);
    } else {
      // 添加实体
      newEntities = [...currentEntities, entityId];
    }
    
    this.config = {
      ...this.config,
      entities: newEntities
    };
    
    this.dispatchEvent(new CustomEvent('config-changed', {
      detail: { config: this.config },
      bubbles: true,
      composed: true
    }));
    
    this.requestUpdate();
  }

  _removeEntity(entityId) {
    const currentEntities = this.config.entities || [];
    const newEntities = currentEntities.filter(id => id !== entityId);
    
    this.config = {
      ...this.config,
      entities: newEntities
    };
    
    this.dispatchEvent(new CustomEvent('config-changed', {
      detail: { config: this.config },
      bubbles: true,
      composed: true
    }));
    
    this.requestUpdate();
  }

  // 点击外部关闭下拉列表
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

  setConfig(config) {
    this.config = config;
  }
} 
customElements.define('xiaoshi-petrochina-card-editor', PetroChinaCardEditor);

class PetroChinaCard extends LitElement {
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
    return css`
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

      /*标题容器*/
      .card-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 16px;
        background: var(--bg-color, #fff);
        
        border-radius: 12px;
      }

      /*标题红色圆点*/
      .offline-indicator {
        display: inline-block;
        width: 8px;
        height: 8px;
        border-radius: 50%;
        margin-right: 8px;
      }

      /*标题红色圆点动画*/
      @keyframes pulse {
        0% { opacity: 1; }
        50% { opacity: 0.5; }
        100% { opacity: 1; }
      }

      /*标题*/
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

      /*标题统计数字*/
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

      /*标题刷新按钮*/
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

      /*2级标题*/
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
      
      /*2级标题字体*/
      .section-title {
        display: flex;
        align-items: center;
        justify-content: space-between;
        color: var(--fg-color, #000);
        font-size: 13px;
      }

      /*2级标题,统计数量字体*/
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

      /*设备、实体明细*/
      .device-item {
        display: flex;
        align-items: center;
        padding: 0px;
        border-bottom: 1px solid rgb(150,150,150,0.2);
        margin: 0 32px 0px 32px;
      }

      /*设备、实体明细背景*/
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

      /*加油图标样式*/
      .device-details ha-icon {
        --mdc-icon-size: 12px;
        color: var(--fg-color, #000);
      }
    `;
  }

  constructor() {
    super();
    this._oilPriceData = [];
    this._loading = false;
    this._refreshInterval = null;
    this.theme = 'system';
  }

  static getConfigElement() {
    return document.createElement("xiaoshi-petrochina-card-editor");
  }

  connectedCallback() {
    super.connectedCallback();
    this._loadOilPriceData();
    
    // 设置主题属性
    this.setAttribute('theme', this._evaluateTheme());
    
    // 每300秒刷新一次数据，减少频繁刷新
    this._refreshInterval = setInterval(() => {
      this._loadOilPriceData();
    }, 300000);
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
        // 处理本轮调整价格字典
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
          全国油价排序: attributes['全国油价排序'] || []
        });
      }

      this._oilPriceData = oilPriceData;
    } catch (error) {
      console.error('加载油价数据失败:', error);
      this._oilPriceData = [];
    }

    this._loading = false;
  }

  _handleRefresh() {
    this._loadOilPriceData();
  }

  _handleEntityClick(entity) {
    // 点击实体时打开实体详情页
    if (entity.entity_id) {
      const evt = new Event('hass-more-info', { composed: true });
      evt.detail = { entityId: entity.entity_id };
      this.dispatchEvent(evt);
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

  _getPriceColor(text) {
    if (!text) return 'var(--fg-color, #000)';
    
    const lowerText = text.toLowerCase();
    if (lowerText.includes('下调') || lowerText.includes('下降') || lowerText.includes('降')) {
      return '#4CAF50'; // 绿色
    } else if (lowerText.includes('上调') || lowerText.includes('上升') || lowerText.includes('涨')) {
      return '#F44336'; // 红色
    }
    return 'var(--fg-color, #000)'; // 默认颜色
  }

  render() {
    if (!this.hass) {
      return html`<div class="loading">等待Home Assistant连接...</div>`;
    }
    // 获取主题和颜色
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
                        当前油价：<ha-icon icon="mdi:gas-station"></ha-icon> 92#: ¥${oilData.gasoline92}&emsp;<ha-icon icon="mdi:gas-station"></ha-icon> 95#: ¥${oilData.gasoline95}&emsp;<ha-icon icon="mdi:gas-station"></ha-icon> 98#: ¥${oilData.gasoline98}&emsp;<ha-icon icon="mdi:gas-station"></ha-icon> 柴油: ¥${oilData.diesel}
                      </div>
                      ${oilData.current_adjustment_time ? html`
                      <div class="device-details" style="margin-bottom: 2px;">
                        本轮油价： ${oilData.current_adjustment_time}
                      </div>
                      ${oilData.current_adjustment_price ? html`
                        ${oilData.current_adjustment_price.split(',').map(price => html`
                        <div class="device-details" style="margin-bottom: 2px;">
                          　　　${price.trim()}
                        </div>
                        `)}
                      ` : ''}
                      ` : ''}
                      <div class="device-details" style="margin-bottom: 2px;">
                        下轮油价： ${oilData.next_adjustment_time}
                      </div>
                      ${oilData.next_adjustment_price ? html`
                        ${oilData.next_adjustment_price.split(',').map(price => html`
                        <div class="device-details" style="margin-bottom: 2px;">
                          　　　${price.trim()}
                        </div>
                        `)}
                      ` : ''}
                    </div>
                  </div>
                  
                  <!-- 全国油价排名 -->
                  ${oilData.全国油价排序 && this.config.show_province_rank !== false ? html`
                  <div class="section-divider" style="margin-top: 16px;">
                    <div class="section-title">
                      <span>🏆 油价省份排名（价格由低到高，92#与95#均价排行）</span>
                    </div>
                  </div>
                  <div class="device-item">
                    <div class="device-info">
                      ${oilData.全国油价排序.slice(0, 5).map((item, index) => html`
                        <div class="device-details" style="margin-bottom: 4px;">
                          <span style="display: inline-block; width: 60px; color: ${index < 3 ? '#FFD700' : 'inherit'}; font-weight: bold;">${index + 1}.${item.省份}</span><span style="display: inline-block; width: 75px;">92#: ¥${item['92#汽油']}</span><span style="display: inline-block; width: 75px;">95#: ¥${item['95#汽油']}</span><span style="display: inline-block; width: 75px;">柴油: ¥${item['00#柴油']}</span>
                        </div>
                      `)}
                      <div class="device-details" style="margin-bottom: 4px; color: #888;">......</div>
                      ${oilData.全国油价排序.slice(-5).map((item, index) => html`
                        <div class="device-details" style="margin-bottom: 4px;">
                          <span style="display: inline-block; width: 60px; font-weight: bold;">${oilData.全国油价排序.length - 4 + index}.${item.省份}</span><span style="display: inline-block; width: 75px;">92#: ¥${item['92#汽油']}</span><span style="display: inline-block; width: 75px;">95#: ¥${item['95#汽油']}</span><span style="display: inline-block; width: 75px;">柴油: ¥${item['00#柴油']}</span>
                        </div>
                      `)}
                    </div>
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
    
    // 设置CSS变量来控制卡片的宽度和高度
    if (config.width) {
      this.style.setProperty('--card-width', config.width);
    }
    
    // 设置主题
    if (config.theme) {
      this.setAttribute('theme', config.theme);
    }
  }

  getCardSize() {
    // 根据油价实体数量动态计算卡片大小
    const baseSize = 3;
    const entitySize = Math.max(0, Math.min(this._oilPriceData.length * 2, 10));
    return baseSize + entitySize;
  }
}
customElements.define('xiaoshi-petrochina-card', PetroChinaCard);