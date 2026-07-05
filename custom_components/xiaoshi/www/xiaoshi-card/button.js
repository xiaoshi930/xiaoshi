const whenDefined = (t) => customElements.whenDefined(t);
await Promise.race([whenDefined("ha-card"), whenDefined("ha-panel-lovelace")]);
const LitElement = window.LitElement || Object.getPrototypeOf(customElements.get("ha-card"));
const html = LitElement.prototype.html;
const css = LitElement.prototype.css;
import { yamlToJson } from '../function/function.js';

window.customCards = window.customCards || [];
window.customCards.push({
  type: 'xiaoshi-button',
  name: '消逝空白按钮',
  description: '消逝空白按钮',
  preview: true
});

class XiaoshiButtonEditor extends LitElement {
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
    return css`      .form { display: flex; flex-direction: column; gap: 10px; min-height: 300px; }
      .form-group { display: flex; flex-direction: column; gap: 5px; }
      .form-row { display: flex; align-items: center; gap: 8px; margin-bottom: 10px; }
      .form-row label { white-space: nowrap; flex-shrink: 0; }
      .form-row input, .form-row select { flex: 1; min-width: 0; }
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
      .checkbox-group { display: flex; flex-wrap: wrap; gap: 15px; margin-top: 5px; }
      .checkbox-group2 { }
      .checkbox-label { display: flex; align-items: center; font-weight: normal; cursor: pointer; font-size: 14px; color: #fff; }
      .checkbox-input { margin-right: 6px; cursor: pointer; }
      .selected-entities { margin-top: 8px; }
      .selected-label { font-size: 12px; font-weight: bold; margin-bottom: 4px; color: #333; }
      .selected-entity { display: inline-flex; align-items: center; gap: 4px; background: #f0f0f0; padding: 4px 8px; border-radius: 16px; margin: 2px 4px 2px 0; font-size: 12px; color: #000; }
      .remove-btn { background: none; border: none; cursor: pointer; padding: 0; display: flex; align-items: center; color: #666; }
      .remove-btn:hover { color: #f44336; }`;
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

