import { LitElement, html, css } from "https://unpkg.com/lit-element@2.4.0/lit-element.js?module";

// ==================== 注册自定义卡片 ====================
window.customCards = window.customCards || [];
window.customCards.push({
  type: 'xiaoshi-chart-card',
  name: '消逝温湿度曲线卡',
  description: '消逝温湿度曲线卡',
  preview: true
});
window.customCards.push({
  type: 'xiaoshi-chart-button',
  name: '消逝温湿度曲线按钮',
  description: '消逝温湿度曲线按钮（点击弹出曲线卡片）',
  preview: true
});

// ==================== 公共常量 ====================
const CHART_COLORS = [
  "#2196F3", "#FF5722", "#4CAF50", "#9C27B0",
  "#FF9800", "#00BCD4", "#E91E63", "#607D8B",
  "#795548", "#CDDC39"
];

// ==================== 公共工具函数（无this依赖） ====================

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

function hexToRgb(hex) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return { r, g, b };
}

function fmtValue(v) {
  if (v === null || v === undefined || isNaN(v)) return "--";
  return v.toFixed(1);
}

// ==================== 公共CSS样式 ====================

const editorCommonStyles = css`
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

const cardCommonStyles = css`
  :host { display: block; }
  ha-card { padding: 8px; transition: background 0.3s, color 0.3s; }
  .card-inner { display: flex; flex-direction: column; gap: 5px; }
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
  .empty {
    opacity: 0.22;
    font-size: 0.85em;
    padding: 6px 0;
  }
  .chart-wrap {
    width: 100%;
    height: 144px;
    position: relative;
    overflow: visible;
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
  .chart-crosshair {
    position: absolute;
    top: 0;
    height: 100%;
    width: 1px;
    pointer-events: none;
    display: none;
    z-index: 5;
  }
  .chart-tooltip {
    position: absolute;
    top: 4px;
    pointer-events: none;
    z-index: 10;
    border-radius: 8px;
    padding: 8px 12px;
    font-size: 12px;
    line-height: 1.6;
    white-space: nowrap;
    box-shadow: 0 2px 12px rgba(0,0,0,0.2);
    display: none;
  }
  .chart-tooltip-item {
    display: flex;
    align-items: center;
    gap: 6px;
  }
  .chart-tooltip-dot {
    width: 8px;
    height: 8px;
    border-radius: 2px;
    flex-shrink: 0;
  }
  .chart-tooltip-time {
    font-weight: 600;
    margin-bottom: 4px;
    opacity: 0.7;
    font-size: 11px;
  }
  .chart-tooltip-sep {
    height: 1px;
    margin: 4px 0;
  }
`;

// ==================== 编辑器混入（Mixin） ====================

const ChartEditorMixin = (superClass) => class extends superClass {
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
  get _theme() { return this.config?.theme !== undefined ? this.config.theme : "system"; }
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

  _update(patch) {
    const next = { ...this.config, ...patch };
    this.config = next;
    this.dispatchEvent(new CustomEvent("config-changed", {
      detail: { config: next }, bubbles: true, composed: true,
    }));
  }

  _renderCommonEditor(selectedEids, candidates) {
    return html`
      <div class="editor-root">
        <div class="field">
          <label class="label">主题</label>
          <select class="select" .value=${this._theme} @change=${this._themeChanged}>
            <option value="system">跟随系统</option>
            <option value="light">浅色主题（白底黑字）</option>
            <option value="dark">深色主题（黑底白字）</option>
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

  _getCandidatesAndSelected() {
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
    return { candidates, selectedEids };
  }
};

// ==================== 主组件混入（Mixin） ====================

