const whenDefined = (t) => customElements.whenDefined(t);
await Promise.race([whenDefined("ha-card"), whenDefined("ha-panel-lovelace")]);
const LitElement = window.LitElement || Object.getPrototypeOf(customElements.get("ha-card"));
const html = LitElement.prototype.html;
const css = LitElement.prototype.css;

window.customCards = window.customCards || [];
window.customCards.push({
    type: 'xiaoshi-lunar-calendar-phone-date',
    name: '消逝万年历 - 手机日期',
    description: '消逝万年历日历 - 手机日期',
	  preview: true
  },
  {
    type: 'xiaoshi-lunar-calendar-phone',
    name: '消逝万年历日历 - 手机端信息聚合',
    description: ''
});

// ==================== 弹窗高度预算 ====================
// 弹窗顶部距离：支持 px / vh / % / calc() 等任意 CSS 长度，纯数字按 px；留空用默认。
// 弹窗（负责定位）和卡片（负责算可用高度）两处共用，避免两套解析逻辑跑偏。
const POPUP_DEFAULT_TOP = '20px';
// 底部固定留白（px）
const POPUP_BOTTOM_GAP = 30;
// 卡片原设计的总高度单位：head 6.5 + 日历 30 + body 6.5×7 + 间距 0.8×8 = 88.4（即原来的 88.4vh）
const CARD_DESIGN_UNITS = 88.4;
// 卡片内部 9 个区块各自 padding:2px 与 margin-bottom:-3px 的净差：9×(4-3) = 9px。
// 算可用高度时先扣掉，卡片才不会比预算高出一截、把底部留白挤掉。
const CARD_INNER_EXTRA = 9;

function resolvePopupTop(raw) {
  if (raw === undefined || raw === null || String(raw).trim() === '') return POPUP_DEFAULT_TOP;
  const value = String(raw).trim();
  return /^-?\d+(\.\d+)?$/.test(value) ? `${value}px` : value;
}

class LunarCalendarPhone extends LitElement {
  static get properties() {
    return {
      hass: { type: Object },
      config: { type: Object },
      selectedDate: { type: String },
      todayDate: { type: String },
      activeNav: { type: String },
      year: { type: Number },
      month: { type: Number },
      lunarData: { type: Array },
      birthdays: { type: Array },
      solarFestivals: { type: Array },
      lunarFestivals: { type: Array },
      solarTerms: { type: Array },
      lunarDaysData: { type: Array },
      holidays: { type: Array }
    };
  }

  setConfig(config) {
    this.config = {
      lunar: config?.lunar || 'sensor.lunar_calendar',
      theme: config?.theme || 'system',
      width: config?.width || '99.5%',
      date: config?.date || 'date.lunar_tap_date',
      ...config
    };
  }

  constructor() {
    super();
    this._initCalendarState();
  }

  // 原 xiaoshi-lunar-calendar 内部子卡片：实体解析（等价于原子卡片 setConfig 的默认值）
  get lunar() {
    return (this.config && this.config.lunar) || 'sensor.lunar_calendar';
  }

  get date() {
    return (this.config && this.config.date) || 'date.lunar_tap_date';
  }

  _initCalendarState() {
    const today = new Date();
    this.year = today.getFullYear();
    this.month = today.getMonth() + 1;
    this.day = today.getDate();
    this.activeNav = '';
    this.todayDate = `${today.getFullYear()}-${this.pad(today.getMonth() + 1)}-${this.pad(today.getDate())}`;
    this.selectedDate = this.todayDate;
    this.lunarData = [];
    this.birthdays = [];
    this.solarFestivals = [];
    this.lunarFestivals = [];
    this.solarTerms = [];
    this.lunarDaysData = [];
    this.holidays = [];
  }

