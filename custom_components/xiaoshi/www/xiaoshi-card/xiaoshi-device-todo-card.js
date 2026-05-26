import { LitElement, html, css } from "https://unpkg.com/lit-element@2.4.0/lit-element.js?module";

class XiaoshiTodoCardEditor extends LitElement {
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
        color: #f44336;
      }

      .remove-btn:hover {
        color: #d32f2f;
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
            .value=${this.config.theme !== undefined ? this.config.theme : 'on'}
            name="theme"
          >
            <option value="on">浅色主题（白底黑字）</option>
            <option value="off">深色主题（深灰底白字）</option>
          </select>
        </div>
        
        <div class="form-group">
          <label>待办事项实体：搜索并选择实体</label>
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
            搜索并选择要显示的待办事项实体，支持多选
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
    
    // 获取所有实体
    const allEntities = Object.values(this.hass.states);
    
    // 过滤实体，默认只显示todo.开头的实体
    this._filteredEntities = allEntities.filter(entity => {
      const entityId = entity.entity_id.toLowerCase();
      const friendlyName = (entity.attributes.friendly_name || '').toLowerCase();
      
      // 默认只显示todo.开头的实体，或者搜索时匹配搜索词
      const isTodoEntity = entityId.startsWith('todo.');
      const matchesSearch = entityId.includes(searchTerm) || friendlyName.includes(searchTerm);
      
      return isTodoEntity && matchesSearch;
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
customElements.define('xiaoshi-todo-card-editor', XiaoshiTodoCardEditor);

class XiaoshiTodoCard extends LitElement {
  static get properties() {
    return {
      hass: Object,
      config: Object,
      _todoData: Array,
      _loading: Boolean,
      _refreshInterval: Number,
      theme: { type: String },
      _editingItem: { type: Object },
      _expandedAddForm: { type: Object }
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
        background: rgb(255, 165, 0);
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
        background: rgb(255, 165, 0);
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
        background: rgb(255, 165, 0);
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
        background: rgb(255,165,0);
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

      /*待办事项样式*/
      .todo-item {
        transition: background-color 0.2s ease;
      }

      .todo-item:hover {
        background-color: rgba(150,150,150,0.1);
        border-radius: 4px;
      }

      .todo-item input[type="checkbox"] {
        cursor: pointer;
      }

      .todo-item button {
        background: none;
        border: none;
        cursor: pointer;
        padding: 4px;
        border-radius: 4px;
        transition: background-color 0.2s ease;
      }

      .todo-item button {
        color: #f44336;
      }

      .todo-item button:hover {
        background-color: rgba(244, 67, 54, 0.1);
        color: #d32f2f;
      }

      .add-todo {
        display: flex;
        gap: 4px;
        margin-top: 8px;
      }
      
      .add-todo input {
        flex: 1;
        padding: 4px;
        border-radius: 4px;
        background: var(--bg-color, #fff);
        border: 1px solid var(--fg-color, #000);
        color: var(--fg-color, #000);
      }
      
      .add-todo button {
        padding: 4px 8px;
        border-radius: 4px;
        border: 1px solid var(--fg-color, #000);
        background: var(--bg-color, #fff);
        color: var(--fg-color, #000);
        cursor: pointer;
      }
      
      .add-todo input:focus {
        outline: none;
        border-color: #2196F3;
        box-shadow: 0 0 0 2px rgba(33, 150, 243, 0.2);
      }

      .add-todo-expanded {
        display: flex;
        flex-direction: column;
        gap: 8px;
        margin-top: 8px;
        padding: 8px;
        border: 1px solid var(--fg-color, #000);
        border-radius: 4px;
        background: var(--bg-color, #fff);
      }

      .add-todo-row {
        display: flex;
        gap: 8px;
        align-items: center;
      }

      .add-todo-description {
        flex: 1;
        padding: 4px;
        border: 1px solid var(--fg-color, #000);
        border-radius: 4px;
        background: var(--bg-color, #fff);
        color: var(--fg-color, #000);
        font-size: 13px;
      }

      .add-todo-description:focus {
        outline: none;
        border-color: #2196F3;
        box-shadow: 0 0 0 2px rgba(33, 150, 243, 0.2);
      }

      .add-todo-date {
        padding: 4px;
        border: 1px solid var(--fg-color, #000);
        border-radius: 4px;
        background: var(--bg-color, #fff);
        color: var(--fg-color, #000);
        font-size: 12px;
        width: 120px;
      }

      /* 确保日期输入框显示正确的格式 */
      input[type="date"] {
        color-scheme: light dark;
      }

      input[type="date"]::-webkit-calendar-picker-indicator {
        cursor: pointer;
        filter: invert(0.5);
      }

      /* 深色主题下的日期选择器 */
      [theme="off"] input[type="date"]::-webkit-calendar-picker-indicator {
        filter: invert(1);
      }

      .add-todo-toggle {
        background: none;
        border: 1px solid var(--fg-color, #000);
        color: var(--fg-color, #000);
        padding: 4px 8px;
        border-radius: 4px;
        cursor: pointer;
        font-size: 12px;
        margin-top: 8px;
        margin-bottom: 2px;
      }

      .add-todo-toggle:hover {
        background-color: rgba(33, 150, 243, 0.1);
        border-color: #2196F3;
      }

      .todo-content {
        flex: 1;
        display: flex;
        flex-direction: column;
      }

      .todo-main {
        display: flex;
        align-items: center;
      }

      .todo-due {
        color: #ff9800;
        font-size: 12px;
        margin-left: 4px;
        font-weight: 500;
      }

      .todo-description {
        color: #999;
        font-size: 11px;
        margin-top: 2px;
        line-height: 1.3;
      }

      .todo-item.no-description {
        align-items: center;
      }

      .todo-item.no-description input[type="checkbox"] {
        margin-top: 0;
      }

      .todo-item .edit-btn {
        background: none;
        border: none;
        cursor: pointer;
        padding: 4px;
        border-radius: 4px;
        transition: background-color 0.2s ease;
        color: #2196F3 !important;
        margin-right: 4px;
      }

      .todo-item .edit-btn:hover {
        background-color: rgba(33, 150, 243, 0.1);
        color: #1976D2 !important;
      }

      .edit-input {
        flex: 1;
        padding: 4px;
        border: 1px solid var(--fg-color, #000);
        border-radius: 4px;
        background: var(--bg-color, #fff);
        color: var(--fg-color, #000);
        font-size: 13px;
        margin-right: 8px;
      }

      .edit-input:focus {
        outline: none;
        border-color: #2196F3;
        box-shadow: 0 0 0 2px rgba(33, 150, 243, 0.2);
      }
    `;
  }

  constructor() {
    super();
    this._todoData = [];
    this._loading = false;
    this._refreshInterval = null;
    this.theme = 'on';
    this._editingItem = null;
    this._expandedAddForm = {};
  }

  static getConfigElement() {
    return document.createElement("xiaoshi-todo-card-editor");
  }

  connectedCallback() {
    super.connectedCallback();
    this._loadTodoData();
    
    // 设置主题属性
    this.setAttribute('theme', this._evaluateTheme());
    
    // 每300秒刷新一次数据，减少频繁刷新
    this._refreshInterval = setInterval(() => {
      this._loadTodoData();
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

  _formatDate(dateString) {
    if (!dateString) return '';
    
    const date = new Date(dateString);
    
    // 检查日期是否有效
    if (isNaN(date.getTime())) {
      return dateString; // 如果无法解析，返回原字符串
    }
    
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    
    return `${year}-${month}-${day}`;
  }

  _formatDateForInput(dateString) {
    if (!dateString) return '';
    
    const date = new Date(dateString);
    
    // 检查日期是否有效
    if (isNaN(date.getTime())) {
      return '';
    }
    
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    
    return `${year}-${month}-${day}`;
  }

  _calculateDueDate(dueDate) {
    if (!dueDate) return '';
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const due = new Date(dueDate);
    
    // 检查日期是否有效
    if (isNaN(due.getTime())) {
      return dueDate; // 如果无法解析，返回原字符串
    }
    
    due.setHours(0, 0, 0, 0);
    
    const diffTime = due - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
      return '今天';
    } else if (diffDays === 1) {
      return '明天';
    } else if (diffDays === -1) {
      return '昨天';
    } else if (diffDays > 0 && diffDays <= 7) {
      return `${diffDays}天后`;
    } else if (diffDays > 7) {
      return this._formatDate(dueDate);
    } else {
      return `${Math.abs(diffDays)}天前`;
    }
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    if (this._refreshInterval) {
      clearInterval(this._refreshInterval);
    }
  }

  async _loadTodoData() {
    if (!this.hass) return;
    
    this._loading = true;
    this.requestUpdate();

    try {
      const entities = this.config.entities || [];
      const todoData = [];

      for (const entityId of entities) {
        const entity = this.hass.states[entityId];
        if (!entity) continue;

        // 获取待办事项项目
        let todoItems = [];
        try {
          // 获取所有待办事项 - 使用 WebSocket API
          const result = await this.hass.callWS({
            type: 'todo/item/list',
            entity_id: entityId
          });
          
          todoItems = result.items || [];
        } catch (error) {
          console.error(`获取待办事项失败 ${entityId}:`, error);
        }

        const attributes = entity.attributes;
        todoData.push({
          entity_id: entityId,
          friendly_name: attributes.friendly_name || entityId,
          icon: attributes.icon || 'mdi:format-list-checks',
          state: entity.state || '0',
          items: todoItems,
          incomplete_count: todoItems.filter(item => item.status === 'needs_action').length,
          completed_count: todoItems.filter(item => item.status === 'completed').length
        });
      }

      this._todoData = todoData;
    } catch (error) {
      console.error('加载待办事项数据失败:', error);
      this._todoData = [];
    }

    this._loading = false;
  }

  _handleRefresh() {
    this._handleClick();
    this._loadTodoData();
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

  async _addTodoItem(entityId, item, description = '', due = '') {
    try {
      const params = {
        entity_id: entityId,
        item: item
      };
      
      // 只有当描述不为空时才添加
      if (description && description.trim()) {
        params.description = description.trim();
      }
      
      // 只有当日期不为空时才添加
      if (due && due.trim()) {
        params.due_date = due.trim();
      }
      
      await this.hass.callService('todo', 'add_item', params);
      this._loadTodoData(); // 重新加载数据
    } catch (error) {
      console.error('添加待办事项失败:', error);
    }
  }

  async _removeTodoItem(entityId, item) {
    try {
      await this.hass.callService('todo', 'remove_item', {
        entity_id: entityId,
        item: item
      });
      this._loadTodoData(); // 重新加载数据
    } catch (error) {
      console.error('删除待办事项失败:', error);
    }
  }

  async _updateTodoItem(entityId, item, status) {
    try {
      await this.hass.callService('todo', 'update_item', {
        entity_id: entityId,
        item: item,
        status: status
      });
      this._loadTodoData(); // 重新加载数据
    } catch (error) {
      console.error('更新待办事项失败:', error);
    }
  }

  async _editTodoItem(entityId, oldItem, newItem, description = '', due = '') {
    try {
      // 先删除旧的待办事项，然后添加新的
      await this.hass.callService('todo', 'remove_item', {
        entity_id: entityId,
        item: oldItem
      });
      
      const params = {
        entity_id: entityId,
        item: newItem
      };
      
      // 只有当描述不为空时才添加
      if (description && description.trim()) {
        params.description = description.trim();
      }
      
      // 只有当日期不为空时才添加
      if (due && due.trim()) {
        params.due_date = due.trim();
      }
      
      await this.hass.callService('todo', 'add_item', params);
      this._loadTodoData(); // 重新加载数据
    } catch (error) {
      console.error('修改待办事项失败:', error);
    }
  }

  render() {
    if (!this.hass) {
      return html`<div class="loading">等待Home Assistant连接...</div>`;
    }
    // 获取主题和颜色
    const theme = this._evaluateTheme();
    const fgColor = theme === 'on' ? 'rgb(0, 0, 0)' : 'rgb(255, 255, 255)';
    const bgColor = theme === 'on' ? 'rgb(255, 255, 255)' : 'rgb(50, 50, 50)';
    
    // 计算总待办数量
    const totalIncompleteCount = this._todoData.reduce((sum, todo) => sum + todo.incomplete_count, 0);
    
    return html`
      <ha-card style="--fg-color: ${fgColor}; --bg-color: ${bgColor};">
        <div class="card-header">
          <div class="card-title">
            <span class="offline-indicator"></span>
            待办事项
          </div>
          <div style="display: flex; align-items: center; gap: 8px; ">
              <span class="device-count">
                 ${totalIncompleteCount}
              </span>
            <button class="refresh-btn" @click=${this._handleRefresh}>
              刷新
            </button>
          </div>
        </div>
        
        <div class="devices-list">
          ${this._loading ? 
            html`<div class="loading">加载中...</div>` :
            
            this._todoData.length === 0 ? 
              html`<div class="no-devices">请配置待办事项实体</div>` :
              html`
                ${this._todoData.map(todoData => html`
                  <div class="section-divider">
                    <div class="section-title">
                      <span>${todoData.friendly_name}</span>
                      <span class="section-count">${todoData.incomplete_count}</span>
                    </div>
                  </div>
                  <div class="device-item">
                    <div class="device-info">
                      ${todoData.items.length === 0 ? 
                        html`<div class="no-devices">暂无待办事项</div>` :
                        html`
                          ${(() => {
                            // 将待办事项分为有时间和无时间两组
                            const itemsWithoutTime = todoData.items.filter(item => !item.due);
                            const itemsWithTime = todoData.items.filter(item => item.due);
                            
                            // 没有时间的按名称排序
                            itemsWithoutTime.sort((a, b) => (a.summary || '').localeCompare(b.summary || ''));
                            
                            // 有时间的按时间排序
                            itemsWithTime.sort((a, b) => {
                              const dateA = new Date(a.due);
                              const dateB = new Date(b.due);
                              return dateA - dateB;
                            });
                            
                            // 合并结果：无时间的在前，有时间的在后
                            const sortedItems = [...itemsWithoutTime, ...itemsWithTime];
                            
                            return sortedItems.map(item => {
                            const dueText = this._calculateDueDate(item.due);
                            const isEditing = this._editingItem && this._editingItem.entityId === todoData.entity_id && this._editingItem.uid === item.uid;
                            
                            return html`
                              <div class="todo-item ${!item.description ? 'no-description' : ''}" style="display: flex; padding: 4px 0; border-bottom: 1px solid rgba(150,150,150,0.1);">
                                <input 
                                  type="checkbox" 
                                  .checked=${item.status === 'completed'}
                                  @change=${(e) => {
                                    this._updateTodoItem(todoData.entity_id, item.summary || item.uid, e.target.checked ? 'completed' : 'needs_action'); 
                                    this._handleClick();
                                  }}
                                  style="margin-right: 8px; margin-top: 2px;"
                                />
                                ${isEditing ? html`
                                  <div style="flex: 1; display: flex; flex-direction: column; gap: 4px;">
                                    <input 
                                      class="edit-input"
                                      type="text" 
                                      .value=${this._editingItem.summary}
                                      @input=${(e) => {
                                        this._editingItem.summary = e.target.value;
                                        this.requestUpdate();
                                      }}
                                    />
                                    <textarea 
                                      class="edit-input"
                                      style="min-height: 40px; resize: vertical;"
                                      placeholder="描述（可选）..."
                                      .value=${this._editingItem.description || ''}
                                      @input=${(e) => {
                                        this._editingItem.description = e.target.value;
                                        this.requestUpdate();
                                      }}
                                    ></textarea>
                                    <div style="display: flex; gap: 8px; align-items: center;">
                                      <input 
                                        type="date" 
                                        class="edit-input"
                                        style="width: auto; flex: none;"
                                        .value=${this._editingItem.due || ''}
                                        @input=${(e) => {
                                          this._editingItem.due = e.target.value;
                                          this.requestUpdate();
                                          this._handleClick();
                                        }}
                                      />
                                      <button 
                                        style="padding: 4px 8px; background: #4CAF50; color: white; border: none; border-radius: 4px; cursor: pointer;"
                                        @click=${() => {
                                          this._editTodoItem(todoData.entity_id, item.summary || item.uid, this._editingItem.summary, this._editingItem.description, this._editingItem.due);
                                          this._editingItem = null;
                                          this.requestUpdate();
                                          this._handleClick();
                                        }}
                                      >
                                        保存
                                      </button>
                                      <button 
                                        style="padding: 4px 8px; background: #f44336; color: white; border: none; border-radius: 4px; cursor: pointer;"
                                        @click=${() => {
                                          this._editingItem = null;
                                          this.requestUpdate();
                                          this._handleClick();
                                        }}
                                      >
                                        取消
                                      </button>
                                    </div>
                                  </div>
                                ` : html`
                                  <div class="todo-content">
                                    <div class="todo-main" style="text-decoration: ${item.status === 'completed' ? 'line-through' : 'none'}; color: ${item.status === 'completed' ? '#999' : 'var(--fg-color, #000)'};">
                                      <span>${item.summary}</span>
                                      ${dueText ? html`<span class="todo-due">(${dueText})</span>` : ''}
                                    </div>
                                    ${item.description ? html`<div class="todo-description">${item.description}</div>` : ''}
                                  </div>
                                `}
                                ${!isEditing ? html`
                                  <button 
                                    class="edit-btn" 
                                    @click=${() => {
                                      this._editingItem = {
                                        entityId: todoData.entity_id,
                                        uid: item.uid,
                                        summary: item.summary,
                                        description: item.description || '',
                                        due: this._formatDateForInput(item.due) || ''
                                      };
                                      this.requestUpdate();
                                      this._handleClick();
                                    }}
                                    style="margin-left: 8px; margin-top: 2px;"
                                    title="修改"
                                  >
                                    <ha-icon icon="mdi:pencil"></ha-icon>
                                  </button>
                                ` : ''}
                                <button 
                                  class="remove-btn" 
                                  @click=${() => {
                                    this._removeTodoItem(todoData.entity_id, item.summary || item.uid);
                                    this._handleClick();
                                  }}
                                  style="margin-left: 4px; margin-top: 2px;"
                                  title="删除"
                                >
                                  <ha-icon icon="mdi:delete"></ha-icon>
                                </button>
                              </div>
                            `;
                          });
                          })()}
                        `
                      }
                      <div>
                        <button 
                          class="add-todo-toggle"
                          @click=${() => {
                            this._expandedAddForm = {
                              ...this._expandedAddForm,
                              [todoData.entity_id]: !this._expandedAddForm[todoData.entity_id]
                            };
                            this.requestUpdate();
                            this._handleClick();
                          }}
                        >
                          ${this._expandedAddForm[todoData.entity_id] ? '收起' : '添加新待办事项'}
                        </button>
                        
                        ${this._expandedAddForm[todoData.entity_id] ? html`
                          <div class="add-todo-expanded">
                            <input 
                              type="text" 
                              class="add-todo-description"
                              placeholder="待办事项名称..." 
                              @keypress=${(e) => {
                                if (e.key === 'Enter') {
                                  e.preventDefault();
                                  const descInput = e.target.parentElement.querySelector('.add-todo-description:nth-of-type(2)');
                                  const dateInput = e.target.parentElement.querySelector('.add-todo-date');
                                  if (e.target.value.trim()) {
                                    this._addTodoItem(todoData.entity_id, e.target.value.trim(), descInput.value, dateInput.value);
                                    e.target.value = '';
                                    descInput.value = '';
                                    dateInput.value = '';
                                  }
                                }
                              }}
                            />
                            <input 
                              type="text" 
                              class="add-todo-description"
                              placeholder="描述（可选）..."
                            />
                            <div class="add-todo-row">
                              <input 
                                type="date" 
                                class="add-todo-date"
                                placeholder="截止日期（可选）"
                              />
                              <button 
                                @click=${(e) => {
                                  const nameInput = e.target.closest('.add-todo-expanded').querySelector('.add-todo-description:first-of-type');
                                  const descInput = e.target.closest('.add-todo-expanded').querySelector('.add-todo-description:nth-of-type(2)');
                                  const dateInput = e.target.closest('.add-todo-expanded').querySelector('.add-todo-date');
                                  if (nameInput.value.trim()) {
                                    this._addTodoItem(todoData.entity_id, nameInput.value.trim(), descInput.value, dateInput.value);
                                    nameInput.value = '';
                                    descInput.value = '';
                                    dateInput.value = '';
                                  }
                                  this._handleClick();
                                }}
                              >
                                添加
                              </button>
                            </div>
                          </div>
                        ` : ''}
                      </div>
                    </div>
                  </div>
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
    // 根据待办事项实体数量动态计算卡片大小
    const baseSize = 3;
    const entitySize = Math.max(0, Math.min(this._todoData.length * 2, 10));
    return baseSize + entitySize;
  }
}
customElements.define('xiaoshi-todo-card', XiaoshiTodoCard);
