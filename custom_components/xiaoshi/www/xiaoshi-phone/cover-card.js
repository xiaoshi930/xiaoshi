const whenDefined = (t) => customElements.whenDefined(t);
await Promise.race([whenDefined("ha-card"), whenDefined("ha-panel-lovelace")]);
const LitElement = window.LitElement || Object.getPrototypeOf(customElements.get("ha-card"));
const html = LitElement.prototype.html;
const css = LitElement.prototype.css;

window.customCards = window.customCards || [];
window.customCards.push({
    type: 'xiaoshi-cover-card',
    name: '消逝(B移动端)-窗帘/卷帘卡片',
    description: '移动端窗帘/卷帘卡片',
    preview: true
});

class XiaoshiCoverCardEditor extends LitElement {
    static get properties() {
        return {
            hass: { type: Object },
            config: { type: Object },
            _searchTerm: { type: String },
            _filteredEntities: { type: Array },
            _showEntityList: { type: Boolean }
        };
    }

    setConfig(config) { this.config = config || {}; }

    firstUpdated() {
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.entity-selector')) {
                this._showEntityList = false;
                this.requestUpdate();
            }
        });
        this._setDefaultEntity();
    }

    async _setDefaultEntity() {
        if (this.config?.entity) return;
        const entities = Object.keys(this.hass.states).filter(eid => eid.startsWith('cover.'));
        if (entities.length > 0) {
            this.config = { ...(this.config || {}), entity: entities[0] };
            this._fireEvent();
        }
    }

    _onEntitySearch(e) {
        const term = e.target.value.toLowerCase();
        this._searchTerm = term;
        this._showEntityList = true;
        if (!this.hass) return;
        this._filteredEntities = Object.values(this.hass.states).filter(ent => {
            const eid = ent.entity_id.toLowerCase();
            const fn = (ent.attributes.friendly_name || '').toLowerCase();
            return eid.startsWith('cover.') && (eid.includes(term) || fn.includes(term));
        }).slice(0, 50);
        this.requestUpdate();
    }

    _selectEntity(entityId) {
        this.config = { ...this.config, entity: entityId };
        this._searchTerm = '';
        this._showEntityList = false;
        this._fireEvent();
        this.requestUpdate();
    }

    static get styles() {
        return css`
            .card-config { padding: 16px; }
            .row { margin-bottom: 16px; }
            .label { margin-bottom: 8px; font-weight: bold; }
            .entity-selector { position: relative; }
            .entity-search-input {
                width: 100%; padding: 8px;
                border: 1px solid #ddd; border-radius: 4px; box-sizing: border-box;
            }
            .entity-dropdown {
                position: absolute; top: 100%; left: 0; right: 0;
                height: 300px; overflow-y: auto; background: white;
                border: 1px solid #ddd; border-radius: 4px;
                box-shadow: 0 2px 8px rgba(0,0,0,0.1); z-index: 1000; margin-top: 2px;
            }
            .entity-option {
                display: flex; align-items: center; justify-content: space-between;
                padding: 8px 12px; cursor: pointer; border-bottom: 1px solid #eee;
            }
            .entity-option:hover { background: #f5f5f5; }
            .entity-option.selected { background: #e3f2fd; }
            .entity-info { display: flex; align-items: center; gap: 8px; flex: 1; }
            .entity-details { flex: 1; }
            .entity-name { font-weight: 500; font-size: 14px; color: #000; }
            .entity-id { font-size: 12px; color: #000; font-family: monospace; }
            .check-icon { color: #4CAF50; }
            .no-results { padding: 12px; text-align: center; color: #666; font-style: italic; }
            .hint { font-size: 0.85em; color: #888; margin-top: 4px; }
            .row select {
                margin-left: 8px; padding: 4px 8px; border-radius: 4px;
                border: 1px solid var(--primary-color);
                background: var(--secondary-background-color);
                color: var(--primary-text-color);
            }
        `;
    }

    render() {
        if (!this.hass) return html``;
        return html`
            <div class="card-config">
                <div class="row">
                    <div class="label">窗帘实体 (必选)</div>
                    <div class="entity-selector">
                        <input type="text"
                            @input=${this._onEntitySearch}
                            @focus=${this._onEntitySearch}
                            .value=${this._searchTerm || this.config?.entity || ''}
                            placeholder="搜索窗帘实体..."
                            class="entity-search-input" />
                        ${this._showEntityList ? html`
                            <div class="entity-dropdown">
                                ${(this._filteredEntities || []).map(ent => html`
                                    <div class="entity-option ${this.config?.entity === ent.entity_id ? 'selected' : ''}"
                                         @click=${() => this._selectEntity(ent.entity_id)}>
                                        <div class="entity-info">
                                            <ha-icon icon="${ent.attributes.icon || 'mdi:curtains'}"></ha-icon>
                                            <div class="entity-details">
                                                <div class="entity-name">${ent.attributes.friendly_name || ent.entity_id}</div>
                                                <div class="entity-id">${ent.entity_id}</div>
                                            </div>
                                        </div>
                                        ${this.config?.entity === ent.entity_id ?
                                            html`<ha-icon icon="mdi:check" class="check-icon"></ha-icon>` : ''}
                                    </div>
                                `)}
                                ${(this._filteredEntities || []).length === 0 ?
                                    html`<div class="no-results">未找到匹配的实体</div>` : ''}
                            </div>
                        ` : ''}
                    </div>
                    ${!this.config?.entity ? html`<div class="hint">正在加载可用窗帘实体...</div>` : ''}
                </div>

                <div class="row">
                    <div class="label">主题模式</div>
                    <select .value=${this.config.theme || 'system'}
                            @change=${(e) => { this.config = { ...this.config, theme: e.target.value }; this._fireEvent(); }}>
                        <option value="system" ?selected=${!this.config.theme || this.config.theme === 'system'}>跟随系统</option>
                        <option value="light" ?selected=${this.config.theme === 'light'}>亮色</option>
                        <option value="dark" ?selected=${this.config.theme === 'dark'}>暗色</option>
                    </select>
                </div>

                <div class="row">
                    <div class="label">强调色</div>
                    <input type="text"
                        .value=${this.config.accentColor || 'rgb(4,211,233)'}
                        @input=${(e) => { this.config = { ...this.config, accentColor: e.target.value }; this._fireEvent(); }}
                        placeholder="rgb(4,211,233)"
                        class="entity-search-input" />
                </div>
            </div>
        `;
    }

    _fireEvent() {
        this.dispatchEvent(new CustomEvent('config-changed', { detail: { config: this.config } }));
    }
}
customElements.define('xiaoshi-cover-card-editor', XiaoshiCoverCardEditor);

