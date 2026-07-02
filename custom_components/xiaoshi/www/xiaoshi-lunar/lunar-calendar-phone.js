const whenDefined = (t) => customElements.whenDefined(t);
await Promise.race([whenDefined("ha-card"), whenDefined("ha-panel-lovelace")]);
const LitElement = window.LitElement || Object.getPrototypeOf(customElements.get("ha-card"));
const html = LitElement.prototype.html;
const css = LitElement.prototype.css;

window.customCards = window.customCards || [];
window.customCards.push({
    type: 'xiaoshi-lunar-calendar-phone-date',
    name: '消逝万年历 - 手机日期',
    description: '消逝万年历日历 - 手机日期',
	  preview: true
  },
  {
    type: 'xiaoshi-lunar-calendar-phone',
    name: '消逝万年历日历 - 手机端信息聚合',
    description: ''
});

class LunarCalendarPhone extends LitElement {
  static get properties() {
    return {
      hass: { type: Object },
      config: { type: Object },
      selectedDate: { type: String },
      todayDate: { type: String }
    };
  }

  setConfig(config) {
    this.config = {
      lunar: config?.lunar || 'sensor.lunar_calendar',
      theme: config?.theme || 'system',
      width: config?.width || '99.5%',
      height: config?.height || '88.4vh',
      date: config?.date || 'date.lunar_tap_date',
      ...config
    };
  }
  static get styles() {
    return css`      :host { display: block; max-width:500px; margin: 0 auto; }
      .card-container { display: flex; flex-direction: column; gap: 0.8vh; }`;
  }

  render() {
    if (!this.hass) {
      return html`<div>Loading...</div>`;
    }
    const totalHeight = this.config.height;
    const headHeight = '6.5vh'; 
    const calendarHeight = '30vh';
    const bodyHeight = '6.5vh';
    
    return html`
      <div class="card-container"\n style="width: ${this.config.width};">
        <xiaoshi-lunar-calendar-head \n
          .hass=${this.hass}\n
          .config=${this.config}\n
          .width=${this.config.width}\n
          .height=${headHeight}>
        </xiaoshi-lunar-calendar-head>
        
        <xiaoshi-lunar-calendar \n
          .hass=${this.hass}\n
          .config=${this.config}\n
          .width=${this.config.width}\n
          .height=${calendarHeight}>
        </xiaoshi-lunar-calendar>
        
        <xiaoshi-lunar-calendar-body1 \n
          .hass=${this.hass}\n
          .config=${this.config}\n
          .width=${this.config.width}\n
          .height=${bodyHeight}>
        </xiaoshi-lunar-calendar-body1>
        
        <xiaoshi-lunar-calendar-body2 \n
          .hass=${this.hass}\n
          .config=${this.config}\n
          .width=${this.config.width}\n
          .height=${bodyHeight}>
        </xiaoshi-lunar-calendar-body2>
        
        <xiaoshi-lunar-calendar-body3 \n
          .hass=${this.hass}\n
          .config=${this.config}\n
          .width=${this.config.width}\n
          .height=${bodyHeight}>
        </xiaoshi-lunar-calendar-body3>
        
        <xiaoshi-lunar-calendar-body4 \n
          .hass=${this.hass}\n
          .config=${this.config}\n
          .width=${this.config.width}\n
          .height=${bodyHeight}>
        </xiaoshi-lunar-calendar-body4>
        
        <xiaoshi-lunar-calendar-body5 \n
          .hass=${this.hass}\n
          .config=${this.config}\n
          .width=${this.config.width}\n
          .height=${bodyHeight}>
        </xiaoshi-lunar-calendar-body5>
        
        <xiaoshi-lunar-calendar-body6 \n
          .hass=${this.hass}\n
          .config=${this.config}\n
          .width=${this.config.width}\n
          .height=${bodyHeight}>
        </xiaoshi-lunar-calendar-body6>
        
        <xiaoshi-lunar-calendar-body7 \n
          .hass=${this.hass}\n
          .config=${this.config}\n
          .width=${this.config.width}\n
          .height=${bodyHeight}>\n
        </xiaoshi-lunar-calendar-body7>
      </div>
    `;
  }
}
customElements.define('xiaoshi-lunar-calendar-phone', LunarCalendarPhone);

class LunarCalendarPhoneDateEditor extends LitElement {
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
          <label>主题</label>
          <select
            @change=${this._valueChanged}
            .value=${this.config.theme || 'system'}
            name="theme"
          >
            <option value="system">system -  黑色字体、弹出窗体亮色背景</option>
            <option value="light">light -  黑色字体、弹出窗体亮色背景</option>
            <option value="dark">dark - 白色字体、弹出窗体暗色背景</option>
          </select>
          <span style="font-size:12px;color:#888;">也可引用全局函数：[[[ return theme() ]]]</span>
        </div>

        <div class="form-group">
          <label>简化日期</label>
          <select
            @change=${this._valueChanged}
            .value=${this.config.simplified !== undefined ? String(this.config.simplified) : 'false'}
            name="simplified"
          >
            <option value="false">标准（显示日期、星期、农历年月日）</option>
            <option value="true">简化（显示日期、星期、农历年月）</option>
          </select>
        </div>

