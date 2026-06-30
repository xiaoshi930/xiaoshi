const whenDefined = (t) => customElements.whenDefined(t);
await Promise.race([whenDefined("ha-card"), whenDefined("ha-panel-lovelace")]);
const LitElement = window.LitElement || Object.getPrototypeOf(customElements.get("ha-card"));
const html = LitElement.prototype.html;
const css = LitElement.prototype.css;
import { yamlToJson } from '../function/function.js';

window.customCards = window.customCards || [];
window.customCards.push({
    type: 'xiaoshi-dynamic-card',
    name: '消逝手机端动态区域卡片',
    description: '消逝手机端动态区域卡片',
    preview: true
});

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

class XiaoshiDynamicCardEditor extends LitElement {
    static get properties() {
        return {
            hass: { type: Object },
            config: { type: Object }
        };
    }

    static get styles() {
        return css`
            .form { display: flex; flex-direction: column; gap: 10px; }
            .form-row { display: flex; align-items: center; gap: 8px; }
            .form-row label { font-weight: bold; white-space: nowrap; min-width: 80px; }
            .form-row input, .form-row select { flex: 1; padding: 6px 8px; border: 1px solid #ddd; border-radius: 4px; }
            .form-row input[type="color"] { width: 34px; height: 30px; padding: 1px; border: 1px solid #ddd; border-radius: 4px; flex: none; box-sizing: border-box; }
            .section-title { font-weight: bold; font-size: 13px; color: #00bcd4; border-bottom: 1px solid #ddd; padding-bottom: 4px; margin-top: 4px; }
            .area-section { border: 1px solid #444; border-radius: 6px; padding: 8px; position: relative; }
            .area-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px; }
            .area-header span { font-weight: bold; font-size: 13px; color: #f57c00; }
            .btn-add, .btn-remove { border: none; border-radius: 4px; padding: 4px 10px; cursor: pointer; font-size: 12px; }
            .btn-add { background: #4caf50; color: #fff; }
            .btn-add:hover { background: #388e3c; }
            .btn-remove { background: #f44336; color: #fff; }
            .btn-remove:hover { background: #c62828; }
            textarea { min-height: 60px; resize: vertical; padding: 6px 8px; border: 1px solid #ddd; border-radius: 4px; font-family: monospace; width: 100%; box-sizing: border-box; }
        `;
    }

    setConfig(config) {
        this.config = config;
    }

    _valueChanged(e) {
        const { name, value } = e.target;
        if (!name) return;
        this.config = { ...this.config, [name]: value };
        this._fireConfigChanged();
    }

    _areaValueChanged(index, e) {
        const { name, value } = e.target;
        if (!name) return;
        const areas = [...(this.config.areas || [])];
        areas[index] = { ...(areas[index] || {}), [name]: value };
        this.config = { ...this.config, areas };
        this._fireConfigChanged();
    }

    _addArea() {
        const areas = [...(this.config.areas || [])];
        areas.push({
        });
        this.config = { ...this.config, areas };
        this._fireConfigChanged();
    }

    _removeArea(index) {
        const areas = [...(this.config.areas || [])];
        areas.splice(index, 1);
        this.config = { ...this.config, areas };
        this._fireConfigChanged();
    }

    _entitiesToDisplay(entities) {
        if (!entities) return '';
        // 兼容字符串和数组格式
        const list = Array.isArray(entities)
            ? entities
            : entities.split(/[\n,]/).map(e => e.trim().replace(/^-\s*/, '')).filter(e => e);
        return list.map(e => `- ${e}`).join('\n');
    }

    _areaEntitiesChanged(index, e) {
        const value = e.target.value;
        // 存储为数组，YAML 序列化时输出列表格式
        const entities = value.split(/[\n,]/).map(e => e.trim().replace(/^-\s*/, '')).filter(e => e);
        const areas = [...(this.config.areas || [])];
        areas[index] = { ...(areas[index] || {}), entities };
        this.config = { ...this.config, areas };
        this._fireConfigChanged();
    }

