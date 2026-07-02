const whenDefined = (t) => customElements.whenDefined(t);
await Promise.race([whenDefined("ha-card"), whenDefined("ha-panel-lovelace")]);
const LitElement = window.LitElement || Object.getPrototypeOf(customElements.get("ha-card"));
const html = LitElement.prototype.html;
const css = LitElement.prototype.css;

window.customCards = window.customCards || [];
window.customCards.push({
    type: 'xiaoshi-pad-camera-card',
    name: '消逝卡(A平板端)-摄像头卡',
    description: '摄像头/门铃/自定义图片弹出卡片'
});

/* ======================== 编辑器 ======================== */
class XiaoshiPadCameraCardEditor extends LitElement {
  static get properties() {
    return { hass: Object, _config: Object };
  }

  static get styles() {
    return css`
      .editor-container { padding: 16px; display: flex; flex-direction: column; gap: 16px; }
      .field { display: flex; flex-direction: column; gap: 4px; }
      .field label { font-size: 12px; color: var(--secondary-text-color); font-weight: 500; }
      .field input, .field select { padding: 8px; border: 1px solid var(--divider-color); border-radius: 4px; font-size: 14px; background: var(--card-background-color); color: var(--primary-text-color); }
      .inline-fields { display: flex; gap: 12px; }
      .inline-fields .field { flex: 1; }
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
    if (target.type === 'checkbox') value = target.checked;
    const newConfig = { ...this._config };
    if (value === '' || value === undefined) {
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
        <div class="field">
          <label>主题</label>
          <select .value=${this._config.theme || 'system'} configKey="theme" @change=${this._valueChanged}>
            <option value="system" ?selected=${!this._config.theme || this._config.theme === 'system'}>跟随系统</option>
            <option value="light" ?selected=${this._config.theme === 'light'}>浅色</option>
            <option value="dark" ?selected=${this._config.theme === 'dark'}>深色</option>
            <option value="sun" ?selected=${this._config.theme === 'sun'}>跟随太阳</option>
            <option value="function" ?selected=${this._config.theme === 'function'}>跟随函数(window.theme)</option>
          </select>
        </div>
        <div class="inline-fields">
          <div class="field">
            <label>按钮宽（默认30px）</label>
            <input type="text" .value=${this._config.btn_width || '30px'} configKey="btn_width" @value-changed=${this._valueChanged} @change=${this._valueChanged} placeholder="30px" />
          </div>
          <div class="field">
            <label>按钮高（默认30px）</label>
            <input type="text" .value=${this._config.btn_height || '30px'} configKey="btn_height" @value-changed=${this._valueChanged} @change=${this._valueChanged} placeholder="30px" />
          </div>
        </div>
        <div class="inline-fields">
          <div class="field">
            <label>弹出卡片宽（默认500px）</label>
            <input type="text" .value=${this._config.popup_width || '500px'} configKey="popup_width" @value-changed=${this._valueChanged} @change=${this._valueChanged} placeholder="500px" />
          </div>
          <div class="field">
            <label>弹出卡片top位置（默认20px）</label>
            <input type="text" .value=${this._config.popup_top || '20px'} configKey="popup_top" @value-changed=${this._valueChanged} @change=${this._valueChanged} placeholder="20px" />
          </div>
        </div>
        <div class="field">
          <label>弹窗背景css属性</label>
          <select .value=${this._config.popup_background || ''} configKey="popup_background" @change=${this._valueChanged}>
            <option value="" ?selected=${!this._config.popup_background}>默认</option>
            <option value="transparent" ?selected=${this._config.popup_background === 'transparent'}>透明(transparent)</option>
            <option value="theme" ?selected=${this._config.popup_background === 'theme'}>跟随主题(theme)</option>
            <option value="custom" ?selected=${this._config.popup_background && this._config.popup_background !== 'transparent' && this._config.popup_background !== 'theme'}>自定义颜色</option>
          </select>
          ${this._config.popup_background && this._config.popup_background !== 'transparent' && this._config.popup_background !== 'theme' ? html`
          <input type="color" .value=${this._config.popup_background} configKey="popup_background" @change=${this._valueChanged} title="自定义弹窗背景颜色" style="width:34px;height:30px;padding:1px;border:1px solid #ddd;border-radius:4px;" />
          ` : ''}
        </div>
        <div class="field">
          <label>类型</label>
          <select .value=${this._config.btn_type || 'dome'} configKey="btn_type" @change=${this._valueChanged}>
            <option value="doorbell" ?selected=${this._config.btn_type === 'doorbell'}>门铃</option>
            <option value="dome" ?selected=${!this._config.btn_type || this._config.btn_type === 'dome'}>球型摄像头</option>
            <option value="desktop" ?selected=${this._config.btn_type === 'desktop'}>桌面摄像头</option>
            <option value="bullet" ?selected=${this._config.btn_type === 'bullet'}>枪式摄像头</option>
            <option value="custom" ?selected=${this._config.btn_type === 'custom'}>自定义图片</option>
          </select>
        </div>
        ${this._config.btn_type === 'custom' ? html`
        <div class="field">
          <label>自定义图片路径</label>
          <input type="text" .value=${this._config.custom_image || ''} configKey="custom_image" @value-changed=${this._valueChanged} @change=${this._valueChanged} placeholder="/local/UI/背景/彩平图.png" />
        </div>
        ` : ''}
        <div class="field">
          <label>摄像头实体</label>
          <input type="text" .value=${this._config.entity || ''} configKey="entity" @value-changed=${this._valueChanged} @change=${this._valueChanged} placeholder="camera.doorbell" />
        </div>
        <div class="field">
          <label><input type="checkbox" ?checked=${this._config.auto_popup !== false} configKey="auto_popup" @change=${this._valueChanged} /> 自动弹窗（监测 entity_picture 变化自动弹出，2分钟后关闭）</label>
        </div>
        ${this._config.auto_popup !== false ? html`
        <div class="field">
          <label>自动弹窗冷却时间（秒，默认30，避免频繁弹出）</label>
          <input type="number" .value=${this._config.auto_popup_cooldown || 30} configKey="auto_popup_cooldown" @value-changed=${this._valueChanged} @change=${this._valueChanged} placeholder="30" min="5" />
        </div>
        ` : ''}
      </div>
    `;
  }
}
customElements.define('xiaoshi-pad-camera-card-editor', XiaoshiPadCameraCardEditor);

