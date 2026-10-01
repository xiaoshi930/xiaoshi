const whenDefined = (t) => customElements.whenDefined(t);
await Promise.race([whenDefined("ha-card"), whenDefined("ha-panel-lovelace")]);
const LitElement = window.LitElement || Object.getPrototypeOf(customElements.get("ha-card"));
const html = LitElement.prototype.html;
const css = LitElement.prototype.css;
import { yamlToJson } from '../function/function.js';

window.customCards = window.customCards || [];
window.customCards.push(
  {
    type: 'xiaoshi-state-grid-button',
    name: '消逝公用事业按钮',
    description: '显示国网电费、水费、燃气费余额按钮，点击弹出详情卡片',
    preview: true
  },
  {
    type: 'xiaoshi-state-grid-info',
    name: '消逝公用事业卡片',
    description: '显示国网电费、水费、燃气费余额、阶梯和用量统计',
    preview: true
  }
);

// 工具类型配置
const UTILITY_CONFIG = {
  electric: {
    emoji: '⚡',
    typeLabel: '电费',
    usageLabel: '用电量',
    costLabel: '用电费',
    dayUsageLabel: '日用电量',
    dayCostLabel: '日用电金额',
    monthUsageLabel: '月用电量',
    yearUsageLabel: '年用电量',
    lastYearUsageLabel: '上年用电量',
    thisYearUsageLabel: '本年用电量',
    lastMonthUsageLabel: '上月用电量',
    balanceLabel: '电费余额',
    totalUsageLabel: '总用电量',
    defaultIcon: 'mdi:flash',
    hasPeakValley: true,
    usageUnit: '度',
    priceUnit: '元/度',
    dayButtonLabel: '用电',
    monthButtonLabel: '用电',
    ladderUsageKey: '电',
    svgpath:'/xiaoshi/xiaoshi-card/icon/electric.svg'
  },
  water: {
    emoji: '💧',
    typeLabel: '水费',
    usageLabel: '用水量',
    costLabel: '用水费',
    dayUsageLabel: '日用水量',
    dayCostLabel: '日用水金额',
    monthUsageLabel: '月用水量',
    yearUsageLabel: '年用水量',
    lastYearUsageLabel: '上年用水量',
    thisYearUsageLabel: '本年用水量',
    lastMonthUsageLabel: '上月用水量',
    balanceLabel: '水费余额',
    totalUsageLabel: '总用水量',
    defaultIcon: 'mdi:water',
    hasPeakValley: false,
    usageUnit: '吨',
    priceUnit: '元/吨',
    barColor: '#2196F3',
    barColorLast: '#2196F340',
    priceKey: '水价',
    usageSeriesName: '用水量',
    costSeriesName: '水费',
    lastUsageSeriesName: '上年用水量',
    thisUsageSeriesName: '本年用水量',
    lastCostSeriesName: '上年水费',
    thisCostSeriesName: '本年水费',
    dayButtonLabel: '用水',
    monthButtonLabel: '用水',
    ladderUsageKey: '水',
    svgpath:'/xiaoshi/xiaoshi-card/icon/water.svg',
    dayUsageKey: 'f_water',
    dayCostKey: 'e_water',
    monthUsageKey: 'f_water_total',
    monthCostKey: 'e_water_total'
  },
  gas: {
    emoji: '🔥',
    typeLabel: '燃气',
    usageLabel: '用气量',
    costLabel: '用气费',
    dayUsageLabel: '日用气量',
    dayCostLabel: '日用气金额',
    monthUsageLabel: '月用气量',
    yearUsageLabel: '年用气量',
    lastYearUsageLabel: '上年用气量',
    thisYearUsageLabel: '本年用气量',
    lastMonthUsageLabel: '上月用气量',
    balanceLabel: '燃气余额',
    totalUsageLabel: '总用气量',
    defaultIcon: 'mdi:fire',
    hasPeakValley: false,
    usageUnit: 'm³',
    priceUnit: '元/m³',
    barColor: '#f66f07ff',
    barColorLast: '#f66f0740',
    priceKey: '气价',
    usageSeriesName: '用气量',
    costSeriesName: '气费',
    lastUsageSeriesName: '上年用气量',
    thisUsageSeriesName: '本年用气量',
    lastCostSeriesName: '上年气费',
    thisCostSeriesName: '本年气费',
    dayButtonLabel: '用气',
    monthButtonLabel: '用气',
    ladderUsageKey: '气',
    svgpath:'/xiaoshi/xiaoshi-card/icon/gas.svg',
    dayUsageKey: 'f_gas',
    dayCostKey: 'e_gas',
    monthUsageKey: 'f_gas_total',
    monthCostKey: 'e_gas_total'
  }
};

function getUtilityConfig(utilityType) {
  return UTILITY_CONFIG[utilityType || 'electric'] || UTILITY_CONFIG.electric;
}

/**
 * 归一化日数据项：将 f_gas/e_gas、f_water/e_water 等字段映射到 dayEleNum/dayEleCost
 */
function normalizeDayItem(item, uc) {
  if (!item) return item;
  if (!uc.dayUsageKey) return item; // electric 使用标准格式
  return {
    ...item,
    dayEleNum: item[uc.dayUsageKey] ?? item.dayEleNum ?? 0,
    dayEleCost: item[uc.dayCostKey] ?? item.dayEleCost ?? 0,
  };
}

/**
 * 从 monthly_summary 构建月度列表（monthlist 格式）
 * 如果某年月不在 monthly_summary 中，则从 daylist 汇总计算
 */
function buildMonthlistFromSummary(attrs, uc) {
  // 如果 monthlist 已存在且有数据，直接归一化后返回
  if (attrs.monthlist && attrs.monthlist.length > 0) {
    return attrs.monthlist.map(item => normalizeMonthItem(item, uc));
  }
  // 从 monthly_summary 构建
  if (attrs.monthly_summary) {
    const summary = attrs.monthly_summary;
    const monthlist = [];
    for (const [yearMonth, data] of Object.entries(summary)) {
      monthlist.push({
        month: yearMonth,
        monthEleNum: data[uc.monthUsageKey] ?? 0,
        monthEleCost: data[uc.monthCostKey] ?? 0,
      });
    }
    // 补充 monthly_summary 中缺失的月份（从 daylist 汇总）
    if (attrs.daylist && uc.dayUsageKey) {
      const existingMonths = new Set(monthlist.map(m => m.month));
      const daylistMonths = new Set();
      attrs.daylist.forEach(item => {
        if (item?.day) {
          const ym = item.day.substring(0, 7); // "2026-06"
          daylistMonths.add(ym);
        }
      });
      for (const ym of daylistMonths) {
        if (!existingMonths.has(ym)) {
          const monthDays = attrs.daylist.filter(item => item?.day && item.day.startsWith(ym));
          let totalUsage = 0, totalCost = 0;
          monthDays.forEach(item => {
            totalUsage += Number(item[uc.dayUsageKey]) || 0;
            totalCost += Number(item[uc.dayCostKey]) || 0;
          });
          monthlist.push({
            month: ym,
            monthEleNum: totalUsage,
            monthEleCost: totalCost,
          });
        }
      }
    }
    monthlist.sort((a, b) => b.month.localeCompare(a.month));
    return monthlist;
  }
  return attrs.monthlist || [];
}

/**
 * 归一化月数据项：将 f_gas_total/e_gas_total 等映射到 monthEleNum/monthEleCost
 */
function normalizeMonthItem(item, uc) {
  if (!item) return item;
  if (!uc.monthUsageKey) return item;
  return {
    ...item,
    monthEleNum: item[uc.monthUsageKey] ?? item.monthEleNum ?? 0,
    monthEleCost: item[uc.monthCostKey] ?? item.monthEleCost ?? 0,
  };
}

/**
 * 从 monthlist（已归一化）构建 yearlist
 * 如果 yearlist 已存在，直接返回；否则从 monthlist 汇总
 */
function buildYearlistFromMonthlist(attrs, uc) {
  if (attrs.yearlist && attrs.yearlist.length > 0) return attrs.yearlist;
  const monthlistSource = buildMonthlistFromSummary(attrs, uc);
  if (!monthlistSource || monthlistSource.length === 0) return [];
  const yearMap = {};
  monthlistSource.forEach(item => {
    if (!item?.month) return;
    const year = item.month.substring(0, 4);
    if (!yearMap[year]) {
      yearMap[year] = { year, yearEleNum: 0, yearEleCost: 0 };
    }
    yearMap[year].yearEleNum += Number(item.monthEleNum) || 0;
    yearMap[year].yearEleCost += Number(item.monthEleCost) || 0;
  });
  return Object.values(yearMap).sort((a, b) => b.year.localeCompare(a.year));
}

class XiaoshiStateGridButtonEditor extends LitElement {
  static get properties() {
    return {
      hass: { type: Object },
      config: { type: Object },
      _searchTerm: { type: String },
      _filteredEntities: { type: Array },
      _showEntityList: { type: Boolean }
    };
  }

  static get styles() {
    return css`      .form { display: flex; flex-direction: column; gap: 10px; min-height: 500px; }
      .form-group { display: flex; flex-direction: column; gap: 5px; }
      label { font-weight: bold; }
      select, input, textarea { padding: 8px; border: 1px solid #ddd; border-radius: 4px; }
      textarea { min-height: 80px; resize: vertical; }
      .help-text { font-size: 0.85em; color: #666; margin-top: 4px; }
      .entity-selector { position: relative; }
      .entity-search-input { width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px; box-sizing: border-box; }
      .entity-dropdown { position: absolute; top: 100%; left: 0; right: 0; height: 300px; overflow-y: auto; background: white; border: 1px solid #ddd; border-radius: 4px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); z-index: 1000; margin-top: 2px; }
      .entity-option { display: flex; align-items: center; justify-content: space-between; padding: 8px 12px; cursor: pointer; border-bottom: 1px solid #eee; }
      .entity-option:hover { background: #f5f5f5; }
      .entity-option.selected { background: #e3f2fd; }
      .entity-info { display: flex; align-items: center; gap: 8px; flex: 1; justify-content: space-between; }
      .entity-details { flex: 1; }
      .entity-name { font-weight: 500; font-size: 14px; color: #000; }
      .entity-id { font-size: 12px; color: #000; font-family: monospace; }
      .check-icon { color: #4CAF50; }
      .no-results { padding: 12px; text-align: center; color: #666; font-style: italic; }
      .selected-entities { margin-top: 8px; }
      .selected-label { font-size: 12px; font-weight: bold; margin-bottom: 4px; color: #333; }
      .selected-entity-config { margin-bottom: 8px; border: 1px solid #ddd; border-radius: 4px; padding: 8px; background: #f9f9f9; }
      .selected-entity { display: flex; align-items: center; gap: 4px; margin-bottom: 8px; font-size: 12px; color: #000; justify-content: space-between; }
      .attribute-config { margin-top: 4px; display: flex; flex-direction: column; gap: 4px; }
      .override-config { display: flex; align-items: center; gap: 4px; margin-top: 2px; }
      .override-checkbox { margin-right: 4px; }
      .override-input { flex: 1; padding: 2px 6px; border: 1px solid #ddd; border-radius: 3px; font-size: 11px; box-sizing: border-box; }
      .override-label { font-size: 11px; color: #666; white-space: nowrap; }
      .remove-btn { background: none; border: none; cursor: pointer; padding: 0; display: flex; align-items: center; color: #666; margin-left: auto; }
      .remove-btn:hover { color: rgb(255, 0, 0); }
      .checkbox-group { display: flex; align-items: center; gap: 6px; }
      .checkbox-label { display: flex; align-items: center; gap: 8px; font-size: 14px; cursor: pointer; }
      .color-input-wrapper { display: flex; gap: 3px; align-items: center; }
      .color-input { width: 70px; height: 36px; border: 1px solid #ddd; border-radius: 4px; cursor: pointer; }
      .color-text { flex: 1; height: 22px; }`;
  }

  render() {
    if (!this.hass || !this.config) return html``;
    const uc = getUtilityConfig(this.config.utility_type);
    const tabletDesc = uc.typeLabel === '电费' ? '电费' : uc.typeLabel === '水费' ? '水费' : '燃气费';
    return html`
      <div class="form">
        <div class="form-group">
          <label>公用事业类型</label>
          <select @change=${this._entityChanged} .value=${this.config.utility_type || 'electric'} name="utility_type">
            <option value="electric">电费</option>
            <option value="water">水费</option>
            <option value="gas">燃气</option>
          </select>
        </div>

        <div class="form-group">
          <label>多实体显示模式</label>
          <select @change=${this._entityChanged} .value=${this.config.display_mode || 'first_entity'} name="display_mode">
            <option value="sum">合计</option>
            <option value="min">最小值</option>
            <option value="max">最大值</option>
            <option value="average">平均值</option>
            <option value="first_entity">首个实体（默认）</option>
          </select>
        </div>

        <div class="form-group">
          <label>小数点精度：控制显示的小数位数，默认1位</label>
          <input type="number" @change=${this._entityChanged} .value=${this.config.decimal_precision !== undefined ? this.config.decimal_precision : '1'} name="decimal_precision" placeholder="默认1" min="0" max="10" step="1" />
        </div>

        <div class="checkbox-group">
          <input type="checkbox" @change=${this._entityChanged} .checked=${this.config.tablet_mode === true} name="tablet_mode" id="tablet_mode" />
          <label for="tablet_mode" class="checkbox-label">（平板端特性1）（透明背景、白色文字、显示${tabletDesc}余额和预计天数）</label>
        </div>

        <div class="checkbox-group">
          <input type="checkbox" class="checkbox-input"
            @change=${this._entityChanged}
            .checked=${this.config.transparent_bg === true}
            name="transparent_bg" id="transparent_bg"
          />
          <label for="transparent_bg" class="checkbox-label">
            （平板端特性2）透明背景（勾选后按钮背景透明）
          </label>
        </div>

        <div class="checkbox-group">
          <input type="checkbox" class="checkbox-input"
            @change=${this._entityChanged}
            .checked=${this.config.lock_white_fg === true}
            name="lock_white_fg" id="lock_white_fg"
          />
          <label for="lock_white_fg" class="checkbox-label">
            （平板端特性2）白色图标文字（勾选后锁定显示白色）
          </label>
        </div>

        <div class="form-group">
          <label>按钮宽度：默认16.8vw</label>
          <input type="text" @change=${this._entityChanged} .value=${this.config.button_width !== undefined ? this.config.button_width : '16.8vw'} name="button_width" placeholder="默认16.8vw" />
        </div>

        <div class="form-group">
          <label>按钮高度：默认24px</label>
          <input type="text" @change=${this._entityChanged} .value=${this.config.button_height !== undefined ? this.config.button_height : '24px'} name="button_height" placeholder="默认24px" />
        </div>

        <div class="form-group">
          <label>按钮文字大小：默认11px</label>
          <input type="text" @change=${this._entityChanged} .value=${this.config.button_font_size !== undefined ? this.config.button_font_size : '11px'} name="button_font_size" placeholder="默认11px" />
        </div>

        <div class="form-group">
          <label>按钮图标大小：默认13px</label>
          <input type="text" @change=${this._entityChanged} .value=${this.config.button_icon_size !== undefined ? this.config.button_icon_size : '13px'} name="button_icon_size" placeholder="默认13px" />
        </div>

        <div class="form-group">
          <label>主题</label>
          <select @change=${this._entityChanged} .value=${this.config.theme !== undefined ? this.config.theme : 'system'} name="theme">
            <option value="system">系统主题</option>
            <option value="light">浅色主题</option>
            <option value="dark">深色主题</option>
          </select>
        </div>

        <div class="form-group">
          <label>卡片宽度</label>
          <input type="text" @change=${this._entityChanged} .value=${this.config.width !== undefined ? this.config.width : '100%'} name="width" placeholder="100%, 380px" />
        </div>

        <div class="form-group">
          <label class="color-input-wrapper">${uc.usageLabel}数据颜色：
            <input type="color" @change=${this._entityChanged} .value=${this.config.color_num !== undefined ? this.config.color_num : '#07d2ff'} name="color_num" class="color-input" />
            <input type="text" @change=${this._entityChanged} .value=${this.config.color_num !== undefined ? this.config.color_num : '#07d2ff'} name="color_num" class="color-text" placeholder="#07d2ff" />
          </label>
        </div>

        <div class="form-group">
          <label class="color-input-wrapper">${uc.costLabel}数据颜色：
            <input type="color" @change=${this._entityChanged} .value=${this.config.color_cost !== undefined ? this.config.color_cost : '#f30660'} name="color_cost" class="color-input" />
            <input type="text" @change=${this._entityChanged} .value=${this.config.color_cost !== undefined ? this.config.color_cost : '#f30660'} name="color_cost" class="color-text" placeholder="#f30660" />
          </label>
        </div>

        <div class="checkbox-group">
          <input type="checkbox" @change=${this._entityChanged} .checked=${this.config.default_show_calendar ? true : false} name="default_show_calendar" id="default_show_calendar" />
          <label for="default_show_calendar" class="checkbox-label">默认弹出日历</label>
        </div>

        <div class="form-group">
          <label>信息标题</label>
          <input type="text" @change=${this._entityChanged} .value=${this.config.balance_name !== undefined ? this.config.balance_name : uc.typeLabel + '信息'} name="balance_name" placeholder="${uc.typeLabel}信息" />
        </div>

        <div class="form-group">
          <label>全局预警条件</label>
          <input type="text" @change=${this._entityChanged} .value=${this.config.global_warning || ''} name="global_warning" placeholder="<10 或 <=0" />
        </div>

        <div class="form-group">
          <label>多户号排列方式</label>
          <select @change=${this._entityChanged} .value=${this.config.entity_layout || 'vertical'} name="entity_layout">
            <option value="vertical">纵向排列</option>
            <option value="horizontal">横向排列</option>
          </select>
        </div>

        <div class="form-group" ?hidden=${this.config.entity_layout !== 'horizontal'}>
          <label>每排个数</label>
          <input type="number" min="1" max="10" @change=${this._entityChanged} .value=${this.config.entities_per_row || '3'} name="entities_per_row" placeholder="3" />
        </div>

        <div class="form-group">
          <label>添加实体</label>
          <div class="entity-selector">
            <input type="text" @input=${this._onEntitySearch} @focus=${this._onEntitySearch} .value=${this._searchTerm || ''} placeholder="搜索实体..." class="entity-search-input" />
            ${this._showEntityList ? html`
              <div class="entity-dropdown">
                ${this._filteredEntities.map(entity => html`
                  <div class="entity-option ${this.config.entities && this.config.entities.some(e => e.entity_id === entity.entity_id) ? 'selected' : ''}" @click=${() => this._toggleEntity(entity.entity_id)}>
                    <div class="entity-info">
                      <div class="entity-details">
                        <div class="entity-name">${entity.attributes?.friendly_name || entity.entity_id}</div>
                        <div class="entity-id">${entity.entity_id}</div>
                      </div>
                      <ha-icon icon="${entity.attributes?.icon || 'mdi:help-circle'}"></ha-icon>
                    </div>
                    ${this.config.entities && this.config.entities.some(e => e.entity_id === entity.entity_id) ? html`<ha-icon icon="mdi:check" class="check-icon"></ha-icon>` : ''}
                  </div>
                `)}
                ${this._filteredEntities.length === 0 ? html`<div class="no-results">未找到匹配的实体</div>` : ''}
              </div>
            ` : ''}
          </div>
          <div class="selected-entities">
            ${this.config.entities && this.config.entities.length > 0 ? html`
              <div class="selected-label">已选择的实体：</div>
              ${this.config.entities.map((entityConfig, index) => {
                const entity = this.hass.states[entityConfig.entity_id];
                return html`
                  <div class="selected-entity-config">
                    <div class="selected-entity">
                      <span>${entity?.attributes?.friendly_name || entityConfig.entity_id}</span>
                      <ha-icon icon="${entity?.attributes?.icon || 'mdi:help-circle'}"></ha-icon>
                      <button class="remove-btn" @click=${() => this._removeEntity(index)}><ha-icon icon="mdi:close"></ha-icon></button>
                    </div>
                    <div class="attribute-config">
                      <div class="override-config">
                        <input type="checkbox" class="override-checkbox" @change=${(e) => this._updateEntityOverride(index, 'name', e.target.checked)} .checked=${entityConfig.overrides?.name !== undefined} />
                        <span class="override-label">名称:</span>
                        <input type="text" class="override-input" @change=${(e) => this._updateEntityOverrideValue(index, 'name', e.target.value)} .value=${entityConfig.overrides?.name || ''} placeholder="自定义名称" ?disabled=${entityConfig.overrides?.name === undefined} />
                      </div>
                      <div class="override-config">
                        <input type="checkbox" class="override-checkbox" @change=${(e) => this._updateEntityOverride(index, 'unit', e.target.checked)} .checked=${entityConfig.overrides?.unit !== undefined} />
                        <span class="override-label">单位:</span>
                        <input type="text" class="override-input" @change=${(e) => this._updateEntityOverrideValue(index, 'unit', e.target.value)} .value=${entityConfig.overrides?.unit || ''} placeholder="自定义单位" ?disabled=${entityConfig.overrides?.unit === undefined} />
                      </div>
                      <div class="override-config">
                        <input type="checkbox" class="override-checkbox" @change=${(e) => this._updateEntityOverride(index, 'icon', e.target.checked)} .checked=${entityConfig.overrides?.icon !== undefined} />
                        <span class="override-label">图标:</span>
                        <input type="text" class="override-input" @change=${(e) => this._updateEntityOverrideValue(index, 'icon', e.target.value)} .value=${entityConfig.overrides?.icon || ''} placeholder="mdi:icon-name" ?disabled=${entityConfig.overrides?.icon === undefined} />
                      </div>
                      <div class="override-config">
                        <input type="checkbox" class="override-checkbox" @change=${(e) => this._updateEntityOverride(index, 'warning', e.target.checked)} .checked=${entityConfig.overrides?.warning !== undefined} />
                        <span class="override-label">预警:</span>
                        <input type="text" class="override-input" @change=${(e) => this._updateEntityOverrideValue(index, 'warning', e.target.value)} .value=${entityConfig.overrides?.warning || ''} placeholder=">10, <=5, ==on" ?disabled=${entityConfig.overrides?.warning === undefined} />
                      </div>
                    </div>
                  </div>
                `;
              })}
            ` : ''}
          </div>
          <div class="help-text">
            搜索并选择要显示的实体，支持多选。每个实体可配置名称、单位、图标、预警。
          </div>
        </div>


        <div class="form-group"><label>👇👇👇下方弹出的卡片可增加的其他卡片👇👇👇</label></div>

        <div class="form-group">
          <label>弹窗背景css属性</label>
          <select
            @change=${this._entityChanged}
            .value=${this.config.popup_background || ''}
            name="popup_background"
          >
            <option value="">默认</option>
            <option value="transparent">透明</option>
            <option value="theme">跟随主题</option>
            <option value="custom">自定义颜色</option>
          </select>
          ${this.config.popup_background === 'custom' ? html`
            <input
              type="color"
              @change=${this._entityChanged}
              .value=${this.config.popup_background_color || '#ffffff'}
              name="popup_background"
              style="width: 34px; height: 30px; padding: 1px; border: 1px solid #ddd; border-radius: 4px; cursor: pointer;"
            />
          ` : ''}
        </div>

        <div class="checkbox-group">
          <input type="checkbox" class="checkbox-input"
            @change=${this._entityChanged}
            .checked=${this.config.tap_action_enable === true}
            name="tap_action_enable" id="tap_action_enable"
          />
          <label for="tap_action_enable" class="checkbox-label">启用tap_action禁用popup_cards</label>
        </div>
        ${this.config.tap_action_enable === true ? html`
        <div class="form-group">
          <label>tap_action（执行调用服务）</label>
          <textarea @change=${this._entityChanged} .value=${this.config.tap_action || ''} name="tap_action"
            placeholder='action: light.turn_on
target:
  area_id: living_room
  entity_id:
    - light.hallway'></textarea>
        </div>
        ` : html`
        <div class="form-group">
          <label>弹窗宽度：默认95%</label>
          <input type="text" @change=${this._entityChanged} .value=${this.config.popup_width !== undefined ? this.config.popup_width : '95%'} name="popup_width" placeholder="默认95%" />
        </div>

        <div class="form-group">
          <label>弹窗位置：默认20px</label>
          <input type="text" @change=${this._entityChanged} .value=${this.config.popup_top !== undefined ? this.config.popup_top : '20px'} name="popup_top" placeholder="默认20px" />
        </div>
        <div class="form-group">
          <textarea @change=${this._entityChanged} .value=${this.config.popup_cards || this.config.other_cards || this.config.popup || ''} name="popup_cards" placeholder='# 示例配置：添加button卡片
- type: custom:button-card
  template: 测试模板
- type: custom:button-card
  template: 测试模板'></textarea>
        </div>
        `}

        <div class="checkbox-group">
          <input type="checkbox" class="checkbox-input"
            @change=${this._entityChanged}
            .checked=${this.config.hold_action_enable === true}
            name="hold_action_enable" id="hold_action_enable"
          />
          <label for="hold_action_enable" class="checkbox-label">启用hold_action禁用hold_popup_cards</label>
        </div>
        ${this.config.hold_action_enable === true ? html`
        <div class="form-group">
          <label>hold_action（执行调用服务）</label>
          <textarea @change=${this._entityChanged} .value=${this.config.hold_action || ''} name="hold_action"
            placeholder='action: light.turn_on
target:
  area_id: living_room
  entity_id:
    - light.hallway'></textarea>
        </div>
        ` : html`
        <div class="form-group">
          <label>长按弹窗宽度</label>
          <input @change=${this._entityChanged} .value=${this.config.hold_popup_width || ''} name="hold_popup_width" placeholder="留空则使用弹窗宽度配置" />
        </div>
        <div class="form-group">
          <label>长按弹窗位置</label>
          <input @change=${this._entityChanged} .value=${this.config.hold_popup_top || ''} name="hold_popup_top" placeholder="留空则使用弹窗位置配置" />
        </div>
        <div class="form-group">
          <label>长按弹出内容（hold_popup_cards）</label>
          <textarea @change=${this._entityChanged} .value=${this.config.hold_popup_cards || ''} name="hold_popup_cards" placeholder='长按时弹出的YAML卡片配置'></textarea>
        </div>
        `}
        
      </div>
    `;
  }

