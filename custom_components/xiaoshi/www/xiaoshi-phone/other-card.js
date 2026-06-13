import { LitElement, html, css } from "https://unpkg.com/lit-element@2.4.0/lit-element.js?module";

window.customCards = window.customCards || [];
window.customCards.push({
    type: 'xiaoshi-phone-other-card',
    name: '消逝卡(移动端)-其他设备卡',
    description: '移动端其他设备卡',
    preview: true
}); 
const PRESET_ON_STATES = [
    // 通用
    'on', 'open', 'opening','home',  'active', 'running',
    'detected', 'occupied', 'unlocked', 'power_on', '开机',
    // 媒体
    'Playing','playing', '播放中',
    // 空调/HVAC
    'heat', 'cool', 'heating', 'cooling', 'dry', 'fan',
    'auto', 'heat_cool', 'fan_only',
    // 人在
    '有人', 'one',
    // 扫地机器人
    '正在拖地','正在扫地','启动','cleaning',
    // 厨房
    '烹饪中', '保温中', '预约中', 'Busy', 'Keep Warm'
];

// 通用翻译
const COMMON_TRANSLATIONS = {
    'on': '开启', 'off': '关闭','idle': '空闲',
    'low': '低', 'medium': '中', 'high': '高',
    'brightness': '亮度', 'color_temp': '色温', 'color': '颜色',
    'normal': '正常', 'silent': '静音', 'turbo': '极速', 'max': '最大',
    'min': '最小', 'boost': '强力',
    'playing': '播放中', 'paused': '已暂停', 'standby': '待机',
    'cancel': '取消', 'waiting': '等待中', 'running': '运行中',
    'celsius': '摄氏度', 'fahrenheit': '华氏度',
    'default': '默认', 'cold_water': '冷水', 'smart': '智能',
    'power_off': '关机', 'power_on': '开机', 'pause': '暂停', 'resume': '继续',
    'unavailable': '离线', 'unknown': '未知',
    '20c': '20°C', '30c': '30°C', '40c': '40°C', '60c': '60°C', '95c': '95°C',
    '2_hours': '2小时', '4_hours': '4小时', '6_hours': '6小时', '8_hours': '8小时',
    '1_time': '1次', '2_times': '2次', '3_times': '3次', '4_times': '4次',
    '全速模式（Max）':'全速模式'
};

// 冰箱翻译
const FRIDGE_TRANSLATIONS = {
    'none_mode': '无模式', 'soft_freezing_mode': '软冷冻', 'zero_fresh_mode': '零度保鲜', 'cold_drink_mode': '冷饮',
    'fresh_product_mode': '生鲜', 'partial_freezing_mode': '微冻', 'dry_zone_mode': '干区', 'freeze_warm_mode': '冻暖',
    'freeze_mode': '冷冻',
    'left_freezing_room': '左冷冻室', 'right_freezing_room': '右冷冻室',
    'refrigeration': '冷藏', 'freezing': '冷冻',
};

// 洗碗机翻译
const DISHWASHER_TRANSLATIONS = {
    'neutral_gear': '待机', 'auto_wash': '智能洗', 'strong_wash': '超强洗', 'standard_wash': '标准洗',
    'eco_wash': '节能洗', 'glass_wash': '玻璃洗', 'soft_wash': '轻柔洗', 'hour_wash': '小时洗',
    'fast_wash': '快速洗', 'soak_wash': '预冲洗', '90min_wash': '90分钟洗', 'self_clean': '自清洁',
    'fruit_wash': '果蔬洗', 'self_define': '自定义洗', 'germ': '消毒洗', 'bowl_wash': '碗具洗',
    'kill_germ': '杀菌洗', 'seafood_wash': '海鲜洗', 'hotpot_wash': '火锅洗', 'quietnight_wash': '夜间静音洗',
    'less_wash': '轻量洗', 'oilnet_wash': '油网洗', 'max_rapid_wash': '超强快洗', 'hot_bowl_wash': '热碗洗',
    'cloud_wash': '云感洗', 'baby_wash': '婴儿洗', 'single_dry': '单烘干', 'single_disinfect': '蒸汽消毒',
    'wahin_wash_dry': '一键洗烘', 'high_temp_wash': '高温洗', 'wash_dry': '洗烘', 'auto_dry': '自动烘干',
    'fire_disinfect': '火焰消毒', 'toy_wash': '玩具洗',
};

// 洗衣机翻译
const WASHER_TRANSLATIONS = {
    'cotton': '棉麻', 'eco': '节能', 'fast_wash': '快洗', 'mixed_wash': '混合洗',
    'wool': '羊毛', 'ssp': 'SSP', 'deep_ssp': '深度筒自洁', 'sport_clothes': '运动服',
    'single_dehytration': '单脱水', 'rinsing_dehydration': '漂+脱', 'big': '大件',
    'baby_clothes': '婴儿服', 'down_jacket': '羽绒服', 'color': '彩色',
    'intelligent': '智能', 'quick_wash': '快速洗', 'shirt': '衬衫', 'fiber': '化纤',
    'enzyme': '酶洗', 'underwear': '文胸', 'outdoor': '户外', 'air_wash': '空气洗',
    'single_drying': '单烘干', 'steep': '浸泡', 'kids': '童装',
    'water_baby_clothes': '水洗婴儿服', 'fast_wash_30': '快洗30', 'water_shirt': '水洗衬衫',
    'water_mixed_wash': '水洗混合', 'water_fiber': '水洗化纤', 'water_kids': '水洗童装',
    'water_underwear': '水洗内衣', 'specialist': '专家', 'love': '爱心',
    'water_intelligent': '水洗智能', 'water_steep': '水洗浸泡',
    'water_fast_wash_30': '水洗快洗30', 'new_water_cotton': '新水洗棉',
    'water_eco': '水洗节能', 'wash_drying_60': '洗烘60', 'self_wash_5': '筒自洁',
    'fast_wash_min': '快洗分钟', 'mixed_wash_min': '混合洗分钟',
    'dehydration_min': '脱水分钟', 'self_wash_min': '自洁分钟',
    'baby_clothes_min': '婴儿服分钟', 'diy0': '自定义0', 'diy1': '自定义1', 'diy2': '自定义2',
    'silk_wash': '真丝洗', 'prevent_allergy': '防过敏', 'cold_wash': '冷水洗',
    'remove_mite_wash': '除螨洗', 'water_intense_wash': '水洗强洗',
    'fast_dry': '快干', 'water_outdoor': '水洗户外',
    'spring_autumn_wash': '春秋洗', 'summer_wash': '夏季洗', 'winter_wash': '冬季洗',
    'jean': '牛仔', 'new_clothes_wash': '新衣洗', 'silk': '真丝', 'insight_wash': '洞察洗',
    'fitness_clothes': '健身服', 'mink': '貂皮', 'fresh_air': '新风',
    'bucket_dry': '桶烘干', 'jacket': '夹克', 'bath_towel': '浴巾',
    'night_fresh_wash': '夜间清新洗', 'degerm': '除菌', 'heart_wash': '爱心洗',
    'water_cold_wash': '水洗冷水', 'water_prevent_allergy': '水洗防过敏',
    'water_remove_mite_wash': '水洗除螨', 'water_ssp': '深度洁筒',
    'standard': '标准', 'green_wool': '绿色羊毛', 'cook_wash': '高温煮洗',
    'fresh_remove_wrinkle': '清新去皱', 'steam_sterilize_wash': '蒸汽杀菌洗',
    'sterilize_wash': '杀菌洗', 'white_clothes_clean': '白衣清洁',
    'clean_stains': '特渍洗', 'prevent_cross_color': '防串色',
    'quick_dry_clothes': '快干衣物', 'yoga_clothes': '瑜伽服',
    'baby_clothes_dry': '婴童服烘', 'hot_wind_dry': '热风暖衣',
    'small_wash_dry': '小件智洗烘', 'socks': '袜子', 'underpants': '内裤',
    'eco_wash_mode': '节能洗', 'fast_wash_15': '快速15', 'color_wash': '彩色衣物',
    'water_cotton': '水韵棉织物', 'fast_wash_60': '60分钟快速洗',
    'standard_wash': '标准洗', 'aromatherapy': '香薰洗',
    'tube_clean_all': '筒自洁（全）', 'no_channeling_color': '防串色',
    'scald_wash': '烫洗', 'hanfu_spring_summer': '汉服（春夏）', 'hanfu_autumn_winter': '汉服（秋冬）',
    'skin_care_wash': '护肤洗', 'hanfu_wash': '汉服洗',
    'low_temp_dry': '低温烘干', 'high_temp_dry': '高温烘干', '30_min': '30分钟', '60_min': '60分钟',
    '90_min': '90分钟', '120_min': '120分钟', '180_min': '180分钟',
    'factory_test': '工厂测试', 'service': '售后', 'normal_continus': '持续标准',
    'l1': '低水位', 'l2': '中水位', 'l3': '高水位', 'l4': '超高水位',
    'sauce': '调味', 'fruit': '水果', 'makeup': '化妆品',
    'no_spin': '无脱水', '400rpm': '400转', '600rpm': '600转', '800rpm': '800转',
    '1000rpm': '1000转', '1200rpm': '1200转', '1400rpm': '1400转',
};

// 翻译分类映射
const TRANSLATION_CATEGORIES = {
    '洗碗机': DISHWASHER_TRANSLATIONS,
    '洗衣机': WASHER_TRANSLATIONS,
    '冰箱': FRIDGE_TRANSLATIONS,
};

const TRANSLATION_PRIORITY_OPTIONS = ['洗碗机', '洗衣机', '冰箱'];

// 翻译查找函数：优先匹配指定分类，匹配不到则依次查找其他分类
function translateOption(key, priority) {
    const order = [priority, ...TRANSLATION_PRIORITY_OPTIONS.filter(p => p !== priority)].filter(Boolean);
    for (const cat of order) {
        if (TRANSLATION_CATEGORIES[cat] && TRANSLATION_CATEGORIES[cat][key] !== undefined) {
            return TRANSLATION_CATEGORIES[cat][key];
        }
    }
    return COMMON_TRANSLATIONS[key] !== undefined ? COMMON_TRANSLATIONS[key] : key;
}

// 兼容：保留合并对象用于编辑器提示
const SELECT_OPTION_TRANSLATIONS = { ...COMMON_TRANSLATIONS, ...FRIDGE_TRANSLATIONS, ...DISHWASHER_TRANSLATIONS, ...WASHER_TRANSLATIONS };

class XiaoshiPhoneOtherCardEditor extends LitElement {
  static get properties() {
    return {
      hass: { type: Object },
      config: { type: Object },
      _searchTerm: { type: String },
      _filteredEntities: { type: Array },
      _showEntityList: { type: Boolean },
      _temperatureSearchTerm: { type: String },
      _filteredTemperatureEntities: { type: Array },
      _showTemperatureList: { type: Boolean },
      _timerSearchTerm: { type: String },
      _filteredTimerEntities: { type: Array },
      _showTimerList: { type: Boolean },
      _buttonSearchTerms: { type: Object },
      _filteredButtonEntities: { type: Object },
      _showButtonLists: { type: Boolean },
      _button2SearchTerms: { type: Object },
      _filteredButton2Entities: { type: Object },
      _showButton2Lists: { type: Boolean },
      _buttonRowSearchTerms: { type: Object },
      _filteredButtonRowEntities: { type: Object },
      _showButtonRowLists: { type: Object }
    };
  }

  setConfig(config) {
    this.config = config || {};
  }

  firstUpdated() {
    document.addEventListener('click', (e) => {
      if (!e.target.closest('.entity-selector')) {
        this._showEntityList = false;
        this._showTemperatureList = false;
        this._showTimerList = false;

        if (this._showButtonLists) {
          Object.keys(this._showButtonLists).forEach(key => {
            this._showButtonLists[key] = false;
          });
        }
        if (this._showButton2Lists) {
          Object.keys(this._showButton2Lists).forEach(key => {
            this._showButton2Lists[key] = false;
          });
        }
        if (this._showButtonRowLists) {
          Object.keys(this._showButtonRowLists).forEach(key => {
            this._showButtonRowLists[key] = false;
          });
        }

        this.requestUpdate();
      }
    });
  }

  _onMainEntitySearch(e) {
    const searchTerm = e.target.value.toLowerCase();
    this._searchTerm = searchTerm;
    this._showEntityList = true;

    if (!this.hass) return;

    const allEntities = Object.values(this.hass.states);

    this._filteredEntities = allEntities.filter(entity => {
      const entityId = entity.entity_id.toLowerCase();
      const friendlyName = (entity.attributes.friendly_name || '').toLowerCase();
      const matchesSearch = entityId.includes(searchTerm) || friendlyName.includes(searchTerm);
      return matchesSearch;
    }).slice(0, 50);

    this.requestUpdate();
  }

  _selectMainEntity(entityId) {
    this.config = {
      ...this.config,
      entity: entityId
    };

    this._searchTerm = '';
    this._showEntityList = false;

    this._fireEvent();
    this.requestUpdate();
  }

  _onTemperatureSearch(e) {
    const searchTerm = e.target.value.toLowerCase();
    this._temperatureSearchTerm = searchTerm;
    this._showTemperatureList = true;

    if (!this.hass) return;

    const allEntities = Object.values(this.hass.states);

    this._filteredTemperatureEntities = allEntities.filter(entity => {
      const entityId = entity.entity_id.toLowerCase();
      const friendlyName = (entity.attributes.friendly_name || '').toLowerCase();

      const isSensorEntity = entityId.startsWith('sensor.') || entityId.startsWith('binary_sensor.');
      const matchesSearch = entityId.includes(searchTerm) || friendlyName.includes(searchTerm);

      return isSensorEntity && matchesSearch;
    }).slice(0, 50);

    this.requestUpdate();
  }

  _selectTemperature(entityId) {
    this.config = {
      ...this.config,
      temperature: entityId
    };

    this._temperatureSearchTerm = '';
    this._showTemperatureList = false;

    this._fireEvent();
    this.requestUpdate();
  }

  _onTimerSearch(e) {
    const searchTerm = e.target.value.toLowerCase();
    this._timerSearchTerm = searchTerm;
    this._showTimerList = true;

    if (!this.hass) return;

    const allEntities = Object.values(this.hass.states);

    this._filteredTimerEntities = allEntities.filter(entity => {
      const entityId = entity.entity_id.toLowerCase();
      const friendlyName = (entity.attributes.friendly_name || '').toLowerCase();

      const isTimerEntity = entityId.startsWith('timer.');
      const matchesSearch = entityId.includes(searchTerm) || friendlyName.includes(searchTerm);

      return isTimerEntity && matchesSearch;
    }).slice(0, 50);

    this.requestUpdate();
  }

  _selectTimer(entityId) {
    this.config = {
      ...this.config,
      timer: entityId
    };

    this._timerSearchTerm = '';
    this._showTimerList = false;

    this._fireEvent();
    this.requestUpdate();
  }

  // ===== 按钮排管理 =====
  _getButtonRows() {
    return this.config.button_rows || [];
  }

  _addButtonRow() {
    const rows = [...this._getButtonRows()];
    rows.push({ items: [] });
    this.config = { ...this.config, button_rows: rows };
    this._fireEvent();
  }

  _removeButtonRow(rowIndex) {
    const rows = [...this._getButtonRows()];
    rows.splice(rowIndex, 1);
    this.config = { ...this.config, button_rows: rows.length > 0 ? rows : undefined };
    // 清理搜索状态
    if (this._buttonRowSearchTerms) {
      const newTerms = {};
      Object.keys(this._buttonRowSearchTerms).forEach(key => {
        const [ri, ii] = key.split('-').map(Number);
        if (ri < rowIndex) newTerms[key] = this._buttonRowSearchTerms[key];
        else if (ri > rowIndex) newTerms[`${ri-1}-${ii}`] = this._buttonRowSearchTerms[key];
      });
      this._buttonRowSearchTerms = newTerms;
    }
    if (this._filteredButtonRowEntities) {
      const newFiltered = {};
      Object.keys(this._filteredButtonRowEntities).forEach(key => {
        const [ri, ii] = key.split('-').map(Number);
        if (ri < rowIndex) newFiltered[key] = this._filteredButtonRowEntities[key];
        else if (ri > rowIndex) newFiltered[`${ri-1}-${ii}`] = this._filteredButtonRowEntities[key];
      });
      this._filteredButtonRowEntities = newFiltered;
    }
    if (this._showButtonRowLists) {
      const newShow = {};
      Object.keys(this._showButtonRowLists).forEach(key => {
        const [ri, ii] = key.split('-').map(Number);
        if (ri < rowIndex) newShow[key] = this._showButtonRowLists[key];
        else if (ri > rowIndex) newShow[`${ri-1}-${ii}`] = this._showButtonRowLists[key];
      });
      this._showButtonRowLists = newShow;
    }
    this._fireEvent();
    this.requestUpdate();
  }

  _addButtonRowItem(rowIndex) {
    const rows = [...this._getButtonRows()];
    if (!rows[rowIndex]) return;
    rows[rowIndex] = { ...rows[rowIndex], items: [...(rows[rowIndex].items || []), { mode: 'button', entity: '' }] };
    this.config = { ...this.config, button_rows: rows };
    this._fireEvent();
  }

  _removeButtonRowItem(rowIndex, itemIndex) {
    const rows = [...this._getButtonRows()];
    if (!rows[rowIndex]) return;
    const items = [...(rows[rowIndex].items || [])];
    items.splice(itemIndex, 1);
    rows[rowIndex] = { ...rows[rowIndex], items };
    this.config = { ...this.config, button_rows: rows };
    // 清理搜索状态
    const key = `${rowIndex}-${itemIndex}`;
    if (this._buttonRowSearchTerms) delete this._buttonRowSearchTerms[key];
    if (this._filteredButtonRowEntities) delete this._filteredButtonRowEntities[key];
    if (this._showButtonRowLists) delete this._showButtonRowLists[key];
    this._fireEvent();
    this.requestUpdate();
  }

  _buttonRowModeChanged(rowIndex, itemIndex, mode) {
    const rows = [...this._getButtonRows()];
    if (!rows[rowIndex] || !rows[rowIndex].items[itemIndex]) return;
    const items = [...rows[rowIndex].items];
    items[itemIndex] = { ...items[itemIndex], mode };
    rows[rowIndex] = { ...rows[rowIndex], items };
    this.config = { ...this.config, button_rows: rows };
    this._fireEvent();
  }

  _onButtonRowSearch(e, rowIndex, itemIndex) {
    const searchTerm = e.target.value.toLowerCase();
    const key = `${rowIndex}-${itemIndex}`;

    if (!this._buttonRowSearchTerms) this._buttonRowSearchTerms = {};
    if (!this._filteredButtonRowEntities) this._filteredButtonRowEntities = {};
    if (!this._showButtonRowLists) this._showButtonRowLists = {};

    this._buttonRowSearchTerms[key] = searchTerm;
    this._showButtonRowLists[key] = true;

    if (!this.hass) return;

    const allEntities = Object.values(this.hass.states);
    this._filteredButtonRowEntities[key] = allEntities.filter(entity => {
      const entityId = entity.entity_id.toLowerCase();
      const friendlyName = (entity.attributes.friendly_name || '').toLowerCase();
      const matchesSearch = entityId.includes(searchTerm) || friendlyName.includes(searchTerm);
      return matchesSearch;
    }).slice(0, 50);

    this.requestUpdate();
  }

