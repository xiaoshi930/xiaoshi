import { LitElement, html, css } from "https://unpkg.com/lit-element@2.4.0/lit-element.js?module";

window.customCards = window.customCards || [];
window.customCards.push({
    type: 'xiaoshi-dynamic-card',
    name: '消逝手机端动态区域卡片',
    description: '消逝手机端动态区域卡片',
    preview: true
});

const PRESET_ON_STATES = [
    // 通用
    'on', 'open', 'opening','home', 'playing', 'active', 'running',
    'detected', 'occupied', 'locked', 'unlocked', 'cleaning',
    'charging', 'idle',
    // 空调/HVAC
    'heat', 'cool', 'heating', 'cooling', 'dry', 'fan',
    'auto', 'heat_cool', 'heat_cool', 'fan_only',
    // 人在
    '有人', '2～5分钟无人移动'
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
            .form {
                display: flex;
                flex-direction: column;
                gap: 10px;
            }
            .form-row {
                display: flex;
                align-items: center;
                gap: 8px;
            }
            .form-row label {
                font-weight: bold;
                white-space: nowrap;
                min-width: 80px;
            }
            .form-row input, .form-row select {
                flex: 1;
                padding: 6px 8px;
                border: 1px solid #ddd;
                border-radius: 4px;
            }
            .form-row input[type="color"] {
                width: 34px;
                height: 30px;
                padding: 1px;
                border: 1px solid #ddd;
                border-radius: 4px;
                flex: none;
                box-sizing: border-box;
            }
            .section-title {
                font-weight: bold;
                font-size: 13px;
                color: #00bcd4;
                border-bottom: 1px solid #ddd;
                padding-bottom: 4px;
                margin-top: 4px;
            }
            .area-section {
                border: 1px solid #444;
                border-radius: 6px;
                padding: 8px;
                position: relative;
            }
            .area-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 6px;
            }
            .area-header span {
                font-weight: bold;
                font-size: 13px;
                color: #f57c00;
            }
            .btn-add, .btn-remove {
                border: none;
                border-radius: 4px;
                padding: 4px 10px;
                cursor: pointer;
                font-size: 12px;
            }
            .btn-add {
                background: #4caf50;
                color: #fff;
            }
            .btn-add:hover {
                background: #388e3c;
            }
            .btn-remove {
                background: #f44336;
                color: #fff;
            }
            .btn-remove:hover {
                background: #c62828;
            }
            textarea {
                min-height: 60px;
                resize: vertical;
                padding: 6px 8px;
                border: 1px solid #ddd;
                border-radius: 4px;
                font-family: monospace;
                width: 100%;
                box-sizing: border-box;
            }
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
                    <label>自动隐藏</label>
                    <select name="auto_hide" @change="${(e) => this._areaValueChanged(index, e)}" style="flex:1;padding:6px 0px;border:1px solid #ddd;border-radius:4px;">
                        <option value="false" .selected="${area.auto_hide !== 'true'}">否</option>
                        <option value="true" .selected="${area.auto_hide === 'true'}">是</option>
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
                    <label style="margin-bottom:4px;">实体列表（回车分隔）</label>
                    <textarea name="entities" .value="${area.entities || ''}" @change="${(e) => this._areaValueChanged(index, e)}" placeholder="light.xxx&#10;switch.xxx&#10;binary_sensor.xxx"></textarea>
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
            :host {
                display: block;
                height: 100%;
            }
            .areas-grid {
                display: flex;
                gap: 2.5vw;
                padding: 0 2.5vw 1vh 2.5vw;
                width: 100%;
                height: 100%;
                box-sizing: border-box;
                align-items: flex-end;
            }
            .area-tile {
                position: relative;
                border-radius: 10px;
                flex-shrink: 0;
                height: 80%;
                aspect-ratio: 1 / 1;
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                cursor: pointer;
                transition: background-color 0.35s ease, transform 0.2s ease, box-shadow 0.2s ease;
                overflow: visible;
            }
            .area-tile:hover {
                transform: scale(1.05);
                box-shadow: 0 4px 12px rgba(0,0,0,0.3);
            }
            .area-tile:active {
                transform: scale(0.95);
            }
            .area-icon {
                --mdc-icon-size: 80%;
                display: flex;
                align-items: center;
                justify-content: center;
                width: 80%;
                height: 80%;
                color: rgba(255,255,255,0.9);
                filter: drop-shadow(0 1px 2px rgba(0,0,0,0.3));
            }
            .area-name {
                font-size: 11px;
                color: rgba(255,255,255,0.85);
                margin-top: 4px;
                text-shadow: 0 1px 2px rgba(0,0,0,0.3);
                text-align: center;
                max-width: 90%;
                overflow: hidden;
                text-overflow: ellipsis;
                white-space: nowrap;
            }
            .area-badge {
                position: absolute;
                top: calc(-20% + 2px);
                right: calc(-20% + 2px);
                background: #f57c00;
                color: #fff;
                font-size: 14px;
                font-weight: bold;
                width: 45%;
                height: 45%;
                border-radius: 50%;
                align-items: center;
                justify-content: center;
                box-shadow: 0 1px 3px rgba(0,0,0,0.4);
                display: none;
            }
            .area-badge.show {
                display: flex;
            }
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
            .area-icon.anim-swing-bottom {
                animation: swingBottom 2s ease-in-out infinite;
                transform-origin: bottom center;
            }
            .area-icon.anim-swing-top {
                animation: swingTop 2s ease-in-out infinite;
                transform-origin: top center;
            }
            .area-icon.anim-shake-x {
                animation: shakeX 1.5s ease-in-out infinite;
            }
            .area-icon.anim-shake-y {
                animation: shakeY 1.5s ease-in-out infinite;
            }
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
        this._closePopup();
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

    _hexToRgb(hex) {
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);
        return { r, g, b };
    }

    _lightenColor(hex, amount) {
        const { r, g, b } = this._hexToRgb(hex);
        const lr = Math.round(r + (255 - r) * amount);
        const lg = Math.round(g + (255 - g) * amount);
        const lb = Math.round(b + (255 - b) * amount);
        return `rgb(${lr},${lg},${lb})`;
    }

    _darkenColor(hex, amount) {
        const { r, g, b } = this._hexToRgb(hex);
        const dr = Math.round(r * (1 - amount));
        const dg = Math.round(g * (1 - amount));
        const db = Math.round(b * (1 - amount));
        return `rgb(${dr},${dg},${db})`;
    }

    _colorWithAlpha(hex, alpha) {
        const { r, g, b } = this._hexToRgb(hex);
        return `rgba(${r},${g},${b},${alpha})`;
    }

    // ===== 区域状态计算 =====
    _getAreaActiveCount(areaConfig) {
        if (!areaConfig.entities || !this.hass) return 0;

        const entityIds = areaConfig.entities.split(/[\n,]/).map(e => e.trim()).filter(e => e);
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
            if (state && conditions.includes(state.state.toLowerCase())) {
                count++;
            }
        }
        return count;
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
            <div class="areas-grid" style="width:${this.config.card_width || '90vw'};height:${this.config.card_height || '5vh'};">
                ${areasHtml}
            </div>
        `;
    }

    // ===== 点击区域弹窗 =====
    _onAreaClick(areaConfig) {
        const cards = [];

        if (areaConfig.popup_cards && areaConfig.popup_cards.trim()) {
            try {
                const parsed = this._parseYamlCards(areaConfig.popup_cards);
                const theme = this._evaluateTheme();
                const cardsWithTheme = parsed.map(card => {
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

        // 无弹窗配置时，自动为实体生成弹窗
        if (cards.length === 0) {
            const entities = (areaConfig.entities || '').split(/[\n,]/).map(e => e.trim()).filter(Boolean);
            if (entities.length === 0) return;
            const entityCards = entities.map(entityId => ({
                type: 'entity',
                entity: entityId,
                state_color: true
            }));
            const popupContent = entityCards.length === 1 ? entityCards[0] : { type: 'vertical-stack', cards: entityCards };
            this._showPopup(popupContent);
            return;
        }

        const popupContent = cards.length === 1 ? cards[0] : { type: 'vertical-stack', cards };
        this._showPopup(popupContent);
    }

    // ===== 弹窗相关方法 =====
    _handleClick() {
        const hapticEvent = new Event('haptic', {
            bubbles: true,
            cancelable: false,
            composed: true
        });
        hapticEvent.detail = 'light';
        this.dispatchEvent(hapticEvent);
    }

    _injectPopupStyles() {
        if (XiaoshiDynamicCard._stylesInjected) return;
        XiaoshiDynamicCard._stylesInjected = true;
        const style = document.createElement('style');
        style.id = 'xiaoshi-dynamic-card-popup-style';
        style.textContent = `
            @keyframes xiaoshiDynamicCardPopupIn {
                from { opacity: 0; transform: translateX(-50%) scale(0.95); }
                to   { opacity: 1; transform: translateX(-50%) scale(1); }
            }
        `;
        document.head.appendChild(style);
    }

    _showPopup(cardConfig) {
        if (!cardConfig) return;
        if (typeof cardConfig === 'string') {
            try {
                const parsed = this._parseYamlCards(cardConfig);
                if (parsed && parsed.length > 0) {
                    cardConfig = parsed.length === 1 ? parsed[0] : { type: 'vertical-stack', cards: parsed };
                } else {
                    console.error('[XiaoshiDynamicCard] 弹窗配置解析为空');
                    return;
                }
            } catch (err) {
                console.error('[XiaoshiDynamicCard] 弹窗配置解析失败:', err);
                return;
            }
        }
        this._handleClick();
        this._injectPopupStyles();

        const haRoot = document.querySelector('home-assistant');
        const hassObj = haRoot?.hass || haRoot?.shadowRoot?.querySelector('home-assistant-main')?.hass;
        if (!hassObj) {
            console.error('[XiaoshiDynamicCard] 无法获取 hass 对象');
            return;
        }

        if (this._popupOverlay) {
            this._closePopup();
        }

        const overlay = document.createElement('div');
        overlay.style.cssText = `
            position: fixed;
            top: 0; left: 0; right: 0; bottom: 0;
            background: rgba(0, 0, 0, 0.5);
            z-index: 1000;
            -webkit-backdrop-filter: blur(10px);
            backdrop-filter: blur(10px);
            pointer-events: auto;
        `;
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) this._closePopup();
        });

        const popupWidth = this.config.popup_width || '95%';
        const popupTop = this.config.popup_top || '20px';
        const popup = document.createElement('div');
        popup.style.cssText = `
            position: fixed;
            top: ${popupTop}; left: 50%;
            transform: translateX(-50%);
            z-index: 1005;
            background: transparent;
            padding: 0;
            width: ${popupWidth};
            max-width: 100vw;
            max-height: 100vh;
            overflow: hidden;
            box-sizing: border-box;
            animation: xiaoshiDynamicCardPopupIn 0.2s ease-out;
        `;

        document.body.appendChild(overlay);
        document.body.appendChild(popup);

        this._popupOverlay = overlay;
        this._popupElement = popup;

        this._createPopupCard(popup, cardConfig, hassObj);

        this._popupEscHandler = (e) => {
            if (e.key === 'Escape') this._closePopup();
        };
        window.addEventListener('keydown', this._popupEscHandler);
    }

    async _createPopupCard(container, cardConfig, hassObj) {
        try {
            const helpers = await window.loadCardHelpers?.();
            if (helpers) {
                const cardElement = await helpers.createCardElement(cardConfig);
                cardElement.hass = hassObj;
                container.appendChild(cardElement);
                this._popupCardElement = cardElement;
                this._startPopupHassWatcher(hassObj);
            } else {
                container.innerHTML = '<div style="color:red;padding:20px;">loadCardHelpers 不可用</div>';
            }
        } catch (err) {
            console.error('[XiaoshiDynamicCard] 创建弹窗卡片失败:', err);
            container.innerHTML = `<div style="color:red;padding:20px;">加载失败: ${err.message}</div>`;
        }
    }

    _closePopup() {
        if (this._popupOverlay) {
            this._popupOverlay.remove();
            this._popupOverlay = null;
        }
        if (this._popupElement) {
            this._popupElement.remove();
            this._popupElement = null;
        }
        this._popupCardElement = null;
        if (this._popupEscHandler) {
            window.removeEventListener('keydown', this._popupEscHandler);
            this._popupEscHandler = null;
        }
        if (this._popupHassUnsubscribe) {
            this._popupHassUnsubscribe();
            this._popupHassUnsubscribe = null;
        }
        this._popupUpdatePending = false;
        this._popupHass = null;
    }

    _startPopupHassWatcher(hassObj) {
        if (this._popupHassUnsubscribe) return;
        this._popupHass = hassObj;
        if (!hassObj || !hassObj.connection) {
            setTimeout(() => this._startPopupHassWatcher(hassObj), 500);
            return;
        }
        try {
            hassObj.connection.subscribeMessage(
                () => {
                    if (!this._popupCardElement) return;
                    this._schedulePopupUpdate();
                },
                { type: 'subscribe_events', event_type: 'state_changed' }
            ).then((unsub) => {
                this._popupHassUnsubscribe = unsub;
            });
        } catch (err) {
            console.error('[XiaoshiDynamicCard] 订阅状态变化失败:', err);
        }
    }

    _schedulePopupUpdate() {
        if (this._popupUpdatePending) return;
        this._popupUpdatePending = true;
        requestAnimationFrame(() => {
            this._popupUpdatePending = false;
            if (!this._popupCardElement) return;
            const haRoot = document.querySelector('home-assistant');
            const newHass = haRoot?.hass || haRoot?.shadowRoot?.querySelector('home-assistant-main')?.hass;
            if (!newHass) return;
            if (newHass === this._popupHass) return;
            this._popupHass = newHass;
            this._updatePopupCard();
        });
    }

    _updatePopupCard() {
        if (this._popupCardElement && this._popupHass) {
            try {
                this._popupCardElement.hass = this._popupHass;
            } catch (err) {
                console.warn('[XiaoshiDynamicCard] 弹窗卡片更新失败:', err.message);
            }
        }
    }

    // ===== YAML 解析方法 =====
    _parseYamlCards(yamlString) {
        try {
            const lines = yamlString.split('\n');
            const cards = [];
            let currentCard = null;
            let indentStack = [];
            let contextStack = [];

            for (let i = 0; i < lines.length; i++) {
                const line = lines[i];
                const trimmed = line.trim();

                if (!trimmed || trimmed.startsWith('#')) continue;

                const indentLevel = line.length - line.trimStart().length;
                if (trimmed.startsWith('- type')) {
                    if (currentCard) {
                        cards.push(currentCard);
                        currentCard = null;
                        indentStack = [];
                        contextStack = [];
                    }
                    const content = trimmed.substring(1).trim();
                    if (content.includes(':')) {
                        const [key, ...valueParts] = content.split(':');
                        const value = valueParts.join(':').trim();
                        currentCard = {};
                        this._setNestedValue(currentCard, key.trim(), this._parseValue(value));
                    } else {
                        currentCard = { type: content };
                    }
                    indentStack = [indentLevel];
                    contextStack = [currentCard];
                } else if (currentCard && trimmed.startsWith('-')) {
                    while (indentStack.length > 1 && indentLevel <= indentStack[indentStack.length - 1]) {
                        indentStack.pop();
                        contextStack.pop();
                    }

                    let currentContext = contextStack[contextStack.length - 1];
                    const itemValue = trimmed.substring(1).trim();

                    if (!Array.isArray(currentContext)) {
                        if (contextStack.length > 1) {
                            const parentContext = contextStack[contextStack.length - 2];
                            for (let key in parentContext) {
                                if (parentContext[key] === currentContext) {
                                    parentContext[key] = [];
                                    contextStack[contextStack.length - 1] = parentContext[key];
                                    currentContext = parentContext[key];
                                    break;
                                }
                            }
                        }
                    }
                    if (Array.isArray(currentContext)) {
                        if (itemValue.includes(':')) {
                            const [key, ...valueParts] = itemValue.split(':');
                            const value = valueParts.join(':').trim();
                            const obj = {};
                            obj[key.trim()] = this._parseValue(value);
                            currentContext.push(obj);
                        } else {
                            currentContext.push(this._parseValue(itemValue));
                        }
                    }
                } else if (currentCard && trimmed.includes(':')) {
                    const [key, ...valueParts] = trimmed.split(':');
                    const value = valueParts.join(':').trim();
                    const keyName = key.trim();

                    while (indentStack.length > 1 && indentLevel <= indentStack[indentStack.length - 1]) {
                        indentStack.pop();
                        contextStack.pop();
                    }

                    const currentContext = contextStack[contextStack.length - 1];

                    if (value) {
                        this._setNestedValue(currentContext, keyName, this._parseValue(value));
                    } else {
                        let nextLine = null, nextIndent = null;
                        for (let j = i + 1; j < lines.length; j++) {
                            const nextTrimmed = lines[j].trim();
                            if (nextTrimmed && !nextTrimmed.startsWith('#')) {
                                nextLine = nextTrimmed;
                                nextIndent = lines[j].length - lines[j].trimStart().length;
                                break;
                            }
                        }

                        currentContext[keyName] = (nextLine && nextLine.startsWith('-') && nextIndent > indentLevel)
                            ? [] : (currentContext[keyName] || {});

                        indentStack.push(indentLevel);
                        contextStack.push(currentContext[keyName]);
                    }
                }
            }

            if (currentCard) cards.push(currentCard);

            return cards;
        } catch (error) {
            console.error('[XiaoshiDynamicCard] YAML解析错误:', error);
            return [];
        }
    }

    _parseValue(value) {
        if (!value) return '';
        if ((value.startsWith('"') && value.endsWith('"')) ||
            (value.startsWith("'") && value.endsWith("'"))) {
            return value.slice(1, -1);
        }
        if (!isNaN(value) && value.trim() !== '') {
            return Number(value);
        }
        if (value === 'true') return true;
        if (value === 'false') return false;
        if (value === 'null') return null;
        return value;
    }

    _setNestedValue(obj, path, value) {
        const keys = path.split('.');
        let current = obj;
        for (let i = 0; i < keys.length - 1; i++) {
            const key = keys[i];
            if (!current[key] || typeof current[key] !== 'object') {
                current[key] = {};
            }
            current = current[key];
        }
        current[keys[keys.length - 1]] = value;
    }
}
customElements.define('xiaoshi-dynamic-card', XiaoshiDynamicCard);
