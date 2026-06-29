const whenDefined = (t) => customElements.whenDefined(t);
await Promise.race([whenDefined("ha-card"), whenDefined("ha-panel-lovelace")]);
const LitElement = window.LitElement || Object.getPrototypeOf(customElements.get("ha-card"));
const html = LitElement.prototype.html;
const css = LitElement.prototype.css;
 
window.customCards = window.customCards || [];
window.customCards.push({
  type: "xiaoshi-tv-player",
  name: "消逝卡(B移动端)-电视播放器",
  description: "移动端电视播放器",
  preview: true
});

class TvPlayerEditor extends LitElement {
  static get properties() {
    return {
      hass: { type: Object },
      config: { type: Object },
      _remoteSearchText: { type: String },
      _remoteSearchFocused: { type: Boolean },
      _turnOnSearchText: { type: String },
      _turnOnSearchFocused: { type: Boolean },
      _turnOffSearchText: { type: String },
      _turnOffSearchFocused: { type: Boolean },
      _appCurrentSearchText: { type: String },
      _appCurrentSearchFocused: { type: Boolean },
      _volumeNumberSearchText: { type: String },
      _volumeNumberSearchFocused: { type: Boolean }
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
      }
      .entity-search-wrapper {
        position: relative;
      }
      .entity-search-input {
        width: 100%;
        box-sizing: border-box;
        padding: 8px;
        border: 1px solid var(--divider-color, #ddd);
        border-radius: 4px;
        font-size: 14px;
        background: var(--primary-background-color, #fff);
        color: var(--primary-text-color, #333);
      }
      .entity-search-dropdown {
        position: absolute;
        top: 100%;
        left: 0;
        right: 0;
        max-height: 200px;
        overflow-y: auto;
        background: var(--primary-background-color, #fff);
        border: 1px solid var(--divider-color, #ddd);
        border-top: none;
        border-radius: 0 0 4px 4px;
        z-index: 1000;
        box-shadow: 0 4px 8px rgba(0,0,0,0.1);
      }
      .entity-search-item {
        padding: 8px 12px;
        cursor: pointer;
        font-size: 13px;
        color: var(--primary-text-color, #333);
        border-bottom: 1px solid var(--divider-color, #f0f0f0);
      }
      .entity-search-item:hover {
        background: var(--secondary-background-color, #f5f5f5);
      }
      .entity-search-item.selected {
        background: var(--primary-color, #e3f2fd);
        color: var(--text-primary-color, #333);
        font-weight: bold;
      }
      .entity-search-item .entity-id {
        color: var(--secondary-text-color, #888);
        font-size: 11px;
        margin-left: 6px;
      }
      .entity-search-selected {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 8px;
        border: 1px solid var(--divider-color, #ddd);
        border-radius: 4px;
        background: var(--secondary-background-color, #f9f9f9);
        color: var(--primary-text-color, #333);
        cursor: pointer;
        font-size: 14px;
      }
      .entity-search-selected .clear-btn {
        color: var(--secondary-text-color, #999);
        cursor: pointer;
        font-size: 18px;
        line-height: 1;
        padding: 0 4px;
      }
      .entity-search-selected .clear-btn:hover {
        color: var(--primary-text-color, #333);
      }
      .app-options-list {
        display: flex;
        flex-direction: column;
        gap: 6px;
        margin-top: 6px;
        padding: 8px;
        border: 1px solid var(--divider-color, #ddd);
        border-radius: 4px;
        background: var(--primary-background-color, #fff);
        max-height: 250px;
        overflow-y: auto;
      }
      .app-option-row {
        display: flex;
        align-items: center;
        gap: 6px;
      }
      .app-option-row input[type="checkbox"] {
        width: 16px;
        height: 16px;
        flex-shrink: 0;
      }
      .app-option-row .app-option-label {
        font-size: 13px;
        min-width: 60px;
        color: var(--primary-text-color, #333);
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
      .app-option-row input[type="text"] {
        flex: 1;
        padding: 4px 6px;
        font-size: 12px;
        border: 1px solid var(--divider-color, #ddd);
        border-radius: 3px;
        background: var(--primary-background-color, #fff);
        color: var(--primary-text-color, #333);
      }
    `;
  }

  render() {
    if (!this.hass) return html``;

    const isIntegration = !this.config.tv_connection_mode || this.config.tv_connection_mode === 'integration';

    return html`
      <div class="form">
        <div class="form-group">
          <label>主题</label>
          <select 
            @change=${this._entityChanged}
            .value=${this.config.theme !== undefined ? this.config.theme : 'system'}
            name="theme"
          >
            <option value="system">跟随系统</option>
            <option value="light">浅色主题</option>
            <option value="dark">深色主题</option>
            <option value="sun">跟随日出日落</option>
            <option value="function">跟随函数</option>
          </select>
        </div>
        
        <div class="form-group">
          <label>卡片宽度：支持像素(px)和百分比(%)</label>
          <input 
            type="text" 
            @change=${this._entityChanged}
            .value=${this.config.width !== undefined ? this.config.width : '100%'}
            name="width"
            placeholder="默认100%"
          />
        </div>
        
        <div class="form-group">
          <label>卡片高度：支持像素(px)和百分比(%)</label>
          <input 
            type="text" 
            @change=${this._entityChanged}
            .value=${this.config.height !== undefined ? this.config.height : '80px'}
            name="height"
            placeholder="默认80px"
          />
        </div>

        <div class="form-group">
          <label>连接电视模式</label>
          <select 
            @change=${this._entityChanged}
            .value=${this.config.tv_connection_mode || 'integration'}
            name="tv_connection_mode"
          >
            <option value="integration">小米集成方式</option>
            <option value="adb">ADB方式</option>
            <option value="infrared">红外方式</option>
            <option value="esphome_ir">ESPHome红外</option>
            <option value="tuya_ir">涂鸦红外方式</option>
          </select>
        </div>

        <div class="form-group">
          <label>Media_player主实体</label>
          <select 
            @change=${this._entityChanged}
            .value=${this.config.entity || this.config.xiaomi_home || ''}
            name="entity"
          >
            <option value="">选择 Media_player 实体</option>
            ${Object.keys(this.hass.states)
              .filter(entityId => entityId.startsWith('media_player.'))
              .map(entityId => html`
                <option value="${entityId}" 
                  .selected=${entityId === (this.config.entity || this.config.xiaomi_home)}>
                  ${this.hass.states[entityId].attributes.friendly_name || entityId} ${this.hass.states[entityId].attributes.friendly_name ? '(' + entityId + ')' : ''}
                </option>
              `)}
          </select>
        </div>

        ${isIntegration ? html`
        
        <div class="form-group">
          <label>音量Number实体（最高优先级）</label>
          <div class="entity-search-wrapper">
            ${this.config.volume_number ? html`
              <div class="entity-search-selected" @click=${this._clearVolumeNumber}>
                <span>${this._getEntityDisplayName(this.config.volume_number)}</span>
                <span class="clear-btn">&times;</span>
              </div>
            ` : html`
              <input 
                class="entity-search-input"
                type="text"
                .value=${this._volumeNumberSearchText || ''}
                placeholder="输入关键字搜索 number 实体..."
                @input=${this._onVolumeNumberSearchInput}
                @focus=${this._onVolumeNumberSearchFocus}
                @blur=${this._onVolumeNumberSearchBlur}
              />
              ${this._volumeNumberSearchFocused && this._getFilteredVolumeNumberEntities().length > 0 ? html`
                <div class="entity-search-dropdown">
                  ${this._getFilteredVolumeNumberEntities().map(entityId => html`
                    <div 
                      class="entity-search-item ${entityId === this.config.volume_number ? 'selected' : ''}"
                      @mousedown=${(e) => this._selectVolumeNumberEntity(e, entityId)}
                    >
                      ${this.hass.states[entityId].attributes.friendly_name || entityId}
                      <span class="entity-id">${entityId}</span>
                    </div>
                  `)}
                </div>
              ` : ''}
            `}
          </div>
        </div>

        <div class="form-group">
          <label>播放控制 keycodes</label>
          <div class="entity-search-wrapper">
            ${this.config.remote_control ? html`
              <div class="entity-search-selected" @click=${this._clearRemoteControl}>
                <span>${this._getEntityDisplayName(this.config.remote_control)}</span>
                <span class="clear-btn">&times;</span>
              </div>
            ` : html`
              <input 
                class="entity-search-input"
                type="text"
                .value=${this._remoteSearchText || ''}
                placeholder="输入关键字搜索遥控实体..."
                @input=${this._onRemoteSearchInput}
                @focus=${this._onRemoteSearchFocus}
                @blur=${this._onRemoteSearchBlur}
              />
              ${this._remoteSearchFocused && this._getFilteredRemoteEntities().length > 0 ? html`
                <div class="entity-search-dropdown">
                  ${this._getFilteredRemoteEntities().map(entityId => html`
                    <div 
                      class="entity-search-item ${entityId === this.config.remote_control ? 'selected' : ''}"
                      @mousedown=${(e) => this._selectRemoteEntity(e, entityId)}
                    >
                      ${this.hass.states[entityId].attributes.friendly_name || entityId}
                      <span class="entity-id">${entityId}</span>
                    </div>
                  `)}
                </div>
              ` : ''}
            `}
          </div>
        </div>

        <div class="form-group">
          <label>播放控制 app_current</label>
          <div class="entity-search-wrapper">
            ${this.config.app_current ? html`
              <div class="entity-search-selected" @click=${this._clearAppCurrent}>
                <span>${this._getEntityDisplayName(this.config.app_current)}</span>
                <span class="clear-btn">&times;</span>
              </div>
            ` : html`
              <input 
                class="entity-search-input"
                type="text"
                .value=${this._appCurrentSearchText || ''}
                placeholder="输入关键字搜索select实体..."
                @input=${this._onAppCurrentSearchInput}
                @focus=${this._onAppCurrentSearchFocus}
                @blur=${this._onAppCurrentSearchBlur}
              />
              ${this._appCurrentSearchFocused && this._getFilteredAppCurrentEntities().length > 0 ? html`
                <div class="entity-search-dropdown">
                  ${this._getFilteredAppCurrentEntities().map(entityId => html`
                    <div 
                      class="entity-search-item ${entityId === this.config.app_current ? 'selected' : ''}"
                      @mousedown=${(e) => this._selectAppCurrentEntity(e, entityId)}
                    >
                      ${this.hass.states[entityId].attributes.friendly_name || entityId}
                      <span class="entity-id">${entityId}</span>
                    </div>
                  `)}
                </div>
              ` : ''}
            `}
          </div>
          ${this.config.app_current && this.hass.states[this.config.app_current] ? html`
            <div class="app-options-list">
              ${(this.hass.states[this.config.app_current].attributes.options || []).map((option, idx) => {
                const appConfig = this.config.app_current_config || {};
                const itemConfig = appConfig[option] || { show: true, name: option };
                return html`
                  <div class="app-option-row">
                    <input 
                      type="checkbox" 
                      .checked=${itemConfig.show !== false}
                      @change=${(e) => this._onAppOptionShowChange(e, option)}
                    />
                    <span class="app-option-label" title="${option}">${option}</span>
                    <input 
                      type="text"
                      .value=${itemConfig.name && itemConfig.name !== option ? itemConfig.name : ''}
                      placeholder="${option}"
                      @change=${(e) => this._onAppOptionNameChange(e, option)}
                    />
                  </div>
                `;
              })}
            </div>
          ` : ''}
        </div>

        ` : ''}

        <div class="form-group">
          <label>打开电视按钮（最高优先级，覆盖其他命令）</label>
          <div class="entity-search-wrapper">
            ${this.config.turn_on_button ? html`
              <div class="entity-search-selected" @click=${this._clearTurnOnButton}>
                <span>${this._getEntityDisplayName(this.config.turn_on_button)}</span>
                <span class="clear-btn">&times;</span>
              </div>
            ` : html`
              <input 
                class="entity-search-input"
                type="text"
                .value=${this._turnOnSearchText || ''}
                placeholder="输入关键字搜索按钮/脚本/开关实体..."
                @input=${this._onTurnOnSearchInput}
                @focus=${this._onTurnOnSearchFocus}
                @blur=${this._onTurnOnSearchBlur}
              />
              ${this._turnOnSearchFocused && this._getFilteredTurnOnEntities().length > 0 ? html`
                <div class="entity-search-dropdown">
                  ${this._getFilteredTurnOnEntities().map(entityId => html`
                    <div 
                      class="entity-search-item ${entityId === this.config.turn_on_button ? 'selected' : ''}"
                      @mousedown=${(e) => this._selectTurnOnEntity(e, entityId)}
                    >
                      ${this.hass.states[entityId].attributes.friendly_name || entityId}
                      <span class="entity-id">${entityId}</span>
                    </div>
                  `)}
                </div>
              ` : ''}
            `}
          </div>
        </div>

        <div class="form-group">
          <label>关闭电视按钮（最高优先级，覆盖其他命令）</label>
          <div class="entity-search-wrapper">
            ${this.config.turn_off_button ? html`
              <div class="entity-search-selected" @click=${this._clearTurnOffButton}>
                <span>${this._getEntityDisplayName(this.config.turn_off_button)}</span>
                <span class="clear-btn">&times;</span>
              </div>
            ` : html`
              <input 
                class="entity-search-input"
                type="text"
                .value=${this._turnOffSearchText || ''}
                placeholder="输入关键字搜索按钮/脚本/开关实体..."
                @input=${this._onTurnOffSearchInput}
                @focus=${this._onTurnOffSearchFocus}
                @blur=${this._onTurnOffSearchBlur}
              />
              ${this._turnOffSearchFocused && this._getFilteredTurnOffEntities().length > 0 ? html`
                <div class="entity-search-dropdown">
                  ${this._getFilteredTurnOffEntities().map(entityId => html`
                    <div 
                      class="entity-search-item ${entityId === this.config.turn_off_button ? 'selected' : ''}"
                      @mousedown=${(e) => this._selectTurnOffEntity(e, entityId)}
                    >
                      ${this.hass.states[entityId].attributes.friendly_name || entityId}
                      <span class="entity-id">${entityId}</span>
                    </div>
                  `)}
                </div>
              ` : ''}
            `}
          </div>
        </div>

        ${this.config.tv_connection_mode === 'adb' ? html`
          <div class="form-group">
            <label>ADB命令实体</label>
            <select 
              @change=${this._entityChanged}
              .value=${this.config.adb_entity || ''}
              name="adb_entity"
            >
              <option value="">选择ADB命令实体</option>
              ${Object.keys(this.hass.states)
                .filter(entityId => entityId.startsWith('media_player.'))
                .map(entityId => html`
                  <option value="${entityId}" 
                    .selected=${entityId === this.config.adb_entity}>
                    ${this.hass.states[entityId].attributes.friendly_name || entityId} ${this.hass.states[entityId].attributes.friendly_name ? '(' + entityId + ')' : ''}
                  </option>
                `)}
            </select>
          </div>
          
          <div class="form-group">
            <label>按钮ADB命令配置</label>
            <div style="display: flex; flex-direction: column; gap: 10px;">
              <!-- 基础控制按钮 -->
              <div style="border: 1px solid #ddd; padding: 10px; border-radius: 4px;">
                <label style="font-weight: normal; font-size: 12px; color: #666;">基础控制按钮</label>
                <div style="display: flex; flex-direction: column; gap: 5px;">
                  <input 
                    type="text" 
                    @change=${this._entityChanged}
                    .value=${this.config.adb_command?.power_on || ''}
                    name="adb_command_power_on"
                    placeholder="开机按钮命令（默认：POWER）"
                  />
                  <input 
                    type="text" 
                    @change=${this._entityChanged}
                    .value=${this.config.adb_command?.power_off || ''}
                    name="adb_command_power_off"
                    placeholder="关机按钮命令（默认：POWER）"
                  />
                  <input 
                    type="text" 
                    @change=${this._entityChanged}
                    .value=${this.config.adb_command?.home || ''}
                    name="adb_command_home"
                    placeholder="主页按钮命令（默认：HOME）"
                  />
                  <input 
                    type="text" 
                    @change=${this._entityChanged}
                    .value=${this.config.adb_command?.back || ''}
                    name="adb_command_back"
                    placeholder="返回按钮命令（默认：BACK）"
                  />
                  <input 
                    type="text" 
                    @change=${this._entityChanged}
                    .value=${this.config.adb_command?.menu || ''}
                    name="adb_command_menu"
                    placeholder="菜单按钮命令（默认：MENU）"
                  />
                  <input 
                    type="text" 
                    @change=${this._entityChanged}
                    .value=${this.config.adb_command?.setting || ''}
                    name="adb_command_setting"
                    placeholder="设置按钮命令（默认：am start -n com.android.settings/.Settings）"
                  />
                </div>
              </div>
              
              <!-- 媒体控制按钮 -->
              <div style="border: 1px solid #ddd; padding: 10px; border-radius: 4px;">
                <label style="font-weight: normal; font-size: 12px; color: #666;">媒体控制按钮</label>
                <div style="display: flex; flex-direction: column; gap: 5px;">
                  <input 
                    type="text" 
                    @change=${this._entityChanged}
                    .value=${this.config.adb_command?.play || ''}
                    name="adb_command_play"
                    placeholder="播放按钮命令（默认：CENTER）"
                  />
                  <input 
                    type="text" 
                    @change=${this._entityChanged}
                    .value=${this.config.adb_command?.pause || ''}
                    name="adb_command_pause"
                    placeholder="暂停按钮命令（默认：CENTER）"
                  />
                  <input 
                    type="text" 
                    @change=${this._entityChanged}
                    .value=${this.config.adb_command?.next || ''}
                    name="adb_command_next"
                    placeholder="下一个按钮命令（默认：NEXT）"
                  />
                  <input 
                    type="text" 
                    @change=${this._entityChanged}
                    .value=${this.config.adb_command?.previous || ''}
                    name="adb_command_previous"
                    placeholder="上一个按钮命令（默认：PREVIOUS）"
                  />
                </div>
              </div>
              
              <!-- 音量控制按钮 -->
              <div style="border: 1px solid #ddd; padding: 10px; border-radius: 4px;">
                <label style="font-weight: normal; font-size: 12px; color: #666;">音量控制按钮</label>
                <div style="display: flex; flex-direction: column; gap: 5px;">
                  <input 
                    type="text" 
                    @change=${this._entityChanged}
                    .value=${this.config.adb_command?.volume_up || ''}
                    name="adb_command_volume_up"
                    placeholder="音量加按钮命令（默认：VOLUME_UP）"
                  />
                  <input 
                    type="text" 
                    @change=${this._entityChanged}
                    .value=${this.config.adb_command?.volume_down || ''}
                    name="adb_command_volume_down"
                    placeholder="音量减按钮命令（默认：VOLUME_DOWN）"
                  />
                  <input 
                    type="text" 
                    @change=${this._entityChanged}
                    .value=${this.config.adb_command?.volume_mute || ''}
                    name="adb_command_volume_mute"
                    placeholder="静音按钮命令（默认：MUTE）"
                  />
                </div>
              </div>
              
              <!-- 方向控制按钮 -->
              <div style="border: 1px solid #ddd; padding: 10px; border-radius: 4px;">
                <label style="font-weight: normal; font-size: 12px; color: #666;">方向控制按钮</label>
                <div style="display: flex; flex-direction: column; gap: 5px;">
                  <input 
                    type="text" 
                    @change=${this._entityChanged}
                    .value=${this.config.adb_command?.up || ''}
                    name="adb_command_up"
                    placeholder="上键按钮命令（默认：UP）"
                  />
                  <input 
                    type="text" 
                    @change=${this._entityChanged}
                    .value=${this.config.adb_command?.down || ''}
                    name="adb_command_down"
                    placeholder="下键按钮命令（默认：DOWN）"
                  />
                  <input 
                    type="text" 
                    @change=${this._entityChanged}
                    .value=${this.config.adb_command?.left || ''}
                    name="adb_command_left"
                    placeholder="左键按钮命令（默认：LEFT）"
                  />
                  <input 
                    type="text" 
                    @change=${this._entityChanged}
                    .value=${this.config.adb_command?.right || ''}
                    name="adb_command_right"
                    placeholder="右键按钮命令（默认：RIGHT）"
                  />
                  <input 
                    type="text" 
                    @change=${this._entityChanged}
                    .value=${this.config.adb_command?.center || ''}
                    name="adb_command_center"
                    placeholder="确认键按钮命令（默认：CENTER）"
                  />
                </div>
              </div>
            </div>
          </div>
          ${this._renderAppsConfig('adb_app', 'ADB快捷App按钮', 'ADB命令')}
        ` : ''}

        ${this.config.tv_connection_mode === 'infrared' ? html`
          <div class="form-group">
            <label>红外遥控实体</label>
            <select 
              @change=${this._entityChanged}
              .value=${this.config.ir_entity || ''}
              name="ir_entity"
            >
              <option value="">选择红外遥控实体</option>
              ${Object.keys(this.hass.states)
                .filter(entityId => entityId.startsWith('remote.'))
                .map(entityId => html`
                  <option value="${entityId}" 
                    .selected=${entityId === this.config.ir_entity}>
                    ${this.hass.states[entityId].attributes.friendly_name || entityId} ${this.hass.states[entityId].attributes.friendly_name ? '(' + entityId + ')' : ''}
                  </option>
                `)}
            </select>
          </div>
          
          <div class="form-group">
            <label>红外命令配置</label>
            <div style="display: flex; flex-direction: column; gap: 10px;">
              <!-- 基础控制按钮 -->
              <div style="border: 1px solid #ddd; padding: 10px; border-radius: 4px;">
                <label style="font-weight: normal; font-size: 12px; color: #666;">基础控制按钮</label>
                <div style="display: flex; flex-direction: column; gap: 5px;">
                  <input 
                    type="text" 
                    @change=${this._entityChanged}
                    .value=${this.config.ir_command?.power_on || ''}
                    name="ir_command_power_on"
                    placeholder="开机命令（默认：KEY_POWER）"
                  />
                  <input 
                    type="text" 
                    @change=${this._entityChanged}
                    .value=${this.config.ir_command?.power_off || ''}
                    name="ir_command_power_off"
                    placeholder="关机命令（默认：KEY_POWER）"
                  />
                  <input 
                    type="text" 
                    @change=${this._entityChanged}
                    .value=${this.config.ir_command?.home || ''}
                    name="ir_command_home"
                    placeholder="主页命令（默认：KEY_HOME）"
                  />
                  <input 
                    type="text" 
                    @change=${this._entityChanged}
                    .value=${this.config.ir_command?.back || ''}
                    name="ir_command_back"
                    placeholder="返回命令（默认：KEY_BACK）"
                  />
                  <input 
                    type="text" 
                    @change=${this._entityChanged}
                    .value=${this.config.ir_command?.menu || ''}
                    name="ir_command_menu"
                    placeholder="菜单命令（默认：KEY_MENU）"
                  />
                  <input 
                    type="text" 
                    @change=${this._entityChanged}
                    .value=${this.config.ir_command?.setting || ''}
                    name="ir_command_setting"
                    placeholder="设置命令（默认：KEY_SETTINGS）"
                  />
                </div>
              </div>
              
              <!-- 媒体控制按钮 -->
              <div style="border: 1px solid #ddd; padding: 10px; border-radius: 4px;">
                <label style="font-weight: normal; font-size: 12px; color: #666;">媒体控制按钮</label>
                <div style="display: flex; flex-direction: column; gap: 5px;">
                  <input 
                    type="text" 
                    @change=${this._entityChanged}
                    .value=${this.config.ir_command?.play || ''}
                    name="ir_command_play"
                    placeholder="播放命令（默认：KEY_PLAY）"
                  />
                  <input 
                    type="text" 
                    @change=${this._entityChanged}
                    .value=${this.config.ir_command?.pause || ''}
                    name="ir_command_pause"
                    placeholder="暂停命令（默认：KEY_PAUSE）"
                  />
                  <input 
                    type="text" 
                    @change=${this._entityChanged}
                    .value=${this.config.ir_command?.next || ''}
                    name="ir_command_next"
                    placeholder="下一个命令（默认：KEY_NEXT）"
                  />
                  <input 
                    type="text" 
                    @change=${this._entityChanged}
                    .value=${this.config.ir_command?.previous || ''}
                    name="ir_command_previous"
                    placeholder="上一个命令（默认：KEY_PREVIOUS）"
                  />
                </div>
              </div>
              
              <!-- 音量控制按钮 -->
              <div style="border: 1px solid #ddd; padding: 10px; border-radius: 4px;">
                <label style="font-weight: normal; font-size: 12px; color: #666;">音量控制按钮</label>
                <div style="display: flex; flex-direction: column; gap: 5px;">
                  <input 
                    type="text" 
                    @change=${this._entityChanged}
                    .value=${this.config.ir_command?.volume_up || ''}
                    name="ir_command_volume_up"
                    placeholder="音量加命令（默认：KEY_VOLUMEUP）"
                  />
                  <input 
                    type="text" 
                    @change=${this._entityChanged}
                    .value=${this.config.ir_command?.volume_down || ''}
                    name="ir_command_volume_down"
                    placeholder="音量减命令（默认：KEY_VOLUMEDOWN）"
                  />
                  <input 
                    type="text" 
                    @change=${this._entityChanged}
                    .value=${this.config.ir_command?.volume_mute || ''}
                    name="ir_command_volume_mute"
                    placeholder="静音命令（默认：KEY_MUTE）"
                  />
                </div>
              </div>
              
              <!-- 方向控制按钮 -->
              <div style="border: 1px solid #ddd; padding: 10px; border-radius: 4px;">
                <label style="font-weight: normal; font-size: 12px; color: #666;">方向控制按钮</label>
                <div style="display: flex; flex-direction: column; gap: 5px;">
                  <input 
                    type="text" 
                    @change=${this._entityChanged}
                    .value=${this.config.ir_command?.up || ''}
                    name="ir_command_up"
                    placeholder="上键命令（默认：KEY_UP）"
                  />
                  <input 
                    type="text" 
                    @change=${this._entityChanged}
                    .value=${this.config.ir_command?.down || ''}
                    name="ir_command_down"
                    placeholder="下键命令（默认：KEY_DOWN）"
                  />
                  <input 
                    type="text" 
                    @change=${this._entityChanged}
                    .value=${this.config.ir_command?.left || ''}
                    name="ir_command_left"
                    placeholder="左键命令（默认：KEY_LEFT）"
                  />
                  <input 
                    type="text" 
                    @change=${this._entityChanged}
                    .value=${this.config.ir_command?.right || ''}
                    name="ir_command_right"
                    placeholder="右键命令（默认：KEY_RIGHT）"
                  />
                  <input 
                    type="text" 
                    @change=${this._entityChanged}
                    .value=${this.config.ir_command?.center || ''}
                    name="ir_command_center"
                    placeholder="确认键命令（默认：KEY_ENTER）"
                  />
                </div>
              </div>
            </div>
          </div>
          ${this._renderAppsConfig('ir_app', '红外快捷App按钮', '红外命令(如KEY_1)')}
        ` : ''}

        ${this.config.tv_connection_mode === 'esphome_ir' ? html`
          <div class="form-group">
            <label>ESPHome红外服务</label>
            <input 
              type="text" 
              @change=${this._entityChanged}
              .value=${this.config.esphome_service || ''}
              name="esphome_service"
              placeholder="例如：esphome.livingroom_ir_send_pronto"
            />
          </div>

          <div class="form-group">
            <label>Pronto红外码配置（十六进制）</label>
            <div style="display: flex; flex-direction: column; gap: 10px;">
              <div style="border: 1px solid #ddd; padding: 10px; border-radius: 4px;">
                <label style="font-weight: normal; font-size: 12px; color: #666;">基础控制</label>
                <div style="display: flex; flex-direction: column; gap: 5px;">
                  <input 
                    type="text" 
                    @change=${this._entityChanged}
                    .value=${this.config.esphome_code?.power_on || ''}
                    name="esphome_code_power_on"
                    placeholder="开机 Pronto码"
                  />
                  <input 
                    type="text" 
                    @change=${this._entityChanged}
                    .value=${this.config.esphome_code?.power_off || ''}
                    name="esphome_code_power_off"
                    placeholder="关机 Pronto码"
                  />
                  <input 
                    type="text" 
                    @change=${this._entityChanged}
                    .value=${this.config.esphome_code?.home || ''}
                    name="esphome_code_home"
                    placeholder="主页 Pronto码"
                  />
                  <input 
                    type="text" 
                    @change=${this._entityChanged}
                    .value=${this.config.esphome_code?.back || ''}
                    name="esphome_code_back"
                    placeholder="返回 Pronto码"
                  />
                  <input 
                    type="text" 
                    @change=${this._entityChanged}
                    .value=${this.config.esphome_code?.menu || ''}
                    name="esphome_code_menu"
                    placeholder="菜单 Pronto码"
                  />
                  <input 
                    type="text" 
                    @change=${this._entityChanged}
                    .value=${this.config.esphome_code?.setting || ''}
                    name="esphome_code_setting"
                    placeholder="设置 Pronto码"
                  />
                </div>
              </div>

              <div style="border: 1px solid #ddd; padding: 10px; border-radius: 4px;">
                <label style="font-weight: normal; font-size: 12px; color: #666;">媒体控制</label>
                <div style="display: flex; flex-direction: column; gap: 5px;">
                  <input 
                    type="text" 
                    @change=${this._entityChanged}
                    .value=${this.config.esphome_code?.play || ''}
                    name="esphome_code_play"
                    placeholder="播放 Pronto码"
                  />
                  <input 
                    type="text" 
                    @change=${this._entityChanged}
                    .value=${this.config.esphome_code?.pause || ''}
                    name="esphome_code_pause"
                    placeholder="暂停 Pronto码"
                  />
                  <input 
                    type="text" 
                    @change=${this._entityChanged}
                    .value=${this.config.esphome_code?.next || ''}
                    name="esphome_code_next"
                    placeholder="下一个 Pronto码"
                  />
                  <input 
                    type="text" 
                    @change=${this._entityChanged}
                    .value=${this.config.esphome_code?.previous || ''}
                    name="esphome_code_previous"
                    placeholder="上一个 Pronto码"
                  />
                </div>
              </div>

              <div style="border: 1px solid #ddd; padding: 10px; border-radius: 4px;">
                <label style="font-weight: normal; font-size: 12px; color: #666;">音量控制</label>
                <div style="display: flex; flex-direction: column; gap: 5px;">
                  <input 
                    type="text" 
                    @change=${this._entityChanged}
                    .value=${this.config.esphome_code?.volume_up || ''}
                    name="esphome_code_volume_up"
                    placeholder="音量加 Pronto码"
                  />
                  <input 
                    type="text" 
                    @change=${this._entityChanged}
                    .value=${this.config.esphome_code?.volume_down || ''}
                    name="esphome_code_volume_down"
                    placeholder="音量减 Pronto码"
                  />
                  <input 
                    type="text" 
                    @change=${this._entityChanged}
                    .value=${this.config.esphome_code?.volume_mute || ''}
                    name="esphome_code_volume_mute"
                    placeholder="静音 Pronto码"
                  />
                </div>
              </div>

              <div style="border: 1px solid #ddd; padding: 10px; border-radius: 4px;">
                <label style="font-weight: normal; font-size: 12px; color: #666;">方向控制</label>
                <div style="display: flex; flex-direction: column; gap: 5px;">
                  <input 
                    type="text" 
                    @change=${this._entityChanged}
                    .value=${this.config.esphome_code?.up || ''}
                    name="esphome_code_up"
                    placeholder="上键 Pronto码"
                  />
                  <input 
                    type="text" 
                    @change=${this._entityChanged}
                    .value=${this.config.esphome_code?.down || ''}
                    name="esphome_code_down"
                    placeholder="下键 Pronto码"
                  />
                  <input 
                    type="text" 
                    @change=${this._entityChanged}
                    .value=${this.config.esphome_code?.left || ''}
                    name="esphome_code_left"
                    placeholder="左键 Pronto码"
                  />
                  <input 
                    type="text" 
                    @change=${this._entityChanged}
                    .value=${this.config.esphome_code?.right || ''}
                    name="esphome_code_right"
                    placeholder="右键 Pronto码"
                  />
                  <input 
                    type="text" 
                    @change=${this._entityChanged}
                    .value=${this.config.esphome_code?.center || ''}
                    name="esphome_code_center"
                    placeholder="确认键 Pronto码"
                  />
                </div>
              </div>
            </div>
          </div>
          ${this._renderAppsConfig('esphome_app', 'ESPHome快捷App按钮', 'Pronto码')}
        ` : ''}

        ${this.config.tv_connection_mode === 'tuya_ir' ? html`
          <div class="form-group">
            <label>涂鸦红外场景实体配置（填写 scene.XXXX 实体）</label>
            <div style="display: flex; flex-direction: column; gap: 10px;">
              <!-- 基础控制按钮 -->
              <div style="border: 1px solid #ddd; padding: 10px; border-radius: 4px;">
                <label style="font-weight: normal; font-size: 12px; color: #666;">基础控制按钮 - 场景实体</label>
                <div style="display: flex; flex-direction: column; gap: 5px;">
                  <input 
                    type="text" 
                    @change=${this._entityChanged}
                    .value=${this.config.tuya_command?.power_on || ''}
                    name="tuya_command_power_on"
                    placeholder="开机 场景实体（如 scene.tv_power_on）"
                  />
                  <input 
                    type="text" 
                    @change=${this._entityChanged}
                    .value=${this.config.tuya_command?.power_off || ''}
                    name="tuya_command_power_off"
                    placeholder="关机 场景实体（如 scene.tv_power_off）"
                  />
                  <input 
                    type="text" 
                    @change=${this._entityChanged}
                    .value=${this.config.tuya_command?.home || ''}
                    name="tuya_command_home"
                    placeholder="主页 场景实体（如 scene.tv_home）"
                  />
                  <input 
                    type="text" 
                    @change=${this._entityChanged}
                    .value=${this.config.tuya_command?.back || ''}
                    name="tuya_command_back"
                    placeholder="返回 场景实体（如 scene.tv_back）"
                  />
                  <input 
                    type="text" 
                    @change=${this._entityChanged}
                    .value=${this.config.tuya_command?.menu || ''}
                    name="tuya_command_menu"
                    placeholder="菜单 场景实体（如 scene.tv_menu）"
                  />
                  <input 
                    type="text" 
                    @change=${this._entityChanged}
                    .value=${this.config.tuya_command?.setting || ''}
                    name="tuya_command_setting"
                    placeholder="设置 场景实体（如 scene.tv_setting）"
                  />
                </div>
              </div>
              
              <!-- 媒体控制按钮 -->
              <div style="border: 1px solid #ddd; padding: 10px; border-radius: 4px;">
                <label style="font-weight: normal; font-size: 12px; color: #666;">媒体控制按钮 - 场景实体</label>
                <div style="display: flex; flex-direction: column; gap: 5px;">
                  <input 
                    type="text" 
                    @change=${this._entityChanged}
                    .value=${this.config.tuya_command?.play || ''}
                    name="tuya_command_play"
                    placeholder="播放 场景实体（如 scene.tv_play）"
                  />
                  <input 
                    type="text" 
                    @change=${this._entityChanged}
                    .value=${this.config.tuya_command?.pause || ''}
                    name="tuya_command_pause"
                    placeholder="暂停 场景实体（如 scene.tv_pause）"
                  />
                  <input 
                    type="text" 
                    @change=${this._entityChanged}
                    .value=${this.config.tuya_command?.next || ''}
                    name="tuya_command_next"
                    placeholder="下一个 场景实体（如 scene.tv_next）"
                  />
                  <input 
                    type="text" 
                    @change=${this._entityChanged}
                    .value=${this.config.tuya_command?.previous || ''}
                    name="tuya_command_previous"
                    placeholder="上一个 场景实体（如 scene.tv_previous）"
                  />
                </div>
              </div>
              
              <!-- 音量控制按钮 -->
              <div style="border: 1px solid #ddd; padding: 10px; border-radius: 4px;">
                <label style="font-weight: normal; font-size: 12px; color: #666;">音量控制按钮 - 场景实体</label>
                <div style="display: flex; flex-direction: column; gap: 5px;">
                  <input 
                    type="text" 
                    @change=${this._entityChanged}
                    .value=${this.config.tuya_command?.volume_up || ''}
                    name="tuya_command_volume_up"
                    placeholder="音量加 场景实体（如 scene.tv_vol_up）"
                  />
                  <input 
                    type="text" 
                    @change=${this._entityChanged}
                    .value=${this.config.tuya_command?.volume_down || ''}
                    name="tuya_command_volume_down"
                    placeholder="音量减 场景实体（如 scene.tv_vol_down）"
                  />
                  <input 
                    type="text" 
                    @change=${this._entityChanged}
                    .value=${this.config.tuya_command?.volume_mute || ''}
                    name="tuya_command_volume_mute"
                    placeholder="静音 场景实体（如 scene.tv_mute）"
                  />
                </div>
              </div>
              
              <!-- 方向控制按钮 -->
              <div style="border: 1px solid #ddd; padding: 10px; border-radius: 4px;">
                <label style="font-weight: normal; font-size: 12px; color: #666;">方向控制按钮 - 场景实体</label>
                <div style="display: flex; flex-direction: column; gap: 5px;">
                  <input 
                    type="text" 
                    @change=${this._entityChanged}
                    .value=${this.config.tuya_command?.up || ''}
                    name="tuya_command_up"
                    placeholder="上键 场景实体（如 scene.tv_up）"
                  />
                  <input 
                    type="text" 
                    @change=${this._entityChanged}
                    .value=${this.config.tuya_command?.down || ''}
                    name="tuya_command_down"
                    placeholder="下键 场景实体（如 scene.tv_down）"
                  />
                  <input 
                    type="text" 
                    @change=${this._entityChanged}
                    .value=${this.config.tuya_command?.left || ''}
                    name="tuya_command_left"
                    placeholder="左键 场景实体（如 scene.tv_left）"
                  />
                  <input 
                    type="text" 
                    @change=${this._entityChanged}
                    .value=${this.config.tuya_command?.right || ''}
                    name="tuya_command_right"
                    placeholder="右键 场景实体（如 scene.tv_right）"
                  />
                  <input 
                    type="text" 
                    @change=${this._entityChanged}
                    .value=${this.config.tuya_command?.center || ''}
                    name="tuya_command_center"
                    placeholder="确认键 场景实体（如 scene.tv_enter）"
                  />
                </div>
              </div>
            </div>
          </div>
          ${this._renderAppsConfig('tuya_app', '涂鸦快捷App按钮', '场景实体(scene.xxx)')}
        ` : ''}
      </div>
    `;
  }

  constructor() {
    super();
    this._remoteSearchText = '';
    this._remoteSearchFocused = false;
    this._turnOnSearchText = '';
    this._turnOnSearchFocused = false;
    this._turnOffSearchText = '';
    this._turnOffSearchFocused = false;
    this._appCurrentSearchText = '';
    this._appCurrentSearchFocused = false;
    this._volumeNumberSearchText = '';
    this._volumeNumberSearchFocused = false;
  }

  _renderAppRow(modeKey, namePlaceholder, cmdPlaceholder, nameVal, cmdVal, index) {
    const idx = index + 1;
    const nameName = modeKey + '_app' + idx + '_name';
    const cmdName = modeKey + '_app' + idx + '_command';
    return html`
      <div style="display: flex; gap: 6px; align-items: center;">
        <input type="text" @change=${this._entityChanged} .value=${nameVal || ''} name=${nameName} placeholder=${namePlaceholder + idx} style="flex:1;min-width:60px;padding:4px 6px;font-size:12px;border:1px solid #ddd;border-radius:3px;" />
        <input type="text" @change=${this._entityChanged} .value=${cmdVal || ''} name=${cmdName} placeholder=${cmdPlaceholder} style="flex:2;padding:4px 6px;font-size:12px;border:1px solid #ddd;border-radius:3px;" />
      </div>`;
  }

  _renderAppsConfig(modeKey, nameLabel, cmdLabel) {
    const cfg = this.config[modeKey] || {};
    return html`
      <div style="border: 1px solid #ddd; padding: 10px; border-radius: 4px; margin-top: 10px;">
        <label style="font-weight: normal; font-size: 12px; color: #666;">${nameLabel}（最多7个）</label>
        <div style="display: flex; flex-direction: column; gap: 5px;">
          ${[0,1,2,3,4,5,6].map(i => {
            const idx = i + 1;
            return this._renderAppRow(modeKey, 'App名称', cmdLabel, cfg['app'+idx+'_name'], cfg['app'+idx+'_command'], i);
          })}
        </div>
      </div>`;
  }

  _getEntityDisplayName(entityId) {
    if (!this.hass || !this.hass.states[entityId]) return entityId;
    const state = this.hass.states[entityId];
    const friendlyName = state.attributes.friendly_name;
    return friendlyName ? `${friendlyName} (${entityId})` : entityId;
  }

  _getFilteredRemoteEntities() {
    if (!this.hass) return [];
    const searchText = (this._remoteSearchText || '').toLowerCase();
    return Object.keys(this.hass.states)
      .filter(entityId => entityId.startsWith('select.') || entityId.startsWith('remote.') || entityId.startsWith('media_player.'))
      .filter(entityId => {
        const friendlyName = (this.hass.states[entityId].attributes.friendly_name || '').toLowerCase();
        return entityId.toLowerCase().includes(searchText) || friendlyName.includes(searchText);
      });
  }

  _onRemoteSearchInput(e) {
    this._remoteSearchText = e.target.value;
    this._remoteSearchFocused = true;
    this.requestUpdate();
  }

  _onRemoteSearchFocus() {
    this._remoteSearchFocused = true;
    this.requestUpdate();
  }

  _onRemoteSearchBlur() {
    setTimeout(() => {
      this._remoteSearchFocused = false;
      this.requestUpdate();
    }, 200);
  }

  _selectRemoteEntity(e, entityId) {
    e.preventDefault();
    const newConfig = { ...this.config, remote_control: entityId };
    this.config = newConfig;
    this._remoteSearchText = '';
    this._remoteSearchFocused = false;
    this.dispatchEvent(new CustomEvent('config-changed', {
      detail: { config: this.config },
      bubbles: true,
      composed: true
    }));
    this.requestUpdate();
  }

  _clearRemoteControl() {
    const newConfig = { ...this.config, remote_control: '' };
    this.config = newConfig;
    this._remoteSearchText = '';
    this.dispatchEvent(new CustomEvent('config-changed', {
      detail: { config: this.config },
      bubbles: true,
      composed: true
    }));
    this.requestUpdate();
  }

  _getFilteredTurnOnEntities() {
    if (!this.hass) return [];
    const searchText = (this._turnOnSearchText || '').toLowerCase();
    return Object.keys(this.hass.states)
      .filter(entityId => entityId.startsWith('button.') || entityId.startsWith('script.') || entityId.startsWith('switch.'))
      .filter(entityId => {
        const friendlyName = (this.hass.states[entityId].attributes.friendly_name || '').toLowerCase();
        return entityId.toLowerCase().includes(searchText) || friendlyName.includes(searchText);
      });
  }

  _onTurnOnSearchInput(e) {
    this._turnOnSearchText = e.target.value;
    this._turnOnSearchFocused = true;
    this.requestUpdate();
  }

  _onTurnOnSearchFocus() {
    this._turnOnSearchFocused = true;
    this.requestUpdate();
  }

  _onTurnOnSearchBlur() {
    setTimeout(() => {
      this._turnOnSearchFocused = false;
      this.requestUpdate();
    }, 200);
  }

  _selectTurnOnEntity(e, entityId) {
    e.preventDefault();
    const newConfig = { ...this.config, turn_on_button: entityId };
    this.config = newConfig;
    this._turnOnSearchText = '';
    this._turnOnSearchFocused = false;
    this.dispatchEvent(new CustomEvent('config-changed', {
      detail: { config: this.config },
      bubbles: true,
      composed: true
    }));
    this.requestUpdate();
  }

  _clearTurnOnButton() {
    const newConfig = { ...this.config, turn_on_button: '' };
    this.config = newConfig;
    this._turnOnSearchText = '';
    this.dispatchEvent(new CustomEvent('config-changed', {
      detail: { config: this.config },
      bubbles: true,
      composed: true
    }));
    this.requestUpdate();
  }

  _getFilteredTurnOffEntities() {
    if (!this.hass) return [];
    const searchText = (this._turnOffSearchText || '').toLowerCase();
    return Object.keys(this.hass.states)
      .filter(entityId => entityId.startsWith('button.') || entityId.startsWith('script.') || entityId.startsWith('switch.'))
      .filter(entityId => {
        const friendlyName = (this.hass.states[entityId].attributes.friendly_name || '').toLowerCase();
        return entityId.toLowerCase().includes(searchText) || friendlyName.includes(searchText);
      });
  }

  _onTurnOffSearchInput(e) {
    this._turnOffSearchText = e.target.value;
    this._turnOffSearchFocused = true;
    this.requestUpdate();
  }

  _onTurnOffSearchFocus() {
    this._turnOffSearchFocused = true;
    this.requestUpdate();
  }

  _onTurnOffSearchBlur() {
    setTimeout(() => {
      this._turnOffSearchFocused = false;
      this.requestUpdate();
    }, 200);
  }

  _selectTurnOffEntity(e, entityId) {
    e.preventDefault();
    const newConfig = { ...this.config, turn_off_button: entityId };
    this.config = newConfig;
    this._turnOffSearchText = '';
    this._turnOffSearchFocused = false;
    this.dispatchEvent(new CustomEvent('config-changed', {
      detail: { config: this.config },
      bubbles: true,
      composed: true
    }));
    this.requestUpdate();
  }

  _clearTurnOffButton() {
    const newConfig = { ...this.config, turn_off_button: '' };
    this.config = newConfig;
    this._turnOffSearchText = '';
    this.dispatchEvent(new CustomEvent('config-changed', {
      detail: { config: this.config },
      bubbles: true,
      composed: true
    }));
    this.requestUpdate();
  }

  _getFilteredAppCurrentEntities() {
    if (!this.hass) return [];
    const searchText = (this._appCurrentSearchText || '').toLowerCase();
    return Object.keys(this.hass.states)
      .filter(entityId => entityId.startsWith('select.'))
      .filter(entityId => {
        const friendlyName = (this.hass.states[entityId].attributes.friendly_name || '').toLowerCase();
        return entityId.toLowerCase().includes(searchText) || friendlyName.includes(searchText);
      });
  }

  _onAppCurrentSearchInput(e) {
    this._appCurrentSearchText = e.target.value;
    this._appCurrentSearchFocused = true;
    this.requestUpdate();
  }

  _onAppCurrentSearchFocus() {
    this._appCurrentSearchFocused = true;
    this.requestUpdate();
  }

  _onAppCurrentSearchBlur() {
    setTimeout(() => {
      this._appCurrentSearchFocused = false;
      this.requestUpdate();
    }, 200);
  }

  _selectAppCurrentEntity(e, entityId) {
    e.preventDefault();
    const newConfig = { ...this.config, app_current: entityId };
    this.config = newConfig;
    this._appCurrentSearchText = '';
    this._appCurrentSearchFocused = false;
    this.dispatchEvent(new CustomEvent('config-changed', {
      detail: { config: this.config },
      bubbles: true,
      composed: true
    }));
    this.requestUpdate();
  }

  _clearAppCurrent() {
    const newConfig = { ...this.config, app_current: '', app_current_config: {} };
    this.config = newConfig;
    this._appCurrentSearchText = '';
    this.dispatchEvent(new CustomEvent('config-changed', {
      detail: { config: this.config },
      bubbles: true,
      composed: true
    }));
    this.requestUpdate();
  }

  _getFilteredVolumeNumberEntities() {
    if (!this.hass) return [];
    const searchText = (this._volumeNumberSearchText || '').toLowerCase();
    return Object.keys(this.hass.states)
      .filter(entityId => entityId.startsWith('number.'))
      .filter(entityId => {
        const friendlyName = (this.hass.states[entityId].attributes.friendly_name || '').toLowerCase();
        return entityId.toLowerCase().includes(searchText) || friendlyName.includes(searchText);
      });
  }

  _onVolumeNumberSearchInput(e) {
    this._volumeNumberSearchText = e.target.value;
    this._volumeNumberSearchFocused = true;
    this.requestUpdate();
  }

  _onVolumeNumberSearchFocus() {
    this._volumeNumberSearchFocused = true;
    this.requestUpdate();
  }

  _onVolumeNumberSearchBlur() {
    setTimeout(() => {
      this._volumeNumberSearchFocused = false;
      this.requestUpdate();
    }, 200);
  }

  _selectVolumeNumberEntity(e, entityId) {
    e.preventDefault();
    const newConfig = { ...this.config, volume_number: entityId };
    this.config = newConfig;
    this._volumeNumberSearchText = '';
    this._volumeNumberSearchFocused = false;
    this.dispatchEvent(new CustomEvent('config-changed', {
      detail: { config: this.config },
      bubbles: true,
      composed: true
    }));
    this.requestUpdate();
  }

  _clearVolumeNumber() {
    const newConfig = { ...this.config, volume_number: '' };
    this.config = newConfig;
    this._volumeNumberSearchText = '';
    this.dispatchEvent(new CustomEvent('config-changed', {
      detail: { config: this.config },
      bubbles: true,
      composed: true
    }));
    this.requestUpdate();
  }

  _onAppOptionShowChange(e, option) {
    const appConfig = { ...(this.config.app_current_config || {}) };
    const existing = appConfig[option] || { show: true, name: option };
    appConfig[option] = { ...existing, show: e.target.checked };
    const newConfig = { ...this.config, app_current_config: appConfig };
    this.config = newConfig;
    this.dispatchEvent(new CustomEvent('config-changed', {
      detail: { config: this.config },
      bubbles: true,
      composed: true
    }));
    this.requestUpdate();
  }

  _onAppOptionNameChange(e, option) {
    const appConfig = { ...(this.config.app_current_config || {}) };
    const existing = appConfig[option] || { show: true, name: option };
    appConfig[option] = { ...existing, name: e.target.value || option };
    const newConfig = { ...this.config, app_current_config: appConfig };
    this.config = newConfig;
    this.dispatchEvent(new CustomEvent('config-changed', {
      detail: { config: this.config },
      bubbles: true,
      composed: true
    }));
  }

  _entityChanged(e) {
    const { name, value } = e.target;
    if (!value && name !== 'theme' && name !== 'width' && name !== 'height' && name !== 'remote_control' && name !== 'turn_on_button' && name !== 'turn_off_button' && name !== 'app_current' && name !== 'app_current_config') return;
    
    // 对于width字段，如果为空则使用默认值100%
    // 对于height字段，如果为空则使用默认值80px
    let finalValue = value;
    if (name === 'width') {
      finalValue = value || '100%';
    } else if (name === 'height') {
      finalValue = value || '80px';
    }
    
    let newConfig;
    
    // 处理ADB命令的嵌套结构
    if (name.startsWith('adb_command_')) {
      const commandName = name.replace('adb_command_', '');
      newConfig = {
        ...this.config,
        adb_command: {
          ...this.config.adb_command,
          [commandName]: finalValue
        }
      };
    } else if (name.startsWith('ir_command_')) {
      const commandName = name.replace('ir_command_', '');
      newConfig = {
        ...this.config,
        ir_command: {
          ...this.config.ir_command,
          [commandName]: finalValue
        }
      };
    } else if (name.startsWith('esphome_code_')) {
      const commandName = name.replace('esphome_code_', '');
      newConfig = {
        ...this.config,
        esphome_code: {
          ...this.config.esphome_code,
          [commandName]: finalValue
        }
      };
    } else if (name.startsWith('adb_app_')) {
      const key = name.replace('adb_app_', '');
      newConfig = { ...this.config, adb_app: { ...this.config.adb_app, [key]: finalValue } };
    } else if (name.startsWith('ir_app_')) {
      const key = name.replace('ir_app_', '');
      newConfig = { ...this.config, ir_app: { ...this.config.ir_app, [key]: finalValue } };
    } else if (name.startsWith('esphome_app_')) {
      const key = name.replace('esphome_app_', '');
      newConfig = { ...this.config, esphome_app: { ...this.config.esphome_app, [key]: finalValue } };
    } else if (name.startsWith('tuya_app_')) {
      const key = name.replace('tuya_app_', '');
      newConfig = { ...this.config, tuya_app: { ...this.config.tuya_app, [key]: finalValue } };
    } else if (name.startsWith('tuya_command_')) {
      const commandName = name.replace('tuya_command_', '');
      newConfig = {
        ...this.config,
        tuya_command: {
          ...this.config.tuya_command,
          [commandName]: finalValue
        }
      };
    } else {
      newConfig = {
        ...this.config,
        [name]: finalValue
      };
    }
    
    this.config = newConfig;
    
    this.dispatchEvent(new CustomEvent('config-changed', {
      detail: { config: this.config },
      bubbles: true,
      composed: true
    }));
  }

  setConfig(config) {
    this.config = config;
  }
}
customElements.define('xiaoshi-tv-player-editor', TvPlayerEditor);

class TvPlayer extends LitElement {
  static get properties() {
    return {
      _hass: { type: Object },
      config: { type: Object },
      xiaomiHomeEntity: { type: String },
      remoteControlEntity: { type: String },
      turnOnButtonEntity: { type: String },
      turnOffButtonEntity: { type: String },
      appCurrentEntity: { type: String },
      infraredEntity: { type: String },
      irCommands: { type: Object },
      esphomeService: { type: String },
      esphomeCode: { type: Object },
      appCurrentConfig: { type: Object },
      adbEntity: { type: String },
      volumeNumberEntity: { type: String },
      tvConnectionMode: { type: String },
      xiaomiHomeState: { type: Object },
      volumeState: { type: Number },
      isPlaying: { type: Boolean },
      theme: { type: String },
      width: { type: String },
      height: { type: String },
      _showSourcePopup: { type: Boolean },
      _showHistory: { type: Boolean },
      _historyData: { type: Array },
      _historyLoading: { type: Boolean }
    };
  }

  static get styles() {
    return css`
      :host {
        display: block;
        border-radius: 12px;
        padding: 0px;
        cursor: none;
        overflow: visible;
        --mdc-ripple-press-opacity: 0;
        max-width: 500px;
        margin: 0 auto;
        margin-top: 0;
      }

      .player-grid {
        display: grid;
        width: 100%;
        height: 270px;
        overflow: visible;
      }

      .icon-area {
        grid-area: icon;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 4px;
      }

      .player-icon {
        width: 50px;
        height: 50px;
        border-radius: 50%;
        background-size: cover;
        background-position: center;
        background-color: #333;
        animation: none;
      }

      .player-icon.playing {
        animation: rotating 10s linear infinite;
      }

      .music-icon {
        width: 50px;
        height: 50px;
        display: flex;
        align-items: center;
        justify-content: center;
        color: var(--fg-color);
        background-color: rgb(150,150,150,0.6);
        border-radius: 50%;
        animation: none;
      }

      .music-icon.playing {
        animation: rotating 10s linear infinite;
      }

      @keyframes rotating {
        from { transform: rotate(0deg); }
        to { transform: rotate(360deg); }
      }

      .name-area {
        grid-area: name;
        display: flex;
        align-items: center;
      }

      .name-label {
        font-size: 16px;
        color: var(--fg-color, rgb(255, 255, 255));
        text-align: left;
        width: 100%;
      }

      .info-area {
        grid-area: info;
        display: flex;
        align-items: center;
      }

      .info-label {
        font-size: 12px;
        color: var(--fg-color, rgb(255, 255, 255));
        text-align: left;
      }

      .volume-area {
        grid-area: volume;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .volume-label {
        font-size: 14px;
        font-weight: bold;
        color: var(--fg-color, rgb(255, 255, 255));
        text-align: center;
      }

      .control-button {
        background: rgba(0, 0, 0, 0);
        border: none;
        border-radius: 12px;
        color: var(--fg-color, rgb(255, 255, 255));
        cursor: none;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 25px;
        transition: all 0.2s;
        --mdc-ripple-press-opacity: 0;
        --mdc-icon-size: 20px;
        padding: 0;
      }

      .control-button:active {
        background: rgba(255, 255, 255, 0.2);
        border-radius: 12px !important;
      }

      .control-button:focus {
        outline: none;
        background: rgba(0, 0, 0, 0);
      }

      .control-button ha-icon {
        width: 25px;
        height: 25px;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 0;
        border-radius: 12px;
      }

      .power-button {
        grid-area: power;
      }

      .power-on-button {
        grid-area: power_on;
      }

      .power-off-button {
        grid-area: power_off;
      }

      .volume-down {
        grid-area: volume-down;
      }

      .volume-up {
        grid-area: volume-up;
      }

      .volume-mute {
        grid-area: volume-mute;
      }

      .prev-button {
        grid-area: prev;
      }

      .play-button {
        grid-area: play;
      }

      .pause-button {
        grid-area: pause;
      }

      .next-button {
        grid-area: next;
      }

      .history-btn {
        grid-area: history;
      }

      .xinhaoyuan-area {
        grid-area: xinhaoyuan;
        display: flex;
        align-items: flex-start;
        padding-top: 8px;
      }

      .xinhaoyuan-button {
        position: relative;
        background: var(--theme-bg, rgba(80, 80, 80, 0.7));
        border: 1px solid var(--divider-color, rgba(255,255,255,0.2));
        border-radius: 6px;
        color: var(--theme-fg, rgb(255, 255, 255));
        cursor: pointer;
        font-size: 12px;
        padding: 5px 8px 5px 8px;
        margin-right: 12px;
        white-space: nowrap;
        transition: all 0.2s;
        width: 100%;
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 4px;
        --mdc-ripple-press-opacity: 0;
      }

      .xinhaoyuan-button .arrow {
        font-size: 10px;
        transition: transform 0.2s;
      }

      .xinhaoyuan-button .arrow.open {
        transform: rotate(180deg);
      }

      .xinhaoyuan-button:active {
        background: var(--theme-bg-active, rgba(120, 120, 120, 0.9));
      }

      .xinhaoyuan-popup {
        position: absolute;
        top: 100%;
        left: 0;
        right: 0;
        margin-top: 2px;
        background: var(--theme-bg, rgba(80, 80, 80, 0.7));
        border: 1px solid var(--divider-color, #555);
        border-radius: 0 0 6px 6px;
        border-top: none;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        z-index: 1000;
        max-height: 200px;
        overflow-y: auto;
        padding: 0;
      }

      .xinhaoyuan-popup-item {
        padding: 8px 14px;
        font-size: 13px;
        color: var(--popup-fg, #fff);
        cursor: pointer;
        white-space: nowrap;
        transition: background 0.15s;
      }

      .xinhaoyuan-popup-item:hover {
        background: var(--secondary-background-color, #555);
      }

      .xinhaoyuan-popup-item.active {
        color: rgb(25, 165, 225);
        font-weight: bold;
      }

      .home-button {
        grid-area: home;
      }

      .back-button {
        grid-area: back;
      }

      .menu-button {
        grid-area: menu;
      }

      .setting-button {
        grid-area: setting;
      }

      .directional-area {
        grid-area: fangxiang;
        position: relative;
        display: flex;
        align-items: center;
        justify-content: center;
        width: 100%;
        height: 160px;
      }

      .directional-pad {
        position: relative;
        width: 100%;
        height: 160px;
        --r: 70px;
        --d: 49.5px;
      }

      .directional-button {
        position: absolute;
        background: var(--theme-bg, rgba(80, 80, 80, 0.7));
        border: none;
        border-radius: 50%;
        cursor: none;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.2s;
        color: var(--theme-fg, rgb(255, 255, 255));
        font-size: 20px;
        width: 150px;
        height: 150px;
        --mdc-ripple-press-opacity: 0;
        transform: translate(-50%, -50%);
        top: 50%;
        left: 50%;
      }

      .directional-button:active {
        background: var(--theme-bg-active, rgba(120, 120, 120, 0.9));
        transform: translate(-50%, -50%) scale(0.95);
      }

      .directional-button ha-icon {
        width: 24px;
        height: 24px;
        position: absolute;
      }

      .directional-button.up {
        clip-path: path('M 80,80  L 136.57,23.43  A 80,80  90 0, 0  23.43,23.43 Z');
      }

      .directional-button.up ha-icon {
        top: 15%;
        left: 50%;
        transform: translate(-50%, -50%);
        width: 24px;
        height: 24px;
      }

      .directional-button.down {
        clip-path: path('M 80,80  L 23.43,136.57  A 80,80  90 0, 0  136.57,136.57 Z');
      }

      .directional-button.down ha-icon {
        top: 85%;
        left: 50%;
        transform: translate(-50%, -50%);
        width: 24px;
        height: 24px;
      }

      .directional-button.left {
        clip-path: path('M 80,80  L 23.43,23.43  A 80,80  90 0, 0  23.43,136.57 Z');
      }

      .directional-button.left ha-icon {
        top: 50%;
        left: 15%;
        transform: translate(-50%, -50%);
        width: 24px;
        height: 24px;
      }

      .directional-button.right {
        clip-path: path('M 80,80  L 136.57,136.57  A 80,80  90 0, 0  136.57,23.43 Z');
      }

      .directional-button.right ha-icon {
        top: 50%;
        left: 85%;
        transform: translate(-50%, -50%);
        width: 24px;
        height: 24px;
      }

      .directional-button.center {
        margin: 0;
        width: 60px;
        height: 60px;
        background: var(--theme-bg, rgba(80, 80, 80, 0.9));
        border-radius: 50%;
        font-size: 14px;
        font-weight: bold;
        clip-path: none;
        display: flex;
        align-items: center;
        justify-content: center;
        color: var(--theme-fg, rgb(255, 255, 255));
        transform: translate(-50%, -50%);
      }

      .directional-button.center:active {
        background: var(--theme-bg-active, rgba(120, 120, 120, 0.9));
        transform: translate(-50%, -50%) scale(0.95);
      }

      .progress-area {
        grid-area: progress;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 5px 0 0 0;
      }

      .progress-bar {
        width: 95%;
        height: 3px;
        border-radius: 5px;
        align-items: flex-end;
        background: linear-gradient(to right, rgb(25, 165, 225) var(--progress-percentage), rgba(200, 200, 200, 0.5) var(--progress-percentage));
      }

      .volume-slider-container {
        grid-area: volume-slider;
        display: flex;
        align-items: center;
        justify-content: center;
        width: 100%;
        height: 100%;
        padding: 0 0;
      }

      .volume-slider {
        width: 100%;
        height: 6px;
        border-radius: 3px;
        background: rgb(255, 165, 0);
        outline: none;
        -webkit-appearance: none;
        appearance: none;
        cursor: none;
      }

      .volume-slider::-webkit-slider-thumb {
        -webkit-appearance: none;
        appearance: none;
        width: 13px;
        height: 13px;
        border-radius: 50%;
        background: rgb(255, 165, 0);
        cursor: none;
        border: 2px solid var(--fg-color, rgb(255, 255, 255));
        box-shadow: none;
      }

      .volume-slider::-moz-range-thumb {
        width: 10px;
        height: 10px;
        border-radius: 50%;
        background: rgb(255, 165, 0);
        cursor: none;
        border: 2px solid var(--fg-color, rgb(255, 255, 255));
        box-shadow: none;
      }

      .volume-slider::-webkit-slider-thumb:hover {
        background: rgb(255, 140, 0);
        border-color: var(--fg-color, rgb(255, 255, 255));
      }

      .volume-slider::-moz-range-thumb:hover {
        background: rgb(255, 140, 0);
        border-color: var(--fg-color, rgb(255, 255, 255));
      }

      .app-buttons-area {
        grid-area: appbtn;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 6px;
        padding: 2px 8px;
        flex-wrap: nowrap;
        overflow-x: auto;
        scrollbar-width: none;
        -ms-overflow-style: none;
        margin-top: -24px;

      }

      .app-buttons-area::-webkit-scrollbar {
        display: none;
      }

      .app-button {
        flex: 0 0 auto;
        height: 24px;
        border-radius: 12px;
        font-size: 10px;
        padding: 2px 6px;
        border: none;
        background: var(--theme-bg, rgba(80, 80, 80));
        color: var(--button-fg, rgb(255, 255, 255));
        cursor: none;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        min-width: 0;
        width: 55px;
        transition: all 0.2s;
        --mdc-ripple-press-opacity: 0;
      }

      .app-button:active {
        background: var(--theme-bg-active, rgba(120, 120, 120, 0.9));
        transform: scale(0.95);
      }

      .app-button.active {
        border-color: rgb(25, 165, 225);
        background: rgba(25, 165, 225, 0.7);
        color: var(--theme-fg, rgb(255, 255, 255));
      }

    `;
  }
  
  constructor() {
    super();
    this._hass = null;
    this.config = {};
    this.xiaomiHomeEntity = '';
    this.remoteControlEntity = '';
    this.turnOnButtonEntity = '';
    this.turnOffButtonEntity = '';
    this.appCurrentEntity = '';
    this.appCurrentConfig = {};
    this.infraredEntity = '';
    this.irCommands = {
      power_on: 'KEY_POWER',
      power_off: 'KEY_POWER',
      home: 'KEY_HOME',
      back: 'KEY_BACK',
      menu: 'KEY_MENU',
      setting: 'KEY_SETTINGS',
      play: 'KEY_PLAY',
      pause: 'KEY_PAUSE',
      next: 'KEY_NEXT',
      previous: 'KEY_PREVIOUS',
      volume_up: 'KEY_VOLUMEUP',
      volume_down: 'KEY_VOLUMEDOWN',
      volume_mute: 'KEY_MUTE',
      up: 'KEY_UP',
      down: 'KEY_DOWN',
      left: 'KEY_LEFT',
      right: 'KEY_RIGHT',
      center: 'KEY_ENTER'
    };
    this.esphomeService = '';
    this.esphomeCode = {
      power_on: '',
      power_off: '',
      home: '',
      back: '',
      menu: '',
      setting: '',
      play: '',
      pause: '',
      next: '',
      previous: '',
      volume_up: '',
      volume_down: '',
      volume_mute: '',
      up: '',
      down: '',
      left: '',
      right: '',
      center: ''
    };
    this.adbEntity = '';
    this.volumeNumberEntity = '';
    this.tvConnectionMode = 'integration';
    this.tuyaCommands = {
      power_on: '',
      power_off: '',
      home: '',
      back: '',
      menu: '',
      setting: '',
      play: '',
      pause: '',
      next: '',
      previous: '',
      volume_up: '',
      volume_down: '',
      volume_mute: '',
      up: '',
      down: '',
      left: '',
      right: '',
      center: ''
    };
    this.adbAppConfigs = [];
    this.irAppConfigs = [];
    this.esphomeAppConfigs = [];
    this.tuyaAppConfigs = [];
    this.buttonCommands = {
      power_on: 'POWER',
      power_off: 'POWER',
      home: 'HOME',
      back: 'BACK',
      menu: 'MENU',
      setting: 'am start -n com.android.settings/.Settings',
      play: 'CENTER',
      pause: 'CENTER',
      next: 'NEXT',
      previous: 'PREVIOUS',
      volume_up: 'VOLUME_UP',
      volume_down: 'VOLUME_DOWN',
      volume_mute: 'MUTE',
      up: 'UP',
      down: 'DOWN',
      left: 'LEFT',
      right: 'RIGHT',
      center: 'CENTER'
    };
    this.xiaomiHomeState = {
      state: 'idle',
      attributes: {
        friendly_name: '音乐播放器',
        media_title: '未播放',
        media_artist: '',
        entity_picture: '',
        media_duration: 0,
        media_position: 0,
        volume_level: 0.5
      }
    };
    this.volumeState = 20;
    this.isPlaying = false;
    this.volumeDebounceTimer = null;
    this.isDragging = false;
    this.localVolumeUpdate = false;
    this._showSourcePopup = false;
    this._showHistory = false;
    this._historyData = [];
    this._historyLoading = false;
    this._historyFilterPeriod = 24;
    this.theme = 'system';
    this.width = '100%';
    this.height = '80px';

  }

  _evaluateTheme() {
      try {
          const mode = this.config ? this.config.theme : 'system';
          if (mode === 'light' || mode === 'on') return 'light';
          if (mode === 'dark' || mode === 'off') return 'dark';
          if (mode === 'system' || !mode) {
              if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) return 'dark';
              return 'light';
          }
          if (mode === 'sun') {
              const sunState = this._hass && this._hass.states && this._hass.states['sun.sun'];
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

  disconnectedCallback() {
    super.disconnectedCallback();
    // 清理防抖定时器
    if (this.volumeDebounceTimer) {
      clearTimeout(this.volumeDebounceTimer);
      this.volumeDebounceTimer = null;
    }

  }

  // Home Assistant 卡片必需的方法
  setConfig(config) {
  
    this.config = {
      entity: config.entity || config.xiaomi_home,
      volume_number: config.volume_number,
      remote_control: config.remote_control,
      tv_connection_mode: config.tv_connection_mode || 'integration',
      adb_entity: config.adb_entity,
      theme: config.theme,
      width: config.width,
      height: config.height,
      ...config
    };
    
    // 确保theme有默认值
    if (this.config.theme === undefined) {
      this.config.theme = 'system';
    }
    
    // 确保width有默认值
    if (this.config.width === undefined) {
      this.config.width = '100%';
    }
    
    // 确保height有默认值
    if (this.config.height === undefined) {
      this.config.height = '80px';
    }
    
    this.xiaomiHomeEntity = this.config.entity;
    this.remoteControlEntity = this.config.remote_control;
    this.turnOnButtonEntity = this.config.turn_on_button;
    this.turnOffButtonEntity = this.config.turn_off_button;
    this.appCurrentEntity = this.config.app_current;
    this.appCurrentConfig = this.config.app_current_config || {};
    this.adbEntity = this.config.adb_entity;
    this.volumeNumberEntity = this.config.volume_number || '';
    this.infraredEntity = this.config.ir_entity;
    this.esphomeService = this.config.esphome_service || '';
    this.tuyaCommands = {
      power_on: this.config.tuya_command?.power_on || '',
      power_off: this.config.tuya_command?.power_off || '',
      home: this.config.tuya_command?.home || '',
      back: this.config.tuya_command?.back || '',
      menu: this.config.tuya_command?.menu || '',
      setting: this.config.tuya_command?.setting || '',
      play: this.config.tuya_command?.play || '',
      pause: this.config.tuya_command?.pause || '',
      next: this.config.tuya_command?.next || '',
      previous: this.config.tuya_command?.previous || '',
      volume_up: this.config.tuya_command?.volume_up || '',
      volume_down: this.config.tuya_command?.volume_down || '',
      volume_mute: this.config.tuya_command?.volume_mute || '',
      up: this.config.tuya_command?.up || '',
      down: this.config.tuya_command?.down || '',
      left: this.config.tuya_command?.left || '',
      right: this.config.tuya_command?.right || '',
      center: this.config.tuya_command?.center || ''
    };
    this.esphomeCode = {
      power_on: this.config.esphome_code?.power_on || '',
      power_off: this.config.esphome_code?.power_off || '',
      home: this.config.esphome_code?.home || '',
      back: this.config.esphome_code?.back || '',
      menu: this.config.esphome_code?.menu || '',
      setting: this.config.esphome_code?.setting || '',
      play: this.config.esphome_code?.play || '',
      pause: this.config.esphome_code?.pause || '',
      next: this.config.esphome_code?.next || '',
      previous: this.config.esphome_code?.previous || '',
      volume_up: this.config.esphome_code?.volume_up || '',
      volume_down: this.config.esphome_code?.volume_down || '',
      volume_mute: this.config.esphome_code?.volume_mute || '',
      up: this.config.esphome_code?.up || '',
      down: this.config.esphome_code?.down || '',
      left: this.config.esphome_code?.left || '',
      right: this.config.esphome_code?.right || '',
      center: this.config.esphome_code?.center || ''
    };
    this.irCommands = {
      power_on: this.config.ir_command?.power_on || 'KEY_POWER',
      power_off: this.config.ir_command?.power_off || 'KEY_POWER',
      home: this.config.ir_command?.home || 'KEY_HOME',
      back: this.config.ir_command?.back || 'KEY_BACK',
      menu: this.config.ir_command?.menu || 'KEY_MENU',
      setting: this.config.ir_command?.setting || 'KEY_SETTINGS',
      play: this.config.ir_command?.play || 'KEY_PLAY',
      pause: this.config.ir_command?.pause || 'KEY_PAUSE',
      next: this.config.ir_command?.next || 'KEY_NEXT',
      previous: this.config.ir_command?.previous || 'KEY_PREVIOUS',
      volume_up: this.config.ir_command?.volume_up || 'KEY_VOLUMEUP',
      volume_down: this.config.ir_command?.volume_down || 'KEY_VOLUMEDOWN',
      volume_mute: this.config.ir_command?.volume_mute || 'KEY_MUTE',
      up: this.config.ir_command?.up || 'KEY_UP',
      down: this.config.ir_command?.down || 'KEY_DOWN',
      left: this.config.ir_command?.left || 'KEY_LEFT',
      right: this.config.ir_command?.right || 'KEY_RIGHT',
      center: this.config.ir_command?.center || 'KEY_ENTER'
    };
    this.tvConnectionMode = this.config.tv_connection_mode || 'integration';
    this.adbAppConfigs = this._parseAppConfigs(this.config.adb_app);
    this.irAppConfigs = this._parseAppConfigs(this.config.ir_app);
    this.esphomeAppConfigs = this._parseAppConfigs(this.config.esphome_app);
    this.tuyaAppConfigs = this._parseAppConfigs(this.config.tuya_app);
    this.buttonCommands = {
      power_on: this.config.adb_command?.power_on || 'POWER',
      power_off: this.config.adb_command?.power_off || 'POWER',
      home: this.config.adb_command?.home || 'HOME',
      back: this.config.adb_command?.back || 'BACK',
      menu: this.config.adb_command?.menu || 'MENU',
      setting: this.config.adb_command?.setting || 'am start -n com.android.settings/.Settings',
      play: this.config.adb_command?.play || 'CENTER',
      pause: this.config.adb_command?.pause || 'CENTER',
      next: this.config.adb_command?.next || 'NEXT',
      previous: this.config.adb_command?.previous || 'PREVIOUS',
      volume_up: this.config.adb_command?.volume_up || 'VOLUME_UP',
      volume_down: this.config.adb_command?.volume_down || 'VOLUME_DOWN',
      volume_mute: this.config.adb_command?.volume_mute || 'MUTE',
      up: this.config.adb_command?.up || 'UP',
      down: this.config.adb_command?.down || 'DOWN',
      left: this.config.adb_command?.left || 'LEFT',
      right: this.config.adb_command?.right || 'RIGHT',
      center: this.config.adb_command?.center || 'CENTER'
    };
    this.width = this.config.width;
    this.height = this.config.height;
    
    // 触发重新渲染以应用主题更改
    this.requestUpdate();
  }

  set hass(hass) {
    this._hass = hass;
    
    // 优先从 volume_number 实体读取音量
    if (!this.localVolumeUpdate && this.volumeNumberEntity && hass) {
      const numState = hass.states[this.volumeNumberEntity];
      if (numState) {
        const val = parseFloat(numState.state);
        if (!isNaN(val)) {
          this.volumeState = Math.round(val);
        }
      }
    }
    
    if (hass && this.xiaomiHomeEntity) {
      const state = hass.states[this.xiaomiHomeEntity];
      if (state) {
        this.xiaomiHomeState = state;
        this.isPlaying = ['playing', 'Playing', '播放', '播放中', '正在播放'].includes(state.state);
        if (!this.localVolumeUpdate && !this.volumeNumberEntity && state.attributes && state.attributes.volume_level !== undefined) {
          this.volumeState = Math.round((state.attributes.volume_level || 0) * 100);
        }
      }
    }
    
    this.requestUpdate();
    this.localVolumeUpdate = false;  
  }

  getCardSize() {
    return 4;
  }

  static getConfigElement() {
    return document.createElement("xiaoshi-tv-player-editor");
  }

  static getStubConfig() {
    return {
    };
  }

  // 模拟 Home Assistant 状态更新
  updatePlayerState(state) {
    this.playerState = { ...this.playerState, ...state };
    this.isPlaying = ['播放', '播放中', '正在播放', 'playing', 'Playing'].includes(state.state);
    this.requestUpdate();
  }

  updateVolume(volume) {
    this.volumeState = Math.max(0, Math.min(100, volume));
    this.localVolumeUpdate = true; // 标记为本地更新
    this.requestUpdate();
  }

  // 控制方法 - 调用实际的 Home Assistant 服务
  async callService(service, data = {}) {
    if (this._hass) {
      try {
        await this._hass.callService(service.split('.')[0], service.split('.')[1], data);
      } catch (error) {
        console.error('服务调用失败:', error);
      }
    }
  }

  sendInfraredCommand(command) {
    if (this.infraredEntity) {
      this.callService('remote.send_command', {
        entity_id: this.infraredEntity,
        command: command
      });
    }
  }

  sendEsphomeCommand(code) {
    if (this.esphomeService && code) {
      const parts = this.esphomeService.split('.');
      if (parts.length === 2) {
        this.callService(this.esphomeService, {
          data: code
        });
      }
    }
  }

  sendTuyaCommand(sceneEntity) {
    if (sceneEntity && sceneEntity.startsWith('scene.')) {
      this.callService('scene.turn_on', {
        entity_id: sceneEntity
      });
    }
  }

  _getVisibleAppOptions() {
    if (!this.appCurrentEntity || !this._hass) return [];
    const state = this._hass.states[this.appCurrentEntity];
    if (!state || !state.attributes || !state.attributes.options) return [];
    const allOptions = state.attributes.options;
    const config = this.appCurrentConfig || {};
    return allOptions
      .filter(option => {
        const itemConfig = config[option];
        return !itemConfig || itemConfig.show !== false;
      })
      .slice(0, 8);
  }

  _getAppDisplayName(option) {
    const config = this.appCurrentConfig || {};
    const itemConfig = config[option];
    if (itemConfig && itemConfig.name && itemConfig.name !== option) return itemConfig.name;
    return option;
  }

  handleAppClick(option) {
    this.handleClick();
    if (this.appCurrentEntity) {
      this.callService('select.select_option', {
        entity_id: this.appCurrentEntity,
        option: option
      });
    }
  }

  _getSourceList() {
    const targetEntity = this.xiaomiHomeEntity;
    if (!targetEntity || !this._hass) return [];
    const state = this._hass.states[targetEntity];
    if (!state || !state.attributes) return [];
    return state.attributes.source_list || [];
  }

  _getCurrentSource() {
    const targetEntity = this.xiaomiHomeEntity;
    if (!targetEntity || !this._hass) return '';
    const state = this._hass.states[targetEntity];
    if (!state || !state.attributes) return '';
    return state.attributes.source || '';
  }

  handleXinhaoyuan() {
    this.handleClick();
    this._showSourcePopup = !this._showSourcePopup;
    this.requestUpdate();
  }

  handleSourceSelect(source) {
    this.handleClick();
    this._showSourcePopup = false;
    const targetEntity = this.xiaomiHomeEntity;
    if (targetEntity) {
      this.callService('media_player.select_source', {
        entity_id: targetEntity,
        source: source
      });
    }
    this.requestUpdate();
  }

  _getVolumeNumberValue() {
    if (!this.volumeNumberEntity || !this._hass) return this.volumeState;
    const state = this._hass.states[this.volumeNumberEntity];
    if (state) {
      const val = parseFloat(state.state);
      if (!isNaN(val)) return Math.round(val);
    }
    return this.volumeState;
  }

  _parseAppConfigs(appObj) {
    if (!appObj) return [];
    const result = [];
    for (let i = 1; i <= 7; i++) {
      const name = appObj['app' + i + '_name'];
      const command = appObj['app' + i + '_command'];
      if (name && command) result.push({ name, command });
    }
    return result;
  }

  _getAppButtons() {
    if (this.tvConnectionMode === 'adb') return this.adbAppConfigs;
    if (this.tvConnectionMode === 'infrared') return this.irAppConfigs;
    if (this.tvConnectionMode === 'esphome_ir') return this.esphomeAppConfigs;
    if (this.tvConnectionMode === 'tuya_ir') return this.tuyaAppConfigs;
    return [];
  }

  handleAppButtonClick(appConfig) {
    this.handleClick();
    if (this.tvConnectionMode === 'adb' && this.adbEntity) {
      this.callService('androidtv.adb_command', { entity_id: this.adbEntity, command: appConfig.command });
    } else if (this.tvConnectionMode === 'infrared' && this.infraredEntity) {
      this.sendInfraredCommand(appConfig.command);
    } else if (this.tvConnectionMode === 'esphome_ir' && this.esphomeService) {
      this.sendEsphomeCommand(appConfig.command);
    } else if (this.tvConnectionMode === 'tuya_ir') {
      this.sendTuyaCommand(appConfig.command);
    }
  }

  handleClick(){
    if (navigator.vibrate) {
      navigator.vibrate(50);
    }
    else if (navigator.webkitVibrate) {
        navigator.webkitVibrate(50); 
    }
    else {
    }
  }

  handlePower() {
    this.handleClick();
    const targetEntity = this.xiaomiHomeEntity;
    const state = this._hass?.states[targetEntity];
    const isOff = !state || state.state === 'off' || state.state === 'unavailable';

    // 最高优先级：turn_on_button / turn_off_button（适用于所有模式）
    if (isOff && this.turnOnButtonEntity) {
      const domain = this.turnOnButtonEntity.split('.')[0];
      if (domain === 'button') {
        this.callService('button.press', { entity_id: this.turnOnButtonEntity });
      } else if (domain === 'script') {
        this.callService('script.turn_on', { entity_id: this.turnOnButtonEntity });
      } else if (domain === 'switch') {
        this.callService('switch.turn_on', { entity_id: this.turnOnButtonEntity });
      } else {
        this.callService('media_player.turn_on', { entity_id: targetEntity });
      }
      return;
    }
    if (!isOff && this.turnOffButtonEntity) {
      const domain = this.turnOffButtonEntity.split('.')[0];
      if (domain === 'button') {
        this.callService('button.press', { entity_id: this.turnOffButtonEntity });
      } else if (domain === 'script') {
        this.callService('script.turn_on', { entity_id: this.turnOffButtonEntity });
      } else if (domain === 'switch') {
        this.callService('switch.turn_off', { entity_id: this.turnOffButtonEntity });
      } else {
        this.callService('media_player.turn_off', { entity_id: targetEntity });
      }
      return;
    }

    if (this.tvConnectionMode === 'adb' && this.adbEntity) {
      this.callService('androidtv.adb_command', {
        entity_id: this.adbEntity,
        command: isOff ? this.buttonCommands.power_on : this.buttonCommands.power_off
      });
    } else if (this.tvConnectionMode === 'infrared' && this.infraredEntity) {
      this.sendInfraredCommand(isOff ? this.irCommands.power_on : this.irCommands.power_off);
    } else if (this.tvConnectionMode === 'esphome_ir' && this.esphomeService) {
      this.sendEsphomeCommand(isOff ? this.esphomeCode.power_on : this.esphomeCode.power_off);
    } else if (this.tvConnectionMode === 'tuya_ir') {
      this.sendTuyaCommand(isOff ? this.tuyaCommands.power_on : this.tuyaCommands.power_off);
    } else {
      if (isOff) {
        this.callService('media_player.turn_on', { entity_id: targetEntity });
      } else {
        this.callService('media_player.turn_off', { entity_id: targetEntity });
      }
    }
  }

  handlePowerOn() {
    this.handleClick();
    // 最高优先级：打开电视按钮（适用于所有模式）
    if (this.turnOnButtonEntity) {
      const domain = this.turnOnButtonEntity.split('.')[0];
      if (domain === 'button') {
        this.callService('button.press', { entity_id: this.turnOnButtonEntity });
        return;
      } else if (domain === 'script') {
        this.callService('script.turn_on', { entity_id: this.turnOnButtonEntity });
        return;
      } else if (domain === 'switch') {
        this.callService('switch.turn_on', { entity_id: this.turnOnButtonEntity });
        return;
      }
    }
    if (this.tvConnectionMode === 'adb' && this.adbEntity) {
      this.callService('androidtv.adb_command', {
        entity_id: this.adbEntity,
        command: this.buttonCommands.power_on
      });
      return;
    }
    if (this.tvConnectionMode === 'infrared' && this.infraredEntity) {
      this.sendInfraredCommand(this.irCommands.power_on);
      return;
    }
    if (this.tvConnectionMode === 'esphome_ir' && this.esphomeService) {
      this.sendEsphomeCommand(this.esphomeCode.power_on);
      return;
    }
    if (this.tvConnectionMode === 'tuya_ir') {
      this.sendTuyaCommand(this.tuyaCommands.power_on);
      return;
    }
    const targetEntity = this.xiaomiHomeEntity;
    this.callService('media_player.turn_on', { entity_id: targetEntity });
  }

  handlePowerOff() {
    this.handleClick();
    // 最高优先级：关闭电视按钮（适用于所有模式）
    if (this.turnOffButtonEntity) {
      const domain = this.turnOffButtonEntity.split('.')[0];
      if (domain === 'button') {
        this.callService('button.press', { entity_id: this.turnOffButtonEntity });
        return;
      } else if (domain === 'script') {
        this.callService('script.turn_on', { entity_id: this.turnOffButtonEntity });
        return;
      } else if (domain === 'switch') {
        this.callService('switch.turn_off', { entity_id: this.turnOffButtonEntity });
        return;
      }
    }
    if (this.tvConnectionMode === 'adb' && this.adbEntity) {
      this.callService('androidtv.adb_command', {
        entity_id: this.adbEntity,
        command: this.buttonCommands.power_off
      });
      return;
    }
    if (this.tvConnectionMode === 'infrared' && this.infraredEntity) {
      this.sendInfraredCommand(this.irCommands.power_off);
      return;
    }
    if (this.tvConnectionMode === 'esphome_ir' && this.esphomeService) {
      this.sendEsphomeCommand(this.esphomeCode.power_off);
      return;
    }
    if (this.tvConnectionMode === 'tuya_ir') {
      this.sendTuyaCommand(this.tuyaCommands.power_off);
      return;
    }
    const targetEntity = this.xiaomiHomeEntity;
    this.callService('media_player.turn_off', { entity_id: targetEntity });
  }

  handleVolumeDown() {
    this.handleClick();
    // 最高优先级：音量Number实体
    if (this.volumeNumberEntity) {
      const currentVal = this._getVolumeNumberValue();
      const newVal = Math.max(0, currentVal - 1);
      this.updateVolume(newVal);
      this.callService('number.set_value', {
        entity_id: this.volumeNumberEntity,
        value: newVal
      });
      return;
    }
    if (this.tvConnectionMode === 'adb' && this.adbEntity) {
      this.callService('androidtv.adb_command', {
        entity_id: this.adbEntity,
        command: this.buttonCommands.volume_down
      });
    } else if (this.tvConnectionMode === 'infrared' && this.infraredEntity) {
      this.sendInfraredCommand(this.irCommands.volume_down);
    } else if (this.tvConnectionMode === 'esphome_ir' && this.esphomeService) {
      this.sendEsphomeCommand(this.esphomeCode.volume_down);
    } else if (this.tvConnectionMode === 'tuya_ir') {
      this.sendTuyaCommand(this.tuyaCommands.volume_down);
    } else {
      const newVolume = Math.max(0, this.volumeState - 1);
      this.updateVolume(newVolume);
      if (this.xiaomiHomeEntity) {
        this.callService('media_player.volume_set', {
          entity_id: this.xiaomiHomeEntity,
          volume_level: newVolume / 100
        });
      }
    }
  }

  handleVolumeMute() {
    this.handleClick();
    const targetVolume = this.volumeState === 0 ? 5 : 0;
    // 最高优先级：音量Number实体
    if (this.volumeNumberEntity) {
      this.updateVolume(targetVolume);
      this.callService('number.set_value', {
        entity_id: this.volumeNumberEntity,
        value: targetVolume
      });
      return;
    }
    if (this.tvConnectionMode === 'adb' && this.adbEntity) {
      this.callService('androidtv.adb_command', {
        entity_id: this.adbEntity,
        command: this.buttonCommands.volume_mute
      });
      return;
    }
    if (this.tvConnectionMode === 'infrared' && this.infraredEntity) {
      this.sendInfraredCommand(this.irCommands.volume_mute);
      return;
    }
    if (this.tvConnectionMode === 'esphome_ir' && this.esphomeService) {
      this.sendEsphomeCommand(this.esphomeCode.volume_mute);
      return;
    }
    if (this.tvConnectionMode === 'tuya_ir') {
      this.sendTuyaCommand(this.tuyaCommands.volume_mute);
      return;
    }
    const targetEntity = this.xiaomiHomeEntity;
    if (targetEntity && this._hass?.states[targetEntity]) {
      const muteState = this._hass.states[targetEntity].attributes?.is_volume_muted;
      this.callService('media_player.volume_mute', {
        entity_id: targetEntity,
        is_volume_muted: !muteState
      });
      return;
    }
    this.updateVolume(targetVolume);
    if (this.xiaomiHomeEntity) {
      this.callService('media_player.volume_set', {
        entity_id: this.xiaomiHomeEntity,
        volume_level: targetVolume / 100
      });
    }
  }

  handleVolumeUp() {
    this.handleClick();
    // 最高优先级：音量Number实体
    if (this.volumeNumberEntity) {
      const currentVal = this._getVolumeNumberValue();
      const newVal = Math.min(100, currentVal + 1);
      this.updateVolume(newVal);
      this.callService('number.set_value', {
        entity_id: this.volumeNumberEntity,
        value: newVal
      });
      return;
    }
    if (this.tvConnectionMode === 'adb' && this.adbEntity) {
      this.callService('androidtv.adb_command', {
        entity_id: this.adbEntity,
        command: this.buttonCommands.volume_up
      });
    } else if (this.tvConnectionMode === 'infrared' && this.infraredEntity) {
      this.sendInfraredCommand(this.irCommands.volume_up);
    } else if (this.tvConnectionMode === 'esphome_ir' && this.esphomeService) {
      this.sendEsphomeCommand(this.esphomeCode.volume_up);
    } else if (this.tvConnectionMode === 'tuya_ir') {
      this.sendTuyaCommand(this.tuyaCommands.volume_up);
    } else {
      const newVolume = Math.min(100, this.volumeState + 1);
      this.updateVolume(newVolume);
      if (this.xiaomiHomeEntity) {
        this.callService('media_player.volume_set', {
          entity_id: this.xiaomiHomeEntity,
          volume_level: newVolume / 100
        });
      }
    }
  }

  handleVolumeChange(e) {
    const newVolume = parseInt(e.target.value);
    
    // 立即更新本地显示
    this.updateVolume(newVolume);
    
    // 清理之前的定时器
    if (this.volumeDebounceTimer) {
      clearTimeout(this.volumeDebounceTimer);
    }
    
    // 防抖动：停止拖动后300ms才调用服务
    this.volumeDebounceTimer = setTimeout(() => {
    this.handleClick();
      // 最高优先级：音量Number实体
      if (this.volumeNumberEntity) {
        this.callService('number.set_value', {
          entity_id: this.volumeNumberEntity,
          value: newVolume
        });
      } else if (this.xiaomiHomeEntity) {
        this.callService('media_player.volume_set', {
          entity_id: this.xiaomiHomeEntity,
          volume_level: newVolume / 100
        });
      }
      this.volumeDebounceTimer = null;
    }, 300);
  }

  handleVolumeStart() {
    this.isDragging = true;
  }

  handleVolumeEnd(e) {
    if (this.isDragging) {
      this.isDragging = false;
      const newVolume = parseInt(e.target.value);
      if (this.volumeDebounceTimer) {
        clearTimeout(this.volumeDebounceTimer);
        this.volumeDebounceTimer = null;
      }
      this.handleClick();
      // 最高优先级：音量Number实体
      if (this.volumeNumberEntity) {
        this.callService('number.set_value', {
          entity_id: this.volumeNumberEntity,
          value: newVolume
        });
      } else if (this.xiaomiHomeEntity) {
        this.callService('media_player.volume_set', {
          entity_id: this.xiaomiHomeEntity,
          volume_level: newVolume / 100
        });
      }
    }
  }

  handlePrevious() {
    this.handleClick();
    if (this.tvConnectionMode === 'adb' && this.adbEntity) {
      this.callService('androidtv.adb_command', {
        entity_id: this.adbEntity,
        command: this.buttonCommands.previous
      });
    } else if (this.tvConnectionMode === 'infrared' && this.infraredEntity) {
      this.sendInfraredCommand(this.irCommands.previous);
    } else if (this.tvConnectionMode === 'esphome_ir' && this.esphomeService) {
      this.sendEsphomeCommand(this.esphomeCode.previous);
    } else if (this.tvConnectionMode === 'tuya_ir') {
      this.sendTuyaCommand(this.tuyaCommands.previous);
    } else {
      const targetEntity = this.xiaomiHomeEntity;
      this.callService('media_player.media_previous_track', {
        entity_id: targetEntity
      });
    }
  }

  handlePlayPause() {
    this.handleClick();
    if (this.tvConnectionMode === 'adb' && this.adbEntity) {
      this.callService('androidtv.adb_command', {
        entity_id: this.adbEntity,
        command: this.buttonCommands.play
      });
    } else if (this.tvConnectionMode === 'infrared' && this.infraredEntity) {
      this.sendInfraredCommand(this.irCommands.play);
    } else if (this.tvConnectionMode === 'esphome_ir' && this.esphomeService) {
      this.sendEsphomeCommand(this.esphomeCode.play);
    } else if (this.tvConnectionMode === 'tuya_ir') {
      this.sendTuyaCommand(this.tuyaCommands.play);
    } else {
      const targetEntity = this.xiaomiHomeEntity;
      this.callService('media_player.media_play_pause', {
        entity_id: targetEntity
      });
    }
  }

  handlePause() {
    this.handleClick();
    if (this.tvConnectionMode === 'adb' && this.adbEntity) {
      this.callService('androidtv.adb_command', {
        entity_id: this.adbEntity,
        command: this.buttonCommands.pause
      });
    } else if (this.tvConnectionMode === 'infrared' && this.infraredEntity) {
      this.sendInfraredCommand(this.irCommands.pause);
    } else if (this.tvConnectionMode === 'esphome_ir' && this.esphomeService) {
      this.sendEsphomeCommand(this.esphomeCode.pause);
    } else if (this.tvConnectionMode === 'tuya_ir') {
      this.sendTuyaCommand(this.tuyaCommands.pause);
    } else {
      const targetEntity = this.xiaomiHomeEntity;
      this.callService('media_player.turn_off', {
        entity_id: targetEntity
      });
    }
  }

  handleNext() {
    this.handleClick();
    if (this.tvConnectionMode === 'adb' && this.adbEntity) {
      this.callService('androidtv.adb_command', {
        entity_id: this.adbEntity,
        command: this.buttonCommands.next
      });
    } else if (this.tvConnectionMode === 'infrared' && this.infraredEntity) {
      this.sendInfraredCommand(this.irCommands.next);
    } else if (this.tvConnectionMode === 'esphome_ir' && this.esphomeService) {
      this.sendEsphomeCommand(this.esphomeCode.next);
    } else if (this.tvConnectionMode === 'tuya_ir') {
      this.sendTuyaCommand(this.tuyaCommands.next);
    } else {
      const targetEntity = this.xiaomiHomeEntity;
      this.callService('media_player.media_next_track', {
        entity_id: targetEntity
      });
    }
  }

  // ========== 历史记录功能 ==========

  _toggleHistory() {
    this.handleClick();
    if (this._showHistory) {
      this._closeHistoryOverlay();
      return;
    }
    this._showHistory = true;
    this._showHistoryOverlay();
    this._fetchHistory();
  }

  async _fetchHistory() {
    try {
      const targetEntity = this.xiaomiHomeEntity;
      if (!targetEntity) return;
      const periodHours = this._historyFilterPeriod || 24;
      const endTime = new Date();
      const startTime = new Date(endTime.getTime() - periodHours * 60 * 60 * 1000);
      const startStr = startTime.toISOString();
      const endStr = endTime.toISOString();

      const data = await this._hass.callApi(
        'GET',
        `history/period/${startStr}?end_time=${endStr}&filter_entity_id=${targetEntity}&minimal_response&no_attributes`
      );

      const result = [];
      const allEntities = Array.isArray(data) ? data : [];
      for (const entityHistory of allEntities) {
        if (!entityHistory || entityHistory.length === 0) continue;
        const eId = entityHistory[0].entity_id;
        if (!eId) continue;
        const stateObj = this._hass.states[eId];
        const friendlyName = stateObj?.attributes?.friendly_name || eId;
        const rawEntries = entityHistory
          .filter(entry => entry && entry.last_changed)
          .sort((a, b) => new Date(b.last_changed) - new Date(a.last_changed));
        const entries = [];
        for (const entry of rawEntries) {
          const last = entries[entries.length - 1];
          const curRaw = (entry.state || '').trim();
          const lastRaw = last ? (last.state || '').trim() : null;
          if (last && lastRaw === curRaw) {
            entries[entries.length - 1] = entry;
          } else {
            entries.push(entry);
          }
        }
        if (entries.length > 0) {
          result.push({ entityId: eId, name: friendlyName, entries: entries });
        }
      }
      this._historyData = result;
    } catch (e) {
      console.error('获取播放历史记录失败:', e);
      this._historyData = [];
    } finally {
      this._historyLoading = false;
      this._updateHistoryContent();
    }
  }

  _showHistoryOverlay() {
    if (this._historyOverlayEl) return;
    const theme = this._evaluateTheme();
    const isDark = theme === 'dark';
    const targetEntity = this.xiaomiHomeEntity;
    const ent = this._hass?.states?.[targetEntity];
    const roomName = ent?.attributes?.friendly_name || targetEntity || '电视播放器';
    const textColor = isDark ? '#fff' : '#333';
    const bgColor = isDark ? '#2c2c2c' : '#fff';
    const borderColor = isDark ? '#aaa' : '#888';
    const btnBg = isDark ? '#444' : '#f0f0f0';
    const btnIconColor = isDark ? '#ccc' : '#666';
    const chipBg = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)';
    const chipActiveBg = 'rgb(33, 150, 243)';
    const chipActiveColor = '#fff';

    this._historyFilterPeriod = 24;

    const overlay = document.createElement('div');
    overlay.className = 'xiaoshi-tv-history-overlay';
    overlay.style.cssText = 'position:fixed;top:0;left:0;width:100vw;height:100vh;background:rgba(0,0,0,0.5);z-index:99999;display:flex;align-items:flex-start;justify-content:center;padding-top:20px;';
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) this._closeHistoryOverlay();
    });

    const dialog = document.createElement('div');
    dialog.style.cssText = `background:${bgColor};border-radius:16px;width:95vw;max-width:500px;max-height:85vh;display:flex;flex-direction:column;box-shadow:0 8px 40px rgba(0,0,0,0.25);`;

    const header = document.createElement('div');
    header.style.cssText = `display:flex;justify-content:space-between;align-items:center;padding:10px 0;margin:0 20px;border-bottom:1px solid ${borderColor};`;
    const title = document.createElement('span');
    title.style.cssText = `font-size:1.1rem;font-weight:700;color:${textColor};`;
    title.textContent = `${roomName} - 播放历史`;
    const closeBtn = document.createElement('button');
    closeBtn.style.cssText = `width:36px;height:36px;border-radius:50%;border:none;background:${btnBg};cursor:pointer;display:flex;align-items:center;justify-content:center;`;
    closeBtn.innerHTML = `<ha-icon icon="mdi:close" style="--mdc-icon-size:20px;color:${btnIconColor};"></ha-icon>`;
    closeBtn.addEventListener('click', () => this._closeHistoryOverlay());
    header.appendChild(title);
    header.appendChild(closeBtn);

    const toolbar = document.createElement('div');
    toolbar.style.cssText = `display:flex;align-items:center;gap:8px;padding:10px 5px;margin:0 20px;border-bottom:1px solid ${borderColor};flex-wrap:wrap;`;

    const timeRow = document.createElement('div');
    timeRow.style.cssText = 'display:flex;align-items:center;gap:8px;';
    const timeLabel = document.createElement('span');
    timeLabel.style.cssText = `font-size:0.75rem;color:${isDark?'#aaa':'#888'};flex-shrink:0;`;
    timeLabel.textContent = '时段:';
    timeRow.appendChild(timeLabel);

    const timeChips = document.createElement('div');
    timeChips.style.cssText = 'display:flex;gap:4px;flex-wrap:wrap;';
    const periods = [
      { label: '1小时', value: 1 },
      { label: '6小时', value: 6 },
      { label: '24小时', value: 24 },
      { label: '3天', value: 72 },
      { label: '7天', value: 168 },
      { label: '15天', value: 360 }
    ];
    for (const p of periods) {
      const chip = this._buildFilterChip(p.label, p.value, chipBg, chipActiveBg, chipActiveColor, isDark);
      chip.addEventListener('click', () => {
        this._historyFilterPeriod = p.value;
        this._refreshHistoryChips(timeChips, this._historyFilterPeriod, chipBg, chipActiveBg, chipActiveColor, isDark);
        this._refetchWithFilters();
      });
      timeChips.appendChild(chip);
    }
    timeRow.appendChild(timeChips);
    toolbar.appendChild(timeRow);

    const body = document.createElement('div');
    body.style.cssText = 'flex:1;overflow-y:auto;padding:6px 20px;';
    body.innerHTML = `<div style="display:flex;align-items:center;justify-content:center;padding:40px;color:${isDark?'#aaa':'#999'};"><ha-icon icon="mdi:loading" style="--mdc-icon-size:24px;"></ha-icon>&nbsp;加载中...</div>`;

    dialog.appendChild(header);
    dialog.appendChild(toolbar);
    dialog.appendChild(body);
    overlay.appendChild(dialog);
    document.body.appendChild(overlay);

    this._historyOverlayEl = overlay;
    this._historyBodyEl = body;
    this._historyTimeChipsEl = timeChips;
  }

  _updateHistoryContent() {
    if (!this._historyBodyEl) return;
    const theme = this._evaluateTheme();
    const isDark = theme === 'dark';
    const ac = this._getHistoryAccentColor();

    if (this._historyLoading) {
      this._historyBodyEl.innerHTML = `<div style="display:flex;align-items:center;justify-content:center;padding:40px;color:${isDark?'#aaa':'#999'};"><ha-icon icon="mdi:loading" style="--mdc-icon-size:24px;"></ha-icon>&nbsp;加载中...</div>`;
      return;
    }

    if (!this._historyData || this._historyData.length === 0) {
      this._historyBodyEl.innerHTML = `<div style="text-align:center;padding:40px;color:${isDark?'#aaa':'#999'};font-size:0.9rem;">暂无播放历史记录</div>`;
      return;
    }

    let html = '';
    for (const entityData of this._historyData) {
      const { entityId, name, entries } = entityData;

      let playingMs = 0, pausedMs = 0, idleMs = 0, otherMs = 0;

      const dedupedEntries = [];
      for (const entry of entries) {
        const last = dedupedEntries[dedupedEntries.length - 1];
        const curRaw = (entry.state || '').trim();
        const lastRaw = last ? (last.state || '').trim() : null;
        if (last && lastRaw === curRaw) {
          dedupedEntries[dedupedEntries.length - 1] = entry;
        } else {
          dedupedEntries.push(entry);
        }
      }

      const entriesWithDuration = [];
      for (let i = 0; i < dedupedEntries.length; i++) {
        const entry = dedupedEntries[i];
        const time = new Date(entry.last_changed);
        const prevEntry = dedupedEntries[i - 1];
        const endTime = prevEntry ? new Date(prevEntry.last_changed) : new Date();
        const durationMs = Math.max(0, endTime - time);
        entriesWithDuration.push({ entry, time, durationMs });
      }

      const filtered = [];
      for (const item of entriesWithDuration) {
        const s = (item.entry.state || '').trim();
        if (s === 'unavailable' && item.durationMs < 60000) continue;
        const last = filtered[filtered.length - 1];
        if (last && (last.entry.state || '').trim() === s) {
          last.durationMs += item.durationMs;
          last.time = item.time;
        } else {
          filtered.push({ ...item });
        }
      }

      for (const item of filtered) {
        const s = (item.entry.state || '').trim();
        if (s === 'playing') playingMs += item.durationMs;
        else if (s === 'paused') pausedMs += item.durationMs;
        else if (s === 'idle') idleMs += item.durationMs;
        else otherMs += item.durationMs;
      }

      const totalMs = playingMs + pausedMs + idleMs + otherMs;
      const playingPercent = totalMs > 0 ? Math.round(playingMs / totalMs * 100) : 0;

      const periodHours = this._historyFilterPeriod || 24;
      const now = new Date();
      const rangeStart = new Date(now.getTime() - periodHours * 60 * 60 * 1000);
      const timelineBlocks = this._buildTimeline(entries, rangeStart, now);

      html += `<div style="margin:8px 0px;border-bottom:1px solid ${isDark?'#aaa':'#888'};">`;
      html += `<div style="display:flex;align-items:center;gap:8px;margin-bottom:8px;">`;
      html += `<span style="display:flex;align-items:center;gap:4px;font-weight:700;font-size:0.85rem;color:${isDark?'#ddd':'#444'};white-space:nowrap;"><ha-icon icon="mdi:television-classic" style="--mdc-icon-size:16px;color:${ac};"></ha-icon>${name}</span>`;
      html += `<span style="font-size:0.7rem;color:${ac};white-space:nowrap;">播放 ${playingPercent}%</span>`;
      html += `<div style="flex:1;display:flex;height:8px;border-radius:3px;overflow:hidden;">${timelineBlocks}</div>`;
      html += `</div>`;

      for (const { entry, time, durationMs } of filtered) {
        const timeStr = time.toLocaleString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });
        const rawState = (entry.state || '').trim();
        const stateLabel = this._translateMusicState(rawState);
        const stateColor = this._getMusicStateColor(rawState);
        const durationStr = this._formatDuration(durationMs);
        const scRgb = stateColor.replace(/[^\d,]/g, '');
        const isPlaying = rawState === 'playing';
        const isOffline = rawState === 'unavailable' || rawState === 'unknown';
        const entryBg = isPlaying ? (isDark ? `rgba(${scRgb},0.12)` : `rgba(${scRgb},0.08)`) : (isOffline ? (isDark ? 'rgba(244,67,54,0.12)' : 'rgba(244,67,54,0.06)') : (isDark ? '#383838' : '#f5f5f5'));
        html += `<div style="border-radius:10px;padding:1px 12px;margin-bottom:8px;background:${entryBg};"><div style="display:flex;justify-content:space-between;align-items:center;"><span style="font-size:0.8rem;padding:2px 4px;border-radius:10px;font-weight:500;color:${stateColor};">${stateLabel} · ${durationStr}</span><span style="font-size:0.75rem;color:${isDark?'#aaa':'#999'};">${timeStr}</span></div></div>`;
      }
      html += `</div>`;
    }
    this._historyBodyEl.innerHTML = html;
  }

  _closeHistoryOverlay() {
    if (this._historyOverlayEl) {
      this._historyOverlayEl.remove();
      this._historyOverlayEl = null;
      this._historyBodyEl = null;
      this._historyTimeChipsEl = null;
    }
    this._showHistory = false;
    this._historyData = [];
    this._historyLoading = false;
    this._historyFilterPeriod = 24;
  }

  _refetchWithFilters() {
    this._historyLoading = true;
    this._updateHistoryContent();
    this._fetchHistory();
  }

  _getHistoryAccentColor() {
    const targetEntity = this.xiaomiHomeEntity;
    const entity = this._hass?.states?.[targetEntity];
    const state = entity?.state || 'idle';
    return this._getMusicStateColor(state);
  }

  _getMusicStateColor(state) {
    const s = (state || '').trim();
    if (s === 'playing') return 'rgb(76, 175, 80)';
    if (s === 'paused') return 'rgb(255, 193, 7)';
    if (s === 'idle') return 'rgba(10, 165, 243)';
    if (s === 'off') return 'rgb(153, 153, 153)';
    if (s === 'unavailable' || s === 'unknown') return 'rgb(244, 67, 54)';
    return 'rgb(33, 150, 243)';
  }

  _translateMusicState(state) {
    const s = (state || '').trim();
    const translations = {
      'playing': '播放中',
      'paused': '已暂停',
      'idle': '待机中',
      'off': '已关闭',
      'unavailable': '已离线',
      'unknown': '未知'
    };
    return translations[s] || s;
  }

  _formatDuration(ms) {
    const periodHours = this._historyFilterPeriod || 24;
    const periodMs = periodHours * 60 * 60 * 1000;
    if (ms < 60000) return '少于1分钟';
    if (ms >= periodMs) {
      if (periodHours < 24) return `大于${periodHours}小时`;
      if (periodHours < 72) return `大于${periodHours}小时`;
      const days = Math.floor(periodHours / 24);
      return `大于${days}天`;
    }
    const minutes = Math.floor(ms / 60000);
    if (minutes < 60) return `${minutes}分钟`;
    const hours = Math.floor(minutes / 60);
    const remainMin = minutes % 60;
    if (hours < 24) return remainMin > 0 ? `${hours}小时${remainMin}分钟` : `${hours}小时`;
    const days = Math.floor(hours / 24);
    const remainHr = hours % 24;
    return remainHr > 0 ? `${days}天${remainHr}小时` : `${days}天`;
  }

  _buildTimeline(entries, rangeStart, rangeEnd) {
    const rangeMs = rangeEnd - rangeStart;
    if (rangeMs <= 0 || entries.length === 0) return '';
    const sorted = [...entries].sort((a, b) => new Date(a.last_changed) - new Date(b.last_changed));
    const filtered = [];
    for (let i = 0; i < sorted.length; i++) {
      const entry = sorted[i];
      const segStart = new Date(entry.last_changed);
      const segEnd = i + 1 < sorted.length ? new Date(sorted[i + 1].last_changed) : rangeEnd;
      const durationMs = segEnd - segStart;
      const s = (entry.state || '').trim();
      if ((s === 'unavailable' || s === 'unknown') && durationMs < 60000) continue;
      filtered.push(entry);
    }
    const segments = [];
    for (let i = 0; i < filtered.length; i++) {
      const entry = filtered[i];
      const segStart = new Date(entry.last_changed);
      const segEnd = i + 1 < filtered.length ? new Date(filtered[i + 1].last_changed) : rangeEnd;
      const visibleStart = segStart < rangeStart ? rangeStart : segStart;
      const visibleEnd = segEnd > rangeEnd ? rangeEnd : segEnd;
      const durationMs = visibleEnd - visibleStart;
      if (durationMs > 0) {
        const rawState = (entry.state || '').trim();
        const percent = (durationMs / rangeMs) * 100;
        const lastSeg = segments[segments.length - 1];
        if (lastSeg && lastSeg.state === rawState) {
          lastSeg.percent += percent;
        } else {
          segments.push({ state: rawState, percent });
        }
      }
    }
    let blocks = '';
    for (const seg of segments) {
      const color = this._getMusicStateColor(seg.state);
      blocks += `<div style="width:${seg.percent}%;min-width:1px;height:100%;background:${color};flex-shrink:0;"></div>`;
    }
    return blocks;
  }

  _buildFilterChip(label, value, chipBg, activeBg, activeColor, isDark) {
    const chip = document.createElement('span');
    chip.setAttribute('data-chip', '1');
    const isActive = (typeof value === 'number' && value === this._historyFilterPeriod);
    if (isActive) {
      chip.style.cssText = `padding:3px 10px;border-radius:12px;font-size:0.72rem;font-weight:500;cursor:pointer;white-space:nowrap;background:${activeBg};color:${activeColor};`;
    } else {
      chip.style.cssText = `padding:3px 10px;border-radius:12px;font-size:0.72rem;font-weight:500;cursor:pointer;white-space:nowrap;background:${chipBg};color:${isDark?'#ccc':'#555'};`;
    }
    chip.textContent = label;
    return chip;
  }

  _refreshHistoryChips(container, activePeriod, chipBg, activeBg, activeColor, isDark) {
    const chips = container.querySelectorAll('[data-chip]');
    chips.forEach(chip => {
      const label = chip.textContent;
      const isActive = (label === '24小时' && activePeriod === 24) ||
                       (label === '1小时' && activePeriod === 1) ||
                       (label === '6小时' && activePeriod === 6) ||
                       (label === '3天' && activePeriod === 72) ||
                       (label === '7天' && activePeriod === 168) ||
                       (label === '15天' && activePeriod === 360);
      if (isActive) {
        chip.style.background = activeBg;
        chip.style.color = activeColor;
      } else {
        chip.style.background = chipBg;
        chip.style.color = isDark ? '#ccc' : '#555';
      }
    });
  }

  // 遥控方向按键处理方法
  handleDirectionUp() {
    this.handleClick();
    if (this.tvConnectionMode === 'adb' && this.adbEntity) {
      this.callService('androidtv.adb_command', {
        entity_id: this.adbEntity,
        command: this.buttonCommands.up
      });
    } else if (this.tvConnectionMode === 'infrared' && this.infraredEntity) {
      this.sendInfraredCommand(this.irCommands.up);
    } else if (this.tvConnectionMode === 'esphome_ir' && this.esphomeService) {
      this.sendEsphomeCommand(this.esphomeCode.up);
    } else if (this.tvConnectionMode === 'tuya_ir') {
      this.sendTuyaCommand(this.tuyaCommands.up);
    } else if (this.remoteControlEntity) {
      this.callService('select.select_option', {
        entity_id: this.remoteControlEntity,
        option: 'up'
      });
    }
  }

  handleDirectionDown() {
    this.handleClick();
    if (this.tvConnectionMode === 'adb' && this.adbEntity) {
      this.callService('androidtv.adb_command', {
        entity_id: this.adbEntity,
        command: this.buttonCommands.down
      });
    } else if (this.tvConnectionMode === 'infrared' && this.infraredEntity) {
      this.sendInfraredCommand(this.irCommands.down);
    } else if (this.tvConnectionMode === 'esphome_ir' && this.esphomeService) {
      this.sendEsphomeCommand(this.esphomeCode.down);
    } else if (this.tvConnectionMode === 'tuya_ir') {
      this.sendTuyaCommand(this.tuyaCommands.down);
    } else if (this.remoteControlEntity) {
      this.callService('select.select_option', {
        entity_id: this.remoteControlEntity,
        option: 'down'
      });
    }
  }

  handleDirectionLeft() {
    this.handleClick();
    if (this.tvConnectionMode === 'adb' && this.adbEntity) {
      this.callService('androidtv.adb_command', {
        entity_id: this.adbEntity,
        command: this.buttonCommands.left
      });
    } else if (this.tvConnectionMode === 'infrared' && this.infraredEntity) {
      this.sendInfraredCommand(this.irCommands.left);
    } else if (this.tvConnectionMode === 'esphome_ir' && this.esphomeService) {
      this.sendEsphomeCommand(this.esphomeCode.left);
    } else if (this.tvConnectionMode === 'tuya_ir') {
      this.sendTuyaCommand(this.tuyaCommands.left);
    } else if (this.remoteControlEntity) {
      this.callService('select.select_option', {
        entity_id: this.remoteControlEntity,
        option: 'left'
      });
    }
  }

  handleDirectionRight() {
    this.handleClick();
    if (this.tvConnectionMode === 'adb' && this.adbEntity) {
      this.callService('androidtv.adb_command', {
        entity_id: this.adbEntity,
        command: this.buttonCommands.right
      });
    } else if (this.tvConnectionMode === 'infrared' && this.infraredEntity) {
      this.sendInfraredCommand(this.irCommands.right);
    } else if (this.tvConnectionMode === 'esphome_ir' && this.esphomeService) {
      this.sendEsphomeCommand(this.esphomeCode.right);
    } else if (this.tvConnectionMode === 'tuya_ir') {
      this.sendTuyaCommand(this.tuyaCommands.right);
    } else if (this.remoteControlEntity) {
      this.callService('select.select_option', {
        entity_id: this.remoteControlEntity,
        option: 'right'
      });
    }
  }

  handleDirectionCenter() {
    this.handleClick();
    if (this.tvConnectionMode === 'adb' && this.adbEntity) {
      this.callService('androidtv.adb_command', {
        entity_id: this.adbEntity,
        command: this.buttonCommands.center
      });
    } else if (this.tvConnectionMode === 'infrared' && this.infraredEntity) {
      this.sendInfraredCommand(this.irCommands.center);
    } else if (this.tvConnectionMode === 'esphome_ir' && this.esphomeService) {
      this.sendEsphomeCommand(this.esphomeCode.center);
    } else if (this.tvConnectionMode === 'tuya_ir') {
      this.sendTuyaCommand(this.tuyaCommands.center);
    } else if (this.remoteControlEntity) {
      this.callService('select.select_option', {
        entity_id: this.remoteControlEntity,
        option: 'enter'
      });
    }
  }

  handleHome() {
    this.handleClick();
    if (this.tvConnectionMode === 'adb' && this.adbEntity) {
      this.callService('androidtv.adb_command', {
        entity_id: this.adbEntity,
        command: this.buttonCommands.home
      });
    } else if (this.tvConnectionMode === 'infrared' && this.infraredEntity) {
      this.sendInfraredCommand(this.irCommands.home);
    } else if (this.tvConnectionMode === 'esphome_ir' && this.esphomeService) {
      this.sendEsphomeCommand(this.esphomeCode.home);
    } else if (this.tvConnectionMode === 'tuya_ir') {
      this.sendTuyaCommand(this.tuyaCommands.home);
    } else if (this.remoteControlEntity) {
      this.callService('select.select_option', {
        entity_id: this.remoteControlEntity,
        option: 'home'
      });
    }
  }

  handleBack() {
    this.handleClick();
    if (this.tvConnectionMode === 'adb' && this.adbEntity) {
      this.callService('androidtv.adb_command', {
        entity_id: this.adbEntity,
        command: this.buttonCommands.back
      });
    } else if (this.tvConnectionMode === 'infrared' && this.infraredEntity) {
      this.sendInfraredCommand(this.irCommands.back);
    } else if (this.tvConnectionMode === 'esphome_ir' && this.esphomeService) {
      this.sendEsphomeCommand(this.esphomeCode.back);
    } else if (this.tvConnectionMode === 'tuya_ir') {
      this.sendTuyaCommand(this.tuyaCommands.back);
    } else if (this.remoteControlEntity) {
      this.callService('select.select_option', {
        entity_id: this.remoteControlEntity,
        option: 'back'
      });
    }
  }

  handleMenu() {
    this.handleClick();
    if (this.tvConnectionMode === 'adb' && this.adbEntity) {
      this.callService('androidtv.adb_command', {
        entity_id: this.adbEntity,
        command: this.buttonCommands.menu
      });
    } else if (this.tvConnectionMode === 'infrared' && this.infraredEntity) {
      this.sendInfraredCommand(this.irCommands.menu);
    } else if (this.tvConnectionMode === 'esphome_ir' && this.esphomeService) {
      this.sendEsphomeCommand(this.esphomeCode.menu);
    } else if (this.tvConnectionMode === 'tuya_ir') {
      this.sendTuyaCommand(this.tuyaCommands.menu);
    } else if (this.remoteControlEntity) {
      this.callService('select.select_option', {
        entity_id: this.remoteControlEntity,
        option: 'menu'
      });
    }
  }

  handleSetting() {
    this.handleClick();
    if (this.tvConnectionMode === 'adb' && this.adbEntity) {
      this.callService('androidtv.adb_command', {
        entity_id: this.adbEntity,
        command: this.buttonCommands.setting
      });
    } else if (this.tvConnectionMode === 'infrared' && this.infraredEntity) {
      this.sendInfraredCommand(this.irCommands.setting);
    } else if (this.tvConnectionMode === 'esphome_ir' && this.esphomeService) {
      this.sendEsphomeCommand(this.esphomeCode.setting);
    } else if (this.tvConnectionMode === 'tuya_ir') {
      this.sendTuyaCommand(this.tuyaCommands.setting);
    } else if (this.remoteControlEntity) {
      this.callService('select.select_option', {
        entity_id: this.remoteControlEntity,
        option: 'settings'
      });
    }
  }

  getProgressPercentage() {
    let displayState = null;
    if (this.xiaomiHomeEntity && this._hass) {
      displayState = this._hass.states[this.xiaomiHomeEntity];
    }
    if (!displayState) {
      displayState = this.xiaomiHomeState;
    }
    
    if (!displayState || !displayState.attributes) {
      return 0;
    }
    
    const attributes = displayState.attributes;
    const media_duration = attributes.media_duration || attributes.duration || 0;
    const media_position = attributes.media_position || attributes.position || 0;
    
    const duration = parseFloat(media_duration) || 0;
    const position = parseFloat(media_position) || 0;
    
    if (duration <= 0) {
      return 0;
    }
    
    const percentage = (position / duration) * 100;
    return Math.min(100, Math.max(0, percentage));
  }

  getStateText() {
    let displayState = null;
    if (this.xiaomiHomeEntity && this._hass) {
      displayState = this._hass.states[this.xiaomiHomeEntity];
    }
    if (!displayState) {
      displayState = this.xiaomiHomeState;
    }
    
    const state = displayState?.state || 'idle';
    if (['播放', '播放中', '正在播放', 'playing', 'Playing'].includes(state)) {
      return '正在播放';
    }
    if (['暂停', 'paused', 'Paused'].includes(state)) {
      return '暂停';
    }
    if (['idle', '空闲','unknown'].includes(state)) {
      return '空闲';
    }
    if (['off'].includes(state)) {
      return '关闭';
    }
    return state;
  }

render() {
    const progressPercentage = this.getProgressPercentage();
    
    // 获取主题和颜色
    const theme = this._evaluateTheme();
    const fgColor = theme === 'light' ? 'rgb(0, 0, 0)' : 'rgb(255, 255, 255)';
    const bgColor = theme === 'light' ? 'rgb(255, 255, 255)' : 'rgb(50, 50, 50)';
    
    // 获取显示状态：优先使用主实体，否则本地状态
    let displayState = null;
    if (this.xiaomiHomeEntity && this._hass) {
      displayState = this._hass.states[this.xiaomiHomeEntity];
    }
    if (!displayState) {
      displayState = this.xiaomiHomeState;
    }
  
  const attributes = displayState?.attributes || {};
  
  // 获取图片URL：使用智能选择的实体图片
  const entityPicture = displayState?.attributes?.entity_picture || '';

    return html`
      <style>
        :host {
          --fg-color: ${entityPicture ? 'rgb(255, 255, 255)' : fgColor};
          --bg-color: ${bgColor};
          ${entityPicture ? '' : 'background: var(--bg-color);'};
          position: relative;
          width: ${this.width};
          overflow: visible;
        }

        .player-grid {
          padding: 10px 0;
          height: ${this.height};
          overflow: visible;
          grid-template-rows: 0.9fr 0.9fr 0.9fr 194px auto 0.9fr;
          grid-template-columns: 17% 8% 8% 8% 10% 8% 8% 8% 8% 8% 8%;
          grid-template-areas: 
            ${this.tvConnectionMode === 'integration' ? `"icon name name name name name home back menu setting power"` : `"icon name name name name home back menu setting power_on power_off"`}
            "icon info info info info info info info info . history"
            "icon volume volume-mute volume-down volume-slider volume-slider volume-up prev play pause next"
            ". fangxiang fangxiang fangxiang fangxiang fangxiang fangxiang fangxiang fangxiang xinhaoyuan xinhaoyuan"
            ${(this._getVisibleAppOptions().length > 0 || this._getAppButtons().length > 0) ? `"appbtn appbtn appbtn appbtn appbtn appbtn appbtn appbtn appbtn appbtn appbtn"` : `". . . . . . . . . . ."`}
            "progress progress progress progress progress progress progress progress progress progress progress"
        }

        .directional-area, .app-buttons-area, .xinhaoyuan-area {
          --theme-bg: ${theme === 'light' ? 'rgba(230, 230, 230, 0.7)' : 'rgba(80, 80, 80, 0.7)'};
          --theme-fg: ${theme === 'light' ? 'rgb(80, 80, 80)' : 'rgb(230, 230, 230)'};
          --button-fg: ${theme === 'light' ? 'rgb(0, 0, 0)' : 'rgb(250, 250, 250)'};
          --popup-fg: ${theme === 'light' ? 'rgb(0, 0, 0)' : 'rgb(255, 255, 255)'};
          --theme-bg-active: ${theme === 'light' ? 'rgba(120, 120, 120, 0.7)' : 'rgba(180, 180, 180, 0.7)'};
        }

        .progress-area {
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 0;
          height: 5px;
          width: 100%;
        }
      
      .background-layer {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        z-index: -1;
        border-radius: 12px;
        overflow: hidden;
      }

      .background-layer::before {
        content: '';
        position: absolute;
        top: -10%;
        left: -10%;
        width: 120%;
        height: 120%;
        background-image: url('${entityPicture}');
        background-size: cover;
        background-position: center;
        background-repeat: no-repeat;
        filter: blur(8px) brightness(0.7) grayscale(30%);
        z-index: -1;
      }
      </style>
      ${entityPicture ? html`<div class="background-layer"></div>` : ''}
      <div class="player-grid">
        <!-- 图标区域 -->
        <div class="icon-area">
          ${entityPicture ? html`
            <div 
              class="player-icon ${this.isPlaying ? 'playing' : ''}"
              style="background-image: url('${entityPicture}')"
              title="${displayState?.attributes?.friendly_name || '音乐播放器'}"
            ></div>
          ` : html`
            <ha-icon 
              class="music-icon ${this.isPlaying ? 'playing' : ''}"
              icon="mdi:music-note"
            ></ha-icon>
          `}
        </div>

        <!-- 名称区域 -->
        <div class="name-area">
          <div class="name-label">
            ${attributes.friendly_name || '音乐播放器'} - ${this.getStateText()}
          </div>
        </div>

        <!-- 信息区域 -->
        <div class="info-area">
          <div class="info-label">
          ${attributes.media_title || '未播放'}  ${attributes.media_artist || ''}
        </div>
        </div>

        <!-- 音量显示 -->
        <div class="volume-area">
          <div class="volume-label">${Math.round(this.volumeState)}%</div>
        </div>

        <!-- 音量滑动条 -->
        <div class="volume-slider-container">
          <input 
            type="range" 
            class="volume-slider" 
            min="0" 
            max="100" 
            .value=${this.volumeState}
            @input=${this.handleVolumeChange}
            @mousedown=${this.handleVolumeStart}
            @mouseup=${this.handleVolumeEnd}
            @touchstart=${this.handleVolumeStart}
            @touchend=${this.handleVolumeEnd}
            style="--volume-percentage: ${this.volumeState}%"
          >
        </div>

        <button class="control-button history-btn" @click=${this._toggleHistory}>
          <ha-icon icon="mdi:history"></ha-icon>
        </button>

        <!-- 控制按钮 -->
        ${this.tvConnectionMode === 'integration' ? html`
        <button class="control-button power-button" @click=${this.handlePower}>
          <ha-icon icon="mdi:power"></ha-icon>
        </button>
        ` : html`
        <button class="control-button power-on-button" @click=${this.handlePowerOn}>
          <ha-icon icon="mdi:power"></ha-icon>
        </button>

        <button class="control-button power-off-button" @click=${this.handlePowerOff}>
          <ha-icon icon="mdi:close-circle-outline"></ha-icon>
        </button>
        `}

        <button class="control-button home-button" @click=${this.handleHome}>
          <ha-icon icon="mdi:home"></ha-icon>
        </button>

        <button class="control-button back-button" @click=${this.handleBack}>
          <ha-icon icon="mdi:arrow-u-left-top"></ha-icon>
        </button>

        <button class="control-button menu-button" @click=${this.handleMenu}>
          <ha-icon icon="mdi:menu"></ha-icon>
        </button>

        <button class="control-button setting-button" @click=${this.handleSetting}>
          <ha-icon icon="mdi:cog"></ha-icon>
        </button>

        <button class="control-button volume-mute" @click=${this.handleVolumeMute}>
          <ha-icon icon=${this.volumeState === 0 ? 'mdi:volume-off' : 'mdi:volume-mute'}></ha-icon>
        </button>

        <button class="control-button volume-down" @click=${this.handleVolumeDown}>
          <ha-icon icon="mdi:volume-minus"></ha-icon>
        </button>

        <button class="control-button volume-up" @click=${this.handleVolumeUp}>
          <ha-icon icon="mdi:volume-plus"></ha-icon>
        </button>

        <button class="control-button prev-button" @click=${this.handlePrevious}>
          <ha-icon icon="mdi:skip-previous"></ha-icon>
        </button>

        <button class="control-button play-button" @click=${this.handlePlayPause}>
          <ha-icon icon="mdi:play"></ha-icon>
        </button>

        <button class="control-button pause-button" @click=${this.handlePause}>
          <ha-icon icon="mdi:pause"></ha-icon>
        </button>

        <button class="control-button next-button" @click=${this.handleNext}>
          <ha-icon icon="mdi:skip-next"></ha-icon>
        </button>

        <!-- 遥控方向按键区域 -->
        <div class="directional-area">
          <div class="directional-pad">
            <!-- 上键 -->
            <button class="directional-button up" @click=${this.handleDirectionUp}>
              <ha-icon icon="mdi:chevron-up"></ha-icon>
            </button>
            
            <!-- 下键 -->
            <button class="directional-button down" @click=${this.handleDirectionDown}>
              <ha-icon icon="mdi:chevron-down"></ha-icon>
            </button>
            
            <!-- 左键 -->
            <button class="directional-button left" @click=${this.handleDirectionLeft}>
              <ha-icon icon="mdi:chevron-left"></ha-icon>
            </button>
            
            <!-- 右键 -->
            <button class="directional-button right" @click=${this.handleDirectionRight}>
              <ha-icon icon="mdi:chevron-right"></ha-icon>
            </button>
            
            <!-- 确认键 -->
            <button class="directional-button center" @click=${this.handleDirectionCenter}>
              OK
            </button>
          </div>
        </div>

        <!-- 信号源区域 -->
        <div class="xinhaoyuan-area">
          <button class="xinhaoyuan-button" @click=${this.handleXinhaoyuan}>
            <span>信号源</span>
            <span class="arrow ${this._showSourcePopup ? 'open' : ''}">▼</span>
            ${this._showSourcePopup && this._getSourceList().length > 0 ? html`
              <div class="xinhaoyuan-popup" @click=${(e) => e.stopPropagation()}>
                ${this._getSourceList().map(source => {
                  const currentSource = this._getCurrentSource();
                  return html`
                    <div 
                      class="xinhaoyuan-popup-item ${source === currentSource ? 'active' : ''}"
                      @click=${() => this.handleSourceSelect(source)}
                    >
                      ${source}
                    </div>
                  `;
                })}
              </div>
            ` : ''}
          </button>
        </div>

        <!-- App快捷按钮区域 -->
        ${(this._getVisibleAppOptions().length > 0 || this._getAppButtons().length > 0) ? html`
          <div class="app-buttons-area">
            ${this._getVisibleAppOptions().map(option => {
              const currentState = this.appCurrentEntity && this._hass?.states[this.appCurrentEntity]?.state;
              const isActive = currentState === option;
              return html`
                <button 
                  class="app-button ${isActive ? 'active' : ''}"
                  @click=${() => this.handleAppClick(option)}
                  title="${option}"
                >
                  ${this._getAppDisplayName(option)}
                </button>
              `;
            })}
            ${this._getAppButtons().map(app => html`
              <button 
                class="app-button"
                @click=${() => this.handleAppButtonClick(app)}
                title="${app.command}"
              >
                ${app.name}
              </button>
            `)}
          </div>
          ` : ''}

        <!-- 进度条区域 -->
        <div class="progress-area">
          <div 
            class="progress-bar"
            style="--progress-percentage: ${progressPercentage}%"
          ></div>
        </div>
      </div>
    `;
  }
}
customElements.define('xiaoshi-tv-player', TvPlayer);
