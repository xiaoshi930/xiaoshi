import { LitElement, html, css } from "https://unpkg.com/lit-element@2.4.0/lit-element.js?module";

// ==================== 注册自定义卡片 ====================
window.customCards = window.customCards || [];
window.customCards.push({
  type: 'xiaoshi-ha-info-card',
  name: '消逝HA信息卡片',
  description: '消逝HA信息详细卡片',
  preview: false
});
window.customCards.push({
  type: 'xiaoshi-ha-info-button',
  name: '消逝HA信息按钮',
  description: '消逝HA信息按钮',
  preview: true
});

// ==================== 公共工具函数 ====================
function evaluateTheme(config) {
  try {
    const mode = config ? config.theme : 'system';
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

function matchPattern(str, pattern) {
  const regexPattern = pattern
    .replace(/\./g, '\\.')
    .replace(/\*/g, '.*');
  const regex = new RegExp(`^${regexPattern}$`, 'i');
  return regex.test(str);
}

function matchesExcludePattern(entityId, patterns) {
  if (!patterns || patterns.length === 0) return false;
  for (const pattern of patterns) {
    if (matchPattern(entityId, pattern)) return true;
  }
  return false;
}

function getDefaultIcon(entityId) {
  if (entityId.startsWith('light.')) return 'mdi:lightbulb';
  if (entityId.startsWith('switch.')) return 'mdi:power';
  if (entityId.startsWith('sensor.')) return 'mdi:eye';
  if (entityId.startsWith('binary_sensor.')) return 'mdi:eye';
  if (entityId.startsWith('device_tracker.')) return 'mdi:cellphone';
  if (entityId.startsWith('media_player.')) return 'mdi:speaker';
  if (entityId.startsWith('climate.')) return 'mdi:thermostat';
  if (entityId.startsWith('cover.')) return 'mdi:window-shutter';
  if (entityId.startsWith('weather.')) return 'mdi:weather-cloudy';
  if (entityId.startsWith('input_select.')) return 'mdi:form-select';
  if (entityId.startsWith('select.')) return 'mdi:form-select';
  if (entityId.startsWith('input_text.')) return 'mdi:form-textbox';
  if (entityId.startsWith('text.')) return 'mdi:form-textbox';
  if (entityId.startsWith('button.')) return 'mdi:button-pointer';
  if (entityId.startsWith('event.')) return 'mdi:gesture-tap-button';
  if (entityId.startsWith('notify.')) return 'mdi:message';
  return 'mdi:help-circle';
}

function getDeviceIcon(device, deviceEntities) {
  if (device.icon) return device.icon;
  if (device.model) {
    const model = device.model.toLowerCase();
    if (model.includes('light') || model.includes('bulb')) return 'mdi:lightbulb';
    if (model.includes('switch') || model.includes('plug')) return 'mdi:power';
    if (model.includes('sensor')) return 'mdi:eye';
    if (model.includes('camera')) return 'mdi:camera';
    if (model.includes('fan')) return 'mdi:fan';
    if (model.includes('tv')) return 'mdi:multimedia';
    if (model.includes('button')) return 'mdi:button-pointer';
    if (model.includes('thermostat') || model.includes('climate')) return 'mdi:thermostat';
  }
  if (device.manufacturer) {
    const manufacturer = device.manufacturer.toLowerCase();
    if (manufacturer.includes('xiaomi') || manufacturer.includes('aqara')) return 'mdi:home-automation';
    if (manufacturer.includes('philips')) return 'mdi:lightbulb';
    if (manufacturer.includes('tp-link')) return 'mdi:network';
  }
  if (deviceEntities && deviceEntities.length > 0) {
    return getDefaultIcon(deviceEntities[0].entity_id);
  }
  return 'mdi:device-hub';
}

function formatLastSeen(timestamp) {
  if (!timestamp) return '未知';
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);
  if (diffMins < 1) return '刚刚';
  if (diffMins < 60) return `${diffMins}分钟前`;
  if (diffHours < 24) return `${diffHours}小时前`;
  if (diffDays < 7) return `${diffDays}天前`;
  return date.toLocaleDateString('zh-CN');
}

function getDeviceLastSeen(deviceEntities, entityMap) {
  let lastSeen = null;
  for (const entityReg of deviceEntities) {
    const entity = entityMap[entityReg.entity_id];
    if (!entity) continue;
    const entityTime = new Date(entity.last_updated);
    if (!lastSeen || entityTime > lastSeen) lastSeen = entityTime;
  }
  return lastSeen;
}

function checkDeviceAvailabilitySync(device, deviceEntities, entityMap) {
  if (!deviceEntities || deviceEntities.length === 0) return false;
  if (device.disabled_by) return false;
  const validEntities = deviceEntities.filter(entityReg => {
    const entity = entityMap[entityReg.entity_id];
    return entity && !entityReg.disabled_by;
  });
  if (validEntities.length === 0) return false;
  for (const entityReg of validEntities) {
    const entity = entityMap[entityReg.entity_id];
    if (entity.state !== 'unavailable') return false;
  }
  return true;
}

async function fetchOfflineDevices(hass, config) {
  if (!hass) return { offlineDevices: [], offlineEntities: [] };

  try {
    const [devices, allEntityRegs] = await Promise.all([
      hass.callWS({ type: 'config/device_registry/list' }),
      hass.callWS({ type: 'config/entity_registry/list' })
    ]);

    const entities = Object.values(hass.states);
    const entityMap = {};
    entities.forEach(entity => { entityMap[entity.entity_id] = entity; });

    const entitiesByDevice = {};
    allEntityRegs.forEach(entity => {
      if (entity.device_id) {
        if (!entitiesByDevice[entity.device_id]) entitiesByDevice[entity.device_id] = [];
        entitiesByDevice[entity.device_id].push(entity);
      }
    });

    const offlineDevices = [];
    const excludeDevicePatterns = config.exclude_devices || [];
    const excludedDeviceIds = new Set();

    devices.forEach(device => {
      const deviceEntities = entitiesByDevice[device.id] || [];
      const isOffline = checkDeviceAvailabilitySync(device, deviceEntities, entityMap);
      if (isOffline) {
        const deviceName = device.name_by_user || device.name || `设备 ${device.id.slice(0, 8)}`;
        if (matchesExcludePattern(deviceName, excludeDevicePatterns)) {
          excludedDeviceIds.add(device.id);
          return;
        }
        const validEntities = deviceEntities.filter(entityReg => {
          const entity = entityMap[entityReg.entity_id];
          return entity && !entityReg.disabled_by;
        });
        if (validEntities.length > 0) {
          offlineDevices.push({
            device_id: device.id,
            name: deviceName,
            model: device.model,
            manufacturer: device.manufacturer,
            area_id: device.area_id,
            entities: validEntities,
            last_seen: getDeviceLastSeen(validEntities, entityMap),
            icon: getDeviceIcon(device, validEntities)
          });
        }
      }
    });

    offlineDevices.sort((a, b) => new Date(b.last_seen || 0) - new Date(a.last_seen || 0));

    const offlineDeviceEntityIds = new Set();
    offlineDevices.forEach(device => {
      device.entities.forEach(entity => { offlineDeviceEntityIds.add(entity.entity_id); });
    });

    const excludePatterns = config.exclude_entities || [];
    const offlineEntities = [];
    allEntityRegs.forEach(entityReg => {
      if (entityReg.disabled_by) return;
      const entity = entityMap[entityReg.entity_id];
      if (!entity) return;
      if (matchesExcludePattern(entityReg.entity_id, excludePatterns)) return;
      if (entityReg.device_id && excludedDeviceIds.has(entityReg.device_id)) return;
      if (entity.state === 'unavailable' && !offlineDeviceEntityIds.has(entityReg.entity_id)) {
        offlineEntities.push({
          entity_id: entityReg.entity_id,
          friendly_name: entity.attributes.friendly_name || entityReg.entity_id,
          state: entity.state,
          last_changed: entity.last_changed,
          last_updated: entity.last_updated,
          icon: entity.attributes.icon || getDefaultIcon(entityReg.entity_id),
          device_class: entity.attributes.device_class,
          unit_of_measurement: entity.attributes.unit_of_measurement,
          device_id: entityReg.device_id,
          platform: entityReg.platform
        });
      }
    });

    offlineEntities.sort((a, b) => new Date(b.last_updated) - new Date(a.last_updated));
    return { offlineDevices, offlineEntities };
  } catch (error) {
    console.error('加载离线设备失败:', error);
    return { offlineDevices: [], offlineEntities: [] };
  }
}

function fetchUpdateData(hass, config) {
  if (!hass) return { haUpdates: [], otherUpdates: [] };

  try {
    const haUpdates = [];
    const otherUpdates = [];
    try {
      const entities = Object.values(hass.states);
      const skipUpdates = config.skip_updates !== false;
      entities.forEach(entity => {
        if (entity.entity_id.startsWith('update.') && entity.state !== 'unavailable') {
          const attributes = entity.attributes;
          if (attributes.in_progress === false &&
              attributes.latest_version &&
              attributes.installed_version &&
              attributes.latest_version !== attributes.installed_version) {
            if (!skipUpdates) {
              const skippedVersion = attributes.skipped_version;
              if (skippedVersion !== null && skippedVersion === attributes.latest_version) return;
            }
            if (attributes.skipped_version === null && entity.state === 'off') return;
            const updateData = {
              name: attributes.friendly_name || entity.entity_id.replace('update.', ''),
              current_version: attributes.installed_version,
              latest_version: attributes.latest_version,
              update_type: 'entity_update',
              icon: attributes.icon || 'mdi:update',
              entity_id: entity.entity_id,
              title: attributes.title || '',
              release_url: attributes.release_url || '',
              entity_picture: attributes.entity_picture || '',
              skipped_version: attributes.skipped_version || null
            };
            if (entity.entity_id.includes('home_assistant') || entity.entity_id.includes('hacs')) {
              haUpdates.push(updateData);
            } else {
              otherUpdates.push(updateData);
            }
          }
        }
      });
    } catch (error) {
      console.warn('获取update实体更新信息失败:', error);
    }
    return { haUpdates, otherUpdates };
  } catch (error) {
    console.error('加载更新信息失败:', error);
    return { haUpdates: [], otherUpdates: [] };
  }
}

// ==================== 编辑器公共样式 ====================
const editorCommonStyles = css`
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
  select, input, textarea {
    padding: 8px;
    border: 1px solid #ddd;
    border-radius: 4px;
  }
  textarea {
    min-height: 80px;
    resize: vertical;
  }
  .help-text {
    font-size: 0.85em;
    color: #666;
    margin-top: 4px;
  }
  .entity-selector { position: relative; }
  .entity-search-input {
    width: 100%;
    padding: 8px;
    border: 1px solid #555;
    border-radius: 4px;
    box-sizing: border-box;
    background: #333;
    color: #fff;
  }
  .entity-dropdown {
    position: absolute;
    top: 100%;
    left: 0;
    right: 0;
    max-height: 300px;
    overflow-y: auto;
    background: #333;
    border: 1px solid #555;
    border-radius: 4px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.3);
    z-index: 1000;
    margin-top: 2px;
  }
  .entity-option {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 8px 12px;
    cursor: pointer;
    border-bottom: 1px solid #555;
  }
  .entity-option:hover { background: #444; }
  .entity-option.selected { background: #1a3a5c; }
  .entity-info { display: flex; align-items: center; gap: 8px; flex: 1; justify-content: space-between; }
  .entity-details { flex: 1; }
  .entity-name { font-weight: 500; font-size: 14px; color: #fff; }
  .entity-id { font-size: 12px; color: #aaa; font-family: monospace; }
  .check-icon { color: #4CAF50; }
  .no-results { padding: 12px; text-align: center; color: #aaa; font-style: italic; }
  .selected-entities { margin-top: 8px; }
  .selected-label { font-size: 12px; font-weight: bold; margin-bottom: 4px; color: #ccc; }
  .selected-entity-config {
    margin-bottom: 8px;
    border: 1px solid #555;
    border-radius: 4px;
    padding: 8px;
    background: #2a2a2a;
  }
  .selected-entity {
    display: flex;
    align-items: center;
    gap: 4px;
    margin-bottom: 8px;
    font-size: 12px;
    color: #fff;
    justify-content: space-between;
  }
  .attribute-config {
    margin-top: 4px;
    display: flex;
    flex-direction: column;
    gap: 4px;
  }
  .override-config {
    display: flex;
    align-items: center;
    gap: 4px;
    margin-top: 2px;
  }
  .override-checkbox { margin-right: 4px; }
  .override-input {
    flex: 1;
    padding: 2px 6px;
    border: 1px solid #555;
    border-radius: 3px;
    font-size: 11px;
    box-sizing: border-box;
    background: #333;
    color: #fff;
  }
  .override-label {
    font-size: 11px;
    color: #aaa;
    white-space: nowrap;
  }
  .remove-btn {
    background: none;
    border: none;
    cursor: pointer;
    padding: 0;
    display: flex;
    align-items: center;
    color: #aaa;
    margin-left: auto;
  }
  .remove-btn:hover { color: #f44336; }
  .checkbox-group {
    display: flex;
    align-items: center;
    gap: 0;
    margin: 0;
    padding: 0;
  }
  .checkbox-input { margin: 0; }
  .checkbox-label { font-weight: normal; margin: 0; }
`;

// ==================== 编辑器公共方法混入 ====================
const HaInfoEditorMixin = (superClass) => class extends superClass {

  _dispatchConfigChanged() {
    this.dispatchEvent(new CustomEvent('config-changed', {
      detail: { config: this.config },
      bubbles: true,
      composed: true
    }));
  }

  _handleEntitySearch(e) {
    this._searchText = e.target.value || '';
    this._showDropdown = true;
  }

  _getFilteredEntities() {
    if (!this.hass) return [];
    const states = Object.values(this.hass.states);
    if (!this._searchText) return states.slice(0, 50);
    const search = this._searchText.toLowerCase();
    return states.filter(s =>
      s.entity_id.toLowerCase().includes(search) ||
      (s.attributes.friendly_name && s.attributes.friendly_name.toLowerCase().includes(search))
    ).slice(0, 50);
  }

  _selectEntity(entity) {
    const currentEntities = this.config.addon_entities || [];
    if (currentEntities.some(e => e.entity_id === entity.entity_id)) return;

    const entityId = entity.entity_id;
    const dotIdx = entityId.indexOf('.');
    const rest = dotIdx >= 0 ? entityId.substring(dotIdx + 1) : entityId;
    const memIdx = rest.toLowerCase().indexOf('memory');
    const cpuIdx = rest.toLowerCase().indexOf('cpu');

    let autoName = entity.attributes?.friendly_name || entityId;
    let autoLabel = '';

    if (memIdx >= 0 && (cpuIdx < 0 || memIdx < cpuIdx)) {
      autoName = rest.substring(0, memIdx).replace(/_/g, ' ').trim() || autoName;
      autoLabel = '内存';
    } else if (cpuIdx >= 0) {
      autoName = rest.substring(0, cpuIdx).replace(/_/g, ' ').trim() || autoName;
      autoLabel = 'cpu';
    }

    this.config = {
      ...this.config,
      addon_entities: [...currentEntities, { entity_id: entity.entity_id, overrides: { name: autoName, label: autoLabel } }]
    };
    this._searchText = '';
    this._showDropdown = false;
    this._dispatchConfigChanged();
  }

  _removeEntity(index) {
    const currentEntities = [...(this.config.addon_entities || [])];
    currentEntities.splice(index, 1);
    this.config = { ...this.config, addon_entities: currentEntities };
    this._dispatchConfigChanged();
  }

  _updateEntityOverride(index, field, checked) {
    const currentEntities = [...(this.config.addon_entities || [])];
    if (checked) {
      currentEntities[index] = {
        ...currentEntities[index],
        overrides: { ...currentEntities[index].overrides, [field]: '' }
      };
    } else {
      const { [field]: _, ...rest } = (currentEntities[index].overrides || {});
      currentEntities[index] = {
        ...currentEntities[index],
        overrides: Object.keys(rest).length > 0 ? rest : undefined
      };
    }
    this.config = { ...this.config, addon_entities: currentEntities };
    this._dispatchConfigChanged();
  }

  _updateEntityOverrideValue(index, field, value) {
    const currentEntities = [...(this.config.addon_entities || [])];
    currentEntities[index] = {
      ...currentEntities[index],
      overrides: { ...currentEntities[index].overrides, [field]: value }
    };
    this.config = { ...this.config, addon_entities: currentEntities };
    this._dispatchConfigChanged();
  }

  _renderEntitySelector() {
    return html`
      <div class="form-group">
        <label>HA加载项实体：选择要监控加载项资源占用的实体</label>
        <div class="entity-selector">
          <input
            type="text"
            class="entity-search-input"
            @input=${this._handleEntitySearch}
            @focus=${this._handleEntitySearch}
            .value=${this._searchText || ''}
            placeholder="搜索实体..."
          />
          ${this._showDropdown ? html`
            <div class="entity-dropdown">
              ${this._getFilteredEntities().length > 0 ?
                this._getFilteredEntities().map(entity => html`
                  <div class="entity-option ${this.config.addon_entities?.some(e => e.entity_id === entity.entity_id) ? 'selected' : ''}"
                       @click=${() => this._selectEntity(entity)}>
                    <div class="entity-info">
                      <div class="entity-details">
                        <div class="entity-name">${entity.name || entity.entity_id}</div>
                        <div class="entity-id">${entity.entity_id}</div>
                      </div>
                      ${this.config.addon_entities?.some(e => e.entity_id === entity.entity_id) ?
                        html`<ha-icon class="check-icon" icon="mdi:check"></ha-icon>` : ''}
                    </div>
                  </div>
                `) :
                html`<div class="no-results">未找到匹配的实体</div>`
              }
            </div>
          ` : ''}
        </div>
      </div>

      ${this.config.addon_entities && this.config.addon_entities.length > 0 ? html`
        <div class="selected-entities">
          <div class="selected-label">已选择的加载项实体：</div>
          ${this.config.addon_entities.map((entityConfig, index) => {
            const entity = this.hass.states[entityConfig.entity_id];
            return html`
              <div class="selected-entity-config">
                <div class="selected-entity">
                  <span>${entity?.attributes.friendly_name || entityConfig.entity_id}</span>
                  <ha-icon icon="${entity?.attributes.icon || 'mdi:help-circle'}"></ha-icon>
                  <button class="remove-btn" @click=${() => this._removeEntity(index)}>
                    <ha-icon icon="mdi:close"></ha-icon>
                  </button>
                </div>
                <div class="attribute-config">
                  <div class="override-config">
                    <input type="checkbox" class="override-checkbox"
                      @change=${(e) => this._updateEntityOverride(index, 'name', e.target.checked)}
                      .checked=${entityConfig.overrides?.name !== undefined} />
                    <span class="override-label">名称:</span>
                    <input type="text" class="override-input"
                      @change=${(e) => this._updateEntityOverrideValue(index, 'name', e.target.value)}
                      .value=${entityConfig.overrides?.name || ''}
                      placeholder="自定义名称"
                      ?disabled=${entityConfig.overrides?.name === undefined} />
                  </div>
                  <div class="override-config">
                    <input type="checkbox" class="override-checkbox"
                      @change=${(e) => this._updateEntityOverride(index, 'label', e.target.checked)}
                      .checked=${entityConfig.overrides?.label !== undefined} />
                    <span class="override-label">标签:</span>
                    <input type="text" class="override-input"
                      @change=${(e) => this._updateEntityOverrideValue(index, 'label', e.target.value)}
                      .value=${entityConfig.overrides?.label || ''}
                      placeholder="自定义标签"
                      ?disabled=${entityConfig.overrides?.label === undefined} />
                  </div>
                </div>
              </div>
            `;
          })}
        </div>
      ` : ''}
    `;
  }

  _renderCommonEditorFields() {
    return html`
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
        <label>
          <input type="checkbox"
            @change=${this._entityChanged}
            .checked=${this.config.skip_updates !== false}
            name="skip_updates"
          />
          包含已跳过的更新
        </label>
        <div class="help-text">如果勾选，将包含标记为跳过的版本更新</div>
      </div>

      <div class="form-group">
        <label>排除离线设备：每行一个设备名称，支持通配符(*)</label>
        <textarea
          @change=${this._entityChanged}
          .value=${this.config.exclude_devices ? this.config.exclude_devices.join('\n') : ''}
          name="exclude_devices"
          placeholder="例如：&#10;*温度传感器*&#10;客厅*&#10;*测试设备"
        ></textarea>
        <div class="help-text">支持通配符匹配，例如 *客厅* 会匹配所有包含"客厅"的设备</div>
      </div>

      <div class="form-group">
        <label>排除离线实体：每行一个实体ID，支持通配符(*)</label>
        <textarea
          @change=${this._entityChanged}
          .value=${this.config.exclude_entities ? this.config.exclude_entities.join('\n') : ''}
          name="exclude_entities"
          placeholder="例如：&#10;sensor.*_temperature&#10;switch.guest_*&#10;binary_sensor.*_motion"
        ></textarea>
        <div class="help-text">支持通配符匹配，例如 sensor.* 会匹配所有以 sensor. 开头的实体</div>
      </div>

      ${this._renderEntitySelector()}
    `;
  }
};

// ==================== 主组件公共方法混入 ====================
const HaInfoBaseMixin = (superClass) => class extends superClass {

  constructor() {
    super();
    this._haUpdates = [];
    this._otherUpdates = [];
    this._offlineDevices = [];
    this._offlineEntities = [];
    this._refreshInterval = null;
    this.theme = 'system';
  }

  static get properties() {
    return {
      hass: Object,
      config: Object,
      _haUpdates: Array,
      _otherUpdates: Array,
      _offlineDevices: Array,
      _offlineEntities: Array,
      _refreshInterval: Number,
      theme: { type: String }
    };
  }

  connectedCallback() {
    super.connectedCallback();
    this._refreshData();
    this.setAttribute('theme', evaluateTheme(this.config));
    this._refreshInterval = setInterval(() => {
      this._refreshData();
    }, 300000);
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    if (this._refreshInterval) {
      clearInterval(this._refreshInterval);
    }
  }

  async _refreshData() {
    const updateResult = fetchUpdateData(this.hass, this.config);
    this._haUpdates = updateResult.haUpdates;
    this._otherUpdates = updateResult.otherUpdates;

    const offlineResult = await fetchOfflineDevices(this.hass, this.config);
    this._offlineDevices = offlineResult.offlineDevices;
    this._offlineEntities = offlineResult.offlineEntities;
  }

  _evaluateTheme() {
    return evaluateTheme(this.config);
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

  _getDefaultIcon(entityId) {
    return getDefaultIcon(entityId);
  }

  _formatLastSeen(timestamp) {
    return formatLastSeen(timestamp);
  }
};

// ==================== 按钮编辑器 ====================
class XiaoshiHaInfoButtonEditor extends HaInfoEditorMixin(LitElement) {
  static get properties() {
    return {
      hass: { type: Object },
      config: { type: Object },
      _searchText: { type: String },
      _showDropdown: { type: Boolean }
    };
  }

  static get styles() {
    return editorCommonStyles;
  }

  render() {
    if (!this.hass) return html``;

    return html`
      <div class="checkbox-group">
        <input type="checkbox" class="checkbox-input"
          @change=${this._entityChanged}
          .checked=${this.config.badge_mode === true}
          name="badge_mode" id="badge_mode"
        />
        <label for="badge_mode" class="checkbox-label" style="color: orange; font-weight: bold;">
          🏷️ 角标模式（勾选后只显示图标，数量>0时显示红色角标）
        </label>
      </div>

      <div class="checkbox-group">
        <input type="checkbox" class="checkbox-input"
          @change=${this._entityChanged}
          .checked=${this.config.auto_hide === true}
          name="auto_hide" id="auto_hide"
        />
        <label for="auto_hide" class="checkbox-label" style="color: orange; font-weight: bold;">
          🚫 自动隐藏（勾选后数量为0时完全不显示）
        </label>
      </div>

      <div class="form-group">
        <label>按钮显示文本
        <input type="text"
          @change=${this._entityChanged}
          .value=${this.config.button_text !== undefined ? this.config.button_text : 'HA'}
          name="button_text" placeholder="HA"
        /></label>
      </div>

      <div class="form-group">
        <label>按钮显示图标
        <input type="text"
          @change=${this._entityChanged}
          .value=${this.config.button_icon !== undefined ? this.config.button_icon : './icon/homeassistant.svg'}
          name="button_icon" placeholder="./icon/homeassistant.svg"
        /></label>
      </div>

      <div class="checkbox-group">
        <input type="checkbox" class="checkbox-input"
          @change=${this._entityChanged}
          .checked=${this.config.transparent_bg === true}
          name="transparent_bg" id="transparent_bg"
        />
        <label for="transparent_bg" class="checkbox-label">
          （平板端特性）透明背景（勾选后按钮背景透明）
        </label>
      </div>

      <div class="checkbox-group">
        <input type="checkbox" class="checkbox-input"
          @change=${this._entityChanged}
          .checked=${this.config.lock_white_fg === true}
          name="lock_white_fg" id="lock_white_fg"
        />
        <label for="lock_white_fg" class="checkbox-label">
          （平板端特性）白色图标文字（勾选后锁定显示白色）
        </label>
      </div>

      <div class="checkbox-group">
        <input type="checkbox" class="checkbox-input"
          @change=${this._entityChanged}
          .checked=${this.config.hide_icon === true}
          name="hide_icon" id="hide_icon"
        />
        <label for="hide_icon" class="checkbox-label">
          （平板端特性）隐藏图标（勾选后隐藏图标）
        </label>
      </div>

      <div class="checkbox-group">
        <input type="checkbox" class="checkbox-input"
          @change=${this._entityChanged}
          .checked=${this.config.hide_colon === true}
          name="hide_colon" id="hide_colon"
        />
        <label for="hide_colon" class="checkbox-label">
          （平板端特性）隐藏冒号（勾选后不显示冒号，改为空格）
        </label>
      </div>

      <div class="checkbox-group">
        <input type="checkbox" class="checkbox-input"
          @change=${this._entityChanged}
          .checked=${this.config.hide_zero === true}
          name="hide_zero" id="hide_zero"
        />
        <label for="hide_zero" class="checkbox-label">
          （平板端特性）隐藏0值（勾选后数量为0时不显示数量）
        </label>
      </div>

      <div class="form-group">
        <label>按钮宽度：默认16.8vw, 支持像素(px)和百分比(%)</label>
        <input type="text"
          @change=${this._entityChanged}
          .value=${this.config.button_width !== undefined ? this.config.button_width : '16.8vw'}
          name="button_width" placeholder="默认16.8vw"
        />
      </div>

      <div class="form-group">
        <label>按钮高度：支持像素(px)、百分比(%)和视窗高度(vh)，默认24px</label>
        <input type="text"
          @change=${this._entityChanged}
          .value=${this.config.button_height !== undefined ? this.config.button_height : '24px'}
          name="button_height" placeholder="默认24px"
        />
      </div>

      <div class="form-group">
        <label>按钮文字大小：支持像素(px)，默认11px</label>
        <input type="text"
          @change=${this._entityChanged}
          .value=${this.config.button_font_size !== undefined ? this.config.button_font_size : '11px'}
          name="button_font_size" placeholder="默认11px"
        />
      </div>

      <div class="form-group">
        <label>按钮图标大小：支持像素(px)，默认13px</label>
        <input type="text"
          @change=${this._entityChanged}
          .value=${this.config.button_icon_size !== undefined ? this.config.button_icon_size : '13px'}
          name="button_icon_size" placeholder="默认13px"
        />
      </div>

      <div class="form-group">
        <label>点击动作：点击按钮时触发的动作</label>
        <select
          @change=${this._entityChanged}
          .value=${this.config.tap_action !== 'none' ? 'tap_action' : 'none'}
          name="tap_action"
        >
          <option value="tap_action">弹出HA信息卡片（默认）</option>
          <option value="none">无动作</option>
        </select>
      </div>

      <div class="form-group">
        <label>👇👇👇下方弹出的卡片可增加的其他卡片👇👇👇</label>
        <textarea
          @change=${this._entityChanged}
          .value=${this.config.other_cards || ''}
          name="other_cards"
          placeholder='# 示例配置：添加button卡片
- type: custom:button-card
template: 测试模板(最好引用模板，否则大概率会报错)
- type: custom:button-card
template: 测试模板(最好引用模板，否则大概率会报错)'
        ></textarea>
      </div>

      <div class="form-group">
        <label>👇👇👇下方是弹出的主卡配置项👇👇👇</label>
      </div>

      <div class="form-group">
        <label>弹窗宽度：支持像素(px)、百分比(%)和auto，默认100%</label>
        <input type="text"
          @change=${this._entityChanged}
          .value=${this.config.popup_width !== undefined ? this.config.popup_width : '100%'}
          name="popup_width" placeholder="默认100%"
        />
      </div>

      <div class="form-group">
        <label>弹窗位置：支持百分比(%)和像素(px)，默认20px</label>
        <input type="text"
          @change=${this._entityChanged}
          .value=${this.config.popup_top !== undefined ? this.config.popup_top : '20px'}
          name="popup_top" placeholder="默认20px"
        />
      </div>

      ${this._renderCommonEditorFields()}
    `;
  }

  _entityChanged(e) {
    const { name, value, type, checked } = e.target;
    let finalValue;

    if (type === 'checkbox') {
      finalValue = checked;
    } else {
      if (!value && name !== 'theme' && name !== 'button_width' && name !== 'button_height' && name !== 'button_font_size' && name !== 'button_icon_size' && name !== 'popup_width' && name !== 'popup_top' && name !== 'tap_action' && name !== 'display_mode' && name !== 'decimal_precision') return;
      finalValue = value;
    }

    if (name === 'button_width') {
      finalValue = value || '16.8vw';
    } else if (name === 'button_height') {
      finalValue = value || '24px';
    } else if (name === 'button_font_size') {
      finalValue = value || '11px';
    } else if (name === 'button_icon_size') {
      finalValue = value || '13px';
    } else if (name === 'exclude_entities') {
      finalValue = value ? value.split('\n').filter(line => line.trim()).map(line => line.trim()) : [];
    } else if (name === 'exclude_devices') {
      finalValue = value ? value.split('\n').filter(line => line.trim()).map(line => line.trim()) : [];
    } else if (name === 'tap_action') {
      if (value === 'tap_action') {
        finalValue = undefined;
      } else {
        finalValue = value;
      }
    }

    this.config = { ...this.config, [name]: finalValue };
    this._dispatchConfigChanged();
  }

  setConfig(config) {
    this.config = config;
  }
}
customElements.define('xiaoshi-ha-info-button-editor', XiaoshiHaInfoButtonEditor);

// ==================== HA信息按钮 ====================
class XiaoshiHaInfoButton extends HaInfoBaseMixin(LitElement) {
  static get styles() {
    return css`
      :host { display: block; }
      .ha-info-status {
        width: var(--button-width, 65px);
        height: var(--button-height, 24px);
        padding: 0; margin: 0;
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
        gap: 0;
        cursor: pointer;
        transition: background-color 0.2s, transform 0.1s;
        position: relative;
      }
      .status-emoji {
        font-size: var(--button-icon-size, 13px);
        line-height: 1;
        color: var(--fg-color, #000);
        margin-right: 6px;
      }
      .status-emoji img {
        width: var(--button-icon-size, 13px);
        height: var(--button-icon-size, 13px);
        vertical-align: middle;
        object-fit: contain;
      }
      .ha-info-status.badge-mode {
        width: var(--button-width, 65px);
        height: var(--button-height, 24px);
        border-radius: 10px;
        padding: 0; margin: 0;
        display: flex; align-items: center; justify-content: center;
      }
      .ha-info-status.badge-mode .status-emoji { color: rgb(128, 128, 128); transition: color 0.2s; }
      .ha-info-status.badge-mode.has-warning .status-emoji { color: rgb(255, 0, 0); }
      .badge-number {
        position: absolute; top: -6px; right: -6px;
        min-width: 12px; height: 12px;
        background: rgb(255, 0, 0); color: rgb(255, 255, 255);
        border-radius: 50%; font-size: 8px; font-weight: bold;
        display: flex; align-items: center; justify-content: center;
        padding: 0; box-sizing: border-box; line-height: 1;
      }
    `;
  }

  static getConfigElement() {
    return document.createElement("xiaoshi-ha-info-button-editor");
  }

  _handleButtonClick() {
    const tapAction = this.config.tap_action;
    if (!tapAction || tapAction !== 'none') {
      const excludedParams = ['type', 'button_height', 'button_width', 'button_font_size', 'button_icon_size', 'show_preview', 'tap_action', 'popup_top', 'popup_width', 'badge_mode', 'auto_hide', 'button_text', 'button_icon', 'transparent_bg', 'lock_white_fg', 'hide_icon', 'hide_colon', 'hide_zero', 'other_cards'];
      const cards = [];
      const hainfoCardConfig = {};
      Object.keys(this.config).forEach(key => {
        if (!excludedParams.includes(key)) hainfoCardConfig[key] = this.config[key];
      });
      cards.push({ type: 'custom:xiaoshi-ha-info-card', ...hainfoCardConfig });

      if (this.config.other_cards && this.config.other_cards.trim()) {
        try {
          const additionalCardsConfig = this._parseYamlCards(this.config.other_cards);
          const cardsWithTheme = additionalCardsConfig.map(card => {
            if (!card.theme && this.config.theme) return { ...card, theme: this.config.theme };
            return card;
          });
          cards.push(...cardsWithTheme);
        } catch (error) {
          console.error('解析附加卡片配置失败:', error);
        }
      }

      const serviceData = { card: cards };
      const popupWidth = this.config.popup_width || '95%';
      const popupTop = this.config.popup_top || '20px';
      if (popupWidth !== '95%') serviceData.popup_width = popupWidth;
      if (popupTop !== '20px') serviceData.popup_top = popupTop;
      this.hass.callService('popup_card', 'show', serviceData);
    }
    this._handleClick();
  }

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
      console.error('YAML解析错误:', error);
      return [];
    }
  }

  _parseValue(value) {
    if (!value) return '';
    if ((value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))) {
      return value.slice(1, -1);
    }
    if (!isNaN(value) && value.trim() !== '') return Number(value);
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
      if (!current[key] || typeof current[key] !== 'object') current[key] = {};
      current = current[key];
    }
    current[keys[keys.length - 1]] = value;
  }

  render() {
    if (!this.hass) return html`<div></div>`;
    const theme = this._evaluateTheme();
    const fgColor = theme === 'light' ? 'rgb(0, 0, 0)' : 'rgb(255, 255, 255)';
    const warningCount = this._haUpdates.length + this._otherUpdates.length + this._offlineDevices.length + this._offlineEntities.length;

    const badgeMode = this.config.badge_mode === true;
    const transparentBg = this.config.transparent_bg === true;
    const hideIcon = this.config.hide_icon === true;
    const hideColon = this.config.hide_colon === true;
    const hideZero = this.config.hide_zero === true;
    const autoHide = this.config.auto_hide === true;
    const lockWhiteFg = this.config.lock_white_fg === true;
    const buttonText = this.config.button_text || 'HA';
    const buttonIcon = this.config.button_icon || '/xiaoshi/xiaoshi-card/icon/homeassistant.svg';
    const buttonBgColor = transparentBg ? 'transparent' : theme === 'light' ? 'rgb(255, 255, 255, 0.6)' : 'rgb(83, 83, 83, 0.6)';

    if (autoHide && warningCount === 0) return html`<div></div>`;

    if (badgeMode) {
      const hasWarning = warningCount > 0;
      return html`
        <div class="ha-info-status badge-mode ${hasWarning ? 'has-warning' : ''}" style="--bg-color: ${buttonBgColor};" @click=${this._handleButtonClick}>
          <span class="status-emoji">${buttonIcon.startsWith('./') || buttonIcon.startsWith('/') || buttonIcon.startsWith('http') ? html`<img src="${buttonIcon}" />` : buttonIcon}</span>
          ${hasWarning ? html`<div class="badge-number">${warningCount}</div>` : ''}
        </div>
      `;
    } else {
      let textColor, iconColor;
      if (warningCount === 0) {
        textColor = lockWhiteFg ? 'rgb(255, 255, 255)' : fgColor;
        iconColor = lockWhiteFg ? 'rgb(255, 255, 255)' : fgColor;
      } else {
        textColor = 'rgb(255, 0, 0)';
        iconColor = lockWhiteFg ? 'rgb(255, 255, 255)' : fgColor;
      }
      let displayText = buttonText;
      displayText += hideColon ? ' ' : ':';
      displayText += (hideZero && warningCount === 0) ? '\u2002' : ` ${warningCount}`;

      return html`
        <div class="ha-info-status" style="--fg-color: ${textColor}; --bg-color: ${buttonBgColor};" @click=${this._handleButtonClick}>
          ${!hideIcon ? html`<span class="status-emoji" style="color: ${iconColor};">${buttonIcon.startsWith('./') || buttonIcon.startsWith('/') || buttonIcon.startsWith('http') ? html`<img src="${buttonIcon}" />` : buttonIcon}</span>` : ''}
          ${displayText}
        </div>
      `;
    }
  }

  setConfig(config) {
    this.config = { ...config };
    this.style.setProperty('--button-width', config.button_width || '16.8vw');
    this.style.setProperty('--button-height', config.button_height || '24px');
    this.style.setProperty('--button-font-size', config.button_font_size || '11px');
    this.style.setProperty('--button-icon-size', config.button_icon_size || '13px');
    if (config.theme) this.setAttribute('theme', config.theme);
  }

  getCardSize() {
    return 1;
  }
}
customElements.define('xiaoshi-ha-info-button', XiaoshiHaInfoButton);

