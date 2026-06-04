import { LitElement, html, css } from "https://unpkg.com/lit-element@2.4.0/lit-element.js?module";

class XiaoshiWeatherPhoneEditor extends LitElement {
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
      .form-group {
        display: flex;
        flex-direction: column;
        gap: 5px;
      }
      label {
        font-weight: bold;
      }
      select, input {
        padding: 8px;
        border: 1px solid #ddd;
        border-radius: 4px;
        width: 100%;
        box-sizing: border-box;
      }
      input[type="number"] {
        width: 100px;
      }
      .conditional-field {
        display: none;
      }
      .conditional-field.visible {
        display: flex;
        flex-direction: column;
        gap: 5px;
      }
      .entity-search-container {
        position: relative;
        width: 100%;
      }
      .entity-search-container input {
        width: 100%;
        min-width: 200px;
      }
      datalist {
        max-height: 200px;
        overflow-y: auto;
      }
    `;
  }

  render() {
    if (!this.hass) return html``;

    return html`
      <div class="form">
        <div class="form-group">
          <label>天气实体</label>
          <select 
            @change=${this._entityChanged}
            .value=${this.config.entity || ''}
            name="entity"
          >
            <option value="">选择天气实体</option>
            ${Object.keys(this.hass.states)
              .filter(entityId => entityId.startsWith('weather.'))
              .map(entityId => html`
                <option value="${entityId}" 
                  .selected=${entityId === this.config.entity}>
                  ${this.hass.states[entityId].attributes.friendly_name || entityId} ${this.hass.states[entityId].attributes.friendly_name ? '(' + entityId + ')' : ''}
                </option>
              `)}
          </select>
        </div>
        
        <div class="form-group">
          <label>打开卡片时自动更新数据</label>
          <select
            @change=${this._entityChanged}
            .value=${this.config.auto_refresh_on_load !== undefined ? this.config.auto_refresh_on_load : false}
            name="auto_refresh_on_load"
          >
            <option value=false>否（不自动更新）</option>
            <option value=true>是（每次打开时自动更新）</option>
          </select>
        </div>

        <div class="form-group">
          <label>视觉样式</label>
          <select 
            @change=${this._entityChanged}
            .value=${this.config.visual_style !== undefined ? this.config.visual_style : 'button'}
            name="visual_style"
          >
            <option value="button">按钮模式</option>
            <option value="dot">圆点模式</option>
          </select>
        </div>
        
        <div class="form-group">
          <label>主题</label>
          <select 
            @change=${this._entityChanged}
            .value=${this.config.theme !== undefined ? this.config.theme : 'system'}
            name="theme"
          >
            <option value="system">跟随系统</option>
            <option value="light">浅色主题（白底黑字）</option>
            <option value="dark">深色主题（黑底白字）</option>
          </select>
        </div>

        <div class="form-group">
          <label>预报列数</label>
          <select 
            @change=${this._entityChanged}
            .value=${this.config.columns !== undefined ? this.config.columns : 9}
            name="columns"
          >
            <option value="7">7列</option>
            <option value="8">8列</option>
            <option value="9">9列</option>
            <option value="10">10列</option>
          </select>
        </div>
        
        <div class="form-group">
          <label>图标模式</label>
          <select 
            @change=${this._entityChanged}
            .value=${this.config.mode !== undefined ? this.config.mode : '家'}
            name="mode"
          >
            <option value="家">家</option>
            <option value="手机定位">手机定位</option>
            <option value="搜索城市">搜索城市</option>
          </select>
        </div>
        
       
        <div class="form-group conditional-field ${this.config.mode === '搜索城市' ? 'visible' : ''}" id="city-entity-group">
          <label>搜索城市text实体</label>
          <div class="entity-search-container">
            <input 
              type="text" 
              .value=${this.config.city_entity || 'text.set_city'}
              @input=${this._onCityEntityInput}
              @change=${this._entityChanged}
              name="city_entity"
              placeholder="搜索城市text实体（如 text.set_city）"
              list="city-entities"
            />
            <datalist id="city-entities">
              ${Object.keys(this.hass.states)
                .filter(entityId => 
                  entityId.startsWith('text.') ||
                  entityId.toLowerCase().includes('city') ||
                  entityId.toLowerCase().includes('城市')
                )
                .map(entityId => html`
                  <option value="${entityId}">
                    ${this.hass.states[entityId].attributes.friendly_name || entityId}
                  </option>
                `)}
            </datalist>
          </div>
        </div>

        <div class="form-group">
          <label>是否实体替换实时温湿度</label>
          <select
            @change=${this._entityChanged}
            .value=${this.config.use_custom_entities !== undefined ? this.config.use_custom_entities : false}
            name="use_custom_entities"
          >
            <option value=false>否（使用天气实体的温湿度）</option>
            <option value=true>是（使用自定义实体）</option>
          </select>
        </div>

        <div class="form-group conditional-field ${this.config.use_custom_entities ? 'visible' : ''}" id="temperature-entity-group">
          <label>温度实体</label>
          <div class="entity-search-container">
            <input 
              type="text" 
              .value=${this.config.temperature_entity || ''}
              @input=${this._onTemperatureEntityInput}
              @change=${this._entityChanged}
              name="temperature_entity"
              placeholder="搜索温度实体（如 sensor.temperature）"
              list="temperature-entities"
            />
            <datalist id="temperature-entities">
              ${Object.keys(this.hass.states)
                .filter(entityId => 
                  this.hass.states[entityId].attributes?.unit_of_measurement === '°C' ||
                  this.hass.states[entityId].attributes?.device_class === 'temperature' ||
                  entityId.toLowerCase().includes('temp')
                )
                .map(entityId => html`
                  <option value="${entityId}">
                    ${this.hass.states[entityId].attributes.friendly_name || entityId}
                  </option>
                `)}
            </datalist>
          </div>
        </div>
        
        <div class="form-group conditional-field ${this.config.use_custom_entities ? 'visible' : ''}" id="humidity-entity-group">
          <label>湿度实体</label>
          <div class="entity-search-container">
            <input 
              type="text" 
              .value=${this.config.humidity_entity || ''}
              @input=${this._onHumidityEntityInput}
              @change=${this._entityChanged}
              name="humidity_entity"
              placeholder="搜索湿度实体（如 sensor.humidity）"
              list="humidity-entities"
            />
            <datalist id="humidity-entities">
              ${Object.keys(this.hass.states)
                .filter(entityId => 
                  this.hass.states[entityId].attributes?.unit_of_measurement === '%' ||
                  this.hass.states[entityId].attributes?.device_class === 'humidity' ||
                  entityId.toLowerCase().includes('humid')
                )
                .map(entityId => html`
                  <option value="${entityId}">
                    ${this.hass.states[entityId].attributes.friendly_name || entityId}
                  </option>
                `)}
            </datalist>
          </div>
        </div>
         
      </div>
    `;
  }

  _entityChanged(e) {
    const { name, value } = e.target;
    if (!value && name !== 'theme' && name !== 'mode' && name !== 'columns' && name !== 'use_custom_entities' && name !== 'temperature_entity' && name !== 'humidity_entity' && name !== 'city_entity' && name !== 'visual_style' && name !== 'auto_refresh_on_load') return;

    let processedValue = value;
    if (name === 'columns' ) {
      processedValue = parseInt(value);
    } else if (name === 'use_custom_entities') {
      processedValue = value === 'true';
    } else if (name === 'auto_refresh_on_load') {
      processedValue = value === 'true';
    }
    
    this.config = {
      ...this.config,
      [name]: processedValue
    };

    // 处理条件字段的显示/隐藏
    if (name === 'use_custom_entities' || name === 'mode') {
      this._updateConditionalFields();
    }

    this.dispatchEvent(new CustomEvent('config-changed', {
      detail: { config: this.config },
      bubbles: true,
      composed: true
    }));
  } 

  _updateConditionalFields() {
    // 更新条件字段的显示状态
    const useCustomEntities = this.config.use_custom_entities;
    const mode = this.config.mode;
    
    // 获取条件字段元素
    const tempGroup = this.shadowRoot?.getElementById('temperature-entity-group');
    const humidityGroup = this.shadowRoot?.getElementById('humidity-entity-group');
    const cityGroup = this.shadowRoot?.getElementById('city-entity-group');
    
    if (tempGroup) {
      if (useCustomEntities) {
        tempGroup.classList.add('visible');
      } else {
        tempGroup.classList.remove('visible');
        // 如果禁用，清空配置
        delete this.config.temperature_entity;
      }
    }
    
    if (humidityGroup) {
      if (useCustomEntities) {
        humidityGroup.classList.add('visible');
      } else {
        humidityGroup.classList.remove('visible');
        // 如果禁用，清空配置
        delete this.config.humidity_entity;
      }
    }
    
    if (cityGroup) {
      if (mode === '搜索城市') {
        cityGroup.classList.add('visible');
      } else {
        cityGroup.classList.remove('visible');
        // 如果不是搜索城市模式，清空配置
        delete this.config.city_entity;
      }
    }
  }

  _onTemperatureEntityInput(e) {
    // 实时更新配置值，但不触发配置更改事件
    this.config = {
      ...this.config,
      temperature_entity: e.target.value
    };
  }

  _onHumidityEntityInput(e) {
    // 实时更新配置值，但不触发配置更改事件
    this.config = {
      ...this.config,
      humidity_entity: e.target.value
    };
  }

  _onCityEntityInput(e) {
    // 实时更新配置值，但不触发配置更改事件
    this.config = {
      ...this.config,
      city_entity: e.target.value
    };
  }

  setConfig(config) {
    this.config = config;
    // 在配置设置后更新条件字段
    setTimeout(() => {
      this._updateConditionalFields();
    }, 0);
  }
}
customElements.define('xiaoshi-weather-phone-editor', XiaoshiWeatherPhoneEditor);

class XiaoshiWeatherPhoneCard extends LitElement {
  // 温度计算常量
  static get TEMPERATURE_CONSTANTS() {
    return {
      BUTTON_HEIGHT_VW: 3.4,        // 温度矩形高度（vw）
      CONTAINER_HEIGHT_VW: 21,       // 温度容器总高度（vw）
      FORECAST_COLUMNS: 9,          // 预报列数
    };
  }

  // 图标路径常量 - 方便调试修改
  static get ICON_PATH() {
    return '/xiaoshi/weather-icon';
  }

  static getConfigElement() {
    return document.createElement("xiaoshi-weather-phone-editor");
  }

  static get properties() {
    return {
      hass: { type: Object },
      config: { type: Object },
      city_entity: { type: Object },
      entity: { type: Object },
      mode: { type: String },
      forecastMode: { type: String }, // 'daily', 'hourly', 或 'minutely'
      showWarningDetails: { type: Boolean }, // 是否显示预警详情
      showApiInfo: { type: Boolean }, // 是否显示空气质量详情
      showIndicesDetails: { type: Boolean } // 是否显示天气指数详情
    };
  }

  static get styles() {
    return css`
      :host {
        display: block;
      }

      /*主卡片样式*/
      .weather-card {
        position: relative;
        border-radius: 3vw;
        padding: 1.6vw;
        padding-bottom: 0.6vw;
        font-family: sans-serif;
        overflow: hidden;
      }

      /*主卡片样式*/
      .weather-card.dark-theme {
      }

      .main-content {
        position: relative;
      }

