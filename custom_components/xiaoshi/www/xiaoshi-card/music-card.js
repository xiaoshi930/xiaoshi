const whenDefined = (t) => customElements.whenDefined(t);
await Promise.race([whenDefined("ha-card"), whenDefined("ha-panel-lovelace")]);
const LitElement = window.LitElement || Object.getPrototypeOf(customElements.get("ha-card"));
const html = LitElement.prototype.html;
const css = LitElement.prototype.css;
 
window.customCards = window.customCards || [];
window.customCards.push({
  type: "xiaoshi-music-card",
  name: "消逝音乐播放器",
  description: "音乐播放器",
  preview: true
});

class XiaoshiMusicCardEditor extends LitElement {
  static get properties() {
    return {
      hass: { type: Object },
      config: { type: Object }
    };
  }

  static get styles() {
    return css`
      .form { display: flex; flex-direction: column; gap: 10px; }
      .form-group { display: flex; flex-direction: column; gap: 5px; }
      label { font-weight: bold; color: #1976d2; }
      select, input { padding: 8px; border: 1px solid #ddd; border-radius: 4px; }
      .entity-search-wrap { position: relative; }
      .entity-search-wrap:focus-within .entity-dropdown { display: block; }
      .entity-dropdown { display: none; position: absolute; top: 100%; left: 0; right: 0; max-height: 200px; overflow-y: auto; background: var(--card-background-color,var(--primary-background-color,#fff)); border: 1px solid var(--divider-color,#ddd); border-radius: 0 0 4px 4px; z-index: 999; box-shadow: 0 4px 12px var(--shadow-color,rgba(0,0,0,0.15)); }
      .entity-dropdown-item { padding: 5px 10px; cursor: pointer; font-size: 12px; color: var(--primary-text-color,#212121); border-bottom: 1px solid var(--divider-color,#eee); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
      .entity-dropdown-item:hover { background: var(--secondary-background-color,rgba(0,0,0,0.06)); }
      .entity-dropdown-item.active { background: var(--primary-color,rgba(3,169,244,0.2)); color: var(--primary-color,#03a9f4); font-weight: 600; }
      .editor-section-header { font-size: 12px; font-weight: 700; padding: 6px 10px; margin: 12px 0 4px; border-radius: 4px; border-left: 3px solid transparent; }
      .editor-section-header.display { color: #2980b9; background: #ebf5fb; border-left-color: #2980b9; }
      .editor-section-header.device { color: #c0392b; background: #fdedec; border-left-color: #c0392b; }
      .editor-section-header.local { color: #27ae60; background: #eafaf1; border-left-color: #27ae60; }
      .editor-section-header.ma { color: #e67e22; background: #fef5e7; border-left-color: #e67e22; }
      .editor-row { display: flex; flex-direction: row; align-items: center; gap: 8px; }
      .editor-row-multi { display: flex; flex-direction: row; gap: 6px; }
      .editor-row-multi > * { flex: 1; min-width: 0; display: flex; flex-direction: row; align-items: center; gap: 4px; }
      .editor-row-multi label { white-space: nowrap; margin: 0; }
      .editor-row-multi input { flex: 1; min-width: 0; box-sizing: border-box; }
      .editor-device-card { border: 1px solid #ddd; border-radius: 6px; padding: 8px; margin-bottom: 8px; position: relative; }
      .editor-device-header { display: flex; align-items: center; gap: 6px; margin-bottom: 6px; }
      .editor-device-header label { font-weight: 700; font-size: 12px; margin: 0; }
      .editor-device-header input { flex: 1; }
      .editor-delete-btn { background: #e74c3c; color: #fff; border: none; border-radius: 4px; padding: 2px 8px; cursor: pointer; font-size: 11px; }
      .editor-add-device-btn { background: #c0392b; color: #fff; border: none; border-radius: 4px; padding: 6px 12px; cursor: pointer; font-size: 12px; margin-bottom: 8px; }
      .editor-section-hint { color: #888; margin-top: 2px; font-size: 12px; }
      .editor-textarea { padding: 8px; border: 1px solid #ddd; border-radius: 4px; resize: vertical; }
    `;
  }

  render() {
    if (!this.hass || !this.config) return html``;
    this._loadMediaSources();
    return html`
      <div class="form">
        ${this._renderDisplayConfig()}
        ${this._renderDeviceConfig()}
        <button class="editor-add-device-btn" @click=${this._handleAddDevice}>＋ 添加设备组</button>
        ${this._renderLocalMusicConfig()}
        ${this._renderMAConfig()}
        ${this._renderQuickInputConfig()}
      </div>
    `;
  }

  _loadMediaSources() {
    if (this._localMusicSources || !this.hass.callWS) return;
    this._localMusicSources = [];
    this.hass.callWS({ type: 'media_source/browse_media' }).then(r => {
      const root = r?.children || [];
      Promise.all(root.map(s => this.hass.callWS({ type: 'media_source/browse_media', media_content_id: s.media_content_id }).then(sub => { s.subs = sub?.children || []; }).catch(() => { s.subs = []; }))).then(() => {
        this._localMusicSources = root;
        this.requestUpdate();
      });
    }).catch(() => { this._localMusicSources = []; });
  }

  _renderDisplayConfig() {
    return html`
      <div class="editor-section-header display">🎨 卡片展示配置</div>
      <div class="editor-row">
        <label style="white-space:nowrap;margin:0;">主题</label>
        <select @change=${this._entityChanged} .value=${this.config.theme !== undefined ? this.config.theme : 'system'} name="theme" style="flex:1;">
          <option value="system">跟随系统</option>
          <option value="light">浅色主题</option>
          <option value="dark">深色主题</option>
          <option value="sun">跟随日出日落</option>
          <option value="function">跟随函数</option>
        </select>
      </div>
      <div class="editor-row-multi">
        <div><label>卡片宽度</label><input type="text" @change=${this._entityChanged} .value=${this.config.width !== undefined ? this.config.width : '100%'} name="width" placeholder="100%" /></div>
        <div><label>卡片高度</label><input type="text" @change=${this._entityChanged} .value=${this.config.height !== undefined ? this.config.height : 'auto'} name="height" placeholder="auto" /></div>
        <div><label>歌词高度</label><input type="text" @change=${this._entityChanged} .value=${this.config.lyrics_height !== undefined ? this.config.lyrics_height : '200px'} name="lyrics_height" placeholder="200px" /></div>
      </div>
    `;
  }

  _renderDeviceConfig() {
    const devices = this.config.devices || [];
    return html`
      <div class="editor-section-header device">📡 设备组配置</div>
      ${devices.map((d, di) => this._renderSingleDevice(devices, d, di))}
    `;
  }

  _renderSingleDevice(devices, d, di) {
    const entityOptions = (key) => Object.keys(this.hass.states)
      .filter(e => e.startsWith('media_player.'))
      .map(e => {
        const isSelected = (d[key] || '') === e;
        const platform = this.hass.entities?.[e]?.platform || '';
        const fname = this.hass.states[e].attributes.friendly_name || e;
        const label = platform ? `${fname} [ ${platform}集成 ]` : fname;
        return html`<option value="${e}" .selected=${isSelected}>${label}</option>`;
      });
    const saveDevice = (selfId, val) => {
      const nd = [...devices];
      nd[di] = { ...devices[di], [selfId]: val };
      this._entityChanged({ target: { name: 'devices', value: JSON.stringify(nd) } });
    };
    return html`
      <div class="editor-device-card">
        <div class="editor-device-header">
          <label>设备名称</label>
          <input @change=${(e) => { devices[di] = { ...devices[di], name: e.target.value }; this._entityChanged({ target: { name: 'devices', value: JSON.stringify(devices) } }); }} .value=${d.name || ''} placeholder="例如: 卧室音箱" />
          ${di > 0 ? html`<button class="editor-delete-btn" @click=${() => { const nd = devices.filter((_, i) => i !== di); this._entityChanged({ target: { name: 'devices', value: JSON.stringify(nd) } }); }}>✕ 删除</button>` : ''}
        </div>
        <div class="form-group"><label>小米Miot实体 (xiaomi_miot)</label><select @change=${(e) => saveDevice('xiaomi_miot', e.target.value)} .value=${d.xiaomi_miot || ''}><option value="">选择小米Miot实体（可选）</option>${entityOptions('xiaomi_miot')}</select></div>
        <div class="form-group"><label>[MA集成] 播放器实体 (ma_player_entity)</label><select @change=${(e) => saveDevice('ma_player_entity', e.target.value)} .value=${d.ma_player_entity || ''}><option value="">选择 MA 播放器实体</option>${entityOptions('ma_player_entity')}</select></div>
        ${this._renderDeviceSearchPickers(devices, d, di, saveDevice)}
      </div>
    `;
  }

  _renderDeviceSearchPickers(devices, d, di) {
    const searchPicker = (label, selfId, prefix) => {
      const selectedId = d[selfId] || '';
      const selPlatform = selectedId ? (this.hass.entities?.[selectedId]?.platform || '') : '';
      const displayVal = selPlatform ? `${selectedId} [集成${selPlatform}]` : selectedId;
      const ents = Object.keys(this.hass.states)
        .filter(e => !prefix || e.startsWith(prefix))
        .map(e => ({ id: e, fname: this.hass.states[e].attributes.friendly_name || e, platform: this.hass.entities?.[e]?.platform || '' }));
      const saveSel = (eid) => {
        const nd = [...devices];
        nd[di] = { ...devices[di], [selfId]: eid };
        this._entityChanged({ target: { name: 'devices', value: JSON.stringify(nd) } });
      };
      return html`
        <label>${label}</label>
        <div class="entity-search-wrap">
          <input type="text" .value="${displayVal}" placeholder="搜索或选择实体..." style="width:100%;box-sizing:border-box;"
            @focus=${(e) => { e.target.select(); }}
            @input=${(e) => {
              const kw = e.target.value.toLowerCase();
              const wrap = e.target.closest('.entity-search-wrap');
              if (!wrap) return;
              wrap.querySelectorAll('.entity-dropdown-item:not(.entity-clear)').forEach(el => {
                el.style.display = (!kw || el.textContent.toLowerCase().includes(kw)) ? '' : 'none';
              });
            }} />
          <div class="entity-dropdown">
            <div class="entity-dropdown-item entity-clear" style="color:#999;"
              @mousedown=${(e) => { e.preventDefault(); saveSel(''); e.target.closest('.entity-search-wrap')?.querySelector('input')?.blur(); }}>-- 清空 --</div>
            ${ents.map(ent => {
              const lbl = ent.platform ? `${ent.fname} (${ent.id}) [${ent.platform}集成]` : `${ent.fname} (${ent.id})`;
              return html`<div class="entity-dropdown-item ${ent.id === selectedId ? 'active' : ''}"
                @mousedown=${(e) => { e.preventDefault(); saveSel(ent.id); e.target.closest('.entity-search-wrap')?.querySelector('input')?.blur(); }}
                title="${ent.id}">${lbl}</div>`;
            })}
          </div>
        </div>
      `;
    };
    return html`
      <div class="form-group">${searchPicker('[MA集成] 收藏歌曲按钮实体 (搜索：favorite_current_song)', 'favorite_current_song', 'button.')}</div>
      <div class="form-group">${searchPicker('[Miot集成] 停止闹钟按钮实体 (搜索：stop_alarm)', 'stop_alarm', 'button.')}</div>
      <div class="form-group">${searchPicker('[Miot集成] 播报文本实体 (搜索：play_text)', 'play_text', 'text.')}</div>
      <div class="form-group">${searchPicker('[Miot集成] 执行文本实体 (搜索：execute_text_directive)', 'execute_text_directive', 'text.')}</div>
      <div class="form-group">${searchPicker('[Miot集成] 播放控制实体 (搜索：conversation)', 'conversation', '')}</div>
      <div class="form-group">${searchPicker('[Home集成] 小米电台按钮实体 (搜索：play_radio)', 'play_radio', 'button.')}</div>
    `;
  }

  _handleAddDevice() {
    const d = [...(this.config.devices || []), { name: '', xiaomi_miot: '', ma_player_entity: '', favorite_current_song: '', stop_alarm: '', play_radio: '', conversation: '', play_text: '', execute_text_directive: '' }];
    this._entityChanged({ target: { name: 'devices', value: JSON.stringify(d) } });
  }

  _renderLocalMusicConfig() {
    return html`
      <div class="editor-section-header local">🎵 本地音乐配置</div>
      <div class="form-group">
        <label>本地播放路径 (每行一个路径，支持多个路径)<br></label>
        <textarea @change=${this._entityChanged} .value=${this.config.local_music_path || ''} name="local_music_path" placeholder="例如:&#10;media-source://media_source/local/&#10;media-source://media_source/local/music2/" rows="3" class="editor-textarea"></textarea>
        <small class="editor-section-hint">快捷添加（含子目录，会追加到已有路径）:</small>
        <select @change=${(e) => { const val = e.target.value; if (!val) return; const old = this.config.local_music_path || ''; const newVal = old ? (old + '\n' + val) : val; this._entityChanged({ target: { name: 'local_music_path', value: newVal } }); e.target.value = ''; }}>
          <option value="">-- 快捷路径 --</option>
          ${this._localMusicSources?.flatMap(s => [
            html`<option value="${s.media_content_id}">📁 ${s.title || s.media_content_id}</option>`,
            ...(s.subs || []).filter(c => c.can_expand).map(c => html`<option value="${c.media_content_id}"> &nbsp;&nbsp;📁 ${c.title}</option>`)
          ])}
        </select>
      </div>
    `;
  }

  _renderMAConfig() {
    return html`
      <div class="editor-section-header ma">🎵 Music Assistant 配置</div>
      <div class="form-group"><label>[MA] MA 服务器地址 (ma_server_url)</label><input @change=${this._entityChanged} .value=${this.config.ma_server_url || ''} name="ma_server_url" placeholder="http://192.168.2.54:8095"></div>
      <div class="form-group"><label>[MA] MA API Token (ma_server_token)</label><input @change=${this._entityChanged} .value=${this.config.ma_server_token || ''} name="ma_server_token" placeholder="eyJhbG...长token"></div>
      <div class="form-group"><label>[MA] MA 播放器实体 (ma_player_entity)</label><select @change=${this._entityChanged} .value=${this.config.ma_player_entity || ''} name="ma_player_entity"><option value="">选择 MA 播放器实体</option>${Object.keys(this.hass.states).filter(e => e.startsWith('media_player.')).map(e => html`<option value="${e}" .selected=${e === this.config.ma_player_entity}>${this.hass.states[e].attributes.friendly_name || e}</option>`)}</select></div>
      <div class="form-group"><label>[MA] 手动歌单配置 (ma_playlists) — 每行一歌单: 名称|MA_URI</label><textarea @change=${this._entityChanged} .value=${this.config.ma_playlists || ''} name="ma_playlists" rows="4" placeholder="我的歌单|library://playlist/9&#10;BGM|library://playlist/12" class="editor-textarea"></textarea></div>
      <div class="form-group"><label>[MA] 我喜欢歌单 (选择歌单Infinite Mix (favorites)的url)</label><input @change=${this._entityChanged} .value=${this.config.ma_favorite_playlist || ''} name="ma_favorite_playlist" placeholder="library://playlist/8"></div>
      <div class="form-group"><label>[MA] 播放列表 (新建一个HA的歌单url)</label><input @change=${this._entityChanged} .value=${this.config.ma_playlist || ''} name="ma_playlist" placeholder="library://playlist/"></div>
    `;
  }

  _renderQuickInputConfig() {
    return html`
      <div class="form-group">
        <label>[通用] 快捷输入列表 (quick_input) — 每行一个</label>
        <textarea @change=${this._entityChanged} .value=${Array.isArray(this.config.quick_input) ? this.config.quick_input.join('\n') : (this.config.quick_input || '')} name="quick_input" rows="3" placeholder="打开空调&#10;关闭窗帘&#10;播放音乐" class="editor-textarea"></textarea>
      </div>
    `;
  }

  _entityChanged(e) {
    const { name, value } = e.target;
    if (!value && name !== 'theme' && name !== 'width' && name !== 'height' && name !== 'lyrics_height' && name !== 'local_music_path' && name !== 'ma_server_url' && name !== 'ma_server_token' && name !== 'ma_player_entity' && name !== 'ma_playlists' && name !== 'ma_favorite_playlist' && name !== 'ma_playlist' && name !== 'devices') return;
    let finalValue = value;
    if (name === 'width') { finalValue = value || '100%'; }
    else if (name === 'height') { finalValue = value || 'auto'; }
    else if (name === 'lyrics_height') { finalValue = value || '200px'; }
    else if (name === 'devices') { try { finalValue = JSON.parse(value); } catch (e) { finalValue = []; } }
    this.config = { ...this.config, [name]: finalValue };
    this.dispatchEvent(new CustomEvent('config-changed', { detail: { config: this.config }, bubbles: true, composed: true }));
  }

  setConfig(config) {
    this.config = config;
  }
}
customElements.define('xiaoshi-music-card-editor', XiaoshiMusicCardEditor);

class XiaoshiMusicCard extends LitElement {
  static get properties() {
    return {
      _hass: { type: Object },
      _config: { type: Object },
      xiaomiMiotEntity: { type: String },
      xiaomiMiotState: { type: Object },
      volumeState: { type: Number },
      isPlaying: { type: Boolean },
      width: { type: String },
      height: { type: String },
      lyricsHeight: { type: String },
      showLyrics: { type: Boolean },
      lyrics: { type: Array },
      currentLyricIndex: { type: Number },
      lyricProgress: { type: Number },
      favoriteSongEntity: { type: String },
      stopAlarmEntity: { type: String },
      sidebarRadioEntity: { type: String },
      textDirectiveEntity: { type: String },
      _mediaPlayerState: { type: Object },
      _miotOverlay: { type: Object },
      _localOverlay: { type: Object },
      _maOverlay: { type: Object },
      _activeChannel: { type: String },
    };
  }

  static get styles() {
    return css`
      :host { display: block; width: 100%; border-radius: 16px; padding: 0px; margin-top: 0; cursor: none; --mdc-ripple-press-opacity: 0; }
      .card { position: relative; border-radius: 16px; overflow: hidden; box-sizing: border-box; background-size: cover; background-position: center; min-height: 320px; display: flex; flex-direction: column; }
      .card-bg-overlay { position: absolute; top: 0; left: 0; width: 100%; height: 100%; z-index: 0; transition: background 0.3s ease; }
      .card-bg-overlay.off-overlay { background: var(--xiaoshi-overlay-off, rgba(15, 12, 8, 0.60)); }
      .card-bg-overlay.on-overlay { background: var(--xiaoshi-overlay-on, rgba(15, 12, 8, 0.35)); }
      .album-bg-layer { position: absolute; top: -10%; left: -10%; width: 120%; height: 120%; z-index: 0; background-size: cover; background-position: center; background-repeat: no-repeat; opacity: 0.5; pointer-events: none; }
      .player-content { position: relative; z-index: 2; display: flex; flex-direction: row; align-items: flex-start; padding: 10px; gap: 8px; flex: 1; min-height: 0; }
      .left-sidebar { display: flex; flex-direction: column; align-items: center; gap: 8px; width: 65px; flex-shrink: 0; padding: 2px 0 0 0; }
      .device-info-block { background: var(--xiaoshi-btn-bg, rgba(255, 255, 255, 0.10)); border-radius: 12px; padding: 8px 4px; display: flex; flex-direction: column; align-items: center; gap: 4px; width: 60px; box-sizing: border-box; }
      .device-status-text { font-size: 9px; font-weight: 600; color: var(--xiaoshi-muted, rgba(255, 255, 255, 0.75)); text-align: center; text-shadow: var(--xiaoshi-text-shadow, 0 1px 4px rgba(0, 0, 0, 0.5)); white-space: nowrap; }
      .sidebar-device-avatar { width: 40px; height: 40px; border-radius: 50%; background-size: cover; background-position: center; background-color: rgba(60, 50, 40, 0.6); display: flex; align-items: center; justify-content: center; overflow: hidden; }
      .sidebar-device-name { font-size: 8px; color: var(--xiaoshi-muted, rgba(255, 255, 255, 0.5)); text-align: center; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 60px; text-shadow: var(--xiaoshi-text-shadow, 0 1px 3px rgba(0, 0, 0, 0.5)); }
      .device-list { display: flex; flex-direction: column; gap: 4px; width: 60px; }
      .device-list-item { background: var(--xiaoshi-btn-bg, rgba(255, 255, 255, 0.15)); border: 2px solid transparent; border-radius: 10px; padding: 7px 4px; cursor: pointer; display: flex; flex-direction: column; align-items: center; gap: 3px; transition: all 0.2s; }
      .device-list-item:hover { background: var(--xiaoshi-btn-hover, rgba(255, 255, 255, 0.22)); }
      .device-list-item.active { border-color: var(--xiaoshi-accent, rgba(25,165,225,0.8)); background: var(--xiaoshi-btn-active, rgba(25,165,225,0.25)); }
      .device-list-item .dev-name { font-size: 10px; font-weight: 600; color: var(--xiaoshi-text, rgba(255, 255, 255, 0.9)); text-align: center; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 54px; }
      .device-list-item .dev-status { font-size: 8px; color: var(--xiaoshi-muted, rgba(255, 255, 255, 0.6)); text-align: center; }
      .sidebar-btn { background: var(--xiaoshi-btn-bg, rgba(255, 255, 255, 0.15)); border: none; border-radius: 12px; color: var(--xiaoshi-text, #fff); cursor: pointer; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 3px; width: 56px; height: 56px; transition: background 0.2s; --mdc-ripple-press-opacity: 0; --mdc-icon-size: 20px; text-shadow: var(--xiaoshi-text-shadow, 0 1px 4px rgba(0, 0, 0, 0.6)); }
      .sidebar-btn:active { background: var(--xiaoshi-btn-active, rgba(255, 255, 255, 0.25)); }
      .sidebar-btn-label { font-size: 9px; color: var(--xiaoshi-text, #fff); text-shadow: var(--xiaoshi-text-shadow, 0 1px 4px rgba(0, 0, 0, 0.7)); letter-spacing: 0.3px; font-weight: 500; }
      .player-main { display: flex; flex-direction: column; gap: 6px; flex: 1; min-width: 0; min-height: 0; padding-top: 0; }
      .top-bar { display: flex; align-items: center; justify-content: space-between; gap: 8px; }
      .top-bar-left { display: flex; align-items: center; gap: 8px; flex: 1; min-width: 0; }
      .device-name { font-size: 14px; font-weight: 600; color: var(--xiaoshi-text, #fff); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; text-shadow: var(--xiaoshi-text-shadow, 0 2px 8px rgba(0, 0, 0, 0.8)); }
      .state-text { font-size: 12px; color: var(--xiaoshi-muted, rgba(255, 255, 255, 0.6)); text-shadow: var(--xiaoshi-text-shadow, 0 1px 6px rgba(0, 0, 0, 0.7)); }
      .power-btn { background: var(--xiaoshi-btn-bg, rgba(255, 255, 255, 0.15)); border: none; border-radius: 8px; color: var(--xiaoshi-text, #fff); cursor: pointer; display: flex; align-items: center; justify-content: center; width: 32px; height: 32px; transition: background 0.2s; --mdc-ripple-press-opacity: 0; text-shadow: var(--xiaoshi-text-shadow, 0 1px 4px rgba(0, 0, 0, 0.5)); }
      .power-btn:active { background: var(--xiaoshi-btn-active, rgba(255, 255, 255, 0.3)); }
      .main-area { display: flex; align-items: flex-start; gap: 14px; flex: 0 0 auto; min-height: 0; }
      .album-art { width: 100px; height: 100px; border-radius: 20px; background-size: cover; background-position: center; background-color: rgba(60, 50, 40, 0.6); flex-shrink: 0; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 20px rgba(0, 0, 0, 0.35); }
      .album-art-placeholder { color: var(--xiaoshi-muted, rgba(255, 255, 255, 0.5)); text-shadow: var(--xiaoshi-text-shadow, 0 1px 4px rgba(0, 0, 0, 0.5)); }
      .song-info-area { display: flex; flex-direction: column; gap: 6px; flex: 1; min-width: 0; }
      .song-title { font-size: 18px; font-weight: 700; color: var(--xiaoshi-text, #fff); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; text-shadow: var(--xiaoshi-text-shadow, 0 2px 8px rgba(0, 0, 0, 0.8)); }
      .song-artist { font-size: 13px; font-weight: 400; color: var(--xiaoshi-muted, rgba(255, 255, 255, 0.75)); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; text-shadow: var(--xiaoshi-text-shadow, 0 1px 6px rgba(0, 0, 0, 0.7)); }
      .song-source { font-size: 11px; color: var(--xiaoshi-muted, rgba(255, 255, 255, 0.45)); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; text-shadow: var(--xiaoshi-text-shadow, 0 1px 4px rgba(0, 0, 0, 0.5)); }
      .action-buttons-row { display: flex; gap: 4px; margin-top: 8px; flex-wrap: nowrap; }
      .action-btn { background: var(--xiaoshi-btn-bg, rgba(255, 255, 255, 0.12)); border: none; border-radius: 8px; color: var(--xiaoshi-text, #fff); cursor: pointer; display: flex; align-items: center; justify-content: center; padding: 5px 6px; font-size: 12px; transition: all 0.2s; --mdc-icon-size: 14px; --mdc-ripple-press-opacity: 0; }
      .action-btn:hover { background: var(--xiaoshi-btn-hover, rgba(255, 255, 255, 0.22)); }
      .action-btn:active { background: var(--xiaoshi-btn-active, rgba(255, 255, 255, 0.3)); }
      .action-btn ha-icon { display: flex; align-items: center; justify-content: center; }
      .action-btn-label { font-size: 12px; font-weight: 500; white-space: nowrap; }
      .progress-area { display: flex; align-items: center; gap: 8px; flex-shrink: 0; }
      .progress-time { font-size: 11px; color: var(--xiaoshi-muted, rgba(255, 255, 255, 0.7)); min-width: 36px; text-align: center; text-shadow: var(--xiaoshi-text-shadow, 0 1px 4px rgba(0, 0, 0, 0.5)); }
      .progress-track { flex: 1; height: 4px; background: var(--xiaoshi-btn-bg, rgba(255, 255, 255, 0.15)); border-radius: 2px; position: relative; overflow: hidden; }
      .progress-fill { position: absolute; top: 0; left: 0; height: 100%; border-radius: 2px; background: linear-gradient(to right, rgb(25, 165, 225), rgb(120, 210, 255)); transition: width 0.1s linear; }
      .controls-area { position: relative; display: flex; align-items: center; justify-content: center; gap: 10px; flex-shrink: 0; }
      .mode-status-text { position: absolute; right: 8px; top: 50%; transform: translateY(-50%); padding-left: 12px; font-size: 12px; color: var(--xiaoshi-muted, rgba(255, 255, 255, 0.6)); white-space: nowrap; flex-shrink: 0; user-select: none;}
      .control-btn { background: var(--xiaoshi-btn-bg, rgba(255, 255, 255, 0.15)); border: none; border-radius: 8px; color: var(--xiaoshi-text, #fff); cursor: pointer; display: flex; align-items: center; justify-content: center; width: 32px; height: 32px; transition: background 0.2s; --mdc-ripple-press-opacity: 0; --mdc-icon-size: 20px; text-shadow: var(--xiaoshi-text-shadow, 0 1px 4px rgba(0, 0, 0, 0.5)); flex-shrink: 0; }
      .control-btn:active { background: var(--xiaoshi-btn-active, rgba(255, 255, 255, 0.3)); }
      .control-btn.active-ctrl { border: 1px solid rgba(25,165,225,0.4); }
      .play-pause-btn { background: rgba(25, 165, 225, 0.55); border: none; border-radius: 50%; color: #fff; cursor: pointer; display: flex; align-items: center; justify-content: center; width: 52px; height: 52px; transition: background 0.2s; --mdc-ripple-press-opacity: 0; --mdc-icon-size: 28px; text-shadow: var(--xiaoshi-text-shadow, 0 1px 4px rgba(0, 0, 0, 0.3)); }
      .play-pause-btn:active { background: rgba(25, 165, 225, 0.75); }
      .volume-area { display: flex; align-items: center; gap: 8px; flex-shrink: 0; }
      .volume-icon-btn { background: none; border: none; color: var(--xiaoshi-text, rgba(255, 255, 255, 0.8)); cursor: pointer; display: flex; align-items: center; justify-content: center; --mdc-icon-size: 20px; text-shadow: var(--xiaoshi-text-shadow, 0 1px 4px rgba(0, 0, 0, 0.5)); }
      .volume-value { font-size: 12px; color: var(--xiaoshi-muted, rgba(255, 255, 255, 0.7)); min-width: 30px; text-align: center; text-shadow: var(--xiaoshi-text-shadow, 0 1px 4px rgba(0, 0, 0, 0.5)); }
      .volume-track { flex: 1; height: 4px; background: var(--xiaoshi-btn-bg, rgba(255, 255, 255, 0.15)); border-radius: 2px; position: relative; cursor: pointer; touch-action: none; }
      .volume-fill { position: absolute; top: 0; left: 0; height: 100%; border-radius: 2px; background: linear-gradient(to right, rgb(255, 160, 0), rgb(255, 205, 50)); }
      .volume-thumb { position: absolute; top: 50%; width: 14px; height: 14px; border-radius: 50%; background: rgb(255, 205, 50); border: 2px solid #fff; transform: translate(-50%, -50%); cursor: pointer; touch-action: none; box-shadow: 0 1px 4px rgba(0, 0, 0, 0.3); }
      .lyrics-area-inline { display: flex; align-items: stretch; justify-content: center; padding: 0; overflow: hidden; position: relative; width: 100%; flex: 1 1 auto; min-height: 0; }
      .lyrics-container { height: 100%; width: calc(100% - 10px); overflow-y: auto; overflow-x: hidden; scrollbar-width: none; -ms-overflow-style: none; position: relative; scroll-behavior: smooth; -webkit-overflow-scrolling: touch; mask-image: linear-gradient(to bottom, transparent 0%, black 15%, black 85%, transparent 100%); -webkit-mask-image: linear-gradient(to bottom, transparent 0%, black 15%, black 85%, transparent 100%); }
      .lyrics-container::-webkit-scrollbar { display: none; }
      .lyrics-controls { display: flex; flex-direction: column; justify-content: center; align-items: center; gap: 8px; padding: 10px 5px; position: absolute; right: 0; top: 50%; transform: translateY(-50%); flex-shrink: 0; width: 30px; }
      .lyrics-control-btn { background: rgba(200, 200, 200, 0.1); border: none; border-radius: 5px; width: 25px; height: 25px; display: flex; align-items: center; justify-content: center; cursor: pointer; color: white; font-size: 16px; font-weight: bold; transition: all 0.2s ease; --mdc-icon-size: 15px; }
      .lyrics-adjustment-toast { position: absolute; top: 50%; right: calc(70% + 5px); transform: translateY(-50%); background: rgba(0, 0, 0, 0.95); color: white; padding: 10px 18px; border-radius: 25px; font-size: 10px; font-weight: 600; z-index: 1000; pointer-events: none; opacity: 0; transition: opacity 0.4s ease, transform 0.3s ease; backdrop-filter: blur(10px); box-shadow: 0 4px 20px rgba(0, 0, 0, 0.4); white-space: nowrap; border: 1px solid rgba(255, 255, 255, 0.1); }
      .lyrics-adjustment-toast.show { opacity: 1; transform: translateY(-50%) translateX(-5px); }
      .lyrics-top-spacer { height: 16px; flex-shrink: 0; }
      .lyrics-spacer { height: 50px; flex-shrink: 0; }
      .lyric { text-align: center; transition: all 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94); line-height: 1.5; font-weight: 400; letter-spacing: -0.2px; transform: scale(0.95); color: rgba(255, 255, 255, 0.6); opacity: 0.6; cursor: pointer; }
      .lyric.active { opacity: 1; font-weight: 600; transform: scale(1.05); padding: 10px 26px; letter-spacing: -0.1px; color: rgb(25, 165, 225); transition: all 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94); }
      .lyric.active[style*="--progress"] { background: linear-gradient(90deg, rgb(25, 165, 225) 0%, rgb(25, 165, 225) var(--progress, 0%), rgba(255, 255, 255, 0.6) var(--progress, 0%), rgba(255, 255, 255, 0.6) 100%); background-clip: text; -webkit-background-clip: text; color: transparent; transition: background-position 0.1s linear, background-size 0.1s linear; -webkit-font-smoothing: antialiased; }
      .lyric.active:not([style*="--progress"]) { color: rgb(25, 165, 225); transition: color 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94); }
      .lyric:hover { opacity: 0.8; transform: scale(1.02); }
      .ma-search-overlay { position: absolute; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0, 0, 0, 0.5); backdrop-filter: blur(4px); -webkit-backdrop-filter: blur(4px); display: flex; align-items: center; justify-content: center; z-index: 100; border-radius: 16px; animation: ma-fade-in 0.2s ease; }
      @keyframes ma-fade-in { from { opacity: 0; } to { opacity: 1; } }
      .ma-search-panel { width: 88%; max-width: 420px; max-height: 80%; background: rgba(30, 28, 32, 0.95); border-radius: 12px; display: flex; flex-direction: column; overflow: hidden; box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4); color: #fff; }
      .ma-search-results { flex: 1; overflow-y: auto; padding: 6px; min-height: 120px; max-height: 360px; }
      .ma-search-results::-webkit-scrollbar { width: 6px; }
      .ma-search-results::-webkit-scrollbar-thumb { background: rgba(255, 255, 255, 0.2); border-radius: 3px; }
      .ma-search-empty, .ma-search-loading { padding: 32px 16px; text-align: center; color: rgba(255, 255, 255, 0.5); font-size: 13px; display: flex; align-items: center; justify-content: center; gap: 8px; }
      .pl-panel { width: 88%; max-width: 420px; max-height: 80%; background: rgba(30, 28, 32, 0.95); border-radius: 12px; display: flex; flex-direction: column; overflow: hidden; box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4); color: #fff; }
      .ma-search-header { display: flex; align-items: center; gap: 8px; padding: 12px; border-bottom: 1px solid rgba(255, 255, 255, 0.1); }
      .ma-search-icon { color: rgba(255, 255, 255, 0.6); --mdc-icon-size: 20px; flex-shrink: 0; }
      .ma-search-input { flex: 1; background: transparent; border: none; color: #fff; font-size: 14px; outline: none; padding: 6px 0; min-width: 0; }
      .ma-search-input::placeholder { color: rgba(255, 255, 255, 0.4); }
      .ma-search-btn { background: rgba(25, 165, 225, 0.6); border: none; color: #fff; padding: 6px 14px; border-radius: 6px; cursor: pointer; font-size: 13px; display: flex; align-items: center; gap: 4px; flex-shrink: 0; transition: background 0.2s; }
      .ma-search-btn:hover:not(:disabled) { background: rgba(25, 165, 225, 0.9); }
      .ma-search-btn:disabled { opacity: 0.5; cursor: not-allowed; }
      .ma-close-btn { background: transparent; border: none; color: rgba(255, 255, 255, 0.6); cursor: pointer; padding: 4px; display: flex; align-items: center; justify-content: center; border-radius: 50%; flex-shrink: 0; transition: background 0.2s; }
      .ma-close-btn:hover { background: rgba(255, 255, 255, 0.1); color: #fff; }
      .ma-spin { animation: ma-spin 1s linear infinite; }
      @keyframes ma-spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      .ma-panel-header { display: flex; align-items: center; gap: 8px; padding: 12px; border-bottom: 1px solid rgba(255, 255, 255, 0.1); }
      .ma-panel-title { flex: 1; font-size: 14px; color: #fff; font-weight: 600; }
      .ma-panel-list { overflow-y: auto; padding: 10px; max-height: 60vh; }
      .ma-panel-item { display: flex; align-items: center; gap: 10px; padding: 8px; border-radius: 8px; cursor: pointer; transition: background 0.2s; border-bottom: 1px solid rgba(255,255,255,0.06); }
      .ma-panel-item:hover { background: rgba(255,255,255,0.08); }
      .ma-panel-item-img { width: 48px; height: 48px; border-radius: 8px; background-size: cover; background-position: center; flex-shrink: 0; }
      .ma-panel-item-info { flex: 1; min-width: 0; }
      .ma-panel-item-name { font-size: 13px; color: #fff; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
      .ma-panel-item-sub { font-size: 11px; color: rgba(255,255,255,0.45); margin-top: 2px; }
      .ma-panel-loading { display: flex; align-items: center; justify-content: center; gap: 6px; padding: 20px; color: rgba(255,255,255,0.6); font-size: 13px; }
      .ma-panel-empty { text-align: center; padding: 20px; color: rgba(255,255,255,0.4); font-size: 13px; }
      .ma-panel-section-header { font-size: 11px; color: rgba(255,255,255,0.5); padding: 8px 8px 4px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; }
      .ma-panel-track-row { display: flex; align-items: center; gap: 10px; padding: 8px; border-radius: 8px; cursor: pointer; transition: background 0.2s; border-bottom: 1px solid rgba(255,255,255,0.05); }
      .ma-panel-track-row:hover { background: rgba(255,255,255,0.08); }
      .ma-panel-track-num { width: 24px; text-align: center; font-size: 12px; color: rgba(255,255,255,0.35); flex-shrink: 0; }
      .multi-device .left-sidebar { display: flex !important; }
    `;
  }

  constructor() {
    super();
    this._hass = null;
    this._config = {};
    this.xiaomiMiotEntity = '';
    this.xiaomiMiotState = {
      attributes: {
        entity_picture: ''
      }
    };
    this.volumeState = 20;
    this.isPlaying = false;
    this._lastVolume = 30;
    this.volumeDebounceTimer = null;
    this.isDragging = false;
    this.localVolumeUpdate = false;
    this._localVolumeResetTimer = null;
    this._isVolumeChanging = false;
    this._isVolumeDragging = false;
    this._justVolumeDragged = false;
    this._volumeJustReleased = false;
    this._dragVolume = undefined;
    this.width = '100%';
    this.height = 'auto';
    this.lyricsHeight = '200px';
    this.showLyrics = true;
    this._currentThemeIndex = 0;
    this._boundThemeChangeHandler = this._handleThemeChangeEvent.bind(this);
    this.lyrics = [];
    this.currentLyricIndex = -1;
    this.lyricProgress = 0;
    this.lyricsTimer = null;
    this.lyricsCache = new Map();
    this.smoothCurrentTime = 0;
    this.lastUpdateTime = 0;
    this.smoothTimer = null;
    this.wasPlaying = false;
    this.adjustmentToast = {
      show: false,
      message: '',
      timer: null
    };
    this.lyricsTimeAdjustment = 0;
    this.favoriteSongEntity = '';
    this.stopAlarmEntity = '';
    this._showHistory = false;
    this._showPlaylist = false;
    this._currentPlaylistData = null;
    this._historyData = [];
    this._historyLoading = false;
    this._historyFilterPeriod = 24;
    this.sidebarRadioEntity = '';
    this.textDirectiveEntity = '';

    this._initLyricsCache();
    this._mediaPlayerState = { activeTabIndex: 0, activePlaylistIndex: -1, activeItemIndex: -1 };
    this._localMusicPlayerCfg = null;
    this._miotOverlay = { title: '', artist: '', coverUrl: '', source: '', active: false };
    this._localOverlay = { title: '', artist: '', coverUrl: '', source: '', active: false };
    this._maOverlay = { title: '', artist: '', coverUrl: '', source: '', active: false };
    this._activeChannel = '';
    this.maServerUrl = '';
    this.maServerToken = '';
    this.maPlayerEntity = '';
    this.maPlaylistsConfig = '';
    this.maFavoritePlaylist = '';
    this.maPlaylist = '';
    this._maWs = null;
    this._maWsConnected = false;
    this._maPlaylistAutoRefreshed = false;
    this._maAuthMsgId = null;
    this._maWsHeartbeatInterval = null;
    this._maPlayerId = '';
    this._maQueueId = '';
    this._maCoverUrl = '';
    this._maDuration = 0;
    this._maElapsedTime = 0;
    this._maTrackName = '';
    this._maTrackArtist = '';
    this._lastPlaySource = '';
    this._maPlaylistsVisible = false;
    this._maPlaylistsList = [];
    this._maPlaylistsLoading = false;
    this._maPlaylistsError = '';
    this._maPlaylistPlaying = '';
    this._maPlaylistDetail = null;
    this._repeatMode = null;
    this._repeatModeFetched = false;
    this._maPlaylistTracks = [];
    this._maPlaylistTracksLoading = false;
    this._maPlayingIndex = -1;
    this._maExpectingEnd = false; // 已推送单首到 MA：曲终时由前端向后端取下一首再推送
    this._localPlaylist = [];
    this._localStatuses = [];
    this._localCurrentIndex = -1;
    this._localPlaylistSignature = '';
    this._maPlayingIndex = -1;
    this._maExpectingEnd = false;
    this._localPlaylist = [];
    this._localStatuses = [];
    this._localCurrentIndex = -1;
    this._localPlaylistSignature = '';
    this._maStatuses = [];
    this._favVisible = false;
    this._favTracks = [];
    this._favLoading = false;
    this._favError = '';
    this._favPlaying = '';
    this._overlayLyrics = [];
    this._timers = {
      _ids: new Set(),
      setTimeout: (fn, ms) => { const id = window.setTimeout(fn, ms); this._timers._ids.add(id); return id; },
      clearTimeout: (id) => { window.clearTimeout(id); this._timers._ids.delete(id); },
      clearAll: () => { this._timers._ids.forEach(id => window.clearTimeout(id)); this._timers._ids.clear(); },
    };
    this._popups = new Set();
  }

  // 获取 hass 对象
  get hass() { return this._hass; }

  // 获取主题
  _evaluateTheme() {
      try {
          const mode = this._config ? this._config.theme : 'system';
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

  // ========== 设备切换相关 ==========

  // 获取设备 ID
  _getDeviceId() {
    return this.xiaomiMiotEntity || this.maPlayerEntity || 'default';
  }

  // 获取上一次播放来源的 localStorage key
  _getLastSourceKey() {
    const did = this._getDeviceId();
    return did && did !== 'default' ? `sun_music_card_last_source_${did.replace(/[^a-zA-Z0-9_.-]/g, '_')}` : 'sun_music_card_last_source';
  }

  // 获取 np 的 localStorage key
  _getNpKey(channel) {
    const ch = channel || 'miot';
    const did = this._getDeviceId();
    if (!did || did === 'default') return `sun_xiaoai_np_${ch}`;
    return `sun_xiaoai_np_${ch}_${did.replace(/[^a-zA-Z0-9_.-]/g, '_')}`;
  }

  // 获取活动通道的覆盖层
  _getActiveOverlay() {
    if (!this._activeChannel) return null;
    switch (this._activeChannel) {
      case 'miot': return this._miotOverlay;
      case 'local': return this._localOverlay;
      case 'ma': return this._maOverlay;
      default: return null;
    }
  }

  // 获取活动通道的标题、艺术家、封面 URL、来源
  get _overlayTitle() { const o = this._getActiveOverlay(); return o ? o.title : ''; }

  set _overlayTitle(v) { const o = this._getActiveOverlay(); if (o) o.title = v; else { if (this._miotOverlay) this._miotOverlay.title = v; } }

  get _overlayArtist() { const o = this._getActiveOverlay(); return o ? o.artist : ''; }

  set _overlayArtist(v) { const o = this._getActiveOverlay(); if (o) o.artist = v; else { if (this._miotOverlay) this._miotOverlay.artist = v; } }

  get _overlayCoverUrl() { const o = this._getActiveOverlay(); return o ? o.coverUrl : ''; }

  set _overlayCoverUrl(v) { const o = this._getActiveOverlay(); if (o) o.coverUrl = v; else { if (this._miotOverlay) this._miotOverlay.coverUrl = v; } }

  get _activeOverlaySource() { const o = this._getActiveOverlay(); return o ? o.source : ''; }

  set _activeOverlaySource(v) { const o = this._getActiveOverlay(); if (o) o.source = v; else { if (this._miotOverlay) this._miotOverlay.source = v; } }

  get _lastPlaySource() { const o = this._getActiveOverlay(); return o ? o.source : ''; }

  set _lastPlaySource(v) { const o = this._getActiveOverlay(); if (o) o.source = v; else { if (this._miotOverlay) this._miotOverlay.source = v; } }

  // 设置活动通道
  _setChannel(channel) {
    if (this._activeChannel === channel) return;
    this._activeChannel = channel;
    try {
      const lsKey = this._getLastSourceKey();
      // 统一归一化存储：local / miot 原样，ma 系列统一存 'ma'
      if (channel === 'local') localStorage.setItem(lsKey, 'local');
      else if (channel === 'miot') localStorage.setItem(lsKey, 'miot');
      else localStorage.setItem(lsKey, 'ma');
    } catch(e) {}
    // 持久化到后端 player_state API（覆盖规则 1/2/4/5 的触发点）
    this._persistPlayerMode(channel);
  }

  // 暂停其他通道的播放
  _pauseOtherChannelsForMiot() {
    if (!this._hass) return;
    const miotEntity = this.xiaomiMiotEntity;
    const localActive = this._localOverlay && this._localOverlay.source === 'local' && this._localOverlay.active && this._localOverlay.title;
    if (localActive) {
      if (miotEntity) {
        this._hass.callService('media_player', 'media_pause', { entity_id: miotEntity }).catch(() => {});
      }
    }
    this._localOverlay = { title: '', artist: '', coverUrl: '', source: '', active: false };
    const maActive = this._maOverlay && this._maOverlay.active && this._maOverlay.source &&
      ['qqmusic', 'ma_search'].includes(this._maOverlay.source);
    if (maActive) {
      if (this._isMaWsReady() && this._maPlayerId) {
        try { this._maWsSend('player_queues/stop', { queue_id: this._maQueueId || this._maPlayerId }); } catch(e) {}
      }
      if (this.maPlayerEntity) {
        this._hass.callService('media_player', 'media_pause', { entity_id: this.maPlayerEntity }).catch(() => {});
      }
    }
    this._maOverlay = { title: '', artist: '', coverUrl: '', source: '', active: false };
  }

  // 暂停其他通道的播放
  _pauseOtherChannels() {
    if (!this._hass) return;
    const miotEntity = this.xiaomiMiotEntity;
    const maEntity = this.maPlayerEntity || this._internalMaPlayerEntityCfg;
    if (miotEntity) {
      const s = this._hass.states[miotEntity];
      if (s && s.state === 'playing') {
        const title = s.attributes?.media_title || '';
        const MIOT_FAKE = new Set(['请欣赏', '请欣赏（音乐）', '暂无播放', '正在加载', 'QQ音乐', '无音乐播放']);
        if (title && !MIOT_FAKE.has(title)) {
          // 检查是否 LOCAL 当前自己正在播放此实体 → 不暂停自己
          if (!(this._localOverlay.source === 'local' && this._localOverlay.active)) {
            this._hass.callService('media_player', 'media_pause', { entity_id: miotEntity }).catch(() => {});
          }
        }
      }
    }
    const maActive = this._maOverlay && this._maOverlay.active && this._maOverlay.source &&
      ['qqmusic', 'local', 'ma_search'].includes(this._maOverlay.source);
    if (maActive) {
      if (this._isMaWsReady()) {
        try { this._maWsSend('stop', {}); } catch(e) {}
      }
      const targetMa = maEntity || this.xiaomiMiotEntity;
      if (targetMa) {
        this._hass.callService('media_player', 'media_pause', { entity_id: targetMa }).catch(() => {});
      }
      this._maOverlay = { ...this._maOverlay, active: false, source: '' };
    }
  }

  // 暂停其他通道的播放
  _pauseOtherChannelsForMa() {
    if (!this._hass) return;
    const miotEntity = this.xiaomiMiotEntity;
    if (miotEntity) {
      const s = this._hass.states[miotEntity];
      if (s && s.state === 'playing') {
        const title = s.attributes?.media_title || '';
        const MIOT_FAKE = new Set(['请欣赏', '请欣赏（音乐）', '暂无播放', '正在加载', 'QQ音乐', '无音乐播放']);
        if (title && !MIOT_FAKE.has(title)) {
          if (!(this._maOverlay.source && this._maOverlay.active)) {
            this._hass.callService('media_player', 'media_pause', { entity_id: miotEntity }).catch(() => {});
          }
        }
      }
    }
    const localActive = this._localOverlay && this._localOverlay.source === 'local' && this._localOverlay.active && this._localOverlay.title;
    if (localActive) {
      if (miotEntity) {
        this._hass.callService('media_player', 'media_pause', { entity_id: miotEntity }).catch(() => {});
      }
      this._localOverlay = { ...this._localOverlay, active: false };
      this._localOverlay.title = '';
      this._localOverlay.artist = '';
      this._localOverlay.coverUrl = '';
    }
  }

  // 获取上一次播放来源
  _getLastSource() {
    const ch = this._activeChannel;
    if (ch === 'miot') return (this._miotOverlay && this._miotOverlay.source) || '';
    if (ch === 'local') return (this._localOverlay && this._localOverlay.source) || '';
    if (ch === 'ma') return (this._maOverlay && this._maOverlay.source) || '';
    return '';
  }

  // 初始化
  connectedCallback() {
    super.connectedCallback();
    this._injectPlayerStyles();
    window.addEventListener('mc-dashboard-theme-changed', this._boundThemeChangeHandler);
    this._syncThemeFromMainCard();
  }

  // 销毁
  disconnectedCallback() {
    super.disconnectedCallback();
    if (this.volumeDebounceTimer) {
      clearTimeout(this.volumeDebounceTimer);
      this.volumeDebounceTimer = null;
    }
    this.stopLyricsTimer();
    this.stopSmoothTimer();
    this._stopMaWsHeartbeat();
    if (this._maWs) {
      this._maWs.onclose = null;
      this._maWs.close();
      this._maWs = null;
    }
    this._maWsConnected = false;
    if (this._boundThemeChangeHandler) {
      window.removeEventListener('mc-dashboard-theme-changed', this._boundThemeChangeHandler);
    }
  }

  // Home Assistant 卡片必需的方法
  setConfig(config) {
    const devices = config.devices;
    if (!devices || !Array.isArray(devices) || devices.length === 0) {
      this._devices = [];
      this._activeDeviceIndex = 0;
      this._config = { ...config, xiaomi_miot: '' };
      this.xiaomiMiotEntity = '';
      this._layoutMode = 'full';
      this._hasPanel3 = false;
      return;
    }
    this._devices = devices.map((d, i) => ({ ...d, _id: d._id || `device_${i}` }));
    this._activeDeviceIndex = this._activeDeviceIndex || 0;
    const activeDevice = this._devices[this._activeDeviceIndex] || this._devices[0];
    this._activeDeviceIndex = this._devices.indexOf(activeDevice);
    
    this._config = {
      xiaomi_miot: activeDevice.xiaomi_miot,
      ma_player_entity: activeDevice.ma_player_entity || '',
      favorite_current_song: activeDevice.favorite_current_song || '',
      stop_alarm: activeDevice.stop_alarm || '',
      play_radio: activeDevice.play_radio || '',
      conversation: activeDevice.conversation || '',
      play_text: activeDevice.play_text || '',
      execute_text_directive: activeDevice.execute_text_directive || '',
      theme: config.theme,
      width: config.width,
      height: config.height,
      lyrics_height: config.lyrics_height,
      ...config
    };
    if (this._config.theme === undefined) {
      this._config.theme = 'system';
    }
    if (this._config.width === undefined) {
      this._config.width = '100%';
    }
    if (this._config.height === undefined) {
      this._config.height = 'auto';
    }
    if (this._config.lyrics_height === undefined) {
      this._config.lyrics_height = '200px';
    }
    this._syncThemeFromMainCard();
    this.xiaomiMiotEntity = this._config.xiaomi_miot;
    this.width = this._config.width;
    this.height = this._config.height;
    this.lyricsHeight = this._config.lyrics_height;
    this.favoriteSongEntity = this._config.favorite_current_song || '';
    this.stopAlarmEntity = this._config.stop_alarm || '';
    this.sidebarRadioEntity = this._config.play_radio || '';
    this.textDirectiveEntity = this._config.execute_text_directive || '';
    this.conversationEntity = this._config.conversation || '';
    this.playTextEntity = this._config.play_text || '';
    const qi = this._config.quick_input;
    this._quickInput = Array.isArray(qi) ? qi : (typeof qi === 'string' ? qi.split('\n').map(s => s.trim()).filter(Boolean) : []);
    this.maServerUrl = (this._config.ma_server_url || '').replace(/\/+$/, '');
    this.maServerToken = this._config.ma_server_token || '';
    this.maPlayerEntity = this._config.ma_player_entity || '';
    this._internalMaPlayerEntityCfg = (this._config.ma_internal_player_entity || '').trim();
    this.maPlaylistsConfig = this._config.ma_playlists || '';
    this.maFavoritePlaylist = (this._config.ma_favorite_playlist || '').trim();
    this.maPlaylist = (this._config.ma_playlist || '').trim();
    this._layoutMode = 'full';
    if (this.maServerUrl && this.maServerToken && !this._maWsConnected) {
      this._connectMaWs();
    }
    this.requestUpdate();
  }

  set hass(hass) {
    this._hass = hass;
    // 全局歌词检查：任何实体有歌曲信息就加载歌词
    if (this.showLyrics && hass) {
      const entities = [this.xiaomiMiotEntity].filter(Boolean);
      for (const eid of entities) {
        const s = hass.states[eid];
        if (s?.attributes?.media_title && s.attributes.media_artist && !this._isPseudoTitle(s.attributes.media_title)) {
          this.loadLyricsForCurrentSong();
          break;
        }
      }
    }
    if (!this._repeatModeFetched) {
      this._repeatModeFetched = true;
      this._fetchRepeatMode();

      this._fetchViewMode();
    }
    // 打开卡片时拉取本地播放 API 内容（不依赖 MA WS 是否就绪）
    if (!this._localPlaylistApiLoaded && this._hass?.auth?.data?.access_token) {
      this._localPlaylistApiLoaded = true;
      this._loadLocalPlaylistFromApi(true);
    }
    if (!this._activeChannel) {
      // 优先以后端 player_state API 的持久化模式为准，再回退 localStorage
      const mp = this._localMediaEntity();
      if (mp) {
        this._playerStateApiCall('GET', { media_player: mp }).then((d) => {
          if (d && d.mode && !this._activeChannel) {
            this._setChannel(d.mode);
            this.requestUpdate();
          }
        }).catch(() => {});
      }
      try {
        const saved = localStorage.getItem(this._getLastSourceKey());
        if (saved === 'local') this._activeChannel = 'local';
        else if (saved === 'qqmusic' || saved === 'ma_search' || saved === 'ma') this._activeChannel = 'ma';
        else if (saved === 'miot') this._activeChannel = 'miot';
      } catch(e) {}
    }
    if (this._activeChannel === 'local' && !this._localOverlay.title) {
      const lsData = this._restoreNowPlayingFromLocalStorage('local');
      if (lsData) {
        this._localOverlay = {
          title: lsData.title || '',
          artist: lsData.artist || '',
          coverUrl: lsData.cover_url || '',
          source: 'local',
          active: true
        };
        if (!this._mediaPlayerState) this._mediaPlayerState = {};
        if (!this._mediaPlayerState.currentItem && (lsData.media_content_id || lsData.title)) {
          this._mediaPlayerState.currentItem = {
            title: lsData.title || '',
            artist: lsData.artist || '',
            media_content_id: lsData.media_content_id || '',
            media_type: lsData.media_type || 'music',
            id: lsData.song_id || null
          };
        }
      }
      this._applyLocalMusicOverlay();
    }
    if (this.maServerUrl && this.maServerToken && !this._maWsConnected) {
      this._connectMaWs();
    }
    let usePrimaryEntity = true;
    let primaryState = null;
    let backupState = null;
    if (hass && this.xiaomiMiotEntity) {
      backupState = hass.states[this.xiaomiMiotEntity];
    }
    if (!primaryState || primaryState.state === 'unavailable') {
      usePrimaryEntity = false;
    }
    const maPlayerState = (this.maPlayerEntity && hass) ? hass.states[this.maPlayerEntity] : null;
    const activeState = usePrimaryEntity ? primaryState : backupState;
    const entityPlaying = activeState && ['playing', 'Playing', '播放', '播放中', '正在播放'].includes(activeState.state);
    const entityCurrentTitle = activeState?.attributes?.media_title || '';
    const miotOverriding = entityPlaying && entityCurrentTitle && !this._isPseudoTitle(entityCurrentTitle);
    const maWsActive = (this._activeChannel === 'ma' || (!this._activeChannel && !miotOverriding && this._maWsConnected && this._maTrackName && this._isMaSourceActive()));
    const maWsConnecting = (this._activeChannel === 'ma' || (!this._activeChannel && !miotOverriding && this._maWsConnected && !this._maTrackName));
    if (maWsActive) {
      this._setChannel('ma');
      if (usePrimaryEntity && primaryState) {
        if (!this.localVolumeUpdate && primaryState.attributes?.volume_level !== undefined) {
          this.volumeState = Math.round((primaryState.attributes.volume_level || 0) * 100);
        }
      } else if (backupState) {
        this.xiaomiMiotState = backupState;
        if (!this.localVolumeUpdate && backupState.attributes?.volume_level !== undefined) {
          this.volumeState = Math.round((backupState.attributes.volume_level || 0) * 100);
        }
      }
      if (maPlayerState && maPlayerState.state !== 'unavailable') {
        const maIsPlaying = ['playing', 'Playing', '播放', '播放中', '正在播放'].includes(maPlayerState.state);
        if (maIsPlaying) this.isPlaying = true;
      }
    } else if (maWsConnecting) {
      if (usePrimaryEntity && primaryState) {
        if (!this.localVolumeUpdate && primaryState.attributes?.volume_level !== undefined) {
          this.volumeState = Math.round((primaryState.attributes.volume_level || 0) * 100);
        }
      } else if (backupState) {
        this.xiaomiMiotState = backupState;
        if (!this.localVolumeUpdate && backupState.attributes?.volume_level !== undefined) {
          this.volumeState = Math.round((backupState.attributes.volume_level || 0) * 100);
        }
      }
      if (maPlayerState && maPlayerState.state !== 'unavailable') {
        const maIsPlaying = ['playing', 'Playing', '播放', '播放中', '正在播放'].includes(maPlayerState.state);
        if (maIsPlaying) this.isPlaying = true;
      }
      const maSourceEmpty = !this._maOverlay.source;
      const localSourceEmpty = !this._localOverlay.source;
      if (maSourceEmpty && localSourceEmpty) {
        try {
          const saved = localStorage.getItem(this._getLastSourceKey());
          if (saved && ['qqmusic', 'local', 'ma_search'].includes(saved)) {
            if (saved === 'local') {
              this._setChannel('local');
              this._localOverlay.source = 'local';
              this._applyLocalMusicOverlay();
            } else if (saved === 'qqmusic') {
              this._setChannel('ma');
              this._maOverlay.source = 'qqmusic';
              this._applyQQMusicOverlay();
            } else if (saved === 'ma_search') {
              this._setChannel('ma');
              this._maOverlay.source = 'ma_search';
              if (typeof this._applyMASearchOverlay === 'function') this._applyMASearchOverlay();
            }
          }
        } catch(e) {}
      }
    } else {
      if (this._activeChannel !== 'local' && this._activeChannel !== 'miot' && (!this._maOverlay.title || !this._maOverlay.source)) {
        this._restoreMaOverlayFromLocalStorage();
      }
      // 从3种实体中综合获取播放信息（哪个有就用哪个）
      const candidates = [];
      if (this.maPlayerEntity && hass.states[this.maPlayerEntity]) candidates.push({ state: hass.states[this.maPlayerEntity], channel: 'ma' });
      if (this.xiaomiMiotEntity && hass.states[this.xiaomiMiotEntity]) candidates.push({ state: hass.states[this.xiaomiMiotEntity], channel: 'miot' });
      let bestActive = null;
      const activeStates = ['playing', 'Playing', '播放', '播放中', '正在播放', 'paused', 'Paused', '暂停'];
      const playingStates = ['playing', 'Playing', '播放', '播放中', '正在播放'];
      for (const c of candidates) {
        if (activeStates.includes(c.state.state)) {
          const a = c.state.attributes || {};
          const title = a.media_title || '';
          if (title && !this._isPseudoTitle(title)) {
            bestActive = c; break; // 优先取有有效标题的
          } else if (!bestActive) {
            bestActive = c; // 退而求其次
          }
        } else if (!bestActive && c.state.state !== 'unavailable' && c.state.state !== 'off') {
          const a = c.state.attributes || {};
          const title = a.media_title || '';
          if (title && !this._isPseudoTitle(title)) {
            bestActive = c;
          }
        }
      }
      // 所有实体都无播放时，尝试从 MA 实体获取最后的标题
      if (!bestActive && candidates.length > 0) {
        for (const c of candidates) {
          const a = c.state.attributes || {};
          const title = a.media_title || '';
          if (title && !this._isPseudoTitle(title)) {
            bestActive = c; break;
          }
        }
      }

      // 电台模式（空列表电台，当前 miot 通道播放）：强制锁定 miot 实体，
      // 忽略 MA 播放器实体的旧信息，避免显示被切回 MA 通道而显示旧歌。
      if (this._activeChannel === 'miot' && this._isRadioByEmptyPlaylist()) {
        const miotCand = candidates.find(c => c.channel === 'miot');
        if (miotCand) bestActive = miotCand;
      }

      if (bestActive) {
        const ch = bestActive.channel;
        if (ch === 'ma') this._setChannel('ma');
        const a = bestActive.state.attributes || {};
        if (a.media_title && !this._isPseudoTitle(a.media_title) && !this._maOverlay.title) {
          this._maOverlay.title = a.media_title;
          this._maOverlay.artist = this._filterArtist(a.media_title, a.media_artist || a.artist || '');
          this._maOverlay.coverUrl = a.entity_picture || a.media_image_url || this._maOverlay.coverUrl;
          this._maLastSongTitle = a.media_title;
          this._maLastSongArtist = this._filterArtist(a.media_title, a.media_artist || a.artist || '');
        }
        this.isPlaying = playingStates.includes(bestActive.state.state);
        if (ch !== 'ma') {
          this._checkSongChange(bestActive.state);
        }
        if (!this.localVolumeUpdate && a.volume_level !== undefined) {
          this.volumeState = Math.round((a.volume_level || 0) * 100);
        }
      } else {
        if (this._activeChannel !== 'local' && this._activeChannel !== 'miot' && !this._maOverlay.source && !this._localOverlay.source) {
          try {
            const saved = localStorage.getItem(this._getLastSourceKey());
            if (saved && ['qqmusic', 'local', 'ma_search'].includes(saved)) {
              if (saved === 'local') {
                this._setChannel('local');
                this._localOverlay.source = 'local';
                this._applyLocalMusicOverlay();
              } else if (saved === 'qqmusic') {
                this._setChannel('ma');
                this._maOverlay.source = 'qqmusic';
                this._applyQQMusicOverlay();
              } else if (saved === 'ma_search') {
                this._setChannel('ma');
                this._maOverlay.source = 'ma_search';
                if (typeof this._applyMASearchOverlay === 'function') this._applyMASearchOverlay();
              }
            }
          } catch(e) {}
        }

        if (usePrimaryEntity && primaryState) {
          this.isPlaying = ['playing', 'Playing', '播放', '播放中', '正在播放'].includes(primaryState.state);

          if (!this.localVolumeUpdate && primaryState.attributes && primaryState.attributes.volume_level !== undefined) {
            this.volumeState = Math.round((primaryState.attributes.volume_level || 0) * 100);
          }

          const songChanged = this._checkSongChange(primaryState);

          if (songChanged && this.isPlaying && this.showLyrics && this.lyrics.length > 0) {
            this.initSmoothTimeOnce();
          }

        } else if (backupState) {
          this.xiaomiMiotState = backupState;
          this.isPlaying = ['playing', 'Playing', '播放', '播放中', '正在播放'].includes(backupState.state);

          if (!this.localVolumeUpdate && backupState.attributes && backupState.attributes.volume_level !== undefined) {
            this.volumeState = Math.round((backupState.attributes.volume_level || 0) * 100);
          }

          const songChanged = this._checkSongChange(backupState);

          if (songChanged && this.isPlaying && this.showLyrics && this.lyrics.length > 0) {
            this.initSmoothTimeOnce();
          }
        }
      }
    }
    if (this._activeChannel !== 'ma' && this._activeChannel !== 'miot' && !this._localOverlay.source && this._localMusicPlayerCfg) {
      try {
        const saved = localStorage.getItem(this._getLastSourceKey());
        if (saved !== 'local') return;
      } catch(e) {}
      this._setChannel('local');
      this._localOverlay.source = 'local';
      this._applyLocalMusicOverlay();
    }
    if (!this.localVolumeUpdate && !this._isVolumeChanging && !this._isVolumeDragging) {
      if (backupState && this.xiaomiMiotEntity && backupState.attributes?.volume_level !== undefined) {
        this.volumeState = Math.round((backupState.attributes.volume_level || 0) * 100);
      }
    }
    if (backupState && usePrimaryEntity) {
      this.xiaomiMiotState = backupState;
    }
    this.requestUpdate();
    if (!this.showLyrics) {
      this.showLyrics = true;
      if (this.lyrics.length === 0 && !this._lyricsLoading) {
        this.loadLyricsForCurrentSong();
      }
    }
    if (this.showLyrics) {
      this.startLyricsTimer();
    }
    if (this._volumeJustReleased) {
      this._volumeJustReleased = false;
    }
    const playbackStarted = !this.wasPlaying && this.isPlaying;
    this.wasPlaying = this.isPlaying;
    if (!this.isPlaying) {
      this.stopLyricsTimer();
    } else if (playbackStarted && this.showLyrics && this.lyrics.length > 0) {
      this.initSmoothTimeOnce();
    }
  }

  // 获取卡片大小
  getCardSize() {
    return 4;
  }

  // 获取配置元素
  static getConfigElement() {
    return document.createElement("xiaoshi-music-card-editor");
  }

  // 获取配置
  static getStubConfig() {
    return {
      devices: [{
        name: '',
        xiaomi_miot: '',
        ma_player_entity: '',
        favorite_current_song: '',
        stop_alarm: '',
        play_radio: '',
        conversation: '',
        play_text: '',
        execute_text_directive: '',
        quick_input: '',
      }],
      theme: "system",
      width: "100%",
      height: "auto",
      lyrics_height: "200px",

    };
  }

  // 更新播放器状态
  updatePlayerState(state) {
    this.playerState = { ...this.playerState, ...state };
    this.isPlaying = ['播放', '播放中', '正在播放', 'playing', 'Playing'].includes(state.state);
    this.requestUpdate();
  }

  // 更新音量
  updateVolume(volume) {
    this.volumeState = Math.max(0, Math.min(100, volume));
    this.localVolumeUpdate = true;
    clearTimeout(this._localVolumeResetTimer);
    this._localVolumeResetTimer = setTimeout(() => {
      this.localVolumeUpdate = false;
    }, 2000);
    this.requestUpdate();
  }

  // ======= 设备组切换 =======
  _switchDevice(index) {
    if (index === this._activeDeviceIndex || index < 0 || index >= this._devices.length) return;
    this._activeDeviceIndex = index;
    const d = this._devices[index];
    if (!d) return;
    this.xiaomiMiotEntity = d.xiaomi_miot || '';
    this.maPlayerEntity = d.ma_player_entity || '';
    this.favoriteSongEntity = d.favorite_current_song || '';
    this.stopAlarmEntity = d.stop_alarm || '';
    this.sidebarRadioEntity = d.play_radio || '';
    this.conversationEntity = d.conversation || '';
    this.playTextEntity = d.play_text || '';
    this.textDirectiveEntity = d.execute_text_directive || '';
    this._config.xiaomi_miot = d.xiaomi_miot || '';
    this._config.ma_player_entity = d.ma_player_entity || '';
    this._config.favorite_current_song = d.favorite_current_song || '';
    this._config.stop_alarm = d.stop_alarm || '';
    this._config.play_radio = d.play_radio || '';
    this._config.conversation = d.conversation || '';
    this._config.play_text = d.play_text || '';
    this._config.execute_text_directive = d.execute_text_directive || '';
    this._activeChannel = '';
    this._miotOverlay = {}; this._localOverlay = {}; this._maOverlay = {};
    this.showLyrics = true; this.lyrics = [];
    this._maTrackName = '';
    this._maTrackArtist = '';
    this._maCoverUrl = '';
    this._maDuration = 0;
    this._maElapsedTime = 0;
    this.smoothCurrentTime = 0;
    this._maQueueId = '';
    this.isPlaying = false;
    this.xiaomiMiotState = null;
    this._mediaPlayerState = { activeTabIndex: 0, activePlaylistIndex: -1, activeItemIndex: -1 };
    this.requestUpdate();
  }

  // 获取设备名称
  _getDeviceName(index) {
    const d = this._devices[index];
    if (!d) return '';
    return d.name || (this._hass?.states[d.xiaomi_miot]?.attributes?.friendly_name) || ('设备' + (index + 1));
  }

  // 调用服务
  async callService(service, data = {}) {
    if (this._hass) {
      try {
        await this._hass.callService(service.split('.')[0], service.split('.')[1], data);
      } catch (error) {
      }
    }
  }

  // 获取音量目标实体
  _getVolumeTargetEntity() {
    return this.xiaomiMiotEntity;
  }

  // 处理点击
  _handleClick(){
    const hapticEvent = new Event('haptic', {
      bubbles: true,
      cancelable: false,
      composed: true
    });
    hapticEvent.detail = 'light';
    this.dispatchEvent(hapticEvent);
    if (navigator.vibrate) {
      try { navigator.vibrate(30); } catch(e) {}
    }
  }

  // 处理电源
  handlePower() {
    this._handleClick();
    const targetEntity = this.xiaomiMiotEntity;
    this._pauseOtherChannelsForMa();
    this._pauseOtherChannels();
    this.callService('media_player.media_stop', { entity_id: targetEntity });
    this._maOverlay = { title: '', artist: '', coverUrl: '', source: '', active: false };
    this._localOverlay = { title: '', artist: '', coverUrl: '', source: '', active: false };
    this._miotOverlay = {};
    this._activeChannel = '';
    this.isPlaying = false;
    this.requestUpdate();
  }

  // 处理音量
  handleVolumeDown() {
    this._handleClick();
    const newVolume = Math.max(0, this.volumeState - 1);
    this.updateVolume(newVolume);
    const target = this._getVolumeTargetEntity();
    if (target) {
      this.callService('media_player.volume_set', { entity_id: target, volume_level: newVolume / 100 });
    }
  }

  // 处理音量
  handleVolumeUp() {
    this._handleClick();
    const newVolume = Math.min(100, this.volumeState + 1);
    this.updateVolume(newVolume);
    const target = this._getVolumeTargetEntity();
    if (target) {
      this.callService('media_player.volume_set', { entity_id: target, volume_level: newVolume / 100 });
    }
  }

  // 处理上一首
  handlePrevious() {
    console.log('[xiaoshi][prev] handlePrevious 主卡上一首点击', { channel: this._activeChannel, localLen: (this._localPlaylist || []).length });
    this._handleClick();
    this._routePrev();
    this.requestUpdate();
  }

  // 处理播放/暂停
  handlePlayPause() {
    this._handleClick();
    this._routePlayPause();
    this.requestUpdate();
  }

  // 处理暂停
  handlePause() {
    this._handleClick();
    const ch = this._activeChannel;
    if (ch === 'ma') { this._maPause(); return; }
    if (ch === 'local') { this._localPause(); return; }
    if (ch === 'miot') { const te = this.xiaomiMiotEntity; if (te) this._hass.callService('media_player', 'media_pause', { entity_id: te }).catch(() => {}); return; }
    const targetEntity = this._getActiveTargetEntity();
    if (targetEntity) this.callService('media_player.media_pause', { entity_id: targetEntity });
  }

  // 处理下一首
  handleNext() {
    console.log('[xiaoshi][next] handleNext 主卡下一首点击', { channel: this._activeChannel, localLen: (this._localPlaylist || []).length });
    this._handleClick();
    this._routeNext();
    this.requestUpdate();
  }

  // 处理随机播放（切换 random / sequential）
  handleShuffle() {
    this._handleClick();
    const targetEntity = (this._localOverlay.source === 'local' && this._localMusicPlayerCfg) ? this._localMusicPlayerCfg.mediaEntity : this._getActiveTargetEntity();
    if (!targetEntity) return;
    const currentMode = this._repeatMode || 'sequential';
    const newMode = currentMode === 'random' ? 'sequential' : 'random';
    if (this.textDirectiveEntity) {
      const command = newMode === 'random' ? '随机播放' : '顺序播放';
      this.callNotify(command);
    }
    this._updateRepeatMode(targetEntity, newMode);
  }

  // 处理循环播放（sequential ↔ repeat_one 来回切换，random 时回到 sequential）
  handleRepeat() {
    this._handleClick();
    const targetEntity = (this._localOverlay.source === 'local' && this._localMusicPlayerCfg) ? this._localMusicPlayerCfg.mediaEntity : this._getActiveTargetEntity();
    if (!targetEntity) return;
    const currentMode = this._repeatMode || 'sequential';
    let newMode;
    if (currentMode === 'sequential') { newMode = 'repeat_one'; }
    else if (currentMode === 'repeat_one') { newMode = 'sequential'; }
    else { newMode = 'sequential'; }
    if (this.textDirectiveEntity) {
      let command = '顺序播放';
      if (newMode === 'repeat_one') { command = '单曲循环'; }
      this.callNotify(command);
    }
    this._updateRepeatMode(targetEntity, newMode);
  }



  // 获取当前播放模式（GET）
  async _fetchRepeatMode() {
    if (!this._hass?.auth?.data?.access_token) return;
    try {
      const targetEntity = this._getActiveTargetEntity();
      if (!targetEntity) return;
      const accessToken = this._hass.auth.data.access_token;
      const response = await fetch(`/api/xiaoshi/ma/repeat_mode?media_player=${encodeURIComponent(targetEntity)}`, {
        headers: { Accept: 'application/json', Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
        credentials: 'same-origin'
      });
      if (response.ok) {
        const data = await response.json();
        if (data.repeat_mode && ['sequential', 'random', 'repeat_one'].includes(data.repeat_mode)) {
          this._repeatMode = data.repeat_mode;
          this.requestUpdate();
        }
      }
    } catch (e) {}
    if (!this._repeatMode) this._repeatMode = 'sequential';
  }



  // 获取显示模式（GET）
  async _fetchViewMode() {
    if (!this.maPlayerEntity || !this._hass?.auth?.data?.access_token) return;
    try {
      const accessToken = this._hass.auth.data.access_token;
      const response = await fetch(`/api/xiaoshi/ma/view?media_player=${encodeURIComponent(this.maPlayerEntity)}`, {
        headers: { Accept: 'application/json', Authorization: `Bearer ${accessToken}` },
        credentials: 'same-origin'
      });
      if (response.ok) {
        const data = await response.json();
        if (data.view === 'playlist') {
          this._showPlaylist = true;
          this.requestUpdate();
        }
      }
    } catch (e) {}
  }

  // 更新显示模式（POST）
  async _updateViewMode(view) {
    if (!this.maPlayerEntity || !this._hass?.auth?.data?.access_token) return;
    try {
      const accessToken = this._hass.auth.data.access_token;
      await fetch('/api/xiaoshi/ma/view', {
        method: 'POST',
        headers: { Accept: 'application/json', Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({ media_player: this.maPlayerEntity, view: view })
      });
    } catch (e) {}
  }

  // 更新播放模式（POST）
  async _updateRepeatMode(targetEntity, mode) {
    if (!['sequential', 'random', 'repeat_one'].includes(mode)) return;
    this._repeatMode = mode;
    this.requestUpdate();
    if (!this._hass?.auth?.data?.access_token) return;
    try {
      const accessToken = this._hass.auth.data.access_token;
      await fetch('/api/xiaoshi/ma/repeat_mode', {
        method: 'POST',
        headers: { Accept: 'application/json', Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({ media_player: targetEntity, repeat_mode: mode })
      });
    } catch (e) {}
  }

  // 假歌名判断（请欣赏、加载中等）
  _isPseudoTitle(title) {
    if (!title) return true;
    if (/^请欣赏/.test(title)) return true;
    const fakes = new Set(['暂无播放', '正在加载', 'QQ音乐', '无音乐播放', '加载中']);
    return fakes.has(title);
  }

  // 假歌名判断（请欣赏、加载中等）
  _isPseudoTitle(title) {
    if (!title) return true;
    if (/^请欣赏/.test(title)) return true;
    const fakes = new Set(['暂无播放', '正在加载', 'QQ音乐', '无音乐播放', '加载中']);
    return fakes.has(title);
  }



  // 处理收藏当前歌曲
  handleFavoriteCurrentSong() {
    this._handleClick();
    if (!this.favoriteSongEntity) return;
    this.callService('button.press', { entity_id: this.favoriteSongEntity });
    if (this._overlayTitle && this.maFavoritePlaylist && !this._isCurrentSongFavorite()) {
      this._favTracks.push({ name: this._overlayTitle, artist: this._overlayArtist || '', uri: this._overlayTitle, track_id: '', provider: 'library' });
      this.requestUpdate();
    }
  }

  // 处理停止闹钟
  handleStopAlarm() {
    this._handleClick();
    if (!this.stopAlarmEntity) return;
    this.callService('button.press', { entity_id: this.stopAlarmEntity });
  }

  // 静音/取消静音处理
  handleVolumeMute() {
    this._handleClick();
    const target = this._getVolumeTargetEntity();
    if (!target) return;
    this._isVolumeChanging = true;
    if (this.volumeState > 0) {
      this._lastVolume = this.volumeState;
      this.updateVolume(0);
      this.callService('media_player.volume_set', { entity_id: target, volume_level: 0 });
    } else {
      const restoreVolume = this._lastVolume || 30;
      this.updateVolume(restoreVolume);
      this.callService('media_player.volume_set', { entity_id: target, volume_level: restoreVolume / 100 });
    }
    setTimeout(() => { this._isVolumeChanging = false; }, 2500);
  }

  // 音量轨道点击处理
  _onVolumeTrackClick(e) {
    if (this._justVolumeDragged) {
      this._justVolumeDragged = false;
      return;
    }
    const track = e.currentTarget;
    const rect = track.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = Math.max(0, Math.min(100, (x / rect.width) * 100));
    const newVolume = Math.round(percentage);
    this.updateVolume(newVolume);
    this._handleClick();
    const target = this._getVolumeTargetEntity();
    this._isVolumeChanging = true;
    if (target) {
      this.callService('media_player.volume_set', {
        entity_id: target,
        volume_level: newVolume / 100
      }).finally(() => setTimeout(() => { this._isVolumeChanging = false; }, 500));
    }
  }

  // 音量滑块指针按下处理
  _onVolumePointerDown(e) {
    e.preventDefault();
    this._isVolumeDragging = true;
    this._volumeUpdateFromEvent(e);
    const onMove = (ev) => {
      if (!this._isVolumeDragging) return;
      this._volumeUpdateFromEvent(ev);
    };
    const onUp = () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('pointercancel', onUp);
      if (!this._isVolumeDragging) return;
      this._isVolumeDragging = false;
      this._volumeJustReleased = true;
      this._justVolumeDragged = true;
      this._volumeCallService();
      this.requestUpdate();
    };
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    window.addEventListener('pointercancel', onUp);
  }

  // 指针移动时更新音量显示
  _volumeUpdateFromEvent(e) {
    const track = this.shadowRoot.querySelector('.volume-track');
    if (!track) return;
    const rect = track.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const ratio = Math.max(0, Math.min(1, x / rect.width));
    const value = Math.round(ratio * 100);
    this._dragVolume = value;
    const fill = track.querySelector('.volume-fill');
    const thumb = track.querySelector('.volume-thumb');
    if (fill) fill.style.width = `${value}%`;
    if (thumb) thumb.style.left = `${value}%`;
  }

  // 音量拖动结束后调用 HA 服务
  _volumeCallService() {
    if (!this._hass) return;
    const newVolume = (this._dragVolume !== undefined) ? this._dragVolume : this.volumeState;
    this._dragVolume = undefined;
    this.updateVolume(newVolume);
    this._handleClick();
    const target = this._getVolumeTargetEntity();
    this._isVolumeChanging = true;
    if (target) {
      this.callService('media_player.volume_set', {
        entity_id: target,
        volume_level: newVolume / 100
      }).finally(() => setTimeout(() => { this._isVolumeChanging = false; }, 500));
    } else {
      setTimeout(() => { this._isVolumeChanging = false; }, 500);
    }
  }

  // 弹窗系统
  _showToast(msg, type) {
    const existing = document.querySelector('.xiaoshi-toast');
    if (existing) existing.remove();
    const toast = document.createElement('div');
    toast.className = 'xiaoshi-toast';
    const colors = { success: '#2ecc71', warning: '#f39c12', error: '#e74c3c', info: '#3498db' };
    toast.style.cssText = 'position:fixed;top:50%;left:50%;transform:translateX(-50%);z-index:100000;background:' + (colors[type] || '#333') + ';color:#fff;padding:10px 22px;border-radius:20px;font-size:14px;font-weight:500;box-shadow:0 4px 16px rgba(0,0,0,0.2);pointer-events:none;max-width:90vw;text-align:center;';
    toast.textContent = msg;
    document.body.appendChild(toast);
    window.setTimeout(() => { toast.remove(); }, 2500);
  }

  // 弹窗系统
  showPopup(options) {
    const {
      content, className, style, triggerButton, width, maxWidth, minWidth,
      height, maxHeight, showBackground, popupPosition,
      overlayBlur, onClose
    } = options || {};
    const overlay = document.createElement('div');
    overlay.className = 'xiaoshi-popup-overlay';
    overlay.style.cssText = 'position:fixed;inset:0;z-index:99990;';
    if (showBackground) {
      overlay.style.background = overlayBlur
        ? 'radial-gradient(circle at center, rgba(0,0,0,0.15), rgba(0,0,0,0.5))'
        : 'rgba(0,0,0,0.35)';
      if (overlayBlur) { overlay.style.backdropFilter = 'blur(12px)'; overlay.style.webkitBackdropFilter = 'blur(12px)'; }
    }
    const popup = document.createElement('div');
    popup.className = className || 'xiaoshi-popup';
    popup.style.cssText = (style || '') + ';position:relative;z-index:1;margin:auto;';
    if (width) popup.style.width = width;
    if (maxWidth) popup.style.maxWidth = maxWidth;
    if (minWidth) popup.style.minWidth = minWidth;
    if (height) popup.style.height = height;
    if (maxHeight) popup.style.maxHeight = maxHeight;
    overlay.appendChild(popup);
    overlay.style.display = 'flex';
    overlay.style.alignItems = 'center';
    overlay.style.justifyContent = 'center';
    if (popupPosition === 'top') {
      overlay.style.alignItems = 'flex-start';
      overlay.style.paddingTop = '20px';
      popup.style.margin = '0 auto';
    }
    if (triggerButton) {
      const r = triggerButton.getBoundingClientRect();
      overlay.style.alignItems = 'flex-start';
      overlay.style.paddingTop = (r.top + r.height + 8) + 'px';
    }
    const renderContent = () => {
      const rendered = typeof content === 'function' ? content() : content;
      if (rendered) {
        popup.innerHTML = '';
        popup.appendChild(rendered);
      }
    };
    renderContent();
    let closed = false;
    const close = () => {
      if (closed) return;
      closed = true;
      this._mediaPlayerRefreshTimer && this._timers.clearTimeout(this._mediaPlayerRefreshTimer);
      overlay.remove();
      this._popups.delete(close);
      if (onClose) onClose();
    };
    this._popups.add(close);
    const closeOnOuterClick = (e) => {
      if (e.target === overlay) close();
    };
    overlay.addEventListener('click', closeOnOuterClick);
    document.body.appendChild(overlay);
    return close;
  }

  // 记录最后一次播放的实体
  _updateLastPlayEntity(eid) { if (eid) try { localStorage.setItem('sun_xiaoai_last_play_entity', eid); } catch(e) {} }

  // ========== 小米语音相关 ==========

  // 调用通知
  async callNotify(text) {
    if (!this.textDirectiveEntity || !this._hass) return;
    try {
      await this._hass.callService('text', 'set_value', {
        entity_id: this.textDirectiveEntity,
        value: text
      });
    } catch (error) {
    }
  }

  // 处理历史记录
  _toggleHistory() {
    this._handleClick();
    if (this._showHistory) {
      this._closeHistoryOverlay();
      return;
    }
    this._showHistory = true;
    this._historyDeviceIndex = this._activeDeviceIndex || 0;
    this._showHistoryOverlay();
    this._fetchHistory(this._historyDeviceIndex);
  }

  // 切换歌词 / 播放列表显示
  async _togglePlaylistView() {
    this._handleClick();
    this._showPlaylist = !this._showPlaylist;
    const view = this._showPlaylist ? 'playlist' : 'lyrics';
    this._updateViewMode(view);
    this.requestUpdate();
  }

  // 获取历史记录
  async _fetchHistory(deviceIndex) {
    this._historyLoading = true;
    this._updateHistoryContent();
    try {
      const di = deviceIndex ?? this._historyDeviceIndex ?? this._activeDeviceIndex;
      const dev = this._devices?.[di];
      const dMiot = (dev?.xiaomi_miot || '').trim();
      const targetEntity = dMiot || this.xiaomiMiotEntity;
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
      this._historyData = [];
    } finally {
      this._historyLoading = false;
      this._updateHistoryContent();
    }
  }

  // 显示历史记录弹窗
  _showHistoryOverlay() {
    if (this._historyOverlayEl) return;
    const theme = this._evaluateTheme();
    const isDark = theme === 'dark' || theme === 'system';
    const targetEntity = this.xiaomiMiotEntity;
    const ent = this._hass?.states?.[targetEntity];
    const roomName = ent?.attributes?.friendly_name || targetEntity || '音乐播放器';
    const textColor = isDark ? '#fff' : '#333';
    const bgColor = isDark ? '#2c2c2c' : '#fff';
    const borderColor = isDark ? '#aaa' : '#888';
    const btnBg = isDark ? '#444' : '#f0f0f0';
    const btnIconColor = isDark ? '#ccc' : '#666';
    const chipBg = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)';
    const chipActiveBg = this._getHistoryAccentColor();
    const chipActiveColor = '#fff';
    this._historyFilterPeriod = 24;
    const overlay = document.createElement('div');
    overlay.className = 'xiaoshi-music-history-overlay';
    overlay.style.cssText = 'position:fixed;top:0;left:0;width:100vw;height:100vh;background:rgba(0,0,0,0.5);z-index:99999;display:flex;align-items:flex-start;justify-content:center;padding-top:20px;-webkit-backdrop-filter: blur(10px);backdrop-filter: blur(10px);';
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) this._closeHistoryOverlay();
    });

    const dialog = document.createElement('div');
    dialog.style.cssText = `background:${bgColor};border-radius:16px;width:95vw;max-width:500px;max-height:85vh;display:flex;flex-direction:column;box-shadow:0 8px 40px rgba(0,0,0,0.25);`;
    const header = document.createElement('div');
    header.style.cssText = `display:flex;flex-direction:column;gap:6px;padding:10px 0;margin:0 20px;border-bottom:1px solid ${borderColor};`;
    const headerTop = document.createElement('div');
    headerTop.style.cssText = 'display:flex;justify-content:space-between;align-items:center;';
    const title = document.createElement('span');
    title.style.cssText = `font-size:1.1rem;font-weight:700;color:${textColor};`;
    const dev = this._devices?.[this._historyDeviceIndex || 0];
    const devName = dev?.name || roomName;
    title.textContent = `${devName} - 播放历史`;
    headerTop.appendChild(title);
    const closeBtn = document.createElement('button');
    closeBtn.style.cssText = `width:36px;height:36px;border-radius:50%;border:none;background:${btnBg};cursor:default;display:flex;align-items:center;justify-content:center;transition:opacity 0.2s,transform 0.2s;`;
    closeBtn.innerHTML = `<ha-icon icon="mdi:close" style="--mdc-icon-size:20px;color:${btnIconColor};"></ha-icon>`;
    closeBtn.addEventListener('click', () => this._closeHistoryOverlay());
    closeBtn.addEventListener('mouseenter', () => { closeBtn.style.opacity = '0.85'; closeBtn.style.transform = 'scale(1.05)'; });
    closeBtn.addEventListener('mouseleave', () => { closeBtn.style.opacity = '1'; closeBtn.style.transform = 'scale(1)'; });
    headerTop.appendChild(closeBtn);
    header.appendChild(headerTop);
    if (this._devices && this._devices.length > 1) {
      const deviceChips = document.createElement('div');
      deviceChips.style.cssText = 'display:flex;gap:4px;flex-wrap:wrap;';
      for (let di = 0; di < this._devices.length; di++) {
        const d = this._devices[di];
        const dName = d.name || ('设备'+(di+1));
        const dChip = document.createElement('span');
        dChip.setAttribute('data-device-chip', di);
        dChip.textContent = dName;
        const isActive = di === (this._historyDeviceIndex || 0);
        dChip.style.cssText = `padding:3px 10px;border-radius:12px;font-size:0.72rem;font-weight:500;cursor:default;white-space:nowrap;transition:opacity 0.2s,transform 0.2s;background:${isActive ? chipActiveBg : chipBg};color:${isActive ? chipActiveColor : (isDark?'#ccc':'#555')};`;
        dChip.addEventListener('mouseenter', () => { dChip.style.opacity = '0.85'; dChip.style.transform = 'scale(1.05)'; });
        dChip.addEventListener('mouseleave', () => { dChip.style.opacity = '1'; dChip.style.transform = 'scale(1)'; });
        dChip.addEventListener('click', () => {
          this._handleClick();
          this._historyDeviceIndex = di;
          deviceChips.querySelectorAll('[data-device-chip]').forEach(c => {
            const idx = parseInt(c.getAttribute('data-device-chip'));
            const active = idx === di;
            c.style.background = active ? chipActiveBg : chipBg;
            c.style.color = active ? chipActiveColor : (isDark?'#ccc':'#555');
          });
          const dev2 = this._devices?.[di];
          const devName2 = dev2?.name || ('设备'+(di+1));
          title.textContent = `${devName2} - 播放历史`;
          this._historyLoading = true;
          this._historyData = [];
          this._fetchHistory(di);
        });
        deviceChips.appendChild(dChip);
      }
      header.appendChild(deviceChips);
    }
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
      { label: '10天', value: 240 }
    ];
    for (const p of periods) {
      const chip = this._buildFilterChip(p.label, p.value, chipBg, chipActiveBg, chipActiveColor, isDark);
      chip.addEventListener('click', () => {
        this._handleClick();
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

  // 更新历史记录内容
  _updateHistoryContent() {
    if (!this._historyBodyEl) return;
    const theme = this._evaluateTheme();
    const isDark = theme === 'dark' || theme === 'system';
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
      const { name, entries } = entityData;
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
      html += `<span style="display:flex;align-items:center;gap:4px;font-weight:700;font-size:0.85rem;color:${isDark?'#ddd':'#444'};white-space:nowrap;"><ha-icon icon="mdi:music-circle" style="--mdc-icon-size:16px;color:${ac};"></ha-icon>${name}</span>`;
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

  // 关闭历史记录对话框
  _closeHistoryOverlay() {
    this._handleClick();
    if (this._historyOverlayEl) {
      this._historyOverlayEl.remove();
      this._historyOverlayEl = null;
      this._historyBodyEl = null;
      this._historyTimeChipsEl = null;
    }
    this._showHistory = false;
    this._showPlaylist = false;
    this._currentPlaylistData = null;
    this._historyData = [];
    this._historyLoading = false;
    this._historyFilterPeriod = 24;
  }

  // 重新获取历史记录
  _refetchWithFilters() {
    this._historyLoading = true;
    this._updateHistoryContent();
    this._fetchHistory();
  }

  // 获取历史记录的颜色
  _getHistoryAccentColor() {
    const targetEntity = this.xiaomiMiotEntity;
    const entity = this._hass?.states?.[targetEntity];
    const state = entity?.state || 'idle';
    return this._getMusicStateColor(state);
  }

  // 获取音乐状态的颜色
  _getMusicStateColor(state) {
    const s = (state || '').trim();
    if (s === 'playing') return 'rgb(76,175,80)';
    if (s === 'paused') return 'rgb(255,193,7)';
    if (s === 'idle') return '#999';
    if (s === 'on') return '#999';
    if (s === 'off') return '#999';
    if (s === 'unavailable' || s === 'unknown') return '#f44336';
    return 'rgb(33,150,243)';
  }

  // 翻译音乐状态
  _translateMusicState(state) {
    const s = (state || '').trim();
    const translations = {
      'playing': '播放中',
      'paused': '已暂停',
      'idle': '待机中',
      'off': '已关闭',
      'on': '待机中',
      'unavailable': '已离线',
      'unknown': '未知'
    };
    return translations[s] || s;
  }

  // 格式化时间
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

  // 构建时间过滤器
  _buildFilterChip(label, value, chipBg, activeBg, activeColor, isDark) {
    const chip = document.createElement('span');
    chip.setAttribute('data-chip', '1');
    const isActive = (typeof value === 'number' && value === this._historyFilterPeriod);
    if (isActive) {
      chip.style.cssText = `padding:3px 10px;border-radius:12px;font-size:0.72rem;font-weight:500;cursor:default;white-space:nowrap;transition:opacity 0.2s,transform 0.2s;background:${activeBg};color:${activeColor};`;
    } else {
      chip.style.cssText = `padding:3px 10px;border-radius:12px;font-size:0.72rem;font-weight:500;cursor:default;white-space:nowrap;transition:opacity 0.2s,transform 0.2s;background:${chipBg};color:${isDark?'#ccc':'#555'};`;
    }
    chip.textContent = label;
    chip.addEventListener('mouseenter', () => { chip.style.opacity = '0.85'; chip.style.transform = 'scale(1.05)'; });
    chip.addEventListener('mouseleave', () => { chip.style.opacity = '1'; chip.style.transform = 'scale(1)'; });
    return chip;
  }

  // 刷新时间过滤器
  _refreshHistoryChips(container, activePeriod, chipBg, activeBg, activeColor, isDark) {
    this._handleClick();
    const chips = container.querySelectorAll('[data-chip]');
    chips.forEach(chip => {
      const label = chip.textContent;
      const isActive = (label === '24小时' && activePeriod === 24) ||
                       (label === '1小时' && activePeriod === 1) ||
                       (label === '6小时' && activePeriod === 6) ||
                       (label === '3天' && activePeriod === 72) ||
                       (label === '7天' && activePeriod === 168) ||
                       (label === '10天' && activePeriod === 240);
      if (isActive) {
        chip.style.background = activeBg;
        chip.style.color = activeColor;
      } else {
        chip.style.background = chipBg;
        chip.style.color = isDark ? '#ccc' : '#555';
      }
    });
  }

  // 构建时间线
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

  // 使用 HA 实体历史记录获取对话数据
  async _fetchConversationData(entityId, startDate, endDate) {
    try {
      const result = await this._hass.callWS({
        type: 'history/history_during_period',
        start_time: startDate + 'T00:00:00',
        end_time: endDate + 'T23:59:59',
        entity_ids: [entityId]
      });
      let states = [];
      if (result && typeof result === 'object' && !Array.isArray(result)) {
        states = result[entityId] || Object.values(result)[0] || [];
      } else if (Array.isArray(result) && Array.isArray(result[0])) {
        states = result[0];
      } else if (Array.isArray(result)) {
        states = result;
      }
        const rows = [];
      for (const s of states) {
        const attr = s.a || {}; const stateVal = s.s || '';
        const userText = attr.content || stateVal || '';
        let aiText = '';
        let convType = '';
        if (attr.answers && attr.answers.length > 0) {
          const ans = attr.answers[0];
          convType = ans.type || '';
          if (ans.type === 'TTS' && ans.tts) {
            aiText = ans.tts.text || '';
          } else if (ans.type === 'ALERT' && ans.alert) {
            aiText = `闹钟: ${ans.alert.datetime || ''}`;
          }
        }
        const convTime = attr.timestamp || s.lc || s.last_changed || '';
        if (userText || aiText) {
          rows.push({ user_text: userText, ai_text: aiText, conv_time: convTime, type: convType });
        }
      }
        return { success: true, rows };
    } catch(e) {
      return { success: false, error: e.message };
    }
  }

  // 显示小爱对话历史面板
  showXiaoaiConversation(button) {
    const entityId = this.conversationEntity || this.textDirectiveEntity;
    if (!entityId) { this._showToast('请配置 conversation', 'warning'); return; }
    const isLight = this._evaluateTheme() === 'light';
    const tc = this._getThemeButtonColors();
    const themeColors = {
      bg: tc.bg,
      fg: tc.fg,
      muted: tc.muted,
      isLight: isLight,
      popupBg: isLight ? 'rgba(255,255,255,0.96)' : 'rgba(30,30,30,0.96)',
      divider: isLight ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.08)',
      inputBg: isLight ? 'rgba(0,0,0,0.04)' : 'rgba(255,255,255,0.06)',
      aiBubbleBg: isLight ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.08)',
      accent: isLight ? '#3498db' : '#5dade2',
    };

    const cardConfig = {
      entity: entityId,
      name: this._hass?.states[entityId]?.attributes?.friendly_name || 'miot集成播放控制',
      conversation_page_days: 7,
      conversation_max_height: '500px',
      conversation_width: '95%',
      command_entity: this.textDirectiveEntity || '',
      play_text: this._config?.play_text || '',
      quick_input: this._quickInput || [],
      theme: themeColors,
    };
    this._showConversationBubble(button, cardConfig, null);
  }

  // 显示对话历史面板
  _showConversationBubble(targetEl, cardConfig) {
    if (this._currentConversationBubbleRef) {
      const prev = this._currentConversationBubbleRef;
      this._currentConversationBubbleRef = null;
      prev();
      if (prev._targetEl === targetEl) return;
    }
    const entityId = cardConfig.entity; if (!entityId) { this._showToast('请配置 entity', 'warning'); return; }
    const pageDays = parseInt(cardConfig.conversation_page_days, 10) || 7;
    const maxHeight = cardConfig.conversation_max_height || '65vh';
    const wCfg = cardConfig.conversation_width || '90%'; const width = typeof wCfg === 'number' ? wCfg + 'px' : wCfg;
    const userAvatarUrl = this._getCurrentUserAvatar();
    const commandEntity = cardConfig.command_entity || '';
    const playTextEntity = cardConfig.play_text || '';
    const quickInputList = Array.isArray(cardConfig.quick_input)
      ? cardConfig.quick_input.map(s => (typeof s === 'string' ? s.trim() : '')).filter(Boolean) : [];
    const theme = cardConfig.theme || {};
    const container = document.createElement('div'); container.className = 'conversation-bubble-content';
    container.style.cssText = `--conv-bg:${theme.popupBg||'#fff'};--conv-fg:${theme.fg||'#212121'};--conv-muted:${theme.muted||'#999'};--conv-divider:${theme.divider||'rgba(0,0,0,0.08)'};--conv-input-bg:${theme.inputBg||'rgba(0,0,0,0.04)'};--conv-ai-bubble:${theme.aiBubbleBg||'rgba(0,0,0,0.06)'};--conv-accent:${theme.accent||'#3498db'};`;
    container.innerHTML = `
      <div class="conv-header">
        <span class="conv-header-title">
          <ha-icon icon="mdi:account-voice"></ha-icon>
          <span>${this._escapeHtml(cardConfig.name || '语音对话记录')}</span>
        </span>
      </div>
      <div class="conv-loading-top" style="display:none;">
        <ha-icon icon="mdi:loading" class="conv-spin"></ha-icon><span>加载中...</span>
      </div>
      <div class="conv-list"></div>
      <div class="conv-error" style="display:none;">
        <div class="conv-error-text">加载失败</div>
        <button class="conv-retry-btn">重试</button>
      </div>
      <div class="conv-input-area">
        <input type="text" class="conv-input" placeholder="${commandEntity ? '输入指令发送给小爱...' : (playTextEntity ? '输入文本让小爱播报...' : '输入对话内容...')}" />
        <button class="conv-send-btn" title="发送指令">
          <ha-icon icon="mdi:send" style="--mdc-icon-size:18px;"></ha-icon>
        </button>
        <button class="conv-play-btn" title="播报文本">
          <ha-icon icon="mdi:volume-high" style="--mdc-icon-size:18px;"></ha-icon>
        </button>
        <button class="conv-quick-input-btn" title="快捷输入">
          <ha-icon icon="mdi:lightning-bolt" style="--mdc-icon-size:18px;"></ha-icon>
        </button>
      </div>
    `;
    const state2 = { entityId, pageDays, startDate: null, endDate: null, allRows: [], loading: false, noMore: false, userAvatarUrl, container, scrollEl: null };
    const inputEl = container.querySelector('.conv-input');
    const sendBtn = container.querySelector('.conv-send-btn');
    const playBtn = container.querySelector('.conv-play-btn');
    const sendIconHtml = '<ha-icon icon="mdi:send" style="--mdc-icon-size:18px;"></ha-icon>';
    const playIconHtml = '<ha-icon icon="mdi:volume-high" style="--mdc-icon-size:18px;"></ha-icon>';
    const loadingIconHtml = '<ha-icon icon="mdi:loading" class="conv-spin" style="--mdc-icon-size:18px;"></ha-icon>';
    const updateBtnState = () => {
      const hasText = !!(inputEl && (inputEl.value || '').trim());
      [sendBtn, playBtn].forEach(btn => {
        if (!btn) return;
        btn.disabled = !hasText;
        btn.style.opacity = hasText ? '1' : '0.5';
      });
    };
    updateBtnState();
    const appendLocalUserMessage = (text) => {
      const listEl = state2.container.querySelector('.conv-list');
      const emptyEl = listEl.querySelector('.conv-empty');
      if (emptyEl) emptyEl.remove();
      const userHtml = state2.userAvatarUrl
        ? `<img src="${this._escapeHtml(state2.userAvatarUrl)}" class="conv-avatar-img" alt="我">`
        : '<ha-icon icon="mdi:account" class="conv-avatar-icon"></ha-icon>';
      const now = new Date();
      const ts = `${this._formatConvDate(now)} ${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}:${String(now.getSeconds()).padStart(2,'0')}`;
      const msg = document.createElement('div');
      msg.className = 'conv-msg conv-msg-user conv-msg-pending';
      msg.innerHTML = `<div class="conv-bubble-wrap conv-bubble-wrap-user"><div class="conv-bubble conv-bubble-user">${this._escapeHtml(text)}</div></div><div class="conv-avatar conv-avatar-user">${userHtml}</div>`;
      const divider = document.createElement('div'); divider.className = 'conv-time-divider'; divider.textContent = ts;
      listEl.appendChild(divider); listEl.appendChild(msg);
      if (state2.scrollEl) requestAnimationFrame(() => { state2.scrollEl.scrollTop = state2.scrollEl.scrollHeight; });
    };
    const sendCommand = async (overrideText) => {
      const text = (typeof overrideText === 'string' ? overrideText : (inputEl.value || '')).trim();
      if (!text) return;
      sendBtn.innerHTML = loadingIconHtml;
      try {
        await this._hass.callService('text', 'set_value', { entity_id: entityId, value: text });
        appendLocalUserMessage(text);
        if (inputEl) inputEl.value = '';
        this._timers.setTimeout(() => { state2.allRows = []; state2.noMore = false; state2.startDate = null; state2.endDate = null; this._loadInitialConversation(state2, state2.scrollEl); }, 3000);
        this._saveConversationRecord(entityId, text, 'command');
      } catch(e) {
      } finally { sendBtn.innerHTML = sendIconHtml; updateBtnState(); if (inputEl) inputEl.focus(); }
    };
    const sendPlayText = async (overrideText) => {
      const text = (typeof overrideText === 'string' ? overrideText : (inputEl.value || '')).trim();
      if (!text) return;
      playBtn.innerHTML = loadingIconHtml;
      try {
        await this._hass.callService('text', 'set_value', { entity_id: entityId, value: text });
        this._showToast('已播报', 'success');
        if (inputEl) inputEl.value = '';
        this._saveConversationRecord(entityId, text, 'play_text').then(() => { state2.allRows = []; state2.noMore = false; state2.startDate = null; state2.endDate = null; this._loadInitialConversation(state2, state2.scrollEl); });
      } catch(e) {
      } finally { playBtn.innerHTML = playIconHtml; updateBtnState(); if (inputEl) inputEl.focus(); }
    };
    if (sendBtn) sendBtn.addEventListener('click', () => sendCommand());
    if (playBtn) playBtn.addEventListener('click', () => sendPlayText());
    if (inputEl) {
      inputEl.addEventListener('input', updateBtnState);
      inputEl.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          sendCommand();
        }
      });
    }
    const quickInputBtn = container.querySelector('.conv-quick-input-btn');
    if (quickInputBtn) {
      let quickPanel = null;
      const closeQuickPanel = () => { if (quickPanel) { quickPanel.remove(); quickPanel = null; quickInputBtn.classList.remove('active'); } };
      quickInputBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (quickPanel) { closeQuickPanel(); return; }
        quickPanel = document.createElement('div');
        quickPanel.className = 'conv-quick-input-panel';
        if (quickInputList.length > 0) {
          quickPanel.innerHTML = `<div class="conv-quick-input-header"><span>快捷输入</span><button class="conv-quick-input-close" title="关闭"><ha-icon icon="mdi:close" style="--mdc-icon-size:16px;"></ha-icon></button></div><div class="conv-quick-input-list">${quickInputList.map(t => `<div class="conv-quick-input-item">${this._escapeHtml(t)}</div>`).join('')}</div>`;
          quickPanel.querySelectorAll('.conv-quick-input-item').forEach((item, idx) => {
            item.addEventListener('click', (ev) => { ev.stopPropagation(); const t = quickInputList[idx]; closeQuickPanel(); inputEl.value = t; updateBtnState(); sendCommand(t); });
          });
        } else {
          quickPanel.innerHTML = `<div class="conv-quick-input-header"><span>快捷输入</span><button class="conv-quick-input-close" title="关闭"><ha-icon icon="mdi:close" style="--mdc-icon-size:16px;"></ha-icon></button></div><div class="conv-quick-input-list"><div class="conv-quick-input-empty">暂无快捷输入，请在卡片配置中添加 quick_input</div></div>`;
        }
        const ia = container.querySelector('.conv-input-area');
        ia.style.position = 'relative'; ia.appendChild(quickPanel);
        quickInputBtn.classList.add('active');
        quickPanel.querySelector('.conv-quick-input-close').addEventListener('click', (ev) => { ev.stopPropagation(); closeQuickPanel(); });
      });
      container.addEventListener('click', (e) => {
        if (!quickPanel) return;
        if (e.target.closest('.conv-quick-input-btn') || e.target.closest('.conv-quick-input-panel')) return;
        closeQuickPanel();
      });
    }
    const closePopup = this.showPopup({
      content: () => container,
      className: 'conversation-bubble',
      style: 'background:' + (theme.popupBg || '#fff') + ';border-radius:14px;overflow:hidden;display:flex;flex-direction:column;width:' + width + ';max-width:500px;height:' + maxHeight + ';max-height:min(700px,88vh);',
      showOverlay: true, showBackground: true, overlayBlur: true, popupPosition: 'top',
      onClose: () => { if (this._currentConversationBubbleRef?._targetEl === targetEl) this._currentConversationBubbleRef = null; }
    });
    closePopup._targetEl = targetEl;
    this._currentConversationBubbleRef = closePopup;
    const scrollEl = container.querySelector('.conv-list');
    state2.scrollEl = scrollEl;
    if (scrollEl) { scrollEl.addEventListener('scroll', () => { if (scrollEl.scrollTop < 50 && !state2.loading && !state2.noMore) this._loadMoreConversation(state2, scrollEl); }); }
    this._loadInitialConversation(state2, scrollEl);
  }

  // 加载初始对话
  async _loadInitialConversation(state2, scrollEl) {
    const today = new Date(); const te = this._formatConvDate(today); const ss = this._formatConvDate(new Date(today.getTime() - state2.pageDays * 86400000)); state2.endDate = te; state2.startDate = ss;
    const le = state2.container.querySelector('.conv-list'); const ee = state2.container.querySelector('.conv-error'); state2.container.querySelector('.conv-loading-top').style.display = '';
    const result = await this._fetchConversationData(state2.entityId, ss, te); state2.container.querySelector('.conv-loading-top').style.display = 'none';
    if (!result.success) { ee.style.display = ''; ee.querySelector('.conv-error-text').textContent = '加载失败：' + result.error; ee.querySelector('.conv-retry-btn').onclick = () => { ee.style.display = 'none'; le.innerHTML = ''; this._loadInitialConversation(state2, scrollEl); }; return; }
    if (result.rows.length === 0) { state2.noMore = true; le.innerHTML = '<div class="conv-empty"><ha-icon icon="mdi:chat-outline"></ha-icon><span>暂无对话记录</span></div>'; return; }
    state2.allRows = result.rows.slice().sort((a, b) => (a.conv_time || '').localeCompare(b.conv_time || '')); this._renderConversationList(state2, le);
    if (scrollEl) requestAnimationFrame(() => { scrollEl.scrollTop = scrollEl.scrollHeight; });
  }

  // 加载更多对话
  async _loadMoreConversation(state2, scrollEl) {
    if (state2.loading || state2.noMore) return; state2.loading = true;
    const lt = state2.container.querySelector('.conv-loading-top'); lt.style.display = '';
    const pv = new Date(state2.startDate + 'T00:00:00'); const ne = state2.startDate; const ns = this._formatConvDate(new Date(pv.getTime() - state2.pageDays * 86400000));
    const osh = scrollEl?.scrollHeight || 0;
    const result = await this._fetchConversationData(state2.entityId, ns, ne); lt.style.display = 'none'; state2.loading = false;
    const le = state2.container.querySelector('.conv-list');
    if (!result.success) { const ft = document.createElement('div'); ft.className = 'conv-load-fail-tip'; ft.textContent = '加载失败'; le.prepend(ft); setTimeout(() => ft.remove(), 2000); return; }
    if (result.rows.length === 0) { state2.noMore = true; const nmt = document.createElement('div'); nmt.className = 'conv-no-more-tip'; nmt.textContent = '没有更早的对话了'; le.prepend(nmt); return; }
    state2.startDate = ns; const nrs = result.rows.slice().sort((a, b) => (a.conv_time || '').localeCompare(b.conv_time || '')); state2.allRows = [...nrs, ...state2.allRows];
    this._renderConversationList(state2, le);
    if (scrollEl) requestAnimationFrame(() => { scrollEl.scrollTop = scrollEl.scrollHeight - osh; });
  }

  // 通过设置实体状态记录对话
  async _saveConversationRecord(entityId, userText) {
    try {
      await this._hass.callService('text', 'set_value', { entity_id: entityId, value: userText });
      return true;
    } catch(e) { return false; }
  }

  // 格式化日期
  _formatConvDate(d) { return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); }

  _formatConvTimeDisplay(ct) {
    if (!ct) return '';
    try {
      const d = new Date(ct);
      if (isNaN(d.getTime())) return ct;
      const now = new Date();
      const pad = (n) => String(n).padStart(2, '0');
      const time = `${pad(d.getHours())}:${pad(d.getMinutes())}`;
      const isToday = d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth() && d.getDate() === now.getDate();
      if (isToday) return `今天 ${time}`;
      const yesterday = new Date(now); yesterday.setDate(yesterday.getDate() - 1);
      const isYesterday = d.getFullYear() === yesterday.getFullYear() && d.getMonth() === yesterday.getMonth() && d.getDate() === yesterday.getDate();
      if (isYesterday) return `昨天 ${time}`;
      if (d.getFullYear() === now.getFullYear()) return `${pad(d.getMonth()+1)}-${pad(d.getDate())} ${time}`;
      return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())} ${time}`;
    } catch(e) { return ct; }
  }

  // 解析闹钟时间
  _parseAlarmTimeFromText(text) { if (!text) return null; const m = text.match(/(上午|下午|中午|凌晨|清晨|早上|晚上|傍晚|夜里)?\s*(\d{1,2})\s*[点时](?:\s*(\d{1,2})\s*分|半)?/); if (!m) return null; const period = m[1] || ''; let h = parseInt(m[2], 10); if (isNaN(h)) return null; let min = 0; if (m[3] !== undefined) { min = parseInt(m[3], 10); if (isNaN(min)) return null; } else if (/半/.test(m[0])) min = 30; if (['下午','晚上','傍晚','夜里'].includes(period) && h < 12) h += 12; return { hour: h, minute: min }; }

  _formatAlarmTime(al) { return al ? String(al.hour).padStart(2, '0') + ':' + String(al.minute).padStart(2, '0') : ''; }

  // ========== 小米电台相关 ==========

  // 小米电台按钮
  handleSidebarRadioPress() {
    this._handleClick();
    if (!this.sidebarRadioEntity) {
      this._showToast('请先配置小米电台实体 play_radio', 'warning');
      return;
    }
    // 小米电台模式：清空本地播放 api 记录
    if (this._localPlaylist && this._localPlaylist.length) {
      this._clearLocalPlaylist(this._localMediaEntity());
      this._localPlaylist = [];
      this._localStatuses = [];
      this._localCurrentIndex = -1;
      this._localPlaylistSignature = '';
    }
    // 清空 ma_playlist 列表（MA 服务器 + 前端显示）
    this._clearLocalMaPlaylistTracks();
    this._maPlaylistTracks = [];
    this._maPlaylistDetail = null;
    this._maPlaylistPlaying = '';
    this._maPlaylistTracksLoading = false;
    this._maPlayingIndex = -1;
    // 更新播放列表显示（电台不显示列表）
    this._currentPlaylistData = null;
    this._showPlaylist = false;
    this._pauseOtherChannelsForMiot();
    this._setChannel('miot');
    // 清除"过期歌名锁"，让正常电台流程由 _checkSongChange 自行刷新
    this._miotStaleTitle = '';
    // 立即给出可见反馈：界面切到电台通道并显示"正在连接电台"，证明 UI 已响应
    this._miotOverlay = { title: '正在连接电台…', artist: '', coverUrl: '', source: 'miot', active: true };
    this.requestUpdate();
    const miotSt = this._hass && this.xiaomiMiotEntity ? this._hass.states[this.xiaomiMiotEntity] : null;
    console.log('[xiaoshi] 电台按下:', {
      radio: this.sidebarRadioEntity,
      miot: this.xiaomiMiotEntity, miotState: miotSt?.state, miotTitle: miotSt?.attributes?.media_title,
    });
    this.callService('button.press', { entity_id: this.sidebarRadioEntity });
    // 电台歌名/封面由实体异步上报：依次尝试 miot实体，谁先给出有效信息就用谁
    [300, 800, 1500, 2500, 5000, 7500, 10000].forEach(delay => setTimeout(() => {
      if (this._activeChannel !== 'miot') return;
      const readEnt = (entId, label) => {
        if (!this._hass || !entId) return null;
        const st = this._hass.states[entId];
        const a = st?.attributes;
        if (!a) return null;
        const MIOT_FAKE = new Set(['请欣赏', '请欣赏（音乐）', '暂无播放', '正在加载', 'QQ音乐', '无音乐播放']);
        const mt = a.media_title || '';
        console.log(`[xiaoshi] 轮询 ${delay}ms ${label}:`, { state: st.state, title: mt, artist: a.media_artist, cover: a.entity_picture || a.media_image_url });
        // 仅在实体确在播放且有有效标题时，才采用其信息（避免采用 paused 的旧歌名）
        if (st.state === 'playing' && mt && !MIOT_FAKE.has(mt)) {
          return { title: mt, artist: a.media_artist || '', cover: a.entity_picture || a.media_image_url || '' };
        }
        return null;
      };
      const m = readEnt(this.xiaomiMiotEntity, 'miot');
      const picked = m;
      if (picked) {
        this._miotOverlay = { title: picked.title, artist: picked.artist, coverUrl: picked.cover, source: 'miot', active: true };
        console.log(`[xiaoshi] 轮询 ${delay}ms 采用电台信息:`, picked.title);
      } else {
        console.log(`[xiaoshi] 轮询 ${delay}ms: miot 未在播放或无可读电台名`);
      }
      this.requestUpdate();
    }, delay));
  }

  // ========== 本地音乐相关 ==========

  // 解析播放器配置（本地音乐弹窗用）
  _parsePlayerConfig(cardConfig) {
    let src = cardConfig;
    if ((!src || !(src.entity || src.media_entity)) && src?.buttons?.[0]) {
      src = src.buttons[0];
    }
    const mediaEntity = (src && (src.entity || src.media_entity)) || null;
    if (!src || !mediaEntity) {
      // 自动使用小爱音箱实体
      const autoEntity = this.xiaomiMiotEntity;
      if (!autoEntity) return null;
      return {
        name: this._hass?.states[autoEntity]?.attributes?.friendly_name || '小爱音箱',
        mediaEntity: autoEntity,
        width: '420px',
        coverAnimation: true,
        pageTabs: [{ name: '本地播放', icon: 'mdi:music', _builtin: 'player' }],
        defaultPage: '',
        playerPageLabel: '本地播放',
        tabs: [],
        users: [],
      };
    }
    const users = [];
    const playlistTabs = [];
    const playerPageLabel = src.player_page_label || '本地播放';
    const pageTabs = [{ name: playerPageLabel, icon: 'mdi:music', _builtin: 'player' }];
    const userTabs = Array.isArray(src.tabs) ? src.tabs : [];
    userTabs.forEach(t => {
      if (t && t.name) {
        pageTabs.push({ name: t.name, icon: t.icon || 'mdi:view-dashboard-outline', rows: Array.isArray(t.rows) ? t.rows : [], entity: t.entity || '', entity_value: t.entity_value });
      }
    });
    return { name: src.name || '', mediaEntity: mediaEntity, width: src.width || '420px', coverAnimation: src.cover_animation !== false, pageTabs: pageTabs, defaultPage: src.default_page || '', playerPageLabel: playerPageLabel, tabs: playlistTabs, users: users };
  }

  // 解析默认页面索引
  _resolveDefaultPageIndex(cfg) {
    const name = cfg.defaultPage;
    if (!name) return 0;
    const idx = cfg.pageTabs.findIndex(t => t.name === name);
    return idx >= 0 ? idx : 0;
  }

  // 主入口：打开本地音乐弹窗
  showLocalMusicPopup(group) {
    const playerCfg = this._parsePlayerConfig(group || {});
    if (!playerCfg) { this._showToast('请配置 media_entity', 'warning'); return; }
    this._localMusicPlayerCfg = playerCfg;
    const isLight = this._evaluateTheme() === 'light';
    const tm = {
      bg: isLight ? 'rgba(255,255,255,0.98)' : 'rgba(30,30,30,0.98)',
      fg: isLight ? '#212121' : '#eee',
      muted: isLight ? '#999' : '#888',
      accent: isLight ? '#3498db' : '#5dade2',
      btnBg: isLight ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.06)',
      cardBg: isLight ? 'transparent' : 'rgba(255,255,255,0.03)',
      cardBorder: isLight ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.06)',
      hoverBg: isLight ? 'rgba(0,0,0,0.03)' : 'rgba(255,255,255,0.05)',
      slider: isLight ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.1)',
      icon: isLight ? '#555' : '#aaa',
    };
    const savedState = this._mediaPlayerState || {};
    const state = {
      playerCfg, activePageIndex: this._resolveDefaultPageIndex(playerCfg),
      _activeView: 'list',
      activeTabIndex: savedState.activeTabIndex || 0,
      activePlaylistIndex: savedState.activePlaylistIndex >= 0 ? savedState.activePlaylistIndex : -1,
      activeItemIndex: savedState.activeItemIndex >= 0 ? savedState.activeItemIndex : -1,
      _popupContainer: null,
    };
    const popupState = state;
    // 配置了 local_music_path 时从媒体源加载（空值从根目录浏览）
    const playlistPromise = (this._config?.local_music_path !== undefined)
      ? Promise.all([this._fetchPlaylists('')])
      : Promise.resolve(null);
    let contentContainer;

    const closePopup = this.showPopup({
      content: () => {
        contentContainer = document.createElement('div');
        contentContainer.className = 'media-player-popup';
        contentContainer.style.cssText = `display:flex;flex-direction:column;flex:1;overflow:hidden;position:relative;--b-bg:${tm.bg};--b-fg:${tm.fg};--b-muted:${tm.muted};--b-accent:${tm.accent};--b-btnBg:${tm.btnBg};--b-cardBg:${tm.cardBg};--b-cardBorder:${tm.cardBorder};--b-hoverBg:${tm.hoverBg};--b-slider:${tm.slider};--b-icon:${tm.icon};`;
        popupState._popupContainer = contentContainer;
        this._renderPlayerPopup(contentContainer, playerCfg, popupState);
        return contentContainer;
      },
      className: 'media-player-popup',
      style: `background:${tm.bg};backdrop-filter:blur(30px);-webkit-backdrop-filter:blur(30px);border-radius:24px;padding:0;overflow:hidden;width:95%;max-width:500px;min-width:320px;height:500px;max-height:min(700px,90vh);display:flex;flex-direction:column;`,
      showOverlay: true, showBackground: true, overlayBlur: true, popupPosition: 'top',
    });

    playlistPromise.then(allPlaylists => {
      if (allPlaylists) {
        // 使用 local_music_path 时，直接填充第一个用户标签
        if (this._config?.local_music_path && allPlaylists[0]) {
          playerCfg.tabs = [{ name: '本地音乐', icon: 'mdi:music', playlists: allPlaylists[0] }];
          playerCfg.users = [''];
        } else if (playerCfg.tabs) {
          allPlaylists.forEach((pls, idx) => { if (playerCfg.tabs[idx]) playerCfg.tabs[idx].playlists = pls; });
        }
      }
      if (contentContainer) {
        const viewArea = popupState._viewArea;
        if (viewArea) this._renderActivePage(viewArea, playerCfg, popupState);
        this._bindPlayerEvents(contentContainer, playerCfg, popupState);
        this._refreshPlayerUI(contentContainer, playerCfg, popupState);
        this._startPlayerRefreshInterval(contentContainer, playerCfg, popupState);
      }
    });
    popupState._closePopup = closePopup;
    return closePopup;
  }

 // 转义HTML标签
  _escapeHtml(text) {
    if (!text) return '';
    const d = document.createElement('div');
    d.textContent = text;
    return d.innerHTML;
  }

  // 格式化媒体时间
  _formatMediaTime(seconds) {
    if (!seconds || isNaN(seconds) || seconds < 0) return '0:00';
    const s = Math.floor(seconds);
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return m + ':' + sec.toString().padStart(2, '0');
  }

  // 样式化音量滑块
  _styleVolumeThumb() {
    if (!document.getElementById('_sunPlayerVolStyle')) {
      const s = document.createElement('style'); s.id = '_sunPlayerVolStyle';
      s.textContent = '.media-player-volume-slider::-webkit-slider-thumb{-webkit-appearance:none;appearance:none;width:14px;height:14px;border-radius:50%;background:var(--b-accent,#3498db);border:2px solid #fff;box-shadow:0 1px 4px rgba(0,0,0,0.2);cursor:pointer;}.media-player-volume-slider::-moz-range-thumb{width:14px;height:14px;border-radius:50%;background:var(--b-accent,#3498db);border:2px solid #fff;box-shadow:0 1px 4px rgba(0,0,0,0.2);cursor:pointer;}';
      document.head.appendChild(s);
    }
  }

  // 绑定播放器弹窗事件
  _bindPlayerEvents(container, cfg, state) {
    const pageTabs = container.querySelectorAll('.media-player-page-tab');
    pageTabs.forEach(tab => { tab.addEventListener('click', () => { this._switchPlayerPage(parseInt(tab.dataset.page), container, state); }); });
    const showPlBtn = container.querySelector('[data-action="show-playlist"]');
    if (showPlBtn) { showPlBtn.addEventListener('click', () => { /* 列表视图为默认/唯一视图，无需切换 */ }); }
    const closePopupBtn = container.querySelector('[data-action="close-popup"]');
    if (closePopupBtn) { closePopupBtn.addEventListener('click', () => { if (state._closePopup) state._closePopup(); }); }
    const tabBtns = container.querySelectorAll('.media-player-tab-btn');
    tabBtns.forEach((btn) => { btn.addEventListener('click', () => { const idx = parseInt(btn.dataset.tabIndex); if (idx === state.activeTabIndex) return; state.activeTabIndex = idx; state.activePlaylistIndex = -1; state.activeItemIndex = -1; this._saveMediaPlayerState(state); const tb = cfg.tabs[idx]; const u = cfg.users?.[idx]; const nf = u && (!tb?.playlists || tb.playlists.length === 0); if (nf) { this._fetchPlaylists(u).then(pls => { if (tb) tb.playlists = pls; this._updateTabContent(container, cfg, state); }); } else this._updateTabContent(container, cfg, state); }); });
    const items = container.querySelectorAll('.media-player-item');
    items.forEach((itEl) => { itEl.addEventListener('click', () => { const iIdx = parseInt(itEl.dataset.itemIndex); const tb = cfg.tabs[state.activeTabIndex]; const pl = tb?.playlists?.[state.activePlaylistIndex]; if (!pl?.items?.[iIdx]) return; state.activeItemIndex = iIdx; this._playMediaItem(pl.items[iIdx], cfg, state, container); }); });
    const playBtn = container.querySelector('[data-action="play-pause"]'); if (playBtn) playBtn.addEventListener('click', () => { this._togglePlayPause(cfg.mediaEntity); });
    const prevBtn = container.querySelector('[data-action="prev"]'); if (prevBtn) prevBtn.addEventListener('click', () => { console.log('[xiaoshi][prev] 弹窗上一首按钮点击'); this._prevTrack(cfg, state, container); });
    const nextBtn = container.querySelector('[data-action="next"]'); if (nextBtn) nextBtn.addEventListener('click', () => { console.log('[xiaoshi][next] 弹窗下一首按钮点击'); this._nextTrack(cfg, state, container); });
    const stopBtn = container.querySelector('[data-action="stop"]'); if (stopBtn) stopBtn.addEventListener('click', () => { this._stopMedia(cfg.mediaEntity); this._clearNowPlaying(cfg); });
    const volSlider = container.querySelector('[data-action="volume"]');
    if (volSlider) { volSlider.addEventListener('input', (e) => { const val = parseInt(e.target.value); this._setVolume(cfg.mediaEntity, val/100); const lb = container.querySelector('[data-volume-label]'); if (lb) lb.textContent = val + '%'; e.target.style.background = 'linear-gradient(to right,var(--b-accent,#3498db) 0%,var(--b-accent,#3498db) ' + val + '%,var(--b-slider,rgba(0,0,0,0.08)) ' + val + '%,var(--b-slider,rgba(0,0,0,0.08)) 100%)'; const vi = container.querySelector('[data-mute-toggle]'); if (vi) { vi.setAttribute('icon', val === 0 ? 'mdi:volume-off' : val < 50 ? 'mdi:volume-low' : 'mdi:volume-high'); if (val > 0) vi.dataset.prevVolume = String(val); } }); }
  }

  // 切换播放器页面
  _switchPlayerPage(idx, container, state) {
    if (idx === state.activePageIndex) return; state.activePageIndex = idx;
    const va = container.querySelector('.media-player-view-area');
    if (va) { va.style.opacity = '0'; this._timers.setTimeout(() => { this._renderActivePage(va, state.playerCfg, state); va.style.opacity = '1'; this._bindPlayerEvents(container, state.playerCfg, state); }, 80); }
  }

  // 保存媒体播放器状态
  _saveMediaPlayerState(state) { if (this._mediaPlayerState) { this._mediaPlayerState.activeTabIndex = state.activeTabIndex; this._mediaPlayerState.activePlaylistIndex = state.activePlaylistIndex; this._mediaPlayerState.activeItemIndex = state.activeItemIndex; } }

  // 保存当前播放项
  _saveCurrentPlayingItem(item) {
    if (item && this._mediaPlayerState) {
      this._mediaPlayerState.currentItem = { title: item.title || '', artist: item.artist || '', album: item.album || '', duration: item.duration || 0, id: item.id || null, media_content_id: item.media_content_id || item.url || '', media_type: item.media_type || 'music' };
      // 触发主卡片 re-render 以更新右侧显示
      if (this.requestUpdate) this.requestUpdate();
    }
  }

  // 解析媒体URL
  _resolveMediaUrl(item) {
    if (item.url) return item.url;
    let cid = item.media_content_id || '';
    if (!cid) return '';
    if (cid.startsWith('media-source://media_source/local/')) {
      const path = cid.replace('media-source://media_source/local/', '');
      try { return window.location.origin + '/media/local/' + path; } catch(e) { return cid; }
    }
    if (cid.startsWith('/media/local/')) {
      try { return window.location.origin + cid; } catch(e) { return cid; }
    }
    return cid;
  }

  // 播放媒体项
  async _playMediaItem(item, cfg, state) {
    if (!this._hass) return;
    // 本地播放列表：同步到后端 API（写入播放列表 / 更新播放状态）
    const tb = cfg?.tabs?.[state?.activeTabIndex];
    const pl = tb?.playlists?.[state?.activePlaylistIndex];
    const list = pl?.items || null;
    const idx = (state && list) ? state.activeItemIndex : -1;
    if (list && list.length) {
      const sig = list.map(it => it.media_content_id || it.uri || it.url || '').join('|');
      if (sig !== this._localPlaylistSignature) {
        await this._localEnterPlaylist(list, idx);
        this._localPlaylistSignature = sig;
        // 弹窗“播放列表”视图渲染的是 cfg.tabs（打开时的快照），而本地选择只更新了
        // _localPlaylist（内存+后端）。这里把 _localPlaylist 同步回 cfg.tabs 并重渲染弹窗，
        // 否则弹窗里的播放列表看起来“没更新”。
        if (state && cfg) {
          const tb = cfg.tabs?.[state.activeTabIndex];
          const pl = tb?.playlists?.[state.activePlaylistIndex];
          if (pl) {
            pl.items = this._localPlaylist.map(t => ({
              title: t.name, artist: t.artist,
              media_content_id: t.uri, uri: t.uri, url: t.uri,
              cover: t.image_url, cover_url: t.image_url,
              duration: t.duration, media_type: t.media_type,
            }));
            pl.name = pl.name || '本地播放列表';
          }
          if (state._popupContainer) this._rerenderCurrentView(state._popupContainer, cfg, state);
        }
      }
      await this._localPlayIndex(idx, cfg, state, false);
    }
    this._pauseOtherChannels();
    const te = this.xiaomiMiotEntity || cfg.mediaEntity;
    const playUrl = item.media_content_id || item.url || '';
    if (playUrl) this._hass.callService('media_player', 'play_media', { entity_id: te, media_content_id: playUrl, media_content_type: item.media_type || 'music' }).catch(() => {});
    this._saveMediaPlayerState(state); this._reportNowPlaying(cfg, state, item); this._saveCurrentPlayingItem(item, cfg, state);
    this._setChannel('local');
    this._overlayTitle = item.title || item.name || '';
    this._overlayArtist = item.artist || '';
    this._overlayCoverUrl = item.cover_url || item.cover || '';
    this._activeOverlaySource = 'local';
    this._localOverlay = { ...this._localOverlay, active: true };
    this._lastPlaySource = 'local';
    try { localStorage.setItem(this._getLastSourceKey(), 'local'); } catch(e) {}
    this.requestUpdate();
    if (state._closePopup) { state._closePopup(); }
  }

  _prevTrack(cfg, state, c) {
    console.log('[xiaoshi][prev] _prevTrack 点击 → 进入路由', { channel: this._activeChannel, localLen: (this._localPlaylist || []).length, curIdx: this._localCurrentIndex });
    this._routePrev();
    this.requestUpdate();
  }

  _nextTrack(cfg, state, c) {
    console.log('[xiaoshi][next] _nextTrack 点击 → 进入路由', { channel: this._activeChannel, localLen: (this._localPlaylist || []).length, curIdx: this._localCurrentIndex });
    this._routeNext();
    this.requestUpdate();
  }

  _togglePlayPause(entity) {
    this._routePlayPause();
    this.requestUpdate();
  }

  // 停止播放
  _stopMedia(entity) {
    if (this._isLocalActive() && this._localCurrentIndex >= 0) { this._localPause(); return; }
    if (!this._hass || !entity) return; this._hass.callService('media_player', 'media_pause', { entity_id: entity }).catch(() => {});
  }

  _setVolume(entity, level) { if (!this._hass || !entity) return; this._hass.callService('media_player', 'volume_set', { entity_id: entity, volume_level: Math.max(0, Math.min(1, level)) }).catch(() => {}); }

  // ═══════════════════════════════════════════
  // 本地播放 — 后端 API 同步 & 播放状态机
  // 播放状态：unplayed(未播放) / played(已播放) / playing(正在播放) / paused(暂停播放)
  // ═══════════════════════════════════════════

  // 本地播放媒体实体
  _localMediaEntity() {
    return (this._localMusicPlayerCfg && this._localMusicPlayerCfg.mediaEntity)
      || this.xiaomiMiotEntity || null;
  }

  // 从本地音乐 uri 中提取文件名（去掉目录与后缀），如 "歌曲.mp3" → "歌曲"
  _localFileName(uri) {
    if (!uri) return '';
    const raw = String(uri).split('/').pop().split('\\').pop() || '';
    const dot = raw.lastIndexOf('.');
    return dot > 0 ? raw.slice(0, dot) : raw;
  }

  // 模式判定：MA / 本地列表互斥
  //   本地列表有歌曲     → 本地模式；ma_playlist 有歌曲 → MA 模式；都为空 → 小米电台(miot)
  // 触发点：加载本地音乐→local；加载 MA/"我喜欢"→ma；清空列表 / 点电台按钮→miot（均清空两个列表）
  _isLocalActive() {
    return !!(this._localPlaylist && this._localPlaylist.length);
  }

  // MA 模式：ma_playlist 实际有歌曲，且本地列表为空（互斥）
  _isMaActive() {
    return !!(this._maPlaylistTracks && this._maPlaylistTracks.length) && !(this._localPlaylist && this._localPlaylist.length);
  }

  // 当前生效通道：以持久化模式(_activeChannel)为准（由 player_state API 在各触发点写入）：
  //   本地音乐加载 → local；MA 音乐/"我喜欢"加载 → ma；
  //   列表为空 / 清空列表 / 点电台按钮 → miot。
  // 仅当模式尚未显式设置时，回退到数据驱动判定（本地列表 > MA 列表 > miot）。
  _getEffectiveChannel() {
    if (this._activeChannel === 'local') return 'local';
    if (this._activeChannel === 'ma') return 'ma';
    if (this._activeChannel === 'miot') return 'miot';
    if (this._isLocalActive()) return 'local';
    if (this._isMaActive()) return 'ma';
    return 'miot';
  }

  // 本地播放 API 通用请求
  async _localApiCall(path, method, body) {
    const token = this._hass?.auth?.data?.access_token || '';
    if (!token) return null;
    try {
      const opts = {
        method: method || 'GET',
        headers: { Accept: 'application/json', Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        credentials: 'same-origin',
      };
      if (body) opts.body = JSON.stringify(body);
      const r = await fetch(`/api/xiaoshi/ma${path}`, opts);
      if (r.ok) return await r.json();
    } catch (e) {}
    return null;
  }

  // 当前播放器状态（模式）API 通用请求，复用 _localApiCall（/api/xiaoshi/ma 命名空间）
  // method: 'GET' | 'POST'；body: { media_player, mode }
  // GET 时把 media_player 拼到 query 上；POST 时放 body
  async _playerStateApiCall(method, body) {
    const isGet = (method || 'GET') === 'GET';
    if (isGet) {
      const mp = body && body.media_player;
      const q = mp ? `?media_player=${encodeURIComponent(mp)}` : '';
      return this._localApiCall(`/player_state${q}`, 'GET');
    }
    return this._localApiCall('/player_state', 'POST', body);
  }

  // 把当前通道/模式持久化到后端 player_state API（fire-and-forget）
  _persistPlayerMode(channel) {
    if (!this._hass) return;
    const mp = this._localMediaEntity();
    if (!mp) return;
    this._playerStateApiCall('POST', { media_player: mp, mode: channel }).catch(() => {});
  }


  async _fetchLocalPlaylist(mp) { return this._localApiCall(`/local_playlist?media_player=${encodeURIComponent(mp || '')}`, 'GET'); }
  async _setLocalPlaylist(mp, items) { return this._localApiCall('/local_playlist', 'POST', { media_player: mp, playlist: items }); }
  async _clearLocalPlaylist(mp) { return this._localApiCall('/local_playlist/clear', 'POST', { media_player: mp }); }
  // MA 播放列表写入/清空（同步到后端 ma_playlist_data，供模式推导使用）
  async _setMaPlaylistApi(mp, items, currentIndex) {
    const body = { media_player: mp, playlist: items || [] };
    if (typeof currentIndex === 'number') body.current_index = currentIndex;
    return this._localApiCall('/playlist', 'POST', body);
  }
  async _clearMaPlaylistApi(mp) { return this._localApiCall('/playlist', 'POST', { media_player: mp, playlist: [] }); }
  async _updateLocalStatus(mp, currentIndex, statuses) {
    const body = { media_player: mp };
    if (currentIndex !== undefined && currentIndex !== null) body.current_index = currentIndex;
    if (statuses) body.statuses = statuses;
    return this._localApiCall('/local_status', 'POST', body);
  }

  // 清空 MA 空播放列表（best-effort，仅 WS 可用时）
  async _clearLocalMaPlaylistTracks() {
    // 同步清空后端 ma_playlist_data（与本地 api 列表互斥：两者都空 → 小米电台模式）
    const mp = this._localMediaEntity();
    if (mp) { try { await this._clearMaPlaylistApi(mp); } catch (e) {} }
    if (!this.maPlaylist || !this._isMaWsReady()) return;
    try {
      if (this.maPlayerEntity && this._hass) {
        try { await this._hass.callService('media_player', 'media_stop', { entity_id: this.maPlayerEntity }); } catch (e) {}
      }
      const plId = (this.maPlaylist.match(/(\d+)$/) || [])[0] || this.maPlaylist;
      const existing = await this._maWsSendAndWait('music/playlists/playlist_tracks', { item_id: String(plId), provider_instance_id_or_domain: 'library', force_refresh: false, allow_dynamic_tracks: false });
      const oldTracks = Array.isArray(existing) ? existing : (existing?.items || []);
      if (oldTracks.length > 0) {
        await this._maWsSendAndWait('music/playlists/remove_playlist_tracks', { db_playlist_id: String(plId), positions_to_remove: oldTracks.map((_, i) => i) });
      }
    } catch (e) {}
  }

  // 进入本地播放列表：清空主播放列表 + 清空 MA 列表 + 写入 API
  async _localEnterPlaylist(items, index) {
    const mp = this._localMediaEntity();
    // 1、2：清空主播放列表 / MA 列表
    this._currentPlaylistData = null;
    await this._clearLocalMaPlaylistTracks();
    // 3：将本地播放内容写入 API
    const norm = (items || []).map(it => ({
      name: it.title || it.name || '',
      artist: it.artist || '',
      uri: it.media_content_id || it.uri || it.url || '',
      duration: it.duration || 0,
      image_url: it.cover_url || it.cover || it.image_url || '',
      media_type: it.media_type || 'music',
    })).filter(it => it.uri);
    this._localPlaylist = norm;
    this._localStatuses = norm.map(() => 'unplayed');
    this._localCurrentIndex = -1;
    if (norm.length) {
      // 1、清空本地播放 API 记录（POST 直接覆盖），再写入新内容，避免旧列表残留
      await this._clearLocalPlaylist(mp);
      await this._setLocalPlaylist(mp, norm);
    } else {
      await this._clearLocalPlaylist(mp);
    }
    if (index >= 0 && index < norm.length) {
      this._localStatuses[index] = 'playing';
      this._localCurrentIndex = index;
      await this._updateLocalStatus(mp, index, { [index]: 'playing' });
    }
    this.requestUpdate();
  }

  // 本地音乐：点击“播放列表”按钮/卡片，走完整流程
  // 清空 ma_playlist → 清空本地播放 api → 写入本地播放 api → 刷新 UI → 播放第一首
  async _enterLocalPlaylist(items, pl, plIdx, cfg, state, container) {
    if (!items || !items.length) return;
    state.activePlaylistIndex = plIdx;
    state.activeItemIndex = 0;
    // 歌词/播放列表视图切到 playlist
    this._showPlaylist = true;
    this._updateViewMode('playlist');
    this.requestUpdate();
    // 1~3：清空 ma_playlist + 清空本地播放 api + 写入本地播放 api（先清后写）
    await this._localEnterPlaylist(items, 0);
    this._localPlaylistSignature = items.map(it => it.media_content_id || it.uri || it.url || '').join('|');
    // 4：更新播放列表显示 —— 把 _localPlaylist 同步回弹窗 cfg.tabs，并重渲染弹窗与主卡
    const tb = cfg?.tabs?.[state.activeTabIndex];
    const p = tb?.playlists?.[plIdx];
    if (p) {
      p.items = this._localPlaylist.map(t => ({
        title: t.name, artist: t.artist,
        media_content_id: t.uri, uri: t.uri, url: t.uri,
        cover: t.image_url, cover_url: t.image_url,
        duration: t.duration, media_type: t.media_type,
      }));
      p.name = p.name || '本地播放列表';
    }
    if (container) this._rerenderCurrentView(container, cfg, state);
    this.requestUpdate();
    // 5：推送 miot play_media，连第一首一起播起来
    await this._playMediaItem(items[0], cfg, state, container);
  }

  // 全部重置为未播放（内存 + 后端）
  _localResetStatuses() {
    if (!this._localStatuses) return;
    this._localStatuses = this._localStatuses.map(() => 'unplayed');
    const mp = this._localMediaEntity();
    if (mp) {
      const s = {};
      this._localStatuses.forEach((_, i) => { s[i] = 'unplayed'; });
      this._updateLocalStatus(mp, undefined, s);
    }
  }

  // 随机模式：从未播放(unplayed)中随机取一首；若全部播放过则重置为未播放再随机
  _localRandomIndex() {
    const len = (this._localPlaylist || []).length;
    if (len === 0) return -1;
    const statuses = this._localStatuses || [];
    const unplayed = [];
    for (let i = 0; i < len; i++) if (statuses[i] === 'unplayed') unplayed.push(i);
    if (unplayed.length === 0) {
      this._localResetStatuses(); // 全部播放过 → 重置为未播放
      return Math.floor(Math.random() * len);
    }
    return unplayed[Math.floor(Math.random() * unplayed.length)];
  }

  // 计算下一首索引：随机模式走随机；顺序模式正常下一首，全部播放过则重置后续播
  _localNextIndex() {
    const len = (this._localPlaylist || []).length;
    if (len === 0) return -1;
    if (this._repeatMode === 'random') return this._localRandomIndex();
    if (this._repeatMode === 'repeat_one') return this._localCurrentIndex >= 0 ? this._localCurrentIndex : 0;
    const statuses = this._localStatuses || [];
    const allUnplayed = statuses.length === len && statuses.every(s => s === 'unplayed');
    if (allUnplayed) return 0;
    const cur = this._localCurrentIndex;
    let next = (cur < 0 ? -1 : cur) + 1;
    if (next >= len) {
      const allPlayed = statuses.length === len && statuses.every(s => s === 'played' || s === 'playing');
      if (allPlayed) {
        this._localResetStatuses(); // 全部播放过 → 重置为未播放再播下一首
        next = (cur < 0 ? -1 : cur) + 1;
      } else {
        next = 0;
      }
      if (next >= len) next = 0;
    }
    return next;
  }

  // 计算上一首索引：随机模式走随机；顺序模式正常上一首，全部播放过则重置后播上一首
  _localPrevIndex() {
    const len = (this._localPlaylist || []).length;
    if (len === 0) return -1;
    if (this._repeatMode === 'random') return this._localRandomIndex();
    if (this._repeatMode === 'repeat_one') return this._localCurrentIndex >= 0 ? this._localCurrentIndex : 0;
    const statuses = this._localStatuses || [];
    const allUnplayed = statuses.length === len && statuses.every(s => s === 'unplayed');
    if (allUnplayed) return 0;
    const cur = this._localCurrentIndex;
    let prev = (cur < 0 ? 0 : cur) - 1;
    if (prev < 0) {
      const allPlayed = statuses.length === len && statuses.every(s => s === 'played' || s === 'playing');
      if (allPlayed) {
        this._localResetStatuses(); // 全部播放过 → 重置为未播放再播上一首
        prev = (cur < 0 ? 0 : cur) - 1;
      } else {
        prev = len - 1;
      }
      if (prev < 0) prev = len - 1;
    }
    return prev;
  }

  // 切换/播放指定索引（doPlay=true 时实际调用 HA play_media）
  async _localPlayIndex(index, cfg, state, doPlay) {
    const len = (this._localPlaylist || []).length;
    if (index < 0 || index >= len) { console.log('[xiaoshi][play] _localPlayIndex 越界退出', { index, len }); return; }
    const mp = this._localMediaEntity();
    console.log('[xiaoshi][play] _localPlayIndex', { index, len, doPlay, mediaEntity: mp, uri: this._localPlaylist[index]?.uri });
    const statuses = {};
    if (this._localCurrentIndex >= 0 && this._localCurrentIndex !== index) {
      statuses[this._localCurrentIndex] = 'played';
      this._localStatuses[this._localCurrentIndex] = 'played';
    }
    this._localStatuses[index] = 'playing';
    this._localCurrentIndex = index;
    statuses[index] = 'playing';
    await this._updateLocalStatus(mp, index, statuses);
    if (doPlay) {
      const item = this._localPlaylist[index];
      this._pauseOtherChannels();
      const te = this._localMediaEntity();
      if (te && item && item.uri && this._hass) {
        this._hass.callService('media_player', 'play_media', { entity_id: te, media_content_id: item.uri, media_content_type: item.media_type || 'music' }).catch(() => {});
      }
      this._setChannel('local');
      this._lastPlaySource = 'local';
      try { localStorage.setItem(this._getLastSourceKey(), 'local'); } catch (e) {}
      // 本地通过 mito 实体播放
      this._syncOtherEntityStatus('local');
    }
    if (state) state.activeItemIndex = index;
    this.requestUpdate();
  }

  async _localNext(cfg, state, container) {
    console.log('[xiaoshi][next] _localNext 入口', { isLocalActive: this._isLocalActive(), localLen: (this._localPlaylist || []).length, playIndex: this._localCurrentIndex });
    if (!this._isLocalActive() || !(this._localPlaylist || []).length) { console.log('[xiaoshi][next] _localNext 退出：非本地或无列表'); return false; }
    const idx = this._localNextIndex();
    console.log('[xiaoshi][next] _localNext 计算目标 idx =', idx);
    if (idx < 0) { console.log('[xiaoshi][next] _localNext 退出：idx<0'); return false; }
    await this._localPlayIndex(idx, cfg, state, true);
    console.log('[xiaoshi][next] _localNext 完成');
    return true;
  }

  async _localPrev(cfg, state, container) {
    console.log('[xiaoshi][prev] _localPrev 入口', { isLocalActive: this._isLocalActive(), localLen: (this._localPlaylist || []).length, playIndex: this._localCurrentIndex });
    if (!this._isLocalActive() || !(this._localPlaylist || []).length) { console.log('[xiaoshi][prev] _localPrev 退出：非本地或无列表'); return false; }
    const idx = this._localPrevIndex();
    console.log('[xiaoshi][prev] _localPrev 计算目标 idx =', idx);
    if (idx < 0) { console.log('[xiaoshi][prev] _localPrev 退出：idx<0'); return false; }
    await this._localPlayIndex(idx, cfg, state, true);
    console.log('[xiaoshi][prev] _localPrev 完成');
    return true;
  }

  // 暂停：暂停播放，保留状态供下次继续
  async _localPause() {
    const mp = this._localMediaEntity();
    const idx = this._localCurrentIndex;
    if (idx >= 0) {
      this._localStatuses[idx] = 'paused';
      await this._updateLocalStatus(mp, undefined, { [idx]: 'paused' });
    }
    const te = this._localMediaEntity();
    if (te && this._hass) this._hass.callService('media_player', 'media_pause', { entity_id: te }).catch(() => {});
    this.requestUpdate();
  }

  // 继续：恢复正在/暂停播放
  async _localResume() {
    const mp = this._localMediaEntity();
    const idx = this._localCurrentIndex;
    if (idx < 0) return;
    const item = this._localPlaylist[idx];
    this._localStatuses[idx] = 'playing';
    await this._updateLocalStatus(mp, idx, { [idx]: 'playing' });
    const te = this._localMediaEntity();
    if (te && item && item.uri && this._hass) {
      this._hass.callService('media_player', 'play_media', { entity_id: te, media_content_id: item.uri, media_content_type: item.media_type || 'music' }).catch(() => {});
    }
    this._setChannel('local');
    this._syncOtherEntityStatus('local');
    this.requestUpdate();
  }

  // 点击本地播放列表中的曲目
  async _playLocalPlaylistTrack(track) {
    const uri = track?.uri || track?.track_id || track?.media_content_id || '';
    const idx = (this._localPlaylist || []).findIndex(t => (t.uri || '') === uri);
    if (idx < 0) return;
    await this._localPlayIndex(idx, null, null, true);
  }

  // 本地播放 播放/暂停 切换
  async _localTogglePlayPause() {
    const te = this._localMediaEntity();
    const s = this._hass?.states?.[te];
    const playing = s?.state === 'playing';
    if (playing) await this._localPause();
    else await this._localResume();
  }

  // ═══════════════════════════════════════════
  // MA 播放 — 后端 WS 推送 & 播放状态机
  // ═══════════════════════════════════════════

  // 当前 MA 播放列表（来自 _currentPlaylistData.playlist，即 ma_playlist 内容）
  _maTracks() {
    return (this._currentPlaylistData && this._currentPlaylistData.playlist) || [];
  }

  // 确保 MA WS / 队列已就绪
  async _ensureMaReady() {
    if (!this._isMaWsReady()) {
      this._connectMaWs();
      for (let w = 0; w < 50 && !this._isMaWsReady(); w++) await new Promise(r => setTimeout(r, 100));
    }
    if (this._isMaWsReady() && !this._maQueueId) {
      this._subscribeMaQueue();
      for (let w = 0; w < 20 && !this._maQueueId; w++) await new Promise(r => setTimeout(r, 200));
    }
    return this._isMaWsReady() && !!this._maQueueId;
  }

  // 推送到 MA 播放服务：播放指定索引的曲目（替换队列并立即播放）
  async _maPlayIndex(idx) {
    const tracks = this._maTracks();
    if (idx < 0 || idx >= tracks.length) return false;
    const t = tracks[idx];
    const uri = t.uri || t.track_id || '';
    if (!uri) return false;
    // 维护逐曲播放状态：上一首置为已播放，当前置为播放中
    if (!this._maStatuses || this._maStatuses.length !== tracks.length) {
      this._maStatuses = tracks.map(() => 'unplayed');
    }
    if (this._maPlayingIndex >= 0 && this._maPlayingIndex !== idx && this._maStatuses[this._maPlayingIndex] !== undefined) {
      this._maStatuses[this._maPlayingIndex] = 'played';
    }
    // 立即从列表数据填充当前曲目信息（不等 WS 回传，避免 miot实体短暂显示旧信息）
    this._maTrackName = t.name || t.title || t.track_name || '';
    this._maTrackArtist = t.artist || '';
    this._maCoverUrl = t.image_url || t.cover || t.image || '';
    this._maDuration = parseFloat(t.duration || 0) || 0;
    if (!(await this._ensureMaReady())) return false;
    try {
      this._maWsSend('player_queues/play', { queue_id: this._maQueueId, uri, enqueue_option: 'play' });
      this._maPlayingIndex = idx;
      this._maExpectingEnd = true; // 已推送单首：曲终时由前端向后端取下一首再推送
      this._maStatuses[idx] = 'playing';
      this._syncOtherEntityStatus('ma');
      this.requestUpdate();
      return true;
    } catch (e) { return false; }
  }

  // MA 随机：从未播放中随机；全部播放过则重置再随机
  _maRandomIndex() {
    const len = (this._maTracks() || []).length;
    if (len === 0) return -1;
    if (!this._maStatuses || this._maStatuses.length !== len) this._maStatuses = Array(len).fill('unplayed');
    const unplayed = [];
    for (let i = 0; i < len; i++) if (this._maStatuses[i] === 'unplayed') unplayed.push(i);
    if (unplayed.length === 0) {
      this._maResetStatuses();
      return Math.floor(Math.random() * len);
    }
    return unplayed[Math.floor(Math.random() * unplayed.length)];
  }

  _maAllPlayed() {
    const s = this._maStatuses || [];
    const len = (this._maTracks() || []).length;
    return len > 0 && s.length === len && s.every(x => x === 'played' || x === 'playing');
  }

  _maResetStatuses() {
    const len = (this._maTracks() || []).length;
    this._maStatuses = Array(len).fill('unplayed');
  }

  // 调用后端切歌控制接口，由后端计算下一首/上一首/指定曲目并返回 track + current_index
  async _maControlApi(action, index) {
    const mp = this._localMediaEntity();
    if (!mp) return null;
    try {
      const body = { media_player: mp, action };
      if (typeof index === 'number') body.index = index;
      const data = await this._localApiCall('/playlist/control', 'POST', body);
      if (data && typeof data.current_index === 'number' && data.current_index >= 0 && data.track) {
        return { current_index: data.current_index, track: data.track };
      }
      return { current_index: -1, track: null };
    } catch (e) { return null; }
  }

  // 把后端返回的曲目应用到内存播放列表并单首推送到 MA
  async _maApplyControlled(res) {
    const idx = res.current_index;
    const t = res.track;
    if (t && this._currentPlaylistData && Array.isArray(this._currentPlaylistData.playlist) && this._currentPlaylistData.playlist[idx]) {
      const p = this._currentPlaylistData.playlist;
      p[idx] = {
        name: t.name || t.title || '',
        artist: t.artist || '',
        uri: t.uri || '',
        album: t.album || '',
        image_url: t.image_url || t.cover || '',
        track_id: t.track_id || t.uri || '',
        duration: t.duration || 0,
      };
    }
    return this._maPlayIndex(idx);
  }

  async _maNext() {
    const res = await this._maControlApi('next');
    if (!res || res.current_index < 0) { this._maPlayingIndex = -1; this._maExpectingEnd = false; return false; }
    return this._maApplyControlled(res);
  }

  async _maPrev() {
    const res = await this._maControlApi('prev');
    if (!res || res.current_index < 0) { this._maPlayingIndex = -1; this._maExpectingEnd = false; return false; }
    return this._maApplyControlled(res);
  }

  // 曲终自动切下一首（来源：MA 队列 current_item 变空）
  async _maAutoNext() {
    try { await this._maNext(); } catch (e) {}
  }

  // MA 暂停：暂停 MA 队列播放（保留进度，供继续）
  async _maPause() {
    if (this._isMaWsReady() && this._maQueueId) {
      try { this._maWsSend('player_queues/pause', { queue_id: this._maQueueId }); } catch (e) {}
    }
    this.requestUpdate();
  }

  // MA 继续：重新推送当前曲目到 MA 播放服务
  async _maResume() {
    const idx = this._maPlayingIndex >= 0 ? this._maPlayingIndex : 0;
    return this._maPlayIndex(idx);
  }

  async _maTogglePlayPause() {
    const playing = this._hass?.states?.[this.maPlayerEntity]?.state === 'playing' || this.isPlaying;
    if (playing) await this._maPause();
    else await this._maResume();
  }

  // ═══════════════════════════════════════════
  // 统一 3 模式路由：上一首 / 下一首 / 播放暂停
  // 通道：'ma' = MA播放，'local' = 本地播放，'miot' = 小米电台
  // ═══════════════════════════════════════════

  // 播放列表为空时，即视为"小米电台模式"：上一首/下一首/播放/暂停
  // 直接调用 HA 的 media_player 服务作用于 miot 实体。
  // 数据驱动：本地列表为空 且 MA 列表为空 → 小米电台模式；否则不是。
  _isRadioByEmptyPlaylist() {
    const localEmpty = !(this._localPlaylist && this._localPlaylist.length);
    if (!localEmpty) return false;
    const maEmpty = !this.maPlaylist;
    return maEmpty;
  }

  // 电台模式（含空列表电台）：主动轮询 miot 实体，立即刷新歌曲信息
  // （标题/演唱者/封面）与歌词。先对齐显示通道到 miot，使显示层读取 _miotOverlay。
  _refreshMiotNowPlaying() {
    const ent = this.xiaomiMiotEntity;
    if (!ent || !this._hass) return;
    const MIOT_FAKE = new Set(['请欣赏', '请欣赏（音乐）', '暂无播放', '正在加载', 'QQ音乐', '无音乐播放']);
    // 记录动作前的歌名为"过期基线"：切歌后实体 media_title 会瞬时闪回上一首，
    // 任何等于该基线的回潮都忽略，只接受不同的新歌名，避免显示又切回旧信息。
    this._miotStaleTitle = this._miotOverlay.title || '';
    this._setChannel('miot');
    this.requestUpdate();
    [200, 600, 1200, 2000, 3500, 6000].forEach((delay) => {
      setTimeout(() => {
        if (!this._hass) return;
        const st = this._hass.states[ent];
        if (!st) return;
        const a = st.attributes || {};
        const mt = a.media_title || '';
        const cover = a.entity_picture || a.media_image_url || '';
        if (st.state === 'playing' && mt && !MIOT_FAKE.has(mt) && mt !== this._miotStaleTitle) {
          this._miotOverlay = {
            title: mt,
            artist: a.media_artist || '',
            coverUrl: cover,
            source: 'miot',
            active: true,
          };
          if (this.showLyrics) this.loadLyricsForCurrentSong();
        } else if (st.state !== 'playing') {
          // 暂停/停止：保留歌名与封面，仅标记未激活
          this._miotOverlay = {
            ...this._miotOverlay,
            source: 'miot',
            active: false,
            coverUrl: cover || this._miotOverlay.coverUrl,
          };
        }
        this.requestUpdate();
      }, delay);
    });
  }

  async _routePrev() {
    const ch = this._getEffectiveChannel();
    console.log('[xiaoshi][prev] _routePrev', { channel: ch, localLen: (this._localPlaylist || []).length, maPlaylist: !!this.maPlaylist });
    // 本地音乐模式：直接通过本地播放列表计算上一首并播放，绝不调用 HA 的 media_previous_track 服务
    if (ch === 'local') {
      console.log('[xiaoshi][prev] → 走本地 _localPrev');
      await this._localPrev();
      return;
    }
    // MA 模式：走 MA 自身队列控制上一首
    if (ch === 'ma') {
      console.log('[xiaoshi][prev] → 走 MA _maPrev');
      await this._maPrev();
      return;
    }
    // 小米电台模式：调用 HA media_previous_track 服务作用于 miot 实体
    console.log('[xiaoshi][prev] → 小米电台模式 media_previous_track');
    const te = this.xiaomiMiotEntity;
    if (te) this._hass.callService('media_player', 'media_previous_track', { entity_id: te }).catch(() => {});
    this._refreshMiotNowPlaying();
  }

  async _routeNext() {
    const ch = this._getEffectiveChannel();
    console.log('[xiaoshi][next] _routeNext', { channel: ch, localLen: (this._localPlaylist || []).length, maPlaylist: !!this.maPlaylist });
    // 本地音乐模式：直接通过本地播放列表计算下一首并播放，绝不调用 HA 的 media_next_track 服务
    if (ch === 'local') {
      console.log('[xiaoshi][next] → 走本地 _localNext');
      await this._localNext();
      return;
    }
    // MA 模式：走 MA 自身队列控制下一首
    if (ch === 'ma') {
      console.log('[xiaoshi][next] → 走 MA _maNext');
      await this._maNext();
      return;
    }
    // 小米电台模式：调用 HA media_next_track 服务作用于 miot 实体
    console.log('[xiaoshi][next] → 小米电台模式 media_next_track');
    const te = this.xiaomiMiotEntity;
    if (te) this._hass.callService('media_player', 'media_next_track', { entity_id: te }).catch(() => {});
    this._refreshMiotNowPlaying();
  }

  async _routePlayPause() {
    const ch = this._getEffectiveChannel();
    if (ch === 'local') { await this._localTogglePlayPause(); return; }
    if (ch === 'ma') { await this._maTogglePlayPause(); return; }
    // 小米电台模式：调用 HA media_player 服务控制播放/暂停（作用于电台播放实体）
    const te = this.xiaomiMiotEntity;
    if (!te) return;
    const s = this._hass?.states?.[te];
    if (s?.state === 'playing') {
      this._hass.callService('media_player', 'media_pause', { entity_id: te }).catch(() => {});
    } else {
      this._hass.callService('media_player', 'media_play', { entity_id: te }).catch(() => {});
    }
    this._refreshMiotNowPlaying();
  }

  // 进入某模式后，把当前曲目信息镜像写入"另一个"实体（mito），
  // 解决：MA 播放时 ma 实体信息正确，但 mito实体仍显示旧的
  // 错误信息（如"心灵之谜"）。
  // 模式 -> 需要同步的目标实体：
  //   ma    -> 更新 mito 实体（不是 MA 播放目标）
  //   miot  -> 更新 mito 实体（电台通过 mito 实体播放）
  _syncOtherEntityStatus(mode) {
    const targets = [];
    if (mode === 'ma') {
      if (this.xiaomiMiotEntity) targets.push(this.xiaomiMiotEntity);
    } else if (mode === 'local') {
      // 本地通过 miot 实体播放；同时把 ma 实体也镜像成本地文件名，避免残留旧歌信息
      if (this.xiaomiMiotEntity) targets.push(this.xiaomiMiotEntity);
      if (this.maPlayerEntity) targets.push(this.maPlayerEntity);
      const lItem = (this._localPlaylist || [])[this._localCurrentIndex];
      const lName = this._localFileName(lItem?.uri);
      this._localOverlay = {
        title: lName,
        artist: '',
        coverUrl: '',
        source: 'local',
        active: true,
      };
    } else if (mode === 'miot') {
      // 电台通过 miot 实体播放
      if (this.xiaomiMiotEntity) targets.push(this.xiaomiMiotEntity);
    }
    if (!targets.length) { this.requestUpdate(); return; }
    const info = this._currentNowPlayingInfo(mode);
    if (!info || (!info.title && !info.artist)) { this.requestUpdate(); return; }
    for (const t of targets) this._syncEntityNowPlaying(t, info);
    this.requestUpdate();
  }

  // 收集当前模式下正在播放的曲目信息
  _currentNowPlayingInfo(mode) {
    if (mode === 'ma') {
      return {
        title: this._maTrackName || '',
        artist: this._maTrackArtist || '',
        cover: this._maCoverUrl || '',
        duration: this._maDuration || 0,
      };
    }
    if (mode === 'local') {
      const item = (this._localPlaylist || [])[this._localCurrentIndex];
      // 本地音乐：title 用文件名（去后缀），artist / 封面一律清空
      const fname = this._localFileName(item?.uri);
      return {
        title: fname,
        artist: '',
        cover: '',
        duration: parseFloat(item?.duration || 0) || 0,
      };
    }
    if (mode === 'miot') {
      const ov = this._miotOverlay || {};
      return {
        title: ov.title || '',
        artist: ov.artist || '',
        cover: ov.coverUrl || '',
        duration: 0,
      };
    }
    return null;
  }

  // 调用后端端点，把正在播放信息写入目标实体
  _syncEntityNowPlaying(entityId, info) {
    if (!entityId) return;
    this._localApiCall('/sync_now_playing', 'POST', {
      entity_id: entityId,
      media_title: info.title || '',
      media_artist: info.artist || '',
      entity_picture: info.cover || '',
      media_duration: info.duration || 0,
    }).catch(() => {});
  }

  // 刷新播放器 UI
  _refreshPlayerUI(container, cfg, state) {
    if (!container || !this._hass) return; const es = this._hass.states?.[cfg.mediaEntity]; if (!es) return;
    const ci = this._getCurrentPlayingItem(cfg, state); const ip = es.state === 'playing';
    const cu = this._resolveCoverUrl(cfg, state, ci, es);
    const title = ci?.title || es.attributes?.media_title || ''; const artist = ci?.artist || es.attributes?.media_artist || '';
    const album = ci?.album || es.attributes?.media_album_name || ''; const dur = ci?.duration || es.attributes?.media_duration || 0;
    if (state._localPosition === undefined) { state._localPosition = this._calcRealPosition(es); state._lastEntityPosition = es.attributes?.media_position || 0; state._lastEntityDuration = es.attributes?.media_duration || 0; }
    const pos = state._localPosition; const volLevel = es.attributes?.volume_level || 0; const volPct = Math.round(volLevel * 100);
    const edur = es.attributes?.media_duration || 0;
    if (state._lastEntityDuration !== edur && edur > 0) { state._lastEntityDuration = edur; state._localPosition = this._calcRealPosition(es); state._lastEntityPosition = es.attributes?.media_position || 0; }
    if (state._bgLayerA && state._bgLayerB && cu && cu !== state._bgCurrentUrl) { state._bgCurrentUrl = cu; const al = state._bgActiveLayer === 'a' ? state._bgLayerA : state._bgLayerB; const il = state._bgActiveLayer === 'a' ? state._bgLayerB : state._bgLayerA; const pi = new Image(); pi.onload = () => { if (state._bgCurrentUrl !== cu) return; il.src = cu; requestAnimationFrame(() => { il.style.opacity = '1'; al.style.opacity = '0'; }); state._bgActiveLayer = state._bgActiveLayer === 'a' ? 'b' : 'a'; }; pi.src = cu; }
    const cov = container.querySelector('img[data-cover-target="true"]'); const csid = ci?.id ? String(ci.id) : '';
    if (cov) { if (cu) { if (cov.dataset.coverSongId !== csid) { cov.dataset.coverSongId = csid; cov.src = cu; } cov.style.display = 'block'; } else { cov.dataset.coverSongId = ''; cov.style.display = 'none'; } }
    const te = container.querySelector('[data-meta="title"]'); if (te) te.textContent = title || '未在播放';
    const ae = container.querySelector('[data-meta="artist"]'); if (ae) { ae.textContent = [artist, album].filter(Boolean).join(' · ') || (ip ? '正在播放' : '已暂停'); }
    const fe = container.querySelector('[data-meta="filename"]'); if (fe) { const fn = ci?.media_content_id ? ci.media_content_id.split('/').pop().split('\\\\').pop() : ''; if (fn) { fe.textContent = fn; fe.style.display = 'block'; } else fe.style.display = 'none'; }
    const pct = dur > 0 ? Math.min((pos / dur) * 100, 100) : 0;
    const fl = container.querySelector('[data-progress-fill]'); if (fl) fl.style.width = pct + '%';
    const po = container.querySelector('[data-meta="position"]'); if (po) po.textContent = this._formatMediaTime(pos);
    const du = container.querySelector('[data-meta="duration"]'); if (du) du.textContent = this._formatMediaTime(dur);
    const pi2 = container.querySelector('[data-action="play-pause"] ha-icon'); if (pi2) pi2.setAttribute('icon', ip ? 'mdi:pause' : 'mdi:play');
    const vs = container.querySelector('[data-action="volume"]'); if (vs && parseInt(vs.value) !== volPct) { vs.value = volPct; vs.style.background = 'linear-gradient(to right,var(--b-accent,#3498db) 0%,var(--b-accent,#3498db) ' + volPct + '%,var(--b-slider,rgba(0,0,0,0.08)) ' + volPct + '%,var(--b-slider,rgba(0,0,0,0.08)) 100%)'; }
    const vl = container.querySelector('[data-volume-label]'); if (vl) vl.textContent = volPct + '%';
    const vi2 = container.querySelector('[data-mute-toggle]'); if (vi2) vi2.setAttribute('icon', volPct === 0 ? 'mdi:volume-off' : volPct < 50 ? 'mdi:volume-low' : 'mdi:volume-high');
    const ph = container.querySelectorAll('.media-player-playlist-header'); ph.forEach(cd => { const pi3 = parseInt(cd.dataset.playlistIndex); const isa = pi3 === state.activePlaylistIndex && state.activeItemIndex >= 0; const ico = cd.querySelector('ha-icon'); if (ico) ico.style.color = isa ? 'var(--b-accent,#3498db)' : 'var(--b-icon,#555)'; });
    const si = container.querySelectorAll('.media-player-item'); si.forEach(ie => { const ii = parseInt(ie.dataset.itemIndex); const isc = state.activeItemIndex === ii; ie.style.background = isc ? 'var(--b-btnBg,rgba(0,0,0,0.06))' : 'transparent'; const sp = ie.querySelector('span'); if (sp) sp.style.color = isc ? 'var(--b-accent,#3498db)' : 'var(--room-secondary-text,#ccc)'; });
  }

  // 启动播放器刷新定时器
  _startPlayerRefreshInterval(container, cfg, state) {
    if (this._mediaPlayerRefreshTimer) this._timers.clearTimeout(this._mediaPlayerRefreshTimer);
    let tc = 0;
    const tick = () => { if (!container?.isConnected || state._cleanup) return; const es = this._hass?.states?.[cfg.mediaEntity]; const ip = es?.state === 'playing'; const dur = state._lastEntityDuration || es?.attributes?.media_duration || 0; tc++; if (tc % 5 === 0 && es) { const rp = this._calcRealPosition(es); if (Math.abs((state._localPosition || 0) - rp) > 2) state._localPosition = rp; state._lastEntityPosition = es.attributes?.media_position || 0; } else if (ip) state._localPosition = Math.min((state._localPosition || 0) + 1, dur || 999999); this._refreshPlayerUI(container, cfg, state); this._mediaPlayerRefreshTimer = this._timers.setTimeout(tick, 1000); };
    this._mediaPlayerRefreshTimer = this._timers.setTimeout(tick, 1000);
  }

  // 获取当前播放项目
  _getCurrentPlayingItem(cfg, state) {
    if (state.activeItemIndex >= 0 && state.activePlaylistIndex >= 0) { const t = cfg.tabs?.[state.activeTabIndex]; const p = t?.playlists?.[state.activePlaylistIndex]; if (p?.items?.[state.activeItemIndex]) return p.items[state.activeItemIndex]; }
    const es = this._hass?.states?.[cfg.mediaEntity]; const ci = es?.attributes?.media_content_id || '';
    if (ci) { for (const t of (cfg.tabs || [])) for (const p of (t?.playlists || [])) if (Array.isArray(p.items)) for (const i of p.items) if (i.media_content_id === ci) return i; }
    const ed = es?.attributes?.media_duration || 0;
    if (ed > 0) { for (const t of (cfg.tabs || [])) for (const p of (t?.playlists || [])) if (Array.isArray(p.items)) for (const i of p.items) if (i.duration && Math.abs(i.duration - ed) < 1) return i; }
    return null;
  }

  // 解析封面 URL
  _resolveCoverUrl() { return ''; }

  // 解析歌词
  _parseLrcLyrics(raw) {
    if (!raw?.trim()) return { timed: false, lines: [] }; const text = raw.replace(/\r/g, '');
    const re = /\[(\d{1,2}):(\d{1,2})(?:[.:](\d{1,3}))?\]/g; if (!re.test(text)) { re.lastIndex = 0; const ls = text.split('\n').map(l => l.trim()).filter(Boolean); return { timed: false, lines: ls.map(l => ({ time: -1, text: l })) }; }
    re.lastIndex = 0; const lines = [];
    text.split('\n').forEach(line => { const times = []; let m; const lr = /\[(\d{1,2}):(\d{1,2})(?:[.:](\d{1,3}))?\]/g; while ((m = lr.exec(line)) !== null) { times.push((parseInt(m[1])||0)*60 + (parseInt(m[2])||0) + (m[3] ? parseInt(m[3].padEnd(3,'0')) : 0)/1000); } const lt = line.replace(lr, '').trim(); if (times.length === 0) return; times.forEach(t => lines.push({ time: t, text: lt })); });
    lines.sort((a, b) => a.time - b.time); return { timed: true, lines };
  }

  // 切换歌词布局
  _switchLyricsLayout(container, state, hasLyrics) {
    const ts = state._topSection || container.querySelector('[data-mode]'); if (!ts) return;
    const hr = ts.children[0]; const cb = ts.querySelector('[data-cover-target]')?.parentElement; const md = ts.querySelector('[data-meta="title"]')?.parentElement; const lw = state._lyricsWrap;
    if (hasLyrics) { ts.dataset.mode = 'lyrics'; if (hr) { hr.style.flexDirection = 'row'; hr.style.alignItems = 'center'; } if (cb) { cb.style.width = '60px'; cb.style.height = '60px'; cb.style.borderRadius = '10px'; } if (md) { md.style.textAlign = 'left'; } if (lw) lw.style.display = 'block'; }
    else { ts.dataset.mode = 'vertical'; if (hr) { hr.style.flexDirection = 'column'; hr.style.alignItems = 'center'; } if (cb) { cb.style.width = '260px'; cb.style.height = '260px'; cb.style.borderRadius = '16px'; } if (md) { md.style.textAlign = 'center'; } if (lw) lw.style.display = 'none'; }
  }

  // 获取播放列表
  async _fetchPlaylists() { try { const paths = (this._config?.local_music_path || '').split('\n').map(p => p.trim()).filter(p => p); if (paths.length === 0) { const pls = []; await this._collectPlaylists('', pls); return pls.filter(p => p.items.length > 0); } const all = []; for (const path of paths) { const pls = []; await this._collectPlaylists(path, pls); all.push(pls.filter(p => p.items.length > 0)); } return all.flat(); } catch(e) { return []; } }

  // 收集播放列表
  async _collectPlaylists(mediaContentId, pls) {
    const result = await this._browseMediaSource(mediaContentId).catch(() => ({children:[]}));
    const children = result.children || [];
    const directFiles = [];
    for (const c of children) {
      if (c.can_expand) {
        await this._collectPlaylists(c.media_content_id, pls);
      } else if (this._isAudioFile(c)) {
        directFiles.push({ title: c.title, artist: '', media_content_id: c.media_content_id, media_type: c.media_content_type || 'music', cover_url: c.thumbnail || '' });
      }
    }
    if (directFiles.length > 0) pls.push({ id: mediaContentId, name: this._getFolderName(mediaContentId), items: directFiles });
  }

  // 获取文件夹名称
  _getFolderName(mediaContentId) {
    const parts = mediaContentId.split('/'); return parts[parts.length - 1] || parts[parts.length - 2] || '本地音乐';
  }

  // 是否为音频文件
  _isAudioFile(c) {
    const name = (c.title || c.name || '').toLowerCase();
    const ext = name.split('.').pop();
    const audioExts = ['mp3','flac','wav','ogg','m4a','wma','aac','opus','ape','aiff','dsf','dff','wv','alac','ac3','dts','m4b','mid','midi','ra','spx','tta','cda'];
    if (audioExts.includes(ext)) return true;
    const type = (c.media_content_type || '').toLowerCase();
    if (type === 'music' || type === 'audio' || type.startsWith('audio/')) return true;
    return false;
  }

  // 上报当前播放数据
  async _reportNowPlayingData(data, channel) {
    if (!data) return;
    const ch = channel || 'miot';
    const entityId = ch === 'ma'
      ? (this.maPlayerEntity || this.xiaomiMiotEntity)
      : (this.xiaomiMiotEntity);
    if (!entityId) return;
    const payload = {
      entity_id: entityId,
      title: data.title || data.name || '',
      artist: data.artist || '',
      cover_url: data.cover_url || data.cover || '',
      album: data.album || '',
      status: 'playing',
      source: data.source || '',
    };
    if (data.song_id) payload.song_id = String(data.song_id);
    if (data.user) payload.user = data.user;
    if (data.playlist_id) payload.playlist_id = data.playlist_id;
    const lsKey = this._getNpKey(ch);
    try {
      const lsData = {
        entity_id: payload.entity_id,
        title: payload.title,
        artist: payload.artist,
        cover_url: payload.cover_url,
        album: payload.album || '',
        song_id: payload.song_id || '',
        user: payload.user || '',
        playlist_id: payload.playlist_id || '',
        source: payload.source,
        updated_at: Date.now(),
      };
      localStorage.setItem(lsKey, JSON.stringify(lsData));
    } catch (lsError) {}
  }

  // 上报当前播放数据
  async _reportNowPlaying(cfg, state, item) {
    if (!item?.id) return;
    const u = cfg.users?.[state.activeTabIndex] || '';
    let pid = null;
    if (state.activePlaylistIndex >= 0) pid = cfg.tabs?.[state.activeTabIndex]?.playlists?.[state.activePlaylistIndex]?.id || null;
    try {
      const lsData = {
        entity_id: cfg.mediaEntity,
        title: item.title || item.name || '',
        artist: item.artist || '',
        cover_url: this._getActiveOverlay()?.coverUrl || '',
        album: item.album || '',
        song_id: item.id || '',
        user: u,
        playlist_id: pid || '',
        source: 'local',
        updated_at: Date.now(),
        media_content_id: item.media_content_id || item.url || '',
        media_type: item.media_type || 'music',
      };
      localStorage.setItem(this._getNpKey('local'), JSON.stringify(lsData));
    } catch(lsError) {}
  }

  // 恢复当前播放数据
  _restoreNowPlayingFromLocalStorage(channel) {
    const ch = channel || 'miot';
    const lsKey = this._getNpKey(ch);
    try {
      const raw = localStorage.getItem(lsKey);
      if (!raw) return null;
      const data = JSON.parse(raw);
      if (!data.title) return null;
      let expectedIds;
      if (ch === 'ma') {
        expectedIds = [this.maPlayerEntity, this.xiaomiMiotEntity].filter(Boolean);
      } else {
        expectedIds = [this.xiaomiMiotEntity, this._localMusicPlayerCfg?.mediaEntity].filter(Boolean);
      }
      const isLocalMusic = (data.source || '') === 'local' || !data.source;
      const matches = expectedIds.length === 0 || expectedIds.includes(data.entity_id) || (isLocalMusic && !this._localMusicPlayerCfg);
      if (expectedIds.length > 0 && !matches) {
        return null;
      }
      const MIOT_FAKE_RE = new Set(['请欣赏', '请欣赏（音乐）', '暂无播放', '正在加载', 'QQ音乐', '无音乐播放']);
      if (MIOT_FAKE_RE.has(data.title)) {
        localStorage.removeItem(lsKey);
        return null;
      }
      if (ch === 'ma' && this._maTrackName && data.title !== this._maTrackName) {
        return null;
      }
      if (data.updated_at && (Date.now() - data.updated_at > 24 * 60 * 60 * 1000)) {
        localStorage.removeItem(lsKey);
        return null;
      }
      if (data.artist && this._isPseudoArtist('', data.artist)) {
        data.artist = '';
      }
      return data;
    } catch(e) { return null; }
  }

  // 清除 localStorage
  _clearNowPlayingLocalStorage(channel) {
    const lsKeys = [this._getNpKey('miot'), this._getNpKey('local'), this._getNpKey('ma')];
    try {
      if (channel) {
        const target = this._getNpKey(channel);
        localStorage.removeItem(target);
      } else {
        // 清除当前设备的所有三通道
        lsKeys.forEach(k => { try { localStorage.removeItem(k); } catch(e) {} });
      }
    } catch(e) {}
  }

  // 清除现在播放
  async _clearNowPlaying(cfg) { this._clearNowPlayingLocalStorage(cfg?.mediaEntity ? 'local' : ''); }

  // 浏览媒体源
  _browseMediaSource(parentId) {
    const msg = { type: 'media_source/browse_media', media_content_id: parentId || undefined };
    if (typeof this._hass?.callWS === 'function') return this._hass.callWS(msg);
    if (this._hass?.connection?.sendMessagePromise) return this._hass.connection.sendMessagePromise(msg);
    return Promise.reject(new Error('不可用'));
  }

  // 渲染播放器视图 
  _renderPlayerView(container, cfg, state) {
    const entityState = this._hass?.states?.[cfg.mediaEntity];
    const currentItem = this._getCurrentPlayingItem(cfg, state);
    const coverUrl = this._resolveCoverUrl(cfg, state, currentItem, entityState);
    const title = currentItem?.title || entityState?.attributes?.media_title || '';
    const artist = currentItem?.artist || entityState?.attributes?.media_artist || '';
    const album = currentItem?.album || entityState?.attributes?.media_album_name || '';
    const isPlaying = entityState?.state === 'playing';
    const pos = entityState?.attributes?.media_position || 0;
    const duration = currentItem?.duration || entityState?.attributes?.media_duration || 0;
    const pct = duration > 0 ? Math.min((pos / duration) * 100, 100) : 0;
    const volLevel = entityState?.attributes?.volume_level || 0;
    const volPct = Math.round(volLevel * 100);
    const bgWrap = document.createElement('div');
    bgWrap.className = 'media-player-bg-wrap';
    const bgA = document.createElement('img'); bgA.className = 'media-player-bg-img'; bgA.style.opacity = '1';
    const bgB = document.createElement('img'); bgB.className = 'media-player-bg-img'; bgB.style.opacity = '0';
    if (coverUrl) { bgA.src = coverUrl; }
    bgWrap.appendChild(bgA); bgWrap.appendChild(bgB);
    const bgOverlay = document.createElement('div'); bgOverlay.className = 'media-player-bg-overlay';
    bgWrap.appendChild(bgOverlay); container.appendChild(bgWrap);
    state._bgLayerA = bgA; state._bgLayerB = bgB; state._bgActiveLayer = 'a'; state._bgCurrentUrl = coverUrl || '';
    const scrollArea = document.createElement('div');
    scrollArea.className = 'media-player-scroll-area';
    const topSection = document.createElement('div');
    topSection.className = 'media-player-top-section'; topSection.dataset.mode = 'vertical';
    scrollArea.appendChild(topSection); state._topSection = topSection;
    const headerRow = document.createElement('div');
    headerRow.className = 'media-player-header-row'; topSection.appendChild(headerRow);
    const coverBox = document.createElement('div');
    coverBox.className = 'media-player-cover-box';
    const coverImg = document.createElement('img');
    coverImg.dataset.coverTarget = 'true';
    coverImg.style.cssText = 'width:100%;height:100%;object-fit:cover;display:block;';
    if (coverUrl) coverImg.src = coverUrl; else coverImg.style.display = 'none';
    coverBox.appendChild(coverImg); headerRow.appendChild(coverBox);
    const metaDiv = document.createElement('div');
    metaDiv.className = 'media-player-meta';
    const artistAlbumText = [artist, album].filter(Boolean).join(' · ');
    const fileName = currentItem?.media_content_id ? currentItem.media_content_id.split('/').pop().split('\\\\').pop() : '';
    metaDiv.innerHTML = '<div data-meta="title" class="media-player-meta-title">' + this._escapeHtml(title || '未在播放') + '</div><div data-meta="artist" class="media-player-meta-artist">' + this._escapeHtml(artistAlbumText || (isPlaying ? '正在播放' : '已暂停')) + '</div>' + (fileName ? '<div data-meta="filename" class="media-player-meta-filename">' + this._escapeHtml(fileName) + '</div>' : '<div data-meta="filename" class="media-player-meta-filename" style="display:none;"></div>');
    headerRow.appendChild(metaDiv);
    const lyricsWrap = document.createElement('div');
    lyricsWrap.className = 'media-player-lyrics-wrap';
    const lyricsScroll = document.createElement('div');
    lyricsScroll.className = 'media-player-lyrics-scroll'; lyricsScroll.dataset.lyricsContainer = 'true';
    lyricsWrap.appendChild(lyricsScroll); topSection.appendChild(lyricsWrap); state._lyricsWrap = lyricsWrap;
    const progDiv = document.createElement('div');
    progDiv.className = 'media-player-progress-div';
    const progTrack = document.createElement('div');
    progTrack.className = 'media-player-progress-track'; progTrack.dataset.progressTrack = 'true';
    const progFill = document.createElement('div');
    progFill.className = 'media-player-progress-fill'; progFill.dataset.progressFill = 'true'; progFill.style.width = pct + '%';
    progTrack.appendChild(progFill);
    let isDragging = false;
    const entityState0 = this._hass?.states?.[cfg.mediaEntity];
    const supportsSeek = entityState0 && (entityState0.attributes?.supported_features & 256);
    const seekTo = (clientX) => {
      const rect = progTrack.getBoundingClientRect();
      const ratio = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
      const targetPos = Math.round(ratio * duration);
      progFill.style.transition = 'none'; progFill.style.width = (ratio * 100) + '%';
      const posEl = progDiv.querySelector('[data-meta="position"]');
      if (posEl) posEl.textContent = this._formatMediaTime(targetPos);
      if (this._hass && cfg.mediaEntity && duration > 0) {
        if (supportsSeek) {
          this._hass.callService('media_player', 'media_seek', { entity_id: cfg.mediaEntity, seek_position: targetPos }).catch(() => {});
        }
        state._localPosition = targetPos;
      }
    };
    progTrack.addEventListener('click', (e) => { if (isDragging) return; seekTo(e.clientX); });
    progTrack.addEventListener('pointerdown', (e) => {
      isDragging = false; const startX = e.clientX;
      const onMove = (ev) => {
        if (Math.abs(ev.clientX - startX) > 3) isDragging = true;
        if (isDragging) { const rect = progTrack.getBoundingClientRect(); const ratio = Math.max(0, Math.min(1, (ev.clientX - rect.left) / rect.width)); progFill.style.transition = 'none'; progFill.style.width = (ratio * 100) + '%'; }
      };
      const onUp = (ev) => { document.removeEventListener('pointermove', onMove); document.removeEventListener('pointerup', onUp); if (isDragging) { progFill.style.transition = ''; seekTo(ev.clientX); } };
      document.addEventListener('pointermove', onMove); document.addEventListener('pointerup', onUp);
    });
    progDiv.appendChild(progTrack);
    const timeRow = document.createElement('div');
    timeRow.className = 'media-player-time-row';
    timeRow.innerHTML = '<span data-meta="position" class="media-player-time-label">' + this._formatMediaTime(pos) + '</span><span data-meta="duration" class="media-player-time-label">' + this._formatMediaTime(duration) + '</span>';
    progDiv.appendChild(timeRow);
    const ctrlWrap = document.createElement('div');
    ctrlWrap.className = 'media-player-ctrl-wrap'; ctrlWrap.appendChild(progDiv);
    const ctrlRow1 = document.createElement('div'); ctrlRow1.className = 'media-player-ctrl-row1';
    const prevBtn = document.createElement('button'); prevBtn.dataset.action = 'prev'; prevBtn.className = 'media-player-ctrl-btn'; prevBtn.innerHTML = '<ha-icon icon="mdi:skip-previous" style="--mdc-icon-size:32px;"></ha-icon>'; ctrlRow1.appendChild(prevBtn);
    const playBtn = document.createElement('button'); playBtn.dataset.action = 'play-pause'; playBtn.className = 'media-player-play-btn'; playBtn.innerHTML = '<ha-icon icon="' + (isPlaying ? 'mdi:pause' : 'mdi:play') + '" style="--mdc-icon-size:30px;"></ha-icon>'; ctrlRow1.appendChild(playBtn);
    const nextBtn = document.createElement('button'); nextBtn.dataset.action = 'next'; nextBtn.className = 'media-player-ctrl-btn'; nextBtn.innerHTML = '<ha-icon icon="mdi:skip-next" style="--mdc-icon-size:32px;"></ha-icon>'; ctrlRow1.appendChild(nextBtn);
    const stopBtn = document.createElement('button'); stopBtn.dataset.action = 'stop'; stopBtn.className = 'media-player-ctrl-btn'; stopBtn.innerHTML = '<ha-icon icon="mdi:stop" style="--mdc-icon-size:28px;"></ha-icon>'; ctrlRow1.appendChild(stopBtn);
    ctrlWrap.appendChild(ctrlRow1); scrollArea.appendChild(ctrlWrap);
    const ctrlRow2 = document.createElement('div'); ctrlRow2.className = 'media-player-ctrl-row2';
    const plBtn = document.createElement('button'); plBtn.dataset.action = 'show-playlist'; plBtn.className = 'media-player-pill-btn'; plBtn.innerHTML = '<ha-icon icon="mdi:playlist-music" style="--mdc-icon-size:14px;flex-shrink:0;"></ha-icon><span>播放列表</span>'; ctrlRow2.appendChild(plBtn);
    const volRow = document.createElement('div'); volRow.className = 'media-player-vol-row';
    const volIcon = document.createElement('ha-icon'); volIcon.setAttribute('icon', volPct === 0 ? 'mdi:volume-off' : volPct < 50 ? 'mdi:volume-low' : 'mdi:volume-high'); volIcon.className = 'media-player-vol-icon'; volIcon.title = '点击静音/取消静音'; volIcon.dataset.muteToggle = 'true';
    volIcon.addEventListener('click', () => { const curVal = parseInt(volSlider.value); if (curVal > 0) { volIcon.dataset.prevVolume = String(curVal); this._setVolume(cfg.mediaEntity, 0); volSlider.value = '0'; volSlider.style.background = 'linear-gradient(to right,var(--b-accent,#3498db) 0%,var(--b-accent,#3498db) 0%,var(--b-slider,rgba(0,0,0,0.08)) 0%,var(--b-slider,rgba(0,0,0,0.08)) 100%)'; volIcon.setAttribute('icon', 'mdi:volume-off'); } else { const restore = parseInt(volIcon.dataset.prevVolume) || 30; this._setVolume(cfg.mediaEntity, restore / 100); volSlider.value = String(restore); volSlider.style.background = 'linear-gradient(to right,var(--b-accent,#3498db) 0%,var(--b-accent,#3498db) ' + restore + '%,var(--b-slider,rgba(0,0,0,0.08)) ' + restore + '%,var(--b-slider,rgba(0,0,0,0.08)) 100%)'; volIcon.setAttribute('icon', restore < 50 ? 'mdi:volume-low' : 'mdi:volume-high'); } });
    volRow.appendChild(volIcon);
    const volSlider = document.createElement('input'); volSlider.type = 'range'; volSlider.dataset.action = 'volume'; volSlider.min = '0'; volSlider.max = '100'; volSlider.value = volPct; volSlider.className = 'media-player-volume-slider'; volSlider.style.background = 'linear-gradient(to right,var(--b-accent,#3498db) 0%,var(--b-accent,#3498db) ' + volPct + '%,var(--b-slider,rgba(0,0,0,0.08)) ' + volPct + '%,var(--b-slider,rgba(0,0,0,0.08)) 100%)';
    volRow.appendChild(volSlider);
    const volLabel = document.createElement('span'); volLabel.dataset.volumeLabel = 'true'; volLabel.className = 'media-player-vol-label'; volLabel.textContent = volPct + '%'; volRow.appendChild(volLabel);
    scrollArea.appendChild(volRow); this._styleVolumeThumb(volSlider);
    scrollArea.appendChild(ctrlRow2);
    container.appendChild(scrollArea);
  }

  // 渲染当前页面
  _renderActivePage(viewArea, cfg, state) {
    viewArea.innerHTML = '';
    const idx = state.activePageIndex; const tab = cfg.pageTabs[idx]; if (!tab) return;
    if (tab._builtin === 'player') {
      state._activeView = 'list';
      this._renderListView(viewArea, cfg, state);
    }
  }

  // 切换视图
  _switchPlayerView(viewArea, cfg, state, view) {
    state._activeView = view; viewArea.innerHTML = '';
    if (view === 'player') this._renderPlayerView(viewArea, cfg, state);
    else this._renderListView(viewArea, cfg, state);
  }

  // 重新渲染当前视图
  _rerenderCurrentView(popupContainer, cfg, state) {
    if (!popupContainer) return;
    const viewArea = popupContainer.querySelector('.media-player-view-area');
    if (!viewArea) return;
    state._activeView = 'list';
    this._renderListView(viewArea, cfg, state);
    this._bindPlayerEvents(popupContainer, cfg, state);
  }

  // 更新标签页内容
  _updateTabContent(container, cfg, state) {
    if (!container) return;
    const oldTabBar = container.querySelector('.media-player-tab-bar');
    if (oldTabBar && cfg.tabs.length > 0) {
      const newTabBar = this._renderUserTabBar(cfg, state);
      oldTabBar.parentNode.replaceChild(newTabBar, oldTabBar);
    }
    const viewArea = container.querySelector('.media-player-view-area');
    let scrollArea = null;
    if (viewArea) {
      const wrap = viewArea.querySelector(':scope > div[style*="flex-direction:column"]') || viewArea.lastElementChild;
      if (wrap) {
        scrollArea = wrap.lastElementChild;
        if (scrollArea && scrollArea.style.overflowY !== 'auto' && scrollArea.style.overflow !== 'auto') {
          scrollArea = null;
          const allDivs = wrap.querySelectorAll('div');
          for (const div of allDivs) {
            const s = div.style;
            if ((s.overflowY === 'auto' || s.overflow === 'auto') && s.flex && s.flex.startsWith('1')) {
              scrollArea = div;
              break;
            }
          }
        }
      }
    }
    if (scrollArea) {
      scrollArea.innerHTML = '';
      const currentTab = cfg.tabs[state.activeTabIndex];
      const playlists = Array.isArray(currentTab?.playlists) ? currentTab.playlists : [];
      if (playlists.length === 0) {
        const emptyDiv = document.createElement('div');
        emptyDiv.style.cssText = 'text-align:center;padding:40px 0;color:var(--b-muted,#999);font-size:13px;';
        emptyDiv.textContent = '暂无播放列表，点击右上角 + 新建';
        scrollArea.appendChild(emptyDiv);
      } else {
        const listWrap = document.createElement('div');
        listWrap.className = 'pl-list-wrap';
        playlists.forEach((pl, plIdx) => {
          this._renderPlaylistItem(listWrap, pl, plIdx, cfg, state, container);
        });
        scrollArea.appendChild(listWrap);
      }
    }
    this._bindPlayerEvents(container, cfg, state);
  }

  // 渲染单个播放列表项（可展开的卡片 + 歌曲列表 + 播放列表按钮）
  _renderPlaylistItem(container, pl, plIdx, cfg, state) {
    const items = Array.isArray(pl.items) ? pl.items : [];
    const card = document.createElement('div'); card.className = 'media-player-playlist-header'; card.dataset.playlistIndex = plIdx; card.style.cursor = 'pointer'; card.style.userSelect = 'none';
    card.addEventListener('click', async (e) => {
      if (e.target.closest('button') || e.target.closest('.media-player-item')) return;
      const isSelecting = plIdx !== state.activePlaylistIndex;
      if (isSelecting && items.length) {
        // 点击播放列表：走完整流程（清空 ma + 清空本地 + 写入本地 + 刷新 UI + 播放第一首）
        await this._enterLocalPlaylist(items, pl, plIdx, cfg, state, state._popupContainer);
      } else {
        // 再次点击已选中的播放列表：折叠/展开
        const newIdx = isSelecting ? plIdx : -1;
        state.activePlaylistIndex = newIdx;
        if (!isSelecting) state.activeItemIndex = -1;
        this._saveMediaPlayerState(state);
        if (state._popupContainer) { this._rerenderCurrentView(state._popupContainer, cfg, state); if (this.requestUpdate) this.requestUpdate(); }
      }
    });
    const header = document.createElement('div'); header.style.cssText = 'display:flex;align-items:center;gap:8px;padding:10px 8px;border-radius:10px;cursor:pointer;';
    const isPlayingPlaylist = plIdx === state.activePlaylistIndex && state.activeItemIndex >= 0;
    const icon = document.createElement('ha-icon'); icon.setAttribute('icon', pl.icon || 'mdi:playlist-music'); icon.style.cssText = '--mdc-icon-size:18px;color:' + (isPlayingPlaylist ? 'var(--b-accent,#3498db)' : 'var(--b-icon,#555)') + ';flex-shrink:0;'; header.appendChild(icon);
    const nameEl = document.createElement('span'); nameEl.style.cssText = 'flex:1;font-size:13px;font-weight:600;color:var(--b-fg,#212121);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;'; nameEl.textContent = this._escapeHtml(pl.name || '列表 ' + (plIdx + 1)); header.appendChild(nameEl);
    const countEl = document.createElement('span'); countEl.style.cssText = 'font-size:11px;color:var(--b-muted,#999);flex-shrink:0;'; countEl.textContent = (items.length || 0) + ' 首'; header.appendChild(countEl);
    const playAllBtn = document.createElement('button');
    playAllBtn.title = '播放全部';
    const isLight2 = this._evaluateTheme() === 'light';
    playAllBtn.style.cssText = `display:flex;align-items:center;gap:3px;padding:4px 10px;border:1px solid ${isLight2 ? 'rgba(0,0,0,0.12)' : 'rgba(255,255,255,0.12)'};border-radius:6px;cursor:pointer;background:transparent;color:var(--b-accent,#3498db);font-size:11px;font-weight:500;flex-shrink:0;margin-left:4px;`;
    playAllBtn.innerHTML = '<ha-icon icon="mdi:play" style="--mdc-icon-size:12px;flex-shrink:0;"></ha-icon>播放列表';
    playAllBtn.addEventListener('click', async (e) => { e.stopPropagation(); if (items.length > 0) { await this._enterLocalPlaylist(items, pl, plIdx, cfg, state, state._popupContainer); } });
    header.appendChild(playAllBtn);
    card.appendChild(header);
    if (plIdx === state.activePlaylistIndex && items.length > 0) {
      const itemsWrap = document.createElement('div');
      itemsWrap.style.cssText = 'padding:0 0 6px;';
      items.forEach((item, iIdx) => {
        const isCurrent = iIdx === state.activeItemIndex;
        const itemEl = document.createElement('div');
        itemEl.className = 'media-player-item';
        itemEl.dataset.itemIndex = iIdx;
        itemEl.style.cssText = 'display:flex;align-items:center;gap:8px;padding:8px 12px 8px 20px;cursor:pointer;border-radius:8px;transition:background 0.15s;';
        itemEl.addEventListener('click', (e) => { e.stopPropagation(); state.activeItemIndex = iIdx; this._playMediaItem(item, cfg, state, this.shadowRoot?.querySelector('.media-player-popup')); });
        const idxSpan = document.createElement('span');
        idxSpan.style.cssText = 'font-size:11px;color:var(--room-secondary-text,#ccc);min-width:16px;flex-shrink:0;';
        idxSpan.textContent = (iIdx + 1);
        itemEl.appendChild(idxSpan);
        const infoDiv = document.createElement('div');
        infoDiv.style.cssText = 'flex:1;overflow:hidden;min-width:0;';
        const titleDiv = document.createElement('div');
        titleDiv.style.cssText = 'font-size:12px;color:var(--b-fg,#212121);font-weight:' + (isCurrent ? '600' : '400') + ';white-space:nowrap;overflow:hidden;text-overflow:ellipsis;';
        titleDiv.textContent = item.title || '未知曲目';
        infoDiv.appendChild(titleDiv);
        const artistDiv = document.createElement('div');
        artistDiv.style.cssText = 'font-size:10px;color:var(--b-muted,#999);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;';
        artistDiv.textContent = item.artist || '';
        infoDiv.appendChild(artistDiv);
        itemEl.appendChild(infoDiv);
        const tagWrap = document.createElement('div');
        tagWrap.style.cssText = 'display:flex;align-items:center;gap:3px;flex-shrink:0;';
        if (item.has_lyrics || item.has_lyrics === 1) {
          const lrcTag = document.createElement('span');
          lrcTag.textContent = 'LRC';
          lrcTag.style.cssText = 'font-size:9px;font-weight:700;color:#2ecc71;background:rgba(46,204,113,0.12);padding:1px 5px;border-radius:4px;flex-shrink:0;';
          tagWrap.appendChild(lrcTag);
        }
        if (item.has_cover || item.has_cover === 1) {
          const coverTag = document.createElement('span');
          coverTag.textContent = 'COVER';
          coverTag.style.cssText = 'font-size:9px;font-weight:700;color:#3498db;background:rgba(52,152,219,0.12);padding:1px 5px;border-radius:4px;flex-shrink:0;';
          tagWrap.appendChild(coverTag);
        }
        if (tagWrap.children.length > 0) itemEl.appendChild(tagWrap);
        const durSpan = document.createElement('span');
        durSpan.style.cssText = 'font-size:10px;color:var(--b-muted,#999);flex-shrink:0;';
        durSpan.textContent = item.duration ? this._formatMediaTime(item.duration) : '';
        itemEl.appendChild(durSpan);
        itemsWrap.appendChild(itemEl);
      });
      card.appendChild(itemsWrap);
    } else if (plIdx === state.activePlaylistIndex && items.length === 0) {
      const emptyTip = document.createElement('div');
      emptyTip.style.cssText = 'padding:14px 12px 6px 24px;font-size:11px;color:var(--b-muted,#999);';
      emptyTip.textContent = '列表为空，点击右上角 🎵 从媒体库添加';
      card.appendChild(emptyTip);
    }
    container.appendChild(card);
  }

  // 获取当前用户头像
  _getCurrentUserAvatar() {
    const uid = this._hass?.user?.id; if (!uid) return null;
    for (const eid in (this._hass?.states || {})) { if (!eid.startsWith('person.')) continue; const s = this._hass.states[eid]; if (s?.attributes?.user_id === uid) return s?.attributes?.entity_picture || null; }
    return null;
  }

  // ========== MA 音乐相关 ==========

  // 从 localStorage 恢复播放信息（页面刷新后兜底）
  _restoreMaOverlayFromLocalStorage() {
    let savedSource = '';
    try { savedSource = localStorage.getItem(this._getLastSourceKey()) || ''; } catch(e) {}

    let lsData = null;
    try {
      const raw = localStorage.getItem(this._getNpKey('ma'));
      if (raw) lsData = JSON.parse(raw);
    } catch(e) {}
    if (!lsData && !savedSource) {
      return;
    }
    const MIOT_PSEUDO = ['请欣赏（音乐）', '请欣赏', '暂无播放', '暂未播放', 'QQ音乐', '正在加载', '加载中', '无音乐播放'];
    if (lsData && lsData.title) {
      const isPseudo = MIOT_PSEUDO.some(p => lsData.title.includes(p));
      if (isPseudo) {
        try { localStorage.removeItem(this._getNpKey('ma')); } catch(e) {}
        lsData = null;
      }
    }
    const effectiveSource = savedSource || (lsData?.source) || '';
    if (false) {
      // netease removed
    } else if (effectiveSource === 'qqmusic') {
      this._setChannel('ma');
      this._maOverlay.source = 'qqmusic';
      this._maOverlay.active = true;
      if (lsData) {
        this._maOverlay.title = lsData.title || '';
        this._maOverlay.artist = lsData.artist || '';
        this._maOverlay.coverUrl = lsData.cover_url || '';
      }
    } else if (effectiveSource === 'ma_search') {
      this._setChannel('ma');
      this._maOverlay.source = 'ma_search';
      this._maOverlay.active = true;
      if (lsData) {
        this._maOverlay.title = lsData.title || '';
        this._maOverlay.artist = lsData.artist || '';
        this._maOverlay.coverUrl = lsData.cover_url || '';
      }
    } else if (lsData) {
      this._setChannel('ma');
      this._maOverlay.source = lsData.source || '';
      this._maOverlay.active = true;
      this._maOverlay.title = lsData.title || '';
      this._maOverlay.artist = lsData.artist || '';
      this._maOverlay.coverUrl = lsData.cover_url || '';
    }

    this.requestUpdate();
  }

  // 检查 MA WebSocket 是否可用（connected 标志位 或 物理连接已建立）
  _isMaWsReady() { return this._maWs?.readyState === WebSocket.OPEN; }

  // 连接MA WebSocket
  async _connectMaWs() {
    if (!this.maServerUrl || !this.maServerToken) return;
    if (this._maWs && this._isMaWsReady()) return;
    if (this._maWs && (this._maWs.readyState === WebSocket.CONNECTING || this._maWs.readyState === WebSocket.CLOSING)) return;
    if (!this._maWsRetryCount) this._maWsRetryCount = 0;
    if (this._maWsRetryCount > 5) {
      setTimeout(() => { this._maWsRetryCount = 0; this._connectMaWs(); }, 30000);
      return;
    }
    this._maWsRetryCount++;
    const wsUrl = this.maServerUrl.replace(/^http/, 'ws').replace(/\/+$/, '') + '/ws';
    if (this._maWs) { this._maWs.onclose = null; this._maWs.close(); this._maWs = null; }
    try {
      this._maWs = new WebSocket(wsUrl);
      this._maWs._msgId = 0;
      this._maWs._pending = {};
      this._maWs.onopen = () => { this._maWsRetryCount = 0; this._maAuthMsgId = this._maWsSend('auth', { token: this.maServerToken }); };
      this._maWs.onmessage = (event) => { try { this._handleMaWsMessage(JSON.parse(event.data)); } catch(e) {} };
      this._maWs.onerror = () => { this._maWsConnected = false; };
      this._maWs.onclose = () => {
        this._maWsConnected = false; this._maPlaylistAutoRefreshed = false; this._stopMaWsHeartbeat();
        this._maTrackName = ''; this._maTrackArtist = ''; this._maCoverUrl = '';
        this._maDuration = 0; this._maElapsedTime = 0;
        this.requestUpdate(); setTimeout(() => this._connectMaWs(), 5000);
      };
    } catch(e) {}
  }

  // 发送MA WebSocket消息
  _maWsSend(command, args = {}) {
    if (!this._maWs || this._maWs.readyState !== WebSocket.OPEN) {
      console.log('[Xiaoshi][ws] _maWsSend 未发送(' + command + '): WS不可用, readyState=', this._maWs ? this._maWs.readyState : 'null');
      return null;
    }
    // 未鉴权前只允许发送 auth，避免命令被服务端拒绝（与文档：auth 必须是首条命令）
    if (command !== 'auth' && !this._maWsConnected) {
      console.log('[Xiaoshi][ws] _maWsSend 未发送(' + command + '): 尚未鉴权(_maWsConnected=false)');
      return null;
    }
    const msgId = 'ma-' + (++this._maWs._msgId);
    this._maWs.send(JSON.stringify({ command, message_id: msgId, args }));
    return msgId;
  }

  // 发送MA WebSocket消息并等待结果
  _maWsSendAndWait(command, args) {
    return new Promise((resolve, reject) => {
      const msgId = this._maWsSend(command, args);
      if (!msgId) { console.log('[Xiaoshi][ws] _maWsSendAndWait 失败(' + command + '): WS未连接/未鉴权'); reject(new Error('WS未连接')); return; }
      const t = setTimeout(() => { delete this._maWs._pending[msgId]; console.log('[Xiaoshi][ws] _maWsSendAndWait 超时(' + command + ') msgId=' + msgId); reject(new Error('超时')); }, 15000);
      this._maWs._pending[msgId] = { resolve: (d) => { clearTimeout(t); resolve(d); }, reject: (e) => { clearTimeout(t); reject(e); } };
    });
  }

  // 处理MA WebSocket消息
  _handleMaWsMessage(msg) {
    if (this._maAuthMsgId && msg.message_id === this._maAuthMsgId) {
      // 严格按文档判定：需 result.authenticated 为真
      if (!msg.error && msg.result && msg.result.authenticated !== false) {
        this._maWsConnected = true;
        console.log('[Xiaoshi][ws] MA WS 鉴权成功');
        this._maWsSend('subscribe_events', { event_filter: ['player_updated', 'queue_updated', 'queue_items_updated', 'queue_time_updated'] });
        this._subscribeMaQueue();
        this._tryAutoRefreshPlaylist();
      } else {
        this._maWsConnected = false;
        console.log('[Xiaoshi][ws] MA WS 鉴权失败:', JSON.stringify(msg.error || msg.result || msg));
        // token 失效/鉴权失败：主动关闭以触发自动重连
        try { this._maWs && this._maWs.close(); } catch(e) {}
      }
      this._maAuthMsgId = null; return;
    }
    if (msg.type === 'server_info') return;
    if (msg.message_id) {
      const pending = this._maWs?._pending?.[msg.message_id];
      if (pending) {
        if (msg.error || msg.type === 'error' || msg.error_code) {
          console.log('[Xiaoshi][ws] 收到错误响应 message_id=' + msg.message_id + ':', JSON.stringify(msg));
          pending.reject(msg.error || msg);
        }
        else pending.resolve(msg.result !== undefined ? msg.result : msg);
        delete this._maWs._pending[msg.message_id];
        this._handleMaWsResult(msg); return;
      }
    }
    if (msg.message_id && msg.result !== undefined) { this._handleMaWsResult(msg); return; }
    if (msg.type === 'error') return;
    if (msg.event) {
      if (!this._maWsConnected) { this._maWsConnected = true; this._maAuthMsgId = null; this._maWsSend('subscribe_events', { event_filter: ['player_updated', 'queue_updated', 'queue_items_updated', 'queue_time_updated'] }); this._subscribeMaQueue(); this._tryAutoRefreshPlaylist(); }
      const et = msg.event;
      if (et === 'queue_updated' || et === 'queue_items_updated') this._handleMaQueueEvent(msg.object_id || this._maQueueId);
      else if (et === 'queue_time_updated') {
        if (msg.data && typeof msg.data === 'number') { this._maElapsedTime = msg.data; this.smoothCurrentTime = msg.data * 1000; this.lastUpdateTime = Date.now(); this.requestUpdate(); }
        else if (msg.object_id) this._handleMaQueueEvent(msg.object_id);
      }
      else if (et === 'player_updated') {
        if (!this._maTrackName || !this._maQueueId) this._subscribeMaQueue();
        if (msg.data) {
          if (typeof msg.data.power === 'boolean') {
            if (!this._isVolumeChanging || msg.data.power) this.isPlaying = msg.data.power;
          } else if (typeof msg.data.state === 'string') {
            const s = msg.data.state.toLowerCase();
            if (!this._isVolumeChanging || s === 'playing' || s === '播放' || s === '播放中') this.isPlaying = (s === 'playing' || s === '播放' || s === '播放中');
          } else if (typeof msg.data.elapsed_time === 'number' && msg.data.elapsed_time > 0) {
            this.isPlaying = true;
          }
          if (typeof msg.data.elapsed_time === 'number') {
            this._maElapsedTime = msg.data.elapsed_time; this.smoothCurrentTime = msg.data.elapsed_time * 1000; this.lastUpdateTime = Date.now();
          } else if (typeof msg.data.elapsed_time_seconds === 'number') {
            this._maElapsedTime = msg.data.elapsed_time_seconds; this.smoothCurrentTime = msg.data.elapsed_time_seconds * 1000; this.lastUpdateTime = Date.now();
          }
          if (typeof msg.data.state === 'string') { this.isPlaying = msg.data.state === 'playing'; }
          if (this.isPlaying && this._maTrackName) this.startSmoothProgressTimer();
          this.requestUpdate();
        }
      }
      return;
    }
    if (msg.type === 'event') {
      if (msg.event === 'queue_updated' || msg.event === 'queue_items_updated') this._handleMaQueueEvent(msg.data || msg.object_id);
      else if (msg.event === 'queue_time_updated') {
        if (msg.data && typeof msg.data === 'number') { this._maElapsedTime = msg.data; this.smoothCurrentTime = msg.data * 1000; this.lastUpdateTime = Date.now(); this.requestUpdate(); }
        else if (msg.object_id) this._handleMaQueueEvent(msg.object_id);
      }
    }
  }

  // 订阅 MA 队列
  _subscribeMaQueue() {
    if (!this._isMaWsReady()) return;
    const playerEntity = this.maPlayerEntity || this.xiaomiMiotEntity;
    if (!playerEntity) return;
    const msgId = this._maWsSend('players/all') || this._maWsSend('players/get_all');
    if (msgId && this._maWs) {
      this._maWs._pending[msgId] = {
        resolve: (players) => {
          const entityId = playerEntity.replace(/^media_player\./, '');
          // 归一化：兼容数组或字典两种返回格式
          let playerList = [];
          if (Array.isArray(players)) playerList = players;
          else if (players && typeof players === 'object') {
            const vals = Object.values(players);
            playerList = vals.filter(v => v && (v.player_id || v.name));
          }
          console.log('[Xiaoshi][ws] 订阅队列: players原始返回=', JSON.stringify(players));
          console.log('[Xiaoshi][ws] 订阅队列: players归一化(', playerList.length, ')=', JSON.stringify(playerList.map(p => ({ player_id: p.player_id, name: p.name, provider: p.provider }))));
          // 候选匹配：去掉尾部的 _ma / 通用后缀，子串互含，均尝试
          const entityCandidates = [entityId, entityId.replace(/_ma$/, ''), entityId.replace(/_ma_?/i, ''), entityId.replace(/[\s_]/g, '')];
          let matchedPlayer = playerList.find(p => entityCandidates.includes(p.player_id) || entityCandidates.includes((p.name || '').replace(/[\s_]/g, '_')));
          if (!matchedPlayer) {
            matchedPlayer = playerList.find(p =>
              entityCandidates.some(c => (p.player_id || '').includes(c) || (p.name || '').replace(/[\s_]/g, '_').includes(c) || c.includes(p.player_id || ''))
            );
          }
          // 兜底：未匹配但系统内只有 1 个播放器，直接选用（常见单音箱场景）
          if (!matchedPlayer && playerList.length === 1) {
            matchedPlayer = playerList[0];
            console.log('[Xiaoshi][ws] 订阅队列: 未匹配但仅有1个播放器，自动选用 player_id=', matchedPlayer.player_id);
          }
          if (matchedPlayer) {
            this._maPlayerId = matchedPlayer.player_id;
            this._maQueueId = matchedPlayer.player_id;
            console.log('[Xiaoshi][ws] 订阅队列: 匹配到播放器 player_id=', matchedPlayer.player_id, 'name=', matchedPlayer.name);
          } else {
            this._maPlayerId = entityId;
            this._maQueueId = entityId;
            console.log('[Xiaoshi][ws] 订阅队列: 未匹配到播放器，退回 entityId=', entityId, '(playerEntity=', playerEntity, ')');
          }
          this._maWsSend('player_queues/get', { queue_id: this._maQueueId });
          this._startMaWsHeartbeat();
        },
        reject: () => {
          const entityId = playerEntity.replace(/^media_player\./, '');
          this._maPlayerId = entityId;
          this._maQueueId = entityId;
          this._maWsSend('player_queues/get', { queue_id: this._maQueueId });
          this._startMaWsHeartbeat();
        }
      };
    } else {
      const entityId = playerEntity.replace(/^media_player\./, '');
      this._maPlayerId = entityId;
      this._maQueueId = entityId;
    }
  }

  // 处理 MA WS 结果
  _handleMaWsResult(msg) {
    const result = msg.result;
    if (!result) return;
    if (result.version || result.name || result.schema_version) return;
    if (Array.isArray(result) && result.length > 0 && result[0]?.player_id) {
      if (!this._maPlayerId) {
        const playerEntity = this.maPlayerEntity || this.xiaomiMiotEntity;
        const entityId = (playerEntity || '').replace(/^media_player\./, '');
        let matchedPlayer = result.find(p => p.player_id === entityId);
        if (!matchedPlayer) {
          matchedPlayer = result.find(p =>
            p.player_id === entityId ||
            p.name === entityId ||
            p.name?.replace(/[\s_]/g, '_') === entityId ||
            p.player_id?.endsWith(entityId)
          );
        }
        if (matchedPlayer) {
          this._maPlayerId = matchedPlayer.player_id;
          this._maQueueId = matchedPlayer.player_id;
          this._maWsSend('player_queues/get', { queue_id: this._maQueueId });
        }
      }
      return;
    }
    if (result.queue_id) {
      if (result.current_item) this._handleMaQueueData(result);
      else { this._maQueueId = result.queue_id; }
      return;
    }
    if (Array.isArray(result) && result.length > 0 && result[0]?.item_id && !result[0]?.player_id && !result[0]?.queue_item_id) return;
    if (Array.isArray(result) && result.length > 0 && result[0]?.uri && result[0]?.name && !result[0]?.queue_item_id && !result[0]?.player_id) return;
  }

  // 处理 MA 队列数据
  async _handleMaQueueData(queueData) {
    const currentItem = queueData.current_item;
    if (!currentItem) {
      this.isPlaying = false;
      // 单首播放模式：本曲播完（队列空）时，向后端取下一首再推送到 MA
      if (this._maExpectingEnd && this._maPlayingIndex >= 0 && this._getEffectiveChannel() === 'ma') {
        this._maExpectingEnd = false; // 先关标志，避免新曲加载前队列短暂为空触发重复切歌
        this._maAutoNext();
      }
      this.requestUpdate();
      return;
    }
    if (queueData.state === 'playing') this.isPlaying = true;
    let elapsed = queueData.elapsed_time || 0;
    const lastUpdated = queueData.elapsed_time_last_updated || 0;
    const playbackSpeed = queueData.playback_speed || 1.0;
    if (queueData.state === 'playing' && lastUpdated > 0) elapsed = elapsed + (Date.now() / 1000 - lastUpdated) * playbackSpeed;
    this._maElapsedTime = elapsed;
    let rawDuration = currentItem.duration || 0;
    if (rawDuration > 7200 && (rawDuration / 1000) < 1200) rawDuration = rawDuration / 1000;
    else if (rawDuration > 7200) {
      rawDuration = (currentItem.media_item && currentItem.media_item.duration) || 0;
      if (rawDuration > 7200 && (rawDuration / 1000) < 1200) rawDuration = rawDuration / 1000;
      else if (rawDuration > 7200) rawDuration = 0;
    }
    this._maDuration = rawDuration;
    this.smoothCurrentTime = elapsed * 1000;
    this.lastUpdateTime = Date.now();
    const imageObj = currentItem.image || currentItem.media_item?.image;
    if (imageObj) {
      if (imageObj.proxy_id) this._maCoverUrl = `${this.maServerUrl}/imageproxy/${imageObj.proxy_id}?size=512&fmt=jpg`;
      else if (imageObj.remotely_accessible && imageObj.path) this._maCoverUrl = imageObj.path;
      else if (imageObj.path && imageObj.provider) this._maCoverUrl = `${this.maServerUrl}/imageproxy?provider=${encodeURIComponent(imageObj.provider)}&path=${encodeURIComponent(imageObj.path)}&size=512&fmt=jpg`;
      else this._maCoverUrl = '';
    } else { this._maCoverUrl = ''; }
    let trackName = '', trackArtist = '';
    if (currentItem.media_item && currentItem.media_item.name) {
      trackName = currentItem.media_item.name;
      trackArtist = (currentItem.media_item.artists || []).map(a => a.name || '').join('/');
    } else if (currentItem.name) {
      const di = currentItem.name.indexOf(' - ');
      if (di > 0) { trackArtist = currentItem.name.substring(0, di); trackName = currentItem.name.substring(di + 3); }
      else trackName = currentItem.name;
    }
    const songChanged = (trackName !== this._maTrackName) || (trackArtist !== this._maTrackArtist);
    this._maTrackName = trackName; this._maTrackArtist = trackArtist;
    if (trackName && songChanged) {
      this._maLastSongTitle = trackName;
      this._maLastSongArtist = trackArtist || '';
    }
    if (songChanged && currentItem.media_item) {
      this._fetchMaLyrics(currentItem.media_item);
    }
    if (songChanged && this.isPlaying) {
      this.initSmoothTimeOnce();
      this.stopSmoothTimer();
      this.startSmoothProgressTimer();
    }
    if (songChanged) {
      const source = this._detectActiveSource(this._getPrimaryState());
      const miotActuallyActive = this._activeChannel === 'miot' && this._miotOverlay.active;
      const localActuallyActive = this._activeChannel === 'local' && this._localOverlay.active && this._localOverlay.title;
      if (!miotActuallyActive && !localActuallyActive) {
        this._setChannel('ma');
      }

      if (source === 'local') {
        this._setChannel('local');
        this._localOverlay.source = 'local';
        this._localOverlay.active = true;
        try { localStorage.setItem(this._getLastSourceKey(), 'local'); } catch(e) {}
        if (songChanged) {
          this._localOverlay.title = '';
          this._localOverlay.artist = '';
          this._localOverlay.coverUrl = '';
          this._overlayLyrics = [];
        }
        if (!this._localOverlay.title || !this._localOverlay.artist || !this._localOverlay.coverUrl) {
          await this._applyLocalMusicOverlay();
        }
        this._reportNowPlayingData({
          title: this._localOverlay.title || '',
          artist: this._localOverlay.artist || '',
          cover_url: this._localOverlay.coverUrl || '',
          source: 'local'
        }, 'local');
      } else if (source === 'qqmusic') {
        this._setChannel('ma');
        this._maOverlay.source = 'qqmusic';
        this._maOverlay.active = true;
        this._activeOverlaySource = 'qqmusic';
        try { localStorage.setItem(this._getLastSourceKey(), 'qqmusic'); } catch(e) {}
        if (songChanged) {
          this._maOverlay.title = '';
          this._maOverlay.artist = '';
          this._maOverlay.coverUrl = '';
        }
        if (this._maTrackName) {
          this._maOverlay.title = this._maTrackName;
          this._maOverlay.artist = this._maTrackArtist || '';
          if (this._maCoverUrl) this._maOverlay.coverUrl = this._maCoverUrl;
          if (this.lyrics.length > 0) this._overlayLyrics = this.lyrics;
        } else {
          await this._applyQQMusicOverlay();
        }
        this._reportNowPlayingData({
          title: this._maOverlay.title || '',
          artist: this._maOverlay.artist || '',
          cover_url: this._maOverlay.coverUrl || '',
          source: 'qqmusic'
        }, 'ma');
      } else if (source === 'ma_search') {
        this._setChannel('ma');
        this._maOverlay.source = 'ma_search';
        this._maOverlay.active = true;
        this._activeOverlaySource = 'ma_search';
        try { localStorage.setItem(this._getLastSourceKey(), 'ma_search'); } catch(e) {}
        if (songChanged) {
          this._maOverlay.title = '';
          this._maOverlay.artist = '';
          this._maOverlay.coverUrl = '';
        }
        if (typeof this._applyMASearchOverlay === 'function') await this._applyMASearchOverlay();
        if (!this._maOverlay.title && this._maTrackName) {
          this._maOverlay.title = this._maTrackName;
          this._maOverlay.artist = this._maTrackArtist || '';
        }
        if (!this._maOverlay.coverUrl && this._maCoverUrl) {
          this._maOverlay.coverUrl = this._maCoverUrl;
        }
        this._reportNowPlayingData({
          title: this._maOverlay.title || '',
          artist: this._maOverlay.artist || '',
          cover_url: this._maOverlay.coverUrl || '',
          source: 'ma_search'
        }, 'ma');
      } else {
        this._setChannel('ma');
        this._maOverlay.active = true;
        if (this._maTrackName) {
          this._maOverlay.source = this._maOverlay.source || 'qqmusic';
          this._maOverlay.title = this._maTrackName;
          this._maOverlay.artist = this._maTrackArtist || '';
          this._maOverlay.coverUrl = this._maCoverUrl || this._maOverlay.coverUrl;
        }
      }

      if (source) {
      }
    }
    if (!songChanged && this._maCoverUrl && this._maOverlay.source && this._maOverlay.active) {
      if (this._maCoverUrl !== this._maOverlay.coverUrl) {
        this._maOverlay.coverUrl = this._maCoverUrl;
      }
    }

    this.requestUpdate();
  }

  // 处理 MA 队列事件
  _handleMaQueueEvent(dataOrObjectId) {
    const qid = typeof dataOrObjectId === 'string' ? dataOrObjectId : dataOrObjectId?.queue_id || this._maQueueId;
    if (qid) this._maWsSend('player_queues/get', { queue_id: qid });
  }

  // 启动 MA WS 心跳
  _startMaWsHeartbeat() { if (!this._maWsHeartbeatInterval) this._maWsHeartbeatInterval = setInterval(() => { if (this._maWs && this._maWs.readyState === WebSocket.OPEN) this._maWsSend('get_server_info'); else this._stopMaWsHeartbeat(); }, 30000); }

  _stopMaWsHeartbeat() { if (this._maWsHeartbeatInterval) { clearInterval(this._maWsHeartbeatInterval); this._maWsHeartbeatInterval = null; } }

  // 获取歌词
  _fetchMaLyrics(mediaItem) {
    if (!this._isMaWsReady()) return;
    const msgId = this._maWsSend('metadata/get_track_lyrics', { track: mediaItem });
    if (msgId && this._maWs) {
      this._maWs._pending[msgId] = {
        resolve: (result) => {
          const lrc = result?.[1] || result?.[0] || '';
          if (lrc && lrc.trim()) { this.lyrics = this.parseLyrics(lrc); if (this.isPlaying && this.smoothCurrentTime > 0) { this.updateCurrentLyricIndex(this.smoothCurrentTime); this.startLyricsTimer(); } this.requestUpdate(); }
          else { }
        },
        reject: () => { }
      };
    }
  }

  // 检测 MA 来源是否处于活跃状态
  _isMaSourceActive() {
    const maSource = this._maOverlay?.source || '';
    if (!['qqmusic','local','ma_search'].includes(maSource)) return false;
    if (!this._maOverlay?.active) return false;
    if (this.maPlayerEntity && this._hass?.states[this.maPlayerEntity]) {
      const maSt = this._hass.states[this.maPlayerEntity];
      if (['playing','Playing','paused','Paused'].includes(maSt.state)) return true;
    }
    const st = this._getPrimaryState();
    if (st && ['playing','Playing'].includes(st.state)) {
      const cid = (st.attributes?.media_content_id || '').toLowerCase();
      const ct = (st.attributes?.media_content_type || '').toLowerCase();
      if (!/music_assistant|mass:\/\/|mass\//.test(cid) && !/music_assistant|mass:/.test(ct)) return false;
    }
    return true;
  }

  // 获取当前播放来源的实体
  _getPrimaryState() {
    const h = this._hass; if (!h) return null;
    if (this._maOverlay?.source && this._maOverlay?.active && this.maPlayerEntity && h.states[this.maPlayerEntity]) {
      return h.states[this.maPlayerEntity];
    }
    if (this.xiaomiMiotEntity && h.states[this.xiaomiMiotEntity]) return h.states[this.xiaomiMiotEntity];
    if (this.maPlayerEntity && h.states[this.maPlayerEntity]) return h.states[this.maPlayerEntity];
    return null;
  }

  // 检测当前播放来源
  _detectActiveSource(state) {
    const maSource = this._maOverlay?.source || '';
    if (maSource && ['qqmusic','local','ma_search'].includes(maSource)) {
      return maSource;
    }
    if (!state || !state.attributes) return '';
    const a = state.attributes;
    const cid = (a.media_content_id || '').toLowerCase();
    const ct = (a.media_content_type || '').toLowerCase();
    if (cid.includes('qqmusic') || cid.includes('qq_music') || cid.includes('tencent')) return 'qqmusic';
    if (ct === 'local' || cid.includes('filesystem') || cid.startsWith('file://') || cid.startsWith('media-source://') || cid.includes('/media/local')) return 'local';
    if (cid.includes('music_assistant') || cid.includes('mass://') || cid.includes('mass/')) return 'ma_search';
    try { const ls = localStorage.getItem(this._getLastSourceKey()); if (ls && ['qqmusic','local','ma_search'].includes(ls)) return ls; } catch(e) {}
    return maSource;
  }

  // 获取当前播放的实体
  _getActiveTargetEntity() {
    const maWsActive = this._isMaWsReady() && (this._maTrackName || this._maOverlay?.active) && this._isMaSourceActive();
    if (maWsActive && this.maPlayerEntity) return this.maPlayerEntity;
    return this.xiaomiMiotEntity;
  }

  // QQ 音乐覆盖层
  async _applyQQMusicOverlay() {
    this._setChannel('ma');
    if (!this._maOverlay.title && !this._maOverlay.artist && !this._maOverlay.coverUrl) {
      const ls = this._restoreNowPlayingFromLocalStorage('ma');
      if (ls && (ls.source === 'qqmusic')) { if (ls.title&&!this._maOverlay.title) this._maOverlay.title=ls.title; if (ls.artist&&!this._maOverlay.artist) this._maOverlay.artist=ls.artist; if (ls.cover_url&&!this._maOverlay.coverUrl) this._maOverlay.coverUrl=ls.cover_url; }
      if (this._maOverlay.title) { this.requestUpdate(); return; }
    }
    if (this._maOverlay.title) return;
    const MIOT_FAKE = new Set(['请欣赏', '请欣赏（音乐）', '暂无播放', '正在加载', 'QQ音乐', '无音乐播放']);
    const miotSt = this._hass && this.xiaomiMiotEntity ? this._hass.states[this.xiaomiMiotEntity] : null;
    if (miotSt?.attributes) {
      const a = miotSt.attributes;
      const mt = a.media_title||''; const ma = a.media_artist||'';
      const isFake = MIOT_FAKE.has(mt);
      if (!isFake && mt) { this._maOverlay.title = mt; this._maOverlay.artist = ma; if (a.media_image_url||a.entity_picture) this._maOverlay.coverUrl = a.media_image_url||a.entity_picture; }
    }
    if (!this._maOverlay.title && this.maPlayerEntity && this._hass) {
      const maSt = this._hass.states[this.maPlayerEntity];
      if (maSt?.attributes) {
        const a = maSt.attributes;
        const mt = a.media_title||''; const ma = a.media_artist||'';
        const isFake = MIOT_FAKE.has(mt);
        if (!isFake && mt) { this._maOverlay.title = mt; this._maOverlay.artist = ma; if (a.media_image_url||a.entity_picture) this._maOverlay.coverUrl = a.media_image_url||a.entity_picture; }
      }
    }
    if (!this._maOverlay.title && this._maTrackName) { this._maOverlay.title = this._maTrackName; this._maOverlay.artist = this._maTrackArtist||''; if (this._maCoverUrl) this._maOverlay.coverUrl = this._maCoverUrl; }
  }

  // 本地音乐覆盖层
  async _applyLocalMusicOverlay() {
    const allOverlayEmpty = !this._overlayTitle && !this._overlayArtist && !this._overlayCoverUrl;
    let restoredFromBackend = false;
    let restoredSongId = null;  // 从 localStorage 或后端恢复的 song_id，用于歌词获取
    let restoredMediaContentId = ''; // 用于恢复 currentItem.media_content_id

    if (allOverlayEmpty) {
      const lsData = this._restoreNowPlayingFromLocalStorage('local');
      if (lsData && (lsData.source === 'local' || !lsData.source)) {
        if (lsData.title && !this._overlayTitle) this._overlayTitle = lsData.title;
        if (lsData.artist && !this._overlayArtist) this._overlayArtist = lsData.artist;
        if (lsData.cover_url && !this._overlayCoverUrl) this._overlayCoverUrl = lsData.cover_url;
        if (lsData.song_id) restoredSongId = lsData.song_id;
        if (lsData.media_content_id) restoredMediaContentId = lsData.media_content_id;
        if (this._overlayTitle) {
          restoredFromBackend = true;
        }
      }
    }

    if (restoredFromBackend) {
      this._localOverlay = {
        title: this._overlayTitle || '',
        artist: this._overlayArtist || '',
        coverUrl: this._overlayCoverUrl || '',
        source: 'local',
        active: true
      };
      if (!this._mediaPlayerState) this._mediaPlayerState = {};
      if (!this._mediaPlayerState.currentItem && (this._overlayTitle || restoredSongId)) {
        this._mediaPlayerState.currentItem = {
          title: this._overlayTitle || '',
          artist: this._overlayArtist || '',
          media_content_id: restoredMediaContentId || '',
          media_type: 'music',
          id: restoredSongId || null
        };
      }
      this.requestUpdate();
      return;
    }
    if (!this._overlayTitle) {
      // 本地音乐优先用文件名（去后缀）作为标题，并清空 artist / 封面，
      // 避免 miot 实体残留的旧 MA 信息（如"请欣赏 (音乐)"）串入显示
      const lItem = (this._localPlaylist || [])[this._localCurrentIndex];
      const lName = this._localFileName(lItem?.uri);
      if (lName) {
        this._overlayTitle = lName;
        this._overlayArtist = '';
      } else {
        // 本地音乐仅回退到 currentItem / HA 实体属性，绝不使用 MA 通道数据
        const currentItem = this._mediaPlayerState?.currentItem || null;
        if (currentItem && (currentItem.title || currentItem.name)) {
          this._overlayTitle = currentItem.title || currentItem.name || '';
          this._overlayArtist = currentItem.artist || '';
        } else {
          const st = this._getPrimaryState();
          const et = st?.attributes?.media_title || '';
          const ea = st?.attributes?.media_artist || '';
          if (et && !et.includes(' - ')) {
            this._overlayTitle = et;
            this._overlayArtist = ea;
          } else if (et && et.includes(' - ')) {
            const idx = et.indexOf(' - ');
            this._overlayArtist = et.substring(0, idx);
            this._overlayTitle = et.substring(idx + 3);
          }
        }
      }
    }
    if (!this._overlayCoverUrl) {
      const currentItem = this._mediaPlayerState?.currentItem || null;
      if (currentItem && currentItem.cover) {
        this._overlayCoverUrl = currentItem.cover;
      } else if (currentItem && currentItem.id) {
        this._overlayCoverUrl = '';
      } else {
        const st = this._getPrimaryState();
        const ep = st?.attributes?.entity_picture || '';
        if (ep) this._overlayCoverUrl = ep;
      }
    }
    if ((!this._overlayLyrics || this._overlayLyrics.length === 0) && this.lyrics.length > 0) {
      this._overlayLyrics = this.lyrics;
    }
  }

  // MA 音乐覆盖：仅当 overlay 全空时，才从 MA 通道获取数据
  async _applyMASearchOverlay() {
    // ===== 刷新页面恢复：优先 localStorage，其次后端 now_playing =====
    if (!this._overlayTitle && !this._overlayArtist && !this._overlayCoverUrl) {
      const lsData = this._restoreNowPlayingFromLocalStorage('ma');
      if (lsData) {
        if (lsData.title && !this._overlayTitle) this._overlayTitle = lsData.title;
        if (lsData.artist && !this._overlayArtist) this._overlayArtist = lsData.artist;
        if (lsData.cover_url && !this._overlayCoverUrl) this._overlayCoverUrl = lsData.cover_url;
      }

      if (this._overlayTitle) {
        this.requestUpdate();
        return;
      }
    }
    if (this._overlayTitle) { this.requestUpdate(); return; }
    if (this._maTrackName) {
      this._overlayTitle = this._maTrackName;
      this._overlayArtist = this._maTrackArtist || '';
    }
    if (this._maCoverUrl) this._overlayCoverUrl = this._maCoverUrl;
    if (this.lyrics.length > 0) this._overlayLyrics = this.lyrics;
  }

  // ════════════════════════════════════════════
  // MA音乐 — MA 播放列表浏览&播放
  // ════════════════════════════════════════════

  // 获取配置的我喜欢歌单 URI
  _getFavoritePlaylist() {
    return this.maFavoritePlaylist || null;
  }

  // ── 我喜欢弹窗入口 ──
  handleFavoriteToggle(uri) {
    if (!uri) return;
    this._handleClick();
    this._renderFavoritePopup(uri);
  }

  // ── MA音乐弹窗入口 ──
  handleMaPlaylistsToggle() {
    this._handleClick();
    this._renderMaMusicPopup();
  }

  // 获取 MA 播放列表（手动配置 > HA browse_media > MA WS browse）
  async _fetchMaPlaylists() {
    this._maPlaylistsLoading=true; this._maPlaylistsError=''; this._maPlaylistsList=[]; this._maUpdate?.();
    let all=[];
    try {
      // 方案0: 手动配置 ma_playlists
      if (this.maPlaylistsConfig && this.maPlaylistsConfig.trim()) {
            const lines = this.maPlaylistsConfig.split('\n').map(l=>l.trim()).filter(l=>l&&!l.startsWith('#'));
            for (const line of lines) {
          const p=line.split('|'); const nm=(p[0]||'').trim(); const mu=(p[1]||'').trim(); const im=(p[2]||'').trim();
          if (!nm||!mu) continue;
          let pr='MA音乐库'; if (/qqmusic|tencent/i.test(mu)) pr='MA音乐';
          all.push({ item_id:mu, name:nm, provider:pr, uri:mu, image_url:im, can_play:true, can_expand:true, media_content_type:'playlist', media_content_id:mu, _rawMaUri:mu });
        }
            if (all.length>0) { this._processMaPlaylistsResult(all); this._fetchMaPlaylistTrackCounts(); return; }
      }
      // 方案1: HA browse_media（通过小爱/音箱实体）
      const te=this.maPlayerEntity||this.xiaomiMiotEntity;
      if (this._hass&&te) {
        try {
          const r=await this._hass.callWS({ type:'browse_media', entity_id:te, media_content_type:'playlist', media_content_id:'playlists' });
          if (r?.children?.length) await this._collectBrowseItems(r, te, all, '', 0);
        } catch(e){}
      }
      // 方案2: MA WS music/browse（通过 MA WebSocket）
      if (all.length===0 && this._maWs && this._isMaWsReady()) {
        try {
          const bData = await this._maWsSendAndWait('music/browse', { path: '' });
          const items = Array.isArray(bData) ? bData : (bData?.items || []);
          if (items.length>0) await this._collectMaWsBrowseItems(items, all, '', 0);
        } catch(e){}
      }
      this._processMaPlaylistsResult(all);
      await this._fetchMaPlaylistTrackCounts();
    } catch(e) { this._maPlaylistsError = '获取失败: ' + e.message; }
    finally { this._maPlaylistsLoading=false; this._maUpdate?.(); }
  }

  // 标准化播放列表数据结构
  _makePlaylistItem(raw) {
    const id=raw.item_id||raw.playlist_id||raw.uri||''; const uri=raw.uri||raw.media_content_id||id||'';
    let pr='MA音乐库'; if (/qqmusic/i.test(uri)) pr='MA音乐';
    return { item_id:id, name:raw.name||raw.sort_name||raw.title||'未命名', provider:pr, uri, image_url:raw.image_url||raw.artwork_url||'', can_play:raw.can_play!==false, can_expand:!!raw.can_expand, media_content_type:raw.media_content_type||'music', media_content_id:uri, track_count:raw.total_tracks||raw.track_count||raw.total||raw.count||raw.tracks_total||0 };
  }

  // 递归收集 HA browse_media 返回的播放列表
  async _collectBrowseItems(node, entityId, results, parentName, depth) {
    if (depth>5) return;
    for (const child of (node.children||[])) {
      const cid=child.media_content_id||child.uri||'';
      if (child.can_expand && cid && depth<5) {
        try {
          const d=await this._hass.callWS({ type:'browse_media', entity_id:entityId, media_content_type:child.media_content_type||'library', media_content_id:cid });
          await this._collectBrowseItems(d, entityId, results, parentName, depth+1);
        } catch(e){}
      } else if (child.can_play && !child.can_expand) results.push(this._makePlaylistItem(child));
    }
  }

  // 递归收集 MA WebSocket music/browse 返回的播放列表
  async _collectMaWsBrowseItems(items, results, _parentName, depth) {
    if (depth > 5 || !items || !items.length) return;
    for (const item of items) {
      const name = item.name || item.title || '';
      const path = item.path || item.uri || '';
      if (item.can_expand && path && depth < 5) {
        try {
          const childData = await this._maWsSendAndWait('music/browse', { path: path });
          const childItems = Array.isArray(childData) ? childData : (childData?.items || []);
          await this._collectMaWsBrowseItems(childItems, results, name, depth + 1);
        } catch(e) {}
      } else if ((!item.can_expand || item.can_play) && name) {
        results.push(this._makePlaylistItem(item));
      }
    }
  }

  // 将播放列表按来源分组（MA音乐库 / MA音乐 / Spotify 等）
  _processMaPlaylistsResult(result) {
    if (!Array.isArray(result)) { this._maPlaylistsList=[]; return; }
    if(!this._maCountCache) this._maCountCache={};
    const lbls={'library':'MA音乐库','qqmusic':'MA音乐','tencent_music':'MA音乐','spotify':'Spotify','youtube':'YouTube Music','filesystem':'本地文件'};
    const gr={};
    for (const pl of result) {
      const pr=(pl.provider||'library').toLowerCase(); const lb=lbls[pr]||pr;
      if (!gr[lb]) gr[lb]=[];
      const pid=pl.item_id||pl.playlist_id||pl.uri||'';
      const cached=this._maCountCache[pid]||0;
      const raw=pl.total_tracks||pl.track_count||pl.total||pl.count||pl.tracks_total||0;
      gr[lb].push({ item_id:pl.item_id||pl.playlist_id||'', name:pl.name||'未命名', provider:pr, uri:pl.uri||'', image_url:pl.image_url||pl.artwork_url||'', can_play:pl.can_play||false, can_expand:pl.can_expand||false, media_content_id:pl.media_content_id||'', media_content_type:pl.media_content_type||'', track_count:raw||cached, _rawMaUri:pl._rawMaUri||'' });
    }
    const ord=['MA音乐库','MA音乐','Spotify','YouTube Music','本地文件'];
    const sg=[]; for (const lb of ord) { if (gr[lb]) { sg.push({ label:lb, playlists:gr[lb] }); delete gr[lb]; } }
    for (const [lb,pls] of Object.entries(gr)) sg.push({ label:lb, playlists:pls });
    this._maPlaylistsList=sg;
  }

  // 通过 MA WS 直接查询歌单曲目数量（打开弹窗时调用，重试一次）
  async _fetchMaPlaylistTrackCounts() {
    for (let attempt=1; attempt<=2; attempt++) {
    if (!this._maWs || this._maWs.readyState !== WebSocket.OPEN) {
      if (attempt===1) { await new Promise(r=>setTimeout(r,2000)); continue; }
      return;
    }
    let updated = 0;
    for (const group of this._maPlaylistsList) {
      for (const pl of group.playlists) {
        if (pl.track_count && pl.track_count > 0) continue;
        const pid = pl.item_id || pl.uri || '';
        if (!pid) continue;
        try {
          let itemId = ''; let providerDomain = 'library';
          const endDigits = String(pid).match(/(\d+)$/);
          if (endDigits) itemId = endDigits[1];
          if (!itemId) continue;
          const plUri = (pl.uri || pid).toLowerCase();
          if (plUri.includes('qqmusic')) providerDomain = 'qqmusic';
          const result = await this._maWsSendAndWait('music/playlists/playlist_tracks', {
            item_id: String(itemId),
            provider_instance_id_or_domain: providerDomain,
            force_refresh: false,
            allow_dynamic_tracks: false,
          });
          const items = Array.isArray(result) ? result : (result?.items || []);
          const validTracks = items.filter(it => !!(it?.name || it?.uri || it?.item_id) && !(it?.media_type === 'folder' || it?.media_type === 'playlist'));
          if (validTracks.length > 0) { pl.track_count = validTracks.length; if(!this._maCountCache)this._maCountCache={}; this._maCountCache[pid]=validTracks.length; updated++; }
        } catch(e) {}
      }
    }
    if (updated > 0) this._maUpdate?.();
    break;
    }
  }

  // 点击播放列表 → 展开/收起歌曲列表
  async handleMaPlaylistSelect(playlist) {
    if (!playlist.can_expand) { await this.handleMaPlaylistPlay(playlist); return; }
    const plId = playlist.item_id || playlist.uri || '';
    if (this._maExpandedId === plId) {
      this._maExpandedId = null;
      this._maPlaylistDetail = null;
      this._maPlaylistTracks = [];
      this._maUpdate?.();
      return;
    }
    this._maExpandedId = plId;
    this._maPlaylistDetail=playlist; this._maPlaylistTracks=[]; this._maPlaylistTracksLoading=true; this._maUpdate?.();
    const ru=playlist._rawMaUri||'';
    try {
      if (this._maWs && this._maWs.readyState === WebSocket.OPEN) {
        try {
          let itemId=''; let providerDomain='library';
          const endDigits = (ru||'').match(/(\d+)$/);
          if (endDigits) itemId=endDigits[1];
          if (!itemId && playlist.item_id) {
            const idDigits = String(playlist.item_id).match(/(\d+)$/);
            if (idDigits) itemId=idDigits[1];
          }
                if (itemId) {
            const plUri=(playlist.uri||ru||'').toLowerCase();
            if (plUri.includes('qqmusic')) providerDomain='qqmusic';
            else { providerDomain = 'library'; }
                    const bResult=await this._maWsSendAndWait('music/playlists/playlist_tracks',{ item_id:String(itemId), provider_instance_id_or_domain:providerDomain, force_refresh:false, allow_dynamic_tracks:false });
                    if (bResult) {
              const items=Array.isArray(bResult)?bResult:[bResult];
                        const tracks=items.filter(it=>!!(it?.name||it?.uri||it?.item_id)&&!(it?.media_type==='folder'||it?.media_type==='playlist'));
                        if (tracks.length>0) this._maPlaylistTracks=tracks.map(t=>({ uri:t.uri||t.item_id||'', name:t.name||t.title||'未知', artist:this._extractArtist(t), album:this._extractAlbum(t), duration:t.duration||0, image_url:this._extractImage(t), track_id:t.item_id||t.uri||'', provider:this._extractProvider(t,playlist.provider) }));
            }
          }
        } catch(e){}
      }
    } catch(e){}
    if (this._maPlaylistTracks.length > 0) playlist.track_count = this._maPlaylistTracks.length;
    // 展开子歌单时也同步到后端 ma_playlist_data
    const mp = this._localMediaEntity();
    if (mp && this._maPlaylistTracks.length) { this._setMaPlaylistApi(mp, this._maPlaylistTracks).catch(() => {}); }
    this._maPlaylistTracksLoading=false; this._maUpdate?.();
  }

  async _stopMaPlayback() {
    // 停止 MA 当前播放：先停 WS 队列，再停 MA 播放器实体
    this._maExpectingEnd = false; // 用户主动停止，不再自动切下一首
    if (this._isMaWsReady() && this._maQueueId) {
      try { this._maWsSend('player_queues/stop', { queue_id: this._maQueueId || this._maPlayerId }); } catch (e) {}
    }
    if (this.maPlayerEntity && this._hass) {
      try { await this._hass.callService('media_player', 'media_stop', { entity_id: this.maPlayerEntity }); } catch (e) {}
    }
  }

  async _playViaEmptyPlaylist(uri, mediaType, closePopupFn, trackMeta, knownTracks) {
    if (!this.maPlaylist) { console.log('[Xiaoshi] 未配置 ma_playlist'); return false; }
    // ★ 0 延迟显示播放列表：已知曲目（knownTracks / trackMeta）可直接构造，
    //   无需等待下面 WS 连接/订阅（那可能耗时 5-8 秒）。playlist 分支无已知曲目，
    //   仍需 WS 展开后在下方 4786 处设置。
    {
      let preTracks = [];
      if (knownTracks && knownTracks.length) {
        preTracks = knownTracks;
      } else if (mediaType === 'track' && trackMeta && (trackMeta.uri || trackMeta.track_id || trackMeta.name)) {
        preTracks = [trackMeta];
      }
      if (preTracks.length) {
        this._currentPlaylistData = { playlist: preTracks.map(it => ({ name: it.name || it.title || '未知', artist: this._extractArtist?.(it) || '', album: this._extractAlbum?.(it) || '', uri: it.uri || it.track_id || it.item_id || '', track_id: it.track_id || it.item_id || it.uri || '' })), repeat_mode: '' };
        this._showPlaylist = true;
        this.requestUpdate();
      }
    }
    // WS 断了就重连
    if (!this._maWsConnected) {
      this._connectMaWs();
      for (let w = 0; w < 50 && !this._maWsConnected; w++) await new Promise(r => setTimeout(r, 100));
    }
    if (this._isMaWsReady() && !this._maPlayerId) { this._subscribeMaQueue(); for (let w = 0; w < 20 && !this._maPlayerId; w++) await new Promise(r => setTimeout(r, 200)); }
    if (!this._isMaWsReady() || !this._maPlayerId) { console.log('[Xiaoshi] MA WS 未就绪'); return false; }
    try {
      // 任何 MA 播放行为前，先停止当前播放内容，避免 play_media 与残留队列冲突报错
      await this._stopMaPlayback();
      // （新模型：不再写入/清空 MA 的 db 歌单；整张列表同步到后端 API，
      //  仅把第一首推送到 MA，后续切歌由前端→后端取下一首再推送。）
      // 计算要添加的全部曲目与即时展示用的曲目列表
      let uris = [uri];
      let addedTracks = [];
      if (knownTracks && knownTracks.length) {
        // 已有完整曲目（如“我喜欢”弹窗已加载的列表）：直接复用，跳过 WS 展开，列表可立即显示
        addedTracks = knownTracks;
        uris = knownTracks.map(it => it.uri || it.track_id || it.item_id || '').filter(Boolean);
        if (!uris.length) uris = [uri];
      } else if (mediaType === 'playlist') {
        const plUriLower = (uri||'').toLowerCase();
        let providerDomain = 'library'; if (plUriLower.includes('qqmusic')) providerDomain = 'qqmusic';
        const digits = String(uri).match(/(\d+)$/);
        if (digits) {
          try {
            const result = await this._maWsSendAndWait('music/playlists/playlist_tracks', { item_id: digits[1], provider_instance_id_or_domain: providerDomain, force_refresh: false, allow_dynamic_tracks: false });
            const items = Array.isArray(result) ? result : (result?.items || []);
            const filtered = items.filter(it => !!(it?.name||it?.uri||it?.item_id) && !(it?.media_type==='folder'||it?.media_type==='playlist'));
            const trackUris = filtered.map(it => it.uri||it.item_id||'').filter(Boolean);
            if (trackUris.length > 0) { uris = trackUris; addedTracks = filtered; }
          } catch(e) {}
        }
      } else if (mediaType === 'track') {
        // 单曲：优先用调用方传入的曲目元数据，保证播放列表区立即显示歌名
        if (trackMeta && (trackMeta.uri || trackMeta.track_id || trackMeta.name)) {
          addedTracks = [trackMeta];
        } else {
          addedTracks = [{ name: '', uri: uri, track_id: uri }];
        }
      }
      // ★ 立即用即将播放的曲目刷新播放列表区（在写入 MA 队列之前），
      //   保证点击播放后列表瞬间出现，不必等 WS 添加/重读完成
      if (addedTracks.length) {
        this._currentPlaylistData = { playlist: addedTracks.map(it => ({ name: it.name || it.title || '未知', artist: this._extractArtist?.(it) || '', album: this._extractAlbum?.(it) || '', uri: it.uri || it.track_id || it.item_id || '', track_id: it.track_id || it.item_id || it.uri || '' })), repeat_mode: '' };
        this._showPlaylist = true;
        this.requestUpdate();
      }
      // ===== 新播放模型：整张列表同步到后端 API，仅把第一首推送到 MA =====
      // 1) 整张列表写入后端 ma_playlist（current_index=0），作为播放位置唯一数据源
      this._maStatuses = addedTracks.map(() => 'unplayed');
      this._maPlayingIndex = -1;
      const mp = this._localMediaEntity();
      if (mp && addedTracks.length) {
        this._setMaPlaylistApi(mp, addedTracks.map(it => ({
          name: it.name || it.title || '',
          artist: this._extractArtist?.(it) || '',
          uri: it.uri || it.track_id || it.item_id || '',
          duration: it.duration || 0,
          image_url: it.image_url || it.cover || it.image || '',
        })), 0).catch(() => {});
      }
      // 2) 仅推送第一首到 MA 播放。后续 下一首/上一首/曲终自动切歌 都改走后端取下一首再推送，
      //    不再把整张歌单灌进 MA 队列由它自驱。
      if (closePopupFn) closePopupFn();
      this._showPlaylist = true;
      this._setChannel('ma');
      this._maOverlay.source = 'qqmusic';
      this._maOverlay.active = true;
      this._activeOverlaySource = 'qqmusic';
      const firstOk = await this._maPlayIndex(0);
      if (!firstOk) console.log('[Xiaoshi][play] 第一首推送失败（WS未就绪/无_queue_id?）');
      return true;
    } catch(e) {
      console.log('[Xiaoshi] _playViaEmptyPlaylist 出错:', e?.message || e);
    }
    return false;
  }

  // 首次打开卡片 / 重连成功后，自动刷新播放列表视图（只触发一次，断连后重置）
  // 同时拉取本地播放 API 内容，保证主卡播放列表区在打开时即显示已有列表（ma 与本地都没有才显示“没有”）
  async _tryAutoRefreshPlaylist() {
    if (this._maPlaylistAutoRefreshed) return;
    this._maPlaylistAutoRefreshed = true;
    if (this.maPlaylist) this._refreshMaPlaylistView(false);
    await this._loadLocalPlaylistFromApi(true);
  }

  // 打开卡片时拉取本地播放 API 内容，填充主卡“播放列表”区域
  // 关键：从后端还原每首的播放状态(status)与当前播放索引(current_index)，
  // 避免刷新网页后全部恢复成未播放；同时把签名同步，避免后续 _playMediaItem 重新写入覆盖状态
  async _loadLocalPlaylistFromApi(refreshUi = true) {
    const mp = this._localMediaEntity();
    if (!mp) return;
    try {
      const data = await this._fetchLocalPlaylist(mp);
      const tracks = Array.isArray(data) ? data : (data?.playlist || []);
      const validStatus = ['unplayed', 'played', 'playing', 'paused'];
      if (Array.isArray(tracks) && tracks.length) {
        const norm = tracks.map(t => ({
          name: t.name || t.title || '',
          artist: t.artist || '',
          uri: t.uri || t.media_content_id || t.url || '',
          duration: t.duration || 0,
          image_url: t.image_url || t.cover_url || t.cover || '',
          media_type: t.media_type || 'music',
          status: validStatus.includes(t.status) ? t.status : 'unplayed',
        })).filter(t => t.uri);
        this._localPlaylist = norm;
        // 还原后端持久化的播放状态
        this._localStatuses = norm.map(t => t.status);
        const ci = data?.current_index;
        this._localCurrentIndex = (typeof ci === 'number' && ci >= 0 && ci < norm.length) ? ci : -1;
        // 同步签名，避免后续 _playMediaItem 因签名不匹配重新写入、把状态重置回 unplayed
        this._localPlaylistSignature = norm.map(t => t.uri).join('|');
        if (refreshUi) this.requestUpdate();
      }
    } catch (e) {}
  }

  // 播放列表实时显示：从后端 API 抓取 ma_playlist（含 current_index）并刷新主卡片视图
  // 新模型下后端是播放位置唯一数据源；switchView=true 时切到播放列表视图
  async _refreshMaPlaylistView(switchView = true) {
    const mp = this._localMediaEntity();
    if (!mp) return;
    try {
      const data = await this._fetchMaPlaylist(mp);
      const raw = (data && data.playlist) || [];
      const tracks = raw
        .filter(it => !!(it?.name || it?.uri) && !(it?.media_type === 'folder' || it?.media_type === 'playlist'))
        .map(it => ({ name: it.name || it.title || '未知', artist: it.artist || '', album: it.album || '', uri: it.uri || '', track_id: it.track_id || it.uri || '', image_url: it.image_url || '' }));
      const curLen = this._currentPlaylistData?.playlist?.length || 0;
      // 仅在读到“不少于当前列表”的曲目时覆盖，避免回写成旧数据
      if (tracks.length >= curLen) {
        this._currentPlaylistData = { playlist: tracks, repeat_mode: '' };
        const ci = data?.current_index;
        if (typeof ci === 'number' && ci >= 0 && ci < tracks.length) this._maPlayingIndex = ci;
      }
      if (switchView) this._showPlaylist = true;
      this.requestUpdate();
    } catch (e) {
      console.log('[Xiaoshi] _refreshMaPlaylistView 出错:', e?.message || e);
      this.requestUpdate();
    }
  }

  // 从后端读取 MA 播放列表（含 current_index）
  async _fetchMaPlaylist(mp) {
    return this._localApiCall(`/playlist?media_player=${encodeURIComponent(mp || '')}`, 'GET');
  }

  // 播放整个歌单（统一通过空播放列表）
  async handleMaPlaylistPlay(playlist) {
    const ru = playlist._rawMaUri || ''; const su = playlist.uri || playlist.item_id || '';
    const playUri = su || ru;
    if (!playUri) { this._maPlaylistsError = '播放失败: 歌单 URI 为空'; this._maUpdate?.(); return; }
    // 清空本地播放 api 记录（MA 模式下本地列表不显示）
    if (this._localPlaylist && this._localPlaylist.length) {
      await this._clearLocalPlaylist(this._localMediaEntity());
      this._localPlaylist = [];
      this._localStatuses = [];
      this._localCurrentIndex = -1;
      this._localPlaylistSignature = '';
    }
    this._maPlayingIndex = -1;
    this._setChannel('ma');
    this._pauseOtherChannelsForMa();
    // 播放单个歌单即写后端 ma_playlist_data，供模式推导（ma 有曲目 → MA 模式）
    { const mp = this._localMediaEntity(); if (mp) { this._setMaPlaylistApi(mp, [{ name: playlist.name || playlist.title || '', artist: playlist.artist || '', uri: playUri, duration: 0, image_url: playlist.image_url || playlist.artwork_url || '' }]).catch(() => {}); } }
    if (!this.maPlaylist) { this._maPlaylistsError = '请先配置播放列表参数 (ma_playlist)'; this._maUpdate?.(); return; }
    this._maOverlay.source = 'qqmusic';
    this._maOverlay.active = true;
    this._activeOverlaySource = 'qqmusic';
    this._maPlaylistPlaying = playUri; this._maUpdate?.();
    try {
      if (await this._playViaEmptyPlaylist(playUri, 'playlist', () => this._maPopupClose?.())) return;
      throw new Error('播放失败');
    } catch (e) { this._maPlaylistsError = '播放失败: ' + e.message; }
    finally { this._maPlaylistPlaying = ''; this._maUpdate?.(); }
  }

  // 播放歌单中的单曲
  async handleMaPlaylistTrackPlay(track) {
    const mu = track.uri || track.track_id || '';
    if (!mu) { this._maPlaylistsError = '播放失败: 歌曲 URI 为空'; this._maUpdate?.(); return; }
    // 清空本地播放 api 记录（MA 模式下本地列表不显示）
    if (this._localPlaylist && this._localPlaylist.length) {
      await this._clearLocalPlaylist(this._localMediaEntity());
      this._localPlaylist = [];
      this._localStatuses = [];
      this._localCurrentIndex = -1;
      this._localPlaylistSignature = '';
    }
    this._maPlayingIndex = -1;
    this._setChannel('ma');
    this._pauseOtherChannelsForMa();
    this._lastPlaySource = 'qqmusic'; try { localStorage.setItem(this._getLastSourceKey(), 'qqmusic'); } catch (e) {}
    // 播放单首即写后端 ma_playlist_data，供模式推导（ma 有曲目 → MA 模式）
    { const mp = this._localMediaEntity(); if (mp) { this._setMaPlaylistApi(mp, [{ name: track.name || '', artist: track.artist || '', uri: mu, duration: track.duration || 0, image_url: track.image_url || track.artwork_url || '' }]).catch(() => {}); } }
    if (!this.maPlaylist) { this._maPlaylistsError = '请先配置播放列表参数 (ma_playlist)'; this._maUpdate?.(); return; }
    this._maPlaylistPlaying = mu; this._maUpdate?.();
    this._activeOverlaySource = 'qqmusic';
    const MIOT_FAKE_TRACKS3 = new Set(['请欣赏', '请欣赏（音乐）', '暂无播放', '正在加载', 'QQ音乐', '无音乐播放']);
    const isPlaylistTrackFake = !track.name || MIOT_FAKE_TRACKS3.has(track.name);
    if (!isPlaylistTrackFake) {
      this._reportNowPlayingData({
        title: track.name || '',
        artist: track.artist || '',
        cover_url: track.image_url || track.artwork_url || '',
        source: 'qqmusic',
        song_id: track.track_id || track.uri || '',
      }, 'ma');
    }
    try {
      if (await this._playViaEmptyPlaylist(mu, 'track', () => this._maPopupClose?.(), track)) return;
      throw new Error('播放失败');
    } catch (e) { this._maPlaylistsError = '播放失败: ' + e.message; }
    finally { this._maPlaylistPlaying = ''; this._maUpdate?.(); }
  }

  // 工具函数：提取歌曲属性
  _extractArtist(t) {
    if (!t) return '';
    if (typeof t.artist === 'string' && t.artist) return t.artist;
    if (t.artist?.name) return t.artist.name;
    if (Array.isArray(t.artists) && t.artists.length) {
      return t.artists.map(a => a?.name || a?.display_name || a || '').filter(Boolean).join(', ');
    }
    if (t.display_artist) return t.display_artist;
    return '';
  }

  _extractAlbum(t) {
    if (!t) return '';
    if (typeof t.album === 'string' && t.album) return t.album;
    if (t.album?.name) return t.album.name;
    return '';
  }

  _extractImage(t) { return t?.image_url || t?.artwork_url || t?.metadata?.artwork_url || ''; }

  _extractProvider(t, fb) { return t?.provider || fb || '未知'; }

  // ========== 我喜欢相关 ==========

  // 处理收藏当前歌曲
  _isCurrentSongFavorite() {
    if (!this.maFavoritePlaylist || this._favTracks.length === 0) return false;
    const curTitle = (this._overlayTitle || '').toLowerCase().trim();
    const curArtist = (this._overlayArtist || '').toLowerCase().trim();
    if (!curTitle) return false;
    return this._favTracks.some(t => {
      const tName = (t.name || '').toLowerCase().trim();
      const tArtist = (t.artist || '').toLowerCase().trim();
      return tName === curTitle || (tName && curTitle.includes(tName)) || (curTitle && tName.includes(curTitle)) ||
        (curArtist && tArtist && (tArtist.includes(curArtist) || curArtist.includes(tArtist)));
    });
  }

  // 从 MA 获取我喜欢歌单的曲目列表（仅 WS）
  async _fetchFavoriteTracks(uri) {
    const ru = uri;
    try {
      // 尝试 WS 获取曲目
      if (this._maWs && this._maWs.readyState === WebSocket.OPEN) {
        const endDigits = ru.match(/(\d+)$/);
        if (endDigits) {
          try {
            const bResult = await this._maWsSendAndWait('music/playlists/playlist_tracks', { item_id: endDigits[1], provider_instance_id_or_domain: 'library', force_refresh: false, allow_dynamic_tracks: false });
            if (bResult) {
              const items = Array.isArray(bResult) ? bResult : [bResult];
              this._favTracks = items.filter(it => !!(it?.name || it?.uri || it?.item_id) && !(it?.media_type === 'folder' || it?.media_type === 'playlist'))
                .map(t => ({ uri: t.uri || t.item_id || '', name: t.name || t.title || '未知', artist: this._extractArtist(t), album: t.album?.name || '', duration: t.duration || 0, image_url: this._extractImage(t), track_id: t.item_id || t.uri || '', provider: t.provider || 'library' }));
            }
          } catch (e) {}
        }
      }
      if (this._favTracks.length === 0) this._favError = '获取曲目失败，请检查 MA 连接';
    } catch (e) { this._favError = '出错: ' + (e.message || e); }
    finally { this._favLoading = false; this._favUpdate?.(); }
  }

  // 播放我喜欢歌单全部
  async _playFavoriteAll() {
    const fav = this.maFavoritePlaylist;
    if (!fav) return;
    this._favPlaying = fav;
    const maTe = this.maPlayerEntity;
    const te = maTe || this.xiaomiMiotEntity;
    if (!this._hass || !te) return;
    if (!this.maPlaylist) return;
    // 清空本地播放 api 记录（MA 模式下本地列表不显示）
    if (this._localPlaylist && this._localPlaylist.length) {
      await this._clearLocalPlaylist(this._localMediaEntity());
      this._localPlaylist = [];
      this._localStatuses = [];
      this._localCurrentIndex = -1;
      this._localPlaylistSignature = '';
    }
    this._setChannel('ma'); this._pauseOtherChannelsForMa();
    // 把当前“我喜欢”曲目显式写后端 ma_playlist_data（不依赖 _playViaEmptyPlaylist 内部展开，避免展开失败写空）
    { const mp = this._localMediaEntity(); if (mp && this._favTracks.length) { this._setMaPlaylistApi(mp, this._favTracks).catch(() => {}); } }
    this._maOverlay.source = 'qqmusic'; this._maOverlay.active = true; this._activeOverlaySource = 'qqmusic';
    // 立即显示“我喜欢”播放列表（弹窗已加载好的曲目），无需等待 WS，列表瞬间出现
    if (this._favTracks.length) {
      this._currentPlaylistData = { playlist: this._favTracks.map(it => ({ name: it.name || '未知', artist: it.artist || '', album: it.album || '', uri: it.uri || it.track_id || '', track_id: it.track_id || it.uri || '' })), repeat_mode: '' };
      this._showPlaylist = true;
    }
    this._favUpdate?.();
    this.requestUpdate();
    try {
      await this._playViaEmptyPlaylist(fav, 'playlist', () => this._favPopupClose?.(), null, this._favTracks);
    } catch (e) {} finally { this._favPlaying = ''; this._favUpdate?.(); this.requestUpdate(); }
  }

  // 播放我喜欢中的单曲
  async _playFavoriteTrack(track) {
    const mu = track.uri || track.track_id || '';
    if (!mu) return;
    this._favPlaying = mu;
    const maTe = this.maPlayerEntity;
    const te = maTe || this.xiaomiMiotEntity;
    if (!this._hass || !te) return;
    if (!this.maPlaylist) return;
    // 清空本地播放 api 记录（MA 模式下本地列表不显示）
    if (this._localPlaylist && this._localPlaylist.length) {
      await this._clearLocalPlaylist(this._localMediaEntity());
      this._localPlaylist = [];
      this._localStatuses = [];
      this._localCurrentIndex = -1;
      this._localPlaylistSignature = '';
    }
    this._setChannel('ma'); this._pauseOtherChannelsForMa();
    // 把单曲显式写后端 ma_playlist_data（ma 有曲目 → MA 模式）
    { const mp = this._localMediaEntity(); if (mp) { this._setMaPlaylistApi(mp, [{ name: track.name || '', artist: track.artist || '', uri: mu, duration: track.duration || 0, image_url: track.image_url || track.artwork_url || '' }]).catch(() => {}); } }
    this._maOverlay.source = 'qqmusic'; this._maOverlay.active = true; this._activeOverlaySource = 'qqmusic';
    this._favUpdate?.();
    try {
      await this._playViaEmptyPlaylist(mu, 'track', () => this._favPopupClose?.(), track);
    } catch (e) {}
    finally { this._favPlaying = ''; this._favUpdate?.(); this.requestUpdate(); }
  }

  // 从我喜欢中移除歌曲
  async _removeFavoriteTrack(track, idx) {
    const trackId = track.track_id || track.uri || '';
    if (!trackId) return;
    this._favTracks = this._favTracks.filter((_, i) => i !== idx);
    this._favUpdate?.();
    this.requestUpdate();
    try {
      if (this._maWs && this._maWs.readyState === WebSocket.OPEN) {
        await this._maWsSendAndWait('music/favorites/remove_item', { media_type: 'track', library_item_id: trackId });
      }
    } catch (e) {}
  }

  // ========== 歌词 / 控制 ==========

  // 初始化歌词缓存
  _initLyricsCache() {
    try {
      const cached = localStorage.getItem("music_player_lyrics_cache");
      if (cached) {
        const cacheData = JSON.parse(cached);
        const now = Date.now();
        const MIOT_FAKE_CACHE = new Set(['请欣赏', '请欣赏（音乐）', '暂无播放', '正在加载', 'QQ音乐', '无音乐播放']);
        Object.keys(cacheData).forEach(key => {
          if (now - cacheData[key].timestamp > 3600000) {
            delete cacheData[key];
            return;
          }
          for (const fake of MIOT_FAKE_CACHE) {
            if (key.startsWith(fake)) {
              delete cacheData[key];
              break;
            }
          }
        });
        this.lyricsCache = new Map(Object.entries(cacheData));
        this._saveCache();
      }
    } catch (error) {
      this.lyricsCache = new Map();
    }
  }

  // 过滤标题和艺术家
  _isPseudoTitle(title) {
    if (!title) return true;
    const PSEUDO = ['请欣赏', '暂无播放', '暂未播放', 'QQ音乐', '正在加载', '加载中', '无音乐播放'];
    return PSEUDO.some(p => title.includes(p));
  }

  // 过滤艺术家
  _isPseudoArtist(_title, artist) {
    if (!artist) return false;
    if (artist.includes('心灵之谜')) return true;
    return false;
  }

  // 过滤标题
  _filterTitle(title) {
    return this._isPseudoTitle(title) ? '' : title;
  }

  // 过滤艺术家
  _filterArtist(title, artist) {
    return this._isPseudoArtist(title, artist) ? '' : artist;
  }

  // 注入播放器样式
  _injectPlayerStyles() {
    if (document.getElementById('xiaoshi-player-global-styles')) return;
    const s = document.createElement('style');
    s.id = 'xiaoshi-player-global-styles';
    s.textContent = `
      .media-player-popup{display:flex;flex-direction:column;overflow:hidden;}
      .media-player-top-bar{display:flex;align-items:center;justify-content:center;padding:12px 16px;border-bottom:1px solid var(--b-divider,rgba(0,0,0,0.06));flex-shrink:0;}
      .media-player-top-bar-title{font-size:16px;font-weight:600;color:var(--b-fg,#212121);}
      .media-player-view-area{flex:1;overflow-y:auto;position:relative;-webkit-overflow-scrolling:touch;transition:opacity 0.15s;}
      .media-player-bottom-bar{display:flex;justify-content:space-around;border-top:1px solid var(--b-divider,rgba(0,0,0,0.06));padding:4px 0;flex-shrink:0;background:var(--b-bg,#fff);}
      .media-player-bg-wrap{position:absolute;inset:0;z-index:0;}
      .media-player-bg-img{position:absolute;inset:0;object-fit:cover;width:100%;height:100%;filter:blur(40px) brightness(0.5);transition:opacity 0.6s;}
      .media-player-bg-overlay{position:absolute;inset:0;background:rgba(0,0,0,0.3);}
      .media-player-scroll-area{position:relative;z-index:1;display:flex;flex-direction:column;flex:1;overflow-y:auto;padding:16px;-webkit-overflow-scrolling:touch;}
      .media-player-top-section[data-mode="lyrics"]{display:flex;flex-direction:column;margin-bottom:0;}
      .media-player-top-section[data-mode="vertical"]{display:flex;flex-direction:column;align-items:center;margin-bottom:8px;}
      .media-player-header-row{display:flex;align-items:center;gap:14px;flex-shrink:0;}
      .media-player-cover-box{width:260px;height:260px;border-radius:16px;overflow:hidden;flex-shrink:0;margin-bottom:14px;box-shadow:0 8px 30px rgba(0,0,0,0.2);display:flex;align-items:center;justify-content:center;transition:all 0.3s;}
      .media-player-meta{text-align:center;margin-bottom:10px;flex:1;}
      .media-player-meta-title{font-size:17px;font-weight:700;color:var(--b-fg,#212121);margin-bottom:4px;}
      .media-player-meta-artist{font-size:12px;color:var(--b-muted,#999);margin-bottom:2px;}
      .media-player-meta-filename{font-size:10px;color:var(--b-muted,#aaa);margin-bottom:2px;}
      .media-player-lyrics-wrap{display:none;height:220px;overflow:hidden;margin-bottom:10px;}
      .media-player-lyrics-scroll{height:100%;overflow-y:auto;padding:8px 0;text-align:center;}
      .media-player-lyrics-line{padding:4px 0;font-size:14px;transition:all 0.3s;}
      .media-player-lyrics-line-active{color:var(--b-accent,#3498db);font-weight:600;font-size:15px;}
      .media-player-lyrics-line-inactive{color:var(--b-muted,#999);opacity:0.6;}
      .media-player-progress-div{margin-bottom:4px;}
      .media-player-progress-track{width:100%;height:5px;background:var(--b-slider,rgba(0,0,0,0.08));border-radius:3px;cursor:pointer;position:relative;}
      .media-player-progress-fill{height:100%;background:var(--b-accent,#3498db);border-radius:3px;transition:width 0.3s;}
      .media-player-time-row{display:flex;justify-content:space-between;margin-top:4px;}
      .media-player-time-label{font-size:11px;color:var(--b-muted,#999);}
      .media-player-ctrl-wrap{margin-top:auto;display:flex;flex-direction:column;gap:6px;}
      .media-player-ctrl-row1{display:flex;justify-content:center;align-items:center;gap:12px;}
      .media-player-ctrl-btn{display:flex;align-items:center;justify-content:center;width:40px;height:40px;border:none;border-radius:50%;background:var(--b-btnBg,rgba(0,0,0,0.05));cursor:pointer;color:var(--b-icon,#555);transition:all 0.15s;}
      .media-player-ctrl-btn:active{transform:scale(0.92);}
      .media-player-play-btn{display:flex;align-items:center;justify-content:center;width:52px;height:52px;border:none;border-radius:50%;background:var(--b-accent,#3498db);cursor:pointer;color:#fff;transition:all 0.15s;box-shadow:0 4px 16px rgba(52,152,219,0.3);}
      .media-player-play-btn:active{transform:scale(0.92);}
      .media-player-ctrl-row2{display:flex;justify-content:space-between;gap:8px;}
      .media-player-pill-btn{flex:1;display:flex;align-items:center;justify-content:center;gap:6px;padding:8px 12px;border:1px solid var(--b-cardBorder,rgba(0,0,0,0.1));border-radius:10px;background:var(--b-btnBg,rgba(0,0,0,0.05));cursor:pointer;color:var(--b-fg,#212121);font-size:12px;font-weight:500;transition:all 0.15s;}
      .media-player-vol-row{display:flex;align-items:center;gap:8px;margin-bottom:6px;}
      .media-player-vol-icon{flex-shrink:0;cursor:pointer;color:var(--b-icon,#555);}
      .media-player-volume-slider{flex:1;height:4px;-webkit-appearance:none;appearance:none;background:var(--b-slider,rgba(0,0,0,0.08));border-radius:2px;outline:none;}
      .media-player-vol-label{font-size:12px;color:var(--b-muted,#999);min-width:36px;text-align:right;}
      .media-player-tab-bar{display:flex;gap:0;padding:0;border-bottom:1px solid var(--b-divider,rgba(0,0,0,0.06));overflow-x:auto;flex-shrink:0;scrollbar-width:none;}
      .media-player-playlist-header{background:var(--b-cardBg,transparent);border:1px solid var(--b-cardBorder,rgba(0,0,0,0.06));border-radius:12px;overflow:hidden;margin-bottom:6px;transition:border-color 0.2s;cursor:pointer;user-select:none;}
      .media-player-playlist-header:hover{border-color:var(--b-accent,rgba(52,152,219,0.25));background:var(--b-hoverBg,rgba(0,0,0,0.02));}
      .media-player-item{display:flex;align-items:center;gap:8px;padding:8px 12px 8px 28px;cursor:pointer;border-radius:8px;transition:background 0.15s;}
      .media-player-item:hover{background:var(--b-hoverBg,rgba(0,0,0,0.03));}

      /* 对话气泡样式 */
      .conversation-bubble-content{display:flex;flex-direction:column;height:100%;}
      .conv-header{padding:12px 16px;border-bottom:1px solid var(--conv-divider,rgba(0,0,0,0.06));display:flex;align-items:center;flex-shrink:0;}
      .conv-header-title{font-size:14px;font-weight:600;color:var(--conv-fg,#212121);display:flex;align-items:center;gap:6px;}
      .conv-loading-top{display:flex;align-items:center;justify-content:center;gap:6px;padding:10px;color:var(--conv-muted,#999);font-size:12px;flex-shrink:0;}
      .conv-spin{animation:conv-spin 1s linear infinite;}
      @keyframes conv-spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
      .conv-list{flex:1;overflow-y:auto;padding:12px 16px;-webkit-overflow-scrolling:touch;}
      .conv-time-divider{text-align:center;font-size:11px;color:var(--conv-muted,#aaa);padding:8px 0;}
      .conv-msg{display:flex;gap:8px;margin-bottom:14px;}
      .conv-msg-ai{flex-direction:row;padding-right:40px;}
      .conv-msg-user{flex-direction:row-reverse;padding-left:40px;}
      .conv-avatar{flex-shrink:0;width:30px;height:30px;display:flex;align-items:center;justify-content:center;}
      .conv-avatar-icon{--mdc-icon-size:24px;color:var(--conv-muted,#999);}
      .conv-avatar-img{width:30px;height:30px;border-radius:50%;object-fit:cover;}
      .conv-bubble{padding:10px 14px;border-radius:16px;font-size:14px;line-height:1.4;word-break:break-word;}
      .conv-bubble-ai{background:var(--conv-ai-bubble,rgba(0,0,0,0.06));color:var(--conv-fg,#212121);border-top-left-radius:4px;}
      .conv-bubble-user{background:var(--conv-accent,#3498db);color:#fff;border-top-right-radius:4px;}
      .conv-bubble-wrap{position:relative;}
      .conv-latest-tag{position:absolute;top:-8px;right:0;background:#e74c3c;color:#fff;font-size:9px;padding:1px 6px;border-radius:8px;font-weight:500;}
      .conv-alarm-card{background:rgba(231,76,60,0.08);border:1px solid rgba(231,76,60,0.2);border-radius:12px;padding:10px 14px;margin-top:6px;}
      .conv-alarm-header{display:flex;align-items:center;gap:6px;font-size:12px;color:#e74c3c;font-weight:500;margin-bottom:4px;}
      .conv-alarm-time{font-size:24px;font-weight:300;color:var(--conv-fg,#212121);text-align:center;}
      .conv-empty{display:flex;flex-direction:column;align-items:center;gap:10px;padding:40px;color:var(--conv-muted,#999);font-size:13px;}
      .conv-error{display:flex;justify-content:center;align-items:center;gap:8px;padding:16px;flex-shrink:0;}
      .conv-error-text{color:#e74c3c;font-size:13px;}
      .conv-retry-btn{padding:6px 16px;border:1px solid var(--conv-divider,rgba(0,0,0,0.1));border-radius:8px;cursor:pointer;background:var(--conv-ai-bubble,rgba(0,0,0,0.05));color:var(--conv-fg,#212121);font-size:12px;}
      .conv-load-fail-tip,.conv-no-more-tip{text-align:center;padding:8px;color:var(--conv-muted,#999);font-size:11px;}

      /* 输入框区域 */
      .conv-input-area{display:flex;align-items:center;gap:6px;padding:8px 12px;border-top:1px solid var(--conv-divider,rgba(0,0,0,0.08));background:var(--conv-bg,#fff);flex-shrink:0;}
      .conv-input{flex:1;padding:8px 12px;border:1px solid var(--conv-divider,rgba(0,0,0,0.12));border-radius:20px;background:var(--conv-input-bg,rgba(0,0,0,0.04));color:var(--conv-fg,#212121);font-size:14px;outline:none;font-family:inherit;min-width:0;}
      .conv-input:focus{border-color:var(--conv-accent,#3498db);}
      .conv-send-btn,.conv-play-btn{display:flex;align-items:center;justify-content:center;width:36px;height:36px;border:none;border-radius:50%;cursor:pointer;background:var(--conv-accent,#3498db);color:#fff;flex-shrink:0;transition:opacity 0.15s;}
      .conv-send-btn:disabled,.conv-play-btn:disabled{opacity:0.4;cursor:default;}
      .conv-send-btn:active:not(:disabled),.conv-play-btn:active:not(:disabled){transform:scale(0.92);}
      .conv-quick-input-btn{display:flex;align-items:center;justify-content:center;width:36px;height:36px;border:none;border-radius:50%;cursor:pointer;background:var(--conv-ai-bubble,rgba(0,0,0,0.08));color:var(--conv-accent,#f39c12);flex-shrink:0;transition:all 0.15s;}
      .conv-quick-input-btn.active{background:var(--conv-accent,#f39c12);color:#fff;}

      /* 快捷输入面板 */
      .conv-quick-input-panel{position:absolute;bottom:100%;left:0;right:0;margin-bottom:4px;background:var(--conv-bg,#fff);border-radius:12px;box-shadow:0 -4px 16px rgba(0,0,0,0.12);overflow:hidden;z-index:10;max-height:240px;overflow-y:auto;}
      .conv-quick-input-header{display:flex;align-items:center;justify-content:space-between;padding:8px 14px;border-bottom:1px solid var(--conv-divider,rgba(0,0,0,0.06));font-size:12px;font-weight:600;color:var(--conv-muted,#999);}
      .conv-quick-input-close{background:none;border:none;cursor:pointer;color:var(--conv-muted,#999);padding:2px;display:flex;align-items:center;}
      .conv-quick-input-list{display:flex;flex-wrap:wrap;gap:8px;padding:12px;}
      .conv-quick-input-item{display:inline-block;padding:8px 14px;font-size:13px;color:#fff;cursor:pointer;border-radius:18px;background:linear-gradient(135deg,#3498db,#2980b9);transition:all 0.15s;box-shadow:0 2px 6px rgba(52,152,219,0.2);white-space:nowrap;}
      .conv-quick-input-item:active{transform:scale(0.95);opacity:0.85;}
      .conv-quick-input-empty{padding:20px;text-align:center;color:var(--b-muted,#999);font-size:13px;}

      .xiaoshi-toast{animation:xiaoshi-toast-in 0.3s ease;}
      @keyframes xiaoshi-toast-in{from{opacity:0;transform:translateX(-50%) translateY(10px);}to{opacity:1;transform:translateX(-50%) translateY(0);}}

      /* ── 弹窗通用组件 ── */
      .ma-popup-titlebar{display:flex;align-items:center;justify-content:center;padding:14px 16px;flex-shrink:0;}
      .ma-popup-scroll{flex:1;overflow-y:auto;padding:10px;-webkit-overflow-scrolling:touch;}
      .ma-popup-playlist-card{border:1px solid var(--t-divider,rgba(0,0,0,0.06));border-radius:12px;margin-bottom:6px;cursor:pointer;transition:border-color 0.2s;user-select:none;}
      .ma-popup-card-header{display:flex;align-items:center;gap:8px;padding:10px 8px;}
      .ma-popup-track-item{display:flex;align-items:center;gap:8px;padding:6px 8px;border-radius:6px;cursor:pointer;}
      .ma-popup-track-item:hover{background:var(--t-hover,rgba(0,0,0,0.03));}
      .ma-popup-track-num{font-size:11px;width:20px;text-align:center;flex-shrink:0;}
      .ma-popup-track-info{flex:1;min-width:0;}
      .ma-popup-track-name{font-size:12px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
      .ma-popup-track-meta{font-size:10px;margin-top:1px;}
      .ma-popup-empty,.ma-popup-loading{text-align:center;padding:20px;font-size:13px;}
      .ma-popup-btn-sm{display:inline-flex;align-items:center;gap:3px;padding:4px 10px;border-radius:6px;cursor:pointer;background:transparent;font-size:11px;font-weight:500;flex-shrink:0;}
    `;
    document.head.appendChild(s);
  }

  // 检查歌曲是否有变化
  _checkSongChange(state) {
    if (!state || !state.attributes) return false;
    const entityTitle = state.attributes.media_title || '';
    const entityArtist = state.attributes.media_artist || '';
    // 有歌曲信息就加载歌词，不区分播放状态
    if (this.showLyrics && entityTitle && entityArtist && !this._isPseudoTitle(entityTitle)) {
      this.loadLyricsForCurrentSong();
    }
    const entityPlaying = ['playing', 'Playing', '播放', '播放中', '正在播放'].includes(state.state);
    const isEntityFake = !entityTitle || this._isPseudoTitle(entityTitle);
    const hasRealEntityData = entityPlaying && !isEntityFake && entityTitle;
    const miotWantsToTakeover = hasRealEntityData;
    if (this._activeChannel === 'local') {
      if (this._localOverlay.active && this._localOverlay.title) {
        return false;
      }
      this._activeChannel = '';
    }
    if (this._activeChannel === 'ma') {
      if (this._maOverlay.active && this._maOverlay.source) {
        return false;
      }
      this._activeChannel = '';
    }
    if (this._localOverlay.source === 'local') {
      if (miotWantsToTakeover) {
        if (this._localOverlay.title) {
          this._reportNowPlayingData({
            title: this._localOverlay.title,
            artist: this._localOverlay.artist,
            cover_url: this._localOverlay.coverUrl,
            source: 'local',
            status: 'paused',
          }, 'local');
        }
        this._localOverlay.title = '';
        this._localOverlay.artist = '';
        this._localOverlay.coverUrl = '';
        this._localOverlay.source = '';
        this._localOverlay.active = false;
      } else {
        const overlayTitle = this._localOverlay.title || '';
        const overlayArtist = this._localOverlay.artist || '';
        const contentId = (state.attributes.media_content_id || '').toLowerCase();
        const isLikelyLocal = !entityTitle
          || contentId.includes('media-source://')
          || contentId.includes('/media/local')
          || !contentId
          || ((contentId.includes('music_assistant') || contentId.includes('mass')) && this._localOverlay.source === 'local');
        if (!isLikelyLocal && entityTitle && overlayTitle && entityTitle !== overlayTitle) {
          this._localOverlay.title = '';
          this._localOverlay.artist = '';
          this._localOverlay.coverUrl = '';
          this._localOverlay.source = '';
          this._localOverlay.active = false;
          this._clearNowPlayingLocalStorage('local');
        } else if (overlayTitle !== this._localLastSongTitle || overlayArtist !== this._localLastSongArtist) {
          this._localLastSongTitle = overlayTitle;
          this._localLastSongArtist = overlayArtist;
          if (this.showLyrics && overlayTitle && overlayArtist) {
            this.loadLyricsForCurrentSong();
          }
          return true;
        }
        return false;
      }
    }

    if (this._maOverlay.source && ['qqmusic','ma_search'].includes(this._maOverlay.source)) {
      if (miotWantsToTakeover) {
        if (this._maOverlay.title) {
          this._reportNowPlayingData({
            title: this._maOverlay.title,
            artist: this._maOverlay.artist,
            cover_url: this._maOverlay.coverUrl,
            source: this._maOverlay.source,
            status: 'paused',
          }, 'ma');
        }
        if (this._isMaWsReady() && this._maPlayerId) {
          try {
            this._maWsSend('player_queues/stop', { queue_id: this._maQueueId || this._maPlayerId });
          } catch(e) {}
        }
        this._maOverlay.title = '';
        this._maOverlay.artist = '';
        this._maOverlay.coverUrl = '';
        this._maOverlay.source = '';
        this._maOverlay.active = false;
        this._overlayLyrics = [];
      } else {
        if (this._isMaWsReady()) {
          return false;
        }
        return false;
      }
    }
    if (this._isMaWsReady() && !miotWantsToTakeover) {
      // miot 有真实播放数据时，继续走 miot 歌词加载
      if (!miotWantsToTakeover) return false;
    }
    if (!this._miotOverlay.source && !this._localOverlay.source && !this._maOverlay.source) {
      const miotRestored = this._restoreNowPlayingFromLocalStorage('miot');
      if (miotRestored) {
        this._setChannel('miot');
        this._overlayTitle = miotRestored.title || '';
        this._overlayArtist = miotRestored.artist || '';
        this._overlayCoverUrl = miotRestored.cover_url || '';
        this._activeOverlaySource = miotRestored.source || 'miot';
        this._miotLastSongTitle = miotRestored.title || '';
        this._miotLastSongArtist = miotRestored.artist || '';
        if (!this._mediaPlayerState) this._mediaPlayerState = {};
        if (!this._mediaPlayerState.currentItem && (miotRestored.media_content_id || miotRestored.title)) {
          this._mediaPlayerState.currentItem = {
            title: miotRestored.title || '',
            artist: miotRestored.artist || '',
            media_content_id: miotRestored.media_content_id || '',
            media_type: miotRestored.media_type || 'music',
          };
        }
      }
    }
    this._setChannel('miot');
    let currentTitle = entityTitle;
    let currentArtist = entityArtist;
    if (!currentTitle || !currentArtist) {
      const otherState = this.xiaomiMiotState;
      if (otherState && otherState.attributes) {
        const otherTitle = otherState.attributes.media_title;
        const otherArtist = otherState.attributes.media_artist;
        if (otherTitle && otherArtist) {
          currentTitle = otherTitle;
          currentArtist = otherArtist;
        }
      }
    }
    // 电台模式：忽略"旧歌名回潮"。点击切歌后实体 media_title 可能瞬时闪回上一首，
    // _miotStaleTitle 记录了动作前的歌名，等于它的回潮直接忽略，只接受不同的新歌名。
    if (this._activeChannel === 'miot' && this._miotStaleTitle && currentTitle === this._miotStaleTitle) {
      return false;
    }
    if (currentTitle !== this._miotLastSongTitle || currentArtist !== this._miotLastSongArtist) {
      this._miotLastSongTitle = currentTitle;
      this._miotLastSongArtist = currentArtist;
      const MIOT_FAKE = new Set(['请欣赏', '请欣赏（音乐）', '暂无播放', '正在加载', 'QQ音乐', '无音乐播放']);
      const isCurrentFake = !currentTitle || MIOT_FAKE.has(currentTitle);
      if (currentTitle && currentArtist && !isCurrentFake) {
        this._miotOverlay.title = currentTitle;
        this._miotOverlay.artist = currentArtist;
        this._miotOverlay.coverUrl = state.attributes?.entity_picture || state.attributes?.media_image_url || '';
        this._miotOverlay.source = 'miot';
        this._miotOverlay.active = true;
        this._reportNowPlayingData({
          title: currentTitle,
          artist: currentArtist,
          cover_url: state.attributes?.entity_picture || state.attributes?.media_image_url || '',
          source: 'miot',
        }, 'miot');
      } else if (isCurrentFake) {
        this._miotOverlay.title = '';
        this._miotOverlay.artist = '';
        this._miotOverlay.active = false;
      }
      if (this.showLyrics && currentTitle && currentArtist && !isCurrentFake) {
        this.loadLyricsForCurrentSong();
      }
      return true;
    }
    return false;
  }

  // 歌词进度调整方法
  handleLyricsTimeDecrease() {
    this._handleClick();
    this.smoothCurrentTime = Math.max(0, this.smoothCurrentTime - 1000);
    this.lastUpdateTime = Date.now();
    this.lyricsTimeAdjustment -= 1000;
    this.updateCurrentLyricIndex(this.smoothCurrentTime);
    this.requestUpdate();
    const totalSeconds = this.lyricsTimeAdjustment / 1000;
    const sign = totalSeconds >= 0 ? '+' : '';
    this.showAdjustmentToast(`歌词进度 -1秒 (总计 ${sign}${totalSeconds}秒)`);
  }

  // 歌词进度调整方法
  handleLyricsTimeIncrease() {
    this._handleClick();
    this.smoothCurrentTime = this.smoothCurrentTime + 1000;
    this.lastUpdateTime = Date.now();
    this.lyricsTimeAdjustment += 1000;
    this.updateCurrentLyricIndex(this.smoothCurrentTime);
    this.requestUpdate();
    const totalSeconds = this.lyricsTimeAdjustment / 1000;
    const sign = totalSeconds >= 0 ? '+' : '';
    this.showAdjustmentToast(`歌词进度 +1秒 (总计 ${sign}${totalSeconds}秒)`);
  }

  // 重置歌词进度
  handleLyricsTimeReset() {
    this._handleClick();
    this.initSmoothTimeOnce();
    this.lyricsTimeAdjustment = 0;
    this.updateCurrentLyricIndex(this.smoothCurrentTime);
    this.requestUpdate();
    this.showAdjustmentToast('已重置歌词进度 (总计 0秒)');
  }

  // 显示歌词调整弹窗
  showAdjustmentToast(message) {
    if (this.adjustmentToast.timer) {
      clearTimeout(this.adjustmentToast.timer);
    }
    this.adjustmentToast.message = message;
    this.adjustmentToast.show = true;
    this.requestUpdate();
    this.adjustmentToast.timer = setTimeout(() => {
      this.adjustmentToast.show = false;
      this.adjustmentToast.timer = null;
      this.requestUpdate();
    }, 1000);
  }

  // 为当前播放歌曲加载歌词
  async loadLyricsForCurrentSong() {
    this._lyricsLoading = true;
    try {
      // 优先从 hass 实时状态读取，再 fallback 到缓存
      let title, artist;
      for (const eid of [this.xiaomiMiotEntity].filter(Boolean)) {
        const s = this._hass?.states?.[eid];
        if (s?.attributes?.media_title && s.attributes.media_artist) {
          if (!this._isPseudoTitle(s.attributes.media_title)) {
            title = s.attributes.media_title;
            artist = s.attributes.media_artist;
            break;
          }
        }
      }
      if (!title) {
        const primaryState = this.xiaomiMiotState;
        const savedItem = this._mediaPlayerState?.currentItem;
        title = this._overlayTitle || savedItem?.title || primaryState?.attributes?.media_title;
        artist = this._overlayArtist || savedItem?.artist || primaryState?.attributes?.media_artist;
      }
      if (!title || !artist) {
        this.loadNoLyrics();
        return;
      }
      try {
        await this.searchAndFetchLyrics(title, artist);
      } catch (error) {
        this._localLyricsFallbackOrNoLyrics();
      }
    } finally {
      this._lyricsLoading = false;
    }
  }

  // 本地歌词回退或无歌词
  async _localLyricsFallbackOrNoLyrics() {
    if (this._localOverlay.source !== 'local') {
      this.loadNoLyrics();
      return;
    }
    this.loadNoLyrics();
  }

  // 解析歌词
  parseLyrics(text) {
    if (!text) return [];
    const lines = text.split('\n');
    const lyrics = [];
    const timeRegex = /\[(\d{2}):(\d{2})[\.:(](\d{2,3})\]/g;
    lines.forEach(line => {
      if (!line.trim()) return;
      const matches = [...line.matchAll(timeRegex)];
      if (matches.length > 0) {
        const text = line.replace(timeRegex, '').trim();
        if (!text) return;
        matches.forEach(match => {
          const minutes = parseInt(match[1]);
          const seconds = parseInt(match[2]);
          const milliseconds = parseInt(match[3]);
          const time = minutes * 60 * 1000 + seconds * 1000 + (match[3].length === 2 ? milliseconds * 10 : milliseconds);
          lyrics.push({
            time: time,
            text: text
          });
        });
      }
    });
    return lyrics.sort((a, b) => a.time - b.time);
  }

  // 更新当前歌词索引
  updateCurrentLyricIndex(currentTimeMs) {
    let newIndex = -1;
    if (this.lyrics.length > 0 && currentTimeMs >= this.lyrics[0].time) {
      for (let i = 0; i < this.lyrics.length; i++) {
        const nextLyric = this.lyrics[i + 1];
        
        if (!nextLyric || currentTimeMs < nextLyric.time) {
          newIndex = i;
          break;
        }
      }
      if (newIndex === -1) {
        const lastLyric = this.lyrics[this.lyrics.length - 1];
        if (currentTimeMs > lastLyric.time + 5000) {
          newIndex = this.lyrics.length - 1;
        }
      }
    }
    let newProgress = 0;
    if (newIndex >= 0 && this.lyrics[newIndex]) {
      const currentLyric = this.lyrics[newIndex];
      const nextLyric = this.lyrics[newIndex + 1];
      if (nextLyric) {
        const duration = nextLyric.time - currentLyric.time;
        newProgress = Math.max(0, Math.min(1, (currentTimeMs - currentLyric.time) / duration));
      } else {
        newProgress = 1;
      }
    }
    const indexChanged = this.currentLyricIndex !== newIndex;
    const progressChanged = Math.abs(this.lyricProgress - newProgress) > 0.005;
    if (indexChanged) {
      this.currentLyricIndex = newIndex;
      this.lyricProgress = newProgress;
      this.requestUpdate();
      setTimeout(() => this.scrollToCurrentLyric(), 150);
    } else if (progressChanged) {
      this.lyricProgress = newProgress;
      this.requestUpdate();
    }
  }

  // 歌词数据获取方法
  async fetchLyrics(title, artist) {
    try {
      const accessToken = this._hass.auth.data.access_token;
      if (!accessToken) {
        throw new Error("认证失败");
      }
      const maxRetries = 3;
      let lastError = null;
      for (let attempt = 0; attempt < maxRetries; attempt++) {
        try {
          const response = await fetch(`/api/xiaoshi/lyrics?title=${encodeURIComponent(title)}&artist=${encodeURIComponent(artist)}`, {
            headers: {
              Accept: "application/json",
              Authorization: `Bearer ${accessToken}`,
              "Content-Type": "application/json"
            },
            credentials: "same-origin"
          });
          if (response.ok) {
            const data = await response.json();
            if (!data.lyrics) {
              throw new Error("未找到歌词");
            }
            return data;
          }
          if (response.status === 401) {
            await new Promise(resolve => setTimeout(resolve, 500));
            if (this._hass.auth.refreshAccessToken) {
              await this._hass.auth.refreshAccessToken();
              continue;
            }
          }
          lastError = new Error(`请求失败: ${response.status}`);
        } catch (error) {
          lastError = error;
          if (attempt < maxRetries - 1) {
            await new Promise(resolve => setTimeout(resolve, 500));
            continue;
          }
        }
      }
      
      throw lastError || new Error("获取歌词失败");
    } catch (error) {
      throw error;
    }
  }

  // 搜索并获取歌词
  async searchAndFetchLyrics(title, artist) {
    const cleanTitle = this._cleanupSearchText(title);
    const cleanArtist = this._cleanupSearchText(Array.isArray(artist) ? artist[0] || "" : artist);
    const cacheKey = `${cleanTitle}-${cleanArtist}`;
    try {
      const cachedLyrics = await this._checkCache(cacheKey);
      if (cachedLyrics) {
        return this._processLyrics(cachedLyrics);
      }
      const searchAttempts = [
        { title: cleanTitle, artist: cleanArtist },
        { title: cleanTitle, artist: "" },
        { title: title, artist: artist }
      ];
      for (let i = 0; i < searchAttempts.length; i++) {
        const attempt = searchAttempts[i];
        try {
          const result = await this.fetchLyrics(attempt.title, attempt.artist);
          if (result && result.lyrics && result.lyrics.trim()) {
            await this._cacheResult(cacheKey, result.lyrics);
            return this._processLyrics(result.lyrics);
          }
        } catch (error) {
          if (i === searchAttempts.length - 1) {
            throw error;
          }
        }
      }
      throw new Error("未找到歌词");
    } catch (error) {
      this._handleSearchError(cacheKey);
      throw error;
    }
  }

  // 清理搜索文本
  _cleanupSearchText(text) {
    return text.replace(/\\(.*?\\)|\\[.*?\\]|（.*?）/g, "")
                .replace(/[\\s\\-_～〜]+/g, " ")
                .trim();
  }

  // 缓存歌词
  async _cacheResult(cacheKey, lyrics) {
    try {
      if (!this.lyricsCache) {
        this.lyricsCache = new Map();
      }
      this.lyricsCache.set(cacheKey, {
        lyrics: lyrics,
        timestamp: Date.now()
      });
      this._saveCache();
    } catch (error) {
    }
  }

  // 检查缓存
  async _checkCache(cacheKey) {
    if (!this.lyricsCache) {
      this.lyricsCache = new Map();
    }
    const MIOT_FAKE_LYRICS = new Set(['请欣赏', '请欣赏（音乐）', '暂无播放', '正在加载', 'QQ音乐', '无音乐播放']);
    for (const fake of MIOT_FAKE_LYRICS) {
      if (cacheKey.startsWith(fake)) {
        this.lyricsCache.delete(cacheKey);
        this._saveCache();
        return null;
      }
    }
    const cached = this.lyricsCache.get(cacheKey);
    if (cached) {
      if (cached.lyrics && !cached.lyrics.includes("搜索歌曲失败") && cached.lyrics.trim()) {
        cached.timestamp = Date.now();
        this.lyricsCache.set(cacheKey, cached);
        this._saveCache();
        return cached.lyrics;
      }
      this.lyricsCache.delete(cacheKey);
      this._saveCache();
    }
    return null;
  }

  // 保存缓存
  _saveCache() {
    try {
      if (this.lyricsCache) {
        const cacheObject = Object.fromEntries(this.lyricsCache);
        localStorage.setItem("music_player_lyrics_cache", JSON.stringify(cacheObject));
      }
    } catch (error) {
    }
  }

  // 处理歌词
  _processLyrics(lyricsText) {
    this.lyrics = this.parseLyrics(lyricsText);
    if (this.isPlaying && this.smoothCurrentTime > 0) {
      this.updateCurrentLyricIndex(this.smoothCurrentTime);
    }
    this.requestUpdate();
    if (this.showLyrics && this.currentLyricIndex >= 0) {
      setTimeout(() => this.scrollToCurrentLyric(), 200);
    }
  }

  // 处理搜索错误
  _handleSearchError(cacheKey) {
    this.lyrics = [{time: 0, text: "无歌词信息"}];
    if (this.lyricsCache && this.lyricsCache.has(cacheKey)) {
      this.lyricsCache.delete(cacheKey);
      this._saveCache();
    }
    this.requestUpdate();
  }

  // 无歌词显示
  loadNoLyrics() {
    this.lyrics = [{time: 0, text: "无歌词信息"}];
    this.currentLyricIndex = -1;
    this.lyricProgress = 0;
    this.requestUpdate();
  }

  // 开始歌词定时器
  startLyricsTimer() {
    this.stopLyricsTimer();
    this.stopSmoothTimer();
    if (this.isPlaying && this.lyrics.length > 0) {
      this.lyricsTimer = setInterval(() => {
        this.updateCurrentLyricIndex(this.smoothCurrentTime);
      }, 100); 
      this.smoothTimer = setInterval(() => {
        this.updateSmoothTimeOnly();
      }, 50);
    }
  }

  // 初始化平滑时间（不再与实体同步）
  initSmoothTimeOnce() {
    this.lyricsTimeAdjustment = 0;
    const primaryState = this.xiaomiMiotState;
    let currentTime = 0;
    if (primaryState && primaryState.attributes && primaryState.attributes.media_position !== undefined) {
      currentTime = primaryState.attributes.media_position * 1000;
    }
    this.smoothCurrentTime = currentTime;
    this.lastUpdateTime = Date.now();
  }

  // 更新平滑时间（不再与实体同步）
  updateSmoothTimeOnly() {
    if (!this.isPlaying) return;
    const now = Date.now();
    const deltaTime = now - this.lastUpdateTime;
    this.smoothCurrentTime += deltaTime;
    this.lastUpdateTime = now;
  }

  // 停止平滑定时器
  stopSmoothTimer() {
    if (this.smoothTimer) {
      clearInterval(this.smoothTimer);
      this.smoothTimer = null;
    }
  }

  // 开始平滑定时器
  startSmoothProgressTimer() {
    this.stopSmoothTimer();
    this.smoothTimer = setInterval(() => {
      this.updateSmoothTimeOnly();
      this.requestUpdate();
    }, 1000);
  }

  // 停止歌词定时器
  stopLyricsTimer() {
    if (this.lyricsTimer) {
      clearInterval(this.lyricsTimer);
      this.lyricsTimer = null;
    }
    this.stopSmoothTimer();
  }

  // 自动滚动到当前歌词
  scrollToCurrentLyric() {
    if (!this.showLyrics || this.currentLyricIndex < 0 || this.lyrics.length === 0) return;
    if (this._lastScrollTime && Date.now() - this._lastScrollTime < 500) {
      return;
    }
    setTimeout(() => {
      const lyricsContainer = this.shadowRoot?.querySelector('.lyrics-container');
      const currentLyricElement = this.shadowRoot?.querySelector('.lyric.active');
      if (lyricsContainer && currentLyricElement) {
        const containerHeight = lyricsContainer.clientHeight;
        const lyricHeight = currentLyricElement.offsetHeight;
        const lyricOffsetTop = currentLyricElement.offsetTop;
        const containerScrollHeight = lyricsContainer.scrollHeight;
        let targetScrollTop = lyricOffsetTop - (containerHeight / 2) + (lyricHeight / 2);
        const maxScrollTop = Math.max(0, containerScrollHeight - containerHeight);
        targetScrollTop = Math.max(0, Math.min(targetScrollTop, maxScrollTop));
        if (this.currentLyricIndex === 0) {
          targetScrollTop = Math.min(targetScrollTop, 50);
        }
        this._lastScrollTime = Date.now();
        const currentScrollTop = lyricsContainer.scrollTop;
        const scrollDistance = targetScrollTop - currentScrollTop;
        if (Math.abs(scrollDistance) < 50) {
          lyricsContainer.scrollTop = targetScrollTop;
        } else {
          lyricsContainer.scrollTo({
            top: targetScrollTop,
            behavior: 'smooth'
          });
        }
      }
    }, 50);
  }

  // 处理音量变化
  handleVolumeChange(e) {
    const newVolume = parseInt(e.target.value);
    this.updateVolume(newVolume);
    if (this.volumeDebounceTimer) {
      clearTimeout(this.volumeDebounceTimer);
    }
    this.volumeDebounceTimer = setTimeout(() => {
      this._handleClick();
      const target = this._getVolumeTargetEntity();
      if (target) {
        this.callService('media_player.volume_set', { entity_id: target, volume_level: newVolume / 100 });
      }
      this.volumeDebounceTimer = null;
    }, 300);
  }

  // 处理音量开始
  handleVolumeStart() {
    this.isDragging = true;
  }

  // 处理音量结束
  handleVolumeEnd(e) {
    if (this.isDragging) {
      this.isDragging = false;
      const newVolume = parseInt(e.target.value);
      if (this.volumeDebounceTimer) {
        clearTimeout(this.volumeDebounceTimer);
        this.volumeDebounceTimer = null;
      }
      this._handleClick();
      const target = this._getVolumeTargetEntity();
      if (target) {
        this.callService('media_player.volume_set', { entity_id: target, volume_level: newVolume / 100 });
      }
    }
  }

  // 获取进度百分比
  getProgressPercentage() {
    if (this._maWsConnected && this._maTrackName && this._isMaSourceActive() && this._maDuration > 0) {
      const pos = this._maElapsedTime || (this.smoothCurrentTime / 1000);
      return Math.min(100, Math.max(0, (pos / this._maDuration) * 100));
    }
    let primaryState = null;
    let usePrimaryEntity = true;
    // UI 优先读取 miot 实体
    if (this.xiaomiMiotEntity && this._hass) {
      primaryState = this._hass.states[this.xiaomiMiotEntity];
    }
    if (!primaryState || primaryState.state === 'unavailable') {
      usePrimaryEntity = false;
    }
    let displayState = null;
    if (usePrimaryEntity && primaryState) {
      displayState = primaryState;
    }
    if (!displayState) {
      displayState = this.xiaomiMiotState;
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

  // 获取状态文本
  getStateText() {
    let primaryState = null;
    let usePrimaryEntity = true;
    // UI 优先读取 miot 实体
    if (this.xiaomiMiotEntity && this._hass) {
      primaryState = this._hass.states[this.xiaomiMiotEntity];
    }
    if (!primaryState || primaryState.state === 'unavailable') {
      usePrimaryEntity = false;
    }
    let displayState = null;
    if (usePrimaryEntity && primaryState) {
      displayState = primaryState;
    }
    if (!displayState) {
      displayState = this.xiaomiMiotState;
    }
    const state = displayState?.state || 'idle';
    if (this._maWsConnected && this._maTrackName && this._isMaSourceActive()) {
      return this.isPlaying ? '正在播放' : '暂停';
    }
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

  // 计算实际播放位置
  _calcRealPosition(es) { if (!es) return 0; const p = es.attributes?.media_position || 0; const ua = es.attributes?.media_position_updated_at; if (es.state === 'playing' && ua) return p + Math.max(0, Math.floor((Date.now() - new Date(ua).getTime()) / 1000)); return p; }

  // ========== 界面渲染 ==========

  // 主渲染入口
  render() {
    if (this.maFavoritePlaylist && this._favTracks.length === 0 && !this._favLoading) {
      this._fetchFavoriteTracks(this.maFavoritePlaylist);
    }
    const renderData = this._prepareRenderState();
    const { bgStyle, overlayClass, albumBgStyle, finalCover, themeColors,
            activeTitle, activeArtist, attributes, currentTimeStr, totalTimeStr,
            progressPercentage } = renderData;
    return html`
      <div class="card full-layout${(this._devices && this._devices.length > 1) ? ' multi-device' : ''}" style="${bgStyle}; width: ${this.width}; min-width: ${this.width}; max-width: ${this.width};">
        ${this._renderCardBackground(finalCover, overlayClass, albumBgStyle)}
        <div class="player-content" style="height: ${this.height}; min-height: ${this.height}; max-height: ${this.height};">
          ${this._renderLeftSidebar(themeColors)}
          ${this._renderPlayerMain(themeColors, activeTitle, activeArtist, attributes, finalCover, currentTimeStr, totalTimeStr, progressPercentage)}
        </div>
      </div>
    `;
  }

  // 准备渲染状态数据
  _prepareRenderState() {
    const progressPercentage = this.getProgressPercentage();
    const themeColors = this._getThemeButtonColors();
    let primaryState = null, backupState = null, displayState = null;
    // UI 读取 miot 实体（歌曲信息、封面等）
    if (this.xiaomiMiotEntity && this._hass) { primaryState = this._hass.states[this.xiaomiMiotEntity]; }
    if (primaryState && backupState) {
      const pp = primaryState.attributes?.entity_picture;
      const bp = backupState.attributes?.entity_picture;
      if (pp && !bp) { displayState = primaryState; }
      else if (!pp && bp) { displayState = backupState; }
      else if (pp && bp) { displayState = primaryState; }
      else { displayState = primaryState.state === 'unavailable' ? backupState : primaryState; }
    } else if (primaryState) { displayState = primaryState; }
    else if (backupState) { displayState = backupState; }
    if (!displayState) { displayState = this.xiaomiMiotState; }
    const attributes = displayState?.attributes || {};
    const altAttr = {};
    const currentItem = this._mediaPlayerState?.currentItem || null;
    const realEntityTitle = this._filterTitle(attributes.media_title || '');
    const miotOv = { ...(this._miotOverlay || {}) };
    const localOv = { ...(this._localOverlay || {}) };
    const maOv = { ...(this._maOverlay || {}) };
    const overlayActive = !!(miotOv.source && miotOv.active && miotOv.title) ||
      !!(localOv.source === 'local' && localOv.active && localOv.title) ||
      !!(maOv.source && maOv.active && (maOv.title || this._maTrackName));
    if (!overlayActive && !this._activeChannel && displayState?.state === 'playing') {
      this._restoreAllChannelsOnRefresh(miotOv, localOv, maOv);
      requestAnimationFrame(() => this.requestUpdate());
    }

    const ch = this._activeChannel;
    const isMiot = ch === 'miot', isLocal = ch === 'local', isMa = ch === 'ma';
    let activeTitle = '', activeArtist = '', activeCoverUrl = '';
    if (isMiot) {
      // 仅当 miot 实体确在播放且含有效标题时采用，避免卡在 miot 旧信息
      const miotValid = primaryState && primaryState.state === 'playing' && realEntityTitle;
      activeTitle = miotOv.title || (miotValid ? realEntityTitle : '') || '';
      activeArtist = miotOv.artist || (miotValid ? attributes.media_artist : '') || '';
      activeCoverUrl = miotOv.coverUrl || (miotValid ? attributes.entity_picture : '') || '';
    } else if (isLocal) {
      activeTitle = localOv.title || currentItem?.title || currentItem?.name || '';
      activeArtist = localOv.artist || currentItem?.artist || '';
      activeCoverUrl = localOv.coverUrl || currentItem?.cover || '';
    } else if (isMa) {
      activeTitle = maOv.title || this._maTrackName || '';
      activeArtist = maOv.artist || this._maTrackArtist || '';
      activeCoverUrl = maOv.coverUrl || this._maCoverUrl || '';
    }
    if (!activeTitle) activeTitle = '未播放';
    const MIOT_FAKE = ['请欣赏（音乐）', '请欣赏', '暂无播放', '暂未播放', 'QQ音乐', '正在加载', '加载中', '无音乐播放'];
    if (activeTitle && MIOT_FAKE.some(p => activeTitle.includes(p))) { activeTitle = ''; activeArtist = ''; activeCoverUrl = ''; }
    else if (activeArtist && (activeArtist === '心灵之谜' || activeArtist === '未知歌手')) { activeArtist = ''; }
    const maWsActive = isMa && this._maWsConnected && this._maTrackName && this._isMaSourceActive();
    const finalCover = isMiot ? (activeCoverUrl || displayState?.attributes?.entity_picture || altAttr?.entity_picture) :
                        isLocal ? activeCoverUrl :
                        isMa ? (activeCoverUrl || (maWsActive ? this._maCoverUrl : '')) : activeCoverUrl;
    let duration = 0, position = 0;
    if (maWsActive && this._maDuration > 0) {
      duration = this._maDuration;
      position = this._maElapsedTime || (this.smoothCurrentTime / 1000);
    } else {
      duration = currentItem?.duration || parseFloat(attributes.media_duration || attributes.duration || altAttr.media_duration || altAttr.duration || 0);
      position = parseFloat(attributes.media_position || attributes.position || altAttr.media_position || altAttr.position || 0);
      if (this.smoothCurrentTime > 0 && !maWsActive) { position = this.smoothCurrentTime / 1000; }
    }
    const currentTimeStr = this._formatTime(position);
    const totalTimeStr = this._formatTime(duration);
    const currentTheme = this._evaluateTheme();
    const themeBgMap = { light: 'rgb(255, 255, 255)', dark: 'rgb(50, 50, 50)' };
    const themeCssVars = currentTheme === 'light'
      ? `--xiaoshi-text:rgb(0,0,0);--xiaoshi-muted:rgba(0,0,0,.55);--xiaoshi-overlay-off:rgba(255,255,255,.75);--xiaoshi-overlay-on:rgba(255,255,255,.50);--xiaoshi-btn-bg:rgba(0,0,0,.10);--xiaoshi-btn-active:rgba(0,0,0,.18);--xiaoshi-btn-hover:rgba(0,0,0,.14);--xiaoshi-text-shadow:none;`
      : `--xiaoshi-text:#fff;--xiaoshi-muted:rgba(255,255,255,.6);--xiaoshi-overlay-off:rgba(15,12,8,.60);--xiaoshi-overlay-on:rgba(15,12,8,.35);--xiaoshi-btn-bg:rgba(255,255,255,.10);--xiaoshi-btn-active:rgba(255,255,255,.25);--xiaoshi-btn-hover:rgba(255,255,255,.22);--xiaoshi-text-shadow:0 1px 4px rgba(0,0,0,0.5);`;
    const bgStyle = `background:${themeBgMap[currentTheme] || themeBgMap.dark};${themeCssVars}`;
    const overlayClass = this.isPlaying ? 'card-bg-overlay on-overlay' : 'card-bg-overlay off-overlay';
    const albumBgStyle = finalCover
      ? `background-image: url('${finalCover}'); filter: blur(40px) brightness(0.4) saturate(1.5);` : '';
    return { bgStyle, overlayClass, albumBgStyle, finalCover, themeColors, activeTitle, activeArtist, attributes, currentTimeStr, totalTimeStr, progressPercentage, currentItem, miotOv, localOv, maOv };
  }

  // 页面刷新时恢复所有通道
  _restoreAllChannelsOnRefresh(miotOv, localOv, maOv) {
    const maRestored = this._restoreNowPlayingFromLocalStorage('ma');
    if (maRestored) {
      this._setChannel('ma');
      Object.assign(maOv, { title: maRestored.title || '', artist: maRestored.artist || '', coverUrl: maRestored.cover_url || '', source: maRestored.source || 'ma', active: true });
      this._maOverlay = { ...maOv };
    }
    if (!maOv.active) {
      const localRestored = this._restoreNowPlayingFromLocalStorage('local');
      if (localRestored) {
        this._setChannel('local');
        Object.assign(localOv, { title: localRestored.title || '', artist: localRestored.artist || '', coverUrl: localRestored.cover_url || '', source: 'local', active: true });
        this._localOverlay = { ...localOv };
        if (!this._mediaPlayerState) this._mediaPlayerState = {};
        if (!this._mediaPlayerState.currentItem && (localRestored.media_content_id || localRestored.title)) {
          this._mediaPlayerState.currentItem = { title: localRestored.title || '', artist: localRestored.artist || '', media_content_id: localRestored.media_content_id || '', media_type: localRestored.media_type || 'music' };
        }
      }
    }
    if (!maOv.active && !localOv.active) {
      const miotRestored = this._restoreNowPlayingFromLocalStorage('miot');
      if (miotRestored) {
        this._setChannel('miot');
        Object.assign(miotOv, { title: miotRestored.title || '', artist: miotRestored.artist || '', coverUrl: miotRestored.cover_url || '', source: 'miot', active: true });
        this._miotOverlay = { ...miotOv };
      }
    }
  }

  // 渲染卡片背景
  _renderCardBackground(finalCover, overlayClass, albumBgStyle) {
    return html`
      <div class="${overlayClass}"></div>
      ${finalCover ? html`<div class="album-bg-layer" style="${albumBgStyle}"></div>` : ''}
    `;
  }

  // 渲染左侧导航栏
  _renderLeftSidebar(themeColors) {
    return html`
      <div class="left-sidebar">
        ${this._renderDeviceList(themeColors)}
        ${this._renderSidebarButtons(themeColors)}
      </div>
    `;
  }

  // 渲染设备列表
  _renderDeviceList(themeColors) {
    if (!this._devices || this._devices.length === 0) return '';
    return html`
      <div class="device-list">
        ${this._devices.map((d, i) => {
          const devState = this._hass?.states[d.xiaomi_miot];
          const devName = d.name || (devState?.attributes?.friendly_name) || ('设备' + (i + 1));
          const rawState = (devState?.state || '').trim();
          const devText = rawState === 'playing' ? '播放' : rawState === 'paused' ? '暂停' : (rawState === 'idle' || rawState === 'on') ? '待机' : rawState === 'off' ? '关闭' : '离线';
          return html`
            <div class="device-list-item ${i === this._activeDeviceIndex ? 'active' : ''}"
                 style="background: ${themeColors.bg};"
                 @click=${() => this._switchDevice(i)}
                 title="${devName} — ${devText}">
              <div class="dev-name">${devName}</div>
              <div class="dev-status">${devText}</div>
            </div>
          `;
        })}
      </div>
    `;
  }

  // 渲染侧边栏按钮
  _renderSidebarButtons(themeColors) {
    return html`
      ${this._renderSidebarButton(themeColors, 'mdi:magnify', '小米语音', '小米语音对话记录', '未配置 conversation', this.conversationEntity, () => { this._handleClick(); if (!this.conversationEntity) { this._showToast('请先配置小米语音实体 conversation', 'warning'); return; } this.showXiaoaiConversation(this.shadowRoot?.querySelector('.sidebar-btn[title*="语音对话"]')); })}
      ${this._renderSidebarButton(themeColors, 'mdi:radio', '小米电台', this.sidebarRadioEntity ? (this._hass?.states[this.sidebarRadioEntity]?.attributes.friendly_name || '小米电台') : '未配置 play_radio', '未配置 play_radio', this.sidebarRadioEntity, this.handleSidebarRadioPress)}
      ${this._renderSidebarButton(themeColors, 'mdi:speaker-multiple', '本地音乐', '本地音乐 — 播放列表与后台播放控制', '未配置 local_music_path', this._config?.local_music_path, () => { this._handleClick(); if (!this._config?.local_music_path) { this._showToast('请先配置本地音乐路径 local_music_path', 'warning'); return; } this.showLocalMusicPopup(null, this.shadowRoot?.querySelector('.sidebar-btn[title*="本地音乐"]')); })}
      ${this._renderSidebarButton(themeColors, 'mdi:playlist-star', 'MA音乐', 'MA 播放列表', '未配置 ma_playlists', this.maPlaylistsConfig, () => { if (!this.maPlaylistsConfig) { this._showToast('请先配置MA歌单 ma_playlists', 'warning'); return; } this.handleMaPlaylistsToggle(); })}
      ${(() => { const fav = this._getFavoritePlaylist(); return this._renderSidebarButton(themeColors, 'mdi:heart', '我喜欢', '我喜欢', '未配置 ma_favorite_playlist', fav, () => { this._handleClick(); if (!fav) { this._showToast('请在编辑器配置 ma_favorite_playlist', 'warning'); return; } this.handleFavoriteToggle(fav); }); })()}
    `;
  }

  // 渲染单个侧边栏按钮
  _renderSidebarButton(themeColors, icon, label, titleEnabled, titleDisabled, enabled, onClick) {
    return html`
      <button class="sidebar-btn" style="background: ${themeColors.bg}; ${enabled ? '' : 'opacity: 0.4;'}"
        @click=${onClick} title="${enabled ? titleEnabled : titleDisabled}">
        <ha-icon icon="${icon}"></ha-icon>
        <span class="sidebar-btn-label">${label}</span>
      </button>
    `;
  }

  // 渲染右侧播放主体
  _renderPlayerMain(themeColors, activeTitle, activeArtist, attributes, finalCover, currentTimeStr, totalTimeStr, progressPercentage) {
    if (this._showPlaylist) {
      return html`
        <div class="player-main">
          ${this._renderMainArea(themeColors, activeTitle, activeArtist, attributes, finalCover)}
          ${this._renderPlaylistHeader()}
          ${this._renderPlaylistArea()}
          ${this._renderProgressBar(currentTimeStr, totalTimeStr, progressPercentage)}
          ${this._renderPlaybackControls(themeColors)}
          ${this._renderVolumeControl()}
        </div>
      `;
    }
    return html`
      <div class="player-main">
        ${this._renderMainArea(themeColors, activeTitle, activeArtist, attributes, finalCover)}
        ${this._renderLyricsArea()}
        ${this._renderProgressBar(currentTimeStr, totalTimeStr, progressPercentage)}
        ${this._renderPlaybackControls(themeColors)}
        ${this._renderVolumeControl()}
      </div>
    `;
  }

  // 渲染播放列表标题（独立显示，不在滚动范围内，位于 action-buttons-row 下方）
  _renderPlaylistHeader() {
    const data = this._currentPlaylistData;
    const playlist = data?.playlist;
    if (!this.maPlaylist || !playlist?.length) return html``;
    const repeatLabel = data?.repeat_mode ? ' · ' + ({sequential:'顺序播放',random:'随机播放',repeat_one:'单曲循环'}[data.repeat_mode] || data.repeat_mode) : '';
    return html`<div style="padding: 4px 8px; font-size: 12px; color: rgba(255,255,255,0.4); text-align: center;">MA播放列表 · 共 ${playlist.length} 首${repeatLabel}</div>`;
  }

  // 渲染主内容区（专辑封面 + 歌曲信息）
  _renderMainArea(themeColors, activeTitle, activeArtist, attributes, finalCover) {
    return html`
      <div class="main-area">
        ${this._renderAlbumArt(finalCover)}
        ${this._renderSongInfo(themeColors, activeTitle, activeArtist, attributes)}
      </div>
    `;
  }

  // 渲染专辑封面
  _renderAlbumArt(finalCover) {
    return html`
      <div class="album-art" style="${finalCover ? `background-image: url('${finalCover}')` : ''}">
        ${!finalCover ? html`<ha-icon class="album-art-placeholder" icon="mdi:music-note" style="--mdc-icon-size: 40px;"></ha-icon>` : ''}
      </div>
    `;
  }

  // 渲染歌曲信息区
  _renderSongInfo(themeColors, activeTitle, activeArtist, attributes) {
    return html`
      <div class="song-info-area">
        <div class="song-title">${activeTitle || '未播放'}</div>
        <div class="song-artist">${activeArtist || '\u00A0'}</div>
        ${attributes.media_source_name ? html`<div class="song-source">${attributes.media_source_name}</div>` : ''}
        ${this._renderActionButtons(themeColors)}
      </div>
    `;
  }

  // 渲染操作按钮行
  _renderActionButtons(themeColors) {
    const isFav = this._isCurrentSongFavorite();
    const hasDevice = this.xiaomiMiotEntity;
    return html`
      <div class="action-buttons-row">
        <button class="action-btn" style="background: ${themeColors.bg}; ${this.favoriteSongEntity ? '' : 'opacity: 0.4;'}" @click=${this.handleFavoriteCurrentSong} title="收藏当前播放歌曲">
          <ha-icon icon="${isFav ? 'mdi:heart' : 'mdi:heart-outline'}" style="${isFav ? 'color:#e74c3c;' : ''}"></ha-icon>
        </button>
        <button class="action-btn" style="background: ${themeColors.bg}; ${this.stopAlarmEntity ? '' : 'opacity: 0.4;'}" @click=${this.handleStopAlarm} title="停止当前闹钟">
          <ha-icon icon="mdi:alarm"></ha-icon>
        </button>
        <button class="action-btn" style="background: ${themeColors.bg}; ${hasDevice ? '' : 'opacity: 0.4;'}" @click=${this._toggleHistory} title="播放历史记录">
          <ha-icon icon="mdi:chart-box-outline"></ha-icon>
        </button>
        <button class="action-btn" style="background: ${themeColors.bg};" @click=${() => { this._handleClick(); this._showPlaylist = false; this._updateViewMode('lyrics'); this.requestUpdate(); }} title="歌词">
          <span class="action-btn-label" style="${this._showPlaylist ? 'opacity: 0.35;' : ''}">词</span>
        </button>
        <button class="action-btn" style="background: ${themeColors.bg};" @click=${() => { this._handleClick(); this._showPlaylist = true; this._updateViewMode('playlist'); this.requestUpdate(); }} title="播放列表">
          <span class="action-btn-label" style="${this._showPlaylist ? '' : 'opacity: 0.35;'}">列表</span>
        </button>
        <button class="action-btn" style="background: ${themeColors.bg};" @click=${this._clearPlaylist} title="清空播放列表">
          <ha-icon icon="mdi:close" style="color:#e74c3c;"></ha-icon>
        </button>
      </div>
    `;
  }

  // 渲染歌词区域
  _renderLyricsArea() {
    if (!this.showLyrics) return '';
    return html`
      <div class="lyrics-area-inline" style="height: ${this.lyricsHeight};">
        <div class="lyrics-container">
          <div class="lyrics-top-spacer"></div>
          ${this.lyrics.length > 0 ? this.lyrics.map((lyric, index) => html`
            <div class="lyric ${index === this.currentLyricIndex ? 'active' : ''}"
              style="${index === this.currentLyricIndex ? `--progress: ${this.lyricProgress * 100}%;` : ''}">
              ${lyric.text}
            </div>
          `) : html`<div class="lyric">暂无歌词</div>`}
          <div class="lyrics-spacer"></div>
        </div>
        <div class="lyrics-controls">
          <button class="lyrics-control-btn" @click=${this.handleLyricsTimeDecrease} title="歌词进度减1秒">
            <ha-icon icon="mdi:minus"></ha-icon>
          </button>
          <button class="lyrics-control-btn" @click=${this.handleLyricsTimeReset} title="重置歌词进度">
            <ha-icon icon="mdi:restart"></ha-icon>
          </button>
          <button class="lyrics-control-btn" @click=${this.handleLyricsTimeIncrease} title="歌词进度加1秒">
            <ha-icon icon="mdi:plus"></ha-icon>
          </button>
          <div class="lyrics-adjustment-toast ${this.adjustmentToast.show ? 'show' : ''}" id="lyrics-toast">
            ${this.adjustmentToast.message}
          </div>
        </div>
      </div>
    `;
  }

  // 点击播放列表中的曲目（直接播放，不改空播放列表）
  async _playPlaylistTrack(track) {
    this._handleClick();
    // 本地播放列表优先
    if (this._localPlaylist && this._localPlaylist.length) { await this._playLocalPlaylistTrack(track); return; }
    // MA 播放列表曲目点击 → 走后端切歌控制（更新 current_index），再单首推送
    const tracks = this._maTracks();
    const trackUri = track?.uri || track?.track_id;
    if (!trackUri) return;
    const idx = tracks.findIndex(t => (t.uri || t.track_id || '') === trackUri);
    if (idx < 0) return;
    this._setChannel('ma');
    this._pauseOtherChannelsForMa();
    const res = await this._maControlApi('select', idx);
    if (!res || res.current_index < 0) { console.log('[Xiaoshi][play] 指定曲目切歌失败'); return; }
    await this._maApplyControlled(res);
  }

  // 清空播放列表：清空所有前端播放列表 + 后端 api 列表 + 终止播放
  async _clearPlaylist() {
    this._handleClick();
    const mp = this._localMediaEntity();
    // 1、清空所有前端播放列表（内存）
    this._localPlaylist = [];
    this._localStatuses = [];
    this._localCurrentIndex = -1;
    this._localPlaylistSignature = '';
    this._maPlaylistTracks = [];
    this._maPlaylistDetail = null;
    this._maPlaylistPlaying = '';
    this._maPlaylistTracksLoading = false;
    this._favTracks = [];
    this._currentPlaylistData = null;
    // 2、清空后端 api 列表（本地 + MA，两者都空 → 小米电台模式）
    if (mp) { try { await this._clearLocalPlaylist(mp); } catch (e) {} }
    if (mp) { try { await this._clearMaPlaylistApi(mp); } catch (e) {} }
    // 3、终止播放（不论当前是哪个通道）
    const targetEntity = this._getActiveTargetEntity();
    if (targetEntity && this._hass) {
      try { await this._hass.callService('media_player', 'media_stop', { entity_id: targetEntity }); } catch (e) {}
    }
    try { await this._stopMaPlayback(); } catch (e) {}
    // 先清空 MA 空播放列表（在 WS 仍连接时执行，避免残留曲目）
    if (this.maPlaylist) {
      try {
        if (!this._maWsConnected) {
          this._connectMaWs();
          for (let w = 0; w < 50 && !this._maWsConnected; w++) await new Promise(r => setTimeout(r, 100));
        }
        if (this._isMaWsReady()) {
          const plId = (this.maPlaylist.match(/(\d+)$/)||[])[0] || this.maPlaylist;
          const existing = await this._maWsSendAndWait('music/playlists/playlist_tracks', { item_id: String(plId), provider_instance_id_or_domain: 'library', force_refresh: false, allow_dynamic_tracks: false });
          const oldTracks = Array.isArray(existing) ? existing : (existing?.items || []);
          if (oldTracks.length > 0) {
            await this._maWsSendAndWait('music/playlists/remove_playlist_tracks', { db_playlist_id: String(plId), positions_to_remove: oldTracks.map((_, i) => i) });
          }
        }
      } catch(e) {}
    }
    // 断开 MA WebSocket
    if (this._maWs) {
      try { this._maWs.close(); } catch(e) {}
      this._maWs = null;
      this._maWsConnected = false;
    }
    // 清除播放状态
    this.isPlaying = false;
    this._maOverlay = { title: '', artist: '', coverUrl: '', source: '', active: false };
    this._maTrackName = '';
    this._maTrackArtist = '';
    // 清空列表 → 模式设为小米电台(miot)（覆盖了 _activeChannel 残留）
    this._setChannel('miot');
    this.showLyrics = true;
    this._miotLastSongTitle = '';
    this._miotLastSongArtist = '';
    this._localLastSongTitle = '';
    this._localLastSongArtist = '';
    this._showPlaylist = false;
    // 立即刷新 UI
    this.requestUpdate();
    if (this.maPlayerEntity && this._hass?.auth?.data?.access_token) {
      this._updateViewMode('lyrics');
    }
  }

  // 渲染播放列表区域
  _renderPlaylistArea() {
    // 本地播放列表（含每首播放状态）
    if (this._localPlaylist && this._localPlaylist.length) {
      const playlist = this._localPlaylist;
      const statuses = this._localStatuses || [];
      const curIdx = this._localCurrentIndex;
      const badge = {
        unplayed: ['未播放', 'rgba(255,255,255,0.3)'],
        played: ['已播放', 'rgba(255,255,255,0.15)'],
        playing: ['正在播放', '#5dade2'],
        paused: ['暂停播放', '#f39c12'],
      };
      return html`
        <div class="lyrics-area-inline" style="height: ${this.lyricsHeight};">
          <div class="lyrics-container" style="mask-image:none;-webkit-mask-image:none;">
            ${playlist.map((track, i) => {
              const st = statuses[i] || 'unplayed';
              const b = badge[st] || badge.unplayed;
              const isCur = i === curIdx;
              return html`
                <div class="playlist-track-row" style="display:flex;align-items:center;gap:6px;padding:4px 0;border-radius:6px;cursor:pointer;${isCur ? 'background:rgba(255,255,255,0.1);' : ''}" @click=${() => this._playLocalPlaylistTrack(track)}>
                  <span style="width:24px;text-align:center;font-size:11px;color:${isCur ? '#5dade2' : 'rgba(255,255,255,0.3)'};flex-shrink:0;">${isCur ? '▶' : (i + 1)}</span>
                  <span style="max-width:48%;flex:0 1 auto;font-size:12px;color:${isCur ? '#fff' : (st === 'played' ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.7)')};white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${track.name || '未知曲目'}</span>
                  <span style="flex:1;text-align:right;font-size:10px;color:rgba(255,255,255,0.3);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;flex-shrink:1;">${track.artist || ''}</span>
                  <span style="width:52px;text-align:right;font-size:10px;color:${b[1]};flex-shrink:0;">${b[0]}</span>
                </div>`;
            })}
          </div>
        </div>`;
    }
    // 小米电台模式：不显示播放列表
    if (this._activeChannel === 'miot') {
      return html`<div class="lyrics-area-inline" style="height: ${this.lyricsHeight};"><div class="lyrics-container" style="mask-image:none;-webkit-mask-image:none;"><div class="lyric" style="color:rgba(255,255,255,0.5);">小米电台播放中，不显示播放列表</div></div></div>`;
    }
    const data = this._currentPlaylistData;
    const playlist = data?.playlist;
    if (!playlist?.length) {
      if (!this.maPlaylist) {
        return html`<div class="lyrics-area-inline" style="height: ${this.lyricsHeight};"><div class="lyrics-container" style="mask-image:none;-webkit-mask-image:none;"><div class="lyric" style="color:rgba(255,255,255,0.5);">请先配置播放列表参数 (ma_playlist)</div></div></div>`;
      }
      return html`<div class="lyrics-area-inline" style="height: ${this.lyricsHeight};"><div class="lyrics-container" style="mask-image:none;-webkit-mask-image:none;"><div class="lyric">暂无播放列表数据</div></div></div>`;
    }
    const currentName = this._maTrackName || '';
    return html`
      <div class="lyrics-area-inline" style="height: ${this.lyricsHeight};">
        <div class="lyrics-container" style="mask-image:none;-webkit-mask-image:none;">
          ${playlist.map((track, i) => html`
            <div class="playlist-track-row" style="display:flex;align-items:center;gap:6px;padding:4px 0;border-radius:6px;cursor:pointer;${track.name === currentName ? 'background:rgba(255,255,255,0.1);' : ''}" @click=${() => this._playPlaylistTrack(track)}>
              <span style="width:24px;text-align:center;font-size:11px;color:${track.status === 'last' ? '#5dade2' : track.status === 'played' ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.3)'};flex-shrink:0;">${track.status === 'last' ? '▶' : i + 1}</span>
              <span style="max-width:66%;flex:0 1 auto;font-size:12px;color:${track.name === currentName ? '#fff' : track.status === 'played' ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.7)'};white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${track.name || '未知曲目'}</span>
              <span style="flex:1;text-align:right;font-size:10px;color:rgba(255,255,255,0.3);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;flex-shrink:1;">${track.artist || ''}</span>
            </div>
          `)}
        </div>
      </div>
    `;
  }

  // 渲染进度条
  _renderProgressBar(currentTimeStr, totalTimeStr, progressPercentage) {
    return html`
      <div class="progress-area">
        <div class="progress-time">${currentTimeStr}</div>
        <div class="progress-track">
          <div class="progress-fill" style="width: ${progressPercentage}%;"></div>
        </div>
        <div class="progress-time">${totalTimeStr}</div>
      </div>
    `;
  }

  // 当前模式对应的状态文字
  get _modeStatusText() {
    const ch = this._getEffectiveChannel();
    if (ch === 'local') return '本地音乐';
    if (ch === 'ma') return 'MA音乐';
    return '电台音乐';
  }

  // 渲染播放控制按钮
  _renderPlaybackControls(themeColors) {
    const currentMode = this._repeatMode || 'sequential';
    // 随机播放按钮：默认关闭 → mdi:shuffle-variant(灰)，开启 → mdi:shuffle-disabled(正常)
    const shuffleActive = currentMode === 'random';
    const shuffleIcon = shuffleActive ? 'mdi:shuffle-variant' : 'mdi:repeat';
    const shuffleColor = shuffleActive ? themeColors.fg : themeColors.muted;
    // 循环模式按钮：sequential → mdi:repeat(正常), random → mdi:repeat-off(灰), repeat_one → mdi:repeat-once(正常)
    let repeatIcon = 'mdi:repeat';
    let repeatActive = true;
    if (currentMode === 'random') {
      repeatIcon = 'mdi:repeat-off';
      repeatActive = false;
    } else if (currentMode === 'repeat_one') {
      repeatIcon = 'mdi:repeat-once';
    }
    const repeatColor = repeatActive ? themeColors.fg : themeColors.muted;
    return html`
      <div class="controls-area">
        <button class="control-btn" style="background: ${themeColors.bg}; color: ${shuffleColor};" @click=${this.handleShuffle} title="${shuffleActive ? '随机播放' : '顺序播放'}">
          <ha-icon icon="${shuffleIcon}"></ha-icon>
        </button>
        <button class="control-btn" style="background: ${themeColors.bg};" @click=${this.handlePrevious}>
          <ha-icon icon="mdi:skip-previous"></ha-icon>
        </button>
        <button class="play-pause-btn" @click=${this.handlePlayPause}>
          <ha-icon icon="${this.isPlaying ? 'mdi:pause' : 'mdi:play'}"></ha-icon>
        </button>
        <button class="control-btn" style="background: ${themeColors.bg};" @click=${this.handleNext}>
          <ha-icon icon="mdi:skip-next"></ha-icon>
        </button>
        <button class="control-btn" style="background: ${themeColors.bg}; color: ${repeatColor};" @click=${this.handleRepeat} title="${currentMode === 'sequential' ? '顺序播放' : currentMode === 'random' ? '顺序播放' : '单曲循环'}">
          <ha-icon icon="${repeatIcon}"></ha-icon>
        </button>
        <span class="mode-status-text">${this._modeStatusText}</span>
      </div>
    `;
  }

  // 渲染音量控制
  _renderVolumeControl() {
    return html`
      <div class="volume-area">
        <div class="volume-value">${Math.round(this.volumeState)}%</div>
        <button class="volume-icon-btn" @click=${this.handleVolumeDown} style="--mdc-icon-size: 16px;">
          <ha-icon icon="mdi:minus"></ha-icon>
        </button>
        <div class="volume-track" @click=${this._onVolumeTrackClick}>
          <div class="volume-fill" style="width: ${this.volumeState}%;"></div>
          <div class="volume-thumb" style="left: ${this.volumeState}%;" @pointerdown=${this._onVolumePointerDown}></div>
        </div>
        <button class="volume-icon-btn" @click=${this.handleVolumeUp} style="--mdc-icon-size: 16px;">
          <ha-icon icon="mdi:plus"></ha-icon>
        </button>
        <button class="volume-icon-btn" @click=${this.handleVolumeMute} title="静音/取消静音">
          <ha-icon icon="${this.volumeState === 0 ? 'mdi:volume-mute' : (this.volumeState <= 30 ? 'mdi:volume-low' : (this.volumeState <= 70 ? 'mdi:volume-medium' : 'mdi:volume-high'))}"></ha-icon>
        </button>
      </div>
    `;
  }

  // 深度查询选择器
  _deepQuerySelector(selector, root = document) {
    const found = root.querySelector(selector);
    if (found) return found;
    const allElements = root.querySelectorAll('*');
    for (const el of allElements) {
      if (el.shadowRoot) {
        const innerFound = this._deepQuerySelector(selector, el.shadowRoot);
        if (innerFound) return innerFound;
      }
    }
    return null;
  }

  // 获取主卡片主题配置
  _getMainCardThemes() {
    const mainCard = this._deepQuerySelector('minecraft-dashboard-card');
    if (mainCard && mainCard._config && Array.isArray(mainCard._config.image_themes) && mainCard._config.image_themes.length > 0) {
      return mainCard._config.image_themes;
    }
    return null;
  }

  // 获取有效主题列表（主卡片优先，回退到本地）
  _getEffectiveThemes() {
    const mainThemes = this._getMainCardThemes();
    if (mainThemes && mainThemes.length > 0) {
      return mainThemes;
    }
    const localThemes = (this._config && this._config.image_themes) || [];
    return localThemes;
  }

  // 从主卡片同步主题索引
  _syncThemeFromMainCard() {
    const themes = this._getEffectiveThemes();
    if (themes.length === 0) {
      this._currentThemeIndex = 0;
      return;
    }
    try {
      const saved = localStorage.getItem('mc-dashboard-theme-index');
      if (saved !== null) {
        const idx = parseInt(saved, 10);
        if (idx >= 0 && idx < themes.length) {
          this._currentThemeIndex = idx;
        }
      }
    } catch (e) {
      this._currentThemeIndex = 0;
    }
  }

  // 获取图片 URL（根据当前主题路径）
  getImageUrl(configuredPath) {
    const themes = this._getEffectiveThemes();
    if (themes.length === 0 || !configuredPath) {
      return configuredPath;
    }
    const currentTheme = themes[this._currentThemeIndex] || themes[0];
    if (!configuredPath.includes('/')) {
      return currentTheme.path + configuredPath;
    }
    for (const theme of themes) {
      if (configuredPath.startsWith(theme.path)) {
        return currentTheme.path + configuredPath.substring(theme.path.length);
      }
    }
    return configuredPath;
  }

  // 获取主题按钮颜色配置
  _getThemeButtonColors() {
    const themes = this._getEffectiveThemes();
    // 根据当前主题模式决定文字/按钮色（无 image_themes 时使用）
    const themeMode = this._evaluateTheme();
    const isLight = themeMode === 'light';
    const fixedFg = isLight ? 'rgb(0, 0, 0)' : 'rgb(255, 255, 255)';
    const fixedMuted = isLight ? 'rgba(0,0,0,.55)' : 'rgba(255,255,255,.6)';
    if (themes.length === 0) {
      return {
        bg: isLight ? 'rgba(255, 255, 255, 0.6)' : 'rgba(20, 18, 12, 0.45)',
        fg: fixedFg,
        muted: fixedMuted
      };
    }
    const currentTheme = themes[this._currentThemeIndex] || themes[0];
    const sideBg = currentTheme.side_bg;
    if (sideBg) {
      return {
        bg: this._hexToRgba(sideBg, 0.50),
        fg: fixedFg,
        muted: fixedMuted
      };
    }
    return {
      bg: 'rgba(20, 18, 12, 0.45)',
      fg: fixedFg,
      muted: fixedMuted
    };
  }

  // 将 HEX 颜色转换为 RGBA 格式
  _hexToRgba(hex, alpha) {
    if (!hex) return `rgba(0,0,0,${alpha})`;
    hex = hex.replace('#', '').trim();
    if (hex.length === 3) {
      hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
    }
    if (hex.length !== 6) return `rgba(0,0,0,${alpha})`;
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }

  // 格式化时间为 mm:ss
  _formatTime(seconds) {
    if (!seconds || seconds <= 0) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  }

  // 主题变更事件处理
  _handleThemeChangeEvent(e) {
    if (e.detail && typeof e.detail.index === 'number') {
      const themes = this._getEffectiveThemes();
      if (e.detail.index >= 0 && e.detail.index < themes.length) {
        this._currentThemeIndex = e.detail.index;
      } else {
        this._currentThemeIndex = 0;
      }
    } else {
      this._syncThemeFromMainCard();
      return;
    }
  }

  // 渲染歌词
  _renderLyrics(container, parsed, currentPos) {
    if (!parsed?.lines?.length) { if (container.dataset.lyricsRendered !== 'empty') { container.dataset.lyricsRendered = 'empty'; container.innerHTML = '<div style="color:var(--b-muted,#999);padding:20px 0;">暂无歌词</div>'; } return; }
    if (!parsed.timed) { if (container.dataset.lyricsRendered !== 'plain') { container.dataset.lyricsRendered = 'plain'; container.innerHTML = parsed.lines.map(l => '<div style="color:var(--b-fg,#212121);padding:2px 0;">' + this._escapeHtml(l.text) + '</div>').join(''); } return; }
    let ai = -1; for (let i = 0; i < parsed.lines.length; i++) { if (parsed.lines[i].time <= currentPos) ai = i; else break; }
    if (container.dataset.lyricsActiveIdx === String(ai)) return; container.dataset.lyricsActiveIdx = String(ai); container.dataset.lyricsRendered = 'timed';
    container.innerHTML = parsed.lines.map((l, i) => '<div data-lyrics-line="' + i + '" class="' + (i === ai ? 'media-player-lyrics-line media-player-lyrics-line-active' : 'media-player-lyrics-line media-player-lyrics-line-inactive') + '">' + this._escapeHtml(l.text || '♪') + '</div>').join('');
    if (ai >= 0) { const ae2 = container.querySelector('[data-lyrics-line="' + ai + '"]'); if (ae2) container.scrollTop = Math.max(0, ae2.offsetTop - container.clientHeight/2 + ae2.clientHeight/2); }
  }

  // 构建本地音乐弹窗结构（顶部栏 + 视图区 + 底部标签栏）
  _renderPlayerPopup(container, cfg, state) {
    container.innerHTML = '';
    const topBar = this._renderPlayerTopBar(cfg, state); container.appendChild(topBar);
    const viewArea = document.createElement('div'); viewArea.className = 'media-player-view-area'; container.appendChild(viewArea);
    state._viewArea = viewArea; state._activeView = 'list';
    this._renderActivePage(viewArea, cfg, state);
    if (cfg.pageTabs.length > 1) {
      const bottomBar = this._renderBottomTabBar(cfg, state); container.appendChild(bottomBar);
    }
  }

  // 本地音乐弹窗顶部标题栏
  _renderPlayerTopBar() {
    const bar = document.createElement('div'); bar.className = 'media-player-top-bar'; bar.style.cssText = 'display:flex;align-items:center;padding:14px 16px;border-bottom:1px solid var(--b-divider,rgba(0,0,0,0.06));flex-shrink:0;';
    bar.innerHTML = '<div style="display:flex;align-items:center;gap:8px;"><ha-icon icon="mdi:music" style="--mdc-icon-size:20px;color:var(--b-accent,#3498db);"></ha-icon><span style="font-size:15px;font-weight:600;color:var(--b-fg,#212121);">本地音乐</span></div>';
    return bar;
  }

  // 本地音乐弹窗底部标签栏
  _renderBottomTabBar(cfg, state) {
    const bar = document.createElement('div'); bar.className = 'media-player-bottom-bar';
    cfg.pageTabs.forEach((p, idx) => {
      const isActive = state.activePageIndex === idx;
      const tab = document.createElement('button'); tab.className = 'media-player-page-tab'; tab.dataset.page = idx;
      tab.style.cssText = 'display:flex;flex-direction:column;align-items:center;gap:3px;padding:6px 16px;border:none;background:transparent;cursor:pointer;flex-shrink:0;min-width:64px;';
      tab.innerHTML = '<ha-icon icon="' + (p.icon || 'mdi:view-dashboard-outline') + '" style="--mdc-icon-size:22px;color:' + (isActive ? 'var(--b-accent,#3498db)' : 'var(--b-muted,#999)') + ';"></ha-icon><span style="font-size:10px;color:' + (isActive ? 'var(--b-fg,#212121)' : 'var(--b-muted,#999)') + ';font-weight:' + (isActive ? '600' : '400') + ';white-space:nowrap;">' + this._escapeHtml(p.name) + '</span>' + (isActive ? '<span style="position:absolute;top:3px;width:4px;height:4px;border-radius:50%;background:var(--b-accent,#3498db);"></span>' : '');
      bar.appendChild(tab);
    });
    return bar;
  }

  // 本地音乐弹窗标签栏
  _renderUserTabBar(cfg, state) {
    const bar = document.createElement('div'); bar.className = 'media-player-tab-bar';
    bar.style.cssText = 'display:flex;justify-content:space-around;gap:0;padding:0 16px;border-bottom:1px solid var(--b-divider,rgba(0,0,0,0.06));overflow-x:auto;flex-shrink:0;scrollbar-width:none;';
    cfg.tabs.forEach((tab, idx) => {
      const btn = document.createElement('button'); btn.className = 'media-player-tab-btn'; btn.dataset.tabIndex = idx;
      const isActive = idx === state.activeTabIndex;
      btn.style.cssText = 'display:flex;align-items:center;justify-content:center;gap:5px;padding:10px 16px;border:none;cursor:pointer;font-size:13px;font-weight:' + (isActive ? '600' : '400') + ';color:' + (isActive ? 'var(--b-accent,#3498db)' : 'var(--b-muted,#999)') + ';background:transparent;white-space:nowrap;flex-shrink:0;';
      if (tab.icon) { const icon = document.createElement('ha-icon'); icon.setAttribute('icon', tab.icon); icon.style.cssText = '--mdc-icon-size:16px;'; btn.appendChild(icon); }
      const nameSpan = document.createElement('span'); nameSpan.textContent = this._escapeHtml(tab.name || 'Tab ' + (idx + 1)); btn.appendChild(nameSpan);
      bar.appendChild(btn);
    });
    return bar;
  }

  // 本地音乐弹窗内容区
  _renderListView(container, cfg, state) {
    // 参照 xiaoshi-music-card.js 的 lit-html 行为：每次渲染前清空容器，避免 append 堆积导致重复弹窗
    container.innerHTML = '';
    const bg = document.createElement('div'); bg.style.cssText = 'position:absolute;inset:0;z-index:0;background:var(--b-bg,#fff);backdrop-filter:blur(20px);-webkit-backdrop-filter:blur(20px);pointer-events:none;';
    container.appendChild(bg);
    const wrap = document.createElement('div'); wrap.style.cssText = 'position:relative;z-index:1;display:flex;flex-direction:column;height:100%;';
    // 滚动内容区
    const scrollArea = document.createElement('div'); scrollArea.style.cssText = 'flex:1;overflow-y:auto;padding:4px 16px 24px;-webkit-overflow-scrolling:touch;min-height:0;';
    const currentTab = cfg.tabs[state.activeTabIndex]; const playlists = Array.isArray(currentTab?.playlists) ? currentTab.playlists : [];
    if (playlists.length === 0) { const emptyDiv = document.createElement('div'); emptyDiv.style.cssText = 'text-align:center;padding:40px 0;color:var(--b-muted,#999);font-size:13px;'; emptyDiv.textContent = '暂无音乐'; scrollArea.appendChild(emptyDiv); }
    else { const listWrap = document.createElement('div'); listWrap.className = 'pl-list-wrap'; listWrap.style.cssText = ''; playlists.forEach((pl, plIdx) => { this._renderPlaylistItem(listWrap, pl, plIdx, cfg, state, container); }); scrollArea.appendChild(listWrap); }
    wrap.appendChild(scrollArea); container.appendChild(wrap);
  }

  // 渲染对话列表
  _renderConversationList(state2, listEl) {
    const ua = state2.userAvatarUrl; const html = [];
    let lri = -1; for (let i = state2.allRows.length - 1; i >= 0; i--) { if (state2.allRows[i].user_text) { lri = i; break; } }
    state2.allRows.forEach((row, idx) => {
      html.push('<div class="conv-time-divider">' + this._formatConvTimeDisplay(row.conv_time || '') + '</div>');
      if (row.user_text) {
        const uhtml = ua ? '<img src="' + this._escapeHtml(ua) + '" class="conv-avatar-img" alt="我">' : '<ha-icon icon="mdi:account" class="conv-avatar-icon"></ha-icon>';
        html.push('<div class="conv-msg conv-msg-user"><div class="conv-bubble-wrap conv-bubble-wrap-user">' + (idx === lri ? '<span class="conv-latest-tag">最新</span>' : '') + '<div class="conv-bubble conv-bubble-user">' + this._escapeHtml(row.user_text) + '</div></div><div class="conv-avatar conv-avatar-user">' + uhtml + '</div></div>');
      }
      if (row.ai_text) {
        if (row.type === 'ALERT') { const al = this._parseAlarmTimeFromText(row.ai_text); html.push('<div class="conv-msg conv-msg-ai"><div class="conv-avatar conv-avatar-ai"><ha-icon icon="mdi:robot" class="conv-avatar-icon"></ha-icon></div><div class="conv-bubble-wrap conv-bubble-wrap-ai"><div class="conv-bubble conv-bubble-ai">' + this._escapeHtml(row.ai_text) + '</div><div class="conv-alarm-card"><div class="conv-alarm-header"><ha-icon icon="mdi:alarm"></ha-icon><span>闹钟</span></div>' + (al ? '<div class="conv-alarm-time">' + this._formatAlarmTime(al) + '</div>' : '<div class="conv-alarm-time">' + this._escapeHtml(row.ai_text) + '</div>') + '</div></div></div>'); }
        else html.push('<div class="conv-msg conv-msg-ai"><div class="conv-avatar conv-avatar-ai"><ha-icon icon="mdi:robot" class="conv-avatar-icon"></ha-icon></div><div class="conv-bubble conv-bubble-ai">' + this._escapeHtml(row.ai_text) + '</div></div>');
      }
    });
    listEl.innerHTML = html.join('');
  }

  // ── 渲染我喜欢弹窗（参照本地音乐弹窗，使用 showPopup）
  _renderFavoritePopup(uri) {
    const isLight = this._evaluateTheme() === 'light';
    const t = {
      bg: isLight ? 'rgba(255,255,255,0.98)' : 'rgba(30,30,30,0.98)',
      fg: isLight ? '#212121' : '#eee',
      muted: isLight ? '#999' : '#888',
      accent: '#e74c3c',
      playBlue: '#3498db',
      divider: isLight ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.06)',
    };
    this._favTracks = [];
    this._favError = '';
    this._favLoading = true;
    this._favPlaying = '';
    let contentArea;
    const updateContent = () => {
      if (!contentArea) return;
      const tracks = this._favTracks;
      const loading = this._favLoading;
      const error = this._favError;
      const playingUri = this._favPlaying;
      contentArea.innerHTML = '';
      if (error) {
        const errEl = document.createElement('div');
        errEl.style.cssText = `text-align:center;padding:20px;color:#e74c3c;font-size:13px;`;
        errEl.textContent = error;
        contentArea.appendChild(errEl);
      }
      if (loading) {
        const loadEl = document.createElement('div');
        loadEl.style.cssText = `display:flex;align-items:center;justify-content:center;gap:8px;padding:20px;color:${t.muted};font-size:13px;`;
        loadEl.innerHTML = `<ha-icon icon="mdi:loading" class="ma-spin"></ha-icon><span>加载歌曲...</span>`;
        contentArea.appendChild(loadEl);
      } else if (tracks.length > 0) {
        tracks.forEach((tr, idx) => {
          const item = document.createElement('div');
          item.style.cssText = `display:flex;align-items:center;gap:10px;padding:8px;border-radius:8px;transition:background 0.2s;border-bottom:1px solid ${t.divider};cursor:pointer;`;
          const numEl = document.createElement('div');
          numEl.style.cssText = `width:24px;text-align:center;font-size:12px;color:${t.muted};flex-shrink:0;`;
          numEl.textContent = idx + 1;
          item.appendChild(numEl);
          if (tr.image_url) {
            const imgEl = document.createElement('div');
            imgEl.style.cssText = `width:36px;height:36px;border-radius:6px;background-image:url('${tr.image_url}');background-size:cover;background-position:center;flex-shrink:0;`;
            item.appendChild(imgEl);
          }
          const infoEl = document.createElement('div');
          infoEl.style.cssText = `flex:1;min-width:0;`;
          const nameEl = document.createElement('div');
          nameEl.style.cssText = `font-size:13px;color:${t.fg};white-space:nowrap;overflow:hidden;text-overflow:ellipsis;`;
          nameEl.textContent = tr.name;
          infoEl.appendChild(nameEl);
          const metaEl = document.createElement('div');
          metaEl.style.cssText = `font-size:11px;color:${t.muted};margin-top:1px;`;
          metaEl.textContent = (tr.artist || '') + (tr.album ? ' · ' + tr.album : '');
          infoEl.appendChild(metaEl);
          item.appendChild(infoEl);
          item.onclick = () => this._playFavoriteTrack(tr);
          const playIcon = document.createElement('ha-icon');
          playIcon.setAttribute('icon', playingUri === tr.uri ? 'mdi:loading' : 'mdi:play-circle');
          playIcon.style.cssText = `--mdc-icon-size:20px;color:${playingUri === tr.uri ? t.accent : t.muted};flex-shrink:0;cursor:pointer;`;
          if (playingUri === tr.uri) playIcon.classList.add('ma-spin');
          playIcon.onclick = (e) => { e.stopPropagation(); this._playFavoriteTrack(tr); };
          item.appendChild(playIcon);
          const removeIcon = document.createElement('ha-icon');
          removeIcon.setAttribute('icon', 'mdi:heart-remove');
          removeIcon.style.cssText = `--mdc-icon-size:18px;color:${t.muted};flex-shrink:0;cursor:pointer;`;
          removeIcon.setAttribute('title', '取消喜欢');
          removeIcon.onclick = (e) => { e.stopPropagation(); this._removeFavoriteTrack(tr, idx); };
          item.appendChild(removeIcon);
          contentArea.appendChild(item);
        });
      } else {
        const emptyEl = document.createElement('div');
        emptyEl.style.cssText = `text-align:center;padding:40px 0;color:${t.muted};font-size:13px;`;
        emptyEl.textContent = '暂无歌曲';
        contentArea.appendChild(emptyEl);
      }
    };
    const renderContent = () => {
      const container = document.createElement('div');
      container.style.cssText = 'display:flex;flex-direction:column;flex:1;overflow:hidden;';
      const topBar = document.createElement('div');
      topBar.style.cssText = `display:flex;align-items:center;justify-content:center;position:relative;padding:14px 16px;flex-shrink:0;`;
      const titleDiv = document.createElement('div');
      titleDiv.style.cssText = `display:flex;align-items:center;gap:8px;`;
      titleDiv.innerHTML = `<ha-icon icon="mdi:heart" style="--mdc-icon-size:20px;color:${t.accent};"></ha-icon><span style="font-size:15px;font-weight:600;color:${t.fg};">我喜欢</span>`;
      topBar.appendChild(titleDiv);
      const playAllTopBtn = document.createElement('button');
      playAllTopBtn.style.cssText = `position:absolute;right:16px;display:inline-flex;align-items:center;gap:4px;padding:5px 10px;border-radius:6px;background:rgba(52,152,219,0.2);color:${t.playBlue};font-size:12px;cursor:pointer;border:1px solid rgba(52,152,219,0.25);`;
      playAllTopBtn.innerHTML = `<ha-icon icon="mdi:play-circle" style="--mdc-icon-size:16px;"></ha-icon>播放全部`;
      playAllTopBtn.onclick = () => { this._playFavoriteAll(); };
      topBar.appendChild(playAllTopBtn);
      container.appendChild(topBar);
      contentArea = document.createElement('div');
      contentArea.style.cssText = 'flex:1;overflow-y:auto;padding:10px;';
      container.appendChild(contentArea);

      updateContent();
      return container;
    };
    this._favPopupClose = this.showPopup({
      content: () => renderContent(),
      style: `background:${t.bg};backdrop-filter:blur(30px);-webkit-backdrop-filter:blur(30px);border-radius:24px;padding:0;overflow:hidden;width:95%;max-width:500px;min-width:320px;height:500px;max-height:min(700px,90vh);display:flex;flex-direction:column;`,
      showOverlay: true, showBackground: true, overlayBlur: true, popupPosition: 'top',
      onClose: () => { this._favPlaying = ''; this._favUpdate = null; },
    });
    this._favUpdate = () => { if (contentArea) { updateContent(); } };
    this._fetchFavoriteTracks(uri);
  }

  // ── 渲染 MA音乐弹窗（参照本地音乐弹窗，使用 showPopup）
  _renderMaMusicPopup() {
    const isLight = this._evaluateTheme() === 'light';
    const t = {
      bg: isLight ? 'rgba(255,255,255,0.98)' : 'rgba(30,30,30,0.98)',
      fg: isLight ? '#212121' : '#eee',
      muted: isLight ? '#999' : '#888',
      accent: '#3498db',
      divider: isLight ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.06)',
    };
    // 来源图标映射
    const providerIcons = {
      'MA音乐库': { icon: 'mdi:library-music', color: '#3498db' },
      'MA音乐': { icon: 'mdi:music-circle', color: '#27ae60' },
      '本地文件': { icon: 'mdi:folder-music', color: '#f39c12' },
    };
    this._maPlaylistDetail = null;
    this._maPlaylistTracks = [];
    this._maPlaylistTracksLoading = false;
    this._maPlayingIndex = -1;
    this._localPlaylist = [];
    this._localStatuses = [];
    this._localCurrentIndex = -1;
    this._localPlaylistSignature = '';
    this._maExpandedId = null;
    this._maPlaylistsError = '';
    this._maPlaylistsLoading = true;
    this._maPlaylistsList = [];

    let topBar, contentArea, closePopup;
    const updateTopBar = () => {
      if (!topBar) return;
      topBar.innerHTML = '';
      topBar.style.cssText = `display:flex;align-items:center;justify-content:center;padding:14px 16px;flex-shrink:0;`;
      const titleDiv = document.createElement('div');
      titleDiv.style.cssText = `display:flex;align-items:center;gap:8px;`;
      titleDiv.innerHTML = `<ha-icon icon="mdi:playlist-star" style="--mdc-icon-size:20px;color:${t.accent};"></ha-icon><span style="font-size:15px;font-weight:600;color:${t.fg};">MA音乐</span>`;
      topBar.appendChild(titleDiv);
    };
    const renderPlaylistRow = (pl) => {
      const pi = providerIcons[pl._provider] || {};
      const plId = pl.item_id || pl.uri || '';
      const isExpanded = this._maExpandedId === plId;
      const card = document.createElement('div');
      card.style.cssText = `border:1px solid ${t.divider};border-radius:12px;margin-bottom:6px;cursor:pointer;transition:border-color 0.2s;background:${isLight ? 'transparent' : 'rgba(255,255,255,0.03)'};user-select:none;`;
      card.onmouseenter = () => { card.style.borderColor = '#3498db'; };
      card.onmouseleave = () => { card.style.borderColor = t.divider; };
      const header = document.createElement('div');
      header.style.cssText = `display:flex;align-items:center;gap:8px;padding:10px 8px;cursor:pointer;`;
      header.onclick = () => this.handleMaPlaylistSelect(pl);
      const icon = document.createElement('ha-icon');
      icon.setAttribute('icon', pi.icon || 'mdi:playlist-music');
      icon.style.cssText = `--mdc-icon-size:18px;color:${pi.color || t.muted};flex-shrink:0;`;
      header.appendChild(icon);
      const nameEl = document.createElement('span');
      nameEl.style.cssText = `flex:1;font-size:13px;font-weight:600;color:${t.fg};overflow:hidden;text-overflow:ellipsis;white-space:nowrap;`;
      nameEl.textContent = pl.name || '未命名';
      header.appendChild(nameEl);
      let displayText = '';
      if (isExpanded && this._maPlaylistTracks.length > 0) {
        displayText = this._maPlaylistTracks.length + ' 首';
      } else if (pl.track_count !== undefined && pl.track_count !== null && pl.track_count >= 0) {
        displayText = pl.track_count + ' 首';
      }
      const countEl = document.createElement('span');
      countEl.style.cssText = `font-size:11px;color:${t.muted};flex-shrink:0;`;
      countEl.textContent = displayText;
      header.appendChild(countEl);
      const playBtn = document.createElement('button');
      playBtn.style.cssText = `display:flex;align-items:center;gap:3px;padding:4px 10px;border:1px solid ${isLight ? 'rgba(0,0,0,0.12)' : 'rgba(255,255,255,0.12)'};border-radius:6px;cursor:pointer;background:transparent;color:${t.accent};font-size:11px;font-weight:500;flex-shrink:0;margin-left:4px;`;
      playBtn.innerHTML = '<ha-icon icon="mdi:play" style="--mdc-icon-size:12px;"></ha-icon>播放列表';
      playBtn.onclick = (e) => { e.stopPropagation(); this.handleMaPlaylistPlay(pl); };
      header.appendChild(playBtn);

      card.appendChild(header);
      contentArea.appendChild(card);
      if (isExpanded) {
        const tracksWrap = document.createElement('div');
        tracksWrap.style.cssText = `padding:2px 0 12px 12px;border-bottom:1px solid ${t.divider};margin-bottom:6px;`;
        if (this._maPlaylistTracksLoading) {
          const loadEl = document.createElement('div');
          loadEl.style.cssText = `display:flex;align-items:center;justify-content:center;gap:8px;padding:12px;color:${t.muted};font-size:12px;`;
          loadEl.innerHTML = `<ha-icon icon="mdi:loading" class="ma-spin"></ha-icon><span>加载歌曲...</span>`;
          tracksWrap.appendChild(loadEl);
        } else if (this._maPlaylistTracks.length > 0) {
          this._maPlaylistTracks.forEach((tr, idx) => {
            const item = document.createElement('div');
            item.style.cssText = `display:flex;align-items:center;gap:8px;padding:6px 8px;border-radius:6px;cursor:pointer;`;
            item.onclick = () => this.handleMaPlaylistTrackPlay(tr);
            const numEl = document.createElement('span');
            numEl.style.cssText = `font-size:11px;color:${t.muted};width:20px;text-align:center;flex-shrink:0;`;
            numEl.textContent = idx + 1;
            item.appendChild(numEl);
            if (tr.image_url) {
              const imgEl = document.createElement('div');
              imgEl.style.cssText = `width:30px;height:30px;border-radius:4px;background-image:url('${tr.image_url}');background-size:cover;background-position:center;flex-shrink:0;`;
              item.appendChild(imgEl);
            }
            const infoDiv = document.createElement('div');
            infoDiv.style.cssText = 'flex:1;min-width:0;';
            const nameDiv = document.createElement('div');
            nameDiv.style.cssText = `font-size:12px;color:${t.fg};white-space:nowrap;overflow:hidden;text-overflow:ellipsis;`;
            nameDiv.textContent = tr.name;
            infoDiv.appendChild(nameDiv);
            const metaDiv = document.createElement('div');
            metaDiv.style.cssText = `font-size:10px;color:${t.muted};margin-top:1px;`;
            metaDiv.textContent = (tr.artist || '') + (tr.album ? ' · ' + tr.album : '');
            infoDiv.appendChild(metaDiv);
            item.appendChild(infoDiv);
            const playIcon = document.createElement('ha-icon');
            playIcon.setAttribute('icon', this._maPlaylistPlaying === tr.uri ? 'mdi:loading' : 'mdi:play-circle');
            playIcon.style.cssText = `--mdc-icon-size:16px;color:${this._maPlaylistPlaying === tr.uri ? '#3498db' : t.muted};flex-shrink:0;`;
            if (this._maPlaylistPlaying === tr.uri) playIcon.classList.add('ma-spin');
            item.appendChild(playIcon);

            tracksWrap.appendChild(item);
          });
        }
        contentArea.appendChild(tracksWrap);
      }
    };
    const renderListView = () => {
      const list = this._maPlaylistsList;
      const loading = this._maPlaylistsLoading;
      const error = this._maPlaylistsError;
      const allPlaylists = [];
      list.forEach(g => { allPlaylists.push(...g.playlists.map(pl => ({ ...pl, _provider: g.label }))); });

      if (error) {
        const errEl = document.createElement('div');
        errEl.style.cssText = `text-align:center;padding:20px;color:#e74c3c;font-size:13px;`;
        errEl.textContent = error;
        contentArea.appendChild(errEl);
      }
      if (loading) {
        const loadEl = document.createElement('div');
        loadEl.style.cssText = `display:flex;align-items:center;justify-content:center;gap:8px;padding:40px 0;color:${t.muted};font-size:13px;`;
        loadEl.innerHTML = `<ha-icon icon="mdi:loading" class="ma-spin"></ha-icon><span>加载播放列表...</span>`;
        contentArea.appendChild(loadEl);
      } else if (allPlaylists.length === 0 && !error) {
        const emptyEl = document.createElement('div');
        emptyEl.style.cssText = `text-align:center;padding:40px 0;color:${t.muted};font-size:13px;`;
        emptyEl.textContent = '暂无播放列表';
        contentArea.appendChild(emptyEl);
      } else {
        allPlaylists.forEach(pl => renderPlaylistRow(pl));
      }
    };
    const updateContent = () => {
      if (!contentArea) return;
      contentArea.innerHTML = '';
      renderListView();
    };
    const renderContent = () => {
      const container = document.createElement('div');
      container.style.cssText = 'display:flex;flex-direction:column;flex:1;overflow:hidden;';

      topBar = document.createElement('div');
      updateTopBar();
      container.appendChild(topBar);

      contentArea = document.createElement('div');
      contentArea.style.cssText = 'flex:1;overflow-y:auto;padding:10px;';
      container.appendChild(contentArea);

      updateContent();
      return container;
    };
    closePopup = this.showPopup({
      content: () => renderContent(),
      style: `background:${t.bg};backdrop-filter:blur(30px);-webkit-backdrop-filter:blur(30px);border-radius:24px;padding:0;overflow:hidden;width:95%;max-width:500px;min-width:320px;height:500px;max-height:min(700px,90vh);display:flex;flex-direction:column;`,
      showOverlay: true, showBackground: true, overlayBlur: true, popupPosition: 'top',
      onClose: () => { this._maPlaylistDetail = null; this._maPlaylistTracks = []; this._maExpandedId = null; this._maUpdate = null; this._maPopupClose = null; },
    });

    this._maPopupClose = closePopup;
    this._maUpdate = () => { if (contentArea) { updateContent(); } };

    this._fetchMaPlaylists();
  }
}
customElements.define('xiaoshi-music-card', XiaoshiMusicCard);