// ==================== 卡片编辑器 ====================
class XiaoshiHaInfoCardEditor extends HaInfoEditorMixin(LitElement) {
  static get properties() {
    return {
      hass: { type: Object },
      config: { type: Object },
      _searchText: { type: String },
      _showDropdown: { type: Boolean }
    };
  }

  static get styles() {
    return editorCommonStyles;
  }

  render() {
    if (!this.hass) return html``;
    return html`
      <div class="form">
        <div class="form-group">
          <label>卡片宽度：支持像素(px)和百分比(%)，默认100%</label>
          <input
            type="text"
            @change=${this._entityChanged}
            .value=${this.config.width !== undefined ? this.config.width : '100%'}
            name="width"
            placeholder="默认100%"
          />
        </div>
        ${this._renderCommonEditorFields()}
      </div>
    `;
  }

  _entityChanged(e) {
    const { name, value, type, checked } = e.target;
    let finalValue;

    if (type === 'checkbox') {
      finalValue = checked;
    } else {
      if (!value && name !== 'theme' && name !== 'width') return;
      finalValue = value;
    }

    if (name === 'width') {
      finalValue = value || '100%';
    } else if (name === 'exclude_entities') {
      finalValue = value ? value.split('\n').filter(line => line.trim()).map(line => line.trim()) : [];
    } else if (name === 'exclude_devices') {
      finalValue = value ? value.split('\n').filter(line => line.trim()).map(line => line.trim()) : [];
    }

    this.config = { ...this.config, [name]: finalValue };
    this._dispatchConfigChanged();
  }