const ChartBaseMixin = (superClass) => class extends superClass {
  static get properties() {
    return {
      hass: { type: Object },
      config: { type: Object },
      _chartSeries: { type: Array },
    };
  }

  constructor() {
    super();
    this._chartSeries = [];
    this._chartLayout = null;
    this._perEntitySeries = [];
    this._boundCanvasMouseMove = this._canvasMouseMove.bind(this);
    this._boundCanvasMouseLeave = this._canvasMouseLeave.bind(this);
  }

  _evaluateTheme() {
    return evaluateTheme(this.config);
  }

  /* ---------- 数据工具 ---------- */
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
    return fmtValue(v);
  }

  /* ---------- 生命周期 ---------- */
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
      this._hideTooltip();
    }
  }

  /* ---------- 历史数据 ---------- */
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

      // Always store per-entity data for tooltip
      const perEntity = [];
      for (let idx = 0; idx < entityIds.length; idx++) {
        const eid = entityIds[idx];
        const history = historyResult?.[eid] || [];
        const values = [];
        for (const entry of history) {
          const pt = parseHistoryEntry(entry);
          if (pt) values.push(pt);
        }
        const defaultColor = CHART_COLORS[idx % CHART_COLORS.length];
        perEntity.push({
          entityId: eid,
          name: this._getName(eid),
          values,
          color: this._getColor(eid, defaultColor),
        });
      }
      this._perEntitySeries = perEntity;

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

        const mergeColor = this.config.mergecolor || CHART_COLORS[0];
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
          const defaultColor = CHART_COLORS[series.length % CHART_COLORS.length];
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

  /* ---------- Canvas 绘制 ---------- */
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
    const vRangeLo = vLo - vPad;
    const vRangeHi = vHi + vPad;
    const y = (v) => pad.top + ch - ((v - vRangeLo) / (vRangeHi - vRangeLo)) * ch;

    this._chartLayout = { t0, t1, pad, width, height, processedSeries, cw, ch };

    const theme = this._evaluateTheme();
    const labelColor = theme === "light" ? "rgba(0,0,0,0.5)" : "rgba(255,255,255,0.5)";
    const gridColor  = theme === "light" ? "rgba(0,0,0,0.08)" : "rgba(255,255,255,0.08)";
    const axisColor  = theme === "light" ? "rgba(0,0,0,0.25)" : "rgba(255,255,255,0.25)";

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

    for (const { s, pts, rMin, rMax } of processedSeries) {
      if (rMin && rMax) {
        const rgb = hexToRgb(s.color);
        ctx.beginPath();
        _buildSmoothPath(ctx, rMax, y);
        for (let i = rMin.length - 1; i >= 0; i--) {
          ctx.lineTo(x(rMin[i].t), y(rMin[i].v));
        }
        ctx.closePath();
        ctx.fillStyle = `rgba(${rgb.r},${rgb.g},${rgb.b},0.15)`;
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

  /* ---------- Tooltip ---------- */
  _canvasMouseMove(e) {
    if (!this._chartLayout || !this._perEntitySeries.length) return;
    const canvas = this.shadowRoot?.querySelector("#chart-canvas");
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const layout = this._chartLayout;
    const { t0, t1, pad, width, processedSeries, cw, ch } = layout;

    if (mouseX < pad.left || mouseX > pad.left + cw) {
      this._hideTooltip();
      return;
    }

    const t = t0 + ((mouseX - pad.left) / cw) * (t1 - t0);
    const d = new Date(t);
    const timeStr = (d.getMonth() + 1).toString().padStart(2, '0') + '/' +
      d.getDate().toString().padStart(2, '0') + ' ' +
      d.getHours().toString().padStart(2, '0') + ':' +
      d.getMinutes().toString().padStart(2, '0');

    const merge = this.config?.merge && (this.config?.entities || []).length > 1;
    const unit = this._getUnit();
    const avgItems = [];
    const entityItems = [];

    if (merge) {
      for (const { s, pts } of processedSeries) {
        const v = this._interpolateValue(pts, t);
        if (v !== null) {
          avgItems.push({ name: s.name, value: v, color: s.color });
        }
      }
    }

    for (const pe of this._perEntitySeries) {
      const v = this._interpolateValue(pe.values, t);
      if (v !== null) {
        entityItems.push({ name: pe.name, value: v, color: pe.color });
      }
    }

    const theme = this._evaluateTheme();
    const dark = theme === 'dark';

    const crosshair = this.shadowRoot?.querySelector("#chart-crosshair");
    const tooltip = this.shadowRoot?.querySelector("#chart-tooltip");
    const timeEl = this.shadowRoot?.querySelector("#tooltip-time");
    const avgEl = this.shadowRoot?.querySelector("#tooltip-avg");
    const sepEl = this.shadowRoot?.querySelector("#tooltip-sep");
    const itemsEl = this.shadowRoot?.querySelector("#tooltip-items");

    if (!crosshair || !tooltip) return;

    crosshair.style.display = 'block';
    crosshair.style.left = mouseX + 'px';
    crosshair.style.top = pad.top + 'px';
    crosshair.style.height = ch + 'px';
    crosshair.style.background = dark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.3)';

    const flipLeft = mouseX > width / 2;
    const tooltipLeft = flipLeft ? mouseX - 12 : mouseX + 12;
    const transformX = flipLeft ? 'translateX(-100%)' : 'translateX(0)';

    tooltip.style.display = 'block';
    tooltip.style.left = tooltipLeft + 'px';
    tooltip.style.transform = transformX;
    tooltip.style.background = dark ? 'rgba(30,30,30,0.95)' : 'rgba(255,255,255,0.95)';
    tooltip.style.color = dark ? '#fff' : '#333';
    tooltip.style.border = '1px solid ' + (dark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.1)');

    timeEl.textContent = timeStr;

    avgEl.innerHTML = avgItems.map(item =>
      '<div class="chart-tooltip-item">' +
        '<span class="chart-tooltip-dot" style="background:' + item.color + '"></span>' +
        '<span>' + item.name + ': ' + fmtValue(item.value) + unit + '</span>' +
      '</div>'
    ).join('');

    sepEl.style.display = avgItems.length > 0 && entityItems.length > 0 ? 'block' : 'none';
    sepEl.style.background = dark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.1)';

    itemsEl.innerHTML = entityItems.map(item =>
      '<div class="chart-tooltip-item">' +
        '<span class="chart-tooltip-dot" style="background:' + item.color + '"></span>' +
        '<span>' + item.name + ': ' + fmtValue(item.value) + unit + '</span>' +
      '</div>'
    ).join('');
  }

  _canvasMouseLeave() {
    this._hideTooltip();
  }

  _hideTooltip() {
    const crosshair = this.shadowRoot?.querySelector("#chart-crosshair");
    const tooltip = this.shadowRoot?.querySelector("#chart-tooltip");
    if (crosshair) crosshair.style.display = 'none';
    if (tooltip) tooltip.style.display = 'none';
  }

  _interpolateValue(values, t) {
    if (!values || values.length === 0) return null;
    if (values.length === 1) return values[0].v;
    if (t <= values[0].t) return values[0].v;
    if (t >= values[values.length - 1].t) return values[values.length - 1].v;
    for (let i = 0; i < values.length - 1; i++) {
      if (values[i].t <= t && values[i + 1].t >= t) {
        const dt = values[i + 1].t - values[i].t;
        if (dt === 0) return values[i].v;
        const ratio = (t - values[i].t) / dt;
        return values[i].v + ratio * (values[i + 1].v - values[i].v);
      }
    }
    return null;
  }

  /* ---------- 卡片头部数据 ---------- */
  _getHeaderValues() {
    const entityIds = (this.config?.entities || []).map(item => item.entity);
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
    return { v1, v2, n1, n2, unit, merge, entityIds };
  }

  /* ---------- 卡片内容渲染 ---------- */
  _renderCardContent(headerData, bgColor, fgColor) {
    const { v1, v2, n1, n2, unit, merge, entityIds } = headerData;
    return html`
      <ha-card style="background:${bgColor}; color:${fgColor}; border:none;">
        <div class="card-inner" style="color:${fgColor};">
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
          <div class="chart-wrap">
            ${this._chartSeries.every(s => s.values.length === 0)
              ? html`<div class="chart-empty">等待数据采集…</div>`
              : html`
                <canvas id="chart-canvas" class="chart-canvas"
                  @mousemove=${this._boundCanvasMouseMove}
                  @mouseleave=${this._boundCanvasMouseLeave}></canvas>
                <div class="chart-crosshair" id="chart-crosshair"></div>
                <div class="chart-tooltip" id="chart-tooltip">
                  <div class="chart-tooltip-time" id="tooltip-time"></div>
                  <div id="tooltip-avg"></div>
                  <div class="chart-tooltip-sep" id="tooltip-sep"></div>
                  <div id="tooltip-items"></div>
                </div>
              `}
          </div>
          ${!this.config?.merge ? html`
          <div class="legend">
            ${(this._chartSeries.length ? this._chartSeries : entityIds.map((eid, i) => ({
              entityId: eid, name: this._getName(eid), color: this._getColor(eid, CHART_COLORS[i % CHART_COLORS.length])
            }))).map(s => html`
              <div class="legend-item">
                <span class="dot" style="background:${s.color};"></span>
                <span>${s.name}</span>
              </div>
            `)}
          </div>
          ` : ""}
        </div>
      </ha-card>
    `;
  }
};

