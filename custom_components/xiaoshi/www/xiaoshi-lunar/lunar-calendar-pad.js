const whenDefined = (t) => customElements.whenDefined(t);
await Promise.race([whenDefined("ha-card"), whenDefined("ha-panel-lovelace")]);
const LitElement = window.LitElement || Object.getPrototypeOf(customElements.get("ha-card"));
const html = LitElement.prototype.html;
const css = LitElement.prototype.css;

window.customCards = window.customCards || [];
window.customCards.push({
    type: 'xiaoshi-lunar-calendar-pad-date',
    name: '消逝万年历 - 平板日期',
    description: '消逝万年历日历 - 平板日期',
	  preview: true
  },
  {
    type: 'xiaoshi-lunar-calendar-pad',
    name: '消逝万年历日历 - 平板端信息聚合',
    description: ''
});

class LunarCalendarPad extends LitElement {
  static get properties() {
    return {
      hass: { type: Object },
      config: { type: Object },
      activeNav: { type: String },
      year: { type: Number },
      month: { type: Number },
      selectedDate: { type: String },
      todayDate: { type: String },
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
      theme: config?.theme || 'theme()',
      width: config?.width || '785px',
      height: config?.height || '540px',
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
    return css`      :host { display: block; }
      .grid-container { display: grid; grid-template-areas: "left1 head right1" "left1 lunar right1" "left2 lunar right2" "left3 lunar right3" "left4 lunar right4" "left5 body1 right5" "left6 body7 right6"; grid-template-columns: 180px 400px 180px; grid-template-rows: 60px 20px 30px 120px 120px 60px 60px; width: 785px; height: 540px; gap: 10px; }
      .grid-item { display: flex; position: relative; }
      .left1 { grid-area: left1; height: 90px; }
      .right1 { grid-area: right1; height: 90px; }
      .head { grid-area: head; height: 60px; }
      .lunar { grid-area: lunar; height: 320px; }
      .left2 { grid-area: left2; height: 30px; }
      .right2 { grid-area: right2; height: 30px; }
      .left3 { grid-area: left3; height: 120px; }
      .right3 { grid-area: right3; height: 120px; }
      .left4 { grid-area: left4; height: 120px; }
      .right4 { grid-area: right4; height: 120px; }
      .left5 { grid-area: left5; height: 60px; }
      .right5 { grid-area: right5; height: 60px; }
      .body1 { grid-area: body1; height: 60px; }
      .left6 { grid-area: left6; height: 60px; }
      .right6 { grid-area: right6; height: 60px; }
      .body7 { grid-area: body7; height: 60px; }
      .sub-host { display: block; width: 100%; height: 100%; }

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

      /* ==== LunarCalendarBody7 ==== */
      .sub-body7 .calendar { display: grid; grid-template-areas: "a1 a2 a3 a4 a5" "b1 b2 b3 b4 b5"; grid-template-columns: 20% 20% 20% 20% 20%; grid-template-rows: 50% 50%; gap: 1px; padding: 2px; border-radius: 10px; margin-bottom: -3px; }
      .sub-body7 .label { color: rgb(0,220,0); font-weight: bold; display: flex; align-items: center; justify-content: center; font-size: 14px; }
      .sub-body7 .state { word-wrap: break-word; display: flex; align-items: center; justify-content: center; font-size: 13px; line-height: 13px; }
      .sub-body7 .direction-container { display: flex; align-items: center; justify-content: center; --mdc-icon-size: 15px; }
      .sub-body7 .direction-icon { transition: transform 0.3s ease; }

      /* ==== LunarCalendarLeft1 ==== */
      .sub-left1 .calendar { display: grid; grid-template-areas: "a1 a2 a3" "b1 b2 b3" "c1 c2 c3"; grid-template-columns: 33% 17% 50%; grid-template-rows: repeat(3, 1fr); gap: 1px; padding: 2px; border-radius: 10px; margin-bottom: -3px; }
      .sub-left1 .label { color: rgb(250,50,10); font-weight: bold; display: flex; align-items: center; justify-content: center; font-size: 13px; }
      .sub-left1 .state { word-wrap: break-word; display: flex; align-items: center; justify-content: center; font-size: 13px; line-height: 13px; }

      /* ==== LunarCalendarRight1 ==== */
      .sub-right1 .calendar { display: grid; grid-template-areas: "a1 a2" "b1 b2" "c1 c2"; grid-template-columns: 27% 73%; grid-template-rows: repeat(3, 1fr); gap: 1px; padding: 2px; border-radius: 10px; margin-bottom: -3px; }
      .sub-right1 .label { color: rgb(250,50,10); font-weight: bold; display: flex; align-items: center; justify-content: center; font-size: 13px; }
      .sub-right1 .state { word-wrap: break-word; display: flex; align-items: center; justify-content: center; font-size: 13px; line-height: 13px; }

      /* ==== LunarCalendarLeft2 ==== */
      .sub-left2 .calendar { display: grid; grid-template-areas: "a1"; grid-template-columns: 100%; grid-template-rows: 100%; gap: 1px; padding: 2px; border-radius: 10px; margin-bottom: -3px; }
      .sub-left2 .state { word-wrap: break-word; display: flex; align-items: center; justify-content: center; font-size: 13px; line-height: 13px; }

      /* ==== LunarCalendarRight2 ==== */
      .sub-right2 .calendar { display: grid; grid-template-areas: "a1"; grid-template-columns: 100%; grid-template-rows: 100%; gap: 1px; padding: 2px; border-radius: 10px; margin-bottom: -3px; }
      .sub-right2 .state { word-wrap: break-word; display: flex; align-items: center; justify-content: center; font-size: 13px; line-height: 13px; }

      /* ==== LunarCalendarLeft3 ==== */
      .sub-left3 .calendar { display: grid; grid-template-areas: "a1" "b1"; grid-template-columns: 100%; grid-template-rows: 15% 85%; gap: 1px; padding: 2px; border-radius: 10px; margin-bottom: -3px; place-items: center; }
      .sub-left3 .label { background: rgb(0,220,0); border-radius: 100%; color: rgb(255,255,255); font-weight: bold; display: flex; align-items: center; justify-content: center; font-size: 16px; width: 25px; height: 25px; margin-top: 15px; }
      .sub-left3 .state { word-wrap: break-word; display: flex; align-items: center; justify-content: center; line-height: 16px; padding: 0 5px 0 5px; }

      /* ==== LunarCalendarRight3 ==== */
      .sub-right3 .calendar { display: grid; grid-template-areas: "a1" "b1"; grid-template-columns: 100%; grid-template-rows: 15% 85%; gap: 1px; padding: 2px; border-radius: 10px; margin-bottom: -3px; place-items: center; }
      .sub-right3 .label { background: rgb(200,20,0); border-radius: 100%; color: rgb(255,255,255); font-weight: bold; display: flex; align-items: center; justify-content: center; font-size: 16px; width: 25px; height: 25px; margin-top: 15px; }
      .sub-right3 .state { word-wrap: break-word; display: flex; align-items: center; justify-content: center; line-height: 16px; padding: 0 5px 0 5px; }

      /* ==== LunarCalendarLeft4 ==== */
      .sub-left4 .calendar { display: grid; grid-template-areas: "a1" "b1"; grid-template-columns: 100%; grid-template-rows: 15% 85%; gap: 1px; padding: 2px; border-radius: 10px; margin-bottom: -3px; place-items: center; }
      .sub-left4 .label { color: rgb(0,220,0); font-weight: bold; display: flex; align-items: center; justify-content: center; font-size: 16px; margin-top: 10px; }
      .sub-left4 .state { word-wrap: break-word; display: flex; align-items: center; justify-content: center; line-height: 16px; padding: 0 5px 0 5px; }

      /* ==== LunarCalendarRight4 ==== */
      .sub-right4 .calendar { display: grid; grid-template-areas: "a1" "b1"; grid-template-columns: 100%; grid-template-rows: 15% 85%; gap: 1px; padding: 2px; border-radius: 10px; margin-bottom: -3px; place-items: center; }
      .sub-right4 .label { color: rgb(200,20,0); font-weight: bold; display: flex; align-items: center; justify-content: center; font-size: 16px; margin-top: 10px; }
      .sub-right4 .state { word-wrap: break-word; display: flex; align-items: center; justify-content: center; line-height: 16px; padding: 0 5px 0 5px; }

      /* ==== LunarCalendarLeft5 ==== */
      .sub-left5 .calendar { display: grid; grid-template-areas: "a1 a2" "b1 b2"; grid-template-columns: 27% 73%; grid-template-rows: repeat(2, 1fr); gap: 1px; padding: 2px; border-radius: 10px; margin-bottom: -3px; }
      .sub-left5 .label { color: rgb(250,50,10); font-weight: bold; display: flex; align-items: center; justify-content: center; font-size: 13px; }
      .sub-left5 .state { word-wrap: break-word; display: flex; align-items: center; justify-content: center; font-size: 13px; line-height: 13px; }

      /* ==== LunarCalendarRight5 ==== */
      .sub-right5 .calendar { display: grid; grid-template-areas: "a1 a2" "b1 b2"; grid-template-columns: 38% 62%; grid-template-rows: repeat(2, 1fr); gap: 1px; padding: 2px; border-radius: 10px; margin-bottom: -3px; }
      .sub-right5 .label { color: rgb(250,50,10); font-weight: bold; display: flex; align-items: center; justify-content: center; font-size: 13px; }
      .sub-right5 .state { word-wrap: break-word; display: flex; align-items: center; justify-content: center; font-size: 13px; line-height: 13px; }

      /* ==== LunarCalendarLeft6 ==== */
      .sub-left6 .calendar { display: grid; grid-template-areas: "a1 a2" "b1 b2"; grid-template-columns: 27% 73%; grid-template-rows: repeat(2, 1fr); gap: 1px; padding: 2px; border-radius: 10px; margin-bottom: -3px; }
      .sub-left6 .label { color: rgb(250,50,10); font-weight: bold; display: flex; align-items: center; justify-content: center; font-size: 13px; }
      .sub-left6 .state { word-wrap: break-word; display: flex; align-items: center; justify-content: center; font-size: 13px; line-height: 13px; white-space: nowrap; overflow: visible; }

      /* ==== LunarCalendarRight6 ==== */
      .sub-right6 .calendar { display: grid; grid-template-areas: "a1 a2" "b1 b2"; grid-template-columns: 27% 73%; grid-template-rows: repeat(2, 1fr); gap: 1px; padding: 2px; border-radius: 10px; margin-bottom: -3px; }
      .sub-right6 .label { color: rgb(250,50,10); font-weight: bold; display: flex; align-items: center; justify-content: center; font-size: 13px; }
      .sub-right6 .state { word-wrap: break-word; display: flex; align-items: center; justify-content: center; font-size: 13px; line-height: 13px; }
`;
  }

  // ===== 以下方法由原 xiaoshi-lunar-calendar / -head / -bodyX / -leftX / -rightX 子卡片移植（逻辑未改）=====
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

  _calcFontSizeL3(length) {
    if (length <= 70) return '13px';
    if (length <= 100) return '12px';
    if (length <= 130) return '11px';
    return '10px';
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
  _renderLeft1(width, height) {
    if (!this.hass || !this.hass.states[this.lunar] || !this.hass.states[this.lunar].attributes) {
      return html`<div export class="calendar">加载中...</div>`;
    }
    const theme = this._evaluateTheme();
    const bgColor = theme === 'light' ? 'rgb(255, 255, 255)' : 'rgb(50, 50, 50)';
    const fgColor = theme === 'light' ? 'rgb(0, 0, 0)' : 'rgb(255, 255, 255)';
    const style = `background: ${bgColor};color: ${fgColor};width: ${width};height: ${height};
    `;
    const lunarData = this.hass.states[this.lunar].attributes.老黄历信息;
    const labela1 = lunarData.干支.年+"年";
    const labelb1 = lunarData.干支.月+"月";
    const labelc1 = lunarData.干支.日+"日";
    const labela2 = lunarData.生肖.年;
    const labelb2 = lunarData.生肖.月;
    const labelc2 = lunarData.生肖.日;
    const labela3 = lunarData.纳音.年;
    const labelb3 = lunarData.纳音.月;
    const labelc3 = lunarData.纳音.日;
    return html`
      <div export class="calendar"\n style="${style}">
        <div export class="label"\n style="grid-area: a1;">${labela1}</div>
        <div export class="label"\n style="grid-area: b1;">${labelb1}</div>
        <div export class="label"\n style="grid-area: c1;">${labelc1}</div>
        <div export class="state"\n style="grid-area: a2;">${labela2}</div>
        <div export class="state"\n style="grid-area: b2;">${labelb2}</div>
        <div export class="state"\n style="grid-area: c2;">${labelc2}</div>
        <div export class="state"\n style="grid-area: a3;">${labela3}</div>
        <div export class="state"\n style="grid-area: b3;">${labelb3}</div>
        <div export class="state"\n style="grid-area: c3;">${labelc3}</div>
      </div>
    `;
  }
  _renderRight1(width, height) {
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
    const labela2 = lunarData.相冲;
    const labelb2 = lunarData.岁煞;
    const labelc2 = lunarData.天神;
    return html`
      <div export class="calendar"\n style="${style}">
        <div export class="label"\n style="grid-area: a1;">相冲</div>
        <div export class="label"\n style="grid-area: b1;">岁煞</div>
        <div export class="label"\n style="grid-area: c1;">天神</div>
        <div export class="state"\n style="grid-area: a2;">${labela2}</div>
        <div export class="state"\n style="grid-area: b2;">${labelb2}</div>
        <div export class="state"\n style="grid-area: c2;">${labelc2}</div>
      </div>
    `;
  }
  _renderLeft2(width, height) {
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
    const label = lunarData.节气.上一节气;
    return html`
      <div export class="calendar"\n style="${style}">
        <div export class="state"\n style="grid-area: a1;">${label}</div>
      </div>
    `;
  }
  _renderRight2(width, height) {
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
    const label = lunarData.节气.下一节气;
    return html`
      <div export class="calendar"\n style="${style}">
        <div export class="state"\n style="grid-area: a1;">${label}</div>
      </div>
    `;
  }
  _renderLeft3(width, height) {
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
    const label1 = lunarData.宜;
    const label2 = lunarData.忌;
    const maxLength = Math.max(
      label1 ? label1.length : 0,
      label2 ? label2.length : 0
    );
    const commonFontSize = this._calcFontSizeL3(maxLength);
    return html` 
      <div export class="calendar"\n style="${style}">
        <div export class="label"\n style="grid-area: a1;">宜</div>
        <div export class="state"\n style="grid-area: b1; font-size: ${commonFontSize}">${label1}</div>
      </div>
    `;
  }
  _renderRight3(width, height) {
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
    const label1 = lunarData.宜;
    const label2 = lunarData.忌;
    const maxLength = Math.max(
      label1 ? label1.length : 0,
      label2 ? label2.length : 0
    );
    const commonFontSize = this._calcFontSizeL3(maxLength);
    return html` 
      <div export class="calendar"\n style="${style}">
        <div export class="label"\n style="grid-area: a1;">忌</div>
        <div export class="state"\n style="grid-area: b1; font-size: ${commonFontSize}">${label2}</div>
      </div>
    `;
  }
  _renderLeft4(width, height) {
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
    const commonFontSize = this._calcFontSizeL3(maxLength);
    return html` 
      <div export class="calendar"\n style="${style}">
        <div export class="label"\n style="grid-area: a1;">吉神宜趋</div>
        <div export class="state"\n style="grid-area: b1; font-size: ${commonFontSize}">${label1}</div>
      </div>
    `;
  }
  _renderRight4(width, height) {
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
    const commonFontSize = this._calcFontSizeL3(maxLength);
    return html` 
      <div export class="calendar"\n style="${style}">
        <div export class="label"\n style="grid-area: a1;">凶煞宜忌</div>
        <div export class="state"\n style="grid-area: b1; font-size: ${commonFontSize}">${label2}</div>
      </div>
    `;
  }
  _renderLeft5(width, height) {
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
    const labela2 = lunarData.彭祖干;
    const labelb2 = lunarData.彭祖支;
    return html`
      <div export class="calendar"\n style="${style}">
        <div export class="label"\n style="grid-area: a1;">彭祖</div>
        <div export class="label"\n style="grid-area: b1;">百忌</div>
        <div export class="state"\n style="grid-area: a2;">${labela2}</div>
        <div export class="state"\n style="grid-area: b2;">${labelb2}</div>
      </div>
    `;
  }
  _renderRight5(width, height) {
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
    const labela2 = lunarData.本月胎神;
    const labelb2 = lunarData.今日胎神;
    return html`
      <div export class="calendar"\n style="${style}">
        <div export class="label"\n style="grid-area: a1;">本月胎神</div>
        <div export class="label"\n style="grid-area: b1;">今日胎神</div>
        <div export class="state"\n style="grid-area: a2;">${labela2}</div>
        <div export class="state"\n style="grid-area: b2;">${labelb2}</div>
      </div>
    `;
  }
  _renderLeft6(width, height) {
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
    const labela2 = lunarData.日禄;
    const labelb2 = lunarData.物候;
    return html`
      <div export class="calendar"\n style="${style}">
        <div export class="label"\n style="grid-area: a1;">日禄</div>
        <div export class="label"\n style="grid-area: b1;">物候</div>
        <div export class="state"\n style="grid-area: a2;">${labela2}</div>
        <div export class="state"\n style="grid-area: b2;">${labelb2}</div>
      </div>
    `;
  }
  _renderRight6(width, height) {
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
    const labela2 = lunarData.九星;
    const labelb2 = lunarData.星宿;
    return html`
      <div export class="calendar"\n style="${style}">
        <div export class="label"\n style="grid-area: a1;">九星</div>
        <div export class="label"\n style="grid-area: b1;">星宿</div>
        <div export class="state"\n style="grid-area: a2;">${labela2}</div>
        <div export class="state"\n style="grid-area: b2;">${labelb2}</div>
      </div>
    `;
  }

  render() {
    if (!this.hass) {
      return html`<div>Loading...</div>`;
    }
    const headHeight1 = '320px';
    const headHeight12 = '120px';
    const headHeight9 = '90px';
    const headHeight6 = '60px';
    const headHeight3 = '30px';
    const w = '100%';
    return html`
      <div class="grid-container">
        <div class="grid-item head">
          <div class="sub-host sub-head">${this._renderHead(w, headHeight6)}</div>
        </div>

        <div class="grid-item lunar">
          <div class="sub-host sub-cal">${this._renderCalendar(w, headHeight1)}</div>
        </div>

        <div class="grid-item body1">
          <div class="sub-host sub-body1">${this._renderBody1(w, headHeight6)}</div>
        </div>

        <div class="grid-item body7">
          <div class="sub-host sub-body7">${this._renderBody7(w, headHeight6)}</div>
        </div>

        <div class="grid-item left1">
          <div class="sub-host sub-left1">${this._renderLeft1(w, headHeight9)}</div>
        </div>

        <div class="grid-item right1">
          <div class="sub-host sub-right1">${this._renderRight1(w, headHeight9)}</div>
        </div>

        <div class="grid-item left2">
          <div class="sub-host sub-left2">${this._renderLeft2(w, headHeight3)}</div>
        </div>

        <div class="grid-item right2">
          <div class="sub-host sub-right2">${this._renderRight2(w, headHeight3)}</div>
        </div>

        <div class="grid-item left3">
          <div class="sub-host sub-left3">${this._renderLeft3(w, headHeight12)}</div>
        </div>

        <div class="grid-item right3">
          <div class="sub-host sub-right3">${this._renderRight3(w, headHeight12)}</div>
        </div>

        <div class="grid-item left4">
          <div class="sub-host sub-left4">${this._renderLeft4(w, headHeight12)}</div>
        </div>

        <div class="grid-item right4">
          <div class="sub-host sub-right4">${this._renderRight4(w, headHeight12)}</div>
        </div>

        <div class="grid-item left5">
          <div class="sub-host sub-left5">${this._renderLeft5(w, headHeight6)}</div>
        </div>

        <div class="grid-item right5">
          <div class="sub-host sub-right5">${this._renderRight5(w, headHeight6)}</div>
        </div>

        <div class="grid-item left6">
          <div class="sub-host sub-left6">${this._renderLeft6(w, headHeight6)}</div>
        </div>

        <div class="grid-item right6">
          <div class="sub-host sub-right6">${this._renderRight6(w, headHeight6)}</div>
        </div>
      </div>
    `;
  }
}

customElements.define('xiaoshi-lunar-calendar-pad', LunarCalendarPad);

class LunarCalendarPadDateEditor extends LitElement {
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
      input[type="color"] { width: 50px; height: 36px; padding: 2px; cursor: pointer; }
      .conditional-field { display: none; }
      .conditional-field.visible { display: flex; flex-direction: column; gap: 5px; }
      .form-group-inline { flex-direction: row !important; align-items: center; gap: 8px; }
      .form-group-inline label { white-space: nowrap; }
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
          <label>时钟模式</label>
          <select
            @change=${this._valueChanged}
            .value=${this.config.mode || 'A'}
            name="mode"
          >
            <option value="A">A - 普通时钟</option>
            <option value="B">B - 翻页时钟</option>
          </select>
        </div>

        <div class="form-group">
          <label>主题</label>
          <select
            @change=${this._valueChanged}
            .value=${this.config.theme || 'theme()'}
            name="theme"
          >
            <option value="theme()">theme() - 跟随全局函数</option>
            <option value="theme()">system - 跟随系统</option>
            <option value="light">light - 浅色模式</option>
            <option value="dark">dark - 深色模式</option>
          </select>
          <span style="font-size:12px;color:#888;">也可引用全局函数：[[[ return theme() ]]]</span>
        </div>

        <div class="form-group">
          <label>显示生日</label>
          <select
            @change=${this._valueChanged}
            .value=${this.config.show_birthday !== undefined ? String(this.config.show_birthday) : 'true'}
            name="show_birthday"
          >
            <option value="true">显示</option>
            <option value="false">隐藏</option>
          </select>
        </div>

        <div class="form-group">
          <label>显示节日</label>
          <select
            @change=${this._valueChanged}
            .value=${this.config.show_holiday !== undefined ? String(this.config.show_holiday) : 'true'}
            name="show_holiday"
          >
            <option value="true">显示</option>
            <option value="false">隐藏</option>
          </select>
        </div>

        <div class="form-group">
          <label>简化日期</label>
          <select
            @change=${this._valueChanged}
            .value=${this.config.simplified !== undefined ? String(this.config.simplified) : 'false'}
            name="simplified"
          >
            <option value="false">标准（显示日期、星期、农历月日、节气、农历年、时刻）</option>
            <option value="true">简化（显示日期、星期、农历月日）</option>
          </select>
        </div>
      </div>
    `;
  }

  _valueChanged(e) {
    const { name, value } = e.target;
    if (!value) return;

    let processedValue = value;
    if (name === 'show_birthday' || name === 'show_holiday' || name === 'simplified') {
      processedValue = value === 'true';
    }

    this.config = {
      ...this.config,
      [name]: processedValue
    };

    if (name === 'mode') {
      setTimeout(() => this._updateConditionalFields(), 0);
    }

    this.dispatchEvent(new CustomEvent('config-changed', {
      detail: { config: this.config },
      bubbles: true,
      composed: true
    }));
  }

  _updateConditionalFields() {
    // mode B 的条件字段已移除
  }

  _onEntityInput(e) {
    this.config = {
      ...this.config,
      entity: e.target.value
    };
  }

  setConfig(config) {
    this.config = config;
    setTimeout(() => {
      this._updateConditionalFields();
    }, 0);
  }
}
customElements.define('xiaoshi-lunar-calendar-pad-date-editor', LunarCalendarPadDateEditor);

class LunarCalendarPadDate extends LitElement {
    static getConfigElement() {
      return document.createElement("xiaoshi-lunar-calendar-pad-date-editor");
    }
    static get properties() {
    return {
      hass: { type: Object },
      config: { type: Object },
      _currentTime: { type: Object },
      _lunarState: { type: Object },
      _flipParts: { type: Array },
      _previousTime: { type: Object },
      _displayTime: { type: Object },
      _theme: { type: String }
    };
  }

  constructor() {
    super();
    this._currentTime = { hours: '', minutes: '', seconds: '' };
    this._previousTime = { hours: '', minutes: '', seconds: '' };
    this._displayTime = { hours: '', minutes: '', seconds: '' };
    this._flipParts = [];
    this._updateInterval = null;
    this._mode = 'A';
    this._theme = 'theme()';
    // 弹窗 hass 状态订阅
    this._popupHassUnsubscribe = null;
    this._popupUpdatePending = false;
    this._popupHass = null;
  }

  setConfig(config) {
    this.config = config;
    this._mode = config.mode || 'A';
    this._theme = config.theme || 'theme()';
    this._showBirthday = config.show_birthday !== undefined ? config.show_birthday : true;
    this._showHoliday = config.show_holiday !== undefined ? config.show_holiday : true;
    this._simplified = config.simplified !== undefined ? config.simplified : false;
  }

  connectedCallback() {
    super.connectedCallback();
    this._updateTime();
    this._updateInterval = setInterval(() => this._updateTime(), 1000);
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    clearInterval(this._updateInterval);
    this._closePopup();
  }

  set hass(hass) {
    this._hass = hass;
    const lunarEntity = this.config?.entity || 'sensor.lunar_calendar';
    this._lunarState = this._hass.states[lunarEntity];
    this._updateStyles();
    this.requestUpdate();
  }

  _updateTime() {
    const now = new Date();
    const beijingOffset = 8 * 60;
    const utcTime = now.getTime() + now.getTimezoneOffset() * 60000;
    const beijingTime = new Date(utcTime + beijingOffset * 60000);
    const newTime = {
      hours: beijingTime.getHours().toString().padStart(2, '0'),
      minutes: beijingTime.getMinutes().toString().padStart(2, '0'),
      seconds: beijingTime.getSeconds().toString().padStart(2, '0')
    };
    this._previousTime = {...this._displayTime};
    if (this._mode === 'B') {
      this._updateFlipParts(newTime);
    } else {
      this._currentTime = newTime;
      this._displayTime = {...newTime};
      this.requestUpdate();
    }
  }

  _updateFlipParts(newTime) {
    this._flipParts = [];
    const parts = ['hours', 'minutes', 'seconds'];  
    parts.forEach(part => {
      if (newTime[part] !== this._displayTime[part]) {
        this._flipParts.push({
          part,
          newValue: newTime[part],
          oldValue: this._displayTime[part],
          flipping: true
        });   
        setTimeout(() => {
          this._displayTime[part] = newTime[part];
          this._flipParts = this._flipParts.filter(p => p.part !== part);
          this.requestUpdate();
        }, 300);
      }
    });
    this._currentTime = newTime;
    this.requestUpdate();
  }

  render() {
    const dashDate = this._getAttribute(this._lunarState, '今天的阳历日期.日期1');
    const dashWeek = this._getAttribute(this._lunarState, '今天的阳历日期.星期1');
    const jieqi = this._getAttribute(this._lunarState, '节气.节气');
    const lunarYear = this._getAttribute(this._lunarState, '今天的农历日期.年');
    const lunarDate = this._getAttribute(this._lunarState, '今天的农历日期.日期').slice(-4);
    const shichen = this._getShichen();

    return html`
      <ha-card @click=${this._showPopup}>
        <div class="grid-container">
          ${this._mode === 'A' 
            ? html`<div id="time">${this._currentTime.hours}:${this._currentTime.minutes}:${this._currentTime.seconds}</div>`
            : this._renderFlipClock()
          }
          ${this._simplified
            ? html`<div style="grid-area: 2 / 1 / 3 / 5; text-align: center;">${dashDate} ${dashWeek} ${lunarDate}</div>`
            : html`
                <div id="date">${dashDate}</div>
                <div id="week">${dashWeek}</div>
                <div id="jieqi">${jieqi}</div>
                <div id="year">${lunarYear}</div>
                <div id="mon">${lunarDate}</div>
                <div id="day">${shichen}</div>
              `
          }
          ${(this._showBirthday || this._showHoliday) ? html`<div id="line"></div>` : ''}
          ${this._showBirthday
            ? html`<div id="shengri">${this._getAttribute(this._lunarState, '最近的生日.0')}</div>`
            : (this._showHoliday ? html`<div id="shengri">${this._getAttribute(this._lunarState, '最近的节日.0')}</div>` : '')
          }
          ${this._showBirthday && this._showHoliday ? html`<div id="jieri">${this._getAttribute(this._lunarState, '最近的节日.0')}</div>` : ''}
        </div>
      </ha-card>
    `;
  }

  _renderFlipClock() {
    const theme = this._evaluateTheme();
    let timeBgColor;
    if (theme === 'dark') {
      timeBgColor = 'rgb(100,100,100)';
    } else {
      timeBgColor = (typeof window.background === 'function') ? window.background() : 'rgb(10,100,100)';
    }
    const renderPart = (part) => {
      const flipPart = this._flipParts.find(p => p.part === part);
      const displayValue = flipPart ? flipPart.oldValue : this._displayTime[part];
      const topValue = flipPart ? flipPart.newValue : displayValue;
      return html`
        <div class="flip-part-container">
          <div class="part-top" style="background: ${timeBgColor}">${topValue}</div>
          ${flipPart ? html`
            <div class="flip-animation flipping">
              <div class="flip-animation-top" style="background: ${timeBgColor}">${flipPart.oldValue}</div>
              <div class="flip-animation-bottom" style="background: ${timeBgColor}">${flipPart.newValue}</div>
            </div>
          ` : ''}
          <div class="part-bottom" style="background: ${timeBgColor}">${displayValue}</div>
        </div>
      `;
    };
    return html`
      <div id="time"\n class="flip-clock">
        ${renderPart('hours')}
        <div class="colon">:</div>
        ${renderPart('minutes')}
        <div class="colon">:</div>
        ${renderPart('seconds')}
      </div>
    `;
  }

  static get styles() {
    return css`      :host { display: block; width: 240px; height: 145px; color: white !important; --text-color: white; }
      ha-card { background: transparent !important; box-shadow: none !important; border: none !important; cursor: pointer; }
      .grid-container { display: grid; grid-template-areas: "time time time time" "date week jieqi jieqi" "year mon mon day" "line line line line" "shengri shengri shengri shengri" "jieri jieri jieri jieri"; grid-template-columns: 80px 58px 16px 72px; grid-template-rows: 55px 20px 20px 15px 20px 20px; font-weight: bold; font-size: 16px; }
      #time { grid-area: time; font-size: 57px; font-weight: 430; text-align: center; white-space: nowrap; overflow: hidden; color: var(--text-color); line-height: 0.9; }
      .colon { display: flex; align-items: center; font-size: 50px; color: var(--time-text-color, white); margin: 0 -5px; }
      .flip-clock { display: flex; justify-content: center; gap: 10px; }
      .flip-part-container { position: relative; width: 80px; height: 50px; perspective: 200px; }
      .part-top, .part-bottom { line-height: 50px; font-size: 47px; position: absolute; width: 100%; height: 50%; overflow: hidden; display: flex; justify-content: center; backface-visibility: hidden; border-radius: 4px; color: var(--time-text-color, white); }
      .part-top { top: 0px; bottom: 2px; border-radius: 4px 4px 0 0; align-items: flex-start; z-index: 2; transform: translateZ(1px); }
      .part-bottom { bottom: -1px; border-radius: 0 0 4px 4px; align-items: flex-end; z-index: 1; transform: translateZ(1px); }
      .flip-animation { position: absolute; top: 0; width: 100%; height: 52%; transform-style: preserve-3d; transform-origin: bottom; z-index: 3; }
      .flip-animation-top, .flip-animation-bottom { line-height: 50px; font-size: 47px; position: absolute; width: 100%; height: 100%; display: flex; justify-content: center; overflow: hidden; backface-visibility: hidden; border-radius: 4px; transform-style: preserve-3d; color: var(--time-text-color, white); }
      .flip-animation-top { top: 0px; bottom: 2px; align-items: flex-start; transform: rotateX(0deg) translateZ(1px); border-radius: 4px 4px 0 0; }
      .flip-animation-bottom { bottom: -1px; align-items: flex-end; transform: rotateX(180deg) translateZ(1px); border-radius: 0 0 4px 4px; }
      .flipping { animation: flip 0.6s cubic-bezier(0.4, 0, 0.2, 1) forwards; }
      @keyframes flip {
        0% { transform: rotateX(0deg); }
        100% { transform: rotateX(-180deg); }
      }
      #date    { grid-area: date; color: var(--text-color) }
      #week    { grid-area: week; color: var(--text-color) }
      #jieqi   { grid-area: jieqi; text-align: right; color: var(--text-color) }
      #year    { grid-area: year; color: var(--text-color) }
      #mon     { grid-area: mon; color: var(--text-color) }
      #day     { grid-area: day; text-align: right; color: var(--text-color) }
      #line { grid-area: line; border-bottom: 2px solid rgb(255,255,255); margin: 5px 0; }
      #shengri { grid-area: shengri; color: var(--text-color); font-size: 15px }
      #jieri   { grid-area: jieri; color: var(--text-color); font-size: 15px }`;
  } 
 
  updated(changedProperties) {
    if (changedProperties.has('_theme')) {
      this._updateStyles(); 
    }
  }

  _updateStyles() {
    const theme = this._evaluateTheme();
    if (theme === 'light') {
      this.style.setProperty('--time-bg-color', 'rgba(0, 0, 0, 0.3)');
      this.style.setProperty('--time-text-color', 'white');
    } else {
      this.style.setProperty('--time-bg-color', 'rgba(255, 255, 255, 0.3)');
      this.style.setProperty('--time-text-color', 'white');
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

  _getCurrentTime() {
    const now = new Date();
    return {
      hours: now.getHours().toString().padStart(2, '0'),
      minutes: now.getMinutes().toString().padStart(2, '0'),
      seconds: now.getSeconds().toString().padStart(2, '0')
    };
  }

  _getShichen() {
    const tzArr = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥', '子'];
    const skArr = ['一', '二', '三', '四', '五', '六', '七', '八'];
    const h = new Date().getHours();
    const m = new Date().getMinutes();
    const shichen = tzArr[parseInt( (h+1) / 2)] + '时';
    const shike = skArr[parseInt(m / 15) + Math.abs((h % 2) - 1) * 4] + "刻";
    return shichen+shike;
  } 

  _getAttribute(state, path) { 
    return path.split('.').reduce((obj, key) => (obj || {})[key], state?.attributes || {}) || '';
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
    if (LunarCalendarPadDate._stylesInjected) return;
    LunarCalendarPadDate._stylesInjected = true;
    const style = document.createElement('style');
    style.id = 'xiaoshi-pad-popup-style';
    style.textContent = `
      @keyframes xiaoshiPadPopupIn {
        from { opacity: 0; transform: translate(-50%, -50%) scale(0.95); }
        to   { opacity: 1; transform: translate(-50%, -50%) scale(1); }
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
      console.error('[LunarCalendarPadDate] 无法获取 hass 对象');
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
    const popup = document.createElement('div');
    popup.style.cssText = `
      position: fixed;
      top: 50%; left: 50%;
      transform: translate(-50%, -50%);
      z-index: 1005;
      background: transparent;
      padding: 0;
      max-width: 100vw;
      max-height: 100vh;
      overflow: hidden;
      box-sizing: border-box;
      animation: xiaoshiPadPopupIn 0.2s ease-out;
    `;

    document.body.appendChild(overlay);
    document.body.appendChild(popup);

    this._popupOverlay = overlay;
    this._popupElement = popup;

    // 创建卡片
    const cardConfig = {
      type: 'custom:xiaoshi-lunar-calendar-pad',
      theme: theme
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
      console.error('[LunarCalendarPadDate] 创建弹窗卡片失败:', err);
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
      // 重试
      const timer = setTimeout(() => this._startPopupHassWatcher(hassObj), 500);
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
      console.error('[LunarCalendarPadDate] 订阅状态变化失败:', err);
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
        console.warn('[LunarCalendarPadDate] 弹窗卡片更新失败:', err.message);
      }
    }
  }
}
customElements.define('xiaoshi-lunar-calendar-pad-date', LunarCalendarPadDate);