  _entityChanged(e) {
    const { name, value, type, checked } = e.target;
    let finalValue;
    if (type === 'checkbox') {
      finalValue = checked;
    } else {
      if (!value && name !== 'theme' && name !== 'button_width' && name !== 'button_height' &&
          name !== 'button_font_size' && name !== 'button_icon_size' && name !== 'popup_width' &&
          name !== 'popup_top' && name !== 'display_mode' &&
          name !== 'decimal_precision' && name !== 'width' && name !== 'color_num' &&
          name !== 'color_cost' && name !== 'balance_name' && name !== 'global_warning' &&
          name !== 'entity_layout' && name !== 'entities_per_row' && name !== 'default_show_calendar' &&
          name !== 'utility_type' && name !== 'popup_cards' && name !== 'hold_popup_cards' &&
          name !== 'tap_action' && name !== 'hold_action' &&
          name !== 'popup_background') return;
      finalValue = value;
    }
    if (name === 'button_width') finalValue = value || '16.8vw';
    else if (name === 'button_height') finalValue = value || '24px';
    else if (name === 'button_font_size') finalValue = value || '11px';
    else if (name === 'button_icon_size') finalValue = value || '13px';
    else if (name === 'decimal_precision') finalValue = value !== undefined ? parseInt(value) : 1;
    else if (name === 'default_show_calendar') finalValue = checked ? 'none' : '';

    this.config = { ...this.config, [name]: finalValue };
    this.dispatchEvent(new CustomEvent('config-changed', { detail: { config: this.config }, bubbles: true, composed: true }));
  }

  _onEntitySearch(e) {
    const searchTerm = e.target.value.toLowerCase();
    this._searchTerm = searchTerm;
    this._showEntityList = true;
    if (!this.hass) return;
    const allEntities = Object.values(this.hass.states);
    this._filteredEntities = allEntities.filter(entity => {
      const entityId = entity.entity_id.toLowerCase();
      const friendlyName = (entity.attributes?.friendly_name || '').toLowerCase();
      return entityId.includes(searchTerm) || friendlyName.includes(searchTerm);
    }).slice(0, 50);
    this.requestUpdate();
  }

  _toggleEntity(entityId) {
    const currentEntities = this.config.entities || [];
    let newEntities;
    if (currentEntities.some(e => e.entity_id === entityId)) {
      newEntities = currentEntities.filter(e => e.entity_id !== entityId);
    } else {
      newEntities = [...currentEntities, { entity_id: entityId, overrides: undefined }];
    }
    this.config = { ...this.config, entities: newEntities };
    this.dispatchEvent(new CustomEvent('config-changed', { detail: { config: this.config }, bubbles: true, composed: true }));
    this.requestUpdate();
  }

  _removeEntity(index) {
    const currentEntities = this.config.entities || [];
    const newEntities = currentEntities.filter((_, i) => i !== index);
    this.config = { ...this.config, entities: newEntities };
    this.dispatchEvent(new CustomEvent('config-changed', { detail: { config: this.config }, bubbles: true, composed: true }));
    this.requestUpdate();
  }

  _updateEntityOverride(index, overrideType, enabled) {
    const currentEntities = this.config.entities || [];
    const newEntities = [...currentEntities];
    if (newEntities[index]) {
      const overrides = { ...newEntities[index].overrides };
      if (enabled) { overrides[overrideType] = ''; } else { delete overrides[overrideType]; }
      newEntities[index] = { ...newEntities[index], overrides: Object.keys(overrides).length > 0 ? overrides : undefined };
    }
    this.config = { ...this.config, entities: newEntities };
    this.dispatchEvent(new CustomEvent('config-changed', { detail: { config: this.config }, bubbles: true, composed: true }));
    this.requestUpdate();
  }

  _updateEntityOverrideValue(index, overrideType, value) {
    const currentEntities = this.config.entities || [];
    const newEntities = [...currentEntities];
    if (newEntities[index] && newEntities[index].overrides && newEntities[index].overrides[overrideType] !== undefined) {
      const overrides = { ...newEntities[index].overrides };
      overrides[overrideType] = value.trim();
      newEntities[index] = { ...newEntities[index], overrides: overrides };
    }
    this.config = { ...this.config, entities: newEntities };
    this.dispatchEvent(new CustomEvent('config-changed', { detail: { config: this.config }, bubbles: true, composed: true }));
    this.requestUpdate();
  }

  firstUpdated() {
    document.addEventListener('click', (e) => {
      if (!e.target.closest('.entity-selector')) {
        this._showEntityList = false;
        this.requestUpdate();
      }
    });
  }

  constructor() {
    super();
    this._searchTerm = '';
    this._filteredEntities = [];
    this._showEntityList = false;
  }

  setConfig(config) { this.config = config; }
}
customElements.define('xiaoshi-state-grid-button-editor', XiaoshiStateGridButtonEditor);

class XiaoshiStateGridButton extends LitElement {
  static get properties() {
    return {
      hass: Object,
      config: Object,
      _balanceData: Array,
      _loading: Boolean,
      _refreshInterval: Number,
      theme: { type: String }
    };
  }

  static get styles() {
    return css`      :host { display: block; }
      .balance-status { width: var(--button-width, 16.8vw); max-width: var(--button-max-width, 90px);height: var(--button-height, 24px); padding: 0; margin: 0; background: var(--bg-color, #fff); color: var(--fg-color, #000); border-radius: 10px; font-size: var(--button-font-size, 11px); font-weight: 500; text-align: center; box-sizing: border-box; display: flex; align-items: center; justify-content: center; gap: 0; cursor: none; transition: background-color 0.2s, transform 0.1s; position: relative; }
      .balance-status:active { transform: scale(0.95); box-shadow: 0 2px 12px rgba(255, 255, 255, 0.4), 0 2px 8px rgba(0, 0, 0, 0.4); }
      .balance-status.tablet-mode { width: var(--button-width, 16.8vw); padding: 0 10px; white-space: nowrap; justify-content: flex-start; }
      .tablet-balance { display: inline-flex; align-items: center; width: 66.66%; }
      .tablet-days { display: inline-flex; align-items: center; width: 33.33%; justify-content: flex-start; }
      .status-emoji { font-size: var(--button-icon-size, 13px); margin-right: 3px; line-height: 1; }
      .loading { text-align: center; padding: 10px 0; color: var(--fg-color, #000); }`;
  }

  constructor() {
    super();
    this._balanceData = [];
    this._loading = false;
    this._refreshInterval = null;
    this.theme = 'system';
    this._holdTimer = null;
    this._holdTriggered = false;
  }

  static getConfigElement() {
    return document.createElement("xiaoshi-state-grid-button-editor");
  }

  connectedCallback() {
    super.connectedCallback();
    this._loadBalanceData();
    this.setAttribute('theme', this._evaluateTheme());
    this._refreshInterval = setInterval(() => { this._loadBalanceData(); }, 300000);
  }

  updated(changedProperties) {
    super.updated(changedProperties);
    if (changedProperties.has('hass')) {
      this._loadBalanceData();
    }
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
    if (this._refreshInterval) clearInterval(this._refreshInterval);
  }

  async _loadBalanceData() {
    if (!this.hass) return;
    try {
      const entities = this.config.entities || [];
      const balanceData = [];
      const uc = getUtilityConfig(this.config.utility_type);
      for (const entityConfig of entities) {
        const entityId = entityConfig.entity_id;
        const entity = this.hass.states[entityId];
        if (!entity) continue;
        let value = entity.state;
        let unit = entity.attributes?.unit_of_measurement || '';
        let friendlyName = entity.attributes?.friendly_name || entityId;
        let icon = entity.attributes?.icon || uc.defaultIcon;
        let warningThreshold = undefined;
        if (entityConfig.overrides) {
          if (entityConfig.overrides.name) friendlyName = entityConfig.overrides.name;
          if (entityConfig.overrides.icon) icon = entityConfig.overrides.icon;
          if (entityConfig.overrides.unit) unit = entityConfig.overrides.unit;
          if (entityConfig.overrides.warning) warningThreshold = entityConfig.overrides.warning;
        }
        balanceData.push({ entity_id: entityId, friendly_name: friendlyName, value: value, unit: unit, icon: icon, warning_threshold: warningThreshold });
      }
      this._balanceData = balanceData;
    } catch (error) {
      console.error('加载实体数据失败:', error);
      this._balanceData = [];
    }
    this._loading = false;
  }

  // ===== tap_action / hold_action 服务调用 =====
  _executeAction(actionYaml) {
    if (!actionYaml || !actionYaml.trim()) return false;
    try {
      const actionConfig = yamlToJson(actionYaml);
      if (!actionConfig || !actionConfig.action) return false;
      const dotIndex = actionConfig.action.indexOf('.');
      if (dotIndex < 0) return false;
      const domain = actionConfig.action.substring(0, dotIndex);
      const service = actionConfig.action.substring(dotIndex + 1);
      const serviceData = actionConfig.target ? Object.assign({}, actionConfig.target) : {};
      if (actionConfig.data) Object.assign(serviceData, actionConfig.data);
      this.hass.callService(domain, service, serviceData);
      return true;
    } catch (err) {
      console.error('执行action失败:', err);
      return false;
    }
  }

  // ===== 长按弹窗 (hold_popup_cards) =====
  _onHoldStart(e) {
    this._holdTriggered = false;
    this._holdTimer = setTimeout(() => {
      this._holdTriggered = true;
      this._onHoldPopup();
    }, 500);
  }
  _onHoldEnd() {
    if (this._holdTimer) {
      clearTimeout(this._holdTimer);
      this._holdTimer = null;
    }
  }
  _onHoldPopup() {
    if (this.config.hold_action_enable === true) {
      this._executeAction(this.config.hold_action);
      if (this._handleClick) this._handleClick();
      return;
    }
    const holdConfig = this.config.hold_popup_cards;
    if (!holdConfig || !holdConfig.trim()) return;
    try {
      const h = this._hass || this.hass;
      const cards = yamlToJson(holdConfig);
      if (!cards || cards.length === 0) return;
      const theme = this._evaluateTheme ? this._evaluateTheme() : 'light';
      const cardsWithTheme = cards.map(card => {
        if (!card.theme && this.config.theme) {
          return { ...card, theme: this.config.theme === 'system' ? theme : this.config.theme };
        }
        return card;
      });
      if (this._handleClick) this._handleClick();
      const serviceData = { card: cardsWithTheme };
      const popupWidth = this.config.hold_popup_width || this.config.popup_width || '95%';
      const popupTop = this.config.hold_popup_top || this.config.popup_top || '20px';
      if (popupWidth !== '95%') serviceData.popup_width = popupWidth;
      if (popupTop !== '20px') serviceData.popup_top = popupTop;
      if (this.config.popup_background === 'transparent') {
        serviceData.background = 'transparent';
      } else if (this.config.popup_background === 'theme') {
        const currentTheme = this._evaluateTheme ? this._evaluateTheme() : 'light';
        serviceData.background = currentTheme === 'light' ? 'rgb(255, 255, 255)' : 'rgb(50, 50, 50)';
      } else if (this.config.popup_background && this.config.popup_background !== '') {
        serviceData.background = this.config.popup_background;
      }
      h.callService('popup_card', 'show', serviceData);
    } catch (err) {
      console.error('解析长按弹窗卡片失败:', err);
    }
  }

  _handleClick() {
    const hapticEvent = new Event('haptic', { bubbles: true, cancelable: false, composed: true });
    hapticEvent.detail = 'light';
    this.dispatchEvent(hapticEvent);
  }

  _evaluateWarningCondition(value, condition) {
    if (!condition) return false;
    const match = condition.match(/^(>=|<=|>|<|==|!=)\s*(.+)$/);
    if (!match) return false;
    const operator = match[1];
    let compareValue = match[2].trim();
    if ((compareValue.startsWith('"') && compareValue.endsWith('"')) || (compareValue.startsWith("'") && compareValue.endsWith("'"))) {
      compareValue = compareValue.slice(1, -1);
    }
    const numericValue = parseFloat(value);
    const numericCompare = parseFloat(compareValue);
    if (!isNaN(numericValue) && !isNaN(numericCompare)) {
      switch (operator) {
        case '>': return numericValue > numericCompare;
        case '>=': return numericValue >= numericCompare;
        case '<': return numericValue < numericCompare;
        case '<=': return numericValue <= numericCompare;
        case '==': return numericValue === numericCompare;
        case '!=': return numericValue !== numericCompare;
      }
    }
    const stringValue = String(value);
    switch (operator) {
      case '==': return stringValue === compareValue;
      case '!=': return stringValue !== compareValue;
    }
    return false;
  }

