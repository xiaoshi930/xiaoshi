const whenDefined = (t) => customElements.whenDefined(t);
await Promise.race([whenDefined("ha-card"), whenDefined("ha-panel-lovelace")]);
const LitElement = window.LitElement || Object.getPrototypeOf(customElements.get("ha-card"));
const html = LitElement.prototype.html;
const css = LitElement.prototype.css;

window.customCards = window.customCards || [];
window.customCards.push({
    type: 'xiaoshi-lunar-calendar-pad-date',
    name: '消逝万年历 - 平板日期',
    description: '消逝万年历日历 - 平板日期',
	  preview: true
  },
  {
    type: 'xiaoshi-lunar-calendar-pad',
    name: '消逝万年历日历 - 平板端信息聚合',
    description: ''
  },
  {
    type: 'xiaoshi-lunar-calendar',
    name: '消逝万年历日历 - 日历信息UI',
    description: '',
	  preview: true
});

class LunarCalendarPad extends LitElement {
  static get properties() {
    return {
      hass: { type: Object },
      config: { type: Object },
    };
  }

  setConfig(config) {
    this.config = {
      lunar: config?.lunar || 'sensor.lunar_calendar',
      theme: config?.theme || 'theme()',
      width: config?.width || '785px',
      height: config?.height || '540px',
      date: config?.date || 'date.lunar_tap_date',
      ...config
    };
  }
 
  static get styles() {
    return css`      :host { display: block; }
      .grid-container { display: grid; grid-template-areas: "left1 head right1" "left1 lunar right1" "left2 lunar right2" "left3 lunar right3" "left4 lunar right4" "left5 body1 right5" "left6 body7 right6"; grid-template-columns: 180px 400px 180px; grid-template-rows: 60px 20px 30px 120px 120px 60px 60px; width: 785px; height: 540px; gap: 10px; }
      .grid-item { display: flex; position: relative; }
      .left1 { grid-area: left1; height: 90px; }
      .right1 { grid-area: right1; height: 90px; }
      .head { grid-area: head; height: 60px; }
      .lunar { grid-area: lunar; height: 320px; }
      .left2 { grid-area: left2; height: 30px; }
      .right2 { grid-area: right2; height: 30px; }
      .left3 { grid-area: left3; height: 120px; }
      .right3 { grid-area: right3; height: 120px; }
      .left4 { grid-area: left4; height: 120px; }
      .right4 { grid-area: right4; height: 120px; }
      .left5 { grid-area: left5; height: 60px; }
      .right5 { grid-area: right5; height: 60px; }
      .body1 { grid-area: body1; height: 60px; }
      .left6 { grid-area: left6; height: 60px; }
      .right6 { grid-area: right6; height: 60px; }
      .body7 { grid-area: body7; height: 60px; }`;
  }

