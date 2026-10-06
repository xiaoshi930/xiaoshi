/* ==========================================================================
 * 消逝家庭支出卡片  xiaoshi-household-expenses
 * --------------------------------------------------------------------------
 * 数据源：
 *   - 电 / 气 / 水：任意"金额"实体（国网集成或自建 mock sensor 都可以）
 *   - 房贷 / 车贷 / 消费贷 / 物业费 / 租赁房屋 / 租赁车位 / 取暖费 / 出租房屋 / 出租车位
 *     ：household_expenses 集成里对应的传感器
 * 只要某个类型在配置里填了实体，表格里就出现该格；没填的自动不显示。
 * 点击格子 = 把该类型从「日历 / 日图表 / 月图表」里剔除或恢复（默认全部参与）。
 * ========================================================================== */

const whenDefined = (t) => customElements.whenDefined(t);
await Promise.race([whenDefined("ha-card"), whenDefined("ha-panel-lovelace")]);
const LitElement = window.LitElement || Object.getPrototypeOf(customElements.get("ha-card"));
const html = LitElement.prototype.html;
const css = LitElement.prototype.css;

window.customCards = window.customCards || [];
window.customCards.push({
  type: 'xiaoshi-household-expenses',
  name: '消逝家庭支出卡片',
  description: '按类型展示本月 / 本年金额，点击类型可切换是否参与日历与日 / 月图表',
  preview: true
});

/* --------------------------------------------------------------------------
 * 槽位定义
 * 顺序 = 表格与图例的显示顺序；dir 决定归到「支出」还是「收入」行。
 * 表格每行由 columns 决定（默认 3 个），超出自动换行，跟手绘表格一致。
 * -------------------------------------------------------------------------- */
/* part 说明（只对 household_expenses 的数据源生效）：
 *   'primary'   —— 只取「金额1」= 分期项（贷款类就是每月月供）
 *   'secondary' —— 只取「金额2」= 一次性项（首付款 / 中介费 / 保管费，按摊销期间均摊）
 *   'both'      —— 两者相加（默认；电/气/水等单一金额的类型都是这个）
 * source   —— 实体从哪个配置键取（派生槽位与主槽位共用同一份实体配置）
 * derived  —— 派生出来的展示槽位，编辑器里不单独配置
 */
const HE_SLOT_DEFS = [
  { key: 'electric',         label: '电',      dir: 'expense', icon: 'mdi:flash',                color: '#FFB300' },
  { key: 'gas',              label: '气',      dir: 'expense', icon: 'mdi:fire',                 color: '#FF7043' },
  { key: 'water',            label: '水',      dir: 'expense', icon: 'mdi:water',                color: '#29B6F6' },
  { key: 'mortgage',         label: '房贷',    dir: 'expense', icon: 'mdi:home-city',            color: '#7E57C2', part: 'primary' },
  { key: 'mortgage_payment', label: '房款',    dir: 'expense', icon: 'mdi:home-currency-usd',    color: '#B39DDB', part: 'secondary', source: 'mortgage',      derived: true },
  { key: 'car_loan',         label: '车贷',    dir: 'expense', icon: 'mdi:car',                  color: '#26A69A', part: 'primary' },
  { key: 'car_payment',      label: '车款',    dir: 'expense', icon: 'mdi:car-2-plus',           color: '#80CBC4', part: 'secondary', source: 'car_loan',      derived: true },
  { key: 'consumer_loan',    label: '消费贷',  dir: 'expense', icon: 'mdi:cash-clock',           color: '#EC407A', part: 'primary' },
  { key: 'consumer_payment', label: '消费款',  dir: 'expense', icon: 'mdi:cash-multiple',        color: '#F48FB1', part: 'secondary', source: 'consumer_loan', derived: true },
  { key: 'property_fee',     label: '物业费',  dir: 'expense', icon: 'mdi:office-building',      color: '#8D6E63' },
  { key: 'rent_home',        label: '租赁房屋', dir: 'expense', icon: 'mdi:home-account',        color: '#5C6BC0' },
  { key: 'rent_parking',     label: '租赁车位', dir: 'expense', icon: 'mdi:parking',             color: '#42A5F5' },
  { key: 'heating_fee',      label: '取暖费',  dir: 'expense', icon: 'mdi:radiator',             color: '#EF5350' },
  { key: 'sublet_home',      label: '房屋出租', dir: 'income', icon: 'mdi:home-export-outline',  color: '#66BB6A' },
  { key: 'sublet_parking',   label: '车位出租', dir: 'income', icon: 'mdi:parking',              color: '#9CCC65' }
];

/* 编辑器里可配置的槽位（去掉派生槽位：房款 / 车款 / 消费款） */
const HE_EDITABLE_SLOT_DEFS = HE_SLOT_DEFS.filter((def) => !def.derived);

const HE_SLOT_MAP = {};
HE_SLOT_DEFS.forEach((def) => { HE_SLOT_MAP[def.key] = def; });

/* --------------------------------------------------------------------------
 * 工具函数
 * -------------------------------------------------------------------------- */
