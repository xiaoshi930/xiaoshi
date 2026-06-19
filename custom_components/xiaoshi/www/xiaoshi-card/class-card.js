import { LitElement, html, css } from "https://unpkg.com/lit-element@2.4.0/lit-element.js?module";

// ==================== 注册自定义卡片 ====================
window.customCards = window.customCards || [];
window.customCards.push({
    type: 'xiaoshi-class-card',
    name: '消逝卡-课程表卡片',
    description: '消逝卡课程表卡片',
    preview: true
});

// ==================== 编辑器 ====================
class XiaoshiClassCardEditor extends LitElement {
    static get properties() {
        return {
            hass: { type: Object },
            config: { type: Object },
            _searchTerm: { type: String },
            _filteredEntities: { type: Array },
            _showEntityList: { type: Boolean },
            _showTimeSettings: { type: Boolean }
        };
    }

    constructor() {
        super();
        this._searchTerm = '';
        this._filteredEntities = [];
        this._showEntityList = false;
        this._showTimeSettings = false;
        this._lastSelectedEntity = '';
    }

    setConfig(config) {
        this._config = config || {};
        this._lastSelectedEntity = this._config.entity || '';
    }

    _getFilteredEntities() {
        if (!this.hass) return [];
        let entities = Object.keys(this.hass.states)
            .filter(eid => eid.startsWith('sensor.class_schedule_'))
            .sort();
        if (this._searchTerm) {
            const term = this._searchTerm.toLowerCase();
            entities = entities.filter(eid => {
                const state = this.hass.states[eid];
                const friendly = state?.attributes?.friendly_name || '';
                return eid.toLowerCase().includes(term) ||
                       friendly.toLowerCase().includes(term) ||
                       (state?.attributes?.['年级'] || '').toLowerCase().includes(term) ||
                       (state?.attributes?.['学生'] || '').toLowerCase().includes(term);
            });
        }
        this._filteredEntities = entities;
        return entities;
    }

    _toggleEntityList() {
        this._showEntityList = !this._showEntityList;
        if (this._showEntityList) {
            this._getFilteredEntities();
        }
    }

    _selectEntity(eid) {
        const entities = this._getEntities();
        if (entities.length === 0) {
            this._dispatchConfigChanged({ ...this._config, entities: [eid] });
        } else {
            const list = [...entities];
            list[0] = eid;
            this._dispatchConfigChanged({ ...this._config, entities: list });
        }
        this._lastSelectedEntity = eid;
        this._showEntityList = false;
        this._searchTerm = '';
    }

    _onSearchInput(e) {
        this._searchTerm = e.target.value;
        this._getFilteredEntities();
    }

    _onEntityNameInput(e) {
        const entity = e.target.value.trim();
        const entities = this._getEntities();
        if (entities.length === 0) {
            this._dispatchConfigChanged({ ...this._config, entities: [entity] });
        } else {
            const list = [...entities];
            list[0] = entity;
            this._dispatchConfigChanged({ ...this._config, entities: list });
        }
        this._lastSelectedEntity = entity;
    }

    _dispatchConfigChanged(newConfig) {
        const event = new CustomEvent('config-changed', {
            detail: { config: newConfig },
            bubbles: true,
            composed: true,
        });
        this.dispatchEvent(event);
    }

    _toggleTimeSettings() {
        this._showTimeSettings = !this._showTimeSettings;
    }

    _onPeriodsChange(e) {
        const val = parseInt(e.target.value);
        if (val > 0) {
            this._dispatchConfigChanged({ ...this._config, periods_per_day: val });
        }
    }

    _getEntity() {
        return this._getEntities()[0] || this._lastSelectedEntity || '';
    }

    _getEntityFriendlyName() {
        if (!this.hass || !this._getEntity()) return '';
        const state = this.hass.states[this._getEntity()];
        if (!state) return '';
        return state.attributes?.friendly_name || this._getEntity();
    }

    _getEntityGrade() {
        if (!this.hass) return '';
        const state = this.hass.states[this._getEntity()];
        return state?.attributes?.['年级'] || '';
    }

    _getEntityStudent() {
        if (!this.hass) return '';
        const state = this.hass.states[this._getEntity()];
        return state?.attributes?.['学生'] || '';
    }

    _getEntityPeriods() {
        if (!this.hass) return 6;
        const state = this.hass.states[this._getEntity()];
        let p = parseInt(state?.attributes?.['每天节数']);
        return isNaN(p) || p <= 0 ? 6 : p;
    }

    _getCardWidth() {
        return this._config?.card_width || '';
    }

    _onCardWidthChange(e) {
        const val = e.target.value.trim();
        this._dispatchConfigChanged({ ...this._config, card_width: val });
    }

