const whenDefined = (t) => customElements.whenDefined(t);
await Promise.race([whenDefined("ha-card"), whenDefined("ha-panel-lovelace")]);
const LitElement = window.LitElement || Object.getPrototypeOf(customElements.get("ha-card"));
const html = LitElement.prototype.html;
const css = LitElement.prototype.css;
import { yamlToJson } from '../function/function.js';

window.customCards = window.customCards || [];
window.customCards.push({
    type: 'xiaoshi-room-card',
    name: '消逝手机端房间卡片',
    description: '房间状态与设备控制卡片',
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

class XiaoshiRoomCardEditor extends LitElement {
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
        return css`            .form { display: flex; flex-direction: column; gap: 10px; min-height: 400px; }
            .form-row { display: flex; align-items: center; gap: 8px; }
            .form-row label { font-weight: bold; white-space: nowrap; min-width: 80px; }
            .form-row input { flex: 1; padding: 6px 8px; border: 1px solid #ddd; border-radius: 4px; }
            .entity-row { display: flex; align-items: center; gap: 8px; position: relative; }
            .entity-row label { font-weight: bold; white-space: nowrap; min-width: 80px; }
            .entity-search { flex: 1; position: relative; }
            .entity-search input { width: 100%; padding: 6px 8px; border: 1px solid #ddd; border-radius: 4px; box-sizing: border-box; }
            .entity-row input[type="text"] { padding: 6px 8px; border: 1px solid #ddd; border-radius: 4px; box-sizing: border-box; }
            .entity-row input[type="color"] { width: 34px; height: 30px; padding: 1px; border: 1px solid #ddd; border-radius: 4px; flex: none; box-sizing: border-box; }
            .entity-dropdown { position: absolute; top: 100%; left: 0; right: 0; max-height: 200px; overflow-y: auto; background: var(--card-background-color, #fff); border: 1px solid #ddd; border-radius: 4px; box-shadow: 0 2px 8px rgba(0,0,0,0.15); z-index: 1000; margin-top: 2px; }
            .entity-option { display: flex; align-items: center; justify-content: space-between; padding: 6px 10px; cursor: pointer; border-bottom: 1px solid #eee; }
            .entity-option.selected { background: #e3f2fd; }
            .entity-info { display: flex; align-items: center; gap: 8px; flex: 1; min-width: 0; }
            .entity-info ha-icon { flex: none; }
            .entity-details { flex: 1; min-width: 0; }
            .entity-name { font-weight: 500; font-size: 13px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
            .entity-id { font-size: 11px; color: #888; font-family: monospace; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
            .no-results { padding: 10px; text-align: center; color: #888; font-size: 13px; }
            .device-section { border: 1px solid #ddd; border-radius: 8px; padding: 8px 10px; display: flex; flex-direction: column; gap: 6px; }
            .device-row { display: flex; align-items: center; gap: 6px; }
            .device-title { font-weight: bold; font-size: 13px; color: var(--primary-text-color); white-space: nowrap; min-width: 50px; }
            .device-section input[type="text"] { flex: 1; min-width: 0; padding: 5px 6px; border: 1px solid #ddd; border-radius: 4px; }
            .device-section input[type="color"] { width: 34px; height: 30px; padding: 1px; flex: none; }
            .device-remove { background: #f44336; color: white; border: none; border-radius: 4px; padding: 2px 8px; cursor: pointer; font-size: 12px; white-space: nowrap; flex: none; }
            .device-remove:hover { background: #d32f2f; }
            .add-device-btn { background: #4caf50; color: white; border: none; border-radius: 6px; padding: 8px 16px; cursor: pointer; font-size: 14px; font-weight: 500; text-align: center; }
            .add-device-btn:hover { background: #388e3c; }`;
    }

    constructor() {
        super();
    this._holdTimer = null;
    this._holdTriggered = false;
        this._activeSearch = '';
        this._searchTerms = {};
        this._filteredEntities = {};
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

    _onEntitySearch(field, e) {
        const term = e.target.value.toLowerCase();
        this._activeSearch = field;
        this._searchTerms = { ...this._searchTerms, [field]: e.target.value };

        if (!this.hass) return;

        // 根据字段决定默认过滤的domain
        const domainMap = {
            temperature: 'sensor',
            humidity: 'sensor',
            pm25: 'sensor',
            person: 'binary_sensor'
        };
        const defaultDomain = domainMap[field] || '';

        const allEntities = Object.values(this.hass.states);
        this._filteredEntities = {
            ...this._filteredEntities,
            [field]: allEntities.filter(entity => {
                const eid = entity.entity_id.toLowerCase();
                const fname = (entity.attributes.friendly_name || '').toLowerCase();
                const matchesDomain = !term && defaultDomain ? eid.startsWith(defaultDomain + '.') : true;
                const matchesSearch = term ? (eid.includes(term) || fname.includes(term)) : true;
                return matchesDomain && matchesSearch;
            }).slice(0, 30)
        };
    }

    _clearEntity(field) {
        this._activeSearch = '';
        this._searchTerms = { ...this._searchTerms, [field]: '' };

        const newConfig = { ...this.config };
        delete newConfig[field];
        this.config = newConfig;

        this.dispatchEvent(new CustomEvent('config-changed', {
            detail: { config: this.config },
            bubbles: true,
            composed: true
        }));
    }

    _selectEntity(field, entityId) {
        this._activeSearch = '';
        this._searchTerms = { ...this._searchTerms, [field]: '' };

        this.config = {
            ...this.config,
            [field]: entityId
        };

        this.dispatchEvent(new CustomEvent('config-changed', {
            detail: { config: this.config },
            bubbles: true,
            composed: true
        }));
    }

    _deviceFieldChanged(deviceIndex, field, value) {
        const devices = [...(this.config.devices || [])];
        while (devices.length <= deviceIndex) {
            devices.push({});
        }
        devices[deviceIndex] = { ...devices[deviceIndex], [field]: value };

        this.config = {
            ...this.config,
            devices
        };

        this.dispatchEvent(new CustomEvent('config-changed', {
            detail: { config: this.config },
            bubbles: true,
            composed: true
        }));
    }

    _jsonFieldChanged(e) {
        const { name, value } = e.target;
        if (!name) return;
        this.config = {
            ...this.config,
            [name]: value.trim() || null
        };
        this.dispatchEvent(new CustomEvent('config-changed', {
            detail: { config: this.config },
            bubbles: true,
            composed: true
        }));
    }

    _addDevice() {
        const devices = [...(this.config.devices || [])];
        devices.push({});
        this.config = {
            ...this.config,
            devices
        };

        this.dispatchEvent(new CustomEvent('config-changed', {
            detail: { config: this.config },
            bubbles: true,
            composed: true
        }));
    }

    _removeDevice(index) {
        const devices = [...(this.config.devices || [])];
        devices.splice(index, 1);
        this.config = {
            ...this.config,
            devices
        };

        this.dispatchEvent(new CustomEvent('config-changed', {
            detail: { config: this.config },
            bubbles: true,
            composed: true
        }));
    }

    firstUpdated() {
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.entity-search')) {
                this._activeSearch = '';
                this.requestUpdate();
            }
        });
    }

    _renderEntityField(field, label, currentValue) {
        return html`
            <div class="entity-row">
                <label>${label}</label>
                <div class="entity-search">
                    <input type="text"
                        .value="${this._activeSearch === field ? (this._searchTerms[field] || '') : (currentValue || '')}"
                        @input="${(e) => this._onEntitySearch(field, e)}"
                        @focus="${(e) => this._onEntitySearch(field, e)}"
                        placeholder="搜索实体..."
                    />
                    ${this._activeSearch === field && this._filteredEntities[field] ? html`
                        <div class="entity-dropdown">
                            ${this._filteredEntities[field].map(entity => html`
                                <div class="entity-option ${currentValue === entity.entity_id ? 'selected' : ''}"
                                    @click="${() => this._selectEntity(field, entity.entity_id)}"
                                >
                                    <div class="entity-info">
                                        <ha-icon icon="${entity.attributes.icon || 'mdi:help-circle'}"></ha-icon>
                                        <div class="entity-details">
                                            <div class="entity-name">${entity.attributes.friendly_name || entity.entity_id}</div>
                                            <div class="entity-id">${entity.entity_id}</div>
                                        </div>
                                    </div>
                                    ${currentValue === entity.entity_id ? html`<ha-icon icon="mdi:check" style="color:#4caf50"></ha-icon>` : ''}
                                </div>
                            `)}
                            ${this._filteredEntities[field].length === 0 ? html`
                                <div class="no-results">未找到匹配实体</div>
                            ` : ''}
                        </div>
                    ` : ''}
                </div>
            </div>
        `;
    }

    render() {
        if (!this.hass || !this.config) return html``;
        const c = this.config;
        const devices = c.devices || [];

        return html`
            <div class="form">
                <div class="form-row">
                    <label>主题</label>
                    <select name="theme" @change="${this._valueChanged}" style="flex:1;min-width:100px;padding:6px 0px;border:1px solid #ddd;border-radius:4px;">
                        <option value="system" .selected="${c.theme === 'system' || !c.theme}">跟随系统</option>
                        <option value="function" .selected="${c.theme === 'function'}">跟随函数</option>
                        <option value="light" .selected="${c.theme === 'light'}">亮色 (light)</option>
                        <option value="dark" .selected="${c.theme === 'dark'}">暗色 (dark)</option>
                    </select>
                    <label style="min-width:auto">弹窗宽度</label>
                    <input type="text" name="popup_width" .value="${c.popup_width || ''}" @change="${this._valueChanged}" placeholder="95%" style="max-width:60px" />
                    <label style="min-width:auto">弹窗位置</label>
                    <input type="text" name="popup_top" .value="${c.popup_top || ''}" @change="${this._valueChanged}" placeholder="20px" style="max-width:60px" />
                </div>

                <div class="form-row">
                    <label>房间名称</label>
                    <input type="text" name="name" .value="${c.name || ''}" @change="${this._valueChanged}" placeholder="如：儿童房" style="max-width:130px" />
                    <input type="text" name="name_size" .value="${c.name_size || ''}" @change="${this._valueChanged}" placeholder="字体大小3vw" style="max-width:100px" />
                    <input type="color" name="name_color" .value="${c.name_color || '#00bcd4'}" @change="${this._valueChanged}" style="width:34px;height:30px;padding:1px;border:1px solid #ddd;border-radius:4px;flex:none;box-sizing:border-box" />
                    <input type="color" name="card_bg_light" .value="${c.card_bg_light || '#ffffff'}" @change="${this._valueChanged}" title="亮色背景" style="width:34px;height:30px;padding:1px;border:1px solid #ddd;border-radius:4px;flex:none;box-sizing:border-box" />
                    <input type="color" name="card_bg_dark" .value="${c.card_bg_dark || '#323232'}" @change="${this._valueChanged}" title="暗色背景" style="width:34px;height:30px;padding:1px;border:1px solid #ddd;border-radius:4px;flex:none;box-sizing:border-box" />
                </div>
                <div class="form-row">
                    <label>卡片宽度</label>
                    <input type="text" name="card_width" .value="${c.card_width || ''}" @change="${this._valueChanged}" placeholder="46vw" style="max-width:130px" />
                    <label>卡片高度</label>
                    <input type="text" name="card_height" .value="${c.card_height || ''}" @change="${this._valueChanged}" placeholder="100%" style="max-width:100px" />
                </div>

                <div class="entity-row">
                    <label>温度</label>
                    <div class="entity-search" style="flex:1">
                        <input type="text"
                            .value="${this._activeSearch === 'temperature' ? (this._searchTerms['temperature'] || '') : (c.temperature || '')}"
                            @input="${(e) => this._onEntitySearch('temperature', e)}"
                            @focus="${(e) => this._onEntitySearch('temperature', e)}"
                            placeholder="搜索实体..."
                        />
                        ${this._activeSearch === 'temperature' && this._filteredEntities['temperature'] ? html`
                            <div class="entity-dropdown">
                                ${this._filteredEntities['temperature'].map(entity => html`
                                    <div class="entity-option ${c.temperature === entity.entity_id ? 'selected' : ''}"
                                        @click="${() => this._selectEntity('temperature', entity.entity_id)}"
                                    >
                                        <div class="entity-info">
                                            <ha-icon icon="${entity.attributes.icon || 'mdi:help-circle'}"></ha-icon>
                                            <div class="entity-details">
                                                <div class="entity-name">${entity.attributes.friendly_name || entity.entity_id}</div>
                                                <div class="entity-id">${entity.entity_id}</div>
                                            </div>
                                        </div>
                                        ${c.temperature === entity.entity_id ? html`<ha-icon icon="mdi:check" style="color:#4caf50"></ha-icon>` : ''}
                                    </div>
                                `)}
                                ${c.temperature ? html`<div class="entity-option" @click="${() => this._clearEntity('temperature')}" style="color:#f44336;justify-content:center"><ha-icon icon="mdi:close-circle"></ha-icon> 清除</div>` : ''}
                                ${this._filteredEntities['temperature'].length === 0 && !c.temperature ? html`<div class="no-results">未找到匹配实体</div>` : ''}
                            </div>
                        ` : ''}
                    </div>
                    <input type="text" name="temperature_icon" .value="${c.temperature_icon || ''}" @change="${this._valueChanged}" placeholder="mdi图标" style="width:90px;flex:none" />
                    <input type="color" name="temperature_color" .value="${c.temperature_color || '#d44e4e'}" @change="${this._valueChanged}" />
                </div>
                <div class="form-row">
                    <label style="min-width:80px">温度弹窗</label>
                    <textarea name="temperature_popup" .value="${c.temperature_popup || ''}" @change="${this._jsonFieldChanged}" placeholder='- type: custom:xiaoshi-chart-card
  entities:
    - entity: sensor.xxx
      name: 名称' rows="3" style="flex:1;font-size:12px;resize:vertical;padding:6px 8px;border:1px solid #ddd;border-radius:4px;box-sizing:border-box"></textarea>
                </div>
                <div class="form-row">
                    <label style="min-width:80px">温度长按弹窗</label>
                    <textarea name="temperature_hold_popup" .value="${c.temperature_hold_popup || ''}" @change="${this._jsonFieldChanged}" placeholder='长按弹出卡片' rows="3" style="flex:1;font-size:12px;resize:vertical;padding:6px 8px;border:1px solid #ddd;border-radius:4px;box-sizing:border-box"></textarea>
                </div>
                <div class="entity-row">
                    <label>湿度</label>
                    <div class="entity-search" style="flex:1">
                        <input type="text"
                            .value="${this._activeSearch === 'humidity' ? (this._searchTerms['humidity'] || '') : (c.humidity || '')}"
                            @input="${(e) => this._onEntitySearch('humidity', e)}"
                            @focus="${(e) => this._onEntitySearch('humidity', e)}"
                            placeholder="搜索实体..."
                        />
                        ${this._activeSearch === 'humidity' && this._filteredEntities['humidity'] ? html`
                            <div class="entity-dropdown">
                                ${this._filteredEntities['humidity'].map(entity => html`
                                    <div class="entity-option ${c.humidity === entity.entity_id ? 'selected' : ''}"
                                        @click="${() => this._selectEntity('humidity', entity.entity_id)}"
                                    >
                                        <div class="entity-info">
                                            <ha-icon icon="${entity.attributes.icon || 'mdi:help-circle'}"></ha-icon>
                                            <div class="entity-details">
                                                <div class="entity-name">${entity.attributes.friendly_name || entity.entity_id}</div>
                                                <div class="entity-id">${entity.entity_id}</div>
                                            </div>
                                        </div>
                                        ${c.humidity === entity.entity_id ? html`<ha-icon icon="mdi:check" style="color:#4caf50"></ha-icon>` : ''}
                                    </div>
                                `)}
                                ${c.humidity ? html`<div class="entity-option" @click="${() => this._clearEntity('humidity')}" style="color:#f44336;justify-content:center"><ha-icon icon="mdi:close-circle"></ha-icon> 清除</div>` : ''}
                                ${this._filteredEntities['humidity'].length === 0 && !c.humidity ? html`<div class="no-results">未找到匹配实体</div>` : ''}
                            </div>
                        ` : ''}
                    </div>
                    <input type="text" name="humidity_icon" .value="${c.humidity_icon || ''}" @change="${this._valueChanged}" placeholder="mdi图标" style="width:90px;flex:none" />
                    <input type="color" name="humidity_color" .value="${c.humidity_color || '#2196f3'}" @change="${this._valueChanged}" />
                </div>
                <div class="form-row">
                    <label style="min-width:80px">湿度弹窗</label>
                    <textarea name="humidity_popup" .value="${c.humidity_popup || ''}" @change="${this._jsonFieldChanged}" placeholder='- type: custom:xiaoshi-chart-card
  entities:
    - entity: sensor.xxx
      name: 名称' rows="3" style="flex:1;font-size:12px;resize:vertical;padding:6px 8px;border:1px solid #ddd;border-radius:4px;box-sizing:border-box"></textarea>
                </div>
                <div class="form-row">
                    <label style="min-width:80px">湿度长按弹窗</label>
                    <textarea name="humidity_hold_popup" .value="${c.humidity_hold_popup || ''}" @change="${this._jsonFieldChanged}" placeholder='长按弹出卡片' rows="3" style="flex:1;font-size:12px;resize:vertical;padding:6px 8px;border:1px solid #ddd;border-radius:4px;box-sizing:border-box"></textarea>
                </div>
                <div class="entity-row">
                    <label>PM2.5</label>
                    <div class="entity-search" style="flex:1">
                        <input type="text"
                            .value="${this._activeSearch === 'pm25' ? (this._searchTerms['pm25'] || '') : (c.pm25 || '')}"
                            @input="${(e) => this._onEntitySearch('pm25', e)}"
                            @focus="${(e) => this._onEntitySearch('pm25', e)}"
                            placeholder="搜索实体..."
                        />
                        ${this._activeSearch === 'pm25' && this._filteredEntities['pm25'] ? html`
                            <div class="entity-dropdown">
                                ${this._filteredEntities['pm25'].map(entity => html`
                                    <div class="entity-option ${c.pm25 === entity.entity_id ? 'selected' : ''}"
                                        @click="${() => this._selectEntity('pm25', entity.entity_id)}"
                                    >
                                        <div class="entity-info">
                                            <ha-icon icon="${entity.attributes.icon || 'mdi:help-circle'}"></ha-icon>
                                            <div class="entity-details">
                                                <div class="entity-name">${entity.attributes.friendly_name || entity.entity_id}</div>
                                                <div class="entity-id">${entity.entity_id}</div>
                                            </div>
                                        </div>
                                        ${c.pm25 === entity.entity_id ? html`<ha-icon icon="mdi:check" style="color:#4caf50"></ha-icon>` : ''}
                                    </div>
                                `)}
                                ${c.pm25 ? html`<div class="entity-option" @click="${() => this._clearEntity('pm25')}" style="color:#f44336;justify-content:center"><ha-icon icon="mdi:close-circle"></ha-icon> 清除</div>` : ''}
                                ${this._filteredEntities['pm25'].length === 0 && !c.pm25 ? html`<div class="no-results">未找到匹配实体</div>` : ''}
                            </div>
                        ` : ''}
                    </div>
                    <input type="text" name="pm25_icon" .value="${c.pm25_icon || ''}" @change="${this._valueChanged}" placeholder="mdi图标" style="width:90px;flex:none" />
                    <input type="color" name="pm25_color" .value="${c.pm25_color || '#4caf50'}" @change="${this._valueChanged}" />
                </div>
                <div class="form-row">
                    <label style="min-width:80px">PM2.5弹窗</label>
                    <textarea name="pm25_popup" .value="${c.pm25_popup || ''}" @change="${this._jsonFieldChanged}" placeholder='- type: custom:xiaoshi-chart-card
  entities:
    - entity: sensor.xxx
      name: 名称' rows="3" style="flex:1;font-size:12px;resize:vertical;padding:6px 8px;border:1px solid #ddd;border-radius:4px;box-sizing:border-box"></textarea>
                </div>
                <div class="form-row">
                    <label style="min-width:80px">PM2.5长按弹窗</label>
                    <textarea name="pm25_hold_popup" .value="${c.pm25_hold_popup || ''}" @change="${this._jsonFieldChanged}" placeholder='长按弹出卡片' rows="3" style="flex:1;font-size:12px;resize:vertical;padding:6px 8px;border:1px solid #ddd;border-radius:4px;box-sizing:border-box"></textarea>
                </div>
                <div class="entity-row">
                    <label>人在</label>
                    <div class="entity-search" style="flex:1">
                        <input type="text"
                            .value="${this._activeSearch === 'person' ? (this._searchTerms['person'] || '') : (c.person || '')}"
                            @input="${(e) => this._onEntitySearch('person', e)}"
                            @focus="${(e) => this._onEntitySearch('person', e)}"
                            placeholder="搜索实体..."
                        />
                        ${this._activeSearch === 'person' && this._filteredEntities['person'] ? html`
                            <div class="entity-dropdown">
                                ${this._filteredEntities['person'].map(entity => html`
                                    <div class="entity-option ${c.person === entity.entity_id ? 'selected' : ''}"
                                        @click="${() => this._selectEntity('person', entity.entity_id)}"
                                    >
                                        <div class="entity-info">
                                            <ha-icon icon="${entity.attributes.icon || 'mdi:help-circle'}"></ha-icon>
                                            <div class="entity-details">
                                                <div class="entity-name">${entity.attributes.friendly_name || entity.entity_id}</div>
                                                <div class="entity-id">${entity.entity_id}</div>
                                            </div>
                                        </div>
                                        ${c.person === entity.entity_id ? html`<ha-icon icon="mdi:check" style="color:#4caf50"></ha-icon>` : ''}
                                    </div>
                                `)}
                                ${c.person ? html`<div class="entity-option" @click="${() => this._clearEntity('person')}" style="color:#f44336;justify-content:center"><ha-icon icon="mdi:close-circle"></ha-icon> 清除</div>` : ''}
                                ${this._filteredEntities['person'].length === 0 && !c.person ? html`<div class="no-results">未找到匹配实体</div>` : ''}
                            </div>
                        ` : ''}
                    </div>
                    <input type="text" name="person_icon" .value="${c.person_icon || ''}" @change="${this._valueChanged}" placeholder="mdi图标" style="width:70px;flex:none" />
                    <input type="text" name="person_icon_size" .value="${c.person_icon_size || ''}" @change="${this._valueChanged}" placeholder="例如：3" style="width:80px;flex:none" />
                    <input type="color" name="person_color" .value="${c.person_color || '#ff5722'}" @change="${this._valueChanged}" />
                </div>
                <div class="form-row">
                    <label style="min-width:80px">人在长按弹窗</label>
                    <textarea name="person_hold_popup" .value="${c.person_hold_popup || ''}" @change="${this._jsonFieldChanged}" placeholder='长按弹出卡片' rows="3" style="flex:1;font-size:12px;resize:vertical;padding:6px 8px;border:1px solid #ddd;border-radius:4px;box-sizing:border-box"></textarea>
                </div>

                <div class="form-row">
                    <label>人在条件</label>
                    <select name="person_condition_mode" @change="${this._valueChanged}" style="flex:none;padding:6px 0px;border:1px solid #ddd;border-radius:4px;">
                        <option value="" .selected="${!c.person_condition_mode}">预置条件</option>
                        <option value="append" .selected="${c.person_condition_mode === 'append'}">新增条件</option>
                        <option value="override" .selected="${c.person_condition_mode === 'override'}">覆盖条件</option>
                    </select>
                    ${c.person_condition_mode ? html`
                    <input type="text" name="person_status_conditions" .value="${c.person_status_conditions || ''}" @change="${this._valueChanged}" placeholder="on,home,有人" style="flex:1" />
                    ` : ''}
                </div>

                <div class="form-row">
                    <label>设备布局</label>
                    <select name="device_layout" @change="${this._valueChanged}" style="flex:1;padding:6px 0px;border:1px solid #ddd;border-radius:4px;">
                        <option value="right_top" .selected="${!c.device_layout || c.device_layout === 'right_top'}">右上布局</option>
                        <option value="right_bottom" .selected="${c.device_layout === 'right_bottom'}">右下布局</option>
                        <option value="bottom_right" .selected="${c.device_layout === 'bottom_right'}">下右布局</option>
                        <option value="bottom_left" .selected="${c.device_layout === 'bottom_left'}">下左布局</option>
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


                ${devices.map((dev, i) => html`
                    <div class="device-section">
                        <div class="device-row">
                            <span class="device-title">设备${i + 1}</span>
                            <input type="text"
                                .value="${dev.icon || ''}"
                                @change="${(e) => this._deviceFieldChanged(i, 'icon', e.target.value)}"
                                placeholder="mdi图标"
                                style="width:130px;flex:none"
                            />
                            <input type="text"
                                .value="${dev.icon_size || ''}"
                                @change="${(e) => this._deviceFieldChanged(i, 'icon_size', e.target.value)}"
                                placeholder="大小:2.8vh"
                                style="width:80px;flex:none"
                            />
                            <input type="color"
                                .value="${dev.icon_color || '#ffffff'}"
                                @change="${(e) => this._deviceFieldChanged(i, 'icon_color', e.target.value)}"
                                title="图标颜色"
                            />
                            <input type="color"
                                .value="${dev.on_color || '#00a0c4'}"
                                @change="${(e) => this._deviceFieldChanged(i, 'on_color', e.target.value)}"
                                title="开启背景色"
                            />
                            <input type="color"
                                .value="${dev.off_color || '#333333'}"
                                @change="${(e) => this._deviceFieldChanged(i, 'off_color', e.target.value)}"
                                title="关闭背景色"
                            />
                            <input type="color"
                                .value="${dev.badge_color || '#f44336'}"
                                @change="${(e) => this._deviceFieldChanged(i, 'badge_color', e.target.value)}"
                                title="角标颜色"
                            />
                        </div>
                        <div class="device-row">
                            <label style="font-weight:bold;font-size:13px;min-width: 50px;white-space:nowrap">条件</label>
                            <select
                                .value="${dev.condition_mode || ''}"
                                @change="${(e) => this._deviceFieldChanged(i, 'condition_mode', e.target.value)}"
                                style="flex:none;padding:5px 6px;border:1px solid #ddd;border-radius:4px;font-size:12px"
                            >
                                <option value="" .selected="${!dev.condition_mode}">预置条件</option>
                                <option value="append" .selected="${dev.condition_mode === 'append'}">新增条件</option>
                                <option value="override" .selected="${dev.condition_mode === 'override'}">覆盖条件</option>
                            </select>
                            ${dev.condition_mode ? html`
                            <input type="text"
                                .value="${dev.status_conditions || ''}"
                                @change="${(e) => this._deviceFieldChanged(i, 'status_conditions', e.target.value)}"
                                placeholder="on,open,home"
                                style="flex:1;min-width:0;padding:5px 6px;border:1px solid #ddd;border-radius:4px;font-size:12px"
                            />
                            ` : ''}
                        </div>
                        <div class="device-row">
                            <label style="font-weight:bold;font-size:12px;white-space:nowrap">实体列表</label>
                            <textarea
                                .value="${(dev.entities || []).join('\n') || ''}"
                                @change="${(e) => {
                                    const val = e.target.value.trim();
                                    const ents = val ? val.split('\n').map(s => s.trim()).filter(Boolean) : [];
                                    this._deviceFieldChanged(i, 'entities', ents);
                                }}"
                                placeholder="实体，回车分隔"
                                rows="3"
                                style="flex:1;resize:vertical;padding:5px 6px;border:1px solid #ddd;border-radius:4px;box-sizing:border-box;font-size:12px"
                            ></textarea>
                        </div>
                        <div class="device-row">
                            <label style="font-weight:bold;font-size:12px;white-space:nowrap">弹窗背景css属性</label>
                            <select
                                @change="${(e) => this._deviceFieldChanged(i, 'popup_background', e.target.value)}"
                                style="flex:1;padding:5px 0px;border:1px solid #ddd;border-radius:4px;font-size:12px"
                            >
                                <option value="" .selected="${!dev.popup_background}">默认</option>
                                <option value="transparent" .selected="${dev.popup_background === 'transparent'}">透明</option>
                                <option value="theme" .selected="${dev.popup_background === 'theme'}">跟随主题</option>
                                <option value="custom" .selected="${dev.popup_background && dev.popup_background !== 'transparent' && dev.popup_background !== 'theme'}">自定义颜色</option>
                            </select>
                            <input type="color"
                                .value="${dev.popup_background && dev.popup_background !== 'transparent' && dev.popup_background !== 'theme' ? dev.popup_background : '#ffffff'}"
                                @change="${(e) => this._deviceFieldChanged(i, 'popup_background', e.target.value)}"
                                title="自定义背景色"
                            />
                        </div>
                        <div class="device-row">
                            <label style="font-weight:bold;font-size:12px;white-space:nowrap">启用tap_action</label>
                            <select
                                @change="${(e) => this._deviceFieldChanged(i, 'tap_action_enable', e.target.value)}"
                                style="padding:5px 0px;border:1px solid #ddd;border-radius:4px;font-size:12px"
                            >
                                <option value="" .selected="${!dev.tap_action_enable}">否</option>
                                <option value="true" .selected="${dev.tap_action_enable === true || dev.tap_action_enable === 'true'}">是</option>
                            </select>
                        </div>
                        ${dev.tap_action_enable === true || dev.tap_action_enable === 'true' ? html`
                        <div class="device-row" style="flex-direction:column;align-items:stretch;">
                            <label style="font-weight:bold;font-size:12px;">tap_action (YAML格式)</label>
                            <textarea
                                .value="${dev.tap_action || ''}"
                                @change="${(e) => this._deviceFieldChanged(i, 'tap_action', e.target.value)}"
                                placeholder='action: light.turn_on
target:
  area_id: living_room
  entity_id:
    - light.hallway'
                                rows="3"
                                style="flex:1;resize:vertical;padding:5px 6px;border:1px solid #ddd;border-radius:4px;box-sizing:border-box;font-size:12px"
                            ></textarea>
                        </div>
                        ` : html`
                        <div class="device-row">
                            <label style="font-weight:bold;font-size:12px;white-space:nowrap">弹窗宽度</label>
                            <input type="text"
                                .value="${dev.popup_width || ''}"
                                @change="${(e) => this._deviceFieldChanged(i, 'popup_width', e.target.value)}"
                                placeholder="宽度"
                                style="width:60px;flex:none;padding:5px 4px;border:1px solid #ddd;border-radius:4px;font-size:12px"
                            />
                            <label style="font-weight:bold;font-size:12px;white-space:nowrap">弹窗位置</label>
                            <input type="text"
                                .value="${dev.popup_top || ''}"
                                @change="${(e) => this._deviceFieldChanged(i, 'popup_top', e.target.value)}"
                                placeholder="位置"
                                style="width:60px;flex:none;padding:5px 4px;border:1px solid #ddd;border-radius:4px;font-size:12px"
                            />
                        </div>
                        <div class="device-row">
                            <label style="font-weight:bold;font-size:12px;white-space:nowrap">设备弹窗</label>
                            <textarea
                                .value="${dev.popup || ''}"
                                @change="${(e) => {
                                    this._deviceFieldChanged(i, 'popup', e.target.value.trim() || null);
                                }}"
                                placeholder='- type: custom:xiaoshi-chart-card
  entities:
    - entity: sensor.xxx
      name: 名称'
                                rows="5"
                                style="flex:1;resize:vertical;padding:5px 6px;border:1px solid #ddd;border-radius:4px;box-sizing:border-box;font-size:12px"
                            ></textarea>
                        </div>
                        `}
                        <div class="device-row">
                            <label style="font-weight:bold;font-size:12px;white-space:nowrap">启用hold_action</label>
                            <select
                                @change="${(e) => this._deviceFieldChanged(i, 'hold_action_enable', e.target.value)}"
                                style="padding:5px 0px;border:1px solid #ddd;border-radius:4px;font-size:12px"
                            >
                                <option value="" .selected="${!dev.hold_action_enable}">否</option>
                                <option value="true" .selected="${dev.hold_action_enable === true || dev.hold_action_enable === 'true'}">是</option>
                            </select>
                        </div>
                        ${dev.hold_action_enable === true || dev.hold_action_enable === 'true' ? html`
                        <div class="device-row" style="flex-direction:column;align-items:stretch;">
                            <label style="font-weight:bold;font-size:12px;">hold_action (YAML格式)</label>
                            <textarea
                                .value="${dev.hold_action || ''}"
                                @change="${(e) => this._deviceFieldChanged(i, 'hold_action', e.target.value)}"
                                placeholder='action: light.turn_on
target:
  area_id: living_room
  entity_id:
    - light.hallway'
                                rows="3"
                                style="flex:1;resize:vertical;padding:5px 6px;border:1px solid #ddd;border-radius:4px;box-sizing:border-box;font-size:12px"
                            ></textarea>
                        </div>
                        ` : html`
                        <div class="device-row">
                            <label style="font-weight:bold;font-size:12px;white-space:nowrap">长按弹窗宽度</label>
                            <input type="text"
                                .value="${dev.hold_popup_width || ''}"
                                @change="${(e) => this._deviceFieldChanged(i, 'hold_popup_width', e.target.value)}"
                                placeholder="宽度"
                                style="width:60px;flex:none;padding:5px 4px;border:1px solid #ddd;border-radius:4px;font-size:12px"
                            />
                            <label style="font-weight:bold;font-size:12px;white-space:nowrap">长按弹窗位置</label>
                            <input type="text"
                                .value="${dev.hold_popup_top || ''}"
                                @change="${(e) => this._deviceFieldChanged(i, 'hold_popup_top', e.target.value)}"
                                placeholder="位置"
                                style="width:60px;flex:none;padding:5px 4px;border:1px solid #ddd;border-radius:4px;font-size:12px"
                            />
                        </div>
                        <div class="device-row">
                            <label style="font-weight:bold;font-size:12px;white-space:nowrap">长按弹窗</label>
                            <textarea
                                .value="${dev.hold_popup_cards || ''}"
                                @change="${(e) => {
                                    this._deviceFieldChanged(i, 'hold_popup_cards', e.target.value.trim() || null);
                                }}"
                                placeholder='长按弹出卡片'
                                rows="3"
                                style="flex:1;resize:vertical;padding:5px 6px;border:1px solid #ddd;border-radius:4px;box-sizing:border-box;font-size:12px"
                            ></textarea>
                        </div>
                        `}
                        <div class="device-row" style="justify-content:flex-end">
                            <button class="device-remove" @click="${() => this._removeDevice(i)}">删除</button>
                        </div>
                    </div>
                `)}

                <button class="add-device-btn" @click="${this._addDevice}">+ 添加设备</button>
            </div>
        `;
    }
}
customElements.define('xiaoshi-room-card-editor', XiaoshiRoomCardEditor);