function heNum(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

/* '#7E57C2' → 'rgba(126, 87, 194, a)'；解析失败退回中性灰。
 * 表格改成按钮后，每个类型靠「同色浅底 + 同色文字」保留原来的颜色区分（原点已去掉）。 */
function heAlpha(hex, a) {
  const m = /^#?([0-9a-fA-F]{6})$/.exec(String(hex || '').trim());
  if (!m) return `rgba(150, 150, 150, ${a})`;
  const n = parseInt(m[1], 16);
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${a})`;
}

function hePad2(n) {
  return String(n).padStart(2, '0');
}

function heDaysInMonth(year, month) {
  return new Date(year, month, 0).getDate();
}

/* 日期归一：'2026-10-06 12:00:00' / '2026-10-06' → '2026-10-06' */
function heDayKey(raw) {
  const text = String(raw || '').trim().split(' ')[0];
  return text.length >= 10 ? text.slice(0, 10) : '';
}

function heMonthKey(raw) {
  const text = String(raw || '').trim().replace(/\//g, '-');
  return text.length >= 7 ? text.slice(0, 7) : '';
}

function heYearKey(raw) {
  const text = String(raw || '').trim();
  return text.length >= 4 ? text.slice(0, 4) : '';
}

/* 单个费用项的「金额」：字段名按数据源不同而不同，统一走"优先命中 + 兜底扫描"。
 *   - household_expenses：dayCost1 + dayCost2 / monthCost1 + monthCost2 / yearCost1 + yearCost2
 *   - 国网 & 自建实体：dayEleCost / monthEleCost / yearEleCost（电），
 *     水气则用 e_water / e_gas、e_water_total / e_gas_total 这类前缀字段
 * 只取金额，不取用量（f_water / dayEleNum 这些用量字段不会被命中）。 */
function heCostField(item, preferred, fallbackPattern) {
  if (!item || typeof item !== 'object') return 0;
  for (const key of preferred) {
    const raw = item[key];
    if (raw !== undefined && raw !== null && raw !== '') return heNum(raw);
  }
  for (const [key, raw] of Object.entries(item)) {
    if (fallbackPattern.test(key)) return heNum(raw);
  }
  return 0;
}

/* 三个期间的「金额1 / 金额2」字段名 + 非 household_expenses 数据源的兜底字段 */
const HE_COST_KEYS = {
  day:   ['dayCost1',   'dayCost2'],
  month: ['monthCost1', 'monthCost2'],
  year:  ['yearCost1',  'yearCost2']
};

const HE_FALLBACK_FIELDS = {
  day:   { preferred: ['dayEleCost', 'e_water', 'e_gas', 'dayCost'],                            pattern: /^e_|cost/i },
  month: { preferred: ['monthEleCost', 'e_water_total', 'e_gas_total', 'monthCost'],            pattern: /^e_|cost/i },
  year:  { preferred: ['yearEleCost', 'e_water_year', 'e_gas_year', 'yearCost'],                pattern: /^e_|cost/i }
};

/* 取某个期间条目的金额。
 * part = 'both' 取 cost1 + cost2；'primary' 只取 cost1（月供）；'secondary' 只取 cost2（首付款）。
 * 条目里没有 cost1/cost2 字段（电 / 水 / 气等）时，part 不影响结果，走原来的字段兜底。 */
function heCostOf(item, level, part) {
  const keys = HE_COST_KEYS[level];
  if (item && typeof item === 'object' && (keys[0] in item || keys[1] in item)) {
    if (part === 'primary') return heNum(item[keys[0]]);
    if (part === 'secondary') return heNum(item[keys[1]]);
    return heNum(item[keys[0]]) + heNum(item[keys[1]]);
  }
  const fb = HE_FALLBACK_FIELDS[level];
  return heCostField(item, fb.preferred, fb.pattern);
}

function heDayCost(item, part) {
  return heCostOf(item, 'day', part || 'both');
}

function heMonthCost(item, part) {
  return heCostOf(item, 'month', part || 'both');
}

function heYearCost(item, part) {
  return heCostOf(item, 'year', part || 'both');
}

/* 配置里取实体：支持 'sensor.x' / { entity: 'sensor.x' } / { entity_id: ... } */
function heEntityId(value) {
  if (!value) return '';
  if (typeof value === 'string') return value.trim();
  if (typeof value === 'object') {
    return String(value.entity || value.entity_id || '').trim();
  }
  return '';
}

/* 把一个「值」统一成实体项列表（同一类型下可挂多个实体，求和用）。
 * 支持：'sensor.a' | ['sensor.a', 'sensor.b'] | { entity: 'sensor.a' }
 *      | { entities: ['sensor.a', 'sensor.b'] } */
function heEntityItems(value) {
  if (!value) return [];
  if (typeof value === 'string') {
    const id = value.trim();
    return id ? [{ entityId: id, name: '' }] : [];
  }
  if (Array.isArray(value)) {
    const out = [];
    value.forEach((it) => { heEntityItems(it).forEach((x) => out.push(x)); });
    return out;
  }
  if (typeof value === 'object') {
    if (Array.isArray(value.entities)) return heEntityItems(value.entities);
    const id = heEntityId(value);
    if (!id) return [];
    return [{ entityId: id, name: String(value.name || '').trim() }];
  }
  return [];
}

/* 取某个类型配置下的全部实体项，兼容 config.entities 的两种形态：
 *   1) 对象：{ electric: 'sensor.a' | ['sensor.a', 'sensor.b'], ... }
 *   2) 扁平数组：[{ type: 'electric', entity: 'sensor.a' }, ...]（电费卡片的老写法）
 * 结果按出现顺序去重。 */
function heSlotEntityItems(config, key) {
  const cfg = config ? config.entities : null;
  if (!cfg) return [];
  let items = [];
  if (Array.isArray(cfg)) {
    cfg.forEach((it) => {
      if (!it || typeof it !== 'object') return;
      const type = it.type || it.key || it.slot;
      if (type !== key) return;
      heEntityItems(it).forEach((x) => items.push(x));
    });
  } else {
    items = heEntityItems(cfg[key]);
  }
  const seen = {};
  return items.filter((it) => {
    if (!it.entityId || seen[it.entityId]) return false;
    seen[it.entityId] = true;
    return true;
  });
}

/* 把实体属性抽成统一序列：{ days, months, years, monthTotal, yearTotal }
 * part 决定只取哪一份金额（见 HE_SLOT_DEFS 上的说明）。 */
function heExtractSeries(attributes, part) {
  const mode = part || 'both';
  const attrs = attributes || {};
  const out = { days: {}, months: {}, years: {}, monthTotal: null, yearTotal: null };

  if (Array.isArray(attrs.daylist)) {
    attrs.daylist.forEach((item) => {
      const key = heDayKey(item && item.day);
      if (!key) return;
      out.days[key] = (out.days[key] || 0) + heDayCost(item, mode);
    });
  }

  if (Array.isArray(attrs.monthlist)) {
    attrs.monthlist.forEach((item) => {
      const key = heMonthKey(item && item.month);
      if (!key) return;
      out.months[key] = (out.months[key] || 0) + heMonthCost(item, mode);
    });
  } else if (attrs.monthly_summary && typeof attrs.monthly_summary === 'object') {
    Object.entries(attrs.monthly_summary).forEach(([month, data]) => {
      const key = heMonthKey(month);
      if (!key) return;
      out.months[key] = (out.months[key] || 0) + heMonthCost(data, mode);
    });
  }

  if (Array.isArray(attrs.yearlist)) {
    attrs.yearlist.forEach((item) => {
      const key = heYearKey(item && item.year);
      if (!key) return;
      out.years[key] = (out.years[key] || 0) + heYearCost(item, mode);
    });
  }

  // 没有 yearlist 时用 monthlist 汇总出年份，保证「本年」总有值
  if (!Object.keys(out.years).length && Object.keys(out.months).length) {
    Object.entries(out.months).forEach(([month, cost]) => {
      const key = month.slice(0, 4);
      out.years[key] = (out.years[key] || 0) + cost;
    });
  }

  if (mode === 'both') {
    // household_expenses 集成直接给了合计，优先用（口径与实体一致）
    ['当月合计', '当年合计'].forEach((attr, idx) => {
      const raw = attrs[attr];
      if (raw === undefined || raw === null || raw === '') return;
      if (idx === 0) out.monthTotal = heNum(raw);
      else out.yearTotal = heNum(raw);
    });
  } else {
    // 拆分的分量不能用「当月合计 / 当年合计」—— 那是 cost1 + cost2 的合并值。
    // 只能从列表里取当月 / 当年那一项。
    const now = new Date();
    const mKey = `${now.getFullYear()}-${hePad2(now.getMonth() + 1)}`;
    const yKey = String(now.getFullYear());
    out.monthTotal = out.months[mKey] !== undefined ? out.months[mKey] : null;
    out.yearTotal = out.years[yKey] !== undefined ? out.years[yKey] : null;
  }

  return out;
}

/* 多个实体的序列求和（一个类型挂多块表时用）：
 * 日 / 月 / 年逐键相加；合计字段只要有一路非空就累加，全空才是 null。 */
function heMergeSeries(list) {
  const out = { days: {}, months: {}, years: {}, monthTotal: null, yearTotal: null };
  (list || []).forEach((ser) => {
    if (!ser) return;
    ['days', 'months', 'years'].forEach((bucket) => {
      Object.entries(ser[bucket] || {}).forEach(([key, value]) => {
        out[bucket][key] = (out[bucket][key] || 0) + heNum(value);
      });
    });
    if (ser.monthTotal !== null && ser.monthTotal !== undefined) {
      out.monthTotal = (out.monthTotal || 0) + heNum(ser.monthTotal);
    }
    if (ser.yearTotal !== null && ser.yearTotal !== undefined) {
      out.yearTotal = (out.yearTotal || 0) + heNum(ser.yearTotal);
    }
  });
  return out;
}

/* 把数组按 size 切成多行（表格换行用） */
function heChunk(list, size) {
  const rows = [];
  const step = Math.max(1, Number(size) || 3);
  for (let i = 0; i < list.length; i += step) rows.push(list.slice(i, i + step));
  return rows;
}

/* ===================== 自绘图表引擎（part_chart.js：已加负值轴支持） ===================== */
const XS_CHART_FONT_FAMILY = '"Helvetica Neue", Helvetica, Arial, "PingFang SC", "Microsoft YaHei", sans-serif';

function xsFont(size, weight) {
  return `${weight ? weight + ' ' : ''}${size}px ${XS_CHART_FONT_FAMILY}`;
}

/* 把 #RRGGBBAA 转成 rgba()，兼容性比 8 位 hex 更好 */
function xsColor(color) {
  if (typeof color !== 'string') return color || '#888888';
  const t = color.trim();
  if (/^#[0-9a-f]{8}$/i.test(t)) {
    const r = parseInt(t.slice(1, 3), 16);
    const g = parseInt(t.slice(3, 5), 16);
    const b = parseInt(t.slice(5, 7), 16);
    const a = parseInt(t.slice(7, 9), 16) / 255;
    return `rgba(${r},${g},${b},${a.toFixed(3)})`;
  }
  return t;
}

/* 给颜色叠加指定透明度，返回 rgba()。
 * 注意不能简单拼接字符串：配置里的颜色可能是 #RRGGBBAA（如燃气的 #f66f07ff），
 * 再拼 '40' 会得到 '#f66f07ff40' 这种非法值，Canvas 会静默沿用上一次的填充色。
 * 支持 #RGB / #RRGGBB / #RRGGBBAA / rgb() / rgba()。 */
function xsFade(color, alpha) {
  const a = typeof alpha === 'number' ? Math.max(0, Math.min(1, alpha)) : 0.25;
  if (typeof color !== 'string') return color;
  const t = color.trim();
  let m;
  if ((m = /^#([0-9a-f])([0-9a-f])([0-9a-f])$/i.exec(t))) {
    const c = (s) => parseInt(s + s, 16);
    return `rgba(${c(m[1])},${c(m[2])},${c(m[3])},${a})`;
  }
  if ((m = /^#([0-9a-f]{6})([0-9a-f]{2})?$/i.exec(t))) {
    const h = m[1];
    return `rgba(${parseInt(h.slice(0, 2), 16)},${parseInt(h.slice(2, 4), 16)},${parseInt(h.slice(4, 6), 16)},${a})`;
  }
  if ((m = /^rgba?\(([^)]+)\)$/i.exec(t))) {
    const p = m[1].split(',').map((s) => s.trim());
    if (p.length >= 3) return `rgba(${p[0]},${p[1]},${p[2]},${a})`;
  }
  return t;
}

function xsNum(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

/* 计算"整齐"的 Y 轴刻度，避免出现 3.3 / 6.6 这种刻度值。
 * minValue < 0 时给负半轴按**同一步长**补刻度（收入按负轴显示就靠它）；
 * 不传 minValue 时 min = 0、negCount = 0，行为与改动前完全一致。 */
function xsNiceScale(maxValue, targetTicks, minValue) {
  const ticks = targetTicks || 5;
  const hi = maxValue > 0 ? maxValue : 0;
  const lo = minValue < 0 ? -minValue : 0;
  const span = Math.max(hi, lo);
  if (!(span > 0)) return { max: ticks, min: 0, step: 1, count: ticks, negCount: 0 };
  const raw = span / ticks;
  const mag = Math.pow(10, Math.floor(Math.log(raw) / Math.LN10));
  const norm = raw / mag;
  let step;
  if (norm <= 1) step = 1;
  else if (norm <= 2) step = 2;
  else if (norm <= 2.5) step = 2.5;
  else if (norm <= 5) step = 5;
  else step = 10;
  step *= mag;
  const count = Math.max(1, Math.ceil(hi / step - 1e-9));
  const negCount = lo > 0 ? Math.max(1, Math.ceil(lo / step - 1e-9)) : 0;
  return { max: step * count, min: -step * negCount, step, count, negCount };
}

function xsTickLabel(value, step) {
  if (step >= 1) return String(Math.round(value));
  const digits = step >= 0.1 ? 1 : 2;
  return (Math.round(value * 1000) / 1000).toFixed(digits);
}

class XsCanvasChart {
  constructor(container) {
    this.container = container;
    this.canvas = document.createElement('canvas');
    this.canvas.style.cssText = 'display:block;width:100%;height:100%;';
    this.tip = document.createElement('div');
    this.tip.style.cssText = 'position:absolute;left:0;top:0;z-index:9;display:none;pointer-events:none;max-width:92%;';
    container.appendChild(this.canvas);
    container.appendChild(this.tip);

    this._model = null;
    this._geo = null;
    this._geoModel = null;
    this._geoKey = null;
    this._hover = -1;

    /* 入场动画状态 */
    this._animP = 1;          // 当前进度 0~1
    this._animRaf = 0;        // rAF 句柄
    this._animPending = 0;    // 待启动的动画时长（毫秒），等容器真正可绘制时才开始计时
    this._animKey = undefined;// 已动画过的数据指纹
    this._animDur = 0;

    this._onMove = (e) => this._handleMove(e);
    this._onLeave = () => this._leaveTip();
    this.canvas.addEventListener('mousemove', this._onMove);
    this.canvas.addEventListener('mouseleave', this._onLeave);
    this.canvas.addEventListener('touchstart', this._onMove, { passive: true });
    this.canvas.addEventListener('touchmove', this._onMove, { passive: true });
    this.canvas.addEventListener('touchend', this._onLeave, { passive: true });

    this._ro = null;
    if (typeof ResizeObserver !== 'undefined') {
      this._ro = new ResizeObserver(() => this._draw());
      this._ro.observe(container);
    }

    // 字体加载完成后重绘一次，避免首帧文字宽度测量不准
    if (document.fonts && document.fonts.ready && document.fonts.ready.then) {
      document.fonts.ready.then(() => { if (this._model) this._draw(); }).catch(() => {});
    }
  }

  destroy() {
    this._stopAnim();
    if (this._ro) {
      try { this._ro.disconnect(); } catch (e) { /* ignore */ }
      this._ro = null;
    }
    this.canvas.removeEventListener('mousemove', this._onMove);
    this.canvas.removeEventListener('mouseleave', this._onLeave);
    this.canvas.removeEventListener('touchstart', this._onMove);
    this.canvas.removeEventListener('touchmove', this._onMove);
    this.canvas.removeEventListener('touchend', this._onLeave);
    if (this.canvas.parentNode) this.canvas.parentNode.removeChild(this.canvas);
    if (this.tip.parentNode) this.tip.parentNode.removeChild(this.tip);
    this._model = null;
    this._geo = null;
    this._geoModel = null;
  }

  render(model) {
    this._model = model;
    this._hover = -1;
    this._hideTip();

    /*
     * 入场动画：
     * - 传了 model.animKey（数据指纹）时，指纹变了才重播；
     * - 没传指纹时，只在实例的首次绘制播一次。
     * 这样 hass 刷新 / 容器尺寸变化都不会把动画反复重启。
     */
    const dur = this._animDuration(model);
    const hasKey = !!(model && model.animKey !== undefined && model.animKey !== null);
    let changed;
    if (hasKey) {
      const key = String(model.animKey);
      changed = key !== this._animKey;
      this._animKey = key;
    } else {
      changed = this._animKey === undefined;
      if (this._animKey === undefined) this._animKey = '__once__';
    }

    if (dur > 0 && changed && !this._reducedMotion()) {
      this._stopAnim();
      this._animP = 0;
      this._animPending = dur;   // 真正的计时在 _draw() 里第一次能画出来时才开始
    } else {
      this._stopAnim();
      this._animP = 1;
    }

    this._draw();
    // 再补一帧：卡片刚插入 DOM 时首个绘制时机可能还没完成布局，下一帧重画一次即可
    if (typeof requestAnimationFrame === 'function') {
      requestAnimationFrame(() => {
        if (this._model === model) this._draw();
      });
    }
  }

  clear() {
    this._stopAnim();
    this._model = null;
    this._geo = null;
    this._geoModel = null;
    this._hover = -1;
    this._animP = 1;
    this._hideTip();
    this._draw();
  }

  /* -------------------------------------------------------------- 动画 */

  _animDuration(model) {
    if (!model || model.animation === false) return 0;
    const d = model.animationDuration === undefined ? 900 : +model.animationDuration;
    return Number.isFinite(d) && d > 0 ? d : 0;
  }

  _reducedMotion() {
    return typeof matchMedia === 'function'
      && matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  _now() {
    return (typeof performance !== 'undefined' && performance.now) ? performance.now() : Date.now();
  }

  _stopAnim() {
    this._animPending = 0;
    if (this._animRaf) {
      if (typeof cancelAnimationFrame === 'function') cancelAnimationFrame(this._animRaf);
      this._animRaf = 0;
    }
  }

  _runAnim(dur) {
    this._animDur = dur;
    const t0 = this._now();
    const tick = () => {
      const raw = Math.min(1, (this._now() - t0) / dur);
      // easeOutCubic：起步快、收尾稳，比线性更接近原生观感
      this._animP = raw >= 1 ? 1 : 1 - Math.pow(1 - raw, 3);
      this._draw();
      if (raw < 1) {
        this._animRaf = requestAnimationFrame(tick);
      } else {
        this._animRaf = 0;
        this._animP = 1;
      }
    };
    this._animRaf = requestAnimationFrame(tick);
  }

  /* ------------------------------------------------------------------ 绘制 */

  _draw() {
    const canvas = this.canvas;
    if (!canvas || !canvas.isConnected) return;

    const cssW = this.container.clientWidth;
    const cssH = this.container.clientHeight;
    const model = this._model;

    // 容器不可见（display:none / 未布局）时不绘制，等 ResizeObserver 再次触发
    if (cssW < 20 || cssH < 20) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 3);
    const pxW = Math.round(cssW * dpr);
    const pxH = Math.round(cssH * dpr);
    if (canvas.width !== pxW || canvas.height !== pxH) {
      canvas.width = pxW;
      canvas.height = pxH;
      canvas.style.width = cssW + 'px';
      canvas.style.height = cssH + 'px';
    }

    const ctx = canvas.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, cssW, cssH);

    if (!model) {
      this._geo = null;
      this._geoModel = null;
      return;
    }

    // 几何只在「换模型」或「尺寸变化」时重算；动画每帧重绘不至于反复量文字
    const sizeKey = cssW + 'x' + cssH;
    if (this._geoModel !== model || this._geoKey !== sizeKey || !this._geo) {
      this._geo = this._compute(ctx, model, cssW, cssH);
      this._geoModel = model;
      this._geoKey = sizeKey;
    }

    this._paint(ctx, model, this._geo);

    // 容器此时才真正可绘制 —— 动画从这一帧开始计时，避免面板刚展开就空掉一半
    if (this._animPending) {
      const dur = this._animPending;
      this._animPending = 0;
      this._runAnim(dur);
    }
  }

  _legendItems(model) {
    const items = [];
    const push = (name, color, values) => {
      if (!name) return;
      // 全 0 的序列不进图例；**全负的（收入画在负轴）也要进**
      if (values && !values.some((v) => xsNum(v) !== 0)) return;
      if (items.some((it) => it.name === name)) return;
      items.push({ name: name, color: xsColor(color), _w: 0 });
    };
    (model.groups || []).forEach((g) => (g.series || []).forEach((s) => push(s.name, s.color, s.values)));
    (model.lines || []).forEach((l) => push(l.name, l.color, l.values));
    return items;
  }

  _compute(ctx, model, cssW, cssH) {
    const slotCount = Math.max(1, model.slotCount || 1);
    const groups = model.groups || [];
    const gCount = Math.max(1, groups.length);

    /* 1. 图例布局 */
    const legendItems = model.legend === false ? [] : this._legendItems(model);
    const legendRows = [];
    if (legendItems.length) {
      ctx.font = xsFont(11);
      const maxRowW = Math.max(60, cssW - 8);
      let row = [];
      let rowW = 0;
      legendItems.forEach((it) => {
        const w = ctx.measureText(it.name).width + 26;
        it._w = w;
        if (row.length && rowW + w > maxRowW) {
          legendRows.push({ items: row, width: rowW });
          row = [];
          rowW = 0;
        }
        row.push(it);
        rowW += w;
      });
      if (row.length) legendRows.push({ items: row, width: rowW });
    }
    const legendH = legendRows.length ? legendRows.length * 15 + 4 : 0;

    /* 2. Y 轴刻度 */
    let maxRaw = xsNum(model.yMax);
    let minRaw = 0;
    if (!(maxRaw > 0)) {
      // 同一柱位内：正值往上堆、负值往下堆，两个方向各自求极值
      (model.groups || []).forEach((g) => {
        for (let i = 0; i < slotCount; i++) {
          let pos = 0;
          let neg = 0;
          (g.series || []).forEach((s) => {
            const v = xsNum(s.values[i]);
            if (v >= 0) pos += v; else neg += v;
          });
          if (pos > maxRaw) maxRaw = pos;
          if (neg < minRaw) minRaw = neg;
        }
      });
      (model.lines || []).forEach((l) => l.values.forEach((v) => {
        const n = xsNum(v);
        if (n > maxRaw) maxRaw = n;
        if (n < minRaw) minRaw = n;
      }));
      maxRaw *= 1.12;
      if (minRaw < 0) minRaw *= 1.12;
    }
    const scale = xsNiceScale(maxRaw, model.yTicks || 5, minRaw);

    /* 3. 轴标签宽度决定左边距 */
    ctx.font = xsFont(10);
    let yLabelW = 0;
    for (let i = -(scale.negCount || 0); i <= scale.count; i++) {
      const w = ctx.measureText(xsTickLabel(scale.step * i, scale.step)).width;
      if (w > yLabelW) yLabelW = w;
    }
    /* 图表区左右各留一段外边距，避免贴边 */
    const sidePad = Number.isFinite(+model.sidePad) ? Math.max(0, +model.sidePad) : 14;
    const padLeft = Math.min(Math.max(yLabelW + 7, 22), cssW * 0.3) + sidePad;
    const padRight = sidePad;

    const padTop = 18;
    const slotLabelH = model.slotLabel ? 15 : 2;
    const plot = {
      x: padLeft,
      y: padTop,
      w: Math.max(10, cssW - padLeft - padRight),
      h: Math.max(10, cssH - padTop - slotLabelH - legendH - 4)
    };

    const slotW = plot.w / slotCount;
    const ratio = model.barWidthRatio === undefined ? (gCount > 1 ? 0.68 : 0.62) : model.barWidthRatio;
    const bandW = Math.max(1, Math.min(slotW * ratio, slotW - 1));
    const gapW = gCount > 1 ? Math.min(2, bandW * 0.08) : 0;
    const barW = Math.max(1, (bandW - gapW * (gCount - 1)) / gCount);

    /* 4. X 轴标签防重叠：宽度不够时抽稀。
       注意不能「贴着放」直接贪心 —— 那样会出现「中间某个月份被跳过、前后疏密不均」
       （月视图就会漏掉 11 月、却保留 12 月）。改成两步：
       ① 先用贪心数出最多放得下几个；② 再按等间隔从候选里挑这个数量。 */
    const labels = [];
    let slotFont = 10;
    if (model.slotLabel) {
      const items = [];
      for (let i = 0; i < slotCount; i++) {
        const text = model.slotLabel(i);
        if (text) items.push({ i, text: String(text) });
      }
      const at = (it) => ({ x: plot.x + slotW * (it.i + 0.5), text: it.text });
      if (model.slotLabelAll) {
        /* 要求「每个槽位都要有标签」（月视图 1..12 月）：不抽稀，改为把字号缩到放得下。
           从 10px 逐档降到 7px，取第一个「相邻标签不重叠」的档位；都放不下就用最小档硬画。
           注意：抽稀方案会漏掉中间月份（1/3/5/7/9/11），所以要「全都要」只能靠缩字号。 */
        for (const cand of [10, 9, 8, 7]) {
          slotFont = cand;
          ctx.font = xsFont(cand);
          let overlap = false;
          for (let k = 0; k + 1 < items.length; k++) {
            const a = items[k];
            const b = items[k + 1];
            const rightA = plot.x + slotW * (a.i + 0.5) + ctx.measureText(a.text).width / 2 + 1;
            const leftB = plot.x + slotW * (b.i + 0.5) - ctx.measureText(b.text).width / 2 - 1;
            if (rightA > leftB) { overlap = true; break; }
          }
          if (!overlap) break;
        }
        items.forEach((it) => labels.push(at(it)));
      } else {
        /* 槽位太多（日视图 31 天）时抽稀：先贪心数出最多放得下几个，再按等间隔挑这个数量。
           不能「贴着放」直接贪心 —— 那样中间会出现「跳过一格、前后疏密不均」。 */
        ctx.font = xsFont(10);
        let fitted = 0;
        let lastRight = -Infinity;
        items.forEach((it) => {
          const half = ctx.measureText(it.text).width / 2 + 3;
          const cx = plot.x + slotW * (it.i + 0.5);
          if (cx - half < lastRight) return;
          fitted++;
          lastRight = cx + half;
        });
        if (fitted >= items.length) {
          items.forEach((it) => labels.push(at(it)));
        } else {
          const step = Math.max(1, Math.ceil(items.length / Math.max(1, fitted)));
          for (let k = 0; k < items.length; k += step) labels.push(at(items[k]));
        }
      }
    }

    return {
      cssW, cssH, plot, slotCount, slotW, bandW, barW, gapW, gCount,
      scale, legendRows, legendH, slotLabelH, slotFont, labels
    };
  }

  _groupLeft(geo, slotIndex, groupIndex) {
    const bandLeft = geo.plot.x + geo.slotW * slotIndex + (geo.slotW - geo.bandW) / 2;
    return bandLeft + groupIndex * (geo.barW + geo.gapW);
  }

  _groupCenter(geo, slotIndex, groupIndex) {
    return this._groupLeft(geo, slotIndex, groupIndex) + geo.barW / 2;
  }

  _paint(ctx, model, geo) {
    const fg = model.fg || (model.theme === 'dark' ? 'rgb(255,255,255)' : 'rgb(0,0,0)');
    const dark = model.theme === 'dark';
    const stripeColor = dark ? 'rgba(255,255,255,0.055)' : 'rgba(0,0,0,0.045)';
    const hoverColor = dark ? 'rgba(255,255,255,0.13)' : 'rgba(0,0,0,0.075)';
    const gridColor = dark ? 'rgba(255,255,255,0.22)' : 'rgba(0,0,0,0.16)';

    const plot = geo.plot;
    const max = geo.scale.max;
    const min = geo.scale.min || 0;
    const span = max - min || 1;
    /* 线性映射 [min, max] → [底, 顶]；有负半轴时 0 在中间偏上 */
    const toY = (v) => {
      const n = Math.min(Math.max(xsNum(v), min), max);
      return plot.y + plot.h - ((n - min) / span) * plot.h;
    };

    /* 入场动画进度：1 表示静止（无动画） */
    const p = (typeof this._animP === 'number' && this._animP < 1) ? Math.max(0, this._animP) : 1;
    // 逐槽位错开，形成从左往右"长出来"的波次
    const stagger = (p >= 1 || model.animationStagger === false)
      ? 0
      : Math.max(0, Math.min(0.7, model.animationStagger === undefined ? 0.35 : +model.animationStagger));
    const slotProgress = (i) => {
      if (p >= 1 || stagger <= 0) return 1;
      const n = geo.slotCount;
      const delay = n > 1 ? stagger * (i / (n - 1)) : 0;
      const span = 1 - stagger;
      const lp = span > 0 ? (p - delay) / span : 1;
      return lp <= 0 ? 0 : (lp >= 1 ? 1 : lp);
    };
    const revealX = plot.x + plot.w * p;   // 折线展开到的横坐标

    /* ---- 背景条纹 + 悬停高亮 ---- */
    for (let i = 0; i < geo.slotCount; i++) {
      const left = plot.x + i * geo.slotW;
      if (i % 2 === 1) {
        ctx.fillStyle = stripeColor;
        ctx.fillRect(Math.round(left), plot.y, Math.ceil(geo.slotW), plot.h);
      }
      if (i === this._hover) {
        ctx.fillStyle = hoverColor;
        ctx.fillRect(Math.round(left), plot.y, Math.ceil(geo.slotW), plot.h);
      }
    }

    /* ---- 网格线 ---- */
    const negTicks = geo.scale.negCount || 0;
    ctx.save();
    ctx.setLineDash([3, 3]);
    ctx.strokeStyle = gridColor;
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let i = -negTicks; i <= geo.scale.count; i++) {
      const y = Math.round(toY(geo.scale.step * i)) + 0.5;
      ctx.moveTo(plot.x, y);
      ctx.lineTo(plot.x + plot.w, y);
    }
    ctx.stroke();
    ctx.restore();

    /* 有负半轴时把 0 轴画成实线，正负一眼分得开 */
    if (negTicks > 0) {
      const y0 = Math.round(toY(0)) + 0.5;
      ctx.save();
      ctx.strokeStyle = fg;
      ctx.globalAlpha = 0.35;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(plot.x, y0);
      ctx.lineTo(plot.x + plot.w, y0);
      ctx.stroke();
      ctx.restore();
    }

    /* ---- 柱子（堆叠，正值往上、负值往下） ---- */
    (model.groups || []).forEach((group, gi) => {
      const series = group.series || [];
      for (let i = 0; i < geo.slotCount; i++) {
        const lp = slotProgress(i);
        if (lp <= 0) continue;                       // 还没长到这一格
        const x0 = this._groupLeft(geo, i, gi);
        const left = Math.round(x0);
        const width = Math.max(1, Math.round(x0 + geo.barW) - left);
        let accPos = 0;
        let accNeg = 0;
        for (let k = 0; k < series.length; k++) {
          const s = series[k];
          const v = xsNum(s.values[i]);
          if (v === 0) continue;
          let top;
          let bottom;
          if (v > 0) {
            // 从 0 往上堆
            top = Math.round(toY((accPos + v) * lp));
            bottom = Math.round(toY(accPos * lp));
            accPos += v;
          } else {
            // 从 0 往下堆（收入）
            top = Math.round(toY(accNeg * lp));
            bottom = Math.round(toY((accNeg + v) * lp));
            accNeg += v;
          }
          ctx.fillStyle = xsColor((s.pointColors && s.pointColors[i]) || s.color);
          ctx.fillRect(left, top, width, Math.max(1, bottom - top));
        }
      }
    });

    /* ---- 折线 ---- */
    (model.lines || []).forEach((line) => {
      const gi = line.groupIndex || 0;
      const lineColor = xsColor(line.color);
      const points = [];
      for (let i = 0; i < geo.slotCount; i++) {
        const raw = line.values[i];
        if (raw === null || raw === undefined || raw === '') { points.push(null); continue; }
        points.push({
          x: this._groupCenter(geo, i, gi),
          y: toY(raw),
          color: line.pointColors && line.pointColors[i] ? xsColor(line.pointColors[i]) : null
        });
      }
      // 逐段绘制：每段颜色取终点的 pointColor（预估段自然是淡化色），缺省 lineColor；相邻同色段合并成一条 path
      let prev = null;
      let curColor = null;
      let open = false;
      const closeSeg = () => { if (open) { ctx.stroke(); open = false; } };
      ctx.lineWidth = line.width || 2;
      ctx.lineJoin = 'round';
      ctx.lineCap = 'round';
      for (const pt of points) {
        if (!pt) { closeSeg(); prev = null; curColor = null; continue; }
        let end = pt;
        let truncated = false;
        if (pt.x > revealX) {
          // 动画进行中：把最后一段截断在 revealX 上，形成"画出来"的效果
          if (!prev) break;
          const k = (revealX - prev.x) / (pt.x - prev.x);
          end = { x: revealX, y: prev.y + (pt.y - prev.y) * k, color: pt.color };
          truncated = true;
        }
        const c = end.color || lineColor;
        if (!open || c !== curColor) {
          closeSeg();
          ctx.beginPath();
          ctx.strokeStyle = c;
          curColor = c;
          ctx.moveTo(prev ? prev.x : end.x, prev ? prev.y : end.y);
          open = true;
        }
        ctx.lineTo(end.x, end.y);
        if (truncated) { closeSeg(); break; }
        prev = pt;
      }
      closeSeg();

      if (line.markers !== false) {
        points.forEach((pt) => {
          if (!pt || pt.x > revealX) return;
          ctx.beginPath();
          ctx.arc(pt.x, pt.y, 2.4, 0, Math.PI * 2);
          ctx.fillStyle = pt.color || lineColor;
          ctx.fill();
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 1;
          ctx.stroke();
        });
      }
    });

    /* ---- 最高值标注 ---- */
    const mk = model.marker;
    // 峰值标注最后登场：动画尾段淡入，避免柱子还没长到位它就先飘在上面
    const mkP = p >= 1 ? 1 : Math.max(0, Math.min(1, (p - 0.68) / 0.32));
    if (mk && mk.text !== undefined && mkP > 0) {
      const i = Math.max(0, Math.min(geo.slotCount - 1, xsNum(mk.slot)));
      const x = this._groupCenter(geo, i, mk.groupIndex || 0);
      const y = toY(mk.value);
      ctx.save();
      ctx.globalAlpha = mkP;
      ctx.beginPath();
      ctx.arc(x, y, 4 * mkP, 0, Math.PI * 2);
      ctx.fillStyle = '#ffffff';
      ctx.fill();
      if (mkP > 0.35) {
        ctx.strokeStyle = xsColor(mk.color || fg);
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }

      if (mk.text) {
        ctx.globalAlpha = mkP;
        ctx.font = xsFont(11, 'bold');
        ctx.textAlign = 'center';
        ctx.textBaseline = 'bottom';
        ctx.fillStyle = mk.textColor ? xsColor(mk.textColor) : fg;
        const tw = ctx.measureText(mk.text).width;
        let tx = Math.min(Math.max(x, plot.x + tw / 2), plot.x + plot.w - tw / 2);
        ctx.fillText(mk.text, tx, y - 7);
      }
      ctx.restore();
    }

    /* ---- 「预计N日耗尽」气泡标签 ---- */
    const dp = model.depletion;
    if (dp && dp.text && mkP > 0) {
      const i = Math.max(0, Math.min(geo.slotCount - 1, xsNum(dp.slot)));
      const x = this._groupCenter(geo, i, dp.groupIndex || 0);
      const y = toY(xsNum(dp.value));
      ctx.save();
      ctx.globalAlpha = mkP;
      ctx.font = xsFont(11, 'bold');
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      const tw = ctx.measureText(dp.text).width;
      const padX = 8, bubbleH = 21, arrowH = 6;
      const bw = Math.ceil(tw) + padX * 2;
      // 气泡居中在目标柱子上方，箭头尖端指向柱子顶；水平方向不超出绘图区
      const cx = Math.min(Math.max(x, plot.x + bw / 2), plot.x + plot.w - bw / 2);
      const bubbleBottom = Math.max(y - arrowH - 2, plot.y + bubbleH);   // 气泡顶不越过绘图区上沿
      const bubbleTop = bubbleBottom - bubbleH;
      const bubbleColor = xsColor(dp.color || '#FF8C00');
      const rr = 6;
      const l = cx - bw / 2, t = bubbleTop, r = cx + bw / 2, b = bubbleBottom;
      ctx.beginPath();
      ctx.moveTo(l + rr, t);
      ctx.arcTo(r, t, r, b, rr);
      ctx.arcTo(r, b, l, b, rr);
      ctx.arcTo(l, b, l, t, rr);
      ctx.arcTo(l, t, r, t, rr);
      ctx.closePath();
      ctx.fillStyle = bubbleColor;
      ctx.fill();
      // 下尖角（指向柱子顶）
      ctx.beginPath();
      ctx.moveTo(x - 5, b - 0.5);
      ctx.lineTo(x + 5, b - 0.5);
      ctx.lineTo(x, b + arrowH);
      ctx.closePath();
      ctx.fill();
      // 文字
      ctx.fillStyle = '#ffffff';
      ctx.fillText(dp.text, cx, t + bubbleH / 2 + 0.5);
      ctx.restore();
    }

    /* ---- Y 轴刻度 ---- */
    ctx.font = xsFont(10);
    ctx.fillStyle = fg;
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    for (let i = -negTicks; i <= geo.scale.count; i++) {
      ctx.fillText(xsTickLabel(geo.scale.step * i, geo.scale.step), plot.x - 5, toY(geo.scale.step * i));
    }

    /* ---- X 轴标签（字号可能被 _compute 里的「全标签」模式压低过） ---- */
    if (geo.labels.length) {
      ctx.font = xsFont(geo.slotFont || 10);
      ctx.fillStyle = fg;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      geo.labels.forEach((lb) => ctx.fillText(lb.text, lb.x, plot.y + plot.h + 4));
    }

    /* ---- 图例 ---- */
    if (geo.legendRows.length) {
      ctx.font = xsFont(11);
      ctx.textBaseline = 'middle';
      ctx.textAlign = 'left';
      let y = plot.y + plot.h + geo.slotLabelH + 7;
      geo.legendRows.forEach((row) => {
        let x = Math.max(4, (geo.cssW - row.width) / 2);
        row.items.forEach((it) => {
          ctx.beginPath();
          ctx.arc(x + 5, y, 5, 0, Math.PI * 2);
          ctx.fillStyle = it.color;
          ctx.fill();
          ctx.fillStyle = fg;
          ctx.fillText(it.name, x + 14, y + 0.5);
          x += it._w;
        });
        y += 15;
      });
    }
  }

  /* -------------------------------------------------------------- 交互浮层 */

  _handleMove(e) {
    const model = this._model;
    const geo = this._geo;
    if (!model || !geo) return;
    const touch = e.touches && e.touches[0];
    if (e.touches && !touch) return;
    // 鼠标优先用 offsetX/offsetY：它是相对 canvas 自身盒子的坐标，
    // 即使外层有 CSS transform（弹层动画等）也不会算偏
    let x, y;
    if (!e.touches && typeof e.offsetX === 'number') {
      x = e.offsetX;
      y = e.offsetY;
    } else {
      const rect = this.canvas.getBoundingClientRect();
      x = (touch ? touch.clientX : e.clientX) - rect.left;
      y = (touch ? touch.clientY : e.clientY) - rect.top;
    }
    if (x < geo.plot.x - 6 || x > geo.plot.x + geo.plot.w + 6) { this._leaveTip(); return; }

    let index = Math.floor((x - geo.plot.x) / geo.slotW);
    if (index < 0) index = 0;
    if (index > geo.slotCount - 1) index = geo.slotCount - 1;
    if (index !== this._hover) {
      this._hover = index;
      this._draw();
    }

    if (typeof model.tooltip !== 'function') return;
    const html = model.tooltip(index);
    if (!html) { this._hideTip(); return; }

    this.tip.innerHTML = html;
    this.tip.style.display = 'block';
    const tw = this.tip.offsetWidth;
    const th = this.tip.offsetHeight;

    let left = x + 14;
    if (left + tw > geo.cssW - 2) left = x - 14 - tw;
    if (left < 2) left = 2;
    if (left + tw > geo.cssW - 2) left = Math.max(2, geo.cssW - tw - 2);

    let top = y - th - 12;
    if (top < 2) top = y + 16;
    if (top + th > geo.cssH - 2) top = Math.max(2, geo.cssH - th - 2);

    this.tip.style.left = Math.round(left) + 'px';
    this.tip.style.top = Math.round(top) + 'px';
  }

  _hideTip() {
    if (this.tip) this.tip.style.display = 'none';
  }

  _leaveTip() {
    if (this._hover !== -1) {
      this._hover = -1;
      this._draw();
    }
    this._hideTip();
  }
}

/* ==========================================================================
 * 主卡片：按类型展示本月 / 本年金额 + 日历 + 日 / 月图表
 * ========================================================================== */
class XiaoshiHouseholdExpenses extends LitElement {
  static get properties() {
    return {
      hass: { type: Object },
      config: { type: Object },
      width: { type: String, attribute: true },
      year: { type: Number },
      month: { type: Number },
      theme: { type: String },
      showPanel: { type: String },
      activeNav: { type: String },
      hiddenSlots: { type: Object },
      colorNum: { type: String, attribute: true },
      colorCost: { type: String, attribute: true },
      colorCal: { type: String, attribute: true }
    };
  }

  static getConfigElement() {
    return document.createElement('xiaoshi-household-expenses-editor');
  }

  static getStubConfig() {
    return { entities: { electric: '', gas: '', water: '', mortgage: '', property_fee: '' }, columns: 3 };
  }

  constructor() {
    super();
    const today = new Date();
    this.year = today.getFullYear();
    this.month = today.getMonth() + 1;
    this.width = '100%';
    this.theme = 'system';
    this.showPanel = '';
    this.activeNav = '';
    this.hiddenSlots = {};
    this.splitPayment = true;
    this.colorNum = '#07d2ff';
    this.colorCost = '#ff3d02';
    // 日历格里的金额底色：空 = 跟随 colorCost（原来的做法：色块 + 主题前景色文字），
    // 也可以用 color_cal 单独指定
    this.colorCal = '';
    this._chart = null;
    this._seriesCache = {};
    this._dayData = {};
    this._monthData = null;
    this._yearData = null;
  }

  setConfig(config) {
    if (!config) throw new Error('家庭支出卡片：配置不能为空');
    this.config = config;
    if (config.width !== undefined) this.width = config.width;
    if (config.year !== undefined) this.year = config.year;
    if (config.month !== undefined) this.month = config.month;
    if (config.color_num !== undefined) this.colorNum = config.color_num;
    if (config.color_cost !== undefined) this.colorCost = config.color_cost;
    if (config.color_cal !== undefined) this.colorCal = config.color_cal;
    // split_payment: false → 贷款类不拆分，房贷那格直接显示「月供 + 首付款」合计
    this.splitPayment = config.split_payment !== false;
    // hidden: [gas, water] → 初始不参与日历 / 图表的类型；点击格子可随时切换
    const hidden = {};
    (Array.isArray(config.hidden) ? config.hidden : []).forEach((key) => { hidden[key] = true; });
    this.hiddenSlots = hidden;
    // 默认弹出日历：不写 default_show_calendar 就是开启，写 false 才不弹
    this.showPanel = config.default_show_calendar !== false ? 'calendar' : '';
    this._seriesCache = {};
    this.requestUpdate();
  }

  connectedCallback() {
    super.connectedCallback();
    this._seriesCache = {};
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this._destroyChart();
  }

  updated(changedProperties) {
    super.updated(changedProperties);
    if (this.showPanel === 'dayUsage') this._renderDayChart();
    else if (this.showPanel === 'monthUsage') this._renderMonthChart();
    else this._destroyChart();
    // 饼图的 SVG 是拼字符串注入的（见 _pieSvgMarkup 的注释），要在 DOM 更新后自己刷
    if (this.showPanel === 'pieMonth' || this.showPanel === 'pieYear') this._paintPie();
  }

  getCardSize() {
    return this.showPanel ? 10 : 5;
  }

  /* ====================== 主题 ====================== */
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
    } catch (e) {
      return 'light';
    }
  }

  /* ====================== 槽位 ====================== */
  /* 一个类型 = 一个槽位，可以挂多个实体（多块表求和）。
     配置了实体、且至少一个实体当前存在的才显示；没配置 / 全部不存在的自动不显示。

     贷款类拆成两格：
       房贷(月供) + 房款(首付款) / 车贷 + 车款 / 消费贷 + 消费款
     两格共用同一个（或同一组）实体，只是各取一个金额分量。
     split_payment: false 时不拆 —— 派生格不出现，主格直接显示两分量之和。 */
  _slots() {
    const out = [];
    const states = this.hass && this.hass.states ? this.hass.states : {};
    const split = this.splitPayment !== false;
    HE_SLOT_DEFS.forEach((def) => {
      if (def.derived && !split) return;              // 不拆分 → 不产生派生格
      const sourceKey = def.source || def.key;         // 派生格从主槽位取实体配置
      const items = heSlotEntityItems(this.config, sourceKey)
        .map((it) => ({ entityId: it.entityId, name: it.name, state: states[it.entityId] }))
        .filter((it) => it.state);
      if (!items.length) return;
      let part = def.part || 'both';
      if (part === 'primary' && !split) part = 'both'; // 不拆分 → 主格合并显示
      // 一个类型挂了多块表 → 每块表**独立成一格**（不再求和成一个「×N」格子）
      items.forEach((it) => {
        out.push({
          key: items.length > 1 ? `${def.key}#${it.entityId}` : def.key,
          baseKey: def.key,
          label: it.name || def.label,
          dir: def.dir,
          icon: def.icon,
          color: def.color,
          part,
          sourceKey,
          derived: !!def.derived,
          items: [it],
          entityIds: [it.entityId]
        });
      });
    });
    return out;
  }

  /* 是否被点掉：格子自己的键，或它所属类型的键（`hidden: [电]` 能一次隐藏该类型所有格子） */
  _isSlotHidden(slot) {
    return !!(this.hiddenSlots[slot.key] || this.hiddenSlots[slot.baseKey]);
  }

  /* 参与日历 / 图表的槽位 = 已配置的槽位 − 被点掉的槽位 */
  _visibleSlots() {
    return this._slots().filter((slot) => !this._isSlotHidden(slot));
  }

  /* 传格子对象或 key 都行；点的时候连带清掉该类型在配置里的整体 hidden */
  _toggleSlot(target) {
    const slot = typeof target === 'string'
      ? (this._slots().find((s) => s.key === target) || { key: target, baseKey: target })
      : target;
    const next = Object.assign({}, this.hiddenSlots);
    const wasOff = this._isSlotHidden(slot);
    delete next[slot.key];
    delete next[slot.baseKey];
    if (!wasOff) next[slot.key] = true;
    this.hiddenSlots = next;
    if (this._chart) this._chart.drawnKey = null;   // 图例变了，强制重绘
    this.requestUpdate();
  }

  /* 该槽位的日 / 月 / 年金额序列（按实体 + last_updated 缓存，避免每次 hass 刷新重算）。
     一个类型挂了多块表时，逐键求和合并成一路。 */
  _slotSeries(slot) {
    // 同一个实体可能被两个槽位共用（房贷 / 房款），缓存键必须带上 part 才不会串
    const cacheKey = `${slot.key}#${slot.part}#${slot.entityIds.join(',')}`;
    const stamp = slot.items.map((it) => `${it.entityId}@${it.state.last_updated || ''}`).join('|');
    const cached = this._seriesCache[cacheKey];
    if (cached && cached.stamp === stamp) return cached.value;
    const value = heMergeSeries(
      slot.items.map((it) => heExtractSeries(it.state.attributes || {}, slot.part))
    );
    this._seriesCache[cacheKey] = { stamp, value };
    return value;
  }

  /* 某槽位的「本月 / 本年」金额。
   * 优先用该年月在 monthlist / yearlist 里的实际值（翻看历史月份也准），
   * 只有"账本给的当月 / 当年合计"且正好在看当前年月时才回退到合计字段。 */
  _slotAmount(slot, scope) {
    const ser = this._slotSeries(slot);
    const today = new Date();
    if (scope === 'month') {
      const key = `${this.year}-${hePad2(this.month)}`;
      if (ser.months[key] !== undefined) return ser.months[key];
      const isCurrentMonth = this.year === today.getFullYear() && this.month === (today.getMonth() + 1);
      if (isCurrentMonth && ser.monthTotal !== null) return ser.monthTotal;
      return 0;
    }
    const key = String(this.year);
    if (ser.years[key] !== undefined) return ser.years[key];
    if (this.year === today.getFullYear() && ser.yearTotal !== null) return ser.yearTotal;
    return 0;
  }

  /* 某槽位某天的金额：优先日明细；只有月明细时按「月金额 ÷ 当月天数」均摊
     （household_expenses 的房贷 / 车贷 / 消费贷 / 物业费就是这个口径） */
  _slotDayValue(ser, year, month, day) {
    const key = `${year}-${hePad2(month)}-${hePad2(day)}`;
    if (ser.days[key] !== undefined) return ser.days[key];
    const monthKey = `${year}-${hePad2(month)}`;
    if (ser.months[monthKey] !== undefined) {
      return ser.months[monthKey] / heDaysInMonth(year, month);
    }
    return 0;
  }

  /* ====================== 日历 / 图表的合计数据 ====================== */
  /* 日历只统计「支出」：收入是按月的租金，摊到每一天没有意义，
     混进合计还会把"这天花了不少"读成"这天收了不少"。 */
  _calSlots() {
    return this._visibleSlots().filter((slot) => slot.dir === 'expense');
  }

  _mergedDays() {
    const days = {};
    const dim = heDaysInMonth(this.year, this.month);
    const monthPrefix = `${this.year}-${hePad2(this.month)}`;
    this._calSlots().forEach((slot) => {
      const ser = this._slotSeries(slot);
      for (let d = 1; d <= dim; d++) {
        const value = this._slotDayValue(ser, this.year, this.month, d);
        if (!value) continue;
        const key = `${monthPrefix}-${hePad2(d)}`;
        days[key] = (days[key] || 0) + value;
      }
    });
    return days;
  }

  _mergedMonthTotal() {
    let total = 0;
    const key = `${this.year}-${hePad2(this.month)}`;
    const isCurrentMonth = this.year === new Date().getFullYear() && this.month === (new Date().getMonth() + 1);
    this._calSlots().forEach((slot) => {
      const ser = this._slotSeries(slot);
      if (ser.months[key] !== undefined) total += ser.months[key];
      else if (isCurrentMonth && ser.monthTotal !== null) total += ser.monthTotal;
    });
    return total;
  }

  _mergedYearTotal() {
    let total = 0;
    const key = String(this.year);
    const isCurrentYear = this.year === new Date().getFullYear();
    this._calSlots().forEach((slot) => {
      const ser = this._slotSeries(slot);
      if (ser.years[key] !== undefined) total += ser.years[key];
      else if (isCurrentYear && ser.yearTotal !== null) total += ser.yearTotal;
    });
    return total;
  }

  /* 日图表数据：当月每一天 × 每个可见槽位（按 支出 / 收入 分成两组并排柱） */
  _processedDayData() {
    const slots = this._visibleSlots();
    if (!slots.length) return null;
    const dim = heDaysInMonth(this.year, this.month);
    const categories = [];
    for (let d = 1; d <= dim; d++) categories.push(d);

    const build = (list) => list.map((slot) => {
      const ser = this._slotSeries(slot);
      return {
        key: slot.key,
        name: slot.label,
        color: slot.color,
        values: categories.map((d) => this._slotDayValue(ser, this.year, this.month, d))
      };
    });
    const sum = (series, i) => series.reduce((acc, s) => acc + (s.values[i] || 0), 0);
    const expenseSeries = build(slots.filter((s) => s.dir === 'expense'));
    const incomeSeries = build(slots.filter((s) => s.dir === 'income'));
    const expenseTotal = categories.map((_, i) => sum(expenseSeries, i));
    const incomeTotal = categories.map((_, i) => sum(incomeSeries, i));
    return {
      categories,
      expenseSeries,
      incomeSeries,
      expenseTotal,
      incomeTotal,
      monthExpense: expenseTotal.reduce((a, b) => a + b, 0)
    };
  }

  /* 月图表数据：当年 12 个月 × 每个可见槽位（同样按 支出 / 收入 分组） */
  _processedMonthData() {
    const slots = this._visibleSlots();
    if (!slots.length) return null;
    const year = String(this.year);

    const build = (list) => list.map((slot) => {
      const ser = this._slotSeries(slot);
      const values = [];
      for (let m = 1; m <= 12; m++) {
        const key = `${year}-${hePad2(m)}`;
        values.push(ser.months[key] !== undefined ? ser.months[key] : 0);
      }
      return { key: slot.key, name: slot.label, color: slot.color, values };
    });
    const sum = (series, i) => series.reduce((acc, s) => acc + (s.values[i] || 0), 0);
    const expenseSeries = build(slots.filter((s) => s.dir === 'expense'));
    const incomeSeries = build(slots.filter((s) => s.dir === 'income'));
    const expenseTotal = [];
    const incomeTotal = [];
    for (let i = 0; i < 12; i++) {
      expenseTotal.push(sum(expenseSeries, i));
      incomeTotal.push(sum(incomeSeries, i));
    }
    return { expenseSeries, incomeSeries, expenseTotal, incomeTotal, year };
  }

  /* ====================== 金额按钮组（本月 / 本年） ====================== */
  _cell(slot, scope) {
    const off = this._isSlotHidden(slot);
    const value = this._slotAmount(slot, scope);
    const theme = this._evaluateTheme();
    const textColor = theme === 'light' ? 'rgb(0, 0, 0)' : 'rgb(255, 255, 255)';
    const partHint = slot.part === 'primary'
      ? '只取月供（金额1）'
      : slot.part === 'secondary' ? '只取首付款 / 一次性（金额2）' : '';
    const tip = [
      slot.label,
      partHint,
      slot.entityIds.join(' + '),
      '点击切换是否参与日历 / 日 / 月视图'
    ].filter(Boolean).join(' · ');
    // 按钮底色 = 该类型颜色的浅底（原来靠行首圆点做区分的，圆点已去掉）
    // 划掉（不参与视图）时**不要底色**，改用与未划掉底色同色的描边 + 数值删除线来区分
    const bg = heAlpha(slot.color, theme === 'light' ? 0.13 : 0.22);
    return html`
      <div class="he-cell ${off ? 'off' : 'on'}"
           data-key="${slot.key}" data-scope="${scope}"
           style="background: ${off ? 'transparent' : bg}; border-color: ${off ? this._slotBorder(slot.color) : 'transparent'}; color: ${off ? textColor : slot.color};"
           @click=${() => this._toggleSlot(slot)}
           title="${tip}">
        <div class="he-name">${slot.label}</div>
        <div class="he-value">${value.toFixed(2)}</div>
      </div>
    `;
  }

  /* 「月」/「年」两个列区域的浅底颜色（年稍深一档，左右分区一眼能分清） */
  _colBg(scope) {
    const theme = this._evaluateTheme();
    if (scope === 'year') return theme === 'light' ? 'rgba(150, 150, 150, 0.17)' : 'rgba(255, 255, 255, 0.12)';
    return theme === 'light' ? 'rgba(150, 150, 150, 0.10)' : 'rgba(255, 255, 255, 0.07)';
  }

  /* 视图按钮区域 / 年月切换条的底色：跟表头同色，让卡片里这几条看起来是一套 */
  _barBg() {
    return this._colBg('month');
  }

  /* 划掉态（不参与日历 / 图表）的描边颜色 = 「未划掉的底色」在卡片上的实色。
     跟底色是同一个颜色，只是压成不透明：半透明色当 1px 描边用，
     叠在列区域浅底上几乎看不见（13% 的线 ≈ 浅底本身）。 */
  _slotBorder(hex) {
    const theme = this._evaluateTheme();
    const a = theme === 'light' ? 0.13 : 0.22;
    const base = theme === 'light' ? [255, 255, 255] : [50, 50, 50];
    const m = /^#?([0-9a-fA-F]{6})$/.exec(String(hex || '').trim());
    if (!m) return 'rgba(150, 150, 150, 0.45)';
    const n = parseInt(m[1], 16);
    const mix = [(n >> 16) & 255, (n >> 8) & 255, n & 255]
      .map((v, i) => Math.round(base[i] * (1 - a) + v * a));
    return `rgb(${mix[0]}, ${mix[1]}, ${mix[2]})`;
  }

  /* 一组（支出 / 收入）：左侧竖排标签 + 「月」浅底区 + 「年」浅底区。
     两区之间不再放间隔列（表头已经去掉 he-gap），靠底色深浅 + 4px 列间距区分。
     区域内再按 cols 排按钮，行数由内容自动决定（不足一行时后面的列自然留白）。 */
  _renderGroup(name, list, cols) {
    if (!list.length) return html``;
    const block = (scope) => html`
      <div class="he-block"
           style="grid-column: span ${cols}; grid-template-columns: repeat(${cols}, minmax(0, 1fr)); background: ${this._colBg(scope)};">
        ${list.map((slot) => this._cell(slot, scope))}
      </div>
    `;
    return html`
      <div class="he-tag">${name}</div>
      ${block('month')}
      ${block('year')}
    `;
  }

  /* 「日历 / 日 / 月」按钮区域：独立一条，放在表格下面、年月切换条上面。
     当前展开的那个视图按钮带选中底色。面板收起时整条加 .collapsed：**背景框高度不变**，
     只是整条上抬，让背景框和卡片底边之间留出间距。 */
  renderTabs() {
    const theme = this._evaluateTheme();
    const Color = theme === 'light' ? 'rgb(0, 0, 0)' : 'rgb(255, 255, 255)';
    // 选中态用自定义类名 .sel，**不能用 .active** —— 切片里 `.action-button.active`
    // 有一条 `background: rgba(0,160,160,.8) !important` 的青色底，会盖掉内联背景；
    // 底色也不走 CSS 变量：实测 var(--x) 写在 !important 声明里时，
    // 首次渲染能生效、之后切换类名不再刷新（背景不跟着选中态变）。
    const bg = theme === 'light' ? 'rgba(150, 150, 150, 0.10)' : 'rgba(255, 255, 255, 0.10)';
    // 选中底色：青色（就是切片里 .action-button.active 那个颜色，但我们走内联 + .sel 类，
    // 不碰 .active —— 切片那条带 !important，会反过来把内联底色盖掉）
    const bgOn = 'rgba(0, 160, 160, 0.8)';
    const btn = (panel, handler, content) => {
      const on = this.showPanel === panel;
      return html`
        <div class="action-button ${on ? 'sel' : ''}"
             style="background: ${on ? bgOn : bg}; color: ${Color}; flex: 1;"
             @click=${handler}>${content}</div>
      `;
    };
    // 图标比 12px 文字略大一点即可：16px 在 30px 高的按钮里显得压字，收到 14px
    const icon = (name) => html`<ha-icon icon="mdi:${name}"
      style="--mdc-icon-size: 12px; vertical-align: middle;"></ha-icon> `;
    return html`
      <div class="he-toolbar ${this.showPanel ? '' : 'collapsed'}"
           style="background: ${this._barBg()};">
        <div class="action-buttons" style="display: flex; gap: 6px;">
          ${btn('calendar', () => this.showCalendar(), html`${icon('calendar')}日历`)}
          ${btn('dayUsage', () => this.showDayUsage(), html`${icon('chart-bar')}日`)}
          ${btn('monthUsage', () => this.showMonthUsage(), html`${icon('chart-bar')}月`)}
          ${btn('pieMonth', () => this.showPieMonth(), html`${icon('chart-donut')}月`)}
          ${btn('pieYear', () => this.showPieYear(), html`${icon('chart-donut')}年`)}
        </div>
      </div>
    `;
  }

  /* 年月切换条：表格 → 视图按钮区域 → 这条 → 面板，日历 / 日 / 月 三个视图共用 */
  renderTopNav() {
    const theme = this._evaluateTheme();
    const Color = theme === 'light' ? 'rgb(0, 0, 0)' : 'rgb(255, 255, 255)';
    // 底色 / 左右边距跟表头、按钮区域一致：整卡几条「条」宽度对齐、颜色统一
    return html`
      <div class="he-topnav" style="color: ${Color}; background: ${this._barBg()};">
        ${this._navBtn('nyearlast', () => this.prevYear(), '◀')}
        <div class="celltotal he-topnav-label">${this.year}年</div>
        ${this._navBtn('nyearnext', () => this.nextYear(), '▶')}
        <div class="celltotal today-button he-topnav-today" @click=${() => this.goToToday()}>当月</div>
        ${this._navBtn('nmonthlast', () => this.prevMonth(), '◀')}
        <div class="celltotal he-topnav-label">${this.month}月</div>
        ${this._navBtn('nmonthnext', () => this.nextMonth(), '▶')}
      </div>
    `;
  }

  renderMain() {
    const theme = this._evaluateTheme();
    const Color = theme === 'light' ? 'rgb(0, 0, 0)' : 'rgb(255, 255, 255)';
    const BgColor = theme === 'light' ? 'rgb(255, 255, 255)' : 'rgb(50, 50, 50)';

    const slots = this._slots();
    if (!slots.length) {
      return html`
        <div class="card-main" style="background: ${BgColor}; color: ${Color}; padding: 16px; text-align: center;">
          请在卡片配置里为「电 / 气 / 水 / 房贷 …」选择实体
        </div>
      `;
    }

    const cols = Math.max(1, Number(this.config.columns) || 3);
    const expense = slots.filter((s) => s.dir === 'expense');
    const income = slots.filter((s) => s.dir === 'income');
    // 标题栏带上当前列合计（只算支出；收入不是"花掉的钱"，混进来会读不懂）
    const monthTotal = this._tableTotal('month');
    const yearTotal = this._tableTotal('year');
    const gridStyle = `grid-template-columns: 34px repeat(${cols}, minmax(0, 1fr)) repeat(${cols}, minmax(0, 1fr));`;

    return html`
      <div class="card-main" style="background: ${BgColor}; color: ${Color}; padding: 8px;">
        <div class="he-grid" style="${gridStyle}">
          <div class="he-corner"></div>
          <div class="he-head" style="grid-column: span ${cols}; background: ${this._colBg('month')};">
            本月 <span class="he-head-num" style="color: ${this.colorCost};">${monthTotal.toFixed(2)}元</span>
          </div>
          <div class="he-head" style="grid-column: span ${cols}; background: ${this._colBg('year')};">
            本年 <span class="he-head-num" style="color: ${this.colorCost};">${yearTotal.toFixed(2)}元</span>
          </div>
          ${this._renderGroup('家庭支出', expense, cols)}
          ${this._renderGroup('收入', income, cols)}
        </div>
      </div>
    `;
  }

  /* 标题栏合计：表格里显示的全部支出类型（含被点灰的，因为它们仍然显示在表里） */
  _tableTotal(scope) {
    let total = 0;
    this._slots().forEach((slot) => {
      if (slot.dir !== 'expense') return;
      total += this._slotAmount(slot, scope);
    });
    return total;
  }

  /* ====================== 日历 ====================== */
  getDaysInMonth(year, month) {
    return heDaysInMonth(year, month);
  }

  updateDayData() {
    const merged = this._mergedDays();
    this._dayData = merged;
    this._monthData = { cost: this._mergedMonthTotal() };
    this._yearData = { cost: this._mergedYearTotal() };
  }

  getDayData(year, month, day) {
    const key = `${year}-${hePad2(month)}-${hePad2(day)}`;
    const value = this._dayData ? this._dayData[key] : undefined;
    return value === undefined ? null : { cost: value };
  }

  prevYear() {
    this.year--;
    this.requestUpdate();
  }

  nextYear() {
    this.year++;
    this.requestUpdate();
  }

  prevMonth() {
    if (this.month === 1) { this.month = 12; this.year--; } else { this.month--; }
    this.requestUpdate();
  }

  nextMonth() {
    if (this.month === 12) { this.month = 1; this.year++; } else { this.month++; }
    this.requestUpdate();
  }

  goToToday() {
    const today = new Date();
    this.year = today.getFullYear();
    this.month = today.getMonth() + 1;
    this.requestUpdate();
  }

  /* 日历固定 6 行（42 格）——不再按月份算行数，换月时整卡高度不跳 */
  _calRows() {
    return 6;
  }

  /* 日历 / 日 / 月 三个面板共用的固定高度：
     星期行 30 + 日期区 205 + 网格上下 padding 20 = 255。
     其中日期区 205px = **改造前 5 行 × 41px 的观感高度**，所以固定 6 行后日历总高
     与原来 5 行版本完全一致；6 行均分 205px → 每行约 34.17px（比原来的 41px 矮）。
     日 / 月图表直接取这个值做卡片高度，三个视图切换时高度不跳。 */
  _panelHeight() {
    return 30 + 205 + 20;
  }

  /* 6 行均分日期区总高（205 / 6 ≈ 34.17px） */
  _calRowH() {
    return 205 / this._calRows();
  }

  renderCalendar() {
    const theme = this._evaluateTheme();
    const bgColor = this.config.transparent_bg === true ? 'transparent'
      : theme === 'light' ? 'rgb(255, 255, 255)' : 'rgb(50, 50, 50)';
    const fgColor = this.config.lock_white_fg === true ? 'rgb(255, 255, 255)'
      : theme === 'light' ? 'rgb(0, 0, 0)' : 'rgb(255, 255, 255)';

    this.updateDayData();

    // 日期数字圆底：按主题取反差配色
    const dayNumStyle = theme === 'light'
      ? 'background-color: rgba(0, 0, 0, 0.6); color: rgb(255, 255, 255);'
      : 'background-color: rgba(255, 255, 255, 0.6); color: rgb(0, 0, 0);';
    const fmt = (v) => (Number(v) || 0).toFixed(2);
    const daysInMonth = this.getDaysInMonth(this.year, this.month);
    const firstDayOfMonth = new Date(this.year, this.month - 1, 1).getDay();
    const adjustedFirstDay = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1;
    const days = [];
    const weekdayNames = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];
    // 年月导航已经挪到按钮区域下面（renderTopNav）。这里保留 7 个隐藏占位子元素，
    // 让 .calendar-grid 的子元素序号与切片样式里按 nth-child 写的边框规则保持一致。
    const navHolders = [0, 1, 2, 3, 4, 5, 6].map(() => html`<div class="he-nav-holder"></div>`);
    const weekdaysRow = weekdayNames.map((day, index) =>
      html`<div class="celltotal weekday" style="grid-area: week${index + 1};">${day}</div>`
    );
    for (let i = 0; i < adjustedFirstDay; i++) {
      days.push(html`<div class="cell" style="grid-area: id${i + 1};"></div>`);
    }
    const today = new Date();
    for (let i = 1; i <= daysInMonth; i++) {
      const dayData = this.getDayData(this.year, this.month, i);
      const isToday = today.getFullYear() === this.year && (today.getMonth() + 1) === this.month && today.getDate() === i;
      days.push(html`
        <div class="cell month-day" style="grid-area: id${i + adjustedFirstDay};">
          <div class="day-num" style="${dayNumStyle}${isToday ? ' box-shadow: 0 0 0 1px ' + this.colorCost + ';' : ''}">${i}</div>
          ${dayData ? html`
            <div class="electricity-cost"
                 style="background-color: ${this.colorCal || this.colorCost}; color: ${fgColor};">${fmt(dayData.cost)}</div>
          ` : ''}
        </div>
      `);
    }
    // 固定 6 行：补满 42 格（当月只占 5 行时，第 6 行是空格子，保持高度稳定）
    const totalCells = this._calRows() * 7;
    for (let i = daysInMonth + adjustedFirstDay + 1; i <= totalCells; i++) {
      days.push(html`<div class="cell" style="grid-area: id${i};"></div>`);
    }
    // 日历底部原来的「月合计 / 年合计」条已去掉：这两个数在表头（本月 / 本年）已经有了。
    // 行高 = 日期区总高 / 6 ≈ 34.17px（不再固定 41px），面板高度取 _panelHeight()，
    // 跟日 / 月图表对齐（三个视图切换时高度不跳）。
    return html`
      <div class="calendar-wrap" style="background-color: ${bgColor}; height: ${this._panelHeight()}px;">
        <div class="calendar-grid"
             style="color: ${fgColor}; grid-template-rows: 30px repeat(${this._calRows()}, ${this._calRowH()}px);">
          ${navHolders}
          ${weekdaysRow}
          ${days}
        </div>
      </div>
    `;
  }

  /* ====================== 图表 ====================== */
  _ensureChart() {
    const container = this.renderRoot.querySelector('#chart-container');
    if (!container) {
      this._destroyChart();
      return null;
    }
    if (!this._chart || this._chart.container !== container) {
      this._destroyChart();
      this._chart = new XsCanvasChart(container);
    }
    return this._chart;
  }

  _destroyChart() {
    if (this._chart) {
      try { this._chart.destroy(); } catch (e) { /* 忽略 */ }
      this._chart = null;
    }
  }

  /* 数据指纹：可见槽位 + 数据版本 + 主题，都没变就跳过重绘 */
  _chartKey(kind) {
    const parts = this._visibleSlots().map((slot) => {
      const ser = this._slotSeries(slot);
      return [
        slot.key,
        slot.part,
        slot.entityIds.join('+'),
        slot.items.map((it) => it.state.last_updated || '').join('+'),
        Object.keys(ser.days).length,
        Object.keys(ser.months).length
      ].join(':');
    });
    return [kind, this.year, this.month, this._evaluateTheme(), parts.join('|')].join('#');
  }

  _renderDayChart(force) {
    const chart = this._ensureChart();
    if (!chart) return;
    const key = this._chartKey('day');
    if (!force && chart.drawnKey === key) return;
    chart.drawnKey = key;
    const data = this._processedDayData();
    if (!data) {
      chart.clear();
      return;
    }
    const model = this._buildDayChartModel(data);
    model.animKey = key;
    chart.render(model);
  }

  _renderMonthChart(force) {
    const chart = this._ensureChart();
    if (!chart) return;
    const key = this._chartKey('month');
    if (!force && chart.drawnKey === key) return;
    chart.drawnKey = key;
    const data = this._processedMonthData();
    if (!data) {
      chart.clear();
      return;
    }
    const model = this._buildMonthChartModel(data);
    model.animKey = key;
    chart.render(model);
  }

  /* 每个类型 = 堆叠柱里的一段 */
  _toSeries(s) {
    return { name: s.name, color: s.color, values: s.values, pointColors: s.values.map(() => s.color) };
  }

  /* 图表只有一条柱位：支出往上堆（正值）、收入往下堆（负值），0 轴横在中间。
     收入取负号后仍用原色，靠方向区分收支，图例不必再加前缀。 */
  _signedGroups(data) {
    const series = data.expenseSeries.map((s) => this._toSeries(s));
    data.incomeSeries.forEach((s) => series.push(this._toSeries({
      name: s.name,
      color: s.color,
      values: s.values.map((v) => -Math.abs(Number(v) || 0))
    })));
    return series.length ? [{ series }] : [];
  }

  /* 「日」图表：当月每天一根柱（上=支出，下=收入） */
  _buildDayChartModel(data) {
    const theme = this._evaluateTheme();
    const maxExpense = data.expenseTotal.length ? Math.max(...data.expenseTotal) : 0;
    const maxIndex = data.expenseTotal.indexOf(maxExpense);

    return {
      theme,
      fg: theme === 'light' ? 'rgb(0, 0, 0)' : 'rgb(255, 255, 255)',
      slotCount: data.categories.length,
      slotLabel: (i) => ((i + 1) % 2 === 1 ? String(i + 1) : ''),
      legend: true,
      groups: this._signedGroups(data),
      lines: [],
      marker: maxExpense > 0 ? {
        slot: maxIndex, value: maxExpense, text: `${maxExpense.toFixed(2)}元`,
        color: this.colorCost, groupIndex: 0
      } : null,
      depletion: null,
      tooltip: (i) => this._buildDayTooltip(data, i)
    };
  }

  /* 「月」图表：当年 12 个月，同样上支出 / 下收入 */
  _buildMonthChartModel(data) {
    const theme = this._evaluateTheme();
    const maxExpense = data.expenseTotal.length ? Math.max(...data.expenseTotal) : 0;
    const maxIndex = data.expenseTotal.indexOf(maxExpense);

    return {
      theme,
      fg: theme === 'light' ? 'rgb(0, 0, 0)' : 'rgb(255, 255, 255)',
      slotCount: 12,
      slotLabel: (i) => `${i + 1}月`,
      // 12 个月份标签必须一个不少（抽稀会漏掉中间月份），字号由引擎自适应缩到放得下
      slotLabelAll: true,
      legend: true,
      groups: this._signedGroups(data),
      lines: [],
      marker: maxExpense > 0 ? {
        slot: maxIndex, value: maxExpense, text: `${maxExpense.toFixed(2)}元`,
        color: this.colorCost, groupIndex: 0
      } : null,
      tooltip: (i) => this._buildMonthTooltip(data, i)
    };
  }

  _tooltipShell(theme, title) {
    const fg = theme === 'light' ? 'rgb(0, 0, 0)' : 'rgb(255, 255, 255)';
    const bg = theme === 'light' ? 'rgb(255, 255, 255)' : 'rgb(50, 50, 50)';
    const row = (color, text) => `<div style="display:flex;align-items:center;margin:0;font-size:12px;border-bottom:1px dashed #999;"><span style="display:inline-block;width:8px;height:8px;background:${color};border-radius:50%;margin-right:5px;flex:0 0 auto;"></span><span style="color:${color}">${text}</span></div>`;
    let out = `<div style="background:${bg};color:${fg};padding:8px;border-radius:4px;border:1px solid ${fg};box-shadow:0 2px 10px rgba(0,0,0,0.18);white-space:nowrap;">`;
    out += `<div style="font-weight:bold;font-size:12px;color:${fg};border-bottom:1px dashed #999;">${title}</div>`;
    return { head: out, row, fg };
  }

  _buildDayTooltip(data, index) {
    const theme = this._evaluateTheme();
    const day = index + 1;
    const dateText = `${this.year}-${hePad2(this.month)}-${hePad2(day)}`;
    const shell = this._tooltipShell(theme, dateText);
    let out = shell.head;
    let expense = 0;
    let income = 0;
    data.expenseSeries.forEach((s) => {
      const value = Number(s.values[index]) || 0;
      if (value === 0) return;
      expense += value;
      out += shell.row(s.color, `支出·${s.name}: <strong>${value.toFixed(2)} 元</strong>`);
    });
    data.incomeSeries.forEach((s) => {
      const value = Number(s.values[index]) || 0;
      if (value === 0) return;
      income += value;
      out += shell.row(s.color, `收入·${s.name}: <strong>${value.toFixed(2)} 元</strong>`);
    });
    out += shell.row(shell.fg, `支出合计: <strong>${expense.toFixed(2)} 元</strong>`);
    if (income > 0) out += shell.row(shell.fg, `收入合计: <strong>${income.toFixed(2)} 元</strong>`);
    out += '</div>';
    return out;
  }

  _buildMonthTooltip(data, index) {
    const theme = this._evaluateTheme();
    const monthText = `${data.year}-${hePad2(index + 1)}`;
    const shell = this._tooltipShell(theme, monthText);
    let out = shell.head;
    let expense = 0;
    let income = 0;
    data.expenseSeries.forEach((s) => {
      const value = Number(s.values[index]) || 0;
      if (value === 0) return;
      expense += value;
      out += shell.row(s.color, `支出·${s.name}: <strong>${value.toFixed(2)} 元</strong>`);
    });
    data.incomeSeries.forEach((s) => {
      const value = Number(s.values[index]) || 0;
      if (value === 0) return;
      income += value;
      out += shell.row(s.color, `收入·${s.name}: <strong>${value.toFixed(2)} 元</strong>`);
    });
    out += shell.row(shell.fg, `支出合计: <strong>${expense.toFixed(2)} 元</strong>`);
    if (income > 0) out += shell.row(shell.fg, `收入合计: <strong>${income.toFixed(2)} 元</strong>`);
    out += '</div>';
    return out;
  }

  /* 「◀ 2026年 ▶」小按钮。日历里的导航已经挪到顶部导航条，useGridArea 仅留给将来的网格内用法 */
  _navBtn(area, handler, text, useGridArea) {
    return html`
      <div class="celltotal nav-button ${this.activeNav === area ? 'active-nav' : ''}"
           style="${useGridArea ? `grid-area: ${area};` : ''}"
           @click=${handler}
           @mousedown=${() => { this.activeNav = area; this.requestUpdate(); }}
           @mouseup=${() => { this.activeNav = ''; this.requestUpdate(); }}
           @mouseleave=${() => { this.activeNav = ''; this.requestUpdate(); }}>${text}</div>
    `;
  }

  renderChartDay() {
    const theme = this._evaluateTheme();
    const backgColor = theme === 'light' ? 'rgb(255, 255, 255)' : 'rgb(50, 50, 50)';
    // 只保留柱状图：原来的「当日支出 / x月支出合计」两个角标块已去掉（.no-labels 让图铺满整个卡片）。
    // 高度跟日历面板对齐。
    return html`
      <ha-card class="card-chart no-labels" style="height: ${this._panelHeight()}px; background: ${backgColor};">
        <div id="chart-container"></div>
      </ha-card>
    `;
  }

  renderChartMonth() {
    const theme = this._evaluateTheme();
    const backgColor = theme === 'light' ? 'rgb(255, 255, 255)' : 'rgb(50, 50, 50)';
    // 只保留柱状图：原来的「x年支出合计 / x月支出合计」两个角标块已去掉。高度跟日历面板对齐。
    return html`
      <ha-card class="card-chart no-labels" style="height: ${this._panelHeight()}px; background: ${backgColor};">
        <div id="chart-container"></div>
      </ha-card>
    `;
  }

  /* ====================== 饼图（月 / 年 支出占比） ====================== */
  /* 只取支出：饼图的语义是「构成占比」，收入混进来会被读成「收支结构」；
     而且日历也只统计支出（收入是按月的租金，摊到每天没意义），口径保持一致。
     数值口径与表格同一套 `_slotAmount`：月 = 当月，年 = 当年（跟着年月切换条走）。 */
  _pieItems(scope) {
    return this._visibleSlots()
      .filter((slot) => slot.dir === 'expense')
      .map((slot) => ({
        key: slot.key,
        label: slot.label,
        color: slot.color,
        value: Number(this._slotAmount(slot, scope)) || 0
      }))
      .filter((it) => it.value > 0)
      .sort((a, b) => b.value - a.value);   // 大项在前，扇区也从 12 点起排大的
  }

  /* 环形扇区路径（外半径 rOuter / 内半径 rInner，角度用弧度，0 在 3 点方向）。
     起点统一 -PI/2（12 点），顺时针画。 */
  _pieArc(cx, cy, rOuter, rInner, a0, a1) {
    const pt = (r, a) => [cx + r * Math.cos(a), cy + r * Math.sin(a)];
    const f = (n) => String(Math.round(n * 100) / 100);
    const [x0, y0] = pt(rOuter, a0);
    const [x1, y1] = pt(rOuter, a1);
    const [x2, y2] = pt(rInner, a1);
    const [x3, y3] = pt(rInner, a0);
    const large = a1 - a0 > Math.PI ? 1 : 0;
    return `M ${f(x0)} ${f(y0)}`
      + ` A ${rOuter} ${rOuter} 0 ${large} 1 ${f(x1)} ${f(y1)}`
      + ` L ${f(x2)} ${f(y2)}`
      + ` A ${rInner} ${rInner} 0 ${large} 0 ${f(x3)} ${f(y3)} Z`;
  }

  /* 扇形几何：viewBox 固定 200×200（实际显示 150px），从 12 点起顺时针按金额降序排。 */
  _pieGeom(scope) {
    const items = this._pieItems(scope);
    const total = items.reduce((acc, it) => acc + it.value, 0);
    const cx = 100;
    const cy = 100;
    const rOuter = 92;
    const rInner = 58;
    let acc = -Math.PI / 2;
    const slices = items.map((it) => {
      const frac = total > 0 ? it.value / total : 0;
      const a0 = acc;
      const a1 = acc + frac * Math.PI * 2;
      acc = a1;
      return { it, frac, d: this._pieArc(cx, cy, rOuter, rInner, a0, a1) };
    });
    return { items, total, slices, cx, cy, rOuter, rInner };
  }

  /* SVG 标记串（**不是** lit 模板）：卡片运行时只拿得到 LitElement.prototype 上的 html / css，
     没有 svg 标签函数；用 html 模板嵌套渲染 path，子模板没有 svg 上下文，
     会被当成 HTMLUnknownElement（既画不出来、也没有 getBBox）。所以这里拼字符串，
     由 _paintPie() 一次性 innerHTML 注入到 .pie-svg-host（HTML 解析器遇到 svg 会切命名空间）。 */
  _pieSvgMarkup(geom, bgColor) {
    // 只剩一项时扇形首尾角度重合、路径退化 → 直接画一圈等宽描边的圆环
    if (geom.items.length === 1) {
      const r = (geom.rOuter + geom.rInner) / 2;
      return `<circle cx="${geom.cx}" cy="${geom.cy}" r="${r}" fill="none"`
        + ` stroke="${geom.items[0].color}" stroke-width="${geom.rOuter - geom.rInner}"></circle>`;
    }
    return geom.slices.map((s) => `<path d="${s.d}" fill="${s.it.color}"`
      + ` stroke="${bgColor}" stroke-width="1.5"></path>`).join('');
  }

  /* 把环形图刷进占位容器（数据 / 主题没变就跳过，避免每次 hass 刷新重建 DOM） */
  _paintPie() {
    const host = this.renderRoot.querySelector('.pie-svg-host');
    if (!host) return;
    const scope = this.showPanel === 'pieYear' ? 'year' : 'month';
    const geom = this._pieGeom(scope);
    if (!geom.items.length) {
      if (host.dataset.sig !== '') { host.dataset.sig = ''; host.innerHTML = ''; }
      return;
    }
    const theme = this._evaluateTheme();
    const bgColor = theme === 'light' ? 'rgb(255, 255, 255)' : 'rgb(50, 50, 50)';
    const sig = [scope, this.year, this.month, theme, geom.total.toFixed(2),
      geom.slices.map((s) => `${s.it.key}:${s.it.value.toFixed(2)}`).join('|')].join('#');
    if (host.dataset.sig === sig) return;
    host.dataset.sig = sig;
    host.innerHTML = `<svg viewBox="0 0 200 200" role="img">${this._pieSvgMarkup(geom, bgColor)}</svg>`;
  }

  /* 「饼月 / 饼年」面板：左边环形图 + 中心合计，右边竖排图例（色块 / 名称 / 占比）。
     高度与日历 / 日 / 月 一致（_panelHeight()），五个视图切换时整卡不跳高。 */
  renderPie(scope) {
    const theme = this._evaluateTheme();
    const fgColor = theme === 'light' ? 'rgb(0, 0, 0)' : 'rgb(255, 255, 255)';
    const bgColor = theme === 'light' ? 'rgb(255, 255, 255)' : 'rgb(50, 50, 50)';
    const isMonth = scope === 'month';
    const cap = isMonth ? `元 · ${this.month}月支出` : `元 · ${this.year}年支出`;
    const geom = this._pieGeom(scope);

    if (!geom.items.length) {
      return html`
        <div class="pie-wrap" style="height: ${this._panelHeight()}px; background: ${bgColor};">
          <div class="pie-empty" style="color: ${fgColor};">${isMonth ? '本月' : '本年'}暂无支出数据</div>
        </div>
      `;
    }

    return html`
      <div class="pie-wrap" style="height: ${this._panelHeight()}px; background: ${bgColor}; color: ${fgColor};">
        <div class="pie-chart">
          <div class="pie-svg-host"></div>
          <div class="pie-center">
            <div class="pie-center-num" style="color: ${this.colorCost};">${geom.total.toFixed(2)}</div>
            <div class="pie-center-cap">${cap}</div>
          </div>
        </div>
        <div class="pie-legend">
          ${geom.slices.map((s) => html`
            <div class="pie-leg-item" title="${s.it.label} ${s.it.value.toFixed(2)}元">
              <span class="pie-dot" style="background: ${s.it.color};"></span>
              <span class="pie-name">${s.it.label}</span>
              <span class="pie-amt">${s.it.value.toFixed(2)}</span>
              <span class="pie-pct" style="color: ${s.it.color};">${(s.frac * 100).toFixed(1)}%</span>
            </div>
          `)}
        </div>
      </div>
    `;
  }

  renderPieMonth() {
    return this.renderPie('month');
  }

  renderPieYear() {
    return this.renderPie('year');
  }

  /* ====================== 面板切换 ====================== */
  showCalendar() {
    this.showPanel = this.showPanel === 'calendar' ? '' : 'calendar';
    this.requestUpdate();
  }

  showPieMonth() {
    this.showPanel = this.showPanel === 'pieMonth' ? '' : 'pieMonth';
    this.requestUpdate();
  }

  showPieYear() {
    this.showPanel = this.showPanel === 'pieYear' ? '' : 'pieYear';
    this.requestUpdate();
  }

  showDayUsage() {
    this.showPanel = this.showPanel === 'dayUsage' ? '' : 'dayUsage';
    this.requestUpdate();
  }

  showMonthUsage() {
    this.showPanel = this.showPanel === 'monthUsage' ? '' : 'monthUsage';
    this.requestUpdate();
  }

  render() {
    const theme = this._evaluateTheme();
    const Color = theme === 'light' ? 'rgb(0, 0, 0)' : 'rgb(255, 255, 255)';
    const BgColor = theme === 'light' ? 'rgb(255, 255, 255)' : 'rgb(50, 50, 50)';
    const hasSlots = this._slots().length > 0;
    // 年月切换条给下面展开的面板用：没展开面板时不显示（否则是一条点着没反应的控件）
    const showNav = hasSlots && !!this.showPanel;
    // 卡片自己铺一层底色：按钮区域 / 年月条用的是**半透明**浅底（跟表头同色），
    // 必须叠在卡片底色上才等于表头的颜色。否则半透明色直接叠在页面（仪表盘 / 卡片选择器弹窗）
    // 背景上：浅色主题下会变成一片深灰、黑字糊成一团（表头因为 .card-main 自带白底才正常）。
    const cardBg = (this.config && this.config.transparent_bg === true) ? 'transparent' : BgColor;
    return html`
      <div class="card-container" style="width: ${this.width}; color: ${Color}; background: ${cardBg};">
        ${this.renderMain()}
        ${hasSlots ? this.renderTabs() : ''}
        ${showNav ? this.renderTopNav() : ''}
        ${this.showPanel === 'calendar' ? html`
          <div class="panel-section">${this.renderCalendar()}</div>
        ` : ''}
        ${this.showPanel === 'dayUsage' ? html`
          <div class="panel-section">${this.renderChartDay()}</div>
        ` : ''}
        ${this.showPanel === 'monthUsage' ? html`
          <div class="panel-section">${this.renderChartMonth()}</div>
        ` : ''}
        ${this.showPanel === 'pieMonth' ? html`
          <div class="panel-section">${this.renderPieMonth()}</div>
        ` : ''}
        ${this.showPanel === 'pieYear' ? html`
          <div class="panel-section">${this.renderPieYear()}</div>
        ` : ''}
      </div>
    `;
  }

  static get styles() {
    return css`      :host { display: block; max-width: 500px; margin: 0 auto; }
      .card-header { border-radius: 10px; padding: 10px; }
      .card-main { border-radius: 10px; padding: 8px; padding-bottom: 0px; margin-top: 5px; margin-bottom: 0px; }
      .card-container { height: 100%; display: flex; flex-direction: column; }
      .top-section { display: grid; grid-template-columns: 32.8% 65.8%; gap: 1.4%; margin-bottom: 8px; height: 100%; align-items: end; }
      .balance-section { display: flex; flex-direction: column; align-items: center; height: 100%; justify-content: space-between; }
      .top-content { display: flex; flex-direction: column; align-items: center; width: 100%; flex-shrink: 0; }
      .spacer { flex: 1; width: 100%; min-height: 0px; height: auto; }
      .balance-icon { width: 80px; height: 80px; margin-bottom: 12px; margin-top: 10px; border-radius: 6px; }
      .balance-time { font-size: 10px; opacity: 0.8; margin-top: -7px; margin-bottom: 4px; text-align: center; }
      .balance-controls-container { display: flex; flex-direction: column; gap: 6px; width: 100%; }
      .balance-info { border-radius: 6px; text-align: center; flex: 0 0 auto; width: 100%; height: 40px; line-height: 20px; cursor: pointer; transition: all 0.2s ease; }
      .balance-info.active { background: rgba(0, 160, 160, 0.8) !important; font-weight: bold; }
      .balance-info:hover { background: rgba(160, 160, 160, 0.6) !important; }
      .balance-info.active:hover { background: rgba(0, 160, 160, 0.6) !important; }
      .balance-amount { font-size: 15px; font-weight: bold; margin-top: 1px; white-space: nowrap; }
      .balance-amount .currency { font-size: 10px; }
      .balance-label { font-size: 10px; margin-top: -1px; opacity: 0.9; }
      .days-info { border-radius: 6px; text-align: center; flex: 0 0 auto; width: 100%; height: 40px; line-height: 20px; }
      .days-amount { font-size: 15px; font-weight: bold; white-space: nowrap; margin-top: 1px; }
      .days-amount .currency { font-size: 10px; }
      .days-label { font-size: 10px; margin-top: -1px; opacity: 0.9; }
      .action-buttons { display: flex; gap: 7px; padding: 0; width: 100%; justify-content: center; }
      .action-button { border-radius: 6px; font-size: 10px; color: white; cursor: pointer; transition: all 0.2s ease; text-align: center; font-weight: 500; flex: 1; max-width: 33.33%; height: 39px; line-height: 39px; white-space: nowrap; }
      .action-button.active { background: rgba(0, 160, 160, 0.8) !important; font-weight: bold; }
      .action-button:hover { background: rgba(160, 160, 160, 0.6) !important; }
      .action-button.active:hover { background: rgba(0, 160, 160, 0.6) !important; }
      .panel-section { animation: slideIn 0.3s ease-out; margin-top: 0px; }
      @keyframes slideIn {
        from {
          opacity: 0;
          transform: translateY(-10px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }
      .right-section { display: flex; flex-direction: column; gap: 6px; height: 100%; }
      .price-area { flex: 1; display: flex; flex-direction: column; justify-content: center; }
      .price-section { border-radius: 8px; padding: 12px; text-align: center; height: 100%; display: flex; flex-direction: column; justify-content: center; }
      .price-title { font-size: 14px; font-weight: bold; margin-bottom: 8px; color: white; }
      .price-value { font-size: 18px; font-weight: bold; color: #00ffff; }
      .price-details { display: flex; flex-direction: column; gap: 4px; }
      .price-item { font-size: 12px; color: white; opacity: 0.9; }
      .ladder-area { flex: 1; overflow: hidden; }
      .usage-grid { flex: 2; display: grid; grid-template-columns: 1fr 1fr; grid-template-rows: 1fr 1fr; gap: 6px; }
      .middle-section { height: 40%; margin-bottom: 8px; }
      .bottom-section { padding-top: 7px; height: 35%; display: flex; justify-content: space-between; align-items: center; }
      .ladder-section { border-radius: 8px; padding: 9px 5px; margin: 0px 0px; min-height: 95px; }
      .ladder-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px; opacity: 0.8; font-weight: bold; text-align: start; font-size: 10px; }
      .ladder-progress { position: relative; height: 16px; border-radius: 6px; margin: 25px 0 4px 0; overflow: visible; }
      .progress-segment { position: absolute; height: 100%; transition: width 0.3s ease; }
      .progress-segment.level1 { background: #4CAF50; left: 0; width: calc(33.33% + 6px) !important; border-radius: 3px 0 0 3px; clip-path: polygon(0 0, calc(100% - 6px) 0, 100% 50%, calc(100% - 6px) 100%, 0 100%); z-index: 3; }
      .progress-segment.level2 { background: #FFC107; left: 33.33%; width: calc(33.33% + 6px) !important; clip-path: polygon(0 0, calc(100% - 6px) 0, 100% 50%, calc(100% - 6px) 100%, 0 100%); z-index: 2; }
      .progress-segment.level3 { background: #FF5722; left: 66.66%; width: 33.34% !important; border-radius: 0 3px 3px 0; z-index: 1; }
      .progress-bubble { position: absolute; top: -25px; transform: translateX(-50%); color: white; padding: 4px 6px; border-radius: 10px; font-size: 9px; font-weight: bold; white-space: nowrap; text-align: center; line-height: 1.2; }
      .progress-bubble-arrow { position: absolute; bottom: 20px; transform: translateX(-50%); width: 0; height: 0; border-left: 4px solid transparent; border-right: 4px solid transparent; border-top: 4px solid; border-top-color: inherit; z-index: 6; }
      .progress-indicator { position: absolute; top: 0; bottom: 0; width: 3px; border-radius: 3px; transform: translateX(-50%); z-index: 14; }
      .progress-labels { position: absolute; top: 0; left: 0; right: 0; bottom: 0; display: flex; align-items: center; justify-content: space-around; pointer-events: none; z-index: 5; }
      .progress-label { font-size: 8px; color: white; font-weight: bold; text-align: center; }
      .ladder-price-section { display: flex; justify-content: space-between; gap: 2px; margin-top: 0px; }
      .price-block { flex: 1; padding: 2px 4px; border-radius: 4px; font-size: 8px; text-align: center; }
      .level1-price { background: rgba(76, 175, 80, 0.15); }
      .level2-price { background: rgba(255, 193, 7, 0.15); }
      .level3-price { background: rgba(255, 87, 34, 0.15); }
      .price-range { font-weight: bold; margin-bottom: 2px; font-size: 9px; }
      .price-item-block { margin: 2px 0; font-size: 8px; line-height: 1.2; white-space: nowrap; }
      .usage-section { text-align: center; padding: 4px; border-radius: 6px; display: flex; flex-direction: column; justify-content: center; }
      .usage-title { font-size: 10px; margin-bottom: 6px; opacity: 0.8; font-weight: bold; text-align: start; }
      .usage-amount { font-size: 10px; font-weight: bold; display: flex; align-items: center; position: relative; margin-bottom: 8px; }
      .usage-electricity { position: absolute; left: 0; text-align: left; }
      .usage-cost { position: absolute; right: 0; text-align: right; }
      .usage-bar { height: 14px; border-radius: 2px; margin-bottom: 2px; overflow: hidden; }
      .usage-bar-fill { height: 100%; display: flex; position: relative; }
      .usage-bar-text { position: absolute; top: 50%; transform: translateY(-50%); font-size: 9px; color: white; font-weight: bold; white-space: nowrap; z-index: 1; }
      .usage-bar-text.tip { left: 0; width: var(--tip-width, 0); text-align: center; }
      .usage-bar-text.peak { left: var(--tip-width, 0); width: var(--peak-width, 0); text-align: center; }
      .usage-bar-text.normal { left: calc(var(--tip-width, 0) + var(--peak-width, 0)); width: var(--normal-width, 0); text-align: center; }
      .usage-bar-text.valley { left: calc(var(--tip-width, 0) + var(--peak-width, 0) + var(--normal-width, 0)); width: var(--valley-width, 0); text-align: center; }
      .usage-bar-segment { height: 100%; }
      .usage-labels { position: relative; height: 8px; font-size: 8px; line-height: 8px; background: transparent; }
      .usage-label { position: absolute; top: 0; font-weight: bold; color: white; background: transparent; }
      .usage-label.tip { left: 0; width: var(--tip-width, 0); text-align: center; }
      .usage-label.peak { left: var(--tip-width, 0); width: var(--peak-width, 0); text-align: center; }
      .usage-label.normal { left: calc(var(--tip-width, 0) + var(--peak-width, 0)); width: var(--normal-width, 0); text-align: center; }
      .usage-label.valley { left: calc(var(--tip-width, 0) + var(--peak-width, 0) + var(--normal-width, 0)); width: var(--valley-width, 0); text-align: center; }
      .usage-bar-segment.tip { background: #E91E63; }
      .usage-bar-segment.peak { background: #FF9800; }
      .usage-bar-segment.normal { background: #8BC34A; }
      .usage-bar-segment.valley { background: #00BCD4; }
    /*
     * 日历部分  *
     *          */
      /* 高度不再写死：导航行 30px + 星期行 30px + 6 个日期行由内容自适应 */
      /* 日历外框：把网格和下方的月/年统计包在同一个背景容器里 */
      .calendar-wrap { border-radius: 10px; margin-top: 5px; }
      .calendar-grid { border: 0; display: grid; grid-template-areas: "yearlast year yearnext today monthlast month monthnext" "week1 week2 week3 week4 week5 week6 week7" "id1 id2 id3 id4 id5 id6 id7" "id8 id9 id10 id11 id12 id13 id14" "id15 id16 id17 id18 id19 id20 id21" "id22 id23 id24 id25 id26 id27 id28" "id29 id30 id31 id32 id33 id34 id35" "id36 id37 id38 id39 id40 id41 id42"; grid-template-columns: repeat(7, 1fr); grid-template-rows: 30px 30px repeat(6, auto); gap: 0px; padding: 10px 8px; }
      .celltotal { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 0; cursor: default; font-size: 15px; font-weight: 600; white-space: nowrap; }
      /* box-sizing: border-box 很关键：否则 .month-day 的上下 padding 会加在 min-height 之外，单格会高 22px */
      /* 单格高度 = 10(顶部给日期圆) + 13 + 1 + 13 + 2(底部) + 边框 ≈ 41px（取 41 保证有/无日期的行等高） */
      .cell { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 0; cursor: default; font-size: 12px; line-height: 12px; font-weight: 500; min-height: 41px; box-sizing: border-box; }
      /* 整张日历画表格线：星期行 + 所有日期格（含没有日期的空格）
         nth-child(n+8) 跳过第 1 行的年份/月份导航；nth-child(7n+1) 是每行首列 */
      .calendar-grid > *:nth-child(n+8) { border-right: 0.5px solid rgb(150,150,150,0.8); border-bottom: 0.5px solid rgb(150,150,150,0.8); }
      .calendar-grid > *:nth-child(n+8):nth-child(-n+14) { border-top: 0.5px solid rgb(150,150,150,0.8); }
      .calendar-grid > *:nth-child(7n+1):nth-child(n+8) { border-left: 0.5px solid rgb(150,150,150,0.8); }
      .nav-button { cursor: pointer; user-select: none; font-size: 12px; transition: all 0.2s ease; border-radius: 10px; }
      .nav-button:active { transform: scale(0.95); opacity: 0.8; }
      .active-nav { background-color: rgba(0, 160, 160, 0.2); border-radius: 4px; }
      .today-button { cursor: pointer; user-select: none; }
      .weekday { font-size: 13px; }
      .month-day { cursor: pointer; min-width: 0; position: relative; justify-content: flex-start; padding: 10px 2px 2px; box-sizing: border-box; }
      /* 日期数字：右上角圆形底（贴顶、靠右边框摆放，避免压到下方用量标签的文字）
         底色/文字色按主题在 renderCalendar 里用行内样式给：light = 黑 0.6 + 白字，dark = 白 0.6 + 黑字 */
      .month-day > .day-num { position: absolute; top: 0; right: 0; width: 14px; height: 14px; border-radius: 50%;
        display: flex; align-items: center; justify-content: center;
        font-size: 10px; line-height: 1; font-weight: 500; }
      /* 日历格子里的用量 / 费用：等宽圆角标签（宽度 = 格子宽 - 左右各 3px），底色用原本的文字色，文字改用主题色 */
      .electricity-num { font-size: 12px; line-height: 13px; width: calc(100% - 2px); text-align: center; border-radius: 3px; white-space: nowrap; overflow: hidden; margin-top: 0; box-sizing: border-box; }
      .electricity-cost { font-size: 12px; line-height: 13px; width: calc(100% - 2px); text-align: center; border-radius: 3px; white-space: nowrap; overflow: hidden; margin-top: 1px; box-sizing: border-box; }
      .min-usage { background-color: rgba(0, 255, 0, 0.4); }
      .max-usage { background-color: rgba(255, 0, 0, 0.4); }
      .summary-info { display: flex; flex-direction: column; align-items: flex-start; justify-content: center; font-size: 13px; line-height: 16px; font-weight: 500; padding: 0 0 0 30px; white-space: nowrap; }
      /* 日历下方的月/年统计：标签文字在色块外，数值带底色标签，横向一排；月用量靠左、年用量靠右 */
      .calendar-summary { display: flex; flex-wrap: wrap; align-items: center; gap: 4px; padding: 0 8px 10px; font-size: 12px; font-weight: 600; }
      .calendar-summary .summary-group { display: inline-flex; align-items: center; gap: 4px; }
      .calendar-summary .summary-group.right { margin-left: auto; }
      .calendar-summary .summary-key { white-space: nowrap; opacity: 0.85; }
      .calendar-summary .summary-pill { flex: 0 0 auto; min-width: 0; padding: 0 5px; line-height: 19px; border-radius: 3px; white-space: nowrap; overflow: hidden; font-size: 12px; }
      /* 表头信息 */
      .card-container { display: flex; flex-direction: column; gap: 5px; }
      .balance-card { width: 100%; background: var(--bg-color, #fff); border-radius: 12px; }
      .balance-header { display: flex; justify-content: space-between; align-items: center; padding: 16px; background: var(--bg-color, #fff); border-radius: 12px; }
      .balance-indicator { display: inline-block; width: 8px; height: 8px; border-radius: 50%; margin-right: 8px; }
      @keyframes pulse {
        0% { opacity: 1; }
        50% { opacity: 0.5; }
        100% { opacity: 1; }
      }
      .balance-title { font-size: 20px; font-weight: 500; color: var(--fg-color, #000); height: 30px; line-height: 30px; display: flex; align-items: center; justify-content: center; }
      /*标题统计数字*/
      .balance-count { color: var(--fg-color, #000); border-radius: 8px; font-size: 20px; height: 30px; line-height: 30px; text-align: center; line-height: 30px; font-weight: bold; padding: 0px; }
      .balance-count.warning { color: #F44336; }
      .balance-count.warning { color: #F44336; }
      .balance-devices-list { flex: 1; overflow-y: auto; min-height: 0; padding: 0 0 8px 0; display: flex; flex-direction: column; gap: 8px; }
      /* 横向布局样式 */
      .balance-devices-list.horizontal { display: flex; flex-direction: row; flex-wrap: wrap; gap: 8px; padding: 8px; }
      .balance-devices-list.horizontal .balance-device-item { flex: 0 0 calc((100% - var(--gap-count, 2) * 12px) / var(--items-per-row, 3)); border: 1px solid rgb(150,150,150,0.5); border-radius: 8px; margin: 0; padding: 12px 0; }
      .balance-devices-list.horizontal .balance-device-item:first-child { border: 1px solid rgb(150,150,150,0.5); }
      .balance-device-item { display: flex; align-items: center; justify-content: space-between; margin: 0px 8px; padding: 8px 0; border-bottom: 1px solid rgb(150,150,150,0.5); cursor: pointer; transition: background-color 0.2s; }
      .balance-device-item:first-child { border-top: 1px solid rgb(150,150,150,0.5); }
      .balance-device-item:hover { background-color: rgba(150,150,150,0.1); }
      .balance-device-item.selected { background-color: rgba(33, 150, 243, 0.2); border-left: 3px solid rgb(33, 150, 243); }
      .balance-device-left { display: flex; align-items: center; flex: 1; }
      .balance-device-icon { margin-right: 8px; color: var(--fg-color, #000); flex-shrink: 0; }
      .balance-device-name { color: var(--fg-color, #000); font-size: 12px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
      .balance-device-value { color: var(--fg-color, #000); font-size: 12px; margin-left: auto; flex-shrink: 0; font-weight: bold; }
      .balance-device-value.warning { color: #F44336; }
      .balance-device-unit { font-size: 12px; color: var(--fg-color, #000); margin-left: 4px; margin-right: 4px; font-weight: bold; }
      .balance-device-unit.warning { color: #F44336; }
      .balance-no-devices { text-align: center; padding: 10px 0; color: var(--fg-color, #000); }
      .balance-loading { text-align: center; padding: 10px 0; color: var(--fg-color, #000); }
      /*每日条形图*/
      .card-chart { border: 0; border-radius: 10px; display: grid; grid-template-rows: 20% 80%; grid-template-columns: 1fr 1fr; grid-template-areas: "label1 label2" "chart chart"; gap: 0px; padding: 0px; margin-top: 5px; height: 310px; }
      .label { padding: 5px; }
      .label1 { grid-area: label1; text-align: left; }
      .label2 { grid-area: label2; text-align: right; }
      .value { font-size: 25px; font-weight: bold; line-height: 1.2; padding: 5px 5px 0 5px; }
      .unit { font-size: 15px; }
      .title { font-size: 13px; padding: 0 5px 0 5px; }
      #chart-container { grid-area: chart; position: relative; width: 100%; height: 100%; }
      /* ===================== 家庭支出：金额按钮组 ===================== */
      /* 间距刻意收窄：一列只有 ~50px，要放得下 10000.00 这种 8 位金额 */
      .he-grid { display: grid; align-items: stretch; column-gap: 4px; row-gap: 4px; }
      .he-grid > div { border: 0; box-sizing: border-box; }
      .he-corner { display: block; }
      /* 表头（本月 / 本年）：各自一块浅底；两区之间不再有 he-gap 间隔列 */
      .he-head { font-size: 11px; font-weight: 700; text-align: center; padding: 5px 6px;
        border-radius: 10px; white-space: nowrap; }
      /* 表头里的数字（3760.78元）与「本月 / 本年」文本同字号 */
      .he-head-num { font-weight: 700; font-size: 11px; }
      .he-tag { display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 700;
        letter-spacing: 2px; writing-mode: vertical-rl; padding: 4px 0; }
      /* 每项 = 一个按钮：圆角 + 同色浅底；描边常驻（透明）以免切换状态时尺寸跳动 */
      .he-cell { min-height: 42px; padding: 4px 3px; border-radius: 8px; text-align: center; cursor: pointer; user-select: none;
        border: 1px solid transparent; box-sizing: border-box;
        display: flex; flex-direction: column; align-items: center; justify-content: center;
        transition: background-color 0.15s ease, border-color 0.15s ease; }
      .he-cell:hover { background-color: rgba(160, 160, 160, 0.28) !important; }
      /* 划掉 = 不参与日历 / 图表：去掉底色，改用「与未划掉底色同色」的描边 + 数值删除线表示 */
      .he-cell.off .he-value { text-decoration: line-through; }
      .he-empty { cursor: default; background: none !important; }
      .he-empty:hover { background-color: transparent !important; }
      .he-name { font-size: 10px; line-height: 14px; font-weight: 500; white-space: nowrap; }
      .he-value { font-size: 11px; line-height: 15px; font-weight: 700; white-space: nowrap; }
      /* 「月」/「年」两个列区域的浅底卡片，内层再按 cols 排按钮（列数由 JS 内联写入） */
      .he-block { display: grid; gap: 5px; padding: 5px; border-radius: 10px; }

      /* 卡片表面：底色由 JS 内联写入（跟随主题），这里只补圆角，
         否则整卡的直角会压住首尾两个子块（.card-main / .calendar-wrap）的 10px 圆角。 */
      .card-container { border-radius: 10px; }

      /* ===================== 视图按钮区域（从 .card-main 里独立出来） ===================== */
      /* 顺序：表格 → 按钮区域 → 年月切换条 → 面板。
         区域自带一块浅底（底色 = 表头同色，由 JS 内联写入），左右边距与表头一致 → 等宽。 */
      .he-toolbar { margin: 6px 8px 0; padding: 5px 4px; border-radius: 10px; }
      /* 收起面板时背景框高度不变，只是整条上抬，跟卡片底边留出间距 */
      .he-toolbar.collapsed { margin-bottom: 10px; }
      .he-toolbar .action-buttons { display: flex; gap: 6px; }
      /* 按钮高度从切片里的 39px 收到 30px。底色由 JS 内联给（选中 / 未选中两档）。
         选中态类名用 .sel 而不是 .active —— 切片里 .action-button.active 的青色底是 !important，会盖掉内联背景。 */
      .he-toolbar .action-button { height: 30px; line-height: 30px; font-size: 11px; }
      .he-toolbar .action-button.sel { font-weight: 700; }

      /* ===================== 年月切换条（日历 / 日 / 月 共用） ===================== */
      .he-topnav { display: flex; align-items: center; justify-content: center; gap: 4px;
        padding: 4px 6px; font-size: 13px; white-space: nowrap; margin: 5px 8px 1px; border-radius: 8px; }
      .he-topnav .he-topnav-label { min-width: 56px; font-size: 14px; }
      .he-topnav .nav-button { padding: 2px 8px; }
      .he-topnav .he-topnav-today { padding: 2px 9px; border-radius: 6px; font-size: 12px;
        background: rgba(150, 150, 150, 0.16); }

      /* 日历格子里的金额：色块（底色 = color_cal，默认跟随 color_cost）+ 主题前景色文字，
         贴格子下沿摆放。色块宽度铺满格子可用宽度 —— 原样式的 calc(100% - 2px) 在窄格子里
         会把 6 位金额裁掉。 */
      .month-day { justify-content: flex-end; padding: 8px 2px 3px; }
      /* 金额数字比切片的 12px 再小 2 号（10px），行高跟着收，避免在 34.17px 的矮格子里顶开日期 */
      .month-day > .electricity-cost { width: 100%; margin-top: 0; font-size: 10px; line-height: 11px; }
      /* 日历固定 6 行、每行高由 JS 内联写入（日期区总高 205px / 6 ≈ 34.17px，比原来的 41px 矮）。
         必须把切片里 .cell 的 min-height: 41px 压掉 —— 否则 6 行会被撑到 6×41=246px，
         把面板从 255px 顶到 276px，固定 6 行就白改了。
         注意：这段 CSS 会插进 styles 的 css 模板字符串里，注释中绝对不能出现反引号，
         否则会把模板截断，报 “css(...) is not a function”。 */
      .calendar-grid > .cell { min-height: 0; }

      /* ===================== 日历：导航行已挪到按钮区域下面 =====================
         下面保留 7 个 display:none 的占位子元素，是为了不破坏切片样式里按 nth-child 写的边框规则
         （原样式假定前 7 个子元素是导航格：第 8 个起才有边框）。 */
      .calendar-grid .he-nav-holder { display: none; }
      .calendar-grid {
        grid-template-areas:
          "week1 week2 week3 week4 week5 week6 week7"
          "id1 id2 id3 id4 id5 id6 id7"
          "id8 id9 id10 id11 id12 id13 id14"
          "id15 id16 id17 id18 id19 id20 id21"
          "id22 id23 id24 id25 id26 id27 id28"
          "id29 id30 id31 id32 id33 id34 id35"
          "id36 id37 id38 id39 id40 id41 id42";
        grid-template-rows: 30px repeat(6, auto);
      }

      /* ===================== 图表：已去掉角标块，图铺满整卡 =====================
         切片里 .card-chart 是 "label1 label2" / "chart" 两行网格，去掉角标后要改成单行，
         否则图只占下面 80% 高度、上面留一条空带。 */
      .card-chart.no-labels { grid-template-rows: 100%; grid-template-columns: 1fr; grid-template-areas: "chart"; }

      /* ===================== 饼图（饼月 / 饼年） =====================
         左环形图 + 右竖排图例。整体高度由 JS 内联成 _panelHeight()，与日历 / 日 / 月 一致。
         图例项数多时在自己区域内滚动，不把面板撑高（否则五个视图高度就不相等了）。 */
      /* margin-top: 5px 是为了跟日历 / 日 / 月 三个面板对齐：它们的内容卡都带 5px 上边距，
         面板 .panel-section 实测 260（内容 255 + 5），饼图不加就会矮 5px、切视图时整卡跳一下。 */
      .pie-wrap { display: flex; align-items: center; gap: 8px; padding: 6px 8px;
        box-sizing: border-box; border-radius: 8px; margin-top: 5px; }
      .pie-chart { position: relative; flex: 0 0 auto; width: 150px; height: 150px; }
      /* 环图由 JS 拼 SVG 字符串后 innerHTML 注入这个占位层（lit 模板里嵌 path 会被当作 HTML 元素） */
      .pie-svg-host { position: absolute; inset: 0; }
      .pie-svg-host svg { width: 100%; height: 100%; display: block; }
      .pie-center { position: absolute; inset: 0; display: flex; flex-direction: column;
        align-items: center; justify-content: center; pointer-events: none; }
      .pie-center-num { font-size: 15px; font-weight: 700; line-height: 16px; }
      .pie-center-cap { font-size: 9px; line-height: 11px; margin-top: 2px; opacity: 0.75; }
      .pie-legend { flex: 1 1 auto; min-width: 0; max-height: 100%; overflow-y: auto; }
      .pie-leg-item { display: flex; align-items: center; gap: 4px; font-size: 10px;
        line-height: 16px; white-space: nowrap; }
      .pie-dot { width: 8px; height: 8px; border-radius: 2px; flex: 0 0 auto; }
      .pie-name { flex: 0 1 auto; overflow: hidden; text-overflow: ellipsis; }
      /* 金额列内部右对齐（各位上下对齐），右侧留 6px 间距不贴住百分比 */
      .pie-amt { flex: 1 1 auto; text-align: right; padding-right: 6px; font-variant-numeric: tabular-nums; }
      .pie-pct { flex: 0 0 36px; text-align: right; font-variant-numeric: tabular-nums;
        font-weight: 700; }
      .pie-empty { width: 100%; text-align: center; font-size: 11px; opacity: 0.7; }
`;
  }
}