  setConfig(config) {
    this.config = config;
  }
}
customElements.define('xiaoshi-ha-info-card-editor', XiaoshiHaInfoCardEditor);
// ==================== HA信息卡片 ====================
class XiaoshiHaInfoCard extends HaInfoBaseMixin(LitElement) {
  static get properties() {
    return {
      ...super.properties,
      _loading: Boolean
    };
  }

  static get styles() {
    return css`
      :host {
        display: block;
        width: var(--card-width, 100%);
      }
      ha-card {
        width: 100%;
        height: 100%;
        display: flex;
        flex-direction: column;
        background: var(--bg-color, #fff);
        border-radius: 12px;
      }
      .card-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 16px;
        background: var(--bg-color, #fff);
        border-radius: 12px;
      }
      .offline-indicator {
        display: inline-block;
        width: 8px;
        height: 8px;
        border-radius: 50%;
        margin-right: 8px;
      }
      @keyframes pulse {
        0% { opacity: 1; }
        50% { opacity: 0.5; }
        100% { opacity: 1; }
      }
      .card-title {
        font-size: 20px;
        font-weight: 500;
        color: var(--fg-color, #000);
        height: 30px;
        line-height: 30px;
        display: flex;
        align-items: center;
        justify-content: center;
      }
      .device-count {
        color: var(--fg-color, #000);
        border-radius: 8px;
        font-size: 13px;
        width: 30px;
        height: 30px;
        text-align: center;
        line-height: 30px;
        font-weight: bold;
        padding: 0px;
      }
      .device-count.non-zero { background: rgb(255, 0, 0, 0.5); }
      .device-count.zero { background: rgb(0, 205, 0); }
      .refresh-btn {
        color: var(--fg-color, #fff);
        border: none;
        border-radius: 8px;
        padding: 5px;
        cursor: pointer;
        font-size: 13px;
        width: 50px;
        height: 30px;
        line-height: 30px;
        text-align: center;
        font-weight: bold;
        padding: 0px;
      }
      .section-divider {
        margin: 0 0 8px 0;
        padding: 8px 16px;
        background: var(--bg-color, #fff);
        font-weight: 500;
        color: var(--fg-color, #000);
        border-top: 1px solid rgb(150,150,150,0.5);
        border-bottom: 1px solid rgb(150,150,150,0.5);
        margin: 0 16px 0 16px;
      }
      .section-title {
        display: flex;
        align-items: center;
        justify-content: space-between;
        color: var(--fg-color, #000);
        font-size: 13px;
      }
      .section-count {
        background: rgb(255,0,0,0.5);
        color: var(--fg-color, #000);
        border-radius: 12px;
        width: 15px;
        height: 15px;
        text-align: center;
        line-height: 15px;
        padding: 3px;
        font-size: 12px;
        font-weight: bold;
      }
      .device-item {
        display: flex;
        align-items: center;
        padding: 0px;
        border-bottom: 1px solid rgb(150,150,150,0.2);
        margin: 0 32px 4px 32px;
        padding: 4px 0 0 0;
      }
      .devices-list {
        flex: 1;
        overflow-y: auto;
        min-height: 0;
        padding: 4px 0;
      }
      .device-icon { margin-right: 12px; color: var(--error-color); }
      .device-info { flex-grow: 1; }
      .device-name { font-weight: 500; color: var(--fg-color, #000); margin: 2px 0; }
      .device-entity { font-size: 10px; color: var(--fg-color, #000); font-family: monospace; }
      .device-details { font-size: 10px; color: var(--fg-color, #000); }
      .device-last-seen-update {
        font-size: 10px;
        color: var(--fg-color, #000);
        padding: 5px;
        background: rgb(255, 0, 0, 0.1);
        border: 1px solid rgb(255, 0, 0, 0.3);
        border-radius: 4px;
        cursor: pointer;
        white-space: nowrap;
        transition: background-color 0.2s;
      }
      .device-last-seen-update:hover { background: rgb(255, 0, 0, 0.2); }
      .device-last-seen { font-size: 10px; color: var(--fg-color, #000); margin-left: auto; }
      .no-devices { text-align: center; padding: 8px 0; color: var(--fg-color, #000); }
      .loading { text-align: center; padding: 10px 0px; color: var(--fg-color, #000); }
      .ha-version-info {
        padding: 4px 0 4px 16px;
        margin: 0 16px 0 30px;
        display: grid;
        grid-template-columns: auto auto auto;
        gap: 4px;
        align-items: center;
      }
      .version-label { font-size: 10px; color: var(--fg-color, #000); text-align: left; }
      .current-version {
        color: var(--fg-color, #000);
        font-size: 10px;
        text-align: left;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      .current-version.outdated { color: rgb(255,20,0); }
      .latest-version {
        color: var(--fg-color, #000);
        font-size: 10px;
        text-align: left;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      .warning-message { color: #ff6b6b; font-size: 10px; font-style: italic; }
      .backup-label { font-size: 10px; color: var(--fg-color, #000); text-align: left; }
      .backup-time, .backup-relative {
        color: var(--fg-color, #000);
        font-size: 10px;
        text-align: left;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      .backup-separator {
        grid-column: 1 / -1;
        height: 1px;
        background: rgb(150,150,150,0.2);
        margin: 0px 0px;
      }
      .backup-info {
        padding: 4px 0 4px 16px;
        margin: 0 32px 8px 32px;
        display: grid;
        grid-template-columns: auto auto auto;
        gap: 4px;
        align-items: center;
        border-bottom: 1px solid rgb(150,150,150,0.2);
      }
      .resource-usage-info {
        padding: 4px 16px;
        margin: 0 16px 8px 24px;
        display: flex;
        gap: 8px;
        justify-content: flex-start;
        border-bottom: 1px solid rgb(150,150,150,0.2);
      }
      .resource-item { display: flex; flex-direction: row; align-items: center; gap: 4px; }
      .resource-bar-container {
        width: 10px;
        height: 32px;
        background: rgb(150,150,150,0.2);
        border-radius: 1px;
        overflow: hidden;
        display: flex;
        align-items: flex-end;
        flex-shrink: 0;
      }
      .resource-bar-fill { width: 100%; border-radius: 1px; transition: height 0.5s ease; }
      .resource-text-wrap { display: flex; flex-direction: column; justify-content: center; }
      .resource-label {
        font-size: 10px;
        color: var(--fg-color, #000);
        text-align: left;
        white-space: nowrap;
        line-height: 1.2;
      }
      .resource-percent {
        font-size: 10px;
        color: var(--fg-color, #000);
        text-align: left;
        font-weight: bold;
        line-height: 1.2;
        white-space: nowrap;
      }
      .resource-disk-text {
        font-size: 9px;
        color: var(--fg-color, #000);
        text-align: left;
        white-space: nowrap;
        line-height: 1.2;
      }
      .ha-restart-buttons { display: flex; justify-content: flex-end; gap: 6px; margin-right: -12px; }
      .ha-restart-btn {
        font-size: 10px;
        padding: 3px 8px;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        font-weight: 500;
        white-space: nowrap;
        transition: opacity 0.2s;
      }
      .ha-restart-btn:hover { opacity: 0.85; }
      .ha-restart-btn.yellow { background: rgba(255, 193, 7, 0.9); color: #333; }
      .ha-restart-btn.red { background: rgba(244, 67, 54, 0.9); color: #fff; }
      .ha-restart-btn.blue { background: rgba(33, 150, 243, 0.9); color: #fff; }
    `;
  }

