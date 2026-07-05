const whenDefined = (t) => customElements.whenDefined(t);
await Promise.race([whenDefined("ha-card"), whenDefined("ha-panel-lovelace")]);
const LitElement = window.LitElement || Object.getPrototypeOf(customElements.get("ha-card"));
const html = LitElement.prototype.html;
const css = LitElement.prototype.css;
import { yamlToJson } from '../function/function.js';

// ==================== 注册自定义卡片 ====================
window.customCards = window.customCards || [];
window.customCards.push({
  type: 'xiaoshi-device-button',
  name: '消逝灯光按钮设备按钮',
  description: '消逝灯光按钮设备按钮',
  preview: true
});

// ==================== 预置开/关状态 ====================
const PRESET_ON_STATES = [
    'on', 'open', 'opening','home',  'active', 'running',
    'detected', 'occupied', 'unlocked', 'power_on', '开机','resume',
    'Playing','playing', '播放中',
    'heat', 'cool', 'heating', 'cooling', 'dry', 'fan',
    'auto', 'heat_cool', 'fan_only',
    '有人', 'one',
    '正在拖地','正在扫地','启动','cleaning',
    '烹饪中', '保温中', '预约中', 'Busy', 'Keep Warm',"低档","中档","高档"
];

const PRESET_OFF_STATES = [
  'off', 'closed', 'closing', 'not_home', 'unavailable', 'unknown', 'idle', 'standby',
  'unlocked',
  '无人',
  'Paused', 'paused', '停止',
  'docked', 'charging', 'error', 'returning',
  'Idle', 'Shut Off'
];

// ==================== 编辑器 ====================

class XiaoshiDeviceButtonEditor extends LitElement {
  static get properties() {
    return {
      hass: { type: Object },
      config: { type: Object }
    };
  }

  static get styles() {
    return css`      .form { display: flex; flex-direction: column; gap: 10px; min-height: 500px; }
      .form-group { display: flex; flex-direction: column; gap: 5px; }
      label { font-weight: bold; }
      select, input, textarea { padding: 8px; border: 1px solid #ddd; border-radius: 4px; }
      textarea { min-height: 80px; resize: vertical; font-family: monospace; }
      .help-text { font-size: 0.85em; color: #666; margin-top: 4px; }
      .form-row { display: flex; align-items: center; gap: 8px; }
      .form-row label { font-weight: bold; white-space: nowrap; min-width: 80px; }
      .form-row input, .form-row select { flex: 1; padding: 6px 8px; border: 1px solid #ddd; border-radius: 4px; }
      .form-row input[type="color"] { width: 34px; height: 30px; padding: 1px; border: 1px solid #ddd; border-radius: 4px; flex: none; box-sizing: border-box; }
      .dual-row { display: flex; gap: 8px; }
      .dual-row .form-row { flex: 1; }
      .section-title { font-weight: bold; font-size: 13px; color: #00bcd4; border-bottom: 1px solid #ddd; padding-bottom: 4px; margin-top: 4px; }
      .checkbox-group { display: flex; align-items: center; gap: 6px; }
      .checkbox-input { margin: 0; }
      .checkbox-label { font-weight: normal !important; cursor: pointer; }`;
  }

  setConfig(config) {
    this.config = config;
  }

  _fireConfigChanged() {
    this.dispatchEvent(new CustomEvent('config-changed', {
      detail: { config: this.config },
      bubbles: true,
      composed: true
    }));
  }