  render() {
    if (!this.hass) {
      return html`<div>Loading...</div>`;
    }
    const headHeight1 = '320px'; 
    const headHeight12 = '120px'; 
    const headHeight9 = '90px'; 
    const headHeight6 = '60px'; 
    const headHeight3 = '30px'; 
    return html`
      <div class="grid-container">
        <div class="grid-item head">
          <xiaoshi-lunar-calendar-head \n
            .hass=${this.hass}\n
            .config=${this.config}\n
            .height=${headHeight6}\n
            style="width:100%;height:100%">
          </xiaoshi-lunar-calendar-head>
        </div>

        <div class="grid-item lunar">
          <xiaoshi-lunar-calendar \n
            .hass=${this.hass}\n
            .config=${this.config}\n
            .height=${headHeight1}\n
            style="width:100%;height:100%">
          </xiaoshi-lunar-calendar>
        </div>

        <div class="grid-item body1">
          <xiaoshi-lunar-calendar-body1 \n
            .hass=${this.hass}\n
            .config=${this.config}\n
            .height=${headHeight6}\n
            style="width:100%;height:100%">
          </xiaoshi-lunar-calendar-body1>
        </div>

        <div class="grid-item body7">
          <xiaoshi-lunar-calendar-body7 \n
            .hass=${this.hass}\n
            .config=${this.config}\n
            .height=${headHeight6}\n
            style="width:100%;height:100%">
          </xiaoshi-lunar-calendar-body7>
        </div>
        <div class="grid-item left1">
          <xiaoshi-lunar-calendar-left1\n
            .hass=${this.hass}\n
            .config=${this.config}\n
            .height=${headHeight9}\n
            style="width:100%;height:100%">
          </xiaoshi-lunar-calendar-left1>
        </div>
        
        <div class="grid-item right1">
          <xiaoshi-lunar-calendar-right1\n
            .hass=${this.hass}\n
            .config=${this.config}\n
            .height=${headHeight9}\n
            style="width:100%;height:100%">
          </xiaoshi-lunar-calendar-right1>
        </div>
        
        <div class="grid-item left2">
          <xiaoshi-lunar-calendar-left2\n
            .hass=${this.hass}\n
            .config=${this.config}\n
            .height=${headHeight3}\n
            style="width:100%;height:100%">
          </xiaoshi-lunar-calendar-left2>
        </div>
        
        <div class="grid-item right2">
          <xiaoshi-lunar-calendar-right2\n
            .hass=${this.hass}\n
            .config=${this.config}\n
            .height=${headHeight3}\n
            style="width:100%;height:100%">
          </xiaoshi-lunar-calendar-right2>
        </div>
        
        <div class="grid-item left3">
          <xiaoshi-lunar-calendar-left3\n
            .hass=${this.hass}\n
            .config=${this.config}\n
            .height=${headHeight12}\n
            style="width:100%;height:100%">
          </xiaoshi-lunar-calendar-left3>
        </div>
        
        <div class="grid-item right3">
          <xiaoshi-lunar-calendar-right3\n
            .hass=${this.hass}\n
            .config=${this.config}\n
            .height=${headHeight12}\n
            style="width:100%;height:100%">
          </xiaoshi-lunar-calendar-right3>
        </div>
        
        <div class="grid-item left4">
          <xiaoshi-lunar-calendar-left4\n
            .hass=${this.hass}\n
            .config=${this.config}\n
            .height=${headHeight12}\n
            style="width:100%;height:100%">
          </xiaoshi-lunar-calendar-left4>
        </div>
        
        <div class="grid-item right4">
          <xiaoshi-lunar-calendar-right4\n
            .hass=${this.hass}\n
            .config=${this.config}\n
            .height=${headHeight12}\n
            style="width:100%;height:100%">
          </xiaoshi-lunar-calendar-right4>
        </div>
        
        <div class="grid-item left5">
          <xiaoshi-lunar-calendar-left5\n
            .hass=${this.hass}\n
            .config=${this.config}\n
            .height=${headHeight6}\n
            style="width:100%;height:100%">
          </xiaoshi-lunar-calendar-left5>
        </div>
        
        <div class="grid-item right5">
          <xiaoshi-lunar-calendar-right5\n
            .hass=${this.hass}\n
            .config=${this.config}\n
            .height=${headHeight6}\n
            style="width:100%;height:100%">
          </xiaoshi-lunar-calendar-right5>
        </div>
        
        <div class="grid-item left6">
          <xiaoshi-lunar-calendar-left6\n
            .hass=${this.hass}\n
            .config=${this.config}\n
            .height=${headHeight6}\n
            style="width:100%;height:100%">
          </xiaoshi-lunar-calendar-left6>
        </div>
        
        <div class="grid-item right6">
          <xiaoshi-lunar-calendar-right6\n
            .hass=${this.hass}\n
            .config=${this.config}\n
            .height=${headHeight6}\n
            style="width:100%;height:100%">
          </xiaoshi-lunar-calendar-right6>
        </div>
      </div>
    `;
  }
}
customElements.define('xiaoshi-lunar-calendar-pad', LunarCalendarPad);

class LunarCalendarPadDateEditor extends LitElement {
  static get properties() {
    return {
      hass: { type: Object },
      config: { type: Object }
    };
  }