customElements.define('xiaoshi-household-expenses', XiaoshiHouseholdExpenses);

/* ==========================================================================
 * 配置界面：按类型选实体（可多选，一个类型挂多块表 → 求和）
 * 写法对齐电费卡片（xiaoshi-state-grid-editor）：原生 input 搜索 + 下拉候选 + 已选清单。
 * 不用 ha-entity-picker —— 部分 HA 版本里它渲染为空，看不到也点不了。
 * ========================================================================== */
class XiaoshiHouseholdExpensesEditor extends LitElement {
  static get properties() {
    return {
      hass: { type: Object },
      _config: { type: Object },
      _openKey: { type: String },
      _term: { type: String }
    };
  }

  static get styles() {
    return css`
      :host { display: block; }
      .form { display: flex; flex-direction: column; gap: 10px; padding: 4px 4px 16px; }
      .common { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
      .hint { font-size: 12px; line-height: 1.5; color: var(--secondary-text-color); }
      .section { font-size: 13px; font-weight: 700; color: var(--primary-text-color);
        border-top: 1px solid var(--divider-color); padding-top: 8px; margin-top: 4px; }

      .toggles { display: flex; flex-direction: column; gap: 8px; }
      .split-row { display: flex; align-items: flex-start; gap: 8px; font-size: 13px;
        line-height: 1.45; color: var(--primary-text-color); cursor: pointer; }
      .split-row input { margin: 2px 0 0; flex: 0 0 auto; }

      .slot-block { display: flex; flex-direction: column; gap: 6px; }
      .slot-head { display: flex; align-items: center; gap: 6px; font-size: 13px; font-weight: 700;
        color: var(--primary-text-color); }
      .slot-head ha-icon { color: var(--secondary-text-color); }
      .slot-count { font-size: 11px; font-weight: 400; color: var(--secondary-text-color); margin-left: auto; }

      .slot-search-wrap { position: relative; }
      .slot-search { width: 100%; box-sizing: border-box; padding: 7px 10px; font-size: 13px;
        border: 1px solid var(--divider-color); border-radius: 6px;
        background: var(--card-background-color); color: var(--primary-text-color); outline: none; }
      .slot-search:focus { border-color: var(--primary-color); }

      .entity-dropdown { position: absolute; left: 0; right: 0; top: calc(100% + 2px); z-index: 20;
        max-height: 240px; overflow-y: auto; background: var(--card-background-color);
        border: 1px solid var(--divider-color); border-radius: 6px;
        box-shadow: 0 4px 14px rgba(0, 0, 0, 0.3); }
      .entity-option { display: flex; align-items: center; gap: 8px; padding: 7px 10px; cursor: pointer;
        color: var(--primary-text-color); }
      .entity-option:hover { background: var(--secondary-background-color, rgba(150, 150, 150, 0.16)); }
      .entity-option ha-icon { color: var(--secondary-text-color); flex: 0 0 auto; }
      .entity-details { flex: 1; min-width: 0; }
      .entity-name { font-size: 13px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
      .entity-id { font-size: 11px; opacity: 0.6; font-family: monospace;
        white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
      .no-results { padding: 10px; font-size: 12px; color: var(--secondary-text-color); text-align: center; }

      .chips { display: flex; flex-wrap: wrap; gap: 6px; }
      .chip { display: inline-flex; align-items: center; gap: 4px; max-width: 100%;
        padding: 3px 4px 3px 8px; border-radius: 12px; font-size: 12px;
        background: var(--secondary-background-color, rgba(150, 150, 150, 0.16));
        color: var(--primary-text-color); }
      .chip-text { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
      .chip-remove { display: inline-flex; align-items: center; justify-content: center;
        border: none; background: none; padding: 2px; cursor: pointer; border-radius: 50%;
        color: var(--secondary-text-color); }
      .chip-remove:hover { color: var(--error-color, #f44336); }

      /* 颜色选择：色块 + 十六进制文本框（对齐电费卡片的写法） */
      .color-row { display: flex; align-items: center; gap: 8px; font-size: 13px;
        color: var(--primary-text-color); }
      .color-row .color-label { flex: 0 0 auto; white-space: nowrap; }
      .color-row .color-input { width: 62px; height: 34px; flex: 0 0 auto; padding: 2px;
        border: 1px solid var(--divider-color); border-radius: 6px; cursor: pointer;
        background: var(--card-background-color); }
      .color-row .color-text { flex: 1; min-width: 0; box-sizing: border-box; padding: 7px 10px;
        font-size: 13px; font-family: monospace; border: 1px solid var(--divider-color);
        border-radius: 6px; background: var(--card-background-color);
        color: var(--primary-text-color); outline: none; }
      .color-row .color-text:focus { border-color: var(--primary-color); }
      .color-reset { flex: 0 0 auto; border: 1px solid var(--divider-color); background: none;
        color: var(--secondary-text-color); font-size: 12px; padding: 6px 8px; border-radius: 6px;
        cursor: pointer; }
      .color-reset:hover { color: var(--primary-text-color); }
    `;
  }

