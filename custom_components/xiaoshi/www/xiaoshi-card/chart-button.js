import { LitElement, html, css } from "https://unpkg.com/lit-element@2.4.0/lit-element.js?module";

window.customCards = window.customCards || [];
window.customCards.push({
    type: 'xiaoshi-chart-button',
    name: '消逝温湿度曲线按钮',
    description: '消逝温湿度曲线按钮（点击弹出曲线卡片）',
    preview: true
});

class XiaoshChartButtonEditor extends LitElement {
  static get properties() {
    return {
      hass: { type: Object },
      config: { type: Object },
    };
  }

  setConfig(config) {
    this.config = config || {};
  }

  get _entities() { return this.config?.entities || []; }
  get _merge() { return this.config?.merge === true; }
  get _mergeName() { return this.config?.mergename || ""; }
  get _mergeColor() { return this.config?.mergecolor || ""; }
  get _theme() { return this.config?.theme || "on"; }
  get _unit() { return this.config?.unit || ""; }
  get _filterText() { return this.config?._filterText || ""; }

  _themeChanged(ev) { this._update({ theme: ev.target.value }); }
  _unitChanged(ev) { this._update({ unit: ev.target.value }); }
  _toggleMerge(ev) { this._update({ merge: ev.target.checked }); }
  _mergeNameChanged(ev) { this._update({ mergename: ev.target.value }); }
  _mergeColorChanged(ev) { this._update({ mergecolor: ev.target.value }); }
  _filterChanged(ev) { this._update({ _filterText: ev.target.value }); }

  _addEntity(eid) {
    let list = [...(this.config?.entities || [])].map(item =>
      typeof item === "string" ? { entity: item } : { ...item }
    );
    if (!list.find(item => item.entity === eid)) {
      list.push({ entity: eid });
    }
    this._update({ entities: list, _filterText: "" });
  }

  _removeEntity(eid) {
    let list = [...(this.config?.entities || [])].map(item =>
      typeof item === "string" ? { entity: item } : { ...item }
    ).filter(item => item.entity !== eid);
    this._update({ entities: list });
  }

  _updateEntityConfig(eid, patch) {
    let list = [...(this.config?.entities || [])].map(item =>
      typeof item === "string" ? { entity: item } : { ...item }
    );
    const idx = list.findIndex(item => item.entity === eid);
    if (idx !== -1) {
      list[idx] = { ...list[idx], ...patch };
    }
    this._update({ entities: list });
  }

  _getEntityConfig(eid) {
    const item = (this.config?.entities || []).find(e =>
      (typeof e === "string" ? e : e.entity) === eid
    );
    return typeof item === "string" ? { entity: item } : (item || {});
  }

  _entityChanged(e) {
    const { name, value, type, checked } = e.target;
    let finalValue;
    if (type === 'checkbox') {
      finalValue = checked;
    } else {
      if (!value && name !== 'theme' && name !== 'button_width' && name !== 'button_height'
        && name !== 'button_font_size' && name !== 'button_icon_size'
        && name !== 'popup_width' && name !== 'popup_top' && name !== 'tap_action') return;
      finalValue = value;
    }
    if (name === 'button_width') { finalValue = value || '16.8vw'; }
    else if (name === 'button_height') { finalValue = value || '24px'; }
    else if (name === 'button_font_size') { finalValue = value || '11px'; }
    else if (name === 'button_icon_size') { finalValue = value || '13px'; }
    else if (name === 'tap_action') {
      if (value === 'tap_action') { finalValue = undefined; }
      else { finalValue = value; }
    }

    this.config = { ...this.config, [name]: finalValue };
    this.dispatchEvent(new CustomEvent('config-changed', {
      detail: { config: this.config }, bubbles: true, composed: true
    }));
  }

  _update(patch) {
    const next = { ...this.config, ...patch };
    this.config = next;
    this.dispatchEvent(new CustomEvent("config-changed", {
      detail: { config: next }, bubbles: true, composed: true,
    }));
  }