  static get styles() {
    return css`      .form { display: flex; flex-direction: column; gap: 10px; }
      .form-group { display: flex; flex-direction: column; gap: 5px; }
      label { font-weight: bold; }
      select, input { padding: 8px; border: 1px solid #ddd; border-radius: 4px; width: 100%; box-sizing: border-box; }
      input[type="color"] { width: 50px; height: 36px; padding: 2px; cursor: pointer; }
      .conditional-field { display: none; }
      .conditional-field.visible { display: flex; flex-direction: column; gap: 5px; }
      .form-group-inline { flex-direction: row !important; align-items: center; gap: 8px; }
      .form-group-inline label { white-space: nowrap; }
      .entity-search-container { position: relative; width: 100%; }
      .entity-search-container input { width: 100%; min-width: 200px; }`;
  }

  render() {
    if (!this.config) return html``;
    return html`
      <div class="form">
        <div class="form-group">
          <label>农历实体</label>
          <div class="entity-search-container">
            <input
              type="text"
              .value=${this.config.entity || ''}
              @input=${this._onEntityInput}
              @change=${this._valueChanged}
              name="entity"
              placeholder="搜索农历实体（如 sensor.lunar_calendar）"
              list="lunar-entities"
            />
            <datalist id="lunar-entities">
              ${Object.keys(this.hass.states)
                .filter(entityId => entityId.startsWith('sensor'))
                .map(entityId => html`
                  <option value="${entityId}">
                    ${this.hass.states[entityId].attributes.friendly_name || entityId}
                  </option>
                `)}
            </datalist>
          </div>
        </div>

        <div class="form-group">
          <label>时钟模式</label>
          <select
            @change=${this._valueChanged}
            .value=${this.config.mode || 'A'}
            name="mode"
          >
            <option value="A">A - 普通时钟</option>
            <option value="B">B - 翻页时钟</option>
          </select>
        </div>

        <div class="form-group">
          <label>主题</label>
          <select
            @change=${this._valueChanged}
            .value=${this.config.theme || 'theme()'}
            name="theme"
          >
            <option value="theme()">theme() - 跟随全局函数</option>
            <option value="theme()">system - 跟随系统</option>
            <option value="light">light - 浅色模式</option>
            <option value="dark">dark - 深色模式</option>
          </select>
          <span style="font-size:12px;color:#888;">也可引用全局函数：[[[ return theme() ]]]</span>
        </div>

        <div class="form-group">
          <label>显示生日</label>
          <select
            @change=${this._valueChanged}
            .value=${this.config.show_birthday !== undefined ? String(this.config.show_birthday) : 'true'}
            name="show_birthday"
          >
            <option value="true">显示</option>
            <option value="false">隐藏</option>
          </select>
        </div>

        <div class="form-group">
          <label>显示节日</label>
          <select
            @change=${this._valueChanged}
            .value=${this.config.show_holiday !== undefined ? String(this.config.show_holiday) : 'true'}
            name="show_holiday"
          >
            <option value="true">显示</option>
            <option value="false">隐藏</option>
          </select>
        </div>

        <div class="form-group">
          <label>简化日期</label>
          <select
            @change=${this._valueChanged}
            .value=${this.config.simplified !== undefined ? String(this.config.simplified) : 'false'}
            name="simplified"
          >
            <option value="false">标准（显示日期、星期、农历月日、节气、农历年、时刻）</option>
            <option value="true">简化（显示日期、星期、农历月日）</option>
          </select>
        </div>
      </div>
    `;
  }

  _valueChanged(e) {
    const { name, value } = e.target;
    if (!value) return;

    let processedValue = value;
    if (name === 'show_birthday' || name === 'show_holiday' || name === 'simplified') {
      processedValue = value === 'true';
    }

    this.config = {
      ...this.config,
      [name]: processedValue
    };

    if (name === 'mode') {
      setTimeout(() => this._updateConditionalFields(), 0);
    }

    this.dispatchEvent(new CustomEvent('config-changed', {
      detail: { config: this.config },
      bubbles: true,
      composed: true
    }));
  }

  _updateConditionalFields() {
    // mode B 的条件字段已移除
  }

  _onEntityInput(e) {
    this.config = {
      ...this.config,
      entity: e.target.value
    };
  }