  constructor() {
    super();
    this._loading = false;
    this._injectConfirmStyles();
  }

  _injectConfirmStyles() {
    if (document.getElementById('xiaoshi-confirm-dialog-style')) return;
    const style = document.createElement('style');
    style.id = 'xiaoshi-confirm-dialog-style';
    style.textContent = `
      @keyframes xiaoshiConfirmIn {
        from { opacity: 0; transform: scale(0.95); }
        to   { opacity: 1; transform: scale(1); }
      }
    `;
    document.head.appendChild(style);
  }

  static getConfigElement() {
    return document.createElement("xiaoshi-ha-info-card-editor");
  }

  async _refreshData() {
    this._loading = true;
    this.requestUpdate();

    const updateResult = fetchUpdateData(this.hass, this.config);
    this._haUpdates = updateResult.haUpdates;
    this._otherUpdates = updateResult.otherUpdates;

    const offlineResult = await fetchOfflineDevices(this.hass, this.config);
    this._offlineDevices = offlineResult.offlineDevices;
    this._offlineEntities = offlineResult.offlineEntities;

    this._loading = false;
  }

  _handleRefresh() {
    this._handleClick();
    this._refreshData();
  }

  _handleDeviceClick(device) {
    this._handleClick();
    if (device.device_id) {
      this._closeCurrentDialog();
      setTimeout(() => {
        const deviceUrl = `/config/devices/device/${device.device_id}`;
        try {
          window.history.pushState(null, '', deviceUrl);
          window.dispatchEvent(new CustomEvent('location-changed'));
        } catch (e) {
          window.open(deviceUrl, '_blank', 'noopener,noreferrer');
        }
      }, 300);
    }
  }