  render() {
    const allCandidates = Object.keys(this.hass?.states || {})
      .filter(eid => eid.startsWith("sensor."))
      .sort();

    const filter = (this._filterText || "").toLowerCase();
    const candidates = filter
      ? allCandidates.filter(eid => {
          const st = this.hass.states[eid];
          const name = (st?.attributes?.friendly_name || eid).toLowerCase();
          return eid.toLowerCase().includes(filter) || name.includes(filter);
        })
      : allCandidates;

    const selectedEids = this._entities.map(item =>
      typeof item === "string" ? item : item.entity
    );

    return html`

      <!-- button新元素 开始-->

      <div class="form-group">
        <label>按钮显示 Emoji（留空则自动判断）
        <input
          type="text"
          @change=${this._entityChanged}
          .value=${this.config.emoji || ''}
          name="emoji"
          placeholder="例如：🌡️ 留空自动判断"
        /></label>
      </div>

      <div class="checkbox-group">
        <input
          type="checkbox"
          class="checkbox-input"
          @change=${this._entityChanged}
          .checked=${this.config.transparent_bg === true}
          name="transparent_bg"
          id="transparent_bg"
        />
        <label for="transparent_bg" class="checkbox-label">
          （平板端特性）透明背景（勾选后按钮背景透明）
        </label>
      </div>

      <div class="checkbox-group">
        <input
          type="checkbox"
          class="checkbox-input"
          @change=${this._entityChanged}
          .checked=${this.config.lock_white_fg === true}
          name="lock_white_fg"
          id="lock_white_fg"
        />
        <label for="lock_white_fg" class="checkbox-label">
        （平板端特性）白色图标文字（勾选后锁定显示白色）
        </label>
      </div>

      <div class="checkbox-group">
        <input
          type="checkbox"
          class="checkbox-input"
          @change=${this._entityChanged}
          .checked=${this.config.hide_icon === true}
          name="hide_icon"
          id="hide_icon"
        />
        <label for="hide_icon" class="checkbox-label">
        （ 平板端特性）隐藏图标（勾选后隐藏图标）
        </label>
      </div>

      <div class="form-group">
        <label>按钮宽度：默认16.8vw, 支持像素(px)和百分比(%)</label>
        <input
          type="text"
          @change=${this._entityChanged}
          .value=${this.config.button_width !== undefined ? this.config.button_width : '16.8vw'}
          name="button_width"
          placeholder="默认16.8vw"
        />
      </div>

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

      <div class="form-group">
        <label>按钮图标大小：支持像素(px)，默认13px</label>
        <input
          type="text"
          @change=${this._entityChanged}
          .value=${this.config.button_icon_size !== undefined ? this.config.button_icon_size : '13px'}
          name="button_icon_size"
          placeholder="默认13px"
        />
      </div>

      <div class="form-group">
        <label>点击动作：点击按钮时触发的动作</label>
        <select
          @change=${this._entityChanged}
          .value=${this.config.tap_action !== 'none' ? 'tap_action' : 'none'}
          name="tap_action"
        >
          <option value="tap_action">弹出曲线卡片（默认）</option>
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
template: 测试模板(最好引用模板，否则大概率会报错)'>
        </textarea>
      </div>

      <div class="checkbox-group">
        <input
          type="checkbox"
          class="checkbox-input"
          @change=${this._entityChanged}
          .checked=${this.config.no_preview === true}
          name="no_preview"
          id="no_preview"
        />
        <label for="no_preview" class="checkbox-label" style="color: red;">
          📻显示预览📻（ 请先勾选测试显示效果 ）
        </label>
      </div>


        <div class="form-group">
          <label> </label>
          <label>👇👇👇下方是弹出的主卡配置项👇👇👇</label>
          <label> </label>
        </div>

        <div class="form-group">
          <label>弹窗宽度：支持像素(px)、百分比(%)和auto，默认auto</label>
          <input
            type="text"
            @change=${this._entityChanged}
            .value=${this.config.popup_width !== undefined ? this.config.popup_width : 'auto'}
            name="popup_width"
            placeholder="默认auto"
          />
        </div>

        <div class="form-group">
          <label>弹窗位置：支持百分比(%)，默认50%居中</label>
          <input
            type="text"
            @change=${this._entityChanged}
            .value=${this.config.popup_top !== undefined ? this.config.popup_top : '50%'}
            name="popup_top"
            placeholder="默认50%"
          />
        </div>

      <!-- button新元素 结束-->

      <div class="editor-root">
        <div class="field">
          <label class="label">主题</label>
          <select class="select" .value=${this._theme} @change=${this._themeChanged}>
            <option value="on">亮色 (Light)</option>
            <option value="off">暗色 (Dark)</option>
          </select>
        </div>

        <div class="field">
          <label class="label">单位（留空则自动获取）</label>
          <input class="filter-input" type="text"
            placeholder="自动从第一个实体获取"
            .value=${this._unit}
            @input=${this._unitChanged} />
        </div>

        <div class="field">
          <label class="row">
            <input type="checkbox" .checked=${this._merge} @change=${this._toggleMerge} />
            <span class="row-name">合并显示（取平均值）</span>
          </label>
        </div>

        ${this._merge ? html`
          <div class="field merge-config">
            <label class="label" style="margin-top:8px;">平均值曲线名称 / 颜色</label>
            <div class="custom-row">
              <input class="custom-input" type="text"
                placeholder="平均值"
                .value=${this._mergeName}
                @input=${this._mergeNameChanged} />
              <input class="custom-color" type="color"
                .value=${this._mergeColor}
                @input=${this._mergeColorChanged} />
              ${this._mergeColor ? html`
                <button class="custom-reset" @click=${() => this._update({ mergecolor: "" })} title="恢复默认颜色">↺</button>
              ` : ""}
            </div>
          </div>
        ` : ""}

        <div class="field">
          <label class="label">筛选实体（sensor，可多选）</label>
          ${selectedEids.length > 0 ? html`
            <div class="chip-list">
              ${selectedEids.map(eid => html`
                <span class="chip" @click=${() => this._removeEntity(eid)} title="点击移除">
                  ${eid} <span class="chip-x">×</span>
                </span>
              `)}
            </div>
          ` : ""}
          <input class="filter-input" type="text"
            placeholder="搜索实体名称或 ID..."
            .value=${this._filterText}
            @input=${this._filterChanged} />
          ${this._filterText ? html`
            <div class="list-box">
              ${candidates.length === 0
                ? html`<div class="hint">无匹配实体</div>`
                : candidates.map(eid => {
                    const st = this.hass.states[eid];
                    const name = st?.attributes?.friendly_name || eid;
                    const added = selectedEids.includes(eid);
                    return html`
                      <div class="row" @click=${added ? null : () => this._addEntity(eid)} style=${added ? "opacity:0.4;cursor:default;" : ""}>
                        <span class="row-name">${name}</span>
                        <span class="row-id">${eid}</span>
                        ${added ? html`<span class="row-added">已添加</span>` : ""}
                      </div>`;
                  })}
            </div>
          ` : ""}
        </div>

        ${selectedEids.length > 0 ? html`
          <div class="field">
            <label class="label">自定义名称 / 颜色</label>
            ${selectedEids.map(eid => {
              const st = this.hass.states[eid];
              const defaultName = st?.attributes?.friendly_name || eid;
              const cfg = this._getEntityConfig(eid);
              const customName = cfg.name || "";
              const customColor = cfg.color || "";
              return html`
                <div class="custom-row">
                  <div class="custom-entity-id">${eid}</div>
                  <input class="custom-input" type="text"
                    placeholder="${defaultName}"
                    .value=${customName}
                    @input=${(ev) => this._updateEntityConfig(eid, { name: ev.target.value || undefined })} />
                  <input class="custom-color" type="color"
                    .value=${customColor}
                    @input=${(ev) => this._updateEntityConfig(eid, { color: ev.target.value || undefined })} />
                  ${customColor ? html`
                    <button class="custom-reset" @click=${() => this._updateEntityConfig(eid, { color: undefined })} title="恢复默认颜色">↺</button>
                  ` : ""}
                </div>`;
            })}
          </div>
        ` : ""}
      </div>
    `;
  }