/* ======================== 卡片本体 ======================== */
class XiaoshiPadCameraCard extends LitElement {
  static get properties() {
    return { hass: Object, config: Object };
  }

  static get styles() {
    return css`
      :host { position: relative; display: inline-flex; }
      .camera-btn { cursor: pointer; display: flex; align-items: center; justify-content: center; overflow: hidden; border: none; background: transparent; padding: 0; position: relative; }
      .camera-btn img { width: 100%; height: 100%; object-fit: cover; }
      .camera-btn svg { width: 100%; height: 100%; }
    `;
  }

  setConfig(config) {
    this.config = {
      theme: config.theme || 'system',
      btn_width: config.btn_width || '30px',
      btn_height: config.btn_height || '30px',
      popup_width: config.popup_width || '500px',
      popup_top: config.popup_top || '20px',
      btn_type: config.btn_type || 'dome',
      custom_image: config.custom_image || '',
      entity: config.entity || '',
      auto_popup: config.auto_popup !== false,
      auto_popup_cooldown: Number(config.auto_popup_cooldown) || 30,
    };
  }

  connectedCallback() {
    super.connectedCallback();
    this._autoCloseTimer = null;
    this._lastAutoPopupTime = 0;
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this._clearTimers();
  }

  _clearTimers() {
    if (this._autoCloseTimer) {
      clearTimeout(this._autoCloseTimer);
      this._autoCloseTimer = null;
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
      if (mode === 'function') {
        if (typeof window.theme === 'function') return window.theme() || 'light';
        return 'light';
      }
      return mode;
    } catch (e) {
      return 'light';
    }
  }

  updated(changedProps) {
    if (!changedProps.has('hass') || !this.config || !this.config.auto_popup || !this.config.entity) return;

    const entity = this.hass.states[this.config.entity];
    if (!entity) return;

    // 通过 motion_video_time 变化来判断门铃/摄像头有新的动态画面
    const currentTime = entity.attributes && entity.attributes.motion_video_time;
    if (!currentTime) return;

    // 首次记录，不触发弹窗
    if (this._lastMotionVideoTime === undefined) {
      this._lastMotionVideoTime = currentTime;
      return;
    }

    // motion_video_time 没变，跳过
    if (this._lastMotionVideoTime === currentTime) return;

    this._lastMotionVideoTime = currentTime;

    // 冷却期内不重复弹窗
    const now = Date.now();
    const cooldown = (this.config.auto_popup_cooldown || 30) * 1000;
    if (now - this._lastAutoPopupTime < cooldown) return;

    this._lastAutoPopupTime = now;
    this._showAutoPopup();
  }

  _showAutoPopup() {
    this._clearTimers();
    this._handleClick();
    this._autoCloseTimer = setTimeout(() => {
      try {
        this.hass.callService('popup_card', 'close', {});
      } catch (e) { /* 忽略关闭弹窗时的异常 */ }
      this._autoCloseTimer = null;
    }, 2 * 60 * 1000);
  }

