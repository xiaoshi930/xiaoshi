const whenDefined = (t) => customElements.whenDefined(t);
await Promise.race([whenDefined("ha-card"), whenDefined("ha-panel-lovelace")]);
const LitElement = window.LitElement || Object.getPrototypeOf(customElements.get("ha-card"));
const html = LitElement.prototype.html;
const css = LitElement.prototype.css;
import { yamlToJson } from '../function/function.js';

window.customCards = window.customCards || [];
window.customCards.push(
    {
        type: 'xiaoshi-avatar-card',
        name: '消逝手机端头像卡片',
        description: '消逝手机端头像卡片',
        preview: true
    },    
    {
        type: 'xiaoshi-avatar-history-card',
        name: '消逝头像弹窗-人员历史时间条',
        description: '在弹窗中显示人员历史时间条',
        preview: false
});


class XiaoshiAvatarCardEditor extends LitElement {
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
            .person-section {
                border: 1px solid #444;
                border-radius: 6px;
                padding: 8px;
                position: relative;
            }
            .person-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 6px;
            }
            .person-header span {
                font-weight: bold;
                font-size: 13px;
                color: #ff9800;
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
        `;
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

        this._fireConfigChanged();
    }

    _personValueChanged(index, e) {
        const { name, value } = e.target;
        if (!name) return;

        const persons = [...(this.config.persons || [])];
        persons[index] = { ...(persons[index] || {}), [name]: value };
        this.config = { ...this.config, persons };
        this._fireConfigChanged();
    }

    _addPerson() {
        const persons = [...(this.config.persons || [])];
        persons.push({
        });
        this.config = { ...this.config, persons };
        this._fireConfigChanged();
    }

    _removePerson(index) {
        const persons = [...(this.config.persons || [])];
        persons.splice(index, 1);
        this.config = { ...this.config, persons };
        this._fireConfigChanged();
    }

    _fireConfigChanged() {
        this.dispatchEvent(new CustomEvent('config-changed', {
            detail: { config: this.config },
            bubbles: true,
            composed: true
        }));
    }

    _renderPersonSection(p, index) {
        return html`
            <div class="person-section">
                <div class="person-header">
                    <span>人员 ${index + 1}</span>
                    <button class="btn-remove" @click="${() => this._removePerson(index)}">删除</button>
                </div>

                <div class="form-row">
                    <label>人员实体</label>
                    <input type="text" name="person_entity" .value="${p.person_entity || ''}" @change="${(e) => this._personValueChanged(index, e)}" placeholder="person.xxx" />
                </div>
                <div class="form-row">
                    <label>设备IP实体</label>
                    <input type="text" name="tracker_entity" .value="${p.tracker_entity || ''}" @change="${(e) => this._personValueChanged(index, e)}" placeholder="device_tracker.xxx" />
                </div>

                <div class="form-row">
                    <label>距家计算</label>
                    <select name="distance_method" @change="${(e) => this._personValueChanged(index, e)}" style="flex:1;padding:6px 0px;border:1px solid #ddd;border-radius:4px;">
                        <option value="nav" .selected="${p.distance_method === 'nav' || !p.distance_method}">导航通勤数据</option>
                        <option value="ha" .selected="${p.distance_method === 'ha'}">HAGPS直线距离</option>
                    </select>
                </div>
                ${p.distance_method !== 'ha' ? html`
                <div class="form-row">
                    <label>导航实体</label>
                    <input type="text" name="nav_entity" .value="${p.nav_entity || ''}" @change="${(e) => this._personValueChanged(index, e)}" placeholder="高德/腾讯导航实体" />
                </div>
                <div class="form-row">
                    <label>通勤方式</label>
                    <select name="commute_mode" @change="${(e) => this._personValueChanged(index, e)}" style="flex:1;padding:6px 0px;border:1px solid #ddd;border-radius:4px;">
                        <option value="driving" .selected="${p.commute_mode === 'driving' || !p.commute_mode}">驾车</option>
                        <option value="transit" .selected="${p.commute_mode === 'transit'}">公交</option>
                        <option value="cycling" .selected="${p.commute_mode === 'cycling'}">骑行</option>
                        <option value="walking" .selected="${p.commute_mode === 'walking'}">步行</option>
                    </select>
                </div>
                ` : ''}
                ${p.distance_method === 'ha' ? html`
                <div class="form-row">
                    <label>设备实体</label>
                    <input type="text" name="gps_tracker_entity" .value="${p.gps_tracker_entity || ''}" @change="${(e) => this._personValueChanged(index, e)}" placeholder="device_tracker.xxx(app)" />
                </div>
                ` : ''}
                <div class="form-row">
                    <label>家Zone实体</label>
                    <input type="text" name="zone_entity" .value="${p.zone_entity || ''}" @change="${(e) => this._personValueChanged(index, e)}" placeholder="zone.home" />
                </div>

                <div class="form-row">
                    <label>万年历实体</label>
                    <input type="text" name="calendar_entity" .value="${p.calendar_entity || ''}" @change="${(e) => this._personValueChanged(index, e)}" placeholder="calendar.xxx" />
                </div>
                <div class="form-row">
                    <label>生日索引</label>
                    <input type="number" name="birthday_index" .value="${p.birthday_index ?? 0}" @change="${(e) => this._personValueChanged(index, e)}" placeholder="0" style="max-width:60px" min="0" />
                </div>

                <div class="form-row">
                    <label>圆环类型</label>
                    <select name="ring_type" @change="${(e) => this._personValueChanged(index, e)}" style="flex:1;padding:6px 0px;border:1px solid #ddd;border-radius:4px;">
                        <option value="none" .selected="${p.ring_type === 'none' || !p.ring_type}">不显示</option>
                        <option value="battery" .selected="${p.ring_type === 'battery'}">电量</option>
                        <option value="storage" .selected="${p.ring_type === 'storage'}">存储</option>
                    </select>
                </div>
                ${p.ring_type === 'battery' ? html`
                <div class="form-row">
                    <label>电量实体</label>
                    <input type="text" name="battery_entity" .value="${p.battery_entity || ''}" @change="${(e) => this._personValueChanged(index, e)}" placeholder="sensor.xxx_battery" />
                </div>
                ` : ''}
                ${p.ring_type === 'storage' ? html`
                <div class="form-row">
                    <label>存储实体</label>
                    <input type="text" name="storage_entity" .value="${p.storage_entity || ''}" @change="${(e) => this._personValueChanged(index, e)}" placeholder="sensor.xxx_internal_storage" />
                </div>
                ` : ''}
            </div>
        `;
    }

    render() {
        if (!this.hass || !this.config) return html``;
        const c = this.config;
        const persons = c.persons || [];

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
                    <label style="min-width:auto">在家</label>
                    <input type="color" name="home_color" .value="${c.home_color || '#20bef3'}" @change="${this._valueChanged}" title="在家颜色" />
                    <label style="min-width:auto">离家</label>
                    <input type="color" name="away_color" .value="${c.away_color || '#f44336'}" @change="${this._valueChanged}" title="离家颜色" />
                </div>

                <div class="form-row">
                    <label>卡片宽度</label>
                    <input type="text" name="card_width" .value="${c.card_width || ''}" @change="${this._valueChanged}" placeholder="20vw" style="max-width:100px" />
                    <label style="min-width:auto">卡片高度</label>
                    <input type="text" name="card_height" .value="${c.card_height || ''}" @change="${this._valueChanged}" placeholder="12.5vh" style="max-width:100px" />
                </div>

                <div class="form-row">
                    <label>弹窗宽度</label>
                    <input type="text" name="popup_width" .value="${c.popup_width || ''}" @change="${this._valueChanged}" placeholder="95%" style="max-width:100px" />
                    <label style="min-width:auto">弹窗位置</label>
                    <input type="text" name="popup_top" .value="${c.popup_top || ''}" @change="${this._valueChanged}" placeholder="20px" style="max-width:100px" />
                </div>
                <div class="form-row">
                    <label>历史记录</label>
                    <select name="show_popup_history" @change="${this._valueChanged}" style="flex:1;padding:6px 0px;border:1px solid #ddd;border-radius:4px;">
                        <option value="true" .selected="${c.show_popup_history !== 'false'}">显示</option>
                        <option value="false" .selected="${c.show_popup_history === 'false'}">隐藏</option>
                    </select>
                </div>
                <div class="form-row">
                    <label>弹窗地图</label>
                    <select name="show_popup_map" @change="${this._valueChanged}" style="flex:1;padding:6px 0px;border:1px solid #ddd;border-radius:4px;">
                        <option value="true" .selected="${c.show_popup_map !== 'false'}">显示</option>
                        <option value="false" .selected="${c.show_popup_map === 'false'}">隐藏</option>
                    </select>
                </div>
                <div class="form-row">
                    <label>追踪路径时间</label>
                    <input type="number" name="track_hours" .value="${c.track_hours || 24}" @change="${this._valueChanged}" placeholder="24" style="max-width:80px" min="1" max="144" />
                    <span style="font-size:12px;color:#888;">小时</span>
                </div>

                <div class="form-row" style="flex-direction:column;align-items:stretch;">
                    <label style="margin-bottom:4px;">附加卡片配置（YAML格式，参照balance-button的other_cards）</label>
                    <textarea name="other_cards" .value="${c.other_cards || ''}" @change="${this._valueChanged}" placeholder="# 示例配置：添加button卡片
- type: custom:button-card
  template: 测试模板(最好引用模板，否则大概率会报错)" style="min-height:80px;resize:vertical;padding:6px 8px;border:1px solid #ddd;border-radius:4px;font-family:inherit;"></textarea>
                </div>

                ${persons.map((p, i) => this._renderPersonSection(p, i))}
                <button class="btn-add" @click="${this._addPerson}" style="width:100%;">+ 添加人员</button>
            </div>
        `;
    }
}
customElements.define('xiaoshi-avatar-card-editor', XiaoshiAvatarCardEditor);