    _getTheme() {
        return this._config?.theme || 'system';
    }

    _onThemeChange(e) {
        this._dispatchConfigChanged({ ...this._config, theme: e.target.value });
    }

    _getEntities() {
        return this._config?.entities || (this._config?.entity ? [this._config.entity] : []);
    }

    _addEntity() {
        const list = [...this._getEntities(), ''];
        this._dispatchConfigChanged({ ...this._config, entities: list });
    }

    _onEntityItemChange(index, e) {
        const list = [...this._getEntities()];
        list[index] = e.target.value.trim();
        this._dispatchConfigChanged({ ...this._config, entities: list });
    }

    _removeEntity(index) {
        const list = this._getEntities().filter((_, i) => i !== index);
        const cfg = { ...this._config, entities: list };
        if (list.length === 0) delete cfg.entities;
        this._dispatchConfigChanged(cfg);
    }

    render() {
        const entity = this._getEntities()[0] || '';
        const friendly = this._getEntityFriendlyName();
        const grade = this._getEntityGrade();
        const student = this._getEntityStudent();
        const periods = this._getEntityPeriods();
        const entities = this._getFilteredEntities();

        return html`
            <div class="form">
                <!-- 实体选择区域 -->
                <div class="form-group">
                    <label>课程表实体 <span style="color: var(--primary-color);font-weight:normal;float:right;">默认搜索 sensor.class_schedule_ 开头</span></label>
                    <div class="entity-picker-row">
                        <input
                            type="text"
                            .value=${entity}
                            @input=${this._onEntityNameInput}
                            placeholder="输入实体ID，如 sensor.class_schedule_zhangzixuan"
                        />
                        <button class="btn-search" @click=${this._toggleEntityList} title="搜索可选实体">
                            🔍
                        </button>
                    </div>
                    ${entity && friendly ? html`
                        <div class="entity-meta">
                            ${grade ? html`<span class="meta-tag">${grade}</span>` : ''}
                            ${student ? html`<span class="meta-tag">${student}</span>` : ''}
                            <span class="meta-tag gray">每天 ${periods} 节</span>
                        </div>
                    ` : ''}
                </div>

                <!-- 下拉实体列表 -->
                ${this._showEntityList ? html`
                    <div class="entity-search-box">
                        <input
                            type="text"
                            .value=${this._searchTerm}
                            @input=${this._onSearchInput}
                            placeholder="搜索实体..."
                            autofocus
                        />
                        <div class="entity-list">
                            ${entities.length === 0 ? html`
                                <div class="entity-empty">未找到匹配的实体（搜索 sensor.class_schedule_ 开头）</div>
                            ` : entities.map(eid => {
                                const st = this.hass?.states[eid];
                                const fn = st?.attributes?.friendly_name || '';
                                const g = st?.attributes?.['年级'] || '';
                                const s = st?.attributes?.['学生'] || '';
                                const selected = eid === entity ? 'selected' : '';
                                return html`
                                    <div class="entity-item ${selected}" @click=${() => this._selectEntity(eid)}>
                                        <div class="entity-id">${eid}</div>
                                        <div class="entity-info">
                                            ${fn ? html`<span>${fn}</span>` : ''}
                                            ${g ? html`<span class="sub">${g}</span>` : ''}
                                            ${s ? html`<span class="sub">${s}</span>` : ''}
                                        </div>
                                    </div>
                                `;
                            })}
                        </div>
                    </div>
                ` : ''}

                <!-- 多实体 -->
                <div class="form-group">
                    <label>多实体 <span style="font-weight:normal;color:var(--secondary-text-color, #757575);">（添加后可点击标签切换）</span></label>
                    ${this._getEntities().map((eid, idx) => html`
                        <div class="entity-picker-row" style="margin-bottom:4px;">
                            <input
                                type="text"
                                .value=${eid}
                                @input=${(e) => this._onEntityItemChange(idx, e)}
                                placeholder="实体ID，如 sensor.class_schedule_xxx"
                            />
                            <button class="btn-remove" @click=${() => this._removeEntity(idx)} title="移除">×</button>
                        </div>
                    `)}
                    <button class="btn-add-entity" @click=${this._addEntity}>＋ 添加实体</button>
                </div>

                <!-- 高级设置 -->
                <div class="form-group">
                    <label class="toggle-label" @click=${this._toggleTimeSettings}>
                        ⚙️ 高级设置 ${this._showTimeSettings ? '▲' : '▼'}
                    </label>
                    ${this._showTimeSettings ? html`
                        <div class="advanced-settings">
                            <div class="form-row">
                                <label>每天节数:</label>
                                <input
                                    type="number"
                                    min="1"
                                    max="12"
                                    .value=${periods}
                                    @input=${this._onPeriodsChange}
                                />
                            </div>
                            <div class="form-row">
                                <label>卡片宽度:</label>
                                <input
                                    type="text"
                                    .value=${this._getCardWidth()}
                                    @input=${this._onCardWidthChange}
                                    placeholder="如 100% 或 400px，留空自适应"
                                />
                            </div>
                            <div class="form-row">
                                <label>主题:</label>
                                <select .value=${this._getTheme()} @change=${this._onThemeChange}>
                                    <option value="system">跟随系统</option>
                                    <option value="light">浅色</option>
                                    <option value="dark">深色</option>
                                    <option value="sun">跟随日出日落</option>
                                </select>
                            </div>
                        </div>
                    ` : ''}
                </div>
            </div>
        `;
    }