  static get styles() {
    return css`
      .checkbox-group {
        display: flex; align-items: center; gap: 0; margin: 0; padding: 0;
      }
      .checkbox-input { margin: 0; }
      .checkbox-label { font-weight: normal; margin: 0; }
      .form-group {
        display: flex; flex-direction: column; gap: 5px; margin-bottom: 10px;
      }
      label { font-weight: bold; }
      select, input, textarea {
        padding: 8px; border: 1px solid #ddd; border-radius: 4px;
      }
      textarea { min-height: 80px; resize: vertical; }
      .editor-root { padding: 6px 0; }
      .field { margin-bottom: 16px; }
      .label { display:block; font-weight:600; margin-bottom:6px; color:var(--primary-text-color); }
      .select {
        width:100%; padding:8px; border-radius:6px;
        border:1px solid var(--divider-color, #ccc);
        background:var(--card-background-color, #fff);
        color:var(--primary-text-color); font-size:14px;
      }
      .filter-input {
        width:100%; padding:8px 10px; border-radius:6px;
        border:1px solid var(--divider-color, #ccc);
        background:var(--card-background-color, #fff);
        color:var(--primary-text-color); font-size:13px;
        box-sizing:border-box;
      }
      .chip-list {
        display:flex; flex-wrap:wrap; gap:6px; margin-bottom:8px;
      }
      .chip {
        display:inline-flex; align-items:center; gap:3px;
        padding:3px 8px; border-radius:12px; font-size:0.75em;
        background:var(--secondary-background-color, #e0e0e0);
        color:var(--primary-text-color); cursor:pointer;
        max-width:200px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;
      }
      .chip:hover { background:var(--divider-color, #ccc); }
      .chip-x { font-size:1.1em; font-weight:bold; opacity:0.5; }
      .list-box {
        max-height:300px; overflow-y:auto; border-radius:6px;
        border:1px solid var(--divider-color, #ccc);
        background:var(--card-background-color, #fff);
      }
      .row {
        display:flex; align-items:center; gap:8px; padding:6px 10px;
        cursor:pointer; border-bottom:1px solid var(--divider-color, #eee);
      }
      .row:last-child { border-bottom:none; }
      .row:hover { background:var(--secondary-background-color, #f5f5f5); }
      .row-name { flex:1; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
      .row-id { font-size:0.75em; color:var(--secondary-text-color); flex-shrink:0; }
      .row-added { font-size:0.7em; color:var(--secondary-text-color); flex-shrink:0; }
      .hint { padding:20px; text-align:center; color:var(--secondary-text-color); }
      .custom-row {
        display:flex; align-items:center; gap:8px; padding:8px 0;
        border-bottom:1px solid var(--divider-color, #eee);
      }
      .custom-row:last-child { border-bottom:none; }
      .custom-entity-id {
        font-size:0.75em; color:var(--secondary-text-color);
        min-width:120px; max-width:140px; overflow:hidden;
        text-overflow:ellipsis; white-space:nowrap;
      }
      .custom-input {
        flex:1; padding:6px 8px; border-radius:4px;
        border:1px solid var(--divider-color, #ccc);
        background:var(--card-background-color, #fff);
        color:var(--primary-text-color); font-size:13px;
        min-width:0;
      }
      .custom-color {
        width:32px; height:28px; padding:2px; border-radius:4px;
        border:1px solid var(--divider-color, #ccc);
        cursor:pointer; flex-shrink:0;
      }
      .custom-reset {
        background:none; border:none; color:var(--secondary-text-color);
        cursor:pointer; font-size:14px; padding:2px 4px;
      }
      .merge-config {
        padding:8px; border-radius:6px;
        background:var(--secondary-background-color, #f5f5f5);
      }
    `;
  }
}
customElements.define("xiaoshi-chart-button-editor", XiaoshChartButtonEditor);

class XiaoshChartButton extends LitElement {
  static get properties() {
    return {
      hass: Object,
      config: Object,
      _chartSeries: { type: Array },
    };
  }

  constructor() {
    super();
    this._chartSeries = [];
    // 弹窗
    this._popupOverlay = null;
    this._popupElement = null;
    this._popupCardElement = null;
    this._popupEscHandler = null;
    this._popupHassUnsubscribe = null;
    this._popupUpdatePending = false;
    this._popupHass = null;
  }

  /* ---------- HA 协议 ---------- */
  static getConfigElement() {
    return document.createElement("xiaoshi-chart-button-editor");
  }

  static getStubConfig() {
    return {
      type: "custom:xiaoshi-chart-button",
      entities: [],
      merge: false,
    };
  }

  setConfig(config) {
    // button新元素 开始
    // 不设置默认值，只有明确配置时才添加 no_preview
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
      this.style.setProperty('--button-icon-size', '13px');
    }

    if (config.popup_width) {
      this.style.setProperty('--card-width', config.popup_width);
    } else {
      this.style.setProperty('--card-width', '100%');
    }
    // button新元素 结束