class XiaoshiCoverCard extends LitElement {
    static get properties() {
        return {
            hass: { type: Object },
            config: { type: Object },
            _localSliderValue: { type: Number }
        };
    }

    static getConfigElement() {
        return document.createElement("xiaoshi-cover-card-editor");
    }

    static getStubConfig() {
        return { entity: "", theme: "system", accentColor: "rgb(4,211,233)" };
    }

    setConfig(config) {
        this.config = config;
    }

    constructor() {
        super();
        this.hass = {};
        this.config = {};
        this._isSliderDragging = false;
        this._sliderJustReleased = false;
        this._justDragged = false;
        this._localSliderValue = 0;
        this._lastIconState = null;
        this._lastPartialPos = null;
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

    // 生成窗帘SVG - 完全按照原版YAML结构
    // visualKey: 'closed' | 'open' | 'partial'
    _buildCurtainSVG(visualKey, accentColor, isDark, position) {
        const id = 'c' + Math.random().toString(36).slice(2, 7);

        // 颜色方案（与原版一致）
        // open/active: accent色帘褶 + 蓝色辅助
        // closed/inactive: 灰色全部
        const isOpen = (visualKey === 'open');
        const pc = isOpen ? 'rgb(157,160,162)' : accentColor;
        const sc = isOpen ? 'rgb(157,160,162)' : 'rgb(87,168,215)';
        const scOp = isOpen ? '0.5' : '1';

        // ====== partial (2-98%): 窗帘高度与进度同步 ======
        // 帘褶向顶部压缩，模拟真实窗帘收拢效果
        // position=0% → 全关（帘褶完全展开）; position=100% → 全开（帘褶全部收拢到顶部）
        if (visualKey === 'partial') {
            const t = position / 100;
            // 窗帘布起始位置（杆下方）和底部位置
            const fabricTop = 14.987;
            const fabricBottom = 59.65;
            const fabricSpan = fabricBottom - fabricTop;

            const bars = [
                { oy: 22.54 },
                { oy: 29.96 },
                { oy: 37.38 },
                { oy: 44.80 },
                { oy: 52.23 },
                { oy: 59.65 }
            ];

            let barRects = '';
            bars.forEach((b, i) => {
                // 帘褶向顶部压缩：距离fabricTop的比例保持不变，总跨度随(1-t)缩小
                const newY = fabricTop + (b.oy - fabricTop) * (1 - t);
                // 帘褶高度也随(1-t)同步缩小，保持帘褶间始终有间隔
                const newH = Math.max(0.3, 4.834 * (1 - t)).toFixed(3);
                barRects += `<rect id="${id}${i + 5}" width="64.583000" height="${newH}" rx="0" ry="0" transform="translate(0,0) translate(8.615000,${newY.toFixed(3)})" fill="${accentColor}" stroke="none" stroke-width="1"/>`;
            });

            // 背景#4: 高度随(1-t)等比缩小
            const bgH = Math.max(0.1, 5.378 * (1 - t)).toFixed(3);
            // 拉杆绳#11: 始终固定不变
            // 底部三角形
            const curBottom = fabricTop + fabricSpan * (1 - t);
            const triOp = (1 - t * 1.5).toFixed(2);

            return `<svg id="${id}" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 24 24" shape-rendering="geometricPrecision" text-rendering="geometricPrecision" style="width:60px;height:60px;display:block;margin:auto">` +
                `<g id="${id}g" transform="matrix(0.28549000620842 0 0 0.35877102613449 0.30161800980568 -2.55328607559204)">` +
                `<rect id="${id}3" width="71.311996" height="1.914000" rx="0" ry="0" transform="matrix(1 0 0 1 4.90700006484985 12.43799972534180)" fill="${accentColor}" stroke="none" stroke-width="1"/>` +
                `<rect id="${id}4" width="71.311996" height="${bgH}" rx="0" ry="0" transform="matrix(1 0 0 1 4.90700006484985 14.98700046539307)" fill="rgb(87,168,215)" stroke="none" stroke-width="1"/>` +
                barRects +
                `<rect id="${id}11" width="2.125000" height="34.525002" rx="0" ry="0" transform="matrix(1 0 0 1 4.90700006484985 22.53599929809570)" fill="rgb(87,168,215)" stroke="none" stroke-width="1"/>` +
                (t < 0.7 ? `<polygon id="${id}12" points="6.745000,${curBottom.toFixed(3)} 5.169000,${curBottom.toFixed(3)} 4.898000,${(curBottom + 1.456).toFixed(3)} 7.041000,${(curBottom + 1.456).toFixed(3)}" fill="${accentColor}" opacity="${Math.max(0, triOp)}" stroke="none" stroke-width="1"/>` : '') +
                `</g></svg>`;
        }

        // ====== closed / open: 带动画的SVG（与原版结构完全一致） ======
        // closed: 帘褶从cy→oy动画（帘褶垂下），颜色灰色
        // open: 帘褶从oy→cy动画（帘褶收起），颜色强调色，animation-direction: reverse

        const isClosed = (visualKey === 'closed');
        const dir = isClosed ? 'normal' : 'reverse';
        // open时帘褶初始在oy(垂下), closed时帘褶初始在cy(收起)
        const barInit = isClosed ? 'cy' : 'oy';

        // 6根帘褶动画参数（与原版完全一致）
        const animBars = [
            { i: 5, cy: 22.04, oy: 22.54, d: 30, sd: 0 },
            { i: 6, cy: 29.46, oy: 29.96, d: 40, sd: 10 },
            { i: 7, cy: 36.88, oy: 37.38, d: 50, sd: 20 },
            { i: 8, cy: 44.30, oy: 44.80, d: 60, sd: 30 },
            { i: 9, cy: 51.73, oy: 52.23, d: 70, sd: 40 },
            { i: 10, cy: 59.15, oy: 59.65, d: 80, sd: 50 }
        ];

        let styleCSS = '';
        let barRects = '';

        animBars.forEach(b => {
            const eid = id + b.i;
            // 动画方向：closed=normal(cy→oy), open=reverse(oy→cy)
            // keyframes始终定义cy→oy方向，open时用reverse播放
            const fromY = b.cy;
            const toY = b.oy;
            const sd = b.sd;
            const d = b.d;

            styleCSS += `#${eid} { animation-name: ${eid}__tt, ${eid}_c_o; animation-duration: 1000ms; animation-fill-mode: forwards; animation-timing-function: linear; animation-direction: ${dir}; animation-iteration-count: 1; }`;
            styleCSS += `@keyframes ${eid}__tt { 0% {transform: translate(0px,0px) translate(8.615000px,${fromY.toFixed(6)}px)} ${sd}% {transform: translate(0px,0px) translate(8.615000px,${fromY.toFixed(6)}px)} ${d}% {transform: translate(0px,0px) translate(8.615000px,${toY.toFixed(6)}px)} 100% {transform: translate(0px,0px) translate(8.615000px,${toY.toFixed(6)}px)} }`;
            styleCSS += `@keyframes ${eid}_c_o { 0% {opacity: 0} ${sd}% {opacity: 0} ${d}% {opacity: 1} 100% {opacity: 1} }`;

            // 初始transform：closed在cy, open在oy
            const initY = barInit === 'cy' ? b.cy : b.oy;
            const initOp = barInit === 'cy' ? 0 : 1;
            barRects += `<rect id="${eid}" width="64.583000" height="4.834000" rx="0" ry="0" transform="translate(0,0) translate(8.615000,${initY.toFixed(6)})" opacity="${initOp}" fill="${pc}" stroke="none" stroke-width="1"/>`;
        });

        // 背景#4 动画（closed: 0.5→1, open: 0.5→1 reverse即1→0.5）
        const bg4Dir = dir;
        styleCSS += `#${id}4 {animation: ${id}4_c_o 1000ms linear 1 ${bg4Dir} forwards}`;
        styleCSS += `@keyframes ${id}4_c_o { 0% {opacity: 0.500000} 100% {opacity: 1} }`;

        // 垂直条#11 动画
        styleCSS += `#${id}11 {animation: ${id}11_c_o 1000ms linear 1 ${dir} forwards}`;
        styleCSS += `@keyframes ${id}11_c_o { 0% {opacity: 0.500000} 100% {opacity: 1} }`;

        const bgInitOp = isClosed ? '0.5' : '1';
        const vBarInitOp = isClosed ? '0.5' : '1';

        return `<svg id="${id}" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 24 24" shape-rendering="geometricPrecision" text-rendering="geometricPrecision" style="width:60px;height:60px;display:block;margin:auto">` +
            `<style><![CDATA[${styleCSS}]]></style>` +
            `<g id="${id}g" transform="matrix(0.28549000620842 0 0 0.35877102613449 0.30161800980568 -2.55328607559204)">` +
            `<rect id="${id}3" width="71.311996" height="1.914000" rx="0" ry="0" transform="matrix(1 0 0 1 4.90700006484985 12.43799972534180)" fill="${pc}" stroke="none" stroke-width="1"/>` +
            `<rect id="${id}4" width="71.311996" height="5.378000" rx="0" ry="0" transform="matrix(1 0 0 1 4.90700006484985 14.98700046539307)" opacity="${bgInitOp}" fill="${sc}" stroke="none" stroke-width="1"/>` +
            barRects +
            `<rect id="${id}11" width="2.125000" height="34.525002" rx="0" ry="0" transform="matrix(1 0 0 1 4.90700006484985 22.53599929809570)" opacity="${vBarInitOp}" fill="${sc}" stroke="none" stroke-width="1"/>` +
            `<polygon id="${id}12" points="6.745000,57.499000 5.169000,57.499000 4.898000,58.955000 7.041000,58.955000" fill="${pc}" stroke="none" stroke-width="1"/>` +
            `</g></svg>`;
    }

    static get styles() {
        return css`
            :host {
                display: block;
            }

            .card {
                position: relative;
                border-radius: 12px;
                padding: 0;
                cursor: none;
                box-sizing: border-box;
                width: 100%;
                height: 94px;
            }

            /* 圆角裁剪层 - 只裁剪背景 */
            .bg-clip {
                position: absolute;
                top: 0; left: 0; right: 0; bottom: 0;
                border-radius: 12px;
                overflow: hidden;
                z-index: 0;
            }

            .bg-layer {
                position: absolute;
                top: 0; left: 0; right: 0; bottom: 0;
            }

            /* 内容层 */
            .content {
                position: relative;
                z-index: 1;
                width: 100%;
                height: 100%;
                display: grid;
                grid-template-areas:
                    "name  slider hanzi"
                    "icon  sub    status";
                grid-template-columns: 30% 50% 20%;
                grid-template-rows: 1fr 1fr;
            }

            /* ====== 名称 ====== */
            .name-area {
                grid-area: name;
                display: flex;
                align-items: center;
                justify-content: center;
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
                font-size: 14px;
                font-weight: bold;
                margin-top: -6px;
            }

            /* ====== Sun 滑块 ====== */
            .slider-area {
                grid-area: slider;
                display: flex;
                align-items: center;
                padding: 0 8px;
                margin-top: 16px;
            }

            .sun-slider-container {
                position: relative;
                width: 100%;
                height: 25px;
                display: flex;
                align-items: center;
                box-sizing: border-box;
            }

            .sun-slider-track {
                position: absolute;
                top: 50%;
                left: 0;
                transform: translateY(-50%);
                width: 100%;
                height: 25px;
                border-radius: 8px;
                overflow: hidden;
                cursor: default;
                touch-action: none;
            }

            .sun-slider-bar {
                position: absolute;
                top: 0;
                left: 0;
                height: 100%;
                border-radius: 8px;
                pointer-events: none;
            }

            .sun-slider-thumb {
                position: absolute;
                top: 50%;
                transform: translate(-50%, -50%);
                width: 16px;
                height: 16px;
                border-radius: 50%;
                background: white;
                box-shadow: 0 2px 4px rgba(0,0,0,0.3);
                cursor: grab;
                touch-action: none;
                z-index: 1;
            }

            .sun-slider-thumb:active { cursor: grabbing; }

            /* ====== 汉字状态 ====== */
            .hanzi-area {
                grid-area: hanzi;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 14px;
                font-weight: bold;
                white-space: nowrap;
                margin-top: 16px;
            }

            /* ====== 窗帘SVG图标 ====== */
            .icon-area {
                grid-area: icon;
                position: relative;
                z-index: 3;
                display: flex;
                align-items: center;
                justify-content: center;
                overflow: visible;
                pointer-events: none;
                margin-top: -10px;
                animation: icon-breathe 3s ease-in-out infinite;
            }

            @keyframes icon-breathe {
                0%, 100% { transform: scale(1); opacity: 1; }
                50% { transform: scale(0.96); opacity: 0.75; }
            }

            /* ====== 副按钮区域 ====== */
            .sub-area {
                grid-area: sub;
                display: flex;
                align-items: center;
                justify-content: space-between;
                padding: 0 8px;
                margin-top: -10px;
            }

            .ctrl-btn {
                background: var(--btn-bg, rgb(230,230,230));
                border: none;
                border-radius: 5px;
                width: 44px;
                height: 22px;
                display: flex;
                align-items: center;
                justify-content: center;
                cursor: pointer;
                padding: 0;
                transition: opacity 0.15s;
            }
            .ctrl-btn:active {
                opacity: 0.7;
            }
            .ctrl-btn ha-icon {
                --mdc-icon-size: 16px;
                color: var(--btn-fg, rgb(80,80,80));
            }

            /* ====== 百分比状态 ====== */
            .status-area {
                grid-area: status;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 16px;
                font-weight: bold;
                white-space: nowrap;
                margin-top: -10px;
            }
        `;
    }

    render() {
        if (!this.hass || !this.config.entity) return html``;

        const ent = this.hass.states[this.config.entity];
        if (!ent) return html`<div style="padding:8px;">实体未找到: ${this.config.entity}</div>`;

        const state = ent.state;
        const pos = ent.attributes?.current_position ?? 0;
        const fname = ent.attributes?.friendly_name || '-';
        const theme = this._evaluateTheme();
        const dark = theme === 'dark';
        const fg = dark ? 'rgb(255,255,255)' : 'rgb(50,50,50)';
        const bg = dark ? 'rgb(50,50,50)' : 'rgb(255,255,255)';
        const bbg = dark ? 'rgb(80,80,80)' : 'rgb(230,230,230)';
        const bfg = dark ? 'rgb(230,230,230)' : 'rgb(80,80,80)';
        const ac = this.config.accentColor || 'rgb(4,211,233)';
        const trk = dark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.1)';

        // 背景渐变
        let bgs = 'transparent';
        if (state === 'open' || state === 'opening' || state === 'closing') {
            bgs = 'linear-gradient(90deg, ' + ac + ' -50%, ' + bg + ' 50%)';
        } else if (state === 'closed') {
            bgs = bg;
        }

        // 汉字状态
        let hanzi = fname;
        if (state === 'open') hanzi = '已打开';
        else if (state === 'closed') hanzi = '已关闭';

        const ptxt = (typeof pos === 'number') ? pos + '%' : '--';

        // 滑块显示值：拖拽时用本地值，否则用实体值
        if (!this._isSliderDragging && !this._sliderJustReleased) {
            this._localSliderValue = (typeof pos === 'number') ? pos : 0;
        }

        return html`
            <div class="card" style="background:${bg};color:${fg};
                --accent-clr:${ac};--track-bg:${trk};--btn-bg:${bbg};--btn-fg:${bfg};">

                <div class="bg-clip">
                    <div class="bg-layer" style="background:${bgs};"></div>
                </div>

                <div class="content">
                    <!-- 名称 -->
                    <div class="name-area">${fname}</div>

                    <!-- Sun 滑块 -->
                    <div class="slider-area">
                        <div class="sun-slider-container">
                            <div class="sun-slider-track" id="sun-slider-track"
                                style="background: ${trk};"
                                @click=${this._onSliderTrackClick}>
                                <div class="sun-slider-bar" id="sun-slider-bar" style="background: ${ac};"></div>
                                <div class="sun-slider-thumb" id="sun-slider-thumb" @pointerdown=${this._onSliderPointerDown}></div>
                            </div>
                        </div>
                    </div>

                    <!-- 汉字 -->
                    <div class="hanzi-area">${hanzi}</div>

                    <!-- 窗帘SVG图标 -->
                    <div class="icon-area" id="icon-host"></div>

                    <!-- 控制按钮 -->
                    <div class="sub-area">
                        <button class="ctrl-btn" @click=${this._doOpen} title="打开">
                            <ha-icon icon="mdi:arrow-expand-horizontal"></ha-icon>
                        </button>
                        <button class="ctrl-btn" @click=${this._doStop} title="停止">
                            <ha-icon icon="mdi:stop"></ha-icon>
                        </button>
                        <button class="ctrl-btn" @click=${this._doClose} title="关闭">
                            <ha-icon icon="mdi:arrow-collapse-horizontal"></ha-icon>
                        </button>
                    </div>

                    <!-- 百分比 -->
                    <div class="status-area">${ptxt}</div>
                </div>
            </div>
        `;
    }