  _selectButtonRowEntity(entityId, rowIndex, itemIndex) {
    const rows = [...this._getButtonRows()];
    if (!rows[rowIndex]) return;
    const items = [...(rows[rowIndex].items || [])];
    items[itemIndex] = { ...items[itemIndex], entity: entityId };
    rows[rowIndex] = { ...rows[rowIndex], items };
    this.config = { ...this.config, button_rows: rows };

    const key = `${rowIndex}-${itemIndex}`;
    if (!this._buttonRowSearchTerms) this._buttonRowSearchTerms = {};
    if (!this._showButtonRowLists) this._showButtonRowLists = {};
    this._buttonRowSearchTerms[key] = '';
    this._showButtonRowLists[key] = false;

    this._fireEvent();
    this.requestUpdate();
  }

  _buttonRowSelectOptionsChanged(rowIndex, itemIndex, value) {
    const rows = [...this._getButtonRows()];
    if (!rows[rowIndex] || !rows[rowIndex].items[itemIndex]) return;
    const items = [...rows[rowIndex].items];
    const selectOptions = value ? value.split(',').map(s => s.trim()).filter(s => s) : [];
    items[itemIndex] = { ...items[itemIndex], select_options: selectOptions };
    rows[rowIndex] = { ...rows[rowIndex], items };
    this.config = { ...this.config, button_rows: rows };
    this._fireEvent();
    this.requestUpdate();
  }

  _buttonRowFieldChanged(rowIndex, itemIndex, field, value) {
    const rows = [...this._getButtonRows()];
    if (!rows[rowIndex] || !rows[rowIndex].items[itemIndex]) return;
    const items = [...rows[rowIndex].items];
    items[itemIndex] = { ...items[itemIndex], [field]: value };
    rows[rowIndex] = { ...rows[rowIndex], items };
    this.config = { ...this.config, button_rows: rows };
    this._fireEvent();
    this.requestUpdate();
  }

  _buttonRowSubItemChanged(rowIndex, itemIndex, subKey, field, value) {
    const rows = [...this._getButtonRows()];
    if (!rows[rowIndex] || !rows[rowIndex].items[itemIndex]) return;
    const items = [...rows[rowIndex].items];
    const subItems = { ...(items[itemIndex].sub_items || {}) };
    subItems[subKey] = { ...(subItems[subKey] || {}) };
    if (field === 'visible') subItems[subKey].visible = value !== false;
    else if (field === 'show_name') subItems[subKey].show_name = value !== false;
    else if (field === 'custom_name') subItems[subKey].custom_name = value;
    else if (field === 'show_icon') subItems[subKey].show_icon = value !== false;
    else if (field === 'custom_icon') subItems[subKey].custom_icon = value;
    items[itemIndex] = { ...items[itemIndex], sub_items: subItems };
    rows[rowIndex] = { ...rows[rowIndex], items };
    this.config = { ...this.config, button_rows: rows };
    this._fireEvent();
    this.requestUpdate();
  }

  _buttonRowShowNameChanged(rowIndex, itemIndex, value) {
    const rows = [...this._getButtonRows()];
    if (!rows[rowIndex] || !rows[rowIndex].items[itemIndex]) return;
    const items = [...rows[rowIndex].items];
    items[itemIndex] = { ...items[itemIndex], show_name: value === 'true' };
    rows[rowIndex] = { ...rows[rowIndex], items };
    this.config = { ...this.config, button_rows: rows };
    this._fireEvent();
    this.requestUpdate();
  }

  _buttonRowShowIconChanged(rowIndex, itemIndex, value) {
    const rows = [...this._getButtonRows()];
    if (!rows[rowIndex] || !rows[rowIndex].items[itemIndex]) return;
    const items = [...rows[rowIndex].items];
    items[itemIndex] = { ...items[itemIndex], show_icon: value === 'true' };
    rows[rowIndex] = { ...rows[rowIndex], items };
    this.config = { ...this.config, button_rows: rows };
    this._fireEvent();
    this.requestUpdate();
  }

  _buttonRowCustomIconsChanged(rowIndex, itemIndex, value) {
    const rows = [...this._getButtonRows()];
    if (!rows[rowIndex] || !rows[rowIndex].items[itemIndex]) return;
    const items = [...rows[rowIndex].items];
    const customIcons = {};
    if (value && value.trim()) {
      const trimmed = value.trim();
      // 如果直接是图标格式（如 mdi:xxx），设为 default
      if (trimmed.startsWith('mdi:') || trimmed.startsWith('hass:')) {
        customIcons.default = trimmed;
      } else {
        value.split(',').forEach(pair => {
          const colonIdx = pair.indexOf(':');
          if (colonIdx > 0) {
            const k = pair.substring(0, colonIdx).trim();
            const v = pair.substring(colonIdx + 1).trim();
            if (k && v) customIcons[k] = v;
          }
        });
      }
    }
    items[itemIndex] = { ...items[itemIndex], custom_icons: customIcons };
    rows[rowIndex] = { ...rows[rowIndex], items };
    this.config = { ...this.config, button_rows: rows };
    this._fireEvent();
    this.requestUpdate();
  }

  _formatCustomIcons(icons) {
    if (!icons || typeof icons !== 'object') return '';
    const keys = Object.keys(icons);
    if (keys.length === 1 && keys[0] === 'default') return icons.default;
    return Object.entries(icons).map(([k, v]) => `${k}:${v}`).join(',');
  }

  _formatSelectOptionNames(names) {
    if (!names || typeof names !== 'object') return '';
    return Object.entries(names).map(([k, v]) => `${k}:${v}`).join(',');
  }

  _buttonRowSelectOptionNamesChanged(rowIndex, itemIndex, value) {
    const rows = [...this._getButtonRows()];
    if (!rows[rowIndex] || !rows[rowIndex].items[itemIndex]) return;
    const items = [...rows[rowIndex].items];
    const selectOptionNames = {};
    if (value && value.trim()) {
      value.split(',').forEach(pair => {
        const trimmed = pair.trim();
        if (trimmed.includes(':')) {
          const [original, renamed] = trimmed.split(':');
          const key = original.trim();
          const val = renamed.trim();
          if (key && val) {
            selectOptionNames[key] = val;
          }
        }
      });
    }
    items[itemIndex] = { ...items[itemIndex], select_option_names: Object.keys(selectOptionNames).length > 0 ? selectOptionNames : undefined };
    rows[rowIndex] = { ...rows[rowIndex], items };
    this.config = { ...this.config, button_rows: rows };
    this._fireEvent();
    this.requestUpdate();
  }

  _buttonRowFanPresetModesChanged(rowIndex, itemIndex, value) {
    const rows = [...this._getButtonRows()];
    if (!rows[rowIndex] || !rows[rowIndex].items[itemIndex]) return;
    const items = [...rows[rowIndex].items];
    const fanPresetModes = value ? value.split(',').map(s => s.trim()).filter(s => s) : [];
    items[itemIndex] = { ...items[itemIndex], fan_preset_modes: fanPresetModes };
    rows[rowIndex] = { ...rows[rowIndex], items };
    this.config = { ...this.config, button_rows: rows };
    this._fireEvent();
    this.requestUpdate();
  }

  _buttonRowFanPresetModeNamesChanged(rowIndex, itemIndex, value) {
    const rows = [...this._getButtonRows()];
    if (!rows[rowIndex] || !rows[rowIndex].items[itemIndex]) return;
    const items = [...rows[rowIndex].items];
    const fanPresetModeNames = {};
    if (value && value.trim()) {
      value.split(',').forEach(pair => {
        const trimmed = pair.trim();
        if (trimmed.includes(':')) {
          const [original, renamed] = trimmed.split(':');
          const key = original.trim();
          const val = renamed.trim();
          if (key && val) {
            fanPresetModeNames[key] = val;
          }
        }
      });
    }
    items[itemIndex] = { ...items[itemIndex], fan_preset_mode_names: Object.keys(fanPresetModeNames).length > 0 ? fanPresetModeNames : undefined };
    rows[rowIndex] = { ...rows[rowIndex], items };
    this.config = { ...this.config, button_rows: rows };
    this._fireEvent();
    this.requestUpdate();
  }

  _buttonRowSensorValueNamesChanged(rowIndex, itemIndex, value) {
    const rows = [...this._getButtonRows()];
    if (!rows[rowIndex] || !rows[rowIndex].items[itemIndex]) return;
    const items = [...rows[rowIndex].items];
    const sensorValueNames = {};
    if (value && value.trim()) {
      value.split(',').forEach(pair => {
        const trimmed = pair.trim();
        if (trimmed.includes(':')) {
          const [original, renamed] = trimmed.split(':');
          const key = original.trim();
          const val = renamed.trim();
          if (key && val) {
            sensorValueNames[key] = val;
          }
        }
      });
    }
    items[itemIndex] = { ...items[itemIndex], sensor_value_names: Object.keys(sensorValueNames).length > 0 ? sensorValueNames : undefined };
    rows[rowIndex] = { ...rows[rowIndex], items };
    this.config = { ...this.config, button_rows: rows };
    this._fireEvent();
    this.requestUpdate();
  }

  // ===== 附加按钮1 =====
  _onButtonSearch(e, index) {
    const searchTerm = e.target.value.toLowerCase();

    if (!this._buttonSearchTerms) this._buttonSearchTerms = {};
    if (!this._filteredButtonEntities) this._filteredButtonEntities = {};
    if (!this._showButtonLists) this._showButtonLists = {};

    this._buttonSearchTerms[index] = searchTerm;
    this._showButtonLists[index] = true;

    if (!this.hass) return;

    const allEntities = Object.values(this.hass.states);
    this._filteredButtonEntities[index] = allEntities.filter(entity => {
      const entityId = entity.entity_id.toLowerCase();
      const friendlyName = (entity.attributes.friendly_name || '').toLowerCase();
      const matchesSearch = entityId.includes(searchTerm) || friendlyName.includes(searchTerm);
      return matchesSearch;
    }).slice(0, 50);

    this.requestUpdate();
  }

  _selectButtonEntity(entityId, index) {
    const buttons = [...(this.config.buttons || [])];
    const existing = buttons[index];
    if (typeof existing === 'object' && existing !== null) {
      buttons[index] = { ...existing, entity: entityId };
    } else {
      buttons[index] = { entity: entityId, name: '' };
    }
    this.config = { ...this.config, buttons };

    if (!this._buttonSearchTerms) this._buttonSearchTerms = {};
    if (!this._showButtonLists) this._showButtonLists = {};
    this._buttonSearchTerms[index] = '';
    this._showButtonLists[index] = false;

    this._fireEvent();
    this.requestUpdate();
  }

  _addButton() {
    const buttons = [...(this.config.buttons || [])];
    buttons.push({ entity: '', name: '' });
    this.config = { ...this.config, buttons };
    this._fireEvent();
  }

  _removeButton(index) {
    const buttons = [...(this.config.buttons || [])];
    buttons.splice(index, 1);
    this.config = { ...this.config, buttons: buttons.length > 0 ? buttons : undefined };

    if (this._buttonSearchTerms) delete this._buttonSearchTerms[index];
    if (this._filteredButtonEntities) delete this._filteredButtonEntities[index];
    if (this._showButtonLists) delete this._showButtonLists[index];

    this._fireEvent();
    this.requestUpdate();
  }

  _buttonNameChanged(index, value) {
    const buttons = [...(this.config.buttons || [])];
    const existing = buttons[index];
    if (typeof existing === 'object' && existing !== null) {
      buttons[index] = { ...existing, name: value };
    } else {
      buttons[index] = { entity: existing || '', name: value };
    }
    this.config = { ...this.config, buttons };
    this._fireEvent();
    this.requestUpdate();
  }

  // ===== 附加按钮2 =====
  _onButton2Search(e, index) {
    const searchTerm = e.target.value.toLowerCase();

    if (!this._button2SearchTerms) this._button2SearchTerms = {};
    if (!this._filteredButton2Entities) this._filteredButton2Entities = {};
    if (!this._showButton2Lists) this._showButton2Lists = {};

    this._button2SearchTerms[index] = searchTerm;
    this._showButton2Lists[index] = true;

    if (!this.hass) return;

    const allEntities = Object.values(this.hass.states);
    this._filteredButton2Entities[index] = allEntities.filter(entity => {
      const entityId = entity.entity_id.toLowerCase();
      const friendlyName = (entity.attributes.friendly_name || '').toLowerCase();
      const matchesSearch = entityId.includes(searchTerm) || friendlyName.includes(searchTerm);
      return matchesSearch;
    }).slice(0, 50);

    this.requestUpdate();
  }

  _selectButton2Entity(entityId, index) {
    const buttons2 = [...(this.config.buttons2 || [])];
    const existing = buttons2[index];
    if (typeof existing === 'object' && existing !== null) {
      buttons2[index] = { ...existing, entity: entityId };
    } else {
      buttons2[index] = { entity: entityId, name: '' };
    }
    this.config = { ...this.config, buttons2 };

    if (!this._button2SearchTerms) this._button2SearchTerms = {};
    if (!this._showButton2Lists) this._showButton2Lists = {};
    this._button2SearchTerms[index] = '';
    this._showButton2Lists[index] = false;

    this._fireEvent();
    this.requestUpdate();
  }

  _addButton2() {
    const buttons2 = [...(this.config.buttons2 || [])];
    buttons2.push({ entity: '', name: '' });
    this.config = { ...this.config, buttons2 };
    this._fireEvent();
  }

  _removeButton2(index) {
    const buttons2 = [...(this.config.buttons2 || [])];
    buttons2.splice(index, 1);
    this.config = { ...this.config, buttons2: buttons2.length > 0 ? buttons2 : undefined };

    if (this._button2SearchTerms) delete this._button2SearchTerms[index];
    if (this._filteredButton2Entities) delete this._filteredButton2Entities[index];
    if (this._showButton2Lists) delete this._showButton2Lists[index];

    this._fireEvent();
    this.requestUpdate();
  }

  _button2NameChanged(index, value) {
    const buttons2 = [...(this.config.buttons2 || [])];
    const existing = buttons2[index];
    if (typeof existing === 'object' && existing !== null) {
      buttons2[index] = { ...existing, name: value };
    } else {
      buttons2[index] = { entity: existing || '', name: value };
    }
    this.config = { ...this.config, buttons2 };
    this._fireEvent();
    this.requestUpdate();
  }

  static get styles() {
    return css`
      .form {
        display: flex;
        flex-direction: column;
        gap: 10px;
        min-height: 500px;
      }
      .form-group {
        display: flex;
        flex-direction: column;
        gap: 5px;
      }
      .form-row {
        display: flex;
        align-items: center;
        gap: 8px;
      }
      .form-row label {
        flex-shrink: 0;
        white-space: nowrap;
        min-width: fit-content;
      }
      .form-row input,
      .form-row select,
      .form-row .entity-selector-with-remove,
      .form-row .entity-selector {
        flex: 1;
        min-width: 0;
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

      .entity-selector {
        position: relative;
      }

      .entity-search-input {
        width: 100%;
        padding: 8px;
        border: 1px solid #ddd;
        border-radius: 4px;
        box-sizing: border-box;
      }

      .entity-dropdown {
        position: absolute;
        top: 100%;
        left: 0;
        right: 0;
        height: 300px;
        overflow-y: auto;
        background: white;
        border: 1px solid #ddd;
        border-radius: 4px;
        box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        z-index: 1000;
        margin-top: 2px;
      }

      .entity-option {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 8px 12px;
        cursor: pointer;
        border-bottom: 1px solid #eee;
      }

      .entity-option:hover {
        background: #f5f5f5;
      }

      .entity-option.selected {
        background: #e3f2fd;
      }

      .entity-info {
        display: flex;
        align-items: center;
        gap: 8px;
        flex: 1;
      }

      .entity-details {
        flex: 1;
      }

      .entity-name {
        font-weight: 500;
        font-size: 12px;
        color: #000;
      }

      .entity-id {
        font-size: 12px;
        color: #000;
        font-family: monospace;
      }

      .check-icon {
        color: #4CAF50;
      }

      .no-results {
        padding: 12px;
        text-align: center;
        color: #666;
        font-style: italic;
      }

      .entity-selector-with-remove {
        display: flex;
        align-items: flex-start;
        gap: 8px;
        margin-bottom: 8px;
      }

      .entity-selector-with-remove .entity-selector {
        flex: 1;
      }

      .remove-button {
        background: #f44336;
        color: white;
        border: none;
        border-radius: 4px;
        width: 30px;
        height: 30px;
        min-width: 30px;
        padding: 0;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        flex-shrink: 0;
        margin-top: 0;
      }

      .remove-button:hover {
        background: #d32f2f;
      }

      .remove-button ha-icon {
        --mdc-icon-size: 20px;
      }

      .buttons-row {
        display: flex;
        align-items: center;
        margin-top: 8px;
      }
      .add-button {
        margin-left: 8px;
        border: 1px solid red;
        border-radius: 4px;
        padding: 8px;
        transition: all 0.2s ease;
      }
      .add-button:hover {
        background-color: rgba(255, 0, 0, 0.1);
        transform: translateY(-1px);
        box-shadow: 0 2px 4px rgba(255, 0, 0, 0.2);
      }
      .hint {
        font-size: 0.85em;
        color: #888;
        margin-top: 4px;
      }
    `;
  }