  render() {
    if (!this.hass || !this.config) return html``;
    return html`
      <div class="form">
        <!-- 按钮特有配置 -->

        <div class="form-row">
          <label>主题</label>
          <select
            @change=${this._entityChanged}
            .value=${this.config.theme !== undefined ? this.config.theme : 'system'}
            name="theme"
          >
            <option value="system">跟随系统</option>
            <option value="light">浅色主题</option>
            <option value="dark">深色主题</option>
          </select>
        </div>

        <div class="form-row">
          <label>按钮宽度</label>
          <input
            type="text"
            @change=${this._entityChanged}
            .value=${this.config.button_width !== undefined ? this.config.button_width : '16.8vw'}
            name="button_width"
            placeholder="默认16.8vw"
          />
          <label>按钮高度</label>
          <input
            type="text"
            @change=${this._entityChanged}
            .value=${this.config.button_height !== undefined ? this.config.button_height : '24px'}
            name="button_height"
            placeholder="默认24px"
          />
        </div>

        <div class="form-row">
          <label>文字大小</label>
          <input
            type="text"
            @change=${this._entityChanged}
            .value=${this.config.button_font_size !== undefined ? this.config.button_font_size : '11px'}
            name="button_font_size"
            placeholder="默认11px"
          />
          <label>图标大小</label>
          <input
            type="text"
            @change=${this._entityChanged}
            .value=${this.config.button_icon_size !== undefined ? this.config.button_icon_size : '13px'}
            name="button_icon_size"
            placeholder="默认13px"
          />
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

        <div class="form-group">
          <label>按钮显示图标
          <input
            type="text"
            @change=${this._entityChanged}
            .value=${this.config.button_icon !== undefined ? this.config.button_icon : '🔘'}
            name="button_icon"
            placeholder="🔘"
          /></label>
        </div>

        <div class="form-group">
          <label>按钮显示文字：</label>
          <label>支持 [[[ ]]] 模板语法，直接录入实体或return返回实体则显示实体值</label>
          <textarea
            @change=${this._entityChanged}
            .value=${this.config.button_text !== undefined ? this.config.button_text : '空白按钮'}
            name="button_text"
            placeholder="支持 [[[ ]]] 模板语法"
            rows="3"
          ></textarea>
        </div>

        <div class="form-group">
          <label>文本颜色</label>
          <label>支持 [[[ ]]] 模板语法，如果返回值是"system"取当前主题颜色</label>
          <textarea
            type="text"
            @change=${this._entityChanged}
            .value=${this.config.text_color !== undefined ? this.config.text_color : ''}
            name="text_color"
            placeholder="支持 [[[ ]]] 模板语法"
          ></textarea>
        </div>

        <div class="form-group">
          <label> </label>
          <label>👇👇👇下方是弹出的主卡配置项👇👇👇</label>
          <label> </label>
        </div>

        <div class="form-row">
          <label>弹窗背景css属性</label>
          <select
            @change=${this._entityChanged}
            .value=${this.config.popup_background !== undefined ? this.config.popup_background : ''}
            name="popup_background"
          >
            <option value="">默认</option>
            <option value="transparent">透明</option>
            <option value="theme">跟随主题</option>
          </select>
          <input
            type="color"
            @change=${this._entityChanged}
            .value=${this.config.popup_background && this.config.popup_background !== 'transparent' && this.config.popup_background !== 'theme' ? this.config.popup_background : '#ffffff'}
            name="popup_background"
          />
        </div>


        <div class="checkbox-group2">
          <input type="checkbox" class="checkbox-input"
            @change=${this._entityChanged}
            .checked=${this.config.tap_action_enable === true}
            name="tap_action_enable" id="tap_action_enable"
          />
          <label for="tap_action_enable">启用tap_action禁用popup_cards</label>
        </div>
        ${this.config.tap_action_enable === true ? html`
        <div class="form-group">
          <label>tap_action（执行调用服务）</label>
          <textarea @change=${this._entityChanged} .value=${this.config.tap_action || ''} name="tap_action"
            placeholder='action: light.turn_on
target:
  area_id: living_room
  entity_id:
    - light.hallway'></textarea>
        </div>
        ` : html`
        <div class="form-row">
          <label>弹窗宽度</label>
          <input
            type="text"
            @change=${this._entityChanged}
            .value=${this.config.popup_width !== undefined ? this.config.popup_width : '95%'}
            name="popup_width"
            placeholder="默认95%"
          />
          <label>弹窗位置</label>
          <input
            type="text"
            @change=${this._entityChanged}
            .value=${this.config.popup_top !== undefined ? this.config.popup_top : '20px'}
            name="popup_top"
            placeholder="默认20px"
          />
        </div>
        <div class="form-group">
          <label>弹出内容</label>
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
        `}

        <div class="checkbox-group2">
          <input type="checkbox" class="checkbox-input"
            @change=${this._entityChanged}
            .checked=${this.config.hold_action_enable === true}
            name="hold_action_enable" id="hold_action_enable"
          />
          <label for="hold_action_enable">启用hold_action禁用hold_popup_cards</label>
        </div>
        ${this.config.hold_action_enable === true ? html`
        <div class="form-group">
          <label>hold_action（执行调用服务）</label>
          <textarea @change=${this._entityChanged} .value=${this.config.hold_action || ''} name="hold_action"
            placeholder='action: light.turn_on
target:
  area_id: living_room
  entity_id:
    - light.hallway'></textarea>
        </div>
        ` : html`
        <div class="form-group">
          <label>长按弹窗宽度</label>
          <input type="text" name="hold_popup_width" .value="${this.config.hold_popup_width || ''}" @change="${this._valueChanged}" placeholder="留空则使用弹窗宽度配置" />
        </div>
        <div class="form-group">
          <label>长按弹窗位置</label>
          <input type="text" name="hold_popup_top" .value="${this.config.hold_popup_top || ''}" @change="${this._valueChanged}" placeholder="留空则使用弹窗位置配置" />
        </div>
        <div class="form-group">
          <label>长按弹出内容（hold_popup_cards）</label>
          <textarea @change=${this._entityChanged} .value=${this.config.hold_popup_cards || ''} name="hold_popup_cards" placeholder='长按时弹出的YAML卡片配置'></textarea>
        </div>
        `}

        </div>
    `;
  }

  _entityChanged(e) {
    const { name, value, type, checked } = e.target;
    let finalValue;
    if (type === 'checkbox') {
      finalValue = checked;
    } else {
      if (!value && name !== 'theme' && name !== 'button_width' && name !== 'button_height' && name !== 'button_font_size' && name !== 'button_icon_size' && name !== 'popup_width' && name !== 'popup_top' && name !== 'button_text' && name !== 'text_color' && name !== 'popup_background' && name !== 'tap_action' && name !== 'hold_action') return;
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
    this._fireConfigChanged();
  }
}
customElements.define('xiaoshi-button-editor', XiaoshiButtonEditor);

class XiaoshiButton extends LitElement {
  static get properties() {
    return {
      hass: Object,
      config: Object,
      theme: { type: String }
    };
  }