  static get styles() {
    return css`      :host { display: block; max-width:500px; margin: 0 auto; }
      .card-container { display: flex; flex-direction: column; gap: 0.8vh; }
      .sub-host { display: block; }

      /* ==== LunarCalendar ==== */
      .sub-cal .calendar-grid { border-radius: 10px; display: grid; grid-template-areas: "yearlast year yearnext today monthlast month monthnext" "week1 week2 week3 week4 week5 week6 week7" "id1 id2 id3 id4 id5 id6 id7" "id8 id9 id10 id11 id12 id13 id14" "id15 id16 id17 id18 id19 id20 id21" "id22 id23 id24 id25 id26 id27 id28" "id29 id30 id31 id32 id33 id34 id35" "id36 id37 id38 id39 id40 id41 id42"; grid-template-columns: repeat(7, 1fr); grid-template-rows: 1fr 0.6fr 1fr 1fr 1fr 1fr 1fr 1fr; gap: 1px; padding: 2px; --current-month-color: inherit; --other-month-color: rgb(160,160,160,0.5); user-select: none; -webkit-user-select: none; -moz-user-select: none; -ms-user-select: none; margin-bottom: -3px; }
      .sub-cal .celltotal { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 0; cursor: default; font-size: 15px; font-weight: 600; white-space: nowrap; }
      .sub-cal .cell { position: relative; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 0; cursor: default; font-size: 12px; line-height: 12px; font-weight: 500; height: 100%; }
      .sub-cal .cell { -webkit-tap-highlight-color: transparent; tap-highlight-color: transparent; }
      .sub-cal .cell:active\n
      .selected-day:not(.selected-today), .sub-cal .cell.touched\n
      .selected-day:not(.selected-today) { border-radius: 10px; }
      .sub-cal .nav-button { cursor: pointer; user-select: none; font-size: 12px; transition: all 0.5s ease; border-radius: 10px; }
      .sub-cal .nav-button:active { transform: scale(0.95); opacity: 0.8; border-radius: 10px; }
      .sub-cal .active-nav { border-radius: 10px; transition: all 0.5s ease; }
      .sub-cal .today-button { cursor: pointer; user-select: none; transition: all 0.5s ease; border-radius: 10px; }
      .sub-cal .nav-button, .sub-cal .today-button { -webkit-tap-highlight-color: transparent; tap-highlight-color: transparent; }
      .sub-cal .nav-button:active, .sub-cal .today-button:active, .sub-cal .nav-button.active-nav, .sub-cal .today-button.active-nav { border-radius: 10px !important; background-color: rgba(0, 160, 160, 0.2) !important; }
      .sub-cal .weekday { font-size: 13px; font-weight: bold; }
      .sub-cal .month-day { cursor: pointer; color: var(--current-month-color); }
      .sub-cal .month-day\n
      .lunar-day { color: var(--current-month-color); }
      .sub-cal .prev-month-day, .sub-cal .next-month-day { color: var(--other-month-color); }
      .sub-cal .prev-month-day\n
      .lunar-day, .sub-cal .next-month-day\n
      .lunar-day { color: var(--other-month-color); }
      .sub-cal .birthday-current, .sub-cal .festival-current, .sub-cal .solar-term-current { color: inherit !important; }
      .sub-cal .selected-day { display: flex; flex-direction: column; align-items: center; justify-content: center; width: 100%; height: 100%; border-radius: 10px; }
      .sub-cal .selected-today { background-color: #00a0a0; color: white; }
      .sub-cal .selected-other { border: 2px solid #00a0a0; }
      .sub-cal .today-not-selected { color: #00a0a0; font-weight: 800; }
      .sub-cal .lunar-day { font-size: 10px; margin-top: 2px; text-align: center; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 90%; }
      .sub-cal .selected-day\n
      .lunar-day { color: inherit; }
      .sub-cal .birthday-current { color: rgb(255, 70, 0) !important; }
      .sub-cal .birthday-other { color: rgb(255, 140, 50, 0.6) !important; }
      .sub-cal .festival-current { color: rgb(0, 191, 255) !important; }
      .sub-cal .festival-other { color: rgb(0, 150, 200, 0.6) !important; }
      .sub-cal .solar-term-current { color: rgb(50, 220, 80) !important; }
      .sub-cal .solar-term-other { color: rgb(104, 192, 104, 0.6) !important; }
      .sub-cal .holiday-work { background-color: rgba(10, 200, 20, 0.1); border-radius: 10px; }
      .sub-cal .holiday-rest { background-color: rgba(255, 0, 0, 0.1); border-radius: 10px; }
      .sub-cal .holiday-label { position: absolute; top: 2px; left: 2px; font-size: 10px; font-weight: bold; z-index: 1; border-radius: 2px; padding: 0 2px; line-height: 1.2; }
      .sub-cal .holiday-work\n
      .holiday-label { color: rgb(10, 200, 20); }
      .sub-cal .holiday-rest\n
      .holiday-label { color: rgb(255, 0, 0); }
      .sub-cal .info-container { display: flex; flex-direction: column; align-items: center; width: 100%; height: 100%; justify-content: center; }
      .sub-cal .selected-day { display: flex; flex-direction: column; align-items: center; justify-content: center; width: 100%; height: 100%; border-radius: 10px; }

      /* ==== LunarCalendarHead ==== */
      .sub-head .calendar { display: grid; grid-template-areas: "gonglilabel gongli" "nonglilabel nongli"; grid-template-columns: 15% 85%; grid-template-rows: 50% 50%; gap: 1px; padding: 2px; border-radius: 10px; margin-bottom: -3px; }
      .sub-head .gongli-label, .sub-head .nongli-label { font-size: 15px; font-weight: bold; display: flex; align-items: center; justify-content: center; }
      .sub-head .gongli-label { grid-area: gonglilabel; }
      .sub-head .nongli-label { grid-area: nonglilabel; }
      .sub-head .gongli-data, .sub-head .nongli-data { display: flex; align-items: center; justify-content: center; text-align: center; }
      .sub-head .gongli-data { grid-area: gongli; }
      .sub-head .nongli-data { grid-area: nongli; }
      .sub-head .date-diff { font-size: 10px; color: rgb(150,150,150); display: inline-flex; align-items: flex-end; padding-top: 2px; }

      /* ==== LunarCalendarBody1 ==== */
      .sub-body1 .calendar { display: grid; grid-template-areas: "a0 a1 a2 a3 a4 a5 a6 a7 a8 a9 a10 a11 a12" "b0 b1 b2 b3 b4 b5 b6 b7 b8 b9 b10 b11 b12"; grid-template-columns: repeat(13, minmax(0, 1fr)); grid-template-rows: 65% 35%; gap: 1px; padding: 2px; border-radius: 10px; margin-bottom: -3px; }
      .sub-body1 .time-cell { writing-mode: vertical-rl; text-orientation: mixed; text-align: center; font-size: 13px; white-space: nowrap; overflow: visible; display: flex; width: 100%; height: 100%; justify-content: center; align-items: center; }
      .sub-body1 .luck-cell { text-align: center; font-size: 13px; width: 100%; height: 100%; justify-content: center; align-items: center; }

      /* ==== LunarCalendarBody2 ==== */
      .sub-body2 .calendar { display: grid; grid-template-areas: "a1 b1" "a2 b2"; grid-template-columns: 10% 90%; grid-template-rows: 50% 50%; gap: 1px; padding: 2px; border-radius: 10px; margin-bottom: -3px; }
      .sub-body2 .label1 { color: rgb(0,220,0); font-weight: bold; display: flex; align-items: center; justify-content: center; font-size: 15px; }
      .sub-body2 .label2 { color: rgb(255,0,0); font-weight: bold; display: flex; align-items: center; justify-content: center; font-size: 15px; }
      .sub-body2 .state { word-wrap: break-word; display: flex; align-items: center; line-height: 12px; }

      /* ==== LunarCalendarBody3 ==== */
      .sub-body3 .calendar { display: grid; grid-template-areas: "a1 b1" "a2 b2"; grid-template-columns: 10% 90%; grid-template-rows: 50% 50%; gap: 1px; padding: 2px; border-radius: 10px; margin-bottom: -3px; }
      .sub-body3 .label1 { color: rgb(0,220,0); font-weight: bold; display: flex; align-items: center; justify-content: center; font-size: 13px; }
      .sub-body3 .label2 { color: rgb(255,0,0); font-weight: bold; display: flex; align-items: center; justify-content: center; font-size: 13px; }
      .sub-body3 .state { word-wrap: break-word; display: flex; align-items: center; line-height: 13px; }

      /* ==== LunarCalendarBody4 ==== */
      .sub-body4 .calendar { display: grid; grid-template-areas: "a1 b1 a3 b3" "a2 b2 a4 b4"; grid-template-columns: 10% 40% 10% 40%; grid-template-rows: 50% 50%; gap: 1px; padding: 2px; border-radius: 10px; margin-bottom: -3px; }
      .sub-body4 .label { color: rgb(255,0,0); font-weight: bold; display: flex; align-items: center; justify-content: center; font-size: 13px; }
      .sub-body4 .state { word-wrap: break-word; display: flex; align-items: center; font-size: 13px; line-height: 13px; }

      /* ==== LunarCalendarBody5 ==== */
      .sub-body5 .calendar { display: grid; grid-template-areas: "a1 b1 a3 b3" "a2 b2 a4 b4"; grid-template-columns: 10% 40% 10% 40%; grid-template-rows: 50% 50%; gap: 1px; padding: 2px; border-radius: 10px; margin-bottom: -3px; }
      .sub-body5 .label { color: rgb(0,220,0); font-weight: bold; display: flex; align-items: center; justify-content: center; font-size: 13px; }
      .sub-body5 .state { word-wrap: break-word; display: flex; align-items: center; font-size: 13px; line-height: 13px; }

      /* ==== LunarCalendarBody6 ==== */
      .sub-body6 .calendar { display: grid; grid-template-areas: "a1 b1 a2 b2 b2 b2" "a3 b3 a4 b4 a5 b5"; grid-template-columns: 10% 40% 10% 10% 20% 10%; grid-template-rows: 50% 50%; gap: 1px; padding: 2px; border-radius: 10px; margin-bottom: -3px; }
      .sub-body6 .label { color: rgb(0,220,0); font-weight: bold; display: flex; align-items: center; justify-content: center; font-size: 13px; }
      .sub-body6 .state { word-wrap: break-word; display: flex; align-items: center; font-size: 13px; line-height: 13px; }

      /* ==== LunarCalendarBody7 ==== */
      .sub-body7 .calendar { display: grid; grid-template-areas: "a1 a2 a3 a4 a5" "b1 b2 b3 b4 b5"; grid-template-columns: 20% 20% 20% 20% 20%; grid-template-rows: 50% 50%; gap: 1px; padding: 2px; border-radius: 10px; margin-bottom: -3px; }
      .sub-body7 .label { color: rgb(0,220,0); font-weight: bold; display: flex; align-items: center; justify-content: center; font-size: 14px; }
      .sub-body7 .state { word-wrap: break-word; display: flex; align-items: center; justify-content: center; font-size: 13px; line-height: 13px; }
      .sub-body7 .direction-container { display: flex; align-items: center; justify-content: center; --mdc-icon-size: 15px; }
      .sub-body7 .direction-icon { transition: transform 0.3s ease; }
`;
  }

  _popupLayout() {
    const top = resolvePopupTop(this.config.popup_top);
    // % 在 height 的 calc 里是按父元素高度算的，和容器 top 的 % 含义不同，统一换成 vh
    const topForCalc = /^-?\d+(\.\d+)?%$/.test(top) ? `${parseFloat(top)}vh` : top;
    const avail = `(100vh - ${topForCalc} - ${POPUP_BOTTOM_GAP + CARD_INNER_EXTRA}px)`;
    const part = (unit) => `calc(${avail} * ${(unit / CARD_DESIGN_UNITS).toFixed(6)})`;
    return { head: part(6.5), calendar: part(30), body: part(6.5), gap: part(0.8) };
  }