class XiaoshiRoomCard extends LitElement {

    static get properties() {
        return {
            hass: { type: Object },
            config: { type: Object },
            _showHistory: { type: Boolean, state: true },
            _historyData: { type: Object, state: true },
            _historyLoading: { type: Boolean, state: true }
        };
    }

    constructor() {
        super();
    this._holdTimer = null;
    this._holdTriggered = false;
    this._holdTarget = null;
    this._holdData = null;
        this._showHistory = false;
        this._historyData = {};
        this._historyLoading = false;
        this._historyOverlayEl = null;
        this._historyBodyEl = null;
        this._historyFilterPeriod = 24;
    }

    static get styles() {
        return css`            
            :host { display: block; height: 100%; min-height: 0; max-width: 240px; }
            ha-card { border: none; box-shadow: none; max-width: 240px; }
            .card { background: transparent; border-radius: min(3.5vw, 17.5px); position: relative; overflow: hidden; display: flex; height: 100%; min-height: 0; font-family: var(--paper-font-body1_-_font-family); max-width: 240px; }
            /* ===== 左侧区域 ===== */
            .left { width: 45%; padding: 1.2vh min(1.2vw, 6px) 1.2vh min(2vw, 10px); display: flex; flex-direction: column; position: relative; z-index: 1; box-sizing: border-box; }
            .corner-label { position: absolute; top: -1px; left: -1px; width: 0; height: 0; border-style: solid; border-width: var(--corner-size, 7.5vh) var(--corner-size, 7.5vh) 0 0; border-color: #00bcd4 transparent transparent transparent; }
            .corner-text { position: absolute; top: calc(var(--corner-size, 7.5vh) * 0.16); left: calc(var(--corner-size, 7.5vh) * 0.11); color: white; font-size: min(3vw, 15px); font-weight: bold; transform-origin: center center; white-space: nowrap; }
            /* 人在图标 */
            .person-icon { margin-top: var(--chip-h, 2.6vh); margin-left: min(7vw, 35px); color: #ff5722; display: flex; align-items: center; justify-content: center; width: var(--chip-h, 2.6vh); height: var(--chip-h, 2.6vh); cursor: pointer; }
            .person-icon:active { transform: scale(0.9); }
            .person-icon ha-icon { --mdc-icon-size: calc(var(--chip-h, 2.6vh) * 0.85); }
            @keyframes person-blink {
                0%, 100% { opacity: 1; }
                50% { opacity: 0.3; }
            }
            .person-home { animation: person-blink 0.6s ease-in-out infinite; }
            .person-hidden { display: none; }
            /* 传感器条 */
            .sensor-list { display: flex; flex-direction: column; gap: 0.5vh; margin-top: auto; margin-bottom: 0; }
            .sensor-chip { border-radius: min(4vw, 20px); padding: 0 min(2vw, 10px); height: calc(var(--chip-h, 2.6vh) * 1.1); color: white; font-size: calc(var(--chip-h, 2.6vh) * 0.5); font-weight: 500; display: flex; align-items: center; position: relative; box-sizing: border-box; cursor: none; }
            .sensor-chip:active { transform: scale(0.95); box-shadow: 0 2px 12px rgba(255, 255, 255, 0.4), 0 2px 8px rgba(0, 0, 0, 0.4); }
            .sensor-icon { display: flex; align-items: center; z-index: 1; }
            .sensor-icon ha-icon { --mdc-icon-size: calc(var(--chip-h, 2.6vh) * 0.6); }
            .sensor-value { flex: 1; text-align: center; }
            /* ===== 设备区域 (中间+右侧两列) ===== */
            .devices-area { flex: 1; display: grid; grid-template-columns: 1fr 1fr; grid-template-rows: repeat(3, 1fr); gap: 1.4vh; padding: 1.2vh min(2.5vw, 12.5px) 1.2vh min(1.2vw, 6px); align-content: center; }
            /* 单个设备按钮 */
            .device-btn { position: relative; background: #333; border-radius: min(2vw, 10px); display: flex; align-items: center; justify-content: center; color: #888; cursor: none; transition: background 0.25s, color 0.25s; border: none; outline: none; padding: 0; }
            .device-btn ha-icon { --mdc-icon-size: 2.8vh; }
            .device-btn:not(.empty):active { transform: scale(0.95); box-shadow: 0 2px 12px rgba(255, 255, 255, 0.4), 0 2px 8px rgba(0, 0, 0, 0.4); }
            .device-btn.empty { background: transparent; cursor: default; }
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
            .device-btn ha-icon.anim-swing-bottom { animation: swingBottom 2s ease-in-out infinite; transform-origin: bottom center; }
            .device-btn ha-icon.anim-swing-top { animation: swingTop 2s ease-in-out infinite; transform-origin: top center; }
            .device-btn ha-icon.anim-shake-x { animation: shakeX 1.5s ease-in-out infinite; }
            .device-btn ha-icon.anim-shake-y { animation: shakeY 1.5s ease-in-out infinite; }
            /* 右上角圆形角标 */
            .badge { position: absolute; top: max(-1vw, -5px); right: max(-1vw, -5px); width: min(3.8vw, 19px); height: min(3.8vw, 19px); border-radius: 50%; background: #f44336; color: white; font-size: min(2.3vw, 11.5px); font-weight: 600; display: flex; align-items: center; justify-content: center; line-height: 1; }
            .badge.hidden { display: none; }
            /* ===== 下右布局（3设备） ===== */
            .layout-br .br-sensors { position: absolute; top: 1.2vh; right: 0; display: flex; flex-direction: column; gap: 0.5vh; width: 45%; padding: 0 min(1.2vw, 6px) 0 min(2vw, 10px); box-sizing: border-box; z-index: 1; }
            .layout-br .br-person { position: absolute; left: max(7vw, 35px); top: 40%; transform: translateY(-50%); z-index: 1; }
            .layout-br .br-person .person-icon { margin-left: 0; }
            .layout-br .br-person .person-icon ha-icon { --mdc-icon-size: calc(var(--chip-h, 2.6vh) * 0.85); }
            .layout-br .br-devices { display: flex; justify-content: flex-end; align-items: flex-end; gap: 1.4vh; padding: 0 min(2.5vw, 12.5px) 1.2vh min(2.5vw, 12.5px); flex: 1; }
            .layout-br .br-devices .device-btn { flex: 1; min-height: 0; height: 30%; }
            /* ===== 下左布局（3设备） ===== */
            .layout-bl .bl-sensors { position: absolute; top: 1.2vh; left: 0; display: flex; flex-direction: column; gap: 0.5vh; width: 45%; padding: 0 min(1.2vw, 6px) 0 min(2vw, 10px); box-sizing: border-box; z-index: 1; }
            .layout-bl .bl-person { position: absolute; right: max(7vw, 35px); top: 40%; transform: translateY(-50%); z-index: 1; }
            .layout-bl .bl-person .person-icon { margin-left: 0; }
            .layout-bl .bl-person .person-icon ha-icon { --mdc-icon-size: calc(var(--chip-h, 2.6vh) * 0.85); }
            .layout-bl .bl-devices { display: flex; justify-content: flex-start; align-items: flex-end; gap: 1.4vh; padding: 0 min(2.5vw, 12.5px) 1.2vh min(2.5vw, 12.5px); flex: 1; }
            .layout-bl .bl-devices .device-btn { flex: 1; min-height: 0; height: 30%; }
            /* ===== 右上角标 ===== */
            .corner-label-right { position: absolute; top: -1px; right: -1px; width: 0; height: 0; border-style: solid; border-width: var(--corner-size, 7.5vh) 0 0 var(--corner-size, 7.5vh); border-color: #00bcd4 transparent transparent transparent; }
            .corner-text-right { position: absolute; top: calc(var(--corner-size, 7.5vh) * 0.16); right: calc(var(--corner-size, 7.5vh) * 0.11); color: white; font-size: min(3vw, 15px); font-weight: bold; transform: rotate(45deg); transform-origin: center center; white-space: nowrap; }`;
    }