    _fireConfigChanged() {
        this.dispatchEvent(new CustomEvent('config-changed', {
            detail: { config: this.config },
            bubbles: true,
            composed: true
        }));
    }

    _renderAreaSection(area, index) {
        return html`
            <div class="area-section">
                <div class="area-header">
                    <span>区域 ${index + 1}</span>
                    <button class="btn-remove" @click="${() => this._removeArea(index)}">删除</button>
                </div>
                <div class="form-row">
                    <label>图标</label>
                    <input type="text" name="icon" .value="${area.icon || 'mdi:lightbulb'}" @change="${(e) => this._areaValueChanged(index, e)}" placeholder="mdi:lightbulb" />
                    <label style="min-width:auto">开启</label>
                    <input type="color" name="on_color" .value="${area.on_color || '#f57c00'}" @change="${(e) => this._areaValueChanged(index, e)}" title="开启颜色" />
                    <label style="min-width:auto">关闭</label>
                    <input type="color" name="off_color" .value="${area.off_color || '#666666'}" @change="${(e) => this._areaValueChanged(index, e)}" title="关闭颜色" />
                </div>
                <div class="form-row">
                    <label>按钮是否自动隐藏</label>
                    <select name="auto_hide" @change="${(e) => this._areaValueChanged(index, e)}" style="flex:1;padding:6px 0px;border:1px solid #ddd;border-radius:4px;">
                        <option value="false" .selected="${area.auto_hide !== 'true'}">否</option>
                        <option value="true" .selected="${area.auto_hide === 'true'}">是</option>
                    </select>
                </div>
                <div class="form-row">
                    <label>弹出设备是否自动隐藏</label>
                    <select name="popup_auto_hide" @change="${(e) => this._areaValueChanged(index, e)}" style="flex:1;padding:6px 0px;border:1px solid #ddd;border-radius:4px;">
                        <option value="false" .selected="${area.popup_auto_hide !== 'true'}">否</option>
                        <option value="true" .selected="${area.popup_auto_hide === 'true'}">是</option>
                    </select>
                </div>
                <div class="form-row">
                    <label>条件</label>
                    <select name="condition_mode" @change="${(e) => this._areaValueChanged(index, e)}" style="flex:1;padding:6px 0px;border:1px solid #ddd;border-radius:4px;">
                        <option value="" .selected="${!area.condition_mode}">预置条件</option>
                        <option value="append" .selected="${area.condition_mode === 'append'}">新增条件</option>
                        <option value="override" .selected="${area.condition_mode === 'override'}">覆盖条件</option>
                    </select>
                </div>
                ${area.condition_mode ? html`
                <div class="form-row">
                    <label>状态条件</label>
                    <input type="text" name="status_conditions" .value="${area.status_conditions || ''}" @change="${(e) => this._areaValueChanged(index, e)}" placeholder="on,open,home" style="flex:1;" />
                </div>
                ` : ''}
                <div class="form-row" style="flex-direction:column;align-items:stretch;">
                    <label style="margin-bottom:4px;">实体列表</label>
                    <textarea name="entities" .value="${this._entitiesToDisplay(area.entities)}" @change="${(e) => this._areaEntitiesChanged(index, e)}" placeholder="- light.xxx&#10;- switch.xxx&#10;- binary_sensor.xxx"></textarea>
                </div>
                <div class="form-row" style="flex-direction:column;align-items:stretch;">
                    <label style="margin-bottom:4px;">弹窗卡片（YAML格式）</label>
                    <textarea name="popup_cards" .value="${area.popup_cards || ''}" @change="${(e) => this._areaValueChanged(index, e)}" placeholder="- type: custom:button-card
  template: 测试模板"></textarea>
                </div>
            </div>
        `;
    }