    static get styles() {
        return css`
            .form {
                display: flex;
                flex-direction: column;
                gap: 12px;
                min-height: 200px;
                padding: 4px;
            }
            .form-group {
                display: flex;
                flex-direction: column;
                gap: 6px;
            }
            .form-row {
                display: flex;
                align-items: center;
                gap: 8px;
            }
            .form-row label {
                white-space: nowrap;
                min-width: 80px;
            }
            .form-row input {
                flex: 1;
                padding: 6px 8px;
                border: 1px solid #ddd;
                border-radius: 4px;
            }
            label {
                font-weight: bold;
                font-size: 13px;
                color: var(--primary-text-color, #212121);
            }
            input, select {
                padding: 8px;
                border: 1px solid #ddd;
                border-radius: 4px;
                font-size: 13px;
                width: 100%;
                box-sizing: border-box;
                background: var(--card-background-color, #fff);
                color: var(--primary-text-color, #212121);
            }
            .entity-picker-row {
                display: flex;
                gap: 6px;
            }
            .entity-picker-row input {
                flex: 1;
            }
            .btn-search {
                background: var(--primary-color, #1976D2);
                border: none;
                border-radius: 4px;
                padding: 4px 10px;
                cursor: pointer;
                font-size: 16px;
                color: #fff;
                white-space: nowrap;
            }
            .btn-search:hover {
                opacity: 0.85;
            }
            .btn-remove {
                background: #ef5350;
                border: none;
                border-radius: 4px;
                padding: 6px 10px;
                cursor: pointer;
                font-size: 14px;
                color: #fff;
                white-space: nowrap;
                flex-shrink: 0;
            }
            .btn-remove:hover {
                background: #c62828;
            }
            .btn-add-entity {
                background: none;
                border: 1px dashed var(--primary-color, #1976D2);
                border-radius: 4px;
                padding: 6px;
                cursor: pointer;
                font-size: 12px;
                color: var(--primary-color, #1976D2);
                width: 100%;
            }
            .btn-add-entity:hover {
                background: rgba(25, 118, 210, 0.06);
            }
            .entity-meta {
                display: flex;
                gap: 6px;
                flex-wrap: wrap;
            }
            .meta-tag {
                display: inline-block;
                background: var(--primary-color, #1976D2);
                color: #fff;
                font-size: 11px;
                padding: 2px 8px;
                border-radius: 10px;
            }
            .meta-tag.gray {
                background: #9E9E9E;
            }
            .entity-search-box {
                border: 1px solid #ddd;
                border-radius: 6px;
                overflow: hidden;
                background: var(--card-background-color, #fff);
            }
            .entity-search-box input {
                border: none;
                border-bottom: 1px solid #eee;
                border-radius: 0;
                padding: 8px 10px;
            }
            .entity-list {
                max-height: 180px;
                overflow-y: auto;
            }
            .entity-item {
                padding: 8px 10px;
                cursor: pointer;
                border-bottom: 1px solid #f0f0f0;
                transition: background 0.15s;
            }
            .entity-item:hover {
                background: var(--primary-color, #1976D2);
                color: #fff;
            }
            .entity-item.selected {
                background: #E3F2FD;
                font-weight: bold;
            }
            .entity-item.selected:hover {
                background: var(--primary-color, #1976D2);
            }
            .entity-id {
                font-size: 12px;
                font-family: monospace;
                color: var(--secondary-text-color, #757575);
            }
            .entity-item:hover .entity-id {
                color: rgba(255,255,255,0.8);
            }
            .entity-info {
                font-size: 12px;
                display: flex;
                gap: 8px;
                flex-wrap: wrap;
                margin-top: 2px;
            }
            .entity-info .sub {
                color: var(--secondary-text-color, #9E9E9E);
            }
            .entity-item:hover .entity-info .sub {
                color: rgba(255,255,255,0.7);
            }
            .entity-empty {
                padding: 16px;
                text-align: center;
                color: var(--secondary-text-color, #9E9E9E);
                font-size: 13px;
            }
            .toggle-label {
                cursor: pointer;
                user-select: none;
                color: var(--secondary-text-color, #757575);
                font-weight: normal;
            }
            .toggle-label:hover {
                color: var(--primary-color, #1976D2);
            }
            .advanced-settings {
                padding: 10px;
                background: var(--divider-color, #F5F5F5);
                border-radius: 6px;
            }
        `;
    }
}
customElements.define('xiaoshi-class-card-editor', XiaoshiClassCardEditor);