  _handleEntityClick(entity) {
    this._handleClick();
    if (entity.entity_id) {
      const evt = new Event('hass-more-info', { composed: true });
      evt.detail = { entityId: entity.entity_id };
      this.dispatchEvent(evt);
    }
  }

  _closeCurrentDialog() {
    const dialogs = document.querySelectorAll('ha-dialog, .mdc-dialog, paper-dialog, vaadin-dialog');
    dialogs.forEach(dialog => { if (dialog && dialog.open) dialog.close(); });
    const moreUIs = document.querySelectorAll('ha-more-info-dialog, .ha-more-info-dialog');
    moreUIs.forEach(ui => { if (ui && ui.close) ui.close(); });
    if (window.history.length > 1) window.history.back();
  }

  _handleUpdateClick(update) {
    this._handleClick();
    if (update.entity_id) {
      this.dispatchEvent(new CustomEvent('hass-more-info', {
        detail: { entityId: update.entity_id },
        bubbles: true,
        composed: true
      }));
    } else {
      if (update.update_type === 'version') {
        alert(`${update.name}\n当前版本: ${update.current_version}\n最新版本: ${update.latest_version}\n\n请点击右侧的"立即更新"按钮进行更新`);
      }
    }
  }

  _handleConfirmUpdate(update, event) {
    event.stopPropagation();
    event.preventDefault();
    this._handleClick();
    const confirmed = confirm(`确认要更新 ${update.name} 吗？\n当前版本: ${update.current_version}\n最新版本: ${update.latest_version}`);
    if (confirmed) {
      this._executeUpdate(update);
      setTimeout(() => { this._refreshData(); }, 1000);
    }
  }

