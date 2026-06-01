import { LitElement, html, css } from "https://unpkg.com/lit-element@2.4.0/lit-element.js?module";
import "https://unpkg.com/js-yaml@4.1.0/dist/js-yaml.min.js";

window.customCards = window.customCards || [];
window.customCards.push({
    type: 'xiaoshi-phone-card',
    name: '消逝手机端',
    description: '消逝手机端',
    preview: true
});

class XiaoshiPhoneCardEditor extends LitElement {
    static get properties() {
        return {
            hass: { type: Object },
            config: { type: Object },
            _activeSearch: { type: String },
            _searchTerms: { type: Object },
            _filteredEntities: { type: Object }
        };
    }

    static get styles() {
        return css`
            .form {
                display: flex;
                flex-direction: column;
                gap: 12px;
                min-height: 400px;
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
            .card-section {
                border: 1px solid #ddd;
                border-radius: 8px;
                padding: 10px;
                display: flex;
                flex-direction: column;
                gap: 6px;
            }
            .card-section-title {
                font-weight: bold;
                font-size: 14px;
                color: var(--primary-text-color);
                margin-bottom: 4px;
            }
            .card-section textarea {
                width: 100%;
                min-height: 80px;
                padding: 6px 8px;
                border: 1px solid #ddd;
                border-radius: 4px;
                font-family: monospace;
                font-size: 12px;
                resize: vertical;
                box-sizing: border-box;
            }
            .card-section-hint {
                font-size: 11px;
                color: #888;
            }
            .bg-urls-row {
                display: flex;
                align-items: center;
                gap: 8px;
            }
            .bg-urls-row label {
                font-weight: bold;
                white-space: nowrap;
                min-width: 80px;
            }
            .bg-urls-row textarea {
                flex: 1;
                min-height: 60px;
                padding: 6px 8px;
                border: 1px solid #ddd;
                border-radius: 4px;
                font-family: monospace;
                font-size: 12px;
                resize: vertical;
                box-sizing: border-box;
            }
        `;
    }
    constructor() {
        super();
    }

    setConfig(config) {
        this.config = config;
    }

