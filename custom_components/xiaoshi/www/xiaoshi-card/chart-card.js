import { LitElement, html, css } from "https://unpkg.com/lit-element@2.4.0/lit-element.js?module";

window.customCards = window.customCards || [];
window.customCards.push({
    type: 'xiaoshi-chart-card',
    name: '消逝温湿度曲线卡',
    description: '消逝温湿度曲线卡',
    preview: true
});

class XiaoshChartCardEditor extends LitElement {
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

  _themeChanged(ev) {
    this._update({ theme: ev.target.value });
  }

  _unitChanged(ev) {
    this._update({ unit: ev.target.value });
  }

  _toggleMerge(ev) {
    this._update({ merge: ev.target.checked });
  }

  _mergeNameChanged(ev) {
    this._update({ mergename: ev.target.value });
  }

  _mergeColorChanged(ev) {
    this._update({ mergecolor: ev.target.value });
  }

  _filterChanged(ev) {
    this._update({ _filterText: ev.target.value });
  }

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
customElements.define("xiaoshi-chart-card-editor", XiaoshChartCardEditor);

class XiaoshChartCard extends LitElement {
  static COLORS = [
    "#2196F3", "#FF5722", "#4CAF50", "#9C27B0",
    "#FF9800", "#00BCD4", "#E91E63", "#607D8B",
    "#795548", "#CDDC39"
  ];

  static get properties() {
    return {
      hass: { type: Object },
      config: { type: Object },
      _chartSeries: { type: Array },
    };
  }

  constructor() {
    super();
    this._chartSeries = [];   // [{entityId, name, values: [{t, v}], color}]
  }

  /* ---------- HA 协议 ---------- */
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
    // 兼容旧版字符串格式，转为对象格式（不修改原 config 只读对象）
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

  /* ---------- 数据工具 ---------- */
  _getValue(entityId, hassObj) {
    const h = hassObj || this.hass;
    if (!h) return null;
    const state = h.states[entityId];
    if (!state) return null;
    return parseFloat(state.state);
  }

  _getName(entityId) {
    // 先查自定义名称
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
    // 优先自定义单位
    if (this.config?.unit) return this.config.unit;
    // 自动从第一个实体获取 unit_of_measurement
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

  /* ---------- 历史数据 + Canvas 绘制 ---------- */
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

    // 全局时间范围（从原始数据取）
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

    // 辅助函数：构建平滑路径（Catmull-Rom 插值）
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

    // 时间间隔重采样：将密集数据按固定间隔取平均
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

    // 移动平均平滑
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

    // 预处理所有 series，收集处理后的点用于计算 Y 轴范围
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
      // 从处理后数据取 min/max
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

    // 主题色
    const theme = this._evaluateTheme();
    const labelColor = theme === "on" ? "rgba(0,0,0,0.5)" : "rgba(255,255,255,0.5)";
    const gridColor  = theme === "on" ? "rgba(0,0,0,0.08)" : "rgba(255,255,255,0.08)";
    const axisColor  = theme === "on" ? "rgba(0,0,0,0.25)" : "rgba(255,255,255,0.25)";

    ctx.font = "10px sans-serif";

    // --- Y 轴刻度 & 网格线（1位小数） ---
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

    // --- X 轴标签 ---
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

    // --- 坐标轴线 ---
    ctx.beginPath();
    ctx.moveTo(pad.left, pad.top);
    ctx.lineTo(pad.left, pad.top + ch);
    ctx.lineTo(pad.left + cw + 2, pad.top + ch);
    ctx.strokeStyle = axisColor;
    ctx.lineWidth = 1;
    ctx.stroke();

    // --- Y 轴单位标注 ---
    ctx.fillStyle = labelColor;
    ctx.textAlign = "left";
    ctx.fillText(yUnit, pad.left + 2, pad.top - 2);

    // --- 绘制所有 series（使用预处理后的数据） ---
    for (const { s, pts, rMin, rMax } of processedSeries) {
      // 合并模式：填充最高与最低之间的区域
      if (rMin && rMax) {
        const rgb = this._hexToRgb(s.color);
        ctx.beginPath();
        _buildSmoothPath(ctx, rMax, y);
        for (let i = rMin.length - 1; i >= 0; i--) {
          ctx.lineTo(x(rMin[i].t), y(rMin[i].v));
        }
        ctx.closePath();
        ctx.fillStyle = `rgba(${rgb.r},${rgb.g},${rgb.b},0.15)`;
        ctx.fill();
      }

      // 绘制曲线线条
      ctx.beginPath();
      _buildSmoothPath(ctx, pts, y);
      ctx.strokeStyle = s.color;
      ctx.lineWidth = 2;
      ctx.lineJoin = "round";
      ctx.lineCap = "round";
      ctx.stroke();
    }
  }

  _hexToRgb(hex) {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return { r, g, b };
  }

  /* ---------- 主渲染 ---------- */
  render() {
    if (!this.config || !this.hass) return html``;

    const theme = this._evaluateTheme();
    const bg = theme === "on" ? "rgb(255, 255, 255)" : "rgb(50, 50, 50)";
    const fg = theme === "on" ? "rgb(0, 0, 0)" : "rgb(255, 255, 255)";

    const entityIds = (this.config.entities || []).map(item => item.entity);
    const unit = this._getUnit();
    const merge = this.config.merge && entityIds.length > 1;

    // 头部数值
    let v1, v2, n1, n2;
    if (merge) {
      // 合并模式：直接取所有实体的平均值
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

    return html`
      <ha-card style="background:${bg}; color:${fg};">
        <div class="card-inner" style="color:${fg};">

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

          <!-- 图例：合并模式下不显示 -->
          ${!merge ? html`
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
          ` : ""}

        </div>
      </ha-card>
    `;
  }

  static get styles() {
    return css`
      :host { display: block; }
      ha-card { padding: 8px; transition: background 0.3s, color 0.3s; }

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
      .empty {
        opacity: 0.22;
        font-size: 0.85em;
        padding: 6px 0;
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
    `;
  }
}
customElements.define("xiaoshi-chart-card", XiaoshChartCard);
