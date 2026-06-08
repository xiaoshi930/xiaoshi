import { LitElement, html, css } from "https://unpkg.com/lit-element@2.4.0/lit-element.js?module";

window.customCards = window.customCards || [];
window.customCards.push({
    type: 'xiaoshi-pad-card',
    name: '消逝卡(平板端)-背景卡',
    description: '消逝卡(平板端)-背景卡'
});

// ==================== 编辑器 ====================
class XiaoshiPadCardEditor extends LitElement {
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
                min-width: 50px;
            }
            .form-row input, .form-row select {
                flex: 1;
                padding: 6px 8px;
                border: 1px solid #ddd;
                border-radius: 4px;
            }
            .size-row {
                display: flex;
                gap: 8px;
                align-items: center;
            }
            .size-row .form-row,
            .size-row .glow-row {
                flex: 0 0 auto;
            }
            .size-row .form-row:first-child {
                flex: 0 0 auto;
            }
            .size-row input[type="text"] {
                width: 80px;
                flex: none;
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
            .color-row {
                display: flex;
                align-items: center;
                gap: 8px;
            }
            .color-row label {
                font-weight: bold;
                white-space: nowrap;
                min-width: 50px;
                font-size: 13px;
            }
            .color-row input[type="color"] {
                width: 40px;
                height: 30px;
                padding: 0;
                border: 1px solid #ddd;
                border-radius: 4px;
                cursor: pointer;
            }
            .color-preview {
                flex: 1;
                height: 30px;
                border-radius: 4px;
                border: 1px solid #ddd;
            }
            .glow-item {
                border: 1px solid #ddd;
                border-radius: 8px;
                padding: 10px;
                display: flex;
                flex-direction: column;
                gap: 6px;
                background: var(--card-background-color, #fff);
            }
            .glow-item-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
            }
            .glow-item-header span {
                font-weight: bold;
                font-size: 13px;
            }
            .glow-remove-btn {
                background: none;
                border: 1px solid #ccc;
                border-radius: 4px;
                cursor: pointer;
                padding: 2px 8px;
                font-size: 12px;
                color: var(--error-color, #db4437);
            }
            .glow-row {
                display: flex;
                align-items: center;
                gap: 6px;
            }
            .glow-row label {
                font-weight: bold;
                white-space: nowrap;
                min-width: 50px;
                font-size: 12px;
            }
            .glow-row input, .glow-row select {
                flex: 1;
                padding: 4px 6px;
                border: 1px solid #ddd;
                border-radius: 4px;
                font-size: 12px;
            }
            .state-colors-textarea {
                width: 100%;
                min-height: 60px;
                padding: 6px 8px;
                border: 1px solid #ddd;
                border-radius: 4px;
                font-size: 12px;
                font-family: monospace;
                resize: vertical;
            }
            .add-glow-btn {
                background: var(--primary-color, #03a9f4);
                color: #fff;
                border: none;
                border-radius: 4px;
                padding: 6px 12px;
                cursor: pointer;
                font-size: 13px;
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

    _rgbToHex(rgb) {
        const match = rgb.match(/(\d+)/g);
        if (!match || match.length < 3) return '#964646';
        return '#' + match.slice(0, 3).map(n => parseInt(n).toString(16).padStart(2, '0')).join('');
    }

    _hexToRgb(hex) {
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);
        return 'rgb(' + r + ',' + g + ',' + b + ')';
    }

    _bgColorChanged(e) {
        this.config = {
            ...this.config,
            bg_color: this._hexToRgb(e.target.value)
        };
        this.dispatchEvent(new CustomEvent('config-changed', {
            detail: { config: this.config },
            bubbles: true,
            composed: true
        }));
    }

    _addLightButton() {
        const btns = [...(this.config.light_buttons || [])];
        btns.push({ entity: '', color: 'rgb(220,130,0)', shape: '圆形', width: '25px', height: '25px', top: '100px', left: '100px' });
        this.config = { ...this.config, light_buttons: btns };
        this.dispatchEvent(new CustomEvent('config-changed', { detail: { config: this.config }, bubbles: true, composed: true }));
    }

    _removeLightButton(index) {
        const btns = [...(this.config.light_buttons || [])];
        btns.splice(index, 1);
        this.config = { ...this.config, light_buttons: btns };
        this.dispatchEvent(new CustomEvent('config-changed', { detail: { config: this.config }, bubbles: true, composed: true }));
    }

    _updateLightButtonField(index, field, value) {
        const btns = [...(this.config.light_buttons || [])];
        btns[index] = { ...btns[index], [field]: value };
        this.config = { ...this.config, light_buttons: btns };
        this.dispatchEvent(new CustomEvent('config-changed', { detail: { config: this.config }, bubbles: true, composed: true }));
    }

    _addDeviceGlow() {
        const glows = [...(this.config.device_glows || [])];
        glows.push({ entity: '', color: 'rgb(33,150,243)', width: '200px', height: '200px', direction: '右下', top: '100px', left: '100px', state_colors: {} });
        this.config = { ...this.config, device_glows: glows };
        this.dispatchEvent(new CustomEvent('config-changed', { detail: { config: this.config }, bubbles: true, composed: true }));
    }

    _removeDeviceGlow(index) {
        const glows = [...(this.config.device_glows || [])];
        glows.splice(index, 1);
        this.config = { ...this.config, device_glows: glows };
        this.dispatchEvent(new CustomEvent('config-changed', { detail: { config: this.config }, bubbles: true, composed: true }));
    }

    _updateDeviceGlowField(index, field, value) {
        const glows = [...(this.config.device_glows || [])];
        glows[index] = { ...glows[index], [field]: value };
        this.config = { ...this.config, device_glows: glows };
        this.dispatchEvent(new CustomEvent('config-changed', { detail: { config: this.config }, bubbles: true, composed: true }));
    }

    _updateDeviceGlowStateColors(index, text) {
        const stateColors = this._parseStateColors(text);
        this._updateDeviceGlowField(index, 'state_colors', stateColors);
    }

    _formatStateColors(stateColors) {
        if (!stateColors || typeof stateColors !== 'object') return '';
        return Object.entries(stateColors).map(([k, v]) => k + ': ' + v).join('\n');
    }

    _parseStateColors(text) {
        const result = {};
        if (!text) return result;
        text.split('\n').forEach(line => {
            const idx = line.indexOf(':');
            if (idx > 0) {
                const key = line.substring(0, idx).trim();
                const val = line.substring(idx + 1).trim();
                if (key && val) result[key] = val;
            }
        });
        return result;
    }

    render() {
        if (!this.hass || !this.config) return html``;
        const c = this.config;
        const bgColor = c.bg_color || 'rgb(150,70,70)';

        const previewStyle = 'background: ' + bgColor;

        return html`
            <div class="form">
                <div class="size-row">
                    <div class="form-row">
                        <label>主题</label>
                        <select name="theme" @change="${this._valueChanged}">
                            <option value="sun" .selected="${c.theme === 'sun' || !c.theme}">跟随sun</option>
                            <option value="light" .selected="${c.theme === 'light'}">白天</option>
                            <option value="dark" .selected="${c.theme === 'dark'}">黑天</option>
                        </select>
                    </div>
                    <div class="form-row">
                        <label>宽度</label>
                        <input type="text" name="width" .value="${c.width || '1024px'}" @change="${this._valueChanged}" placeholder="1024px">
                    </div>
                    <div class="form-row">
                        <label>高度</label>
                        <input type="text" name="height" .value="${c.height || '768px'}" @change="${this._valueChanged}" placeholder="768px">
                    </div>
                </div>
                <div class="color-row">
                    <label>背景色</label>
                    <input type="color" .value="${this._rgbToHex(bgColor)}" @change="${this._bgColorChanged}">
                    <div class="color-preview" style="${previewStyle}"></div>
                    <label style="font-size:12px;font-weight:normal;display:flex;align-items:center;gap:4px;white-space:nowrap;">
                        <input type="checkbox" name="auto_color" .checked="${c.auto_color !== false}" @change="${this._valueChanged}"> 自动变色
                    </label>
                </div>
                <div class="form-row">
                    <label>背景图片</label>
                    <input type="text" name="background_image" .value="${c.background_image || ''}" @change="${this._valueChanged}" placeholder="/local/UI/背景/彩平图.png">
                </div>
                <div class="form-row">
                    <label>按钮区Left</label>
                    <input type="text" name="btn_area_left" .value="${c.btn_area_left || '20px'}" @change="${this._valueChanged}" placeholder="20px">
                </div>
                <div class="card-section">
                    <div class="card-section-title">灯光按钮</div>
                    ${(c.light_buttons || []).map((btn, i) => html`
                        <div class="glow-item">
                            <div class="glow-item-header">
                                <span>灯光 ${i + 1}</span>
                                <button class="glow-remove-btn" @click="${() => this._removeLightButton(i)}">删除</button>
                            </div>
                            <div class="glow-row">
                                <label>实体</label>
                                <input type="text" .value="${btn.entity || ''}" @change="${(e) => this._updateLightButtonField(i, 'entity', e.target.value)}" placeholder="light.xxx">
                            </div>
                            <div class="glow-row">
                                <label>颜色</label>
                                <input type="color" .value="${this._rgbToHex(btn.color || 'rgb(220,130,0)')}" @change="${(e) => this._updateLightButtonField(i, 'color', this._hexToRgb(e.target.value))}">
                                <label style="font-weight:bold;font-size:12px;white-space:nowrap;min-width:auto;margin-left:8px;">形状</label>
                                <select @change="${(e) => this._updateLightButtonField(i, 'shape', e.target.value)}">
                                    ${[,'横线','竖线','圆形','圆形内十字','圆形外十字','圆形内X字','圆形外X字','方形','方形内十字','方形外十字','方形内X字','方形外X字','六边形1','六边形2','心形','月亮形','五角星形','六角星形'].map(s => html`<option value="${s}" ?selected="${(btn.shape || '圆形') === s}">${s}</option>`)}
                                </select>
                            </div>
                            <div class="size-row">
                                <div class="glow-row">
                                    <label>宽</label>
                                    <input type="text" .value="${btn.width || '25px'}" @change="${(e) => this._updateLightButtonField(i, 'width', e.target.value)}">
                                </div>
                                <div class="glow-row">
                                    <label>高</label>
                                    <input type="text" .value="${btn.height || '25px'}" @change="${(e) => this._updateLightButtonField(i, 'height', e.target.value)}">
                                </div>
                            </div>
                            <div class="size-row">
                                <div class="glow-row">
                                    <label>Top</label>
                                    <input type="text" .value="${btn.top || '100px'}" @change="${(e) => this._updateLightButtonField(i, 'top', e.target.value)}">
                                </div>
                                <div class="glow-row">
                                    <label>Left</label>
                                    <input type="text" .value="${btn.left || '100px'}" @change="${(e) => this._updateLightButtonField(i, 'left', e.target.value)}">
                                </div>
                            </div>
                        </div>
                    `)}
                    <button class="add-glow-btn" @click="${this._addLightButton}">+ 添加灯光按钮</button>
                </div>
                <div class="card-section">
                    <div class="card-section-title">设备光效</div>
                    ${(c.device_glows || []).map((glow, i) => html`
                        <div class="glow-item">
                            <div class="glow-item-header">
                                <span>设备 ${i + 1}</span>
                                <button class="glow-remove-btn" @click="${() => this._removeDeviceGlow(i)}">删除</button>
                            </div>
                            <div class="glow-row">
                                <label>实体</label>
                                <input type="text" .value="${glow.entity || ''}" @change="${(e) => this._updateDeviceGlowField(i, 'entity', e.target.value)}" placeholder="climate.xxx">
                            </div>
                            <div class="size-row">
                                <div class="glow-row">
                                    <label>颜色</label>
                                    <input type="color" .value="${this._rgbToHex(glow.color || 'rgb(33,150,243)')}" @change="${(e) => this._updateDeviceGlowField(i, 'color', this._hexToRgb(e.target.value))}">
                                </div>
                                <div class="glow-row">
                                    <label>方向</label>
                                    <select @change="${(e) => this._updateDeviceGlowField(i, 'direction', e.target.value)}">
                                        ${['左上','左下','右上','右下','上','下','左','右','四周'].map(d => html`
                                            <option value="${d}" ?selected="${(glow.direction || '右下') === d}">${d}</option>
                                        `)}
                                    </select>
                                </div>
                            </div>
                            <div class="size-row">
                                <div class="glow-row">
                                    <label>宽</label>
                                    <input type="text" .value="${glow.width || '200px'}" @change="${(e) => this._updateDeviceGlowField(i, 'width', e.target.value)}">
                                </div>
                                <div class="glow-row">
                                    <label>高</label>
                                    <input type="text" .value="${glow.height || '200px'}" @change="${(e) => this._updateDeviceGlowField(i, 'height', e.target.value)}">
                                </div>
                            </div>
                            <div class="size-row">
                                <div class="glow-row">
                                    <label>Top</label>
                                    <input type="text" .value="${glow.top || '100px'}" @change="${(e) => this._updateDeviceGlowField(i, 'top', e.target.value)}">
                                </div>
                                <div class="glow-row">
                                    <label>Left</label>
                                    <input type="text" .value="${glow.left || '100px'}" @change="${(e) => this._updateDeviceGlowField(i, 'left', e.target.value)}">
                                </div>
                            </div>
                            <div class="glow-row">
                                <label>状态颜色</label>
                                <textarea class="state-colors-textarea" .value="${this._formatStateColors(glow.state_colors)}" @change="${(e) => this._updateDeviceGlowStateColors(i, e.target.value)}" placeholder="cool: rgb(33,150,243)&#10;heat: rgb(254,111,33)"></textarea>
                            </div>
                        </div>
                    `)}
                    <button class="add-glow-btn" @click="${this._addDeviceGlow}">+ 添加设备光效</button>
                </div>

            </div>
        `;
    }
}
customElements.define('xiaoshi-pad-card-editor', XiaoshiPadCardEditor);

// ==================== 主卡片 ====================
class XiaoshiPadCard extends LitElement {
  static get properties() {
    return {
      hass: Object,
      config: Object,
      _kioskOn: { type: Boolean },
      _themeOverride: { type: String }
    };
  }

  static get styles() {
    return css`
      :host {
        display: block;
      }
      .container {
        position: relative;
        display: block;
        overflow: hidden;
      }
      .bg-image {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background-size: cover;
        background-position: center;
        background-repeat: no-repeat;
        pointer-events: none;
        z-index: 1;
      }
      .device-glow {
        position: absolute;
        pointer-events: none;
        z-index: 2;
      }
      .light-btn {
        position: absolute;
        z-index: 10;
        border: none;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 0;
        transition: opacity 0.3s, box-shadow 0.3s;
        transform: translate(-50%, -50%);
      }
      .light-btn:active {
        transform: translate(-50%, -50%) scale(0.92);
      }
      .btn-area {
        position: absolute;
        top: 8px;
        display: flex;
        gap: 6px;
        z-index: 20;
      }
      .ctrl-btn {
        width: 32px;
        height: 32px;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: none;
        border: none;
        background: var(--btn-bg, rgba(0,0,0,0.3));
        backdrop-filter: blur(6px);
        -webkit-backdrop-filter: blur(6px);
        border-radius: 8px;
        font-size: 18px;
        padding: 0;
        transition: opacity 0.2s;
      }
      .ctrl-btn:active {
        box-shadow: 0 2px 12px rgba(255,255,255,0.4), 0 2px 8px rgba(0,0,0,0.4);
        transform: scale(0.95);
      }
      .ctrl-btn ha-icon {
        --mdi-icon-size: 18px;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 18px;
        height: 18px;
        line-height: 1;
      }
      .ctrl-btn ha-icon svg {
        width: 18px;
        height: 18px;
        display: block;
      }
    `;
  }

  static getConfigElement() {
    return document.createElement('xiaoshi-pad-card-editor');
  }

  constructor() {
    super();
    this._kioskOn = true;
    this._kioskWasOn = false;
    this._blockToggleMenu = null;
    this._themeOverride = null;
    this._hueShift = 0;
    this._autoColorTimer = null;
  }

  connectedCallback() {
    super.connectedCallback();
    this._startAutoColorTimer();
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this._stopAutoColorTimer();
    this._applyKioskMode(false);
  }

  _startAutoColorTimer() {
    this._stopAutoColorTimer();
    this._autoColorTimer = setInterval(() => {
      this._hueShift = (this._hueShift + 6) % 360;
      this.requestUpdate();
    }, 60000);
  }

  _stopAutoColorTimer() {
    if (this._autoColorTimer) {
      clearInterval(this._autoColorTimer);
      this._autoColorTimer = null;
    }
  }

  // ========== 颜色工具 ==========
  _rgbToHsl(r, g, b) {
    r /= 255; g /= 255; b /= 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h, s, l = (max + min) / 2;
    if (max === min) {
      h = s = 0;
    } else {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      switch (max) {
        case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
        case g: h = ((b - r) / d + 2) / 6; break;
        case b: h = ((r - g) / d + 4) / 6; break;
      }
    }
    return [Math.round(h * 360), Math.round(s * 100), Math.round(l * 100)];
  }

  _hslToRgb(h, s, l) {
    h /= 360; s /= 100; l /= 100;
    let r, g, b;
    if (s === 0) {
      r = g = b = l;
    } else {
      const hue2rgb = (p, q, t) => {
        if (t < 0) t += 1;
        if (t > 1) t -= 1;
        if (t < 1/6) return p + (q - p) * 6 * t;
        if (t < 1/2) return q;
        if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
        return p;
      };
      const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
      const p = 2 * l - q;
      r = hue2rgb(p, q, h + 1/3);
      g = hue2rgb(p, q, h);
      b = hue2rgb(p, q, h - 1/3);
    }
    return 'rgb(' + Math.round(r * 255) + ',' + Math.round(g * 255) + ',' + Math.round(b * 255) + ')';
  }

  _shiftHue(rgbStr, shift) {
    const match = rgbStr.match(/(\d+)/g);
    if (!match || match.length < 3) return rgbStr;
    const [h, s, l] = this._rgbToHsl(parseInt(match[0]), parseInt(match[1]), parseInt(match[2]));
    return this._hslToRgb((h + shift) % 360, s, l);
  }

  updated(changedProps) {
    if (super.updated) super.updated(changedProps);
    const isKiosk = this._kioskOn;
    if (isKiosk !== this._kioskWasOn) {
      this._kioskWasOn = isKiosk;
      this._applyKioskMode(isKiosk);
    }
  }

  // ========== Kiosk模式（移植自phone-card） ==========
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
        if (huiRootSR && !huiRootSR.querySelector('#xiaoshi-pad-kiosk-header-style')) {
          const style = document.createElement('style');
          style.id = 'xiaoshi-pad-kiosk-header-style';
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
        if (drawerSR && !drawerSR.querySelector('#xiaoshi-pad-kiosk-sidebar-style')) {
          const style = document.createElement('style');
          style.id = 'xiaoshi-pad-kiosk-sidebar-style';
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
        const toolbar = huiRootSR?.querySelector('.toolbar');
        if (toolbar && !toolbar.querySelector('#xiaoshi-pad-kiosk-menubutton-style')) {
          const style = document.createElement('style');
          style.id = 'xiaoshi-pad-kiosk-menubutton-style';
          style.textContent = `ha-menu-button { display: none !important; }`;
          toolbar.appendChild(style);
        }
        if (!this._blockToggleMenu) {
          this._blockToggleMenu = (e) => { e.preventDefault(); e.stopImmediatePropagation(); };
          main.addEventListener('hass-toggle-menu', this._blockToggleMenu, true);
        }
      } else {
        huiRootSR?.querySelector('#xiaoshi-pad-kiosk-header-style')?.remove();
        drawerSR?.querySelector('#xiaoshi-pad-kiosk-sidebar-style')?.remove();
        const toolbar = huiRootSR?.querySelector('.toolbar');
        toolbar?.querySelector('#xiaoshi-pad-kiosk-menubutton-style')?.remove();
        if (this._blockToggleMenu) {
          main.removeEventListener('hass-toggle-menu', this._blockToggleMenu, true);
          this._blockToggleMenu = null;
        }
      }
    } catch (e) {
      console.error('[xiaoshi-pad-card] kiosk mode error:', e);
    }
  }

  _toggleFullscreen() {
    this._kioskOn = !this._kioskOn;
    this.requestUpdate();
  }

  _handleFullscreen() {
    this._handleHaptic();
    this._toggleFullscreen();
  }

  _handleHaptic() {
    const hapticEvent = new Event('haptic', {
      bubbles: true,
      cancelable: false,
      composed: true
    });
    hapticEvent.detail = 'light';
    this.dispatchEvent(hapticEvent);
  }

  // ========== 主题计算（基于sun.sun） ==========
  _evaluateTheme() {
    try {
      const mode = this.config ? this.config.theme : 'sun';
      let result;

      if (this._themeOverride) {
        result = this._themeOverride;
      } else if (mode === 'light') {
        result = 'light';
      } else if (mode === 'dark') {
        result = 'dark';
      } else {
        // sun 模式：根据 sun.sun 实体计算
        if (this.hass && this.hass.states) {
          const sunState = this.hass.states['sun.sun'];
          if (sunState) {
            const state = sunState.state;
            // above_horizon = 白天(light), below_horizon = 黑天(dark)
            // 日落后(below_horizon)是dark，日落前(above_horizon)是light
            result = state === 'above_horizon' ? 'light' : 'dark';
          } else {
            result = 'light';
          }
        } else {
          result = 'light';
        }
      }

      // 注册全局 theme() 函数
      window.theme = () => result;
      return result;
    } catch (e) {
      window.theme = () => 'light';
      return 'light';
    }
  }

  _toggleTheme() {
    this._handleHaptic();
    const mode = this.config ? this.config.theme : 'sun';
    if (mode === 'sun') {
      // 自动 → 白 → 黑 → 自动
      if (this._themeOverride === null) {
        this._themeOverride = 'light';
      } else if (this._themeOverride === 'light') {
        this._themeOverride = 'dark';
      } else {
        this._themeOverride = null;
      }
    } else {
      // 白 ↔ 黑
      const current = this._evaluateTheme();
      this._themeOverride = current === 'light' ? 'dark' : 'light';
    }
    // 实时更新全局 theme()
    this._evaluateTheme();
    this.requestUpdate();
  }

  setConfig(config) {
    this.config = {
      width: config.width || '1024px',
      height: config.height || '768px',
      theme: config.theme || 'sun',
      bg_color: config.bg_color || 'rgb(150,70,70)',
      auto_color: config.auto_color !== false,
      background_image: config.background_image || '',
      device_glows: config.device_glows || [],
      light_buttons: config.light_buttons || [],
      btn_area_left: config.btn_area_left || '20px',
    };
  }

  set hass(hass) {
    this._hass = hass;
    this.requestUpdate();
  }

  get hass() {
    return this._hass;
  }

  // ========== 灯光按钮 ==========
  _toggleLight(entityId) {
    if (!this.hass || !entityId) return;
    this._handleHaptic();
    this.hass.callService('light', 'toggle', { entity_id: entityId });
  }

  _renderLightButtons() {
    if (!this.hass) return '';
    return (this.config.light_buttons || []).map(item => {
      if (!item.entity) return '';
      const entity = this.hass.states[item.entity];
      if (!entity) return '';
      const isOn = entity.state === 'on';
      const color = item.color || 'rgb(220,130,0)';
      const shape = item.shape || '圆形';
      const posSize = `top: ${item.top || '100px'}; left: ${item.left || '100px'}; width: ${item.width || '25px'}; height: ${item.height || '25px'};`;
      let btnStyle = posSize;
      if (shape === '圆形') {
        btnStyle += ' border-radius: 50%;';
        if (isOn) {
          btnStyle += ` background: ${color}; border: 2px solid #fff; box-shadow: 0 0 7px 3px ${color};`;
        } else {
          btnStyle += ` background: transparent; border: 2px solid #fff;`;
        }
      } else if (shape === '方形') {
        btnStyle += ' border-radius: 0;';
        if (isOn) {
          btnStyle += ` background: ${color}; border: 2px solid #fff; box-shadow: 0 0 7px 3px ${color};`;
        } else {
          btnStyle += ` background: transparent; border: 2px solid #fff;`;
        }
      } else if (shape === '圆形内十字') {
        btnStyle += ' border-radius: 50%; overflow: hidden;';
        if (isOn) {
          btnStyle += ` background: ${color}; border: 2px solid #fff; box-shadow: 0 0 7px 3px ${color};`;
        } else {
          btnStyle += ` background: transparent; border: 2px solid #fff;`;
        }
        return html`<button class="light-btn ${isOn ? 'on' : 'off'}" style="${btnStyle}" @click="${() => this._toggleLight(item.entity)}" title="${item.entity}">
          <div style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);width:100%;height:2px;background:#fff;"></div>
          <div style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);width:2px;height:100%;background:#fff;"></div>
        </button>`;
      } else if (shape === '圆形外十字') {
        btnStyle += ' border-radius: 50%; overflow: visible;';
        if (isOn) {
          btnStyle += ` background: ${color}; border: 2px solid #fff; box-shadow: 0 0 7px 3px ${color};`;
        } else {
          btnStyle += ` background: transparent; border: 2px solid #fff;`;
        }
        return html`<button class="light-btn ${isOn ? 'on' : 'off'}" style="${btnStyle}" @click="${() => this._toggleLight(item.entity)}" title="${item.entity}">
          <div style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);width:160%;height:2px;background:#fff;"></div>
          <div style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);width:2px;height:160%;background:#fff;"></div>
        </button>`;
      } else if (shape === '圆形内X字') {
        btnStyle += ' border-radius: 50%; overflow: hidden;';
        if (isOn) {
          btnStyle += ` background: ${color}; border: 2px solid #fff; box-shadow: 0 0 7px 3px ${color};`;
        } else {
          btnStyle += ` background: transparent; border: 2px solid #fff;`;
        }
        return html`<button class="light-btn ${isOn ? 'on' : 'off'}" style="${btnStyle}" @click="${() => this._toggleLight(item.entity)}" title="${item.entity}">
          <div style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%) rotate(45deg);width:142%;height:2px;background:#fff;"></div>
          <div style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%) rotate(-45deg);width:142%;height:2px;background:#fff;"></div>
        </button>`;
      } else if (shape === '圆形外X字') {
        btnStyle += ' border-radius: 50%; overflow: visible;';
        if (isOn) {
          btnStyle += ` background: ${color}; border: 2px solid #fff; box-shadow: 0 0 7px 3px ${color};`;
        } else {
          btnStyle += ` background: transparent; border: 2px solid #fff;`;
        }
        return html`<button class="light-btn ${isOn ? 'on' : 'off'}" style="${btnStyle}" @click="${() => this._toggleLight(item.entity)}" title="${item.entity}">
          <div style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%) rotate(45deg);width:160%;height:2px;background:#fff;"></div>
          <div style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%) rotate(-45deg);width:160%;height:2px;background:#fff;"></div>
        </button>`;
      } else if (shape === '方形内十字') {
        btnStyle += ' border-radius: 0; overflow: hidden;';
        if (isOn) {
          btnStyle += ` background: ${color}; border: 2px solid #fff; box-shadow: 0 0 7px 3px ${color};`;
        } else {
          btnStyle += ` background: transparent; border: 2px solid #fff;`;
        }
        return html`<button class="light-btn ${isOn ? 'on' : 'off'}" style="${btnStyle}" @click="${() => this._toggleLight(item.entity)}" title="${item.entity}">
          <div style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);width:100%;height:2px;background:#fff;"></div>
          <div style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);width:2px;height:100%;background:#fff;"></div>
        </button>`;
      } else if (shape === '方形外十字') {
        btnStyle += ' border-radius: 0; overflow: visible;';
        if (isOn) {
          btnStyle += ` background: ${color}; border: 2px solid #fff; box-shadow: 0 0 7px 3px ${color};`;
        } else {
          btnStyle += ` background: transparent; border: 2px solid #fff;`;
        }
        return html`<button class="light-btn ${isOn ? 'on' : 'off'}" style="${btnStyle}" @click="${() => this._toggleLight(item.entity)}" title="${item.entity}">
          <div style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);width:160%;height:2px;background:#fff;"></div>
          <div style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);width:2px;height:160%;background:#fff;"></div>
        </button>`;
      } else if (shape === '方形内X字') {
        btnStyle += ' border-radius: 0; overflow: hidden;';
        if (isOn) {
          btnStyle += ` background: ${color}; border: 2px solid #fff; box-shadow: 0 0 7px 3px ${color};`;
        } else {
          btnStyle += ` background: transparent; border: 2px solid #fff;`;
        }
        return html`<button class="light-btn ${isOn ? 'on' : 'off'}" style="${btnStyle}" @click="${() => this._toggleLight(item.entity)}" title="${item.entity}">
          <div style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%) rotate(45deg);width:142%;height:2px;background:#fff;"></div>
          <div style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%) rotate(-45deg);width:142%;height:2px;background:#fff;"></div>
        </button>`;
      } else if (shape === '方形外X字') {
        btnStyle += ' border-radius: 0; overflow: visible;';
        if (isOn) {
          btnStyle += ` background: ${color}; border: 2px solid #fff; box-shadow: 0 0 7px 3px ${color};`;
        } else {
          btnStyle += ` background: transparent; border: 2px solid #fff;`;
        }
        return html`<button class="light-btn ${isOn ? 'on' : 'off'}" style="${btnStyle}" @click="${() => this._toggleLight(item.entity)}" title="${item.entity}">
          <div style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%) rotate(45deg);width:200%;height:2px;background:#fff;"></div>
          <div style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%) rotate(-45deg);width:200%;height:2px;background:#fff;"></div>
        </button>`;
      } else if (shape === '五角星形') {
        btnStyle += ' overflow: visible;';
        if (isOn) {
          btnStyle += ` background: transparent; filter: drop-shadow(0 0 7px ${color}) drop-shadow(0 0 3px ${color});`;
        } else {
          btnStyle += ` background: transparent;`;
        }
        return html`<button class="light-btn ${isOn ? 'on' : 'off'}" style="${btnStyle}" @click="${() => this._toggleLight(item.entity)}" title="${item.entity}">
          <svg viewBox="0 0 100 100" style="width:100%;height:100%;display:block;" preserveAspectRatio="none">
            <polygon points="50,5 61,35 95,35 68,57 79,91 50,70 21,91 32,57 5,35 39,35"
              fill="${isOn ? color : 'transparent'}" stroke="#fff" stroke-width="5"/>
          </svg>
        </button>`;
      } else if (shape === '六边形1') {
        btnStyle += ' overflow: visible;';
        if (isOn) {
          btnStyle += ` background: transparent; filter: drop-shadow(0 0 7px ${color}) drop-shadow(0 0 3px ${color});`;
        } else {
          btnStyle += ` background: transparent;`;
        }
        return html`<button class="light-btn ${isOn ? 'on' : 'off'}" style="${btnStyle}" @click="${() => this._toggleLight(item.entity)}" title="${item.entity}">
          <svg viewBox="0 0 100 100" style="width:100%;height:100%;display:block;" preserveAspectRatio="none">
            <polygon points="50,2 93,27 93,73 50,98 7,73 7,27"
              fill="${isOn ? color : 'transparent'}" stroke="#fff" stroke-width="5"/>
          </svg>
        </button>`;
      } else if (shape === '六边形2') {
        btnStyle += ' overflow: visible;';
        if (isOn) {
          btnStyle += ` background: transparent; filter: drop-shadow(0 0 7px ${color}) drop-shadow(0 0 3px ${color});`;
        } else {
          btnStyle += ` background: transparent;`;
        }
        return html`<button class="light-btn ${isOn ? 'on' : 'off'}" style="${btnStyle}" @click="${() => this._toggleLight(item.entity)}" title="${item.entity}">
          <svg viewBox="0 0 100 100" style="width:100%;height:100%;display:block;" preserveAspectRatio="none">
            <polygon points="50,2 93,27 93,73 50,98 7,73 7,27"
              fill="${isOn ? color : 'transparent'}" stroke="#fff" stroke-width="5" transform="rotate(30,50,50)"/>
          </svg>
        </button>`;
      } else if (shape === '六角星形') {
        btnStyle += ' overflow: visible;';
        if (isOn) {
          btnStyle += ` background: transparent; filter: drop-shadow(0 0 7px ${color}) drop-shadow(0 0 3px ${color});`;
        } else {
          btnStyle += ` background: transparent;`;
        }
        return html`<button class="light-btn ${isOn ? 'on' : 'off'}" style="${btnStyle}" @click="${() => this._toggleLight(item.entity)}" title="${item.entity}">
          <svg viewBox="0 0 100 100" style="width:100%;height:100%;display:block;" preserveAspectRatio="none">
            <polygon points="50,2 64,26 92,26 78,50 92,74 64,74 50,98 36,74 8,74 22,50 8,26 36,26"
              fill="${isOn ? color : 'transparent'}" stroke="#fff" stroke-width="4"/>
          </svg>
        </button>`;
      } else if (shape === '心形') {
        btnStyle += ' overflow: visible;';
        if (isOn) {
          btnStyle += ` background: transparent; filter: drop-shadow(0 0 7px ${color}) drop-shadow(0 0 3px ${color});`;
        } else {
          btnStyle += ` background: transparent;`;
        }
        return html`<button class="light-btn ${isOn ? 'on' : 'off'}" style="${btnStyle}" @click="${() => this._toggleLight(item.entity)}" title="${item.entity}">
          <svg viewBox="0 0 100 100" style="width:100%;height:100%;display:block;" preserveAspectRatio="none">
            <path d="M50,88 C20,65 2,45 2,28 C2,12 14,2 28,2 C38,2 46,8 50,16 C54,8 62,2 72,2 C86,2 98,12 98,28 C98,45 80,65 50,88Z"
              fill="${isOn ? color : 'transparent'}" stroke="#fff" stroke-width="8"/>
          </svg>
        </button>`;
      } else if (shape === '月亮形') {
        btnStyle += ' overflow: visible;';
        if (isOn) {
          btnStyle += ` background: transparent; filter: drop-shadow(0 0 7px ${color}) drop-shadow(0 0 3px ${color});`;
        } else {
          btnStyle += ` background: transparent;`;
        }
        return html`<button class="light-btn ${isOn ? 'on' : 'off'}" style="${btnStyle}" @click="${() => this._toggleLight(item.entity)}" title="${item.entity}">
          <svg viewBox="-45 0 110 100" style="width:100%;height:100%;display:block;" preserveAspectRatio="xMidYMid meet">
            <path d="M55,8 A48,48,0,1,0,55,92 A42,42,0,1,1,55,8Z"
              fill="${isOn ? color : 'transparent'}" stroke="#fff" stroke-width="8"/>
          </svg>
        </button>`;
      } else if (shape === '横线') {
        btnStyle += ' overflow: visible;';
        if (isOn) {
          btnStyle += ` background: transparent; filter: drop-shadow(0 0 7px ${color}) drop-shadow(0 0 3px ${color});`;
        } else {
          btnStyle += ` background: transparent;`;
        }
        return html`<button class="light-btn ${isOn ? 'on' : 'off'}" style="${btnStyle}" @click="${() => this._toggleLight(item.entity)}" title="${item.entity}">
          <svg viewBox="0 0 100 100" style="width:100%;height:100%;display:block;" preserveAspectRatio="none">
            ${isOn ? html`<line x1="0" y1="50" x2="100" y2="50" stroke="${color}" stroke-width="10" stroke-linecap="round"/>` : ''}
            <line x1="0" y1="50" x2="100" y2="50" stroke="#fff" stroke-width="10" stroke-linecap="round"/>
          </svg>
        </button>`;
      } else if (shape === '竖线') {
        btnStyle += ' overflow: visible;';
        if (isOn) {
          btnStyle += ` background: transparent; filter: drop-shadow(0 0 7px ${color}) drop-shadow(0 0 3px ${color});`;
        } else {
          btnStyle += ` background: transparent;`;
        }
        return html`<button class="light-btn ${isOn ? 'on' : 'off'}" style="${btnStyle}" @click="${() => this._toggleLight(item.entity)}" title="${item.entity}">
          <svg viewBox="0 0 100 100" style="width:100%;height:100%;display:block;" preserveAspectRatio="none">
            ${isOn ? html`<line x1="50" y1="0" x2="50" y2="100" stroke="${color}" stroke-width="10" stroke-linecap="round"/>` : ''}
            <line x1="50" y1="0" x2="50" y2="100" stroke="#fff" stroke-width="10" stroke-linecap="round"/>
          </svg>
        </button>`;
      }
      return html`<button class="light-btn ${isOn ? 'on' : 'off'}" style="${btnStyle}" @click="${() => this._toggleLight(item.entity)}" title="${item.entity}"></button>`;
    });
  }

  // ========== 设备光效 ==========
  _directionToPosition(dir) {
    const map = {
      '左上': '0% 0%',
      '左下': '0% 100%',
      '右上': '100% 0%',
      '右下': '100% 100%',
      '上': '50% 0%',
      '下': '50% 100%',
      '左': '0% 50%',
      '右': '100% 50%',
      '四周': 'center'
    };
    return map[dir] || '100% 100%';
  }

  _computeDeviceGlowStyle(item) {
    if (!this.hass || !item.entity) return null;
    const entity = this.hass.states[item.entity];
    if (!entity || entity.state === 'off' || entity.state === 'unknown' || entity.state === 'unavailable') return null;

    const state = entity.state;
    const color = (item.state_colors && item.state_colors[state]) || item.color || 'rgb(33,150,243)';
    const direction = item.direction || '右下';

    if (direction === '四周') {
      return `radial-gradient(ellipse farthest-corner at center, ${color} -60%, rgba(0,0,0,0) 60%)`;
    }
    const position = this._directionToPosition(direction);
    return `radial-gradient(ellipse farthest-corner at ${position}, ${color} -60%, rgba(0,0,0,0) 60%)`;
  }

  // 根据单色自动生成渐变色
  _darkenColor(rgb, factor) {
    const match = rgb.match(/(\d+)/g);
    if (!match || match.length < 3) return 'rgb(0,0,0)';
    const r = Math.round(parseInt(match[0]) * factor);
    const g = Math.round(parseInt(match[1]) * factor);
    const b = Math.round(parseInt(match[2]) * factor);
    return 'rgb(' + r + ',' + g + ',' + b + ')';
  }

  render() {
    const theme = this._evaluateTheme();
    const autoColor = this.config.auto_color !== false;
    let bgColor = this.config.bg_color || 'rgb(150,70,70)';

    // light主题且开启自动变色时，根据时间偏移色相
    if (theme === 'light' && autoColor) {
      bgColor = this._shiftHue(bgColor, this._hueShift);
    }

    // dark主题时使用纯黑，light主题使用自动渐变
    let gradientStyle;
    let color2;
    if (theme === 'dark') {
      gradientStyle = 'rgb(0,0,0)';
      color2 = 'rgb(0,0,0)';
    } else {
      color2 = this._darkenColor(bgColor, 0.4);
      gradientStyle = `linear-gradient(to bottom right, ${bgColor} 20%, ${color2} 100%)`;
    }
    // 注册全局 background() 函数，供子卡片（如 button-card）获取渐变色2
    window.background = () => this._darkenColor(bgColor, 0.75);
    const bgImage = this.config.background_image || '';

    const mode = this.config ? this.config.theme : 'sun';
    // 黑主题：白透明背景；白主题：黑透明背景
    const btnBg = theme === 'dark' ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.3)';
    // 图标根据当前主题状态：自动→theme-light-dark，白→weather-sunny，黑→weather-night
    const isAuto = mode === 'sun' && this._themeOverride === null;
    const themeBtnIcon = isAuto ? 'mdi:theme-light-dark' : (theme === 'dark' ? 'mdi:weather-night' : 'mdi:weather-sunny');
    const themeBtnColor = isAuto ? '#FF9800' : '#fff';

    return html`
      <div class="container"
        style="width: ${this.config.width}; height: ${this.config.height}; background: ${gradientStyle};">
        ${bgImage ? html`<div class="bg-image" style="background-image: url('${bgImage}');"></div>` : ''}
        ${(this.config.device_glows || []).map(item => {
          const glowStyle = this._computeDeviceGlowStyle(item);
          if (!glowStyle) return '';
          return html`<div class="device-glow" style="top: ${item.top || '100px'}; left: ${item.left || '100px'}; width: ${item.width || '200px'}; height: ${item.height || '200px'}; background: ${glowStyle};"></div>`;
        })}
        ${this._renderLightButtons()}
        <div class="btn-area" style="left: ${this.config.btn_area_left || '20px'};">
          <button class="ctrl-btn" style="color: #fff; --btn-bg: ${btnBg}" @click="${this._handleFullscreen}" title="全屏切换">
            <ha-icon icon="${this._kioskOn ? 'mdi:fullscreen-exit' : 'mdi:fullscreen'}"></ha-icon>
          </button>
          <button class="ctrl-btn" style="color: ${themeBtnColor}; --btn-bg: ${btnBg}" @click="${this._toggleTheme}" title="切换主题">
            <ha-icon icon="${themeBtnIcon}"></ha-icon>
          </button>
        </div>
      </div> 
    `;
  }

  getCardSize() {
    return 1;
  }
}
customElements.define('xiaoshi-pad-card', XiaoshiPadCard);