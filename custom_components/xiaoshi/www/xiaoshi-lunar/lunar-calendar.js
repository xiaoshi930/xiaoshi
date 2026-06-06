import { LitElement, html, css } from "https://unpkg.com/lit-element@2.4.0/lit-element.js?module";

class LunarCalendar extends LitElement {
  static get properties() {
    return {
      hass: { type: Object },
      width: { type: String, attribute: true },
      height: { type: String, attribute: true },
      year: { type: Number },
      month: { type: Number },
      activeNav: { type: String },
      theme: { type: String },
      config: { type: Object },
      selectedDate: { type: String },
      dateEntity: { type: String },
      lunarEntity: { type: String },
      lunarData: { type: Array },
      todayDate: { type: String },
      birthdays: { type: Array },
      solarFestivals: { type: Array },
      lunarFestivals: { type: Array },
      solarTerms: { type: Array },
      lunarDaysData: { type: Array },
      holidays: { type: Array }
    };
  }
  
  setConfig(config) {
    this.config = config;
    if (config) {
      if (config.width !== undefined) this.width = config.width;
      if (config.height !== undefined) this.height = config.height;
      if (config.year !== undefined) this.year = config.year;
      if (config.month !== undefined) this.month = config.month;
      this.dateEntity = config.date || 'date.lunar_tap_date';
      this.lunarEntity = config.lunar || 'sensor.lunar_calendar';
      this.requestUpdate();
    }
  }

  constructor() {
    super();
    const today = new Date();
    this.year = today.getFullYear();
    this.month = today.getMonth() + 1;
    this.day = today.getDate();
    this.width = '100%';
    this.height = '260px';
    this.theme = 'system';
    this.activeNav = '';
    this.todayDate = `${today.getFullYear()}-${this.pad(today.getMonth() + 1)}-${this.pad(today.getDate())}`;
    this.selectedDate = this.todayDate;
    this.dateEntity = 'date.lunar_tap_date';
    this.lunarEntity = 'sensor.lunar_calendar';
    this.lunarData = [];
    this.birthdays = [];
    this.solarFestivals = [];
    this.lunarFestivals = [];
    this.solarTerms = [];
    this.lunarDaysData = [];
    this.holidays = [];
  }

  static get styles() {
    return css`
      :host {
        display: block;
      }
      .calendar-grid {
        border-radius: 10px;
        display: grid;
        grid-template-areas:
          "yearlast year yearnext today monthlast month monthnext"
          "week1 week2 week3 week4 week5 week6 week7" 
          "id1 id2 id3 id4 id5 id6 id7" 
          "id8 id9 id10 id11 id12 id13 id14" 
          "id15 id16 id17 id18 id19 id20 id21" 
          "id22 id23 id24 id25 id26 id27 id28" 
          "id29 id30 id31 id32 id33 id34 id35" 
          "id36 id37 id38 id39 id40 id41 id42";
        grid-template-columns: repeat(7, 1fr);
        grid-template-rows: 1fr 0.6fr 1fr 1fr 1fr 1fr 1fr 1fr;
        gap: 1px;
        padding: 2px;
        --current-month-color: inherit;
        --other-month-color: rgb(160,160,160,0.5);
        user-select: none;
        -webkit-user-select: none;
        -moz-user-select: none;
        -ms-user-select: none;
        margin-bottom: -3px;
      }
      .celltotal {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: 0;
        cursor: default;
        font-size: 15px;
        font-weight: 600;
        white-space: nowrap;
      }
      .cell {
        position: relative;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: 0;
        cursor: default;
        font-size: 12px;
        line-height: 12px;
        font-weight: 500;
        height: 100%;
      }
      .cell {
        -webkit-tap-highlight-color: transparent;
        tap-highlight-color: transparent;
      }
      .cell:active\n
      .selected-day:not(.selected-today),
      .cell.touched\n
      .selected-day:not(.selected-today) {
        border-radius: 10px;
      }
      .nav-button {
        cursor: pointer;
        user-select: none;
        font-size: 12px;
        transition: all 0.5s ease;
        border-radius: 10px;
      }
      .nav-button:active {
        transform: scale(0.95);
        opacity: 0.8;
        border-radius: 10px;
      }
      .active-nav {
        border-radius: 10px;
        transition: all 0.5s ease;
      }
      .today-button {
        cursor: pointer;
        user-select: none;
        transition: all 0.5s ease;
        border-radius: 10px;
      }
      .nav-button, .today-button {
        -webkit-tap-highlight-color: transparent;
        tap-highlight-color: transparent;
      }
      .nav-button:active, 
      .today-button:active,
      .nav-button.active-nav, 
      .today-button.active-nav {
        border-radius: 10px !important;
        background-color: rgba(0, 160, 160, 0.2) !important;
      }
      .weekday {
        font-size: 13px;
        font-weight: bold;
      }
      .month-day {
        cursor: pointer;
        color: var(--current-month-color);
      }
      .month-day\n
      .lunar-day {
        color: var(--current-month-color);
      }
      .prev-month-day, 
      .next-month-day {
        color: var(--other-month-color);
      }
      .prev-month-day\n
      .lunar-day,
      .next-month-day\n
      .lunar-day {
        color: var(--other-month-color);
      }
      .birthday-current,
      .festival-current,
      .solar-term-current {
        color: inherit !important;
      }
      .selected-day {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        width: 100%;
        height: 100%;
        border-radius: 10px;
      }
      .selected-today {
        background-color: #00a0a0;
        color: white;
      }
      .selected-other {
        border: 2px solid #00a0a0;
      }
      .today-not-selected {
        color: #00a0a0;
        font-weight: 800;
      }
      .lunar-day {
        font-size: 10px;
        margin-top: 2px;
        text-align: center;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        max-width: 90%;
      }
      .selected-day\n
      .lunar-day {
        color: inherit;
      }
      .birthday-current {
        color: rgb(255, 70, 0) !important;
      }
      .birthday-other {
        color: rgb(255, 140, 50, 0.6) !important;
      }
      .festival-current {
        color: rgb(0, 191, 255) !important;
      }
      .festival-other {
        color: rgb(0, 150, 200, 0.6) !important;
      }
      .solar-term-current {
        color: rgb(50, 220, 80) !important;
      }
      .solar-term-other {
        color: rgb(104, 192, 104, 0.6) !important;
      }
      .holiday-work {
        background-color: rgba(10, 200, 20, 0.1);
        border-radius: 10px;
      }
      .holiday-rest {
        background-color: rgba(255, 0, 0, 0.1);
        border-radius: 10px;
      }
      .holiday-label {
        position: absolute;
        top: 2px;
        left: 2px;
        font-size: 10px;
        font-weight: bold;
        z-index: 1;
        border-radius: 2px;
        padding: 0 2px;
        line-height: 1.2;
      }
      .holiday-work\n
      .holiday-label {
        color: rgb(10, 200, 20);
      }
      .holiday-rest\n
      .holiday-label {
        color: rgb(255, 0, 0);
      }
      .info-container {
        display: flex;
        flex-direction: column;
        align-items: center;
        width: 100%;
        height: 100%;
        justify-content: center;
      }
      .selected-day {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        width: 100%;
        height: 100%;
        border-radius: 10px;
      }
    `;
  }