  setConfig(config) {
    this.config = config;
    setTimeout(() => {
      this._updateConditionalFields();
    }, 0);
  }
}
customElements.define('xiaoshi-lunar-calendar-pad-date-editor', LunarCalendarPadDateEditor);

class LunarCalendarPadDate extends LitElement {
    static getConfigElement() {
      return document.createElement("xiaoshi-lunar-calendar-pad-date-editor");
    }
    static get properties() {
    return {
      hass: { type: Object },
      config: { type: Object },
      _currentTime: { type: Object },
      _lunarState: { type: Object },
      _flipParts: { type: Array },
      _previousTime: { type: Object },
      _displayTime: { type: Object },
      _theme: { type: String }
    };
  }

  constructor() {
    super();
    this._currentTime = { hours: '', minutes: '', seconds: '' };
    this._previousTime = { hours: '', minutes: '', seconds: '' };
    this._displayTime = { hours: '', minutes: '', seconds: '' };
    this._flipParts = [];
    this._updateInterval = null;
    this._mode = 'A';
    this._theme = 'theme()';
    // 弹窗 hass 状态订阅
    this._popupHassUnsubscribe = null;
    this._popupUpdatePending = false;
    this._popupHass = null;
  }

  setConfig(config) {
    this.config = config;
    this._mode = config.mode || 'A';
    this._theme = config.theme || 'theme()';
    this._showBirthday = config.show_birthday !== undefined ? config.show_birthday : true;
    this._showHoliday = config.show_holiday !== undefined ? config.show_holiday : true;
    this._simplified = config.simplified !== undefined ? config.simplified : false;
  }

  connectedCallback() {
    super.connectedCallback();
    this._updateTime();
    this._updateInterval = setInterval(() => this._updateTime(), 1000);
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    clearInterval(this._updateInterval);
    this._closePopup();
  }

  set hass(hass) {
    this._hass = hass;
    const lunarEntity = this.config?.entity || 'sensor.lunar_calendar';
    this._lunarState = this._hass.states[lunarEntity];
    this._updateStyles();
    this.requestUpdate();
  }

  _updateTime() {
    const now = new Date();
    const beijingOffset = 8 * 60;
    const utcTime = now.getTime() + now.getTimezoneOffset() * 60000;
    const beijingTime = new Date(utcTime + beijingOffset * 60000);
    const newTime = {
      hours: beijingTime.getHours().toString().padStart(2, '0'),
      minutes: beijingTime.getMinutes().toString().padStart(2, '0'),
      seconds: beijingTime.getSeconds().toString().padStart(2, '0')
    };
    this._previousTime = {...this._displayTime};
    if (this._mode === 'B') {
      this._updateFlipParts(newTime);
    } else {
      this._currentTime = newTime;
      this._displayTime = {...newTime};
      this.requestUpdate();
    }
  }

  _updateFlipParts(newTime) {
    this._flipParts = [];
    const parts = ['hours', 'minutes', 'seconds'];  
    parts.forEach(part => {
      if (newTime[part] !== this._displayTime[part]) {
        this._flipParts.push({
          part,
          newValue: newTime[part],
          oldValue: this._displayTime[part],
          flipping: true
        });   
        setTimeout(() => {
          this._displayTime[part] = newTime[part];
          this._flipParts = this._flipParts.filter(p => p.part !== part);
          this.requestUpdate();
        }, 300);
      }
    });
    this._currentTime = newTime;
    this.requestUpdate();
  }