// ==================== 消逝曲线卡编辑器 ====================

class XiaoshChartCardEditor extends ChartEditorMixin(LitElement) {
  static get styles() {
    return editorCommonStyles;
  }

  render() {
    if (!this.hass) return html``;
    const { candidates, selectedEids } = this._getCandidatesAndSelected();
    return this._renderCommonEditor(selectedEids, candidates);
  }
}
customElements.define("xiaoshi-chart-card-editor", XiaoshChartCardEditor);

// ==================== 消逝曲线卡 ====================

class XiaoshChartCard extends ChartBaseMixin(LitElement) {
  static get styles() {
    return cardCommonStyles;
  }

  static getConfigElement() {
    return document.createElement("xiaoshi-chart-card-editor");
  }

  static getStubConfig() {
    return {
      type: "custom:xiaoshi-chart-card",
      entities: [],
      merge: false,
    };
  }

  setConfig(config) {
    if (!Array.isArray(config?.entities) || config.entities.length === 0) {
      throw new Error("请至少选择一个 sensor 实体");
    }
    this.config = {
      ...config,
      entities: config.entities.map(item =>
        typeof item === "string" ? { entity: item } : { ...item }
      ),
    };
  }

  getCardSize() {
    return 3 + Math.ceil((this.config?.entities?.length || 1) / 2);
  }