    firstUpdated() {
        this._injectIconSVG();
    }

    updated(changedProps) {
        super.updated(changedProps);
        // 同步本地slider值
        if (changedProps.has('hass') && !this._isSliderDragging && !this._sliderJustReleased) {
            const ent = this.hass?.states?.[this.config.entity];
            if (ent) {
                this._localSliderValue = ent.attributes?.current_position ?? 0;
            }
        }
        if (changedProps.has('hass') && this._sliderJustReleased) {
            const ent = this.hass?.states?.[this.config.entity];
            if (ent) {
                const newVal = ent.attributes?.current_position ?? 0;
                if (newVal === this._localSliderValue) {
                    this._sliderJustReleased = false;
                }
            }
        }

        // SVG图标注入：状态变化时重新生成
        if (changedProps.has('hass') || changedProps.has('config')) {
            this._injectIconSVG();
        }

        // 更新滑块位置
        if (!this._isSliderDragging) {
            this._updateSliderPosition(this._localSliderValue);
        }
    }

    // 根据位置更新窗帘图标（统一入口）
    _updateCurtainIcon(pos) {
        // 三种视觉状态：0-1%关闭静态, 99-100%打开静态, 2-98%按比例显示
        let visualKey;
        if (pos <= 1) visualKey = 'closed';
        else if (pos >= 99) visualKey = 'open';
        else visualKey = 'partial';

        // 避免不必要的重建
        if (visualKey === 'closed' || visualKey === 'open') {
            if (visualKey === this._lastIconState) return;
        } else {
            if (this._lastIconState === 'partial' && pos === this._lastPartialPos) return;
        }
        this._lastIconState = visualKey;
        this._lastPartialPos = pos;

        const theme = this._evaluateTheme();
        const ac = this.config.accentColor || 'rgb(4,211,233)';
        const dark = theme === 'dark';

        const svgStr = this._buildCurtainSVG(visualKey, ac, dark, pos);
        const host = this.shadowRoot?.getElementById('icon-host');
        if (host) {
            host.innerHTML = svgStr;
        }
    }