  /* 参照 grid-card 的 _handleGridClick 弹出方法 */
  _handleClick() {
    if (!this.config.entity) return;
    const entity = this.hass.states[this.config.entity];
    if (!entity) return;

    const cards = [{
      type: 'picture-entity',
      entity: this.config.entity,
      camera_view: 'live',
      show_state: false,
      show_name: false,
    }];

    const serviceData = { card: cards };
    serviceData.popup_width = this.config.popup_width || '500px';
    serviceData.popup_top = this.config.popup_top || '20px';

    // popup_background 处理
    if (this.config.popup_background === 'transparent') {
        serviceData.background = 'transparent';
    } else if (this.config.popup_background === 'theme') {
        const currentTheme = this._evaluateTheme ? this._evaluateTheme() : 'light';
        serviceData.background = currentTheme === 'light' ? 'rgb(255, 255, 255)' : 'rgb(50, 50, 50)';
    } else if (this.config.popup_background && this.config.popup_background !== '') {
        serviceData.background = this.config.popup_background;
    }

    this.hass.callService('popup_card', 'show', serviceData);

    const hapticEvent = new Event('haptic', { bubbles: true, cancelable: false, composed: true });
    hapticEvent.detail = 'light';
    this.dispatchEvent(hapticEvent);
  }

  render() {
    if (!this.config) return html``;
    const theme = this._evaluateTheme();
    const btnStyle = `width: ${this.config.btn_width}; height: ${this.config.btn_height};`;

    return html`
      <div class="camera-btn" style="${btnStyle}" @click=${this._handleClick} title=${this.config.entity || ''}>
        ${this.config.btn_type === 'doorbell' ? this._renderDoorbell() :
          this.config.btn_type === 'dome' ? this._renderDome() :
          this.config.btn_type === 'desktop' ? this._renderDesktop() :
          this.config.btn_type === 'bullet' ? this._renderBullet() :
          this.config.btn_type === 'custom' && this.config.custom_image ? this._renderCustom() :
          this._renderDome()}
      </div>
    `;
  }

  _renderDoorbell() {
    const theme = this._evaluateTheme();
    return html`
      <svg viewBox="0 0 24 24" fill="${theme === 'dark' ? '#fff' : '#333'}">
        <path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2zm6-6v-5c0-3.07-1.63-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.6-1.5 1.5v.68C7.64 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z"/>
      </svg>
    `;
  }

  _renderDome() {
    const theme = this._evaluateTheme();
    return html`
      <svg viewBox="0 0 1024 1024" fill="${theme === 'dark' ? '#fff' : '#333'}">
        <path d="M509.9 385.5c87.6 0 171.9 5.9 243.8 17 96.2 14.9 139.3 34.4 156.4 44.7l36.5 22c-2.9 3.3-6.2 6.2-9.9 8.6-0.5 0.4-1.1 0.7-1.7 1.1-32.6 20.7-53.8 54.7-58.2 93.1-9.1 79.3-50.3 152.8-116.1 207.2-8.1 6.7-16.5 13-25.1 19v-12.3l-0.7-209.9v-6.3l-1.2-6.2c-20.8-103-113.7-177.6-220.9-177.6-108.5 0-202.3 74.9-223.2 178.2l-1.3 6.3v226.5c-7.8-5.5-15.4-11.2-22.8-17.3-65.7-54-107-127.3-116.5-206.3-4.6-37.9-25.5-71.5-57.5-92-1.6-1.1-3.3-2.1-4.8-3.2-2.9-2-5.6-4.3-8-6.9l39.1-24.6c16.2-10.2 57.4-29.5 151.3-44.2 70.4-11.1 153.7-16.9 240.8-16.9m2.9 288.4c7.4 0 15.7 10.3 15.7 24.1s-8.3 24.1-15.7 24.1-15.7-10.3-15.7-24.1v-0.2c0-7.9 2.7-15.1 7.4-19.8 2.7-2.7 5.5-4.1 8.3-4.1m0.5-577.9C344 96 174.8 123.1 71.1 176.8c-41.9 21.7-68.4 64.6-69 111.8-0.6 46-1.3 105.5-0.7 150 0.5 36.9 18.7 71.4 49.1 92.2 2.1 1.5 4.3 2.9 6.5 4.3 15.9 10.2 26.3 27 28.5 45.8 23.6 196.3 205.7 349 427.3 349 222.4 0 405-153.6 427.6-350.6 2.2-19 12.8-36.1 29-46.4 0.7-0.5 1.5-0.9 2.2-1.4 32.2-20.9 51.3-56.9 51.3-95.3V290c0-47.9-26.8-91.7-69.4-113.6C849.2 122.6 681.2 96 513.3 96zM83.8 392.4c-2.3-23.4-1.8-82.7-1.5-115.6 0.1-12 7-23 17.8-28.3 96.8-47.8 258.3-70.6 416.8-70.6 165.8 0 328.5 25 410.4 72.5 9.9 5.7 15.9 16.2 15.9 27.6v114.3c-78.3-47.1-256.2-70.9-433.3-70.9-175.8 0.1-350.6 23.6-426.1 71z m429 457.5c-69.3 0-138.5-28.4-160.4-65.7V576.7c14.8-73.2 83.4-126.8 160.4-126.8S656.2 503 670.9 576l0.7 209.9c-21.9 37.2-89.5 64-158.8 64z m0-240c-44 0-79.8 39.4-79.7 88.1 0 48.7 35.7 88.1 79.7 88.1s79.7-39.4 79.7-88.1-35.8-88.1-79.7-88.1z"/>
      </svg>
    `;
  }