  render() {
    const dashDate = this._getAttribute(this._lunarState, '今天的阳历日期.日期1');
    const dashWeek = this._getAttribute(this._lunarState, '今天的阳历日期.星期1');
    const jieqi = this._getAttribute(this._lunarState, '节气.节气');
    const lunarYear = this._getAttribute(this._lunarState, '今天的农历日期.年');
    const lunarDate = this._getAttribute(this._lunarState, '今天的农历日期.日期').slice(-4);
    const shichen = this._getShichen();

    return html`
      <ha-card @click=${this._showPopup}>
        <div class="grid-container">
          ${this._mode === 'A' 
            ? html`<div id="time">${this._currentTime.hours}:${this._currentTime.minutes}:${this._currentTime.seconds}</div>`
            : this._renderFlipClock()
          }
          ${this._simplified
            ? html`<div style="grid-area: 2 / 1 / 3 / 5; text-align: center;">${dashDate} ${dashWeek} ${lunarDate}</div>`
            : html`
                <div id="date">${dashDate}</div>
                <div id="week">${dashWeek}</div>
                <div id="jieqi">${jieqi}</div>
                <div id="year">${lunarYear}</div>
                <div id="mon">${lunarDate}</div>
                <div id="day">${shichen}</div>
              `
          }
          ${(this._showBirthday || this._showHoliday) ? html`<div id="line"></div>` : ''}
          ${this._showBirthday
            ? html`<div id="shengri">${this._getAttribute(this._lunarState, '最近的生日.0')}</div>`
            : (this._showHoliday ? html`<div id="shengri">${this._getAttribute(this._lunarState, '最近的节日.0')}</div>` : '')
          }
          ${this._showBirthday && this._showHoliday ? html`<div id="jieri">${this._getAttribute(this._lunarState, '最近的节日.0')}</div>` : ''}
        </div>
      </ha-card>
    `;
  }

  _renderFlipClock() {
    const theme = this._evaluateTheme();
    let timeBgColor;
    if (theme === 'dark') {
      timeBgColor = 'rgb(100,100,100)';
    } else {
      timeBgColor = (typeof window.background === 'function') ? window.background() : 'rgb(10,100,100)';
    }
    const renderPart = (part) => {
      const flipPart = this._flipParts.find(p => p.part === part);
      const displayValue = flipPart ? flipPart.oldValue : this._displayTime[part];
      const topValue = flipPart ? flipPart.newValue : displayValue;
      return html`
        <div class="flip-part-container">
          <div class="part-top" style="background: ${timeBgColor}">${topValue}</div>
          ${flipPart ? html`
            <div class="flip-animation flipping">
              <div class="flip-animation-top" style="background: ${timeBgColor}">${flipPart.oldValue}</div>
              <div class="flip-animation-bottom" style="background: ${timeBgColor}">${flipPart.newValue}</div>
            </div>
          ` : ''}
          <div class="part-bottom" style="background: ${timeBgColor}">${displayValue}</div>
        </div>
      `;
    };
    return html`
      <div id="time"\n class="flip-clock">
        ${renderPart('hours')}
        <div class="colon">:</div>
        ${renderPart('minutes')}
        <div class="colon">:</div>
        ${renderPart('seconds')}
      </div>
    `;
  }