  _executeUpdate(update) {
    if (update.update_type === 'version') {
      if (update.name.includes('Core')) {
        this._callUpdateService('homeassistant', 'core', 'update');
      } else if (update.name.includes('Supervisor')) {
        this._callUpdateService('hassio', 'supervisor', 'update');
      } else if (update.name.includes('OS')) {
        this._callUpdateService('hassio', 'os', 'update');
      }
    } else if (update.update_type.startsWith('hacs')) {
      this.hass.callService('hacs', 'download', {
        repository: update.name.replace('HACS - ', '')
      });
    } else if (update.update_type === 'entity_update') {
      this.hass.callService('update', 'install', { entity_id: update.entity_id });
    }
  }

  _callUpdateService(domain, service, action) {
    try {
      this.hass.callService(domain, service, { [action]: true });
    } catch (error) {
      console.error(`调用更新服务失败: ${domain}.${service}`, error);
    }
  }

  _formatDateTime(dateString) {
    if (!dateString || dateString === 'unknown' || dateString === '未知') return '无';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return '无';
      return date.toLocaleString('zh-CN', {
        timeZone: 'Asia/Shanghai',
        year: 'numeric', month: '2-digit', day: '2-digit',
        hour: '2-digit', minute: '2-digit', hour12: false
      }).replace(/\//g, '-');
    } catch (error) {
      return '无';
    }
  }