  render() {
    if (!this.config || !this.hass) return html``;
    const theme = this._evaluateTheme();
    const bg = theme === "light" ? "rgb(255, 255, 255)" : "rgb(50, 50, 50)";
    const fg = theme === "light" ? "rgb(0, 0, 0)" : "rgb(255, 255, 255)";
    const headerData = this._getHeaderValues();
    return this._renderCardContent(headerData, bg, fg);
  }
}
customElements.define("xiaoshi-chart-card", XiaoshChartCard);

// ==================== 消逝曲线按钮编辑器 ====================

class XiaoshChartButtonEditor extends ChartEditorMixin(LitElement) {
  static get styles() {
    return [
      editorCommonStyles,
      css`
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
      `
    ];
  }

  render() {
    if (!this.hass) return html``;
    const { candidates, selectedEids } = this._getCandidatesAndSelected();

    return html`
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

      <div class="form-group">
        <label> </label>
        <label>👇👇👇下方是弹出的主卡配置项👇👇👇</label>
        <label> </label>
      </div>

      <div class="form-group">
        <label>弹窗宽度：支持像素(px)、百分比(%)和auto，默认95%</label>
        <input
          type="text"
          @change=${this._entityChanged}
          .value=${this.config.popup_width !== undefined ? this.config.popup_width : '95%'}
          name="popup_width"
          placeholder="默认95%"
        />
      </div>

      <div class="form-group">
        <label>弹窗位置：支持百分比(%)和像素(px)，默认20px</label>
        <input
          type="text"
          @change=${this._entityChanged}
          .value=${this.config.popup_top !== undefined ? this.config.popup_top : '20px'}
          name="popup_top"
          placeholder="默认20px"
        />
      </div>

      ${this._renderCommonEditor(selectedEids, candidates)}
    `;
  }

  _entityChanged(e) {
    const { name, value, type, checked } = e.target;
    let finalValue;
    if (type === 'checkbox') {
      finalValue = checked;
    } else {
      if (!value && name !== 'theme' && name !== 'button_width' && name !== 'button_height'
        && name !== 'button_font_size' && name !== 'button_icon_size'
        && name !== 'popup_width' && name !== 'popup_top' && name !== 'emoji') return;
      finalValue = value;
    }
    if (name === 'button_width') { finalValue = value || '16.8vw'; }
    else if (name === 'button_height') { finalValue = value || '24px'; }
    else if (name === 'button_font_size') { finalValue = value || '11px'; }
    else if (name === 'button_icon_size') { finalValue = value || '13px'; }

    this.config = { ...this.config, [name]: finalValue };
    this.dispatchEvent(new CustomEvent('config-changed', {
      detail: { config: this.config }, bubbles: true, composed: true
    }));
  }
}
customElements.define("xiaoshi-chart-button-editor", XiaoshChartButtonEditor);

// ==================== 消逝曲线按钮 ====================

