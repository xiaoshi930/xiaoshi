const whenDefined = (t) => customElements.whenDefined(t);
await Promise.race([whenDefined("ha-card"), whenDefined("ha-panel-lovelace")]);
const LitElement = window.LitElement || Object.getPrototypeOf(customElements.get("ha-card"));
const html = LitElement.prototype.html;
const css = LitElement.prototype.css;
import { yamlToJson } from '../function/function.js';

// ==================== 注册自定义卡片 ====================
window.customCards = window.customCards || [];
window.customCards.push({
  type: 'xiaoshi-todo-card',
  name: '消逝待办信息卡片',
  description: '消逝待办信息详细卡片',
  preview: false
});
window.customCards.push({
  type: 'xiaoshi-todo-button',
  name: '消逝待办信息按钮',
  description: '消逝待办信息按钮',
  preview: true
});

// ==================== 公共工具函数（无this依赖） ====================
function formatDate(dateString) {
  if (!dateString) return '';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return dateString;
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function formatDateForInput(dateString) {
  if (!dateString) return '';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return '';
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function calculateDueDate(dueDate) {
  if (!dueDate) return '';
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(dueDate);
  if (isNaN(due.getTime())) return dueDate;
  due.setHours(0, 0, 0, 0);
  const diffTime = due - today;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return '今天';
  if (diffDays === 1) return '明天';
  if (diffDays === -1) return '昨天';
  if (diffDays > 0 && diffDays <= 7) return `${diffDays}天后`;
  if (diffDays > 7) return formatDate(dueDate);
  return `${Math.abs(diffDays)}天前`;
}

// ==================== 公共CSS样式 ====================
const editorCommonStyles = css`  
  .form { display: flex; flex-direction: column; gap: 10px; min-height: 500px; }
  .form-group { display: flex; flex-direction: column; gap: 5px; }
  .form-row { display: flex; align-items: center; gap: 8px; }
  .form-row label { font-weight: bold; white-space: nowrap; min-width: 80px; }
  .form-row input { flex: 1; padding: 6px 8px; border: 1px solid #ddd; border-radius: 4px; }
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
  .entity-info { display: flex; align-items: center; gap: 8px; flex: 1; }
  .entity-details { flex: 1; }
  .entity-name { font-weight: 500; font-size: 14px; color: #000; }
  .entity-id { font-size: 12px; color: #000; font-family: monospace; }
  .check-icon { color: #4CAF50; }
  .no-results { padding: 12px; text-align: center; color: #666; font-style: italic; }
  .selected-entities { margin-top: 8px; }
  .selected-label { font-size: 12px; font-weight: bold; margin-bottom: 4px; color: #333; }
  .selected-entity { display: inline-flex; align-items: center; gap: 4px; background: #f0f0f0; padding: 4px 8px; border-radius: 16px; margin: 2px 4px 2px 0; font-size: 12px; color: #000; }
  .remove-btn { background: none; border: none; cursor: pointer; padding: 0; display: flex; align-items: center; color: #f44336; }
  .remove-btn:hover { color: #d32f2f; }
`;

const cardCommonStyles = css`  
  :host { display: block; max-width:500px; margin: 0 auto; }
  ha-card { width: 100%; height: 100%; display: flex; flex-direction: column; background: var(--bg-color, #fff); border-radius: 12px; }
  .card-header { display: flex; justify-content: space-between; align-items: center; padding: 16px; background: var(--bg-color, #fff); border-radius: 12px; }
  .offline-indicator { display: inline-block; width: 8px; height: 8px; border-radius: 50%; margin-right: 8px; background: rgb(255, 165, 0); }
  @keyframes pulse {
    0% { opacity: 1; }
    50% { opacity: 0.5; }
    100% { opacity: 1; }
  }
  .card-title { font-size: 20px; font-weight: 500; color: var(--fg-color, #000); height: 30px; line-height: 30px; display: flex; align-items: center; justify-content: center; }
  .device-count { color: var(--fg-color, #000); border-radius: 8px; font-size: 13px; width: 30px; height: 30px; text-align: center; line-height: 30px; font-weight: bold; padding: 0px; background: rgb(255, 165, 0); }
  .refresh-btn { color: var(--fg-color, #fff); border: none; border-radius: 8px; padding: 5px; cursor: pointer; font-size: 13px; width: 50px; height: 30px; line-height: 30px; text-align: center; font-weight: bold; padding: 0px; background: rgb(255, 165, 0); }
  .section-divider { margin: 0 0 8px 0; padding: 8px 8px; background: var(--bg-color, #fff); font-weight: 500; color: var(--fg-color, #000); border-top: 1px solid rgb(150,150,150,0.5); border-bottom: 1px solid rgb(150,150,150,0.5); margin: 0 16px 0 16px; }
  .section-title { display: flex; align-items: center; justify-content: space-between; color: var(--fg-color, #000); font-size: 13px; }
  .section-count { background: rgb(255,165,0); color: var(--fg-color, #000); border-radius: 12px; width: 15px; height: 15px; text-align: center; line-height: 15px; padding: 3px; font-size: 12px; font-weight: bold; }
  .device-item { display: flex; align-items: center; padding: 0px; border-bottom: 1px solid rgb(150,150,150,0.2); margin: 0 32px 0px 32px; }
  .devices-list { flex: 1; overflow-y: auto; min-height: 0; padding: 0 0 8px 0; }
  .device-icon { margin-right: 12px; color: var(--error-color); }
  .device-info { flex-grow: 1; padding: 6px 0; }
  .device-name { font-weight: 500; color: var(--fg-color, #000); padding: 6px 0 0 0; }
  .device-entity { font-size: 10px; color: var(--fg-color, #000); font-family: monospace; }
  .device-details { font-size: 10px; color: var(--fg-color, #000); }
  .device-last-seen { font-size: 10px; color: var(--fg-color, #000); margin-left: auto; }
  .no-devices { text-align: center; padding: 8px 0 0 0; color: var(--fg-color, #000); }
  .loading { text-align: center; padding: 0px; color: var(--fg-color, #000); }
  .device-details ha-icon { --mdc-icon-size: 12px; color: var(--fg-color, #000); }
  .todo-item { transition: background-color 0.2s ease; }
  .todo-item:hover { background-color: rgba(150,150,150,0.1); border-radius: 4px; }
  .todo-item input[type="checkbox"] { cursor: pointer; }
  .todo-item button { background: none; border: none; cursor: pointer; padding: 4px; border-radius: 4px; transition: background-color 0.2s ease; color: #f44336; }
  .todo-item button:hover { background-color: rgba(244, 67, 54, 0.1); color: #d32f2f; }
  .add-todo { display: flex; gap: 4px; margin-top: 8px; }
  .add-todo input { flex: 1; padding: 4px; border-radius: 4px; background: var(--bg-color, #fff); border: 1px solid var(--fg-color, #000); color: var(--fg-color, #000); }
  .add-todo button { padding: 4px 8px; border-radius: 4px; border: 1px solid var(--fg-color, #000); background: var(--bg-color, #fff); color: var(--fg-color, #000); cursor: pointer; }
  .add-todo input:focus { outline: none; border-color: #2196F3; box-shadow: 0 0 0 2px rgba(33, 150, 243, 0.2); }
  .add-todo-expanded { display: flex; flex-direction: column; gap: 8px; margin-top: 8px; padding: 8px; border: 1px solid var(--fg-color, #000); border-radius: 4px; background: var(--bg-color, #fff); }
  .add-todo-row { display: flex; gap: 8px; align-items: center; }
  .add-todo-description { flex: 1; padding: 4px; border: 1px solid var(--fg-color, #000); border-radius: 4px; background: var(--bg-color, #fff); color: var(--fg-color, #000); font-size: 13px; }
  .add-todo-description:focus { outline: none; border-color: #2196F3; box-shadow: 0 0 0 2px rgba(33, 150, 243, 0.2); }
  .add-todo-date { padding: 4px; border: 1px solid var(--fg-color, #000); border-radius: 4px; background: var(--bg-color, #fff); color: var(--fg-color, #000); font-size: 12px; width: 120px; }
  input[type="date"] { color-scheme: light dark; }
  input[type="date"]::-webkit-calendar-picker-indicator { cursor: pointer; filter: invert(0.5); }
  [theme="off"] input[type="date"]::-webkit-calendar-picker-indicator { filter: invert(1); }
  .add-todo-toggle { background: none; border: 1px solid var(--fg-color, #000); color: var(--fg-color, #000); padding: 4px 8px; border-radius: 4px; cursor: pointer; font-size: 12px; margin-top: 8px; margin-bottom: 2px; }
  .add-todo-toggle:hover { background-color: rgba(33, 150, 243, 0.1); border-color: #2196F3; }
  .todo-content { flex: 1; display: flex; flex-direction: column; }
  .todo-main { display: flex; align-items: center; }
  .todo-due { color: #ff9800; font-size: 12px; margin-left: 4px; font-weight: 500; }
  .todo-description { color: #999; font-size: 11px; margin-top: 2px; line-height: 1.3; }
  .todo-item.no-description { align-items: center; }
  .todo-item.no-description input[type="checkbox"] { margin-top: 0; }
  .todo-item .edit-btn { background: none; border: none; cursor: pointer; padding: 4px; border-radius: 4px; transition: background-color 0.2s ease; color: #2196F3 !important; margin-right: 4px; }
  .todo-item .edit-btn:hover { background-color: rgba(33, 150, 243, 0.1); color: #1976D2 !important; }
  .edit-input { flex: 1; padding: 4px; border: 1px solid var(--fg-color, #000); border-radius: 4px; background: var(--bg-color, #fff); color: var(--fg-color, #000); font-size: 13px; margin-right: 8px; }
  .edit-input:focus { outline: none; border-color: #2196F3; box-shadow: 0 0 0 2px rgba(33, 150, 243, 0.2); }
`;

// ==================== 编辑器混入（Mixin） ====================
const TodoEditorMixin = (superClass) => class extends superClass {
  static get properties() {
    return {
      hass: { type: Object },
      config: { type: Object },
      _searchTerm: { type: String },
      _filteredEntities: { type: Array },
      _showEntityList: { type: Boolean }
    };
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

  _onEntitySearch(e) {
    const searchTerm = e.target.value.toLowerCase();
    this._searchTerm = searchTerm;
    this._showEntityList = true;
    if (!this.hass) return;
    const allEntities = Object.values(this.hass.states);
    this._filteredEntities = allEntities.filter(entity => {
      const entityId = entity.entity_id.toLowerCase();
      const friendlyName = (entity.attributes.friendly_name || '').toLowerCase();
      const isTodoEntity = entityId.startsWith('todo.');
      const matchesSearch = entityId.includes(searchTerm) || friendlyName.includes(searchTerm);
      return isTodoEntity && matchesSearch;
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
    this.config = { ...this.config, entities: newEntities };
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

  _renderEntitySelector() {
    return html`
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
    `;
  }
};

// ==================== 主组件混入（Mixin） ====================
const TodoBaseMixin = (superClass) => class extends superClass {
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

  constructor() {
    super();
    this._todoData = [];
    this._loading = false;
    this._refreshInterval = null;
    this.theme = 'system';
    this._holdTimer = null;
    this._holdTriggered = false;
    this._editingItem = null;
    this._expandedAddForm = {};
  }

  connectedCallback() {
    super.connectedCallback();
    this._loadTodoData();
    this.setAttribute('theme', this._evaluateTheme());
    this._refreshInterval = setInterval(() => {
      this._loadTodoData();
    }, this._getRefreshInterval());
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    if (this._refreshInterval) {
      clearInterval(this._refreshInterval);
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

  _formatDate(dateString) {
    return formatDate(dateString);
  }

  _formatDateForInput(dateString) {
    return formatDateForInput(dateString);
  }

  _calculateDueDate(dueDate) {
    return calculateDueDate(dueDate);
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
        let todoItems = [];
        try {
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
    if (entity.entity_id) {
      const evt = new Event('hass-more-info', { composed: true });
      evt.detail = { entityId: entity.entity_id };
      this.dispatchEvent(evt);
    }
  }

  // ===== 长按弹窗 (hold_popup_cards) =====
  _onHoldStart(e) {
    this._holdTriggered = false;
    this._holdTimer = setTimeout(() => {
      this._holdTriggered = true;
      this._onHoldPopup();
    }, 500);
  }
  _onHoldEnd() {
    if (this._holdTimer) {
      clearTimeout(this._holdTimer);
      this._holdTimer = null;
    }
  }
  _onHoldPopup() {
    const holdConfig = this.config.hold_popup_cards;
    if (!holdConfig || !holdConfig.trim()) return;
    try {
      const h = this._hass || this.hass;
      const cards = yamlToJson(holdConfig);
      if (!cards || cards.length === 0) return;
      const theme = this._evaluateTheme ? this._evaluateTheme() : 'light';
      const cardsWithTheme = cards.map(card => {
        if (!card.theme && this.config.theme) {
          return { ...card, theme: this.config.theme === 'system' ? theme : this.config.theme };
        }
        return card;
      });
      if (this._handleClick) this._handleClick();
      const serviceData = { card: cardsWithTheme };
      const popupWidth = this.config.popup_width || '95%';
      const popupTop = this.config.popup_top || '20px';
      if (popupWidth !== '95%') serviceData.popup_width = popupWidth;
      if (popupTop !== '20px') serviceData.popup_top = popupTop;
      serviceData.background = 'transparent';
      h.callService('popup_card', 'show', serviceData);
    } catch (err) {
      console.error('解析长按弹窗卡片失败:', err);
    }
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

  async _addTodoItem(entityId, item, description = '', due = '') {
    try {
      const params = { entity_id: entityId, item: item };
      if (description && description.trim()) {
        params.description = description.trim();
      }
      if (due && due.trim()) {
        params.due_date = due.trim();
      }
      await this.hass.callService('todo', 'add_item', params);
      this._loadTodoData();
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
      this._loadTodoData();
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
      this._loadTodoData();
    } catch (error) {
      console.error('更新待办事项失败:', error);
    }
  }

  async _editTodoItem(entityId, oldItem, newItem, description = '', due = '') {
    try {
      await this.hass.callService('todo', 'remove_item', {
        entity_id: entityId,
        item: oldItem
      });
      const params = { entity_id: entityId, item: newItem };
      if (description && description.trim()) {
        params.description = description.trim();
      }
      if (due && due.trim()) {
        params.due_date = due.trim();
      }
      await this.hass.callService('todo', 'add_item', params);
      this._loadTodoData();
    } catch (error) {
      console.error('修改待办事项失败:', error);
    }
  }

  _renderTodoItems(todoData) {
    return todoData.map(todo => html`
      <div class="section-divider">
        <div class="section-title">
          <span>${todo.friendly_name}</span>
          <span class="section-count">${todo.incomplete_count}</span>
        </div>
      </div>
      <div class="device-item">
        <div class="device-info">
          ${todo.items.length === 0 ? 
            html`<div class="no-devices">暂无待办事项</div>` :
            html`${this._renderSortedItems(todo)}`
          }
          ${this._renderAddForm(todo.entity_id)}
        </div>
      </div>
    `);
  }

  _renderSortedItems(todo) {
    const itemsWithoutTime = todo.items.filter(item => !item.due);
    const itemsWithTime = todo.items.filter(item => item.due);
    itemsWithoutTime.sort((a, b) => (a.summary || '').localeCompare(b.summary || ''));
    itemsWithTime.sort((a, b) => new Date(a.due) - new Date(b.due));
    const sortedItems = [...itemsWithoutTime, ...itemsWithTime];
    return sortedItems.map(item => this._renderTodoItem(todo.entity_id, item));
  }

  _renderTodoItem(entityId, item) {
    const dueText = this._calculateDueDate(item.due);
    const isEditing = this._editingItem && this._editingItem.entityId === entityId && this._editingItem.uid === item.uid;
    return html`
      <div class="todo-item ${!item.description ? 'no-description' : ''}" style="display: flex; padding: 4px 0; border-bottom: 1px solid rgba(150,150,150,0.1);">
        <input 
          type="checkbox" 
          .checked=${item.status === 'completed'}
          @change=${(e) => {
            this._updateTodoItem(entityId, item.summary || item.uid, e.target.checked ? 'completed' : 'needs_action'); 
            this._handleClick();
          }}
          style="margin-right: 8px; margin-top: 2px;"
        />
        ${isEditing ? this._renderEditForm(entityId, item) : this._renderTodoContent(item, dueText)}
        ${!isEditing ? html`
          <button 
            class="edit-btn" 
            @click=${() => {
              this._editingItem = {
                entityId: entityId,
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
            this._removeTodoItem(entityId, item.summary || item.uid);
            this._handleClick();
          }}
          style="margin-left: 4px; margin-top: 2px;"
          title="删除"
        >
          <ha-icon icon="mdi:delete"></ha-icon>
        </button>
      </div>
    `;
  }

  _renderEditForm(entityId, item) {
    return html`
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
              this._editTodoItem(entityId, item.summary || item.uid, this._editingItem.summary, this._editingItem.description, this._editingItem.due);
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
    `;
  }

  _renderTodoContent(item, dueText) {
    return html`
      <div class="todo-content">
        <div class="todo-main" style="text-decoration: ${item.status === 'completed' ? 'line-through' : 'none'}; color: ${item.status === 'completed' ? '#999' : 'var(--fg-color, #000)'};">
          <span>${item.summary}</span>
          ${dueText ? html`<span class="todo-due">(${dueText})</span>` : ''}
        </div>
        ${item.description ? html`<div class="todo-description">${item.description}</div>` : ''}
      </div>
    `;
  }

  _renderAddForm(entityId) {
    return html`
      <div>
        <button 
          class="add-todo-toggle"
          @click=${() => {
            this._expandedAddForm = {
              ...this._expandedAddForm,
              [entityId]: !this._expandedAddForm[entityId]
            };
            this.requestUpdate();
            this._handleClick();
          }}
        >
          ${this._expandedAddForm[entityId] ? '收起' : '添加新待办事项'}
        </button>
        ${this._expandedAddForm[entityId] ? html`
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
                    this._addTodoItem(entityId, e.target.value.trim(), descInput.value, dateInput.value);
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
                    this._addTodoItem(entityId, nameInput.value.trim(), descInput.value, dateInput.value);
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
    `;
  }
};

// ==================== 消逝待办卡编辑器 ====================
class XiaoshiTodoCardEditor extends TodoEditorMixin(LitElement) {
  static get styles() {
    return editorCommonStyles;
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
        ${this._renderEntitySelector()}
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
    this.dispatchEvent(new CustomEvent('config-changed', {
      detail: { config: this.config },
      bubbles: true,
      composed: true
    }));
  }
}
customElements.define('xiaoshi-todo-card-editor', XiaoshiTodoCardEditor);

// ==================== 消逝待办卡 ====================
class XiaoshiTodoCard extends TodoBaseMixin(LitElement) {
  static get styles() {
    return cardCommonStyles;
  }

  static getConfigElement() {
    return document.createElement("xiaoshi-todo-card-editor");
  }

  _getRefreshInterval() {
    return 300000;
  }

  render() {
    if (!this.hass) {
      return html`<div class="loading">等待Home Assistant连接...</div>`;
    }
    const theme = this._evaluateTheme();
    const fgColor = theme === 'light' ? 'rgb(0, 0, 0)' : 'rgb(255, 255, 255)';
    const bgColor = theme === 'light' ? 'rgb(255, 255, 255)' : 'rgb(50, 50, 50)';
    const totalIncompleteCount = this._todoData.reduce((sum, todo) => sum + todo.incomplete_count, 0);
    return html`
      <ha-card style="--fg-color: ${fgColor}; --bg-color: ${bgColor};">
        <div class="card-header">
          <div class="card-title">
            <span class="offline-indicator"></span>
            待办事项
          </div>
          <div style="display: flex; align-items: center; gap: 8px; ">
            <span class="device-count">${totalIncompleteCount}</span>
            <button class="refresh-btn" @click=${this._handleRefresh}>刷新</button>
          </div>
        </div>
        <div class="devices-list">
          ${this._loading ? 
            html`<div class="loading">加载中...</div>` :
            this._todoData.length === 0 ? 
              html`<div class="no-devices">请配置待办事项实体</div>` :
              html`${this._renderTodoItems(this._todoData)}`
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
    const entitySize = Math.max(0, Math.min(this._todoData.length * 2, 10));
    return baseSize + entitySize;
  }
}
customElements.define('xiaoshi-todo-card', XiaoshiTodoCard);

// ==================== 消逝待办按钮编辑器 ====================
class XiaoshiTodoButtonEditor extends TodoEditorMixin(LitElement) {
  static get styles() {
    return [
      editorCommonStyles,
      css`        
        .checkbox-group { display: flex; align-items: center; gap: 0; margin: 0; padding: 0; }
        .checkbox-input { margin: 0; }
        .checkbox-label { font-weight: normal; margin: 0; }
      `
    ];
  }

  render() {
    if (!this.hass) return html``;
    return html`
      
      <div class="form">
        ${this._renderEntitySelector()}

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
          <label>按钮显示文本
          <input 
            type="text" 
            @change=${this._entityChanged}
            .value=${this.config.button_text !== undefined ? this.config.button_text : '待办'}
            name="button_text"
            placeholder="待办"
          /></label>
        </div>

        <div class="form-group">
          <label>按钮显示图标
          <input 
            type="text" 
            @change=${this._entityChanged}
            .value=${this.config.button_icon !== undefined ? this.config.button_icon : '📝'}
            name="button_icon"
            placeholder="📝"
          /></label>
        </div>

        <div class="checkbox-group">
          <input 
            type="checkbox" 
            class="checkbox-input"
            @change=${this._entityChanged}
            .checked=${this.config.transparent_bg === true}
            name="transparent_bg"
            id="transparent_bg"
          />
          <label for="transparent_bg" class="checkbox-label"> 
            （平板端特性）透明背景（勾选后按钮背景透明）
          </label>
        </div>
    
        <div class="checkbox-group">
          <input 
            type="checkbox" 
            class="checkbox-input"
            @change=${this._entityChanged}
            .checked=${this.config.lock_white_fg === true}
            name="lock_white_fg"
            id="lock_white_fg"
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
            .value=${this.config.popup_cards || this.config.other_cards || this.config.popup || ''}
            name="popup_cards"
            placeholder='# 示例配置：添加button卡片
- type: custom:button-card
  template: 测试模板(最好引用模板，否则大概率会报错)
- type: custom:button-card
  template: 测试模板(最好引用模板，否则大概率会报错)'>
          </textarea>
        </div>
        <div class="form-group">
          <label>长按弹出内容（hold_popup_cards）</label>
          <textarea @change=${this._entityChanged} .value=${this.config.hold_popup_cards || ''} name="hold_popup_cards" placeholder='长按时弹出的YAML卡片配置'></textarea>
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
      </div>
    `;
  }

  _entityChanged(e) {
    const { name, value, type, checked } = e.target;
    let finalValue;
    if (type === 'checkbox') {
      finalValue = checked;
    } else {
      if (!value && name !== 'theme' && name !== 'button_width' && name !== 'button_height' && name !== 'button_font_size' && name !== 'button_icon_size' && name !== 'popup_width' && name !== 'popup_top') return;
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
    }
    this.config = { ...this.config, [name]: finalValue };
    this.dispatchEvent(new CustomEvent('config-changed', {
      detail: { config: this.config },
      bubbles: true,
      composed: true
    }));
  }
}
customElements.define('xiaoshi-todo-button-editor', XiaoshiTodoButtonEditor);

// ==================== 消逝待办按钮 ====================
class XiaoshiTodoButton extends TodoBaseMixin(LitElement) {
  static get properties() {
    return {
      ...super.properties,
      _dataLoaded: Boolean
    };
  }

  static get styles() {
    return [
      cardCommonStyles,
      css`        .todo-status { width: var(--button-width, 65px); max-width: var(--button-max-width, 90px); height: var(--button-height, 24px); padding: 0; margin: 0; background: var(--bg-color, #fff); color: var(--fg-color, #000); border-radius: 10px; font-size: var(--button-font-size, 11px); font-weight: 500; text-align: center; box-sizing: border-box; display: flex; align-items: center; justify-content: center; gap: 0; cursor: none; transition: background-color 0.2s, transform 0.1s; position: relative; }
        .todo-status:active { transform: scale(0.95); box-shadow: 0 2px 12px rgba(255, 255, 255, 0.4), 0 2px 8px rgba(0, 0, 0, 0.4); }
        .status-emoji { font-size: var(--button-icon-size, 13px); line-height: 1; color: var(--fg-color, #000); margin-right: 3px; }
      `
    ];
  }
  static getConfigElement() { 
    return document.createElement("xiaoshi-todo-button-editor"); 
  }

  _getRefreshInterval() { 
    return 3000; 
  }


  async _loadTodoData() {
    if (!this.hass) return;
    try {
      const entities = this.config.entities || [];
      const todoData = [];
      for (const entityId of entities) {
        const entity = this.hass.states[entityId];
        if (!entity) continue;
        let todoItems = [];
        try {
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

  _handleButtonClick() {
    const excludedParams = ['type', 'button_height', 'button_width', 'button_font_size', 'button_icon_size', 'popup_top', 'popup_width', 'other_cards', 'popup_cards', 'popup', 'hold_popup_cards'];
    const cards = [];
    const todoCardConfig = {};
    Object.keys(this.config).forEach(key => {
      if (!excludedParams.includes(key)) {
        todoCardConfig[key] = this.config[key];
      }
    });
    cards.push({
      type: 'custom:xiaoshi-todo-card',
      ...todoCardConfig
    });
    const additionalCardsYaml = this.config.popup_cards || this.config.other_cards || this.config.popup;
    if (additionalCardsYaml && additionalCardsYaml.trim()) {
      try {
        const additionalCardsConfig = yamlToJson(additionalCardsYaml);
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
      return html`<div class="loading">等待Home Assistant连接...</div>`;
    }
    const theme = this._evaluateTheme();
    const fgColor = theme === 'light' ? 'rgb(0, 0, 0)' : 'rgb(255, 255, 255)';
    const bgColor = theme === 'light' ? 'rgb(255, 255, 255)' : 'rgb(50, 50, 50)';
    const totalIncompleteCount = this._todoData.reduce((sum, todo) => sum + todo.incomplete_count, 0);

    const todayDate = new Date();
    todayDate.setHours(0, 0, 0, 0);
    const hasOverdueItems = this._todoData.some(todo => 
      todo.items.some(item => {
        if (item.status !== 'needs_action' || !item.due) return false;
        const dueDate = new Date(item.due);
        dueDate.setHours(0, 0, 0, 0);
        return dueDate <= todayDate;
      })
    );

    const transparentBg = this.config.transparent_bg === true;
    const lockWhiteFg = this.config.lock_white_fg === true;
    const buttonText = this.config.button_text || '待办';
    const buttonIcon = this.config.button_icon || '📝';
    const buttonBgColor = transparentBg ? 'transparent' : theme === 'light' ? 'rgb(255, 255, 255, 0.6)' : 'rgb(83, 83, 83, 0.6)';

    let buttonHtml;
    let textColor, iconColor;
    if (hasOverdueItems) {
      textColor = 'rgb(255, 0, 0)';
      iconColor = lockWhiteFg ? 'rgb(255, 255, 255)' : fgColor;
    } else {
      textColor = lockWhiteFg ? 'rgb(255, 255, 255)' : fgColor;
      iconColor = lockWhiteFg ? 'rgb(255, 255, 255)' : fgColor;
    }
    let displayText = buttonText + ':' + ` ${totalIncompleteCount}`;
    buttonHtml = html`
      <div class="todo-status" style="--fg-color: ${textColor}; --bg-color: ${buttonBgColor};" @click=${this._handleButtonClick} @pointerdown=${this._onHoldStart} @pointerup=${this._onHoldEnd}>
        <span class="status-emoji" style="color: ${iconColor};">${buttonIcon}</span>
        ${displayText}
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
    const baseSize = 3;
    const entitySize = Math.max(0, Math.min(this._todoData.length * 2, 10));
    return baseSize + entitySize;
  }
}
customElements.define('xiaoshi-todo-button', XiaoshiTodoButton);