    render() {
        if (!this.hass || !this.config) return html``;
        const c = this.config;
        const areas = c.areas || [];

        return html`
            <div class="form">
                <div class="form-row">
                    <label>主题</label>
                    <select name="theme" @change="${this._valueChanged}" style="flex:1;padding:6px 0px;border:1px solid #ddd;border-radius:4px;">
                        <option value="system" .selected="${c.theme === 'system' || !c.theme}">跟随系统</option>
                        <option value="function" .selected="${c.theme === 'function'}">跟随函数</option>
                        <option value="light" .selected="${c.theme === 'light'}">亮色</option>
                        <option value="dark" .selected="${c.theme === 'dark'}">暗色</option>
                    </select>
                </div>

                <div class="form-row">
                    <label>弹窗宽度</label>
                    <input type="text" name="popup_width" .value="${c.popup_width || ''}" @change="${this._valueChanged}" placeholder="95%" style="max-width:100px" />
                    <label style="min-width:auto">弹窗位置</label>
                    <input type="text" name="popup_top" .value="${c.popup_top || ''}" @change="${this._valueChanged}" placeholder="20px" style="max-width:100px" />
                </div>

                <div class="form-row">
                    <label>卡片宽度</label>
                    <input type="text" name="card_width" .value="${c.card_width || ''}" @change="${this._valueChanged}" placeholder="100%" style="max-width:100px" />
                    <label style="min-width:auto">卡片高度</label>
                    <input type="text" name="card_height" .value="${c.card_height || ''}" @change="${this._valueChanged}" placeholder="auto" style="max-width:100px" />
                </div>

                <div class="form-row">
                    <label>自动排序</label>
                    <select name="auto_sort" @change="${this._valueChanged}" style="flex:1;padding:6px 0px;border:1px solid #ddd;border-radius:4px;">
                        <option value="true" .selected="${c.auto_sort !== 'false'}">是</option>
                        <option value="false" .selected="${c.auto_sort === 'false'}">否</option>
                    </select>
                </div>

                <div class="form-row">
                    <label>开启动画</label>
                    <select name="active_animation" @change="${this._valueChanged}" style="flex:1;padding:6px 0px;border:1px solid #ddd;border-radius:4px;">
                        <option value="true" .selected="${c.active_animation !== 'false'}">是</option>
                        <option value="false" .selected="${c.active_animation === 'false'}">否</option>
                    </select>
                </div>

                ${c.active_animation !== 'false' ? html`
                <div class="form-row">
                    <label>动画效果</label>
                    <select name="animation_type" @change="${this._valueChanged}" style="flex:1;padding:6px 0px;border:1px solid #ddd;border-radius:4px;">
                        <option value="swing_bottom" .selected="${!c.animation_type || c.animation_type === 'swing_bottom'}">底部摇摆</option>
                        <option value="swing_top" .selected="${c.animation_type === 'swing_top'}">顶部摇摆</option>
                        <option value="shake_x" .selected="${c.animation_type === 'shake_x'}">左右晃动</option>
                        <option value="shake_y" .selected="${c.animation_type === 'shake_y'}">上下晃动</option>
                    </select>
                </div>
                ` : ''}

                ${areas.map((area, i) => this._renderAreaSection(area, i))}
                <button class="btn-add" @click="${this._addArea}" style="width:100%;">+ 添加区域</button>
            </div>
        `;
    }
}
customElements.define('xiaoshi-dynamic-card-editor', XiaoshiDynamicCardEditor);

class XiaoshiDynamicCard extends LitElement {

    static get properties() {
        return {
            hass: { type: Object },
            config: { type: Object }
        };
    }

    constructor() {
        super();
    }

