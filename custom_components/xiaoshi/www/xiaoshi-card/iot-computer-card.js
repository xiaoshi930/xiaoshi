import { LitElement, html, css } from "https://unpkg.com/lit-element@2.4.0/lit-element.js?module";

window.customCards = window.customCards || [];
window.customCards.push({
    type: 'xiaoshi-iot-computer-card',
    name: '消逝卡(B移动端)-电脑卡(IOTLink软件)',
    description: '移动端电脑卡(IOTLink软件)'
});

// ==================== 编辑器 ====================
class XiaoshiIOTComputerCardEditor extends LitElement {
  static get properties() {
    return {
      hass: { type: Object },
      config: { type: Object },
      _searchTerm: { type: String },
      _filteredEntities: { type: Array },
      _activeEntityKey: { type: String },
    };
  }

  setConfig(config) {
    this.config = config || {};
  }

  firstUpdated() {
    document.addEventListener('click', (e) => {
      if (!e.target.closest('.entity-selector')) {
        this._activeEntityKey = '';
        this.requestUpdate();
      }
    });
  }

  _onEntitySearch(e, key, filterPrefix) {
    const searchTerm = e.target.value.toLowerCase();
    this._searchTerm = searchTerm;
    this._activeEntityKey = key;
    if (!this.hass) return;
    const allEntities = Object.values(this.hass.states);
    this._filteredEntities = allEntities.filter(entity => {
      const entityId = entity.entity_id.toLowerCase();
      const friendlyName = (entity.attributes.friendly_name || '').toLowerCase();
      const matchesFilter = !filterPrefix || entityId.startsWith(filterPrefix.toLowerCase());
      const matchesSearch = entityId.includes(searchTerm) || friendlyName.includes(searchTerm);
      return matchesFilter && matchesSearch;
    }).slice(0, 50);
    this.requestUpdate();
  }

  _selectEntity(entityId, key) {
    this.config = { ...this.config, [key]: entityId };
    this._searchTerm = '';
    this._activeEntityKey = '';
    this._fireEvent();
    this.requestUpdate();
  }

  _removeEntity(key) {
    const newConfig = { ...this.config };
    delete newConfig[key];
    this.config = newConfig;
    this._fireEvent();
    this.requestUpdate();
  }

  _fireEvent() {
    this.dispatchEvent(new CustomEvent('config-changed', {
      detail: { config: this.config }
    }));
  }

  static get styles() {
    return css`
      .form { display: flex; flex-direction: column; gap: 8px; }
      .form-group { display: flex; align-items: center; gap: 8px; }
      label { font-weight: bold; font-size: 10px; white-space: nowrap; min-width: 9em; max-width: 9em; width: 9em; }
      .help-text { font-size: 10px; color: #666; margin-top: 4px; }

      .entity-selector { position: relative; }
      .entity-search-input {
        width: 100%; padding: 8px; border: 1px solid #ddd;
        border-radius: 4px; box-sizing: border-box; font-size: 11px;
      }
      .entity-dropdown {
        position: absolute; top: 100%; left: 0; right: 0;
        height: 80px; overflow-y: auto; background: white;
        border: 1px solid #ddd; border-radius: 4px;
        box-shadow: 0 2px 8px rgba(0,0,0,0.1); z-index: 1000; margin-top: 2px;
      }
      .entity-option {
        display: flex; align-items: center; justify-content: space-between;
        padding: 8px 10px; cursor: pointer; border-bottom: 1px solid #eee;
      }
      .entity-option:hover { background: #f5f5f5; }
      .entity-info { display: flex; align-items: center; gap: 8px; flex: 1; }
      .entity-name { font-weight: 500; font-size: 14px; color: #000; }
      .entity-id { font-size: 10px; color: #666; font-family: monospace; }
      .no-results { padding: 10px; text-align: center; color: #666; font-style: italic; }

      .entity-selector-with-remove { display: flex; align-items: center; gap: 8px; flex: 1; min-width: 0; }
      .entity-selector-with-remove .entity-selector { flex: 1; min-width: 0; }
      .remove-button {
        background: #f44336; color: white; border: none; border-radius: 4px;
        width: 30px; height: 30px; min-width: 30px; padding: 0;
        display: flex; align-items: center; justify-content: center;
        cursor: pointer; flex-shrink: 0; margin-top: 0;
      }
      .remove-button:hover { background: #d32f2f; }
      .form-group select { padding: 8px; border: 1px solid #ddd; border-radius: 4px; box-sizing: border-box; flex: 1; }
    `;
  }