        <div class="form-group">
          <label>弹窗动画</label>
          <select
            @change=${this._valueChanged}
            .value=${this.config.popup_animation || 'center'}
            name="popup_animation"
          >
            <option value="center">中间</option>
            <option value="bottom">由下往上</option>
            <option value="top">由上往下</option>
          </select>
        </div>
      </div>
    `;
  }

  _valueChanged(e) {
    const { name, value } = e.target;
    if (!value) return;

    let processedValue = value;
    if (name === 'simplified') {
      processedValue = value === 'true';
    }

    this.config = {
      ...this.config,
      [name]: processedValue
    };

    this.dispatchEvent(new CustomEvent('config-changed', {
      detail: { config: this.config },
      bubbles: true,
      composed: true
    }));
  }

  _onEntityInput(e) {
    this.config = {
      ...this.config,
      entity: e.target.value
    };
  }

  setConfig(config) {
    this.config = config;
  }
}
customElements.define('xiaoshi-lunar-calendar-phone-date-editor', LunarCalendarPhoneDateEditor);

class LunarCalendarPhoneDate extends LitElement {
  static get properties() {
    return {
      hass: { type: Object },
      config: { type: Object },
      _theme: { type: String },
      _simplified: { type: Boolean }
    };
  }

  constructor() {
    super();
    // 弹窗 hass 状态订阅
    this._popupHassUnsubscribe = null;
    this._popupUpdatePending = false;
    this._popupHass = null;
  }

  static getConfigElement() {
    return document.createElement("xiaoshi-lunar-calendar-phone-date-editor");
  }

  setConfig(config) {
    this.config = config;
    this._theme = config.theme || 'system';
    this._simplified = config.simplified !== undefined ? config.simplified : false;
  }

  static get styles() {
    return css`      :host { display: block; width: 100%; height: 20px; max-width: 500px; margin: 0 auto; }
      ha-card { background: transparent !important; box-shadow: none !important; border: none !important; }
      .content { font-weight: bold; font-size: 12px; color: var(--theme-color); text-align: center; }`;
  } 

  render() {
    const theme = this._evaluateTheme();
    const Color =  theme == 'light' ? 'rgb(0,0,0)' : 'rgb(255,255,255)';
    this.style.setProperty('--theme-color', Color);
    if (!this.hass || !this.config) {
      return html``;
    }
    const entityId = this.config.entity || 'sensor.lunar_calendar';
    const state = this.hass.states[entityId];
    if (!state || !state.attributes) {
      return html``;
    }
    const stateAttrs = state.attributes;
    const date = stateAttrs['今天的阳历日期']?.['日期3'] || '';
    const week = stateAttrs['今天的阳历日期']?.['星期1'] || '';
    const lunaryear = stateAttrs['今天的农历日期']?.['年'] || '';
    const lunardate = stateAttrs['今天的农历日期']?.['日期'] || '';
    const nowdate = this._simplified
      ? `${date} ${week} ${lunardate}`
      : `${date} ${week} 【农历 ${lunaryear} ${lunardate}】`;

    return html`
      <ha-card @click=${this._showPopup}>
        <div class="content">${nowdate}</div>
      </ha-card>
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
    if (LunarCalendarPhoneDate._stylesInjected) return;
    LunarCalendarPhoneDate._stylesInjected = true;
    const style = document.createElement('style');
    style.id = 'xiaoshi-phone-popup-style';
    style.textContent = `
      @keyframes xiaoshiPhonePopupBottom {
        from { opacity: 0; transform: translateX(-50%) translateY(100%); }
        to   { opacity: 1; transform: translateX(-50%) translateY(0); }
      }
      @keyframes xiaoshiPhonePopupTop {
        from { opacity: 0; transform: translateX(-50%) translateY(-100%); }
        to   { opacity: 1; transform: translateX(-50%) translateY(0); }
      }
      @keyframes xiaoshiPhonePopupCenter {
        from { opacity: 0; transform: translateX(-50%) scale(0.9); }
        to   { opacity: 1; transform: translateX(-50%) scale(1); }
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
      console.error('[LunarCalendarPhoneDate] 无法获取 hass 对象');
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
    const anim = this.config.popup_animation || 'center';
    const animNameMap = { bottom: 'xiaoshiPhonePopupBottom', top: 'xiaoshiPhonePopupTop', center: 'xiaoshiPhonePopupCenter' };
    const animName = animNameMap[anim] || 'xiaoshiPhonePopupBottom';
    const popup = document.createElement('div');
    popup.style.cssText = `
      position: fixed;
      top: 0px; left: 50%;
      transform: translateX(-50%);
      z-index: 1005;
      background: transparent;
      padding: 20px 0;
      width: 96vw;
      height: 88.4vh;
      overflow: hidden;
      animation: ${animName} 0.5s ease-out;
    `;

    document.body.appendChild(overlay);
    document.body.appendChild(popup);

    this._popupOverlay = overlay;
    this._popupElement = popup;

    // 创建卡片
    const cardConfig = {
      type: 'custom:xiaoshi-lunar-calendar-phone',
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
      console.error('[LunarCalendarPhoneDate] 创建弹窗卡片失败:', err);
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
      setTimeout(() => this._startPopupHassWatcher(hassObj), 500);
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
      console.error('[LunarCalendarPhoneDate] 订阅状态变化失败:', err);
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
        console.warn('[LunarCalendarPhoneDate] 弹窗卡片更新失败:', err.message);
      }
    }
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this._closePopup();
  }
}
customElements.define('xiaoshi-lunar-calendar-phone-date', LunarCalendarPhoneDate);