  constructor() {
    super();
    this._config = {};
    this._openKey = '';
    this._term = '';
    this._onDocClick = (e) => {
      const path = e.composedPath ? e.composedPath() : [];
      if (path.includes(this)) return;   // 点在编辑器内部 → 不关
      if (this._openKey) { this._openKey = ''; this._term = ''; this.requestUpdate(); }
    };
  }

  setConfig(config) {
    this._config = config ? Object.assign({}, config) : {};
    this._openKey = '';
    this._term = '';
  }

  firstUpdated() {
    document.addEventListener('click', this._onDocClick);
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    document.removeEventListener('click', this._onDocClick);
  }

  /* ---------------- 配置读写 ---------------- */

  _emit(config) {
    this._config = config;
    this.dispatchEvent(new CustomEvent('config-changed', {
      detail: { config },
      bubbles: true,
      composed: true
    }));
    this.requestUpdate();
  }

  _setCommon(key, value) {
    const config = Object.assign({}, this._config);
    if (value === '' || value === undefined || value === null) delete config[key];
    else config[key] = value;
    this._emit(config);
  }

  _ids(key) {
    return heSlotEntityItems(this._config, key).map((it) => it.entityId);
  }

  /* 1 个实体写成字符串、多个写成数组 —— YAML 更干净，且向后兼容。
     配置里已经带了自定义名字（{ entity, name }）的实体，回写时把名字带上。 */
  _write(key, ids) {
    const config = Object.assign({}, this._config);
    const entities = Object.assign({}, config.entities || {});
    const names = {};
    heSlotEntityItems(config, key).forEach((it) => { if (it.name) names[it.entityId] = it.name; });
    if (ids.length === 0) {
      delete entities[key];
    } else {
      const items = ids.map((id) => (names[id] ? { entity: id, name: names[id] } : id));
      entities[key] = items.length === 1 ? items[0] : items;
    }
    if (Object.keys(entities).length) config.entities = entities;
    else delete config.entities;
    this._emit(config);
  }