  static get styles() {
    return css`      :host { display: block; width: 240px; height: 145px; color: white !important; --text-color: white; }
      ha-card { background: transparent !important; box-shadow: none !important; border: none !important; cursor: pointer; }
      .grid-container { display: grid; grid-template-areas: "time time time time" "date week jieqi jieqi" "year mon mon day" "line line line line" "shengri shengri shengri shengri" "jieri jieri jieri jieri"; grid-template-columns: 80px 58px 16px 72px; grid-template-rows: 55px 20px 20px 15px 20px 20px; font-weight: bold; font-size: 16px; }
      #time { grid-area: time; font-size: 57px; font-weight: 430; text-align: center; white-space: nowrap; overflow: hidden; color: var(--text-color); line-height: 0.9; }
      .colon { display: flex; align-items: center; font-size: 50px; color: var(--time-text-color, white); margin: 0 -5px; }
      .flip-clock { display: flex; justify-content: center; gap: 10px; }
      .flip-part-container { position: relative; width: 80px; height: 50px; perspective: 200px; }
      .part-top, .part-bottom { line-height: 50px; font-size: 47px; position: absolute; width: 100%; height: 50%; overflow: hidden; display: flex; justify-content: center; backface-visibility: hidden; border-radius: 4px; color: var(--time-text-color, white); }
      .part-top { top: 0px; bottom: 2px; border-radius: 4px 4px 0 0; align-items: flex-start; z-index: 2; transform: translateZ(1px); }
      .part-bottom { bottom: -1px; border-radius: 0 0 4px 4px; align-items: flex-end; z-index: 1; transform: translateZ(1px); }
      .flip-animation { position: absolute; top: 0; width: 100%; height: 52%; transform-style: preserve-3d; transform-origin: bottom; z-index: 3; }
      .flip-animation-top, .flip-animation-bottom { line-height: 50px; font-size: 47px; position: absolute; width: 100%; height: 100%; display: flex; justify-content: center; overflow: hidden; backface-visibility: hidden; border-radius: 4px; transform-style: preserve-3d; color: var(--time-text-color, white); }
      .flip-animation-top { top: 0px; bottom: 2px; align-items: flex-start; transform: rotateX(0deg) translateZ(1px); border-radius: 4px 4px 0 0; }
      .flip-animation-bottom { bottom: -1px; align-items: flex-end; transform: rotateX(180deg) translateZ(1px); border-radius: 0 0 4px 4px; }
      .flipping { animation: flip 0.6s cubic-bezier(0.4, 0, 0.2, 1) forwards; }
      @keyframes flip {
        0% { transform: rotateX(0deg); }
        100% { transform: rotateX(-180deg); }
      }
      #date    { grid-area: date; color: var(--text-color) }
      #week    { grid-area: week; color: var(--text-color) }
      #jieqi   { grid-area: jieqi; text-align: right; color: var(--text-color) }
      #year    { grid-area: year; color: var(--text-color) }
      #mon     { grid-area: mon; color: var(--text-color) }
      #day     { grid-area: day; text-align: right; color: var(--text-color) }
      #line { grid-area: line; border-bottom: 2px solid rgb(255,255,255); margin: 5px 0; }
      #shengri { grid-area: shengri; color: var(--text-color); font-size: 15px }
      #jieri   { grid-area: jieri; color: var(--text-color); font-size: 15px }`;
  } 
 
  updated(changedProperties) {
    if (changedProperties.has('_theme')) {
      this._updateStyles(); 
    }
  }

