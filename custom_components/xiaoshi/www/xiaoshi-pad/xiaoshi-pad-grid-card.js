import { LitElement, html, css } from "https://unpkg.com/lit-element@2.4.0/lit-element.js?module";

class XiaoshiPadGridCard extends LitElement {
  static get properties() {
    return {
      hass: Object,
      config: Object,
    };
  }

  static get styles() {
    return css`
      .container {
        position: relative;
        display: block;
        overflow: hidden;
      }
      .grid-item {
        position: absolute;
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        box-sizing: border-box;
        border: 0;
        cursor: pointer;
      }
    `;
  }

  setConfig(config) {
    if (!config.entities) {
      throw new Error('You need to define entities');
    }
    this.config = {
      width: config.width || '400px',
      height: config.height || '80px',
      min: config.min || 0,
      max: config.max || 100,
      mode: config.mode || '温度',
      display: config.display || false,
      entities: config.entities.map(entity => ({
        ...entity,
        state: entity.state !== false,
      })),
    };
  }

  render() {
    if(this._display()) return;
    return html`
      <div class="container"\n
        style="width: ${this.config.width}; height: ${this.config.height};">
        ${this.config.entities.map((entityConfig) => {
          const entity = this.hass.states[entityConfig.entity];
          if (!entity) return html``;      
          const value = parseFloat(entity.state);
          const grid = entityConfig.grid ? entityConfig.grid.split(',') : ['0%', '0%', '100%', '100%'];
          const unit = entityConfig.unit || '';
          let filter;
          if (this.config.mode === '温度') {
            filter = this._calculateTemperatureFilter(value);
          } else if (this.config.mode === '湿度') {
            filter = this._calculateHumidityFilter(value);
          };
          let size = Number(grid[2].slice(0, grid[2].length-1));
          let fsize ="11px";
          if (size<25 )  fsize ="10px";
          if (size<20 )  fsize ="9px";
          if (size<15 )  fsize ="8px";
          return html`
            <div 
              class="grid-item"\n
              style="left: ${grid[0]};top: ${grid[1]};width: ${grid[2]};height: ${grid[3]};background-color: rgba(0, 200, 0, 0.8);filter: ${filter};font-size: ${fsize};">
              ${entityConfig.state !== false ? html`${entity.state}${unit}` : ''}
            </div>
          `;
        })}
      </div> 
    `;
  }

  _display() {
    try {
      if (this.config.display === undefined) return false;
      if (typeof this.config.display === 'boolean') {
        return this.config.display;
      };
      if (typeof this.config.display === 'function') {
        const result = this.config.display();
        return result === true || result === "true"; // 同时接受 true 和 "true"
      };
      if (typeof this.config.display === 'string') {
        const displayStr = this.config.display.trim();
        if (displayStr.startsWith('[[[') && displayStr.endsWith(']]]')) {
          const funcBody = displayStr.slice(3, -3).trim();
          const result = new Function('states', funcBody)(this.hass.states);
          return result === true || result === "true"; // 同时接受 true 和 "true"
        }
        if (displayStr.includes('return') || displayStr.includes('=>')) {
          const result = (new Function(`return ${displayStr}`))();
          return result === true || result === "true";
        }
        const result = (new Function(`return ${displayStr}`))();
        return result === true || result === "true";
      };
      return false;
    } catch(e) {
      console.error('显示出错:', e);
      return false;
    }
  }

  _calculateTemperatureFilter(temp) {
    temp = parseFloat(temp);
    const { min, max } = this.config;
    let deg;
    if (temp > 25) {
      deg = (25 - temp) * 120 / (max - 25);
    } else {
      deg = (25 - temp) * 100 / (25 - min);
    };
    return `hue-rotate(${deg}deg)`;
  }
   
  _calculateHumidityFilter(hum) {
    hum = parseFloat(hum);
    const { min, max } = this.config;
    let deg;
    if (hum > 50) {
      deg = (50 - hum) * 100 / (50 - max);
    } else {
      deg = (50 - hum) * 120 / (min - 50);
    };
    return `hue-rotate(${deg}deg)`;
  }

  getCardSize() {
    return 1;
  }
}
customElements.define('xiaoshi-pad-grid-card', XiaoshiPadGridCard);