  _addEntity(key, entityId) {
    const id = String(entityId || '').trim();
    if (!id) return;
    const ids = this._ids(key);
    if (!ids.includes(id)) ids.push(id);
    this._openKey = '';
    this._term = '';
    this._write(key, ids);
  }

  _removeEntity(key, entityId) {
    this._write(key, this._ids(key).filter((id) => id !== entityId));
  }

  /* ---------------- 搜索 ---------------- */

  _onFocus(key) {
    if (this._openKey !== key) this._term = '';
    this._openKey = key;
    this.requestUpdate();
  }

  _onSearch(key, e) {
    this._openKey = key;
    this._term = e.target.value || '';
    this.requestUpdate();
  }

  _onKeydown(key, e) {
    if (e.key === 'Escape') { this._openKey = ''; this._term = ''; this.requestUpdate(); return; }
    if (e.key !== 'Enter') return;
    const cands = this._candidates(key);
    if (cands.length) { this._addEntity(key, cands[0].entity_id); return; }
    const raw = (this._term || '').trim();
    if (/^[a-z_]+\.[a-z0-9_]+$/i.test(raw)) this._addEntity(key, raw);
  }

  /* 候选实体：sensor.* 优先，排除已选，最多 20 条。
     entity_id 优先取 state 自带字段，取不到时回退到 states 的键（容错）。 */
  _candidates(key) {
    const states = this.hass && this.hass.states ? this.hass.states : null;
    if (!states) return [];
    const selected = new Set(this._ids(key));
    const term = (this._term || '').trim().toLowerCase();
    const out = [];
    Object.entries(states).forEach(([id, st]) => {
      const entityId = (st && st.entity_id) || id;
      if (!entityId || !entityId.startsWith('sensor.')) return;
      if (selected.has(entityId)) return;
      if (term) {
        const name = String((st && st.attributes && st.attributes.friendly_name) || '').toLowerCase();
        if (!entityId.toLowerCase().includes(term) && !name.includes(term)) return;
      }
      out.push(Object.assign({}, st || {}, { entity_id: entityId }));
    });
    return out.slice(0, 20);
  }

