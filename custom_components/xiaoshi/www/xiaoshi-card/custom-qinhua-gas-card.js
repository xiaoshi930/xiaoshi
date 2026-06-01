import { LitElement, html, css } from "https://unpkg.com/lit-element@2.4.0/lit-element.js?module";

window.customCards = window.customCards || [];
window.customCards.push(
  {
    type: 'xiaoshi-qinhua-gas-info',
    name: '秦华燃气卡片',
    description: '显示秦华燃气信息，包括余额、用气阶梯和用气统计',
    preview: true
  }
);

class XiaoshiQinhuaGasEditor extends LitElement {
  static get properties() {
    return {
      hass: { type: Object },
      config: { type: Object },
      _balanceSearchTerm: { type: String },
      _filteredBalanceEntities: { type: Array },
      _showBalanceEntityList: { type: Boolean }
    };
  }

  static get styles() {
    return css`
      .form {
        display: flex;
        flex-direction: column;
        gap: 6px;
        padding: 16px;
        width: var(--editor-width, 100%);
        max-width: 100%;
      }

      .form-group {
        display: flex;
        flex-direction: column;
        gap: 6px;
      }

      label {
        font-weight: bold;
        font-size: 14px;
        color: var(--primary-text-color);
      }

      select, input {
        padding: 6px 12px;
        border: 1px solid var(--primary-color);
        border-radius: 4px;
        background: var(--card-background-color);
        color: var(--primary-text-color);
        font-size: 14px;
      }

      .help-text {
        font-size: 12px;
        color: var(--secondary-text-color);
        margin-top: 4px;
      }

      .color-input-wrapper {
        display: flex;
        gap: 3px;
        align-items: center;
      }

      .input-wrapper {
        display: flex;
        gap: 3px;
        align-items: center;
      }

      .color-input {
        width: 70px;
        height: 36px;
        border: 1px solid var(--primary-color);
        border-radius: 4px;
        cursor: pointer;
      }
      .color-text {
        flex: 1;
        height: 22px;
      }

      .checkbox-group {
        display: flex;
        flex-direction: column;
        gap: 8px;
      }
      .checkbox-label {
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: 14px;
        cursor: pointer;
        color: var(--primary-text-color);
        margin: 0 24px;
      }
      .checkbox-icon {
        margin: 0;
      }

      .checkbox-label input[type="checkbox"] {
        width: auto;
        padding: 0;
      }

      /* 余额实体选择器样式 */
      .balance-entity-section {
        border-top: 1px solid var(--divider-color);
        padding-top: 6px;
        margin-top: 6px;
      }

      .balance-entity-search {
        width: 100%;
        padding: 6px 12px;
        border: 1px solid var(--primary-color);
        border-radius: 4px;
        background: var(--card-background-color);
        color: var(--primary-text-color);
        box-sizing: border-box;
        margin-bottom: 8px;
      }

      .selected-balance-entities {
        margin-top: 12px;
      }

      .selected-balance-label {
        font-size: 14px;
        font-weight: bold;
        margin-bottom: 8px;
        color: var(--primary-text-color);
      }

      .layout-select {
        width: 100%;
        padding: 6px 12px;
        border: 1px solid var(--primary-color);
        border-radius: 4px;
        background: var(--card-background-color);
        color: var(--primary-text-color);
        font-size: 14px;
        box-sizing: border-box;
      }

      .entities-per-row-input {
        width: 100%;
        padding: 6px 12px;
        border: 1px solid var(--primary-color);
        border-radius: 4px;
        background: var(--card-background-color);
        color: var(--primary-text-color);
        font-size: 14px;
        box-sizing: border-box;
      }

      .selected-balance-entity {
        margin-bottom: 12px;
        border: 1px solid var(--divider-color);
        border-radius: 4px;
        padding: 8px;
        background: var(--card-background-color);
      }

      .balance-entity-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 8px;
        font-size: 12px;
        color: var(--primary-text-color);
      }

      .balance-entity-info {
        display: flex;
        align-items: center;
        gap: 6px;
        flex: 1;
      }

      .balance-entity-name {
        font-weight: 500;
      }

      .balance-entity-id {
        opacity: 0.7;
        font-family: monospace;
      }

      .remove-balance-btn {
        background: none;
        border: none;
        cursor: pointer;
        padding: 2px;
        color: var(--secondary-text-color);
      }

      .remove-balance-btn:hover {
        color: var(--error-color);
      }

      .balance-entity-overrides {
        display: flex;
        flex-direction: column;
        gap: 6px;
        margin-top: 8px;
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

      .override-row {
        display: flex;
        align-items: center;
        gap: 6px;
      }

      .override-row label {
        font-size: 12px;
        font-weight: normal;
        min-width: 60px;
        margin: 0;
      }

      .override-row input {
        flex: 1;
        padding: 4px 8px;
        font-size: 12px;
      }

      .override-label {
        font-size: 11px;
        color: #666;
        white-space: nowrap;
      }

      .override-input {
        flex: 1;
        padding: 2px 6px;
        border: 1px solid #ddd;
        border-radius: 3px;
        font-size: 11px;
        box-sizing: border-box;
      }

      .balance-name-input {
        width: 100%;
        padding: 6px 12px;
        border: 1px solid var(--primary-color);
        border-radius: 4px;
        background: var(--card-background-color);
        color: var(--primary-text-color);
        box-sizing: border-box;
        margin-bottom: 8px;
      }
    `;
  }

  render() {
    if (!this.hass) return html``;

    const editorWidth = this.config.width || '100%';

    return html`
      <div class="form" style="--editor-width: ${editorWidth}">

        <div class="form-group">
          <label>主题：
          <select 
            @change=${this._valueChanged}
            .value=${this.config.theme !== undefined ? this.config.theme : 'system'}
            name="theme"
          >
            <option value="system">跟随系统</option>
            <option value="light">浅色主题</option>
            <option value="dark">深色主题</option>
          </select>
          </label>
        </div>

        <div class="form-group">
          <label>卡片宽度：
            <input 
              type="text" 
              @change=${this._valueChanged}
              .value=${this.config.width !== undefined ? this.config.width : '100%'}
              name="width"
              placeholder="例如: 100%, 300px"
            />
          </label>
        </div>



        <div class="form-group">
            <label class="color-input-wrapper">用气量数据颜色：
              <input 
                type="color" 
                @change=${this._valueChanged}
                .value=${this.config.color_num !== undefined ? this.config.color_num : '#07d2ff'}
                name="color_num"
                class="color-input"
              />
              <input 
                type="text" 
                @change=${this._valueChanged}
                .value=${this.config.color_num !== undefined ? this.config.color_num : '#07d2ffff'}
                name="color_num"
                class="color-text"
                placeholder="#07d2ff"
              />
          </label>
        </div>

        <div class="form-group">
          <label class="color-input-wrapper">用气费数据颜色：
            <input 
              type="color" 
              @change=${this._valueChanged}
              .value=${this.config.color_cost !== undefined ? this.config.color_cost : '#f30660'}
              name="color_cost"
              class="color-input"
            />
            <input 
              type="text" 
              @change=${this._valueChanged}
              .value=${this.config.color_cost !== undefined ? this.config.color_cost : '#f30660'}
              name="color_cost"
              class="color-text"
              placeholder="#f30660"
            />
          </label>
        </div>

        <div class="form-group">
          <label class="checkbox-label">
            <input 
              type="checkbox" 
              @change=${this._checkboxChanged}
              .checked=${this.config.default_show_calendar !== undefined ? this.config.default_show_calendar : false}
              name="default_show_calendar"
            />
            是否默认弹出日历
          </label>
        </div>

        <!-- 余额实体配置 -->
        <div class="balance-entity-section">
          <div class="form-group">
            <label> 燃气信息标题：</label>
            <input 
              type="text" 
              @change=${this._valueChanged}
              .value=${this.config.balance_name !== undefined ? this.config.balance_name : '燃气信息'}
              name="balance_name"
              placeholder="燃气信息"
              class="balance-name-input"
            />
          </div>

          <div class="form-group">
            <label  class="input-wrapper">全局预警条件</label>
            <input 
              type="text" 
              @change=${this._valueChanged}
              .value=${this.config.global_warning !== undefined ? this.config.global_warning : ''}
              name="global_warning"
              placeholder="例如: <10 或 <=0 或 ==off"
              class="balance-name-input"
            />
          </div>

          <div class="form-group">
            <label>多户号排列方式：</label>
            <select 
              @change=${this._valueChanged}
              .value=${this.config.entity_layout !== undefined ? this.config.entity_layout : 'vertical'}
              name="entity_layout"
              class="layout-select"
            >
              <option value="vertical">纵向排列</option>
              <option value="horizontal">横向排列</option>
            </select>
          </div>

          <div class="form-group" ?hidden=${this.config.entity_layout !== 'horizontal'}>
            <label>每排个数：</label>
            <input 
              type="number" 
              min="1"
              max="10"
              @change=${this._valueChanged}
              .value=${this.config.entities_per_row !== undefined ? this.config.entities_per_row : '3'}
              name="entities_per_row"
              placeholder="3"
              class="entities-per-row-input"
            />
            <div class="help-text">横向排列时每行显示的实体个数（1-10）</div>
          </div>

          <div class="form-group">
            <label>添加余额实体：</label>
            <input 
              type="text" 
              @input=${this._onBalanceEntitySearch}
              @focus=${this._onBalanceEntitySearch}
              .value=${this._balanceSearchTerm || ''}
              placeholder="搜索或输入实体ID..."
              class="balance-entity-search"
            />
            ${this._showBalanceEntityList ? html`
              <div class="entity-dropdown">
                ${this._filteredBalanceEntities.map(entity => html`
                  <div 
                    class="entity-option ${this._isBalanceEntitySelected(entity.entity_id) ? 'selected' : ''}"
                    @click=${() => this._selectBalanceEntity(entity.entity_id)}
                  >
                    <div class="entity-info">
                      <ha-icon icon="${entity.attributes?.icon || 'mdi:help-circle'}"></ha-icon>
                      <div class="entity-details">
                        <div class="entity-name">${entity.attributes?.friendly_name || entity.entity_id}</div>
                        <div class="entity-id">${entity.entity_id}</div>
                      </div>
                    </div>
                    ${this._isBalanceEntitySelected(entity.entity_id) ? 
                      html`<ha-icon icon="mdi:check" class="check-icon"></ha-icon>` : ''}
                  </div>
                `)}
                ${this._filteredBalanceEntities.length === 0 ? html`
                  <div class="no-results">未找到匹配的实体</div>` : ''}
              </div>
            ` : ''}
          </div>

          ${this.config.entities && this.config.entities.length > 0 ? html`
            <div class="selected-balance-entities">
              <div class="selected-balance-label">已选择的余额实体：</div>
              ${this.config.entities.map((entityConfig, index) => {
                const entity = this.hass.states[entityConfig.entity_id];
                const friendlyName = entityConfig.overrides?.name || entity?.attributes?.friendly_name || entityConfig.entity_id;
                
                return html`
                  <div class="selected-balance-entity">
                    <div class="balance-entity-header">
                      <div class="balance-entity-info">
                        <ha-icon icon="${entity?.attributes?.icon || 'mdi:help-circle'}"></ha-icon>
                        <div>
                          <div class="balance-entity-name">${friendlyName}</div>
                          <div class="balance-entity-id">${entityConfig.entity_id}</div>
                        </div>
                      </div>
                      <button 
                        class="remove-balance-btn"
                        @click=${() => this._removeBalanceEntity(index)}
                      >
                        <ha-icon icon="mdi:close"></ha-icon>
                      </button>
                    </div>
                    
                    <div class="balance-entity-overrides">
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
                          @change=${(e) => this._updateEntityOverride(index, 'unit', e.target.checked)}
                          .checked=${entityConfig.overrides?.unit !== undefined}
                        />
                        <span class="override-label">单位:</span>
                        <input 
                          type="text" 
                          class="override-input"
                          @change=${(e) => this._updateEntityOverrideValue(index, 'unit', e.target.value)}
                          .value=${entityConfig.overrides?.unit || ''}
                          placeholder="自定义单位"
                          ?disabled=${entityConfig.overrides?.unit === undefined}
                        />
                      </div>

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

                    </div>
                  </div>
                `;
              })}
            </div>
          ` : ''}
        </div>

      </div>
    `;
  }

  _valueChanged(e) {
    const { name, value } = e.target;
    if (!value) return;
    
    this.config = {
      ...this.config,
      [name]: value
    };
    
    this.dispatchEvent(new CustomEvent('config-changed', {
      detail: { config: this.config },
      bubbles: true,
      composed: true
    }));
  }

  _checkboxChanged(e) {
    const { name, checked } = e.target;
    
    this.config = {
      ...this.config,
      [name]: checked ? 'none' : ''
    };
    
    this.dispatchEvent(new CustomEvent('config-changed', {
      detail: { config: this.config },
      bubbles: true,
      composed: true
    }));
  }

  async firstUpdated() {
    document.addEventListener('click', (e) => {
      if (!e.target.closest('.balance-entity-section')) {
        this._showBalanceEntityList = false;
        this.requestUpdate();
      }
    });
  }

  constructor() {
    super();
    this._balanceSearchTerm = '';
    this._filteredBalanceEntities = [];
    this._showBalanceEntityList = false;
  }

  setConfig(config) {
    this.config = { ...config };
  }