    static get styles() {
        return css`
            :host { display: block; height: 100%; max-width: 400px; }
            .areas-grid { display: flex; gap: min(2.5vw, 12.5px); padding: 0 min(2.5vw, 12.5px) 1vh min(2.5vw, 12.5px); width: 100%; height: 100%; box-sizing: border-box; align-items: flex-end; }
            .area-tile { position: relative; border-radius: 8px; flex-shrink: 0; height: 80%; aspect-ratio: 1 / 1; display: flex; flex-direction: column; align-items: center; justify-content: center; cursor: none; transition: background-color 0.35s ease, transform 0.2s ease, box-shadow 0.2s ease; overflow: visible; }
            .area-tile:active { transform: scale(0.95); box-shadow: 0 2px 12px rgba(255, 255, 255, 0.4), 0 2px 8px rgba(0, 0, 0, 0.4); }
            .area-icon { --mdc-icon-size: 80%; display: flex; align-items: center; justify-content: center; width: 80%; height: 80%; color: rgba(255,255,255,0.9); filter: drop-shadow(0 1px 2px rgba(0,0,0,0.3)); }
            .area-name { font-size: 11px; color: rgba(255,255,255,0.85); margin-top: 4px; text-shadow: 0 1px 2px rgba(0,0,0,0.3); text-align: center; max-width: 90%; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
            .area-badge { position: absolute; top: calc(-20% + 2px); right: calc(-20% + 2px); background: #f57c00; color: #fff; font-size: 10px; font-weight: bold; width: 45%; height: 45%; border-radius: 50%; align-items: center; justify-content: center; box-shadow: 0 1px 3px rgba(0,0,0,0.4); display: none; }
            .area-badge.show { display: flex; }
            @keyframes swingBottom {
                0% { transform: rotate(0deg); }
                15% { transform: rotate(15deg); }
                30% { transform: rotate(-10deg); }
                45% { transform: rotate(6deg); }
                60% { transform: rotate(-3deg); }
                75% { transform: rotate(1deg); }
                100% { transform: rotate(0deg); }
            }
            @keyframes swingTop {
                0% { transform: rotate(0deg); }
                15% { transform: rotate(15deg); }
                30% { transform: rotate(-10deg); }
                45% { transform: rotate(6deg); }
                60% { transform: rotate(-3deg); }
                75% { transform: rotate(1deg); }
                100% { transform: rotate(0deg); }
            }
            @keyframes shakeX {
                0%, 100% { transform: translateX(0); }
                20% { transform: translateX(-6px); }
                40% { transform: translateX(6px); }
                60% { transform: translateX(-4px); }
                80% { transform: translateX(4px); }
            }
            @keyframes shakeY {
                0%, 100% { transform: translateY(0); }
                20% { transform: translateY(-6px); }
                40% { transform: translateY(6px); }
                60% { transform: translateY(-4px); }
                80% { transform: translateY(4px); }
            }
            .area-icon.anim-swing-bottom { animation: swingBottom 2s ease-in-out infinite; transform-origin: bottom center; }
            .area-icon.anim-swing-top { animation: swingTop 2s ease-in-out infinite; transform-origin: top center; }
            .area-icon.anim-shake-x { animation: shakeX 1.5s ease-in-out infinite; }
            .area-icon.anim-shake-y { animation: shakeY 1.5s ease-in-out infinite; }
        `;
    }

    static getConfigElement() {
        return document.createElement('xiaoshi-dynamic-card-editor');
    }

    static getStubConfig() {
        return {
        };
    }

    setConfig(config) {
        if (!config) throw new Error('无效配置');
        this.config = config;
    }

    disconnectedCallback() {
        super.disconnectedCallback();
    }