  _friendly(entityId) {
    const st = this.hass && this.hass.states ? this.hass.states[entityId] : null;
    const name = st && st.attributes ? st.attributes.friendly_name : '';
    return name ? `${name}（${entityId}）` : entityId;
  }

  /* ---------------- 渲染 ---------------- */

  _renderSlot(def) {
    const ids = this._ids(def.key);
    const open = this._openKey === def.key;
    const cands = open ? this._candidates(def.key) : [];
    return html`
      <div class="slot-block">
        <div class="slot-head">
          <ha-icon icon="${def.icon}" style="--mdc-icon-size: 18px;"></ha-icon>
          <span>${def.label}</span>
          <span class="slot-count">${ids.length ? `已选 ${ids.length} 个` : '未选择'}</span>
        </div>
        <div class="slot-search-wrap">
          <input class="slot-search" type="text" autocomplete="off"
            placeholder="搜索或输入实体 ID，回车添加（可多选，多个实体金额相加）"
            .value=${open ? this._term : ''}
            @focus=${() => this._onFocus(def.key)}
            @input=${(e) => this._onSearch(def.key, e)}
            @keydown=${(e) => this._onKeydown(def.key, e)}
          />
          ${open ? html`
            <div class="entity-dropdown">
              ${cands.map((s) => html`
                <div class="entity-option" @click=${() => this._addEntity(def.key, s.entity_id)}>
                  <ha-icon icon="${(s.attributes && s.attributes.icon) || 'mdi:help-circle'}"
                           style="--mdc-icon-size: 18px;"></ha-icon>
                  <div class="entity-details">
                    <div class="entity-name">${(s.attributes && s.attributes.friendly_name) || s.entity_id}</div>
                    <div class="entity-id">${s.entity_id}</div>
                  </div>
                  <ha-icon icon="mdi:plus" style="--mdc-icon-size: 16px;"></ha-icon>
                </div>
              `)}
              ${cands.length === 0 ? html`<div class="no-results">未找到匹配的实体</div>` : ''}
            </div>
          ` : ''}
        </div>
        ${ids.length ? html`
          <div class="chips">
            ${ids.map((id) => html`
              <span class="chip">
                <span class="chip-text">${this._friendly(id)}</span>
                <button class="chip-remove" title="移除"
                        @click=${() => this._removeEntity(def.key, id)}>
                  <ha-icon icon="mdi:close" style="--mdc-icon-size: 14px;"></ha-icon>
                </button>
              </span>
            `)}
          </div>
        ` : ''}
      </div>
    `;
  }

