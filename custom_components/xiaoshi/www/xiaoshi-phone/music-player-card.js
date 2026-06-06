import { LitElement, html, css } from "https://unpkg.com/lit-element@2.4.0/lit-element.js?module";

class MusicPlayerEditor extends LitElement {
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
      }
    `;
  }

  render() {
    if (!this.hass) return html``;

    return html`
      <div class="form">
        <div class="form-group">
          <label>小米Home实体（主要控制实体）</label>
          <select 
            @change=${this._entityChanged}
            .value=${this.config.xiaomi_home || ''}
            name="xiaomi_home"
          >
            <option value="">选择小米Home实体</option>
            ${Object.keys(this.hass.states)
              .filter(entityId => entityId.startsWith('media_player.'))
              .map(entityId => html`
                <option value="${entityId}" 
                  .selected=${entityId === this.config.xiaomi_home}>
                  ${this.hass.states[entityId].attributes.friendly_name || entityId} ${this.hass.states[entityId].attributes.friendly_name ? '(' + entityId + ')' : ''}
                </option>
              `)}
          </select>
        </div>
        
        <div class="form-group">
          <label>小米Miot实体（备用实体）</label>
          <select 
            @change=${this._entityChanged}
            .value=${this.config.xiaomi_miot || ''}
            name="xiaomi_miot"
          >
            <option value="">选择小米Miot实体（可选）</option>
            ${Object.keys(this.hass.states)
              .filter(entityId => entityId.startsWith('media_player.'))
              .map(entityId => html`
                <option value="${entityId}" 
                  .selected=${entityId === this.config.xiaomi_miot}>
                  ${this.hass.states[entityId].attributes.friendly_name || entityId} ${this.hass.states[entityId].attributes.friendly_name ? '(' + entityId + ')' : ''}
                </option>
              `)}
          </select>
        </div>
        
        <div class="form-group">
          <label>主题</label>
          <select 
            @change=${this._entityChanged}
            .value=${this.config.theme !== undefined ? this.config.theme : 'system'}
            name="theme"
          >
            <option value="on">跟随系统</option>
            <option value="on">浅色主题（白底黑字）</option>
            <option value="off">深色主题（深灰底白字）</option>
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
          <label>卡片高度：排除歌词区域的高度，支持像素(px)和百分比(%)</label>
          <input 
            type="text" 
            @change=${this._entityChanged}
            .value=${this.config.height !== undefined ? this.config.height : '80px'}
            name="height"
            placeholder="默认80px"
          />
        </div>
        
        <div class="form-group">
          <label>歌词高度：歌词区域的高度，支持像素(px)和百分比(%)</label>
          <input 
            type="text" 
            @change=${this._entityChanged}
            .value=${this.config.lyrics_height !== undefined ? this.config.lyrics_height : '200px'}
            name="lyrics_height"
            placeholder="默认200px"
          />
        </div>
        
        <div class="form-group">
          <label>
            <input 
              type="checkbox" 
              @change=${this._entityChanged}
              .checked=${this.config.always_show_lyrics || false}
              name="always_show_lyrics"
            />
            总是显示歌词（勾选时一直显示歌词）
          </label>
        </div>
      </div>
    `;
  }

  _entityChanged(e) {
    const { name, value } = e.target;
    if (!value && name !== 'theme' && name !== 'width' && name !== 'height' && name !== 'lyrics_height') return;
    
    // 对于width字段，如果为空则使用默认值100%
    // 对于height字段，如果为空则使用默认值80px
    // 对于lyrics_height字段，如果为空则使用默认值18px
    let finalValue = value;
    if (name === 'width') {
      finalValue = value || '100%';
    } else if (name === 'height') {
      finalValue = value || '80px';
    } else if (name === 'lyrics_height') {
      finalValue = value || '200px';
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
customElements.define('xiaoshi-music-player-editor', MusicPlayerEditor);

class MusicPlayer extends LitElement {
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
      alwaysShowLyrics: { type: Boolean },
      showLyrics: { type: Boolean },
      lyrics: { type: Array },
      currentLyricIndex: { type: Number },
      lyricProgress: { type: Number }
    };
  }

  static get styles() {
    return css`
      :host {
        display: block;
        width: 100%;
        border-radius: 12px;
        padding: 0px;
        margin-top: 0;
        cursor: none;
        --mdc-ripple-press-opacity: 0;
      }

      .player-grid {
        display: grid;
        grid-template-columns: 17% 8.5% 8.5% 22% 8.5% 8.5% 8.5% 8.5% 8.5%;
        width: 100%;
        height: 100%;
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
        cursor: pointer;
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

      .lyrics-button {
        grid-area: lyrics-button;
        font-size: 12px;
        padding: 1px;
      }

      .lyrics-area {
        grid-area: lyrics;
        display: flex;
        align-items: stretch;
        justify-content: center;
        padding: 0;
        overflow: hidden;
        position: relative;
        max-height: 300px;
      }

      .lyrics-area:empty {
        display: none;
      }

      .lyrics-container {
        height: 100%;
        width: calc(100% - 50px); /* 为右侧按钮留出空间 */
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
        color: var(--fg-color, rgb(255, 255, 255));
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
          var(--fg-color, rgb(255, 255, 255)) var(--progress, 0%),
          var(--fg-color, rgb(255, 255, 255)) 100%
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

      .volume-down {
        grid-area: volume-down;
      }

      .volume-up {
        grid-area: volume-up;
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

      .progress-area {
        grid-area: progress;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 10px 0 0 0;
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
        cursor: pointer;
      }

      .volume-slider::-webkit-slider-thumb {
        -webkit-appearance: none;
        appearance: none;
        width: 13px;
        height: 13px;
        border-radius: 50%;
        background: rgb(255, 165, 0);
        cursor: pointer;
        border: 2px solid var(--fg-color, rgb(255, 255, 255));
        box-shadow: none;
      }

      .volume-slider::-moz-range-thumb {
        width: 10px;
        height: 10px;
        border-radius: 50%;
        background: rgb(255, 165, 0);
        cursor: pointer;
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
    this.volumeDebounceTimer = null;
    this.isDragging = false;
    this.localVolumeUpdate = false;
    this.theme = 'system';
    this.width = '100%';
    this.height = '80px';
    this.lyricsHeight = '200px';
    this.alwaysShowLyrics = false;
    this.showLyrics = false;
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
    this._initLyricsCache();
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

  _initLyricsCache() {
    try {
      const cached = localStorage.getItem("music_player_lyrics_cache");
      if (cached) {
        const cacheData = JSON.parse(cached);
        const now = Date.now();
        // 清理过期缓存（1小时）
        Object.keys(cacheData).forEach(key => {
          if (now - cacheData[key].timestamp > 3600000) {
            delete cacheData[key];
          }
        });
        this.lyricsCache = new Map(Object.entries(cacheData));
        this._saveCache();
      }
    } catch (error) {
      console.error("初始化歌词缓存失败:", error);
      this.lyricsCache = new Map();
    }
  }

  _checkSongChange(state) {
    if (!state || !state.attributes) return false;

    let currentTitle = state.attributes.media_title;
    let currentArtist = state.attributes.media_artist;

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

    // 检查歌曲是否发生变化
    if (currentTitle !== this._lastSongTitle || currentArtist !== this._lastSongArtist) {
      this._lastSongTitle = currentTitle;
      this._lastSongArtist = currentArtist;

      // 如果歌词显示开启且有歌曲信息，重新加载歌词
      if (this.showLyrics && currentTitle && currentArtist) {
        this.loadLyricsForCurrentSong();
      }
      
      return true; // 歌曲发生变化
    }
    
    return false; // 歌曲未变化
  }
  
  disconnectedCallback() {
    super.disconnectedCallback();
    // 清理防抖定时器
    if (this.volumeDebounceTimer) {
      clearTimeout(this.volumeDebounceTimer);
      this.volumeDebounceTimer = null;
    }
    // 清理歌词和平滑定时器
    this.stopLyricsTimer();
    this.stopSmoothTimer();
  }

  // Home Assistant 卡片必需的方法
  setConfig(config) {
    if (!config.xiaomi_home && !config.xiaomi_miot) {
      throw new Error('You need to define xiaomi_home or xiaomi_miot');
    }
    
    this._config = {
      xiaomi_home: config.xiaomi_home,
      xiaomi_miot: config.xiaomi_miot,
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
      this._config.height = '80px';
    }
    
    // 确保lyrics_height有默认值
    if (this._config.lyrics_height === undefined) {
      this._config.lyrics_height = '200px';
    }
    
    // 确保always_show_lyrics有默认值
    if (this._config.always_show_lyrics === undefined) {
      this._config.always_show_lyrics = false;
    }
    
    this.xiaomiHomeEntity = this._config.xiaomi_home;
    this.xiaomiMiotEntity = this._config.xiaomi_miot;
    this.width = this._config.width;
    this.height = this._config.height;
    this.lyricsHeight = this._config.lyrics_height;
    this.alwaysShowLyrics = this._config.always_show_lyrics;
    
    // 触发重新渲染以应用主题更改
    this.requestUpdate();
  }

  set hass(hass) {
    this._hass = hass;
    
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
    
    // 更新状态
    if (usePrimaryEntity && primaryState) {
      // 使用主实体
      this.xiaomiHomeState = primaryState;
      this.isPlaying = ['playing', 'Playing', '播放', '播放中', '正在播放'].includes(primaryState.state);
      
      // 只有在非本地更新时才从主实体获取音量
      if (!this.localVolumeUpdate && primaryState.attributes && primaryState.attributes.volume_level !== undefined) {
        this.volumeState = Math.round((primaryState.attributes.volume_level || 0) * 100);
      }
      
      // 检测歌曲切换并更新歌词
      const songChanged = this._checkSongChange(primaryState);
      
      // 如果歌曲发生变化或开始播放，重新初始化时间进度
      if (songChanged && this.isPlaying && this.showLyrics && this.lyrics.length > 0) {
        this.initSmoothTimeOnce();
      }
      
    } else if (backupState) {
      // 使用备用实体
      this.xiaomiMiotState = backupState;
      this.isPlaying = ['playing', 'Playing', '播放', '播放中', '正在播放'].includes(backupState.state);
      
      // 从备用实体获取音量
      if (!this.localVolumeUpdate && backupState.attributes && backupState.attributes.volume_level !== undefined) {
        this.volumeState = Math.round((backupState.attributes.volume_level || 0) * 100);
      }
      
      // 检测歌曲切换并更新歌词
      const songChanged = this._checkSongChange(backupState);
      
      // 如果歌曲发生变化，重新初始化时间进度
      if (songChanged && this.isPlaying && this.showLyrics && this.lyrics.length > 0) {
        this.initSmoothTimeOnce();
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
    
    // 如果启用了"总是显示歌词"且当前未显示歌词，则自动显示
    if (this.alwaysShowLyrics && !this.showLyrics) {
      this.showLyrics = true;
      // 首次自动显示歌词时尝试加载真实歌词
      if (this.lyrics.length === 0) {
        this.loadLyricsForCurrentSong();
      }
    }
    
    // 更新歌词定时器状态
    if (this.showLyrics) {
      this.startLyricsTimer();
    }
    
    // 重置本地更新标志
    this.localVolumeUpdate = false;
    
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
    return document.createElement("xiaoshi-music-player-editor");
  }

  static getStubConfig() {
    return {
      xiaomi_home: "media_player.xiaomi_home",
      xiaomi_miot: "media_player.xiaomi_speaker",
      theme: "system",
      width: "100%",
      height: "80px",
      lyrics_height: "200px",
      always_show_lyrics: false
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

  _handleClick(){
    const hapticEvent = new Event('haptic', {
      bubbles: true,
      cancelable: false,
      composed: true
    });
    hapticEvent.detail = 'light';
    this.dispatchEvent(hapticEvent);
  }

  handlePower() {
    this._handleClick();
    const targetEntity = this.xiaomiHomeEntity || this.xiaomiMiotEntity;
    this.callService('media_player.media_pause', {
      entity_id: targetEntity
    });
  }

  handleVolumeDown() {
    this._handleClick();
    const newVolume = Math.max(0, this.volumeState - 1);
    
    this.updateVolume(newVolume);
    
    // 同时设置主实体和备用实体音量
    if (this.xiaomiHomeEntity) {
      this.callService('media_player.volume_set', {
        entity_id: this.xiaomiHomeEntity,
        volume_level: newVolume / 100
      });
    }
    
    if (this.xiaomiMiotEntity) {
      this.callService('media_player.volume_set', {
        entity_id: this.xiaomiMiotEntity,
        volume_level: newVolume / 100
      });
    }
  }

  handleVolumeUp() {
    this._handleClick();
    const newVolume = Math.min(100, this.volumeState + 1);
    
    this.updateVolume(newVolume);
    
    // 同时设置主实体和备用实体音量
    if (this.xiaomiHomeEntity) {
      this.callService('media_player.volume_set', {
        entity_id: this.xiaomiHomeEntity,
        volume_level: newVolume / 100
      });
    }
    
    if (this.xiaomiMiotEntity) {
      this.callService('media_player.volume_set', {
        entity_id: this.xiaomiMiotEntity,
        volume_level: newVolume / 100
      });
    }
  }

  handleLyricsToggle() {
    this._handleClick();
    
    // 如果启用了"总是显示歌词"，则不允许关闭歌词
    if (this.alwaysShowLyrics) {
      return;
    }
    
    this.showLyrics = !this.showLyrics;
    
    // 打开歌词时，重新获取实体中的当前进度
    if (this.showLyrics) {
      // 重新初始化时间进度（获取当前实体进度）
      this.initSmoothTimeOnce();
      
      // 首次打开歌词时尝试加载真实歌词
      if (this.lyrics.length === 0) {
        this.loadLyricsForCurrentSong();
      } else {
        // 如果已有歌词，立即更新当前歌词索引
        if (this.smoothCurrentTime > 0) {
          this.updateCurrentLyricIndex(this.smoothCurrentTime);
        }
      }
    }
    
    this.requestUpdate();
    
    // 打开歌词时，如果有当前歌词，滚动到对应位置
    if (this.showLyrics && this.currentLyricIndex >= 0) {
      setTimeout(() => this.scrollToCurrentLyric(), 200);
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
    const primaryState = this.xiaomiHomeState || this.xiaomiMiotState;
    if (!primaryState || !primaryState.attributes) {
      this.loadNoLyrics();
      return;
    }

    let title = primaryState.attributes.media_title;
    let artist = primaryState.attributes.media_artist;
    let sourceEntity = "主实体";

    // 如果主实体没有歌曲信息，尝试从备用实体获取
    if (!title || !artist) {
      
      const backupState = primaryState === this.xiaomiHomeState ? this.xiaomiMiotState : this.xiaomiHomeState;
      
      if (backupState && backupState.attributes) {
        const backupTitle = backupState.attributes.media_title;
        const backupArtist = backupState.attributes.media_artist;
        
        if (backupTitle && backupArtist) {
          title = backupTitle;
          artist = backupArtist;
          sourceEntity = "备用实体";
        }
      }
    }

    if (!title || !artist) {
      this.loadNoLyrics();
      return;
    }

    try {
      await this.searchAndFetchLyrics(title, artist);
    } catch (error) {
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
      console.error(`获取歌词失败: ${error.message}`);
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
          console.error(`搜索尝试 ${i + 1} 失败: ${error.message}`);
          if (i === searchAttempts.length - 1) {
            throw error;
          }
        }
      }
      
      throw new Error("未找到歌词");
    } catch (error) {
      console.error(`搜索歌词失败: ${error.message}`);
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
      console.info(`缓存歌词: ${cacheKey}`);
    } catch (error) {
      console.error(`缓存歌词失败: ${error.message}`);
    }
  }

  async _checkCache(cacheKey) {
    if (!this.lyricsCache) {
      this.lyricsCache = new Map();
    }
    
    const cached = this.lyricsCache.get(cacheKey);
    if (cached) {
      if (cached.lyrics && !cached.lyrics.includes("搜索歌曲失败") && cached.lyrics.trim()) {
        cached.timestamp = Date.now();
        this.lyricsCache.set(cacheKey, cached);
        this._saveCache();
        console.info(`使用缓存的歌词: ${cacheKey}`);
        return cached.lyrics;
      }
      this.lyricsCache.delete(cacheKey);
      this._saveCache();
      console.info(`删除无效的歌词缓存: ${cacheKey}`);
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
      console.error(`保存缓存失败: ${error.message}`);
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
      
      // 同时设置主实体和备用实体音量
      if (this.xiaomiHomeEntity) {
        this.callService('media_player.volume_set', {
          entity_id: this.xiaomiHomeEntity,
          volume_level: newVolume / 100
        });
      }
      
      if (this.xiaomiMiotEntity) {
        this.callService('media_player.volume_set', {
          entity_id: this.xiaomiMiotEntity,
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
      
      // 立即调用服务（不等待防抖）
      const newVolume = parseInt(e.target.value);
      
      // 清理防抖定时器
      if (this.volumeDebounceTimer) {
        clearTimeout(this.volumeDebounceTimer);
        this.volumeDebounceTimer = null;
      }
      
      // 震动反馈
      this._handleClick();
      
      // 同时设置主实体和备用实体音量
      if (this.xiaomiHomeEntity) {
        this.callService('media_player.volume_set', {
          entity_id: this.xiaomiHomeEntity,
          volume_level: newVolume / 100
        });
      }
      
      if (this.xiaomiMiotEntity) {
        this.callService('media_player.volume_set', {
          entity_id: this.xiaomiMiotEntity,
          volume_level: newVolume / 100
        });
      }
    }
  }

  handlePrevious() {
    this._handleClick();
    const targetEntity = this.xiaomiHomeEntity || this.xiaomiMiotEntity;
    this.callService('media_player.media_previous_track', {
      entity_id: targetEntity
    });
  }

  handlePlayPause() {
    this._handleClick();
    const targetEntity = this.xiaomiHomeEntity || this.xiaomiMiotEntity;
    this.callService('media_player.media_play_pause', {
      entity_id: targetEntity
    });
  }

  handlePause() {
    this._handleClick();
    const targetEntity = this.xiaomiHomeEntity || this.xiaomiMiotEntity;
    this.callService('media_player.media_pause', {
      entity_id: targetEntity
    });
  }

  handleNext() {
    this._handleClick();
    const targetEntity = this.xiaomiHomeEntity || this.xiaomiMiotEntity;
    this.callService('media_player.media_next_track', {
      entity_id: targetEntity
    });
  }

  getProgressPercentage() {
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
        // 主实体有图片，备用实体无图片，使用主实体
        displayState = primaryState;
      } else if (!primaryPicture && backupPicture) {
        // 主实体无图片，备用实体有图片，使用备用实体
        displayState = backupState;
      } else if (primaryPicture && backupPicture) {
        // 两个实体都有图片，优先使用主实体
        displayState = primaryState;
      } else {
        // 两个实体都没有图片，按原有逻辑选择（优先主实体）
        displayState = primaryState.state === 'unavailable' ? backupState : primaryState;
      }
    } else if (primaryState) {
      // 只有主实体存在
      displayState = primaryState;
    } else if (backupState) {
      // 只有备用实体存在
      displayState = backupState;
    }
    
    // 如果都没有，使用本地状态
    if (!displayState) {
      displayState = this.xiaomiHomeState || this.xiaomiMiotState;
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
          min-width: ${this.width};
          max-width: ${this.width};
        }

        .player-grid {
          padding: 10px 0;
          height: ${this.height};
          min-height: ${this.height};
          max-height: ${this.height};
          grid-template-rows: ${this.showLyrics ? '33% 33% 33%' : '33% 33% 33%'};
          grid-template-areas: 
            "icon name name name name name name . power"
            "icon info info info info info info lyrics-button lyrics-button"
            "icon volume volume-down volume-slider volume-up prev play pause next";
        }

        .lyrics-area {
          display: flex;
          align-items: stretch;
          justify-content: center;
          padding: 0;
          overflow: hidden;
          position: relative;
          height: ${this.lyricsHeight};
          width: 100%;
        }

        .lyrics-area:empty {
          display: none;
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

        <!-- 控制按钮 -->
        <button class="control-button power-button" @click=${this.handlePower}>
          <ha-icon icon="mdi:power"></ha-icon>
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

        <button 
          class="control-button lyrics-button" 
          @click=${this.handleLyricsToggle}
          ?disabled=${this.alwaysShowLyrics}
          style=${this.alwaysShowLyrics ? 'opacity: 0.5; cursor: not-allowed;' : ''}
          title=${this.alwaysShowLyrics ? '已启用"总是显示歌词"，歌词无法关闭' : (this.showLyrics ? '关闭歌词' : '打开歌词')}
        >
          ${this.alwaysShowLyrics ? '歌词已锁定' : (this.showLyrics ? '关闭歌词' : '打开歌词')}
        </button>
      </div>

      <!-- 歌词区域 (独立于主网格) -->
      ${this.showLyrics ? html`
        <div class="lyrics-area">
          <!-- 歌词容器 -->
          <div class="lyrics-container">
            <div class="lyrics-top-spacer"></div>
            ${this.lyrics.length > 0 ? this.lyrics.map((lyric, index) => html`
              <div 
                class="lyric ${index === this.currentLyricIndex ? 'active' : ''}"
                style="${index === this.currentLyricIndex ? `--progress: ${this.lyricProgress * 100}%;` : ''}"
              >
                ${lyric.text}
              </div>
            `) : html`
              <div class="lyric">暂无歌词</div>
            `}
            <div class="lyrics-spacer"></div>
          </div>
          
          <!-- 歌词控制按钮 -->
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
            <div 
              class="lyrics-adjustment-toast ${this.adjustmentToast.show ? 'show' : ''}"
              id="lyrics-toast"
            >
              ${this.adjustmentToast.message}
            </div>
          </div>
        </div>
      ` : ''}

      <!-- 进度条 (独立于主网格) -->
      <div class="progress-area">
        <div 
          class="progress-bar"
          style="--progress-percentage: ${progressPercentage}%"
        ></div>
      </div>
    `;
  }
}
customElements.define('xiaoshi-music-player', MusicPlayer);
 
window.customCards = window.customCards || [];
window.customCards.push({
  type: "xiaoshi-music-player",
  name: "音乐播放器",
  description: "一个功能完整的音乐播放器控制卡片",
  preview: true,
  documentationURL: "https://github.com/xiaoshi930/music_player"
});