// ==================== 主卡片 ====================
class XiaoshiClassCard extends LitElement {
    static getConfigElement() {
        return document.createElement("xiaoshi-class-card-editor");
    }

    static get properties() {
        return {
            hass: { type: Object },
            config: { type: Object },
            _scheduleData: { type: Object },
            _grade: { type: String },
            _student: { type: String },
            _periodsPerDay: { type: Number },
            _currentPeriod: { type: Object },
            _todayName: { type: String },
            _todayIndex: { type: Number },
        };
    }

    constructor() {
        super();
        this._scheduleData = {};
        this._grade = '';
        this._student = '';
        this._periodsPerDay = 6;
        this._currentPeriod = null;
        this._todayName = '';
        this._todayIndex = -1;
        this._updateTimer = null;
        this._entities = [];
        this._activeIndex = 0;
    }

    _getActiveEntity() {
        return this._entities[this._activeIndex] || '';
    }

    _switchEntity(index) {
        if (index !== this._activeIndex && index >= 0 && index < this._entities.length) {
            this._activeIndex = index;
            this._loadEntityData();
            this.requestUpdate();
        }
    }

    _getEntitiesFromConfig() {
        if (this.config?.entities && this.config.entities.length > 0) {
            return this.config.entities.filter(Boolean);
        }
        if (this.config?.entity) {
            return [this.config.entity];
        }
        return [];
    }

    setConfig(config) {
        this.config = config;
        this._entities = this._getEntitiesFromConfig();
        if (config.card_width) {
            this.style.setProperty('--card-width', config.card_width);
        } else {
            this.style.setProperty('--card-width', '100%');
        }
        if (config.theme) {
            this.setAttribute('theme', config.theme);
        }
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

    connectedCallback() {
        super.connectedCallback();
        this.setAttribute('theme', this._evaluateTheme());
        this._updateCurrentPeriod();
        this._updateTimer = setInterval(() => {
            this._updateCurrentPeriod();
            this.requestUpdate();
        }, 30000);
    }

    disconnectedCallback() {
        super.disconnectedCallback();
        if (this._updateTimer) {
            clearInterval(this._updateTimer);
            this._updateTimer = null;
        }
    }

    set hass(hass) {
        this._hass = hass;
        this._loadEntityData();
        this._updateCurrentPeriod();
        this.requestUpdate();
    }

    _loadEntityData() {
        const entityId = this._getActiveEntity();
        if (entityId && this._hass?.states?.[entityId]) {
            const state = this._hass.states[entityId];
            const attrs = state.attributes || {};
            this._grade = attrs['年级'] || '';
            this._student = attrs['学生'] || '';
            this._periodsPerDay = parseInt(this.config.periods_per_day || attrs['每天节数']) || 6;
            if (this._periodsPerDay < 1) this._periodsPerDay = 6;
            const scheduleRaw = attrs['课表详情'] || {};
            this._scheduleData = this._parseSchedule(scheduleRaw);
        }
    }

    _parseSchedule(raw) {
        const days = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];
        const result = {};
        days.forEach(day => {
            const dayData = raw[day];
            if (dayData && typeof dayData === 'object') {
                result[day] = {};
                Object.keys(dayData).forEach(periodNum => {
                    const period = dayData[periodNum];
                    if (period) {
                        result[day][periodNum] = {
                            subject: period['科目'] || '',
                            start: period['开始'] || '',
                            end: period['结束'] || '',
                        };
                    }
                });
            }
        });
        return result;
    }

    _getDayIndex() {
        const day = new Date().getDay();
        return day === 0 ? 6 : day - 1;
    }

    _updateCurrentPeriod() {
        const now = new Date();
        const currentTime = now.getHours() * 60 + now.getMinutes();
        const dayIndex = this._getDayIndex();
        const dayNames = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];

        this._todayName = dayNames[dayIndex];
        this._todayIndex = dayIndex;
        this._currentPeriod = null;

        const todayData = this._scheduleData[this._todayName];
        if (!todayData) return;