  /* 贷款类拆分开关（房贷→房贷+房款 等）。配置里不写 split_payment 就是开启。 */
  _splitPayment() {
    return this._config.split_payment !== false;
  }

  _toggleSplit(checked) {
    this._setCommon('split_payment', checked ? undefined : false);
  }

  /* 是否默认弹出日历。配置里不写 default_show_calendar 就是开启。 */
  _defaultShowCalendar() {
    return this._config.default_show_calendar !== false;
  }

  _toggleDefaultCalendar(checked) {
    this._setCommon('default_show_calendar', checked ? undefined : false);
  }

  /* 日历格子里金额的底色。不配就跟随 color_cost（卡片原来的做法），
     写回时留空 / 等于 color_cost 就把键删掉（配置更干净）。 */
  static get CAL_COLOR_DEFAULT() { return '#ff3d02'; }

  _calColor() {
    return this._config.color_cal || this._config.color_cost
      || XiaoshiHouseholdExpensesEditor.CAL_COLOR_DEFAULT;
  }

  _isHex(value) {
    return /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(String(value || '').trim());
  }

  _setCalColor(value) {
    const v = String(value || '').trim();
    // 手输了非法值就当没改过，保持原样（避免把配置写坏）
    if (v && !this._isHex(v)) { this.requestUpdate(); return; }
    this._setCommon('color_cal', v ? v.toUpperCase() : undefined);
  }

  render() {
    if (!this._config) return html``;
    const expense = HE_EDITABLE_SLOT_DEFS.filter((def) => def.dir === 'expense');
    const income = HE_EDITABLE_SLOT_DEFS.filter((def) => def.dir === 'income');
    return html`
      <div class="form">
        <div class="common">
          <ha-textfield label="标题" .value=${this._config.title || ''}
            @change=${(e) => this._setCommon('title', e.target.value)}></ha-textfield>
          <ha-textfield label="每行格子数" type="number" min="1" max="6"
            .value=${String(this._config.columns || 3)}
            @change=${(e) => this._setCommon('columns', Number(e.target.value) || 3)}></ha-textfield>
        </div>

        <div class="hint">
          只填需要展示的类型，没填的格子不会出现；点击格子可以把它从日历 / 日 / 月图表里剔除。<br>
          同一类型可以加多个实体，金额会相加（例如两块电表）。
        </div>

        <div class="toggles">
          <label class="split-row">
            <input type="checkbox" data-toggle="split" .checked=${this._splitPayment()}
              @change=${(e) => this._toggleSplit(e.target.checked)} />
            <span>
              拆分贷款金额：房贷 → <b>房贷</b>(月供) + <b>房款</b>(首付款)，车贷 / 消费贷同理。
              取消勾选则合并成一格显示合计。
            </span>
          </label>
          <label class="split-row">
            <input type="checkbox" data-toggle="calendar" .checked=${this._defaultShowCalendar()}
              @change=${(e) => this._toggleDefaultCalendar(e.target.checked)} />
            <span>是否默认弹出日历（取消勾选则初始收起，点「日历」按钮才展开）。</span>
          </label>
        </div>

        <div class="section">支出</div>
        ${expense.map((def) => this._renderSlot(def))}

        <div class="section">收入</div>
        ${income.map((def) => this._renderSlot(def))}

        <div class="section">通用</div>
        <div class="common">
          <ha-textfield label="卡片宽度" .value=${this._config.width || ''}
            @change=${(e) => this._setCommon('width', e.target.value)}></ha-textfield>
          <ha-select label="主题" .value=${this._config.theme || 'system'}
            @selected=${(e) => this._setCommon('theme', e.target.value)}
            @closed=${(e) => e.stopPropagation()}>
            <mwc-list-item value="system">跟随系统</mwc-list-item>
            <mwc-list-item value="light">浅色</mwc-list-item>
            <mwc-list-item value="dark">深色</mwc-list-item>
            <mwc-list-item value="sun">跟随太阳</mwc-list-item>
            <mwc-list-item value="function">theme() 函数</mwc-list-item>
          </ha-select>
        </div>
        <div class="color-row">
          <span class="color-label">日历金额底色</span>
          <input type="color" class="color-input" data-color="cal"
            .value=${this._calColor()}
            @change=${(e) => this._setCalColor(e.target.value)} />
          <input type="text" class="color-text" autocomplete="off" spellcheck="false"
            placeholder="#ff3d02"
            .value=${this._calColor()}
            @change=${(e) => this._setCalColor(e.target.value)} />
          <button class="color-reset" title="恢复默认（跟随「金额颜色」）"
            @click=${() => this._setCalColor('')}>默认</button>
        </div>
      </div>
    `;
  }
}