      /*天气头部*/
      .weather-header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        margin-top: 0px;
        margin-bottom: 0px;
      }

      .weather-left {
        display: flex;
        align-items: center;
      }

      /*天气头部 图标*/
      .weather-icon {
        width: 10vw;
        height: 10vw;
        margin-right: 16px;
        margin-bottom: 0px;
      }

      /*天气头部 图标*/
      .weather-icon img {
        width: 100%;
        height: 100%;
        object-fit: contain;
      }

      /*天气头部 温度*/
      .weather-temperature {
        height: 7vw;
        font-size: 5vw;
        font-weight: bold;
        margin-top: 0;
        margin-bottom: 0;
      }

      /*天气头部 天气信息*/
      .weather-info {
        height: 3vw;
        font-size: 3vw;
        margin-top: -1vw;
        white-space: nowrap;
      }

      /*天气头部 城市信息*/
      .city-info {
        text-align: right;
        margin-top: 0.5vw;
        font-size: 4vw;
        font-weight: bold;
        white-space: nowrap;
      }

      /*天气右侧容器*/
      .weather-right {
        display: flex;
        flex-direction: column;
        align-items: flex-end;
      }

      .toggle-btn {
        padding: 0.6vw 2vw;
        border: none;
        border-radius: 1.2vw;
        font-size: 1.8vw;
        cursor: pointer;
        transition: all 0.3s ease;
        color: white;
        font-weight: bold;
      }


      .toggle-btn.daily-mode {
        background: #03A9F4; /* 蓝色 */
      }

      .toggle-btn.hourly-mode {
        background: #9C27B0; /* 紫色 */
      }

      .toggle-btn.minutely-mode {
        background: #4CAF50; /* 绿色 */
      }

      /*小时天气温度样式*/
      .temp-curve-hourly {
        position: absolute;
        left: 0;
        right: 0;
        height: 3.5vw;
        background: linear-gradient(to bottom, 
          rgba(156, 39, 176) 0%, 
          rgba(103, 58, 183) 100%);
        border-radius: 0.5vw;
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-size: 2vw;
        font-weight: bold;
        text-shadow: 0 1px 2px rgba(0,0,0,0.3);
        z-index: 4;
      }

      /*分钟天气温度样式（绿色）*/
      .temp-curve-minutely {
        position: absolute;
        left: 0;
        right: 0;
        height: 3.5vw;
        background: linear-gradient(to bottom, 
          rgba(76, 175, 80) 0%, 
          rgba(56, 142, 60) 100%);
        border-radius: 0.5vw;
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-size: 2vw;
        font-weight: bold;
        text-shadow: 0 1px 2px rgba(0,0,0,0.3);
        z-index: 4;
      }

      /*9日天气部分*/
      .forecast-container {
        display: grid;
        gap: 0.4vw;
        margin-top: 2vw;
        position: relative;
      }

      /*小时天气滑动容器*/
      .hourly-forecast-scroll-container {
        overflow-x: auto;
        overflow-y: hidden;
        margin-top: 2vw;
        position: relative;
        scrollbar-width: none; /* Firefox */
        -ms-overflow-style: none;  /* IE and Edge */
      }

      .hourly-forecast-scroll-container::-webkit-scrollbar {
        display: none; /* Chrome, Safari, Opera */
      }

      /*启用触摸滑动和平滑滚动*/
      .hourly-forecast-scroll-container {
        scroll-behavior: smooth;
        -webkit-overflow-scrolling: touch;
        touch-action: pan-x;
        cursor: grab;
      }

      .hourly-forecast-scroll-container:active {
        cursor: grabbing;
      }

      /*小时天气内容容器*/
      .hourly-forecast-container {
        display: grid;
        gap: 0.4vw;
        position: relative;
        min-width: max-content;
      }

      /*9日天气部分*/
      .forecast-day {
        grid-row: 1;
        text-align: center;
        position: relative;
        border-radius: 8px;
        padding: 1vw;
        position: relative;
      }

      /*9日天气部分 星期*/
      .forecast-weekday {
        font-size: 2.2vw;
        height: 2.8vw;
        margin-top: -1vw;
        margin-bottom: 0.2vw;
        font-weight: 500;
        white-space: nowrap;
      }
      
      /*9日天气部分 日期*/
      .forecast-date {
        font-size: 1.6vw;
        margin-bottom: 3vw;
        margin-left: 0vw;
        margin-right: 0vw;
        height: 2vw;
        white-space: nowrap;
      }

      /*9日天气部分 温度区域*/
      .forecast-temp-container {
        position: relative;
        height: 21vw;
        margin-top: 0;
        margin-bottom: 0;
        white-space: nowrap;
      }

      /*9日天气部分 温度区域*/
      .forecast-temp-null {
        position: relative;
        height: 2vw;
      }

      /*9日天气部分 雨量容器*/
      .forecast-rainfall-container {
        text-align: center;
        position: relative;
        display: flex;
        justify-content: center;
        align-items: center;
        height: 2.5vw;
        margin-top: -2vw;
        margin-bottom: 0;
      }
 
      /*雨量填充矩形*/
      .rainfall-fill {
        position: absolute;
        left: 0;
        right: 0;
        background: rgba(80, 177, 200, 0.8);
        border-radius: 1.2vw;
        margin: 0 -1vw;
        bottom: -3vw;
        transition: all 0.3s ease;
        z-index: 1;
      }

      /*9日天气部分 雨量标签*/
      .forecast-rainfall {
        background: rgba(80, 177, 200);
        color: white;
        font-size: 1.4vw;
        font-weight: bold;
        height: 2.5vw;
        min-width: 80% ;
        border-radius: 1.2vw;
        width: fit-content;
        box-shadow: 0 1px 3px rgba(0,0,0,0.2);
        padding: 0 0.5vw;
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 2;
      }

      /*9日天气部分 图标*/
      .forecast-icon-container {
        text-align: center;
        position: relative;
      }

      /*9日天气部分 图标*/
      .forecast-icon {
        width: 5vw;
        height: 5vw;
        margin: 0px auto;
        margin-top: 0;
      }

      /*9日天气部分 图标*/
      .forecast-icon img {
        width: 100%;
        height: 100%;
        object-fit: contain;
      }

      /*9日天气部分 风速*/
      .forecast-wind-container {
        grid-row: 4;
        text-align: center;
        position: relative;
        height: 3vw;
        margin-top: -1vw;
      }

      /*9日天气部分 风速*/
      .forecast-wind {
        font-size: 2vw;
        margin-top: 0;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 1.5px;
        height: 3vw;
      }

      /*9日天气部分 风速*/
      .wind-direction {
        font-size: 1.8vw;
      }

      /*9日天气部分 温度曲线 Canvas*/
      .temp-line-canvas {
        position: absolute;
        left: 0;
        width: 100%;
        pointer-events: none;
        z-index: 3;
      }

      .temp-line-canvas-high {
        top: 7.7vw;
        height: 21vw; 
      }

      .temp-line-canvas-low {
        top: 7.7vw;
        height: 21vw; 
      }

      .temp-curve-high {
        position: absolute;
        left: 0;
        right: 0;
        height: 3.5vw;
        border-radius: 0.5vw;
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-size: 2.2vw;
        font-weight: bold;
        text-shadow: 0 1px 2px rgba(0,0,0,0.3);
        z-index: 5;
      }

      .temp-curve-low {
        position: absolute;
        left: 0;
        right: 0;
        height: 3.5vw;
        border-radius: 0.5vw;
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-size: 2.2vw;
        text-shadow: 0 1px 2px rgba(0,0,0,0.3);
        z-index: 4;
      }

      /* 圆点模式样式 */
      .dot-mode .temp-curve-high,
      .dot-mode .temp-curve-low,
      .dot-mode .temp-curve-hourly,
      .dot-mode .temp-curve-minutely {
        width: 1vw;
        height: 1vw;
        border-radius: 50%;
        left: calc(50% - 0.5vw);
        margin-top: -0.65vw;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 2.2vw;
        font-weight: 600;
        text-shadow: 0 1px 2px rgba(0,0,0,0.3);
      }

      .dot-mode .temp-curve-high {
        background: rgba(255, 87, 34);
        z-index: 3;
      }

      .dot-mode .temp-curve-low {
        background: rgba(3, 169, 243);
        z-index: 4;
      }

      .dot-mode .temp-curve-hourly {
        background: rgba(156, 39, 176);
      }

      .dot-mode .temp-curve-minutely {
        background: rgba(76, 175, 80);
      }

      /* 圆点上方的温度文字 */
      .dot-mode .temp-text {
        position: absolute;
        left: 50%;
        transform: translateX(-50%);
        font-size: 2.2vw;
        font-weight: 600;
        white-space: nowrap;
        text-shadow: 0 1px 2px rgba(123, 123, 123, 0.3);
        margin-left: 0.4vw;
      }

      .dot-mode .temp-curve-high .temp-text {
        color: rgba(255, 87, 34);
        top: -3.8vw;
      }

      .dot-mode .temp-curve-low .temp-text {
        color: rgba(3, 169, 243);
        top: 1vw;
      }
      .dot-mode .temp-curve-hourly .temp-text {
        color: rgba(193, 65, 215, 1);
        top: -3.8vw;
      }

      .dot-mode .temp-curve-minutely .temp-text {
        color: rgba(76, 175, 80, 1);
        top: -3.8vw;
      }

      .unavailable {
        display: flex;
        align-items: center;
        justify-content: center;
        height: 0;
        min-height: 0;
        max-height: 0;
        margin: 0;
        padding: 0;
      }

      /*预警图标和文字样式*/
      .warning-icon-text {
        color: #FFA726;
        height: 7vw;
        font-size: 4vw;
        font-weight: bold;
        margin-left: 3vw;
        cursor: pointer;
        transition: transform 0.2s ease;
      }

      .warning-icon-text:hover {
        transform: scale(1.1);
      }

      /*预警详情卡片样式*/
      .warning-details-card {
        position: relative;
        border-radius: 2vw;
        margin-top: 1vw;
        padding: 2vw;
        color: white;
        overflow: hidden;
        backdrop-filter: blur(5px);
        transition: all 0.3s ease;
        animation: slideDown 0.3s ease-out;
      }

      @keyframes slideDown {
        from {
          opacity: 0;
          transform: translateY(-10px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }

      /*预警标题样式*/
      .warning-title-line {
        font-size: 2.5vw;
        font-weight: bold;
        white-space: nowrap;
        height: 8vw;
        line-height: 3.5vw;
        margin-bottom: 0.5vw;
      }

      /*预警文本滚动容器*/
      .warning-text-container1 {
        display: flex;
        width: 97%;
        font-size: 2.2vw;
        line-height: 3vw;
        align-items: center;
        margin: 0.5vw 2vw;
      }

      /*预警文本滚动内容*/
      .warning-text-scroll1 {
        padding-left: 100%;
      }

      /*预警文本滚动容器*/
      .warning-text-container {
        display: flex;
        overflow: hidden;
        white-space: nowrap;
        width: 100%;
        height: 3vw;
        font-size: 2.5vw;
        align-items: center;
        margin-bottom: 1vw;
      }

      /*预警文本滚动内容*/
      .warning-text-scroll {
        display: inline-block;
        padding-left: 100%;
        animation: scroll linear infinite;
      }

      @keyframes scroll {
        0% { transform: translateX(0); }
        100% { transform: translateX(-100%); }
      }

      .update-time { 
        display: flex;
        align-items: flex-end;
        justify-content: start;
        margin-bottom: 1vw;
        margin-top: 2vw;
        margin-left: 1vw;
        font-size: 2vw;
        height: 2vw;
      }

      /*空气质量按钮样式*/
      .toggle-btn-api {
        background: transparent;
        padding: 0;
        border: none;
        font-size: 3vw;
        font-weight: bold;
        cursor: pointer;
        transition: all 0.3s ease;
        margin-left: 1vw;
      }

      /*空气质量详情卡片样式*/
      .aqi-details-card {
        position: relative;
        border-radius: 2vw;
        margin-top: 1vw;
        padding: 2vw;
        overflow: hidden;
        backdrop-filter: blur(5px);
        transition: all 0.3s ease;
        animation: slideDown 0.3s ease-out;
      }

      /*天气指数详情卡片样式*/
      .indices-details-card {
        position: relative;
        border-radius: 2vw;
        margin-top: 1vw;
        padding: 2vw;
        overflow: hidden;
        backdrop-filter: blur(5px);
        transition: all 0.3s ease;
        animation: slideDown 0.3s ease-out;
      }
      .input-container {
        display: flex;
        align-items: center;
        padding: 0;
        height: 100%;
        transition: all 0.3s ease;
      } 
      .input-container.light {
        background-color: rgb(255,255,255);
        color: black;
      }
      .input-container.dark {
        background-color: rgb(50,50,50);
        color: white;
      }
      .icon {
        margin-right: 0.5rem;
        font-size: 1.2rem;
        margin-left: 0.5rem;
      }
      .input-wrapper {
        flex-grow: 1;
        position: relative;
      }
      input {
        width: 100%;
        border: none;
        background: transparent;
        color: inherit;
        font-size: 1rem;
        padding: 0.5rem 0;
        outline: none;
      }
      .placeholder {
        position: absolute;
        left: 0;
        top: 50%;
        transform: translateY(-50%);
        color: gray;
        pointer-events: none;
        transition: all 0.2s ease;
        font-size: 0.9rem;
        opacity: 1;
      }
      input:focus + .placeholder,
      input:not(:placeholder-shown) + .placeholder,
      .placeholder.hidden {
        top: 0;
        transform: translateY(0);
        font-size: 0.7rem;
        opacity: 0;
      }

      .input-gap {
        height: 8px;
        minheight: 8px;
      }

      /* 日出日落容器样式 */
      .sunrise-sunset-wrapper {
        display: flex;
        align-items: center;
        gap: 1vw;
        --icon-primary-color: transparent !important;
      }

      .sunrise-item,
      .sunset-item {
        display: flex;
        align-items: center;
        font-size: 2vw;
        --icon-primary-color: transparent !important;
      }

      .sunrise-icon {
        fill: #FFA726 !important;
        color: #FFA726 !important;
        margin-right: 0.6vw;
        --mdc-icon-size: 2.3vw;
        --icon-primary-color: #FFA726 !important;
      }

      .sunset-icon {
        fill: #FF7043 !important;
        color: #FF7043 !important;
        margin-right: 0.6vw;
        --mdc-icon-size: 2.3vw;
        --icon-primary-color: #FF7043 !important;
      }

      .sunset-time {
        margin-right: 1vw;
      }

    `;
  }

  constructor() {
    super();
    this.mode = '家';
    this.city_entity ='text.set_city';
    this.forecastMode = 'daily'; // 默认显示每日天气
    this.showWarningDetails = false;
    this.showApiInfo = false;
    this.showIndicesDetails = false;
    this.warningTimer = null;
    this.apiTimer = null;
    this.indicesTimer = null;
    this._value = '';
    this._isEditing = false;
    this._pendingSave = false;
    this._forecastToggleState = 0; // 0: daily, 1: hourly, 2: minutely
    this._hasAutoRefreshed = false; // 标记是否已执行自动刷新
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

  _handleClick() {
    const hapticEvent = new Event('haptic', {
      bubbles: true,
      cancelable: false,
      composed: true
    });
    hapticEvent.detail = 'light';
    this.dispatchEvent(hapticEvent);
  }
  
  connectedCallback() {
    super.connectedCallback();
    this._updateEntities();
    // 首次加载时自动刷新
    if (this.config?.auto_refresh_on_load && !this._hasAutoRefreshed) {
      this._hasAutoRefreshed = true;
      setTimeout(() => {
        this._refresh_weather();
      }, 50); // 延迟500ms确保服务调用正常
    }
  }

  updated(changedProperties) {
    super.updated(changedProperties);
    if (changedProperties.has('config') || changedProperties.has('hass')) {
      this._updateEntities();
    }
  }

  _updateEntities() {
    if (!this.hass || !this.config) return;

    this.entity = this.hass.states[this.config.entity];
    this.mode = this.config.mode || 'home';
    this.city_entity =  this.hass.states[this.config.city_entity] || 'text.set_city';
  }

  _getWeatherIcon(condition) {
    const sunState = this.hass?.states['sun.sun']?.state || 'above_horizon';
    const theme = this._evaluateTheme();
    const isDark = theme === 'light';
    const iconPath = XiaoshiWeatherPhoneCard.ICON_PATH;
    const _v = '?v=2';

    // 中文条件映射到英文图标名
    const cn2en = {
      '晴': 'sunny', '少云': 'partlycloudy', '多云': 'cloudy', '阴': 'overcast',
      '小雨': 'light-rain', '中雨': 'moderate-rain', '大雨': 'heavy-rain', '暴雨': 'torrential-rain',
      '阵雨': 'rain-shower', '雷阵雨': 'thunderstorm', '雨': 'rain',
      '小雪': 'light-snow', '中雪': 'moderate-snow', '大雪': 'heavy-snow', '暴雪': 'blizzard',
      '阵雪': 'snow-shower', '雪': 'snow',
      '雨夹雪': 'snowy-rainy', '雨雪天气': 'rain-snow', '冻雨': 'freezing-rain',
      '雾': 'fog', '霾': 'haze', '扬沙': 'sand', '冰雹': 'hail',
      '晴间多云': 'fair', '热': 'hot',
    };
    const enCondition = cn2en[condition] || condition;
    
    const iconMap = {
      'sunny': isDark ?
        (sunState === 'above_horizon' ? `${iconPath}/sunny-day-dark.svg${_v}` : `${iconPath}/sunny-night-dark.svg${_v}`) :
        (sunState === 'above_horizon' ? `${iconPath}/sunny-day.svg${_v}` : `${iconPath}/sunny-night.svg${_v}`),
      'clear-night': isDark ? `${iconPath}/sunny-night-dark.svg${_v}` : `${iconPath}/sunny-night.svg${_v}`,
      'partlycloudy': isDark ?
        (sunState === 'above_horizon' ? `${iconPath}/partlycloudy-day-dark.svg${_v}` : `${iconPath}/partlycloudy-night-dark.svg${_v}`) :
        (sunState === 'above_horizon' ? `${iconPath}/partlycloudy-day.svg${_v}` : `${iconPath}/partlycloudy-night.svg${_v}`),
      'cloudy': isDark ?
        (sunState === 'above_horizon' ? `${iconPath}/cloudy-day-dark.svg${_v}` : `${iconPath}/cloudy-night-dark.svg${_v}`) :
        (sunState === 'above_horizon' ? `${iconPath}/cloudy-day.svg${_v}` : `${iconPath}/cloudy-night.svg${_v}`),
      'overcast': isDark ? `${iconPath}/overcast-dark.svg${_v}` : `${iconPath}/overcast.svg${_v}`,
      'fog': isDark ? `${iconPath}/fog-dark.svg${_v}` : `${iconPath}/fog.svg${_v}`,
      'hail': isDark ? `${iconPath}/hail-dark.svg${_v}` : `${iconPath}/hail.svg${_v}`,
      'lightning': isDark ? `${iconPath}/thunderstorm-dark.svg${_v}` : `${iconPath}/thunderstorm.svg${_v}`,
      'lightning-rainy': isDark ? `${iconPath}/thunderstorm-dark.svg${_v}` : `${iconPath}/thunderstorm.svg${_v}`,
      'pouring': isDark ? `${iconPath}/heavy-rain-dark.svg${_v}` : `${iconPath}/heavy-rain.svg${_v}`,
      'rainy': isDark ? `${iconPath}/light-rain-dark.svg${_v}` : `${iconPath}/light-rain.svg${_v}`,
      'snowy': isDark ? `${iconPath}/light-snow-dark.svg${_v}` : `${iconPath}/light-snow.svg${_v}`,
      'snowy-rainy': isDark ? `${iconPath}/snowy-rainy-dark.svg${_v}` : `${iconPath}/snowy-rainy.svg${_v}`,
      'windy': isDark ? `${iconPath}/windy-dark.svg${_v}` : `${iconPath}/windy.svg${_v}`,
      'windy-variant': isDark ? `${iconPath}/windy-variant-dark.svg${_v}` : `${iconPath}/windy-variant.svg${_v}`,
      'exceptional': isDark ? `${iconPath}/exceptional-dark.svg${_v}` : `${iconPath}/exceptional.svg${_v}`,
    };

    return iconMap[enCondition] || (isDark ? `${iconPath}/${enCondition}-dark.svg${_v}` : `${iconPath}/${enCondition}.svg${_v}`);
  }

  _formatTemperature(temp) {
    if (temp === undefined || temp === null) return '--';
    return temp.toString().includes('.') ? temp : temp;
  }

  _getCityIcon() {
    const icons = {
      '家': '🏠',
      '搜索城市': '🔍',
      '手机定位': '📍'
    };
    return icons[this.mode] || '🏠';
  }

  _getWeekday(date) {
    const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
    const today = new Date();
    
    // 重置时间到午夜，只比较日期
    const resetTime = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
    const targetDate = resetTime(date);
    const todayDate = resetTime(today);
    
    // 计算日期差（毫秒）
    const diffTime = targetDate - todayDate;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    // 根据日期差返回相应的文本
    if (diffDays === -2) {
      return '前天';
    } else if (diffDays === -1) {
      return '昨天';
    } else if (diffDays === 0) {
      return '今天';
    } else if (diffDays === 1) {
      return '明天';
    }  else {
      // 其他日期返回星期几
      return weekdays[date.getDay()];
    }
  }

  _getForecastDays() {
    const columns = this.config?.columns || XiaoshiWeatherPhoneCard.TEMPERATURE_CONSTANTS.FORECAST_COLUMNS;
    if (!this.entity?.attributes?.daily_forecast) return [];
    return this.entity.attributes.daily_forecast.slice(0, columns);
  }

  _getHourlyForecast() {
    if (!this.entity?.attributes?.hourly_forecast) return [];
    return this.entity.attributes.hourly_forecast.slice(0, 24);
  }

  _getMinutelyForecast() {
    if (!this.entity?.attributes?.minutely_forecast) return [];
    return this.entity.attributes.minutely_forecast.slice(0, 24);
  }

  _toggleForecastMode() {
    this._handleClick();
    // 检查是否有分钟天气数据
    const enableMinutelyForecast = this.entity?.attributes?.minutely_forecast && this.entity.attributes.minutely_forecast.length > 0;
    
    if (enableMinutelyForecast) {
      // 有分钟天气数据: daily -> hourly -> minutely -> daily (3种模式循环)
      this._forecastToggleState = (this._forecastToggleState + 1) % 3;
      
      switch(this._forecastToggleState) {
        case 0:
          this.forecastMode = 'daily';
          break;
        case 1:
          this.forecastMode = 'hourly';
          break;
        case 2:
          this.forecastMode = 'minutely';
          break;
      }
    } else {
      // 没有分钟天气数据: daily -> hourly -> daily (2种模式循环)
      this._forecastToggleState = (this._forecastToggleState + 1) % 2;
      
      switch(this._forecastToggleState) {
        case 0:
          this.forecastMode = 'daily';
          break;
        case 1:
          this.forecastMode = 'hourly';
          break;
      }
    }
    this.requestUpdate();
  }

  _toggleWarningDetails() {
    this._handleClick();
    if (this.showWarningDetails ) {
      // 如果当前显示，则隐藏并清除定时器
      this._hideWarningDetails();
    } else {
      // 如果当前隐藏，则显示并设置20秒定时器
      this.showWarningDetails = true;
      this.requestUpdate();
      
      // 清除之前的定时器
      if (this.warningTimer) {
        clearTimeout(this.warningTimer);
      }
      
      // 设置20秒后自动隐藏
      this.warningTimer = setTimeout(() => {
        this._hideWarningDetails();
      }, 20000);
    }

  }

  _hideWarningDetails() {
    this.showWarningDetails = false;
    if (this.warningTimer) {
      clearTimeout(this.warningTimer);
      this.warningTimer = null;
    }
    this.requestUpdate();
  }

  _toggleApiInfo() {
    this._handleClick();
    if (this.showApiInfo ) {
      // 如果当前显示，则隐藏并清除定时器
      this._hideApiDetails();
    } else {
      // 如果当前隐藏，则显示并设置20秒定时器
      this.showApiInfo = true;
      this.requestUpdate();
      
      // 清除之前的定时器
      if (this.apiTimer) {
        clearTimeout(this.apiTimer);
      }
      
      // 设置20秒后自动隐藏
      this.apiTimer = setTimeout(() => {
        this._hideApiDetails();
      }, 40000);
    }
  }

  _hideApiDetails() {
    this.showApiInfo = false;
    if (this.apiTimer) {
      clearTimeout(this.apiTimer);
      this.apiTimer = null;
    }
    this.requestUpdate();
  }

  _toggleIndicesDetails() {
    this._handleClick();
    if (this.showIndicesDetails ) {
      // 如果当前显示，则隐藏并清除定时器
      this._hideIndicesDetails();
    } else {
      // 如果当前隐藏，则显示并设置20秒定时器
      this.showIndicesDetails = true;
      this.requestUpdate();
      
      // 清除之前的定时器
      if (this.indicesTimer) {
        clearTimeout(this.indicesTimer);
      }
      
      // 设置20秒后自动隐藏
      this.indicesTimer = setTimeout(() => {
        this._hideIndicesDetails();
      }, 20000);
    }
  }

  _hideIndicesDetails() {
    this.showIndicesDetails = false;
    if (this.indicesTimer) {
      clearTimeout(this.indicesTimer);
      this.indicesTimer = null;
    }
    this.requestUpdate();
  }

  _formatHourlyTime(datetime) {
    const date = new Date(datetime);
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
  }

  _formatHourlyDate(datetime) {
    const date = new Date(datetime);
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    return `${month}月${day}日`;
  }

  _formatMinutelyTime(datetime) {
    const date = new Date(datetime);
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
  }

  _formatMinutelyDate(datetime) {
    const date = new Date(datetime);
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    return `${month}月${day}日`;
  }


  _getCustomTemperature() {
    if (!this.config?.use_custom_entities || !this.config?.temperature_entity || !this.hass?.states[this.config.temperature_entity]) {
      return null;
    }
    
    const temp = this.hass.states[this.config.temperature_entity].state;
    const tempValue = parseFloat(temp);
    
    if (isNaN(tempValue)) {
      return null;
    }
    
    // 保留1位小数
    return tempValue.toFixed(1);
  }

  _getCustomHumidity() {
    if (!this.config?.use_custom_entities || !this.config?.humidity_entity || !this.hass?.states[this.config.humidity_entity]) {
      return null;
    }
    
    const humidity = this.hass.states[this.config.humidity_entity].state;
    const humidityValue = parseFloat(humidity);
    
    if (isNaN(humidityValue)) {
      return null;
    }
    
    // 保留1位小数
    return humidityValue.toFixed(1);
  }

  _formatSunTime(datetime) {
    if (!datetime) return '';
    
    try {
      const date = new Date(datetime);
      const hours = date.getHours().toString().padStart(2, '0');
      const minutes = date.getMinutes().toString().padStart(2, '0');
      return `${hours}:${minutes}`;
    } catch (error) {
      console.warn('时间格式化错误:', error);
      return datetime;
    }
  }

  _getTemperatureExtremes() {
    let temperatures = [];
    
    if (this.forecastMode === 'daily') {
      const forecastDays = this._getForecastDays();
      if (forecastDays.length === 0) {
        return { minTemp: 0, maxTemp: 0, range: 0 };
      }
      temperatures = forecastDays.flatMap(day => [
        parseFloat(day.native_temp_low) || 0,
        parseFloat(day.native_temperature) || 0
      ]);
    } else if (this.forecastMode === 'hourly') {
      const hourlyForecast = this._getHourlyForecast();
      if (hourlyForecast.length === 0) {
        return { minTemp: 0, maxTemp: 0, range: 0 };
      }
      temperatures = hourlyForecast.map(hour => parseFloat(hour.native_temperature) || 0);
    } else if (this.forecastMode === 'minutely') {
      const minutelyForecast = this._getMinutelyForecast();
      if (minutelyForecast.length === 0) {
        return { minTemp: 0, maxTemp: 0, range: 0 };
      }
      temperatures = minutelyForecast.map(minute => parseFloat(minute.native_temperature) || 0);
    }

    const minTemp = Math.min(...temperatures);
    const maxTemp = Math.max(...temperatures);
    const range = maxTemp - minTemp;
    
    // 检查是否所有温度都相等
    const allEqual = temperatures.every(temp => temp === temperatures[0]);
    
    return { minTemp, maxTemp, range, allEqual };
  }

  _calculateTemperatureBounds(day, extremes) {
    const { minTemp, maxTemp, range } = extremes;
    const highTemp = parseFloat(day.native_temperature) || 0;
    const lowTemp = parseFloat(day.native_temp_low) || 0;
    
    // 使用常量
    const { BUTTON_HEIGHT_VW, CONTAINER_HEIGHT_VW } = XiaoshiWeatherPhoneCard.TEMPERATURE_CONSTANTS;
    
    // 最终分配的区间高度
    const availableHeight = CONTAINER_HEIGHT_VW - BUTTON_HEIGHT_VW;
    
    if (range === 0) {
      return { highTop: 2, lowTop: 10 }; // 默认位置
    }
    
    // 每个温度值对应top位置 = (max-当前温度值) * availableHeight / range
    const unitPosition = availableHeight / range;
    
    // 高温矩形的上边界位置（温度越高，top值越小）
    const highTop = (maxTemp - highTemp) * unitPosition;
    
    // 低温矩形的上边界位置（温度越低，top值越大）
    const lowTop = availableHeight - (lowTemp - minTemp) * unitPosition;
    
    const finalHighTop = Math.max(0, Math.min(highTop, CONTAINER_HEIGHT_VW - BUTTON_HEIGHT_VW));
    const finalLowTop = Math.max(0, Math.min(lowTop, CONTAINER_HEIGHT_VW - BUTTON_HEIGHT_VW));
    
    return { 
      highTop: finalHighTop, 
      lowTop: finalLowTop
    };
  } 

  _generateTemperatureLine(forecastData, extremes, isHigh = true) {
    if (forecastData.length === 0) return { points: [], curveHeight: 0, curveTop: 0 };
    
    const { BUTTON_HEIGHT_VW, FORECAST_COLUMNS } = XiaoshiWeatherPhoneCard.TEMPERATURE_CONSTANTS;
    
    // 动态计算实际列数
    const actualColumns = this.forecastMode === 'daily' ? 
      (this.config?.columns || FORECAST_COLUMNS) : 
      forecastData.length;
    
    let boundsList;
    if (this.forecastMode === 'daily') {
      // 每日天气使用现有的计算方法
      boundsList = forecastData.map(day => this._calculateTemperatureBounds(day, extremes));
    } else {
      // 小时天气和分钟天气只需要一个温度，简化计算
      const { minTemp, maxTemp, range, allEqual } = extremes;
      const { BUTTON_HEIGHT_VW, CONTAINER_HEIGHT_VW } = XiaoshiWeatherPhoneCard.TEMPERATURE_CONSTANTS;
      const availableHeight = CONTAINER_HEIGHT_VW - BUTTON_HEIGHT_VW;
      
      // 如果所有温度相等，将位置设置在中间
      if (allEqual) {
        const middlePosition = availableHeight / 2;
        boundsList = forecastData.map(() => ({
          highTop: middlePosition,
          lowTop: middlePosition
        }));
      } else {
        const unitPosition = range === 0 ? 0 : availableHeight / range;
        boundsList = forecastData.map(item => {
          const temp = parseFloat(item.native_temperature) || 0;
          const topPosition = (maxTemp - temp) * unitPosition;
          return { highTop: topPosition, lowTop: topPosition };
        });
      }
    }
    
    // 计算曲线范围
    let curveTop, curveBottom, curveHeight;
    
    if (this.forecastMode === 'daily') {
      if (isHigh) {
        const highTops = boundsList.map(bounds => bounds.highTop);
        curveTop = Math.min(...highTops);
        curveBottom = Math.max(...highTops) + BUTTON_HEIGHT_VW;
        curveHeight = curveBottom - curveTop;
      } else {
        const lowTops = boundsList.map(bounds => bounds.lowTop);
        curveTop = 0;
        curveBottom = Math.max(...lowTops) + BUTTON_HEIGHT_VW;
        curveHeight = curveBottom - curveTop;
      }
    } else {
      // 小时天气和分钟天气模式
      const tops = boundsList.map(bounds => bounds.highTop);
      const { allEqual } = extremes;
      
      if (allEqual) {
        // 如果所有温度相等，将曲线设置在中间位置，高度为按钮高度
        curveTop = 0; // 所有点都在同一个位置
        curveBottom = curveTop + BUTTON_HEIGHT_VW;
        curveHeight = BUTTON_HEIGHT_VW;
      } else {
        curveTop = Math.min(...tops);
        curveBottom = Math.max(...tops) + BUTTON_HEIGHT_VW;
        curveHeight = curveBottom - curveTop;
      }
    }
    
    const points = forecastData.map((data, index) => {
      const bounds = boundsList[index];
      const topPosition = this.forecastMode === 'daily' ? 
        (isHigh ? bounds.highTop : bounds.lowTop) : 
        bounds.highTop;
      
      // 计算相对于曲线顶部的Y坐标（vw单位），使用矩形中心
      const y = topPosition - curveTop + BUTTON_HEIGHT_VW / 1.7;
      
      // 计算X坐标（百分比）
      const x = (index * 100) / actualColumns + (100 / actualColumns) / 2;
      
      return { x, y };
    });
    
    return { points, curveHeight, curveTop };
  }

  _getInstanceId() {
    if (!this._instanceId) {
      this._instanceId = Math.random().toString(36).substr(2, 9);
    }
    return this._instanceId;
  }

  _generateId() {
    return Math.random().toString(36).substr(2, 9);
  }

  _drawTemperatureCurve(canvasId, points, color, dashedSegmentInfo = null) {

    requestAnimationFrame(() => {
      // 先在shadow DOM中查找，再在document中查找
      let canvas = this.shadowRoot?.getElementById(canvasId) || document.getElementById(canvasId);

      if (!canvas) {
        // 通过类名查找
        const className = canvasId.includes('high') ? 'temp-line-canvas-high' : 'temp-line-canvas-low';
        canvas = this.shadowRoot?.querySelector(`.${className}`) || document.querySelector(`.${className}`);
      }

      if (!canvas) {
        return;
      }

      const ctx = canvas.getContext('2d');
      const rect = canvas.getBoundingClientRect();

      // 设置Canvas实际尺寸
      canvas.width = rect.width *3;
      canvas.height = rect.height *3;

      if (points.length < 2) {
        return;
      }

      // 清除画布
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const { CONTAINER_HEIGHT_VW } = XiaoshiWeatherPhoneCard.TEMPERATURE_CONSTANTS;

      // 转换所有点为Canvas坐标
      const canvasPoints = points.map((point, index) => {
        const x = (point.x / 100) * canvas.width;
        const y = (point.y / CONTAINER_HEIGHT_VW) * canvas.height;
        return { x, y };
      });

      if (canvasPoints.length < 2) {
        // 如果只有两个点，直接画直线
        if (canvasPoints.length === 2) {
          ctx.beginPath();
          ctx.moveTo(canvasPoints[0].x, canvasPoints[0].y);
          ctx.lineTo(canvasPoints[1].x, canvasPoints[1].y);

          // 应用虚线样式（如果有）
          if (dashedSegmentInfo && dashedSegmentInfo.endIndex >= 0) {
            ctx.strokeStyle = color;
            ctx.lineWidth = 6;
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
            ctx.globalAlpha = 0.6;
            ctx.setLineDash([8, 8]);
          } else {
            ctx.strokeStyle = color;
            ctx.lineWidth = 6;
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
            ctx.globalAlpha = 1;
            ctx.setLineDash([]);
          }
          ctx.stroke();
        }
        return;
      }

      // 使用更保守的样条算法，减少曲线过度弯曲
      const tension = 0.2; // 减小张力系数，避免过度弯曲

      // 判断是否需要分两段绘制
      if (dashedSegmentInfo && dashedSegmentInfo.endIndex >= 0 && dashedSegmentInfo.endIndex < canvasPoints.length - 1) {
        // 分割点位于"今天"的中心位置
        const dashedEndIndex = Math.min(dashedSegmentInfo.endIndex, canvasPoints.length - 2);
        const splitX = canvasPoints[dashedEndIndex].x;

        // 第一次绘制：完整的虚线曲线（0.6透明度）
        ctx.save();
        ctx.beginPath();
        ctx.rect(0, 0, splitX, canvas.height);
        ctx.clip();

        ctx.strokeStyle = color;
        ctx.lineWidth = 6;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.globalAlpha = 0.6;
        ctx.setLineDash([8, 8]);

        ctx.beginPath();
        for (let i = 0; i < canvasPoints.length - 1; i++) {
          const p0 = canvasPoints[Math.max(0, i - 1)];
          const p1 = canvasPoints[i];
          const p2 = canvasPoints[i + 1];
          const p3 = canvasPoints[Math.min(canvasPoints.length - 1, i + 2)];

          const dx1 = (p2.x - p0.x) * tension;
          const dy1 = (p2.y - p0.y) * tension;
          const dx2 = (p3.x - p1.x) * tension;
          const dy2 = (p3.y - p1.y) * tension;

          const maxControlDistance = Math.abs(p2.x - p1.x) * 0.3;
          const limitedDy1 = Math.max(-maxControlDistance, Math.min(maxControlDistance, dy1));
          const limitedDy2 = Math.max(-maxControlDistance, Math.min(maxControlDistance, dy2));

          const cp1x = p1.x + dx1;
          const cp1y = p1.y + limitedDy1;
          const cp2x = p2.x - dx2;
          const cp2y = p2.y - limitedDy2;

          if (i === 0) {
            ctx.moveTo(canvasPoints[0].x, canvasPoints[0].y);
          }
          ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, p2.x, p2.y);
        }
        ctx.stroke();
        ctx.restore();

        // 第二次绘制：完整的实线曲线（1.0透明度）
        ctx.save();
        ctx.beginPath();
        ctx.rect(splitX, 0, canvas.width - splitX, canvas.height);
        ctx.clip();

        ctx.strokeStyle = color;
        ctx.lineWidth = 6;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.globalAlpha = 1;
        ctx.setLineDash([]);

        ctx.beginPath();
        for (let i = 0; i < canvasPoints.length - 1; i++) {
          const p0 = canvasPoints[Math.max(0, i - 1)];
          const p1 = canvasPoints[i];
          const p2 = canvasPoints[i + 1];
          const p3 = canvasPoints[Math.min(canvasPoints.length - 1, i + 2)];

          const dx1 = (p2.x - p0.x) * tension;
          const dy1 = (p2.y - p0.y) * tension;
          const dx2 = (p3.x - p1.x) * tension;
          const dy2 = (p3.y - p1.y) * tension;

          const maxControlDistance = Math.abs(p2.x - p1.x) * 0.3;
          const limitedDy1 = Math.max(-maxControlDistance, Math.min(maxControlDistance, dy1));
          const limitedDy2 = Math.max(-maxControlDistance, Math.min(maxControlDistance, dy2));

          const cp1x = p1.x + dx1;
          const cp1y = p1.y + limitedDy1;
          const cp2x = p2.x - dx2;
          const cp2y = p2.y - limitedDy2;

          if (i === 0) {
            ctx.moveTo(canvasPoints[0].x, canvasPoints[0].y);
          }
          ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, p2.x, p2.y);
        }
        ctx.stroke();
        ctx.restore();
      } else {
        // 没有虚线段，正常绘制
        ctx.strokeStyle = color;
        ctx.lineWidth = 6;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.globalAlpha = 1;
        ctx.setLineDash([]);

        // 开始绘制平滑曲线，确保通过所有原始点
        ctx.beginPath();
        for (let i = 0; i < canvasPoints.length - 1; i++) {
          const p0 = canvasPoints[Math.max(0, i - 1)];
          const p1 = canvasPoints[i];
          const p2 = canvasPoints[i + 1];
          const p3 = canvasPoints[Math.min(canvasPoints.length - 1, i + 2)];

          const dx1 = (p2.x - p0.x) * tension;
          const dy1 = (p2.y - p0.y) * tension;
          const dx2 = (p3.x - p1.x) * tension;
          const dy2 = (p3.y - p1.y) * tension;

          const maxControlDistance = Math.abs(p2.x - p1.x) * 0.3;
          const limitedDy1 = Math.max(-maxControlDistance, Math.min(maxControlDistance, dy1));
          const limitedDy2 = Math.max(-maxControlDistance, Math.min(maxControlDistance, dy2));

          const cp1x = p1.x + dx1;
          const cp1y = p1.y + limitedDy1;
          const cp2x = p2.x - dx2;
          const cp2y = p2.y - limitedDy2;

          if (i === 0) {
            ctx.moveTo(canvasPoints[0].x, canvasPoints[0].y);
          }
          ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, p2.x, p2.y);
        }

        ctx.stroke();
      }
    });
  }

  _getWarningColorForLevel(level) {
    if (level == "红色") return "rgb(255,50,50)";
    if (level == "橙色") return "rgb(255,100,0)";
    if (level == "黄色") return "rgb(255,200,0)";
    if (level == "蓝色") return "rgb(50,150,200)";
    if (level == "灰色") {
      return this._evaluateTheme() === 'light' ? 'rgba(50, 50, 50)' : 'rgba(220, 220, 220)';
    }
    
    return "#FFA726"; // 默认颜色
  }

  _getWarningColor(warning) {
    if (!warning || warning.length === 0) return "#FFA726"; // 默认颜色
    
    let level = "";
    const priority = ["红色", "橙色", "黄色", "蓝色","灰色"];
    
    for (let i = 0; i < warning.length; i++) {
      const currentLevel = warning[i].level;
      if (priority.indexOf(currentLevel) < priority.indexOf(level) || level == "") {
        level = currentLevel;
      }
    }
    
    if (level == "红色") return "rgb(255,50,50)";
    if (level == "橙色") return "rgb(255,100,0)";
    if (level == "黄色") return "rgb(255,200,0)";
    if (level == "蓝色") return "rgb(50,150,200)";
    if (level == "灰色") {
      return this._evaluateTheme() === 'light' ? 'rgba(0, 0, 0)' : 'rgba(220, 220, 220)';
    }
    
    return "#FFA726"; // 默认颜色
  }

   _getRelativeTime(updateTime) {
    if (!updateTime || updateTime === '未知时间') {
      return '未知时间';
    }
    
    try {
      // 解析更新时间，支持多种格式
      let updateDate;
      if (updateTime.includes(' ')) {
        // 格式: "2025-12-18 20:28"
        const [datePart, timePart] = updateTime.split(' ');
        updateDate = new Date(`${datePart}T${timePart}:00`);
      } else if (updateTime.includes('T')) {
        // 格式: "2025-12-18T20:28:00"
        updateDate = new Date(updateTime);
      } else {
        return updateTime; // 无法解析，返回原始值
      }
      
      const now = new Date();
      const diffMs = now - updateDate;
      const diffMinutes = Math.floor(diffMs / (1000 * 60));
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
      
      let relativeTime = '';
      if (diffMinutes < 1) {
        relativeTime = '刚刚';
      } else if (diffMinutes < 60) {
        relativeTime = `${diffMinutes}分钟前`;
      } else if (diffHours < 24) {
        relativeTime = `${diffHours}小时前`;
      } else {
        relativeTime = `${diffDays}天前`;
      }
      
      return `数据更新时间：${updateTime} ( ${relativeTime} )`;
    } catch (error) {
      console.warn('时间解析错误:', error);
      return `数据更新时间：${updateTime}`;
    }
  }

   _getAqiCategoryHtml() {
    const category = this.entity.attributes?.aqi?.category;
    if (!category) return '';
    
    let color = '';
    switch(category) {
      case '优':
        color = '#4CAF50'; // 绿色
        break;
      case '良':
        color = '#FFC107'; // 黄色
        break;
      case '轻度污染':
        color = '#FF9800'; // 橙色
        break;
      case '中度污染':
      case '重度污染':
      case '严重污染':
        color = '#F44336'; // 红色
        break;
      default:
        color = '#9E9E9E'; // 灰色（其他未知类别）
    }
    
    return html`<span class="toggle-btn-api" style="color: ${color};">${category}</span>`
  } 

  render() {
    if (this.mode !== "搜索城市" && (!this.entity || this.entity.state === '无搜索城市' || this.entity.state === 'unavailable')) {
      return html`<div class="unavailable"> </div>`;
    }

    else if (this.mode !== "搜索城市" && (this.entity || this.entity.state !== 'unavailable' || this.entity.state !== '无搜索城市')) {
      return this._rendermain();
    }

    else if (this.mode === "搜索城市" && (!this.entity || this.entity.state === 'unavailable' || this.entity.state === '无搜索城市')) {
      return  html`${this._renderInput()}`;
    }

    else if (this.mode === "搜索城市" && (this.entity || this.entity.state !== 'unavailable' || this.entity.state !== '无搜索城市')) {
      return html`${this._rendermain()} <div class="input-gap"> </div> ${this._renderInput()}`;
    }
  }

  _rendermain(){
    // 获取自定义或默认的温度和湿度
    const customTemp = this._getCustomTemperature();
    const customHumidity = this._getCustomHumidity();
    const temperature = customTemp || this._formatTemperature(this.entity.attributes?.temperature);
    const humidity = customHumidity || this._formatTemperature(this.entity.attributes?.humidity);
    const conditionState = this.entity.state || 'unknown';
    const condition = this.entity.attributes?.condition_cn || this.entity.state || '未知';
    const windSpeed = this.entity.attributes?.wind_speed || 0;
    const pressure = this.entity.attributes?.pressure || 0;
    const visibility = this.entity.attributes?.visibility || 0;
    const city = this.entity.attributes?.city || '未知城市';
    const update_time = this.entity.attributes?.update_time || '未知时间';
    const warning = this.entity.attributes?.warning || [];
    const theme = this._evaluateTheme();
    const hasWarning = warning && Array.isArray(warning) && warning.length > 0;
    const hasapi = this.entity.attributes?.aqi && Object.keys(this.entity.attributes.aqi).length > 0;
    const hassairindices = this.entity.attributes?.air_indices && Object.keys(this.entity.attributes.air_indices).length > 0;
    const warningColor = this._getWarningColor(warning);
    const enableHourlyForecast = this.entity.attributes?.hourly_forecast && this.entity.attributes?.hourly_forecast.length > 0;
    const enableMinutelyForecast = this.entity.attributes?.minutely_forecast && this.entity.attributes?.minutely_forecast.length > 0;
    const sunRise = this.entity.attributes?.sun.sunrise || '无';
    const sunSet = this.entity.attributes?.sun.sunset || '无';

    // 获取颜色
    const fgColor = theme === 'light' ? 'rgb(0, 0, 0)' : 'rgb(255, 255, 255)';
    const bgColor = theme === 'light' ? 'rgb(255, 255, 255)' : 'rgb(50, 50, 50)';
    const secondaryColor = theme === 'light' ? 'rgb(110, 190, 240)' : 'rgb(110, 190, 240)';
    const visualStyle = this.config.visual_style || 'button';
    const isDotMode = visualStyle === 'dot';

    return html`
      <div class="weather-card ${theme === 'light' ? 'dark-theme' : ''} ${isDotMode ? 'dot-mode' : ''}" style="background-color: ${bgColor}; color: ${fgColor};">
        <div class="main-content">
          <!-- 天气头部信息 -->
          <div class="weather-header">
            <div class="weather-left">
              <div class="weather-icon">
                <img src="${this._getWeatherIcon(conditionState)}" alt="${condition}">
              </div>
              <div class="weather-details">
                <div class="weather-temperature">
                  ${temperature}<font size="1vw"><b> ℃&ensp;</b></font>
                  ${humidity}<font size="1vw"><b> % </b></font>
                  ${hasWarning ? 
                    html`<span class="warning-icon-text" style="color: ${warningColor}; cursor: pointer; user-select: none;" @click="${() => this._toggleWarningDetails()}">⚠ ${warning.length}</span>` : ''}
                </div>
                <div class="weather-info">
                    <button class="toggle-btn-api" @click="${() => this._toggleApiInfo()}">
                      <span style="color: ${secondaryColor};">${condition}  
                        ${windSpeed}<span style="font-size: 0.6em;">km/h </span>
                        ${pressure}<span style="font-size: 0.6em;">hPa </span>
                        ${visibility}<span style="font-size: 0.6em;">km </span>
                      </span>
                      ${this._getAqiCategoryHtml()}
                    </button>
                </div>
              </div>
            </div>
            <!-- 城市信息 - 放在头部右侧 -->
            <div class="weather-right">
              <div class="city-info">${this._getCityIcon()}${city}</div>

              <div style="display: flex; justify-content: space-between; align-items: center;">
                <!-- 天气指数按钮 -->
                ${this.entity.attributes?.air_indices && this.entity.attributes.air_indices.length > 0 ? html`
                  <div class="forecast-toggle-button">
                    <button class="toggle-btn" style="margin-right: 1vw; background: #2E7D32;" @click="${() => this._toggleIndicesDetails()}">
                      天气指数
                    </button>
                  </div>
                ` : ''}

                <!-- 切换按钮 -->
                ${enableHourlyForecast ? html`
                  <div class="forecast-toggle-button">
                    <button class="toggle-btn ${this.forecastMode === 'daily' ? 'daily-mode' : this.forecastMode === 'hourly' ? 'hourly-mode' : 'minutely-mode'}" @click="${() => this._toggleForecastMode()}">
                      ${this.forecastMode === 'daily' ? '每日天气' : this.forecastMode === 'hourly' ? '小时天气' : '分钟天气'}
                    </button>
                  </div>
                ` : ''}
              </div>
            </div>
          </div>

        <!-- 空气质量详情 -->
        ${this.showApiInfo ? this._renderAqiDetails() : ''}
        <!-- 预报内容 -->
        ${this._renderDailyForecast()}

        </div>
        
        <!-- 预警详情 -->
        ${this.showWarningDetails && hasWarning ? this._renderWarningDetails() : ''}

        <!-- 天气指数详情 -->    
        ${this.showIndicesDetails && hassairindices ? this._renderIndicesDetails() : ''}

        <div class="update-time" style="display: flex; justify-content: space-between; align-items: center;">
          <div>
            ${this._getRelativeTime(update_time)}  
            <button style="margin-left: 0.3vw; color: #04d2f6ff; background: none; border: none; cursor: pointer; font-size: 2.5vw; height: 2.5vw; font-weight: bold; padding: 0;" 
              @click="${() => this._refresh_weather()}">↺
            </button>
          </div>
          
          <!-- 日出日落信息 - 放在右侧 -->
          ${sunRise && sunSet ? html`
            <div class="sunrise-sunset-wrapper">
              <div class="sunrise-item">
                <ha-icon class="sunrise-icon" icon="mdi:weather-sunset-up"></ha-icon>
                <span class="sunrise-time">${sunRise}</span>
              </div>
              <div class="sunset-item">
                <ha-icon class="sunset-icon" icon="mdi:weather-sunset-down"></ha-icon>
                <span class="sunset-time">${sunSet}</span>
              </div>
            </div>
          ` : ''}
        </div>  
      </div>
    `;
  }

  _renderDailyForecast() {
    if (this.forecastMode === 'hourly') {
      return this._renderHourlyForecast();
    }
    if (this.forecastMode === 'minutely') {
      return this._renderMinutelyForecast();
    }

    const forecastDays = this._getForecastDays();
    const extremes = this._getTemperatureExtremes();
    const theme = this._evaluateTheme();
    const secondaryColor = theme === 'light' ? 'rgb(60, 140, 190)' : 'rgb(110, 190, 240)';
    const backgroundColor = theme === 'light' ? 'rgba(120, 120, 120, 0.1)' : 'rgba(255, 255, 255, 0.1)';

    // 生成温度曲线坐标
    const highTempData = this._generateTemperatureLine(forecastDays, extremes, true);
    const lowTempData = this._generateTemperatureLine(forecastDays, extremes, false);

    // 使用组件实例ID + Canvas ID，避免多实例冲突
    const instanceId = this._getInstanceId();
    const highCanvasId = `high-temp-canvas-${instanceId}`;
    const lowCanvasId = `low-temp-canvas-${instanceId}`;

    // 查找"今天"的索引，用于确定虚线段的结束位置（今天的左半部分）
    let todayIndex = -1;
    forecastDays.forEach((day, index) => {
      const date = new Date(day.datetime);
      const weekday = this._getWeekday(date);
      if (weekday === '今天') {
        todayIndex = index;
      }
    });

    // 计算虚线段结束索引（今天的左半部分，即todayIndex）
    const dashedSegmentInfo = { endIndex: todayIndex };

    // 在DOM更新完成后绘制曲线
    this.updateComplete.then(() => {
      setTimeout(() => {
        this._drawTemperatureCurve(highCanvasId, highTempData.points, 'rgb(255, 87, 34)', dashedSegmentInfo);
        this._drawTemperatureCurve(lowCanvasId, lowTempData.points, 'rgb(33, 150, 243)', dashedSegmentInfo);
      }, 50);
    });
    
    const columns = this.config?.columns || XiaoshiWeatherPhoneCard.TEMPERATURE_CONSTANTS.FORECAST_COLUMNS;
    return html`
      <div class="forecast-container" style="grid-template-columns: repeat(${columns}, 1fr);">
        <!-- 最高温度连接线 Canvas -->
        <canvas class="temp-line-canvas temp-line-canvas-high" id="high-temp-canvas-${this._getInstanceId()}"></canvas>
        
        <!-- 最低温度连接线 Canvas -->
        <canvas class="temp-line-canvas temp-line-canvas-low" id="low-temp-canvas-${this._getInstanceId()}"></canvas>
        
        ${forecastDays.map((day, index) => {
          const date = new Date(day.datetime);
          const weekday = this._getWeekday(date);
          const dateStr = `${date.getMonth() + 1}月${date.getDate()}日`;
          const highTemp = this._formatTemperature(day.native_temperature);
          const lowTemp = this._formatTemperature(day.native_temp_low);
          
          // 如果是昨天/前天，设置透明度 
          const isYesterday = weekday !== '昨天' && weekday !== '前天';
          const opacity = isYesterday ? 1 : 0.5;
          const theme = this._evaluateTheme();

          const hightbackground = isYesterday ? 
                'linear-gradient(to bottom,rgba(255, 87, 34) 0%,rgba(255, 152, 0) 100%)':
                theme === 'light' ? 
                'linear-gradient(to bottom,rgb(250, 149, 117) 0%,rgb(250, 188, 97) 100%)':
                'linear-gradient(to bottom,rgb(181, 81, 49) 0%,rgb(181, 120, 28) 100%)';
          const lowbackground = isYesterday ?  
                'linear-gradient(to bottom,rgba(3, 169, 243) 0%,rgba(33, 150, 243) 100%)':
                theme === 'light' ? 
                'linear-gradient(to bottom,rgb(99, 198, 243) 0%,rgb(117, 187, 243)100%)':
                'linear-gradient(to bottom,rgb(30, 130, 174) 0%,rgb(48, 118, 174) 100%)';
                
          const hightcolor = isYesterday ? 'rgba(255, 87, 34)': theme === 'light' ? 'rgb(250, 149, 117)' : 'rgb(181, 81, 49)';
          const lowcolor = isYesterday ? 'rgba(3, 169, 243)': theme === 'light' ? 'rgb(99, 198, 243)' : 'rgb(30, 130, 174)';
 
          // 计算温度矩形的动态边界和高度
          const tempBounds = this._calculateTemperatureBounds(day, extremes);
           
          // 获取雨量信息
          const rainfall = parseFloat(day.native_precipitation) || 0;
          
          // 计算雨量矩形高度和位置
          
          const {CONTAINER_HEIGHT_VW } = XiaoshiWeatherPhoneCard.TEMPERATURE_CONSTANTS;
          const RAINFALL_MAX = 25; // 最大雨量25mm
          const rainfallHeight = Math.min((rainfall / RAINFALL_MAX) * CONTAINER_HEIGHT_VW+4, CONTAINER_HEIGHT_VW+4); // 最大高度21.6vw（到日期下面）

          return html`
            <div class="forecast-day" style="background: ${backgroundColor};">
              <!-- 星期（周X） -->
              <div class="forecast-weekday" style="opacity: ${opacity};">${weekday}</div>
              
              <!-- 日期（mm月dd日） -->
              <div class="forecast-date" style="color: ${secondaryColor}; opacity: ${opacity};">${dateStr}</div>
              
              <!-- 高温（橙色）和 低温（蓝色） -->
              <div class="forecast-temp-container">
                ${this.config.visual_style === 'dot' ? html`
                  <!-- 圆点模式 -->
                  <div class="temp-curve-high" style="top: ${tempBounds.highTop + 1.75}vw">
                    <div class="temp-text" style="color: ${hightcolor};">${highTemp}°</div>
                  </div>
                  <div class="temp-curve-low" style="top: ${tempBounds.lowTop + 1.75}vw">
                    <div class="temp-text" style="color: ${lowcolor};">${lowTemp}°</div>
                  </div>
                ` : html`
                  <!-- 按钮模式 -->
                  <div class="temp-curve-high" style="background: ${hightbackground}; top: ${tempBounds.highTop}vw">
                    ${highTemp}°
                  </div>
                  <div class="temp-curve-low" style="background: ${lowbackground}; top: ${tempBounds.lowTop}vw">
                    ${lowTemp}°
                  </div>
                `}
                
                <!-- 雨量填充矩形 -->
                ${rainfall > 0 ? html`
                  <div class="rainfall-fill" style="height: ${rainfallHeight}vw; opacity: ${0.3 + rainfall / RAINFALL_MAX}"></div>
                ` : ''}
              </div>
              <div class="forecast-temp-null"></div>
            </div>
          `;
        })}
        
        <!-- 雨量标签行 - 10列网格 -->
        ${forecastDays.map(day => {
          const rainfall = parseFloat(day.native_precipitation) || 0;
          return html`
            <div class="forecast-rainfall-container">
              ${rainfall > 0 ? html`
                <div class="forecast-rainfall">
                  ${rainfall}mm
                </div>
              ` : ''}
            </div>
          `;
        })}
        
        <!-- 天气图标行 -->
        ${this._renderWeatherIcons(forecastDays)}
        
        <!-- 风向风级行 -->
        ${this._renderWindInfo(forecastDays)}
      </div>
    `;
  }

  _renderHourlyForecast() {
    const hourlyForecast = this._getHourlyForecast();
    const extremes = this._getTemperatureExtremes();
    const theme = this._evaluateTheme();
    const secondaryColor = theme === 'light' ? 'rgb(60, 140, 190)' : 'rgb(110, 190, 240)';
    const backgroundColor = theme === 'light' ? 'rgba(120, 120, 120, 0.1)' : 'rgba(255, 255, 255, 0.1)';
    
    // 生成温度曲线坐标（小时天气只有一个温度）
    const tempData = this._generateTemperatureLine(hourlyForecast, extremes, true);
    
    // 使用组件实例ID + Canvas ID，避免多实例冲突
    const instanceId = this._getInstanceId();
    const canvasId = `hourly-temp-canvas-${instanceId}`;
    
    // 在DOM更新完成后绘制曲线
    this.updateComplete.then(() => {
      setTimeout(() => {
        this._drawTemperatureCurve(canvasId, tempData.points, 'rgba(156, 39, 176)');
      }, 50);
    });
    
    // 计算实际列数（小时天气可能有更多数据）
    const columns = hourlyForecast.length;
    // 使用与每日天气相同的宽度计算公式：
    // 每列宽度 = (100vw - 8px*2 - (FORECAST_COLUMNS-1)*2px) / FORECAST_COLUMNS
    const FORECAST_COLUMNS = XiaoshiWeatherPhoneCard.TEMPERATURE_CONSTANTS.FORECAST_COLUMNS;
    const columnWidth = 9.6
     
    return html`
      <div class="hourly-forecast-scroll-container">
        <div class="hourly-forecast-container" style="grid-template-columns: repeat(${columns}, ${columnWidth}vw);">
          <!-- 小时温度连接线 Canvas -->
          <canvas class="temp-line-canvas temp-line-canvas-high" id="hourly-temp-canvas-${this._getInstanceId()}"></canvas>
          
          ${hourlyForecast.map((hour, index) => {
            const timeStr = this._formatHourlyTime(hour.datetime);
            const dateStr = this._formatHourlyDate(hour.datetime);
            const temp = this._formatTemperature(hour.native_temperature);
            
            // 获取雨量信息
            const rainfall = parseFloat(hour.native_precipitation) || 0;
            
            // 计算温度位置（简化版）
            const { minTemp, maxTemp, range, allEqual } = extremes;
            const { BUTTON_HEIGHT_VW, CONTAINER_HEIGHT_VW } = XiaoshiWeatherPhoneCard.TEMPERATURE_CONSTANTS;
            const availableHeight = CONTAINER_HEIGHT_VW - BUTTON_HEIGHT_VW;
            
            let finalTopPosition;
            if (allEqual) {
              // 如果所有温度相等，将位置设置在中间
              finalTopPosition = availableHeight / 2;
            } else {
              const unitPosition = range === 0 ? 0 : availableHeight / range;
              const tempValue = parseFloat(hour.native_temperature) || 0;
              const topPosition = (maxTemp - tempValue) * unitPosition;
              finalTopPosition = Math.max(0, Math.min(topPosition, availableHeight));
            }
            
            // 计算雨量矩形高度和位置
            const RAINFALL_MAX = 5; // 最大雨量5mm
            const rainfallHeight = Math.min((rainfall / RAINFALL_MAX) * CONTAINER_HEIGHT_VW+4, CONTAINER_HEIGHT_VW+4); // 最大高度21.6vw（到日期下面）


            return html`
              <div class="forecast-day" style="background: ${backgroundColor};">
                <!-- 时间（hh:mm） -->
                <div class="forecast-weekday">${timeStr}</div>
                
                <!-- 日期（mm月dd日） -->
                <div class="forecast-date" style="color: ${secondaryColor};">${dateStr}</div>
                
                <!-- 温度（紫色） -->
                <div class="forecast-temp-container">
                  ${this.config.visual_style === 'dot' ? html`
                    <!-- 圆点模式 -->
                    <div class="temp-curve-hourly" style="top: ${finalTopPosition + 1.75}vw">
                      <div class="temp-text">${temp}°</div>
                    </div>
                  ` : html`
                    <!-- 按钮模式 -->
                    <div class="temp-curve-hourly" style="top: ${finalTopPosition}vw">
                      ${temp}°
                    </div>
                  `}
                  
                  <!-- 雨量填充矩形 -->
                  ${rainfall > 0 ? html`
                    <div class="rainfall-fill" style="height: ${rainfallHeight}vw; opacity: ${0.3 + rainfall / RAINFALL_MAX}"></div>
                  ` : ''}
                </div>
                <div class="forecast-temp-null"></div>
              </div>
            `;
          })}
          
          <!-- 雨量标签行 -->
          ${hourlyForecast.map(hour => {
            const rainfall = parseFloat(hour.native_precipitation) || 0;
            return html`
              <div class="forecast-rainfall-container">
                ${rainfall > 0 ? html`
                  <div class="forecast-rainfall">
                    ${rainfall}mm
                  </div>
                ` : ''}
              </div>
            `;
          })}
          
          <!-- 天气图标行 -->
          ${this._renderHourlyWeatherIcons(hourlyForecast)}
          
          <!-- 风向风级行 -->
          ${this._renderHourlyWindInfo(hourlyForecast)}
        </div>
      </div>
    `;
  }

  _renderMinutelyForecast() {
    const minutelyForecast = this._getMinutelyForecast();
    const extremes = this._getTemperatureExtremes();
    const theme = this._evaluateTheme();
    const secondaryColor = theme === 'light' ? 'rgb(60, 140, 190)' : 'rgb(110, 190, 240)';
    const backgroundColor = theme === 'light' ? 'rgba(120, 120, 120, 0.1)' : 'rgba(255, 255, 255, 0.1)';
    
    // 生成温度曲线坐标（分钟天气只有一个温度）
    const tempData = this._generateTemperatureLine(minutelyForecast, extremes, true);
    
    // 使用组件实例ID + Canvas ID，避免多实例冲突
    const instanceId = this._getInstanceId();
    const canvasId = `minutely-temp-canvas-${instanceId}`;
    
    // 在DOM更新完成后绘制曲线（绿色）
    this.updateComplete.then(() => {
      setTimeout(() => {
        this._drawTemperatureCurve(canvasId, tempData.points, 'rgba(76, 175, 80)');
      }, 50);
    });
    
    // 计算实际列数（分钟天气可能有更多数据）
    const columns = minutelyForecast.length;
    const columnWidth = 9.6;
     
    return html`
      <div class="hourly-forecast-scroll-container">
        <div class="hourly-forecast-container" style="grid-template-columns: repeat(${columns}, ${columnWidth}vw);">
          <!-- 分钟温度连接线 Canvas -->
          <canvas class="temp-line-canvas temp-line-canvas-high" id="minutely-temp-canvas-${this._getInstanceId()}"></canvas>
          
          ${minutelyForecast.map((minute, index) => {
            const timeStr = this._formatMinutelyTime(minute.datetime);
            const dateStr = this._formatMinutelyDate(minute.datetime);
            const temp = this._formatTemperature(minute.native_temperature);
            
            // 获取雨量信息
            const rainfall = parseFloat(minute.native_precipitation) || 0;
            
            // 计算温度位置（简化版）
            const { minTemp, maxTemp, range, allEqual } = extremes;
            const { BUTTON_HEIGHT_VW, CONTAINER_HEIGHT_VW } = XiaoshiWeatherPhoneCard.TEMPERATURE_CONSTANTS;
            const availableHeight = CONTAINER_HEIGHT_VW - BUTTON_HEIGHT_VW;
            
            let finalTopPosition;
            if (allEqual) {
              // 如果所有温度相等，将位置设置在中间
              finalTopPosition = availableHeight / 2;
            } else {
              const unitPosition = range === 0 ? 0 : availableHeight / range;
              const tempValue = parseFloat(minute.native_temperature) || 0;
              const topPosition = (maxTemp - tempValue) * unitPosition;
              finalTopPosition = Math.max(0, Math.min(topPosition, availableHeight));
            }
            
            // 计算雨量矩形高度和位置
            const RAINFALL_MAX = 1; // 最大雨量1mm
            const rainfallHeight = Math.min((rainfall / RAINFALL_MAX) * CONTAINER_HEIGHT_VW+4, CONTAINER_HEIGHT_VW+4); // 最大高度21.6vw（到日期下面）


            return html`
              <div class="forecast-day" style="background: ${backgroundColor};">
                <!-- 时间（hh:mm） -->
                <div class="forecast-weekday">${timeStr}</div>
                
                <!-- 日期（mm月dd日） -->
                <div class="forecast-date" style="color: ${secondaryColor};">${dateStr}</div>
                
                <!-- 温度（绿色） -->
                <div class="forecast-temp-container">
                  ${this.config.visual_style === 'dot' ? html`
                    <!-- 圆点模式 -->
                    <div class="temp-curve-minutely" style="top: ${finalTopPosition + 1.75}vw">
                      <div class="temp-text">${temp}°</div>
                    </div>
                  ` : html`
                    <!-- 按钮模式 -->
                    <div class="temp-curve-minutely" style="top: ${finalTopPosition}vw">
                      ${temp}°
                    </div>
                  `}
                  
                  <!-- 雨量填充矩形 -->
                  ${rainfall > 0 ? html`
                    <div class="rainfall-fill" style="height: ${rainfallHeight}vw; opacity: ${0.3 + rainfall / RAINFALL_MAX}"></div>
                  ` : ''}
                </div>
                <div class="forecast-temp-null"></div>
              </div>
            `;
          })}
          
          <!-- 雨量标签行 -->
          ${minutelyForecast.map(minute => {
            const rainfall = parseFloat(minute.native_precipitation) || 0;
            return html`
              <div class="forecast-rainfall-container">
                ${rainfall > 0 ? html`
                  <div class="forecast-rainfall">
                    ${rainfall}mm
                  </div>
                ` : ''}
              </div>
            `;
          })}
          
          <!-- 天气图标行 -->
          ${this._renderMinutelyWeatherIcons(minutelyForecast)}
          
          <!-- 风向风级行 -->
          ${this._renderMinutelyWindInfo(minutelyForecast)}
        </div>
      </div>
    `;
  }

  _renderWeatherIcons(forecastDays) {
    return html`
      ${forecastDays.map(day => {
        // 如果是昨天，设置透明度 
        const date = new Date(day.datetime);
        const weekday = this._getWeekday(date);
        const isYesterday = weekday !== '昨天' && weekday !== '前天';
        const opacity = isYesterday ? 1 : 0.5;

        return html`
          <div class="forecast-icon-container" style="opacity: ${opacity}">
            <div class="forecast-icon">
              <img src="${this._getWeatherIcon(day.text)}" alt="${day.text}">
            </div>
          </div>
        `;
      })}
    `;
  }

  _renderHourlyWeatherIcons(hourlyForecast) {
    return html`
      ${hourlyForecast.map(hour => {
        return html`
          <div class="forecast-icon-container">
            <div class="forecast-icon">
              <img src="${this._getWeatherIcon(hour.text)}" alt="${hour.text}">
            </div>
          </div>
        `;
      })}
    `;
  }

  _renderMinutelyWeatherIcons(minutelyForecast) {
    return html`
      ${minutelyForecast.map(minute => {
        return html`
          <div class="forecast-icon-container">
            <div class="forecast-icon">
              <img src="${this._getWeatherIcon(minute.text)}" alt="${minute.text}">
            </div>
          </div>
        `;
      })}
    `;
  }

  _renderWindInfo(forecastDays) {
    const theme = this._evaluateTheme();
    const secondaryColor = theme === 'light' ? 'rgb(10, 90, 140)' : 'rgb(110, 190, 240)';
    return html`
      ${forecastDays.map(day => {
        const windSpeedRaw = day.windscaleday || 0;
        let windSpeed = windSpeedRaw;
        
        // 如果是昨天，设置透明度 
        const date = new Date(day.datetime);
        const weekday = this._getWeekday(date);
        const isYesterday = weekday !== '昨天' && weekday !== '前天';
        const opacity = isYesterday ? 1 : 0.5;

        // 如果风速是 "4-5" 格式，取最大值
        if (typeof windSpeedRaw === 'string' && windSpeedRaw.includes('-')) {
          const speeds = windSpeedRaw.split('-').map(s => parseFloat(s.trim()));
          if (speeds.length === 2 && !isNaN(speeds[0]) && !isNaN(speeds[1])) {
            windSpeed = Math.max(speeds[0], speeds[1]);
          }
        }
        
        const windDirection = day.wind_bearing || 0;
        
        return html`
          <div class="forecast-wind-container" style="opacity: ${opacity}">
            <div class="forecast-wind" style="color: ${secondaryColor};">
              <span class="wind-direction" >${this._getWindDirectionIcon(windDirection)}</span>
              <span>${windSpeed}级</span>
            </div>
          </div>
        `;
      })}
    `;
  }

  _getWindDirectionIcon(bearing) {
    // 0是北风，按顺时针方向增加
    const directions = [
      { range: [337.5, 360], icon: '↑', name: '北' },    // 337.5-360度
      { range: [0, 22.5], icon: '↑', name: '北' },        // 0-22.5度
      { range: [22.5, 67.5], icon: '↗', name: '东北' },    // 22.5-67.5度
      { range: [67.5, 112.5], icon: '→', name: '东' },     // 67.5-112.5度
      { range: [112.5, 157.5], icon: '↘', name: '东南' },   // 112.5-157.5度
      { range: [157.5, 202.5], icon: '↓', name: '南' },     // 157.5-202.5度
      { range: [202.5, 247.5], icon: '↙', name: '西南' },   // 202.5-247.5度
      { range: [247.5, 292.5], icon: '←', name: '西' },     // 247.5-292.5度
      { range: [292.5, 337.5], icon: '↖', name: '西北' }    // 292.5-337.5度
    ];

    const direction = directions.find(dir => {
      if (dir.range[0] <= dir.range[1]) {
        // 正常范围，如 22.5-67.5
        return bearing >= dir.range[0] && bearing < dir.range[1];
      } else if (dir.range[0] === 337.5 && dir.range[1] === 360) {
        // 337.5-360度特殊处理
        return bearing >= dir.range[0] && bearing <= 360;
      } else if (dir.range[0] === 0 && dir.range[1] === 22.5) {
        // 0-22.5度特殊处理
        return bearing >= dir.range[0] && bearing < dir.range[1];
      }
      return false;
    });

    return direction ? direction.icon : '↓';
  }

  _renderHourlyWindInfo(hourlyForecast) {
    const theme = this._evaluateTheme();
    const secondaryColor = theme === 'light' ? 'rgb(10, 90, 140)' : 'rgb(110, 190, 240)';
    return html`
      ${hourlyForecast.map(hour => {
        const windSpeedRaw = hour.windscaleday || 0;
        let windSpeed = windSpeedRaw;
        
        // 如果风速是 "4-5" 格式，取最大值
        if (typeof windSpeedRaw === 'string' && windSpeedRaw.includes('-')) {
          const speeds = windSpeedRaw.split('-').map(s => parseFloat(s.trim()));
          if (speeds.length === 2 && !isNaN(speeds[0]) && !isNaN(speeds[1])) {
            windSpeed = Math.max(speeds[0], speeds[1]);
          }
        }
        
        const windDirection = hour.wind_bearing || 0;
        
        return html`
          <div class="forecast-wind-container">
            <div class="forecast-wind" style="color: ${secondaryColor};">
              <span class="wind-direction">${this._getWindDirectionIcon(windDirection)}</span>
              <span>${windSpeed}级</span>
            </div>
          </div>
        `;
      })}
    `;
  }

  _renderMinutelyWindInfo(minutelyForecast) {
    const theme = this._evaluateTheme();
    const secondaryColor = theme === 'light' ? 'rgb(10, 90, 140)' : 'rgb(110, 190, 240)';
    return html`
      ${minutelyForecast.map(minute => {
        const windSpeedRaw = minute.windscaleday || 0;
        let windSpeed = windSpeedRaw;
        
        // 如果风速是 "4-5" 格式，取最大值
        if (typeof windSpeedRaw === 'string' && windSpeedRaw.includes('-')) {
          const speeds = windSpeedRaw.split('-').map(s => parseFloat(s.trim()));
          if (speeds.length === 2 && !isNaN(speeds[0]) && !isNaN(speeds[1])) {
            windSpeed = Math.max(speeds[0], speeds[1]);
          }
        }
        
        const windDirection = minute.wind_bearing || 0;
        
        return html`
          <div class="forecast-wind-container">
            <div class="forecast-wind" style="color: ${secondaryColor};">
              <span class="wind-direction">${this._getWindDirectionIcon(windDirection)}</span>
              <span>${windSpeed}级</span>
            </div>
          </div>
        `;
      })}
    `;
  }

  _renderWarningDetails() {
    if (!this.showWarningDetails || !this.entity?.attributes?.warning) {
      return '';
    }

    const warning = this.entity.attributes.warning;
    const theme = this._evaluateTheme();
    const textcolor = theme === 'light' ? 'rgba(0, 0, 0)' : 'rgba(255, 255, 255)';
    const backgroundColor = theme === 'light' ? 'rgba(120, 120, 120, 0.1)' : 'rgba(255, 255, 255, 0.1)';
    return html`
      <div class="warning-details-card" style=" background-color: ${backgroundColor};">
        ${warning.map((warningItem, index) => {
          const typeName = warningItem.typeName ?? "";
          const level = warningItem.level ?? "";
          const warningColor = this._getWarningColorForLevel(level);
          const sender = warningItem.sender ?? "";
          const startTime = warningItem.startTime ? warningItem.startTime.slice(0, 10) : "";
          const endTime = warningItem.endTime ? warningItem.endTime.slice(0, 10) : "";
          const text = warningItem.text ?? "";
          const scrollDuration = Math.max(5, text.length * 0.3);

          return html`
            <div style="margin-bottom: 1vw;">
              <!-- 第一行：预警标题 -->
              <div class="warning-title-line" style="color: ${warningColor};">
                ${sender}: 【${typeName}】${level}预警<br>
                预警时间：${startTime}至${endTime}
              </div>
              
              <!-- 第二行：预警文本滚动 -->
              <div class="warning-text-container1" style="color: ${textcolor}; ">
               
                  <span>${text}</span>
               
              </div>
            </div>
          `;
        })}
      </div>
    `;
  }

  _renderAqiDetails() {
    const theme = this._evaluateTheme();
    const textcolor = theme === 'light' ? 'rgba(0, 0, 0)' : 'rgba(255, 255, 255)';
    const backgroundColor = theme === 'light' ? 'rgba(50,50,50, 0.1)' : 'rgba(255, 255, 255, 0.1)';
    const secondaryColor = theme === 'light' ? 'rgba(100, 100, 100, 0.7)' : 'rgba(200, 200, 200, 0.7)';
    const secondaryColorblue = theme === 'light' ? 'rgb(110, 190, 240)' : 'rgb(110, 190, 240)';
    const summary = this.entity?.attributes?.minutely_summary  || ''; 
    const hasminutely = this.entity?.attributes?.minutely_forecast && this.entity.attributes.minutely_forecast.length > 0;
    
    // 获取AQI数值和等级
    const aqi = this.entity?.attributes?.aqi;
    const hasaqi = aqi && aqi.aqi;
    const aqiValue = aqi?.aqi || aqi?.value || 0;
    const category = aqi?.category || '未知';
    const level = aqi?.level || '未知';
    const pm25 = aqi?.pm2p5 || 0;
    const pm10 = aqi?.pm10 || 0;
    const so2 = aqi?.so2 || 0;
    const no2 = aqi?.no2 || 0;
    const co = aqi?.co || 0;
    const o3 = aqi?.o3 || 0;

    // 获取温湿度信息
    const temperature = this._formatTemperature(this.entity.attributes?.temperature);
    const customTemp = this._getCustomTemperature();
    const humidity = this._formatTemperature(this.entity.attributes?.humidity);
    const customHumidity = this._getCustomHumidity();
    const conditionState = this.entity.state || 'unknown';
    const condition = this.entity.attributes?.condition_cn || this.entity.state || '未知';
    const cloud_coverage = this.entity.attributes?.cloud_coverage || 0;
    const windSpeed = this.entity.attributes?.wind_speed || 0;
    const windscale = this.entity.attributes?.windscale || 0;
    const winddir = this.entity.attributes?.winddir || '';
    const visibility = this.entity.attributes?.visibility || 0;
    const feels_like  = this.entity?.attributes?.apparent_temperature || 0;
    const pressure = this.entity?.attributes?.pressure || 0;
    const uv_index = this.entity?.attributes?.daily_forecast[1]?.uv_index || 0;
    
    // 根据等级获取颜色
    const getAqiColor = (category) => {
      switch(category) {
        case '优': return '#4CAF50'; // 绿色
        case '良': return '#FFC107'; // 黄色
        case '轻度污染': return '#FF9800'; // 橙色
        case '中度污染': return '#FF5722'; // 深橙色
        case '重度污染': return '#F44336'; // 红色
        case '严重污染': return '#9C27B0'; // 紫色
        default: return '#9E9E9E'; // 灰色
      }
    };
     
    const aqiColor = getAqiColor(category);

    return html`
      <div class="aqi-details-card" style="background-color: ${backgroundColor}; border-radius: 2vw; padding: 2vw; margin-top: 1.5vw;">
        <!-- 温度湿度信息 -->
        ${summary !== '' ? html`
          <div style="color: ${secondaryColorblue}; font-size: 2.8vw; line-height: 3.5vw; margin-bottom: 1vw;">
            天气概况：${summary}&ensp;&ensp;
          </div>
        `: ''}
        <div style="color: ${secondaryColorblue}; font-size: 2.8vw; line-height: 3.5vw;">
          天气温度：${temperature}<span style="font-size: 0.8em;">℃</span>&ensp;&ensp;
          天气湿度：${humidity}<span style="font-size: 0.8em;">%</span>&ensp;
        </div>
        <div style="color: ${secondaryColorblue}; font-size: 2.8vw; line-height: 3.5vw;">
          体感温度：${feels_like}<span style="font-size: 0.8em;">℃</span>&ensp;&ensp;
        </div>
        <div style="color: ${secondaryColorblue}; font-size: 2.8vw; line-height: 3.5vw;">
          ${customTemp !== null ? html`传感器温度：${customTemp}<span style="font-size: 0.8em">℃</span>&ensp;&ensp;`: ''}
          ${customHumidity !== null ? html`传感器湿度：${customHumidity}<span style="font-size: 0.8em;">%</span>&ensp;`: ''}
        </div>
        
        <div style="color: ${textcolor}; font-size: 2.2vw; line-height: 3.5vw;">
          &emsp;&ensp;风速: ${windSpeed} <span style="font-size: 0.8em;">km/h</span>（${windscale}级 ${winddir}）&ensp;
        </div>
        <div style="color: ${textcolor}; font-size: 2.2vw; line-height: 3.5vw;">
          &emsp;&ensp;气压: ${pressure} <span style="font-size: 0.8em;">hPa</span>&ensp;
        </div>
        <div style="color: ${textcolor}; font-size: 2.2vw; line-height: 3.5vw;">
          &emsp;&ensp;云量: ${cloud_coverage} <span style="font-size: 0.8em;">%</span>&ensp;
        </div>
        <div style="color: ${textcolor}; font-size: 2.2vw; line-height: 3.5vw;">
          &emsp;&ensp;紫外线: ${uv_index} <span style="font-size: 0.8em;">级</span>&ensp;
        </div>
        <div style="color: ${textcolor}; font-size: 2.2vw; line-height: 3.5vw;">
          &emsp;&ensp;能见度: ${visibility} <span style="font-size: 0.8em;">km/h </span>&ensp;
        </div>

        ${this.showApiInfo && hasaqi ? html`
        <!-- AQI信息 -->
        <div style="color: ${textcolor}; font-size: 2.2vw; line-height: 2vw;">
          &emsp;&ensp;
        </div>
        <div style="color: ${textcolor}; font-size: 2.8vw; line-height: 3.5vw;">
          空气质量指数: ${aqiValue}<span style="color: ${aqiColor}">（${level}级 ${category}）</span>&ensp;
        </div>
        <div style="color: ${textcolor}; font-size: 2.2vw; line-height: 3.5vw;">
          &emsp;&ensp;PM2.5: ${pm25} <span style="font-size: 0.8em;">μg/m³</span>&ensp;
        </div>
        <div style="color: ${textcolor}; font-size: 2.2vw; line-height: 3.5vw;">
          &emsp;&ensp;PM10: ${pm10} <span style="font-size: 0.8em;">μg/m³</span>&ensp;
        </div>
        <div style="color: ${textcolor}; font-size: 2.2vw; line-height: 3.5vw;">
          &emsp;&ensp;SO₂: ${so2} <span style="font-size: 0.8em;">μg/m³</span>&ensp;
        </div>
        <div style="color: ${textcolor}; font-size: 2.2vw; line-height: 3.5vw;">
          &emsp;&ensp;NO₂: ${no2} <span style="font-size: 0.8em;">μg/m³</span>&ensp;
        </div>
        <div style="color: ${textcolor}; font-size: 2.2vw; line-height: 3.5vw;">
          &emsp;&ensp;CO: ${co} <span style="font-size: 0.8em;">mg/m³</span>&ensp;
        </div>
        <div style="color: ${textcolor}; font-size: 2.2vw; line-height: 3.5vw;">
          &emsp;&ensp;O₃: ${o3} <span style="font-size: 0.8em;">μg/m³</span>&ensp;
        </div>
        ` : ''}
      </div>
    `;
  }

  _renderIndicesDetails() {
    if (!this.showIndicesDetails || !this.entity?.attributes?.air_indices) {
      return '';
    }

    const indices = this.entity.attributes.air_indices;
    const theme = this._evaluateTheme();
    const textcolor = theme === 'light' ? 'rgba(0, 0, 0)' : 'rgba(255, 255, 255)';
    const textcolor2 = theme === 'light' ? 'rgba(23, 140, 5, 1)' : 'rgba(10, 231, 47, 1)';
    const backgroundColor = theme === 'light' ? 'rgba(120, 120, 120, 0.1)' : 'rgba(255, 255, 255, 0.1)';
    const backgroundColor2 = theme === 'light' ? 'rgba(255, 255, 255)' : 'rgba(50, 50, 50)';

    return html`
      <div class="indices-details-card" style="background-color: ${backgroundColor}; border-radius: 2vw; padding: 2vw; margin-top: 1.5vw;">
        
        <!-- 指数列表 -->
        <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 1vw;">
          ${indices.map(index => html`
            <div style="padding: 1vw; background: ${backgroundColor2}; border-radius: 1vw;">
              <div> 
                <span style="font-size: 2vw; font-weight: bold; color: ${textcolor2}; margin-bottom: 0.2vw;">${index.name} </span>
                <span style="font-size: 1.8vw; color: ${textcolor}; margin-bottom: 0.2vw;"> 等级:${index.level}  ${index.category}</span>
              </div>

              <div style="font-size: 1.5vw; color: ${textcolor}; opacity: 0.8; line-height: 1.4;">${index.text}</div>
            </div>
          `)}
        </div>
      </div>
    `;
  }

  _renderInput(){
    if (!this.config || !this.hass ) return html``;
    const cityEntity = this.city_entity || 'text.set_city';
    const currentValue = this.hass.states[cityEntity].state;
    if (!this._isEditing && this._value !== currentValue) {
      this._value = currentValue;
    }
    const theme = this._evaluateTheme();
    const themeClass = theme === 'dark' ? 'dark' : 'light';
    const showPlaceholder = !this._value && !this._isEditing;

    return html`
      <div class="input-container ${themeClass}" \n
           style="width: ${this.config.width}; height: 12vw ;border-radius: 3vw;">
        <div class="icon">
          <ha-icon icon="mdi:magnify"></ha-icon>
        </div>
        <div class="input-wrapper">
          <input
            type="text"\n
            .value=${this._value}\n
            @input=${this._handleInput}\n
            @keydown=${this._handleKeyDown}\n
            @focus=${() => this._isEditing = true}\n
            @blur=${this._handleBlur}\n
            placeholder=" "
          />
          <div class="placeholder ${!showPlaceholder ? 'hidden' : ''}">等待设置搜索的城市...</div>
        </div>
      </div>
    `;
  }

  _handleInput(e) {
    this._value = e.target.value;
    this._isEditing = true;
  }

  _handleKeyDown(e) {
    if (e.key === 'Enter' && this.city_entity) {
      this._pendingSave = true;
      this._setEntityValue();
      this._isEditing = false;
      e.target.blur();
    }
  }

  _handleBlur() {
    this._isEditing = false;
    if (!this._pendingSave && this.city_entity) {
      this._setEntityValue();
    }
    this._pendingSave = false;
  }

  _setEntityValue() {
    if (!this.city_entity) return;

    this.hass.callService('text', 'set_value', {
      entity_id: this.city_entity,
      value: this._value,
    });

  }

  _refresh_weather() {
    this._handleClick();
    if (!this.config?.entity) return;

    this.hass.callService('qweather', 'update_weather', {
      entity_id: this.config.entity,
    });
  }

  setConfig(config) {
    if (!config.entity) {
      throw new Error('需要指定天气实体');
    }
    this.config = config;
  }

  getCardSize() {
    return 8;
  }
}
customElements.define('xiaoshi-weather-phone-card', XiaoshiWeatherPhoneCard);

class XiaoshiWeatherPhoneButtonEditor extends LitElement {
  static get properties() {
    return {
      hass: { type: Object },
      config: { type: Object },
      _searchTerm: { type: String },
      _filteredEntities: { type: Array },
      _showEntityList: { type: Boolean }
    };
  }

  static get styles() {
    return css`
      .form {
        display: flex;
        flex-direction: column;
        gap: 10px;
        min-height: 500px;
      }
      .form-group {
        display: flex;
        flex-direction: column;
        gap: 5px;
      }
      label {
        font-weight: bold;
      }
      select, input, textarea {
        padding: 8px;
        border: 1px solid #ddd;
        border-radius: 4px;
      }

      .entity-selector {
        position: relative;
      }

      .entity-search-input {
        width: 100%;
        padding: 8px;
        border: 1px solid #ddd;
        border-radius: 4px;
        box-sizing: border-box;
      }

      .entity-dropdown {
        position: absolute;
        top: 100%;
        left: 0;
        right: 0;
        height: 300px;
        overflow-y: auto;
        background: white;
        border: 1px solid #ddd;
        border-radius: 4px;
        box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        z-index: 1000;
        margin-top: 2px;
      }

      .entity-option {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 8px 12px;
        cursor: pointer;
        border-bottom: 1px solid #eee;
      }

      .entity-option:hover {
        background: #f5f5f5;
      }

      .entity-option.selected {
        background: #e3f2fd;
      }

      .entity-info {
        display: flex;
        align-items: center;
        gap: 8px;
        flex: 1;
        justify-content: space-between;
      }

      .entity-details {
        flex: 1;
      }

      .entity-name {
        font-weight: 500;
        font-size: 14px;
        color: #000;
      }

      .entity-id {
        font-size: 12px;
        color: #000;
        font-family: monospace;
      }

      .check-icon {
        color: #4CAF50;
      }

      .no-results {
        padding: 12px;
        text-align: center;
        color: #666;
        font-style: italic;
      }

      .selected-entities {
        margin-top: 8px;
      }

      .selected-label {
        font-size: 12px;
        font-weight: bold;
        margin-bottom: 4px;
        color: #333;
      }

      .selected-entity-config {
        margin-bottom: 8px;
        border: 1px solid #ddd;
        border-radius: 4px;
        padding: 8px;
        background: #f9f9f9;
      }

      .selected-entity {
        display: flex;
        align-items: center;
        gap: 4px;
        margin-bottom: 8px;
        font-size: 12px;
        color: #000;
        justify-content: space-between;
      }

      .remove-btn {
        background: none;
        border: none;
        cursor: pointer;
        padding: 0;
        display: flex;
        align-items: center;
        color: #666;
        margin-left: auto;
      }

      .remove-btn:hover {
        color: rgb(255, 0, 0);
      }

      .checkbox-group {
        display: flex;
        align-items: center;
        gap: 6px;
      }

      .help-text {
        font-size: 0.85em;
        color: #666;
        margin-top: 4px;
      }
    `;
  }

  render() {
    if (!this.hass) return html``;

    return html`
      <div class="form">
        <!-- 天气实体列表 -->
        <div class="form-group">
          <label>天气实体（支持多选，弹出时垂直分布）</label>
          <div class="entity-selector">
            <input
              type="text"
              @input=${this._onEntitySearch}
              @focus=${this._onEntitySearch}
              .value=${this._searchTerm || ''}
              placeholder="搜索天气实体..."
              class="entity-search-input"
            />
            ${this._showEntityList ? html`
              <div class="entity-dropdown">
                ${this._filteredEntities.map(entity => html`
                  <div
                    class="entity-option ${this.config.entities && this.config.entities.some(e => e.entity_id === entity.entity_id) ? 'selected' : ''}"
                    @click=${() => this._toggleEntity(entity.entity_id)}
                  >
                    <div class="entity-info">
                      <div class="entity-details">
                        <div class="entity-name">${entity.attributes.friendly_name || entity.entity_id}</div>
                        <div class="entity-id">${entity.entity_id}</div>
                      </div>
                      <ha-icon icon="${entity.attributes.icon || 'mdi:weather-partly-cloudy'}"></ha-icon>
                    </div>
                    ${this.config.entities && this.config.entities.some(e => e.entity_id === entity.entity_id) ?
                      html`<ha-icon icon="mdi:check" class="check-icon"></ha-icon>` : ''}
                  </div>
                `)}
                ${this._filteredEntities.length === 0 ? html`
                  <div class="no-results">未找到匹配的实体</div>
                ` : ''}
              </div>
            ` : ''}
          </div>
          <div class="selected-entities">
            ${this.config.entities && this.config.entities.length > 0 ? html`
              <div class="selected-label">已选择的天气实体：</div>
              ${this.config.entities.map((entityConfig, index) => {
                const entity = this.hass.states[entityConfig.entity_id];
                return html`
                  <div class="selected-entity-config">
                    <div class="selected-entity">
                      <span>${entity?.attributes.friendly_name || entityConfig.entity_id}</span>
                      <ha-icon icon="${entity?.attributes.icon || 'mdi:weather-partly-cloudy'}"></ha-icon>
                      <button class="remove-btn" @click=${() => this._removeEntity(index)}>
                        <ha-icon icon="mdi:close"></ha-icon>
                      </button>
                    </div>
                    <div style="display: flex; flex-direction: column; gap: 6px; margin-top: 4px;">
                      <!-- 自动更新 -->
                      <div style="display: flex; align-items: center; gap: 6px;">
                        <span style="font-size: 12px; min-width: 80px;color: #000;">自动更新</span>
                        <select style="font-size: 12px; padding: 4px; flex: 1;"
                          @change=${(e) => this._updateEntityParam(index, 'auto_refresh_on_load', e.target.value === 'true')}
                          .value=${String(entityConfig.auto_refresh_on_load || false)}
                        >
                          <option value="false">否（不自动更新）</option>
                          <option value="true">是（打开时自动更新数据）</option>
                        </select>
                      </div>
                      <!-- 视觉样式 -->
                      <div style="display: flex; align-items: center; gap: 6px;">
                        <span style="font-size: 12px; min-width: 80px;color: #000;">视觉样式</span>
                        <select style="font-size: 12px; padding: 4px; flex: 1;"
                          @change=${(e) => this._updateEntityParam(index, 'visual_style', e.target.value)}
                          .value=${entityConfig.visual_style || 'button'}
                        >
                          <option value="button">按钮模式</option>
                          <option value="dot">圆点模式</option>
                        </select>
                      </div>
                      <!-- 预报列数 -->
                      <div style="display: flex; align-items: center; gap: 6px;">
                        <span style="font-size: 12px; min-width: 80px;color: #000;">预报列数</span>
                        <select style="font-size: 12px; padding: 4px; flex: 1;"
                          @change=${(e) => this._updateEntityParam(index, 'columns', parseInt(e.target.value) || 9)}
                          .value=${String(entityConfig.columns || 9)}
                        >
                          <option value="7">7列</option>
                          <option value="8">8列</option>
                          <option value="9">9列</option>
                          <option value="10">10列</option>
                        </select>
                      </div>
                      <!-- 图标模式 -->
                      <div style="display: flex; align-items: center; gap: 6px;">
                        <span style="font-size: 12px; min-width: 80px;color: #000;">图标模式</span>
                        <select style="font-size: 12px; padding: 4px; flex: 1;"
                          @change=${(e) => this._updateEntityParam(index, 'mode', e.target.value)}
                          .value=${entityConfig.mode || '家'}
                        >
                          <option value="家">家</option>
                          <option value="手机定位">手机定位</option>
                          <option value="搜索城市">搜索城市</option>
                        </select>
                      </div>
                      <!-- 是否使用自定义实体替换实时温湿度 -->
                      <div style="display: flex; align-items: center; gap: 6px;">
                        <span style="font-size: 12px; min-width: 80px;color: #000;">替换温湿度</span>
                        <input type="checkbox"
                          .checked=${entityConfig.use_custom_entities === true}
                          @change=${(e) => this._updateEntityParam(index, 'use_custom_entities', e.target.checked)}
                        />
                      </div>
                      ${entityConfig.use_custom_entities ? html`
                        <div style="display: flex; align-items: center; gap: 6px;">
                          <span style="font-size: 12px; min-width: 80px;color: #000;">温度实体</span>
                          <input type="text" style="font-size: 12px; padding: 4px; flex: 1;"
                            .value=${entityConfig.temperature_entity || ''}
                            placeholder="sensor.xxx_temperature"
                            @change=${(e) => this._updateEntityParam(index, 'temperature_entity', e.target.value)}
                          />
                        </div>
                        <div style="display: flex; align-items: center; gap: 6px;">
                          <span style="font-size: 12px; min-width: 80px;color: #000;">湿度实体</span>
                          <input type="text" style="font-size: 12px; padding: 4px; flex: 1;"
                            .value=${entityConfig.humidity_entity || ''}
                            placeholder="sensor.xxx_humidity"
                            @change=${(e) => this._updateEntityParam(index, 'humidity_entity', e.target.value)}
                          />
                        </div>
                      ` : ''}
                    </div>
                  </div>
                `;
              })}
            ` : ''}
          </div>
        </div>

        <!-- 按钮显示哪个实体的数据 -->
        <div class="form-group">
          <label>按钮显示哪个实体的数据</label>
          <select
            @change=${this._entityChanged}
            .value=${this.config.display_entity || (this.config.entities && this.config.entities.length > 0 ? this.config.entities[0].entity_id : '')}
            name="display_entity"
          >
            <option value="">默认（第一个实体）</option>
            ${(this.config.entities || []).map(entityConfig => html`
              <option value="${entityConfig.entity_id}"
                .selected=${this.config.display_entity === entityConfig.entity_id}>
                ${entityConfig.entity_id}
              </option>
            `)}
          </select>
          <div class="help-text">选择按钮上显示哪个实体的天气图标和文字</div>
        </div>

        <!-- 主题 -->
        <div class="form-group">
          <label>主题</label>
          <select
            @change=${this._entityChanged}
            .value=${this.config.theme !== undefined ? this.config.theme : 'system'}
            name="theme"
          >
            <option value="light">浅色主题（白底黑字）</option>
            <option value="dark">深色主题（深灰底白字）</option>
          </select>
        </div>

        <!-- 按钮宽度 -->
        <div class="form-group">
          <label>按钮宽度：默认16.8vw，支持像素(px)和百分比(%)</label>
          <input
            type="text"
            @change=${this._entityChanged}
            .value=${this.config.button_width !== undefined ? this.config.button_width : '16.8vw'}
            name="button_width"
            placeholder="默认16.8vw"
          />
        </div>

        <!-- 按钮高度 -->
        <div class="form-group">
          <label>按钮高度：支持像素(px)、百分比(%)和视窗高度(vh)，默认24px</label>
          <input
            type="text"
            @change=${this._entityChanged}
            .value=${this.config.button_height !== undefined ? this.config.button_height : '24px'}
            name="button_height"
            placeholder="默认24px"
          />
        </div>

        <!-- 按钮文字大小 -->
        <div class="form-group">
          <label>按钮文字大小：支持像素(px)，默认11px</label>
          <input
            type="text"
            @change=${this._entityChanged}
            .value=${this.config.button_font_size !== undefined ? this.config.button_font_size : '11px'}
            name="button_font_size"
            placeholder="默认11px"
          />
        </div>

        <!-- 按钮图标大小 -->
        <div class="form-group">
          <label>按钮图标大小：支持像素(px)，默认18px</label>
          <input
            type="text"
            @change=${this._entityChanged}
            .value=${this.config.button_icon_size !== undefined ? this.config.button_icon_size : '18px'}
            name="button_icon_size"
            placeholder="默认18px"
          />
        </div>

        <!-- 弹窗宽度 -->
        <div class="form-group">
          <label>弹窗宽度：支持像素(px)、百分比(%)和auto，默认auto</label>
          <input
            type="text"
            @change=${this._entityChanged}
            .value=${this.config.popup_width !== undefined ? this.config.popup_width : '95%'}
            name="popup_width"
            placeholder="默认95%"
          />
        </div>

        <!-- 弹窗位置 -->
        <div class="form-group">
          <label>弹窗位置：支持百分比(%)，默认50%居中</label>
          <input
            type="text"
            @change=${this._entityChanged}
            .value=${this.config.popup_top !== undefined ? this.config.popup_top : '20px'}
            name="popup_top"
            placeholder="默认20px"
          />
        </div>

        <!-- 透明背景 -->
        <div class="checkbox-group">
          <input
            type="checkbox"
            class="checkbox-input"
            @change=${this._entityChanged}
            .checked=${this.config.transparent_bg === true}
            name="transparent_bg"
            id="transparent_bg"
          />
          <label for="transparent_bg">透明背景（勾选后按钮背景透明）</label>
        </div>

      </div>
    `;
  }

  _entityChanged(e) {
    const { name, value, type, checked } = e.target;

    let finalValue;
    if (type === 'checkbox') {
      finalValue = checked;
    } else {
      if (name === 'auto_refresh_on_load') {
        finalValue = value === 'true';
      } else if (name === 'columns') {
        finalValue = parseInt(value) || 9;
      } else {
        finalValue = value;
      }
    }

    this.config = {
      ...this.config,
      [name]: finalValue
    };

    this.dispatchEvent(new CustomEvent('config-changed', {
      detail: { config: this.config },
      bubbles: true,
      composed: true
    }));
  }

  _onEntitySearch(e) {
    const searchTerm = e.target.value.toLowerCase();
    this._searchTerm = searchTerm;
    this._showEntityList = true;

    if (!this.hass) return;

    const allEntities = Object.values(this.hass.states);
    this._filteredEntities = allEntities.filter(entity => {
      const entityId = entity.entity_id.toLowerCase();
      const friendlyName = (entity.attributes.friendly_name || '').toLowerCase();
      return (entityId.startsWith('weather.') || entityId.includes('weather')) &&
        (entityId.includes(searchTerm) || friendlyName.includes(searchTerm));
    }).slice(0, 50);

    this.requestUpdate();
  }

  _toggleEntity(entityId) {
    const currentEntities = this.config.entities || [];
    let newEntities;

    if (currentEntities.some(e => e.entity_id === entityId)) {
      newEntities = currentEntities.filter(e => e.entity_id !== entityId);
    } else {
      newEntities = [...currentEntities, { entity_id: entityId }];
    }

    this.config = {
      ...this.config,
      entities: newEntities
    };

    this.dispatchEvent(new CustomEvent('config-changed', {
      detail: { config: this.config },
      bubbles: true,
      composed: true
    }));

    this.requestUpdate();
  }

  _removeEntity(index) {
    const currentEntities = this.config.entities || [];
    const newEntities = currentEntities.filter((_, i) => i !== index);

    this.config = {
      ...this.config,
      entities: newEntities
    };

    this.dispatchEvent(new CustomEvent('config-changed', {
      detail: { config: this.config },
      bubbles: true,
      composed: true
    }));

    this.requestUpdate();
  }

  _updateEntityParam(index, paramName, value) {
    const currentEntities = this.config.entities || [];
    const newEntities = [...currentEntities];
    if (newEntities[index]) {
      newEntities[index] = {
        ...newEntities[index],
        [paramName]: value
      };
      // 清理自定义实体相关参数
      if (paramName === 'use_custom_entities' && !value) {
        delete newEntities[index].temperature_entity;
        delete newEntities[index].humidity_entity;
      }
    }

    this.config = {
      ...this.config,
      entities: newEntities
    };

    this.dispatchEvent(new CustomEvent('config-changed', {
      detail: { config: this.config },
      bubbles: true,
      composed: true
    }));

    this.requestUpdate();
  }

  firstUpdated() {
    document.addEventListener('click', (e) => {
      if (!e.target.closest('.entity-selector')) {
        this._showEntityList = false;
        this.requestUpdate();
      }
    });
  }

  constructor() {
    super();
    this._searchTerm = '';
    this._filteredEntities = [];
    this._showEntityList = false;
  }

  setConfig(config) {
    this.config = config;
  }
}
customElements.define('xiaoshi-weather-phone-button-editor', XiaoshiWeatherPhoneButtonEditor);

class XiaoshiWeatherPhoneButton extends LitElement {
  static get properties() {
    return {
      hass: Object,
      config: Object,
      theme: { type: String }
    };
  }

  static get ICON_PATH() {
    return '/xiaoshi/weather-icon';
  }

  static get styles() {
    return css`
      :host {
        display: block;
        width: var(--card-width, 100%);
      }

      .weather-button {
        width: var(--button-width, 16.8vw);
        height: var(--button-height, 24px);
        padding: 0;
        margin: 0;
        background: var(--bg-color, #fff);
        color: var(--fg-color, #000);
        border-radius: 10px;
        font-size: var(--button-font-size, 11px);
        font-weight: 500;
        text-align: center;
        box-sizing: border-box;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 2px;
        cursor: none;
        transition: background-color 0.2s, transform 0.1s;
        position: relative;
        overflow: hidden;
      }
      .weather-button:active {
        transform: scale(0.95);
        box-shadow: 0 2px 12px rgba(255, 255, 255, 0.4), 0 2px 8px rgba(0, 0, 0, 0.4);
      }

      .weather-button-icon {
        width: var(--button-icon-size, 18px);
        height: var(--button-icon-size, 18px);
        flex-shrink: 0;
        object-fit: contain;
      }

      .weather-button-text {
        white-space: nowrap;
        overflow: visible;
        text-overflow: ellipsis;
        line-height: 1.2;
        min-width: 2.5em;
        text-align: center;
      }
      .weather-button-text sup {
        position: relative;
        top: -0.3em;
      }
    `;
  }

  constructor() {
    super();
    this.theme = 'system';
  }

  static getConfigElement() {
    return document.createElement("xiaoshi-weather-phone-button-editor");
  }

  setConfig(config) {
    this.config = {
      ...config
    };
    if (config.button_width) {
      this.style.setProperty('--button-width', config.button_width);
    } else {
      this.style.setProperty('--button-width', '16.8vw');
    }
    if (config.button_height) {
      this.style.setProperty('--button-height', config.button_height);
    } else {
      this.style.setProperty('--button-height', '24px');
    }
    if (config.button_font_size) {
      this.style.setProperty('--button-font-size', config.button_font_size);
    } else {
      this.style.setProperty('--button-font-size', '11px');
    }
    if (config.button_icon_size) {
      this.style.setProperty('--button-icon-size', config.button_icon_size);
    } else {
      this.style.setProperty('--button-icon-size', '18px');
    }
    if (config.theme) {
      this.setAttribute('theme', config.theme);
    }
  }

  connectedCallback() {
    super.connectedCallback();
    this.setAttribute('theme', this._evaluateTheme());
  }

  disconnectedCallback() {
    super.disconnectedCallback();
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

  _getWeatherIcon(condition) {
    const sunState = this.hass?.states['sun.sun']?.state || 'above_horizon';
    const theme = this._evaluateTheme();
    const isDark = theme === 'light';
    const iconPath = XiaoshiWeatherPhoneButton.ICON_PATH;
    const _v = '?v=2';

    // 中文条件映射到英文图标名
    const cn2en = {
      '晴': 'sunny', '少云': 'partlycloudy', '多云': 'cloudy', '阴': 'overcast',
      '小雨': 'light-rain', '中雨': 'moderate-rain', '大雨': 'heavy-rain', '暴雨': 'torrential-rain',
      '阵雨': 'rain-shower', '雷阵雨': 'thunderstorm', '雨': 'rain',
      '小雪': 'light-snow', '中雪': 'moderate-snow', '大雪': 'heavy-snow', '暴雪': 'blizzard',
      '阵雪': 'snow-shower', '雪': 'snow',
      '雨夹雪': 'snowy-rainy', '雨雪天气': 'rain-snow', '冻雨': 'freezing-rain',
      '雾': 'fog', '霾': 'haze', '扬沙': 'sand', '冰雹': 'hail',
      '晴间多云': 'fair', '热': 'hot',
    };
    const enCondition = cn2en[condition] || condition;

    const iconMap = {
      'sunny': isDark ?
        (sunState === 'above_horizon' ? `${iconPath}/sunny-day-dark.svg${_v}` : `${iconPath}/sunny-night-dark.svg${_v}`) :
        (sunState === 'above_horizon' ? `${iconPath}/sunny-day.svg${_v}` : `${iconPath}/sunny-night.svg${_v}`),
      'clear-night': isDark ? `${iconPath}/sunny-night-dark.svg${_v}` : `${iconPath}/sunny-night.svg${_v}`,
      'partlycloudy': isDark ?
        (sunState === 'above_horizon' ? `${iconPath}/partlycloudy-day-dark.svg${_v}` : `${iconPath}/partlycloudy-night-dark.svg${_v}`) :
        (sunState === 'above_horizon' ? `${iconPath}/partlycloudy-day.svg${_v}` : `${iconPath}/partlycloudy-night.svg${_v}`),
      'cloudy': isDark ?
        (sunState === 'above_horizon' ? `${iconPath}/cloudy-day-dark.svg${_v}` : `${iconPath}/cloudy-night-dark.svg${_v}`) :
        (sunState === 'above_horizon' ? `${iconPath}/cloudy-day.svg${_v}` : `${iconPath}/cloudy-night.svg${_v}`),
      'overcast': isDark ? `${iconPath}/overcast-dark.svg${_v}` : `${iconPath}/overcast.svg${_v}`,
      'fog': isDark ? `${iconPath}/fog-dark.svg${_v}` : `${iconPath}/fog.svg${_v}`,
      'hail': isDark ? `${iconPath}/hail-dark.svg${_v}` : `${iconPath}/hail.svg${_v}`,
      'lightning': isDark ? `${iconPath}/thunderstorm-dark.svg${_v}` : `${iconPath}/thunderstorm.svg${_v}`,
      'lightning-rainy': isDark ? `${iconPath}/thunderstorm-dark.svg${_v}` : `${iconPath}/thunderstorm.svg${_v}`,
      'pouring': isDark ? `${iconPath}/heavy-rain-dark.svg${_v}` : `${iconPath}/heavy-rain.svg${_v}`,
      'rainy': isDark ? `${iconPath}/light-rain-dark.svg${_v}` : `${iconPath}/light-rain.svg${_v}`,
      'snowy': isDark ? `${iconPath}/light-snow-dark.svg${_v}` : `${iconPath}/light-snow.svg${_v}`,
      'snowy-rainy': isDark ? `${iconPath}/snowy-rainy-dark.svg${_v}` : `${iconPath}/snowy-rainy.svg${_v}`,
      'windy': isDark ? `${iconPath}/windy-dark.svg${_v}` : `${iconPath}/windy.svg${_v}`,
      'windy-variant': isDark ? `${iconPath}/windy-variant-dark.svg${_v}` : `${iconPath}/windy-variant.svg${_v}`,
      'exceptional': isDark ? `${iconPath}/exceptional-dark.svg${_v}` : `${iconPath}/exceptional.svg${_v}`,
    };

    return iconMap[enCondition] || (isDark ? `${iconPath}/${enCondition}-dark.svg${_v}` : `${iconPath}/${enCondition}.svg${_v}`);
  }

  _getWarningColorForLevel(level) {
    if (level === "红色") return "rgb(255,50,50)";
    if (level === "橙色") return "rgb(255,100,0)";
    if (level === "黄色") return "rgb(255,200,0)";
    if (level === "蓝色") return "rgb(50,150,200)";
    if (level === "灰色") {
      return this._evaluateTheme() === 'light' ? 'rgba(50, 50, 50)' : 'rgba(220, 220, 220)';
    }
    return "#FFA726";
  }

  _getWarningColor(warning) {
    if (!warning || warning.length === 0) return null;

    let level = "";
    const priority = ["红色", "橙色", "黄色", "蓝色", "灰色"];

    for (let i = 0; i < warning.length; i++) {
      const currentLevel = warning[i].level;
      if (priority.indexOf(currentLevel) < priority.indexOf(level) || level === "") {
        level = currentLevel;
      }
    }

    return this._getWarningColorForLevel(level);
  }

  _handleClick() {
    const hapticEvent = new Event('haptic', {
      bubbles: true,
      cancelable: false,
      composed: true
    });
    hapticEvent.detail = 'light';
    this.dispatchEvent(hapticEvent);
  }

  _evaluateTemplate(template) {
    if (!template || typeof template !== 'string') return template;
    if (template.includes('[[[') && template.includes(']]]')) {
      try {
        const match = template.match(/\[\[\[\s*([\s\S]*?)\s*\]\]\]/);
        if (match && match[1]) {
          const code = match[1].trim();
          const hass = this.hass;
          const states = hass?.states || {};
          const user = hass?.user || {};
          const func = new Function('hass', 'states', 'user', code);
          return func(hass, states, user);
        }
      } catch(e) {
        return template;
      }
    }
    return template;
  }

  _getDisplayEntity() {
    const entities = this.config.entities || [];
    if (entities.length === 0) return null;

    const rawDisplayEntityId = this.config.display_entity || entities[0].entity_id;
    const entityId = this._evaluateTemplate(rawDisplayEntityId);
    return this.hass?.states[entityId] || null;
  }

  render() {
    if (!this.hass) return html``;

    const theme = this._evaluateTheme();
    const fgColor = theme === 'light' ? 'rgb(0, 0, 0)' : 'rgb(255, 255, 255)';
    const transparentBg = this.config.transparent_bg === true;
    const buttonBgColor = transparentBg ? 'transparent' : (theme === 'light' ? 'rgb(255, 255, 255, 0.6)' : 'rgb(83, 83, 83, 0.6)');

    const displayEntity = this._getDisplayEntity();
    if (!displayEntity) {
      return html`
        <div class="weather-button" style="--bg-color: ${buttonBgColor}; --fg-color: ${fgColor};" @click=${this._handleButtonClick}>
          <span class="weather-button-text" style="color: ${fgColor};">未配置</span>
        </div>
      `;
    }

    const conditionState = displayEntity.state || 'unknown';
    const condition = displayEntity.attributes?.condition_cn || displayEntity.state || '未知';
    const warning = displayEntity.attributes?.warning || [];
    const hasWarning = warning && Array.isArray(warning) && warning.length > 0;

    // 天气文字颜色按主题走
    const textColor = fgColor;

    // 预警条数及颜色
    const warningCount = hasWarning ? warning.length : 0;
    const warningColor = hasWarning ? this._getWarningColor(warning) : '';

    // 天气图标
    const iconSrc = this._getWeatherIcon(conditionState);

    return html`
      <div class="weather-button" style="--bg-color: ${buttonBgColor}; --fg-color: ${textColor};" @click=${this._handleButtonClick}>
        <img class="weather-button-icon" src="${iconSrc}" alt="${condition}" />
        <span class="weather-button-text" style="color: ${textColor};">${condition}${warningCount > 0 ? html` <sup style="color: ${warningColor}; font-size: 0.7em; vertical-align: super; line-height: 0;">⚠${warningCount}</sup>` : ''}</span>
      </div>
    `;
  }

  _handleButtonClick() {
    this._handleClick();

    const entities = this.config.entities || [];
    if (entities.length === 0) return;

    const cards = [];

    // 为每个实体创建一个天气卡片，使用每个实体各自的参数
    entities.forEach(entityConfig => {
      const rawEntityId = entityConfig.entity_id;
      // 支持 [[[ ]]] 模板语法解析 entity_id
      const entityId = this._evaluateTemplate(rawEntityId);

      // 构建天气卡片配置，排除按钮专用参数和实体级参数
      const excludedParams = ['type', 'button_height', 'button_width', 'button_font_size',
        'button_icon_size', 'popup_top', 'popup_width', 'transparent_bg',
        'entities', 'display_entity',
        'auto_refresh_on_load', 'visual_style', 'columns', 'mode',
        'use_custom_entities', 'temperature_entity', 'humidity_entity'];

      const weatherCardConfig = { entity: entityId };
      Object.keys(this.config).forEach(key => {
        if (!excludedParams.includes(key)) {
          weatherCardConfig[key] = this.config[key];
        }
      });

      // 合并每个实体自己的参数（覆盖全局参数）
      if (entityConfig.auto_refresh_on_load !== undefined) weatherCardConfig.auto_refresh_on_load = entityConfig.auto_refresh_on_load;
      if (entityConfig.visual_style !== undefined) weatherCardConfig.visual_style = entityConfig.visual_style;
      if (entityConfig.columns !== undefined) weatherCardConfig.columns = entityConfig.columns;
      if (entityConfig.mode !== undefined) weatherCardConfig.mode = entityConfig.mode;
      if (entityConfig.use_custom_entities !== undefined) weatherCardConfig.use_custom_entities = entityConfig.use_custom_entities;
      if (entityConfig.temperature_entity) weatherCardConfig.temperature_entity = entityConfig.temperature_entity;
      if (entityConfig.humidity_entity) weatherCardConfig.humidity_entity = entityConfig.humidity_entity;

      cards.push({
        type: 'custom:xiaoshi-weather-phone-card',
        ...weatherCardConfig
      });
    });

    const serviceData = { card: cards };
    const popupWidth = this.config.popup_width || '95%';
    const popupTop = this.config.popup_top || '20px';
    if (popupWidth !== '95%') serviceData.popup_width = popupWidth;
    if (popupTop !== '20px') serviceData.popup_top = popupTop;
    serviceData.background = 'transparent';
    this.hass.callService('popup_card', 'show', serviceData);
  }

  getCardSize() {
    return 1;
  }
}
customElements.define('xiaoshi-weather-phone-button', XiaoshiWeatherPhoneButton);

window.customCards = window.customCards || [];
window.customCards.push(
  {
    type: 'xiaoshi-weather-phone-button',
    name: '消逝天气按钮卡片',
    description: '消逝天气按钮卡片，点击弹出天气详情',
    preview: true
  },
  {
    type: "xiaoshi-weather-phone-card",
    name: "消逝天气卡片（手机端）",
    preview: true
  }
);