    getCardSize() {
        return 3;
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

    _parseColor(color) {
        if (!color) return { r: 0, g: 0, b: 0, a: 1 };
        color = color.trim();
        // hex 格式: #rgb, #rrggbb
        if (color.startsWith('#')) {
            let hex = color.slice(1);
            if (hex.length === 3) {
                hex = hex[0]+hex[0]+hex[1]+hex[1]+hex[2]+hex[2];
            }
            const r = parseInt(hex.slice(0, 2), 16);
            const g = parseInt(hex.slice(2, 4), 16);
            const b = parseInt(hex.slice(4, 6), 16);
            return { r, g, b, a: 1 };
        }
        // rgba 格式
        const rgbaMatch = color.match(/^rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*([\d.]+)\s*)?\)$/i);
        if (rgbaMatch) {
            return {
                r: parseInt(rgbaMatch[1]),
                g: parseInt(rgbaMatch[2]),
                b: parseInt(rgbaMatch[3]),
                a: rgbaMatch[4] !== undefined ? parseFloat(rgbaMatch[4]) : 1
            };
        }
        // rgb 格式
        const rgbMatch = color.match(/^rgb\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)$/i);
        if (rgbMatch) {
            return {
                r: parseInt(rgbMatch[1]),
                g: parseInt(rgbMatch[2]),
                b: parseInt(rgbMatch[3]),
                a: 1
            };
        }
        // 无法解析时返回黑色
        return { r: 0, g: 0, b: 0, a: 1 };
    }

    _hexToRgb(hex) {
        const { r, g, b } = this._parseColor(hex);
        return { r, g, b };
    }

    _lightenColor(color, amount) {
        const { r, g, b } = this._parseColor(color);
        const lr = Math.round(r + (255 - r) * amount);
        const lg = Math.round(g + (255 - g) * amount);
        const lb = Math.round(b + (255 - b) * amount);
        return `rgb(${lr},${lg},${lb})`;
    }

    _darkenColor(color, amount) {
        const { r, g, b } = this._parseColor(color);
        const dr = Math.round(r * (1 - amount));
        const dg = Math.round(g * (1 - amount));
        const db = Math.round(b * (1 - amount));
        return `rgb(${dr},${dg},${db})`;
    }

    _colorWithAlpha(color, alpha) {
        const { r, g, b } = this._parseColor(color);
        return `rgba(${r},${g},${b},${alpha})`;
    }

    // ===== 区域状态计算 =====
    _getAreaActiveCount(areaConfig) {
        if (!areaConfig.entities || !this.hass) return 0;

        const entityIds = Array.isArray(areaConfig.entities)
            ? areaConfig.entities
            : areaConfig.entities.split(/[\n,]/).map(e => e.trim().replace(/^-\s*/, '')).filter(e => e);
        if (entityIds.length === 0) return 0;

        const conditionMode = areaConfig.condition_mode || '';
        let conditions;
        if (conditionMode === 'override') {
            // 覆盖：仅使用用户自定义条件
            conditions = (areaConfig.status_conditions || '')
                .split(',').map(s => s.trim().toLowerCase()).filter(s => s);
        } else if (conditionMode === 'append') {
            // 新增：预置条件 + 用户自定义条件
            const preset = PRESET_ON_STATES.map(s => s.toLowerCase());
            const custom = (areaConfig.status_conditions || '')
                .split(',').map(s => s.trim().toLowerCase()).filter(s => s);
            conditions = [...new Set([...preset, ...custom])];
        } else {
            // 默认（空）：仅使用预置条件
            conditions = PRESET_ON_STATES.map(s => s.toLowerCase());
        }

        let count = 0;
        for (const entityId of entityIds) {
            const state = this.hass.states[entityId];
            if (state) {
                const stateLower = state.state.toLowerCase();
                if (conditions.includes(stateLower)) {
                    count++;
                }
            }
        }
        return count;
    }

    // 判断单个实体是否为活跃状态（与角标数量统计规则一致）
    _isEntityActive(areaConfig, entityId) {
        if (!this.hass || !entityId) return false;
        const state = this.hass.states[entityId];
        if (!state) return false;

        const conditionMode = areaConfig.condition_mode || '';
        let conditions;
        if (conditionMode === 'override') {
            conditions = (areaConfig.status_conditions || '')
                .split(',').map(s => s.trim().toLowerCase()).filter(s => s);
        } else if (conditionMode === 'append') {
            const preset = PRESET_ON_STATES.map(s => s.toLowerCase());
            const custom = (areaConfig.status_conditions || '')
                .split(',').map(s => s.trim().toLowerCase()).filter(s => s);
            conditions = [...new Set([...preset, ...custom])];
        } else {
            conditions = PRESET_ON_STATES.map(s => s.toLowerCase());
        }

        const stateLower = state.state.toLowerCase();
        return conditions.includes(stateLower);
    }

    _getAreaBgColor(areaConfig, activeCount) {
        const baseColor = activeCount > 0 ? (areaConfig.on_color || '#f57c00') : (areaConfig.off_color || '#666666');
        return this._colorWithAlpha(baseColor, 0.6);
    }

    render() {
        if (!this.hass || !this.config) return html``;

        const areas = this.config.areas || [];
        if (areas.length === 0) return html``;

        // 计算每个区域的activeCount
        const areasWithCount = areas.map((area, i) => ({ area, i, activeCount: this._getAreaActiveCount(area) }));
        // 自动排序：开启的排前面
        if (this.config.auto_sort !== 'false') {
            areasWithCount.sort((a, b) => b.activeCount - a.activeCount);
        }

        const areasHtml = areasWithCount.map(({ area, i, activeCount }) => {
            // 自动隐藏：开启数量为0时隐藏
            if (area.auto_hide === 'true' && activeCount === 0) return html``;
            const bg = this._getAreaBgColor(area, activeCount);
            const icon = area.icon || 'mdi:lightbulb';
            const showBadge = activeCount > 0;
            const animateClass = (this.config.active_animation !== 'false' && activeCount > 0) ? 'anim-' + (this.config.animation_type || 'swing_bottom').replace(/_/g, '-') : '';

            return html`
                <div class="area-tile"
                    style="background:${bg};"
                    @click="${() => this._onAreaClick(area)}">
                    <ha-icon icon="${icon}" class="area-icon ${animateClass}"></ha-icon>
                    <div class="area-badge ${showBadge ? 'show' : ''}" style="background:${area.on_color || '#f57c00'};">${activeCount}</div>
                </div>
            `;
        });

        return html`
            <div class="areas-grid" style="width:${this.config.card_width || '80vw'};height:${this.config.card_height || '5vh'};">
                ${areasHtml}
            </div>
        `;
    }

    // ===== 点击区域弹窗 =====
    _onAreaClick(areaConfig) {
        const cards = [];

        const popupConfig = areaConfig.popup_cards || areaConfig.other_cards || areaConfig.popup;
        if (popupConfig && popupConfig.trim()) {
            try {
                const parsed = yamlToJson(popupConfig);
                // 弹出设备自动隐藏：过滤掉不活跃实体的卡片
                let filtered = parsed;
                if (areaConfig.popup_auto_hide === 'true') {
                    filtered = parsed.filter(card => {
                        const entity = card.entity;
                        if (!entity) return true;
                        return this._isEntityActive(areaConfig, entity);
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
                console.error('[XiaoshiDynamicCard] 解析区域弹窗卡片失败:', err);
            }
        }

        this._handleClick();

        // 弹出设备自动隐藏且过滤后无卡片，直接返回
        if (areaConfig.popup_auto_hide === 'true' && cards.length === 0) return;

        // 无弹窗配置时，自动为实体生成弹窗
        if (cards.length === 0) {
            const entities = Array.isArray(areaConfig.entities)
                ? areaConfig.entities
                : (areaConfig.entities || '').split(/[\n,]/).map(e => e.trim().replace(/^-\s*/, '')).filter(Boolean);
            if (entities.length === 0) return;
            const entityCards = entities.map(entityId => ({
                type: 'entity',
                entity: entityId,
                state_color: true
            }));
            const serviceData = { card: entityCards };
            const popupWidth = this.config.popup_width || 'min(95%, 475px)';
            const popupTop = this.config.popup_top || '20px';
            if (popupWidth !== 'min(95%, 475px)') serviceData.popup_width = popupWidth;
            if (popupTop !== '20px') serviceData.popup_top = popupTop;
            this.hass.callService('popup_card', 'show', serviceData);
            return;
        }

        const serviceData = { card: cards };
        const popupWidth = this.config.popup_width || 'min(95%, 475px)';
        const popupTop = this.config.popup_top || '20px';
        if (popupWidth !== 'min(95%, 475px)') serviceData.popup_width = popupWidth;
        if (popupTop !== '20px') serviceData.popup_top = popupTop;
        serviceData.background = 'transparent';
        this.hass.callService('popup_card', 'show', serviceData);
    }

    // ===== 弹窗服务调用 =====
    _handleClick() {
        const hapticEvent = new Event('haptic', {
            bubbles: true,
            cancelable: false,
            composed: true
        });
        hapticEvent.detail = 'light';
        this.dispatchEvent(hapticEvent);
    }
}
customElements.define('xiaoshi-dynamic-card', XiaoshiDynamicCard);