  updated(changedProperties) {
    if (changedProperties.has('hass') && this.hass) {
      this.updateLunarData();
    }
  }

  updateLunarData() {
    if (this.hass && this.hass.states[this.lunarEntity]) {
      const lunarState = this.hass.states[this.lunarEntity];
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
  
  render() {
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
           style="width: ${this.width}; height: ${this.height}; background-color: ${bgColor}; color: ${fgColor};">
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
    if (this.hass && this.dateEntity && this.selectedDate) {
      this.hass.callService('date', 'set_value', {
        entity_id: this.dateEntity,
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
}
customElements.define('xiaoshi-lunar-calendar', LunarCalendar); 

class LunarCalendarHead extends LitElement {
  static get properties() {
    return {
      hass: { type: Object },
      lunar: { type: String },
      theme: { type: String },
      width: { type: String },
      height: { type: String }
    };
  }

  setConfig(config) {
    this.config = config;
    if (config) {
      this.lunar = config.lunar || 'sensor.lunar_calendar';
      this.theme = config.theme || 'system';
      this.width = config.width || '100%';
      this.height = config.height || '60px';
    }
  }

  constructor() {
    super();
    this.lunar = 'sensor.lunar_calendar';
    this.theme = 'system';
    this.width = '100%';
    this.height = '60px';
  }

  static get styles() {
    return css`
      :host {
        display: block;
      }
      .calendar {
        display: grid;
        grid-template-areas: 
          "gonglilabel gongli"
          "nonglilabel nongli";
        grid-template-columns: 15% 85%;
        grid-template-rows: 50% 50%;
        gap: 1px;
        padding: 2px;
        border-radius: 10px;
        margin-bottom: -3px;
      }
      .gongli-label, 
      .nongli-label {
        font-size: 15px;
        font-weight: bold;
        display: flex;
        align-items: center;
        justify-content: center;
      }
      .gongli-label {
        grid-area: gonglilabel;
      }
      .nongli-label {
        grid-area: nonglilabel;
      }
      .gongli-data, 
      .nongli-data {
        display: flex;
        align-items: center;
        justify-content: center;
        text-align: center;
      }
      .gongli-data {
        grid-area: gongli;
      }
      .nongli-data {
        grid-area: nongli;
      }
      .date-diff {
        font-size: 10px;
        color: rgb(150,150,150);
        display: inline-flex;
        align-items: flex-end;
        padding-top: 2px;
      }
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

  render() {
    if (!this.hass || !this.hass.states[this.lunar] || !this.hass.states[this.lunar].attributes) {
      return html`<div export class="calendar">加载中...</div>`;
    }
    const theme = this._evaluateTheme();
    const bgColor = theme === 'light' ? 'rgb(255, 255, 255)' : 'rgb(50, 50, 50)';
    const fgColor = theme === 'light' ? 'rgb(0, 0, 0)' : 'rgb(255, 255, 255)';
    const style = `
      background: ${bgColor};
      color: ${fgColor};
      width: ${this.width};
      height: ${this.height};
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
}
customElements.define('xiaoshi-lunar-calendar-head', LunarCalendarHead);

class LunarCalendarBody1 extends LitElement {
  static get properties() {
    return {
      hass: { type: Object },
      lunar: { type: String },
      theme: { type: String },
      width: { type: String },
      height: { type: String }
    };
  }

  setConfig(config) {
    this.config = config;
    if (config) {
      this.lunar = config.lunar || 'sensor.lunar_calendar';
      this.theme = config.theme || 'system'; 
      this.width = config.width || '100%';
      this.height = config.height || '55px';
    }
  }

  constructor() {
    super();
    this.lunar = 'sensor.lunar_calendar';
    this.theme = 'system';
    this.width = '100%';
    this.height = '55px';
  }

  static get styles() {
    return css`
      :host {
        display: block;
      }
      .calendar {
        display: grid;
        grid-template-areas: 
          "a0 a1 a2 a3 a4 a5 a6 a7 a8 a9 a10 a11 a12"
          "b0 b1 b2 b3 b4 b5 b6 b7 b8 b9 b10 b11 b12";
        grid-template-columns: repeat(13, minmax(0, 1fr));
        grid-template-rows: 65% 35%;
        gap: 1px;
        padding: 2px;
        border-radius: 10px;
        margin-bottom: -3px;
      }
      .time-cell {
        writing-mode: vertical-rl;
        text-orientation: mixed;
        text-align: center;
        font-size: 13px;
        white-space: nowrap;
        overflow: visible;
        display: flex;
        width: 100%;
        height: 100%;
        justify-content: center;
        align-items: center;
      }
      .luck-cell {
        text-align: center;
        font-size: 13px;
        width: 100%;
        height: 100%;
        justify-content: center;
        align-items: center;
      }
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

  render() {
    if (!this.hass || !this.hass.states[this.lunar] || !this.hass.states[this.lunar].attributes) {
      return html`<div export class="calendar">加载中...</div>`;
    }
    const theme = this._evaluateTheme();
    const bgColor = theme === 'light' ? 'rgb(255, 255, 255)' : 'rgb(50, 50, 50)';
    const fgColor = theme === 'light' ? 'rgb(0, 0, 0)' : 'rgb(255, 255, 255)';
    const style = `
      background: ${bgColor};
      color: ${fgColor};
      width: ${this.width};
      height: ${this.height};
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
}
customElements.define('xiaoshi-lunar-calendar-body1', LunarCalendarBody1);

class LunarCalendarBody2 extends LitElement {
  static get properties() {
    return {
      hass: { type: Object },
      lunar: { type: String },
      theme: { type: String },
      width: { type: String },
      height: { type: String }
    };
  }

  setConfig(config) {
    this.config = config;
    if (config) {
      this.lunar = config.lunar || 'sensor.lunar_calendar';
      this.theme = config.theme || 'system';
      this.width = config.width || '100%';
      this.height = config.height || '55px';
    }
  }

  constructor() {
    super();
    this.lunar = 'sensor.lunar_calendar';
    this.theme = 'system';
    this.width = '100%';
    this.height = '55px';
  }

  static get styles() {
    return css`
      :host {
        display: block;
      }
      .calendar {
        display: grid;
        grid-template-areas: 
          "a1 b1"
          "a2 b2";
        grid-template-columns: 10% 90%;
        grid-template-rows: 50% 50%;
        gap: 1px;
        padding: 2px;
        border-radius: 10px;
        margin-bottom: -3px;
      }
      .label1 {
        color: rgb(0,220,0);
        font-weight: bold;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 15px;
      }
      .label2 {
        color: rgb(255,0,0);
        font-weight: bold;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 15px;
      }
      .state {
        word-wrap: break-word;
        display: flex;
        align-items: center;
        line-height: 12px;
      }
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

  _calculateFontSize(length) {
    if (length <= 40) return '13px';
    if (length <= 70) return '12px';
    if (length <= 100) return '11px';
    if (length <= 130) return '10px';
    return '9px';
  }

  render() {
    if (!this.hass || !this.hass.states[this.lunar] || !this.hass.states[this.lunar].attributes) {
      return html`<div export class="calendar">加载中...</div>`;
    }
    const theme = this._evaluateTheme();
    const bgColor = theme === 'light' ? 'rgb(255, 255, 255)' : 'rgb(50, 50, 50)';
    const fgColor = theme === 'light' ? 'rgb(0, 0, 0)' : 'rgb(255, 255, 255)';
    const style = `background: ${bgColor};color: ${fgColor};width: ${this.width};height: ${this.height};
    `;
    const lunarData = this.hass.states[this.lunar].attributes.老黄历信息;
    const label1 = lunarData.宜;
    const label2 = lunarData.忌;
    const maxLength = Math.max(
      label1 ? label1.length : 0,
      label2 ? label2.length : 0
    );
    const commonFontSize = this._calculateFontSize(maxLength);
    return html`
      <div export class="calendar"\n style="${style}">
        <div export class="label1">宜</div>
        <div export class="state"\n style="grid-area: b1; font-size: ${commonFontSize}">${label1}</div>
        <div export class="label2">忌</div>
        <div export class="state"\n style="grid-area: b2; font-size: ${commonFontSize}">${label2}</div>
      </div>
    `;
  }
}
customElements.define('xiaoshi-lunar-calendar-body2', LunarCalendarBody2);

class LunarCalendarBody3 extends LitElement {
  static get properties() {
    return {
      hass: { type: Object },
      lunar: { type: String },
      theme: { type: String },
      width: { type: String },
      height: { type: String }
    };
  }

  setConfig(config) {
    this.config = config;
    if (config) {
      this.lunar = config.lunar || 'sensor.lunar_calendar';
      this.theme = config.theme || 'system';
      this.width = config.width || '100%';
      this.height = config.height || '55px';
    }
  }

  constructor() {
    super();
    this.lunar = 'sensor.lunar_calendar';
    this.theme = 'system';
    this.width = '100%';
    this.height = '55px';
  }

  static get styles() {
    return css`
      :host {
        display: block;
      }
      .calendar {
        display: grid;
        grid-template-areas: 
          "a1 b1"
          "a2 b2";
        grid-template-columns: 10% 90%;
        grid-template-rows: 50% 50%;
        gap: 1px;
        padding: 2px;
        border-radius: 10px;
        margin-bottom: -3px;
      }
      .label1 {
        color: rgb(0,220,0);
        font-weight: bold;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 13px;
      }
      .label2 {
        color: rgb(255,0,0);
        font-weight: bold;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 13px;
      }
      .state {
        word-wrap: break-word;
        display: flex;
        align-items: center;
        line-height: 13px;
      }
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

  _calculateFontSize(length) {
    if (length <= 40) return '13px';
    if (length <= 80) return '12px';
    if (length <= 120) return '11px';
    if (length <= 160) return '10px';
    return '9px';
  }

  render() {
    if (!this.hass || !this.hass.states[this.lunar] || !this.hass.states[this.lunar].attributes) {
      return html`<div export class="calendar">加载中...</div>`;
    }
    const theme = this._evaluateTheme();
    const bgColor = theme === 'light' ? 'rgb(255, 255, 255)' : 'rgb(50, 50, 50)';
    const fgColor = theme === 'light' ? 'rgb(0, 0, 0)' : 'rgb(255, 255, 255)';
    const style = `
      background: ${bgColor};
      color: ${fgColor};
      width: ${this.width};
      height: ${this.height};
    `;
    const lunarData = this.hass.states[this.lunar].attributes.老黄历信息;
    const label1 = lunarData.吉神;
    const label2 = lunarData.凶煞;
    const maxLength = Math.max(
      label1 ? label1.length : 0,
      label2 ? label2.length : 0
    );
    const commonFontSize = this._calculateFontSize(maxLength);
    return html`
      <div export class="calendar"\n style="${style}">
        <div export class="label1">吉神</div>
        <div export class="state"\n style="grid-area: b1; font-size: ${commonFontSize}">${label1}</div>
        <div export class="label2">凶煞</div>
        <div export class="state"\n style="grid-area: b2; font-size: ${commonFontSize}">${label2}</div>
      </div>
    `;
  }
}
customElements.define('xiaoshi-lunar-calendar-body3', LunarCalendarBody3);

class LunarCalendarBody4 extends LitElement {
  static get properties() {
    return {
      hass: { type: Object },
      lunar: { type: String },
      theme: { type: String },
      width: { type: String },
      height: { type: String }
    };
  }

  setConfig(config) {
    this.config = config;
    if (config) {
      this.lunar = config.lunar || 'sensor.lunar_calendar';
      this.theme = config.theme || 'system';
      this.width = config.width || '100%';
      this.height = config.height || '55px';
    }
  }

  constructor() {
    super();
    this.lunar = 'sensor.lunar_calendar';
    this.theme = 'system';
    this.width = '100%';
    this.height = '55px';
  }

  static get styles() {
    return css`
      :host {
        display: block;
      }
      .calendar {
        display: grid;
        grid-template-areas: 
          "a1 b1 a3 b3"
          "a2 b2 a4 b4";
        grid-template-columns: 10% 40% 10% 40%;
        grid-template-rows: 50% 50%;
        gap: 1px;
        padding: 2px;
        border-radius: 10px;
        margin-bottom: -3px;
      }
      .label{
        color: rgb(255,0,0);
        font-weight: bold;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 13px;
      }
      .state {
        word-wrap: break-word;
        display: flex;
        align-items: center;
        font-size: 13px;
        line-height: 13px;
      }
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

  render() {
    if (!this.hass || !this.hass.states[this.lunar] || !this.hass.states[this.lunar].attributes) {
      return html`<div export class="calendar">加载中...</div>`;
    }
    const theme = this._evaluateTheme();
    const bgColor = theme === 'light' ? 'rgb(255, 255, 255)' : 'rgb(50, 50, 50)';
    const fgColor = theme === 'light' ? 'rgb(0, 0, 0)' : 'rgb(255, 255, 255)';
    const style = `
      background: ${bgColor};
      color: ${fgColor};
      width: ${this.width};
      height: ${this.height};
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
}
customElements.define('xiaoshi-lunar-calendar-body4', LunarCalendarBody4);

class LunarCalendarBody5 extends LitElement {
  static get properties() {
    return {
      hass: { type: Object },
      lunar: { type: String },
      theme: { type: String },
      width: { type: String },
      height: { type: String }
    };
  }

  setConfig(config) {
    this.config = config;
    if (config) {
      this.lunar = config.lunar || 'sensor.lunar_calendar';
      this.theme = config.theme || 'system';
      this.width = config.width || '100%';
      this.height = config.height || '55px';
    }
  }

  constructor() {
    super();
    this.lunar = 'sensor.lunar_calendar';
    this.theme = 'system';
    this.width = '100%'; 
    this.height = '55px';
  }

  static get styles() {
    return css`
      :host {
        display: block;
      }
      .calendar {
        display: grid;
        grid-template-areas: 
          "a1 b1 a3 b3"
          "a2 b2 a4 b4";
        grid-template-columns: 10% 40% 10% 40%;
        grid-template-rows: 50% 50%;
        gap: 1px;
        padding: 2px;
        border-radius: 10px;
        margin-bottom: -3px;
      }
      .label{
        color: rgb(0,220,0);
        font-weight: bold;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 13px;
      }
      .state {
        word-wrap: break-word;
        display: flex;
        align-items: center;
        font-size: 13px;
        line-height: 13px;
      }
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

  render() {
    if (!this.hass || !this.hass.states[this.lunar] || !this.hass.states[this.lunar].attributes) {
      return html`<div export class="calendar">加载中...</div>`;
    }
    const theme = this._evaluateTheme();
    const bgColor = theme === 'light' ? 'rgb(255, 255, 255)' : 'rgb(50, 50, 50)';
    const fgColor = theme === 'light' ? 'rgb(0, 0, 0)' : 'rgb(255, 255, 255)';
    const style = `
      background: ${bgColor};
      color: ${fgColor};
      width: ${this.width};
      height: ${this.height};
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
}
customElements.define('xiaoshi-lunar-calendar-body5', LunarCalendarBody5);

class LunarCalendarBody6 extends LitElement {
  static get properties() {
    return {
      hass: { type: Object },
      lunar: { type: String },
      theme: { type: String },
      width: { type: String },
      height: { type: String }
    };
  }

  setConfig(config) {
    this.config = config;
    if (config) {
      this.lunar = config.lunar || 'sensor.lunar_calendar';
      this.theme = config.theme || 'system';
      this.width = config.width || '100%';
      this.height = config.height || '55px';
    }
  }

  constructor() {
    super();
    this.lunar = 'sensor.lunar_calendar';
    this.theme = 'system';
    this.width = '100%'; 
    this.height = '55px';
  }

  static get styles() {
    return css`
      :host {
        display: block;
      }
      .calendar {
        display: grid;
        grid-template-areas: 
          "a1 b1 a2 b2 b2 b2"
          "a3 b3 a4 b4 a5 b5";
        grid-template-columns: 10% 40% 10% 10% 20% 10%;
        grid-template-rows: 50% 50%;
        gap: 1px;
        padding: 2px;
        border-radius: 10px;
        margin-bottom: -3px;
      }
      .label{
        color: rgb(0,220,0);
        font-weight: bold;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 13px;
      }
      .state {
        word-wrap: break-word;
        display: flex;
        align-items: center;
        font-size: 13px;
        line-height: 13px;
      }
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

  render() {
    if (!this.hass || !this.hass.states[this.lunar] || !this.hass.states[this.lunar].attributes) {
      return html`<div export class="calendar">加载中...</div>`;
    }
    const theme = this._evaluateTheme();
    const bgColor = theme === 'light' ? 'rgb(255, 255, 255)' : 'rgb(50, 50, 50)';
    const fgColor = theme === 'light' ? 'rgb(0, 0, 0)' : 'rgb(255, 255, 255)';
    const style = `
      background: ${bgColor};
      color: ${fgColor};
      width: ${this.width};
      height: ${this.height};
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
}
customElements.define('xiaoshi-lunar-calendar-body6', LunarCalendarBody6);

class LunarCalendarBody7 extends LitElement {
  static get properties() {
    return {
      hass: { type: Object },
      lunar: { type: String },
      theme: { type: String },
      width: { type: String },
      height: { type: String }
    };
  }

  setConfig(config) {
    this.config = config;
    if (config) {
      this.lunar = config.lunar || 'sensor.lunar_calendar';
      this.theme = config.theme || 'system';
      this.width = config.width || '100%';
      this.height = config.height || '55px';
    }
  }

  constructor() {
    super();
    this.lunar = 'sensor.lunar_calendar';
    this.theme = 'system';
    this.width = '100%'; 
    this.height = '55px';
  }

  static get styles() {
    return css`
      :host {
        display: block;
      }
      .calendar {
        display: grid;
        grid-template-areas: 
          "a1 a2 a3 a4 a5"
          "b1 b2 b3 b4 b5";
        grid-template-columns: 20% 20% 20% 20% 20%;
        grid-template-rows: 50% 50%;
        gap: 1px;
        padding: 2px;
        border-radius: 10px;
        margin-bottom: -3px;
      }
      .label{
        color: rgb(0,220,0);
        font-weight: bold;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 14px;
      }
      .state {
        word-wrap: break-word;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 13px;
        line-height: 13px;
      }
      .direction-container {
        display: flex;
        align-items: center;
        justify-content: center;
        --mdc-icon-size: 15px;
      }
      .direction-icon {
        transition: transform 0.3s ease;
      }
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

  render() {
    if (!this.hass || !this.hass.states[this.lunar] || !this.hass.states[this.lunar].attributes) {
      return html`<div export class="calendar">加载中...</div>`;
    }
    const theme = this._evaluateTheme();
    const bgColor = theme === 'light' ? 'rgb(255, 255, 255)' : 'rgb(50, 50, 50)';
    const fgColor = theme === 'light' ? 'rgb(0, 0, 0)' : 'rgb(255, 255, 255)';
    const style = `
      background: ${bgColor};
      color: ${fgColor};
      width: ${this.width};
      height: ${this.height};
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
}
customElements.define('xiaoshi-lunar-calendar-body7', LunarCalendarBody7);

class LunarCalendarLeft1 extends LitElement {
  static get properties() {
    return {
      hass: { type: Object },
      lunar: { type: String },
      theme: { type: String },
      width: { type: String },
      height: { type: String }
    };
  }

  setConfig(config) {
    this.config = config;
    if (config) {
      this.lunar = config.lunar || 'sensor.lunar_calendar';
      this.theme = config.theme || 'system';
      this.width = config.width || '100%';
      this.height = config.height || '90px';
    }
  }

  constructor() {
    super();
    this.lunar = 'sensor.lunar_calendar';
    this.theme = 'system';
    this.width = '100%'; 
    this.height = '90px';
  }

  static get styles() {
    return css`
      :host {
        display: block;
      }
      .calendar {
        display: grid;
        grid-template-areas: 
          "a1 a2 a3"
          "b1 b2 b3"
          "c1 c2 c3";
        grid-template-columns: 33% 17% 50%;
        grid-template-rows: repeat(3, 1fr);
        gap: 1px;
        padding: 2px;
        border-radius: 10px;
        margin-bottom: -3px;
      }
      .label{
        color: rgb(250,50,10);
        font-weight: bold;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 13px;
      }
      .state {
        word-wrap: break-word;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 13px;
        line-height: 13px;
      }
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

  render() {
    if (!this.hass || !this.hass.states[this.lunar] || !this.hass.states[this.lunar].attributes) {
      return html`<div export class="calendar">加载中...</div>`;
    }
    const theme = this._evaluateTheme();
    const bgColor = theme === 'light' ? 'rgb(255, 255, 255)' : 'rgb(50, 50, 50)';
    const fgColor = theme === 'light' ? 'rgb(0, 0, 0)' : 'rgb(255, 255, 255)';
    const style = `background: ${bgColor};color: ${fgColor};width: ${this.width};height: ${this.height};
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
} 
customElements.define('xiaoshi-lunar-calendar-left1', LunarCalendarLeft1);

class LunarCalendarRight1 extends LitElement {
  static get properties() {
    return {
      hass: { type: Object },
      lunar: { type: String },
      theme: { type: String },
      width: { type: String },
      height: { type: String }
    };
  }

  setConfig(config) {
    this.config = config;
    if (config) {
      this.lunar = config.lunar || 'sensor.lunar_calendar';
      this.theme = config.theme || 'system';
      this.width = config.width || '100%';
      this.height = config.height || '90px';
    }
  }

  constructor() {
    super();
    this.lunar = 'sensor.lunar_calendar';
    this.theme = 'system';
    this.width = '100%'; 
    this.height = '90px';
  }

  static get styles() {
    return css`
      :host {
        display: block;
      }
      .calendar {
        display: grid;
        grid-template-areas: 
          "a1 a2"
          "b1 b2"
          "c1 c2";
        grid-template-columns: 27% 73%;
        grid-template-rows: repeat(3, 1fr);
        gap: 1px;
        padding: 2px;
        border-radius: 10px;
        margin-bottom: -3px;
      }
      .label{
        color: rgb(250,50,10);
        font-weight: bold;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 13px;
      }
      .state {
        word-wrap: break-word;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 13px;
        line-height: 13px;
      }
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

  render() {
    if (!this.hass || !this.hass.states[this.lunar] || !this.hass.states[this.lunar].attributes) {
      return html`<div export class="calendar">加载中...</div>`;
    }
    const theme = this._evaluateTheme();
    const bgColor = theme === 'light' ? 'rgb(255, 255, 255)' : 'rgb(50, 50, 50)';
    const fgColor = theme === 'light' ? 'rgb(0, 0, 0)' : 'rgb(255, 255, 255)';
    const style = `
      background: ${bgColor};
      color: ${fgColor};
      width: ${this.width};
      height: ${this.height};
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
} 
customElements.define('xiaoshi-lunar-calendar-right1', LunarCalendarRight1);

class LunarCalendarLeft2 extends LitElement {
  static get properties() {
    return {
      hass: { type: Object },
      lunar: { type: String },
      theme: { type: String },
      width: { type: String },
      height: { type: String }
    };
  }

  setConfig(config) {
    this.config = config;
    if (config) {
      this.lunar = config.lunar || 'sensor.lunar_calendar';
      this.theme = config.theme || 'system';
      this.width = config.width || '100%';
      this.height = config.height || '30px';
    }
  }

  constructor() {
    super();
    this.lunar = 'sensor.lunar_calendar';
    this.theme = 'system';
    this.width = '100%'; 
    this.height = '30px';
  }

  static get styles() {
    return css`
      :host {
        display: block;
      }
      .calendar {
        display: grid;
        grid-template-areas: 
          "a1";
        grid-template-columns: 100%;
        grid-template-rows: 100%;
        gap: 1px;
        padding: 2px;
        border-radius: 10px;
        margin-bottom: -3px;
      }
      .state {
        word-wrap: break-word;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 13px;
        line-height: 13px;
      }
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

  render() {
    if (!this.hass || !this.hass.states[this.lunar] || !this.hass.states[this.lunar].attributes) {
      return html`<div export class="calendar">加载中...</div>`;
    }
    const theme = this._evaluateTheme();
    const bgColor = theme === 'light' ? 'rgb(255, 255, 255)' : 'rgb(50, 50, 50)';
    const fgColor = theme === 'light' ? 'rgb(0, 0, 0)' : 'rgb(255, 255, 255)';
    const style = `
      background: ${bgColor};
      color: ${fgColor};
      width: ${this.width};
      height: ${this.height};
    `;
    const lunarData = this.hass.states[this.lunar].attributes;
    const label = lunarData.节气.上一节气;
    return html`
      <div export class="calendar"\n style="${style}">
        <div export class="state"\n style="grid-area: a1;">${label}</div>
      </div>
    `;
  }
} 
customElements.define('xiaoshi-lunar-calendar-left2', LunarCalendarLeft2);

class LunarCalendarRight2 extends LitElement {
  static get properties() {
    return {
      hass: { type: Object },
      lunar: { type: String },
      theme: { type: String },
      width: { type: String },
      height: { type: String }
    };
  }

  setConfig(config) {
    this.config = config;
    if (config) {
      this.lunar = config.lunar || 'sensor.lunar_calendar';
      this.theme = config.theme || 'system';
      this.width = config.width || '100%';
      this.height = config.height || '30px';
    }
  }

  constructor() {
    super();
    this.lunar = 'sensor.lunar_calendar';
    this.theme = 'system';
    this.width = '100%'; 
    this.height = '30px';
  }

  static get styles() {
    return css`
      :host {
        display: block;
      }
      .calendar {
        display: grid;
        grid-template-areas: 
          "a1";
        grid-template-columns: 100%;
        grid-template-rows: 100%;
        gap: 1px;
        padding: 2px;
        border-radius: 10px;
        margin-bottom: -3px;
      }
      .state {
        word-wrap: break-word;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 13px;
        line-height: 13px;
      }
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

  render() {
    if (!this.hass || !this.hass.states[this.lunar] || !this.hass.states[this.lunar].attributes) {
      return html`<div export class="calendar">加载中...</div>`;
    }
    const theme = this._evaluateTheme();
    const bgColor = theme === 'light' ? 'rgb(255, 255, 255)' : 'rgb(50, 50, 50)';
    const fgColor = theme === 'light' ? 'rgb(0, 0, 0)' : 'rgb(255, 255, 255)';
    const style = `
      background: ${bgColor};
      color: ${fgColor};
      width: ${this.width};
      height: ${this.height}; 
    `;
    const lunarData = this.hass.states[this.lunar].attributes;
    const label = lunarData.节气.下一节气;
    return html`
      <div export class="calendar"\n style="${style}">
        <div export class="state"\n style="grid-area: a1;">${label}</div>
      </div>
    `;
  }
} 
customElements.define('xiaoshi-lunar-calendar-right2', LunarCalendarRight2);

class LunarCalendarLeft3 extends LitElement {
  static get properties() {
    return {
      hass: { type: Object },
      lunar: { type: String },
      theme: { type: String },
      width: { type: String },
      height: { type: String }
    };
  }

  setConfig(config) {
    this.config = config;
    if (config) {
      this.lunar = config.lunar || 'sensor.lunar_calendar';
      this.theme = config.theme || 'system';
      this.width = config.width || '100%';
      this.height = config.height || '120px';
    }
  }

  constructor() {
    super();
    this.lunar = 'sensor.lunar_calendar';
    this.theme = 'system';
    this.width = '100%'; 
    this.height = '120px';
  }

  static get styles() {
    return css`
      :host {
        display: block;
      }
      .calendar {
        display: grid;
        grid-template-areas: 
          "a1"
          "b1";
        grid-template-columns: 100%;
        grid-template-rows: 15% 85%;
        gap: 1px;
        padding: 2px;
        border-radius: 10px;
        margin-bottom: -3px;
        place-items: center; 
      }
      .label{
        background: rgb(0,220,0);
        border-radius: 100%;
        color: rgb(255,255,255);
        font-weight: bold;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 16px;
        width: 25px;
        height: 25px;
        margin-top: 15px;
      }
      .state {
        word-wrap: break-word;
        display: flex;
        align-items: center;
        justify-content: center;
        line-height: 16px;
        padding: 0 5px 0 5px;
      }
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

  _calculateFontSize(length) {
    if (length <= 70) return '13px';
    if (length <= 100) return '12px';
    if (length <= 130) return '11px';
    return '10px';
  }

  render() {
    if (!this.hass || !this.hass.states[this.lunar] || !this.hass.states[this.lunar].attributes) {
      return html`<div export class="calendar">加载中...</div>`;
    }
    const theme = this._evaluateTheme();
    const bgColor = theme === 'light' ? 'rgb(255, 255, 255)' : 'rgb(50, 50, 50)';
    const fgColor = theme === 'light' ? 'rgb(0, 0, 0)' : 'rgb(255, 255, 255)';
    const style = `
      background: ${bgColor};
      color: ${fgColor};
      width: ${this.width};
      height: ${this.height};
    `;
    const lunarData = this.hass.states[this.lunar].attributes.老黄历信息;
    const label1 = lunarData.宜;
    const label2 = lunarData.忌;
    const maxLength = Math.max(
      label1 ? label1.length : 0,
      label2 ? label2.length : 0
    );
    const commonFontSize = this._calculateFontSize(maxLength);
    return html` 
      <div export class="calendar"\n style="${style}">
        <div export class="label"\n style="grid-area: a1;">宜</div>
        <div export class="state"\n style="grid-area: b1; font-size: ${commonFontSize}">${label1}</div>
      </div>
    `;
  }
} 
customElements.define('xiaoshi-lunar-calendar-left3', LunarCalendarLeft3); 

class LunarCalendarRight3 extends LitElement {
  static get properties() {
    return {
      hass: { type: Object },
      lunar: { type: String },
      theme: { type: String },
      width: { type: String },
      height: { type: String }
    };
  }

  setConfig(config) {
    this.config = config;
    if (config) {
      this.lunar = config.lunar || 'sensor.lunar_calendar';
      this.theme = config.theme || 'system';
      this.width = config.width || '100%';
      this.height = config.height || '120px';
    }
  }

  constructor() {
    super();
    this.lunar = 'sensor.lunar_calendar';
    this.theme = 'system';
    this.width = '100%'; 
    this.height = '120px';
  }

  static get styles() { 
    return css`
      :host {
        display: block;
      }
      .calendar {
        display: grid;
        grid-template-areas: 
          "a1"
          "b1";
        grid-template-columns: 100%;
        grid-template-rows: 15% 85%;
        gap: 1px;
        padding: 2px;
        border-radius: 10px;
        margin-bottom: -3px;
        place-items: center; 
      }
      .label{
        background: rgb(200,20,0);
        border-radius: 100%;
        color: rgb(255,255,255);
        font-weight: bold;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 16px;
        width: 25px;
        height: 25px;
        margin-top: 15px;
      }
      .state {
        word-wrap: break-word;
        display: flex;
        align-items: center;
        justify-content: center;
        line-height: 16px;
        padding: 0 5px 0 5px;
      }
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

  _calculateFontSize(length) {
    if (length <= 70) return '13px'; 
    if (length <= 100) return '12px';
    if (length <= 130) return '11px';
    return '10px';
  }

  render() {
    if (!this.hass || !this.hass.states[this.lunar] || !this.hass.states[this.lunar].attributes) {
      return html`<div export class="calendar">加载中...</div>`;
    }
    const theme = this._evaluateTheme();
    const bgColor = theme === 'light' ? 'rgb(255, 255, 255)' : 'rgb(50, 50, 50)';
    const fgColor = theme === 'light' ? 'rgb(0, 0, 0)' : 'rgb(255, 255, 255)';
    const style = `
      background: ${bgColor};
      color: ${fgColor};
      width: ${this.width};
      height: ${this.height};
    `;
    const lunarData = this.hass.states[this.lunar].attributes.老黄历信息;
    const label1 = lunarData.宜;
    const label2 = lunarData.忌;
    const maxLength = Math.max(
      label1 ? label1.length : 0,
      label2 ? label2.length : 0
    );
    const commonFontSize = this._calculateFontSize(maxLength);
    return html` 
      <div export class="calendar"\n style="${style}">
        <div export class="label"\n style="grid-area: a1;">忌</div>
        <div export class="state"\n style="grid-area: b1; font-size: ${commonFontSize}">${label2}</div>
      </div>
    `;
  }
} 
customElements.define('xiaoshi-lunar-calendar-right3', LunarCalendarRight3); 

class LunarCalendarLeft4 extends LitElement {
  static get properties() {
    return {
      hass: { type: Object },
      lunar: { type: String },
      theme: { type: String },
      width: { type: String },
      height: { type: String }
    };
  }

  setConfig(config) {
    this.config = config;
    if (config) {
      this.lunar = config.lunar || 'sensor.lunar_calendar';
      this.theme = config.theme || 'system';
      this.width = config.width || '100%';
      this.height = config.height || '120px';
    }
  }

  constructor() {
    super();
    this.lunar = 'sensor.lunar_calendar';
    this.theme = 'system';
    this.width = '100%'; 
    this.height = '120px';
  }

  static get styles() {
    return css`
      :host {
        display: block;
      }
      .calendar {
        display: grid;
        grid-template-areas: 
          "a1"
          "b1";
        grid-template-columns: 100%;
        grid-template-rows: 15% 85%;
        gap: 1px;
        padding: 2px;
        border-radius: 10px;
        margin-bottom: -3px;
        place-items: center; 
      }
      .label{
        color: rgb(0,220,0); 
        font-weight: bold;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 16px;
        margin-top: 10px;
      }
      .state {
        word-wrap: break-word;
        display: flex;
        align-items: center;
        justify-content: center;
        line-height: 16px;
        padding: 0 5px 0 5px;
      }
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

  _calculateFontSize(length) {
    if (length <= 70) return '13px';
    if (length <= 100) return '12px';
    if (length <= 130) return '11px';
    return '10px';
  }

  render() {
    if (!this.hass || !this.hass.states[this.lunar] || !this.hass.states[this.lunar].attributes) {
      return html`<div export class="calendar">加载中...</div>`;
    }
    const theme = this._evaluateTheme();
    const bgColor = theme === 'light' ? 'rgb(255, 255, 255)' : 'rgb(50, 50, 50)';
    const fgColor = theme === 'light' ? 'rgb(0, 0, 0)' : 'rgb(255, 255, 255)';
    const style = `
      background: ${bgColor};
      color: ${fgColor};
      width: ${this.width};
      height: ${this.height};
    `;
    const lunarData = this.hass.states[this.lunar].attributes.老黄历信息;
    const label1 = lunarData.吉神;
    const label2 = lunarData.凶煞;
    const maxLength = Math.max(
      label1 ? label1.length : 0,
      label2 ? label2.length : 0
    );
    const commonFontSize = this._calculateFontSize(maxLength);
    return html` 
      <div export class="calendar"\n style="${style}">
        <div export class="label"\n style="grid-area: a1;">吉神宜趋</div>
        <div export class="state"\n style="grid-area: b1; font-size: ${commonFontSize}">${label1}</div>
      </div>
    `;
  }
} 
customElements.define('xiaoshi-lunar-calendar-left4', LunarCalendarLeft4); 

class LunarCalendarRight4 extends LitElement {
  static get properties() {
    return {
      hass: { type: Object },
      lunar: { type: String },
      theme: { type: String },
      width: { type: String },
      height: { type: String }
    };
  }

  setConfig(config) {
    this.config = config;
    if (config) {
      this.lunar = config.lunar || 'sensor.lunar_calendar';
      this.theme = config.theme || 'system';
      this.width = config.width || '100%';
      this.height = config.height || '120px';
    }
  }

  constructor() {
    super();
    this.lunar = 'sensor.lunar_calendar';
    this.theme = 'system';
    this.width = '100%'; 
    this.height = '120px';
  }

  static get styles() { 
    return css`
      :host {
        display: block;
      }
      .calendar {
        display: grid;
        grid-template-areas: 
          "a1"
          "b1";
        grid-template-columns: 100%;
        grid-template-rows: 15% 85%; 
        gap: 1px;
        padding: 2px;
        border-radius: 10px;
        margin-bottom: -3px; 
        place-items: center; 
      }
      .label{
        color: rgb(200,20,0);
        font-weight: bold;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 16px;
        margin-top: 10px;
      }
      .state {
        word-wrap: break-word;
        display: flex;
        align-items: center;
        justify-content: center;
        line-height: 16px;
        padding: 0 5px 0 5px;
      }
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

  _calculateFontSize(length) {
    if (length <= 70) return '13px'; 
    if (length <= 100) return '12px';
    if (length <= 130) return '11px';
    return '10px';
  }

  render() {
    if (!this.hass || !this.hass.states[this.lunar] || !this.hass.states[this.lunar].attributes) {
      return html`<div export class="calendar">加载中...</div>`;
    }
    const theme = this._evaluateTheme();
    const bgColor = theme === 'light' ? 'rgb(255, 255, 255)' : 'rgb(50, 50, 50)';
    const fgColor = theme === 'light' ? 'rgb(0, 0, 0)' : 'rgb(255, 255, 255)';
    const style = `
      background: ${bgColor};
      color: ${fgColor};
      width: ${this.width};
      height: ${this.height};
    `;
    const lunarData = this.hass.states[this.lunar].attributes.老黄历信息;
    const label1 = lunarData.吉神;
    const label2 = lunarData.凶煞;
    const maxLength = Math.max(
      label1 ? label1.length : 0,
      label2 ? label2.length : 0
    );
    const commonFontSize = this._calculateFontSize(maxLength);
    return html` 
      <div export class="calendar"\n style="${style}">
        <div export class="label"\n style="grid-area: a1;">凶煞宜忌</div>
        <div export class="state"\n style="grid-area: b1; font-size: ${commonFontSize}">${label2}</div>
      </div>
    `;
  }
} 
customElements.define('xiaoshi-lunar-calendar-right4', LunarCalendarRight4); 

class LunarCalendarLeft5 extends LitElement {
  static get properties() {
    return {
      hass: { type: Object },
      lunar: { type: String },
      theme: { type: String },
      width: { type: String },
      height: { type: String }
    };
  }

  setConfig(config) {
    this.config = config;
    if (config) {
      this.lunar = config.lunar || 'sensor.lunar_calendar';
      this.theme = config.theme || 'system';
      this.width = config.width || '100%';
      this.height = config.height || '60px';
    }
  }

  constructor() {
    super();
    this.lunar = 'sensor.lunar_calendar';
    this.theme = 'system';
    this.width = '100%'; 
    this.height = '60px';
  }

  static get styles() {
    return css`
      :host {
        display: block;
      }
      .calendar {
        display: grid;
        grid-template-areas: 
          "a1 a2"
          "b1 b2";
        grid-template-columns: 27% 73%;
        grid-template-rows: repeat(2, 1fr);
        gap: 1px;
        padding: 2px;
        border-radius: 10px;
        margin-bottom: -3px;
      }
      .label{
        color: rgb(250,50,10);
        font-weight: bold;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 13px;
      }
      .state {
        word-wrap: break-word;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 13px;
        line-height: 13px;
      }
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

  render() {
    if (!this.hass || !this.hass.states[this.lunar] || !this.hass.states[this.lunar].attributes) {
      return html`<div export class="calendar">加载中...</div>`;
    }
    const theme = this._evaluateTheme();
    const bgColor = theme === 'light' ? 'rgb(255, 255, 255)' : 'rgb(50, 50, 50)';
    const fgColor = theme === 'light' ? 'rgb(0, 0, 0)' : 'rgb(255, 255, 255)';
    const style = `
      background: ${bgColor};
      color: ${fgColor};
      width: ${this.width};
      height: ${this.height};
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
} 
customElements.define('xiaoshi-lunar-calendar-left5', LunarCalendarLeft5);

class LunarCalendarRight5 extends LitElement {
  static get properties() {
    return {
      hass: { type: Object },
      lunar: { type: String },
      theme: { type: String },
      width: { type: String },
      height: { type: String }
    };
  }

  setConfig(config) {
    this.config = config;
    if (config) {
      this.lunar = config.lunar || 'sensor.lunar_calendar';
      this.theme = config.theme || 'system';
      this.width = config.width || '100%';
      this.height = config.height || '60px';
    }
  }

  constructor() {
    super();
    this.lunar = 'sensor.lunar_calendar';
    this.theme = 'system';
    this.width = '100%'; 
    this.height = '60px';
  }

  static get styles() {
    return css`
      :host {
        display: block;
      }
      .calendar {
        display: grid;
        grid-template-areas: 
          "a1 a2"
          "b1 b2";
        grid-template-columns: 38% 62%;
        grid-template-rows: repeat(2, 1fr);
        gap: 1px;
        padding: 2px;
        border-radius: 10px;
        margin-bottom: -3px;
      }
      .label{
        color: rgb(250,50,10);
        font-weight: bold;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 13px;
      }
      .state {
        word-wrap: break-word;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 13px;
        line-height: 13px;
      }
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

  render() {
    if (!this.hass || !this.hass.states[this.lunar] || !this.hass.states[this.lunar].attributes) {
      return html`<div export class="calendar">加载中...</div>`;
    }
    const theme = this._evaluateTheme();
    const bgColor = theme === 'light' ? 'rgb(255, 255, 255)' : 'rgb(50, 50, 50)';
    const fgColor = theme === 'light' ? 'rgb(0, 0, 0)' : 'rgb(255, 255, 255)';
    const style = `
      background: ${bgColor};
      color: ${fgColor};
      width: ${this.width};
      height: ${this.height};
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
} 
customElements.define('xiaoshi-lunar-calendar-right5', LunarCalendarRight5);

class LunarCalendarLeft6 extends LitElement {
  static get properties() {
    return {
      hass: { type: Object },
      lunar: { type: String },
      theme: { type: String },
      width: { type: String },
      height: { type: String }
    };
  }

  setConfig(config) {
    this.config = config;
    if (config) {
      this.lunar = config.lunar || 'sensor.lunar_calendar';
      this.theme = config.theme || 'system';
      this.width = config.width || '100%';
      this.height = config.height || '60px';
    }
  }

  constructor() {
    super();
    this.lunar = 'sensor.lunar_calendar';
    this.theme = 'system';
    this.width = '100%'; 
    this.height = '60px';
  }

  static get styles() {
    return css`
      :host {
        display: block;
      }
      .calendar {
        display: grid;
        grid-template-areas: 
          "a1 a2"
          "b1 b2";
        grid-template-columns: 27% 73%;
        grid-template-rows: repeat(2, 1fr);
        gap: 1px;
        padding: 2px;
        border-radius: 10px;
        margin-bottom: -3px;
      }
      .label{
        color: rgb(250,50,10);
        font-weight: bold;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 13px;
      }
      .state {
        word-wrap: break-word;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 13px;
        line-height: 13px;
        white-space: nowrap;
        overflow: visible;
      }
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

  render() {
    if (!this.hass || !this.hass.states[this.lunar] || !this.hass.states[this.lunar].attributes) {
      return html`<div export class="calendar">加载中...</div>`;
    }
    const theme = this._evaluateTheme();
    const bgColor = theme === 'light' ? 'rgb(255, 255, 255)' : 'rgb(50, 50, 50)';
    const fgColor = theme === 'light' ? 'rgb(0, 0, 0)' : 'rgb(255, 255, 255)';
    const style = `
      background: ${bgColor};
      color: ${fgColor};
      width: ${this.width};
      height: ${this.height};
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
} 
customElements.define('xiaoshi-lunar-calendar-left6', LunarCalendarLeft6);

class LunarCalendarRight6 extends LitElement {
  static get properties() {
    return {
      hass: { type: Object },
      lunar: { type: String },
      theme: { type: String },
      width: { type: String },
      height: { type: String }
    };
  }

  setConfig(config) {
    this.config = config;
    if (config) {
      this.lunar = config.lunar || 'sensor.lunar_calendar';
      this.theme = config.theme || 'system';
      this.width = config.width || '100%';
      this.height = config.height || '60px';
    }
  }

  constructor() {
    super();
    this.lunar = 'sensor.lunar_calendar';
    this.theme = 'system';
    this.width = '100%'; 
    this.height = '60px';
  }

  static get styles() {
    return css`
      :host {
        display: block;
      }
      .calendar {
        display: grid;
        grid-template-areas: 
          "a1 a2"
          "b1 b2";
        grid-template-columns: 27% 73%;
        grid-template-rows: repeat(2, 1fr);
        gap: 1px;
        padding: 2px;
        border-radius: 10px;
        margin-bottom: -3px;
      }
      .label{
        color: rgb(250,50,10);
        font-weight: bold;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 13px;
      }
      .state {
        word-wrap: break-word;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 13px;
        line-height: 13px;
      }
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

  render() {
    if (!this.hass || !this.hass.states[this.lunar] || !this.hass.states[this.lunar].attributes) {
      return html`<div export class="calendar">加载中...</div>`;
    }
    const theme = this._evaluateTheme();
    const bgColor = theme === 'light' ? 'rgb(255, 255, 255)' : 'rgb(50, 50, 50)';
    const fgColor = theme === 'light' ? 'rgb(0, 0, 0)' : 'rgb(255, 255, 255)';
    const style = `
      background: ${bgColor};
      color: ${fgColor};
      width: ${this.width};
      height: ${this.height};
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
} 
customElements.define('xiaoshi-lunar-calendar-right6', LunarCalendarRight6);