class XiaoshiAvatarCard extends LitElement {

    static get properties() {
        return {
            hass: { type: Object },
            config: { type: Object },
            _activeIndex: { type: Number },
            _showPopupHistory: { type: Boolean },
            _historyData: { type: Object },
            _historyLoading: { type: Boolean }
        };
    }

    constructor() {
        super();
        this._activeIndex = 0;
        this._touchStartX = 0;
        this._touchStartY = 0;
        this._swipeDetected = false;
        this._showPopupHistory = false;
        this._historyData = {};
        this._historyLoading = false;
        this._popupHistoryFilterPerson = '';
        this._popupHistoryFilterPeriod = 24;
    }

    static get styles() {
        return css`
            :host {
                display: block;
                height: 100%;
                max-width: 90px;
            }
            ha-card {
                border-radius: min(6vw, 30px) !important;
                overflow: visible;
                max-width: 90px;
            }
            .card-wrapper {
                max-width: 90px;
                position: relative;
                width: 100%;
                height: 100%;
                overflow: visible;
                touch-action: pan-y;
            }
            .card-item {  
                border-radius: min(6vw, 30px);
                overflow: hidden;
                display: flex;
                flex-direction: column;
                align-items: center;
                padding-top: 8%;
                padding-bottom: 4%;
                font-family: var(--paper-font-body1_-_font-family);
                width: 60%;
                height: 100%;
                max-height: 100%;
                box-sizing: border-box;
                transform-origin: top center;
                transition: left 0.35s ease, transform 0.35s ease, opacity 0.35s ease, background-color 0.35s ease;
                cursor: none;
            }
            .card-item:active {
              transform: scale(0.95);
              box-shadow: 0 2px 12px rgba(255, 255, 255, 0.4), 0 2px 8px rgba(0, 0, 0, 0.4);
            }
            .avatar-container {
                position: relative;
                display: flex;
                align-items: center;
                justify-content: center;
                flex-shrink: 0;
            }
            .avatar-ring-svg {
                position: absolute;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                transform: rotate(-90deg);
            }
            .avatar-ring-bg {
                fill: none;
                stroke: rgba(255,255,255,0.2);
            }
            .avatar-ring-progress {
                fill: none;
                stroke-linecap: round;
                transition: stroke-dashoffset 0.5s ease;
            }
            .avatar-img {
                border-radius: 50%;
                object-fit: cover;
                position: absolute;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
            }
            .avatar-placeholder {
                border-radius: 50%;
                position: absolute;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                display: flex;
                align-items: center;
                justify-content: center;
                color: rgba(255,255,255,0.7);
            }
            .status-text {
                position: relative;
                font-size: min(2.5vw, 12.5px);
                font-weight: bold;
                color: #fff;
                text-shadow: 0 1px 2px rgba(0,0,0,0.3);
            }
            .status-duration {
                font-size: 0.7em;
                font-weight: normal;
                vertical-align: bottom;
                margin-left: 0.2em;
            }
            .home-count-badge {
                position: absolute;
                top: 0;
                right: 0.1em;
                background: rgba(255,255,255,0.92);
                color: #333;
                font-size: min(2.2vw, 11px);
                font-weight: bold;
                width: 1.6em;
                height: 1.6em;
                line-height: 1.6em;
                text-align: center;
                border-radius: 50%;
                box-shadow: 0 1px 4px rgba(0,0,0,0.3);
                z-index: 100;
            }
            .info-text {
                font-size: min(2vw, 10px);
                color: rgba(255,255,255,0.9);
                margin-top: 1%;
                text-shadow: 0 1px 2px rgba(0,0,0,0.3);
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
                max-width: 100%;
            }
        `;
    }