  _valueChanged(e) {
    const { name, value, type, checked } = e.target;
    if (!name) return;
    let finalValue;
    if (type === 'checkbox') {
      finalValue = checked;
    } else {
      if (!value && name !== 'theme' && name !== 'button_width' && name !== 'button_height' && name !== 'button_font_size' && name !== 'button_icon_size' && name !== 'popup_width' && name !== 'popup_top' && name !== 'popup_background' && name !== 'tap_action' && name !== 'hold_action') return;
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

  render() {
    if (!this.hass || !this.config) return html``;
    const c = this.config;

    return html`
      <div class="form">
        <div class="section-title">主题</div>

        <div class="form-row">
          <label>主题</label>
          <select name="theme" @change="${this._valueChanged}" style="flex:1;padding:6px 0px;border:1px solid #ddd;border-radius:4px;">
            <option value="system" .selected="${c.theme === 'system' || !c.theme}">跟随系统</option>
            <option value="function" .selected="${c.theme === 'function'}">跟随函数</option>
            <option value="light" .selected="${c.theme === 'light'}">亮色</option>
            <option value="dark" .selected="${c.theme === 'dark'}">暗色</option>
          </select>
        </div>

        <div class="section-title">按钮外观</div>

        <div class="dual-row">
          <div class="form-row">
            <label>按钮图标</label>
            <input type="text" name="button_icon" .value="${c.button_icon || ''}" @change="${this._valueChanged}" placeholder="💡" />
          </div>
          <div class="form-row">
            <label>按钮文字</label>
            <input type="text" name="button_text" .value="${c.button_text || '灯光'}" @change="${this._valueChanged}" placeholder="留空则只显示数量" />
          </div>
        </div>

        <div class="dual-row">
          <div class="form-row">
            <label>按钮宽度</label>
            <input type="text" name="button_width" .value="${c.button_width || '16.8vw'}" @change="${this._valueChanged}" placeholder="默认16.8vw" />
          </div>
          <div class="form-row">
            <label>按钮高度</label>
            <input type="text" name="button_height" .value="${c.button_height || '24px'}" @change="${this._valueChanged}" placeholder="默认24px" />
          </div>
        </div>

        <div class="dual-row">
          <div class="form-row">
            <label>文字大小</label>
            <input type="text" name="button_font_size" .value="${c.button_font_size || '11px'}" @change="${this._valueChanged}" placeholder="默认11px" />
          </div>
          <div class="form-row">
            <label>图标大小</label>
            <input type="text" name="button_icon_size" .value="${c.button_icon_size || '13px'}" @change="${this._valueChanged}" placeholder="默认13px" />
          </div>
        </div>

        <div class="form-row">
          <label>开启颜色</label>
          <input type="color" name="on_color" .value="${c.on_color || '#f57c00'}" @change="${this._valueChanged}" title="设备开启时的颜色" />
        </div>

        <div class="checkbox-group">
          <input type="checkbox" class="checkbox-input"
            @change=${this._valueChanged}
            .checked=${c.transparent_bg === true}
            name="transparent_bg" id="transparent_bg"
          />
          <label for="transparent_bg" class="checkbox-label">
            （平板端特性）透明背景（勾选后按钮背景透明）
          </label>
        </div>

        <div class="checkbox-group">
          <input type="checkbox" class="checkbox-input"
            @change=${this._valueChanged}
            .checked=${c.lock_white_fg === true}
            name="lock_white_fg" id="lock_white_fg"
          />
          <label for="lock_white_fg" class="checkbox-label">
            （平板端特性）白色图标文字（勾选后锁定显示白色）
          </label>
        </div>

        <div class="section-title">设备实体配置</div>

        <div class="form-row">
          <label>弹出设备自动隐藏</label>
          <select name="popup_auto_hide" @change="${this._valueChanged}" style="flex:1;padding:6px 0px;border:1px solid #ddd;border-radius:4px;">
            <option value="false" .selected="${c.popup_auto_hide !== 'true'}">否</option>
            <option value="true" .selected="${c.popup_auto_hide === 'true'}">是</option>
          </select>
        </div>

        <div class="form-row">
          <label>条件</label>
          <select name="condition_mode" @change="${this._valueChanged}" style="flex:1;padding:6px 0px;border:1px solid #ddd;border-radius:4px;">
            <option value="" .selected="${!c.condition_mode}">预置条件</option>
            <option value="append" .selected="${c.condition_mode === 'append'}">新增条件</option>
            <option value="override" .selected="${c.condition_mode === 'override'}">覆盖条件</option>
          </select>
        </div>

        ${c.condition_mode ? html`
        <div class="form-row">
          <label>状态条件</label>
          <input type="text" name="status_conditions" .value="${c.status_conditions || ''}" @change="${this._valueChanged}" placeholder="on,open,home" style="flex:1;" />
        </div>
        ` : ''}

        <div class="form-group">
          <label>实体列表（每行一个，支持 - 前缀）</label>
          <textarea name="entities" .value="${this._entitiesToDisplay(c.entities)}" @change="${this._entitiesChanged}" placeholder="- light.xxx&#10;- switch.xxx&#10;- binary_sensor.xxx"></textarea>
        </div>


        <div class="section-title">弹窗配置</div>

        <div class="form-row">
          <label>弹窗背景css属性</label>
          <select
            @change=${this._valueChanged}
            .value=${this.config.popup_background !== undefined ? this.config.popup_background : ''}
            name="popup_background"
          >
            <option value="">默认</option>
            <option value="transparent">透明</option>
            <option value="theme">跟随主题</option>
          </select>
          <input
            type="color"
            @change=${this._valueChanged}
            .value=${this.config.popup_background && this.config.popup_background !== 'transparent' && this.config.popup_background !== 'theme' ? this.config.popup_background : '#ffffff'}
            name="popup_background"
          />
        </div>

        <div class="checkbox-group">
          <input type="checkbox" class="checkbox-input"
            @change=${this._valueChanged}
            .checked=${c.tap_action_enable === true}
            name="tap_action_enable" id="tap_action_enable"
          />
          <label for="tap_action_enable" class="checkbox-label">启用tap_action禁用popup_cards</label>
        </div>
        ${c.tap_action_enable === true ? html`
        <div class="form-group">
          <label>tap_action（执行调用服务）</label>
          <textarea @change=${this._valueChanged} .value=${c.tap_action || ''} name="tap_action"
            placeholder='action: light.turn_on
target:
  area_id: living_room
  entity_id:
    - light.hallway'></textarea>
        </div>
        ` : html`
        <div class="form-row">
          <label>弹窗宽度</label>
          <input type="text" name="popup_width" .value="${c.popup_width || ''}" @change="${this._valueChanged}" placeholder="默认95%" style="max-width:100px" />
          <label style="min-width:auto">弹窗位置</label>
          <input type="text" name="popup_top" .value="${c.popup_top || ''}" @change="${this._valueChanged}" placeholder="默认20px" style="max-width:100px" />
        </div>
        <div class="form-group">
          <label>弹窗卡片（YAML格式）</label>
          <textarea name="popup_cards" .value="${c.popup_cards || c.other_cards || c.popup || ''}" @change="${this._valueChanged}" placeholder="- type: custom:button-card
  template: 测试模板"></textarea>
        </div>
        `}

        <div class="checkbox-group">
          <input type="checkbox" class="checkbox-input"
            @change=${this._valueChanged}
            .checked=${c.hold_action_enable === true}
            name="hold_action_enable" id="hold_action_enable"
          />
          <label for="hold_action_enable" class="checkbox-label">启用hold_action禁用hold_popup_cards</label>
        </div>
        ${c.hold_action_enable === true ? html`
        <div class="form-group">
          <label>hold_action（执行调用服务）</label>
          <textarea @change=${this._valueChanged} .value=${c.hold_action || ''} name="hold_action"
            placeholder='action: light.turn_on
target:
  area_id: living_room
  entity_id:
    - light.hallway'></textarea>
        </div>
        ` : html`
        <div class="form-group">
          <label>长按弹窗宽度</label>
          <input type="text" name="hold_popup_width" .value="${c.hold_popup_width || ''}" @change="${this._valueChanged}" placeholder="留空则使用弹窗宽度配置" />
        </div>
        <div class="form-group">
          <label>长按弹窗位置</label>
          <input type="text" name="hold_popup_top" .value="${c.hold_popup_top || ''}" @change="${this._valueChanged}" placeholder="留空则使用弹窗位置配置" />
        </div>
        <div class="form-group">
          <label>长按弹出内容（hold_popup_cards）</label>
          <textarea name="hold_popup_cards" .value="${c.hold_popup_cards || ''}" @change="${this._valueChanged}" placeholder="长按时弹出的YAML卡片配置"></textarea>
        </div>
        `}


      </div>
    `;
  }

  _entitiesToDisplay(entities) {
    if (!entities) return '';
    const list = Array.isArray(entities)
      ? entities
      : entities.split(/[\n,]/).map(e => e.trim().replace(/^-\s*/, '')).filter(e => e);
    return list.map(e => `- ${e}`).join('\n');
  }

  _entitiesChanged(e) {
    const value = e.target.value;
    const entities = value.split(/[\n,]/).map(e => e.trim().replace(/^-\s*/, '')).filter(e => e);
    this.config = { ...this.config, entities };
    this._fireConfigChanged();
  }
}
customElements.define('xiaoshi-device-button-editor', XiaoshiDeviceButtonEditor);

// ==================== 主组件 ====================

class XiaoshiDeviceButton extends LitElement {
  static get properties() {
    return {
      hass: Object,
      config: Object,
      theme: { type: String }
    };
  }

  static get styles() {
    return css`      :host { display: block; }
      .device-status { width: var(--button-width, 65px); max-width: var(--button-max-width, 90px); height: var(--button-height, 24px); padding: 0; margin: 0; background: var(--bg-color, #fff); color: var(--fg-color, #000); border-radius: 10px; font-size: var(--button-font-size, 11px); font-weight: 500; text-align: center; box-sizing: border-box; display: flex; align-items: center; justify-content: center; gap: 0; cursor: none; transition: background-color 0.2s, transform 0.1s; position: relative; }
      .device-status:active { transform: scale(0.95); box-shadow: 0 2px 12px rgba(255, 255, 255, 0.4), 0 2px 8px rgba(0, 0, 0, 0.4); }
      .status-icon { font-size: var(--button-icon-size, 13px); line-height: 1; color: var(--fg-color, #000); margin-right: 3px; }`;
  }

  constructor() {
    super();
    this.theme = 'system';
    this._holdTimer = null;
    this._holdTriggered = false;
  }

  static getConfigElement() {
    return document.createElement("xiaoshi-device-button-editor");
  }

  // ===== 主题 =====
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

  // ===== 设备开启数量 =====
  _getActiveCount() {
    if (!this.config.entities || !this.hass) return 0;

    const entityIds = Array.isArray(this.config.entities)
      ? this.config.entities
      : this.config.entities.split(/[\n,]/).map(e => e.trim().replace(/^-\s*/, '')).filter(e => e);
    if (entityIds.length === 0) return 0;

    const conditionMode = this.config.condition_mode || '';
    let conditions;
    if (conditionMode === 'override') {
      conditions = (this.config.status_conditions || '')
        .split(',').map(s => s.trim().toLowerCase()).filter(s => s);
    } else if (conditionMode === 'append') {
      const preset = PRESET_ON_STATES.map(s => s.toLowerCase());
      const custom = (this.config.status_conditions || '')
        .split(',').map(s => s.trim().toLowerCase()).filter(s => s);
      conditions = [...new Set([...preset, ...custom])];
    } else {
      conditions = PRESET_ON_STATES.map(s => s.toLowerCase());
    }

    const offStates = conditionMode === 'override' ? [] : PRESET_OFF_STATES.map(s => s.toLowerCase());

    let count = 0;
    for (const entityId of entityIds) {
      const state = this.hass.states[entityId];
      if (state) {
        const stateLower = state.state.toLowerCase();
        if (offStates.some(c => stateLower.includes(c) || c.includes(stateLower))) {
          continue;
        }
        if (conditions.includes(stateLower)) {
          count++;
        }
      }
    }
    return count;
  }

  // ===== 判断单个实体是否活跃 =====
  _isEntityActive(entityId) {
    if (!this.hass || !entityId) return false;
    const state = this.hass.states[entityId];
    if (!state) return false;

    const conditionMode = this.config.condition_mode || '';
    let conditions;
    if (conditionMode === 'override') {
      conditions = (this.config.status_conditions || '')
        .split(',').map(s => s.trim().toLowerCase()).filter(s => s);
    } else if (conditionMode === 'append') {
      const preset = PRESET_ON_STATES.map(s => s.toLowerCase());
      const custom = (this.config.status_conditions || '')
        .split(',').map(s => s.trim().toLowerCase()).filter(s => s);
      conditions = [...new Set([...preset, ...custom])];
    } else {
      conditions = PRESET_ON_STATES.map(s => s.toLowerCase());
    }

    const offStates = conditionMode === 'override' ? [] : PRESET_OFF_STATES.map(s => s.toLowerCase());
    const stateLower = state.state.toLowerCase();
    if (offStates.some(c => stateLower.includes(c) || c.includes(stateLower))) {
      return false;
    }
    return conditions.includes(stateLower);
  }

  // ===== 颜色工具 =====
  _parseColor(color) {
    if (!color) return { r: 0, g: 0, b: 0, a: 1 };
    color = color.trim();
    if (color.startsWith('#')) {
      let hex = color.slice(1);
      if (hex.length === 3) {
        hex = hex[0]+hex[0]+hex[1]+hex[1]+hex[2]+hex[2];
      }
      return { r: parseInt(hex.slice(0, 2), 16), g: parseInt(hex.slice(2, 4), 16), b: parseInt(hex.slice(4, 6), 16), a: 1 };
    }
    const rgbaMatch = color.match(/^rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*([\d.]+)\s*)?\)$/i);
    if (rgbaMatch) {
      return { r: parseInt(rgbaMatch[1]), g: parseInt(rgbaMatch[2]), b: parseInt(rgbaMatch[3]), a: rgbaMatch[4] !== undefined ? parseFloat(rgbaMatch[4]) : 1 };
    }
    const rgbMatch = color.match(/^rgb\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)$/i);
    if (rgbMatch) {
      return { r: parseInt(rgbMatch[1]), g: parseInt(rgbMatch[2]), b: parseInt(rgbMatch[3]), a: 1 };
    }
    return { r: 0, g: 0, b: 0, a: 1 };
  }

  _colorWithAlpha(color, alpha) {
    const { r, g, b } = this._parseColor(color);
    return `rgba(${r},${g},${b},${alpha})`;
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

  // ===== 事件 =====
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
    const hapticEvent = new Event('haptic', { bubbles: true, cancelable: false, composed: true });
    hapticEvent.detail = 'light';
    this.dispatchEvent(hapticEvent);
  }

  // ===== 点击按钮弹窗 =====
  _handleButtonClick() {
    if (this._holdTriggered) return;
    if (this.config.tap_action_enable === true) {
      this._executeAction(this.config.tap_action);
      this._handleClick();
      return;
    }
    const cards = [];
    const popupConfig = this.config.popup_cards || this.config.other_cards || this.config.popup;
    if (popupConfig && popupConfig.trim()) {
      try {
        const parsed = yamlToJson(popupConfig);
        let filtered = parsed;
        if (this.config.popup_auto_hide === 'true') {
          filtered = parsed.filter(card => {
            const entity = card.entity;
            if (!entity) return true;
            return this._isEntityActive(entity);
          });
        }
        const theme = this._evaluateTheme();
        const cardsWithTheme = filtered.map(card => {
          if (!card.theme && this.config.theme) {
            return { ...card, theme: this.config.theme === 'system' ? theme : this.config.theme };
          }
          return card;
        });
        cards.push(...cardsWithTheme);
      } catch (err) {
        console.error('解析弹窗卡片失败:', err);
      }
    }

    this._handleClick();

    if (this.config.popup_auto_hide === 'true' && cards.length === 0) return;

    if (cards.length === 0) {
      const entityIds = Array.isArray(this.config.entities)
        ? this.config.entities
        : (this.config.entities || '').split(/[\n,]/).map(e => e.trim().replace(/^-\s*/, '')).filter(Boolean);
      if (entityIds.length === 0) return;
      const entityCards = entityIds.map(entityId => ({
        type: 'entity',
        entity: entityId,
        state_color: true
      }));
      const serviceData = { card: entityCards };
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
      return;
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
  }
  // ===== 渲染 =====
  render() {
    if (!this.hass) {
      return html`<div></div>`;
    }
    const theme = this._evaluateTheme();
    const fgColor = theme === 'light' ? 'rgb(0, 0, 0)' : 'rgb(255, 255, 255)';
    const transparentBg = this.config.transparent_bg === true;
    const lockWhiteFg = this.config.lock_white_fg === true;
    const buttonIcon = this.config.button_icon || '💡';
    const buttonText = this.config.button_text || '灯光';
    const onColor = this.config.on_color || '#f57c00';

    const activeCount = this._getActiveCount();
    const hasActive = activeCount > 0;

    const buttonBgColor = transparentBg ? 'transparent' : theme === 'light' ? 'rgb(255, 255, 255, 0.6)' : 'rgb(83, 83, 83, 0.6)';

    // 开启时图标和文字用开启颜色，否则用默认前景色
    let numberColor, iconColor;
    if (hasActive) {
      numberColor = onColor;
      iconColor = onColor;
    } else {
      numberColor = lockWhiteFg ? 'rgb(255, 255, 255)' : fgColor;
      iconColor = lockWhiteFg ? 'rgb(255, 255, 255)' : fgColor;
    }

    // 显示文字：按钮文字:数量
    const displayText = buttonText ? `${buttonText}: ${activeCount}` : `${activeCount}`;

    return html`
      <div class="device-status" style="--fg-color: ${numberColor}; --bg-color: ${buttonBgColor};" @click=${this._handleButtonClick} @pointerdown=${this._onHoldStart} @pointerup=${this._onHoldEnd}>
        ${buttonIcon.startsWith('mdi:') 
          ? html`<ha-icon icon="${buttonIcon}" class="status-icon" style="color: ${iconColor};"></ha-icon>`
          : html`<span class="status-icon" style="color: ${iconColor};">${buttonIcon}</span>`
        }
        <span style="color: ${numberColor};">${displayText}</span>
      </div>
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
customElements.define('xiaoshi-device-button', XiaoshiDeviceButton);