  // ===== 以下方法由原 xiaoshi-lunar-calendar / -head / -bodyX 子卡片移植（逻辑未改）=====
  updated(changedProperties) {
    if (changedProperties.has('hass') && this.hass) {
      this.updateLunarData();
    }
  }

  updateLunarData() {
    if (this.hass && this.hass.states[this.lunar]) {
      const lunarState = this.hass.states[this.lunar];
      if (lunarState.attributes) {
        this.lunarData = lunarState.attributes.农历文本 || [];
        this.birthdays = lunarState.attributes.生日 || [];
        this.solarFestivals = lunarState.attributes.阳历节日文本 || [];
        this.lunarFestivals = lunarState.attributes.农历节日文本 || [];
        this.solarTerms = lunarState.attributes.节气文本 || [];
        this.lunarDaysData = lunarState.attributes.农历id || [];
        this.holidays = lunarState.attributes.假期文本 || [];
      }
      this.requestUpdate();
    }
  }

  getDisplayInfo(index, isCurrentMonth) {
    const result = {
      displayText: '',
      className: '',
      holidayInfo: null,
      holidayLabel: ''
    };
    const holiday = this.checkHoliday(index);
    if (holiday) {
      result.holidayInfo = holiday;
      result.className = holiday.className;
      result.holidayLabel = holiday.label;
    }
    const birthday = this.checkBirthday(index);
    if (birthday) {
      result.displayText = birthday.name;
      result.className += isCurrentMonth ? ' birthday-current' : ' birthday-other';
      return result;
    }
    const lunarFestival = this.checkLunarFestival(index);
    if (lunarFestival) {
      result.displayText = lunarFestival;
      result.className += isCurrentMonth ? ' festival-current' : ' festival-other';
      return result;
    }
    const solarFestival = this.checkSolarFestival(index);
    if (solarFestival) {
      result.displayText = solarFestival;
      result.className += isCurrentMonth ? ' festival-current' : ' festival-other';
      return result;
    }
    const solarTerm = this.checkSolarTerm(index);
    if (solarTerm) {
      result.displayText = solarTerm;
      result.className += isCurrentMonth ? ' solar-term-current' : ' solar-term-other';
      return result;
    }
    result.displayText = this.getLunarDay(index);
    return result;
  }

  checkHoliday(index) {
    if (!this.holidays || this.holidays.length <= index) return null;
    const holiday = this.holidays[index];
    if (holiday === true) {
      return { className: 'holiday-work', label: '班' };
    } else if (holiday === false) {
      return { className: 'holiday-rest', label: '休' };
    }
    return null;
  }

  getDateForCellIndex(index) {
    const firstDayOfMonth = new Date(this.year, this.month - 1, 1).getDay();
    const adjustedFirstDay = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1;
    if (index < adjustedFirstDay) {
      const prevMonth = this.month === 1 ? 12 : this.month - 1;
      const prevYear = this.month === 1 ? this.year - 1 : this.year;
      const daysInPrevMonth = this.getDaysInMonth(prevYear, prevMonth);
      const day = daysInPrevMonth - (adjustedFirstDay - index - 1);
      return `${prevYear}-${this.pad(prevMonth)}-${this.pad(day)}`;
    }
    const dayInMonth = index - adjustedFirstDay + 1;
    const daysInMonth = this.getDaysInMonth(this.year, this.month);
    if (dayInMonth <= daysInMonth) {
      return `${this.year}-${this.pad(this.month)}-${this.pad(dayInMonth)}`;
    }
    const nextMonth = this.month === 12 ? 1 : this.month + 1;
    const nextYear = this.month === 12 ? this.year + 1 : this.year;
    const day = dayInMonth - daysInMonth;
    return `${nextYear}-${this.pad(nextMonth)}-${this.pad(day)}`;
  }