  static get styles() {
    return css`      :host { display: block; }
      .balance-status { width: var(--button-width, 65px); max-width: var(--button-max-width, 90px); height: var(--button-height, 24px); padding: 0; margin: 0; background: var(--bg-color, #fff); color: var(--fg-color, #000); border-radius: 10px; font-size: var(--button-font-size, 11px); font-weight: 500; text-align: center; box-sizing: border-box; display: flex; align-items: center; justify-content: center; gap: 0; cursor: none; transition: background-color 0.2s, transform 0.1s; position: relative; }
      .balance-status:active { transform: scale(0.95); box-shadow: 0 2px 12px rgba(255, 255, 255, 0.4), 0 2px 8px rgba(0, 0, 0, 0.4); }
      .status-icon { --mdc-icon-size: var(--button-icon-size, 13px); color: var(--fg-color, #000); margin-right: 3px; display: inline-flex; align-items: center; }
      ha-card { width: 100%; height: 100%; display: flex; flex-direction: column; background: var(--bg-color, #fff); border-radius: 12px; }
      .card-header { display: flex; justify-content: space-between; align-items: center; padding: 16px; background: var(--bg-color, #fff); border-radius: 12px; }
      .offline-indicator { display: inline-block; width: 8px; height: 8px; border-radius: 50%; margin-right: 8px; }
      @keyframes pulse {
        0% { opacity: 1; }
        50% { opacity: 0.5; }
        100% { opacity: 1; }
      }
      .card-title { font-size: 20px; font-weight: 500; color: var(--fg-color, #000); height: 30px; line-height: 30px; display: flex; align-items: center; justify-content: center; }
      .device-count { color: var(--fg-color, #000); border-radius: 8px; font-size: 13px; width: 30px; height: 30px; text-align: center; line-height: 30px; font-weight: bold; padding: 0px; }
      .device-count.non-zero { background: rgb(255, 0, 0, 0.5); }
      .device-count.zero { background: rgb(0, 205, 0); }
      .refresh-btn { color: var(--fg-color, #fff); border: none; border-radius: 8px; padding: 5px; cursor: pointer; font-size: 13px; width: 50px; height: 30px; line-height: 30px; text-align: center; font-weight: bold; padding: 0px; }
      .section-divider { margin: 0 0 8px 0; padding: 8px 8px; background: var(--bg-color, #fff); font-weight: 500; color: var(--fg-color, #000); border-top: 1px solid rgb(150,150,150,0.5); border-bottom: 1px solid rgb(150,150,150,0.5); margin: 0 16px 0 16px; }
      .section-title { display: flex; align-items: center; justify-content: space-between; color: var(--fg-color, #000); font-size: 13px; }
      .section-count { background: rgb(255,0,0,0.5); color: var(--fg-color, #000); border-radius: 12px; width: 15px; height: 15px; text-align: center; line-height: 15px; padding: 3px; font-size: 12px; font-weight: bold; }
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
      .device-details ha-icon { --mdc-icon-size: 12px; color: var(--fg-color, #000); }`;
  }

  static getConfigElement() {
    return document.createElement("xiaoshi-button-editor");
  }

  constructor() {
    super();
    this.theme = 'system';
    this._holdTimer = null;
    this._holdTriggered = false;
  }

  connectedCallback() {
    super.connectedCallback();
    this.setAttribute('theme', this._evaluateTheme());
  }

  _evalTemplate(text) {
    if (typeof text !== 'string') return text;
    const match = text.match(/^\[\[\[([\s\S]*?)\]\]\]$/);
    if (match) {
      try {
        const fn = new Function('entity', 'states', 'hass', 'user', 'config', match[1]);
        return fn(this.hass?.states, this.hass?.states, this.hass, this.hass?.user, this.config);
      } catch (e) {
        console.error('模板执行错误:', e);
        return text;
      }
    }
    return text;
  }

