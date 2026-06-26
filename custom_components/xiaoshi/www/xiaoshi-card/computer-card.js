const whenDefined = (t) => customElements.whenDefined(t);
await Promise.race([whenDefined("ha-card"), whenDefined("ha-panel-lovelace")]);
const LitElement = window.LitElement || Object.getPrototypeOf(customElements.get("ha-card"));
const html = LitElement.prototype.html;
const css = LitElement.prototype.css;

window.customCards = window.customCards || [];
window.customCards.push({
    type: 'xiaoshi-computer-card',
    name: '消逝卡(B移动端)-电脑卡(IOTLink/LibreHW)',
    description: '移动端电脑卡(支持IOTLink和Libre Hardware Monitor)'
});

// ==================== 编辑器 ====================
class XiaoshiComputerCardEditor extends LitElement {
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

  _isTargetPlatformEntity(entityId) {
    const mode = (this.config && this.config.integration_mode) || 'iotlink';
    // IOTLink 模式必须属于 mqtt 平台；LibreHW 模式放宽限制，靠实体命名模式区分
    if (mode !== 'iotlink') return true;
    if (!this.hass || !this.hass.entities) return false;
    const entry = this.hass.entities[entityId];
    return entry && entry.platform === 'mqtt';
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
      const matchesPlatform = this._isTargetPlatformEntity(entity.entity_id);
      return matchesFilter && matchesSearch && matchesPlatform;
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
    if (!this.hass || !this.config) return html``;

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
          <label>集成模式</label>
          <select
            @change=${(e) => { this.config = { ...this.config, integration_mode: e.target.value }; this._fireEvent(); }}
            .value=${this.config.integration_mode || 'iotlink'}
          >
            <option value="iotlink">IOTLink</option>
            <option value="librehardwaremonitor">Libre Hardware Monitor</option>
            <option value="fusion">融合模式</option>
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
                @input=${(e) => this._onEntitySearch(e, 'entity', '')}
                @focus=${(e) => this._onEntitySearch(e, 'entity', '')}
                .value=${this.config.entity || ''}
                placeholder="搜索 switch 或 binary_sensor 实体..."
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
          <label>计算机显示名称</label>
          <input
            type="text"
            @change=${(e) => { this.config = { ...this.config, computer_display_name: e.target.value }; this._fireEvent(); }}
            .value=${this.config.computer_display_name || ''}
            placeholder="用于显示的计算机名称，优先级最高"
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
          <label>展示GPU</label>
          <input
            type="checkbox"
            @change=${(e) => { this.config = { ...this.config, show_gpu: e.target.checked }; this._fireEvent(); }}
            .checked=${this.config.show_gpu !== false}
          />
        </div>
        <div class="form-group">
          <label>CPU多核心</label>
          <input
            type="checkbox"
            @change=${(e) => { this.config = { ...this.config, show_cpu_cores: e.target.checked }; this._fireEvent(); }}
            .checked=${this.config.show_cpu_cores !== false}
          />
        </div>
        <div class="form-group">
          <label>展示主板</label>
          <input
            type="checkbox"
            @change=${(e) => { this.config = { ...this.config, show_motherboard: e.target.checked }; this._fireEvent(); }}
            .checked=${this.config.show_motherboard !== false}
          />
        </div>
        <div class="form-group">
          <label>显卡主板合并</label>
          <input
            type="checkbox"
            @change=${(e) => { this.config = { ...this.config, merge_gpu_mb: e.target.checked }; this._fireEvent(); }}
            .checked=${this.config.merge_gpu_mb !== false}
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
          <label>卡片顺序（点击上下调整）</label>
          <div class="sort-list">
            ${this._getSortItems().map((item, i) => html`
              <div class="sort-item">
                <span class="sort-label">${item.label}</span>
                <div class="sort-btns">
                  <button
                    class="sort-btn"
                    ?disabled=${i === 0}
                    @click=${() => this._moveSortItem(i, i - 1)}>▲</button>
                  <button
                    class="sort-btn"
                    ?disabled=${i === this._getSortItems().length - 1}
                    @click=${() => this._moveSortItem(i, i + 1)}>▼</button>
                </div>
              </div>
            `)}
          </div>
        </div>

        <div class="form-group">
          <label>睡眠命令</label>
          <div class="entity-selector-with-remove">
            <input
              type="text"
              @input=${(e) => { this.config = { ...this.config, sleep_command: e.target.value }; this._fireEvent(); }}
              .value=${this.config.sleep_command || ''}
              placeholder="输入 shell 命令..."
              class="entity-search-input"
            />
            ${this.config.sleep_command ? html`
              <button class="remove-button" @click=${() => this._removeEntity('sleep_command')} title="移除">
                <ha-icon icon="mdi:close"></ha-icon>
              </button>
            ` : ''}
          </div>
        </div>

        <div class="form-group">
          <label>开机shell命令</label>
          <div class="entity-selector-with-remove">
            <input type="text"
              @input=${(e) => { this.config = { ...this.config, power_on_command: e.target.value }; this._fireEvent(); }}
              .value=${this.config.power_on_command || ''}
              placeholder="输入 shell 命令..."
              class="entity-search-input"
            />
            ${this.config.power_on_command ? html`
              <button class="remove-button" @click=${() => this._removeEntity('power_on_command')}>
                <ha-icon icon="mdi:close"></ha-icon>
              </button>
            ` : ''}
          </div>
        </div>

        <div class="form-group">
          <label>关机shell命令</label>
          <div class="entity-selector-with-remove">
            <input type="text"
              @input=${(e) => { this.config = { ...this.config, power_off_command: e.target.value }; this._fireEvent(); }}
              .value=${this.config.power_off_command || ''}
              placeholder="输入 shell 命令..."
              class="entity-search-input"
            />
            ${this.config.power_off_command ? html`
              <button class="remove-button" @click=${() => this._removeEntity('power_off_command')}>
                <ha-icon icon="mdi:close"></ha-icon>
              </button>
            ` : ''}
          </div>
        </div>

        <div class="form-group">
          <label>重启shell命令</label>
          <div class="entity-selector-with-remove">
            <input type="text"
              @input=${(e) => { this.config = { ...this.config, restart_command: e.target.value }; this._fireEvent(); }}
              .value=${this.config.restart_command || ''}
              placeholder="输入 shell 命令..."
              class="entity-search-input"
            />
            ${this.config.restart_command ? html`
              <button class="remove-button" @click=${() => this._removeEntity('restart_command')}>
                <ha-icon icon="mdi:close"></ha-icon>
              </button>
            ` : ''}
          </div>
        </div>

        <div class="help-text">输入计算机名称后，卡片将自动查找该电脑的所有实体（CPU、内存、磁盘、网络、屏幕截图）。请根据使用的软件选择对应集成模式。</div>
      </div>
    `;
  }

  constructor() {
    super();
    this._searchTerm = '';
    this._filteredEntities = [];
    this._activeEntityKey = '';
  }

  _getSortItems() {
    const orders = [
      { key: 'cpu', label: 'CPU' },
      { key: 'memory', label: '内存' },
      { key: 'disk', label: '磁盘' },
      { key: 'network', label: '网卡' },
      { key: 'gpu', label: '显卡' },
      { key: 'motherboard', label: '主板' },
      { key: 'screenshot', label: '截图' },
    ];
    const currentOrder = this.config.card_order || orders.map(o => o.key);
    const result = [];
    for (const key of currentOrder) {
      const found = orders.find(o => o.key === key);
      if (found) result.push(found);
    }
    for (const o of orders) {
      if (!currentOrder.includes(o.key)) result.push(o);
    }
    return result;
  }

  _moveSortItem(from, to) {
    const items = this._getSortItems();
    const [moved] = items.splice(from, 1);
    items.splice(to, 0, moved);
    this.config = { ...this.config, card_order: items.map(i => i.key) };
    this._fireEvent();
  }
}
customElements.define('xiaoshi-computer-card-editor', XiaoshiComputerCardEditor);

// ==================== 主卡片 ====================
class XiaoshiComputerCard extends LitElement {
  static get properties() {
    return {
      hass: { type: Object },
      width: { type: String, attribute: true },
      config: { type: Object },
      theme: { type: String },
    };
  }

  static getConfigElement() {
    return document.createElement("xiaoshi-computer-card-editor");
  }

  static getStubConfig() {
    return {
      entity: "",
      theme: "system",
      width: "100%",
      integration_mode: "iotlink",
      computer_name: "",
      computer_display_name: "",
      show_network_0: true,
      show_network_1: true,
      show_gpu: true,
      show_cpu_cores: true,
      show_motherboard: true,
      merge_gpu_mb: true,
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
        flex: 0 0 calc(50% - 3px);
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
        padding: 8px 8px 8px 8px;
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
      .power-btn.restart {
        background: #2196F3;
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
    this.cpuCoresData = {};
    this._discovered = null;
    this._discoveredCacheKey = '';
    this._screenshotFailed = false;
    this._lastScreenshotSrc = '';
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

  _isTargetPlatformEntity(entityId) {
    const mode = this.config && this.config.integration_mode;
    // IOTLink 模式必须属于 mqtt 平台；LibreHW 模式放宽限制，靠实体命名模式区分
    if (mode && mode !== 'iotlink') return true;
    if (!this.hass || !this.hass.entities) return false;
    const entry = this.hass.entities[entityId];
    return entry && entry.platform === 'mqtt';
  }

  _getEntityUid(entityId) {
    if (!this.hass || !this.hass.entities) return '';
    const entry = this.hass.entities[entityId];
    return entry?.unique_id || '';
  }

  _eidOrUidMatch(eid, uid, eidCheck, uidCheck) {
    const matchEid = eidCheck(eid);
    if (matchEid) return matchEid;
    if (uid && uidCheck) return uidCheck(uid);
    return null;
  }

  _convertToPrefix(computerName) {
    return computerName.replace(/-/g, '_').toLowerCase();
  }

  _discoverEntities() {
    if (!this.config.computer_name || !this.hass || !this.hass.states) return null;
    const prefix = this._convertToPrefix(this.config.computer_name);
    const mode = this.config.integration_mode || 'iotlink';
    // 缓存：只有 computer_name 或 integration_mode 变化时才重新扫描实体
    const cacheKey = `${prefix}|${mode}`;
    if (this._discoveredCacheKey === cacheKey && this._discovered) {
      return this._discovered;
    }

    let result;
    if (mode === 'librehardwaremonitor') {
      result = this._discoverLibreEntities(prefix);
    } else if (mode === 'fusion') {
      const libreData = this._discoverLibreEntities(prefix);
      const iotData = this._discoverIotEntities(prefix);
      // 融合: LibreHW 为主，IOTLink 补充截图、网卡和磁盘温度
      libreData.screenshotEntity = iotData.screenshotEntity;
      libreData.networks = iotData.networks;
      // 合并磁盘: IOTLink 逻辑分区 + LibreHW 物理磁盘温度
      const mergedDrives = {};
      // 收集 IOTLink 分区
      const iotPartitions = [];
      for (const drive of Object.keys(iotData.drives)) {
        const d = iotData.drives[drive];
        const total = this._getEntityValueByEntityId(d.total_storage);
        iotPartitions.push({ drive, total, data: d });
        mergedDrives[drive] = { ...d };
        if (d.used_space_load) mergedDrives[drive].usage = d.used_space_load;
        if (d.free_space_data) mergedDrives[drive].available_free_space = d.free_space_data;
        if (d.total_space_data) mergedDrives[drive].total_storage = d.total_space_data;
      }
      // LibreHW 物理磁盘列表（有温度的）
      const libreDisks = Object.keys(libreData.drives).map(dk => ({
        key: dk,
        total: this._getEntityValueByEntityId(libreData.drives[dk].total_storage),
        temperature: libreData.drives[dk].temperature
      })).filter(d => d.temperature && d.total > 0);

      const usedLibre = new Set();
      const unmatchedIot = new Set(iotPartitions.map(p => p.drive));
      // 第1遍: 逐个匹配（单分区容量 ≈ 物理盘容量，容差10%）
      for (const pt of iotPartitions) {
        if (pt.total <= 0) continue;
        for (const ld of libreDisks) {
          if (usedLibre.has(ld.key)) continue;
          if (Math.abs(pt.total - ld.total) / Math.max(pt.total, ld.total) < 0.1) {
            mergedDrives[pt.drive]._libreTemp = ld.temperature;
            usedLibre.add(ld.key);
            unmatchedIot.delete(pt.drive);
            break;
          }
        }
      }
      // 第2遍: 未匹配的分区按合计匹配剩余物理盘
      const remainingIot = [...unmatchedIot];
      const remainingLibre = libreDisks.filter(d => !usedLibre.has(d.key));
      if (remainingIot.length > 0 && remainingLibre.length > 0) {
        const sumIot = remainingIot.reduce((s, dk) => {
          const p = iotPartitions.find(p => p.drive === dk);
          return s + (p ? p.total : 0);
        }, 0);
        for (const ld of remainingLibre) {
          if (sumIot > 0 && Math.abs(sumIot - ld.total) / Math.max(sumIot, ld.total) < 0.1) {
            for (const dk of remainingIot) {
              mergedDrives[dk]._libreTemp = ld.temperature;
            }
            break;
          }
        }
      }
      libreData.drives = mergedDrives;
      // 标记融合模式
      libreData._isFusion = true;
      result = libreData;
    } else {
      result = this._discoverIotEntities(prefix);
    }
    // 缓存结果，只在 computer_name 或 mode 变化时才重新扫描
    this._discoveredCacheKey = cacheKey;
    return result;
  }

  _getEntityValueByEntityId(entityId) {
    if (!entityId || !this.hass) return 0;
    const st = this.hass.states[entityId];
    if (!st || isNaN(parseFloat(st.state))) return 0;
    return parseFloat(st.state);
  }

  _discoverIotEntities(prefix) {
    const allStates = this.hass.states;
    const allIds = Object.keys(allStates);
    const escPrefix = prefix.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const sensorPrefix = `sensor.${escPrefix}_`;
    const cameraPrefix = `camera.${escPrefix}_`;

    // IOTLink 实体命名模式
    const diskEidRegex = new RegExp(`^sensor\\.${escPrefix}_harddrive_${escPrefix}_storage_([a-z])_(.+)$`);
    const netEidRegex = new RegExp(`^sensor\\.${escPrefix}_networkinfo_${escPrefix}_network_([0-9]+)_(.+)$`);

    const drives = {};
    const networks = {};
    let cpuEntity = null;
    let memoryEntity = null;
    let screenshotEntity = null;

    for (const eid of allIds) {
      if (!this._isTargetPlatformEntity(eid)) continue;

      // --- 磁盘 ---
      const diskMatch = eid.match(diskEidRegex);
      if (diskMatch) {
        const drive = diskMatch[1].toUpperCase();
        const metric = diskMatch[2];
        if (!drives[drive]) drives[drive] = {};
        drives[drive][metric] = eid;
        continue;
      }

      // --- 网络 ---
      const netMatch = eid.match(netEidRegex);
      if (netMatch) {
        const idx = netMatch[1];
        const metric = netMatch[2];
        if (!networks[idx]) networks[idx] = {};
        networks[idx][metric] = eid;
        continue;
      }

      // --- CPU ---
      if (!cpuEntity && eid.startsWith(sensorPrefix) && eid.includes('cpu')) {
        const st = allStates[eid];
        if (st && !isNaN(parseFloat(st.state))) { cpuEntity = eid; continue; }
      }

      // --- 内存 ---
      if (!memoryEntity && eid.startsWith(sensorPrefix) && (eid.includes('memory') || eid.includes('_mem_'))) {
        const st = allStates[eid];
        if (st && !isNaN(parseFloat(st.state))) { memoryEntity = eid; continue; }
      }

      // --- 截图 ---
      if (!screenshotEntity && eid.startsWith(cameraPrefix) && eid.includes('display_screenshot')) {
        screenshotEntity = eid;
        continue;
      }
    }

    return {
      prefix,
      drives,
      networks,
      cpuEntity,
      cpuTemperatureEntity: null,
      cpuCores: [],
      isMultiCore: false,
      cpuName: '',
      memoryEntity,
      memoryTemperatureEntity: null,
      gpuEntity: null,
      gpu: null,
      motherboard: null,
      screenshotEntity,
    };
  }

  _discoverLibreEntities(prefix) {
    const allStates = this.hass.states;
    const allIds = Object.keys(allStates);
    const escPrefix = prefix.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const sensorPrefix = `sensor.${escPrefix}_`;
    const sensorPrefixLen = sensorPrefix.length;

    // ===== 单次遍历收集所有实体 =====
    const drives = {};
    const driveTempMap = {};          // driveKey -> entityId (暂存温度，等确认硬盘有效后再合并)
    const networks = {};
    let cpuEntity = null;
    let cpuTemperatureEntity = null;
    const cpuCoreMap = {};            // { coreNum: { load, temperature } }
    let memoryEntity = null;
    let memoryTemperatureEntity = null;
    const gpu = { loadEntity: null, tempEntity: null, memUsedEntity: null, memTotalEntity: null, fanEntity: null, fanControlEntity: null };
    const mbCandidates = [];          // 未能立即分类的实体，最后再尝试主板匹配

    const netMetricMap = { network_utilization_load: 'speed', download_speed_throughput: 'bps_received', upload_speed_throughput: 'bps_sent' };
    const adapterIndexMap = {};
    let netIdx = 0;

    for (const eid of allIds) {
      // 快速跳过不相关的实体
      if (!eid.startsWith(sensorPrefix)) continue;
      if (!this._isTargetPlatformEntity(eid)) continue; // Libre/融合不限制平台，但保留一致性检查

      const afterPrefix = eid.slice(sensorPrefixLen);
      if (!afterPrefix) continue;

      // --- 磁盘 ---
      // 模式: {drive}_{used_space_load|free_space_data|total_space_data|temperature}
      // 排除包含 cpu/gpu/fan/memory/voltage/network 关键字的实体（避免误匹配主板传感器）
      const diskMatch = afterPrefix.match(/^(.+)_(used_space_load|free_space_data|total_space_data|temperature)$/);
      if (diskMatch && !/_cpu_|_gpu_|_fan_|_memory_|_voltage|_network_/.test(diskMatch[1])) {
        const driveKey = diskMatch[1].toLowerCase();
        const rawMetric = diskMatch[2];
        if (rawMetric === 'temperature') {
          // 温度暂存，等确认硬盘有效后再合并
          if (!driveTempMap[driveKey]) driveTempMap[driveKey] = eid;
        } else {
          const metric = rawMetric === 'used_space_load' ? 'usage' : rawMetric === 'free_space_data' ? 'available_free_space' : 'total_storage';
          if (!drives[driveKey]) drives[driveKey] = {};
          drives[driveKey][metric] = eid;
        }
        continue;
      }

      // --- 网络 ---
      // 模式: {adapter}_network_utilization_load|download_speed_throughput|upload_speed_throughput
      const netMatch = afterPrefix.match(/^(.+)_(network_utilization_load|download_speed_throughput|upload_speed_throughput)$/);
      if (netMatch) {
        const adapterKey = netMatch[1].toLowerCase();
        if (/bluetooth|local|vmware|vethernet/.test(adapterKey)) continue;
        const metric = netMetricMap[netMatch[2]] || netMatch[2];
        if (!(adapterKey in adapterIndexMap)) {
          adapterIndexMap[adapterKey] = String(netIdx++);
        }
        const idx = adapterIndexMap[adapterKey];
        if (!networks[idx]) networks[idx] = {};
        networks[idx][metric] = eid;
        continue;
      }

      // --- CPU 总负载 ---
      if (!cpuEntity && afterPrefix.endsWith('_cpu_total_load')) {
        const st = allStates[eid];
        if (st && !isNaN(parseFloat(st.state))) { cpuEntity = eid; }
        continue;
      }

      // --- CPU 温度 ---
      if (!cpuTemperatureEntity && afterPrefix.includes('_cpu_package_temperature')) {
        const st = allStates[eid];
        if (st && !isNaN(parseFloat(st.state))) { cpuTemperatureEntity = eid; }
        continue;
      }

      // --- CPU 核心 ---
      const coreMatch = afterPrefix.match(/_cpu_core_(\d+)_(load|temperature)$/);
      if (coreMatch) {
        const coreNum = parseInt(coreMatch[1], 10);
        const metric = coreMatch[2];
        if (!cpuCoreMap[coreNum]) cpuCoreMap[coreNum] = {};
        cpuCoreMap[coreNum][metric] = eid;
        continue;
      }

      // --- 内存 ---
      if (!memoryEntity && afterPrefix.includes('total_memory_memory_load')) {
        const st = allStates[eid];
        if (st && !isNaN(parseFloat(st.state))) { memoryEntity = eid; }
        continue;
      }

      // --- 内存温度 ---
      if (!memoryTemperatureEntity && afterPrefix.includes('_memory_temperature')) {
        const st = allStates[eid];
        if (st && !isNaN(parseFloat(st.state))) { memoryTemperatureEntity = eid; }
        continue;
      }

      // --- GPU ---
      if (afterPrefix.includes('gpu')) {
        if (!gpu.loadEntity && afterPrefix.includes('gpu_core_load')) {
          const st = allStates[eid]; if (st && !isNaN(parseFloat(st.state))) gpu.loadEntity = eid;
        } else if (!gpu.tempEntity && afterPrefix.includes('gpu_core_temperature')) {
          const st = allStates[eid]; if (st && !isNaN(parseFloat(st.state))) gpu.tempEntity = eid;
        } else if (!gpu.memUsedEntity && afterPrefix.includes('gpu_memory_used_data')) {
          gpu.memUsedEntity = eid;
        } else if (!gpu.memTotalEntity && afterPrefix.includes('gpu_memory_total_data')) {
          gpu.memTotalEntity = eid;
        } else if (!gpu.fanEntity && afterPrefix.includes('gpu_fan_speed')) {
          const st = allStates[eid]; if (st && !isNaN(parseFloat(st.state))) gpu.fanEntity = eid;
        } else if (!gpu.fanControlEntity && afterPrefix.includes('gpu_fan_control')) {
          const st = allStates[eid]; if (st && !isNaN(parseFloat(st.state))) gpu.fanControlEntity = eid;
        } else {
          mbCandidates.push(eid);
        }
        continue;
      }

      // 未匹配 → 候选给主板
      mbCandidates.push(eid);
    }

    // ===== 后处理: 清理无效硬盘，合并温度 =====
    const diskKeys = Object.keys(drives);
    for (const dk of diskKeys) {
      const d = drives[dk];
      if (!d.usage && !d.total_storage) {
        delete drives[dk];
      } else if (driveTempMap[dk]) {
        d.temperature = driveTempMap[dk];
      }
    }

    // ===== 后处理: CPU 核心 =====
    const cpuCores = Object.keys(cpuCoreMap)
      .map(Number).sort((a, b) => a - b)
      .map(core => ({ core, loadEntity: cpuCoreMap[core].load || null, tempEntity: cpuCoreMap[core].temperature || null }));
    const isMultiCore = cpuCores.length > 1;

    // CPU 名称
    const cpuSample = cpuEntity || cpuCores[0]?.loadEntity;
    let cpuName = '';
    if (cpuSample) {
      const afterPrefix = cpuSample.slice(sensorPrefixLen);
      cpuName = (afterPrefix.split('_cpu_')[0] || '').replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
    }

    // GPU 名称
    const gpuEntity = gpu.loadEntity;
    const gpuSample = gpu.loadEntity || gpu.tempEntity || gpu.memUsedEntity || gpu.fanEntity;
    if (gpuSample) {
      const afterPrefix = gpuSample.slice(sensorPrefixLen);
      const gpuRaw = afterPrefix.split('_gpu_')[0] || '';
      gpu.name = gpuRaw.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
    }

    // ===== 后处理: 主板（剩余未匹配的实体） =====
    const mbSensors = [];
    const mbSensorSuffixes = [
      { regex: /_fan_(\d+)_speed$/, label: (m) => '风扇' + m[1] + ' 转速', unit: ' RPM' },
      { regex: /_fan_(\d+)_control$/, label: (m) => '风扇' + m[1] + ' 控制', unit: '%' },
      { regex: /_cpu_core_temperature$/, label: () => 'CPU 温度', unit: '°C' },
      { regex: /_cpu_termination_voltage$/, label: () => 'CPU 终止电压', unit: 'V' },
      { regex: /_vcore_voltage$/, label: () => 'Vcore', unit: 'V' },
      { regex: /_3_3v_voltage$/, label: () => '+3.3V', unit: 'V' },
      { regex: /_3v_standby_voltage$/, label: () => '+3V Standby', unit: 'V' },
      { regex: /_avcc_voltage$/, label: () => 'AVCC', unit: 'V' },
      { regex: /_temperature_(\d+)$/, label: (m) => '温度#' + m[1], unit: '°C' },
      { regex: /_voltage_(\d+)$/, label: (m) => '电压#' + m[1], unit: 'V' },
    ];
    // 构建已使用的 entity ID 集合（包括 disk metrics 和 network metrics）
    const usedEntityIds = new Set([
      cpuEntity, cpuTemperatureEntity,
      ...cpuCores.flatMap(c => [c.loadEntity, c.tempEntity]),
      memoryEntity, memoryTemperatureEntity,
      gpu.loadEntity, gpu.tempEntity, gpu.memUsedEntity, gpu.memTotalEntity, gpu.fanEntity, gpu.fanControlEntity,
      ...Object.values(drives).flatMap(v => Object.values(v)),
      ...Object.values(driveTempMap),
      ...Object.values(networks).flatMap(v => Object.values(v).filter(x => typeof x === 'string')),
    ].filter(Boolean));

    let mbName = '';
    for (const eid of mbCandidates) {
      if (usedEntityIds.has(eid)) continue;
      const afterPrefix = eid.slice(sensorPrefixLen);
      for (const s of mbSensorSuffixes) {
        const m = afterPrefix.match(s.regex);
        if (m) {
          const st = allStates[eid];
          if (st && !isNaN(parseFloat(st.state))) {
            mbSensors.push({ name: s.label(m), entityId: eid, value: parseFloat(st.state), unit: s.unit });
            if (!mbName) {
              const suffixLen = m[0].length;
              const raw = afterPrefix.slice(0, afterPrefix.length - suffixLen - 1);
              mbName = raw.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
            }
          }
          break;
        }
      }
    }

    return {
      prefix,
      drives,
      networks,
      cpuEntity,
      cpuTemperatureEntity,
      cpuCores,
      isMultiCore,
      cpuName,
      memoryEntity,
      memoryTemperatureEntity,
      gpuEntity,
      gpu,
      motherboard: { name: mbName, sensors: mbSensors },
      screenshotEntity: null,
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
    if (d.cpuCores) {
      for (const c of d.cpuCores) {
        if (c.loadEntity) entityIds.push(c.loadEntity);
      }
    }
    if (entityIds.length === 0) return;

    try {
      const now = new Date();
      const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000);
      const result = await this.hass.callWS({
        type: 'history/history_during_period',
        start_time: twoHoursAgo.toISOString(),
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
      this.cpuCoresData = {};
      if (d.cpuCores) {
        for (const c of d.cpuCores) {
          if (c.loadEntity && result?.[c.loadEntity]?.length) {
            this.cpuCoresData[c.core] = result[c.loadEntity]
              .filter(e => !isNaN(parseFloat(e.s)))
              .map(e => parseFloat(e.s));
          }
        }
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
    this._discovered = this._discoverEntities();
    await this._fetchHistoryData();
    this.requestUpdate();
    await this.updateComplete;
    this._drawAllCharts();
  }

  async updated(changedProperties) {
    if (changedProperties.has('config')) {
      this._discoveredCacheKey = '';
      this._discovered = null;
    }
    if (changedProperties.has('hass') || changedProperties.has('config')) {
      this._discovered = this._discoverEntities();
      this.requestUpdate();
      await this.updateComplete;
      this._drawAllCharts();
    }
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
    // 每核心小曲线
    if (d.cpuCores) {
      for (const c of d.cpuCores) {
        const data = this.cpuCoresData[c.core];
        if (data && data.length > 0) {
          const canvas = this.shadowRoot?.querySelector(`#core-chart-${c.core}`);
          if (canvas) this._drawChart(canvas, data, '#00BCD4', 'rgba(0,188,212,0.1)');
        }
      }
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

  _cleanDiskLabel(label, prefix) {
    if (!label || label === '本地磁盘') return label;
    // 移除后缀: Used Space Load / Free Space Data / Total Space Data / Temperature 等
    let cleaned = label
      .replace(/\s*(Used Space Load|Free Space Data|Total Space Data|Temperature|Read Activity Load|Write Activity Load|Total Activity Load|Life Level|Data Read|Data Written|Read Rate Throughput|Write Rate Throughput)\s*$/i, '')
      .replace(/[[\]]/g, '')     // 去掉所有方括号: [ZHANGQIANG-PC] → ZHANGQIANG-PC
      .trim();
    // 移除前缀: [计算机名] 及各种变体（空格/下划线/短横，不区分大小写）
    if (prefix) {
      const prefixVariants = [
        prefix.replace(/_/g, ' '),           // zhangqiang pc
        prefix,                               // zhangqiang_pc
        prefix.replace(/_/g, '-'),           // zhangqiang-pc
      ];
      for (const pv of prefixVariants) {
        cleaned = cleaned.replace(new RegExp('^' + pv.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\s*', 'i'), '').trim();
      }
    }
    return cleaned || label;
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
          const mode = this.config.integration_mode || 'iotlink';
          const isLibre = mode === 'librehardwaremonitor';
          const isFusion = mode === 'fusion';
          const isLibreOrFusion = isLibre || isFusion;
          // 标签: IOTLink/融合用 label 实体，LibreHW 从 friendly_name 提取
          const rawLabel = isLibre
            ? (this.hass.states[m.usage]?.attributes?.friendly_name || '本地磁盘')
            : (this._getEntityStateStr(m.label) || '本地磁盘');
          const label = isLibre ? this._cleanDiskLabel(rawLabel, d.prefix) : rawLabel;
          const driveSuffix = drive.length === 1 ? html` (${drive.toUpperCase()}:)` : html``;
          // 温度: LibreHW 用 m.temperature，融合模式用 _libreTemp
          const tempEntity = isFusion ? m._libreTemp : m.temperature;
          const diskTemp = this._getEntityValue(tempEntity);
          const diskTempColor = diskTemp !== undefined ? (diskTemp >= 60 ? '#f44336' : diskTemp >= 45 ? '#FF9800' : '#4CAF50') : '#aaa';

          return html`
            <div class="info-card" style="--card-bg: ${theme === 'light' ? '#f5f5f5' : '#3a3a3a'}; color: inherit;">
              <div class="info-header">
                <span class="info-header-left">
                  <ha-icon icon="mdi:harddisk" style="color: ${color};"></ha-icon>
                  <span style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:120px;">${label}${driveSuffix}</span>
                </span>
                <span class="info-value" style="color: ${color};">${freePct !== undefined ? freePct + '%' : '--%'}</span>
              </div>
              <div class="disk-bar-bg" style="--bar-bg: ${theme === 'light' ? '#e0e0e0' : '#555'}; margin-top: 2px;">
                <div class="disk-bar-fill" style="width: ${usage !== undefined ? usage : 0}%; background: ${color};"></div>
              </div>
              <div class="info-sub" style="display:flex;justify-content:space-between;align-items:center;">
                <span>可用 ${this._formatDiskSize(free, m.available_free_space)} / 总共 ${this._formatDiskSize(total, m.total_storage)}</span>
                ${isLibreOrFusion && tempEntity ? html`
                <span style="display:flex;align-items:center;gap:2px;color:${diskTempColor};font-size:14px;font-weight:bold;">
                  <ha-icon icon="mdi:thermometer" style="--mdc-icon-size:14px;"></ha-icon>
                  <span>${diskTemp !== undefined ? Math.round(diskTemp) + '°C' : '--°C'}</span>
                </span>
                ` : ''}
              </div>
            </div>
          `;
        });
  }

  _renderCpuCard(d, theme) {
    const totalLoad = this._getEntityValue(d.cpuEntity);
    const cpuColor = '#00BCD4';

    if (d.isMultiCore && d.cpuCores.length > 0) {
      // 多核心模式：总览卡 + 核心详情卡
      const temp = this._getEntityValue(d.cpuTemperatureEntity);
      const tempColor = temp !== undefined ? (temp >= 80 ? '#f44336' : temp >= 60 ? '#FF9800' : '#4CAF50') : '#aaa';
      const overviewCard = html`
        <div class="info-card" style="--card-bg: ${theme === 'light' ? '#f5f5f5' : '#3a3a3a'}; color: inherit; padding-bottom:0;">
          <div class="info-header">
            <span class="info-header-left">
              <ha-icon icon="mdi:cpu-64-bit" style="color: ${cpuColor};"></ha-icon>
              <span>${d.cpuName || 'CPU'}</span>
            </span>
            <span class="info-value" style="color: ${cpuColor};">${totalLoad !== undefined ? Math.round(totalLoad) + '%' : '--%'}</span>
          </div>
          <div class="info-chart-container">
            <canvas id="cpu-chart"></canvas>
          </div>
          ${d.cpuTemperatureEntity ? html`
          <div class="info-sub" style="display:flex;justify-content:flex-end;color:${tempColor};font-size:14px;font-weight:bold;margin-top:4px;">
            ${temp !== undefined ? Math.round(temp) + '°C' : '--°C'}
          </div>
          ` : ''}
        </div>
      `;

      return this.config.show_cpu_cores !== false
        ? [overviewCard, html`
        <div class="info-card" style="--card-bg: ${theme === 'light' ? '#f5f5f5' : '#3a3a3a'}; color: inherit; padding-bottom:0;">
          <div class="info-header">
            <span class="info-header-left">
              <ha-icon icon="mdi:cpu-64-bit" style="color: ${cpuColor};"></ha-icon>
              <span>${d.cpuName || 'CPU'} 核心</span>
            </span>
          </div>
          <div style="display:flex;gap:2px;">
            ${d.cpuCores.map(c => {
              const load = this._getEntityValue(c.loadEntity);
              return html`
                <div style="flex:1;min-width:0;position:relative;padding-bottom:0px;border:1px solid ${theme === 'light' ? '#aaa' : '#888'};">
                  <div style="position:absolute;top:0;left:0;right:0;z-index:1;font-weight:bold;font-size:8px;color:inherit;text-align:center;text-shadow:0 0 2px var(--card-bg);padding:0px;">${load !== undefined ? Math.round(load) + '%' : '--%'}</div>
                  <div style="height:41px;overflow:hidden;">
                    <canvas id="core-chart-${c.core}"></canvas>
                  </div>
                </div>
              `;
            })}
          </div>
          <div style="display:flex;margin-top:2px;">
            ${d.cpuCores.map(c => {
              const temp = this._getEntityValue(c.tempEntity);
              const tColor = temp !== undefined ? (temp >= 80 ? '#f44336' : temp >= 60 ? '#FF9800' : '#4CAF50') : '#aaa';
              return html`
                <div style="flex:1;min-width:0;text-align:center;color:${tColor};font-size:8px;font-weight:bold;">
                  ${temp !== undefined ? Math.round(temp) + '°C' : '--°C'}
                </div>
              `;
            })}
          </div>
        </div>
      `] : [overviewCard];
    } else {
      // 单核心模式
      const temp = this._getEntityValue(d.cpuTemperatureEntity);
      const isLibre = this.config.integration_mode === 'librehardwaremonitor' || this.config.integration_mode === 'fusion';
      const cardStyle = `--card-bg: ${theme === 'light' ? '#f5f5f5' : '#3a3a3a'}; color: inherit;${isLibre ? ' padding-bottom:0;' : ''}`;
      const tempColor = temp !== undefined ? (temp >= 80 ? '#f44336' : temp >= 60 ? '#FF9800' : '#4CAF50') : '#aaa';
      return html`
        <div class="info-card" style="${cardStyle}">
          <div class="info-header">
            <span class="info-header-left">
              <ha-icon icon="mdi:cpu-64-bit" style="color: ${cpuColor};"></ha-icon>
              <span>${d.cpuName || 'CPU'}</span>
            </span>
            <span class="info-value" style="color: ${cpuColor};">${totalLoad !== undefined ? Math.round(totalLoad) + '%' : '--%'}</span>
          </div>
          <div class="info-chart-container">
            <canvas id="cpu-chart"></canvas>
          </div>
          ${d.cpuTemperatureEntity ? html`
          <div class="info-sub" style="display:flex;justify-content:flex-end;color:${tempColor};font-size:14px;font-weight:bold;">
            ${temp !== undefined ? Math.round(temp) + '°C' : '--°C'}
          </div>
          ` : ''}
        </div>
      `;
    }
  }

  _renderMemoryCard(d, theme) {
    const value = this._getEntityValue(d.memoryEntity);
    const temp = this._getEntityValue(d.memoryTemperatureEntity);
    const color = '#9C27B0';
    const tempColor = temp !== undefined ? (temp >= 80 ? '#f44336' : temp >= 60 ? '#FF9800' : '#4CAF50') : '#aaa';
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
        ${d.memoryTemperatureEntity ? html`
        <div class="info-sub" style="display:flex;align-items:center;gap:4px;">
          <ha-icon icon="mdi:thermometer" style="color:${tempColor};--mdc-icon-size:14px;"></ha-icon>
          <span style="color:${tempColor};">${temp !== undefined ? Math.round(temp) + '°C' : '--°C'}</span>
        </div>
        ` : ''}
      </div>
    `;
  }

  _renderGpuCard(d, theme) {
    if (!d.gpuEntity && !(d.gpu && d.gpu.loadEntity)) return html``;
    const g = d.gpu || {};
    const load = this._getEntityValue(g.loadEntity || d.gpuEntity);
    const temp = this._getEntityValue(g.tempEntity);
    const memUsed = this._getEntityValue(g.memUsedEntity);
    const memTotal = this._getEntityValue(g.memTotalEntity);
    const fan = this._getEntityValue(g.fanEntity);
    const fanCtrl = this._getEntityValue(g.fanControlEntity);
    const color = '#4CAF50';
    const tempColor = temp !== undefined ? (temp >= 80 ? '#f44336' : temp >= 60 ? '#FF9800' : '#4CAF50') : '#aaa';
    const vramGb = (memUsed !== undefined && memTotal !== undefined)
      ? `${this._formatDiskSize(memUsed, g.memUsedEntity)} / ${this._formatDiskSize(memTotal, g.memTotalEntity)}` : '';

    return html`
      <div class="info-card" style="--card-bg: ${theme === 'light' ? '#f5f5f5' : '#3a3a3a'}; color: inherit; padding-bottom:0;">
        <div class="info-header">
          <span class="info-header-left">
            <ha-icon icon="mdi:expansion-card" style="color: ${color};"></ha-icon>
            <span>${g.name || 'GPU'}</span>
          </span>
          <span class="info-value" style="color: ${color};">${load !== undefined ? Math.round(load) + '%' : '--%'}</span>
        </div>
        <div class="info-sub">
          ${g.memUsedEntity && g.memTotalEntity ? html`
          <div style="font-size:9px;opacity:0.6;">显存 ${vramGb}</div>
          ` : ''}
          <div style="display:flex;justify-content:space-between;align-items:center;">
            ${(g.fanEntity && fan && Math.round(fan) > 0) || (g.fanControlEntity && fanCtrl && Math.round(fanCtrl) > 0) ? html`
            <span style="display:flex;align-items:center;gap:6px;opacity:0.6;">
              <ha-icon icon="mdi:fan" style="--mdc-icon-size:14px;"></ha-icon>
              ${g.fanEntity && fan && Math.round(fan) > 0 ? html`<span style="font-size:10px;font-weight:bold;">${Math.round(fan)} RPM</span>` : ''}
              ${g.fanControlEntity && fanCtrl && Math.round(fanCtrl) > 0 ? html`<span style="font-size:10px;font-weight:bold;">${Math.round(fanCtrl)}%</span>` : ''}
            </span>
            ` : ''}
            ${g.tempEntity ? html`
            <span style="display:flex;align-items:center;gap:4px;color:${tempColor};font-size:14px;font-weight:bold;">
              <ha-icon icon="mdi:thermometer" style="--mdc-icon-size:14px;"></ha-icon>
              <span>${temp !== undefined ? Math.round(temp) + '°C' : '--°C'}</span>
            </span>
            ` : ''}
          </div>
        </div>
      </div>
    `;
  }

  _renderTemperatureCard(d, theme) {
    const tempId = d.cpuTemperatureEntity || d.temperatureEntity;
    if (!tempId) return html``;
    const value = this._getEntityValue(tempId);
    const color = '#FF5722';
    return html`
      <div class="info-card" style="--card-bg: ${theme === 'light' ? '#f5f5f5' : '#3a3a3a'}; color: inherit;">
        <div class="info-header">
          <span class="info-header-left">
            <ha-icon icon="mdi:thermometer" style="color: ${color};"></ha-icon>
            <span>温度</span>
          </span>
          <span class="info-value" style="color: ${color};">${value !== undefined ? Math.round(value) + '°C' : '--°C'}</span>
        </div>
      </div>
    `;
  }

  _renderMotherboardCard(d, theme) {
    const mb = d.motherboard;
    if (!mb || !mb.sensors || mb.sensors.length === 0) return html``;
    const fans = mb.sensors.filter(s => s.name.includes('风扇') && s.name.includes('转速') && s.value > 0);
    let temps = mb.sensors.filter(s => s.name.includes('温度') && s.value <= 100);
    // 排除低于最高温度20%的过低值（百分比筛选）
    if (temps.length > 1) {
      const maxTemp = Math.max(...temps.map(t => t.value));
      temps = temps.filter(t => t.value >= maxTemp * 0.8);
    }
    const color = '#FF9800';

    return html`
      <div class="info-card" style="--card-bg: ${theme === 'light' ? '#f5f5f5' : '#3a3a3a'}; color: inherit; padding-bottom:0;">
        <div class="info-header">
          <span class="info-header-left">
            <ha-icon icon="mdi:chip" style="color: ${color};"></ha-icon>
            <span>${mb.name || '主板'}</span>
          </span>
        </div>
        <div class="info-sub" style="display:flex;justify-content:space-between;align-items:center;">
          ${fans.length > 0 ? html`
          <div style="display:flex;flex-wrap:wrap;gap:6px;">
            ${fans.map(f => html`
            <span style="font-size:10px;display:flex;align-items:center;gap:2px;opacity:0.6;">
              <ha-icon icon="mdi:fan" style="--mdc-icon-size:12px;"></ha-icon>
              <b>${Math.round(f.value)} RPM</b>
            </span>
            `)}
          </div>
          ` : ''}
          ${temps.length > 0 ? html`
          <div style="display:flex;align-items:center;gap:6px;">
            ${temps.map(t => {
              const tColor = t.value >= 80 ? '#f44336' : t.value >= 60 ? '#FF9800' : '#4CAF50';
              return html`
            <span style="display:flex;align-items:center;gap:2px;color:${tColor};font-size:14px;font-weight:bold;">
              <ha-icon icon="mdi:thermometer" style="--mdc-icon-size:14px;"></ha-icon>
              <span>${Math.round(t.value)}°C</span>
            </span>
              `; })}
          </div>
          ` : ''}
        </div>
      </div>
    `;
  }

  _renderGpuMbCombined(d, theme) {
    const g = d.gpu || {};
    const mb = d.motherboard;

    // GPU 部分：复制自 _renderGpuCard
    const load = this._getEntityValue(g.loadEntity || d.gpuEntity);
    const temp = this._getEntityValue(g.tempEntity);
    const fan = this._getEntityValue(g.fanEntity);
    const fanCtrl = this._getEntityValue(g.fanControlEntity);
    const memUsed = this._getEntityValue(g.memUsedEntity);
    const memTotal = this._getEntityValue(g.memTotalEntity);
    const gpuColor = '#4CAF50';
    const tempColor = temp !== undefined ? (temp >= 80 ? '#f44336' : temp >= 60 ? '#FF9800' : '#4CAF50') : '#aaa';
    const vramGb = (memUsed !== undefined && memTotal !== undefined)
      ? `${this._formatDiskSize(memUsed, g.memUsedEntity)} / ${this._formatDiskSize(memTotal, g.memTotalEntity)}` : '';

    // 主板部分：复制自 _renderMotherboardCard
    const mbFans = mb && mb.sensors ? mb.sensors.filter(s => s.name.includes('风扇') && s.name.includes('转速') && s.value > 0) : [];
    let mbTemps = mb && mb.sensors ? mb.sensors.filter(s => s.name.includes('温度') && s.value <= 100) : [];
    if (mbTemps.length > 1) {
      const maxTemp = Math.max(...mbTemps.map(t => t.value));
      mbTemps = mbTemps.filter(t => t.value >= maxTemp * 0.8);
    }
    const mbColor = '#FF9800';

    return html`
      <div class="info-card" style="--card-bg: ${theme === 'light' ? '#f5f5f5' : '#3a3a3a'}; color: inherit; padding-bottom:0;">
        <!-- GPU 区域 -->
        <div class="info-header">
          <span class="info-header-left">
            <ha-icon icon="mdi:expansion-card" style="color: ${gpuColor};"></ha-icon>
            <span>${g.name || 'GPU'}</span>
          </span>
          <span class="info-value" style="color: ${gpuColor};">${load !== undefined ? Math.round(load) + '%' : '--%'}</span>
        </div>
        <div class="info-sub" style="border-bottom:1px solid ${theme === 'light' ? '#ddd' : '#444'};padding-bottom:4px;margin-bottom:4px;">
          ${g.memUsedEntity && g.memTotalEntity ? html`
          <div style="font-size:9px;opacity:0.6;">显存 ${vramGb}</div>
          ` : ''}
          <div style="display:flex;justify-content:space-between;align-items:center;">
            ${(g.fanEntity && fan && Math.round(fan) > 0) || (g.fanControlEntity && fanCtrl && Math.round(fanCtrl) > 0) ? html`
            <span style="display:flex;align-items:center;gap:6px;opacity:0.6;">
              <ha-icon icon="mdi:fan" style="--mdc-icon-size:14px;"></ha-icon>
              ${g.fanEntity && fan && Math.round(fan) > 0 ? html`<span style="font-size:10px;font-weight:bold;">${Math.round(fan)} RPM</span>` : ''}
              ${g.fanControlEntity && fanCtrl && Math.round(fanCtrl) > 0 ? html`<span style="font-size:10px;font-weight:bold;">${Math.round(fanCtrl)}%</span>` : ''}
            </span>
            ` : ''}
            ${g.tempEntity ? html`
            <span style="display:flex;align-items:center;gap:4px;color:${tempColor};font-size:14px;font-weight:bold;">
              <ha-icon icon="mdi:thermometer" style="--mdc-icon-size:14px;"></ha-icon>
              <span>${temp !== undefined ? Math.round(temp) + '°C' : '--°C'}</span>
            </span>
            ` : ''}
          </div>
        </div>
        <!-- 主板区域 -->
        <div class="info-header">
          <span class="info-header-left">
            <ha-icon icon="mdi:chip" style="color: ${mbColor};"></ha-icon>
            <span>${mb && mb.name ? mb.name : '主板'}</span>
          </span>
        </div>
        <div class="info-sub" style="display:flex;justify-content:space-between;align-items:center;">
          ${mbFans.length > 0 ? html`
          <div style="display:flex;flex-wrap:wrap;gap:6px;">
            ${mbFans.map(f => html`
            <span style="font-size:10px;display:flex;align-items:center;gap:2px;opacity:0.6;">
              <ha-icon icon="mdi:fan" style="--mdc-icon-size:12px;"></ha-icon>
              <b>${Math.round(f.value)} RPM</b>
            </span>
            `)}
          </div>
          ` : ''}
          ${mbTemps.length > 0 ? html`
          <div style="display:flex;align-items:center;gap:6px;">
            ${mbTemps.map(t => {
              const tColor = t.value >= 80 ? '#f44336' : t.value >= 60 ? '#FF9800' : '#4CAF50';
              return html`
            <span style="display:flex;align-items:center;gap:2px;color:${tColor};font-size:14px;font-weight:bold;">
              <ha-icon icon="mdi:thermometer" style="--mdc-icon-size:14px;"></ha-icon>
              <span>${Math.round(t.value)}°C</span>
            </span>
              `; })}
          </div>
          ` : ''}
        </div>
      </div>
    `;
  }

  _renderNetworks(d, theme) {
    const networks = d.networks || {};
    let netKeys = Object.keys(networks).sort();
    netKeys = netKeys.filter(idx => {
      if (idx === '0') return this.config.show_network_0 !== false;
      if (idx === '1') return this.config.show_network_1 !== false;
      return true;
    });
    if (netKeys.length === 0) return '';

    const isLibre = this.config.integration_mode === 'librehardwaremonitor';
    const formatBps = (bps) => {
      if (bps === undefined || isNaN(bps)) return '--';
      if (bps >= 1000000) return (bps / 1000000).toFixed(1) + ' MB/s';
      if (bps >= 1000) return (bps / 1000).toFixed(0) + ' KB/s';
      return bps.toFixed(0) + ' B/s';
    };
    const color = '#FF9800';

    return html`
      <div class="info-card" style="--card-bg: ${theme === 'light' ? '#f5f5f5' : '#3a3a3a'}; color: inherit;">
        ${netKeys.map(idx => {
          const nw = networks[idx];
          const speed = this._getEntityValue(nw.speed);
          const bpsRecv = this._getEntityValue(nw.bps_received);
          const bpsSent = this._getEntityValue(nw.bps_sent);
          const speedText = !isLibre && speed !== undefined ? this._formatSpeed(speed) : '';
          return html`
            <div style="margin-top:4px;">
              <div style="display:flex;align-items:center;justify-content:space-between;font-size:11px;font-weight:bold;">
                <span style="display:flex;align-items:center;gap:4px;"><ha-icon icon="mdi:lan" style="color:${color};--mdc-icon-size:16px;"></ha-icon>网卡${Number(idx) + 1}</span>
                ${speedText ? html`<span style="font-size:12px;color:${color};">${speedText}</span>` : ''}
              </div>
              <div class="info-sub">↑ ${formatBps(bpsSent)} &nbsp; ↓ ${formatBps(bpsRecv)}</div>
            </div>
          `;
        })}
      </div>
    `;
  }

  _renderCardsInOrder(d, theme, mode) {
    const defaultOrder = ['cpu', 'memory', 'disk', 'network', 'gpu', 'motherboard', 'screenshot'];
    const order = this.config.card_order ? [...this.config.card_order] : defaultOrder;
    const cardMap = {
      cpu: () => this._renderCpuCard(d, theme),
      memory: () => this._renderMemoryCard(d, theme),
      disk: () => this._renderDisks(d, theme),
      network: () => this._renderNetworks(d, theme),
      gpu: () => mode !== 'iotlink' && this.config.show_gpu !== false ? this._renderGpuCard(d, theme) : '',
      motherboard: () => mode !== 'iotlink' && this.config.show_motherboard !== false ? this._renderMotherboardCard(d, theme) : '',
      screenshot: () => this.config.show_screenshot !== false ? this._renderScreenshotCard(d, theme) : '',
    };
    // 合并模式下 gpu 和 motherboard 合为一张卡
    const gpuIndex = order.indexOf('gpu');
    const mbIndex = order.indexOf('motherboard');
    let merged = false;
    if (mode !== 'iotlink' && this.config.show_gpu !== false && this.config.show_motherboard !== false && this.config.merge_gpu_mb !== false && gpuIndex >= 0 && mbIndex >= 0) {
      const combinedIndex = Math.min(gpuIndex, mbIndex);
      // 从 order 中移除 gpu 和 motherboard，插入 combined 到 combinedIndex
      order.splice(Math.max(gpuIndex, mbIndex), 1);
      order.splice(combinedIndex, 1);
      order.splice(combinedIndex, 0, 'gpu_mb_combined');
      merged = true;
    }
    const result = [];
    for (const key of order) {
      if (merged && key === 'gpu_mb_combined') {
        result.push(this._renderGpuMbCombined(d, theme));
      } else if (cardMap[key]) {
        const r = cardMap[key]();
        if (r) result.push(r);
      }
    }
    return result;
  }

  _renderScreenshotCard(d, theme) {
    if (!d.screenshotEntity) return html``;

    const entity = this.hass.states[d.screenshotEntity];
    const entityState = entity?.state;
    const imgSrc = entity?.attributes?.entity_picture || '';

    // 截图地址变化时重置失败标记（例如电脑重新上线）
    if (imgSrc !== this._lastScreenshotSrc) {
      this._lastScreenshotSrc = imgSrc;
      this._screenshotFailed = false;
    }

    // 实体状态不可用、无图片地址、或之前加载失败 → 不渲染 <img>，避免 500 请求
    const badState = this._isBadState(entityState);
    if (!imgSrc || badState || this._screenshotFailed) {
      let msg = '等待截图...';
      if (badState) msg = '截图不可用';
      else if (imgSrc && this._screenshotFailed) msg = '截图不可访问';
      return html`
        <div class="screenshot-card" style="--card-bg: ${theme === 'light' ? '#f5f5f5' : '#3a3a3a'}; color: inherit; display: flex; flex-direction: column;">
          <div class="no-data" style="padding:12px;">${msg}</div>
        </div>
      `;
    }

    return html`
      <div class="screenshot-card" style="--card-bg: ${theme === 'light' ? '#f5f5f5' : '#3a3a3a'}; color: inherit; display: flex; flex-direction: column;">
        <div class="info-header">
        <img class="screenshot-img" src="${imgSrc}" alt="屏幕截图"
             @load=${() => { this._screenshotFailed = false; }}
             @error=${() => { this._screenshotFailed = true; this.requestUpdate(); }}
             @click=${() => this._openScreenshot(imgSrc)} />
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
    if (!d) {
      const isLibre = this.config.integration_mode === 'librehardwaremonitor' || this.config.integration_mode === 'fusion';
      const msg = isLibre ? '请配置计算机名称（Libre Hardware Monitor / 融合模式）' : '请配置计算机名称（IOTLink 模式）';
      return html`<div class="no-data">${msg}</div>`;
    }

    // entity 可选，未配置时不显示开关机按钮
    const entity = this.config.entity ? this.hass.states[this.config.entity] : null;
    const isOn = entity ? entity.state === 'on' : false;
    const hasEntity = !!this.config.entity && !!entity;
    const isBinarySensor = entity ? entity.entity_id.startsWith('binary_sensor.') : false;
    const hasPowerShell = !!this.config.power_on_command || !!this.config.power_off_command;
    const hasRestart = !!this.config.restart_command;
    const showPowerButtons = (hasEntity && !isBinarySensor) || hasPowerShell;

    const mode = this.config.integration_mode || 'iotlink';
    const theme = this._evaluateTheme();
    const fgColor = theme === 'light' ? 'rgb(0, 0, 0)' : 'rgb(255, 255, 255)';
    const bgColor = theme === 'light' ? 'rgb(255, 255, 255)' : 'rgb(50, 50, 50)';
    const pcName = this.config.computer_display_name || this.config.computer_name || entity?.attributes?.friendly_name || '电脑';

    return html`
      <div class="card" style="width: ${this.width}; background: ${bgColor}; color: ${fgColor};">
        <div class="card-body">
          <!-- 标题栏 -->
          <div class="title-row">
            <span>${pcName}${hasEntity ? (isOn ? '：开机' : '：关机') : ''}</span>
          </div>

          <!-- 卡片区 -->
          <div class="cards-row">
            ${this._renderCardsInOrder(d, theme, mode)}
          </div>

          <!-- 第三排: 开关机按钮（配置了 entity 或 shell 命令时渲染） -->
          ${showPowerButtons ? html`
          <div class="power-row">
            <button class="power-btn on"
              @click=${this._turnOn}
              style="opacity: ${isOn ? '0.5' : '1'};"
              ?disabled=${isOn}>
              <ha-icon icon="mdi:power"></ha-icon> 开机
            </button>
            ${hasRestart ? html`
              <button class="power-btn restart"
                @click=${this._restart}>
                <ha-icon icon="mdi:restart"></ha-icon> 重启
              </button>
            ` : ''}
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
    if (this.config.power_on_command) {
      const cmd = this.config.power_on_command.replace('shell_command.', '');
      this.hass.callService('shell_command', cmd);
    } else if (this.config.entity) {
      this.hass.callService('homeassistant', 'turn_on', { entity_id: this.config.entity });
    }
    this._handleClick();
  }

  _turnOff() {
    if (this.config.power_off_command) {
      const cmd = this.config.power_off_command.replace('shell_command.', '');
      this.hass.callService('shell_command', cmd);
    } else if (this.config.entity) {
      this.hass.callService('homeassistant', 'turn_off', { entity_id: this.config.entity });
    }
    this._handleClick();
  }

  _restart() {
    if (!this.config.restart_command) return;
    const cmd = this.config.restart_command.replace('shell_command.', '');
    this.hass.callService('shell_command', cmd);
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
customElements.define('xiaoshi-computer-card', XiaoshiComputerCard);