  render() {
    if (!this.hass) return html``;

    return html`
      <div class="form">
        <!-- 主题 & 宽度 -->
        <div style="display: flex; gap: 8px; align-items: flex-end; margin-bottom: 8px;">
          <div style="flex: 1;">
            <label style="font-size: 0.8em;">主题</label>
            <select
              @change=${this._themeSelectChanged}
              .value=${this.config.theme !== undefined ? this.config.theme : 'system'}
              style="width: 100%; padding: 4px 0; border: 1px solid #555; border-radius: 4px; background: var(--card-background-color, #1c1c1c); color: var(--primary-text-color, #fff);"
            >
              <option value="system">跟随系统</option>
              <option value="light">浅色</option>
              <option value="dark">深色</option>
            </select>
          </div>
          <div style="flex: 1;">
            <label style="font-size: 0.8em;">卡片宽度</label>
            <input
              type="text"
              @change=${this._widthChanged}
              .value=${this.config.width !== undefined ? this.config.width : '100%'}
              placeholder="100%"
              style="width: 100%; padding: 4px 0; border: 1px solid #555; border-radius: 4px; background: var(--card-background-color, #1c1c1c); color: var(--primary-text-color, #fff);"
            />
          </div>
        </div>

        <!-- 主实体选择 -->
        <div class="form-row">
          <label>设备实体</label>
          <div class="entity-selector">
            <input
              type="text"
              @input=${this._onMainEntitySearch}
              @focus=${this._onMainEntitySearch}
              .value=${this._searchTerm || this.config?.entity || ''}
              placeholder="搜索实体..."
              class="entity-search-input"
            />
            ${this._showEntityList ? html`
              <div class="entity-dropdown">
                ${this._filteredEntities.map(entity => html`
                  <div
                    class="entity-option ${this.config?.entity === entity.entity_id ? 'selected' : ''}"
                    @click=${() => this._selectMainEntity(entity.entity_id)}
                  >
                    <div class="entity-info">
                      <ha-icon icon="${entity.attributes.icon || 'mdi:help-circle'}"></ha-icon>
                      <div class="entity-details">
                        <div class="entity-name">${entity.attributes.friendly_name || entity.entity_id}</div>
                        <div class="entity-id">${entity.entity_id}</div>
                      </div>
                    </div>
                    ${this.config?.entity === entity.entity_id ?
                      html`<ha-icon icon="mdi:check" class="check-icon"></ha-icon>` : ''}
                  </div>
                `)}
                ${this._filteredEntities.length === 0 ? html`
                  <div class="no-results">未找到匹配的实体</div>
                ` : ''}
              </div>
            ` : ''}
          </div>
        </div>

        <!-- 名称重定义 -->
        <div class="form-row">
          <label>名称重定义</label>
          <input
            type="text"
            .value=${this.config.custom_name || ''}
            @change=${(e) => { this.config = { ...this.config, custom_name: e.target.value }; this._fireEvent(); this.requestUpdate(); }}
            placeholder="留空使用实体名称"
            style="flex: 1; padding: 4px 0; border: 1px solid #555; border-radius: 4px; background: var(--card-background-color, #1c1c1c); color: var(--primary-text-color, #fff);"
          />
        </div>

        <!-- 图标重定义 -->
        <div class="form-row">
          <label>图标重定义</label>
          <input
            type="text"
            .value=${this.config.custom_icon || ''}
            @change=${(e) => { this.config = { ...this.config, custom_icon: e.target.value }; this._fireEvent(); this.requestUpdate(); }}
            placeholder="如: mdi:washing-machine"
            style="flex: 1; padding: 4px 0; border: 1px solid #555; border-radius: 4px; background: var(--card-background-color, #1c1c1c); color: var(--primary-text-color, #fff);"
          />
        </div>

        <!-- 设备实体状态重定义 -->
        <div class="form-row">
          <label>状态重定义</label>
          <input
            type="text"
            .value=${this.config.on_states || ''}
            @change=${(e) => { this.config = { ...this.config, on_states: e.target.value }; this._fireEvent(); this.requestUpdate(); }}
            placeholder="如: on,open,running"
            style="flex: 1; padding: 4px 0; border: 1px solid #555; border-radius: 4px; background: var(--card-background-color, #1c1c1c); color: var(--primary-text-color, #fff);"
          />
        </div>

        <!-- 显示电源开关 + 翻译优先 -->
        <div class="form-row">
          <label>电源开关</label>
          <select
            .value=${this.config.show_power !== undefined ? this.config.show_power : 'true'}
            @change=${(e) => { this.config = { ...this.config, show_power: e.target.value }; this._fireEvent(); this.requestUpdate(); }}
            style="flex: 1; padding: 4px 0; border: 1px solid #555; border-radius: 4px; background: var(--card-background-color, #1c1c1c); color: var(--primary-text-color, #fff);"
          >
            <option value="true" ?selected=${(this.config.show_power !== undefined ? this.config.show_power : 'true') === 'true'}>显示</option>
            <option value="false" ?selected=${this.config.show_power === 'false'}>隐藏</option>
          </select>
          <label>翻译优先</label>
          <select
            .value=${this.config.translation_priority || '洗碗机'}
            @change=${(e) => { this.config = { ...this.config, translation_priority: e.target.value }; this._fireEvent(); this.requestUpdate(); }}
            style="flex: 1; padding: 4px 0; border: 1px solid #555; border-radius: 4px; background: var(--card-background-color, #1c1c1c); color: var(--primary-text-color, #fff);"
          >
            <option value="洗碗机" ?selected=${(this.config.translation_priority || '洗碗机') === '洗碗机'}>洗碗机</option>
            <option value="洗衣机" ?selected=${this.config.translation_priority === '洗衣机'}>洗衣机</option>
            <option value="冰箱" ?selected=${this.config.translation_priority === '冰箱'}>冰箱</option>
          </select>
        </div>

        <!-- 状态显示值 -->
        <div class="form-group">
          <label>状态显示值 (支持[[[ ]]]模板语法，如 [[[ entity.state ]]])</label>
          <textarea
            .value=${this.config.state_display || ''}
            @change=${(e) => { this.config = { ...this.config, state_display: e.target.value }; this._fireEvent(); this.requestUpdate(); }}
            placeholder="留空使用默认状态，支持[[[ ]]]模板"
            style="width: 100%; padding: 4px 0; border: 1px solid #555; border-radius: 4px; background: var(--card-background-color, #1c1c1c); color: var(--primary-text-color, #fff);"
          ></textarea>
        </div>

        <!-- 强调颜色值 -->
        <div class="form-group">
          <label>强调颜色值 (支持[[[ ]]]模板语法，如 [[[ entity.state ]]])</label>
          <textarea
            .value=${this.config.accent_color || ''}
            @change=${(e) => { this.config = { ...this.config, accent_color: e.target.value }; this._fireEvent(); this.requestUpdate(); }}
            placeholder="默认淡红色，支持[[[ ]]]模板"
            style="width: 100%; padding: 4px 0; border: 1px solid #555; border-radius: 4px; background: var(--card-background-color, #1c1c1c); color: var(--primary-text-color, #fff);"
          ></textarea>
        </div>

        <!-- 曲线传感器 -->
        <div class="form-row">
          <label>曲线传感器</label>
          <div class="entity-selector-with-remove">
            <div class="entity-selector">
              <input
                type="text"
                @input=${this._onTemperatureSearch}
                @focus=${this._onTemperatureSearch}
                .value=${this._temperatureSearchTerm || this.config.temperature || ''}
                placeholder="搜索传感器/binary_sensor..."
                class="entity-search-input"
              />
              ${this._showTemperatureList ? html`
                <div class="entity-dropdown">
                  ${this._filteredTemperatureEntities.map(entity => html`
                    <div
                      class="entity-option ${this.config.temperature === entity.entity_id ? 'selected' : ''}"
                      @click=${() => this._selectTemperature(entity.entity_id)}
                    >
                      <div class="entity-info">
                        <ha-icon icon="${entity.attributes.icon || 'mdi:help-circle'}"></ha-icon>
                        <div class="entity-details">
                          <div class="entity-name">${entity.attributes.friendly_name || entity.entity_id}</div>
                          <div class="entity-id">${entity.entity_id}</div>
                        </div>
                      </div>
                      ${this.config.temperature === entity.entity_id ?
                        html`<ha-icon icon="mdi:check" class="check-icon"></ha-icon>` : ''}
                    </div>
                  `)}
                  ${this._filteredTemperatureEntities.length === 0 ? html`
                    <div class="no-results">未找到匹配的实体</div>
                  ` : ''}
                </div>
              ` : ''}
            </div>
            <button class="remove-button" @click=${this._removeTemperature} title="移除曲线传感器">
              <ha-icon icon="mdi:close"></ha-icon>
            </button>
          </div>
        </div>

        <!-- 曲线颜色 -->
        <div class="form-row">
          <label>曲线颜色</label>
          <input
            type="color"
            .value=${this.config.curve_color || '#e07070'}
            @input=${(e) => { this.config = { ...this.config, curve_color: e.target.value }; this._fireEvent(); this.requestUpdate(); }}
            style="width: 40px; height: 30px; padding: 2px; border: 1px solid #555; border-radius: 4px; cursor: pointer; background: var(--card-background-color, #1c1c1c);"
          />
        </div>

        <!-- 定时器 -->
        <div class="form-row">
          <label>定时器实体</label>
          <div class="entity-selector-with-remove">
            <div class="entity-selector">
              <input
                type="text"
                @input=${this._onTimerSearch}
                @focus=${this._onTimerSearch}
                .value=${this._timerSearchTerm || this.config.timer || ''}
                placeholder="搜索定时器..."
                class="entity-search-input"
              />
              ${this._showTimerList ? html`
                <div class="entity-dropdown">
                  ${this._filteredTimerEntities.map(entity => html`
                    <div
                      class="entity-option ${this.config.timer === entity.entity_id ? 'selected' : ''}"
                      @click=${() => this._selectTimer(entity.entity_id)}
                    >
                      <div class="entity-info">
                        <ha-icon icon="${entity.attributes.icon || 'mdi:help-circle'}"></ha-icon>
                        <div class="entity-details">
                          <div class="entity-name">${entity.attributes.friendly_name || entity.entity_id}</div>
                          <div class="entity-id">${entity.entity_id}</div>
                        </div>
                      </div>
                      ${this.config.timer === entity.entity_id ?
                        html`<ha-icon icon="mdi:check" class="check-icon"></ha-icon>` : ''}
                    </div>
                  `)}
                  ${this._filteredTimerEntities.length === 0 ? html`
                    <div class="no-results">未找到匹配的实体</div>
                  ` : ''}
                </div>
              ` : ''}
            </div>
            <button class="remove-button" @click=${this._removeTimer} title="移除定时器">
              <ha-icon icon="mdi:close"></ha-icon>
            </button>
          </div>
        </div>

        <!-- 按钮排 -->
        ${this._getButtonRows().map((row, rowIndex) => html`
          <div class="form-group" style="border: 1px solid #444; border-radius: 6px; padding: 10px;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
              <label style="margin: 0;">第${rowIndex + 1}排按钮</label>
              <button class="remove-button" @click=${() => this._removeButtonRow(rowIndex)} title="移除此排" style="margin: 0; padding: 2px 6px;">
                <ha-icon icon="mdi:delete"></ha-icon>
              </button>
            </div>
            ${(row.items || []).map((item, itemIndex) => {
              const itemDomain = item.entity ? item.entity.split('.')[0] : '';
              return html`
              <div class="form-group" style="margin-bottom: 8px; padding: 6px; background: rgba(255,255,255,0.05); border-radius: 4px;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
                  <span style="font-size: 0.85em; opacity: 0.8;">第${itemIndex + 1}个功能</span>
                  <button class="remove-button" @click=${() => this._removeButtonRowItem(rowIndex, itemIndex)} title="移除此功能" style="margin: 0; padding: 2px 6px;">
                    <ha-icon icon="mdi:close"></ha-icon>
                  </button>
                </div>
                <div style="display: flex; gap: 8px; align-items: center; margin-bottom: 4px;">
                  <label style="font-size: 0.8em; min-width: 60px;">显示方式</label>
                  <select
                    @change=${(e) => this._buttonRowModeChanged(rowIndex, itemIndex, e.target.value)}
                    .value=${item.mode || 'button'}
                    style="flex: 1; padding: 4px 0; border: 1px solid #555; border-radius: 4px; background: var(--card-background-color, #1c1c1c); color: var(--primary-text-color, #fff);"
                  >
                    <option value="button">按钮</option>
                    <option value="slider">数值调节</option>
                    <option value="sun_slider">滑动条</option>
                    <option value="service">服务按钮</option>
                  </select>
                </div>
                ${item.mode !== 'service' ? html`
                <div style="display: flex; gap: 8px; align-items: center; margin-bottom: 4px;">
                  <label style="font-size: 0.8em; min-width: 60px;">功能实体</label>
                  <div class="entity-selector" style="flex: 1;">
                    <input
                      type="text"
                      @input=${(e) => this._onButtonRowSearch(e, rowIndex, itemIndex)}
                      @focus=${(e) => this._onButtonRowSearch(e, rowIndex, itemIndex)}
                      .value=${this._buttonRowSearchTerms?.[`${rowIndex}-${itemIndex}`] || item.entity || ''}
                      placeholder="搜索实体..."
                      class="entity-search-input"
                    />
                    ${this._showButtonRowLists?.[`${rowIndex}-${itemIndex}`] ? html`
                      <div class="entity-dropdown">
                        ${this._filteredButtonRowEntities?.[`${rowIndex}-${itemIndex}`]?.map(entity => html`
                          <div
                            class="entity-option ${item.entity === entity.entity_id ? 'selected' : ''}"
                            @click=${() => this._selectButtonRowEntity(entity.entity_id, rowIndex, itemIndex)}
                          >
                            <div class="entity-info">
                              <ha-icon icon="${entity.attributes.icon || 'mdi:help-circle'}"></ha-icon>
                              <div class="entity-details">
                                <div class="entity-name">${entity.attributes.friendly_name || entity.entity_id}</div>
                                <div class="entity-id">${entity.entity_id}</div>
                              </div>
                            </div>
                            ${item.entity === entity.entity_id ?
                              html`<ha-icon icon="mdi:check" class="check-icon"></ha-icon>` : ''}
                          </div>
                        `)}
                        ${this._filteredButtonRowEntities?.[`${rowIndex}-${itemIndex}`]?.length === 0 ? html`
                          <div class="no-results">未找到匹配的实体</div>
                        ` : ''}
                      </div>
                    ` : ''}
                  </div>
                </div>
                ` : ''}
                ${item.mode === 'service' ? html`
                <div style="display: flex; gap: 8px; align-items: flex-start; margin-bottom: 4px;">
                  <label style="font-size: 0.8em; min-width: 60px; margin-top: 4px;">调用动作</label>
                  <textarea
                    .value=${item.service_action || ''}
                    @change=${(e) => this._buttonRowFieldChanged(rowIndex, itemIndex, 'service_action', e.target.value)}
                    placeholder="action: vacuum.send_command&#10;data:&#10;  command: set_dnd_timer&#10;  params:&#10;    key: value"
                    rows="5"
                    style="flex: 1; padding: 4px 0; border: 1px solid #555; border-radius: 4px; background: var(--card-background-color, #1c1c1c); color: var(--primary-text-color, #fff); font-family: monospace; font-size: 0.85em; resize: vertical;"
                  ></textarea>
                </div>
                <div class="hint" style="margin-bottom: 4px;">输入YAML格式的服务调用动作，action为域名.服务名，data为服务数据</div>
                ` : ''}
                ${itemDomain === 'vacuum' || itemDomain === 'fan' || itemDomain === 'select' || itemDomain === 'input_select' || itemDomain === 'cover' ? html`
                <div style="display: flex; gap: 8px; align-items: center; margin-bottom: 4px;">
                  <label style="font-size: 0.8em; min-width: 50px;">显示名称</label>
                  <select
                    .value=${item.show_name !== false ? 'true' : 'false'}
                    @change=${(e) => this._buttonRowShowNameChanged(rowIndex, itemIndex, e.target.value)}
                    style="width: 50px; padding: 4px 0; border: 1px solid #555; border-radius: 4px; background: var(--card-background-color, #1c1c1c); color: var(--primary-text-color, #fff);"
                  >
                    <option value="false" ?selected=${item.show_name === false}>隐藏</option>
                    <option value="true" ?selected=${item.show_name !== false}>显示</option>
                  </select>
                  <label style="font-size: 0.8em; min-width: 50px;">显示图标</label>
                  <select
                    .value=${item.show_icon !== false ? 'true' : 'false'}
                    @change=${(e) => this._buttonRowShowIconChanged(rowIndex, itemIndex, e.target.value)}
                    style="width: 50px; padding: 4px 0; border: 1px solid #555; border-radius: 4px; background: var(--card-background-color, #1c1c1c); color: var(--primary-text-color, #fff);"
                  >
                    <option value="false" ?selected=${item.show_icon === false}>隐藏</option>
                    <option value="true" ?selected=${item.show_icon !== false}>显示</option>
                  </select>
                </div>
                ` : html`
                <div style="display: flex; gap: 8px; align-items: center; margin-bottom: 4px;">
                  <label style="font-size: 0.8em; min-width: 50px;">显示名称</label>
                  <select
                    .value=${item.show_name !== false ? 'true' : 'false'}
                    @change=${(e) => this._buttonRowShowNameChanged(rowIndex, itemIndex, e.target.value)}
                    style="width: 50px; padding: 4px 0; border: 1px solid #555; border-radius: 4px; background: var(--card-background-color, #1c1c1c); color: var(--primary-text-color, #fff);"
                  >
                    <option value="false" ?selected=${item.show_name === false}>隐藏</option>
                    <option value="true" ?selected=${item.show_name !== false}>显示</option>
                  </select>
                  <label style="font-size: 0.8em;">名称重定义</label>
                  <input
                    type="text"
                    .value=${item.custom_name || ''}
                    @change=${(e) => this._buttonRowFieldChanged(rowIndex, itemIndex, 'custom_name', e.target.value)}
                    placeholder="${item.mode === 'service' ? '按钮显示名称' : '留空使用实体名'}"
                    style="flex: 1; padding: 4px 0; border: 1px solid #555; border-radius: 4px; background: var(--card-background-color, #1c1c1c); color: var(--primary-text-color, #fff);"
                  />
                </div>
                <div style="display: flex; gap: 8px; align-items: center; margin-bottom: 4px;">
                  <label style="font-size: 0.8em; min-width: 50px;">显示图标</label>
                  <select
                    .value=${item.show_icon !== false ? 'true' : 'false'}
                    @change=${(e) => this._buttonRowShowIconChanged(rowIndex, itemIndex, e.target.value)}
                    style="width: 50px; padding: 4px 0; border: 1px solid #555; border-radius: 4px; background: var(--card-background-color, #1c1c1c); color: var(--primary-text-color, #fff);"
                  >
                    <option value="false" ?selected=${item.show_icon === false}>隐藏</option>
                    <option value="true" ?selected=${item.show_icon !== false}>显示</option>
                  </select>
                  <label style="font-size: 0.8em;">图标重定义</label>
                  <input
                    type="text"
                    .value=${this._formatCustomIcons(item.custom_icons || {})}
                    @change=${(e) => this._buttonRowCustomIconsChanged(rowIndex, itemIndex, e.target.value)}
                    placeholder=${item.mode === 'service' ? '如 default:mdi:play-circle-outline' : itemDomain === 'fan' ? '如 speed_off:mdi:fan-off,低:mdi:fan-speed-1' : itemDomain === 'cover' ? '如 open:mdi:arrow-up,close:mdi:arrow-down' : itemDomain === 'vacuum' ? '如 start:mdi:play,pause:mdi:pause' : itemDomain === 'select' || itemDomain === 'input_select' ? '如 选项key:mdi:icon' : itemDomain === 'lock' ? '如 locked:mdi:lock,unlocked:mdi:lock-open' : '如 on:mdi:toggle-switch,off:mdi:toggle-switch-off'}
                    style="flex: 1; padding: 4px 0; border: 1px solid #555; border-radius: 4px; background: var(--card-background-color, #1c1c1c); color: var(--primary-text-color, #fff);"
                  />
                </div>
                `}
                ${itemDomain === 'select' || itemDomain === 'input_select' ? html`
                <div style="display: flex; gap: 8px; align-items: center; margin-bottom: 4px;">
                  <label style="font-size: 0.8em; min-width: 60px;">选项标签</label>
                  <input
                    type="text"
                    .value=${item.select_label || ''}
                    @change=${(e) => this._buttonRowFieldChanged(rowIndex, itemIndex, 'select_label', e.target.value)}
                    placeholder="留空不显示，如: 模式"
                    style="flex: 1; padding: 4px 0; border: 1px solid #555; border-radius: 4px; background: var(--card-background-color, #1c1c1c); color: var(--primary-text-color, #fff);"
                  />
                </div>
                ${(this.hass?.states?.[item.entity]?.attributes?.options || []).map(opt => { const sub = (item.sub_items || {})[opt] || {}; return html`
                <div style="border: 1px solid #444; border-radius: 4px; padding: 4px 6px; margin-bottom: 4px;">
                  <div style="font-size: 0.75em; color: #aaa; margin-bottom: 2px;">${opt}(${translateOption(opt, this.config.translation_priority)})</div>
                  <div style="display: flex; gap: 6px; align-items: center; margin-bottom: 2px;">
                    <label style="font-size: 0.75em;">显示</label>
                    <input type="checkbox" .checked=${sub.visible !== false} @change=${(e) => this._buttonRowSubItemChanged(rowIndex, itemIndex, opt, 'visible', e.target.checked)} />
                    <label style="font-size: 0.75em;">名称</label>
                    <input type="checkbox" .checked=${sub.show_name !== false} @change=${(e) => this._buttonRowSubItemChanged(rowIndex, itemIndex, opt, 'show_name', e.target.checked)} />
                    <input type="text" .value=${sub.custom_name || ''} @change=${(e) => this._buttonRowSubItemChanged(rowIndex, itemIndex, opt, 'custom_name', e.target.value)} placeholder="名称" style="flex: 1; padding: 2px 4px; border: 1px solid #555; border-radius: 3px; background: var(--card-background-color, #1c1c1c); color: var(--primary-text-color, #fff); font-size: 0.8em;" />
                  </div>
                  <div style="display: flex; gap: 6px; align-items: center;">
                    <label style="font-size: 0.75em;">图标</label>
                    <input type="checkbox" .checked=${sub.show_icon !== false} @change=${(e) => this._buttonRowSubItemChanged(rowIndex, itemIndex, opt, 'show_icon', e.target.checked)} />
                    <input type="text" .value=${sub.custom_icon || ''} @change=${(e) => this._buttonRowSubItemChanged(rowIndex, itemIndex, opt, 'custom_icon', e.target.value)} placeholder="mdi:icon" style="flex: 1; padding: 2px 4px; border: 1px solid #555; border-radius: 3px; background: var(--card-background-color, #1c1c1c); color: var(--primary-text-color, #fff); font-size: 0.8em;" />
                  </div>
                </div>
                `; })}
                ` : ''}
                ${itemDomain === 'fan' ? html`
                <div style="display: flex; gap: 8px; align-items: center; margin-bottom: 4px;">
                  <label style="font-size: 0.8em; min-width: 60px;">选项标签</label>
                  <input
                    type="text"
                    .value=${item.fan_label || ''}
                    @change=${(e) => this._buttonRowFieldChanged(rowIndex, itemIndex, 'fan_label', e.target.value)}
                    placeholder="留空不显示，如: 风模式"
                    style="flex: 1; padding: 4px 0; border: 1px solid #555; border-radius: 4px; background: var(--card-background-color, #1c1c1c); color: var(--primary-text-color, #fff);"
                  />
                </div>
                ${(this.hass?.states?.[item.entity]?.attributes?.preset_modes || []).length > 0 ? (this.hass?.states?.[item.entity]?.attributes?.preset_modes || []).map(mode => { const sub = (item.sub_items || {})[mode] || {}; return html`
                <div style="border: 1px solid #444; border-radius: 4px; padding: 4px 6px; margin-bottom: 4px;">
                  <div style="font-size: 0.75em; color: #aaa; margin-bottom: 2px;">${mode}</div>
                  <div style="display: flex; gap: 6px; align-items: center; margin-bottom: 2px;">
                    <label style="font-size: 0.75em;">显示</label>
                    <input type="checkbox" .checked=${sub.visible !== false} @change=${(e) => this._buttonRowSubItemChanged(rowIndex, itemIndex, mode, 'visible', e.target.checked)} />
                    <label style="font-size: 0.75em;">名称</label>
                    <input type="checkbox" .checked=${sub.show_name !== false} @change=${(e) => this._buttonRowSubItemChanged(rowIndex, itemIndex, mode, 'show_name', e.target.checked)} />
                    <input type="text" .value=${sub.custom_name || ''} @change=${(e) => this._buttonRowSubItemChanged(rowIndex, itemIndex, mode, 'custom_name', e.target.value)} placeholder="名称" style="flex: 1; padding: 2px 4px; border: 1px solid #555; border-radius: 3px; background: var(--card-background-color, #1c1c1c); color: var(--primary-text-color, #fff); font-size: 0.8em;" />
                  </div>
                  <div style="display: flex; gap: 6px; align-items: center;">
                    <label style="font-size: 0.75em;">图标</label>
                    <input type="checkbox" .checked=${sub.show_icon !== false} @change=${(e) => this._buttonRowSubItemChanged(rowIndex, itemIndex, mode, 'show_icon', e.target.checked)} />
                    <input type="text" .value=${sub.custom_icon || ''} @change=${(e) => this._buttonRowSubItemChanged(rowIndex, itemIndex, mode, 'custom_icon', e.target.value)} placeholder="mdi:icon" style="flex: 1; padding: 2px 4px; border: 1px solid #555; border-radius: 3px; background: var(--card-background-color, #1c1c1c); color: var(--primary-text-color, #fff); font-size: 0.8em;" />
                  </div>
                </div>
                `; }) : ['speed_off','speed_low','speed_mid','speed_high'].map(speed => { const sub = (item.sub_items || {})[speed] || {}; const speedLabels = {speed_off:'关闭',speed_low:'低',speed_mid:'中',speed_high:'高'}; return html`
                <div style="border: 1px solid #444; border-radius: 4px; padding: 4px 6px; margin-bottom: 4px;">
                  <div style="font-size: 0.75em; color: #aaa; margin-bottom: 2px;">${speedLabels[speed]}</div>
                  <div style="display: flex; gap: 6px; align-items: center; margin-bottom: 2px;">
                    <label style="font-size: 0.75em;">显示</label>
                    <input type="checkbox" .checked=${sub.visible !== false} @change=${(e) => this._buttonRowSubItemChanged(rowIndex, itemIndex, speed, 'visible', e.target.checked)} />
                    <label style="font-size: 0.75em;">名称</label>
                    <input type="checkbox" .checked=${sub.show_name !== false} @change=${(e) => this._buttonRowSubItemChanged(rowIndex, itemIndex, speed, 'show_name', e.target.checked)} />
                    <input type="text" .value=${sub.custom_name || ''} @change=${(e) => this._buttonRowSubItemChanged(rowIndex, itemIndex, speed, 'custom_name', e.target.value)} placeholder="名称" style="flex: 1; padding: 2px 4px; border: 1px solid #555; border-radius: 3px; background: var(--card-background-color, #1c1c1c); color: var(--primary-text-color, #fff); font-size: 0.8em;" />
                  </div>
                  <div style="display: flex; gap: 6px; align-items: center;">
                    <label style="font-size: 0.75em;">图标</label>
                    <input type="checkbox" .checked=${sub.show_icon !== false} @change=${(e) => this._buttonRowSubItemChanged(rowIndex, itemIndex, speed, 'show_icon', e.target.checked)} />
                    <input type="text" .value=${sub.custom_icon || ''} @change=${(e) => this._buttonRowSubItemChanged(rowIndex, itemIndex, speed, 'custom_icon', e.target.value)} placeholder="mdi:icon" style="flex: 1; padding: 2px 4px; border: 1px solid #555; border-radius: 3px; background: var(--card-background-color, #1c1c1c); color: var(--primary-text-color, #fff); font-size: 0.8em;" />
                  </div>
                </div>
                `; })}
                ` : ''}
                ${itemDomain === 'vacuum' ? html`
                ${['start','stop','pause','return_to_base'].map(action => { const sub = (item.sub_items || {})[action] || {}; const actionLabels = {start:'启动',stop:'停止',pause:'暂停',return_to_base:'回基站'}; return html`
                <div style="border: 1px solid #444; border-radius: 4px; padding: 4px 6px; margin-bottom: 4px;">
                  <div style="font-size: 0.75em; color: #aaa; margin-bottom: 2px;">${actionLabels[action]}</div>
                  <div style="display: flex; gap: 6px; align-items: center; margin-bottom: 2px;">
                    <label style="font-size: 0.75em;">显示</label>
                    <input type="checkbox" .checked=${sub.visible !== false} @change=${(e) => this._buttonRowSubItemChanged(rowIndex, itemIndex, action, 'visible', e.target.checked)} />
                    <label style="font-size: 0.75em;">名称</label>
                    <input type="checkbox" .checked=${sub.show_name !== false} @change=${(e) => this._buttonRowSubItemChanged(rowIndex, itemIndex, action, 'show_name', e.target.checked)} />
                    <input type="text" .value=${sub.custom_name || ''} @change=${(e) => this._buttonRowSubItemChanged(rowIndex, itemIndex, action, 'custom_name', e.target.value)} placeholder="名称" style="flex: 1; padding: 2px 4px; border: 1px solid #555; border-radius: 3px; background: var(--card-background-color, #1c1c1c); color: var(--primary-text-color, #fff); font-size: 0.8em;" />
                  </div>
                  <div style="display: flex; gap: 6px; align-items: center;">
                    <label style="font-size: 0.75em;">图标</label>
                    <input type="checkbox" .checked=${sub.show_icon !== false} @change=${(e) => this._buttonRowSubItemChanged(rowIndex, itemIndex, action, 'show_icon', e.target.checked)} />
                    <input type="text" .value=${sub.custom_icon || ''} @change=${(e) => this._buttonRowSubItemChanged(rowIndex, itemIndex, action, 'custom_icon', e.target.value)} placeholder="mdi:icon" style="flex: 1; padding: 2px 4px; border: 1px solid #555; border-radius: 3px; background: var(--card-background-color, #1c1c1c); color: var(--primary-text-color, #fff); font-size: 0.8em;" />
                  </div>
                </div>
                `; })}
                ` : ''}
                ${itemDomain === 'cover' ? html`
                ${['open','stop','close'].map(action => { const sub = (item.sub_items || {})[action] || {}; const actionLabels = {open:'打开',stop:'停止',close:'关闭'}; return html`
                <div style="border: 1px solid #444; border-radius: 4px; padding: 4px 6px; margin-bottom: 4px;">
                  <div style="font-size: 0.75em; color: #aaa; margin-bottom: 2px;">${actionLabels[action]}</div>
                  <div style="display: flex; gap: 6px; align-items: center; margin-bottom: 2px;">
                    <label style="font-size: 0.75em;">显示</label>
                    <input type="checkbox" .checked=${sub.visible !== false} @change=${(e) => this._buttonRowSubItemChanged(rowIndex, itemIndex, action, 'visible', e.target.checked)} />
                    <label style="font-size: 0.75em;">名称</label>
                    <input type="checkbox" .checked=${sub.show_name !== false} @change=${(e) => this._buttonRowSubItemChanged(rowIndex, itemIndex, action, 'show_name', e.target.checked)} />
                    <input type="text" .value=${sub.custom_name || ''} @change=${(e) => this._buttonRowSubItemChanged(rowIndex, itemIndex, action, 'custom_name', e.target.value)} placeholder="名称" style="flex: 1; padding: 2px 4px; border: 1px solid #555; border-radius: 3px; background: var(--card-background-color, #1c1c1c); color: var(--primary-text-color, #fff); font-size: 0.8em;" />
                  </div>
                  <div style="display: flex; gap: 6px; align-items: center;">
                    <label style="font-size: 0.75em;">图标</label>
                    <input type="checkbox" .checked=${sub.show_icon !== false} @change=${(e) => this._buttonRowSubItemChanged(rowIndex, itemIndex, action, 'show_icon', e.target.checked)} />
                    <input type="text" .value=${sub.custom_icon || ''} @change=${(e) => this._buttonRowSubItemChanged(rowIndex, itemIndex, action, 'custom_icon', e.target.value)} placeholder="mdi:icon" style="flex: 1; padding: 2px 4px; border: 1px solid #555; border-radius: 3px; background: var(--card-background-color, #1c1c1c); color: var(--primary-text-color, #fff); font-size: 0.8em;" />
                  </div>
                </div>
                `; })}
                ` : ''}
                ${itemDomain === 'sensor' || itemDomain === 'binary_sensor' ? html`
                <div style="display: flex; gap: 8px; align-items: center; margin-bottom: 4px;">
                  <label style="font-size: 0.8em; min-width: 60px;">实体值重定义</label>
                  <input
                    type="text"
                    .value=${this._formatSelectOptionNames(item.sensor_value_names || {})}
                    @change=${(e) => this._buttonRowSensorValueNamesChanged(rowIndex, itemIndex, e.target.value)}
                    placeholder="值:显示名, 如 on:有人,off:无人"
                    style="flex: 1; padding: 4px 0; border: 1px solid #555; border-radius: 4px; background: var(--card-background-color, #1c1c1c); color: var(--primary-text-color, #fff);"
                  />
                </div>
                ` : ''}
                ${itemDomain === 'text' || itemDomain === 'input_text' ? html`
                <div style="display: flex; gap: 8px; align-items: center; margin-bottom: 4px;">
                  <label style="font-size: 0.8em; min-width: 60px;">自定义指令</label>
                  <input
                    type="text"
                    .value=${item.custom_command || ''}
                    @change=${(e) => this._buttonRowFieldChanged(rowIndex, itemIndex, 'custom_command', e.target.value)}
                    placeholder="点击时执行的值"
                    style="flex: 1; padding: 4px 0; border: 1px solid #555; border-radius: 4px; background: var(--card-background-color, #1c1c1c); color: var(--primary-text-color, #fff);"
                  />
                </div>
                ` : ''}
              </div>
            `})}
            <div class="buttons-row">
              <mwc-button
                class="add-button"
                @click=${() => this._addButtonRowItem(rowIndex)}
                outlined
              >
                增加第${(row.items || []).length + 1}个功能
              </mwc-button>
            </div>
          </div>
        `)}
        <div class="form-group">
          <div class="buttons-row">
            <mwc-button
              class="add-button"
              @click=${this._addButtonRow}
              outlined
            >
              增加第${this._getButtonRows().length + 1}排按钮
            </mwc-button>
          </div>
        </div>

        <!-- 附加按钮1 -->
        <div class="form-group">
          <label>附加按钮1 (最多7个)</label>
          ${(this.config.buttons || []).map((buttonObj, index) => {
            const buttonEntityId = typeof buttonObj === 'string' ? buttonObj : (buttonObj?.entity || '');
            const buttonName = typeof buttonObj === 'object' && buttonObj !== null ? (buttonObj.name || '') : '';
            return html`
            <div style="border: 1px solid #444; border-radius: 6px; padding: 8px; margin-bottom: 6px;">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
                <span style="font-size: 0.85em; opacity: 0.8;">按钮${index + 1}</span>
                <button class="remove-button" @click=${() => this._removeButton(index)} title="移除" style="margin: 0; padding: 2px 6px;">
                  <ha-icon icon="mdi:close"></ha-icon>
                </button>
              </div>
              <div class="entity-selector" style="margin-bottom: 4px;">
                <input
                  type="text"
                  @input=${(e) => this._onButtonSearch(e, index)}
                  @focus=${(e) => this._onButtonSearch(e, index)}
                  .value=${this._buttonSearchTerms?.[index] || buttonEntityId || ''}
                  placeholder="搜索实体..."
                  class="entity-search-input"
                />
                ${this._showButtonLists?.[index] ? html`
                  <div class="entity-dropdown">
                    ${this._filteredButtonEntities?.[index]?.map(entity => html`
                      <div
                        class="entity-option ${buttonEntityId === entity.entity_id ? 'selected' : ''}"
                        @click=${() => this._selectButtonEntity(entity.entity_id, index)}
                      >
                        <div class="entity-info">
                          <ha-icon icon="${entity.attributes.icon || 'mdi:help-circle'}"></ha-icon>
                          <div class="entity-details">
                            <div class="entity-name">${entity.attributes.friendly_name || entity.entity_id}</div>
                            <div class="entity-id">${entity.entity_id}</div>
                          </div>
                        </div>
                        ${buttonEntityId === entity.entity_id ?
                          html`<ha-icon icon="mdi:check" class="check-icon"></ha-icon>` : ''}
                      </div>
                    `)}
                    ${this._filteredButtonEntities?.[index]?.length === 0 ? html`
                      <div class="no-results">未找到匹配的实体</div>
                    ` : ''}
                  </div>
                ` : ''}
              </div>
              <div style="display: flex; gap: 8px; align-items: center;">
                <label style="font-size: 0.8em; min-width: 60px;">名称重定义</label>
                <input
                  type="text"
                  .value=${buttonName}
                  @change=${(e) => this._buttonNameChanged(index, e.target.value)}
                  placeholder="留空使用实体名"
                  style="flex: 1; padding: 4px 0; border: 1px solid #555; border-radius: 4px; background: var(--card-background-color, #1c1c1c); color: var(--primary-text-color, #fff);"
                />
              </div>
            </div>
          `})}
          <div class="buttons-row">
            <mwc-button
              class="add-button"
              @click=${this._addButton}
              outlined
            >
              添加按钮1
            </mwc-button>
          </div>
          <div class="help-text">第一排附加按钮，最多支持7个</div>
        </div>

        <!-- 附加按钮2 -->
        <div class="form-group">
          <label>附加按钮2 (最多7个)</label>
          ${(this.config.buttons2 || []).map((buttonObj, index) => {
            const buttonEntityId = typeof buttonObj === 'string' ? buttonObj : (buttonObj?.entity || '');
            const buttonName = typeof buttonObj === 'object' && buttonObj !== null ? (buttonObj.name || '') : '';
            return html`
            <div style="border: 1px solid #444; border-radius: 6px; padding: 8px; margin-bottom: 6px;">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
                <span style="font-size: 0.85em; opacity: 0.8;">按钮${index + 1}</span>
                <button class="remove-button" @click=${() => this._removeButton2(index)} title="移除" style="margin: 0; padding: 2px 6px;">
                  <ha-icon icon="mdi:close"></ha-icon>
                </button>
              </div>
              <div class="entity-selector" style="margin-bottom: 4px;">
                <input
                  type="text"
                  @input=${(e) => this._onButton2Search(e, index)}
                  @focus=${(e) => this._onButton2Search(e, index)}
                  .value=${this._button2SearchTerms?.[index] || buttonEntityId || ''}
                  placeholder="搜索实体..."
                  class="entity-search-input"
                />
                ${this._showButton2Lists?.[index] ? html`
                  <div class="entity-dropdown">
                    ${this._filteredButton2Entities?.[index]?.map(entity => html`
                      <div
                        class="entity-option ${buttonEntityId === entity.entity_id ? 'selected' : ''}"
                        @click=${() => this._selectButton2Entity(entity.entity_id, index)}
                      >
                        <div class="entity-info">
                          <ha-icon icon="${entity.attributes.icon || 'mdi:help-circle'}"></ha-icon>
                          <div class="entity-details">
                            <div class="entity-name">${entity.attributes.friendly_name || entity.entity_id}</div>
                            <div class="entity-id">${entity.entity_id}</div>
                          </div>
                        </div>
                        ${buttonEntityId === entity.entity_id ?
                          html`<ha-icon icon="mdi:check" class="check-icon"></ha-icon>` : ''}
                      </div>
                    `)}
                    ${this._filteredButton2Entities?.[index]?.length === 0 ? html`
                      <div class="no-results">未找到匹配的实体</div>
                    ` : ''}
                  </div>
                ` : ''}
              </div>
              <div style="display: flex; gap: 8px; align-items: center;">
                <label style="font-size: 0.8em; min-width: 60px;">名称重定义</label>
                <input
                  type="text"
                  .value=${buttonName}
                  @change=${(e) => this._button2NameChanged(index, e.target.value)}
                  placeholder="留空使用实体名"
                  style="flex: 1; padding: 4px 0; border: 1px solid #555; border-radius: 4px; background: var(--card-background-color, #1c1c1c); color: var(--primary-text-color, #fff);"
                />
              </div>
            </div>
          `})}
          <div class="buttons-row">
            <mwc-button
              class="add-button"
              @click=${this._addButton2}
              outlined
            >
              添加按钮2
            </mwc-button>
          </div>
          <div class="help-text">第二排附加按钮，最多支持7个</div>
        </div>


      </div>
    `;
  }