  render() {
    if (!this.hass) return html``;

    return html`
      <div class="form">
        <div class="form-group">
          <label>主题</label>
          <select
            @change=${(e) => { this.config = { ...this.config, theme: e.target.value }; this._fireEvent(); }}
            .value=${this.config.theme !== undefined ? this.config.theme : 'system'}
          >
            <option value="system">跟随系统</option>
            <option value="light">浅色主题</option>
            <option value="dark">深色主题</option>
            <option value="sun">跟随日出日落</option>
          </select>
        </div>

        <div class="form-group">
          <label>卡片宽度</label>
          <input
            type="text"
            @change=${(e) => { this.config = { ...this.config, width: e.target.value }; this._fireEvent(); }}
            .value=${this.config.width || '100%'}
            placeholder="默认100%"
            class="entity-search-input"
          />
        </div>

        <div class="form-group">
          <label>电源开关实体</label>
          <div class="entity-selector-with-remove">
            <div class="entity-selector">
              <input
                type="text"
                @input=${(e) => this._onEntitySearch(e, 'entity', 'switch.')}
                @focus=${(e) => this._onEntitySearch(e, 'entity', 'switch.')}
                .value=${this.config.entity || ''}
                placeholder="搜索开关实体..."
                class="entity-search-input"
              />
              ${this._activeEntityKey === 'entity' && this._searchTerm ? html`
                <div class="entity-dropdown">
                  ${this._filteredEntities.map(entity => html`
                    <div class="entity-option" @click=${() => this._selectEntity(entity.entity_id, 'entity')}>
                      <div class="entity-info">
                        <ha-icon icon="${entity.attributes.icon || 'mdi:help-circle'}"></ha-icon>
                        <div>
                          <div class="entity-name">${entity.attributes.friendly_name || entity.entity_id}</div>
                          <div class="entity-id">${entity.entity_id}</div>
                        </div>
                      </div>
                    </div>
                  `)}
                  ${this._filteredEntities.length === 0 ? html`<div class="no-results">未找到匹配的实体</div>` : ''}
                </div>
              ` : ''}
            </div>
            ${this.config.entity ? html`
              <button class="remove-button" @click=${() => this._removeEntity('entity')} title="移除">
                <ha-icon icon="mdi:close"></ha-icon>
              </button>
            ` : ''}
          </div>
        </div>

        <div class="form-group">
          <label>计算机名称</label>
          <input
            type="text"
            @change=${(e) => { this.config = { ...this.config, computer_name: e.target.value }; this._fireEvent(); }}
            .value=${this.config.computer_name || ''}
            placeholder="例如: ZHANGQIANG-PC"
            class="entity-search-input"
          />
        </div>

        <div class="form-group">
          <label>启用网络0</label>
          <input
            type="checkbox"
            @change=${(e) => { this.config = { ...this.config, show_network_0: e.target.checked }; this._fireEvent(); }}
            .checked=${this.config.show_network_0 !== false}
          />
        </div>
        <div class="form-group">
          <label>启用网络1</label>
          <input
            type="checkbox"
            @change=${(e) => { this.config = { ...this.config, show_network_1: e.target.checked }; this._fireEvent(); }}
            .checked=${this.config.show_network_1 !== false}
          />
        </div>
        <div class="form-group">
          <label>显示屏幕截图</label>
          <input
            type="checkbox"
            @change=${(e) => { this.config = { ...this.config, show_screenshot: e.target.checked }; this._fireEvent(); }}
            .checked=${this.config.show_screenshot !== false}
          />
        </div>

        <div class="form-group">
          <label>睡眠命令</label>
          <div class="entity-selector-with-remove">
            <div class="entity-selector">
              <input
                type="text"
                @input=${(e) => this._onEntitySearch(e, 'sleep_command', 'shell_command.')}
                @focus=${(e) => this._onEntitySearch(e, 'sleep_command', 'shell_command.')}
                .value=${this.config.sleep_command || ''}
                placeholder="搜索 shell_command 实体..."
                class="entity-search-input"
              />
              ${this._activeEntityKey === 'sleep_command' && this._searchTerm ? html`
                <div class="entity-dropdown">
                  ${this._filteredEntities.map(entity => html`
                    <div class="entity-option" @click=${() => this._selectEntity(entity.entity_id, 'sleep_command')}>
                      <div class="entity-info">
                        <ha-icon icon="${entity.attributes.icon || 'mdi:help-circle'}"></ha-icon>
                        <div>
                          <div class="entity-name">${entity.attributes.friendly_name || entity.entity_id}</div>
                          <div class="entity-id">${entity.entity_id}</div>
                        </div>
                      </div>
                    </div>
                  `)}
                  ${this._filteredEntities.length === 0 ? html`<div class="no-results">未找到匹配的 shell_command 实体</div>` : ''}
                </div>
              ` : ''}
            </div>
            ${this.config.sleep_command ? html`
              <button class="remove-button" @click=${() => this._removeEntity('sleep_command')} title="移除">
                <ha-icon icon="mdi:close"></ha-icon>
              </button>
            ` : ''}
          </div>
        </div>

        <div class="help-text">输入计算机名称后，卡片将自动查找该电脑的所有 IOTLink 实体（CPU、内存、磁盘、网络、屏幕截图）。命名规则参考 IOTLink 软件生成的实体。</div>
      </div>
    `;
  }

