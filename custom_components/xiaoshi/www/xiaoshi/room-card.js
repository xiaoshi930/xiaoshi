import { LitElement, html, css } from "https://unpkg.com/lit-element@2.4.0/lit-element.js?module";

window.customCards = window.customCards || [];
window.customCards.push({
    type: 'xiaoshi-room-card',
    name: '消逝房间卡片',
    description: '房间状态与设备控制卡片',
    preview: true
});

const PRESET_ON_STATES = [
    // 通用
    'on', 'open', 'opening','home',  'active', 'running',
    'detected', 'occupied', 'unlocked', 
    // 媒体
    'Playing','playing', '播放中',
    // 空调/HVAC
    'heat', 'cool', 'heating', 'cooling', 'dry', 'fan',
    'auto', 'heat_cool', 'fan_only',
    // 人在
    '有人', '2～5分钟无人移动',
    // 扫地机器人
    '正在拖地','正在扫地','启动','cleaning',
    // 厨房
    '烹饪中', '保温中', '预约中', 'Busy', 'Keep Warm'
];
const PRESET_OFF_STATES = [
    // 通用
    'off', 'closed', 'closing', 'not_home', 'unavailable', 'unknown', 'idle', 'standby',
    'unlocked',
    // 人在
    '无人',
    // 媒体
    'Paused', 'paused', '停止',
    // 空调/HVAC
    'off',
    // 扫地机器人
    'docked', 'charging', 'error', 'returning',
    // 厨房
    'Idle', 'Shut Off'
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
        return css`
            .form {
                display: flex;
                flex-direction: column;
                gap: 10px;
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
            .form-row input {
                flex: 1;
                padding: 6px 8px;
                border: 1px solid #ddd;
                border-radius: 4px;
            }
            .entity-row {
                display: flex;
                align-items: center;
                gap: 8px;
                position: relative;
            }
            .entity-row label {
                font-weight: bold;
                white-space: nowrap;
                min-width: 80px;
            }
            .entity-search {
                flex: 1;
                position: relative;
            }
            .entity-search input {
                width: 100%;
                padding: 6px 8px;
                border: 1px solid #ddd;
                border-radius: 4px;
                box-sizing: border-box;
            }
            .entity-row input[type="text"] {
                padding: 6px 8px;
                border: 1px solid #ddd;
                border-radius: 4px;
                box-sizing: border-box;
            }
            .entity-row input[type="color"] {
                width: 34px;
                height: 30px;
                padding: 1px;
                border: 1px solid #ddd;
                border-radius: 4px;
                flex: none;
                box-sizing: border-box;
            }
            .entity-dropdown {
                position: absolute;
                top: 100%;
                left: 0;
                right: 0;
                max-height: 200px;
                overflow-y: auto;
                background: var(--card-background-color, #fff);
                border: 1px solid #ddd;
                border-radius: 4px;
                box-shadow: 0 2px 8px rgba(0,0,0,0.15);
                z-index: 1000;
                margin-top: 2px;
            }
            .entity-option {
                display: flex;
                align-items: center;
                justify-content: space-between;
                padding: 6px 10px;
                cursor: pointer;
                border-bottom: 1px solid #eee;
            }
            .entity-option.selected {
                background: #e3f2fd;
            }
            .entity-info {
                display: flex;
                align-items: center;
                gap: 8px;
                flex: 1;
                min-width: 0;
            }
            .entity-info ha-icon {
                flex: none;
            }
            .entity-details {
                flex: 1;
                min-width: 0;
            }
            .entity-name {
                font-weight: 500;
                font-size: 13px;
                overflow: hidden;
                text-overflow: ellipsis;
                white-space: nowrap;
            }
            .entity-id {
                font-size: 11px;
                color: #888;
                font-family: monospace;
                overflow: hidden;
                text-overflow: ellipsis;
                white-space: nowrap;
            }
            .no-results {
                padding: 10px;
                text-align: center;
                color: #888;
                font-size: 13px;
            }
            .device-section {
                border: 1px solid #ddd;
                border-radius: 8px;
                padding: 8px 10px;
                display: flex;
                flex-direction: column;
                gap: 6px;
            }
            .device-row {
                display: flex;
                align-items: center;
                gap: 6px;
            }
            .device-title {
                font-weight: bold;
                font-size: 13px;
                color: var(--primary-text-color);
                white-space: nowrap;
                min-width: 50px;
            }
            .device-section input[type="text"] {
                flex: 1;
                min-width: 0;
                padding: 5px 6px;
                border: 1px solid #ddd;
                border-radius: 4px;
            }
            .device-section input[type="color"] {
                width: 34px;
                height: 30px;
                padding: 1px;
                flex: none;
            }
            .device-remove {
                background: #f44336;
                color: white;
                border: none;
                border-radius: 4px;
                padding: 2px 8px;
                cursor: pointer;
                font-size: 12px;
                white-space: nowrap;
                flex: none;
            }
            .device-remove:hover {
                background: #d32f2f;
            }
            .add-device-btn {
                background: #4caf50;
                color: white;
                border: none;
                border-radius: 6px;
                padding: 8px 16px;
                cursor: pointer;
                font-size: 14px;
                font-weight: 500;
                text-align: center;
            }
            .add-device-btn:hover {
                background: #388e3c;
            }
        `;
    }

    constructor() {
        super();
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
                    <input type="text" name="person_icon" .value="${c.person_icon || ''}" @change="${this._valueChanged}" placeholder="mdi图标" style="width:90px;flex:none" />
                    <input type="color" name="person_color" .value="${c.person_color || '#ff5722'}" @change="${this._valueChanged}" />
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
            config: { type: Object }
        };
    }

    static get styles() {
        return css`
            :host {
                display: block;
                height: 100%;
                min-height: 0;
            }
            ha-card {
                border: none;
                box-shadow: none;
            }
            .card {
                background: transparent;
                border-radius: 3.5vw;
                position: relative;
                overflow: hidden;
                display: flex;
                height: 100%;
                min-height: 0;
                font-family: var(--paper-font-body1_-_font-family);
            }
            /* ===== 左侧区域 ===== */
            .left {
                width: 45%;
                padding: 1.2vh 1.2vw 1.2vh 2vw;
                display: flex;
                flex-direction: column;
                position: relative;
                z-index: 1;
                box-sizing: border-box;
            }
            .corner-label {
                position: absolute;
                top: -1px;
                left: -1px;
                width: 0;
                height: 0;
                border-style: solid;
                border-width: var(--corner-size, 7.5vh) var(--corner-size, 7.5vh) 0 0;
                border-color: #00bcd4 transparent transparent transparent;
            }
            .corner-text {
                position: absolute;
                top: calc(var(--corner-size, 7.5vh) * 0.16);
                left: calc(var(--corner-size, 7.5vh) * 0.11);
                color: white;
                font-size: 3vw;
                font-weight: bold;
                transform-origin: center center;
                white-space: nowrap;
            }
            /* 人在图标 */
            .person-icon {
                margin-top: var(--chip-h, 2.6vh);
                margin-left: 7vw;
                margin-right: 0;
                color: #ff5722;
                display: flex;
                align-items: center;
                justify-content: center;
                width: var(--chip-h, 2.6vh);
                height: var(--chip-h, 2.6vh);
            }
            .person-icon ha-icon {
                --mdc-icon-size: calc(var(--chip-h, 2.6vh) * 0.75);
            }
            @keyframes person-blink {
                0%, 100% { opacity: 1; }
                50% { opacity: 0.3; }
            }
            .person-home {
                animation: person-blink 0.6s ease-in-out infinite;
            }
            .person-hidden {
                display: none;
            }
            /* 传感器条 */
            .sensor-list {
                display: flex;
                flex-direction: column;
                gap: 0.5vh;
                margin-top: auto;
                margin-bottom: 0;
            }
            .sensor-chip {
                border-radius: 4vw;
                padding: 0 2vw;
                height: calc(var(--chip-h, 2.6vh) * 1.1);
                color: white;
                font-size: calc(var(--chip-h, 2.6vh) * 0.5);
                font-weight: 500;
                display: flex;
                align-items: center;
                position: relative;
                box-sizing: border-box;
                cursor: none;
            }
            .sensor-chip:active {
                transform: scale(0.95);
                box-shadow: 0 2px 12px rgba(255, 255, 255, 0.4), 0 2px 8px rgba(0, 0, 0, 0.4);
            }
            .sensor-icon {
                display: flex;
                align-items: center;
                z-index: 1;
            }
            .sensor-icon ha-icon {
                --mdc-icon-size: calc(var(--chip-h, 2.6vh) * 0.6);
            }
            .sensor-value {
                flex: 1;
                text-align: center;
            }
            /* ===== 设备区域 (中间+右侧两列) ===== */
            .devices-area {
                flex: 1;
                display: grid;
                grid-template-columns: 1fr 1fr;
                grid-template-rows: repeat(3, 1fr);
                gap: 1.4vh;
                padding: 1.2vh 2.5vw 1.2vh 1.2vw;
                align-content: center;
            }
            /* 单个设备按钮 */
            .device-btn {
                position: relative;
                background: #333;
                border-radius: 2vw;
                display: flex;
                align-items: center;
                justify-content: center;
                color: #888;
                cursor: none;
                transition: background 0.25s, color 0.25s;
                border: none;
                outline: none;
                padding: 0;
            }
            .device-btn ha-icon {
                --mdc-icon-size: 2.8vh;
            }
            .device-btn:not(.empty):active {
                transform: scale(0.95);
                box-shadow: 0 2px 12px rgba(255, 255, 255, 0.4), 0 2px 8px rgba(0, 0, 0, 0.4);
            }
            .device-btn.empty {
                background: transparent;
                cursor: default;
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
            .device-btn ha-icon.anim-swing-bottom {
                animation: swingBottom 2s ease-in-out infinite;
                transform-origin: bottom center;
            }
            .device-btn ha-icon.anim-swing-top {
                animation: swingTop 2s ease-in-out infinite;
                transform-origin: top center;
            }
            .device-btn ha-icon.anim-shake-x {
                animation: shakeX 1.5s ease-in-out infinite;
            }
            .device-btn ha-icon.anim-shake-y {
                animation: shakeY 1.5s ease-in-out infinite;
            }
            /* 右上角圆形角标 */
            .badge {
                position: absolute;
                top: -1vw;
                right: -1vw;
                width: 3.8vw;
                height: 3.8vw;
                border-radius: 50%;
                background: #f44336;
                color: white;
                font-size: 2.3vw;
                font-weight: 600;
                display: flex;
                align-items: center;
                justify-content: center;
                line-height: 1;
            }
            .badge.hidden {
                display: none;
            }

            /* ===== 下右布局（3设备） ===== */
            .layout-br .br-sensors {
                position: absolute;
                top: 1.2vh;
                right: 0;
                display: flex;
                flex-direction: column;
                gap: 0.5vh;
                width: 45%;
                padding: 0 1.2vw 0 2vw;
                box-sizing: border-box;
                z-index: 1;
            }
            .layout-br .br-person {
                position: absolute;
                left: 7vw;
                top: 40%;
                transform: translateY(-50%);
                z-index: 1;
            }
            .layout-br .br-person .person-icon {
                margin-left: 0;
            }
            .layout-br .br-devices {
                display: flex;
                justify-content: flex-end;
                align-items: flex-end;
                gap: 1.4vh;
                padding: 0 2.5vw 1.2vh 2.5vw;
                flex: 1;
            }
            .layout-br .br-devices .device-btn {
                flex: 1;
                min-height: 0;
                height: 30%;
            }

            /* ===== 下左布局（3设备） ===== */
            .layout-bl .bl-sensors {
                position: absolute;
                top: 1.2vh;
                left: 0;
                display: flex;
                flex-direction: column;
                gap: 0.5vh;
                width: 45%;
                padding: 0 1.2vw 0 2vw;
                box-sizing: border-box;
                z-index: 1;
            }
            .layout-bl .bl-person {
                position: absolute;
                right: 7vw;
                top: 40%;
                transform: translateY(-50%);
                z-index: 1;
            }
            .layout-bl .bl-person .person-icon {
                margin-left: 0;
            }
            .layout-bl .bl-devices {
                display: flex;
                justify-content: flex-start;
                align-items: flex-end;
                gap: 1.4vh;
                padding: 0 2.5vw 1.2vh 2.5vw;
                flex: 1;
            }
            .layout-bl .bl-devices .device-btn {
                flex: 1;
                min-height: 0;
                height: 30%;
            }

            /* ===== 右上角标 ===== */
            .corner-label-right {
                position: absolute;
                top: -1px;
                right: -1px;
                width: 0;
                height: 0;
                border-style: solid;
                border-width: var(--corner-size, 7.5vh) 0 0 var(--corner-size, 7.5vh);
                border-color: #00bcd4 transparent transparent transparent;
            }
            .corner-text-right {
                position: absolute;
                top: calc(var(--corner-size, 7.5vh) * 0.16);
                right: calc(var(--corner-size, 7.5vh) * 0.11);
                color: white;
                font-size: 3vw;
                font-weight: bold;
                transform: rotate(45deg);
                transform-origin: center center;
                white-space: nowrap;
            }
        `;
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
        // 覆盖条件时，不使用 PRESET_OFF_STATES 排除
        const conditionMode = device.condition_mode || '';
        const offStates = conditionMode === 'override' ? [] : PRESET_OFF_STATES.map(s => s.toLowerCase());
        let count = 0;
        for (const eid of entities) {
            const state = this.hass.states[eid];
            if (state) {
                const stateLower = state.state.toLowerCase();
                // PRESET_OFF_STATES 优先排除：模糊匹配到OFF条件则不计入开启
                if (offStates.some(c => stateLower.includes(c) || c.includes(stateLower))) {
                    continue;
                }
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
        if (!device) return;
        if (device.popup) {
            let popupCards = [];
            if (typeof device.popup === 'string') {
                try {
                    popupCards = this._parseYamlCards(device.popup);
                } catch (err) {
                    console.error('[XiaoshiRoomCard] 设备弹窗配置解析失败:', err);
                    return;
                }
            }
            this._handleClick();
            const serviceData = { card: popupCards };
            const popupWidth = this.config.popup_width || '95%';
            const popupTop = this.config.popup_top || '20px';
            if (popupWidth !== '95%') serviceData.popup_width = popupWidth;
            if (popupTop !== '20px') serviceData.popup_top = popupTop;
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
        const popupWidth = this.config.popup_width || '95%';
        const popupTop = this.config.popup_top || '20px';
        if (popupWidth !== '95%') serviceData.popup_width = popupWidth;
        if (popupTop !== '20px') serviceData.popup_top = popupTop;
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
        // PRESET_OFF_STATES 优先排除（模糊匹配），覆盖条件时跳过
        const presetOffStates = personConditionMode === 'override' ? [] : PRESET_OFF_STATES.map(s => s.toLowerCase());
        const isPersonOff = personState && presetOffStates.some(c => personState.toLowerCase().includes(c) || c.includes(personState.toLowerCase()));
        const isHome = !isPersonOff && personState && personConditions.some(c => personState.toLowerCase().includes(c) || c.includes(personState.toLowerCase()));

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
            sensorItems.push({ icon: this.config.temperature_icon || 'mdi:thermometer', value: val, unit, color: this.config.temperature_color || '#d44e4e', popup: this.config.temperature_popup || null });
        }
        if (humiEntity) {
            const st = this._getSensorValue(humiEntity);
            const val = st ? _formatSensorVal(st.state) : '--';
            const unit = (st && st.state !== 'unknown' && st.state !== 'unavailable') ? (st.attributes.unit_of_measurement || '%') : '';
            sensorItems.push({ icon: this.config.humidity_icon || 'mdi:water-percent', value: val, unit, color: this.config.humidity_color || '#2196f3', popup: this.config.humidity_popup || null });
        }
        if (pm25Entity) {
            const st = this._getSensorValue(pm25Entity);
            const val = st ? _formatSensorVal(st.state) : '--';
            const unit = (st && st.state !== 'unknown' && st.state !== 'unavailable') ? (st.attributes.unit_of_measurement || 'μg/m³') : '';
            sensorItems.push({ icon: this.config.pm25_icon || 'mdi:blur', value: val, unit, color: this.config.pm25_color || '#4caf50', popup: this.config.pm25_popup || null });
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
            'border-radius:3.5vw',
            `--chip-h:${chipH}px`,
            `--corner-size:${cardHeightPx * 0.4}px`,
        ].filter(Boolean).join(';');

        const layout = this.config.device_layout || 'right_top';

        // 传感器渲染公共片段
        const sensorHtml = sensorItems.map(s => html`
            <div class="sensor-chip" style="background:${s.color};"
                @click="${() => s.popup ? this._showSensorPopup(s.popup) : null}">
                <span class="sensor-icon"><ha-icon icon="${s.icon}"></ha-icon></span>
                <span class="sensor-value">${s.value}${s.unit}</span>
            </div>
        `);

        // 人在图标渲染
        const personHtml = html`
            <div class="person-icon ${!personEntity ? 'person-hidden' : ''} ${isHome ? 'person-home' : ''}" style="color:${isHome ? (this.config.person_color || '#ff5722') : '#888'}">
                <ha-icon icon="${isHome ? (this.config.person_icon || 'mdi:motion-sensor') : 'mdi:motion-sensor-off'}"></ha-icon>
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
            >
                <ha-icon icon="${icon}" class="${animateClass}" style="--mdc-icon-size:${device.icon_size || 2.8}vh;width:${device.icon_size || 2.8}vh;height:${device.icon_size || 2.8}vh"></ha-icon>
                ${showBadge ? html`<span class="badge" style="background:${device.badge_color || '#f44336'}">${activeCount}</span>` : html`<span class="badge hidden"></span>`}
            </button>
        `;
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
        this._handleClick();
        let cards = [];
        if (typeof popupConfig === 'string') {
            try {
                cards = this._parseYamlCards(popupConfig);
            } catch (err) {
                console.error('[XiaoshiRoomCard] 传感器弹窗配置解析失败:', err);
                return;
            }
        }
        const serviceData = { card: cards };
        const popupWidth = this.config.popup_width || '95%';
        const popupTop = this.config.popup_top || '20px';
        if (popupWidth !== '95%') serviceData.popup_width = popupWidth;
        if (popupTop !== '20px') serviceData.popup_top = popupTop;
        this.hass.callService('popup_card', 'show', serviceData);
    }

    // ===== YAML 解析方法（参照 chart-button） =====
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
            console.error('[XiaoshiRoomCard] YAML解析错误:', error);
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
customElements.define('xiaoshi-room-card', XiaoshiRoomCard);