    // 注入SVG图标 - hass变化时调用，从实体读取位置
    _injectIconSVG() {
        const ent = this.hass?.states?.[this.config.entity];
        if (!ent) return;
        const pos = ent.attributes?.current_position ?? 0;
        this._updateCurtainIcon(pos);
    }

    // 统一更新滑块视觉位置
    _updateSliderPosition(value) {
        const track = this.shadowRoot?.getElementById('sun-slider-track');
        if (!track) return;
        const bar = track.querySelector('.sun-slider-bar');
        const thumb = track.querySelector('.sun-slider-thumb');
        const trackW = track.getBoundingClientRect().width;
        if (trackW <= 0) return;
        const thumbHalf = 8;
        const clampedLeft = thumbHalf + (value / 100) * (trackW - thumbHalf * 2);
        if (bar) bar.style.width = `${clampedLeft}px`;
        if (thumb) thumb.style.left = `${clampedLeft}px`;
    }

    // ====== 滑块交互 ======
    _onSliderTrackClick(e) {
        if (this._justDragged) {
            this._justDragged = false;
            return;
        }
        this._sliderUpdateValueFromEvent(e);
        this._updateCurtainIcon(this._localSliderValue);
        this._sliderCallService();
    }

    _onSliderPointerDown(e) {
        e.preventDefault();
        this._isSliderDragging = true;
        this._sliderUpdateValueFromEvent(e);

        const onMove = (ev) => {
            if (!this._isSliderDragging) return;
            this._sliderUpdateValueFromEvent(ev);
        };

        const onUp = () => {
            if (!this._isSliderDragging) return;
            this._isSliderDragging = false;
            this._sliderJustReleased = true;
            this._justDragged = true;
            window.removeEventListener('pointermove', onMove);
            window.removeEventListener('pointerup', onUp);
            window.removeEventListener('pointercancel', onUp);
            this._sliderCallService();
        };

        window.addEventListener('pointermove', onMove);
        window.addEventListener('pointerup', onUp);
        window.addEventListener('pointercancel', onUp);
    }