    if (config.theme) {
      this.setAttribute('theme', config.theme);
    }
  }

  getCardSize() {
    return 1;
  }

  /* ---------- 主题 ---------- */
  _evaluateTheme() {
    try {
      if (!this.config || !this.config.theme) return 'on';
      if (typeof this.config.theme === 'function') {
          return this.config.theme();
      }
      if (typeof this.config.theme === 'string' &&
              (this.config.theme.includes('return') || this.config.theme.includes('=>'))) {
          return (new Function(`return ${this.config.theme}`))();
      }
      return this.config.theme;
    } catch(e) {
      console.error('计算主题时出错:', e);
      return 'on';
    }
  }

  /* ---------- 数据工具（与 chart-card 一致） ---------- */
  _getValue(entityId, hassObj) {
    const h = hassObj || this.hass;
    if (!h) return null;
    const state = h.states[entityId];
    if (!state) return null;
    return parseFloat(state.state);
  }

  _getName(entityId) {
    const cfg = this._getEntityConfig(entityId);
    if (cfg && cfg.name) return cfg.name;
    if (!this.hass) return entityId;
    return this.hass.states[entityId]?.attributes?.friendly_name || entityId;
  }

  _getEntityConfig(entityId) {
    if (!this.config || !this.config.entities) return null;
    const item = this.config.entities.find(e =>
      (typeof e === "string" ? e : e.entity) === entityId
    );
    return typeof item === "string" ? null : (item || null);
  }

  _getColor(entityId, defaultColor) {
    const cfg = this._getEntityConfig(entityId);
    if (cfg && cfg.color) return cfg.color;
    return defaultColor;
  }

  _getUnit() {
    if (this.config?.unit) return this.config.unit;
    const eid = (this.config?.entities || [])[0]?.entity;
    if (eid && this.hass) {
      return this.hass.states[eid]?.attributes?.unit_of_measurement || "";
    }
    return "";
  }

  _fmt(v) {
    if (v === null || v === undefined || isNaN(v)) return "--";
    return v.toFixed(1);
  }

  /* ---------- 历史数据 + Canvas 绘制（与 chart-card 一致） ---------- */
  firstUpdated() {
    this._fetchHistoryAndDraw();
  }

  updated(changedProps) {
    if (changedProps.has("hass") || changedProps.has("config")) {
      this._fetchHistoryAndDraw();
    }
    if (changedProps.has("_chartSeries")) {
      const canvas = this.shadowRoot?.querySelector("#chart-canvas");
      if (canvas) {
        requestAnimationFrame(() => this._drawChart(canvas));
      }
    }
  }

  async _fetchHistoryAndDraw() {
    if (!this.config || !this.hass || !this.config.entities) return;

    const now = new Date();
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const entityIds = (this.config.entities || []).map(item => item.entity);

    try {
      const historyResult = await this.hass.callWS({
        type: "history/history_during_period",
        start_time: yesterday.toISOString(),
        end_time: now.toISOString(),
        entity_ids: entityIds,
        significant_changes_only: false,
        minimal_response: true,
        no_attributes: true,
      });

      const parseHistoryEntry = (entry) => {
        const v = parseFloat(entry.s);
        if (isNaN(v)) return null;
        const ts = (entry.lu || entry.last_changed) ? new Date((entry.lu || entry.last_changed) * (entry.lu ? 1000 : 1)).getTime() : Date.now();
        return { t: ts, v };
      };

      let series;

      if (this.config.merge && entityIds.length > 1) {
        const allPoints = [];
        for (const eid of entityIds) {
          const history = historyResult?.[eid] || [];
          for (const entry of history) {
            const pt = parseHistoryEntry(entry);
            if (pt) allPoints.push(pt);
          }
        }
        allPoints.sort((a, b) => a.t - b.t);
        const bucketMs = 5 * 60 * 1000;
        const buckets = {};
        for (const pt of allPoints) {
          const key = Math.floor(pt.t / bucketMs) * bucketMs;
          if (!buckets[key]) buckets[key] = { sum: 0, count: 0, min: pt.v, max: pt.v };
          buckets[key].sum += pt.v;
          buckets[key].count++;
          if (pt.v < buckets[key].min) buckets[key].min = pt.v;
          if (pt.v > buckets[key].max) buckets[key].max = pt.v;
        }
        const avgValues = [];
        const rangeMinValues = [];
        const rangeMaxValues = [];
        Object.entries(buckets).forEach(([key, { sum, count, min, max }]) => {
          const t = parseInt(key);
          const avg = sum / count;
          avgValues.push({ t, v: avg });
          rangeMinValues.push({ t, v: min });
          rangeMaxValues.push({ t, v: max });
        });
        avgValues.sort((a, b) => a.t - b.t);
        rangeMinValues.sort((a, b) => a.t - b.t);
        rangeMaxValues.sort((a, b) => a.t - b.t);

        const mergeColor = this.config.mergecolor || XiaoshChartCard.COLORS[0];
        series = [{
          entityId: "_average_",
          name: this.config.mergename || "平均值",
          values: avgValues,
          rangeMin: rangeMinValues,
          rangeMax: rangeMaxValues,
          color: mergeColor,
        }];
      } else {
        series = [];
        for (let idx = 0; idx < entityIds.length; idx++) {
          const eid = entityIds[idx];
          const history = historyResult?.[eid] || [];
          const values = [];
          for (const entry of history) {
            const pt = parseHistoryEntry(entry);
            if (pt) values.push(pt);
          }
          const defaultColor = XiaoshChartCard.COLORS[series.length % XiaoshChartCard.COLORS.length];
          series.push({
            entityId: eid,
            name: this._getName(eid),
            values,
            color: this._getColor(eid, defaultColor),
          });
        }
      }

      this._chartSeries = series;
    } catch (e) {
      // silent fail
    }
  }

  _drawChart(canvas) {
    const series = this._chartSeries || [];
    if (!canvas || series.length === 0) return;

    const scale = window.devicePixelRatio || 1;
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;
    if (width === 0 || height === 0) return;

    canvas.style.width = width + "px";
    canvas.style.height = height + "px";
    canvas.width = Math.floor(width * scale);
    canvas.height = Math.floor(height * scale);

    const ctx = canvas.getContext("2d");
    ctx.scale(scale, scale);
    ctx.clearRect(0, 0, width, height);

    const pad = { top: 14, right: 6, bottom: 30, left: 24 };
    const cw = width - pad.left - pad.right;
    const ch = height - pad.top - pad.bottom;

    let t0 = Infinity, t1 = -Infinity;
    series.forEach(s => {
      if (s.values.length === 0) return;
      if (s.values[0].t < t0) t0 = s.values[0].t;
      if (s.values[s.values.length - 1].t > t1) t1 = s.values[s.values.length - 1].t;
    });
    if (t0 >= t1) t1 = t0 + 60000;
    // 补齐终点：所有曲线延长到全局 t1，保持时间轴对齐
    series.forEach(s => {
      if (s.values.length > 0 && s.values[s.values.length - 1].t < t1 - 60000) {
        s.values.push({ t: t1, v: s.values[s.values.length - 1].v });
      }
      if (s.rangeMax && s.rangeMax.length > 0 && s.rangeMax[s.rangeMax.length - 1].t < t1 - 60000) {
        s.rangeMax.push({ t: t1, v: s.rangeMax[s.rangeMax.length - 1].v });
      }
      if (s.rangeMin && s.rangeMin.length > 0 && s.rangeMin[s.rangeMin.length - 1].t < t1 - 60000) {
        s.rangeMin.push({ t: t1, v: s.rangeMin[s.rangeMin.length - 1].v });
      }
    });

    const x = (t) => pad.left + ((t - t0) / (t1 - t0)) * cw;

    const _buildSmoothPath = (ctx, pts, yFn) => {
      const n = pts.length;
      if (n === 0) return;
      const px = i => x(pts[i].t);
      const py = i => yFn(pts[i].v);
      ctx.moveTo(px(0), py(0));
      if (n === 1) return;
      if (n === 2) { ctx.lineTo(px(1), py(1)); return; }
      for (let i = 1; i < n - 1; i++) {
        const cx = px(i), cy = py(i);
        const mx = (px(i) + px(i + 1)) / 2;
        const my = (py(i) + py(i + 1)) / 2;
        ctx.quadraticCurveTo(cx, cy, mx, my);
      }
      ctx.lineTo(px(n - 1), py(n - 1));
    };

    const _resample = (pts, intervalMs) => {
      if (!pts || pts.length < 3) return pts;
      const result = [];
      let segStart = pts[0].t;
      let segSum = 0, segCount = 0;
      for (let i = 0; i < pts.length; i++) {
        if (pts[i].t - segStart >= intervalMs) {
          if (segCount > 0) result.push({ t: segStart + intervalMs / 2, v: segSum / segCount });
          segStart = pts[i].t;
          segSum = 0; segCount = 0;
        }
        segSum += pts[i].v;
        segCount++;
      }
      if (segCount > 0) result.push({ t: segStart + intervalMs / 2, v: segSum / segCount });
      return result.length >= 2 ? result : pts;
    };

    const _smooth = (pts, window = 3) => {
      if (!pts || pts.length <= window) return pts;
      const half = Math.floor(window / 2);
      const result = [];
      for (let i = 0; i < pts.length; i++) {
        let sum = 0, count = 0;
        for (let j = Math.max(0, i - half); j <= Math.min(pts.length - 1, i + half); j++) {
          sum += pts[j].v;
          count++;
        }
        result.push({ t: pts[i].t, v: sum / count });
      }
      return result;
    };

    const sampleMs = 10 * 60 * 1000;

    let vLo = Infinity, vHi = -Infinity;
    const processedSeries = [];
    for (const s of series) {
      if (s.values.length < 2) continue;
      let pts = _resample(s.values, sampleMs);
      if (pts.length < 2) continue;
      pts = _smooth(pts, 3);
      let rMin = null, rMax = null;
      if (s.rangeMin && s.rangeMax && s.rangeMin.length > 1 && s.rangeMax.length > 1) {
        rMin = _resample(s.rangeMin, sampleMs);
        rMax = _resample(s.rangeMax, sampleMs);
        if (rMin.length > 1 && rMax.length > 1) {
          rMin = _smooth(rMin, 3);
          rMax = _smooth(rMax, 3);
        } else {
          rMin = rMax = null;
        }
      }
      processedSeries.push({ s, pts, rMin, rMax });
      pts.forEach(p => { if (p.v < vLo) vLo = p.v; if (p.v > vHi) vHi = p.v; });
      if (rMax) rMax.forEach(p => { if (p.v > vHi) vHi = p.v; });
      if (rMin) rMin.forEach(p => { if (p.v < vLo) vLo = p.v; });
    }

    if (vLo >= vHi) { vLo -= 1; vHi += 1; }
    const vPad = (vHi - vLo) * 0.05 || 1;

    // Y 轴范围：从处理后数据计算，加 5% 边距
    const vRangeLo = vLo - vPad;
    const vRangeHi = vHi + vPad;

    const y = (v) => pad.top + ch - ((v - vRangeLo) / (vRangeHi - vRangeLo)) * ch;

    const theme = this._evaluateTheme();
    const labelColor = theme === "on" ? "rgba(0,0,0,0.5)" : "rgba(255,255,255,0.5)";
    const gridColor  = theme === "on" ? "rgba(0,0,0,0.08)" : "rgba(255,255,255,0.08)";
    const axisColor  = theme === "on" ? "rgba(0,0,0,0.25)" : "rgba(255,255,255,0.25)";

    ctx.font = "10px sans-serif";

    const yTicks = 4;
    for (let i = 0; i <= yTicks; i++) {
      const v = vRangeLo + (vRangeHi - vRangeLo) * i / yTicks;
      const yy = y(v);
      ctx.beginPath();
      ctx.moveTo(pad.left, yy);
      ctx.lineTo(pad.left + cw, yy);
      ctx.strokeStyle = gridColor;
      ctx.lineWidth = 0.5;
      ctx.stroke();
      ctx.fillStyle = labelColor;
      ctx.textAlign = "right";
      ctx.fillText(v.toFixed(1), pad.left - 4, yy + 4);
    }

    const yUnit = this._getUnit();
    const hourMs = 3600000;
    const xLabels = (() => {
      const labels = [];
      const start = new Date(t0);
      start.setMinutes(0, 0, 0);
      if (start.getTime() < t0) start.setTime(start.getTime() + hourMs);
      const end = new Date(t1);
      end.setMinutes(0, 0, 0);
      for (let t = start.getTime(); t <= end.getTime() + 1; t += hourMs) {
        labels.push({ t, label: new Date(t).getHours().toString().padStart(2, "0") + ":00" });
      }
      if (labels.length < 2) {
        for (let i = 0; i <= 5; i++) {
          const t = t0 + (t1 - t0) * i / 5;
          const d = new Date(t);
          labels.push({ t, label: d.getHours().toString().padStart(2, "0") + ":" + d.getMinutes().toString().padStart(2, "0") });
        }
      }
      return labels;
    })();

    const minLabelSpacing = 48;
    let lastLabelX = -9999;
    for (const lb of xLabels) {
      const xx = x(lb.t);
      if (xx - lastLabelX < minLabelSpacing && lb !== xLabels[xLabels.length - 1]) continue;
      lastLabelX = xx;
      ctx.fillStyle = labelColor;
      ctx.textAlign = "center";
      ctx.fillText(lb.label, xx, height - pad.bottom + 14);
    }

    ctx.beginPath();
    ctx.moveTo(pad.left, pad.top);
    ctx.lineTo(pad.left, pad.top + ch);
    ctx.lineTo(pad.left + cw + 2, pad.top + ch);
    ctx.strokeStyle = axisColor;
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.fillStyle = labelColor;
    ctx.textAlign = "left";
    ctx.fillText(yUnit, pad.left + 2, pad.top - 2);

    // --- 绘制所有 series（使用预处理后的数据） ---
    for (const { s, pts, rMin, rMax } of processedSeries) {
      if (rMin && rMax) {
        const hex = s.color;
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);
        ctx.beginPath();
        _buildSmoothPath(ctx, rMax, y);
        for (let i = rMin.length - 1; i >= 0; i--) {
          ctx.lineTo(x(rMin[i].t), y(rMin[i].v));
        }
        ctx.closePath();
        ctx.fillStyle = `rgba(${r},${g},${b},0.15)`;
        ctx.fill();
      }

      ctx.beginPath();
      _buildSmoothPath(ctx, pts, y);
      ctx.strokeStyle = s.color;
      ctx.lineWidth = 2;
      ctx.lineJoin = "round";
      ctx.lineCap = "round";
      ctx.stroke();
    }
  }

  /* ---------- 生命周期 ---------- */
  connectedCallback() {
    super.connectedCallback();
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this._closePopup();
  }

  /* ---------- 按钮点击 → 弹窗 ---------- */
  _handleClick() {
    const hapticEvent = new Event('haptic', {
      bubbles: true,
      cancelable: false,
      composed: true
    });
    hapticEvent.detail = 'light';
    this.dispatchEvent(hapticEvent);
  }

  /*button新元素 开始*/
  _handleButtonClick() {
    const tapAction = this.config.tap_action;

    if (!tapAction || tapAction !== 'none') {
      // 默认 tap_action 行为：弹出垂直堆叠卡片
      const excludedParams = ['type', 'button_height', 'button_width', 'button_font_size', 'button_icon_size', 'show_preview', 'tap_action', 'popup_top', 'popup_width'];

      // 构建垂直堆叠卡片的内容
      const cards = [];

      // 1. 添加曲线卡片
      const chartCardConfig = {};
      Object.keys(this.config).forEach(key => {
        if (!excludedParams.includes(key) && key !== 'other_cards' && key !== 'no_preview') {
          chartCardConfig[key] = this.config[key];
        }
      });

      cards.push({
        type: 'custom:xiaoshi-chart-card',
        ...chartCardConfig
      });

      // 2. 添加附加卡片
      if (this.config.other_cards && this.config.other_cards.trim()) {
        try {
          const additionalCardsConfig = this._parseYamlCards(this.config.other_cards);

          // 为每个附加卡片传递 theme 值
          const cardsWithTheme = additionalCardsConfig.map(card => {
            // 如果卡片没有 theme 配置，则从当前卡片配置中传递
            if (!card.theme && this.config.theme) {
              return {
                ...card,
                theme: this.config.theme
              };
            }
            return card;
          });

          cards.push(...cardsWithTheme);
        } catch (error) {
          console.error('解析附加卡片配置失败:', error);
        }
      }

      // 创建垂直堆叠卡片
      const popupContent = {
        type: 'vertical-stack',
        cards: cards
      };

      // 使用原生弹窗
      this._showNativePopup(popupContent);
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

    // 移除引号
    if ((value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))) {
      return value.slice(1, -1);
    }

    // 尝试解析为数字
    if (!isNaN(value) && value.trim() !== '') {
      return Number(value);
    }

    // 尝试解析为布尔值
    if (value === 'true') return true;
    if (value === 'false') return false;
    if (value === 'null') return null;

    // 返回字符串
    return value;
  }

  _setNestedValue(obj, path, value) {
    // 支持嵌套路径，如 "styles.card"
    const keys = path.split('.');
    let current = obj;

    for (let i = 0; i < keys.length - 1; i++) {
      const key = keys[i];
      if (!current[key] || typeof current[key] !== 'object') {
        current[key] = {};
      }
      current = current[key];
    }

    current[keys[keys.length - 1]] = value;
  }

  /*button新元素 结束*/

  // ==========================================
  // 原生弹窗方法
  // ==========================================
  static _injectPopupStyles() {
    if (XiaoshChartButton._stylesInjected) return;
    XiaoshChartButton._stylesInjected = true;
    const style = document.createElement('style');
    style.id = 'xiaoshi-chart-button-popup-style';
    style.textContent = `
      @keyframes XiaoshChartButtonPopupIn {
        from { opacity: 0; scale: 0.95; }
        to   { opacity: 1; scale: 1; }
      }
    `;
    document.head.appendChild(style);
  }

  _showNativePopup(popupContent) {
    this.constructor._injectPopupStyles();

    const haRoot = document.querySelector('home-assistant');
    const hassObj = haRoot?.hass || haRoot?.shadowRoot?.querySelector('home-assistant-main')?.hass;
    if (!hassObj) {
      console.error('[XiaoshChartButton] 无法获取 hass 对象');
      return;
    }

    if (this._popupOverlay) {
      this._closePopup();
    }

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

    const popupTop = this.config.popup_top || '50%';
    const popupWidth = this.config.popup_width || 'auto';
    const popupTransform = popupTop === '50%' ? 'translate(-50%, -50%)' : 'translateX(-50%)';

    const popup = document.createElement('div');
    popup.style.cssText = `
      position: fixed;
      top: ${popupTop}; left: 50%;
      transform: ${popupTransform};
      z-index: 1005;
      background: transparent;
      padding: 0;
      width: ${popupWidth};
      max-width: 100vw;
      max-height: 100vh;
      overflow: hidden;
      box-sizing: border-box;
      animation: XiaoshChartButtonPopupIn 0.2s ease-out;
    `;

    document.body.appendChild(overlay);
    document.body.appendChild(popup);

    this._popupOverlay = overlay;
    this._popupElement = popup;

    this._createPopupCard(popup, popupContent, hassObj);

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
        this._startPopupHassWatcher(hassObj);
      } else {
        container.innerHTML = '<div style="color:red;padding:20px;">loadCardHelpers 不可用</div>';
      }
    } catch (err) {
      console.error('[XiaoshChartButton] 创建弹窗卡片失败:', err);
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
    if (this._popupHassUnsubscribe) {
      this._popupHassUnsubscribe();
      this._popupHassUnsubscribe = null;
    }
    this._popupUpdatePending = false;
    this._popupHass = null;
  }

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
          if (!this._popupCardElement) return;
          this._schedulePopupUpdate();
        },
        { type: 'subscribe_events', event_type: 'state_changed' }
      ).then((unsub) => {
        this._popupHassUnsubscribe = unsub;
      });
    } catch (err) {
      console.error('[XiaoshChartButton] 订阅状态变化失败:', err);
    }
  }

  _schedulePopupUpdate() {
    if (this._popupUpdatePending) return;
    this._popupUpdatePending = true;
    requestAnimationFrame(() => {
      this._popupUpdatePending = false;
      if (!this._popupCardElement) return;
      const haRoot = document.querySelector('home-assistant');
      const newHass = haRoot?.hass || haRoot?.shadowRoot?.querySelector('home-assistant-main')?.hass;
      if (!newHass) return;
      if (newHass === this._popupHass) return;
      this._popupHass = newHass;
      this._updatePopupCard();
    });
  }

  _updatePopupCard() {
    if (this._popupCardElement && this._popupHass) {
      try {
        this._popupCardElement.hass = this._popupHass;
      } catch (err) {
        console.warn('[XiaoshChartButton] 弹窗卡片更新失败:', err.message);
      }
    }
  }

  /* ---------- 主渲染 ---------- */
  render() {
    if (!this.hass) {
      return html`<div class="loading">等待Home Assistant连接...</div>`;
    }
    // 获取主题和颜色
    const theme = this._evaluateTheme();
    const fgColor = theme === 'on' ? 'rgb(0, 0, 0)' : 'rgb(255, 255, 255)';
    const bgColor = theme === 'on' ? 'rgb(255, 255, 255)' : 'rgb(50, 50, 50)';


    /*button新元素 前9行和最后1行开始*/
    const showPreview = this.config.no_preview === true;

    // 获取新参数
    const transparentBg = this.config.transparent_bg === true;
    const hideIcon = this.config.hide_icon === true;
    const lockWhiteFg = this.config.lock_white_fg === true;

    const entityIds = (this.config?.entities || []).map(item =>
      typeof item === "string" ? item : item.entity
    );

    // 图标：手动配置的 Emoji 优先，否则根据计量单位/实体类型自动判断
    let buttonIcon = '📊'; // 默认图标
    if (this.config.emoji) {
      buttonIcon = this.config.emoji;
    } else {
      const eid = entityIds[0] || '';
      const stateObj = this.hass?.states[eid];
      const unit = (stateObj?.attributes?.unit_of_measurement || '').toLowerCase();
      const deviceClass = (stateObj?.attributes?.device_class || '').toLowerCase();
      const entityLower = eid.toLowerCase();
      const nameLower = (stateObj?.attributes?.friendly_name || '').toLowerCase();

      // 优先按计量单位判断
      if (unit === '°c' || unit === '°f' || unit === '℃' || unit === '℉') {
        buttonIcon = '🌡️';
      } else if (unit === '%') {
        buttonIcon = '💧';
      } else if (unit === 'µg/m³' || unit === 'μg/m³' || unit === 'μg/m3' || unit === 'ug/m3') {
        buttonIcon = '🌬️';
      } else if (deviceClass === 'temperature' || entityLower.includes('temperature') || entityLower.includes('temp') || nameLower.includes('温度')) {
        buttonIcon = '🌡️';
      } else if (deviceClass === 'humidity' || entityLower.includes('humidity') || nameLower.includes('湿度')) {
        buttonIcon = '💧';
      } else if (deviceClass === 'pm25' || deviceClass === 'aqi' || entityLower.includes('pm2') || entityLower.includes('aqi') || entityLower.includes('air') || nameLower.includes('空气') || nameLower.includes('pm')) {
        buttonIcon = '🌬️';
      }
    }

    // 设置背景颜色
    const buttonBgColor = transparentBg ? 'transparent' : theme === 'on' ? 'rgb(255, 255, 255, 0.6)' : 'rgb(83, 83, 83, 0.6)';
    const unit = this._getUnit();
    const merge = this.config?.merge && entityIds.length > 1;

    let v1, v2, n1, n2;
    if (merge) {
      const vals = entityIds.map(eid => this._getValue(eid)).filter(v => v !== null && !isNaN(v));
      const avg = vals.length > 0 ? vals.reduce((a, b) => a + b, 0) / vals.length : null;
      v1 = avg; v2 = null;
      n1 = this.config.mergename || "平均值"; n2 = "";
    } else {
      const e1 = entityIds[0], e2 = entityIds[1];
      v1 = e1 ? this._getValue(e1) : null;
      v2 = e2 ? this._getValue(e2) : null;
      n1 = e1 ? this._getName(e1) : "";
      n2 = e2 ? this._getName(e2) : "";
    }

    // 按钮显示数值：合并模式显示平均值，非合并模式显示第一个实体值
    const buttonValue = v1 !== null ? this._fmt(v1) : "--";

    // 根据预警状态设置数字颜色，应用锁定白色功能
    let numberColor, iconColor;
    numberColor = lockWhiteFg ? 'rgb(255, 255, 255)' : fgColor;
    iconColor = lockWhiteFg ? 'rgb(255, 255, 255)' : fgColor;

    // 渲染按钮
    const buttonHtml = html`
      <div class="chart-status" style="--fg-color: ${numberColor}; --bg-color: ${buttonBgColor};" @click=${this._handleButtonClick}>
      ${!hideIcon ? html`<span class="status-emoji">${buttonIcon}</span>` : ''}
        <span style="color: ${numberColor};">${buttonValue}${unit}</span>
      </div>
    `;

    // 返回最终的渲染结果（包括按钮和预览卡片）
    return html`
      ${buttonHtml}
      ${showPreview ? html`
      <div class="form-group">
        <label>👇👇👇下面是弹出卡片内容👇👇👇</label>
      </div>

      <ha-card style="background:${bgColor}; color:${fgColor};">
        <div class="card-inner" style="color:${fgColor};">

          <!-- 头部：左对齐 + 右对齐 -->
          <div class="header">
            <div class="cell left">
              ${v1 !== null ? html`
                <div class="big">${this._fmt(v1)}<span class="unit">${unit}</span></div>
                <div class="sub">${n1}</div>
              ` : ""}
            </div>
            <div class="cell right">
              ${!merge && v2 !== null ? html`
                <div class="big">${this._fmt(v2)}<span class="unit">${unit}</span></div>
                <div class="sub">${n2}</div>
              ` : ""}
            </div>
          </div>

          <!-- 曲线 Canvas -->
          <div class="chart-wrap">
            ${this._chartSeries.every(s => s.values.length === 0)
              ? html`<div class="chart-empty">等待数据采集…</div>`
              : html`<canvas id="chart-canvas" class="chart-canvas"></canvas>`}
          </div>

          <!-- 图例 -->
          <div class="legend">
            ${(this._chartSeries.length ? this._chartSeries : entityIds.map((eid, i) => ({
              entityId: eid, name: this._getName(eid), color: this._getColor(eid, XiaoshChartCard.COLORS[i % XiaoshChartCard.COLORS.length])
            }))).map(s => html`
              <div class="legend-item">
                <span class="dot" style="background:${s.color};"></span>
                <span>${s.name}</span>
              </div>
            `)}
          </div>

        </div>
      </ha-card>
      ` : html``}
    `;
     /*button新元素 结束*/
  }

  static get styles() {
    return css`
      :host {
        display: block;
        width: var(--card-width, 100%);
      }

      /*button新元素 开始*/
      .chart-status {
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
        gap: 0;
        cursor: pointer;
        transition: background-color 0.2s, transform 0.1s;
        position: relative;
      }

      .status-icon {
        --mdc-icon-size: var(--button-icon-size, 13px);
        color: var(--fg-color, #000);
        margin-right: 3px;
      }

      .status-emoji {
        font-size: var(--button-icon-size, 13px);
        line-height: 1;
        margin-right: 3px;
      }

      /*button新元素 结束*/

      ha-card {
        width: 100%;
        height: 100%;
        display: flex;
        flex-direction: column;
        background: var(--bg-color, #fff);
        border-radius: 12px;
        padding: 8px;
        transition: background 0.3s, color 0.3s;
      }

      .card-inner { display: flex; flex-direction: column; gap: 5px; }

      /* 头部 */
      .header {
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        gap: 10px;
      }
      .cell { flex: 1; min-width: 0; }
      .left  { text-align: left;  }
      .right { text-align: right; }

      .big {
        font-size: 2.2em;
        font-weight: 700;
        line-height: 1.2;
      }
      .unit {
        font-size: 0.45em;
        font-weight: 400;
        opacity: 0.55;
      }
      .sub {
        font-size: 0.78em;
        opacity: 0.5;
        margin-top: 2px;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      /* 曲线 */
      .chart-wrap {
        width: 100%;
        height: 144px;
        overflow: hidden;
      }
      .chart-canvas {
        width: 100%;
        height: 100%;
        display: block;
      }
      .chart-empty {
        display: flex;
        align-items: center;
        justify-content: center;
        height: 100%;
        opacity: 0.3;
        font-size: 0.9em;
      }

      /* 图例 */
      .legend {
        display: flex;
        flex-wrap: wrap;
        gap: 12px;
        justify-content: center;
      }
      .legend-item {
        display: flex;
        align-items: center;
        gap: 5px;
        font-size: 0.78em;
        opacity: 0.7;
      }
      .dot {
        width: 10px;
        height: 10px;
        border-radius: 3px;
        flex-shrink: 0;
      }
      .loading { text-align: center; padding: 10px 0px; }
      .form-group { margin-bottom: 10px; }
    `;
  }
}
customElements.define("xiaoshi-chart-button", XiaoshChartButton);