  _removeTemperature() {
    if (!this.config) return;

    this._temperatureSearchTerm = '';
    this._showTemperatureList = false;
    this._filteredTemperatureEntities = [];

    this.config = {
      ...this.config,
      temperature: undefined
    };
    this._fireEvent();
    this.requestUpdate();
  }

  _removeTimer() {
    if (!this.config) return;

    this._timerSearchTerm = '';
    this._showTimerList = false;
    this._filteredTimerEntities = [];

    this.config = {
      ...this.config,
      timer: undefined
    };
    this._fireEvent();
    this.requestUpdate();
  }

  _themeSelectChanged(e) {
    if (!this.config) return;
    const theme = e.target.value;

    this.config = {
      ...this.config,
      theme
    };
    this._fireEvent();
  }

  _widthChanged(e) {
    if (!this.config) return;
    const { name, value } = e.target;

    let finalValue = value;

    if (name === 'width') {
      finalValue = value || '100%';
    }

    this.config = {
      ...this.config,
      [name]: finalValue
    };
    this._fireEvent();
  }

  _fireEvent() {
    this.dispatchEvent(new CustomEvent('config-changed', {
      detail: { config: this.config }
    }));
  }


  static getDefaultIcon(domain, key) {
    const icons = {
      fan: {
        speed_off: 'mdi:fan-off', speed_low: 'mdi:fan-speed-1', speed_mid: 'mdi:fan-speed-2', speed_high: 'mdi:fan-speed-3',
      },
      cover: { open: 'mdi:arrow-up', stop: 'mdi:stop', close: 'mdi:arrow-down' },
      vacuum: { start: 'mdi:play', stop: 'mdi:stop', pause: 'mdi:pause', return_to_base: 'mdi:home-map-marker' },
      lock: { locked: 'mdi:lock', unlocked: 'mdi:lock-open' },
      light: { on: 'mdi:lightbulb-on', off: 'mdi:lightbulb-off' },
      switch: { on: 'mdi:toggle-switch', off: 'mdi:toggle-switch-off' },
      input_boolean: { on: 'mdi:toggle-switch', off: 'mdi:toggle-switch-off' },
      sensor: { default: 'mdi:gauge' },
      binary_sensor: { on: 'mdi:radiobox-marked', off: 'mdi:radiobox-blank' },
      button: { default: 'mdi:button-pointer' },
      input_button: { default: 'mdi:button-pointer' },
      text: { default: 'mdi:form-textbox' },
      input_text: { default: 'mdi:form-textbox' },
      service: { default: 'mdi:play-circle-outline' },
    };
    const domainIcons = icons[domain];
    if (!domainIcons) return '';
    return domainIcons[key] || domainIcons.default || '';
  }