    _valueChanged(e) {
        const { name, value } = e.target;
        if (!name) return;

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

    _cardsToYaml(cards) {
        if (!cards || !cards.length) return '';
        try {
            const yaml = window.jsyaml || jsyaml;
            return yaml.dump(cards, { indent: 2, lineWidth: -1 });
        } catch (e) {
            try {
                return JSON.stringify(cards, null, 2);
            } catch (e2) {
                return '';
            }
        }
    }

    _yamlToCards(yamlStr) {
        if (!yamlStr || !yamlStr.trim()) return [];
        try {
            const yaml = window.jsyaml || jsyaml;
            const parsed = yaml.load(yamlStr);
            return Array.isArray(parsed) ? parsed : [];
        } catch (e) {
            try {
                const parsed = JSON.parse(yamlStr);
                return Array.isArray(parsed) ? parsed : [];
            } catch (e2) {
                return [];
            }
        }
    }

    _cardsChanged(e, areaName) {
        const yamlStr = e.target.value;
        const cards = this._yamlToCards(yamlStr);
        this.config = {
            ...this.config,
            [areaName]: cards
        };
        this.dispatchEvent(new CustomEvent('config-changed', {
            detail: { config: this.config },
            bubbles: true,
            composed: true
        }));
    }

    _bgTypeChanged(e) {
        const bgType = e.target.value;
        this.config = {
            ...this.config,
            background: {
                ...this.config.background,
                type: bgType
            }
        };
        this.dispatchEvent(new CustomEvent('config-changed', {
            detail: { config: this.config },
            bubbles: true,
            composed: true
        }));
    }

    _bgUrlsChanged(e) {
        const raw = e.target.value;
        const urls = raw.split('\n').map(s => s.trim()).filter(Boolean);
        this.config = {
            ...this.config,
            background: {
                ...this.config.background,
                urls: urls
            }
        };
        this.dispatchEvent(new CustomEvent('config-changed', {
            detail: { config: this.config },
            bubbles: true,
            composed: true
        }));
    }

    _bgTypeChanged(e) {
        const bgType = e.target.value;
        this.config = {
            ...this.config,
            background: {
                ...this.config.background,
                type: bgType
            }
        };
        this.dispatchEvent(new CustomEvent('config-changed', {
            detail: { config: this.config },
            bubbles: true,
            composed: true
        }));
    }

    _bgUrlsChanged(e) {
        const raw = e.target.value;
        const urls = raw.split('\n').map(s => s.trim()).filter(Boolean);
        this.config = {
            ...this.config,
            background: {
                ...this.config.background,
                urls: urls
            }
        };
        this.dispatchEvent(new CustomEvent('config-changed', {
            detail: { config: this.config },
            bubbles: true,
            composed: true
        }));
    }

    render() {
        if (!this.hass || !this.config) return html``;
        const c = this.config;

        return html`
            <div class="form">
                <div class="form-row">
                    <label>主题</label>
                    <select name="theme" @change="${this._valueChanged}">
                        <option value="system" .selected="${c.theme === 'system' || !c.theme}">跟随系统</option>
                        <option value="light" .selected="${c.theme === 'light'}">亮色 (light)</option>
                        <option value="dark" .selected="${c.theme === 'dark'}">暗色 (dark)</option>
                    </select>
                </div>
                <div class="form-row">
                    <label>全屏实体</label>
                    <input type="text" name="kiosk_entity" .value="${c.kiosk_entity || 'switch.phone_full'}" @change="${this._valueChanged}" placeholder="switch.phone_full" />
                </div>
                <div class="form-row">
                    <label>背景</label>
                    <select .value="${(c.background && c.background.type) || 'none'}" @change="${this._bgTypeChanged}">
                        <option value="none" .selected="${!c.background || c.background.type === 'none' || !c.background.type}">无</option>
                        <option value="image" .selected="${c.background && c.background.type === 'image'}">图片</option>
                        <option value="video" .selected="${c.background && c.background.type === 'video'}">视频</option>
                    </select>
                </div>
                ${c.background && c.background.type && c.background.type !== 'none' ? html`
                <div class="card-section">
                    <div class="card-section-title">背景${c.background.type === 'image' ? '图片' : '视频'}地址</div>
                    <textarea .value="${(c.background.urls || []).join('\n')}" @change="${this._bgUrlsChanged}" placeholder="每行一个地址${c.background.type === 'image' ? '，支持路径或网址' : '，支持路径或网址'}"></textarea>
                    <div class="card-section-hint">每行一个地址，支持本地路径或网络网址，多个地址时自动轮播</div>
                </div>
                ` : ''}
                <div class="card-section">
                    <div class="card-section-title">头像区域卡片 (avatar_cards)</div>
                    <textarea .value="${this._cardsToYaml(c.avatar_cards)}" @change="${e => this._cardsChanged(e, 'avatar_cards')}" placeholder="- type: entity-button&#10;  entity: sensor.xxx"></textarea>
                    <div class="card-section-hint">YAML列表格式，每个元素为一个卡片配置</div>
                </div>
                <div class="card-section">
                    <div class="card-section-title">表头信息区域卡片 (header_cards)</div>
                    <textarea .value="${this._cardsToYaml(c.header_cards)}" @change="${e => this._cardsChanged(e, 'header_cards')}" placeholder="- type: entity-button&#10;  entity: sensor.xxx"></textarea>
                    <div class="card-section-hint">4×3=12格，YAML列表格式</div>
                </div>
                <div class="card-section">
                    <div class="card-section-title">动态加载区域卡片 (dynamic_cards)</div>
                    <textarea .value="${this._cardsToYaml(c.dynamic_cards)}" @change="${e => this._cardsChanged(e, 'dynamic_cards')}" placeholder="- type: custom:xiaoshi-xxx"></textarea>
                    <div class="card-section-hint">YAML列表格式</div>
                </div>
                <div class="card-section">
                    <div class="card-section-title">房间区域卡片 (room_cards)</div>
                    <textarea .value="${this._cardsToYaml(c.room_cards)}" @change="${e => this._cardsChanged(e, 'room_cards')}" placeholder="- type: custom:xiaoshi-room-card"></textarea>
                    <div class="card-section-hint">2列网格，行数根据卡片数量自动计算，YAML列表格式</div>
                </div>
                <div class="card-section">
                    <div class="card-section-title">表尾区域卡片 (footer_cards)</div>
                    <textarea .value="${this._cardsToYaml(c.footer_cards)}" @change="${e => this._cardsChanged(e, 'footer_cards')}" placeholder="- type: entity-button&#10;  entity: sensor.xxx"></textarea>
                    <div class="card-section-hint">YAML列表格式</div>
                </div>
            </div>
        `;
    }

}
customElements.define('xiaoshi-phone-card-editor', XiaoshiPhoneCardEditor);

class XiaoshiPhoneCard extends LitElement {

