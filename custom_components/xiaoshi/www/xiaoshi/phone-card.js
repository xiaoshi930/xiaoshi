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
            .phone-container { width: 100%; height: 100%; display: flex; flex-direction: column; box-sizing: border-box; position: relative; }
            .bg-layer { position: absolute; top: 0; left: 0; width: 100%; height: 100%; z-index: 0; overflow: hidden; }
            .bg-layer img, .bg-layer video { width: 100%; height: 100%; object-fit: cover; }
            /* 安全区（iOS 刘海 / 状态栏 / Home 指示条）由卡片自己承担：
               --kiosk-safe-*-auto 由 render() 在全屏时写入（基于 env() 与 HA 变量取最大值），
               若主题里定义了 --kiosk-safe-top / --kiosk-safe-bottom，则以主题值为准（手动兜底入口）。
               非全屏时两个变量都是 0px，布局与原来完全一致。 */
            .content-layer { position: relative; z-index: 1; display: flex; flex-direction: column; width: 100%; height: 100%; box-sizing: border-box;
                padding-top: var(--kiosk-safe-top, var(--kiosk-safe-top-auto, 0px));
                padding-bottom: var(--kiosk-safe-bottom, var(--kiosk-safe-bottom-auto, 0px)); }
            /* 行高统一用百分比（相对 .content-layer 的内容盒），
               这样内容盒被安全区内边距压缩后，各行按比例收缩，不会溢出到状态栏/Home 指示条下面 */
            .top-row { display: flex; width: 100%; height: 14%; flex-shrink: 0; overflow: visible; }
            .avatar-area { padding: 1vh min(4vw, 20px) 1vh min(7.5vw, 37.5px); width: 20vw; max-width: 90px; height: 100%; display: flex; align-items: center; justify-content: center; flex-shrink: 0; box-sizing: border-box; overflow: visible; }
            .header-info-area { padding: 1vh min(2vw, 10px) 1vh min(2.5vw, 12.5px); width: 80vw; max-width: 400px; height: 100%; display: grid; grid-template-columns: repeat(4, 1fr); grid-template-rows: repeat(3, 1fr); gap: 1vh min(2vw, 10px); box-sizing: border-box; overflow: visible; align-items: center; justify-items: center; flex-shrink: 1; min-width: 0; }
            .dynamic-row { display: flex; width: 100vw; max-width: 500px; height: 5%; flex-shrink: 0; }
            .dynamic-area { width: 80vw; max-width: 400px; height: 100%; display: flex; align-items: center; justify-content: flex-start; flex-shrink: 0; }
            .btn-area { width: 20vw; max-width: 100px; height: 100%; display: flex; align-items: center; justify-content: flex-end; padding-right: min(2.5vw, 12.5px); box-sizing: border-box; flex-shrink: 0; gap: min(1vw, 5px); }
            .fullscreen-btn, .media-toggle-btn { width: 3.2vh; height: 3.2vh; display: flex; align-items: center; justify-content: center; flex-shrink: 0; cursor: none; border: none; background: var(--btn-bg, transparent); backdrop-filter: blur(6px); -webkit-backdrop-filter: blur(6px); border-radius: 4px; font-size: 18px; padding: 0; opacity: 0.6; transition: opacity 0.2s; border-radius: 8px; }
            .media-toggle-btn ha-icon { --mdi-icon-size: 1.8vh; display: inline-flex; width: 1.8vh; height: 1.8vh; margin-top: -0.7vh; margin-left: 0vh; }
            .fullscreen-btn:active ha-icon, .media-toggle-btn:active ha-icon { box-shadow: 0 2px 12px rgba(255, 255, 255, 0.4), 0 2px 8px rgba(0, 0, 0, 0.4); transform: scale(0.95); }
            .room-area { width: 100vw; max-width: 500px; height: 77%; display: grid; grid-template-columns: repeat(2, 1fr); gap: 1vh min(3vw, 15px); padding: 0 min(2.5vw, 12.5px); box-sizing: border-box; align-items: start; align-content: start; justify-items: center; overflow-y: auto; flex-shrink: 0; }
            .footer-area { width: 100vw; max-width: 500px; height: 4%; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
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
            return;
        }
        // 兜底：HA 重建 hui-root（切换面板 / 主题重载 / 视图重渲染）后注入的样式会全部丢失，
        // 而 _kioskWasOn 仍为 true，会造成「全屏看起来开着但实际没生效」→ 检测到缺失就补注入
        if (isKiosk && this._kioskStyleMissing()) {
            this._applyKioskMode(true);
        }
    }

    /* 定位 kiosk 相关节点（全部可选链，任一环节缺失都不会抛错） */
    _findKioskNodes() {
        const ha = document.querySelector('home-assistant');
        const main = ha?.shadowRoot?.querySelector('home-assistant-main');
        const drawer = main?.shadowRoot?.querySelector('ha-drawer');
        const panel = drawer?.querySelector('ha-panel-lovelace');
        const huiRoot = panel?.shadowRoot?.querySelector('hui-root');
        return {
            ha,
            main,
            drawer,
            drawerSR: drawer?.shadowRoot || null,
            huiRootSR: huiRoot?.shadowRoot || null
        };
    }

    _kioskStyleMissing() {
        const { main, huiRootSR } = this._findKioskNodes();
        if (!huiRootSR || !main) return false;
        if (!huiRootSR.querySelector('#xiaoshi-kiosk-header-style')) return true;
        if (!document.head.querySelector('#xiaoshi-kiosk-global-style')) return true;
        const toolbar = huiRootSR.querySelector('.toolbar');
        if (toolbar && !toolbar.querySelector('#xiaoshi-kiosk-menubutton-style')) return true;
        return false;
    }

    /* 向 shadow root / head 幂等写入样式（内容不变则不动 DOM） */
    _setStyleIn(root, id, text) {
        if (!root) return;
        let el = root.querySelector('#' + id);
        if (!el) {
            el = document.createElement('style');
            el.id = id;
            root.appendChild(el);
        }
        if (el.textContent !== text) el.textContent = text;
    }

    _applyKioskMode(on) {
        try {
            const { main, drawerSR, huiRootSR } = this._findKioskNodes();

            if (on) {
                // === 隐藏 header + 清零视图容器内边距 ===
                // 说明：原来这里是 padding-top: calc(var(--kiosk-header-height) + var(--safe-area-inset-top))。
                // 问题 1：--safe-area-inset-top 在 HA 里的定义是
                //         var(--app-safe-area-inset-top, env(safe-area-inset-top, 0px))，
                //         原生 App（iOS/Android Companion）注入的 --app-safe-area-inset-* 优先级高于 env()，
                //         它一旦是 0px，env() 兜底就被吃掉 → 整条 padding-top 变成 0，内容直接顶进状态栏。
                //         变量未定义时整条 calc 也会在计算值阶段失效（回落到 padding: 0），同样顶上去。
                // 问题 2：容器留出安全区内边距、而卡片自身是 height: 100vh，
                //         两者相加会让文档比视口高出一个刘海的高度 → iOS 页面变成可滚动/可橡皮筋回弹，
                //         一滑动内容就钻到状态栏下面。
                // 所以这里改为「容器彻底全屏零内边距 + 卡片内部自己加安全区内边距」：
                // 背景图/视频仍然满屏铺到状态栏与 Home 指示条，内容却严格落在安全区内，且页面不再可滚动。
                this._setStyleIn(huiRootSR, 'xiaoshi-kiosk-header-style', `
                    .header { display: none !important; }
                    #view,
                    hui-view-container,
                    hui-view-container.has-tab-bar {
                        box-sizing: border-box !important;
                        min-height: 100vh !important;
                        padding: 0 !important;
                        --view-container-padding-top: 0px !important;
                        --view-container-padding-bottom: 0px !important;
                    }
                `);

                // 禁止 iOS 橡皮筋回弹把内容拖到状态栏底下（仅全屏期间生效）
                this._setStyleIn(document.head, 'xiaoshi-kiosk-global-style', `
                    html, body { overscroll-behavior: none !important; }
                `);

                // === Hide Sidebar (in ha-drawer shadow root) ===
                this._setStyleIn(drawerSR, 'xiaoshi-kiosk-sidebar-style', `
                    :host {
                        --ha-sidebar-width: 0px !important;
                        --kiosk-sidebar-width: 0px !important;
                    }
                    ha-sidebar { display: none !important; }
                    wa-drawer, .sidebar-shell { display: none !important; }
                    partial-panel-resolver { --mdc-top-app-bar-width: 100% !important; }
                `);

                // === Hide menu burger button in toolbar ===
                this._setStyleIn(
                    huiRootSR?.querySelector('.toolbar'),
                    'xiaoshi-kiosk-menubutton-style',
                    'ha-menu-button { display: none !important; }'
                );

                // === Block toggle menu event ===
                if (!this._blockToggleMenu && main) {
                    this._blockToggleMenu = (e) => { e.preventDefault(); e.stopImmediatePropagation(); };
                    main.addEventListener('hass-toggle-menu', this._blockToggleMenu, true);
                }
            } else {
                // === Remove all injected kiosk styles ===
                huiRootSR?.querySelector('#xiaoshi-kiosk-header-style')?.remove();
                drawerSR?.querySelector('#xiaoshi-kiosk-sidebar-style')?.remove();
                huiRootSR?.querySelector('.toolbar')?.querySelector('#xiaoshi-kiosk-menubutton-style')?.remove();
                document.head.querySelector('#xiaoshi-kiosk-global-style')?.remove();

                // === Remove toggle menu blocker ===
                if (this._blockToggleMenu) {
                    main?.removeEventListener('hass-toggle-menu', this._blockToggleMenu, true);
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
        // 全屏（kiosk）时才注入安全区；非全屏保持 0px，不影响原有布局。
        // 取 max(HA变量, env()) 的原因：HA 的 --safe-area-inset-top 可能是被 App 覆盖掉的 0px，
        // 而 env() 才是 iOS 硬件真实的刘海/状态栏高度，两者取大值才不会漏掉状态栏。
        const kiosk = this._isKioskOn();
        const safeTopAuto = kiosk
            ? 'max(var(--safe-area-inset-top, 0px), env(safe-area-inset-top, 0px))'
            : '0px';
        const safeBottomAuto = kiosk
            ? 'max(var(--safe-area-inset-bottom, 0px), env(safe-area-inset-bottom, 0px))'
            : '0px';
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
            <div class="phone-container" style="background-color: ${bgColor}; --kiosk-safe-top-auto: ${safeTopAuto}; --kiosk-safe-bottom-auto: ${safeBottomAuto}">
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