  _resolveEntityText(text) {
    if (typeof text !== 'string') return text;
    if (this.hass && this.hass.states[text]) {
      const state = this.hass.states[text];
      const friendlyName = state.attributes?.friendly_name || '';
      const unit = state.attributes?.unit_of_measurement || '';
      return `${state.state}${unit ? ' ' + unit : ''}`;
    }
    return text;
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

  // ===== tap_action / hold_action 服务调用 =====
  _executeAction(actionYaml) {
    if (!actionYaml || !actionYaml.trim()) return false;
    try {
      const actionConfig = yamlToJson(actionYaml);
      if (!actionConfig || !actionConfig.action) return false;
      const dotIndex = actionConfig.action.indexOf('.');
      if (dotIndex < 0) return false;
      const domain = actionConfig.action.substring(0, dotIndex);
      const service = actionConfig.action.substring(dotIndex + 1);
      const serviceData = actionConfig.target ? Object.assign({}, actionConfig.target) : {};
      if (actionConfig.data) Object.assign(serviceData, actionConfig.data);
      this.hass.callService(domain, service, serviceData);
      return true;
    } catch (err) {
      console.error('执行action失败:', err);
      return false;
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
    if (this.config.hold_action_enable === true) {
      this._executeAction(this.config.hold_action);
      if (this._handleClick) this._handleClick();
      return;
    }
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
      const popupWidth = this.config.hold_popup_width || this.config.popup_width || '95%';
      const popupTop = this.config.hold_popup_top || this.config.popup_top || '20px';
      if (popupWidth !== '95%') serviceData.popup_width = popupWidth;
      if (popupTop !== '20px') serviceData.popup_top = popupTop;
      if (this.config.popup_background === 'transparent') {
        serviceData.background = 'transparent';
      } else if (this.config.popup_background === 'theme') {
        const currentTheme = this._evaluateTheme ? this._evaluateTheme() : 'light';
        serviceData.background = currentTheme === 'light' ? 'rgb(255, 255, 255)' : 'rgb(50, 50, 50)';
      } else if (this.config.popup_background && this.config.popup_background !== '') {
        serviceData.background = this.config.popup_background;
      }
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

  _handleButtonClick() {
    if (this._holdTriggered) return;
    if (this.config.tap_action_enable === true) {
      this._executeAction(this.config.tap_action);
      this._handleClick();
      return;
    }
    const excludedParams = ['type', 'button_height', 'button_width', 'button_font_size', 'button_icon_size', 'popup_top', 'popup_width', 'button_icon', 'button_text', 'text_color', 'lock_white_fg', 'transparent_bg', 'other_cards', 'popup_cards', 'popup', 'hold_popup_cards', 'popup_background', 'tap_action', 'hold_action', 'tap_action_enable', 'hold_action_enable'];
    const cards = [];
    const balanceCardConfig = {};
    Object.keys(this.config).forEach(key => {
      if (!excludedParams.includes(key)) {
        balanceCardConfig[key] = this.config[key];
      }
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
    if (this.config.popup_background === 'transparent') {
      serviceData.background = 'transparent';
    } else if (this.config.popup_background === 'theme') {
      const currentTheme = this._evaluateTheme ? this._evaluateTheme() : 'light';
      serviceData.background = currentTheme === 'light' ? 'rgb(255, 255, 255)' : 'rgb(50, 50, 50)';
    } else if (this.config.popup_background && this.config.popup_background !== '') {
      serviceData.background = this.config.popup_background;
    }
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
    const buttonIcon = this.config.button_icon || '🔘';
    const buttonTextRaw = this.config.button_text || '空白按钮';
    const buttonTextEval = this._evalTemplate(buttonTextRaw);
    const buttonText = this._resolveEntityText(buttonTextEval);
    const buttonBgColor = transparentBg ? 'transparent' : theme === 'light' ? 'rgb(255, 255, 255, 0.6)' : 'rgb(83, 83, 83, 0.6)';

    const iconColor = lockWhiteFg ? 'rgb(255, 255, 255)' : fgColor;
    const textColorRaw = this.config.text_color || '';
    const textColorEval = textColorRaw ? this._evalTemplate(textColorRaw) : '';
    const textColor = !textColorEval || textColorEval === 'system' ? (lockWhiteFg ? 'rgb(255, 255, 255)' : fgColor) : textColorEval;

    const buttonHtml = html`
      <div class="balance-status" style="--fg-color: ${fgColor}; --bg-color: ${buttonBgColor};" @click=${this._handleButtonClick} @pointerdown=${this._onHoldStart} @pointerup=${this._onHoldEnd}>
      ${(buttonIcon.startsWith('mdi:') ? html`<ha-icon class="status-icon" style="color: ${iconColor};" icon="${buttonIcon}"></ha-icon>` : html`<span class="status-icon" style="color: ${iconColor}; font-size: var(--button-icon-size, 13px); line-height: 1;">${buttonIcon}</span>`)}
        ${buttonText ? html`<span style="color: ${textColor}; white-space: pre-wrap;">${buttonText}</span>` : ''}
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
customElements.define('xiaoshi-button', XiaoshiButton);