        for (let i = 1; i <= this._periodsPerDay; i++) {
            const period = todayData[i];
            if (!period) continue;
            const [startH, startM] = (period.start || '00:00').split(':').map(Number);
            const [endH, endM] = (period.end || '00:00').split(':').map(Number);
            const startMinutes = startH * 60 + startM;
            const endMinutes = endH * 60 + endM;

            if (currentTime >= startMinutes && currentTime < endMinutes) {
                this._currentPeriod = { num: i, type: 'class' };
                return;
            }
            if (i < this._periodsPerDay) {
                const nextPeriod = todayData[i + 1];
                if (nextPeriod) {
                    const [nsH, nsM] = (nextPeriod.start || '00:00').split(':').map(Number);
                    if (currentTime >= endMinutes && currentTime < nsH * 60 + nsM) {
                        this._currentPeriod = { num: i, type: 'break' };
                        return;
                    }
                }
            }
        }
        // 检查是否在最后一节课之后但在当天
        const lastPeriod = todayData[this._periodsPerDay];
        if (lastPeriod) {
            const [leH, leM] = (lastPeriod.end || '00:00').split(':').map(Number);
            if (currentTime >= leH * 60 + leM) {
                this._currentPeriod = { num: 0, type: 'after' };
                return;
            }
        }
        // 检查是否在第一节课之前
        const firstPeriod = todayData[1];
        if (firstPeriod) {
            const [fsH, fsM] = (firstPeriod.start || '00:00').split(':').map(Number);
            if (currentTime < fsH * 60 + fsM) {
                this._currentPeriod = { num: 0, type: 'before' };
            }
        }
    }

    _getSubjectStyle(subject) {
        const colorMap = {
            '语文': { bg: '#E8F5E9', text: '#2E7D32', ring: '#66BB6A' },
            '数学': { bg: '#E3F2FD', text: '#1565C0', ring: '#42A5F5' },
            '英语': { bg: '#FFF3E0', text: '#E65100', ring: '#FFA726' },
            '音乐': { bg: '#F3E5F5', text: '#7B1FA2', ring: '#AB47BC' },
            '体育': { bg: '#FFEBEE', text: '#C62828', ring: '#EF5350' },
            '美术': { bg: '#E0F7FA', text: '#00838F', ring: '#26C6DA' },
            '科学': { bg: '#F1F8E9', text: '#558B2F', ring: '#9CCC65' },
            '道法': { bg: '#FFF8E1', text: '#F57F17', ring: '#FFCA28' },
            '诵读': { bg: '#EDE7F6', text: '#4527A0', ring: '#7E57C2' },
            '啦啦操': { bg: '#FCE4EC', text: '#AD1457', ring: '#EC407A' },
            '足球': { bg: '#E8EAF6', text: '#283593', ring: '#5C6BC0' },
            '舞蹈': { bg: '#FBE9E7', text: '#BF360C', ring: '#FF7043' },
            '体游': { bg: '#E1F5FE', text: '#0277BD', ring: '#29B6F6' },
            '班队': { bg: '#EFEBE9', text: '#4E342E', ring: '#8D6E63' },
            '写字': { bg: '#E0F2F1', text: '#00695C', ring: '#4DB6AC' },
            '自习': { bg: '#ECEFF1', text: '#546E7A', ring: '#90A4AE' },
        };
        return colorMap[subject] || { bg: '#F5F5F5', text: '#616161', ring: '#BDBDBD' };
    }

    _getStatusLine() {
        if (!this._currentPeriod) return '';
        const todayData = this._scheduleData[this._todayName];
        if (!todayData) return '';

        if (this._currentPeriod.type === 'before') {
            const fp = todayData[1];
            return fp ? `距上课还有一段时间，第一节课 ${fp.start} 开始` : '即将上课';
        }
        if (this._currentPeriod.type === 'after') {
            return '今日课程已全部结束 ✨';
        }
        if (this._currentPeriod.type === 'class') {
            const p = todayData[this._currentPeriod.num];
            return p ? `正在进行第${this._currentPeriod.num}节 ${p.subject} (${p.start}-${p.end})` : '';
        }
        if (this._currentPeriod.type === 'break') {
            const np = todayData[this._currentPeriod.num + 1];
            return np ? `课间休息，下一节 ${np.subject} 将于 ${np.start} 开始` : '';
        }
        return '';
    }

    render() {
        const dayNames = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];
        const availableDays = dayNames.filter(d => this._scheduleData[d]);
        const statusLine = this._getStatusLine();
        const theme = this._evaluateTheme();
        const fgColor = theme === 'light' ? 'rgb(0, 0, 0)' : 'rgb(255, 255, 255)';
        const bgColor = theme === 'light' ? 'rgb(255, 255, 255)' : 'rgb(50, 50, 50)';
        const labelColor = theme === 'light' ? '#000' : '#fff';
        const sideBg = theme === 'light' ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.1)';

        return html`
            <ha-card style="--fg-color: ${fgColor}; --bg-color: ${bgColor}; --label-color: ${labelColor}; --side-bg: ${sideBg};">
                <!-- 顶部信息栏 -->
                <div class="card-top">
                    <div class="top-left">
                        <div class="title-row">
                            <span class="card-title">📅 课程表</span>
                        </div>
                        ${(this._grade || this._student) ? html`
                            <div class="info-row">
                                <span class="info-tag grade-tag">${[this._grade, this._student].filter(Boolean).join(' · ')}</span>
                                ${this._entities.length > 1 ? this._entities.map((eid, idx) => {
                                    const st = this._hass?.states?.[eid];
                                    const name = st?.attributes?.['学生'] || eid;
                                    return html`
                                        <span class="info-tag entity-switch-tag ${idx === this._activeIndex ? 'active' : ''}"
                                              @click=${() => this._switchEntity(idx)}>${name}</span>
                                    `;
                                }) : ''}
                            </div>
                        ` : ''}
                    </div>
                </div>

                <!-- 当前状态条 -->
                ${statusLine ? html`
                    <div class="status-bar ${this._currentPeriod ? 'status-' + this._currentPeriod.type : ''}">
                        <span>${statusLine}</span>
                    </div>
                ` : ''}

                <!-- 课表表格 -->
                ${availableDays.length > 0 ? html`
                <div class="schedule-wrapper">
                    <table class="schedule-table">
                        <colgroup>
                            <col style="width:26px">
                            <col style="width:58px">
                        </colgroup>
                        <thead>
                            <tr>
                                <th class="col-period" colspan="2">时间</th>
                                ${availableDays.map(day => html`
                                    <th class="col-day ${day === this._todayName ? 'col-today' : ''}">
                                        <div>${day}</div>
                                    </th>
                                `)}
                            </tr>
                            <tr class="header-spacer"><td colspan="${availableDays.length + 2}"></td></tr>
                        </thead>
                        <tbody>
                            ${(() => {
                                // 预计算每节的时间及时段分组
                                const firstDay = availableDays[0];
                                const periodTimes = {};
                                const getTod = (start) => {
                                    if (!start) return '';
                                    const h = parseInt(start.split(':')[0]);
                                    if (h < 12) return '上午';
                                    if (h < 18) return '下午';
                                    return '晚上';
                                };
                                // 构建时段分组（rowspan）
                                const groups = [];
                                let cur = null;
                                for (let i = 1; i <= this._periodsPerDay; i++) {
                                    periodTimes[i] = this._scheduleData[firstDay]?.[i] || null;
                                    const tod = getTod(periodTimes[i]?.start);
                                    if (!cur || cur.label !== tod) {
                                        cur = { label: tod, rowspan: 1 };
                                        groups.push(cur);
                                    } else {
                                        cur.rowspan++;
                                    }
                                }
                                // 为每个节次映射到分组起始/结束
                                let gi = 0, gidx = 0;
                                const periodGroup = {};
                                for (let i = 1; i <= this._periodsPerDay; i++) {
                                    const isLast = gidx === groups[gi].rowspan - 1;
                                    periodGroup[i] = { label: groups[gi].label, isFirst: gidx === 0, isLast, rowspan: groups[gi].rowspan };
                                    gidx++;
                                    if (gidx >= groups[gi].rowspan) { gi++; gidx = 0; }
                                }
                                return Array.from({ length: this._periodsPerDay }, (_, i) => i + 1).map(pn => html`
                                <tr class="${this._currentPeriod?.type === 'class' && this._currentPeriod?.num === pn ? 'row-active' : ''}">
                                    ${periodGroup[pn].isFirst ? html`
                                    <td class="cell-tod" rowspan="${periodGroup[pn].rowspan}">
                                        <div class="tod-text">${periodGroup[pn].label}</div>
                                    </td>
                                    ` : ''}
                                    <td class="cell-period">
                                        <span class="period-num ${this._currentPeriod?.type === 'class' && this._currentPeriod?.num === pn ? 'period-now' : ''}">第${pn}节</span>
                                        ${periodTimes[pn] ? html`<div class="period-time">${periodTimes[pn].start}<br>${periodTimes[pn].end}</div>` : ''}
                                    </td>
                                    ${availableDays.map(day => {
                                        const period = this._scheduleData[day]?.[pn];
                                        const isToday = day === this._todayName;
                                        const isCurrentClass = isToday &&
                                            this._currentPeriod?.type === 'class' &&
                                            this._currentPeriod?.num === pn;
                                        const isBreakAfter = isToday &&
                                            this._currentPeriod?.type === 'break' &&
                                            this._currentPeriod?.num === pn;
                                        if (period) {
                                            const style = this._getSubjectStyle(period.subject);
                                            return html`
                                                <td class="cell-subject ${isCurrentClass ? 'cell-current' : ''} ${isBreakAfter ? 'cell-break-after' : ''}"
                                                    style="--subj-bg: ${style.bg}; --subj-text: ${style.text}; --subj-ring: ${style.ring};">
                                                    <div class="subj-name">${period.subject}</div>
                                                    ${isCurrentClass ? html`<div class="live-dot"></div>` : ''}
                                                </td>
                                            `;
                                        }
                                        return html`<td class="cell-empty"></td>`;
                                    })}
                                </tr>
                                ${periodGroup[pn].isLast && pn < this._periodsPerDay ? html`<tr class="spacer-row"><td colspan="${availableDays.length + 2}"></td></tr>` : ''}
                            `);
                                })()}
                        </tbody>
                    </table>
                </div>
                ` : html`
                <div class="empty-state">
                    <ha-icon icon="mdi:calendar-blank-outline"></ha-icon>
                    <div>暂无课表数据</div>
                    <div class="sub-hint">请确认实体配置正确</div>
                </div>
                `}

                <!-- 底部图例 -->
                <div class="card-footer">
                    <span class="footer-legend">
                        <span class="legend-dot live-dot-static"></span> 正在上课
                    </span>
                    <span class="footer-legend">
                        <span class="legend-dot today-dot"></span> 今天
                    </span>
                </div>
            </ha-card>
        `;
    }

    static get styles() {
        return css`
            :host {
                display: block;
                width: var(--card-width, 100%);
            }
            ha-card {
                background: var(--bg-color, var(--card-background-color, #fff));
                border-radius: 14px;
                box-shadow: 0 1px 6px rgba(0,0,0,0.06);
                overflow: hidden;
            }

            /* ---- 顶部 ---- */
            .card-top {
                display: flex;
                align-items: flex-start;
                justify-content: space-between;
                padding: 14px 8px 4px;
            }
            .top-left {
                display: flex;
                flex-direction: column;
                gap: 4px;
            }
            .title-row {
                display: flex;
                align-items: center;
                gap: 8px;
            }
            .card-title {
                font-size: 15px;
                font-weight: 700;
                color: var(--fg-color, var(--primary-text-color, #212121));
            }
            .info-row {
                display: flex;
                gap: 6px;
                flex-wrap: wrap;
            }
            .info-tag {
                font-size: 11px;
                padding: 2px 8px;
                border-radius: 8px;
                font-weight: 500;
            }
            .grade-tag {
                background: #E3F2FD;
                color: #1565C0;
            }
            .student-tag {
                background: #F3E5F5;
                color: #7B1FA2;
            }
            .entity-switch-tag {
                background: var(--divider-color, #EEEEEE);
                color: var(--secondary-text-color, #757575);
                cursor: pointer;
                transition: all 0.2s;
            }
            .entity-switch-tag:hover {
                background: var(--primary-color, #1976D2);
                color: #fff;
            }
            .entity-switch-tag.active {
                background: var(--primary-color, #1976D2);
                color: #fff;
            }
            /* ---- 状态条 ---- */
            .status-bar {
                margin: 2px 8px 4px;
                padding: 6px 10px;
                border-radius: 8px;
                font-size: 12px;
                font-weight: 500;
                background: #F5F5F5;
                color: #757575;
            }
            .status-bar.status-class {
                background: #E8F5E9;
                color: #2E7D32;
            }
            .status-bar.status-break {
                background: #FFF8E1;
                color: #F57F17;
            }
            .status-bar.status-after {
                background: #ECEFF1;
                color: #78909C;
            }

            /* ---- 表格容器 ---- */
            .schedule-wrapper {
                overflow-x: auto;
                padding: 0 8px 6px;
                -webkit-overflow-scrolling: touch;
            }
            .schedule-table {
                width: 100%;
                border-collapse: separate;
                border-spacing: 3px;
                table-layout: fixed;
            }
            .schedule-table .cell-tod {
                width: 26px;
            }
            .schedule-table .cell-period {
                width: 58px;
            }
            .col-period {
                font-size: 13px;
                color: var(--label-color, var(--secondary-text-color, #9E9E9E));
                font-weight: 600;
                padding: 2px;
                background: var(--side-bg, var(--divider-color, rgba(0,0,0,0.04)));
                border-radius: 6px;
            }
            .col-day {
                font-size: 13px;
                font-weight: 600;
                color: var(--label-color, var(--primary-text-color, #212121));
                padding: 4px 2px 2px;
                background: var(--side-bg, var(--divider-color, rgba(0,0,0,0.04)));
                border-radius: 6px;
            }
            .col-day.col-today {
                color: var(--primary-color, #1976D2);
                position: relative;
            }
            /* ---- 行样式 ---- */
            .row-active {
                position: relative;
            }

            /* ---- 节次列 ---- */
            .cell-period {
                text-align: center;
                vertical-align: middle;
                padding: 4px 2px;
                background: var(--side-bg, var(--divider-color, rgba(0,0,0,0.04)));
                border-radius: 8px;
            }
            .period-num {
                display: inline-block;
                padding: 2px 6px;
                border-radius: 10px;
                font-size: 11px;
                font-weight: 600;
                color: var(--label-color, var(--secondary-text-color, #9E9E9E));
                background: var(--divider-color, #EEEEEE);
                white-space: nowrap;
            }
            .period-now {
                background: var(--primary-color, #1976D2);
                color: #fff;
                animation: pulse-period 1.5s ease-in-out infinite;
            }
            .period-time {
                font-size: 9px;
                color: var(--label-color, var(--secondary-text-color, #9E9E9E));
                line-height: 1.35;
                margin-top: 1px;
                white-space: nowrap;
            }
            .spacer-row td {
                height: 6px;
                padding: 0;
            }
            .header-spacer td {
                height: 4px;
                padding: 0;
            }
            /* ---- 时段列 ---- */
            .cell-tod {
                text-align: center;
                vertical-align: middle;
                padding: 0;
                padding-left: 4px;
                background: var(--side-bg, var(--divider-color, rgba(0,0,0,0.04)));
                border-radius: 6px;
            }
            .tod-text {
                font-size: 11px;
                font-weight: 600;
                color: var(--label-color, var(--secondary-text-color, #9E9E9E));
                writing-mode: vertical-rl;
                letter-spacing: 2px;
            }
            @keyframes pulse-period {
                0%, 100% { transform: scale(1); }
                50% { transform: scale(1.15); }
            }

            /* ---- 科目单元格 ---- */
            .cell-subject {
                border-radius: 8px;
                background: var(--subj-bg, #F5F5F5);
                color: var(--subj-text, #616161);
                padding: 6px 4px;
                text-align: center;
                vertical-align: middle;
                transition: all 0.3s ease;
                position: relative;
                min-width: 64px;
                border: 1.5px solid transparent;
            }
            .cell-subject:hover {
                transform: scale(1.03);
                z-index: 1;
                box-shadow: 0 2px 8px rgba(0,0,0,0.1);
            }
            .cell-current {
                border-color: var(--subj-ring, #1976D2);
                box-shadow: 0 0 0 1.5px var(--subj-ring, #1976D2), 0 2px 6px rgba(0,0,0,0.08);
                transform: scale(1.03);
                animation: highlight-in 0.4s ease-out;
            }
            @keyframes highlight-in {
                from { transform: scale(0.95); opacity: 0.7; }
                to   { transform: scale(1.03); opacity: 1; }
            }
            .cell-break-after {
                opacity: 0.8;
            }
            .subj-name {
                font-size: 12px;
                font-weight: 600;
                line-height: 1.3;
                white-space: nowrap;
            }
            .live-dot {
                position: absolute;
                top: 4px;
                right: 4px;
                width: 7px;
                height: 7px;
                border-radius: 50%;
                background: #4CAF50;
                animation: blink-dot 1.2s ease-in-out infinite;
            }
            @keyframes blink-dot {
                0%, 100% { opacity: 1; box-shadow: 0 0 0 0 rgba(76, 175, 80, 0.6); }
                50%      { opacity: 0.5; box-shadow: 0 0 0 4px rgba(76, 175, 80, 0); }
            }
            .cell-empty {
                border-radius: 8px;
                background: transparent;
            }

            /* ---- 空状态 ---- */
            .empty-state {
                display: flex;
                flex-direction: column;
                align-items: center;
                padding: 28px 16px;
                color: var(--secondary-text-color, #9E9E9E);
                gap: 6px;
            }
            .empty-state ha-icon {
                --mdc-icon-size: 36px;
                opacity: 0.45;
            }
            .empty-state .sub-hint {
                font-size: 11px;
                opacity: 0.6;
            }

            /* ---- 底部 ---- */
            .card-footer {
                display: flex;
                gap: 16px;
                padding: 6px 14px 12px;
                font-size: 10px;
                color: var(--label-color, var(--secondary-text-color, #9E9E9E));
            }
            .footer-legend {
                display: flex;
                align-items: center;
                gap: 4px;
            }
            .legend-dot {
                display: inline-block;
                width: 8px;
                height: 8px;
                border-radius: 50%;
            }
            .live-dot-static {
                background: #4CAF50;
                animation: blink-dot 1.2s ease-in-out infinite;
            }
            .today-dot {
                background: var(--primary-color, #1976D2);
            }
        `;
    }
}
customElements.define('xiaoshi-class-card', XiaoshiClassCard);
