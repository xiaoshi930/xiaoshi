import { LitElement, html, css } from "https://unpkg.com/lit-element@2.4.0/lit-element.js?module";
import { yamlToJson } from '../function/function.js';

window.customCards = window.customCards || [];
window.customCards.push({
    type: 'xiaoshi-top-bar-card',
    name: '消逝卡(平板端)-顶部状态条',
    description: '消逝卡(平板端)-顶部状态条'
});

class XiaoshiTopBarCardEditor extends LitElement {
    static get properties() {
        return {
            hass: Object,
            _config: Object,
        };
    }

    static get styles() {
        return css`
            .editor-container {
                padding: 16px;
                display: flex;
                flex-direction: column;
                gap: 16px;
            }
            .field {
                display: flex;
                flex-direction: column;
                gap: 4px;
            }
            .field label {
                font-size: 12px;
                color: var(--secondary-text-color);
                font-weight: 500;
            }
            .field input, .field select {
                padding: 8px;
                border: 1px solid var(--divider-color);
                border-radius: 4px;
                font-size: 14px;
                background: var(--card-background-color);
                color: var(--primary-text-color);
            }
            .inline-fields {
                display: flex;
                gap: 12px;
            }
            .inline-fields .field {
                flex: 1;
            }
        `;
    }

    setConfig(config) {
        this._config = { ...config };
    }

    _valueChanged(ev) {
        if (!this._config || !this.hass) return;
        const target = ev.target;
        const key = target.getAttribute('configKey');
        if (!key) return;
        let value = target.value;
        const newConfig = { ...this._config };
        if (key === 'cards') {
            newConfig[key] = value || '';
        } else if (value === '' || value === undefined) {
            delete newConfig[key];
        } else {
            newConfig[key] = value;
        }
        this._config = newConfig;
        this.dispatchEvent(new CustomEvent('config-changed', { detail: { config: this._config } }));
    }

    render() {
        if (!this._config) return html``;
        return html`
            <div class="editor-container">
                <div class="inline-fields">
                    <div class="field">
                        <label>宽度</label>
                        <input type="text" .value=${this._config.width || ''} configKey="width" @value-changed=${this._valueChanged} @change=${this._valueChanged} placeholder="400px" />
                    </div>
                    <div class="field">
                        <label>高度</label>
                        <input type="text" .value=${this._config.height || ''} configKey="height" @value-changed=${this._valueChanged} @change=${this._valueChanged} placeholder="32px" />
                    </div>
                </div>
                <div class="inline-fields">
                    <div class="field">
                        <label>圆角</label>
                        <input type="text" .value=${this._config.border_radius || ''} configKey="border_radius" @value-changed=${this._valueChanged} @change=${this._valueChanged} placeholder="8px" />
                    </div>
                    <div class="field">
                        <label>主题</label>
                        <select .value=${this._config.theme || 'theme()'} configKey="theme" @change=${this._valueChanged}>
                            <option value="theme()" ?selected=${!this._config.theme || this._config.theme === 'theme()'}>自动(theme)</option>
                            <option value="light" ?selected=${this._config.theme === 'light'}>浅色</option>
                            <option value="dark" ?selected=${this._config.theme === 'dark'}>深色</option>
                        </select>
                    </div>
                </div>
                <div class="field">
                    <label>👇👇👇按钮卡片配置（YAML格式，支持多组卡片）👇👇👇</label>
                    <textarea
                        .value=${this._config.cards || ''}
                        configKey="cards"
                        @value-changed=${this._valueChanged}
                        @change=${this._valueChanged}
                        placeholder="# 示例1：直接列表写法
- type: custom:button-card
  entity: sensor.temperature
  name: 温度
  icon: mdi:thermometer
- type: custom:button-card
  entity: light.bedroom
  name: 卧室灯
  icon: mdi:lightbulb

# 示例2：cards 包裹写法
cards:
  - type: custom:button-card
    entity: sensor.humidity
    name: 湿度"
                        style="min-height: 120px; resize: vertical; padding: 8px; border: 1px solid var(--divider-color); border-radius: 4px; font-size: 14px; background: var(--card-background-color); color: var(--primary-text-color);"
                    ></textarea>
                </div>
            </div>
        `;
    }
}
customElements.define('xiaoshi-top-bar-card-editor', XiaoshiTopBarCardEditor);

class XiaoshiTopBar extends LitElement {
    static get properties() {
        return {
            hass: Object,
            config: Object,
        };
    }

    static get styles() {
        return css`
            .bar {
                display: flex;
                align-items: center;
                justify-content: space-evenly;
                background: var(--btn-bg, rgba(0,0,0,0.3));
                padding: 0 10px;
                box-sizing: border-box;
            }
            .bar-card {
                flex: 1;
                min-width: 0;
                display: flex;
                align-items: center;
                justify-content: center;
                height: 100%;
            }
        `;
    }

    static getConfigElement() {
        return document.createElement('xiaoshi-top-bar-card-editor');
    }

    static getStubConfig() {
        return {
            width: '400px',
            height: '32px',
            cards: '',
        };
    }

    getCardSize() {
        return 1;
    }

    setConfig(config) {
        this.config = {
            width: config.width || '400px',
            height: config.height || '32px',
            border_radius: config.border_radius || '8px',
            theme: config.theme || 'theme()',
            cards: config.cards || '',
        };
        this._buildCards();
    }

    render() {
        if (!this.config) return html``;
        const theme = this._evaluateTheme();
        const btnBg = theme === 'dark' ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.3)';
        const cards = this._cardElements || [];
        return html`
            <div class="bar" style="width: ${this.config.width}; height: ${this.config.height}; --btn-bg: ${btnBg}; border-radius: ${this.config.border_radius};">
                ${cards.map(el => html`
                    <div class="bar-card">
                        ${el}
                    </div>
                `)}
            </div>
        `;
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

    set hass(hass) {
        this._hass = hass;
        this._propagateHass();
        this.requestUpdate();
    }

    get hass() {
        return this._hass;
    }

    async _createCardElementAsync(cardConfig) {
        if (!cardConfig || !cardConfig.type) return null;
        try {
            const tag = cardConfig.type;
            if (customElements.get(tag)) {
                const el = document.createElement(tag);
                el.setConfig(cardConfig);
                if (this._hass) el.hass = this._hass;
                return el;
            }
            if (window.loadCardHelpers) {
                const helpers = await window.loadCardHelpers();
                const el = await helpers.createCardElement(cardConfig);
                if (this._hass) el.hass = this._hass;
                return el;
            }
            const el = document.createElement('hui-error-card');
            el.setConfig({ type: 'error', error: `Unknown card type: ${tag}`, cardConfig });
            return el;
        } catch (e) {
            console.error('[xiaoshi-top-bar-card] 创建卡片失败:', e, cardConfig);
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
        const cardConfigs = this._parseCardsConfig();
        this._cardElements = (await Promise.all(cardConfigs.map(cfg => this._createCardElementAsync(cfg)))).filter(Boolean);
        this.requestUpdate();
    }

    _propagateHass() {
        if (!this._hass) return;
        if (this._cardElements) {
            this._cardElements.forEach(el => { if (el) el.hass = this._hass; });
        }
    }

    _parseCardsConfig() {
        if (!this.config.cards || !this.config.cards.trim()) return [];
        try {
            const cards = yamlToJson(this.config.cards);
            return cards;
        } catch (error) {
            console.error('解析卡片配置失败:', error);
            return [];
        }
    }
}
customElements.define('xiaoshi-top-bar-card', XiaoshiTopBar);