  constructor() {
    super();
    this._searchTerm = '';
    this._filteredEntities = [];
    this._showEntityList = false;
    this._temperatureSearchTerm = '';
    this._filteredTemperatureEntities = [];
    this._showTemperatureList = false;
    this._timerSearchTerm = '';
    this._filteredTimerEntities = [];
    this._showTimerList = false;
    this._buttonSearchTerms = {};
    this._filteredButtonEntities = {};
    this._showButtonLists = {};
    this._button2SearchTerms = {};
    this._filteredButton2Entities = {};
    this._showButton2Lists = {};
    this._buttonRowSearchTerms = {};
    this._filteredButtonRowEntities = {};
    this._showButtonRowLists = {};
  }
}
customElements.define('xiaoshi-phone-other-card-editor', XiaoshiPhoneOtherCardEditor);

class XiaoshiPhoneOtherCard extends LitElement {
  static get properties() { 
    return {
      hass: { type: Object },
      width: { type: String, attribute: true },
      config: { type: Object },
      button_rows: { type: Array },
      buttons: { type: Array },
      buttons2: { type: Array },
      theme: { type: String },
      _timerInterval: { state: true },

      temperatureData: { type: Array },
      _externalTempSensor: { type: String },
      translation_priority: { type: String }
    };
  }
  static getConfigElement() {
    return document.createElement("xiaoshi-phone-other-card-editor");
  }

  static getStubConfig() {
    return {
    };
  }

  setConfig(config) {
    this.config = config;
    this.button_rows = config.button_rows || [];
    // 向后兼容：buttons/buttons2 支持字符串和对象两种格式
    this.buttons = (config.buttons || []).map(b => typeof b === 'string' ? { entity: b, name: '' } : b);
    this.buttons2 = (config.buttons2 || []).map(b => typeof b === 'string' ? { entity: b, name: '' } : b);
    this._externalTempSensor = config.temperature || null;
    if (config.width !== undefined) this.width = config.width;
    this.translation_priority = config.translation_priority || '洗碗机';
    this.requestUpdate();
  }
  
  static get styles() { 
    return css`
      :host {
        display: block;
        contain: content;
      }
      
      .card {
        position: relative;
        border-radius: 12px;
        overflow: hidden;
        box-sizing: border-box;
      }
      
      .content-container {
        position: relative;
        z-index: 1;
        height: 100%;
        display: grid;
        grid-template-areas: 
            "name status power"
            "icon br1 br1"
            "icon spacer1 spacer1"
            "icon br2 br2"
            "icon spacer2 spacer2"
            "icon br3 br3"
            "icon spacer3 spacer3"
            "icon br4 br4"
            "icon spacer4 spacer4"
            "icon br5 br5"
            "icon spacer5 spacer5"
            "icon br6 br6"
            "icon spacer6 spacer6"
            "icon br7 br7"
            "icon spacer7 spacer7"
            "icon br8 br8"
            "icon spacer8 spacer8"
            "icon br9 br9"
            "icon spacer9 spacer9"
            "icon br10 br10"
            "icon spacer10 spacer10"
            "icon timer timer"
            "icon extra extra"
            "icon extra2 extra2"
            "a a a"; 
        grid-template-columns: 25% 60% 13%;
      }

      .active-gradient {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: linear-gradient(to right, var(--linear-color));
        opacity: 0.4;
        z-index: 0;
      }

      #chart-container {
        position: absolute;
        bottom: 0;
        left: 0;
        width: 100%;
        height: 20%;
        overflow: hidden;
        z-index: 0;
        pointer-events: none;
      }

      .name-area {
        grid-area: name;
        display: flex;
        align-items: center;
        font-size: 16px;
        font-weight: bold;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        margin-left: 10px; 
      }
      
      .status-area {
        grid-area: status;
        display: flex;
        align-items: center;
        font-size: 12px;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        margin-left: 5px; 
        gap: 1px;
        font-weight: bold;
      }
      .temp-adjust-container {
        display: inline-flex;
        align-items: center;
        gap: 1px;
      }
      .temp-adjust-button {
        background: none;
        border: none;
        cursor: pointer;
        padding: 0;
        display: flex;
        align-items: center;
        justify-content: center;
        color: var(--button);
        width: 24px;
        height: 24px;
        border-radius: 5px;
        cursor: default;
      }

      .temp-display {
        font-size: 12px;
        min-width: 35px;
        text-align: center;
        color: var(--button);
      }
      .current-temp {
        font-size: 12px;
        margin-left: 5px;
      }
      .power-area {
        grid-area: power;
        display: flex;
        justify-content: flex-end;
        align-items: center;
      }
      
      .power-button {
        background: none;
        border: none;
        cursor: pointer;
        padding: 0;
        display: flex;
        align-items: center;
        justify-content: flex-end;
        width: 100%;
        height: 35px;
        border-radius: 5px;
        cursor: default;
      }
      
      .power-icon {
        --mdc-icon-size: 30px;
        transition: all 0.3s ease;
      }

      .icon-area {
        grid-area: icon;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        height: 100%;
      }

      .main-icon-container {
        flex: 1;
        display: flex;
        align-items: center;
        justify-content: center;
        width: 100%;
      }
      
      .main-icon {
        --mdc-icon-size: 50px;
        margin-top: -3px;
        transition: transform 0.3s ease;
      }

      .timer-area, .extra-area, .extra2-area {
        display: flex;
        gap: 5px;
        width: 100%;
        height: 25px;
        margin-bottom: 5px;
      }
      
      .timer-area {
        grid-area: timer;
        display: grid;
        grid-template-columns: repeat(8, 1fr);
        gap: 5px;
      }

      .button-row-area {
        display: grid;
        gap: 5px;
      }
      
      .func-button {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        background-color: var(--button-bg);
        color: var(--button-fg);
        border: none;
        border-radius: 8px;
        cursor: default;
        min-width: 0;
        overflow: hidden;
        padding: 2px 0;
        height: 25px;
        min-height: unset;
      }
      .func-button.has-icon {
        height: 25px;
        padding: 2px 4px;
        flex-direction: row;
        gap: 3px;
      }
      .func-button.has-icon .func-button-value,
      .func-button.has-icon .func-button-text {
        font-size: 9px;
      }

      .func-button-icon {
        --mdc-icon-size: 16px;
        height: 16px;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .func-button-text {
        font-size: 10px;
        line-height: 1.2;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        max-width: 100%;
      }

      .func-button-value {
        font-size: 11px;
        font-weight: bold;
        line-height: 1.2;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        max-width: 100%;
      }

      /* 滑动条模式（sun_slider）样式 */
      .sun-slider-wrapper {
        display: flex;
        align-items: center;
        width: 100%;
        height: 100%;
        box-sizing: border-box;
        cursor: default;
      }
      .sun-slider-wrapper input[type="range"] {
        -webkit-appearance: none;
        appearance: none;
        width: 100%;
        height: 14px;
        background: transparent;
        cursor: pointer;
        margin: 0;
        padding: 0;
      }
      .sun-slider-wrapper input[type="range"]::-webkit-slider-runnable-track {
        height: 25px;
        border-radius: 8px;
        background: linear-gradient(to right, var(--slider-color, #4caf50) var(--slider-pct, 0%), var(--slider-bg, #333) var(--slider-pct, 0%));
      }
      .sun-slider-wrapper input[type="range"]::-webkit-slider-thumb {
        -webkit-appearance: none;
        appearance: none;
        width: 12px;
        height: 12px;
        margin-top: 7px;
        border-radius: 50%;
        background: white;
        box-shadow: 0 1px 3px rgba(0,0,0,0.4);
        cursor: grab;
      }
      .sun-slider-wrapper input[type="range"]::-moz-range-track {
        height: 25px;
        border-radius: 8px;
        background: var(--slider-bg, #333);
      }
      .sun-slider-wrapper input[type="range"]::-moz-range-progress {
        height: 25px;
        border-radius: 8px;
        background: var(--slider-color, #4caf50);
      }
      .sun-slider-wrapper input[type="range"]::-moz-range-thumb {
        width: 12px;
        height: 12px;
        margin-top: 7px;
        border-radius: 50%;
        background: white;
        border: none;
        box-shadow: 0 1px 3px rgba(0,0,0,0.4);
        cursor: grab;
      }

      /* 数值模式滑块样式 */
      .num-slider input[type="range"] {
        -webkit-appearance: none;
        appearance: none;
        width: 90%;
        height: 4px;
        margin: 0 0 6px 0;
        border-radius: 2px;
        background: linear-gradient(to right, var(--slider-color, #4caf50) var(--slider-pct, 0%), #fff var(--slider-pct, 0%));
        outline: none;
        cursor: pointer;
      }
      .num-slider input[type="range"]::-webkit-slider-thumb {
        -webkit-appearance: none;
        appearance: none;
        width: 12px;
        height: 12px;
        border-radius: 50%;
        background: white;
        box-shadow: 0 1px 3px rgba(0,0,0,0.4);
        cursor: grab;
      }
      .num-slider input[type="range"]::-moz-range-thumb {
        width: 12px;
        height: 12px;
        border-radius: 50%;
        background: white;
        border: none;
        box-shadow: 0 1px 3px rgba(0,0,0,0.4);
        cursor: grab;
      }
      .num-slider input[type="range"]::-moz-range-track {
        height: 4px;
        border-radius: 2px;
        background: var(--slider-bg, #555);
      }
      .num-slider input[type="range"]::-moz-range-progress {
        height: 4px;
        border-radius: 2px;
        background: var(--slider-color, #4caf50);
      }

      .select-options-row {
        display: flex;
        gap: 3px;
        width: 100%;
      }

      .select-option-btn {
        flex: 1;
        padding: 2px 4px;
        border: none;
        border-radius: 5px;
        font-size: 9px;
        line-height: 1.2;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        cursor: pointer;
        background: rgba(255,255,255,0.1);
        color: var(--button-fg);
        text-align: center;
        min-width: 0;
      }

      .select-option-btn.active-option {
        color: var(--button-bg);
        font-weight: bold;
      }
      
      .timer-button {
        display: flex;
        align-items: center;
        justify-content: center;
        background-color: var(--button-bg);
        color: var(--button-fg);
        border: none;
        border-radius: 8px;
        cursor: pointer;
        font-size: 10px;
        min-width: 0;
        overflow: hidden;
        padding: 0 2px;
        cursor: default;
      }
      
      .timer-display {
        grid-column: span 2;
        display: flex;
        align-items: center;
        justify-content: center;
        background-color: var(--button-bg);
        color: var(--button-fg);
        border-radius: 8px;
        font-size: 10px;
        font-weight: bold;
        font-family: monospace;
      }
      
      .extra-area {
        grid-area: extra;
        display: grid;
        gap: 5px;
      }

      .extra2-area {
        grid-area: extra2;
        display: grid;
        gap: 5px;
      }

      .extra-button {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        background-color: rgb(0,0,0,0);
        color: var(--button);
        border: none;
        cursor: default;
        min-width: 0;
        overflow: visible;
        height: 100%;
        padding: 0;
      }
      
      .extra-button-content {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        height: 100%;
        line-height: 1;
        cursor: default;
      } 
        
      .extra-button-icon {
        --mdc-icon-size: 27px;
        height: 24px;
        display: flex;
        align-items: center;
        justify-content: center;
        margin-bottom: -4px;
        cursor: default;
      }
      
      .extra-button-value {
        height: 24px;
        display: flex;
        align-items: center;
        justify-content: center;
        margin-bottom: -4px;
        font-size: 11px;
        font-weight: bold;
        line-height: 1.5;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        max-width: 100%;
        cursor: default;
      }
        
      .extra-button-text {
        font-size: 10px;
        line-height: 1.2;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        max-width: 100%;
        height: auto;
        cursor: default;
      }

      .active-extra {
        color: var(--active-color) !important;
        background-color: var(--active-color) !important;
      }

      .select-active {
        color: var(--select-active-color, rgba(255, 100, 100)) !important;
      }
  `;
  }


  static getDefaultIcon(domain, key) {
    const icons = {
      fan: {
        speed_off: 'mdi:fan-off', speed_low: 'mdi:fan-speed-1', speed_mid: 'mdi:fan-speed-2', speed_high: 'mdi:fan-speed-3',
      },
      cover: { open: 'mdi:arrow-up', stop: 'mdi:stop', close: 'mdi:arrow-down' },
      vacuum: { start: 'mdi:play', stop: 'mdi:stop', pause: 'mdi:pause', return_to_base: 'mdi:home-map-marker' },
      lock: { locked: 'mdi:lock', unlocked: 'mdi:lock-open' },
      light: { on: 'mdi:lightbulb-on', off: 'mdi:lightbulb-off' },
      switch: { on: 'mdi:toggle-switch', off: 'mdi:toggle-switch-off' },
      input_boolean: { on: 'mdi:toggle-switch', off: 'mdi:toggle-switch-off' },
      sensor: { default: 'mdi:gauge' },
      binary_sensor: { on: 'mdi:radiobox-marked', off: 'mdi:radiobox-blank' },
      button: { default: 'mdi:button-pointer' },
      input_button: { default: 'mdi:button-pointer' },
      text: { default: 'mdi:form-textbox' },
      input_text: { default: 'mdi:form-textbox' },
      service: { default: 'mdi:play-circle-outline' },
    };
    const domainIcons = icons[domain];
    if (!domainIcons) return '';
    return domainIcons[key] || domainIcons.default || '';
  }

  static getDefaultIcon(domain, key) {
    const icons = {
      fan: {
        speed_off: 'mdi:fan-off', speed_low: 'mdi:fan-speed-1', speed_mid: 'mdi:fan-speed-2', speed_high: 'mdi:fan-speed-3',
      },
      cover: { open: 'mdi:arrow-up', stop: 'mdi:stop', close: 'mdi:arrow-down' },
      vacuum: { start: 'mdi:play', stop: 'mdi:stop', pause: 'mdi:pause', return_to_base: 'mdi:home-map-marker' },
      lock: { locked: 'mdi:lock', unlocked: 'mdi:lock-open' },
      light: { on: 'mdi:lightbulb-on', off: 'mdi:lightbulb-off' },
      switch: { on: 'mdi:toggle-switch', off: 'mdi:toggle-switch-off' },
      input_boolean: { on: 'mdi:toggle-switch', off: 'mdi:toggle-switch-off' },
      sensor: { default: 'mdi:gauge' },
      binary_sensor: { on: 'mdi:radiobox-marked', off: 'mdi:radiobox-blank' },
      button: { default: 'mdi:button-pointer' },
      input_button: { default: 'mdi:button-pointer' },
      text: { default: 'mdi:form-textbox' },
      input_text: { default: 'mdi:form-textbox' },
      service: { default: 'mdi:play-circle-outline' },
    };
    const domainIcons = icons[domain];
    if (!domainIcons) return '';
    return domainIcons[key] || domainIcons.default || '';
  }