  // 余额实体相关方法
  _onBalanceEntitySearch(e) {
    const searchTerm = e.target.value.toLowerCase();
    this._balanceSearchTerm = searchTerm;
    this._showBalanceEntityList = true;
    
    if (!this.hass) return;
    
    const allEntities = Object.values(this.hass.states);
    
    this._filteredBalanceEntities = allEntities.filter(entity => {
      const entityId = entity.entity_id.toLowerCase();
      const friendlyName = (entity.attributes?.friendly_name || '').toLowerCase();
      
      // 过滤掉已经选择的实体
      const isAlreadySelected = this._isBalanceEntitySelected(entity.entity_id);
      
      // 优先显示sensor.开头的实体
      const isSensorEntity = entityId.startsWith('sensor.');
      const matchesSearch = entityId.includes(searchTerm) || friendlyName.includes(searchTerm);
      
      return isSensorEntity && matchesSearch && !isAlreadySelected;
    }).slice(0, 20);
    
    this.requestUpdate();
  }

  _isBalanceEntitySelected(entityId) {
    return this.config.entities && this.config.entities.some(entity => entity.entity_id === entityId);
  }

  _selectBalanceEntity(entityId) {
    const currentEntities = this.config.entities || [];
    
    // 添加新的余额实体配置
    const newEntity = {
      entity_id: entityId,
    };
    
    this.config = {
      ...this.config,
      entities: [...currentEntities, newEntity]
    };
    
    this._balanceSearchTerm = '';
    
    this.dispatchEvent(new CustomEvent('config-changed', {
      detail: { config: this.config },
      bubbles: true,
      composed: true
    }));
    
    this._showBalanceEntityList = false;
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

  _removeBalanceEntity(index) {
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
}
customElements.define('Xiaoshi-qinhua-gas-editor', XiaoshiQinhuaGasEditor);

class XiaoshiQinhuaGasCard extends LitElement {
  static getConfigElement() {
    return document.createElement("xiaoshi-qinhua-gas-editor");
  }

  static get properties() {
    return {
      hass: { type: Object },
      width: { type: String, attribute: true },
      height: { type: String, attribute: true },
      year: { type: Number },
      month: { type: Number },
      entity: { type: String },
      activeNav: { type: String },
      colorNum: { type: String, attribute: true },
      colorCost: { type: String, attribute: true },
      theme: { type: String },
      config: { type: Object },
      showPanel: { type: String },
      selectedDate: { type: String },
      todayDate: { type: String },
      _balanceData: { type: Array },
      _balanceLoading: { type: Boolean },
      _balanceRefreshInterval: { type: Number },
      _selectedBalanceEntity: { type: String }
    };
  }

  setConfig(config) {
    this.config = config;
    if (config) {
      if (config.width !== undefined) this.width = config.width;
      if (config.year !== undefined) this.year = config.year;
      if (config.month !== undefined) this.month = config.month;
      if (config.color_num !== undefined) this.colorNum = config.color_num;
      if (config.color_cost !== undefined) this.colorCost = config.color_cost;
      if (config.default_show_calendar !== undefined && config.default_show_calendar) {
        this.showPanel = 'calendar';
      }
      this.requestUpdate();
    }
  }

  constructor() {
    super();
    const today = new Date();
    this.year = today.getFullYear();
    this.month = today.getMonth() + 1;
    this.width = '380px';
    this.theme = 'system';
    this.dayData = [];
    this.activeNav = '';
    this.monthData = null;
    this.colorNum = '#07d2ff';
    this.colorCost = '#f30660';
    this.showPanel = ''; // 初始不显示任何面板
    this._balanceData = [];
    this._balanceLoading = false;
    this._balanceRefreshInterval = null;
    this._selectedBalanceEntity = '';
  }

  connectedCallback() {
    super.connectedCallback();
    this._loadBalanceData();
    
    // 每300秒刷新一次数据
    this._balanceRefreshInterval = setInterval(() => {
      this._loadBalanceData();
    }, 300000);
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    if (this._balanceRefreshInterval) {
      clearInterval(this._balanceRefreshInterval);
    }
    // 清理所有定时器
    if (this._dayChartUpdateTimeout) {
      clearTimeout(this._dayChartUpdateTimeout);
      this._dayChartUpdateTimeout = null;
    }
    if (this._monthChartUpdateTimeout) {
      clearTimeout(this._monthChartUpdateTimeout);
      this._monthChartUpdateTimeout = null;
    }
    if (this._dayChartRenderTimeout) {
      clearTimeout(this._dayChartRenderTimeout);
      this._dayChartRenderTimeout = null;
    }
    if (this._monthChartRenderTimeout) {
      clearTimeout(this._monthChartRenderTimeout);
      this._monthChartRenderTimeout = null;
    }
    if (this._chart) {
      this._chart.destroy();
      this._chart = null;
    }
  }

  updated(changedProperties) {
    super.updated(changedProperties);
    
    // 监听_selectedBalanceEntity的变化，立即触发更新
    if (changedProperties.has('_selectedBalanceEntity')) {
      // 立即请求更新，确保子组件收到新的entity
      this.requestUpdate();
      this._renderDayChart();
      this._renderMonthChart();
    }    

  }

  async _loadBalanceData() {
    if (!this.hass || !this.config.entities) return;
    
    this._balanceLoading = true;
    this.requestUpdate();
    
    try {
      const balanceData = [];
      
      for (const entityConfig of this.config.entities) {
        const entity = this.hass.states[entityConfig.entity_id];
        if (!entity) continue;
        
        let value = entity.state;
        let unit = entityConfig.unit || entity.attributes.unit_of_measurement || '';
        let friendlyName = entityConfig.name || entity.attributes.friendly_name || entity.entity_id;
        let icon = entityConfig.icon || entity.attributes.icon || 'mdi:help-circle';
        let warning = entityConfig.warning || '';
        
        // 应用覆盖配置
        if (entityConfig.overrides) {
          if (entityConfig.overrides.name && entityConfig.overrides.name.trim() !== '') {
            friendlyName = entityConfig.overrides.name;
          }
          if (entityConfig.overrides.unit && entityConfig.overrides.unit.trim() !== '') {
            unit = entityConfig.overrides.unit;
          }
          if (entityConfig.overrides.icon && entityConfig.overrides.icon.trim() !== '') {
            icon = entityConfig.overrides.icon;
          }
          if (entityConfig.overrides.warning && entityConfig.overrides.warning.trim() !== '') {
            warning = entityConfig.overrides.warning;
          }
        }
        
        balanceData.push({
          entity_id: entityConfig.entity_id,
          friendly_name: friendlyName,
          value: value,
          unit: unit,
          icon: icon,
          warning: warning
        });
      }
      
      this._balanceData = balanceData;
      
      // 如果没有选中的实体，默认选中第一个
      if (balanceData.length > 0 && !this._selectedBalanceEntity) {
        this._selectedBalanceEntity = balanceData[0].entity_id;
      }
    } catch (error) {
      console.error('加载燃气实体数据失败:', error);
    } finally {
      this._balanceLoading = false;
      this.requestUpdate();
    }
  }

  _calculateTotalAmount() {
    if (!this._balanceData || this._balanceData.length === 0) {
      return '0.00';
    }
    
    let total = 0;
    for (const item of this._balanceData) {
      const value = parseFloat(item.value);
      if (!isNaN(value)) {
        total += value;
      }
    }
    
    return total.toFixed(2);
  }

  _evaluateWarningCondition(value, condition) {
    if (!condition || condition.trim() === '') return false;
    
    // 支持的操作符
    const operators = ['>=', '<=', '>', '<', '==', '!='];
    let operator = null;
    let compareValue = '';
    
    // 查找操作符
    for (const op of operators) {
      if (condition.includes(op)) {
        operator = op;
        const parts = condition.split(op);
        if (parts.length >= 2) {
          compareValue = parts.slice(1).join(op).trim();
        }
        break;
      }
    }
    
    if (!operator) return false;
    
    // 移除比较值两端的引号（如果有的话）
    if ((compareValue.startsWith('"') && compareValue.endsWith('"')) || 
        (compareValue.startsWith("'") && compareValue.endsWith("'"))) {
      compareValue = compareValue.slice(1, -1);
    }
    
    // 尝试将值转换为数字
    const numericValue = parseFloat(value);
    const numericCompare = parseFloat(compareValue);
    
    // 如果两个值都是数字，进行数值比较
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
    
    // 字符串比较
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

  _handleBalanceEntityClick(balanceData) {
    if (!balanceData.entity_id) return;
    
    // 切换选中的实体
    const oldEntity = this._selectedBalanceEntity;
    this._selectedBalanceEntity = balanceData.entity_id;
    
    // 只有当entity真正改变时才请求更新
    if (oldEntity !== this._selectedBalanceEntity) {
      this.requestUpdate();
      
      // 使用setTimeout确保在下一个事件循环中触发更新，避免延迟
      setTimeout(() => {
        this.requestUpdate();
      }, 0);
    }
  }  

  static get styles() {
    return css`
      :host {
        display: block;
      }
      
      .card-header{
        border-radius: 10px;
        padding: 10px;
      }

      .card-main{
        border-radius: 10px;
        padding: 8px;
        padding-bottom: 0px;
        margin-top: 5px;
        margin-bottom: 0px;
      }

      .card-container {
        height: 100%;
        display: flex;
        flex-direction: column;
      }
      
      .top-section {
        display: grid;
        grid-template-columns: 32.8% 65.8%;
        gap: 1.4%;
        margin-bottom: 8px;
        height: 100%;
        align-items: end;
      }
      
      .balance-section {
        display: flex;
        flex-direction: column;
        align-items: center;
        height: 100%;
        justify-content: space-between;
      }
      
      .top-content {
        display: flex;
        flex-direction: column;
        align-items: center;
        width: 100%;
        flex-shrink: 0;
      }
      
      .spacer {
        flex: 1;
        width: 100%;
        min-height: 0px;
        height: auto;
      }

      .balance-icon {
        width: 80px;
        height: 80px;
        margin-bottom: 12px;
        margin-top: 10px;
        border-radius: 6px;
      }
      
      .balance-time {
        font-size: 10px;
        opacity: 0.8;
        margin-top: -7px;
        margin-bottom: 4px;
        text-align: center;
      }
      
      .balance-controls-container {
        display: flex;
        flex-direction: column;
        gap: 6px;
        width: 100%;
      }

      .balance-info {
        border-radius: 6px;
        text-align: center;
        flex: 0 0 auto;
        width: 100%;
        height: 40px;
        line-height: 20px;
      }
      
      .balance-amount {
        font-size: 15px;
        font-weight: bold;
        margin-top: 1px;
        white-space: nowrap;
      }
      
      .balance-amount .currency {
        font-size: 10px;
      }
      
      .balance-label {
        font-size: 10px;
        margin-top: -1px;
        opacity: 0.9;
      }
      
      .days-info {
        border-radius: 6px;
        text-align: center;
        flex: 0 0 auto;
        width: 100%;
        height: 40px;
        line-height: 20px;
      }
      
      .days-amount {
        font-size: 15px;
        font-weight: bold;
        white-space: nowrap;
        margin-top: 1px;
      }

      .days-amount .currency {
        font-size: 10px;
      }
      
      .days-label {
        font-size: 10px;
        margin-top: -1px;
        opacity: 0.9;
      }
      
      .action-buttons {
        display: flex;
        gap: 7px;
        padding: 0;
        width: 100%;
        justify-content: center;
      }
      
      .action-button {
        border-radius: 6px;
        font-size: 10px;
        color: white;
        cursor: pointer;
        transition: all 0.2s ease;
        text-align: center;
        font-weight: 500;
        flex: 1;
        max-width: 33.33%;
        height: 39px;
        line-height: 39px;
        white-space: nowrap;
      }
      
      .action-button.active {
        background: rgba(0, 160, 160, 0.8) !important;
        color: #00ffff;
        font-weight: bold;
      }
      
      .action-button:hover {
        background: rgba(160, 160, 160, 0.6) !important;
      }
      
      .action-button.active:hover {
        background: rgba(0, 160, 160, 0.6) !important;
      }
      
      .panel-section {
        animation: slideIn 0.3s ease-out;
        margin-top: 0px;
      }
      
      @keyframes slideIn {
        from {
          opacity: 0;
          transform: translateY(-10px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }
      
      .right-section {
        display: flex;
        flex-direction: column;
        gap: 6px;
        height: 100%;
      }
      
      .price-area {
        flex: 1;
        display: flex;
        flex-direction: column;
        justify-content: center;
      }
      
      .price-section {
        border-radius: 8px;
        padding: 12px;
        text-align: center;
        height: 100%;
        display: flex;
        flex-direction: column;
        justify-content: center;
      }
      
      .price-title {
        font-size: 14px;
        font-weight: bold;
        margin-bottom: 8px;
        color: white;
      }
      
      .price-value {
        font-size: 18px;
        font-weight: bold;
        color: #00ffff;
      }
      
      .price-details {
        display: flex;
        flex-direction: column;
        gap: 4px;
      }
      
      .price-item {
        font-size: 12px;
        color: white;
        opacity: 0.9;
      }
      
      .ladder-area {
        flex: 1;
        overflow: hidden;
      }
      
      .usage-grid {
        flex: 2;
        display: grid;
        grid-template-columns: 1fr 1fr;
        grid-template-rows: 1fr 1fr;
        gap: 6px;
      }
      
      .middle-section {
        height: 40%;
        margin-bottom: 8px;
      }
      
      .bottom-section {
        padding-top: 7px;
        height: 35%;
        display: flex;
        justify-content: space-between;
        align-items: center;
      }
      
      .ladder-section {
        border-radius: 8px;
        padding: 9px 5px;
        margin: 0px 0px;
        min-height: 95px;
      }
      
      .ladder-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 4px;
        opacity: 0.8;
        font-weight: bold;
        text-align: start;
        font-size: 10px;
      }
      
      .ladder-progress {
        position: relative;
        height: 16px;
        border-radius: 6px;
        margin: 25px 0 4px 0;
        overflow: visible;
      }
      
      .progress-segment {
        position: absolute;
        height: 100%;
        transition: width 0.3s ease;
      }
      
      .progress-segment.level1 {
        background: #4CAF50;
        left: 0;
        width: calc(33.33% + 6px) !important;
        border-radius: 3px 0 0 3px;
        clip-path: polygon(0 0, calc(100% - 6px) 0, 100% 50%, calc(100% - 6px) 100%, 0 100%);
        z-index: 3;
      }
      
      .progress-segment.level2 {
        background: #FFC107;
        left: 33.33%;
        width: calc(33.33% + 6px) !important;
        clip-path: polygon(0 0, calc(100% - 6px) 0, 100% 50%, calc(100% - 6px) 100%, 0 100%);
        z-index: 2;
      }
      
      .progress-segment.level3 {
        background: #FF5722;
        left: 66.66%;
        width: 33.34% !important;
        border-radius: 0 3px 3px 0;
        z-index: 1;
      }
      
      .progress-bubble {
        position: absolute;
        top: -25px;
        transform: translateX(-50%);
        color: white;
        padding: 4px 6px;
        border-radius: 10px;
        font-size: 9px;
        font-weight: bold;
        white-space: nowrap;
        text-align: center;
        line-height: 1.2;
      }
      
      .progress-bubble-arrow {
        position: absolute;
        bottom: 20px;
        transform: translateX(-50%);
        width: 0;
        height: 0;
        border-left: 4px solid transparent;
        border-right: 4px solid transparent;
        border-top: 4px solid;
        border-top-color: inherit;
        z-index: 6;
      }
      
      .progress-indicator {
        position: absolute;
        top: 0;
        bottom: 0;
        width: 3px;
        border-radius: 3px;
        transform: translateX(-50%);
        z-index: 14;
      }
      
      .progress-labels {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        display: flex;
        align-items: center;
        justify-content: space-around;
        pointer-events: none;
        z-index: 5;
      }
      
      .progress-label {
        font-size: 8px;
        color: white;
        font-weight: bold;
        text-align: center;
      }

      .ladder-price-section {
        display: flex;
        justify-content: space-between;
        gap: 2px;
        margin-top: 0px;
      }
      
      .price-block {
        flex: 1;
        padding: 2px 4px;
        border-radius: 4px;
        font-size: 8px;
        text-align: center;
      }
      
      .level1-price {
        background: rgba(76, 175, 80, 0.15);
      }
      
      .level2-price {
        background: rgba(255, 193, 7, 0.15);
      }
      
      .level3-price {
        background: rgba(255, 87, 34, 0.15);
      }
      
      .price-range {
        font-weight: bold;
        margin-bottom: 2px;
        font-size: 9px;
      }
      
      .price-item-block {
        margin: 2px 0;
        font-size: 8px;
        line-height: 1.2;
        white-space: nowrap;
      }
      
      .usage-section {
        text-align: center;
        padding: 4px;
        border-radius: 6px;
        display: flex;
        flex-direction: column;
        justify-content: center;
      }
      
      .usage-title {
        font-size: 10px;
        margin-bottom: 6px;
        opacity: 0.8;
        font-weight: bold;
        text-align: start;
      }
      
      .usage-amount {
        font-size: 10px;
        font-weight: bold;
        display: flex;
        align-items: center;
        position: relative;
        margin-bottom: 8px;
      }
      
      .usage-gas {
        position: absolute;
        left: 0;
        text-align: left;
      }
      
      .usage-cost {
        position: absolute;
        right: 0;
        text-align: right;
      }
      
      .usage-bar {
        height: 14px;
        border-radius: 2px;
        margin-bottom: 2px;
        overflow: hidden;
      }
      
      .usage-bar-fill {
        height: 100%;
        display: flex;
        position: relative;
      }
      
      .usage-bar-text {
        position: absolute;
        top: 50%;
        transform: translateY(-50%);
        font-size: 9px;
        color: white;
        font-weight: bold;
        white-space: nowrap;
        z-index: 1;
      }
      
      .usage-bar-text.tip {
        left: 0;
        width: var(--tip-width, 0);
        text-align: center;
      }
      
      .usage-bar-text.peak {
        left: var(--tip-width, 0);
        width: var(--peak-width, 0);
        text-align: center;
      }
      
      .usage-bar-text.normal {
        left: calc(var(--tip-width, 0) + var(--peak-width, 0));
        width: var(--normal-width, 0);
        text-align: center;
      }
      
      .usage-bar-text.valley {
        left: calc(var(--tip-width, 0) + var(--peak-width, 0) + var(--normal-width, 0));
        width: var(--valley-width, 0);
        text-align: center;
      }
      
      .usage-bar-segment {
        height: 100%;
      }
      
      .usage-labels {
        position: relative;
        height: 8px;
        font-size: 8px;
        line-height: 8px;
        background: transparent;
      }
      
      .usage-label {
        position: absolute;
        top: 0;
        font-weight: bold;
        color: white;
        background: transparent;
      }
      
      .usage-label.tip {
        left: 0;
        width: var(--tip-width, 0);
        text-align: center;
      }
      
      .usage-label.peak {
        left: var(--tip-width, 0);
        width: var(--peak-width, 0);
        text-align: center;
      }
      
      .usage-label.normal {
        left: calc(var(--tip-width, 0) + var(--peak-width, 0));
        width: var(--normal-width, 0);
        text-align: center;
      }
      
      .usage-label.valley {
        left: calc(var(--tip-width, 0) + var(--peak-width, 0) + var(--normal-width, 0));
        width: var(--valley-width, 0);
        text-align: center;
      }
      
      .usage-bar-segment.tip { background: #E91E63; }
      .usage-bar-segment.peak { background: #FF9800; }
      .usage-bar-segment.normal { background: #8BC34A; }
      .usage-bar-segment.valley { background: #00BCD4; }
    
    /*
     * 日历部分  *
     *          */

      .calendar-grid {
        border: 0;
        border-radius: 10px;
        display: grid;
        grid-template-areas:
          "yearlast year yearnext today monthlast month monthnext"
          "week1 week2 week3 week4 week5 week6 week7" 
          "id1 id2 id3 id4 id5 id6 id7" 
          "id8 id9 id10 id11 id12 id13 id14" 
          "id15 id16 id17 id18 id19 id20 id21" 
          "id22 id23 id24 id25 id26 id27 id28" 
          "id29 id30 id31 id32 id33 id34 id35" 
          "id36 id37 id98 id98 id99 id99 id99";
        grid-template-columns: repeat(7, 1fr);
        grid-template-rows: 1fr 0.6fr 1fr 1fr 1fr 1fr 1fr 1fr;
        gap: 0px;
        padding: 10px 4px;
        margin-top: 5px;
      }
      .celltotal {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: 0;
        cursor: default;
        font-size: 15px;
        font-weight: 600;
        white-space: nowrap;
      }
      .cell {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: 0;
        cursor: default;
        font-size: 12px;
        line-height: 12px;
        font-weight: 500;
      }
      .month-cell {
        border-bottom: 0.5px solid rgb(150,150,150,0.8);
        border-right: 0.5px solid  rgb(150,150,150,0.8);
      }
      .month-cell-left {
        border-left: 0.5px solid  rgb(150,150,150,0.8);
      }
      .month-cell-top {
        border-top: 0.5px solid  rgb(150,150,150,0.8);
      }
      .month-cell-right {
        border-right: 0.5px solid  rgb(150,150,150,0.8);
      }
      .month-cell-bottom {
        border-bottom: 0.5px solid rgb(150,150,150,0.8);
      }
      .nav-button {
        cursor: pointer;
        user-select: none;
        font-size: 12px;
        transition: all 0.2s ease;
        border-radius: 10px;
      }
      .nav-button:active {
        transform: scale(0.95);
        opacity: 0.8;
      }
      .active-nav {
        background-color: rgba(0, 160, 160, 0.2);
        border-radius: 4px;
      }
      .today-button {
        cursor: pointer;
        user-select: none;
      }
      .weekday {
      }
      .month-day {
        cursor: pointer;
      }
      .gas-num {
        font-size: 12px;
        line-height: 12px;
      }
      .gas-cost {
        font-size: 12px;
        line-height: 12px;
      }
      .min-usage {
        background-color: rgba(0, 255, 0, 0.2);
      }
      .max-usage {
        background-color: rgba(255, 0, 0, 0.2);
      }
      .summary-info {
        display: flex;
        flex-direction: column;
        align-items:  flex-start;
        justify-content: center;
        font-size: 13px;
        line-height: 16px;
        font-weight: 500;
        padding: 0 0 0 30px;
        white-space: nowrap;
      }    
      
      /* 表头信息 */

      .card-container {
        display: flex;
        flex-direction: column;
        gap: 5px;
      }
      
      .balance-card {
        width: 100%;
        background: var(--bg-color, #fff);
        border-radius: 12px;
      }

      .balance-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 16px;
        background: var(--bg-color, #fff);
        border-radius: 12px;
      }

      .balance-indicator {
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

      .balance-title {
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
      .balance-count {
        color: var(--fg-color, #000);
        border-radius: 8px;
        font-size: 20px;
        height: 30px;
        line-height: 30px;
        text-align: center;
        line-height: 30px;
        font-weight: bold;
        padding: 0px;
      }

      .balance-count.warning {
        color: #F44336;
      }

      .balance-count.warning {
        color: #F44336;
      }

      .balance-devices-list {
        flex: 1;
        overflow-y: auto;
        min-height: 0;
        padding: 0 0 8px 0;
        display: flex;
        flex-direction: column;
        gap: 8px;
      }

      /* 横向布局样式 */
      .balance-devices-list.horizontal {
        display: flex;
        flex-direction: row;
        flex-wrap: wrap;
        gap: 8px;
        padding: 8px;
      }

      .balance-devices-list.horizontal .balance-device-item {
        flex: 0 0 calc((100% - var(--gap-count, 2) * 12px) / var(--items-per-row, 3));
        border: 1px solid rgb(150,150,150,0.5);
        border-radius: 8px;
        margin: 0;
        padding: 12px 0;
      }

      .balance-devices-list.horizontal .balance-device-item:first-child {
        border: 1px solid rgb(150,150,150,0.5);
      }

      .balance-device-item {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin: 0px 8px;
        padding: 8px 0;
        border-bottom: 1px solid rgb(150,150,150,0.5);
        cursor: pointer;
        transition: background-color 0.2s;
      }

      .balance-device-item:first-child {
        border-top: 1px solid rgb(150,150,150,0.5);
      }

      .balance-device-item:hover {
        background-color: rgba(150,150,150,0.1);
      }

      .balance-device-item.selected {
        background-color: rgba(33, 150, 243, 0.2);
        border-left: 3px solid rgb(33, 150, 243);
      }

      .balance-device-left {
        display: flex;
        align-items: center;
        flex: 1;
      }

      .balance-device-icon {
        margin-right: 8px;
        color: var(--fg-color, #000);
        flex-shrink: 0;
      }

      .balance-device-name {
        color: var(--fg-color, #000);
        font-size: 12px;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      .balance-device-value {
        color: var(--fg-color, #000);
        font-size: 12px;
        margin-left: auto;
        flex-shrink: 0;
        font-weight: bold;
      }

      .balance-device-value.warning {
        color: #F44336;
      }

      .balance-device-unit {
        font-size: 12px;
        color: var(--fg-color, #000);
        margin-left: 4px;
        margin-right: 4px;
        font-weight: bold;
      }

      .balance-device-unit.warning {
        color: #F44336;
      }

      .balance-no-devices {
        text-align: center;
        padding: 10px 0;
        color: var(--fg-color, #000);
      }

      .balance-loading {
        text-align: center;
        padding: 10px 0;
        color: var(--fg-color, #000);
      }

      /*每日条形图*/
      .card-chart {
        border: 0;
        border-radius: 10px;
        display: grid;
        grid-template-rows: 20% 80%;
        grid-template-columns: 1fr 1fr;
        grid-template-areas: 
          "label1 label2"
          "chart chart";
        gap: 0px;
        padding: 8px;
        margin-top: 5px;
        height: 300px;
      }
      .label {
        padding: 5px;
      }
      .label1 {
        grid-area: label1;
        text-align: left;
      }
      .label2 {
        grid-area: label2;
        text-align: right;
      } 
      .value {
        font-size: 25px;
        font-weight: bold;
        line-height: 1.2;
        padding: 5px 5px 0 5px;
      }
      .unit {
        font-size: 15px;
      }
      .title {
        font-size: 13px;
        padding: 0 5px 0 5px;
      }
      #chart-container {
        grid-area: chart;
        width: 100%;
        height: 100%;
        will-change: transform;
        transform: translateZ(0);
      }

     `;
  }

  async _loadApexCharts() {
    if (!window.ApexCharts) {
      await new Promise((resolve) => {
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/apexcharts';
        script.onload = resolve;
        document.head.appendChild(script);
      });
    }
  }

  get _processedDayData() {
    const selectedEntityId = this._selectedBalanceEntity;
    if (!selectedEntityId || !this.hass || !this.hass.states[selectedEntityId]) {
      return {};
    }

    const selectedEntity = this.hass.states[selectedEntityId];

    if (!selectedEntity?.attributes?.daylist) return null;
    const daylist = selectedEntity.attributes.daylist;

    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth(); // 0-based
    const currentDay = now.getDate();
    const daysInCurrentMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

    // 构建本月数据映射 day => item，同时找到本月最后有数据的日期
    const currentMonthMap = {};
    let lastDataDay = 0;
    daylist.forEach(item => {
      if (!item?.day) return;
      const d = new Date(item.day.split(' ')[0]);
      if (d.getFullYear() === currentYear && d.getMonth() === currentMonth) {
        currentMonthMap[d.getDate()] = item;
        if (d.getDate() > lastDataDay) lastDataDay = d.getDate();
      }
    });
    // 如果没有本月数据，回退到当前日期
    if (lastDataDay === 0) lastDataDay = currentDay;

    // 构建上月数据映射 day => item
    const lastMonthMap = {};
    daylist.forEach(item => {
      if (!item?.day) return;
      const d = new Date(item.day.split(' ')[0]);
      if (d.getFullYear() === currentYear && d.getMonth() === currentMonth - 1) {
        lastMonthMap[d.getDate()] = item;
      }
      // 处理1月时上年是12月的情况
      if (currentMonth === 0 && d.getFullYear() === currentYear - 1 && d.getMonth() === 11) {
        lastMonthMap[d.getDate()] = item;
      }
    });

    // 上月天数，用于处理上月不足天数时的回退
    const lastMonthDays = new Date(currentYear, currentMonth, 0).getDate();

    // 计算本月已过天数中，与上月同期各指标的日平均差值
    let curGasSum = 0, curCostSum = 0;
    let lastGasSum = 0, lastCostSum = 0;
    let comparedDays = 0;
    for (let d = 1; d <= lastDataDay; d++) {
      const curItem = currentMonthMap[d];
      const lastItem = lastMonthMap[d];
      if (curItem) {
        curGasSum += Number(curItem.dayEleNum) || 0;
        curCostSum += Number(curItem.dayEleCost) || 0;
        if (lastItem) {
          lastGasSum += Number(lastItem.dayEleNum) || 0;
          lastCostSum += Number(lastItem.dayEleCost) || 0;
        }
        comparedDays++;
      }
    }
    const avgDiffGas = comparedDays > 0 ? (curGasSum - lastGasSum) / comparedDays : 0;
    const avgDiffCost = comparedDays > 0 ? (curCostSum - lastCostSum) / comparedDays : 0;

    // 按1-31天生成数据，优先本月，无则用上月
    const categories = [];
    const gasData = [], costData = [];
    const gasIsLast = [], costIsLast = [];
    const gasIsEstimate = [], costIsEstimate = [];

    for (let day = 1; day <= daysInCurrentMonth; day++) {
      categories.push(day);
      const curItem = currentMonthMap[day];
      const lastItem = lastMonthMap[day];
      // 上月不足天数时，用当前月（上月之后的月）对应日期回退
      const overflowDay = day > lastMonthDays ? day - lastMonthDays : null;
      const overflowItem = overflowDay !== null ? currentMonthMap[overflowDay] : null;
      const isFuture = day > lastDataDay;

      // 用气量
      if (curItem && day <= lastDataDay) {
        gasData.push(Number(curItem.dayEleNum) || 0);
        gasIsLast.push(false);
        gasIsEstimate.push(false);
      } else if (isFuture && lastItem) {
        gasData.push(Math.max(0, (Number(lastItem.dayEleNum) || 0) + avgDiffGas));
        gasIsLast.push(true);
        gasIsEstimate.push(true);
      } else if (isFuture && overflowItem) {
        gasData.push(Math.max(0, (Number(overflowItem.dayEleNum) || 0) + avgDiffGas));
        gasIsLast.push(true);
        gasIsEstimate.push(true);
      } else if (lastItem) {
        gasData.push(Number(lastItem.dayEleNum) || 0);
        gasIsLast.push(true);
        gasIsEstimate.push(false);
      } else if (overflowItem) {
        gasData.push(Number(overflowItem.dayEleNum) || 0);
        gasIsLast.push(true);
        gasIsEstimate.push(false);
      } else {
        gasData.push(0);
        gasIsLast.push(false);
        gasIsEstimate.push(false);
      }

      // 气费
      if (curItem && day <= lastDataDay) {
        costData.push(Number(curItem.dayEleCost) || 0);
        costIsLast.push(false);
        costIsEstimate.push(false);
      } else if (isFuture && lastItem) {
        costData.push(Math.max(0, (Number(lastItem.dayEleCost) || 0) + avgDiffCost));
        costIsLast.push(true);
        costIsEstimate.push(true);
      } else if (isFuture && overflowItem) {
        costData.push(Math.max(0, (Number(overflowItem.dayEleCost) || 0) + avgDiffCost));
        costIsLast.push(true);
        costIsEstimate.push(true);
      } else if (lastItem) {
        costData.push(Number(lastItem.dayEleCost) || 0);
        costIsLast.push(true);
        costIsEstimate.push(false);
      } else if (overflowItem) {
        costData.push(Number(overflowItem.dayEleCost) || 0);
        costIsLast.push(true);
        costIsEstimate.push(false);
      } else {
        costData.push(0);
        costIsLast.push(false);
        costIsEstimate.push(false);
      }
    }

    // 本月当前日期数据（优先取本月今天，否则取daylist最新一条）
    const currentDayItem = currentMonthMap[currentDay] || daylist[0] || {};

    return {
      categories,
      gas: gasData, cost: costData,
      gasIsLast, costIsLast,
      gasIsEstimate, costIsEstimate,
      lastDataDay,
      current: {
        ele: Number(currentDayItem.dayEleNum) || 0,
        cost: Number(currentDayItem.dayEleCost) || 0,
        days: currentDay
      }
    };
  }

  get _processedMonthData() {
    const selectedEntityId = this._selectedBalanceEntity;
    if (!selectedEntityId || !this.hass || !this.hass.states[selectedEntityId]) {
      return {};
    }

    const selectedEntity = this.hass.states[selectedEntityId];

    const lastYear  = (new Date().getFullYear() - 1).toString();
    const currentYear = new Date().getFullYear().toString();

    if (!selectedEntity?.attributes?.monthlist) return null;

    const lastYearBills = selectedEntity.attributes.monthlist.filter(item =>
      item?.month && item.month.startsWith(lastYear)
    ) || [];
    const thisYearBills = selectedEntity.attributes.monthlist.filter(item =>
      item?.month && item.month.startsWith(currentYear)
    ) || [];
    const lastmonthlist = [...lastYearBills ].slice(0, 12).reverse();
    const monthlist = [...thisYearBills].slice(0, 12).reverse();
    const lastmonthlistDay = [...lastYearBills ][0];
    const monthlistDay = [...thisYearBills][0];
    return {
      gas: monthlist.map(item => ({
        x: new Date(item.month.substr(0,7)+'-01').getTime(),
        y: Number(item.monthEleNum) || 0
      })),
      total: monthlist.map(item => ({
        x: new Date(item.month.substr(0,7)+'-01').getTime(),
        y: Number(item.monthEleNum) || 0
      })),
      cost: monthlist.map(item => ({
        x: new Date(item.month.substr(0,7)+'-01').getTime(),
        y: Number(item.monthEleCost) || 0
      })),
      current: {
        ele: monthlistDay?.monthEleNum || 0,
        cost: monthlistDay?.monthEleCost || 0,
        days: monthlist.length
      },
      lastgas: lastmonthlist.map(item => ({
        x: new Date(`${currentYear}-${item.month.split("-")[1]}-01`).getTime(),
        y: Number(item.monthEleNum) || 0
      })),
      lasttotal: lastmonthlist.map(item => ({
        x: new Date(`${currentYear}-${item.month.split("-")[1]}-01`).getTime(),
        y: Number(item.monthEleNum) || 0
      })),
      lastcost: lastmonthlist.map(item => ({
        x: new Date(`${currentYear}-${item.month.split("-")[1]}-01`).getTime(),
        y: Number(item.monthEleCost) || 0
      })),
      lastcurrent: {
        ele: lastmonthlistDay?.monthEleNum || 0,
        cost: lastmonthlistDay?.monthEleCost || 0,
        days: lastmonthlist.length
      }
    };
  }

  _renderDayChart() {
    const container = this.renderRoot.querySelector('#chart-container');
    if (!container) return;
    const data = this._processedDayData;
    if (!data) {
      if (this._chart) {
        this._chart.destroy();
        this._chart = null;
      }
      return;
    }
    container.innerHTML = '';
    if (this._chart) {
      this._chart.destroy();
      this._chart = null;
    }

    // 清理之前的定时器
    if (this._dayChartRenderTimeout) {
      clearTimeout(this._dayChartRenderTimeout);
    }
    if (this._dayChartUpdateTimeout) {
      clearTimeout(this._dayChartUpdateTimeout);
    }

    // 使用 setTimeout 确保 DOM 完全渲染后再创建图表
    this._dayChartRenderTimeout = setTimeout(() => {
      if (!container) return;

      // 获取容器的实际宽度
      const containerWidth = container.offsetWidth || container.parentElement.offsetWidth;

      if (containerWidth > 0) {
        // 临时设置明确的像素宽度
        container.style.width = containerWidth + 'px';

        // 创建并渲染图表
        this._chart = new ApexCharts(container, this._getChartDayConfig(data));
        this._chart.render();

        // 渲染完成后恢复百分比宽度（用于响应式）
        this._dayChartUpdateTimeout = setTimeout(() => {
          // 多重检查：容器存在、图表实例存在、容器仍在DOM中
          if (container && this._chart && document.body.contains(container)) {
            try {
              container.style.width = '100%';
              this._chart.updateOptions({
                chart: {
                  width: '100%'
                }
              }, false, true);
            } catch (error) {
              console.warn('Day chart updateOptions error:', error);
            }
          }
        }, 2000);
      }
    }, 50);
  }

  _renderMonthChart() {
    const container = this.renderRoot.querySelector('#chart-container');
    if (!container) return;
    const data = this._processedMonthData;
    if (!data) {
      if (this._chart) {
        this._chart.destroy();
        this._chart = null;
      }
      return;
    }
    container.innerHTML = '';
    if (this._chart) {
      this._chart.destroy();
      this._chart = null;
    }

    // 清理之前的定时器
    if (this._monthChartRenderTimeout) {
      clearTimeout(this._monthChartRenderTimeout);
    }
    if (this._monthChartUpdateTimeout) {
      clearTimeout(this._monthChartUpdateTimeout);
    }

    // 使用 setTimeout 确保 DOM 完全渲染后再创建图表
    this._monthChartRenderTimeout = setTimeout(() => {
      if (!container) return;

      // 获取容器的实际宽度
      const containerWidth = container.offsetWidth || container.parentElement.offsetWidth;

      if (containerWidth > 0) {
        // 临时设置明确的像素宽度
        container.style.width = containerWidth + 'px';

        // 创建并渲染图表
        this._chart = new ApexCharts(container, this._getChartMonthConfig(data));
        this._chart.render();

        // 渲染完成后恢复百分比宽度（用于响应式）
        this._monthChartUpdateTimeout = setTimeout(() => {
          // 多重检查：容器存在、图表实例存在、容器仍在DOM中
          if (container && this._chart && document.body.contains(container)) {
            try {
              container.style.width = '100%';
              this._chart.updateOptions({
                chart: {
                  width: '100%'
                }
              }, false, true);
            } catch (error) {
              console.warn('Month chart updateOptions error:', error);
            }
          }
        }, 2000);
      }
    }, 50);

  }

  _loadData() {
    // 重新渲染图表，数据会在中通过
    this._renderDayChart();
    this._renderMonthChart();
  }


  _getChartDayConfig(data) {
    const theme = this._evaluateTheme();
    const Color = theme === 'light' ? 'rgb(0, 0, 0)' : 'rgb(255, 255, 255)';
    const BgColor = theme === 'light' ? 'rgb(255, 255, 255)' : 'rgb(50, 50, 50)';

    // 计算用气量的最大值
    const maxGas = data.gas.length > 0 ? Math.max(...data.gas) : 0;
    const maxGasIndex = data.gas.indexOf(maxGas);
    // 计算气费的最大值
    const maxCost = data.cost.length > 0 ? Math.max(...data.cost) : 0;

    const colorCost = this.colorCost;
    const colorNum = this.colorNum;

    // 用气量颜色
    const colorGas = '#4CAF50';  // 绿色
    const colorLastGas = '#4CAF5040';  // 上月用气量
    const colorLastCost = this.colorCost + '40';

    // 为每个柱子生成带颜色的数据：上月数据用透明色
    const gasSeriesData = data.gas.map((y, i) => ({
      x: data.categories[i],
      y: y,
      fillColor: data.gasIsLast[i] ? colorLastGas : colorGas
    }));
    const costSeriesData = data.cost.map((y, i) => ({
      x: data.categories[i],
      y: y,
      fillColor: data.costIsLast[i] ? colorLastCost : colorCost
    }));

    return {
      series: [
        {
          name: '用气量',
          data: gasSeriesData,
          type: 'column'
        },
        {
          name: '日气费',
          data: costSeriesData,
          type: 'line',
          color: colorCost
        }
      ],
      chart: {
        type: 'bar',
        height: 230,
        width: '100%',
        foreColor: Color,
        stacked: true,
        toolbar: { show: false },
        animations: {
          enabled: true,
          dynamicAnimation: {
            enabled: true
          },
          easing: 'linear',
          speed: 1000,
          initialAnimation: {
            enabled: true
          }
        }
      },
      plotOptions: {
        bar: {
          horizontal: false,
          borderRadius: 0,
          columnWidth: '60%',
          barHeight: '70%',
          distributed: false,
          stacking: 'normal',
          rangeBarOverlap: true,
          rangeBarGroupRows: false,
          hideZeroBarsWhenGrouped: false,
          isDumbbellDiverging: false,
          dumbbellColors: undefined,
          isFunnel: false,
          isFunnel3d: true,
          dataLabels: {
            position: 'top',
            maxItems: 100,
            hideOverflowingLabels: true,
            orientation: 'horizontal'
          },
          groupOrder: 'asc',
          groupSize: 1,
          colors: {
            ranges: [],
            backgroundBarColors: [],
            backgroundBarOpacity: 1,
            backgroundBarRadius: 0
          }
        }
      },
      stroke: { width: [0, 2], curve: 'smooth' },
      markers: {
        size: 3,
        strokeWidth: 1,
        colors: colorCost,
        strokeColors: "#fff"
      },
      dataLabels: {
        enabled: false
      },
      xaxis: {
        type: 'category',
        tickAmount: data.categories.length - 1,
        labels: {
          rotate: 0,
          style: {
            fontSize: '10px',
          },
          hideOverlappingLabels: true,
          showDuplicates: false,
          formatter: function(val) {
            const day = parseInt(val);
            return day % 2 === 1 ? String(day) : '';
          }
        },
        tooltip: {
          enabled: false
        }
      },
      yaxis: {
        min: 0,
        max: maxCost > 0 ? Math.ceil(maxCost / 0.5) * 0.5 + 0.5 : undefined,
        floating: false,
        labels: {
          minWidth: 5,
          maxWidth: 25,
          formatter: function(val, index) {
            return val.toFixed(0);
          }
        }
      },
      grid: {
        show: true,
        position: 'back',
        xaxis: {
          lines: {
            show: false
          }
        },
        yaxis: {
          lines: {
            show: false
          }
        },
        row: {
          colors: [Color, 'transparent'],
          opacity: 0.1
        },
      },
      annotations: {
        points: (() => {
          const points = [];

          // 标记最大用气量
          if (maxGasIndex >= 0 && maxGas > 0) {
            points.push({
              x: maxGasIndex,
              y: maxGas,
              seriesIndex: 3,
              marker: {
                size: 0
              },
              label: {
                borderColor: '#ffffff00',
                offsetY: -5,
                offsetX: 0,
                style: {
                  color: Color,
                  background: '#ffffff00',
                  fontSize: '12px',
                  fontWeight: 'bold'
                },
                text: `${maxGas.toFixed(2)}m³`
              }
            });

            points.push({
              x: maxGasIndex,
              y: maxGas,
              seriesIndex: 3,
              marker: {
                size: 4,
                offsetX: 0,
                fillColor: '#fff',
                strokeColor: colorNum,
                strokeWidth: 1,
                shape: "circle",
              },
              label: {
                borderColor: '#fff',
                offsetY: 0,
                offsetX: 0,
                style: {
                  color: Color,
                  fontSize: '12px',
                  fontWeight: 'bold'
                },
                text: ' '
              }
            });
          }

          return points;
        })()
      },
      tooltip: {
        shared: true,
        intersect: false,
        custom: function({ series, dataPointIndex }) {
          // 类别轴，dataPointIndex对应1-31
          const day = dataPointIndex + 1;
          const now = new Date();
          const currentMonth = now.getMonth() + 1;
          const currentYear = now.getFullYear();
          // 判断该天是否为预计数据（超过数据最后一天一律为预计）
          const isEstimate = day > data.lastDataDay;

          const formattedDate = `${currentYear}-${String(currentMonth).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
          const dateLabel = isEstimate ? `${formattedDate} 预计` : formattedDate;

          let tooltipHTML = `
            <div style="background: ${BgColor};color: ${Color};padding: 8px;border-radius: 4px;border: 1px solid ${Color};">
              <div style="font-weight: bold; font-size: 12px;color: ${Color};  border-bottom: 1px dashed #999;">
                ${dateLabel}
              </div>
          `;

          // 显示用气量
          const gasValue = series[0]?.[dataPointIndex] || 0;
          if (gasValue > 0) {
            tooltipHTML += `
              <div style="display: flex;align-items: center;margin: 0;font-size: 12px;border-bottom: 1px dashed #999;font-weight: bold;">
                <span style="display: inline-block;width: 8px;height: 8px;background: ${colorNum};border-radius: 50%;margin-right: 5px;"></span>
                <span style="color: ${Color}">
                  用气量:
                  <strong>${gasValue.toFixed(2)} m³</strong>
                </span>
              </div>
            `;
          }

          // 显示气费
          const costValue = series[1]?.[dataPointIndex];
          if (costValue !== null && costValue !== undefined) {
            tooltipHTML += `
              <div style="display: flex;align-items: center;margin: 0;font-size: 12px;border-bottom: 1px dashed #999;">
                <span style="display: inline-block;width: 8px;height: 8px;background: ${colorCost};border-radius: 50%;margin-right: 5px;"></span>
                <span style="color: ${colorCost}">
                  日气费:
                  <strong>${costValue.toFixed(2)} 元</strong>
                </span>
              </div>
            `;
          }

          tooltipHTML += `</div>`;
          return tooltipHTML;
        }.bind(this)
      },
      legend: {
        position: 'bottom',
        showForNullSeries: false,
        showForZeroSeries: false,
        formatter: function(seriesName, opts) {
          const seriesData = opts.w.globals.series[opts.seriesIndex];
          const hasData = seriesData && seriesData.some(val => val !== 0 && val !== null && val !== undefined);
          return hasData ? seriesName : '';
        },
        markers: {
          width: 10,
          height: 10,
          radius: 5
        },
        itemMargin: {
          horizontal: 10
        }
      },
      plotOptions: {
        bar: {
          borderRadius: 0,
          columnWidth: '60%'
        }
      }
    };
  }

  _getChartMonthConfig(data) {
    const theme = this._evaluateTheme();
    const Color = theme === 'light' ? 'rgb(0, 0, 0)' : 'rgb(255, 255, 255)';
    const BgColor = theme === 'light' ? 'rgb(255, 255, 255)' : 'rgb(50, 50, 50)';
    
    // 计算本年用气量最大值
    const totalValues = data.total.map(item => item.y);
    const maxTotal = totalValues.length > 0 ? Math.max(...totalValues) : 0;
    const maxTotalPoint = data.total.find(item => item.y === maxTotal);

    // 计算本年气费最大值
    const costValues = data.cost.map(item => item.y);
    const maxCost = costValues.length > 0 ? Math.max(...costValues) : 0;

    // 计算上年用气量最大值
    const lasttotalValues = data.lasttotal.map(item => item.y);
    const maxLastTotal = lasttotalValues.length > 0 ? Math.max(...lasttotalValues) : 0;

    // 计算上年气费最大值
    const lastcostValues = data.lastcost.map(item => item.y);
    const maxLastCost = lastcostValues.length > 0 ? Math.max(...lastcostValues) : 0;

    const colorCost = this.colorCost;
    const colorNum = this.colorNum;

    // 用气量颜色
    const colorGas = '#4CAF50';  // 绿色
    const colorLastGas = '#4CAF5080';  // 上年用气量

    // 修改数据结构：为上年数据偏移时间，实现并列显示
    const offsetMs = 12 * 24 * 60 * 60 * 1000; // 12天的偏移

    const lastgasOffset = data.lastgas.map(item => ({ x: item.x - offsetMs, y: item.y }));
    const lastcostOffset = data.lastcost.map(item => ({ x: item.x - offsetMs, y: item.y }));

    // 动态构建series，只包含有数据的系列
    const hasDataInSeries = (arr) => arr && arr.some(item => item.y > 0);
    const seriesList = [];
    
    if (hasDataInSeries(lastgasOffset)) seriesList.push({ name: '上年用气量', data: lastgasOffset, type: 'column' });
    if (hasDataInSeries(data.gas)) seriesList.push({ name: '本年用气量', data: data.gas, type: 'column' });
    if (hasDataInSeries(lastcostOffset)) seriesList.push({ name: '上年气费', data: lastcostOffset, type: 'line', color: '#f3066040' });
    if (hasDataInSeries(data.cost)) seriesList.push({ name: '本年气费', data: data.cost, type: 'line', color: colorCost });

    return {
      series: seriesList,         
      markers: {
        size: 3,
        strokeWidth: 1,
        colors: ['#f3066040', colorCost],
        strokeColors: "#fff"
      },
      chart: {
        type: 'bar',
        height: 230,
        width: '100%',
        foreColor: Color,
        stacked: true,
        toolbar: { show: false },
        animations: {
          enabled: true,
          dynamicAnimation: {
            enabled: true
          },
          easing: 'linear',
          speed: 1000,
          initialAnimation: {
            enabled: true
          }
        }
      },
      plotOptions: {
        bar: {
          horizontal: false,
          borderRadius: 0,
          columnWidth: '30%',
          barHeight: '70%',
          distributed: false,
          stacking: 'normal',
          rangeBarOverlap: true,
          rangeBarGroupRows: false,
          hideZeroBarsWhenGrouped: false,
          isDumbbellDiverging: false,
          dumbbellColors: undefined,
          isFunnel: false,
          isFunnel3d: true,
          dataLabels: {
            position: 'top',
            maxItems: 100,
            hideOverflowingLabels: true,
            orientation: 'horizontal'
          },
          groupOrder: 'asc',
          groupSize: 1,
          colors: {
            ranges: [],
            backgroundBarColors: [],
            backgroundBarOpacity: 1,
            backgroundBarRadius: 0
          }
        }
      },
      colors: seriesList.map(s => {
        const colorMap = {
          '上年用气量': colorLastGas, '本年用气量': colorGas,
          '上年气费': '#f3066040', '本年气费': colorCost
        };
        return colorMap[s.name] || s.color || '#999';
      }),
      stroke: { width: seriesList.map(s => s.type === 'line' ? 2 : 0), curve: 'smooth' },
      markers: {
        size: 3,
        strokeWidth: 1,
        colors: ['#f3066040', colorCost],
        strokeColors: "#fff"
      },
      dataLabels: {
        enabled: false
      },
      xaxis: {
        type: 'datetime',
        min: new Date(`${new Date().getFullYear()}-01-01`).getTime() - 15 * 24 * 60 * 60 * 1000,
        max: new Date(`${new Date().getFullYear()}-12-01`).getTime(),
        tickAmount: 11,
        labels: {
          datetimeFormatter: {
            day: 'M月',
            month: 'M月',
            year: 'M月'
          },
          formatter: function(val, timestamp, opts) {
            const date = new Date(timestamp);
            const month = date.getMonth() + 1;
            return month + '月';
          },
          style: {
            fontSize: '10px',
          },
          hideOverlappingLabels: false
        },
        tooltip: { 
          enabled: false
        }
      },
      yaxis: {
        min: 0,
        max: Math.max(maxCost, maxLastCost) > 0 ? Math.ceil(Math.max(maxCost, maxLastCost) / 5) * 5 + 5 : undefined,
        floating: false,
        labels: {
          minWidth: 10,
          maxWidth: 30,
          formatter: function(val, index) {
            return val.toFixed(0);
          }
        }
      },
      grid: {
        show: true,
        position: 'back',
        xaxis: {
            lines: {
                show: false
            }
        },   
        yaxis: {
            lines: {
                show: false
            }
        },  
        row: {
            colors: [Color, 'transparent'], 
            opacity: 0.1
        },
      },
      annotations: {
        points: (() => {
          const points = [];

          // 标记最大用气量（动态查找气费系列索引）
          const costSeriesIdx = seriesList.findIndex(s => s.name === '本年气费');
          if (maxTotalPoint) {
            points.push({
              x: maxTotalPoint.x,
              y: maxTotalPoint.y,
              seriesIndex: costSeriesIdx >= 0 ? costSeriesIdx : 0,
              marker: {
                size: 0
              },
              label: {
                borderColor: '#ffffff00',
                offsetY: -5,
                offsetX: 0,
                style: {
                  color: Color,
                  background: '#ffffff00',
                  fontSize: '12px',
                  fontWeight: 'bold'
                },
                text: `${maxTotal.toFixed(2)}m³`
              }
            });

            points.push({
              x: maxTotalPoint.x,
              y: maxTotalPoint.y,
              seriesIndex: costSeriesIdx >= 0 ? costSeriesIdx : 0,
              marker: {
                size: 4,
                offsetX: 0,
                fillColor: '#fff',
                strokeColor: colorNum,
                strokeWidth: 1,
                shape: "circle",
              },
              label: {
                borderColor: '#fff',
                offsetY: 0,
                offsetX: 0,
                style: {
                  color: Color,
                  fontSize: '12px',
                  fontWeight: 'bold'
                },
                text: ' '
              }
            });
          }

          return points;
        })()
      },
      tooltip: {
        shared: true,
        intersect: false,
        custom: function({ series, seriesIndex, dataPointIndex, w }) {
          const hoverX = w.globals.seriesX[seriesIndex]?.[dataPointIndex];
          const currentDate = new Date(hoverX);
          const monthLabel = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`;
          const lastYear = (new Date().getFullYear() - 1).toString();
          const currentYear = new Date().getFullYear().toString();

          let tooltipHTML = `
            <div style="background: ${BgColor};color: ${Color};padding: 8px;border-radius: 4px;border: 1px solid ${Color};">
              <div style="font-weight: bold; font-size: 12px;color: ${Color};  border-bottom: 1px dashed #999;">
                ${monthLabel}
              </div>
          `;

          // 动态遍历seriesList显示数据
          seriesList.forEach((s, idx) => {
            const value = series[idx]?.[dataPointIndex];
            const unit = s.name.includes('气费') ? '元' : 'm³';
            if (value !== null && value !== undefined && (value !== 0 || unit === '元')) {
              const seriesColor = s.color || (s.name.includes('上年') ? colorLastGas : colorGas);
              tooltipHTML += `
                <div style="display: flex;align-items: center;margin: 0;font-size: 12px;border-bottom: 1px dashed #999;">
                  <span style="display: inline-block;width: 8px;height: 8px;background: ${seriesColor};border-radius: 50%;margin-right: 5px;"></span>
                  <span style="color: ${seriesColor}">
                    ${s.name}:
                    <strong>${value.toFixed(2)} ${unit}</strong>
                  </span>
                </div>
              `;
            }
          });

          tooltipHTML += `</div>`;
          return tooltipHTML;
        }.bind(this)
      },

      legend: {
        position: 'bottom',
        showForNullSeries: false,
        showForZeroSeries: false,
        formatter: function(seriesName, opts) {
          const seriesData = opts.w.globals.series[opts.seriesIndex];
          const hasData = seriesData && seriesData.some(val => val !== 0 && val !== null && val !== undefined);
          return hasData ? seriesName : '';
        },
        markers: {
          width: 10,
          height: 10,
          radius: 5
        },
        itemMargin: {
          horizontal: 10
        }
      },
      plotOptions: {
        bar: {
          borderRadius: 0,
          columnWidth: '30%'
        }
      }
    };
  }

  /*获取当前月份的字符串格式 (YYYY-MM)*/
  getCurrentMonth() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    return `${year}-${month}`;
  }

  /*处理跨年的情况，如1月份的上个月是上一年的12月*/
  getPreviousMonth() {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    if (month === 0) {
      return `${year - 1}-12`;
    }
    return `${year}-${String(month).padStart(2, '0')}`;
  }

  /*分析最近3个月的用气数据，燃气仅支持年阶梯计费，无尖峰平谷*/
  getGasType(monthList) {
    if (!monthList || monthList.length === 0) return null;
    // 燃气无尖峰平谷，返回single类型
    return ['single'];
  }

  /* 根据计费标准和用气类型获取对应的气价信息
   * 燃气仅支持年阶梯计费*/
  getGasPrices(billingStandard, currentLevel, gasTypes) {
    const selectedEntityId = this._selectedBalanceEntity;
    if (!selectedEntityId || !this.hass || !this.hass.states[selectedEntityId]) {
      return {};
    }
    
    const selectedEntity = this.hass.states[selectedEntityId];
    const prices = {};
    if (!gasTypes || gasTypes.length === 0) return prices;
    
    gasTypes.forEach(type => {
      switch (billingStandard) {
        case '年阶梯':
          prices.single = selectedEntity.attributes.计费标准[`年阶梯第${currentLevel}档气价`];
          break;
        case '平均单价':
          prices.single = selectedEntity.attributes.计费标准.平均单价;
          break;
      }
    });
    
    return prices;
  }

  /*从月度用气数据列表中查找指定月份的数据 */
  getMonthUsage(monthList, targetMonth) {
    if (!monthList) return null;
    return monthList.find(item => item.month === targetMonth);
  }

  /*从年度用气数据列表中查找指定年份的数据*/
  getYearUsage(yearList, targetYear) {
    if (!yearList) return null;
    return yearList.find(item => item.year === targetYear.toString());
  }

 /*渲染日度用气条形图*/
  renderDayBar(usage) {
    const theme = this._evaluateTheme();
    const Color = theme === 'light' ? 'rgb(0, 0, 0)' : 'rgb(255, 255, 255)';
    const Shadow = theme === 'light' ? '0 1px 2px rgba(255, 255, 255, 0.3)' : '0 1px 2px rgba(47, 45, 45, 0.6)';

    const total = usage.dayEleNum || 0;
    if (total === 0) return '';
    
    return html`
      <div class="usage-bar">
        <div class="usage-bar-fill">
          <div class="usage-bar-segment normal" style="width: 100%"></div>
          <div class="usage-bar-text normal" style="color: ${Color}; text-shadow: ${Shadow};--normal-width: 100%; left: 0;">${total} m³</div>
        </div>
      </div>
      <div class="usage-labels">
        <div class="usage-label normal" style="color: ${Color}; text-shadow: ${Shadow};--normal-width: 100%; left: 0;"> </div>
      </div>
    `;
  }

  /*渲染月度用气条形图*/
  renderUsageBar(usage) {
    const theme = this._evaluateTheme();
    const Color = theme === 'light' ? 'rgb(0, 0, 0)' : 'rgb(255, 255, 255)';
    const Shadow = theme === 'light' ? '0 1px 2px rgba(255, 255, 255, 0.3)' : '0 1px 2px rgba(50, 50, 50, 0.6)';

    const total = usage.monthEleNum || 0;
    if (total === 0) return '';
    
    return html`
      <div class="usage-bar">
        <div class="usage-bar-fill">
          <div class="usage-bar-segment normal" style="width: 100%"></div>
          <div class="usage-bar-text normal" style="color: ${Color}; text-shadow: ${Shadow};--normal-width: 100%; left: 0;">${total} m³</div>
        </div>
      </div>
      <div class="usage-labels">
        <div class="usage-label normal" style="color: ${Color}; text-shadow: ${Shadow};--normal-width: 100%; left: 0;"> </div>
      </div>
    `;
  }

  /*渲染年度用气条形图*/
  renderYearUsageBar(usage) {
    const theme = this._evaluateTheme();
    const Color = theme === 'light' ? 'rgb(0, 0, 0)' : 'rgb(255, 255, 255)';
    const Shadow = theme === 'light' ? '0 1px 2px rgba(255, 255, 255, 0.3)' : '0 1px 2px rgba(50, 50, 50, 0.6)';
    const total = usage.yearEleNum || 0;
    if (total === 0) return '';
    
    return html`
      <div class="usage-bar">
        <div class="usage-bar-fill">
          <div class="usage-bar-segment normal" style="width: 100%"></div>
          <div class="usage-bar-text normal" style="color: ${Color}; text-shadow: ${Shadow};--normal-width: 100%; left: 0;">${total} m³</div>
        </div>
      </div>
      <div class="usage-labels">
        <div class="usage-label normal" style="color: ${Color}; text-shadow: ${Shadow};--normal-width: 100%; left: 0;"> </div>
      </div>
    `;
  }

  /*渲染价格区块*/
  renderPriceBlock(prices, level) {
    const selectedEntityId = this._selectedBalanceEntity;
    if (!selectedEntityId || !this.hass || !this.hass.states[selectedEntityId]) {
      return '';
    }
    
    const selectedEntity = this.hass.states[selectedEntityId];
    const billingStandard = selectedEntity.attributes.计费标准?.计费标准;
    
    if (billingStandard === '平均单价') {
      return html`<div class="price-item-block">单价：${prices.single}</div>`;
    }
    
    let blockPrices = {};
    switch (billingStandard) {
      case '年阶梯':
        blockPrices.single = selectedEntity.attributes.计费标准[`年阶梯第${level}档气价`];
        break;
      case '平均单价':
        blockPrices.single = selectedEntity.attributes.计费标准.平均单价;
        break;
    }
    
    return html`
      ${blockPrices.single ? html`<div class="price-item-block">单价：${blockPrices.single}</div>` : ''}
    `;
  }

  /*按钮功能函数 - 气费日历*/
  showCalendar() {
    this.showPanel = this.showPanel === 'calendar' ? '' : 'calendar';
    this.updateDayData();
    this.requestUpdate();
    this._handleClick();
  }

  /*按钮功能函数 - 日用气*/
  async showDayUsage() {
    this.showPanel = this.showPanel === 'dayUsage' ? '' : 'dayUsage';
    this.requestUpdate();
    await this._loadApexCharts();
    this._renderDayChart();
    this._handleClick();
  }

  /*按钮功能函数 - 月用气*/
  async showMonthUsage() {
    this.showPanel = this.showPanel === 'monthUsage' ? '' : 'monthUsage';
    this.requestUpdate();
    await this._loadApexCharts();
    this._renderMonthChart();
    this._handleClick();
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

  /*日历功能函数*/
  updateDayData() {
    // 使用选中的余额实体而不是固定的this.entity
    const selectedEntityId = this._selectedBalanceEntity;
    if (this.hass && selectedEntityId) {
      const entityObj = this.hass.states[selectedEntityId];
      if (entityObj && entityObj.attributes) {
        if (entityObj.attributes.daylist) {
          this.dayData = entityObj.attributes.daylist;
        } else {
          this.dayData = [];
        }
        if (entityObj.attributes.monthlist) {
          const monthStr = `${this.year}-${this.month.toString().padStart(2, '0')}`;
          this.monthData = entityObj.attributes.monthlist.find(item => item.month === monthStr);
        } else {
          this.monthData = null;
        }
      } else {
        this.dayData = [];
        this.monthData = null;
      }
    }
  }

  getDayData(year, month, day) {
    if (!this.dayData || this.dayData.length === 0) return null;
    const dateStr = `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
    return this.dayData.find(item => item.day === dateStr);
  }

  getMinMaxUsageDays() {
    if (!this.dayData || this.dayData.length === 0) return { minDays: [], maxDays: [] };
    const monthStr = `${this.year}-${this.month.toString().padStart(2, '0')}`;
    const monthDays = this.dayData.filter(item => item.day.startsWith(monthStr));
    if (monthDays.length === 0) return { minDays: [], maxDays: [] };
    const validDays = monthDays.filter(day => day.dayEleNum !== undefined && day.dayEleNum !== null);
    if (validDays.length === 0) return { minDays: [], maxDays: [] };
    const minUsage = Math.min(...validDays.map(day => parseFloat(day.dayEleNum)));
    const maxUsage = Math.max(...validDays.map(day => parseFloat(day.dayEleNum)));
    const minDays = validDays
        .filter(day => parseFloat(day.dayEleNum) === minUsage)
        .map(day => parseInt(day.day.split('-')[2], 10).toString());
    const maxDays = validDays
        .filter(day => parseFloat(day.dayEleNum) === maxUsage)
        .map(day => parseInt(day.day.split('-')[2], 10).toString());
    return { minDays, maxDays };
  }


  getDaysInMonth(year, month) {
    return new Date(year, month, 0).getDate();
  }

  prevYear() {
    this.year--;
    this.updateDayData();
    this.requestUpdate();
    this._handleClick();
  }

  nextYear() {
    this.year++;
    this.updateDayData();
    this.requestUpdate();
    this._handleClick();
  }

  prevMonth() {
    if (this.month === 1) {
      this.month = 12;
      this.year--;
    } else {
      this.month--;
    }
    this.updateDayData();
    this.requestUpdate();
    this._handleClick();
  }

  nextMonth() {
    if (this.month === 12) {
      this.month = 1;
      this.year++;
    } else {
      this.month++;
    }
    this.updateDayData();
    this.requestUpdate();
    this._handleClick();
  }

  goToToday() {
    const today = new Date();
    this.year = today.getFullYear();
    this.month = today.getMonth() + 1;
    this.updateDayData();
    this.requestUpdate();
    this._handleClick();
  }

  renderChartDay() {

    const data = this._processedDayData;
    const theme = this._evaluateTheme();
    const backgColor = theme === 'light' ? 'rgb(255, 255, 255)' : 'rgb(50, 50, 50)';
    const textColor = theme === 'light' ? 'rgba(0, 0, 0, 0.7)' : 'rgba(255, 255, 255, 0.7)';
    return html`
      <ha-card class="card-chart" style="; height: 300px; background: ${backgColor};">
        <div class="label label1">
          <div class="value" style="color: ${this.colorNum}">${data ? data.current.ele.toFixed(2) : '0.00'}
               <span class="unit"  style="color: ${textColor}">m³</span>
          </div>
          <div class="title" style="color: ${textColor}">日用气量</div>
        </div>

        <div class="label label2">
          <div class="value" style="color: ${this.colorCost}">${data ? data.current.cost.toFixed(2) : '0.00'}
               <span class="unit" style="color: ${textColor}">元</span>
          </div>
          <div class="title" style="color: ${textColor}">日用气金额</div>
        </div>

        <div id="chart-container"></div>
      </ha-card>
    `;
  }

  renderChartMonth() {
    const data = this._processedMonthData;
    const theme = this._evaluateTheme();
    const backgColor = theme === 'light' ? 'rgb(255, 255, 255)' : 'rgb(50, 50, 50)';
    const textColor = theme === 'light' ? 'rgba(0, 0, 0, 0.7)' : 'rgba(255, 255, 255, 0.7)';
    return html`
      <ha-card class="card-chart" style="height: 300px; background: ${backgColor};">
        <div class="label label1">
          <div class="value" style="color: ${this.colorNum}">${data ? data.current.ele.toFixed(2) : '0.00'}
               <span class="unit"  style="color: ${textColor}">m³</span>
          </div>
          <div class="title" style="color: ${textColor}">月用气量</div>
        </div>

        <div class="label label2">
          <div class="value" style="color: ${this.colorCost}">${data ? data.current.cost.toFixed(2) : '0.00'}
               <span class="unit" style="color: ${textColor}">元</span>
          </div>
          <div class="title" style="color: ${textColor}">月用气金额</div>
        </div>

        <div id="chart-container"></div>
      </ha-card>
    `;
  }

  renderHeader() {
    if (!this.hass) {
      return html`<div>Loading...</div>`;
    };
    
    // 获取主题和颜色
    const theme = this.config.theme || 'system';
    const fgColor = theme === 'light' ? 'rgb(0, 0, 0)' : 'rgb(255, 255, 255)';
    const bgColor = theme === 'light' ? 'rgb(255, 255, 255)' : 'rgb(50, 50, 50)';
    
    // 计算总金额的预警状态
    const totalAmount = this._calculateTotalAmount();
    let totalAmountWarning = false;
    if (this.config.global_warning && this.config.global_warning.trim() !== '') {
      totalAmountWarning = this._evaluateWarningCondition(totalAmount, this.config.global_warning);
    }
    
    // 计算布局相关的CSS变量
    const isHorizontalLayout = this.config.entity_layout === 'horizontal';
    const entitiesPerRow = parseInt(this.config.entities_per_row) || 3;
    const layoutStyle = isHorizontalLayout ? `
      --items-per-row: ${entitiesPerRow};
      --gap-count: ${Math.max(0, entitiesPerRow - 1)};
    ` : '';

    return html`
     ${this._balanceData.length > 1 ? html`
      <div class="card-container" style="width: ${this.config.width};">
        <!-- 燃气信息卡片 -->
        <div class="balance-card" style="--fg-color: ${fgColor}; --bg-color: ${bgColor}; ${layoutStyle}">
          <div class="balance-header">
            <div class="balance-title">
              <span class="balance-indicator" style="background: rgb(0,222,220); animation: pulse 2s infinite"></span>
              ${this.config.balance_name || '燃气信息'}
            </div>
            <div class="balance-count ${totalAmountWarning ? 'warning' : ''}">
              ￥ ${totalAmount} 元
            </div>
          </div>
          
         
            <div class="balance-devices-list ${isHorizontalLayout ? 'horizontal' : ''}">
              ${this._balanceLoading ? 
                html`<div class="balance-loading">加载中...</div>` :
                
                this._balanceData.length === 0 ? 
                  html`<div class="balance-no-devices">请配置燃气实体</div>` :
                  html`
                    ${this._balanceData.map(balanceData => {
                      // 明细预警优先级最高
                      let isWarning = false;
                      
                      // 首先检查明细预警，如果存在且满足条件，直接设为预警状态
                      if (balanceData.warning && balanceData.warning.trim() !== '') {
                        isWarning = this._evaluateWarningCondition(balanceData.value, balanceData.warning); 
                      } else {
                        // 只有在没有明细预警时才检查全局预警
                        if (this.config.global_warning && this.config.global_warning.trim() !== '') {
                          isWarning = this._evaluateWarningCondition(balanceData.value, this.config.global_warning);
                        }
                      }
                      
                      const isSelected = this._selectedBalanceEntity === balanceData.entity_id;
                      
                      return html`
                        <div class="balance-device-item ${isSelected ? 'selected' : ''}" @click=${() => this._handleBalanceEntityClick(balanceData)}>
                          <div class="balance-device-left">
                            <ha-icon class="balance-device-icon" icon="${balanceData.icon}"></ha-icon>
                            <div class="balance-device-name">${balanceData.friendly_name}</div>
                          </div>
                          <div class="balance-device-value ${isWarning ? 'warning' : ''}">
                            ${balanceData.value}
                            <span class="balance-device-unit ${isWarning ? 'warning' : ''}">${balanceData.unit}</span>
                          </div>
                        </div>
                      `;
                    })}
                  `
              }
            </div>
        </div>
      </div>
    ` : ''}
    `;
  }

  renderCalendar() {
    // 使用选中的余额实体而不是固定的this.entity
    const selectedEntityId = this._selectedBalanceEntity;
    if (!selectedEntityId || !this.hass || !this.hass.states[selectedEntityId]) {
      return html`<div style="padding: 20px; text-align: center;">请选择有效的燃气实体</div>`;
    }
    
    const selectedEntity = this.hass.states[selectedEntityId];
    this.updateDayData();
    const theme = this._evaluateTheme();
    const bgColor = theme === 'light' ? 'rgb(255, 255, 255)' : 'rgb(50, 50, 50)';
    const fgColor = theme === 'light' ? 'rgb(0, 0, 0)' : 'rgb(255, 255, 255)';
    const daysInMonth = this.getDaysInMonth(this.year, this.month);
    const firstDayOfMonth = new Date(this.year, this.month - 1, 1).getDay();
    const adjustedFirstDay = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1;
    const { minDays, maxDays } = this.getMinMaxUsageDays();
    const days = [];
    const weekdayNames = ['一', '二', '三', '四', '五', '六', '日'];
    const yearMonthRow = html` 
      <div class="celltotal nav-button ${this.activeNav === 'yearlast' ? 'active-nav' : ''}" 
           style="grid-area: yearlast;" 
           @click=${this.prevYear}
           @mousedown=${() => this.activeNav = 'yearlast'}
           @mouseup=${() => this.activeNav = ''}
           @mouseleave=${() => this.activeNav = ''}>◀</div>
      <div class="celltotal"
           style="grid-area: year;">${this.year+"年"}</div>
      <div class="celltotal nav-button ${this.activeNav === 'yearnext' ? 'active-nav' : ''}" 
           style="grid-area: yearnext;" 
           @click=${this.nextYear}
           @mousedown=${() => this.activeNav = 'yearnext'}
           @mouseup=${() => this.activeNav = ''}
           @mouseleave=${() => this.activeNav = ''}>▶</div>
      <div class="celltotal today-button"
           style="grid-area: today;" 
           @click=${this.goToToday}>当月</div>
      <div class="celltotal nav-button ${this.activeNav === 'monthlast' ? 'active-nav' : ''}" 
           style="grid-area: monthlast;" 
           @click=${this.prevMonth}
           @mousedown=${() => this.activeNav = 'monthlast'}
           @mouseup=${() => this.activeNav = ''}
           @mouseleave=${() => this.activeNav = ''}>◀</div>
      <div class="celltotal" 
           style="grid-area: month;">${this.month+"月"}</div>
      <div class="celltotal nav-button ${this.activeNav === 'monthnext' ? 'active-nav' : ''}" 
           style="grid-area: monthnext;" 
           @click=${this.nextMonth}
           @mousedown=${() => this.activeNav = 'monthnext'}
           @mouseup=${() => this.activeNav = ''}
           @mouseleave=${() => this.activeNav = ''}>▶</div>
    `;
    const weekdaysRow = weekdayNames.map((day, index) => 
      html`<div class="celltotal weekday" style="grid-area: week${index + 1};">${day}</div>`
    );
    for (let i = 0; i < adjustedFirstDay; i++) {
      if (i==adjustedFirstDay-1){
        days.push(html`<div class="cell month-cell-bottom month-cell-right" style="grid-area: id${i + 1};"></div>`);
      }
      else{
        days.push(html`<div class="cell month-cell-bottom" style="grid-area: id${i + 1};"></div>`);
      }
    }
    for (let i = 1; i <= daysInMonth; i++) {
      const dayData = this.getDayData(this.year, this.month, i);
      const isMinDay = minDays.includes(i.toString());
      const isMaxDay = maxDays.includes(i.toString());
      const dayClass = isMinDay ? 'min-usage' : isMaxDay ? 'max-usage' : '';
      const dayContent = html`
        <div>${i}</div>
        ${dayData ? html`
          <div class="gas-num" style="color: ${this.colorNum}">${dayData.dayEleNum}m³</div>
          <div class="gas-cost" style="color: ${this.colorCost}">${dayData.dayEleCost}元</div>
        ` : ''}
      `;
      if(adjustedFirstDay>0 && i>=1 && i<=7-adjustedFirstDay){
        days.push(html`
        <div class="cell month-cell month-cell-top month-day ${dayClass}" 
          style="grid-area: id${i + adjustedFirstDay};">
          ${dayContent}
        </div>
        `);
      }
      else if(adjustedFirstDay==0 && i==1){
        days.push(html`
        <div class="cell month-cell month-cell-top month-cell-left month-day ${dayClass}"\nstyle="grid-area: id${i + adjustedFirstDay};">
          ${dayContent}
        </div>
        `);
      }
      else if(adjustedFirstDay==0 && i>1 && i<=7-adjustedFirstDay){
        days.push(html`
        <div class="cell month-cell month-cell-top month-day ${dayClass}" style="grid-area: id${i + adjustedFirstDay};">
          ${dayContent}
        </div>
        `);
      }
      else if(i==8-adjustedFirstDay || i==15-adjustedFirstDay || i==22-adjustedFirstDay || i==29-adjustedFirstDay || i==36-adjustedFirstDay){
        days.push(html`
        <div class="cell month-cell month-cell-left month-day ${dayClass}" style="grid-area: id${i + adjustedFirstDay};">
          ${dayContent}
        </div>
        `);
      }
      else{
        days.push(html`
        <div class="cell month-cell month-day ${dayClass}" style="grid-area: id${i + adjustedFirstDay};">
          ${dayContent}
        </div>
        `);
      }
    }
    const totalCells = 37;
    for (let i = daysInMonth + adjustedFirstDay + 1; i <= totalCells; i++) {
      days.push(html`<div class="cell" style="grid-area: id${i};"></div>`);
    }
    const bottomRow = html`
      <div class="cell" style="grid-area: id98;"></div>
      <div class="cell summary-info" style="grid-area: id99;">
        ${this.monthData ? html`
          <div><span  style="color: ${this.colorNum}">月气量: ${this.monthData.monthEleNum}m³</span></div>
          <div><span  style="color: ${this.colorCost}">月气费: ${this.monthData.monthEleCost}元</span></div>
        ` : html`<div></div>`}
      </div>
    `;
    return html`
      <div class="calendar-grid"  style="height: 280px; background-color: ${bgColor}; color: ${fgColor}; ">
        ${yearMonthRow}
        ${weekdaysRow}
        ${days}
        ${bottomRow}
      </div>
    `;
  }

  renderMain() {
    const theme = this._evaluateTheme();
    const Color = theme === 'light' ? 'rgb(0, 0, 0)' : 'rgb(255, 255, 255)';
    const Color2 = theme === 'light' ? 'rgb(0, 0, 0 ,0.7)' : 'rgb(255, 255, 255,0.7)';
    const BgColor = theme === 'light' ? 'rgb(255, 255, 255)' : 'rgb(50, 50, 50)';
    const BgColor2 = theme === 'light' ? 'rgb(150, 150, 150, 0.1)' : 'rgb(255, 255,255,0.1)';
    const Shadow = theme === 'light' ? '0 1px 2px rgba(255, 255, 255, 0.3)' : '0 1px 2px rgba(50, 50, 50, 0.6)';
    const svgpath ='/xiaoshi/xiaoshi-card/icon/qinhua-gas.png';

    // 使用选中的余额实体而不是固定的this.entity
    const selectedEntityId = this._selectedBalanceEntity;
    if (!selectedEntityId || !this.hass || !this.hass.states[selectedEntityId]) {
      return html`<div>请选择有效的燃气实体</div>`;
    }
    
    const selectedEntity = this.hass.states[selectedEntityId];
    
    const isprepaid = selectedEntity.attributes?.预付费 || "否";
    const billingStandard = selectedEntity.attributes?.计费标准?.计费标准;
    const currentLevel = (!billingStandard || billingStandard === '平均单价') ? null : 
      (billingStandard?.includes('年阶梯') || false ? 
        selectedEntity.attributes.计费标准?.当前年阶梯档?.replace('第', '').replace('档', '') :
        selectedEntity.attributes.计费标准?.当前月阶梯档?.replace('第', '').replace('档', '')
      );
    
    const gasTypes = this.getGasType(selectedEntity.attributes?.monthlist || []);
    const prices = currentLevel ? this.getGasPrices(billingStandard, currentLevel, gasTypes) : {};
    
    // 渲染阶梯区域内容
    let ladderContent = '';
    if (selectedEntity.attributes && selectedEntity.attributes.计费标准) {
      if (billingStandard === '平均单价') {
        const averagePrice = selectedEntity.attributes.计费标准?.平均单价;
        ladderContent = html`
          <div class="ladder-section" style="background: ${BgColor2}">
            <div class="ladder-header">
              <span>平均单价</span>
              <span>${averagePrice}元/m³</span>
            </div>
          </div>
        `;
      } else {
        const isYearLadder = billingStandard?.includes('年阶梯') || false;
        const ladderType = isYearLadder ? '年' : '月';
        const ladderTitle = isYearLadder ? '年用气阶梯' : '月用气阶梯';
        const currentLevel = selectedEntity.attributes.计费标准?.[`当前${ladderType}阶梯档`]?.replace('第', '').replace('档', '') || '1';
        const secondLevelStart = selectedEntity.attributes.计费标准?.[`${ladderType}阶梯第2档起始用气量`];
        const thirdLevelStart = selectedEntity.attributes.计费标准?.[`${ladderType}阶梯第3档起始用气量`];
        const totalUsage = selectedEntity.attributes.计费标准?.[`${ladderType}阶梯累计用气量`];
        
        let level1Width = 0, level2Width = 0, level3Width = 0;
        let displayLevel = 1;
        let bubblePosition = 0;
        
        if (totalUsage <= secondLevelStart) {
          level1Width = (totalUsage / secondLevelStart) * 100;
          bubblePosition = (totalUsage / secondLevelStart) * 33.33;
          displayLevel = 1;
        } else if (totalUsage <= thirdLevelStart) {
          level1Width = 100;
          level2Width = ((totalUsage - secondLevelStart) / (thirdLevelStart - secondLevelStart)) * 100;
          bubblePosition = 33.33 + ((totalUsage - secondLevelStart) / (thirdLevelStart - secondLevelStart)) * 33.33;
          displayLevel = 2;
        } else {
          level1Width = 100;
          level2Width = 100;
          level3Width = Math.min(((totalUsage - thirdLevelStart) / thirdLevelStart) * 100, 100);
          bubblePosition = 66.66 + Math.min(((totalUsage - thirdLevelStart) / thirdLevelStart) * 33.33, 33.34);
          displayLevel = 3;
        }
        
        // 限制气泡位置，防止超出边界
        const minPosition = 10; // 最小10%
        const maxPosition = 90; // 最大90%
        const constrainedBubblePosition = Math.max(minPosition, Math.min(maxPosition, bubblePosition));
        
        // 限制箭头位置，防止超出边界
        const minArrowPosition = 1; // 最小1%
        const maxArrowPosition = 99; // 最大99%
        const constrainedArrowPosition = Math.max(minArrowPosition, Math.min(maxArrowPosition, bubblePosition));
        
        const gasTypes = this.getGasType(selectedEntity.attributes.monthlist);
        const prices = this.getGasPrices(billingStandard, currentLevel, gasTypes);
        
        let periodInfo = '';
        if (isYearLadder) {
          periodInfo = `${selectedEntity.attributes.计费标准.当前年阶梯起始日期}-${selectedEntity.attributes.计费标准.当前年阶梯结束日期}`;
        }
        ladderContent = html`
          <div class="ladder-section" style="background: ${BgColor2}; color: ${Color2}; text-shadow: ${Shadow};">
            <div class="ladder-header" >
              <span>${ladderTitle} ${periodInfo ? `：${periodInfo}` : ''}</span>
            </div>
            <div class="ladder-progress">
              <div class="progress-segment level1" style="width: ${level1Width}%"></div>
              <div class="progress-segment level2" style="width: ${level2Width}%"></div>
              <div class="progress-segment level3" style="width: ${level3Width}%"></div>
              <div class="progress-indicator" style="background: ${Color}; left: ${bubblePosition}%"></div>
              <div class="progress-bubble" style="color: ${Color}; text-shadow: ${Shadow}; box-shadow: ${Shadow}; left: ${constrainedBubblePosition}%; background: ${displayLevel === 1 ? '#4CAF50' : displayLevel === 2 ? '#FFC107' : '#FF5722'}; border-top-color: ${displayLevel === 1 ? '#4CAF50' : displayLevel === 2 ? '#FFC107' : '#FF5722'};" data-level="${displayLevel}">第${displayLevel}阶梯  ${totalUsage}m³</div>
              <div class="progress-bubble-arrow" style="left: ${constrainedArrowPosition}%; border-top-color: ${displayLevel === 1 ? '#4CAF50' : displayLevel === 2 ? '#FFC107' : '#FF5722'};"></div>
              <div class="progress-labels">
                <span class="progress-label level1-label" style="color: ${Color}; text-shadow: ${Shadow};">第1阶梯</span>
                <span class="progress-label level2-label" style="color: ${Color}; text-shadow: ${Shadow};">第2阶梯</span>
                <span class="progress-label level3-label" style="color: ${Color}; text-shadow: ${Shadow};">第3阶梯</span>
              </div>
            </div>

            <div class="ladder-price-section">
              <div class="price-block level1-price">
                <div class="price-range">0-${secondLevelStart}m³</div>
                ${this.renderPriceBlock(prices, 1)}
              </div>
              <div class="price-block level2-price">
                <div class="price-range">${secondLevelStart}-${thirdLevelStart}m³</div>
                ${this.renderPriceBlock(prices, 2)}
              </div>
              <div class="price-block level3-price">
                <div class="price-range">${thirdLevelStart}m³以上</div>
                ${this.renderPriceBlock(prices, 3)}
              </div>
            </div>
          </div>
        `;
      }
    }
    
    // 渲染价格区域内容
    let priceContent = '';
    if (selectedEntity.attributes && selectedEntity.attributes.计费标准) {
      const billingStandard = selectedEntity.attributes.计费标准.计费标准;
      const currentLevel = (!billingStandard || billingStandard === '平均单价') ? null : 
        (billingStandard?.includes('年阶梯') || false ? 
          selectedEntity.attributes.计费标准?.当前年阶梯档?.replace('第', '').replace('档', '') :
          selectedEntity.attributes.计费标准?.当前月阶梯档?.replace('第', '').replace('档', '')
        );
      
      const gasTypes = this.getGasType(selectedEntity.attributes?.monthlist || []);
      const prices = currentLevel ? this.getGasPrices(billingStandard, currentLevel, gasTypes) : {};
      const currentMonth = this.getCurrentMonth();
      const previousMonth = this.getPreviousMonth();
      const currentYear = new Date().getFullYear();

      const currentDayUsage = selectedEntity.attributes?.daylist?.[0];
      const currentMonthUsage = this.getMonthUsage(selectedEntity.attributes?.monthlist || [], currentMonth);
      const previousMonthUsage = this.getMonthUsage(selectedEntity.attributes?.monthlist || [], previousMonth);
      const yearUsage = this.getYearUsage(selectedEntity.attributes?.yearlist || [], currentYear);
      
      // 渲染价格区域内容
     priceContent = html`
        <div class="usage-grid">
          <div class="usage-section" style="background: ${BgColor2};">
            <div class="usage-title" style="color: ${Color2}; text-shadow: ${Shadow};">
              <ha-icon icon="mdi:fire" style="color: ${Color2}; --mdc-icon-size: 12px; margin: 0 1px; vertical-align: middle;"></ha-icon>
              近日用气
            </div>
            ${currentDayUsage ? html`
              <div class="usage-amount">
                <span class="usage-gas">${currentDayUsage.dayEleNum}m³</span>
                <span class="usage-cost">${currentDayUsage.dayEleCost}元</span>
              </div>
              ${this.renderDayBar(currentDayUsage)}
            ` : html`<div class="usage-amount">暂无数据</div>`}
          </div>
          
          <div class="usage-section" style="background: ${BgColor2}">
            <div class="usage-title" style="color: ${Color2}; text-shadow: ${Shadow};">
              <ha-icon icon="mdi:fire" style="color: ${Color2}; --mdc-icon-size: 12px; margin: 0 1px; vertical-align: middle;"></ha-icon>
              本月用气
            </div>
            ${currentMonthUsage ? html`
              <div class="usage-amount">
                <span class="usage-gas">${currentMonthUsage.monthEleNum}m³</span>
                <span class="usage-cost">${currentMonthUsage.monthEleCost}元</span>
              </div>
              ${this.renderUsageBar(currentMonthUsage)}
            ` : html`<div class="usage-amount">暂无数据</div>`}
          </div>
          
          <div class="usage-section" style="background: ${BgColor2}">
            <div class="usage-title" style="color: ${Color2}; text-shadow: ${Shadow};">
              <ha-icon icon="mdi:fire" style="color: ${Color2}; --mdc-icon-size: 12px; margin: 0 1px; vertical-align: middle;"></ha-icon>
              上月用气
            </div>
            ${previousMonthUsage ? html`
              <div class="usage-amount">
                <span class="usage-gas">${previousMonthUsage.monthEleNum}m³</span>
                <span class="usage-cost">${previousMonthUsage.monthEleCost}元</span>
              </div>
              ${this.renderUsageBar(previousMonthUsage)}
            ` : html`<div class="usage-amount">暂无数据</div>`}
          </div>
          
          <div class="usage-section" style="background: ${BgColor2}">
            <div class="usage-title" style="color: ${Color2}; text-shadow: ${Shadow};">
              <ha-icon icon="mdi:fire" style="color: ${Color2}; --mdc-icon-size: 12px; margin: 0 1px; vertical-align: middle;"></ha-icon>
              本年用气
            </div>
            ${yearUsage ? html`
              <div class="usage-amount">
                <span class="usage-gas">${yearUsage.yearEleNum}m³</span>
                <span class="usage-cost">${yearUsage.yearEleCost}元</span>
              </div>
              ${this.renderYearUsageBar(yearUsage)}
            ` : html`<div class="usage-amount">暂无数据</div>`}
          </div>
        `;
      }
        

    const daydate = selectedEntity.attributes?.daylist[0]?.day || '无';
    return html`
        <div class="card-main" style="background: ${BgColor}; color: ${Color}">
          <div class="top-section">
            <!-- 左侧：余额信息区域 -->
            <div class="balance-section">
              <div class="top-content">
                <img src=${svgpath} class="balance-icon" alt="燃气图标">
                <div class="balance-time">${selectedEntity.attributes?.date || ''}</div>
                <div class="balance-time">数据日期:${daydate}</div>
                
              </div>
              
              <div class="spacer"></div>
              
              <div class="balance-controls-container">
                <div class="balance-info" style="background: ${BgColor2}">
                  ${(() => {
                    // 明细预警优先级最高
                    let isWarning = false;
                    
                    // 获取当前选中实体的预警信息
                    const balanceData = this._balanceData.find(item => item.entity_id === selectedEntityId);
                    
                    // 首先检查明细预警，如果存在且满足条件，直接设为预警状态
                    if (balanceData && balanceData.warning && balanceData.warning.trim() !== '') {
                      isWarning = this._evaluateWarningCondition(balanceData.value, balanceData.warning); 
                    } else {
                      // 只有在没有明细预警时才检查全局预警
                      if (this.config.global_warning && this.config.global_warning.trim() !== '') {
                        isWarning = this._evaluateWarningCondition(selectedEntity.state, this.config.global_warning);
                      }
                    }
                    
                    return html`
                      <div class="balance-amount" style="color: ${isWarning ? '#F44336' : ''}">
                        <span class="currency" style="color: ${isWarning ? '#F44336' : ''}">￥</span>
                        ${selectedEntity.state || '0'}
                        <span class="currency" style="color: ${isWarning ? '#F44336' : ''}">元</span>
                      </div>
                    `;
                  })()}

                  ${isprepaid !== '是' ? html`
                    <div class="balance-label">燃气费余额</div>
                  ` : html`
                    <div class="balance-label">上月气费</div>
                  `}
                </div>
                
                 ${isprepaid !== '是' ? html`
                 <div class="days-info" style="background: ${BgColor2}">
                  <div class="days-amount">
                    ${selectedEntity.attributes?.剩余天数 || '0'}
                    <span class="currency">天</span>
                  </div>
                  <div class="days-label">预估使用天数</div>
                </div>
                ` : html``}
                
                <div class="action-buttons">
                  <div class="action-button ${this.showPanel === 'calendar' ? 'active' : ''}" @click="${() => this.showCalendar()}" style="background: ${BgColor2}; color: ${Color}">日历</div>
                  <div class="action-button ${this.showPanel === 'dayUsage' ? 'active' : ''}" @click="${() => this.showDayUsage()}" style="background: ${BgColor2}; color: ${Color}">日用气</div>
                  <div class="action-button ${this.showPanel === 'monthUsage' ? 'active' : ''}" @click="${() => this.showMonthUsage()}" style="background: ${BgColor2}; color: ${Color}">月用气</div>
                </div>
              </div>
            </div>
            
            <!-- 右侧：价格区块和阶梯区域 -->
            <div class="right-section">
              <!-- 右侧上方：价格区块 -->
              <div class="price-area">
                ${priceContent}
              </div>
              
              <!-- 右侧下方：阶梯区域 -->
              <div class="ladder-area">
                ${ladderContent}
              </div>
            </div>
          </div>
        </div>
    `;
  }  

  /*渲染整个卡片的主方法*/
  render() {
    return html`
      <div class="card-container " style="width: ${this.config.width};">
        ${this.renderHeader()}
        ${this.renderMain()}

        <!-- 显示区域 - 根据showPanel显示不同内容 -->
        ${this.showPanel === 'calendar' ? html`
          <div class="panel-section" >
            ${this.renderCalendar()}
          </div>
        ` : ''}
        
        ${this.showPanel === 'dayUsage' ? html`
          <div class="panel-section" >
            ${this.renderChartDay()}
          </div>
        ` : ''}
        
        ${this.showPanel === 'monthUsage' ? html`
          <div class="panel-section" >
            ${this.renderChartMonth()}
          </div>
        ` : ''}
      </div>
    `;
  }
}
customElements.define('xiaoshi-qinhua-gas-info', XiaoshiQinhuaGasCard);
