const whenDefined = (t) => customElements.whenDefined(t);
await Promise.race([whenDefined("ha-card"), whenDefined("ha-panel-lovelace")]);
const LitElement = window.LitElement || Object.getPrototypeOf(customElements.get("ha-card"));
const html = LitElement.prototype.html;
const css = LitElement.prototype.css;
import { yamlToJson, jsonToYaml } from '../function/function.js';

window.customCards = window.customCards || [];
window.customCards.push({
    type: 'xiaoshi-phone-card',
    name: '消逝手机端',
    description: '消逝手机端',
    preview: false
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
        return css`            .form { display: flex; flex-direction: column; gap: 12px; min-height: 400px; }
            .form-row { display: flex; align-items: center; gap: 8px; }
            .form-row label { font-weight: bold; white-space: nowrap; min-width: 80px; }
            .form-row input, .form-row select { flex: 1; padding: 6px 8px; border: 1px solid #ddd; border-radius: 4px; }
            .card-section { border: 1px solid #ddd; border-radius: 8px; padding: 10px; display: flex; flex-direction: column; gap: 6px; }
            .card-section-title { font-weight: bold; font-size: 14px; color: var(--primary-text-color); margin-bottom: 4px; }
            .card-section textarea { width: 100%; min-height: 80px; padding: 6px 8px; border: 1px solid #ddd; border-radius: 4px; font-family: monospace; font-size: 12px; resize: vertical; box-sizing: border-box; }
            .bg-urls textarea { min-height: 40px; }
            .binding-row { display: flex; align-items: center; gap: 8px; margin-bottom: 6px; }
            .binding-row select { flex: 1; padding: 6px 8px; border: 1px solid #ddd; border-radius: 4px; min-width: 0; }
            .binding-remove { background: none; border: 1px solid #ddd; border-radius: 4px; cursor: pointer; padding: 4px 8px; color: #888; font-size: 14px; flex-shrink: 0; }
            .binding-remove:hover { color: #e00; border-color: #e00; }
            .binding-add { background: none; border: 1px dashed #aaa; border-radius: 4px; cursor: pointer; padding: 6px 12px; color: #666; font-size: 13px; width: 100%; }
            .binding-add:hover { color: var(--primary-color); border-color: var(--primary-color); }
            .card-section-hint { font-size: 11px; color: #888; }
            .bg-urls-row { display: flex; align-items: center; gap: 8px; }
            .bg-urls-row label { font-weight: bold; white-space: nowrap; min-width: 80px; }
            .bg-urls-row textarea { flex: 1; min-height: 60px; padding: 6px 8px; border: 1px solid #ddd; border-radius: 4px; font-family: monospace; font-size: 12px; resize: vertical; box-sizing: border-box; }`;
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
            return jsonToYaml(cards);
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
            const parsed = yamlToJson(yamlStr);
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

    _bgImageUrlsChanged(e) {
        const raw = e.target.value;
        const urls = raw.split('\n').map(s => s.trim()).filter(Boolean);
        this.config = {
            ...this.config,
            background: {
                ...this.config.background,
                image_urls: urls
            }
        };
        this.dispatchEvent(new CustomEvent('config-changed', {
            detail: { config: this.config },
            bubbles: true,
            composed: true
        }));
    }

    _bgVideoUrlsChanged(e) {
        const raw = e.target.value;
        const urls = raw.split('\n').map(s => s.trim()).filter(Boolean);
        this.config = {
            ...this.config,
            background: {
                ...this.config.background,
                video_urls: urls
            }
        };
        this.dispatchEvent(new CustomEvent('config-changed', {
            detail: { config: this.config },
            bubbles: true,
            composed: true
        }));
    }

    _getPersonEntities() {
        if (!this.hass || !this.hass.states) return [];
        return Object.values(this.hass.states)
            .filter(s => s.entity_id.startsWith('person.'))
            .map(s => ({
                entity_id: s.entity_id,
                friendly_name: s.attributes.friendly_name || s.entity_id
            }))
            .sort((a, b) => a.friendly_name.localeCompare(b.friendly_name));
    }

    _getThemePhoneSelects() {
        if (!this.hass || !this.hass.states) return [];
        return Object.values(this.hass.states)
            .filter(s => s.entity_id.startsWith('select.theme_phone_'))
            .map(s => ({
                entity_id: s.entity_id,
                friendly_name: s.attributes.friendly_name || s.entity_id
            }))
            .sort((a, b) => a.entity_id.localeCompare(b.entity_id));
    }

    _bgPersonChanged(e) {
        const personEntity = e.target.value;
        this.config = {
            ...this.config,
            background: {
                ...this.config.background,
                person_entity: personEntity
            }
        };
        this.dispatchEvent(new CustomEvent('config-changed', {
            detail: { config: this.config },
            bubbles: true,
            composed: true
        }));
    }

    _bgSelectChanged(e) {
        const selectEntity = e.target.value;
        this.config = {
            ...this.config,
            background: {
                ...this.config.background,
                select_entity: selectEntity
            }
        };
        this.dispatchEvent(new CustomEvent('config-changed', {
            detail: { config: this.config },
            bubbles: true,
            composed: true
        }));
    }

    _addBinding() {
        const bindings = [...(this.config.background.bindings || []), { name: '', select: '' }];
        this.config = {
            ...this.config,
            background: {
                ...this.config.background,
                bindings
            }
        };
        this.dispatchEvent(new CustomEvent('config-changed', {
            detail: { config: this.config },
            bubbles: true,
            composed: true
        }));
    }

    _removeBinding(index) {
        const bindings = [...(this.config.background.bindings || [])];
        bindings.splice(index, 1);
        this.config = {
            ...this.config,
            background: {
                ...this.config.background,
                bindings
            }
        };
        this.dispatchEvent(new CustomEvent('config-changed', {
            detail: { config: this.config },
            bubbles: true,
            composed: true
        }));
    }

    _bindingChanged(index, field, value) {
        const bindings = [...(this.config.background.bindings || [])];
        bindings[index] = { ...bindings[index], [field]: value };
        this.config = {
            ...this.config,
            background: {
                ...this.config.background,
                bindings
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
                    <label>背景</label>
                    <select .value="${(c.background && c.background.type) || 'none'}" @change="${this._bgTypeChanged}">
                        <option value="none" .selected="${!c.background || c.background.type === 'none' || !c.background.type}">无</option>
                        <option value="media" .selected="${c.background && c.background.type === 'media'}">图片/视频</option>
                    </select>
                </div>
                <div class="form-row">
                    <label>顶部空白空间</label>
                    <input type="text" name="top_space" .value="${c.top_space || '0vh'}" @change="${this._valueChanged}" placeholder="0vh"></input>
                </div>
                ${c.background && c.background.type && c.background.type !== 'none' ? html`
                <div class="card-section">
                    <div class="card-section-title">用户绑定</div>
                    ${(c.background.bindings || []).map((b, i) => html`
                    <div class="binding-row">
                        <select .value="${b.name || ''}" @change="${e => this._bindingChanged(i, 'name', e.target.value)}">
                            <option value="">-- 用户 --</option>
                            ${this._getPersonEntities().map(e => html`<option value="${e.friendly_name}" .selected="${b.name === e.friendly_name}">${e.friendly_name}</option>`)}
                        </select>
                        <select .value="${b.select || ''}" @change="${e => this._bindingChanged(i, 'select', e.target.value)}">
                            <option value="">-- select实体 --</option>
                            ${this._getThemePhoneSelects().map(e => html`<option value="${e.entity_id}" .selected="${b.select === e.entity_id}">${e.friendly_name}</option>`)}
                        </select>
                        <button class="binding-remove" @click="${() => this._removeBinding(i)}">✕</button>
                    </div>
                    `)}
                    <button class="binding-add" @click="${this._addBinding}">+ 添加绑定</button>
                </div>
                <div class="card-section bg-urls">
                    <div class="card-section-title">背景图片地址</div>
                    <textarea .value="${(c.background.image_urls || []).join('\n')}" @change="${this._bgImageUrlsChanged}" placeholder="每行一个地址，支持路径或网址"></textarea>
                </div>
                <div class="card-section bg-urls">
                    <div class="card-section-title">背景视频地址</div>
                    <textarea .value="${(c.background.video_urls || []).join('\n')}" @change="${this._bgVideoUrlsChanged}" placeholder="每行一个地址，支持路径或网址"></textarea>
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
        return css`            :host { display: block; width: 100vw; height: 100vh; overflow: visible; max-width: 500px; }
            .phone-container { width: 100%; height: 100%; display: flex; flex-direction: column; box-sizing: border-box; position: relative; --top-space: 0vh; }
            .bg-layer { position: absolute; top: 0; left: 0; width: 100%; height: 100%; z-index: 0; overflow: hidden; }
            .bg-layer img, .bg-layer video { width: 100%; height: 100%; object-fit: cover; }
            .content-layer { position: relative; z-index: 1; display: flex; flex-direction: column; width: 100%; height: 100%; box-sizing: border-box; overflow: hidden; }
            .top-space { width: 100%; height: var(--top-space); flex-shrink: 0; background: transparent; }
            .top-row { display: flex; width: 100%; height: calc(14vh * (100vh - var(--top-space)) / 100vh); flex-shrink: 0; overflow: visible; }
            .avatar-area { padding: 1vh min(4vw, 20px) 1vh min(7.5vw, 37.5px); width: 20vw; max-width: 90px; height: calc(14vh * (100vh - var(--top-space)) / 100vh); display: flex; align-items: center; justify-content: center; flex-shrink: 0; box-sizing: border-box; overflow: visible; }
            .header-info-area { padding: 1vh min(2vw, 10px) 1vh min(2.5vw, 12.5px); width: 80vw; max-width: 400px; height: calc(14vh * (100vh - var(--top-space)) / 100vh); display: grid; grid-template-columns: repeat(4, 1fr); grid-template-rows: repeat(3, 1fr); gap: 1vh min(2vw, 10px); box-sizing: border-box; overflow: visible; align-items: center; justify-items: center; flex-shrink: 1; min-width: 0; }
            .dynamic-row { display: flex; width: 100vw; max-width: 500px; height: calc(5vh * (100vh - var(--top-space)) / 100vh); flex-shrink: 0; }
            .dynamic-area { width: 80vw; max-width: 400px; height: calc(5vh * (100vh - var(--top-space)) / 100vh); display: flex; align-items: center; justify-content: flex-start; flex-shrink: 0; }
            .btn-area { width: 20vw; max-width: 100px; height: calc(5vh * (100vh - var(--top-space)) / 100vh); display: flex; align-items: center; justify-content: flex-end; padding-right: min(2.5vw, 12.5px); box-sizing: border-box; flex-shrink: 0; gap: min(1vw, 5px); }
            .fullscreen-btn, .media-toggle-btn { width: 3.2vh; height: 3.2vh; display: flex; align-items: center; justify-content: center; flex-shrink: 0; cursor: none; border: none; background: var(--btn-bg, transparent); backdrop-filter: blur(6px); -webkit-backdrop-filter: blur(6px); border-radius: 4px; font-size: 18px; padding: 0; opacity: 0.6; transition: opacity 0.2s; border-radius: 8px; }
            .media-toggle-btn ha-icon { --mdi-icon-size: 1.8vh; display: inline-flex; width: 1.8vh; height: 1.8vh; margin-top: -0.7vh; margin-left: 0vh; }
            .fullscreen-btn:active ha-icon, .media-toggle-btn:active ha-icon { box-shadow: 0 2px 12px rgba(255, 255, 255, 0.4), 0 2px 8px rgba(0, 0, 0, 0.4); transform: scale(0.95); }
            .room-area { width: 100vw; max-width: 500px; height: calc(77vh * (100vh - var(--top-space)) / 100vh); display: grid; grid-template-columns: repeat(2, 1fr); gap: 1vh min(3vw, 15px); padding: 0 min(2.5vw, 12.5px); box-sizing: border-box; align-items: start; align-content: start; justify-items: center; overflow-y: auto; }
            .footer-area { width: 100vw; max-width: 500px; height: calc(4vh * (100vh - var(--top-space)) / 100vh); display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
            .footer-area .card-slot { width: auto; height: 100%; display: flex; align-items: center; justify-content: center; }
            .card-slot { display: flex; align-items: center; justify-content: center; width: 100%; height: 100%; min-width: 0; min-height: 0; overflow: visible; }
            .header-info-area .card-slot { max-width: 100%; max-height: 100%; }
            .header-info-area .card-slot > * { max-width: 100%; max-height: 100%; min-width: 0; box-sizing: border-box; }`;
    }

    static getConfigElement() {
        return document.createElement('xiaoshi-phone-card-editor');
    }

    constructor() {
        super();
        this._cardElements = {};
        this._bgIndex = 0;
        this._bgTimer = null;
        this._kioskOn = true;
        this._kioskWasOn = false;
        this._blockToggleMenu = null;
    }

    disconnectedCallback() {
        super.disconnectedCallback();
        this._applyKioskMode(false);
        if (this._bgTimer) {
            clearInterval(this._bgTimer);
            this._bgTimer = null;
        }
    }

    updated(changedProps) {
        if (super.updated) super.updated(changedProps);
        const isKiosk = this._isKioskOn();
        if (isKiosk !== this._kioskWasOn) {
            this._kioskWasOn = isKiosk;
            this._applyKioskMode(isKiosk);
        }
    }

    _applyKioskMode(on) {
        try {
            const ha = document.querySelector('home-assistant');
            if (!ha?.shadowRoot) return;

            const main = ha.shadowRoot.querySelector('home-assistant-main');
            if (!main?.shadowRoot) return;

            const drawer = main.shadowRoot.querySelector('ha-drawer');
            const drawerSR = drawer?.shadowRoot;
            const panel = drawer?.querySelector('ha-panel-lovelace');
            const huiRoot = panel?.shadowRoot?.querySelector('hui-root');
            const huiRootSR = huiRoot?.shadowRoot;

            if (on) {
                // === Hide Header (in hui-root shadow root) ===
                if (huiRootSR && !huiRootSR.querySelector('#xiaoshi-kiosk-header-style')) {
                    const style = document.createElement('style');
                    style.id = 'xiaoshi-kiosk-header-style';
                    style.textContent = `
                        .header { display: none !important; }
                        #view {
                            min-height: 100vh !important;
                            --kiosk-header-height: 0px;
                            padding-top: calc(var(--kiosk-header-height) + var(--safe-area-inset-top)) !important;
                        }
                    `;
                    huiRootSR.appendChild(style);
                }

                // === Hide Sidebar (in ha-drawer shadow root) ===
                if (drawerSR && !drawerSR.querySelector('#xiaoshi-kiosk-sidebar-style')) {
                    const style = document.createElement('style');
                    style.id = 'xiaoshi-kiosk-sidebar-style';
                    style.textContent = `
                        :host {
                            --ha-sidebar-width: 0px !important;
                            --kiosk-sidebar-width: 0px !important;
                        }
                        ha-sidebar { display: none !important; }
                        wa-drawer, .sidebar-shell { display: none !important; }
                        partial-panel-resolver { --mdc-top-app-bar-width: 100% !important; }
                    `;
                    drawerSR.appendChild(style);
                }

                // === Hide menu burger button in toolbar ===
                const toolbar = huiRootSR?.querySelector('.toolbar');
                if (toolbar && !toolbar.querySelector('#xiaoshi-kiosk-menubutton-style')) {
                    const style = document.createElement('style');
                    style.id = 'xiaoshi-kiosk-menubutton-style';
                    style.textContent = `
                        ha-menu-button { display: none !important; }
                    `;
                    toolbar.appendChild(style);
                }

                // === Block toggle menu event ===
                if (!this._blockToggleMenu) {
                    this._blockToggleMenu = (e) => { e.preventDefault(); e.stopImmediatePropagation(); };
                    main.addEventListener('hass-toggle-menu', this._blockToggleMenu, true);
                }
            } else {
                // === Remove all injected kiosk styles ===
                huiRootSR?.querySelector('#xiaoshi-kiosk-header-style')?.remove();
                drawerSR?.querySelector('#xiaoshi-kiosk-sidebar-style')?.remove();
                const toolbar = huiRootSR?.querySelector('.toolbar');
                toolbar?.querySelector('#xiaoshi-kiosk-menubutton-style')?.remove();

                // === Remove toggle menu blocker ===
                if (this._blockToggleMenu) {
                    main.removeEventListener('hass-toggle-menu', this._blockToggleMenu, true);
                    this._blockToggleMenu = null;
                }
            }
        } catch (e) {
            console.error('[xiaoshi-phone-card] kiosk mode error:', e);
        }
    }



    _isKioskOn() {
        return this._kioskOn;
    }

    _toggleFullscreen() {
        this._kioskOn = !this._kioskOn;
        this.requestUpdate();
    }

    _getBgInfo() {
        /* 根据 bindings 和 select 实体决定当前背景模式
           返回 { mode: 'none'|'image'|'video', selectEntity, selectOptions, binding } */
        const c = this.config || {};
        const bg = c.background || {};
        if (bg.type !== 'media') return { mode: 'none' };

        const bindings = bg.bindings || [];
        if (!this._hass || !this._hass.user) return { mode: 'none' };

        const userName = this._hass.user.name;
        const binding = bindings.find(b => b.name === userName);
        if (!binding || !binding.select) return { mode: 'none' };

        const selectState = this._hass.states[binding.select];
        if (!selectState) return { mode: 'none', selectEntity: binding.select, selectOptions: [], binding };

        const options = selectState.attributes.options || [];
        // 如果选项只有"无"，则黑白
        const hasImage = options.includes('图片');
        const hasVideo = options.includes('视频');
        if (!hasImage && !hasVideo) return { mode: 'none', selectEntity: binding.select, selectOptions: options, binding };

        const currentValue = selectState.state;
        let mode = 'none';
        if (currentValue === '图片') mode = 'image';
        else if (currentValue === '视频') mode = 'video';
        // else: "无"或其他 → none

        return { mode, selectEntity: binding.select, selectOptions: options, binding, hasImage, hasVideo };
    }

    _cycleSelectBg() {
        /* 双击全屏按钮时循环切换 select 值 */
        const info = this._getBgInfo();
        if (!info.selectEntity || !info.hasImage && !info.hasVideo) return;

        const selectState = this._hass.states[info.selectEntity];
        if (!selectState) return;

        const options = selectState.attributes.options || [];
        const currentIdx = options.indexOf(selectState.state);
        const nextIdx = (currentIdx + 1) % options.length;
        const nextValue = options[nextIdx];

        this._hass.callService('select', 'select_option', {
            entity_id: info.selectEntity,
            option: nextValue
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

    _stopBgRotation() {
        if (this._bgTimer) {
            clearInterval(this._bgTimer);
            this._bgTimer = null;
        }
        this._bgIndex = 0;
        // 销毁已加载的音视频资源
        const bgLayer = this.shadowRoot && this.shadowRoot.querySelector('.bg-layer');
        if (bgLayer) {
            const video = bgLayer.querySelector('video');
            const img = bgLayer.querySelector('img');
            if (video) { video.pause(); video.src = ''; video.load(); }
            if (img) { img.src = ''; }
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

    _handleMediaToggle() {
        this._handleClick();
        this._cycleSelectBg();
    }

    _handleFullscreen() {
        this._handleClick();
        this._toggleFullscreen();
    }

    _onFullscreenDblClick(e) {
        e.preventDefault();
        e.stopPropagation();
        this._cycleSelectBg();
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

    _bgImageUrlsChanged(e) {
        const raw = e.target.value;
        const urls = raw.split('\n').map(s => s.trim()).filter(Boolean);
        this.config = {
            ...this.config,
            background: {
                ...this.config.background,
                image_urls: urls
            }
        };
        this.dispatchEvent(new CustomEvent('config-changed', {
            detail: { config: this.config },
            bubbles: true,
            composed: true
        }));
    }

    _bgVideoUrlsChanged(e) {
        const raw = e.target.value;
        const urls = raw.split('\n').map(s => s.trim()).filter(Boolean);
        this.config = {
            ...this.config,
            background: {
                ...this.config.background,
                video_urls: urls
            }
        };
        this.dispatchEvent(new CustomEvent('config-changed', {
            detail: { config: this.config },
            bubbles: true,
            composed: true
        }));
    }

    _getPersonEntities() {
        if (!this.hass || !this.hass.states) return [];
        return Object.values(this.hass.states)
            .filter(s => s.entity_id.startsWith('person.'))
            .map(s => ({
                entity_id: s.entity_id,
                friendly_name: s.attributes.friendly_name || s.entity_id
            }))
            .sort((a, b) => a.friendly_name.localeCompare(b.friendly_name));
    }

    _getThemePhoneSelects() {
        if (!this.hass || !this.hass.states) return [];
        return Object.values(this.hass.states)
            .filter(s => s.entity_id.startsWith('select.theme_phone_'))
            .map(s => ({
                entity_id: s.entity_id,
                friendly_name: s.attributes.friendly_name || s.entity_id
            }))
            .sort((a, b) => a.entity_id.localeCompare(b.entity_id));
    }

    _bgPersonChanged(e) {
        const personEntity = e.target.value;
        this.config = {
            ...this.config,
            background: {
                ...this.config.background,
                person_entity: personEntity
            }
        };
        this.dispatchEvent(new CustomEvent('config-changed', {
            detail: { config: this.config },
            bubbles: true,
            composed: true
        }));
    }

    _bgSelectChanged(e) {
        const selectEntity = e.target.value;
        this.config = {
            ...this.config,
            background: {
                ...this.config.background,
                select_entity: selectEntity
            }
        };
        this.dispatchEvent(new CustomEvent('config-changed', {
            detail: { config: this.config },
            bubbles: true,
            composed: true
        }));
    }

    _addBinding() {
        const bindings = [...(this.config.background.bindings || []), { name: '', select: '' }];
        this.config = {
            ...this.config,
            background: {
                ...this.config.background,
                bindings
            }
        };
        this.dispatchEvent(new CustomEvent('config-changed', {
            detail: { config: this.config },
            bubbles: true,
            composed: true
        }));
    }

    _removeBinding(index) {
        const bindings = [...(this.config.background.bindings || [])];
        bindings.splice(index, 1);
        this.config = {
            ...this.config,
            background: {
                ...this.config.background,
                bindings
            }
        };
        this.dispatchEvent(new CustomEvent('config-changed', {
            detail: { config: this.config },
            bubbles: true,
            composed: true
        }));
    }

    _bindingChanged(index, field, value) {
        const bindings = [...(this.config.background.bindings || [])];
        bindings[index] = { ...bindings[index], [field]: value };
        this.config = {
            ...this.config,
            background: {
                ...this.config.background,
                bindings
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

        const bg = c.background || {};
        const bgInfo = this._getBgInfo();
        let bgLayer = '';

        if (bgInfo.mode === 'video') {
            const videoUrls = bg.video_urls && bg.video_urls.length ? bg.video_urls : [];
            if (videoUrls.length > 0) {
                if (videoUrls.length > 1) this._startBgRotation(videoUrls);
                const url = videoUrls[this._bgIndex % videoUrls.length];
                bgLayer = html`<div class="bg-layer"><video src="${url}" autoplay loop muted playsinline></video></div>`;
            }
        } else if (bgInfo.mode === 'image') {
            const imageUrls = bg.image_urls && bg.image_urls.length ? bg.image_urls : [];
            if (imageUrls.length > 0) {
                if (imageUrls.length > 1) this._startBgRotation(imageUrls);
                const url = imageUrls[this._bgIndex % imageUrls.length];
                bgLayer = html`<div class="bg-layer"><img src="${url}" alt="background"></div>`;
            }
        } else {
            // 黑白背景，停止轮播并销毁资源
            this._stopBgRotation();
        }

        return html`
            <div class="phone-container" style="background-color: ${bgColor}; --top-space: ${c.top_space || '0vh'}">
                ${bgLayer}
                <div class="content-layer">
                    <div class="top-space"></div>
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
                        <div class="btn-area">
                            ${bgInfo.selectEntity && (bgInfo.hasImage || bgInfo.hasVideo) ? html`
                            <button class="media-toggle-btn" style="color: ${theme === 'dark' ? '#fff' : '#000'}; --btn-bg: ${theme === 'dark' ? 'rgba(0,0,0,0.3)' : 'rgba(230,230,230,0.3)'}" @click="${this._handleMediaToggle}" title="切换背景模式">
                                <ha-icon icon="${bgInfo.mode === 'video' ? 'mdi:motion-play-outline' : bgInfo.mode === 'image' ? 'mdi:image-auto-adjust' : 'mdi:checkbox-blank-off-outline'}"></ha-icon>
                            </button>
                            ` : ''}
                            <button class="fullscreen-btn" style="color: ${theme === 'dark' ? '#fff' : '#000'}; --btn-bg: ${theme === 'dark' ? 'rgba(0,0,0,0.3)' : 'rgba(230,230,230,0.3)'}" @click="${this._handleFullscreen}" title="全屏切换实体">
                                <ha-icon icon="${this._isKioskOn() ? 'mdi:fullscreen-exit' : 'mdi:fullscreen'}"></ha-icon>
                            </button>
                        </div>
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