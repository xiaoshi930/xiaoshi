import { LitElement, html, css } from "https://unpkg.com/lit-element@2.4.0/lit-element.js?module";

window.customCards = window.customCards || [];
window.customCards.push({
    type: 'xiaoshi-birthday-card',
    name: '消逝万年历 - 生日信息卡片',
    description: '消逝万年历日历 - 生日信息卡片',
	  preview: true
});

class XiaoshiBirthdayCardEditor extends LitElement {
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

      .items-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 8px;
        font-weight: bold;
        color: #333;
      }

      .add-item-btn {
        background: #4CAF50;
        color: white;
        border: none;
        border-radius: 4px;
        padding: 4px 8px;
        font-size: 12px;
        cursor: pointer;
        display: flex;
        align-items: center;
        gap: 4px;
      }

      .add-item-btn:hover {
        background: #45a049;
      }

      .items-list {
        max-height: 400px;
        overflow-y: auto;
        border: 1px solid #ddd;
        border-radius: 4px;
        margin-bottom: 8px;
      }

      .item-config {
        border-bottom: 1px solid #eee;
        padding: 8px;
      }

      .item-config:last-child {
        border-bottom: none;
      }

      .item-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 8px;
        font-weight: bold;
        color: #333;
        font-size: 12px;
      }

      .remove-item-btn {
        background: #f44336;
        color: white;
        border: none;
        border-radius: 3px;
        padding: 2px 6px;
        font-size: 10px;
        cursor: pointer;
        display: flex;
        align-items: center;
      }

      .remove-item-btn:hover {
        background: #d32f2f;
      }

      .no-items {
        text-align: center;
        padding: 20px;
        color: #666;
        font-style: italic;
        border: 1px dashed #ddd;
        border-radius: 4px;
        margin-bottom: 8px;
      }

      .sort-options {
        display: flex;
        flex-direction: column;
        gap: 8px;
      }

      .checkbox-option {
        display: flex;
        align-items: center;
        gap: 8px;
        cursor: pointer;
        padding: 4px 0;
      }

      .checkbox-option input[type="checkbox"] {
        margin: 0;
      }

      .checkbox-option span {
        font-size: 14px;
        color: #333;
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
          <label>标题名称：配置卡片显示的标题</label>
          <input 
            type="text" 
            @change=${this._entityChanged}
            .value=${this.config.name !== undefined ? this.config.name : '生日节日信息'}
            name="name"
            placeholder="默认：生日节日信息"
          />
        </div>
        
        <div class="form-group">
          <label>主题</label>
          <select 
            @change=${this._entityChanged}
            .value=${this.config.theme !== undefined ? this.config.theme : 'system'}
            name="theme"
          >
            <option value="system">跟随系统主题</option>
            <option value="light">浅色主题（白底黑字）</option>
            <option value="dark">深色主题（深灰底白字）</option>
          </select>
        </div>
        
        <div class="form-group">
          <label>排序选项</label>
          <div class="sort-options">
            <label class="checkbox-option">
              <input 
                type="checkbox" 
                name="auto_sort"
                @change=${this._entityChanged}
                .checked=${this.config.auto_sort === true}
              />
              <span>自动排序，勾选按照生日天数排序</span>
            </label>
          </div>
        </div>

        <div class="form-group">
          <label>全局预警值：所有明细的默认预警天数（明细可单独覆盖）</label>
          <input 
            type="number" 
            @change=${this._entityChanged}
            .value=${this.config.warning !== undefined ? this.config.warning : ''}
            name="warning"
            placeholder="留空则不预警，例如：7表示7天内预警"
            min="0"
            step="1"
          />
          <div class="help-text">
            • 全局预警值：当生日距离天数小于等于此值时显示红色预警<br>
          </div>
        </div>

        <div class="form-group">
          <label>生日数据实体：搜索并选择包含生日数据的实体</label>
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
                    class="entity-option ${this.config.entity === entity.entity_id ? 'selected' : ''}"
                    @click=${() => this._selectEntity(entity.entity_id)}
                  >
                    <div class="entity-info">
                      <div class="entity-details">
                        <div class="entity-name">${entity.attributes.friendly_name || entity.entity_id}</div>
                        <div class="entity-id">${entity.entity_id}</div>
                      </div>
                      <ha-icon icon="${entity.attributes.icon || 'mdi:help-circle'}"></ha-icon>
                    </div>
                    ${this.config.entity === entity.entity_id ? 
                      html`<ha-icon icon="mdi:check" class="check-icon"></ha-icon>` : ''}
                  </div>
                `)}
                ${this._filteredEntities.length === 0 ? html`
                  <div class="no-results">未找到匹配的实体</div>
                ` : ''}
              </div>
            ` : ''}
          </div>
          ${this.config.entity ? html`
            <div class="selected-entity-config">
              <div class="selected-entity">
                <span>${this.hass.states[this.config.entity]?.attributes.friendly_name || this.config.entity}</span>
                <ha-icon icon="${this.hass.states[this.config.entity]?.attributes.icon || 'mdi:help-circle'}"></ha-icon>
                <button class="remove-btn" @click=${() => this._clearEntity()}>
                  <ha-icon icon="mdi:close"></ha-icon>
                </button>
              </div>
              <div class="attribute-config">
                <div class="items-header">
                  <span>生日明细配置</span>
                  <button class="add-item-btn" @click=${this._addBirthdayItem}>
                    <ha-icon icon="mdi:plus"></ha-icon>
                    添加明细
                  </button>
                </div>
                
                ${this.config.items && this.config.items.length > 0 ? html`
                  <div class="items-list">
                    ${this.config.items.map((item, index) => html`
                      <div class="item-config">
                        <div class="item-header">
                          <span>明细 ${index + 1}</span>
                          <button class="remove-item-btn" @click=${() => this._removeBirthdayItem(index)}>
                            <ha-icon icon="mdi:close"></ha-icon>
                          </button>
                        </div>
                        
                        <div class="override-config">
                          <span class="override-label">序号:</span>
                          <input 
                            type="number" 
                            class="override-input"
                            @change=${(e) => this._updateItemField(index, 'index', e.target.value)}
                            .value=${item.index || '0'}
                            placeholder="0"
                            min="0"
                            step="1"
                          />
                        </div>
                        
                        <div class="override-config">
                          <input 
                            type="checkbox" 
                            class="override-checkbox"
                            .checked=${item.name && item.name.length > 0}
                          />
                          <span class="override-label">名称:</span>
                          <input 
                            type="text" 
                            class="override-input"
                            @change=${(e) => this._updateItemField(index, 'name', e.target.value)}
                            .value=${item.name || ''}
                            placeholder="自定义名称"
                          />
                        </div>
                        
                        <div class="override-config">
                          <input 
                            type="checkbox" 
                            class="override-checkbox"
                            .checked=${item.icon && item.icon.length > 0}
                          />
                          <span class="override-label">图标:</span>
                          <input 
                            type="text" 
                            class="override-input"
                            @change=${(e) => this._updateItemField(index, 'icon', e.target.value)}
                            .value=${item.icon || 'mdi:calendar'}
                            placeholder="mdi:calendar"
                          />
                        </div>

                        <div class="override-config">
                          <input 
                            type="checkbox" 
                            class="override-checkbox"
                            .checked=${item.warning && item.warning.length > 0}
                          />
                          <span class="override-label">预警:</span>
                          <input 
                            type="number" 
                            class="override-input"
                            @change=${(e) => this._updateItemField(index, 'warning', e.target.value)}
                            .value=${item.warning || ''}
                            placeholder="留空使用全局预警值"
                            min="0"
                            step="1"
                          />
                        </div>
                      </div>
                    `)}
                  </div>
                ` : html`
                  <div class="no-items">
                    暂无明细配置，点击"添加明细"开始配置
                  </div>
                `}
                

              </div>
            </div>
          ` : ''}
          <div class="help-text">
            • 排序方式：可选择按序号顺序或按生日顺序排序<br>
            • 明细配置：支持添加多个明细，每个明细可选择不同序号<br>
            • 序号：指定要显示的生日数据序号（0,1,2...）<br>
            • 显示规则：自动选择阳历天数和农历天数中较小的非零值显示<br>
            • 名称重定义：有内容时重定义名称，否则使用默认名称<br>
            • 图标重定义：有内容时重定义图标，否则使用默认图标(mdi:calendar)<br>
            • 预警规则：明细预警值优先于全局预警值，都没有则不预警<br>
            • 全局预警：为所有明细设置统一的预警天数<br>
            • 明细预警：为单个明细设置专属预警天数，覆盖全局设置<br>
            • 自动排序：勾选后按照生日天数升序排列，不勾选按配置顺序显示
          </div>
        </div>
      </div>

    `;
  }

  _entityChanged(e) {
    const { name, value, type, checked } = e.target;
    
    let finalValue = value;
    
    // 处理复选框
    if (type === 'checkbox') {
      finalValue = checked;
    } else {
      if (!value && name !== 'theme' && name !== 'width' ) return;
      
      // 处理不同字段的默认值
      if (name === 'width') {
        finalValue = value || '100%';
      }
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

  _selectEntity(entityId) {
    this.config = {
      ...this.config,
      entity: entityId
    };
    
    this.dispatchEvent(new CustomEvent('config-changed', {
      detail: { config: this.config },
      bubbles: true,
      composed: true
    }));
    
    this.requestUpdate();
  }

  _clearEntity() {
    this.config = {
      ...this.config,
      entity: null
    };
    
    this.dispatchEvent(new CustomEvent('config-changed', {
      detail: { config: this.config },
      bubbles: true,
      composed: true
    }));
    
    this.requestUpdate();
  }

  _updateOverride(overrideType, enabled) {
    if (enabled) {
      this.config = {
        ...this.config,
        [overrideType]: ''
      };
    } else {
      const newConfig = { ...this.config };
      delete newConfig[overrideType];
      this.config = newConfig;
    }
    
    this.dispatchEvent(new CustomEvent('config-changed', {
      detail: { config: this.config },
      bubbles: true,
      composed: true
    }));
    
    this.requestUpdate();
  }

  _updateOverrideValue(overrideType, value) {
    this.config = {
      ...this.config,
      [overrideType]: value.trim()
    };
    
    this.dispatchEvent(new CustomEvent('config-changed', {
      detail: { config: this.config },
      bubbles: true,
      composed: true
    }));
    
    this.requestUpdate();
  }

  _addBirthdayItem() {
    const items = this.config.items || [];
    const newItem = {
      index: items.length.toString(),
      name: '',
      icon: '',
      warning: ''
    };
    
    this.config = {
      ...this.config,
      items: [...items, newItem]
    };
    
    this.dispatchEvent(new CustomEvent('config-changed', {
      detail: { config: this.config },
      bubbles: true,
      composed: true
    }));
    
    this.requestUpdate();
  }

  _removeBirthdayItem(itemIndex) {
    const items = this.config.items || [];
    // 深拷贝剩余的对象
    const newItems = items
      .filter((_, index) => index !== itemIndex)
      .map(item => ({ ...item }));
    
    this.config = {
      ...this.config,
      items: newItems
    };
    
    this.dispatchEvent(new CustomEvent('config-changed', {
      detail: { config: this.config },
      bubbles: true,
      composed: true
    }));
    
    this.requestUpdate();
  }

  _updateItemField(itemIndex, field, value) {
    const items = this.config.items || [];
    // 深拷贝每个对象，避免修改只读对象
    const newItems = items.map(item => ({ ...item }));
    
    if (field.includes('enabled')) {
      newItems[itemIndex][field] = value;
    } else {
      newItems[itemIndex][field] = value.trim();
    }
    
    this.config = {
      ...this.config,
      items: newItems
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
    // 创建新的配置对象，避免修改被冻结的原对象
    this.config = { ...config };
    
    // 如果没有配置实体，设置默认实体
    if (!this.config.entity) {
      this.config = {
        ...this.config,
        entity: 'sensor.lunar_calendar'
      };
    }
    
    // 设置搜索词为当前实体ID
    this._searchTerm = this.config.entity || 'sensor.lunar_calendar';
  }
} 
customElements.define('xiaoshi-birthday-card-editor', XiaoshiBirthdayCardEditor);

class XiaoshiBirthdayCard extends LitElement {
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
        background: rgb(2, 250, 250, 0.5);
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

      /*设备、实体明细背景*/
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
        color: #F44336;
      }

      .device-unit {
        font-size: 12px;
        color: var(--fg-color, #000);
        margin-left: 4px;
        font-weight: bold;
      }

      .device-unit.warning {
        color: #F44336;
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
  }

  constructor() {
    super();
    this._oilPriceData = [];
    this._loading = false;
    this._refreshInterval = null;
    this.theme = 'system';
  }

  static getConfigElement() {
    return document.createElement("xiaoshi-birthday-card-editor");
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
    if (!this.hass || !this.config.entity) return;
    
    this._loading = true;
    this.requestUpdate();

    try {
      const entityId = this.config.entity;
      const attributeName = this.config.attribute;
      const items = this.config.items || [];
      const entity = this.hass.states[entityId];
      
      if (!entity) {
        console.warn('实体不存在:', entityId);
        this._oilPriceData = [];
        this._loading = false;
        return;
      }

      const attributes = entity.attributes;
      let birthdayInfo = null;

      // 直接从 attributes.生日 获取数据
      if (attributes.生日 && Array.isArray(attributes.生日)) {
        birthdayInfo = { 生日: attributes.生日 };
       } else {
        this._oilPriceData = [];
        this._loading = false;
        return;
      }

      const birthdayData = [];

      // 如果没有配置明细，使用默认配置
      const itemsToProcess = items.length > 0 ? items : [{index: '0'}];

      // 处理每个明细配置
      itemsToProcess.forEach(item => {
        const index = parseInt(item.index);
        
        // 通过固定路径 entity.attribute.生日[index] 访问数据
        if (birthdayInfo && birthdayInfo.生日 && Array.isArray(birthdayInfo.生日)) {
          const birthdayArray = birthdayInfo.生日;
          
          // 检查序号是否有效
          if (index >= 0 && index < birthdayArray.length) {
            const person = birthdayArray[index];
            if (person && person.名称) {
              // 获取阳历和农历天数
              const solarDays = person.阳历天数 ? parseInt(person.阳历天数) : null;
              const lunarDays = person.农历天数 ? parseInt(person.农历天数) : null;
              
              // 选择较小的天数（排除空值）
              let days = null;
              let daysType = '';
              let daysDescription = '';
              
              if (solarDays !== null && lunarDays !== null) {
                if (solarDays < lunarDays) {
                  days = solarDays;
                  daysType = '阳历';
                  daysDescription = person.阳历天数说明 || '';
                } else {
                  days = lunarDays;
                  daysType = '农历';
                  daysDescription = person.农历天数说明 || '';
                }
              } else if (solarDays !== null) {
                days = solarDays;
                daysType = '阳历';
                daysDescription = person.阳历天数说明 || '';
              } else if (lunarDays !== null) {
                days = lunarDays;
                daysType = '农历';
                daysDescription = person.农历天数说明 || '';
              }

              if (days !== null) {
                // 应用明细级别的自定义配置
                let friendlyName = item.name ? item.name : person.名称;
                let icon = item.icon ? item.icon : 'mdi:calendar';
                
                // 预警值逻辑：明细优先，全局兜底
                let warningThreshold = undefined;
                if (item.warning && item.warning !== '') {
                  // 明细设置了预警值，使用明细的
                  warningThreshold = parseFloat(item.warning);
                } else if (this.config.warning && this.config.warning !== '') {
                  // 明细没设置但全局设置了，使用全局的
                  warningThreshold = parseFloat(this.config.warning);
                }

                birthdayData.push({
                  entity_id: entityId,
                  position: index,
                  friendly_name: friendlyName,
                  value: days.toString(),
                  unit: '天',
                  icon: icon,
                  days_type: daysType,
                  days_description: daysDescription,
                  solar_birthday: person.阳历生日 || '',
                  lunar_birthday: person.农历生日 || '',
                  warning_threshold: warningThreshold,
                  array_path: `生日[${index}]`,
                  item_index: itemsToProcess.indexOf(item) // 保留明细配置的索引
                });
              }
            }
          }
        }
      });

      // 根据配置决定是否排序
      if (this.config.auto_sort === true) {
        // 按天数排序（天数少的在前）
        birthdayData.sort((a, b) => parseInt(a.value) - parseInt(b.value));
      }
      // 否则按配置顺序显示

      this._oilPriceData = birthdayData;
    } catch (error) {
      console.error('加载生日数据失败:', error);
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
            <span class="offline-indicator" style="background: rgb(0,222,220); animation: pulse 2s infinite"></span>
            ${this.config.name || '生日节日信息'}
          </div>
        </div>
        
        <div class="devices-list">
          ${this._loading ? 
            html`<div class="loading">加载中...</div>` :
            
            this._oilPriceData.length === 0 ? 
              html`<div class="no-devices">请配置生日数据实体</div>` :
              html`
                ${this._oilPriceData.map(birthdayData => {
                  const numericValue = parseFloat(birthdayData.value);
                  const isWarning = birthdayData.warning_threshold !== undefined && 
                                   !isNaN(numericValue) && 
                                   numericValue < birthdayData.warning_threshold;
                  
                  return html`
                    <div class="device-item" @click=${() => this._handleEntityClick(birthdayData)}>
                      <div class="device-left">
                        <ha-icon class="device-icon" icon="${birthdayData.icon}"></ha-icon>
                        <div class="device-name">${birthdayData.friendly_name}</div>
                      </div>
                      <div class="device-value ${isWarning ? 'warning' : ''}">
                        ${birthdayData.value}
                        <span class="device-unit ${isWarning ? 'warning' : ''}">${birthdayData.unit}</span>
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
    // 根据生日数据条目数量动态计算卡片大小
    const baseSize = 3;
    const entitySize = Math.max(0, Math.min(this._oilPriceData.length * 2, 10));
    return baseSize + entitySize;
  }
}
customElements.define('xiaoshi-birthday-card', XiaoshiBirthdayCard);