  constructor() {
    super();
    this._searchTerm = '';
    this._filteredEntities = [];
    this._activeEntityKey = '';
  }
}
customElements.define('xiaoshi-iot-computer-card-editor', XiaoshiIOTComputerCardEditor);

// ==================== 主卡片 ====================
class XiaoshiIOTComputerCard extends LitElement {
  static get properties() {
    return {
      hass: { type: Object },
      width: { type: String, attribute: true },
      config: { type: Object },
      theme: { type: String },
    };
  }

  static getConfigElement() {
    return document.createElement("xiaoshi-iot-computer-card-editor");
  }

  static getStubConfig() {
    return {
      entity: "",
      theme: "system",
      width: "100%",
      computer_name: "",
      show_network_0: true,
      show_network_1: true,
      show_screenshot: true,
      sleep_command: "",
    };
  }

  static get styles() {
    return css`
      :host { display: block; }

      .card {
        position: relative;
        border-radius: 12px;
        overflow: hidden;
        box-sizing: border-box;
        padding: 8px;
      }

      .card-body {
        position: relative;
        z-index: 1;
        display: flex;
        flex-direction: column;
        gap: 8px;
      }

      /* ---- 卡片两列布局 ---- */
      .cards-row {
        display: flex;
        flex-wrap: wrap;
        gap: 6px;
      }
      .cards-row > .info-card,
      .cards-row > .screenshot-card {
        flex: 1 1 calc(50% - 3px);
        min-width: 0;
      }
      .disk-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
      }
      .disk-label {
        font-size: 11px;
        font-weight: bold;
      }
      .disk-format {
        font-size: 9px;
        opacity: 0.6;
      }
      .disk-bar-bg {
        width: 100%;
        height: 8px;
        background: var(--bar-bg);
        border-radius: 4px;
        overflow: hidden;
      }
      .disk-bar-fill {
        height: 100%;
        border-radius: 4px;
        transition: width 0.4s ease;
      }
      .disk-usage-pct {
        font-size: 11px;
        font-weight: bold;
        text-align: right;
      }
      .disk-details {
        font-size: 9px;
        opacity: 0.7;
        line-height: 1.6;
      }

      .info-card {
        min-width: 0;
        background: var(--card-bg);
        border-radius: 10px;
        padding: 8px;
        box-sizing: border-box;
        position: relative;
        overflow: hidden;
      }
      .screenshot-card {
        flex: 1;
        min-width: 0;
        max-width: 50%;
        background: var(--card-bg);
        border-radius: 10px;
        overflow: hidden;
        margin-top: 4px;
      }
      .info-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 4px;
        font-size: 11px;
        font-weight: bold;
        opacity: 0.8;
      }
      .info-header-left {
        display: flex;
        align-items: center;
        gap: 4px;
      }
      .info-value {
        font-size: 14px;
        font-weight: bold;
      }
      .info-sub {
        font-size: 9px;
        opacity: 0.6;
      }
      .info-chart-container {
        width: 100%;
        height: 40px;
        margin-bottom: -8px;
        overflow: hidden;
        pointer-events: none;
      }
      .screenshot-img {
        width: 100%;
        border-radius: 6px;
        cursor: pointer;
      }

      /* ---- 电源按钮 ---- */
      /* ---- 标题栏 ---- */
      .title-row {
        display: flex;
        align-items: center;
        justify-content: space-between;
        font-size: 13px;
        font-weight: bold;
      }
      .title-status {
        font-size: 10px;
        padding: 2px 8px;
        border-radius: 10px;
      }
      .title-status.on { background: #4CAF50; color: #fff; }
      .title-status.off { background: #888; color: #fff; }

      .power-row {
        display: flex;
        gap: 8px;
      }
      .power-btn {
        flex: 1;
        height: 40px;
        border: none;
        border-radius: 10px;
        font-size: 14px;
        font-weight: bold;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 6px;
        transition: all 0.2s ease;
      }
      .power-btn.on {
        background: #4caf50;
        color: #fff;
      }
      .power-btn.off {
        background: #f44336;
        color: #fff;
      }
      .power-btn.sleep {
        background: #FF9800;
        color: #fff;
      }
      .power-btn:active { transform: scale(0.96); opacity: 0.85; }

      .no-data {
        text-align: center;
        padding: 12px;
        opacity: 0.5;
        font-size: 12px;
      }

      ha-icon { --mdc-icon-size: 18px; }
    `;
  }