    static get properties() {
        return {
            hass: { type: Object },
            config: { type: Object }
        };
    }

    static get styles() {
        return css`
            :host {
                display: block;
                width: 100vw;
                height: 100vh;
                overflow: visible;
            }
            .phone-container {
                width: 100%;
                height: 100%;
                display: flex;
                flex-direction: column;
                box-sizing: border-box;
                position: relative;
            }
            .bg-layer {
                position: absolute;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                z-index: 0;
                overflow: hidden;
            }
            .bg-layer img, .bg-layer video {
                width: 100%;
                height: 100%;
                object-fit: cover;
            }
            .content-layer {
                position: relative;
                z-index: 1;
                display: flex;
                flex-direction: column;
                width: 100%;
                height: 100%;
                box-sizing: border-box;
            }
            .top-row {
                display: flex;
                width: 100%;
                height: 14vh;
                flex-shrink: 0;
                overflow: visible;
            }
            .avatar-area {
                padding: 1vh 4vw 1vh 7.5vw;
                width: 20vw;
                height: 14vh;
                display: flex;
                align-items: center;
                justify-content: center;
                flex-shrink: 0;
                box-sizing: border-box;
                overflow: visible;
            }
            .header-info-area {
                padding: 1vh 2.5vw;
                width: 80vw;
                height: 14vh;
                display: grid;
                grid-template-columns: repeat(4, 1fr);
                grid-template-rows: repeat(3, 1fr);
                gap: 1vh 2vw;
                box-sizing: border-box;
                overflow: visible;
                align-items: center;
                justify-items: center;
                flex-shrink: 1;
                min-width: 0;
            }
            .dynamic-row {
                display: flex;
                width: 100vw;
                height: 5vh;
                flex-shrink: 0;
            }
            .dynamic-area {
                width: 90vw;
                height: 5vh;
                display: flex;
                align-items: center;
                justify-content: flex-start;
                flex-shrink: 0;
            }
            .fullscreen-btn {
                width: 10vw;
                height: 5vh;
                display: flex;
                align-items: center;
                justify-content: center;
                flex-shrink: 0;
                cursor: pointer;
                border: none;
                background: transparent;
                color: var(--primary-text-color, #333);
                font-size: 18px;
                padding: 0;
                opacity: 0.6;
                transition: opacity 0.2s;
            }
            .fullscreen-btn:hover {
                opacity: 1;
            }
            .room-area {
                width: 100vw;
                height: 77vh;
                display: grid;
                grid-template-columns: repeat(2, 1fr);
                gap: 1vh 3vw;
                padding: 0 2.5vw;
                box-sizing: border-box;
                align-items: start;
                align-content: start;
                justify-items: center;
                overflow-y: auto;
                flex-shrink: 0;
            }
            .footer-area {
                width: 100vw;
                height: 4vh;
                display: flex;
                align-items: center;
                justify-content: center;
                flex-shrink: 0;
            }
            .footer-area .card-slot {
                width: auto;
                height: 100%;
                display: flex;
                align-items: center;
                justify-content: center;
            }
            .card-slot {
                display: flex;
                align-items: center;
                justify-content: center;
                width: 100%;
                height: 100%;
                min-width: 0;
                min-height: 0;
                overflow: visible;
            }
            .header-info-area .card-slot {
                max-width: 100%;
                max-height: 100%;
            }
            .header-info-area .card-slot > * {
                max-width: 100%;
                max-height: 100%;
                min-width: 0;
                box-sizing: border-box;
            }
        `;
    }

    static getConfigElement() {
        return document.createElement('xiaoshi-phone-card-editor');
    }

    constructor() {
        super();
        this._cardElements = {};
        this._bgIndex = 0;
        this._bgTimer = null;
    }