  checkBirthday(index) {
    if (!this.birthdays || this.birthdays.length === 0) return null;
    if (!this.lunarDaysData || this.lunarDaysData.length <= index) return null;
    const date = this.getDateForCellIndex(index);
    if (!date) return null;
    const [year, month, day] = date.split('-').map(Number);
    for (const birthday of this.birthdays) {
      if (birthday.阳历生日) {
        const birthDateStr = birthday.阳历生日.padStart(4, '0');
        const birthMonth = parseInt(birthDateStr.substring(0, 2));
        const birthDay = parseInt(birthDateStr.substring(2));
        if (birthMonth === 2 && birthDay === 29) {
          const isLeapYear = (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
          if (isLeapYear && month === 2 && day === 29) {
            return { name: birthday.名称 };
          }
          if (!isLeapYear && month === 2 && day === 28) {
            return { name: birthday.名称 };
          }
          continue;
        }
        if (month === birthMonth && day === birthDay) {
          return { name: birthday.名称 };
        }
      }
      if (birthday.农历生日) {
        const lunarDayData = this.lunarDaysData[index];
        if (!lunarDayData || lunarDayData.length !== 6) continue;
        const lunarMonth = lunarDayData.substring(0, 2);
        const lunarDay = lunarDayData.substring(2, 4);
        const totalDays = parseInt(lunarDayData.substring(4));
        const birthMonth = birthday.农历生日.substring(0, 2).padStart(2, '0');
        const birthDay = birthday.农历生日.substring(2).padStart(2, '0');
        const birthDayNum = parseInt(birthDay);
        if (birthMonth !== lunarMonth) continue;
        if (birthDayNum > totalDays && lunarDay === totalDays.toString().padStart(2, '0')) {
          return { name: birthday.名称 };
        }
        if (birthDay === lunarDay) {
          return { name: birthday.名称 };
        }
      }
    }
    
    return null;
  }

  checkSolarFestival(index) {
    if (!this.solarFestivals || this.solarFestivals.length <= index) return null;
    let festival = this.solarFestivals[index];
    if (!festival || festival === 'null' || festival === 'false' || festival === '') {
      return null;
    }
    if (festival === '全国中小学生安全教育日') {
      return '安全教育';
    } else if (festival === '全民国防教育日') {
      return '国防教育';
    } else if (festival === '消费者权益日') {
      return '消费者日';
    } else if (festival === '世界住房日') {
      return '世界住房';
    } else if (festival === '万圣节前夜') {
      return '万圣前夜';
    } else if (festival === '全国助残日') {
      return '全国助残';
    }
    return festival;
  }

  checkLunarFestival(index) {
    if (!this.lunarFestivals || this.lunarFestivals.length <= index) return null;
    const festival = this.lunarFestivals[index];
    return festival && festival !== 'null' && festival !== 'false' && festival !== '' ? festival : null;
  }

  checkSolarTerm(index) {
    if (!this.solarTerms || this.solarTerms.length <= index) return null;
    const term = this.solarTerms[index];
    return term && term !== 'null' && term !== 'false' && term !== '' ? term : null;
  }

  getLunarDay(index) {
    if (!this.lunarData || this.lunarData.length <= index) return '';
    const lunarDate = this.lunarData[index];
    if (lunarDate.startsWith('闰')) {
      return lunarDate.includes('初一') ? lunarDate.substring(0, 3) : lunarDate.substring(3, 5);
    } else {
      return lunarDate.includes('初一') ? lunarDate.substring(0, 2) : lunarDate.substring(2, 4);
    }
  }

  renderDayCell(index, day, isCurrentMonth, isToday, isSelected, onClick) {
    const date = this.getDateForCellIndex(index);
    const [year, month, dayNum] = date.split('-').map(Number);
    const isActuallyCurrentMonth = (month === this.month && year === this.year);
    const { displayText, className, holidayInfo, holidayLabel } = this.getDisplayInfo(index, isActuallyCurrentMonth);
    const monthClass = isActuallyCurrentMonth ? 'month-day' : (day > 15 ? 'prev-month-day' : 'next-month-day');
    return html`
      <div class="cell ${monthClass} ${isToday && !isSelected ? 'today-not-selected' : ''} ${className}" \n
           style="grid-area: id${index + 1};"\n
           @click=${onClick}>
        ${holidayInfo ? html`<div class="holiday-label">${holidayLabel}</div>` : ''}
        <div class="info-container">
          <div class="selected-day ${isSelected ? (isToday ? 'selected-today' : 'selected-other') : ''}">
            ${day}
            <div class="lunar-day">${displayText}</div>
          </div>
        </div>
      </div>
    `;
  }
  
  _renderCalendar(width, height) {
    const theme = this._evaluateTheme();
    const bgColor = theme === 'light' ? 'rgb(255, 255, 255)' : 'rgb(50, 50, 50)';
    const fgColor = theme === 'light' ? 'rgb(0, 0, 0)' : 'rgb(255, 255, 255)';
    const daysInMonth = this.getDaysInMonth(this.year, this.month);
    const firstDayOfMonth = new Date(this.year, this.month - 1, 1).getDay();
    const adjustedFirstDay = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1;
    const prevMonth = this.month === 1 ? 12 : this.month - 1;
    const prevYear = this.month === 1 ? this.year - 1 : this.year;
    const daysInPrevMonth = this.getDaysInMonth(prevYear, prevMonth);
    const prevMonthDays = [];
    for (let i = adjustedFirstDay - 1; i >= 0; i--) {
      prevMonthDays.push(daysInPrevMonth - i);
    }
    const nextMonth = this.month === 12 ? 1 : this.month + 1;
    const nextYear = this.month === 12 ? this.year + 1 : this.year;
    const nextMonthDays = [];
    const totalCells = 42;
    const remainingCells = totalCells - adjustedFirstDay - daysInMonth;
    for (let i = 1; i <= remainingCells; i++) {
      nextMonthDays.push(i);
    }
    const days = [];
    const weekdayNames = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];
    const yearMonthRow = html` 
    <div class="celltotal nav-button ${this.activeNav === 'yearlast' ? 'active-nav' : ''}"\n
         style="grid-area: yearlast;" \n
         @click=${this.prevYear}\n
         @mousedown=${() => this.activeNav = 'yearlast'}\n
         @mouseup=${() => this.activeNav = ''}\n
         @mouseleave=${() => this.activeNav = ''}>◀</div>
    <div class="celltotal"\n
         style="grid-area: year;">${this.year+"年"}</div>
    <div class="celltotal nav-button ${this.activeNav === 'yearnext' ? 'active-nav' : ''}" \n
         style="grid-area: yearnext;" \n
         @click=${this.nextYear}\n
         @mousedown=${() => this.activeNav = 'yearnext'}\n
         @mouseup=${() => this.activeNav = ''}\n
         @mouseleave=${() => this.activeNav = ''}>▶</div>
    <div class="celltotal today-button ${this.activeNav === 'today' ? 'active-nav' : ''}" \n
         style="grid-area: today;" \n
         @click=${this.goToToday}\n
         @mousedown=${() => this.activeNav = 'today'}\n
         @mouseup=${() => this.activeNav = ''}\n
         @mouseleave=${() => this.activeNav = ''}>今天</div>
    <div class="celltotal nav-button ${this.activeNav === 'monthlast' ? 'active-nav' : ''}" \n
         style="grid-area: monthlast;" \n
         @click=${this.prevMonth}\n
         @mousedown=${() => this.activeNav = 'monthlast'}\n
         @mouseup=${() => this.activeNav = ''}\n
         @mouseleave=${() => this.activeNav = ''}>◀</div>
    <div class="celltotal"\n
         style="grid-area: month;">${this.month+"月"}</div>
    <div class="celltotal nav-button ${this.activeNav === 'monthnext' ? 'active-nav' : ''}" \n
         style="grid-area: monthnext;" \n
         @click=${this.nextMonth}\n
         @mousedown=${() => this.activeNav = 'monthnext'}\n
         @mouseup=${() => this.activeNav = ''}\n
         @mouseleave=${() => this.activeNav = ''}>▶</div>
  `;
    const weekdaysRow = weekdayNames.map((day, index) => 
      html`<div class="celltotal weekday"\n style="grid-area: week${index + 1};">${day}</div>`
    );
    let cellIndex = 0;
    prevMonthDays.forEach(day => {
      const currentDate = `${prevYear}-${this.pad(prevMonth)}-${this.pad(day)}`;
      const isToday = currentDate === this.todayDate;
      const isSelected = currentDate === this.selectedDate;
      days.push(this.renderDayCell(
        cellIndex, 
        day, 
        false, 
        isToday, 
        isSelected, 
        () => this.handlePrevMonthDayClick(day)
      ));
      cellIndex++;
    });
    for (let day = 1; day <= daysInMonth; day++) {
      const currentDate = `${this.year}-${this.pad(this.month)}-${this.pad(day)}`;
      const isToday = currentDate === this.todayDate;
      const isSelected = currentDate === this.selectedDate;
      days.push(this.renderDayCell(
        cellIndex, 
        day, 
        true, 
        isToday, 
        isSelected, 
        () => this.selectDate(day)
      ));
      cellIndex++;
    }
    nextMonthDays.forEach(day => {
      const currentDate = `${nextYear}-${this.pad(nextMonth)}-${this.pad(day)}`;
      const isToday = currentDate === this.todayDate;
      const isSelected = currentDate === this.selectedDate;
      days.push(this.renderDayCell(
        cellIndex, 
        day, 
        false, 
        isToday, 
        isSelected, 
        () => this.handleNextMonthDayClick(day)
      ));
      cellIndex++;
    });
    return html`
      <div class="calendar-grid"\n
           style="width: ${width}; height: ${height}; background-color: ${bgColor}; color: ${fgColor};">
        ${yearMonthRow}
        ${weekdaysRow}
        ${days}
      </div>
    `;
  }

  handlePrevMonthDayClick(day) {
    const prevMonth = this.month === 1 ? 12 : this.month - 1;
    const prevYear = this.month === 1 ? this.year - 1 : this.year;
    this.year = prevYear;
    this.month = prevMonth;
    this.selectDate(day);
    this._handleClick();
  }

  handleNextMonthDayClick(day) {
    const nextMonth = this.month === 12 ? 1 : this.month + 1;
    const nextYear = this.month === 12 ? this.year + 1 : this.year;
    this.year = nextYear;
    this.month = nextMonth;
    this.selectDate(day);
    this._handleClick();
  }

  selectDate(day) {
    this.selectedDate = `${this.year}-${this.pad(this.month)}-${this.pad(day)}`;
    this.updateDateEntity();
    this.requestUpdate();
    this._handleClick();
  }

  pad(num) {
    return num < 10 ? `0${num}` : num;
  }

  firstUpdated() {
    super.firstUpdated();
    this.updateDateEntity();
  }