  constructor() {
    super();
    this.hass = {};
    this.config = {};
    this.theme = 'system';
    this.width = '100%';
    this.cpuData = [];
    this.memoryData = [];
    this.networkData = {};
    this._discovered = null;
  }

  setConfig(config) {
    this.config = config;
    if (config.width !== undefined) this.width = config.width;
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
        if (typeof window.theme === 'function') return window.theme() || 'light';
        return 'light';
      }
      return mode;
    } catch (e) { return 'light'; }
  }

  _convertToPrefix(computerName) {
    return computerName.replace(/-/g, '_').toLowerCase();
  }

  _discoverEntities() {
    if (!this.config.computer_name || !this.hass || !this.hass.states) return null;
    const prefix = this._convertToPrefix(this.config.computer_name);
    const allStates = this.hass.states;
    const allIds = Object.keys(allStates);

    // --- 磁盘 ---
    const drives = {};
    for (const eid of allIds) {
      const m = eid.match(new RegExp(`^sensor\\.${prefix}_harddrive_${prefix}_storage_([a-z])_(.+)$`));
      if (m) {
        const drive = m[1].toUpperCase();
        const metric = m[2];
        if (!drives[drive]) drives[drive] = {};
        drives[drive][metric] = eid;
      }
    }

    // --- 网络 ---
    const networks = {};
    for (const eid of allIds) {
      const m = eid.match(new RegExp(`^sensor\\.${prefix}_networkinfo_${prefix}_network_([0-9]+)_(.+)$`));
      if (m) {
        const idx = m[1];
        const metric = m[2];
        if (!networks[idx]) networks[idx] = {};
        networks[idx][metric] = eid;
      }
    }
    // --- CPU ---
    let cpuEntity = null;
    for (const eid of allIds) {
      if (eid.startsWith(`sensor.${prefix}_`) && eid.includes('cpu')) {
        const st = allStates[eid];
        if (st && !isNaN(parseFloat(st.state))) { cpuEntity = eid; break; }
      }
    }

    // --- 内存 ---
    let memoryEntity = null;
    for (const eid of allIds) {
      if (eid.startsWith(`sensor.${prefix}_`) && (eid.includes('memory') || eid.includes('_mem_'))) {
        const st = allStates[eid];
        if (st && !isNaN(parseFloat(st.state))) { memoryEntity = eid; break; }
      }
    }

    // --- 截图 ---
    let screenshotEntity = null;
    for (const eid of allIds) {
      if (eid.startsWith(`camera.${prefix}_display_screenshot`)) {
        screenshotEntity = eid; break;
      }
    }

    return {
      prefix,
      drives,
      networks,
      cpuEntity,
      memoryEntity,
      screenshotEntity,
    };
  }

  _isBadState(state) {
    return !state || state === 'unknown' || state === 'unavailable';
  }

  _getEntityValue(entityId) {
    if (!entityId || !this.hass.states[entityId]) return undefined;
    const state = this.hass.states[entityId].state;
    if (this._isBadState(state)) return undefined;
    const v = parseFloat(state);
    return isNaN(v) ? undefined : v;
  }

  _getEntityStateStr(entityId) {
    if (!entityId || !this.hass.states[entityId]) return '';
    const state = this.hass.states[entityId].state;
    return this._isBadState(state) ? '' : state;
  }

  // ===== 历史数据 =====
  async _fetchHistoryData() {
    const d = this._discovered;
    if (!d) return;
    const entityIds = [];
    if (d.cpuEntity) entityIds.push(d.cpuEntity);
    if (d.memoryEntity) entityIds.push(d.memoryEntity);
    if (entityIds.length === 0) return;

    try {
      const now = new Date();
      const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      const result = await this.hass.callWS({
        type: 'history/history_during_period',
        start_time: yesterday.toISOString(),
        end_time: now.toISOString(),
        entity_ids: entityIds,
        significant_changes_only: false,
        minimal_response: true,
        no_attributes: true
      });

      if (d.cpuEntity && result?.[d.cpuEntity]?.length) {
        this.cpuData = result[d.cpuEntity]
          .filter(e => !isNaN(parseFloat(e.s)))
          .map(e => parseFloat(e.s));
      }
      if (d.memoryEntity && result?.[d.memoryEntity]?.length) {
        this.memoryData = result[d.memoryEntity]
          .filter(e => !isNaN(parseFloat(e.s)))
          .map(e => parseFloat(e.s));
      }
      this.networkData = {};
    } catch (e) {
      // 静默处理
    }
  }

  // ===== Canvas 曲线 =====
  _drawChart(canvas, data, strokeColor, fillColor) {
    if (!canvas || !data || data.length === 0) return;
    const container = canvas.parentElement;
    if (!container) return;
    const scale = window.devicePixelRatio || 1;
    const w = container.clientWidth;
    const h = container.clientHeight;
    canvas.style.width = `${w}px`;
    canvas.style.height = `${h}px`;
    canvas.width = Math.floor(w * scale);
    canvas.height = Math.floor(h * scale);
    const ctx = canvas.getContext('2d');
    ctx.scale(scale, scale);
    ctx.clearRect(0, 0, w, h);

    const minV = Math.min(...data);
    const maxV = Math.max(...data);
    const range = Math.max(maxV - minV, 1);
    const xStep = data.length > 1 ? w / (data.length - 1) : w;

    // 填充
    ctx.beginPath();
    ctx.moveTo(0, h - ((data[0] - minV) / range * h));
    for (let i = 1; i < data.length; i++) {
      ctx.lineTo(i * xStep, h - ((data[i] - minV) / range * h));
    }
    ctx.lineTo((data.length - 1) * xStep, h);
    ctx.lineTo(0, h);
    ctx.closePath();
    ctx.fillStyle = fillColor;
    ctx.fill();

    // 线条
    ctx.beginPath();
    ctx.moveTo(0, h - ((data[0] - minV) / range * h));
    for (let i = 1; i < data.length; i++) {
      ctx.lineTo(i * xStep, h - ((data[i] - minV) / range * h));
    }
    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = 1;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    ctx.stroke();
  }

  async firstUpdated() {
    await this._fetchAndDraw();
  }

  async updated(changedProperties) {
    if (changedProperties.has('hass') || changedProperties.has('config')) {
      await this._fetchAndDraw();
    }
  }

  async _fetchAndDraw() {
    this._discovered = this._discoverEntities();
    await this._fetchHistoryData();
    this.requestUpdate();
    await this.updateComplete;
    this._drawAllCharts();
  }

  _drawAllCharts() {
    const d = this._discovered;
    if (!d) return;

    const cpuCanvas = this.shadowRoot?.querySelector('#cpu-chart');
    if (cpuCanvas && this.cpuData.length > 0) {
      this._drawChart(cpuCanvas, this.cpuData, '#00BCD4', 'rgba(0,188,212,0.15)');
    }
    const memCanvas = this.shadowRoot?.querySelector('#memory-chart');
    if (memCanvas && this.memoryData.length > 0) {
      this._drawChart(memCanvas, this.memoryData, '#9C27B0', 'rgba(156,39,176,0.15)');
    }

  }

  _getUsageColor(pct) {
    if (pct === undefined || isNaN(pct)) return '#aaa';
    if (pct >= 90) return '#f44336';
    if (pct >= 70) return '#FF9800';
    return '#4CAF50';
  }

  _getFreeColor(pct) {
    if (pct === undefined || isNaN(pct)) return '#aaa';
    if (pct <= 10) return '#f44336';   // 剩余少 → 红色
    if (pct <= 30) return '#FF9800';   // 剩余中等 → 橙色
    return '#4CAF50';                   // 剩余充足 → 绿色
  }

  _formatDiskSize(value, entityId) {
    if (value === undefined || isNaN(value)) return '-- GB';
    // 读取实体 unit_of_measurement 判断单位
    const entity = entityId ? this.hass.states[entityId] : null;
    const unit = (entity?.attributes?.unit_of_measurement || '').toUpperCase();
    // 已是 GB/TB 则直接展示（取整）
    if (unit === 'GB' || unit === 'GIB') return Math.round(value) + ' GB';
    if (unit === 'TB' || unit === 'TIB') return value.toFixed(1) + ' TB';
    if (unit === 'MB' || unit === 'MIB') return Math.round(value) + ' MB';
    // 没有单位或为 B/bytes，视为原始字节数
    if (!unit || unit === 'B' || unit === 'BYTES') {
      const gb = value / (1024 * 1024 * 1024);
      if (gb >= 1000) return (gb / 1024).toFixed(1) + ' TB';
      return Math.round(gb) + ' GB';
    }
    // 其他情况，假设就是 GB
    return Math.round(value) + ' GB';
  }

  _formatSpeed(mbps) {
    if (mbps === undefined || isNaN(mbps)) return '--';
    if (mbps >= 1000) return (mbps / 1000).toFixed(1) + ' Gbps';
    return mbps.toFixed(0) + ' Mbps';
  }

  _renderDisks(d, theme) {
    const drives = d.drives || {};
    const driveKeys = Object.keys(drives).sort();
    if (driveKeys.length === 0) return html`<div class="no-data">未发现磁盘实体</div>`;

    return driveKeys.map(drive => {
          const m = drives[drive];
          const usage = this._getEntityValue(m.usage);
          const free = this._getEntityValue(m.available_free_space);
          const total = this._getEntityValue(m.total_storage);
          const freePct = (free !== undefined && total !== undefined && total > 0)
            ? Math.round((free / total) * 100) : undefined;
          const color = this._getFreeColor(freePct);
          const label = this._getEntityStateStr(m.label) || '本地磁盘';

          return html`
            <div class="info-card" style="--card-bg: ${theme === 'light' ? '#f5f5f5' : '#3a3a3a'}; color: inherit;">
              <div class="info-header">
                <span class="info-header-left">
                  <ha-icon icon="mdi:harddisk" style="color: ${color};"></ha-icon>
                  <span>${label} (${drive}:)</span>
                </span>
                <span class="info-value" style="color: ${color};">${freePct !== undefined ? freePct + '%' : '--%'}</span>
              </div>
              <div class="disk-bar-bg" style="--bar-bg: ${theme === 'light' ? '#e0e0e0' : '#555'}; margin-top: 2px;">
                <div class="disk-bar-fill" style="width: ${usage !== undefined ? usage : 0}%; background: ${color};"></div>
              </div>
              <div class="info-sub">可用 ${this._formatDiskSize(free, m.available_free_space)} / 总共 ${this._formatDiskSize(total, m.total_storage)}</div>
            </div>
          `;
        });
  }

  _renderCpuCard(d, theme) {
    const value = this._getEntityValue(d.cpuEntity);
    const color = '#00BCD4';
    return html`
      <div class="info-card" style="--card-bg: ${theme === 'light' ? '#f5f5f5' : '#3a3a3a'}; color: inherit;">
        <div class="info-header">
          <span class="info-header-left">
            <ha-icon icon="mdi:cpu-64-bit" style="color: ${color};"></ha-icon>
            <span>CPU</span>
          </span>
          <span class="info-value" style="color: ${color};">${value !== undefined ? Math.round(value) + '%' : '--%'}</span>
        </div>
        <div class="info-chart-container">
          <canvas id="cpu-chart"></canvas>
        </div>
      </div>
    `;
  }

  _renderMemoryCard(d, theme) {
    const value = this._getEntityValue(d.memoryEntity);
    const color = '#9C27B0';
    return html`
      <div class="info-card" style="--card-bg: ${theme === 'light' ? '#f5f5f5' : '#3a3a3a'}; color: inherit;">
        <div class="info-header">
          <span class="info-header-left">
            <ha-icon icon="mdi:memory" style="color: ${color};"></ha-icon>
            <span>内存</span>
          </span>
          <span class="info-value" style="color: ${color};">${value !== undefined ? Math.round(value) + '%' : '--%'}</span>
        </div>
        <div class="info-chart-container">
          <canvas id="memory-chart"></canvas>
        </div>
      </div>
    `;
  }

  _renderNetworks(d, theme) {
    const networks = d.networks || {};
    let netKeys = Object.keys(networks).sort();
    // 根据配置过滤启用的网络适配器
    netKeys = netKeys.filter(idx => {
      if (idx === '0') return this.config.show_network_0 !== false;
      if (idx === '1') return this.config.show_network_1 !== false;
      return true; // 其他索引默认显示
    });
    if (netKeys.length === 0) return '';

    const formatBps = (bps) => {
      if (bps === undefined || isNaN(bps)) return '--';
      if (bps >= 1000000) return (bps / 1000000).toFixed(1) + ' MB/s';
      if (bps >= 1000) return (bps / 1000).toFixed(0) + ' KB/s';
      return bps.toFixed(0) + ' B/s';
    };
    const color = '#FF9800';

    return html`
      <div class="info-card" style="--card-bg: ${theme === 'light' ? '#f5f5f5' : '#3a3a3a'}; color: inherit;">
        <div class="info-header">
          <span class="info-header-left">
            <ha-icon icon="mdi:lan" style="color: ${color};"></ha-icon>
            <span>网络</span>
          </span>
        </div>
        ${netKeys.map(idx => {
          const nw = networks[idx];
          const speed = this._getEntityValue(nw.speed);
          const bpsRecv = this._getEntityValue(nw.bps_received);
          const bpsSent = this._getEntityValue(nw.bps_sent);
          return html`
            <div style="margin-top: 4px;">
              <div class="info-header" style="opacity: 1;">
                <span class="info-header-left" style="font-size: 11px; font-weight: bold;">
                  <span>网卡${Number(idx) + 1}</span>
                </span>
                <span class="info-value" style="font-size: 12px; color: ${color};">${speed !== undefined ? this._formatSpeed(speed) : '--'}</span>
              </div>
              <div class="info-sub">↑ ${formatBps(bpsSent)} &nbsp; ↓ ${formatBps(bpsRecv)}</div>
            </div>
          `;
        })}
      </div>
    `;
  }

  _renderScreenshotCard(d, theme) {
    if (!d.screenshotEntity) return html``;

    const entity = this.hass.states[d.screenshotEntity];
    const imgSrc = entity?.attributes?.entity_picture || '';

    return html`
      <div class="screenshot-card" style="--card-bg: ${theme === 'light' ? '#f5f5f5' : '#3a3a3a'}; color: inherit; display: flex; flex-direction: column;">
        <div class="info-header">
          <span class="info-header-left">
            <ha-icon icon="mdi:monitor-screenshot"></ha-icon>
            <span>屏幕截图</span>
          </span>
        </div>
        ${imgSrc ? html`
          <img class="screenshot-img" src="${imgSrc}" alt="屏幕截图"
               @click=${() => this._openScreenshot(imgSrc)} />
        ` : html`<div class="no-data" style="padding:12px;">等待截图...</div>`}
      </div>
    `;
  }

  _openScreenshot(src) {
    this._handleClick();
    const overlay = document.createElement('div');
    overlay.style.cssText = `
      position: fixed; top: 0; left: 0; right: 0; bottom: 0;
      background: rgba(0,0,0,0.85); z-index: 9999;
      display: flex; align-items: center; justify-content: center;
      cursor: pointer;
    `;
    overlay.addEventListener('click', () => overlay.remove());
    const img = document.createElement('img');
    img.src = src;
    img.style.cssText = 'max-width: 95vw; max-height: 95vh; border-radius: 8px; object-fit: contain;';
    overlay.appendChild(img);
    document.body.appendChild(overlay);
  }

  render() {
    if (!this.hass) return html``;

    const d = this._discovered;
    if (!d) return html`<div class="no-data">请配置计算机名称以发现实体</div>`;

    // entity 可选，未配置时不显示开关机按钮
    const entity = this.config.entity ? this.hass.states[this.config.entity] : null;
    const isOn = entity ? entity.state === 'on' : false;
    const hasEntity = !!this.config.entity && !!entity;

    const theme = this._evaluateTheme();
    const fgColor = theme === 'light' ? 'rgb(0, 0, 0)' : 'rgb(255, 255, 255)';
    const bgColor = theme === 'light' ? 'rgb(255, 255, 255)' : 'rgb(50, 50, 50)';
    const pcName = this.config.computer_name || entity?.attributes?.friendly_name || '电脑';

    return html`
      <div class="card" style="width: ${this.width}; background: ${bgColor}; color: ${fgColor};">
        <div class="card-body">
          <!-- 标题栏 -->
          <div class="title-row">
            <span>${pcName}${hasEntity ? (isOn ? '：开机' : '：关机') : ''}</span>
          </div>

          <!-- 卡片区: CPU / 内存 / 磁盘 / 网络 / 截图 (每排2个) -->
          <div class="cards-row">
            ${this._renderCpuCard(d, theme)}
            ${this._renderMemoryCard(d, theme)}
            ${this._renderDisks(d, theme)}
            ${this._renderNetworks(d, theme)}
            ${this.config.show_screenshot !== false ? this._renderScreenshotCard(d, theme) : ''}
          </div>

          <!-- 第三排: 开关机按钮（仅在配置了 entity 时渲染） -->
          ${hasEntity ? html`
          <div class="power-row">
            <button class="power-btn on"
              @click=${this._turnOn}
              style="opacity: ${isOn ? '0.5' : '1'};"
              ?disabled=${isOn}>
              <ha-icon icon="mdi:power"></ha-icon> 开机
            </button>
            <button class="power-btn off"
              @click=${this._turnOff}
              style="opacity: ${!isOn ? '0.5' : '1'};"
              ?disabled=${!isOn}>
              <ha-icon icon="mdi:power-off"></ha-icon> 关机
            </button>
            ${this.config.sleep_command ? html`
              <button class="power-btn sleep"
                @click=${this._sleep}>
                <ha-icon icon="mdi:sleep"></ha-icon> 睡眠
              </button>
            ` : ''}
          </div>
          ` : ''}
        </div>
      </div>
    `;
  }

  _turnOn() {
    if (!this.config.entity) return;
    this.hass.callService('homeassistant', 'turn_on', { entity_id: this.config.entity });
    this._handleClick();
  }

  _turnOff() {
    if (!this.config.entity) return;
    this.hass.callService('homeassistant', 'turn_off', { entity_id: this.config.entity });
    this._handleClick();
  }

  _sleep() {
    if (!this.config.sleep_command) return;
    const cmd = this.config.sleep_command.replace('shell_command.', '');
    this.hass.callService('shell_command', cmd);
    this._handleClick();
  }

  _handleClick() {
    const hapticEvent = new Event('haptic', {
      bubbles: true, cancelable: false, composed: true
    });
    hapticEvent.detail = 'light';
    this.dispatchEvent(hapticEvent);
  }
}
customElements.define('xiaoshi-iot-computer-card', XiaoshiIOTComputerCard);