class XiaoshChartButton extends ChartBaseMixin(LitElement) {
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
    this.config = { ...config };
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
    if (config.theme) {
      this.setAttribute('theme', config.theme);
    }
  }

  getCardSize() {
    return 1;
  }

  /* ---------- 按钮点击 ---------- */
  _handleClick() {
    const hapticEvent = new Event('haptic', {
      bubbles: true,
      cancelable: false,
      composed: true
    });
    hapticEvent.detail = 'light';
    this.dispatchEvent(hapticEvent);
  }

  _handleButtonClick() {
    const excludedParams = ['type', 'button_height', 'button_width', 'button_font_size', 'button_icon_size', 'popup_top', 'popup_width'];
    const cards = [];
    const chartCardConfig = {};
    Object.keys(this.config).forEach(key => {
      if (!excludedParams.includes(key) && key !== 'other_cards') {
        chartCardConfig[key] = this.config[key];
      }
    });
    cards.push({
      type: 'custom:xiaoshi-chart-card',
      ...chartCardConfig
    });
    if (this.config.other_cards && this.config.other_cards.trim()) {
      try {
        const additionalCardsConfig = this._parseYamlCards(this.config.other_cards);
        const cardsWithTheme = additionalCardsConfig.map(card => {
          if (!card.theme && this.config.theme) {
            return { ...card, theme: this.config.theme };
          }
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
    serviceData.background = 'transparent';
    this.hass.callService('popup_card', 'show', serviceData);
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
      if (!current[key] || typeof current[key] !== 'object') {
        current[key] = {};
      }
      current = current[key];
    }
    current[keys[keys.length - 1]] = value;
  }

  /* ---------- 主渲染 ---------- */
  render() {
    if (!this.hass) {
      return html`<div class="loading">等待Home Assistant连接...</div>`;
    }
    const theme = this._evaluateTheme();
    const fgColor = theme === 'light' ? 'rgb(0, 0, 0)' : 'rgb(255, 255, 255)';
    const bgColor = theme === 'light' ? 'rgb(255, 255, 255)' : 'rgb(50, 50, 50)';

    const transparentBg = this.config.transparent_bg === true;
    const lockWhiteFg = this.config.lock_white_fg === true;

    const entityIds = (this.config?.entities || []).map(item =>
      typeof item === "string" ? item : item.entity
    );

    // 图标：手动配置的 Emoji 优先，否则自动判断
    let buttonIcon = '📊';
    if (this.config.emoji) {
      buttonIcon = this.config.emoji;
    } else {
      const eid = entityIds[0] || '';
      const stateObj = this.hass?.states[eid];
      const unit = (stateObj?.attributes?.unit_of_measurement || '').toLowerCase();
      const deviceClass = (stateObj?.attributes?.device_class || '').toLowerCase();
      const entityLower = eid.toLowerCase();
      const nameLower = (stateObj?.attributes?.friendly_name || '').toLowerCase();

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

    const buttonBgColor = transparentBg ? 'transparent' : theme === 'light' ? 'rgb(255, 255, 255, 0.6)' : 'rgb(83, 83, 83, 0.6)';
    const unit = this._getUnit();
    const unitLower = unit.toLowerCase();
    const buttonUnit = (unitLower === 'µg/m³' || unitLower === 'μg/m³' || unitLower === 'μg/m3' || unitLower === 'ug/m3') ? 'µg' : unit;

    const headerData = this._getHeaderValues();
    const buttonValue = headerData.v1 !== null ? this._fmt(headerData.v1) : "--";

    let numberColor, iconColor;
    numberColor = lockWhiteFg ? 'rgb(255, 255, 255)' : fgColor;
    iconColor = lockWhiteFg ? 'rgb(255, 255, 255)' : fgColor;

    const buttonHtml = html`
      <div class="chart-status" style="--fg-color: ${numberColor}; --bg-color: ${buttonBgColor};" @click=${this._handleButtonClick}>
      <span class="status-emoji">${buttonIcon}</span>
        <span style="color: ${numberColor};">${buttonValue}${buttonUnit}</span>
      </div>
    `;

    return html`
      ${buttonHtml}
    `;
  }

  static get styles() {
    return [
      cardCommonStyles,
      css`
        :host {
          display: block;
          width: var(--card-width, 100%);
        }
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
          cursor: none;
          transition: background-color 0.2s, transform 0.1s;
          position: relative;
        }
        .chart-status:active {
          transform: scale(0.95);
          box-shadow: 0 2px 12px rgba(255, 255, 255, 0.4), 0 2px 8px rgba(0, 0, 0, 0.4);
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
        .loading { text-align: center; padding: 10px 0px; }
        .form-group { margin-bottom: 10px; }
      `
    ];
  }
}
customElements.define("xiaoshi-chart-button", XiaoshChartButton);