    static getConfigElement() {
        return document.createElement('xiaoshi-room-card-editor');
    }
    
    static getStubConfig() {
        return {
            name: '房间名',
            card_width: '46vw',
            card_height: '100%'
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

    /**
     * 根据设备的条件模式获取生效的状态条件列表
     * @param {Object} device - 设备配置
     */
    _getDeviceConditions(device) {
        const conditionMode = device.condition_mode || '';
        if (conditionMode === 'override') {
            // 覆盖：仅使用用户自定义条件
            return (device.status_conditions || '')
                .split(',').map(s => s.trim().toLowerCase()).filter(s => s);
        } else if (conditionMode === 'append') {
            // 新增：预置条件 + 用户自定义条件
            const preset = PRESET_ON_STATES.map(s => s.toLowerCase());
            const custom = (device.status_conditions || '')
                .split(',').map(s => s.trim().toLowerCase()).filter(s => s);
            return [...new Set([...preset, ...custom])];
        } else {
            // 默认（空）：仅使用预置条件
            return PRESET_ON_STATES.map(s => s.toLowerCase());
        }
    }

    /**
     * 计算设备下所有实体的开启数量（用于角标）
     */
    _countActiveEntities(device) {
        if (!device || !this.hass) return 0;
        const entities = device.entities || (device.entity ? [device.entity] : []);
        const conditions = this._getDeviceConditions(device);
        // 覆盖条件时，不使用 off 排除
        const conditionMode = device.condition_mode || '';
        let count = 0;
        for (const eid of entities) {
            const state = this.hass.states[eid];
            if (state) {
                const stateLower = state.state.toLowerCase();
                if (conditions.includes(stateLower)) {
                    count++;
                }
            }
        }
        return count;
    }

    /**
     * 判断设备是否有任一实体开启
     */
    _isDeviceOn(device) {
        return this._countActiveEntities(device) > 0;
    }

    /**
     * 点击设备：弹窗或自动生成实体弹窗
     */
    _onDeviceClick(device) {
        if (device.tap_action_enable === true || device.tap_action_enable === 'true' || this.config.tap_action_enable === true || this.config.tap_action_enable === 'true') {
            this._executeAction(device.tap_action || this.config.tap_action);
            if (this._handleClick) this._handleClick();
            return;
        }
        if (!device) return;
        const popupConfig = device.popup_cards || device.other_cards || device.popup;
        if (popupConfig) {
            let popupCards = [];
            if (typeof popupConfig === 'string') {
                try {
                    popupCards = yamlToJson(popupConfig);
                } catch (err) {
                    console.error('[XiaoshiRoomCard] 设备弹窗配置解析失败:', err);
                    return;
                }
            }
            this._handleClick();
            const serviceData = { card: popupCards };
            const popupWidth = device.popup_width || this.config.popup_width || 'min(95%, 475px)';
            const popupTop = device.popup_top || this.config.popup_top || '20px';
            if (popupWidth !== 'min(95%, 475px)') serviceData.popup_width = popupWidth;
            if (popupTop !== '20px') serviceData.popup_top = popupTop;
            // popup_background 处理
            const popupBg = device.popup_background || this.config.popup_background;
            if (popupBg === 'transparent') {
                serviceData.background = 'transparent';
            } else if (popupBg === 'theme') {
                const currentTheme = this._evaluateTheme ? this._evaluateTheme() : 'light';
                serviceData.background = currentTheme === 'light' ? 'rgb(255, 255, 255)' : 'rgb(50, 50, 50)';
            } else if (popupBg && popupBg !== '') {
                serviceData.background = popupBg;
            }
            this.hass.callService('popup_card', 'show', serviceData);
            return;
        }
        // 无弹窗配置时，自动为实体生成弹窗
        const entities = device.entities || [];
        if (entities.length === 0) return;
        this._handleClick();
        const cards = entities.map(entityId => ({
            type: 'entity',
            entity: entityId,
            state_color: true
        }));
        const serviceData = { card: cards };
        const popupWidth = this.config.popup_width || 'min(95%, 475px)';
        const popupTop = this.config.popup_top || '20px';
        if (popupWidth !== 'min(95%, 475px)') serviceData.popup_width = popupWidth;
        if (popupTop !== '20px') serviceData.popup_top = popupTop;
        // popup_background 处理
        const popupBg = this.config.popup_background;
        if (popupBg === 'transparent') {
            serviceData.background = 'transparent';
        } else if (popupBg === 'theme') {
            const currentTheme = this._evaluateTheme ? this._evaluateTheme() : 'light';
            serviceData.background = currentTheme === 'light' ? 'rgb(255, 255, 255)' : 'rgb(50, 50, 50)';
        } else if (popupBg && popupBg !== '') {
            serviceData.background = popupBg;
        }
        this.hass.callService('popup_card', 'show', serviceData);
    }

    /**
     * 获取传感器显示值
     */
    _getSensorValue(entityId) {
        if (!entityId || !this.hass) return null;
        return this.hass.states[entityId] || null;
    }

    /**
     * 根据卡片宽高计算三角形斜边角度
     * 三角形 = 40% card高度 × 40% card宽度
     */
    _calcCornerAngle(cardWidth, cardHeight) {
        const w = this._cssUnitToPx(cardWidth, window.innerWidth);
        const h = this._cssUnitToPx(cardHeight, window.innerHeight);
        if (!w || !h) return -45;
        return -Math.atan(h / w) * 180 / Math.PI;
    }

    /**
     * 将CSS单位转为像素值
     */
    _cssUnitToPx(value, baseSize) {
        if (!value) return 0;
        const num = parseFloat(value);
        if (isNaN(num)) return 0;
        if (value.includes('vw')) return num * window.innerWidth / 100;
        if (value.includes('vh')) return num * baseSize / 100;
        if (value.includes('%')) return num * baseSize / 100;
        return num; // px
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

    render() {
        if (!this.hass || !this.config) return html``;

        const name = this.config.name || '房间名';
        const cardWidth = this.config.card_width || '46vw';
        const cardHeight = this.config.card_height || '100%';
        const cardHeightPx = this._cssUnitToPx(cardHeight, this.parentElement?.offsetHeight || window.innerHeight);
        const chipH = Math.max(12, cardHeightPx * 0.12);

        const tempEntity = this.config.temperature;
        const humiEntity = this.config.humidity;
        const pm25Entity = this.config.pm25;
        const personEntity = this.config.person;
        const devices = this.config.devices || [];

        // 人在判断（与设备条件模式一致）
        const personState = personEntity && this.hass.states[personEntity]
            ? this.hass.states[personEntity].state : null;
        const personConditionMode = this.config.person_condition_mode || '';
        let personConditions;
        if (personConditionMode === 'override') {
            personConditions = (this.config.person_status_conditions || '')
                .split(',').map(s => s.trim().toLowerCase()).filter(s => s);
        } else if (personConditionMode === 'append') {
            const preset = PRESET_ON_STATES.map(s => s.toLowerCase());
            const custom = (this.config.person_status_conditions || '')
                .split(',').map(s => s.trim().toLowerCase()).filter(s => s);
            personConditions = [...new Set([...preset, ...custom])];
        } else {
            personConditions = PRESET_ON_STATES.map(s => s.toLowerCase());
        }
        // 人在判断：覆盖条件时跳过 off 排除
        const isHome = personState && personConditions.some(c => personState.toLowerCase().includes(c) || c.includes(personState.toLowerCase()));

        // 构建传感器列表（温度、湿度、pm2.5 按顺序，有实体才显示）
        const sensorItems = [];
        const _formatSensorVal = (rawState) => {
            if (rawState === 'unknown') return '未知';
            if (rawState === 'unavailable') return '离线';
            return rawState;
        };
        if (tempEntity) {
            const st = this._getSensorValue(tempEntity);
            const val = st ? _formatSensorVal(st.state) : '--';
            const unit = (st && st.state !== 'unknown' && st.state !== 'unavailable') ? (st.attributes.unit_of_measurement || '°C') : '';
            sensorItems.push({ icon: this.config.temperature_icon || 'mdi:thermometer', value: val, unit, color: this.config.temperature_color || '#d44e4e', popup: this.config.temperature_popup || null, holdPopup: this.config.temperature_hold_popup || null });
        }
        if (humiEntity) {
            const st = this._getSensorValue(humiEntity);
            const val = st ? _formatSensorVal(st.state) : '--';
            const unit = (st && st.state !== 'unknown' && st.state !== 'unavailable') ? (st.attributes.unit_of_measurement || '%') : '';
            sensorItems.push({ icon: this.config.humidity_icon || 'mdi:water-percent', value: val, unit, color: this.config.humidity_color || '#2196f3', popup: this.config.humidity_popup || null, holdPopup: this.config.humidity_hold_popup || null });
        }
        if (pm25Entity) {
            const st = this._getSensorValue(pm25Entity);
            const val = st ? _formatSensorVal(st.state) : '--';
            const unit = (st && st.state !== 'unknown' && st.state !== 'unavailable') ? (st.attributes.unit_of_measurement || 'μg/m³') : '';
            sensorItems.push({ icon: this.config.pm25_icon || 'mdi:blur', value: val, unit, color: this.config.pm25_color || '#4caf50', popup: this.config.pm25_popup || null, holdPopup: this.config.pm25_hold_popup || null });
        }

        // 设备布局：动态填充到6个
        // 中间列(左): device4, device5, device6  → grid col 1
        // 右侧列:    device1, device2, device3  → grid col 2
        // grid 顺序: row1: mid1, right1 | row2: mid2, right2 | row3: mid3, right3
        const d1 = devices[0] || null;
        const d2 = devices[1] || null;
        const d3 = devices[2] || null;
        const d4 = devices[3] || null;
        const d5 = devices[4] || null;
        const d6 = devices[5] || null;

        const theme = this._evaluateTheme();
        const defaultBg = theme === 'light' ? 'rgb(255, 255, 255,0.5)' : 'rgb(50, 50, 50,0.5)';
        const cardBg = theme === 'light'
            ? (this.config.card_bg_light || defaultBg)
            : (this.config.card_bg_dark || defaultBg);

        const cardStyle = [
            cardWidth ? `width:${cardWidth}` : '',
            cardHeight ? `height:${cardHeight}` : '',
            `background:${cardBg}`,
            'border-radius:min(3.5vw, 17.5px)',
            `--chip-h:${chipH}px`,
            `--corner-size:${cardHeightPx * 0.4}px`,
        ].filter(Boolean).join(';');

        const layout = this.config.device_layout || 'right_top';

        // 传感器渲染公共片段
        const sensorHtml = sensorItems.map(s => html`
            <div class="sensor-chip" style="background:${s.color};"
                @click="${() => s.popup ? this._showSensorPopup(s.popup) : null}"
                @pointerdown="${(e) => s.holdPopup ? this._onSensorHoldStart(e, s.holdPopup) : null}"
                @pointerup="${(e) => s.holdPopup ? this._onSensorHoldEnd(e) : null}">
                <span class="sensor-icon"><ha-icon icon="${s.icon}"></ha-icon></span>
                <span class="sensor-value">${s.value}${s.unit}</span>
            </div>
        `);

        // 人在图标渲染
        const personHtml = html`
            <div class="person-icon ${!personEntity ? 'person-hidden' : ''} ${isHome ? 'person-home' : ''}" style="color:${isHome ? (this.config.person_color || '#ff5722') : '#888'}${this.config.person_icon_size ? ';width:' + this.config.person_icon_size + 'vh;height:' + this.config.person_icon_size + 'vh' : ''}" @click="${() => this._togglePersonHistory()}" @pointerdown="${(e) => this.config.person_hold_popup ? this._onPersonHoldStart(e) : null}" @pointerup="${(e) => this.config.person_hold_popup ? this._onPersonHoldEnd(e) : null}">
                <ha-icon icon="${isHome ? (this.config.person_icon || 'mdi:motion-sensor') : 'mdi:motion-sensor-off'}" style="${this.config.person_icon_size ? '--mdc-icon-size:' + this.config.person_icon_size + 'vh' : ''}"></ha-icon>
            </div>
        `;

        // 下右布局 / 下左布局
        if (layout === 'bottom_right' || layout === 'bottom_left') {
            const isBR = layout === 'bottom_right';
            const layoutClass = isBR ? 'layout-br' : 'layout-bl';
            return html`
                <ha-card style="${cardStyle}">
                    <div class="card ${layoutClass}" style="${cardStyle}">
                        ${isBR ? html`
                            <!-- 左上角标 -->
                            <div class="corner-label" style="border-color:${this.config.name_color || '#00bcd4'} transparent transparent transparent"></div>
                            <div class="corner-text" style="transform:rotate(-45deg);${this.config.name_size ? 'font-size:' + this.config.name_size + 'vw' : ''}">${name}</div>
                            <!-- 右上传感器 -->
                            <div class="br-sensors">${sensorHtml}</div>
                            <!-- 人在图标（靠左） -->
                            <div class="br-person">${personHtml}</div>
                            <!-- 底部设备（从右往左：d3 d2 d1） -->
                            <div class="br-devices">
                                ${this._renderDevice(d3)}
                                ${this._renderDevice(d2)}
                                ${this._renderDevice(d1)}
                            </div>
                        ` : html`
                            <!-- 右上角标 -->
                            <div class="corner-label-right" style="border-color:${this.config.name_color || '#00bcd4'} transparent transparent transparent"></div>
                            <div class="corner-text-right" style="transform:rotate(45deg);${this.config.name_size ? 'font-size:' + this.config.name_size + 'vw' : ''}">${name}</div>
                            <!-- 左上传感器 -->
                            <div class="bl-sensors">${sensorHtml}</div>
                            <!-- 人在图标（靠右） -->
                            <div class="bl-person">${personHtml}</div>
                            <!-- 底部设备（从左往右：d1 d2 d3） -->
                            <div class="bl-devices">
                                ${this._renderDevice(d1)}
                                ${this._renderDevice(d2)}
                                ${this._renderDevice(d3)}
                            </div>
                        `}
                    </div>
                </ha-card>
            `;
        }

        // 原有布局（right_top / right_bottom）
        return html`
            <ha-card style="${cardStyle}">
                <div class="card" style="${cardStyle}">
                    <div class="left">
                        <div class="corner-label" style="border-color:${this.config.name_color || '#00bcd4'} transparent transparent transparent"></div>
                        <div class="corner-text" style="transform:rotate(-45deg);${this.config.name_size ? 'font-size:' + this.config.name_size + 'vw' : ''}">${name}</div>
                        <!-- 人在图标：有人时闪烁，没人时显示off图标 -->
                        ${personHtml}
                        <!-- 传感器条 -->
                        <div class="sensor-list">${sensorHtml}</div>
                    </div>
                    <div class="devices-area">
                        ${layout === 'right_bottom' ? html`
                            ${this._renderDevice(d6)}
                            ${this._renderDevice(d3)}
                            ${this._renderDevice(d5)}
                            ${this._renderDevice(d2)}
                            ${this._renderDevice(d4)}
                            ${this._renderDevice(d1)}
                        ` : html`
                            ${this._renderDevice(d4)}
                            ${this._renderDevice(d1)}
                            ${this._renderDevice(d5)}
                            ${this._renderDevice(d2)}
                            ${this._renderDevice(d6)}
                            ${this._renderDevice(d3)}
                        `}
                    </div>
                </div>
            </ha-card>
        `;
    }

    _renderDevice(device) {
        if (!device) return html`<div class="device-btn empty"></div>`;

        const isOn = this._isDeviceOn(device);
        const activeCount = this._countActiveEntities(device);
        const icon = device.icon || 'mdi:power-plug';
        const onColor = device.on_color || '#00bcd4';
        const theme = this._evaluateTheme();
        const defaultOffBg = theme === 'light' ? 'rgb(230,230,230)' : 'rgb(80,80,80)';
        const defaultOffIcon = theme === 'light' ? 'rgb(80,80,80)' : 'rgb(230,230,230)';
        const bgColor = isOn ? onColor : (device.off_color || defaultOffBg);
        const iconColor = isOn ? (device.icon_color || 'white') : defaultOffIcon;
        // 角标：只有当有开启的实体时显示
        const showBadge = activeCount > 0;
        const animateClass = (this.config.active_animation !== 'false' && isOn) ? 'anim-' + (this.config.animation_type || 'swing_bottom').replace(/_/g, '-') : '';

        return html`
            <button
                class="device-btn ${isOn ? 'active' : ''}"
                style="background:${bgColor}; color:${iconColor}"
                @click="${() => this._onDeviceClick(device)}"
                @pointerdown="${(e) => this._onDeviceHoldStart(e, device)}"
                @pointerup="${(e) => this._onDeviceHoldEnd(e)}"
            >
                <ha-icon icon="${icon}" class="${animateClass}" style="--mdc-icon-size:${device.icon_size || 2.8}vh;width:${device.icon_size || 2.8}vh;height:${device.icon_size || 2.8}vh"></ha-icon>
                ${showBadge ? html`<span class="badge" style="background:${device.badge_color || '#f44336'}">${activeCount}</span>` : html`<span class="badge hidden"></span>`}
            </button>
        `;
    }    // ===== 长按弹窗机制 =====
    // 传感器长按
    _onSensorHoldStart(e, holdPopup) {
        if (!holdPopup) return;
        this._holdTarget = 'sensor';
        this._holdData = holdPopup;
        this._holdTriggered = false;
        this._holdTimer = setTimeout(() => {
            this._holdTriggered = true;
            this._onHoldPopup();
        }, 500);
    }
    _onSensorHoldEnd(e) {
        if (this._holdTimer) {
            clearTimeout(this._holdTimer);
            this._holdTimer = null;
        }
    }
    // 设备长按
    _onDeviceHoldStart(e, device) {
        if (!device) return;
        const holdConfig = device.hold_popup_cards;
        if (!holdConfig || !holdConfig.trim()) return;
        this._holdTarget = 'device';
        this._holdData = holdConfig;
        this._holdDevice = device;
        this._holdTriggered = false;
        this._holdTimer = setTimeout(() => {
            this._holdTriggered = true;
            this._onHoldPopup();
        }, 500);
    }
    _onDeviceHoldEnd(e) {
        if (this._holdTimer) {
            clearTimeout(this._holdTimer);
            this._holdTimer = null;
        }
    }
    // 人在长按
    _onPersonHoldStart(e) {
        if (!this.config.person_hold_popup) return;
        this._holdTarget = 'person';
        this._holdData = this.config.person_hold_popup;
        this._holdTriggered = false;
        this._holdTimer = setTimeout(() => {
            this._holdTriggered = true;
            this._onHoldPopup();
        }, 500);
    }
    _onPersonHoldEnd(e) {
        if (this._holdTimer) {
            clearTimeout(this._holdTimer);
            this._holdTimer = null;
        }
    }
    // 统一长按弹窗
    _onHoldPopup() {
        const device = this._holdDevice || {};
        if (device.hold_action_enable === true || device.hold_action_enable === 'true' || this.config.hold_action_enable === true || this.config.hold_action_enable === 'true') {
            this._executeAction(device.hold_action || this.config.hold_action);
            if (this._handleClick) this._handleClick();
            return;
        }
        if (!this._holdData) return;
        const holdConfig = typeof this._holdData === 'string' ? this._holdData : '';
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
            const device = this._holdDevice || {};
            const popupWidth = device.hold_popup_width || this.config.hold_popup_width || this.config.popup_width || '95%';
            const popupTop = device.hold_popup_top || this.config.hold_popup_top || this.config.popup_top || '20px';
            if (popupWidth !== '95%') serviceData.popup_width = popupWidth;
            if (popupTop !== '20px') serviceData.popup_top = popupTop;
            // popup_background 处理
            const popupBg = device.popup_background || this.config.popup_background;
            if (popupBg === 'transparent') {
                serviceData.background = 'transparent';
            } else if (popupBg === 'theme') {
                const currentTheme = this._evaluateTheme ? this._evaluateTheme() : 'light';
                serviceData.background = currentTheme === 'light' ? 'rgb(255, 255, 255)' : 'rgb(50, 50, 50)';
            } else if (popupBg && popupBg !== '') {
                serviceData.background = popupBg;
            }
            h.callService('popup_card', 'show', serviceData);
        } catch (err) {
            console.error('解析长按弹窗卡片失败:', err);
        }
    }


    

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

    _showSensorPopup(popupConfig) {
        if (this.config.tap_action_enable === true || this.config.tap_action_enable === 'true') {
            this._executeAction(this.config.tap_action);
            if (this._handleClick) this._handleClick();
            return;
        }
        this._handleClick();
        let cards = [];
        if (typeof popupConfig === 'string') {
            try {
                cards = yamlToJson(popupConfig);
            } catch (err) {
                console.error('[XiaoshiRoomCard] 传感器弹窗配置解析失败:', err);
                return;
            }
        }
        const serviceData = { card: cards };
        const popupWidth = this.config.popup_width || 'min(95%, 475px)';
        const popupTop = this.config.popup_top || '20px';
        if (popupWidth !== 'min(95%, 475px)') serviceData.popup_width = popupWidth;
        if (popupTop !== '20px') serviceData.popup_top = popupTop;
        // popup_background 处理
        const popupBg = this.config.popup_background;
        if (popupBg === 'transparent') {
            serviceData.background = 'transparent';
        } else if (popupBg === 'theme') {
            const currentTheme = this._evaluateTheme ? this._evaluateTheme() : 'light';
            serviceData.background = currentTheme === 'light' ? 'rgb(255, 255, 255)' : 'rgb(50, 50, 50)';
        } else if (popupBg && popupBg !== '') {
            serviceData.background = popupBg;
        }
        this.hass.callService('popup_card', 'show', serviceData);
    }

    // ===== 人在历史记录 =====
    _togglePersonHistory() {
        if (!this.config.person) return;
        this._handleClick();
        if (this._showHistory) {
            this._closeHistoryOverlay();
            return;
        }
        this._showHistory = true;
        this._showHistoryOverlay();
        this._fetchPersonHistory();
    }

    async _fetchPersonHistory() {
        try {
            const entityId = this.config.person;
            const periodHours = this._historyFilterPeriod || 24;
            const endTime = new Date();
            const startTime = new Date(endTime.getTime() - periodHours * 60 * 60 * 1000);
            const startStr = startTime.toISOString();
            const endStr = endTime.toISOString();

            const data = await this.hass.callApi(
                'GET',
                `history/period/${startStr}?end_time=${endStr}&filter_entity_id=${entityId}&minimal_response&no_attributes`
            );

            const result = {};
            const allEntities = Array.isArray(data) ? data : [];
            for (const entityHistory of allEntities) {
                if (!entityHistory || entityHistory.length === 0) continue;
                const eId = entityHistory[0].entity_id;
                if (!eId) continue;
                const stateObj = this.hass.states[eId];
                const friendlyName = stateObj?.attributes?.friendly_name || eId;
                const rawEntries = entityHistory
                    .filter(entry => entry && entry.last_changed)
                    .sort((a, b) => new Date(b.last_changed) - new Date(a.last_changed));
                const entries = [];
                for (const entry of rawEntries) {
                    const last = entries[entries.length - 1];
                    const curRaw = (entry.state || '').trim();
                    const lastRaw = last ? (last.state || '').trim() : null;
                    if (last && lastRaw === curRaw) {
                        entries[entries.length - 1] = entry;
                    } else {
                        entries.push(entry);
                    }
                }
                if (entries.length > 0) {
                    result[eId] = { name: friendlyName, entries: entries };
                }
            }
            this._historyData = result;
        } catch (e) {
            console.error('[XiaoshiRoomCard] 获取人在历史记录失败:', e);
            this._historyData = {};
        } finally {
            this._historyLoading = false;
            this._updateHistoryContent();
        }
    }

    _showHistoryOverlay() {
        if (this._historyOverlayEl) return;
        const theme = this._evaluateTheme();
        const isDark = theme === 'dark';
        const personEntity = this.config.person;
        const stateObj = this.hass?.states?.[personEntity];
        const personName = stateObj?.attributes?.friendly_name || personEntity || '人在传感器';
        const textColor = isDark ? '#fff' : '#333';
        const bgColor = isDark ? '#2c2c2c' : '#fff';
        const borderColor = isDark ? '#aaa' : '#888';
        const btnBg = isDark ? '#444' : '#f0f0f0';
        const btnIconColor = isDark ? '#ccc' : '#666';
        const chipBg = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)';
        const chipActiveBg = this.config.person_color || '#ff5722';
        const chipActiveColor = '#fff';

        this._historyFilterPeriod = 24;

        const overlay = document.createElement('div');
        overlay.className = 'xiaoshi-history-overlay';
        overlay.style.cssText = 'position:fixed;top:0;left:0;width:100vw;height:100vh;background:rgba(0,0,0,0.5);z-index:99999;display:flex;align-items:flex-start;justify-content:center;padding-top:20px;-webkit-backdrop-filter: blur(10px);backdrop-filter: blur(10px);';
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) this._closeHistoryOverlay();
        });

        const dialog = document.createElement('div');
        dialog.style.cssText = `background:${bgColor};border-radius:16px;width:95vw;max-width:500px;max-height:85vh;display:flex;flex-direction:column;box-shadow:0 8px 40px rgba(0,0,0,0.25);`;

        const header = document.createElement('div');
        header.style.cssText = `display:flex;justify-content:space-between;align-items:center;padding:10px 0;margin:0 20px;border-bottom:1px solid ${borderColor};`;
        const title = document.createElement('span');
        title.style.cssText = `font-size:1.1rem;font-weight:700;color:${textColor};`;
        title.textContent = `${personName} - 历史记录`;
        const closeBtn = document.createElement('button');
        closeBtn.style.cssText = `width:36px;height:36px;border-radius:50%;border:none;background:${btnBg};cursor:default;display:flex;align-items:center;justify-content:center;transition:opacity 0.2s,transform 0.2s;`;
        closeBtn.innerHTML = `<ha-icon icon="mdi:close" style="--mdc-icon-size:20px;color:${btnIconColor};"></ha-icon>`;
        closeBtn.addEventListener('click', () => this._closeHistoryOverlay());
      closeBtn.addEventListener('mouseenter', () => { closeBtn.style.opacity = '0.85'; closeBtn.style.transform = 'scale(1.05)'; });
      closeBtn.addEventListener('mouseleave', () => { closeBtn.style.opacity = '1'; closeBtn.style.transform = 'scale(1)'; });
    closeBtn.addEventListener('mouseenter', () => { closeBtn.style.opacity = '0.85'; closeBtn.style.transform = 'scale(1.05)'; });
    closeBtn.addEventListener('mouseleave', () => { closeBtn.style.opacity = '1'; closeBtn.style.transform = 'scale(1)'; });
        header.appendChild(title);
        header.appendChild(closeBtn);

        const toolbar = document.createElement('div');
        toolbar.className = 'xiaoshi-history-toolbar';
        toolbar.style.cssText = `display:flex;align-items:center;gap:8px;padding:10px 5px;margin:0 20px;border-bottom:1px solid ${borderColor};flex-wrap:wrap;`;

        const timeRow = document.createElement('div');
        timeRow.style.cssText = 'display:flex;align-items:center;gap:8px;';
        const timeLabel = document.createElement('span');
        timeLabel.style.cssText = `font-size:0.75rem;color:${isDark?'#aaa':'#888'};flex-shrink:0;`;
        timeLabel.textContent = '时段:';
        timeRow.appendChild(timeLabel);

        const timeChips = document.createElement('div');
        timeChips.style.cssText = 'display:flex;gap:4px;flex-wrap:wrap;';
        timeChips.className = 'xiaoshi-time-chips';
        const periods = [
            { label: '1小时', value: 1 },
            { label: '6小时', value: 6 },
            { label: '24小时', value: 24 },
            { label: '3天', value: 72 },
            { label: '7天', value: 168 },
            { label: '10天', value: 240 }
        ];
        for (const p of periods) {
            const chip = this._buildFilterChip(p.label, p.value, chipBg, chipActiveBg, chipActiveColor, isDark);
chip.addEventListener('click', () => {
            this._handleClick();
            this._historyFilterPeriod = p.value;
            this._refreshHistoryChips(timeChips, this._historyFilterPeriod, chipBg, chipActiveBg, chipActiveColor, isDark, 'time');
                this._refetchWithFilters();
            });
            timeChips.appendChild(chip);
        }
        timeRow.appendChild(timeChips);
        toolbar.appendChild(timeRow);

        const body = document.createElement('div');
        body.className = 'xiaoshi-history-body';
        body.style.cssText = 'flex:1;overflow-y:auto;padding:6px 20px;';
        body.innerHTML = `<div style="display:flex;align-items:center;justify-content:center;padding:40px;color:${isDark?'#aaa':'#999'};"><ha-icon icon="mdi:loading" style="--mdc-icon-size:24px;"></ha-icon>&nbsp;加载中...</div>`;

        dialog.appendChild(header);
        dialog.appendChild(toolbar);
        dialog.appendChild(body);
        overlay.appendChild(dialog);
        document.body.appendChild(overlay);

        this._historyOverlayEl = overlay;
        this._historyBodyEl = body;
    }

    _updateHistoryContent() {
        if (!this._historyBodyEl) return;
        const theme = this._evaluateTheme();
        const isDark = theme === 'dark';
        const ac = this.config.person_color || '#ff5722';

        if (this._historyLoading) {
            this._historyBodyEl.innerHTML = `<div style="display:flex;align-items:center;justify-content:center;padding:40px;color:${isDark?'#aaa':'#999'};"><ha-icon icon="mdi:loading" style="--mdc-icon-size:24px;"></ha-icon>&nbsp;加载中...</div>`;
            return;
        }

        const items = Object.entries(this._historyData);
        if (items.length === 0) {
            this._historyBodyEl.innerHTML = `<div style="text-align:center;padding:40px;color:${isDark?'#aaa':'#999'};font-size:0.9rem;">暂无历史记录</div>`;
            return;
        }

        let html = '';
        for (const [entityId, data] of items) {
            const stateObj = this.hass.states[entityId];
            const icon = stateObj?.attributes?.icon || 'mdi:motion-sensor';

            let onTimeMs = 0;
            let offTimeMs = 0;
            const dedupedEntries = [];
            for (const entry of data.entries) {
                const last = dedupedEntries[dedupedEntries.length - 1];
                const curRaw = (entry.state || '').trim();
                const lastRaw = last ? (last.state || '').trim() : null;
                if (last && lastRaw === curRaw) {
                    dedupedEntries[dedupedEntries.length - 1] = entry;
                } else {
                    dedupedEntries.push(entry);
                }
            }
            const entriesWithDuration = [];
            for (let i = 0; i < dedupedEntries.length; i++) {
                const entry = dedupedEntries[i];
                const time = new Date(entry.last_changed);
                const prevEntry = dedupedEntries[i - 1];
                const endTime = prevEntry ? new Date(prevEntry.last_changed) : new Date();
                const durationMs = Math.max(0, endTime - time);
                entriesWithDuration.push({ entry, time, durationMs });
            }

            const preFiltered = [];
            for (const item of entriesWithDuration) {
                const norm = this._normalizePersonState(item.entry.state);
                if (norm === 'offline' && item.durationMs < 60000) continue;
                preFiltered.push(item);
            }
            const filtered = [];
            onTimeMs = 0; offTimeMs = 0;
            for (const item of preFiltered) {
                const last = filtered[filtered.length - 1];
                const curNorm = this._normalizePersonState(item.entry.state);
                const lastNorm = last ? this._normalizePersonState(last.entry.state) : null;
                if (last && lastNorm === curNorm) {
                    last.durationMs += item.durationMs;
                    last.time = item.time;
                } else {
                    filtered.push({ ...item });
                }
            }
            for (const item of filtered) {
                if (this._normalizePersonState(item.entry.state) === 'present') {
                    onTimeMs += item.durationMs;
                } else {
                    offTimeMs += item.durationMs;
                }
            }

            const totalMs = onTimeMs + offTimeMs;
            const onPercent = totalMs > 0 ? Math.round(onTimeMs / totalMs * 100) : 0;
            const offPercent = totalMs > 0 ? Math.round(offTimeMs / totalMs * 100) : 0;

            html += `<div style="margin:8px 0px;border-bottom:1px solid ${isDark?'#aaa':'#888'};">`;
            const periodHours = this._historyFilterPeriod || 24;
            const now = new Date();
            const rangeStart = new Date(now.getTime() - periodHours * 60 * 60 * 1000);
            const timelineBlocks = this._buildPersonTimeline(data.entries, rangeStart, now);
            html += `<div style="display:flex;align-items:center;gap:8px;margin-bottom:8px;">`;
            html += `<span style="display:flex;align-items:center;gap:4px;font-weight:700;font-size:0.85rem;color:${isDark?'#ddd':'#444'};white-space:nowrap;"><ha-icon icon="${icon}" style="--mdc-icon-size:16px;color:${ac};"></ha-icon>${data.name}</span>`;
            html += `<span style="font-size:0.7rem;color:${ac};white-space:nowrap;">${onPercent}%</span>`;
            html += `<span style="font-size:0.7rem;color:${isDark?'#aaa':'#888'};white-space:nowrap;">${offPercent}%</span>`;
            html += `<div style="flex:1;display:flex;height:8px;border-radius:3px;overflow:hidden;">${timelineBlocks}</div>`;
            html += `</div>`;
            for (const { entry, time, durationMs } of filtered) {
                const timeStr = time.toLocaleString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });
                const rawState = (entry.state || '').trim();
                const normState = this._normalizePersonState(rawState);
                const isPresent = normState === 'present';
                const isOffline = rawState === 'unavailable' || rawState === 'unknown';
                const stateLabel = isPresent ? '有人' : (isOffline ? '已离线' : '无人');
                const stateColor = this._getPersonStateColor(rawState);
                const durationStr = this._formatDuration(durationMs);
                const scRgb = this._colorToRgb(stateColor);
                const entryBg = isPresent ? (isDark ? `rgba(${scRgb},0.12)` : `rgba(${scRgb},0.08)`) : (isOffline ? (isDark ? 'rgba(244,67,54,0.12)' : 'rgba(244,67,54,0.06)') : (isDark ? '#383838' : '#f5f5f5'));
                html += `<div style="border-radius:10px;padding:1px 12px;margin-bottom:8px;background:${entryBg};"><div style="display:flex;justify-content:space-between;align-items:center;"><span style="font-size:0.8rem;padding:2px 4px;border-radius:10px;font-weight:500;color:${stateColor};">${stateLabel} · ${durationStr}</span><span style="font-size:0.75rem;color:${isDark?'#aaa':'#999'};">${timeStr}</span></div></div>`;
            }
            html += `</div>`;
        }
        this._historyBodyEl.innerHTML = html;
    }

    _closeHistoryOverlay() {
        this._handleClick();
        if (this._historyOverlayEl) {
            this._historyOverlayEl.remove();
            this._historyOverlayEl = null;
            this._historyBodyEl = null;
        }
        this._showHistory = false;
        this._historyData = {};
        this._historyLoading = false;
        this._historyFilterPeriod = 24;
    }

    _getPersonConditions() {
        const personConditionMode = this.config.person_condition_mode || '';
        if (personConditionMode === 'override') {
            return (this.config.person_status_conditions || '')
                .split(',').map(s => s.trim().toLowerCase()).filter(s => s);
        } else if (personConditionMode === 'append') {
            const preset = PRESET_ON_STATES.map(s => s.toLowerCase());
            const custom = (this.config.person_status_conditions || '')
                .split(',').map(s => s.trim().toLowerCase()).filter(s => s);
            return [...new Set([...preset, ...custom])];
        }
        return PRESET_ON_STATES.map(s => s.toLowerCase());
    }

    _normalizePersonState(state) {
        const s = (state || '').trim().toLowerCase();
        if (s === 'unavailable' || s === 'unknown') return 'offline';
        // 与isHome判断逻辑一致：子串匹配配置中的条件
        const conditions = this._getPersonConditions();
        if (conditions.some(c => s.includes(c) || c.includes(s))) return 'present';
        return 'absent';
    }

    _getPersonStateColor(state) {
        const s = (state || '').trim().toLowerCase();
        const ac = this.config.person_color || '#ff5722';
        if (s === 'unavailable' || s === 'unknown') return '#f44336';
        const conditions = this._getPersonConditions();
        if (conditions.some(c => s.includes(c) || c.includes(s))) return ac;
        return '#999';
    }

    _colorToRgb(color) {
        if (!color) return '255,87,34';
        if (color.startsWith('#')) {
            const hex = color.replace('#', '');
            // 支持 #rgb 简写
            const r = parseInt(hex.substring(0, 2), 16);
            const g = parseInt(hex.substring(2, 4), 16);
            const b = parseInt(hex.substring(4, 6), 16);
            if (isNaN(r) || isNaN(g) || isNaN(b)) return '255,87,34';
            return `${r},${g},${b}`;
        }
        // rgb/rgba 格式，提取数字
        const nums = color.match(/\d+/g);
        if (nums && nums.length >= 3) return `${nums[0]},${nums[1]},${nums[2]}`;
        return '255,87,34';
    }

    _buildPersonTimeline(entries, rangeStart, rangeEnd) {
        const rangeMs = rangeEnd - rangeStart;
        if (rangeMs <= 0 || entries.length === 0) return '';
        const sorted = [...entries].sort((a, b) => new Date(a.last_changed) - new Date(b.last_changed));
        const filtered = [];
        for (let i = 0; i < sorted.length; i++) {
            const entry = sorted[i];
            const segStart = new Date(entry.last_changed);
            const segEnd = i + 1 < sorted.length ? new Date(sorted[i + 1].last_changed) : rangeEnd;
            const durationMs = segEnd - segStart;
            const norm = this._normalizePersonState(entry.state);
            if (norm === 'offline' && durationMs < 60000) continue;
            filtered.push(entry);
        }
        const segments = [];
        for (let i = 0; i < filtered.length; i++) {
            const entry = filtered[i];
            const segStart = new Date(entry.last_changed);
            const segEnd = i + 1 < filtered.length ? new Date(filtered[i + 1].last_changed) : rangeEnd;
            const visibleStart = segStart < rangeStart ? rangeStart : segStart;
            const visibleEnd = segEnd > rangeEnd ? rangeEnd : segEnd;
            const durationMs = visibleEnd - visibleStart;
            if (durationMs > 0) {
                const rawState = (entry.state || '').trim();
                const percent = (durationMs / rangeMs) * 100;
                const lastSeg = segments[segments.length - 1];
                if (lastSeg && lastSeg.state === rawState) {
                    lastSeg.percent += percent;
                } else {
                    segments.push({ state: rawState, percent });
                }
            }
        }
        let blocks = '';
        for (const seg of segments) {
            const color = this._getPersonStateColor(seg.state);
            blocks += `<div style="width:${seg.percent}%;min-width:1px;height:100%;background:${color};flex-shrink:0;"></div>`;
        }
        return blocks;
    }

    _formatDuration(ms) {
        const periodHours = this._historyFilterPeriod || 24;
        const periodMs = periodHours * 60 * 60 * 1000;
        if (ms < 60000) return '少于1分钟';
        if (ms >= periodMs) {
            if (periodHours < 24) return `大于${periodHours}小时`;
            if (periodHours < 72) return `大于${periodHours}小时`;
            const days = Math.floor(periodHours / 24);
            return `大于${days}天`;
        }
        const minutes = Math.floor(ms / 60000);
        if (minutes < 60) return `${minutes}分钟`;
        const hours = Math.floor(minutes / 60);
        const remainMin = minutes % 60;
        if (hours < 24) return remainMin > 0 ? `${hours}小时${remainMin}分钟` : `${hours}小时`;
        const days = Math.floor(hours / 24);
        const remainHr = hours % 24;
        return remainHr > 0 ? `${days}天${remainHr}小时` : `${days}天`;
    }

    _buildFilterChip(label, value, chipBg, activeBg, activeColor, isDark) {
        const chip = document.createElement('span');
        chip.setAttribute('data-chip', '1');
        const isActive = (typeof value === 'number' && value === this._historyFilterPeriod);
        if (isActive) {
            chip.style.cssText = `padding:3px 10px;border-radius:12px;font-size:0.72rem;font-weight:500;cursor:default;white-space:nowrap;transition:opacity 0.2s,transform 0.2s;background:${activeBg};color:${activeColor};`;
        } else {
            chip.style.cssText = `padding:3px 10px;border-radius:12px;font-size:0.72rem;font-weight:500;cursor:default;white-space:nowrap;transition:opacity 0.2s,transform 0.2s;background:${chipBg};color:${isDark?'#ccc':'#555'};`;
        }
    chip.textContent = label;
    chip.addEventListener('mouseenter', () => { chip.style.opacity = '0.85'; chip.style.transform = 'scale(1.05)'; });
    chip.addEventListener('mouseleave', () => { chip.style.opacity = '1'; chip.style.transform = 'scale(1)'; });
    return chip;
    }

    _refreshHistoryChips(container, activePeriod, chipBg, activeBg, activeColor, isDark, mode) {
        const chips = container.querySelectorAll('[data-chip]');
        chips.forEach(chip => {
            const label = chip.textContent;
            if (mode === 'time') {
                const isActive = (label === '24小时' && activePeriod === 24) ||
                    (label === '1小时' && activePeriod === 1) ||
                    (label === '6小时' && activePeriod === 6) ||
                    (label === '3天' && activePeriod === 72) ||
                    (label === '7天' && activePeriod === 168) ||
                    (label === '10天' && activePeriod === 240);
                if (isActive) {
                    chip.style.background = activeBg;
                    chip.style.color = activeColor;
                } else {
                    chip.style.background = chipBg;
                    chip.style.color = isDark ? '#ccc' : '#555';
                }
            }
        });
    }

    _refetchWithFilters() {
        this._historyLoading = true;
        this._historyData = {};
        if (this._historyBodyEl) {
            this._updateHistoryContent();
        }
        this._fetchPersonHistory();
    }
}
customElements.define('xiaoshi-room-card', XiaoshiRoomCard);