    disconnectedCallback() {
        super.disconnectedCallback();
        if (this._bgTimer) {
            clearInterval(this._bgTimer);
            this._bgTimer = null;
        }
    }



    _isKioskOn() {
        const entityId = this.config.kiosk_entity || 'switch.phone_full';
        return this._hass && this._hass.states[entityId] && this._hass.states[entityId].state === 'on';
    }

    _toggleFullscreen() {
        const entityId = this.config.kiosk_entity || 'switch.phone_full';
        if (!this._hass) return;
        const currentState = this._hass.states[entityId];
        if (!currentState) {
            console.warn('[xiaoshi-phone-card] 实体不存在:', entityId);
            return;
        }
        const newState = currentState.state === 'on' ? false : true;
        this._hass.callService('switch', 'turn_' + (newState ? 'on' : 'off'), {
            entity_id: entityId
        });
    }

    _startBgRotation(urls) {
        if (this._bgTimer) {
            clearInterval(this._bgTimer);
            this._bgTimer = null;
        }
        if (urls.length <= 1) return;
        this._bgTimer = setInterval(() => {
            this._bgIndex = (this._bgIndex + 1) % urls.length;
            this.requestUpdate();
        }, 15000);
    }

    setConfig(config) {
        this.config = {
            avatar_cards: [],
            header_cards: [],
            dynamic_cards: [],
            room_cards: [],
            footer_cards: [],
            ...config
        };
        this._executeGlobalFunctions();
        this._buildCards();
    }

    _executeGlobalFunctions() {
        const code = this.config.global_functions;
        if (!code || typeof code !== 'string') return;
        try {
            const fn = new Function('hass', 'states', code);
            fn(this._hass || {}, this._hass ? this._hass.states : {});
        } catch (e) {
            console.error('[xiaoshi-phone-card] 执行 global_functions 失败:', e);
        }
    }


    set hass(hass) {
        this._hass = hass;
        this._executeGlobalFunctions();
        this._propagateHass();
        this.requestUpdate();
    }

    get hass() {
        return this._hass;
    }

    async _createCardElementAsync(cardConfig) {
        if (!cardConfig || !cardConfig.type) return null;
        try {
            // 同步方式：优先直接创建
            const tag = cardConfig.type;
            if (customElements.get(tag)) {
                const el = document.createElement(tag);
                el.setConfig(cardConfig);
                if (this._hass) el.hass = this._hass;
                return el;
            }
            // 异步方式：通过 HA helpers 加载
            if (window.loadCardHelpers) {
                const helpers = await window.loadCardHelpers();
                const el = await helpers.createCardElement(cardConfig);
                if (this._hass) el.hass = this._hass;
                return el;
            }
            // 兜底：等待元素注册
            const el = document.createElement('hui-error-card');
            el.setConfig({ type: 'error', error: `Unknown card type: ${tag}`, cardConfig });
            return el;
        } catch (e) {
            console.error('[xiaoshi-phone-card] 创建卡片失败:', e, cardConfig);
            try {
                const el = document.createElement('hui-error-card');
                el.setConfig({ type: 'error', error: `创建卡片失败: ${e.message}`, cardConfig });
                return el;
            } catch (e2) {
                return null;
            }
        }
    }

    async _buildCards() {
        this._cardElements = {};
        const c = this.config;

        if (c.avatar_cards && c.avatar_cards.length) {
            this._cardElements.avatar = (await Promise.all(c.avatar_cards.map(cfg => this._createCardElementAsync(cfg)))).filter(Boolean);
        }
        if (c.header_cards && c.header_cards.length) {
            this._cardElements.header = (await Promise.all(c.header_cards.map(cfg => this._createCardElementAsync(cfg)))).filter(Boolean);
        }
        if (c.dynamic_cards && c.dynamic_cards.length) {
            this._cardElements.dynamic = (await Promise.all(c.dynamic_cards.map(cfg => this._createCardElementAsync(cfg)))).filter(Boolean);
        }
        if (c.room_cards && c.room_cards.length) {
            this._cardElements.room = (await Promise.all(c.room_cards.map(cfg => this._createCardElementAsync(cfg)))).filter(Boolean);
        }
        if (c.footer_cards && c.footer_cards.length) {
            this._cardElements.footer = (await Promise.all(c.footer_cards.map(cfg => this._createCardElementAsync(cfg)))).filter(Boolean);
        }

        this.requestUpdate();
    }

