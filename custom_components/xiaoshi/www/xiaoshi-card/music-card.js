const whenDefined = (t) => customElements.whenDefined(t);
await Promise.race([whenDefined("ha-card"), whenDefined("ha-panel-lovelace")]);
const LitElement = window.LitElement || Object.getPrototypeOf(customElements.get("ha-card"));
const html = LitElement.prototype.html;
const css = LitElement.prototype.css;
 
window.customCards = window.customCards || [];
window.customCards.push({
  type: "xiaoshi-music-card",
  name: "Sun小爱卡片",
  description: "小爱音箱音乐播放器，配合minecraft-dashboard-card使用时自动同步房间背景主题",
  preview: true
});

class SunXiaoaiEditor extends LitElement {
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
        color: #1976d2;
      }
      select, input {
        padding: 8px;
        border: 1px solid #ddd;
        border-radius: 4px;
      }
      .entity-search-wrap {
        position: relative;
      }
      .entity-search-wrap:focus-within .entity-dropdown {
        display: block;
      }
      .entity-dropdown {
        display: none;
        position: absolute;
        top: 100%;
        left: 0;
        right: 0;
        max-height: 200px;
        overflow-y: auto;
        background: var(--card-background-color,var(--primary-background-color,#fff));
        border: 1px solid var(--divider-color,#ddd);
        border-radius: 0 0 4px 4px;
        z-index: 999;
        box-shadow: 0 4px 12px var(--shadow-color,rgba(0,0,0,0.15));
      }
      .entity-dropdown-item {
        padding: 5px 10px;
        cursor: pointer;
        font-size: 12px;
        color: var(--primary-text-color,#212121);
        border-bottom: 1px solid var(--divider-color,#eee);
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      .entity-dropdown-item:hover {
        background: var(--secondary-background-color,rgba(0,0,0,0.06));
      }
      .entity-dropdown-item.active {
        background: var(--primary-color,rgba(3,169,244,0.2));
        color: var(--primary-color,#03a9f4);
        font-weight: 600;
      }
    `;
  }

  render() {
    if (!this.hass || !this.config) return html``;
    // 加载 HA 媒体源列表（含二级子目录）
    if (!this._localMusicSources && this.hass.callWS) {
      this._localMusicSources = [];
      this.hass.callWS({type:'media_source/browse_media'}).then(r => {
        const root = r?.children || [];
        Promise.all(root.map(s => this.hass.callWS({type:'media_source/browse_media', media_content_id: s.media_content_id}).then(sub => { s.subs = sub?.children || []; }).catch(() => { s.subs = []; }))).then(() => {
          this._localMusicSources = root;
          this.requestUpdate();
        });
      }).catch(() => { this._localMusicSources = []; });
    }

    return html`
      <div class="form">
        <div class="module-section-header" style="font-size:12px;font-weight:700;color:#2980b9;background:#ebf5fb;padding:6px 10px;margin:12px 0 4px;border-radius:4px;border-left:3px solid #2980b9;">🎨 卡片展示配置</div>
        
        <div style="display:flex;flex-direction:row;align-items:center;gap:8px;">
          <label style="white-space:nowrap;margin:0;">主题</label>
          <select 
            @change=${this._entityChanged}
            .value=${this.config.theme !== undefined ? this.config.theme : 'system'}
            name="theme"
            style="flex:1;"
          >
            <option value="system">跟随系统</option>
            <option value="light">浅色主题</option>
            <option value="dark">深色主题</option>
            <option value="sun">跟随日出日落</option>
            <option value="function">跟随函数</option>
          </select>
        </div>
        
        <div style="display:flex;flex-direction:row;gap:6px;">
          <div style="flex:1;min-width:0;display:flex;flex-direction:row;align-items:center;gap:4px;">
            <label style="white-space:nowrap;margin:0;">卡片宽度</label>
            <input 
              type="text" 
              @change=${this._entityChanged}
              .value=${this.config.width !== undefined ? this.config.width : '100%'}
              name="width"
              placeholder="100%"
              style="flex:1;min-width:0;box-sizing:border-box;"
            />
          </div>
          <div style="flex:1;min-width:0;display:flex;flex-direction:row;align-items:center;gap:4px;">
            <label style="white-space:nowrap;margin:0;">卡片高度</label>
            <input 
              type="text" 
              @change=${this._entityChanged}
              .value=${this.config.height !== undefined ? this.config.height : 'auto'}
              name="height"
              placeholder="auto"
              style="flex:1;min-width:0;box-sizing:border-box;"
            />
          </div>
          <div style="flex:1;min-width:0;display:flex;flex-direction:row;align-items:center;gap:4px;">
            <label style="white-space:nowrap;margin:0;">歌词高度</label>
            <input 
              type="text" 
              @change=${this._entityChanged}
              .value=${this.config.lyrics_height !== undefined ? this.config.lyrics_height : '200px'}
              name="lyrics_height"
              placeholder="200px"
              style="flex:1;min-width:0;box-sizing:border-box;"
            />
          </div>
        </div>

        <div class="module-section-header" style="font-size:12px;font-weight:700;color:#c0392b;background:#fdedec;padding:6px 10px;margin:12px 0 4px;border-radius:4px;border-left:3px solid #c0392b;">📡 设备组配置</div>

        ${(() => {
          const devices = this.config.devices || [];
          return devices.map((d, di) => {
            const entityOptions = (prefix, selfId) => Object.keys(this.hass.states)
              .filter(e => e.startsWith(prefix))
              .map(e => {
                const platform = this.hass.entities?.[e]?.platform || '';
                const fname = this.hass.states[e].attributes.friendly_name || e;
                const label = platform ? `${fname} [ ${platform}集成 ]` : fname;
                return html`<option value="${e}" .selected=${(d[selfId] || '') === e}>${label}</option>`;
              });
            const textOptions = Object.keys(this.hass.states)
              .filter(e => e.startsWith('text.'))
              .map(e => html`<option value="${e}" .selected=${(d.execute_text_directive || '') === e}>${this.hass.states[e].attributes.friendly_name || e}</option>`);
            return html`
            <div style="border:1px solid #ddd;border-radius:6px;padding:8px;margin-bottom:8px;position:relative;">
              <div style="display:flex;align-items:center;gap:6px;margin-bottom:6px;">
                <label style="font-weight:700;font-size:12px;margin:0;">设备名称</label>
                <input style="flex:1;" @change=${(e) => { devices[di] = {...devices[di], name: e.target.value}; this._entityChanged({target:{name:'devices',value:JSON.stringify(devices)}}); }} .value=${d.name || ''} placeholder="例如: 卧室音箱" />
                ${di > 0 ? html`<button style="background:#e74c3c;color:#fff;border:none;border-radius:4px;padding:2px 8px;cursor:pointer;font-size:11px;" @click=${() => { const newDevices = devices.filter((_, idx) => idx !== di); this._entityChanged({target:{name:'devices',value:JSON.stringify(newDevices)}}); }}>✕ 删除</button>` : ''}
              </div>
              ${(() => {
                const save = (selfId, val) => {
                  const d2 = {...devices[di], [selfId]: val};
                  const nd = [...devices];
                  nd[di] = d2;
                  this._entityChanged({target:{name:'devices',value:JSON.stringify(nd)}});
                };
                return html`
              <div class="form-group">
                <label>小米Home实体 (xiaomi_home)</label>
                <select @change=${(e) => save('xiaomi_home', e.target.value)} .value=${d.xiaomi_home || ''}>
                  <option value="">选择小米Home实体</option>
                  ${entityOptions('media_player.', 'xiaomi_home')}
                </select>
              </div>
              <div class="form-group">
                <label>小米Miot实体 (xiaomi_miot)</label>
                <select @change=${(e) => save('xiaomi_miot', e.target.value)} .value=${d.xiaomi_miot || ''}>
                  <option value="">选择小米Miot实体（可选）</option>
                  ${entityOptions('media_player.', 'xiaomi_miot')}
                </select>
              </div>
              <div class="form-group">
                <label>[MA集成] 播放器实体 (ma_player_entity)</label>
                <select @change=${(e) => save('ma_player_entity', e.target.value)} .value=${d.ma_player_entity || ''}>
                  <option value="">选择 MA 播放器实体</option>
                  ${entityOptions('media_player.', 'ma_player_entity')}
                </select>
              </div>
                `; })()}
              ${(() => {
                const searchPicker = (label, selfId, prefix) => {
                  const selectedId = d[selfId] || '';
                  const selPlatform = selectedId ? (this.hass.entities?.[selectedId]?.platform || '') : '';
                  const displayVal = selPlatform ? `${selectedId} [集成${selPlatform}]` : selectedId;
                  const ents = Object.keys(this.hass.states)
                    .filter(e => !prefix || e.startsWith(prefix))
                    .map(e => ({
                      id: e,
                      fname: this.hass.states[e].attributes.friendly_name || e,
                      platform: this.hass.entities?.[e]?.platform || ''
                    }));
                  const saveSel = (eid) => {
                    const nd = [...devices];
                    nd[di] = {...devices[di], [selfId]: eid};
                    this._entityChanged({target:{name:'devices',value:JSON.stringify(nd)}});
                  };
                  return html`
                    <label>${label}</label>
                    <div class="entity-search-wrap">
                      <input type="text" .value="${displayVal}"
                        placeholder="搜索或选择实体..."
                        style="width:100%;box-sizing:border-box;"
                        @focus=${(e) => { e.target.select(); }}
                        @input=${(e) => {
                          const kw = e.target.value.toLowerCase();
                          const wrap = e.target.closest('.entity-search-wrap');
                          if (!wrap) return;
                          const items = wrap.querySelectorAll('.entity-dropdown-item:not(.entity-clear)');
                          items.forEach(el => {
                            el.style.display = (!kw || el.textContent.toLowerCase().includes(kw)) ? '' : 'none';
                          });
                        }}
                      />
                      <div class="entity-dropdown">
                        <div class="entity-dropdown-item entity-clear" style="color:#999;"
                          @mousedown=${(e) => { e.preventDefault(); saveSel(''); e.target.closest('.entity-search-wrap')?.querySelector('input')?.blur(); }}>
                          -- 清空 --
                        </div>
                        ${ents.map(ent => {
                          const lbl = ent.platform ? `${ent.fname} (${ent.id}) [${ent.platform}集成]` : `${ent.fname} (${ent.id})`;
                          return html`
                            <div class="entity-dropdown-item ${ent.id === selectedId ? 'active' : ''}"
                              @mousedown=${(e) => {
                                e.preventDefault();
                                saveSel(ent.id);
                                e.target.closest('.entity-search-wrap')?.querySelector('input')?.blur();
                              }}
                              title="${ent.id}">
                              ${lbl}
                            </div>`;
                        })}
                      </div>
                    </div>
                  `;
                };
                return html`
              <div class="form-group">
                ${searchPicker('[MA集成] 收藏歌曲按钮实体 (搜索: favorite_current_song)', 'favorite_current_song', 'button.')}
              </div>
              <div class="form-group">
                ${searchPicker('停止闹钟按钮实体 (搜索: stop_alarm)', 'stop_alarm', 'button.')}
              </div>
              <div class="form-group">
                ${searchPicker('播报文本实体 (搜索: play_text)', 'play_text', 'text.')}
              </div>
              <div class="form-group">
                ${searchPicker('执行文本实体 (搜索: execute_text_directive)', 'execute_text_directive', 'text.')}
              </div>
              <div class="form-group">
                ${searchPicker('[Home集成] 小米电台按钮实体 (搜索: play_radio)', 'play_radio', 'button.')}
              </div>
              <div class="form-group">
                ${searchPicker('[Miot集成] 播放控制实体 (搜索: conversation)', 'conversation', '')}
              </div>
                `; })()}
            </div>`;
          });
        })()}

        <button style="background:#c0392b;color:#fff;border:none;border-radius:4px;padding:6px 12px;cursor:pointer;font-size:12px;margin-bottom:8px;" @click=${() => { const d = [...(this.config.devices || []), { name: '', xiaomi_home: '', xiaomi_miot: '', ma_player_entity: '', favorite_current_song: '', stop_alarm: '', play_radio: '', conversation: '', play_text: '', execute_text_directive: '' }]; this._entityChanged({target:{name:'devices',value:JSON.stringify(d)}}); }}>＋ 添加设备组</button>

        <div class="module-section-header local" style="font-size:12px;font-weight:700;color:#27ae60;background:#eafaf1;padding:6px 10px;margin:12px 0 4px;border-radius:4px;border-left:3px solid #27ae60;">🎵 本地音乐配置</div>

        <div class="form-group">
          <label>本地播放路径 (每行一个路径，支持多个路径)<br></label>
          <textarea @change=${this._entityChanged} .value=${this.config.local_music_path || ''} name="local_music_path" placeholder="例如:&#10;media-source://media_source/local/&#10;media-source://media_source/local/music2/" rows="3" style="padding:8px;border:1px solid #ddd;border-radius:4px;resize:vertical;"></textarea>
          <small style="color:#888;margin-top:2px;">快捷添加（含子目录，会追加到已有路径）:</small>
          <select @change=${(e) => { const val = e.target.value; if (!val) return; const old = this.config.local_music_path || ''; const newVal = old ? (old + '\n' + val) : val; this._entityChanged({target: {name: 'local_music_path', value: newVal}}); e.target.value = ''; }}>
            <option value="">-- 快捷路径 --</option>
            ${this._localMusicSources?.flatMap(s => [
              html`<option value="${s.media_content_id}">📁 ${s.title || s.media_content_id}</option>`,
              ...(s.subs || []).filter(c => c.can_expand).map(c => html`<option value="${c.media_content_id}"> &nbsp;&nbsp;📁 ${c.title}</option>`)
            ])}
          </select>
        </div>


        <div class="module-section-header ma" style="font-size:12px;font-weight:700;color:#e67e22;background:#fef5e7;padding:6px 10px;margin:12px 0 4px;border-radius:4px;border-left:3px solid #e67e22;">🎵 Music Assistant 配置</div>

        <div class="form-group">
          <label>[MA] MA 服务器地址 (ma_server_url)</label>
          <input @change=${this._entityChanged} .value=${this.config.ma_server_url || ''} name="ma_server_url" placeholder="http://192.168.2.54:8095">
        </div>
        <div class="form-group">
          <label>[MA] MA API Token (ma_server_token)</label>
          <input @change=${this._entityChanged} .value=${this.config.ma_server_token || ''} name="ma_server_token" placeholder="eyJhbG...长token">
        </div>
        <div class="form-group">
          <label>[MA] MA 播放器实体 (ma_player_entity)</label>
          <select @change=${this._entityChanged} .value=${this.config.ma_player_entity || ''} name="ma_player_entity">
            <option value="">选择 MA 播放器实体</option>
            ${Object.keys(this.hass.states).filter(e=>e.startsWith('media_player.')).map(e=>html`<option value="${e}" .selected=${e===this.config.ma_player_entity}>${this.hass.states[e].attributes.friendly_name||e}</option>`)}
          </select>
        </div>
        <div class="form-group">
          <label>[MA] 网易云 API 地址 (netease_api_url)</label>
          <input @change=${this._entityChanged} .value=${this.config.netease_api_url || 'http://192.168.2.54:3003'} name="netease_api_url">
        </div>
        <div class="form-group">
          <label>[MA] 网易云用户 ID (netease_uid)</label>
          <input @change=${this._entityChanged} .value=${this.config.netease_uid || ''} name="netease_uid" placeholder="394051110">
        </div>
        <div class="form-group">
          <label>[MA] 手动歌单配置 (ma_playlists) — 每行一歌单: 名称|MA_URI</label>
          <textarea @change=${this._entityChanged} .value=${this.config.ma_playlists || ''} name="ma_playlists" rows="4" placeholder="我喜欢|library/8&#10;BGM|library/12" style="padding:8px;border:1px solid #ddd;border-radius:4px;resize:vertical;"></textarea>
        </div>

        <div class="form-group">
          <label>[通用] 快捷输入列表 (quick_input) — 每行一个</label>
          <textarea @change=${this._entityChanged} .value=${Array.isArray(this.config.quick_input) ? this.config.quick_input.join('\n') : (this.config.quick_input || '')} name="quick_input" rows="3" placeholder="打开空调&#10;关闭窗帘&#10;播放音乐" style="padding:8px;border:1px solid #ddd;border-radius:4px;resize:vertical;"></textarea>
        </div>

      </div>
    `;
  }

  _entityChanged(e) {
    const { name, value } = e.target;
    if (!value && name !== 'theme' && name !== 'width' && name !== 'height' && name !== 'lyrics_height' && name !== 'local_music_path' && name !== 'ma_server_url' && name !== 'ma_server_token' && name !== 'ma_player_entity' && name !== 'ma_playlists' && name !== 'netease_api_url' && name !== 'netease_uid' && name !== 'devices') return;
    
    // 对于width字段，如果为空则使用默认值100%
    // 对于height字段，如果为空则使用默认值auto
    // 对于lyrics_height字段，如果为空则使用默认值200px
    let finalValue = value;
    if (name === 'width') {
      finalValue = value || '100%';
    } else if (name === 'height') {
      finalValue = value || 'auto';
    } else if (name === 'lyrics_height') {
      finalValue = value || '200px';
    } else if (name === 'devices') {
      // devices 是 JSON 字符串，需要解析
      try { finalValue = JSON.parse(value); } catch(e) { finalValue = []; }
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

  setConfig(config) {
    this.config = config;
  }
}
customElements.define('xiaoshi-music-card-editor', SunXiaoaiEditor);

class SunXiaoaiCard extends LitElement {
  static get properties() {
    return {
      _hass: { type: Object },
      _config: { type: Object },
      xiaomiHomeEntity: { type: String },
      xiaomiMiotEntity: { type: String },
      xiaomiHomeState: { type: Object },
      xiaomiMiotState: { type: Object },
      volumeState: { type: Number },
      isPlaying: { type: Boolean },
      theme: { type: String },
      width: { type: String },
      height: { type: String },
      lyricsHeight: { type: String },
      showLyrics: { type: Boolean },
      lyrics: { type: Array },
      currentLyricIndex: { type: Number },
      lyricProgress: { type: Number },


      favoriteSongEntity: { type: String },
      stopAlarmEntity: { type: String },
      action3Entity: { type: String },
      action4Entity: { type: String },
      action5Entity: { type: String },
      sidebarRadioEntity: { type: String },
      textDirectiveEntity: { type: String },

      _textSearchVisible: { type: Boolean },
      _textSearchQuery: { type: String },
      _textSearchStatus: { type: String },
      _textSearchHistory: { type: Array },
      // 本地音乐播放器相关
      _mediaPlayerState: { type: Object },
      _backendActive: { type: Boolean },
      _conversationEntity: { type: String },
      _currentConversationBubbleRef: { type: Object },
      // 本地音乐播放覆盖信息（参照 xiaoshi-music-card 的 overlay 模式）
      // ── 三通道独立 overlay（三大板块互不干扰）──
      _miotOverlay: { type: Object },   // 板块1: 小米音乐/小米语音
      _localOverlay: { type: Object },  // 板块2: 本地音乐
      _maOverlay: { type: Object },     // 板块3: 网易推荐/QQ音乐
      _activeChannel: { type: String }, // 当前活跃通道: 'miot' | 'local' | 'ma' | ''
      // channel 专用 lastSong 跟踪（每个通道独立判断切歌）
      _miotLastSongTitle: { type: String },
      _miotLastSongArtist: { type: String },
      _localLastSongTitle: { type: String },
      _localLastSongArtist: { type: String },
      _maLastSongTitle: { type: String },
      _maLastSongArtist: { type: String },
    };
  }

  static get styles() {
    return css`
      :host {
        display: block;
        width: 100%;
        border-radius: 16px;
        padding: 0px;
        margin-top: 0;
        cursor: none;
        --mdc-ripple-press-opacity: 0;
      }

      .card {
        position: relative;
        border-radius: 16px;
        overflow: hidden;
        box-sizing: border-box;
        background-size: cover;
        background-position: center;
        min-height: 320px;
        display: flex;
        flex-direction: column;
      }

      .card-bg-overlay {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        z-index: 0;
        transition: background 0.3s ease;
      }

      .card-bg-overlay.off-overlay {
        background: var(--xiaoshi-overlay-off, rgba(15, 12, 8, 0.60));
      }

      .card-bg-overlay.on-overlay {
        background: var(--xiaoshi-overlay-on, rgba(15, 12, 8, 0.35));
      }

      .album-bg-layer {
        position: absolute;
        top: -10%;
        left: -10%;
        width: 120%;
        height: 120%;
        z-index: 0;
        background-size: cover;
        background-position: center;
        background-repeat: no-repeat;
        opacity: 0.5;
        pointer-events: none;
      }

      .player-content {
        position: relative;
        z-index: 2;
        display: flex;
        flex-direction: row;
        align-items: flex-start;
        padding: 10px;
        gap: 12px;
        flex: 1;
        min-height: 0;
      }

      .left-sidebar {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 8px;
        width: 70px;
        flex-shrink: 0;
        padding: 2px 0 0 0;
      }

      .device-info-block {
        background: var(--xiaoshi-btn-bg, rgba(255, 255, 255, 0.10));
        border-radius: 12px;
        padding: 8px 4px;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 4px;
        width: 60px;
        box-sizing: border-box;
      }

      .device-status-text {
        font-size: 9px;
        font-weight: 600;
        color: var(--xiaoshi-muted, rgba(255, 255, 255, 0.75));
        text-align: center;
        text-shadow: var(--xiaoshi-text-shadow, 0 1px 4px rgba(0, 0, 0, 0.5));
        white-space: nowrap;
      }

      .sidebar-device-avatar {
        width: 40px;
        height: 40px;
        border-radius: 50%;
        background-size: cover;
        background-position: center;
        background-color: rgba(60, 50, 40, 0.6);
        display: flex;
        align-items: center;
        justify-content: center;
        overflow: hidden;
      }

      .sidebar-device-name {
        font-size: 8px;
        color: var(--xiaoshi-muted, rgba(255, 255, 255, 0.5));
        text-align: center;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        max-width: 60px;
        text-shadow: var(--xiaoshi-text-shadow, 0 1px 3px rgba(0, 0, 0, 0.5));
      }

      .device-list {
        display: flex;
        flex-direction: column;
        gap: 4px;
        width: 60px;
      }
      .device-list-item {
        background: var(--xiaoshi-btn-bg, rgba(255, 255, 255, 0.15));
        border: 2px solid transparent;
        border-radius: 10px;
        padding: 7px 4px;
        cursor: pointer;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 3px;
        transition: all 0.2s;
      }
      .device-list-item:hover {
        background: var(--xiaoshi-btn-hover, rgba(255, 255, 255, 0.22));
      }
      .device-list-item.active {
        border-color: var(--xiaoshi-accent, rgba(25,165,225,0.8));
        background: var(--xiaoshi-btn-active, rgba(25,165,225,0.25));
      }
      .device-list-item .dev-name {
        font-size: 10px;
        font-weight: 600;
        color: var(--xiaoshi-text, rgba(255, 255, 255, 0.9));
        text-align: center;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        max-width: 54px;
      }
      .device-list-item .dev-status {
        font-size: 8px;
        color: var(--xiaoshi-muted, rgba(255, 255, 255, 0.6));
        text-align: center;
      }

      .sidebar-btn {
        background: var(--xiaoshi-btn-bg, rgba(255, 255, 255, 0.15));
        border: none;
        border-radius: 12px;
        color: var(--xiaoshi-text, #fff);
        cursor: pointer;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 3px;
        width: 56px;
        height: 56px;
        transition: background 0.2s;
        --mdc-ripple-press-opacity: 0;
        --mdc-icon-size: 20px;
        text-shadow: var(--xiaoshi-text-shadow, 0 1px 4px rgba(0, 0, 0, 0.6));
      }

      .sidebar-btn:active {
        background: var(--xiaoshi-btn-active, rgba(255, 255, 255, 0.25));
      }

      .sidebar-btn-label {
        font-size: 9px;
        color: var(--xiaoshi-text, #fff);
        text-shadow: var(--xiaoshi-text-shadow, 0 1px 4px rgba(0, 0, 0, 0.7));
        letter-spacing: 0.3px;
        font-weight: 500;
      }

      .player-main {
        display: flex;
        flex-direction: column;
        gap: 6px;
        flex: 1;
        min-width: 0;
        min-height: 0;
        padding-top: 0;
      }

      .top-bar {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 8px;
      }

      .top-bar-left {
        display: flex;
        align-items: center;
        gap: 8px;
        flex: 1;
        min-width: 0;
      }

      .device-name {
        font-size: 14px;
        font-weight: 600;
        color: var(--xiaoshi-text, #fff);
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        text-shadow: var(--xiaoshi-text-shadow, 0 2px 8px rgba(0, 0, 0, 0.8));
      }

      .state-text {
        font-size: 12px;
        color: var(--xiaoshi-muted, rgba(255, 255, 255, 0.6));
        text-shadow: var(--xiaoshi-text-shadow, 0 1px 6px rgba(0, 0, 0, 0.7));
      }

      .power-btn {
        background: var(--xiaoshi-btn-bg, rgba(255, 255, 255, 0.15));
        border: none;
        border-radius: 8px;
        color: var(--xiaoshi-text, #fff);
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        width: 32px;
        height: 32px;
        transition: background 0.2s;
        --mdc-ripple-press-opacity: 0;
        text-shadow: var(--xiaoshi-text-shadow, 0 1px 4px rgba(0, 0, 0, 0.5));
      }

      .power-btn:active {
        background: var(--xiaoshi-btn-active, rgba(255, 255, 255, 0.3));
      }

      .main-area {
        display: flex;
        align-items: flex-start;
        gap: 14px;
        flex: 0 0 auto;
        min-height: 0;
      }

      .album-art {
        width: 120px;
        height: 120px;
        border-radius: 20px;
        background-size: cover;
        background-position: center;
        background-color: rgba(60, 50, 40, 0.6);
        flex-shrink: 0;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.35);
      }

      .album-art-placeholder {
        color: var(--xiaoshi-muted, rgba(255, 255, 255, 0.5));
        text-shadow: var(--xiaoshi-text-shadow, 0 1px 4px rgba(0, 0, 0, 0.5));
      }

      .song-info-area {
        display: flex;
        flex-direction: column;
        gap: 6px;
        flex: 1;
        min-width: 0;
      }

      .song-title {
        font-size: 18px;
        font-weight: 700;
        color: var(--xiaoshi-text, #fff);
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        text-shadow: var(--xiaoshi-text-shadow, 0 2px 8px rgba(0, 0, 0, 0.8));
      }

      .song-artist {
        font-size: 13px;
        font-weight: 400;
        color: var(--xiaoshi-muted, rgba(255, 255, 255, 0.75));
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        text-shadow: var(--xiaoshi-text-shadow, 0 1px 6px rgba(0, 0, 0, 0.7));
      }

      .song-source {
        font-size: 11px;
        color: var(--xiaoshi-muted, rgba(255, 255, 255, 0.45));
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        text-shadow: var(--xiaoshi-text-shadow, 0 1px 4px rgba(0, 0, 0, 0.5));
      }

      .action-buttons-row {
        display: flex;
        gap: 4px;
        margin-top: 8px;
        flex-wrap: nowrap;
      }

      .action-btn {
        background: var(--xiaoshi-btn-bg, rgba(255, 255, 255, 0.12));
        border: none;
        border-radius: 8px;
        color: var(--xiaoshi-text, #fff);
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 5px 8px;
        font-size: 12px;
        transition: all 0.2s;
        --mdc-icon-size: 14px;
        --mdc-ripple-press-opacity: 0;
      }

      .action-btn:hover {
        background: var(--xiaoshi-btn-hover, rgba(255, 255, 255, 0.22));
      }

      .action-btn:active {
        background: var(--xiaoshi-btn-active, rgba(255, 255, 255, 0.3));
      }

      .action-btn ha-icon {
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .action-btn-label {
        font-size: 12px;
        font-weight: 500;
        white-space: nowrap;
      }

      .progress-area {
        display: flex;
        align-items: center;
        gap: 8px;
        flex-shrink: 0;
      }

      .progress-time {
        font-size: 11px;
        color: var(--xiaoshi-muted, rgba(255, 255, 255, 0.7));
        min-width: 36px;
        text-align: center;
        text-shadow: var(--xiaoshi-text-shadow, 0 1px 4px rgba(0, 0, 0, 0.5));
      }

      .progress-track {
        flex: 1;
        height: 4px;
        background: var(--xiaoshi-btn-bg, rgba(255, 255, 255, 0.15));
        border-radius: 2px;
        position: relative;
        overflow: hidden;
      }

      .progress-fill {
        position: absolute;
        top: 0;
        left: 0;
        height: 100%;
        border-radius: 2px;
        background: linear-gradient(to right, rgb(25, 165, 225), rgb(120, 210, 255));
        transition: width 0.1s linear;
      }

      .controls-area {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 10px;
        flex-shrink: 0;
      }

      .control-btn {
        background: var(--xiaoshi-btn-bg, rgba(255, 255, 255, 0.15));
        border: none;
        border-radius: 8px;
        color: var(--xiaoshi-text, #fff);
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        width: 32px;
        height: 32px;
        transition: background 0.2s;
        --mdc-ripple-press-opacity: 0;
        --mdc-icon-size: 20px;
        text-shadow: var(--xiaoshi-text-shadow, 0 1px 4px rgba(0, 0, 0, 0.5));
        flex-shrink: 0;
      }

      .control-btn:active {
        background: var(--xiaoshi-btn-active, rgba(255, 255, 255, 0.3));
      }

      .control-btn.active-ctrl {
        border: 1px solid rgba(25,165,225,0.4);
      }

      .play-pause-btn {
        background: rgba(25, 165, 225, 0.55);
        border: none;
        border-radius: 50%;
        color: #fff;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        width: 52px;
        height: 52px;
        transition: background 0.2s;
        --mdc-ripple-press-opacity: 0;
        --mdc-icon-size: 28px;
        text-shadow: var(--xiaoshi-text-shadow, 0 1px 4px rgba(0, 0, 0, 0.3));
      }

      .play-pause-btn:active {
        background: rgba(25, 165, 225, 0.75);
      }

      .volume-area {
        display: flex;
        align-items: center;
        gap: 8px;
        flex-shrink: 0;
      }

      .volume-icon-btn {
        background: none;
        border: none;
        color: var(--xiaoshi-text, rgba(255, 255, 255, 0.8));
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        --mdc-icon-size: 20px;
        text-shadow: var(--xiaoshi-text-shadow, 0 1px 4px rgba(0, 0, 0, 0.5));
      }

      .volume-value {
        font-size: 12px;
        color: var(--xiaoshi-muted, rgba(255, 255, 255, 0.7));
        min-width: 30px;
        text-align: center;
        text-shadow: var(--xiaoshi-text-shadow, 0 1px 4px rgba(0, 0, 0, 0.5));
      }

      .volume-track {
        flex: 1;
        height: 4px;
        background: var(--xiaoshi-btn-bg, rgba(255, 255, 255, 0.15));
        border-radius: 2px;
        position: relative;
        cursor: pointer;
        touch-action: none;
      }

      .volume-fill {
        position: absolute;
        top: 0;
        left: 0;
        height: 100%;
        border-radius: 2px;
        background: linear-gradient(to right, rgb(255, 160, 0), rgb(255, 205, 50));
      }

      .volume-thumb {
        position: absolute;
        top: 50%;
        width: 14px;
        height: 14px;
        border-radius: 50%;
        background: rgb(255, 205, 50);
        border: 2px solid #fff;
        transform: translate(-50%, -50%);
        cursor: pointer;
        touch-action: none;
        box-shadow: 0 1px 4px rgba(0, 0, 0, 0.3);
      }

      .lyrics-area-inline {
        display: flex;
        align-items: stretch;
        justify-content: center;
        padding: 0;
        overflow: hidden;
        position: relative;
        width: 100%;
        flex: 1 1 auto;
        min-height: 0;
      }

      .lyrics-container {
        height: 100%;
        width: calc(100% - 50px);
        overflow-y: auto;
        overflow-x: hidden;
        scrollbar-width: none;
        -ms-overflow-style: none;
        position: relative;
        scroll-behavior: smooth;
        -webkit-overflow-scrolling: touch;

        mask-image: linear-gradient(
          to bottom,
          transparent 0%,
          black 15%,
          black 85%,
          transparent 100%
        );
        -webkit-mask-image: linear-gradient(
          to bottom,
          transparent 0%,
          black 15%,
          black 85%,
          transparent 100%
        );
      }

      .lyrics-container::-webkit-scrollbar {
        display: none;
      }

      .lyrics-controls {
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        gap: 8px;
        padding: 10px 5px;
        position: absolute;
        right: 0;
        top: 50%;
        transform: translateY(-50%);
        flex-shrink: 0;
        width: 30px;
      }

      .lyrics-control-btn {
        background: rgba(200, 200, 200, 0.1);
        border: none;
        border-radius: 5px;
        width: 25px;
        height: 25px;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        color: white;
        font-size: 16px;
        font-weight: bold;
        transition: all 0.2s ease;
        --mdc-icon-size: 15px;
      }

      .lyrics-adjustment-toast {
        position: absolute;
        top: 50%;
        right: calc(70% + 5px);
        transform: translateY(-50%);
        background: rgba(0, 0, 0, 0.95);
        color: white;
        padding: 10px 18px;
        border-radius: 25px;
        font-size: 10px;
        font-weight: 600;
        z-index: 1000;
        pointer-events: none;
        opacity: 0;
        transition: opacity 0.4s ease, transform 0.3s ease;
        backdrop-filter: blur(10px);
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.4);
        white-space: nowrap;
        border: 1px solid rgba(255, 255, 255, 0.1);
      }

      .lyrics-adjustment-toast.show {
        opacity: 1;
        transform: translateY(-50%) translateX(-5px);
      }

      .lyrics-top-spacer {
        height: 16px;
        flex-shrink: 0;
      }

      .lyrics-spacer {
        height: 50px;
        flex-shrink: 0;
      }

      .lyric {
        text-align: center;
        transition: all 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94);
        line-height: 1.5;
        font-weight: 400;
        letter-spacing: -0.2px;
        transform: scale(0.95);
        color: rgba(255, 255, 255, 0.6);
        opacity: 0.6;
        cursor: pointer;
      }

      .lyric.active {
        opacity: 1;
        font-weight: 600;
        transform: scale(1.05);
        padding: 10px 26px;
        letter-spacing: -0.1px;
        color: rgb(25, 165, 225);
        transition: all 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94);
      }

      .lyric.active[style*="--progress"] {
        background: linear-gradient(
          90deg,
          rgb(25, 165, 225) 0%,
          rgb(25, 165, 225) var(--progress, 0%),
          rgba(255, 255, 255, 0.6) var(--progress, 0%),
          rgba(255, 255, 255, 0.6) 100%
        );
        background-clip: text;
        -webkit-background-clip: text;
        color: transparent;
        transition: background-position 0.1s linear, background-size 0.1s linear;
        -webkit-font-smoothing: antialiased;
      }

      .lyric.active:not([style*="--progress"]) {
        color: rgb(25, 165, 225);
        transition: color 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94);
      }

      .lyric:hover {
        opacity: 0.8;
        transform: scale(1.02);
      }

      /* 小米搜索面板 */
      .ma-search-overlay {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.5);
        backdrop-filter: blur(4px);
        -webkit-backdrop-filter: blur(4px);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 100;
        border-radius: 16px;
        animation: ma-fade-in 0.2s ease;
      }

      @keyframes ma-fade-in {
        from { opacity: 0; }
        to { opacity: 1; }
      }

      .ma-search-panel {
        width: 88%;
        max-width: 420px;
        max-height: 80%;
        background: rgba(30, 28, 32, 0.95);
        border-radius: 12px;
        display: flex;
        flex-direction: column;
        overflow: hidden;
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
        color: #fff;
      }

      .ma-search-results {
        flex: 1;
        overflow-y: auto;
        padding: 6px;
        min-height: 120px;
        max-height: 360px;
      }

      .ma-search-results::-webkit-scrollbar {
        width: 6px;
      }

      .ma-search-results::-webkit-scrollbar-thumb {
        background: rgba(255, 255, 255, 0.2);
        border-radius: 3px;
      }

      .ma-search-empty,
      .ma-search-loading {
        padding: 32px 16px;
        text-align: center;
        color: rgba(255, 255, 255, 0.5);
        font-size: 13px;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
      }

      .pl-panel {
        width: 88%;
        max-width: 420px;
        max-height: 80%;
        background: rgba(30, 28, 32, 0.95);
        border-radius: 12px;
        display: flex;
        flex-direction: column;
        overflow: hidden;
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
        color: #fff;
      }

      .ma-search-header {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 12px;
        border-bottom: 1px solid rgba(255, 255, 255, 0.1);
      }

      .ma-search-icon {
        color: rgba(255, 255, 255, 0.6);
        --mdc-icon-size: 20px;
        flex-shrink: 0;
      }

      .ma-search-input {
        flex: 1;
        background: transparent;
        border: none;
        color: #fff;
        font-size: 14px;
        outline: none;
        padding: 6px 0;
        min-width: 0;
      }

      .ma-search-input::placeholder {
        color: rgba(255, 255, 255, 0.4);
      }

      .ma-search-btn {
        background: rgba(25, 165, 225, 0.6);
        border: none;
        color: #fff;
        padding: 6px 14px;
        border-radius: 6px;
        cursor: pointer;
        font-size: 13px;
        display: flex;
        align-items: center;
        gap: 4px;
        flex-shrink: 0;
        transition: background 0.2s;
      }

      .ma-search-btn:hover:not(:disabled) {
        background: rgba(25, 165, 225, 0.9);
      }

      .ma-search-btn:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }

      .ma-close-btn {
        background: transparent;
        border: none;
        color: rgba(255, 255, 255, 0.6);
        cursor: pointer;
        padding: 4px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 50%;
        flex-shrink: 0;
        transition: background 0.2s;
      }

      .ma-close-btn:hover {
        background: rgba(255, 255, 255, 0.1);
        color: #fff;
      }

      .ma-spin {
        animation: ma-spin 1s linear infinite;
      }

      @keyframes ma-spin {
        from { transform: rotate(0deg); }
        to { transform: rotate(360deg); }
      }

      /* ── MA 弹出面板通用样式 ── */
      .ma-panel-header {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 12px;
        border-bottom: 1px solid rgba(255, 255, 255, 0.1);
      }
      .ma-panel-title {
        flex: 1;
        font-size: 14px;
        color: #fff;
        font-weight: 600;
      }
      .ma-panel-list {
        overflow-y: auto;
        padding: 10px;
        max-height: 60vh;
      }
      .ma-panel-item {
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 8px;
        border-radius: 8px;
        cursor: pointer;
        transition: background 0.2s;
        border-bottom: 1px solid rgba(255,255,255,0.06);
      }
      .ma-panel-item:hover { background: rgba(255,255,255,0.08); }
      .ma-panel-item-img {
        width: 48px;
        height: 48px;
        border-radius: 8px;
        background-size: cover;
        background-position: center;
        flex-shrink: 0;
      }
      .ma-panel-item-info {
        flex: 1;
        min-width: 0;
      }
      .ma-panel-item-name {
        font-size: 13px;
        color: #fff;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      .ma-panel-item-sub {
        font-size: 11px;
        color: rgba(255,255,255,0.45);
        margin-top: 2px;
      }
      .ma-panel-loading {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 6px;
        padding: 20px;
        color: rgba(255,255,255,0.6);
        font-size: 13px;
      }
      .ma-panel-empty {
        text-align: center;
        padding: 20px;
        color: rgba(255,255,255,0.4);
        font-size: 13px;
      }
      .ma-panel-section-header {
        font-size: 11px;
        color: rgba(255,255,255,0.5);
        padding: 8px 8px 4px;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }
      .ma-panel-track-row {
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 8px;
        border-radius: 8px;
        cursor: pointer;
        transition: background 0.2s;
        border-bottom: 1px solid rgba(255,255,255,0.05);
      }
      .ma-panel-track-row:hover { background: rgba(255,255,255,0.08); }
      .ma-panel-track-num {
        width: 24px;
        text-align: center;
        font-size: 12px;
        color: rgba(255,255,255,0.35);
        flex-shrink: 0;
      }

      .multi-device .left-sidebar {
        display: flex !important;
      }
    `;
  }


  constructor() {
    super();
    this._hass = null;
    this._config = {};
    this.xiaomiHomeEntity = '';
    this.xiaomiMiotEntity = '';
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
    this.theme = 'system';
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
    // 平滑进度相关
    this.smoothCurrentTime = 0;
    this.lastUpdateTime = 0;
    this.lastSyncSecond = -1;
    this.smoothTimer = null;
    // 播放状态跟踪
    this.wasPlaying = false;
    // 歌词调整弹窗状态
    this.adjustmentToast = {
      show: false,
      message: '',
      timer: null
    };
    // 歌词时间调节状态
    this.lyricsTimeAdjustment = 0; // 总调节时间（毫秒）

    this.favoriteSongEntity = '';
    this.stopAlarmEntity = '';
    this.action3Entity = '';
    this.action4Entity = '';
    this.action5Entity = '';
    // 播放历史记录状态
    this._showHistory = false;
    this._historyData = [];
    this._historyLoading = false;
    this._historyFilterPeriod = 24;
    this.sidebarRadioEntity = '';
    this.textDirectiveEntity = '';

    this._textSearchVisible = false;
    this._textSearchQuery = '';
    this._textSearchStatus = '';
    this._textSearchHistory = this._loadSearchHistory();
    this._initLyricsCache();
    // 本地音乐播放器状态
    this._mediaPlayerState = { activeTabIndex: 0, activePlaylistIndex: -1, activeItemIndex: -1 };
    this._backendActive = false;
    this._localMusicPlayerCfg = null;
    // ── 三通道独立 overlay（三大板块互不干扰）──
    this._miotOverlay = { title: '', artist: '', coverUrl: '', source: '', active: false };
    this._localOverlay = { title: '', artist: '', coverUrl: '', source: '', active: false };
    this._maOverlay = { title: '', artist: '', coverUrl: '', source: '', active: false };
    this._activeChannel = '';
    this._miotLastSongTitle = '';
    this._miotLastSongArtist = '';
    this._localLastSongTitle = '';
    this._localLastSongArtist = '';
    this._maLastSongTitle = '';
    this._maLastSongArtist = '';
    // ── MA (Music Assistant) 配置 ──
    this.maServerUrl = '';
    this.maServerToken = '';
    this.maEntryId = '';
    this.maPlayerEntity = '';
    this.maAddonUrl = '';
    this.maPlaylistsConfig = '';
    this.neteaseApiUrl = '';
    this.neteaseUid = '';
    // MA WebSocket
    this._maWs = null;
    this._maWsConnected = false;
    this._maAuthMsgId = null;
    this._maWsHeartbeatInterval = null;
    this._maPlayerId = '';
    this._maQueueId = '';
    this._internalMaPlayerEntity = ''; // 内部 HA MA 加载项生成的播放器实体
    this._maQueueState = '';
    this._maCurrentItem = null;
    this._maCoverUrl = '';
    this._maLyrics = [];
    this._maDuration = 0;
    this._maElapsedTime = 0;
    this._maTrackName = '';
    this._maTrackArtist = '';
    this._lastPlaySource = '';
    // 网易推荐弹窗
    this._neteaseRecommendedVisible = false;
    this._neteaseRecommendedList = [];
    this._neteaseRecommendedLoading = false;
    this._neteaseRecommendedError = '';
    this._neteaseRecommendedPlaying = '';
    this._neteasePlaylistDetail = null;
    this._neteasePlaylistTracks = [];
    this._neteasePlaylistLoading = false;
    // MA 播放列表弹窗
    this._maPlaylistsVisible = false;
    this._maPlaylistsList = [];
    this._maPlaylistsLoading = false;
    this._maPlaylistsError = '';
    this._maPlaylistPlaying = '';
    this._maPlaylistDetail = null;
    this._maPlaylistTracks = [];
    this._maPlaylistTracksLoading = false;
    // NCM 缓存
    this._ncmCoverUrl = '';
    this._ncmSongId = 0;
    this._ncmLyricsOk = false;
    this._overlayLyrics = [];
    this._lastDiagSnapshot = '';
    this._conversationEntity = '';
    this._currentConversationBubbleRef = null;
    // 工具对象
    this._timers = {
      _ids: new Set(),
      setTimeout: (fn, ms) => { const id = window.setTimeout(fn, ms); this._timers._ids.add(id); return id; },
      clearTimeout: (id) => { window.clearTimeout(id); this._timers._ids.delete(id); },
      clearAll: () => { this._timers._ids.forEach(id => window.clearTimeout(id)); this._timers._ids.clear(); },
    };
    this._popups = new Set();
  }

  // ════════════════════════════════════════════
  // 三通道独立 overlay getter/setter（三大板块互不干扰核心）
  // ════════════════════════════════════════════

  /**
   * 返回当前卡片的设备唯一标识（音箱实体 ID）。
   * 多个小爱音箱卡片并存时，所有 localStorage key 必须按设备隔离，
   * 否则书房小爱播放的信息会串到客厅、卧室等卡片。
   */
  _getDeviceId() {
    // 优先使用 MIoT 实体，其次 HA 主实体，再次 MA 播放器实体；均无时回退到 'default'
    return this.xiaomiMiotEntity || this.xiaomiHomeEntity || this.maPlayerEntity || 'default';
  }

  /**
   * 带设备隔离的 "最后通道" localStorage key
   */
  _getLastSourceKey() {
    const did = this._getDeviceId();
    return did && did !== 'default' ? `sun_music_card_last_source_${did.replace(/[^a-zA-Z0-9_.-]/g, '_')}` : 'sun_music_card_last_source';
  }

  /**
   * 带设备隔离的 "正在播放" localStorage key
   * @param {string} channel - 'miot' | 'local' | 'ma'
   */
  _getNpKey(channel) {
    const ch = channel || 'miot';
    const did = this._getDeviceId();
    if (!did || did === 'default') return `sun_xiaoai_np_${ch}`;
    return `sun_xiaoai_np_${ch}_${did.replace(/[^a-zA-Z0-9_.-]/g, '_')}`;
  }

  _getActiveOverlay() {
    if (!this._activeChannel) return null;
    switch (this._activeChannel) {
      case 'miot': return this._miotOverlay;
      case 'local': return this._localOverlay;
      case 'ma': return this._maOverlay;
      default: return null;
    }
  }

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

  // Channel management helpers
  _setChannel(channel) {
    if (this._activeChannel === channel) return;
    this._activeChannel = channel;
    // 统一保存到 localStorage，便于刷新恢复；按设备 ID 隔离，避免多音箱串扰
    try {
      const lsKey = this._getLastSourceKey();
      if (channel === 'miot') localStorage.setItem(lsKey, 'miot');
      else if (channel === 'local') localStorage.setItem(lsKey, 'local');
    } catch(e) {}
  }

  /**
   * MIoT 通道播放前：暂停板块2（LOCAL）和板块3（MA），并清除残留 overlay。
   * 确保三个通道互斥 —— 同一时间只有一个通道在播放。
   */
  _pauseOtherChannelsForMiot() {
    if (!this._hass) return;
    const localTargetEntity = this.xiaomiMiotEntity || this.xiaomiHomeEntity;

    // ── 暂停板块2（LOCAL 通道）──
    const localActive = this._localOverlay && this._localOverlay.source === 'local' && this._localOverlay.active && this._localOverlay.title;
    if (localActive) {
      if (localTargetEntity) {
        this._hass.callService('media_player', 'media_pause', { entity_id: localTargetEntity }).catch(() => {});
      }
    }
    // 无论是否 active，都清除 LOCAL overlay，避免残留数据串到 MIoT
    this._localOverlay = { title: '', artist: '', coverUrl: '', source: '', active: false };

    // ── 暂停板块3（MA 通道）──
    const maActive = this._maOverlay && this._maOverlay.active && this._maOverlay.source &&
      ['netease', 'qqmusic', 'ma_search'].includes(this._maOverlay.source);
    if (maActive) {
      // 通过 MA WS 发送 stop
      if (this._maWsConnected && this._maPlayerId) {
        try { this._maWsSend('player_queues/stop', { queue_id: this._maQueueId || this._maPlayerId }); } catch(e) {}
      }
      // 同时暂停 MA 播放器实体
      if (this.maPlayerEntity) {
        this._hass.callService('media_player', 'media_pause', { entity_id: this.maPlayerEntity }).catch(() => {});
      }
    }
    // 无论是否 active，都清除 MA overlay，避免残留数据串到 MIoT
    this._maOverlay = { title: '', artist: '', coverUrl: '', source: '', active: false };
  }

  /**
   * LOCAL 通道播放前：检测板块1（MIoT）和板块3（MA）是否正在播放，
   * 如果是则先暂停它们，再执行 LOCAL 播放。
   * 确保三个通道互斥 —— 同一时间只有一个通道在播放。
   */
  _pauseOtherChannels() {
    if (!this._hass) return;
    const miotEntity = this.xiaomiMiotEntity || this.xiaomiHomeEntity;
    const maEntity = this.maPlayerEntity || this._internalMaPlayerEntityCfg;

    // ── 暂停板块1（MIoT 通道）──
    // 判断 MIoT 是否正在播放：实体 playing + 标题非占位符
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

    // ── 暂停板块3（MA 通道）──
    // 判断 MA 是否正在播放：MA WS 连接 + 有曲目名 + MA overlay 活跃
    const maActive = this._maOverlay && this._maOverlay.active && this._maOverlay.source &&
      ['netease', 'qqmusic', 'local', 'ma_search'].includes(this._maOverlay.source);
    if (maActive) {
      // 优先通过 MA WS 发送 stop 指令
      if (this._maWsConnected) {
        try { this._maWsSend('stop', {}); } catch(e) {}
      }
      // 同时暂停 MA 播放器实体
      const targetMa = maEntity || this.xiaomiMiotEntity || this.xiaomiHomeEntity;
      if (targetMa) {
        this._hass.callService('media_player', 'media_pause', { entity_id: targetMa }).catch(() => {});
      }
      // 清除 MA overlay 状态，避免后续抢占判断干扰
      // ── 三通道：必须同时清除 active 和 source，否则 _isMaSourceActive() 会误判 MA 仍活跃 ──
      this._maOverlay = { ...this._maOverlay, active: false, source: '' };
    }
  }

  /**
   * MA 通道播放前：检测板块1（MIoT）和板块2（LOCAL）是否正在播放，
   * 如果是则先暂停它们，再执行 MA 播放。
   * 确保三个通道互斥 —— 同一时间只有一个通道在播放。
   */
  _pauseOtherChannelsForMa() {
    if (!this._hass) return;
    const miotEntity = this.xiaomiMiotEntity || this.xiaomiHomeEntity;
    const localTargetEntity = this.xiaomiMiotEntity || this.xiaomiHomeEntity;

    // ── 暂停板块1（MIoT 通道）──
    // 判断 MIoT 是否正在播放：实体 playing + 标题非占位符
    if (miotEntity) {
      const s = this._hass.states[miotEntity];
      if (s && s.state === 'playing') {
        const title = s.attributes?.media_title || '';
        const MIOT_FAKE = new Set(['请欣赏', '请欣赏（音乐）', '暂无播放', '正在加载', 'QQ音乐', '无音乐播放']);
        if (title && !MIOT_FAKE.has(title)) {
          // 检查是否 MA 当前自己正在通过此实体播放 → 不暂停自己
          if (!(this._maOverlay.source && this._maOverlay.active)) {
            this._hass.callService('media_player', 'media_pause', { entity_id: miotEntity }).catch(() => {});
          }
        }
      }
    }

    // ── 暂停板块2（LOCAL 通道）──
    // 判断 LOCAL 是否正在播放：local overlay 活跃 + 有标题
    const localActive = this._localOverlay && this._localOverlay.source === 'local' && this._localOverlay.active && this._localOverlay.title;
    if (localActive) {
      // 通过 MA WS 或 HA 暂停
      if (localTargetEntity) {
        this._hass.callService('media_player', 'media_pause', { entity_id: localTargetEntity }).catch(() => {});
      }
      // 清除 LOCAL overlay 状态
      this._localOverlay = { ...this._localOverlay, active: false };
      this._localOverlay.title = '';
      this._localOverlay.artist = '';
      this._localOverlay.coverUrl = '';
    }
  }

  _getLastSource() {
    // Returns the per-channel last source based on active channel
    const ch = this._activeChannel;
    if (ch === 'miot') return (this._miotOverlay && this._miotOverlay.source) || '';
    if (ch === 'local') return (this._localOverlay && this._localOverlay.source) || '';
    if (ch === 'ma') return (this._maOverlay && this._maOverlay.source) || '';
    return '';
  }

  _getLastSongTitle(channel) {
    if (channel === 'miot') return this._miotLastSongTitle;
    if (channel === 'local') return this._localLastSongTitle;
    if (channel === 'ma') return this._maLastSongTitle;
    return '';
  }
  
  _setLastSongTitle(channel, v) {
    if (channel === 'miot') this._miotLastSongTitle = v;
    else if (channel === 'local') this._localLastSongTitle = v;
    else if (channel === 'ma') this._maLastSongTitle = v;
  }

  _getLastSongArtist(channel) {
    if (channel === 'miot') return this._miotLastSongArtist;
    if (channel === 'local') return this._localLastSongArtist;
    if (channel === 'ma') return this._maLastSongArtist;
    return '';
  }

  _setLastSongArtist(channel, v) {
    if (channel === 'miot') this._miotLastSongArtist = v;
    else if (channel === 'local') this._localLastSongArtist = v;
    else if (channel === 'ma') this._maLastSongArtist = v;
  }

  // hass getter — 媒体播放器代码使用 this.hass
  get hass() { return this._hass; }

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

  _initLyricsCache() {
    try {
      const cached = localStorage.getItem("music_player_lyrics_cache");
      if (cached) {
        const cacheData = JSON.parse(cached);
        const now = Date.now();
        // 需要清除的占位符标题（避免恢复无效歌词缓存）
        const MIOT_FAKE_CACHE = new Set(['请欣赏', '请欣赏（音乐）', '暂无播放', '正在加载', 'QQ音乐', '无音乐播放']);
        Object.keys(cacheData).forEach(key => {
          // 清理过期缓存（1小时）
          if (now - cacheData[key].timestamp > 3600000) {
            delete cacheData[key];
            return;
          }
          // 清理占位符标题的缓存
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

  // ══════════════════════════════════════════════════════
  // 全局占位符过滤（绝不允许"请欣赏..."和"心灵之谜"出现在 UI 中）
  // ══════════════════════════════════════════════════════
  _isPseudoTitle(title) {
    if (!title) return true;
    const PSEUDO = ['请欣赏', '暂无播放', '暂未播放', 'QQ音乐', '正在加载', '加载中', '无音乐播放'];
    return PSEUDO.some(p => title.includes(p));
  }
  _isPseudoArtist(title, artist) {
    if (!artist) return false;
    // "心灵之谜"仅作为已知的占位符艺术家（当title也是占位符时尤其可疑）
    if (artist.includes('心灵之谜')) return true;
    return false;
  }
  _filterTitle(title) {
    return this._isPseudoTitle(title) ? '' : title;
  }
  _filterArtist(title, artist) {
    return this._isPseudoArtist(title, artist) ? '' : artist;
  }

  _injectPlayerStyles() {
    if (document.getElementById('xiaoshi-player-global-styles')) return;
    const s = document.createElement('style');
    s.id = 'xiaoshi-player-global-styles';
    s.textContent = `
      .media-player-popup{display:flex;flex-direction:column;overflow:hidden;}
      .media-player-top-bar{display:flex;align-items:center;justify-content:center;padding:12px 16px;border-bottom:1px solid var(--room-popup-divider,rgba(0,0,0,0.06));flex-shrink:0;}
      .media-player-top-bar-title{font-size:16px;font-weight:600;color:var(--room-primary-text,#2c3e50);}
      .media-player-view-area{flex:1;overflow-y:auto;position:relative;-webkit-overflow-scrolling:touch;transition:opacity 0.15s;}
      .media-player-bottom-bar{display:flex;justify-content:space-around;border-top:1px solid var(--room-popup-divider,rgba(0,0,0,0.06));padding:4px 0;flex-shrink:0;background:var(--room-popup-bg,rgba(255,255,255,0.98));}
      .media-player-bg-wrap{position:absolute;inset:0;z-index:0;}
      .media-player-bg-img{position:absolute;inset:0;object-fit:cover;width:100%;height:100%;filter:blur(40px) brightness(0.5);transition:opacity 0.6s;}
      .media-player-bg-overlay{position:absolute;inset:0;background:rgba(0,0,0,0.3);}
      .media-player-scroll-area{position:relative;z-index:1;display:flex;flex-direction:column;flex:1;overflow-y:auto;padding:16px;-webkit-overflow-scrolling:touch;}
      .media-player-top-section[data-mode="lyrics"]{display:flex;flex-direction:column;margin-bottom:0;}
      .media-player-top-section[data-mode="vertical"]{display:flex;flex-direction:column;align-items:center;margin-bottom:8px;}
      .media-player-header-row{display:flex;align-items:center;gap:14px;flex-shrink:0;}
      .media-player-cover-box{width:260px;height:260px;border-radius:16px;overflow:hidden;flex-shrink:0;margin-bottom:14px;box-shadow:0 8px 30px rgba(0,0,0,0.2);display:flex;align-items:center;justify-content:center;transition:all 0.3s;}
      .media-player-meta{text-align:center;margin-bottom:10px;flex:1;}
      .media-player-meta-title{font-size:17px;font-weight:700;color:var(--room-primary-text,#2c3e50);margin-bottom:4px;}
      .media-player-meta-artist{font-size:12px;color:var(--room-secondary-text,#999);margin-bottom:2px;}
      .media-player-meta-filename{font-size:10px;color:var(--room-secondary-text,#aaa);margin-bottom:2px;}
      .media-player-lyrics-wrap{display:none;height:220px;overflow:hidden;margin-bottom:10px;}
      .media-player-lyrics-scroll{height:100%;overflow-y:auto;padding:8px 0;text-align:center;}
      .media-player-lyrics-line{padding:4px 0;font-size:14px;transition:all 0.3s;}
      .media-player-lyrics-line-active{color:var(--room-icon-color,#3498db);font-weight:600;font-size:15px;}
      .media-player-lyrics-line-inactive{color:var(--room-secondary-text,#999);opacity:0.6;}
      .media-player-progress-div{margin-bottom:4px;}
      .media-player-progress-track{width:100%;height:5px;background:var(--room-slider-track,rgba(0,0,0,0.08));border-radius:3px;cursor:pointer;position:relative;}
      .media-player-progress-fill{height:100%;background:var(--room-icon-color,#3498db);border-radius:3px;transition:width 0.3s;}
      .media-player-time-row{display:flex;justify-content:space-between;margin-top:4px;}
      .media-player-time-label{font-size:11px;color:var(--room-secondary-text,#999);}
      .media-player-ctrl-wrap{margin-top:auto;display:flex;flex-direction:column;gap:6px;}
      .media-player-ctrl-row1{display:flex;justify-content:center;align-items:center;gap:12px;}
      .media-player-ctrl-btn{display:flex;align-items:center;justify-content:center;width:40px;height:40px;border:none;border-radius:50%;background:var(--room-button-bg,rgba(0,0,0,0.05));cursor:pointer;color:var(--room-icon-color,#555);transition:all 0.15s;}
      .media-player-ctrl-btn:active{transform:scale(0.92);}
      .media-player-play-btn{display:flex;align-items:center;justify-content:center;width:52px;height:52px;border:none;border-radius:50%;background:var(--room-icon-color,#3498db);cursor:pointer;color:#fff;transition:all 0.15s;box-shadow:0 4px 16px rgba(52,152,219,0.3);}
      .media-player-play-btn:active{transform:scale(0.92);}
      .media-player-ctrl-row2{display:flex;justify-content:space-between;gap:8px;}
      .media-player-pill-btn{flex:1;display:flex;align-items:center;justify-content:center;gap:6px;padding:8px 12px;border:1px solid var(--room-popup-card-border,rgba(0,0,0,0.1));border-radius:10px;background:var(--room-button-bg,rgba(0,0,0,0.05));cursor:pointer;color:var(--room-primary-text,#2c3e50);font-size:12px;font-weight:500;transition:all 0.15s;}
      .media-player-vol-row{display:flex;align-items:center;gap:8px;margin-bottom:6px;}
      .media-player-vol-icon{flex-shrink:0;cursor:pointer;color:var(--room-icon-color,#555);}
      .media-player-volume-slider{flex:1;height:4px;-webkit-appearance:none;appearance:none;background:var(--room-slider-track,rgba(0,0,0,0.08));border-radius:2px;outline:none;}
      .media-player-vol-label{font-size:12px;color:var(--room-secondary-text,#999);min-width:36px;text-align:right;}
      .media-player-tab-bar{display:flex;gap:0;padding:0;border-bottom:1px solid var(--room-popup-divider,rgba(0,0,0,0.06));overflow-x:auto;flex-shrink:0;scrollbar-width:none;}
      .media-player-playlist-header{background:var(--room-popup-card-bg,transparent);border:1px solid var(--room-popup-card-border,rgba(0,0,0,0.06));border-radius:12px;overflow:hidden;margin-bottom:6px;transition:border-color 0.2s;cursor:pointer;user-select:none;}
      .media-player-playlist-header:hover{border-color:var(--room-icon-color,rgba(52,152,219,0.25));background:var(--room-popup-card-hover-bg,rgba(0,0,0,0.02));}
      .media-player-item{display:flex;align-items:center;gap:8px;padding:8px 12px 8px 28px;cursor:pointer;border-radius:8px;transition:background 0.15s;}
      .media-player-item:hover{background:var(--room-popup-card-hover-bg,rgba(0,0,0,0.03));}

      /* 对话气泡样式 */
      .conversation-bubble{background:var(--room-popup-bg,rgba(255,255,255,0.98));}
      .conversation-bubble-content{display:flex;flex-direction:column;height:100%;}
      .conv-header{padding:12px 16px;border-bottom:1px solid var(--room-popup-divider,rgba(0,0,0,0.06));display:flex;align-items:center;flex-shrink:0;}
      .conv-header-title{font-size:14px;font-weight:600;color:var(--room-primary-text,#2c3e50);display:flex;align-items:center;gap:6px;}
      .conv-loading-top{display:flex;align-items:center;justify-content:center;gap:6px;padding:10px;color:var(--room-secondary-text,#999);font-size:12px;flex-shrink:0;}
      .conv-spin{animation:conv-spin 1s linear infinite;}
      @keyframes conv-spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
      .conv-list{flex:1;overflow-y:auto;padding:12px 16px;-webkit-overflow-scrolling:touch;}
      .conv-time-divider{text-align:center;font-size:11px;color:var(--room-secondary-text,#aaa);padding:8px 0;}
      .conv-msg{display:flex;gap:8px;margin-bottom:14px;}
      .conv-msg-ai{flex-direction:row;padding-right:40px;}
      .conv-msg-user{flex-direction:row-reverse;padding-left:40px;}
      .conv-avatar{flex-shrink:0;width:30px;height:30px;display:flex;align-items:center;justify-content:center;}
      .conv-avatar-icon{--mdc-icon-size:24px;color:var(--room-secondary-text,#999);}
      .conv-avatar-img{width:30px;height:30px;border-radius:50%;object-fit:cover;}
      .conv-bubble{padding:10px 14px;border-radius:16px;font-size:14px;line-height:1.4;word-break:break-word;}
      .conv-bubble-ai{background:var(--room-button-bg,rgba(0,0,0,0.06));color:var(--room-primary-text,#2c3e50);border-top-left-radius:4px;}
      .conv-bubble-user{background:var(--room-icon-color,#3498db);color:#fff;border-top-right-radius:4px;}
      .conv-bubble-wrap{position:relative;}
      .conv-latest-tag{position:absolute;top:-8px;right:0;background:#e74c3c;color:#fff;font-size:9px;padding:1px 6px;border-radius:8px;font-weight:500;}
      .conv-alarm-card{background:rgba(231,76,60,0.08);border:1px solid rgba(231,76,60,0.2);border-radius:12px;padding:10px 14px;margin-top:6px;}
      .conv-alarm-header{display:flex;align-items:center;gap:6px;font-size:12px;color:#e74c3c;font-weight:500;margin-bottom:4px;}
      .conv-alarm-time{font-size:24px;font-weight:300;color:var(--room-primary-text,#2c3e50);text-align:center;}
      .conv-empty{display:flex;flex-direction:column;align-items:center;gap:10px;padding:40px;color:var(--room-secondary-text,#999);font-size:13px;}
      .conv-error{display:flex;justify-content:center;align-items:center;gap:8px;padding:16px;flex-shrink:0;}
      .conv-error-text{color:#e74c3c;font-size:13px;}
      .conv-retry-btn{padding:6px 16px;border:1px solid var(--room-popup-card-border,rgba(0,0,0,0.1));border-radius:8px;cursor:pointer;background:var(--room-button-bg,rgba(0,0,0,0.05));color:var(--room-primary-text,#2c3e50);font-size:12px;}
      .conv-load-fail-tip,.conv-no-more-tip{text-align:center;padding:8px;color:var(--room-secondary-text,#999);font-size:11px;}

      /* 输入框区域 */
      .conv-input-area{display:flex;align-items:center;gap:6px;padding:8px 12px;border-top:1px solid var(--room-popup-divider,rgba(0,0,0,0.08));background:var(--room-popup-bg,rgba(255,255,255,0.98));flex-shrink:0;}
      .conv-input{flex:1;padding:8px 12px;border:1px solid var(--room-input-border,rgba(0,0,0,0.12));border-radius:20px;background:var(--room-input-bg,rgba(0,0,0,0.04));color:var(--room-primary-text,#2c3e50);font-size:14px;outline:none;font-family:inherit;min-width:0;}
      .conv-input:focus{border-color:var(--room-icon-color,#3498db);}
      .conv-send-btn,.conv-play-btn{display:flex;align-items:center;justify-content:center;width:36px;height:36px;border:none;border-radius:50%;cursor:pointer;background:var(--room-icon-color,#3498db);color:#fff;flex-shrink:0;transition:opacity 0.15s;}
      .conv-send-btn:disabled,.conv-play-btn:disabled{opacity:0.4;cursor:default;}
      .conv-send-btn:active:not(:disabled),.conv-play-btn:active:not(:disabled){transform:scale(0.92);}
      .conv-quick-input-btn{display:flex;align-items:center;justify-content:center;width:36px;height:36px;border:none;border-radius:50%;cursor:pointer;background:var(--room-button-bg,rgba(0,0,0,0.08));color:var(--room-icon-color,#f39c12);flex-shrink:0;transition:all 0.15s;}
      .conv-quick-input-btn.active{background:var(--room-icon-color,#f39c12);color:#fff;}

      /* 快捷输入面板 */
      .conv-quick-input-panel{position:absolute;bottom:100%;left:0;right:0;margin-bottom:4px;background:var(--room-popup-bg,rgba(255,255,255,0.99));border-radius:12px;box-shadow:0 -4px 16px rgba(0,0,0,0.12);overflow:hidden;z-index:10;max-height:200px;overflow-y:auto;}
      .conv-quick-input-header{display:flex;align-items:center;justify-content:space-between;padding:8px 14px;border-bottom:1px solid var(--room-popup-divider,rgba(0,0,0,0.06));font-size:12px;font-weight:600;color:var(--room-secondary-text,#999);}
      .conv-quick-input-close{background:none;border:none;cursor:pointer;color:var(--room-secondary-text,#999);padding:2px;display:flex;align-items:center;}
      .conv-quick-input-item{padding:10px 14px;font-size:14px;color:var(--room-primary-text,#2c3e50);cursor:pointer;border-bottom:1px solid var(--room-popup-divider,rgba(0,0,0,0.04));transition:background 0.1s;}
      .conv-quick-input-item:active{background:rgba(52,152,219,0.1);}
      .conv-quick-input-empty{padding:20px;text-align:center;color:var(--room-secondary-text,#999);font-size:13px;}

      .xiaoshi-toast{animation:xiaoshi-toast-in 0.3s ease;}
      @keyframes xiaoshi-toast-in{from{opacity:0;transform:translateX(-50%) translateY(10px);}to{opacity:1;transform:translateX(-50%) translateY(0);}}
    `;
    document.head.appendChild(s);
  }

  _checkSongChange(state) {
    if (!state || !state.attributes) return false;

    // ===== 预检：HA 实体是否正在播放有效内容（板块1 MIoT 接管判断）=====
    const entityPlaying = ['playing', 'Playing', '播放', '播放中', '正在播放'].includes(state.state);
    const entityTitle = state.attributes.media_title || '';
    const entityArtist = state.attributes.media_artist || '';
    const MIOT_FAKE = new Set(['请欣赏', '请欣赏（音乐）', '暂无播放', '正在加载', 'QQ音乐', '无音乐播放']);
    const isEntityFake = !entityTitle || MIOT_FAKE.has(entityTitle);
    const hasRealEntityData = entityPlaying && !isEntityFake && entityTitle;

    // ===== 板块2 (LOCAL) 与 板块3 (MA) 的"被MIoT抢占"判断 =====
    // 当前仅当 HA 实体 state='playing' 且有真实歌曲标题（非占位符）时，
    // MIoT 通道有足够的信号认为用户正在用小爱原生方式播放音乐。
    // 若两个条件同时满足，则 MIoT 成为最高优先级，清除 LOCAL/MA 的 overlay。
    const miotWantsToTakeover = hasRealEntityData;

    // 三通道隔离：只有当前通道确实在活跃播放时才阻止 MIoT 抢占。
    // 如果 overlay 已 inactive 但 channel 残留，说明用户已停止该通道，允许 MIoT 接管。
    if (this._activeChannel === 'local') {
      if (this._localOverlay.active && this._localOverlay.title) {
        return false; // LOCAL 确实在播放
      }
      this._activeChannel = '';
    }
    if (this._activeChannel === 'ma') {
      if (this._maOverlay.active && this._maOverlay.source) {
        return false; // MA 确实在播放
      }
      this._activeChannel = '';
    }

    // ── 板块2：保存并清除 LOCAL overlay（被 MIoT 抢占时）──
    if (this._localOverlay.source === 'local') {
      if (miotWantsToTakeover) {
        // MIoT 正在播放 → 保存 LOCAL 状态，清除 overlay
        // 确保 LOCAL 数据已保存到 localStorage
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
        // 不 return — 继续往下处理 MIoT 数据
      } else {
        // MIoT 未在播放 → 保持 LOCAL overlay 活跃（当前逻辑不变）
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
        return false; // LOCAL 活跃中，不处理 MIoT
      }
    }

    // ── 板块3：保存并清除 MA overlay（被 MIoT 抢占时）──
    if (this._maOverlay.source && ['qqmusic','netease','ma_search'].includes(this._maOverlay.source)) {
      if (miotWantsToTakeover) {
        // MIoT 正在播放 → 保存 MA 状态，清除 overlay
        if (this._maOverlay.title) {
          this._reportNowPlayingData({
            title: this._maOverlay.title,
            artist: this._maOverlay.artist,
            cover_url: this._maOverlay.coverUrl,
            source: this._maOverlay.source,
            status: 'paused',
          }, 'ma');
        }
        // 停掉 MA WS 播放（发送暂停指令）
        if (this._maWsConnected && this._maPlayerId) {
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
        // 不修改 sun_music_card_last_source：自动抢占不应覆盖用户主动选择的来源记录
        // 不 return — 继续往下处理 MIoT 数据
      } else {
        // MIoT 未在播放 → 保持 MA overlay 活跃
        // 但如果 MA WS 已连接且有数据 → 完全由 MA WS 驱动
        if (this._maWsConnected) {
          return false;
        }
        return false;
      }
    }

    // ===== MA WS 连接守卫（仅当 MA 仍在控场时生效）=====
    // 如果上面已经清除了 MA overlay（MIoT 已抢占），
    // 则 MA WS 连接不再阻止 MIoT 数据流。
    if (this._maWsConnected && !miotWantsToTakeover) {
      return false;
    }

    // ===== 页面刷新恢复：当三个通道的 overlay 都为空时，从各自 localStorage 恢复 =====
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

    // ===== 激活 MIoT 通道：处理 HA 实体属性（板块1：小米音乐/小米语音）=====
    this._setChannel('miot');

    // 来自 HA 实体的歌曲信息
    let currentTitle = entityTitle;
    let currentArtist = entityArtist;

    // 如果当前实体没有歌曲信息，尝试从另一个实体获取
    if (!currentTitle || !currentArtist) {
      const otherState = state === this.xiaomiHomeState ? this.xiaomiMiotState : this.xiaomiHomeState;
      if (otherState && otherState.attributes) {
        const otherTitle = otherState.attributes.media_title;
        const otherArtist = otherState.attributes.media_artist;
        if (otherTitle && otherArtist) {
          currentTitle = otherTitle;
          currentArtist = otherArtist;
        }
      }
    }

    // 检查歌曲是否发生变化（MIoT通道独立跟踪）
    if (currentTitle !== this._miotLastSongTitle || currentArtist !== this._miotLastSongArtist) {
      this._miotLastSongTitle = currentTitle;
      this._miotLastSongArtist = currentArtist;

      // 已在上方清除 LOCAL/MA overlay，此处只需写入 MIoT 数据
      const isCurrentFake = !currentTitle || MIOT_FAKE.has(currentTitle);
      if (currentTitle && currentArtist && !isCurrentFake) {
        // 写入 MIoT overlay 以便渲染显示
        this._miotOverlay.title = currentTitle;
        this._miotOverlay.artist = currentArtist;
        this._miotOverlay.coverUrl = state.attributes?.entity_picture || state.attributes?.media_image_url || '';
        this._miotOverlay.source = 'miot';
        this._miotOverlay.active = true;
        // 上报到 MIoT 通道 localStorage
        this._reportNowPlayingData({
          title: currentTitle,
          artist: currentArtist,
          cover_url: state.attributes?.entity_picture || state.attributes?.media_image_url || '',
          source: 'miot',
        }, 'miot');
      } else if (isCurrentFake) {
        // 如果是占位符（如"请欣赏"），清除 MIoT overlay
        // 但保留通道激活状态，让 render 使用实体直接数据
        this._miotOverlay.title = '';
        this._miotOverlay.artist = '';
        this._miotOverlay.active = false;
      }

      // 如果歌词显示开启且有歌曲信息，重新加载歌词
      if (this.showLyrics && currentTitle && currentArtist && !isCurrentFake) {
        this.loadLyricsForCurrentSong();
      }
      
      return true; // 歌曲发生变化
    }
    
    return false; // 歌曲未变化
  }
  
  connectedCallback() {
    super.connectedCallback();
    this._injectPlayerStyles();
    window.addEventListener('mc-dashboard-theme-changed', this._boundThemeChangeHandler);
    this._syncThemeFromMainCard();
  }

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
    // ── 设备组：从 devices 数组加载 ──
    const devices = config.devices;
    if (!devices || !Array.isArray(devices) || devices.length === 0) {
      this._devices = [];
      this._activeDeviceIndex = 0;
      this._config = { ...config, xiaomi_home: '', xiaomi_miot: '' };
      this.xiaomiHomeEntity = '';
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
      xiaomi_home: activeDevice.xiaomi_home,
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
    
    // 确保theme有默认值
    if (this._config.theme === undefined) {
      this._config.theme = 'system';
    }
    
    // 确保width有默认值
    if (this._config.width === undefined) {
      this._config.width = '100%';
    }
    
    // 确保height有默认值
    if (this._config.height === undefined) {
      this._config.height = 'auto';
    }
    
    // 确保lyrics_height有默认值
    if (this._config.lyrics_height === undefined) {
      this._config.lyrics_height = '200px';
    }
    
    
    // 同步主卡片主题
    this._syncThemeFromMainCard();
    
    this.xiaomiHomeEntity = this._config.xiaomi_home;
    this.xiaomiMiotEntity = this._config.xiaomi_miot;
    this.width = this._config.width;
    this.height = this._config.height;
    this.lyricsHeight = this._config.lyrics_height;

    this.favoriteSongEntity = this._config.favorite_current_song || '';
    this.stopAlarmEntity = this._config.stop_alarm || '';
    this.action3Entity = this._config.action3_entity || '';
    this.action4Entity = this._config.action4_entity || '';
    this.action5Entity = this._config.action5_entity || '';
    this.sidebarRadioEntity = this._config.play_radio || '';
    this.textDirectiveEntity = this._config.execute_text_directive || '';
    this.conversationEntity = this._config.conversation || '';
    this.playTextEntity = this._config.play_text || '';
    // quick_input 支持字符串（换行分隔）或数组
    const qi = this._config.quick_input;
    this._quickInput = Array.isArray(qi) ? qi : (typeof qi === 'string' ? qi.split('\n').map(s => s.trim()).filter(Boolean) : []);


    // ── MA (Music Assistant) 配置 ──
    this.maServerUrl = (this._config.ma_server_url || '').replace(/\/+$/, '');
    this.maServerToken = this._config.ma_server_token || '';
    this.maEntryId = this._config.ma_entry_id || '';
    this.maPlayerEntity = this._config.ma_player_entity || '';
    this.maAddonUrl = (this._config.ma_addon_url || '').replace(/\/+$/, '');
    this._internalMaPlayerEntityCfg = (this._config.ma_internal_player_entity || '').trim();
    this.maPlaylistsConfig = this._config.ma_playlists || '';
    this.neteaseApiUrl = (this._config.netease_api_url || '').replace(/\/+$/, '');
    this.neteaseUid = this._config.netease_uid || '';

    // ── 统一使用全功能布局 ──
    this._layoutMode = 'full';

    // MA WebSocket 连接触发
    if (this.maServerUrl && this.maServerToken && !this._maWsConnected) {
      this._connectMaWs();
    }

    // 触发重新渲染以应用主题更改
    this.requestUpdate();
  }

  set hass(hass) {
    this._hass = hass;

    // ── 页面刷新恢复：从 localStorage 恢复 _activeChannel（仅当为空时）──
    // 这是三通道隔离的基石：在后续任何 MA WS / MA 实体 / MIoT 判断之前，
    // 先确定"当前应该是什么通道"，避免 MA 数据覆盖 LOCAL 通道。
    if (!this._activeChannel) {
      try {
        const saved = localStorage.getItem(this._getLastSourceKey());
        if (saved === 'local') this._activeChannel = 'local';
        else if (saved === 'netease' || saved === 'qqmusic' || saved === 'ma_search') this._activeChannel = 'ma';
        else if (saved === 'miot') this._activeChannel = 'miot';
      } catch(e) {}
    }
    // 如果上次是本地音乐，立即恢复 _localOverlay 和 currentItem（避免后续 render 空窗）
    // 同时触发 _applyLocalMusicOverlay 获取歌词/后端最新数据
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

    // ── MA WebSocket 保活 ──
    if (this.maServerUrl && this.maServerToken && !this._maWsConnected) {
      this._connectMaWs();
    }

    let usePrimaryEntity = true;
    let primaryState = null;
    let backupState = null;
    
    // 获取主实体和备用实体状态
    if (hass && this.xiaomiHomeEntity) {
      primaryState = hass.states[this.xiaomiHomeEntity];
    }
    
    if (hass && this.xiaomiMiotEntity) {
      backupState = hass.states[this.xiaomiMiotEntity];
    }
    
    // 判断是否使用备用实体：主实体不存在或状态为unavailable
    if (!primaryState || primaryState.state === 'unavailable') {
      usePrimaryEntity = false;
    }

    // MA 播放器实体状态（用于同步 isPlaying）
    const maPlayerState = (this.maPlayerEntity && hass) ? hass.states[this.maPlayerEntity] : null;

    // ===== MIoT 抢占检测（板块1 优先级）=====
    // 当 HA 实体正在播放且标题非占位符时，判断用户是否在用 MIoT 原生播放。
    // 如果是，即使 MA WS 活跃也必须让 MIoT 通道接管，避免 MA 残留数据覆盖。
    const activeState = usePrimaryEntity ? primaryState : backupState;
    const entityPlaying = activeState && ['playing', 'Playing', '播放', '播放中', '正在播放'].includes(activeState.state);
    const entityCurrentTitle = activeState?.attributes?.media_title || '';
    const MIOT_FAKE_PRE = new Set(['请欣赏', '请欣赏（音乐）', '暂无播放', '正在加载', 'QQ音乐', '无音乐播放']);
    const miotOverriding = entityPlaying && entityCurrentTitle && !MIOT_FAKE_PRE.has(entityCurrentTitle);

    // ===== MA WebSocket 数据优先（参照 xiaoshi-music-card.js 三路分支） =====
    // ⚠️ MIoT 抢占时跳过 MA WS 优先，走 HA 实体回退路径
    const maWsActive = (this._activeChannel === 'ma' || (!this._activeChannel && !miotOverriding && this._maWsConnected && this._maTrackName && this._isMaSourceActive()));
    const maWsConnecting = (this._activeChannel === 'ma' || (!this._activeChannel && !miotOverriding && this._maWsConnected && !this._maTrackName));

    if (maWsActive) {
      // MA WS 已提供完整数据 → 激活 MA 通道
      this._setChannel('ma');
      // MA WS 已提供完整数据，只从 HA 实体获取音量信息
      if (usePrimaryEntity && primaryState) {
        this.xiaomiHomeState = primaryState;
        if (!this.localVolumeUpdate && primaryState.attributes?.volume_level !== undefined) {
          this.volumeState = Math.round((primaryState.attributes.volume_level || 0) * 100);
        }
      } else if (backupState) {
        this.xiaomiMiotState = backupState;
        if (!this.localVolumeUpdate && backupState.attributes?.volume_level !== undefined) {
          this.volumeState = Math.round((backupState.attributes.volume_level || 0) * 100);
        }
      }
      // isPlaying 已在 _handleMaQueueData 中根据 MA queue state 设置
      // 安全回退：当 MA 播放器实体状态是 playing 时，必须同步 isPlaying
      if (maPlayerState && maPlayerState.state !== 'unavailable') {
        const maIsPlaying = ['playing', 'Playing', '播放', '播放中', '正在播放'].includes(maPlayerState.state);
        if (maIsPlaying) this.isPlaying = true;
      }
      // 歌名/歌手/封面/进度/歌词已在 _handleMaQueueData 中设置
      // 不调用 _checkSongChange（HA 实体属性是错误的）
      // 不调用 loadLyricsForCurrentSong（歌词已在 _handleMaQueueData/_fetchMaLyrics 中处理）

    } else if (maWsConnecting) {
      // MA WS 已连接但队列数据尚未到达（页面刷新后重连瞬间）
      // 跳过整个 HA 实体回退路径，避免：
      // 1) _checkSongChange 清除 overlay/_activeOverlaySource；
      // 2) qqmusic/ma_search 来源 _activeOverlaySource='' 时误入 else 块。
      // 仅保持音量和 isPlaying 同步，其余等 _handleMaQueueData 到达后更新。
      if (usePrimaryEntity && primaryState) {
        this.xiaomiHomeState = primaryState;
        if (!this.localVolumeUpdate && primaryState.attributes?.volume_level !== undefined) {
          this.volumeState = Math.round((primaryState.attributes.volume_level || 0) * 100);
        }
      } else if (backupState) {
        this.xiaomiMiotState = backupState;
        if (!this.localVolumeUpdate && backupState.attributes?.volume_level !== undefined) {
          this.volumeState = Math.round((backupState.attributes.volume_level || 0) * 100);
        }
      }
      // 从 MA 播放器实体同步 isPlaying
      if (maPlayerState && maPlayerState.state !== 'unavailable') {
        const maIsPlaying = ['playing', 'Playing', '播放', '播放中', '正在播放'].includes(maPlayerState.state);
        if (maIsPlaying) this.isPlaying = true;
      }
      // 参照 xiaoshi-music-card.js: MA WS 重连期间，根据 localStorage 主动恢复 overlay
      // 避免渲染走 attributes.media_title 显示 MIoT 占位符（如"请欣赏（音乐）"）
      // ── 三通道恢复：独立检查各通道 localStorage ──
      const maSourceEmpty = !this._maOverlay.source;
      const localSourceEmpty = !this._localOverlay.source;
      if (maSourceEmpty && localSourceEmpty) {
        try {
          const saved = localStorage.getItem(this._getLastSourceKey());
          if (saved && ['netease', 'qqmusic', 'local', 'ma_search'].includes(saved)) {
            if (saved === 'local') {
              this._setChannel('local');
              this._localOverlay.source = 'local';
              this._applyLocalMusicOverlay();
            } else if (saved === 'netease') {
              this._setChannel('ma');
              this._maOverlay.source = 'netease';
              this._applyNeteaseOverlay();
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
      // ===== MA WS 未连接或无数据，回退到 HA 实体属性 =====
      // 关键修复：优先从 localStorage 恢复 MA overlay（板块3 保存的真实歌曲信息），
      // 避免 HA MA 实体中的占位符（"请欣赏"）直接覆盖到 UI。
      // 参考 xiaoshi-music-card.js：localStorage 优先于 HA 实体。
      if (this._activeChannel !== 'local' && this._activeChannel !== 'miot' && (!this._maOverlay.title || !this._maOverlay.source)) {
        this._restoreMaOverlayFromLocalStorage();
      }

      // 修复：先检查独立 MA 播放器实体（板块3与 MIoT 实体无关）
      const maPlayerState = (this.maPlayerEntity && hass) ? hass.states[this.maPlayerEntity] : null;
      const maPlayerActive = maPlayerState && ['playing', 'Playing', 'paused', 'Paused', '播放', '播放中', '正在播放', '暂停'].includes(maPlayerState.state);

      if (maPlayerActive && (!this._activeChannel || this._activeChannel === 'ma')) {
        // ── MA 播放器实体独立活跃：只同步播放状态和音量，不取标题 ──
        this._setChannel('ma');
        const a = maPlayerState.attributes || {};
        // 过滤占位符标题（"请欣赏"及其所有变体：全角/半角/空格）
        const MIOT_PSEUDO_TITLES = ['请欣赏（音乐）', '请欣赏', '暂无播放', '暂未播放', 'QQ音乐', '正在加载', '加载中', '无音乐播放'];
        const isPseudoTitle = (a.media_title || '').length > 0 && MIOT_PSEUDO_TITLES.some(p => a.media_title.includes(p));
        if (!isPseudoTitle && a.media_title && !this._maOverlay.title) {
          // 仅当 localStorage 没有恢复出标题时，才用 MA 实体属性补充
          this._maOverlay.title = a.media_title;
          this._maOverlay.artist = this._filterArtist(a.media_title, a.media_artist || a.artist || '');
          this._maOverlay.coverUrl = a.entity_picture || a.media_image_url || this._maOverlay.coverUrl;
          this._maLastSongTitle = a.media_title;
          this._maLastSongArtist = this._filterArtist(a.media_title, a.media_artist || a.artist || '');
        }
        this.isPlaying = ['playing', 'Playing', '播放', '播放中', '正在播放'].includes(maPlayerState.state);
        if (!this.localVolumeUpdate && a.volume_level !== undefined) {
          this.volumeState = Math.round((a.volume_level || 0) * 100);
        }
      } else {
        // ── MA 实体不活跃：尝试从 localStorage 恢复 overlay ──
        // 避免刷新页面后因 MA WS 未连接而显示 MIoT 占位符
        if (this._activeChannel !== 'local' && this._activeChannel !== 'miot' && !this._maOverlay.source && !this._localOverlay.source) {
          try {
            const saved = localStorage.getItem(this._getLastSourceKey());
            if (saved && ['netease', 'qqmusic', 'local', 'ma_search'].includes(saved)) {
              if (saved === 'local') {
                this._setChannel('local');
                this._localOverlay.source = 'local';
                this._applyLocalMusicOverlay();
              } else if (saved === 'netease') {
                this._setChannel('ma');
                this._maOverlay.source = 'netease';
                this._applyNeteaseOverlay();
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
          this.xiaomiHomeState = primaryState;
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

    // 本地音乐兜底：当 MA WS 连接但非活跃（maWsActive=false 且 maWsConnecting=false），
    // 且 _checkSongChange 因 MA WS 守卫直接 return false 时，overlay 可能仍未恢复。
    // 此时若 local 通道来源存在，主动恢复本地音乐 overlay，避免显示 MIoT 占位符。
    // ── 三通道：使用 _localOverlay 独立判断 ──
    if (this._activeChannel !== 'ma' && this._activeChannel !== 'miot' && !this._localOverlay.source && this._localMusicPlayerCfg) {
      // 检查 localStorage 是否有本地音乐记录
      try {
        const saved = localStorage.getItem(this._getLastSourceKey());
        if (saved !== 'local') return;  // 不恢复
      } catch(e) {}
      this._setChannel('local');
      this._localOverlay.source = 'local';
      this._applyLocalMusicOverlay();
    }

    // ========== 音量同步：始终优先从 Home 实体读取 ==========
    if (!this.localVolumeUpdate && !this._isVolumeChanging && !this._isVolumeDragging) {
      // 优先使用 Home 实体的音量（用户反馈 Home 音量控制更可靠）
      if (primaryState && this.xiaomiHomeEntity && primaryState.attributes?.volume_level !== undefined) {
        this.volumeState = Math.round((primaryState.attributes.volume_level || 0) * 100);
      } else if (backupState && this.xiaomiMiotEntity && backupState.attributes?.volume_level !== undefined) {
        this.volumeState = Math.round((backupState.attributes.volume_level || 0) * 100);
      }
    }
    
    // 更新备用实体状态（用于显示目的，但不用于主要控制）
    if (backupState && usePrimaryEntity) {
      this.xiaomiMiotState = backupState;
    }
    
    // 更新主实体状态（用于显示目的，当使用备用实体时）
    if (primaryState && !usePrimaryEntity) {
      this.xiaomiHomeState = primaryState;
    }
    
    // 更新进度信息
    this.requestUpdate();
    
    // 默认总是显示歌词
    if (!this.showLyrics) {
      this.showLyrics = true;
      // 首次自动显示歌词时异步加载（避免阻塞界面）
      if (this.lyrics.length === 0 && !this._lyricsLoading) {
        this.loadLyricsForCurrentSong();
      }
    }
    
    // 更新歌词定时器状态
    if (this.showLyrics) {
      this.startLyricsTimer();
    }
    
    // 注意：localVolumeUpdate 现在由 updateVolume() 中的定时器自动重置
    // 不再无条件重置，以避免静音后音量反弹
    if (this._volumeJustReleased) {
      this._volumeJustReleased = false;
    }
    
    // 检测播放状态变化：从非播放状态变为播放状态
    const playbackStarted = !this.wasPlaying && this.isPlaying;
    this.wasPlaying = this.isPlaying;
    
    // 如果不在播放状态，停止歌词定时器
    if (!this.isPlaying) {
      this.stopLyricsTimer();
    } else if (playbackStarted && this.showLyrics && this.lyrics.length > 0) {
      // 只在开始播放时初始化平滑时间（获取当前实体进度）
      this.initSmoothTimeOnce();
    }
  }

  getCardSize() {
    return 4;
  }

  static getConfigElement() {
    return document.createElement("xiaoshi-music-card-editor");
  }

  static getStubConfig() {
    return {
      devices: [{
        name: '',
        xiaomi_home: '',
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

  // 模拟 Home Assistant 状态更新
  updatePlayerState(state) {
    this.playerState = { ...this.playerState, ...state };
    this.isPlaying = ['播放', '播放中', '正在播放', 'playing', 'Playing'].includes(state.state);
    this.requestUpdate();
  }

  updateVolume(volume) {
    this.volumeState = Math.max(0, Math.min(100, volume));
    this.localVolumeUpdate = true; // 标记为本地更新
    // 2秒后自动清除本地更新标志，防止永久锁定
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
    this.xiaomiHomeEntity = d.xiaomi_home || '';
    this.xiaomiMiotEntity = d.xiaomi_miot || '';
    this.maPlayerEntity = d.ma_player_entity || '';
    this.favoriteSongEntity = d.favorite_current_song || '';
    this.stopAlarmEntity = d.stop_alarm || '';
    this.sidebarRadioEntity = d.play_radio || '';
    this.conversationEntity = d.conversation || '';
    this.playTextEntity = d.play_text || '';
    this.textDirectiveEntity = d.execute_text_directive || '';
    this._config.xiaomi_home = d.xiaomi_home || '';
    this._config.xiaomi_miot = d.xiaomi_miot || '';
    this._config.ma_player_entity = d.ma_player_entity || '';
    this._config.favorite_current_song = d.favorite_current_song || '';
    this._config.stop_alarm = d.stop_alarm || '';
    this._config.play_radio = d.play_radio || '';
    this._config.conversation = d.conversation || '';
    this._config.play_text = d.play_text || '';
    this._config.execute_text_directive = d.execute_text_directive || '';
    // 切换设备时重置状态
    this._activeChannel = '';
    this._miotOverlay = {}; this._localOverlay = {}; this._maOverlay = {};
    this.showLyrics = true; this.lyrics = [];
    this.requestUpdate();
  }
  _getDeviceName(index) {
    const d = this._devices[index];
    if (!d) return '';
    return d.name || (this._hass?.states[d.xiaomi_home]?.attributes?.friendly_name) || (this._hass?.states[d.xiaomi_miot]?.attributes?.friendly_name) || ('设备' + (index + 1));
  }

  // 控制方法 - 调用实际的 Home Assistant 服务
  async callService(service, data = {}) {
    if (this._hass) {
      try {
        await this._hass.callService(service.split('.')[0], service.split('.')[1], data);
      } catch (error) {
      }
    }
  }

  /**
   * 获取音量控制目标实体：优先使用 Home 实体（音量控制更好用），
   * Home 不可用时回退到 MIoT 实体。
   * 主播放控制仍使用 MIoT 实体。
   */
  _getVolumeTargetEntity() {
    return this.xiaomiMiotEntity || this.xiaomiHomeEntity;
  }

  /**
   * 通过 execute_text_directive (notify_entity) 发送文本指令到小爱音箱
   * 适用于 text.xxx_execute_text_directive 实体
   */
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

  _handleClick(){
    // HA 触感反馈事件
    const hapticEvent = new Event('haptic', {
      bubbles: true,
      cancelable: false,
      composed: true
    });
    hapticEvent.detail = 'light';
    this.dispatchEvent(hapticEvent);
    // 浏览器触感反馈（适配平板/手机浏览器）
    if (navigator.vibrate) {
      try { navigator.vibrate(30); } catch(e) {}
    }
  }

  handlePower() {
    this._handleClick();
    const targetEntity = this.xiaomiMiotEntity || this.xiaomiHomeEntity;
    this.callService('media_player.media_pause', {
      entity_id: targetEntity
    });
  }

  handleVolumeDown() {
    this._handleClick();
    const newVolume = Math.max(0, this.volumeState - 1);
    this.updateVolume(newVolume);
    const target = this._getVolumeTargetEntity();
    if (target) {
      this.callService('media_player.volume_set', { entity_id: target, volume_level: newVolume / 100 });
    }
  }

  handleVolumeUp() {
    this._handleClick();
    const newVolume = Math.min(100, this.volumeState + 1);
    this.updateVolume(newVolume);
    const target = this._getVolumeTargetEntity();
    if (target) {
      this.callService('media_player.volume_set', { entity_id: target, volume_level: newVolume / 100 });
    }
  }

  // 歌词进度调整方法
  handleLyricsTimeDecrease() {
    this._handleClick();
    // 减少歌词进度1秒
    this.smoothCurrentTime = Math.max(0, this.smoothCurrentTime - 1000);
    this.lastUpdateTime = Date.now();
    // 更新总调节时间
    this.lyricsTimeAdjustment -= 1000;
    // 立即更新歌词索引
    this.updateCurrentLyricIndex(this.smoothCurrentTime);
    this.requestUpdate();
    // 显示弹窗
    const totalSeconds = this.lyricsTimeAdjustment / 1000;
    const sign = totalSeconds >= 0 ? '+' : '';
    this.showAdjustmentToast(`歌词进度 -1秒 (总计 ${sign}${totalSeconds}秒)`);
  }

  handleLyricsTimeIncrease() {
    this._handleClick();
    // 增加歌词进度1秒
    this.smoothCurrentTime = this.smoothCurrentTime + 1000;
    this.lastUpdateTime = Date.now();
    // 更新总调节时间
    this.lyricsTimeAdjustment += 1000;
    // 立即更新歌词索引
    this.updateCurrentLyricIndex(this.smoothCurrentTime);
    this.requestUpdate();
    // 显示弹窗
    const totalSeconds = this.lyricsTimeAdjustment / 1000;
    const sign = totalSeconds >= 0 ? '+' : '';
    this.showAdjustmentToast(`歌词进度 +1秒 (总计 ${sign}${totalSeconds}秒)`);
  }

  handleLyricsTimeReset() {
    this._handleClick();
    // 重新从实体获取当前进度
    this.initSmoothTimeOnce();
    // 重置总调节时间
    this.lyricsTimeAdjustment = 0;
    // 立即更新歌词索引
    this.updateCurrentLyricIndex(this.smoothCurrentTime);
    this.requestUpdate();
    // 显示弹窗
    this.showAdjustmentToast('已重置歌词进度 (总计 0秒)');
  }

  // 显示歌词调整弹窗
  showAdjustmentToast(message) {
    
    // 清除之前的定时器
    if (this.adjustmentToast.timer) {
      clearTimeout(this.adjustmentToast.timer);
    }
    
    // 更新弹窗消息
    this.adjustmentToast.message = message;
    this.adjustmentToast.show = true;
    this.requestUpdate();
    
    // 设置1秒后自动隐藏
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
      const primaryState = this.xiaomiHomeState || this.xiaomiMiotState;
      if (!primaryState || !primaryState.attributes) {
        const si = this._mediaPlayerState?.currentItem;
        if (si?.title && si?.artist) {
          try { await this.searchAndFetchLyrics(si.title, si.artist); } catch(e) { this._localLyricsFallbackOrNoLyrics(); }
          return;
        }
        this.loadNoLyrics();
        return;
      }

      const savedItem = this._mediaPlayerState?.currentItem;
      let title = this._overlayTitle || savedItem?.title || primaryState.attributes.media_title;
      let artist = this._overlayArtist || savedItem?.artist || primaryState.attributes.media_artist;

      if (!title || !artist) {
        const backupState = primaryState === this.xiaomiHomeState ? this.xiaomiMiotState : this.xiaomiHomeState;
        if (backupState && backupState.attributes) {
          const bTitle = backupState.attributes.media_title;
          const bArtist = backupState.attributes.media_artist;
          if (bTitle && bArtist) { title = bTitle; artist = bArtist; }
        }
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

  /**
   * 本地音乐通道专属备用歌词获取
   * 仅当 _localOverlay.source === 'local' 且歌曲有后端 ID 时生效
   * 不影响 MIoT / MA 通道的歌词逻辑
   */
  async _localLyricsFallbackOrNoLyrics() {
    // ── 仅在本地音乐通道生效 ──
    if (this._localOverlay.source !== 'local') {
      this.loadNoLyrics();
      return;
    }
    // ── 尝试后端歌词 API（卡片内置的 _fetchSongLyrics）──
    const songId = this._mediaPlayerState?.currentItem?.id;
    if (!songId) {
      this.loadNoLyrics();
      return;
    }
    try {
      const lyricsText = await this._fetchSongLyrics(songId);
      if (lyricsText && lyricsText.trim()) {
        this.lyrics = this.parseLyrics(lyricsText);
        if (this.lyrics.length > 0) {
          this.currentLyricIndex = 0;
          this.lyricProgress = 0;
          this.requestUpdate();
          if (this.showLyrics && this.isPlaying) this.startLyricsTimer();
          return;
        }
      }
      this.loadNoLyrics();
    } catch(e) {
      this.loadNoLyrics();
    }
  }

  // 解析歌词文本
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
    
    // 只有在有歌词且当前时间大于第一句歌词时间时才开始计算
    if (this.lyrics.length > 0 && currentTimeMs >= this.lyrics[0].time) {
      for (let i = 0; i < this.lyrics.length; i++) {
        const currentLyric = this.lyrics[i];
        const nextLyric = this.lyrics[i + 1];
        
        if (!nextLyric || currentTimeMs < nextLyric.time) {
          newIndex = i;
          break;
        }
      }
      
      // 只有当当前时间明显超过最后一句歌词时，才设置为最后一句
      if (newIndex === -1) {
        const lastLyric = this.lyrics[this.lyrics.length - 1];
        if (currentTimeMs > lastLyric.time + 5000) { // 超过最后一句5秒
          newIndex = this.lyrics.length - 1;
        }
      }
    }
    
    // 更新歌词进度（无论索引是否变化都要更新）
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
    const progressChanged = Math.abs(this.lyricProgress - newProgress) > 0.005; // 降低进度变化阈值到0.5%，实现更平滑的更新
    
    if (indexChanged) {
      this.currentLyricIndex = newIndex;
      this.lyricProgress = newProgress;
      this.requestUpdate();
      
      // 自动滚动到当前歌词，增加延迟确保DOM更新完成
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
          const response = await fetch(`/api/netease_lyrics/lyrics?title=${encodeURIComponent(title)}&artist=${encodeURIComponent(artist)}`, {
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

  async searchAndFetchLyrics(title, artist) {
    const cleanTitle = this._cleanupSearchText(title);
    const cleanArtist = this._cleanupSearchText(Array.isArray(artist) ? artist[0] || "" : artist);
    const cacheKey = `${cleanTitle}-${cleanArtist}`;

    try {
      // 检查缓存
      const cachedLyrics = await this._checkCache(cacheKey);
      if (cachedLyrics) {
        return this._processLyrics(cachedLyrics);
      }

      // 多种搜索组合
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

  _cleanupSearchText(text) {
    return text.replace(/\\(.*?\\)|\\[.*?\\]|（.*?）/g, "")
                .replace(/[\\s\\-_～〜]+/g, " ")
                .trim();
  }

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

  async _checkCache(cacheKey) {
    if (!this.lyricsCache) {
      this.lyricsCache = new Map();
    }

    // 拒绝占位符标题的缓存（"请欣赏"等），避免恢复时误用无效歌词
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

  _saveCache() {
    try {
      if (this.lyricsCache) {
        const cacheObject = Object.fromEntries(this.lyricsCache);
        localStorage.setItem("music_player_lyrics_cache", JSON.stringify(cacheObject));
      }
    } catch (error) {
    }
  }

  _processLyrics(lyricsText) {
    this.lyrics = this.parseLyrics(lyricsText);
    
    // 歌词处理完成后，如果正在播放且已有时间，更新当前歌词索引
    if (this.isPlaying && this.smoothCurrentTime > 0) {
      this.updateCurrentLyricIndex(this.smoothCurrentTime);
    }
    
    this.requestUpdate();
    
    // 歌词加载完成后，如果有当前歌词，滚动到对应位置
    if (this.showLyrics && this.currentLyricIndex >= 0) {
      setTimeout(() => this.scrollToCurrentLyric(), 200);
    }
  }

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
      // 不在这里初始化时间，只在播放开始和歌曲切换时初始化
      
      // 提高歌词更新频率，实现更平滑的进度条
      this.lyricsTimer = setInterval(() => {
        // 使用平滑时间更新歌词
        this.updateCurrentLyricIndex(this.smoothCurrentTime);
      }, 100); // 提高更新频率到100ms，让进度条更平滑
      
      // 启动平滑定时器，每50ms更新一次平滑时间，提高平滑度
      this.smoothTimer = setInterval(() => {
        this.updateSmoothTimeOnly();
      }, 50);
    }
  }

  // 初始化平滑时间（只在开始时获取一次实体进度）
  initSmoothTimeOnce() {
    // 重置歌词时间调节
    this.lyricsTimeAdjustment = 0;
    
    const primaryState = this.xiaomiHomeState || this.xiaomiMiotState;
    let currentTime = 0;
    
    if (primaryState && primaryState.attributes && primaryState.attributes.media_position !== undefined) {
      // Home Assistant 的 media_position 是秒数，需要转换为毫秒
      currentTime = primaryState.attributes.media_position * 1000;
    } else {
      const backupState = primaryState === this.xiaomiHomeState ? this.xiaomiMiotState : this.xiaomiHomeState;
      if (backupState && backupState.attributes && backupState.attributes.media_position !== undefined) {
        currentTime = backupState.attributes.media_position * 1000;
      }
    }
    
    this.smoothCurrentTime = currentTime;
    this.lastUpdateTime = Date.now();
    // 移除同步标记，不再与实体同步
  }

  // 更新平滑时间（不再与实体同步）
  updateSmoothTimeOnly() {
    if (!this.isPlaying) return;
    
    const now = Date.now();
    const deltaTime = now - this.lastUpdateTime;
    
    // 基于播放状态平滑递增时间
    this.smoothCurrentTime += deltaTime;
    this.lastUpdateTime = now;
    
    // 移除与实体同步的逻辑，完全依赖本地时间计算
  }



  // 停止平滑定时器
  stopSmoothTimer() {
    if (this.smoothTimer) {
      clearInterval(this.smoothTimer);
      this.smoothTimer = null;
    }
  }

  // 启动平滑进度定时器（用于 MA WS 等不依赖歌词定时器的场景）
  // 修复：_handleMaQueueData 调用了此方法但类中未定义，导致 TypeError
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
    
    // 防止频繁滚动，添加滚动冷却时间
    if (this._lastScrollTime && Date.now() - this._lastScrollTime < 500) {
      return;
    }
    
    // 等待DOM更新后再滚动
    setTimeout(() => {
      const lyricsContainer = this.shadowRoot?.querySelector('.lyrics-container');
      const currentLyricElement = this.shadowRoot?.querySelector('.lyric.active');
      
      if (lyricsContainer && currentLyricElement) {
        const containerHeight = lyricsContainer.clientHeight;
        const lyricHeight = currentLyricElement.offsetHeight;
        const lyricOffsetTop = currentLyricElement.offsetTop;
        const containerScrollHeight = lyricsContainer.scrollHeight;
        
        // 计算目标滚动位置：让当前歌词显示在容器中间偏上位置
        let targetScrollTop = lyricOffsetTop - (containerHeight / 2) + (lyricHeight / 2);
        
        // 确保滚动位置在合理范围内
        const maxScrollTop = Math.max(0, containerScrollHeight - containerHeight);
        targetScrollTop = Math.max(0, Math.min(targetScrollTop, maxScrollTop));
        
        // 如果是第一句歌词，滚动到顶部附近
        if (this.currentLyricIndex === 0) {
          targetScrollTop = Math.min(targetScrollTop, 50);
        }
        
        // 记录滚动时间
        this._lastScrollTime = Date.now();
        
        // 使用更温和的滚动方式，减少跳动
        const currentScrollTop = lyricsContainer.scrollTop;
        const scrollDistance = targetScrollTop - currentScrollTop;
        
        // 如果滚动距离很小，直接设置
        if (Math.abs(scrollDistance) < 50) {
          lyricsContainer.scrollTop = targetScrollTop;
        } else {
          // 使用CSS平滑滚动
          lyricsContainer.scrollTo({
            top: targetScrollTop,
            behavior: 'smooth'
          });
        }
      }
    }, 50);
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
      // 震动反馈
    this._handleClick();
      
      const target = this._getVolumeTargetEntity();
      if (target) {
        this.callService('media_player.volume_set', { entity_id: target, volume_level: newVolume / 100 });
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
      
      // 立即调用服务（不等待防抖）
      const newVolume = parseInt(e.target.value);
      
      // 清理防抖定时器
      if (this.volumeDebounceTimer) {
        clearTimeout(this.volumeDebounceTimer);
        this.volumeDebounceTimer = null;
      }
      
      // 震动反馈
      this._handleClick();
      
      const target = this._getVolumeTargetEntity();
      if (target) {
        this.callService('media_player.volume_set', { entity_id: target, volume_level: newVolume / 100 });
      }
    }
  }

  handlePrevious() {
    this._handleClick();
    // 本地音乐模式：使用播放列表导航（参照 popup _prevTrack）
    if (this._localOverlay.source === 'local' && this._localMusicPlayerCfg && this._mediaPlayerState) {
      const cfg = this._localMusicPlayerCfg;
      const ms = this._mediaPlayerState;
      const t = cfg.tabs[ms.activeTabIndex];
      const p = t?.playlists?.[ms.activePlaylistIndex];
      if (!p?.items?.length) return;
      const ni = ms.activeItemIndex > 0 ? ms.activeItemIndex - 1 : p.items.length - 1;
      ms.activeItemIndex = ni;
      const item = p.items[ni];
      // 🛑 LOCAL 通道切歌前：先暂停板块1（MIoT）和板块3（MA）—— 三通道互斥
      this._pauseOtherChannels();
      this._setChannel('local');
      this._overlayTitle = item.title || item.name || '';
      this._overlayArtist = item.artist || '';
      this._overlayCoverUrl = item.cover || (item.id ? this._songCoverUrl(item.id) : '');
      this._activeOverlaySource = 'local';
      this._localOverlay = { ...this._localOverlay, active: true };
      const te = this.xiaomiMiotEntity || this.xiaomiHomeEntity || cfg.mediaEntity;
      const playUrl = item.media_content_id || item.url || '';
      if (playUrl)
        this.callService('media_player.play_media', { entity_id: te, media_content_id: playUrl, media_content_type: item.media_type || 'music' });
      if (this._mediaPlayerState) this._mediaPlayerState.currentItem = { title: item.title || '', artist: item.artist || '', album: item.album || '', duration: item.duration || 0, id: item.id || null, media_content_id: item.media_content_id || '' };
      this.requestUpdate();
      return;
    }
    const targetEntity = this._getActiveTargetEntity();
    this.callService('media_player.media_previous_track', {
      entity_id: targetEntity
    });
  }

  handlePlayPause() {
    this._handleClick();
    // 本地音乐 overlay 激活时：pause 后再 play 需要重新发送 play_media
    // 因为小爱音箱 MIoT 实体 get 后可能忘记之前通过 play_media 设置的 URL
    if (this._localOverlay.source === 'local' && !this.isPlaying) {
      // 🛑 LOCAL 恢复播放前：先暂停板块1（MIoT）和板块3（MA）—— 三通道互斥
      this._pauseOtherChannels();
      this._setChannel('local');
      this._localOverlay = { ...this._localOverlay, source: 'local', active: true };
      const targetEntity = this._getActiveTargetEntity();
      // 优先从 _mediaPlayerState.currentItem 取 URL，其次从 localStorage 恢复
      let url = this._mediaPlayerState?.currentItem?.media_content_id || '';
      let mediaType = this._mediaPlayerState?.currentItem?.media_type || 'music';
      if (!url) {
        try {
          const raw = localStorage.getItem(this._getNpKey('local'));
          if (raw) {
            const data = JSON.parse(raw);
            url = data.media_content_id || '';
            if (!mediaType || mediaType === 'music') mediaType = data.media_type || 'music';
          }
        } catch(e) {}
      }
      if (url) {
        // 直接使用原始 media_content_id，HA 内部处理路由（参照 xiaoshi-music-card）
        const resolvedUrl = url;
        if (resolvedUrl) {
          this.callService('media_player.play_media', {
            entity_id: targetEntity,
            media_content_id: resolvedUrl,
            media_content_type: mediaType
          });
        }
        return;
      }
    }
    const targetEntity = this._getActiveTargetEntity();
    this.callService('media_player.media_play_pause', {
      entity_id: targetEntity
    });
  }

  handlePause() {
    this._handleClick();
    const targetEntity = this._getActiveTargetEntity();
    this.callService('media_player.media_pause', {
      entity_id: targetEntity
    });
  }

  handleNext() {
    this._handleClick();
    // 本地音乐模式：使用播放列表导航（参照 popup _nextTrack）
    if (this._localOverlay.source === 'local' && this._localMusicPlayerCfg && this._mediaPlayerState) {
      const cfg = this._localMusicPlayerCfg;
      const ms = this._mediaPlayerState;
      const t = cfg.tabs[ms.activeTabIndex];
      const p = t?.playlists?.[ms.activePlaylistIndex];
      if (!p?.items?.length) return;
      const ni = ms.activeItemIndex < p.items.length - 1 ? ms.activeItemIndex + 1 : 0;
      ms.activeItemIndex = ni;
      const item = p.items[ni];
      // 🛑 LOCAL 通道切歌前：先暂停板块1（MIoT）和板块3（MA）—— 三通道互斥
      this._pauseOtherChannels();
      this._setChannel('local');
      this._overlayTitle = item.title || item.name || '';
      this._overlayArtist = item.artist || '';
      this._overlayCoverUrl = item.cover || (item.id ? this._songCoverUrl(item.id) : '');
      this._activeOverlaySource = 'local';
      this._localOverlay = { ...this._localOverlay, active: true };
      const te = this.xiaomiMiotEntity || this.xiaomiHomeEntity || cfg.mediaEntity;
      const playUrl = item.media_content_id || item.url || '';
      if (playUrl)
        this.callService('media_player.play_media', { entity_id: te, media_content_id: playUrl, media_content_type: item.media_type || 'music' });
      if (this._mediaPlayerState) this._mediaPlayerState.currentItem = { title: item.title || '', artist: item.artist || '', album: item.album || '', duration: item.duration || 0, id: item.id || null, media_content_id: item.media_content_id || '' };
      this.requestUpdate();
      return;
    }
    const targetEntity = this._getActiveTargetEntity();
    this.callService('media_player.media_next_track', {
      entity_id: targetEntity
    });
  }

  handleShuffle() {
    this._handleClick();
    const targetEntity = (this._localOverlay.source === 'local' && this._localMusicPlayerCfg) ? this._localMusicPlayerCfg.mediaEntity : this._getActiveTargetEntity();
    if (!targetEntity) return;
    if (this.textDirectiveEntity) {
      // 通过 execute_text_directive 发送文本指令
      const state = this._hass?.states[targetEntity];
      const currentShuffle = state?.attributes?.shuffle || false;
      const command = currentShuffle ? '顺序播放' : '随机播放';
      this.callNotify(command);
      return;
    }
    // 回退到标准 media_player 服务
    const state = this._hass?.states[targetEntity];
    if (!state) return;
    try {
      const currentShuffle = state.attributes?.shuffle || false;
      this.callService('media_player.shuffle_set', {
        entity_id: targetEntity,
        shuffle: !currentShuffle
      });
    } catch (e) {
    }
  }

  handleRepeat() {
    this._handleClick();
    const targetEntity = (this._localOverlay.source === 'local' && this._localMusicPlayerCfg) ? this._localMusicPlayerCfg.mediaEntity : this._getActiveTargetEntity();
    if (!targetEntity) return;
    if (this.textDirectiveEntity) {
      // 通过 execute_text_directive 发送文本指令
      const state = this._hass?.states[targetEntity];
      const currentRepeat = state?.attributes?.repeat || 'off';
      let command = '循环播放';
      if (currentRepeat === 'off') { command = '循环播放'; }
      else if (currentRepeat === 'all') { command = '单曲循环'; }
      else { command = '顺序播放'; }
      this.callNotify(command);
      return;
    }
    // 回退到标准 media_player 服务
    const state = this._hass?.states[targetEntity];
    if (!state) return;
    try {
      const currentRepeat = state.attributes?.repeat || 'off';
      let newRepeat = 'all';
      if (currentRepeat === 'off') { newRepeat = 'all'; }
      else if (currentRepeat === 'all') { newRepeat = 'one'; }
      else { newRepeat = 'off'; }
      this.callService('media_player.repeat_set', {
        entity_id: targetEntity,
        repeat: newRepeat
      });
    } catch (e) {
    }
  }

  // ========== 侧边栏按钮处理方法 ==========

  handleFavoriteCurrentSong() {
    this._handleClick();
    if (!this.favoriteSongEntity) return;
    this.callService('button.press', { entity_id: this.favoriteSongEntity });
  }

  handleStopAlarm() {
    this._handleClick();
    if (!this.stopAlarmEntity) return;
    this.callService('button.press', { entity_id: this.stopAlarmEntity });
  }

  // ========== 播放历史记录功能 ==========

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

  async _fetchHistory(deviceIndex) {
    this._historyLoading = true;
    this._updateHistoryContent();
    try {
      const di = deviceIndex ?? this._historyDeviceIndex ?? this._activeDeviceIndex;
      const dev = this._devices?.[di];
      const dMiot = (dev?.xiaomi_miot || '').trim();
      const dHome = (dev?.xiaomi_home || '').trim();
      const targetEntity = dMiot || dHome || this.xiaomiMiotEntity || this.xiaomiHomeEntity;
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

  _showHistoryOverlay() {
    if (this._historyOverlayEl) return;
    const theme = this._evaluateTheme();
    const isDark = theme === 'dark' || theme === 'system';
    const targetEntity = this.xiaomiMiotEntity || this.xiaomiHomeEntity;
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

    // 标题栏
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

    // 多设备切换 chips
    if (this._devices && this._devices.length > 1) {
      const deviceChips = document.createElement('div');
      deviceChips.style.cssText = 'display:flex;gap:4px;flex-wrap:wrap;';
      for (let di = 0; di < this._devices.length; di++) {
        const d = this._devices[di];
        const dName = d.name || (this._hass?.states?.[d.xiaomi_home]?.attributes?.friendly_name) || ('设备'+(di+1));
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
          // 更新所有设备chip样式
          deviceChips.querySelectorAll('[data-device-chip]').forEach(c => {
            const idx = parseInt(c.getAttribute('data-device-chip'));
            const active = idx === di;
            c.style.background = active ? chipActiveBg : chipBg;
            c.style.color = active ? chipActiveColor : (isDark?'#ccc':'#555');
          });
          const dev2 = this._devices?.[di];
          const devName2 = dev2?.name || (this._hass?.states?.[dev2?.xiaomi_home]?.attributes?.friendly_name) || ('设备'+(di+1));
          title.textContent = `${devName2} - 播放历史`;
          this._historyLoading = true;
          this._historyData = [];
          this._fetchHistory(di);
        });
        deviceChips.appendChild(dChip);
      }
      header.appendChild(deviceChips);
    }

    // 时段选择工具栏
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

    // 内容区域
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
      const { entityId, name, entries } = entityData;

      // 计算各状态时长
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

  _closeHistoryOverlay() {
    this._handleClick();
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
    const targetEntity = this.xiaomiMiotEntity || this.xiaomiHomeEntity;
    const entity = this._hass?.states?.[targetEntity];
    const state = entity?.state || 'idle';
    return this._getMusicStateColor(state);
  }

  _getMusicStateColor(state) {
    const s = (state || '').trim();
    if (s === 'playing') return 'rgb(76,175,80)';
    if (s === 'paused') return 'rgb(255,193,7)';
    if (s === 'idle') return '#999';
    if (s === 'off') return '#999';
    if (s === 'unavailable' || s === 'unknown') return '#f44336';
    return 'rgb(33,150,243)';
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

  handleAction4() {
    this._handleClick();
    if (!this.action4Entity) return;
    this.callService('button.press', { entity_id: this.action4Entity });
  }

  handleAction5() {
    this._handleClick();
    if (!this.action5Entity) return;
    this.callService('button.press', { entity_id: this.action5Entity });
  }

  handleSidebarRadioPress() {
    this._handleClick();
    if (!this.sidebarRadioEntity) {
      this._showToast('请先配置小米电台实体 play_radio', 'warning');
      return;
    }
    // 手动切换到 MIoT 通道：先暂停其他通道，清除残留 overlay
    this._pauseOtherChannelsForMiot();
    this._setChannel('miot');
    this._miotOverlay = { title: '', artist: '', coverUrl: '', source: 'miot', active: true };
    this.callService('button.press', { entity_id: this.sidebarRadioEntity });
  }


  handleTextSearchPress() {
    this._handleClick();
    if (!this.textDirectiveEntity) {
      return;
    }
    this._textSearchVisible = !this._textSearchVisible;
    if (!this._textSearchVisible) {
      this._textSearchQuery = '';
      this._textSearchStatus = '';
    }
    this.requestUpdate();
  }

  handleTextSearchInput(e) {
    this._textSearchQuery = e.target.value;
  }

  handleTextSearchKeydown(e) {
    if (e.key === 'Enter') {
      e.preventDefault();
      this.handleTextSearchPerform('play');
    }
  }

  async handleTextSearchPerform(action) {
    const query = (this._textSearchQuery || '').trim();
    if (!query || !this.textDirectiveEntity || !this._hass) return;

    let command = query;
    if (action === 'collect') {
      command = '收藏' + query;
    }

    this._textSearchStatus = 'sending';
    this.requestUpdate();

    try {
      await this._hass.callService('text', 'set_value', {
        entity_id: this.textDirectiveEntity,
        value: command
      });
      this._textSearchStatus = 'success';
      if (!this._textSearchHistory.includes(query)) {
        // 用赋值触发 Lit 响应式更新（unshift 不会触发 setter）
        this._textSearchHistory = [query, ...this._textSearchHistory].slice(0, 10);
        this._saveSearchHistory();
      }
      setTimeout(() => {
        this._textSearchStatus = '';
        this.requestUpdate();
      }, 3000);
    } catch (error) {
      this._textSearchStatus = 'error';
      this.requestUpdate();
    }
  }

  handleTextSearchHistoryClick(query) {
    this._textSearchQuery = query;
    this.handleTextSearchPerform('play');
  }

  handleTextSearchClearHistory() {
    this._textSearchHistory = [];
    this._saveSearchHistory();
    this.requestUpdate();
  }

  _loadSearchHistory() {
    try {
      const raw = localStorage.getItem('xiaoshi-music-card-search-history');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) return parsed.slice(0, 10);
      }
    } catch (e) {
      // 解析失败则忽略
    }
    return [];
  }

  _saveSearchHistory() {
    try {
      localStorage.setItem('xiaoshi-music-card-search-history', JSON.stringify(this._textSearchHistory));
    } catch (e) {
      // 存储失败则忽略
    }
  }

  _renderTextSearchPanel() {
    if (!this._textSearchVisible) return html``;
    const status = this._textSearchStatus;
    const history = this._textSearchHistory || [];

    return html`
      <div class="ma-search-overlay" @click=${(e) => { if (e.target.classList.contains('ma-search-overlay')) this.handleTextSearchPress(); }}>
        <div class="pl-panel">
          <div class="ma-search-header">
            <ha-icon icon="mdi:magnify" class="ma-search-icon"></ha-icon>
            <span style="flex:1;font-size:14px;color:#fff;">小米搜索</span>
            <button class="ma-close-btn" @click=${this.handleTextSearchPress} title="关闭">
              <ha-icon icon="mdi:close"></ha-icon>
            </button>
          </div>

          <div style="padding:16px;">
            <div style="font-size:11px;color:rgba(255,255,255,0.5);margin-bottom:10px;line-height:1.5;">
              输入歌曲名、歌手名或专辑名，将通过 <code style="color:#3498db;background:rgba(52,152,219,0.1);padding:1px 4px;border-radius:3px;">${this.textDirectiveEntity}</code> 发送播放指令到音箱。
            </div>

            <div style="display:flex;gap:8px;margin-bottom:10px;">
              <input
                type="text"
                class="ma-search-input"
                style="flex:1;background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.15);padding:10px;border-radius:8px;"
                placeholder="输入歌曲名或歌手名..."
                .value=${this._textSearchQuery || ''}
                @input=${this.handleTextSearchInput}
                @keydown=${this.handleTextSearchKeydown}
              />
            </div>

            <div style="display:flex;gap:8px;margin-bottom:14px;">
              <button
                class="ma-search-btn"
                style="flex:1;background:${status === 'sending' ? 'rgba(150,150,150,0.6)' : 'rgba(25,165,225,0.6)'};"
                @click=${() => this.handleTextSearchPerform('play')}
                ?disabled=${status === 'sending'}
              >
                ${status === 'sending' ? html`<ha-icon icon="mdi:loading" class="ma-spin"></ha-icon> 发送中` : html`<ha-icon icon="mdi:play"></ha-icon> 播放`}
              </button>
              <button
                class="ma-search-btn"
                style="flex:1;background:rgba(46,204,113,0.5);"
                @click=${() => this.handleTextSearchPerform('collect')}
                ?disabled=${status === 'sending'}
              >
                <ha-icon icon="mdi:heart"></ha-icon> 收藏
              </button>
            </div>

            ${status === 'success' ? html`
              <div style="text-align:center;padding:10px;color:#2ecc71;font-size:13px;background:rgba(46,204,113,0.1);border-radius:8px;margin-bottom:14px;">
                ✅ 指令已发送，音箱正在处理...
              </div>
            ` : status === 'error' ? html`
              <div style="text-align:center;padding:10px;color:#e74c3c;font-size:13px;background:rgba(231,76,60,0.1);border-radius:8px;margin-bottom:14px;">
                ❌ 指令发送失败，请检查实体配置
              </div>
            ` : ''}

            ${history.length > 0 ? html`
              <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;">
                <span style="font-size:11px;color:rgba(255,255,255,0.5);">搜索历史</span>
                <button
                  style="background:transparent;border:none;color:rgba(255,255,255,0.4);cursor:pointer;font-size:11px;padding:2px;"
                  @click=${this.handleTextSearchClearHistory}
                  title="清空历史"
                >
                  清空
                </button>
              </div>
              <div style="display:flex;flex-wrap:wrap;gap:6px;">
                ${history.map(q => html`
                  <button
                    style="background:rgba(255,255,255,0.08);border:1px solid rgba(255,255,255,0.1);color:#fff;padding:5px 12px;border-radius:14px;cursor:pointer;font-size:12px;transition:all 0.15s;"
                    @click=${() => this.handleTextSearchHistoryClick(q)}
                  >
                    ${q}
                  </button>
                `)}
              </div>
            ` : ''}
          </div>
        </div>
      </div>
    `;
  }



  getProgressPercentage() {
    // MA WS 活跃时用 MA 进度
    if (this._maWsConnected && this._maTrackName && this._isMaSourceActive() && this._maDuration > 0) {
      const pos = this._maElapsedTime || (this.smoothCurrentTime / 1000);
      return Math.min(100, Math.max(0, (pos / this._maDuration) * 100));
    }
    // 使用与set hass相同的智能实体选择逻辑
    let primaryState = null;
    let usePrimaryEntity = true;
    
    // 获取主实体状态
    if (this.xiaomiHomeEntity && this._hass) {
      primaryState = this._hass.states[this.xiaomiHomeEntity];
    }
    
    // 判断是否使用备用实体：主实体不存在或状态为unavailable
    if (!primaryState || primaryState.state === 'unavailable') {
      usePrimaryEntity = false;
    }
    
    // 选择要显示的实体状态
    let displayState = null;
    if (usePrimaryEntity && primaryState) {
      displayState = primaryState;
    } else if (this.xiaomiMiotEntity && this._hass) {
      displayState = this._hass.states[this.xiaomiMiotEntity];
    }
    
    // 如果都没有，使用本地状态
    if (!displayState) {
      displayState = this.xiaomiHomeState || this.xiaomiMiotState;
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
    // 使用与set hass相同的智能实体选择逻辑
    let primaryState = null;
    let usePrimaryEntity = true;
    
    // 获取主实体状态
    if (this.xiaomiHomeEntity && this._hass) {
      primaryState = this._hass.states[this.xiaomiHomeEntity];
    }
    
    // 判断是否使用备用实体：主实体不存在或状态为unavailable
    if (!primaryState || primaryState.state === 'unavailable') {
      usePrimaryEntity = false;
    }
    
    // 选择要显示的实体状态
    let displayState = null;
    if (usePrimaryEntity && primaryState) {
      displayState = primaryState;
    } else if (this.xiaomiMiotEntity && this._hass) {
      displayState = this._hass.states[this.xiaomiMiotEntity];
    }
    
    // 如果都没有，使用本地状态
    if (!displayState) {
      displayState = this.xiaomiHomeState || this.xiaomiMiotState;
    }
    
    const state = displayState?.state || 'idle';
    // MA WS 活跃时优先使用 MA 状态
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

  render() {
    const progressPercentage = this.getProgressPercentage();
    const themeColors = this._getThemeButtonColors();
    
    // 智能选择背景图片的实体状态
    let primaryState = null;
    let backupState = null;
    let displayState = null;
    
    // 获取主实体和备用实体状态
    if (this.xiaomiHomeEntity && this._hass) {
      primaryState = this._hass.states[this.xiaomiHomeEntity];
    }
    if (this.xiaomiMiotEntity && this._hass) {
      backupState = this._hass.states[this.xiaomiMiotEntity];
    }
    
    // 智能选择逻辑：优先选择有图片的实体
    if (primaryState && backupState) {
      const primaryPicture = primaryState.attributes?.entity_picture;
      const backupPicture = backupState.attributes?.entity_picture;
      
      if (primaryPicture && !backupPicture) {
        displayState = primaryState;
      } else if (!primaryPicture && backupPicture) {
        displayState = backupState;
      } else if (primaryPicture && backupPicture) {
        displayState = primaryState;
      } else {
        displayState = primaryState.state === 'unavailable' ? backupState : primaryState;
      }
    } else if (primaryState) {
      displayState = primaryState;
    } else if (backupState) {
      displayState = backupState;
    }
    
    // 如果都没有，使用本地状态
    if (!displayState) {
      displayState = this.xiaomiHomeState || this.xiaomiMiotState;
    }
    
    const attributes = displayState?.attributes || {};
    // 本地音乐播放时，媒体信息可能在另一个实体上（xiaomiMiot），做回退确保显示
    const otherState = displayState === primaryState ? backupState : primaryState;
    const altAttr = otherState?.attributes || {};
    // 本地音乐播放时，HA 实体可能不返回标题/歌手，使用 _mediaPlayerState.currentItem 兜底
    const currentItem = this._mediaPlayerState?.currentItem || null;
    
    // 修复：检测 HA 实体 / MIoT 实体的 media_title 是否为占位符，用全局方法过滤
    const realEntityTitle = this._filterTitle(attributes.media_title || '');
    const realAltTitle = this._filterTitle(altAttr.media_title || '');
    const realEntityArtist = this._filterArtist(attributes.media_title, attributes.media_artist || '');
    const realAltArtist = this._filterArtist(altAttr.media_title, altAttr.media_artist || '');
    
    // ── 三通道独立 overlay 数据选择（三大板块互不干扰核心）──
    // 关键：使用对最新对象属性的解构读取（避免 getter 闭包到旧引用）
    const miotOv = { ...(this._miotOverlay || {}) };
    const localOv = { ...(this._localOverlay || {}) };
    const maOv = { ...(this._maOverlay || {}) };
    const miotActive = !!(miotOv.source && miotOv.active && miotOv.title);
    const localActive = !!(localOv.source === 'local' && localOv.active && localOv.title);
    const maActive = !!(maOv.source && maOv.active && (maOv.title || this._maTrackName));
    const overlayActive = miotActive || localActive || maActive;
    
    // 页面刷新后恢复：三通道各自从各自 localStorage 恢复
    if (!overlayActive && !this._activeChannel && displayState?.state === 'playing') {
      // 尝试 MA 通道恢复
      const maRestored = this._restoreNowPlayingFromLocalStorage('ma');
      if (maRestored) {
        this._setChannel('ma');
        maOv.title = maRestored.title || '';
        maOv.artist = maRestored.artist || '';
        maOv.coverUrl = maRestored.cover_url || '';
        maOv.source = maRestored.source || 'ma';
        maOv.active = true;
        this._maOverlay = {...maOv};
      }
      // 尝试 LOCAL 通道恢复
      if (!maOv.active) {
        const localRestored = this._restoreNowPlayingFromLocalStorage('local');
        if (localRestored) {
          this._setChannel('local');
          localOv.title = localRestored.title || '';
          localOv.artist = localRestored.artist || '';
          localOv.coverUrl = localRestored.cover_url || '';
          localOv.source = 'local';
          localOv.active = true;
          this._localOverlay = {...localOv};
          // 恢复 currentItem
          if (!this._mediaPlayerState) this._mediaPlayerState = {};
          if (!this._mediaPlayerState.currentItem && (localRestored.media_content_id || localRestored.title)) {
            this._mediaPlayerState.currentItem = {
              title: localRestored.title || '',
              artist: localRestored.artist || '',
              media_content_id: localRestored.media_content_id || '',
              media_type: localRestored.media_type || 'music',
            };
          }
        }
      }
      // 尝试 MIoT 通道恢复
      if (!maOv.active && !localOv.active) {
        const miotRestored = this._restoreNowPlayingFromLocalStorage('miot');
        if (miotRestored) {
          this._setChannel('miot');
          miotOv.title = miotRestored.title || '';
          miotOv.artist = miotRestored.artist || '';
          miotOv.coverUrl = miotRestored.cover_url || '';
          miotOv.source = 'miot';
          miotOv.active = true;
          this._miotOverlay = {...miotOv};
        }
      }
      // 重新计算
      requestAnimationFrame(() => this.requestUpdate());
    }
    
    // ════════════════════════════════════════════
    // 三通道严格隔离：UI 只显示当前 _activeChannel 对应的数据
    // ════════════════════════════════════════════
    const isMiotSource = this._activeChannel === 'miot';
    const isLocalSource = this._activeChannel === 'local';
    const isMaSource = this._activeChannel === 'ma';

    let activeTitle, activeArtist, activeCoverUrl;

    if (isMiotSource) {
      // 板块1：MIoT 通道优先使用自己的 overlay，其次回退到 HA 实体属性
      activeTitle = miotOv.title || realEntityTitle || realAltTitle || '';
      activeArtist = miotOv.artist || attributes.media_artist || altAttr.media_artist || '';
      activeCoverUrl = miotOv.coverUrl || attributes.entity_picture || altAttr.entity_picture || '';
    } else if (isLocalSource) {
      // 板块2：LOCAL 通道只使用本地 overlay / currentItem，不回退到 MIoT/MA
      activeTitle = localOv.title || currentItem?.title || currentItem?.name || '';
      activeArtist = localOv.artist || currentItem?.artist || '';
      activeCoverUrl = localOv.coverUrl || currentItem?.cover || '';
    } else if (isMaSource) {
      // 板块3：MA 通道只使用 MA overlay / MA WS 数据
      activeTitle = maOv.title || this._maTrackName || '';
      activeArtist = maOv.artist || this._maTrackArtist || '';
      activeCoverUrl = maOv.coverUrl || this._maCoverUrl || '';
    } else {
      // 无明确通道：全部留空
      activeTitle = '';
      activeArtist = '';
      activeCoverUrl = '';
    }
    if (!activeTitle) activeTitle = '未播放';

    // ── 最终过滤：绝不显示 HA 实体的占位符标题/艺术家 ──
    // 包括"请欣赏"系列、"心灵之谜"等。过滤后如果为假，显示空。
    const MIOT_PSEUDO_TITLES = ['请欣赏（音乐）', '请欣赏', '暂无播放', '暂未播放', 'QQ音乐', '正在加载', '加载中', '无音乐播放'];
    const _isPseudo = (s) => s && MIOT_PSEUDO_TITLES.some(p => s.includes(p));
    const _isPseudoArtist = (s) => s && (s === '心灵之谜' || s === '未知歌手' || _isPseudo(s));
    if (_isPseudo(activeTitle)) { activeTitle = ''; activeArtist = ''; activeCoverUrl = ''; }
    else if (_isPseudoArtist(activeArtist)) { activeArtist = ''; }

    const entityPicture = activeCoverUrl;
    // MA WS 活跃时用 MA 封面（仅在 MA 通道）
    const maWsActive = isMaSource && this._maWsConnected && this._maTrackName && this._isMaSourceActive();
    // 封面选择：按当前通道隔离
    const finalCover = isMiotSource ? (activeCoverUrl || displayState?.attributes?.entity_picture) :
                        isLocalSource ? activeCoverUrl :
                        isMaSource ? (activeCoverUrl || (maWsActive ? this._maCoverUrl : '')) :
                        activeCoverUrl;
    const friendlyName = attributes.friendly_name || '小爱音箱';
    const stateText = this.getStateText();

    // 计算进度时间
    let duration = 0;
    let position = 0;
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

    // 背景样式：有房间图用图，否则根据主题模式切换深浅色
    const currentTheme = this._evaluateTheme();
    const themeBgMap = {
      light: 'rgb(255, 255, 255)',
      dark: 'rgb(50, 50, 50)'
    };
    // 注入主题 CSS 变量，供所有子元素使用
    const themeCssVars = currentTheme === 'light'
      ? `--xiaoshi-text:rgb(0,0,0);--xiaoshi-muted:rgba(0,0,0,.55);--xiaoshi-overlay-off:rgba(255,255,255,.75);--xiaoshi-overlay-on:rgba(255,255,255,.50);--xiaoshi-btn-bg:rgba(0,0,0,.10);--xiaoshi-btn-active:rgba(0,0,0,.18);--xiaoshi-btn-hover:rgba(0,0,0,.14);--xiaoshi-text-shadow:none;`
      : `--xiaoshi-text:#fff;--xiaoshi-muted:rgba(255,255,255,.6);--xiaoshi-overlay-off:rgba(15,12,8,.60);--xiaoshi-overlay-on:rgba(15,12,8,.35);--xiaoshi-btn-bg:rgba(255,255,255,.10);--xiaoshi-btn-active:rgba(255,255,255,.25);--xiaoshi-btn-hover:rgba(255,255,255,.22);--xiaoshi-text-shadow:0 1px 4px rgba(0,0,0,0.5);`;
    const bgStyle = `background:${themeBgMap[currentTheme] || themeBgMap.dark};${themeCssVars}`;

    // overlay 类名
    const overlayClass = this.isPlaying ? 'card-bg-overlay on-overlay' : 'card-bg-overlay off-overlay';

    // 专辑背景图层样式
    const albumBgStyle = finalCover
      ? `background-image: url('${finalCover}'); filter: blur(40px) brightness(0.4) saturate(1.5);`
      : '';

    return html`
      <div class="card full-layout${(this._devices && this._devices.length > 1) ? ' multi-device' : ''}" style="${bgStyle}; width: ${this.width}; min-width: ${this.width}; max-width: ${this.width};">
        <div class="${overlayClass}"></div>
        ${finalCover ? html`<div class="album-bg-layer" style="${albumBgStyle}"></div>` : ''}

        <div class="player-content" style="height: ${this.height}; min-height: ${this.height}; max-height: ${this.height};">
          <!-- 左侧导航栏 -->
          <div class="left-sidebar">
            <!-- 设备列表 -->
            ${(this._devices && this._devices.length > 0) ? html`
            <div class="device-list">
              ${this._devices.map((d, i) => {
                const devState = this._hass?.states[d.xiaomi_home] || this._hass?.states[d.xiaomi_miot];
                const devName = d.name || (devState?.attributes?.friendly_name) || ('设备' + (i + 1));
                const rawState = (devState?.state || '').trim();
                const devText = rawState === 'playing' ? '播放' : rawState === 'paused' ? '暂停' : rawState === 'idle' ? '待机' : rawState === 'off' ? '关闭' : '离线';
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
            ` : ''}
            <!-- 侧边栏按钮 -->
            <!-- 网易推荐 — MA 弹窗模式 -->
            <button class="sidebar-btn" style="background: ${themeColors.bg}; ${this.neteaseApiUrl ? '' : 'opacity: 0.4;'}" @click=${() => { if (!this.neteaseApiUrl) { this._showToast('请先配置网易云API地址 netease_api_url', 'warning'); return; } this.handleNeteaseRecommendedToggle(); }} title="${this.neteaseApiUrl ? '网易云推荐歌单' : '未配置 netease_api_url'}">
              <ha-icon icon="mdi:playlist-music"></ha-icon>
              <span class="sidebar-btn-label">网易推荐</span>
            </button>
            <!-- QQ音乐 — MA 播放列表弹窗 -->
            <button class="sidebar-btn" style="background: ${themeColors.bg}; ${this.maPlaylistsConfig ? '' : 'opacity: 0.4;'}" @click=${() => { if (!this.maPlaylistsConfig) { this._showToast('请先配置MA歌单 ma_playlists', 'warning'); return; } this.handleMaPlaylistsToggle(); }} title="${this.maPlaylistsConfig ? 'MA 播放列表' : '未配置 ma_playlists'}">
              <ha-icon icon="mdi:playlist-star"></ha-icon>
              <span class="sidebar-btn-label">QQ音乐</span>
            </button>
            <button class="sidebar-btn" style="background: ${themeColors.bg}; ${this._config?.local_music_path ? '' : 'opacity: 0.4;'}" @click=${() => { this._handleClick(); if (!this._config?.local_music_path) { this._showToast('请先配置本地音乐路径 local_music_path', 'warning'); return; } this.showLocalMusicPopup(null, this.shadowRoot?.querySelector('.sidebar-btn[title*="本地音乐"]')); }} title="${this._config?.local_music_path ? '本地音乐 — 播放列表与后台播放控制' : '未配置 local_music_path'}">
              <ha-icon icon="mdi:speaker-multiple"></ha-icon>
              <span class="sidebar-btn-label">本地音乐</span>
            </button>
            <button class="sidebar-btn" style="background: ${themeColors.bg}; ${this.sidebarRadioEntity ? '' : 'opacity: 0.4;'}" @click=${this.handleSidebarRadioPress} title="${this.sidebarRadioEntity ? (this._hass?.states[this.sidebarRadioEntity]?.attributes.friendly_name || '小米电台') : '未配置 play_radio'}">
              <ha-icon icon="mdi:radio"></ha-icon>
              <span class="sidebar-btn-label">小米电台</span>
            </button>
            <button class="sidebar-btn" style="background: ${themeColors.bg}; ${this.conversationEntity ? '' : 'opacity: 0.4;'}" @click=${() => { this._handleClick(); if (!this.conversationEntity) { this._showToast('请先配置小米语音实体 conversation', 'warning'); return; } this.showXiaoaiConversation(this.shadowRoot?.querySelector('.sidebar-btn[title*="语音对话"]')); }} title="${this.conversationEntity ? '小米语音对话记录' : '未配置 conversation'}">
              <ha-icon icon="mdi:magnify"></ha-icon>
              <span class="sidebar-btn-label">小米语音</span>
            </button>
          </div>

          <!-- 右侧播放主体 -->
          <div class="player-main">
            <!-- 中间主体 -->
            <div class="main-area">
              <!-- 左：专辑封面 -->
              <div class="album-art" style="${finalCover ? `background-image: url('${finalCover}')` : ''}">
                ${!finalCover ? html`
                  <ha-icon class="album-art-placeholder" icon="mdi:music-note" style="--mdc-icon-size: 40px;"></ha-icon>
                ` : ''}
              </div>

              <!-- 右：歌曲信息区 -->
              <div class="song-info-area">
                <div class="song-title">${activeTitle || '未播放'}</div>
                <div class="song-artist">${activeArtist || '\u00A0'}</div>
                ${attributes.media_source_name ? html`<div class="song-source">${attributes.media_source_name}</div>` : ''}
                <div class="action-buttons-row">
                  <button class="action-btn" style="background: ${themeColors.bg}; ${this.favoriteSongEntity ? '' : 'opacity: 0.4;'}" @click=${this.handleFavoriteCurrentSong} title="收藏当前播放歌曲">
                    <ha-icon icon="mdi:heart"></ha-icon>
                  </button>
                  <button class="action-btn" style="background: ${themeColors.bg}; ${this.stopAlarmEntity ? '' : 'opacity: 0.4;'}" @click=${this.handleStopAlarm} title="停止当前闹钟">
                    <ha-icon icon="mdi:alarm"></ha-icon>
                  </button>
                  <button class="action-btn" style="background: ${themeColors.bg}; ${this.xiaomiMiotEntity || this.xiaomiHomeEntity ? '' : 'opacity: 0.4;'}" @click=${this._toggleHistory} title="播放历史记录">
                    <ha-icon icon="mdi:chart-box-outline"></ha-icon>
                  </button>
                </div>
              </div>
            </div>

            <!-- 歌词区域 (在操作按钮行与进度条之间) -->
            ${this.showLyrics ? html`
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
                <!-- 歌词调整弹窗 -->
                <div class="lyrics-adjustment-toast ${this.adjustmentToast.show ? 'show' : ''}" id="lyrics-toast">
                  ${this.adjustmentToast.message}
                </div>
              </div>
            </div>
            ` : ''}

            <!-- 进度条 -->
            <div class="progress-area">
              <div class="progress-time">${currentTimeStr}</div>
              <div class="progress-track">
                <div class="progress-fill" style="width: ${progressPercentage}%;"></div>
              </div>
              <div class="progress-time">${totalTimeStr}</div>
            </div>

            <!-- 播放控制 -->
            <div class="controls-area">
              <button class="control-btn" style="background: ${themeColors.bg};" @click=${this.handleShuffle} title="随机播放">
                <ha-icon icon="mdi:shuffle-variant"></ha-icon>
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
              <button class="control-btn" style="background: ${themeColors.bg};" @click=${this.handleRepeat} title="循环模式">
                <ha-icon icon="mdi:repeat"></ha-icon>
              </button>

            </div>

            <!-- 音量 -->
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
          </div>
        </div>

        <!-- 小米搜索面板 -->
        ${this._renderTextSearchPanel()}

        <!-- 网易推荐弹窗 -->
        ${this._neteaseRecommendedVisible ? this._renderNeteaseRecommendedPanel() : ''}

        <!-- MA 播放列表弹窗 (QQ音乐) -->
        ${this._maPlaylistsVisible ? this._renderMaPlaylistsPanel() : ''}
      </div>
    `;
  }

  // ========== 主卡片主题集成方法 ==========

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

  _getMainCardThemes() {
    const mainCard = this._deepQuerySelector('minecraft-dashboard-card');
    if (mainCard && mainCard._config && Array.isArray(mainCard._config.image_themes) && mainCard._config.image_themes.length > 0) {
      return mainCard._config.image_themes;
    }
    return null;
  }

  _getEffectiveThemes() {
    const mainThemes = this._getMainCardThemes();
    if (mainThemes && mainThemes.length > 0) {
      return mainThemes;
    }
    const localThemes = (this._config && this._config.image_themes) || [];
    return localThemes;
  }

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


  // ========== 新增布局相关方法 ==========

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

  _formatTime(seconds) {
    if (!seconds || seconds <= 0) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  }

  handleVolumeMute() {
    this._handleClick();
    const target = this._getVolumeTargetEntity();
    if (!target) return;
    this._isVolumeChanging = true;
    if (this.volumeState > 0) {
      // 静音：记住当前音量，通过 Home 实体设为 0
      this._lastVolume = this.volumeState;
      this.updateVolume(0);
      this.callService('media_player.volume_set', { entity_id: target, volume_level: 0 });
    } else {
      // 取消静音：恢复之前音量
      const restoreVolume = this._lastVolume || 30;
      this.updateVolume(restoreVolume);
      this.callService('media_player.volume_set', { entity_id: target, volume_level: restoreVolume / 100 });
    }
    setTimeout(() => { this._isVolumeChanging = false; }, 2500);
  }

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

  _onVolumePointerDown(e) {
    e.preventDefault();
    this._isVolumeDragging = true;
    this._volumeUpdateFromEvent(e);
    const onMove = (ev) => {
      if (!this._isVolumeDragging) return;
      this._volumeUpdateFromEvent(ev);
    };
    const onUp = () => {
      // 始终清理监听器，防止残留导致按钮失灵
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('pointercancel', onUp);
      if (!this._isVolumeDragging) return;
      this._isVolumeDragging = false;
      this._volumeJustReleased = true;
      this._justVolumeDragged = true;
      this._volumeCallService();
      // 拖拽结束后触发 UI 刷新（音量图标、静音按钮等）
      this.requestUpdate();
    };
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    window.addEventListener('pointercancel', onUp);
  }

  _volumeUpdateFromEvent(e) {
    const track = this.shadowRoot.querySelector('.volume-track');
    if (!track) return;
    const rect = track.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const ratio = Math.max(0, Math.min(1, x / rect.width));
    const value = Math.round(ratio * 100);
    // 拖拽期间存入非响应式变量，不触发 Lit 重渲染
    this._dragVolume = value;

    // 拖拽期间仅更新 CSS 样式（不触碰 textContent，避免销毁 Lit 绑定的 TextNode）
    const fill = track.querySelector('.volume-fill');
    const thumb = track.querySelector('.volume-thumb');
    if (fill) fill.style.width = `${value}%`;
    if (thumb) thumb.style.left = `${value}%`;
    // 注意：不更新 .volume-value 的 textContent！
    // 该元素包含 Lit 模板绑定 ${Math.round(this.volumeState)}%，
    // 直接设 textContent 会销毁 Lit 绑定的 TextNode，导致后续渲染时报
    // "Cannot set properties of null (setting 'data')"
  }

  _volumeCallService() {
    if (!this._hass) return;
    // 拖拽期间用的是 _dragVolume，未拖拽时回退到 volumeState
    const newVolume = (this._dragVolume !== undefined) ? this._dragVolume : this.volumeState;
    this._dragVolume = undefined;
    // 通过 updateVolume 设置本地状态（含 2s 自动清除定时器），触发一次完整的 Lit 重渲染
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
      // 没有可用实体时，500ms 后清除标志
      setTimeout(() => { this._isVolumeChanging = false; }, 500);
    }
  }

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

  // ========================================
  // 本地音乐播放器 — showLocalMusicPopup（入口）
  // ========================================

  _parsePlayerConfig(cardConfig) {
    let src = cardConfig;
    if ((!src || !(src.entity || src.media_entity)) && src?.buttons?.[0]) {
      src = src.buttons[0];
    }
    const mediaEntity = (src && (src.entity || src.media_entity)) || null;
    if (!src || !mediaEntity) {
      // 自动使用小爱音箱实体
      const autoEntity = this.xiaomiMiotEntity || this.xiaomiHomeEntity;
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

  _resolveDefaultPageIndex(cfg) {
    const name = cfg.defaultPage;
    if (!name) return 0;
    const idx = cfg.pageTabs.findIndex(t => t.name === name);
    return idx >= 0 ? idx : 0;
  }

  // 主入口：打开本地音乐弹窗
  showLocalMusicPopup(group, button) {
    const playerCfg = this._parsePlayerConfig(group || {});
    if (!playerCfg) { this._showToast('请配置 media_entity', 'warning'); return; }
    this._localMusicPlayerCfg = playerCfg;
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
        contentContainer.style.cssText = 'display:flex;flex-direction:column;flex:1;overflow:hidden;position:relative;';
        popupState._popupContainer = contentContainer;
        this._renderPlayerPopup(contentContainer, playerCfg, popupState);
        return contentContainer;
      },
      className: 'media-player-popup',
      style: 'background:var(--room-popup-bg,rgba(255,255,255,0.98));backdrop-filter:blur(30px);-webkit-backdrop-filter:blur(30px);border-radius:24px;padding:0;overflow:hidden;width:' + (playerCfg.width || '420px') + ';max-width:min(420px,95vw);min-width:320px;height:700px;max-height:min(700px,90vh);display:flex;flex-direction:column;',
      triggerButton: null, showOverlay: true, showBackground: true, popupPosition: null,
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
        this._fetchNowPlaying(playerCfg).then(nowPlaying => {
          if (nowPlaying && nowPlaying.song_id) {
            for (let tIdx = 0; tIdx < (playerCfg.tabs || []).length; tIdx++) {
              const tab = playerCfg.tabs[tIdx];
              if (nowPlaying.user && playerCfg.users?.[tIdx] !== nowPlaying.user) continue;
              for (let pIdx = 0; pIdx < (tab?.playlists || []).length; pIdx++) {
                const pl = tab.playlists[pIdx];
                if (nowPlaying.playlist_id && pl.id !== nowPlaying.playlist_id) continue;
                if (!Array.isArray(pl.items)) continue;
                const sIdx = pl.items.findIndex(it => it.id === nowPlaying.song_id);
                if (sIdx >= 0) {
                  popupState.activeTabIndex = tIdx; popupState.activePlaylistIndex = pIdx; popupState.activeItemIndex = sIdx;
                  this._saveMediaPlayerState(popupState); break;
                }
              }
            }
          }
          const viewArea = popupState._viewArea;
          if (viewArea) this._renderActivePage(viewArea, playerCfg, popupState);
          this._bindPlayerEvents(contentContainer, playerCfg, popupState);
          this._refreshPlayerUI(contentContainer, playerCfg, popupState);
          this._startPlayerRefreshInterval(contentContainer, playerCfg, popupState);
        });
      }
    });
    popupState._closePopup = closePopup;
    return closePopup;
  }

  // 现有 showMediaPlayerPopup 别名兼容
  showMediaPlayerPopup(group, button) {
    return this.showLocalMusicPopup(group, button);
  }

  // ========================================
  // 工具方法
  // ========================================

  _escapeHtml(text) {
    if (!text) return '';
    const d = document.createElement('div');
    d.textContent = text;
    return d.innerHTML;
  }

  _formatMediaTime(seconds) {
    if (!seconds || isNaN(seconds) || seconds < 0) return '0:00';
    const s = Math.floor(seconds);
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return m + ':' + sec.toString().padStart(2, '0');
  }

  _styleVolumeThumb(slider) {
    if (!document.getElementById('_sunPlayerVolStyle')) {
      const s = document.createElement('style'); s.id = '_sunPlayerVolStyle';
      s.textContent = '.media-player-volume-slider::-webkit-slider-thumb{-webkit-appearance:none;appearance:none;width:14px;height:14px;border-radius:50%;background:var(--room-icon-color,#3498db);border:2px solid #fff;box-shadow:0 1px 4px rgba(0,0,0,0.2);cursor:pointer;}.media-player-volume-slider::-moz-range-thumb{width:14px;height:14px;border-radius:50%;background:var(--room-icon-color,#3498db);border:2px solid #fff;box-shadow:0 1px 4px rgba(0,0,0,0.2);cursor:pointer;}';
      document.head.appendChild(s);
    }
  }

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
    const prevBtn = container.querySelector('[data-action="prev"]'); if (prevBtn) prevBtn.addEventListener('click', () => { this._prevTrack(cfg, state, container); });
    const nextBtn = container.querySelector('[data-action="next"]'); if (nextBtn) nextBtn.addEventListener('click', () => { this._nextTrack(cfg, state, container); });
    const stopBtn = container.querySelector('[data-action="stop"]'); if (stopBtn) stopBtn.addEventListener('click', () => { this._stopMedia(cfg.mediaEntity); this._clearNowPlaying(cfg); });
    const volSlider = container.querySelector('[data-action="volume"]');
    if (volSlider) { volSlider.addEventListener('input', (e) => { const val = parseInt(e.target.value); this._setVolume(cfg.mediaEntity, val/100); const lb = container.querySelector('[data-volume-label]'); if (lb) lb.textContent = val + '%'; e.target.style.background = 'linear-gradient(to right,var(--room-icon-color,#3498db) 0%,var(--room-icon-color,#3498db) ' + val + '%,var(--room-slider-track,rgba(0,0,0,0.08)) ' + val + '%,var(--room-slider-track,rgba(0,0,0,0.08)) 100%)'; const vi = container.querySelector('[data-mute-toggle]'); if (vi) { vi.setAttribute('icon', val === 0 ? 'mdi:volume-off' : val < 50 ? 'mdi:volume-low' : 'mdi:volume-high'); if (val > 0) vi.dataset.prevVolume = String(val); } }); }
  }

  _createNewPlaylistInput(user, cfg, state, onDone) {
    const iw = document.createElement('div'); iw.style.cssText = 'display:flex;align-items:center;gap:6px;padding:4px 0;width:100%;';
    const inp = document.createElement('input'); inp.type = 'text'; inp.placeholder = '输入播放列表名称...'; inp.style.cssText = 'flex:1;padding:6px 10px;border-radius:8px;border:1px solid var(--room-input-border,rgba(0,0,0,0.15));background:var(--room-input-bg,rgba(0,0,0,0.03));color:var(--room-input-text,#2c3e50);font-size:13px;outline:none;font-family:inherit;'; iw.appendChild(inp);
    const conf = document.createElement('button'); conf.textContent = '创建'; conf.style.cssText = 'padding:6px 14px;border:none;border-radius:8px;cursor:pointer;background:rgba(46,204,113,0.8);color:#fff;font-size:12px;font-weight:600;'; conf.addEventListener('click', async () => { const name = inp.value.trim(); if (!name) { inp.style.borderColor = '#e74c3c'; return; } conf.textContent = '...'; const ok = await this._savePlaylist(user, name); if (!ok) { this._showToast('创建失败','error'); return; } await this._refreshPlaylists(cfg, state); const ni = (cfg.tabs[state.activeTabIndex]?.playlists?.length || 0) - 1; if (ni >= 0) { state.activePlaylistIndex = ni; this._openMediaBrowser(cfg, state, state.activeTabIndex, ni); } }); iw.appendChild(conf);
    const canc = document.createElement('button'); canc.textContent = '✕'; canc.style.cssText = 'padding:6px 10px;border:none;border-radius:8px;cursor:pointer;background:var(--room-button-bg,rgba(0,0,0,0.06));color:var(--room-secondary-text,#999);font-size:12px;'; canc.addEventListener('click', () => onDone()); iw.appendChild(canc);
    setTimeout(() => inp.focus(), 0); return iw;
  }

  _switchPlayerPage(idx, container, state) {
    if (idx === state.activePageIndex) return; state.activePageIndex = idx;
    const va = container.querySelector('.media-player-view-area');
    if (va) { va.style.opacity = '0'; this._timers.setTimeout(() => { this._renderActivePage(va, state.playerCfg, state); va.style.opacity = '1'; this._bindPlayerEvents(container, state.playerCfg, state); }, 80); }
  }

  _saveMediaPlayerState(state) { if (this._mediaPlayerState) { this._mediaPlayerState.activeTabIndex = state.activeTabIndex; this._mediaPlayerState.activePlaylistIndex = state.activePlaylistIndex; this._mediaPlayerState.activeItemIndex = state.activeItemIndex; } }

  // 保存当前播放歌曲信息到主卡片，供右侧控制区回退显示（解决 HA 实体属性不反映本地音乐标题/歌手的问题）
  _saveCurrentPlayingItem(item, cfg, state) {
    if (item && this._mediaPlayerState) {
      this._mediaPlayerState.currentItem = { title: item.title || '', artist: item.artist || '', album: item.album || '', duration: item.duration || 0, id: item.id || null, media_content_id: item.media_content_id || item.url || '', media_type: item.media_type || 'music' };
      // 触发主卡片 re-render 以更新右侧显示
      if (this.requestUpdate) this.requestUpdate();
    }
  }


  // 将 media-source:// URI 转换为 HA HTTP URL（MIoT 小爱实体需要可访问的 HTTP URL）
  _resolveMediaUrl(item) {
    if (item.url) return item.url;
    let cid = item.media_content_id || '';
    if (!cid) return '';
    // media-source://media_source/local/xxx → http://ha:8123/media/local/xxx
    if (cid.startsWith('media-source://media_source/local/')) {
      const path = cid.replace('media-source://media_source/local/', '');
      try { return window.location.origin + '/media/local/' + path; } catch(e) { return cid; }
    }
    // /media/local/xxx → http://ha:8123/media/local/xxx
    if (cid.startsWith('/media/local/')) {
      try { return window.location.origin + cid; } catch(e) { return cid; }
    }
    return cid;
  }

  _playMediaItem(item, cfg, state, container) {
    if (!this._hass) return;
    // 🛑 LOCAL 通道播放前：先暂停板块1（MIoT）和板块3（MA）—— 三通道互斥
    this._pauseOtherChannels();
    const te = this.xiaomiMiotEntity || this.xiaomiHomeEntity || cfg.mediaEntity;
    const playUrl = item.media_content_id || item.url || '';
    if (playUrl) this._hass.callService('media_player', 'play_media', { entity_id: te, media_content_id: playUrl, media_content_type: item.media_type || 'music' }).catch(() => {});
    this._saveMediaPlayerState(state); this._reportNowPlaying(cfg, state, item); this._saveCurrentPlayingItem(item, cfg, state);
    // 设置本地音乐覆盖信息（参照 xiaoshi-music-card overlay 模式，确保右侧控制区正确显示）
    this._setChannel('local');
    this._overlayTitle = item.title || item.name || '';
    this._overlayArtist = item.artist || '';
    this._overlayCoverUrl = item.cover || (item.id ? this._songCoverUrl(item.id) : '');
    this._activeOverlaySource = 'local';
    this._localOverlay = { ...this._localOverlay, active: true };
    // 同步 _lastPlaySource，确保 _isMaSourceActive() 正确判断 + render 恢复时正确显示
    this._lastPlaySource = 'local';
    try { localStorage.setItem(this._getLastSourceKey(), 'local'); } catch(e) {}
    this.requestUpdate();
    // 弹窗仅作为播放列表管理器，点击歌曲后自动关闭，由主卡片右侧控制区显示当前播放
    if (state._closePopup) { state._closePopup(); }
  }
  _prevTrack(cfg, state, c) { const t = cfg.tabs[state.activeTabIndex]; const p = t?.playlists?.[state.activePlaylistIndex]; if (!p?.items?.length) return; const ni = state.activeItemIndex > 0 ? state.activeItemIndex - 1 : p.items.length - 1; state.activeItemIndex = ni; this._playMediaItem(p.items[ni], cfg, state, c); }
  _nextTrack(cfg, state, c) { const t = cfg.tabs[state.activeTabIndex]; const p = t?.playlists?.[state.activePlaylistIndex]; if (!p?.items?.length) return; const ni = state.activeItemIndex < p.items.length - 1 ? state.activeItemIndex + 1 : 0; state.activeItemIndex = ni; this._playMediaItem(p.items[ni], cfg, state, c); }
  _togglePlayPause(entity) {
    if (!this._hass || !entity) return;
    const s = this._hass.states[entity];
    if (!s) { this._hass.callService('media_player', 'media_play', { entity_id: entity }).catch(() => {}); return; }
    const isPlaying = s.state === 'playing';
    if (isPlaying) {
      this._hass.callService('media_player', 'media_pause', { entity_id: entity }).catch(() => {});
    } else {
      // 暂停后恢复播放：本地音乐需要重新发送 play_media（小爱 MIoT 实体可能忘记 URL）
      const ci = this._mediaPlayerState?.currentItem;
      if (ci?.media_content_id) {
        const playUrl = ci.media_content_id || '';
        if (playUrl) {
          this._hass.callService('media_player', 'play_media', {
            entity_id: entity,
            media_content_id: playUrl,
            media_content_type: ci.media_type || 'music'
          }).catch(() => {});
        }
      } else {
        this._hass.callService('media_player', 'media_play', { entity_id: entity }).catch(() => {});
      }
    }
  }
  _stopMedia(entity) { if (!this._hass || !entity) return; this._hass.callService('media_player', 'media_pause', { entity_id: entity }).catch(() => {}); }
  _setVolume(entity, level) { if (!this._hass || !entity) return; this._hass.callService('media_player', 'volume_set', { entity_id: entity, volume_level: Math.max(0, Math.min(1, level)) }).catch(() => {}); }

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
    const vs = container.querySelector('[data-action="volume"]'); if (vs && parseInt(vs.value) !== volPct) { vs.value = volPct; vs.style.background = 'linear-gradient(to right,var(--room-icon-color,#3498db) 0%,var(--room-icon-color,#3498db) ' + volPct + '%,var(--room-slider-track,rgba(0,0,0,0.08)) ' + volPct + '%,var(--room-slider-track,rgba(0,0,0,0.08)) 100%)'; }
    const vl = container.querySelector('[data-volume-label]'); if (vl) vl.textContent = volPct + '%';
    const vi2 = container.querySelector('[data-mute-toggle]'); if (vi2) vi2.setAttribute('icon', volPct === 0 ? 'mdi:volume-off' : volPct < 50 ? 'mdi:volume-low' : 'mdi:volume-high');
    const ph = container.querySelectorAll('.media-player-playlist-header'); ph.forEach(cd => { const pi3 = parseInt(cd.dataset.playlistIndex); const isa = pi3 === state.activePlaylistIndex && state.activeItemIndex >= 0; const ico = cd.querySelector('ha-icon'); if (ico) ico.style.color = isa ? 'var(--room-icon-color,#3498db)' : 'var(--room-icon-color,#555)'; });
    const si = container.querySelectorAll('.media-player-item'); si.forEach(ie => { const ii = parseInt(ie.dataset.itemIndex); const isc = state.activeItemIndex === ii; ie.style.background = isc ? 'var(--room-button-bg,rgba(0,0,0,0.06))' : 'transparent'; const sp = ie.querySelector('span'); if (sp) sp.style.color = isc ? 'var(--room-icon-color,#3498db)' : 'var(--room-secondary-text,#ccc)'; });
  }

  _startPlayerRefreshInterval(container, cfg, state) {
    if (this._mediaPlayerRefreshTimer) this._timers.clearTimeout(this._mediaPlayerRefreshTimer);
    let tc = 0;
    const tick = () => { if (!container?.isConnected || state._cleanup) return; const es = this._hass?.states?.[cfg.mediaEntity]; const ip = es?.state === 'playing'; const dur = state._lastEntityDuration || es?.attributes?.media_duration || 0; tc++; if (tc % 5 === 0 && es) { const rp = this._calcRealPosition(es); if (Math.abs((state._localPosition || 0) - rp) > 2) state._localPosition = rp; state._lastEntityPosition = es.attributes?.media_position || 0; } else if (ip) state._localPosition = Math.min((state._localPosition || 0) + 1, dur || 999999); this._refreshPlayerUI(container, cfg, state); this._mediaPlayerRefreshTimer = this._timers.setTimeout(tick, 1000); };
    this._mediaPlayerRefreshTimer = this._timers.setTimeout(tick, 1000);
  }




  _calcRealPosition(es) { if (!es) return 0; const p = es.attributes?.media_position || 0; const ua = es.attributes?.media_position_updated_at; if (es.state === 'playing' && ua) return p + Math.max(0, Math.floor((Date.now() - new Date(ua).getTime()) / 1000)); return p; }

  _getCurrentPlayingItem(cfg, state) {
    if (state.activeItemIndex >= 0 && state.activePlaylistIndex >= 0) { const t = cfg.tabs?.[state.activeTabIndex]; const p = t?.playlists?.[state.activePlaylistIndex]; if (p?.items?.[state.activeItemIndex]) return p.items[state.activeItemIndex]; }
    const es = this._hass?.states?.[cfg.mediaEntity]; const ci = es?.attributes?.media_content_id || '';
    if (ci) { for (const t of (cfg.tabs || [])) for (const p of (t?.playlists || [])) if (Array.isArray(p.items)) for (const i of p.items) if (i.media_content_id === ci) return i; }
    const ed = es?.attributes?.media_duration || 0;
    if (ed > 0) { for (const t of (cfg.tabs || [])) for (const p of (t?.playlists || [])) if (Array.isArray(p.items)) for (const i of p.items) if (i.duration && Math.abs(i.duration - ed) < 1) return i; }
    return null;
  }

  _resolveCoverUrl(cfg, state, currentItem, entityState) { if (currentItem?.id && currentItem.has_cover) return this._songCoverUrl(currentItem.id); return ''; }

  _songCoverUrl(songId) { return songId ? this._mediaApiUrl('media/songs/' + encodeURIComponent(songId) + '/cover') : ''; }

  async _fetchSongLyrics(songId) { if (!songId) return ''; try { const r = await fetch(this._mediaApiUrl('media/songs/' + encodeURIComponent(songId) + '/lyrics')); const j = await r.json(); if (!j.success) return ''; return j.lyrics || j.data?.lyrics || ''; } catch(e) { return ''; } }

  _parseLrcLyrics(raw) {
    if (!raw?.trim()) return { timed: false, lines: [] }; const text = raw.replace(/\r/g, '');
    const re = /\[(\d{1,2}):(\d{1,2})(?:[.:](\d{1,3}))?\]/g; if (!re.test(text)) { re.lastIndex = 0; const ls = text.split('\n').map(l => l.trim()).filter(Boolean); return { timed: false, lines: ls.map(l => ({ time: -1, text: l })) }; }
    re.lastIndex = 0; const lines = [];
    text.split('\n').forEach(line => { const times = []; let m; const lr = /\[(\d{1,2}):(\d{1,2})(?:[.:](\d{1,3}))?\]/g; while ((m = lr.exec(line)) !== null) { times.push((parseInt(m[1])||0)*60 + (parseInt(m[2])||0) + (m[3] ? parseInt(m[3].padEnd(3,'0')) : 0)/1000); } const lt = line.replace(lr, '').trim(); if (times.length === 0) return; times.forEach(t => lines.push({ time: t, text: lt })); });
    lines.sort((a, b) => a.time - b.time); return { timed: true, lines };
  }

  _renderLyrics(container, parsed, currentPos) {
    if (!parsed?.lines?.length) { if (container.dataset.lyricsRendered !== 'empty') { container.dataset.lyricsRendered = 'empty'; container.innerHTML = '<div style="color:var(--room-secondary-text,#999);padding:20px 0;">暂无歌词</div>'; } return; }
    if (!parsed.timed) { if (container.dataset.lyricsRendered !== 'plain') { container.dataset.lyricsRendered = 'plain'; container.innerHTML = parsed.lines.map(l => '<div style="color:var(--room-primary-text,#2c3e50);padding:2px 0;">' + this._escapeHtml(l.text) + '</div>').join(''); } return; }
    let ai = -1; for (let i = 0; i < parsed.lines.length; i++) { if (parsed.lines[i].time <= currentPos) ai = i; else break; }
    if (container.dataset.lyricsActiveIdx === String(ai)) return; container.dataset.lyricsActiveIdx = String(ai); container.dataset.lyricsRendered = 'timed';
    container.innerHTML = parsed.lines.map((l, i) => '<div data-lyrics-line="' + i + '" class="' + (i === ai ? 'media-player-lyrics-line media-player-lyrics-line-active' : 'media-player-lyrics-line media-player-lyrics-line-inactive') + '">' + this._escapeHtml(l.text || '♪') + '</div>').join('');
    if (ai >= 0) { const ae2 = container.querySelector('[data-lyrics-line="' + ai + '"]'); if (ae2) container.scrollTop = Math.max(0, ae2.offsetTop - container.clientHeight/2 + ae2.clientHeight/2); }
  }

  _switchLyricsLayout(container, state, hasLyrics) {
    const ts = state._topSection || container.querySelector('[data-mode]'); if (!ts) return;
    const hr = ts.children[0]; const cb = ts.querySelector('[data-cover-target]')?.parentElement; const md = ts.querySelector('[data-meta="title"]')?.parentElement; const lw = state._lyricsWrap;
    if (hasLyrics) { ts.dataset.mode = 'lyrics'; if (hr) { hr.style.flexDirection = 'row'; hr.style.alignItems = 'center'; } if (cb) { cb.style.width = '60px'; cb.style.height = '60px'; cb.style.borderRadius = '10px'; } if (md) { md.style.textAlign = 'left'; } if (lw) lw.style.display = 'block'; }
    else { ts.dataset.mode = 'vertical'; if (hr) { hr.style.flexDirection = 'column'; hr.style.alignItems = 'center'; } if (cb) { cb.style.width = '260px'; cb.style.height = '260px'; cb.style.borderRadius = '16px'; } if (md) { md.style.textAlign = 'center'; } if (lw) lw.style.display = 'none'; }
  }

  // ======= 播放列表 API =======
  async _fetchPlaylists(userName) { try { const paths = (this._config?.local_music_path || '').split('\n').map(p => p.trim()).filter(p => p); if (paths.length === 0) { const pls = []; await this._collectPlaylists('', pls); return pls.filter(p => p.items.length > 0); } const all = []; for (const path of paths) { const pls = []; await this._collectPlaylists(path, pls); all.push(pls.filter(p => p.items.length > 0)); } return all.flat(); } catch(e) { return []; } }

  async _collectPlaylists(mediaContentId, pls) {
    const result = await this._browseMediaSource(mediaContentId).catch(() => ({children:[]}));
    const children = result.children || [];
    const directFiles = [];
    for (const c of children) {
      if (c.can_expand) {
        // 递归处理子文件夹——每个子文件夹作为一个独立歌单
        await this._collectPlaylists(c.media_content_id, pls);
      } else if (this._isAudioFile(c)) {
        directFiles.push({ title: c.title, artist: '', media_content_id: c.media_content_id, media_type: c.media_content_type || 'music', cover_url: c.thumbnail || '' });
      }
    }
    if (directFiles.length > 0) pls.push({ id: mediaContentId, name: this._getFolderName(mediaContentId), items: directFiles });
  }

  _getFolderName(mediaContentId) {
    const parts = mediaContentId.split('/'); return parts[parts.length - 1] || parts[parts.length - 2] || '本地音乐';
  }

  _isAudioFile(c) {
    const name = (c.title || c.name || '').toLowerCase();
    const ext = name.split('.').pop();
    const audioExts = ['mp3','flac','wav','ogg','m4a','wma','aac','opus','ape','aiff','dsf','dff','wv','alac','ac3','dts','m4b','mid','midi','ra','spx','tta','cda'];
    if (audioExts.includes(ext)) return true;
    const type = (c.media_content_type || '').toLowerCase();
    if (type === 'music' || type === 'audio' || type.startsWith('audio/')) return true;
    return false;
  }
  async _savePlaylist(userName, name) { return false; /* 配置只读 */ }
  async _deletePlaylist(playlistId, userName) { return false; /* 配置只读 */ }
  async _addSongToBackend(playlistId, songItem) { return null; /* 配置只读 */ }
  async _deleteSongFromBackend(songId) { return false; /* 配置只读 */ }
  async _refreshPlaylists(cfg, state) { const u = cfg.users?.[state.activeTabIndex]; if (!u) return; const pls = await this._fetchPlaylists(u); const tb = cfg.tabs[state.activeTabIndex]; if (tb) tb.playlists = pls; if (state._popupContainer) this._rerenderCurrentView(state._popupContainer, cfg, state); }
  /** 上报正在播放（通用数据对象，供各通道调用）
   *  @param {Object} data - 播放数据
   *  @param {string} channel - 通道标识: 'miot' | 'local' | 'ma'
   */
  async _reportNowPlayingData(data, channel) {
    if (!data) return;
    const ch = channel || 'miot';
    // ── 三通道独立实体：MA 通道优先使用 maPlayerEntity，MIoT/LOCAL 使用 Xiaomi 实体 ──
    const entityId = ch === 'ma'
      ? (this.maPlayerEntity || this.xiaomiMiotEntity || this.xiaomiHomeEntity)
      : (this.xiaomiMiotEntity || this.xiaomiHomeEntity);
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

    // ── 三通道独立 localStorage（按设备 ID 隔离，多音箱互不干扰）──
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

  async _reportNowPlaying(cfg, state, item) {
    if (!item?.id) return;
    const u = cfg.users?.[state.activeTabIndex] || '';
    let pid = null;
    if (state.activePlaylistIndex >= 0) pid = cfg.tabs?.[state.activeTabIndex]?.playlists?.[state.activePlaylistIndex]?.id || null;
    // 保存到 localStorage（刷新页面恢复 — 使用 local 通道独立命名空间）
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

  /** 从 localStorage 恢复播放信息（页面刷新后兜底）
   *  @param {string} channel - 'miot' | 'local' | 'ma'
   */
  _restoreNowPlayingFromLocalStorage(channel) {
    const ch = channel || 'miot';
    const lsKey = this._getNpKey(ch);
    try {
      const raw = localStorage.getItem(lsKey);
      if (!raw) return null;
      const data = JSON.parse(raw);
      if (!data.title) return null;
      // entity_id 匹配检查（三通道独立实体：MA 通道使用 maPlayerEntity）
      let expectedIds;
      if (ch === 'ma') {
        expectedIds = [this.maPlayerEntity, this.xiaomiMiotEntity, this.xiaomiHomeEntity].filter(Boolean);
      } else {
        expectedIds = [this.xiaomiMiotEntity, this.xiaomiHomeEntity, this._localMusicPlayerCfg?.mediaEntity].filter(Boolean);
      }
      const isLocalMusic = (data.source || '') === 'local' || !data.source;
      const matches = expectedIds.length === 0 || expectedIds.includes(data.entity_id) || (isLocalMusic && !this._localMusicPlayerCfg);
      if (expectedIds.length > 0 && !matches) {
        return null;
      }
      // 检测占位符标题
      const MIOT_FAKE_RE = new Set(['请欣赏', '请欣赏（音乐）', '暂无播放', '正在加载', 'QQ音乐', '无音乐播放']);
      if (MIOT_FAKE_RE.has(data.title)) {
        localStorage.removeItem(lsKey);
        return null;
      }
      // 歌曲匹配检查（仅 MA 通道：MA WS 报告了不同歌曲时跳过 localStorage 恢复，避免旧数据覆盖）
      if (ch === 'ma' && this._maTrackName && data.title !== this._maTrackName) {
        return null;
      }
      // 过期检查
      if (data.updated_at && (Date.now() - data.updated_at > 24 * 60 * 60 * 1000)) {
        localStorage.removeItem(lsKey);
        return null;
      }
      // 过滤占位符艺术家（如"心灵之谜"）
      if (data.artist && this._isPseudoArtist('', data.artist)) {
        data.artist = '';
      }
      return data;
    } catch(e) { return null; }
  }

  /** 从 localStorage 恢复 MA 通道 overlay（参照 xiaoshi-music-card.js 恢复逻辑）
   *  根据 last_source 区分网易推荐/QQ音乐，调用各自的恢复方法。
   *  仅操作 _maOverlay，不影响 MIoT/LOCAL。
   */
  _restoreMaOverlayFromLocalStorage() {
    // 直接读取 localStorage，不经过 entity 匹配过滤（保存时已确保来源正确）
    let savedSource = '';
    try { savedSource = localStorage.getItem(this._getLastSourceKey()) || ''; } catch(e) {}

    let lsData = null;
    try {
      const raw = localStorage.getItem(this._getNpKey('ma'));
      if (raw) lsData = JSON.parse(raw);
    } catch(e) {}

    // 若两者皆无，则放弃
    if (!lsData && !savedSource) {
      return;
    }

    // 检测占位符（和 xiaoshi-music-card.js 一致）
    const MIOT_PSEUDO = ['请欣赏（音乐）', '请欣赏', '暂无播放', '暂未播放', 'QQ音乐', '正在加载', '加载中', '无音乐播放'];
    if (lsData && lsData.title) {
      const isPseudo = MIOT_PSEUDO.some(p => lsData.title.includes(p));
      if (isPseudo) {
        try { localStorage.removeItem(this._getNpKey('ma')); } catch(e) {}
        lsData = null;
      }
    }

    const effectiveSource = savedSource || (lsData?.source) || '';

    if (effectiveSource === 'netease') {
      this._setChannel('ma');
      this._maOverlay.source = 'netease';
      this._maOverlay.active = true;
      if (lsData) {
        this._maOverlay.title = lsData.title || '';
        this._maOverlay.artist = lsData.artist || '';
        this._maOverlay.coverUrl = lsData.cover_url || '';
      }
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

  /** 清除 localStorage 播放记录
   *  @param {string} channel - 'miot' | 'local' | 'ma'，不指定则清除所有
   */
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
  async _fetchNowPlaying(cfg) { return null; /* 不再使用后端API */ }
  async _clearNowPlaying(cfg) { this._clearNowPlayingLocalStorage(cfg?.mediaEntity ? 'local' : ''); }


  // ======= 整列表播放 / 后台队列（参照 xiaoshi-music-card）=======
  async _startQueuePlayback(cfg, state, pl) {
    if (!pl || !Array.isArray(pl.items) || pl.items.length === 0) { this._showToast('列表为空，无法播放', 'warning'); return; }
    // 🛑 LOCAL 队列播放前：先暂停板块1（MIoT）和板块3（MA）—— 三通道互斥
    this._pauseOtherChannels();
    const entityId = cfg.mediaEntity;
    const startIdx = state.activeItemIndex >= 0 ? state.activeItemIndex : 0;
    const startTrack = pl.items[startIdx];
    state.activeItemIndex = startIdx;
    if (startTrack && entityId) {
      const playUrl = startTrack.media_content_id || startTrack.url || '';
      if (playUrl) {
        await this._hass.callService('media_player', 'play_media', {
          entity_id: entityId,
          media_content_id: playUrl,
          media_content_type: startTrack.media_type || 'music'
        }).catch(() => {});
      }
    }
    // LOCAL 通道激活
    this._setChannel('local');
    this._overlayTitle = startTrack.title || startTrack.name || '';
    this._overlayArtist = startTrack.artist || '';
    this._overlayCoverUrl = startTrack.cover || (startTrack.id ? this._songCoverUrl(startTrack.id) : '');
    this._activeOverlaySource = 'local';
    this._localOverlay = { ...this._localOverlay, active: true };
    if (this._mediaPlayerState) this._mediaPlayerState.currentItem = { title: startTrack.title || '', artist: startTrack.artist || '', album: startTrack.album || '', duration: startTrack.duration || 0, id: startTrack.id || null, media_content_id: startTrack.media_content_id || '' };
    this._reportNowPlaying(cfg, state, startTrack);
    this._showToast('已开始播放列表「' + this._escapeHtml(pl.name || '') + '」', 'success');
  }




  // ======= 媒体库浏览 =======
  _browseMediaSource(parentId) {
    const msg = { type: 'media_source/browse_media', media_content_id: parentId || undefined };
    if (typeof this._hass?.callWS === 'function') return this._hass.callWS(msg);
    if (this._hass?.connection?.sendMessagePromise) return this._hass.connection.sendMessagePromise(msg);
    return Promise.reject(new Error('不可用'));
  }

  _openMediaBrowser(cfg, state, tabIndex, playlistIndex) {
    let cc;
    this.showPopup({ content: () => { cc = document.createElement('div'); cc.style.cssText = 'height:100%;max-height:75vh;display:flex;flex-direction:column;background:var(--room-popup-bg,rgba(255,255,255,0.98));border-radius:16px;overflow:hidden;'; const tb = document.createElement('div'); tb.style.cssText = 'display:flex;align-items:center;justify-content:space-between;padding:14px 16px;border-bottom:1px solid var(--room-popup-divider,rgba(0,0,0,0.08));flex-shrink:0;'; tb.innerHTML = '<div style="display:flex;align-items:center;gap:8px;"><ha-icon icon="mdi:music-box-multiple" style="--mdc-icon-size:22px;color:var(--room-icon-color,#3498db);"></ha-icon><span style="font-size:15px;font-weight:600;color:var(--room-primary-text,#2c3e50);">媒体库</span></div><span style="font-size:11px;color:var(--room-secondary-text,#999);">选择歌曲添加</span>'; cc.appendChild(tb); const be = document.createElement('div'); be.style.cssText = 'flex:1;overflow-y:auto;padding:8px;min-height:0;'; be.innerHTML = '<div style="text-align:center;padding:50px 0;color:var(--room-secondary-text,#999);font-size:13px;">正在加载媒体库...</div>'; cc.appendChild(be); this._browseMediaSource('').then(root => { be.innerHTML = ''; this._renderMediaBrowserLevel(be, root, cfg, state, tabIndex, playlistIndex, '', []); }).catch(err => { be.innerHTML = '<div style="text-align:center;padding:50px 20px;color:#e74c3c;font-size:14px;">加载失败</div>'; }); return cc; }, className: 'media-source-browser-popup', style: 'width:min(420px,90vw);max-height:75vh;border-radius:16px;padding:0;overflow:hidden;', showOverlay: true, showBackground: true, overlayBlur: true });
  }

  _renderMediaBrowserLevel(container, node, cfg, state, tabIndex, playlistIndex, currentPath, browseHistory) {
    const items = node.children || []; const history = browseHistory || [];
    if (items.length === 0) { container.innerHTML = '<div style="text-align:center;padding:60px 20px;color:var(--room-secondary-text,#999);font-size:13px;">该目录下没有可添加的媒体文件</div>'; return; }
    if (history.length > 0) { const nb = document.createElement('div'); nb.style.cssText = 'display:flex;align-items:center;gap:8px;padding:6px 12px 10px;border-bottom:1px solid var(--room-popup-divider,rgba(0,0,0,0.06));margin-bottom:8px;'; const bb = document.createElement('button'); bb.style.cssText = 'display:flex;align-items:center;justify-content:center;width:30px;height:30px;border:none;border-radius:8px;cursor:pointer;background:var(--room-button-bg,rgba(0,0,0,0.06));color:var(--room-primary-text,#2c3e50);'; bb.innerHTML = '<ha-icon icon="mdi:arrow-left" style="--mdc-icon-size:18px;"></ha-icon>'; bb.addEventListener('click', () => { const pid = history[history.length-1]; const nh = history.slice(0,-1); container.innerHTML = '<div style="text-align:center;padding:50px 0;color:var(--room-secondary-text,#999);font-size:13px;">加载中...</div>'; this._browseMediaSource(pid).then(pn => { container.innerHTML = ''; this._renderMediaBrowserLevel(container, pn, cfg, state, tabIndex, playlistIndex, pid, nh); }); }); nb.appendChild(bb); container.appendChild(nb); }
    items.forEach(child => { const ie = child.can_expand === true; const ht = child.thumbnail && !ie; const rw = document.createElement('div'); rw.style.cssText = 'display:flex;align-items:center;gap:10px;padding:10px 12px;border-radius:10px;cursor:' + (ie ? 'pointer' : 'default') + ';margin-bottom:2px;'; if (ht) { const th = document.createElement('img'); th.src = child.thumbnail; th.style.cssText = 'width:36px;height:36px;border-radius:8px;object-fit:cover;flex-shrink:0;'; rw.appendChild(th); } else { const ic = document.createElement('ha-icon'); ic.setAttribute('icon', ie ? 'mdi:folder-music-outline' : 'mdi:file-music-outline'); ic.style.cssText = '--mdc-icon-size:22px;color:' + (ie ? 'var(--room-icon-color,#3498db)' : 'var(--room-secondary-text,#999)') + ';flex-shrink:0;'; rw.appendChild(ic); } const nm = document.createElement('span'); nm.style.cssText = 'flex:1;font-size:13px;color:var(--room-primary-text,#2c3e50);font-weight:500;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;'; nm.textContent = child.title || '未知'; rw.appendChild(nm);
    if (ie) { const ab = document.createElement('button'); ab.style.cssText = 'padding:4px 10px;border:1px solid var(--room-popup-card-border,rgba(0,0,0,0.12));border-radius:6px;cursor:pointer;font-size:10px;font-weight:500;flex-shrink:0;'; ab.textContent = '+ 全部'; ab.addEventListener('click', (e) => { e.stopPropagation(); this._showPlaylistPicker(cfg, state, child); }); rw.appendChild(ab); rw.addEventListener('click', () => { container.innerHTML = '<div style="text-align:center;padding:50px 0;color:var(--room-secondary-text,#999);font-size:13px;">加载中...</div>'; this._browseMediaSource(child.media_content_id).then(sn => { container.innerHTML = ''; this._renderMediaBrowserLevel(container, sn, cfg, state, tabIndex, playlistIndex, child.media_content_id, [...history, currentPath || '']); }); }); }
    else { const ab = document.createElement('button'); ab.style.cssText = 'padding:5px 14px;border:1px solid var(--room-popup-card-border,rgba(0,0,0,0.12));border-radius:8px;cursor:pointer;font-size:11px;font-weight:500;flex-shrink:0;color:var(--room-icon-color,#3498db);'; ab.textContent = '+ 添加'; ab.addEventListener('click', (e) => { e.stopPropagation(); this._addToPlaylist(child, cfg, state, tabIndex, playlistIndex >= 0 ? playlistIndex : 0); ab.textContent = '✓ 已添加'; ab.style.background = '#2ecc71'; ab.style.color = '#fff'; }); rw.appendChild(ab); }
    container.appendChild(rw); });
  }

  async _addToPlaylist(mediaItem, cfg, state, tabIndex, playlistIndex) {
    const tb = cfg.tabs[tabIndex]; const pl = tb?.playlists?.[playlistIndex];
    if (!pl) { this._showToast('请先选择或创建播放列表', 'warning'); return; }
    const ni = { title: mediaItem.title || '未知', artist: mediaItem.artist || '', cover: mediaItem.thumbnail || '', media_content_id: mediaItem.media_content_id || '', media_type: mediaItem.media_content_type || 'music' };
    pl.items = pl.items || []; pl.items.push(ni);
    if (pl.id) { const nid = await this._addSongToBackend(pl.id, ni); if (nid) ni.id = nid; else { pl.items.pop(); this._showToast('添加失败', 'error'); return; } }
    this._showToast('已添加「' + this._escapeHtml(ni.title) + '」', 'success');
  }

  _showPlaylistPicker(cfg, state, folderNode) {
    const tb = cfg.tabs[state.activeTabIndex]; const pls = Array.isArray(tb?.playlists) ? tb.playlists : [];
    let si = (state.activePlaylistIndex >= 0 && state.activePlaylistIndex < pls.length) ? state.activePlaylistIndex : (pls.length > 0 ? 0 : -1);
    const closePicker = this.showPopup({ content: () => {
      const c = document.createElement('div'); c.style.cssText = 'padding:16px;min-width:280px;';
      c.innerHTML = '<div style="font-size:15px;font-weight:600;color:var(--room-primary-text,#2c3e50);margin-bottom:14px;display:flex;align-items:center;gap:8px;"><ha-icon icon="mdi:playlist-plus" style="--mdc-icon-size:20px;color:var(--room-icon-color,#3498db);"></ha-icon><span>添加到播放列表</span></div>';
      pls.forEach((pl, idx) => {
        const rw = document.createElement('label'); rw.style.cssText = 'display:flex;align-items:center;gap:8px;padding:8px 10px;border-radius:8px;cursor:pointer;';
        const rd = document.createElement('input'); rd.type = 'radio'; rd.name = '_plPick'; rd.checked = idx === si;
        rd.addEventListener('change', () => { si = idx; inp.style.display = 'none'; });
        rw.appendChild(rd);
        const ns = document.createElement('span'); ns.style.cssText = 'flex:1;font-size:13px;color:var(--room-primary-text,#2c3e50);'; ns.textContent = pl.name;
        rw.appendChild(ns); c.appendChild(rw);
      });
      const inp = document.createElement('input'); inp.type = 'text'; inp.placeholder = '新建播放列表...';
      inp.style.cssText = 'width:100%;margin-top:8px;padding:8px 10px;border-radius:8px;border:1px solid var(--room-input-border,rgba(0,0,0,0.12));background:var(--room-input-bg,rgba(0,0,0,0.03));color:var(--room-input-text,#2c3e50);font-size:13px;outline:none;box-sizing:border-box;';
      inp.style.display = si === -1 ? 'block' : 'none';
      const nr = document.createElement('label'); nr.style.cssText = 'display:flex;align-items:center;gap:8px;padding:8px 10px;border-radius:8px;cursor:pointer;margin-top:6px;';
      const nrd = document.createElement('input'); nrd.type = 'radio'; nrd.name = '_plPick'; nrd.checked = si === -1;
      nrd.addEventListener('change', () => { si = -1; inp.style.display = 'block'; inp.focus(); });
      nr.appendChild(nrd); nr.appendChild(document.createTextNode('新建播放列表'));
      c.appendChild(nr); c.appendChild(inp);
      const cb = document.createElement('button');
      cb.style.cssText = 'width:100%;margin-top:12px;padding:9px 0;border:none;border-radius:10px;cursor:pointer;background:var(--room-icon-color,#3498db);color:#fff;font-size:14px;font-weight:600;';
      cb.textContent = '确认添加';
      // === 确认按钮：选择播放列表后添加文件夹内容 ===
      cb.addEventListener('click', async () => {
        const user = cfg.users?.[state.activeTabIndex];
        if (si >= 0) {
          // 选择已有播放列表 → 添加文件夹到该列表
          state.activePlaylistIndex = si;
          this._saveMediaPlayerState(state);
          closePicker();
          if (folderNode) {
            this._addFolderToPlaylist(folderNode, cfg, state, state.activeTabIndex, si);
          } else {
            this._showToast('已选择播放列表：' + this._escapeHtml(pls[si]?.name || ''), 'success');
          }
        } else {
          // 新建播放列表
          const newName = inp.value.trim();
          if (!newName) { inp.focus(); this._showToast('请输入播放列表名称', 'warning'); return; }
          cb.textContent = '创建中...'; cb.disabled = true;
          const ok = await this._savePlaylist(user, newName);
          if (!ok) { cb.textContent = '确认添加'; cb.disabled = false; this._showToast('创建失败', 'error'); return; }
          await this._refreshPlaylists(cfg, state);
          const newIdx = (cfg.tabs[state.activeTabIndex]?.playlists?.length || 0) - 1;
          if (newIdx >= 0) {
            state.activePlaylistIndex = newIdx;
            this._saveMediaPlayerState(state);
          }
          closePicker();
          if (folderNode && newIdx >= 0) {
            this._addFolderToPlaylist(folderNode, cfg, state, state.activeTabIndex, newIdx);
          } else {
            this._showToast('已创建并选择播放列表：' + newName, 'success');
          }
        }
      });
      c.appendChild(cb); return c;
    }, style: 'width:min(340px,85vw);border-radius:16px;padding:0;background:var(--room-popup-bg,rgba(255,255,255,0.98));', showOverlay: true, showBackground: true });
  }

  // 递归添加文件夹内所有歌曲到指定播放列表
  async _addFolderToPlaylist(folderNode, cfg, state, tabIndex, playlistIndex) {
    const addRecursive = async (node) => {
      if (!node) return 0;
      // 如果该节点没有 children，先加载
      if (!node.children) {
        try {
          const result = await this._browseMediaSource(node.media_content_id || '');
          if (result) node.children = result.children || [];
        } catch(e) { return 0; }
      }
      let count = 0;
      for (const child of (node.children || [])) {
        if (child.can_expand) {
          // 文件夹：递归
          count += await addRecursive(child);
        } else {
          // 文件：添加到播放列表
          const tb = cfg.tabs[tabIndex]; const pl = tb?.playlists?.[playlistIndex]; if (!pl) continue;
          const ni = { title: child.title || '未知', artist: child.artist || '', cover: child.thumbnail || '', media_content_id: child.media_content_id || '', media_type: child.media_content_type || 'music' };
          pl.items = pl.items || []; pl.items.push(ni);
          if (pl.id) { try { const nid = await this._addSongToBackend(pl.id, ni); if (nid) ni.id = nid; } catch(e) {} }
          count++;
        }
      }
      return count;
    };
    this._showToast('正在添加文件夹歌曲...', 'info');
    const added = await addRecursive(folderNode);
    if (state._popupContainer) this._rerenderCurrentView(state._popupContainer, cfg, state);
    this._showToast('已添加 ' + added + ' 首歌曲到播放列表', 'success');
  }

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

  // ========================================
  // 弹窗系统
  // ========================================
  showPopup(options) {
    const {
      content, className, style, triggerButton, width, maxWidth, minWidth,
      height, maxHeight, showOverlay, showBackground, popupPosition,
      closeOnClickAway, closeOnTargetClick, overlayBlur, onClose, animation, gap, placement
    } = options || {};

    const overlay = document.createElement('div');
    overlay.className = 'xiaoshi-popup-overlay';
    overlay.style.cssText = 'position:fixed;inset:0;z-index:99990;';
    if (showBackground) {
      overlay.style.background = overlayBlur
        ? 'radial-gradient(circle at center, rgba(0,0,0,0.15), rgba(0,0,0,0.5))'
        : 'rgba(0,0,0,0.35)';
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

    if (popupPosition === 'bottom') {
      overlay.style.alignItems = 'flex-end';
      overlay.style.paddingBottom = '20px';
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

  // ========================================
  // 气泡系统（showConversation 用）
  // ========================================
  _showBubble(options) {
    const {
      target, content, className, width, maxWidth, maxHeight,
      gap, placement, closeOnClickAway, closeOnTargetClick, showBackdrop,
      onClose, animation, clickPoint
    } = options || {};

    const overlay = document.createElement('div');
    overlay.className = 'xiaoshi-bubble-overlay';
    overlay.style.cssText = 'position:fixed;inset:0;z-index:99990;';
    if (showBackdrop) {
      overlay.style.background = 'rgba(0,0,0,0.35)';
    }

    const bubble = document.createElement('div');
    bubble.className = className || 'xiaoshi-bubble';
    bubble.style.cssText = 'position:fixed;z-index:1;border-radius:14px;box-shadow:0 8px 30px rgba(0,0,0,0.2);overflow:hidden;';
    if (width) bubble.style.width = width;
    if (maxWidth) bubble.style.maxWidth = maxWidth + 'px';
    if (maxHeight) bubble.style.maxHeight = maxHeight;

    const scrollable = document.createElement('div');
    scrollable.className = 'bubble-content-scrollable';
    scrollable.style.cssText = 'height:100%;overflow-y:auto;-webkit-overflow-scrolling:touch;';
    scrollable.appendChild(content);
    bubble.appendChild(scrollable);

    let closed = false;
    const close = () => {
      if (closed) return;
      closed = true;
      overlay.remove();
      if (onClose) onClose();
    };

    const positionBubble = () => {
      const rect = target.getBoundingClientRect();
      const bw = bubble.offsetWidth || 320;
      const bh = bubble.offsetHeight || 400;
      const g = gap || 8;
      const vw = window.innerWidth, vh = window.innerHeight;

      if (placement === 'top') {
        bubble.style.left = Math.max(8, Math.min(rect.left + rect.width / 2 - bw / 2, vw - bw - 8)) + 'px';
        bubble.style.bottom = (vh - rect.top + g) + 'px';
      } else {
        bubble.style.left = Math.max(8, Math.min(rect.left + rect.width / 2 - bw / 2, vw - bw - 8)) + 'px';
        bubble.style.top = (rect.bottom + g) + 'px';
        if (rect.bottom + g + bh > vh - 8) {
          bubble.style.top = (vh - bh - 8) + 'px';
        }
      }
    };

    overlay.appendChild(bubble);
    document.body.appendChild(overlay);

    requestAnimationFrame(() => positionBubble());

    const closeOnOuterClick = (e) => {
      if (e.target === overlay && closeOnClickAway !== false) close();
    };
    overlay.addEventListener('click', closeOnOuterClick);

    return { bubble, close, target };
  }

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

    // 模糊背景层
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

    // 进度条
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
          this._hass.callService('media_player', 'media_seek', { entity_id: cfg.mediaEntity, seek_position: targetPos }).catch((e) => {});
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
    volIcon.addEventListener('click', () => { const curVal = parseInt(volSlider.value); if (curVal > 0) { volIcon.dataset.prevVolume = String(curVal); this._setVolume(cfg.mediaEntity, 0); volSlider.value = '0'; volSlider.style.background = 'linear-gradient(to right,var(--room-icon-color,#3498db) 0%,var(--room-icon-color,#3498db) 0%,var(--room-slider-track,rgba(0,0,0,0.08)) 0%,var(--room-slider-track,rgba(0,0,0,0.08)) 100%)'; volIcon.setAttribute('icon', 'mdi:volume-off'); } else { const restore = parseInt(volIcon.dataset.prevVolume) || 30; this._setVolume(cfg.mediaEntity, restore / 100); volSlider.value = String(restore); volSlider.style.background = 'linear-gradient(to right,var(--room-icon-color,#3498db) 0%,var(--room-icon-color,#3498db) ' + restore + '%,var(--room-slider-track,rgba(0,0,0,0.08)) ' + restore + '%,var(--room-slider-track,rgba(0,0,0,0.08)) 100%)'; volIcon.setAttribute('icon', restore < 50 ? 'mdi:volume-low' : 'mdi:volume-high'); } });
    volRow.appendChild(volIcon);
    const volSlider = document.createElement('input'); volSlider.type = 'range'; volSlider.dataset.action = 'volume'; volSlider.min = '0'; volSlider.max = '100'; volSlider.value = volPct; volSlider.className = 'media-player-volume-slider'; volSlider.style.background = 'linear-gradient(to right,var(--room-icon-color,#3498db) 0%,var(--room-icon-color,#3498db) ' + volPct + '%,var(--room-slider-track,rgba(0,0,0,0.08)) ' + volPct + '%,var(--room-slider-track,rgba(0,0,0,0.08)) 100%)';
    volRow.appendChild(volSlider);
    const volLabel = document.createElement('span'); volLabel.dataset.volumeLabel = 'true'; volLabel.className = 'media-player-vol-label'; volLabel.textContent = volPct + '%'; volRow.appendChild(volLabel);
    scrollArea.appendChild(volRow); this._styleVolumeThumb(volSlider);
    scrollArea.appendChild(ctrlRow2);
    container.appendChild(scrollArea);
  }

  _createBackendButton(cfg, state) {
    const backendBtn = document.createElement('button');
    backendBtn.dataset.action = 'backend-play'; backendBtn.className = 'media-player-pill-btn';
    backendBtn.innerHTML = '<ha-icon icon="mdi:sync" style="--mdc-icon-size:14px;flex-shrink:0;"></ha-icon><span>后端列表播放</span>';
    backendBtn.addEventListener('click', async (e) => {
      e.stopPropagation();
      const entityId = cfg.mediaEntity;
      try {
        const statusUrl = this._mediaApiUrl('media/queue?entity_id=' + encodeURIComponent(entityId));
        const statusResp = await fetch(statusUrl); const statusJson = await statusResp.json();
        const queueData = statusJson?.data;
        if (queueData && queueData.is_active === 1) {
          const stopUrl = this._mediaApiUrl('media/queue?entity_id=' + encodeURIComponent(entityId));
          await fetch(stopUrl, { method: 'DELETE' });
          backendBtn.innerHTML = '<ha-icon icon="mdi:sync" style="--mdc-icon-size:14px;flex-shrink:0;"></ha-icon><span>后端列表播放</span>';
          backendBtn.style.background = 'var(--room-button-bg,rgba(0,0,0,0.05))'; backendBtn.style.color = 'var(--room-primary-text,#2c3e50)'; backendBtn.style.borderColor = 'var(--room-popup-card-border,rgba(0,0,0,0.1))';
          cfg._backendActive = false; this._showToast('后端播放已停止', 'info'); return;
        }
      } catch(e) {}
      const currentTab = cfg.tabs[state.activeTabIndex]; const plIdx = state.activePlaylistIndex >= 0 ? state.activePlaylistIndex : 0;
      const currentPl = currentTab?.playlists?.[plIdx];
      if (!currentPl || !Array.isArray(currentPl.items) || currentPl.items.length === 0) { this._showToast('请先选择有歌曲的播放列表', 'warning'); return; }
      const startIdx = state.activeItemIndex >= 0 ? state.activeItemIndex : 0;
      const startTrack = currentPl.items[startIdx];
      const entityState = this._hass?.states?.[entityId];
      const isCurrentlyPlaying = entityState?.state === 'playing';
      if (startTrack && !isCurrentlyPlaying) {
        const playUrl = startTrack.media_content_id || startTrack.url || '';
        if (playUrl) {
          this._hass.callService('media_player', 'play_media', { entity_id: entityId, media_content_id: playUrl, media_content_type: startTrack.media_type || 'music' }).catch((e) => {});
        }
      }
      const tracksSlim = currentPl.items.map(it => ({ id: it.id || null, title: it.title || '', artist: it.artist || '', album: it.album || '', media_content_id: it.media_content_id || it.url || '', media_type: it.media_type || 'music', duration: it.duration || 0, has_cover: it.has_cover || 0, has_lyrics: it.has_lyrics || 0 }));
      const startUrl = this._mediaApiUrl('media/queue');
      try {
        const startResp = await fetch(startUrl, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ entity_id: entityId, tracks: tracksSlim, current_index: startIdx, is_active: true }) });
        const startJson = await startResp.json();
        if (!startResp.ok || !startJson.success) { this._showToast('后端列表播放启动失败', 'error'); return; }
        if (startJson.success) {
          backendBtn.innerHTML = '<ha-icon icon="mdi:stop-circle-outline" style="--mdc-icon-size:14px;flex-shrink:0;"></ha-icon><span>停止后端播放</span>';
          backendBtn.style.background = '#e74c3c'; backendBtn.style.color = '#fff'; backendBtn.style.borderColor = '#e74c3c';
          cfg._backendActive = true; this._showToast('后端列表播放已启动', 'success');
        }
      } catch(fetchErr) { this._showToast('后端请求失败: ' + fetchErr.message, 'error'); }
    });
    return backendBtn;
  }

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

  _renderActivePage(viewArea, cfg, state) {
    viewArea.innerHTML = '';
    const idx = state.activePageIndex; const tab = cfg.pageTabs[idx]; if (!tab) return;
    if (tab._builtin === 'player') {
      // 弹窗仅作为播放列表管理器，不再展示内置播放器页面
      state._activeView = 'list';
      this._renderListView(viewArea, cfg, state);
    }
  }

  _switchPlayerView(viewArea, cfg, state, view) {
    state._activeView = view; viewArea.innerHTML = '';
    if (view === 'player') this._renderPlayerView(viewArea, cfg, state);
    else this._renderListView(viewArea, cfg, state);
  }

  _rerenderCurrentView(popupContainer, cfg, state) {
    if (!popupContainer) return;
    const viewArea = popupContainer.querySelector('.media-player-view-area');
    if (!viewArea) return;
    state._activeView = 'list';
    this._renderListView(viewArea, cfg, state);
    this._bindPlayerEvents(popupContainer, cfg, state);
  }

  // 参照 xiaoshi-music-card.js handlePlaylistTabSwitch：仅更新 tab 栏 + 滚动内容区
  // 避免 _renderListView 的 innerHTML='' 全量重建导致用户切换卡顿
  _updateTabContent(container, cfg, state) {
    if (!container) return;
    // 1. 替换 tab 栏（替换 DOM 以清除旧 addEventListener，避免重复绑定堆积）
    const oldTabBar = container.querySelector('.media-player-tab-bar');
    if (oldTabBar && cfg.tabs.length > 0) {
      const newTabBar = this._renderUserTabBar(cfg, state);
      oldTabBar.parentNode.replaceChild(newTabBar, oldTabBar);
    }
    // 2. 替换滚动内容区（只重建播放列表部分，顶部栏/操作按钮保持不变）
    // 通过 viewArea > wrap 结构定位 scrollArea：wrap 最后一个子元素即为滚动内容区
    const viewArea = container.querySelector('.media-player-view-area');
    let scrollArea = null;
    if (viewArea) {
      // viewArea 内结构: [bg(absolute), wrap(relative)] → wrap 的最后一个子元素
      const wrap = viewArea.querySelector(':scope > div[style*="flex-direction:column"]') || viewArea.lastElementChild;
      if (wrap) {
        scrollArea = wrap.lastElementChild;
        // 兜底验证：确实是 overflow-y:auto 的滚动容器
        if (scrollArea && scrollArea.style.overflowY !== 'auto' && scrollArea.style.overflow !== 'auto') {
          scrollArea = null;
          // 遍历查找（兼容浏览器对 flex:1 的简写展开）
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
        emptyDiv.style.cssText = 'text-align:center;padding:40px 0;color:var(--room-secondary-text,#999);font-size:13px;';
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
    // 3. 重新绑定事件（新 DOM 元素需要事件监听器）
    this._bindPlayerEvents(container, cfg, state);
  }

  _renderPlayerTopBar(cfg, state) {
    const entityState = this._hass?.states?.[cfg.mediaEntity];
    const deviceName = cfg.name || entityState?.attributes?.friendly_name || '媒体播放器';
    const bar = document.createElement('div'); bar.className = 'media-player-top-bar';
    const title = document.createElement('div'); title.className = 'media-player-top-bar-title'; title.textContent = this._escapeHtml(deviceName);
    bar.appendChild(title); return bar;
  }

  _renderBottomTabBar(cfg, state) {
    const bar = document.createElement('div'); bar.className = 'media-player-bottom-bar';
    cfg.pageTabs.forEach((p, idx) => {
      const isActive = state.activePageIndex === idx;
      const tab = document.createElement('button'); tab.className = 'media-player-page-tab'; tab.dataset.page = idx;
      tab.style.cssText = 'display:flex;flex-direction:column;align-items:center;gap:3px;padding:6px 16px;border:none;background:transparent;cursor:pointer;flex-shrink:0;min-width:64px;';
      tab.innerHTML = '<ha-icon icon="' + (p.icon || 'mdi:view-dashboard-outline') + '" style="--mdc-icon-size:22px;color:' + (isActive ? 'var(--room-icon-color,#3498db)' : 'var(--room-secondary-text,#999)') + ';"></ha-icon><span style="font-size:10px;color:' + (isActive ? 'var(--room-primary-text,#2c3e50)' : 'var(--room-secondary-text,#999)') + ';font-weight:' + (isActive ? '600' : '400') + ';white-space:nowrap;">' + this._escapeHtml(p.name) + '</span>' + (isActive ? '<span style="position:absolute;top:3px;width:4px;height:4px;border-radius:50%;background:var(--room-icon-color,#3498db);"></span>' : '');
      bar.appendChild(tab);
    });
    return bar;
  }

  _renderUserTabBar(cfg, state) {
    const bar = document.createElement('div'); bar.className = 'media-player-tab-bar';
    bar.style.cssText = 'display:flex;justify-content:space-around;gap:0;padding:0 16px;border-bottom:1px solid var(--room-popup-divider,rgba(0,0,0,0.06));overflow-x:auto;flex-shrink:0;scrollbar-width:none;';
    cfg.tabs.forEach((tab, idx) => {
      const btn = document.createElement('button'); btn.className = 'media-player-tab-btn'; btn.dataset.tabIndex = idx;
      const isActive = idx === state.activeTabIndex;
      btn.style.cssText = 'display:flex;align-items:center;justify-content:center;gap:5px;padding:10px 16px;border:none;cursor:pointer;font-size:13px;font-weight:' + (isActive ? '600' : '400') + ';color:' + (isActive ? 'var(--room-icon-color,#3498db)' : 'var(--room-secondary-text,#999)') + ';background:transparent;white-space:nowrap;flex-shrink:0;';
      if (tab.icon) { const icon = document.createElement('ha-icon'); icon.setAttribute('icon', tab.icon); icon.style.cssText = '--mdc-icon-size:16px;'; btn.appendChild(icon); }
      const nameSpan = document.createElement('span'); nameSpan.textContent = this._escapeHtml(tab.name || 'Tab ' + (idx + 1)); btn.appendChild(nameSpan);
      bar.appendChild(btn);
    });
    return bar;
  }

  _renderListView(container, cfg, state) {
    // 参照 xiaoshi-music-card.js 的 lit-html 行为：每次渲染前清空容器，避免 append 堆积导致重复弹窗
    container.innerHTML = '';
    const bg = document.createElement('div'); bg.style.cssText = 'position:absolute;inset:0;z-index:0;background:var(--room-popup-bg,rgba(255,255,255,0.98));backdrop-filter:blur(20px);-webkit-backdrop-filter:blur(20px);pointer-events:none;';
    container.appendChild(bg);
    const wrap = document.createElement('div'); wrap.style.cssText = 'position:relative;z-index:1;display:flex;flex-direction:column;height:100%;';
    // ===== 顶部栏：简化 — 仅标题 =====
    const topRow = document.createElement('div'); topRow.style.cssText = 'display:flex;align-items:center;padding:12px 16px;flex-shrink:0;';
    const titleEl = document.createElement('div'); titleEl.style.cssText = 'flex:1;text-align:center;font-size:15px;font-weight:600;color:var(--room-primary-text,#2c3e50);'; titleEl.textContent = '本地音乐'; topRow.appendChild(titleEl);
    wrap.appendChild(topRow);
    // 滚动内容区
    const scrollArea = document.createElement('div'); scrollArea.style.cssText = 'flex:1;overflow-y:auto;padding:4px 16px 24px;-webkit-overflow-scrolling:touch;min-height:0;';
    const currentTab = cfg.tabs[state.activeTabIndex]; const playlists = Array.isArray(currentTab?.playlists) ? currentTab.playlists : [];
    if (playlists.length === 0) { const emptyDiv = document.createElement('div'); emptyDiv.style.cssText = 'text-align:center;padding:40px 0;color:var(--room-secondary-text,#999);font-size:13px;'; emptyDiv.textContent = '暂无音乐'; scrollArea.appendChild(emptyDiv); }
    else { const listWrap = document.createElement('div'); listWrap.className = 'pl-list-wrap'; listWrap.style.cssText = ''; playlists.forEach((pl, plIdx) => { this._renderPlaylistItem(listWrap, pl, plIdx, cfg, state, container); }); scrollArea.appendChild(listWrap); }
    wrap.appendChild(scrollArea); container.appendChild(wrap);
  }

  _renderPlaylistItem(container, pl, plIdx, cfg, state, popupContainer) {
    const items = Array.isArray(pl.items) ? pl.items : [];
    const card = document.createElement('div'); card.className = 'media-player-playlist-header'; card.dataset.playlistIndex = plIdx; card.style.cursor = 'pointer'; card.style.userSelect = 'none';
    card.addEventListener('click', (e) => { if (e.target.closest('button') || e.target.closest('.media-player-item')) return; const newIdx = plIdx === state.activePlaylistIndex ? -1 : plIdx; state.activePlaylistIndex = newIdx; state.activeItemIndex = -1; this._saveMediaPlayerState(state); if (state._popupContainer) { this._rerenderCurrentView(state._popupContainer, cfg, state); if (this.requestUpdate) this.requestUpdate(); } });
    const header = document.createElement('div'); header.style.cssText = 'display:flex;align-items:center;gap:8px;padding:10px 8px;border-radius:10px;cursor:pointer;';
    const isPlayingPlaylist = plIdx === state.activePlaylistIndex && state.activeItemIndex >= 0;
    const icon = document.createElement('ha-icon'); icon.setAttribute('icon', pl.icon || 'mdi:playlist-music'); icon.style.cssText = '--mdc-icon-size:18px;color:' + (isPlayingPlaylist ? 'var(--room-icon-color,#3498db)' : 'var(--room-icon-color,#555)') + ';flex-shrink:0;'; header.appendChild(icon);
    const nameEl = document.createElement('span'); nameEl.style.cssText = 'flex:1;font-size:13px;font-weight:600;color:var(--room-primary-text,#2c3e50);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;'; nameEl.textContent = this._escapeHtml(pl.name || '列表 ' + (plIdx + 1)); header.appendChild(nameEl);
    const countEl = document.createElement('span'); countEl.style.cssText = 'font-size:11px;color:var(--room-secondary-text,#999);flex-shrink:0;'; countEl.textContent = (items.length || 0) + ' 首'; header.appendChild(countEl);


    // 播放全部按钮
    const playAllBtn = document.createElement('button');
    playAllBtn.title = '播放全部';
    playAllBtn.style.cssText = 'display:flex;align-items:center;gap:3px;padding:4px 10px;border:1px solid var(--room-popup-card-border,rgba(0,0,0,0.12));border-radius:6px;cursor:pointer;background:transparent;color:var(--room-icon-color,#3498db);font-size:11px;font-weight:500;flex-shrink:0;margin-left:4px;';
    playAllBtn.innerHTML = '<ha-icon icon="mdi:play" style="--mdc-icon-size:12px;flex-shrink:0;"></ha-icon>播放列表';
    playAllBtn.addEventListener('click', (e) => { e.stopPropagation(); if (items.length > 0) { state.activeItemIndex = 0; this._playMediaItem(items[0], cfg, state, this.shadowRoot?.querySelector('.media-player-popup')); } });
    header.appendChild(playAllBtn);
    card.appendChild(header);

    if (plIdx === state.activePlaylistIndex && items.length > 0) {
      // 直接渲染歌曲列表，不重复显示文件夹信息

      // ===== 歌曲列表 =====
      const itemsWrap = document.createElement('div');
      itemsWrap.style.cssText = 'padding:0 0 6px;';
      items.forEach((item, iIdx) => {
        const isCurrent = iIdx === state.activeItemIndex;
        const itemEl = document.createElement('div');
        itemEl.className = 'media-player-item';
        itemEl.dataset.itemIndex = iIdx;
        itemEl.style.cssText = 'display:flex;align-items:center;gap:8px;padding:8px 12px 8px 20px;cursor:pointer;border-radius:8px;transition:background 0.15s;';
        itemEl.addEventListener('click', (e) => { e.stopPropagation(); state.activeItemIndex = iIdx; this._playMediaItem(item, cfg, state, this.shadowRoot?.querySelector('.media-player-popup')); });
        // 序号
        const idxSpan = document.createElement('span');
        idxSpan.style.cssText = 'font-size:11px;color:var(--room-secondary-text,#ccc);min-width:16px;flex-shrink:0;';
        idxSpan.textContent = (iIdx + 1);
        itemEl.appendChild(idxSpan);
        // 标题+歌手
        const infoDiv = document.createElement('div');
        infoDiv.style.cssText = 'flex:1;overflow:hidden;min-width:0;';
        const titleDiv = document.createElement('div');
        titleDiv.style.cssText = 'font-size:12px;color:var(--room-primary-text,#2c3e50);font-weight:' + (isCurrent ? '600' : '400') + ';white-space:nowrap;overflow:hidden;text-overflow:ellipsis;';
        titleDiv.textContent = item.title || '未知曲目';
        infoDiv.appendChild(titleDiv);
        const artistDiv = document.createElement('div');
        artistDiv.style.cssText = 'font-size:10px;color:var(--room-secondary-text,#999);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;';
        artistDiv.textContent = item.artist || '';
        infoDiv.appendChild(artistDiv);
        itemEl.appendChild(infoDiv);
        // 元数据标签（LRC / COVER，参照 xiaoshi-music-card）
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
        // 时长
        const durSpan = document.createElement('span');
        durSpan.style.cssText = 'font-size:10px;color:var(--room-secondary-text,#999);flex-shrink:0;';
        durSpan.textContent = item.duration ? this._formatMediaTime(item.duration) : '';
        itemEl.appendChild(durSpan);
        itemsWrap.appendChild(itemEl);
      });
      card.appendChild(itemsWrap);
    } else if (plIdx === state.activePlaylistIndex && items.length === 0) {
      // 展开的空列表：提示添加
      const emptyTip = document.createElement('div');
      emptyTip.style.cssText = 'padding:14px 12px 6px 24px;font-size:11px;color:var(--room-secondary-text,#999);';
      emptyTip.textContent = '列表为空，点击右上角 🎵 从媒体库添加';
      card.appendChild(emptyTip);
    }
    container.appendChild(card);
  }

  // ========================================
  // API URL 构建（已弃用，本地音乐改为读取配置文件）
  // ========================================
  _mediaApiUrl(path) {
    try { const base = (this._config?.api_base_url || '/api/ha_data_store/').replace(/\/+$/, '') + '/'; const k = this._config?.key || ''; return `${base}${path}${path.includes('?') ? '&' : '?'}key=${encodeURIComponent(k)}`; } catch(e) { return ''; }
  }

  // ========================================
  // 小爱语音 — 微信风格对话历史
  // ========================================

  _getCurrentUserAvatar() {
    const uid = this._hass?.user?.id; if (!uid) return null;
    for (const eid in (this._hass?.states || {})) { if (!eid.startsWith('person.')) continue; const s = this._hass.states[eid]; if (s?.attributes?.user_id === uid) return s?.attributes?.entity_picture || null; }
    return null;
  }

  _conversationApiUrl(entityId, startDate, endDate) {
    const base = (this._config?.api_base_url || '/api/ha_data_store/').replace(/\/+$/, '') + '/';
    const k = this._config?.key || '';
    return base + 'query?' + new URLSearchParams({ type: 'xiaoai_history', key: k, entity_id: entityId, start: startDate, end: endDate }).toString();
  }

  async _fetchConversationData(entityId, startDate, endDate) {
    try { const r = await fetch(this._conversationApiUrl(entityId, startDate, endDate)); if (!r.ok) return { success: false, error: 'HTTP ' + r.status }; const j = await r.json(); if (!j.success) return { success: false, error: j.message || '失败' }; return { success: true, rows: j.data?.rows || [] }; } catch(e) { return { success: false, error: e.message }; }
  }

  // 主入口：从"小爱语音"按钮点击触发
  showXiaoaiConversation(button) {
    const entityId = this.conversationEntity || this.textDirectiveEntity;
    if (!entityId) { this._showToast('请配置 conversation', 'warning'); return; }

    const cardConfig = {
      entity: entityId,
      name: this._hass?.states[entityId]?.attributes?.friendly_name || 'miot集成播放控制',
      conversation_page_days: 7,
      conversation_max_height: '65vh',
      conversation_width: '90%',
      // 输入框：复用 execute_text_directive 发指令，配置 play_text 则增加播报按钮
      command_entity: this.textDirectiveEntity || '',
      play_text: this._config?.play_text || '',
      quick_input: this._quickInput || [],
    };
    this._showConversationBubble(button, cardConfig, null);
  }

  _showConversationBubble(targetEl, cardConfig, clickPoint) {
    // 二次点击同一按钮 → 关闭
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

    // 构建完整的对话容器（含标题 / 列表 / 输入框）
    const container = document.createElement('div'); container.className = 'conversation-bubble-content';
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

    // === 输入框事件绑定 ===
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

    // 发送指令：优先用 command_entity，回退到 execute_text_directive
    const sendCommand = async (overrideText) => {
      const text = (typeof overrideText === 'string' ? overrideText : (inputEl.value || '')).trim();
      if (!text) return;
      sendBtn.innerHTML = loadingIconHtml;
      let targetEntity = commandEntity;
      if (!targetEntity) targetEntity = this.textDirectiveEntity || '';
      try {
        if (!targetEntity) { this._showToast('请先配置 execute_text_directive 或 command_entity', 'warning'); return; }
        await this._hass.callService('text', 'set_value', { entity_id: targetEntity, value: text });
        appendLocalUserMessage(text);
        if (inputEl) inputEl.value = '';
        this._timers.setTimeout(() => { state2.allRows = []; state2.noMore = false; state2.startDate = null; state2.endDate = null; this._loadInitialConversation(state2, state2.scrollEl); }, 3000);
        this._saveConversationRecord(entityId, text, 'command');
      } catch(e) {
      } finally { sendBtn.innerHTML = sendIconHtml; updateBtnState(); if (inputEl) inputEl.focus(); }
    };

    // 播报文本：优先用 play_text，回退到 execute_text_directive
    const sendPlayText = async (overrideText) => {
      const text = (typeof overrideText === 'string' ? overrideText : (inputEl.value || '')).trim();
      if (!text) return;
      playBtn.innerHTML = loadingIconHtml;
      let targetEntity = playTextEntity;
      if (!targetEntity) targetEntity = this.textDirectiveEntity || '';
      try {
        if (!targetEntity) { this._showToast('请先配置播报实体或文本发送实体', 'warning'); return; }
        await this._hass.callService('text', 'set_value', { entity_id: targetEntity, value: text });
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

    // 快捷输入面板：始终显示，无配置时显示提示
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

    // 弹窗
    const closePopup = this.showPopup({
      content: () => container,
      className: 'conversation-bubble',
      style: 'background:var(--room-popup-bg,rgba(255,255,255,0.98));border-radius:14px;overflow:hidden;display:flex;flex-direction:column;width:' + width + ';max-width:500px;height:' + maxHeight + ';max-height:min(700px,88vh);',
      showOverlay: true, showBackground: true,
      onClose: () => { if (this._currentConversationBubbleRef?._targetEl === targetEl) this._currentConversationBubbleRef = null; }
    });
    closePopup._targetEl = targetEl;
    this._currentConversationBubbleRef = closePopup;

    // 滚动加载更多
    const scrollEl = container.querySelector('.conv-list');
    state2.scrollEl = scrollEl;
    if (scrollEl) { scrollEl.addEventListener('scroll', () => { if (scrollEl.scrollTop < 50 && !state2.loading && !state2.noMore) this._loadMoreConversation(state2, scrollEl); }); }
    this._loadInitialConversation(state2, scrollEl);
  }

  async _loadInitialConversation(state2, scrollEl) {
    const today = new Date(); const te = this._formatConvDate(today); const ss = this._formatConvDate(new Date(today.getTime() - state2.pageDays * 86400000)); state2.endDate = te; state2.startDate = ss;
    const le = state2.container.querySelector('.conv-list'); const ee = state2.container.querySelector('.conv-error'); state2.container.querySelector('.conv-loading-top').style.display = '';
    const result = await this._fetchConversationData(state2.entityId, ss, te); state2.container.querySelector('.conv-loading-top').style.display = 'none';
    if (!result.success) { ee.style.display = ''; ee.querySelector('.conv-error-text').textContent = '加载失败：' + result.error; ee.querySelector('.conv-retry-btn').onclick = () => { ee.style.display = 'none'; le.innerHTML = ''; this._loadInitialConversation(state2, scrollEl); }; return; }
    if (result.rows.length === 0) { state2.noMore = true; le.innerHTML = '<div class="conv-empty"><ha-icon icon="mdi:chat-outline"></ha-icon><span>暂无对话记录</span></div>'; return; }
    state2.allRows = result.rows.slice().sort((a, b) => (a.conv_time || '').localeCompare(b.conv_time || '')); this._renderConversationList(state2, le);
    if (scrollEl) requestAnimationFrame(() => { scrollEl.scrollTop = scrollEl.scrollHeight; });
  }

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

  // 写入单条对话记录到后端
  async _saveConversationRecord(entityId, userText, recordType) {
    const base = (this._config?.api_base_url || '/api/ha_data_store/').replace(/\/+$/, '') + '/';
    const k = this._config?.key || '';
    const url = `${base}xiaoai/record?key=${encodeURIComponent(k)}`;
    const now = new Date();
    const pad = (n) => String(n).padStart(2, '0');
    const convTime = `${now.getFullYear()}-${pad(now.getMonth()+1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
    try {
      const ho = { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ entity_id: entityId, user_text: userText, type: recordType, conv_time: convTime }) };
      try { const ao = new URL(url, window.location.href).origin; if (ao === window.location.origin && this._hass?.auth?.data?.access_token) ho.headers.Authorization = `Bearer ${this._hass.auth.data.access_token}`; } catch(_) {}
      const r = await fetch(url, ho);
      return r.ok && (await r.json()).success;
    } catch(e) { return false; }
  }

  _formatConvDate(d) { return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); }
  _formatConvTimeDisplay(ct) { return ct || ''; }
  _parseAlarmTimeFromText(text) { if (!text) return null; const m = text.match(/(上午|下午|中午|凌晨|清晨|早上|晚上|傍晚|夜里)?\s*(\d{1,2})\s*[点时](?:\s*(\d{1,2})\s*分|半)?/); if (!m) return null; const period = m[1] || ''; let h = parseInt(m[2], 10); if (isNaN(h)) return null; let min = 0; if (m[3] !== undefined) { min = parseInt(m[3], 10); if (isNaN(min)) return null; } else if (/半/.test(m[0])) min = 30; if (['下午','晚上','傍晚','夜里'].includes(period) && h < 12) h += 12; return { hour: h, minute: min }; }
  _formatAlarmTime(al) { return al ? String(al.hour).padStart(2, '0') + ':' + String(al.minute).padStart(2, '0') : ''; }

  // ════════════════════════════════════════════
  // Music Assistant 集成 — MA WebSocket 连接
  // ════════════════════════════════════════════

  async _connectMaWs() {
    if (!this.maServerUrl || !this.maServerToken) return;
    if (this._maWs && this._maWsConnected) return;
    if (this._maWs && this._maWs.readyState === WebSocket.CLOSING) return;
    const wsUrl = this.maServerUrl.replace(/^http/, 'ws') + '/ws';
    if (this._maWs) { this._maWs.onclose = null; this._maWs.close(); this._maWs = null; }
    try {
      this._maWs = new WebSocket(wsUrl);
      this._maWs._msgId = 0;
      this._maWs._pending = {};
      this._maWs.onopen = () => { this._maAuthMsgId = this._maWsSend('auth', { token: this.maServerToken }); };
      this._maWs.onmessage = (event) => { try { this._handleMaWsMessage(JSON.parse(event.data)); } catch(e) {} };
      this._maWs.onerror = () => { this._maWsConnected = false; };
      this._maWs.onclose = () => {
        this._maWsConnected = false; this._stopMaWsHeartbeat();
        this._maTrackName = ''; this._maTrackArtist = ''; this._maCoverUrl = '';
        this._maDuration = 0; this._maElapsedTime = 0;
        this._maCurrentItem = null; this._maQueueState = '';
        this.requestUpdate(); setTimeout(() => this._connectMaWs(), 5000);
      };
    } catch(e) {}
  }

  _maWsSend(command, args = {}) {
    if (!this._maWs || this._maWs.readyState !== WebSocket.OPEN) return null;
    const msgId = ++this._maWs._msgId;
    this._maWs.send(JSON.stringify({ command, message_id: msgId, args }));
    return msgId;
  }

  _maWsSendAndWait(command, args) {
    return new Promise((resolve, reject) => {
      const msgId = this._maWsSend(command, args);
      if (!msgId) { reject(new Error('WS未连接')); return; }
      const t = setTimeout(() => { delete this._maWs._pending[msgId]; reject(new Error('超时')); }, 15000);
      this._maWs._pending[msgId] = { resolve: (d) => { clearTimeout(t); resolve(d); }, reject: (e) => { clearTimeout(t); reject(e); } };
    });
  }

  _handleMaWsMessage(msg) {
    if (this._maAuthMsgId && msg.message_id === this._maAuthMsgId) {
      if (!msg.error) { this._maWsConnected = true; this._maWsSend('subscribe_events', {}); this._subscribeMaQueue(); }
      else { this._maWsConnected = false; }
      this._maAuthMsgId = null; return;
    }
    if (msg.type === 'server_info') return;
    if (msg.message_id) {
      const pending = this._maWs?._pending?.[msg.message_id];
      if (pending) {
        if (msg.error || msg.type === 'error' || msg.error_code) pending.reject(msg.error || {});
        else pending.resolve(msg.result !== undefined ? msg.result : msg);
        delete this._maWs._pending[msg.message_id];
        this._handleMaWsResult(msg); return;
      }
    }
    if (msg.message_id && msg.result !== undefined) { this._handleMaWsResult(msg); return; }
    if (msg.type === 'error') return;
    if (msg.event) {
      if (!this._maWsConnected) { this._maWsConnected = true; this._maAuthMsgId = null; this._maWsSend('subscribe_events', {}); this._subscribeMaQueue(); }
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
          if (typeof msg.data.state === 'string') this._maQueueState = msg.data.state === 'playing' ? 'playing' : 'paused';
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

  _subscribeMaQueue() {
    if (!this._maWsConnected) return;
    const playerEntity = this.maPlayerEntity;
    if (!playerEntity) return;
    const msgId = this._maWsSend('players/get_all');
    if (msgId && this._maWs) {
      this._maWs._pending[msgId] = {
        resolve: (players) => {
          const entityId = playerEntity.replace(/^media_player\./, '');
          let matchedPlayer = null;
          if (Array.isArray(players)) {
            matchedPlayer = players.find(p => p.player_id === entityId);
            if (!matchedPlayer) {
              matchedPlayer = players.find(p =>
                p.player_id === entityId ||
                p.name === entityId ||
                p.name?.replace(/[\s_]/g, '_') === entityId ||
                p.player_id?.endsWith(entityId)
              );
            }
          }
          if (matchedPlayer) {
            this._maPlayerId = matchedPlayer.player_id;
            this._maQueueId = matchedPlayer.player_id;
          } else {
            this._maPlayerId = entityId;
            this._maQueueId = entityId;
          }
          this._maWsSend('player_queues/get', { queue_id: this._maQueueId });
          this._startMaWsHeartbeat();
        },
        reject: (err) => {
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

  /** 自动发现内部 HA Music Assistant 加载项生成的播放器实体 */
  _findInternalMaPlayerEntity() {
    if (!this._hass || !this._hass.states) return '';
    const states = this._hass.states;
    // 优先级1: 手动配置的 ma_internal_player_entity
    const manualCfg = this._config?.ma_internal_player_entity || '';
    if (manualCfg && states[manualCfg]) return manualCfg;
    // 优先级2: 扫描所有 media_player 实体，查找 MA 特征
    const candidates = [];
    for (const entityId of Object.keys(states)) {
      if (!entityId.startsWith('media_player.')) continue;
      const attr = states[entityId]?.attributes || {};
      const eidLower = entityId.toLowerCase();
      // 特征检测：entity_id 包含 MA 关键词，或属性包含 mass_player_id / provider
      if (eidLower.includes('mass_') || eidLower.includes('ma_') || eidLower.includes('music_assistant')) {
        candidates.push({ entityId, score: 90, source: 'entity_id_pattern' });
      } else if (attr.mass_player_id) {
        candidates.push({ entityId, score: 85, source: 'mass_player_id_attr' });
      } else if (attr.provider && typeof attr.provider === 'string' && attr.provider.length > 0) {
        candidates.push({ entityId, score: 50, source: 'provider_attr' });
      }
    }
    // 分数最高的优先
    candidates.sort((a, b) => b.score - a.score);
    if (candidates.length > 0) {
      return candidates[0].entityId;
    }
    return '';
  }

  /** 获取用于 HA music_assistant 服务调用的播放器实体 */
  _getMaPlayTarget() {
    if (this._internalMaPlayerEntity && this._hass?.states?.[this._internalMaPlayerEntity]) {
      return this._internalMaPlayerEntity;
    }
    // 重新检测
    this._internalMaPlayerEntity = this._findInternalMaPlayerEntity();
    return this._internalMaPlayerEntity || '';
  }

  _handleMaWsResult(msg) {
    const result = msg.result;
    if (!result) return;
    // heartbeat 响应 — 仅保活
    if (result.version || result.name || result.schema_version) return;
    // players/get_all 兜底
    if (Array.isArray(result) && result.length > 0 && result[0]?.player_id) {
      if (!this._maPlayerId) {
        const playerEntity = this.maPlayerEntity || this.xiaomiMiotEntity || this.xiaomiHomeEntity;
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
    // player_queues/get 结果 → 识别 PlayerQueue 对象
    if (result.queue_id) {
      if (result.current_item) this._handleMaQueueData(result);
      else { this._maQueueId = result.queue_id; if (result.state === 'idle' || result.state === 'paused') this._maQueueState = result.state; }
      return;
    }
    // playlists 结果兜底（由 pending 处理，此处仅兜底）
    if (Array.isArray(result) && result.length > 0 && result[0]?.item_id && !result[0]?.player_id && !result[0]?.queue_item_id) return;
    if (Array.isArray(result) && result.length > 0 && result[0]?.uri && result[0]?.name && !result[0]?.queue_item_id && !result[0]?.player_id) return;
  }

  async _handleMaQueueData(queueData) {
    const currentItem = queueData.current_item;
    if (!currentItem) { this.isPlaying = false; this.requestUpdate(); return; }
    this._maCurrentItem = currentItem;
    this._maQueueState = queueData.state || '';
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

    // 同步到 MA 通道 lastSong，避免 hass setter 重复触发
    if (trackName && songChanged) {
      this._maLastSongTitle = trackName;
      this._maLastSongArtist = trackArtist || '';
      this._ncmCoverUrl = '';
      this._ncmSongId = 0;
      this._ncmLyricsOk = false;
    }

    // ===== 歌词获取 =====
    if (songChanged && currentItem.media_item) {
      this._fetchMaLyrics(currentItem.media_item);
    } else if (songChanged && currentItem.name) {
      if (this.neteaseApiUrl) {
        this.fetchNcmCoverAndLyrics(trackName, trackArtist);
      }
    }

    // 歌曲变化时重新初始化进度平滑
    if (songChanged && this.isPlaying) {
      this.initSmoothTimeOnce();
      this.stopSmoothTimer();
      this.startSmoothProgressTimer();
    }

    // ===== 来源特定增强（参照 xiaoshi-music-card.js）=====
    // 仅在歌曲变化时检测来源并应用 UI 覆盖层。
    // ── 三通道：所有 overlay 写入 MA 通道（板块3：网易推荐/QQ音乐）──
    if (songChanged) {
      const source = this._detectActiveSource(this._getPrimaryState());
      // 三通道隔离：仅当 MIoT/LOCAL 没有真正活跃时才允许 MA 接管。
      // MIoT 手动切换后 _miotOverlay.title 可能为空（等待 HA 实体返回真实标题），
      // 但只要 _activeChannel === 'miot' 且 overlay 是 active 的，就不允许 MA 抢占。
      const miotActuallyActive = this._activeChannel === 'miot' && this._miotOverlay.active;
      const localActuallyActive = this._activeChannel === 'local' && this._localOverlay.active && this._localOverlay.title;
      if (!miotActuallyActive && !localActuallyActive) {
        this._setChannel('ma');
      }

      if (source === 'netease') {
        // 网易推荐：完全委托给 _applyNeteaseOverlay（localStorage → 后端 → NCM 三阶段恢复）
        this._maOverlay.source = 'netease';
        this._maOverlay.active = true;
        this._activeOverlaySource = 'netease';
        this._overlayLyrics = [];
        try { localStorage.setItem(this._getLastSourceKey(), 'netease'); } catch(e) {}
        await this._applyNeteaseOverlay();
        // 上报：只用 NCM 确认的数据
        this._reportNowPlayingData({
          title: this._overlayTitle || '',
          artist: this._overlayArtist || '',
          cover_url: this._overlayCoverUrl || '',
          source: 'netease'
        }, 'ma');
      } else if (source === 'local') {
        // 本地音乐：走 LOCAL 通道
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
        // 委托给 _applyLocalMusicOverlay
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
        // QQ音乐：直接用 MA WS 数据
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
        // MA 搜索
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
        // 修复：_applyMASearchOverlay 未覆盖时，回退使用 MA WS 数据（避免封面丢失）
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
        // 未知来源：不清除 MA WS 数据，而是保留并回退到 MA WS 数据
        // 修复：避免来源检测失败时清空正确的标题/封面，导致显示错误
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

    // ── 非歌曲变化时同步 MA WS 封面到 overlay（解决后续推送封面时 overlay 不更新的问题）──
    // 参照 xiaoshi-music-card.js：MA WS 可能会在歌曲不变时推送新的封面数据（如图片延迟加载）
    if (!songChanged && this._maCoverUrl && this._maOverlay.source && this._maOverlay.active) {
      if (this._maCoverUrl !== this._maOverlay.coverUrl) {
        this._maOverlay.coverUrl = this._maCoverUrl;
      }
    }

    this.requestUpdate();
  }

  _handleMaQueueEvent(dataOrObjectId) {
    const qid = typeof dataOrObjectId === 'string' ? dataOrObjectId : dataOrObjectId?.queue_id || this._maQueueId;
    if (qid) this._maWsSend('player_queues/get', { queue_id: qid });
  }

  _startMaWsHeartbeat() { if (!this._maWsHeartbeatInterval) this._maWsHeartbeatInterval = setInterval(() => { if (this._maWs && this._maWs.readyState === WebSocket.OPEN) this._maWsSend('get_server_info'); else this._stopMaWsHeartbeat(); }, 30000); }
  _stopMaWsHeartbeat() { if (this._maWsHeartbeatInterval) { clearInterval(this._maWsHeartbeatInterval); this._maWsHeartbeatInterval = null; } }

  _fetchMaLyrics(mediaItem) {
    if (!this._maWsConnected) return;
    const msgId = this._maWsSend('metadata/get_track_lyrics', { track: mediaItem });
    if (msgId && this._maWs) {
      this._maWs._pending[msgId] = {
        resolve: (result) => {
          const lrc = result?.[1] || result?.[0] || '';
          if (lrc && lrc.trim()) { this.lyrics = this.parseLyrics(lrc); this._maLyrics = this.lyrics; if (this.isPlaying && this.smoothCurrentTime > 0) { this.updateCurrentLyricIndex(this.smoothCurrentTime); this.startLyricsTimer(); } this.requestUpdate(); }
          else {
            const title = mediaItem.name || '';
            const artist = (mediaItem.artists || []).map(a => a.name).join('/');
            if (this.neteaseApiUrl && title) this.fetchNcmCoverAndLyrics(title, artist);
          }
        },
        reject: () => {
          const title = mediaItem?.name || '';
          const artist = (mediaItem?.artists || []).map(a => a.name).join('/');
          if (this.neteaseApiUrl && title) this.fetchNcmCoverAndLyrics(title, artist);
        }
      };
    }
  }

  // ════════════════════════════════════════════
  // Music Assistant — 来源检测 + 覆盖层
  // ════════════════════════════════════════════

  _isMaSourceActive() {
    // ── 三通道：检查 MA 通道是否活跃 ──
    const maSource = this._maOverlay?.source || '';
    if (!['netease','qqmusic','local','ma_search'].includes(maSource)) return false;
    // ── 关键：必须 MA overlay 标记为 active，否则 LOCAL/MIoT 通道活跃时
    //        MA 实体被暂停但 source 残留，会误判为 MA 仍活跃 ──
    if (!this._maOverlay?.active) return false;
    // ── 修复：优先直接检查 MA 播放器实体状态 ──
    // 板块3 使用的是 Music Assistant 独立实体（ma_player_entity），
    // 与板块1/2 使用的 Xiaomi MIoT 实体完全独立，毫无关系。
    // 必须先检查 MA 实体，否则下面的 _getPrimaryState() 可能返回 Xiaomi 实体（idle）
    if (this.maPlayerEntity && this._hass?.states[this.maPlayerEntity]) {
      const maSt = this._hass.states[this.maPlayerEntity];
      if (['playing','Playing','paused','Paused'].includes(maSt.state)) return true;
    }
    // 回退：通过主实体（可能是 Xiaomi 实体承载 MA 播放流）验证 content_id
    const st = this._getPrimaryState();
    if (st && ['playing','Playing'].includes(st.state)) {
      const cid = (st.attributes?.media_content_id || '').toLowerCase();
      const ct = (st.attributes?.media_content_type || '').toLowerCase();
      if (!/music_assistant|mass:\/\/|mass\//.test(cid) && !/music_assistant|mass:/.test(ct)) return false;
    }
    return true;
  }

  _getPrimaryState() {
    const h = this._hass; if (!h) return null;
    // ── MA 通道活跃时：优先从 MA 播放器实体获取状态（板块3 不与 MIoT 实体混淆）──
    // 修复：_isMaSourceActive() 需要通过 MA 实体状态来正确判断 MA 通道是否活跃
    //       否则 _getPrimaryState() 只返回 Xiaomi 实体（idle），导致 MA 通道误判为非活跃
    if (this._maOverlay?.source && this._maOverlay?.active && this.maPlayerEntity && h.states[this.maPlayerEntity]) {
      return h.states[this.maPlayerEntity];
    }
    if (this.xiaomiHomeEntity && h.states[this.xiaomiHomeEntity]) return h.states[this.xiaomiHomeEntity];
    if (this.xiaomiMiotEntity && h.states[this.xiaomiMiotEntity]) return h.states[this.xiaomiMiotEntity];
    // 兜底：检查 MA 播放器实体（即使 overlay 未标记活跃，MA WS 可能正在推送数据）
    if (this.maPlayerEntity && h.states[this.maPlayerEntity]) return h.states[this.maPlayerEntity];
    return null;
  }

  _detectActiveSource(state) {
    const maSource = this._maOverlay?.source || '';
    // ── 三通道关键修复：MA overlay 已标记来源时直接返回 ──
    // 板块3使用独立 MA 实体，HA 实体的 media_content_id 包含 mass://，
    // 如果按 content_id 检测会错误地返回 ma_search 而非 qqmusic/netease。
    // _maOverlay.source 是用户点击播放时设置的真实来源，比 HA 实体属性更可靠。
    if (maSource && ['netease','qqmusic','local','ma_search'].includes(maSource)) {
      return maSource;
    }
    if (!state || !state.attributes) return '';
    const a = state.attributes;
    const cid = (a.media_content_id || '').toLowerCase();
    const ct = (a.media_content_type || '').toLowerCase();
    if (cid.includes('netease') || cid.includes('163')) return 'netease';
    if (cid.includes('qqmusic') || cid.includes('qq_music') || cid.includes('tencent')) return 'qqmusic';
    if (ct === 'local' || cid.includes('filesystem') || cid.startsWith('file://') || cid.startsWith('media-source://') || cid.includes('/media/local')) return 'local';
    if (cid.includes('music_assistant') || cid.includes('mass://') || cid.includes('mass/')) return 'ma_search';
    try { const ls = localStorage.getItem(this._getLastSourceKey()); if (ls && ['netease','qqmusic','local','ma_search'].includes(ls)) return ls; } catch(e) {}
    return maSource;
  }

  async _enqueueRemainingMaTracks(tracks, idx, mode) {
    if (!tracks || !Array.isArray(tracks) || idx < 0 || idx >= tracks.length - 1) return;
    const te = this.maPlayerEntity || this.xiaomiMiotEntity || this.xiaomiHomeEntity;
    if (!te || !this._hass) return;
    for (let i = idx + 1; i < tracks.length; i++) {
      const t = tracks[i];
      try {
        let mid = ''; let artist = '';
        if (mode === 'ma') { mid = t.uri || t.track_id || ''; }
        else if (mode === 'local') { mid = t.media_content_id || t.url || t.uri || ''; }
        else { mid = t.name || ''; artist = t.artists || ''; }
        if (!mid) continue;
        const sd = { media_id: mid, media_type: 'track', enqueue: 'add' };
        if (artist) sd.artist = artist;
        await this._hass.callService('music_assistant', 'play_media', sd, { entity_id: te });
        await new Promise(r => setTimeout(r, 150));
      } catch(e) {}
    }
  }

  _getAllPlayerEntities() {
    const ids = [];
    if (this.xiaomiHomeEntity) ids.push(this.xiaomiHomeEntity);
    if (this.xiaomiMiotEntity) ids.push(this.xiaomiMiotEntity);
    if (this.maPlayerEntity) ids.push(this.maPlayerEntity);
    return ids;
  }

  async _stopAllPlayers() {
    if (!this._hass) return;
    for (const eid of this._getAllPlayerEntities()) {
      try { await this._hass.callService('media_player', 'media_stop', { entity_id: eid }); } catch(e) {}
    }
  }

  _getPlaybackTargetEntity() { return this.maPlayerEntity || this.xiaomiMiotEntity || this.xiaomiHomeEntity; }

  _getActiveTargetEntity() {
    // 根据当前播放来源选择目标实体
    const maWsActive = this._maWsConnected && this._maTrackName && this._isMaSourceActive();
    if (maWsActive && this.maPlayerEntity) return this.maPlayerEntity;
    return this.xiaomiMiotEntity || this.xiaomiHomeEntity;
  }
  _updateLastPlayEntity(eid) { if (eid) try { localStorage.setItem('sun_xiaoai_last_play_entity', eid); } catch(e) {} }

  // ════════════════════════════════════════════
  // 网易推荐弹窗（NeteaseCloudMusicApi）
  // ════════════════════════════════════════════

  handleNeteaseRecommendedToggle() {
    this._handleClick();
    this._neteaseRecommendedVisible = !this._neteaseRecommendedVisible;
    if (this._neteaseRecommendedVisible) { this._neteasePlaylistDetail = null; this._neteasePlaylistTracks = []; this._neteasePlaylistLoading = false; this._fetchNeteaseRecommended(); }
    this.requestUpdate();
  }

  async _fetchNeteaseRecommended() {
    if (!this.neteaseApiUrl) { this._neteaseRecommendedError = '未配置 netease_api_url'; this.requestUpdate(); return; }
    this._neteaseRecommendedLoading = true; this._neteaseRecommendedError = ''; this.requestUpdate();
    try {
      const r = await fetch(`${this.neteaseApiUrl}/personalized?limit=20`);
      if (!r.ok) throw new Error('HTTP ' + r.status);
      const d = await r.json();
      this._neteaseRecommendedList = (d?.result || []).map(i => ({ id: i.id, name: i.name, picUrl: i.picUrl, playCount: i.playCount, trackCount: i.trackCount }));
    } catch(e) { this._neteaseRecommendedError = '获取失败: ' + e.message; }
    finally { this._neteaseRecommendedLoading = false; this.requestUpdate(); }
  }

  async handleNeteaseRecommendedPlay(playlist) {
    this._neteasePlaylistDetail = playlist; this._neteasePlaylistTracks = []; this._neteasePlaylistLoading = true; this.requestUpdate();
    try {
      const r = await fetch(`${this.neteaseApiUrl}/playlist/track/all?id=${playlist.id}&limit=200`);
      const d = await r.json();
      this._neteasePlaylistTracks = (d?.songs || []).map(s => ({ id: s.id, name: s.name, artists: (s.ar||[]).map(a=>a.name).join('/'), album: (s.al||{}).name||'', picUrl: (s.al||{}).picUrl||'' }));
    } catch(e) { this._neteaseRecommendedError = '获取歌曲失败: ' + e.message; }
    finally { this._neteasePlaylistLoading = false; this.requestUpdate(); }
  }

  async handleNeteaseTrackPlay(track) {
    const maEntity = this.maPlayerEntity;
    const fallbackEntity = this.xiaomiMiotEntity || this.xiaomiHomeEntity;
    this._updateLastPlayEntity(maEntity || fallbackEntity);
    if (!this._hass) { this._neteaseRecommendedError = 'HA 连接不可用'; this.requestUpdate(); return; }
    if (!maEntity && !fallbackEntity) { this._neteaseRecommendedError = '未配置播放目标实体'; this.requestUpdate(); return; }
    this._neteaseRecommendedPlaying = String(track.id);
    this._setChannel('ma');
    // 🛑 MA 播放前：先暂停板块1（MIoT）和板块2（LOCAL）—— 三通道互斥
    this._pauseOtherChannelsForMa();
    this._lastPlaySource = 'netease'; try { localStorage.setItem(this._getLastSourceKey(), 'netease'); } catch(e) {}
    // 修复：过滤占位符标题（"请欣赏"等），避免污染 overlay 和 localStorage
    // 注意：必须用精确匹配，不能用 includes() —— 否则会误判真实歌曲名
    const MIOT_FAKE_TRACKS_NE = new Set(['请欣赏', '请欣赏（音乐）', '暂无播放', '正在加载', 'QQ音乐', '无音乐播放']);
    const isNeteaseTrackFake = !track.name || MIOT_FAKE_TRACKS_NE.has(track.name);
    if (!isNeteaseTrackFake) {
      this._overlayTitle = track.name || '';
      this._overlayArtist = track.artists || '';
      this._overlayCoverUrl = track.picUrl || '';
      this._overlayLyrics = [];
    }
    this._activeOverlaySource = 'netease';
    this.isPlaying = true;
    this.requestUpdate();
    // 保存到 localStorage（刷新页面恢复用）—— 修复：非本地来源也必须保存，否则刷新后恢复本地音乐旧数据
    if (!isNeteaseTrackFake) {
      this._reportNowPlayingData({
        title: track.name || '',
        artist: track.artists || '',
        cover_url: track.picUrl || '',
        source: 'netease',
        song_id: track.id,
      }, 'ma');
    }

    const clearPlaying = () => { setTimeout(() => { this._neteaseRecommendedPlaying = ''; this.requestUpdate(); }, 3000); };

    // 方案1: 通过 MA WS 直接播放（绕过 HA 集成，避免 connect first 错误）
    if (this._maWsConnected && this._maPlayerId) {
      try {
        const msgId = this._maWsSend('play_media', {
          uri: track.name,
          media_type: 'track',
          artist: track.artists,
          queue_option: 'replace',
          player_id: this._maPlayerId
        });
        if (msgId) {
          await new Promise((resolve, reject) => {
            const t = setTimeout(() => reject(new Error('超时')), 10000);
            this._maWs._pending[msgId] = { resolve: (d) => { clearTimeout(t); resolve(d); }, reject: (e) => { clearTimeout(t); reject(e); } };
          });
          const trackIndex = this._neteasePlaylistTracks.findIndex(t => t.id === track.id || t.name === track.name);
          if (trackIndex >= 0) { this._enqueueRemainingMaTracks(this._neteasePlaylistTracks, trackIndex, 'netease'); }
          clearPlaying(); return;
        }
      } catch (wsError) {
      }
    }

    // 方案2: 通过 HA music_assistant 服务播放
    if (maEntity) {
      try {
        await this._hass.callService('music_assistant', 'play_media', {
          media_id: track.name,
          media_type: 'track',
          artist: track.artists,
          enqueue: 'replace'
        }, { entity_id: maEntity });
        const trackIndex = this._neteasePlaylistTracks.findIndex(t => t.id === track.id || t.name === track.name);
        if (trackIndex >= 0) { this._enqueueRemainingMaTracks(this._neteasePlaylistTracks, trackIndex, 'netease'); }
        clearPlaying(); return;
      } catch (maError) {
        const msg = (maError?.message || String(maError)).toLowerCase();
        if (msg.includes('connect first')) {
          this._neteaseRecommendedError = 'Music Assistant 未连接，请检查 MA 加载项是否运行';
          this.requestUpdate(); clearPlaying(); return;
        }
      }
    }

    // 方案3: 通过 URL 回退播放（小爱实体直接播放）
    try {
      await this._playViaUrl(track, maEntity, fallbackEntity);
    } catch (e) {
      const msg = (e?.message || String(e)).toLowerCase();
      if (msg.includes('connect first')) {
        this._neteaseRecommendedError = 'Music Assistant 未连接，请检查 MA 加载项是否运行';
      } else {
        this._neteaseRecommendedError = '播放失败: ' + (e.message || e);
      }
      this.requestUpdate();
    }
    clearPlaying();
  }

  /**
   * URL 回退播放方案
   */
  async _playViaUrl(track, maEntity, fallbackEntity) {
    const targetEntity = maEntity || fallbackEntity;
    try {
      const songUrlResp = await fetch(`${this.neteaseApiUrl}/song/url?id=${track.id}&level=standard`);
      if (!songUrlResp.ok) throw new Error(`song/url HTTP ${songUrlResp.status}`);
      const songData = await songUrlResp.json();
      const playUrl = songData?.data?.[0]?.url;
      if (!playUrl) throw new Error('该歌曲暂无可播资源（可能需要VIP）');
      await this._hass.callService('media_player', 'play_media', {
        entity_id: targetEntity,
        media_content_id: playUrl,
        media_content_type: 'music'
      });
    } catch (e) {
      throw e;
    }
  }

  handleNeteaseBackToList() { this._neteasePlaylistDetail = null; this._neteasePlaylistTracks = []; this.requestUpdate(); }

  // ════════════════════════════════════════════
  // NCM API — 封面/歌词获取 + Overlay
  // ════════════════════════════════════════════

  async fetchNcmCoverAndLyrics(title, artist) {
    if (!this.neteaseApiUrl || !title) return;
    const q = `${title} ${artist||''}`;
    try {
      const sr = await fetch(`${this.neteaseApiUrl}/search?keywords=${encodeURIComponent(q)}&limit=5`);
      if (!sr.ok) return;
      const sd = await sr.json();
      const songs = sd?.result?.songs || [];
      if (!songs.length) return;
      let bm = songs[0];
      if (artist) { const al = artist.toLowerCase(); const m = songs.find(s => (s.artists||[]).some(a => a.name.toLowerCase().includes(al)||al.includes(a.name.toLowerCase()))); if (m) bm = m; }
      const sid = bm.id; this._ncmSongId = sid;
      const dr = await fetch(`${this.neteaseApiUrl}/song/detail?ids=${sid}`);
      if (dr.ok) { const dd = await dr.json(); const dt = dd?.songs?.[0]; if (dt) { if (dt.al?.picUrl) this._ncmCoverUrl = dt.al.picUrl + '?param=300y300'; const ct = dt.name||''; const ca = (dt.ar||[]).map(a=>a.name).join('/'); if (ct) { this._overlayTitle = ct; this._overlayArtist = ca; } } }
      const lr = await fetch(`${this.neteaseApiUrl}/lyric?id=${sid}`);
      if (lr.ok) { const ld = await lr.json(); const lt = ld?.lrc?.lyric; if (lt && lt.trim()) { this.lyrics = this.parseLyrics(lt); if (this.isPlaying && this.smoothCurrentTime>0) this.updateCurrentLyricIndex(this.smoothCurrentTime); if (this.isPlaying && this.lyrics.length>0 && this.showLyrics) this.startLyricsTimer(); } }
      this.requestUpdate();
    } catch(e) {}
  }

  async _applyNeteaseOverlay() {
    // 确保操作 MA 通道 overlay（三通道隔离，不依赖调用方设置 channel）
    this._setChannel('ma');

    if (!this._maOverlay.title && !this._maOverlay.artist && !this._maOverlay.coverUrl) {
      const ls = this._restoreNowPlayingFromLocalStorage('ma');
      // 仅当 localStorage 来源为 netease 时才使用，避免用本地音乐旧数据覆盖
      if (ls && (ls.source === 'netease')) { if (ls.title&&!this._maOverlay.title) this._maOverlay.title=ls.title; if (ls.artist&&!this._maOverlay.artist) this._maOverlay.artist=ls.artist; if (ls.cover_url&&!this._maOverlay.coverUrl) this._maOverlay.coverUrl=ls.cover_url; }
      if (this._maOverlay.title) this.requestUpdate();
    }
    let title = this._maOverlay.title || '';
    let artist = this._maOverlay.artist || '';
    if (!title && this._maWsConnected && this._maTrackName && this._isMaSourceActive()) { title = this._maTrackName; artist = this._maTrackArtist; }
    if (!title) { const st = this._getPrimaryState(); title = st?.attributes?.media_title||''; artist = st?.attributes?.media_artist||''; }
    if (!title) return;
    await this.fetchNcmCoverAndLyrics(title, artist);
    if (this._ncmCoverUrl && !this._maOverlay.coverUrl) this._maOverlay.coverUrl = this._ncmCoverUrl;
    if (this.lyrics.length > 0) this._overlayLyrics = this.lyrics;
    this.requestUpdate();
  }

  async _applyQQMusicOverlay() {
    // 确保操作 MA 通道 overlay（三通道隔离，不依赖调用方设置 channel）
    this._setChannel('ma');

    // 阶段1：从 localStorage 恢复（最快，最可靠）
    if (!this._maOverlay.title && !this._maOverlay.artist && !this._maOverlay.coverUrl) {
      const ls = this._restoreNowPlayingFromLocalStorage('ma');
      // 仅当 localStorage 来源为 qqmusic 时才使用，避免用本地音乐旧数据覆盖
      if (ls && (ls.source === 'qqmusic')) { if (ls.title&&!this._maOverlay.title) this._maOverlay.title=ls.title; if (ls.artist&&!this._maOverlay.artist) this._maOverlay.artist=ls.artist; if (ls.cover_url&&!this._maOverlay.coverUrl) this._maOverlay.coverUrl=ls.cover_url; }
      if (this._maOverlay.title) { this.requestUpdate(); return; }
    }
    if (this._maOverlay.title) return;

    // 阶段2：回退到 HA 实体属性（参照 xiaoshi-music-card.js 三路兜底）
    // 注意：必须用精确匹配，不能用 includes() —— 否则会误判真实歌曲名
    const MIOT_FAKE = new Set(['请欣赏', '请欣赏（音乐）', '暂无播放', '正在加载', 'QQ音乐', '无音乐播放']);
    // 2a. 尝试从 MIoT 实体获取（MA 可能通过 MIoT 实体播放）
    const miotSt = this._hass && this.xiaomiMiotEntity ? this._hass.states[this.xiaomiMiotEntity] : null;
    if (miotSt?.attributes) {
      const a = miotSt.attributes;
      const mt = a.media_title||''; const ma = a.media_artist||'';
      const isFake = MIOT_FAKE.has(mt);
      if (!isFake && mt) { this._maOverlay.title = mt; this._maOverlay.artist = ma; if (a.media_image_url||a.entity_picture) this._maOverlay.coverUrl = a.media_image_url||a.entity_picture; }
    }
    // 2b. 尝试从 MA 独立实体获取（板块3 专用实体）
    if (!this._maOverlay.title && this.maPlayerEntity && this._hass) {
      const maSt = this._hass.states[this.maPlayerEntity];
      if (maSt?.attributes) {
        const a = maSt.attributes;
        const mt = a.media_title||''; const ma = a.media_artist||'';
        const isFake = MIOT_FAKE.has(mt);
        if (!isFake && mt) { this._maOverlay.title = mt; this._maOverlay.artist = ma; if (a.media_image_url||a.entity_picture) this._maOverlay.coverUrl = a.media_image_url||a.entity_picture; }
      }
    }

    // 阶段3：兜底使用 MA WS 数据
    if (!this._maOverlay.title && this._maTrackName) { this._maOverlay.title = this._maTrackName; this._maOverlay.artist = this._maTrackArtist||''; if (this._maCoverUrl) this._maOverlay.coverUrl = this._maCoverUrl; }
  }

  /**
   * 本地音乐覆盖：参照 xiaoshi-music-card.js 的三阶段恢复（localStorage → 后端 API → MA WS/实体）。
   * 核心原则：绝不覆盖已有 overlay（来自 _playMediaItem 的数据），仅在空时补充。
   * 修复本地音乐刷新后显示"请欣赏（音乐）"和歌词丢失的问题。
   */
  async _applyLocalMusicOverlay() {
    // ===== 阶段1：刷新页面恢复（当 overlay 全空时）=====
    // 优先级：localStorage > 后端 now_playing API > 实体属性
    const allOverlayEmpty = !this._overlayTitle && !this._overlayArtist && !this._overlayCoverUrl;
    let restoredFromBackend = false;
    let restoredSongId = null;  // 从 localStorage 或后端恢复的 song_id，用于歌词获取
    let restoredMediaContentId = ''; // 用于恢复 currentItem.media_content_id

    if (allOverlayEmpty) {
      // ---- 第1步：localStorage 兜底（最快，最可靠）----
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

    // ===== 歌词恢复（无论 overlay 是否已有标题/歌手，歌词总是单独获取）=====
    // 即使 _overlayTitle 已经通过 _localOverlay 恢复，也要确保歌词被加载
    const localSongId = this._activeChannel === 'local' && this._mediaPlayerState?.currentItem?.id
      ? this._mediaPlayerState.currentItem.id
      : null;
    const lyricsSongId = restoredSongId || localSongId;
    if (lyricsSongId && (!this._overlayLyrics || this._overlayLyrics.length === 0)) {
      this._fetchSongLyrics(lyricsSongId).then(lyricsText => {
        if (lyricsText) {
          const parsed = this.parseLyrics(lyricsText);
          if (parsed.length > 0) {
            this._overlayLyrics = parsed;
            this.lyrics = parsed;
            if (this.showLyrics && this.isPlaying) this.startLyricsTimer();
            this.requestUpdate();
          }
        }
      });
    }

    // 如果已经从 localStorage/后端恢复了标题，触发一次重渲染
    if (restoredFromBackend) {
      // 同步到 _localOverlay，因为 render() 的三通道逻辑读取的是 _localOverlay
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

    // ===== 阶段2：运行时补充（已有 overlay 时不覆盖标题）=====
    // 注意：绝不覆盖 _playMediaItem 已设置的 overlay 数据
    if (!this._overlayTitle) {
      // 本地音乐仅回退到 currentItem / HA 实体属性，绝不使用 MA 通道数据
      const currentItem = this._mediaPlayerState?.currentItem || null;
      if (currentItem && (currentItem.title || currentItem.name)) {
        this._overlayTitle = currentItem.title || currentItem.name || '';
        this._overlayArtist = currentItem.artist || '';
      } else {
        // 回退到 HA 主实体属性
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

    // 封面补充
    if (!this._overlayCoverUrl) {
      const currentItem = this._mediaPlayerState?.currentItem || null;
      if (currentItem && currentItem.cover) {
        this._overlayCoverUrl = currentItem.cover;
      } else if (currentItem && currentItem.id) {
        this._overlayCoverUrl = this._songCoverUrl(currentItem.id);
      } else {
        const st = this._getPrimaryState();
        const ep = st?.attributes?.entity_picture || '';
        if (ep) this._overlayCoverUrl = ep;
      }
    }

    // 歌词补充（仅当已有 this.lyrics 时同步，不触发新请求）
    if ((!this._overlayLyrics || this._overlayLyrics.length === 0) && this.lyrics.length > 0) {
      this._overlayLyrics = this.lyrics;
    }
  }

  /**
   * MA 搜索覆盖：MA WS 通常已提供完整数据，这里作为刷新页面恢复的兜底
   * 参照 xiaoshi-music-card.js 的 _applyMASearchOverlay 实现
   */
  async _applyMASearchOverlay() {
    // ===== 刷新页面恢复：优先 localStorage，其次后端 now_playing =====
    if (!this._overlayTitle && !this._overlayArtist && !this._overlayCoverUrl) {
      const lsData = this._restoreNowPlayingFromLocalStorage('ma');
      if (lsData) {
        if (lsData.title && !this._overlayTitle) this._overlayTitle = lsData.title;
        if (lsData.artist && !this._overlayArtist) this._overlayArtist = lsData.artist;
        if (lsData.cover_url && !this._overlayCoverUrl) this._overlayCoverUrl = lsData.cover_url;
      }
      try {
        const np = await this._fetchNowPlaying(this._localMusicPlayerCfg || {});
        if (np && np.title) {
          if (!this._overlayTitle) this._overlayTitle = np.title;
          if (!this._overlayArtist && np.artist) this._overlayArtist = np.artist;
          if (!this._overlayCoverUrl && np.cover_url) this._overlayCoverUrl = np.cover_url;
        }
      } catch (e) {}
      if (this._overlayTitle) {
        if ((!this._overlayLyrics || this._overlayLyrics.length === 0) && this.neteaseApiUrl) {
          this.fetchNcmCoverAndLyrics(this._overlayTitle, this._overlayArtist).then(() => {
            if (this.lyrics.length > 0) { this._overlayLyrics = this.lyrics; this.requestUpdate(); }
          });
        }
        this.requestUpdate();
        return;
      }
    }

    // 守卫：已有 overlay 数据时不再覆盖
    if (this._overlayTitle) { this.requestUpdate(); return; }

    // MA WS 回退（仅在完全无数据时使用）
    if (this._maTrackName) {
      this._overlayTitle = this._maTrackName;
      this._overlayArtist = this._maTrackArtist || '';
    }
    if (this._maCoverUrl) this._overlayCoverUrl = this._maCoverUrl;
    if (this.lyrics.length > 0) this._overlayLyrics = this.lyrics;
  }

  // ════════════════════════════════════════════
  // QQ音乐 — MA 播放列表浏览&播放
  // ════════════════════════════════════════════

  handleMaPlaylistsToggle() {
    this._handleClick();
    this._maPlaylistsVisible = !this._maPlaylistsVisible;
    if (this._maPlaylistsVisible) { this._maPlaylistDetail=null; this._maPlaylistTracks=[]; this._maPlaylistTracksLoading=false; this._fetchMaPlaylists(); }
    else { this._maPlaylistsError=''; this._maPlaylistDetail=null; this._maPlaylistTracks=[]; }
    this.requestUpdate();
  }

  async _fetchMaPlaylists() {
    this._maPlaylistsLoading=true; this._maPlaylistsError=''; this._maPlaylistsList=[]; this.requestUpdate();
    let all=[];
    try {
      // 方案0: 手动配置 ma_playlists
      if (this.maPlaylistsConfig && this.maPlaylistsConfig.trim()) {
        const lines = this.maPlaylistsConfig.split('\n').map(l=>l.trim()).filter(l=>l&&!l.startsWith('#'));
        for (const line of lines) {
          const p=line.split('|'); const nm=(p[0]||'').trim(); const mu=(p[1]||'').trim(); const im=(p[2]||'').trim();
          if (!nm||!mu) continue;
          let pr='MA音乐库'; if (/qqmusic|tencent/i.test(mu)) pr='QQ音乐'; else if (/netease/i.test(mu)) pr='网易云';
          let fu=mu; if (/^library\/\d+$/.test(mu)) fu=`library://playlist/${mu.split('/')[1]}`;
          all.push({ item_id:fu, name:nm, provider:pr, uri:fu, image_url:im, can_play:true, can_expand:true, media_content_type:'playlist', media_content_id:fu, _rawMaUri:mu });
        }
        if (all.length>0) { this._processMaPlaylistsResult(all); return; }
      }
      // 方案1: HA browse_media（通过小爱/音箱实体）
      const te=this.maPlayerEntity||this.xiaomiMiotEntity||this.xiaomiHomeEntity;
      if (this._hass&&te) {
        try {
          const r=await this._hass.callWS({ type:'browse_media', entity_id:te, media_content_type:'playlist', media_content_id:'playlists' });
          if (r?.children?.length) await this._collectBrowseItems(r, te, all, '', 0);
        } catch(e){}
      }
      // 方案2: MA WS music/browse（通过 MA WebSocket）
      if (all.length===0 && this._maWs && this._maWsConnected) {
        try {
          const bData = await this._maWsSendAndWait('music/browse', { path: '' });
          const items = Array.isArray(bData) ? bData : (bData?.items || []);
          if (items.length>0) await this._collectMaWsBrowseItems(items, all, '', 0);
        } catch(e){}
      }
      if (all.length===0) throw new Error('请配置 ma_playlists 手动指定歌单');
    } catch(e) { this._maPlaylistsError = '获取失败: ' + e.message; }
    finally { this._maPlaylistsLoading=false; this.requestUpdate(); }
  }

  _makePlaylistItem(raw) {
    const id=raw.item_id||raw.playlist_id||raw.uri||''; const uri=raw.uri||raw.media_content_id||id||'';
    let pr='MA音乐库'; if (/qqmusic/i.test(uri)) pr='QQ音乐'; else if (/netease/i.test(uri)) pr='网易云';
    return { item_id:id, name:raw.name||raw.sort_name||raw.title||'未命名', provider:pr, uri, image_url:raw.image_url||raw.artwork_url||'', can_play:raw.can_play!==false, can_expand:!!raw.can_expand, media_content_type:raw.media_content_type||'music', media_content_id:uri, track_count:raw.track_count??0 };
  }

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

  async _collectMaWsBrowseItems(items, results, parentName, depth) {
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

  _processMaPlaylistsResult(result) {
    if (!Array.isArray(result)) { this._maPlaylistsList=[]; return; }
    const lbls={'library':'MA音乐库','netease':'网易云音乐','neteasecloud':'网易云音乐','qqmusic':'QQ音乐','tencent_music':'QQ音乐','spotify':'Spotify','youtube':'YouTube Music','filesystem':'本地文件'};
    const gr={};
    for (const pl of result) {
      const pr=(pl.provider||'library').toLowerCase(); const lb=lbls[pr]||pr;
      if (!gr[lb]) gr[lb]=[];
      gr[lb].push({ item_id:pl.item_id||pl.playlist_id||'', name:pl.name||'未命名', provider:pr, uri:pl.uri||'', image_url:pl.image_url||pl.artwork_url||'', can_play:pl.can_play||false, can_expand:pl.can_expand||false, media_content_id:pl.media_content_id||'', media_content_type:pl.media_content_type||'', track_count:pl.track_count||0, _rawMaUri:pl._rawMaUri||'' });
    }
    const ord=['MA音乐库','网易云音乐','QQ音乐','Spotify','YouTube Music','本地文件'];
    const sg=[]; for (const lb of ord) { if (gr[lb]) { sg.push({ label:lb, playlists:gr[lb] }); delete gr[lb]; } }
    for (const [lb,pls] of Object.entries(gr)) sg.push({ label:lb, playlists:pls });
    this._maPlaylistsList=sg;
  }

  async handleMaPlaylistSelect(playlist) {
    if (!playlist.can_expand) { await this.handleMaPlaylistPlay(playlist); return; }
    this._maPlaylistDetail=playlist; this._maPlaylistTracks=[]; this._maPlaylistTracksLoading=true; this.requestUpdate();
    const te=this.maPlayerEntity||this.xiaomiMiotEntity||this.xiaomiHomeEntity;
    const ru=playlist._rawMaUri||''; const su=playlist.uri||playlist.item_id||'';
    try {
      // 方案C优先: MA WS music/playlists/playlist_tracks（无 CORS 问题）
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
            else if (plUri.includes('netease')) providerDomain='neteasecloudmusic';
            const bResult=await this._maWsSendAndWait('music/playlists/playlist_tracks',{ item_id:String(itemId), provider_instance_id_or_domain:providerDomain, force_refresh:false, allow_dynamic_tracks:false });
            if (bResult) {
              const items=Array.isArray(bResult)?bResult:[bResult];
              const tracks=items.filter(it=>!!(it?.name||it?.uri||it?.item_id)&&!(it?.media_type==='folder'||it?.media_type==='playlist'));
              if (tracks.length>0) this._maPlaylistTracks=tracks.map(t=>({ uri:t.uri||t.item_id||'', name:t.name||t.title||'未知', artist:this._extractArtist(t), album:t.album?.name||'', duration:t.duration||0, image_url:this._extractImage(t), track_id:t.item_id||t.uri||'', provider:this._extractProvider(t,playlist.provider) }));
            }
          }
        } catch(e){}
      }
      // 方案A/B回退: MA HTTP（仅 WS 失败或不可用时使用，可能受 CORS 限制）
      if (this._maPlaylistTracks.length===0) {
        if (this.maServerUrl && this.maServerToken && /^library\/\d+$/.test(ru)) {
          const plId=ru.split('/')[1]; const bu=this.maServerUrl.replace(/\/+$/,'');
          for (const ep of [`${bu}/api/library/playlists/${plId}/tracks`,`${bu}/api/library/playlists/${plId}`]) {
            try {
              const r=await fetch(ep,{ headers:{ 'Authorization':`Bearer ${this.maServerToken}` } });
              if (r.ok) { const d=await r.json(); const items=Array.isArray(d)?d:(d?.tracks||d?.items||[]); if (items.length>0) { this._maPlaylistTracks=items.map(t=>({ uri:t.uri||'', name:t.name||t.title||'未知', artist:this._extractArtist(t), album:t.album?.name||'', duration:t.duration||0, image_url:this._extractImage(t), track_id:t.item_id||t.track_id||t.uri||'', provider:t.provider||playlist.provider })); break; } }
            } catch(e){}
          }
        }
        // 其他 URI 格式
        if (this._maPlaylistTracks.length===0 && this.maServerUrl && this.maServerToken && ru && !/^library\/\d+$/.test(ru)) {
          const bu=this.maServerUrl.replace(/\/+$/,'');
          for (const ep of [`${bu}/api/playlists/${encodeURIComponent(ru)}/tracks`,`${bu}/api/playlists/${encodeURIComponent(su)}/tracks`]) {
            try {
              const r=await fetch(ep,{ headers:{ 'Authorization':`Bearer ${this.maServerToken}` } });
              if (r.ok) { const d=await r.json(); const items=Array.isArray(d)?d:(d?.tracks||d?.items||[]); if (items.length>0) { this._maPlaylistTracks=items.map(t=>({ uri:t.uri||'', name:t.name||t.title||'未知', artist:this._extractArtist(t), album:t.album?.name||'', duration:t.duration||0, image_url:this._extractImage(t), track_id:t.item_id||t.track_id||'', provider:t.provider||playlist.provider })); break; } }
            } catch(e){}
          }
        }
      }
    } catch(e){} finally { this._maPlaylistTracksLoading=false; this.requestUpdate(); }
  }

  async handleMaPlaylistPlay(playlist) {
    const maTe=this.maPlayerEntity;
    const te=maTe||this.xiaomiMiotEntity||this.xiaomiHomeEntity; this._updateLastPlayEntity(te);
    if (!this._hass||!te) return;
    const ru=playlist._rawMaUri||''; const su=playlist.uri||playlist.item_id||'';
    const playUri=su||ru;
    if (!playUri) { this._maPlaylistsError='播放失败: 歌单 URI 为空'; this.requestUpdate(); return; }
    // 🛑 MA 播放前：先暂停板块1（MIoT）和板块2（LOCAL）—— 三通道互斥
    this._setChannel('ma');
    this._pauseOtherChannelsForMa();
    this._maOverlay.source = 'qqmusic';
    this._maOverlay.active = true;
    this._activeOverlaySource = 'qqmusic';
    this._maPlaylistPlaying=playUri; this.requestUpdate();
    try {
      // 方式1: MA WS play_media（无 CORS 问题，优先）
      if (this._maWs && this._maWs.readyState === WebSocket.OPEN && this._maPlayerId) {
        try {
          const msgId=this._maWsSend('play_media', { uri:playUri, media_type:'playlist', queue_option:'replace', player_id:this._maPlayerId });
          if (msgId) { await new Promise((resolve,reject)=>{ const t=setTimeout(()=>reject(new Error('超时')),10000); this._maWs._pending[msgId]={ resolve:(d)=>{clearTimeout(t);resolve(d);}, reject:(e)=>{clearTimeout(t);reject(e);} }; }); }
          this._closeMaPanel(); return;
        } catch(e){
        }
      } else {
      }
      // 方式2: HA music_assistant.play_media（必须使用 MA 播放器实体，不能用小爱实体）
      if (maTe) {
        try {
          await this._hass.callService('music_assistant','play_media',{ media_id:playUri, media_type:'playlist' },{ entity_id:maTe });
          this._closeMaPanel(); return;
        } catch(e2){
          const errMsg=(e2?.message||String(e2)).toLowerCase();
          if (errMsg.includes('connect first')) {
            this._maPlaylistsError = 'Music Assistant 未连接，请检查 MA 加载项是否运行';
            this.requestUpdate(); return;
          }
          // 如果错误包含 "no playable items"，说明实体不是 MA 播放器或 URI 无法解析
          if (errMsg.includes('no playable') || errMsg.includes('not found')) {
            this._maPlaylistsError = '播放失败: MA 无法解析该歌单，请检查 ma_player_entity 是否为正确的 MA 播放器实体';
            this.requestUpdate(); return;
          }
        }
      } else {
      }
      // 方式3: MA HTTP /api/command（可能受 CORS 限制，作为最后手段）
      if (this.maServerUrl&&this.maServerToken) {
        const bu=this.maServerUrl.replace(/\/+$/,'');
        try {
          const r=await fetch(`${bu}/api/command`,{ method:'POST', headers:{ 'Authorization':`Bearer ${this.maServerToken}`,'Content-Type':'application/json' }, body:JSON.stringify({ uri:playUri }) });
          if (r.ok) {
            this._closeMaPanel(); return;
          }
        } catch(e3){
        }
      }
      throw new Error('所有方式均失败（建议配置 ma_player_entity 并确保 MA 连接正常）');
    } catch(e){ this._maPlaylistsError='播放失败: '+e.message; }
    finally { this._maPlaylistPlaying=''; this.requestUpdate(); }
  }


  async handleMaPlaylistTrackPlay(track) {
    const maTe=this.maPlayerEntity;
    const te=maTe||this.xiaomiMiotEntity||this.xiaomiHomeEntity; this._updateLastPlayEntity(te);
    if (!this._hass||!te) { this._maPlaylistsError = '未配置播放目标实体'; this.requestUpdate(); return; }
    const mu=track.uri||track.track_id||'';
    if (!mu) { this._maPlaylistsError = '播放失败: 歌曲 URI 为空'; this.requestUpdate(); return; }
    this._setChannel('ma');
    // 🛑 MA 播放前：先暂停板块1（MIoT）和板块2（LOCAL）—— 三通道互斥
    this._pauseOtherChannelsForMa();
    this._lastPlaySource='qqmusic'; try { localStorage.setItem(this._getLastSourceKey(),'qqmusic'); } catch(e) {}
    this._maPlaylistPlaying=mu; this.requestUpdate();
    this._activeOverlaySource='qqmusic';
    // 保存到 localStorage（刷新页面恢复用）—— 修复：非本地来源也必须保存，否则刷新后恢复本地音乐旧数据
    // QQ音乐歌曲的详细标题/歌手/封面由 MA WS 回报后更新，这里先保存已有信息
    // 修复：过滤占位符标题（"请欣赏"等），避免污染 localStorage
    // 注意：必须用精确匹配，不能用 includes() —— 否则会误判真实歌曲名
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
      // 方式1: MA WS play_media（无 CORS 问题，优先）
      if (this._maWs && this._maWs.readyState === WebSocket.OPEN && this._maPlayerId) {
        try {
          const msgId = this._maWsSend('play_media', { uri: mu, media_type: 'track', queue_option: 'replace', player_id: this._maPlayerId });
          if (msgId) { await new Promise((resolve,reject)=>{ const t=setTimeout(()=>reject(new Error('超时')),8000); this._maWs._pending[msgId]={ resolve:(d)=>{clearTimeout(t);resolve(d);}, reject:(e)=>{clearTimeout(t);reject(e);} }; }); }
          const idx1=this._maPlaylistTracks.findIndex(t=>t.uri===track.uri||t.track_id===track.track_id);
          if (idx1>=0) this._enqueueRemainingMaTracks(this._maPlaylistTracks, idx1, 'ma');
          this._closeMaPanel(); return;
        } catch(e1){
          const msg=(e1?.message||String(e1)).toLowerCase();
          if (msg.includes('超时')) { this._maPlaylistsError = '播放请求超时，请检查 MA 连接'; this.requestUpdate(); }
        }
      } else {
      }
      // 方式2: HA music_assistant.play_media（必须使用 MA 播放器实体）
      if (maTe) {
        try {
          await this._hass.callService('music_assistant','play_media',{ media_id:mu, media_type:'track' },{ entity_id:maTe });
          const idx3=this._maPlaylistTracks.findIndex(t=>t.uri===track.uri||t.track_id===track.track_id);
          if (idx3>=0) this._enqueueRemainingMaTracks(this._maPlaylistTracks, idx3, 'ma');
          this._closeMaPanel(); return;
        } catch(e3){
          const msg3=(e3?.message||String(e3)).toLowerCase();
          if (msg3.includes('connect first')) {
            this._maPlaylistsError = 'Music Assistant 未连接，请检查 MA 加载项是否运行';
            this.requestUpdate(); return;
          }
          if (msg3.includes('no playable') || msg3.includes('not found')) {
            this._maPlaylistsError = '播放失败: 请检查 ma_player_entity 是否为正确的 MA 播放器实体';
            this.requestUpdate(); return;
          }
        }
      } else {
      }
      // 方式3: MA HTTP /api/command（可能受 CORS 限制，最后手段）
      if (this.maServerUrl && this.maServerToken && mu) {
        try {
          const r=await fetch(`${this.maServerUrl.replace(/\/+$/,'')}/api/command`,{ method:'POST', headers:{ 'Authorization':`Bearer ${this.maServerToken}`,'Content-Type':'application/json' }, body:JSON.stringify({ uri:mu }) });
          if (r.ok) {
            const idx2=this._maPlaylistTracks.findIndex(t=>t.uri===track.uri||t.track_id===track.track_id);
            if (idx2>=0) this._enqueueRemainingMaTracks(this._maPlaylistTracks, idx2, 'ma');
            this._closeMaPanel(); return;
          }
        } catch(e2){
        }
      }
      // 所有方式失败 — 给出明确诊断信息
      if (!maTe) {
        this._maPlaylistsError = '播放失败: 未配置 ma_player_entity。请在卡片设置中选择 Music Assistant 的播放器实体';
      } else if (!this._maWsConnected) {
        this._maPlaylistsError = '播放失败: MA WebSocket 未连接，请检查 ma_server_url 和 ma_server_token 配置';
      } else {
        this._maPlaylistsError = '播放失败，请检查 MA 连接状态和歌单 URI 有效性';
      }
      this.requestUpdate();
    } catch(e){ this._maPlaylistsError='播放失败: '+e.message; }
    finally { this._maPlaylistPlaying=''; this.requestUpdate(); }
  }


  _closeMaPanel() { this._maPlaylistsVisible = false; this._maPlaylistDetail = null; this._maPlaylistTracks = []; }
  handleMaPlaylistsBack() { this._maPlaylistDetail = null; this._maPlaylistTracks = []; this.requestUpdate(); }

  _extractArtist(t) { return t?.artist?.name || t?.artist || ''; }
  _extractImage(t) { return t?.image_url || t?.artwork_url || t?.metadata?.artwork_url || ''; }
  _extractProvider(t, fb) { return t?.provider || fb || '未知'; }

  // ════════════════════════════════════════════
  // 渲染 — 网易推荐弹窗
  // ════════════════════════════════════════════

  _renderNeteaseRecommendedPanel() {
    if (!this._neteaseRecommendedVisible) return html``;
    const detail=this._neteasePlaylistDetail; const tracks=this._neteasePlaylistTracks;
    const tracksLoading=this._neteasePlaylistLoading; const playingId=this._neteaseRecommendedPlaying;
    const list=this._neteaseRecommendedList; const loading=this._neteaseRecommendedLoading; const error=this._neteaseRecommendedError;

    return html`
      <div class="ma-search-overlay" @click=${(e)=> { if(e.target.classList.contains('ma-search-overlay')) { detail ? this.handleNeteaseBackToList() : this.handleNeteaseRecommendedToggle(); } }}>
        <div class="ma-search-panel">
          <div class="ma-search-header">
            ${detail ? html`
              <button class="ma-close-btn" @click=${this.handleNeteaseBackToList} title="返回"><ha-icon icon="mdi:arrow-left"></ha-icon></button>
              <span style="flex:1;font-size:14px;color:#fff;">${detail.name}</span>
            ` : html`
              <ha-icon icon="mdi:playlist-music" class="ma-search-icon"></ha-icon>
              <span style="flex:1;font-size:14px;color:#fff;">网易云推荐歌单</span>
            `}
            <button class="ma-close-btn" @click=${this.handleNeteaseRecommendedToggle} title="关闭"><ha-icon icon="mdi:close"></ha-icon></button>
          </div>
          ${!detail ? html`
          <div class="ma-search-results" style="padding:10px;">
            ${error ? html`<div class="ma-panel-empty" style="color:#e74c3c;">${error}</div>` : ''}
            ${loading ? html`<div class="ma-panel-loading"><ha-icon icon="mdi:loading" class="ma-spin"></ha-icon><span>加载中...</span></div>` : list.map(item=>html`
              <div class="netease-recommended-item" @click=${()=>this.handleNeteaseRecommendedPlay(item)}
                   style="display:flex;align-items:center;gap:10px;padding:8px;border-radius:8px;cursor:pointer;transition:background 0.2s;border-bottom:1px solid rgba(255,255,255,0.06);">
                <div style="width:48px;height:48px;border-radius:8px;background-image:url('${item.picUrl}?param=100y100');background-size:cover;background-position:center;flex-shrink:0;"></div>
                <div style="flex:1;min-width:0;">
                  <div style="font-size:13px;color:#fff;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${item.name}</div>
                  <div style="font-size:11px;color:rgba(255,255,255,0.4);margin-top:2px;">${item.trackCount||''}首${item.playCount?' · '+(item.playCount/10000).toFixed(1)+'万播放':''}</div>
                </div>
                <ha-icon icon="mdi:chevron-right" style="--mdc-icon-size:20px;color:rgba(255,255,255,0.3);flex-shrink:0;"></ha-icon>
              </div>
            `)}
          </div>
          ` : ''}
          ${detail ? html`
          <div class="ma-search-results" style="padding:10px;">
            ${error ? html`<div class="ma-panel-empty" style="color:#e74c3c;">${error}</div>` : ''}
            ${tracksLoading ? html`<div class="ma-panel-loading"><ha-icon icon="mdi:loading" class="ma-spin"></ha-icon><span>加载歌曲...</span></div>` : tracks.map((t,idx)=>html`
              <div class="netease-recommended-item ${playingId===String(t.id)?'netease-playing':''}"
                   @click=${()=>this.handleNeteaseTrackPlay(t)}
                   style="display:flex;align-items:center;gap:10px;padding:8px;border-radius:8px;cursor:pointer;transition:background 0.2s;border-bottom:1px solid rgba(255,255,255,0.05);">
                <div style="width:24px;text-align:center;font-size:12px;color:rgba(255,255,255,0.35);flex-shrink:0;">${idx+1}</div>
                <div style="flex:1;min-width:0;">
                  <div style="font-size:13px;color:#fff;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${t.name}</div>
                  <div style="font-size:11px;color:rgba(255,255,255,0.4);margin-top:1px;">${t.artists}${t.album?' · '+t.album:''}</div>
                </div>
                <ha-icon icon="${playingId===String(t.id)?'mdi:loading':'mdi:play-circle'}" style="--mdc-icon-size:20px;color:${playingId===String(t.id)?'#3498db':'rgba(255,255,255,0.25)'};flex-shrink:0;" class="${playingId===String(t.id)?'ma-spin':''}"></ha-icon>
              </div>
            `)}
            ${!tracksLoading && tracks.length===0 && !error ? html`<div class="ma-panel-empty">暂无歌曲</div>` : ''}
          </div>
          ` : ''}
        </div>
      </div>
    `;
  }

  // ════════════════════════════════════════════
  // 渲染 — MA 播放列表弹窗
  // ════════════════════════════════════════════

  _renderMaPlaylistsPanel() {
    if (!this._maPlaylistsVisible) return html``;
    const detail=this._maPlaylistDetail; const tracks=this._maPlaylistTracks;
    const tracksLoading=this._maPlaylistTracksLoading; const playingUri=this._maPlaylistPlaying;
    const list=this._maPlaylistsList; const loading=this._maPlaylistsLoading; const error=this._maPlaylistsError;

    const providerIcons = {
      'MA音乐库': { icon: 'mdi:library-music', color: '#3498db' },
      '网易云音乐': { icon: 'mdi:cloud', color: '#e74c3c' },
      'QQ音乐': { icon: 'mdi:music-circle', color: '#27ae60' },
      'Spotify': { icon: 'mdi:spotify', color: '#1db954' },
      'YouTube Music': { icon: 'mdi:youtube', color: '#ff0000' },
      '本地文件': { icon: 'mdi:folder-music', color: '#f39c12' },
    };

    return html`
      <div class="ma-search-overlay" @click=${(e)=>{ if(e.target.classList.contains('ma-search-overlay')) { detail ? this.handleMaPlaylistsBack() : this.handleMaPlaylistsToggle(); } }}>
        <div class="ma-search-panel">
          <div class="ma-search-header">
            ${detail ? html`
              <button class="ma-close-btn" @click=${this.handleMaPlaylistsBack} title="返回"><ha-icon icon="mdi:arrow-left"></ha-icon></button>
              <span style="flex:1;font-size:14px;color:#fff;">${detail.name}</span>
            ` : html`
              <ha-icon icon="mdi:playlist-music" class="ma-search-icon"></ha-icon>
              <span style="flex:1;font-size:14px;color:#fff;">MA 播放列表</span>
            `}
            <button class="ma-close-btn" @click=${this.handleMaPlaylistsToggle} title="关闭"><ha-icon icon="mdi:close"></ha-icon></button>
          </div>
          ${!detail ? html`
          <div class="ma-search-results" style="padding:10px;">
            ${error ? html`<div class="ma-panel-empty" style="color:#e74c3c;">${error}</div>` : ''}
            ${loading ? html`<div class="ma-panel-loading"><ha-icon icon="mdi:loading" class="ma-spin"></ha-icon><span>加载播放列表...</span></div>` : list.length===0 ? html`<div class="ma-panel-empty">暂无播放列表</div>` : list.map(g=>html`
              <div style="margin-bottom:12px;">
                <div style="font-size:12px;color:${(providerIcons[g.label]||{}).color||'rgba(255,255,255,0.5)'};font-weight:600;padding:4px 0;display:flex;align-items:center;gap:4px;">
                  <ha-icon icon="${(providerIcons[g.label]||{}).icon||'mdi:playlist-music'}" style="--mdc-icon-size:14px;"></ha-icon>
                  ${g.label} (${g.playlists.length})
                </div>
                ${g.playlists.map(pl=>html`
                  <div class="netease-recommended-item" @click=${()=>this.handleMaPlaylistSelect(pl)}
                       style="display:flex;align-items:center;gap:10px;padding:8px;border-radius:8px;cursor:pointer;transition:background 0.2s;border-bottom:1px solid rgba(255,255,255,0.06);">
                    <div style="width:48px;height:48px;border-radius:8px;background-image:url('${pl.image_url||''}');background-size:cover;background-position:center;flex-shrink:0;${!pl.image_url?'background:rgba(255,255,255,0.08);':''}">
                      ${!pl.image_url ? html`<div style="display:flex;align-items:center;justify-content:center;width:48px;height:48px;"><ha-icon icon="${(providerIcons[g.label]||{}).icon||'mdi:playlist-music'}" style="--mdc-icon-size:24px;color:rgba(255,255,255,0.3);"></ha-icon></div>` : ''}
                    </div>
                    <div style="flex:1;min-width:0;">
                      <div style="font-size:13px;color:#fff;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${pl.name}</div>
                      <div style="font-size:11px;color:rgba(255,255,255,0.4);margin-top:2px;">${pl.track_count||''} 首</div>
                    </div>
                    <ha-icon icon="mdi:chevron-right" style="--mdc-icon-size:20px;color:rgba(255,255,255,0.3);flex-shrink:0;"></ha-icon>
                  </div>
                `)}
              </div>
            `)}
          </div>
          ` : ''}
          ${detail ? html`
          <div class="ma-search-results" style="padding:10px;">
            <button style="display:flex;align-items:center;justify-content:center;gap:6px;padding:10px;border-radius:8px;background:rgba(52,152,219,0.25);color:#3498db;font-size:14px;cursor:pointer;width:100%;margin-bottom:10px;border:1px solid rgba(52,152,219,0.3);"
                    @click=${()=>this.handleMaPlaylistPlay(detail)}>
              <ha-icon icon="mdi:play-circle" style="--mdc-icon-size:20px;"></ha-icon>
              播放全部
            </button>
            ${error ? html`<div class="ma-panel-empty" style="color:#e74c3c;">${error}</div>` : ''}
            ${tracksLoading ? html`<div class="ma-panel-loading"><ha-icon icon="mdi:loading" class="ma-spin"></ha-icon><span>加载歌曲...</span></div>` : tracks.length>0 ? tracks.map((t,idx)=>html`
              <div class="netease-recommended-item" @click=${()=>this.handleMaPlaylistTrackPlay(t)}
                   style="display:flex;align-items:center;gap:10px;padding:8px;border-radius:8px;cursor:pointer;transition:background 0.2s;border-bottom:1px solid rgba(255,255,255,0.05);">
                <div style="width:24px;text-align:center;font-size:12px;color:rgba(255,255,255,0.35);flex-shrink:0;">${idx+1}</div>
                ${t.image_url ? html`
                  <div style="width:36px;height:36px;border-radius:6px;background-image:url('${t.image_url}');background-size:cover;background-position:center;flex-shrink:0;"></div>
                ` : ''}
                <div style="flex:1;min-width:0;">
                  <div style="font-size:13px;color:#fff;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${t.name}</div>
                  <div style="font-size:11px;color:rgba(255,255,255,0.4);margin-top:1px;">${t.artist||''}${t.album?' · '+t.album:''}</div>
                </div>
                <ha-icon icon="${playingUri===t.uri?'mdi:loading':'mdi:play-circle'}" style="--mdc-icon-size:20px;color:${playingUri===t.uri?'#3498db':'rgba(255,255,255,0.25)'};flex-shrink:0;" class="${playingUri===t.uri?'ma-spin':''}"></ha-icon>
              </div>
            `) : html`<div class="ma-panel-empty">暂无歌曲</div>`}
          </div>
          ` : ''}
        </div>
      </div>
    `;
  }

}
customElements.define('xiaoshi-music-card', SunXiaoaiCard);