import { LitElement, html, css } from "https://unpkg.com/lit-element@2.4.0/lit-element.js?module";
import { yamlToJson } from '../function/function.js';

window.customCards = window.customCards || [];
window.customCards.push({
    type: 'xiaoshi-avatar-pad-card',
    name: '消逝(A平板端)-头像卡片',
    description: '平板端头像卡片',
    preview: true
});

class XiaoshiAvatarPadCardEditor extends LitElement {
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
            .balance-row {
                display: flex;
                align-items: center;
                gap: 4px;
                margin-bottom: 4px;
            }
            .balance-row label {
                font-weight: bold;
                font-size: 11px;
                min-width: 14px;
            }
            .balance-row input {
                padding: 4px 6px;
                border: 1px solid #ddd;
                border-radius: 4px;
                font-size: 12px;
            }
            .balance-label {
                font-size: 10px;
                color: #aaa;
                min-width: 26px;
                text-align: right;
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

    _personFieldChanged(e) {
        const { name, value } = e.target;
        if (!name) return;

        const person = { ...(this.config.person || {}) };
        person[name] = value;
        this.config = { ...this.config, person };
        this._fireConfigChanged();
    }

    _balanceFieldChanged(index, e) {
        const { name, value } = e.target;
        if (!name) return;

        const balances = [...(this.config.balances || [{}, {}, {}])];
        while (balances.length <= index) balances.push({});
        balances[index] = { ...balances[index], [name]: value };
        this.config = { ...this.config, balances };
        this._fireConfigChanged();
    }

    _fireConfigChanged() {
        this.dispatchEvent(new CustomEvent('config-changed', {
            detail: { config: this.config },
            bubbles: true,
            composed: true
        }));
    }

    render() {
        if (!this.hass || !this.config) return html``;
        const c = this.config;
        const p = c.person || {};
        const balances = c.balances || [{}, {}, {}];

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
                    <input type="color" name="away_color" .value="${c.away_color || '#a5271f'}" @change="${this._valueChanged}" title="离家颜色" />
                </div>

                <div class="form-row">
                    <label>卡片宽度</label>
                    <input type="text" name="card_width" .value="${c.card_width || ''}" @change="${this._valueChanged}" placeholder="120px" style="max-width:100px" />
                    <label style="min-width:auto">卡片高度</label>
                    <input type="text" name="card_height" .value="${c.card_height || ''}" @change="${this._valueChanged}" placeholder="120px" style="max-width:100px" />
                </div>

                <div class="form-row">
                    <label>弹窗宽度</label>
                    <input type="text" name="popup_width" .value="${c.popup_width || ''}" @change="${this._valueChanged}" placeholder="500px" style="max-width:100px" />
                    <label style="min-width:auto">弹窗位置</label>
                    <input type="text" name="popup_top" .value="${c.popup_top || ''}" @change="${this._valueChanged}" placeholder="50%" style="max-width:100px" />
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

                <div class="section-title">人员配置</div>
                <div class="person-section">
                    <div class="form-row">
                        <label>人员实体</label>
                        <input type="text" name="person_entity" .value="${p.person_entity || ''}" @change="${this._personFieldChanged}" placeholder="person.xxx" />
                    </div>
                    <div class="form-row">
                        <label>设备IP实体</label>
                        <input type="text" name="tracker_entity" .value="${p.tracker_entity || ''}" @change="${this._personFieldChanged}" placeholder="device_tracker.xxx" />
                    </div>

                    <div class="form-row">
                        <label>距家计算</label>
                        <select name="distance_method" @change="${this._personFieldChanged}" style="flex:1;padding:6px 0px;border:1px solid #ddd;border-radius:4px;">
                            <option value="nav" .selected="${p.distance_method === 'nav' || !p.distance_method}">导航通勤数据</option>
                            <option value="ha" .selected="${p.distance_method === 'ha'}">HAGPS直线距离</option>
                        </select>
                    </div>
                    ${p.distance_method !== 'ha' ? html`
                    <div class="form-row">
                        <label>导航实体</label>
                        <input type="text" name="nav_entity" .value="${p.nav_entity || ''}" @change="${this._personFieldChanged}" placeholder="高德/腾讯导航实体" />
                    </div>
                    <div class="form-row">
                        <label>通勤方式</label>
                        <select name="commute_mode" @change="${this._personFieldChanged}" style="flex:1;padding:6px 0px;border:1px solid #ddd;border-radius:4px;">
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
                        <input type="text" name="gps_tracker_entity" .value="${p.gps_tracker_entity || ''}" @change="${this._personFieldChanged}" placeholder="device_tracker.xxx(app)" />
                    </div>
                    ` : ''}
                    <div class="form-row">
                        <label>家Zone实体</label>
                        <input type="text" name="zone_entity" .value="${p.zone_entity || ''}" @change="${this._personFieldChanged}" placeholder="zone.home" />
                    </div>

                    <div class="form-row">
                        <label>名字</label>
                        <input type="text" name="display_name" .value="${p.display_name || ''}" @change="${this._personFieldChanged}" placeholder="留空则取person名称" />
                    </div>
                    <div class="form-row">
                        <label>万年历实体</label>
                        <input type="text" name="calendar_entity" .value="${p.calendar_entity || ''}" @change="${this._personFieldChanged}" placeholder="calendar.xxx" />
                    </div>
                    <div class="form-row">
                        <label>生日索引</label>
                        <input type="number" name="birthday_index" .value="${p.birthday_index ?? 0}" @change="${this._personFieldChanged}" placeholder="0" style="max-width:60px" min="0" />
                    </div>

                    <div class="form-row">
                        <label>圆环类型</label>
                        <select name="ring_type" @change="${this._personFieldChanged}" style="flex:1;padding:6px 0px;border:1px solid #ddd;border-radius:4px;">
                            <option value="none" .selected="${p.ring_type === 'none' || !p.ring_type}">不显示</option>
                            <option value="battery" .selected="${p.ring_type === 'battery'}">电量</option>
                            <option value="storage" .selected="${p.ring_type === 'storage'}">存储</option>
                        </select>
                    </div>
                    <div class="form-row">
                        <label>电量实体</label>
                        <input type="text" name="battery_entity" .value="${p.battery_entity || ''}" @change="${this._personFieldChanged}" placeholder="sensor.xxx_battery" />
                    </div>
                    <div class="form-row">
                        <label>存储实体</label>
                        <input type="text" name="storage_entity" .value="${p.storage_entity || ''}" @change="${this._personFieldChanged}" placeholder="sensor.xxx_internal_storage" />
                    </div>
                </div>

                <div class="section-title">余额信息（最多3组）</div>
                <div class="person-section">
                    ${[0, 1, 2].map(i => {
                        const b = balances[i] || {};
                        return html`
                            <div class="balance-row">
                                <label>${i + 1}</label>
                                <input type="text" name="entity" .value="${b.entity || ''}" @change="${(e) => this._balanceFieldChanged(i, e)}" placeholder="sensor.xxx" style="flex:2;" />
                                <input type="text" name="name" .value="${b.name || ''}" @change="${(e) => this._balanceFieldChanged(i, e)}" placeholder="名称" style="flex:1;max-width:50px;" />
                                <input type="text" name="unit" .value="${b.unit || ''}" @change="${(e) => this._balanceFieldChanged(i, e)}" placeholder="单位" style="flex:1;max-width:40px;" />
                            </div>
                            <div class="balance-row">
                                <span class="balance-label">精度</span>
                                <input type="number" name="precision" .value="${b.precision ?? ''}" @change="${(e) => this._balanceFieldChanged(i, e)}" placeholder="1" style="flex:1;max-width:40px;" min="0" max="6" />
                                <span class="balance-label">预警值</span>
                                <input type="number" name="warning" .value="${b.warning ?? ''}" @change="${(e) => this._balanceFieldChanged(i, e)}" placeholder="10" style="flex:1;max-width:50px;" />
                            </div>
                        `;
                    })}
                </div>
            </div>
        `;
    }
}
customElements.define('xiaoshi-avatar-pad-card-editor', XiaoshiAvatarPadCardEditor);

class XiaoshiAvatarPadCard extends LitElement {

    static get properties() {
        return {
            hass: { type: Object },
            config: { type: Object }
        };
    }

    constructor() {
        super();
    }

    static get styles() {
        return css`
            :host {
                display: block;
            }
            ha-card {
                border-radius: 10px !important;
                overflow: visible;
                background: transparent !important;
            }
            .card-wrapper {
                position: relative;
                overflow: visible;
            }
            .card-item {
                position: relative;
                border-radius: 10px;
                overflow: hidden;
                display: flex;
                flex-direction: column;
                align-items: center;
                padding: 4px;
                font-family: var(--paper-font-body1_-_font-family);
                width: 100%;
                height: 100%;
                max-height: 100%;
                box-sizing: border-box;
                cursor: none;
                border: none;
            }
            .card-item:active {
              transform: scale(0.95);
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
            .top-left-info {
                position: absolute;
                top: 4px;
                left: 4px;
                display: flex;
                flex-direction: column;
                gap: 1px;
                z-index: 2;
            }
            .top-right-info {
                position: absolute;
                top: 4px;
                right: 4px;
                z-index: 2;
            }
            .overlay-text {
                font-size: 10px;
                color: rgba(255,255,255,0.95);
                white-space: nowrap;
                line-height: 1.2;
            }
            .status-text {
                font-size: 12px;
                font-weight: bold;
                color: #fff;
                margin-top: 2px;
                line-height: 1.2;
            }
            .status-duration {
                font-size: 0.8em;
                font-weight: normal;
                vertical-align: bottom;
                margin-left: 0.2em;
            }
            .balance-section {
                display: flex;
                justify-content: space-around;
                width: 100%;
                margin-top: auto;
                padding-top: 2px;
            }
            .balance-item {
                display: flex;
                flex-direction: column;
                align-items: center;
                flex: 1;
                min-width: 0;
            }
            .balance-name {
                font-size: 10px;
                color: rgba(255,255,255,0.9);
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
                max-width: 100%;
                line-height: 1.2;
            }
            .balance-value {
                font-size: 10px;
                font-weight: bold;
                color: #fff;
                white-space: nowrap;
                line-height: 1.2;
            }
            .balance-value-warning {
                color: #a5271f;
            }
        `;
    }

    static getConfigElement() {
        return document.createElement('xiaoshi-avatar-pad-card-editor');
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
     * 获取人员配置（兼容处理：优先 person 单对象，其次 persons 数组）
     */
    _getPersonConfig() {
        if (this.config.person) return this.config.person;
        if (this.config.persons && this.config.persons.length > 0) return this.config.persons[0];
        return {};
    }

    _getPersons() {
        if (this.config.person) return [this.config.person];
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

    // 改暗：通过降低透明度混合背景色，amount 0~1
    _darkenColor(color, amount) {
        const { r, g, b } = this._parseColor(color);
        const alpha = 1 - amount;
        return `rgba(${r},${g},${b},${alpha})`;
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
     * 获取余额信息
     * 返回 [{ name, value, unit }] 最多3组
     */
    _getBalanceData() {
        const balances = this.config.balances;
        if (!balances || !Array.isArray(balances)) return [];
        return balances.filter(b => b && b.entity).map(b => {
            const state = this.hass.states[b.entity];
            const rawValue = state ? state.state : '--';
            const unit = b.unit || (state ? (state.attributes.unit_of_measurement || '') : '') || '';
            const name = b.name || (state ? (state.attributes.friendly_name || '') : '') || b.entity.split('.').pop();
            const precision = b.precision != null && b.precision !== '' ? Number(b.precision) : 1;
            const warning = b.warning != null && b.warning !== '' ? Number(b.warning) : null;

            let displayValue = rawValue;
            const numVal = parseFloat(rawValue);
            if (!isNaN(numVal) && precision != null) {
                displayValue = numVal.toFixed(precision);
            }

            const isWarning = !isNaN(numVal) && warning != null && numVal < warning;

            return { name, value: displayValue, unit, isWarning };
        }).slice(0, 3);
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

        const pc = this._getPersonConfig();
        if (!pc.person_entity) return html``;

        const data = this._collectPersonData(pc);
        const allData = this._collectAllData();

        // 背景色
        const homeColor = this.config.home_color || '#1e738f';
        const awayColor = this.config.away_color || '#a5271f';
        const currentTheme = this._evaluateTheme();
        let bg = '#999';
        const alpha = currentTheme === 'dark' ? 0.5 : 0.3;
        if (data && data.isHome === true) {
            bg = this._darkenColor(homeColor, alpha);
        } else if (data && data.isHome === false) {
            bg = this._darkenColor(awayColor, alpha);
        }

        return html`
            <div class="card-wrapper" style="width:${this.config.card_width || '120px'};height:${this.config.card_height || '120px'};">
                <div class="card-item"
                    style="background:${bg};"
                    @click="${() => this._onCardClick()}">
                    ${this._renderCardContent(data, allData, pc)}
                </div>
            </div>
        `;
    }

    /**
     * 点击卡片触发弹窗
     */
    _onCardClick() {
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
                theme_mode: this._evaluateTheme()
            });
        }

        // 2. 添加附加卡片（other_cards）
        if (this.config.other_cards && this.config.other_cards.trim()) {
            try {
                const additionalCards = yamlToJson(this.config.other_cards);
                const theme = this._evaluateTheme();
                const cardsWithTheme = additionalCards.map(card => {
                    if (!card.theme && this.config.theme) {
                        return { ...card, theme: this.config.theme === 'system' ? theme : this.config.theme };
                    }
                    return card;
                });
                cards.push(...cardsWithTheme);
            } catch (err) {
                console.error('[XiaoshiAvatarPadCard] 解析附加卡片失败:', err);
            }
        }

        if (cards.length === 0) return;

        const serviceData = { card: cards };
        const popupWidth = this.config.popup_width || '500px';
        const popupTop = this.config.popup_top || '50%';
        serviceData.popup_width = popupWidth;
        serviceData.popup_top = popupTop;
        serviceData.background = 'transparent';
        this.hass.callService('popup_card', 'show', serviceData);
        this._handleClick();
    }

    /**
     * 渲染卡片内容（头像+状态+生日+距离+时间+余额）
     */
    _renderCardContent(data, allData, personConfig) {
        if (!data || !data.person) return html``;

        // ===== 左上角：通勤距离/直线距离 + 通勤时间 =====
        let topLeftHtml = html``;
        if (data.distance) {
            const distValue = (data.distance.distance || '')
                .replace(/([\d.]+)(公里|千米|km)/i, (_, n) => Math.round(parseFloat(n)) + 'km')
                .replace('公里', 'km').replace('千米', 'km');
            const timeValue = (data.distance.time || '').replace('分钟', '分').replace('小时', '时');

            const modeIcons = { driving: '🚗', transit: '🚌', cycling: '🚲', walking: '🚶' };
            const distIcon = data.distance.is_straight_line ? '🌏' : (modeIcons[personConfig.commute_mode] || '🌏');
            const items = [];
            if (distValue) items.push(html`<div class="overlay-text">${distIcon} ${distValue}</div>`);
            if (timeValue) items.push(html`<div class="overlay-text">🕐 ${timeValue}</div>`);

            if (items.length > 0) {
                topLeftHtml = html`<div class="top-left-info">${items}</div>`;
            }
        }

        // ===== 右上角：存储%/电量% =====
        let topRightHtml = html``;
        {
            const topRightItems = [];
            if (data.storage) topRightItems.push(html`<div class="overlay-text">💾${data.storage.percent}%</div>`);
            if (data.battery) topRightItems.push(html`<div class="overlay-text">🔋${data.battery.level}%</div>`);
            if (topRightItems.length > 0) {
                topRightHtml = html`<div class="top-right-info">${topRightItems}</div>`;
            }
        }

        // ===== 头像+圆环（居中上方） =====
        const avatarHtml = this._renderAvatarWithRingForConfig(data, personConfig);

        // ===== 名字 + 生日 =====
        let nameBirthdayHtml = html``;
        const displayName = personConfig.display_name || data.person.name || '';
        const hasBirthday = data.birthday && data.birthday.days != null;
        if (displayName || hasBirthday) {
            const bdText = hasBirthday ? (data.birthday.days === 0 ? '🎂今天' : `🎂${data.birthday.days}天`) : '';
            const namePart = displayName ? html`<span style="margin-right:8px;font-size:13px;font-weight:bold;">${displayName}</span>` : '';
            nameBirthdayHtml = html`<div class="overlay-text" style="text-align:center;">${namePart}${bdText}</div>`;
        }

        // ===== 状态文字 =====
        const duration = this._formatDuration(data.lastChanged);
        let statusHtml = html``;
        if (data.isHome === true) {
            statusHtml = html`<div class="status-text">在家${duration ? html`<span class="status-duration">${duration}</span>` : ''}</div>`;
        } else {
            statusHtml = html`<div class="status-text">离家${duration ? html`<span class="status-duration">${duration}</span>` : ''}</div>`;
        }

        // ===== 余额信息 =====
        let balanceHtml = html``;
        const balances = this._getBalanceData();
        if (balances.length > 0) {
            balanceHtml = html`<div class="balance-section">
                ${balances.map(b => html`
                    <div class="balance-item">
                        <div class="balance-name">${b.name}</div>
                        <div class="balance-value ${b.isWarning ? 'balance-value-warning' : ''}">${b.value}${b.unit}</div>
                    </div>
                `)}
            </div>`;
        }

        return html`
            ${topLeftHtml}
            ${topRightHtml}
            <div style="margin-top:10px;display:flex;flex-direction:column;align-items:center;">
                ${avatarHtml}
                ${nameBirthdayHtml}
                ${statusHtml}
            </div>
            ${balanceHtml}
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
        const avatarContainerSize = 46;
        const avatarInnerSize = 36;

        const avatarContent = avatarUrl
            ? html`<img class="avatar-img" src="${avatarUrl}" alt="${data.person.name}" style="width:${avatarInnerSize}px;height:${avatarInnerSize}px;" />`
            : html`<div class="avatar-placeholder" style="width:${avatarInnerSize}px;height:${avatarInnerSize}px;font-size:18px;">${(data.person.name || '?')[0]}</div>`;

        return html`
            <div class="avatar-container" style="width:${avatarContainerSize}px;height:${avatarContainerSize}px;">
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
customElements.define('xiaoshi-avatar-pad-card', XiaoshiAvatarPadCard);
