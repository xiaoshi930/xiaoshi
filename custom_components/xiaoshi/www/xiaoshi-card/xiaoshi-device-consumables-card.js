import { LitElement, html, css } from "https://unpkg.com/lit-element@2.4.0/lit-element.js?module";

class XiaoshiConsumablesCardEditor extends LitElement {
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
            .value=${this.config.theme !== undefined ? this.config.theme : 'on'}
            name="theme"
          >
            <option value="on">浅色主题（白底黑字）</option>
            <option value="off">深色主题（深灰底白字）</option>
          </select>
        </div>
        
        <div class="form-group">
          <label>设备耗材实体：搜索并选择实体</label>
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
          <div class="selected-entities">
            ${this.config.entities && this.config.entities.length > 0 ? html`
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
                        <input 
                          type="checkbox" 
                          class="override-checkbox"
                          @change=${(e) => this._updateEntityOverride(index, 'icon', e.target.checked)}
                          .checked=${entityConfig.overrides?.icon !== undefined}
                        />
                        <span class="override-label">图标:</span>
                        <input 
                          type="text" 
                          class="override-input"
                          @change=${(e) => this._updateEntityOverrideValue(index, 'icon', e.target.value)}
                          .value=${entityConfig.overrides?.icon || ''}
                          placeholder="mdi:icon-name"
                          ?disabled=${entityConfig.overrides?.icon === undefined}
                        />
                      </div>

                      <div class="override-config">
                        <input 
                          type="checkbox" 
                          class="override-checkbox"
                          @change=${(e) => this._updateEntityOverride(index, 'name', e.target.checked)}
                          .checked=${entityConfig.overrides?.name !== undefined}
                        />
                        <span class="override-label">名称:</span>
                        <input 
                          type="text" 
                          class="override-input"
                          @change=${(e) => this._updateEntityOverrideValue(index, 'name', e.target.value)}
                          .value=${entityConfig.overrides?.name || ''}
                          placeholder="自定义名称"
                          ?disabled=${entityConfig.overrides?.name === undefined}
                        />
                      </div>

                      <div class="override-config">
                        <input 
                          type="checkbox" 
                          class="override-checkbox"
                          @change=${(e) => this._updateEntityOverride(index, 'unit_of_measurement', e.target.checked)}
                          .checked=${entityConfig.overrides?.unit_of_measurement !== undefined}
                        />
                        <span class="override-label">单位:</span>
                        <input 
                          type="text" 
                          class="override-input"
                          @change=${(e) => this._updateEntityOverrideValue(index, 'unit_of_measurement', e.target.value)}
                          .value=${entityConfig.overrides?.unit_of_measurement || ''}
                          placeholder="自定义单位"
                          ?disabled=${entityConfig.overrides?.unit_of_measurement === undefined}
                        />
                      </div>
                      
                      <div class="override-config">
                        <input 
                          type="checkbox" 
                          class="override-checkbox"
                          @change=${(e) => this._updateEntityOverride(index, 'warning', e.target.checked)}
                          .checked=${entityConfig.overrides?.warning !== undefined}
                        />
                        <span class="override-label">预警:</span>
                        <input 
                          type="text" 
                          class="override-input"
                          @change=${(e) => this._updateEntityOverrideValue(index, 'warning', e.target.value)}
                          .value=${entityConfig.overrides?.warning || ''}
                          placeholder='>10, <=5, ==on,=="hello world"'
                          ?disabled=${entityConfig.overrides?.warning === undefined}
                        />
                      </div>

                      <div class="override-config">
                        <input 
                          type="checkbox" 
                          class="override-checkbox"
                          @change=${(e) => this._updateEntityOverride(index, 'conversion', e.target.checked)}
                          .checked=${entityConfig.overrides?.conversion !== undefined}
                        />
                        <span class="override-label">换算:</span>
                        <input 
                          type="text" 
                          class="override-input"
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
                    </div>
                  </div>
                `;
              })}
            ` : ''}
          </div>
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
    if (!value && name !== 'theme' && name !== 'width' ) return;
    
    let finalValue = value;
    
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
      newEntities = [...currentEntities, { 
        entity_id: entityId, 
        overrides: undefined
      }];
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

  _removeEntity(index) {
    const currentEntities = this.config.entities || [];
    const newEntities = currentEntities.filter((_, i) => i !== index);
    
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

  _updateEntityAttribute(index, attributeValue) {
    const currentEntities = this.config.entities || [];
    const newEntities = [...currentEntities];
    
    if (newEntities[index]) {
      const trimmedValue = attributeValue.trim();
      if (trimmedValue === '') {
        // 如果属性为空，则从配置中移除 attribute 字段
        const { attribute, ...entityWithoutAttribute } = newEntities[index];
        newEntities[index] = entityWithoutAttribute;
      } else {
        // 如果属性不为空，则设置属性值
        newEntities[index] = {
          ...newEntities[index],
          attribute: trimmedValue
        };
      }
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

  _updateEntityOverrideValue(index, overrideType, value) {
    const currentEntities = this.config.entities || [];
    const newEntities = [...currentEntities];
    
    if (newEntities[index] && newEntities[index].overrides && newEntities[index].overrides[overrideType] !== undefined) {
      const overrides = { ...newEntities[index].overrides };
      overrides[overrideType] = value.trim();
      
      newEntities[index] = {
        ...newEntities[index],
        overrides: overrides
      };
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
customElements.define('xiaoshi-consumables-card-editor', XiaoshiConsumablesCardEditor);

class XiaoshiConsumablesCard extends LitElement {
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
        background: rgba(255, 0, 0, 0.7);
        color: #fff;
      }
      
      .device-count.zero {
        background: rgba(0, 205, 0, 0.7);
        color: #fff;
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
        padding: 0;
        border-bottom: 1px solid rgb(150,150,150,0.5);
        cursor: pointer;
        transition: background-color 0.2s;
        min-height: 30px;
        max-height: 30px;
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

      /*2列布局容器*/
      .devices-grid {
        display: grid;
        grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
        gap: 0 15px;
        padding: 0px 16px;
        width: 100%;
        box-sizing: border-box;
        overflow: hidden;
      }

      /*强制每列等宽*/
      .devices-grid > * {
        min-width: 0;
        width: 100%;
        box-sizing: border-box;
        overflow: hidden;
      }

      /*2列布局中的设备项*/
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

      /*2列布局中的第一行顶部边框*/
      .devices-grid .device-item:nth-child(1),
      .devices-grid .device-item:nth-child(2) {
        border-top: 1px solid rgb(150,150,150,0.5);
      }

      /*1列布局保持原有样式*/
      .devices-list.single-column {
        padding: 0 0 8px 0;
      }

      .device-left {
        display: flex;
        align-items: center;
        flex: 1;
        min-width: 0;
        overflow: hidden;
      }

      .device-icon {
        margin-right: 8px;
        color: var(--fg-color, #000);
        flex-shrink: 0;
        font-size: 11px;
        width: 12px;
        height: 12px;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .device-name {
        color: var(--fg-color, #000);
        font-size: 11px;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        flex: 1;
        min-width: 0;
      }

      .device-value {
        color: var(--fg-color, #000);
        font-size: 11px;
        flex-shrink: 0;
        font-weight: bold;
        max-width: 45%;
        text-align: right;
        overflow: hidden;
        white-space: nowrap;
      }

      .device-value.warning {
        color: #F44336;
      }

      .device-unit {
        font-size: 11px;
        color: var(--fg-color, #000);
        margin-left: 0.5px;
        font-weight: bold;
        white-space: nowrap;
        flex-shrink: 0;
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
    this.theme = 'on';
  }

  static getConfigElement() {
    return document.createElement("xiaoshi-consumables-card-editor");
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
      if (!this.config || !this.config.theme) return 'on';
      if (typeof this.config.theme === 'function') {
          return this.config.theme();
      }
      if (typeof this.config.theme === 'string' && 
              (this.config.theme.includes('return') || this.config.theme.includes('=>'))) {
          return (new Function(`return ${this.config.theme}`))();
      }
      return this.config.theme;
    } catch(e) {
      console.error('计算主题时出错:', e);
      return 'on';
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
      const consumablesData = [];

      for (const entityConfig of entities) {
        const entityId = entityConfig.entity_id;
        const attributeName = entityConfig.attribute;
        const entity = this.hass.states[entityId];
        if (!entity) continue;

        const attributes = entity.attributes;
        let value = entity.state;
        let unit = '元';

        // 如果指定了属性，则使用属性值
        if (attributeName && attributes[attributeName] !== undefined) {
          value = attributes[attributeName];
        }

        // 特殊实体类型的数值显示逻辑
        if (!attributeName) {
          // binary_sensor 实体：off显示正常，on显示缺少
          if (entityId.startsWith('binary_sensor.')) {
            if (value === 'off') {
              value = '正常';
            } else if (value === 'on') {
              value = '缺少';
            }
          }
          // event 实体：unknown显示正常，非unknown或不可用时显示低电量
          else if (entityId.startsWith('event.')) {
            if (value === 'unknown') {
              value = '正常';
            } else if (value !== 'unknown' && value !== 'unavailable') {
              value = '低电量';
            }
          }
        }

        // 尝试从属性中获取单位
        if (attributes.unit_of_measurement) {
          unit = attributes.unit_of_measurement;
        } else {
          // 如果实体没有单位，则不显示单位
          unit = '';
        }

        // 应用属性重定义
        let friendlyName = attributes.friendly_name || entityId;
        let icon = attributes.icon || 'mdi:help-circle';
        let warningThreshold = undefined;
        let conversion = undefined;
        
        // 应用用户自定义的重定义
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
            warningThreshold = entityConfig.overrides.warning; // 保持原始字符串
          }
          if (entityConfig.overrides.conversion !== undefined && entityConfig.overrides.conversion !== '') {
            conversion = entityConfig.overrides.conversion; // 换算表达式
          }
        }

        // 应用换算（只对数值进行换算，不对文本状态进行换算）
        let originalValue = value;
        if (conversion && !isNaN(parseFloat(value))) {
          value = this._applyConversion(value, conversion);
        } else if (conversion && isNaN(parseFloat(value))) {
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

  _handleRefresh() {
    this._handleClick();
    this._loadOilPriceData();
  }

  _handleEntityClick(entity) {
    this._handleClick();
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

  _renderDeviceItem(consumablesData) {
    let isWarning = false;
    
    // 特殊实体类型的默认预警逻辑
    if (consumablesData.entity_id.startsWith('binary_sensor.') && !consumablesData.warning_threshold) {
      // binary_sensor: "缺少"状态时预警
      isWarning = consumablesData.value === '缺少';
    } else if (consumablesData.entity_id.startsWith('event.') && !consumablesData.warning_threshold) {
      // event: "低电量"状态时预警
      isWarning = consumablesData.value === '低电量';
    } else {
      // 使用配置的预警条件
      if (consumablesData.warning_threshold && consumablesData.warning_threshold.trim() !== '') {
        isWarning = this._evaluateWarningCondition(consumablesData.value, consumablesData.warning_threshold);
      } else {
        if (this.config.global_warning && this.config.global_warning.trim() !== '') {
          isWarning = this._evaluateWarningCondition(consumablesData.value, this.config.global_warning);
        }
      }
    }
    
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

  _applyConversion(value, conversion) {
    if (!conversion || !value) return value;
    
    try {
      // 提取数值部分
      const numericValue = parseFloat(value);
      if (isNaN(numericValue)) {
        console.warn(`无法将值 "${value}" 转换为数字进行换算`);
        return value;
      }
      
      // 解析换算表达式
      const match = conversion.match(/^([+\-*/])(\d+(?:\.\d+)?)$/);
      if (!match) {
        console.warn(`无效的换算表达式: "${conversion}"，支持的格式: +10, -10, *1.5, /2`);
        return value;
      }
      
      const operator = match[1];
      const operand = parseFloat(match[2]);
      
      let result;
      switch (operator) {
        case '+':
          result = numericValue + operand;
          break;
        case '-':
          result = numericValue - operand;
          break;
        case '*':
          result = numericValue * operand;
          break;
        case '/':
          result = numericValue / operand;
          break;
        default:
          return value;
      }
      
      // 返回结果，保留适当的小数位数
      return Number.isInteger(result) ? result.toString() : result.toFixed(2).toString();
      
    } catch (error) {
      console.error(`换算时出错: ${error.message}`);
      return value;
    }
  }

  _evaluateWarningCondition(value, condition) {
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

  render() {
    if (!this.hass) {
      return html`<div class="loading">等待Home Assistant连接...</div>`;
    }
    
    const theme = this._evaluateTheme();
    const fgColor = theme === 'on' ? 'rgb(0, 0, 0)' : 'rgb(255, 255, 255)';
    const bgColor = theme === 'on' ? 'rgb(255, 255, 255)' : 'rgb(50, 50, 50)';
    
    const warningCount = this._oilPriceData.filter(consumablesData => {
      let isWarning = false;
      
      // 对于 binary_sensor 和 event，使用默认预警逻辑
      if (consumablesData.entity_id.startsWith('binary_sensor.') && !consumablesData.warning_threshold) {
        // binary_sensor: "缺少"状态时预警
        isWarning = consumablesData.value === '缺少';
      } else if (consumablesData.entity_id.startsWith('event.') && !consumablesData.warning_threshold) {
        // event: "低电量"状态时预警
        isWarning = consumablesData.value === '低电量';
      } else {
        // 使用配置的预警条件
        if (consumablesData.warning_threshold && consumablesData.warning_threshold.trim() !== '') {
          isWarning = this._evaluateWarningCondition(consumablesData.value, consumablesData.warning_threshold);
        } else {
          if (this.config.global_warning && this.config.global_warning.trim() !== '') {
            isWarning = this._evaluateWarningCondition(consumablesData.value, this.config.global_warning);
          }
        }
      }
      
      return isWarning;
    }).length;
    
    return html`
      <ha-card style="--fg-color: ${fgColor}; --bg-color: ${bgColor};">
        <div class="card-header">
          <div class="card-title">
            <span class="offline-indicator" style="background: ${warningCount === 0 ? 'rgb(0,255,0)' : 'rgb(255,0,0)'}; animation: pulse 2s infinite"></span>
            ${this.config.name || '耗材信息统计'}
          </div>
          <div class="device-count ${warningCount > 0 ? 'non-zero' : 'zero'}">
            ${warningCount}
          </div>
        </div>
        
        ${this._loading ? 
          html`<div class="loading">加载中...</div>` :
          
          this._oilPriceData.length === 0 ? 
            html`<div class="no-devices">请配置耗材实体</div>` :
            this.config.columns === '1' ? html`
              <div class="devices-list single-column">
                ${this._oilPriceData.map(consumablesData => this._renderDeviceItem(consumablesData))}
              </div>
            ` : html`
              <div class="devices-grid">
                ${this._oilPriceData.map(consumablesData => this._renderDeviceItem(consumablesData))}
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