    _sliderUpdateValueFromEvent(e) {
        const track = this.shadowRoot?.getElementById('sun-slider-track');
        if (!track) return;
        const rect = track.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const ratio = Math.max(0, Math.min(1, x / rect.width));
        const value = Math.round(ratio * 100);
        this._localSliderValue = value;

        // 拖动时实时更新图标
        this._updateCurtainIcon(value);

        const bar = track.querySelector('.sun-slider-bar');
        const thumb = track.querySelector('.sun-slider-thumb');
        const thumbHalf = 8;
        const trackW = rect.width;
        const clampedLeft = thumbHalf + (value / 100) * (trackW - thumbHalf * 2);
        if (bar) bar.style.width = `${clampedLeft}px`;
        if (thumb) thumb.style.left = `${clampedLeft}px`;
    }

    _sliderCallService() {
        if (!this.hass) return;
        const pos = this._localSliderValue;
        this.hass.callService('cover', 'set_cover_position', {
            entity_id: this.config.entity,
            position: pos
        });
        this._haptic();
    }

    // ====== 控制按钮 ======
    _doOpen() {
        this.hass.callService('cover', 'open_cover', { entity_id: this.config.entity });
        this._haptic();
    }

    _doClose() {
        this.hass.callService('cover', 'close_cover', { entity_id: this.config.entity });
        this._haptic();
    }

    _doStop() {
        this.hass.callService('cover', 'stop_cover', { entity_id: this.config.entity });
        this._haptic();
    }

    _haptic() {
        const e = new Event('haptic', { bubbles: true, cancelable: false, composed: true });
        e.detail = 'light';
        this.dispatchEvent(e);
    }
}
customElements.define('xiaoshi-cover-card', XiaoshiCoverCard);