    _propagateHass() {
        if (!this._hass) return;
        Object.values(this._cardElements).forEach(arr => {
            if (Array.isArray(arr)) {
                arr.forEach(el => { if (el) el.hass = this._hass; });
            }
        });
    }

    _evaluateTheme() {
        try {
            const mode = this.config ? this.config.theme : 'system';
            let result;
            if (mode === 'light') result = 'light';
            else if (mode === 'dark') result = 'dark';
            else if (mode === 'system' || !mode) {
                if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) result = 'dark';
                else result = 'light';
            } else {
                result = mode;
            }
            // 注册全局 theme() 函数，返回当前主题 light/dark
            window.theme = () => result;
            return result;
        } catch (e) {
            window.theme = () => 'light';
            return 'light';
        }
    }

    _bgTypeChanged(e) {
        const bgType = e.target.value;
        this.config = {
            ...this.config,
            background: {
                ...this.config.background,
                type: bgType
            }
        };
        this.dispatchEvent(new CustomEvent('config-changed', {
            detail: { config: this.config },
            bubbles: true,
            composed: true
        }));
    }

    _bgUrlsChanged(e) {
        const raw = e.target.value;
        const urls = raw.split('\n').map(s => s.trim()).filter(Boolean);
        this.config = {
            ...this.config,
            background: {
                ...this.config.background,
                urls: urls
            }
        };
        this.dispatchEvent(new CustomEvent('config-changed', {
            detail: { config: this.config },
            bubbles: true,
            composed: true
        }));
    }

    render() {
        const theme = this._evaluateTheme();
        const bgColor = theme === 'dark' ? 'rgb(0,0,0)' : 'rgb(230,230,230)';
        const c = this.config || {};
        const roomCards = this._cardElements.room || [];
        const roomRows = Math.max(4, Math.ceil(roomCards.length / 2));
        const avatarCards = this._cardElements.avatar || [];
        const headerCards = this._cardElements.header || [];
        const dynamicCards = this._cardElements.dynamic || [];
        const footerCards = this._cardElements.footer || [];

        const bg = c.background;
        const bgType = bg && bg.type && bg.type !== 'none' ? bg.type : null;
        const bgUrls = bg && bg.urls && bg.urls.length ? bg.urls : [];
        if (bgType && bgUrls.length > 1) {
            this._startBgRotation(bgUrls);
        }
        const currentBgUrl = bgUrls.length > 0 ? bgUrls[this._bgIndex % bgUrls.length] : '';

        let bgLayer = '';
        if (bgType === 'image' && currentBgUrl) {
            bgLayer = html`<div class="bg-layer"><img src="${currentBgUrl}" alt="background"></div>`;
        } else if (bgType === 'video' && currentBgUrl) {
            bgLayer = html`<div class="bg-layer"><video src="${currentBgUrl}" autoplay loop muted playsinline></video></div>`;
        }

        return html`
            <div class="phone-container" style="background-color: ${bgColor}">
                ${bgLayer}
                <div class="content-layer">
                    <div class="top-row">
                        <div class="avatar-area">
                            ${avatarCards.map(el => html`<div class="card-slot">${el}</div>`)}
                        </div>
                        <div class="header-info-area">
                            ${Array.from({ length: 12 }, (_, i) => html`
                                <div class="card-slot">
                                    ${headerCards[i] || ''}
                                </div>
                            `)}
                        </div>
                    </div>
                    <div class="dynamic-row">
                        <div class="dynamic-area">
                            ${dynamicCards.map(el => html`<div class="card-slot">${el}</div>`)}
                        </div>
                        <button class="fullscreen-btn" @click="${this._toggleFullscreen}" title="全屏切换实体">
                            ${this._isKioskOn() ? '⤓' : '⤢'}
                        </button>
                    </div>
                    <div class="room-area" style="grid-template-rows: repeat(${roomRows}, 1fr)">
                        ${roomCards.map(el => html`<div class="card-slot">${el}</div>`)}
                    </div>
                    <div class="footer-area">
                        ${footerCards.map(el => html`<div class="card-slot">${el}</div>`)}
                    </div>
                </div>
            </div>
        `;
    }
}
customElements.define('xiaoshi-phone-card', XiaoshiPhoneCard);