  updateDateEntity() {
    if (this.hass && this.date && this.selectedDate) {
      this.hass.callService('date', 'set_value', {
        entity_id: this.date,
        date: this.selectedDate
      });
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

  getDaysInMonth(year, month) {
    return new Date(year, month, 0).getDate();
  }

  prevYear() {
    this.year--;
    this.updateSelectedDate();
    this.requestUpdate();
    this._handleClick();
  }

  nextYear() {
    this.year++;
    this.updateSelectedDate();
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
    this.updateSelectedDate();
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
    this.updateSelectedDate();
    this.requestUpdate();
    this._handleClick();
  }

  goToToday() {
    const today = new Date();
    this.year = today.getFullYear();
    this.month = today.getMonth() + 1;
    this.day = today.getDate();
    this.selectedDate = `${this.year}-${this.pad(this.month)}-${this.pad(this.day)}`;
    this.updateDateEntity();
    this.requestUpdate();
    this._handleClick();
  }

  updateSelectedDate() {
    if (!this.selectedDate) {
      this.selectedDate = `${this.year}-${this.pad(this.month)}-01`;
      this.updateDateEntity();
      return;
    }
    const [_, __, originalDay] = this.selectedDate.split('-').map(Number);
    const daysInMonth = this.getDaysInMonth(this.year, this.month);
    const day = Math.min(originalDay, daysInMonth);
    this.selectedDate = `${this.year}-${this.pad(this.month)}-${this.pad(day)}`;
    this.updateDateEntity();
  }

  calculateDateDiff(tapDate, nowDate) {
    if (!tapDate || !nowDate) return '';
    const tapDateTime = new Date(`${tapDate}T00:00:00`);
    const nowDateTime = new Date(`${nowDate}T00:00:00`);
    const diffTime = tapDateTime.getTime() - nowDateTime.getTime();
    const diffDays = Math.round(diffTime / (1000 * 3600 * 24));
    if (diffDays === 0) return '';
    if (diffDays > 0) return `(${diffDays}天后)`;
    return `(${Math.abs(diffDays)}天前)`;
  }

  getZodiacWithSymbol(zodiac) {
    const zodiacSymbols = {
      '白羊座': '♈', '金牛座': '♉', '双子座': '♊', '巨蟹座': '♋',
      '狮子座': '♌', '处女座': '♍', '天秤座': '♎', '天蝎座': '♏',
      '射手座': '♐', '摩羯座': '♑', '水瓶座': '♒', '双鱼座': '♓'
    };
    return zodiac + (zodiacSymbols[zodiac] || '');
  }

  getMoonPhaseWithSymbol(moonPhase) {
    const moonPhaseSymbols = {
      '朔月': '🌑', '既朔月': '🌑', '蛾眉新月': '🌒', '蛾眉月': '🌒',
      '夕月': '🌓', '上弦月': '🌓', '九夜月': '🌓', '宵月': '🌔',
      '渐盈凸月': '🌔', '小望月': '🌕', '望月': '🌕', '既望月': '🌕',
      '立待月': '🌖', '居待月': '🌖', '寝待月': '🌖', '更待月': '🌖',
      '渐亏凸月': '🌗', '下弦月': '🌗', '有明月': '🌗', '蛾眉残月': '🌘',
      '残月': '🌘', '晓月': '🌑', '晦月': '🌑'
    };
    return moonPhase + (moonPhaseSymbols[moonPhase] || '');
  }

  _calcFontSizeB2(length) {
    if (length <= 40) return '13px';
    if (length <= 70) return '12px';
    if (length <= 100) return '11px';
    if (length <= 130) return '10px';
    return '9px';
  }

  _calcFontSizeB3(length) {
    if (length <= 40) return '13px';
    if (length <= 80) return '12px';
    if (length <= 120) return '11px';
    if (length <= 160) return '10px';
    return '9px';
  }

  _getRotationAngle(label) {
    if (!label) return "rotate(0deg)";
    if (label.includes("正北")) return "rotate(0deg)";
    if (label.includes("东北")) return "rotate(45deg)";
    if (label.includes("正东")) return "rotate(90deg)";
    if (label.includes("东南")) return "rotate(135deg)";
    if (label.includes("正南")) return "rotate(180deg)";
    if (label.includes("西南")) return "rotate(225deg)";
    if (label.includes("正西")) return "rotate(270deg)";
    if (label.includes("西北")) return "rotate(315deg)";
    return "rotate(0deg)";
  }


  _renderHead(width, height) {
    if (!this.hass || !this.hass.states[this.lunar] || !this.hass.states[this.lunar].attributes) {
      return html`<div export class="calendar">加载中...</div>`;
    }
    const theme = this._evaluateTheme();
    const bgColor = theme === 'light' ? 'rgb(255, 255, 255)' : 'rgb(50, 50, 50)';
    const fgColor = theme === 'light' ? 'rgb(0, 0, 0)' : 'rgb(255, 255, 255)';
    const style = `
      background: ${bgColor};
      color: ${fgColor};
      width: ${width};
      height: ${height};
    `;
    const lunarData = this.hass.states[this.lunar].attributes;
    const solarDate = lunarData.点击的阳历日期?.日期2 || '';
    const nowSolarDate = lunarData.今天的阳历日期?.日期2 || '';
    const weekDay = lunarData.点击的阳历日期?.星期1 || '';
    const zodiac = this.getZodiacWithSymbol(lunarData.点击的阳历日期?.星座 || '');
    const dateDiff = this.calculateDateDiff(solarDate, nowSolarDate);
    const lunarYear = lunarData.点击的农历日期?.年 || '';
    const lunarDate = lunarData.点击的农历日期?.日期 || '';
    const season = lunarData.老黄历信息?.季节 || '';
    const moonPhase = this.getMoonPhaseWithSymbol(lunarData.老黄历信息?.月相 || '');
    return html`
      <div export class="calendar"\n
           style="${style}">
        <div export class="gongli-label">公历</div>
        <div export class="gongli-data">
          ${solarDate}&ensp;
          ${dateDiff ? html`<span export class="date-diff">${dateDiff}</span>` : ''}&ensp;
          ${weekDay}&emsp;${zodiac}
        </div>
        <div export class="nongli-label">农历</div>
        <div export class="nongli-data">
          ${lunarYear}&emsp;${lunarDate}&emsp;${season}&emsp;${moonPhase}
        </div>
      </div>
    `;
  }
  _renderBody1(width, height) {
    if (!this.hass || !this.hass.states[this.lunar] || !this.hass.states[this.lunar].attributes) {
      return html`<div export class="calendar">加载中...</div>`;
    }
    const theme = this._evaluateTheme();
    const bgColor = theme === 'light' ? 'rgb(255, 255, 255)' : 'rgb(50, 50, 50)';
    const fgColor = theme === 'light' ? 'rgb(0, 0, 0)' : 'rgb(255, 255, 255)';
    const style = `
      background: ${bgColor};
      color: ${fgColor};
      width: ${width};
      height: ${height};
    `;
    const lunarData = this.hass.states[this.lunar].attributes;
    const nowDate = lunarData.今天的阳历日期?.日期2 || '';
    const selectedDate = lunarData.点击的阳历日期?.日期2 || '';
    const isCurrentDay = nowDate === selectedDate;
    const now = new Date();
    const hour = now.getHours();
    let currentShichenIndex = -1;
    if (isCurrentDay) {
      if (hour === 23 || hour === 0) {
        if (hour === 23) {
          currentShichenIndex = 12;
        } else {
          currentShichenIndex = 0;
        }
      } else {
        const tzArr = ['子','丑','寅','卯','辰','巳','午','未','申','酉','戌','亥'];
        const currentShichen = tzArr[(Math.floor((hour + 1) / 2)) % 12];
        for (let i = 0; i < 13; i++) {
          const shichenGanzhi = lunarData.老黄历信息.时辰干支[i] || '';
          const shichen = shichenGanzhi.slice(1, 2);
          if (shichen === currentShichen) {
            currentShichenIndex = i;
            break;
          }
        }
      }
    }
    const timeCells = [];
    for (let i = 0; i < 13; i++) {
      const shichenGanzhi = lunarData.老黄历信息.时辰干支[i] || '';
      const isCurrent = i === currentShichenIndex;
      const cellStyle = isCurrent ? 'color: rgb(0,191,255);' : '';
      timeCells.push(html`
        <div export class="time-cell"\nstyle="${cellStyle}">${shichenGanzhi}</div>
      `);
    }
    const luckCells = [];
    for (let i = 0; i < 13; i++) {
      const luck = lunarData.老黄历信息.时辰吉凶[i] || '';
      const color = luck === '吉' ? 'rgb(50,250,50)' : 'rgb(255,0,0)';
      luckCells.push(html`
        <div export class="luck-cell"\nstyle="color: ${color}">${luck}</div>
      `);
    }
    return html`
      <div export class="calendar"\nstyle="${style}">
        ${timeCells.map((cell, index) => html`<div style="grid-area: a${index}">${cell}</div>`)}
        ${luckCells.map((cell, index) => html`<div style="grid-area: b${index}">${cell}</div>`)}
      </div>
    `;
  }
  _renderBody2(width, height) {
    if (!this.hass || !this.hass.states[this.lunar] || !this.hass.states[this.lunar].attributes) {
      return html`<div export class="calendar">加载中...</div>`;
    }
    const theme = this._evaluateTheme();
    const bgColor = theme === 'light' ? 'rgb(255, 255, 255)' : 'rgb(50, 50, 50)';
    const fgColor = theme === 'light' ? 'rgb(0, 0, 0)' : 'rgb(255, 255, 255)';
    const style = `background: ${bgColor};color: ${fgColor};width: ${width};height: ${height};
    `;
    const lunarData = this.hass.states[this.lunar].attributes.老黄历信息;
    const label1 = lunarData.宜;
    const label2 = lunarData.忌;
    const maxLength = Math.max(
      label1 ? label1.length : 0,
      label2 ? label2.length : 0
    );
    const commonFontSize = this._calcFontSizeB2(maxLength);
    return html`
      <div export class="calendar"\n style="${style}">
        <div export class="label1">宜</div>
        <div export class="state"\n style="grid-area: b1; font-size: ${commonFontSize}">${label1}</div>
        <div export class="label2">忌</div>
        <div export class="state"\n style="grid-area: b2; font-size: ${commonFontSize}">${label2}</div>
      </div>
    `;
  }
  _renderBody3(width, height) {
    if (!this.hass || !this.hass.states[this.lunar] || !this.hass.states[this.lunar].attributes) {
      return html`<div export class="calendar">加载中...</div>`;
    }
    const theme = this._evaluateTheme();
    const bgColor = theme === 'light' ? 'rgb(255, 255, 255)' : 'rgb(50, 50, 50)';
    const fgColor = theme === 'light' ? 'rgb(0, 0, 0)' : 'rgb(255, 255, 255)';
    const style = `
      background: ${bgColor};
      color: ${fgColor};
      width: ${width};
      height: ${height};
    `;
    const lunarData = this.hass.states[this.lunar].attributes.老黄历信息;
    const label1 = lunarData.吉神;
    const label2 = lunarData.凶煞;
    const maxLength = Math.max(
      label1 ? label1.length : 0,
      label2 ? label2.length : 0
    );
    const commonFontSize = this._calcFontSizeB3(maxLength);
    return html`
      <div export class="calendar"\n style="${style}">
        <div export class="label1">吉神</div>
        <div export class="state"\n style="grid-area: b1; font-size: ${commonFontSize}">${label1}</div>
        <div export class="label2">凶煞</div>
        <div export class="state"\n style="grid-area: b2; font-size: ${commonFontSize}">${label2}</div>
      </div>
    `;
  }
  _renderBody4(width, height) {
    if (!this.hass || !this.hass.states[this.lunar] || !this.hass.states[this.lunar].attributes) {
      return html`<div export class="calendar">加载中...</div>`;
    }
    const theme = this._evaluateTheme();
    const bgColor = theme === 'light' ? 'rgb(255, 255, 255)' : 'rgb(50, 50, 50)';
    const fgColor = theme === 'light' ? 'rgb(0, 0, 0)' : 'rgb(255, 255, 255)';
    const style = `
      background: ${bgColor};
      color: ${fgColor};
      width: ${width};
      height: ${height};
    `;
    const lunarData = this.hass.states[this.lunar].attributes.老黄历信息;
    const label1 = lunarData.彭祖干;
    const label2 = lunarData.彭祖支;
    const label3 = lunarData.相冲;
    const label4 = lunarData.岁煞;
    return html`
      <div export class="calendar"\n style="${style}">
        <div export class="label"\n style="grid-area: a1;">彭祖</div>
        <div export class="state"\n style="grid-area: b1;">${label1}</div>
        <div export class="label"\n style="grid-area: a2;">百忌</div>
        <div export class="state"\n style="grid-area: b2;">${label2}</div>
        <div export class="label"\n style="grid-area: a3;">相冲</div>
        <div export class="state"\n style="grid-area: b3;">${label3}</div>
        <div export class="label"\n style="grid-area: a4;">岁煞</div>
        <div export class="state"\n style="grid-area: b4;">${label4}</div>
      </div>
    `;
  }
  _renderBody5(width, height) {
    if (!this.hass || !this.hass.states[this.lunar] || !this.hass.states[this.lunar].attributes) {
      return html`<div export class="calendar">加载中...</div>`;
    }
    const theme = this._evaluateTheme();
    const bgColor = theme === 'light' ? 'rgb(255, 255, 255)' : 'rgb(50, 50, 50)';
    const fgColor = theme === 'light' ? 'rgb(0, 0, 0)' : 'rgb(255, 255, 255)';
    const style = `
      background: ${bgColor};
      color: ${fgColor};
      width: ${width};
      height: ${height};
    `;
    const lunarData = this.hass.states[this.lunar].attributes.老黄历信息;
    const label1 = lunarData.本月胎神 + " " + lunarData.今日胎神;
    const label2 = lunarData.物候;
    const label3 = lunarData.星宿;
    const label4 = lunarData.天神;
    return html`
      <div export class="calendar"\n style="${style}">
        <div export class="label"\n style="grid-area: a1;">胎神</div>
        <div export class="state"\n style="grid-area: b1;">${label1}</div>
        <div export class="label"\n style="grid-area: a2;">物候</div>
        <div export class="state"\n style="grid-area: b2;">${label2}</div>
        <div export class="label"\n style="grid-area: a3;">星宿</div>
        <div export class="state"\n style="grid-area: b3;">${label3}</div>
        <div export class="label"\n style="grid-area: a4;">天神</div>
        <div export class="state"\n style="grid-area: b4;">${label4}</div>
      </div>
    `;
  }
  _renderBody6(width, height) {
    if (!this.hass || !this.hass.states[this.lunar] || !this.hass.states[this.lunar].attributes) {
      return html`<div export class="calendar">加载中...</div>`;
    }
    const theme = this._evaluateTheme();
    const bgColor = theme === 'light' ? 'rgb(255, 255, 255)' : 'rgb(50, 50, 50)';
    const fgColor = theme === 'light' ? 'rgb(0, 0, 0)' : 'rgb(255, 255, 255)';
    const style = `
      background: ${bgColor};
      color: ${fgColor};
      width: ${width};
      height: ${height};
    `;
    const lunarData = this.hass.states[this.lunar].attributes.老黄历信息;
    const label1 = lunarData.九星;
    const label2 = lunarData.纳音.年 + " "+lunarData.纳音.月+" "+lunarData.纳音.日;
    const label3 = lunarData.日禄;
    const label4 = lunarData.六耀;
    const label5 = lunarData.值星;
    return html`
      <div export class="calendar"\n style="${style}">
        <div export class="label"\n style="grid-area: a1;">九星</div>
        <div export class="state"\n style="grid-area: b1;">${label1}</div>
        <div export class="label"\n style="grid-area: a2;">纳音</div>
        <div export class="state"\n style="grid-area: b2;">${label2}</div>
        <div export class="label"\n style="grid-area: a3;">日禄</div>
        <div export class="state"\n style="grid-area: b3;">${label3}</div>
        <div export class="label"\n style="grid-area: a4;">六耀</div>
        <div export class="state"\n style="grid-area: b4;">${label4}</div>
        <div export class="label"\n style="grid-area: a5;">十二建星</div>
        <div export class="state"\n style="grid-area: b5;">${label5}</div>
      </div>
    `;
  }
  _renderBody7(width, height) {
    if (!this.hass || !this.hass.states[this.lunar] || !this.hass.states[this.lunar].attributes) {
      return html`<div export class="calendar">加载中...</div>`;
    }
    const theme = this._evaluateTheme();
    const bgColor = theme === 'light' ? 'rgb(255, 255, 255)' : 'rgb(50, 50, 50)';
    const fgColor = theme === 'light' ? 'rgb(0, 0, 0)' : 'rgb(255, 255, 255)';
    const style = `
      background: ${bgColor};
      color: ${fgColor};
      width: ${width};
      height: ${height};
    `;
    const lunarData = this.hass.states[this.lunar].attributes.老黄历信息;
    const label1 = lunarData.喜神;
    const label2 = lunarData.福神;
    const label3 = lunarData.财神;
    const label4 = lunarData.阳贵;
    const label5 = lunarData.阴贵;
    const renderDirection = (label) => html`
      <div export class="direction-container">
        <ha-icon 
          export class="direction-icon"\n
          icon="mdi:arrow-up-bold"\n
          style="transform: ${this._getRotationAngle(label)};"
        ></ha-icon>
        ${label}
      </div>
    `;
    return html`
      <div export class="calendar"\n style="${style}">
        <div export class="label"\n style="grid-area: a1;">喜神</div>
        <div export class="state"\n style="grid-area: b1;">${renderDirection(label1)}</div>
        <div export class="label"\n style="grid-area: a2;">福神</div>
        <div export class="state"\n style="grid-area: b2;">${renderDirection(label2)}</div>
        <div export class="label"\n style="grid-area: a3;">财神</div>
        <div export class="state"\n style="grid-area: b3;">${renderDirection(label3)}</div>
        <div export class="label"\n style="grid-area: a4;">阳贵</div>
        <div export class="state"\n style="grid-area: b4;">${renderDirection(label4)}</div>
        <div export class="label"\n style="grid-area: a5;">阴贵</div>
        <div export class="state"\n style="grid-area: b5;">${renderDirection(label5)}</div>
      </div>
    `;
  }

  render() {
    if (!this.hass) {
      return html`<div>Loading...</div>`;
    }
    const layout = this.config.in_popup ? this._popupLayout() : null;
    const headHeight = layout ? layout.head : '6.5vh';
    const calendarHeight = layout ? layout.calendar : '30vh';
    const bodyHeight = layout ? layout.body : '6.5vh';
    const containerStyle = `width: ${this.config.width};` + (layout ? ` gap: ${layout.gap};` : '');
    const w = this.config.width;
    return html`
      <div class="card-container" style="${containerStyle}">
        <div class="sub-host sub-head">${this._renderHead(w, headHeight)}</div>

        <div class="sub-host sub-cal">${this._renderCalendar(w, calendarHeight)}</div>

        <div class="sub-host sub-body1">${this._renderBody1(w, bodyHeight)}</div>

        <div class="sub-host sub-body2">${this._renderBody2(w, bodyHeight)}</div>

        <div class="sub-host sub-body3">${this._renderBody3(w, bodyHeight)}</div>

        <div class="sub-host sub-body4">${this._renderBody4(w, bodyHeight)}</div>

        <div class="sub-host sub-body5">${this._renderBody5(w, bodyHeight)}</div>

        <div class="sub-host sub-body6">${this._renderBody6(w, bodyHeight)}</div>

        <div class="sub-host sub-body7">${this._renderBody7(w, bodyHeight)}</div>
      </div>
    `;
  }
}

customElements.define('xiaoshi-lunar-calendar-phone', LunarCalendarPhone);

class LunarCalendarPhoneDateEditor extends LitElement {
  static get properties() {
    return {
      hass: { type: Object },
      config: { type: Object }
    };
  }

  static get styles() {
    return css`      .form { display: flex; flex-direction: column; gap: 10px; }
      .form-group { display: flex; flex-direction: column; gap: 5px; }
      label { font-weight: bold; }
      select, input { padding: 8px; border: 1px solid #ddd; border-radius: 4px; width: 100%; box-sizing: border-box; }
      .entity-search-container { position: relative; width: 100%; }
      .entity-search-container input { width: 100%; min-width: 200px; }`;
  }

  render() {
    if (!this.config) return html``;
    return html`
      <div class="form">
        <div class="form-group">
          <label>农历实体</label>
          <div class="entity-search-container">
            <input
              type="text"
              .value=${this.config.entity || ''}
              @input=${this._onEntityInput}
              @change=${this._valueChanged}
              name="entity"
              placeholder="搜索农历实体（如 sensor.lunar_calendar）"
              list="lunar-entities"
            />
            <datalist id="lunar-entities">
              ${Object.keys(this.hass.states)
                .filter(entityId => entityId.startsWith('sensor'))
                .map(entityId => html`
                  <option value="${entityId}">
                    ${this.hass.states[entityId].attributes.friendly_name || entityId}
                  </option>
                `)}
            </datalist>
          </div>
        </div>

        <div class="form-group">
          <label>主题</label>
          <select
            @change=${this._valueChanged}
            .value=${this.config.theme || 'system'}
            name="theme"
          >
            <option value="system">system -  黑色字体、弹出窗体亮色背景</option>
            <option value="light">light -  黑色字体、弹出窗体亮色背景</option>
            <option value="dark">dark - 白色字体、弹出窗体暗色背景</option>
          </select>
          <span style="font-size:12px;color:#888;">也可引用全局函数：[[[ return theme() ]]]</span>
        </div>

        <div class="form-group">
          <label>简化日期</label>
          <select
            @change=${this._valueChanged}
            .value=${this.config.simplified !== undefined ? String(this.config.simplified) : 'false'}
            name="simplified"
          >
            <option value="false">标准（显示日期、星期、农历年月日）</option>
            <option value="true">简化（显示日期、星期、农历年月）</option>
          </select>
        </div>

        <div class="form-group">
          <label>弹窗动画</label>
          <select
            @change=${this._valueChanged}
            .value=${this.config.popup_animation || 'center'}
            name="popup_animation"
          >
            <option value="center">中间</option>
            <option value="bottom">由下往上</option>
            <option value="top">由上往下</option>
          </select>
        </div>

        <div class="form-group">
          <label>弹窗位置</label>
          <input
            type="text"
            .value=${this.config.popup_top !== undefined ? String(this.config.popup_top) : ''}
            @change=${this._valueChanged}
            name="popup_top"
            placeholder="20px（默认）"
          />
          <span style="font-size:12px;color:#888;">弹窗距屏幕顶部的距离，从顶部往下排布（不垂直居中）。可填 20px / 5vh / 10%，纯数字按 px；留空恢复默认 20px。</span>
        </div>
      </div>
    `;
  }

  _valueChanged(e) {
    const { name, value } = e.target;
    // popup_top 允许清空（清空 = 恢复默认 20px），其余字段沿用旧行为
    if (!value && name !== 'popup_top') return;

    let processedValue = value;
    if (name === 'simplified') {
      processedValue = value === 'true';
    }

    this.config = {
      ...this.config,
      [name]: processedValue
    };

    this.dispatchEvent(new CustomEvent('config-changed', {
      detail: { config: this.config },
      bubbles: true,
      composed: true
    }));
  }

  _onEntityInput(e) {
    this.config = {
      ...this.config,
      entity: e.target.value
    };
  }

  setConfig(config) {
    this.config = config;
  }
}
customElements.define('xiaoshi-lunar-calendar-phone-date-editor', LunarCalendarPhoneDateEditor);

class LunarCalendarPhoneDate extends LitElement {
  static get properties() {
    return {
      hass: { type: Object },
      config: { type: Object },
      _theme: { type: String },
      _simplified: { type: Boolean }
    };
  }

  constructor() {
    super();
    // 弹窗 hass 状态订阅
    this._popupHassUnsubscribe = null;
    this._popupUpdatePending = false;
    this._popupHass = null;
  }

  static getConfigElement() {
    return document.createElement("xiaoshi-lunar-calendar-phone-date-editor");
  }

  setConfig(config) {
    this.config = config;
    this._theme = config.theme || 'system';
    this._simplified = config.simplified !== undefined ? config.simplified : false;
  }

  static get styles() {
    return css`      :host { display: block; width: 100%; height: 20px; max-width: 500px; margin: 0 auto; }
      ha-card { background: transparent !important; box-shadow: none !important; border: none !important; }
      .content { font-weight: bold; font-size: 12px; color: var(--theme-color); text-align: center; }`;
  } 

  render() {
    const theme = this._evaluateTheme();
    const Color =  theme == 'light' ? 'rgb(0,0,0)' : 'rgb(255,255,255)';
    this.style.setProperty('--theme-color', Color);
    if (!this.hass || !this.config) {
      return html``;
    }
    const entityId = this.config.entity || 'sensor.lunar_calendar';
    const state = this.hass.states[entityId];
    if (!state || !state.attributes) {
      return html``;
    }
    const stateAttrs = state.attributes;
    const date = stateAttrs['今天的阳历日期']?.['日期3'] || '';
    const week = stateAttrs['今天的阳历日期']?.['星期1'] || '';
    const lunaryear = stateAttrs['今天的农历日期']?.['年'] || '';
    const lunardate = stateAttrs['今天的农历日期']?.['日期'] || '';
    const nowdate = this._simplified
      ? `${date} ${week} ${lunardate}`
      : `${date} ${week} 【农历 ${lunaryear} ${lunardate}】`;

    return html`
      <ha-card @click=${this._showPopup}>
        <div class="content">${nowdate}</div>
      </ha-card>
    `;
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

  // 弹窗距屏幕顶部的距离（弹窗从顶部开始排布，不做垂直居中）：
  // 支持 vh / px / % / calc() 等任意 CSS 长度，纯数字按 px 处理
  //（方便直接填 0 / 20 / -10）；留空则用默认 20px。
  _resolvePopupTop() {
    return resolvePopupTop(this.config ? this.config.popup_top : undefined);
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

  _injectPopupStyles() {
    if (LunarCalendarPhoneDate._stylesInjected) return;
    LunarCalendarPhoneDate._stylesInjected = true;
    const style = document.createElement('style');
    style.id = 'xiaoshi-phone-popup-style';
    style.textContent = `
      @keyframes xiaoshiPhonePopupBottom {
        from { opacity: 0; transform: translateX(-50%) translateY(100%); }
        to   { opacity: 1; transform: translateX(-50%) translateY(0); }
      }
      @keyframes xiaoshiPhonePopupTop {
        from { opacity: 0; transform: translateX(-50%) translateY(-100%); }
        to   { opacity: 1; transform: translateX(-50%) translateY(0); }
      }
      @keyframes xiaoshiPhonePopupCenter {
        from { opacity: 0; transform: translateX(-50%) scale(0.9); }
        to   { opacity: 1; transform: translateX(-50%) scale(1); }
      }
    `;
    document.head.appendChild(style);
  }

  _showPopup() {
    this._handleClick();
    this._injectPopupStyles();
    const theme = this._evaluateTheme();

    // 获取 hass 对象
    const haRoot = document.querySelector('home-assistant');
    const hassObj = haRoot?.hass || haRoot?.shadowRoot?.querySelector('home-assistant-main')?.hass;
    if (!hassObj) {
      console.error('[LunarCalendarPhoneDate] 无法获取 hass 对象');
      return;
    }

    // 已有弹窗则先关闭
    if (this._popupOverlay) {
      this._closePopup();
    }

    // 创建遮罩层
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

    // 创建弹窗容器
    // 注意：这里不再加 padding —— 容器是透明的，padding 会让「卡片实际位置 = popup_top + padding」，
    // 参数就对不上肉眼看到的位置了。去掉后 popup_top 直接等于卡片距屏幕顶部的距离。
    const anim = this.config.popup_animation || 'center';
    const animNameMap = { bottom: 'xiaoshiPhonePopupBottom', top: 'xiaoshiPhonePopupTop', center: 'xiaoshiPhonePopupCenter' };
    const animName = animNameMap[anim] || 'xiaoshiPhonePopupBottom';
    const popupTop = this._resolvePopupTop();
    const popup = document.createElement('div');
    popup.style.cssText = `
      position: fixed;
      top: ${popupTop}; left: 50%;
      transform: translateX(-50%);
      z-index: 1005;
      background: transparent;
      width: 96vw;
      animation: ${animName} 0.5s ease-out;
    `;

    document.body.appendChild(overlay);
    document.body.appendChild(popup);

    this._popupOverlay = overlay;
    this._popupElement = popup;

    // 创建卡片
    // in_popup + popup_top：让卡片按「顶部 = popup_top、底部固定 POPUP_BOTTOM_GAP」的剩余空间分配高度
    const cardConfig = {
      type: 'custom:xiaoshi-lunar-calendar-phone',
      theme: theme,
      in_popup: true,
      popup_top: popupTop
    };
    this._createPopupCard(popup, cardConfig, hassObj);

    // ESC 关闭
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
        // 启动 hass 状态订阅，让弹窗数据持续更新
        this._startPopupHassWatcher(hassObj);
      } else {
        container.innerHTML = '<div style="color:red;padding:20px;">loadCardHelpers 不可用</div>';
      }
    } catch (err) {
      console.error('[LunarCalendarPhoneDate] 创建弹窗卡片失败:', err);
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
    // 取消 hass 状态订阅
    if (this._popupHassUnsubscribe) {
      this._popupHassUnsubscribe();
      this._popupHassUnsubscribe = null;
    }
    this._popupUpdatePending = false;
    this._popupHass = null;
  }

  // ==========================================
  // 1. 订阅 hass 状态变化
  // ==========================================
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
          // 弹窗已关闭，跳过
          if (!this._popupCardElement) return;
          // 2. RAF 批处理调度
          this._schedulePopupUpdate();
        },
        { type: 'subscribe_events', event_type: 'state_changed' }
      ).then((unsub) => {
        this._popupHassUnsubscribe = unsub;
      });
    } catch (err) {
      console.error('[LunarCalendarPhoneDate] 订阅状态变化失败:', err);
    }
  }

  // ==========================================
  // 2. RAF 批处理调度，每帧最多触发一次更新
  // ==========================================
  _schedulePopupUpdate() {
    if (this._popupUpdatePending) return;
    this._popupUpdatePending = true;
    requestAnimationFrame(() => {
      this._popupUpdatePending = false;
      // 弹窗已关闭，跳过
      if (!this._popupCardElement) return;
      const haRoot = document.querySelector('home-assistant');
      const newHass = haRoot?.hass || haRoot?.shadowRoot?.querySelector('home-assistant-main')?.hass;
      if (!newHass) return;
      // hass 引用未变化时跳过
      if (newHass === this._popupHass) return;
      this._popupHass = newHass;
      this._updatePopupCard();
    });
  }

  // ==========================================
  // 3. 更新弹窗卡片
  // ==========================================
  _updatePopupCard() {
    if (this._popupCardElement && this._popupHass) {
      try {
        this._popupCardElement.hass = this._popupHass;
      } catch (err) {
        console.warn('[LunarCalendarPhoneDate] 弹窗卡片更新失败:', err.message);
      }
    }
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this._closePopup();
  }
}
customElements.define('xiaoshi-lunar-calendar-phone-date', LunarCalendarPhoneDate);