  constructor() {
    super();
    this.hass = {};
    this.config = {};
    this.button_rows = [];
    this.buttons = [];
    this.buttons2 = [];
    this.theme = 'system';
    this.width = '100%';
    this._timerInterval = null;
    this.temperatureData = [];
    this.canvas = null;
    this.ctx = null;
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

  async firstUpdated() {
      await this._fetchDataAndRenderChart();
  }
  
  async updated(changedProperties) {
      if (changedProperties.has('hass') || changedProperties.has('config')) {
          await this._fetchDataAndRenderChart();
      }
  }

  async _fetchDataAndRenderChart() {
    if (!this.hass) return;
    const now = new Date();
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const entityId = this._externalTempSensor || this.config.entity;
    if (!entityId) return;

    const result = await this.hass.callWS({
      type: 'history/history_during_period',
      start_time: yesterday.toISOString(),
      end_time: now.toISOString(),
      entity_ids: [entityId],
      significant_changes_only: true,
      minimal_response: true,
      no_attributes: false
    });

    if (!result?.[entityId]?.length) return;

    const isSensor = entityId.startsWith('sensor.');
    const rawData = result[entityId]
      .map(entry => {
        const value = isSensor ? entry.s : entry.a?.current_temperature;
        return parseFloat(value);
      })
      .filter(value => !isNaN(value));

    if (rawData.length === 0) return;

    const sampleInterval = Math.max(1, Math.floor(rawData.length / 50));
    const sampledData = [];
    for (let i = 0; i < rawData.length; i += sampleInterval) {
      const end = Math.min(i + sampleInterval, rawData.length);
      const slice = rawData.slice(i, end);
      const avg = slice.reduce((sum, val) => sum + val, 0) / slice.length;
      sampledData.push(avg);
    }

    this.temperatureData = this._gaussianSmooth(sampledData, 3);
    await this.initCanvas();
    this.drawSmoothCurve();
  }

  async initCanvas() {
    const container = this.shadowRoot.querySelector('#chart-container');
    if (!container) return;
    while (container.firstChild) {
      container.removeChild(container.firstChild);
    }
    this.canvas = document.createElement('canvas');
    this.canvas.className = 'temperature-chart';
    container.appendChild(this.canvas);
    const scale = window.devicePixelRatio || 1;
    const width = container.clientWidth;
    const height = container.clientHeight;
    this.canvas.style.width = `${width}px`;
    this.canvas.style.height = `${height}px`;
    this.canvas.width = Math.floor(width * scale);
    this.canvas.height = Math.floor(height * scale);
    this.ctx = this.canvas.getContext('2d');
    this.ctx.scale(scale, scale);
    await this.updateComplete;
  }

  drawSmoothCurve() {
    if (!this.ctx || !this.temperatureData || this.temperatureData.length === 0) return;
    let statusColor = this.config.curve_color || '#e07070';
    const canvas = this.canvas;
    const ctx = this.ctx;
    const scale = window.devicePixelRatio || 1;
    const width = canvas.width / scale;
    const height = canvas.height / scale;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const minTemp = Math.min(...this.temperatureData) - 1;
    const maxTemp = Math.max(...this.temperatureData);
    const tempRange = Math.max(maxTemp - minTemp, 0.1);
    const xStep = width / (this.temperatureData.length - 1);
    const points = this.temperatureData.map((temp, i) => {
      return {
        x: i * xStep,
        y: height - ((temp - minTemp) / tempRange) * height,
        value: temp
      };
    });

    ctx.beginPath();
    this.drawMonotonicSpline(ctx, points);
    ctx.lineTo(points[points.length-1].x, height);
    ctx.lineTo(points[0].x, height);
    ctx.closePath();

    const gradient = ctx.createLinearGradient(0, 0, 0, height);
    const isRgba = statusColor.startsWith('rgba');
    if (isRgba) {
      gradient.addColorStop(0, statusColor);
      gradient.addColorStop(1, statusColor);
    } else {
      gradient.addColorStop(0, `${statusColor}60`);
      gradient.addColorStop(1, `${statusColor}20`);
    }
    ctx.fillStyle = gradient;
    ctx.fill();

    ctx.beginPath();
    this.drawMonotonicSpline(ctx, points);
    ctx.strokeStyle = isRgba ? statusColor : statusColor;
    ctx.lineWidth = 1;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 5;
    ctx.shadowOffsetY = 2;
    ctx.stroke();
  }
    
  _gaussianSmooth(data, windowSize = 5) {
        if (!data || data.length === 0) return [];
        if (windowSize < 1) return [...data];
        const kernel = this._createGaussianKernel(windowSize);
        const halfWindow = Math.floor(windowSize / 2);
        const result = new Array(data.length);
        for (let i = 0; i < data.length; i++) {
            let sum = 0;
            let weightSum = 0;
            const start = Math.max(0, i - halfWindow);
            const end = Math.min(data.length - 1, i + halfWindow);
            for (let j = start, k = start - (i - halfWindow); j <= end; j++, k++) {
                const weight = kernel[k];
                sum += data[j] * weight;
                weightSum += weight;
            }
            result[i] = sum / weightSum;
        }
        return result;
    }
    
  _createGaussianKernel(size) {
      if (!this._gaussianKernelCache) {
          this._gaussianKernelCache = new Map();
      }
      if (this._gaussianKernelCache.has(size)) {
          return this._gaussianKernelCache.get(size);
      }
      const kernel = new Array(size);
      const sigma = size / 3;
      const center = Math.floor(size / 2);
      let sum = 0;
      for (let i = 0; i <= center; i++) {
          const x = i - center;
          const value = Math.exp(-(x * x) / (2 * sigma * sigma));
          kernel[center + x] = value;
          kernel[center - x] = value;
          sum += (i === center - x) ? value : value * 2;
      }
  
      const normalized = kernel.map(v => v / sum);
      this._gaussianKernelCache.set(size, normalized);
      return normalized;
  }

  drawMonotonicSpline(ctx, points) {
    if (points.length < 2) return;
    ctx.moveTo(points[0].x, points[0].y);
    const slopes = this.calculateMonotonicSlopes(points);
    for (let i = 0; i < points.length - 1; i++) {
      const p0 = points[i];
      const p1 = points[i+1];
      const m0 = slopes[i];
      const m1 = slopes[i+1];
      const dx = (p1.x - p0.x) / 3;
      const cp1 = {
        x: p0.x + dx,
        y: p0.y + m0 * dx
      };
      const cp2 = {
        x: p1.x - dx,
        y: p1.y - m1 * dx
      };
      ctx.bezierCurveTo(cp1.x, cp1.y, cp2.x, cp2.y, p1.x, p1.y);
    }
  }

  calculateMonotonicSlopes(points) {
    const slopes = new Array(points.length);
    for (let i = 1; i < points.length - 1; i++) {
      const prev = points[i-1];
      const curr = points[i];
      const next = points[i+1];
      const h1 = curr.x - prev.x;
      const h2 = next.x - curr.x;
      const s1 = (curr.y - prev.y) / h1;
      const s2 = (next.y - curr.y) / h2;
      if (s1 * s2 <= 0) {
        slopes[i] = 0; 
      } else {
        slopes[i] = 3 * h1 * h2 / ( (h1 + h2) * (h1/s2 + h2/s1) );
      }
    }
    slopes[0] = (points[1].y - points[0].y) / (points[1].x - points[0].x);
    slopes[points.length-1] = (points[points.length-1].y - points[points.length-2].y) / (points[points.length-1].x - points[points.length-2].x);
    return slopes;
  }

  render() {
    if (!this.hass || !this.config.entity) {
        return html``;
    }

    const entity = this.hass.states[this.config.entity];
    if (!entity) {
        return html`<div>实体未找到: ${this.config.entity}</div>`;
    }
    const state = entity.state;
    const customOnStates = this.config.on_states ? this.config.on_states.split(',').map(s => s.trim()).filter(Boolean) : [];
    const isOn = (customOnStates.length > 0 ? customOnStates.includes(state) : PRESET_ON_STATES.includes(state)) && state !== 'unavailable' && state !== 'unknown';
    let marginBottom = '4px';

    const attrs = entity.attributes;
    
    const theme = this._evaluateTheme();
    const iconColor = theme === 'light' ? 'rgb(0, 0, 0)' : 'rgb(255, 255, 255)';
    const fgColor = theme === 'light' ? 'rgb(0, 0, 0)' : 'rgb(255, 255, 255)';
    const bgColor = theme === 'light' ? 'rgb(255, 255, 255)' : 'rgb(50, 50, 50)';
    const buttonBg = theme === 'light' ? 'rgb(230, 230, 230)' : 'rgb(80, 80, 80)';
    const buttonFg = theme === 'light' ? 'rgb(50, 50, 50)' : 'rgb(240, 240, 240)'; 

    let statusColor = 'rgb(250,250,250)';
    let linearColor = 'rgb(0,0,0,0)';

    // 卡片级强调颜色
    const cardAccentRaw = this.config.accent_color || '';
    const cardAccentColor = cardAccentRaw ? this._evalTemplate(cardAccentRaw) : '';
    if (cardAccentColor && isOn) {
      statusColor = cardAccentColor;
      linearColor = cardAccentColor;
    }

    const stateTranslations = {
        'off': '关闭',
        'unknown': '未知',
        'unavailable': '离线'
    };
    const translatedState = stateTranslations[state] || state;
    const stateDisplayValue = this.config.state_display ? this._evalTemplate(this.config.state_display) : translatedState;

    const hasTimer = this.config.timer;
    const timerEntity = hasTimer ? this.hass.states[this.config.timer] : null;
    const buttonRows = this.button_rows || [];
    const hasExtra = this.buttons && this.buttons.length > 0;
    const hasExtra2 = this.buttons2 && this.buttons2.length > 0;
    
    // 构建动态 grid-template-rows
    const br1HasItems = (buttonRows[0] && buttonRows[0].items && buttonRows[0].items.length > 0);
    const br2HasItems = (buttonRows[1] && buttonRows[1].items && buttonRows[1].items.length > 0);
    const gridTemplateRows = [
        'auto',
        br1HasItems ? 'auto' : '0',
        br1HasItems ? '6px' : '0',
        br2HasItems ? 'auto' : '0',
        br2HasItems ? '6px' : '0',
        (buttonRows[2] && buttonRows[2].items && buttonRows[2].items.length > 0) ? 'auto' : '0',
        (buttonRows[2] && buttonRows[2].items && buttonRows[2].items.length > 0) ? '6px' : '0',
        (buttonRows[3] && buttonRows[3].items && buttonRows[3].items.length > 0) ? 'auto' : '0',
        (buttonRows[3] && buttonRows[3].items && buttonRows[3].items.length > 0) ? '6px' : '0',
        (buttonRows[4] && buttonRows[4].items && buttonRows[4].items.length > 0) ? 'auto' : '0',
        (buttonRows[4] && buttonRows[4].items && buttonRows[4].items.length > 0) ? '6px' : '0',
        (buttonRows[5] && buttonRows[5].items && buttonRows[5].items.length > 0) ? 'auto' : '0',
        (buttonRows[5] && buttonRows[5].items && buttonRows[5].items.length > 0) ? '6px' : '0',
        (buttonRows[6] && buttonRows[6].items && buttonRows[6].items.length > 0) ? 'auto' : '0',
        (buttonRows[6] && buttonRows[6].items && buttonRows[6].items.length > 0) ? '6px' : '0',
        (buttonRows[7] && buttonRows[7].items && buttonRows[7].items.length > 0) ? 'auto' : '0',
        (buttonRows[7] && buttonRows[7].items && buttonRows[7].items.length > 0) ? '6px' : '0',
        (buttonRows[8] && buttonRows[8].items && buttonRows[8].items.length > 0) ? 'auto' : '0',
        (buttonRows[8] && buttonRows[8].items && buttonRows[8].items.length > 0) ? '6px' : '0',
        (buttonRows[9] && buttonRows[9].items && buttonRows[9].items.length > 0) ? 'auto' : '0',
        (buttonRows[9] && buttonRows[9].items && buttonRows[9].items.length > 0) ? '6px' : '0',
        hasTimer ? 'auto' : '0',
        hasExtra ? 'auto' : '0',
        hasExtra2 ? 'auto' : '0',
        '4px'
    ].join(' ');

    const entityIcon = attrs.icon || this.config.custom_icon || 'mdi:devices';
    const entityName = this.config.custom_name || attrs.friendly_name;
    const showPower = this.config.show_power !== 'false';

    return html` 
      <div class="card" style=" margin-bottom: ${marginBottom};
                                width: ${this.width};
                                background: ${isOn ? `linear-gradient(90deg, ${linearColor} -30%, ${bgColor} 70%)` : bgColor}; 
                                color: ${fgColor}; 
                                --button-bg: ${buttonBg}; 
                                --button-fg: ${buttonFg}; 
                                --active-color: ${cardAccentColor || statusColor};
                                --select-active-color: ${cardAccentColor || 'rgba(255, 100, 100, 0.35)'};
                                --linear-color: ${linearColor};">
                                                  
        ${isOn ? html`<div class="active-gradient"></div>` : ''}
        <div id="chart-container"></div>
        <div class="content-container" style="grid-template-rows: ${gridTemplateRows};">
            <div class="name-area">${entityName}</div>
                <div class="status-area" style="color: ${fgColor}">${stateDisplayValue}
                    
                </div>
                    <div class="power-area" style="${!showPower ? 'height: 35px;' : ''}">
                        ${showPower ? html`
                        <button class="power-button" @click=${this._togglePower}>
                            <ha-icon 
                                class="power-icon"
                                icon="${isOn ? 'mdi:toggle-switch' : 'mdi:toggle-switch-off'}"
                                style="color: ${iconColor};"
                            ></ha-icon>
                        </button>
                        ` : ''}
                    </div>
                      
                    <div class="icon-area">
                        <div class="main-icon-container">
                            <ha-icon 
                                class="main-icon" 
                                icon="${entityIcon}"
                                style="color: ${iconColor};"
                            ></ha-icon>
                        </div>
                    </div>

          ${hasTimer ? html`
              <div class="timer-area">
                  ${this._renderTimerControls(timerEntity)}
              </div>
          ` : ''}

          ${[0,1,2,3,4,5,6,7,8,9].map(rowIndex => {
            const row = buttonRows[rowIndex];
            const items = (row && row.items) ? row.items.filter(item => item.entity || (item.mode === 'service' && item.service_action)) : [];
            // 计算实际按钮数量（select选项展开为独立按钮）
            let totalButtons = 0;
            items.forEach(item => {
                if (item.mode === 'service') {
                    totalButtons += 1;
                    return;
                }
                const domain = item.entity ? item.entity.split('.')[0] : '';
                if (domain === 'select' || domain === 'input_select') {
                    const entity = this.hass.states[item.entity];
                    if (entity) {
                        const allOptions = entity.attributes.options || [];
                        const filtered = (item.select_options && item.select_options.length > 0)
                            ? allOptions.filter(opt => item.select_options.includes(opt))
                            : allOptions;
                        totalButtons += Math.min(filtered.length, 5);
                    }
                } else if (domain === 'fan') {
                    const entity = this.hass.states[item.entity];
                    if (entity) {
                        const allPresets = entity.attributes.preset_modes || [];
                        const filtered = (item.fan_preset_modes && item.fan_preset_modes.length > 0)
                            ? allPresets.filter(opt => item.fan_preset_modes.includes(opt))
                            : allPresets;
                        totalButtons += Math.min(filtered.length, 5);
                    }
                } else if (domain === 'cover' && item.mode !== 'slider' && item.mode !== 'sun_slider') {
                    totalButtons += 3;
                } else if (domain === 'vacuum' && item.mode !== 'slider' && item.mode !== 'sun_slider') {
                    totalButtons += 4;
                } else {
                    totalButtons += 1;
                }
            });
            const gridCols = Math.max(totalButtons, 1);
            return html`
              <div class="button-row-area" style="grid-area: br${rowIndex + 1}; grid-template-columns: repeat(${gridCols}, 1fr);">
                  ${items.length > 0 ? this._renderButtonRowItems(rowIndex) : ''}
              </div>
              ${items.length > 0 && rowIndex < 10 ? html`<div style="grid-area: spacer${rowIndex + 1};"></div>` : ''}
            `;
          })}

          ${hasExtra ? html`
              <div class="extra-area" style="grid-template-columns: repeat(${Math.min(this.buttons.length, 7) <= 5 ? 5 : Math.min(this.buttons.length, 7)}, 1fr);">
                  ${this._renderExtraButtons(this.buttons)}
              </div>
          ` : ''}

          ${hasExtra2 ? html`
              <div class="extra2-area" style="grid-template-columns: repeat(${Math.min(this.buttons2.length, 7) <= 5 ? 5 : Math.min(this.buttons2.length, 7)}, 1fr);">
                  ${this._renderExtraButtons(this.buttons2)}
              </div>
          ` : ''}
        </div>
      </div>
    `;
  }

  connectedCallback() {
      super.connectedCallback();
      this._startTimerRefresh();
  }

  disconnectedCallback() {
      super.disconnectedCallback();
      this._stopTimerRefresh();
  }

  _startTimerRefresh() {
      this._timerInterval = setInterval(() => {
          this.requestUpdate();
      }, 1000);
  }

  _stopTimerRefresh() {
      if (this._timerInterval) {
          clearInterval(this._timerInterval);
          this._timerInterval = null;
      }
  }

  _renderTimerControls(timerEntity) {
    if (!timerEntity) return html``;

    const mainEntity = this.hass.states[this.config.entity];
    const mainState = mainEntity ? mainEntity.state : 'off';
    
    const theme = this._evaluateTheme();
    let activeColor = theme === 'light' ? 'rgba(00, 80, 80)' : 'rgba(180, 230, 230)';
    const cardAccentRaw = this.config.accent_color || '';
    const cardAccentColor = cardAccentRaw ? this._evalTemplate(cardAccentRaw) : '';
    if (cardAccentColor) activeColor = cardAccentColor;
    const now = new Date();
    const finishesAt = new Date(timerEntity.attributes.finishes_at || 0);
    let remainingSeconds = Math.max(0, Math.floor((finishesAt - now) / 1000));
  
    const state = timerEntity.state;
    if (state !== 'active') {
        remainingSeconds = 0;
    } else if (remainingSeconds <= 0) {
        this._turnOffEntity();
        this._cancelTimer();
        remainingSeconds = 0;
    }
    
    const remainingTime = this._formatSeconds(remainingSeconds);
    const displayColor = remainingSeconds > 0 ? activeColor : 'var(--button-fg)';
    
    return html`
        <button class="timer-button" style="${remainingSeconds > 0 ? `color: ${displayColor}` : ''}" @click=${this._cancelTimer}>
            取消
        </button>
        <button class="timer-button" @click=${() => this._adjustTimer(-1, remainingSeconds)}>
            -
        </button>
        <div class="timer-display" style="color: ${displayColor}">
            ${remainingTime}
        </div>
        <button class="timer-button" @click=${() => this._adjustTimer(1, remainingSeconds)}>
            +
        </button>
        <button class="timer-button" @click=${() => this._setTimer(60 * 60)}>
            1h
        </button>
        <button class="timer-button" @click=${() => this._setTimer(3 * 60 * 60)}>
            3h
        </button>
        <button class="timer-button" @click=${() => this._setTimer(8 * 60 * 60)}>
            8h
        </button>
    `;
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
  
  _formatSeconds(totalSeconds) {
      const hours = Math.floor(totalSeconds / 3600);
      const minutes = Math.floor((totalSeconds % 3600) / 60);
      const seconds = totalSeconds % 60;
      
      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }

  _getTimerAdjustAmount(currentSeconds, direction) {
      const currentMinutes = Math.ceil(currentSeconds / 60);
      
      if (direction === -1) {
          if (currentMinutes > 30) return '30分';
          if (currentMinutes > 10) return '10分';
          return '取消';
      } else {
          if (currentSeconds === 0) return '10分';
          if (currentMinutes < 30) return '10分';
          if (currentMinutes < 180) return '30分';
          return '1小时';
      }
  }

  _adjustTimer(direction, currentSeconds) {
      if (!this.config.timer) return;
      
      const currentMinutes = Math.ceil(currentSeconds / 60);
      let newSeconds = 0;
      
      if (direction === -1) {
          if (currentMinutes > 30) {
              newSeconds = currentSeconds - (30 * 60);
          } else if (currentMinutes > 10) {
              newSeconds = currentSeconds - (10 * 60);
          } else if (domain === 'cover' && item.mode !== 'slider' && item.mode !== 'sun_slider') {
            const coverActions = ['open', 'stop', 'close'];
            coverActions.forEach(action => {
                renderUnits.push({ item, entity, domain, coverAction: action });
            });
        } else {
              this._cancelTimer();
              return;
          }
      } else {
          if (currentSeconds === 0) {
              newSeconds = 10 * 60;
          } else if (currentMinutes < 30) {
              newSeconds = currentSeconds + (10 * 60);
          } else if (currentMinutes < 180) {
              newSeconds = currentSeconds + (30 * 60);
          } else if (domain === 'cover' && item.mode !== 'slider' && item.mode !== 'sun_slider') {
            const coverActions = ['open', 'stop', 'close'];
            coverActions.forEach(action => {
                renderUnits.push({ item, entity, domain, coverAction: action });
            });
        } else {
              newSeconds = currentSeconds + (60 * 60);
          }
      }
      
      this._setTimer(newSeconds);
  }

  _cancelTimer() {
      if (!this.config.timer) return;
      this._callService('timer', 'cancel', {
          entity_id: this.config.timer
      });
  }

  _setTimer(totalSeconds) {
      if (!this.config.timer) return;
      const now = new Date();
      const finishesAt = new Date(now.getTime() + totalSeconds * 1000);
      if (this.hass.states[this.config.timer].state === 'active') {
          this._callService('timer', 'cancel', {
              entity_id: this.config.timer
          });
      }
      this._callService('timer', 'start', {
          entity_id: this.config.timer,
          duration: this._formatSeconds(totalSeconds)
      });
  }

  _renderButtonRowItems(rowIndex) {
    const row = (this.button_rows || [])[rowIndex];
    if (!row || !row.items || row.items.length === 0) return html``;

    const theme = this._evaluateTheme();
    const fgColor = theme === 'light' ? 'rgb(0, 0, 0)' : 'rgb(255, 255, 255)';
    const buttonBg = theme === 'light' ? 'rgb(230, 230, 230)' : 'rgb(80, 80, 80)';
    const buttonFg = theme === 'light' ? 'rgb(50, 50, 50)' : 'rgb(240, 240, 240)'; 
    let activeColor = theme === 'light' ? 'rgba(255, 80, 80)' : 'rgba(220, 80, 80)';
    const cardAccentRaw = this.config.accent_color || '';
    const cardAccentColor = cardAccentRaw ? this._evalTemplate(cardAccentRaw) : '';
    if (cardAccentColor) activeColor = cardAccentColor;

    const itemsToShow = row.items.filter(item => item.entity || (item.mode === 'service' && item.service_action)).slice(0, 7);

    // 将所有item展开为独立的渲染单元（select的每个选项展开为一个按钮）
    const renderUnits = [];
    itemsToShow.forEach(item => {
        if (item.mode === 'service') {
            renderUnits.push({ item, entity: null, domain: 'service', selectOption: null });
            return;
        }
        const buttonEntityId = item.entity;
        const entity = this.hass.states[buttonEntityId];
        if (!entity) return;
        const domain = buttonEntityId.split('.')[0];

        if ((domain === 'select' || domain === 'input_select') && item.mode !== 'slider' && item.mode !== 'sun_slider') {
            const allOptions = entity.attributes.options || [];
            const subItems = item.sub_items || {};
            // 兼容旧配置：有 select_options 时用旧逻辑，否则用 sub_items.visible
            const filteredOptions = (item.select_options && item.select_options.length > 0)
                ? allOptions.filter(opt => item.select_options.includes(opt))
                : allOptions.filter(opt => (subItems[opt] || {}).visible !== false);
            // 如果有标签，先添加标签单元
            if (item.select_label && item.select_label.trim()) {
                renderUnits.push({ item, entity, domain, selectOption: null, isLabel: true });
            }
            filteredOptions.slice(0, 6).forEach(opt => {
                renderUnits.push({ item, entity, domain, selectOption: opt });
            });
        } else if (domain === 'fan' && item.mode !== 'slider' && item.mode !== 'sun_slider') {
            const allPresets = entity.attributes.preset_modes || [];
            const subItems = item.sub_items || {};
            const filteredPresets = (item.fan_preset_modes && item.fan_preset_modes.length > 0)
                ? allPresets.filter(opt => item.fan_preset_modes.includes(opt))
                : allPresets.filter(opt => (subItems[opt] || {}).visible !== false);
            if (item.fan_label && item.fan_label.trim()) {
                renderUnits.push({ item, entity, domain, selectOption: null, isLabel: true });
            }
            if (filteredPresets.length > 0) {
            filteredPresets.slice(0, 6).forEach(opt => {
                renderUnits.push({ item, entity, domain, selectOption: opt });
            });
            } else {
                // 无预设模式，使用percentage档位控制
                const speeds = ['off', 'low', 'mid', 'high'];
                speeds.filter(speed => (subItems[speed] || {}).visible !== false).forEach(speed => {
                    renderUnits.push({ item, entity, domain, selectOption: `speed:${speed}` });
                });
            }
        } else if (domain === 'cover' && item.mode !== 'slider' && item.mode !== 'sun_slider') {
            const coverActions = ['open', 'stop', 'close'];
            coverActions.forEach(action => {
                renderUnits.push({ item, entity, domain, coverAction: action });
            });
        } else if (domain === 'vacuum' && item.mode !== 'slider' && item.mode !== 'sun_slider') {
            const vacuumActions = ['start', 'stop', 'pause', 'return_to_base'];
            const subItems = item.sub_items || {};
            vacuumActions.filter(action => (subItems[action] || {}).visible !== false).forEach(action => {
                renderUnits.push({ item, entity, domain, vacuumAction: action });
            });
        } else {
            renderUnits.push({ item, entity, domain, selectOption: null });
        }
    });

    return renderUnits.map(unit => {
        const { item, entity, domain, selectOption } = unit;
        const buttonEntityId = item.entity;
        const friendlyName = entity ? (entity.attributes.friendly_name || '') : '';
        const displayName = (item.custom_name || friendlyName).slice(0, 4);
        const displayValueColor = entity && entity.state === '低' ? 'red' : fgColor;
        const mode = item.mode || 'button';

        // 服务按钮模式
        if (mode === 'service') {
            const btnName = item.custom_name || '服务';
            const showIcon = item.show_icon !== false;
            const showName = item.show_name !== false;
            const iconStr = (item.custom_icons && item.custom_icons.default) || XiaoshiPhoneOtherCard.getDefaultIcon('service', 'default');
            return html`
                <button class="func-button ${showIcon ? 'has-icon service-btn' : ''}"
                        @click=${() => this._callServiceAction(item.service_action)}
                        title="${btnName}">
                    ${showIcon && iconStr ? html`<ha-icon class="func-button-icon" icon="${iconStr}"></ha-icon>` : ''}
                    ${showName ? html`<div class="func-button-value" style="color: ${buttonFg}">${btnName.slice(0, 6)}</div>` : ''}
                </button>
            `;
        }

        // 数值调节模式
        if (mode === 'slider') {
            let min, max, step, currentVal, unit;
            if (domain === 'climate') {
                min = entity.attributes.min_temp ?? 16;
                max = entity.attributes.max_temp ?? 30;
                step = entity.attributes.target_temp_step ?? 1;
                currentVal = entity.attributes.temperature ?? parseFloat(entity.state) ?? 0;
                unit = '°C';
            } else if (domain === 'fan') {
                min = 0; max = 100;
                step = entity.attributes.percentage_step ?? 1;
                currentVal = entity.attributes.percentage ?? 0;
                unit = '%';
            } else if (domain === 'cover') {
                min = 0; max = 100; step = 1;
                currentVal = entity.attributes.current_position ?? 0;
                unit = '%';
            } else if (domain === 'light') {
                min = 0; max = 100; step = 1;
                currentVal = entity.attributes.brightness ? Math.round(entity.attributes.brightness / 2.55) : 0;
                unit = '%';
            } else if (domain === 'cover' && item.mode !== 'slider' && item.mode !== 'sun_slider') {
            const coverActions = ['open', 'stop', 'close'];
            coverActions.forEach(action => {
                renderUnits.push({ item, entity, domain, coverAction: action });
            });
        } else {
                min = entity.attributes.min ?? 0;
                max = entity.attributes.max ?? 100;
                step = entity.attributes.step ?? 1;
                currentVal = parseFloat(entity.state) || 0;
                unit = entity.attributes.unit_of_measurement || '';
            }
            const sliderDomain = domain;
            const sliderName = item.custom_name || friendlyName;
            const rawPct = max > min ? ((currentVal - min) / (max - min)) * 100 : 0;
            const thumbHalfPct = 7 / (this.offsetWidth || 200) * 100;
            const pct = rawPct === 0 ? 0 : (rawPct / 100) * (100 - thumbHalfPct * 2) + thumbHalfPct;
            
            return html`
                <div class="func-button num-slider" style="cursor: default; display: flex; flex-direction: column; justify-content: space-between; padding:0;">
                    <div style="color: ${buttonFg}; font-size: 9px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${sliderName.slice(0, 4)}：${currentVal}${unit}</div>
                    <input type="range" 
                        min="${min}" max="${max}" step="${step}" 
                        .value=${currentVal}
                        @input=${(e) => {
                            const val = parseFloat(e.target.value);
                            const rp = max > min ? ((val - min) / (max - min)) * 100 : 0;
                            const thp = 7 / (e.target.offsetWidth || 200) * 100;
                            const np = rp === 0 ? 0 : (rp / 100) * (100 - thp * 2) + thp;
                            e.target.style.setProperty('--slider-pct', np + '%');
                        }}
                        @change=${(e) => {
                            const val = parseFloat(e.target.value);
                            if (sliderDomain === 'number' || sliderDomain === 'input_number') {
                                this._callService(sliderDomain, 'set_value', { entity_id: buttonEntityId, value: val });
                            } else if (sliderDomain === 'select') {
                                this._callService('select', 'select_option', { entity_id: buttonEntityId, option: val });
                            } else if (sliderDomain === 'climate') {
                                this._callService('climate', 'set_temperature', { entity_id: buttonEntityId, temperature: val });
                            } else if (sliderDomain === 'fan') {
                                this._callService('fan', 'set_percentage', { entity_id: buttonEntityId, percentage: val });
                            } else if (sliderDomain === 'cover') {
                                this._callService('cover', 'set_cover_position', { entity_id: buttonEntityId, position: val });
                            } else if (sliderDomain === 'light') {
                                this._callService('light', 'turn_on', { entity_id: buttonEntityId, brightness_pct: val });
                            }
                            this._handleClick();
                        }}
                        style="--slider-color: ${activeColor}; --slider-bg: ${buttonBg}; --slider-pct: ${pct}%;"
                    />
                </div>
            `;
        }

        // 滑动条模式（sun_slider - 填充按钮高度的range滑块）
        if (mode === 'sun_slider') {
            let min, max, step, currentVal, unit;
            if (domain === 'climate') {
                min = entity.attributes.min_temp ?? 16;
                max = entity.attributes.max_temp ?? 30;
                step = entity.attributes.target_temp_step ?? 1;
                currentVal = entity.attributes.temperature ?? parseFloat(entity.state) ?? 0;
                unit = '°C';
            } else if (domain === 'fan') {
                min = 0; max = 100;
                step = entity.attributes.percentage_step ?? 1;
                currentVal = entity.attributes.percentage ?? 0;
                unit = '%';
            } else if (domain === 'cover') {
                min = 0; max = 100; step = 1;
                currentVal = entity.attributes.current_position ?? 0;
                unit = '%';
            } else if (domain === 'light') {
                min = 0; max = 100; step = 1;
                currentVal = entity.attributes.brightness ? Math.round(entity.attributes.brightness / 2.55) : 0;
                unit = '%';
            } else if (domain === 'cover' && item.mode !== 'slider' && item.mode !== 'sun_slider') {
            const coverActions = ['open', 'stop', 'close'];
            coverActions.forEach(action => {
                renderUnits.push({ item, entity, domain, coverAction: action });
            });
        } else {
                min = entity.attributes.min ?? 0;
                max = entity.attributes.max ?? 100;
                step = entity.attributes.step ?? 1;
                currentVal = parseFloat(entity.state) || 0;
                unit = entity.attributes.unit_of_measurement || '';
            }
            const sliderDomain = domain;
            const sliderName = item.custom_name || friendlyName;
            const rawPct = max > min ? ((currentVal - min) / (max - min)) * 100 : 0;
            // 补偿 thumb 半宽(6px) 占轨道宽度的比例，使填充色对齐 thumb 中心
            const thumbHalfPct = 6 / (this.offsetWidth || 200) * 100;
            const pct = rawPct === 0 ? 0 : (rawPct / 100) * (100 - thumbHalfPct * 2) + thumbHalfPct;

            return html`
                <div class="func-button" style="cursor: default; display: flex; align-items: center; padding: 0;">
                    <div class="sun-slider-wrapper" style="flex: 1;">
                        <input type="range"
                            min="${min}" max="${max}" step="${step}"
                            .value=${currentVal}
                            style="--slider-color: ${activeColor}; --slider-bg: ${buttonBg}; --slider-pct: ${pct}%;"
                            @input=${(e) => {
                                const val = parseFloat(e.target.value);
                                const rawPct = max > min ? ((val - min) / (max - min)) * 100 : 0;
                                const thumbHalfPct = 6 / (e.target.offsetWidth || 200) * 100;
                                const newPct = rawPct === 0 ? 0 : (rawPct / 100) * (100 - thumbHalfPct * 2) + thumbHalfPct;
                                e.target.style.setProperty('--slider-pct', newPct + '%');
                            }}
                            @change=${(e) => {
                                const val = parseFloat(e.target.value);
                                if (sliderDomain === 'number' || sliderDomain === 'input_number') {
                                    this._callService(sliderDomain, 'set_value', { entity_id: buttonEntityId, value: val });
                                } else if (sliderDomain === 'climate') {
                                    this._callService('climate', 'set_temperature', { entity_id: buttonEntityId, temperature: val });
                                } else if (sliderDomain === 'fan') {
                                    this._callService('fan', 'set_percentage', { entity_id: buttonEntityId, percentage: val });
                                } else if (sliderDomain === 'cover') {
                                    this._callService('cover', 'set_cover_position', { entity_id: buttonEntityId, position: val });
                                } else if (sliderDomain === 'light') {
                                    this._callService('light', 'turn_on', { entity_id: buttonEntityId, brightness_pct: val });
                                }
                            }}
                        />
                    </div>
                </div>
            `;
        }

        // 按钮模式 - 根据域类型渲染
        if (domain === 'fan') {
            // 标签按钮
            if (unit.isLabel) {
                const labelText = (item.fan_label || '').trim();
                return html`
                    <button class="func-button"
                        style="background-color: ${buttonBg}; cursor: default;"
                        title="${labelText}"
                    >
                        <div class="func-button-value" style="color: ${buttonFg}">${labelText.slice(0, 6)}</div>
                    </button>
                `;
            }
            // 档位按钮（无preset_modes时）
            if (selectOption && selectOption.startsWith('speed:')) {
                const speedMode = selectOption.replace('speed:', '');
                const speedLabels = { 'off': '关闭', 'low': '低', 'mid': '中', 'high': '高' };
                const percentage = entity.attributes.percentage || 0;
                const step = entity.attributes.percentage_step || 33.33;
                const speedPercentages = { 'off': 0, 'low': Math.round(step), 'mid': Math.round(step * 2), 'high': 100 };
                const isActive = speedMode === 'off'
                    ? entity.state === 'off'
                    : entity.state !== 'off' && Math.abs(percentage - speedPercentages[speedMode]) < step / 2;
                const btnBgColor = isActive ? activeColor : buttonBg;
                const sub = (item.sub_items || {})[speedMode] || {};
                const showIcon = sub.show_icon !== undefined ? sub.show_icon : item.show_icon !== false;
                const showName = sub.show_name !== undefined ? sub.show_name : item.show_name !== false;
                const iconKey = 'speed_' + speedMode;
                const iconStr = sub.custom_icon || (item.custom_icons && item.custom_icons[iconKey]) || XiaoshiPhoneOtherCard.getDefaultIcon('fan', iconKey);
                const displayName = sub.custom_name || speedLabels[speedMode];
                return html`
                    <button class="func-button ${isActive ? 'select-active' : ''} ${showIcon ? 'has-icon' : ''}"
                        style="background-color: ${btnBgColor};"
                        @click=${() => speedMode === 'off'
                            ? this._callService('fan', 'turn_off', { entity_id: buttonEntityId })
                            : this._callService('fan', 'set_percentage', { entity_id: buttonEntityId, percentage: speedPercentages[speedMode] })}
                        title="${speedLabels[speedMode]}"
                    >
                        ${showIcon && iconStr ? html`<ha-icon class="func-button-icon" icon="${iconStr}" style="color: ${buttonFg}"></ha-icon>` : ''}
                        ${showName ? html`<div class="func-button-value" style="color: ${buttonFg}">${displayName}</div>` : ''}
                    </button>
                `;
            }
            // 预设模式按钮
            const currentPreset = entity.attributes.preset_mode || '';
            const isActive = selectOption === currentPreset;
            const btnBgColor = isActive ? activeColor : buttonBg;
            const optionDisplayName = (item.fan_preset_mode_names && item.fan_preset_mode_names[selectOption]) || selectOption;
            const sub = (item.sub_items || {})[selectOption] || {};
            const showIcon = sub.show_icon !== undefined ? sub.show_icon : item.show_icon !== false;
            const showName = sub.show_name !== undefined ? sub.show_name : item.show_name !== false;
            const iconStr = sub.custom_icon || (item.custom_icons && item.custom_icons[selectOption]) || '';
            const displayName = sub.custom_name || optionDisplayName;
            return html`
                <button class="func-button ${isActive ? 'select-active' : ''} ${showIcon ? 'has-icon' : ''}"
                    style="background-color: ${btnBgColor};"
                    @click=${() => this._callService('fan', 'set_preset_mode', { entity_id: buttonEntityId, preset_mode: selectOption })}
                    title="${selectOption}"
                >
                    ${showIcon && iconStr ? html`<ha-icon class="func-button-icon" icon="${iconStr}" style="color: ${buttonFg}"></ha-icon>` : ''}
                    ${showName ? html`<div class="func-button-value" style="color: ${buttonFg}">${displayName}</div>` : ''}
                </button>
            `;
        }

        if (domain === 'cover') {
            const action = unit.coverAction;
            const actionLabels = { 'open': '打开', 'stop': '停止', 'close': '关闭' };
            const actionServices = { 'open': 'open_cover', 'stop': 'stop_cover', 'close': 'close_cover' };
            let isActive = false;
            if (action === 'open') isActive = entity.state === 'open';
            else if (action === 'close') isActive = entity.state === 'closed';
            else if (action === 'stop') isActive = entity.state === 'open' || entity.state === 'closed' ? false : true;
            const btnBgColor = isActive ? activeColor : buttonBg;
            const sub = (item.sub_items || {})[action] || {};
            const showIcon = sub.show_icon !== undefined ? sub.show_icon : item.show_icon !== false;
            const showName = sub.show_name !== undefined ? sub.show_name : item.show_name !== false;
            const iconStr = sub.custom_icon || (item.custom_icons && item.custom_icons[action]) || XiaoshiPhoneOtherCard.getDefaultIcon('cover', action);
            const displayName = sub.custom_name || actionLabels[action];
            return html`
                <button class="func-button ${isActive ? 'select-active' : ''} ${showIcon ? 'has-icon' : ''}"
                    style="background-color: ${btnBgColor};"
                    @click=${() => this._callService('cover', actionServices[action], { entity_id: buttonEntityId })}
                    title="${actionLabels[action]}"
                >
                    ${showIcon && iconStr ? html`<ha-icon class="func-button-icon" icon="${iconStr}" style="color: ${buttonFg}"></ha-icon>` : ''}
                    ${showName ? html`<div class="func-button-value" style="color: ${buttonFg}">${displayName}</div>` : ''}
                </button>
            `;
        }

        if (domain === 'vacuum') {
            const action = unit.vacuumAction;
            const actionLabels = { 'start': '启动', 'stop': '停止', 'pause': '暂停', 'return_to_base': '回基站' };
            const actionServices = { 'start': 'start', 'stop': 'stop', 'pause': 'pause', 'return_to_base': 'return_to_base' };
            let isActive = false;
            if (action === 'start') isActive = entity.state === 'cleaning';
            else if (action === 'stop') isActive = entity.state === 'cleaning' || entity.state === 'paused';
            else if (action === 'pause') isActive = entity.state === 'paused';
            else if (action === 'return_to_base') isActive = entity.state === 'returning';
            const btnBgColor = isActive ? activeColor : buttonBg;
            const sub = (item.sub_items || {})[action] || {};
            const showIcon = sub.show_icon !== undefined ? sub.show_icon : item.show_icon !== false;
            const showName = sub.show_name !== undefined ? sub.show_name : item.show_name !== false;
            const iconStr = sub.custom_icon || (item.custom_icons && item.custom_icons[action]) || XiaoshiPhoneOtherCard.getDefaultIcon('vacuum', action);
            const displayName = sub.custom_name || actionLabels[action];
            return html`
                <button class="func-button ${isActive ? 'select-active' : ''} ${showIcon ? 'has-icon' : ''}"
                    style="background-color: ${btnBgColor};"
                    @click=${() => this._callService('vacuum', actionServices[action], { entity_id: buttonEntityId })}
                    title="${actionLabels[action]}"
                >
                    ${showIcon && iconStr ? html`<ha-icon class="func-button-icon" icon="${iconStr}" style="color: ${buttonFg}"></ha-icon>` : ''}
                    ${showName ? html`<div class="func-button-value" style="color: ${buttonFg}">${displayName}</div>` : ''}
                </button>
            `;
        }

        if (domain === 'lock') {
            const isLocked = entity.state === 'locked';
            const statusSymbol = isLocked ? ' - 上锁' : ' - 解锁';
            const btnBgColor = isLocked ? activeColor : buttonBg;
            const showIcon = item.show_icon !== false;
            const showName = item.show_name !== false;
            const iconKey = isLocked ? 'locked' : 'unlocked';
            const iconStr = (item.custom_icons && (item.custom_icons[iconKey] || item.custom_icons.default)) || XiaoshiPhoneOtherCard.getDefaultIcon('lock', iconKey);
            
            return html`
                <button 
                    class="func-button ${showIcon ? 'has-icon' : ''}" 
                    style="background-color: ${btnBgColor};"
                    @click=${() => this._handleExtraButtonClick(buttonEntityId, domain)}
                    title="${friendlyName}"
                >
                    ${showIcon && iconStr ? html`<ha-icon class="func-button-icon" icon="${iconStr}"></ha-icon>` : ''}
                    ${showName ? html`<div class="func-button-text" style="color: ${buttonFg}">${displayName}${statusSymbol}</div>` : ''}
                </button>
            `;
        } 
          
        if (domain === 'switch' || domain === 'light' || domain === 'input_boolean') {
            const isActive = entity.state === 'on';
            const statusSymbol = isActive ? '：开启' : '：关闭';
            const btnBgColor = isActive ? activeColor : buttonBg;
            const showIcon = item.show_icon !== false;
            const showName = item.show_name !== false;
            const iconKey = isActive ? 'on' : 'off';
            const iconStr = (item.custom_icons && (item.custom_icons[iconKey] || item.custom_icons.default)) || XiaoshiPhoneOtherCard.getDefaultIcon(domain, iconKey);
            
            return html`
                <button 
                    class="func-button ${showIcon ? 'has-icon' : ''}" 
                    style="background-color: ${btnBgColor};"
                    @click=${() => this._handleExtraButtonClick(buttonEntityId, domain)}
                    title="${friendlyName}"
                >
                    ${showIcon && iconStr ? html`<ha-icon class="func-button-icon" icon="${iconStr}"></ha-icon>` : ''}
                    ${showName ? html`<div class="func-button-text" style="color: ${buttonFg}">${displayName}${statusSymbol}</div>` : ''}
                </button>
            `;
        }

        if (domain === 'sensor') {
            const sensorUnit = entity.attributes.unit_of_measurement || '';
            const stateValue = (item.sensor_value_names && item.sensor_value_names[entity.state]) || entity.state;
            const sensorDisplay = sensorUnit ? `${displayName}：${stateValue} ${sensorUnit}` : `${displayName}：${stateValue}`;
            const showIcon = item.show_icon !== false;
            const showName = item.show_name !== false;
            const iconStr = (item.custom_icons && item.custom_icons.default) || XiaoshiPhoneOtherCard.getDefaultIcon('sensor', 'default');
            
            return html`
                <button class="func-button ${showIcon ? 'has-icon' : ''}" disabled style="cursor: default;">
                    ${showIcon && iconStr ? html`<ha-icon class="func-button-icon" icon="${iconStr}"></ha-icon>` : ''}
                    ${showName ? html`<div class="func-button-value" >${sensorDisplay}</div>` : ''}
                </button>
            `;
        }

        if (domain === 'binary_sensor') {
            const stateValue = (item.sensor_value_names && item.sensor_value_names[entity.state]) || entity.state;
            const statusSymbol = `：${stateValue}`;
            const showIcon = item.show_icon !== false;
            const showName = item.show_name !== false;
            const iconKey = entity.state === 'on' ? 'on' : 'off';
            const iconStr = (item.custom_icons && (item.custom_icons[iconKey] || item.custom_icons.default)) || XiaoshiPhoneOtherCard.getDefaultIcon('binary_sensor', iconKey);
            
            return html`
                <button class="func-button ${showIcon ? 'has-icon' : ''}" disabled style="cursor: default;">
                    ${showIcon && iconStr ? html`<ha-icon class="func-button-icon" icon="${iconStr}"></ha-icon>` : ''}
                    ${showName ? html`<div class="func-button-value">${displayName}${statusSymbol}</div>` : ''}
                </button>
            `;
        }

        if (domain === 'button' || domain === 'input_button') {
            const btnName = item.custom_name || friendlyName;
            const showIcon = item.show_icon !== false;
            const showName = item.show_name !== false;
            const iconStr = (item.custom_icons && item.custom_icons.default) || XiaoshiPhoneOtherCard.getDefaultIcon('button', 'default');
            return html`
                <button class="func-button ${showIcon ? 'has-icon' : ''}" 
                        @click=${() => this._handleExtraButtonClick(buttonEntityId, domain)}
                        title="${friendlyName}">
                    ${showIcon && iconStr ? html`<ha-icon class="func-button-icon" icon="${iconStr}"></ha-icon>` : ''}
                    ${showName ? html`<div class="func-button-value">${btnName.slice(0, 4)}</div>` : ''}
                </button>
            `;
        }
            
        if (domain === 'select' || domain === 'input_select') {
            // 标签按钮
            if (unit.isLabel) {
                const labelText = (item.select_label || '').trim();
                return html`
                    <button class="func-button"
                        style="background-color: ${buttonBg}; cursor: default;"
                        title="${labelText}"
                    >
                        <div class="func-button-value" style="color: ${buttonFg}">${labelText.slice(0, 6)}</div>
                    </button>
                `;
            }
            const isActive = selectOption === entity.state;
            const btnBgColor = isActive ? activeColor : buttonBg;
            const optionDisplayName = (item.select_option_names && item.select_option_names[selectOption]) || translateOption(selectOption, this.config.translation_priority);
            const sub = (item.sub_items || {})[selectOption] || {};
            const showIcon = sub.show_icon !== undefined ? sub.show_icon : item.show_icon !== false;
            const showName = sub.show_name !== undefined ? sub.show_name : item.show_name !== false;
            const iconStr = sub.custom_icon || (item.custom_icons && item.custom_icons[selectOption]) || '';
            const displayName = sub.custom_name || optionDisplayName;
            return html`
                <button class="func-button ${isActive ? 'select-active' : ''} ${showIcon ? 'has-icon' : ''}"
                    style="background-color: ${btnBgColor};"
                    @click=${() => this._callService(domain, 'select_option', { entity_id: buttonEntityId, option: selectOption })}
                    title="${selectOption}"
                >
                    ${showIcon && iconStr ? html`<ha-icon class="func-button-icon" icon="${iconStr}" style="color: ${buttonFg}"></ha-icon>` : ''}
                    ${showName ? html`<div class="func-button-value" style="color: ${buttonFg}">${displayName}</div>` : ''}
                </button>
            `;
        }

        if (domain === 'text' || domain === 'input_text') {
            const customName = item.custom_name || friendlyName;
            const customCommand = item.custom_command || '';
            const showIcon = item.show_icon !== false;
            const showName = item.show_name !== false;
            const iconStr = (item.custom_icons && item.custom_icons.default) || XiaoshiPhoneOtherCard.getDefaultIcon('text', 'default');
            
            return html`
                <button class="func-button ${showIcon ? 'has-icon' : ''}" 
                        @click=${() => {
                            if (customCommand) {
                                const evaluatedCommand = this._evalTemplate(customCommand);
                                this._callService(domain, 'set_value', { entity_id: buttonEntityId, value: evaluatedCommand });
                            }
                        }}
                        title="${customName}${customCommand ? ' → ' + customCommand : ''}">
                    ${showIcon && iconStr ? html`<ha-icon class="func-button-icon" icon="${iconStr}"></ha-icon>` : ''}
                    ${showName ? html`<div class="func-button-value">${customName}</div>` : ''}
                </button>
            `;
        }

        return html``;
    });
  }

  _renderExtraButtons(buttonsList) {
      if (!buttonsList || buttonsList.length === 0) return html``;

      const buttonsToShow = buttonsList.slice(0, 7);

      const theme = this._evaluateTheme();
      const fgColor = theme === 'light' ? 'rgb(0, 0, 0)' : 'rgb(255, 255, 255)';
      const buttonBg = theme === 'light' ? 'rgb(50,50,50)' : 'rgb(120,120,120)';
      const buttonFg = 'rgb(250,250,250)';
      let activeColor = theme === 'light' ? 'rgba(00, 80, 80)' : 'rgba(180, 230, 230)';
      const cardAccentRaw = this.config.accent_color || '';
      const cardAccentColor = cardAccentRaw ? this._evalTemplate(cardAccentRaw) : '';
      if (cardAccentColor) activeColor = cardAccentColor;

      return buttonsToShow.map(buttonObj => {
          const buttonEntityId = buttonObj.entity || '';
          const customName = buttonObj.name || '';
          const entity = this.hass.states[buttonEntityId];
          if (!entity) return html``;
          
          const domain = buttonEntityId.split('.')[0];
          const friendlyName = entity.attributes.friendly_name || '';
          const displayName = (customName || friendlyName).slice(0, 4);
          let displayValue = entity.state.slice(0, 4);
          const displayValueColor = displayValue === '低' ? 'red' : fgColor;
                  
          if (domain === 'switch' || domain === 'light' || domain === 'lock' || domain === 'fan') {
              const isActive = entity.state === 'on';
              const icon = isActive ? 'mdi:toggle-switch' : 'mdi:toggle-switch-off';
              const iconColor = isActive ? activeColor : buttonFg;
              
              return html`
                  <button 
                      class="extra-button ${isActive ? 'active-extra' : ''}" 
                      @click=${() => this._handleExtraButtonClick(buttonEntityId, domain)}
                      style="color: ${buttonFg}"
                      title="${friendlyName}"
                  >
                      <div class="extra-button-content">
                          <ha-icon class="extra-button-icon" icon="${icon}" style="color: ${iconColor}"></ha-icon>
                          <div class="extra-button-text" style="color: ${buttonFg}">${displayName}</div>
                      </div>
                  </button>
              `;
          }
                  
          if (domain === 'sensor' || domain === 'binary_sensor') {
              const unit = entity.attributes.unit_of_measurement || '';
              const stateValue = (buttonObj.sensor_value_names && buttonObj.sensor_value_names[entity.state]) || entity.state;
              displayValue = `${stateValue}${domain === 'sensor' ? unit : ''}`.slice(0, 4);
              
              return html`
                  <div class="extra-button" style="color: ${fgColor}; cursor: default;">
                      <div class="extra-button-content">
                          <div class="extra-button-value" style="color: ${displayValueColor}">${displayValue}</div>
                          <div class="extra-button-text">${displayName}</div>
                      </div>
                  </div>
              `;
          }
                  
          if (domain === 'button' || domain === 'input_button') {
              const buttonIcon = 'mdi:button-pointer';
              return html`
                  <button class="extra-button" 
                          @click=${() => this._handleExtraButtonClick(buttonEntityId, domain)}
                          style="color: ${buttonFg}">
                      <div class="extra-button-content">
                          <ha-icon class="extra-button-icon" icon="${buttonIcon}" style="--mdc-icon-size: 14px; color: ${buttonFg}"></ha-icon>
                          <div class="extra-button-text">${displayName}</div>
                      </div>
                  </button>
              `;
          }
              
          if (domain === 'select' || domain === 'input_select') {
              if (!displayValue || displayValue.length > 4) {
                  const options = entity.attributes.options || [];
                  const firstOption = options[0] || '';
                  displayValue = translateOption(firstOption, this.config.translation_priority).slice(0, 4);
              }
              
              return html`
                  <div class="extra-button" 
                          @click=${() => this._handleExtraButtonClick(buttonEntityId, domain)}
                          style="color: ${fgColor}; cursor: default;">
                      <div class="extra-button-content">
                          <div class="extra-button-value">${displayValue}</div>
                          <div class="extra-button-text">${displayName}</div>
                      </div>
                  </div>
              `;
          }

          return html``;
      });
  }

  _handleExtraButtonClick(entityId, domain) {
        const entity = this.hass.states[entityId];
        if (!entity) return;
        
        if (domain === 'lock') {
            const service = entity.state === 'locked' ? 'unlock' : 'lock';
            this._callService(domain, service, { entity_id: entityId });
        } else if (domain === 'switch' || domain === 'light' || domain === 'input_boolean' || domain === 'fan') {
            const service = entity.state === 'on' ? 'turn_off' : 'turn_on';
            this._callService(domain, service, { entity_id: entityId });
        } else if (domain === 'button' || domain === 'input_button') {
            this._callService(domain, 'press', { entity_id: entityId });
        } else if (domain === 'select' || domain === 'input_select') {
            this._callService(domain, 'select_next', { entity_id: entityId });
        }
        
        this._handleClick();
  }

  _getEntityDomain() {
    if (!this.config.entity) return null;
    return this.config.entity.split('.')[0];
  }

  _turnOffEntity() {
    if (!this.config.entity) return;
    const domain = this._getEntityDomain();
    if (domain) {
        this._callService(domain, 'turn_off', {
            entity_id: this.config.entity
        });
    }
    this._handleClick();
  }

  _togglePower() {
      const entity = this.hass.states[this.config.entity];
      if (!entity) return;
      
      const domain = this._getEntityDomain();
      if (!domain) return;
      
      if (domain === 'lock') {
          const service = entity.state === 'locked' ? 'unlock' : 'lock';
          this._callService('lock', service, { entity_id: this.config.entity });
          this._handleClick();
      } else if (entity.state === 'off') {
          this._callService(domain, 'turn_on', {
              entity_id: this.config.entity
          });
          this._handleClick();
      } else {
          this._callService(domain, 'turn_off', {
              entity_id: this.config.entity
          });
          this._cancelTimer();
          this._handleClick();
      }
  }

  _adjustTemperature(direction) {
    if (!this.config.entity) return;
    const entity = this.hass.states[this.config.entity];
    if (!entity) return;
    
    const attrs = entity.attributes;
    if (typeof attrs.temperature !== 'number') return;
    
    const domain = this._getEntityDomain();
    const step = attrs.target_temp_step || attrs.min_temp && attrs.max_temp ? 0.5 : 1;
    const newTemp = direction === 'up' ? attrs.temperature + step : attrs.temperature - step;
    const minTemp = attrs.min_temp || 0;
    const maxTemp = attrs.max_temp || 100;
    
    if (newTemp < minTemp || newTemp > maxTemp) return;
    
    if (domain === 'climate') {
        this._callService('climate', 'set_temperature', {
            entity_id: this.config.entity,
            temperature: newTemp
        });
    } else if (domain === 'water_heater') {
        this._callService('water_heater', 'set_temperature', {
            entity_id: this.config.entity,
            temperature: newTemp
        });
    }
  }

  _evalTemplate(str) {
      if (!str || typeof str !== 'string') return str;
      return str.replace(/\[\[\[([\s\S]*?)\]\]\]/g, (match, expr) => {
          try {
              const trimmed = expr.trim();
              const fnBody = /\breturn\b/.test(trimmed) ? trimmed : `return ${trimmed}`;
              return new Function('entity', 'hass', 'states', fnBody)(
                  this.hass.states[this.config.entity],
                  this.hass,
                  this.hass.states
              );
          } catch (e) {
              return match;
          }
      });
  }

  _callService(domain, service, data) {
      this.hass.callService(domain, service, data);
      this._handleClick();
  }

  _callServiceAction(actionYaml) {
      if (!actionYaml || typeof actionYaml !== 'string') return;
      try {
          const lines = actionYaml.split('\n');
          let domain = '', service = '';
          const data = {};
          const target = {};
          let currentSection = null; // 'data' | 'target'
          const keyStack = [];

          for (let line of lines) {
              const trimmed = line.trim();
              if (!trimmed || trimmed.startsWith('#')) continue;

              // 计算缩进级别
              const indent = line.search(/\S/);
              const keyMatch = trimmed.match(/^([\w_.-]+)\s*:\s*(.*)$/);
              if (!keyMatch) continue;

              const key = keyMatch[1];
              const value = keyMatch[2].trim();

              if (indent === 0) {
                  // 顶级key
                  if (key === 'action' || key === 'service') {
                      const parts = value.split('.');
                      if (parts.length >= 2) {
                          domain = parts[0];
                          service = parts.slice(1).join('.');
                      }
                      currentSection = null;
                      keyStack.length = 0;
                  } else if (key === 'data') {
                      currentSection = 'data';
                      keyStack.length = 0;
                      // data下如果有直接值
                      if (value) {
                          // 单行 data: key: value 格式暂不处理
                      }
                  } else if (key === 'target') {
                      currentSection = 'target';
                      keyStack.length = 0;
                  } else {
                      // 顶级直接字段，归入data
                      currentSection = null;
                      keyStack.length = 0;
                      data[key] = value === '' ? {} : this._parseYamlValue(value);
                  }
              } else {
                  // 缩进层级：根据currentSection决定写入data还是target
                  const currentObj = currentSection === 'target' ? target : data;
                  if (keyStack.length === 0) {
                      if (value === '') {
                          currentObj[key] = {};
                          keyStack.push(currentObj[key]);
                      } else {
                          currentObj[key] = this._parseYamlValue(value);
                      }
                  } else {
                      const parent = keyStack[keyStack.length - 1];
                      if (value === '') {
                          parent[key] = {};
                          keyStack.push(parent[key]);
                      } else {
                          parent[key] = this._parseYamlValue(value);
                      }
                  }
              }
          }

          if (domain && service) {
              const hasTarget = Object.keys(target).length > 0;
              if (hasTarget) {
                  this.hass.callService(domain, service, data, target);
              } else {
                  this.hass.callService(domain, service, data);
              }
              this._handleClick();
          }
      } catch (e) {
          console.error('Failed to parse service action:', e);
      }
  }

  _parseYamlValue(val) {
      if (val === 'true') return true;
      if (val === 'false') return false;
      if (val === 'null' || val === '~') return null;
      if (/^-?\d+$/.test(val)) return parseInt(val, 10);
      if (/^-?\d+\.\d+$/.test(val)) return parseFloat(val);
      // 去除引号
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
          return val.slice(1, -1);
      }
      return val;
  }
} 
customElements.define('xiaoshi-phone-other-card', XiaoshiPhoneOtherCard);