  _getRelativeTime(dateString, isFuture = false) {
    if (!dateString || dateString === 'unknown' || dateString === '未知') return '无';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return '无';
      const now = new Date();
      const diffMs = isFuture ? date.getTime() - now.getTime() : now.getTime() - date.getTime();
      const diffHours = Math.abs(Math.floor(diffMs / (1000 * 60 * 60)));
      if (diffHours >= 24) {
        return `${Math.floor(diffHours / 24)}天${isFuture ? '后' : '前'}`;
      } else {
        return `${diffHours}小时${isFuture ? '后' : '前'}`;
      }
    } catch (error) {
      return '无';
    }
  }

  _renderHAVersionInfo() {
    if (!this.hass) return html``;
    const versionElements = [];

    const osEntity = this.hass.states['update.home_assistant_operating_system_update'];
    if (osEntity) {
      const current = osEntity.attributes.installed_version || '未知';
      const latest = osEntity.attributes.latest_version || '未知';
      const cls = (current !== '未知' && latest !== '未知' && current !== latest) ? 'outdated' : '';
      versionElements.push(html`
        <div class="version-label">OS</div>
        <div class="current-version ${cls}">当前版本：${current}</div>
        <div class="latest-version">最新版本：${latest}</div>
      `);
    }

    const coreEntity = this.hass.states['update.home_assistant_core_update'];
    if (coreEntity) {
      const current = coreEntity.attributes.installed_version || '未知';
      const latest = coreEntity.attributes.latest_version || '未知';
      const cls = (current !== '未知' && latest !== '未知' && current !== latest) ? 'outdated' : '';
      versionElements.push(html`
        <div class="version-label">Core</div>
        <div class="current-version ${cls}">当前版本：${current}</div>
        <div class="latest-version">最新版本：${latest}</div>
      `);
    }

    const supervisorEntity = this.hass.states['update.home_assistant_supervisor_update'];
    if (supervisorEntity) {
      const current = supervisorEntity.attributes.installed_version || '未知';
      const latest = supervisorEntity.attributes.latest_version || '未知';
      const cls = (current !== '未知' && latest !== '未知' && current !== latest) ? 'outdated' : '';
      versionElements.push(html`
        <div class="version-label">Supervisor</div>
        <div class="current-version ${cls}">当前版本：${current}</div>
        <div class="latest-version">最新版本：${latest}</div>
      `);
    }

    return html`${versionElements}`;
  }

  _renderBackupInfo() {
    if (!this.hass) return html``;
    const backupElements = [];

    const lastBackupEntity = this.hass.states['sensor.backup_last_successful_automatic_backup'];
    if (lastBackupEntity && lastBackupEntity.state !== 'unavailable' && lastBackupEntity.state !== 'unknown') {
      const lastBackupTime = this._formatDateTime(lastBackupEntity.state);
      const lastBackupRelative = this._getRelativeTime(lastBackupEntity.state, false);
      const combined = lastBackupRelative !== '无' ? `${lastBackupTime}（${lastBackupRelative}）` : lastBackupTime;
      backupElements.push(html`
        <div class="backup-label">上次备份</div>
        <div class="backup-time" style="grid-column: 2 / -1;">${combined}</div>
      `);
    }

    const nextBackupEntity = this.hass.states['sensor.backup_next_scheduled_automatic_backup'];
    if (nextBackupEntity && nextBackupEntity.state !== 'unavailable' && nextBackupEntity.state !== 'unknown') {
      const nextBackupTime = this._formatDateTime(nextBackupEntity.state);
      const nextBackupRelative = this._getRelativeTime(nextBackupEntity.state, true);
      const combined = nextBackupRelative !== '无' ? `${nextBackupTime}（${nextBackupRelative}）` : nextBackupTime;
      backupElements.push(html`
        <div class="backup-label">下次备份</div>
        <div class="backup-time" style="grid-column: 2 / -1;">${combined}</div>
      `);
    }

    return html`${backupElements}`;
  }

  _renderResourceUsage() {
    if (!this.hass) return html``;

    const coreCpu = this.hass.states['sensor.home_assistant_core_cpu_percent'];
    const coreMem = this.hass.states['sensor.home_assistant_core_memory_percent'];
    const supCpu = this.hass.states['sensor.home_assistant_supervisor_cpu_percent'];
    const supMem = this.hass.states['sensor.home_assistant_supervisor_memory_percent'];
    const diskUsed = this.hass.states['sensor.home_assistant_host_disk_used'];
    const diskTotal = this.hass.states['sensor.home_assistant_host_disk_total'];

    const getPercent = (sensor) => {
      if (!sensor || sensor.state === 'unavailable' || sensor.state === 'unknown') return null;
      const v = parseFloat(sensor.state);
      return isNaN(v) ? null : Math.round(v);
    };

    const getBarColor = (pct) => {
      if (pct >= 80) return 'rgb(255,50,50)';
      if (pct >= 50) return 'rgb(255,165,0)';
      return 'rgb(0,200,80)';
    };

    const renderBar = (name, label, value) => {
      if (value === null) {
        return html`
          <div class="resource-item">
            <div class="resource-bar-container">
              <div class="resource-bar-fill" style="height: 0%; background: rgb(150,150,150,0.3);"></div>
            </div>
            <div class="resource-text-wrap">
              <div class="resource-label">${name}</div>
              <div class="resource-label">${label}</div>
              <div class="resource-percent">N/A</div>
            </div>
          </div>
        `;
      }
      return html`
        <div class="resource-item">
          <div class="resource-bar-container">
            <div class="resource-bar-fill" style="height: ${Math.min(100, value)}%; background: ${getBarColor(value)};"></div>
          </div>
          <div class="resource-text-wrap">
            <div class="resource-label">${name}</div>
            <div class="resource-label">${label}</div>
            <div class="resource-percent">${value}%</div>
          </div>
        </div>
      `;
    };

    const formatSize = (sensor) => {
      if (!sensor || sensor.state === 'unavailable' || sensor.state === 'unknown') return null;
      const v = parseFloat(sensor.state);
      if (isNaN(v)) return null;
      const unit = (sensor.attributes && sensor.attributes.unit_of_measurement) || '';
      const unitLower = unit.toLowerCase();
      if (unitLower.includes('gib') || unitLower.includes('gb')) return v.toFixed(1) + 'G';
      if (unitLower.includes('mib') || unitLower.includes('mb')) return (v / 1024).toFixed(1) + 'G';
      if (unitLower.includes('tib') || unitLower.includes('tb')) return (v * 1024).toFixed(0) + 'G';
      if (unitLower.includes('kib') || unitLower.includes('kb')) return (v / (1024 * 1024)).toFixed(2) + 'G';
      if (v > 1000) return (v / 1024).toFixed(1) + 'G';
      return v.toFixed(1) + 'G';
    };

    const coreCpuVal = getPercent(coreCpu);
    const coreMemVal = getPercent(coreMem);
    const supCpuVal = getPercent(supCpu);
    const supMemVal = getPercent(supMem);

    const diskUsedVal = diskUsed ? parseFloat(diskUsed.state) : null;
    const diskTotalVal = diskTotal ? parseFloat(diskTotal.state) : null;
    let diskPercent = null, diskUsedStr = null, diskTotalStr = null;

    if (diskUsedVal !== null && !isNaN(diskUsedVal) && diskTotalVal !== null && !isNaN(diskTotalVal) && diskTotalVal > 0) {
      diskPercent = Math.round((diskUsedVal / diskTotalVal) * 100);
      diskUsedStr = formatSize(diskUsed);
      diskTotalStr = formatSize(diskTotal);
    }

    return html`
      ${renderBar('Core', 'cpu', coreCpuVal)}
      ${renderBar('Core', '内存', coreMemVal)}
      ${renderBar('Supervisor', 'cpu', supCpuVal)}
      ${renderBar('Supervisor', '内存', supMemVal)}
      ${diskPercent !== null && diskUsedStr && diskTotalStr ? html`
        <div class="resource-item">
          <div class="resource-bar-container">
            <div class="resource-bar-fill" style="height: ${Math.min(100, diskPercent)}%; background: ${getBarColor(diskPercent)};"></div>
          </div>
          <div class="resource-text-wrap">
            <div class="resource-label">Disk磁盘</div>
            <div class="resource-label">${diskPercent}%</div>
            <div class="resource-disk-text">${diskUsedStr} / ${diskTotalStr}</div>
          </div>
        </div>
      ` : html`
        <div class="resource-item">
          <div class="resource-bar-container">
            <div class="resource-bar-fill" style="height: 0%; background: rgb(150,150,150,0.3);"></div>
          </div>
          <div class="resource-text-wrap">
            <div class="resource-label">Disk磁盘</div>
            <div class="resource-percent">N/A</div>
          </div>
        </div>
      `}
    `;
  }

  _renderAddonUsage() {
    if (!this.hass || !this.config.addon_entities || this.config.addon_entities.length === 0) {
      return html`<div class="no-devices" style="font-size:10px;">未配置加载项实体</div>`;
    }

    const getBarColor = (pct) => {
      if (pct >= 80) return 'rgb(255,50,50)';
      if (pct >= 50) return 'rgb(255,165,0)';
      return 'rgb(0,200,80)';
    };

    return this.config.addon_entities.map(entityConfig => {
      const entity = this.hass.states[entityConfig.entity_id];
      const name = entityConfig.overrides?.name || entity?.attributes?.friendly_name || entityConfig.entity_id;
      const label = entityConfig.overrides?.label || '';
      const rawValue = entity ? entity.state : 'N/A';
      const unit = entity?.attributes?.unit_of_measurement || '';
      const numVal = parseFloat(rawValue);
      const isNum = !isNaN(numVal);
      const barHeight = isNum ? Math.min(100, numVal) : 0;

      return html`
        <div class="resource-item">
          <div class="resource-bar-container">
            <div class="resource-bar-fill" style="height: ${barHeight}%; background: ${isNum ? getBarColor(numVal) : 'rgb(150,150,150,0.3)'};"></div>
          </div>
          <div class="resource-text-wrap">
            <div class="resource-label">${name}</div>
            ${label ? html`<div class="resource-label">${label}</div>` : ''}
            <div class="resource-percent">${rawValue}${unit ? ' ' + unit : ''}</div>
          </div>
        </div>
      `;
    });
  }

  _handleRestartHA() {
    this._handleClick();
    this._showConfirmDialog('确认重启Home Assistant', '重启HA将会短暂中断所有服务，确定要继续吗？', 'homeassistant', 'restart');
  }

  _handleRestartHost() {
    this._handleClick();
    this._showConfirmDialog('确认重启主机系统', '重启主机系统将会关闭并重新启动整个设备，确定要继续吗？', 'hassio', 'host_reboot');
  }

  _handleBackup() {
    this._handleClick();
    this._showConfirmDialog('确认创建备份', '创建备份可能需要较长时间，期间系统资源占用较高，确定要继续吗？', 'hassio', 'backup_full');
  }

  _showConfirmDialog(title, message, domain, service) {
    const theme = this._evaluateTheme();
    const fgColor = theme === 'light' ? 'rgb(0, 0, 0)' : 'rgb(255, 255, 255)';
    const bgColor = theme === 'light' ? 'rgb(255, 255, 255)' : 'rgb(50, 50, 50)';
    const borderColor = theme === 'light' ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.1)';
    const isHA = domain === 'homeassistant';
    const isBackup = domain === 'backup';
    const confirmBg = isHA ? 'rgba(255, 193, 7, 0.9)' : isBackup ? 'rgba(33, 150, 243, 0.9)' : 'rgba(244, 67, 54, 0.9)';
    const confirmColor = isHA ? '#333' : '#fff';

    const overlay = document.createElement('div');
    overlay.style.cssText = `
      position: fixed; top: 0; left: 0; right: 0; bottom: 0;
      background: rgba(0,0,0,0.5); z-index: 10000;
      display: flex; align-items: center; justify-content: center;
      -webkit-backdrop-filter: blur(5px); backdrop-filter: blur(5px);
    `;

    const dialog = document.createElement('div');
    dialog.style.cssText = `
      background: ${bgColor}; color: ${fgColor}; border-radius: 12px;
      padding: 24px; min-width: 280px; max-width: 400px;
      box-shadow: 0 4px 20px rgba(0,0,0,0.3); text-align: center;
      animation: xiaoshiConfirmIn 0.2s ease-out;
    `;

    dialog.innerHTML = `
      <div style="font-size: 16px; font-weight: 600; margin-bottom: 12px;">${title}</div>
      <div style="font-size: 13px; margin-bottom: 20px; opacity: 0.8; line-height: 1.5;">${message}</div>
      <div style="display: flex; gap: 10px; justify-content: center;">
        <button id="xiaoshi-confirm-cancel" style="
          padding: 8px 24px; border: 1px solid ${borderColor}; border-radius: 8px;
          background: transparent; color: ${fgColor}; cursor: pointer; font-size: 13px;
        ">取消</button>
        <button id="xiaoshi-confirm-ok" style="
          padding: 8px 24px; border: none; border-radius: 8px;
          background: ${confirmBg}; color: ${confirmColor}; cursor: pointer; font-size: 13px; font-weight: 500;
        ">确认</button>
      </div>
    `;

    overlay.appendChild(dialog);
    document.body.appendChild(overlay);

    const close = () => { overlay.remove(); };
    dialog.querySelector('#xiaoshi-confirm-cancel').addEventListener('click', close);
    overlay.addEventListener('click', (e) => { if (e.target === overlay) close(); });
    dialog.querySelector('#xiaoshi-confirm-ok').addEventListener('click', () => {
      close();
      this._executeRestartService(domain, service);
    });

    const escHandler = (e) => {
      if (e.key === 'Escape') { close(); window.removeEventListener('keydown', escHandler); }
    };
    window.addEventListener('keydown', escHandler);
  }

  _executeRestartService(domain, service) {
    try {
      this.hass.callService(domain, service, {});
    } catch (error) {
      console.error(`调用重启服务失败: ${domain}.${service}`, error);
    }
  }

  render() {
    if (!this.hass) {
      return html`<div class="loading">等待Home Assistant连接...</div>`;
    }
    const theme = this._evaluateTheme();
    const fgColor = theme === 'light' ? 'rgb(0, 0, 0)' : 'rgb(255, 255, 255)';
    const bgColor = theme === 'light' ? 'rgb(255, 255, 255)' : 'rgb(50, 50, 50)';
    const warningCount = this._haUpdates.length + this._otherUpdates.length + this._offlineDevices.length + this._offlineEntities.length;

    return html`
      <ha-card style="--fg-color: ${fgColor}; --bg-color: ${bgColor};">
        <div class="card-header">
          <div class="card-title">
            <span class="offline-indicator" style="background: ${warningCount === 0 ? 'rgb(0,205,0)' : 'rgb(255,20,0)'}; animation: ${warningCount === 0 ? 'none' : 'pulse 1s infinite'}"></span>
            HA信息监控
          </div>
          <div style="display: flex; align-items: center; gap: 8px;">
            <span class="device-count ${warningCount > 0 ? 'non-zero' : 'zero'}">${warningCount}</span>
            <button class="refresh-btn" style="background: ${warningCount > 0 ? 'rgb(255,0,0,0.5)' : 'rgb(0,205,0)'}" @click=${this._handleRefresh}>刷新</button>
          </div>
        </div>

        <div class="section-divider">
          <div class="section-title">
            <span> • HA版本信息</span>
            <div class="ha-restart-buttons">
              <button class="ha-restart-btn yellow" @click=${this._handleRestartHA}>重启HA</button>
              <button class="ha-restart-btn red" @click=${this._handleRestartHost}>重启主机</button>
            </div>
          </div>
        </div>
        <div class="ha-version-info">${this._renderHAVersionInfo()}</div>

        <div class="section-divider">
          <div class="section-title"><span> • HA资源占用</span></div>
        </div>
        <div class="resource-usage-info" style="justify-content: space-between;">${this._renderResourceUsage()}</div>

        ${this.config.addon_entities && this.config.addon_entities.length > 0 ? html`
        <div class="section-divider">
          <div class="section-title"><span> • HA加载项占用</span></div>
        </div>
        <div class="resource-usage-info" style="gap: 16px; flex-wrap: wrap;">${this._renderAddonUsage()}</div>
        ` : ''}

        <div class="section-divider">
          <div class="section-title">
            <span> • HA备份信息</span>
            <div class="ha-restart-buttons">
              <button class="ha-restart-btn blue" @click=${this._handleBackup}>创建备份</button>
            </div>
          </div>
        </div>
        <div class="backup-info">${this._renderBackupInfo()}</div>

        <div class="devices-list">
          ${this._loading ?
            html`<div class="loading">HA版本信息加载中...</div>` :
            (this._haUpdates.length === 0 && this._otherUpdates.length === 0) ?
              html`<div class="no-devices">✅ 所有组件都是最新版本</div>` :
              html`
                ${this._haUpdates.length > 0 ? html`
                  <div class="section-divider">
                    <div class="section-title">
                      <span> • HA版本更新</span>
                      <span class="section-count ${this._haUpdates.length > 0 ? 'non-zero' : 'zero'}">${this._haUpdates.length}</span>
                    </div>
                  </div>
                  ${this._haUpdates.map(update => html`
                    <div class="device-item" @click=${() => this._handleEntityClick(update)}>
                      <div class="device-icon"><ha-icon icon="${update.icon}"></ha-icon></div>
                      <div class="device-info">
                        <div class="device-name">${update.name}</div>
                        <div class="device-details">
                          当前版本: ${update.current_version} → 最新版本: ${update.latest_version}
                          ${update.skipped_version ? html`<br><span style="color: #ff9800;">已跳过版本: ${update.skipped_version}</span>` : ''}
                        </div>
                      </div>
                      <div class="device-last-seen-update" @click=${(e) => this._handleConfirmUpdate(update, e)}>立即更新</div>
                    </div>
                  `)}
                ` : ''}
                ${this._otherUpdates.length > 0 ? html`
                  <div class="section-divider">
                    <div class="section-title">
                      <span> • HACS更新</span>
                      <span class="section-count ${this._otherUpdates.length > 0 ? 'non-zero' : 'zero'}">${this._otherUpdates.length}</span>
                    </div>
                  </div>
                  ${this._otherUpdates.map(update => html`
                    <div class="device-item" @click=${() => this._handleEntityClick(update)}>
                      <div class="device-icon"><ha-icon icon="${update.icon}"></ha-icon></div>
                      <div class="device-info">
                        <div class="device-name">${update.name}</div>
                        <div class="device-details">
                          当前版本: ${update.current_version} → 最新版本: ${update.latest_version}
                          ${update.skipped_version ? html`<br><span style="color: #ff9800;">已跳过版本: ${update.skipped_version}</span>` : ''}
                        </div>
                      </div>
                      <div class="device-last-seen-update" @click=${(e) => this._handleConfirmUpdate(update, e)}>立即更新</div>
                    </div>
                  `)}
                ` : ''}
              `
          }

          ${this._loading ?
            html`<div class="loading">设备和实体加载中...</div>` :
            (this._offlineDevices.length === 0 && this._offlineEntities.length === 0) ?
              html`<div class="no-devices">✅ 所有设备和实体都在线</div>` :
              html`
                ${this._offlineDevices.length > 0 ? html`
                  <div class="section-divider">
                    <div class="section-title">
                      <span> • 离线设备</span>
                      <span class="section-count">${this._offlineDevices.length}</span>
                    </div>
                  </div>
                  ${this._offlineDevices.map(device => html`
                    <div class="device-item" @click=${() => this._handleDeviceClick(device)}>
                      <div class="device-icon"><ha-icon icon="${device.icon}"></ha-icon></div>
                      <div class="device-info">
                        <div class="device-name">${device.name}</div>
                        <div class="device-details">
                          ${device.manufacturer && device.model ?
                            `${device.manufacturer} ${device.model}` :
                            device.manufacturer || device.model || '未知设备'}
                          ${device.entities ? `• ${device.entities.length} 个实体` : ''}
                        </div>
                      </div>
                      <div class="device-last-seen">${this._formatLastSeen(device.last_seen)}</div>
                    </div>
                  `)}
                ` : ''}
                ${this._offlineEntities.length > 0 ? html`
                  <div class="section-divider">
                    <div class="section-title">
                      <span> • 离线实体</span>
                      <span class="section-count">${this._offlineEntities.length}</span>
                    </div>
                  </div>
                  ${this._offlineEntities.map(entity => html`
                    <div class="device-item" @click=${() => this._handleEntityClick(entity)}>
                      <div class="device-icon"><ha-icon icon="${entity.icon}"></ha-icon></div>
                      <div class="device-info">
                        <div class="device-name">${entity.friendly_name}</div>
                        <div class="device-details">
                          ${entity.entity_id}
                          ${entity.platform ? `• ${entity.platform}` : ''}
                          ${entity.unit_of_measurement ? `• ${entity.unit_of_measurement}` : ''}
                        </div>
                      </div>
                      <div class="device-last-seen">${this._formatLastSeen(entity.last_updated)}</div>
                    </div>
                  `)}
                ` : ''}
              `
          }
        </div>
      </ha-card>
    `;
  }

  setConfig(config) {
    this.config = config;
    if (config.width) this.style.setProperty('--card-width', config.width);
    if (config.theme) this.setAttribute('theme', config.theme);
  }

  getCardSize() {
    const baseSize = 4;
    const haSize = Math.max(0, Math.min(this._haUpdates.length, 6));
    const otherSize = Math.max(0, Math.min(this._otherUpdates.length, 8));
    const deviceSize = Math.max(0, Math.min(this._offlineDevices.length, 6));
    const entitySize = Math.max(0, Math.min(this._offlineEntities.length, 8));
    return baseSize + haSize + otherSize + deviceSize + entitySize;
  }
}
customElements.define('xiaoshi-ha-info-card', XiaoshiHaInfoCard);