  _renderDesktop() {
    const theme = this._evaluateTheme();
    return html`
      <svg viewBox="0 0 1024 1024" fill="${theme === 'dark' ? '#fff' : '#333'}">
        <path d="M542.464 123.648c-174.592 0-316.16 141.568-316.16 316.16 0 174.592 141.568 316.16 316.16 316.16 174.592 0 316.16-141.568 316.16-316.16 0-174.72-141.568-316.16-316.16-316.16z m-169.344 136.96c0-20.608 16.64-37.248 37.248-37.248s37.248 16.64 37.248 37.248-16.64 37.248-37.248 37.248-37.248-16.64-37.248-37.248z m169.344 311.424c-73.088 0-132.224-59.264-132.224-132.224 0-73.088 59.264-132.224 132.224-132.224 73.088 0 132.224 59.264 132.224 132.224s-59.264 132.224-132.224 132.224z"/>
        <path d="M778.752 720.64c-57.856 65.28-142.208 106.752-236.416 106.752-92.544 0-175.488-39.936-233.216-103.296L251.008 857.6c-10.752 24.832 10.496 46.464 47.872 46.464h491.52c37.504 0 58.752-21.632 47.872-46.464l-59.52-136.96z"/>
      </svg>
    `;
  }

  _renderBullet() {
    const theme = this._evaluateTheme();
    return html`
      <svg viewBox="0 0 1024 1024" fill="${theme === 'dark' ? '#fff' : '#333'}">
        <path d="M327.8 47.8C312.2 38.1 294.1 33 275.7 33c-15.9 0-31.3 3.8-45 10.8-13.7 7-25.8 17.3-35.1 30.1l-117.6 163c-9 12.4-13.8 27.4-13.8 42.8 0 12.6 3.2 24.7 9.1 35.3 5.9 10.7 14.4 19.8 25.1 26.5l629.6 395.3c15.8 9.9 34.1 15.2 52.8 15.2 16.1 0 31.7-3.9 45.7-11.1 13.9-7.2 26.1-17.7 35.4-30.9L1024.2 480 327.8 47.8z m481.8 625.3c-6.6 9.4-17.3 14.9-28.8 14.9-3.3 0-6.6-0.5-9.8-1.4-3.2-0.9-6.2-2.3-9-4L132.4 287.3c-2.6-1.7-4.2-4.6-4.2-7.7 0-1.9 0.6-3.8 1.7-5.3l117.6-163c6.5-9 17-14.4 28.2-14.4 3.2 0 6.5 0.5 9.5 1.3 3.1 0.9 6 2.2 8.8 3.9l638.7 396.4-123.1 174.6zM754.1 768c-11.1 0-22-1.5-32.6-4.5-10.6-3-20.7-7.4-30.2-13.2l-611.8-373c-6.7-4.1-15.3 0.7-15.3 8.6v22.6c0 14.6 7.6 28.2 20 35.8l182.5 112.3C241.2 572 224.2 600 224.2 632c0 20.2 6.8 38.8 18.3 53.7a62.518 62.518 0 0 1-44.2 18.3H64.2v-46.8c0-29-19.5-54.4-47.6-61.9L0.2 591l-0.2 369 28.8-14.3c21.7-10.8 35.5-33 35.5-57.3V768h135.5c25.9 0 50.8-10.3 69.2-28.7l3.1-3.1c10.6-10.6 25-16.3 40-16.3h0.2c46.4 0 84.4-35.9 87.8-81.4L674.2 807.2c9.2 5.7 19.9 8.7 30.7 8.7 9.8 0 19.3-2.5 27.7-6.9 8.4-4.5 15.7-11 21.1-19.2l6.8-10.1c3.2-5-0.4-11.7-6.4-11.7zM312.2 656c-13.2 0-24-10.8-24-24s10.8-24 24-24 24 10.8 24 24-10.8 24-24 24z"/>
      </svg>
    `;
  }

  _renderCustom() {
    return html`
      <img src=${this.config.custom_image} alt="camera" />
    `;
  }

  static getConfigElement() {
    return document.createElement('xiaoshi-pad-camera-card-editor');
  }

  getCardSize() {
    return 1;
  }
}
customElements.define('xiaoshi-pad-camera-card', XiaoshiPadCameraCard);