  _updateStyles() {
    const theme = this._evaluateTheme();
    if (theme === 'light') {
      this.style.setProperty('--time-bg-color', 'rgba(0, 0, 0, 0.3)');
      this.style.setProperty('--time-text-color', 'white');
    } else {
      this.style.setProperty('--time-bg-color', 'rgba(255, 255, 255, 0.3)');
      this.style.setProperty('--time-text-color', 'white');
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

  _getCurrentTime() {
    const now = new Date();
    return {
      hours: now.getHours().toString().padStart(2, '0'),
      minutes: now.getMinutes().toString().padStart(2, '0'),
      seconds: now.getSeconds().toString().padStart(2, '0')
    };
  }

  _getShichen() {
    const tzArr = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥', '子'];
    const skArr = ['一', '二', '三', '四', '五', '六', '七', '八'];
    const h = new Date().getHours();
    const m = new Date().getMinutes();
    const shichen = tzArr[parseInt( (h+1) / 2)] + '时';
    const shike = skArr[parseInt(m / 15) + Math.abs((h % 2) - 1) * 4] + "刻";
    return shichen+shike;
  } 

  _getAttribute(state, path) { 
    return path.split('.').reduce((obj, key) => (obj || {})[key], state?.attributes || {}) || '';
  }

  _handleClick(){
    const hapticEvent = new Event('haptic', {
      bubbles: true,
      cancelable: false,
      composed: true
    });
    hapticEvent.detail = 'light';
    this.dispatchEvent(hapticEvent);
  }

  _injectPopupStyles() {
    if (LunarCalendarPadDate._stylesInjected) return;
    LunarCalendarPadDate._stylesInjected = true;
    const style = document.createElement('style');
    style.id = 'xiaoshi-pad-popup-style';
    style.textContent = `
      @keyframes xiaoshiPadPopupIn {
        from { opacity: 0; transform: translate(-50%, -50%) scale(0.95); }
        to   { opacity: 1; transform: translate(-50%, -50%) scale(1); }
      }
    `;
    document.head.appendChild(style);
  }

  _showPopup() {
    this._handleClick();
    this._injectPopupStyles();
    const theme = this._evaluateTheme();

    // 获取 hass 对象
    const haRoot = document.querySelector('home-assistant');
    const hassObj = haRoot?.hass || haRoot?.shadowRoot?.querySelector('home-assistant-main')?.hass;
    if (!hassObj) {
      console.error('[LunarCalendarPadDate] 无法获取 hass 对象');
      return;
    }

    // 已有弹窗则先关闭
    if (this._popupOverlay) {
      this._closePopup();
    }

    // 创建遮罩层
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

    // 创建弹窗容器
    const popup = document.createElement('div');
    popup.style.cssText = `
      position: fixed;
      top: 50%; left: 50%;
      transform: translate(-50%, -50%);
      z-index: 1005;
      background: transparent;
      padding: 0;
      max-width: 100vw;
      max-height: 100vh;
      overflow: hidden;
      box-sizing: border-box;
      animation: xiaoshiPadPopupIn 0.2s ease-out;
    `;

    document.body.appendChild(overlay);
    document.body.appendChild(popup);

    this._popupOverlay = overlay;
    this._popupElement = popup;

    // 创建卡片
    const cardConfig = {
      type: 'custom:xiaoshi-lunar-calendar-pad',
      theme: theme
    };
    this._createPopupCard(popup, cardConfig, hassObj);

    // ESC 关闭
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
        // 启动 hass 状态订阅，让弹窗数据持续更新
        this._startPopupHassWatcher(hassObj);
      } else {
        container.innerHTML = '<div style="color:red;padding:20px;">loadCardHelpers 不可用</div>';
      }
    } catch (err) {
      console.error('[LunarCalendarPadDate] 创建弹窗卡片失败:', err);
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
    // 取消 hass 状态订阅
    if (this._popupHassUnsubscribe) {
      this._popupHassUnsubscribe();
      this._popupHassUnsubscribe = null;
    }
    this._popupUpdatePending = false;
    this._popupHass = null;
  }

  // ==========================================
  // 1. 订阅 hass 状态变化
  // ==========================================
  _startPopupHassWatcher(hassObj) {
    if (this._popupHassUnsubscribe) return;
    this._popupHass = hassObj;
    if (!hassObj || !hassObj.connection) {
      // 重试
      const timer = setTimeout(() => this._startPopupHassWatcher(hassObj), 500);
      return;
    }
    try {
      hassObj.connection.subscribeMessage(
        () => {
          // 弹窗已关闭，跳过
          if (!this._popupCardElement) return;
          // 2. RAF 批处理调度
          this._schedulePopupUpdate();
        },
        { type: 'subscribe_events', event_type: 'state_changed' }
      ).then((unsub) => {
        this._popupHassUnsubscribe = unsub;
      });
    } catch (err) {
      console.error('[LunarCalendarPadDate] 订阅状态变化失败:', err);
    }
  }

  // ==========================================
  // 2. RAF 批处理调度，每帧最多触发一次更新
  // ==========================================
  _schedulePopupUpdate() {
    if (this._popupUpdatePending) return;
    this._popupUpdatePending = true;
    requestAnimationFrame(() => {
      this._popupUpdatePending = false;
      // 弹窗已关闭，跳过
      if (!this._popupCardElement) return;
      const haRoot = document.querySelector('home-assistant');
      const newHass = haRoot?.hass || haRoot?.shadowRoot?.querySelector('home-assistant-main')?.hass;
      if (!newHass) return;
      // hass 引用未变化时跳过
      if (newHass === this._popupHass) return;
      this._popupHass = newHass;
      this._updatePopupCard();
    });
  }

  // ==========================================
  // 3. 更新弹窗卡片
  // ==========================================
  _updatePopupCard() {
    if (this._popupCardElement && this._popupHass) {
      try {
        this._popupCardElement.hass = this._popupHass;
      } catch (err) {
        console.warn('[LunarCalendarPadDate] 弹窗卡片更新失败:', err.message);
      }
    }
  }
}
customElements.define('xiaoshi-lunar-calendar-pad-date', LunarCalendarPadDate);