    static getConfigElement() {
        return document.createElement('xiaoshi-avatar-card-editor');
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

    // ===== 数据获取方法 =====

    /**
     * 获取人员列表配置（兼容处理）
     */
    _getPersons() {
        return this.config.persons || [];
    }

    /**
     * 获取人员信息：姓名、头像
     */
    _getPersonData(personConfig) {
        const entityId = personConfig.person_entity;
        if (!entityId || !this.hass) return null;
        const state = this.hass.states[entityId];
        if (!state) return null;
        return {
            name: state.attributes.friendly_name || entityId.split('.').pop(),
            avatar: state.attributes.entity_picture || state.attributes.picture || null,
            state: state.state
        };
    }

    /**
     * 判断人员是否在家（通过 device_tracker）
     */
    _isHome(personConfig) {
        const entityId = personConfig.tracker_entity;
        if (!entityId || !this.hass) return null;
        const state = this.hass.states[entityId];
        if (!state) return null;
        return state.state === 'home';
    }

    /**
     * 获取导航通勤数据（高德/腾讯实体）
     * 返回 { distance: 'xx公里', time: 'xx分钟' } 或 null
     */
    _getCommuteData(personConfig) {
        const entityId = personConfig.nav_entity;
        if (!entityId || !this.hass) return null;
        const state = this.hass.states[entityId];
        if (!state) return null;

        const mode = personConfig.commute_mode || 'driving';
        const attr = state.attributes;

        const modeMap = {
            driving: { time: '驾车通勤时间', distance: '驾车通勤距离' },
            transit: { time: '公交通勤时间', distance: '公交通勤距离' },
            cycling: { time: '骑行通勤时间', distance: '骑行通勤距离' },
            walking: { time: '步行通勤时间', distance: '步行通勤距离' }
        };

        const keys = modeMap[mode] || modeMap.driving;
        const time = attr[keys.time];
        const distance = attr[keys.distance];

        if (!time && !distance) return null;

        return {
            distance: distance || null,
            time: time || null
        };
    }

    /**
     * 通过GPS坐标计算直线距离（Haversine公式）
     * 返回 { distance_km: xx.x } 或 null
     */
    _getGpsDistance(personConfig) {
        const gpsEntityId = personConfig.gps_tracker_entity;
        const zoneEntityId = personConfig.zone_entity;
        if (!gpsEntityId || !zoneEntityId || !this.hass) return null;

        const gpsState = this.hass.states[gpsEntityId];
        const zoneState = this.hass.states[zoneEntityId];
        if (!gpsState || !zoneState) return null;

        const gpsLat = gpsState.attributes.latitude;
        const gpsLon = gpsState.attributes.longitude;
        const zoneLat = zoneState.attributes.latitude;
        const zoneLon = zoneState.attributes.longitude;

        if (gpsLat == null || gpsLon == null || zoneLat == null || zoneLon == null) return null;

        const R = 6371; // 地球半径(公里)
        const dLat = this._toRad(zoneLat - gpsLat);
        const dLon = this._toRad(zoneLon - gpsLon);
        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                  Math.cos(this._toRad(gpsLat)) * Math.cos(this._toRad(zoneLat)) *
                  Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        const distanceKm = R * c;

        return {
            distance_km: Math.round(distanceKm * 10) / 10
        };
    }

    _toRad(deg) {
        return deg * Math.PI / 180;
    }

    _parseColor(color) {
        if (color.startsWith('#')) {
            const r = parseInt(color.slice(1, 3), 16);
            const g = parseInt(color.slice(3, 5), 16);
            const b = parseInt(color.slice(5, 7), 16);
            return { r, g, b };
        }
        const match = color.match(/(\d+)/g);
        if (match && match.length >= 3) {
            return { r: parseInt(match[0]), g: parseInt(match[1]), b: parseInt(match[2]) };
        }
        return { r: 0, g: 0, b: 0 };
    }

    // 改淡：将颜色向白色混合，amount 0~1
    _lightenColor(color, amount) {
        const { r, g, b } = this._parseColor(color);
        const lr = Math.round(r + (255 - r) * amount);
        const lg = Math.round(g + (255 - g) * amount);
        const lb = Math.round(b + (255 - b) * amount);
        return `rgb(${lr},${lg},${lb})`;
    }

    // 改暗：将颜色向黑色混合，amount 0~1
    _darkenColor(color, amount) {
        const { r, g, b } = this._parseColor(color);
        const dr = Math.round(r * (1 - amount));
        const dg = Math.round(g * (1 - amount));
        const db = Math.round(b * (1 - amount));
        return `rgb(${dr},${dg},${db})`;
    }

    /**
     * 获取距离数据：优先通勤数据，次选GPS直线距离
     * 返回 { distance: 'xx公里', time: 'xx分钟', is_straight_line: false } 或 null
     */
    _getDistanceData(personConfig) {
        const distanceMethod = personConfig.distance_method || 'nav';

        if (distanceMethod === 'ha') {
            // HAGPS直线距离模式
            const gps = this._getGpsDistance(personConfig);
            if (gps) {
                return {
                    distance: gps.distance_km + 'km',
                    time: null,
                    is_straight_line: true
                };
            }
            return null;
        }

        // 导航通勤数据模式：优先通勤数据，次选GPS直线距离
        const commute = this._getCommuteData(personConfig);
        if (commute && (commute.distance || commute.time)) {
            return {
                distance: commute.distance,
                time: commute.time,
                is_straight_line: false
            };
        }
        const gps = this._getGpsDistance(personConfig);
        if (gps) {
            return {
                distance: gps.distance_km + 'km',
                time: null,
                is_straight_line: true
            };
        }
        return null;
    }

    /**
     * 获取生日数据
     * 从万年历实体的生日数组中取指定索引
     * 返回 { name: 'xx', days: xx, description: 'xx' } 或 null
     */
    _getBirthdayData(personConfig) {
        const entityId = personConfig.calendar_entity;
        if (!entityId || !this.hass) return null;
        const state = this.hass.states[entityId];
        if (!state) return null;

        const birthdays = state.attributes['生日'];
        if (!birthdays || !Array.isArray(birthdays) || birthdays.length === 0) return null;

        const index = personConfig.birthday_index ?? 0;
        const item = birthdays[index];
        if (!item) return null;

        // 取阳历天数和农历天数中有效的较小值
        const solarDays = item['阳历天数'];
        const lunarDays = item['农历天数'];
        const solarValid = solarDays != null && solarDays !== '' && !isNaN(solarDays);
        const lunarValid = lunarDays != null && lunarDays !== '' && !isNaN(lunarDays);

        let days = null;
        let description = null;

        if (solarValid && lunarValid) {
            days = Math.min(Number(solarDays), Number(lunarDays));
            description = days === Number(solarDays) ? (item['阳历天数说明'] || '') : (item['农历天数说明'] || '');
        } else if (solarValid) {
            days = Number(solarDays);
            description = item['阳历天数说明'] || '';
        } else if (lunarValid) {
            days = Number(lunarDays);
            description = item['农历天数说明'] || '';
        }

        return {
            name: item['名称'] || '',
            days: days,
            description: description
        };
    }

    /**
     * 获取手机电量
     * 返回 { level: xx, charging: bool } 或 null
     */
    _getBatteryData(personConfig) {
        const entityId = personConfig.battery_entity;
        if (!entityId || !this.hass) return null;
        const state = this.hass.states[entityId];
        if (!state) return null;

        return {
            level: Number(state.state) || 0,
            charging: state.attributes.charging || state.attributes.is_charging || false
        };
    }

    /**
     * 获取手机存储信息
     * state = 剩余百分比
     * 属性 Free internal storage / Total internal storage
     * 返回 { percent: xx, free: 'xxGB', total: 'xxGB' } 或 null
     */
    _getStorageData(personConfig) {
        const entityId = personConfig.storage_entity;
        if (!entityId || !this.hass) return null;
        const state = this.hass.states[entityId];
        if (!state) return null;

        return {
            percent: Number(state.state) || 0,
            free: state.attributes['Free internal storage'] || null,
            total: state.attributes['Total internal storage'] || null
        };
    }

    /**
     * 汇总单个人员数据
     */
    _collectPersonData(personConfig) {
        const person = this._getPersonData(personConfig);
        const isHome = this._isHome(personConfig);
        const lastChanged = this._getLastChanged(personConfig);
        const distance = this._getDistanceData(personConfig);
        const birthday = this._getBirthdayData(personConfig);
        const battery = this._getBatteryData(personConfig);
        const storage = this._getStorageData(personConfig);

        return {
            person,       // { name, avatar, state }
            isHome,       // true/false/null
            lastChanged,  // Date 或 null
            distance,     // { distance, time, is_straight_line } 或 null
            birthday,     // { name, days, description } 或 null
            battery,      // { level, charging } 或 null
            storage       // { percent, free, total } 或 null
        };
    }

    /**
     * 获取人员实体上次状态变化时间
     */
    _getLastChanged(personConfig) {
        const entityId = personConfig.tracker_entity;
        if (!entityId || !this.hass) return null;
        const state = this.hass.states[entityId];
        if (!state || !state.last_changed) return null;
        return new Date(state.last_changed);
    }

    /**
     * 格式化持续时间：m/h/d/n，<10用1位小数，>=10用0位小数
     */
    _formatDuration(lastChanged) {
        if (!lastChanged) return '';
        const diffMs = Date.now() - lastChanged.getTime();
        if (diffMs < 0) return '';
        const minutes = diffMs / 60000;
        const hours = minutes / 60;
        const days = hours / 24;
        const years = days / 365;
        const fmt = (v) => v < 10 ? v.toFixed(1) : Math.round(v).toString();
        if (years >= 1) return fmt(years) + 'n';
        if (days >= 1) return fmt(days) + 'd';
        if (hours >= 1) return fmt(hours) + 'h';
        return fmt(minutes) + 'm';
    }

    /**
     * 汇总所有人员数据，含在家统计
     */
    _collectAllData() {
        const persons = this._getPersons();
        const personDataList = persons.map(pc => this._collectPersonData(pc));
        const homeCount = personDataList.filter(d => d.isHome === true).length;
        const totalCount = personDataList.length;
        return {
            persons: personDataList,
            homeCount,
            totalCount
        };
    }

    /**
     * 获取当前登录用户对应的人员数据
     * 通过 hass.user.id 匹配 person 实体的 user_id 属性
     */
    _getCurrentPersonData() {
        const pc = this._getCurrentPersonConfig();
        return pc ? this._collectPersonData(pc) : null;
    }

    /**
     * 获取当前登录用户对应的人员配置
     */
    _getCurrentPersonConfig() {
        if (!this.hass || !this.hass.user) return null;
        const userId = this.hass.user.id;
        const persons = this._getPersons();
        for (const pc of persons) {
            const entityId = pc.person_entity;
            if (!entityId) continue;
            const state = this.hass.states[entityId];
            if (!state) continue;
            if (state.attributes.user_id === userId) {
                return pc;
            }
        }
        return null;
    }

    render() {
        if (!this.hass || !this.config) return html``;

        const allData = this._collectAllData();

        // 构建有序人员列表：当前用户排第一，其余按原配置顺序
        const persons = this._getPersons();
        const currentUserId = this.hass.user.id;
        const orderedPersons = [];

        for (let i = 0; i < persons.length; i++) {
            const pc = persons[i];
            const entityId = pc.person_entity;
            const state = entityId ? this.hass.states[entityId] : null;
            const userId = state ? state.attributes.user_id : null;
            if (userId === currentUserId) {
                orderedPersons.unshift(pc); // 当前用户放最前
            } else {
                orderedPersons.push(pc);
            }
        }

        // 如果人员列表为空
        if (orderedPersons.length === 0) return html``;

        // 根据 _activeIndex 确定主卡和副卡
        const idx = Math.min(this._activeIndex || 0, orderedPersons.length - 1);
        this._activeIndex = idx;

        // 副卡偏移量动态计算
        const totalOffset = 40;
        const subConfigs = orderedPersons.filter((_, i) => i !== idx);
        const subCount = subConfigs.length;
        const step = subCount > 0 ? totalOffset / subCount : 0;

        // 为每个人员计算卡片样式
        const allCardsHtml = orderedPersons.map((pc, i) => {
            const data = this._collectPersonData(pc);
            const isMain = (i === idx);
            const entityKey = pc.person_entity || `person-${i}`;

            // 背景色
            const homeColor = this.config.home_color || '#2196f3';
            const awayColor = this.config.away_color || '#f44336';
            const currentTheme = this._evaluateTheme();
            let bg = '#999';
            if (data && data.isHome === true) {
                bg = isMain
                    ? (currentTheme === 'dark' ? this._darkenColor(homeColor, 0.3) : homeColor)
                    : (currentTheme === 'dark' ? this._darkenColor(homeColor, 0.5) : this._lightenColor(homeColor, 0.3));
            } else if (data && data.isHome === false) {
                bg = isMain
                    ? (currentTheme === 'dark' ? this._darkenColor(awayColor, 0.3) : awayColor)
                    : (currentTheme === 'dark' ? this._darkenColor(awayColor, 0.5) : this._lightenColor(awayColor, 0.3));
            }

            let position, left, scale, zIndex;

            if (isMain) {
                position = 'relative';
                left = '0';
                scale = 1;
                zIndex = subCount + 1;
            } else {
                // 计算该副卡在副卡列表中的序号
                const subIndex = i < idx ? i : i - 1;
                position = 'absolute';
                left = (subIndex + 1) * step + '%';
                scale = 0.9;
                zIndex = subCount - subIndex;
            }

            return html`
                <div class="card-item" key="${entityKey}"
                    style="position:${position};${position === 'absolute' ? 'top:0;' : ''}left:${left};
                    transform:scale(${scale});background:${bg};z-index:${zIndex};
                    filter:drop-shadow(${currentTheme === 'dark' ? '0 2px 5px rgba(0,0,0,0.6)' : '0 3px 8px rgba(230,230,230,0.6)'});"
                    data-is-main="${isMain}"
                    @click="${() => this._onCardClick(pc, isMain)}">
                    ${this._renderCardContent(data, allData, pc, isMain)}
                </div>
            `;
        });

        return html`
            <div class="card-wrapper" style="width:${this.config.card_width || '20vw'};height:${this.config.card_height || '12.5vh'};"
                @touchstart="${this._onTouchStart}"
                @touchend="${this._onTouchEnd}"
                @mousedown="${this._onMouseDown}"
                @mouseup="${this._onMouseUp}">
                <div class="home-count-badge">${allData.homeCount}</div>
                ${allCardsHtml}
            </div>
        `;
    }

    _onTouchStart(e) {
        this._touchStartX = e.touches[0].clientX;
        this._touchStartY = e.touches[0].clientY;
    }

    _onTouchEnd(e) {
        this._handleSwipe(e.changedTouches[0].clientX, e.changedTouches[0].clientY);
    }

    _onMouseDown(e) {
        this._mouseStartX = e.clientX;
        this._mouseStartY = e.clientY;
    }

    _onMouseUp(e) {
        this._handleSwipe(e.clientX, e.clientY);
    }

    _handleSwipe(endX, endY) {
        const startX = this._touchStartX || this._mouseStartX || 0;
        const startY = this._touchStartY || this._mouseStartY || 0;
        const diffX = endX - startX;
        const diffY = endY - startY;

        // 水平滑动距离大于垂直且超过阈值
        if (Math.abs(diffX) < 30 || Math.abs(diffX) < Math.abs(diffY)) return;

        this._swipeDetected = true;

        const persons = this._getPersons();
        const total = persons.length;
        if (total <= 1) return;

        if (diffX < 0) {
            // 左滑 → 下一张（循环）
            this._activeIndex = (this._activeIndex + 1) % total;
        } else {
            // 右滑 → 上一张（循环）
            this._activeIndex = (this._activeIndex - 1 + total) % total;
        }
        this.requestUpdate();

        // 滑动后延迟重置标志，避免第一次点击被拦截
        setTimeout(() => { this._swipeDetected = false; }, 300);
    }

    /**
     * 点击卡片触发弹窗
     */
    _onCardClick(personConfig, isMain) {
        if (!isMain) return;
        if (this._swipeDetected) return;

        const cards = [];
        const persons = this._getPersons();
        let mapConfig = null;

        // 1. 构建地图卡片
        if (this.config.show_popup_map !== 'false') {
            const mapEntities = [];

            for (const pc of persons) {
                if (pc.person_entity && !mapEntities.includes(pc.person_entity)) {
                    mapEntities.push(pc.person_entity);
                }
                if (pc.zone_entity && !mapEntities.includes(pc.zone_entity)) {
                    mapEntities.push(pc.zone_entity);
                }
            }

            mapConfig = {
                type: 'map',
                entities: mapEntities,
                aspect_ratio: '16:9',
                hours_to_show: this.config.track_hours || 24,
                theme_mode: this._evaluateTheme()
            };
            cards.push(mapConfig);
        }

        // 2. 添加附加卡片（other_cards）
        let otherCards = [];
        if (this.config.other_cards && this.config.other_cards.trim()) {
            try {
                otherCards = yamlToJson(this.config.other_cards);
                const theme = this._evaluateTheme();
                const cardsWithTheme = otherCards.map(card => {
                    if (!card.theme && this.config.theme) {
                        return { ...card, theme: this.config.theme === 'system' ? theme : this.config.theme };
                    }
                    return card;
                });
                cards.push(...cardsWithTheme);
            } catch (err) {
                console.error('[XiaoshiAvatarCard] 解析附加卡片失败:', err);
            }
        }

        // 3. 如果开启了历史记录，注入历史时间条卡片到最前面
        if (this.config.show_popup_history !== 'false') {
            const trackerEntities = persons.map(pc => pc.tracker_entity).filter(Boolean);
            if (trackerEntities.length > 0) {
                cards.splice(1, 0, {
                    type: 'custom:xiaoshi-avatar-history-card',
                    persons: persons.map(pc => ({
                        person_entity: pc.person_entity || '',
                        tracker_entity: pc.tracker_entity || '',
                        zone_entity: pc.zone_entity || ''
                    })),
                    track_hours: this.config.track_hours || 24,
                    theme: this.config.theme || 'system'
                });
            }
        }

        if (cards.length === 0) return;

        this._handleClick();
        const serviceData = { card: cards };
        const popupWidth = this.config.popup_width || '500px';
        const popupTop = this.config.popup_top || '20px';
        if (popupWidth !== '95%') serviceData.popup_width = popupWidth;
        if (popupTop !== '20px') serviceData.popup_top = popupTop;
        serviceData.background = 'transparent';
        this.hass.callService('popup_card', 'show', serviceData);
    }

    /**
     * 渲染卡片内容（头像+状态+生日+距离+时间）
     * isMain: 是否为主卡
     */
    _renderCardContent(data, allData, personConfig, isMain = true) {
        if (!data || !data.person) return html``;

        // 渲染头像+圆环
        const avatarHtml = this._renderAvatarWithRingForConfig(data, personConfig);

        // 渲染状态文字：每个卡片显示自己的在家/离家
        const duration = this._formatDuration(data.lastChanged);
        const label = data.isHome === true ? '在家' : '离家';
        const statusHtml = html`<div class="status-text">${label}${duration ? html`<span class="status-duration">${duration}</span>` : ''}</div>`;

        // 渲染生日信息
        let birthdayHtml = html``;
        if (data.birthday && data.birthday.days != null) {
            birthdayHtml = html`<div class="info-text">${data.birthday.days == 0 ? '🎂今天' : `🎂 ${data.birthday.days}天`}</div>`;
        }

        // 渲染距家距离和时间
        let distanceHtml = html``;
        let timeHtml = html``;
        if (data.distance) {
            const commuteMode = personConfig ? (personConfig.commute_mode || 'driving') : 'driving';
            const modeIcons = { driving: '🚗', transit: '🚌', cycling: '🚲', walking: '🚶' };
            const distIcon = data.distance.is_straight_line ? '🚗' : (modeIcons[commuteMode] || '🌏');
            const distValue = (data.distance.distance || '').replace(/([\d.]+)(公里|千米|km)/i, (_, n) => Math.round(parseFloat(n)) + 'km').replace('公里', 'km').replace('千米', 'km');
            const timeValue = (data.distance.time || '').replace('分钟', '分').replace('小时', '时');

            distanceHtml = html`<div class="info-text">${distIcon} ${distValue}</div>`;

            if (!data.distance.is_straight_line && data.distance.time) {
                timeHtml = html`<div class="info-text">🕛 ${timeValue}</div>`;
            }
        }

        return html`
            ${avatarHtml}
            ${statusHtml}
            ${birthdayHtml}
            ${distanceHtml}
            ${timeHtml}
        `;
    }

    /**
     * 渲染头像+圆环（根据指定人员配置）
     */
    _renderAvatarWithRingForConfig(data, personConfig) {
        if (!data || !data.person) return html``;

        const ringType = personConfig ? (personConfig.ring_type || 'none') : 'none';

        const size = 100;
        const strokeWidth = 8;
        const radius = (size - strokeWidth) / 2;
        const circumference = 2 * Math.PI * radius;

        let ringPercent = 0;
        let ringColor = '#4caf50';

        if (ringType === 'battery' && data.battery) {
            ringPercent = Math.min(Math.max(data.battery.level, 0), 100);
            if (data.battery.charging) {
                ringColor = '#ffeb3b';
            } else if (ringPercent > 50) {
                ringColor = '#4caf50';
            } else if (ringPercent > 20) {
                ringColor = '#ff9800';
            } else {
                ringColor = '#f44336';
            }
        } else if (ringType === 'storage' && data.storage) {
            ringPercent = Math.min(Math.max(data.storage.percent, 0), 100);
            if (ringPercent > 50) {
                ringColor = '#4caf50';
            } else if (ringPercent > 20) {
                ringColor = '#ff9800';
            } else {
                ringColor = '#f44336';
            }
        }

        const showRing = ringType !== 'none' && (ringType === 'battery' ? !!data.battery : !!data.storage);
        const dashOffset = showRing ? circumference * (1 - ringPercent / 100) : circumference;

        const avatarUrl = data.person.avatar;
        const avatarInnerSize = '80%';

        const avatarContent = avatarUrl
            ? html`<img class="avatar-img" src="${avatarUrl}" alt="${data.person.name}" style="width:${avatarInnerSize};height:${avatarInnerSize};" />`
            : html`<div class="avatar-placeholder" style="width:${avatarInnerSize};height:${avatarInnerSize};font-size:30px;">${(data.person.name || '?')[0]}</div>`;

        return html`
            <div class="avatar-container" style="width:80%;aspect-ratio:1/1;max-height:55%;">
                ${showRing ? html`
                    <svg class="avatar-ring-svg" viewBox="0 0 ${size} ${size}">
                        <circle class="avatar-ring-bg" cx="${size/2}" cy="${size/2}" r="${radius}" stroke-width="${strokeWidth}" />
                        <circle class="avatar-ring-progress" cx="${size/2}" cy="${size/2}" r="${radius}" stroke-width="${strokeWidth}"
                            stroke="${ringColor}"
                            stroke-dasharray="${circumference}"
                            stroke-dashoffset="${dashOffset}" />
                    </svg>
                ` : ''}
                ${avatarContent}
            </div>
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
}
customElements.define('xiaoshi-avatar-card', XiaoshiAvatarCard);

class XiaoshiAvatarHistoryCard extends LitElement {
    static properties = {
        hass: { type: Object },
        config: { type: Object }
    };

    static getConfigElement() {
        return document.createElement('div');
    }

    static getStubConfig() {
        return { persons: [], track_hours: 24, theme: 'system' };
    }

    setConfig(config) {
        this.config = config || {};
        this._historyData = {};
        this._detailOverlayEl = null;
    }

    _evaluateTheme() {
        const mode = this.config ? this.config.theme : 'system';
        if (mode === 'light') return 'light';
        if (mode === 'dark') return 'dark';
        if (mode === 'system' || !mode) {
            return (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) ? 'dark' : 'light';
        }
        return 'light';
    }

    render() {
        if (!this.hass || !this.config) return html``;
        const persons = this.config.persons || [];
        const trackHours = this.config.track_hours || 24;
        const theme = this._evaluateTheme();
        const isDark = theme === 'dark';
        // 参照birthday卡片配色: --fg-color / --bg-color
        const fgColor = isDark ? 'rgb(255,255,255)' : 'rgb(0,0,0)';
        const bgColor = isDark ? 'rgb(50,50,50)' : 'rgb(255,255,255)';
        const borderColor = 'rgb(150,150,150,0.5)';
        // 副文字色（略淡）
        const subColor = isDark ? 'rgb(200,200,200)' : 'rgb(100,100,100)';

        // 异步获取历史数据
        this._fetchAndUpdate(persons, trackHours);

        return html`
            <div style="border-radius:12px;background:${bgColor};overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.08);">
                <!-- 标题栏：参照birthday的card-header -->
                <div style="display:flex;align-items:center;padding:12px 16px;">
                    <span style="display:flex;align-items:center;font-size:20px;font-weight:500;color:${fgColor};height:30px;line-height:30px;">
                        <span style="display:inline-block;width:8px;height:8px;border-radius:50%;margin-right:8px;background:#4CAF50;animation:pulse 2s infinite;"></span>
                        历史记录
                    </span>
                </div>
                <!-- 人员时间条列表：参照birthday的device-item -->
                ${persons.map((pc, i) => {
                    if (!pc.tracker_entity) return html``;
                    const ed = this._historyData[pc.tracker_entity];
                    const name = this._getPersonName(pc);
                    const isHome = this._isPersonHome(pc);
                    const dot = isHome ? '#4CAF50' : subColor;
                    const icon = 'mdi:account';
                    const pct = ed ? ed._homePct : '...';
                    const awayPct = ed ? ed._awayPct : '...';
                    const timeline = ed ? ed._timelineHtml : '<div style="flex:1;height:100%;background:rgba(180,180,180,0.2);border-radius:3px;"></div>';
                    return html`
                        <div style="display:flex;align-items:center;margin:0 16px;padding:8px 0;border-top:1px solid ${borderColor};cursor:pointer;gap:4px;"
                             @click="${(e) => this._onTimelineClick(pc, i, e)}"
                             @mouseenter="${(e) => { e.currentTarget.style.background = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)'; }}"
                             @mouseleave="${(e) => { e.currentTarget.style.background = ''; }}">
                            <!-- 左侧：人员+状态统计占40%，单行不换行 -->
                            <div style="flex:0 0 40%;display:flex;align-items:center;gap:4px;min-width:0;overflow:hidden;padding:0 8px;">
                                <span style="display:inline-block;width:7px;height:7px;border-radius:50%;background:${dot};flex-shrink:0;"></span>
                                <span style="display:flex;align-items:center;gap:3px;font-size:13px;font-weight:500;color:${fgColor};flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">
                                    <ha-icon icon="${icon}" style="--mdc-icon-size:14px;color:#4CAF50;flex-shrink:0;"></ha-icon>${name}
                                </span>
                                <span style="font-size:11px;color:#4CAF50;font-weight:bold;white-space:nowrap;flex-shrink:0;">${pct}%</span>
                                <span style="font-size:11px;color:${subColor};font-weight:bold;white-space:nowrap;flex-shrink:0;">${awayPct}%</span>
                            </div>
                            <!-- 右侧：时间条占60% -->
                            <div style="flex:1;display:flex;align-items:center;gap:4px;min-width:0;">
                                <div style="flex:1;display:flex;height:6px;border-radius:3px;overflow:hidden;" .innerHTML="${timeline}"></div>
                                <ha-icon icon="mdi:chevron-right" style="--mdc-icon-size:16px;color:${subColor};flex-shrink:0;"></ha-icon>
                            </div>
                        </div>
                    `;
                })}
                <div style="border-bottom:1px solid ${borderColor};margin:0 16px 6px 16px;"></div>
            </div>
        `;
    }

    _getPersonName(pc) {
        if (pc.person_entity && this.hass.states[pc.person_entity]) {
            return this.hass.states[pc.person_entity].attributes.friendly_name || pc.person_entity;
        }
        if (pc.tracker_entity && this.hass.states[pc.tracker_entity]) {
            return this.hass.states[pc.tracker_entity].attributes.friendly_name || pc.tracker_entity;
        }
        return pc.tracker_entity || '';
    }

    _isPersonHome(pc) {
        if (!pc.tracker_entity || !this.hass) return null;
        const s = this.hass.states[pc.tracker_entity];
        return s ? s.state === 'home' : null;
    }

    async _fetchAndUpdate(persons, trackHours) {
        const entities = persons.map(pc => pc.tracker_entity).filter(Boolean).join(',');
        if (!entities) return;
        const key = entities + '_' + trackHours;
        if (this._lastFetchKey === key) return;
        this._lastFetchKey = key;

        try {
            const end = new Date();
            const start = new Date(end.getTime() - trackHours * 3600000);
            const data = await this.hass.callApi('GET',
                `history/period/${start.toISOString()}?end_time=${end.toISOString()}&filter_entity_id=${entities}&minimal_response&no_attributes`);

            const result = {};
            const rangeEnd = new Date();
            const rangeStart = new Date(rangeEnd.getTime() - trackHours * 3600000);
            const all = Array.isArray(data) ? data : [];
            for (const eh of all) {
                if (!eh || eh.length === 0) continue;
                const eid = eh[0].entity_id;
                if (!eid) continue;
                const entries = eh.filter(e => e && e.last_changed).sort((a, b) => new Date(b.last_changed) - new Date(a.last_changed));
                const deduped = this._dedupe(entries);
                let homeMs = 0, awayMs = 0;
                for (let i = 0; i < deduped.length; i++) {
                    const t = new Date(deduped[i].last_changed);
                    const nt = i + 1 < deduped.length ? new Date(deduped[i + 1].last_changed) : new Date();
                    const d = Math.max(0, nt - t);
                    if (this._norm(deduped[i].state) === 'home') homeMs += d; else awayMs += d;
                }
                const total = homeMs + awayMs;
                result[eid] = {
                    _homePct: total > 0 ? Math.round(homeMs / total * 100) : 0,
                    _awayPct: total > 0 ? Math.round(awayMs / total * 100) : 0,
                    _timelineHtml: this._buildTimeline(entries, rangeStart, rangeEnd),
                    _rawEntries: eh.filter(e => e && e.last_changed)
                };
            }
            this._historyData = result;
            this.requestUpdate();
        } catch (e) {
            console.error('[XiaoshiAvatarHistoryCard] 获取历史失败:', e);
        }
    }

    _onTimelineClick(pc, index, e) {
        e.stopPropagation();
        const haptic = new Event('haptic', { bubbles: true, cancelable: false, composed: true });
        haptic.detail = 'light';
        this.dispatchEvent(haptic);
        this._showDetailOverlay(pc);
    }

    // ===== 详细历史记录弹窗 =====

    _showDetailOverlay(targetPc) {
        if (this._detailOverlayEl) this._closeDetailOverlay();
        const persons = this.config.persons || [];
        const theme = this._evaluateTheme();
        const isDark = theme === 'dark';
        const textColor = isDark ? '#fff' : '#333';
        const bgColor = isDark ? '#2c2c2c' : '#fff';
        const borderColor = isDark ? '#aaa' : '#888';
        const btnBg = isDark ? '#444' : '#f0f0f0';
        const btnIconColor = isDark ? '#ccc' : '#666';
        const chipBg = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)';
        const chipActiveBg = '#4CAF50';
        const chipActiveColor = '#fff';

        this._detailFilterPerson = targetPc ? (targetPc.tracker_entity || '') : '';
        this._detailFilterPeriod = this.config.track_hours || 24;
        this._detailData = {};

        const overlay = document.createElement('div');
        overlay.className = 'xiaoshi-person-history-overlay';
        overlay.style.cssText = 'position:fixed;top:0;left:0;width:100vw;height:100vh;background:rgba(0,0,0,0.5);z-index:999999;display:flex;align-items:flex-start;justify-content:center;padding-top:20px;-webkit-backdrop-filter:blur(10px);backdrop-filter:blur(10px);';
        overlay.addEventListener('click', (ev) => { if (ev.target === overlay) this._closeDetailOverlay(); });

        const dialog = document.createElement('div');
        dialog.style.cssText = `background:${bgColor};border-radius:16px;width:95vw;max-width:500px;max-height:85vh;display:flex;flex-direction:column;box-shadow:0 8px 40px rgba(0,0,0,0.25);`;

        // Header
        const header = document.createElement('div');
        header.style.cssText = `display:flex;justify-content:space-between;align-items:center;padding:10px 0;margin:0 20px;border-bottom:1px solid ${borderColor};`;
        const title = document.createElement('span');
        title.style.cssText = `font-size:1.1rem;font-weight:700;color:${textColor};`;
        title.textContent = '人员 - 历史记录';
        const closeBtn = document.createElement('button');
        closeBtn.style.cssText = `width:36px;height:36px;border-radius:50%;border:none;background:${btnBg};cursor:pointer;display:flex;align-items:center;justify-content:center;`;
        closeBtn.innerHTML = `<ha-icon icon="mdi:close" style="--mdc-icon-size:20px;color:${btnIconColor};"></ha-icon>`;
        closeBtn.addEventListener('click', () => this._closeDetailOverlay());
        header.appendChild(title);
        header.appendChild(closeBtn);

        // Toolbar
        const toolbar = document.createElement('div');
        toolbar.style.cssText = `display:flex;flex-direction:column;gap:8px;padding:10px 5px;margin:0 20px;border-bottom:1px solid ${borderColor};`;

        if (persons.length > 1) {
            const pr = document.createElement('div');
            pr.style.cssText = 'display:flex;align-items:flex-start;gap:8px;';
            const pl = document.createElement('span');
            pl.style.cssText = `font-size:0.75rem;color:${isDark?'#aaa':'#888'};flex-shrink:0;padding-top:4px;`;
            pl.textContent = '人员:';
            pr.appendChild(pl);
            const pcs = document.createElement('div');
            pcs.style.cssText = 'display:flex;gap:4px;flex-wrap:wrap;flex:1;';
            pcs.className = 'xiaoshi-detail-person-chips';

            const allC = this._makeChip('全部', '', chipBg, chipActiveBg, chipActiveColor, isDark);
            allC.addEventListener('click', () => { this._detailFilterPerson = ''; this._refreshChips(pcs, '', this._detailFilterPeriod, chipBg, chipActiveBg, chipActiveColor, isDark, 'person'); this._refetchDetail(); });
            pcs.appendChild(allC);
            for (const pc of persons) {
                if (!pc.tracker_entity) continue;
                const nm = this._getPersonName(pc);
                const c = this._makeChip(nm, pc.tracker_entity, chipBg, chipActiveBg, chipActiveColor, isDark);
                c.addEventListener('click', () => { this._detailFilterPerson = pc.tracker_entity; this._refreshChips(pcs, pc.tracker_entity, this._detailFilterPeriod, chipBg, chipActiveBg, chipActiveColor, isDark, 'person'); this._refetchDetail(); });
                pcs.appendChild(c);
            }
            pr.appendChild(pcs);
            toolbar.appendChild(pr);
        }

        const tr = document.createElement('div');
        tr.style.cssText = 'display:flex;align-items:center;gap:8px;';
        const tl = document.createElement('span');
        tl.style.cssText = `font-size:0.75rem;color:${isDark?'#aaa':'#888'};flex-shrink:0;`;
        tl.textContent = '时段:';
        tr.appendChild(tl);
        const tcs = document.createElement('div');
        tcs.style.cssText = 'display:flex;gap:4px;flex-wrap:wrap;';
        tcs.className = 'xiaoshi-detail-time-chips';
        const periods = [
            { label: '1小时', v: 1 }, { label: '6小时', v: 6 }, { label: '24小时', v: 24 },
            { label: '3天', v: 72 }, { label: '7天', v: 168 }, { label: '15天', v: 360 }
        ];
        for (const p of periods) {
            const c = this._makeChip(p.label, p.v, chipBg, chipActiveBg, chipActiveColor, isDark);
            c.addEventListener('click', () => { this._detailFilterPeriod = p.v; this._refreshChips(tcs, this._detailFilterPerson, p.v, chipBg, chipActiveBg, chipActiveColor, isDark, 'time'); this._refetchDetail(); });
            tcs.appendChild(c);
        }
        tr.appendChild(tcs);
        toolbar.appendChild(tr);

        const body = document.createElement('div');
        body.className = 'xiaoshi-detail-body';
        body.style.cssText = 'flex:1;overflow-y:auto;padding:6px 20px;';
        body.innerHTML = `<div style="display:flex;align-items:center;justify-content:center;padding:40px;color:${isDark?'#aaa':'#999'};"><ha-icon icon="mdi:loading" style="--mdc-icon-size:24px;"></ha-icon>&nbsp;加载中...</div>`;

        dialog.appendChild(header);
        dialog.appendChild(toolbar);
        dialog.appendChild(body);
        overlay.appendChild(dialog);
        document.body.appendChild(overlay);

        this._detailOverlayEl = overlay;
        this._detailBodyEl = body;
        this._detailChipsContainer = toolbar;
        this._fetchDetail();
    }

    _closeDetailOverlay() {
        if (this._detailOverlayEl) { this._detailOverlayEl.remove(); this._detailOverlayEl = null; }
        this._detailBodyEl = null;
        this._detailData = {};
    }

    async _fetchDetail() {
        try {
            const persons = this.config.persons || [];
            let eids;
            if (this._detailFilterPerson) eids = this._detailFilterPerson;
            else eids = persons.map(pc => pc.tracker_entity).filter(Boolean).join(',');
            if (!eids) { this._detailData = {}; this._updateDetailContent(); return; }

            const ph = this._detailFilterPeriod || 24;
            const end = new Date();
            const start = new Date(end.getTime() - ph * 3600000);
            const data = await this.hass.callApi('GET',
                `history/period/${start.toISOString()}?end_time=${end.toISOString()}&filter_entity_id=${eids}&minimal_response&no_attributes`);

            const result = {};
            const all = Array.isArray(data) ? data : [];
            for (const eh of all) {
                if (!eh || eh.length === 0) continue;
                const eid = eh[0].entity_id;
                if (!eid) continue;
                const so = this.hass.states[eid];
                const name = so?.attributes?.friendly_name || eid;
                result[eid] = {
                    name,
                    entries: eh.filter(e => e && e.last_changed).sort((a, b) => new Date(b.last_changed) - new Date(a.last_changed))
                };
            }
            this._detailData = result;
        } catch (e) {
            console.error('[XiaoshiAvatarHistoryCard] 详细历史获取失败:', e);
            this._detailData = {};
        } finally {
            this._updateDetailContent();
        }
    }

    async _refetchDetail() {
        this._detailData = {};
        if (this._detailBodyEl) {
            const isDark = this._evaluateTheme() === 'dark';
            this._detailBodyEl.innerHTML = `<div style="display:flex;align-items:center;justify-content:center;padding:40px;color:${isDark?'#aaa':'#999'};"><ha-icon icon="mdi:loading" style="--mdc-icon-size:24px;"></ha-icon>&nbsp;加载中...</div>`;
        }
        await this._fetchDetail();
    }

    _updateDetailContent() {
        if (!this._detailBodyEl) return;
        const isDark = this._evaluateTheme() === 'dark';
        const textColor = isDark ? '#fff' : '#333';
        const entries = Object.entries(this._detailData || {});
        if (entries.length === 0) {
            this._detailBodyEl.innerHTML = `<div style="text-align:center;padding:40px;color:${isDark?'#aaa':'#999'};font-size:0.9rem;">暂无历史记录</div>`;
            return;
        }

        let html = '';
        for (const [entityId, data] of entries) {
            const icon = 'mdi:account';
            const deduped = this._dedupe(data.entries);
            let homeMs = 0, awayMs = 0;
            const withDur = [];
            for (let i = 0; i < deduped.length; i++) {
                const e = deduped[i];
                const time = new Date(e.last_changed);
                const nt = i + 1 < deduped.length ? new Date(deduped[i + 1].last_changed) : new Date();
                const d = Math.max(0, nt - time);
                if (this._norm(e.state) === 'home') homeMs += d; else if (this._norm(e.state) === 'away') awayMs += d;
                withDur.push({ entry: e, time, durationMs: d });
            }

            const pf = [];
            for (const item of withDur) { if (this._norm(item.entry.state) === 'offline' && item.durationMs < 60000) continue; pf.push(item); }
            const filtered = [];
            homeMs = 0; awayMs = 0;
            for (const item of pf) {
                const last = filtered[filtered.length - 1];
                const cn = this._norm(item.entry.state);
                const ln = last ? this._norm(last.entry.state) : null;
                if (last && ln === cn) { last.durationMs += item.durationMs; last.time = item.time; }
                else filtered.push({ ...item });
            }
            for (const item of filtered) { if (this._norm(item.entry.state) === 'home') homeMs += item.durationMs; else if (this._norm(item.entry.state) === 'away') awayMs += item.durationMs; }

            const totalMs = homeMs + awayMs;
            const homePct = totalMs > 0 ? Math.round(homeMs / totalMs * 100) : 0;
            const awayPct = totalMs > 0 ? Math.round(awayMs / totalMs * 100) : 0;

            const ph = this._detailFilterPeriod || 24;
            const re = new Date();
            const rs = new Date(re.getTime() - ph * 3600000);
            const tl = this._buildTimeline(data.entries, rs, re);

            html += `<div style="margin:8px 0;border-bottom:1px solid ${isDark?'#aaa':'#888'};">`;
            html += `<div style="display:flex;align-items:center;gap:8px;margin-bottom:8px;">`;
            html += `<span style="display:flex;align-items:center;gap:4px;font-weight:700;font-size:0.85rem;color:${isDark?'#ddd':'#444'};white-space:nowrap;"><ha-icon icon="${icon}" style="--mdc-icon-size:16px;color:#4CAF50;"></ha-icon>${data.name}</span>`;
            html += `<span style="font-size:0.7rem;color:${isDark?'#4CAF50':'#388E3C'};white-space:nowrap;">在家 ${homePct}%</span>`;
            html += `<span style="font-size:0.7rem;color:${isDark?'#aaa':'#888'};white-space:nowrap;">离家 ${awayPct}%</span>`;
            html += `<div style="flex:1;display:flex;height:8px;border-radius:3px;overflow:hidden;">${tl}</div>`;
            html += `</div>`;

            for (const { entry, time, durationMs } of filtered) {
                const ts = time.toLocaleString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });
                const raw = (entry.state || '').trim().toLowerCase();
                const isHome = raw === 'home';
                const isOff = raw === 'unavailable' || raw === 'unknown';
                const label = isHome ? '在家' : (isOff ? '离线' : '离家');
                const sc = isHome ? '#4CAF50' : (isOff ? '#f44336' : '#999');
                const durStr = this._fmtDur(durationMs);
                const eb = isHome ? (isDark ? 'rgba(76,175,80,0.12)' : 'rgba(76,175,80,0.08)') : (isOff ? (isDark ? 'rgba(244,67,54,0.12)' : 'rgba(244,67,54,0.06)') : (isDark ? '#383838' : '#f5f5f5'));
                html += `<div style="border-radius:10px;padding:0px 12px;margin-bottom:8px;background:${eb};"><div style="display:flex;justify-content:space-between;align-items:center;"><span style="font-size:0.8rem;padding:2px 4px;border-radius:10px;font-weight:500;color:${sc};">${label} · ${durStr}</span><span style="font-size:0.75rem;color:${isDark?'#aaa':'#999'};">${ts}</span></div></div>`;
            }
            html += `</div>`;
        }
        this._detailBodyEl.innerHTML = html;
    }

    _fmtDur(ms) {
        const ph = this._detailFilterPeriod || 24;
        const pm = ph * 3600000;
        if (ms < 60000) return '少于1分钟';
        if (ms >= pm) { const d = Math.floor(ph / 24); return ph < 72 ? `大于${ph}小时` : `大于${d}天`; }
        const min = Math.floor(ms / 60000);
        if (min < 60) return `${min}分钟`;
        const h = Math.floor(min / 60);
        const rm = min % 60;
        if (h < 24) return rm > 0 ? `${h}小时${rm}分钟` : `${h}小时`;
        const days = Math.floor(h / 24);
        const rh = h % 24;
        return rh > 0 ? `${days}天${rh}小时` : `${days}天`;
    }

    _norm(s) { const st = (s || '').trim().toLowerCase(); if (st === 'home') return 'home'; if (st === 'not_home') return 'away'; if (st === 'unavailable' || st === 'unknown') return 'offline'; return st; }

    _dedupe(entries) {
        if (!entries || entries.length === 0) return [];
        const sorted = [...entries].sort((a, b) => new Date(a.last_changed) - new Date(b.last_changed));
        const r = [];
        for (const e of sorted) { const l = r[r.length - 1]; const cn = this._norm(e.state); const ln = l ? this._norm(l.state) : null; if (l && ln === cn) r[r.length - 1] = e; else r.push(e); }
        return r;
    }

    _buildTimeline(entries, rs, re) {
        const rm = re - rs;
        if (rm <= 0 || !entries || entries.length === 0) return '<div style="flex:1;height:100%;background:rgba(180,180,180,0.25);border-radius:3px;"></div>';
        const sorted = [...entries].sort((a, b) => new Date(a.last_changed) - new Date(b.last_changed));
        const filt = [];
        for (let i = 0; i < sorted.length; i++) { const ns = this._norm(sorted[i].state); const se = i + 1 < sorted.length ? new Date(sorted[i + 1].last_changed) : re; if (ns === 'offline' && se - new Date(sorted[i].last_changed) < 60000) continue; filt.push(sorted[i]); }
        const segs = [];
        for (let i = 0; i < filt.length; i++) {
            const ss = new Date(filt[i].last_changed);
            const se = i + 1 < filt.length ? new Date(filt[i + 1].last_changed) : re;
            const vs = ss < rs ? rs : ss;
            const ve = se > re ? re : se;
            const d = ve - vs;
            if (d > 0) { const ns = this._norm(filt[i].state); const p = (d / rm) * 100; const ls = segs[segs.length - 1]; if (ls && ls.state === ns) ls.percent += p; else segs.push({ state: ns, percent: p }); }
        }
        let b = '';
        for (const s of segs) { const c = s.state === 'home' ? '#4CAF50' : (s.state === 'offline' ? '#f44336' : 'rgba(180,180,180,0.35)'); b += `<div style="width:${s.percent}%;min-width:1px;height:100%;background:${c};flex-shrink:0;"></div>`; }
        return b || '<div style="flex:1;height:100%;background:rgba(180,180,180,0.25);border-radius:3px;"></div>';
    }

    _makeChip(label, value, chipBg, activeBg, activeColor, isDark) {
        const chip = document.createElement('span');
        chip.setAttribute('data-chip', '1');
        const isActive = (typeof value === 'number' && value === this._detailFilterPeriod) || (typeof value === 'string' && value === this._detailFilterPerson && value !== '');
        chip.style.cssText = isActive ? `padding:3px 10px;border-radius:12px;font-size:0.72rem;font-weight:500;cursor:pointer;white-space:nowrap;background:${activeBg};color:${activeColor};` : `padding:3px 10px;border-radius:12px;font-size:0.72rem;font-weight:500;cursor:pointer;white-space:nowrap;background:${chipBg};color:${isDark?'#ccc':'#555'};`;
        chip.textContent = label;
        return chip;
    }

    _refreshChips(container, activePerson, activePeriod, chipBg, activeBg, activeColor, isDark, mode) {
        container.querySelectorAll('[data-chip]').forEach(chip => {
            const label = chip.textContent;
            let isActive = false;
            if (mode === 'time') {
                isActive = (label === '24小时' && activePeriod === 24) || (label === '1小时' && activePeriod === 1) || (label === '6小时' && activePeriod === 6) || (label === '3天' && activePeriod === 72) || (label === '7天' && activePeriod === 168) || (label === '15天' && activePeriod === 360);
            } else {
                isActive = (label === '全部' && activePerson === '') || (label !== '全部' && activePerson !== '');
                if (isActive && activePerson) { isActive = chip.textContent === (this.hass?.states[activePerson]?.attributes?.friendly_name || activePerson); }
            }
            chip.style.background = isActive ? activeBg : chipBg;
            chip.style.color = isActive ? activeColor : (isDark ? '#ccc' : '#555');
        });
    }
}
customElements.define('xiaoshi-avatar-history-card', XiaoshiAvatarHistoryCard);