customElements.define('xiaoshi-household-expenses-editor', XiaoshiHouseholdExpensesEditor);

/* ==========================================================================
 * 入口按钮卡片  xiaoshi-household-expenses-button
 * --------------------------------------------------------------------------
 * 参照电费卡片的按钮（xiaoshi-state-grid-button）：一枚小按钮，默认显示
 * 「💰️ 家庭」，点击调 popup_card.show 弹出家庭支出卡片。
 *
 * 按钮上的 entities / columns / theme / color_cal 等配置会**原样透传**给
 * 弹出的卡片，所以「按钮」和「弹出的卡片」只需要配一份配置：
 *
 *   type: custom:xiaoshi-household-expenses-button
 *   emoji: 💰️
 *   entry_text: 家庭
 *   entities: { electric: sensor.x, mortgage: sensor.y, ... }
 *
 * 不配 entities 也能用：这时弹出的是一张没数据的家庭支出卡片。
 * ========================================================================== */

window.customCards = window.customCards || [];
window.customCards.push({
  type: 'xiaoshi-household-expenses-button',
  name: '消逝家庭支出按钮',
  description: '一枚「💰️ 家庭」按钮，点击弹出家庭支出卡片',
  preview: true
});

/* 只属于「按钮」自己的键，不透传给弹出的卡片 */
const HE_BUTTON_OWN_KEYS = [
  'type',
  'button_width', 'button_height', 'button_font_size', 'button_icon_size',
  'emoji', 'entry_text',
  'popup_cards', 'other_cards', 'popup', 'popup_width', 'popup_top', 'popup_background',
  'tap_action', 'tap_action_enable',
  'hold_action', 'hold_action_enable',
  'hold_popup_cards', 'hold_popup_width', 'hold_popup_top',
  'transparent_bg', 'lock_white_fg'
];

/* popup_cards / tap_action 这类字段用户按 YAML 写。解析器从公共库动态取，
 * 取不到就退化成 JSON.parse —— 主功能（点按钮弹卡片）不依赖它。 */
let heYamlToJson = null;
try {
  const heYamlMod = await import('../function/function.js');
  if (heYamlMod && typeof heYamlMod.yamlToJson === 'function') heYamlToJson = heYamlMod.yamlToJson;
} catch (err) {
  console.warn('[household-expenses-button] 未加载 yaml 解析器，popup_cards 仅支持 JSON:', err);
}

function heParseYaml(text) {
  if (heYamlToJson) return heYamlToJson(text);
  return JSON.parse(text);
}

/* 按钮主题：与卡片的 _evaluateTheme 同一套口径（含 function/theme 全局函数） */
function heButtonTheme(config, hass) {
  const mode = (config && config.theme) || 'system';
  try {
    if (mode === 'light') return 'light';
    if (mode === 'dark') return 'dark';
    if (mode === 'sun') {
      const sun = hass && hass.states && hass.states['sun.sun'];
      if (sun && sun.state === 'above_horizon') return 'light';
      if (sun && sun.state === 'below_horizon') return 'dark';
      return 'light';
    }
    if (mode === 'function' || (typeof mode === 'string' && mode.includes('theme'))) {
      if (typeof window.theme === 'function') return window.theme() || 'light';
      return 'light';
    }
    if (mode === 'system' || !mode) {
      if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) return 'dark';
      return 'light';
    }
    return mode;
  } catch (err) {
    return 'light';
  }
}

class XiaoshiHouseholdExpensesButton extends LitElement {
  static get properties() {
    return {
      hass: { type: Object },
      config: { type: Object },
      theme: { type: String }
    };
  }

  static get styles() {
    /* 逐条对齐电费按钮 xiaoshi-state-grid-button 的 .balance-status —— 宽/高/圆角/底色/
       渐变高光/投影/:active 缩放/emoji 间距全部同值，只换类名，方便日后两边同步。
       对应源码：state-grid.js 第 697~703 行。 */
    return css`
      :host { display: block; }
      .he-entry { width: var(--button-width, 16.8vw); max-width: var(--button-max-width, 90px);height: var(--button-height, 25px); padding: 0; margin: 0; background-color: var(--bg-color, #fff); background-image: var(--xs-btn-sheen, none); box-shadow: var(--xs-btn-shadow, none); color: var(--fg-color, #000); border-radius: 10px; font-size: var(--button-font-size, 11px); font-weight: 500; text-align: center; box-sizing: border-box; display: flex; align-items: center; justify-content: center; gap: 0; cursor: none; transition: background-color 0.2s, transform 0.1s; position: relative; }
      .he-entry:active { transform: scale(0.95); box-shadow: 0 2px 12px rgba(255, 255, 255, 0.4), 0 2px 8px rgba(0, 0, 0, 0.4); }
      .he-entry-emoji { font-size: var(--button-icon-size, 13px); margin-right: 3px; line-height: 1; }
      .he-loading { text-align: center; padding: 10px 0; color: var(--fg-color, #000); }
    `;
  }

  constructor() {
    super();
    this._holdTimer = null;
    this._holdTriggered = false;
  }

  static getConfigElement() {
    return document.createElement('xiaoshi-household-expenses-button-editor');
  }

  static getStubConfig() {
    return { emoji: '💰️', entry_text: '家庭' };
  }

  setConfig(config) {
    this.config = { ...config };
    this.style.setProperty('--button-width', config.button_width || '16.8vw');
    if (config.button_width) this.style.setProperty('--button-max-width', config.button_width);
    this.style.setProperty('--button-height', config.button_height || '25px');
    this.style.setProperty('--button-font-size', config.button_font_size || '11px');
    this.style.setProperty('--button-icon-size', config.button_icon_size || '13px');
  }

  /* 透传给弹出卡片的配置：按钮自己的键全部剔除 */
  _cardConfig() {
    const out = {};
    Object.keys(this.config || {}).forEach((key) => {
      if (!HE_BUTTON_OWN_KEYS.includes(key)) out[key] = this.config[key];
    });
    return out;
  }

  _themeName() {
    const theme = heButtonTheme(this.config, this.hass);
    this.setAttribute('theme', theme);
    return theme;
  }

  _haptic(kind) {
    const ev = new Event('haptic', { bubbles: true, cancelable: false, composed: true });
    ev.detail = kind || 'light';
    this.dispatchEvent(ev);
  }

  _executeAction(actionYaml) {
    if (!actionYaml || !String(actionYaml).trim()) return false;
    try {
      const actionConfig = heParseYaml(actionYaml);
      if (!actionConfig || !actionConfig.action) return false;
      const dot = String(actionConfig.action).indexOf('.');
      if (dot < 0) return false;
      const serviceData = actionConfig.target ? Object.assign({}, actionConfig.target) : {};
      if (actionConfig.data) Object.assign(serviceData, actionConfig.data);
      this.hass.callService(String(actionConfig.action).slice(0, dot),
        String(actionConfig.action).slice(dot + 1), serviceData);
      return true;
    } catch (err) {
      console.error('[household-expenses-button] 执行 action 失败:', err);
      return false;
    }
  }

  /* 弹窗公共参数：宽度 / 位置 / 背景（与电费按钮一致的三种背景写法） */
  _popupServiceData(cards) {
    const data = { card: cards };
    const width = this.config.popup_width || '95%';
    const top = this.config.popup_top || '20px';
    if (width !== '95%') data.popup_width = width;
    if (top !== '20px') data.popup_top = top;
    const bg = this.config.popup_background;
    if (bg === 'transparent') data.background = 'transparent';
    else if (bg === 'theme') {
      data.background = this._themeName() === 'dark' ? 'rgb(50, 50, 50)' : 'rgb(255, 255, 255)';
    } else if (bg) data.background = bg;
    return data;
  }

  /* 附加卡片（popup_cards）：YAML 文本，主题缺省时跟随按钮 */
  _appendPopupCards(cards, yaml) {
    if (!yaml || !String(yaml).trim()) return;
    try {
      const list = heParseYaml(yaml);
      const arr = Array.isArray(list) ? list : [list];
      arr.forEach((card) => {
        if (!card || typeof card !== 'object') return;
        cards.push(!card.theme && this.config.theme
          ? { ...card, theme: this.config.theme === 'system' ? this._themeName() : this.config.theme }
          : card);
      });
    } catch (err) {
      console.error('[household-expenses-button] 附加卡片解析失败:', err);
    }
  }

  _onHoldStart() {
    this._holdTriggered = false;
    this._holdTimer = setTimeout(() => {
      this._holdTriggered = true;
      this._showHoldPopup();
    }, 500);
  }

  _onHoldEnd() {
    if (this._holdTimer) {
      clearTimeout(this._holdTimer);
      this._holdTimer = null;
    }
  }

  _showHoldPopup() {
    if (this.config.hold_action_enable === true) {
      this._executeAction(this.config.hold_action);
      this._haptic();
      return;
    }
    const yaml = this.config.hold_popup_cards;
    if (!yaml || !String(yaml).trim()) return;
    const cards = [];
    this._appendPopupCards(cards, yaml);
    if (!cards.length) return;
    const saved = this.config.popup_width;
    const savedTop = this.config.popup_top;
    if (this.config.hold_popup_width) this.config.popup_width = this.config.hold_popup_width;
    if (this.config.hold_popup_top) this.config.popup_top = this.config.hold_popup_top;
    const data = this._popupServiceData(cards);
    this.config.popup_width = saved;
    this.config.popup_top = savedTop;
    this.hass.callService('popup_card', 'show', data);
    this._haptic();
  }

  _handleButtonClick() {
    if (this._holdTriggered) return;
    if (this.config.tap_action_enable === true) {
      this._executeAction(this.config.tap_action);
      this._haptic();
      return;
    }
    const cards = [Object.assign({ type: 'custom:xiaoshi-household-expenses' }, this._cardConfig())];
    this._appendPopupCards(cards, this.config.popup_cards || this.config.other_cards || this.config.popup);
    this.hass.callService('popup_card', 'show', this._popupServiceData(cards));
    this._haptic();
  }

  render() {
    if (!this.hass) return html`<div class="he-loading">等待Home Assistant连接...</div>`;

    const theme = this._themeName();
    const transparentBg = this.config.transparent_bg === true;
    const lockedWhite = this.config.lock_white_fg === true;
    const fgColor = lockedWhite ? 'rgb(255, 255, 255)' : (theme === 'light' ? 'rgb(0, 0, 0)' : 'rgb(255, 255, 255)');
    const bgColor = transparentBg ? 'transparent'
      : (theme === 'light' ? 'rgb(255, 255, 255, 0.6)' : 'rgb(83, 83, 83, 0.6)');
    /* 与电费按钮同一段 skin：渐变叠层 + 三层投影（含内高光，就是那道「上边框」观感） */
    const skin = bgColor === 'transparent' ? '' : `background-image: linear-gradient(160deg, rgba(255,255,255,${theme === 'dark' ? 0.14 : 0.55}) 0%, rgba(255,255,255,0) 52%, rgba(0,0,0,${theme === 'dark' ? 0.22 : 0.06}) 100%);--xs-btn-shadow: ${theme === 'dark'
      ? '0 1px 2px rgba(0,0,0,0.50), 0 3px 7px rgba(0,0,0,0.34), inset 0 1px 0 rgba(255,255,255,0.16)'
      : '0 1px 2px rgba(16,24,40,0.14), 0 3px 6px rgba(16,24,40,0.13), inset 0 1px 0 rgba(255,255,255,0.85)'};`;

    const emoji = this.config.emoji !== undefined ? this.config.emoji : '💰️';
    const text = this.config.entry_text !== undefined ? this.config.entry_text : '家庭';

    return html`
      <div class="he-entry" style="--fg-color: ${fgColor}; --bg-color: ${bgColor}; ${skin}"
        @click=${this._handleButtonClick}
        @pointerdown=${this._onHoldStart} @pointerup=${this._onHoldEnd} @pointerleave=${this._onHoldEnd}>
        ${emoji ? html`<span class="he-entry-emoji">${emoji}</span>` : ''}
        ${text ? html`<span style="color: ${fgColor};">${text}</span>` : ''}
      </div>
    `;
  }

  /* 与电费按钮一致：视图模式下的占位高度 */
  getCardSize() { return 3; }
}
customElements.define('xiaoshi-household-expenses-button', XiaoshiHouseholdExpensesButton);

/* ==========================================================================
 * 按钮卡片配置界面：按钮外观 + 弹窗行为。
 * 数据（entities）跟着卡片配置走，直接在 YAML 里写一份即可，这里不重复配。
 * 写法对齐家庭支出卡片编辑器：原生 input / textarea，不用 ha-* 组件。
 * ========================================================================== */
const HE_BUTTON_EDITOR_KEYS = [
  'emoji', 'entry_text',
  'button_width', 'button_height', 'button_font_size', 'button_icon_size',
  'theme', 'transparent_bg', 'lock_white_fg', 'tap_action_enable', 'tap_action',
  'popup_width', 'popup_top', 'popup_background', 'popup_cards',
  'hold_action_enable', 'hold_action', 'hold_popup_cards'
];

class XiaoshiHouseholdExpensesButtonEditor extends LitElement {
  static get properties() {
    return {
      hass: { type: Object },
      _config: { type: Object }
    };
  }

  static get styles() {
    return css`
      :host { display: block; }
      .form { display: flex; flex-direction: column; gap: 10px; padding: 4px 4px 16px; }
      .section { font-size: 13px; font-weight: 700; color: var(--primary-text-color);
        border-top: 1px solid var(--divider-color); padding-top: 8px; margin-top: 4px; }
      .grid2 { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
      .field { display: flex; flex-direction: column; gap: 4px; }
      .field label { font-size: 12px; color: var(--secondary-text-color); }
      .field input[type="text"], .field textarea, .field select {
        width: 100%; box-sizing: border-box; padding: 7px 10px; font-size: 13px;
        border: 1px solid var(--divider-color); border-radius: 6px;
        background: var(--card-background-color); color: var(--primary-text-color); outline: none; }
      .field input[type="text"]:focus, .field textarea:focus { border-color: var(--primary-color); }
      .field textarea { min-height: 72px; resize: vertical; font-family: monospace; line-height: 1.45; }
      .check { display: flex; align-items: flex-start; gap: 8px; font-size: 13px; line-height: 1.45;
        color: var(--primary-text-color); cursor: pointer; }
      .check input { margin: 2px 0 0; flex: 0 0 auto; }
      .hint { font-size: 12px; line-height: 1.5; color: var(--secondary-text-color); }
    `;
  }

  setConfig(config) {
    this._config = { ...(config || {}) };
  }

  _valueChanged(ev) {
    const target = ev.target;
    const name = target.name;
    if (!name || !HE_BUTTON_EDITOR_KEYS.includes(name)) return;
    const next = { ...this._config };
    if (target.type === 'checkbox') {
      if (target.checked) next[name] = true;
      else delete next[name];
    } else {
      const value = target.value;
      if (value === '' || value === undefined) delete next[name];
      else next[name] = value;
    }
    this._config = next;
    this.dispatchEvent(new CustomEvent('config-changed', {
      detail: { config: next }, bubbles: true, composed: true
    }));
  }

  _text(name, label, placeholder) {
    return html`
      <div class="field">
        <label>${label}</label>
        <input type="text" name=${name} .value=${this._config[name] || ''}
          placeholder=${placeholder || ''} @change=${this._valueChanged} />
      </div>
    `;
  }

  _check(name, label) {
    return html`
      <label class="check">
        <input type="checkbox" name=${name} .checked=${this._config[name] === true}
          @change=${this._valueChanged} />
        <span>${label}</span>
      </label>
    `;
  }

  _area(name, label, placeholder, rows) {
    return html`
      <div class="field">
        <label>${label}</label>
        <textarea name=${name} rows=${rows || 4} placeholder=${placeholder || ''}
          @change=${this._valueChanged} .value=${this._config[name] || ''}></textarea>
      </div>
    `;
  }

  render() {
    return html`
      <div class="form">
        <div class="hint">
          按钮点击后弹出<strong>家庭支出卡片</strong>：卡片用的 entities / columns / 主题等，
          直接在按钮卡片的 YAML 里写一份即可（会原样透传），这里只配按钮外观与弹窗行为。
        </div>

        <div class="section">按钮</div>
        <div class="grid2">
          ${this._text('emoji', '图标 / 表情', '💰️')}
          ${this._text('entry_text', '文字', '家庭')}
        </div>
        <div class="grid2">
          ${this._text('button_width', '按钮宽度', '16.8vw')}
          ${this._text('button_height', '按钮高度', '25px')}
        </div>
        <div class="grid2">
          ${this._text('button_font_size', '文字字号', '11px')}
          ${this._text('button_icon_size', '图标字号', '13px')}
        </div>
        <div class="field">
          <label>主题</label>
          <select name="theme" @change=${this._valueChanged}>
            ${['system', 'light', 'dark', 'sun', 'function'].map((mode) => html`
              <option value=${mode} ?selected=${(this._config.theme || 'system') === mode}>${mode}</option>
            `)}
          </select>
        </div>
        ${this._check('transparent_bg', '透明背景（去掉按钮底色）')}
        ${this._check('lock_white_fg', '文字锁定白色')}

        <div class="section">弹窗</div>
        <div class="grid2">
          ${this._text('popup_width', '弹窗宽度', '95%')}
          ${this._text('popup_top', '弹窗顶部位置', '20px')}
        </div>
        ${this._text('popup_background', '弹窗背景', '留空 / transparent / theme / #ffffff')}
        ${this._area('popup_cards', '附加卡片（popup_cards，YAML）', '- type: custom:xiaoshi-household-expenses', 4)}

        <div class="section">点击行为</div>
        ${this._check('tap_action_enable', '点击只执行 tap_action（不弹窗）')}
        ${this._area('tap_action', 'tap_action（YAML）', 'action: light.toggle\ntarget:\n  entity_id: light.x', 4)}

        <div class="section">长按行为</div>
        ${this._check('hold_action_enable', '长按只执行 hold_action（不弹窗）')}
        ${this._area('hold_action', 'hold_action（YAML）', 'action: script.x', 3)}
        ${this._area('hold_popup_cards', '长按弹出卡片（hold_popup_cards，YAML）', '- type: markdown\n  content: 你好', 3)}
      </div>
    `;
  }
}
customElements.define('xiaoshi-household-expenses-button-editor', XiaoshiHouseholdExpensesButtonEditor);
