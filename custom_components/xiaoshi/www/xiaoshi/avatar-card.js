import { LitElement, html, css } from "https://unpkg.com/lit-element@2.4.0/lit-element.js?module";
console.info("%c 消逝卡-xxxx \n%c  xxxxxxxxx2 ", "color: red; font-weight: bold; background: black", "color: white; font-weight: bold; background: black");

window.customCards = window.customCards || [];
window.customCards.push({
    type: 'xiaoshi-avatar-card',
    name: '消逝手机端头像卡片',
    description: '消逝手机端头像卡片',
    preview: true
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
            person_entity: '',
            tracker_entity: '',
            distance_method: 'nav',
            nav_entity: '',
            commute_mode: 'driving',
            gps_tracker_entity: '',
            zone_entity: '',
            calendar_entity: '',
            birthday_index: 0,
            battery_entity: '',
            storage_entity: '',
            ring_type: 'none'
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
                    <input type="color" name="home_color" .value="${c.home_color || '#2196f3'}" @change="${this._valueChanged}" title="在家颜色" />
                    <label style="min-width:auto">离家</label>
                    <input type="color" name="away_color" .value="${c.away_color || '#f44336'}" @change="${this._valueChanged}" title="离家颜色" />
                </div>

                <div class="form-row">
                    <label>卡片宽度</label>
                    <input type="text" name="card_width" .value="${c.card_width || ''}" @change="${this._valueChanged}" placeholder="100%" style="max-width:100px" />
                    <label style="min-width:auto">卡片高度</label>
                    <input type="text" name="card_height" .value="${c.card_height || ''}" @change="${this._valueChanged}" placeholder="auto" style="max-width:100px" />
                </div>

                <div class="form-row">
                    <label>弹窗宽度</label>
                    <input type="text" name="popup_width" .value="${c.popup_width || ''}" @change="${this._valueChanged}" placeholder="95%" style="max-width:100px" />
                    <label style="min-width:auto">弹窗位置</label>
                    <input type="text" name="popup_top" .value="${c.popup_top || ''}" @change="${this._valueChanged}" placeholder="20px" style="max-width:100px" />
                </div>
                <div class="form-row">
                    <label>弹窗地图</label>
                    <select name="show_popup_map" @change="${this._valueChanged}" style="flex:1;padding:6px 0px;border:1px solid #ddd;border-radius:4px;">
                        <option value="true" .selected="${c.show_popup_map !== 'false'}">显示</option>
                        <option value="false" .selected="${c.show_popup_map === 'false'}">隐藏</option>
                    </select>
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
            _activeIndex: { type: Number }
        };
    }

    constructor() {
        super();
        this._activeIndex = 0;
        this._touchStartX = 0;
        this._touchStartY = 0;
        this._swipeDetected = false;
    }

    static get styles() {
        return css`
            :host {
                display: block;
                height: 100%;
            }
            ha-card {
                border-radius: 6vw !important;
                overflow: hidden;
            }
            .card-wrapper {
                position: relative;
                width: 100%;
                height: 100%;
                overflow: visible;
                touch-action: pan-y;
            }
            .card-item {
                border-radius: 6vw;
                overflow: hidden;
                display: flex;
                flex-direction: column;
                align-items: center;
                padding-top: 8%;
                padding-bottom: 4%;
                font-family: var(--paper-font-body1_-_font-family);
                width: 60%;
                height: 100%;
                transform-origin: top center;
                transition: left 0.35s ease, transform 0.35s ease, opacity 0.35s ease, background-color 0.35s ease;
                cursor: pointer;
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
                font-size: 3.5vw;
                font-weight: bold;
                color: #fff;
                margin-top: 2%;
                text-shadow: 0 1px 2px rgba(0,0,0,0.3);
            }
            .status-badge {
                position: absolute;
                top: -0.5em;
                right: -1em;
                background: rgba(255,255,255,0.9);
                color: #333;
                font-size: 2vw;
                font-weight: bold;
                min-width: 1.2em;
                height: 1.2em;
                line-height: 1.2em;
                text-align: center;
                border-radius: 50%;
                padding: 0 0.2em;
                box-shadow: 0 1px 3px rgba(0,0,0,0.3);
            }
            .info-text {
                font-size: 2.5vw;
                color: rgba(255,255,255,0.9);
                margin-top: 1%;
                text-shadow: 0 1px 2px rgba(0,0,0,0.3);
            }
        `;
    }

    static getConfigElement() {
        return document.createElement('xiaoshi-avatar-card-editor');
    }

    static getStubConfig() {
        return {
            show_popup_map: 'true',
            home_color: '#2196f3',
            away_color: '#f44336',
            persons: [
                {
                    person_entity: '',
                    tracker_entity: '',
                    distance_method: 'nav',
                    nav_entity: '',
                    commute_mode: 'driving',
                    gps_tracker_entity: '',
                    zone_entity: '',
                    calendar_entity: '',
                    birthday_index: 0,
                    battery_entity: '',
                    storage_entity: '',
                    ring_type: 'none'
                }
            ]
        };
    }

    setConfig(config) {
        if (!config) throw new Error('无效配置');
        this.config = config;
    }

    disconnectedCallback() {
        super.disconnectedCallback();
        this._closePopup();
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

    _hexToRgb(hex) {
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);
        return { r, g, b };
    }

    // 改淡：将颜色向白色混合，amount 0~1
    _lightenColor(hex, amount) {
        const { r, g, b } = this._hexToRgb(hex);
        const lr = Math.round(r + (255 - r) * amount);
        const lg = Math.round(g + (255 - g) * amount);
        const lb = Math.round(b + (255 - b) * amount);
        return `rgb(${lr},${lg},${lb})`;
    }

    // 改暗：将颜色向黑色混合，amount 0~1
    _darkenColor(hex, amount) {
        const { r, g, b } = this._hexToRgb(hex);
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
        const distance = this._getDistanceData(personConfig);
        const birthday = this._getBirthdayData(personConfig);
        const battery = this._getBatteryData(personConfig);
        const storage = this._getStorageData(personConfig);

        return {
            person,       // { name, avatar, state }
            isHome,       // true/false/null
            distance,     // { distance, time, is_straight_line } 或 null
            birthday,     // { name, days, description } 或 null
            battery,      // { level, charging } 或 null
            storage       // { percent, free, total } 或 null
        };
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
                    : (currentTheme === 'dark' ? this._lightenColor(this._darkenColor(homeColor, 0.3), 0.3) : this._lightenColor(homeColor, 0.3));
            } else if (data && data.isHome === false) {
                bg = isMain
                    ? (currentTheme === 'dark' ? this._darkenColor(awayColor, 0.3) : awayColor)
                    : (currentTheme === 'dark' ? this._lightenColor(this._darkenColor(awayColor, 0.3), 0.3) : this._lightenColor(awayColor, 0.3));
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
                    style="position:${position};${position === 'absolute' ? 'top:0;' : ''}left:${left};transform:scale(${scale});background:${bg};z-index:${zIndex};"
                    data-is-main="${isMain}"
                    @click="${() => this._onCardClick(pc, isMain)}">
                    ${this._renderCardContent(data, allData, pc, isMain)}
                </div>
            `;
        });

        return html`
            <div class="card-wrapper" style="width:${this.config.card_width || '100%'};height:${this.config.card_height || '100%'};"
                @touchstart="${this._onTouchStart}"
                @touchend="${this._onTouchEnd}"
                @mousedown="${this._onMouseDown}"
                @mouseup="${this._onMouseUp}">
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
    }

    /**
     * 点击卡片触发弹窗
     */
    _onCardClick(personConfig, isMain) {
        if (!isMain) return;
        if (this._swipeDetected) {
            this._swipeDetected = false;
            return;
        }

        const cards = [];
        const persons = this._getPersons();

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

            cards.push({
                type: 'map',
                entities: mapEntities,
                aspect_ratio: '16:9',
                theme_mode: 'auto'
            });
        }

        // 2. 添加附加卡片（other_cards）
        if (this.config.other_cards && this.config.other_cards.trim()) {
            try {
                const additionalCards = this._parseYamlCards(this.config.other_cards);
                const theme = this._evaluateTheme();
                const cardsWithTheme = additionalCards.map(card => {
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

        if (cards.length === 0) return;

        const popupContent = cards.length === 1 ? cards[0] : { type: 'vertical-stack', cards };
        this._showPopup(popupContent);
    }

    /**
     * 渲染卡片内容（头像+状态+生日+距离+时间）
     * isMain: 是否为主卡
     */
    _renderCardContent(data, allData, personConfig, isMain = true) {
        if (!data || !data.person) return html``;

        // 渲染头像+圆环
        const avatarHtml = this._renderAvatarWithRingForConfig(data, personConfig);

        // 渲染状态文字
        let statusHtml = html``;
        if (isMain) {
            // 主卡：有人在家显示"在家"+角标，全不在家显示"离家"
            if (allData.homeCount > 0) {
                statusHtml = html`
                    <div class="status-text">
                        在家
                        <span class="status-badge">${allData.homeCount}</span>
                    </div>
                `;
            } else {
                statusHtml = html`<div class="status-text">离家</div>`;
            }
        } else {
            // 副卡：只显示当前人的在家/离家，无角标
            statusHtml = html`<div class="status-text">${data.isHome === true ? '在家' : '离家'}</div>`;
        }

        // 渲染生日信息
        let birthdayHtml = html``;
        if (data.birthday && data.birthday.days != null) {
            birthdayHtml = html`<div class="info-text">🎂 ${data.birthday.days}天</div>`;
        }

        // 渲染距家距离和时间
        let distanceHtml = html``;
        let timeHtml = html``;
        if (data.distance) {
            const commuteMode = personConfig ? (personConfig.commute_mode || 'driving') : 'driving';
            const modeIcons = { driving: '🚗', transit: '🚌', cycling: '🚲', walking: '🚶' };
            const distIcon = data.distance.is_straight_line ? '🚗' : (modeIcons[commuteMode] || '🚗');
            const distValue = (data.distance.distance || '').replace('公里', 'km').replace('千米', 'km');
            const timeValue = (data.distance.time || '').replace('分钟', 'min').replace('小时', 'h');

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
            <div class="avatar-container" style="width:80%;aspect-ratio:1/1;">
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

    // ===== 弹窗相关方法 =====
    _handleClick() {
        const hapticEvent = new Event('haptic', {
            bubbles: true,
            cancelable: false,
            composed: true
        });
        hapticEvent.detail = 'light';
        this.dispatchEvent(hapticEvent);
    }

    _injectPopupStyles() {
        if (XiaoshiAvatarCard._stylesInjected) return;
        XiaoshiAvatarCard._stylesInjected = true;
        const style = document.createElement('style');
        style.id = 'xiaoshi-avatar-card-popup-style';
        style.textContent = `
            @keyframes xiaoshiAvatarCardPopupIn {
                from { opacity: 0; transform: translateX(-50%) scale(0.95); }
                to   { opacity: 1; transform: translateX(-50%) scale(1); }
            }
        `;
        document.head.appendChild(style);
    }

    _showPopup(cardConfig) {
        if (!cardConfig) return;
        if (typeof cardConfig === 'string') {
            try {
                const parsed = this._parseYamlCards(cardConfig);
                if (parsed && parsed.length > 0) {
                    if (parsed.length === 1) {
                        cardConfig = parsed[0];
                    } else {
                        cardConfig = { type: 'vertical-stack', cards: parsed };
                    }
                } else {
                    console.error('[XiaoshiAvatarCard] 弹窗配置解析为空');
                    return;
                }
            } catch (err) {
                console.error('[XiaoshiAvatarCard] 弹窗配置解析失败:', err);
                return;
            }
        }
        this._handleClick();
        this._injectPopupStyles();

        const haRoot = document.querySelector('home-assistant');
        const hassObj = haRoot?.hass || haRoot?.shadowRoot?.querySelector('home-assistant-main')?.hass;
        if (!hassObj) {
            console.error('[XiaoshiAvatarCard] 无法获取 hass 对象');
            return;
        }

        if (this._popupOverlay) {
            this._closePopup();
        }

        const overlay = document.createElement('div');
        overlay.style.cssText = `
            position: fixed;
            top: 0; left: 0; right: 0; bottom: 0;
            background: rgba(0, 0, 0, 0.5);
            z-index: 1000;
            -webkit-backdrop-filter: blur(10px);
            backdrop-filter: blur(10px);
            pointer-events: auto;
        `;
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) this._closePopup();
        });

        const popupWidth = this.config.popup_width || '95%';
        const popupTop = this.config.popup_top || '20px';
        const popup = document.createElement('div');
        popup.style.cssText = `
            position: fixed;
            top: ${popupTop}; left: 50%;
            transform: translateX(-50%);
            z-index: 1005;
            background: transparent;
            padding: 0;
            width: ${popupWidth};
            max-width: 100vw;
            max-height: 100vh;
            overflow: hidden;
            box-sizing: border-box;
            animation: xiaoshiAvatarCardPopupIn 0.2s ease-out;
        `;

        document.body.appendChild(overlay);
        document.body.appendChild(popup);

        this._popupOverlay = overlay;
        this._popupElement = popup;

        this._createPopupCard(popup, cardConfig, hassObj);

        this._popupEscHandler = (e) => {
            if (e.key === 'Escape') this._closePopup();
        };
        window.addEventListener('keydown', this._popupEscHandler);
    }

    async _createPopupCard(container, cardConfig, hassObj) {
        try {
            const helpers = await window.loadCardHelpers?.();
            if (helpers) {
                const cardElement = await helpers.createCardElement(cardConfig);
                cardElement.hass = hassObj;
                container.appendChild(cardElement);
                this._popupCardElement = cardElement;
                this._startPopupHassWatcher(hassObj);
            } else {
                container.innerHTML = '<div style="color:red;padding:20px;">loadCardHelpers 不可用</div>';
            }
        } catch (err) {
            console.error('[XiaoshiAvatarCard] 创建弹窗卡片失败:', err);
            container.innerHTML = `<div style="color:red;padding:20px;">加载失败: ${err.message}</div>`;
        }
    }

    _closePopup() {
        if (this._popupOverlay) {
            this._popupOverlay.remove();
            this._popupOverlay = null;
        }
        if (this._popupElement) {
            this._popupElement.remove();
            this._popupElement = null;
        }
        this._popupCardElement = null;
        if (this._popupEscHandler) {
            window.removeEventListener('keydown', this._popupEscHandler);
            this._popupEscHandler = null;
        }
        if (this._popupHassUnsubscribe) {
            this._popupHassUnsubscribe();
            this._popupHassUnsubscribe = null;
        }
        this._popupUpdatePending = false;
        this._popupHass = null;
    }

    _startPopupHassWatcher(hassObj) {
        if (this._popupHassUnsubscribe) return;
        this._popupHass = hassObj;
        if (!hassObj || !hassObj.connection) {
            setTimeout(() => this._startPopupHassWatcher(hassObj), 500);
            return;
        }
        try {
            hassObj.connection.subscribeMessage(
                () => {
                    if (!this._popupCardElement) return;
                    this._schedulePopupUpdate();
                },
                { type: 'subscribe_events', event_type: 'state_changed' }
            ).then((unsub) => {
                this._popupHassUnsubscribe = unsub;
            });
        } catch (err) {
            console.error('[XiaoshiAvatarCard] 订阅状态变化失败:', err);
        }
    }

    _schedulePopupUpdate() {
        if (this._popupUpdatePending) return;
        this._popupUpdatePending = true;
        requestAnimationFrame(() => {
            this._popupUpdatePending = false;
            if (!this._popupCardElement) return;
            const haRoot = document.querySelector('home-assistant');
            const newHass = haRoot?.hass || haRoot?.shadowRoot?.querySelector('home-assistant-main')?.hass;
            if (!newHass) return;
            if (newHass === this._popupHass) return;
            this._popupHass = newHass;
            this._updatePopupCard();
        });
    }

    _updatePopupCard() {
        if (this._popupCardElement && this._popupHass) {
            try {
                this._popupCardElement.hass = this._popupHass;
            } catch (err) {
                console.warn('[XiaoshiAvatarCard] 弹窗卡片更新失败:', err.message);
            }
        }
    }

    // ===== YAML 解析方法 =====
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
            console.error('[XiaoshiAvatarCard] YAML解析错误:', error);
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
customElements.define('xiaoshi-avatar-card', XiaoshiAvatarCard);
