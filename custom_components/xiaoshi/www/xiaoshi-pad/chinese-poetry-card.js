import { LitElement, html, css } from "https://unpkg.com/lit-element@2.4.0/lit-element.js?module";

window.customCards = window.customCards || [];
window.customCards.push({
    type: 'xiaoshi-chinese-poetry-card',
    name: '古诗词卡片',
    description: '显示古诗词标题、朝代、作者、正文，支持刷新和播放',
    documentationURL: 'https://github.com/xiaoshi'
});

class ChinesePoetryCardEditor extends LitElement {
    static get properties() {
        return {
            hass: { type: Object },
            _config: { type: Object }
        };
    }

    static get styles() {
        return css`
            :host {
                display: block;
            }
            .option {
                padding: 4px 0;
            }
            .option label {
                display: block;
                font-weight: 500;
                margin-bottom: 4px;
            }
            .option ha-entity-picker {
                display: block;
                width: 100%;
            }
        `;
    }

    setConfig(config) {
        this._config = config;
    }

    configChanged(newConfig) {
        const event = new CustomEvent("config-changed", {
            detail: { config: newConfig },
            bubbles: true,
            composed: true
        });
        this.dispatchEvent(event);
    }

    _valueChanged(ev) {
        if (!this._config || !this.hass) return;
        const target = ev.target;
        const key = target.configKey;
        if (this._config[key] === target.value) return;
        const newConfig = { ...this._config };
        if (target.value === "") {
            delete newConfig[key];
        } else {
            newConfig[key] = target.value;
        }
        this._config = newConfig;
        this.configChanged(newConfig);
    }

    render() {
        if (!this._config) return html``;
        return html`
            <div class="option">
                <label>诗词实体</label>
                <ha-entity-picker
                    .hass=${this.hass}
                    .value=${this._config.entity || ""}
                    .configKey=${"entity"}
                    .domain=${["sensor"]}
                    @value-changed=${this._valueChanged}
                    allow-custom-entity
                ></ha-entity-picker>
            </div>
            <div class="option">
                <label>刷新按钮实体</label>
                <ha-entity-picker
                    .hass=${this.hass}
                    .value=${this._config.refresh_entity || ""}
                    .configKey=${"refresh_entity"}
                    .domain=${["button"]}
                    @value-changed=${this._valueChanged}
                    allow-custom-entity
                ></ha-entity-picker>
            </div>
            <div class="option">
                <label>音箱执行文本实体</label>
                <ha-entity-picker
                    .hass=${this.hass}
                    .value=${this._config.speaker_entity || ""}
                    .configKey=${"speaker_entity"}
                    .domain=${["text"]}
                    @value-changed=${this._valueChanged}
                    allow-custom-entity
                ></ha-entity-picker>
            </div>
        `;
    }
}
customElements.define('xiaoshi-chinese-poetry-card-editor', ChinesePoetryCardEditor);

class ChinesePoetryCard extends LitElement {
    static get properties() {
        return {
            hass: { type: Object },
            _config: { type: Object }
        };
    }

    static async getConfigElement() {
        return document.createElement("xiaoshi-chinese-poetry-card-editor");
    }

    static getStubConfig() {
        return {
            entity: "sensor.chinese_poetry",
            refresh_entity: "button.chinese_poetry_update",
            speaker_entity: ""
        };
    }

    static get styles() {
        return css`
            :host {
                display: block;
            }
            .poetry-card {
                width: 460px;
                height: 80px;
                padding: 0;
                background: rgb(0, 0, 0, 0);
                border-radius: 0;
                color: rgb(255, 255, 255);
                font-size: 13px;
                font-weight: bold;
                text-align: left;
                display: grid;
                grid-template-areas:
                    "标题"
                    "正文1"
                    "正文2";
                grid-template-columns: 100%;
                grid-template-rows: 25px 20px 20px;
                position: relative;
            }
            .title {
                grid-area: 标题;
                line-height: 25px;
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
            }
            .body1 {
                grid-area: 正文1;
                line-height: 20px;
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
            }
            .body2 {
                grid-area: 正文2;
                line-height: 20px;
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
            }
            .btn-icon {
                color: rgb(255, 255, 255);
                cursor: pointer;
                background: transparent;
                border: none;
                padding: 0;
                display: flex;
                align-items: center;
                justify-content: center;
                position: absolute;
            }
            .btn-icon {
                --mdc-icon-size: 18px;
            }
            .refresh-btn {
                top: 2px;
            }
            .play-btn {
                top: 47px;
            }
        `;
    }

    setConfig(config) {
        this._config = {
            entity: config.entity || "sensor.xiaoshi-chinese_poetry",
            refresh_entity: config.refresh_entity || "button.xiaoshi-chinese_poetry_update",
            speaker_entity: config.speaker_entity || "",
            ...config
        };
    }

    get _entity() {
        return this._config?.entity || "sensor.xiaoshi-chinese_poetry";
    }

    get _refreshEntity() {
        return this._config?.refresh_entity || "button.xiaoshi-chinese_poetry_update";
    }

    get _speakerEntity() {
        return this._config?.speaker_entity || "";
    }

    _getAttr(name) {
        if (!this.hass) return "";
        const state = this.hass.states[this._entity];
        return state?.attributes?.[name] || "";
    }

    _handleRefresh() {
        if (!this.hass || !this._refreshEntity) return;
        this.hass.callService("button", "press", {}, { entity_id: this._refreshEntity });
    }

    _handlePlay() {
        if (!this.hass || !this._speakerEntity) return;
        const title = this._getAttr("标题");
        const value = `[播放${title},false]`;
        this.hass.callService("text", "set_value", { value }, { entity_id: this._speakerEntity });
    }

    render() {
        const title = this._getAttr("标题");
        const dynasty = this._getAttr("朝代");
        const author = this._getAttr("作者");
        const body1 = this._getAttr("正文1");
        const body2 = this._getAttr("正文2");

        // 计算刷新按钮左边距：与 YAML 中 (5 + title.length + dynasty.length + author.length) * 12.5 对齐
        const refreshLeft = (5 + (title.length || 0) + (dynasty.length || 0) + (author.length || 0)) * 12.5;
        // 计算播放按钮左边距：与 YAML 中 (body1.length * 12.5 + 30) 对齐
        const playLeft = (body1.length || 0) * 12.5 + 30;

        return html`
            <div class="poetry-card">
                <div class="title">「${title}」${dynasty}&ensp;•&ensp;${author}</div>
                <div class="body1">&emsp;${body1}</div>
                <div class="body2">&emsp;${body2}</div>
                <button
                    class="btn-icon refresh-btn"
                    style="margin-left: ${refreshLeft}px;"
                    @click=${this._handleRefresh}
                    title="刷新诗词"
                >
                    <ha-icon icon="mdi:refresh" style="width:16px;height:16px;"></ha-icon>
                </button>
                ${this._speakerEntity ? html`
                    <button
                        class="btn-icon play-btn"
                        style="margin-left: ${playLeft}px;"
                        @click=${this._handlePlay}
                        title="播放朗读"
                    >
                        <ha-icon icon="mdi:volume-high" style="width:16px;height:16px;"></ha-icon>
                    </button>
                ` : ""}
            </div>
        `;
    }
}
customElements.define('xiaoshi-chinese-poetry-card', ChinesePoetryCard);