  _handleButtonClick() {
    if (this._holdTriggered) return;
    if (this.config.tap_action_enable === true) {
      this._executeAction(this.config.tap_action);
      this._handleClick();
      return;
    }
    const excludedParams = [
      'type', 'button_height', 'button_width', 'button_font_size', 'button_icon_size',
      'popup_top', 'popup_width', 'display_mode', 'decimal_precision', 'emoji',
      'tablet_mode',
      'transparent_bg',
      'lock_white_fg',
      'other_cards', 'popup_cards', 'popup',
      'tap_action', 'hold_action',
      'popup_background'
    ];
    const cards = [];
    const stateGridCardConfig = {};
    Object.keys(this.config).forEach(key => {
      if (!excludedParams.includes(key)) {
        stateGridCardConfig[key] = this.config[key];
      }
    });
    cards.push({
      type: 'custom:xiaoshi-state-grid-info',
      ...stateGridCardConfig
    });
    const additionalCardsYaml = this.config.popup_cards || this.config.other_cards || this.config.popup;
    if (additionalCardsYaml && additionalCardsYaml.trim()) {
      try {
        const additionalCardsConfig = yamlToJson(additionalCardsYaml);
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
    if (this.config.popup_background === 'transparent') {
      serviceData.background = 'transparent';
    } else if (this.config.popup_background === 'theme') {
      const currentTheme = this._evaluateTheme ? this._evaluateTheme() : 'light';
      serviceData.background = currentTheme === 'light' ? 'rgb(255, 255, 255)' : 'rgb(50, 50, 50)';
    } else if (this.config.popup_background && this.config.popup_background !== '') {
      serviceData.background = this.config.popup_background;
    }
    this.hass.callService('popup_card', 'show', serviceData);
    this._handleClick();
  }

  _computeDisplayValue() {
    const displayMode = this.config.display_mode || 'first_entity';
    const decimalPrecision = this.config.decimal_precision !== undefined ? parseInt(this.config.decimal_precision) : 1;

    if (!this._balanceData || this._balanceData.length === 0) {
      return { value: '无数据', unit: '', isWarning: false };
    }

    const numericValues = this._balanceData
      .map(item => { const v = parseFloat(item.value); return { value: isNaN(v) ? null : v, item }; })
      .filter(item => item.value !== null);

    if (numericValues.length === 0) {
      return { value: '无有效数值', unit: '', isWarning: false };
    }

    let displayValue;
    let displayUnit = '元';

    switch (displayMode) {
      case 'sum':
        displayValue = numericValues.reduce((sum, item) => sum + item.value, 0);
        break;
      case 'min':
        displayValue = Math.min(...numericValues.map(item => item.value));
        break;
      case 'max':
        displayValue = Math.max(...numericValues.map(item => item.value));
        break;
      case 'average':
        displayValue = numericValues.reduce((sum, item) => sum + item.value, 0) / numericValues.length;
        break;
      case 'first_entity':
      default:
        displayValue = numericValues[0].value;
        displayUnit = numericValues[0].item.unit || '元';
        break;
    }

    let isWarning = false;
    if (this.config.global_warning && this.config.global_warning.trim() !== '') {
      isWarning = this._evaluateWarningCondition(displayValue, this.config.global_warning);
    }

    if (typeof displayValue === 'number') {
      displayValue = parseFloat(displayValue.toFixed(decimalPrecision));
    }

    return { value: displayValue, unit: displayUnit, isWarning };
  }

  render() {
    if (!this.hass) return html`<div class="loading">等待Home Assistant连接...</div>`;

    const uc = getUtilityConfig(this.config.utility_type);
    const theme = this._evaluateTheme();
    const buttonEmoji = uc.emoji;
    const tabletMode = this.config.tablet_mode === true;
    const transparentBg = this.config.transparent_bg === true;
    const lockWhiteFg = this.config.lock_white_fg === true;
    const fgColor = lockWhiteFg ? 'rgb(255, 255, 255)' : theme === 'light' ? 'rgb(0, 0, 0)' : 'rgb(255, 255, 255)';
    const buttonBgColor = tabletMode ? 'transparent' : transparentBg ? 'transparent' : theme === 'light' ? 'rgb(255, 255, 255, 0.6)' : 'rgb(83, 83, 83, 0.6)';

    const { value: displayValue, unit: displayUnit, isWarning } = this._computeDisplayValue();

    const warningColor = 'rgb(255, 0, 0)';
    const numberColor = isWarning ? warningColor : fgColor;

    if (tabletMode) {
      const tabletFgColor = 'rgb(255, 255, 255)';
      let balanceValue = '--';
      let daysValue = '--';
      let balanceEntityId = null;
      if (this._balanceData && this._balanceData.length > 0) {
        for (const item of this._balanceData) {
          const name = (item.friendly_name || '').toLowerCase();
          if (name.includes('余额') || name.includes('费余') || name.includes('balance')) {
            balanceValue = item.value;
            balanceEntityId = item.entity_id;
          } else if (name.includes('预计') || name.includes('天数') || name.includes('天') || name.includes('days')) {
            daysValue = item.value;
          }
        }
        if (balanceValue === '--' && this._balanceData.length >= 1) {
          balanceValue = this._balanceData[0].value;
          balanceEntityId = this._balanceData[0].entity_id;
        }
        if (daysValue === '--' && this._balanceData.length >= 2) daysValue = this._balanceData[1].value;
      }

      if (balanceEntityId && this.hass && this.hass.states[balanceEntityId]) {
        const entity = this.hass.states[balanceEntityId];
        const remainDays = entity.attributes?.剩余天数 || entity.attributes?.remain_days || entity.attributes?.days;
        if (remainDays !== undefined && remainDays !== null) daysValue = remainDays;
      }

      const balanceColor = isWarning ? warningColor : tabletFgColor;

      return html`
        <div class="balance-status tablet-mode" style="--fg-color: ${tabletFgColor}; --bg-color: ${buttonBgColor};" @click=${this._handleButtonClick} @pointerdown=${this._onHoldStart} @pointerup=${this._onHoldEnd}>
          <span class="tablet-balance"><span class="status-emoji">${buttonEmoji}</span><span style="color: ${tabletFgColor};">${uc.balanceLabel}：<span style="color: ${balanceColor};">${balanceValue}元</span></span></span>
          <span class="tablet-days" style="color: ${tabletFgColor};">预计：${daysValue}天</span>
        </div>
      `;
    }

    let formattedDisplayValue;
    if (typeof displayValue === 'number') {
      const dp = this.config.decimal_precision !== undefined ? parseInt(this.config.decimal_precision) : 1;
      formattedDisplayValue = displayValue.toFixed(dp);
      formattedDisplayValue = parseFloat(formattedDisplayValue).toString();
    } else {
      formattedDisplayValue = displayValue;
    }

    const displayText = formattedDisplayValue !== null && displayUnit ? `${formattedDisplayValue}${displayUnit}` : formattedDisplayValue;

    return html`
      <div class="balance-status" style="--fg-color: ${numberColor}; --bg-color: ${buttonBgColor};" @click=${this._handleButtonClick} @pointerdown=${this._onHoldStart} @pointerup=${this._onHoldEnd}>
        <span class="status-emoji">${buttonEmoji}</span>
        <span style="color: ${numberColor};">${displayText}</span>
      </div>
    `;
  }

  setConfig(config) {
    this.config = { ...config };
    this.style.setProperty('--button-width', config.button_width || '16.8vw');
    if (config.button_width) {
      this.style.setProperty('--button-max-width', config.button_width);
    }
    this.style.setProperty('--button-height', config.button_height || '24px');
    this.style.setProperty('--button-font-size', config.button_font_size || '11px');
    this.style.setProperty('--button-icon-size', config.button_icon_size || '13px');
  }

  getCardSize() { return 3; }
}
customElements.define('xiaoshi-state-grid-button', XiaoshiStateGridButton);

class XiaoshiStateGridEditor extends LitElement {
  static get properties() {
    return {
      hass: { type: Object },
      config: { type: Object },
      _balanceSearchTerm: { type: String },
      _filteredBalanceEntities: { type: Array },
      _showBalanceEntityList: { type: Boolean }
    };
  }

  static get styles() {
    return css`      .form { display: flex; flex-direction: column; gap: 6px; padding: 16px; width: var(--editor-width, 100%); max-width: 100%; }
      .form-group { display: flex; flex-direction: column; gap: 6px; }
      label { font-weight: bold; font-size: 14px; color: var(--primary-text-color); }
      select, input { padding: 6px 12px; border: 1px solid var(--primary-color); border-radius: 4px; background: var(--card-background-color); color: var(--primary-text-color); font-size: 14px; }
      .help-text { font-size: 12px; color: var(--secondary-text-color); margin-top: 4px; }
      .color-input-wrapper { display: flex; gap: 3px; align-items: center; }
      .input-wrapper { display: flex; gap: 3px; align-items: center; }
      .color-input { width: 70px; height: 36px; border: 1px solid var(--primary-color); border-radius: 4px; cursor: pointer; }
      .color-text { flex: 1; height: 22px; }
      .checkbox-group { display: flex; flex-direction: column; gap: 8px; }
      .checkbox-label { display: flex; align-items: center; gap: 8px; font-size: 14px; cursor: pointer; color: var(--primary-text-color); margin: 0 24px; }
      .checkbox-icon { margin: 0; }
      .checkbox-label input[type="checkbox"] { width: auto; padding: 0; }
      /* 余额实体选择器样式 */
      .balance-entity-section { border-top: 1px solid var(--divider-color); padding-top: 6px; margin-top: 6px; }
      .balance-entity-search { width: 100%; padding: 6px 12px; border: 1px solid var(--primary-color); border-radius: 4px; background: var(--card-background-color); color: var(--primary-text-color); box-sizing: border-box; margin-bottom: 8px; }
      .selected-balance-entities { margin-top: 12px; }
      .selected-balance-label { font-size: 14px; font-weight: bold; margin-bottom: 8px; color: var(--primary-text-color); }
      .layout-select { width: 100%; padding: 6px 12px; border: 1px solid var(--primary-color); border-radius: 4px; background: var(--card-background-color); color: var(--primary-text-color); font-size: 14px; box-sizing: border-box; }
      .entities-per-row-input { width: 100%; padding: 6px 12px; border: 1px solid var(--primary-color); border-radius: 4px; background: var(--card-background-color); color: var(--primary-text-color); font-size: 14px; box-sizing: border-box; }
      .selected-balance-entity { margin-bottom: 12px; border: 1px solid var(--divider-color); border-radius: 4px; padding: 8px; background: var(--card-background-color); }
      .balance-entity-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px; font-size: 12px; color: var(--primary-text-color); }
      .balance-entity-info { display: flex; align-items: center; gap: 6px; flex: 1; }
      .balance-entity-name { font-weight: 500; }
      .balance-entity-id { opacity: 0.7; font-family: monospace; }
      .remove-balance-btn { background: none; border: none; cursor: pointer; padding: 2px; color: var(--secondary-text-color); }
      .remove-balance-btn:hover { color: var(--error-color); }
      .balance-entity-overrides { display: flex; flex-direction: column; gap: 6px; margin-top: 8px; }
      .override-config { display: flex; align-items: center; gap: 4px; margin-top: 2px; }
      .override-checkbox { margin-right: 4px; }
      .override-row { display: flex; align-items: center; gap: 6px; }
      .override-row label { font-size: 12px; font-weight: normal; min-width: 60px; margin: 0; }
      .override-row input { flex: 1; padding: 4px 8px; font-size: 12px; }
      .override-label { font-size: 11px; color: #666; white-space: nowrap; }
      .override-input { flex: 1; padding: 2px 6px; border: 1px solid #ddd; border-radius: 3px; font-size: 11px; box-sizing: border-box; }
      .balance-name-input { width: 100%; padding: 6px 12px; border: 1px solid var(--primary-color); border-radius: 4px; background: var(--card-background-color); color: var(--primary-text-color); box-sizing: border-box; margin-bottom: 8px; }`;
  }

  render() {
    if (!this.hass || !this.config) return html``;

    const editorWidth = this.config.width || '100%';
    const uc = getUtilityConfig(this.config.utility_type);

    return html`
      <div class="form" style="--editor-width: ${editorWidth}">

        <div class="form-group">
          <label>公用事业类型：
          <select 
            @change=${this._valueChanged}
            .value=${this.config.utility_type !== undefined ? this.config.utility_type : 'electric'}
            name="utility_type"
          >
            <option value="electric">电费</option>
            <option value="water">水费</option>
            <option value="gas">燃气</option>
          </select>
          </label>
        </div>

        <div class="form-group">
          <label>主题：
          <select 
            @change=${this._valueChanged}
            .value=${this.config.theme !== undefined ? this.config.theme : 'system'}
            name="theme"
          >
            <option value="system">跟随系统</option>
            <option value="light">浅色主题</option>
            <option value="dark">深色主题</option>
          </select>
          </label>
        </div>

        <div class="form-group">
          <label>卡片宽度：
            <input 
              type="text" 
              @change=${this._valueChanged}
              .value=${this.config.width !== undefined ? this.config.width : '100%'}
              name="width"
              placeholder="例如: 100%, 300px"
            />
          </label>
        </div>



        <div class="form-group">
            <label class="color-input-wrapper">${uc.usageLabel}数据颜色：
              <input 
                type="color" 
                @change=${this._valueChanged}
                .value=${this.config.color_num !== undefined ? this.config.color_num : '#07d2ff'}
                name="color_num"
                class="color-input"
              />
              <input 
                type="text" 
                @change=${this._valueChanged}
                .value=${this.config.color_num !== undefined ? this.config.color_num : '#07d2ffff'}
                name="color_num"
                class="color-text"
                placeholder="#07d2ff"
              />
          </label>
        </div>

        <div class="form-group">
          <label class="color-input-wrapper">${uc.costLabel}数据颜色：
            <input 
              type="color" 
              @change=${this._valueChanged}
              .value=${this.config.color_cost !== undefined ? this.config.color_cost : '#f30660'}
              name="color_cost"
              class="color-input"
            />
            <input 
              type="text" 
              @change=${this._valueChanged}
              .value=${this.config.color_cost !== undefined ? this.config.color_cost : '#f30660'}
              name="color_cost"
              class="color-text"
              placeholder="#f30660"
            />
          </label>
        </div>

        <div class="form-group">
          <label class="checkbox-label">
            <input 
              type="checkbox" 
              @change=${this._checkboxChanged}
              .checked=${this.config.default_show_calendar !== undefined ? this.config.default_show_calendar : false}
              name="default_show_calendar"
            />
            是否默认弹出日历
          </label>
        </div>

        <!-- 余额实体配置 -->
        <div class="balance-entity-section">
          <div class="form-group">
            <label> 信息标题：</label>
            <input 
              type="text" 
              @change=${this._valueChanged}
              .value=${this.config.balance_name !== undefined ? this.config.balance_name : uc.typeLabel + '信息'}
              name="balance_name"
              placeholder="${uc.typeLabel}信息"
              class="balance-name-input"
            />
          </div>

          <div class="form-group">
            <label  class="input-wrapper">全局预警条件</label>
            <input 
              type="text" 
              @change=${this._valueChanged}
              .value=${this.config.global_warning !== undefined ? this.config.global_warning : ''}
              name="global_warning"
              placeholder="例如: <10 或 <=0 或 ==off"
              class="balance-name-input"
            />
          </div>

          <div class="form-group">
            <label>多户号排列方式：</label>
            <select 
              @change=${this._valueChanged}
              .value=${this.config.entity_layout !== undefined ? this.config.entity_layout : 'vertical'}
              name="entity_layout"
              class="layout-select"
            >
              <option value="vertical">纵向排列</option>
              <option value="horizontal">横向排列</option>
            </select>
          </div>

          <div class="form-group" ?hidden=${this.config.entity_layout !== 'horizontal'}>
            <label>每排个数：</label>
            <input 
              type="number" 
              min="1"
              max="10"
              @change=${this._valueChanged}
              .value=${this.config.entities_per_row !== undefined ? this.config.entities_per_row : '3'}
              name="entities_per_row"
              placeholder="3"
              class="entities-per-row-input"
            />
            <div class="help-text">横向排列时每行显示的实体个数（1-10）</div>
          </div>

          <div class="form-group">
            <label>添加实体：</label>
            <input 
              type="text" 
              @input=${this._onBalanceEntitySearch}
              @focus=${this._onBalanceEntitySearch}
              .value=${this._balanceSearchTerm || ''}
              placeholder="搜索或输入实体ID..."
              class="balance-entity-search"
            />
            ${this._showBalanceEntityList ? html`
              <div class="entity-dropdown">
                ${this._filteredBalanceEntities.map(entity => html`
                  <div 
                    class="entity-option ${this._isBalanceEntitySelected(entity.entity_id) ? 'selected' : ''}"
                    @click=${() => this._selectBalanceEntity(entity.entity_id)}
                  >
                    <div class="entity-info">
                      <ha-icon icon="${entity.attributes?.icon || 'mdi:help-circle'}"></ha-icon>
                      <div class="entity-details">
                        <div class="entity-name">${entity.attributes?.friendly_name || entity.entity_id}</div>
                        <div class="entity-id">${entity.entity_id}</div>
                      </div>
                    </div>
                    ${this._isBalanceEntitySelected(entity.entity_id) ? 
                      html`<ha-icon icon="mdi:check" class="check-icon"></ha-icon>` : ''}
                  </div>
                `)}
                ${this._filteredBalanceEntities.length === 0 ? html`
                  <div class="no-results">未找到匹配的实体</div>` : ''}
              </div>
            ` : ''}
          </div>

          ${this.config.entities && this.config.entities.length > 0 ? html`
            <div class="selected-balance-entities">
              <div class="selected-balance-label">已选择的实体：</div>
              ${this.config.entities.map((entityConfig, index) => {
                const entity = this.hass.states[entityConfig.entity_id];
                const friendlyName = entityConfig.overrides?.name || entity?.attributes?.friendly_name || entityConfig.entity_id;
                
                return html`
                  <div class="selected-balance-entity">
                    <div class="balance-entity-header">
                      <div class="balance-entity-info">
                        <ha-icon icon="${entity?.attributes?.icon || 'mdi:help-circle'}"></ha-icon>
                        <div>
                          <div class="balance-entity-name">${friendlyName}</div>
                          <div class="balance-entity-id">${entityConfig.entity_id}</div>
                        </div>
                      </div>
                      <button 
                        class="remove-balance-btn"
                        @click=${() => this._removeBalanceEntity(index)}
                      >
                        <ha-icon icon="mdi:close"></ha-icon>
                      </button>
                    </div>
                    
                    <div class="balance-entity-overrides">
                      <div class="override-config">
                        <input 
                          type="checkbox" 
                          class="override-checkbox"
                          @change=${(e) => this._updateEntityOverride(index, 'name', e.target.checked)}
                          .checked=${entityConfig.overrides?.name !== undefined}
                        />
                        <span class="override-label">名称:</span>
                        <input 
                          type="text" 
                          class="override-input"
                          @change=${(e) => this._updateEntityOverrideValue(index, 'name', e.target.value)}
                          .value=${entityConfig.overrides?.name || ''}
                          placeholder="自定义名称"
                          ?disabled=${entityConfig.overrides?.name === undefined}
                        />
                      </div>

                      <div class="override-config">
                        <input 
                          type="checkbox" 
                          class="override-checkbox"
                          @change=${(e) => this._updateEntityOverride(index, 'unit', e.target.checked)}
                          .checked=${entityConfig.overrides?.unit !== undefined}
                        />
                        <span class="override-label">单位:</span>
                        <input 
                          type="text" 
                          class="override-input"
                          @change=${(e) => this._updateEntityOverrideValue(index, 'unit', e.target.value)}
                          .value=${entityConfig.overrides?.unit || ''}
                          placeholder="自定义单位"
                          ?disabled=${entityConfig.overrides?.unit === undefined}
                        />
                      </div>

                      <div class="override-config">
                        <input 
                          type="checkbox" 
                          class="override-checkbox"
                          @change=${(e) => this._updateEntityOverride(index, 'icon', e.target.checked)}
                          .checked=${entityConfig.overrides?.icon !== undefined}
                        />
                        <span class="override-label">图标:</span>
                        <input 
                          type="text" 
                          class="override-input"
                          @change=${(e) => this._updateEntityOverrideValue(index, 'icon', e.target.value)}
                          .value=${entityConfig.overrides?.icon || ''}
                          placeholder="mdi:icon-name"
                          ?disabled=${entityConfig.overrides?.icon === undefined}
                        />
                      </div>

                      <div class="override-config">
                        <input 
                          type="checkbox" 
                          class="override-checkbox"
                          @change=${(e) => this._updateEntityOverride(index, 'warning', e.target.checked)}
                          .checked=${entityConfig.overrides?.warning !== undefined}
                        />
                        <span class="override-label">预警:</span>
                        <input 
                          type="text" 
                          class="override-input"
                          @change=${(e) => this._updateEntityOverrideValue(index, 'warning', e.target.value)}
                          .value=${entityConfig.overrides?.warning || ''}
                          placeholder='>10, <=5, ==on,=="hello world"'
                          ?disabled=${entityConfig.overrides?.warning === undefined}
                        />
                      </div>

                    </div>
                  </div>
                `;
              })}
            </div>
          ` : ''}
        </div>

      </div>
    `;
  }

  _valueChanged(e) {
    const { name, value } = e.target;
    if (!value) return;
    
    this.config = {
      ...this.config,
      [name]: value
    };
    
    this.dispatchEvent(new CustomEvent('config-changed', {
      detail: { config: this.config },
      bubbles: true,
      composed: true
    }));
  }

  _checkboxChanged(e) {
    const { name, checked } = e.target;
    
    this.config = {
      ...this.config,
      [name]: checked ? 'none' : ''
    };
    
    this.dispatchEvent(new CustomEvent('config-changed', {
      detail: { config: this.config },
      bubbles: true,
      composed: true
    }));
  }

  async firstUpdated() {
    document.addEventListener('click', (e) => {
      if (!e.target.closest('.balance-entity-section')) {
        this._showBalanceEntityList = false;
        this.requestUpdate();
      }
    });
  }

  constructor() {
    super();
    this._balanceSearchTerm = '';
    this._filteredBalanceEntities = [];
    this._showBalanceEntityList = false;
  }

  setConfig(config) {
    this.config = { ...config };
  }

  // 余额实体相关方法
  _onBalanceEntitySearch(e) {
    const searchTerm = e.target.value.toLowerCase();
    this._balanceSearchTerm = searchTerm;
    this._showBalanceEntityList = true;
    
    if (!this.hass) return;
    
    const allEntities = Object.values(this.hass.states);
    
    this._filteredBalanceEntities = allEntities.filter(entity => {
      const entityId = entity.entity_id.toLowerCase();
      const friendlyName = (entity.attributes?.friendly_name || '').toLowerCase();
      
      // 过滤掉已经选择的实体
      const isAlreadySelected = this._isBalanceEntitySelected(entity.entity_id);
      
      // 优先显示sensor.开头的实体
      const isSensorEntity = entityId.startsWith('sensor.');
      const matchesSearch = entityId.includes(searchTerm) || friendlyName.includes(searchTerm);
      
      return isSensorEntity && matchesSearch && !isAlreadySelected;
    }).slice(0, 20);
    
    this.requestUpdate();
  }

  _isBalanceEntitySelected(entityId) {
    return this.config.entities && this.config.entities.some(entity => entity.entity_id === entityId);
  }

  _selectBalanceEntity(entityId) {
    const currentEntities = this.config.entities || [];
    
    // 添加新的余额实体配置
    const newEntity = {
      entity_id: entityId,
    };
    
    this.config = {
      ...this.config,
      entities: [...currentEntities, newEntity]
    };
    
    this._balanceSearchTerm = '';
    
    this.dispatchEvent(new CustomEvent('config-changed', {
      detail: { config: this.config },
      bubbles: true,
      composed: true
    }));
    
    this._showBalanceEntityList = false;
    this.requestUpdate();
  }

  _updateEntityOverride(index, overrideType, enabled) {
    const currentEntities = this.config.entities || [];
    const newEntities = [...currentEntities];
    
    if (newEntities[index]) {
      const overrides = { ...newEntities[index].overrides };
      
      if (enabled) {
        overrides[overrideType] = '';
      } else {
        delete overrides[overrideType];
      }
      
      newEntities[index] = {
        ...newEntities[index],
        overrides: Object.keys(overrides).length > 0 ? overrides : undefined
      };
    }
    
    this.config = {
      ...this.config,
      entities: newEntities
    };
    
    this.dispatchEvent(new CustomEvent('config-changed', {
      detail: { config: this.config },
      bubbles: true,
      composed: true
    }));
    
    this.requestUpdate();
  }

  _updateEntityOverrideValue(index, overrideType, value) {
    const currentEntities = this.config.entities || [];
    const newEntities = [...currentEntities];
    
    if (newEntities[index] && newEntities[index].overrides && newEntities[index].overrides[overrideType] !== undefined) {
      const overrides = { ...newEntities[index].overrides };
      overrides[overrideType] = value.trim();
      
      newEntities[index] = {
        ...newEntities[index],
        overrides: overrides
      };
    }
    
    this.config = {
      ...this.config,
      entities: newEntities
    };
    
    this.dispatchEvent(new CustomEvent('config-changed', {
      detail: { config: this.config },
      bubbles: true,
      composed: true
    }));
    
    this.requestUpdate();
  }

  _removeBalanceEntity(index) {
    const currentEntities = this.config.entities || [];
    const newEntities = currentEntities.filter((_, i) => i !== index);
    
    this.config = {
      ...this.config,
      entities: newEntities
    };
    
    this.dispatchEvent(new CustomEvent('config-changed', {
      detail: { config: this.config },
      bubbles: true,
      composed: true
    }));
    
    this.requestUpdate();
  }
}
customElements.define('xiaoshi-state-grid-editor',  XiaoshiStateGridEditor);


/* ==========================================================================
 * XsCanvasChart —— 纯 Canvas 自绘柱状 / 折线混合图表（零依赖）
 *
 * 用于替代 ApexCharts，专门解决在 Home Assistant Shadow DOM 中使用 ApexCharts
 * 时出现的以下问题：
 *   1. annotations / markers 标记错位（Apex 用绝对定位 SVG + JS 计算像素偏移）
 *   2. 柱宽异常变细（Apex 依据渲染瞬间的容器宽度计算 columnWidth，容器宽度为 0
 *      或中途变化时会算出极小值）
 *   3. 切换视图前图表空白（容器 display:none 时宽度为 0，Apex 直接渲染失败）
 *
 * 本实现的所有几何坐标都在绘制那一刻由容器实际像素尺寸算出来，并且自带
 * ResizeObserver，容器从隐形变为可见、或尺寸变化时会自动重绘，因此不存在
 * 上述三类问题。
 *
 * 数据模型（model）：
 * {
 *   theme: 'light' | 'dark',            // 决定条纹/网格/前景色
 *   fg: 'rgb(0,0,0)',                   // 文字与轴线颜色
 *   yMax: 123,                          // 可选，Y 轴上限（会自动取整为整齐刻度）
 *   yTicks: 5,                           // 可选，Y 轴分段数，默认 5
 *   slotCount: 30,                       // 类目数量
 *   slotLabel: (i) => '1' | '',          // 可选，X 轴标签，返回空串表示不显示
 *   barWidthRatio: 0.62,                 // 可选，柱带占类目宽度比例
 *   groups: [                            // 一个 group = 类目内一根柱（堆叠）
 *     { series: [ { name, color, values: [], pointColors?: [] } ] }
 *   ],
 *   lines: [                             // 折线
 *     { name, color, values: [], pointColors?: [], groupIndex: 0, markers: true }
 *   ],
 *   marker: {                            // 可选，最高值标注
 *     slot, value, text, color, groupIndex
 *   },
 *   legend: true,                        // 可选，是否显示图例，默认 true
 *   tooltip: (index) => 'html string'    // 可选，自定义浮层内容
 * }
 * ========================================================================== */

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

function xsNum(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

/* 计算"整齐"的 Y 轴刻度，避免出现 3.3 / 6.6 这种刻度值 */
function xsNiceScale(maxValue, targetTicks) {
  const ticks = targetTicks || 5;
  if (!(maxValue > 0)) return { max: ticks, step: 1, count: ticks };
  const raw = maxValue / ticks;
  const mag = Math.pow(10, Math.floor(Math.log(raw) / Math.LN10));
  const norm = raw / mag;
  let step;
  if (norm <= 1) step = 1;
  else if (norm <= 2) step = 2;
  else if (norm <= 2.5) step = 2.5;
  else if (norm <= 5) step = 5;
  else step = 10;
  step *= mag;
  const count = Math.max(1, Math.ceil(maxValue / step - 1e-9));
  return { max: step * count, step, count };
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
    this._hover = -1;

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
  }

  render(model) {
    this._model = model;
    this._hover = -1;
    this._hideTip();
    this._draw();
    // 再补一帧：卡片刚插入 DOM 时首个绘制时机可能还没完成布局，下一帧重画一次即可
    if (typeof requestAnimationFrame === 'function') {
      requestAnimationFrame(() => {
        if (this._model === model) this._draw();
      });
    }
  }

  clear() {
    this._model = null;
    this._geo = null;
    this._hover = -1;
    this._hideTip();
    this._draw();
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
    canvas.width = Math.round(cssW * dpr);
    canvas.height = Math.round(cssH * dpr);
    canvas.style.width = cssW + 'px';
    canvas.style.height = cssH + 'px';

    const ctx = canvas.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, cssW, cssH);

    if (!model) {
      this._geo = null;
      return;
    }

    this._geo = this._compute(ctx, model, cssW, cssH);
    this._paint(ctx, model, this._geo);
  }

  _legendItems(model) {
    const items = [];
    const push = (name, color, values) => {
      if (!name) return;
      if (values && !values.some((v) => xsNum(v) > 0)) return;
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
    if (!(maxRaw > 0)) {
      (model.groups || []).forEach((g) => {
        for (let i = 0; i < slotCount; i++) {
          let sum = 0;
          (g.series || []).forEach((s) => { sum += xsNum(s.values[i]); });
          if (sum > maxRaw) maxRaw = sum;
        }
      });
      (model.lines || []).forEach((l) => l.values.forEach((v) => {
        const n = xsNum(v);
        if (n > maxRaw) maxRaw = n;
      }));
      maxRaw *= 1.12;
    }
    const scale = xsNiceScale(maxRaw, model.yTicks || 5);

    /* 3. 轴标签宽度决定左边距 */
    ctx.font = xsFont(10);
    let yLabelW = 0;
    for (let i = 0; i <= scale.count; i++) {
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

    /* 4. X 轴标签防重叠：宽度不够时自动抽稀，保证任何时候都不糊成一团 */
    const labels = [];
    if (model.slotLabel) {
      ctx.font = xsFont(10);
      let lastRight = -Infinity;
      for (let i = 0; i < slotCount; i++) {
        const text = model.slotLabel(i);
        if (!text) continue;
        const half = ctx.measureText(String(text)).width / 2 + 3;
        const cx = plot.x + slotW * (i + 0.5);
        if (cx - half < lastRight) continue;
        labels.push({ x: cx, text: String(text) });
        lastRight = cx + half;
      }
    }

    return {
      cssW, cssH, plot, slotCount, slotW, bandW, barW, gapW, gCount,
      scale, legendRows, legendH, slotLabelH, labels
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
    const toY = (v) => plot.y + plot.h - (Math.min(xsNum(v), max) / max) * plot.h;

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
    ctx.save();
    ctx.setLineDash([3, 3]);
    ctx.strokeStyle = gridColor;
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let i = 0; i <= geo.scale.count; i++) {
      const y = Math.round(toY(geo.scale.step * i)) + 0.5;
      ctx.moveTo(plot.x, y);
      ctx.lineTo(plot.x + plot.w, y);
    }
    ctx.stroke();
    ctx.restore();

    /* ---- 柱子（堆叠） ---- */
    (model.groups || []).forEach((group, gi) => {
      const series = group.series || [];
      for (let i = 0; i < geo.slotCount; i++) {
        const x0 = this._groupLeft(geo, i, gi);
        const left = Math.round(x0);
        const width = Math.max(1, Math.round(x0 + geo.barW) - left);
        let acc = 0;
        for (let k = 0; k < series.length; k++) {
          const s = series[k];
          const v = xsNum(s.values[i]);
          if (v <= 0) continue;
          const top = Math.round(toY(acc + v));
          const bottom = Math.round(toY(acc));
          ctx.fillStyle = xsColor((s.pointColors && s.pointColors[i]) || s.color);
          ctx.fillRect(left, top, width, Math.max(1, bottom - top));
          acc += v;
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
      ctx.strokeStyle = lineColor;
      ctx.lineWidth = line.width || 2;
      ctx.lineJoin = 'round';
      ctx.lineCap = 'round';
      ctx.beginPath();
      let started = false;
      points.forEach((p) => {
        if (!p) { started = false; return; }
        if (!started) { ctx.moveTo(p.x, p.y); started = true; } else { ctx.lineTo(p.x, p.y); }
      });
      ctx.stroke();

      if (line.markers !== false) {
        points.forEach((p) => {
          if (!p) return;
          ctx.beginPath();
          ctx.arc(p.x, p.y, 2.4, 0, Math.PI * 2);
          ctx.fillStyle = p.color || lineColor;
          ctx.fill();
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 1;
          ctx.stroke();
        });
      }
    });

    /* ---- 最高值标注 ---- */
    const mk = model.marker;
    if (mk && mk.text !== undefined) {
      const i = Math.max(0, Math.min(geo.slotCount - 1, xsNum(mk.slot)));
      const x = this._groupCenter(geo, i, mk.groupIndex || 0);
      const y = toY(mk.value);
      ctx.beginPath();
      ctx.arc(x, y, 4, 0, Math.PI * 2);
      ctx.fillStyle = '#ffffff';
      ctx.fill();
      ctx.strokeStyle = xsColor(mk.color || fg);
      ctx.lineWidth = 1.5;
      ctx.stroke();

      if (mk.text) {
        ctx.font = xsFont(11, 'bold');
        ctx.textAlign = 'center';
        ctx.textBaseline = 'bottom';
        ctx.fillStyle = mk.textColor ? xsColor(mk.textColor) : fg;
        const tw = ctx.measureText(mk.text).width;
        let tx = Math.min(Math.max(x, plot.x + tw / 2), plot.x + plot.w - tw / 2);
        ctx.fillText(mk.text, tx, y - 7);
      }
    }

    /* ---- Y 轴刻度 ---- */
    ctx.font = xsFont(10);
    ctx.fillStyle = fg;
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    for (let i = 0; i <= geo.scale.count; i++) {
      ctx.fillText(xsTickLabel(geo.scale.step * i, geo.scale.step), plot.x - 5, toY(geo.scale.step * i));
    }

    /* ---- X 轴标签 ---- */
    if (geo.labels.length) {
      ctx.font = xsFont(10);
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

class  XiaoshiStateGridInfo extends LitElement {
  static getConfigElement() {
    return document.createElement("xiaoshi-state-grid-editor");
  }

  static get properties() {
    return {
      hass: { type: Object },
      width: { type: String, attribute: true },
      height: { type: String, attribute: true },
      year: { type: Number },
      month: { type: Number },
      entity: { type: String },
      activeNav: { type: String },
      colorNum: { type: String, attribute: true },
      colorCost: { type: String, attribute: true },
      theme: { type: String },
      config: { type: Object },
      showPanel: { type: String },
      selectedDate: { type: String },
      todayDate: { type: String },
      _balanceData: { type: Array },
      _balanceLoading: { type: Boolean },
      _balanceRefreshInterval: { type: Number },
      _selectedBalanceEntity: { type: String }
    };
  }

  setConfig(config) {
    this.config = config;
    if (config) {
      if (config.width !== undefined) this.width = config.width;
      if (config.year !== undefined) this.year = config.year;
      if (config.month !== undefined) this.month = config.month;
      if (config.color_num !== undefined) this.colorNum = config.color_num;
      if (config.color_cost !== undefined) this.colorCost = config.color_cost;
      if (config.default_show_calendar !== undefined && config.default_show_calendar) {
        this.showPanel = 'calendar';
      }
      this.requestUpdate();
    }
  }

  constructor() {
    super();
    const today = new Date();
    this.year = today.getFullYear();
    this.month = today.getMonth() + 1;
    this.width = '380px';
    this.theme = 'system';
    this._holdTimer = null;
    this._holdTriggered = false;
    this.dayData = [];
    this.activeNav = '';
    this.monthData = null;
    this.colorNum = '#07d2ff';
    this.colorCost = '#f30660';
    this.showPanel = ''; // 初始不显示任何面板
    this._balanceData = [];
    this._balanceLoading = false;
    this._balanceRefreshInterval = null;
    this._selectedBalanceEntity = '';
  }

  _getUC() {
    return getUtilityConfig(this.config ? this.config.utility_type : 'electric');
  }

  connectedCallback() {
    super.connectedCallback();
    this._loadBalanceData();
    
    // 每300秒刷新一次数据
    this._balanceRefreshInterval = setInterval(() => {
      this._loadBalanceData();
    }, 300000);
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    if (this._balanceRefreshInterval) {
      clearInterval(this._balanceRefreshInterval);
      this._balanceRefreshInterval = null;
    }
    this._destroyChart();
  }

  updated(changedProperties) {
    super.updated(changedProperties);

    // 切换余额实体时让图表缓存失效，保证下一次绘制用的是新实体的数据
    if (changedProperties.has('_selectedBalanceEntity')) {
      if (this._chart) this._chart.drawnKey = null;
      this.requestUpdate();
    }

    // 面板打开时才绘图；面板关闭时释放图表实例
    if (this.showPanel === 'dayUsage') {
      this._renderDayChart();
    } else if (this.showPanel === 'monthUsage') {
      this._renderMonthChart();
    } else {
      this._destroyChart();
    }
  }

  async _loadBalanceData() {
    if (!this.hass || !this.config.entities) return;
    
    this._balanceLoading = true;
    this.requestUpdate();
    
    try {
      const balanceData = [];
      
      for (const entityConfig of this.config.entities) {
        const entity = this.hass.states[entityConfig.entity_id];
        if (!entity) continue;
        
        let value = entity.state;
        let unit = entityConfig.unit || entity.attributes.unit_of_measurement || '';
        let friendlyName = entityConfig.name || entity.attributes.friendly_name || entity.entity_id;
        let icon = entityConfig.icon || entity.attributes.icon || 'mdi:help-circle';
        let warning = entityConfig.warning || '';
        
        // 应用覆盖配置
        if (entityConfig.overrides) {
          if (entityConfig.overrides.name && entityConfig.overrides.name.trim() !== '') {
            friendlyName = entityConfig.overrides.name;
          }
          if (entityConfig.overrides.unit && entityConfig.overrides.unit.trim() !== '') {
            unit = entityConfig.overrides.unit;
          }
          if (entityConfig.overrides.icon && entityConfig.overrides.icon.trim() !== '') {
            icon = entityConfig.overrides.icon;
          }
          if (entityConfig.overrides.warning && entityConfig.overrides.warning.trim() !== '') {
            warning = entityConfig.overrides.warning;
          }
        }
        
        balanceData.push({
          entity_id: entityConfig.entity_id,
          friendly_name: friendlyName,
          value: value,
          unit: unit,
          icon: icon,
          warning: warning
        });
      }
      
      this._balanceData = balanceData;
      
      // 如果没有选中的实体，默认选中第一个
      if (balanceData.length > 0 && !this._selectedBalanceEntity) {
        this._selectedBalanceEntity = balanceData[0].entity_id;
      }
    } catch (error) {
      console.error('加载实体数据失败:', error);
    } finally {
      this._balanceLoading = false;
      this.requestUpdate();
    }
  }

  _calculateTotalAmount() {
    if (!this._balanceData || this._balanceData.length === 0) {
      return '0.00';
    }
    
    let total = 0;
    for (const item of this._balanceData) {
      const value = parseFloat(item.value);
      if (!isNaN(value)) {
        total += value;
      }
    }
    
    return total.toFixed(2);
  }

  _evaluateWarningCondition(value, condition) {
    if (!condition || condition.trim() === '') return false;
    
    // 支持的操作符
    const operators = ['>=', '<=', '>', '<', '==', '!='];
    let operator = null;
    let compareValue = '';
    
    // 查找操作符
    for (const op of operators) {
      if (condition.includes(op)) {
        operator = op;
        const parts = condition.split(op);
        if (parts.length >= 2) {
          compareValue = parts.slice(1).join(op).trim();
        }
        break;
      }
    }
    
    if (!operator) return false;
    
    // 移除比较值两端的引号（如果有的话）
    if ((compareValue.startsWith('"') && compareValue.endsWith('"')) || 
        (compareValue.startsWith("'") && compareValue.endsWith("'"))) {
      compareValue = compareValue.slice(1, -1);
    }
    
    // 尝试将值转换为数字
    const numericValue = parseFloat(value);
    const numericCompare = parseFloat(compareValue);
    
    // 如果两个值都是数字，进行数值比较
    if (!isNaN(numericValue) && !isNaN(numericCompare)) {
      switch (operator) {
        case '>': return numericValue > numericCompare;
        case '>=': return numericValue >= numericCompare;
        case '<': return numericValue < numericCompare;
        case '<=': return numericValue <= numericCompare;
        case '==': return numericValue === numericCompare;
        case '!=': return numericValue !== numericCompare;
      }
    }
    
    // 字符串比较
    const stringValue = String(value);
    const stringCompare = compareValue;
    
    switch (operator) {
      case '==': return stringValue === stringCompare;
      case '!=': return stringValue !== stringCompare;
      case '>': return stringValue > stringCompare;
      case '>=': return stringValue >= stringCompare;
      case '<': return stringValue < stringCompare;
      case '<=': return stringValue <= stringCompare;
    }
    
    return false;
  }

  _handleBalanceEntityClick(balanceData) {
    if (!balanceData.entity_id) return;
    
    // 切换选中的实体
    const oldEntity = this._selectedBalanceEntity;
    this._selectedBalanceEntity = balanceData.entity_id;
    
    // 只有当entity真正改变时才请求更新
    if (oldEntity !== this._selectedBalanceEntity) {
      this.requestUpdate();
      
      // 使用setTimeout确保在下一个事件循环中触发更新，避免延迟
      setTimeout(() => {
        this.requestUpdate();
      }, 0);
    }
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
      .calendar-grid { border: 0; border-radius: 10px; display: grid; grid-template-areas: "yearlast year yearnext today monthlast month monthnext" "week1 week2 week3 week4 week5 week6 week7" "id1 id2 id3 id4 id5 id6 id7" "id8 id9 id10 id11 id12 id13 id14" "id15 id16 id17 id18 id19 id20 id21" "id22 id23 id24 id25 id26 id27 id28" "id29 id30 id31 id32 id33 id34 id35" "id36 id37 id98 id98 id99 id99 id99"; grid-template-columns: repeat(7, 1fr); grid-template-rows: 1fr 0.6fr 1fr 1fr 1fr 1fr 1fr 1fr; gap: 0px; padding: 10px 4px; margin-top: 5px; }
      .celltotal { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 0; cursor: default; font-size: 15px; font-weight: 600; white-space: nowrap; }
      .cell { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 0; cursor: default; font-size: 12px; line-height: 12px; font-weight: 500; }
      .month-cell { border-bottom: 0.5px solid rgb(150,150,150,0.8); border-right: 0.5px solid rgb(150,150,150,0.8); }
      .month-cell-left { border-left: 0.5px solid rgb(150,150,150,0.8); }
      .month-cell-top { border-top: 0.5px solid rgb(150,150,150,0.8); }
      .month-cell-right { border-right: 0.5px solid rgb(150,150,150,0.8); }
      .month-cell-bottom { border-bottom: 0.5px solid rgb(150,150,150,0.8); }
      .nav-button { cursor: pointer; user-select: none; font-size: 12px; transition: all 0.2s ease; border-radius: 10px; }
      .nav-button:active { transform: scale(0.95); opacity: 0.8; }
      .active-nav { background-color: rgba(0, 160, 160, 0.2); border-radius: 4px; }
      .today-button { cursor: pointer; user-select: none; }
      .weekday { }
      .month-day { cursor: pointer; }
      .electricity-num { font-size: 12px; line-height: 12px; }
      .electricity-cost { font-size: 12px; line-height: 12px; }
      .min-usage { background-color: rgba(0, 255, 0, 0.2); }
      .max-usage { background-color: rgba(255, 0, 0, 0.2); }
      .summary-info { display: flex; flex-direction: column; align-items: flex-start; justify-content: center; font-size: 13px; line-height: 16px; font-weight: 500; padding: 0 0 0 30px; white-space: nowrap; }
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
      #chart-container { grid-area: chart; position: relative; width: 100%; height: 100%; }`;
  }

  get _processedDayData() {
    const selectedEntityId = this._selectedBalanceEntity;
    if (!selectedEntityId || !this.hass || !this.hass.states[selectedEntityId]) {
      return {};
    }

    const selectedEntity = this.hass.states[selectedEntityId];
    const uc = this._getUC();

    if (!selectedEntity?.attributes?.daylist) return null;
    const rawDaylist = selectedEntity.attributes.daylist;
    const daylist = rawDaylist.map(item => normalizeDayItem(item, uc));

    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth(); // 0-based
    const currentDay = now.getDate();
    const daysInCurrentMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

    // 构建本月数据映射 day => item，同时找到本月最后有数据的日期
    const currentMonthMap = {};
    let lastDataDay = 0;
    daylist.forEach(item => {
      if (!item?.day) return;
      const d = new Date(item.day.split(' ')[0]);
      if (d.getFullYear() === currentYear && d.getMonth() === currentMonth) {
        currentMonthMap[d.getDate()] = item;
        if (d.getDate() > lastDataDay) lastDataDay = d.getDate();
      }
    });
    if (lastDataDay === 0) lastDataDay = currentDay;

    // 构建上月数据映射 day => item
    const lastMonthMap = {};
    daylist.forEach(item => {
      if (!item?.day) return;
      const d = new Date(item.day.split(' ')[0]);
      if (d.getFullYear() === currentYear && d.getMonth() === currentMonth - 1) {
        lastMonthMap[d.getDate()] = item;
      }
      if (currentMonth === 0 && d.getFullYear() === currentYear - 1 && d.getMonth() === 11) {
        lastMonthMap[d.getDate()] = item;
      }
    });

    const lastMonthDays = new Date(currentYear, currentMonth, 0).getDate();

    // 辅助函数：根据数据来源生成单条数据
    const fillDayData = (getField, avgDiff) => {
      const dataArr = [], isLastArr = [], isEstimateArr = [];
      for (let day = 1; day <= daysInCurrentMonth; day++) {
        const curItem = currentMonthMap[day];
        const lastItem = lastMonthMap[day];
        const overflowDay = day > lastMonthDays ? day - lastMonthDays : null;
        const overflowItem = overflowDay !== null ? currentMonthMap[overflowDay] : null;
        const isFuture = day > lastDataDay;

        if (curItem && day <= lastDataDay) {
          dataArr.push(Number(getField(curItem)) || 0);
          isLastArr.push(false);
          isEstimateArr.push(false);
        } else if (isFuture && lastItem) {
          dataArr.push(Math.max(0, (Number(getField(lastItem)) || 0) + avgDiff));
          isLastArr.push(true);
          isEstimateArr.push(true);
        } else if (isFuture && overflowItem) {
          dataArr.push(Math.max(0, (Number(getField(overflowItem)) || 0) + avgDiff));
          isLastArr.push(true);
          isEstimateArr.push(true);
        } else if (lastItem) {
          dataArr.push(Number(getField(lastItem)) || 0);
          isLastArr.push(true);
          isEstimateArr.push(false);
        } else if (overflowItem) {
          dataArr.push(Number(getField(overflowItem)) || 0);
          isLastArr.push(true);
          isEstimateArr.push(false);
        } else {
          dataArr.push(0);
          isLastArr.push(false);
          isEstimateArr.push(false);
        }
      }
      return { dataArr, isLastArr, isEstimateArr };
    };

    // 计算平均差值的辅助函数
    const calcAvgDiff = (getField) => {
      let curSum = 0, lastSum = 0, cnt = 0;
      for (let d = 1; d <= lastDataDay; d++) {
        const curItem = currentMonthMap[d];
        const lastItem = lastMonthMap[d];
        if (curItem) {
          curSum += Number(getField(curItem)) || 0;
          if (lastItem) lastSum += Number(getField(lastItem)) || 0;
          cnt++;
        }
      }
      return cnt > 0 ? (curSum - lastSum) / cnt : 0;
    };

    const categories = [];
    for (let day = 1; day <= daysInCurrentMonth; day++) categories.push(day);

    const currentDayItem = currentMonthMap[currentDay] || daylist[0] || {};

    if (uc.hasPeakValley) {
      // ===== 电费：有尖峰平谷 =====
      const avgDiffTip = calcAvgDiff(i => i.dayTPq);
      const avgDiffPeak = calcAvgDiff(i => i.dayPPq);
      const avgDiffNormal = calcAvgDiff(i => i.dayNPq);
      const avgDiffValley = calcAvgDiff(i => i.dayVPq);
      const avgDiffCost = calcAvgDiff(i => i.dayEleCost);

      const tip = fillDayData(i => i.dayTPq, avgDiffTip);
      const peak = fillDayData(i => i.dayPPq, avgDiffPeak);
      const normal = fillDayData(i => i.dayNPq, avgDiffNormal);
      const valley = fillDayData(i => i.dayVPq, avgDiffValley);
      const cost = fillDayData(i => i.dayEleCost, avgDiffCost);

      return {
        categories,
        tip: tip.dataArr, peak: peak.dataArr, normal: normal.dataArr, valley: valley.dataArr, cost: cost.dataArr,
        tipIsLast: tip.isLastArr, peakIsLast: peak.isLastArr, normalIsLast: normal.isLastArr, valleyIsLast: valley.isLastArr, costIsLast: cost.isLastArr,
        tipIsEstimate: tip.isEstimateArr, peakIsEstimate: peak.isEstimateArr, normalIsEstimate: normal.isEstimateArr, valleyIsEstimate: valley.isEstimateArr, costIsEstimate: cost.isEstimateArr,
        total: tip.dataArr.map((v, i) => v + peak.dataArr[i] + normal.dataArr[i] + valley.dataArr[i]),
        lastDataDay,
        current: {
          ele: Number(currentDayItem.dayEleNum) || 0,
          cost: Number(currentDayItem.dayEleCost) || 0,
          days: currentDay
        }
      };
    } else {
      // ===== 水费/燃气：无尖峰平谷 =====
      const avgDiffGas = calcAvgDiff(i => i.dayEleNum);
      const avgDiffCost = calcAvgDiff(i => i.dayEleCost);

      const gas = fillDayData(i => i.dayEleNum, avgDiffGas);
      const cost = fillDayData(i => i.dayEleCost, avgDiffCost);

      return {
        categories,
        gas: gas.dataArr, cost: cost.dataArr,
        gasIsLast: gas.isLastArr, costIsLast: cost.isLastArr,
        gasIsEstimate: gas.isEstimateArr, costIsEstimate: cost.isEstimateArr,
        lastDataDay,
        current: {
          ele: Number(currentDayItem.dayEleNum) || 0,
          cost: Number(currentDayItem.dayEleCost) || 0,
          days: currentDay
        }
      };
    }
  }

  get _processedMonthData() {
    const selectedEntityId = this._selectedBalanceEntity;
    if (!selectedEntityId || !this.hass || !this.hass.states[selectedEntityId]) {
      return {};
    }

    const selectedEntity = this.hass.states[selectedEntityId];
    const uc = this._getUC();

    const lastYear  = (new Date().getFullYear() - 1).toString();
    const currentYear = new Date().getFullYear().toString();

    if (!selectedEntity?.attributes?.monthlist && !selectedEntity?.attributes?.monthly_summary) return null;

    const monthlistSource = buildMonthlistFromSummary(selectedEntity.attributes, uc);
    const lastYearBills = monthlistSource.filter(item =>
      item?.month && item.month.startsWith(lastYear)
    ) || [];
    const thisYearBills = monthlistSource.filter(item =>
      item?.month && item.month.startsWith(currentYear)
    ) || [];
    const lastmonthlist = [...lastYearBills ].slice(0, 12).reverse();
    const monthlist = [...thisYearBills].slice(0, 12).reverse();
    const lastmonthlistDay = [...lastYearBills ][0];
    const monthlistDay = [...thisYearBills][0];

    if (uc.hasPeakValley) {
      // ===== 电费：有尖峰平谷 =====
      const toMonthIdx = (m) => parseInt(m.split('-')[1]) - 1;
      return {
        tip: monthlist.map(item => ({
          x: toMonthIdx(item.month),
          y: Number(item.monthTPq) || 0
        })),
        peak: monthlist.map(item => ({
          x: toMonthIdx(item.month),
          y: Number(item.monthPPq) || 0
        })),
        normal: monthlist.map(item => ({
          x: toMonthIdx(item.month),
          y: Number(item.monthNPq) || 0
        })),
        valley: monthlist.map(item => ({
          x: toMonthIdx(item.month),
          y: Number(item.monthVPq) || 0
        })),
        total: monthlist.map(item => ({
          x: toMonthIdx(item.month),
          y: (Number(item.monthTPq) || 0) + (Number(item.monthPPq) || 0) + (Number(item.monthNPq) || 0) + (Number(item.monthVPq) || 0)
        })),
        cost: monthlist.map(item => ({
          x: toMonthIdx(item.month),
          y: Number(item.monthEleCost) || 0
        })),
        current: {
          ele: monthlistDay?.monthEleNum || 0,
          cost: monthlistDay?.monthEleCost || 0,
          days: monthlist.length
        },
        lasttip: lastmonthlist.map(item => ({
          x: toMonthIdx(item.month),
          y: Number(item.monthTPq) || 0
        })),
        lastpeak: lastmonthlist.map(item => ({
          x: toMonthIdx(item.month),
          y: Number(item.monthPPq) || 0
        })),
        lastnormal: lastmonthlist.map(item => ({
          x: toMonthIdx(item.month),
          y: Number(item.monthNPq) || 0
        })),
        lastvalley: lastmonthlist.map(item => ({
          x: toMonthIdx(item.month),
          y: Number(item.monthVPq) || 0
        })),
        lasttotal: lastmonthlist.map(item => ({
          x: toMonthIdx(item.month),
          y: (Number(item.monthTPq) || 0) + (Number(item.monthPPq) || 0) + (Number(item.monthNPq) || 0) + (Number(item.monthVPq) || 0)
        })),
        lastcost: lastmonthlist.map(item => ({
          x: toMonthIdx(item.month),
          y: Number(item.monthEleCost) || 0
        })),
        lastcurrent: {
          ele: lastmonthlistDay?.monthEleNum || 0,
          cost: lastmonthlistDay?.monthEleCost || 0,
          days: lastmonthlist.length
        }
      };
    } else {
      // ===== 水费/燃气：无尖峰平谷 =====
      const toMonthIdx = (m) => parseInt(m.split('-')[1]) - 1;
      return {
        gas: monthlist.map(item => ({
          x: toMonthIdx(item.month),
          y: Number(item.monthEleNum) || 0
        })),
        total: monthlist.map(item => ({
          x: toMonthIdx(item.month),
          y: Number(item.monthEleNum) || 0
        })),
        cost: monthlist.map(item => ({
          x: toMonthIdx(item.month),
          y: Number(item.monthEleCost) || 0
        })),
        current: {
          ele: monthlistDay?.monthEleNum || 0,
          cost: monthlistDay?.monthEleCost || 0,
          days: monthlist.length
        },
        lastgas: lastmonthlist.map(item => ({
          x: toMonthIdx(item.month),
          y: Number(item.monthEleNum) || 0
        })),
        lasttotal: lastmonthlist.map(item => ({
          x: toMonthIdx(item.month),
          y: Number(item.monthEleNum) || 0
        })),
        lastcost: lastmonthlist.map(item => ({
          x: toMonthIdx(item.month),
          y: Number(item.monthEleCost) || 0
        })),
        lastcurrent: {
          ele: lastmonthlistDay?.monthEleNum || 0,
          cost: lastmonthlistDay?.monthEleCost || 0,
          days: lastmonthlist.length
        }
      };
    }
  }

  /* ================= 图表渲染（自绘 Canvas，不再依赖 ApexCharts） ================= */

  /* 取得（必要时重建）图表实例 */
  _ensureChart() {
    const container = this.renderRoot.querySelector('#chart-container');
    if (!container) {
      this._destroyChart();
      return null;
    }
    // 容器可能是 Lit 新建的节点（例如从"日"切到"月"），此时必须重建实例
    if (!this._chart || this._chart.container !== container) {
      this._destroyChart();
      this._chart = new XsCanvasChart(container);
    }
    return this._chart;
  }

  _destroyChart() {
    if (this._chart) {
      try {
        this._chart.destroy();
      } catch (e) {
        /* 忽略销毁异常 */
      }
      this._chart = null;
    }
  }

  /* 数据指纹：数据或主题没有变化时直接跳过重绘，避免每次 hass 刷新都重画 */
  _chartKey(kind) {
    const id = this._selectedBalanceEntity || '';
    const state = (id && this.hass && this.hass.states) ? this.hass.states[id] : null;
    const attr = (state && state.attributes) ? state.attributes : null;
    const daylist = (attr && Array.isArray(attr.daylist)) ? attr.daylist : [];
    const lastDay = daylist.length ? (((daylist[daylist.length - 1] || {}).day) || '') : '';
    let monthKey = 'none';
    if (attr) {
      if (Array.isArray(attr.monthlist)) monthKey = 'arr' + attr.monthlist.length;
      else if (attr.monthly_summary) monthKey = 'sum' + JSON.stringify(attr.monthly_summary).length;
    }
    return [
      kind, id, this.config && this.config.utility_type, this._evaluateTheme(),
      this.colorNum, this.colorCost, daylist.length, lastDay, monthKey
    ].join('|');
  }

  _renderDayChart(force) {
    const chart = this._ensureChart();
    if (!chart) return;
    const key = this._chartKey('day');
    if (!force && chart.drawnKey === key) return;
    chart.drawnKey = key;
    const data = this._processedDayData;
    if (!data || !data.categories) {
      chart.clear();
      return;
    }
    chart.render(this._buildDayChartModel(data));
  }

  _renderMonthChart(force) {
    const chart = this._ensureChart();
    if (!chart) return;
    const key = this._chartKey('month');
    if (!force && chart.drawnKey === key) return;
    chart.drawnKey = key;
    const data = this._processedMonthData;
    if (!data || !data.total) {
      chart.clear();
      return;
    }
    chart.render(this._buildMonthChartModel(data));
  }

  _loadData() {
    this._renderDayChart(true);
    this._renderMonthChart(true);
  }
  /* 构建"日"图表数据模型（自绘 Canvas） */
  _buildDayChartModel(data) {
    const theme = this._evaluateTheme();
    const uc = this._getUC();
    const colorCost = this.colorCost;
    const slotCount = data.categories.length;

    // 上月/预计数据统一使用 40 透明度的同色
    const withLast = (base, values, isLast) => ({
      values: values,
      pointColors: values.map((v, i) => ((isLast && isLast[i]) ? base + '40' : base))
    });

    const model = {
      theme: theme,
      fg: theme === 'light' ? 'rgb(0, 0, 0)' : 'rgb(255, 255, 255)',
      slotCount: slotCount,
      slotLabel: (i) => ((i + 1) % 2 === 1 ? String(i + 1) : ''),
      legend: true,
      tooltip: (i) => this._buildDayTooltip(data, i)
    };

    if (uc.hasPeakValley) {
      // ===== 电费：尖峰平谷堆叠柱 + 日费用折线 =====
      const maxTotal = data.total.length > 0 ? Math.max(...data.total) : 0;
      const maxIndex = data.total.indexOf(maxTotal);

      model.groups = [{
        series: [
          Object.assign({ name: '谷时段', color: '#00BCD4' }, withLast('#00BCD4', data.valley, data.valleyIsLast)),
          Object.assign({ name: '平时段', color: '#4CAF50' }, withLast('#4CAF50', data.normal, data.normalIsLast)),
          Object.assign({ name: '峰时段', color: '#FF9800' }, withLast('#FF9800', data.peak, data.peakIsLast)),
          Object.assign({ name: '尖时段', color: '#FF5252' }, withLast('#FF5252', data.tip, data.tipIsLast))
        ]
      }];
      model.lines = [
        Object.assign({ name: `日${uc.typeLabel}`, color: colorCost, groupIndex: 0, width: 2 },
          withLast(colorCost, data.cost, data.costIsLast))
      ];
      model.marker = maxTotal > 0 ? {
        slot: maxIndex, value: maxTotal, text: `${maxTotal.toFixed(2)}${uc.usageUnit}`,
        color: this.colorNum, groupIndex: 0
      } : null;
      model.yMax = maxTotal * 1.15;
    } else {
      // ===== 水费/燃气：单色柱 + 日费用折线 =====
      const maxGas = data.gas.length > 0 ? Math.max(...data.gas) : 0;
      const maxIndex = data.gas.indexOf(maxGas);
      const maxCost = data.cost.length > 0 ? Math.max(...data.cost) : 0;

      model.groups = [{
        series: [
          Object.assign({ name: uc.usageSeriesName, color: uc.barColor },
            withLast(uc.barColor, data.gas, data.gasIsLast))
        ]
      }];
      model.lines = [
        Object.assign({ name: `日${uc.costSeriesName}`, color: colorCost, groupIndex: 0, width: 2 },
          withLast(colorCost, data.cost, data.costIsLast))
      ];
      model.marker = maxGas > 0 ? {
        slot: maxIndex, value: maxGas, text: `${maxGas.toFixed(2)}${uc.usageUnit}`,
        color: this.colorNum, groupIndex: 0
      } : null;
      model.yMax = Math.max(maxGas, maxCost) * 1.15;
    }

    return model;
  }

  /* 构建"日"图表浮层内容 */
  _buildDayTooltip(data, index) {
    const theme = this._evaluateTheme();
    const fg = theme === 'light' ? 'rgb(0, 0, 0)' : 'rgb(255, 255, 255)';
    const bg = theme === 'light' ? 'rgb(255, 255, 255)' : 'rgb(50, 50, 50)';
    const uc = this._getUC();
    const now = new Date();
    const day = index + 1;
    const dateText = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const dateLabel = day > data.lastDataDay ? `${dateText} 预计` : dateText;

    const row = (color, text) => `<div style="display:flex;align-items:center;margin:0;font-size:12px;border-bottom:1px dashed #999;"><span style="display:inline-block;width:8px;height:8px;background:${color};border-radius:50%;margin-right:5px;flex:0 0 auto;"></span><span style="color:${color}">${text}</span></div>`;

    let html = `<div style="background:${bg};color:${fg};padding:8px;border-radius:4px;border:1px solid ${fg};box-shadow:0 2px 10px rgba(0,0,0,0.18);white-space:nowrap;">`;
    html += `<div style="font-weight:bold;font-size:12px;color:${fg};border-bottom:1px dashed #999;">${dateLabel}</div>`;

    if (uc.hasPeakValley) {
      const total = (Number(data.tip[index]) || 0) + (Number(data.peak[index]) || 0)
        + (Number(data.normal[index]) || 0) + (Number(data.valley[index]) || 0);
      if (total > 0) {
        html += row(this.colorNum, `${uc.totalUsageLabel}: <strong>${total.toFixed(2)} ${uc.usageUnit}</strong>`);
      }
      [
        { name: '尖时段', color: '#FF5252', value: data.tip[index], unit: uc.usageUnit },
        { name: '峰时段', color: '#FF9800', value: data.peak[index], unit: uc.usageUnit },
        { name: '平时段', color: '#4CAF50', value: data.normal[index], unit: uc.usageUnit },
        { name: '谷时段', color: '#00BCD4', value: data.valley[index], unit: uc.usageUnit },
        { name: `日${uc.typeLabel}`, color: this.colorCost, value: data.cost[index], unit: '元' }
      ].forEach((info) => {
        const value = Number(info.value) || 0;
        if (value !== 0 || info.unit === '元') {
          html += row(info.color, `${info.name}: <strong>${value.toFixed(2)} ${info.unit}</strong>`);
        }
      });
    } else {
      const gasValue = Number(data.gas[index]) || 0;
      if (gasValue > 0) {
        html += row(uc.barColor, `${uc.usageLabel}: <strong>${gasValue.toFixed(2)} ${uc.usageUnit}</strong>`);
      }
      const costValue = Number(data.cost[index]) || 0;
      if (costValue > 0) {
        html += row(this.colorCost, `日${uc.costSeriesName}: <strong>${costValue.toFixed(2)} 元</strong>`);
      }
    }

    return html + '</div>';
  }

  /* 把 [{x:月份索引, y:值}] 展开成 12 个月定长数组 */
  _monthsToSlots(list) {
    const arr = new Array(12).fill(0);
    (list || []).forEach((item) => {
      if (!item) return;
      const i = Math.round(Number(item.x));
      if (i >= 0 && i < 12) arr[i] = Number(item.y) || 0;
    });
    return arr;
  }

  /* 构建"月"图表数据模型（自绘 Canvas） */
  _buildMonthChartModel(data) {
    const theme = this._evaluateTheme();
    const uc = this._getUC();
    const colorCost = this.colorCost;
    const maxOf = (arr) => (arr && arr.length ? Math.max(...arr) : 0);

    const currentTotal = this._monthsToSlots(data.total);
    const currentCost = this._monthsToSlots(data.cost);
    const lastYearTotal = this._monthsToSlots(data.lasttotal);
    const lastYearCost = this._monthsToSlots(data.lastcost);

    const maxTotal = maxOf(currentTotal);
    const maxIndex = currentTotal.indexOf(maxTotal);

    // 左侧一组 = 上年，右侧一组 = 本年
    const groups = [];
    const lines = [];

    if (uc.hasPeakValley) {
      // ===== 电费：上年/本年各一组尖峰平谷堆叠柱 =====
      groups.push({
        series: [
          { name: '上年谷', color: '#00BCD440', values: this._monthsToSlots(data.lastvalley) },
          { name: '上年平', color: '#4CAF5040', values: this._monthsToSlots(data.lastnormal) },
          { name: '上年峰', color: '#FF980040', values: this._monthsToSlots(data.lastpeak) },
          { name: '上年尖', color: '#FF525240', values: this._monthsToSlots(data.lasttip) }
        ]
      });
      groups.push({
        series: [
          { name: '本年谷', color: '#00BCD4', values: this._monthsToSlots(data.valley) },
          { name: '本年平', color: '#4CAF50', values: this._monthsToSlots(data.normal) },
          { name: '本年峰', color: '#FF9800', values: this._monthsToSlots(data.peak) },
          { name: '本年尖', color: '#FF5252', values: this._monthsToSlots(data.tip) }
        ]
      });
      lines.push({ name: `上年${uc.typeLabel}`, color: '#f3066040', values: lastYearCost, groupIndex: 0, width: 2 });
      lines.push({ name: `本年${uc.typeLabel}`, color: colorCost, values: currentCost, groupIndex: 1, width: 2 });
    } else {
      // ===== 水费/燃气：上年/本年各一根柱 =====
      groups.push({
        series: [{ name: uc.lastUsageSeriesName, color: uc.barColorLast || (uc.barColor + '80'), values: this._monthsToSlots(data.lastgas) }]
      });
      groups.push({
        series: [{ name: uc.thisUsageSeriesName, color: uc.barColor, values: this._monthsToSlots(data.gas) }]
      });
      lines.push({ name: uc.lastCostSeriesName, color: '#f3066040', values: lastYearCost, groupIndex: 0, width: 2 });
      lines.push({ name: uc.thisCostSeriesName, color: colorCost, values: currentCost, groupIndex: 1, width: 2 });
    }

    return {
      theme: theme,
      fg: theme === 'light' ? 'rgb(0, 0, 0)' : 'rgb(255, 255, 255)',
      slotCount: 12,
      slotLabel: (i) => `${i + 1}月`,
      legend: true,
      groups: groups,
      lines: lines,
      marker: maxTotal > 0 ? {
        slot: maxIndex, value: maxTotal, text: `${maxTotal.toFixed(2)}${uc.usageUnit}`,
        color: this.colorNum, groupIndex: 1
      } : null,
      yMax: Math.max(maxTotal, maxOf(currentCost), maxOf(lastYearTotal), maxOf(lastYearCost)) * 1.15,
      tooltip: (i) => this._buildMonthTooltip(data, i)
    };
  }

  /* 构建"月"图表浮层内容 */
  _buildMonthTooltip(data, index) {
    const theme = this._evaluateTheme();
    const fg = theme === 'light' ? 'rgb(0, 0, 0)' : 'rgb(255, 255, 255)';
    const bg = theme === 'light' ? 'rgb(255, 255, 255)' : 'rgb(50, 50, 50)';
    const uc = this._getUC();
    const monthLabel = `${new Date().getFullYear()}-${String(index + 1).padStart(2, '0')}`;
    const monthValue = (list) => {
      const item = (list || []).find((it) => Math.round(Number(it.x)) === index);
      return item ? (Number(item.y) || 0) : 0;
    };
    const sumMonths = (keys) => keys.reduce((sum, key) => sum + monthValue(data[key]), 0);

    const row = (color, text) => `<div style="display:flex;align-items:center;margin:0;font-size:12px;border-bottom:1px dashed #999;"><span style="display:inline-block;width:8px;height:8px;background:${color};border-radius:50%;margin-right:5px;flex:0 0 auto;"></span><span style="color:${color}">${text}</span></div>`;

    let html = `<div style="background:${bg};color:${fg};padding:8px;border-radius:4px;border:1px solid ${fg};box-shadow:0 2px 10px rgba(0,0,0,0.18);white-space:nowrap;">`;
    html += `<div style="font-weight:bold;font-size:12px;color:${fg};border-bottom:1px dashed #999;">${monthLabel}</div>`;

    if (uc.hasPeakValley) {
      const lastTotal = sumMonths(['lasttip', 'lastpeak', 'lastnormal', 'lastvalley']);
      const currentTotal = sumMonths(['tip', 'peak', 'normal', 'valley']);
      if (lastTotal > 0) {
        html += row('#f85000', `${uc.lastYearUsageLabel}: <strong>${lastTotal.toFixed(2)} ${uc.usageUnit}</strong>`);
      }
      if (currentTotal > 0) {
        html += row(this.colorNum, `${uc.thisYearUsageLabel}: <strong>${currentTotal.toFixed(2)} ${uc.usageUnit}</strong>`);
      }
      [
        { name: '上年尖', color: '#FF525240', key: 'lasttip', unit: uc.usageUnit },
        { name: '上年峰', color: '#FF980040', key: 'lastpeak', unit: uc.usageUnit },
        { name: '上年平', color: '#4CAF5040', key: 'lastnormal', unit: uc.usageUnit },
        { name: '上年谷', color: '#00BCD440', key: 'lastvalley', unit: uc.usageUnit },
        { name: `上年${uc.typeLabel}`, color: '#f3066040', key: 'lastcost', unit: '元' },
        { name: '本年尖', color: '#FF5252', key: 'tip', unit: uc.usageUnit },
        { name: '本年峰', color: '#FF9800', key: 'peak', unit: uc.usageUnit },
        { name: '本年平', color: '#4CAF50', key: 'normal', unit: uc.usageUnit },
        { name: '本年谷', color: '#00BCD4', key: 'valley', unit: uc.usageUnit },
        { name: `本年${uc.typeLabel}`, color: this.colorCost, key: 'cost', unit: '元' }
      ].forEach((info) => {
        const value = monthValue(data[info.key]);
        if (value !== 0 || info.unit === '元') {
          html += row(info.color, `${info.name}: <strong>${value.toFixed(2)} ${info.unit}</strong>`);
        }
      });
    } else {
      [
        { name: uc.lastUsageSeriesName, color: uc.barColorLast || (uc.barColor + '80'), value: monthValue(data.lastgas), unit: uc.usageUnit },
        { name: uc.thisUsageSeriesName, color: uc.barColor, value: monthValue(data.gas), unit: uc.usageUnit },
        { name: uc.lastCostSeriesName, color: '#f3066040', value: monthValue(data.lastcost), unit: '元' },
        { name: uc.thisCostSeriesName, color: this.colorCost, value: monthValue(data.cost), unit: '元' }
      ].forEach((info) => {
        const value = Number(info.value) || 0;
        if (value !== 0 || info.unit === '元') {
          html += row(info.color, `${info.name}: <strong>${value.toFixed(2)} ${info.unit}</strong>`);
        }
      });
    }

    return html + '</div>';
  }

  /*获取当前月份的字符串格式 (YYYY-MM)*/
  getCurrentMonth() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    return `${year}-${month}`;
  }

  /*处理跨年的情况，如1月份的上个月是上一年的12月*/
  getPreviousMonth() {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    if (month === 0) {
      return `${year - 1}-12`;
    }
    return `${year}-${String(month).padStart(2, '0')}`;
  }

  /*分析最近3个月的用电数据，根据尖平谷的用电量判断有哪些类型在使用*/
  getElectricityType(monthList) {
    const uc = this._getUC();
    if (!uc.hasPeakValley) {
      // 水费/燃气无尖峰平谷，返回single类型
      return ['single'];
    }
    const types = this._calcElectricityTypes(monthList, 'month');
    return types;
  }

  /* 根据用电数据计算存在的用电类型（尖/峰/平/谷）*/
  _calcElectricityTypes(list, prefix) {
    if (!list || list.length === 0) return null;
    
    const fieldMap = {
      month: { tip: 'monthTPq', peak: 'monthPPq', normal: 'monthNPq', valley: 'monthVPq', key: 'month' },
      year:  { tip: 'yearTPq',  peak: 'yearPPq',  normal: 'yearNPq',  valley: 'yearVPq',  key: 'year' }
    };
    const fields = fieldMap[prefix] || fieldMap.month;
    
    // 月度取最近3个月，年度只取本年度
    let items;
    if (prefix === 'year') {
      const currentYear = new Date().getFullYear().toString();
      items = list.filter(item => String(item[fields.key]) === currentYear);
    } else {
      items = list.slice(0, 3);
    }
    
    if (items.length === 0) return null;
    
    const totals = { tip: 0, peak: 0, normal: 0, valley: 0 };
    items.forEach(item => {
      totals.tip += item[fields.tip] || 0;
      totals.peak += item[fields.peak] || 0;
      totals.normal += item[fields.normal] || 0;
      totals.valley += item[fields.valley] || 0;
    });
    
    const types = [];
    if (totals.tip > 0) types.push('tip');
    if (totals.peak > 0) types.push('peak');
    if (totals.normal > 0) types.push('normal');
    if (totals.valley > 0) types.push('valley');
    
    return types.length > 0 ? types : null;
  }

  /* 根据计费标准和用电类型获取对应的价格信息
   * 电费支持6种不同的计费标准：年阶梯峰平谷、年阶梯、月阶梯峰平谷、月阶梯峰平谷变动价格、月阶梯、平均单价
   * 水费/燃气仅支持年阶梯和平均单价*/
  getElectricityPrices(billingStandard, currentLevel, electricityTypes) {
    // 使用选中的余额实体而不是固定的this.entity
    const selectedEntityId = this._selectedBalanceEntity;
    if (!selectedEntityId || !this.hass || !this.hass.states[selectedEntityId]) {
      return {};
    }
    
    const selectedEntity = this.hass.states[selectedEntityId];
    const prices = {};
    const uc = this._getUC();

    // 水费/燃气：仅支持年阶梯和平均单价
    if (!uc.hasPeakValley) {
      if (!electricityTypes || electricityTypes.length === 0) return prices;
      electricityTypes.forEach(type => {
        switch (billingStandard) {
          case '年阶梯':
            prices.single = selectedEntity.attributes.计费标准[`年阶梯第${currentLevel}档${uc.priceKey}`];
            break;
          case '平均单价':
            prices.single = selectedEntity.attributes.计费标准.平均单价;
            break;
        }
      });
      Object.keys(prices).forEach(key => {
        if (prices[key] === undefined || prices[key] === null) delete prices[key];
      });
      return prices;
    }

    // 电费：支持全部计费标准
    // 不分尖峰平谷的计费标准，不依赖 electricityTypes
    if (billingStandard === '年阶梯') {
      prices.single = selectedEntity.attributes.计费标准[`年阶梯第${currentLevel}档电价`];
      return prices;
    }
    if (billingStandard === '月阶梯') {
      prices.single = selectedEntity.attributes.计费标准[`月阶梯第${currentLevel}档电价`];
      return prices;
    }
    if (billingStandard === '平均单价') {
      prices.single = selectedEntity.attributes.计费标准.平均单价;
      return prices;
    }
    
    // 尖峰平谷类计费标准，需要 electricityTypes
    if (!electricityTypes || electricityTypes.length === 0) return prices;
    
    electricityTypes.forEach(type => {
      switch (billingStandard) {
        case '年阶梯峰平谷':
          if (type === 'tip') prices.tip = selectedEntity.attributes.计费标准[`年阶梯第${currentLevel}档尖电价`];
          if (type === 'peak') prices.peak = selectedEntity.attributes.计费标准[`年阶梯第${currentLevel}档峰电价`];
          if (type === 'normal') prices.normal = selectedEntity.attributes.计费标准[`年阶梯第${currentLevel}档平电价`];
          if (type === 'valley') prices.valley = selectedEntity.attributes.计费标准[`年阶梯第${currentLevel}档谷电价`];
          break;
        case '月阶梯峰平谷':
          if (type === 'tip') prices.tip = selectedEntity.attributes.计费标准[`月阶梯第${currentLevel}档尖电价`];
          if (type === 'peak') prices.peak = selectedEntity.attributes.计费标准[`月阶梯第${currentLevel}档峰电价`];
          if (type === 'normal') prices.normal = selectedEntity.attributes.计费标准[`月阶梯第${currentLevel}档平电价`];
          if (type === 'valley') prices.valley = selectedEntity.attributes.计费标准[`月阶梯第${currentLevel}档谷电价`];
          break;
        case '月阶梯峰平谷变动价格':
          if (type === 'tip') prices.tip = selectedEntity.attributes.计费标准[`月阶梯第${currentLevel}档尖电价`];
          if (type === 'peak') prices.peak = selectedEntity.attributes.计费标准[`月阶梯第${currentLevel}档峰电价`];
          if (type === 'normal') prices.normal = selectedEntity.attributes.计费标准[`月阶梯第${currentLevel}档平电价`];
          if (type === 'valley') {
            const currentMonth = new Date().getMonth() + 1;
            const monthKey = `${currentMonth}月`;
            prices.valley = selectedEntity.attributes.计费标准[`${monthKey}阶梯第${currentLevel}档谷电价`];
          }
          break;
      }
    });
    
    // 过滤掉 undefined 值
    Object.keys(prices).forEach(key => {
      if (prices[key] === undefined || prices[key] === null) delete prices[key];
    });
    
    return prices;
  }

  /*从月度用电数据列表中查找指定月份的数据 */
  getMonthUsage(monthList, targetMonth) {
    if (!monthList) return null;
    return monthList.find(item => item.month === targetMonth);
  }

  /*从年度用电数据列表中查找指定年份的数据*/
  getYearUsage(yearList, targetYear) {
    if (!yearList) return null;
    return yearList.find(item => item.year === targetYear.toString());
  }

 /*渲染日度条形图*/
  renderDayBar(usage) {
    const theme = this._evaluateTheme();
    const Color = theme === 'light' ? 'rgb(0, 0, 0)' : 'rgb(255, 255, 255)';
    const Shadow = theme === 'light' ? '0 1px 2px rgba(255, 255, 255, 0.3)' : '0 1px 2px rgba(47, 45, 45, 0.6)';
    const uc = this._getUC();

    if (uc.hasPeakValley) {
      // ===== 电费：尖峰平谷条形图 =====
      const total = usage.dayTPq + usage.dayPPq + usage.dayNPq + usage.dayVPq;
      if (total === 0) return '';
      const tipPercent = (usage.dayTPq / total) * 100;
      const peakPercent = (usage.dayPPq / total) * 100;
      const normalPercent = (usage.dayNPq / total) * 100;
      const valleyPercent = (usage.dayVPq / total) * 100;

      const segments = [];
      if (usage.dayTPq > 0) segments.push(html`<div class="usage-bar-segment tip" style="width: ${tipPercent}%"></div>`);
      if (usage.dayPPq > 0) segments.push(html`<div class="usage-bar-segment peak" style="width: ${peakPercent}%"></div>`);
      if (usage.dayNPq > 0) segments.push(html`<div class="usage-bar-segment normal" style="width: ${normalPercent}%"></div>`);
      if (usage.dayVPq > 0) segments.push(html`<div class="usage-bar-segment valley" style="width: ${valleyPercent}%"></div>`);

      const texts = [];
      if (usage.dayTPq > 0) texts.push(html`<div class="usage-bar-text tip" style="color: ${Color}; text-shadow: ${Shadow}; --tip-width: ${tipPercent}%; left: 0;">${usage.dayTPq}</div>`);
      if (usage.dayPPq > 0) texts.push(html`<div class="usage-bar-text peak" style="color: ${Color}; text-shadow: ${Shadow}; --tip-width: ${tipPercent}%; --peak-width: ${peakPercent}%; left: calc(${tipPercent}%);">${usage.dayPPq}</div>`);
      if (usage.dayNPq > 0) texts.push(html`<div class="usage-bar-text normal" style="color: ${Color}; text-shadow: ${Shadow}; --tip-width: ${tipPercent}%; --peak-width: ${peakPercent}%; --normal-width: ${normalPercent}%; left: calc(${tipPercent}% + ${peakPercent}%);">${usage.dayNPq}</div>`);
      if (usage.dayVPq > 0) texts.push(html`<div class="usage-bar-text valley" style="color: ${Color}; text-shadow: ${Shadow}; --tip-width: ${tipPercent}%; --peak-width: ${peakPercent}%; --normal-width: ${normalPercent}%; --valley-width: ${valleyPercent}%; left: calc(${tipPercent}% + ${peakPercent}% + ${normalPercent}%);">${usage.dayVPq}</div>`);

      const labels = [];
      if (usage.dayTPq > 0) labels.push(html`<div class="usage-label tip" style="color: ${Color}; text-shadow: ${Shadow};--tip-width: ${tipPercent}%; left: 0;">尖</div>`);
      if (usage.dayPPq > 0) labels.push(html`<div class="usage-label peak" style="color: ${Color}; text-shadow: ${Shadow};--tip-width: ${tipPercent}%; --peak-width: ${peakPercent}%; left: calc(${tipPercent}%);">峰</div>`);
      if (usage.dayNPq > 0) labels.push(html`<div class="usage-label normal" style="color: ${Color}; text-shadow: ${Shadow};--tip-width: ${tipPercent}%; --peak-width: ${peakPercent}%; --normal-width: ${normalPercent}%; left: calc(${tipPercent}% + ${peakPercent}%);">平</div>`);
      if (usage.dayVPq > 0) labels.push(html`<div class="usage-label valley" style="color: ${Color}; text-shadow: ${Shadow};--tip-width: ${tipPercent}%; --peak-width: ${peakPercent}%; --normal-width: ${normalPercent}%; --valley-width: ${valleyPercent}%; left: calc(${tipPercent}% + ${peakPercent}% + ${normalPercent}%);">谷</div>`);

      return html`
        <div class="usage-bar">
          <div class="usage-bar-fill">
            ${segments}
            ${texts}
          </div>
        </div>
        <div class="usage-labels">${labels}</div>
      `;
    } else {
      // ===== 水费/燃气：单色条形图 =====
      const total = usage.dayEleNum || 0;
      if (total === 0) return '';
      return html`
        <div class="usage-bar">
          <div class="usage-bar-fill">
            <div class="usage-bar-segment normal" style="width: 100%; background-color: ${uc.barColor || '#4caf50'}"></div>
            <div class="usage-bar-text normal" style="color: ${Color}; text-shadow: ${Shadow};--normal-width: 100%; left: 0;">${total} ${uc.usageUnit}</div>
          </div>
        </div>
        <div class="usage-labels">
          <div class="usage-label normal" style="color: ${Color}; text-shadow: ${Shadow};--normal-width: 100%; left: 0;"> </div>
        </div>
      `;
    }
  }

  /*渲染月度条形图*/
  renderUsageBar(usage) {
    const theme = this._evaluateTheme();
    const Color = theme === 'light' ? 'rgb(0, 0, 0)' : 'rgb(255, 255, 255)';
    const Shadow = theme === 'light' ? '0 1px 2px rgba(255, 255, 255, 0.3)' : '0 1px 2px rgba(50, 50, 50, 0.6)';
    const uc = this._getUC();

    if (uc.hasPeakValley) {
      // ===== 电费：尖峰平谷条形图 =====
      const total = usage.monthTPq + usage.monthPPq + usage.monthNPq + usage.monthVPq;
      if (total === 0) return '';
      const tipPercent = (usage.monthTPq / total) * 100;
      const peakPercent = (usage.monthPPq / total) * 100;
      const normalPercent = (usage.monthNPq / total) * 100;
      const valleyPercent = (usage.monthVPq / total) * 100;

      const segments = [];
      if (usage.monthTPq > 0) segments.push(html`<div class="usage-bar-segment tip" style="width: ${tipPercent}%"></div>`);
      if (usage.monthPPq > 0) segments.push(html`<div class="usage-bar-segment peak" style="width: ${peakPercent}%"></div>`);
      if (usage.monthNPq > 0) segments.push(html`<div class="usage-bar-segment normal" style="width: ${normalPercent}%"></div>`);
      if (usage.monthVPq > 0) segments.push(html`<div class="usage-bar-segment valley" style="width: ${valleyPercent}%"></div>`);

      const texts = [];
      if (usage.monthTPq > 0) texts.push(html`<div class="usage-bar-text tip" style="color: ${Color}; text-shadow: ${Shadow};--tip-width: ${tipPercent}%; left: 0;">${usage.monthTPq}</div>`);
      if (usage.monthPPq > 0) texts.push(html`<div class="usage-bar-text peak" style="color: ${Color}; text-shadow: ${Shadow};--tip-width: ${tipPercent}%; --peak-width: ${peakPercent}%; left: calc(${tipPercent}%);">${usage.monthPPq}</div>`);
      if (usage.monthNPq > 0) texts.push(html`<div class="usage-bar-text normal" style="color: ${Color}; text-shadow: ${Shadow};--tip-width: ${tipPercent}%; --peak-width: ${peakPercent}%; --normal-width: ${normalPercent}%; left: calc(${tipPercent}% + ${peakPercent}%);">${usage.monthNPq}</div>`);
      if (usage.monthVPq > 0) texts.push(html`<div class="usage-bar-text valley" style="color: ${Color}; text-shadow: ${Shadow};--tip-width: ${tipPercent}%; --peak-width: ${peakPercent}%; --normal-width: ${normalPercent}%; --valley-width: ${valleyPercent}%; left: calc(${tipPercent}% + ${peakPercent}% + ${normalPercent}%);">${usage.monthVPq}</div>`);

      const labels = [];
      if (usage.monthTPq > 0) labels.push(html`<div class="usage-label tip" style="color: ${Color}; text-shadow: ${Shadow};--tip-width: ${tipPercent}%; left: 0;">尖</div>`);
      if (usage.monthPPq > 0) labels.push(html`<div class="usage-label peak" style="color: ${Color}; text-shadow: ${Shadow};--tip-width: ${tipPercent}%; --peak-width: ${peakPercent}%; left: calc(${tipPercent}%);">峰</div>`);
      if (usage.monthNPq > 0) labels.push(html`<div class="usage-label normal" style="color: ${Color}; text-shadow: ${Shadow};--tip-width: ${tipPercent}%; --peak-width: ${peakPercent}%; --normal-width: ${normalPercent}%; left: calc(${tipPercent}% + ${peakPercent}%);">平</div>`);
      if (usage.monthVPq > 0) labels.push(html`<div class="usage-label valley" style="color: ${Color}; text-shadow: ${Shadow};--tip-width: ${tipPercent}%; --peak-width: ${peakPercent}%; --normal-width: ${normalPercent}%; --valley-width: ${valleyPercent}%; left: calc(${tipPercent}% + ${peakPercent}% + ${normalPercent}%);">谷</div>`);

      return html`
        <div class="usage-bar">
          <div class="usage-bar-fill">
            ${segments}
            ${texts}
          </div>
        </div>
        <div class="usage-labels">${labels}</div>
      `;
    } else {
      // ===== 水费/燃气：单色条形图 =====
      const total = usage.monthEleNum || 0;
      if (total === 0) return '';
      return html`
        <div class="usage-bar">
          <div class="usage-bar-fill">
            <div class="usage-bar-segment normal" style="width: 100%; background-color: ${uc.barColor || '#4caf50'}"></div>
            <div class="usage-bar-text normal" style="color: ${Color}; text-shadow: ${Shadow};--normal-width: 100%; left: 0;">${total} ${uc.usageUnit}</div>
          </div>
        </div>
        <div class="usage-labels">
          <div class="usage-label normal" style="color: ${Color}; text-shadow: ${Shadow};--normal-width: 100%; left: 0;"> </div>
        </div>
      `;
    }
  }

  /*渲染年度条形图*/
  renderYearUsageBar(usage) {
    const theme = this._evaluateTheme();
    const Color = theme === 'light' ? 'rgb(0, 0, 0)' : 'rgb(255, 255, 255)';
    const Shadow = theme === 'light' ? '0 1px 2px rgba(255, 255, 255, 0.3)' : '0 1px 2px rgba(50, 50, 50, 0.6)';
    const uc = this._getUC();

    if (uc.hasPeakValley) {
      // ===== 电费：尖峰平谷条形图 =====
      const total = usage.yearTPq + usage.yearPPq + usage.yearNPq + usage.yearVPq;
      if (total === 0) return '';
      const tipPercent = (usage.yearTPq / total) * 100;
      const peakPercent = (usage.yearPPq / total) * 100;
      const normalPercent = (usage.yearNPq / total) * 100;
      const valleyPercent = (usage.yearVPq / total) * 100;

      const segments = [];
      if (usage.yearTPq > 0) segments.push(html`<div class="usage-bar-segment tip" style="width: ${tipPercent}%"></div>`);
      if (usage.yearPPq > 0) segments.push(html`<div class="usage-bar-segment peak" style="width: ${peakPercent}%"></div>`);
      if (usage.yearNPq > 0) segments.push(html`<div class="usage-bar-segment normal" style="width: ${normalPercent}%"></div>`);
      if (usage.yearVPq > 0) segments.push(html`<div class="usage-bar-segment valley" style="width: ${valleyPercent}%"></div>`);

      const texts = [];
      if (usage.yearTPq > 0) texts.push(html`<div class="usage-bar-text tip" style="color: ${Color}; text-shadow: ${Shadow};--tip-width: ${tipPercent}%; left: 0;">${usage.yearTPq}</div>`);
      if (usage.yearPPq > 0) texts.push(html`<div class="usage-bar-text peak" style="color: ${Color}; text-shadow: ${Shadow};--tip-width: ${tipPercent}%; --peak-width: ${peakPercent}%; left: calc(${tipPercent}%);">${usage.yearPPq}</div>`);
      if (usage.yearNPq > 0) texts.push(html`<div class="usage-bar-text normal" style="color: ${Color}; text-shadow: ${Shadow};--tip-width: ${tipPercent}%; --peak-width: ${peakPercent}%; --normal-width: ${normalPercent}%; left: calc(${tipPercent}% + ${peakPercent}%);">${usage.yearNPq}</div>`);
      if (usage.yearVPq > 0) texts.push(html`<div class="usage-bar-text valley" style="color: ${Color}; text-shadow: ${Shadow};--tip-width: ${tipPercent}%; --peak-width: ${peakPercent}%; --normal-width: ${normalPercent}%; --valley-width: ${valleyPercent}%; left: calc(${tipPercent}% + ${peakPercent}% + ${normalPercent}%);">${usage.yearVPq}</div>`);

      const labels = [];
      if (usage.yearTPq > 0) labels.push(html`<div class="usage-label tip" style="color: ${Color}; text-shadow: ${Shadow};--tip-width: ${tipPercent}%; left: 0;">尖</div>`);
      if (usage.yearPPq > 0) labels.push(html`<div class="usage-label peak" style="color: ${Color}; text-shadow: ${Shadow};--tip-width: ${tipPercent}%; --peak-width: ${peakPercent}%; left: calc(${tipPercent}%);">峰</div>`);
      if (usage.yearNPq > 0) labels.push(html`<div class="usage-label normal" style="color: ${Color}; text-shadow: ${Shadow};--tip-width: ${tipPercent}%; --peak-width: ${peakPercent}%; --normal-width: ${normalPercent}%; left: calc(${tipPercent}% + ${peakPercent}%);">平</div>`);
      if (usage.yearVPq > 0) labels.push(html`<div class="usage-label valley" style="color: ${Color}; text-shadow: ${Shadow};--tip-width: ${tipPercent}%; --peak-width: ${peakPercent}%; --normal-width: ${normalPercent}%; --valley-width: ${valleyPercent}%; left: calc(${tipPercent}% + ${peakPercent}% + ${normalPercent}%);">谷</div>`);

      return html`
        <div class="usage-bar">
          <div class="usage-bar-fill">
            ${segments}
            ${texts}
          </div>
        </div>
        <div class="usage-labels">${labels}</div>
      `;
    } else {
      // ===== 水费/燃气：单色条形图 =====
      const total = usage.yearEleNum || 0;
      if (total === 0) return '';
      return html`
        <div class="usage-bar">
          <div class="usage-bar-fill">
            <div class="usage-bar-segment normal" style="width: 100%; background-color: ${uc.barColor || '#4caf50'}"></div>
            <div class="usage-bar-text normal" style="color: ${Color}; text-shadow: ${Shadow};--normal-width: 100%; left: 0;">${total} ${uc.usageUnit}</div>
          </div>
        </div>
        <div class="usage-labels">
          <div class="usage-label normal" style="color: ${Color}; text-shadow: ${Shadow};--normal-width: 100%; left: 0;"> </div>
        </div>
      `;
    }
  }

  /*渲染价格区块*/
  renderPriceBlock(prices) {
    if (!prices || Object.keys(prices).length === 0) return '';
    
    // 不分尖峰平谷：只显示单价
    if (prices.single) {
      return html`<div class="price-item-block">单价：${prices.single}</div>`;
    }
    
    // 尖峰平谷：只显示有值的项
    return html`
      ${prices.tip ? html`<div class="price-item-block">尖单价：${prices.tip}</div>` : ''}
      ${prices.peak ? html`<div class="price-item-block">峰单价：${prices.peak}</div>` : ''}
      ${prices.normal ? html`<div class="price-item-block">平单价：${prices.normal}</div>` : ''}
      ${prices.valley ? html`<div class="price-item-block">谷单价：${prices.valley}</div>` : ''}
    `;
  }

  /*按钮功能函数 - 电费日历*/
  showCalendar() {
    this.showPanel = this.showPanel === 'calendar' ? '' : 'calendar';
    this.updateDayData();
    this.requestUpdate();
    this._handleClick();
  }

  /*按钮功能函数 - 日用电：只切换面板，图表在 updated() 中绘制，确保 DOM 已就绪*/
  showDayUsage() {
    this.showPanel = this.showPanel === 'dayUsage' ? '' : 'dayUsage';
    this.requestUpdate();
    this._handleClick();
  }

  /*按钮功能函数 - 月用电*/
  showMonthUsage() {
    this.showPanel = this.showPanel === 'monthUsage' ? '' : 'monthUsage';
    this.requestUpdate();
    this._handleClick();
  }

  /*按钮功能函数 - 充值记录*/
  showRecharge() {
    this.showPanel = this.showPanel === 'recharge' ? '' : 'recharge';
    this.requestUpdate();
    this._handleClick();
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

  /*日历功能函数*/
  updateDayData() {
    // 使用选中的余额实体而不是固定的this.entity
    const selectedEntityId = this._selectedBalanceEntity;
    if (this.hass && selectedEntityId) {
      const entityObj = this.hass.states[selectedEntityId];
      if (entityObj && entityObj.attributes) {
        const uc = this._getUC();
        if (entityObj.attributes.daylist) {
          this.dayData = entityObj.attributes.daylist.map(item => normalizeDayItem(item, uc));
        } else {
          this.dayData = [];
        }
        const monthlistSource = buildMonthlistFromSummary(entityObj.attributes, uc);
        if (monthlistSource && monthlistSource.length > 0) {
          const monthStr = `${this.year}-${this.month.toString().padStart(2, '0')}`;
          this.monthData = monthlistSource.find(item => item.month === monthStr);
        } else {
          this.monthData = null;
        }
      } else {
        this.dayData = [];
        this.monthData = null;
      }
    }
  }

  getDayData(year, month, day) {
    if (!this.dayData || this.dayData.length === 0) return null;
    const dateStr = `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
    return this.dayData.find(item => item.day === dateStr);
  }

  getMinMaxUsageDays() {
    if (!this.dayData || this.dayData.length === 0) return { minDays: [], maxDays: [] };
    const monthStr = `${this.year}-${this.month.toString().padStart(2, '0')}`;
    const monthDays = this.dayData.filter(item => item.day.startsWith(monthStr));
    if (monthDays.length === 0) return { minDays: [], maxDays: [] };
    const validDays = monthDays.filter(day => day.dayEleNum !== undefined && day.dayEleNum !== null);
    if (validDays.length === 0) return { minDays: [], maxDays: [] };
    const minUsage = Math.min(...validDays.map(day => parseFloat(day.dayEleNum)));
    const maxUsage = Math.max(...validDays.map(day => parseFloat(day.dayEleNum)));
    const minDays = validDays
        .filter(day => parseFloat(day.dayEleNum) === minUsage)
        .map(day => parseInt(day.day.split('-')[2], 10).toString());
    const maxDays = validDays
        .filter(day => parseFloat(day.dayEleNum) === maxUsage)
        .map(day => parseInt(day.day.split('-')[2], 10).toString());
    return { minDays, maxDays };
  }


  getDaysInMonth(year, month) {
    return new Date(year, month, 0).getDate();
  }

  prevYear() {
    this.year--;
    this.updateDayData();
    this.requestUpdate();
    this._handleClick();
  }

  nextYear() {
    this.year++;
    this.updateDayData();
    this.requestUpdate();
    this._handleClick();
  }

  prevMonth() {
    if (this.month === 1) {
      this.month = 12;
      this.year--;
    } else {
      this.month--;
    }
    this.updateDayData();
    this.requestUpdate();
    this._handleClick();
  }

  nextMonth() {
    if (this.month === 12) {
      this.month = 1;
      this.year++;
    } else {
      this.month++;
    }
    this.updateDayData();
    this.requestUpdate();
    this._handleClick();
  }

  goToToday() {
    const today = new Date();
    this.year = today.getFullYear();
    this.month = today.getMonth() + 1;
    this.updateDayData();
    this.requestUpdate();
    this._handleClick();
  }

  renderChartDay() {

    const data = this._processedDayData;
    const theme = this._evaluateTheme();
    const backgColor = theme === 'light' ? 'rgb(255, 255, 255)' : 'rgb(50, 50, 50)';
    const textColor = theme === 'light' ? 'rgba(0, 0, 0, 0.7)' : 'rgba(255, 255, 255, 0.7)';
    return html`
      <ha-card class="card-chart" style="; height: 320px; background: ${backgColor};">
        <div class="label label1">
          <div class="value" style="color: ${this.colorNum}">${data ? data.current.ele.toFixed(2) : '0.00'}
               <span class="unit"  style="color: ${textColor}">${this._getUC().usageUnit}</span>
          </div>
          <div class="title" style="color: ${textColor}">${this._getUC().dayUsageLabel}</div>
        </div>

        <div class="label label2">
          <div class="value" style="color: ${this.colorCost}">${data ? data.current.cost.toFixed(2) : '0.00'}
               <span class="unit" style="color: ${textColor}">元</span>
          </div>
          <div class="title" style="color: ${textColor}">${this._getUC().dayCostLabel}</div>
        </div>

        <div id="chart-container"></div>
      </ha-card>
    `;
  }

  renderChartMonth() {
    const data = this._processedMonthData;
    const theme = this._evaluateTheme();
    const backgColor = theme === 'light' ? 'rgb(255, 255, 255)' : 'rgb(50, 50, 50)';
    const textColor = theme === 'light' ? 'rgba(0, 0, 0, 0.7)' : 'rgba(255, 255, 255, 0.7)';
    return html`
      <ha-card class="card-chart" style="height: 320px; background: ${backgColor};">
        <div class="label label1">
          <div class="value" style="color: ${this.colorNum}">${data ? data.current.ele.toFixed(2) : '0.00'}
               <span class="unit"  style="color: ${textColor}">${this._getUC().usageUnit}</span>
          </div>
          <div class="title" style="color: ${textColor}">${this._getUC().monthUsageLabel}</div>
        </div>

        <div class="label label2">
          <div class="value" style="color: ${this.colorCost}">${data ? data.current.cost.toFixed(2) : '0.00'}
               <span class="unit" style="color: ${textColor}">元</span>
          </div>
          <div class="title" style="color: ${textColor}">${this._getUC().costLabel}金额</div>
        </div>

        <div id="chart-container"></div>
      </ha-card>
    `;
  }

  renderHeader() {
    if (!this.hass) {
      return html`<div>Loading...</div>`;
    };
    
    // 获取主题和颜色
    const theme = this._evaluateTheme();
    const lockWhiteFg = this.config.lock_white_fg === true;
    const fgColor = lockWhiteFg ? 'rgb(255, 255, 255)' : theme === 'light' ? 'rgb(0, 0, 0)' : 'rgb(255, 255, 255)';
    const transparentBg = this.config.transparent_bg === true;
    const bgColor = transparentBg ? 'transparent' : theme === 'light' ? 'rgb(255, 255, 255)' : 'rgb(50, 50, 50)';
    
    // 计算总金额的预警状态
    const totalAmount = this._calculateTotalAmount();
    let totalAmountWarning = false;
    if (this.config.global_warning && this.config.global_warning.trim() !== '') {
      totalAmountWarning = this._evaluateWarningCondition(totalAmount, this.config.global_warning);
    }
    
    // 计算布局相关的CSS变量
    const isHorizontalLayout = this.config.entity_layout === 'horizontal';
    const entitiesPerRow = parseInt(this.config.entities_per_row) || 3;
    const layoutStyle = isHorizontalLayout ? `
      --items-per-row: ${entitiesPerRow};
      --gap-count: ${Math.max(0, entitiesPerRow - 1)};
    ` : '';

    return html`
     ${this._balanceData.length > 1 ? html`
      <div class="card-container" style="width: ${this.config.width};">
        <!-- 信息卡片 -->
        <div class="balance-card" style="--fg-color: ${fgColor}; --bg-color: ${bgColor}; ${layoutStyle}">
          <div class="balance-header">
            <div class="balance-title">
              <span class="balance-indicator" style="background: rgb(0,222,220); animation: pulse 2s infinite"></span>
              ${this.config.balance_name || this._getUC().typeLabel + '信息'}
            </div>
            <div class="balance-count ${totalAmountWarning ? 'warning' : ''}">
              ￥ ${totalAmount} 元
            </div>
          </div>
          
         
            <div class="balance-devices-list ${isHorizontalLayout ? 'horizontal' : ''}">
              ${this._balanceLoading ? 
                html`<div class="balance-loading">加载中...</div>` :
                
                this._balanceData.length === 0 ? 
                  html`<div class="balance-no-devices">请配置实体</div>` :
                  html`
                    ${this._balanceData.map(balanceData => {
                      // 明细预警优先级最高
                      let isWarning = false;
                      
                      // 首先检查明细预警，如果存在且满足条件，直接设为预警状态
                      if (balanceData.warning && balanceData.warning.trim() !== '') {
                        isWarning = this._evaluateWarningCondition(balanceData.value, balanceData.warning); 
                      } else {
                        // 只有在没有明细预警时才检查全局预警
                        if (this.config.global_warning && this.config.global_warning.trim() !== '') {
                          isWarning = this._evaluateWarningCondition(balanceData.value, this.config.global_warning);
                        }
                      }
                      
                      const isSelected = this._selectedBalanceEntity === balanceData.entity_id;
                      
                      return html`
                        <div class="balance-device-item ${isSelected ? 'selected' : ''}" @click=${() => this._handleBalanceEntityClick(balanceData)}>
                          <div class="balance-device-left">
                            <ha-icon class="balance-device-icon" icon="${balanceData.icon}"></ha-icon>
                            <div class="balance-device-name">${balanceData.friendly_name}</div>
                          </div>
                          <div class="balance-device-value ${isWarning ? 'warning' : ''}">
                            ${balanceData.value}
                            <span class="balance-device-unit ${isWarning ? 'warning' : ''}">${balanceData.unit}</span>
                          </div>
                        </div>
                      `;
                    })}
                  `
              }
            </div>
        </div>
      </div>
    ` : ''}
    `;
  }

  renderCalendar() {
    // 使用选中的余额实体而不是固定的this.entity
    const selectedEntityId = this._selectedBalanceEntity;
    if (!selectedEntityId || !this.hass || !this.hass.states[selectedEntityId]) {
      return html`<div style="padding: 20px; text-align: center;">请选择有效的实体</div>`;
    }
    
    const selectedEntity = this.hass.states[selectedEntityId];
    this.updateDayData();
    const theme = this._evaluateTheme();
    const lockWhiteFg = this.config.lock_white_fg === true;
    const transparentBg = this.config.transparent_bg === true;
    const bgColor = transparentBg ? 'transparent' : theme === 'light' ? 'rgb(255, 255, 255)' : 'rgb(50, 50, 50)';
    const fgColor = lockWhiteFg ? 'rgb(255, 255, 255)' : theme === 'light' ? 'rgb(0, 0, 0)' : 'rgb(255, 255, 255)';
    const daysInMonth = this.getDaysInMonth(this.year, this.month);
    const firstDayOfMonth = new Date(this.year, this.month - 1, 1).getDay();
    const adjustedFirstDay = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1;
    const { minDays, maxDays } = this.getMinMaxUsageDays();
    const days = [];
    const weekdayNames = ['一', '二', '三', '四', '五', '六', '日'];
    const yearMonthRow = html` 
      <div class="celltotal nav-button ${this.activeNav === 'yearlast' ? 'active-nav' : ''}" 
           style="grid-area: yearlast;" 
           @click=${this.prevYear}
           @mousedown=${() => this.activeNav = 'yearlast'}
           @mouseup=${() => this.activeNav = ''}
           @mouseleave=${() => this.activeNav = ''}>◀</div>
      <div class="celltotal"
           style="grid-area: year;">${this.year+"年"}</div>
      <div class="celltotal nav-button ${this.activeNav === 'yearnext' ? 'active-nav' : ''}" 
           style="grid-area: yearnext;" 
           @click=${this.nextYear}
           @mousedown=${() => this.activeNav = 'yearnext'}
           @mouseup=${() => this.activeNav = ''}
           @mouseleave=${() => this.activeNav = ''}>▶</div>
      <div class="celltotal today-button"
           style="grid-area: today;" 
           @click=${this.goToToday}>当月</div>
      <div class="celltotal nav-button ${this.activeNav === 'monthlast' ? 'active-nav' : ''}" 
           style="grid-area: monthlast;" 
           @click=${this.prevMonth}
           @mousedown=${() => this.activeNav = 'monthlast'}
           @mouseup=${() => this.activeNav = ''}
           @mouseleave=${() => this.activeNav = ''}>◀</div>
      <div class="celltotal" 
           style="grid-area: month;">${this.month+"月"}</div>
      <div class="celltotal nav-button ${this.activeNav === 'monthnext' ? 'active-nav' : ''}" 
           style="grid-area: monthnext;" 
           @click=${this.nextMonth}
           @mousedown=${() => this.activeNav = 'monthnext'}
           @mouseup=${() => this.activeNav = ''}
           @mouseleave=${() => this.activeNav = ''}>▶</div>
    `;
    const weekdaysRow = weekdayNames.map((day, index) => 
      html`<div class="celltotal weekday" style="grid-area: week${index + 1};">${day}</div>`
    );
    for (let i = 0; i < adjustedFirstDay; i++) {
      if (i==adjustedFirstDay-1){
        days.push(html`<div class="cell month-cell-bottom month-cell-right" style="grid-area: id${i + 1};"></div>`);
      }
      else{
        days.push(html`<div class="cell month-cell-bottom" style="grid-area: id${i + 1};"></div>`);
      }
    }
    for (let i = 1; i <= daysInMonth; i++) {
      const dayData = this.getDayData(this.year, this.month, i);
      const isMinDay = minDays.includes(i.toString());
      const isMaxDay = maxDays.includes(i.toString());
      const dayClass = isMinDay ? 'min-usage' : isMaxDay ? 'max-usage' : '';
      const dayContent = html`
        <div>${i}</div>
        ${dayData ? html`
          <div class="electricity-num" style="color: ${this.colorNum}">${dayData.dayEleNum}${this._getUC().usageUnit === '度' ? '°' : this._getUC().usageUnit}</div>
          <div class="electricity-cost" style="color: ${this.colorCost}">￥${dayData.dayEleCost}</div>
        ` : ''}
      `;
      if(adjustedFirstDay>0 && i>=1 && i<=7-adjustedFirstDay){
        days.push(html`
        <div class="cell month-cell month-cell-top month-day ${dayClass}" 
          style="grid-area: id${i + adjustedFirstDay};">
          ${dayContent}
        </div>
        `);
      }
      else if(adjustedFirstDay==0 && i==1){
        days.push(html`
        <div class="cell month-cell month-cell-top month-cell-left month-day ${dayClass}"\nstyle="grid-area: id${i + adjustedFirstDay};">
          ${dayContent}
        </div>
        `);
      }
      else if(adjustedFirstDay==0 && i>1 && i<=7-adjustedFirstDay){
        days.push(html`
        <div class="cell month-cell month-cell-top month-day ${dayClass}" style="grid-area: id${i + adjustedFirstDay};">
          ${dayContent}
        </div>
        `);
      }
      else if(i==8-adjustedFirstDay || i==15-adjustedFirstDay || i==22-adjustedFirstDay || i==29-adjustedFirstDay || i==36-adjustedFirstDay){
        days.push(html`
        <div class="cell month-cell month-cell-left month-day ${dayClass}" style="grid-area: id${i + adjustedFirstDay};">
          ${dayContent}
        </div>
        `);
      }
      else{
        days.push(html`
        <div class="cell month-cell month-day ${dayClass}" style="grid-area: id${i + adjustedFirstDay};">
          ${dayContent}
        </div>
        `);
      }
    }
    const totalCells = 37;
    for (let i = daysInMonth + adjustedFirstDay + 1; i <= totalCells; i++) {
      days.push(html`<div class="cell" style="grid-area: id${i};"></div>`);
    }
    const bottomRow = html`
      <div class="cell" style="grid-area: id98;"></div>
      <div class="cell summary-info" style="grid-area: id99;">
        ${this.monthData ? html`
          <div><span  style="color: ${this.colorNum}">月${this._getUC().usageLabel.replace('用', '').replace('量', '')}量: ${this.monthData.monthEleNum}${this._getUC().usageUnit}</span></div>
          <div><span  style="color: ${this.colorCost}">月${this._getUC().typeLabel}: ${this.monthData.monthEleCost}元</span></div>
        ` : html`<div></div>`}
      </div>
    `;
    return html`
      <div class="calendar-grid"  style="height: 300px; background-color: ${bgColor}; color: ${fgColor}; ">
        ${yearMonthRow}
        ${weekdaysRow}
        ${days}
        ${bottomRow}
      </div>
    `;
  }

  renderMain() {
    const theme = this._evaluateTheme();
    const Color = theme === 'light' ? 'rgb(0, 0, 0)' : 'rgb(255, 255, 255)';
    const Color2 = theme === 'light' ? 'rgb(0, 0, 0 ,0.7)' : 'rgb(255, 255, 255,0.7)';
    const BgColor = theme === 'light' ? 'rgb(255, 255, 255)' : 'rgb(50, 50, 50)';
    const BgColor2 = theme === 'light' ? 'rgb(150, 150, 150, 0.1)' : 'rgb(255, 255,255,0.1)';
    const Shadow = theme === 'light' ? '0 1px 2px rgba(255, 255, 255, 0.3)' : '0 1px 2px rgba(50, 50, 50, 0.6)';
    const svgpath =  this._getUC().svgpath;
    const uc = this._getUC();

    // 使用选中的余额实体而不是固定的this.entity
    const selectedEntityId = this._selectedBalanceEntity;
    if (!selectedEntityId || !this.hass || !this.hass.states[selectedEntityId]) {
      return html`<div>请选择有效的实体</div>`;
    }
    
    const selectedEntity = this.hass.states[selectedEntityId];
    
    const isprepaid = selectedEntity.attributes?.预付费 || "否";
    const billingStandard = selectedEntity.attributes?.计费标准?.计费标准;
    const currentLevel = (!billingStandard || billingStandard === '平均单价') ? null : 
      (billingStandard?.includes('年阶梯') || false ? 
        selectedEntity.attributes.计费标准?.当前年阶梯档?.replace('第', '').replace('档', '') :
        selectedEntity.attributes.计费标准?.当前月阶梯档?.replace('第', '').replace('档', '')
      );
    
    let electricityTypes = this.getElectricityType(buildMonthlistFromSummary(selectedEntity.attributes, uc) || []);
    if (!electricityTypes) electricityTypes = this._calcElectricityTypes(selectedEntity.attributes?.yearlist, 'year');
    const prices = currentLevel ? this.getElectricityPrices(billingStandard, currentLevel, electricityTypes) : {};

    // 渲染阶梯区域内容
    let ladderContent = '';
    if (selectedEntity.attributes && selectedEntity.attributes.计费标准) {
      if (billingStandard === '平均单价') {
        const averagePrice = selectedEntity.attributes.计费标准?.平均单价;
        ladderContent = html`
          <div class="ladder-section" style="background: ${BgColor2}">
            <div class="ladder-header">
              <span>平均单价</span>
              <span>${averagePrice}${this._getUC().priceUnit}</span>
            </div>
          </div>
        `;
      } else {
        const isYearLadder = billingStandard?.includes('年阶梯') || false;
        const ladderType = isYearLadder ? '年' : '月';
        const ladderTitle = isYearLadder ? `年${this._getUC().typeLabel}阶梯` : `月${this._getUC().typeLabel}阶梯`;
        const currentLevel = selectedEntity.attributes.计费标准?.[`当前${ladderType}阶梯档`]?.replace('第', '').replace('档', '') || '1';
        const secondLevelStart = selectedEntity.attributes.计费标准?.[`${ladderType}阶梯第2档起始${uc.ladderUsageKey}量`];
        const thirdLevelStart = selectedEntity.attributes.计费标准?.[`${ladderType}阶梯第3档起始${uc.ladderUsageKey}量`];
        const totalUsage = selectedEntity.attributes.计费标准?.[`${ladderType}阶梯累计用${uc.ladderUsageKey}量`];
        
        let level1Width = 0, level2Width = 0, level3Width = 0;
        let displayLevel = 1;
        let bubblePosition = 0;
        
        if (totalUsage <= secondLevelStart) {
          level1Width = (totalUsage / secondLevelStart) * 100;
          bubblePosition = (totalUsage / secondLevelStart) * 33.33;
          displayLevel = 1;
        } else if (totalUsage <= thirdLevelStart) {
          level1Width = 100;
          level2Width = ((totalUsage - secondLevelStart) / (thirdLevelStart - secondLevelStart)) * 100;
          bubblePosition = 33.33 + ((totalUsage - secondLevelStart) / (thirdLevelStart - secondLevelStart)) * 33.33;
          displayLevel = 2;
        } else {
          level1Width = 100;
          level2Width = 100;
          level3Width = Math.min(((totalUsage - thirdLevelStart) / thirdLevelStart) * 100, 100);
          bubblePosition = 66.66 + Math.min(((totalUsage - thirdLevelStart) / thirdLevelStart) * 33.33, 33.34);
          displayLevel = 3;
        }
        
        // 限制气泡位置，防止超出边界
        const minPosition = 10; // 最小10%
        const maxPosition = 90; // 最大90%
        const constrainedBubblePosition = Math.max(minPosition, Math.min(maxPosition, bubblePosition));
        
        // 限制箭头位置，防止超出边界
        const minArrowPosition = 1; // 最小1%
        const maxArrowPosition = 99; // 最大99%
        const constrainedArrowPosition = Math.max(minArrowPosition, Math.min(maxArrowPosition, bubblePosition));
        
        // 先从月度数据判断用电类型，为空则从年度数据判断
        let electricityTypes = this.getElectricityType(buildMonthlistFromSummary(selectedEntity.attributes, uc) || []);
        if (!electricityTypes) {
          electricityTypes = this._calcElectricityTypes(selectedEntity.attributes.yearlist, 'year');
        }
        const prices1 = this.getElectricityPrices(billingStandard, 1, electricityTypes);
        const prices2 = this.getElectricityPrices(billingStandard, 2, electricityTypes);
        const prices3 = this.getElectricityPrices(billingStandard, 3, electricityTypes);
        
        let periodInfo = '';
        if (isYearLadder) {
          periodInfo = `${selectedEntity.attributes.计费标准.当前年阶梯起始日期}-${selectedEntity.attributes.计费标准.当前年阶梯结束日期}`;
        }
        ladderContent = html`
          <div class="ladder-section" style="background: ${BgColor2}; color: ${Color2}; text-shadow: ${Shadow};">
            <div class="ladder-header" >
              <span>${ladderTitle} ${periodInfo ? `：${periodInfo}` : ''}</span>
            </div>
            <div class="ladder-progress">
              <div class="progress-segment level1" style="width: ${level1Width}%"></div>
              <div class="progress-segment level2" style="width: ${level2Width}%"></div>
              <div class="progress-segment level3" style="width: ${level3Width}%"></div>
              <div class="progress-indicator" style="background: ${Color}; left: ${bubblePosition}%"></div>
              <div class="progress-bubble" style="color: ${Color}; text-shadow: ${Shadow}; box-shadow: ${Shadow}; left: ${constrainedBubblePosition}%; background: ${displayLevel === 1 ? '#4CAF50' : displayLevel === 2 ? '#FFC107' : '#FF5722'}; border-top-color: ${displayLevel === 1 ? '#4CAF50' : displayLevel === 2 ? '#FFC107' : '#FF5722'};" data-level="${displayLevel}">第${displayLevel}阶梯  ${totalUsage}${uc.usageUnit}</div>
              <div class="progress-bubble-arrow" style="left: ${constrainedArrowPosition}%; border-top-color: ${displayLevel === 1 ? '#4CAF50' : displayLevel === 2 ? '#FFC107' : '#FF5722'};"></div>
              <div class="progress-labels">
                <span class="progress-label level1-label" style="color: ${Color}; text-shadow: ${Shadow};">第1阶梯</span>
                <span class="progress-label level2-label" style="color: ${Color}; text-shadow: ${Shadow};">第2阶梯</span>
                <span class="progress-label level3-label" style="color: ${Color}; text-shadow: ${Shadow};">第3阶梯</span>
              </div>
            </div>

            <div class="ladder-price-section">
              <div class="price-block level1-price">
                <div class="price-range">0-${secondLevelStart}${this._getUC().usageUnit}</div>
                ${this.renderPriceBlock(prices1)}
              </div>
              <div class="price-block level2-price">
                <div class="price-range">${secondLevelStart}-${thirdLevelStart}${this._getUC().usageUnit}</div>
                ${this.renderPriceBlock(prices2)}
              </div>
              <div class="price-block level3-price">
                <div class="price-range">${thirdLevelStart}${this._getUC().usageUnit}以上</div>
                ${this.renderPriceBlock(prices3)}
              </div>
            </div>
          </div>
        `;
      }
    }
    
    // 归一化日/月数据（供后续渲染使用）
    const normalizedDaylist = (selectedEntity.attributes?.daylist || []).map(item => normalizeDayItem(item, uc));
    const normalizedMonthlist = buildMonthlistFromSummary(selectedEntity.attributes, uc);

    // 渲染价格区域内容
    let priceContent = '';
    if (selectedEntity.attributes && selectedEntity.attributes.计费标准) {
      const billingStandard = selectedEntity.attributes.计费标准.计费标准;
      const currentLevel = (!billingStandard || billingStandard === '平均单价') ? null : 
        (billingStandard?.includes('年阶梯') || false ? 
          selectedEntity.attributes.计费标准?.当前年阶梯档?.replace('第', '').replace('档', '') :
          selectedEntity.attributes.计费标准?.当前月阶梯档?.replace('第', '').replace('档', '')
        );
      
      let electricityTypes = this.getElectricityType(normalizedMonthlist || []);
      if (!electricityTypes) electricityTypes = this._calcElectricityTypes(selectedEntity.attributes?.yearlist, 'year');
      const prices = currentLevel ? this.getElectricityPrices(billingStandard, currentLevel, electricityTypes) : {};
      const currentMonth = this.getCurrentMonth();
      const previousMonth = this.getPreviousMonth();
      const currentYear = new Date().getFullYear();

      const currentDayUsage = normalizedDaylist[0];
      const currentMonthUsage = this.getMonthUsage(normalizedMonthlist || [], currentMonth);
      const previousMonthUsage = this.getMonthUsage(normalizedMonthlist || [], previousMonth);
      const yearUsage = this.getYearUsage(buildYearlistFromMonthlist(selectedEntity.attributes, uc) || [], currentYear);
      
      // 渲染价格区域内容
     priceContent = html`
        <div class="usage-grid">
          <div class="usage-section" style="background: ${BgColor2};">
            <div class="usage-title" style="color: ${Color2}; text-shadow: ${Shadow};">
              <ha-icon icon="${this._getUC().defaultIcon}" style="color: ${Color2}; --mdc-icon-size: 12px; margin: 0 1px; vertical-align: middle;"></ha-icon>
              近日${this._getUC().typeLabel}
            </div>
            ${currentDayUsage ? html`
              <div class="usage-amount">
                <span class="usage-electricity">${currentDayUsage.dayEleNum}${this._getUC().usageUnit}</span>
                <span class="usage-cost">${currentDayUsage.dayEleCost}元</span>
              </div>
              ${this.renderDayBar(currentDayUsage)}
            ` : html`<div class="usage-amount">暂无数据</div>`}
          </div>
          
          <div class="usage-section" style="background: ${BgColor2}">
            <div class="usage-title" style="color: ${Color2}; text-shadow: ${Shadow};">
              <ha-icon icon="${this._getUC().defaultIcon}" style="color: ${Color2}; --mdc-icon-size: 12px; margin: 0 1px; vertical-align: middle;"></ha-icon>
              本月${this._getUC().typeLabel}
            </div>
            ${currentMonthUsage ? html`
              <div class="usage-amount">
                <span class="usage-electricity">${currentMonthUsage.monthEleNum}${this._getUC().usageUnit}</span>
                <span class="usage-cost">${currentMonthUsage.monthEleCost}元</span>
              </div>
              ${this.renderUsageBar(currentMonthUsage)}
            ` : html`<div class="usage-amount">暂无数据</div>`}
          </div>
          
          <div class="usage-section" style="background: ${BgColor2}">
            <div class="usage-title" style="color: ${Color2}; text-shadow: ${Shadow};">
              <ha-icon icon="${this._getUC().defaultIcon}" style="color: ${Color2}; --mdc-icon-size: 12px; margin: 0 1px; vertical-align: middle;"></ha-icon>
              上月${this._getUC().typeLabel}
            </div>
            ${previousMonthUsage ? html`
              <div class="usage-amount">
                <span class="usage-electricity">${previousMonthUsage.monthEleNum}${this._getUC().usageUnit}</span>
                <span class="usage-cost">${previousMonthUsage.monthEleCost}元</span>
              </div>
              ${this.renderUsageBar(previousMonthUsage)}
            ` : html`<div class="usage-amount">暂无数据</div>`}
          </div>
          
          <div class="usage-section" style="background: ${BgColor2}">
            <div class="usage-title" style="color: ${Color2}; text-shadow: ${Shadow};">
              <ha-icon icon="${this._getUC().defaultIcon}" style="color: ${Color2}; --mdc-icon-size: 12px; margin: 0 1px; vertical-align: middle;"></ha-icon>
              本年${this._getUC().typeLabel}
            </div>
            ${yearUsage ? html`
              <div class="usage-amount">
                <span class="usage-electricity">${yearUsage.yearEleNum}${this._getUC().usageUnit}</span>
                <span class="usage-cost">${yearUsage.yearEleCost}元</span>
              </div>
              ${this.renderYearUsageBar(yearUsage)}
            ` : html`<div class="usage-amount">暂无数据</div>`}
          </div>
        `;
      }
        
    const daydate = normalizedDaylist[0]?.day || selectedEntity.attributes?.daylist?.[0]?.day || '无';
    return html`
        <div class="card-main" style="background: ${BgColor}; color: ${Color}">
          <div class="top-section">
            <!-- 左侧：余额信息区域 -->
            <div class="balance-section">
              <div class="top-content">
                <img src=${this._getUC().svgpath} class="balance-icon" alt="国网图标">
                <div class="balance-time">${selectedEntity.attributes?.date || ''}</div>
                <div class="balance-time">数据日期:${daydate}</div>
                
              </div>
              
              <div class="spacer"></div>
              
              <div class="balance-controls-container">
                <div class="balance-info ${this.showPanel === 'recharge' ? 'active' : ''}" style="background: ${BgColor2}; cursor: pointer;" @click="${() => this.showRecharge()}">
                  ${(() => {
                    // 明细预警优先级最高
                    let isWarning = false;
                    
                    // 获取当前选中实体的预警信息
                    const balanceData = this._balanceData.find(item => item.entity_id === selectedEntityId);
                    
                    // 首先检查明细预警，如果存在且满足条件，直接设为预警状态
                    if (balanceData && balanceData.warning && balanceData.warning.trim() !== '') {
                      isWarning = this._evaluateWarningCondition(balanceData.value, balanceData.warning); 
                    } else {
                      // 只有在没有明细预警时才检查全局预警
                      if (this.config.global_warning && this.config.global_warning.trim() !== '') {
                        isWarning = this._evaluateWarningCondition(selectedEntity.state, this.config.global_warning);
                      }
                    }
                    
                    return html`
                      <div class="balance-amount" style="color: ${isWarning ? '#F44336' : ''}">
                        <span class="currency" style="color: ${isWarning ? '#F44336' : ''}">￥</span>
                        ${selectedEntity.state || '0'}
                        <span class="currency" style="color: ${isWarning ? '#F44336' : ''}">元</span>
                      </div>
                    `;
                  })()}

                  ${isprepaid !== '是' ? html`
                    <div class="balance-label">${this._getUC().balanceLabel}</div>
                  ` : html`
                    <div class="balance-label">上月${this._getUC().typeLabel}</div>
                  `}
                </div>
                
                 ${isprepaid !== '是' ? html`
                 <div class="days-info" style="background: ${BgColor2}">
                  <div class="days-amount">
                    ${selectedEntity.attributes?.剩余天数 || '0'}
                    <span class="currency">天</span>
                  </div>
                  <div class="days-label">预估使用天数</div>
                </div>
                ` : html``}
                
                <div class="action-buttons">
                  <div class="action-button ${this.showPanel === 'calendar' ? 'active' : ''}" @click="${() => this.showCalendar()}" style="background: ${BgColor2}; color: ${Color}">日历</div>
                  <div class="action-button ${this.showPanel === 'dayUsage' ? 'active' : ''}" @click="${() => this.showDayUsage()}" style="background: ${BgColor2}; color: ${Color}">日${uc.dayButtonLabel}</div>
                  <div class="action-button ${this.showPanel === 'monthUsage' ? 'active' : ''}" @click="${() => this.showMonthUsage()}" style="background: ${BgColor2}; color: ${Color}">月${uc.monthButtonLabel}</div>
                </div>
              </div>
            </div>
            
            <!-- 右侧：价格区块和阶梯区域 -->
            <div class="right-section">
              <!-- 右侧上方：价格区块 -->
              <div class="price-area">
                ${priceContent}
              </div>
              
              <!-- 右侧下方：阶梯区域 -->
              <div class="ladder-area">
                ${ladderContent}
              </div>
            </div>
          </div>
        </div>
    `;
  }  

  /*渲染充值记录列表*/
  renderRecharge() {
    const selectedEntityId = this._selectedBalanceEntity;
    if (!selectedEntityId || !this.hass || !this.hass.states[selectedEntityId]) {
      return html`<div style="padding: 20px; text-align: center;">请选择有效的实体</div>`;
    }
    const selectedEntity = this.hass.states[selectedEntityId];
    // 兼容两种属性命名（state_grid_info 暴露 rechargelist，部分来源可能为 rechargeList）
    const rechargeList = selectedEntity.attributes?.rechargelist
      || selectedEntity.attributes?.rechargeList
      || [];
    const isLight = this._evaluateTheme() === 'light';
    const bgColor = isLight ? 'rgb(255, 255, 255)' : 'rgb(50, 50, 50)';
    const fgColor = isLight ? 'rgb(0, 0, 0)' : 'rgb(255, 255, 255)';
    const subColor = isLight ? 'rgb(120, 120, 120)' : 'rgb(170, 170, 170)';

    if (!rechargeList.length) {
      return html`<div style="padding: 20px; text-align: center; color: ${fgColor}">暂无充值记录</div>`;
    }

    const rowStyle = 'display: flex; align-items: center; padding: 6px 8px; font-size: 13px;';
    return html`
      <div style="padding: 6px 0 0 0;">
        <div style="background: ${bgColor}; color: ${fgColor}; border-radius: 8px; overflow: hidden;">
          <div style="${rowStyle} font-weight: 600; border-bottom: 1px solid ${subColor}; padding: 10px 20px;">
            <span style="flex: 1.8; white-space: nowrap;">日期</span>
            <span style="flex: 1; text-align: right;">金额</span>
            <span style="flex: 2.4; text-align: right;">渠道</span>
          </div>
          ${rechargeList.map(item => html`
            <div style="border-bottom: 1px solid ${isLight ? 'rgb(240,240,240)' : 'rgb(70,70,70)'};padding: 0 10px;">
              <div style="${rowStyle}">
                <span style="flex: 1.8; white-space: nowrap;">${item.pay_date || ''}</span>
                <span style="flex: 1; text-align: right; color: #f30660; font-weight: 600;">￥${item.amount != null ? item.amount : ''}</span>
                <span style="flex: 2.4; text-align: right;">${item.channel || ''}</span>
              </div>
            </div>
          `)}
        </div>
      </div>
    `;
  }

  /*渲染整个卡片的主方法*/
  render() {
    return html`
      <div class="card-container " style="width: ${this.config.width};">
        ${this.renderHeader()}
        ${this.renderMain()}

        <!-- 显示区域 - 根据showPanel显示不同内容 -->
        ${this.showPanel === 'calendar' ? html`
          <div class="panel-section" >
            ${this.renderCalendar()}
          </div>
        ` : ''}
        
        ${this.showPanel === 'dayUsage' ? html`
          <div class="panel-section" >
            ${this.renderChartDay()}
          </div>
        ` : ''}
        
        ${this.showPanel === 'monthUsage' ? html`
          <div class="panel-section" >
            ${this.renderChartMonth()}
          </div>
        ` : ''}

        ${this.showPanel === 'recharge' ? html`
          <div class="panel-section" >
            ${this.renderRecharge()}
          </div>
        ` : ''}
      </div>
    `;
  }
}
customElements.define('xiaoshi-state-grid-info',  XiaoshiStateGridInfo);